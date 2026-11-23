// Plan belgelerinde başlıklar arası tek boş satır (kullanıcı: satır aralığı artırılarak değil, birer boş satırla):
// Word dosyasında ve e-posta kopyasında başlıkların önünde boş paragraf, başlığın üst boşluğu yok; ekranda bir satır.
const { chromium } = require(process.env.PW || "playwright");
const fs = require("fs");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await c.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:4173" });
  const p = await c.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-baski", ""); });
  const bos = /<p[^>]*>(&nbsp;| )<\/p>\s*<h3/g;
  for (const [ad, yol] of [["Next Day", "#/nextday/nd-yarin/cikti"], ["Weekly", null]]) {
    let hedef = yol;
    if (!hedef) {
      const id = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")).haftalik?.[0]?.id);
      if (!id) continue;
      hedef = `#/haftalik/${id}/cikti`;
    }
    await p.goto("about:blank");
    await p.goto(B + hedef);
    await p.waitForTimeout(1200);
    // Ekran: haber başlığının üstü bir gövde satırı (14,5px × 1,15), eski 1,30 satır değil.
    const ust = await p.locator("article.cikti h3").first().evaluate((x) => parseFloat(getComputedStyle(x).marginTop)).catch(() => NaN);
    ok(Math.abs(ust - 14.5 * 1.15) < 0.6, `${ad}: ekranda başlık üstü bir satır (${ust}px)`);
    // E-posta kopyası.
    await p.getByRole("button", { name: "E-posta için kopyala" }).click();
    await p.waitForTimeout(400);
    const h = await p.evaluate(async () => { const [it] = await navigator.clipboard.read(); return (await it.getType("text/html")).text(); });
    ok((h.match(bos) ?? []).length >= 2, `${ad}: e-posta kopyasında başlıkların önünde boş satır (${(h.match(bos) ?? []).length})`);
    ok(!/19pt/.test(h), `${ad}: e-posta kopyasında başlığın üst boşluğu yok`);
    // Word.
    const [indirme] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: /Word/ }).first().click()]);
    const w = fs.readFileSync(await indirme.path(), "utf8");
    ok((w.match(bos) ?? []).length >= 2, `${ad}: Word'de başlıkların önünde boş satır`);
    ok(!/19pt/.test(w), `${ad}: Word'de başlığın üst boşluğu yok`);
    ok(!/^\s*<p[^>]*>&nbsp;<\/p>/.test(w.split("<body")[1].replace(/^[^>]*>/, "")), `${ad}: belge boş satırla başlamıyor`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
