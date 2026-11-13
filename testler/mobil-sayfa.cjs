// Mobil denetimin 4. adımı, Konsept A sayfa yerleşimleri (telefon, yeni tasarım): Öneriler'de tek satır araç,
// süzgeç penceresi ve etkin süzgeç çipi, yapışkan sekme; birincil "Plana ekle" lacivert; Planlama ana sayfasında
// boş kutu tek satır; masa bölümünde kutucuk yok; muhabir formunda içerik önde, eksik alan yazılı ve Gönder
// ilk eksiğe götürür; Dış muhabirler iki satırlık satır; Next Day başlığında sıfır sayaç yok, sırala ⋯'de;
// Weekly listesinde anlatım kartı yok.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"] });
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

    // Öneriler.
    await gir("pl2", "#/oneriler");
    const ilk = await p.evaluate(() => Math.round(document.querySelector("[data-oneri]").getBoundingClientRect().top));
    ok(ilk < 450, `${dil}: ilk öneri ${ilk} pikselde (önce 565)`);
    ok((await p.locator("main select").count()) === 0, `${dil}: süzgeç seçimleri sayfada değil`);
    ok((await p.evaluate(() => getComputedStyle(document.querySelector("[data-oneri-sekmeleri]")).position)) === "sticky", `${dil}: sekmeler yapışkan`);
    ok(!(await p.locator(".sayfa-basi .ikon-kutu").isVisible()), `${dil}: başlıkta ikon karosu yok`);
    await p.locator("[data-suzgec-ac]").tap();
    await p.waitForTimeout(300);
    await p.locator("[data-suzgec-penceresi] select").first().selectOption({ index: 1 });
    await p.locator("[data-suzgec-goster]").tap();
    await p.waitForTimeout(300);
    ok((await p.locator('[data-etkin-suzgec="tur"]').count()) === 1 && (await p.locator("[data-suzgec-ac] .sayi-rozet").innerText()) === "1", `${dil}: etkin süzgeç çip ve sayı`);
    await p.locator('[data-etkin-suzgec="tur"]').tap();
    await p.waitForTimeout(300);
    ok((await p.locator("[data-etkin-suzgec]").count()) === 0, `${dil}: çipe basınca süzgeç kalkıyor`);
    await p.locator("[data-oneri]").first().tap();
    await p.waitForTimeout(400);
    const ekle = p.locator("dialog.pencere[open] [data-oneri-plana-ekle]");
    if (await ekle.count()) ok(!(await ekle.getAttribute("class")).includes("dugme-iyi"), `${dil}: "Plana ekle" birincil, yeşil değil`);
    await p.keyboard.press("Escape");

    // Planlama ana sayfası: boş kutu tek satır, vurgu çerçevesiz.
    await gir("pl2", "#/");
    const bos = await p.locator(".py-kutu.sonuk").first().boundingBox();
    ok(bos && bos.height <= 60, `${dil}: boş kutu tek satır (${bos && Math.round(bos.height)})`);
    ok((await p.locator(".py-kutu.sonuk small").count()) === 0, `${dil}: boş kutuda "Bekleyen yok" yazısı yok`);
    ok((await p.evaluate(() => getComputedStyle(document.querySelector(".py-kutu.vurgu")).boxShadow)) === "none", `${dil}: vurgu çerçeve değil`);

    // Masa: bölüm adresinde kutucuk yok, ana sayfada var.
    await gir("pr1", "#/programlar/oneriler");
    ok(!(await p.locator(".prg-kutular").isVisible()), `${dil}: masa bölümünde kutucuklar yok`);
    await gir("pr1", "#/");
    ok(await p.locator(".prg-kutular").isVisible(), `${dil}: masa ana sayfasında kutucuklar var`);

    // Muhabir formu.
    await gir("mu1", "#/oneriler/yeni");
    const strapY = (await p.locator("[data-oneri-strap]").boundingBox()).y;
    const tarihY = (await p.locator("[data-oneri-tarih]").first().boundingBox().catch(() => null))?.y ?? (await p.locator(".oneri-meta-satir").boundingBox()).y;
    ok(strapY < tarihY, `${dil}: içerik alanları günden önce`);
    ok(await p.locator("[data-oneri-eksik]").isVisible(), `${dil}: eksik alanlar yazılı`);
    await p.locator("[data-oneri-gonder]").tap({ force: true }); // aria-disabled: gerçek dokunuş geçer
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.activeElement?.hasAttribute("data-oneri-strap")), `${dil}: Gönder ilk eksik alana götürüyor`);
    ok((await p.evaluate(() => getComputedStyle(document.querySelector(".oneri-gonder-alt")).position)) === "sticky", `${dil}: Gönder yapışık`);

    // Dış muhabirler.
    await gir("pl2", "#/muhabirler");
    const satir = await p.locator(".muhabir-tablosu tbody tr").first().boundingBox();
    ok(satir.height <= 100, `${dil}: muhabir satırı ${Math.round(satir.height)} piksel (önce 263)`);
    const wa = await p.locator(".muhabir-tablosu [data-whatsapp]").first().evaluate((e) => getComputedStyle(e).backgroundColor);
    ok(wa !== "rgb(37, 211, 102)", `${dil}: WhatsApp ikincil (${wa})`);

    // Next Day: sıfır sayaç yok, sırala ⋯ menüsünde.
    await gir("pl2", "#/nextday/yarin");
    await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
    const sayilar = await p.evaluate(() => [...document.querySelectorAll(".baslik-karti .sayimlar > span[title]")].map((s) => Number(s.textContent.trim())));
    ok(sayilar.length > 0 && sayilar.every((n) => n > 0), `${dil}: başlıkta sıfır sayaç yok`);
    ok(!(await p.locator(".baslik-karti .baslik-sira-dugmeleri").first().isVisible()), `${dil}: telefonda sırala simgeleri satırda değil`);
    await p.locator(".baslik-karti summary [aria-haspopup=menu]").first().tap();
    await p.waitForTimeout(300);
    ok(await p.locator("[data-baslik-asagi]").first().isVisible(), `${dil}: sırala ⋯ menüsünde`);
    await p.keyboard.press("Escape");

    // Weekly listesi: anlatım kartı yok.
    await gir("pl2", "#/haftalik");
    ok((await p.locator(".kollar").count()) === 0, `${dil}: Weekly listesinde anlatım kartı yok`);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: taşma yok`);
    await c.close();
  }
  // Masaüstünde Öneriler'in süzgeçleri yerinde, başlıkta sırala simgeleri.
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-tasarim", "yeni"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(800);
  ok((await p.locator("main .suzgec select").count()) === 2 && (await p.locator("[data-suzgec-ac]").count()) === 0, "masaüstünde süzgeçler sayfada");
  await p.goto(B + "#/nextday/yarin");
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
  ok(await p.locator(".baslik-karti .baslik-sira-dugmeleri button").first().isVisible(), "masaüstünde sırala simgeleri satırda");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
