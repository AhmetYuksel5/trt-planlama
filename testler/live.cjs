// LIVE işareti: plan ekranındaki kutu belgeye ve çıktıya "LIVE" yazdırıyor
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:1000}});
  p.on("pageerror",e=>console.log("HATA",String(e)));
  const B="http://localhost:4173/"; await p.goto(B);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem("trt-planlama-oturum","pl1");});
  await p.goto("about:blank"); await p.goto(B+"#/nextday/yarin"); await p.waitForTimeout(1500);
  console.log(p.url(), await p.locator("details").count(), await p.locator(".muhabir-eylem").count());
  await p.locator("details:not([open]) > summary").evaluateAll(s=>s.forEach(x=>x.click())); await p.waitForTimeout(300);
  const k = p.locator('input[data-live]').first(); console.log("kutu", await p.locator('input[data-live]').count());
  await k.check(); await p.waitForTimeout(400);
  await p.goto(B+"#/nextday/yarin/belge"); await p.waitForTimeout(1000);
  console.log("belgede LIVE", await p.locator('[data-live-satir]').count());
  await p.goto(B+"#/nextday/yarin/cikti"); await p.waitForTimeout(1000);
  console.log("çıktıda LIVE", await p.locator('[data-live-satir]').count());
  await b.close();
})();
