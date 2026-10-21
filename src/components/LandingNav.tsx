"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { Logo } from "./Icon";
import { WalletPicker } from "./Nav";
import { useAccount } from "@/lib/account";
import { short } from "@/lib/solana";

/* La barre de la page d'accueil : une pilule de verre sombre qui flotte en haut,
   et prend une ombre au défilement. */
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
    <header className="sticky top-4 z-40 mx-auto w-full max-w-6xl px-4">
      <div className={`flex items-center gap-4 rounded-full border border-night-line py-2 pr-2 pl-4 backdrop-blur-xl transition-[background-color,box-shadow] ${scrolled ? "bg-night-card/90 shadow-[0_18px_40px_-18px_rgba(0,0,0,.9)]" : "bg-night-card/60"}`}>
        <Link href="/" aria-label="cm cards"><Logo size={28} /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[["#marche", "Marché"], ["#boosters", "Boosters"], ["/collection", "Collection"]].map(([href, label], k) => (
            <Link key={href} href={href} className={`rounded-full px-4 py-2 text-[14px] font-medium transition ${k === 0 ? "bg-night-2 text-fg" : "text-night-muted hover:text-fg"}`}>{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {wallet ? (
            <Link href="/profil" className="btn btn-sm border border-night-line bg-night-2 font-mono text-[13px] text-fg">{short(wallet)}</Link>
          ) : me && (
            <button onClick={signIn} disabled={busy} className="btn btn-sm hidden border border-night-line bg-night-2 text-fg sm:inline-flex">
              <Icon name="wallet" size={16} /> {busy ? "Signature…" : "Connecter"}
            </button>
          )}
          <Link href="/boosters" className="btn-lime btn-sm">Entrer</Link>
        </div>
      </div>
    </header>
    {/* hors de la barre : son flou ferait de la barre le cadre de la fenêtre */}
    <WalletPicker />
    </>
  );
}
