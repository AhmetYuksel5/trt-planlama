// Kesinleşmiş Weekly de güncellenir (kullanıcı: toplantı bir durak; sonradan eklenen sonradan onaylanır):
// yeni kalem karar bekler, kabul edilince günün Next Day planına geçer; aktarılmış kalem kilitli.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  let hata = 0;
  p.on("pageerror", (e) => (hata++, console.log("HATA", String(e))));
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);

  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "pl1");
    localStorage.setItem("trt-planlama-dil", "tr");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik");
  await p.waitForTimeout(1200);
  // Kesinleşmiş haftaya, açık bir Next Day planının gününe sonradan kalem; aktarılmış bir kalem de var.
  const { hid, yeniId, kilitliId, planId } = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = d.planlar.find((x) => x.durum === "taslak" || x.durum === "toplantida");
    const h = d.haftalik.find((x) => x.baslangic <= plan.tarih && plan.tarih <= new Date(new Date(x.baslangic).getTime() + 6 * 864e5).toISOString().slice(0, 10)) ?? d.haftalik[0];
    h.durum = "kesinlesti";
    h.baslangic = h.baslangic;
    const kilitli = h.kalemler.find((x) => x.aktarim?.planId || x.aktarim?.paketId) ?? h.kalemler[0];
    kilitli.karar = "kabul";
    kilitli.aktarim = kilitli.aktarim ?? { planId: plan.id };
    const yeni = { id: "hk-sonradan-test", tarih: plan.tarih, metin: "زيارة مفاجئة يعلن عنها لاحقا", yer: "أنقرة", tur: "haber", bicimler: [], muhabirler: [], karar: "bekliyor" };
    h.kalemler.push(yeni);
    // Plan bu haftanın içinde değilse testin kendi haftası: plan günü haftaya düşsün.
    if (!(h.baslangic <= plan.tarih)) h.baslangic = plan.tarih;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, yeniId: yeni.id, kilitliId: kilitli.id, planId: plan.id };
  }, K);

  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1500);
  ok((await p.locator("[data-sonradan-bekleyen]").count()) === 1, "kesinleşmiş haftada sonradan eklenen karar bekliyor satırı");
  const yeniSatir = p.locator(`[data-kalem="${yeniId}"]`);
  ok((await yeniSatir.count()) === 1, "sonradan eklenen kalem planda");
  ok((await yeniSatir.locator('[data-karar-dugme="kabul"]').count()) === 1, "sonradan eklenen kaleme karar verilebiliyor");
  ok((await p.locator(`[data-kalem="${kilitliId}"] [data-karar-dugme]`).count()) === 0, "aktarılmış kalem kilitli: karar düğmesi yok");

  await yeniSatir.locator('[data-karar-dugme="kabul"]').evaluate((e) => e.click());
  await p.waitForTimeout(600);
  const d = await oku();
  const k = d.haftalik.find((x) => x.id === hid).kalemler.find((x) => x.id === yeniId);
  ok(k.karar === "kabul" && k.aktarim?.planId === planId, "kabul edilen kalem günün Next Day planına geçti: " + JSON.stringify(k.aktarim));
  ok(d.gelismeler.some((g) => g.planId === planId && g.haftalikKalemId === yeniId) || d.paketler.some((x) => x.planId === planId && x.haftalikKalemId === yeniId), "Next Day planında kalemin kaydı var");
  ok((await p.locator(`[data-kalem="${yeniId}"] [data-karar-dugme]`).count()) === 0, "aktarılınca kalem kilitlendi");
  ok((await p.locator("[data-sonradan-bekleyen]").count()) === 0, "karar bekleyen kalmadı");

  // Kesinleşmiş haftaya kalem ekleme düğmesi açık.
  ok((await p.locator("button", { hasText: "Kalem ekle" }).count()) > 0, "kesinleşmiş haftada kalem eklenebiliyor");
  ok(hata === 0, "sayfa hatası yok");
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
