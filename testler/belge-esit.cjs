// Belgede düzenleme ile plan ekranının işlemleri aynı (kullanıcı: özellikler eşitlensin).
// Next Day belgesi: PKG kabul/ret, onaylı paketin metni, başlığa katma, başlığa canlı ekleme, hızlı ekleme.
// Klasik: başlığın adını değiştirme. Weekly belgesi: seçili karar kalkar, karar notu, görüşler.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1200); };
  // Şeritteki düğme üzerine gelince görünüyor; doğrudan basılır.
  const bas = (sec, ad) => p.evaluate(([s, a]) => {
    const el = [...document.querySelectorAll(s)].find((x) => !a || x.getAttribute("aria-label") === a || x.getAttribute("title") === a || x.textContent.trim() === a);
    if (!el) return false;
    el.click();
    return true;
  }, [sec, ad]);
  const kim = async (id) => { await p.goto(B); await p.evaluate((i) => { localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", i); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); }, id); };
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await kim("pl2");
  await git("#/nextday/nd-yarin");

  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = d.planlar.find((x) => x.id === "nd-yarin");
    plan.durum = "toplantida";
    const [b1, b2] = plan.basliklar;
    const ornek = d.paketler.find((x) => x.planId === plan.id && x.durum !== "iptal");
    d.paketler.unshift({ ...ornek, id: "p-be1", kod: "BE-1", baslik: "تقرير للقبول", planBaslikId: b1.id, gelismeId: undefined, durum: "degerlendiriliyor", oneriId: undefined, haftalikKalemId: undefined });
    d.paketler.unshift({ ...ornek, id: "p-be2", kod: "BE-2", baslik: "تقرير مقبول", planBaslikId: b2.id, gelismeId: undefined, durum: "onaylandi", oneriId: undefined, haftalikKalemId: undefined, uretim: undefined, adim: undefined, ozelId: undefined });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { b1: b1.id, b2: b2.id, n: plan.basliklar.length };
  }, K);

  // 1. Next Day belgesi
  await git("#/nextday/nd-yarin/belge");
  ok((await p.locator("[data-hizli-ekle]").count()) > 0, "belge sayfasında hızlı ekleme satırı");
  ok(await bas('[data-pkg-surukle="p-be1"] button', "Kabul et"), "belgede PKG'de Kabul et var");
  await p.waitForTimeout(400);
  let d = await veri();
  ok(d.paketler.find((x) => x.id === "p-be1").durum === "onaylandi", "belgede PKG kabul edildi");
  ok(await bas('[data-pkg-surukle="p-be2"] button', "Düzenle"), "belgede onaylı PKG'de Düzenle var");
  await p.waitForTimeout(300);
  ok((await p.locator("dialog [data-paket-metni]").count()) === 1, "onaylı paketin metin formu açıldı");
  await p.locator("dialog [data-paket-metni-strap]").fill("تقرير مقبول معدل");
  await p.locator("dialog [data-paket-metni-kaydet]").click();
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.paketler.find((x) => x.id === "p-be2").baslik === "تقرير مقبول معدل", "onaylı paketin Strap'i belgeden düzeldi");
  ok(await bas(`[data-nd-baslik="${kur.b1}"] [data-baslika-kat] button`), "belgede başlık şeridinde Başka başlığa kat");
  await p.waitForTimeout(300);
  ok((await p.locator("dialog [data-kat-hedefleri] button").count()) === kur.n - 1, "katma penceresinde öbür başlıklar");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  const canliOnce = (await veri()).canliYayinlar.filter((x) => x.planBaslikId === kur.b1).length;
  ok(await bas(`[data-nd-baslik="${kur.b1}"] button`, "Canlı yayın / etkinlik ekle"), "belgede başlığa canlı ekleme");
  await p.waitForTimeout(300);
  const form = p.locator("dialog form, dialog .form").first();
  ok((await form.count()) === 1, "canlı formu açıldı");
  await p.locator("dialog input[lang=ar], dialog input[dir=rtl]").first().fill("بث للاختبار");
  await p.locator("dialog .form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  d = await veri();
  ok(d.canliYayinlar.filter((x) => x.planBaslikId === kur.b1).length === canliOnce + 1, "canlı başlığa bağlı eklendi");

  // 2. Klasik: başlığın adı
  await git("#/nextday/nd-yarin");
  await p.evaluate(() => document.querySelectorAll("main details.bolum, main details:not([data-plan-baslik])").forEach((x) => (x.open = true)));
  await p.waitForTimeout(200);
  await bas(`details[data-plan-baslik="${kur.b2}"] .sag-uc button`, "Başlık işlemleri");
  await p.waitForTimeout(300);
  ok(await bas("[data-baslik-adi-ac]"), "klasikte başlığın adı menüde");
  await p.waitForTimeout(300);
  await p.locator("dialog [data-baslik-adi]").fill("عنوان معدل للاختبار");
  await p.locator("dialog .form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(300);
  d = await veri();
  const pb2 = d.planlar.find((x) => x.id === "nd-yarin").basliklar.find((x) => x.id === kur.b2);
  ok(d.basliklar.find((x) => x.id === pb2.baslikId).ad === "عنوان معدل للاختبار", "klasikte başlığın adı değişti");

  // 3. Weekly belgesi (pl1 karar verir)
  await kim("pl1");
  const hk = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum === "hazirlik") ?? d.haftalik[0];
    h.durum = "toplantida";
    h.kalemler = [{ id: "hk-be", tarih: h.baslangic, metin: "بند للاختبار", yer: "أنقرة", tur: "haber", bicimler: [], muhabirler: [], karar: "kabul" }];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return h.id;
  }, K);
  await git(`#/haftalik/${hk}/belge`);
  ok(await bas('[data-hf-sur-id="hk-be"] button', "Kabul"), "belgede seçili karar düğmesi");
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.haftalik.find((x) => x.id === hk).kalemler[0].karar === "bekliyor", "belgede seçili karara basınca karar kalktı");
  ok(await bas('[data-hf-sur-id="hk-be"] button', "Not / ek talep"), "belgede karar notu düğmesi");
  await p.waitForTimeout(300);
  ok((await p.locator("dialog").count()) > 0, "karar notu penceresi açıldı");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
