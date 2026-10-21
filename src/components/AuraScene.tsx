import "./aura.css";
import type { AuraArt, RarityId } from "@/lib/data";

/* Le set Kimchi : le boss des memecoins, l'aura du boss final, mais rien qui crie.
   Une photo par rareté, une mise en scène par photo, et la même retenue partout :
   un sérif italique, des capitales espacées, une seule chose qui bouge. */

const BUBBLES = [[12, 1, 7, 0], [24, 1.6, 9, 2.4], [37, .8, 6.5, 1.1], [51, 1.3, 8, 3.6], [63, .9, 7.5, .5], [74, 1.8, 10, 2], [86, 1.1, 8.5, 4.2], [44, .7, 6, 5], [92, .8, 7, 1.7], [6, 1.4, 9.5, 3]];
const MOTES = [[38, 70, 0], [52, 62, 1.4], [30, 82, 2.6], [60, 76, 3.3], [46, 88, 4.1], [34, 58, 5.2], [56, 50, 2], [42, 44, 4.6]];

const img = (src: string, cls: string, pos?: string) => (
  <img className={cls} src={src} alt="" style={pos ? { objectPosition: pos } : undefined} draggable={false} />
);

export function auraScene(id: RarityId, a: AuraArt): { scene: React.ReactNode; over?: React.ReactNode } {
  switch (id) {
    // Le tirage : la photo telle quelle, posée sur un carton mat. Rien ne bouge.
    case "common":
      return { scene: <div className="ka-print">{img(a.print, "", "42% 62%")}</div> };

    // Le rosé : le jet, la nacre champagne, des bulles qui montent.
    case "shiny":
      return {
        scene: (
          <>
            {img(a.jet, "ka-full", "50% 30%")}
            <div className="ka-rose" />
            <div className="cc-sheen" />
            {BUBBLES.map(([x, s, dur, d], i) => (
              <span key={i} className="ka-bubble" style={{ left: `${x}%`, width: `${s}cqw`, height: `${s}cqw`, animationDuration: `${dur}s`, animationDelay: `${d}s` }} />
            ))}
          </>
        ),
      };

    // La liasse : la table de billets, et la carte sanglée comme un paquet de 10 000 $.
    case "millionaire":
      return {
        scene: (
          <>
            {img(a.table, "ka-full", "50% 58%")}
            <div className="ka-grain" />
            <div className="ka-vignette" />
          </>
        ),
        over: (
          <div className="ka-strap">
            <span>100 × 100</span>
            <b>$10,000</b>
            <span>Kimchi</span>
          </div>
        ),
      };

    // L'icône : lui seul, détouré, sur la feuille d'or ; l'auréole, l'éclat de la montre.
    case "legendary":
      return {
        scene: (
          <>
            <div className="ka-leaf" />
            <div className="ka-halo"><i /></div>
            {img(a.icon, "ka-icon")}
            <span className="ka-glint" />
            <div className="cc-holo" />
          </>
        ),
      };

    // La pellicule : le négatif noir et blanc, les perforations, le flash qui part.
    case "og":
      return {
        scene: (
          <>
            <div className="ka-holes l" />
            <div className="ka-holes r" />
            <span className="ka-edge l">KIMCHI 400 ▸ 17</span>
            <span className="ka-edge r">17A ▸ 18 ▸ 18A</span>
            <div className="ka-frame">
              {img(a.film, "", "50% 22%")}
              <div className="ka-grain" />
              <div className="ka-flash" />
            </div>
          </>
        ),
      };

    // L'aura : le désert à la tombée du jour, lui devant, et ce qui émane de lui.
    case "mythic":
      return {
        scene: (
          <>
            {img(a.bg, "ka-full ka-back", "45% 50%")}
            <div className="ka-depth">
              <div className="ka-aura" style={{ "--glow": `url(${a.glow})` } as React.CSSProperties} />
              <div className="ka-aura ka-wave" style={{ "--glow": `url(${a.glow})` } as React.CSSProperties} />
              {img(a.cut, "ka-full ka-cut", "45% 50%")}
            </div>
            {MOTES.map(([x, y, d], i) => (
              <span key={i} className="ka-mote" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
            ))}
            <div className="ka-boss">
              <p><span>Final boss</span><span>Aura ∞</span></p>
              <i />
            </div>
          </>
        ),
      };
  }
}
