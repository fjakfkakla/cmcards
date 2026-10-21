"use client";

import { useState } from "react";
import CollectCard from "../CollectCard";
import Medal from "../Medal";
import { RARITIES, type RarityId } from "@/lib/data";

const LADDER = "kimchi";

/* L'échelle des raretés : cinq marches, la même carte à chacune. On touche une
   marche, la carte change de matière ; le stock et la chance sont sur des plaques. */
export default function RarityLadder() {
  const [at, setAt] = useState<RarityId>("og");
  const r = RARITIES.find((x) => x.id === at)!;
  return (
    <div className="rl">
      <div className="rl-steps" role="tablist" aria-label="Rarities">
        {RARITIES.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={x.id === at} onClick={() => setAt(x.id)} className="rl-step"
            style={{ "--k": k } as React.CSSProperties}>
            <Medal rar={x.id} size={x.id === "mythic" ? 92 : 74} />
            <span className="rl-name">{x.name}</span>
            <span className="rl-odds num">{x.odds.toLocaleString("en-US")}%</span>
          </button>
        ))}
      </div>
      <div className="rl-show">
        <div className="rl-card" key={at}>
          <CollectCard card={{ id: `ladder-${at}`, trader: LADDER, rarity: at, serial: r.supply === 1 ? 1 : 7 }} live />
        </div>
        <div className="rl-plates">
          <span className="plate"><b className="num">{r.supply === 1 ? "1" : r.supply.toLocaleString("en-US")}</b> {r.supply === 1 ? "copy" : "copies"}</span>
          <span className="plate"><b className="num">{r.odds.toLocaleString("en-US")}%</b> per card</span>
        </div>
      </div>
    </div>
  );
}
