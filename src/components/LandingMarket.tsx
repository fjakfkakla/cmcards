"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pic from "./Pic";
import { api } from "@/lib/account";
import { CATEGORIES, TRADERS, type CategoryId, category, fmtSol, rank, rarity, serialOf, trader } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";
import { toSol } from "@/lib/solana";
import type { Offer } from "@/lib/types";

type Sort = "recent" | "cheap" | "rare";
const SORTS: [Sort, string][] = [["recent", "Récentes"], ["cheap", "Moins chères"], ["rare", "Plus rares"]];
const ORDER: Record<Sort, (a: Offer, b: Offer) => number> = {
  recent: (a, b) => b.at - a.at,
  cheap: (a, b) => a.lamports - b.lamports,
  rare: (a, b) => rank(b.card.rarity) - rank(a.card.rarity) || a.lamports - b.lamports,
};
const CATS = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id));
const ROWS = 8;

/* Le marché sur la page d'accueil : les cartes en vente en ce moment, en tableau,
   comme une liste de cotations. On choisit l'ordre et la famille ; acheter se fait
   sur la page du marché. */
export default function LandingMarket() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    const load = () => api<{ offers: Offer[] }>("/api/market")
      .then((d) => { if (live) { setOffers(d.offers); setFailed(false); } })
      .catch(() => { if (live) setFailed(true); });
    load();
    const t = setInterval(load, 30_000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (offers ?? [])
      .filter((o) => (!cat || trader(o.card.trader).category === cat) && (!s || trader(o.card.trader).name.toLowerCase().includes(s)))
      .sort(ORDER[sort]);
  }, [offers, sort, cat, q]);

  return (
    <div className="rounded-[28px] border border-night-line bg-night-card/40 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-[26px] font-bold tracking-[-.02em]">Le marché</h2>
          <p className="mt-1 text-[14px] text-night-muted">Les cartes que les joueurs vendent en ce moment, au prix qu&apos;ils fixent.</p>
        </div>
        <label className="flex w-full items-center gap-2 rounded-full border border-night-line bg-night/60 px-4 py-2.5 text-[14px] md:w-80">
          <svg className="h-4 w-4 text-night-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M14 14l3 3" strokeLinecap="round" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un trader" className="flex-1 bg-transparent placeholder:text-night-muted focus:outline-none" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-night-line bg-night/60 p-1">
          {SORTS.map(([id, label]) => (
            <button key={id} onClick={() => setSort(id)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] font-medium transition ${sort === id ? "bg-night-2 text-fg" : "text-night-muted hover:text-fg"}`}>{label}</button>
          ))}
        </div>
        <div className="-mx-1 flex max-w-full overflow-x-auto px-1 [scrollbar-width:none]">
          <div className="inline-flex rounded-full border border-night-line bg-night/60 p-1">
            <button onClick={() => setCat(null)} className={`rounded-full px-3 py-1.5 text-[14px] font-medium transition ${!cat ? "bg-night-2 text-fg" : "text-night-muted hover:text-fg"}`}>Toutes</button>
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] font-medium transition ${cat === c.id ? "bg-night-2 text-fg" : "text-night-muted hover:text-fg"}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: c.bg }} />{c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-night-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          <span className="font-mono">{offers ? offers.length : "…"}</span> en vente
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[28px_1fr_auto] items-center gap-4 border-b border-night-line px-3 py-3 text-[11px] font-semibold tracking-wider text-night-muted uppercase sm:grid-cols-[40px_1fr_120px_130px_96px] sm:px-4">
          <span>#</span><span>Carte</span><span className="hidden sm:block">Rareté</span><span className="text-right">Prix</span><span className="hidden sm:block" />
        </div>
        {offers === null && !failed ? (
          <ul className="divide-y divide-night-line">
            {Array.from({ length: 4 }, (_, k) => (
              <li key={k} className="flex items-center gap-4 px-4 py-3.5">
                <span className="h-10 w-10 animate-pulse rounded-xl bg-night-2" />
                <span className="h-3 w-40 animate-pulse rounded-full bg-night-2" />
              </li>
            ))}
          </ul>
        ) : failed && !offers ? (
          <p className="px-4 py-12 text-center text-[14px] text-night-muted">Le marché ne répond pas. Réessaie dans un instant.</p>
        ) : list.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <h3 className="text-[18px] font-semibold">{offers?.length ? "Rien ne correspond" : "Aucune carte en vente pour l'instant"}</h3>
            <p className="mx-auto mt-1 max-w-sm text-[14px] text-night-muted">
              {offers?.length ? "Essaie une autre famille ou un autre nom." : "Ouvre un booster et mets la première carte en vente, au prix que tu veux."}
            </p>
            {!offers?.length && <Link href="/boosters" className="btn-lime btn-sm mt-5">Ouvrir un booster</Link>}
          </div>
        ) : (
          <ul className="divide-y divide-night-line">
            {list.slice(0, ROWS).map((o, k) => {
              const t = trader(o.card.trader);
              const r = rarity(o.card.rarity);
              return (
                <li key={o.id}>
                  <Link href="/marche" className="grid grid-cols-[28px_1fr_auto] items-center gap-4 px-3 py-3 transition hover:bg-night-2/50 sm:grid-cols-[40px_1fr_120px_130px_96px] sm:px-4">
                    <span className="font-mono text-[13px] text-night-muted">{k + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Pic srcs={portraitSources(t)} fallback={portraitUri(t.name, t.category ? category(t.category).bg : undefined)} alt=""
                        className="h-10 w-10 shrink-0 rounded-xl object-cover" style={{ objectPosition: t.artPos }} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{t.name}</span>
                        <span className="block font-mono text-[12px] text-night-muted">#{serialOf(o.card)}</span>
                      </span>
                    </span>
                    <span className="hidden items-center gap-2 text-[14px] sm:flex"><i className={`rar-${r.id} h-2.5 w-2.5 rounded-full`} />{r.name}</span>
                    <span className="text-right font-mono text-[14px] font-medium">{fmtSol(toSol(o.lamports))}</span>
                    <span className="hidden justify-end sm:flex">
                      <span className="rounded-full border border-night-line px-3.5 py-1.5 text-[13px] font-semibold">Acheter</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {list.length > ROWS && (
        <Link href="/marche" className="mt-4 flex justify-center text-[14px] font-semibold text-night-muted hover:text-fg">Voir les {list.length} annonces</Link>
      )}
    </div>
  );
}
