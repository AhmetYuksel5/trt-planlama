// Üretim balonu (uretim.ts, bilesenler/UretimBalonu.tsx): onaylı pakette yol tiklerle seçilir, istisna işaretlenir,
// şablon kaydedilir; iş o yolla yürür: Newsdesk görev verir, muhabir parçaları (gfx'li) gönderir, editoryal kontrol ve dil
// denetimi parça parça, metin hazır olunca gfx Grafik'te açılır, yükleme gfx'i bekler, yayın kararı paketi kapatır.
// Organizasyon'da İş akışları yerine Üretim şablonları; Newsdesk anahtarı kalktı (Devral hiç yok).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v24", JSON.stringify(x)); localStorage.setItem("trt-planlama-v24-iz", String(Date.now())); }, d);
  const kim = async (id, h) => { await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), id); await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await kim("yo3", "#/");

  // Organizasyon: eski adres şablonları açıyor; Grafik birimi yapıda.
  await kim("yo3", "#/organizasyon/akislar");
  ok((await p.locator('[data-org-sekme="uretim"][aria-selected="true"]').count()) === 1, "eski İş akışları adresi Üretim şablonları sekmesini açıyor");
  ok((await p.locator("[data-uretim-sablon-satiri]").count()) === 6, "altı yerleşik şablon");
  ok((await p.locator('[data-org-sekme="akislar"]').count()) === 0, "İş akışları sekmesi yok");

  // Onaylı Next Day paketi hazırlanıyor; Newsdesk anahtarı açık bile olsa Devral yok.
  let d = await veri();
  d.newsdeskDevrede = true;
  const plan = d.planlar.filter((x) => x.durum !== "devralindi").sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
  plan.durum = "onayli";
  const pk = d.paketler.find((x) => x.planId === plan.id && x.tur === "haber" && !x.ozelId) || d.paketler.find((x) => x.tur === "haber" && !x.ozelId);
  Object.assign(pk, { durum: "onaylandi", muhabirId: "mu1", planId: plan.id, adim: undefined, isaret: undefined, uretim: undefined, parcalar: undefined, masaTakibi: undefined, gorev: undefined, stok: undefined });
  await yaz(d);
  await kim("nd1", "#/nextday/" + plan.id);
  ok((await p.locator("button", { hasText: "Planı Newsdesk olarak devral" }).count()) === 0, "Newsdesk anahtarı kayıtta açık olsa da Devral yok");

  // Balon: şablon kolundan seçili gelir; tikler istisna olur; şablon kaydedilir; üretim başlar.
  await kim("yo3", "#/paketler/" + pk.id);
  await p.click(`[data-uretim-ac="${pk.id}"]`);
  await p.waitForTimeout(300);
  ok((await p.locator('[data-uretim-sablon="u-gunluk-pl"][aria-pressed="true"]').count()) === 1, "haber paketi Planlama'nın günlük şablonuyla açılıyor");
  ok((await p.locator('[data-uretim-asama="grafik"].kapali').count()) === 1, "gfx seçilmeden Grafik satırı kapalı");
  await p.check('[data-uretim-parca="gfx"]');
  for (const a of ["gorev", "editoryal", "yukleme", "yayin"]) await p.click(`[data-uretim-tik="${a}:newsdesk"]`);
  ok((await p.locator('[data-uretim-asama="grafik"]:not(.kapali)').count()) === 1, "gfx seçilince Grafik satırı açık");
  ok((await p.locator("tr.istisna").count()) >= 4, "şablondan farklı satırlar istisna");
  await p.click("[data-uretim-sablon-ac]");
  await p.fill("[data-uretim-sablon-adi]", "Günlük haber · gfx'li Newsdesk");
  await p.click('[data-uretim-sablon-formu] button[type="submit"]');
  await p.waitForTimeout(300);
  ok((await p.locator("[data-uretim-sablon]").count()) === 7, "yeni şablon listede");
  ok((await p.locator("tr.istisna").count()) === 0, "kaydedilen şablon seçili, istisna kalmadı");
  await p.click("[data-uretim-gonder]");
  await p.waitForTimeout(400);
  d = await veri();
  let x = d.paketler.find((y) => y.id === pk.id);
  ok(x.durum === "uretimde" && x.adim === "newsdesk" && x.uretim?.yol.editoryal === "newsdesk" && x.uretim?.parca.gfx, `üretim başladı (${x.durum}, ${x.adim})`);
  ok((d.uretimSablonlari || []).length === 7, "şablonlar kayıtta");
  ok((await p.locator("[data-uretim-ozet] li").count()) >= 6, "paket sayfasında üretim yolu kartı");
  {
    const asamalar = await p.locator(".asama-buyuk").innerText();
    ok(/Görevlendirme/.test(asamalar) && !/News Gathering|Teknik/.test(asamalar), "aşamalar balondaki yol, eski beş aşama yok");
    const rozet = await p.locator(".sayfa-basi").innerText();
    ok(!/devraldı/.test(rozet), "durum rozetinde eski 'Newsdesk devraldı' adı yok");
  }

  // Newsdesk görev verir.
  await kim("nd1", "#/paketler/" + pk.id);
  await p.locator("button", { hasText: "Muhabire görev ver" }).click();
  await p.waitForTimeout(300);
  ok((await veri()).paketler.find((y) => y.id === pk.id).adim === "metin", "görev verildi, metin durağında");

  // Muhabir parçaları gönderir: Metin ve Gfx önerileri.
  await kim("mu1", "#/paketler/" + pk.id);
  for (const ad of ["Metin", "Gfx"]) {
    await p.click("[data-parca-ekle]");
    ok((await p.locator("[data-parca-onerileri] button").count()) === 2, "parça adı önerileri (Metin, Gfx)");
    await p.locator("[data-parca-onerileri] button", { hasText: ad }).click();
    await p.fill("[data-parca-metni]", "نص تجريبي " + ad);
    await p.click("[data-parca-gonder]");
    await p.waitForTimeout(300);
  }
  ok((await veri()).paketler.find((y) => y.id === pk.id).parcalar.every((y) => y.asama === "newsdesk"), "parçalar editoryal kontrolde (Newsdesk)");
  ok((await p.locator('[data-parca-asama="newsdesk"]').first().innerText()).includes("Editoryal kontrol"), "rozet aşamayı ve masayı söylüyor");

  // Editoryal kontrol Newsdesk'te, dil Script Editor'de.
  await kim("nd1", "#/paketler/" + pk.id);
  while (await p.locator("[data-parca-ilerlet]").count()) { await p.locator("[data-parca-ilerlet]").first().click(); await p.waitForTimeout(250); }
  await kim("ou2", "#/paketler/" + pk.id);
  while (await p.locator("[data-parca-ilerlet]").count()) { await p.locator("[data-parca-ilerlet]").first().click(); await p.waitForTimeout(250); }
  d = await veri();
  ok(d.paketler.find((y) => y.id === pk.id).parcalar.every((y) => y.asama === "tamam"), "parçalar hazır");
  ok(d.hareketler.some((h) => h.tip === "gfxSirada" && h.paketId === pk.id && h.veri?.sahip === "grafik"), "Grafik'e gfx sırası haberi");

  // Muhabir videoyu gönderir; yükleme gfx'i bekliyor.
  await kim("mu1", "#/paketler/" + pk.id);
  await p.fill("[data-parca-video]", "https://ornek.local/v1");
  await p.click("[data-parca-video-gonder]");
  await p.waitForTimeout(300);
  ok((await veri()).paketler.find((y) => y.id === pk.id).adim === "inews", "video kontrolü atlandı, yüklemede");
  await kim("nd1", "#/paketler/" + pk.id);
  ok(await p.locator("[data-sistem-yukle]").isDisabled(), "yükleme gfx'i bekliyor");

  // Grafik gfx'i bitirir (Sıradaki işlerim'de de görünür), yükleme açılır.
  await kim("gr1", "#/");
  ok((await p.getByText(pk.baslik).count()) > 0, "gfx işi grafikerin sıradaki işlerinde");
  await kim("gr1", "#/paketler/" + pk.id);
  await p.click("[data-gfx-hazir]");
  await p.waitForTimeout(300);
  await kim("nd1", "#/paketler/" + pk.id);
  await p.click("[data-sistem-yukle]");
  await p.waitForTimeout(300);
  ok((await veri()).paketler.find((y) => y.id === pk.id).adim === "yayin", "yüklendi, yayın kararında");
  await p.click("[data-durak-tamamla]");
  await p.waitForTimeout(300);
  ok((await veri()).paketler.find((y) => y.id === pk.id).durum === "tamamlandi", "yayın kararıyla paket kapandı");

  // Telefonda Arapça: balon taşırmıyor (tablo kendi içinde kayar).
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const t = await c.newPage();
  await t.goto(B);
  await t.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "ar"); });
  d = await veri();
  const ikinci = d.paketler.find((y) => y.durum === "onaylandi" && !y.ozelId && !y.masaTakibi && !y.isaret);
  await t.evaluate((x) => { localStorage.setItem("trt-planlama-v24", JSON.stringify(x)); }, d);
  if (ikinci) {
    await t.goto("about:blank"); await t.goto(B + "#/paketler/" + ikinci.id); await t.waitForTimeout(700);
    await t.click(`[data-uretim-ac="${ikinci.id}"]`); await t.waitForTimeout(300);
    ok((await t.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "ar telefon: balon taşmıyor");
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
