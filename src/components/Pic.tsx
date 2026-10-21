"use client";

import { useCallback, useState } from "react";

/* Une image avec ses remplaçantes : à la première erreur, la suivante. `fallback`
   est la dernière (un data: URI), elle ne casse jamais. */
export default function Pic({
  srcs,
  fallback,
  ...rest
}: { srcs: string[]; fallback: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const list = [...srcs, fallback];
  const key = list.join("|");
  const [at, setAt] = useState({ key, i: 0 });
  if (at.key !== key) setAt({ key, i: 0 }); // une autre carte : on repart de la première
  const i = at.key === key ? at.i : 0;

  const next = useCallback(
    () => setAt((s) => (s.key === key ? { key, i: Math.min(s.i + 1, list.length - 1) } : s)),
    [key, list.length],
  );

  /* L'image a pu échouer avant l'hydratation, sans que onError ne le voie. */
  const check = useCallback(
    (el: HTMLImageElement | null) => {
      if (el && el.complete && el.naturalWidth === 0) next();
    },
    [next],
  );

  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...rest} ref={check} src={list[i]} onError={next} />;
}
