"use client";

/* La bande-annonce de cm cards : 36 secondes, 120 BPM (un temps = 0,5 s).
   Tout est une fonction du temps `t` : la page ne bouge pas toute seule, le moteur de
   tools/trailer la règle image par image (window.__seek), puis la photographie.
   ?play la joue en direct, pour regarder le montage dans le navigateur.

     0     « TRENCHES ARE DEAD? » : la courbe qui s'effondre, le texte qui grésille
     4     BOOM : le booster Legend jaillit, les autres familles autour
     7     l'ouverture filmée dans l'app : couper, la bande des raretés, les cartes
     14.5  la Mythic de quant en grand, 1 sur 1
     17.5  les cinq raretés de Kimchi, une par temps
     21.5  la revente filmée : le prix, la mise en vente, le marché
     27.5  MAKE SOL : les ventes qui tombent
     31.5  le logo, le booster offert */

import { useEffect, useState } from "react";
import "./trailer.css";
import BoosterPack from "../BoosterPack";
import CollectCard from "../CollectCard";
import { GLOW } from "../Opening";
import { type Card, PACKS, type RarityId, rarity } from "@/lib/data";

export const DUR = 36;
const W = 1920, H = 1080;

/* ---------- le temps ---------- */
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const out3 = (p: number) => 1 - (1 - p) ** 3;
const in3 = (p: number) => p ** 3;
const io3 = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const outExpo = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
const outBack = (p: number, s = 1.7) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2;
const fract = (x: number) => x - Math.floor(x);
const hash = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
/* une suite de points (temps, valeur), reliés en ligne droite ou par `ease` */
function key(t: number, ks: [number, number][], ease: (p: number) => number = (p) => p) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++)
    if (t <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], ease(seg(t, ks[i - 1][0], ks[i][0])));
  return ks[ks.length - 1][1];
}
/* la secousse : chaque impact (temps, force) s'éteint en 0,45 s */
function shake(t: number, hits: number[][]) {
  let x = 0, y = 0, r = 0;
  for (const [t0, amp, len = 0.45] of hits) {
    const d = t - t0;
    if (d < 0 || d > len) continue;
    const a = amp * (1 - d / len) ** 2, k = Math.floor(t * 60);
    x += (hash(k) - 0.5) * 2 * a; y += (hash(k + 7) - 0.5) * 2 * a; r += (hash(k + 13) - 0.5) * a * 0.06;
  }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
}
const flash = (t: number, hits: number[], len = 0.35) =>
  Math.max(0, ...hits.map((h) => (t >= h && t < h + len ? (1 - (t - h) / len) ** 2 : 0)));

/* ---------- les plans filmés (tools/trailer/shoot.cjs, 60 i/s) ---------- */
type Clip = { dir: string; frames: number; map: [number, number][]; cam: [number, number, number, number][] };
/* map : (temps de la bande-annonce, image du plan) ; cam : (temps, zoom, x, y) en 0..1 */
const CLIPS: Record<string, Clip> = {
  open: {
    dir: "open", frames: 849,
    map: [[7, 10], [7.5, 72], [8.5, 186], [9.5, 330], [10, 366], [11, 444], [11.1, 452], [13, 640], [13.5, 712], [14.5, 849]],
    cam: [[7, 1.5, 0.5, 0.36], [7.5, 1.55, 0.5, 0.36], [8.4, 1.25, 0.5, 0.42], [8.6, 1.6, 0.5, 0.45], [9.9, 1.9, 0.5, 0.46], [10.3, 2.1, 0.5, 0.47],
      [11, 1.5, 0.5, 0.5], [11.15, 1.05, 0.5, 0.48], [13, 1.0, 0.5, 0.45], [13.4, 1.15, 0.78, 0.45], [13.7, 1.35, 0.5, 0.48], [14.5, 1.5, 0.5, 0.5]],
  },
  sell: {
    dir: "sell", frames: 323,
    map: [[21.5, 20], [22.6, 117], [24.4, 240], [25.5, 323]],
    cam: [[21.5, 1.0, 0.5, 0.5], [22.4, 1.0, 0.5, 0.5], [22.9, 1.35, 0.62, 0.55], [24.6, 1.45, 0.55, 0.62], [25.5, 1.3, 0.6, 0.6]],
  },
  market: {
    dir: "market", frames: 276,
    map: [[25.5, 10], [27.5, 276]],
    cam: [[25.5, 1.1, 0.5, 0.4], [27.5, 1.0, 0.5, 0.5]],
  },
};
const pad = (n: number) => String(n).padStart(5, "0");

/* ---------- les cartes et les boosters ---------- */
const C = (trader: string, r: RarityId, serial: number): Card => ({ id: `${trader}-${r}`, trader, rarity: r, serial });
const LADDER: RarityId[] = ["common", "rare", "shiny", "og", "mythic"];
const SUPPLY = ["×5000", "×2000", "×500", "×50", "1 of 1"];
const KIMCHI = [C("kimchi", "common", 2214), C("kimchi", "rare", 941), C("kimchi", "shiny", 128), C("kimchi", "og", 7), C("kimchi", "mythic", 1)];
const QUANT = C("quant", "mythic", 1);
const FLYERS: [Card, string][] = [
  [C("ansem", "og", 12), "18.5"], [C("cented", "mythic", 1), "120"], [C("decu", "og", 3), "9.4"], [C("alon", "shiny", 121), "4.2"],
  [C("rasmr", "og", 19), "7.75"], [C("profit", "shiny", 54), "2.6"], [C("gake", "rare", 311), "0.85"], [C("nyhrox", "og", 8), "8.8"],
];
const FAN = [C("cented", "og", 31), C("decu", "shiny", 77), C("ansem", "shiny", 213), C("quant", "mythic", 1), C("kimchi", "og", 7), C("alon", "rare", 1187), C("gake", "mythic", 1)];
const pk = (id: string) => PACKS.find((p) => p.id === id)!;

/* ---------- les briques ---------- */

/* le grain du film : une seule texture, décalée à chaque image */
function Grain({ t, o = 0.12 }: { t: number; o?: number }) {
  const k = Math.floor(t * 24);
  return (
    <div className="tr-grain" style={{ opacity: o, transform: `translate(${-hash(k) * 400}px, ${-hash(k + 3) * 400}px)` }}>
      <svg width="2400" height="1500"><filter id="tr-n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.3" /></filter><rect width="100%" height="100%" filter="url(#tr-n)" /></svg>
    </div>
  );
}

/* les rayons qui tournent, comme sur la planche du booster */
function Rays({ t, a = "rgba(255,255,255,.18)", speed = 12, o = 1, x = 50, y = 50 }: { t: number; a?: string; speed?: number; o?: number; x?: number; y?: number }) {
  return <div className="tr-rays" style={{ opacity: o, background: `repeating-conic-gradient(from ${t * speed}deg at ${x}% ${y}%, ${a} 0 6deg, transparent 6deg 12deg)` }} />;
}

/* un texte en autocollant : il tombe (slam), tient, puis part en glissant */
function Slam({ t, at, out = 99, children, x = W / 2, y = H / 2, size = 150, rot = 0, color = "#fff", from = 2.4, align = "center", stroke = 0.09 }: {
  t: number; at: number; out?: number; children: React.ReactNode; x?: number; y?: number; size?: number; rot?: number; color?: string; from?: number;
  align?: "center" | "left" | "right"; stroke?: number;
}) {
  if (t < at || t > out + 0.25) return null;
  const p = seg(t, at, at + 0.3), q = seg(t, out, out + 0.22);
  const s = lerp(from, 1, outExpo(p)) * (1 + 0.025 * Math.sin((t - at) * 3)) * lerp(1, 0.6, in3(q));
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0%";
  return (
    <div className="tr-slam" style={{
      left: x, top: y, fontSize: size, color, opacity: seg(t, at, at + 0.06) * (1 - q),
      transform: `translate(${tx}, -50%) translateX(${-in3(q) * 260}px) rotate(${rot + (1 - outBack(p)) * -8}deg) scale(${s}) skewX(${-in3(q) * 20}deg)`,
      transformOrigin: align, WebkitTextStroke: `${size * stroke}px #1e1a16`, textShadow: `0 ${size * 0.07}px 0 #1e1a16`,
    }}>{children}</div>
  );
}

/* le grésillement : trois copies du texte (rouge, cyan, blanc) et des tranches décalées */
function Glitch({ t, text, x, y, size, g, color = "#fff" }: { t: number; text: string; x: number; y: number; size: number; g: number; color?: string }) {
  const k = Math.floor(t * 30);
  const dx = g * (6 + hash(k) * 22);
  const slices = [0, 1, 2, 3].map((i) => {
    const on = hash(k * 3 + i) < g * 0.9;
    const top = hash(k * 5 + i) * 90, h = 4 + hash(k * 7 + i) * 14;
    return on ? { top, h, dx: (hash(k * 11 + i) - 0.5) * 120 * g } : null;
  });
  const base = { left: x, top: y, fontSize: size };
  return (
    <div className="tr-glitch" style={base}>
      <span style={{ color: "#ff2a4a", transform: `translate(${-dx}px, ${dx * 0.2}px)`, opacity: 0.85 }}>{text}</span>
      <span style={{ color: "#27e8ff", transform: `translate(${dx}px, ${-dx * 0.2}px)`, opacity: 0.85 }}>{text}</span>
      <span style={{ color }}>{text}</span>
      {slices.map((s, i) => s && (
        <span key={i} style={{ color, clipPath: `inset(${s.top}% 0 ${Math.max(0, 100 - s.top - s.h)}% 0)`, transform: `translateX(${s.dx}px)` }}>{text}</span>
      ))}
    </div>
  );
}

/* des éclats qui partent d'un point, retombent et s'éteignent */
function Burst({ t, at, x, y, n = 36, seed = 1, colors = ["#ffd12e", "#fff", "#ff9a1f"], speed = 900, size = 28, len = 1.4 }: {
  t: number; at: number; x: number; y: number; n?: number; seed?: number; colors?: string[]; speed?: number; size?: number; len?: number;
}) {
  const d = t - at;
  if (d < 0 || d > len) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = hash(seed * 100 + i) * Math.PI * 2, v = speed * (0.35 + hash(seed * 200 + i) * 0.9);
        const px = x + Math.cos(a) * v * out3(Math.min(1, d / len)) * 0.9;
        const py = y + Math.sin(a) * v * out3(Math.min(1, d / len)) * 0.9 + 500 * d * d;
        const s = size * (0.4 + hash(seed * 300 + i)) * (1 - d / len);
        return (
          <svg key={i} className="tr-spark" viewBox="0 0 24 24" style={{ left: px, top: py, width: s, height: s, transform: `translate(-50%,-50%) rotate(${d * 300 * (hash(i) - 0.5)}deg)` }}>
            <path d="M12 0Q13.2 10.8 24 12Q13.2 13.2 12 24Q10.8 13.2 0 12Q10.8 10.8 12 0Z" fill={colors[i % colors.length]} stroke="#1e1a16" strokeWidth="1.2" />
          </svg>
        );
      })}
    </>
  );
}

/* l'onde de choc d'un impact */
function Ring({ t, at, x = W / 2, y = H / 2, color = "#fff", max = 1400 }: { t: number; at: number; x?: number; y?: number; color?: string; max?: number }) {
  const d = seg(t, at, at + 0.6);
  if (t < at || d >= 1) return null;
  const r = max * out3(d);
  return <div className="tr-ring" style={{ left: x - r / 2, top: y - r / 2, width: r, height: r, borderColor: color, borderWidth: 40 * (1 - d), opacity: 1 - d }} />;
}

/* un plan filmé, posé comme un écran incliné dans l'espace ; la caméra cadre dedans */
function Screen({ t, clip, w = 1500, rotY = -10, rotX = 5, x = W / 2, y = H / 2, z = 0, o = 1 }: {
  t: number; clip: Clip; w?: number; rotY?: number; rotX?: number; x?: number; y?: number; z?: number; o?: number;
}) {
  const h = w / 1.6;
  const f = Math.round(clamp(key(t, clip.map), 0, clip.frames - 1));
  const cz = key(t, clip.cam.map(([a, zz]) => [a, zz]), io3);
  const cx = key(t, clip.cam.map(([a, , xx]) => [a, xx]), io3);
  const cy = key(t, clip.cam.map(([a, , , yy]) => [a, yy]), io3);
  const iw = w * cz, ih = h * cz;
  const left = clamp(w / 2 - cx * iw, w - iw, 0), top = clamp(h / 2 - cy * ih, h - ih, 0);
  return (
    <div className="tr-screen" style={{ left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o,
      transform: `perspective(2400px) translateZ(${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/trailer/${clip.dir}/${pad(f)}.jpg`} alt="" style={{ left, top, width: iw, height: ih }} />
      <div className="tr-screen-sheen" style={{ backgroundPosition: `${(t * 18) % 200}% 0` }} />
    </div>
  );
}

/* une carte en 3D, avec la lumière qui suit son inclinaison */
function Card3D({ card, x, y, w, ry = 0, rx = 0, rz = 0, s = 1, z = 0, o = 1, shadow = true }: {
  card: Card; x: number; y: number; w: number; ry?: number; rx?: number; rz?: number; s?: number; z?: number; o?: number; shadow?: boolean;
}) {
  const mx = 50 + ry * 1.6, my = 40 - rx * 1.6;
  return (
    <div className={`tr-card ${shadow ? "" : "flat"}`} style={{
      left: x - w / 2, top: y - (w * 88) / 63 / 2, width: w, opacity: o,
      transform: `perspective(1800px) translateZ(${z}px) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${s})`,
      ["--mx" as string]: `${mx}%`, ["--my" as string]: `${my}%`, ["--hx" as string]: `${20 + mx * 0.6}%`, ["--hy" as string]: `${20 + my * 0.6}%`,
    }}>
      <CollectCard card={card} live />
    </div>
  );
}

/* la pièce de SOL : le disque et les trois barres */
function Sol({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  return (
    <svg className="tr-sol" viewBox="0 0 100 100" style={{ left: x, top: y, width: s, height: s, transform: `translate(-50%,-50%) rotate(${r}deg)` }}>
      <defs><linearGradient id="tr-solg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#9945ff" /><stop offset="1" stopColor="#14f195" /></linearGradient></defs>
      <circle cx="50" cy="52" r="46" fill="#1e1a16" />
      <circle cx="50" cy="48" r="44" fill="#16121f" stroke="#1e1a16" strokeWidth="5" />
      <g fill="url(#tr-solg)">
        <path d="M30 30h44l-8 8H22z" /><path d="M22 44h44l8 8H30z" /><path d="M30 58h44l-8 8H22z" />
      </g>
    </svg>
  );
}

/* ---------- les scènes ---------- */

/* 0–4 : la courbe d'un memecoin qui meurt, « TRENCHES ARE DEAD? » */
const CANDLES = (() => {
  const out: { o: number; c: number; h: number; l: number }[] = [];
  let p = 0.55;
  for (let i = 0; i < 64; i++) {
    const pump = i < 22 ? 0.022 : i < 30 ? 0.004 : -0.035 - (i > 44 ? 0.02 : 0);
    const n = p + pump + (hash(i + 9) - 0.5) * 0.06;
    const c = clamp(n, 0.03, 0.95);
    out.push({ o: p, c, h: Math.max(p, c) + hash(i + 2) * 0.03, l: Math.min(p, c) - hash(i + 5) * 0.03 });
    p = c;
  }
  return out;
})();
function Intro({ t }: { t: number }) {
  const shown = Math.floor(seg(t, 0, 3.3) * CANDLES.length);
  const cw = 34, push = lerp(1, 1.45, io3(seg(t, 0, 4)));
  const last = CANDLES[Math.max(0, shown - 1)];
  const camX = W / 2 - Math.max(0, shown - 20) * cw;
  const g = t < 0.5 ? 0 : t < 2 ? 0.25 + 0.3 * hash(Math.floor(t * 12)) * (hash(Math.floor(t * 7)) > 0.6 ? 1 : 0) : lerp(0.35, 1, seg(t, 2.6, 3.7));
  const pct = -Math.round(lerp(12, 99.7, seg(t, 1.6, 3.4)) * 10) / 10;
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(70% 70% at 50% 45%, #1d0f10, #050405)", opacity: 1 - seg(t, 3.72, 3.8) }}>
      <div className="tr-layer" style={{ transform: `scale(${push}) ${shake(t, [[2, 26], [3.2, 18, 0.6]])}` }}>
        <div className="tr-grid" style={{ backgroundPosition: `${camX * 0.4}px 0` }} />
        <svg className="tr-layer" viewBox={`0 0 ${W} ${H}`}>
          <g transform={`translate(${camX - 900} 0)`}>
            {CANDLES.slice(0, shown).map((k, i) => {
              const up = k.c >= k.o, Y = (v: number) => 250 + (1 - v) * 640;
              const col = up ? "#1fd28a" : "#ff3b4f";
              return (
                <g key={i} opacity={0.35 + 0.65 * (i / Math.max(1, shown))}>
                  <rect x={900 + i * cw + cw / 2 - 1.5} y={Y(k.h)} width="3" height={Math.max(2, Y(k.l) - Y(k.h))} fill={col} />
                  <rect x={900 + i * cw + 5} y={Y(Math.max(k.o, k.c))} width={cw - 10} height={Math.max(4, Math.abs(Y(k.o) - Y(k.c)))} rx="3" fill={col} />
                </g>
              );
            })}
          </g>
          {shown > 30 && (
            <g transform={`translate(${Math.min(W - 260, camX - 900 + 900 + shown * cw + 24)} ${250 + (1 - last.c) * 640 - 26})`}>
              <rect width="200" height="52" rx="12" fill="#ff3b4f" />
              <text x="100" y="37" textAnchor="middle" fill="#fff" style={{ font: "800 30px var(--font-display)" }}>{pct}%</text>
            </g>
          )}
        </svg>
      </div>
      <div className="tr-layer" style={{ transform: shake(t, [[0.5, 10], [1.5, 14], [2, 40, 0.6], [3.2, 30, 0.7]]) }}>
        {t >= 0.5 && <Glitch t={t} text="TRENCHES" x={W / 2} y={key(t, [[0.5, 360], [1.5, 330]], out3)} size={key(t, [[0.5, 230], [0.7, 190], [3.7, 210]], out3)} g={g} />}
        {t >= 1.5 && <Glitch t={t + 0.37} text={t < 2 ? "ARE" : "ARE DEAD?"} x={W / 2} y={620} size={key(t, [[1.5, 240], [1.7, 190], [2, 250], [2.2, 210], [3.7, 240]], out3)} g={Math.max(g, t < 2.2 && t > 2 ? 1 : 0)} color={t < 2 ? "#fff" : "#ff3b4f"} />}
      </div>
      <div className="tr-layer tr-vignette" />
    </div>
  );
}

/* 4–7 : BOOM, le booster Legend jaillit */
function Boom({ t }: { t: number }) {
  const d = t - 4;
  const fly = outBack(seg(t, 4, 4.55), 1.3);
  const spin = lerp(-540, 0, out3(seg(t, 4, 4.7))) + Math.sin(d * 1.6) * 14 * seg(t, 4.6, 5);
  const push = seg(t, 6.5, 7);
  const sideIn = (i: number) => outBack(seg(t, 5 + i * 0.25, 5.45 + i * 0.25), 1.4);
  const sides: [string, number, number, number, number][] = [["famous", -1, 520, 0.62, 0], ["trencher", 1, 1400, 0.62, 1], ["holder", -1, 170, 0.48, 2], ["dev", 1, 1750, 0.48, 3]];
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(60% 60% at 50% 50%, #ffe45c, #ffb21a 55%, #e8780f)" }}>
      <div className="tr-layer" style={{ transform: `${shake(t, [[4, 46, 0.7], [4.5, 20]])} scale(${lerp(1, 3.2, in3(push))})`, transformOrigin: "50% 48%" }}>
        <Rays t={t} a="rgba(255,255,255,.28)" speed={18} />
        <div className="tr-layer" style={{ background: "radial-gradient(40% 40% at 50% 50%, rgba(255,255,255,.75), transparent 70%)" }} />
        {sides.map(([id, side, x, s, i]) => {
          const p = sideIn(i);
          return (
            <div key={id} className="tr-pack" style={{ left: x - 160, top: 540 - 256 + (i > 1 ? 40 : 0), width: 320, opacity: seg(t, 5 + i * 0.25, 5.1 + i * 0.25),
              transform: `perspective(1600px) translateX(${(1 - p) * side * 700}px) rotateY(${side * -24 + Math.sin(d * 1.3 + i) * 6}deg) rotateZ(${side * 6}deg) scale(${s})`,
              filter: i > 1 ? "brightness(.85)" : undefined }}>
              <BoosterPack pack={pk(id)} floating />
            </div>
          );
        })}
        <div className="tr-pack" style={{ left: W / 2 - 220, top: 500 - 352, width: 440,
          transform: `perspective(1600px) translateZ(${lerp(-3000, 0, fly)}px) rotateY(${spin}deg) rotateZ(${lerp(-30, 0, out3(seg(t, 4, 4.6)))}deg)` }}>
          <BoosterPack pack={pk("legend")} floating={t > 4.7} />
        </div>
        <Burst t={t} at={4.02} x={W / 2} y={500} n={44} seed={3} speed={1200} size={44} len={1.6} />
        <Burst t={t} at={4.55} x={W / 2} y={500} n={20} seed={8} colors={["#fff", "#ffd12e"]} speed={700} size={30} />
        <Ring t={t} at={4} y={500} max={2400} />
        <Ring t={t} at={4.5} y={500} color="#1e1a16" max={1600} />
      </div>
      <Slam t={t} at={4.5} out={6.4} y={940} size={124}>COLLECTOR PACKS</Slam>
      <Slam t={t} at={5} out={6.4} y={120} size={52} from={1.8} color="#ffd12e">SEASON 1 · ON SOLANA</Slam>
    </div>
  );
}

/* 7–14.5 : l'ouverture, filmée dans l'app */
function Opening({ t }: { t: number }) {
  const ry = key(t, [[7, -16], [9, -6], [11, 8], [13, -4], [14.5, -10]], io3);
  const rx = key(t, [[7, 7], [11, 3], [14.5, 6]], io3);
  const zin = lerp(-900, 0, outExpo(seg(t, 7, 7.5)));
  const bg = t < 10 ? "#ffc21a" : "#9fb6f5";
  return (
    <div className="tr-layer" style={{ background: `radial-gradient(70% 70% at 50% 50%, #2a2017, #0c0907)` }}>
      <Rays t={t} a={t < 10 ? "rgba(255,194,26,.12)" : "rgba(159,182,245,.16)"} speed={10} />
      <div className="tr-layer" style={{ background: `radial-gradient(45% 50% at 50% 50%, ${bg}55, transparent 70%)`, opacity: 0.8 + flash(t, [10]) }} />
      <div className="tr-layer" style={{ transform: shake(t, [[7.5, 24], [10, 38, 0.7], [11.1, 14], [13.5, 14]]) }}>
        <Screen t={t} clip={CLIPS.open} w={1440} rotY={ry} rotX={rx} x={1010} y={540} z={zin} />
        <Burst t={t} at={7.52} x={1010} y={300} n={30} seed={5} speed={900} size={34} />
        <Burst t={t} at={10} x={1010} y={540} n={50} seed={6} colors={["#9fb6f5", "#fff", "#c38bff", "#ffd12e"]} speed={1300} size={40} len={1.6} />
        <Ring t={t} at={10} x={1010} color="#c9d6ff" max={2200} />
      </div>
      <Slam t={t} at={7} out={8.4} x={110} y={760} size={150} align="left" rot={-4}>OPEN</Slam>
      <Slam t={t} at={7.25} out={8.4} x={110} y={920} size={150} align="left" rot={-4} color="#ffd12e">BOOSTERS</Slam>
      <Slam t={t} at={8.5} out={9.9} x={W - 90} y={160} size={110} align="right" rot={3}>WHAT&apos;S INSIDE?</Slam>
      <Slam t={t} at={10} out={10.95} x={W / 2 + 50} y={900} size={210} rot={-3} color="#c9b8ff">MYTHIC!</Slam>
      <Slam t={t} at={11.5} out={12.9} x={110} y={800} size={120} align="left" rot={-3}>PACK THE</Slam>
      <Slam t={t} at={11.75} out={12.9} x={110} y={935} size={150} align="left" rot={-3} color="#ffd12e">TRADERS</Slam>
    </div>
  );
}

/* 14.5–17.5 : la Mythic de quant, 1 sur 1 */
function Mythic({ t }: { t: number }) {
  const d = t - 14.5;
  const p = outBack(seg(t, 14.5, 15), 1.2);
  const ry = lerp(-200, 0, out3(seg(t, 14.5, 15.1))) + Math.sin(d * 1.7) * 22;
  const rx = Math.sin(d * 1.1 + 1) * 8;
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(60% 70% at 50% 50%, #5b2ab8, #1a0838 60%, #07020f)" }}>
      <Rays t={t} a="rgba(201,170,255,.13)" speed={-14} />
      {Array.from({ length: 40 }, (_, i) => {
        const x = hash(i * 3) * W, sp = 80 + hash(i * 5) * 160, y = H + 40 - fract(hash(i * 7) + (d * sp) / 1200) * 1240;
        const s = 6 + hash(i * 9) * 14;
        return <span key={i} className="tr-ember" style={{ left: x + Math.sin(d * 2 + i) * 20, top: y, width: s, height: s }} />;
      })}
      <div className="tr-layer" style={{ transform: shake(t, [[14.5, 30], [15.5, 12]]) }}>
        <div className="tr-glow" style={{ left: W / 2 - 500, top: H / 2 - 500, width: 1000, height: 1000, opacity: 0.6 + 0.2 * Math.sin(d * 4) }} />
        <Card3D card={QUANT} x={W / 2} y={540} w={540} ry={ry} rx={rx} s={lerp(0.2, 1, p) * (1 + d * 0.03)} />
        <Burst t={t} at={14.52} x={W / 2} y={540} n={46} seed={11} colors={["#c38bff", "#fff", "#ff7ad9", "#9fb6f5"]} speed={1300} size={40} len={1.6} />
        <Ring t={t} at={14.5} color="#e9d5ff" max={2400} />
      </div>
      <Slam t={t} at={15} out={17.2} x={330} y={500} size={260} rot={-6}>1/1</Slam>
      <Slam t={t} at={15.5} out={17.2} x={1580} y={440} size={96} rot={4} color="#e9d5ff">ONE MYTHIC</Slam>
      <Slam t={t} at={15.75} out={17.2} x={1580} y={560} size={96} rot={4}>PER TRADER</Slam>
    </div>
  );
}

/* 17.5–21.5 : les cinq raretés, une par temps */
function Ladder({ t }: { t: number }) {
  const landed = LADDER.filter((_, i) => t >= 17.5 + i * 0.5).length;
  const top = LADDER[Math.max(0, landed - 1)];
  const exit = seg(t, 21, 21.5);
  return (
    <div className="tr-layer" style={{ background: `radial-gradient(70% 70% at 50% 50%, ${GLOW[top]}, #1e1a16 85%)` }}>
      <Rays t={t} a="rgba(255,255,255,.14)" speed={16} />
      <div className="tr-layer" style={{ background: "#fff", opacity: 0.55 * flash(t, LADDER.map((_, i) => 17.5 + i * 0.5), 0.25) }} />
      <div className="tr-layer" style={{ transform: shake(t, LADDER.map((_, i) => [17.5 + i * 0.5, 12 + i * 5])) }}>
        {KIMCHI.map((c, i) => {
          const at = 17.5 + i * 0.5;
          if (t < at - 0.2) return null;
          const p = outBack(seg(t, at - 0.2, at), 1.5);
          const x = W / 2 + (i - 2) * 350, y = 520 + Math.abs(i - 2) * 22;
          const wob = Math.sin((t - at) * 2.4 + i) * 6;
          const ex = in3(seg(t, 21 + i * 0.05, 21.4 + i * 0.05));
          return (
            <div key={i}>
              <Card3D card={c} x={x - ex * 2600} y={y + (1 - p) * 900} w={300} rz={(i - 2) * 4 + (1 - p) * 40} ry={wob + ex * -60} rx={(1 - p) * 30} s={i === 4 ? 1.06 : 1} />
              {t >= at && (
                <div className="tr-tag" style={{ left: x - ex * 2600, top: y + 250, transform: `translate(-50%, 0) scale(${outBack(seg(t, at, at + 0.25), 2)}) rotate(${(i - 2) * 4}deg)`, background: GLOW[c.rarity] }}>
                  <b>{rarity(c.rarity).name}</b><span>{SUPPLY[i]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Slam t={t} at={20} out={20.95} x={W / 2} y={110} size={120}>5 RARITIES</Slam>
      <Slam t={t} at={20.5} out={20.95} x={W / 2} y={985} size={90} color="#ffd12e">FIXED SUPPLY</Slam>
      {exit > 0 && <div className="tr-layer tr-streaks" style={{ opacity: Math.sin(exit * Math.PI) }} />}
    </div>
  );
}

/* 21.5–27.5 : la revente, filmée dans l'app */
function Resell({ t }: { t: number }) {
  const mk = t >= 25.5;
  const enter = outExpo(seg(t, 21.5, 22));
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(70% 70% at 50% 50%, #133a2c, #050d0a)" }}>
      <Rays t={t} a="rgba(20,241,149,.08)" speed={8} />
      <div className="tr-layer" style={{ transform: shake(t, [[25.5, 20]]) }}>
        {!mk
          ? <Screen t={t} clip={CLIPS.sell} w={1320} rotY={key(t, [[21.5, 12], [25.5, 4]], io3)} rotX={4} x={W / 2 + 250 + (1 - enter) * 1600} y={540} />
          : <Screen t={t} clip={CLIPS.market} w={1500} rotY={key(t, [[25.5, -12], [27.5, -6]], io3)} rotX={6} x={W / 2 - 60} y={560} z={lerp(-500, 0, outExpo(seg(t, 25.5, 26)))} />}
      </div>
      <Slam t={t} at={21.75} out={23.6} x={90} y={420} size={140} align="left" rot={-4}>RESELL</Slam>
      <Slam t={t} at={22} out={23.6} x={90} y={570} size={110} align="left" rot={-4} color="#14f195">YOUR CARDS</Slam>
      <Slam t={t} at={23.75} out={25.3} x={90} y={820} size={110} align="left" rot={-3}>YOUR PRICE.</Slam>
      <Slam t={t} at={25.75} out={27.3} x={W - 80} y={140} size={120} align="right" rot={3} color="#ffd12e">THE MARKET</Slam>
    </div>
  );
}

/* 27.5–31.5 : MAKE SOL */
function MakeSol({ t }: { t: number }) {
  const total = lerp(0, 147.35, out3(seg(t, 29, 30.8)));
  const toasts: [number, string, string, number][] = [[29.25, "quant · Mythic", "120", 0], [29.75, "Ansem · OG", "18.5", 1], [30.25, "Kimchi · Shiny", "6.9", 2]];
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(50% 60% at 20% 40%, #4b1f9e, transparent 70%), radial-gradient(50% 60% at 85% 70%, #0d7a52, transparent 70%), #0a0712" }}>
      {/* les cartes vendues qui passent */}
      {FLYERS.map(([c, price], i) => {
        const at = 26.7 + i * 0.4, q = (t - at) / 2.2;
        if (q < 0 || q > 1) return null;
        const side = i % 2 ? 1 : -1;
        const x = W / 2 + side * lerp(180, 900, q) + (hash(i) - 0.5) * 200, y = 540 + (hash(i + 4) - 0.5) * 520;
        const z = lerp(-1800, 700, q);
        return (
          <div key={i} style={{ opacity: seg(q, 0, 0.15) * (1 - seg(q, 0.85, 1)) }}>
            <Card3D card={c} x={x} y={y} w={230} z={z} ry={side * -30} rz={side * 8} />
            <div className="tr-sold" style={{ left: x, top: y - 10, transform: `translate(-50%, -50%) perspective(1800px) translateZ(${z + 40}px) rotateY(${side * -30}deg) rotate(${-14 + side * 6}deg)` }}>
              SOLD <span>{price} SOL</span>
            </div>
          </div>
        );
      })}
      {/* la pluie de SOL */}
      {Array.from({ length: 26 }, (_, i) => {
        const st = 27.1 + hash(i * 3) * 3;
        if (t < st) return null;
        const q = t - st;
        return <Sol key={i} x={hash(i * 5) * W} y={-120 + q * q * 900 + q * 300} s={70 + hash(i * 7) * 90} r={q * 220 * (hash(i) - 0.5)} />;
      })}
      <div className="tr-layer" style={{ transform: shake(t, [[28, 22], [28.5, 40, 0.6]]) }}>
        <Slam t={t} at={28} out={31.2} x={W / 2} y={300} size={170} rot={-3}>MAKE</Slam>
        <Slam t={t} at={28.5} out={31.2} x={W / 2} y={540} size={330} rot={-3} color="#14f195">SOL</Slam>
        {t >= 29 && (
          <div className="tr-total" style={{ opacity: seg(t, 29, 29.15) * (1 - seg(t, 31.2, 31.4)), transform: `translate(-50%, -50%) scale(${outBack(seg(t, 29, 29.3), 2)})` }}>
            <span>+{total.toFixed(2)}</span> SOL
          </div>
        )}
      </div>
      {toasts.map(([at, who, sol, i]) => t >= at && (
        <div key={i} className="tr-toast" style={{ left: i === 1 ? W - 560 : 80, top: 120 + i * 120 + (i === 1 ? 500 : 0),
          opacity: 1 - seg(t, 31.1, 31.3), transform: `translateX(${(1 - outBack(seg(t, at, at + 0.3))) * (i === 1 ? 600 : -600)}px) rotate(${i === 1 ? 2 : -2}deg)` }}>
          <i>✓</i><b>{who}</b> sold <span>+{sol} SOL</span>
        </div>
      ))}
      <div className="tr-layer" style={{ background: "#fff", opacity: flash(t, [27.5, 28.5]) * 0.7 }} />
      <Grain t={t} o={0.06} />
    </div>
  );
}

/* 31.5–36 : le logo, le booster offert */
function Outro({ t }: { t: number }) {
  const d = t - 31.5;
  const logo = outBack(seg(t, 32, 32.35), 1.6);
  return (
    <div className="tr-layer" style={{ background: "radial-gradient(60% 60% at 50% 45%, #ffe45c, #ffb21a 60%, #ef7e12)" }}>
      <Rays t={t} a="rgba(255,255,255,.3)" speed={14} y={44} />
      <div className="tr-layer" style={{ transform: shake(t, [[32, 30, 0.6]]) }}>
        {FAN.map((c, i) => {
          const k = i - 3, p = outBack(seg(t, 31.5 + Math.abs(k) * 0.06, 32.1 + Math.abs(k) * 0.06), 1.3);
          return <Card3D key={i} card={c} x={W / 2 + k * 250 * p} y={960 + Math.abs(k) * 40 * p + (1 - p) * 700} w={270} rz={k * 8 * p} ry={Math.sin(d * 1.5 + i) * 8} />;
        })}
        <div className="tr-layer" style={{ background: "radial-gradient(50% 32% at 50% 33%, rgba(255,233,140,.95), transparent 80%)", opacity: seg(t, 31.9, 32.1) }} />
        {t >= 32 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="tr-logo" src="/brand/cmcards-logo.svg" alt="cm cards" style={{ transform: `translate(-50%, -50%) scale(${lerp(3, 1, logo) * (1 + d * 0.012)})`, opacity: seg(t, 32, 32.08) }} />
        )}
        <Burst t={t} at={32.02} x={W / 2} y={330} n={50} seed={21} speed={1400} size={46} len={1.8} />
        <Ring t={t} at={32} y={330} color="#fff" max={2600} />
      </div>
      <Slam t={t} at={32.6} x={W / 2} y={505} size={72} from={1.6}>Memecoin traders, as cards.</Slam>
      {t >= 33.1 && (
        <div className="tr-cta" style={{ transform: `translate(-50%, -50%) scale(${outBack(seg(t, 33.1, 33.45), 2.2) * (1 + 0.03 * Math.sin((t - 33.1) * 6))})` }}>
          Your first booster is <b>FREE</b>
        </div>
      )}
      <div className="tr-layer" style={{ background: "#fff", opacity: flash(t, [31.5, 32], 0.4) }} />
      <div className="tr-layer" style={{ background: "#000", opacity: seg(t, 35.3, 36) }} />
    </div>
  );
}

/* ---------- le film ---------- */
export function Film({ t }: { t: number }) {
  return (
    <div className="tr-stage">
      {t < 4 && <Intro t={t} />}
      {t >= 4 && t < 7 && <Boom t={t} />}
      {t >= 7 && t < 14.5 && <Opening t={t} />}
      {t >= 14.5 && t < 17.5 && <Mythic t={t} />}
      {t >= 17.5 && t < 21.5 && <Ladder t={t} />}
      {t >= 21.5 && t < 27.5 && <Resell t={t} />}
      {t >= 27.5 && t < 31.5 && <MakeSol t={t} />}
      {t >= 31.5 && <Outro t={t} />}
      {/* les coupes : un éclair blanc */}
      <div className="tr-layer" style={{ background: "#fff", opacity: flash(t, [4, 7, 14.5, 17.5, 21.5], 0.3) }} />
      {t < 31.5 && <Grain t={t} o={t < 4 ? 0.16 : 0.07} />}
      <div className="tr-layer tr-vignette" style={{ opacity: 0.55 }} />
    </div>
  );
}

declare global { interface Window { __seek?: (t: number) => void; __dur?: number } }

export default function Trailer() {
  const [t, setT] = useState(0);
  useEffect(() => {
    window.__seek = setT;
    window.__dur = DUR;
    const q = new URLSearchParams(location.search);
    const first = setTimeout(() => setT(Number(q.get("t") ?? 0)), 0);
    if (!q.has("play")) return () => clearTimeout(first);
    const t0 = performance.now() - Number(q.get("t") ?? 0) * 1000;
    let raf = 0;
    const loop = () => { setT(((performance.now() - t0) / 1000) % DUR); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { clearTimeout(first); cancelAnimationFrame(raf); };
  }, []);
  return <div className="tr-root"><Film t={t} /></div>;
}
