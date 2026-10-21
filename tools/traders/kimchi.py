"""Les images du set Kimchi, fabriquées depuis ses photos (jamais dans le dépôt).

    python tools/traders/kimchi.py <dossier des photos> public/traders

Le dossier contient table.png (la table de billets), jet.png (le jet),
desert.webp (le désert) et flash.webp (la photo au flash). Le détourage passe
par rembg (isnet-general-use) ; le décor sans le personnage, par OpenCV.

Sorties :
  kimchi-table.webp, kimchi-jet.webp, kimchi-desert.webp, kimchi-flash.webp
  kimchi-aura-bg.webp    le désert sans lui (le décor de la Mythic, en parallaxe)
  kimchi-aura-cut.webp   lui seul, sans les coussins ni les mules
  kimchi-aura-glow.png   sa silhouette floutée : le masque de l'aura
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
session = new_session("isnet-general-use")


def cut(im: Image.Image) -> np.ndarray:
    return np.array(remove(im, session=session))[:, :, 3].astype(np.float32) / 255


for name, file in [("table", "table.png"), ("jet", "jet.png"), ("desert", "desert.webp"), ("flash", "flash.webp")]:
    Image.open(src / file).convert("RGB").save(out / f"kimchi-{name}.webp", quality=90)

# --- La Mythic : le désert, lui, son aura ---
desert = Image.open(src / "desert.webp").convert("RGB")
w, h = desert.size
a = cut(desert)
ys, xs = np.mgrid[0:h, 0:w]
lum = np.array(desert.convert("L")).astype(np.float32)
pillows = (ys > 0.45 * h) & (ys < 0.62 * h) & (xs < 0.43 * w)
a[pillows & (lum > 120)] = 0                                    # le traversin et le coussin, clairs
a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
n, labels, stats, _ = cv2.connectedComponentsWithStats((a > 0.3).astype(np.uint8))
body = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])                 # lui : le plus grand morceau
a[cv2.dilate((labels != body).astype(np.uint8), np.ones((5, 5), np.uint8)) & (labels != body) > 0] = 0
a[(ys > 0.85 * h) & (xs > 0.275 * w)] = 0                     # les mules
rgba = np.dstack([np.array(desert), (a * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(out / "kimchi-aura-cut.webp", quality=92)

hole = (cv2.dilate((a > 0.08).astype(np.uint8), np.ones((41, 41), np.uint8)) * 255)
small = cv2.resize(np.array(desert)[:, :, ::-1], (w // 2, h // 2))
bg = cv2.inpaint(small, cv2.resize(hole, (w // 2, h // 2)), 18, cv2.INPAINT_TELEA)
bg = cv2.resize(bg, (w, h))[:, :, ::-1]
Image.fromarray(bg).filter(ImageFilter.GaussianBlur(3)).save(out / "kimchi-aura-bg.webp", quality=88)

glow = Image.fromarray((a * 255).astype(np.uint8)).resize((w // 4, h // 4))
glow = glow.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(14))
g = np.array(glow).astype(np.float32)
g = np.clip(g / g.max() * 1.6, 0, 1) * 255
Image.merge("RGBA", [Image.new("L", glow.size, 255)] * 3 + [Image.fromarray(g.astype(np.uint8))]).save(out / "kimchi-aura-glow.png")
