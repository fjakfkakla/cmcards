import type { Metadata } from "next";
import "@/components/landing/landing.css";
import Nav from "@/components/Nav";
import PackPicker from "@/components/landing/PackPicker";

export const metadata: Metadata = { title: "Boosters · cm cards" };

/* Les boosters : les six familles, le booster choisi, ses chances, le bouton qui
   l'ouvre. Le même choix que sur la page d'accueil. */
export default function Page() {
  return (
    <>
      <Nav at="boosters" />
      <main id="boosters" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-28 md:pb-16">
        <h1 className="mb-8 font-display text-[44px] leading-none font-extrabold tracking-[-.04em] sm:text-[56px]">Boosters</h1>
        <PackPicker />
      </main>
    </>
  );
}
