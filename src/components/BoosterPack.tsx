import "./booster.css";
import Pic from "./Pic";
import { type Category, type CategoryId, type Pack, category, packTraders, rarity } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";

/* Le booster fermé. `torn` le coupe le long de la ligne : le haut s'envole et la
   lumière de `glow` sort par l'ouverture. Le haut et le corps sont deux copies du
   même sachet, chacune coupée d'un côté de la ligne. */
export default function BoosterPack({
  pack,
  torn = false,
  shaking = false,
  floating = false,
  slit = 0,
  glow,
  className = "",
  ...rest
}: {
  pack: Pack;
  torn?: boolean;
  shaking?: boolean;
  floating?: boolean;
  slit?: number;
  glow?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const cat = category(pack.pool);
  const bag = <Bag pack={pack} cat={cat} />;
  return (
    <div
      className={`bp d-${pack.id} ${torn ? "is-torn" : ""} ${shaking ? "is-shaking" : ""} ${floating ? "floating" : ""} ${className}`}
      style={{ "--glow": glow } as React.CSSProperties}
      {...rest}
    >
      <div className="bp-leak" />
      <div className="bp-part bp-body">{bag}</div>
      <div className="bp-part bp-top">{bag}</div>
      {!torn && <div className="bp-cut" />}
      {!torn && slit > 0 && <div className="bp-slit" style={{ width: `${slit * 94}%` }} />}
    </div>
  );
}

/* Le sachet : le film serti, la scène de sa famille (son décor, son titre), les
   personnages qui en sortent, le nombre de cartes et la garantie. Chaque famille a
   son dessin : la tranchée, le diamant, le terminal, le labo, le tapis rouge, le
   multivers. La scène est dessinée sur une grille de 100 × 160, la taille du sachet. */
function Bag({ pack, cat }: { pack: Pack; cat: Category }) {
  const { Scene, Title } = DESIGNS[pack.id];
  return (
    <div className="bp-bag">
      <Scene pack={pack} cat={cat} />
      {pack.id !== "legend" && <Fan pack={pack} cat={cat} />}
      <div className="bp-crimp top" />
      <div className="bp-crimp bottom" />
      <Title pack={pack} cat={cat} />
      <div className="bp-meta">
        <span>{pack.cards} cartes</span>
        {pack.guarantee && <span className="gold">{rarity(pack.guarantee).name}+</span>}
      </div>
      <div className="bp-holo" />
      <div className="bp-foil" />
    </div>
  );
}

/* L'éventail : ses trois premiers personnages, le premier au centre, devant. */
function Fan({ pack, cat }: { pack: Pack; cat: Category }) {
  const who = packTraders(pack).slice(0, 3);
  const fan = [who[1] && { t: who[1], at: "side left" }, who[2] && { t: who[2], at: "side right" }, who[0] && { t: who[0], at: "mid" }]
    .filter((x): x is { t: (typeof who)[number]; at: string } => !!x);
  return (
    <div className="bp-fan">
      {fan.map(({ t, at }) => (
        <div key={t.id} className={`bp-mini ${at}`}>
          <Pic srcs={portraitSources(t)} fallback={portraitUri(t.name, cat.bg)} alt="" style={{ objectPosition: t.artPos }} draggable={false} />
        </div>
      ))}
    </div>
  );
}

type Part = (p: { pack: Pack; cat: Category }) => React.ReactNode;
const Svg = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <svg className={`bp-scene ${className}`} viewBox="0 0 100 160" aria-hidden="true">{children}</svg>
);
const Brand = () => <span className="bp-brand">cm cards</span>;

/* ================= Trencher : la tranchée au coucher du soleil =================
   Le ciel orange, le soleil rayé, les bougies vertes qui montent ; en bas la terre
   en couches, la tranchée d'où sortent les cartes, les sacs de sable sur ses bords.
   Le titre : deux rubans de chantier croisés. */
const CANDLES = [
  [64, 70], [68, 62], [62, 66], [66, 57], [58, 61], [60, 52], [55, 57],
  [57, 47], [50, 52], [52, 43], [46, 49], [48, 38], [40, 44],
].map(([o, c], k) => ({ x: 6 + k * 7.3, o: o + 14, c: c + 14 }));

function TrencherScene() {
  return (
    <Svg>
      <defs>
        <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" /><stop offset=".38" stopColor="#ff9a1f" />
          <stop offset=".72" stopColor="#f0560f" /><stop offset="1" stopColor="#8a2a06" />
        </linearGradient>
        <radialGradient id="tr-sun" cx="50" cy="104" r="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff4c2" /><stop offset=".3" stopColor="#ffcf5a" stopOpacity=".8" />
          <stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tr-disc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbe6" /><stop offset="1" stopColor="#ffb02e" />
        </linearGradient>
      </defs>
      <rect width="100" height="160" fill="url(#tr-sky)" />
      <circle cx="50" cy="104" r="46" fill="url(#tr-sun)" />
      <circle cx="50" cy="106" r="19" fill="url(#tr-disc)" />
      {[104, 109, 113.5, 117.5].map((y, k) => <rect key={y} x="28" y={y} width="44" height={0.9 + k * 0.5} fill="#f47a1f" />)}
      <g className="tr-candles">
        {CANDLES.map(({ x, o, c }) => {
          const up = c < o;
          return (
            <g key={x} fill={up ? "#1fd17f" : "#ff4d4d"} stroke="#3a1204" strokeWidth=".5">
              <line x1={x} x2={x} y1={Math.min(o, c) - 3} y2={Math.max(o, c) + 3} />
              <rect x={x - 2} y={Math.min(o, c)} width="4" height={Math.abs(o - c)} rx=".6" />
            </g>
          );
        })}
      </g>
      <path d="M0 118 Q12 113 25 116.5 T50 115.5 T75 117 T100 114 V160 H0Z" fill="#7a3b12" />
      <path d="M0 129 Q14 125 28 128 T56 127 T84 129.5 T100 127 V160 H0Z" fill="#552609" />
      <path d="M0 141 Q16 138 32 140.5 T64 139.5 T100 140 V160 H0Z" fill="#331605" />
      <path d="M28 116 L35 136 H65 L72 116 Z" fill="#1e0d03" />
      <path d="M28 116 L35 136 H38 L32 116 Z" fill="#3d1a06" />
      {[[22, 115.2], [27.5, 113.4], [17, 116.4], [72.5, 113.4], [78, 115], [83.5, 116]].map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx="3.6" ry="2" fill="#d8a866" stroke="#5a3510" strokeWidth=".5" />
      ))}
      {[[8, 125, 1.1], [44, 146, .9], [90, 133, 1.2], [70, 150, .8], [15, 152, 1]].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#a35a24" />
      ))}
    </Svg>
  );
}
function TrencherTitle() {
  return (
    <div className="bp-title tr-title">
      <div className="tr-tape back"><span>cm cards · cm cards · cm cards · cm cards</span></div>
      <div className="tr-tape front"><span>Trencher</span></div>
    </div>
  );
}

/* ================= Holder : le diamant =================
   Le bleu profond, les rayons qui partent du centre, le grand diamant taillé
   derrière les cartes, les éclats qui scintillent. Le titre en chrome. */
const D = { t1: [33, 70], t2: [50, 70], t3: [67, 70], g0: [12, 86], g1: [31, 86], g2: [50, 86], g3: [69, 86], g4: [88, 86], c: [50, 140] };
const FACETS: [(keyof typeof D)[], string][] = [
  [["g0", "t1", "g1"], "#bfe9ff"], [["t1", "g2", "g1"], "#7fd0ff"], [["t1", "t2", "g2"], "#e9f8ff"],
  [["t2", "t3", "g2"], "#a8defe"], [["t3", "g3", "g2"], "#5ab8ff"], [["t3", "g4", "g3"], "#2f8fe6"],
  [["g0", "g1", "c"], "#3a9bf0"], [["g1", "g2", "c"], "#9ad8ff"], [["g2", "g3", "c"], "#1f6fd1"], [["g3", "g4", "c"], "#14509e"],
];
const RAYS = Array.from({ length: 16 }, (_, k) => k * 22.5);
const GLINTS: [number, number, number, number][] = [[18, 64, 4, 0], [84, 70, 3, .8], [80, 112, 4.5, 1.6], [14, 110, 3, 2.3], [62, 60, 2.6, 1.1]];
const glint = (x: number, y: number, s: number) =>
  `M${x} ${y - s}Q${x + s * .14} ${y - s * .14} ${x + s} ${y}Q${x + s * .14} ${y + s * .14} ${x} ${y + s}Q${x - s * .14} ${y + s * .14} ${x - s} ${y}Q${x - s * .14} ${y - s * .14} ${x} ${y - s}Z`;

function HolderScene() {
  return (
    <Svg>
      <defs>
        <radialGradient id="hd-bg" cx="50" cy="96" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fdcff" /><stop offset=".22" stopColor="#2fa8ff" />
          <stop offset=".55" stopColor="#0b4fa8" /><stop offset="1" stopColor="#051634" />
        </radialGradient>
        <radialGradient id="hd-halo" cx="50" cy="100" r="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <pattern id="hd-facet" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 0L14 14M14 0L0 14M7 0V14" stroke="#fff" strokeOpacity=".07" strokeWidth=".4" fill="none" />
        </pattern>
      </defs>
      <rect width="100" height="160" fill="url(#hd-bg)" />
      <rect width="100" height="160" fill="url(#hd-facet)" />
      <g className="hd-rays" opacity=".13">
        {RAYS.map((a) => <path key={a} d="M50 100 L46 -60 L54 -60Z" fill="#fff" transform={`rotate(${a} 50 100)`} />)}
      </g>
      <circle cx="50" cy="100" r="44" fill="url(#hd-halo)" />
      <g stroke="#fff" strokeOpacity=".7" strokeWidth=".45" strokeLinejoin="round">
        {FACETS.map(([pts, fill], k) => <polygon key={k} points={pts.map((p) => D[p].join(",")).join(" ")} fill={fill} />)}
      </g>
      <path d="M33 70H67L88 86L50 140L12 86Z" fill="none" stroke="#fff" strokeWidth=".9" />
      <g className="bp-glints" fill="#fff">
        {GLINTS.map(([x, y, s, d]) => <path key={x} d={glint(x, y, s)} style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }} />)}
      </g>
    </Svg>
  );
}
function HolderTitle() {
  return (
    <div className="bp-title hd-title">
      <Brand />
      <span className="hd-name">Holder</span>
      <span className="hd-sub"><i />Mains de diamant<i /></span>
    </div>
  );
}

/* ================= Dev : le terminal =================
   Le circuit imprimé sur le noir vert, le code qui défile en fond, les lignes de
   balayage de l'écran. Le titre : une fenêtre de terminal, le curseur qui clignote. */
const TRACES = [
  "M0 62H14L20 68V96", "M100 58H86L80 64V84H74", "M0 104H10L16 110V150", "M100 100H90L84 106V124",
  "M22 56V60L28 66H40", "M78 150V136L72 130", "M6 80H12", "M94 140H88L84 136", "M36 150V142L42 136",
];
const PADS = [[20, 96], [74, 84], [16, 150], [84, 124], [40, 66], [72, 130], [12, 80], [84, 136], [42, 136]];
const CODE = [
  "const pack = await open()", "if (pack.mythic) {", "  hodl(pack)", "} else sell(pack)", "// gm",
  "deploy --mainnet", "while (true) ship()", "fn mint() -> Card", "git push --force",
];

function DevScene() {
  return (
    <Svg>
      <defs>
        <radialGradient id="dv-bg" cx="50" cy="104" r="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f6b35" /><stop offset=".45" stopColor="#06301a" /><stop offset="1" stopColor="#020c06" />
        </radialGradient>
      </defs>
      <rect width="100" height="160" fill="url(#dv-bg)" />
      <g className="dv-code" fill="#3dff8a" fontSize="3.1">
        {CODE.map((l, k) => <text key={k} x={k % 2 ? 9 : 5} y={60 + k * 9.4}>{l}</text>)}
      </g>
      <g fill="none" stroke="#2fdc74" strokeOpacity=".45" strokeWidth=".7">
        {TRACES.map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="#04140a" stroke="#3dff8a" strokeWidth=".6">
        {PADS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />)}
      </g>
      <ellipse cx="50" cy="134" rx="34" ry="5" fill="#3dff8a" opacity=".22" />
    </Svg>
  );
}
function DevTitle() {
  return (
    <div className="bp-title dv-title">
      <div className="dv-bar"><i /><i /><i /><span>cm cards</span></div>
      <div className="dv-body">
        <span className="dv-cmd">~ $ npm run</span>
        <span className="dv-name">dev<b /></span>
      </div>
    </div>
  );
}

/* ================= Bundler : le labo toxique =================
   Le violet de nuit, la mare verte qui luit d'où sortent les cartes, les bulles qui
   montent, la bave qui coule du panneau. Le titre : un panneau de danger. */
const BUBBLES: [number, number, number, number][] = [
  [12, 128, 2.2, 0], [22, 140, 1.4, 1.2], [80, 132, 2.6, .5], [90, 142, 1.5, 2], [70, 140, 1.2, 2.8],
  [8, 100, 1.6, 1.6], [92, 104, 1.9, .9], [30, 132, 1, 3.3],
];

function BundlerScene() {
  return (
    <Svg>
      <defs>
        <linearGradient id="bd-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1580" /><stop offset=".5" stopColor="#1f0a47" /><stop offset="1" stopColor="#0d0420" />
        </linearGradient>
        <radialGradient id="bd-glow" cx="50" cy="136" r="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6ff3b" stopOpacity=".65" /><stop offset=".5" stopColor="#7ad61f" stopOpacity=".18" />
          <stop offset="1" stopColor="#7ad61f" stopOpacity="0" />
        </radialGradient>
        <pattern id="bd-hex" width="12" height="20.8" patternUnits="userSpaceOnUse">
          <path d="M6 0L12 3.5V10.4L6 13.9L0 10.4V3.5Z M6 13.9V20.8" stroke="#c3a4ff" strokeOpacity=".1" strokeWidth=".45" fill="none" />
        </pattern>
      </defs>
      <rect width="100" height="160" fill="url(#bd-bg)" />
      <rect width="100" height="160" fill="url(#bd-hex)" />
      <rect width="100" height="160" fill="url(#bd-glow)" />
      <path d="M14 46H86V49C84 49 83 51 83 55C83 60 79 60 79 55C79 51 77 50 73 50C69 50 68 53 68 61C68 68 63 68 63 61C63 53 61 50 57 50C54 50 53 52 53 56C53 59 50 59 50 56C50 52 48 50 44 50C40 50 39 53 39 64C39 72 34 72 34 64C34 54 32 50 28 50C25 50 24 52 24 55C24 58 21 58 21 55C21 51 18 49 14 49Z"
        fill="#9dff3a" stroke="#1a0833" strokeWidth=".6" />
      <ellipse cx="50" cy="134" rx="46" ry="9" fill="#5fbf16" />
      <ellipse cx="50" cy="133" rx="40" ry="6.4" fill="#9dff3a" />
      <ellipse cx="44" cy="131.6" rx="14" ry="1.6" fill="#eaffc4" opacity=".7" />
      <g className="bd-bubbles">
        {BUBBLES.map(([x, y, r, d]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#b6ff3b" fillOpacity=".25" stroke="#d6ff8f" strokeWidth=".45" style={{ animationDelay: `${d}s` }} />
        ))}
      </g>
    </Svg>
  );
}
function BundlerTitle({ cat }: { cat: Category }) {
  return (
    <div className="bp-title bd-title">
      <div className="bd-sign">
        <span className="bd-warn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 23 21.5H1z" fill="#ffd400" stroke="#120720" strokeWidth="1.6" strokeLinejoin="round" /><path d={cat.glyph} fill="#120720" transform="translate(7.2 9.4) scale(.4)" /></svg>
          cm cards · toxique
        </span>
        <span className="bd-name">Bundler</span>
      </div>
    </div>
  );
}

/* ================= Famous : le tapis rouge =================
   Le rose pop en trame de points, deux projecteurs qui se croisent, le tapis rouge
   qui mène aux cartes, les flashs des photographes. Le titre : une enseigne en
   ampoules, comme au-dessus d'un théâtre. */
const FLASHES: [number, number, number, number][] = [[12, 70, 5, 0], [88, 64, 4, 1.1], [86, 108, 5.5, .5], [10, 116, 4.2, 1.7], [24, 92, 2.8, 2.4], [76, 88, 3, 2.9]];

function FamousScene() {
  return (
    <Svg>
      <defs>
        <radialGradient id="fm-bg" cx="50" cy="60" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffa3d4" /><stop offset=".3" stopColor="#ff4fa6" />
          <stop offset=".7" stopColor="#a10f60" /><stop offset="1" stopColor="#4a0630" />
        </radialGradient>
        <pattern id="fm-dots" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="2" cy="2" r=".75" fill="#fff" />
        </pattern>
        <linearGradient id="fm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="fm-mask"><rect width="100" height="160" fill="url(#fm-fade)" /></mask>
        <linearGradient id="fm-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fm-carpet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f0a2a" /><stop offset=".35" stopColor="#d6143f" /><stop offset="1" stopColor="#ff2a52" />
        </linearGradient>
      </defs>
      <rect width="100" height="160" fill="url(#fm-bg)" />
      <rect width="100" height="160" fill="url(#fm-dots)" mask="url(#fm-mask)" opacity=".5" />
      <g className="fm-beams">
        <path d="M-4 160H10L66 40L52 36Z" fill="url(#fm-beam)" />
        <path d="M104 160H90L34 40L48 36Z" fill="url(#fm-beam)" />
      </g>
      <path d="M38 112H62L86 160H14Z" fill="url(#fm-carpet)" />
      <path d="M38 112L14 160H17.5L40 112ZM62 112L86 160H82.5L60 112Z" fill="#ffcf4a" />
      {[[26, 132], [74, 132]].map(([x, y]) => (
        <g key={x}>
          <rect x={x - 1} y={y - 12} width="2" height="14" rx=".6" fill="#ffcf4a" stroke="#5a0a2e" strokeWidth=".4" />
          <circle cx={x} cy={y - 12.5} r="2.2" fill="#ffe08a" stroke="#5a0a2e" strokeWidth=".4" />
        </g>
      ))}
      <g className="fm-flashes" fill="#fff">
        {FLASHES.map(([x, y, s, d]) => <path key={x} d={glint(x, y, s)} style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }} />)}
      </g>
    </Svg>
  );
}
function FamousTitle() {
  return (
    <div className="bp-title fm-title">
      <div className="fm-marquee">
        <div className="fm-inner">
          <Brand />
          <span className="fm-name">Famous</span>
          <span className="fm-stars">
            {[0, 1, 2].map((k) => <svg key={k} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z" /></svg>)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================= Legend : le multivers =================
   Pas de personnage : le ciel profond, les nébuleuses, deux profondeurs d'étoiles
   qui dérivent, le portail aux anneaux autour de la couronne. Le titre en or. */
const SPARKS: [number, number, number, number][] = [
  [14, 30, 5, 0], [84, 34, 3.6, .9], [90, 54, 4.4, 1.7], [9, 58, 3.2, 2.4],
  [80, 66, 5.2, .4], [18, 78, 3.4, 1.3], [88, 82, 4, 2.1], [12, 44, 2.8, 2.9],
];

function LegendScene({ cat }: { cat: Category }) {
  return (
    <>
      <div className="mv-space" />
      <div className="mv-stars far" />
      <div className="mv-stars near" />
      <div className="mv-nebula" />
      <div className="mv-portal">
        <div className="mv-ring" />
        <div className="mv-ring dashed" />
        <div className="mv-core">
          <div className="mv-rays" />
          <div className="mv-vortex" />
          <svg className="mv-crown" viewBox="0 0 24 24" aria-hidden="true"><path d={cat.glyph} /></svg>
        </div>
      </div>
      {SPARKS.map(([x, y, w, d], k) => (
        <span key={k} className="mv-spark" style={{ left: `${x}%`, top: `${y}%`, width: `${w}cqw`, animationDelay: `${d}s` }} />
      ))}
      <div className="mv-holo" />
    </>
  );
}
function LegendTitle() {
  return (
    <div className="bp-title lg-title">
      <Brand />
      <span className="lg-name">Legend</span>
      <span className="lg-sub"><i />Les plus recherchés<i /></span>
    </div>
  );
}

const DESIGNS: Record<CategoryId, { Scene: Part; Title: Part }> = {
  trencher: { Scene: TrencherScene, Title: TrencherTitle },
  holder: { Scene: HolderScene, Title: HolderTitle },
  dev: { Scene: DevScene, Title: DevTitle },
  bundler: { Scene: BundlerScene, Title: BundlerTitle },
  famous: { Scene: FamousScene, Title: FamousTitle },
  legend: { Scene: LegendScene, Title: LegendTitle },
};
