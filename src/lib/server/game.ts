/* Le jeu côté serveur : ouvrir un booster payé, mettre en vente, acheter.

   Les clés :
     card:<uid>          la carte (JSON)              cards:<wallet>   ses cartes (set)
     serial:<t>:<r>      le dernier numéro imprimé     market           les cartes en vente (set)
     listing:<uid>       l'annonce de la carte (JSON) lock:<uid>       l'acheteur en train de payer
     pay:<signature>     un paiement déjà compté       sold:<listing>   l'annonce déjà vendue
     sales               les dernières ventes (liste)  refunds          les paiements à rembourser
     refunded:<sig>      le remboursement de ce paiement (sa signature) */

import { randomBytes, randomInt } from "node:crypto";
import { PACKS, RARITIES, type RarityId, drawRarity, packTraders, rank, rarity } from "../data";
import { FEE_BPS, MAX_PRICE, MEMO, MIN_PRICE, feeOf, toLamports } from "../solana";
import { TREASURY } from "./config";
import type { Listing, Offer, Owned, Refund, Sale } from "../types";
import { paid, readPayment, spent } from "./chain";
import { Oops } from "./errors";
import { type Cmd, getJson, getMany, kvReady, multi, run } from "./kv";

const LOCK_S = 150; // le temps de payer une carte réservée
const rand = () => randomInt(0, 2 ** 32) / 2 ** 32;
const uid = () => randomBytes(9).toString("base64url");

type Paid = { wallet: string; kind: "pack" | "buy"; uids?: string[]; done?: boolean; refund?: string };


function ready() {
  if (!TREASURY) throw new Oops(503, "Payments are not open yet (cm cards wallet not configured).");
  if (!kvReady()) throw new Oops(503, "Payments are not open yet (storage not configured).");
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
  throw new Oops(410, "This booster is sold out.");
}

export async function openPack(wallet: string, packId: string, sig: string): Promise<Owned[]> {
  ready();
  const p = PACKS.find((x) => x.id === packId);
  const pool = p ? packTraders(p).map((t) => t.id) : [];
  if (!p || !pool.length) throw new Oops(404, "This booster does not exist.");

  const again = await already(sig, wallet, "pack");
  if (again) return again;

  const pay = await readPayment(sig);
  if (pay.signer !== wallet) throw new Oops(403, "This payment is not signed by your wallet.");
  if (!pay.memos.includes(MEMO.pack(p.id))) throw new Oops(400, "This payment is not for this booster.");
  if (paid(pay, wallet, TREASURY) < toLamports(p.price)) throw new Oops(402, "The amount paid does not cover the booster.");

  if (!(await claim(sig, { wallet, kind: "pack" }))) {
    const done = await already(sig, wallet, "pack");
    if (done) return done;
    throw new Oops(409, "This payment is already being processed.");
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
  if (p.wallet !== wallet || p.kind !== kind) throw new Oops(409, "This payment has already been used.");
  if (p.refund) throw new Oops(409, `${p.refund} Your payment will be refunded.`);
  if (!p.done) throw new Oops(409, "This payment is already being processed.");
  const cards = await getMany<Owned>((p.uids ?? []).map((u) => `card:${u}`));
  return cards.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}

const claim = async (sig: string, p: Paid) => (await run(["SET", `pay:${sig}`, JSON.stringify(p), "NX"])) === "OK";

/* ——— vendre ——— */

async function ownCard(wallet: string, u: string) {
  const c = typeof u === "string" ? await getJson<Owned>(`card:${u}`) : null;
  if (!c || c.owner !== wallet) throw new Oops(404, "This card is not yours.");
  return c;
}

export async function list(wallet: string, u: string, sol: number): Promise<Listing> {
  if (!kvReady()) ready();
  const c = await ownCard(wallet, u);
  if (!Number.isFinite(sol) || sol < MIN_PRICE || sol > MAX_PRICE)
    throw new Oops(400, `Price must be between ${MIN_PRICE} and ${MAX_PRICE.toLocaleString("en-US")} SOL.`);
  const lock = await run<string | null>(["GET", `lock:${c.uid}`]);
  if (lock) throw new Oops(409, "A buyer is paying for this card right now.");
  const l: Listing = { id: uid(), uid: c.uid, seller: wallet, lamports: toLamports(sol), at: Date.now() };
  await multi([["SET", `listing:${c.uid}`, JSON.stringify(l)], ["SADD", "market", c.uid]]);
  return l;
}

export async function unlist(wallet: string, u: string) {
  const c = await ownCard(wallet, u);
  const lock = await run<string | null>(["GET", `lock:${c.uid}`]);
  if (lock && lock !== wallet) throw new Oops(409, "A buyer is paying right now: try again in two minutes.");
  await multi([["DEL", `listing:${c.uid}`], ["SREM", "market", c.uid]]);
}

/* ——— acheter ——— */

/* Réserve la carte le temps de payer : personne d'autre ne peut la payer, le vendeur
   ne peut pas changer son prix. */
export async function reserve(wallet: string, u: string): Promise<Listing> {
  ready();
  const l = typeof u === "string" ? await getJson<Listing>(`listing:${u}`) : null;
  if (!l) throw new Oops(404, "This card is no longer for sale.");
  if (l.seller === wallet) throw new Oops(400, "This is your card.");
  const ok = await run(["SET", `lock:${u}`, wallet, "NX", "EX", LOCK_S]);
  if (ok !== "OK" && (await run<string | null>(["GET", `lock:${u}`])) !== wallet)
    throw new Oops(409, "Someone is buying it right now. Try again in two minutes.");
  return l;
}

export async function buy(wallet: string, u: string, listingId: string, sig: string): Promise<Owned> {
  ready();
  const again = await already(sig, wallet, "buy");
  if (again?.[0]) return again[0];

  const l = await getJson<Listing>(`listing:${u}`);
  const pay = await readPayment(sig);
  if (pay.signer !== wallet) throw new Oops(403, "This payment is not signed by your wallet.");
  if (!pay.memos.includes(MEMO.buy(listingId))) throw new Oops(400, "This payment is not for this listing.");

  if (!(await claim(sig, { wallet, kind: "buy" }))) {
    const done = await already(sig, wallet, "buy");
    if (done?.[0]) return done[0];
    throw new Oops(409, "This payment is already being processed.");
  }

  // payé, mais l'annonce a changé ou une autre vente l'a prise : à rembourser
  const refund = async (why: string) => {
    const r: Refund = { sig, wallet, listing: listingId, uid: u, why, at: Date.now(), lamports: spent(pay, wallet), seller: l?.seller };
    await multi([
      ["LPUSH", "refunds", JSON.stringify(r)],
      ["SET", `pay:${sig}`, JSON.stringify({ wallet, kind: "buy", refund: why } satisfies Paid)],
    ]);
    throw new Oops(409, `${why} Your payment will be refunded.`);
  };
  if (!l || l.id !== listingId) return refund("This listing no longer exists.");
  if (paid(pay, wallet, l.seller) < l.lamports) return refund("The amount paid to the seller does not cover the price.");
  if (FEE_BPS && paid(pay, wallet, TREASURY) < feeOf(l.lamports)) return refund("The fee was not paid.");
  if ((await run(["SET", `sold:${l.id}`, wallet, "NX"])) !== "OK") return refund("This card was just sold.");

  const card = await getJson<Owned>(`card:${u}`);
  if (!card || card.owner !== l.seller) return refund("The seller no longer owns this card.");
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

/* ——— rembourser (le wallet de cm cards seulement) ——— */

export function needAdmin(wallet: string) {
  if (!TREASURY || wallet !== TREASURY) throw new Oops(403, "Connect the cm cards wallet.");
}

export async function refunds(): Promise<Refund[]> {
  const list = (await run<string[]>(["LRANGE", "refunds", 0, -1])).map((r) => JSON.parse(r) as Refund);
  if (!list.length) return [];
  const done = await run<(string | null)[]>(["MGET", ...list.map((r) => `refunded:${r.sig}`)]);
  return Promise.all(list.map(async (r, i) => ({
    ...r,
    // les plus anciennes n'avaient pas noté le montant : on le relit sur la chaîne
    lamports: r.lamports ?? spent(await readPayment(r.sig, Infinity), r.wallet),
    done: done[i] ?? undefined,
  })));
}

/* Le remboursement est fait depuis le wallet de cm cards : le serveur le lit sur la
   chaîne (bon wallet, bon montant, mémo du paiement remboursé) et le note. */
export async function markRefunded(sig: string, refundSig: string): Promise<Refund> {
  const r = (await refunds()).find((x) => x.sig === sig);
  if (!r) throw new Oops(404, "Unknown refund.");
  if (r.done) throw new Oops(409, "Already refunded.");
  const pay = await readPayment(refundSig);
  if (pay.signer !== TREASURY) throw new Oops(403, "This refund is not signed by the cm cards wallet.");
  if (!pay.memos.includes(MEMO.refund(sig))) throw new Oops(400, "This transaction is not the refund of this payment.");
  if (paid(pay, TREASURY, r.wallet) < r.lamports) throw new Oops(402, "The amount sent does not cover the refund.");
  if ((await run(["SET", `refunded:${sig}`, refundSig, "NX"])) !== "OK") throw new Oops(409, "Already refunded.");
  return { ...r, done: refundSig };
}
