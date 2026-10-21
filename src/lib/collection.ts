/* La collection de la démo : les cartes tirées dans les boosters, gardées dans ce
   navigateur (au branchement : lues dans le wallet). Un magasin pour
   useSyncExternalStore, qui suit aussi les autres onglets. */

import { useSyncExternalStore } from "react";
import { COINS, type Card, type CategoryId, RARITIES, TRADERS } from "./data";

export type Owned = Card & {
  uid: string;      // unique dans la collection, même si deux tirages se ressemblent
  pack: CategoryId; // le booster d'où elle sort
  at: number;       // tirée le (ms)
};

const KEY = "cmcards:collection";
const listeners = new Set<() => void>();
/* le dernier état lu : la même liste tant que rien ne change (et le relais quand le
   navigateur refuse le stockage, en navigation privée) */
let cache: { raw: string | null; list: Owned[] } = { raw: null, list: [] };

/* Une carte d'un ancien catalogue (personnage, rareté ou coin disparus) est écartée. */
const known = (c: Owned) =>
  !!c && typeof c.uid === "string" && TRADERS.some((t) => t.id === c.trader)
  && RARITIES.some((r) => r.id === c.rarity) && !!COINS[c.coin];

function read(): Owned[] {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return cache.list; }
  if (raw !== cache.raw) {
    let list: Owned[] = [];
    try {
      const v = JSON.parse(raw ?? "[]");
      if (Array.isArray(v)) list = v.filter(known);
    } catch {}
    cache = { raw, list };
  }
  return cache.list;
}

function write(list: Owned[]) {
  const raw = JSON.stringify(list);
  cache = { raw, list };
  try { localStorage.setItem(KEY, raw); } catch {}
  listeners.forEach((f) => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  const other = (e: StorageEvent) => { if (e.key === KEY || e.key === null) f(); };
  window.addEventListener("storage", other);
  return () => { listeners.delete(f); window.removeEventListener("storage", other); };
}

/* La collection, ou null avant l'hydratation (le serveur ne la connaît pas). */
export function useCollection(): Owned[] | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function keep(cards: Card[], pack: CategoryId) {
  const at = Date.now();
  write([...read(), ...cards.map((c, i) => ({ ...c, uid: `${c.id}-${at}-${i}`, pack, at }))]);
}

export function forget() {
  write([]);
}
