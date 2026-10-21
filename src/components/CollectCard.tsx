"use client";

import { useRef } from "react";
import "./card.css";
import Pic from "./Pic";
import { type Card, type CategoryId, category, rarity, trader } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";

/* Les glyphes des catégories, dessinés sur une grille de 24. */
const GLYPH: Record<CategoryId, string> = {
  top10: "M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z",
  trader: "M5 3h2v4h2v8H7v6H5v-6H3V7h2zm10 4h2v3h2v7h-2v4h-2v-4h-2v-7h2z",
  dev: "M8.6 6.4 3 12l5.6 5.6 1.4-1.4L5.8 12 10 7.8zm6.8 0L14 7.8l4.2 4.2-4.2 4.2 1.4 1.4L21 12z",
  sniper: "M11 2h2v3.1A7 7 0 0 1 18.9 11H22v2h-3.1A7 7 0 0 1 13 18.9V22h-2v-3.1A7 7 0 0 1 5.1 13H2v-2h3.1A7 7 0 0 1 11 5.1zm1 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  bundler: "M3 8l9-5 9 5v8l-9 5-9-5zm9-2.7L6.1 8.6 12 11.9l5.9-3.3zM5 10.3v4.6l6 3.4v-4.6zm14 0-6 3.4v4.6l6-3.4z",
};

const SPARKS = [[18, 22, 0], [74, 16, 0.9], [62, 48, 1.7], [26, 58, 0.4], [82, 64, 2.1]];
const BUBBLES = [[10, 3.4, 7], [30, 2.4, 9], [58, 4.2, 6.5], [76, 2.8, 8.5], [90, 3.6, 10], [44, 3, 11]];
const BILLS = [[6, 0, 7, -20], [22, 2.6, 8, 15], [70, 1.2, 7.5, -10], [86, 3.8, 9, 25], [48, 5, 8.5, -30], [36, 6.4, 7, 10]];
const DUST = [[14, 30, 0], [80, 22, 1.1], [24, 70, 2], [86, 60, 0.6], [50, 12, 1.6], [66, 78, 2.4], [8, 50, 3]];

export default function CollectCard({ card, live = false, className = "" }: { card: Card; live?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = trader(card.trader);
  const cat = t.category ? category(t.category) : undefined;
  const r = rarity(card.rarity);
  const theme = r.id === "mythic" ? t.theme ?? "" : "";
  const mythic = r.id === "mythic" ? t.mythic : undefined;
  const serial = r.supply === 1 ? "1/1" : `${String(card.serial).padStart(String(r.supply).length, "0")}/${r.supply}`;

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--hx", `${20 + x * 60}%`);
    el.style.setProperty("--hy", `${20 + y * 60}%`);
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 18}deg) rotateX(${(0.5 - y) * 18}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }

  const fallback = portraitUri(t.name, cat?.bg);
  const art = (
    <Pic className="cc-art" srcs={portraitSources(t)} fallback={fallback} alt={t.name} style={{ objectPosition: t.artPos }} draggable={false} />
  );

  /* Chaque rareté a sa mise en scène : le décor, la place du personnage, l'effet. */
  let scene: React.ReactNode;
  switch (r.id) {
    case "millionaire":
      scene = (
        <>
          <div className="cc-note" />
          {BILLS.map(([x, d, dur, rot], i) => (
            <span key={i} className="cc-bill" style={{ left: `${x}%`, animationDelay: `${d}s`, animationDuration: `${dur}s`, "--rot": `${rot}deg` } as React.CSSProperties} />
          ))}
          <div className="cc-oval">{art}<div className="cc-engrave" /></div>
          <span className="cc-denom tl">1M</span>
          <span className="cc-denom tr">1M</span>
        </>
      );
      break;
    case "legendary":
      scene = (
        <>
          <div className="cc-sun" />
          {DUST.map(([x, y, d], i) => (
            <span key={i} className="cc-dust" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
          ))}
          <div className="cc-arch">{art}<div className="cc-holo" /></div>
        </>
      );
      break;
    case "og":
      scene = (
        <>
          {art}
          <div className="cc-scan" />
          <div className="cc-grain" />
          <div className="cc-vignette" />
        </>
      );
      break;
    case "mythic":
      scene = mythic ? (
        <>
          <div className="cc-rays" />
          <div className="cc-panel top"><Pic srcs={portraitSources(t, mythic.banner)} fallback={fallback} alt="" style={{ objectPosition: "50% 48%" }} draggable={false} /></div>
          <div className="cc-panel left"><Pic srcs={portraitSources(t, mythic.banner)} fallback={fallback} alt="" style={{ objectPosition: "8% 40%" }} draggable={false} /></div>
          <div className="cc-panel right"><Pic srcs={portraitSources(t, mythic.banner)} fallback={fallback} alt="" style={{ objectPosition: "92% 38%" }} draggable={false} /></div>
          <div className="cc-sticker"><Pic srcs={portraitSources(t, mythic.avatar)} fallback={fallback} alt={t.name} draggable={false} /></div>
          {SPARKS.map(([x, y, d], i) => (
            <span key={i} className="cc-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
          ))}
          {theme === "sponge" &&
            BUBBLES.map(([x, s, d], i) => (
              <span key={i} className="cc-bubble" style={{ left: `${x}%`, width: `${s}cqw`, height: `${s}cqw`, animationDuration: `${d}s`, animationDelay: `${i * 1.2}s` }} />
            ))}
        </>
      ) : (
        <>{art}<div className="cc-holo" /></>
      );
      break;
    case "shiny":
      scene = (
        <>
          {art}
          <div className="cc-sheen" />
          {SPARKS.map(([x, y, d], i) => (
            <span key={i} className="cc-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
          ))}
        </>
      );
      break;
    default:
      scene = art;
  }

  return (
    <div
      ref={ref}
      className={`cc ${r.id} ${theme} ${live ? "is-live" : ""} ${className}`}
      style={{ "--cat": cat?.bg ?? "#8a8079" } as React.CSSProperties}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="cc-frame">
        <div className="cc-scene">
          {scene}
          {cat && (
            <span className="cc-cat">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPH[cat.id]} /></svg>
              {cat.name}
            </span>
          )}
          <div className="cc-plate">
            <span className="cc-name">{t.name}</span>
            <span className="cc-serial"><b>{r.name}</b>{serial}</span>
          </div>
        </div>
      </div>
      <div className="cc-glare" />
    </div>
  );
}
