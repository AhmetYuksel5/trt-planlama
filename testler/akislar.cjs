// Organizasyon › İş akışları (kullanıcı: sayfanın bir şeye bağlı olup olmadığı anlaşılmıyordu): her akışın yanında
// şu an kaç paket o akışta; "Aşama" yalnız haber kolunu taşıyan akışta; eski yolun durak türleri ayrı grupta.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const hatalar = []; p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const ac = async (dil = "tr") => {
    await p.goto(B); await p.evaluate((d) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", d); }, dil);
    await p.goto("about:blank"); await p.goto(B + "#/organizasyon/akislar"); await p.waitForTimeout(900);
  };
  await ac();
  const v = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const uretimde = v.paketler.filter((x) => x.durum === "uretimde").length;
  const sayilar = await p.locator("[data-akis-paket]").evaluateAll((l) => l.map((e) => Number(e.getAttribute("data-akis-paket"))));
  ok(sayilar.length >= 1 && sayilar.reduce((a, x) => a + x, 0) === uretimde, `akışların paket sayıları üretimdekilerin toplamı (${sayilar} / ${uretimde})`);
  await p.locator('[data-durak] button[aria-label="Düzenle"]').first().click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-durak-asama]").count()) === 1, "haber kolunu taşıyan akışta Aşama seçimi var");
  ok((await p.locator("[data-durak-eski-turler] option").count()) > 0, "eski yolun türleri ayrı grupta");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.locator("[data-akis-ekle]").click(); await p.waitForTimeout(300);
  await p.locator("[data-akis-formu] input").first().fill("Masalar");
  for (const k of ["ekonomi", "program", "spor"]) await p.locator(`[data-akis-kol="${k}"]`).check();
  await p.locator("[data-akis-kaydet]").click(); await p.waitForTimeout(500);
  await p.locator('[data-durak] button[aria-label="Düzenle"]').first().click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-durak-asama]").count()) === 0, "masa akışında Aşama seçimi yok");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 }); await ac(dil);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
