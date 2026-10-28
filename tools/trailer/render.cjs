/* Le rendu de la bande-annonce : la page /trailer (npm run dev) photographiée image par
   image, puis montée avec la musique en MP4.
     node tools/trailer/render.cjs            tout, en 4 morceaux en parallèle
     node tools/trailer/render.cjs 10 14.5    refait de 10 s à 14,5 s (le film est remonté si tout y est)
   Sortie : tools/trailer/out/cmcards-trailer.mp4 (1920 × 1080, 60 i/s). */

const { chromium } = require("playwright");
const { execFileSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { open, settle } = require("./engine.cjs");

const BASE = process.env.BASE ?? "http://localhost:3000";
const FPS = 60;
const OUT = path.join(__dirname, "out");
const FRAMES = path.join(OUT, "frames");
const WORKERS = 4;

async function worker(from, to) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await open(ctx, `${BASE}/trailer`, { warm: 0.2 });
  await page.waitForFunction(() => window.__seek, null, { timeout: 120_000 });
  for (let f = from; f < to; f++) {
    const t = f / FPS;
    await page.evaluate((t) => window.__seek(t), t);
    await page.clock.runFor(1000 / FPS);
    await settle(page);
    /* les animations CSS des cartes et des boosters : réglées sur le temps du film */
    await page.evaluate(async (ms) => {
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => 0))));
    }, t * 1000);
    await page.screenshot({ path: path.join(FRAMES, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 95 });
    if (f % 60 === 0) process.stdout.write(`${t.toFixed(0)}s `);
  }
  await browser.close();
}

(async () => {
  if (process.argv[2] === "--worker") return worker(+process.argv[3], +process.argv[4]);
  fs.mkdirSync(FRAMES, { recursive: true });
  const probe = await chromium.launch();
  const p = await probe.newPage();
  await p.goto(`${BASE}/trailer`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.__dur, null, { timeout: 120_000 });
  const dur = await p.evaluate(() => window.__dur);
  await probe.close();
  const a = process.argv[2] ? Math.round(+process.argv[2] * FPS) : 0;
  const b = process.argv[3] ? Math.round(+process.argv[3] * FPS) : Math.round(dur * FPS);
  if (!process.argv[2]) for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f));
  const step = Math.ceil((b - a) / WORKERS);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, (_, k) => new Promise((res, rej) => {
    const s = a + k * step, e = Math.min(b, s + step);
    if (s >= e) return res();
    const c = spawn(process.execPath, [__filename, "--worker", s, e], { stdio: "inherit" });
    c.on("exit", (code) => (code ? rej(new Error(`worker ${k}: ${code}`)) : res()));
  })));
  console.log(`\n${b - a} images en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  /* le film, dès que toutes les images sont là */
  const total = Math.round(dur * FPS);
  if (fs.readdirSync(FRAMES).filter((f) => f.endsWith(".jpg")).length < total) return;
  const music = path.join(OUT, "music.wav");
  if (!fs.existsSync(music)) execFileSync("python3", [path.join(__dirname, "music.py")], { stdio: "inherit" });
  const mp4 = path.join(OUT, "cmcards-trailer.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(FRAMES, "%05d.jpg"), "-i", music,
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "256k", "-shortest", mp4], { stdio: "inherit" });
  console.log(mp4);
})();
