// Muhabirin öneri formu: dört sayaçlı alan, sınırlar, takipte iki alan, Header strap'ten.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(e.message));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const kim = async (id, dil = "tr") => { await p.goto(B); await p.evaluate(([k, d]) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [id, dil]); };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));

  await kim("mu1");
  await git("#/oneriler/yeni");
  ok((await p.locator("[data-oneri-header]").count()) === 0, "muhabir formunda Header kutusu yok");
  for (const a of ["strap", "gelisme", "isleme", "gorsel"]) ok((await p.locator(`[data-oneri-${a}]`).count()) === 1, `alan var: ${a}`);
  const etiketler = await p.locator(".sayacli-bas bdi").allInnerTexts();
  ok(JSON.stringify(etiketler) === JSON.stringify(["عنوان التقرير المقترح", "تفاصيل التطور", "فكرة المعالجة", "المعالجة البصرية"]), "başlıklar Arapça ve sırayla (Türkçe arayüzde de): " + etiketler.join(" | "));
  ok((await p.locator("[data-oneri-gelisme]").getAttribute("dir")) === "rtl", "alanlar sağdan sola");
  const sinirlar = await p.locator(".sayacli-alan textarea").evaluateAll((l) => l.map((x) => x.maxLength));
  ok(JSON.stringify(sinirlar) === "[100,500,700,500]", "sınırlar 100/500/700/500: " + sinirlar);
  ok((await p.locator('[data-sayac="oneri-gelisme"]').innerText()) === "0/500", "boş sayaç 0/500");

  const strap = "تقرير عن حركة الشاحنات عند المعبر";
  await p.fill("[data-oneri-strap]", strap);
  await p.fill("[data-oneri-gelisme]", "أب ج");
  ok((await p.locator('[data-sayac="oneri-gelisme"]').innerText()) === "4/500", "boşluk sayılıyor (4/500)");
  // Sınırdan uzun yapıştırma kesilir
  await p.fill("[data-oneri-isleme]", "ا".repeat(800));
  ok((await p.locator("[data-oneri-isleme]").inputValue()).length === 700 && (await p.locator('[data-sayac="oneri-isleme"]').innerText()) === "700/700", "700'ü aşan metin alınmıyor");
  await p.fill("[data-oneri-isleme]", "مقابلات مع السائقين");
  await p.fill("[data-oneri-gorsel]", "لقطات من المعبر وخريطة");
  await p.locator(".form-alt button.dugme").last().click();
  await p.waitForTimeout(500);
  const o = (await durum()).oneriler.find((x) => x.paketBasligi === strap);
  ok(!!o, "öneri gönderildi");
  ok(o && o.haberBasligi === strap, "Header strap'ten");
  ok(o && o.islemeFikri === "مقابلات مع السائقين" && o.gorselIsleme === "لقطات من المعبر وخريطة", "işleme ve görsel kayıtta");
  ok((await p.locator('[data-oneri-metni="isleme"]').count()) === 1 && (await p.locator('[data-oneri-metni="gorsel"]').count()) === 1, "ayrıntıda işleme ve görsel görünüyor");

  // Takip: yalnız ilk iki alan
  await git("#/oneriler/yeni");
  await p.locator("[data-oneri-bicim], select").filter({ has: p.locator('option[value="takip"]') }).first().selectOption("takip");
  await p.waitForTimeout(200);
  ok((await p.locator("[data-oneri-strap]").count()) === 1 && (await p.locator("[data-oneri-gelisme]").count()) === 1, "takipte 1 ve 2 var");
  ok((await p.locator("[data-oneri-isleme]").count()) === 0 && (await p.locator("[data-oneri-gorsel]").count()) === 0, "takipte 3 ve 4 yok");
  const tb = "متابعة اجتماعات المجلس";
  await p.fill("[data-oneri-strap]", tb);
  await p.fill("[data-oneri-gelisme]", "تطور جديد");
  await p.locator(".form-alt button.dugme").last().click();
  await p.waitForTimeout(500);
  const tk = (await durum()).oneriler.find((x) => x.haberBasligi === tb);
  ok(!!tk && tk.durum === "takip" && !tk.paketBasligi && !tk.islemeFikri, "takip kaydı: başlık 1. alandan, paket ve işleme yok");

  // E-postadan gelen uzun metin: Planlama'nın düzenleme formunda kesilmez, sayaç kırmızı
  await kim("pl1");
  await git("#/oneriler");
  const uzun = await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    const o = d.oneriler.find((x) => x.muhabirId && x.durum === "yeni");
    o.gelisme = "ط".repeat(620);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(d));
    return o.id;
  });
  await git("#/oneriler/" + uzun);
  await p.locator("[data-oneri-duzenle]").first().click();
  await p.waitForTimeout(200);
  const kutu = p.locator("[data-oneri-duzenle-formu] [data-oneri-gelisme]");
  ok((await kutu.inputValue()).length === 620, "uzun e-posta metni kesilmedi");
  ok((await p.locator('[data-oneri-duzenle-formu] [data-sayac="oneri-gelisme"].asti').innerText()) === "620/500", "sayaç aşımı kırmızı gösteriyor");
  ok((await p.locator("[data-oneri-duzenle-formu] [data-kisa-header]").count()) === 1, "Planlama'nın formunda Header var");

  // 390px taşma (TR, AR)
  for (const d of ["tr", "ar"]) {
    await kim("mu1", d);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/oneriler/yeni");
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${d}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
