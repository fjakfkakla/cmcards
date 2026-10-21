"use client";

import { useRef } from "react";
import "./trading-card.css";
import { CARD_TEXT, COINS, type Card, fmtAmount, fmtUsd, rarity, trader, usdOf } from "@/lib/data";

const RARITY_MARK: Record<string, string> = {
  commune: "●", "peu-commune": "◆", rare: "★", epique: "★★", legendaire: "★★★", exclusive: "✦",
};

/* La couleur du carton par rareté : seule l'Exclusive est jaune éponge. */
const EDGE: Record<string, [string, string, string]> = {
  commune: ["#e9e4da", "#d3cbbd", "#fffdf6"],
  "peu-commune": ["#9ee0a8", "#77c983", "#f6fff2"],
  rare: ["#9ccdf5", "#74b1e4", "#f3f9ff"],
  epique: ["#ff9a8c", "#ef7464", "#fff4f0"],
  legendaire: ["#ffb85c", "#f0982c", "#fff6e6"],
  exclusive: ["#ffd12e", "#f2bd00", "#fff6d6"],
};

export default function TradingCard({ card, live = false, className = "" }: { card: Card; live?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = trader(card.trader);
  const txt = CARD_TEXT[card.trader];
  const coin = COINS[card.coin];
  const r = rarity(card.rarity);
  const [edge, edge2, stock] = EDGE[card.rarity];
  // Les deux raretés du haut sont en pleine illustration, comme les cartes rares d'un vrai booster.
  const full = card.rarity === "exclusive" || card.rarity === "legendaire";
  const bubbles =
    card.rarity === "exclusive" &&
    [
      [12, 3.2, 7], [28, 2.2, 9], [61, 4, 6.5], [78, 2.6, 8], [88, 3.4, 10], [44, 2.8, 11],
    ].map(([left, size, dur], i) => (
      <span
        key={i}
        className="tc-bubble"
        style={{ left: `${left}%`, bottom: "-8%", width: `${size}cqw`, height: `${size}cqw`, animationDuration: `${dur}s`, animationDelay: `${i * 1.3}s` }}
      />
    ));

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
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - y) * 16}deg)`;
  }
  function leave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      className={`tc ${full ? "full" : ""} ${live ? "is-live" : ""} ${className}`}
      style={{ "--edge": edge, "--edge-2": edge2, "--stock": stock, "--coin": coin.color } as React.CSSProperties}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="tc-body">
        <div className="tc-head">
          <span className="tc-stage">{txt.stage}</span>
          <span className="tc-name">{t.name}</span>
          <span className="tc-val">
            PV<b>{txt.value}</b>
          </span>
          <span className="tc-coin" title={coin.name}>{coin.ticker.slice(0, 1)}</span>
        </div>

        <div className="tc-art">
          {t.art && <img src={t.art} alt="" style={{ objectPosition: t.artPos, transform: t.artZoom ? `scale(${t.artZoom})` : undefined, transformOrigin: t.artPos }} draggable={false} />}
          {bubbles}
          {r.holo && <div className="tc-holo" />}
        </div>
        {!full && <div className="tc-strip">{txt.strip}</div>}

        {full && <div className="tc-spacer" />}
        <div className="tc-moves">
          {txt.moves.map((m, i) => (
            <div key={m.name}>
              {i > 0 && <div className="tc-rule" style={{ marginBottom: "1.4cqw" }} />}
              <div className="tc-move">
                <span className="tc-cost">
                  {Array.from({ length: m.cost }, (_, k) => (
                    <span key={k} className="tc-coin sm">{coin.ticker.slice(0, 1)}</span>
                  ))}
                </span>
                <h4>{m.name}</h4>
                <span className="tc-dmg">{m.dmg}</span>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="tc-vault">
          <span className="tc-coin sm">{coin.ticker.slice(0, 1)}</span>
          <div>
            <span>Contient</span>
            <b>{fmtAmount(card.amount)} {coin.ticker}</b>
          </div>
          <span className="usd">{fmtUsd(usdOf(card))}</span>
        </div>

        <div className="tc-stats">
          <div>faiblesse<b>{txt.weak}</b></div>
          <div>résistance<b>{txt.resist}</b></div>
          <div>retraite<b>{"●".repeat(txt.retreat)}</b></div>
        </div>

        <div className="tc-flavor">{txt.flavor}</div>

        <div className="tc-foot">
          <span>Illus. {txt.illus}</span>
          <span className="rar">
            {String(card.serial).padStart(3, "0")}/{String(card.supply).padStart(3, "0")} {RARITY_MARK[card.rarity]} {r.name}
          </span>
        </div>
      </div>
      <div className="tc-glare" />
    </div>
  );
}
