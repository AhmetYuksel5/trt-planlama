// Takvim botu: gündem haberlerinde ileri tarihle geçen olaylar takvime aday; Planlama ekler ya da "ilgisiz" der. Haberler kurgusal (demo akışı).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(700); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const oturum = (id) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), id);
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await p.goto(B);
  await oturum("pl1");
  await git("#/takvim");
  const v0 = await veri();
  const adaylar = v0.takvimAdaylari ?? [];
  ok(adaylar.length === 3, "örnek akıştan üç aday (aynı zirveyi veren iki haber tek aday): " + adaylar.length);
  const zirve = adaylar.find((a) => a.tur === "zirve");
  ok(zirve && zirve.haberSayisi === 2, "zirve iki haberden");
  ok(adaylar.some((a) => a.tur === "ziyaret") && adaylar.some((a) => a.tur === "parlamento"), "ziyaret (yarın) ve meclis (İngilizce tarih) bulundu");
  ok((await p.locator("[data-tb-ac]").innerText()).includes("3"), "takvimde 'Bulunan faaliyetler' düğmesi, sayısıyla");
  await p.locator("[data-tb-ac]").click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-tb-aday]").count()) === 3, "pencerede üç aday");
  // İlgisiz
  const ziyaret = adaylar.find((a) => a.tur === "ziyaret");
  await p.locator(`[data-tb-aday="${ziyaret.id}"] [data-tb-ilgisiz]`).click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-tb-aday]").count()) === 2, "ilgisiz denen listeden kalktı");
  ok((await veri()).takvimAdaylari.find((a) => a.id === ziyaret.id).durum === "ilgisiz", "kararı kayıtta");
  // Takvime ekle: form haberden dolu açılır
  await p.locator(`[data-tb-aday="${zirve.id}"] [data-tb-ekle]`).click();
  await p.waitForTimeout(300);
  const form = p.locator("dialog[open]").last();
  ok((await form.locator(".tk-form input").first().inputValue()) === zirve.baslik, "form adayın başlığıyla açıldı");
  ok((await form.locator('input[type="date"]').first().inputValue()) === zirve.tarih, "form adayın tarihiyle açıldı");
  await form.locator("footer .dugme:not(.dugme-ikincil)").click();
  await p.waitForTimeout(400);
  const v1 = await veri();
  const z1 = v1.takvimAdaylari.find((a) => a.id === zirve.id);
  const f = v1.faaliyetler.find((x) => x.id === z1.faaliyetId);
  ok(z1.durum === "eklendi" && f && f.baslangic === zirve.tarih && f.tur === "zirve", "faaliyet eklendi, aday 'eklendi'");
  ok((f.notlar ?? "").includes(zirve.baglanti), "faaliyetin notunda kaynak bağlantısı");
  ok((await p.locator("[data-tb-ac]").innerText()).includes("1"), "düğmede kalan bir aday");
  // Gündem yeniden taranınca kararı verilmiş aday geri gelmez, çoğalmaz
  await oturum("yo3");
  await git("#/gundem/akis");
  await p.waitForTimeout(500);
  const v2 = await veri();
  ok(v2.takvimAdaylari.length === 3, "gündem açılınca aday çoğalmadı: " + v2.takvimAdaylari.length);
  ok(v2.takvimAdaylari.find((a) => a.id === ziyaret.id).durum === "ilgisiz", "ilgisiz denen geri gelmedi");
  // Muhabir düğmeyi görmez
  const mu = v2.kisiler.find((k) => k.birim === "muhabir" && !k.pasif);
  await oturum(mu.id);
  await git("#/takvim");
  ok((await p.locator("[data-tb-ac]").count()) === 0, "muhabir bulunan faaliyetleri görmez");
  // Telefonda ve Arapçada taşma yok
  await oturum("pl1");
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/takvim");
    await p.locator("[data-tb-ac]").click();
    await p.waitForTimeout(300);
    const t1 = await p.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? g.scrollWidth - g.clientWidth : -1; });
    const t2 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t1 >= 0 && t1 <= 1 && t2 <= 0, `390px taşmıyor (${dil}): pencere ${t1}, sayfa ${t2}`);
    if (dil === "tr") await p.screenshot({ path: (process.env.OUT || "/tmp") + "/takvim-botu-390.png" });
  }
  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
