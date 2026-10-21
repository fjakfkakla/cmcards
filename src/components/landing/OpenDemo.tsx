"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "../opening.css";
import BoosterPack from "../BoosterPack";
import CollectCard from "../CollectCard";
import Icon from "../Icon";
import { Back, GLOW } from "../Opening";
import { RarityTag } from "../ui";
import { type Card, PACKS, RARITIES, type RarityId, category, drawRarity, fmtSol, packTraders, rank, rarity, trader } from "@/lib/data";

/* L'ouverture d'un booster, en démonstration sur la landing : le même geste que
   dans l'app, sans wallet et sans paiement. Le booster Legend flotte, tremble, se
   coupe le long de sa ligne, la lumière de la meilleure carte en sort, puis les dos
   se retournent un à un. Ça tourne en boucle tant qu'on le regarde ; un clic sur
   le booster l'ouvre tout de suite, « Rejouer » en tire un autre. Le tirage est
   un vrai tirage (les vraies chances, OG et Mythic ×2, la Shiny garantie). */
type Phase = "sealed" | "shaking" | "torn" | "reveal";
const PACK = PACKS.find((p) => p.id === "legend")!;
const POOL = packTraders(PACK).filter((t) => !t.art?.startsWith("http"));

function draw(): Card[] {
  return Array.from({ length: PACK.cards }, (_, k) => {
    const last = k === PACK.cards - 1;
    const r = drawRarity(Math.random(), PACK.boost, last ? PACK.guarantee : "common");
    const t = POOL[Math.floor(Math.random() * POOL.length)];
    const s = rarity(r).supply;
    return { id: `demo-${Date.now()}-${k}`, trader: t.id, rarity: r, serial: s === 1 ? 1 : 1 + Math.floor(Math.random() * s) };
  });
}

export default function OpenDemo() {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [cards, setCards] = useState<Card[] | null>(null);
  const [shown, setShown] = useState(0);
  const [seen, setSeen] = useState(false); // dans l'écran : la boucle tourne
  const still = useRef(false);             // prefers-reduced-motion : on n'anime pas tout seul
  const box = useRef<HTMLDivElement>(null);
  const cat = category(PACK.pool);
  const best = cards ? cards.reduce<RarityId>((b, c) => (rank(c.rarity) > rank(b) ? c.rarity : b), "common") : "shiny";
  const bestId = cards?.find((c) => c.rarity === best)?.id;
  const done = !!cards && phase === "reveal" && shown >= cards.length;

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* la boucle : flotter, trembler, couper, retourner, admirer, recommencer */
  useEffect(() => {
    if (!seen || still.current) return;
    let t: ReturnType<typeof setTimeout>;
    if (phase === "sealed") t = setTimeout(() => setPhase("shaking"), 1800);
    else if (phase === "shaking") t = setTimeout(() => setPhase("torn"), 1050);
    else if (phase === "torn") t = setTimeout(() => { setCards(draw()); setShown(0); setPhase("reveal"); }, 1000);
    else if (cards && shown < cards.length) t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : 420);
    else t = setTimeout(() => { setCards(null); setShown(0); setPhase("sealed"); }, 4200);
    return () => clearTimeout(t);
  }, [phase, shown, cards, seen]);

  function open() {
    if (phase !== "sealed") return;
    if (still.current) { setCards(draw()); setShown(PACK.cards); setPhase("reveal"); return; }
    setPhase("shaking");
  }
  function again() { setCards(null); setShown(0); setPhase("sealed"); }

  return (
    <div ref={box} className="od" style={{ "--c": cat.bg, "--glow": GLOW[best] } as React.CSSProperties}>
      <div className="od-plank">
        <div className="od-rays" />
        {phase !== "reveal" ? (
          <button type="button" className="od-pack" onClick={open} aria-label={`Open the ${PACK.name} booster`}>
            <BoosterPack pack={PACK} torn={phase === "torn"} shaking={phase === "shaking"} floating={phase === "sealed"} slit={phase === "shaking" ? 1 : 0} glow={GLOW[best]} />
          </button>
        ) : cards && (
          <div className="od-row">
            {cards.map((c, k) => {
              const up = k < shown;
              const isBest = done && c.id === bestId && best !== "common";
              return (
                <div key={c.id} className={`od-card ${up ? "is-up" : ""} ${isBest ? "is-best" : ""}`}
                  style={{ "--glow": GLOW[c.rarity], animationDelay: `${k * 70}ms` } as React.CSSProperties}
                  aria-label={up ? `${trader(c.trader).name}, ${rarity(c.rarity).name}` : "Hidden card"}>
                  <span className="od-flip">
                    <span className="od-face"><Back /></span>
                    <span className="od-face od-front"><CollectCard card={c} /></span>
                  </span>
                  {up && <span className="od-tag"><RarityTag id={c.rarity} size="sm" /></span>}
                </div>
              );
            })}
          </div>
        )}
        <p className="od-hint">
          {phase === "sealed" ? "Click, or just watch" : phase === "reveal" && !done ? `${shown} / ${cards?.length}` : done ? summary(cards!) : " "}
        </p>
      </div>

      <div className="surface od-side">
        <div className="min-w-0">
          <h3 className="font-display text-[30px] leading-none font-extrabold tracking-[-.035em]">Booster {PACK.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="plate"><b className="num">{PACK.cards}</b> cards</span>
            {PACK.guarantee && <span className="plate"><RarityTag id={PACK.guarantee} size="sm" /> guaranteed</span>}
            {PACK.boost && <span className="plate">OG and Mythic <b>×{PACK.boost}</b></span>}
          </div>
          <p className="mt-4 max-w-[620px] text-[16px] leading-snug font-semibold text-muted">
            Every booster tears open along its line. The cards are drawn by the server and numbered within a fixed supply: a Mythic is a single card in the world.
          </p>
        </div>
        <div className="od-actions">
          <Link href={`/booster/${PACK.id}`} className="btn-gold btn-lg">Open for {fmtSol(PACK.price)} <Icon name="arrow" size={18} /></Link>
          <button type="button" className="btn-ghost btn-lg" onClick={again} disabled={phase !== "reveal" && phase !== "sealed"}>Play again</button>
        </div>
      </div>
    </div>
  );
}

/* « 5 cartes · 1 Mythic · 2 Shiny · 2 Communs », de la plus rare à la plus commune */
function summary(cards: Card[]) {
  const parts = [...RARITIES].reverse()
    .map((r) => [r, cards.filter((c) => c.rarity === r.id).length] as const)
    .filter(([, n]) => n)
    .map(([r, n]) => `${n} ${r.name}`);
  return [`${cards.length} cards`, ...parts].join(" · ");
}
