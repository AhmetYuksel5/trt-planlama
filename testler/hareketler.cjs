// Muhabir hareketleri (kullanıcı): menüde ayrı sayfa; Next Day ve Weekly aynı pencereyi açar; hareket düzeltilir ve
// silinir. Kayıt tek: gününe düşen açık Next Day planına kendiliğinden girer, tarihi değişince çıkar, silinince planlardan da.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
const K = "trt-planlama-v25";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1000); };
  const veri = () => p.evaluate((K) => JSON.parse(localStorage.getItem(K)), K);
  // Tarih alanı görünmez yerleşik alanda; React'in dinlediği olayla yazılır.
  const tarihYaz = (sec, deger) => p.evaluate(([sec, deger]) => {
    const el = document.querySelector(sec);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, deger);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, [sec, deger]);
  const doldur = async (yer, bas, bit) => {
    const f = p.locator("dialog [data-hareket-formu]");
    await f.locator("select").first().selectOption({ index: 1 });
    await f.locator("[data-hareket-yer]").fill(yer);
    await tarihYaz("dialog [data-hareket-baslangic]", bas);
    await tarihYaz("dialog [data-hareket-bitis]", bit);
    await f.locator(".form-alt button").last().click();
    await p.waitForTimeout(400);
  };

  await git("#/hareketler");
  const d0 = await veri();
  const yarin = [...d0.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
  ok((await p.locator('a[href="#/hareketler"]').count()) > 0, "menüde Muhabir hareketleri");
  ok((await p.locator("[data-hareket-ekle]").count()) === 1, "sayfada Yeni hareket");

  // 1. Sayfadan ekle: yarına düşen hareket yarının planına kendiliğinden girer
  await p.locator("[data-hareket-ekle]").click(); await p.waitForTimeout(300);
  await doldur("الدوحة", yarin.tarih, yarin.tarih);
  let d = await veri();
  const h = d.gorevlendirmeler.find((g) => g.yer === "الدوحة");
  ok(!!h && h.durum === "onayli", "hareket kaydedildi");
  ok(d.planlar.find((x) => x.id === yarin.id).gorevlendirmeler.includes(h.id), "gününe düşen Next Day planına girdi");
  ok((await p.locator(`[data-hareket="${h.id}"]`).count()) === 1, "sayfanın listesinde");

  // 2. Düzelt: yer ve tarih; tarih plandan çıkınca plandan düşer
  await p.locator(`[data-hareket="${h.id}"] button[aria-label="Hareketi düzenle"]`).click(); await p.waitForTimeout(300);
  ok((await p.locator("dialog [data-hareket-yer]").inputValue()) === "الدوحة", "pencere kaydın değerleriyle açılıyor");
  const ileri = new Date(Date.parse(yarin.tarih) + 5 * 864e5).toISOString().slice(0, 10);
  await p.locator("dialog [data-hareket-yer]").fill("عمّان");
  await tarihYaz("dialog [data-hareket-baslangic]", ileri);
  await tarihYaz("dialog [data-hareket-bitis]", ileri);
  await p.locator("dialog [data-hareket-formu] .form-alt button").last().click(); await p.waitForTimeout(400);
  d = await veri();
  const h2 = d.gorevlendirmeler.find((g) => g.id === h.id);
  ok(h2.yer === "عمّان" && h2.baslangic === ileri, "yer ve tarih güncellendi");
  ok(!d.planlar.find((x) => x.id === yarin.id).gorevlendirmeler.includes(h.id), "günü değişince plandan çıktı");

  // 3. Next Day'den yeni: aynı pencere, plana bağlı; satırda düzenle
  await git(`#/nextday/${yarin.id}`);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  await p.locator('button:has-text("Yeni hareket")').first().click(); await p.waitForTimeout(300);
  ok((await p.locator("dialog [data-hareket-formu]").count()) === 1, "Next Day aynı pencereyi açıyor");
  await doldur("بيروت", yarin.tarih, yarin.tarih);
  d = await veri();
  const h3 = d.gorevlendirmeler.find((g) => g.yer === "بيروت");
  ok(!!h3 && d.planlar.find((x) => x.id === yarin.id).gorevlendirmeler.includes(h3.id), "Next Day'den eklenen plana bağlı");
  ok((await p.locator('button[aria-label="Hareketi düzenle"]').count()) > 0, "Next Day satırında düzenle");

  // 4. Weekly: haftaya düşen hareket görünür, aynı pencereyle eklenir
  const hf = d.haftalik.find((x) => x.baslangic <= yarin.tarih && new Date(Date.parse(x.baslangic) + 6 * 864e5).toISOString().slice(0, 10) >= yarin.tarih);
  if (hf) {
    await git(`#/haftalik/${hf.id}`);
    await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
    ok((await p.locator(`[data-hareket="${h3.id}"]`).count()) === 1, "Weekly'de haftaya düşen hareket");
    await p.locator('button:has-text("Yeni hareket")').first().click(); await p.waitForTimeout(300);
    ok((await p.locator("dialog [data-hareket-formu]").count()) === 1, "Weekly aynı pencereyi açıyor");
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  } else ok(false, "yarını kapsayan haftalık plan yok");

  // 5. Sil: kayıt ve plan bağlantısı gider
  await git("#/hareketler");
  await p.locator(`[data-hareket="${h3.id}"] button[aria-label="Sil"]`).click(); await p.waitForTimeout(400);
  d = await veri();
  ok(!d.gorevlendirmeler.some((g) => g.id === h3.id), "hareket silindi");
  ok(!d.planlar.some((x) => x.gorevlendirmeler.includes(h3.id)), "planlardaki bağlantısı da gitti");

  // 6. Muhabir sayfayı açamaz
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "mu1"));
  await git("#/hareketler");
  ok((await p.locator("[data-hareket-ekle]").count()) === 0, "muhabire sayfa kapalı");

  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/hareketler");
    await p.locator("[data-hareket-ekle]").click(); await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok, pencere açık (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
