import TradingCard from "@/components/TradingCard";
import { RARITIES, SUPPLY, type Card } from "@/lib/data";

/* La planche des raretés : le même trader dans les six raretés, avec la chance de
   la tirer dans un booster Classique. */
const AMOUNT: Record<string, [string, number]> = {
  commune: ["BONK", 60_000], "peu-commune": ["BONK", 190_000], rare: ["WIF", 9], epique: ["POPCAT", 140],
  legendaire: ["WIF", 160], exclusive: ["BONK", 19_250_000],
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl">Les raretés</h1>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
        {RARITIES.map((r) => {
          const card: Card = {
            id: `cupsey-${r.id}`, trader: r.id === "rare" || r.id === "peu-commune" ? "mitch" : "cupsey",
            rarity: r.id, coin: AMOUNT[r.id][0], amount: AMOUNT[r.id][1], serial: 3, supply: SUPPLY[r.id],
          };
          return (
            <div key={r.id}>
              <TradingCard card={card} />
              <p className="mt-3 text-center text-lg font-extrabold">
                {r.name} <span className="text-ink-2">· {r.odds.toLocaleString("fr-FR")} %</span>
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
