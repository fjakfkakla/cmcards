import { route, Oops } from "@/lib/server/errors";
import { list } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Mettre une carte en vente, à son prix (en SOL). Gratuit. */
export const POST = route(async ({ uid, price }) => {
  const wallet = await needWallet();
  if (typeof uid !== "string") throw new Oops(400, "Demande invalide.");
  return { listing: await list(wallet, uid, Number(price)) };
});
