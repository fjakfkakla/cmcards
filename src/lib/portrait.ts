/* Une carte n'a jamais de trou à la place du personnage : son illustration (la
   bannière X, ou une image de public/traders/, absente sur Vercel), sinon le
   portrait dessiné ici, sans réseau, qui ne peut pas échouer. */

import type { Trader } from "./data";

export function portraitSources(t: Trader, own?: string): string[] {
  return [own ?? t.art].filter((s): s is string => !!s);
}

/* Le portrait de secours : l'initiale sur le fond de la catégorie, une trame. */
export function portraitSvg(name: string, bg = "#ff9a1f"): string {
  const letter = (name.trim()[0] ?? "?").toUpperCase().replace(/[<>&"']/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">`
    + `<defs><pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2.6" fill="#fff" fill-opacity=".18"/></pattern>`
    + `<radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="400" height="400" fill="${bg}"/><rect width="400" height="400" fill="url(#d)"/><rect width="400" height="400" fill="url(#g)"/>`
    + `<text x="200" y="250" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900" font-size="210" fill="#fff" stroke="#1e1a16" stroke-width="12" paint-order="stroke">${letter}</text>`
    + `</svg>`;
}

export const portraitUri = (name: string, bg?: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(portraitSvg(name, bg))}`;
