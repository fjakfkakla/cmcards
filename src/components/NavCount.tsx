"use client";

import { useCollection } from "@/lib/collection";

/* Le nombre de cartes de la collection, à côté de son onglet. */
export default function NavCount() {
  const n = useCollection()?.length ?? 0;
  if (!n) return null;
  return (
    <span className="min-w-[22px] rounded-full border-2 border-ink bg-sponge px-1.5 text-center text-[12px] leading-[18px] text-ink">
      {n > 999 ? "999+" : n}
    </span>
  );
}
