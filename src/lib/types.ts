/* Ce que le serveur renvoie : les cartes possédées, les annonces, les ventes. */

import type { Card, CategoryId } from "./data";

/* Une carte imprimée : son numéro est à elle seule, son propriétaire est un wallet. */
export type Owned = Card & {
  uid: string;
  owner: string;
  pack: CategoryId; // le booster d'où elle sort
  at: number;       // ouverte le (ms)
};

/* Une annonce : un prix fixé par le vendeur, en lamports. */
export type Listing = {
  id: string;
  uid: string;
  seller: string;
  lamports: number;
  at: number;
};
export type Offer = Listing & { card: Owned };

export type Sale = {
  uid: string; trader: string; rarity: Card["rarity"]; serial: number;
  seller: string; buyer: string; lamports: number; sig: string; at: number;
};

export type Me = { wallet: string | null; cards: Owned[]; listings: Listing[]; sales: Sale[] };
