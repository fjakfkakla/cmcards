import { route } from "@/lib/server/errors";
import { closeSession } from "@/lib/server/session";

export const POST = route(async () => {
  await closeSession();
  return { ok: true };
});
