// Programlar'ın sayfası (ekranlar/program/ProgramMasasi.tsx, programMasasi.ts): dört kutucuk; eski kartlar yok;
// yeni program; içerik alanları; programa aktarma; yayın kararı arşive taşır; Planlama'nın sorusuna yanıt
// arşive iner; yayın planlarında son onaylı çıktı; 390px taşma yok (Türkçe, Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(800);
  };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pr1", "#/");
  ok((await p.locator("[data-prg-kutu]").count()) === 5, "ana sayfada beş kutucuk (Arşiv dahil)");
  ok((await p.locator('[data-masa="program"], [data-masa-takibi]').count()) === 0, "eski program masası kartı yok");

  // Hazırlık: teslim edilmiş masa paketi ve Planlama'nın açık sorusu.
  let d = await durum();
  const muhabir = d.kisiler.find((k) => k.birim === "muhabir" && !k.pasif);
  const z = new Date().toISOString();
  const ornek = d.paketler[0];
  d.paketler.unshift({ ...ornek, id: "prg-test", kod: "prg-test", baslik: "تقرير اختبار البرنامج", tur: "program", durum: "onaylandi", muhabirId: muhabir.id, planId: undefined, baslikId: undefined, stok: undefined, adim: undefined, oneriId: undefined, ozelId: undefined, haftalikKalemId: undefined, yayinlandi: undefined, programBolumu: undefined, gorev: { veren: "pl1", zaman: z }, masaTakibi: "program", isaret: { tur: "yapildi", zaman: z, kisiId: muhabir.id }, sonTarih: z.slice(0, 10), notlar: [], olusturma: z, guncelleme: z });
  const oneri = d.oneriler.find((o) => o.muhabirId && ["yeni", "degerlendiriliyor"].includes(o.durum) && !o.takipTuru);
  oneri.durum = "degerlendiriliyor";
  d.masaSorulari = [...(d.masaSorulari ?? []), { id: "ms-prg", oneriId: oneri.id, birim: "program", soran: "pl1", zaman: z, not: "هل يناسبكم؟" }];
  await yaz(d);

  // Programlar: yeni program, bütün günler (her hafta bölümü olsun).
  await gir("pr1", "#/programlar/programlar");
  await p.click("[data-prg-yeni]");
  await p.fill("[data-prg-ad]", "برنامج الاختبار");
  await p.fill("[data-prg-saat]", "2045");
  for (let g = 0; g < 7; g++) await p.check(`[data-prg-gun="${g}"]`);
  await p.click("[data-prg-kaydet]");
  await p.waitForTimeout(400);
  d = await durum();
  const prg = d.programlar.find((x) => x.ad === "برنامج الاختبار");
  ok(prg && prg.saat === "20:45" && prg.gunler.length === 7, "program kaydedildi (saat 24 saat, günler)");
  ok((await p.locator(`[data-prg-program="${prg?.id}"] [data-prg-bolum]`).count()) === 7, "haftanın yedi bölümü");

  // İçerikler: teslim edilen Yayına hazır'da; programa aktarılır.
  await gir("pr1", "#/programlar/icerikler");
  await p.click('[data-prg-alan="hazir"]');
  ok((await p.locator('[data-prg-icerik="prg-test"]').count()) === 1, "teslim edilen içerik Yayına hazır'da");
  await p.click('[data-prg-aktar="prg-test"]');
  await p.selectOption("[data-prg-aktar-program]", prg.id);
  await p.click("[data-prg-aktar-onay]");
  await p.waitForTimeout(400);
  d = await durum();
  const pk = d.paketler.find((x) => x.id === "prg-test");
  ok(pk.programBolumu?.programId === prg.id, "içerik programın bölümüne aktarıldı");
  await gir("pr1", "#/programlar/programlar");
  ok((await p.locator(`[data-prg-program="${prg.id}"] a[href="#/paketler/prg-test"]`).count()) === 1, "bölümde içerik görünüyor");

  // Yayın kararı: Yayınlandı → Arşiv.
  await gir("pr1", "#/programlar/icerikler");
  await p.click('[data-prg-alan="hazir"]');
  await p.click('[data-prg-icerik="prg-test"] [data-masa-yayinlandi]');
  await p.waitForTimeout(400);
  await gir("pr1", "#/programlar/arsiv");
  ok((await p.locator('[data-prg-arsiv="prg-test"]').count()) === 1, "yayınlanan arşivde");
  await p.fill("[data-prg-arsiv-ara]", "اختبار البرنامج");
  ok((await p.locator("[data-prg-arsiv]").count()) === 1, "arşivde arama");
  await p.selectOption("[data-prg-arsiv-program]", prg.id);
  ok((await p.locator('[data-prg-arsiv="prg-test"]').count()) === 1, "arşivde program süzgeci");
  await p.fill("[data-prg-arsiv-ara]", "");
  await p.click('[data-prg-arsiv-suzgec="yayinlanmadi"]');
  ok((await p.locator('[data-prg-arsiv="prg-test"]').count()) === 0, "yayınlanmayanlar süzgecinde yok");

  // Öneriler: Planlama'dan gelen soruya "Uygundur" → arşivde.
  await gir("pr1", "#/programlar/oneriler");
  ok((await p.locator(`[data-prg-soru="${oneri.id}"]`).count()) === 1, "Planlama'nın sorusu listede");
  await p.click(`[data-prg-soru-aldi="${oneri.id}"]`);
  await p.fill("[data-prg-soru-not]", "مناسب");
  await p.click("[data-prg-soru-gonder]");
  await p.waitForTimeout(400);
  d = await durum();
  ok(d.masaSorulari.find((s) => s.id === "ms-prg").cevap?.kabul === true, "yanıt kaydedildi");
  ok((await p.locator(`[data-prg-soru="${oneri.id}"]`).count()) === 0, "yanıtlanan soru listeden kalktı");
  await gir("pr1", "#/programlar/arsiv");
  await p.click('[data-prg-arsiv-suzgec="oneri"]');
  ok((await p.locator(`[data-prg-arsiv="${oneri.id}"]`).count()) === 1, "yanıtlanan öneri arşivde");

  // Yayın planları: son onaylanan Next Day'in çıktısı, salt okunur.
  await gir("pr1", "#/programlar/planlar");
  await p.click('[data-prg-plan="nextday"]');
  const cikti = p.locator('[data-prg-cikti="nextday"]');
  ok((await cikti.count()) === 1, "Next Day çıktısı görünüyor");
  ok((await cikti.locator("button, [contenteditable=true]").count()) === 0, "çıktı salt okunur");

  // Planlama da sayfayı açar ama içerik kararı veremez.
  await gir("pl1", "#/programlar/icerikler");
  ok((await p.locator("[data-prg-kutu]").count()) === 5 && (await p.locator("[data-masa-yayinlandi], [data-prg-aktar], [data-prg-iletisim]").count()) === 0, "Planlama görür, karar veremez, muhabire ulaşma düğmesi yok");

  // Menü masaya özel: muhabir listesi, stok, feature yok; Üretim panosu var; adresle girilemiyor.
  await gir("pr2", "#/programlar/icerikler");
  ok((await p.locator("[data-masa-menusu=program]").count()) === 1, "Programlar'ın kendi menüsü");
  const menu = await p.locator("nav.menu").innerText();
  ok((await p.locator('nav.menu a[href="#/uretim"]').count()) === 1 && (await p.locator('nav.menu a[href="#/muhabirler"], nav.menu a[href="#/stok"], nav.menu a[href="#/feature"], nav.menu a[href="#/nextday"]').count()) === 0, "menüde Üretim panosu var; muhabirler, stok, feature, Next Day yok: " + menu.replace(/\n/g, " | "));
  await gir("pr2", "#/muhabirler");
  ok((await p.locator("main .bos h2").count()) === 1 && (await p.locator("main table").count()) === 0, "muhabir listesine adresle girilemiyor");
  // İçerik kartında işin muhabirine WhatsApp ve posta.
  await gir("pr2", "#/programlar/icerikler");
  await p.click('[data-prg-alan="uretimde"]');
  const ilet = p.locator("[data-prg-iletisim]").first();
  ok((await ilet.locator("[data-whatsapp]").count()) + (await ilet.locator("[data-is-postasi]").count()) >= 1, "içerik kartında muhabire ulaşma");
  if (await ilet.locator("[data-is-postasi]").count()) {
    await ilet.locator("[data-is-postasi]").click();
    ok((await p.locator("[data-posta-yeni-konu]").inputValue()).length > 0, "posta penceresi konuyla açıldı");
  }

  // Spor ve Ekonomi aynı sayfa: kendi rengi, programsız (dört kutucuk).
  for (const [kim, yol, birim] of [["sp2", "#/spor", "spor"], ["ek2", "#/ekonomi", "ekonomi"]]) {
    await gir(kim, yol);
    ok((await p.locator(`[data-masa-sayfasi=${birim}]`).count()) === 1 && (await p.locator("[data-prg-kutu]").count()) === 4 && (await p.locator('[data-prg-kutu="programlar"]').count()) === 0, `${birim}: masa sayfası, programlar bölümü yok`);
    ok((await p.locator(`[data-masa-menusu=${birim}]`).count()) === 1, `${birim}: kendi menüsü`);
  }

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const bl of ["icerikler", "programlar", "oneriler", "planlar"]) {
      await gir("pr1", "#/programlar/" + bl);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(t <= 0, `390px taşma yok (${dil}, ${bl}): ${t}`);
    }
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
