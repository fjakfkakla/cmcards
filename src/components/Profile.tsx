"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import Medal from "./Medal";
import { Ago, ConnectCard, RarityTag, Stats } from "./ui";
import { BADGES, earned as isEarned, progressOf } from "@/lib/rewards";
import { api, useAccount } from "@/lib/account";
import { fmtSol, rarity, serialOf, trader } from "@/lib/data";
import { explorer, short, toSol } from "@/lib/solana";

/* Le profil : le wallet, ce qu'il possède, ce qu'il vend, ce qu'il a acheté et vendu. */
export default function Profile() {
  const { cfg, me, wallet, balance, signOut, refresh } = useAccount();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!me) return <div className="h-40 animate-pulse rounded-[22px] bg-raised" />;
  if (!wallet) return (
    <>
      <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-.04em] sm:text-[56px]">Profile</h1>
      <ConnectCard />
    </>
  );

  const cards = new Map(me.cards.map((c) => [c.uid, c]));
  const sold = me.sales.filter((s) => s.seller === wallet);
  const earned = sold.reduce((a, s) => a + s.lamports, 0);
  const progress = progressOf(me, wallet);
  const won = BADGES.filter((b) => isEarned(b, progress));

  async function unlist(uid: string) {
    setBusy(uid);
    try { await api("/api/market/unlist", { uid }); await refresh(); } catch {} finally { setBusy(null); }
  }

  return (
    <>
      <section className="surface p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-5">
          <span className="h-16 w-16 shrink-0 rounded-[20px] border-[2.5px] border-fg shadow-[0_4px_0_#1e1a16]" style={{ background: tint(wallet) }} aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="num font-display text-[30px] leading-none font-extrabold tracking-[-.03em]">{short(wallet)}</h1>
              <button className="grid h-9 w-9 place-items-center rounded-full border-2 border-fg bg-white hover:bg-cream" aria-label="Copy address"
                onClick={() => { navigator.clipboard?.writeText(wallet); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                <Icon name={copied ? "check" : "copy"} size={15} />
              </button>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <span className="plate h-8 px-3 text-[14px]"><b className="num text-[15px]">{balance !== null ? `${toSol(balance).toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL` : "Wallet not connected"}</b></span>
              {cfg.cluster === "devnet" && <span className="plate h-8 px-3 text-[13.5px]">Devnet</span>}
            </p>
          </div>
          <button className="btn-ghost btn-sm ml-auto" onClick={signOut}><Icon name="logout" size={15} /> Sign out</button>
        </div>
      </section>

      <div className="mt-5">
        <Stats items={[
          ["Cards", String(me.cards.length)],
          ["For sale", String(me.listings.length)],
          ["Sold", String(sold.length)],
          ["Earned", fmtSol(toSol(earned))],
        ]} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[30px] font-extrabold tracking-[-.035em]">Achievements</h2>
          <Link href="/collection" className="btn-ghost btn-sm">All achievements</Link>
        </div>
        {won.length ? (
          <ul className="surface mt-4 flex flex-wrap gap-x-6 gap-y-4 p-5">
            {won.map((b) => (
              <li key={b.id} className="flex w-[88px] flex-col items-center text-center">
                <Medal glyph={b.glyph} rar={b.rar} size={b.rar === "mythic" ? 64 : 54} />
                <span className="mt-1 font-display text-[14px] leading-tight font-extrabold">{b.name}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 font-display text-[19px] font-extrabold text-muted">No achievements yet</p>}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[30px] font-extrabold tracking-[-.035em]">My listings</h2>
          <Link href="/collection" className="btn-ghost btn-sm">Sell a card</Link>
        </div>
        {me.listings.length ? (
          <div className="surface mt-4 divide-y-2 divide-fg/10">
            {me.listings.map((l) => {
              const c = cards.get(l.uid);
              if (!c) return null;
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
                  <span className="min-w-0 truncate font-display text-[16px] font-extrabold">{trader(c.trader).name}</span>
                  <RarityTag id={c.rarity} size="sm" />
                  <span className="num hidden font-semibold text-muted sm:inline">#{serialOf(c)}</span>
                  <span className="num ml-auto font-display text-[16px] font-extrabold">{fmtSol(toSol(l.lamports))}</span>
                  <button className="btn-ghost btn-sm h-9 px-3.5 text-[14px]" onClick={() => unlist(l.uid)} disabled={busy === l.uid}>Delist</button>
                </div>
              );
            })}
          </div>
        ) : <p className="mt-4 font-display text-[19px] font-extrabold text-muted">No listings</p>}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[30px] font-extrabold tracking-[-.035em]">History</h2>
        {me.sales.length ? (
          <div className="surface mt-4 divide-y-2 divide-fg/10">
            {me.sales.map((s) => {
              const out = s.seller === wallet;
              return (
                <div key={s.sig} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-fg ${out ? "bg-up text-white" : "bg-cream"}`}>
                    <Icon name={out ? "arrow" : "back"} size={15} />
                  </span>
                  <span className="min-w-0 truncate">
                    <span className="font-display font-extrabold">{out ? "Sold" : "Bought"}</span>{" "}
                    <span className="font-semibold text-muted">{trader(s.trader).name} {rarity(s.rarity).name}</span>
                  </span>
                  <span className={`num ml-auto font-display font-extrabold ${out ? "text-up" : ""}`}>{out ? "+" : "-"}{fmtSol(toSol(s.lamports))}</span>
                  <a href={explorer(s.sig, cfg.cluster)} target="_blank" rel="noreferrer" className="hidden w-24 text-right text-[13.5px] font-semibold text-muted hover:text-fg sm:block"><Ago at={s.at} /></a>
                </div>
              );
            })}
          </div>
        ) : <p className="mt-4 font-display text-[19px] font-extrabold text-muted">No sales yet</p>}
      </section>
    </>
  );
}

/* Une couleur tirée de l'adresse : chaque wallet a la sienne. */
function tint(w: string) {
  let h = 0;
  for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 80% 66%), hsl(${(h + 50) % 360} 75% 52%))`;
}
