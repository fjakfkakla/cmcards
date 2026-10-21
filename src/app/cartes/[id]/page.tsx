import { notFound } from "next/navigation";
import CollectCard from "@/components/CollectCard";
import Nav from "@/components/Nav";
import { RARITIES, TRADERS, category, type Card } from "@/lib/data";

/* La planche d'un trader : ses cinq raretés, du carton nu à la Mythic, avec la
   chance de tirer chacune. Cupsey et Kimchi ont la leur, dessinée à part. */
export function generateStaticParams() {
  return TRADERS.map((t) => ({ id: t.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = TRADERS.find((x) => x.id === id);
  if (!t) notFound();
  const cat = t.category ? category(t.category) : undefined;
  return (
    <>
      <Nav at="cartes" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-28 md:pb-16">
        <header className="mb-10 text-center">
          {cat && <p className="text-[15px] font-semibold text-muted">{cat.name} · {cat.tagline}</p>}
          <h1 className="mt-2 font-display text-[52px] leading-none font-extrabold tracking-[-.035em]">{t.name}</h1>
        </header>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
          {RARITIES.map((r) => {
            const card: Card = { id: `${t.id}-${r.id}`, trader: t.id, rarity: r.id, serial: 7 };
            return (
              <div key={r.id}>
                <CollectCard card={card} />
                <p className="mt-4 flex items-center justify-center gap-2 text-center text-[15px] font-semibold">
                  <i className={`rar-${r.id} h-2.5 w-2.5 rounded-full`} />
                  {r.name} <span className="num text-dim">{r.odds.toLocaleString("fr-FR")} % · {r.supply === 1 ? "1 ex." : `${r.supply.toLocaleString("fr-FR")} ex.`}</span>
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
