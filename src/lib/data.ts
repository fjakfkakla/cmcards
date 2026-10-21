/* Le catalogue de la saison 1. Les montants et les prix sont ceux de la démo
   (devnet) : ils seront lus sur la chaîne et chez Jupiter au branchement. */

/* Le système de cm cards : une carte = un personnage, une catégorie, une rareté.
   La catégorie donne le fond (et le booster), la rareté donne la bordure et l'effet. */

export type RarityId = "common" | "rare" | "shiny" | "og" | "mythic";

export type Rarity = {
  id: RarityId;
  name: string;
  odds: number;          // probabilité dans un booster, en %
  usd: [number, number]; // fourchette de la valeur en coins à l'intérieur
  supply: number;        // exemplaires numérotés par personnage
};

export const RARITIES: Rarity[] = [
  { id: "common", name: "Commun", odds: 65, usd: [0.5, 3], supply: 5000 },
  { id: "rare", name: "Rare", odds: 24, usd: [3, 12], supply: 2000 },
  { id: "shiny", name: "Shiny", odds: 9, usd: [12, 60], supply: 500 },
  { id: "og", name: "OG", odds: 1.8, usd: [60, 600], supply: 50 },
  { id: "mythic", name: "Mythic", odds: 0.2, usd: [600, 5000], supply: 1 },
];
export const rarity = (id: RarityId) => RARITIES.find((r) => r.id === id)!;

/* Les catégories, de la plus courante à la plus recherchée : les Legend en dernier. */
export type CategoryId = "trader" | "trencher" | "dev" | "sniper" | "bundler" | "famous" | "legend";
export type Category = {
  id: CategoryId; name: string; tagline: string;
  bg: string;    // le fond des cartes, le papier du booster
  ink: string;   // le motif du booster
  glyph: string; // dessiné sur une grille de 24
};
export const CATEGORIES: Category[] = [
  { id: "trader", name: "Trader", tagline: "La base", bg: "#4da8ff", ink: "#7cc0ff",
    glyph: "M5 3h2v4h2v8H7v6H5v-6H3V7h2zm10 4h2v3h2v7h-2v4h-2v-4h-2v-7h2z" },
  { id: "trencher", name: "Trencher", tagline: "Le trader, en plus stylé", bg: "#ff9a1f", ink: "#ffbb63",
    glyph: "M15.5 2 22 8.5l-1.4 1.4-1.6-1.6-4.3 4.3 1.1 1.1-3 3a3 3 0 0 1-4.2 0l-.3-.3-4.9 4.9L2 19.9 6.9 15l-.3-.3a3 3 0 0 1 0-4.2l3-3 1.1 1.1 4.3-4.3-1.6-1.6z" },
  { id: "dev", name: "Dev", tagline: "Les bons", bg: "#3dcb6c", ink: "#6fdd92",
    glyph: "M8.6 6.4 3 12l5.6 5.6 1.4-1.4L5.8 12 10 7.8zm6.8 0L14 7.8l4.2 4.2-4.2 4.2 1.4 1.4L21 12z" },
  { id: "sniper", name: "Sniper", tagline: "Ceux qui rentrent au début", bg: "#ff4b3e", ink: "#ff7b70",
    glyph: "M11 2h2v3.1A7 7 0 0 1 18.9 11H22v2h-3.1A7 7 0 0 1 13 18.9V22h-2v-3.1A7 7 0 0 1 5.1 13H2v-2h3.1A7 7 0 0 1 11 5.1zm1 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" },
  { id: "bundler", name: "Bundler", tagline: "Toxique", bg: "#a77bff", ink: "#c3a4ff",
    glyph: "M12 2a8 8 0 0 0-8 8c0 2.8 1.4 4.6 3 5.6V19a1 1 0 0 0 1 1h1v2h2v-2h2v2h2v-2h1a1 1 0 0 0 1-1v-3.4c1.6-1 3-2.8 3-5.6a8 8 0 0 0-8-8zM8.5 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 13.5l1.3 2.5h-2.6z" },
  { id: "famous", name: "Famous", tagline: "Tout le monde les connaît", bg: "#ff5fb4", ink: "#ff8fcb",
    glyph: "M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z" },
  { id: "legend", name: "Legend", tagline: "Les plus recherchés", bg: "#ffc21a", ink: "#ffdc6b",
    glyph: "M2 7l5 4 5-7 5 7 5-4-2 12H4zm2.4 13h15.2v2H4.4z" },
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

/* Les images d'un set signature : chaque rareté a sa photo et sa mise en scène.
   Fabriquées par tools/traders/kimchi.py (le détourage, le décor sans lui). */
export type AuraArt = {
  print: string;  // Commun : le tirage
  table: string;  // Rare : la liasse
  jet: string;    // Shiny : le rosé
  film: string;   // OG : la pellicule
  bg: string; cut: string; glow: string; // Mythic : le décor, lui, sa silhouette floutée
};

/* Une image et son cadrage (object-position). */
export type Shot = { src: string; pos?: string };
/* La planche d'une Mythic : la bannière dans les trois cases, l'avatar en sticker au
   centre. Avec plusieurs images, chaque case peut avoir la sienne. */
export type Mythic = {
  banner: string; avatar: string;
  panels?: { top?: Shot; left?: Shot; right?: Shot };
};

export type Trader = {
  id: string; name: string; handle: string;
  category?: CategoryId; // pas encore choisie : fond neutre, pas de pastille
  art?: string; artPos?: string;
  // le thème de sa Mythic (1 sur 1) : les bulles, la foudre, la brume, le crayon
  // d'enfant, les gélules pump.fun, le feu et la glace, le bling, l'appel entrant
  theme?: "sponge" | "volt" | "mist" | "crayon" | "pump" | "duo" | "bling" | "call";
  tint?: "blue" | "gold"; // sa Shiny le colore (bleu électrique, or) au lieu de décaler ses teintes :
                          // pour un dessin en noir et blanc, ou une photo (une peau verte n'est pas « shiny »)
  shots?: Partial<Record<Exclude<RarityId, "mythic">, Shot>>; // une autre image pour une rareté (l'OG, souvent)
  mythic?: Mythic;       // les images de sa Mythic
  aura?: AuraArt;        // son set signature : une carte différente par rareté
};
/* Les illustrations sont les images qu'on nous donne, versionnées dans public/art/.
   Cupsey est le dernier à dépendre de X : sa bannière publique, servie par X. */
const BANNER = {
  cupsey: "https://pbs.twimg.com/profile_banners/1168903946989010944/1766688794/1500x500",
};
export const TRADERS: Trader[] = [
  // ses images sont versionnées (public/art/) : elles s'affichent aussi sur Vercel
  { id: "mitch", name: "Mitch", handle: "", category: "trader", art: "/art/mitch.webp", artPos: "50% 42%",
    mythic: { banner: "/art/mitch.webp", avatar: "/art/mitch-face.webp" } },
  { id: "cupsey", name: "Cupsey", handle: "@Cupseyy", category: "legend", art: BANNER.cupsey, artPos: "93% 30%", theme: "sponge",
    mythic: { banner: BANNER.cupsey, avatar: "https://pbs.twimg.com/profile_images/1878584793249583104/WMH0-IGY_400x400.jpg" } },
  // Cented : sa pdp (Todoroki, le feu et la glace) en principale, sa bannière dans la planche
  { id: "cented", name: "Cented", handle: "@Cented7", category: "famous", art: "/art/cented-face.webp", artPos: "50% 35%", theme: "duo",
    mythic: { banner: "/art/cented.webp", avatar: "/art/cented-face.webp",
      panels: { top: { src: "/art/cented.webp", pos: "62% 50%" }, left: { src: "/art/cented.webp", pos: "26% 62%" }, right: { src: "/art/cented.webp", pos: "80% 24%" } } } },
  // Gake : une seule image, la sienne partout ; sa Mythic est un dessin d'enfant
  { id: "gake", name: "Gake", handle: "", category: "famous", art: "/art/gake.webp", artPos: "50% 40%", theme: "crayon",
    mythic: { banner: "/art/gake.webp", avatar: "/art/gake.webp",
      panels: { top: { src: "/art/gake.webp", pos: "50% 22%" }, left: { src: "/art/gake.webp", pos: "4% 62%" }, right: { src: "/art/gake.webp", pos: "96% 60%" } } } },
  // Frank : son dessin en principale ; sa Mythic montre sa photo, le dessin en sticker. Thème bling.
  { id: "frank", name: "Frank", handle: "", category: "famous", art: "/art/frank.webp", artPos: "50% 40%", theme: "bling",
    mythic: { banner: "/art/frank-photo.webp", avatar: "/art/frank.webp",
      panels: { top: { src: "/art/frank-photo.webp", pos: "50% 28%" }, left: { src: "/art/frank-photo.webp", pos: "30% 30%" }, right: { src: "/art/frank-photo.webp", pos: "60% 70%" } } } },
  // Alon : pump.fun. Sa pdp en principale, sa bannière (les gélules) dans la planche, le vert pump.fun
  { id: "alon", name: "Alon", handle: "", category: "dev", art: "/art/alon-face.webp", artPos: "50% 38%", theme: "pump",
    mythic: { banner: "/art/alon.webp", avatar: "/art/alon-face.webp",
      panels: { top: { src: "/art/alon.webp", pos: "50% 30%" }, left: { src: "/art/alon.webp", pos: "0% 55%" }, right: { src: "/art/alon.webp", pos: "100% 55%" } } } },
  // Jack Duval : sa pdp en principale ; « The Duve is calling… » dans la planche de
  // sa Mythic, qui sonne : son visage en haut, Decline à gauche, Accept à droite.
  { id: "jack", name: "Jack Duval", handle: "", category: "bundler", art: "/art/duve-face.webp", artPos: "50% 32%", theme: "call", tint: "blue",
    mythic: { banner: "/art/duve-call.webp", avatar: "/art/duve-face.webp",
      panels: { top: { src: "/art/duve-call.webp", pos: "50% 38%" }, left: { src: "/art/duve-call.webp", pos: "18% 90%" }, right: { src: "/art/duve-call.webp", pos: "82% 90%" } } } },
  // ses images sont celles qu'on nous a données, versionnées dans public/art/.
  // L'image principale (Commun, Rare, Shiny, OG) est sa pdp, Killua ; la bannière
  // ne sert qu'à la planche de sa Mythic, qui est électrique.
  { id: "decu", name: "DECU", handle: "", category: "famous", art: "/art/decu-face.webp", artPos: "50% 42%", theme: "volt", tint: "blue",
    mythic: { banner: "/art/decu.webp", avatar: "/art/decu-face.webp" } },
  // Ansem : sa pdp en principale ; le taureau dans la brume sur son OG et dans sa
  // planche Mythic, avec la bannière (les singes de Banksy) et sa pdp au centre.
  { id: "ansem", name: "Ansem", handle: "", category: "legend", art: "/art/ansem-face.webp", artPos: "58% 30%", theme: "mist", tint: "gold",
    shots: { og: { src: "/art/ansem-bull.webp", pos: "50% 40%" } },
    mythic: { banner: "/art/ansem.webp", avatar: "/art/ansem-face.webp",
      panels: { top: { src: "/art/ansem-bull.webp", pos: "50% 18%" }, left: { src: "/art/ansem.webp", pos: "22% 50%" }, right: { src: "/art/ansem-bull.webp", pos: "50% 92%" } } } },
  // le handle X reste vide tant qu'on n'a pas le bon
  { id: "kimchi", name: "Kimchi", handle: "", category: "legend", art: "/traders/kimchi-desert.webp", artPos: "40% 60%",
    aura: {
      print: "/traders/kimchi-desert.webp",
      table: "/traders/kimchi-table.webp",
      jet: "/traders/kimchi-jet.webp",
      film: "/traders/kimchi-flash.webp",
      bg: "/traders/kimchi-aura-bg.webp",
      cut: "/traders/kimchi-aura-cut.webp",
      glow: "/traders/kimchi-aura-glow.png",
    } },
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
/* Le numéro imprimé : 0042/2000, ou 1/1 pour une Mythic. */
export function serialOf(c: Card) {
  const { supply } = rarity(c.rarity);
  return supply === 1 ? "1/1" : `${String(c.serial).padStart(String(supply).length, "0")}/${supply}`;
}

/* Les boosters : un par catégorie. Il ne contient que ses personnages ; plus la
   catégorie est recherchée, plus il coûte, plus il a de cartes et de garanties. */
export type Pack = {
  id: CategoryId;
  name: string;
  price: number;         // en SOL
  cards: number;
  pool: CategoryId;      // seulement cette catégorie
  guarantee?: RarityId;  // la dernière carte est au moins de cette rareté
  boost?: number;        // multiplie les chances d'OG et de Mythic
  color: string;         // la couleur du papier du booster
  ink: string;           // la couleur de son motif
  motif: "dots" | "stripes" | "rays";
};

const PACK_RULES: Record<CategoryId, Pick<Pack, "price" | "cards" | "guarantee" | "boost" | "motif">> = {
  trader: { price: 0.1, cards: 3, motif: "dots" },
  trencher: { price: 0.15, cards: 3, motif: "stripes" },
  dev: { price: 0.15, cards: 3, motif: "dots" },
  sniper: { price: 0.2, cards: 3, motif: "rays" },
  bundler: { price: 0.2, cards: 3, motif: "stripes" },
  famous: { price: 0.35, cards: 4, guarantee: "rare", motif: "rays" },
  legend: { price: 0.75, cards: 5, guarantee: "shiny", boost: 2, motif: "rays" },
};

export const PACKS: Pack[] = CATEGORIES.map((c) => ({
  id: c.id, name: c.name, pool: c.id, color: c.bg, ink: c.ink, ...PACK_RULES[c.id],
}));
/* Les personnages d'un booster ; vide tant que sa catégorie n'en a aucun. */
export const packTraders = (p: Pack) => TRADERS.filter((t) => t.category === p.pool);
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
  const pool = p ? packTraders(p) : [];
  const who = pool.length ? pool : TRADERS;
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
