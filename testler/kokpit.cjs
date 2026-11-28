// Yönetici kokpiti (kullanıcı: yöneticiler yoğun, basit ve havalı şeyler sever, kontrol hissi; planın
// yalnız başlıkları ve seçince ayrıntı; muhabir görevlendirmeleri, özel yayınlar, istatistik grafikleri):
// kademedeki müdürün ana sayfası ve menüsü; tam yönetici Planlama'nın sayfasında, kokpit #/panel'de.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const gir = async (yol, kim = "yo1", dil = "tr") => {
    await p.goto(B);
    await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [kim, dil]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1100);
  };
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await gir("#/");
  ok((await p.locator("[data-kokpit]").count()) === 1, "Input müdürünün ana sayfası kokpit");
  ok(["iyi", "uyari", "kotu"].includes(await p.locator("[data-kp-nabiz]").getAttribute("data-kp-nabiz")), "kanalın nabzı ışıkla");
  ok((await p.locator("[data-ap-cizgi]").count()) === 1, "günün zaman çizgisi");
  // Başlık özeti
  const bas = p.locator("[data-kp-baslik]");
  ok((await bas.count()) >= 2, "yarının başlıkları listede: " + (await bas.count()));
  ok((await p.locator("[data-kp-baslik][open]").count()) === 0, "başlıklar kapalı gelir");
  await bas.first().locator("summary").click();
  ok((await p.locator("[data-kp-baslik][open] .kp-ayrinti").count()) === 1, "başlığa basınca ayrıntı yerinde açılır");
  const acik = p.locator("[data-kp-baslik][open]");
  ok((await acik.locator(".kp-gelisme, .kp-pkg").count()) >= 1, "ayrıntıda gelişme ya da PKG");
  await p.locator('[data-kp-sekme="hafta"]').click();
  await p.waitForTimeout(200);
  ok((await p.locator("[data-kp-dosya], [data-kp-ana]").count()) >= 1 || (await p.locator("[data-kp-basliklar] .kp-bos").count()) === 1, "Bu hafta sekmesi dosyaları gösterir");
  await p.locator('[data-kp-sekme="yarin"]').click();
  await p.waitForTimeout(200);
  // Özel yayınlar, görevlendirmeler, istatistik, hat, verdiklerim
  ok((await p.locator("[data-kp-ozel]").count()) === 1, "özel yayınlar paneli");
  const kart = p.locator("[data-kp-ozel-kart]");
  if (await kart.count()) ok((await kart.first().locator(".kp-asamalar span").count()) === 4, "özel yayın kartında dört aşama çubuğu");
  ok((await p.locator("[data-kp-gorevler]").count()) === 1, "görevlendirme paneli");
  ok((await p.locator(".kp-gant-cubuk").count()) >= 1 || (await p.locator("[data-kp-gorevler] .kp-bos").count()) === 1, "haftanın şeridi: " + (await p.locator(".kp-gant-cubuk").count()));
  ok((await p.locator("[data-kp-istatistik] svg").count()) >= 2, "istatistikte çizgi ve halka grafiği");
  ok((await p.locator("[data-kp-ilk-bes] .kp-cubuk-satir").count()) >= 1 || (await p.locator("[data-kp-istatistik] .kp-bos").count()) >= 1, "ayın ilk beşi");
  ok((await p.locator("[data-kp-istasyon]").count()) >= 5, "üretim hattının istasyonları");
  ok((await p.locator(".birim-kartlari a[href^='#/panel/']").count()) >= 3, "birimler birime inen bağlantıyla");
  ok((await p.locator("[data-kp-verdiklerim] .kp-verdik-is").count()) >= 1, "verdiklerim: açık talimatlar");
  ok((await p.locator("[data-kokpit] [data-oneri-ekle], [data-kokpit] [data-oneri-hizli-ret]").count()) === 0, "kokpitte karar düğmesi yok");
  // "Planda aç" planın kendisine
  await bas.first().locator("summary").click();
  const ac = p.locator("[data-kp-baslik][open] [data-kp-planda-ac]");
  if (await ac.count()) {
    await ac.click();
    await p.waitForTimeout(800);
    ok(/#\/nextday\//.test(p.url()), "Planda aç planı açar: " + p.url().split("#")[1]);
  }
  // Menü
  await gir("#/");
  const menu = await p.locator('[data-birim-menusu="yonetim"]').count();
  ok(menu === 1, "yöneticinin kendi menüsü");
  const yollar = await p.locator("#ana-menu a[href^='#/']").evaluateAll((l) => l.map((a) => a.getAttribute("href")));
  ok(yollar.includes("#/hareketler") && yollar.includes("#/ozel") && yollar.includes("#/raporlar"), "menüde görevlendirmeler, özel yayın, raporlar");
  ok(!yollar.includes("#/oneriler") && !yollar.includes("#/posta"), "menüde öneriler ve posta yok");
  // Program müdürü de kokpitte, kendi kapsamıyla
  await gir("#/", "yo2");
  ok((await p.locator("[data-kokpit]").count()) === 1 && (await p.locator(".birim-kartlari a[href='#/panel/program']").count()) === 1, "Program müdürü kendi kapsamıyla");
  // Tam yönetici Planlama'nın sayfasında, kokpit #/panel'de
  await gir("#/", "yo3");
  ok((await p.locator("[data-kokpit]").count()) === 0, "tam yönetici ana sayfası değişmedi");
  await gir("#/panel", "yo3");
  ok((await p.locator("[data-kokpit]").count()) === 1, "tam yönetici kokpiti panelden açar");
  // Eski tasarımda eski panel
  await p.evaluate(() => localStorage.setItem("trt-planlama-tasarim", "eski"));
  await gir("#/");
  ok((await p.locator("[data-kokpit]").count()) === 0 && (await p.locator(".birim-kartlari").count()) === 1, "eski tasarımda eski panel");
  await p.evaluate(() => localStorage.removeItem("trt-planlama-tasarim"));
  await p.screenshot({ path: process.env.GORUNTU || "/tmp/kokpit.png", fullPage: true });
  // Telefon ve Arapça
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await gir("#/", "yo1", dil);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `390px taşma yok (${dil}): ${tasma}`);
    ok(!(await p.locator(".kp-gant").isVisible()) && (await p.locator("[data-kp-gorev-liste]").count()) <= 1, `telefonda şerit yerine liste (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
