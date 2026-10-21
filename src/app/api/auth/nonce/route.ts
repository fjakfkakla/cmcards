import { route, Oops } from "@/lib/server/errors";
import { challenge, isWallet } from "@/lib/server/session";

/* Le message que le wallet va signer. */
export const POST = route(async ({ wallet }) => {
  if (!isWallet(wallet)) throw new Oops(400, "Invalid wallet address.");
  return { message: challenge(wallet) };
});
