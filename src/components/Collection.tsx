"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "./collection.css";
import "./opening.css"; // le dos de carte
import CollectCard from "./CollectCard";
import { type Owned, forget, useCollection } from "@/lib/collection";
import {
  CATEGORIES, COINS, RARITIES, TRADERS, type CategoryId, type RarityId,
  category, fmtAmount, fmtUsd, rank, rarity, serialOf, trader, usdOf,
} from "@/lib/data";

type Sort = "rarity" | "value" | "recent";
const SORTS: { id: Sort; label: string }[] = [
  { id: "rarity", label: "Plus rares" },
  { id: "value", label: "Plus chères" },
  { id: "recent", label: "Dernières" },
];
const ORDER: Record<Sort, (a: Owned, b: Owned) => number> = {
  rarity: (a, b) => rank(b.rarity) - rank(a.rarity) || usdOf(b) - usdOf(a),
  value: (a, b) => usdOf(b) - usdOf(a),
  recent: (a, b) => b.at - a.at,
};

/* Les catégories qui ont des personnages, dans l'ordre du catalogue ; les personnages
   de l'album rangés de même (les Legend en dernier). */
const CATS = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id));
const PEOPLE = [...TRADERS].sort((a, b) =>
  CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category));
const SLOTS = TRADERS.length * RARITIES.length;

/* La collection : les cartes tirées, lisibles (sous chaque carte ce qu'elle est et ce
   qu'elle contient), et l'album, où l'on voit ce qui manque. Une carte touchée
   s'ouvre en grand avec sa fiche. */
export default function Collection() {
  const all = useCollection();
  const [view, setView] = useState<"cards" | "album">("cards");
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [rar, setRar] = useState<RarityId | null>(null);
  const [sort, setSort] = useState<Sort>("rarity");
  const [open, setOpen] = useState<{ items: Owned[]; i: number } | null>(null);

  const owned = useMemo(() => all ?? [], [all]);
  const list = useMemo(
    () => owned
      .filter((c) => (!cat || trader(c.trader).category === cat) && (!rar || c.rarity === rar))
      .sort(ORDER[sort]),
    [owned, cat, rar, sort],
  );
  const value = owned.reduce((a, c) => a + usdOf(c), 0);
  const filled = new Set(owned.map((c) => `${c.trader}/${c.rarity}`)).size;
  const loading = all === null;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">Ma collection</h1>
          <p className="mt-2 text-lg font-extrabold text-ink-2">Chaque carte contient de vrais coins.</p>
        </div>
        <div className="grid w-full grid-cols-3 overflow-hidden rounded-2xl sticker bg-paper text-center sm:w-auto sm:min-w-[420px]">
          <Stat label="Cartes" value={loading ? "…" : String(owned.length)} />
          <Stat label="Valeur" value={loading ? "…" : fmtUsd(value)} big />
          <Stat label="Album" value={loading ? "…" : `${filled}/${SLOTS}`} />
        </div>
      </header>

      <div className="mt-8 inline-flex rounded-2xl sticker-sm bg-paper p-1" role="tablist">
        {([["cards", "Mes cartes"], ["album", "L'album"]] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-xl px-4 py-2 font-display text-xl tracking-wide transition-colors ${view === id ? "bg-ink text-cream" : "hover:bg-cream-2"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? null : view === "cards" ? (
        owned.length === 0 ? (
          <Empty onAlbum={() => setView("album")} />
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Filter on={!cat} onClick={() => setCat(null)}>Toutes</Filter>
                {CATS.map((c) => (
                  <Filter key={c.id} on={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} color={c.bg}
                    count={owned.filter((o) => trader(o.trader).category === c.id).length}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d={c.glyph} /></svg>
                    {c.name}
                  </Filter>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter on={!rar} onClick={() => setRar(null)}>Toutes raretés</Filter>
                {RARITIES.map((r) => (
                  <Filter key={r.id} on={rar === r.id} onClick={() => setRar(rar === r.id ? null : r.id)}
                    count={owned.filter((o) => o.rarity === r.id).length}>
                    <i className={`rar-${r.id} inline-block h-3 w-3 rounded-full border-2 border-ink`} />
                    {r.name}
                  </Filter>
                ))}
                <label className="ml-auto flex items-center gap-2 text-[15px] font-black">
                  Trier
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                    className="rounded-xl border-[2.5px] border-ink bg-paper px-2 py-1.5 font-black">
                    {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {list.length ? (
              <div className="col-grid mt-8">
                {list.map((c, i) => (
                  <button key={c.uid} type="button" className="col-tile" onClick={() => setOpen({ items: list, i })}
                    aria-label={`${trader(c.trader).name}, ${rarity(c.rarity).name}`}>
                    <CollectCard card={c} />
                    <Caption card={c} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-12 text-center">
                <p className="text-xl font-extrabold">Aucune carte avec ces filtres.</p>
                <button className="btn mt-4 bg-paper" onClick={() => { setCat(null); setRar(null); }}>Tout afficher</button>
              </div>
            )}
          </>
        )
      ) : (
        <Album owned={owned} onOpen={(items) => setOpen({ items, i: 0 })} />
      )}

      {!loading && owned.length > 0 && (
        <p className="mt-16 text-center text-[14px] font-extrabold text-ink-2">
          Démo : la collection est gardée dans ce navigateur.{" "}
          <button className="underline decoration-2 underline-offset-2 hover:text-tomato"
            onClick={() => { if (confirm("Vider la collection de la démo ?")) forget(); }}>
            La vider
          </button>
        </p>
      )}

      {open && <Sheet items={open.items} at={open.i} onMove={(i) => setOpen({ ...open, i })} onClose={() => setOpen(null)} />}
    </>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="border-ink px-3 py-3 [&:not(:last-child)]:border-r-[3px]">
      <div className="text-[13px] font-black uppercase tracking-wider text-ink-2">{label}</div>
      <div className={`font-display leading-tight ${big ? "text-3xl" : "text-2xl"}`}>{value}</div>
    </div>
  );
}

function Filter({ on, onClick, color, count, children }: {
  on: boolean; onClick: () => void; color?: string; count?: number; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={count === 0 && !on}
      className={`inline-flex items-center gap-1.5 rounded-full border-[2.5px] border-ink px-3 py-1 text-[14px] font-black transition-transform
        disabled:opacity-40 ${on ? "translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0_var(--ink)]" : "hover:bg-cream-2"}`}
      style={{ background: on ? color ?? "var(--color-sponge)" : undefined, color: on && color ? "#fff" : undefined }}
    >
      {children}
      {count !== undefined && <span className={on && color ? "opacity-90" : "text-ink-2"}>{count}</span>}
    </button>
  );
}

/* La rareté en toutes lettres, avec sa pastille : se lit à n'importe quelle taille. */
function RarityTag({ id }: { id: RarityId }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[12px] font-black uppercase tracking-wide">
      <i className={`rar-${id} inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-ink`} />
      {rarity(id).name}
    </span>
  );
}

/* Sous la carte, en grand : qui, quelle rareté, ce qu'elle contient, son numéro. */
function Caption({ card }: { card: Owned }) {
  return (
    <span className="mt-3 block text-left">
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 truncate font-display text-2xl leading-none">{trader(card.trader).name}</span>
        <RarityTag id={card.rarity} />
      </span>
      <span className="mt-1.5 block text-[15px] font-black leading-tight">
        {fmtAmount(card.amount)} {COINS[card.coin].ticker}
        <span className="text-ink-2"> · {fmtUsd(usdOf(card))}</span>
      </span>
      <span className="block text-[13px] font-extrabold text-ink-2">n° {serialOf(card)}</span>
    </span>
  );
}

function Empty({ onAlbum }: { onAlbum: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <div className="col-back"><div className="cb"><div className="cb-mark" /></div></div>
      <h2 className="mt-8 font-display text-4xl">Pas encore de carte</h2>
      <p className="mt-2 max-w-sm text-lg font-extrabold text-ink-2">
        Ouvre un booster : les cartes tirées arrivent ici, avec les coins qu&apos;elles contiennent.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn bg-tomato text-cream">Ouvrir un booster</Link>
        <button className="btn bg-paper" onClick={onAlbum}>Voir l&apos;album</button>
      </div>
    </div>
  );
}

/* L'album : pour chaque personnage, ses cinq raretés. Celles qu'on a se montrent
   (la meilleure, et combien), les autres restent en creux avec leur chance. */
function Album({ owned, onOpen }: { owned: Owned[]; onOpen: (items: Owned[]) => void }) {
  return (
    <div className="mt-8 flex flex-col gap-14">
      {PEOPLE.map((t) => {
        const cat = t.category ? category(t.category) : undefined;
        const mine = owned.filter((c) => c.trader === t.id);
        const have = new Set(mine.map((c) => c.rarity)).size;
        return (
          <section key={t.id}>
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="font-display text-4xl leading-none">{t.name}</h2>
              <span className="text-lg font-extrabold text-ink-2">{t.handle}</span>
              {cat && (
                <span className="inline-flex items-center gap-1.5 rounded-full border-[2.5px] border-ink px-2.5 py-0.5 text-[13px] font-black uppercase tracking-wide text-white"
                  style={{ background: cat.bg }}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d={cat.glyph} /></svg>
                  {cat.name}
                </span>
              )}
              <span className="ml-auto rounded-full border-[2.5px] border-ink bg-paper px-3 py-0.5 text-[15px] font-black">
                {have}/{RARITIES.length}
              </span>
            </div>
            <div className="col-album">
              {RARITIES.map((r) => {
                const got = mine.filter((c) => c.rarity === r.id).sort(ORDER.value);
                return (
                  <div key={r.id}>
                    {got.length ? (
                      <button type="button" className="col-tile relative" onClick={() => onOpen(got)}
                        aria-label={`${t.name}, ${r.name}, ${got.length} exemplaire${got.length > 1 ? "s" : ""}`}>
                        <CollectCard card={got[0]} />
                        {got.length > 1 && <span className="col-count">×{got.length}</span>}
                      </button>
                    ) : (
                      <div className="col-slot" aria-label={`${t.name}, ${r.name} : pas encore`}>
                        <span className="col-slot-q">?</span>
                        <span className="col-slot-odds">{r.odds.toLocaleString("fr-FR")} %</span>
                      </div>
                    )}
                    <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[15px] font-black">
                      <i className={`rar-${r.id} inline-block h-3 w-3 rounded-full border-2 border-ink`} />
                      {r.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* La fiche : la carte en grand (elle suit le doigt), et tout ce qu'elle est, écrit
   en clair. Les flèches passent d'une carte à l'autre, Échap ferme. */
function Sheet({ items, at, onMove, onClose }: {
  items: Owned[]; at: number; onMove: (i: number) => void; onClose: () => void;
}) {
  const c = items[at];
  const t = trader(c.trader);
  const cat = t.category ? category(t.category) : undefined;
  const r = rarity(c.rarity);
  const coin = COINS[c.coin];
  const many = items.length > 1;
  const prev = () => onMove((at - 1 + items.length) % items.length);
  const next = () => onMove((at + 1) % items.length);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (many && e.key === "ArrowLeft") prev();
      else if (many && e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = was; };
  }, []);

  const rows: [string, React.ReactNode][] = [
    ["Contenu", `${c.amount.toLocaleString("fr-FR")} ${coin.ticker} (${coin.name})`],
    ["Valeur aujourd'hui", <span key="usd" className="font-display text-3xl">{fmtUsd(usdOf(c))}</span>],
    ["Cours", `1 ${coin.ticker} = ${coin.price.toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} $`],
    ["Numéro", `${serialOf(c)}${r.supply === 1 ? " · exemplaire unique" : ""}`],
    ["Chance de tirage", `${r.odds.toLocaleString("fr-FR")} % par carte`],
    ["Booster", category(c.pack).name],
    ["Tirée le", new Date(c.at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })],
  ];

  return (
    <div className="col-sheet" role="dialog" aria-modal="true" aria-label={`${t.name}, ${r.name}`} onClick={onClose}>
      <div className="col-sheet-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="col-x" onClick={onClose} aria-label="Fermer">×</button>
        <div className="col-sheet-card">
          <CollectCard card={c} live key={c.uid} />
          {many && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button type="button" className="btn bg-paper px-4 py-1.5" onClick={prev} aria-label="Carte précédente">←</button>
              <span className="min-w-[64px] text-center text-[15px] font-black">{at + 1} / {items.length}</span>
              <button type="button" className="btn bg-paper px-4 py-1.5" onClick={next} aria-label="Carte suivante">→</button>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {cat && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-[2.5px] border-ink px-2.5 py-0.5 text-[13px] font-black uppercase tracking-wide text-white"
                style={{ background: cat.bg }}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d={cat.glyph} /></svg>
                {cat.name}
              </span>
            )}
            <RarityTag id={c.rarity} />
          </div>
          <h2 className="mt-3 font-display text-5xl leading-none sm:text-6xl">{t.name}</h2>
          <p className="mt-1 text-lg font-extrabold text-ink-2">{t.handle}{cat && ` · ${cat.tagline}`}</p>
          <dl className="mt-6 divide-y-2 divide-ink/15 border-y-[3px] border-ink">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-[13px] font-black uppercase tracking-wider text-ink-2">{k}</dt>
                <dd className="text-right text-[17px] font-black">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
