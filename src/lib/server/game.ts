/* Le jeu côté serveur : ouvrir un booster payé, mettre en vente, acheter.

   Les clés :
     card:<uid>          la carte (JSON)              cards:<wallet>   ses cartes (set)
     serial:<t>:<r>      le dernier numéro imprimé     market           les cartes en vente (set)
     listing:<uid>       l'annonce de la carte (JSON) lock:<uid>       l'acheteur en train de payer
     pay:<signature>     un paiement déjà compté       sold:<listing>   l'annonce déjà vendue
     sales               les dernières ventes (liste)  refunds          les paiements à rembourser */

import { randomBytes, randomInt } from "node:crypto";
import { PACKS, RARITIES, type RarityId, drawRarity, packTraders, rank, rarity } from "../data";
import { FEE_BPS, MAX_PRICE, MEMO, MIN_PRICE, feeOf, toLamports } from "../solana";
import { TREASURY } from "./config";
import type { Listing, Offer, Owned, Sale } from "../types";
import { paid, readPayment } from "./chain";
import { Oops } from "./errors";
import { type Cmd, getJson, getMany, kvReady, multi, run } from "./kv";

const LOCK_S = 150; // le temps de payer une carte réservée
const rand = () => randomInt(0, 2 ** 32) / 2 ** 32;
const uid = () => randomBytes(9).toString("base64url");

type Paid = { wallet: string; kind: "pack" | "buy"; uids?: string[]; done?: boolean };

function ready() {
  if (!TREASURY) throw new Oops(503, "Les paiements ne sont pas encore ouverts (wallet de cm cards non configuré).");
  if (!kvReady()) throw new Oops(503, "Les paiements ne sont pas encore ouverts (stockage non configuré).");
}

/* ——— lire ——— */

export async function cardsOf(wallet: string): Promise<Owned[]> {
  const uids = await run<string[]>(["SMEMBERS", `cards:${wallet}`]);
  return getMany<Owned>(uids.map((u) => `card:${u}`));
}

export async function market(): Promise<{ offers: Offer[]; sales: Sale[] }> {
  const uids = await run<string[]>(["SMEMBERS", "market"]);
  const listings = await getMany<Listing>(uids.map((u) => `listing:${u}`));
  const cards = new Map((await getMany<Owned>(listings.map((l) => `card:${l.uid}`))).map((c) => [c.uid, c]));
  const offers = listings.flatMap((l) => { const card = cards.get(l.uid); return card ? [{ ...l, card }] : []; });
  return { offers, sales: await recentSales(60) };
}

export async function recentSales(n: number): Promise<Sale[]> {
  const raw = await run<string[]>(["LRANGE", "sales", 0, n - 1]);
  return raw.map((r) => JSON.parse(r) as Sale);
}

export async function listingsOf(wallet: string): Promise<Listing[]> {
  const mine = await cardsOf(wallet);
  return getMany<Listing>(mine.map((c) => `listing:${c.uid}`));
}

/* ——— ouvrir un booster ——— */

/* Une carte de ce booster : la rareté tirée, un personnage au hasard, et un numéro
   pris dans le stock. Un stock épuisé (une Mythic déjà sortie) passe au personnage
   suivant, puis à la rareté voisine : jamais plus d'exemplaires que prévu. */
async function mint(pool: string[], r0: RarityId, floor: RarityId): Promise<{ trader: string; rarity: RarityId; serial: number }> {
  const down = RARITIES.filter((r) => rank(r.id) < rank(r0) && rank(r.id) >= rank(floor)).reverse();
  const up = RARITIES.filter((r) => rank(r.id) > rank(r0));
  for (const r of [rarity(r0), ...down, ...up]) {
    const who = [...pool].sort(() => rand() - 0.5);
    for (const t of who) {
      const serial = await run<number>(["INCR", `serial:${t}:${r.id}`]);
      if (serial <= r.supply) return { trader: t, rarity: r.id, serial };
    }
  }
  throw new Oops(410, "Ce booster est épuisé.");
}

export async function openPack(wallet: string, packId: string, sig: string): Promise<Owned[]> {
  ready();
  const p = PACKS.find((x) => x.id === packId);
  const pool = p ? packTraders(p).map((t) => t.id) : [];
  if (!p || !pool.length) throw new Oops(404, "Ce booster n'existe pas.");

  const again = await already(sig, wallet, "pack");
  if (again) return again;

  const pay = await readPayment(sig);
  if (pay.signer !== wallet) throw new Oops(403, "Ce paiement n'est pas signé par ton wallet.");
  if (!pay.memos.includes(MEMO.pack(p.id))) throw new Oops(400, "Ce paiement n'est pas celui de ce booster.");
  if (paid(pay, wallet, TREASURY) < toLamports(p.price)) throw new Oops(402, "Le montant payé ne couvre pas le booster.");

  if (!(await claim(sig, { wallet, kind: "pack" }))) {
    const done = await already(sig, wallet, "pack");
    if (done) return done;
    throw new Oops(409, "Ce paiement est déjà en cours de traitement.");
  }

  const at = Date.now();
  const cards: Owned[] = [];
  for (let i = 0; i < p.cards; i++) {
    const floor = i === p.cards - 1 && p.guarantee ? p.guarantee : "common";
    const m = await mint(pool, drawRarity(rand(), p.boost ?? 1, floor), floor);
    const u = uid();
    cards.push({ id: `${m.trader}-${m.rarity}-${m.serial}`, uid: u, ...m, owner: wallet, pack: p.id, at });
  }
  await multi([
    ...cards.map((c): Cmd => ["SET", `card:${c.uid}`, JSON.stringify(c)]),
    ["SADD", `cards:${wallet}`, ...cards.map((c) => c.uid)],
    ["SET", `pay:${sig}`, JSON.stringify({ wallet, kind: "pack", uids: cards.map((c) => c.uid), done: true } satisfies Paid)],
  ]);
  return cards.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}

/* Un paiement déjà compté pour ce wallet : on rend ce qu'il a acheté (le navigateur
   peut redemander après une coupure). */
async function already(sig: string, wallet: string, kind: Paid["kind"]): Promise<Owned[] | null> {
  const p = await getJson<Paid>(`pay:${sig}`);
  if (!p) return null;
  if (p.wallet !== wallet || p.kind !== kind) throw new Oops(409, "Ce paiement a déjà servi.");
  if (!p.done) throw new Oops(409, "Ce paiement est déjà en cours de traitement.");
  const cards = await getMany<Owned>((p.uids ?? []).map((u) => `card:${u}`));
  return cards.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}

const claim = async (sig: string, p: Paid) => (await run(["SET", `pay:${sig}`, JSON.stringify(p), "NX"])) === "OK";

/* ——— vendre ——— */

async function ownCard(wallet: string, u: string) {
  const c = typeof u === "string" ? await getJson<Owned>(`card:${u}`) : null;
  if (!c || c.owner !== wallet) throw new Oops(404, "Cette carte n'est pas à toi.");
  return c;
}

export async function list(wallet: string, u: string, sol: number): Promise<Listing> {
  if (!kvReady()) ready();
  const c = await ownCard(wallet, u);
  if (!Number.isFinite(sol) || sol < MIN_PRICE || sol > MAX_PRICE)
    throw new Oops(400, `Prix entre ${MIN_PRICE} et ${MAX_PRICE.toLocaleString("fr-FR")} SOL.`);
  const lock = await run<string | null>(["GET", `lock:${c.uid}`]);
  if (lock) throw new Oops(409, "Un acheteur est en train de payer cette carte.");
  const l: Listing = { id: uid(), uid: c.uid, seller: wallet, lamports: toLamports(sol), at: Date.now() };
  await multi([["SET", `listing:${c.uid}`, JSON.stringify(l)], ["SADD", "market", c.uid]]);
  return l;
}

export async function unlist(wallet: string, u: string) {
  const c = await ownCard(wallet, u);
  const lock = await run<string | null>(["GET", `lock:${c.uid}`]);
  if (lock && lock !== wallet) throw new Oops(409, "Un acheteur est en train de payer : réessaie dans deux minutes.");
  await multi([["DEL", `listing:${c.uid}`], ["SREM", "market", c.uid]]);
}

/* ——— acheter ——— */

/* Réserve la carte le temps de payer : personne d'autre ne peut la payer, le vendeur
   ne peut pas changer son prix. */
export async function reserve(wallet: string, u: string): Promise<Listing> {
  ready();
  const l = typeof u === "string" ? await getJson<Listing>(`listing:${u}`) : null;
  if (!l) throw new Oops(404, "Cette carte n'est plus en vente.");
  if (l.seller === wallet) throw new Oops(400, "C'est ta carte.");
  const ok = await run(["SET", `lock:${u}`, wallet, "NX", "EX", LOCK_S]);
  if (ok !== "OK" && (await run<string | null>(["GET", `lock:${u}`])) !== wallet)
    throw new Oops(409, "Quelqu'un est en train de l'acheter. Réessaie dans deux minutes.");
  return l;
}

export async function buy(wallet: string, u: string, listingId: string, sig: string): Promise<Owned> {
  ready();
  const again = await already(sig, wallet, "buy");
  if (again?.[0]) return again[0];

  const l = await getJson<Listing>(`listing:${u}`);
  const pay = await readPayment(sig);
  if (pay.signer !== wallet) throw new Oops(403, "Ce paiement n'est pas signé par ton wallet.");
  if (!pay.memos.includes(MEMO.buy(listingId))) throw new Oops(400, "Ce paiement n'est pas celui de cette annonce.");

  if (!(await claim(sig, { wallet, kind: "buy" }))) {
    const done = await already(sig, wallet, "buy");
    if (done?.[0]) return done[0];
    throw new Oops(409, "Ce paiement est déjà en cours de traitement.");
  }

  // payé, mais l'annonce a changé ou une autre vente l'a prise : à rembourser
  const refund = async (why: string) => {
    await run(["LPUSH", "refunds", JSON.stringify({ sig, wallet, listing: listingId, uid: u, why, at: Date.now() })]);
    throw new Oops(409, `${why} Ton paiement sera remboursé.`);
  };
  if (!l || l.id !== listingId) return refund("Cette annonce n'existe plus.");
  if (paid(pay, wallet, l.seller) < l.lamports) return refund("Le montant payé au vendeur ne couvre pas le prix.");
  if (FEE_BPS && paid(pay, wallet, TREASURY) < feeOf(l.lamports)) return refund("Les frais ne sont pas payés.");
  if ((await run(["SET", `sold:${l.id}`, wallet, "NX"])) !== "OK") return refund("Cette carte vient d'être vendue.");

  const card = await getJson<Owned>(`card:${u}`);
  if (!card || card.owner !== l.seller) return refund("Cette carte n'est plus au vendeur.");
  const moved: Owned = { ...card, owner: wallet };
  const sale: Sale = {
    uid: u, trader: card.trader, rarity: card.rarity, serial: card.serial,
    seller: l.seller, buyer: wallet, lamports: l.lamports, sig, at: Date.now(),
  };
  await multi([
    ["SET", `card:${u}`, JSON.stringify(moved)],
    ["SREM", `cards:${l.seller}`, u],
    ["SADD", `cards:${wallet}`, u],
    ["DEL", `listing:${u}`, `lock:${u}`],
    ["SREM", "market", u],
    ["LPUSH", "sales", JSON.stringify(sale)],
    ["LTRIM", "sales", 0, 499],
    ["SET", `pay:${sig}`, JSON.stringify({ wallet, kind: "buy", uids: [u], done: true } satisfies Paid)],
  ]);
  return moved;
}
