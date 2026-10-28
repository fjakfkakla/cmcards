/* Les plans de la bande-annonce, filmés dans la vraie app (npm run dev) avec un faux
   serveur (mock.cjs) : node tools/trailer/shoot.cjs [plan…]
   Chaque plan devient une suite d'images dans public/trailer/<plan>/ (60 i/s, 1920 × 1200). */

const { chromium } = require("playwright");
const path = require("path");
const { open, recorder } = require("./engine.cjs");
const { WALLET, SELLERS, card, setup, state } = require("./mock.cjs");

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = path.join(__dirname, "../../public/trailer");
const FPS = 60;

/* le tirage du booster Legend : la Mythic de quant, l'OG de Kimchi, une Shiny d'Ansem */
const DRAW = [card("alon", "rare", 1187), card("ansem", "shiny", 213), card("kimchi", "og", 7), card("alon", "common", 3906), card("quant", "mythic", 1)];
const OLD = [card("cented", "og", 31, "famous"), card("decu", "shiny", 77, "famous"), card("gake", "rare", 845, "famous"), card("profit", "rare", 1290, "famous"),
  card("mitch", "common", 2210, "trencher"), card("frank", "common", 4380, "famous"), card("yenni", "rare", 402, "trencher")];
const OFFERS = [
  [card("ansem", "og", 12, "legend", SELLERS[0]), 18.5], [card("cented", "mythic", 1, "famous", SELLERS[1]), 120], [card("kimchi", "shiny", 44, "legend", SELLERS[2]), 6.9],
  [card("decu", "og", 3, "famous", SELLERS[3]), 9.4], [card("alon", "shiny", 121, "legend", SELLERS[1]), 4.2], [card("gake", "rare", 311, "famous", SELLERS[2]), 0.85],
  [card("profit", "shiny", 54, "famous", SELLERS[0]), 2.6], [card("rasmr", "og", 19, "famous", SELLERS[3]), 7.75], [card("frank", "rare", 902, "famous", SELLERS[1]), 0.6],
  [card("mitch", "rare", 1650, "trencher", SELLERS[2]), 0.42], [card("unipcs", "shiny", 210, "famous", SELLERS[0]), 2.1], [card("nyhrox", "og", 8, "holder", SELLERS[3]), 8.8],
].map(([c, sol], i) => ({ id: `o${i}`, uid: c.uid, seller: c.owner, lamports: Math.round(sol * 1e9), at: Date.now() - i * 4e5, card: c }));
const SALES = OFFERS.slice(0, 8).map((o, i) => ({ uid: o.uid, trader: o.card.trader, rarity: o.card.rarity, serial: o.card.serial, seller: o.seller, buyer: SELLERS[(i + 1) % 4],
  lamports: Math.round(o.lamports * (0.8 + (i % 3) * 0.15)), sig: `sig${i}`, at: Date.now() - i * 9e5 - 60e3 }));

const center = async (page, sel) => {
  const b = await page.locator(sel).first().boundingBox();
  return [b.x + b.width / 2, b.y + b.height / 2, b];
};

const SHOTS = {
  /* la fiche du booster Legend, le curseur va payer (le clic est joué, pas envoyé) */
  async pay(ctx) {
    const page = await open(ctx, `${BASE}/booster/legend`);
    const r = await recorder(page, { fps: FPS, dir: `${OUT}/pay` });
    const [x, y] = await center(page, "button.btn-gold");
    Object.assign(r.cur, { x: x + 260, y: y + 120 });
    await r.show(true, 0.2);
    await r.move(x + 40, y + 6, 0.9);
    r.mark("press");
    const n = 18; for (let k = 1; k <= n; k++) { r.cur.press = k / n; await r.hold(1 / FPS); }
    r.cur.press = 0;
    await r.hold(0.4);
    return r.done();
  },

  /* le booster payé : le couper, la bande des raretés, les cartes, la Mythic en grand */
  async open(ctx) {
    state.draw = DRAW; state.cards = [...OLD];
    await ctx.addInitScript((w) => localStorage.setItem("cmcards:pending", JSON.stringify({ sig: "5xTrailerSig", pack: "legend", wallet: w })), WALLET);
    const page = await open(ctx, `${BASE}/booster/legend`, { warm: 1.5 });
    const r = await recorder(page, { fps: FPS, dir: `${OUT}/open` });
    const [, , b] = await center(page, ".op-pack");
    const cutY = b.y + b.height * 0.11;
    Object.assign(r.cur, { x: b.x + b.width + 160, y: cutY + 140 });
    await r.show(true, 0.15);
    await r.move(b.x + 14, cutY, 0.55);
    r.mark("swipe");
    await r.move(b.x + b.width * 0.86, cutY, 0.5, { drag: true });
    r.mark("tear");
    await r.show(false, 0.2);
    await r.hold(1.7);
    r.mark("spin");
    await r.hold(4.4);
    r.mark("reveal");
    await r.hold(3.1);
    r.mark("done");
    const [mx, my] = await center(page, ".op-card:nth-child(5)");
    Object.assign(r.cur, { x: mx + 220, y: my + 260 });
    await r.show(true, 0.15);
    await r.move(mx, my, 0.55);
    r.mark("click");
    await r.click();
    await r.show(false, 0.15);
    r.mark("zoom");
    await r.hold(2.4);
    return r.done();
  },

  /* la collection : une carte touchée, son prix, la mise en vente */
  async sell(ctx) {
    state.cards = [...DRAW, ...OLD]; state.listings = []; state.offers = OFFERS; state.sales = SALES;
    const page = await open(ctx, `${BASE}/collection`, { warm: 1.5 });
    const r = await recorder(page, { fps: FPS, dir: `${OUT}/sell` });
    await r.hold(0.4);
    const [x, y] = await center(page, `.col-tile >> nth=1`);
    Object.assign(r.cur, { x: x + 300, y: y + 250 });
    await r.show(true, 0.15);
    await r.move(x, y, 0.6);
    await r.click();
    await r.hold(0.5);
    r.mark("sheet");
    const [ix, iy] = await center(page, "#price");
    await r.move(ix - 40, iy, 0.5);
    await r.click();
    r.mark("type");
    await r.type("18.5");
    await r.hold(0.3);
    const [bx, by] = await center(page, "form button.btn-gold");
    await r.move(bx, by, 0.5);
    r.mark("list");
    await r.click();
    await r.hold(1.2);
    return r.done();
  },

  /* le marché : la grille, on descend dans les cartes */
  async market(ctx) {
    state.cards = [...DRAW, ...OLD]; state.offers = OFFERS; state.sales = SALES;
    const page = await open(ctx, `${BASE}/market`, { warm: 1.5 });
    const r = await recorder(page, { fps: FPS, dir: `${OUT}/market` });
    await r.hold(0.6);
    const n = Math.round(3.2 * FPS);
    for (let k = 1; k <= n; k++) {
      const e = k / n, y = 780 * (e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2);
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await r.hold(1 / FPS);
    }
    await r.hold(0.8);
    return r.done();
  },
};

(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  const browser = await chromium.launch();
  for (const name of want) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
    const page0 = await ctx.newPage();
    await setup(page0.context(), {});
    await page0.close();
    const t = Date.now();
    const res = await SHOTS[name](ctx);
    console.log(name, res.frames, "frames", JSON.stringify(res.marks), `${((Date.now() - t) / 1000).toFixed(0)}s`);
    await ctx.close();
  }
  await browser.close();
})();
