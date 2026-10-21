import Link from "next/link";
import Icon, { Logo } from "../Icon";

/* La barre de la landing : la marque, les sections, et le seul bouton qui compte,
   « Lancer l'app ». Pas de wallet ici, pas d'onglets : on n'est pas encore dans l'app. */
const LINKS: [string, string][] = [["#cartes", "Les cartes"], ["#familles", "Les familles"], ["#ouverture", "Les boosters"], ["#raretes", "Les raretés"]];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b-[2.5px] border-fg bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="cm cards, accueil"><Logo size={34} /></Link>
        <nav className="mx-auto hidden items-center gap-1.5 md:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}
              className="flex h-11 items-center rounded-full px-4 font-display text-[15.5px] font-extrabold text-muted transition-[transform,color] hover:-translate-y-0.5 hover:text-fg">
              {label}
            </a>
          ))}
        </nav>
        <Link href="/boosters" className="btn-gold btn-sm ml-auto md:ml-0">
          Lancer l&apos;app <Icon name="arrow" size={17} />
        </Link>
      </div>
    </header>
  );
}
