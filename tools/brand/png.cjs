#!/usr/bin/env node
/* Les PNG du logo, rendus depuis les SVG de public/brand/ (tools/brand/cmcards.py).
   Usage : node tools/brand/png.cjs
   Écrit aussi src/app/favicon.ico (16, 32, 48) et une planche de contrôle
   (tools/brand/board.png) : le logo sur ses trois supports, aux tailles réelles. */
const path = require('path'), fs = require('fs');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const B = path.join(__dirname, '../../public/brand');
const JOBS = [
  ['cmcards-favicon.svg', 'cmcards-favicon-32.png', 32],
  ['cmcards-touch.svg', 'apple-touch-icon.png', 180],
  ['cmcards-icon.svg', 'cmcards-icon-512.png', 512],
  ['cmcards-avatar.svg', 'cmcards-avatar-1000.png', 1000],
  ['cmcards-og.svg', 'cmcards-og.png', 1200, 630],
];
const ICO = { src: 'cmcards-favicon.svg', out: path.join(__dirname, '../../src/app/favicon.ico'), sizes: [16, 32, 48] };
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(([px, buf], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(px, e); head.writeUInt8(px, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += buf.length;
  });
  return Buffer.concat([head, ...pngs.map(x => x[1])]);
}
const svgOf = f => fs.readFileSync(path.join(B, f), 'utf8');
const fill = s => s.replace('<svg ', '<svg style="display:block;width:100vw;height:100vh" ');
(async () => {
  const b = await chromium.launch();
  for (const [src, out, px, ph] of JOBS) {
    const p = await b.newPage({ viewport: { width: px, height: ph || px } });
    await p.setContent('<html><body style="margin:0;background:transparent">' + fill(svgOf(src)) + '</body></html>');
    await p.screenshot({ path: path.join(B, out), omitBackground: true });
    await p.close();
    console.log('public/brand/' + out);
  }
  const pngs = [];
  for (const px of ICO.sizes) {
    const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent('<html><body style="margin:0;background:transparent">' + fill(svgOf(ICO.src)) + '</body></html>');
    pngs.push([px, await p.screenshot({ omitBackground: true })]);
    await p.close();
  }
  fs.writeFileSync(ICO.out, ico(pngs));
  console.log('src/app/favicon.ico');
  // La planche de contrôle : papier, encre, planche, et les petites tailles.
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const img = f => 'data:image/svg+xml;base64,' + Buffer.from(svgOf(f)).toString('base64');
  await p.setContent(`<html><body style="margin:0;font-family:sans-serif">
    <div style="background:#fff4dc;padding:60px;display:flex;gap:60px;align-items:center">
      <img src="${img('cmcards-logo.svg')}" style="height:120px">
      <img src="${img('cmcards-icon.svg')}" style="height:120px">
      <img src="${img('cmcards-logo.svg')}" style="height:30px">
      <img src="${img('cmcards-favicon.svg')}" style="height:16px">
      <img src="${img('cmcards-favicon.svg')}" style="height:32px"></div>
    <div style="background:#1e1a16;padding:60px"><img src="${img('cmcards-logo-white.svg')}" style="height:110px"></div>
    <div><img src="${img('cmcards-og.svg')}" style="width:600px;display:block"></div></body></html>`);
  await p.screenshot({ path: path.join(__dirname, 'board.png'), fullPage: true });
  console.log('tools/brand/board.png');
  await b.close();
})();
