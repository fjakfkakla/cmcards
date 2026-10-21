import "./booster.css";
import Pic from "./Pic";
import { CATEGORIES, type Pack, trader } from "@/lib/data";
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
  const face = trader(pack.face);
  const bag = (
    <div className="bp-bag">
      <div className={`bp-motif ${pack.motif}`} />
      <span className="bp-brand">cm cards</span>
      <div className="bp-window">
        <Pic srcs={portraitSources(face)} fallback={portraitUri(face.name, CATEGORIES.find((c) => c.id === face.category)?.bg)} alt="" style={{ objectPosition: face.artPos }} draggable={false} />
      </div>
      <span className="bp-name">{pack.name}</span>
      <span className="bp-count">{pack.cards} cartes</span>
      <div className="bp-foil" />
    </div>
  );
  return (
    <div
      className={`bp ${torn ? "is-torn" : ""} ${shaking ? "is-shaking" : ""} ${floating ? "floating" : ""} ${className}`}
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
