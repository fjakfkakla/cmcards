import { route } from "@/lib/server/errors";
import { cardsOf, listingsOf, recentSales } from "@/lib/server/game";
import { sessionWallet } from "@/lib/server/session";
import type { Me } from "@/lib/types";

/* Le joueur connecté : ses cartes, ses annonces, ses dernières ventes et achats. */
export const GET = route(async (): Promise<Me> => {
  const wallet = await sessionWallet();
  if (!wallet) return { wallet: null, cards: [], listings: [], sales: [] };
  const [cards, listings, sales] = await Promise.all([cardsOf(wallet), listingsOf(wallet), recentSales(500)]);
  return { wallet, cards, listings, sales: sales.filter((s) => s.buyer === wallet || s.seller === wallet) };
});
