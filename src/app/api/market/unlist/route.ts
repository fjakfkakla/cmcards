import { route, Oops } from "@/lib/server/errors";
import { unlist } from "@/lib/server/game";
import { needWallet } from "@/lib/server/session";

export const POST = route(async ({ uid }) => {
  const wallet = await needWallet();
  if (typeof uid !== "string") throw new Oops(400, "Invalid request.");
  await unlist(wallet, uid);
  return { ok: true };
});
