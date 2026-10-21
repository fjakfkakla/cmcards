import CollectCard from "@/components/CollectCard";
import { RARITIES, type Card } from "@/lib/data";

/* La planche des raretés : le même personnage, du plus commun au plus rare, avec la
   chance de la tirer dans un booster Classique. */
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
        {RARITIES.map((r) => {
          const card: Card = { id: r.id, trader: "cupsey", rarity: r.id, coin: "BONK", amount: 1_000_000, serial: 7 };
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
  );
}
