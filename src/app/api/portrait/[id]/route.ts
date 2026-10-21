import { CATEGORIES, TRADERS } from "@/lib/data";
import { portraitSvg } from "@/lib/portrait";

/* L'avatar X du trader, mis en cache par le CDN de Vercel (une requête par jour
   et par trader). Si X ne répond pas, le portrait dessiné : l'URL ne casse jamais. */
export async function GET(_req: Request, ctx: RouteContext<"/api/portrait/[id]">) {
  const { id } = await ctx.params;
  const t = TRADERS.find((x) => x.id === id);
  const handle = t?.handle.replace(/^@/, "");

  if (handle) {
    try {
      const res = await fetch(`https://unavatar.io/x/${encodeURIComponent(handle)}?fallback=false`, {
        signal: AbortSignal.timeout(5000),
      });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) {
        return new Response(res.body, {
          headers: {
            "content-type": type,
            "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=2592000",
          },
        });
      }
    } catch {
      /* le portrait dessiné prend le relais */
    }
  }

  const bg = CATEGORIES.find((c) => c.id === t?.category)?.bg;
  return new Response(portraitSvg(t?.name ?? "?", bg), {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300, s-maxage=600",
    },
  });
}
