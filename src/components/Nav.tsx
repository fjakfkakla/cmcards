import Link from "next/link";
import NavCount from "./NavCount";

type Tab = "boosters" | "collection" | "cartes";
const TABS: { id: Tab; href: string; label: string }[] = [
  { id: "boosters", href: "/", label: "Boosters" },
  { id: "collection", href: "/collection", label: "Collection" },
  { id: "cartes", href: "/cartes", label: "Raretés" },
];

/* La barre : le nom, les trois écrans. Les liens sont des pastilles d'encre ; celle
   de l'écran ouvert est remplie. */
export default function Nav({ at }: { at?: Tab }) {
  return (
    <div className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/95">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="whitespace-nowrap font-display text-[23px] leading-none sm:text-[30px]">
          cm <span className="text-tomato">cards</span>
        </Link>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              aria-current={t.id === at ? "page" : undefined}
              className={`flex items-center gap-1 rounded-xl px-1.5 py-2 text-[13px] font-black sm:gap-1.5 sm:px-3 sm:text-[15px] ${t.id === at ? "bg-ink text-cream" : "hover:bg-cream-2"}`}
            >
              {t.label}
              {t.id === "collection" && <NavCount />}
            </Link>
          ))}
          <span className="ml-1 hidden rounded-full border-[2.5px] border-ink bg-sponge px-3 py-1 text-[13px] font-black uppercase sm:inline">Démo</span>
        </div>
      </div>
    </div>
  );
}
