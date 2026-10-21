"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useEffect } from "react";
import Icon, { type IconName, Logo } from "./Icon";
import { useAccount } from "@/lib/account";
import { short, toSol } from "@/lib/solana";

export type Tab = "home" | "boosters" | "market" | "collection" | "profile" | "cards";
const TABS: { id: Tab; href: string; label: string; icon: IconName }[] = [
  { id: "home", href: "/", label: "Home", icon: "home" },
  { id: "boosters", href: "/boosters", label: "Boosters", icon: "pack" },
  { id: "market", href: "/market", label: "Market", icon: "market" },
  { id: "collection", href: "/collection", label: "Collection", icon: "cards" },
  { id: "profile", href: "/profile", label: "Profile", icon: "user" },
];

/* La barre : la marque, les écrans au centre, le wallet à droite. Sur téléphone,
   les écrans passent dans la barre du bas, sous le pouce. L'écran ouvert prend la
   plaque éponge. */
export default function Nav({ at }: { at?: Tab }) {
  const { me } = useAccount();
  const count = me?.cards.length ?? 0;
  return (
    <>
      <header className="sticky top-0 z-40 border-b-[2.5px] border-fg bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="cm cards, home"><Logo size={34} /></Link>
          <nav className="mx-auto hidden items-center gap-1.5 md:flex">
            {TABS.slice(1).map((t) => (
              <Link key={t.id} href={t.href} aria-current={t.id === at ? "page" : undefined}
                className={`flex h-11 items-center gap-2 rounded-full px-4 font-display text-[15.5px] font-extrabold transition-[transform,background-color] hover:-translate-y-0.5 ${t.id === at ? "border-2 border-fg bg-gold shadow-[0_3px_0_#1e1a16]" : "text-muted hover:text-fg"}`}>
                <Icon name={t.icon} size={17} />
                {t.label}
                {t.id === "collection" && count > 0 && <Count n={count} />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto md:ml-0"><WalletButton /></div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-fg bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} aria-current={t.id === at ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 pt-2 pb-2 font-display text-[12.5px] font-extrabold ${t.id === at ? "text-fg" : "text-muted"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full ${t.id === at ? "border-2 border-fg bg-gold" : ""}`}>
                <Icon name={t.icon} size={20} />
              </span>
              {t.label}
              {t.id === "collection" && count > 0 && <span className="absolute top-1 left-[calc(50%+10px)]"><Count n={count} /></span>}
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
    <span className="num min-w-[22px] rounded-full border-2 border-fg bg-tomato px-1.5 text-center text-[11.5px] leading-[16px] font-extrabold text-white">
      {n > 999 ? "999+" : n}
    </span>
  );
}

/* Le wallet : « Connecter », ou le solde et l'adresse (vers le profil). */
export function WalletButton() {
  const { me, wallet, balance, busy, signIn } = useAccount();
  if (!me) return <span className="block h-[42px] w-[140px] animate-pulse rounded-full bg-raised" />;
  if (!wallet)
    return (
      <button className="btn-gold btn-sm" onClick={signIn} disabled={busy}>
        <Icon name="wallet" size={17} />
        {busy ? "Signing…" : "Connect"}
      </button>
    );
  return (
    <Link href="/profile" className="btn-ghost btn-sm gap-2.5 pl-1.5">
      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-fg bg-gold"><Icon name="wallet" size={14} /></span>
      {balance !== null && <span className="num hidden sm:inline">{toSol(balance).toLocaleString("en-US", { maximumFractionDigits: 3 })} SOL</span>}
      <span className="num font-sans text-[13.5px] font-bold text-muted">{short(wallet)}</span>
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
    <div className="fixed inset-0 z-[60] grid place-items-end bg-[rgba(30,26,22,.55)] backdrop-blur-sm sm:place-items-center" onClick={() => setPicker(false)}>
      <div role="dialog" aria-modal="true" aria-label="Connect a wallet" onClick={(e) => e.stopPropagation()}
        className="surface rise w-full max-w-[420px] rounded-b-none p-6 sm:rounded-[26px]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-[26px] font-extrabold tracking-[-.03em]">Connect a wallet</h2>
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-fg bg-white hover:bg-cream" onClick={() => setPicker(false)} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {found.length ? found.map((x) => (
            <button key={x.adapter.name} onClick={() => choose(x.adapter.name)}
              className="flex h-14 items-center gap-3 rounded-2xl border-2 border-fg bg-white px-3 text-left font-display text-[16px] font-extrabold shadow-[0_3px_0_#1e1a16] transition-transform hover:-translate-y-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.adapter.icon} alt="" width={32} height={32} className="rounded-lg" />
              {x.adapter.name}
              <Icon name="chevron" size={18} className="ml-auto text-muted" />
            </button>
          )) : (
            <>
              <p className="py-2 font-display text-[17px] font-extrabold">No wallet in this browser</p>
              {[["Phantom", "https://phantom.com/download"], ["Solflare", "https://solflare.com/download"], ["Backpack", "https://backpack.app/download"]].map(([n, href]) => (
                <a key={n} href={href} target="_blank" rel="noreferrer"
                  className="flex h-12 items-center justify-between rounded-2xl border-2 border-fg bg-white px-4 font-display font-extrabold shadow-[0_3px_0_#1e1a16] transition-transform hover:-translate-y-0.5">
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
