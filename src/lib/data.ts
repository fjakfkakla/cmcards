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
  id: string; name: string; handle: string; category: CategoryId;
  art?: string; artPos?: string;
  theme?: "sponge";      // le thème de sa Mythic (1 sur 1)
  mythic?: { banner: string; avatar: string }; // les images de sa Mythic
};
export const TRADERS: Trader[] = [
  { id: "mitch", name: "Mitch", handle: "@mitch", category: "trader", art: "/traders/mitch.png", artPos: "50% 50%" },
  { id: "cupsey", name: "Cupsey", handle: "@Cupseyy", category: "top10", art: "/traders/cupsey-banner.webp", artPos: "93% 30%", theme: "sponge",
    mythic: { banner: "/traders/cupsey-banner.webp", avatar: "/traders/cupsey.png" } },
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

export type Pack = {
  id: string;
  name: string;
  price: number;      // en SOL
  cards: number;
  bg: string;         // le fond du booster
  face: string;       // le trader en vitrine
  boost?: string;     // ce qui change par rapport au Classique
};

export const PACKS: Pack[] = [
  {
    id: "classique",
    name: "Classique",
    price: 0.1,
    cards: 3,
    bg: "linear-gradient(160deg,#ff6a5e 0%,#ff4b3e 45%,#d9301f 100%)",
    face: "mitch",
  },
  {
    id: "eponge",
    name: "Éponge",
    price: 0.5,
    cards: 5,
    bg: "linear-gradient(160deg,#ffe45c 0%,#ffd12e 50%,#ffb41a 100%)",
    face: "cupsey",
    boost: "OG et Mythic ×5",
  },
];
export const pack = (id: string) => PACKS.find((p) => p.id === id);

/* Le tirage de la démo (au branchement : le serveur, avec la preuve publiée). */
export function drawRarity(rand: number, boost = 1): RarityId {
  const w = RARITIES.map((r) => (r.id === "mythic" || r.id === "og" ? r.odds * boost : r.odds));
  const total = w.reduce((a, b) => a + b, 0);
  let x = rand * total;
  for (let i = RARITIES.length - 1; i >= 0; i--) {
    // on part du plus rare pour que le boost ne mange que la commune
    if (x < w[i]) return RARITIES[i].id;
    x -= w[i];
  }
  return "common";
}

export function drawCard(seed: number, boost = 1): Card {
  const rnd = mulberry(seed);
  const r = drawRarity(rnd(), boost);
  const t = TRADERS[Math.floor(rnd() * TRADERS.length)];
  const coins = Object.keys(COINS);
  const coin = coins[Math.floor(rnd() * coins.length)];
  const [lo, hi] = rarity(r).usd;
  const usd = lo + (hi - lo) * rnd() ** 2;
  const amount = Math.round(usd / COINS[coin].price);
  return {
    id: `${t.id}-${r}-${seed}`,
    trader: t.id,
    rarity: r,
    coin,
    amount,
    serial: 1 + Math.floor(rnd() * rarity(r).supply),
  };
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
  `${n.toLocaleString("fr-FR", { maximumFractionDigits: n < 10 ? 2 : 0 })} $`;
