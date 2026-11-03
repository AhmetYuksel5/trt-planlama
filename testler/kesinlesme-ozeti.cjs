// Weekly kesinleştirme sonucu sayıyla soruyor; gündeme alınmamış öneri "İptal"le açık kalıyor, kabul edilince reddediliyor
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/"; let kal = 0;
  const dene = async (acikKabul) => {
    const mesajlar = [];
    p.removeAllListeners("dialog");
    p.on("dialog", (x) => { mesajlar.push(x.message()); return mesajlar.length === 1 || acikKabul ? x.accept() : x.dismiss(); });
    await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); });
    await p.goto("about:blank"); await p.goto(B + "#/haftalik"); await p.waitForTimeout(1200);
    const hid = await p.evaluate(() => {
      const k = "trt-planlama-v23", d = JSON.parse(localStorage.getItem(k));
      const h = d.haftalik.find((x) => x.durum !== "kesinlesti");
      h.durum = "toplantida";
      h.kalemler.forEach((x) => { x.karar = "kabul"; delete x.onInceleme; });
      d.oneriler.unshift({ ...d.oneriler.find((o) => o.muhabirId && !o.takipTuru && !o.takipId && o.bicim !== "takip"), id: "o-acik-test", hafta: h.baslangic, durum: "yeni", hedefTarih: undefined, planId: undefined, paketId: undefined, arsiv: undefined });
      localStorage.setItem(k, JSON.stringify(d)); return h.id;
    });
    await p.goto("about:blank"); await p.goto(B + "#/haftalik/" + hid); await p.waitForTimeout(1200);
    await p.getByRole("button", { name: /Planı kesinleştir/ }).click(); await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v23")); return d.oneriler.find((o) => o.id === "o-acik-test").durum; });
    const ok = /haber Next Day'e geçecek/.test(mesajlar[0] ?? "") && /Gündeme alınmamış \d+/.test(mesajlar[1] ?? "") && s === (acikKabul ? "reddedildi" : "yeni");
    console.log(acikKabul ? "reddet" : "açık kalsın", JSON.stringify(mesajlar), s, ok ? "tamam" : "YANLIŞ");
    if (!ok) kal++;
  };
  await dene(false); await dene(true);
  await b.close(); process.exit(kal ? 1 : 0);
})();
