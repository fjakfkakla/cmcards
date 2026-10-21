"use client";

import { useRef } from "react";
import "./card.css";
import { auraScene } from "./AuraScene";
import Pic from "./Pic";
import { type Card, type RarityId, category, rarity, serialOf, trader } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";

/* Le symbole de chaque rareté, à côté de son nom (grille de 24). */
const MARK: Record<RarityId, string> = {
  common: "M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z",
  rare: "M12 3l8 9-8 9-8-9z",
  shiny: "M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z",
  og: "M12 2l8.7 5v10L12 22l-8.7-5V7z",
  mythic: "M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z",
};

const SPARKS = [[18, 22, 0], [74, 16, 0.9], [62, 48, 1.7], [26, 58, 0.4], [82, 64, 2.1]];
const BUBBLES = [[10, 3.4, 7], [30, 2.4, 9], [58, 4.2, 6.5], [76, 2.8, 8.5], [90, 3.6, 10], [44, 3, 11]];
/* La foudre du thème volt : x, y, le délai, la taille (grille de 24 : un éclair). */
const BOLTS = [[9, 16, 0, 11], [79, 9, 1.4, 8], [72, 66, 2.3, 10], [14, 70, .8, 7], [46, 10, 3.1, 6]];
const BOLT = "M13 2 3 14h7l-1 8 10-12h-7z";

export default function CollectCard({ card, live = false, className = "" }: { card: Card; live?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = trader(card.trader);
  const cat = t.category ? category(t.category) : undefined;
  const r = rarity(card.rarity);
  const theme = r.id === "mythic" ? t.theme ?? "" : "";
  const mythic = r.id === "mythic" ? t.mythic : undefined;
  const serial = serialOf(card);

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
    el.style.setProperty("--px", `${x - 0.5}`);
    el.style.setProperty("--py", `${y - 0.5}`);
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 18}deg) rotateX(${(0.5 - y) * 18}deg)`;
  }
  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  }

  const fallback = portraitUri(t.name, cat?.bg);
  const art = (
    <Pic className="cc-art" srcs={portraitSources(t)} fallback={fallback} alt={t.name} style={{ objectPosition: t.artPos }} draggable={false} />
  );

  /* Chaque rareté a sa mise en scène : le décor, la place du personnage, l'effet.
     Un personnage qui a son set signature a les siennes, une par rareté. */
  let scene: React.ReactNode;
  let over: React.ReactNode;
  if (t.aura) ({ scene, over } = auraScene(r.id, t, fallback));
  else switch (r.id) {
    case "rare":
      scene = (
        <>
          <div className="cc-halftone" />
          <div className="cc-window">{art}<div className="cc-foil" /><div className="cc-holo" /></div>
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
          <span className="cc-stamp">OG</span>
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
          {theme === "volt" && (
            <>
              <div className="cc-static" />
              {BOLTS.map(([x, y, d, s], i) => (
                <svg key={i} className="cc-bolt" viewBox="0 0 24 24" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%`, width: `${s}cqw`, animationDelay: `${d}s` }}>
                  <path d={BOLT} />
                </svg>
              ))}
            </>
          )}
        </>
      ) : (
        <>
          <div className="cc-rays" />
          <div className="cc-medal">{art}<div className="cc-holo" /></div>
          {SPARKS.map(([x, y, d], i) => (
            <span key={i} className="cc-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
          ))}
        </>
      );
      break;
    case "shiny":
      scene = (
        <>
          {art}
          <div className="cc-rainbow" />
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
      className={`cc ${t.aura ? `aura ka-${r.id}` : `${r.id} ${theme}`} ${t.mono ? "mono" : ""} ${live ? "is-live" : ""} ${className}`}
      style={{ "--cat": cat?.bg ?? "#8a8079" } as React.CSSProperties}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="cc-frame">
        <div className="cc-scene">
          {scene}
          {cat && (
            <span className={`cc-cat ${cat.id}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={cat.glyph} /></svg>
              {cat.name}
            </span>
          )}
          <div className="cc-plate">
            <span className="cc-name">{t.name}</span>
            <span className="cc-serial">
              <b><svg className="cc-mark" viewBox="0 0 24 24" aria-hidden="true"><path d={MARK[r.id]} /></svg>{r.name}</b>
              {serial}
            </span>
          </div>
        </div>
        {over}
      </div>
      <div className="cc-glare" />
    </div>
  );
}
