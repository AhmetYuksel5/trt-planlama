// Mobil denetimin 4. adımı, dördüncü parti: 320 piksellik ekranda (iPhone SE 1. kuşak, yazısı büyütülmüş telefon)
// sayfa yana taşmıyor. Taşanlar: Öneriler'in arama + Süzgeç satırı (M-42), proje planının adım listesi, paket
// sayfasının geçmiş rozeti ve formu, Programlar'ın hafta gezgini. Ayrıca Programlar'da Arapça gün adı kesilmiyor
// (M-66), yayın planının kağıdı iç içe kaymıyor (M-65). isMobile kullanılmaz: Chrome sayfayı sığdırıp taşmayı gizliyor.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
const SAYFALAR = [["pl2", "#/oneriler"], ["pl2", "#/plan"], ["nd1", "#/paketler/p-altin"], ["nd1", "#/paketler/p-kudus"], ["pr1", "#/programlar/programlar"], ["pr1", "#/programlar/planlar"]];
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const p = await b.newPage({ viewport: { width: 320, height: 640 }, hasTouch: true });
    p.on("pageerror", (e) => console.log("HATA", String(e)));
    for (const [kim, yol] of SAYFALAR) {
      await p.goto(B);
      await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, [kim, dil]);
      await p.goto("about:blank");
      await p.goto(B + yol);
      await p.waitForTimeout(700);
      await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
      await p.waitForTimeout(150);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(t <= 0, `${dil} ${kim} ${yol}: 320 pikselde taşma ${t}`);
      if (yol === "#/programlar/programlar") {
        const kesik = await p.evaluate(() => [...document.querySelectorAll(".prg-gunler span")].filter((s) => s.scrollWidth > s.clientWidth).length);
        ok(kesik === 0, `${dil}: gün adı kesik (${kesik})`);
        ok(await p.evaluate(() => [...document.querySelectorAll(".prg-gunler span")].every((s) => s.title.length > 1)), `${dil}: günün tam adı ipucunda`);
      }
      if (yol === "#/programlar/planlar") {
        const ic = await p.evaluate(() => [...document.querySelectorAll(".prg-cikti")].filter((e) => e.scrollHeight > e.clientHeight + 1).length);
        ok(ic === 0, `${dil}: yayın planı iç içe kayıyor (${ic})`);
      }
    }
    await p.close();
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
