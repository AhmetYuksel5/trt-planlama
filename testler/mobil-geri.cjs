// Mobil denetimin 2. adımı, geri tuşunun tek kuralı (telefon, yeni tasarım): Menü paneli, zil paneli,
// arama ve Posta'da açık sohbet geri tuşuyla kapanır, sayfa değişmez; paneldeki bağlantı tek adım bırakır;
// zil açıkken sayfaya ilk dokunuş yalnız kapatır; Posta yanıtı taslak olarak kalır.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["Pixel 7"] });
    const p = await c.newPage();
    p.on("pageerror", (e) => console.log("HATA", String(e)));
    p.on("dialog", (x) => x.accept());
    const gir = async (kim, yol) => {
      await p.goto(B);
      await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, [kim, dil]);
      await p.goto("about:blank");
      await p.goto(B + yol);
      await p.waitForTimeout(900);
    };
    const yer = () => p.url().split("#")[1] ?? "";
    const geri = async () => { await p.goBack(); await p.waitForTimeout(450); };

    // Menü paneli.
    await gir("pl2", "#/oneriler");
    await p.locator(".alt-cubuk button").last().tap();
    await p.waitForTimeout(300);
    ok((await p.locator(".mobil-menu").count()) === 1, `${dil}: Menü paneli açıldı`);
    ok(await p.evaluate(() => document.querySelector(".uygulama > .ana")?.hasAttribute("inert")), `${dil}: panel açıkken arka plan etkisiz`);
    await geri();
    ok((await p.locator(".mobil-menu").count()) === 0 && yer() === "/oneriler", `${dil}: geri tuşu paneli kapatıyor, sayfa yerinde (${yer()})`);
    await p.locator(".alt-cubuk button").last().tap();
    await p.waitForTimeout(300);
    await p.locator('.mobil-menu a[href="#/ayarlar"]').tap();
    await p.waitForTimeout(600);
    ok(yer() === "/ayarlar" && (await p.locator(".mobil-menu").count()) === 0, `${dil}: paneldeki bağlantı sayfayı açıyor (${yer()})`);
    await geri();
    ok(yer() === "/oneriler", `${dil}: tek geri adımı önceki sayfaya (${yer()})`);

    // Zil paneli: geri tuşu ve dışarı dokunuş.
    await p.locator("header.ust button:has(svg.lucide-bell)").tap();
    await p.waitForTimeout(300);
    ok((await p.locator("header.ust .acilir").count()) === 1, `${dil}: zil paneli açıldı`);
    await geri();
    ok((await p.locator("header.ust .acilir").count()) === 0 && yer() === "/oneriler", `${dil}: geri tuşu zil panelini kapatıyor (${yer()})`);
    await p.locator("header.ust button:has(svg.lucide-bell)").tap();
    await p.waitForTimeout(300);
    // Panelin dışında, panel ile alt çubuk arasında sayfanın bir noktasına dokun (altında öneri kartı var).
    const panel = await p.locator("header.ust .acilir").boundingBox();
    const cubuk = await p.locator(".alt-cubuk").boundingBox();
    const ny = (panel.y + panel.height + cubuk.y) / 2;
    const altta = await p.evaluate(([x, y]) => { const e = document.elementsFromPoint(x, y).find((e) => !e.classList.contains("ust-perde")); return !!e?.closest("main"); }, [200, ny]);
    ok(altta, `${dil}: dokunulan noktanın altında sayfa var`);
    await p.mouse.click(200, ny);
    await p.waitForTimeout(450);
    ok((await p.locator("header.ust .acilir").count()) === 0 && yer() === "/oneriler", `${dil}: dışarı ilk dokunuş yalnız kapatıyor (${yer()})`);

    // Arama.
    await p.locator("header.ust button:has(svg.lucide-search)").tap();
    await p.waitForTimeout(300);
    ok((await p.locator("dialog.palet[open]").count()) === 1, `${dil}: arama açıldı`);
    await geri();
    ok((await p.locator("dialog.palet[open]").count()) === 0 && yer() === "/oneriler", `${dil}: geri tuşu aramayı kapatıyor (${yer()})`);

    // Posta: açık sohbet geri tuşuyla kapanır, yanıt taslak kalır.
    await gir("pl2", "#/posta");
    await p.locator(".posta-sohbet").first().tap();
    await p.waitForTimeout(400);
    const yaz = p.locator("[data-posta-yaz]");
    await yaz.fill("نص تجريبي للرد");
    await geri();
    ok(yer().startsWith("/posta") && (await p.locator("[data-posta-yaz]").count()) === 0 && (await p.locator(".posta-sohbet").count()) > 0, `${dil}: geri tuşu sohbetten listeye (${yer()})`);
    await p.locator(".posta-sohbet").first().tap();
    await p.waitForTimeout(400);
    ok((await p.locator("[data-posta-yaz]").inputValue()) === "نص تجريبي للرد", `${dil}: yanıt taslak olarak duruyor`);
    await p.locator("button.geri-bag").first().tap();
    await p.waitForTimeout(450);
    ok(yer().startsWith("/posta") && (await p.locator(".posta-sohbet").count()) > 0, `${dil}: "← Sohbetler" listeye dönüyor`);
    await geri();
    ok(!yer().startsWith("/posta"), `${dil}: listeden geri tuşu Posta'dan çıkıyor (${yer()})`);
    await c.close();
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
