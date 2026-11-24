// İmla denetimi (kullanıcı: plan metinlerinde imla düzeltilsin ama sürpriz olmasın): öneriler işaretsiz gelir,
// yalnız seçilen yazılır, satırın geri kalanı ve sözcük düzeni değişmez, ↶ geri alır. Weekly'de de.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
const ASIL = "وصل الرئيس الي انقرة لبحث ملف اسرائيل مع NATO في 15 نوفمبر";
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/nd-yarin");
  const gid = await p.evaluate(([k, asil]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const g = d.gelismeler.find((x) => x.planId === "nd-yarin");
    g.metin = asil;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return g.id;
  }, [K, ASIL]);
  await git("#/nextday/nd-yarin");
  await p.locator(".pb-uc button[aria-haspopup]").click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-arac="imla"]').count()) === 1, "Next Day ⋯ menüsünde İmla denetimi");
  await p.locator('[data-arac="imla"]').click();
  await p.locator("[data-imla-satir], [data-imla-yok]").first().waitFor();
  const satir = p.locator(`[data-imla-satir="g:${gid}"]`);
  ok((await satir.count()) === 1, "hatalı gelişme listede");
  const oneriler = await satir.locator("[data-imla-oneri]").count();
  ok(oneriler === 3, `üç öneri (الي, انقرة, اسرائيل): ${oneriler}`);
  ok((await p.locator("[data-imla-penceresi] input[type=checkbox]:checked").count()) === 0, "öneriler işaretsiz gelir");
  ok(await p.locator("[data-imla-uygula]").isDisabled(), "seçim yokken uygula pasif");
  let d = await veri();
  ok(d.gelismeler.find((x) => x.id === gid).metin === ASIL, "pencere açılınca kayıt değişmedi");
  // Yalnız ikisi seçiliyor.
  await satir.locator(`[data-imla-oneri="g:${gid}#2"] input`).check();
  await satir.locator(`[data-imla-oneri="g:${gid}#3"] input`).check();
  await p.locator("[data-imla-uygula]").click();
  await p.waitForTimeout(400);
  d = await veri();
  const yeni = d.gelismeler.find((x) => x.id === gid).metin;
  ok(yeni === "وصل الرئيس إلى أنقرة لبحث ملف اسرائيل مع NATO في 15 نوفمبر", `yalnız seçilenler değişti: ${yeni}`);
  ok(d.hareketler.some((h) => h.tip === "imlaDuzeltildi" && h.veri?.sayi === "2"), "hareket yazıldı");
  // Geri al.
  await p.locator("[data-geri-al]").first().click();
  await p.waitForTimeout(400);
  ok((await veri()).gelismeler.find((x) => x.id === gid).metin === ASIL, "↶ geri aldı");

  // Weekly kalemi.
  const [hid, kid] = await p.evaluate(([k, asil]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum !== "kesinlesti") ?? d.haftalik[0];
    h.durum = "hazirlik";
    h.kalemler[0].metin = asil;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return [h.id, h.kalemler[0].id];
  }, [K, ASIL]);
  await git(`#/haftalik/${hid}`);
  await p.locator(".pb-uc button[aria-haspopup]").click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-arac="imla"]').count()) === 1, "Weekly ⋯ menüsünde İmla denetimi");
  await p.locator('[data-arac="imla"]').click();
  await p.locator("[data-imla-satir], [data-imla-yok]").first().waitFor();
  await p.locator("[data-imla-hepsi]").check();
  const n = await p.locator("[data-imla-penceresi] [data-imla-oneri] input:checked").count();
  await p.locator("[data-imla-uygula]").click();
  await p.waitForTimeout(400);
  const km = (await veri()).haftalik.find((x) => x.id === hid).kalemler.find((x) => x.id === kid).metin;
  ok(n >= 3 && km === "وصل الرئيس إلى أنقرة لبحث ملف إسرائيل مع NATO في 15 نوفمبر", `Weekly: hepsi uygulandı, sayı ve Latin ad yerinde (${km})`);

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/haftalik/${hid}`);
    await p.locator(".pb-uc button[aria-haspopup]").click();
    await p.waitForTimeout(200);
    await p.locator('[data-arac="imla"]').click();
    await p.locator("[data-imla-satir], [data-imla-yok]").first().waitFor();
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma === 0, `390px taşma yok (${dil}): ${tasma}`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
