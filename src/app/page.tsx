import Link from "next/link";
import "@/components/landing/landing.css";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import CardRiver from "@/components/landing/CardRiver";
import Display from "@/components/landing/Display";
import LandingNav from "@/components/landing/LandingNav";
import OpenDemo from "@/components/landing/OpenDemo";
import Piles from "@/components/landing/Piles";
import RarityLadder from "@/components/landing/RarityLadder";
import { CATEGORIES, TRADERS } from "@/lib/data";

/* La landing. Ce n'est pas l'app : on y montre les objets, et un seul bouton y mène,
   « Lancer l'app ». Dans l'ordre : le présentoir, la rivière de cartes qui défilent,
   les piles des familles, l'ouverture d'un booster en démonstration, les raretés,
   la planche de fin. Un titre par section, rien au-dessus, rien dessous. */

const H2 = "font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1] font-extrabold tracking-[-.045em]";
const families = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id)).length;

export default function Home() {
  return (
    <div className="flex-1 overflow-x-clip">
      <LandingNav />

      {/* le héros : la planche tomate, le titre en autocollant, le bouton, le présentoir */}
      <section className="mx-auto mt-4 max-w-[1240px] px-2 sm:mt-6 sm:px-4">
        <div className="hero">
          <div className="hero-rays" />
          <div className="relative z-10 flex flex-col items-center px-4 pt-10 text-center sm:pt-12">
            <h1 className="hero-title">
              Les traders de memecoins,<br />
              <span>en cartes.</span>
            </h1>
            <p className="mt-5 max-w-[560px] font-display text-[clamp(1.05rem,2vw,1.3rem)] leading-snug font-extrabold text-white [paint-order:stroke_fill] [-webkit-text-stroke:4px_#1e1a16]">
              Ouvre des boosters, collectionne {TRADERS.length} traders en cinq raretés, revends tes cartes en SOL.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/boosters" className="btn-gold btn-lg">
                Lancer l&apos;app
                <Icon name="arrow" size={20} />
              </Link>
              <a href="#cartes" className="btn-ghost sm:btn-lg">Voir les cartes</a>
            </div>
          </div>
          <div className="relative z-10 mt-6 px-2 sm:mt-2">
            <Display />
          </div>
        </div>
      </section>

      <section id="cartes" className="mt-24 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className={H2}>Les <span className="text-tomato-text">cartes.</span></h2>
        </div>
        <div className="mt-4"><CardRiver /></div>
      </section>

      <section id="familles" className="mx-auto mt-20 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>{families === 6 ? "Six" : families} familles, <span className="text-tomato-text">un booster chacune.</span></h2>
        <div className="mt-10"><Piles /></div>
      </section>

      <section id="ouverture" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Ouvrir <span className="text-tomato-text">un booster.</span></h2>
        <div className="mt-8"><OpenDemo /></div>
      </section>

      <section id="raretes" className="mx-auto mt-24 max-w-6xl scroll-mt-24 px-4">
        <h2 className={H2}>Cinq raretés, <span className="text-tomato-text">un stock fixe.</span></h2>
        <div className="mt-8"><RarityLadder /></div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="cta">
          <h2 className={H2}>Prêt à ouvrir <span className="text-tomato-text">le tien ?</span></h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/boosters" className="btn-ink btn-lg">
              Lancer l&apos;app
              <Icon name="arrow" size={20} />
            </Link>
            <Link href="/marche" className="btn-ghost btn-lg">Le marché</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
