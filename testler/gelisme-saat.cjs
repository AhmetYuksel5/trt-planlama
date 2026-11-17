// Next Day'de gelişme ve paket ertesi günün planına: formda gün varsayılan olarak planın günü (önce bugündü). Gelişmeye
// saat isteğe bağlı; girilirse planda, belgede ve çıktıda metnin sonunda kalın "12G", girilmezse hiçbir şey.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const ac = () => p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await git("#/nextday/yarin"); await ac(); await p.waitForTimeout(300);
  const planId = await p.evaluate(() => location.hash.split("/")[2]);
  const yarin = await p.evaluate(() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toLocaleDateString("en-CA"); });
  const planlar = (await veri()).planlar;
  const plan = planlar.find((x) => x.id === planId) || planlar.find((x) => x.tarih === yarin);
  ok(plan && plan.tarih > new Date().toISOString().slice(0, 10), "yarının planı: " + plan?.tarih);

  const yeniGelisme = async (metin, saat) => {
    await p.getByRole("button", { name: /^Gelişme ekle$/ }).first().click();
    await p.waitForTimeout(300);
    const f = p.locator(".form-kutu", { has: p.locator("[data-gelisme-tarih]") }).first();
    await f.locator("summary").evaluateAll((s) => s.forEach((x) => x.closest("details:not([open])") && x.click()));
    ok((await f.locator("[data-gelisme-tarih]").inputValue()) === plan.tarih, "gelişmenin günü planın günü");
    ok((await f.locator("[data-gelisme-saat]").inputValue()) === "", "saat boş başlıyor");
    await f.locator("textarea").first().fill(metin);
    if (saat) { await f.locator("[data-gelisme-saat]").fill(saat); await f.locator("[data-gelisme-saat]").press("Tab"); }
    await f.getByRole("button", { name: /^Kaydet$/ }).click();
    await p.waitForTimeout(500);
    return (await veri()).gelismeler.find((g) => g.metin === metin);
  };
  const g1 = await yeniGelisme("اجتماع الحكومة الطارئ", "12:00");
  ok(g1 && g1.saat === "12:00", "saat kaydedildi: " + g1?.saat);
  ok(g1 && new Date(g1.tarih).toLocaleDateString("en-CA") === plan.tarih, "gelişmenin tarihi planın günü");
  const g2 = await yeniGelisme("زيارة الوزير بدون موعد", "");
  ok(g2 && !g2.saat, "saatsiz gelişme");
  await ac();
  ok((await p.locator(`[data-gelisme="${g1.id}"] [data-gelisme-saat-eki]`).innerText()).trim() === "12G", "plan ekranında 12G");
  ok((await p.locator(`[data-gelisme="${g2.id}"] [data-gelisme-saat-eki]`).count()) === 0, "saatsizde ek yok");
  const kalin = await p.locator(`[data-gelisme="${g1.id}"] [data-gelisme-saat-eki]`).evaluate((e) => getComputedStyle(e).fontWeight);
  ok(Number(kalin) >= 600, "12G kalın: " + kalin);

  for (const yol of [`#/nextday/${plan.id}/cikti`, `#/nextday/${plan.id}/belge`]) {
    await git(yol);
    const t = await p.evaluate(() => document.querySelector("article.cikti").innerText);
    ok(/اجتماع الحكومة الطارئ\s*12G/.test(t), `${yol}: metnin sonunda 12G`);
    ok(!/زيارة الوزير بدون موعد\s*\d+G/.test(t), `${yol}: saatsizde ek yok`);
  }

  // Paket formunda teslim günü planın günü, saat boş; saatsiz kayıtta teslim yazılmaz.
  await git(`#/nextday/${plan.id}`); await ac(); await p.waitForTimeout(300);
  await p.locator(`[data-gelisme="${g1.id}"]`).getByRole("button", { name: "Bu gelişmeye PKG ekle" }).click();
  await p.waitForTimeout(300);
  const f = p.locator(".gelisme-alti .form-kutu").first();
  await f.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  ok((await f.locator("[data-paket-teslim-gun]").inputValue()) === plan.tarih, "paketin teslim günü planın günü");
  ok((await f.locator("[data-paket-teslim-saat]").inputValue()) === "", "teslim saati boş");
  await f.locator("[data-paket-strap]").fill("تقرير الاجتماع");
  await f.getByRole("button", { name: /^Kaydet$/ }).click();
  await p.waitForTimeout(500);
  const pk = (await veri()).paketler.find((x) => x.baslik === "تقرير الاجتماع");
  ok(pk && !pk.teslim, "saatsiz pakette teslim yok");

  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
