import Link from "next/link";
import CollectCard from "../CollectCard";
import { type RarityId, trader } from "@/lib/data";

/* La rivière de cartes : deux rangées de vraies cartes qui défilent en sens inverse,
   sans fin. La souris dessus arrête tout, la carte touchée se soulève ; un clic
   ouvre sa fiche. Les noms qu'on connaît (Kimchi, quant, Alon) y passent en grand. */
const ROWS: [string, RarityId][][] = [
  [["kimchi", "mythic"], ["quant", "og"], ["alon", "mythic"], ["cented", "shiny"], ["ansem", "og"], ["pain", "shiny"], ["profit", "mythic"], ["yenni", "rare"], ["nyhrox", "og"], ["decu", "shiny"], ["frank", "mythic"], ["zero", "rare"], ["superman", "shiny"]],
  [["quant", "mythic"], ["kimchi", "shiny"], ["gake", "og"], ["alon", "shiny"], ["rasmr", "og"], ["jack", "mythic"], ["scharo", "shiny"], ["blu6k", "rare"], ["unipcs", "og"], ["kimchi", "og"], ["megga", "shiny"], ["dani", "rare"], ["yenni", "mythic"]],
];

export default function CardRiver() {
  return (
    <div className="rv">
      {ROWS.map((row, i) => (
        <div key={i} className={`rv-row ${i % 2 ? "rtl" : ""}`} style={{ "--n": row.length } as React.CSSProperties}>
          {[0, 1].map((copy) =>
            row.map(([t, r], k) => (
              <Link key={`${copy}-${t}-${r}`} href={`/cards/${t}`} className="rv-card" aria-hidden={copy === 1 || undefined} tabIndex={copy === 1 ? -1 : undefined}
                aria-label={copy === 0 ? trader(t).name : undefined}>
                <CollectCard card={{ id: `rv-${i}-${copy}-${k}`, trader: t, rarity: r, serial: r === "mythic" ? 1 : 3 + k * 7 }} />
              </Link>
            )),
          )}
        </div>
      ))}
    </div>
  );
}
