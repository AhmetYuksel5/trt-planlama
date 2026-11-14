// Weekly kesinleştirme gözden geçirme penceresinden: sonuç sayıyla yazılı; gündeme alınmamış öneri kutu kaldırılınca açık kalıyor, işaretliyken reddediliyor
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/"; let kal = 0;
  const dene = async (acikKabul) => {
    await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); });
    await p.goto("about:blank"); await p.goto(B + "#/haftalik"); await p.waitForTimeout(1200);
    const hid = await p.evaluate(() => {
      const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
      const h = d.haftalik.find((x) => x.durum !== "kesinlesti");
      h.durum = "toplantida";
      h.kalemler.forEach((x) => { x.karar = "kabul"; delete x.onInceleme; });
      d.oneriler.unshift({ ...d.oneriler.find((o) => o.muhabirId && !o.takipTuru && !o.takipId && o.bicim !== "takip"), id: "o-acik-test", hafta: h.baslangic, durum: "yeni", hedefTarih: undefined, planId: undefined, paketId: undefined, arsiv: undefined });
      localStorage.setItem(k, JSON.stringify(d)); return h.id;
    });
    await p.goto("about:blank"); await p.goto(B + "#/haftalik/" + hid); await p.waitForTimeout(1200);
    await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
    const ozet = await p.locator("[data-gozden-ozet]").innerText();
    const kutu = p.locator("[data-acik-reddet] input");
    const kutuVar = (await kutu.count()) === 1 && (await kutu.isChecked());
    if (!acikKabul) await kutu.uncheck();
    await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v25")); return d.oneriler.find((o) => o.id === "o-acik-test").durum; });
    const ok = /haber Next Day'e geçecek/.test(ozet) && kutuVar && s === (acikKabul ? "reddedildi" : "yeni");
    console.log(acikKabul ? "reddet" : "açık kalsın", ozet, s, ok ? "tamam" : "YANLIŞ");
    if (!ok) { kal++; console.log("✗ " + (acikKabul ? "reddet" : "açık kalsın")); }
  };
  await dene(false); await dene(true);
  await b.close(); console.log(`\n${2 - kal} geçti, ${kal} kaldı`); process.exit(kal ? 1 : 0);
})();
