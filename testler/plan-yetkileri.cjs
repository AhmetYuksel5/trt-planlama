// Plan yetkileri sekmesi güncel: plan devri kalktığı için "devralma" adımı yok; Newsdesk ana sayfasında devral düğmesi yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const kim = async (id) => { await p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), id); };
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await p.goto(B);
  await kim("yo3");
  await git("#/organizasyon/planlar");
  const adimlar = await p.locator("[data-plan-yetkisi]").evaluateAll((l) => l.map((x) => x.dataset.planYetkisi));
  ok(["ndToplanti", "ndOnay", "ndOnayGeri", "hfToplanti", "hfKarar", "hfKesinlestir", "ayOnay", "ozOnay"].every((a) => adimlar.includes(a)), `kullanılan adımların hepsi listede (${adimlar})`);
  ok(!adimlar.includes("ndDevral"), "plan devri adımı listede yok");
  // Yarının planını onaylı yap; Newsdesk yöneticisinin ana sayfasında devral düğmesi çıkmamalı.
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    v.planlar = v.planlar.map((x) => (x.id === "nd-yarin" ? { ...x, durum: "onayli" } : x));
    localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  });
  await kim("nd1");
  await git("#/");
  ok((await p.locator("button", { hasText: "Planı Newsdesk olarak devral" }).count()) === 0, "Newsdesk ana sayfasında devral düğmesi yok");
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
