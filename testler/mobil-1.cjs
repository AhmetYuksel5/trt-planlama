// Mobil denetimin 1. adımı (yeni tasarım, telefon): "Sıradaki" yumuşak düğmesi okunur; zemin tek ton;
// öneri penceresinin ⋯ menüsü ekranın içinde; panelin "Sayfayı aç"ı gider; pencerenin boşluğuna dokunmak
// kapatmaz; bildirim alt çubuğun üstünde; Menü panelinde Ayarlar; alt çubukta yarının planı ve Posta;
// gönderilen öneriden geri tuşu boş forma dönmez; girdi kenarı görünür; Posta'nın geri düğmesi 44 px.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
const parlaklik = (rgb) => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const oran = (a, b) => { const [x, y] = [parlaklik(a), parlaklik(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
(async () => {
  const b = await chromium.launch();
  for (const cihaz of ["iPhone 13", "Pixel 7"]) {
    const c = await b.newContext({ ...devices[cihaz] });
    const p = await c.newPage();
    p.on("pageerror", (e) => console.log("HATA", String(e)));
    p.on("dialog", (x) => x.accept());
    const gir = async (kim, yol, dil = "tr") => {
      await p.goto(B);
      await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, [kim, dil]);
      await p.goto("about:blank");
      await p.goto(B + yol);
      await p.waitForTimeout(900);
    };
    for (const dil of ["tr", "ar"]) {
      const k = `${cihaz} ${dil}`;
      // M-01: yumuşak düğme okunur.
      await gir("pl2", "#/nextday/yarin", dil);
      const yum = await p.locator(".dugme-yumusak").first().evaluate((e) => { const s = getComputedStyle(e); return [s.color, s.backgroundColor]; });
      ok(oran(yum[0], yum[1]) >= 4.5, `${k}: yumuşak düğme kontrastı ${oran(yum[0], yum[1]).toFixed(2)}`);
      // M-18: telefonda zemin tek ton.
      ok(!(await p.evaluate(() => getComputedStyle(document.querySelector(".uygulama")).backgroundImage)).includes("gradient"), `${k}: zeminde gradyan yok`);
      // M-30 ve Posta sekmesi.
      ok((await p.locator('.alt-cubuk a[href="#/nextday/yarin"]').count()) === 1, `${k}: Next Day sekmesi yarının planına`);
      ok((await p.locator('.alt-cubuk a[href="#/posta"]').count()) === 1, `${k}: alt çubukta Posta`);
      ok((await p.locator('.alt-cubuk a[href="#/nextday/yarin"].acik').count()) === 1, `${k}: planda Next Day sekmesi seçili`);
      // M-13: Menü panelinde Ayarlar.
      await p.locator(".alt-cubuk button").last().tap();
      await p.waitForTimeout(300);
      ok((await p.locator('.mobil-menu a[href="#/ayarlar"]').count()) === 1, `${k}: Menü panelinde Ayarlar`);
      await p.locator(".mobil-menu-ust .ikon-dugme").tap();
      // M-02: öneri penceresinin ⋯ menüsü ekranın içinde.
      await gir("pl2", "#/oneriler", dil);
      await p.locator("[data-oneri]").first().tap();
      await p.waitForTimeout(500);
      await p.locator("dialog.pencere[open] [aria-haspopup=menu]").last().tap();
      await p.waitForTimeout(300);
      const menu = await p.locator(".islem-menusu").first().boundingBox();
      const yuk = p.viewportSize().height;
      ok(menu && menu.y >= 0 && menu.y + menu.height <= yuk + 1, `${k}: ⋯ menüsü ekranın içinde (${menu && Math.round(menu.y)}–${menu && Math.round(menu.y + menu.height)} / ${yuk})`);
      const maddeler = await p.locator(".islem-menusu [role=menuitem], .islem-menusu button, .islem-menusu a").count();
      ok(maddeler > 0, `${k}: ⋯ menüsünde maddeler görünüyor`);
      await p.keyboard.press("Escape");
      // M-20: pencerenin kendi boşluğuna dokunmak kapatmaz; alt satır dipte.
      await gir("pl2", "#/", dil);
      await p.locator('[data-py-kutu="gorev"]').tap();
      await p.waitForTimeout(400);
      const pen = await p.locator("dialog.pencere[open]").boundingBox();
      const alt = await p.locator("dialog.pencere[open] > footer").boundingBox();
      ok(alt && pen && Math.abs(alt.y + alt.height - (pen.y + pen.height)) <= 2, `${k}: pencerenin alt satırı dipte`);
      const govde = await p.locator("dialog.pencere[open] .pencere-govde").boundingBox();
      await p.mouse.click(govde.x + govde.width / 2, govde.y + govde.height - 8);
      await p.waitForTimeout(300);
      ok((await p.locator("dialog.pencere[open]").count()) === 1, `${k}: pencerenin boşluğuna dokunmak kapatmıyor`);
      // M-03: "Sayfayı aç" sayfayı açar, geri tuşu ana sayfaya döner.
      await p.locator("[data-py-sayfa]").tap();
      await p.waitForTimeout(600);
      ok(p.url().endsWith("#/gorevler") && (await p.locator("dialog.pencere[open]").count()) === 0, `${k}: "Sayfayı aç" sayfayı açıyor (${p.url().split("#")[1]})`);
      await p.goBack();
      await p.waitForTimeout(500);
      ok(/#\/$/.test(p.url()), `${k}: geri tuşu ana sayfaya dönüyor (${p.url().split("#")[1]})`);
      // M-21: bildirim alt çubuğun üstünde.
      await p.evaluate(() => document.querySelector("[data-py-kutu]")?.click());
      await gir("pl2", "#/nextday/yarin", dil);
      await p.locator(".dugme-yumusak").first().tap();
      await p.waitForTimeout(400);
      const bil = await p.locator(".bildiri").boundingBox().catch(() => null);
      const cubuk = await p.locator(".alt-cubuk").boundingBox();
      ok(!bil || bil.y + bil.height <= cubuk.y, `${k}: bildirim alt çubuğun üstünde`);
      // M-08: girdi kenarı en az 3:1.
      await gir("mu1", "#/oneriler/yeni", dil);
      const kenar = await p.locator("textarea").first().evaluate((e) => [getComputedStyle(e).borderTopColor, getComputedStyle(e).backgroundColor]);
      ok(oran(kenar[0], kenar[1]) >= 3, `${k}: girdi kenarı ${oran(kenar[0], kenar[1]).toFixed(2)}`);
      // M-36: Posta'da sohbetten dönüş düğmesi 44 px.
      await gir("pl2", "#/posta", dil);
      await p.locator(".posta-sohbet").first().tap();
      await p.waitForTimeout(400);
      const geri = await p.locator("button.geri-bag").first().boundingBox();
      ok(geri && geri.height >= 44, `${k}: Posta'nın geri düğmesi ${geri && geri.height} px`);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${k}: taşma yok`);
    }
    // M-29: gönderilen öneriden geri tuşu boş forma dönmez (muhabir).
    await gir("mu1", "#/oneriler");
    await p.goto(B + "#/oneriler/yeni");
    await p.waitForTimeout(700);
    const alanlar = p.locator(".elle-oneri textarea, form textarea, textarea");
    await alanlar.nth(0).fill("جسر الإغاثة البحري يصل إلى ميناء غزة");
    await alanlar.nth(1).fill("وصلت أول سفينة مساعدات إلى الميناء صباح اليوم.");
    await p.locator("[data-oneri-gonder], button.dugme:not([aria-disabled])").filter({ hasText: /Gönder|Kaydet/ }).last().tap();
    await p.waitForTimeout(700);
    const sonra = p.url();
    ok(/#\/oneriler\/[^y]/.test(sonra), `${cihaz}: gönderince önerinin sayfası (${sonra.split("#")[1]})`);
    await p.goBack();
    await p.waitForTimeout(500);
    ok(!p.url().includes("oneriler/yeni"), `${cihaz}: geri tuşu boş forma dönmüyor (${p.url().split("#")[1]})`);
    await c.close();
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
