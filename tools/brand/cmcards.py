#!/usr/bin/env python3
"""Le logo CM CARDS : le symbole et le nom, générés depuis la vraie fonte.

Même recette que le logo web33 (DA-CLAUDE.md §11.6 dans le dépôt memescanner) :
les lettres sont les contours de Bricolage Grotesque lus dans le fichier du site,
le symbole est un trait rond d'une seule épaisseur converti en surface, posé à l'encre
sur la tuile jaune éponge. Changer une graisse, une approche ou une couleur = changer
une constante ici et relancer, jamais retoucher un SVG à la main.

    pip install fonttools brotli skia-pathops
    python3 tools/brand/cmcards.py          # écrit public/brand/*.svg
    node tools/brand/png.cjs                # les PNG et src/app/favicon.ico

Le SYMBOLE : une carte pleine, aux proportions d'une carte à jouer, et une pièce
dedans (un anneau découpé, son centre plein). C'est le produit en un signe : une
carte qui contient de vrais coins. Une seule idée, aucun trait de plus.
Le NOM : « cm » Bricolage 800 à l'encre, « cards » Bricolage 500 tomate, en bas de
casse, approches serrées.
"""
import io
import os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.svgLib.path import SVGPath
import pathops

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONT = os.path.join(ROOT, 'public/fonts/bricolage-grotesque-var-latin.woff2')
OUT = os.path.join(ROOT, 'public/brand')

# La palette de cm cards (src/app/globals.css) : l'encre chaude, la tomate, le jaune
# éponge. Rien de la palette de web33.
INK, BLUE, SKY = '#1e1a16', '#ff4b3e', '#ffd12e'      # encre, tomate (« cards »), jaune (« cards » sur l'encre)
PLANK = ('#ffe45c', '#ffd12e', '#ffbf1a')             # la tuile jaune éponge, 140°
CREAM = '#fff4dc'

# Les approches, en millièmes d'em.
TEXT = dict(cm=-30, cards=-20, gap=150)

# Le symbole, sur une grille de 100 (y vers le bas) : la carte (un portrait aux
# proportions d'une carte à jouer, coins ronds), la pièce au centre.
CARD = (22, 11, 78, 89, 12)        # x0, y0, x1, y1, rayon
COIN = (50, 50, 17, 8)             # cx, cy, rayon de l'anneau, rayon du centre

_inst = {}
def font(w):
    if w not in _inst:
        _inst[w] = instantiateVariableFont(TTFont(FONT), {'wght': w, 'opsz': 96})
    return _inst[w]

def draw(path, ch, w, x):
    f = font(w); gs = f.getGlyphSet(); g = gs[f.getBestCmap()[ord(ch)]]
    g.draw(TransformPen(path.getPen(), (1, 0, 0, -1, x, 0)))
    return g.width

_B = {}
def svgb(p):
    pen = SVGPathPen(None, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
    p.draw(pen)
    d = pen.getCommands(); _B[d] = p.bounds
    return d

def bounds(d):
    return _B[d]

def word(text, w, track, x=0):
    p = pathops.Path()
    for ch in text:
        x += draw(p, ch, w, x) + track
    p.simplify()
    return p, x

def wordmark(t):
    cm, x = word('cm', 800, t['cm'])
    cards, x = word('cards', 500, t['cards'], x + t['gap'])
    return svgb(cm), svgb(cards), x

def P(d):
    p = pathops.Path()
    SVGPath(io.StringIO(f'<svg xmlns="http://www.w3.org/2000/svg"><path d="{d}"/></svg>')).draw(p.getPen())
    return p

def rrect(x0, y0, x1, y1, r):
    return (f'M{x0+r} {y0} L{x1-r} {y0} Q{x1} {y0} {x1} {y0+r} L{x1} {y1-r} Q{x1} {y1} {x1-r} {y1} '
            f'L{x0+r} {y1} Q{x0} {y1} {x0} {y1-r} L{x0} {y0+r} Q{x0} {y0} {x0+r} {y0} Z')

def circle(cx, cy, r, k=.5523):
    c = r * k
    return (f'M{cx} {cy-r} C{cx+c} {cy-r} {cx+r} {cy-c} {cx+r} {cy} C{cx+r} {cy+c} {cx+c} {cy+r} {cx} {cy+r} '
            f'C{cx-c} {cy+r} {cx-r} {cy+c} {cx-r} {cy} C{cx-r} {cy-c} {cx-c} {cy-r} {cx} {cy-r} Z')

def mark():
    """La carte moins l'anneau de la pièce, plus son centre : une seule surface."""
    cx, cy, ro, ri = COIN
    p = pathops.op(P(rrect(*CARD)), P(circle(cx, cy, ro)), pathops.PathOp.DIFFERENCE)
    p = pathops.op(p, P(circle(cx, cy, ri)), pathops.PathOp.UNION)
    p.convertConicsToQuads(); p.simplify()
    return svgb(p)

def tile_inner(d, shape='sq', fx=True, k=.56, bg='url(#p)', col=INK):
    """La tuile (le relief est à la tuile, jamais au symbole) et le symbole à plat dessus."""
    x0, y0, x1, y1 = bounds(d)
    W, H = x1 - x0, y1 - y0
    sc = 1000 * k / max(W, H)
    tx, ty = 500 - (x0 + W / 2) * sc, 500 - (y0 + H / 2) * sc
    clip = {'sq': '<rect width="1000" height="1000" rx="232"/>',
            'full': '<rect width="1000" height="1000"/>',
            'ci': '<circle cx="500" cy="500" r="500"/>'}[shape]
    base = clip.replace('/>', f' fill="{bg}"/>')
    deco = ''
    if fx:
        deco = ('<g clip-path="url(#c)"><rect width="1000" height="1000" fill="url(#r)"/>'
                '<rect y="0" width="1000" height="9" fill="#fff" fill-opacity=".35"/>'
                '<rect y="972" width="1000" height="28" fill="#000" fill-opacity=".16"/></g>')
    defs = (f'<defs><linearGradient id="p" x1=".18" y1=".12" x2=".82" y2=".88"><stop offset="0" stop-color="{PLANK[0]}"/>'
            f'<stop offset=".46" stop-color="{PLANK[1]}"/><stop offset="1" stop-color="{PLANK[2]}"/></linearGradient>'
            '<radialGradient id="r" cx=".2" cy=".12" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".24"/>'
            '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
            f'<clipPath id="c">{clip}</clipPath></defs>')
    return (f'{defs}{base}{deco}'
            f'<path fill="{col}" transform="translate({tx:.1f} {ty:.1f}) scale({sc:.4f})" d="{d}"/>')

def tile(d, **kw):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><title>cm cards</title>'
            f'{tile_inner(d, **kw)}</svg>\n')

def lockup(cm, cards, m, ink, blue, pad=40, inverse=False):
    """La tuile à gauche du nom, centrée sur lui : le logo complet."""
    ax0, ay0, ax1, ay1 = bounds(cm); bx0, by0, bx1, by1 = bounds(cards)
    top, bot = min(ay0, by0), max(ay1, by1)
    H = 1.12 * (bot - top)
    cy = (top + bot) / 2
    x0 = ax0 - .34 * H - H
    kw = dict(k=.62)
    if inverse:
        kw.update(bg='#fff', col=PLANK[1], fx=False)
    sc = H / 1000
    vb = f'{x0 - pad:.0f} {cy - H/2 - pad:.0f} {bx1 - x0 + 2*pad:.0f} {H + 2*pad:.0f}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><title>cm cards</title>'
            f'<g transform="translate({x0:.1f} {cy - H/2:.1f}) scale({sc:.4f})">{tile_inner(m, **kw)}</g>'
            f'<path fill="{ink}" d="{cm}"/><path fill="{blue}" d="{cards}"/></svg>\n')

def og(cm, cards, m, W=1200, H=630):
    """L'aperçu d'un lien : le papier crème plein cadre, le logo au centre."""
    inner = lockup(cm, cards, m, INK, BLUE, pad=0)
    vb = [float(v) for v in inner.split('viewBox="', 1)[1].split('"', 1)[0].split()]
    body = inner.split('<title>cm cards</title>', 1)[1].rsplit('</svg>', 1)[0]
    sc = W * .58 / vb[2]
    tx, ty = (W - vb[2] * sc) / 2 - vb[0] * sc, H / 2 - (vb[1] + vb[3] / 2) * sc
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><title>cm cards</title><defs>'
            f'<linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{PLANK[0]}"/>'
            f'<stop offset=".46" stop-color="{PLANK[1]}"/><stop offset="1" stop-color="{PLANK[2]}"/></linearGradient>'
            '<radialGradient id="ogr" cx=".16" cy="0" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".2"/>'
            '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
            f'<g transform="translate({tx:.1f} {ty:.1f}) scale({sc:.5f})">{body}</g></svg>\n')

def main():
    os.makedirs(OUT, exist_ok=True)
    cm, cards, end = wordmark(TEXT)
    m = mark(); mf = m
    mb = bounds(m)
    files = {
        'cmcards-logo.svg': lockup(cm, cards, m, INK, BLUE),
        'cmcards-logo-white.svg': lockup(cm, cards, m, '#fff', SKY),
        'cmcards-mark.svg': (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{mb[0]-6:.0f} {mb[1]-6:.0f} '
                             f'{mb[2]-mb[0]+12:.0f} {mb[3]-mb[1]+12:.0f}"><title>cm cards</title>'
                             f'<path fill="currentColor" d="{m}"/></svg>\n'),
        'cmcards-icon.svg': tile(m, k=.6),
        'cmcards-avatar.svg': tile(m, shape='ci', k=.54),
        'cmcards-favicon.svg': tile(mf, fx=False, k=.72),
        'cmcards-touch.svg': tile(m, shape='full', k=.6),
        'cmcards-og.svg': og(cm, cards, m),
    }
    for name, svg in files.items():
        open(os.path.join(OUT, name), 'w').write(svg)
    # Pour l'interface : le symbole seul en chemin (viewBox 0 0 100 100) et le nom,
    # repris tels quels par src/components/Logo.tsx.
    open(os.path.join(OUT, 'paths.json'), 'w').write(
        '{"mark":"%s","cm":"%s","cards":"%s","width":%.0f}\n' % (m, cm, cards, end))
    for name in list(files) + ['paths.json']:
        print('  public/brand/' + name, os.path.getsize(os.path.join(OUT, name)), 'o')

if __name__ == '__main__':
    main()
