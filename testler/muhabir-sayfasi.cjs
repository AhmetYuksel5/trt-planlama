// Muhabirin sayfası masaların kalıbıyla (kullanıcı: "program birimi gibi"): kutucuklar, gruplu menü, Yapılacaklar
// (paket görevleri gün gün: bugün, yarın, yakında), Haberlerim'de ay/hafta gruplaması, Ayarlar'da tema rengi.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
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
  await gir("pl1", "#/oneriler");
  ok((await p.locator('#ana-menu a[href="#/yapilacaklar"]').count()) === 0, "Planlama'nın menüsünde Yapılacaklar yok");

  // İki paket görevi: biri yarın, biri dört gün sonra (yakında).
  const gunler = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const gun = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    const ornek = d.paketler.find((x) => x.muhabirId === "mu1");
    const yeni = (id, n) => {
      const x = JSON.parse(JSON.stringify(ornek));
      for (const a of ["adim", "uretim", "isaret", "kunye", "yapilmadi", "yayinlandi", "planId", "ozelId", "akis", "asamaIzi", "parcalar", "masaTakibi", "stok"]) delete x[a];
      Object.assign(x, { id, baslik: "مهمة اختبار " + id, durum: "onaylandi", sonTarih: gun(n), gorev: { kisiId: "pl1", zaman: new Date().toISOString() } });
      d.paketler.push(x);
    };
    yeni("yk-yarin", 1);
    yeni("yk-yakin", 4);
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return [gun(1), gun(4)];
  }, K);

  await gir("mu1", "#/");
  ok((await p.locator("[data-muhabir-sayfasi] [data-mb-kutu]").count()) === 5, "ana sayfada beş kutucuk");
  ok((await p.locator("[data-muhabir-menusu]").count()) === 1 && (await p.locator('#ana-menu a[href="#/yapilacaklar"]').count()) === 1, "gruplu menüde Yapılacaklar");
  ok((await p.locator('[data-yk-grup="yarin"] [data-yapilacak="yk-yarin"]').count()) === 1, "yarınki görev Yarın'da");
  ok((await p.locator('[data-yk-grup="yakinda"] [data-yapilacak="yk-yakin"]').count()) === 1, "dört gün sonraki görev Yakında'da");
  ok((await p.locator('[data-yapilacak="yk-yarin"][data-sirasi="muhabir"]').count()) === 1, "onaylı görevde sıra muhabirde");
  ok((await p.locator('[data-yapilacak="yk-yarin"] .asama').count()) === 1, "yapım aşaması çubuğu");

  await gir("mu1", "#/yapilacaklar");
  ok((await p.locator('[data-mb-kutu="yapilacaklar"][aria-selected="true"]').count()) === 1, "Yapılacaklar sayfası kutucuğu seçili");
  ok((await p.locator("[data-yapilacak]").count()) >= 2, "Yapılacaklar sayfasında görevler");

  // Haberlerim: ay, hafta, hepsi.
  await gir("mu1", "#/paketler");
  const aylar = await p.locator("[data-haber-donem]").evaluateAll((x) => x.map((e) => e.getAttribute("data-haber-donem")));
  ok(aylar.length >= 1 && aylar.every((a) => /^\d{4}-\d{2}$/.test(a)), "varsayılan aylık gruplar: " + aylar.join());
  await p.click('[data-haber-grup-sec="hafta"]');
  const haftalar = await p.locator("[data-haber-donem]").evaluateAll((x) => x.map((e) => e.getAttribute("data-haber-donem")));
  ok(haftalar.length >= aylar.length && haftalar.every((h) => new Date(h + "T12:00:00").getDay() === 6), "haftalar Cumartesi başlıyor: " + haftalar.join());
  await p.click('[data-haber-grup-sec="hepsi"]');
  ok((await p.locator("[data-haber-donem]").count()) === 1, "hepsi tek liste");

  // Tema rengi.
  await gir("mu1", "#/ayarlar");
  await p.locator("[data-tema-secimi]").first().evaluate((e) => e.closest("details")?.setAttribute("open", ""));
  await p.click('[data-tema="mor"]');
  ok((await p.evaluate(() => document.documentElement.dataset.tema)) === "mor", "tema seçildi");
  await gir("mu1", "#/");
  const renk = await p.locator(".prg-kutu.secili").evaluate((e) => getComputedStyle(e).borderTopColor);
  ok(renk === "rgb(106, 66, 201)", "kutucuk temanın renginde: " + renk);
  await gir("mu1", "#/ayarlar");
  await p.locator("[data-tema-secimi]").first().evaluate((e) => e.closest("details")?.setAttribute("open", ""));
  await p.click('[data-tema="birim"]');
  ok((await p.evaluate(() => document.documentElement.dataset.tema)) === undefined, "birimin rengine dönüş");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const y of ["#/", "#/yapilacaklar", "#/paketler", "#/ayarlar"]) {
      await gir("mu1", y);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil} ${y})`);
    }
    ok((await p.locator('.alt-cubuk a[href="#/yapilacaklar"]').count()) === 1, `alt çubukta Yapılacaklar (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
