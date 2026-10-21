import { route, Oops } from "@/lib/server/errors";
import { isSignature } from "@/lib/server/chain";
import { buy } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Le paiement fait : le serveur le lit sur la chaîne et passe la carte à l'acheteur. */
export const POST = route(async ({ uid, listing, signature }) => {
  const wallet = await needWallet();
  if (typeof uid !== "string" || typeof listing !== "string" || !isSignature(signature))
    throw new Oops(400, "Invalid request.");
  return { card: await buy(wallet, uid, listing, signature) };
});
