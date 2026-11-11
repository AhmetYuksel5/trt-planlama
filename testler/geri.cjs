// Geri (kullanıcı: "geri"ye basınca bazen geldiği yere dönmüyor, başka yerden çıkıyor): sayfadaki "←"
// uygulamanın içinden gelindiyse geldiği yere döner, doğrudan açılan sayfada listeye gider; tarayıcının geri
// tuşunda sayfa bırakılan kaydırma yerine döner.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 700 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto(B + "#/");
  await p.reload();
  await p.waitForTimeout(800);
  const hash = () => p.evaluate(() => location.hash);
  const git = async (h) => { await p.evaluate((x) => (location.hash = x), h); await p.waitForTimeout(600); };

  // 1. Ekonomi sayfasından pakete, "←" Ekonomi'ye döner (önce paket listesine gidiyordu)
  await git("#/ekonomi");
  await p.locator('a[href="#/paketler/p-hidrojen"]').first().click();
  await p.waitForTimeout(600);
  ok((await hash()) === "#/paketler/p-hidrojen", "Ekonomi'den paket açıldı");
  ok((await p.locator('[data-geri-bag="geri"]').count()) === 1, "uygulamanın içinden gelince \"←\" Geri adıyla");
  await p.locator("[data-geri-bag]").first().click();
  await p.waitForTimeout(600);
  ok((await hash()) === "#/ekonomi", "\"←\" geldiği yere, Ekonomi'ye döndü: " + (await hash()));

  // 2. Uzun listede aşağıdan pakete, tarayıcının geri tuşu aynı yere döner
  await git("#/paketler");
  const yukseklik = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const hedefY = Math.min(600, yukseklik);
  await p.evaluate((y) => window.scrollTo(0, y), hedefY);
  await p.waitForTimeout(300);
  const link = p.locator('a[href^="#/paketler/"]').filter({ visible: true }).nth(3);
  await link.scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  const once = await p.evaluate(() => window.scrollY);
  await link.click();
  await p.waitForTimeout(600);
  ok((await p.evaluate(() => window.scrollY)) < 5, "yeni sayfa başından açıldı");
  await p.goBack();
  await p.waitForTimeout(900);
  const sonra = await p.evaluate(() => window.scrollY);
  ok(once > 50 && Math.abs(sonra - once) <= 3, `geri tuşu kaydırma yerine döndü (${once} → ${sonra})`);
  await p.goForward();
  await p.waitForTimeout(600);
  ok((await hash()).startsWith("#/paketler/"), "ileri tuşu pakete");

  // 3. Doğrudan açılan sayfada "←" listeye gider (siteden dışarı atmaz)
  await p.goto("about:blank");
  await p.goto(B + "#/paketler/p-hidrojen");
  await p.waitForTimeout(800);
  ok((await p.locator('[data-geri-bag="liste"]').count()) === 1, "doğrudan açılınca \"←\" listenin adıyla");
  await p.locator("[data-geri-bag]").first().click();
  await p.waitForTimeout(600);
  ok((await hash()) === "#/paketler", "doğrudan açılan sayfadan \"←\" listeye: " + (await hash()));

  // 4. Next Day planı: "←" plan listesinden gelince listeye, öneri sayfasından gelince öneriye
  await git("#/oneriler");
  const oneri = p.locator('a[href^="#/oneriler/"]').filter({ visible: true }).first();
  if (await oneri.count()) {
    await oneri.click();
    await p.waitForTimeout(600);
    const oneriYolu = await hash();
    await p.locator("[data-geri-bag]").first().click();
    await p.waitForTimeout(600);
    ok((await hash()) === "#/oneriler", "öneri ayrıntısından \"←\" öneriler sayfasına (" + oneriYolu + ")");
  }

  // 5. Seçimler geçmiş adımında: süzgeç ve arama, pakete girip geri dönünce yerinde; menüden yeni girişte varsayılan
  await git("#/paketler");
  const gorunurPaket = () => p.locator('a[href^="#/paketler/"]').filter({ visible: true });
  let sonucu = null;
  for (const x of await p.locator("[data-paket-sonucu]").evaluateAll((l) => l.map((e) => e.getAttribute("data-paket-sonucu")))) {
    await p.locator(`[data-paket-sonucu="${x}"]`).click();
    await p.waitForTimeout(200);
    if (await gorunurPaket().count()) { sonucu = x; break; }
  }
  ok(!!sonucu, "paketi olan süzgeç seçildi: " + sonucu);
  await gorunurPaket().first().click();
  await p.waitForTimeout(500);
  await p.goBack();
  await p.waitForTimeout(700);
  ok((await p.locator(`[data-paket-sonucu="${sonucu}"].acik`).count()) === 1, "geri dönünce süzgeç yerinde");
  await p.locator('input[type="search"]').first().fill("zzz");
  await git("#/ana");
  await p.goBack();
  await p.waitForTimeout(700);
  ok((await p.locator('input[type="search"]').first().inputValue()) === "zzz", "geri dönünce arama yerinde");
  await git("#/ana");
  await git("#/paketler");
  ok((await p.locator(`[data-paket-sonucu="${sonucu}"].acik`).count()) === 0 && (await p.locator('input[type="search"]').first().inputValue()) === "", "menüden yeni girişte varsayılan");

  // 6. Açık pencere: geri tuşu pencereyi kapatır, sayfada kalır; kendi kapanan pencere boş adım bırakmaz
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await p.reload();
  await p.waitForTimeout(800);
  await git("#/ana");
  await git("#/organizasyon/birimler");
  await p.locator('[data-birim-duzenle="planlama"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator("dialog[open]").count()) === 1, "pencere açıldı");
  await p.goBack();
  await p.waitForTimeout(500);
  ok((await p.locator("dialog[open]").count()) === 0 && (await hash()) === "#/organizasyon/birimler", "geri tuşu pencereyi kapattı, sayfada kaldı");
  await p.locator('[data-birim-duzenle="planlama"]').click();
  await p.waitForTimeout(300);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
  ok((await p.locator("dialog[open]").count()) === 0 && (await hash()) === "#/organizasyon/birimler", "Esc pencereyi kapattı");
  await p.goBack();
  await p.waitForTimeout(500);
  ok((await hash()) === "#/ana", "pencereden sonra geri tuşu bir önceki sayfaya (boş adım yok): " + (await hash()));

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
