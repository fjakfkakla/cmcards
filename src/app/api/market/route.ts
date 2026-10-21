import { route } from "@/lib/server/errors";
import { market } from "@/lib/server/game";

/* Le marché : les cartes en vente et les dernières ventes. */
export const GET = route(() => market());
