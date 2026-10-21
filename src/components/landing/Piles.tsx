"use client";

import Link from "next/link";
import { useState } from "react";
import CollectCard from "../CollectCard";
import { FamilyCoin } from "../ui";
import { CATEGORIES, type CategoryId, RARITIES, TRADERS, category } from "@/lib/data";

/* Les six familles, en piles de cartes posées sur la table. Chaque pile, c'est une
   catégorie : ses personnages, du Commun à la Mythic, empilés. La souris dessus (ou
   un doigt) étale la pile en éventail : on voit chaque carte. Sous la pile, la pièce
   de la famille, son nom, et le booster qui mène à elle. */
const PER_PILE = 5;

function cardsOf(id: CategoryId) {
  // les personnages de la famille qu'on a en propre (jamais une image servie par X)
  const people = TRADERS.filter((t) => t.category === id && !t.art?.startsWith("http"));
  return Array.from({ length: Math.min(PER_PILE, Math.max(people.length, 1) * RARITIES.length) }, (_, k) => {
    const t = people[k % people.length];
    const r = RARITIES[k % RARITIES.length];
    return { id: `pile-${id}-${k}`, trader: t.id, rarity: r.id, serial: r.supply === 1 ? 1 : 12 + k * 5 };
  });
}

export default function Piles() {
  const [open, setOpen] = useState<CategoryId | null>(null);
  return (
    <div className="pls">
      {CATEGORIES.map((c) => {
        const cards = cardsOf(c.id);
        const total = TRADERS.filter((t) => t.category === c.id).length;
        if (!cards.length || !total) return null;
        const on = open === c.id;
        return (
          <div key={c.id} className={`pl ${on ? "is-open" : ""}`} style={{ "--c": c.bg, "--n": cards.length } as React.CSSProperties}>
            <div className="pl-stack" role="button" tabIndex={0} aria-pressed={on} aria-label={`La pile ${c.name}`}
              onClick={() => setOpen(on ? null : c.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(on ? null : c.id); } }}>
              <div className="pl-mat" />
              {cards.map((card, k) => (
                <div key={card.id} className="pl-card" style={{ "--k": k } as React.CSSProperties}>
                  <CollectCard card={card} />
                </div>
              ))}
            </div>
            <div className="pl-foot">
              <FamilyCoin id={c.id} size={44} />
              <div className="min-w-0">
                <div className="font-display text-[20px] leading-none font-extrabold tracking-[-.02em]">{c.name}</div>
                <div className="mt-1 text-[14px] font-semibold text-muted">{category(c.id).tagline} · <span className="num">{total}</span> {total > 1 ? "traders" : "trader"}</div>
              </div>
              <Link href={`/boosters#b-${c.id}`} className="btn-ghost btn-sm ml-auto shrink-0">Le booster</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
