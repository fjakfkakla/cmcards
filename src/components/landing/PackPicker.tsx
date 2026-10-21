"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BoosterPack from "../BoosterPack";
import Pic from "../Pic";
import { FamilyCoin, RarityTag } from "../ui";
import { PACKS, RARITIES, type CategoryId, type Pack, category, fmtSol, packTraders } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";

/* Les chances d'une carte dans ce booster : l'OG et la Mythic sont boostées. */
export function oddsOf(p: Pack) {
  const boost = p.boost ?? 1;
  const w = RARITIES.map((r) => (r.id === "og" || r.id === "mythic" ? r.odds * boost : r.odds));
  const tot = w.reduce((a, b) => a + b, 0);
  return RARITIES.map((r, k) => ({ r, pct: (w[k] / tot) * 100 }));
}
const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: n < 1 ? 2 : 1 })} %`;

/* Choisir son booster : les six pièces des familles ; le booster choisi au centre,
   sur une planche à SA couleur ; à droite ce qu'il contient, ses chances, son prix,
   et le bouton qui l'ouvre. Un booster touché dans le présentoir arrive ici. */
export default function PackPicker() {
  const [id, setId] = useState<CategoryId>("trencher");
  const p = PACKS.find((x) => x.id === id)!;
  const cat = category(p.pool);
  const people = packTraders(p);

  useEffect(() => {
    const on = () => {
      const m = location.hash.match(/^#b-([a-z]+)$/);
      if (m && PACKS.some((x) => x.id === m[1])) {
        setId(m[1] as CategoryId);
        document.getElementById("boosters")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  return (
    <div className="pk" style={{ "--c": cat.bg, "--m": cat.ink } as React.CSSProperties}>
      <div className="pk-coins" role="tablist" aria-label="Les familles">
        {PACKS.map((q) => (
          <button key={q.id} role="tab" aria-selected={q.id === id} onClick={() => setId(q.id)} className="pk-coin">
            <FamilyCoin id={q.id} size={52} />
            <span>{q.name}</span>
          </button>
        ))}
      </div>

      <div className="pk-grid">
        <div className="pk-stage">
          <div className="pk-rays" />
          <div className="pk-pack" key={p.id}><BoosterPack pack={p} floating /></div>
        </div>

        <div className="pk-card surface">
          <h3 className="font-display text-[34px] leading-none font-extrabold tracking-[-.035em]">Booster {p.name}</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="plate"><b className="num">{p.cards}</b> cartes</span>
            {p.guarantee && <span className="plate"><RarityTag id={p.guarantee} size="sm" /> garantie</span>}
            {p.boost && <span className="plate">OG et Mythic <b>×{p.boost}</b></span>}
          </div>

          <div className="mt-5 flex -space-x-2.5">
            {people.slice(0, 6).map((t) => (
              <Link key={t.id} href={`/cartes/${t.id}`} title={t.name} className="pk-face">
                <Pic srcs={portraitSources(t)} fallback={portraitUri(t.name, cat.bg)} alt={t.name} style={{ objectPosition: t.artPos }} />
              </Link>
            ))}
            {people.length > 6 && <span className="pk-face pk-more num">+{people.length - 6}</span>}
          </div>

          <ul className="mt-5 grid gap-1.5">
            {oddsOf(p).map(({ r, pct: v }) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="w-[84px] shrink-0"><RarityTag id={r.id} size="sm" /></span>
                <span className="h-3 flex-1 overflow-hidden rounded-full border-2 border-fg bg-cream">
                  <span className={`rar-${r.id} block h-full`} style={{ width: `${Math.max(3, Math.min(100, v * 1.3))}%` }} />
                </span>
                <span className="num w-[62px] text-right text-[14.5px] font-bold">{pct(v)}</span>
              </li>
            ))}
          </ul>

          <Link href={`/booster/${p.id}`} className="btn-gold btn-lg mt-6 w-full">
            Ouvrir pour {fmtSol(p.price)}
          </Link>
        </div>
      </div>
    </div>
  );
}

