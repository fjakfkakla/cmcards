"use client";

import { useEffect, useMemo, useState } from "react";
import "./collection.css";
import CollectCard from "./CollectCard";
import Icon from "./Icon";
import Sell from "./Sell";
import Quest from "./landing/Quest";
import { CategoryTag, ConnectCard, Empty, FamilyCoin, Filter, Modal, PageHead, RarityTag, Seg, Stats } from "./ui";
import { useAccount } from "@/lib/account";
import {
  CATEGORIES, RARITIES, TRADERS, type CategoryId, type RarityId,
  category, fmtSol, rank, rarity, serialOf, trader,
} from "@/lib/data";
import { toSol } from "@/lib/solana";
import type { Listing, Owned } from "@/lib/types";

type Sort = "rarity" | "recent" | "serial";
const ORDER: Record<Sort, (a: Owned, b: Owned) => number> = {
  rarity: (a, b) => rank(b.rarity) - rank(a.rarity) || a.serial - b.serial,
  recent: (a, b) => b.at - a.at,
  serial: (a, b) => a.serial - b.serial,
};

/* Les catégories qui ont des personnages, dans l'ordre du catalogue ; les personnages
   de l'album rangés de même (les Legend en dernier). */
const CATS = CATEGORIES.filter((c) => TRADERS.some((t) => t.category === c.id));
const PEOPLE = [...TRADERS].sort((a, b) =>
  CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category));
const SLOTS = TRADERS.length * RARITIES.length;

/* La collection : les cartes du wallet connecté, lisibles (sous chaque carte qui,
   quelle rareté, son numéro, son prix si elle est en vente), et l'album, où l'on
   voit ce qui manque. Une carte touchée s'ouvre avec sa fiche et la vente. */
export default function Collection() {
  const { me, wallet } = useAccount();
  const [view, setView] = useState<"cards" | "album" | "quest">("cards");
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [rar, setRar] = useState<RarityId | null>(null);
  const [sort, setSort] = useState<Sort>("rarity");
  const [open, setOpen] = useState<{ uids: string[]; i: number } | null>(null);

  const owned = useMemo(() => me?.cards ?? [], [me]);
  const listed = useMemo(() => new Map((me?.listings ?? []).map((l) => [l.uid, l])), [me]);
  const list = useMemo(
    () => owned
      .filter((c) => (!cat || trader(c.trader).category === cat) && (!rar || c.rarity === rar))
      .sort(ORDER[sort]),
    [owned, cat, rar, sort],
  );
  const filled = new Set(owned.map((c) => `${c.trader}/${c.rarity}`)).size;
  const loading = me === null;
  // la fiche suit les cartes par leur uid : une vente ou un retrait ne la ferme pas
  const sheet = open ? open.uids.map((u) => owned.find((c) => c.uid === u)).filter((c): c is Owned => !!c) : [];

  return (
    <>
      <PageHead title="Collection">
        {wallet && (
          <div className="w-full sm:w-auto sm:min-w-[420px]">
            <Stats items={[
              ["Cards", String(owned.length)],
              ["For sale", String(listed.size)],
              ["Album", `${filled}/${SLOTS}`],
            ]} />
          </div>
        )}
      </PageHead>

      <div className="mt-8">
        <Seg value={view} onChange={setView} options={[["cards", "My cards"], ["album", "The album"], ["quest", "Achievements"]]} />
      </div>

      {loading ? <Skeleton /> : view === "quest" ? (
        <div className="mt-8"><Quest /></div>
      ) : view === "cards" ? (
        !wallet ? (
          <ConnectCard />
        ) : owned.length === 0 ? (
          <Empty title="No cards yet" href="/boosters" cta="Open a booster" />
        ) : (
          <>
            <p className="mt-6 text-[15px] font-semibold text-muted">Tap a card to set your price and sell it on the market.</p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Filter on={!cat} onClick={() => setCat(null)}>All</Filter>
                {CATS.map((c) => (
                  <Filter key={c.id} on={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
                    count={owned.filter((o) => trader(o.trader).category === c.id).length}>
                    <FamilyCoin id={c.id} size={24} className="-ml-2" />
                    {c.name}
                  </Filter>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter on={!rar} onClick={() => setRar(null)}>All rarities</Filter>
                {RARITIES.map((r) => (
                  <Filter key={r.id} on={rar === r.id} onClick={() => setRar(rar === r.id ? null : r.id)}
                    count={owned.filter((o) => o.rarity === r.id).length}>
                    <i className={`rar-${r.id} -ml-1 h-4 w-4 rounded-full border-2 border-fg`} />
                    {r.name}
                  </Filter>
                ))}
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort"
                  className="chip ml-auto h-10 cursor-pointer appearance-none pr-4 font-display font-extrabold outline-none">
                  <option value="rarity">Rarest</option>
                  <option value="recent">Newest</option>
                  <option value="serial">Lowest numbers</option>
                </select>
              </div>
            </div>

            {list.length ? (
              <div className="col-grid mt-8">
                {list.map((c, i) => (
                  <button key={c.uid} type="button" className="col-tile" onClick={() => setOpen({ uids: list.map((x) => x.uid), i })}
                    aria-label={`${trader(c.trader).name}, ${rarity(c.rarity).name}`}>
                    <CollectCard card={c} />
                    <Caption card={c} listing={listed.get(c.uid)} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-12 text-center">
                <p className="font-display text-[22px] font-extrabold">Nothing matches these filters</p>
                <button className="btn-ghost btn-sm mt-4" onClick={() => { setCat(null); setRar(null); }}>Show all</button>
              </div>
            )}
          </>
        )
      ) : (
        <Album owned={owned} onOpen={(items) => setOpen({ uids: items.map((c) => c.uid), i: 0 })} />
      )}

      {open && sheet.length > 0 && (
        <Sheet items={sheet} at={Math.min(open.i, sheet.length - 1)} listed={listed}
          onMove={(i) => setOpen({ ...open, i })} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="col-grid mt-8">
      {Array.from({ length: 4 }, (_, k) => <div key={k} className="aspect-[63/88] animate-pulse rounded-[14px] bg-raised" />)}
    </div>
  );
}

/* Sous la carte : qui, quelle rareté, son numéro, son prix si elle est en vente. */
function Caption({ card, listing }: { card: Owned; listing?: Listing }) {
  return (
    <span className="mt-3 block text-left">
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-display text-[20px] leading-tight font-extrabold tracking-[-.02em]">{trader(card.trader).name}</span>
        <RarityTag id={card.rarity} size="sm" />
      </span>
      <span className="mt-1 flex items-center justify-between gap-2 text-[13.5px]">
        <span className="num font-semibold text-muted">#{serialOf(card)}</span>
        {listing && <span className="num rounded-full border-2 border-fg bg-gold px-2 font-display text-[14px] font-extrabold">{fmtSol(toSol(listing.lamports))}</span>}
      </span>
    </span>
  );
}

/* L'album : pour chaque personnage, ses cinq raretés. Celles qu'on a se montrent
   (la meilleure, et combien), les autres restent en creux avec leur chance. */
function Album({ owned, onOpen }: { owned: Owned[]; onOpen: (items: Owned[]) => void }) {
  return (
    <div className="mt-8 flex flex-col gap-12">
      {PEOPLE.map((t) => {
        const mine = owned.filter((c) => c.trader === t.id);
        const have = new Set(mine.map((c) => c.rarity)).size;
        return (
          <section key={t.id}>
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="font-display text-[32px] leading-none font-extrabold tracking-[-.035em]">{t.name}</h2>
              {t.category && <CategoryTag id={t.category} />}
              <span className="num ml-auto chip h-9 font-display font-extrabold">{have}/{RARITIES.length}</span>
            </div>
            <div className="col-album">
              {RARITIES.map((r) => {
                const got = mine.filter((c) => c.rarity === r.id).sort(ORDER.serial);
                return (
                  <div key={r.id}>
                    {got.length ? (
                      <button type="button" className="col-tile relative" onClick={() => onOpen(got)}
                        aria-label={`${t.name}, ${r.name}, ${got.length} ${got.length > 1 ? "copies" : "copy"}`}>
                        <CollectCard card={got[0]} />
                        {got.length > 1 && <span className="col-count">×{got.length}</span>}
                      </button>
                    ) : (
                      <div className="col-slot" aria-label={`${t.name}, ${r.name}: not yet`}>
                        <span className="col-slot-q">?</span>
                        <span className="col-slot-odds">{r.odds.toLocaleString("en-US")}%</span>
                      </div>
                    )}
                    <p className="mt-2.5 flex justify-center"><RarityTag id={r.id} size="sm" /></p>
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

/* La fiche : la carte en grand (elle suit le doigt), ce qu'elle est, et sa vente.
   Les flèches passent d'une carte à l'autre, Échap ferme. */
function Sheet({ items, at, listed, onMove, onClose }: {
  items: Owned[]; at: number; listed: Map<string, Listing>; onMove: (i: number) => void; onClose: () => void;
}) {
  const c = items[at];
  const t = trader(c.trader);
  const r = rarity(c.rarity);
  const many = items.length > 1;
  const prev = () => onMove((at - 1 + items.length) % items.length);
  const next = () => onMove((at + 1) % items.length);

  useEffect(() => {
    if (!many) return;
    function key(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const rows: [string, React.ReactNode][] = [
    ["Number", `${serialOf(c)}${r.supply === 1 ? " · one of a kind" : ""}`],
    ["Supply", r.supply === 1 ? "1 in the world" : `${r.supply.toLocaleString("en-US")} copies at most`],
    ["Pull odds", `${r.odds.toLocaleString("en-US")}% per card`],
    ["Booster", category(c.pack).name],
    ["Obtained on", new Date(c.at).toLocaleDateString("en-US", { dateStyle: "long" })],
  ];

  return (
    <Modal onClose={onClose} label={`${t.name}, ${r.name}`}>
      <div className="col-sheet-card">
        <CollectCard card={c} live key={c.uid} />
        {many && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <button type="button" className="btn-ghost btn-sm w-12 px-0" onClick={prev} aria-label="Previous card"><Icon name="back" size={18} /></button>
            <span className="num min-w-[64px] text-center font-display text-[17px] font-extrabold">{at + 1} / {items.length}</span>
            <button type="button" className="btn-ghost btn-sm w-12 px-0" onClick={next} aria-label="Next card"><Icon name="arrow" size={18} /></button>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {t.category && <CategoryTag id={t.category} />}
          <RarityTag id={c.rarity} />
        </div>
        <h2 className="mt-3 font-display text-[46px] leading-none font-extrabold tracking-[-.04em] sm:text-[54px]">{t.name}</h2>
        <dl className="mt-5 divide-y-2 divide-fg/10">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="label shrink-0">{k}</dt>
              <dd className="num text-right font-display text-[16px] font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
        <Sell key={c.uid} card={c} listing={listed.get(c.uid)} />
      </div>
    </Modal>
  );
}
