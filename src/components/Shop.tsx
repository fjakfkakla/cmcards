"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BoosterPack from "./BoosterPack";
import { PACKS, RARITIES, fmtUsd, packRange, rarity } from "@/lib/data";

/* La boutique : les boosters en carrousel (on glisse, ou on touche un voisin), et
   sous celui du milieu ce qu'il peut contenir. */
export default function Shop() {
  const [at, setAt] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const p = PACKS[at];
  const [min, max] = packRange(p);

  useEffect(() => {
    const el = rail.current?.children[at] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [at]);

  function onScroll() {
    const r = rail.current;
    if (!r) return;
    const mid = r.scrollLeft + r.clientWidth / 2;
    let best = 0, d = Infinity;
    Array.from(r.children).forEach((c, k) => {
      const el = c as HTMLElement;
      const dd = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (dd < d) { d = dd; best = k; }
    });
    if (best !== at) setAt(best);
  }

  return (
    <div className="flex flex-col items-center pb-16">
      <div
        ref={rail}
        onScroll={onScroll}
        className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-[calc(50vw-130px)] pt-10 pb-6 [scrollbar-width:none] sm:px-[calc(50vw-150px)]"
      >
        {PACKS.map((q, k) => (
          <button
            key={q.id}
            onClick={() => setAt(k)}
            className="w-[260px] shrink-0 snap-center transition-[transform,opacity,filter] duration-300 sm:w-[300px]"
            style={{ transform: k === at ? "scale(1)" : "scale(.78)", opacity: k === at ? 1 : 0.55, filter: k === at ? "none" : "saturate(.6)" }}
            aria-label={q.name}
          >
            <BoosterPack pack={q} floating={k === at} />
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        {PACKS.map((q, k) => (
          <button key={q.id} onClick={() => setAt(k)} aria-label={q.name}
            className={`h-3 rounded-full border-2 border-ink transition-all ${k === at ? "w-8 bg-ink" : "w-3 bg-paper"}`} />
        ))}
      </div>

      <h1 className="mt-6 font-display text-5xl">{p.name}</h1>

      <div className="mt-5 grid w-full max-w-md grid-cols-3 overflow-hidden rounded-2xl sticker bg-paper text-center">
        <Stat label="Min" value={fmtUsd(min)} />
        <Stat label="Max" value={fmtUsd(max)} big />
        <Stat label="Cartes" value={String(p.cards)} />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {p.pool && <Chip>Seulement {p.pool === "top10" ? "Top 10" : p.pool}</Chip>}
        {p.guarantee && <Chip>{rarity(p.guarantee).name} ou mieux garantie</Chip>}
        {p.boost && <Chip>OG et Mythic ×{p.boost}</Chip>}
      </div>

      <Link href={`/booster/${p.id}`} className="btn mt-7 w-full max-w-md bg-tomato py-4 text-2xl text-cream">
        Ouvrir · {p.price.toLocaleString("fr-FR")} SOL
      </Link>

      <Odds boost={p.boost} />
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="border-ink px-3 py-3 [&:not(:last-child)]:border-r-[3px]">
      <div className="text-[13px] font-black uppercase tracking-wider text-ink-2">{label}</div>
      <div className={`font-display leading-tight ${big ? "text-3xl" : "text-2xl"}`}>{value}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border-[2.5px] border-ink bg-sponge px-3 py-1 text-[14px] font-black">{children}</span>;
}

/* Les chances de chaque rareté pour ce booster. */
function Odds({ boost = 1 }: { boost?: number }) {
  const w = RARITIES.map((r) => (r.id === "og" || r.id === "mythic" ? r.odds * boost : r.odds));
  const tot = w.reduce((a, b) => a + b, 0);
  return (
    <div className="mt-10 w-full max-w-md">
      <div className="flex h-4 overflow-hidden rounded-full border-[2.5px] border-ink">
        {RARITIES.map((r, k) => (
          <span key={r.id} className={`rar-${r.id}`} style={{ width: `${Math.max(1.2, (w[k] / tot) * 100)}%` }} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[15px] font-extrabold sm:grid-cols-3">
        {RARITIES.map((r, k) => (
          <li key={r.id} className="flex items-center gap-2">
            <span className={`rar-${r.id} inline-block h-3 w-3 rounded-full border-2 border-ink`} />
            {r.name}
            <span className="ml-auto text-ink-2">{((w[k] / tot) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
