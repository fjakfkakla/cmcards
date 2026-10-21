import CollectCard from "@/components/CollectCard";
import Nav from "@/components/Nav";
import { RARITIES, TRADERS, type Card } from "@/lib/data";

/* La planche des raretés : chaque personnage, du plus commun au plus rare, avec la
   chance de la tirer dans un booster. */
export default function Page() {
  return (
    <>
    <Nav at="cartes" />
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      {TRADERS.map((t) => (
      <section key={t.id} className="mb-16">
      <h2 className="mb-6 font-display text-4xl">{t.name}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
        {RARITIES.map((r) => {
          const card: Card = { id: `${t.id}-${r.id}`, trader: t.id, rarity: r.id, coin: "BONK", amount: 1_000_000, serial: 7 };
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
      </section>
      ))}
    </main>
    </>
  );
}
