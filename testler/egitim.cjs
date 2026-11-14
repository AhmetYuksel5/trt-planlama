// Eğitim sahnesi: roller yan yana bölmelerde kendi kişileriyle; sıradaki adım kayıttan,
// adımın bölmesi etkin ve düğmesi vurgulu; öneriden yayına hazır pakete kadar yürünür.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  let hata = 0;
  p.on("pageerror", (e) => (hata++, console.log("HATA", String(e))));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  let gec = 0, kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  const bolme = (id) => p.frameLocator(`[data-egitim-bolme="${id}"] iframe`);
  const is = () => p.locator("[data-egitim-is]").getAttribute("data-egitim-is");
  const bekle = async (ad, ms = 8000) => {
    for (let i = 0; i < ms / 200; i++) { if ((await is()) === ad) return true; await p.waitForTimeout(200); }
    console.log("  şimdiki:", await is()); return false;
  };
  const vurgulu = async (id, secici) => {
    for (let i = 0; i < 25; i++) { if (await bolme(id).locator(`${secici}.egitim-vurgu`).count()) return true; await p.waitForTimeout(200); }
    return false;
  };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await p.goto("about:blank"); await p.goto(B + "#/egitim"); await p.waitForTimeout(600);
  await p.click('[data-egitim-duzen="yan"]');
  await p.click("[data-egitim-baslat]"); await p.waitForTimeout(2500);
  ok((await p.locator("[data-egitim-bolme]").count()) === 4, "dört rolün bölmesi");
  ok(await bekle("egOneri"), "ilk adım muhabirin önerisi");
  ok((await p.locator('[data-egitim-bolme="mu1"][data-egitim-aktif]').count()) === 1, "muhabirin bölmesi etkin");
  ok(await vurgulu("mu1", "[data-oneri-gonder]"), "Gönder düğmesi vurgulu");
  ok((await p.evaluate(() => localStorage.getItem("trt-planlama-oturum"))) === "yo3", "bölmeler tarayıcının oturumunu değiştirmedi");

  // 1. Muhabir öneriyi gönderir.
  const mu = bolme("mu1");
  await mu.locator("textarea").nth(0).fill("زيارة وزير الخارجية إلى أنقرة");
  await mu.locator("textarea").nth(1).fill("يزور الوزير أنقرة غدا لبحث الملفات الإقليمية");
  await mu.locator("[data-oneri-gonder]").click();
  ok(await bekle("egPlan"), "öneri gidince sıra Planlama'da");
  ok(await vurgulu("pl1", "[data-oneri-plana-ekle]"), "Planlama'nın bölmesi öneriyi açtı, Plana ekle vurgulu");
  const pl = bolme("pl1");
  await pl.locator("[data-oneri-plana-ekle]").click(); await p.waitForTimeout(300);
  await pl.locator("[data-pe-ekle]").click();
  ok(await bekle("egKabul"), "plana eklenince kabul adımı");
  ok((await p.locator('[data-egitim-adim="oneri"][data-egitim-durum="gecti"]').count()) === 1, "öneri adımı geçti işaretli");
  await pl.locator("[data-paket-kabul]").click();
  ok(await bekle("egUretim"), "kabulden sonra üretim adımı");
  await pl.locator("[data-uretim-ac]").click(); await p.waitForTimeout(300);
  ok(await vurgulu("pl1", "[data-uretim-sablon='u-gunluk']"), "balonda Newsdesk şablonu vurgulu");
  await pl.locator("[data-uretim-sablon=u-gunluk]").click();
  await pl.locator("[data-uretim-gonder]").click();
  ok(await bekle("egGorev"), "üretim başlayınca görev adımı");
  ok((await p.locator('[data-egitim-bolme="nd1"][data-egitim-aktif]').count()) === 1, "Newsdesk bölmesi etkin");
  ok((await p.locator("[data-egitim-adim]").count()) > 6, "üretim aşamaları listede");
  await bolme("nd1").locator("[data-durak-gorev]").click();
  ok(await bekle("egParca"), "görevden sonra muhabir parça gönderir");
  await mu.locator("[data-parca-ekle]").click();
  await mu.locator("[data-parca-adi]").fill("Metin");
  await mu.locator("[data-parca-metni]").fill("نص التقرير الأول");
  await mu.locator("[data-parca-gonder]").click();
  ok(await bekle("egEditorAdimi"), "parça editörde");
  await bolme("nd1").locator("[data-parca-ilerlet]").click();
  ok(await bekle("egDil"), "parça dil denetiminde");
  ok((await p.locator('[data-egitim-bolme="ou2"][data-egitim-aktif]').count()) === 1, "dil denetmeninin bölmesi etkin");
  await bolme("ou2").locator("[data-dd-gonder]").click();
  ok(await bekle("egVideo"), "parçalar hazır, video sırası");
  await mu.locator("[data-parca-video]").fill("https://ornek.local/video1");
  await mu.locator("[data-parca-video-gonder]").click();
  ok(await bekle("egVideoKontrol"), "video kontrolü");
  await bolme("nd1").locator("[data-video-onayla]").click();
  ok(await bekle("egYukleme"), "yükleme");
  await bolme("nd1").locator("[data-sistem-yukle]").click();
  ok(await bekle("egYayin"), "yayın kararı");
  await bolme("nd1").locator("[data-durak-tamamla]").click();
  ok(await bekle("bitti"), "senaryo bitti");
  ok((await p.locator('[data-egitim-durum="simdi"]').count()) === 0, "bütün adımlar geçti");

  // Tek ekran: bölme bir tane, kişisi sıradaki adımınki.
  await p.click('[data-egitim-duzen="tek"]');
  await p.click("[data-egitim-baslat]"); await p.waitForTimeout(2500);
  ok((await p.locator("[data-egitim-bolme]").count()) === 1 && (await p.locator('[data-egitim-bolme="mu1"]').count()) === 1, "tek ekranda muhabirin bölmesi");
  const tek = bolme("mu1");
  await tek.locator("textarea").nth(0).fill("زيارة مرتقبة");
  await tek.locator("textarea").nth(1).fill("تفاصيل الزيارة المرتقبة غدا");
  await tek.locator("[data-oneri-gonder]").click();
  ok(await bekle("egPlan"), "tek ekranda sıra Planlama'da");
  await p.waitForTimeout(1500);
  ok((await p.locator('[data-egitim-bolme="pl1"]').count()) === 1, "tek ekranda bölme Planlama'ya geçti");
  ok(await vurgulu("pl1", "[data-oneri-plana-ekle]"), "tek ekranda düğme vurgulu");

  // 390 piksel: taşma yok (Türkçe ve Arapça).
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.goto("about:blank"); await p.goto(B + "#/egitim"); await p.waitForTimeout(1200);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(t <= 0, `${dil}: 390 pikselde taşma ${t}`);
  }
  ok(hata === 0, "sayfa hatası yok");
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
