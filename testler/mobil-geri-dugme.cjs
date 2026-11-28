// Telefonda sayfalar arası geri (kullanıcı: mobil uygulamada geri yoktu; üstte düğme istenmedi,
// ekran kaydırılınca geri gitsin): sol ya da sağ kenardan içeri yatay kaydırma bir önceki sayfaya
// döner. Android'de her yerde; iPhone'da yalnız ana ekran uygulamasında (Safari'nin kendi hareketi var).
const { chromium, devices } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const ac = async (cihaz, dil, dene) => {
    const c = await b.newContext({ ...devices[cihaz] });
    if (dene) await c.addInitScript(() => (window.__geriKaydirmaDene = true));
    const p = await c.newPage();
    p.on("pageerror", (e) => hatalar.push(String(e)));
    await p.goto(B);
    await p.evaluate((dil) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", dil); localStorage.setItem("trt-planlama-oturum", "pl2"); }, dil);
    await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
    const kaydir = async (x0, x1, y = 400) => {
      const s = await c.newCDPSession(p);
      await s.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= 8; i++) await s.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / 8, y }] });
      await s.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await p.waitForTimeout(500);
    };
    const git = async (h) => { await p.evaluate((h) => (location.hash = h), h); await p.waitForTimeout(600); };
    return { c, p, kaydir, git, w: await p.evaluate(() => innerWidth) };
  };

  for (const dil of ["tr", "ar"]) {
    const { c, p, kaydir, git, w } = await ac("Pixel 7", dil, false);
    ok((await p.locator("[data-ust-geri]").count()) === 0, dil + ": üst çubukta geri düğmesi yok");
    await git("#/oneriler");
    await kaydir(5, 160);
    ok(p.url().endsWith("#/"), dil + ": Android, soldan sağa kaydırma geri gider");
    await git("#/paketler");
    await kaydir(w - 5, w - 160);
    ok(p.url().endsWith("#/"), dil + ": Android, sağdan sola kaydırma geri gider");
    await git("#/paketler");
    await kaydir(120, 280);
    ok(p.url().endsWith("#/paketler"), dil + ": kenardan başlamayan kaydırma geri gitmez");
    await kaydir(5, 40);
    ok(p.url().endsWith("#/paketler"), dil + ": kısa kaydırma geri gitmez");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, dil + ": taşma yok");
    await c.close();
  }
  // iPhone: Safari sekmesinde kapalı (kendi hareketi var), ana ekran uygulamasında açık.
  {
    const { c, p, kaydir, git } = await ac("iPhone 13", "tr", false);
    await git("#/oneriler");
    await kaydir(5, 160);
    ok(p.url().endsWith("#/oneriler"), "iPhone Safari sekmesinde hareket kapalı");
    await c.close();
  }
  {
    const { c, p, kaydir, git } = await ac("iPhone 13", "tr", true);
    await git("#/oneriler");
    await kaydir(5, 160);
    ok(p.url().endsWith("#/"), "iPhone ana ekran uygulamasında kenardan geri");
    await c.close();
  }
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
