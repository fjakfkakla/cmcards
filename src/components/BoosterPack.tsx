import "./booster.css";
import Pic from "./Pic";
import { type Category, type Pack, category, packTraders, rarity } from "@/lib/data";
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
      className={`bp ${pack.skin ?? ""} ${torn ? "is-torn" : ""} ${shaking ? "is-shaking" : ""} ${floating ? "floating" : ""} ${className}`}
      style={{ "--c": pack.skin ? undefined : pack.color, "--m": pack.skin ? undefined : pack.ink, "--glow": glow } as React.CSSProperties}
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

/* Le sachet : le film de la catégorie, la plaque du nom, l'éventail des cartes (ses
   trois premiers personnages), le nombre de cartes et la garantie. */
function Bag({ pack, cat }: { pack: Pack; cat: Category }) {
  const who = packTraders(pack).slice(0, 3);
  // le premier au centre, devant ; les deux suivants derrière, de chaque côté
  const fan = [who[1] && { t: who[1], at: "side left" }, who[2] && { t: who[2], at: "side right" }, who[0] && { t: who[0], at: "mid" }]
    .filter((x): x is { t: (typeof who)[number]; at: string } => !!x);
  return (
    <div className={`bp-bag ${pack.skin === "multiverse" ? "mv-bag" : ""}`}>
      {pack.skin === "multiverse" ? <Multiverse cat={cat} /> : (
        <>
          <div className={`bp-motif ${pack.motif}`} />
          <div className="bp-glow" />
          <div className="bp-fan">
            {fan.map(({ t, at }) => (
              <div key={t.id} className={`bp-mini ${at}`}>
                <Pic srcs={portraitSources(t)} fallback={portraitUri(t.name, cat.bg)} alt="" style={{ objectPosition: t.artPos }} draggable={false} />
              </div>
            ))}
          </div>
        </>
      )}
      <div className="bp-crimp top" />
      <div className="bp-crimp bottom" />
      <div className="bp-plate">
        <span className="bp-brand">cm cards</span>
        <span className="bp-name">{pack.name}</span>
        <span className="bp-kind">Booster</span>
      </div>
      <div className="bp-meta">
        <span>{pack.cards} cartes</span>
        {pack.guarantee && <span className="gold">{rarity(pack.guarantee).name}+</span>}
      </div>
      <div className="bp-holo" />
      <div className="bp-foil" />
    </div>
  );
}

/* Les éclats du sachet Legend : leur place (en % du sachet), leur taille, leur retard. */
const SPARKS: [number, number, number, number][] = [
  [14, 30, 5, 0], [84, 34, 3.6, .9], [90, 54, 4.4, 1.7], [9, 58, 3.2, 2.4],
  [80, 66, 5.2, .4], [18, 78, 3.4, 1.3], [88, 82, 4, 2.1], [12, 44, 2.8, 2.9],
];

/* Le Legend : pas de personnage, le multivers. Le ciel profond, les nébuleuses, les
   étoiles qui dérivent, le portail aux anneaux autour de la couronne. */
function Multiverse({ cat }: { cat: Category }) {
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
