// Masalar ve stok (kullanıcı): ekonomi, program, spor paketleri stoka değil kendi masasına düşer (Next Day'den de);
// masa "Üretime al"ı yapar, muhabirin "Yapıldı"sı yok; bitmiş masa paketi Next Day "Hazır paketler"den seçilir;
// özel yayın paketlerini Planlama'nın stok ekibi dağıtır; Spor Output'un altında yeni birim.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(700); };
  const kim = async (id) => { await p.goto(B); await p.evaluate((k) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", "tr"); }, id); };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));

  // Örnek kayıtla aç, sonra deneme paketlerini kayda yaz
  await p.goto(B); await p.evaluate(() => localStorage.clear());
  await kim("pl1"); await git("#/");
  const ids = await p.evaluate(() => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const ornek = d.paketler.find((x) => !x.ozelId);
    const muhabir = d.kisiler.find((x) => x.birim === "muhabir");
    const yap = (id, ek) => ({ ...ornek, id, kod: id, baslik: "اختبار " + id, notlar: [], adim: undefined, akis: undefined, stok: undefined, isaret: undefined, yayinlandi: undefined, haftalikKalemId: undefined, oneriId: undefined, ozelId: undefined, muhabirId: muhabir.id, ...ek });
    const ozel = d.ozel?.[0];
    d.paketler.unshift(
      yap("t-ek-nd", { tur: "ekonomi", durum: "onaylandi", planId: plan.id, planBaslikId: plan.basliklar[0]?.id }),
      yap("t-ek-eski", { tur: "ekonomi", durum: "onaylandi", planId: undefined, stok: true }),
      yap("t-sp-hazir", { tur: "spor", durum: "tamamlandi", planId: undefined }),
      // Karşılaştırma: Next Day'deki haber paketi muhabirin "Yapıldı"sıyla kapanıyor (sade akış)
      yap("t-hb-nd", { tur: "haber", durum: "onaylandi", planId: plan.id, planBaslikId: plan.basliklar[0]?.id }),
      ...(ozel ? [yap("t-oz", { ozelId: ozel.id, ozelKaynak: "inhouse", ozelAd: ozel.ad, durum: "onaylandi", planId: undefined, muhabirId: undefined, sonTarih: ozel.tarih })] : []),
    );
    // Bir editörü Spor'a taşı (demoda Spor'da kimse yok)
    const ed = d.kisiler.find((x) => x.id === "ek3"); ed.birim = "spor";
    localStorage.setItem(k, JSON.stringify(d));
    return { plan: plan.id, ozel: !!ozel };
  });

  // Açılış işi: üretime alınmamış ekonomi stok paketi masasına geçer
  await git("#/");
  const d1 = await durum();
  ok(!d1.paketler.find((x) => x.id === "t-ek-eski").stok, "eski ekonomi stok paketinin stok işareti kalktı");

  // Ekonomi masası: Next Day'den gelen ekonomi paketi üretime alınacaklarda, "Üretime al" masada
  await kim("ek1"); await git("#/");
  const masa = p.locator('[data-masa="ekonomi"]');
  ok((await masa.count()) === 1, "Ekonomi ana sayfasında masa kartı");
  ok((await masa.locator('[data-uretime-al="t-ek-nd"]').count()) === 1, "Next Day'den gelen ekonomi paketi masada, Üretime al düğmesi");
  ok((await masa.locator('[data-uretime-al="t-ek-eski"]').count()) === 1, "stoktan ayrılan eski paket de masada");
  await masa.locator('[data-uretime-al="t-ek-nd"]').click(); await p.waitForTimeout(400);
  const pk = (await durum()).paketler.find((x) => x.id === "t-ek-nd");
  ok(pk.durum === "uretimde" && !!pk.adim, "Ekonomi üretime aldı: " + pk.durum + " " + pk.adim);
  await git("#/paketler/t-ek-nd");
  const kimde = await p.locator(".simdi-kimde").first().innerText();
  ok(kimde.includes("Ekonomi"), "üretimdeki ilk durak Ekonomi'de: " + kimde.replace(/\n/g, " "));

  // Muhabirin "Yapıldı / Yapılmadı"sı masa paketinde yok
  await kim("pl1"); await git("#/paketler/t-hb-nd");
  ok((await p.locator('[data-paket-yapildi="t-hb-nd"]').count()) === 1, "haber paketinde Yapıldı var (karşılaştırma)");
  await git("#/paketler/t-ek-eski");
  ok((await p.locator('[data-paket-yapildi="t-ek-eski"]').count()) === 0, "masa paketinde Yapıldı/Yapılmadı yok");

  // Planlama'nın Stok sayfasında ekonomi paketi yok
  await kim("pl6"); await git("#/stok");
  ok((await p.locator('a[href="#/paketler/t-ek-eski"]').count()) === 0, "ekonomi paketi Stok'ta değil");
  if (ids.ozel) {
    ok((await p.locator("[data-ozel-talep-alani]").count()) === 1, "özel yayın paketleri Stok sayfasında, stok ekibinde");
    ok((await p.locator("[data-ozel-talep-alani]").innerText()).includes("اختبار t-oz"), "in-house özel paket stok ekibinin listesinde");
  }
  await kim("ou1"); await git("#/");
  ok((await p.locator("[data-ozel-talep-alani]").count()) === 0, "Output'un ana sayfasında özel yayın paket kartı yok");

  // Next Day "Stoktan seç": bitmiş spor paketi seçilebiliyor
  await kim("pl1"); await git("#/nextday/" + ids.plan);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click())); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Stoktan seç" }).first().click(); await p.waitForTimeout(300);
  ok((await p.locator('[data-hazir-sec="t-sp-hazir"]').count()) === 1, "bitmiş spor paketi Hazır paketler'den seçilebiliyor");
  await p.locator('[data-hazir-sec="t-sp-hazir"]').click(); await p.waitForTimeout(400);
  ok((await durum()).planlar.find((x) => x.id === ids.plan).hazirPaketler.includes("t-sp-hazir"), "spor paketi planın hazır paketlerinde");

  // Spor: Output'un altında yeni birim, masası var
  await kim("ek3"); await git("#/");
  ok((await p.locator('[data-masa="spor"]').count()) === 1, "Spor biriminin ana sayfasında Spor masası");
  await kim("yo3"); await git("#/organizasyon/birimler");
  ok((await p.getByText("Spor", { exact: true }).count()) > 0, "Organizasyon'da Spor birimi");

  // 390px taşma (Ekonomi masası, Stok)
  await p.setViewportSize({ width: 390, height: 840 });
  for (const [k, h] of [["ek1", "#/"], ["pl6", "#/stok"]]) {
    await kim(k); await git(h);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${k} ${h}): ${t}`);
  }
  if (!ids.ozel) ok(false, "örnek veride özel yayın yok");
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
