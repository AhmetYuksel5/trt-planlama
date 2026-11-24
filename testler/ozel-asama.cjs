// Özel yayının aşamaları kayıttan (kullanıcı: elle işaretlenen aşamalar hiçbir şeye bağlı değildi): planlama
// (genel plan, nafize ya da içerik), onay (elle verilen tek adım), uygulama (nafizenin rezervasyonu ve yeri,
// görevlendirme, yapılacak maddeler), teslim (içerikler). Eksikler aşamanın altında. Eski "diğer talepler"
// yapılacak madde oldu; günlük program o günün nafizelerini, içeriklerini, görevlendirmelerini ve maddelerini
// gösteriyor. Yayını geçen özel yayının bitmiş paketleri yayınlandı sayılıyor.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yaz = (f, arg) => p.evaluate(([k, fs, a]) => { const d = JSON.parse(localStorage.getItem(k)); new Function("d", "a", fs)(d, a); localStorage.setItem(k, JSON.stringify(d)); }, [K, f, arg]);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };
  const YARIN = yerel(1), SONRA = yerel(2);
  const asama = () => p.locator("[data-ozel-asamalar]").getAttribute("data-ozel-asama");

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/ozel");

  // Boş yayın: planlama aşamasında, genel plan ve içerik eksik.
  await yaz(`d.ozel.push({ id: "oz-a", ad: "تغطية المراحل", tarih: a[0], bitis: a[1], hazirlik: [], iz: [],
    talepler: [{ id: "ot-1", metin: "طلب غرافيك", birim: "grafik", sonTarih: a[1], durum: "suruyor", iz: [] }, { id: "ot-2", metin: "طلب ملغى", durum: "iptal", iz: [] }] });`, [YARIN, SONRA]);
  await git("#/ozel/oz-a");
  let d = await durum();
  const o = d.ozel.find((x) => x.id === "oz-a");
  ok(!o.talepler && o.hazirlik.some((h) => h.id === "ot-1" && h.gun === SONRA && h.birim === "grafik" && !h.tamam), "eski talep yapılacak madde oldu (gün, birim)");
  ok(!o.hazirlik.some((h) => h.id === "ot-2"), "iptal edilen talep taşınmadı");
  ok((await asama()) === "planlama", "boş yayın planlama aşamasında");
  ok((await p.locator('[data-asama="planlama"] [data-eksik="aciklama"]').count()) === 1, "eksik: genel plan");
  ok((await p.locator('[data-asama="planlama"] [data-eksik="icerik"]').count()) === 1, "eksik: nafize ya da içerik");
  ok((await p.locator("[data-kontrol-kutu]").count()) === 0, "aşamalarda elle işaretlenen kutu yok");

  // Genel plan ve bir nafize: planlama tamam, onay bekliyor.
  await yaz(`const o = d.ozel.find((x) => x.id === "oz-a"); o.aciklama = "خطة عامة";
    d.canliYayinlar.push({ id: "cy-a", ozelId: "oz-a", planId: "", tarih: a, saatGmt: "10:00", yer: "الدوحة", konu: "نافذة", ekleyen: "pl1" });`, YARIN);
  await git("#/ozel/oz-a");
  ok((await p.locator('[data-asama="planlama"]').getAttribute("data-tamam")) === "1", "genel plan ve nafize: planlama tamam");
  ok((await asama()) === "onay", "şimdiki aşama onay");
  const onay = p.locator("[data-ozel-onayla]").first();
  ok((await onay.count()) >= 1, "'Planı onayla' düğmesi");
  await onay.click();
  await p.waitForTimeout(400);
  ok((await asama()) === "uygulama", "onaydan sonra uygulama");
  ok((await p.locator('[data-asama="uygulama"] [data-eksik="cy-a"]').count()) === 1, "eksik: nafizenin rezervasyonu");
  ok((await p.locator('[data-asama="uygulama"] [data-eksik="ot-1"]').count()) === 1, "eksik: açık madde");

  // Eksiğe basınca işin sekmesi açılıyor.
  await p.locator('[data-asama="uygulama"] [data-eksik="ot-1"] button').click();
  ok((await p.locator('[data-ozel-sekme="hazirlik"][aria-selected="true"]').count()) === 1, "maddeye basınca Yapılacaklar sekmesi");

  // Yeni madde: gün ve birimle; birime bildirim.
  await p.click("[data-madde-ekle]");
  const f = p.locator("[data-madde-formu]");
  await f.waitFor();
  await f.locator("[data-madde-metni]").fill("حجز الاستوديو");
  await f.locator("[data-madde-gun]").selectOption(YARIN);
  await f.locator("[data-madde-birim]").selectOption("output");
  await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  d = await durum();
  const m = d.ozel.find((x) => x.id === "oz-a").hazirlik.find((h) => h.metin === "حجز الاستوديو");
  ok(!!m && m.gun === YARIN && m.birim === "output", "madde gün ve birimle kaydedildi");
  ok(d.hareketler.some((h) => h.tip === "ozelTalep" && h.ozelId === "oz-a" && h.veri?.sahip === "output"), "birime bildirim");

  // Günlük program: o günün maddesi ve nafizesi; maddeyi oradan işaretle.
  await yaz(`d.paketler.push({ id: "p-oz-a", kod: "X", baslik: "تقرير المراحل", sehir: "istanbul", tur: "ozel", bicim: "PKG", durum: "onaylandi", sahaGerekli: false,
    ozelId: "oz-a", gorev: { kisiId: "pl1", zaman: new Date().toISOString() }, yayinGunu: a, sonTarih: a, notlar: [], olusturma: new Date().toISOString(), guncelleme: new Date().toISOString() });`, YARIN);
  await git("#/ozel/oz-a");
  await p.click('[data-ozel-sekme="program"]');
  await p.click(`[data-ozel-gun="${YARIN}"]`);
  ok((await p.locator(`[data-program-nafize="cy-a"]`).count()) === 1, "programda günün nafizesi");
  ok((await p.locator(`[data-program-icerik="p-oz-a"]`).count()) === 1, "programda o gün yayınlanacak içerik");
  ok((await p.locator(`[data-program-maddeler] [data-madde-kutu="${m.id}"]`).count()) === 1, "programda o günün maddesi");
  await p.locator(`[data-program-maddeler] [data-madde-kutu="${m.id}"] input`).check();
  await p.waitForTimeout(300);
  d = await durum();
  ok(d.ozel.find((x) => x.id === "oz-a").hazirlik.find((h) => h.id === m.id).tamam, "programdan işaretlenen madde tamam");

  // Her şey tamam: teslim aşaması, sonra yayına hazır.
  await yaz(`const o = d.ozel.find((x) => x.id === "oz-a"); o.hazirlik.forEach((h) => (h.tamam = true));
    const c = d.canliYayinlar.find((x) => x.id === "cy-a"); c.rezervasyon = { kisiId: "pl1", zaman: "x" }; c.yerHazir = { kisiId: "pl1", zaman: "x" };`);
  await git("#/ozel/oz-a");
  ok((await asama()) === "hazir", "uygulama bitince teslim aşaması");
  ok((await p.locator('[data-asama="hazir"] [data-eksik="p-oz-a"]').count()) === 1, "eksik: içeriğin teslimi");
  await yaz(`d.paketler.find((x) => x.id === "p-oz-a").durum = "tamamlandi";`);
  await git("#/ozel/oz-a");
  ok((await asama()) === "tamam", "içerik teslim edilince yayına hazır");

  // Onayı geri al.
  await p.click("[data-ozel-onay-geri]");
  await p.waitForTimeout(300);
  ok((await asama()) === "onay", "onay geri alınınca şimdiki aşama onay");

  // Yayını geçmiş yayının bitmiş paketi yayınlandı.
  await yaz(`d.ozel.push({ id: "oz-g", ad: "تغطية سابقة", tarih: a, hazirlik: [], iz: [] });
    d.paketler.push({ id: "p-oz-g", kod: "Y", baslik: "تقرير سابق", sehir: "istanbul", tur: "ozel", bicim: "PKG", durum: "tamamlandi", sahaGerekli: false, ozelId: "oz-g", notlar: [], olusturma: "2020-01-01", guncelleme: "2020-01-01" });`, yerel(-3));
  await git("#/ozel");
  d = await durum();
  ok(d.paketler.find((x) => x.id === "p-oz-g").yayinlandi?.ozelId === "oz-g", "yayını geçen yayının bitmiş paketi yayınlandı");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
