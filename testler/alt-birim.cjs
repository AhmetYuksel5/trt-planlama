// Organizasyon: birim kartındaki "Alt birim ekle" (kullanıcı: alt birim eklemenin yolu bulunmuyordu)
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const hatalar = []; p.on("pageerror", (e) => hatalar.push(String(e)));
  const ac = async (dil = "tr") => {
    await p.goto(B); await p.evaluate((d) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", d); }, dil);
    await p.goto("about:blank"); await p.goto(B + "#/organizasyon/birimler"); await p.waitForTimeout(900);
  };
  await ac();
  ok((await p.locator('[data-alt-birim-ekle="planlama"]').count()) === 1, "Planlama kartında Alt birim ekle düğmesi");
  await p.locator('[data-alt-birim-ekle="planlama"]').click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-birim-ust]").inputValue()) === "planlama", "üst birim Planlama seçili açıldı");
  ok((await p.locator("[data-birim-ornek]").inputValue()) === "planlama", "çalışma Planlama gibi");
  await p.locator("[data-birim-formu] input").first().fill("Feature ekibi");
  await p.locator("[data-birim-kaydet]").click(); await p.waitForTimeout(400);
  const yeni = p.locator("section.org-birim", { hasText: "Feature ekibi" });
  ok((await yeni.count()) === 1, "alt birim eklendi");
  const d1 = Number(await p.locator('[data-birim-satiri="planlama"]').getAttribute("data-derinlik"));
  const d2 = Number(await yeni.getAttribute("data-derinlik"));
  ok(d2 === d1 + 1, `Planlama'nın altında girintili (${d1} → ${d2})`);
  const yeniId = await yeni.getAttribute("data-birim-satiri");
  ok((await p.locator(`[data-alt-birim-ekle="${yeniId}"]`).count()) === 1, "alt birimin de altına eklenebiliyor");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 }); await ac(dil);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
