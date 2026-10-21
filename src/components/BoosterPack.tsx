import "./booster.css";
import Pic from "./Pic";
import { type Pack, category, rarity, trader } from "@/lib/data";
import { portraitSources, portraitUri } from "@/lib/portrait";

/* Le booster fermé, comme un vrai paquet de cartes à collectionner : le film
   métallisé serti en haut et en bas, le logo cerné en relief, le bandeau, le
   personnage de la famille imprimé en grand sur un éclat de rayons, le titre de la
   série en métal, le nombre de cartes. Un seul gabarit pour toute la saison (comme
   une série de vrais boosters) : la famille donne la couleur et le personnage.
   `torn` le coupe le long de la ligne : le haut s'envole et la lumière de `glow`
   sort par l'ouverture. Le haut et le corps sont deux copies du même sachet,
   chacune coupée d'un côté de la ligne. */
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
  const bag = <Bag pack={pack} />;
  return (
    <div
      className={`bp d-${pack.id} ${torn ? "is-torn" : ""} ${shaking ? "is-shaking" : ""} ${floating ? "floating" : ""} ${className}`}
      style={{ "--c": cat.bg, "--m": cat.ink, "--glow": glow } as React.CSSProperties}
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

/* Les éclats qui scintillent sur le film : x, y (en %), la taille, le délai. */
const SPARKS: [number, number, number, number][] = [
  [12, 36, 5.5, 0], [86, 40, 4.4, 1.1], [80, 66, 6, .5], [14, 70, 4, 1.8], [24, 52, 3, 2.6], [70, 30, 3.4, 3.2],
];
/* le sceau : une étoile à vingt branches */
const SEAL = Array.from({ length: 40 }, (_, k) => {
  const a = (k / 40) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 40 : 47;
  return `${k ? "L" : "M"}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`;
}).join("") + "Z";
const SPARK = "M12 0Q13.2 10.8 24 12Q13.2 13.2 12 24Q10.8 13.2 0 12Q10.8 10.8 12 0Z";

function Bag({ pack }: { pack: Pack }) {
  const cat = category(pack.pool);
  const t = trader(pack.cover.trader);
  const id = `bp-${pack.id}`;
  /* un nom long se resserre pour tenir ; un nom court garde ses lettres */
  const fit = cat.name.length > 7 ? { textLength: 188, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <div className="bp-bag">
      <div className="bp-burst" />
      <div className={`bp-art ${pack.cover.cut ? "cut" : ""}`}>
        <Pic srcs={portraitSources(t, pack.cover.src)} fallback={portraitUri(t.name, cat.bg)} alt=""
          style={{ objectPosition: pack.cover.pos ?? t.artPos }} draggable={false} />
      </div>
      <div className="bp-tint" />
      <svg className="bp-sparks" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
        {SPARKS.map(([x, y, s, d]) => (
          <g key={x} transform={`translate(${x - s / 2} ${(y / 100) * 160 - s / 2}) scale(${s / 24})`}>
            <path d={SPARK} style={{ animationDelay: `${d}s` }} />
          </g>
        ))}
      </svg>

      <div className="bp-crimp top" />
      <div className="bp-crimp bottom" />

      {/* le logo : la tuile, puis le nom en lettres d'autocollant */}
      <div className="bp-logo">
        <svg className="bp-tile" viewBox="0 0 100 100" aria-hidden="true">
          <rect x="4" y="4" width="92" height="92" rx="24" fill="#1e1a16" />
          <rect x="4" y="2" width="92" height="88" rx="24" fill={`url(#${id}-tile)`} stroke="#1e1a16" strokeWidth="6" />
          <defs>
            <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe45c" /><stop offset=".55" stopColor="#ffd12e" /><stop offset="1" stopColor="#ffbf1a" />
            </linearGradient>
          </defs>
          <path fill="#1e1a16" transform="translate(16 13) scale(.68)" fillRule="evenodd"
            d="M34 11H66Q78 11 78 23V77Q78 89 66 89H34Q22 89 22 77V23Q22 11 34 11ZM50 33C40.6 33 33 40.6 33 50C33 59.4 40.6 67 50 67C59.4 67 67 59.4 67 50C67 40.6 59.4 33 50 33ZM50 42C54.4 42 58 45.6 58 50C58 54.4 54.4 58 50 58C45.6 58 42 54.4 42 50C42 45.6 45.6 42 50 42Z" />
        </svg>
        <svg className="bp-word" viewBox="0 0 176 50" aria-label="cm cards">
          <defs>
            <linearGradient id={`${id}-word`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff27a" /><stop offset=".5" stopColor="#ffd12e" /><stop offset="1" stopColor="#ffae00" />
            </linearGradient>
          </defs>
          <g fontWeight="800" fontSize="38" letterSpacing="-1" textAnchor="middle">
            <text x="88" y="38" fill="#1e1a16" stroke="#1e1a16" strokeWidth="11" strokeLinejoin="round" transform="translate(0 4)">cm cards</text>
            <text x="88" y="38" fill="#fff" stroke="#fff" strokeWidth="15" strokeLinejoin="round">cm cards</text>
            <text x="88" y="38" fill="#1e1a16" stroke="#1e1a16" strokeWidth="8" strokeLinejoin="round">cm cards</text>
            <text x="88" y="38" fill={`url(#${id}-word)`}>cm cards</text>
          </g>
        </svg>
      </div>
      <div className="bp-ribbon"><span>Cartes à collectionner</span></div>

      {pack.guarantee && (
        <div className="bp-seal">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d={SEAL} fill="#1e1a16" transform="translate(0 5)" />
            <path d={SEAL} fill="#ffd12e" stroke="#1e1a16" strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <span>{rarity(pack.guarantee).name}</span>
          <b>garantie</b>
        </div>
      )}

      {/* la série : le symbole de la famille, puis son nom en métal */}
      <div className="bp-series">
        <span className="bp-energy">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={cat.glyph} /></svg>
        </span>
        <svg className="bp-name" viewBox="0 0 200 44" aria-label={cat.name}>
          <defs>
            <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
              {pack.id === "legend" ? (
                <><stop offset="0" stopColor="#fffbe0" /><stop offset=".42" stopColor="#ffd864" /><stop offset=".5" stopColor="#d99000" /><stop offset="1" stopColor="#ffe9a0" /></>
              ) : (
                <><stop offset="0" stopColor="#ffffff" /><stop offset=".42" stopColor="#e6ebf2" /><stop offset=".52" stopColor="#9aa4b4" /><stop offset="1" stopColor="#f4f6fa" /></>
              )}
            </linearGradient>
          </defs>
          <g fontWeight="800" fontSize="40" textAnchor="middle">
            <text x="100" y="36" {...fit} fill="#1e1a16" stroke="#1e1a16" strokeWidth="10" strokeLinejoin="round" transform="translate(0 4)">{cat.name.toUpperCase()}</text>
            <text x="100" y="36" {...fit} fill="#1e1a16" stroke="#1e1a16" strokeWidth="8" strokeLinejoin="round">{cat.name.toUpperCase()}</text>
            <text x="100" y="36" {...fit} fill={`url(#${id}-metal)`}>{cat.name.toUpperCase()}</text>
          </g>
        </svg>
      </div>
      <div className="bp-count">{pack.cards} cartes</div>

      <div className="bp-pillow" />
      <div className="bp-holo" />
      <div className="bp-foil" />
    </div>
  );
}
