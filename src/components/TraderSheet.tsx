import Link from "next/link";
import CollectCard from "./CollectCard";
import { CategoryTag, RarityTag } from "./ui";
import { RARITIES, type Card, type Trader } from "@/lib/data";

/* La planche d'un trader : ses cinq raretés, du carton nu à la Mythic ; sous chaque
   carte sa plaque de rareté, sa chance et son stock. */
export default function TraderSheet({ t, link = false }: { t: Trader; link?: boolean }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-none font-extrabold tracking-[-.045em]">
          {link ? <Link href={`/cards/${t.id}`} className="hover:text-tomato-text">{t.name}</Link> : t.name}
        </h2>
        {t.category && <CategoryTag id={t.category} />}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
        {RARITIES.map((r) => {
          const card: Card = { id: `${t.id}-${r.id}`, trader: t.id, rarity: r.id, serial: r.supply === 1 ? 1 : 7 };
          return (
            <div key={r.id} className="[&_.cc]:border-[3px] [&_.cc]:border-fg">
              <CollectCard card={card} />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                <RarityTag id={r.id} size="sm" />
                <span className="num plate h-6 px-2.5 text-[12.5px]">{r.odds.toLocaleString("en-US")}%</span>
                <span className="num plate h-6 px-2.5 text-[12.5px]">{r.supply === 1 ? "1 copy" : `${r.supply.toLocaleString("en-US")} copies`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
