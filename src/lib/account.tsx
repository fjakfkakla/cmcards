"use client";

/* Le compte du joueur dans le navigateur : son wallet (Phantom, Solflare, Backpack…
   ceux que le navigateur connaît), la connexion signée, ses cartes et ses annonces,
   et les paiements en SOL. */

import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type Config, DEFAULT_CONFIG, MEMO_PROGRAM } from "./solana";
import type { Me } from "./types";

type Account = {
  cfg: Config;                   // le réseau et le wallet de cm cards, lus sur le serveur
  ready: boolean;                // la config est lue
  me: Me | null;                 // null : pas encore lu
  wallet: string | null;         // le wallet connecté (session signée)
  busy: boolean;
  error: string | null;
  balance: number | null;        // en lamports, du wallet branché
  refresh: () => Promise<void>;
  signIn: () => void;            // ouvre le choix du wallet si besoin, puis fait signer
  signOut: () => Promise<void>;
  picker: boolean;
  setPicker: (v: boolean) => void;
  choose: (name: WalletName) => void;
  pay: (transfers: { to: string; lamports: number }[], memo: string) => Promise<string>;
};

const Ctx = createContext<Account | null>(null);
export const useAccount = () => {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAccount outside <AccountProvider>");
  return a;
};

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, body === undefined
    ? { cache: "no-store" }
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: "Unreadable response from the server." }));
  if (!r.ok) throw new Error(j.error ?? "Server error.");
  return j as T;
}

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  useEffect(() => {
    let live = true;
    api<Config>("/api/config").then((c) => { if (live) setCfg(c); }).catch(() => { if (live) setCfg(DEFAULT_CONFIG); });
    return () => { live = false; };
  }, []);
  return (
    <ConnectionProvider endpoint={(cfg ?? DEFAULT_CONFIG).rpc}>
      <WalletProvider wallets={[]} autoConnect onError={() => {}}>
        <Account cfg={cfg ?? DEFAULT_CONFIG} ready={!!cfg}>{children}</Account>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function Account({ cfg, ready, children }: { cfg: Config; ready: boolean; children: React.ReactNode }) {
  const { connection } = useConnection();
  const w = useWallet();
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [bal, setBal] = useState<{ key: string; lamports: number } | null>(null);
  const want = useRef(false); // une connexion demandée, en attente du wallet

  const refresh = useCallback(async () => {
    try { setMe(await api<Me>("/api/me")); } catch { setMe((m) => m ?? { wallet: null, cards: [], listings: [], sales: [] }); }
  }, []);
  useEffect(() => { const t = setTimeout(refresh, 0); return () => clearTimeout(t); }, [refresh]);

  const key = w.publicKey?.toBase58() ?? null;
  const balance = bal && bal.key === key ? bal.lamports : null;

  /* Le solde du wallet branché, suivi en direct. */
  useEffect(() => {
    if (!w.publicKey) return;
    const pk = w.publicKey, k = pk.toBase58();
    let live = true;
    connection.getBalance(pk).then((b) => { if (live) setBal({ key: k, lamports: b }); }).catch(() => {});
    const sub = connection.onAccountChange(pk, (a) => setBal({ key: k, lamports: a.lamports }));
    return () => { live = false; connection.removeAccountChangeListener(sub).catch(() => {}); };
  }, [connection, w.publicKey]);

  const sign = useCallback(async () => {
    if (!w.publicKey || !w.signMessage) {
      setError("This wallet can't sign messages. Try Phantom or Solflare.");
      return;
    }
    const wallet = w.publicKey.toBase58();
    setBusy(true); setError(null);
    try {
      const { message } = await api<{ message: string }>("/api/auth/nonce", { wallet });
      const sig = await w.signMessage(new TextEncoder().encode(message));
      await api("/api/auth/verify", { wallet, message, signature: Buffer.from(sig).toString("base64") });
      await refresh();
    } catch (e) {
      setError(e instanceof Error && !/reject/i.test(e.message) ? e.message : "Sign-in cancelled.");
    } finally { setBusy(false); }
  }, [w, refresh]);

  /* Le wallet vient de se brancher après une demande : on fait signer. */
  useEffect(() => {
    if (want.current && w.connected && key && me && me.wallet !== key) { want.current = false; sign(); }
  }, [w.connected, key, me, sign]);

  const signIn = useCallback(() => {
    setError(null);
    if (w.connected && key) { sign(); return; }
    want.current = true;
    if (w.wallet) w.connect().catch(() => setPicker(true));
    else setPicker(true);
  }, [w, key, sign]);

  const choose = useCallback((name: WalletName) => {
    setPicker(false);
    want.current = true;
    w.select(name); // autoConnect branche le wallet choisi
  }, [w]);

  const signOut = useCallback(async () => {
    await api("/api/auth/logout", {}).catch(() => {});
    await w.disconnect().catch(() => {});
    await refresh();
  }, [w, refresh]);

  const pay = useCallback(async (transfers: { to: string; lamports: number }[], memo: string) => {
    if (!me?.wallet) throw new Error("Connect your wallet.");
    if (!w.publicKey || !w.connected) {
      signIn();
      throw new Error("Connect your wallet, then try again.");
    }
    if (w.publicKey.toBase58() !== me.wallet)
      throw new Error(`The connected wallet isn't the one of your session (${me.wallet.slice(0, 4)}…). Sign in again.`);
    const from = w.publicKey;
    const tx = new Transaction();
    for (const t of transfers)
      tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: new PublicKey(t.to), lamports: t.lamports }));
    tx.add(new TransactionInstruction({
      programId: new PublicKey(MEMO_PROGRAM),
      keys: [{ pubkey: from, isSigner: true, isWritable: false }],
      data: Buffer.from(memo, "utf8"),
    }));
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = from;
    let signature: string;
    try {
      signature = await w.sendTransaction(tx, connection);
    } catch (e) {
      throw new Error(e instanceof Error && /reject|cancel/i.test(e.message) ? "Payment cancelled." : "The wallet rejected the transaction. Check your balance.");
    }
    const r = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    if (r.value.err) throw new Error("The transaction failed on-chain.");
    return signature;
  }, [me, w, connection, signIn]);

  const value = useMemo<Account>(() => ({
    cfg, ready, me, wallet: me?.wallet ?? null, busy, error, balance, refresh, signIn, signOut, picker, setPicker, choose, pay,
  }), [cfg, ready, me, busy, error, balance, refresh, signIn, signOut, picker, choose, pay]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
