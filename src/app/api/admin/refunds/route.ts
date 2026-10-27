import { route, Oops } from "@/lib/server/errors";
import { isSignature } from "@/lib/server/chain";
import { markRefunded, needAdmin, refunds } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

/* Les paiements à rendre : visibles et notés par le wallet de cm cards seulement. */
export const GET = route(async () => {
  needAdmin(await needWallet());
  return { refunds: await refunds() };
});

/* Le remboursement est parti du wallet de cm cards : le serveur le vérifie et le note. */
export const POST = route(async ({ sig, refund }) => {
  needAdmin(await needWallet());
  if (!isSignature(sig) || !isSignature(refund)) throw new Oops(400, "Invalid request.");
  return { refund: await markRefunded(sig, refund) };
});
