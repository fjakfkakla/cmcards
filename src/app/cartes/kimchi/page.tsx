import CollectCard from "@/components/CollectCard";
import { RARITIES, type Card } from "@/lib/data";

/* Le set Kimchi : six raretés, six cartes qui ne se ressemblent pas. Sur fond de
   nuit, pour que l'aura de la Mythic se voie. */
export default function Page() {
  return (
    <main className="flex-1 bg-[#0d0c0b] text-[#ece6da]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <header className="mb-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[.4em] opacity-60" style={{ fontFamily: "var(--font-tight)" }}>
            Top 10 · Final boss
          </p>
          <h1 className="mt-3 text-6xl italic" style={{ fontFamily: "var(--font-serif)" }}>Kimchi</h1>
        </header>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
          {RARITIES.map((r) => {
            const card: Card = { id: r.id, trader: "kimchi", rarity: r.id, coin: "BONK", amount: 1_000_000, serial: 7 };
            return (
              <div key={r.id}>
                <CollectCard card={card} />
                <p className="mt-5 text-center text-[11px] font-semibold uppercase tracking-[.32em]" style={{ fontFamily: "var(--font-tight)" }}>
                  {r.name} <span className="opacity-50">· {r.odds.toLocaleString("fr-FR")} %</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
