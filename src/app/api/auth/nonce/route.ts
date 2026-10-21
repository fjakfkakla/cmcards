import { route, Oops } from "@/lib/server/errors";
import { challenge, isWallet } from "@/lib/server/session";

/* Le message que le wallet va signer. */
export const POST = route(async ({ wallet }) => {
  if (!isWallet(wallet)) throw new Oops(400, "Adresse de wallet invalide.");
  return { message: challenge(wallet) };
});
