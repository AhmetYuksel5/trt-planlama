// Masa için görevlendirme (kullanıcı: Planlama haber merkezi için planladığı gibi Programlar, Ekonomi ve Spor için
// de planlar; görevlendirdiği paket masanın sayfasında "Görevlendirilen"de durur, takibi masada). Doğrudan görevde
// "Kimin için" seçilir (önerinin kolu program ise varsayılan Programlar); birimin "Uygundur" dediği öneride de
// "Muhabiri görevlendir" ⋯ menüsünde; birimin yanıtı beklenirken de.
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
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yaz = (fn, arg) =>
    p.evaluate(
      ([k, f, a]) => {
        const d = JSON.parse(localStorage.getItem(k));
        new Function("d", "a", f)(d, a);
        localStorage.setItem(k, JSON.stringify(d));
        localStorage.setItem(k + "-iz", String(Date.now()));
      },
      [K, fn, arg],
    );
  const menu = async () => {
    await p.locator("[data-oneri-alt] button[aria-haspopup='menu']").first().click();
    await p.waitForTimeout(200);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl1", "#/oneriler");
  let d = await veri();
  const sorulan = new Set((d.masaSorulari ?? []).map((s) => s.oneriId));
  const planda = new Set([...d.gelismeler, ...d.paketler, ...d.canliYayinlar].map((x) => x.oneriId).filter(Boolean));
  const adaylar = d.oneriler.filter((x) => x.muhabirId && !x.talimatVeren && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.bicim !== "canli" && !x.takipTuru && !sorulan.has(x.id) && !planda.has(x.id) && !x.hafta);
  ok(adaylar.length >= 3, `uygun üç öneri (${adaylar.length})`);
  const [o1, o2, o3] = adaylar;

  // 1. Programla ilgili öneri: doğrudan görev, varsayılan Programlar.
  await yaz("d.oneriler.find((x) => x.id === a).tur = 'program';", o1.id);
  await gir("pl1", "#/oneriler/" + o1.id);
  await menu();
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-oneri-gorev-masa]").inputValue()) === "program", "kimin için: Programlar seçili");
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk1 = d.paketler.find((x) => x.oneriId === o1.id);
  ok(pk1 && pk1.masaTakibi === "program" && !pk1.stok && pk1.gorev, "paket Programlar'ın takibinde, stokta değil");
  ok(d.hareketler.some((h) => h.tip === "paketGorevVerildi" && h.paketId === pk1.id && h.veri?.sahip === "program"), "masaya bildirim");

  await gir("pr1", "#/programlar/icerikler");
  ok((await p.locator('[data-prg-alan="gorevli"][aria-selected="true"]').count()) === 1, "İçerikler Görevlendirilen'le açılıyor");
  ok((await p.locator(`[data-prg-icerik="${pk1.id}"]`).count()) === 1, "Programlar'ın Görevlendirilen alanında");

  // 2. Birimin "Uygundur" dediği öneri: ⋯ menüsünde görevlendirme, Ekonomi'ye.
  await yaz(
    "d.masaSorulari = d.masaSorulari || []; d.masaSorulari.push({ id: 'ms-test', oneriId: a, birim: 'ekonomi', soran: 'pl1', zaman: new Date().toISOString(), not: 'test', cevap: { kabul: true, kisiId: 'ek1', zaman: new Date().toISOString(), not: 'نعم' } }); d.oneriler.find((x) => x.id === a).durum = 'degerlendiriliyor';",
    o2.id,
  );
  await gir("pl1", "#/oneriler/" + o2.id);
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "'Uygundur' sonrası ⋯ menüsünde 'Muhabiri görevlendir'");
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-oneri-gorev-formu] [data-oneri-gorev-masa]").inputValue()) === "ekonomi", "kimin için: soran birim");
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.oneriId === o2.id);
  ok(pk2 && pk2.masaTakibi === "ekonomi" && !pk2.stok, "paket Ekonomi'nin takibinde");
  await gir("ek1", "#/ekonomi/icerikler");
  ok((await p.locator(`[data-prg-icerik="${pk2.id}"]`).count()) === 1, "Ekonomi'nin Görevlendirilen alanında");

  // 3. Birimin yanıtını beklemeden (kullanıcı: Ekonomi'ye sorulmuş, "görüş bekleniyor" öneriye görev verilemiyordu).
  await yaz(
    "d.masaSorulari = d.masaSorulari || []; d.masaSorulari.push({ id: 'ms-acik', oneriId: a, birim: 'ekonomi', soran: 'pl1', zaman: new Date().toISOString(), not: 'test' }); d.oneriler.find((x) => x.id === a).durum = 'degerlendiriliyor';",
    o3.id,
  );
  await gir("pl1", "#/oneriler/" + o3.id);
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "yanıt beklenirken ⋯ menüsünde 'Muhabiri görevlendir'");
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-oneri-gorev-formu] [data-oneri-gorev-masa]").inputValue()) === "ekonomi", "açık soruda kimin için: sorulan birim");
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk3 = d.paketler.find((x) => x.oneriId === o3.id);
  ok(pk3 && pk3.masaTakibi === "ekonomi" && !pk3.stok, "açık sorudaki öneri Ekonomi'nin takibine görevlendirildi");
  ok((await p.locator('[data-masa-rozeti="ekonomi"]').first().textContent())?.includes("Görevlendirildi"), "rozet 'görevlendirildi'");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pr1", "#/programlar/icerikler");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
