// Duman testi: her birimden bir kişiyle menüdeki her sayfa açılıyor; sayfa hatası, hata sınırı ve 390 pikselde yatay taşma yok (Türkçe ve Arapça)
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
const KISILER = ["pl1", "yo3", "yo1", "nd1", "ng1", "ou1", "me1", "pr1", "ek1", "mu1"];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  let hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  for (const [en, diller] of [[1440, ["tr"]], [390, ["tr", "ar"]]]) {
    await p.setViewportSize({ width: en, height: en === 390 ? 844 : 1000 });
    for (const dil of diller)
      for (const kim of KISILER) {
        await p.goto(B);
        await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [kim, dil]);
        await p.goto("about:blank");
        await p.goto(B + "#/");
        await p.waitForTimeout(400);
        // Kişinin menüsündeki sayfalar: menü masaüstünde solda, telefonda panelde; bağlantılar DOM'da.
        const yollar = [...new Set(await p.evaluate(() => [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute("href")).filter((h) => !/^#\/(ortam|tanitim|gercek-giris|kayit)/.test(h))))].slice(0, 40);
        ok(yollar.length > 0, `${kim} ${dil} ${en}: menüde sayfa yok`);
        for (const y of ["#/", ...yollar]) {
          hatalar = [];
          await p.goto("about:blank");
          await p.goto(B + y);
          await p.waitForTimeout(350);
          const sinir = await p.locator("[data-hata-siniri]").count();
          const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          ok(!hatalar.length && !sinir, `${kim} ${dil} ${en} ${y}: hata ${hatalar.join(" | ")}${sinir ? " (hata sınırı)" : ""}`);
          if (en === 390) ok(tasma === 0, `${kim} ${dil} 390 ${y}: taşma ${tasma}`);
        }
      }
  }
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
