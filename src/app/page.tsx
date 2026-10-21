import Link from "next/link";
import "@/components/landing/landing.css";
import Footer from "@/components/Footer";
import LandingMarket from "@/components/LandingMarket";
import Nav from "@/components/Nav";
import Display from "@/components/landing/Display";
import PackPicker from "@/components/landing/PackPicker";
import Quest from "@/components/landing/Quest";
import RarityLadder from "@/components/landing/RarityLadder";

/* La page d'accueil. Un écran par idée, dans l'ordre où l'on joue : le présentoir
   (ce qu'on vend), choisir son booster, les raretés, le marché, l'album et les
   succès. Un titre par section, rien au-dessus, rien dessous : les objets parlent. */

const H2 = "font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1] font-extrabold tracking-[-.045em]";

export default function Home() {
  return (
    <div className="flex-1 overflow-x-clip">
      <Nav at="accueil" />

      {/* le héros : la planche tomate, ses rayons, le titre en autocollant, le présentoir */}
      <section className="mx-auto mt-4 max-w-[1240px] px-2 sm:mt-6 sm:px-4">
        <div className="hero">
          <div className="hero-rays" />
          <div className="relative z-10 flex flex-col items-center px-4 pt-10 text-center sm:pt-12">
            <h1 className="hero-title">
              Les traders de memecoins,<br />
              <span>en cartes.</span>
            </h1>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="#boosters" className="btn-gold sm:btn-lg">
                Ouvrir un booster
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true"><path d="M4 10h12M12 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link href="#marche" className="btn-ghost sm:btn-lg">Le marché</Link>
            </div>
          </div>
          <div className="relative z-10 mt-6 px-2 sm:mt-2">
            <Display />
          </div>
        </div>
      </section>

      <section id="boosters" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Choisis ton <span className="text-tomato-text">booster.</span></h2>
        <div className="mt-8"><PackPicker /></div>
      </section>

      <section id="raretes" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Cinq raretés, <span className="text-tomato-text">un stock fixe.</span></h2>
        <div className="mt-8"><RarityLadder /></div>
      </section>

      <section id="marche" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Le <span className="text-tomato-text">marché.</span></h2>
        <div className="mt-8"><LandingMarket /></div>
      </section>

      <section id="album" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Complète <span className="text-tomato-text">l&apos;album.</span></h2>
        <div className="mt-8"><Quest /></div>
      </section>

      <Footer />
    </div>
  );
}
