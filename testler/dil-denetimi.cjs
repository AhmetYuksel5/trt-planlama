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
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
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
  // Balonla üretilen pakette dil denetimi parça parça: kart parçanın kimliğini taşıyor.
  const pk = d.paketler.find((x) => x.id === id);
  const parca = pk ? null : d.paketler.flatMap((x) => x.parcalar ?? []).find((x) => x.id === id);
  if (pk) ok(pk.metin === "نص مدقق للاختبار" && pk.adim !== "dil", "düzeltilmiş metin pakete yazıldı, iş sonraki durağa geçti: " + pk.adim);
  else ok(parca && parca.metin === "نص مدقق للاختبار" && parca.asama === "tamam", "düzeltilmiş parça yazıldı, parça hazır: " + parca?.asama);
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
  // Script Editor'süz yayınlanmış eski yapı ve Output'ta kalmış dil denetmeni (gerçek sitedeki durum)
  let e = await veri();
  const yapiEski = { surum: 1, id: "y-eski", zaman: new Date().toISOString(), yayinlayan: "yo3", birimler: [
    { id: "output", unvanlar: ["yonetici", "dilDenetmeni", "editor", "tercuman"], ust: "bOutput" },
    ...["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "media", "muhabir", "yonetim"].map((id) => ({ id })),
  ], unvanlar: [], akislar: [{ id: "uretim", kollar: ["haber", "feature", "ekonomi", "program"], duraklar: [
    { id: "metin", tur: "metin", sorumlu: { tur: "birim", birim: "muhabir" }, asama: "uretim" },
    { id: "dil", tur: "dil", sorumlu: { tur: "birim", birim: "output" }, geriGonderir: true, asama: "uretim" },
    { id: "video", tur: "video", sorumlu: { tur: "birim", birim: "muhabir" }, asama: "uretim" },
  ] }], kolSahibi: { haber: "newsdesk", feature: "planlama", ekonomi: "planlama", program: "program" } };
  e.yapilar = [yapiEski];
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "ou3"));
  e.kisiler.find((k) => k.id === "ou3").birim = "output";
  const dp = e.paketler.find((x) => x.durum === "uretimde");
  Object.assign(dp, { adim: "dil", akis: undefined, uretim: undefined, parcalar: undefined });
  await p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, e);
  await git("#/");
  await p.waitForTimeout(500);
  e = await veri();
  ok(e.kisiler.find((k) => k.id === "ou3").birim === "scriptEditor", "Output'ta kalan dil denetmeni Script Editor'e geçti");
  ok((await p.locator("[data-dd-metin='" + dp.id + "']").count()) === 1, "eski yapıda da dil durağı Script Editor'ün: metin sayfada");
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
  await git("#/organizasyon/birimler");
  ok((await p.getByText("Script Editor").count()) > 0, "Organizasyon'da Script Editor birimi görünüyor");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
