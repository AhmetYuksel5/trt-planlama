// İndirme sayfası (plannersflow.net/download; kullanıcı: Android indir, iPhone'a yol göster): uygulamanın
// dışında statik sayfa. Cihazın kartı başta ve işaretli, dil tarayıcıdan, Arapçada sağdan sola, taşma yok,
// APK bağlantısı çalışıyor.
const { chromium, devices } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/download/";
let gec = 0, kal = 0;
const bak = (ad, kosul) => (kosul ? gec++ : (kal++, console.log("KALDI:", ad)));
(async () => {
  const b = await chromium.launch();
  const dene = async (ad, opt, dil, beklenen) => {
    const c = await b.newContext({ ...opt, locale: dil });
    const p = await c.newPage();
    const hatalar = [];
    p.on("pageerror", (e) => hatalar.push(e.message));
    await p.goto(B);
    await p.waitForLoadState("networkidle");
    const t = await p.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      dir: document.dir,
      ilk: document.querySelector(".kart").id,
      rozet: !document.querySelector(".kart.bu .rozet")?.hidden,
      logo: document.querySelector(".logo").naturalWidth,
    }));
    const apk = await p.evaluate(async () => (await fetch(document.querySelector(".dugme").href)).status);
    bak(`${ad}: hata yok`, hatalar.length === 0);
    bak(`${ad}: taşma yok`, t.tasma <= 0);
    bak(`${ad}: logo`, t.logo > 0);
    bak(`${ad}: APK`, apk === 200);
    bak(`${ad}: yön`, t.dir === beklenen.dir);
    if (beklenen.ilk) bak(`${ad}: cihazın kartı başta`, t.ilk === beklenen.ilk && t.rozet);
    if (ad === "masaüstü") {
      await p.click('[data-dil="ar"]');
      bak("dil seçimi", (await p.evaluate(() => document.dir)) === "rtl");
    }
    await c.close();
  };
  await dene("android", devices["Pixel 7"], "tr-TR", { dir: "ltr", ilk: "android" });
  await dene("iphone", devices["iPhone 13"], "ar", { dir: "rtl", ilk: "ios" });
  await dene("dar", { viewport: { width: 320, height: 700 } }, "en-US", { dir: "ltr" });
  await dene("masaüstü", { viewport: { width: 1280, height: 860 } }, "tr-TR", { dir: "ltr" });
  console.log(`indir: ${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
