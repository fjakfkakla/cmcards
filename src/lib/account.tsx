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
  /* onSent : la transaction est partie (pas encore confirmée) ; sa signature, à garder */
  pay: (transfers: { to: string; lamports: number }[], memo: string, onSent?: (sig: string) => void) => Promise<string>;
  savePurchase: (p: Purchase) => void;
  dropPurchase: (sig: string) => void;
};

/* Un achat au marché payé, dont la carte n'est pas encore arrivée : gardé dans le
   navigateur et redemandé au serveur à chaque visite, jusqu'à ce qu'il réponde. */
export type Purchase = { sig: string; uid: string; listing: string; wallet: string };
const PURCHASES = "cmcards:purchases";
const readPurchases = (): Purchase[] => {
  try { return JSON.parse(localStorage.getItem(PURCHASES) ?? "[]"); } catch { return []; }
};
const writePurchases = (l: Purchase[]) => {
  try { if (l.length) localStorage.setItem(PURCHASES, JSON.stringify(l)); else localStorage.removeItem(PURCHASES); } catch {}
};

const Ctx = createContext<Account | null>(null);
export const useAccount = () => {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAccount outside <AccountProvider>");
  return a;
};

/* Le serveur a tranché pour de bon (pas une coupure, pas une transaction encore
   introuvable, pas une session à refaire) : inutile de redemander. */
export const final = (e: unknown) => {
  const st = (e as { status?: number })?.status ?? 0;
  return st >= 400 && st < 500 && st !== 401 && st !== 404;
};

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, body === undefined
    ? { cache: "no-store" }
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: "Unreadable response from the server." }));
  if (!r.ok) throw Object.assign(new Error(j.error ?? "Server error."), { status: r.status });
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
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try { setMe(await api<Me>("/api/me")); } catch { setMe((m) => m ?? { wallet: null, cards: [], listings: [], sales: [], free: false }); }
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

  const savePurchase = useCallback((p: Purchase) => {
    writePurchases([...readPurchases().filter((x) => x.sig !== p.sig), p]);
  }, []);
  const dropPurchase = useCallback((sig: string) => {
    writePurchases(readPurchases().filter((x) => x.sig !== sig));
  }, []);

  /* Les achats restés en route (onglet fermé, réseau coupé) : on les reprend dès que
     la session est là. Une réponse nette du serveur (la carte, ou un remboursement)
     les retire ; une coupure ou une transaction pas encore lue les garde. */
  const retried = useRef<string | null>(null);
  useEffect(() => {
    const wallet = me?.wallet;
    if (!wallet || retried.current === wallet) return;
    retried.current = wallet;
    const mine = readPurchases().filter((p) => p.wallet === wallet);
    if (!mine.length) return;
    (async () => {
      let got = 0;
      for (const p of mine) {
        const r = await fetch("/api/market/buy", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: p.uid, listing: p.listing, signature: p.sig }),
        }).catch(() => null);
        if (!r || r.status === 401 || r.status === 404 || r.status >= 500) continue;
        dropPurchase(p.sig);
        if (r.ok) got++;
        else setNotice((await r.json().catch(() => null))?.error ?? "A purchase could not be completed.");
      }
      if (got) { setNotice(got > 1 ? `${got} cards you paid for are now yours.` : "The card you paid for is now yours."); refresh(); }
    })();
  }, [me?.wallet, dropPurchase, refresh]);

  const pay = useCallback(async (transfers: { to: string; lamports: number }[], memo: string, onSent?: (sig: string) => void) => {
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
    onSent?.(signature);
    const r = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    if (r.value.err) throw new Error("The transaction failed on-chain.");
    return signature;
  }, [me, w, connection, signIn]);

  const value = useMemo<Account>(() => ({
    cfg, ready, me, wallet: me?.wallet ?? null, busy, error, balance, refresh, signIn, signOut, picker, setPicker, choose, pay,
    savePurchase, dropPurchase,
  }), [cfg, ready, me, busy, error, balance, refresh, signIn, signOut, picker, choose, pay, savePurchase, dropPurchase]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {notice && (
        <div role="status" className="surface fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 p-4 md:bottom-6">
          <p className="flex-1 text-[15px] font-bold">{notice}</p>
          <button className="btn-ghost btn-sm" onClick={() => setNotice(null)}>OK</button>
        </div>
      )}
    </Ctx.Provider>
  );
}
