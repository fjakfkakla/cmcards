import { route } from "@/lib/server/errors";
import { openFree } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Le booster offert : un par wallet, sans paiement. */
export const POST = route(async () => {
  const wallet = await needWallet();
  return { cards: await openFree(wallet) };
});
