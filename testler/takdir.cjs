// Takdir bildirimi: plan onaylanınca sayfa açılır, kabul edilen paketler listelenir, önizleme şablondan (Arapça, cinsiyetsiz),
// adresi olmayan seçilemez, işaretlenen gönderilir ve "gönderildi" yazar; Ayarlar'daki şablon değişikliği postaya yansır; 390px taşma yok.
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(900); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/nextday/yarin");
  let d = await veri();
  const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
  plan.durum = "toplantida";
  // Planda iki muhabirli paket: biri adresli, öbürü adressiz (kurgusal adres).
  const muhabirler = d.kisiler.filter((k) => k.birim === "muhabir");
  const [m1, m2] = muhabirler;
  m1.eposta = "muhabir.bir@ornek.test";
  delete m2.eposta; delete m2.kisiselEposta;
  const taban = d.paketler.find((x) => x.planId === plan.id) ?? d.paketler[0];
  const pk = (id, muhabirId, baslik) => ({ ...taban, id, kod: id, planId: plan.id, planBaslikId: plan.basliklar[0]?.id, muhabirId, baslik, aciklama: "تفاصيل التقرير", durum: "degerlendiriliyor", notlar: [], ozelId: undefined, muhabirTbc: undefined, takdirBildirimi: undefined, oneriId: undefined });
  d.paketler = d.paketler.filter((x) => x.planId !== plan.id).concat([pk("tk1", m1.id, "عنوان التقرير الأول"), pk("tk2", m2.id, "عنوان التقرير الثاني")]);
  await yaz(d);
  await git("#/nextday/" + plan.id);
  await p.locator("button", { hasText: "Planı onayla" }).click();
  await p.waitForTimeout(900);
  ok(p.url().endsWith(`/nextday/${plan.id}/takdir`), "onaydan sonra takdir sayfası açıldı");
  ok((await p.locator("[data-takdir-paket]").count()) === 2, "kabul edilen iki paket listede");
  const sec = (id) => p.locator(`[data-takdir-paket="${id}"] [data-takdir-secim]`);
  ok(await sec("tk1").isChecked(), "adresli paket işaretli gelir");
  ok(await sec("tk2").isDisabled(), "adressiz paket seçilemez");
  await p.locator('[data-takdir-paket="tk1"] [data-takdir-onizle]').click();
  const on = await p.locator('[data-takdir-paket="tk1"] [data-takdir-onizleme]').innerText();
  ok(on.includes("تكليف تقرير من") && on.includes("| عنوان التقرير الأول"), "konu: تكليف تقرير من şehir | strap");
  ok(on.includes("مرحبًا") && on.includes("نرجو منك") && !on.includes("الزميل"), "metin cinsiyetsiz hitap ve نرجو منك");
  ok(!on.includes("ملاحظة"), "notsuz pakette ملاحظة satırı yok");
  ok(!/\{\w+\}/.test(on), "doldurulmamış alan kalmadı");
  await p.locator("[data-takdir-gonder]").click();
  await p.waitForTimeout(700);
  d = await veri();
  ok(!!d.paketler.find((x) => x.id === "tk1").takdirBildirimi && !d.paketler.find((x) => x.id === "tk2").takdirBildirimi, "yalnız işaretlenen paket bildirildi");
  ok(d.hareketler.some((h) => h.tip === "takdirBildirildi" && h.paketId === "tk1"), "hareket kaydı");
  ok((await p.locator('[data-takdir-paket="tk1"] [data-takdir-gitti]').count()) === 1 && !(await sec("tk1").isChecked()), "gönderilen 'gönderildi' ve işaretsiz");
  // Ayarlar'da şablon: değişiklik postaya yansır; geri bildirim şablonları yerinde kalır.
  await git("#/ayarlar");
  await p.locator("details:has([data-takdir-sablonu]) > summary").click();
  await p.locator("[data-takdir-konu]").fill("تكليف: {strap}");
  await p.locator("[data-takdir-kaydet]").click();
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.geriBildirimSablonlari.some((s) => s.id === "takdir-bildirimi" && s.konu === "تكليف: {strap}") && d.geriBildirimSablonlari.filter((s) => s.id !== "takdir-bildirimi").length >= 3, "şablon kaydedildi, geri bildirim şablonları duruyor");
  ok((await p.locator("[data-gb-sablonu]").count()) === 3, "geri bildirim listesinde takdir şablonu görünmüyor");
  await git(`#/nextday/${plan.id}/takdir`);
  await p.locator('[data-takdir-paket="tk1"] [data-takdir-onizle]').click();
  ok((await p.locator('[data-takdir-paket="tk1"] .takdir-konu').innerText()).trim() === "تكليف: عنوان التقرير الأول", "yeni şablon önizlemede");
  await git(`#/nextday/${plan.id}`);
  ok((await p.locator("[data-takdir-ac]").count()) === 1, "onaylı planda Takdir bildirimi düğmesi");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/nextday/${plan.id}/takdir`);
    await p.locator('[data-takdir-paket="tk1"] [data-takdir-onizle]').click();
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma === 0, `390px taşma yok (${dil}): ${tasma}`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
