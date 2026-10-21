"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BoosterPack from "./BoosterPack";
import Icon from "./Icon";
import { useAccount } from "@/lib/account";
import { PACKS, RARITIES, type Pack, category, fmtSol, packTraders, rarity } from "@/lib/data";
import { toSol } from "@/lib/solana";

/* La boutique : les boosters en carrousel (on glisse, ou on touche un voisin), et
   sous celui du milieu son prix, ce qu'il contient, le bouton d'achat. */
export default function Shop() {
  const { balance } = useAccount();
  const [at, setAt] = useState(0);
  const [inside, setInside] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  /* pendant le défilement vers un booster touché, le défilement ne choisit pas */
  const jumping = useRef<ReturnType<typeof setTimeout> | null>(null);
  const p = PACKS[at];
  const people = packTraders(p);
  const open = people.length > 0;

  useEffect(() => {
    const el = rail.current?.children[at] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [at]);

  function go(k: number) {
    if (jumping.current) clearTimeout(jumping.current);
    jumping.current = setTimeout(() => { jumping.current = null; }, 800);
    setAt(k);
  }

  function onScroll() {
    const r = rail.current;
    if (!r || jumping.current) return;
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
    <div className="flex flex-col items-center px-4 pb-10">
      <div
        ref={rail}
        onScroll={onScroll}
        className="-mx-4 flex w-screen snap-x snap-mandatory gap-1 overflow-x-auto px-[calc(50vw-120px)] pt-8 pb-8 [scrollbar-width:none] sm:px-[calc(50vw-140px)]"
      >
        {PACKS.map((q, k) => (
          <button
            key={q.id}
            onClick={() => go(k)}
            className="w-[240px] shrink-0 snap-center transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(.16,1,.3,1)] sm:w-[280px]"
            style={{ transform: k === at ? "scale(1)" : "scale(.8)", opacity: k === at ? 1 : 0.4, filter: k === at ? "none" : "saturate(.5) blur(.5px)" }}
            aria-label={`Booster ${q.name}`}
          >
            <BoosterPack pack={q} floating={k === at} />
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {PACKS.map((q, k) => (
          <button key={q.id} onClick={() => go(k)} aria-label={q.name}
            className={`h-1.5 rounded-full transition-all ${k === at ? "w-6 bg-gold" : "w-1.5 bg-white/20 hover:bg-white/40"}`} />
        ))}
      </div>

      <p className="mt-6 text-[15px] font-semibold text-muted">{category(p.pool).tagline}</p>
      <h1 className="mt-1 font-display text-[44px] leading-none font-extrabold tracking-[-.035em]">Booster {p.name}</h1>

      <div className="mt-7 grid w-full max-w-md grid-cols-3 items-end text-center">
        <Stat label="Cartes" value={String(p.cards)} />
        <Stat label="Prix" value={fmtSol(p.price)} big />
        <Stat label="Personnages" value={String(people.length)} />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button className="chip hover:text-fg" onClick={() => setInside((v) => !v)} aria-expanded={inside}>
          <Icon name="spark" size={15} className="text-gold" />
          Ce qu&apos;il contient
        </button>
        {balance !== null && (
          <span className="chip">
            <Icon name="wallet" size={15} className="text-gold" />
            <span className="num">Solde : {toSol(balance).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} SOL</span>
          </span>
        )}
      </div>

      {inside && <Inside pack={p} />}

      <div className="mt-8 w-full max-w-md">
        {open ? (
          <Link href={`/booster/${p.id}`} className="btn-gold btn-lg w-full">
            Acheter pour {fmtSol(p.price)}
          </Link>
        ) : (
          <span className="btn-ghost btn-lg w-full cursor-not-allowed opacity-60">Bientôt : aucun {p.name} pour l&apos;instant</span>
        )}
        <p className="mt-3 text-center text-[13.5px] text-dim">
          Les cartes sont à toi : garde-les ou revends-les sur le <Link href="/marche" className="text-muted underline underline-offset-2 hover:text-fg">marché</Link>.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="border-line px-2 [&:not(:last-child)]:border-r">
      <div className="text-[14px] text-muted">{label}</div>
      <div className={`num mt-1 font-display font-bold tracking-[-.02em] ${big ? "text-[30px] leading-none" : "text-[20px]"}`}>{value}</div>
    </div>
  );
}

/* Ce qu'il contient : les personnages, les chances de chaque rareté, le stock. */
function Inside({ pack: p }: { pack: Pack }) {
  const boost = p.boost ?? 1;
  const w = RARITIES.map((r) => (r.id === "og" || r.id === "mythic" ? r.odds * boost : r.odds));
  const tot = w.reduce((a, b) => a + b, 0);
  return (
    <div className="surface rise mt-6 w-full max-w-md p-5">
      <div className="flex flex-wrap gap-1.5">
        {packTraders(p).map((t) => (
          <Link key={t.id} href={`/cartes/${t.id}`} className="chip h-8 px-3 text-[13px] hover:text-fg">{t.name}</Link>
        ))}
      </div>
      <div className="mt-5 flex h-2 overflow-hidden rounded-full">
        {RARITIES.map((r, k) => <span key={r.id} className={`rar-${r.id}`} style={{ width: `${Math.max(1.5, (w[k] / tot) * 100)}%` }} />)}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {RARITIES.map((r, k) => (
          <li key={r.id} className="flex items-center gap-3 text-[14.5px]">
            <i className={`rar-${r.id} h-3 w-3 rounded-full`} />
            <span className="font-semibold">{r.name}</span>
            <span className="text-dim">{r.supply === 1 ? "1 seul exemplaire" : `${r.supply.toLocaleString("fr-FR")} ex.`}</span>
            <span className="num ml-auto font-semibold">{((w[k] / tot) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %</span>
          </li>
        ))}
      </ul>
      {p.guarantee && <p className="mt-4 text-[13.5px] text-muted">La dernière carte est au moins {rarity(p.guarantee).name}.</p>}
    </div>
  );
}
