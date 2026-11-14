// Weekly kesinleşince toplantıda reddedilen kalem plandan çıkıyor; öneriden geldiyse öneri reddedilir, gerekçesi
// toplantının notu. Bu kuraldan önce kesinleşmiş haftadaki ret kalemi açılış işi temizliyor.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);

  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "yo3");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik");
  await p.waitForTimeout(1200);
  const { hid, retId, oneriId, eskiId } = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum !== "kesinlesti");
    h.durum = "toplantida";
    h.kalemler.forEach((x) => {
      x.karar = "kabul";
      delete x.onInceleme;
    });
    const o = d.oneriler.find((x) => x.muhabirId && !x.takipTuru && x.bicim !== "takip");
    o.durum = "degerlendiriliyor";
    o.hafta = h.baslangic;
    const ret = { ...h.kalemler[0], id: "kl-ret-test", karar: "ret", kararNotu: "Bu hafta yer yok", oneriId: o.id };
    delete ret.aktarim;
    h.kalemler.push(ret);
    // Önceden kesinleşmiş hafta: ret kalemi duruyor (kuraldan önce).
    const eski = d.haftalik.find((x) => x.durum === "kesinlesti" && x.id !== h.id) ?? { ...h, id: "hf-eski-test", baslangic: "2020-01-04", kalemler: [] };
    eski.durum = "kesinlesti";
    eski.kalemler = [...eski.kalemler, { ...ret, id: "kl-eski-ret", oneriId: undefined }];
    if (!d.haftalik.includes(eski)) d.haftalik.push(eski);
    localStorage.setItem(k, JSON.stringify(d));
    return { hid: h.id, retId: ret.id, oneriId: o.id, eskiId: eski.id };
  }, K);

  // Açılış işi eski haftayı temizliyor.
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1500);
  let d = await oku();
  ok(!d.haftalik.find((h) => h.id === eskiId).kalemler.some((k) => k.id === "kl-eski-ret"), "eski kesinleşmiş haftada ret kalemi kalktı");
  ok(d.haftalik.find((h) => h.id === hid).kalemler.some((k) => k.id === retId), "toplantıdaki ret kalemi kesinleşmeden duruyor");

  await p.locator("[data-gozden-ac]").click();
  await p.waitForTimeout(400);
  ok(/1 reddedilen plandan çıkacak/.test(await p.locator("[data-gozden-ozet]").innerText()), "özette çıkacak sayısı");
  await p.locator("[data-gozden-kesinlestir]").click();
  await p.waitForTimeout(600);
  d = await oku();
  const h = d.haftalik.find((x) => x.id === hid);
  ok(h.durum === "kesinlesti", "hafta kesinleşti");
  ok(!h.kalemler.some((k) => k.id === retId), "ret kalemi plandan çıktı");
  ok(h.kalemler.length > 0 && h.kalemler.every((k) => k.karar !== "ret"), "kabul kalemleri yerinde");
  const o = d.oneriler.find((x) => x.id === oneriId);
  ok(o.durum === "reddedildi" && o.gerekce === "Bu hafta yer yok", "öneri reddedildi, gerekçe toplantının notu");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(800);
  ok(!(await p.locator('[data-karar="ret"]').count()), "ekranda ret kalemi yok");

  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
