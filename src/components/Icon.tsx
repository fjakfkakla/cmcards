/* Les icônes de cm cards. Pour nommer une chose : une silhouette pleine, ses détails
   découpés (evenodd), posée dans une pastille. Pour un geste (fermer, flèche,
   copier) : un trait de 2. Jamais d'emoji. Grille de 24. */

const FILLED = {
  home: "M12 2.4 2.5 10v10.6c0 .8.6 1.4 1.4 1.4h5.4v-6.4h5.4V22h5.4c.8 0 1.4-.6 1.4-1.4V10z",
  pack: "M5.2 1.8h13.6l-.9 1.6.9 1.6v14l.9 1.6-.9 1.6H5.2l-.9-1.6.9-1.6V5l-.9-1.6zM7.2 7.4v1.6h9.6V7.4zm4.8 3.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z",
  market: "M3 3.2h8.4L21 12.8 12.8 21 3.2 11.4zm4.6 2.4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  cards: "M8.6 1.8h10.2c1.2 0 2.2 1 2.2 2.2v12.8c0 1.2-1 2.2-2.2 2.2H8.6c-1.2 0-2.2-1-2.2-2.2V4c0-1.2 1-2.2 2.2-2.2zM3 6.2h1.8v13c0 .6.4 1 1 1h10.6V22H5.2C4 22 3 21 3 19.8z",
  user: "M12 2.2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM2.8 21.2c0-4.6 4.1-7.6 9.2-7.6s9.2 3 9.2 7.6V22H2.8z",
  wallet: "M5.6 3h11a2.4 2.4 0 0 1 2.4 2.4V6.2H5.4a.7.7 0 0 0 0 1.4h14.8c.8 0 1.4.6 1.4 1.4v10.6c0 1.3-1 2.4-2.4 2.4H4.8c-1.3 0-2.4-1.1-2.4-2.4V6.2C2.4 4.4 3.8 3 5.6 3zm11 9.4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z",
  crown: "M2.6 7.8 7.4 12 12 4.6l4.6 7.4 4.8-4.2-1.7 10.4H4.3zM4.3 19.6h15.4V22H4.3z",
  flame: "M12.9 1.6c.1 2.4 1.3 4.2 3 5.9 2.2 2.1 4.3 4.1 4.3 7.4a8.2 8.2 0 0 1-16.4 0c0-2.3 1-4.3 2.4-5.9.2 1.6 1 2.9 2.4 3.6-.9-2.9-.2-5.6 1.5-8 .8-1.1 2.1-2 2.8-3zM12 11.2c-.2.5-.4.9-.6 1.4-.6 1.2-.9 2.5-.5 3.9-.7-.2-1.2-.7-1.5-1.4-.6.7-1 1.6-1 2.6a3.6 3.6 0 0 0 7.2 0c0-1.1-.5-2-1.2-2.8-1-1.1-2-2.1-2.4-3.7z",
  shield: "M12 1.8 3.8 5v6.2c0 5.1 3.5 9.6 8.2 11 4.7-1.4 8.2-5.9 8.2-11V5zm4.4 7.4-5.6 5.6-3.2-3.2-1.4 1.4 4.6 4.6 7-7z",
  bolt: "M13.6 1.8 3.8 13.6h6.6l-1.6 8.6 9.8-11.8H12z",
  spark: "M12 1.6c.7 4.9 2.6 7.4 8.6 8.4v1.6c-6 1-7.9 3.5-8.6 10.8h-1.6C9.7 15.1 7.6 12.6 1.6 11.6V10c6-1 8.1-3.5 8.8-8.4z",
  tag: "M3 3.2h8.4L21 12.8 12.8 21 3.2 11.4zm4.6 2.4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  chart: "M3 3h2.4v15.6H21V21H3zm4.4 10.2 4-4.6 3 2.6 4.8-5.6 1.8 1.6-6.4 7.4-3-2.6-2.4 2.8z",
  swap: "M16.4 2.6 21.4 7.4l-5 4.8V9H3.6V5.8h12.8zM7.6 11.8V15h12.8v3.2H7.6v3.2l-5-4.8z",
  lock: "M12 1.8a5.2 5.2 0 0 1 5.2 5.2v2.6h.6c1.2 0 2.2 1 2.2 2.2v8c0 1.2-1 2.2-2.2 2.2H6.2c-1.2 0-2.2-1-2.2-2.2v-8c0-1.2 1-2.2 2.2-2.2h.6V7A5.2 5.2 0 0 1 12 1.8zm0 2.6A2.6 2.6 0 0 0 9.4 7v2.6h5.2V7A2.6 2.6 0 0 0 12 4.4zm0 9a1.8 1.8 0 0 0-1 3.3V19h2v-2.3a1.8 1.8 0 0 0-1-3.3z",
} as const;

const LINE = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17.5 19 7",
  chevron: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  copy: "M9 9h10v10H9zM5 15V5h10",
  out: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  plus: "M12 5v14M5 12h14",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4",
} as const;

export type IconName = keyof typeof FILLED | keyof typeof LINE;

export default function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  if (name in FILLED)
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" fill="currentColor" fillRule="evenodd">
        <path d={FILLED[name as keyof typeof FILLED]} />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={LINE[name as keyof typeof LINE]} />
    </svg>
  );
}

/* La marque : la tuile éponge du logo (la carte et sa pièce), et le nom, « cm » à
   l'encre, « cards » en tomate, comme le logo sorti de tools/brand. */
export function Logo({ size = 32, word = true, light = false }: { size?: number; word?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 1000 1000" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="cm-p" x1=".18" y1=".12" x2=".82" y2=".88">
            <stop offset="0" stopColor="#ffe45c" /><stop offset=".46" stopColor="#ffd12e" /><stop offset="1" stopColor="#ffbf1a" />
          </linearGradient>
        </defs>
        <rect width="1000" height="1000" rx="232" fill="url(#cm-p)" />
        <path fill="#1e1a16" transform="translate(115.4 115.4) scale(7.6923)" d="M34 11H66Q78 11 78 23V77Q78 89 66 89H34Q22 89 22 77V23Q22 11 34 11ZM50 33C40.6 33 33 40.6 33 50C33 59.4 40.6 67 50 67C59.4 67 67 59.4 67 50C67 40.6 59.4 33 50 33ZM50 42C54.4 42 58 45.6 58 50C58 54.4 54.4 58 50 58C45.6 58 42 54.4 42 50C42 45.6 45.6 42 50 42Z" />
      </svg>
      {word && (
        <span className={`font-display leading-none tracking-[-.04em] ${light ? "text-cream" : "text-fg"}`} style={{ fontSize: size * .82 }}>
          <b className="font-extrabold">cm</b> <span className={`font-medium ${light ? "text-gold" : "text-tomato"}`}>cards</span>
        </span>
      )}
    </span>
  );
}
