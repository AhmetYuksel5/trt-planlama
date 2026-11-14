// Yeni paket yolu: parçalı metin (muhabir → Newsdesk düzelt/iade → Script Editor), video bütün parçalar dönünce, video kontrolünde revizyon, kodsuz sisteme yükleme
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); }); p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/", K = "trt-planlama-v25";
  const sonuc = {};
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
  const k = await p.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K));
    const pk = d.paketler.find((x) => x.tur === "haber" && x.muhabirId && d.kisiler.find((y) => y.id === x.muhabirId && y.birim === "muhabir"));
    Object.assign(pk, { durum: "uretimde", adim: "metin", akis: { id: "yol", surum: 0 }, parcalar: [], uretim: undefined, video: undefined, metin: undefined });
    localStorage.setItem(K, JSON.stringify(d));
    const nd = d.kisiler.find((y) => y.birim === "newsdesk" && y.rol !== "yonetici" && !y.pasif);
    const dd = d.kisiler.find((y) => y.gorev === "dilDenetmeni" && y.rol !== "yonetici" && !y.pasif);
    return { pk: pk.id, m: pk.muhabirId, nd: nd.id, dd: dd.id };
  }, K);
  const gir = async (kisi, yol) => { await p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), kisi); await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1000); };
  const pak = () => p.evaluate(([K, id]) => JSON.parse(localStorage.getItem(K)).paketler.find((x) => x.id === id), [K, k.pk]);
  // Muhabir iki parça gönderir; video düğmesi kapalı
  await gir(k.m, `#/paketler/${k.pk}`);
  for (const [ad, m] of [["INTRO", "مقدمة التقرير"], ["PTC", "نص الظهور أمام الكاميرا"]]) {
    await p.click("[data-parca-ekle]"); await p.fill("[data-parca-adi]", ad); await p.fill("[data-parca-metni]", m); await p.click("[data-parca-gonder]"); await p.waitForTimeout(300);
  }
  sonuc.ikiParca = (await pak()).parcalar.filter((x) => x.asama === "newsdesk").length === 2;
  sonuc.videoKapali = await p.locator("[data-parca-video-gonder]").isDisabled();
  // Newsdesk: INTRO'yu iade, PTC'yi düzeltip ilerletir
  await gir(k.nd, `#/paketler/${k.pk}`);
  await p.locator('[data-parca="INTRO"] [data-parca-iade]').click(); await p.fill("[data-parca-iade-gerekce]", "أعد الصياغة"); await p.click("[data-parca-iade-gonder]"); await p.waitForTimeout(300);
  await p.locator('[data-parca="PTC"] [data-parca-alan]').fill("نص الظهور المصحح"); await p.locator('[data-parca="PTC"] [data-parca-ilerlet]').click(); await p.waitForTimeout(300);
  let x = await pak();
  sonuc.iade = x.parcalar[0].asama === "muhabir" && x.parcalar[0].iade === "أعد الصياغة" && x.parcalar[1].asama === "dil";
  // Script Editor sayfasında PTC
  await gir(k.dd, "#/");
  sonuc.ddKart = await p.locator("[data-dd-metin]").count() >= 1;
  await p.locator(`[data-dd-metin="${x.parcalar[1].id}"] [data-dd-gonder]`).click(); await p.waitForTimeout(300);
  // Muhabir INTRO'yu düzeltir; Newsdesk ve Script Editor geçirir
  await gir(k.m, `#/paketler/${k.pk}`);
  await p.locator('[data-parca="INTRO"] [data-parca-duzenle]').click(); await p.fill("[data-parca-metni]", "مقدمة جديدة"); await p.click("[data-parca-gonder]"); await p.waitForTimeout(300);
  await gir(k.nd, `#/paketler/${k.pk}`); await p.locator('[data-parca="INTRO"] [data-parca-ilerlet]').click(); await p.waitForTimeout(300);
  await gir(k.dd, `#/paketler/${k.pk}`); await p.locator('[data-parca="INTRO"] [data-parca-ilerlet]').click(); await p.waitForTimeout(300);
  x = await pak(); sonuc.parcalarHazir = x.parcalar.every((y) => y.asama === "tamam") && x.metin.includes("نص الظهور المصحح");
  // Muhabir videoyu gönderir
  await gir(k.m, `#/paketler/${k.pk}`);
  await p.fill("[data-parca-video]", "https://ornek.test/v1"); await p.click("[data-parca-video-gonder]"); await p.waitForTimeout(300);
  sonuc.videoKontrolde = (await pak()).adim === "videoKontrol";
  // Newsdesk revizyona gönderir, muhabir yeni videoyu yollar, Newsdesk onaylar ve kodsuz yükler
  await gir(k.nd, `#/paketler/${k.pk}`);
  await p.click("[data-video-revizyon]"); await p.fill("[data-geri-gerekce]", "الصوت منخفض"); await p.locator("[data-geri-gerekce] ~ * .dugme-kotu, .form-kutu .dugme-kotu").last().click(); await p.waitForTimeout(300);
  x = await pak(); sonuc.revizyon = x.adim === "metin" && x.videoIade === "الصوت منخفض";
  await gir(k.m, `#/paketler/${k.pk}`);
  await p.fill("[data-parca-video]", "https://ornek.test/v2"); await p.click("[data-parca-video-gonder]"); await p.waitForTimeout(300);
  await gir(k.nd, `#/paketler/${k.pk}`); await p.click("[data-video-onayla]"); await p.waitForTimeout(300);
  await gir(k.nd, `#/paketler/${k.pk}`); await p.click("[data-sistem-yukle]"); await p.waitForTimeout(300);
  x = await pak(); sonuc.yayinaHazir = x.durum === "tamamlandi" && !x.klipKodu && x.video === "https://ornek.test/v2";
  console.log(sonuc, "hata", hata);
  await b.close(); process.exit(Object.values(sonuc).every(Boolean) && !hata ? 0 : 1);
})();
