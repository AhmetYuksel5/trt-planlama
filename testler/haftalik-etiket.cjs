// Weekly plan metninde (kullanıcı): masaya (Ekonomi, Program, Spor) önerilen kalemin üstünde o birimin adı;
// henüz kabul edilmemiş paketli kalem "PKG PROPOSAL", kabul edilen "PKG".
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1000); };
  await git("#/oneriler");
  const kur = (o) => p.evaluate((o) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const h = d.haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
    const k = h.kalemler.find((x) => x.id === "he-test") || h.kalemler[0];
    Object.assign(k, { id: "he-test", paketBasligi: "تقرير اقتصادي اختباري", bicimler: ["pkg"], muhabirler: [], karar: o.karar, tur: o.tur, oneriId: o.oneriId });
    if (o.soru) {
      const on = d.oneriler.find((x) => x.yon !== "muhabire");
      k.oneriId = on.id;
      d.masaSorulari = [...(d.masaSorulari || []).filter((s) => s.id !== "ms-test"), { id: "ms-test", oneriId: on.id, birim: "spor", soran: "pl1", zaman: new Date().toISOString(), cevap: { kabul: true, kisiId: "sp1", zaman: new Date().toISOString() } }];
    }
    localStorage.setItem("trt-planlama-v25", JSON.stringify(d)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
    return h.id;
  }, o);
  const kalem = () => p.locator(".cikti-kalem", { has: p.locator("[data-kalem-pkg]", { hasText: "تقرير اقتصادي اختباري" }) }).first();

  // 1. Ekonomi kalemi, karar bekliyor: birim adı ve PKG PROPOSAL
  const hid = await kur({ karar: "bekliyor", tur: "ekonomi" });
  for (const yol of [`#/haftalik/${hid}/cikti`, `#/haftalik/${hid}/belge`]) {
    await git(yol);
    const masa = await kalem().locator("[data-kalem-masa]").innerText().catch(() => "");
    ok(masa.trim().length > 0 && /[؀-ۿ]/.test(masa), `${yol}: kalemin üstünde masanın Arapça adı (${masa.trim()})`);
    ok((await kalem().locator("[data-kalem-pkg-etiketi]").innerText()).trim() === "PKG PROPOSAL", `${yol}: onaylanmamış paket PKG PROPOSAL`);
  }
  await git(`#/haftalik/${hid}`);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  const kart = p.locator('[data-kalem="he-test"]').first();
  ok((await kart.locator("[data-kalem-masa]").count()) === 1, "plan ekranının kaleminde masa adı");
  ok((await kart.locator("[data-kalem-pkg]").innerText()).includes("PKG PROPOSAL"), "plan ekranında PKG PROPOSAL");

  // 2. Kabul edilince PKG
  await kur({ karar: "kabul", tur: "ekonomi" });
  await git(`#/haftalik/${hid}/cikti`);
  ok((await kalem().locator("[data-kalem-pkg-etiketi]").innerText()).trim() === "PKG", "kabul edilen paket PKG");

  // 3. Haber kolunda masa adı yok; öneri bir masaya sorulup "Uygundur" dendiyse o masanın adı
  await kur({ karar: "kabul", tur: "haber" });
  await git(`#/haftalik/${hid}/cikti`);
  ok((await kalem().locator("[data-kalem-masa]").count()) === 0, "haber kalemi masa etiketi taşımıyor");
  await kur({ karar: "kabul", tur: "haber", soru: true });
  await git(`#/haftalik/${hid}/cikti`);
  ok((await kalem().locator("[data-kalem-masa]").count()) === 1, "Spor'un uygun bulduğu öneri kalemi Spor adını taşıyor");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const yol of [`#/haftalik/${hid}`, `#/haftalik/${hid}/cikti`]) {
      await git(yol);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${yol}): ${t}`);
    }
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
