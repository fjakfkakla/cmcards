/* Le catalogue de la saison 1. Une carte ne contient rien : elle vaut ce que les
   joueurs en donnent sur le marché. Le seul prix fixé par cm cards : les boosters. */

/* Le système de cm cards : une carte = un personnage, une catégorie, une rareté.
   La catégorie donne le fond (et le booster), la rareté donne la bordure et l'effet. */

export type RarityId = "common" | "rare" | "shiny" | "og" | "mythic";

export type Rarity = {
  id: RarityId;
  name: string;
  odds: number;   // probabilité dans un booster, en %
  supply: number; // exemplaires numérotés par personnage : il n'y en aura jamais plus
};

export const RARITIES: Rarity[] = [
  { id: "common", name: "Commun", odds: 65, supply: 5000 },
  { id: "rare", name: "Rare", odds: 24, supply: 2000 },
  { id: "shiny", name: "Shiny", odds: 9, supply: 500 },
  { id: "og", name: "OG", odds: 1.8, supply: 50 },
  { id: "mythic", name: "Mythic", odds: 0.2, supply: 1 },
];
export const rarity = (id: RarityId) => RARITIES.find((r) => r.id === id)!;

/* Les catégories, de la plus courante à la plus recherchée : les Trencher sont la
   base, puis les Holder, les Legend en dernier. */
export type CategoryId = "trencher" | "holder" | "dev" | "bundler" | "famous" | "legend";
export type Category = {
  id: CategoryId; name: string; tagline: string;
  bg: string;    // le fond des cartes, le papier du booster
  ink: string;   // sa couleur claire
  glyph: string; // dessiné sur une grille de 24
};
export const CATEGORIES: Category[] = [
  { id: "trencher", name: "Trencher", tagline: "La base", bg: "#ff9a1f", ink: "#ffbb63",
    glyph: "M15.5 2 22 8.5l-1.4 1.4-1.6-1.6-4.3 4.3 1.1 1.1-3 3a3 3 0 0 1-4.2 0l-.3-.3-4.9 4.9L2 19.9 6.9 15l-.3-.3a3 3 0 0 1 0-4.2l3-3 1.1 1.1 4.3-4.3-1.6-1.6z" },
  { id: "holder", name: "Holder", tagline: "Mains de diamant", bg: "#2fa8ff", ink: "#74c6ff",
    glyph: "M6 3h12l4 6-10 12L2 9z" },
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
  // les billets qui tombent, les yeux laser, les trophées et les confettis
  theme?: "sponge" | "volt" | "mist" | "crayon" | "pump" | "duo" | "bling" | "call" | "cash" | "laser" | "trophy";
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
  // Rasmr : sa photo au verre de vin, dans la lumière bleue, en principale ; une photo,
  // sa Shiny est bleue. La photo au bord de la piscine (sa seconde image) sur son OG et
  // dans la planche de sa Mythic : lui sous le parasol en haut, ses sneakers à gauche,
  // le parfum et les lunettes à droite. Pas de thème. Un Famous.
  { id: "rasmr", name: "Rasmr", handle: "", category: "famous", art: "/art/rasmr-face.webp", artPos: "50% 40%", tint: "blue",
    shots: { og: { src: "/art/rasmr-pool.webp", pos: "48% 45%" } },
    mythic: { banner: "/art/rasmr-pool.webp", avatar: "/art/rasmr-face.webp",
      panels: { top: { src: "/art/rasmr-pool.webp", pos: "50% 32%" }, left: { src: "/art/rasmr-pool.webp", pos: "45% 92%" }, right: { src: "/art/rasmr-pool.webp", pos: "75% 57%" } } } },
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
  // Dior : une seule image, la sienne partout : le gardien aux cheveux blancs,
  // en noir et blanc (manga). Sa Shiny est en bleu électrique. Pas de thème pour sa Mythic.
  { id: "dior", name: "Dior", handle: "", category: "trencher", art: "/art/dior.webp", artPos: "50% 40%", tint: "blue",
    mythic: { banner: "/art/dior.webp", avatar: "/art/dior.webp",
      panels: { top: { src: "/art/dior.webp", pos: "50% 20%" }, left: { src: "/art/dior.webp", pos: "12% 55%" }, right: { src: "/art/dior.webp", pos: "88% 55%" } } } },
  // Superman : une seule image, la sienne partout : à genoux, enchaîné, bras en
  // croix devant le mur blanc. Un rendu 3D, comme une photo : sa Shiny est en or.
  // Pas de thème pour sa Mythic. Le premier Dev.
  { id: "superman", name: "Superman", handle: "", category: "dev", art: "/art/superman.webp", artPos: "50% 45%", tint: "gold",
    mythic: { banner: "/art/superman.webp", avatar: "/art/superman.webp",
      panels: { top: { src: "/art/superman.webp", pos: "50% 30%" }, left: { src: "/art/superman.webp", pos: "22% 55%" }, right: { src: "/art/superman.webp", pos: "88% 20%" } } } },
  // Daumen : une seule image, la sienne partout : le poussin jaune en peluche, tout
  // sourire. Un rendu 3D, comme une photo : sa Shiny est en or. Pas de thème pour sa Mythic.
  { id: "daumen", name: "Daumen", handle: "", category: "famous", art: "/art/daumen.webp", artPos: "50% 45%", tint: "gold",
    mythic: { banner: "/art/daumen.webp", avatar: "/art/daumen.webp",
      panels: { top: { src: "/art/daumen.webp", pos: "50% 25%" }, left: { src: "/art/daumen.webp", pos: "15% 55%" }, right: { src: "/art/daumen.webp", pos: "85% 55%" } } } },
  // Megga : une seule image, la sienne partout : sa photo tout sourire, les boucles
  // brunes. Une photo : sa Shiny est en or. Pas de thème pour sa Mythic.
  { id: "megga", name: "MEGGA", handle: "", category: "famous", art: "/art/megga.webp", artPos: "42% 45%", tint: "gold",
    mythic: { banner: "/art/megga.webp", avatar: "/art/megga.webp",
      panels: { top: { src: "/art/megga.webp", pos: "42% 35%" }, left: { src: "/art/megga.webp", pos: "20% 55%" }, right: { src: "/art/megga.webp", pos: "60% 60%" } } } },
  // Limfork : une seule image, la sienne partout : le dessin en niqab noir, les grands
  // yeux verts aux reflets en cœur. Presque en noir et blanc : sa Shiny est en bleu
  // électrique. Pas de thème pour sa Mythic. Un Trencher.
  { id: "limfork", name: "Limfork", handle: "", category: "trencher", art: "/art/limfork.webp", artPos: "50% 42%", tint: "blue",
    mythic: { banner: "/art/limfork.webp", avatar: "/art/limfork.webp",
      panels: { top: { src: "/art/limfork.webp", pos: "50% 42%" }, left: { src: "/art/limfork.webp", pos: "15% 65%" }, right: { src: "/art/limfork.webp", pos: "85% 65%" } } } },
  // Alxcooks : une seule image, la sienne partout : de nuit dans la rue aux néons,
  // les tresses, il se retourne par-dessus l'épaule. Une photo : sa Shiny est en or.
  // Pas de thème pour sa Mythic. Un Trencher.
  { id: "alxcooks", name: "Alxcooks", handle: "", category: "trencher", art: "/art/alxcooks.webp", artPos: "58% 40%", tint: "gold",
    mythic: { banner: "/art/alxcooks.webp", avatar: "/art/alxcooks.webp",
      panels: { top: { src: "/art/alxcooks.webp", pos: "50% 32%" }, left: { src: "/art/alxcooks.webp", pos: "10% 55%" }, right: { src: "/art/alxcooks.webp", pos: "90% 50%" } } } },
  // Pain : une seule image, la sienne partout : le ninja au bandeau frontal, les
  // yeux du Rinnegan, la foudre sur fond rouge. Sa Shiny est en or (pas de peau verte).
  // Pas de thème pour sa Mythic. Le premier Holder.
  { id: "pain", name: "Pain", handle: "", category: "holder", art: "/art/pain.webp", artPos: "50% 38%", tint: "gold",
    mythic: { banner: "/art/pain.webp", avatar: "/art/pain.webp",
      panels: { top: { src: "/art/pain.webp", pos: "50% 20%" }, left: { src: "/art/pain.webp", pos: "12% 70%" }, right: { src: "/art/pain.webp", pos: "88% 25%" } } } },
  // Théo : une seule image, la sienne partout : la silhouette par défaut, noire sur
  // fond gris. En noir et blanc : sa Shiny est en bleu électrique. Pas de thème pour
  // sa Mythic. Un Trencher.
  { id: "theo", name: "théo", handle: "", category: "trencher", art: "/art/theo.webp", artPos: "50% 45%", tint: "blue",
    mythic: { banner: "/art/theo.webp", avatar: "/art/theo.webp",
      panels: { top: { src: "/art/theo.webp", pos: "50% 30%" }, left: { src: "/art/theo.webp", pos: "20% 60%" }, right: { src: "/art/theo.webp", pos: "80% 60%" } } } },
  // blu6k : une seule image, la sienne partout : la grenouille peinte en mafieux,
  // le borsalino et le costume bleus, le cigare au bec, la pochette rouge. Une peau
  // verte : sa Shiny est en bleu électrique. Pas de thème pour sa Mythic. Un Trencher.
  { id: "blu6k", name: "blu6k", handle: "", category: "trencher", art: "/art/blu6k.webp", artPos: "50% 45%", tint: "blue",
    mythic: { banner: "/art/blu6k.webp", avatar: "/art/blu6k.webp",
      panels: { top: { src: "/art/blu6k.webp", pos: "50% 25%" }, left: { src: "/art/blu6k.webp", pos: "15% 55%" }, right: { src: "/art/blu6k.webp", pos: "80% 85%" } } } },
  // Zero : sa pdp (Kurapika, le regard en coin) en principale ; sa bannière (ZEROPNL,
  // Hunter x Hunter en bleu et or, les chaînes) sur son OG et dans la planche de sa
  // Mythic : le nom et Kurapika enchaîné en haut, Kurapika aux chaînes à gauche, Gon
  // à droite, la pdp en sticker. Pas de thème. Un Trencher.
  { id: "zero", name: "Zero", handle: "", category: "trencher", art: "/art/zero-face.webp", artPos: "50% 40%",
    shots: { og: { src: "/art/zero.webp", pos: "37% 50%" } },
    mythic: { banner: "/art/zero.webp", avatar: "/art/zero-face.webp",
      panels: { top: { src: "/art/zero.webp", pos: "66% 40%" }, left: { src: "/art/zero.webp", pos: "20% 55%" }, right: { src: "/art/zero.webp", pos: "84% 100%" } } } },
  // ART : sa pdp (Guts sous la neige, l'épée sur l'épaule) en principale ; un dessin
  // en couleurs aux tons froids : sa Shiny est en bleu électrique. Sa bannière (ART,
  // Guts et sa Berserker Armor dans la brume) sur son OG (Guts) et dans la planche
  // de sa Mythic : le nom et l'armure en haut, Guts à gauche, la bête qui hurle à
  // droite, la pdp en sticker. Pas de thème. Un Trencher.
  { id: "art", name: "ART", handle: "", category: "trencher", art: "/art/art-face.webp", artPos: "50% 35%", tint: "blue",
    shots: { og: { src: "/art/art.webp", pos: "15% 40%" } },
    mythic: { banner: "/art/art.webp", avatar: "/art/art-face.webp",
      panels: { top: { src: "/art/art.webp", pos: "55% 35%" }, left: { src: "/art/art.webp", pos: "12% 40%" }, right: { src: "/art/art.webp", pos: "88% 50%" } } } },
  // Ethan pr6spr : sa pdp (Zenitsu, les cheveux blonds dans la lumière) en principale ;
  // un éclair jaune : sa Shiny est en or. Sa seconde image, détourée de sa miniature
  // YouTube (lui seul, les boucles brunes et le maillot solana spaces), sur son OG et
  // dans la planche de sa Mythic : son visage en haut, le maillot à gauche, la chaîne
  // à droite. Pas de thème. Un Trencher.
  { id: "ethan", name: "Ethan pr6spr", handle: "", category: "trencher", art: "/art/ethan-face.webp", artPos: "50% 40%", tint: "gold",
    shots: { og: { src: "/art/ethan.webp", pos: "50% 35%" } },
    mythic: { banner: "/art/ethan.webp", avatar: "/art/ethan-face.webp",
      panels: { top: { src: "/art/ethan.webp", pos: "50% 30%" }, left: { src: "/art/ethan.webp", pos: "0% 85%" }, right: { src: "/art/ethan.webp", pos: "80% 75%" } } } },
  // Nyhrox : sa photo de dos (le t-shirt GALLERY DEPT., le pantalon crème, la
  // casquette à la main) en principale ; une photo : sa Shiny est en or. Sa seconde
  // image (lui et la 911 grise chez Porsche) sur son OG et dans la planche de sa
  // Mythic : lui, PORSCHE et la voiture en haut, lui à la portière à gauche, le
  // capot et l'écusson à droite. Un champion : sa Mythic est en trophées. Un Holder.
  { id: "nyhrox", name: "Nyhrox", handle: "", category: "holder", art: "/art/nyhrox.webp", artPos: "48% 50%", tint: "gold", theme: "trophy",
    shots: { og: { src: "/art/nyhrox-porsche.webp", pos: "30% 50%" } },
    mythic: { banner: "/art/nyhrox-porsche.webp", avatar: "/art/nyhrox.webp",
      panels: { top: { src: "/art/nyhrox-porsche.webp", pos: "50% 30%" }, left: { src: "/art/nyhrox-porsche.webp", pos: "20% 38%" }, right: { src: "/art/nyhrox-porsche.webp", pos: "56% 62%" } } } },
  // Matt : une seule image, la sienne partout : le Ken des Oscars, le costume rose à
  // strass, les lunettes noires, les bras ouverts devant les danseurs en smoking et
  // chapeau de cow-boy. Une photo : sa Shiny est en or. Pas de thème pour sa Mythic.
  // Un Trencher.
  { id: "matt", name: "Matt", handle: "", category: "trencher", art: "/art/matt.webp", artPos: "56% 40%", tint: "gold",
    mythic: { banner: "/art/matt.webp", avatar: "/art/matt.webp",
      panels: { top: { src: "/art/matt.webp", pos: "56% 30%" }, left: { src: "/art/matt.webp", pos: "10% 55%" }, right: { src: "/art/matt.webp", pos: "90% 30%" } } } },
  // jijo : une seule image, la sienne partout : le fantôme aux yeux noirs, peint en
  // arc-en-ciel dans les remous de couleurs. Déjà toutes les teintes : sa Shiny les
  // décale. Pas de thème pour sa Mythic. Un Trencher.
  { id: "jijo", name: "jijo", handle: "", category: "trencher", art: "/art/jijo.webp", artPos: "50% 45%",
    mythic: { banner: "/art/jijo.webp", avatar: "/art/jijo.webp",
      panels: { top: { src: "/art/jijo.webp", pos: "50% 30%" }, left: { src: "/art/jijo.webp", pos: "10% 40%" }, right: { src: "/art/jijo.webp", pos: "90% 15%" } } } },
  // Cap : une seule image, la sienne partout : le ninja en pixel art, le bonnet bleu,
  // le masque aux yeux blancs, qui se défait en pixels sur la gauche, sur fond noir.
  // Un dessin tout en bleu : sa Shiny décale ses teintes, pas de teinte. Pas de thème
  // pour sa Mythic. Un Trencher.
  { id: "cap", name: "Cap", handle: "", category: "trencher", art: "/art/cap.webp", artPos: "58% 45%",
    mythic: { banner: "/art/cap.webp", avatar: "/art/cap.webp",
      panels: { top: { src: "/art/cap.webp", pos: "60% 20%" }, left: { src: "/art/cap.webp", pos: "10% 45%" }, right: { src: "/art/cap.webp", pos: "80% 55%" } } } },
  // whashywash : une seule image, la sienne partout : en Cap'n Crunch, le bicorne bleu
  // au « C » jaune, la moustache blanche, la cuillère et le bol de céréales. Une photo :
  // sa Shiny est en or. Pas de thème pour sa Mythic. Un Famous.
  { id: "whashywash", name: "whashywash", handle: "", category: "famous", art: "/art/whashywash.webp", artPos: "48% 45%", tint: "gold",
    mythic: { banner: "/art/whashywash.webp", avatar: "/art/whashywash.webp",
      panels: { top: { src: "/art/whashywash.webp", pos: "50% 12%" }, left: { src: "/art/whashywash.webp", pos: "25% 75%" }, right: { src: "/art/whashywash.webp", pos: "75% 85%" } } } },
  // dv : une seule image, la sienne partout : la Porsche orange, la roue aux étriers
  // jaunes, et lui debout à côté, les sneakers noires à la croix rouge. Une photo de
  // nuit, presque noire : l'or la verdit, sa Shiny est en bleu électrique. Pas de
  // thème pour sa Mythic. Un Famous.
  { id: "dv", name: "dv", handle: "", category: "famous", art: "/art/dv.webp", artPos: "62% 50%", tint: "blue",
    mythic: { banner: "/art/dv.webp", avatar: "/art/dv.webp",
      panels: { top: { src: "/art/dv.webp", pos: "50% 70%" }, left: { src: "/art/dv.webp", pos: "10% 30%" }, right: { src: "/art/dv.webp", pos: "80% 65%" } } } },
  // Schoen : une seule image, la sienne partout : le portrait sur fond gris clair, les
  // lunettes noires, la chemise blanche ouverte, la chaîne au cou. Une photo sur fond
  // clair : l'or la jaunit et verdit ses cheveux, sa Shiny est en bleu électrique. Pas
  // de thème pour sa Mythic. Un Trencher.
  { id: "schoen", name: "Schoen", handle: "", category: "trencher", art: "/art/schoen.webp", artPos: "52% 40%", tint: "blue",
    mythic: { banner: "/art/schoen.webp", avatar: "/art/schoen.webp",
      panels: { top: { src: "/art/schoen.webp", pos: "50% 38%" }, left: { src: "/art/schoen.webp", pos: "30% 90%" }, right: { src: "/art/schoen.webp", pos: "85% 40%" } } } },
  // Bean : une seule image, la sienne partout : Lelouch, les cheveux noirs, le haut
  // col de sa cape et le jabot blanc. En noir et blanc (manga) : sa Shiny est en bleu
  // électrique. Pas de thème pour sa Mythic. Un Holder.
  { id: "bean", name: "Bean", handle: "", category: "holder", art: "/art/bean.webp", artPos: "50% 38%", tint: "blue",
    mythic: { banner: "/art/bean.webp", avatar: "/art/bean.webp",
      panels: { top: { src: "/art/bean.webp", pos: "50% 30%" }, left: { src: "/art/bean.webp", pos: "8% 70%" }, right: { src: "/art/bean.webp", pos: "62% 92%" } } } },
  // trey : une seule image, la sienne partout : l'homme sans nom de profil, le chapeau,
  // la barbe et le cigarillo, le poncho brun devant les collines. Une photo : sa Shiny
  // est en or. Pas de thème pour sa Mythic. Un Holder.
  { id: "trey", name: "trey", handle: "", category: "holder", art: "/art/trey.webp", artPos: "55% 40%", tint: "gold",
    mythic: { banner: "/art/trey.webp", avatar: "/art/trey.webp",
      panels: { top: { src: "/art/trey.webp", pos: "55% 25%" }, left: { src: "/art/trey.webp", pos: "30% 80%" }, right: { src: "/art/trey.webp", pos: "85% 62%" } } } },
  // Dani : sa pdp (le dos d'Hercule en marbre, sur fond noir) en principale ; en noir
  // et blanc : sa Shiny est en bleu électrique. Sa bannière (le ciel étoilé, les nuées
  // dans les coins) dans les trois cases de la planche Mythic, la pdp en sticker.
  // Pas de thème. Un Holder.
  { id: "dani", name: "Dani", handle: "", category: "holder", art: "/art/dani-face.webp", artPos: "60% 40%", tint: "blue",
    mythic: { banner: "/art/dani.webp", avatar: "/art/dani-face.webp",
      panels: { top: { src: "/art/dani.webp", pos: "55% 50%" }, left: { src: "/art/dani.webp", pos: "8% 85%" }, right: { src: "/art/dani.webp", pos: "98% 40%" } } } },
  // waiter : une seule image, la sienne partout : Juuzou (Tokyo Ghoul), les cheveux
  // noirs, les barrettes en croix, les yeux rouges, les points sous la lèvre. Presque en
  // noir et blanc : sa Shiny est en bleu électrique. Pas de thème pour sa Mythic. Un Holder.
  { id: "waiter", name: "waiter", handle: "", category: "holder", art: "/art/waiter.webp", artPos: "50% 45%", tint: "blue",
    mythic: { banner: "/art/waiter.webp", avatar: "/art/waiter.webp",
      panels: { top: { src: "/art/waiter.webp", pos: "50% 15%" }, left: { src: "/art/waiter.webp", pos: "22% 35%" }, right: { src: "/art/waiter.webp", pos: "60% 80%" } } } },
  // bandit : une seule image, la sienne partout : le chat tigré attablé devant son verre
  // de vin rouge, et son grand portrait qui veille dans la pénombre. Une photo dans les
  // bruns : sa Shiny est en or. Pas de thème pour sa Mythic. Un Trencher.
  { id: "bandit", name: "bandit", handle: "", category: "trencher", art: "/art/bandit.webp", artPos: "50% 50%", tint: "gold",
    mythic: { banner: "/art/bandit.webp", avatar: "/art/bandit.webp",
      panels: { top: { src: "/art/bandit.webp", pos: "62% 22%" }, left: { src: "/art/bandit.webp", pos: "10% 75%" }, right: { src: "/art/bandit.webp", pos: "58% 90%" } } } },
  // west : sa pdp (en voiture, les lunettes rondes, l'éventail de billets) en
  // principale ; une photo aux tons chauds : l'or la verdit, sa Shiny est en bleu
  // électrique. Sa bannière (le casque blanc dans sa chambre, « it's impossible to
  // quit now… until your death » en sous-titre) ne sert qu'à la planche de sa
  // Mythic : lui et le sous-titre en haut, son visage à gauche, l'étagère à droite,
  // la pdp en sticker. Pas de thème. Un Dev.
  { id: "west", name: "west", handle: "", category: "dev", art: "/art/west.webp", artPos: "50% 45%", tint: "blue",
    mythic: { banner: "/art/west-banner.webp", avatar: "/art/west.webp",
      panels: { top: { src: "/art/west-banner.webp", pos: "50% 75%" }, left: { src: "/art/west-banner.webp", pos: "47% 0%" }, right: { src: "/art/west-banner.webp", pos: "92% 0%" } } } },
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
  serial: number; // son numéro, tiré dans le stock de sa rareté
};

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
  ink: string;           // sa couleur claire
  cover: Cover;          // le personnage imprimé en grand sur le sachet
};
/* La couverture d'un booster : un personnage de la famille, son image, et si elle
   est détourée (posée sur l'éclat, sans fond) ou cadrée plein sachet. */
export type Cover = { trader: string; src?: string; pos?: string; cut?: boolean };

const PACK_RULES: Record<CategoryId, Pick<Pack, "price" | "cards" | "guarantee" | "boost" | "cover">> = {
  trencher: { price: 0.1, cards: 3, cover: { trader: "blu6k", pos: "50% 30%" } },
  holder: { price: 0.12, cards: 3, cover: { trader: "pain", pos: "50% 30%" } },
  dev: { price: 0.15, cards: 3, cover: { trader: "superman", pos: "50% 40%" } },
  bundler: { price: 0.2, cards: 3, cover: { trader: "jack", pos: "50% 30%" } },
  famous: { price: 0.35, cards: 4, guarantee: "rare", cover: { trader: "cented", pos: "50% 28%" } },
  legend: { price: 0.75, cards: 5, guarantee: "shiny", boost: 2, cover: { trader: "kimchi", src: "/traders/kimchi-aura-cut.webp", pos: "50% 0%", cut: true } },
};

export const PACKS: Pack[] = CATEGORIES.map((c) => ({
  id: c.id, name: c.name, pool: c.id, color: c.bg, ink: c.ink, ...PACK_RULES[c.id],
}));
/* Les personnages d'un booster ; vide tant que sa catégorie n'en a aucun. */
export const packTraders = (p: Pack) => TRADERS.filter((t) => t.category === p.pool);
export const pack = (id: string) => PACKS.find((p) => p.id === id);
export const rank = (id: RarityId) => RARITIES.findIndex((r) => r.id === id);

/* La rareté d'une carte, d'un nombre au hasard entre 0 et 1 (tiré par le serveur). */
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

export const fmtSol = (sol: number) =>
  `${sol.toLocaleString("fr-FR", { maximumFractionDigits: sol < 1 ? 3 : 2 })} SOL`;
