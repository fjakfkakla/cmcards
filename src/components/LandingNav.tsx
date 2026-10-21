"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { Logo } from "./Icon";
import { WalletPicker } from "./Nav";
import { useAccount } from "@/lib/account";
import { short } from "@/lib/solana";

/* La barre de la page d'accueil : du papier dépoli, qui prend une ombre au défilement. */
export default function LandingNav() {
  const { me, wallet, busy, signIn } = useAccount();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
    <header className={`sticky top-0 z-40 border-b border-[rgba(10,15,30,.08)] backdrop-blur-xl transition-[background-color,box-shadow] ${scrolled ? "bg-paper/95 shadow-[0_8px_30px_rgba(13,32,84,.1)]" : "bg-paper/80"}`}>
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-6 px-4">
        <Link href="/" aria-label="cm cards"><Logo size={32} light /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[["/boosters", "Boosters"], ["/marche", "Marché"], ["/collection", "Collection"]].map(([href, label]) => (
            <Link key={href} href={href} className="flex h-10 items-center rounded-xl px-3.5 text-[14.5px] font-semibold text-paper-muted hover:text-paper-ink">{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {wallet ? (
            <Link href="/profil" className="btn btn-sm bg-white text-paper-ink shadow-[inset_0_0_0_1.5px_rgba(10,15,30,.14)]">
              <span className="num">{short(wallet)}</span>
            </Link>
          ) : me && (
            <button onClick={signIn} disabled={busy} className="btn btn-sm hidden bg-white text-paper-ink shadow-[inset_0_0_0_1.5px_rgba(10,15,30,.14)] sm:inline-flex">
              <Icon name="wallet" size={16} /> {busy ? "Signature…" : "Connecter"}
            </button>
          )}
          <Link href="/boosters" className="btn-gold btn-sm">Entrer</Link>
        </div>
      </div>
    </header>
    {/* hors de la barre : son flou ferait de la barre le cadre de la fenêtre */}
    <WalletPicker />
    </>
  );
}
