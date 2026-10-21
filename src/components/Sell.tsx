"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api, useAccount } from "@/lib/account";
import { fmtSol, rarity, trader } from "@/lib/data";
import { FEE_BPS, MIN_PRICE, toSol } from "@/lib/solana";
import type { Listing, Offer, Owned } from "@/lib/types";

/* Vendre une carte : le joueur fixe son prix. Mettre en vente ne coûte rien ;
   l'acheteur paie le prix au vendeur, et 1 % de frais en plus à cm cards. */
export default function Sell({ card, listing }: { card: Owned; listing?: Listing }) {
  const { refresh } = useAccount();
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floor, setFloor] = useState<{ min: number | null; last: number | null } | null>(null);

  /* Les repères : la moins chère en vente, la dernière vendue (même personnage, même rareté). */
  useEffect(() => {
    let live = true;
    api<{ offers: Offer[]; sales: { trader: string; rarity: string; lamports: number }[] }>("/api/market").then((m) => {
      if (!live) return;
      const same = m.offers.filter((o) => o.card.trader === card.trader && o.card.rarity === card.rarity && o.uid !== card.uid);
      const last = m.sales.find((s) => s.trader === card.trader && s.rarity === card.rarity);
      setFloor({ min: same.length ? Math.min(...same.map((o) => o.lamports)) : null, last: last?.lamports ?? null });
    }).catch(() => {});
    return () => { live = false; };
  }, [card.trader, card.rarity, card.uid]);

  async function act(path: string, body: unknown) {
    setBusy(true); setError(null);
    try { await api(path, body); await refresh(); setPrice(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur."); }
    finally { setBusy(false); }
  }

  const sol = Number(price.replace(",", "."));
  const valid = Number.isFinite(sol) && sol >= MIN_PRICE;

  if (listing)
    return (
      <div className="surface mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label">En vente</div>
            <div className="num mt-1 font-display text-[30px] leading-none font-bold tracking-[-.02em] text-gold">{fmtSol(toSol(listing.lamports))}</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => act("/api/market/unlist", { uid: card.uid })} disabled={busy}>
            {busy ? "…" : "Retirer"}
          </button>
        </div>
        <p className="mt-3 text-[13.5px] text-muted">Tu reçois ton prix entier dans ton wallet dès qu&apos;un joueur l&apos;achète.</p>
        {error && <p className="mt-3 text-[14px] font-semibold text-down">{error}</p>}
      </div>
    );

  return (
    <form className="surface mt-6 p-5" onSubmit={(e) => { e.preventDefault(); if (valid) act("/api/market/list", { uid: card.uid, price: sol }); }}>
      <label htmlFor="price" className="label">Ton prix</label>
      <div className="relative mt-2">
        <input id="price" className="field num pr-14" inputMode="decimal" autoComplete="off" placeholder="0,5"
          value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[14px] font-semibold text-dim">SOL</span>
      </div>
      {floor && (floor.min !== null || floor.last !== null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {floor.min !== null && (
            <button type="button" className="chip h-8 hover:text-fg" onClick={() => setPrice(String(toSol(floor.min!)))}>
              Plancher <span className="num text-fg">{fmtSol(toSol(floor.min))}</span>
            </button>
          )}
          {floor.last !== null && (
            <button type="button" className="chip h-8 hover:text-fg" onClick={() => setPrice(String(toSol(floor.last!)))}>
              Dernière vente <span className="num text-fg">{fmtSol(toSol(floor.last))}</span>
            </button>
          )}
        </div>
      )}
      <button className="btn-gold mt-4 w-full" disabled={!valid || busy}>
        <Icon name="tag" size={16} /> {busy ? "Mise en vente…" : valid ? `Vendre ${fmtSol(sol)}` : "Mettre en vente"}
      </button>
      <p className="mt-3 text-[13px] text-dim">
        Gratuit. L&apos;acheteur te paie directement ; cm cards prend {FEE_BPS / 100} % en plus, à sa charge.
        {" "}{trader(card.trader).name} {rarity(card.rarity).name} : {rarity(card.rarity).supply === 1 ? "exemplaire unique" : `${rarity(card.rarity).supply.toLocaleString("fr-FR")} exemplaires au plus`}.
      </p>
      {error && <p className="mt-3 text-[14px] font-semibold text-down">{error}</p>}
    </form>
  );
}
