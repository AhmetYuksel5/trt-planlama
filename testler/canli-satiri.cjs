// "مباشر" satırı çıktıda YER / etkinlik / saat ("16G") sırasıyla (kullanıcı); hareket satırı مكان / اسم / نوع / تاريخ
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const B = "http://localhost:4173/";
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1500);
  const satirlar = await p.evaluate(() => { const h = [...document.querySelectorAll(".cikti h2")].find((x) => /مباشر/.test(x.textContent)); return h ? [...h.parentElement.querySelectorAll("p")].map((x) => x.innerText) : []; });
  // Üç parça, sonuncusu saat (…G) ya da TBC
  const okC = satirlar.length > 0 && satirlar.every((s) => /^[^/]+ \/ [^/]+ \/ (\d{1,4}G|TBC)$/.test(s.trim()));
  const hareket = await p.evaluate(() => [...document.querySelectorAll('.cikti [data-bolum="hareket"] p')].map((x) => x.innerText));
  const okH = hareket.length > 0 && hareket.every((s) => s.split(" / ").length === 4 && /(مهمة|إجازة|أخرى)/.test(s));
  console.log(hareket);
  const ok = okC && okH;
  console.log(satirlar, ok ? "tamam" : "YANLIŞ");
  await b.close(); process.exit(ok ? 0 : 1);
})();
