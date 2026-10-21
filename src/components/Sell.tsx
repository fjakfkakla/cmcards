"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { api, useAccount } from "@/lib/account";
import { fmtSol } from "@/lib/data";
import { MIN_PRICE, toSol } from "@/lib/solana";
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
    catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setBusy(false); }
  }

  const sol = Number(price.replace(",", "."));
  const valid = Number.isFinite(sol) && sol >= MIN_PRICE;

  if (listing)
    return (
      <div className="surface mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-display text-[17px] font-extrabold text-muted">For sale</div>
            <div className="num mt-1 font-display text-[32px] leading-none font-extrabold tracking-[-.02em]">{fmtSol(toSol(listing.lamports))}</div>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => act("/api/market/unlist", { uid: card.uid })} disabled={busy}>
            {busy ? "…" : "Delist"}
          </button>
        </div>
        {error && <p className="mt-3 text-[14.5px] font-bold text-down">{error}</p>}
      </div>
    );

  return (
    <form className="surface mt-6 p-5" onSubmit={(e) => { e.preventDefault(); if (valid) act("/api/market/list", { uid: card.uid, price: sol }); }}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="price" className="font-display text-[19px] font-extrabold">Your price</label>
        <span className="plate h-8 px-3 text-[13.5px]">Listing is free</span>
      </div>
      <div className="relative mt-2">
        <input id="price" className="field num pr-14" inputMode="decimal" autoComplete="off" placeholder="0.5"
          value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-display text-[15px] font-extrabold text-muted">SOL</span>
      </div>
      {floor && (floor.min !== null || floor.last !== null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {floor.min !== null && (
            <button type="button" className="chip h-9 text-muted hover:text-fg" onClick={() => setPrice(String(toSol(floor.min!)))}>
              Floor <span className="num font-display font-extrabold text-fg">{fmtSol(toSol(floor.min))}</span>
            </button>
          )}
          {floor.last !== null && (
            <button type="button" className="chip h-9 text-muted hover:text-fg" onClick={() => setPrice(String(toSol(floor.last!)))}>
              Last sale <span className="num font-display font-extrabold text-fg">{fmtSol(toSol(floor.last))}</span>
            </button>
          )}
        </div>
      )}
      <button className="btn-gold mt-4 w-full" disabled={!valid || busy}>
        <Icon name="tag" size={16} /> {busy ? "Listing…" : valid ? `Sell for ${fmtSol(sol)}` : "List for sale"}
      </button>
      {error && <p className="mt-3 text-[14.5px] font-bold text-down">{error}</p>}
    </form>
  );
}
