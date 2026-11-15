// Sade paket sayfası (kullanıcı): metin yayındaki sırasıyla (Strap, intro, metin ve röportajlar, stand; gfx
// değil), koordinasyon notları, bilgiler kartı ve "Başka muhabire ver" yok; ek masraf muhabirden, onaylıyken
// salt okunur; onaylanmış masraf Muhasebe'nin dökümünde.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl2", "#/");

  // Biten paket: parçalar karışık sırada girilmiş, masraf onaylı.
  const bugun = new Date().toISOString().slice(0, 10);
  const pk = await p.evaluate((g) => {
    const k = "trt-planlama-v25";
    const d = JSON.parse(localStorage.getItem(k));
    const x = d.paketler.find((y) => y.durum === "tamamlandi" && !y.yapilmadi && !y.ozelId && d.kisiler.find((z) => z.id === y.muhabirId)?.birim === "muhabir");
    x.parcalar = [
      { id: "t1", ad: "STAND", metin: "ستاند الختام", asama: "tamam" },
      { id: "t2", ad: "Metin", tur: "metin", metin: "النص الأول", asama: "tamam" },
      { id: "t3", ad: "INTRO", metin: "مقدمة التقرير", asama: "tamam" },
      { id: "t4", ad: "Röportaj", tur: "roportaj", asil: "We will rebuild", metin: "سنعيد البناء", asama: "tamam" },
      { id: "t5", ad: "Gfx", tur: "gfx", metin: "خريطة", asama: "tamam" },
    ];
    x.masraflar = [{ id: "ms1", tur: "ulasim", tutar: 75, para: "USD", kisiId: x.muhabirId, zaman: new Date().toISOString() }];
    x.masrafOnayi = { kisiId: "yo3", zaman: new Date().toISOString() };
    delete x.planId;
    x.sonTarih = g;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { id: x.id, muhabirId: x.muhabirId };
  }, bugun);

  await gir("pl2", "#/paketler/" + pk.id);
  const turler = await p.locator("[data-paket-metni] [data-pm-tur]").evaluateAll((e) => e.map((x) => x.getAttribute("data-pm-tur")));
  ok(turler.join(",") === "strap,intro,metin,roportaj,stand", `metin sırası (${turler})`);
  ok((await p.locator('[data-pm-tur="roportaj"] .pm-asil').innerText()).includes("rebuild"), "röportajın aslı");
  ok((await p.locator("[data-paket-metni]").innerText()).includes("خريطة") === false, "gfx metinde yok");
  ok((await p.locator("[data-paket-notu]").count()) === 0 && (await p.locator("[data-baska-muhabire-formu]").count()) === 0 && (await p.locator("[data-paket-metni-ac]").count()) === 0, "notlar, başka muhabire ver ve Strap kartı yok");
  ok((await p.locator("[data-masraf-onayli]").count()) === 1 && (await p.locator("[data-masraf-sil], [data-masraf-ac]").count()) === 0, "onaylı masraf salt okunur");
  ok((await p.locator("[data-paket-gecmis]").count()) === 1 && !(await p.locator("[data-paket-gecmis]").evaluate((e) => e.open)), "geçmiş katlı");
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "taşma yok");

  // Onaylı pakette muhabir masraf girer ve siler; "diğer" açıklamasız eklenmez.
  const d = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const acik = d.paketler.find((x) => x.durum === "onaylandi" && !x.isaret && !x.ozelId && !x.masaTakibi && d.kisiler.find((k) => k.id === x.muhabirId)?.birim === "muhabir");
  await gir(acik.muhabirId, "#/paketler/" + acik.id);
  await p.click("[data-masraf-ac]");
  await p.click('[data-masraf-tur="diger"]');
  await p.fill("[data-masraf-tutar]", "30");
  ok(await p.locator("[data-masraf-ekle]").isDisabled(), "diğer açıklamasız eklenmez");
  await p.fill("[data-masraf-aciklama]", "Taksi");
  await p.click("[data-masraf-ekle]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-masraf-listesi] li").count()) === 1 && (await p.locator("[data-masraf-bekliyor]").count()) === 1, "masraf eklendi, onay bekliyor");
  await p.click("[data-masraf-sil]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-masraf-listesi] li").count()) === 0, "masraf silindi");

  // Muhasebe: ayın dökümünde onaylı masraf.
  await gir("mh1", "#/muhasebe");
  const satir = p.locator(`[data-mh-masraf]`);
  ok((await satir.count()) >= 1 && (await satir.first().innerText()).includes("75"), "Muhasebe dökümünde masraf");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pl2", "#/paketler/" + pk.id);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
