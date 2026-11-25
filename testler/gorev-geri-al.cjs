// Görevi geri alma (kullanıcı: Programlar için görevlendirdiği öneride aşamayı geri aldı, "Programlar ·
// Görevlendirildi" kalmadı mı, ⋯'de "Muhabiri görevlendir" çıkmıyordu, yalnız "Plana ekle"): plansız görev
// paketi planda olmadığı için geri alma ona dokunmuyordu, paket canlı kaldığından öneri görevli sayılıyordu.
// Şimdi geri alma paketi de geri alır (iptal, muhabire ve masaya haber); eski kayıttakini açılış işi düzeltir.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yaz = (fn, arg) =>
    p.evaluate(([k, f, a]) => {
      const d = JSON.parse(localStorage.getItem(k));
      new Function("d", "a", f)(d, a);
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
    }, [K, fn, arg]);
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
  const [o1, o2] = d.oneriler.filter((x) => x.muhabirId && !x.talimatVeren && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.bicim !== "canli" && !x.takipTuru && !sorulan.has(x.id) && !planda.has(x.id) && !x.hafta);

  // Programlar birimi "Uygundur" dedi, Planlama Programlar için görevlendirdi.
  await yaz(
    "d.masaSorulari = d.masaSorulari || []; d.masaSorulari.push({ id: 'ms-geri', oneriId: a, birim: 'program', soran: 'pl1', zaman: new Date().toISOString(), not: 'test', cevap: { kabul: true, kisiId: 'pr1', zaman: new Date().toISOString(), not: 'نعم' } }); d.oneriler.find((x) => x.id === a).durum = 'degerlendiriliyor';",
    o1.id,
  );
  await gir("pl1", "#/oneriler/" + o1.id);
  await menu();
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk = d.paketler.find((x) => x.oneriId === o1.id && x.gorev);
  ok(pk && pk.masaTakibi === "program", "Programlar için görevlendirildi");
  await gir("pl1", "#/oneriler/" + o1.id);
  ok(/Görevlendirildi/.test(await p.locator("[data-masa-rozeti]").first().innerText()), "rozet: Programlar · Görevlendirildi");

  // Aşamayı geri al → değerlendirme (hesap yetkisi geriAlma: tam yönetici).
  await gir("yo3", "#/oneriler/" + o1.id);
  await menu();
  await p.click("[data-oneri-geri-al]");
  await p.waitForTimeout(300);
  await p.click('[data-geri-al-formu] [data-geri-hedef="degerlendiriliyor"]');
  await p.click("[data-geri-al-formu] [data-geri-al-onay]");
  await p.waitForTimeout(500);
  d = await veri();
  ok(d.oneriler.find((x) => x.id === o1.id).durum === "degerlendiriliyor", "öneri değerlendirmede");
  ok(d.paketler.find((x) => x.id === pk.id).durum === "iptal", "görev paketi de geri alındı (iptal)");
  ok(d.hareketler.some((h) => h.tip === "paketIptal" && h.paketId === pk.id && h.veri?.kime === pk.muhabirId && h.veri?.sahip === "program"), "muhabire ve Programlar'a haber");
  await gir("pl1", "#/oneriler/" + o1.id);
  ok(!/Görevlendirildi/.test(await p.locator("[data-masa-rozeti]").first().innerText()), "rozet artık görevlendirildi demiyor");
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "⋯'de yeniden 'Muhabiri görevlendir'");
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  ok(d.paketler.filter((x) => x.oneriId === o1.id && x.gorev && x.durum !== "iptal").length === 1, "yeniden görevlendirildi, tek canlı paket");

  // Eski kayıt: geri alınmış ama paketi canlı kalmış öneri; açılış işi paketi geri alır.
  await gir("pl1", "#/oneriler/" + o2.id);
  await menu();
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  await yaz(
    "d.oneriler.find((x) => x.id === a).durum = 'degerlendiriliyor'; d.hareketler.push({ id: 'h-eski-geri', kisiId: 'pl1', tip: 'oneriAsamayaDondu', oneriId: a, zaman: new Date().toISOString(), veri: { sonuc: 'degerlendiriliyor', onceki: 'planaEklendi' } });",
    o2.id,
  );
  await gir("pl1", "#/oneriler/" + o2.id);
  await p.waitForTimeout(500);
  d = await veri();
  ok(d.paketler.filter((x) => x.oneriId === o2.id && x.gorev && x.durum !== "iptal").length === 0, "açılış işi eski kaydın canlı paketini geri aldı");
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "eski kayıtta da ⋯'de 'Muhabiri görevlendir'");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
