import Link from "next/link";
import BoosterPack from "../BoosterPack";
import CollectCard from "../CollectCard";
import { PACKS, type RarityId } from "@/lib/data";

/* Le présentoir : la boîte de boosters ouverte, comme en magasin. Derrière, un
   éventail de vraies cartes de la saison ; dans la boîte, les six boosters debout ;
   devant, le rabat imprimé au logo. Chaque booster mène à son choix dans l'app. */
const FAN: [string, RarityId][] = [["blu6k", "common"], ["pain", "rare"], ["ansem", "og"], ["kimchi", "mythic"], ["cented", "shiny"], ["zero", "rare"], ["yenni", "common"]];

export default function Display() {
  return (
    <div className="dx">
      <div className="dx-fan" aria-hidden="true">
        {FAN.map(([t, r], k) => {
          const o = k - (FAN.length - 1) / 2;
          return (
            <div key={t} className="dx-card" style={{ "--o": o, zIndex: 10 - Math.abs(o) } as React.CSSProperties}>
              <CollectCard card={{ id: `fan-${t}`, trader: t, rarity: r, serial: r === "mythic" ? 1 : 7 + k }} />
            </div>
          );
        })}
      </div>

      <div className="dx-back">
        <div className="dx-back-rays" />
        <span className="dx-back-word">Season 1</span>
      </div>

      <div className="dx-packs">
        {PACKS.map((p, k) => (
          <Link key={p.id} href={`/boosters#b-${p.id}`} className="dx-pack" style={{ "--k": k } as React.CSSProperties}
            aria-label={`Booster ${p.name}`}>
            <BoosterPack pack={p} />
          </Link>
        ))}
      </div>

      <div className="dx-front">
        <svg className="dx-word" viewBox="0 0 300 70" aria-label="cm cards">
          <defs>
            <linearGradient id="dx-word" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff27a" /><stop offset=".5" stopColor="#ffd12e" /><stop offset="1" stopColor="#ffae00" />
            </linearGradient>
          </defs>
          <g fontWeight="800" fontSize="62" letterSpacing="-2" textAnchor="middle">
            <text x="150" y="54" fill="#1e1a16" stroke="#1e1a16" strokeWidth="16" strokeLinejoin="round" transform="translate(0 6)">cm cards</text>
            <text x="150" y="54" fill="#fff" stroke="#fff" strokeWidth="22" strokeLinejoin="round">cm cards</text>
            <text x="150" y="54" fill="#1e1a16" stroke="#1e1a16" strokeWidth="12" strokeLinejoin="round">cm cards</text>
            <text x="150" y="54" fill="url(#dx-word)">cm cards</text>
          </g>
        </svg>
        <span className="dx-ribbon">Collectible cards</span>
      </div>
    </div>
  );
}
