// Öneri akışı (kullanıcının çizimi: ham öneri, görevlendirilmiş, takip, arşiv öneri ve paket): masaüstü panoda zaman
// çizgisinin altında şerit, sütunlar yerinde; telefonda Planlama ana sayfası tek ekran (kaydırmasız) ve sayılar iki
// ekranda aynı kuraldan (anaPano.ts → oneriAkisi). Telefonda "Sıradaki" yok, masaüstünde var.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const gir = async (p, kim, dil, yol = "#/") => {
    await p.goto(B);
    await p.evaluate(([k, d]) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-oturum", k); }, [kim, dil]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1200);
  };

  // Masaüstü: şerit, beş kutu, yerleşim aynı.
  const m = await b.newPage({ viewport: { width: 1440, height: 900 } });
  m.on("pageerror", (e) => hatalar.push(String(e)));
  await gir(m, "pl1", "tr");
  ok((await m.locator(".ap-serit [data-ap-serit]").count()) === 5, "masaüstünde şeritte beş kutu");
  const sira = await m.evaluate(() => [...document.querySelector("[data-ana-pano]").children].map((e) => e.className));
  ok(sira[0] === "ap-cizgi" && sira[1] === "ap-serit" && sira[2] === "ap-izgara", "sıra: zaman çizgisi, şerit, üç sütun: " + sira.join(","));
  ok((await m.locator("[data-ap-sutun]").count()) === 3, "üç sütun yerinde");
  ok((await m.locator(".ap-cizgi .ap-sira").count()) === 1, "masaüstünde Sıradaki duruyor");
  const masa = await m.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-ap-serit]")].map((e) => [e.dataset.apSerit, Number(e.querySelector("b").textContent)])));
  ok((await m.locator('[data-ap-serit="apHam"]').getAttribute("href")) === "#/oneriler", "ham öneri Öneriler'e götürüyor");

  // Telefon: tek ekran, sayılar masaüstüyle aynı.
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"] });
    const p = await c.newPage();
    p.on("pageerror", (e) => hatalar.push(String(e)));
    await gir(p, "pl1", dil);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: yatay taşma yok`);
    // Prototip şeridi gerçek kipte yok: sayfa ona rağmen görünür alana (birkaç piksel payla) sığıyor.
    const fazla = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    ok(fazla <= 8, `${dil}: telefonda kaydırmasız (${fazla} px fazla)`);
    ok((await p.locator(".ap-sira, [data-ana-pano]").count()) === 0, `${dil}: telefonda Sıradaki ve pano yok`);
    ok((await p.locator("[data-py-akis]").count()) === 4, `${dil}: akışın dört kutusu`);
    const tel = await p.evaluate(() => ({
      apHam: Number(document.querySelector('[data-py-kutu="oneri"] .py-sayi').textContent),
      apGorevli: Number(document.querySelector('[data-py-akis="gorevli"] b').textContent),
      apTakip: Number(document.querySelector('[data-py-akis="takip"] b').textContent),
      apArsivOneri: Number(document.querySelector('[data-py-akis="arsivOneri"] b').textContent),
      apArsivPaket: Number(document.querySelector('[data-py-akis="arsivPaket"] b').textContent),
    }));
    ok(JSON.stringify(tel) === JSON.stringify(masa), `${dil}: sayılar masaüstüyle aynı ${JSON.stringify(tel)} / ${JSON.stringify(masa)}`);
    ok((await p.locator('[data-py-akis="takip"]').getAttribute("href")) === "#/takipler", `${dil}: takip Takiplerim'e götürüyor`);
    const kutular = await p.evaluate(() => [...document.querySelectorAll("[data-py-kutu]")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height < 44).length);
    ok(kutular === 0, `${dil}: kutular 44 pikselden alçak değil`);
    await p.locator('[data-py-kutu="oneri"]').tap();
    await p.waitForTimeout(400);
    ok((await p.locator('[data-py-panel="oneri"]').count()) === 1, `${dil}: ham öneri paneli açıyor`);
    await c.close();
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
