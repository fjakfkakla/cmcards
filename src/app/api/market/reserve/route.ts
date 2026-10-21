import { route, Oops } from "@/lib/server/errors";
import { reserve } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Avant de payer : la carte est gardée pour cet acheteur, le prix ne bouge plus. */
export const POST = route(async ({ uid }) => {
  const wallet = await needWallet();
  if (typeof uid !== "string") throw new Oops(400, "Invalid request.");
  return { listing: await reserve(wallet, uid) };
});
