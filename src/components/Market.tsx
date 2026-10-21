"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./collection.css";
import CollectCard from "./CollectCard";
import Icon from "./Icon";
import { Ago, CategoryTag, Empty, FamilyCoin, Filter, Modal, PageHead, RarityTag, Stats } from "./ui";
import { api, useAccount } from "@/lib/account";
import { CATEGORIES, RARITIES, TRADERS, type CategoryId, type RarityId, fmtSol, rank, rarity, serialOf, trader } from "@/lib/data";
import { FEE_BPS, MEMO, explorer, feeOf, short, toSol } from "@/lib/solana";
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
      <PageHead title="Marché">
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
            <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input className="field h-12 pl-11" placeholder="Chercher un trader" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Trier"
            className="chip ml-auto h-12 cursor-pointer appearance-none pr-4 font-display font-extrabold outline-none">
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
              <FamilyCoin id={c.id} size={24} className="-ml-2" />
              {c.name}
            </Filter>
          ))}
          <span className="mx-1 hidden h-6 w-[2px] rounded bg-fg/20 sm:block" />
          {RARITIES.map((r) => (
            <Filter key={r.id} on={rar === r.id} onClick={() => setRar(rar === r.id ? null : r.id)}
              count={offers.filter((o) => o.card.rarity === r.id).length}>
              <i className={`rar-${r.id} -ml-1 h-4 w-4 rounded-full border-2 border-fg`} />
              {r.name}
            </Filter>
          ))}
        </div>
      </div>

      {failed && !data ? (
        <div className="mt-12 flex flex-col items-center gap-4"><p className="font-display text-[22px] font-extrabold">Le marché ne répond pas</p><button className="btn-ghost btn-sm" onClick={load}>Réessayer</button></div>
      ) : !data ? (
        <div className="col-grid mt-8">
          {Array.from({ length: 8 }, (_, k) => <div key={k} className="aspect-[63/88] animate-pulse rounded-[14px] bg-raised" />)}
        </div>
      ) : offers.length === 0 ? (
        <Empty title="Aucune carte en vente" href="/boosters" cta="Ouvrir un booster" />
      ) : list.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="font-display text-[22px] font-extrabold">Rien avec ces filtres</p>
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
                  <span className="min-w-0 truncate font-display text-[20px] leading-tight font-extrabold tracking-[-.02em]">{trader(o.card.trader).name}</span>
                  <RarityTag id={o.card.rarity} size="sm" />
                </div>
                <div className="num mt-0.5 text-[13.5px] font-semibold text-muted">n° {serialOf(o.card)} · {short(o.seller)}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="num font-display text-[21px] font-extrabold tracking-[-.02em]">{fmtSol(toSol(o.lamports))}</span>
                  {mine
                    ? <Link href="/collection" className="btn-ghost btn-sm h-10 px-4">Ta carte</Link>
                    : <button className="btn-gold btn-sm h-10 px-4" onClick={() => setBuying(o)}>Acheter</button>}
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
  const { cfg } = useAccount();
  return (
    <section className="mt-16">
      <h2 className="font-display text-[32px] font-extrabold tracking-[-.035em]">Dernières ventes</h2>
      <div className="surface mt-5 divide-y-2 divide-fg/10">
        {sales.slice(0, 12).map((s) => (
          <div key={s.sig} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
            <RarityTag id={s.rarity} size="sm" />
            <span className="min-w-0 truncate font-display text-[16px] font-extrabold">{trader(s.trader).name}</span>
            <span className="num hidden font-semibold text-muted sm:inline">n° {serialOf({ id: "", trader: s.trader, rarity: s.rarity, serial: s.serial })}</span>
            <span className="num ml-auto font-display text-[16px] font-extrabold">{fmtSol(toSol(s.lamports))}</span>
            <a href={explorer(s.sig, cfg.cluster)} target="_blank" rel="noreferrer" className="w-24 text-right text-[13.5px] font-semibold text-muted hover:text-fg"><Ago at={s.at} /></a>
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
  const { cfg, wallet, balance, busy, signIn, pay, refresh } = useAccount();
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
      const s = await pay([{ to: listing.seller, lamports: listing.lamports }, { to: cfg.treasury, lamports: feeOf(listing.lamports) }], MEMO.buy(listing.id));
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
          <span className="num plate h-7 px-3 text-[13.5px]">n° {serialOf(c)}</span>
        </div>
        <h2 className="mt-3 font-display text-[48px] leading-none font-extrabold tracking-[-.04em]">{t.name}</h2>

        {step === "done" ? (
          <div className="surface mt-6 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-fg bg-up text-white"><Icon name="check" size={22} /></span>
              <div className="font-display text-[24px] font-extrabold tracking-[-.02em]">Elle est à toi</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/collection" className="btn-gold btn-sm">Voir ma collection</Link>
              <button className="btn-ghost btn-sm" onClick={onClose}>Continuer</button>
            </div>
          </div>
        ) : (
          <>
            <dl className="surface mt-6 p-5 text-[15px]">
              <div className="flex justify-between py-1"><dt className="font-semibold text-muted">Prix du vendeur</dt><dd className="num font-bold">{fmtSol(toSol(offer.lamports))}</dd></div>
              <div className="flex justify-between py-1"><dt className="font-semibold text-muted">Frais cm cards ({FEE_BPS / 100} %)</dt><dd className="num font-bold">{fmtSol(toSol(fee))}</dd></div>
              <div className="mt-2 flex items-baseline justify-between border-t-2 border-fg/10 pt-3"><dt className="font-display text-[18px] font-extrabold">Total</dt><dd className="num font-display text-[30px] font-extrabold tracking-[-.02em]">{fmtSol(toSol(total))}</dd></div>
            </dl>

            <div className="mt-5">
              {!cfg.treasury ? (
                <span className="btn-ghost w-full cursor-not-allowed">Les paiements ouvrent bientôt</span>
              ) : !wallet ? (
                <button className="btn-gold w-full" onClick={signIn} disabled={busy}><Icon name="wallet" size={17} /> {busy ? "Signature…" : "Connecter mon wallet"}</button>
              ) : mine ? (
                <Link href="/collection" className="btn-ghost w-full">C&apos;est ta carte</Link>
              ) : sig ? (
                <button className="btn-gold w-full" onClick={() => { setError(null); setStep("transfer"); claim(sig).catch((e) => { setStep("idle"); setError(e.message); }); }} disabled={step !== "idle"}>
                  {step === "transfer" ? "Transfert de la carte…" : "Récupérer la carte"}
                </button>
              ) : (
                <button className="btn-gold w-full" onClick={go} disabled={step !== "idle" || short_}>
                  {step === "reserve" ? "Réservation…" : step === "sign" ? "Valide dans ton wallet…" : step === "transfer" ? "Transfert de la carte…" : `Payer ${fmtSol(toSol(total))}`}
                </button>
              )}
              {short_ && !mine && !sig && <p className="mt-3 text-[14.5px] font-bold text-down">Solde insuffisant</p>}
              {error && <p className="mt-3 text-[14.5px] font-bold text-down">{error}</p>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
