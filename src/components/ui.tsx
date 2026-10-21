"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { Pastille } from "./Icon";
import { type CategoryId, type RarityId, category, rarity } from "@/lib/data";
import { useAccount } from "@/lib/account";

/* Les petites pièces partagées par la collection, le marché et le profil. */

export function RarityTag({ id }: { id: RarityId }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-white/[.06] px-2.5 text-[12.5px] font-semibold text-fg">
      <i className={`rar-${id} h-2.5 w-2.5 rounded-full`} />
      {rarity(id).name}
    </span>
  );
}

export function CategoryTag({ id }: { id: CategoryId }) {
  const c = category(id);
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold"
      style={{ background: `color-mix(in srgb, ${c.bg} 16%, transparent)`, color: `color-mix(in srgb, ${c.bg} 70%, #fff)` }}>
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true"><path d={c.glyph} /></svg>
      {c.name}
    </span>
  );
}

export function Filter({ on, onClick, count, children }: {
  on: boolean; onClick: () => void; count?: number; children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} disabled={count === 0 && !on}
      className={`chip h-9 transition-colors disabled:opacity-35 ${on ? "bg-white/[.12]! text-fg! shadow-[inset_0_0_0_1px_var(--color-line-2)]!" : "hover:text-fg"}`}>
      {children}
      {count !== undefined && <span className="num text-dim">{count}</span>}
    </button>
  );
}

export function Seg<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-white/[.04] p-1 shadow-[inset_0_0_0_1px_var(--color-line)]" role="tablist">
      {options.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={`h-9 rounded-full px-4 text-[14px] font-semibold transition-colors ${value === id ? "bg-white/[.1] text-fg" : "text-muted hover:text-fg"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className={`grid gap-px overflow-hidden rounded-[20px] bg-white/[.08] p-px shadow-[0_24px_48px_-32px_rgba(0,0,0,.8)] ${items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
      {items.map(([k, v]) => (
        <div key={k} className="bg-surface px-4 py-3.5">
          <div className="label">{k}</div>
          <div className="num mt-1 truncate font-display text-[24px] leading-tight font-bold tracking-[-.02em]">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div>
        <h1 className="font-display text-[42px] leading-none font-extrabold tracking-[-.035em] sm:text-[52px]">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-[15.5px] text-muted">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

/* Pas connecté : ce qu'on gagne à brancher son wallet, et le bouton. */
export function ConnectCard({ text }: { text: string }) {
  const { signIn, busy, error } = useAccount();
  return (
    <div className="surface mt-8 flex flex-col items-center px-6 py-12 text-center">
      <Pastille name="wallet" size={56} />
      <h2 className="mt-5 font-display text-[28px] font-extrabold tracking-[-.03em]">Connecte ton wallet</h2>
      <p className="mt-2 max-w-sm text-[15px] text-muted">{text}</p>
      <button className="btn-gold mt-6" onClick={signIn} disabled={busy}>
        <Icon name="wallet" size={17} /> {busy ? "Signature…" : "Connecter"}
      </button>
      {error && <p className="mt-3 text-[14px] font-semibold text-down">{error}</p>}
    </div>
  );
}

export function Empty({ icon, title, text, href, cta }: {
  icon: React.ComponentProps<typeof Pastille>["name"]; title: string; text: string; href: string; cta: string;
}) {
  return (
    <div className="surface mt-8 flex flex-col items-center px-6 py-12 text-center">
      <Pastille name={icon} size={56} />
      <h2 className="mt-5 font-display text-[26px] font-extrabold tracking-[-.03em]">{title}</h2>
      <p className="mt-2 max-w-sm text-[15px] text-muted">{text}</p>
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
        <button type="button" className="col-x" onClick={onClose} aria-label="Fermer"><Icon name="close" size={18} /></button>
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
  const txt = s < 60 ? "à l'instant" : s < 3600 ? `il y a ${Math.floor(s / 60)} min` : s < 86400 ? `il y a ${Math.floor(s / 3600)} h` : `il y a ${Math.floor(s / 86400)} j`;
  return <time dateTime={new Date(at).toISOString()}>{txt}</time>;
}
