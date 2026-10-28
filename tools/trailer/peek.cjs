/* Des images fixes de la bande-annonce, pour vérifier le montage : node tools/trailer/peek.cjs 4.6 10 …
   (une planche dans tools/trailer/peek.jpg ; la page tourne avec npm run dev) */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const path = require("path");
(async () => {
  const ts = process.argv.slice(2).map(Number);
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(`${process.env.BASE ?? "http://localhost:3000"}/trailer`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__seek, null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const files = [];
  for (const t of ts) {
    await page.evaluate((t) => window.__seek(t), t);
    await page.waitForTimeout(400);
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => 0))));
    const f = path.join(__dirname, `peek-${t}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 80 });
    files.push(f);
  }
  await b.close();
  const n = files.length, cols = n > 4 ? 3 : 2;
  const layout = files.map((_, i) => `${(i % cols) ? Array(i % cols).fill("w0").join("+") : "0"}_${Math.floor(i / cols) ? Array(Math.floor(i / cols)).fill("h0").join("+") : "0"}`).join("|");
  const args = files.flatMap((f) => ["-i", f]);
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args, "-filter_complex", n > 1 ? `xstack=inputs=${n}:layout=${layout}:fill=black,scale=1920:-1` : "scale=1920:-1", path.join(__dirname, "peek.jpg")]);
  for (const f of files) require("fs").unlinkSync(f);
})();
