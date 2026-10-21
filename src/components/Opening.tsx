"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import "./opening.css";
import BoosterPack from "./BoosterPack";
import CollectCard from "./CollectCard";
import { COINS, type Card, type Pack, type RarityId, fmtAmount, fmtUsd, openPack, rarity, usdOf } from "@/lib/data";

/* La couleur de la lumière d'une rareté : celle qui sort du booster, celle du nom. */
const GLOW: Record<RarityId, string> = {
  common: "#efe5d0",
  rare: "#dfe6ee",
  shiny: "#bfe6ff",
  og: "#ffffff",
  mythic: "#ff5fb4",
};
const CONFETTI = ["#ff4b3e", "#ffd12e", "#3dcb6c", "#4da8ff", "#a77bff", "#ff5fb4"];

type Phase = "sealed" | "torn" | "reveal" | "done";

export default function Opening({ pack }: { pack: Pack }) {
  // le tirage se fait au moment d'ouvrir (le serveur s'en chargera au branchement)
  const [seed, setSeed] = useState(1);
  const cards = useMemo(() => openPack(pack, seed), [pack, seed]);
  const best = cards[cards.length - 1].rarity;

  const [phase, setPhase] = useState<Phase>("sealed");
  const [slit, setSlit] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [i, setI] = useState(0);
  const [up, setUp] = useState(false);
  const [out, setOut] = useState(false);
  const [fx, setFx] = useState(0); // relance les effets à chaque carte
  const drag = useRef<{ x: number; w: number; moved: boolean } | null>(null);

  function tear() {
    if (phase !== "sealed") return;
    setSeed(Math.floor(Math.random() * 1e9));
    setSlit(1);
    setShaking(true);
    setTimeout(() => { setShaking(false); setPhase("torn"); }, 1050);
    setTimeout(() => setPhase("reveal"), 1900);
  }
  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "sealed") return;
    const b = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, w: b.width, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = Math.max(0, Math.min(1, (e.clientX - d.x) / (d.w * 0.8)));
    if (p > 0.04) d.moved = true;
    setSlit(p);
    if (p >= 1) { drag.current = null; tear(); }
  }
  function up_() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) tear();          // un simple clic ouvre aussi
    else if (slit < 0.7) setSlit(0);
    else tear();
  }

  function next() {
    if (out) return;
    if (!up) {
      setUp(true);
      setFx((n) => n + 1);
      return;
    }
    setOut(true);
    setTimeout(() => {
      setOut(false);
      setUp(false);
      if (i + 1 >= cards.length) setPhase("done");
      else setI(i + 1);
    }, 420);
  }

  function again() {
    setPhase("sealed"); setSlit(0); setI(0); setUp(false); setOut(false);
  }

  const card = cards[i];
  const r = card.rarity;
  const showFx = phase === "reveal" && up && !out;
  const stageFx = showFx && r === "og" ? "og-flash" : showFx && r === "mythic" ? "quake" : "";

  return (
    <div className={`op-stage ${stageFx}`} key={`stage-${fx}`} style={{ "--glow": GLOW[showFx ? r : best] } as React.CSSProperties}>
      {showFx && <RevealFx rarity={r} key={`fx-${fx}`} />}

      {(phase === "sealed" || phase === "torn") && (
        <div className="relative z-[2] flex flex-col items-center">
          <div
            className="op-pack"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up_}
            onPointerCancel={() => { drag.current = null; setSlit(0); }}
          >
            <BoosterPack pack={pack} torn={phase === "torn"} shaking={shaking} floating={phase === "sealed" && !shaking} slit={slit} glow={GLOW[best]} />
          </div>
          <p className="op-hint" style={{ visibility: phase === "sealed" ? "visible" : "hidden" }}>
            Glisse le long de la ligne pour l&apos;ouvrir
          </p>
        </div>
      )}

      {phase === "reveal" && (
        <div className="relative z-[2] flex flex-col items-center">
          <div className={`op-deck ${i === 0 && !up ? "rising" : ""}`}>
            {/* les cartes encore cachées, en pile */}
            {cards.slice(i + 1).map((c, k) => (
              <div key={c.id + k} className="op-under" style={{ transform: `translate(${(k + 1) * 6}px, ${(k + 1) * 6}px) rotate(${(k + 1) * 1.5}deg)`, zIndex: 1 - k }}>
                <div className="cb"><div className="cb-mark" /></div>
              </div>
            )).reverse()}
            <div className={`op-card ${up ? "is-up" : ""} ${out ? "is-out" : ""}`} onClick={next} key={card.id + i}>
              {up && !out && <span className="op-tag" style={{ "--glow": GLOW[r] } as React.CSSProperties}>{rarity(r).name}</span>}
              <div className="op-flip">
                <div className="op-face"><div className="cb"><div className="cb-mark" /></div></div>
                <div className="op-face op-front"><CollectCard card={card} live={up} /></div>
              </div>
            </div>
          </div>
          <p className="op-hint">
            {up ? (i + 1 < cards.length ? `Touche pour la suivante · ${i + 1}/${cards.length}` : "Touche pour voir ton tirage") : `Touche pour la retourner · ${i + 1}/${cards.length}`}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div className="op-done relative z-[2]">
          <h1 className="font-display text-5xl">Ton tirage</h1>
          <div className="op-row">
            {cards.map((c, k) => (
              <div key={c.id + k} style={{ animationDelay: `${k * 90}ms` }}>
                <CollectCard card={c} />
                <Contents card={c} />
              </div>
            ))}
          </div>
          <p className="mt-8 text-xl font-extrabold">
            Valeur dans les cartes : <span className="font-display text-3xl">{fmtUsd(cards.reduce((a, c) => a + usdOf(c), 0))}</span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button className="btn bg-tomato text-cream" onClick={again}>Rouvrir un {pack.name}</button>
            <Link className="btn bg-paper" href="/">Autres boosters</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Contents({ card }: { card: Card }) {
  return (
    <p className="op-in">
      <b>{fmtAmount(card.amount)} {COINS[card.coin].ticker}</b>
      {fmtUsd(usdOf(card))}
    </p>
  );
}

/* Les effets d'une rareté, autour de la carte qui se retourne. */
function RevealFx({ rarity: r }: { rarity: RarityId }) {
  const bits = (n: number, cls: string, dist: number, colors?: string[]) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + (k % 2) * 0.3;
      const d = dist * (0.7 + ((k * 37) % 10) / 20);
      return (
        <span
          key={k}
          className={`op-bit ${cls}`}
          style={{
            "--dx": `${Math.cos(a) * d}px`,
            "--dy": `${Math.sin(a) * d}px`,
            "--r": `${(k * 67) % 360}deg`,
            background: colors ? colors[k % colors.length] : undefined,
            animationDelay: `${(k % 4) * 40}ms`,
          } as React.CSSProperties}
        />
      );
    });

  switch (r) {
    case "rare":
      return <div className="op-fx">{bits(8, "star", 220)}</div>;
    case "shiny":
      return <div className="op-fx"><div className="op-flash" />{bits(18, "star", 280)}</div>;
    case "og":
      return <div className="op-fx"><div className="op-flash" style={{ background: "#000" }} /></div>;
    case "mythic":
      return (
        <div className="op-fx">
          <div className="op-rays multi" />
          <div className="op-flash" style={{ background: "#fff" }} />
          {bits(36, "confetti", 420, CONFETTI)}
          {bits(12, "star", 300)}
        </div>
      );
    default:
      return null;
  }
}
