/* Le catalogue de la saison 1. Les montants et les prix sont ceux de la démo
   (devnet) : ils seront lus sur la chaîne et chez Jupiter au branchement. */

/* Le système de cm cards : une carte = un personnage, une catégorie, une rareté.
   La catégorie donne le fond, la rareté donne la bordure et l'effet. */

export type RarityId = "common" | "shiny" | "millionaire" | "legendary" | "og" | "mythic";

export type Rarity = {
  id: RarityId;
  name: string;
  odds: number;          // probabilité dans le booster Classique, en %
  usd: [number, number]; // fourchette de la valeur en coins à l'intérieur
  supply: number;        // exemplaires numérotés par personnage
};

export const RARITIES: Rarity[] = [
  { id: "common", name: "Common", odds: 70, usd: [0.5, 3], supply: 5000 },
  { id: "shiny", name: "Shiny", odds: 20, usd: [3, 15], supply: 1000 },
  { id: "millionaire", name: "Millionaire", odds: 7, usd: [15, 80], supply: 250 },
  { id: "legendary", name: "Legendary", odds: 2.5, usd: [80, 400], supply: 50 },
  { id: "og", name: "OG", odds: 0.45, usd: [400, 1500], supply: 10 },
  { id: "mythic", name: "Mythic", odds: 0.05, usd: [1500, 5000], supply: 1 },
];
export const rarity = (id: RarityId) => RARITIES.find((r) => r.id === id)!;

export type CategoryId = "top10" | "trader" | "dev" | "sniper" | "bundler";
export type Category = { id: CategoryId; name: string; bg: string };
export const CATEGORIES: Category[] = [
  { id: "top10", name: "Top 10", bg: "#ff9a1f" },
  { id: "trader", name: "Trader", bg: "#4da8ff" },
  { id: "dev", name: "Dev", bg: "#3dcb6c" },
  { id: "sniper", name: "Sniper", bg: "#ff4b3e" },
  { id: "bundler", name: "Bundler", bg: "#a77bff" },
];
export const category = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export type Coin = { ticker: string; name: string; price: number; color: string };
export const COINS: Record<string, Coin> = {
  BONK: { ticker: "BONK", name: "Bonk", price: 0.0000214, color: "#ff9a1f" },
  WIF: { ticker: "WIF", name: "dogwifhat", price: 1.42, color: "#c99a6b" },
  POPCAT: { ticker: "POPCAT", name: "Popcat", price: 0.31, color: "#f2efe8" },
  MEW: { ticker: "MEW", name: "cat in a dogs world", price: 0.0029, color: "#9ad1ff" },
  FWOG: { ticker: "FWOG", name: "Fwog", price: 0.087, color: "#7fd47f" },
};

export type Trader = {
  id: string; name: string; handle: string;
  category?: CategoryId; // pas encore choisie : fond neutre, pas de pastille
  art?: string; artPos?: string;
  theme?: "sponge";      // le thème de sa Mythic (1 sur 1)
  mythic?: { banner: string; avatar: string }; // les images de sa Mythic
};
export const TRADERS: Trader[] = [
  { id: "mitch", name: "Mitch", handle: "@mitch", category: "trader", art: "/traders/mitch.png", artPos: "50% 50%" },
  { id: "cupsey", name: "Cupsey", handle: "@Cupseyy", category: "top10", art: "/traders/cupsey-banner.webp", artPos: "93% 30%", theme: "sponge",
    mythic: { banner: "/traders/cupsey-banner.webp", avatar: "/traders/cupsey.png" } },
  { id: "cented", name: "Cented", handle: "@Cented7" },
];
export const trader = (id: string) => TRADERS.find((t) => t.id === id)!;

export type Card = {
  id: string;
  trader: string;
  rarity: RarityId;
  coin: string;
  amount: number;   // nombre de coins dans la carte
  serial: number;
};

export const usdOf = (c: Card) => c.amount * COINS[c.coin].price;

/* Les boosters : chacun change QUI on peut tirer (la catégorie), COMBIEN de
   cartes, et CE QUI EST GARANTI. */
export type Pack = {
  id: string;
  name: string;
  price: number;         // en SOL
  cards: number;
  pool?: CategoryId;     // seulement cette catégorie
  guarantee?: RarityId;  // la dernière carte est au moins de cette rareté
  boost?: number;        // multiplie les chances d'OG et de Mythic
  color: string;         // la couleur du papier du booster
  ink: string;           // la couleur de son motif
  motif: "dots" | "stripes" | "bills" | "rays";
  face: string;          // le personnage en vitrine
};

export const PACKS: Pack[] = [
  { id: "classique", name: "Classique", price: 0.1, cards: 3, color: "#ff4b3e", ink: "#ff7b70", motif: "dots", face: "mitch" },
  { id: "top10", name: "Top 10", price: 0.25, cards: 3, pool: "top10", guarantee: "shiny", color: "#ff9a1f", ink: "#ffbb63", motif: "stripes", face: "cupsey" },
  { id: "millionaire", name: "Millionaire", price: 0.5, cards: 5, guarantee: "millionaire", color: "#2f8f5b", ink: "#4fb07b", motif: "bills", face: "mitch" },
  { id: "og", name: "OG", price: 1, cards: 5, guarantee: "legendary", boost: 5, color: "#1e1a16", ink: "#3a332c", motif: "rays", face: "cupsey" },
];
export const pack = (id: string) => PACKS.find((p) => p.id === id);
export const rank = (id: RarityId) => RARITIES.findIndex((r) => r.id === id);

/* Le tirage de la démo (au branchement : le serveur, avec la preuve publiée). */
export function drawRarity(rand: number, boost = 1, floor: RarityId = "common"): RarityId {
  const min = rank(floor);
  const pool = RARITIES.filter((_, i) => i >= min);
  const w = pool.map((r) => (r.id === "mythic" || r.id === "og" ? r.odds * boost : r.odds));
  let x = rand * w.reduce((a, b) => a + b, 0);
  for (let i = pool.length - 1; i >= 0; i--) {
    if (x < w[i]) return pool[i].id;
    x -= w[i];
  }
  return pool[0].id;
}

export function drawCard(seed: number, p?: Pack, floor: RarityId = "common"): Card {
  const rnd = mulberry(seed);
  const r = drawRarity(rnd(), p?.boost ?? 1, floor);
  const who = p?.pool ? TRADERS.filter((t) => t.category === p.pool) : TRADERS;
  const t = who[Math.floor(rnd() * who.length)];
  const coins = Object.keys(COINS);
  const coin = coins[Math.floor(rnd() * coins.length)];
  const [lo, hi] = rarity(r).usd;
  const usd = lo + (hi - lo) * rnd() ** 2;
  return {
    id: `${t.id}-${r}-${seed}`,
    trader: t.id,
    rarity: r,
    coin,
    amount: Math.max(1, Math.round(usd / COINS[coin].price)),
    serial: 1 + Math.floor(rnd() * rarity(r).supply),
  };
}

/* Ouvre un booster : ses cartes, la garantie sur la dernière, du moins rare au plus
   rare (la meilleure se retourne en dernier). */
export function openPack(p: Pack, seed: number): Card[] {
  const cards = Array.from({ length: p.cards }, (_, i) =>
    drawCard(seed * 31 + i * 7919, p, i === p.cards - 1 ? p.guarantee : undefined),
  );
  return cards.sort((a, b) => rank(a.rarity) - rank(b.rarity));
}

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fmtAmount = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)} k` : `${n}`;
export const fmtUsd = (n: number) =>
  n >= 10_000
    ? `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k$`
    : `${n.toLocaleString("fr-FR", { maximumFractionDigits: n < 10 ? 2 : 0 })} $`;

/* Ce qu'un booster peut contenir, en dollars : au pire et au mieux. */
export function packRange(p: Pack): [number, number] {
  const floor = p.guarantee ? rarity(p.guarantee).usd[0] : RARITIES[0].usd[0];
  const min = (p.cards - 1) * RARITIES[0].usd[0] + floor;
  const max = p.cards * RARITIES[RARITIES.length - 1].usd[1];
  return [min, max];
}
