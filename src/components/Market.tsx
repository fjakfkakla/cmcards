"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./collection.css";
import CollectCard from "./CollectCard";
import Icon from "./Icon";
import { Ago, CategoryTag, Empty, Filter, Modal, PageHead, RarityTag, Stats } from "./ui";
import { api, useAccount } from "@/lib/account";
import { CATEGORIES, RARITIES, TRADERS, type CategoryId, type RarityId, fmtSol, rank, rarity, serialOf, trader } from "@/lib/data";
import { FEE_BPS, MEMO, TREASURY, explorer, feeOf, short, toSol } from "@/lib/solana";
import type { Listing, Offer, Sale } from "@/lib/types";

type Sort = "cheap" | "dear" | "recent" | "rare";
const ORDER: Record<Sort, (a: Offer, b: Offer) => number> = {
  cheap: (a, b) => a.lamports - b.lamports,
  dear: (a, b) => b.lamports - a.lamports,
  recent: (a, b) => b.at - a.at,
  rare: (a, b) => rank(b.card.rarity) - rank(a.card.rarity) || a.lamports - b.lamports,
};
const CATS = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id));

/* Le marché : les cartes que les joueurs vendent, chacune à son prix. L'acheteur
   paie le vendeur directement, plus 1 % à cm cards ; la carte change de main dès
   que le serveur a lu le paiement. */
export default function Market() {
  const { wallet } = useAccount();
  const [data, setData] = useState<{ offers: Offer[]; sales: Sale[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [rar, setRar] = useState<RarityId | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("cheap");
  const [buying, setBuying] = useState<Offer | null>(null);

  const load = useCallback(async () => {
    try { setData(await api("/api/market")); setFailed(false); } catch { setFailed(true); }
  }, []);
  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, 20_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  const offers = useMemo(() => data?.offers ?? [], [data]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return offers
      .filter((o) => (!cat || trader(o.card.trader).category === cat) && (!rar || o.card.rarity === rar)
        && (!s || trader(o.card.trader).name.toLowerCase().includes(s)))
      .sort(ORDER[sort]);
  }, [offers, cat, rar, q, sort]);

  const floor = offers.length ? Math.min(...offers.map((o) => o.lamports)) : null;
  const volume = (data?.sales ?? []).reduce((a, s) => a + s.lamports, 0);

  return (
    <>
      <PageHead title="Marché" sub={`Des cartes vendues par les joueurs, au prix qu'ils fixent. Tu paies le vendeur directement, plus ${FEE_BPS / 100} % de frais.`}>
        <div className="w-full sm:w-auto sm:min-w-[440px]">
          <Stats items={[
            ["En vente", data ? String(offers.length) : "…"],
            ["Plancher", data ? (floor !== null ? fmtSol(toSol(floor)) : "-") : "…"],
            ["Volume récent", data ? fmtSol(toSol(volume)) : "…"],
          ]} />
        </div>
      </PageHead>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full sm:w-64">
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-dim" />
            <input className="field h-10 pl-10 text-[14.5px]" placeholder="Chercher un trader" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier"
            className="chip ml-auto h-10 cursor-pointer appearance-none pr-4 text-fg outline-none">
            <option value="cheap">Prix croissant</option>
            <option value="dear">Prix décroissant</option>
            <option value="recent">Plus récentes</option>
            <option value="rare">Plus rares</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter on={!cat} onClick={() => setCat(null)}>Toutes</Filter>
          {CATS.map((c) => (
            <Filter key={c.id} on={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
              count={offers.filter((o) => trader(o.card.trader).category === c.id).length}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" style={{ color: c.bg }} aria-hidden="true"><path d={c.glyph} /></svg>
              {c.name}
            </Filter>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
          {RARITIES.map((r) => (
            <Filter key={r.id} on={rar === r.id} onClick={() => setRar(rar === r.id ? null : r.id)}
              count={offers.filter((o) => o.card.rarity === r.id).length}>
              <i className={`rar-${r.id} h-2.5 w-2.5 rounded-full`} />
              {r.name}
            </Filter>
          ))}
        </div>
      </div>

      {failed && !data ? (
        <p className="mt-12 text-center text-[15px] text-muted">Le marché ne répond pas. <button className="text-fg underline" onClick={load}>Réessayer</button></p>
      ) : !data ? (
        <div className="col-grid mt-8">
          {Array.from({ length: 8 }, (_, k) => <div key={k} className="aspect-[63/88] animate-pulse rounded-[14px] bg-white/[.04]" />)}
        </div>
      ) : offers.length === 0 ? (
        <Empty icon="market" title="Rien en vente pour l'instant" text="Ouvre un booster et mets tes cartes en vente : tu fixes le prix, tu reçois tout." href="/boosters" cta="Ouvrir un booster" />
      ) : list.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-[17px] font-semibold">Aucune carte avec ces filtres.</p>
          <button className="btn-ghost btn-sm mt-4" onClick={() => { setCat(null); setRar(null); setQ(""); }}>Tout afficher</button>
        </div>
      ) : (
        <div className="col-grid mt-8">
          {list.map((o) => {
            const mine = o.seller === wallet;
            return (
              <div key={o.id} className="flex flex-col">
                <button type="button" className="col-tile" onClick={() => setBuying(o)} aria-label={`${trader(o.card.trader).name}, ${rarity(o.card.rarity).name}`}>
                  <CollectCard card={o.card} />
                </button>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-display text-[19px] leading-tight font-bold tracking-[-.02em]">{trader(o.card.trader).name}</span>
                  <RarityTag id={o.card.rarity} />
                </div>
                <div className="num mt-0.5 text-[13px] text-dim">n° {serialOf(o.card)} · {short(o.seller)}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="num font-display text-[20px] font-bold tracking-[-.02em]">{fmtSol(toSol(o.lamports))}</span>
                  {mine
                    ? <Link href="/collection" className="btn-ghost btn-sm h-9 px-3.5">Ta carte</Link>
                    : <button className="btn-gold btn-sm h-9 px-4" onClick={() => setBuying(o)}>Acheter</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.sales.length > 0 && <Sales sales={data.sales} />}

      {buying && <Buy offer={buying} onClose={() => setBuying(null)} onDone={load} />}
    </>
  );
}

/* Les dernières ventes : ce qui s'est vraiment payé. */
function Sales({ sales }: { sales: Sale[] }) {
  return (
    <section className="mt-16">
      <h2 className="font-display text-[28px] font-extrabold tracking-[-.03em]">Dernières ventes</h2>
      <div className="surface mt-4 divide-y divide-white/[.06]">
        {sales.slice(0, 12).map((s) => (
          <div key={s.sig} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
            <i className={`rar-${s.rarity} h-2.5 w-2.5 shrink-0 rounded-full`} />
            <span className="min-w-0 truncate font-semibold">{trader(s.trader).name} <span className="text-muted">{rarity(s.rarity).name}</span></span>
            <span className="num hidden text-dim sm:inline">n° {serialOf({ id: "", trader: s.trader, rarity: s.rarity, serial: s.serial })}</span>
            <span className="num ml-auto font-semibold">{fmtSol(toSol(s.lamports))}</span>
            <a href={explorer(s.sig)} target="_blank" rel="noreferrer" className="w-24 text-right text-[13px] text-dim hover:text-muted"><Ago at={s.at} /></a>
          </div>
        ))}
      </div>
    </section>
  );
}

type Step = "idle" | "reserve" | "sign" | "transfer" | "done";

/* L'achat : le détail du prix, puis réserver, payer (un seul passage dans le wallet :
   le vendeur et les frais dans la même transaction), et le serveur passe la carte. */
function Buy({ offer, onClose, onDone }: { offer: Offer; onClose: () => void; onDone: () => void }) {
  const { wallet, balance, busy, signIn, pay, refresh } = useAccount();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const c = offer.card;
  const t = trader(c.trader);
  const fee = feeOf(offer.lamports);
  const total = offer.lamports + fee;
  const mine = offer.seller === wallet;
  const short_ = balance !== null && balance < total + 10_000;

  async function go() {
    setError(null);
    try {
      setStep("reserve");
      const { listing } = await api<{ listing: Listing }>("/api/market/reserve", { uid: offer.uid });
      if (listing.id !== offer.id || listing.lamports !== offer.lamports) {
        onDone();
        throw new Error("Le vendeur vient de changer son prix. Rouvre la carte pour voir le nouveau.");
      }
      setStep("sign");
      const s = await pay([{ to: listing.seller, lamports: listing.lamports }, { to: TREASURY, lamports: feeOf(listing.lamports) }], MEMO.buy(listing.id));
      setSig(s);
      setStep("transfer");
      await claim(s);
    } catch (e) {
      setStep("idle");
      setError(e instanceof Error ? e.message : "L'achat a échoué.");
    }
  }
  async function claim(s: string) {
    await api("/api/market/buy", { uid: offer.uid, listing: offer.id, signature: s });
    setStep("done");
    refresh(); onDone();
  }

  return (
    <Modal onClose={step === "sign" || step === "transfer" ? () => {} : onClose} label={`Acheter ${t.name}`}>
      <div className="col-sheet-card"><CollectCard card={c} live /></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {t.category && <CategoryTag id={t.category} />}
          <RarityTag id={c.rarity} />
        </div>
        <h2 className="mt-3 font-display text-[44px] leading-none font-extrabold tracking-[-.035em]">{t.name}</h2>
        <p className="num mt-1 text-[15px] text-dim">n° {serialOf(c)} · vendue par {short(offer.seller)}</p>

        {step === "done" ? (
          <div className="surface mt-6 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-up/15 text-up"><Icon name="check" size={20} /></span>
              <div>
                <div className="font-display text-[22px] font-bold tracking-[-.02em]">Elle est à toi</div>
                <div className="text-[14px] text-muted">La carte est dans ta collection.</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/collection" className="btn-gold btn-sm">Voir ma collection</Link>
              <button className="btn-ghost btn-sm" onClick={onClose}>Continuer</button>
            </div>
          </div>
        ) : (
          <>
            <dl className="surface mt-6 p-5 text-[15px]">
              <div className="flex justify-between py-1"><dt className="text-muted">Prix du vendeur</dt><dd className="num font-semibold">{fmtSol(toSol(offer.lamports))}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-muted">Frais cm cards ({FEE_BPS / 100} %)</dt><dd className="num font-semibold">{fmtSol(toSol(fee))}</dd></div>
              <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Total</dt><dd className="num font-display text-[28px] font-bold tracking-[-.02em]">{fmtSol(toSol(total))}</dd></div>
            </dl>

            <div className="mt-5">
              {!TREASURY ? (
                <span className="btn-ghost w-full cursor-not-allowed opacity-60">Les paiements ouvrent bientôt</span>
              ) : !wallet ? (
                <button className="btn-gold w-full" onClick={signIn} disabled={busy}><Icon name="wallet" size={17} /> {busy ? "Signature…" : "Connecter mon wallet"}</button>
              ) : mine ? (
                <Link href="/collection" className="btn-ghost w-full">C&apos;est ta carte : gère-la dans ta collection</Link>
              ) : sig ? (
                <button className="btn-gold w-full" onClick={() => { setError(null); setStep("transfer"); claim(sig).catch((e) => { setStep("idle"); setError(e.message); }); }} disabled={step !== "idle"}>
                  {step === "transfer" ? "Transfert de la carte…" : "Récupérer la carte"}
                </button>
              ) : (
                <button className="btn-gold w-full" onClick={go} disabled={step !== "idle" || short_}>
                  {step === "reserve" ? "Réservation…" : step === "sign" ? "Valide dans ton wallet…" : step === "transfer" ? "Transfert de la carte…" : `Payer ${fmtSol(toSol(total))}`}
                </button>
              )}
              {short_ && !mine && !sig && <p className="mt-3 text-[14px] font-semibold text-down">Solde insuffisant.</p>}
              {error && <p className="mt-3 text-[14px] font-semibold text-down">{error}</p>}
              <p className="mt-3 text-[13px] text-dim">Une seule transaction : le prix part au vendeur, les frais à cm cards. La carte t&apos;est réservée deux minutes le temps de payer.</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
