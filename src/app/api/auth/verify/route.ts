import { route, Oops } from "@/lib/server/errors";
import { checkSignIn, isWallet, openSession } from "@/lib/server/session";

/* La signature du message : si elle est bonne, le wallet est connecté. */
export const POST = route(async ({ wallet, message, signature }) => {
  if (!isWallet(wallet) || typeof message !== "string" || typeof signature !== "string")
    throw new Oops(400, "Invalid sign-in.");
  checkSignIn(wallet, message, signature);
  await openSession(wallet);
  return { wallet };
});
