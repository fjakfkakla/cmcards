import { connection } from "next/server";

/* Une erreur à montrer au joueur, avec son code HTTP. */
export class Oops extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/* Une route : le corps JSON en entrée, la réponse JSON en sortie, les erreurs en clair.
   Un GET est lu à chaque demande : connection() hors du try, le prérendu doit
   s'arrêter là, pas être rattrapé. */
export function route<T>(fn: (body: Record<string, unknown>) => Promise<T>) {
  return async (req: Request) => {
    if (req.method === "GET") await connection();
    try {
      const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
      return Response.json(await fn(body ?? {}));
    } catch (e) {
      if (e instanceof Oops) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Server error, try again." }, { status: 500 });
    }
  };
}
