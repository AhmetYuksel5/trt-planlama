// Planı gönder (kullanıcı): onaylanan Next Day ve kesinleşen Weekly'nin üstünde zarf; alıcılar ve konu
// Ayarlar'daki şablondan, gövde planın kendisi. Taslak planda zarf yok; gönderilince işaretli.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/nd-yarin");
  ok((await p.locator("[data-plan-gonder]").count()) === 0, "taslak planda zarf yok");

  // Ayarlar: Next Day şablonu.
  await git("#/ayarlar");
  await p.locator("details:has([data-gb-sablonlari]) > summary").click();
  ok((await p.locator('[data-gb-sablonlari] [data-gb-sablonu]:not([data-gb-sablonu="takdir"]):not([data-gb-sablonu="ozel-gorev"])').count()) === 3, "geri bildirim listesi karışmadı");
  ok((await p.locator("[data-gb-sablonlari] [data-plan-gonder-duzenle]").count()) === 0, "planların postası geri bildirim kartında değil");
  await p.locator("details:has([data-plan-postasi]) > summary").click();
  await p.locator('[data-plan-gonder-duzenle="nextday"]').click();
  await p.locator("[data-pg-sablon-gonderen]").fill("planlama@ornek.local");
  await p.locator("[data-pg-sablon-kime]").fill("haber@ornek.local");
  await p.locator("[data-pg-sablon-cc]").fill("mudur@ornek.local, editor@ornek.local");
  await p.locator("[data-pg-sablon-konu]").fill("خطة الغد - {tarih}");
  await p.locator("[data-pg-sablon-metin]").fill("مرحبًا،\nالخطة أدناه.");
  await p.locator("[data-pg-sablon-kaydet]").click();
  await p.waitForTimeout(300);
  let d = await veri();
  const s = d.geriBildirimSablonlari.find((x) => x.id === "plan-gonder-nd");
  ok(s && s.kime === "haber@ornek.local" && s.gonderen === "planlama@ornek.local" && s.konu === "خطة الغد - {tarih}", "şablon kaydedildi");
  ok(d.geriBildirimSablonlari.filter((x) => !["plan-gonder-nd", "plan-gonder-hf", "takdir-bildirimi"].includes(x.id)).length >= 3, "geri bildirim şablonları duruyor");

  // Planı onayla (kayıtta) ve gönder.
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.planlar = d.planlar.map((x) => (x.id === "nd-yarin" ? { ...x, durum: "onayli" } : x));
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);
  for (const gorunum of ["klasik", "yeni"]) {
    await p.evaluate((g) => localStorage.setItem("trt-planlama-nd-gorunum", g), gorunum);
    await git("#/nextday/nd-yarin");
    ok((await p.locator("[data-plan-gonder]").count()) === 1, `${gorunum}: onaylı planda zarf`);
  }
  await p.evaluate(() => localStorage.setItem("trt-planlama-nd-gorunum", "klasik"));
  await git("#/nextday/nd-yarin");
  await p.locator("[data-plan-gonder]").click();
  const pen = p.locator("[data-plan-gonder-penceresi]");
  ok((await pen.locator("[data-pg-gonderen]").getAttribute("data-pg-gonderen")) === "planlama@ornek.local", "Gönderen şablondan");
  ok((await pen.locator("[data-pg-kime]").getAttribute("data-pg-kime")) === "haber@ornek.local", "Kime şablondan");
  ok((await pen.locator("[data-pg-cc]").getAttribute("data-pg-cc")) === "mudur@ornek.local,editor@ornek.local", "CC şablondan");
  const konu = await pen.locator("[data-pg-konu]").inputValue();
  ok(konu.startsWith("خطة الغد - ") && !konu.includes("{tarih}"), `konu tarihle dolu (${konu})`);
  ok((await pen.locator("article.cikti h3").count()) > 0, "önizlemede planın kendisi");
  await p.locator("[data-plan-gonder-gonder]").click();
  await p.waitForTimeout(400);
  d = await veri();
  ok(!!d.planlar.find((x) => x.id === "nd-yarin").gonderildi, "plan gönderildi işaretlendi");
  ok((await p.locator('[data-plan-gonder="gonderildi"]').count()) === 1, "zarf gönderildi işaretli");

  // Weekly: kesinleşmiş hafta.
  const hid = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik[0];
    h.durum = "kesinlesti";
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return h.id;
  }, K);
  await git(`#/haftalik/${hid}`);
  await p.locator("[data-plan-gonder]").click();
  const hk = await p.locator("[data-pg-konu]").inputValue();
  ok(hk.startsWith("الأجندة الأسبوعية ") && !hk.includes("{aralik}"), `Weekly varsayılan konu (${hk})`);
  await p.locator("[data-plan-gonder-gonder]").click();
  await p.waitForTimeout(400);
  ok(!!(await veri()).haftalik.find((x) => x.id === hid).gonderildi, "Weekly gönderildi işaretlendi");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/nextday/nd-yarin");
    await p.locator("[data-plan-gonder]").first().click();
    await p.waitForTimeout(300);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma === 0, `390px taşma yok (${dil}): ${tasma}`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
