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

Pour X : la photo de profil (cmcards-x-pdp, la tuile pleine, X la rogne en rond) et
la bannière (cmcards-x-banner, 1500 × 500 : le logo, l'accroche, cinq cartes en
éventail). Les textes de la bannière sont en anglais.

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
    g.draw(TransformPen(path.getPen(glyphSet=gs), (1, 0, 0, -1, x, 0)))  # glyphSet : les lettres composées (é)
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

# ---------- X : la bannière (1500 × 500) et la photo de profil ----------
# Les cartes en éventail à droite : cinq vraies cartes de la saison, une par rareté,
# dessinées ici dans la grammaire des autocollants (le cadre, la scène cernée d'encre,
# la pastille de catégorie, la plaque du nom). Les images sont celles du site,
# embarquées dans le SVG pour qu'il se suffise à lui-même.
import base64
CAT = {'trencher': ('#ff9a1f', 'M15.5 2 22 8.5l-1.4 1.4-1.6-1.6-4.3 4.3 1.1 1.1-3 3a3 3 0 0 1-4.2 0l-.3-.3-4.9 4.9L2 19.9 6.9 15l-.3-.3a3 3 0 0 1 0-4.2l3-3 1.1 1.1 4.3-4.3-1.6-1.6z'),
       'holder': ('#2fa8ff', 'M6 3h12l4 6-10 12L2 9z'),
       'famous': ('#ff5fb4', 'M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z'),
       'legend': ('#ffc21a', 'M2 7l5 4 5-7 5 7 5-4-2 12H4zm2.4 13h15.2v2H4.4z')}
MARK = {'common': 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'rare': 'M12 3l8 9-8 9-8-9z',
        'shiny': 'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z', 'og': 'M12 2l8.7 5v10L12 22l-8.7-5V7z',
        'mythic': 'M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 16.8 6.1 20l1.3-6.5L2.5 8.9l6.6-.8z'}
# trader, nom, catégorie, rareté, image (public/), cadrage (x, y en 0..1, zoom), numéro, stock
# De gauche à droite, par rareté croissante : la Mythic ferme l'éventail, entière, au-dessus des autres.
FAN = [('blu6k', 'blu6k', 'trencher', 'common', 'art/blu6k.webp', (.5, .45, 1), 1204, 5000),
       ('pain', 'Pain', 'holder', 'rare', 'art/pain.webp', (.5, .38, 1), 88, 2000),
       ('cented', 'Cented', 'famous', 'shiny', 'art/cented-face.webp', (.5, .35, 1), 42, 500),
       ('ansem', 'Ansem', 'legend', 'og', 'art/ansem-face.webp', (1, .3, 1.15), 7, 50),   # son visage à gauche : la carte suivante couvre la droite
       ('kimchi', 'Kimchi', 'legend', 'mythic', 'traders/kimchi-desert.webp', (.5, .36, 2.8), 1, 1)]   # son visage au centre du médaillon
TAGLINE = 'Memecoin trader cards, on Solana.'   # la bannière parle anglais

def datauri(rel):
    from PIL import Image
    p = os.path.join(ROOT, 'public', rel)
    w, h = Image.open(p).size
    return 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode(), w, h

def label(text, w, track, size, x, y, fill, anchor='start', stroke=None):
    """Un texte en chemins (pas de fonte dans le SVG), en px, ancré à sa ligne de base."""
    p, adv = word(text, w, track)
    d = svgb(p); k = size / 1000
    if anchor == 'middle': x -= adv * k / 2
    elif anchor == 'end': x -= adv * k
    s = f' stroke="{stroke[0]}" stroke-width="{stroke[1] / k:.1f}" stroke-linejoin="round" paint-order="stroke"' if stroke else ''
    return f'<path fill="{fill}"{s} transform="translate({x:.1f} {y:.1f}) scale({k:.5f})" d="{d}"/>', adv * k

def fan_card(i, trader, name, cat, rar, img, fit, n, stock, W=230):
    """Une carte (63 × 88) dessinée en coordonnées locales, centrée en (0, 0)."""
    H = W * 88 / 63; x0, y0 = -W / 2, -H / 2
    R, pad, r2 = W * .046, W * .044, W * .03
    uri, iw, ih = datauri(img)
    col, glyph = CAT[cat]
    s = f'c{i}'
    # la scène : l'intérieur du cadre, cerné d'encre
    sx, sy, sw, sh = x0 + pad, y0 + pad, W - 2 * pad, H - 2 * pad
    fx, fy, zoom = fit
    sc = max(sw / iw, sh / ih) * zoom
    aw, ah = iw * sc, ih * sc
    ax, ay = sx - (aw - sw) * fx, sy - (ah - sh) * fy
    frame = {'common': '#e7dfd0', 'rare': f'url(#{s}-ag)', 'shiny': f'url(#{s}-pearl)', 'og': '#111', 'mythic': f'url(#{s}-gold)'}[rar]
    defs = (f'<clipPath id="{s}-clip"><rect x="{sx:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="{sh:.1f}" rx="{r2:.1f}"/></clipPath>'
            f'<linearGradient id="{s}-ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".25" stop-color="#a9b4c2"/>'
            f'<stop offset=".45" stop-color="#eef2f6"/><stop offset=".7" stop-color="#7f8b9b"/><stop offset="1" stop-color="#dfe5ec"/></linearGradient>'
            f'<linearGradient id="{s}-pearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ffd6f0"/>'
            f'<stop offset=".5" stop-color="#d6f3ff"/><stop offset=".75" stop-color="#fff6c2"/><stop offset="1" stop-color="#e3d6ff"/></linearGradient>'
            f'<linearGradient id="{s}-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4b3e"/><stop offset=".2" stop-color="#ff9a1f"/>'
            f'<stop offset=".4" stop-color="#ffd12e"/><stop offset=".6" stop-color="#3dcb6c"/><stop offset=".8" stop-color="#4da8ff"/><stop offset="1" stop-color="#ff5fb4"/></linearGradient>'
            f'<linearGradient id="{s}-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{INK}" stop-opacity="0"/><stop offset=".5" stop-color="{INK}" stop-opacity=".85"/></linearGradient>'
            f'<filter id="{s}-bw"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.4" intercept="-.17"/>'
            f'<feFuncG type="linear" slope="1.4" intercept="-.17"/><feFuncB type="linear" slope="1.4" intercept="-.17"/></feComponentTransfer></filter>'
            f'<filter id="{s}-shiny"><feColorMatrix type="hueRotate" values="165"/><feColorMatrix type="saturate" values="1.25"/></filter>')
    out = [f'<defs>{defs}</defs>',
           # l'ombre dure sous la carte, puis le cadre
           f'<rect x="{x0:.1f}" y="{y0 + 10:.1f}" width="{W}" height="{H:.1f}" rx="{R:.1f}" fill="#000" fill-opacity=".22"/>',
           f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{W}" height="{H:.1f}" rx="{R:.1f}" fill="{frame}"/>']
    if rar == 'og':
        out.append(f'<rect x="{x0 + 3.5:.1f}" y="{y0 + 3.5:.1f}" width="{W - 7}" height="{H - 7:.1f}" rx="{R - 3:.1f}" fill="none" stroke="#fff" stroke-width="1.2"/>')
    if rar == 'rare':
        out.append(f'<rect x="{x0 + 1.5:.1f}" y="{y0 + 1.5:.1f}" width="{W - 3}" height="{H - 3:.1f}" rx="{R - 1:.1f}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/>')
    out.append(f'<g clip-path="url(#{s}-clip)">')
    out.append(f'<rect x="{sx:.1f}" y="{sy:.1f}" width="{sw}" height="{sh:.1f}" fill="{"#222" if rar == "og" else col}"/>')
    if rar == 'mythic':
        # les rayons multicolores derrière le personnage
        cx, cy, n_ = sx + sw / 2, sy + sh * .45, 24
        cols = ['#ffd12e', '#ff9a1f', '#ff5fb4', '#4da8ff']
        import math
        for k in range(n_):
            a0, a1 = math.radians(k * 360 / n_), math.radians((k + 1) * 360 / n_)
            out.append(f'<path fill="{cols[k % 4]}" d="M{cx:.1f} {cy:.1f}L{cx + 400 * math.cos(a0):.1f} {cy + 400 * math.sin(a0):.1f}L{cx + 400 * math.cos(a1):.1f} {cy + 400 * math.sin(a1):.1f}Z"/>')
        out.append(f'<circle cx="{cx:.1f}" cy="{cy + sh * .08:.1f}" r="{sw * .42:.1f}" fill="#fff" fill-opacity=".55"/>')
    flt = {'og': f' filter="url(#{s}-bw)"', 'shiny': f' filter="url(#{s}-shiny)"'}.get(rar, '')
    if rar == 'mythic':
        # le médaillon : le personnage en rond, bordé de blanc et cerné d'encre, son ombre dure
        mr = sw * .4; mx, my = sx + sw / 2, sy + sh * .45
        msc = 2 * mr / min(iw, ih) * zoom
        mw, mh = iw * msc, ih * msc
        out.append(f'<clipPath id="{s}-medal"><circle cx="{mx:.1f}" cy="{my:.1f}" r="{mr:.1f}"/></clipPath>')
        out.append(f'<g transform="rotate(-4 {mx:.1f} {my:.1f})"><circle cx="{mx + 4:.1f}" cy="{my + 4:.1f}" r="{mr + 4:.1f}" fill="{INK}"/>'
                   f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="{mr + 4:.1f}" fill="#fff" stroke="{INK}" stroke-width="2"/>'
                   f'<g clip-path="url(#{s}-medal)"><image href="{uri}" x="{mx - mr - (mw - 2 * mr) * fx:.1f}" y="{my - mr - (mh - 2 * mr) * fy:.1f}" '
                   f'width="{mw:.1f}" height="{mh:.1f}" preserveAspectRatio="none"/></g></g>')
    else:
        out.append(f'<image href="{uri}" x="{ax:.1f}" y="{ay:.1f}" width="{aw:.1f}" height="{ah:.1f}" preserveAspectRatio="none"{flt}/>')
    if rar == 'og':
        out.append(f'<rect x="{sx:.1f}" y="{sy:.1f}" width="{sw}" height="{sh:.1f}" fill="url(#{s}-plate)" opacity=".5"/>')
    if rar != 'mythic':
        out.append(f'<rect x="{sx:.1f}" y="{sy + sh * .62:.1f}" width="{sw}" height="{sh * .38:.1f}" fill="url(#{s}-plate)"/>')
    out.append('</g>')
    scene_stroke = '#fff' if rar == 'og' else INK
    out.append(f'<rect x="{sx + 1:.1f}" y="{sy + 1:.1f}" width="{sw - 2:.1f}" height="{sh - 2:.1f}" rx="{r2:.1f}" fill="none" stroke="{scene_stroke}" stroke-width="2"/>')
    # la pastille de catégorie, en haut à gauche
    px, py, ph = sx + W * .034, sy + W * .034, W * .075
    t, tw = label(cat.upper(), 800, 40, W * .038, 0, 0, '#fff')
    pw = ph * .5 + W * .048 + tw + ph * .35
    pill_fill, pill_fg, pill_sh = ('#fff', '#000', '#fff') if rar == 'og' else (col, '#fff', INK)
    out.append(f'<rect x="{px + 2.5:.1f}" y="{py + 2.5:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph / 2:.1f}" fill="{pill_sh}"/>')
    out.append(f'<rect x="{px:.1f}" y="{py:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph / 2:.1f}" fill="{pill_fill}" stroke="{INK if rar != "og" else "#000"}" stroke-width="2"/>')
    gs = ph * .52 / 24
    out.append(f'<path fill="{pill_fg}" transform="translate({px + ph * .3:.1f} {py + ph * .24:.1f}) scale({gs:.4f})" d="{glyph}"/>')
    out.append(t.replace('transform="translate(0.0 0.0)', f'transform="translate({px + ph * .5 + W * .048:.1f} {py + ph * .7:.1f})')
               .replace('fill="#fff"', f'fill="{pill_fg}"'))
    # la plaque : le nom à gauche (blanc cerné d'encre), le numéro à droite
    name_col = '#ffd12e' if rar == 'mythic' else '#fff'
    t, _ = label(name, 800, -20, W * .12, sx + W * .036, sy + sh - W * .04, name_col, stroke=(INK if rar != 'og' else '#000', W * .018))
    out.append(t)
    serial = '1 / 1' if stock == 1 else f'#{n} / {stock}'
    t, tw = label(serial, 700, 10, W * .034, sx + sw - W * .036, sy + sh - W * .042, '#fff', anchor='end')
    if rar == 'mythic':
        out.append(f'<rect x="{sx + sw - W * .036 - tw - W * .028:.1f}" y="{sy + sh - W * .042 - W * .05:.1f}" width="{tw + W * .056:.1f}" height="{W * .068:.1f}" rx="{W * .016:.1f}" fill="{INK}"/>')
        t, tw = label(serial, 700, 10, W * .034, sx + sw - W * .036 - W * .028, sy + sh - W * .042 - W * .007, '#ffd12e', anchor='end')
    else:
        t2, tw2 = label(rar.upper(), 800, 40, W * .03, sx + sw - W * .036, sy + sh - W * .042 - W * .05, '#fff', anchor='end')
        ms = W * .036 / 24
        out.append(t2)
        out.append(f'<path fill="{col if rar != "og" else "#fff"}" stroke="{INK}" stroke-width="2.4" paint-order="stroke" '
                   f'transform="translate({sx + sw - W * .036 - tw2 - W * .05:.1f} {sy + sh - W * .042 - W * .085:.1f}) scale({ms:.4f})" d="{MARK[rar]}"/>')
    out.append(t)
    if rar == 'shiny':
        for (qx, qy) in [(.18, .22), (.74, .16), (.62, .48), (.26, .58), (.82, .64)]:
            cx, cy, k = sx + sw * qx, sy + sh * qy, W * .03
            out.append(f'<path fill="#fff" d="M{cx:.1f} {cy - k:.1f}Q{cx:.1f} {cy:.1f} {cx + k:.1f} {cy:.1f}Q{cx:.1f} {cy:.1f} {cx:.1f} {cy + k:.1f}Q{cx:.1f} {cy:.1f} {cx - k:.1f} {cy:.1f}Q{cx:.1f} {cy:.1f} {cx:.1f} {cy - k:.1f}Z"/>')
    return ''.join(out)

def x_banner(cm, cards, m, W=1500, H=500):
    """La bannière X : le papier crème, le logo et l'accroche à gauche, l'éventail de
    cartes à droite. En bas à gauche, X pose la photo de profil (≈ 380 × 160 px) :
    rien d'important n'y est écrit."""
    inner = lockup(cm, cards, m, INK, BLUE, pad=0)
    vb = [float(v) for v in inner.split('viewBox="', 1)[1].split('"', 1)[0].split()]
    body = inner.split('<title>cm cards</title>', 1)[1].rsplit('</svg>', 1)[0]
    sc = 520 / vb[2]
    lx, ly = 120, 150
    tx, ty = lx - vb[0] * sc, ly - vb[1] * sc
    tag, tw = label(TAGLINE, 500, -10, 30, lx + 5, ly + vb[3] * sc + 58, INK)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><title>cm cards</title><defs>'
           f'<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{PLANK[1]}" stop-opacity=".55"/>'
           f'<stop offset="1" stop-color="{PLANK[1]}" stop-opacity="0"/></radialGradient>'
           f'<clipPath id="xb"><rect width="{W}" height="{H}"/></clipPath></defs>'
           f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
           f'<g clip-path="url(#xb)"><ellipse cx="1130" cy="330" rx="520" ry="380" fill="url(#sun)"/>',
           f'<g transform="translate({tx:.1f} {ty:.1f}) scale({sc:.5f})">{body}</g>', tag]
    # l'éventail : cinq cartes tenues en main, le pivot sous la bannière
    import math
    px, py, rad = 1140, 950, 650
    for i, (trader, name, cat, rar, img, fit, n, stock) in enumerate(FAN):
        a = (i - 2) * 10
        cx, cy = px + rad * math.sin(math.radians(a)), py - rad * math.cos(math.radians(a))
        out.append(f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({a})">{fan_card(i, trader, name, cat, rar, img, fit, n, stock, W=210)}</g>')
    # le sticker « Season 1 », de travers sur l'éventail
    st, stw = label('SEASON 1', 800, 30, 26, 0, 0, CREAM)
    sw_, sh_ = stw + 44, 50
    out.append(f'<g transform="translate(1310 92) rotate(8)"><rect x="{-sw_ / 2 + 4:.1f}" y="{-sh_ / 2 + 4:.1f}" width="{sw_:.1f}" height="{sh_:.1f}" rx="25" fill="{INK}"/>'
               f'<rect x="{-sw_ / 2:.1f}" y="{-sh_ / 2:.1f}" width="{sw_:.1f}" height="{sh_:.1f}" rx="25" fill="{BLUE}" stroke="{INK}" stroke-width="2.5"/>'
               + st.replace('translate(0.0 0.0)', f'translate({-stw / 2:.1f} 9.5)') + '</g>')
    out.append('</g></svg>\n')
    return ''.join(out)


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
        'cmcards-x-pdp.svg': tile(m, shape='full', k=.54),   # X la rogne en rond lui-même
        'cmcards-x-banner.svg': x_banner(cm, cards, m),
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
