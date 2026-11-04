// Aylık plan: adım adım olay ekleme, belge, onay; Weekly'de "Aylık plandan" ve Özel yayın önerisi; 390 pikselde taşma
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
  const kim = (id) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), id);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await kim("pl1");
  await git("#/aylik");
  ok((await p.locator("[data-ay-olay]").count()) === 3, "örnek ayın üç olayı belgede");
  await p.click("[data-ay-olay-ekle]");
  await p.fill("[data-ay-baslik]", "مؤتمر المناخ");
  await p.click("[data-ay-ileri]");
  const d0 = await veri();
  const gun = d0.aylik[0].ay + "-20";
  await p.fill("[data-ay-tarih]", gun);
  await p.click("[data-ay-ileri]");
  await p.click("[data-ay-ileri]");
  await p.click("[data-ay-satir-ekle]");
  await p.click("[data-ay-ileri]");
  await p.click("[data-ay-ekip-ekle]");
  await p.locator(".pencere .satir .secim input").first().check();
  await p.click("[data-ay-kaydet]");
  await p.waitForTimeout(300);
  let d = await veri();
  const yeni = d.aylik.flatMap((a) => a.olaylar ?? []).find((o) => o.baslik === "مؤتمر المناخ");
  ok(yeni && yeni.tarih === gun && yeni.gunler[0]?.satirlar[0]?.tur === "pkg" && yeni.ekip[0]?.gorev === "muhabir", "olay adım adım kaydedildi (gün, PKG satırı, ekip) " + JSON.stringify(yeni));
  ok((await p.locator("[data-ay-olay]").count()) === 4, "yeni olay belgede");
  ok((await p.locator(".ay-belge h1").innerText()).includes("الخطة الشهرية المتوقعة"), "belge başlığı kurumun Arapçasıyla");
  ok((await p.locator(".ay-tablo").count()) === 1, "tek görevlendirme tablosu");
  // Weekly: bu haftaya düşen olay gündeme alınır
  const hedef = d.haftalik.filter((h) => h.durum !== "kesinlesti").find((h) => {
    const son = new Date(h.baslangic); son.setDate(son.getDate() + 6);
    const s = son.toISOString().slice(0, 10);
    return d.aylik[0].olaylar.some((o) => o.tarih <= s && (o.bitis || o.tarih) >= h.baslangic);
  });
  if (hedef) {
    await git("#/haftalik/" + hedef.id);
    ok((await p.locator("[data-aylik-plandan] li").count()) > 0, "Weekly'de 'Aylık plandan' bölümü");
    await p.evaluate(() => document.querySelector("[data-aylik-plandan]")?.closest("details")?.setAttribute("open", ""));
    const dg = p.locator("[data-aylik-gundeme]").first();
    const olayId = await dg.getAttribute("data-aylik-gundeme");
    await dg.click();
    await p.waitForTimeout(300);
    d = await veri();
    const h2 = d.haftalik.find((h) => h.id === hedef.id);
    ok(h2.kalemler.some((k) => k.aylikOlayId === olayId), "olay haftanın gündemine kalem olarak girdi");
  } else ok(false, "örnekte aylık olaya denk gelen açık hafta yok");
  // Özel yayın önerisi
  await git("#/ozel");
  ok((await p.locator("[data-aylik-ozel] li").count()) === 1, "Özel yayında aylık plandan öneri");
  await p.locator("[data-aylik-ozel] button").click();
  await p.waitForTimeout(500);
  d = await veri();
  const oz = d.aylik[0].olaylar.find((o) => o.id === "ao-ozel");
  ok(oz.ozelId && d.ozel.some((x) => x.id === oz.ozelId), "öneri özel yayın olarak açıldı");
  // Onay
  // Onay Plan yetkilerinde (ayOnay): varsayılan Planlama yöneticisi
  await git("#/aylik");
  await p.click("[data-ay-onayla]");
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.aylik[0].durum === "onayli", "aylık plan onaylandı");
  // Telefon
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 900 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await kim("pl1");
    await git("#/aylik");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(tasma <= 0, `390 pikselde taşma yok (${dil}) ${tasma}`);
  }
  await p.setViewportSize({ width: 390, height: 900 });
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await git("#/aylik");
  await p.click("[data-ay-geri-al]");
  await p.waitForTimeout(300);
  await p.click("[data-ay-olay='ao-zirve']");
  for (let i = 0; i < 4; i++) await p.click("[data-ay-ileri]");
  const pt = await p.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, ...[...document.querySelectorAll("dialog[open] *")].map((e) => e.getBoundingClientRect().right - innerWidth)));
  ok((await p.locator("dialog[open]").count()) === 1 && pt <= 1, "telefonda form açık ve taşmıyor (ekip adımı) " + pt);
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
