// Paper tasarım dili (kullanıcı: öbür uygulamasının "kâğıt" görünümü, renk değil tasarım dili): Ayarlar'da
// seçilir, <html>'de yeni-tasarim + paper; zemin kâğıt, yazı serif; seçim hatırlanır; telefonda taşma yok.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/ayarlar");
  await p.evaluate(() => (document.querySelector("[data-tasarim-secimi]").closest("details").open = true));
  ok((await p.locator("[data-tasarim-dili]").count()) === 4, "dört tasarım dili");
  await p.click('[data-tasarim-dili="paper"]');
  await p.waitForTimeout(300);
  const sinif = () => p.evaluate(() => [document.documentElement.classList.contains("yeni-tasarim"), document.documentElement.classList.contains("paper")]);
  ok(JSON.stringify(await sinif()) === "[true,true]", "Paper seçilince yeni-tasarim ve paper sınıfı");
  ok((await p.locator('[data-tasarim-dili="paper"][aria-pressed="true"]').count()) === 1, "seçili gösteriliyor");
  await git("#/");
  ok(JSON.stringify(await sinif()) === "[true,true]", "seçim hatırlandı");
  const stil = await p.evaluate(() => ({ zemin: getComputedStyle(document.body).backgroundColor, yazi: getComputedStyle(document.body).fontFamily }));
  ok(stil.zemin === "rgb(243, 239, 231)", "kâğıt zemin");
  ok(stil.yazi.includes("Source Serif"), "serif yazı");
  // Telefonda taşma yok (Türkçe ve Arapça).
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    for (const y of ["#/", "#/oneriler", "#/nextday/yarin", "#/ayarlar"]) {
      await git(y);
      const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(tasma <= 0, `${dil} ${y} taşma yok`);
    }
  }
  // Logo yeşili: kendi sınıfı, Paper'ın sınıfı kalkar; birincil düğme yeşil-petrol geçişli, "iyi" düğme ezilmiyor.
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await git("#/ayarlar");
  await p.evaluate(() => (document.querySelector("[data-tasarim-secimi]").closest("details").open = true));
  await p.click('[data-tasarim-dili="yesil"]');
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.classList.contains("yesil") && !document.documentElement.classList.contains("paper")), "Logo yeşili sınıfı, Paper kalktı");
  const dg = await p.evaluate(() => {
    const d = document.createElement("button"); d.className = "dugme"; const i = document.createElement("button"); i.className = "dugme dugme-iyi";
    document.body.append(d, i);
    const r = [getComputedStyle(d).backgroundImage, getComputedStyle(i).backgroundImage]; d.remove(); i.remove(); return r;
  });
  ok(dg[0].includes("gradient") && !dg[1].includes("gradient"), "geçiş yalnız birincil düğmede");
  await p.setViewportSize({ width: 390, height: 844 });
  for (const y of ["#/", "#/oneriler", "#/paketler"]) {
    await git(y);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, `yeşil ${y} taşma yok`);
  }
  // Eskiye geçiş paper sınıfını da kaldırır.
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "tr"));
  await git("#/ayarlar");
  await p.evaluate(() => (document.querySelector("[data-tasarim-secimi]").closest("details").open = true));
  await p.click('[data-tasarim-dili="eski"]');
  await p.waitForTimeout(300);
  ok(JSON.stringify(await sinif()) === "[false,false]", "eskiye geçince iki sınıf da kalkıyor");
  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
