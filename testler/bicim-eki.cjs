// PKG dışındaki haber türü planda haberin satırının sonunda (ör. "… / ad VideoWall"); PKG yazılmıyor
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const B = "http://localhost:4173/"; await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1200);
  const once = await p.locator("[data-bicim-eki]", { hasText: "VideoWall" }).count();
  // Yarının planındaki ilk paketi VideoWall yap
  await p.evaluate(() => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pk = d.paketler.find((x) => x.planId === plan.id && x.durum !== "iptal");
    pk.bicim = "videowall"; localStorage.setItem(k, JSON.stringify(d));
  });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin/cikti"); await p.waitForTimeout(1200);
  const sonra = await p.locator("[data-bicim-eki]", { hasText: "VideoWall" }).count();
  const pkgEki = await p.locator("[data-bicim-eki]", { hasText: /^\s*PKG$/ }).count();
  console.log("önce", once, "sonra", sonra, "PKG eki", pkgEki);
  await b.close(); process.exit(sonra > once && !pkgEki ? 0 : 1);
})();
