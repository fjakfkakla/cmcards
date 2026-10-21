"use client";

import Link from "next/link";
import Medal from "../Medal";
import { FamilyCoin } from "../ui";
import { useAccount } from "@/lib/account";
import { category } from "@/lib/data";
import { BADGES, earned, progressOf } from "@/lib/rewards";

/* L'album et les succès, vus depuis la page d'accueil : ce que le wallet connecté a
   déjà, et tout ce qui reste à gagner (éteint, avec ce qui manque). Sans wallet,
   tout est à gagner. */
export default function Quest() {
  const { me, wallet, signIn, busy } = useAccount();
  const p = progressOf(wallet ? me : null, wallet);
  const got = BADGES.filter((b) => earned(b, p)).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
      <div className="surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[26px] font-extrabold tracking-[-.03em]">The album</h3>
          <span className="num font-display text-[20px] font-extrabold">{p.families.reduce((a, f) => a + f.have.size, 0)}<span className="text-dim">/{p.families.reduce((a, f) => a + f.total, 0)}</span></span>
        </div>
        <ul className="mt-4 grid gap-3">
          {p.families.map((f) => {
            const c = category(f.id);
            return (
              <li key={f.id} className="flex items-center gap-3">
                <FamilyCoin id={f.id} size={38} />
                <span className="w-[86px] shrink-0 font-display text-[16px] font-extrabold">{c.name}</span>
                <span className="h-4 flex-1 overflow-hidden rounded-full border-2 border-fg bg-cream">
                  <span className="block h-full border-r-2 border-fg" style={{ width: `${(f.have.size / f.total) * 100}%`, background: c.bg, borderRightWidth: f.have.size ? 2 : 0 }} />
                </span>
                <span className="num w-[48px] text-right text-[15px] font-bold">{f.have.size}<span className="text-dim">/{f.total}</span></span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[26px] font-extrabold tracking-[-.03em]">Achievements</h3>
          <span className="num font-display text-[20px] font-extrabold">{got}<span className="text-dim">/{BADGES.length}</span></span>
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4">
          {BADGES.map((b) => {
            const ok = earned(b, p);
            return (
              <li key={b.id} className="flex flex-col items-center text-center">
                <Medal glyph={b.glyph} rar={b.rar} size={b.rar === "mythic" ? 62 : 52} locked={!ok} />
                <span className="mt-1.5 font-display text-[14.5px] leading-tight font-extrabold">{b.name}</span>
                {!ok && b.need > 1 && <span className="num text-[13px] font-bold text-muted">{Math.min(b.of(p), b.need)} / {b.need}</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          {wallet ? (
            <Link href="/collection" className="btn-ghost w-full">My collection</Link>
          ) : (
            <button className="btn-ghost w-full" onClick={signIn} disabled={busy}>{busy ? "Signing…" : "Connect my wallet"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
