/* Lire un paiement sur la chaîne : qui a signé, quels virements de SOL, quels mémos.
   Le serveur ne croit que ça, jamais ce que le navigateur annonce. */

import { SERVER_RPC } from "./config";
import { Oops } from "./errors";

const RPC = SERVER_RPC;
const MAX_AGE = 60 * 60; // un paiement de plus d'une heure n'achète plus rien (s)

export type Payment = {
  signer: string;
  transfers: { from: string; to: string; lamports: number }[];
  memos: string[];
};

type Ix = { program?: string; parsed?: unknown };
type Tx = {
  blockTime: number | null;
  meta: { err: unknown } | null;
  transaction: { message: { accountKeys: { pubkey: string; signer: boolean }[]; instructions: Ix[] } };
};

export const isSignature = (s: unknown): s is string =>
  typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(s);

export async function readPayment(sig: string): Promise<Payment> {
  let tx: Tx | null = null;
  // juste après la confirmation, le nœud peut ne pas encore la servir
  for (let i = 0; i < 8 && !tx; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1500));
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getTransaction",
        params: [sig, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }],
      }),
      cache: "no-store",
    }).catch(() => null);
    const j = r?.ok ? await r.json().catch(() => null) : null;
    tx = j?.result ?? null;
  }
  if (!tx) throw new Oops(404, "Transaction introuvable sur la chaîne. Réessaie dans un instant.");
  if (!tx.meta || tx.meta.err) throw new Oops(400, "La transaction a échoué sur la chaîne.");
  if (!tx.blockTime || Date.now() / 1000 - tx.blockTime > MAX_AGE) throw new Oops(400, "Ce paiement est trop ancien.");

  const { accountKeys, instructions } = tx.transaction.message;
  const transfers: Payment["transfers"] = [];
  const memos: string[] = [];
  for (const ix of instructions) {
    const p = ix.parsed as { type?: string; info?: { source: string; destination: string; lamports: number } } | string | undefined;
    if (ix.program === "system" && typeof p === "object" && p?.type === "transfer" && p.info)
      transfers.push({ from: p.info.source, to: p.info.destination, lamports: Number(p.info.lamports) });
    if (ix.program === "spl-memo" && typeof p === "string") memos.push(p);
  }
  return { signer: accountKeys[0]?.pubkey ?? "", transfers, memos };
}

/* Ce que `from` a versé à `to` dans ce paiement. */
export const paid = (p: Payment, from: string, to: string) =>
  p.transfers.filter((t) => t.from === from && t.to === to).reduce((a, t) => a + t.lamports, 0);
