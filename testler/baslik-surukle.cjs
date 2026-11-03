// Next Day'de başlığı sürükleyip başka başlığın üstüne bırakmak sıralar, katmaz
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => { console.log("SORU", x.message()); x.dismiss(); });
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const oku = () => p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v23")); const pl = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0]; return pl.basliklar.map((x) => x.id); });
  const once = await oku();
  // HTML5 sürükle-bırak: ilk başlığı üçüncüsünün üstüne bırak
  await p.evaluate(([a, c]) => {
    const dt = new DataTransfer();
    const kaynak = document.querySelector(`[data-plan-baslik="${a}"] > summary`);
    const hedef = document.querySelector(`[data-plan-baslik="${c}"]`);
    kaynak.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    hedef.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
    hedef.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, [once[0], once[2]]);
  await p.waitForTimeout(500);
  const sonra = await oku();
  const ok = sonra.length === once.length && sonra[2] === once[0] && sonra[0] === once[1];
  console.log(once.slice(0, 3), "→", sonra.slice(0, 3), ok ? "tamam" : "YANLIŞ");
  await b.close(); process.exit(ok ? 0 : 1);
})();
