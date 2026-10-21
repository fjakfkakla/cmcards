import Link from "next/link";
import { Logo } from "./Icon";

/* Le pied de page : la marque et sa phrase, en grand ; les écrans ; c'est tout. */
const COLS: [string, [string, string][]][] = [
  ["Jouer", [["/boosters", "Boosters"], ["/marche", "Marché"]]],
  ["Cartes", [["/cartes", "Toutes les cartes"], ["/collection", "Collection"]]],
  ["Compte", [["/profil", "Profil"]]],
];

export default function Footer() {
  return (
    <footer className="mt-28 border-t-[2.5px] border-fg bg-cream">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-28 md:grid-cols-[1.4fr_1fr] md:pb-14">
        <div>
          <Logo size={36} />
          <p className="mt-6 font-display text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1] font-extrabold tracking-[-.045em]">
            Ouvre. Collectionne.<br /><span className="text-tomato-text">Revends.</span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {COLS.map(([title, links]) => (
            <div key={title}>
              <div className="font-display text-[18px] font-extrabold">{title}</div>
              <ul className="mt-4 space-y-3">
                {links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="inline-block font-semibold text-muted transition-[color,transform] hover:translate-x-0.5 hover:text-fg">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t-2 border-fg/15 pt-6 text-[15px] font-semibold text-muted md:col-span-2">© 2026 cm cards</p>
      </div>
    </footer>
  );
}
