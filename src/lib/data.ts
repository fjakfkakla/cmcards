/* Le catalogue de la saison 1. Les montants et les prix sont ceux de la démo
   (devnet) : ils seront lus sur la chaîne et chez Jupiter au branchement. */

export type RarityId = "commune" | "peu-commune" | "rare" | "epique" | "legendaire" | "exclusive";

export type Rarity = {
  id: RarityId;
  name: string;
  odds: number;        // probabilité dans le booster Classique, en %
  usd: [number, number]; // fourchette de la valeur en coins à l'intérieur
  holo: boolean;
};

export const RARITIES: Rarity[] = [
  { id: "commune", name: "Commune", odds: 55, usd: [0.5, 2], holo: false },
  { id: "peu-commune", name: "Peu commune", odds: 25, usd: [2, 6], holo: false },
  { id: "rare", name: "Rare", odds: 12, usd: [6, 20], holo: false },
  { id: "epique", name: "Épique", odds: 5.5, usd: [20, 80], holo: true },
  { id: "legendaire", name: "Légendaire", odds: 2.2, usd: [80, 400], holo: true },
  { id: "exclusive", name: "Exclusive", odds: 0.3, usd: [400, 2500], holo: true },
];
export const rarity = (id: RarityId) => RARITIES.find((r) => r.id === id)!;

export type Coin = { ticker: string; name: string; price: number; color: string };
export const COINS: Record<string, Coin> = {
  BONK: { ticker: "BONK", name: "Bonk", price: 0.0000214, color: "#ff9a1f" },
  WIF: { ticker: "WIF", name: "dogwifhat", price: 1.42, color: "#c99a6b" },
  POPCAT: { ticker: "POPCAT", name: "Popcat", price: 0.31, color: "#f2efe8" },
  MEW: { ticker: "MEW", name: "cat in a dogs world", price: 0.0029, color: "#9ad1ff" },
  FWOG: { ticker: "FWOG", name: "Fwog", price: 0.087, color: "#7fd47f" },
};

export type Trader = { id: string; name: string; handle: string; art?: string; artPos?: string; artZoom?: number };
export const TRADERS: Trader[] = [
  { id: "mitch", name: "Mitch", handle: "@mitch", art: "/traders/mitch.png", artPos: "50% 60%" },
  { id: "cupsey", name: "Cupsey", handle: "@Cupseyy", art: "/traders/cupsey-banner.webp", artPos: "93% 30%" },
];
export const trader = (id: string) => TRADERS.find((t) => t.id === id)!;

export type Card = {
  id: string;
  trader: string;
  rarity: RarityId;
  coin: string;
  amount: number;   // nombre de coins dans la carte
  serial: number;
  supply: number;
};

export const usdOf = (c: Card) => c.amount * COINS[c.coin].price;

/* Le tirage par carte : chaque rareté a son tirage limité et numéroté. */
export const SUPPLY: Record<RarityId, number> = {
  commune: 5000, "peu-commune": 2000, rare: 800, epique: 250, legendaire: 50, exclusive: 5,
};

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
    boost: "Exclusive ×5",
  },
];
export const pack = (id: string) => PACKS.find((p) => p.id === id);

/* Le tirage de la démo (au branchement : le serveur, avec la preuve publiée). */
export function drawRarity(rand: number, boost = 1): RarityId {
  const w = RARITIES.map((r) => (r.id === "exclusive" ? r.odds * boost : r.odds));
  const total = w.reduce((a, b) => a + b, 0);
  let x = rand * total;
  for (let i = RARITIES.length - 1; i >= 0; i--) {
    // on part du plus rare pour que le boost ne mange que la commune
    if (x < w[i]) return RARITIES[i].id;
    x -= w[i];
  }
  return "commune";
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
    serial: 1 + Math.floor(rnd() * SUPPLY[r]),
    supply: SUPPLY[r],
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

/* Le texte imprimé de chaque trader : ses attaques, sa ligne du bas, sa mention.
   C'est le jeu de la carte ; la valeur réelle, c'est ce qu'elle contient. */
export type Move = { cost: number; name: string; dmg: string; text: string };
export type CardText = {
  stage: string;
  strip: string;
  value: string;
  moves: Move[];
  weak: string;
  resist: string;
  retreat: number;
  flavor: string;
  illus: string;
};
export const CARD_TEXT: Record<string, CardText> = {
  cupsey: {
    stage: "Trader",
    strip: "Trader Solana · @Cupseyy · Saison 1",
    value: "220",
    moves: [
      { cost: 1, name: "Garde-à-vous", dmg: "30", text: "Tous les traders de ton banc se mettent au garde-à-vous. Le prochain achat ne coûte rien." },
      { cost: 2, name: "Entrée au fond", dmg: "120", text: "Lance une pièce. Face : double les dégâts. Pile : le marché ne dumpe pas ce tour." },
    ],
    weak: "Rug ×2",
    resist: "FUD −30",
    retreat: 1,
    flavor: "Il a vu le fond deux fois. Il n'a jamais vendu.",
    illus: "@Cupseyy",
  },
  mitch: {
    stage: "Trader",
    strip: "Trader Solana · @mitch · Saison 1",
    value: "180",
    moves: [
      { cost: 1, name: "Regard fixe", dmg: "20", text: "Le défenseur ne peut pas vendre au prochain tour." },
      { cost: 2, name: "Pinceau rouge", dmg: "100", text: "Repeins le graphique. Si le coin est en perte, il passe en vert." },
    ],
    weak: "Rug ×2",
    resist: "FUD −20",
    retreat: 2,
    flavor: "On ne sait jamais ce qu'il regarde. Lui, si.",
    illus: "@mitch",
  },
};
