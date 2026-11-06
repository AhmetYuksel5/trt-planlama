// "E-posta için kopyala": panoya satır içi stilli, sağdan sola HTML ve düz metin gider (e-postaya yapıştırınca biçim bozulmasın)
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://localhost:4173" });
  const p = await c.newPage(); let hata = 0; p.on("pageerror", (e) => { hata++; console.log("HATA", String(e)); });
  const B = "http://localhost:4173/", s = {};
  await p.goto(B); await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/nextday/yarin"); await p.waitForTimeout(1200);
  const id = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")).planlar.sort((a, b) => b.tarih.localeCompare(a.tarih))[0].id);
  for (const baski of ["", "3"]) {
    await p.evaluate((x) => localStorage.setItem("trt-planlama-baski", x), baski);
    await p.goto(B + "#/nextday/" + id + "/cikti"); await p.waitForTimeout(1000);
    await p.getByRole("button", { name: "E-posta için kopyala" }).click(); await p.waitForTimeout(400);
    const r = await p.evaluate(async () => { const [it] = await navigator.clipboard.read(); const h = await (await it.getType("text/html")).text(); const m = await (await it.getType("text/plain")).text(); return { h, m }; });
    const k = baski || "kurum";
    s["html_" + k] = /dir="rtl"/.test(r.h) && /font-family:Calibri/.test(r.h) && /color:#4f7a28/.test(r.h) && /color:#c00000/.test(r.h);
    s["sinifsiz_" + k] = !/class=/.test(r.h) && !/<button/.test(r.h) && !/baski-/.test(r.h);
    s["duzMetin_" + k] = r.m.length > 200;
  }
  console.log(s, "hata", hata);
  await b.close(); process.exit(Object.values(s).every(Boolean) && !hata ? 0 : 1);
})();
