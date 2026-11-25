// Balonda beklenen parçalar (kullanıcı: muhabir intro'yu gönderip o onaylanınca metin bitmiş sayılıyordu, video
// açılıyor, Grafik'e haber gidiyordu; stand ve gfx hiç beklenmiyordu; uretim.ts → eksikParcalar, akis.ts →
// parcalarHazir). Parçalar ayrı zamanlarda gider; metin, işaretliyse stand ve gfx gelip denetimden geçmeden video
// açılmaz, metin birleşmez. Gfx'in haberi gfx parçası dil denetiminden geçince. Gelmeyen parça kartta "bekleniyor".
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
  Object.assign(pk, { durum: "onaylandi", muhabirId: "mu1", planId: plan.id, adim: undefined, isaret: undefined, uretim: undefined, parcalar: undefined, masaTakibi: undefined, gorev: undefined, stok: undefined, metin: undefined });
  await yaz(d);
  const paket = async () => (await veri()).paketler.find((y) => y.id === pk.id);

  // Balon: stand ve gfx'li, editoryal Newsdesk.
  await kim("yo3", "#/paketler/" + pk.id);
  await p.click(`[data-uretim-ac="${pk.id}"]`);
  await p.waitForTimeout(300);
  await p.check('[data-uretim-parca="stand"]');
  await p.check('[data-uretim-parca="gfx"]');
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
  };
  const denetle = async () => {
    for (const k of ["nd1", "ou2"]) {
      await kim(k, "#/paketler/" + pk.id);
      while (await p.locator("[data-parca-ilerlet]").count()) { await p.locator("[data-parca-ilerlet]").first().click(); await p.waitForTimeout(250); }
    }
  };
  const gfxHaberi = async () => (await veri()).hareketler.some((h) => h.tip === "gfxSirada" && h.paketId === pk.id);

  // Yalnız intro: onaylansa da metin bitmiş sayılmaz.
  await kim("mu1", "#/paketler/" + pk.id);
  ok((await p.locator("[data-parca-bekleniyor]").count()) === 3, "başta metin, stand ve gfx bekleniyor");
  await gonder("intro", "مقدمة التقرير");
  await denetle();
  let x = await paket();
  ok(x.parcalar.length === 1 && x.parcalar[0].asama === "tamam", "intro denetimden geçti");
  ok(!x.metin, "tek parçayla metin birleşmedi");
  ok(!(await gfxHaberi()), "gfx parçası yokken Grafik'e haber gitmedi");
  await kim("mu1", "#/paketler/" + pk.id);
  ok(await p.locator("[data-parca-video]").isDisabled(), "yalnız intro onaylıyken video kapalı");
  ok((await p.locator('[data-parca-bekleniyor="stand"]').count()) === 1 && (await p.locator('[data-parca-bekleniyor="gfx"]').count()) === 1 && (await p.locator('[data-parca-bekleniyor="metin"]').count()) === 0, "kartta stand ve gfx bekleniyor, intro metni karşıladı");

  // Gfx gelir: Grafik'e haber o an, stand hâlâ bekleniyor.
  await gonder("gfx", "نص الغرافيك");
  await denetle();
  ok(await gfxHaberi(), "gfx parçası dil denetiminden geçince Grafik'e haber");
  await kim("mu1", "#/paketler/" + pk.id);
  ok(await p.locator("[data-parca-video]").isDisabled(), "stand gelmeden video kapalı");
  ok(!(await paket()).metin, "stand gelmeden metin birleşmedi");

  // Stand gelir ve geçer: metin hazır, video açılır.
  await gonder("stand", "ستاند أب");
  await kim("mu1", "#/paketler/" + pk.id);
  ok(await p.locator("[data-parca-video]").isDisabled(), "stand denetimdeyken video kapalı");
  await denetle();
  x = await paket();
  ok(!!x.metin && x.metin.includes("ستاند أب") && x.metin.includes("مقدمة التقرير"), "bütün parçalarla metin birleşti");
  await kim("mu1", "#/paketler/" + pk.id);
  ok(!(await p.locator("[data-parca-video]").isDisabled()) && (await p.locator("[data-parca-bekleniyor]").count()) === 0, "video açıldı, bekleyen parça yok");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
