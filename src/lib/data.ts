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

/* Les catégories, de la plus courante à la plus recherchée : les Trencher sont la
   base, les Legend en dernier. */
export type CategoryId = "trencher" | "dev" | "bundler" | "famous" | "legend";
export type Category = {
  id: CategoryId; name: string; tagline: string;
  bg: string;    // le fond des cartes, le papier du booster
  ink: string;   // le motif du booster
  glyph: string; // dessiné sur une grille de 24
};
export const CATEGORIES: Category[] = [
  { id: "trencher", name: "Trencher", tagline: "La base", bg: "#ff9a1f", ink: "#ffbb63",
    glyph: "M15.5 2 22 8.5l-1.4 1.4-1.6-1.6-4.3 4.3 1.1 1.1-3 3a3 3 0 0 1-4.2 0l-.3-.3-4.9 4.9L2 19.9 6.9 15l-.3-.3a3 3 0 0 1 0-4.2l3-3 1.1 1.1 4.3-4.3-1.6-1.6z" },
  { id: "dev", name: "Dev", tagline: "Les bons", bg: "#3dcb6c", ink: "#6fdd92",
    glyph: "M8.6 6.4 3 12l5.6 5.6 1.4-1.4L5.8 12 10 7.8zm6.8 0L14 7.8l4.2 4.2-4.2 4.2 1.4 1.4L21 12z" },
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
  // d'enfant, les gélules pump.fun, le feu et la glace, le bling, l'appel entrant,
  // les billets qui tombent, les yeux laser
  theme?: "sponge" | "volt" | "mist" | "crayon" | "pump" | "duo" | "bling" | "call" | "cash" | "laser";
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
  { id: "mitch", name: "Mitch", handle: "", category: "trencher", art: "/art/mitch.webp", artPos: "50% 42%",
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
  // Rice : une seule image, la sienne partout : Pepe le fermier, le chapeau de
  // paille et le fusil dans son champ. Pas de thème pour sa Mythic : la planche de base.
  { id: "rice", name: "Rice", handle: "", category: "famous", art: "/art/rice.webp", artPos: "50% 55%",
    mythic: { banner: "/art/rice.webp", avatar: "/art/rice.webp",
      panels: { top: { src: "/art/rice.webp", pos: "50% 18%" }, left: { src: "/art/rice.webp", pos: "8% 60%" }, right: { src: "/art/rice.webp", pos: "92% 60%" } } } },
  // Sling : une seule image, la sienne partout : le dessin aux lunettes de ski et
  // aux rayons sur fond jaune. Pas de thème pour sa Mythic : la planche de base.
  { id: "sling", name: "Sling", handle: "", category: "famous", art: "/art/sling.webp", artPos: "50% 40%",
    mythic: { banner: "/art/sling.webp", avatar: "/art/sling.webp",
      panels: { top: { src: "/art/sling.webp", pos: "50% 20%" }, left: { src: "/art/sling.webp", pos: "10% 60%" }, right: { src: "/art/sling.webp", pos: "90% 60%" } } } },
  // Frank : son dessin en principale ; sa Mythic montre sa photo, le dessin en sticker. Thème bling.
  { id: "frank", name: "Frank", handle: "", category: "famous", art: "/art/frank.webp", artPos: "50% 40%", theme: "bling",
    mythic: { banner: "/art/frank-photo.webp", avatar: "/art/frank.webp",
      panels: { top: { src: "/art/frank-photo.webp", pos: "50% 28%" }, left: { src: "/art/frank-photo.webp", pos: "30% 30%" }, right: { src: "/art/frank-photo.webp", pos: "60% 70%" } } } },
  // Alon : pump.fun, une Legend. Sa pdp en principale, sa bannière (les gélules) dans la planche ; sa Mythic reste verte
  { id: "alon", name: "Alon", handle: "", category: "legend", art: "/art/alon-face.webp", artPos: "50% 38%", theme: "pump",
    mythic: { banner: "/art/alon.webp", avatar: "/art/alon-face.webp",
      panels: { top: { src: "/art/alon.webp", pos: "50% 30%" }, left: { src: "/art/alon.webp", pos: "0% 55%" }, right: { src: "/art/alon.webp", pos: "100% 55%" } } } },
  // Jack Duval : sa pdp en principale ; « The Duve is calling… » dans la planche de
  // sa Mythic, qui sonne : son visage en haut, Decline à gauche, Accept à droite.
  { id: "jack", name: "Jack Duval", handle: "", category: "bundler", art: "/art/duve-face.webp", artPos: "50% 32%", theme: "call", tint: "blue",
    mythic: { banner: "/art/duve-call.webp", avatar: "/art/duve-face.webp",
      panels: { top: { src: "/art/duve-call.webp", pos: "50% 38%" }, left: { src: "/art/duve-call.webp", pos: "18% 90%" }, right: { src: "/art/duve-call.webp", pos: "82% 90%" } } } },
  // Yenni : le chat rose, un Trencher. Sa pdp en principale ; un chat qui compte en
  // billets : sa Shiny est en or. Sa bannière (YENNI, la lune, les billets) dans la
  // planche de sa Mythic : le nom et la lune en haut, le pistolet à billets à gauche,
  // le chat à lunettes à droite ; il pleut des billets.
  { id: "yenni", name: "Yenni", handle: "", category: "trencher", art: "/art/yenni-face.webp", artPos: "50% 55%", theme: "cash", tint: "gold",
    mythic: { banner: "/art/yenni.webp", avatar: "/art/yenni-face.webp",
      panels: { top: { src: "/art/yenni.webp", pos: "11% 50%" }, left: { src: "/art/yenni.webp", pos: "61% 60%" }, right: { src: "/art/yenni.webp", pos: "100% 50%" } } } },
  // Profit : le chat noir aux yeux bleus en principale ; le fantôme pixel (sa
  // seconde image) sur son OG et dans la planche de sa Mythic, aux yeux laser. Un Famous.
  { id: "profit", name: "Profit", handle: "", category: "famous", art: "/art/profit-face.webp", artPos: "50% 45%", theme: "laser", tint: "blue",
    shots: { og: { src: "/art/profit-ghost.webp", pos: "50% 50%" } },
    mythic: { banner: "/art/profit-ghost.webp", avatar: "/art/profit-face.webp",
      panels: { top: { src: "/art/profit-ghost.webp", pos: "50% 45%" }, left: { src: "/art/profit-ghost.webp", pos: "0% 50%" }, right: { src: "/art/profit-ghost.webp", pos: "66% 46%" } } } },
  // Unipcs : le petit robot jaune (sa pdp, un rendu 3D : sa Shiny est en or) en
  // principale ; sa bannière (le robot devant son armée dans le désert) sur son OG
  // et dans la planche de sa Mythic : le robot et l'armée en haut, l'armée en rang
  // à gauche, son casque en gros plan à droite, la pdp en sticker. Un Famous.
  { id: "unipcs", name: "Unipcs", handle: "", category: "famous", art: "/art/unipcs-face.webp", artPos: "50% 42%", tint: "gold",
    shots: { og: { src: "/art/unipcs-army.webp", pos: "72% 50%" } },
    mythic: { banner: "/art/unipcs-army.webp", avatar: "/art/unipcs-face.webp",
      panels: { top: { src: "/art/unipcs-army.webp", pos: "72% 50%" }, left: { src: "/art/unipcs-army.webp", pos: "30% 55%" }, right: { src: "/art/unipcs-army.webp", pos: "80% 12%" } } } },
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
  // Trunoest : sa pdp (la silhouette dans la lueur rouge) en principale ; sa
  // bannière (les nuées rouges) dans les trois cases de la planche Mythic, la pdp en sticker.
  { id: "trunoest", name: "Trunoest", handle: "", category: "trencher", art: "/art/trunoest-face.webp", artPos: "50% 40%",
    mythic: { banner: "/art/trunoest.webp", avatar: "/art/trunoest-face.webp",
      panels: { top: { src: "/art/trunoest.webp", pos: "50% 50%" }, left: { src: "/art/trunoest.webp", pos: "18% 50%" }, right: { src: "/art/trunoest.webp", pos: "82% 50%" } } } },
  // Cooker : sa pdp (la fille en blouse tachée de peinture, au téléphone dans le
  // ciel) en principale ; sa bannière (les châteaux sur leurs îles flottantes)
  // dans les trois cases de la planche Mythic, la pdp en sticker. Un Trencher, pas de thème.
  { id: "cooker", name: "Cooker", handle: "", category: "trencher", art: "/art/cooker-face.webp", artPos: "50% 38%",
    mythic: { banner: "/art/cooker.webp", avatar: "/art/cooker-face.webp",
      panels: { top: { src: "/art/cooker.webp", pos: "62% 50%" }, left: { src: "/art/cooker.webp", pos: "10% 45%" }, right: { src: "/art/cooker.webp", pos: "96% 65%" } } } },
  // Trencher : une seule image, la sienne partout : le gardien aux cheveux blancs,
  // en noir et blanc (manga). Sa Shiny est en bleu électrique. Pas de thème pour sa Mythic.
  { id: "trencher", name: "Trencher", handle: "", category: "famous", art: "/art/trencher.webp", artPos: "50% 40%", tint: "blue",
    mythic: { banner: "/art/trencher.webp", avatar: "/art/trencher.webp",
      panels: { top: { src: "/art/trencher.webp", pos: "50% 20%" }, left: { src: "/art/trencher.webp", pos: "12% 55%" }, right: { src: "/art/trencher.webp", pos: "88% 55%" } } } },
  // Superman : une seule image, la sienne partout : à genoux, enchaîné, bras en
  // croix devant le mur blanc. Un rendu 3D, comme une photo : sa Shiny est en or.
  // Pas de thème pour sa Mythic. Le premier Dev.
  { id: "superman", name: "Superman", handle: "", category: "dev", art: "/art/superman.webp", artPos: "50% 45%", tint: "gold",
    mythic: { banner: "/art/superman.webp", avatar: "/art/superman.webp",
      panels: { top: { src: "/art/superman.webp", pos: "50% 30%" }, left: { src: "/art/superman.webp", pos: "22% 55%" }, right: { src: "/art/superman.webp", pos: "88% 20%" } } } },
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
  skin?: "multiverse"; // le sachet des Legend : le multivers, pas le papier de la catégorie
};

const PACK_RULES: Record<CategoryId, Pick<Pack, "price" | "cards" | "guarantee" | "boost" | "motif" | "skin">> = {
  trencher: { price: 0.1, cards: 3, motif: "stripes" },
  dev: { price: 0.15, cards: 3, motif: "dots" },
  bundler: { price: 0.2, cards: 3, motif: "rays" },
  famous: { price: 0.35, cards: 4, guarantee: "rare", motif: "rays" },
  legend: { price: 0.75, cards: 5, guarantee: "shiny", boost: 2, motif: "rays", skin: "multiverse" },
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
