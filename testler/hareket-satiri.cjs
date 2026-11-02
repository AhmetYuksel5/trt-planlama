// Muhabir hareketi çıktıda "YER / ad / süre": tek günse o gün, değilse aralık; tür sözcüğü ve "·" yok
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1200);
  const t = await p.evaluate(() => { const h = [...document.querySelectorAll(".cikti h2")].find((x) => /تحركات/.test(x.textContent)); return h ? h.parentElement.textContent : ""; });
  console.log(t);
  const ok = /\/ \d\d - \d\d \S+ \//.test(t) && /\/ \d\d \S+ \//.test(t) && !/مهمة ·|·/.test(t);
  await b.close(); process.exit(ok ? 0 : 1);
})();
