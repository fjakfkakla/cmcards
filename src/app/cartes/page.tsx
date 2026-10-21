import CollectCard from "@/components/CollectCard";
import Nav from "@/components/Nav";
import { RARITIES, TRADERS, type Card } from "@/lib/data";

/* La planche des raretés : chaque personnage, du plus commun au plus rare, avec la
   chance de la tirer dans un booster. */
export default function Page() {
  return (
    <>
    <Nav at="cartes" />
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-28 md:pb-16">
      <h1 className="mb-10 font-display text-[52px] leading-none font-extrabold tracking-[-.035em]">Toutes les cartes</h1>
      {TRADERS.map((t) => (
      <section key={t.id} className="mb-16">
      <h2 className="mb-6 font-display text-[32px] font-extrabold tracking-[-.03em]"><a href={`/cartes/${t.id}`} className="hover:text-gold">{t.name}</a></h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
        {RARITIES.map((r) => {
          const card: Card = { id: `${t.id}-${r.id}`, trader: t.id, rarity: r.id, serial: 7 };
          return (
            <div key={r.id}>
              <CollectCard card={card} />
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[15px] font-semibold">
                <i className={`rar-${r.id} h-2.5 w-2.5 rounded-full`} />
                {r.name} <span className="num text-dim">{r.odds.toLocaleString("fr-FR")} %</span>
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
