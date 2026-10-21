import { route, Oops } from "@/lib/server/errors";
import { isSignature } from "@/lib/server/chain";
import { openPack } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Un booster payé : le serveur lit le paiement sur la chaîne, puis tire les cartes. */
export const POST = route(async ({ pack, signature }) => {
  const wallet = await needWallet();
  if (typeof pack !== "string" || !isSignature(signature)) throw new Oops(400, "Demande invalide.");
  return { cards: await openPack(wallet, pack, signature) };
});
