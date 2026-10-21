"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import { Ago, ConnectCard, RarityTag, Stats } from "./ui";
import { api, useAccount } from "@/lib/account";
import { fmtSol, rank, rarity, serialOf, trader } from "@/lib/data";
import { explorer, short, toSol } from "@/lib/solana";

/* Le profil : le wallet, ce qu'il possède, ce qu'il vend, ce qu'il a acheté et vendu. */
export default function Profile() {
  const { cfg, me, wallet, balance, signOut, refresh } = useAccount();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!me) return <div className="surface h-40 animate-pulse" />;
  if (!wallet) return (
    <>
      <h1 className="font-display text-[42px] leading-none font-extrabold tracking-[-.035em] sm:text-[52px]">Profil</h1>
      <ConnectCard text="Ton wallet est ton compte : pas d'email, pas de mot de passe. Tu signes un message, c'est tout." />
    </>
  );

  const cards = new Map(me.cards.map((c) => [c.uid, c]));
  const sold = me.sales.filter((s) => s.seller === wallet);
  const bought = me.sales.filter((s) => s.buyer === wallet);
  const earned = sold.reduce((a, s) => a + s.lamports, 0);
  const best = [...me.cards].sort((a, b) => rank(b.rarity) - rank(a.rarity) || a.serial - b.serial)[0];

  async function unlist(uid: string) {
    setBusy(uid);
    try { await api("/api/market/unlist", { uid }); await refresh(); } catch {} finally { setBusy(null); }
  }

  return (
    <>
      <section className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: tint(wallet) }} />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="h-16 w-16 shrink-0 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,.4)]" style={{ background: tint(wallet) }} aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="num font-display text-[30px] leading-none font-extrabold tracking-[-.03em]">{short(wallet)}</h1>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted hover:text-fg" aria-label="Copier l'adresse"
                onClick={() => { navigator.clipboard?.writeText(wallet); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                <Icon name={copied ? "check" : "copy"} size={15} />
              </button>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[14px] text-muted">
              <span className="num">{balance !== null ? `${toSol(balance).toLocaleString("fr-FR", { maximumFractionDigits: 4 })} SOL` : "Wallet non branché"}</span>
              <span className="chip h-6 px-2.5 text-[12px]">{cfg.cluster === "devnet" ? "Devnet" : "Mainnet"}</span>
            </p>
          </div>
          <button className="btn-ghost btn-sm ml-auto" onClick={signOut}><Icon name="logout" size={15} /> Déconnexion</button>
        </div>
      </section>

      <div className="mt-5">
        <Stats items={[
          ["Cartes", String(me.cards.length)],
          ["En vente", String(me.listings.length)],
          ["Vendues", String(sold.length)],
          ["Gagné", fmtSol(toSol(earned))],
        ]} />
      </div>

      {best && (
        <p className="mt-4 text-[14.5px] text-muted">
          Ta plus belle carte : <span className="font-semibold text-fg">{trader(best.trader).name} {rarity(best.rarity).name}</span> n° {serialOf(best)}.
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[26px] font-extrabold tracking-[-.03em]">Mes annonces</h2>
          <Link href="/collection" className="text-[14px] font-semibold text-muted hover:text-fg">Vendre une carte</Link>
        </div>
        {me.listings.length ? (
          <div className="surface mt-4 divide-y divide-white/[.06]">
            {me.listings.map((l) => {
              const c = cards.get(l.uid);
              if (!c) return null;
              return (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
                  <span className="min-w-0 truncate font-semibold">{trader(c.trader).name}</span>
                  <RarityTag id={c.rarity} />
                  <span className="num hidden text-dim sm:inline">n° {serialOf(c)}</span>
                  <span className="num ml-auto font-semibold text-gold">{fmtSol(toSol(l.lamports))}</span>
                  <button className="btn-ghost btn-sm h-8 px-3 text-[13px]" onClick={() => unlist(l.uid)} disabled={busy === l.uid}>Retirer</button>
                </div>
              );
            })}
          </div>
        ) : <p className="mt-3 text-[15px] text-dim">Aucune carte en vente.</p>}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[26px] font-extrabold tracking-[-.03em]">Historique</h2>
        {me.sales.length ? (
          <div className="surface mt-4 divide-y divide-white/[.06]">
            {me.sales.map((s) => {
              const out = s.seller === wallet;
              return (
                <div key={s.sig} className="flex items-center gap-3 px-4 py-3 text-[14.5px]">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${out ? "bg-up/12 text-up" : "bg-white/5 text-muted"}`}>
                    <Icon name={out ? "arrow" : "back"} size={15} />
                  </span>
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{out ? "Vendue" : "Achetée"}</span>{" "}
                    <span className="text-muted">{trader(s.trader).name} {rarity(s.rarity).name}</span>
                  </span>
                  <span className={`num ml-auto font-semibold ${out ? "text-up" : ""}`}>{out ? "+" : "-"}{fmtSol(toSol(s.lamports))}</span>
                  <a href={explorer(s.sig, cfg.cluster)} target="_blank" rel="noreferrer" className="hidden w-24 text-right text-[13px] text-dim hover:text-muted sm:block"><Ago at={s.at} /></a>
                </div>
              );
            })}
          </div>
        ) : <p className="mt-3 text-[15px] text-dim">Pas encore d&apos;achat ni de vente sur le marché.</p>}
        {bought.length + sold.length > 0 && <p className="mt-3 text-[13px] text-dim">Chaque ligne renvoie à sa transaction sur Solscan.</p>}
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
