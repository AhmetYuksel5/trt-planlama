// Başlığa bağlı canlı yayın çıktıda üstteki bölümde ve başlığın altında da görünüyor
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const B = "http://localhost:4173/"; await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1200);
  const n = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v23") || "{}"); return (d.canliYayinlar || []).filter((c) => c.planBaslikId).length; });
  const g = await p.locator("[data-baslik-canli]").count();
  console.log("başlığa bağlı canlı (kayıt)", n, "başlık altında", g);
  await b.close(); process.exit(g > 0 ? 0 : 1);
})();
