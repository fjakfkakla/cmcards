"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useEffect } from "react";
import Icon, { type IconName, Logo } from "./Icon";
import { useAccount } from "@/lib/account";
import { short, toSol } from "@/lib/solana";

export type Tab = "accueil" | "boosters" | "marche" | "collection" | "profil" | "cartes";
const TABS: { id: Tab; href: string; label: string; icon: IconName }[] = [
  { id: "accueil", href: "/", label: "Accueil", icon: "home" },
  { id: "boosters", href: "/boosters", label: "Boosters", icon: "pack" },
  { id: "marche", href: "/marche", label: "Marché", icon: "market" },
  { id: "collection", href: "/collection", label: "Collection", icon: "cards" },
  { id: "profil", href: "/profil", label: "Profil", icon: "user" },
];

/* La barre de l'app : la marque, les écrans au centre, le wallet à droite. Sur
   téléphone, les écrans passent dans la barre du bas, sous le pouce. */
export default function Nav({ at }: { at?: Tab }) {
  const { me } = useAccount();
  const count = me?.cards.length ?? 0;
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="cm cards, accueil"><Logo size={30} /></Link>
          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {TABS.slice(1).map((t) => (
              <Link key={t.id} href={t.href} aria-current={t.id === at ? "page" : undefined}
                className={`flex h-10 items-center gap-2 rounded-xl px-3.5 text-[14px] font-semibold transition-colors ${t.id === at ? "bg-white/[.07] text-fg" : "text-muted hover:text-fg"}`}>
                <Icon name={t.icon} size={16} className={t.id === at ? "text-gold" : ""} />
                {t.label}
                {t.id === "collection" && count > 0 && <Count n={count} />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto md:ml-0"><WalletButton /></div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} aria-current={t.id === at ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11.5px] font-semibold ${t.id === at ? "text-fg" : "text-dim"}`}>
              <Icon name={t.icon} size={22} className={t.id === at ? "text-gold" : ""} />
              {t.label}
              {t.id === "collection" && count > 0 && <span className="absolute top-1.5 left-[calc(50%+6px)]"><Count n={count} /></span>}
            </Link>
          ))}
        </div>
      </nav>
      <WalletPicker />
    </>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="num min-w-[20px] rounded-full bg-gold px-1.5 text-center text-[11px] leading-[18px] font-bold text-gold-ink">
      {n > 999 ? "999+" : n}
    </span>
  );
}

/* Le wallet : « Connecter », ou le solde et l'adresse (vers le profil). */
export function WalletButton() {
  const { me, wallet, balance, busy, signIn } = useAccount();
  if (!me) return <span className="block h-[38px] w-[132px] animate-pulse rounded-full bg-white/5" />;
  if (!wallet)
    return (
      <button className="btn-gold btn-sm" onClick={signIn} disabled={busy}>
        <Icon name="wallet" size={16} />
        {busy ? "Signature…" : "Connecter"}
      </button>
    );
  return (
    <Link href="/profil" className="btn-ghost btn-sm gap-2.5 pl-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/15 text-gold"><Icon name="wallet" size={14} /></span>
      {balance !== null && <span className="num hidden sm:inline">{toSol(balance).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} SOL</span>}
      <span className="num text-muted">{short(wallet)}</span>
    </Link>
  );
}

/* Le choix du wallet : ceux que le navigateur a, avec leur vrai logo. */
export function WalletPicker() {
  const { picker, setPicker, choose, error } = useAccount();
  const { wallets } = useWallet();
  const found = wallets.filter((x) => x.readyState === WalletReadyState.Installed || x.readyState === WalletReadyState.Loadable);

  useEffect(() => {
    if (!picker) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setPicker(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [picker, setPicker]);

  if (!picker) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-[rgba(4,5,10,.66)] backdrop-blur-md sm:place-items-center" onClick={() => setPicker(false)}>
      <div role="dialog" aria-modal="true" aria-label="Connecter un wallet" onClick={(e) => e.stopPropagation()}
        className="surface rise w-full max-w-[420px] rounded-b-none p-6 sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[26px] font-extrabold tracking-[-.03em]">Connecter un wallet</h2>
            <p className="mt-1 text-[14.5px] text-muted">Tu signes un message, rien ne part de ton wallet.</p>
          </div>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-muted hover:text-fg" onClick={() => setPicker(false)} aria-label="Fermer">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {found.length ? found.map((x) => (
            <button key={x.adapter.name} onClick={() => choose(x.adapter.name)}
              className="flex h-14 items-center gap-3 rounded-2xl bg-white/[.04] px-3 text-left font-semibold shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-white/[.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.adapter.icon} alt="" width={32} height={32} className="rounded-lg" />
              {x.adapter.name}
              <span className="ml-auto text-[12.5px] font-semibold text-up">Détecté</span>
            </button>
          )) : (
            <>
              <p className="rounded-2xl bg-white/[.04] p-4 text-[14.5px] text-muted shadow-[inset_0_0_0_1px_var(--color-line)]">
                Aucun wallet Solana dans ce navigateur. Installe-en un, puis recharge la page.
              </p>
              {[["Phantom", "https://phantom.com/download"], ["Solflare", "https://solflare.com/download"], ["Backpack", "https://backpack.app/download"]].map(([n, href]) => (
                <a key={n} href={href} target="_blank" rel="noreferrer"
                  className="flex h-12 items-center justify-between rounded-2xl px-4 font-semibold text-muted shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-fg">
                  {n} <Icon name="out" size={16} />
                </a>
              ))}
            </>
          )}
        </div>
        {error && <p className="mt-4 text-[14px] font-semibold text-down">{error}</p>}
      </div>
    </div>
  );
}
