// Organizasyon (kullanıcı): birim kartındaki "Düzenle" o birimi düzenler (alt birimde "Alt birim ekle"
// açılıyordu); birim ve ünvan değişikliği Plan ekibini etkiliyorsa sonradan sorulur, geri alınabilir.
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
  const taslak = () => p.evaluate(() => { const d = JSON.parse(localStorage.getItem("trt-planlama-v24")); return Object.values(d.yapiTaslaklari ?? {})[0] ?? null; });
  await ac();

  // 1. Alt birimin "Düzenle"si kendisini açar
  for (const id of ["muhasebe", "planlama", "media"]) {
    await p.locator(`[data-birim-duzenle="${id}"]`).click(); await p.waitForTimeout(300);
    const baslik = await p.locator("dialog[open] h2, dialog[open] .pencere-baslik").first().innerText();
    const ust = await p.locator("[data-birim-ust]").inputValue();
    ok(!/Alt birim ekle/.test(baslik) && ust !== id, `${id}: "Düzenle" birimin kendisini açtı (${baslik.trim()}, üst ${ust})`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  }

  // 2. Media'yı Newsdesk'in altına taşımak yapımcı şefi kuralının kapsamını değiştirir: sorulur, geri alınır
  await p.locator('[data-birim-duzenle="media"]').click(); await p.waitForTimeout(300);
  await p.locator("[data-birim-ust]").selectOption("newsdesk");
  await p.locator("[data-birim-kaydet]").click(); await p.waitForTimeout(500);
  ok((await p.locator("[data-ekip-etkisi]").count()) === 1, "Plan ekibine etkisi soruldu");
  ok((await p.locator('[data-etki-gorev="yapimciSef"]').count()) === 1, "etkilenen görev ve girecek kişi yazılı");
  await p.locator("[data-etki-geri-al]").click(); await p.waitForTimeout(500);
  const t1 = await taslak();
  ok(!t1 || t1.birimler.find((x) => x.id === "media").ust !== "newsdesk", "\"Değişikliği geri al\" taşımayı geri aldı");

  // 3. Etkisiz değişiklik sormaz (Media'yı gizle)
  await p.locator('[data-birim-gizle="media"]').click(); await p.waitForTimeout(400);
  ok((await p.locator("[data-ekip-etkisi]").count()) === 0, "Plan ekibini etkilemeyen değişiklikte soru yok");
  await p.locator('[data-birim-gizle="media"]').click(); await p.waitForTimeout(300);

  // 4. Newsdesk'e yeni ünvan: ünvanları seçilmiş kurala eklensin mi diye sorulur, işaretlenirse eklenir
  await p.locator('[data-unvan-yeni="newsdesk"]').fill("Deneme ünvanı");
  await p.locator('[data-unvan-ekle="newsdesk"]').click(); await p.waitForTimeout(500);
  const oneri = p.locator('[data-etki-unvan^="yapimciSef~"]');
  ok((await oneri.count()) === 1, "yeni ünvanı yapımcı şefi görevine ekleme önerisi");
  await oneri.locator("input").check();
  await p.locator("[data-etki-tamam]").click(); await p.waitForTimeout(500);
  const t2 = await taslak();
  const yeniU = t2.unvanlar.find((u) => u.ad?.tr === "Deneme ünvanı");
  const kural = t2.ekipGorevleri.find((g) => g.id === "yapimciSef");
  ok(!!yeniU && kural.unvanlar.includes(yeniU.id), "seçilen ünvan görevin kuralına eklendi");

  // 390px taşma, pencere açıkken
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 }); await ac(dil);
    await p.locator('[data-birim-duzenle="media"]').click(); await p.waitForTimeout(300);
    await p.locator("[data-birim-ust]").selectOption("newsdesk");
    await p.locator("[data-birim-kaydet]").click(); await p.waitForTimeout(500);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok((await p.locator("[data-ekip-etkisi]").count()) === 1 && t <= 1, `390px taşma yok, etki penceresi açık (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
