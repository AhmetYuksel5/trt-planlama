// Dil denetmeni: tek sayfa (sırası gelen metinler), düzelt ve gönder; sade menü; 390px
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "ou2"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/");
  ok((await p.locator("[data-dil-menusu] a").count()) === 1 && (await p.locator(".menu .menu-grup").count()) === 2, "menüde yalnız sayfası ve Ayarlar");
  const kartlar = p.locator("[data-dd-metin]");
  const n = await kartlar.count();
  ok(n >= 1, "sırası gelen metinler listede: " + n);
  ok((await p.locator("[data-dil-menusu] a").innerText()).includes(String(n)), "menüdeki sayı sıradaki metin sayısı");
  const id = await kartlar.first().getAttribute("data-dd-metin");
  await kartlar.first().locator("textarea").fill("نص مدقق للاختبار");
  await kartlar.first().locator("[data-dd-gonder]").click();
  await p.waitForTimeout(300);
  const d = await veri();
  const pk = d.paketler.find((x) => x.id === id);
  ok(pk.metin === "نص مدقق للاختبار" && pk.adim !== "dil", "düzeltilmiş metin pakete yazıldı, iş sonraki durağa geçti: " + pk.adim);
  ok((await p.locator("[data-dd-metin]").count()) === n - 1, "gönderilen metin listeden kalktı");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 900 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/");
    const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(t <= 0, `390 pikselde taşma yok (${dil}) ${t}`);
  }
  // Output yöneticisi eski ana sayfasını görür
  await p.setViewportSize({ width: 1440, height: 1000 });
  const yon = d.kisiler.find((k) => k.birim === "output" && k.rol === "yonetici");
  await p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), yon.id);
  await git("#/");
  ok((await p.locator("[data-dil-menusu]").count()) === 0, "Output yöneticisi sade düzende değil");
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
