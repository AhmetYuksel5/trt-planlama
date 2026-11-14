// Kayıt bağlantısıyla gelip onay bekleyen hesap: tam yöneticinin ana sayfasında ve Hesaplar'da kart, menüde sayı; "Onayla" işareti kaldırır, kişiye bildirim
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); }); p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/", K = "trt-planlama-v25";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
  const id = await p.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K));
    const k = d.kisiler.find((x) => x.birim === "planlama" && x.rol !== "yonetici" && !x.hesapYoneticisi);
    k.kontrolBekliyor = true; localStorage.setItem(K, JSON.stringify(d)); return k.id;
  }, K);
  await p.goto("about:blank"); await p.goto(B + "#/"); await p.waitForTimeout(1200);
  const anada = await p.locator(`[data-onay-hesap="${id}"]`).count() === 1; const menude = await p.locator("nav").first().innerText().catch(()=>"");
  await p.goto(B + "#/organizasyon"); await p.waitForTimeout(1000);
  const hesaplarda = await p.locator(`[data-onay-hesap="${id}"]`).count() >= 1;
  await p.locator(`[data-onay-hesap="${id}"] [data-hesap-onayla]`).first().click(); await p.waitForTimeout(400);
  const sonuc = await p.evaluate(([K, id]) => { const d = JSON.parse(localStorage.getItem(K)); return { bayrak: !!d.kisiler.find((x) => x.id === id).kontrolBekliyor, hareket: d.hareketler.some((h) => h.tip === "kayitOnaylandi" && h.veri?.kime === id) }; }, [K, id]);
  const kalkti = await p.locator(`[data-onay-hesap="${id}"]`).count() === 0;
  console.log({ anada, hesaplarda, ...sonuc, kalkti, hata });
  await b.close(); process.exit(anada && hesaplarda && !sonuc.bayrak && sonuc.hareket && kalkti && !hata ? 0 : 1);
})();
