// Masanın takibi (masaTakibi): masanın "Uygundur" dediği öneriden görevlendirilen paket Planlama'nın stoğuna,
// hazır paketlerine ve onay kuyruğuna girmiyor; muhabir teslim ediyor, masa "Yayınlandı / Yayınlanmadı" diyor.
// Teslim edilip yayınlanmayan iş tamamlanmış sayılıyor (Muhasebe), teslim edilmeyen iptal. Eski görev paketi
// açılış işiyle takibe geçiyor.
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
    await p.waitForTimeout(800);
  };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v24", JSON.stringify(x)); localStorage.setItem("trt-planlama-v24-iz", String(Date.now())); }, d);
  const gun = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv-SE"); };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl1", "#/");
  let d = await durum();
  const muhabir = d.kisiler.find((k) => k.birim === "muhabir" && !k.pasif && !k.hesapsiz);
  const ornek = d.paketler[0];
  const z = new Date().toISOString();
  const paket = (id, ek) => ({ ...ornek, id, kod: id, baslik: "تقرير متابعة " + id, tur: "program", durum: "onaylandi", muhabirId: muhabir.id, planId: undefined, baslikId: undefined, stok: undefined, adim: undefined, isaret: undefined, oneriId: undefined, haftalikKalemId: undefined, ozelId: undefined, yayinlandi: undefined, sonTarih: gun(1), gorev: { veren: "pl1", zaman: z }, masaTakibi: "program", notlar: [], olusturma: z, guncelleme: z, ...ek });
  d.paketler.unshift(
    paket("mt-1"),
    paket("mt-2", { isaret: { tur: "yapildi", zaman: z, kisiId: muhabir.id } }),
    paket("mt-3"),
  );
  // Masanın takibinden önce görevlendirilmiş paket: öneri, masanın kabul ettiği soru, stokta görev paketi.
  const oneri = d.oneriler.find((o) => o.muhabirId);
  d.masaSorulari = [...(d.masaSorulari ?? []), { id: "ms-eski", oneriId: oneri.id, birim: "program", soran: "pl1", zaman: z, not: "", cevap: { kisiId: "pr2", zaman: z, kabul: true, not: "" } }];
  d.paketler.unshift(paket("mt-eski", { masaTakibi: undefined, stok: true, oneriId: oneri.id }));
  await yaz(d);

  // Açılış işi eskiyi takibe alıyor.
  await gir("pl1", "#/");
  d = await durum();
  const eski = d.paketler.find((x) => x.id === "mt-eski");
  ok(eski.masaTakibi === "program" && !eski.stok, "eski görev paketi masanın takibine geçti, stoktan çıktı");

  // Planlama: onay kuyruğunda ve Stok'ta yok.
  ok((await p.locator('[data-kuyruk="mt-2"]').count()) === 0, "teslim Planlama'nın onay kuyruğunda değil");
  await gir("pl1", "#/stok");
  ok(!(await p.locator("main").innerText()).includes("تقرير متابعة mt-"), "Stok'ta masanın paketi yok");
  await gir("pl1", "#/paketler/mt-2");
  ok((await p.locator("[data-masa-yayinlandi], [data-isaret-onayla]").count()) === 0, "Planlama paket sayfasında karar veremiyor");

  // Masa: Programlar'da İçerikler (Ekonomi ve Spor'da "Takibimizdeki paketler" kartı); teslim durumu, karar.
  await gir("pr2", "#/programlar/icerikler");
  await p.click('[data-prg-alan="uretimde"]');
  ok((await p.locator("[data-prg-icerik]").count()) >= 3, "Programlar'ın İçerikler'inde takibindeki paketler");
  await p.click('[data-prg-alan="hazir"]');
  ok(/Teslim edildi/.test(await p.locator('[data-prg-icerik="mt-2"]').innerText()), "teslim edileni gösteriyor");
  await p.click('[data-prg-icerik="mt-2"] [data-masa-yayinlanmadi]');
  await p.fill("[data-yayinlanmadi-sebep]", "البرنامج تأجل");
  await p.click("[data-yayinlanmadi-gonder]");
  await p.waitForTimeout(300);
  await p.click('[data-prg-alan="uretimde"]');
  await p.click('[data-prg-icerik="mt-1"] [data-masa-yayinlandi]');
  await p.waitForTimeout(300);
  await p.click('[data-prg-icerik="mt-3"] [data-masa-yayinlanmadi]');
  await p.fill("[data-yayinlanmadi-sebep]", "لم يصل التقرير");
  await p.click("[data-yayinlanmadi-gonder]");
  await p.waitForTimeout(400);
  d = await durum();
  const pk = (id) => d.paketler.find((x) => x.id === id);
  ok(pk("mt-1").durum === "tamamlandi" && pk("mt-1").yayinlandi?.masa === "program", "Yayınlandı: tamamlandı, yayın izi masada");
  ok(pk("mt-2").durum === "tamamlandi" && pk("mt-2").yayinlanmadi?.sebep === "البرنامج تأجل" && !pk("mt-2").yapilmadi && !!pk("mt-2").muhabirTeslimi, "teslim edilip yayınlanmayan tamamlanmış sayılıyor");
  ok(pk("mt-3").durum === "iptal" && !!pk("mt-3").yapilmadi && !!pk("mt-3").yayinlanmadi, "teslimsiz yayınlanmayan iptal");
  ok(d.hareketler.some((h) => h.tip === "masaYayinladi" && h.paketId === "mt-1" && h.veri?.kime === muhabir.id), "muhabire bildirim");
  await gir("pr2", "#/programlar/arsiv");
  ok((await p.locator('[data-prg-arsiv="mt-1"], [data-prg-arsiv="mt-2"], [data-prg-arsiv="mt-3"]').count()) === 3, "kapananlar arşivde");

  // Muhabir: teslim edebiliyor (mt-eski), işaret Planlama'ya değil masaya.
  await gir(muhabir.id, "#/paketler/mt-eski");
  await p.locator("[data-paket-yapildi]").click();
  await p.waitForTimeout(400);
  d = await durum();
  const h = d.hareketler.find((x) => x.tip === "paketIsaretlendi" && x.paketId === "mt-eski");
  ok(h?.veri?.sahip === "program" && d.paketler.find((x) => x.id === "mt-eski").durum === "onaylandi", "teslim masaya gitti, paket masanın kararını bekliyor");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pr2", "#/programlar/icerikler");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
