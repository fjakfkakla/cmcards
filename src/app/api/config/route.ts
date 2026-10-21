import { route } from "@/lib/server/errors";
import { publicConfig } from "@/lib/server/config";

/* Le réseau, le RPC du navigateur, le wallet de cm cards : lus sur le serveur. */
export const GET = route(async () => publicConfig());
