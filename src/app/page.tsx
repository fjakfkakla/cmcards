import Link from "next/link";
import BoosterPack from "@/components/BoosterPack";
import CollectCard from "@/components/CollectCard";
import { Logo, Pastille, type IconName } from "@/components/Icon";
import LandingNav from "@/components/LandingNav";
import { PACKS, RARITIES, TRADERS, type Card, fmtSol, packTraders } from "@/lib/data";
import { FEE_BPS } from "@/lib/solana";

/* La page d'accueil : du papier clair, une grille fine, une seule action par écran.
   Les cartes et les boosters sont posés dessus comme des objets imprimés. */

const HERO: Card[] = [
  { id: "hero-ansem", trader: "ansem", rarity: "shiny", serial: 214 },
  { id: "hero-cupsey", trader: "cupsey", rarity: "mythic", serial: 1 },
  { id: "hero-kimchi", trader: "kimchi", rarity: "og", serial: 12 },
];
const LADDER = "kimchi";
const OPEN = PACKS.filter((p) => packTraders(p).length);

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "wallet", title: "Connecte ton wallet", text: "Phantom, Solflare, Backpack. Tu signes un message : pas d'email, pas de mot de passe." },
  { icon: "pack", title: "Ouvre des boosters", text: "Le tirage est fait par le serveur dès que ton paiement est lu sur Solana. Chaque carte est numérotée." },
  { icon: "tag", title: "Revends au prix que tu fixes", text: `Mettre en vente est gratuit. L'acheteur te paie directement, et ${FEE_BPS / 100} % de frais à cm cards.` },
];

export default function Home() {
  return (
    <div className="landing relative flex-1 overflow-x-hidden bg-paper text-paper-ink">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(10,15,30,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(10,15,30,.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(180deg,#000,transparent_900px)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(900px_520px_at_12%_-6%,rgba(247,201,72,.16),transparent_60%),radial-gradient(900px_520px_at_92%_10%,rgba(76,125,255,.09),transparent_55%)]" />

      <LandingNav />

      {/* le héros */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="rise">
          <h1 className="font-display text-[clamp(2.9rem,7vw,5.6rem)] leading-[1.02] font-extrabold tracking-[-.04em]">
            Les traders de memecoins, <span className="text-gold-3">en cartes.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-paper-muted">
            Ouvre des boosters, tire Cupsey, Ansem, Kimchi et {TRADERS.length - 3} autres. Garde les plus rares, revends le reste aux joueurs, en SOL.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/boosters" className="btn-gold btn-lg">Ouvrir un booster</Link>
            <Link href="/marche" className="btn btn-lg bg-white text-paper-ink shadow-[inset_0_0_0_1.5px_rgba(10,15,30,.14),0_10px_24px_-16px_rgba(13,32,84,.4)]">Voir le marché</Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[[String(TRADERS.length), "traders"], [String(RARITIES.length), "raretés"], ["1/1", "chaque Mythic"]].map(([v, k]) => (
              <div key={k}>
                <dt className="num font-display text-[34px] leading-none font-extrabold tracking-[-.03em]">{v}</dt>
                <dd className="mt-1.5 text-[15px] text-paper-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[34px] bg-[#0b0d18] px-6 pt-14 pb-12 shadow-[0_60px_110px_-42px_rgba(13,32,84,.62)] sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(247,201,72,.2),transparent_70%),radial-gradient(50%_40%_at_80%_0%,rgba(76,125,255,.25),transparent_70%)]" />
            <div className="relative mx-auto flex max-w-[460px] items-end justify-center">
              {HERO.map((c, k) => (
                <div key={c.id} className="w-[38%] shrink-0"
                  style={{ transform: k === 1 ? "translateY(-18px) scale(1.12)" : `rotate(${k === 0 ? -9 : 9}deg) translateX(${k === 0 ? 14 : -14}%)`, zIndex: k === 1 ? 2 : 1 }}>
                  <CollectCard card={c} />
                </div>
              ))}
            </div>
            <p className="relative mt-10 text-center text-[14px] font-semibold text-white/60">Cupsey Mythic : un seul exemplaire au monde.</p>
          </div>
        </div>
      </section>

      {/* comment ça marche */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-.03em]">Trois gestes, c&apos;est tout.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-[24px] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(10,15,30,.07),0_18px_40px_-26px_rgba(5,18,60,.35)]">
              <Pastille name={s.icon} color="#d99a00" size={44} />
              <h3 className="mt-5 font-display text-[23px] font-bold tracking-[-.02em]">{s.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-paper-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* les boosters */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-.03em]">Un booster par famille.</h2>
          <Link href="/boosters" className="text-[15.5px] font-semibold text-paper-muted hover:text-paper-ink">Tous les boosters</Link>
        </div>
        <p className="mt-3 max-w-xl text-[17px] text-paper-muted">Les Trencher pour commencer, les Legend pour les mains sûres. Plus la famille est recherchée, plus le booster est garni.</p>
        <div className="-mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 pb-6 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
          {OPEN.map((p) => (
            <Link key={p.id} href="/boosters" className="group w-[150px] shrink-0 snap-start md:w-auto">
              <div className="transition-transform duration-300 group-hover:-translate-y-1.5"><BoosterPack pack={p} /></div>
              <div className="mt-4 flex items-baseline justify-between gap-2">
                <span className="font-display text-[18px] font-bold tracking-[-.02em]">{p.name}</span>
                <span className="num text-[14px] font-semibold text-paper-muted">{fmtSol(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* les raretés */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-.03em]">Cinq raretés, un stock fixe.</h2>
        <p className="mt-3 max-w-xl text-[17px] text-paper-muted">Chaque carte porte son numéro. Il n&apos;y en aura jamais plus que le stock prévu : la Mythic de chaque trader n&apos;existe qu&apos;en un exemplaire.</p>
        <div className="-mx-4 mt-10 flex snap-x gap-5 overflow-x-auto px-4 pb-6 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {RARITIES.map((r) => (
            <div key={r.id} className="w-[170px] shrink-0 snap-start md:w-auto">
              <CollectCard card={{ id: `ladder-${r.id}`, trader: LADDER, rarity: r.id, serial: r.supply === 1 ? 1 : 7 }} />
              <div className="mt-4 flex items-center gap-2">
                <i className={`rar-${r.id} h-3 w-3 rounded-full`} />
                <span className="font-display text-[18px] font-bold tracking-[-.02em]">{r.name}</span>
              </div>
              <p className="num mt-1 text-[14px] text-paper-muted">{r.odds.toLocaleString("fr-FR")} % · {r.supply === 1 ? "1 exemplaire" : `${r.supply.toLocaleString("fr-FR")} ex.`}</p>
            </div>
          ))}
        </div>
      </section>

      {/* le marché */}
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-[34px] bg-[#0b0d18] p-8 text-white shadow-[0_60px_110px_-42px_rgba(13,32,84,.62)] sm:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,rgba(247,201,72,.18),transparent_60%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-.03em]">Un vrai marché, entre joueurs.</h2>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/70">
                Tu fixes ton prix, l&apos;acheteur te paie directement dans ton wallet. cm cards n&apos;achète rien et ne fixe aucun prix : seulement celui des boosters.
              </p>
              <Link href="/marche" className="btn mt-8 bg-white text-[#0b0d18] shadow-[0_5px_0_rgba(0,0,0,.35),0_22px_36px_-16px_rgba(0,0,0,.6)]">Voir le marché</Link>
            </div>
            <ul className="grid gap-3">
              {[
                ["tag", "Mettre en vente est gratuit", "Ton prix, en SOL. Tu le retires quand tu veux."],
                ["swap", "Paiement direct", "Une seule transaction : le prix au vendeur, les frais à cm cards."],
                ["shield", `${FEE_BPS / 100} % de frais, c'est tout`, "Payés par l'acheteur. Le vendeur reçoit son prix entier."],
                ["lock", "Vérifié sur Solana", "La carte change de main quand le serveur a lu le paiement sur la chaîne."],
              ].map(([icon, title, text]) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-white/[.05] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
                  <Pastille name={icon as IconName} size={40} />
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="mt-0.5 text-[14.5px] text-white/60">{text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* la fin */}
      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-12 pb-24 text-center">
        <div className="w-[170px]"><BoosterPack pack={OPEN[0]} floating /></div>
        <h2 className="mt-10 font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-.03em]">Ton premier booster t&apos;attend.</h2>
        <Link href="/boosters" className="btn-gold btn-lg mt-8">Ouvrir un booster</Link>
      </section>

      <footer className="relative border-t border-[rgba(10,15,30,.08)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-8 text-[15px] text-paper-muted">
          <Logo size={26} light />
          <Link href="/boosters" className="hover:text-paper-ink">Boosters</Link>
          <Link href="/marche" className="hover:text-paper-ink">Marché</Link>
          <Link href="/collection" className="hover:text-paper-ink">Collection</Link>
          <Link href="/cartes" className="hover:text-paper-ink">Toutes les cartes</Link>
        </div>
      </footer>
    </div>
  );
}
