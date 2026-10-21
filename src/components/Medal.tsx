import { useId } from "react";
import type { RarityId } from "@/lib/data";

/* Le badge de cm cards : l'icône seule, qui prend matière avec la rareté (la
   recette des badges de memescanner). Aucun cadre, aucun champ autour : le glyphe
   plein se pose sur l'interface, et la rareté se lit à sa MATIÈRE, un geste de plus
   par marche. Commun l'aplat d'ardoise ; Rare la couleur, la menthe ; Shiny le
   relief, le bleu roi et son épaisseur ; OG le poli, l'or et un point de brillance ;
   Mythic l'opale taillée, ses trois feux, nettement plus grande. Rien ne scintille.
   Tout passe par UN masque (la silhouette, ses creux en vrais trous) : l'ombre,
   l'épaisseur, la face et le liseré en sont des copies. */

type Stop = [number, string];
type Tier = {
  s: number; body: Stop[]; lit?: string; side?: string; th?: number;
  sh?: [string, number, number, number]; spec?: boolean;
  fire?: [number, number, number, string][]; cut?: number; pill: [Stop[], string];
};
const TIER: Record<RarityId, Tier> = {
  common: { s: 31, body: [[0, "#a9b4c6"], [1, "#7a869b"]], pill: [[[0, "#8d99ad"], [1, "#717e94"]], "#ffffff"] },
  rare: { s: 32, body: [[0, "#5fecc4"], [1, "#0b9e74"]], sh: ["#065c43", .45, 1, 1.8], pill: [[[0, "#2fd3a5"], [1, "#0b9e74"]], "#ffffff"] },
  shiny: { s: 33, body: [[0, "#8aadff"], [.55, "#3d70f6"], [1, "#2453d9"]], lit: "#d3e0ff", side: "#1a3c9f", th: 1.6, sh: ["#0d2475", .5, 1.2, 2.2], pill: [[[0, "#5b88ff"], [1, "#2453d9"]], "#ffffff"] },
  og: { s: 34.5, body: [[0, "#fff4c4"], [.3, "#ffd864"], [.64, "#f6b21e"], [1, "#dc8806"]], lit: "#fffbea", side: "#a3600a", th: 2, sh: ["#6e3f03", .45, 1.3, 2.4], spec: true, pill: [[[0, "#ffe07a"], [1, "#f0a812"]], "#4d2c00"] },
  mythic: {
    s: 43, body: [[0, "#f1f6ff"], [.45, "#c6d7ff"], [1, "#8ea9f4"]], lit: "#ffffff", side: "#5671cc", th: 2.8, sh: ["#1f3a9e", .5, 1.8, 3], spec: true,
    fire: [[5, 17.5, 9, "#45e3b6"], [19, 5.5, 9, "#5aaeff"], [18.5, 19, 8, "#ff97cc"]], cut: 10, pill: [[[0, "#ffffff"], [1, "#cddbff"]], "#2440a8"],
  },
};

/* Les glyphes : un tracé plein (evenodd : les creux sont des trous), sur sa grille. */
export type Glyph = { d: string; grid?: number; shift?: number }; // shift : le tracé est décalé de (shift, shift) dans sa grille
export const GLYPHS = {
  // le symbole de la marque : une carte, et une pièce dedans
  card: { grid: 80, shift: 10, d: "M34 11H66Q78 11 78 23V77Q78 89 66 89H34Q22 89 22 77V23Q22 11 34 11ZM50 33C40.6 33 33 40.6 33 50C33 59.4 40.6 67 50 67C59.4 67 67 59.4 67 50C67 40.6 59.4 33 50 33ZM50 42C54.4 42 58 45.6 58 50C58 54.4 54.4 58 50 58C45.6 58 42 54.4 42 50C42 45.6 45.6 42 50 42Z" },
  pack: { d: "M5.2 1.8h13.6l-.9 1.6.9 1.6v14l.9 1.6-.9 1.6H5.2l-.9-1.6.9-1.6V5l-.9-1.6zM7.2 7.4v1.6h9.6V7.4zm4.8 3.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z" },
  cards: { d: "M8.6 1.8h10.2c1.2 0 2.2 1 2.2 2.2v12.8c0 1.2-1 2.2-2.2 2.2H8.6c-1.2 0-2.2-1-2.2-2.2V4c0-1.2 1-2.2 2.2-2.2zM3 6.2h1.8v13c0 .6.4 1 1 1h10.6V22H5.2C4 22 3 21 3 19.8z" },
  crown: { d: "M2.6 7.8 7.4 12 12 4.6l4.6 7.4 4.8-4.2-1.7 10.4H4.3zM4.3 19.6h15.4V22H4.3z" },
  tag: { d: "M3 3.2h8.4L21 12.8 12.8 21 3.2 11.4zm4.6 2.4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" },
  swap: { d: "M16.4 2.6 21.4 7.4l-5 4.8V9H3.6V5.8h12.8zM7.6 11.8V15h12.8v3.2H7.6v3.2l-5-4.8z" },
  nova: { d: "M11.4 1.8Q12.4 10.2 21.6 11.6Q12.4 13 11.4 22.2Q10.4 13 1.2 11.6Q10.4 10.2 11.4 1.8ZM19.6 1.2Q20 3.8 22.6 4.2Q20 4.6 19.6 7.2Q19.2 4.6 16.6 4.2Q19.2 3.8 19.6 1.2Z" },
  flame: { d: "M12.9 1.6c.1 2.4 1.3 4.2 3 5.9 2.2 2.1 4.3 4.1 4.3 7.4a8.2 8.2 0 0 1-16.4 0c0-2.3 1-4.3 2.4-5.9.2 1.6 1 2.9 2.4 3.6-.9-2.9-.2-5.6 1.5-8 .8-1.1 2.1-2 2.8-3zM12 11.2c-.2.5-.4.9-.6 1.4-.6 1.2-.9 2.5-.5 3.9-.7-.2-1.2-.7-1.5-1.4-.6.7-1 1.6-1 2.6a3.6 3.6 0 0 0 7.2 0c0-1.1-.5-2-1.2-2.8-1-1.1-2-2.1-2.4-3.7z" },
} satisfies Record<string, Glyph>;
export type GlyphId = keyof typeof GLYPHS;

const f2 = (n: number) => +n.toFixed(2);
const RR = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f2(x + r)} ${f2(y)}H${f2(x + w - r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + w)} ${f2(y + r)}V${f2(y + h - r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + w - r)} ${f2(y + h)}H${f2(x + r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x)} ${f2(y + h - r)}V${f2(y + r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + r)} ${f2(y)}Z`;

export default function Medal({ glyph = "card", rar, size = 48, locked = false, num, className = "", title }: {
  glyph?: GlyphId; rar: RarityId; size?: number; locked?: boolean; num?: string; className?: string; title?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const T = TIER[rar];
  const G: Glyph = GLYPHS[glyph];
  const grid = G.grid ?? 24;
  const pill = !!num;
  const th = T.th ?? 0;
  const S = T.s * (pill ? .84 : 1);
  const cx = pill ? 21.8 : 24, cy = pill ? 25.2 : 27 - th / 2;
  const k = S / grid, tx = cx - (grid / 2) * k, ty = cy - (grid / 2) * k;
  const R = { x: -12, y: -12, width: 72, height: 80 };
  const M = `url(#${uid}m)`, face = `url(#${uid}f)`;

  let pillEl: React.ReactNode = null, gap: React.ReactNode = null;
  if (pill) {
    const fs = 9.4, h = 12.8, w = Math.max(h, num!.length * fs * .6 + 6.4), x0 = 47 - w, y0 = 37.4;
    gap = <path d={RR(x0 - 1.9, y0 - 1.9, w + 3.8, h + 3.8 + Math.min(th, 1.4), (h + 3.8) / 2)} fill="#000" />;
    pillEl = (
      <g>
        <defs>
          <linearGradient id={`${uid}p`} x1={x0} y1={y0} x2={x0} y2={y0 + h} gradientUnits="userSpaceOnUse">
            {T.pill[0].map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
          </linearGradient>
        </defs>
        {th > 0 && <path d={RR(x0, y0 + Math.min(th, 1.4), w, h, h / 2)} fill={T.side} />}
        <path d={RR(x0, y0, w, h, h / 2)} fill={`url(#${uid}p)`} />
        <text x={x0 + w / 2} y={y0 + h / 2 + fs * .35} textAnchor="middle" fontSize={fs} fontWeight="800" fill={T.pill[1]}
          style={{ fontFamily: "var(--font-display)" }}>{num}</text>
      </g>
    );
  }
  const steps = th ? Math.max(3, Math.ceil(th / .35)) : 0;

  return (
    <svg className={`medal ${locked ? "is-locked" : ""} ${className}`} viewBox="0 0 48 54" width={size} height={size * 54 / 48}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" {...R}>
          <g fill="#fff" transform={`translate(${f2(tx)} ${f2(ty)}) scale(${f2(k)}) translate(${-(G.shift ?? 0)} ${-(G.shift ?? 0)})`}><path d={G.d} fillRule="evenodd" /></g>
          {gap}
        </mask>
        <linearGradient id={`${uid}f`} x1={cx - S / 2} y1={cy - S / 2} x2={cx + S / 2} y2={cy + S / 2} gradientUnits="userSpaceOnUse">
          {T.body.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        {T.sh && <filter id={`${uid}b`} filterUnits="userSpaceOnUse" {...R}><feGaussianBlur stdDeviation={T.sh[2]} /></filter>}
        {T.fire?.map(([, , , c], i) => (
          <radialGradient key={i} id={`${uid}r${i}`}><stop offset="0" stopColor={c} stopOpacity=".8" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
        ))}
      </defs>
      <g className="medal-art">
      {/* l'ombre teintée, posée sous l'épaisseur */}
      {T.sh && (
        <g filter={`url(#${uid}b)`} opacity={T.sh[1]}>
          <rect {...R} fill={T.sh[0]} mask={M} transform={`translate(0 ${f2(th + T.sh[3])})`} />
        </g>
      )}
      {/* l'épaisseur : la silhouette répétée vers le bas */}
      {Array.from({ length: steps }, (_, i) => steps - i).map((i) => (
        <rect key={i} {...R} fill={T.side} mask={M} transform={`translate(0 ${f2(th * i / steps)})`} />
      ))}
      <g mask={M}>
        {T.lit ? <><rect {...R} fill={T.lit} /><rect {...R} fill={face} mask={M} transform="translate(0 .6)" /></> : <rect {...R} fill={face} />}
        {T.fire?.map(([x, y, r], i) => <circle key={i} cx={f2(tx + x * k * grid / 24)} cy={f2(ty + y * k * grid / 24)} r={f2(r * k * grid / 24)} fill={`url(#${uid}r${i})`} />)}
        {T.cut && Array.from({ length: T.cut }, (_, j) => {
          const n = T.cut!, Rr = S * .9;
          const a0 = (-90 + j * 360 / n) * Math.PI / 180, a1 = (-90 + (j + 1) * 360 / n) * Math.PI / 180;
          return <path key={j} d={`M${f2(cx)} ${f2(cy)}L${f2(cx + Math.cos(a0) * Rr)} ${f2(cy + Math.sin(a0) * Rr)}L${f2(cx + Math.cos(a1) * Rr)} ${f2(cy + Math.sin(a1) * Rr)}Z`}
            fill={j % 2 ? "#2f4fc4" : "#ffffff"} opacity={j % 2 ? .09 : .2} />;
        })}
        {T.spec && <ellipse cx={f2(cx - S * .2)} cy={f2(cy - S * .25)} rx={f2(S * .15)} ry={f2(S * .065)} fill="#fff" opacity=".6"
          transform={`rotate(-32 ${f2(cx - S * .2)} ${f2(cy - S * .25)})`} />}
      </g>
      {pillEl}
      </g>
      {locked && (
        <g transform="translate(1 34)">
          <rect x="0" y="5.6" width="13" height="10" rx="2.6" fill="#1e1a16" />
          <path d="M3.2 6V4.4a3.3 3.3 0 0 1 6.6 0V6" fill="none" stroke="#1e1a16" strokeWidth="2" />
          <circle cx="6.5" cy="10.4" r="1.4" fill="#fff" />
        </g>
      )}
    </svg>
  );
}
