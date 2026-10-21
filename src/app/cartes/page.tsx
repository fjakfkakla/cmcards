import type { Metadata } from "next";
import Nav from "@/components/Nav";
import TraderSheet from "@/components/TraderSheet";
import { CATEGORIES, TRADERS } from "@/lib/data";

export const metadata: Metadata = { title: "Toutes les cartes · cm cards" };

/* Toutes les cartes : chaque trader, famille après famille, ses cinq raretés. */
const PEOPLE = [...TRADERS].sort((a, b) =>
  CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category));

export default function Page() {
  return (
    <>
      <Nav at="cartes" />
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-28 md:pb-16">
        <h1 className="mb-12 font-display text-[44px] leading-none font-extrabold tracking-[-.04em] sm:text-[56px]">Toutes les cartes</h1>
        <div className="flex flex-col gap-20">
          {PEOPLE.map((t) => <TraderSheet key={t.id} t={t} link />)}
        </div>
      </main>
    </>
  );
}
