// Mobil denetimin 4. adımı, üçüncü parti (telefon, yeni tasarım): klavye açıkken alt çubuk gizli (M-22); tarih
// seçici ekranın içinde (M-23); öneri kartında yol özeti dokunmatikte metin (M-39); takipte kaydeden düğme "Ekle"
// (M-46); takip açıkken muhabirin alt çubuğu Takiplerim'de (M-58); pencere açılır açılmaz gelen ikinci dokunuş
// içeriği açmıyor (M-59); az hareket tercihinde geçiş yok (M-64).
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
    const p = await c.newPage();
    p.on("pageerror", (e) => console.log("HATA", String(e)));
    const gir = async (kim, yol) => {
      await p.goto(B);
      await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, [kim, dil]);
      await p.goto("about:blank");
      await p.goto(B + yol);
      await p.waitForTimeout(900);
    };

    // M-22 ve M-23: muhabirin öneri formu.
    await gir("mu1", "#/oneriler/yeni");
    ok(await p.locator(".alt-cubuk").isVisible(), `${dil}: alt çubuk görünüyor`);
    await p.locator("[data-oneri-strap]").focus();
    await p.waitForTimeout(150);
    ok(!(await p.locator(".alt-cubuk").isVisible()), `${dil}: yazı alanı odaktayken alt çubuk gizli`);
    await p.locator("[data-oneri-strap]").blur();
    await p.waitForTimeout(150);
    ok(await p.locator(".alt-cubuk").isVisible(), `${dil}: odak gidince alt çubuk geri geliyor`);
    const tarih = p.locator(".tarih-dugmesi, [data-tarih-dugmesi]").first();
    if (await tarih.count()) {
      await tarih.scrollIntoViewIfNeeded();
      await p.evaluate(() => scrollBy(0, 400));
      await tarih.tap();
      await p.waitForTimeout(300);
      const k = await p.locator("[data-tarih-kutusu]:popover-open").boundingBox();
      const yuk = p.viewportSize().height;
      ok(k && k.y >= 0 && k.y + k.height <= yuk + 1, `${dil}: tarih seçici ekranın içinde (${k && Math.round(k.y)}–${k && Math.round(k.y + k.height)} / ${yuk})`);
      await p.keyboard.press("Escape");
    }
    ok((await p.evaluate(() => getComputedStyle(document.querySelector(".alt-cubuk a")).transitionDuration)).split(",").every((x) => parseFloat(x) < 0.01), `${dil}: az harekette geçiş yok`);

    // M-58: muhabirin takibi açıkken alt çubukta Takiplerim.
    const takip = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")).oneriler.find((o) => o.durum === "takip" && o.muhabirId === "mu1")?.id);
    if (takip) {
      await p.goto(B + "#/oneriler/" + takip);
      await p.waitForTimeout(700);
      ok((await p.locator('.alt-cubuk a.acik[href="#/takipler"]').count()) === 1, `${dil}: takipte alt çubuk Takiplerim'de`);
      const ac = p.locator("[data-takip-satiri-ac]");
      if (await ac.count()) await ac.tap();
      await p.waitForTimeout(200);
      const ekle = p.locator("[data-takip-satiri-ekle]");
      if (await ekle.count()) ok(!/Gelişme|تطور/.test(await ekle.innerText()), `${dil}: kaydeden düğme "Ekle"`);
    }

    // M-39 ve M-59: Planlama ana sayfası.
    await gir("pl2", "#/oneriler");
    const metin = p.locator(".oneri-karti [data-oneri-yolu-metin]").first();
    ok((await metin.count()) && (await metin.isVisible()) && (await metin.innerText()).length > 2, `${dil}: yol özeti metin olarak görünüyor`);
    ok(!(await p.locator(".oneri-karti .oy-serit").first().isVisible()), `${dil}: dokunmatikte şerit yok`);
    await gir("pl2", "#/");
    const kutu = await p.locator('[data-py-kutu="oneri"]').boundingBox();
    await p.mouse.click(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2);
    await p.waitForTimeout(60);
    await p.mouse.click(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2);
    await p.waitForTimeout(500);
    ok((await p.locator("dialog.pencere[open]").count()) === 1, `${dil}: çift dokunuş yalnız paneli açıyor (${await p.locator("dialog.pencere[open]").count()})`);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: taşma yok`);
    await c.close();
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
