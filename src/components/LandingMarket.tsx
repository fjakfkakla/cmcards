"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import Pic from "./Pic";
import { FamilyCoin, RarityTag, Seg } from "./ui";
import { api } from "@/lib/account";
import { type CategoryId, category, fmtSol, rank, serialOf, trader } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";
import { FAMILIES } from "@/lib/rewards";
import { toSol } from "@/lib/solana";
import type { Offer } from "@/lib/types";

type Sort = "recent" | "cheap" | "rare";
const ORDER: Record<Sort, (a: Offer, b: Offer) => number> = {
  recent: (a, b) => b.at - a.at,
  cheap: (a, b) => a.lamports - b.lamports,
  rare: (a, b) => rank(b.card.rarity) - rank(a.card.rarity) || a.lamports - b.lamports,
};
const ROWS = 8;

/* Le marché sur la page d'accueil : les cartes en vente en ce moment, en liste. On
   choisit l'ordre et la famille ; acheter se fait sur la page du marché. */
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
    <div className="surface p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Seg value={sort} onChange={setSort} options={[["recent", "Newest"], ["cheap", "Cheapest"], ["rare", "Rarest"]]} />
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pt-1 pb-2 [scrollbar-width:none] lg:mx-0 lg:pb-1">
          {FAMILIES.map((c) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)} aria-pressed={cat === c.id} title={c.name}
              className={`shrink-0 rounded-full p-0.5 transition-transform hover:-translate-y-0.5 ${cat === c.id ? "ring-[3px] ring-fg ring-offset-2 ring-offset-white" : cat ? "opacity-45" : ""}`}>
              <FamilyCoin id={c.id} size={38} />
            </button>
          ))}
        </div>
        <label className="relative w-full lg:ml-auto lg:w-72">
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input className="field h-12 pl-11" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a trader" />
        </label>
      </div>

      <div className="mt-5">
        {offers === null && !failed ? (
          <ul className="grid gap-2">
            {Array.from({ length: 4 }, (_, k) => <li key={k} className="h-[66px] animate-pulse rounded-2xl bg-cream" />)}
          </ul>
        ) : failed && !offers ? (
          <p className="py-12 text-center font-display text-[20px] font-extrabold">The market isn&apos;t responding</p>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="font-display text-[24px] font-extrabold tracking-[-.02em]">{offers?.length ? "Nothing matches these filters" : "No cards for sale"}</p>
            {offers?.length
              ? <button className="btn-ghost btn-sm mt-5" onClick={() => { setCat(null); setQ(""); }}>Show all</button>
              : <Link href="#boosters" className="btn-gold mt-5">Open a booster</Link>}
          </div>
        ) : (
          <ul className="grid gap-2">
            {list.slice(0, ROWS).map((o, k) => {
              const t = trader(o.card.trader);
              return (
                <li key={o.id}>
                  <Link href="/market" className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-2xl border-2 border-fg bg-white px-3 py-2.5 shadow-[0_3px_0_#1e1a16] transition-transform hover:-translate-y-0.5 sm:grid-cols-[32px_1fr_110px_120px_auto] sm:px-4">
                    <span className="num font-display text-[17px] font-extrabold text-muted">{k + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Pic srcs={portraitSources(t)} fallback={portraitUri(t.name, t.category ? category(t.category).bg : undefined)} alt=""
                        className="h-11 w-11 shrink-0 rounded-full border-2 border-fg object-cover" style={{ objectPosition: t.artPos }} />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-[17px] font-extrabold">{t.name}</span>
                        <span className="num block text-[13px] font-semibold text-muted">#{serialOf(o.card)}</span>
                      </span>
                    </span>
                    <span className="hidden sm:block"><RarityTag id={o.card.rarity} size="sm" /></span>
                    <span className="num text-right font-display text-[17px] font-extrabold">{fmtSol(toSol(o.lamports))}</span>
                    <span className="hidden sm:block"><span className="btn-gold btn-sm h-9 px-4 text-[14px]">Buy</span></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {list.length > ROWS && (
        <Link href="/market" className="btn-ghost btn-sm mx-auto mt-5 flex w-fit">All {list.length} listings</Link>
      )}
    </div>
  );
}
