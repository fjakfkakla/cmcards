"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./opening.css";
import BoosterPack from "./BoosterPack";
import CollectCard from "./CollectCard";
import Icon from "./Icon";
import { api, useAccount } from "@/lib/account";
import { type Pack, type RarityId, fmtSol, rarity, serialOf, trader } from "@/lib/data";
import { MEMO, explorer, toLamports } from "@/lib/solana";
import type { Owned } from "@/lib/types";

/* La couleur de la lumière d'une rareté : celle qui sort du booster, celle du nom. */
const GLOW: Record<RarityId, string> = {
  common: "#dfe3ec",
  rare: "#8fb0ff",
  shiny: "#bff0ff",
  og: "#ffdd7a",
  mythic: "#f6a6cb",
};
const CONFETTI = ["#ffdd7a", "#f7c948", "#8fb0ff", "#bff0ff", "#f6a6cb", "#ffffff"];

type Phase = "pay" | "sealed" | "torn" | "reveal" | "done";
type Step = "idle" | "sign" | "draw";
const PENDING = "cmcards:pending"; // un paiement fait dont on n'a pas encore les cartes

export default function Opening({ pack }: { pack: Pack }) {
  const { cfg, ready, wallet, balance, busy, signIn, pay, refresh } = useAccount();
  const [cards, setCards] = useState<Owned[] | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const best = cards?.[cards.length - 1]?.rarity ?? "common";

  const [phase, setPhase] = useState<Phase>("pay");
  const [slit, setSlit] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [i, setI] = useState(0);
  const [up, setUp] = useState(false);
  const [out, setOut] = useState(false);
  const [fx, setFx] = useState(0); // relance les effets à chaque carte
  const drag = useRef<{ x: number; w: number; moved: boolean } | null>(null);

  const price = toLamports(pack.price);
  const short = balance !== null && balance < price + 10_000;

  /* Le paiement est sur la chaîne : le serveur le lit et tire les cartes. */
  const claim = useCallback(async (sig: string) => {
    setStep("draw"); setError(null);
    try {
      const r = await api<{ cards: Owned[] }>("/api/packs/open", { pack: pack.id, signature: sig });
      try { localStorage.removeItem(PENDING); } catch {}
      setPending(null);
      setCards(r.cards);
      setPhase("sealed");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le tirage a échoué.");
    } finally { setStep("idle"); }
  }, [pack.id, refresh]);

  /* Un paiement resté sans cartes (onglet fermé, réseau coupé) : on le reprend. */
  useEffect(() => {
    if (!wallet) return;
    let p: { sig: string; pack: string; wallet: string } | null = null;
    try { p = JSON.parse(localStorage.getItem(PENDING) ?? "null"); } catch {}
    if (!p || p.pack !== pack.id || p.wallet !== wallet) return;
    const sig = p.sig;
    const t = setTimeout(() => { setPending(sig); claim(sig); }, 0);
    return () => clearTimeout(t);
  }, [wallet, pack.id, claim]);

  async function buy() {
    setError(null); setStep("sign");
    let sig: string;
    try {
      sig = await pay([{ to: cfg.treasury, lamports: price }], MEMO.pack(pack.id));
    } catch (e) {
      setStep("idle");
      setError(e instanceof Error ? e.message : "Paiement annulé.");
      return;
    }
    try { localStorage.setItem(PENDING, JSON.stringify({ sig, pack: pack.id, wallet })); } catch {}
    setPending(sig);
    await claim(sig);
  }

  function tear() {
    if (phase !== "sealed") return;
    setSlit(1);
    setShaking(true);
    setTimeout(() => { setShaking(false); setPhase("torn"); }, 1050);
    setTimeout(() => setPhase("reveal"), 1900);
  }
  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "sealed") return;
    const b = e.currentTarget.getBoundingClientRect();
    drag.current = { x: e.clientX, w: b.width, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = Math.max(0, Math.min(1, (e.clientX - d.x) / (d.w * 0.8)));
    if (p > 0.04) d.moved = true;
    setSlit(p);
    if (p >= 1) { drag.current = null; tear(); }
  }
  function up_() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) tear();          // un simple clic ouvre aussi
    else if (slit < 0.7) setSlit(0);
    else tear();
  }

  function next() {
    if (out || !cards) return;
    if (!up) {
      setUp(true);
      setFx((n) => n + 1);
      return;
    }
    setOut(true);
    setTimeout(() => {
      setOut(false);
      setUp(false);
      if (i + 1 >= cards.length) setPhase("done");
      else setI(i + 1);
    }, 420);
  }

  function again() {
    setCards(null); setPhase("pay"); setSlit(0); setI(0); setUp(false); setOut(false);
  }

  const card = cards?.[i];
  const r = card?.rarity ?? "common";
  const showFx = phase === "reveal" && up && !out;
  const stageFx = showFx && r === "og" ? "og-flash" : showFx && r === "mythic" ? "quake" : "";

  return (
    <div className={`op-stage ${stageFx}`} key={`stage-${fx}`} style={{ "--glow": GLOW[showFx ? r : best] } as React.CSSProperties}>
      {showFx && <RevealFx rarity={r} key={`fx-${fx}`} />}

      {phase === "pay" && (
        <div className="relative z-[2] flex w-full max-w-md flex-col items-center">
          <div className="w-[min(58vw,260px)]"><BoosterPack pack={pack} floating /></div>
          <h1 className="mt-8 font-display text-[36px] leading-none font-extrabold tracking-[-.035em]">Booster {pack.name}</h1>
          <p className="mt-2 text-[15px] text-muted">{pack.cards} cartes{pack.guarantee ? `, la dernière ${rarity(pack.guarantee).name} ou mieux` : ""}</p>

          <div className="mt-8 w-full">
            {!ready ? (
              <span className="btn-ghost btn-lg w-full animate-pulse opacity-60">…</span>
            ) : !cfg.treasury ? (
              <span className="btn-ghost btn-lg w-full cursor-not-allowed opacity-60">Les paiements ouvrent bientôt</span>
            ) : !wallet ? (
              <button className="btn-gold btn-lg w-full" onClick={signIn} disabled={busy}>
                <Icon name="wallet" size={18} /> {busy ? "Signature…" : "Connecter mon wallet"}
              </button>
            ) : pending ? (
              <button className="btn-gold btn-lg w-full" onClick={() => claim(pending)} disabled={step !== "idle"}>
                {step === "draw" ? "Tirage en cours…" : "Récupérer mes cartes"}
              </button>
            ) : (
              <button className="btn-gold btn-lg w-full" onClick={buy} disabled={step !== "idle" || short}>
                {step === "sign" ? "Valide dans ton wallet…" : step === "draw" ? "Tirage en cours…" : `Payer ${fmtSol(pack.price)}`}
              </button>
            )}
            {short && !pending && <p className="mt-3 text-center text-[14px] font-semibold text-down">Solde insuffisant pour ce booster.</p>}
            {error && <p className="mt-3 text-center text-[14px] font-semibold text-down">{error}</p>}
            {pending && (
              <a href={explorer(pending, cfg.cluster)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-[13.5px] text-dim hover:text-muted">
                Voir le paiement <Icon name="out" size={14} />
              </a>
            )}
            <p className="mt-4 text-center text-[13.5px] text-dim">Le tirage est fait par le serveur une fois le paiement lu sur la chaîne.</p>
          </div>
        </div>
      )}

      {(phase === "sealed" || phase === "torn") && (
        <div className="relative z-[2] flex flex-col items-center">
          <div
            className="op-pack"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up_}
            onPointerCancel={() => { drag.current = null; setSlit(0); }}
          >
            <BoosterPack pack={pack} torn={phase === "torn"} shaking={shaking} floating={phase === "sealed" && !shaking} slit={slit} glow={GLOW[best]} />
          </div>
          <p className="op-hint" style={{ visibility: phase === "sealed" ? "visible" : "hidden" }}>
            Glisse le long de la ligne pour l&apos;ouvrir
          </p>
        </div>
      )}

      {phase === "reveal" && cards && card && (
        <div className="relative z-[2] flex flex-col items-center">
          <div className={`op-deck ${i === 0 && !up ? "rising" : ""}`}>
            {/* les cartes encore cachées, en pile */}
            {cards.slice(i + 1).map((c, k) => (
              <div key={c.uid} className="op-under" style={{ transform: `translate(${(k + 1) * 6}px, ${(k + 1) * 6}px) rotate(${(k + 1) * 1.5}deg)`, zIndex: 1 - k }}>
                <div className="cb"><div className="cb-mark" /></div>
              </div>
            )).reverse()}
            <div className={`op-card ${up ? "is-up" : ""} ${out ? "is-out" : ""}`} onClick={next} key={card.uid}>
              {up && !out && <span className="op-tag" style={{ "--glow": GLOW[r] } as React.CSSProperties}>{rarity(r).name}</span>}
              <div className="op-flip">
                <div className="op-face"><div className="cb"><div className="cb-mark" /></div></div>
                <div className="op-face op-front"><CollectCard card={card} live={up} /></div>
              </div>
            </div>
          </div>
          <p className="op-hint">
            {up ? (i + 1 < cards.length ? `Touche pour la suivante · ${i + 1}/${cards.length}` : "Touche pour voir ton tirage") : `Touche pour la retourner · ${i + 1}/${cards.length}`}
          </p>
        </div>
      )}

      {phase === "done" && cards && (
        <div className="op-done relative z-[2]">
          <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-.035em]">Ton tirage</h1>
          <p className="mt-2 text-[15px] text-muted">Les cartes sont dans ta collection. Garde-les, ou fixe ton prix sur le marché.</p>
          <div className="op-row">
            {cards.map((c, k) => (
              <div key={c.uid} style={{ animationDelay: `${k * 90}ms` }}>
                <CollectCard card={c} />
                <p className="op-in"><b>{trader(c.trader).name}</b>{rarity(c.rarity).name} · n° {serialOf(c)}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button className="btn-gold" onClick={again}>Rouvrir un {pack.name}</button>
            <Link className="btn-ghost" href="/collection">Ma collection</Link>
            <Link className="btn-ghost" href="/marche">Le marché</Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* Les effets d'une rareté, autour de la carte qui se retourne. */
function RevealFx({ rarity: r }: { rarity: RarityId }) {
  const bits = (n: number, cls: string, dist: number, colors?: string[]) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + (k % 2) * 0.3;
      const d = dist * (0.7 + ((k * 37) % 10) / 20);
      return (
        <span
          key={k}
          className={`op-bit ${cls}`}
          style={{
            "--dx": `${Math.cos(a) * d}px`,
            "--dy": `${Math.sin(a) * d}px`,
            "--r": `${(k * 67) % 360}deg`,
            background: colors ? colors[k % colors.length] : undefined,
            animationDelay: `${(k % 4) * 40}ms`,
          } as React.CSSProperties}
        />
      );
    });

  switch (r) {
    case "rare":
      return <div className="op-fx">{bits(8, "star", 220)}</div>;
    case "shiny":
      return <div className="op-fx"><div className="op-flash" />{bits(18, "star", 280)}</div>;
    case "og":
      return <div className="op-fx"><div className="op-flash" style={{ background: "#000" }} /></div>;
    case "mythic":
      return (
        <div className="op-fx">
          <div className="op-rays multi" />
          <div className="op-flash" style={{ background: "#fff" }} />
          {bits(36, "confetti", 420, CONFETTI)}
          {bits(12, "star", 300)}
        </div>
      );
    default:
      return null;
  }
}
