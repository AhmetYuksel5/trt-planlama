// Weekly'de Next Day'in baskı tasarımları (kullanıcı: Next Day'in çıktı seçenekleri Weekly'de de olsun): plan ekranındaki
// ⋯ › "Çıktı önizleme" penceresi, 1–4 ve Kurum, tam sayfa seçimi hatırlıyor, Word kurumun düz kopyasından, 390 pikselde taşma yok.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  await git("#/haftalik");
  const hid = await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    return [...d.haftalik].sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0].id;
  });

  // 1. Plan ekranında önizleme penceresi ve beş seçenek
  await git("#/haftalik/" + hid);
  await p.locator('.pb-uc button[aria-haspopup]').click(); await p.waitForTimeout(200);
  await p.click('[data-arac="cikti"]'); await p.waitForTimeout(500);
  ok((await p.locator("dialog[open] [data-onizleme] .cikti.hf").count()) === 1, "önizleme penceresinde Weekly belgesi");
  ok((await p.locator("dialog[open] [data-baski]").count()) === 5, "Kurum ve 1–4 seçenekleri");
  for (const n of [1, 2, 3, 4]) {
    await p.click(`dialog[open] [data-baski="${n}"]`); await p.waitForTimeout(200);
    ok((await p.locator(`dialog[open] .cikti.hf.baski-${n}`).count()) === 1, `${n}. tasarım çizildi`);
  }
  ok((await p.locator("dialog[open] .cikti.baski-4 .baski-logo img").count()) === 1, "logo");
  await p.click('dialog[open] [data-baski="2"]'); await p.waitForTimeout(200);
  ok((await p.locator("dialog[open] .cikti.baski-2 .baski-manset").count()) === 1 && (await p.locator("dialog[open] .cikti.baski-2 .nd-sutunlar .nd-yan").count()) === 1, "2. tasarımda manşet ve iki sütun");

  // 2. Tam sayfa seçimi hatırlıyor; Word kurumun düz kopyasından
  await p.click("dialog[open] [data-onizleme-tam]"); await p.waitForTimeout(900);
  ok((await p.locator(".cikti-sarici .cikti.hf.baski-2").count()) === 1, "tam sayfa seçimi hatırladı");
  ok((await p.locator(".word-kaynagi .cikti.hf:not([class*='baski-'])").count()) === 1, "Word kaynağı kurum düzeni");
  const metin = await p.locator(".cikti-sarici .cikti").innerText();
  ok(metin.includes("الأجندة") || metin.length > 100, "belge metni basıldı");

  // 3. Her tasarımda 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 844 });
    for (const n of [1, 2, 3, 4]) {
      await p.evaluate((x) => localStorage.setItem("trt-planlama-baski", String(x)), n);
      await git(`#/haftalik/${hid}/cikti`);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(t <= 1, `390px taşma yok (${dil}, ${n}): ${t}`);
    }
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
