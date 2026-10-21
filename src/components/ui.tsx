"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Medal from "./Medal";
import { type CategoryId, type RarityId, category, rarity } from "@/lib/data";
import { useAccount } from "@/lib/account";

/* Les petites pièces partagées par la landing, la collection, le marché et le profil,
   dans la grammaire des autocollants : un contour d'encre, une ombre dure. */

/* La plaque d'une rareté : son aplat (l'échelle du butin) et son nom. */
const RAR_INK: Record<RarityId, string> = { common: "#273046", rare: "#053b2b", shiny: "#ffffff", og: "#4d2c00", mythic: "#2440a8" };
export function RarityTag({ id, size = "md" }: { id: RarityId; size?: "sm" | "md" }) {
  return (
    <span className={`rar-${id} inline-flex shrink-0 items-center rounded-full border-2 border-fg font-display font-extrabold whitespace-nowrap ${size === "sm" ? "h-6 px-2.5 text-[12.5px]" : "h-7 px-3 text-[13.5px]"}`}
      style={{ color: RAR_INK[id] }}>
      {rarity(id).name}
    </span>
  );
}

/* La pièce d'une famille : un disque plein à sa couleur, son symbole en blanc,
   cerclé d'encre, posé sur son ombre. */
export function FamilyCoin({ id, size = 40, className = "" }: { id: CategoryId; size?: number; className?: string }) {
  const c = category(id);
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full ${className}`}
      style={{
        width: size, height: size,
        background: `radial-gradient(120% 85% at 28% 14%, rgba(255,255,255,.55), transparent 55%), ${c.bg}`,
        border: `${size > 44 ? 3 : 2}px solid #1e1a16`, boxShadow: `0 ${size > 44 ? 4 : 3}px 0 #1e1a16`,
      }}>
      <svg viewBox="0 0 24 24" width={size * .52} height={size * .52} fill="#fff" aria-hidden="true"
        style={{ filter: "drop-shadow(0 1px 0 rgba(30,26,22,.45))" }}><path d={c.glyph} /></svg>
    </span>
  );
}

export function CategoryTag({ id }: { id: CategoryId }) {
  const c = category(id);
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border-2 border-fg pr-3 pl-1 font-display text-[13.5px] font-extrabold"
      style={{ background: c.ink }}>
      <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: c.bg }}>
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden="true"><path d={c.glyph} /></svg>
      </span>
      {c.name}
    </span>
  );
}

/* Un filtre : une pilule blanche à contour ; choisi, il passe à l'encre. */
export function Filter({ on, onClick, count, children }: {
  on: boolean; onClick: () => void; count?: number; children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} disabled={count === 0 && !on}
      className={`chip h-10 cursor-pointer transition-[transform,background-color] hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0 ${on ? "bg-fg! text-cream!" : ""}`}>
      {children}
      {count !== undefined && <span className={`num ${on ? "text-cream/70" : "text-dim"}`}>{count}</span>}
    </button>
  );
}

/* Le rail à pilules : la choisie prend la plaque éponge. */
export function Seg<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border-[2.5px] border-fg bg-white p-1 shadow-[0_4px_0_#1e1a16]" role="tablist">
      {options.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={`h-10 rounded-full px-4 font-display text-[15px] font-extrabold transition-colors ${value === id ? "border-2 border-fg bg-gold text-fg" : "text-muted hover:text-fg"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* Les chiffres d'un écran : des tuiles blanches, le nom puis le chiffre. */
export function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className={`grid gap-3 ${items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
      {items.map(([k, v]) => (
        <div key={k} className="surface rounded-[18px] px-4 py-3 shadow-[0_4px_0_#1e1a16]">
          <div className="label">{k}</div>
          <div className="num mt-0.5 truncate font-display text-[24px] leading-tight font-extrabold tracking-[-.02em]">{v}</div>
        </div>
      ))}
    </div>
  );
}

/* La tête d'un écran : son titre, et à droite ce qui s'y rapporte. Rien dessous. */
export function PageHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <h1 className="font-display text-[44px] leading-none font-extrabold tracking-[-.04em] sm:text-[56px]">{title}</h1>
      {children}
    </header>
  );
}

/* Pas connecté : une ligne, le bouton. */
export function ConnectCard() {
  const { signIn, busy, error } = useAccount();
  return (
    <div className="surface mt-8 flex flex-col items-center px-6 py-14 text-center">
      <Medal glyph="cards" rar="og" size={64} />
      <h2 className="mt-4 font-display text-[28px] font-extrabold tracking-[-.03em]">Connect your wallet</h2>
      <button className="btn-gold mt-6" onClick={signIn} disabled={busy}>
        <Icon name="wallet" size={18} /> {busy ? "Signing…" : "Connect"}
      </button>
      {error && <p className="mt-3 text-[14px] font-semibold text-down">{error}</p>}
    </div>
  );
}

/* Un état vide : un mot, et le bouton qui en sort. */
export function Empty({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="surface mt-8 flex flex-col items-center px-6 py-14 text-center">
      <h2 className="font-display text-[26px] font-extrabold tracking-[-.03em]">{title}</h2>
      <Link href={href} className="btn-gold mt-6">{cta}</Link>
    </div>
  );
}

/* Une fenêtre par-dessus la page : Échap ou un clic dehors la ferme. */
export function Modal({ onClose, label, children }: {
  onClose: () => void; label: string; children: React.ReactNode;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = was; };
  }, [onClose]);
  return (
    <div className="col-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="col-sheet-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="col-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        {children}
      </div>
    </div>
  );
}

/* « il y a 3 min » */
export function Ago({ at }: { at: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const s = Math.max(0, (now - at) / 1000);
  const txt = s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`;
  return <time dateTime={new Date(at).toISOString()}>{txt}</time>;
}
