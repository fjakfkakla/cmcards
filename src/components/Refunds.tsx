"use client";

import { useCallback, useEffect, useState } from "react";
import { Ago, ConnectCard, Empty, PageHead, Stats } from "./ui";
import { api, useAccount } from "@/lib/account";
import { fmtSol } from "@/lib/data";
import { MEMO, explorer, short, toSol } from "@/lib/solana";
import type { Refund } from "@/lib/types";

/* Les remboursements, pour le wallet de cm cards seulement : les paiements du marché
   qui n'ont rien acheté (annonce retirée, carte déjà vendue…). Un clic envoie le
   montant à l'acheteur depuis le wallet de cm cards ; le serveur relit la
   transaction et note le paiement comme rendu. */
export default function Refunds() {
  const { cfg, ready, wallet, pay } = useAccount();
  const [list, setList] = useState<Refund[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const admin = !!wallet && wallet === cfg.treasury;

  const load = useCallback(async () => {
    try { setList((await api<{ refunds: Refund[] }>("/api/admin/refunds")).refunds); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load refunds."); }
  }, []);
  useEffect(() => {
    if (!admin) return;
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [admin, load]);

  async function refund(r: Refund) {
    setBusy(r.sig); setError(null);
    try {
      const s = await pay([{ to: r.wallet, lamports: r.lamports }], MEMO.refund(r.sig));
      await api("/api/admin/refunds", { sig: r.sig, refund: s });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The refund failed.");
    } finally { setBusy(null); }
  }

  const open = list?.filter((r) => !r.done) ?? [];
  const owed = open.reduce((a, r) => a + r.lamports, 0);

  return (
    <>
      <PageHead title="Refunds">
        {admin && list && (
          <div className="w-full sm:w-auto sm:min-w-[320px]">
            <Stats items={[["To refund", String(open.length)], ["Owed", fmtSol(toSol(owed))]]} />
          </div>
        )}
      </PageHead>

      {!ready ? null : !wallet ? (
        <ConnectCard />
      ) : !admin ? (
        <p className="surface mt-8 p-6 font-bold">Only the cm cards wallet ({cfg.treasury ? short(cfg.treasury) : "not set"}) can see this page.</p>
      ) : !list ? (
        error ? <p className="mt-8 font-bold text-down">{error}</p> : <div className="mt-8 h-32 animate-pulse rounded-[14px] bg-raised" />
      ) : list.length === 0 ? (
        <Empty title="Nothing to refund" href="/market" cta="Back to the market" />
      ) : (
        <>
          <p className="mt-6 text-[15px] font-semibold text-muted">
            The buyer paid the seller directly: when you refund from the cm cards wallet, the seller keeps what they received.
          </p>
          {error && <p className="mt-3 font-bold text-down">{error}</p>}
          <div className="surface mt-5 divide-y-2 divide-fg/10">
            {list.map((r) => (
              <div key={r.sig} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-[14.5px]">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[17px] font-extrabold">{r.why}</div>
                  <div className="mt-1 font-semibold text-muted">
                    Buyer {short(r.wallet)}{r.seller && <> · seller {short(r.seller)}</>} ·{" "}
                    <a href={explorer(r.sig, cfg.cluster)} target="_blank" rel="noreferrer" className="hover:text-fg">payment <Ago at={r.at} /></a>
                  </div>
                </div>
                <span className="num font-display text-[18px] font-extrabold">{fmtSol(toSol(r.lamports))}</span>
                {r.done ? (
                  <a href={explorer(r.done, cfg.cluster)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Refunded</a>
                ) : (
                  <button className="btn-gold btn-sm" onClick={() => refund(r)} disabled={!!busy}>
                    {busy === r.sig ? "Confirm in your wallet…" : "Refund"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
