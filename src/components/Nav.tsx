import Link from "next/link";

/* La barre : le nom, les trois écrans. Les liens sont des pastilles d'encre. */
export default function Nav() {
  return (
    <div className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/95">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="whitespace-nowrap font-display text-[30px] leading-none">
          cm <span className="text-tomato">cards</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/" className="rounded-xl px-3 py-2 text-[15px] font-black hover:bg-cream-2">Boosters</Link>
          <Link href="/cartes" className="rounded-xl px-3 py-2 text-[15px] font-black hover:bg-cream-2">Raretés</Link>
          <span className="ml-1 rounded-full border-[2.5px] border-ink bg-sponge px-3 py-1 text-[13px] font-black uppercase">Démo</span>
        </div>
      </div>
    </div>
  );
}
