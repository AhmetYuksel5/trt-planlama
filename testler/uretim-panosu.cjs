// Haber üretimi panosu (uretim.ts → panoSutunu): sütunlar balonun aşamaları; her üretimdeki paket bir aşama
// sütununda, metin durağındaki paket parçalarının hâline göre (muhabir, editoryal, dil); gfx sırası grafik
// sütununda da; 390 pikselde taşma yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("yo3", "#/");

  // Balonlu bir paketi metin durağına, parçaları editoryal kontrolde olacak şekilde kur.
  const sec = await p.evaluate(() => {
    const k = "trt-planlama-v25";
    const d = JSON.parse(localStorage.getItem(k));
    const l = d.paketler.filter((x) => x.durum === "uretimde" && x.uretim);
    const x = l[0];
    x.adim = "metin";
    x.parcalar = [
      { id: "pp1", ad: "Metin", tur: "metin", metin: "نص", asama: "newsdesk" },
      { id: "pp2", ad: "Stand", tur: "stand", metin: "ستاند", asama: "dil" },
    ];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { id: x.id, uretimde: d.paketler.filter((y) => y.durum === "uretimde").map((y) => y.id) };
  });

  await gir("yo3", "#/uretim");
  ok((await p.locator("[data-uretim-panosu]").count()) === 1, "pano açıldı");
  const sutunlar = await p.locator("[data-pano-sutun]").evaluateAll((e) => e.map((x) => x.getAttribute("data-pano-sutun")));
  ok(["gorev", "muhabir", "editoryal", "dil", "video", "yukleme", "yayin"].every((s) => sutunlar.includes(s)), `balonun aşamaları sütun (${sutunlar})`);
  ok((await p.locator(`[data-pano-sutun="editoryal"] [data-pano-paket="${sec.id}"]`).count()) === 1, "en geride kalan parça editoryal kontrolde: paket orada");
  for (const id of sec.uretimde) {
    const n = await p.locator(`[data-pano-sutun]:not([data-pano-sutun="grafik"]) [data-pano-paket="${id}"]`).count();
    if (n !== 1) ok(false, `${id} bir aşama sütununda (${n})`);
  }
  ok(true, "her üretimdeki paket bir sütunda");
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "taşma yok");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("yo3", "#/uretim");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
