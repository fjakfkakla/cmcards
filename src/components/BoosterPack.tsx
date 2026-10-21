import "./booster.css";
import Pic from "./Pic";
import { type Category, type Pack, category, packTraders } from "@/lib/data";
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
  const bag = pack.skin === "multiverse" ? <MultiverseBag pack={pack} cat={cat} /> : <PaperBag pack={pack} cat={cat} />;
  return (
    <div
      className={`bp ${pack.skin ?? ""} ${torn ? "is-torn" : ""} ${shaking ? "is-shaking" : ""} ${floating ? "floating" : ""} ${className}`}
      style={{ "--c": pack.color, "--m": pack.ink, "--glow": glow } as React.CSSProperties}
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

/* Le sachet de papier métallisé : le motif de la catégorie, une fenêtre sur son
   premier personnage, la marque. */
function PaperBag({ pack, cat }: { pack: Pack; cat: Category }) {
  const face = packTraders(pack)[0]; // la vitrine : le premier personnage de la catégorie
  return (
    <div className="bp-bag">
      <div className={`bp-motif ${pack.motif}`} />
      <span className="bp-brand">cm cards</span>
      <div className="bp-window">
        {face ? (
          <Pic srcs={portraitSources(face)} fallback={portraitUri(face.name, cat.bg)} alt="" style={{ objectPosition: face.artPos }} draggable={false} />
        ) : (
          <svg className="bp-glyph" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: cat.bg }}><path d={cat.glyph} /></svg>
        )}
      </div>
      <span className="bp-name">{pack.name}</span>
      <span className="bp-count">{pack.cards} cartes</span>
      <div className="bp-foil" />
    </div>
  );
}

/* Les éclats du sachet Legend : leur place (en % du sachet), leur taille, leur retard. */
const SPARKS: [number, number, number, number][] = [
  [14, 20, 5, 0], [84, 17, 3.6, .9], [90, 44, 4.4, 1.7], [9, 52, 3.2, 2.4],
  [80, 60, 5.2, .4], [18, 78, 3.4, 1.3], [88, 82, 4, 2.1], [12, 92, 2.8, 2.9],
];

/* Le sachet des Legend : pas de papier de catégorie, pas de marque, pas de
   personnage. Le multivers : le ciel profond, les nébuleuses, les étoiles qui
   dérivent à deux profondeurs, le portail aux anneaux (ceux des Mythic, qui
   tournent) autour de la couronne Legend, le film holographique par-dessus.
   Tout est centré, droit, posé sur l'axe. */
function MultiverseBag({ pack, cat }: { pack: Pack; cat: Category }) {
  return (
    <div className="bp-bag mv-bag">
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
      <span className="mv-name">{pack.name}</span>
      <span className="mv-count">{pack.cards} cartes</span>
      <div className="bp-foil" />
    </div>
  );
}
