import CollectCard from "@/components/CollectCard";
import Nav from "@/components/Nav";
import { RARITIES, category, trader, type Card } from "@/lib/data";

/* La planche Ansem : cinq raretés, du carton nu à la Mythic dans la brume. Ses
   images sont les siennes (la pdp, la bannière, le taureau), la mise en scène est
   celle de cm cards. */
export default function Page() {
  const t = trader("ansem");
  const cat = category(t.category!);
  return (
    <>
      <Nav at="cartes" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-10 text-center">
          <p className="text-sm font-black uppercase tracking-[.3em] text-ink-2">{cat.name} · {cat.tagline}</p>
          <h1 className="mt-2 font-display text-6xl">{t.name}</h1>
        </header>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
          {RARITIES.map((r) => {
            const card: Card = { id: `ansem-${r.id}`, trader: "ansem", rarity: r.id, coin: "BONK", amount: 1_000_000, serial: 7 };
            return (
              <div key={r.id}>
                <CollectCard card={card} />
                <p className="mt-4 text-center text-lg font-extrabold">
                  {r.name} <span className="text-ink-2">· {r.odds.toLocaleString("fr-FR")} %</span>
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
