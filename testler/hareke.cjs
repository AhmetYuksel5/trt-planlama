// Harekeler kırmızı (kullanıcı: dil denetimi harekeliyor): iki katman, altta tam metin kırmızı,
// üstte harekesiz metin; yazı alanında yazarken de. Kayıttaki metin düz kalır.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  let hata = 0;
  p.on("pageerror", (e) => (hata++, console.log("HATA", String(e))));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  let gec = 0, kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "ou2"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1500);
  const alan = p.locator(".hareke-alan textarea").first();
  ok((await alan.count()) === 1, "dil denetimi alanı harekeli alan");
  const metin = "تَعَانِي الْمُسْتَشْفَيَاتُ";
  await alan.fill(metin);
  const r = await p.evaluate(() => {
    const k = document.querySelector(".hareke-alan");
    const s = (x) => getComputedStyle(k.querySelector(x));
    return { alt: k.querySelector(".hareke-alt").textContent, ust: k.querySelector(".hareke-ust").textContent, altRenk: s(".hareke-alt").color, alanRenk: s("textarea").color };
  });
  ok(r.alt.trim() === metin, "alt katman tam metin");
  ok(r.ust.trim() === "تعاني المستشفيات", "üst katman harekesiz: " + r.ust);
  ok(r.altRenk === "rgb(212, 20, 30)", "alt katman kırmızı: " + r.altRenk);
  ok(r.alanRenk === "rgba(0, 0, 0, 0)", "yazı alanının kendi yazısı saydam: " + r.alanRenk);
  await p.locator("[data-dd-gonder]").first().click();
  await p.waitForTimeout(400);
  const kayit = await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("trt-planlama-v25")).paketler));
  ok(kayit.includes(metin), "kayıttaki metin harekeleriyle düz metin");
  ok(hata === 0, "sayfa hatası yok");
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
