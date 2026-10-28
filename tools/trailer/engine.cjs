/* Le moteur de prise de vue : une page filmée image par image, sans saccade.
   Le temps de la page est figé (horloge de Playwright : setTimeout, Date, rAF) et les
   animations CSS sont mises en pause ; à chaque image on avance l'horloge et chaque
   animation de 1/fps seconde, puis on photographie. La vidéo ne dépend donc pas de la
   vitesse de la machine. Un faux curseur (dans la page) montre les gestes. */

const fs = require("fs");
const path = require("path");

const STEP = () => {
  /* avance toutes les animations CSS (et transitions) de dt ms, figées entre deux images */
  window.__step = (dt) => {
    for (const a of document.getAnimations()) {
      if (a.__t === undefined) { a.__t = 0; a.pause(); }
      else a.__t += dt;
      a.currentTime = a.__t;
    }
  };
  /* le curseur : une flèche noire au contour blanc, et l'onde du clic */
  window.__cursor = (x, y, press, show) => {
    let c = document.getElementById("__cur");
    if (!c) {
      c = document.createElement("div");
      c.id = "__cur";
      c.innerHTML = `<i></i><svg viewBox="0 0 24 24" width="34" height="34"><path d="M3 2l17 9.5-7.4 1.6L9 20z" fill="#1e1a16" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
      Object.assign(c.style, { position: "fixed", left: 0, top: 0, zIndex: 2147483647, pointerEvents: "none", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.35))" });
      const i = c.querySelector("i");
      Object.assign(i.style, { position: "absolute", left: "-26px", top: "-26px", width: "52px", height: "52px", borderRadius: "50%", border: "4px solid #ffd12e", opacity: 0 });
      c.querySelector("svg").style.cssText = "position:absolute;left:-4px;top:-3px";
      document.documentElement.appendChild(c);
    }
    c.style.transform = `translate(${x}px, ${y}px) scale(${1 - press * 0.15})`;
    c.style.opacity = show;
    const i = c.querySelector("i");
    i.style.opacity = press > 0 ? 1 - Math.abs(press - 0.5) * 1.6 : 0;
    i.style.transform = `scale(${0.4 + press * 1.1})`;
  };
};

/* attend que React ait posé son rendu (MessageChannel n'est pas figé) */
const settle = (page) => page.evaluate(() => new Promise((r) => {
  const c = new MessageChannel(); c.port1.onmessage = () => {
    const d = new MessageChannel(); d.port1.onmessage = () => r(); d.port2.postMessage(0);
  }; c.port2.postMessage(0);
}));

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function recorder(page, { fps = 60, dir, quality = 92 }) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  const dt = 1000 / fps;
  let frame = 0;
  const cur = { x: 640, y: 400, press: 0, show: 0 };
  const marks = {};
  await page.evaluate(STEP);

  async function tick(shoot = true) {
    await page.clock.runFor(dt);
    await settle(page);
    await page.evaluate(([dt, c]) => { window.__step(dt); window.__cursor(c.x, c.y, c.press, c.show); }, [dt, cur]);
    if (shoot) {
      await page.screenshot({ path: path.join(dir, `${String(frame).padStart(5, "0")}.jpg`), type: "jpeg", quality });
      frame++;
    }
  }

  return {
    get frame() { return frame; },
    cur,
    /* note le numéro d'image d'un moment (le monteur s'en sert) */
    mark(name) { marks[name] = frame; },
    /* filme n secondes */
    async hold(sec) { for (let k = Math.round(sec * fps); k > 0; k--) await tick(); },
    /* avance sans filmer (chargements, attentes coupées au montage) */
    async skip(sec) { for (let k = Math.round(sec * fps); k > 0; k--) await tick(false); },
    async show(on = true, sec = 0.25) {
      const from = cur.show, to = on ? 1 : 0, n = Math.max(1, Math.round(sec * fps));
      for (let k = 1; k <= n; k++) { cur.show = from + (to - from) * (k / n); await tick(); }
    },
    /* le curseur glisse jusqu'à (x, y) ; drag : bouton enfoncé pendant le trajet */
    async move(x, y, sec = 0.6, { drag = false } = {}) {
      const x0 = cur.x, y0 = cur.y, n = Math.max(1, Math.round(sec * fps));
      if (drag) { await page.mouse.move(x0, y0); await page.mouse.down(); }
      for (let k = 1; k <= n; k++) {
        const e = drag ? k / n : ease(k / n);
        cur.x = x0 + (x - x0) * e; cur.y = y0 + (y - y0) * e - (drag ? 0 : Math.sin(Math.PI * k / n) * 18);
        if (drag) { cur.press = 0.5; await page.mouse.move(cur.x, cur.y); }
        await tick();
      }
      if (drag) { await page.mouse.up(); cur.press = 0; }
    },
    /* un clic, avec l'onde ; le vrai clic part au milieu de l'onde */
    async click(sec = 0.3) {
      const n = Math.max(2, Math.round(sec * fps));
      for (let k = 1; k <= n; k++) {
        cur.press = k / n;
        if (k === Math.round(n / 2)) await page.mouse.click(cur.x, cur.y);
        await tick();
      }
      cur.press = 0;
    },
    async type(text, sec = 0.09) {
      for (const ch of text) { await page.keyboard.type(ch); await this.hold(sec); }
    },
    done() {
      fs.writeFileSync(path.join(dir, "marks.json"), JSON.stringify({ fps, frames: frame, marks }, null, 1));
      return { fps, frames: frame, marks };
    },
  };
}

/* ouvre une page à l'horloge figée, l'indicateur de Next caché */
async function open(context, url, { warm = 1.2 } = {}) {
  const page = await context.newPage();
  await page.clock.install();
  await page.addInitScript(() => {
    const s = document.createElement("style");
    s.textContent = "nextjs-portal{display:none!important} *{caret-color:transparent} html{scrollbar-width:none}";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(s));
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.clock.pauseAt(new Date(Date.now() + 500));
  await page.evaluate(STEP);
  /* laisse la page s'installer : la config, le compte, les images */
  for (let k = 0; k < Math.round(warm * 30); k++) {
    await page.clock.runFor(1000 / 30);
    await settle(page);
    await page.evaluate(() => window.__step(1000 / 30));
  }
  await page.waitForLoadState("networkidle");
  return page;
}

module.exports = { recorder, open, settle };
