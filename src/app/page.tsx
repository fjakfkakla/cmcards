import Link from "next/link";
import BoosterPack from "@/components/BoosterPack";
import CollectCard from "@/components/CollectCard";
import { Logo } from "@/components/Icon";
import LandingMarket from "@/components/LandingMarket";
import LandingNav from "@/components/LandingNav";
import { PACKS, RARITIES, TRADERS, category, fmtSol, packTraders } from "@/lib/data";
import { FEE_BPS } from "@/lib/solana";

/* La page d'accueil, dans la DA Kol Market : le noir teinté de vert, une seule
   couleur d'action (le vert acide, qui luit), de grands cadres arrondis, les chiffres
   en mono. Les boosters et les cartes gardent leur propre dessin. */

const LADDER = "kimchi";
const OPEN = PACKS.filter((p) => packTraders(p).length);
// les noms qui défilent sous le titre : ceux qu'on peut tirer
const NAMES = TRADERS.filter((t) => t.category).map((t) => t.name);

const STEPS: [string, string][] = [
  ["Connecte ton wallet", "Phantom, Solflare, Backpack. Tu signes un message : pas d'email, pas de mot de passe."],
  ["Ouvre des boosters", "Le tirage est fait par le serveur dès que ton paiement est lu sur Solana. Chaque carte est numérotée."],
  ["Revends au prix que tu fixes", `Mettre en vente est gratuit. L'acheteur te paie directement, plus ${FEE_BPS / 100} % de frais à cm cards.`],
];

const H2 = "font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.04] font-bold tracking-[-.03em]";
const KICKER = "text-[11px] font-semibold tracking-[.28em] text-night-muted uppercase";

export default function Home() {
  return (
    <div className="landing relative flex-1 overflow-x-hidden bg-night pt-4 text-fg">
      <LandingNav />

      {/* le héros : un grand cadre sombre, le vert qui monte du bas, les six boosters */}
      <section className="mx-auto mt-6 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[28px] border border-night-line bg-[linear-gradient(180deg,#0d110d,#080a08)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_100%,rgba(172,249,63,.28),transparent_70%),radial-gradient(35%_30%_at_10%_0%,rgba(172,249,63,.07),transparent_70%),radial-gradient(35%_30%_at_90%_0%,rgba(172,249,63,.07),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_40%,#000,transparent)]" />
          {/* les deux arcs de verre, au bord du cadre */}
          <div className="pointer-events-none absolute -top-40 -left-[340px] hidden md:block h-[900px] w-[520px] rounded-[50%] border-r-2 border-lime/50 shadow-[18px_0_60px_-20px_rgba(172,249,63,.55)] blur-[1px]" />
          <div className="pointer-events-none absolute -top-40 -right-[340px] hidden md:block h-[900px] w-[520px] rounded-[50%] border-l-2 border-lime/50 shadow-[-18px_0_60px_-20px_rgba(172,249,63,.55)] blur-[1px]" />

          <div className="relative z-10 flex flex-col items-center px-6 pt-20 text-center md:pt-28">
            <span className="rise inline-flex items-center gap-2 rounded-full border border-night-line bg-night-card/60 px-3 py-1.5 text-[12px] font-medium text-night-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_rgba(172,249,63,.9)]" />
              Saison 1 · sur Solana
            </span>
            <h1 className="rise mt-6 max-w-3xl font-display text-[clamp(2.8rem,7.4vw,5.4rem)] leading-[1.03] font-bold tracking-[-.04em]">
              Les traders de memecoins,<br /><span className="text-lime text-glow">en cartes.</span>
            </h1>
            <p className="rise mt-6 max-w-xl text-[16px] text-night-muted md:text-[18px]">
              Ouvre des boosters, tire Cupsey, Ansem, Kimchi et {TRADERS.length - 3} autres. <br className="hidden sm:block" />
              Garde les plus rares, revends le reste aux joueurs, en SOL.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/boosters" className="btn-lime group">
                Ouvrir un booster
                <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 10h12M12 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link href="#marche" className="btn border border-night-line bg-night-card/60 text-fg backdrop-blur hover:bg-night-2">Voir le marché</Link>
            </div>
            <div className="mt-12 w-full">
              <p className={KICKER}>Dans les boosters</p>
              <div className="mt-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
                <div className="marquee flex w-max gap-14 pr-14">
                  {[...NAMES, ...NAMES].map((n, k) => (
                    <span key={k} className="font-display text-[34px] font-semibold tracking-[-.02em] whitespace-nowrap text-night-muted/40">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* les boosters en éventail, coupés par le bas du cadre */}
          <div className="relative z-0 mx-auto -mb-[14%] flex max-w-5xl items-end justify-center px-2 pt-12 sm:-mb-[5%]">
            {PACKS.map((p, k) => {
              const o = k - (PACKS.length - 1) / 2;
              return (
                <Link key={p.id} href="/boosters" aria-label={`Booster ${p.name}`}
                  className={`w-[30%] shrink-0 transition-transform duration-500 hover:-translate-y-4 sm:w-[17%] ${Math.abs(o) > 1.5 ? "hidden sm:block" : ""}`}
                  style={{ transform: `translateY(${o * o * 9}px) rotate(${o * 5}deg)`, marginInline: "-1.2%", zIndex: 10 - Math.round(Math.abs(o) * 2) }}>
                  <BoosterPack pack={p} />
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-b from-transparent to-night" />
        </div>

        {/* les chiffres */}
        <div className="mt-6 grid gap-px overflow-hidden rounded-[28px] border border-night-line bg-night-line md:grid-cols-3">
          {[
            [String(TRADERS.length), "Traders", "Les personnages de la saison 1, répartis en six familles."],
            [String(PACKS.length), "Boosters", `Un par famille, de ${fmtSol(PACKS[0].price)} à ${fmtSol(PACKS[PACKS.length - 1].price)}.`],
            ["1/1", "Mythic", "La Mythic de chaque trader n'existe qu'en un exemplaire."],
          ].map(([v, k, text]) => (
            <div key={k} className="bg-night p-8">
              <div className="flex items-baseline gap-3">
                <span className="text-glow font-mono text-[38px] leading-none font-bold tracking-[-.04em]">{v}</span>
                <span className="text-[11px] font-semibold tracking-widest text-night-muted uppercase">{k}</span>
              </div>
              <p className="mt-3 text-[14px] text-night-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* le marché en direct */}
      <section id="marche" className="mx-auto mt-16 max-w-6xl scroll-mt-28 px-4">
        <LandingMarket />
      </section>

      {/* les boosters */}
      <section id="boosters" className="mx-auto mt-24 max-w-6xl scroll-mt-28 px-4">
        <p className={KICKER}>Les boosters</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className={H2}>Un booster par famille.</h2>
          <Link href="/boosters" className="text-[15px] font-semibold text-night-muted hover:text-lime">Tous les boosters</Link>
        </div>
        <p className="mt-3 max-w-xl text-[16px] text-night-muted">Chacun son décor, chacun ses personnages. Plus la famille est recherchée, plus le booster est garni.</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {OPEN.map((p) => (
            <Link key={p.id} href="/boosters"
              className="group rounded-[24px] border border-night-line bg-night-card/40 p-4 transition hover:border-lime/40 hover:shadow-[0_0_40px_-10px_rgba(172,249,63,.35)]">
              <div className="transition-transform duration-300 group-hover:-translate-y-1.5"><BoosterPack pack={p} /></div>
              <div className="mt-4 font-display text-[18px] font-bold tracking-[-.02em]">{p.name}</div>
              <div className="mt-0.5 text-[13px] text-night-muted">{category(p.pool).tagline}</div>
              <div className="mt-3 flex items-center justify-between border-t border-night-line pt-3">
                <span className="text-[12px] text-night-muted">{p.cards} cartes</span>
                <span className="font-mono text-[13px] font-medium text-lime">{fmtSol(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* les raretés */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <p className={KICKER}>Les raretés</p>
        <h2 className={`${H2} mt-3`}>Cinq raretés, un stock fixe.</h2>
        <p className="mt-3 max-w-xl text-[16px] text-night-muted">Chaque carte porte son numéro. Il n&apos;y en aura jamais plus que le stock prévu : la Mythic de chaque trader n&apos;existe qu&apos;en un exemplaire.</p>
        <div className="-mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {RARITIES.map((r) => (
            <div key={r.id} className="w-[180px] shrink-0 snap-start rounded-[24px] border border-night-line bg-night-card/40 p-4 md:w-auto">
              <CollectCard card={{ id: `ladder-${r.id}`, trader: LADDER, rarity: r.id, serial: r.supply === 1 ? 1 : 7 }} />
              <div className="mt-4 flex items-center gap-2">
                <i className={`rar-${r.id} h-2.5 w-2.5 rounded-full`} />
                <span className="font-display text-[17px] font-bold tracking-[-.02em]">{r.name}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-night-line pt-3 font-mono text-[12.5px] text-night-muted">
                <span>{r.odds.toLocaleString("fr-FR")} %</span>
                <span>{r.supply === 1 ? "1 ex." : `${r.supply.toLocaleString("fr-FR")} ex.`}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* comment ça marche */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <p className={KICKER}>Comment ça marche</p>
        <h2 className={`${H2} mt-3`}>Trois gestes, c&apos;est tout.</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[28px] border border-night-line bg-night-line md:grid-cols-3">
          {STEPS.map(([title, text], k) => (
            <div key={title} className="bg-night p-8">
              <span className="text-glow font-mono text-[14px] font-bold text-lime">0{k + 1}</span>
              <h3 className="mt-4 font-display text-[22px] font-bold tracking-[-.02em]">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-night-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* la fin */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[28px] border border-night-line bg-night-card/40 px-6 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_120%,rgba(172,249,63,.25),transparent_70%)]" />
          <div className="relative mx-auto w-[150px]"><BoosterPack pack={OPEN[0]} floating /></div>
          <h2 className={`${H2} relative mt-10`}>Ton premier booster t&apos;attend.</h2>
          <p className="relative mx-auto mt-3 max-w-md text-[16px] text-night-muted">À partir de {fmtSol(PACKS[0].price)}. Tes cartes sont à toi : garde-les ou revends-les.</p>
          <Link href="/boosters" className="btn-lime relative mt-8">Ouvrir un booster</Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <Logo size={28} />
            <p className="mt-4 text-[14px] text-night-muted">Une carte vaut ce que les joueurs en donnent.</p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-[14px]">
            {[
              ["Jouer", [["/boosters", "Boosters"], ["/marche", "Marché"]]],
              ["Cartes", [["/cartes", "Toutes les cartes"], ["/collection", "Collection"]]],
              ["Compte", [["/profil", "Profil"]]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <div className="text-[10px] font-semibold tracking-widest text-night-muted uppercase">{title as string}</div>
                <ul className="mt-4 space-y-3">
                  {(links as string[][]).map(([href, label]) => (
                    <li key={href}><Link href={href} className="text-fg/90 transition hover:text-lime">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-night-line pt-6 text-[12px] text-night-muted md:flex-row md:items-center">
          <p className="max-w-2xl leading-relaxed">
            Les paiements passent par ton wallet et ne s&apos;annulent pas. Une carte ne contient pas de coins : elle vaut ce que les joueurs en donnent. cm cards ne garde pas tes fonds et ne donne aucun conseil financier.
          </p>
          <p>2026 cm cards</p>
        </div>
      </footer>
    </div>
  );
}
