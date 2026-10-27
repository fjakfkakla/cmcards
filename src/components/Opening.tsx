"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./opening.css";
import BoosterPack from "./BoosterPack";
import CollectCard from "./CollectCard";
import Icon from "./Icon";
import Medal from "./Medal";
import { RarityTag } from "./ui";
import { oddsOf } from "./landing/PackPicker";
import { api, useAccount } from "@/lib/account";
import { type Pack, RARITIES, type RarityId, category, fmtSol, rank, rarity, serialOf, trader } from "@/lib/data";
import { MEMO, explorer, toLamports } from "@/lib/solana";
import type { Owned } from "@/lib/types";

/* La lumière d'une rareté : celle qui sort du booster, le cercle de la meilleure carte. */
export const GLOW: Record<RarityId, string> = { common: "#c3ccda", rare: "#3fdcb0", shiny: "#2e63f2", og: "#f6b51f", mythic: "#9fb6f5" };

/* L'ouverture, la recette du tirage des persos de memescanner :
   1. payer (le serveur lit le paiement sur la chaîne, puis tire les cartes) ;
   2. couper le booster le long de sa ligne ;
   3. la bande des raretés défile sous un repère, ralentit et s'arrête sur la
      meilleure rareté du tirage (celle que le serveur a tirée, jamais une autre) ;
   4. les dos des cartes se retournent un à un, toutes les 420 ms ; « Passer »
      retourne tout ce qui reste ;
   5. la ligne du bas dit ce qu'on a eu, la meilleure carte est cerclée de sa
      couleur ; une carte touchée s'ouvre en grand. Aucun confetti. */
type Phase = "pay" | "sealed" | "torn" | "spin" | "reveal";
type Step = "idle" | "sign" | "draw";
const PENDING = "cmcards:pending"; // un paiement fait dont on n'a pas encore les cartes
const STRIP = 34, LAND = 29, TILE = 132; // la bande : ses plaques, celle où elle s'arrête, leur pas

export default function Opening({ pack }: { pack: Pack }) {
  const { cfg, ready, wallet, balance, busy, signIn, pay, refresh } = useAccount();
  const [cards, setCards] = useState<Owned[] | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pay");
  const [slit, setSlit] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [shown, setShown] = useState(0);             // cartes retournées
  const [zoom, setZoom] = useState<Owned | null>(null);
  const drag = useRef<{ x: number; w: number; moved: boolean } | null>(null);
  const cat = category(pack.pool);

  const best = cards ? cards.reduce<RarityId>((b, c) => (rank(c.rarity) > rank(b) ? c.rarity : b), "common") : "common";
  const bestUid = cards?.find((c) => c.rarity === best)?.uid;
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
      setShown(0);
      setPhase("sealed");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The draw failed.");
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
      // gardé dès l'envoi : l'onglet fermé avant la confirmation, les cartes restent à réclamer
      sig = await pay([{ to: cfg.treasury, lamports: price }], MEMO.pack(pack.id), (s) => {
        try { localStorage.setItem(PENDING, JSON.stringify({ sig: s, pack: pack.id, wallet })); } catch {}
      });
    } catch (e) {
      setStep("idle");
      setError(e instanceof Error ? e.message : "Payment cancelled.");
      return;
    }
    try { localStorage.setItem(PENDING, JSON.stringify({ sig, pack: pack.id, wallet })); } catch {}
    setPending(sig);
    await claim(sig);
  }

  /* couper : le booster tremble, le haut s'envole, puis la bande des raretés */
  function tear() {
    if (phase !== "sealed") return;
    setSlit(1);
    setShaking(true);
    setTimeout(() => { setShaking(false); setPhase("torn"); }, 1050);
    setTimeout(() => setPhase("spin"), 1900);
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
  function up() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) tear();          // un simple clic ouvre aussi
    else if (slit < 0.7) setSlit(0);
    else tear();
  }

  /* les cartes se retournent une à une */
  useEffect(() => {
    if (phase !== "reveal" || !cards || shown >= cards.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : 420);
    return () => clearTimeout(t);
  }, [phase, shown, cards]);

  function again() {
    setCards(null); setPhase("pay"); setSlit(0); setShown(0); setZoom(null);
  }

  const done = !!cards && phase === "reveal" && shown >= cards.length;

  return (
    <div className="op" style={{ "--c": cat.bg, "--glow": GLOW[best] } as React.CSSProperties}>
      {phase === "pay" && (
        <div className="op-buy">
          <div className="op-plank">
            <div className="op-rays" />
            <div className="op-buy-pack"><BoosterPack pack={pack} floating /></div>
          </div>
          <div className="surface p-6 sm:p-7">
            <h1 className="font-display text-[40px] leading-none font-extrabold tracking-[-.04em]">Booster {pack.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="plate"><b className="num">{pack.cards}</b> cards</span>
              {pack.guarantee && <span className="plate"><RarityTag id={pack.guarantee} size="sm" /> guaranteed</span>}
            </div>
            <ul className="mt-5 grid gap-1.5">
              {oddsOf(pack).map(({ r, pct }) => (
                <li key={r.id} className="flex items-center gap-3">
                  <Medal rar={r.id} size={40} />
                  <span className="flex-1 font-display text-[16px] font-extrabold">{r.name}</span>
                  <span className="num text-[15px] font-bold">{pct.toLocaleString("en-US", { maximumFractionDigits: pct < 1 ? 2 : 1 })}%</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {!ready ? (
                <span className="btn-ghost btn-lg w-full animate-pulse">…</span>
              ) : !cfg.treasury ? (
                <span className="btn-ghost btn-lg w-full cursor-not-allowed">Payments open soon</span>
              ) : !wallet ? (
                <button className="btn-gold btn-lg w-full" onClick={signIn} disabled={busy}>
                  <Icon name="wallet" size={19} /> {busy ? "Signing…" : "Connect my wallet"}
                </button>
              ) : pending ? (
                <button className="btn-gold btn-lg w-full" onClick={() => claim(pending)} disabled={step !== "idle"}>
                  {step === "draw" ? "Drawing…" : "Claim my cards"}
                </button>
              ) : (
                <button className="btn-gold btn-lg w-full" onClick={buy} disabled={step !== "idle" || short}>
                  {step === "sign" ? "Confirm in your wallet…" : step === "draw" ? "Drawing…" : `Pay ${fmtSol(pack.price)}`}
                </button>
              )}
              {short && !pending && <p className="mt-3 text-center text-[14.5px] font-bold text-down">Insufficient balance</p>}
              {error && <p className="mt-3 text-center text-[14.5px] font-bold text-down">{error}</p>}
              {pending && (
                <a href={explorer(pending, cfg.cluster)} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-muted hover:text-fg">
                  View payment <Icon name="out" size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {(phase === "sealed" || phase === "torn") && (
        <div className="op-center">
          <div className="op-plank op-plank-full"><div className="op-rays" /></div>
          <div className="op-pack" onPointerDown={down} onPointerMove={move} onPointerUp={up}
            onPointerCancel={() => { drag.current = null; setSlit(0); }}>
            <BoosterPack pack={pack} torn={phase === "torn"} shaking={shaking} floating={phase === "sealed" && !shaking} slit={slit} glow={GLOW[best]} />
          </div>
          <p className="op-hint" style={{ visibility: phase === "sealed" ? "visible" : "hidden" }}>Swipe along the line</p>
        </div>
      )}

      {phase === "spin" && <Spin target={best} onDone={() => setPhase("reveal")} />}

      {phase === "reveal" && cards && (
        <div className="op-reveal">
          <div className={`op-row n${cards.length}`}>
            {cards.map((c, k) => {
              const up_ = k < shown;
              const isBest = done && c.uid === bestUid && best !== "common";
              return (
                <button key={c.uid} type="button" className={`op-card ${up_ ? "is-up" : ""} ${isBest ? "is-best" : ""}`}
                  style={{ "--glow": GLOW[c.rarity], animationDelay: `${k * 70}ms` } as React.CSSProperties}
                  onClick={() => up_ && setZoom(c)} disabled={!up_} aria-label={up_ ? `${trader(c.trader).name}, ${rarity(c.rarity).name}` : "Hidden card"}>
                  <span className="op-flip">
                    <span className="op-face"><Back /></span>
                    <span className="op-face op-front"><CollectCard card={c} /></span>
                  </span>
                  {up_ && <span className="op-tag"><RarityTag id={c.rarity} size="sm" /></span>}
                </button>
              );
            })}
          </div>

          {!done ? (
            <div className="mt-10 flex items-center gap-4">
              <span className="num font-display text-[22px] font-extrabold">{shown} / {cards.length}</span>
              <button className="btn-ghost btn-sm" onClick={() => setShown(cards.length)}>Skip</button>
            </div>
          ) : (
            <div className="op-done">
              <p className="font-display text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-extrabold tracking-[-.03em]">{summary(cards)}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button className="btn-gold btn-lg" onClick={again}>Another {pack.name}</button>
                <Link className="btn-ghost btn-lg" href="/collection">My collection</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {zoom && (
        <div className="op-zoom" role="dialog" aria-modal="true" aria-label={trader(zoom.trader).name} onClick={() => setZoom(null)}>
          <div className="op-zoom-card" onClick={(e) => e.stopPropagation()}>
            <CollectCard card={zoom} live />
          </div>
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <span className="font-display text-[32px] leading-none font-extrabold tracking-[-.03em] text-white [paint-order:stroke_fill] [-webkit-text-stroke:6px_#1e1a16]">{trader(zoom.trader).name}</span>
            <span className="flex items-center gap-2"><RarityTag id={zoom.rarity} /><span className="num rounded-full border-2 border-fg bg-white px-3 py-0.5 text-[14px] font-bold">#{serialOf(zoom)}</span></span>
            <button className="btn-ghost btn-sm mt-3" onClick={() => setZoom(null)}>Back to the draw</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* « 5 cartes · 1 Shiny · 2 Rares · 2 Communs », de la plus rare à la plus commune */
function summary(cards: Owned[]) {
  const parts = [...RARITIES].reverse()
    .map((r) => [r, cards.filter((c) => c.rarity === r.id).length] as const)
    .filter(([, n]) => n)
    .map(([r, n]) => `${n} ${r.name}`);
  return [`${cards.length} cards`, ...parts].join(" · ");
}

/* Le dos d'une carte : le jaune éponge, ses rayons, la tuile du logo au centre. */
export function Back() {
  return (
    <span className="cb">
      <span className="cb-rays" />
      <svg className="cb-mark" viewBox="0 0 100 100" aria-hidden="true">
        <rect x="6" y="10" width="88" height="88" rx="24" fill="#1e1a16" />
        <rect x="6" y="4" width="88" height="88" rx="24" fill="#fff4dc" stroke="#1e1a16" strokeWidth="6" />
        <path fill="#1e1a16" fillRule="evenodd" transform="translate(16 10) scale(.68)"
          d="M34 11H66Q78 11 78 23V77Q78 89 66 89H34Q22 89 22 77V23Q22 11 34 11ZM50 33C40.6 33 33 40.6 33 50C33 59.4 40.6 67 50 67C59.4 67 67 59.4 67 50C67 40.6 59.4 33 50 33ZM50 42C54.4 42 58 45.6 58 50C58 54.4 54.4 58 50 58C45.6 58 42 54.4 42 50C42 45.6 45.6 42 50 42Z" />
      </svg>
    </span>
  );
}

/* La bande des raretés : des plaques tirées dans les vraies proportions, qui
   défilent sous le repère puis s'arrêtent sur `target`, la meilleure du tirage. */
function Spin({ target, onDone }: { target: RarityId; onDone: () => void }) {
  const [strip] = useState<RarityId[]>(() => Array.from({ length: STRIP }, (_, k) => {
    if (k === LAND) return target;
    const x = Math.random() * 100;
    // un peu plus de rares qu'en vrai : la bande doit passer devant chaque marche
    return x < 40 ? "common" : x < 66 ? "rare" : x < 84 ? "shiny" : x < 95 ? "og" : "mythic";
  }));
  const [go, setGo] = useState(false);
  const [landed, setLanded] = useState(false);
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; });

  useEffect(() => {
    if (still) { const t = setTimeout(() => finish.current(), 900); return () => clearTimeout(t); }
    const a = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    const b = setTimeout(() => setLanded(true), 3000);
    const c = setTimeout(() => finish.current(), 4300);
    return () => { cancelAnimationFrame(a); clearTimeout(b); clearTimeout(c); };
  }, [still]);

  return (
    <div className="op-center">
      <div className="op-spin" style={{ "--glow": GLOW[target] } as React.CSSProperties}>
        <div className="op-spin-mark" />
        <div className="op-strip" style={{ transform: `translateX(-${(go || still ? LAND : 2) * TILE + TILE / 2}px)`, transition: go ? "transform 2.9s cubic-bezier(.08,.72,.16,1)" : "none" }}>
          {strip.map((r, k) => (
            <div key={k} className={`op-tile ${landed && k === LAND ? "is-landed" : ""}`}>
              <Medal rar={r} size={r === "mythic" ? 92 : 76} />
              <span>{rarity(r).name}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="op-hint" style={{ visibility: landed ? "visible" : "hidden" }}>
        <span className="font-display text-[34px] font-extrabold tracking-[-.03em] text-fg">{rarity(target).name}</span>
      </p>
    </div>
  );
}
