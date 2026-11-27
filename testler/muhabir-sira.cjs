// Muhabir askıda kalmasın (kullanıcı; üç ajanın önerisi): sıra kimde tek kuraldan (muhabirDurumu.ts),
// gönderim anında "Şimdi / Sonra", paket sayfasında muhabirin şeridi, Yapılacaklar'da sırası başkasında
// olan iş "İzle"; stand (PTC) onayı ayrı bildirim, onayda kısa not muhabire, "Değişiklikleri göster" muhabirde.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);
  const kim = async (id, h) => { await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), id); await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await kim("yo3", "#/");

  let d = await veri();
  const plan = d.planlar.filter((x) => x.durum !== "devralindi").sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
  plan.durum = "onayli";
  const pk = d.paketler.find((x) => x.planId === plan.id && x.tur === "haber" && !x.ozelId) || d.paketler.find((x) => x.tur === "haber" && !x.ozelId);
  Object.assign(pk, { durum: "onaylandi", muhabirId: "mu1", planId: plan.id, adim: undefined, isaret: undefined, uretim: undefined, parcalar: undefined, masaTakibi: undefined, gorev: undefined, stok: undefined, metin: undefined, sonTarih: plan.tarih });
  await yaz(d);
  const paket = async () => (await veri()).paketler.find((y) => y.id === pk.id);

  await kim("yo3", "#/paketler/" + pk.id);
  await p.click(`[data-uretim-ac="${pk.id}"]`);
  await p.waitForTimeout(300);
  await p.check('[data-uretim-parca="stand"]');
  await p.click('[data-uretim-tik="editoryal:newsdesk"]');
  await p.click("[data-uretim-gonder]");
  await p.waitForTimeout(400);
  ok((await paket()).adim === "metin", "üretim metin durağında");

  const gonder = async (tur, metin) => {
    await kim("mu1", "#/paketler/" + pk.id);
    await p.click("[data-parca-ekle]");
    await p.locator(`[data-parca-tur="${tur}"]`).click();
    await p.fill("[data-parca-metni]", metin);
    await p.click("[data-parca-gonder]");
    await p.waitForTimeout(300);
    return p.locator(".bildiri").last().innerText().catch(() => "");
  };

  // Intro gidiyor, stand bekleniyor: sıra hâlâ muhabirde.
  let bil = await gonder("intro", "مقدمة التقرير");
  ok(bil.includes("Sıra sende"), "intro gönderilince: stand beklendiği için sıra sende (" + bil + ")");
  // Stand da gidiyor: sıra Newsdesk'te.
  bil = await gonder("stand", "ستاند من الموقع");
  ok(bil.includes("Şimdi:") && bil.includes("Newsdesk"), "gönderim bildiriminde şimdi ve birim (" + bil + ")");
  await kim("mu1", "#/paketler/" + pk.id);
  ok((await p.locator('[data-muhabir-durum="baska"]').count()) === 1, "şerit: sıra sende değil");
  const serit = await p.locator("[data-muhabir-durum]").innerText();
  ok(serit.includes("Newsdesk") && serit.includes("itibarıyla") && serit.includes("0/2"), "şeritte birim, olgu ve parça sayısı (" + serit + ")");
  ok(!/\d+ ?dk/.test(serit), "süre vaadi yok");
  await kim("mu1", "#/yapilacaklar");
  const satir = p.locator(`[data-yapilacak="${pk.id}"]`);
  ok((await satir.getAttribute("data-sirasi")) === "baska", "Yapılacaklar: sıra başkasında");
  ok((await satir.innerText()).includes("Newsdesk"), "Yapılacaklar satırında birim");

  // Editör standı düzeltip notla geçirir; dil denetmeni son halini verir: muhabire ayrı stand haberi.
  await kim("nd1", "#/paketler/" + pk.id);
  const stand = p.locator('[data-parca-asama="newsdesk"]').filter({ hasText: "STAND" }).first();
  const standAd = await p.locator('[data-parca-asama="newsdesk"]').nth(1).getAttribute("data-parca");
  const kutu = p.locator(`[data-parca="${standAd}"]`);
  await kutu.locator("[data-parca-alan]").fill("ستاند معدل من الموقع");
  await kutu.locator("[data-parca-not]").fill("لا يتجاوز عشرين ثانية");
  await kutu.locator("[data-parca-ilerlet]").click();
  await p.waitForTimeout(300);
  void stand;
  d = await veri();
  const duz = d.hareketler.find((h) => h.tip === "parcaDuzeltildi" && h.paketId === pk.id && h.veri?.not);
  ok(duz && duz.veri.kime === "mu1", "onay notu muhabire (kime)");
  await kim("ou2", "#/paketler/" + pk.id);
  await p.locator(`[data-parca="${standAd}"] [data-parca-ilerlet]`).click();
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.hareketler.some((h) => h.tip === "parcaStandOnaylandi" && h.paketId === pk.id && h.veri?.kime === "mu1"), "stand onayı ayrı bildirim");

  // Muhabir: notu, farkı ve zilde stand onayını görür.
  await kim("mu1", "#/paketler/" + pk.id);
  ok((await p.locator(`[data-parca="${standAd}"] [data-parca-onay-notu]`).innerText()).includes("عشرين"), "muhabir onay notunu görüyor");
  ok((await p.locator(`[data-parca="${standAd}"] [data-parca-farki]`).count()) === 1, "muhabire 'Değişiklikleri göster'");
  await p.locator(".zil, [data-zil], button[aria-label*='Bildirim']").first().click().catch(() => {});
  await p.waitForTimeout(300);
  ok((await p.locator("body").innerText()).includes("stand (PTC)"), "zilde stand onayı");

  // Intro da geçince metin hazır: sıra muhabirde, iş video.
  await kim("nd1", "#/paketler/" + pk.id);
  await p.locator("[data-parca-ilerlet]").first().click();
  await p.waitForTimeout(300);
  await kim("ou2", "#/paketler/" + pk.id);
  await p.locator("[data-parca-ilerlet]").first().click();
  await p.waitForTimeout(300);
  await kim("mu1", "#/paketler/" + pk.id);
  ok((await p.locator('[data-muhabir-durum="sende"]').innerText()).includes("Video"), "şerit: sıra sende, video");
  await kim("mu1", "#/yapilacaklar");
  ok((await p.locator(`[data-yapilacak="${pk.id}"]`).getAttribute("data-sirasi")) === "muhabir", "Yapılacaklar: sıra muhabirde");

  // Telefonda taşma yok, Arapçada da.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "ar"));
  await kim("mu1", "#/paketler/" + pk.id);
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390'da taşma yok");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`muhabir-sira: ${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
