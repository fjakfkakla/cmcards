/* La gamification de cm cards : ce qu'on collectionne au-delà des cartes. Tout se
   calcule sur ce que le serveur dit du wallet (ses cartes, ses ventes) : rien ne
   s'achète, rien ne se déclare dans le navigateur.

   - L'album : par famille, les personnages qu'on a au moins une fois.
   - Les succès : un badge par exploit, à la matière de sa rareté ; pas encore gagné,
     il se montre éteint avec ce qui manque (« 3 / 10 »). */

import type { GlyphId } from "@/components/Medal";
import { CATEGORIES, RARITIES, TRADERS, type CategoryId, type RarityId, rank } from "./data";
import type { Me } from "./types";

export const FAMILIES = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id));

export type Progress = {
  cards: number;
  atLeast: (r: RarityId) => number; // cartes de cette rareté ou mieux
  families: { id: CategoryId; have: Set<string>; total: number }[];
  complete: number;                 // familles dont on a tous les personnages
  touched: number;                  // familles dont on a au moins un personnage
  sold: number;
  bought: number;
};

export function progressOf(me: Me | null, wallet: string | null): Progress {
  const cards = me?.cards ?? [];
  const families = FAMILIES.map((c) => {
    const people = TRADERS.filter((t) => t.category === c.id).map((t) => t.id);
    return { id: c.id, have: new Set(cards.map((x) => x.trader).filter((t) => people.includes(t))), total: people.length };
  });
  const sales = me?.sales ?? [];
  return {
    cards: cards.length,
    atLeast: (r) => cards.filter((c) => rank(c.rarity) >= rank(r)).length,
    families,
    complete: families.filter((f) => f.have.size === f.total).length,
    touched: families.filter((f) => f.have.size > 0).length,
    sold: wallet ? sales.filter((s) => s.seller === wallet).length : 0,
    bought: wallet ? sales.filter((s) => s.buyer === wallet).length : 0,
  };
}

export type Badge = {
  id: string;
  name: string;
  glyph: GlyphId;
  rar: RarityId;          // la matière du badge
  need: number;
  of: (p: Progress) => number;
};

export const BADGES: Badge[] = [
  { id: "first", name: "First card", glyph: "cards", rar: "common", need: 1, of: (p) => p.cards },
  { id: "buy", name: "First purchase", glyph: "swap", rar: "common", need: 1, of: (p) => p.bought },
  { id: "ten", name: "Ten cards", glyph: "cards", rar: "rare", need: 10, of: (p) => p.cards },
  { id: "rare", name: "A Rare", glyph: "card", rar: "rare", need: 1, of: (p) => p.atLeast("rare") },
  { id: "sell", name: "First sale", glyph: "tag", rar: "rare", need: 1, of: (p) => p.sold },
  { id: "shiny", name: "A Shiny", glyph: "card", rar: "shiny", need: 1, of: (p) => p.atLeast("shiny") },
  { id: "families", name: "Every family", glyph: "nova", rar: "shiny", need: FAMILIES.length, of: (p) => p.touched },
  { id: "fifty", name: "Fifty cards", glyph: "cards", rar: "shiny", need: 50, of: (p) => p.cards },
  { id: "og", name: "An OG", glyph: "card", rar: "og", need: 1, of: (p) => p.atLeast("og") },
  { id: "family", name: "A full family", glyph: "crown", rar: "og", need: 1, of: (p) => p.complete },
  { id: "mythic", name: "The Mythic", glyph: "card", rar: "mythic", need: 1, of: (p) => p.atLeast("mythic") },
];

export const earned = (b: Badge, p: Progress) => b.of(p) >= b.need;
export const RARITY_NAMES = Object.fromEntries(RARITIES.map((r) => [r.id, r.name])) as Record<RarityId, string>;
