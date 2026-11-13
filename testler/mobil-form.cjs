// Mobil denetimin 4. adımı, ikinci parti (telefon, yeni tasarım): Next Day'in gelişme ve PKG formunda asıl
// alan önde, isteğe bağlılar "Diğer ayrıntılar"da katlı, İptal/Kaydet yapışık ve form açılınca ekrana kayıyor
// (M-10); ekip salt okunur çip, dokununca düzenleme penceresi (M-37); plan adı çerçevesiz meta metni (M-15);
// muhabirin Önerilerim'i tek kart, grup başlıklı, boş grup yok (M-40). Masaüstünde formlar ve ekip eskisi gibi.
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
    await p.goto(B);
    await p.evaluate((d) => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, dil);
    await p.goto("about:blank");
    await p.goto(B + "#/nextday/yarin");
    await p.waitForTimeout(900);
    const kayit = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
    const kart = p.locator(".baslik-karti").first();
    await p.evaluate(() => document.querySelectorAll("main details:not([data-form-ayrintilari])").forEach((d) => (d.open = true)));
    await p.waitForTimeout(200);

    // Gelişme formu.
    await kart.locator(".ekle-satiri button").first().tap();
    await p.waitForTimeout(700);
    const form = kart.locator(".form-kutu").first();
    const alanlar = await form.evaluate((f) => [...f.querySelectorAll("textarea, input:not([type=checkbox]), select")].filter((e) => e.checkVisibility()).map((e) => e.hasAttribute("data-gelisme-metni")));
    ok(alanlar[0] === true, `${dil}: gelişme metni ilk görünen alan`);
    ok(alanlar.length <= 3, `${dil}: gelişme formunda görünen alan ${alanlar.length}`);
    ok((await form.locator("[data-form-ayrintilari]").getAttribute("open")) === null, `${dil}: ayrıntılar katlı`);
    const fb = await form.boundingBox();
    ok(fb.y >= 0 && fb.y < 300, `${dil}: form açılınca ekrana kaydı (${Math.round(fb.y)})`);
    ok((await form.locator(":scope > .form-alt").evaluate((e) => getComputedStyle(e).position)) === "sticky", `${dil}: Kaydet yapışık`);
    const once = (await kayit()).gelismeler.length;
    await form.locator("[data-gelisme-metni]").fill("وصول وفد حكومي لتفقد السد");
    await form.locator(":scope > .form-alt .dugme:not(.dugme-ikincil)").tap();
    await p.waitForTimeout(400);
    ok((await kayit()).gelismeler.length === once + 1, `${dil}: gelişme kaydedildi`);

    // PKG formu.
    await kart.locator(".alt-alan button").filter({ hasText: dil === "tr" ? "Paket önerisi ekle" : "إضافة مقترح تقرير" }).first().tap();
    await p.waitForTimeout(700);
    const pf = kart.locator(".form-kutu:has([data-paket-strap])");
    ok((await pf.count()) === 1, `${dil}: PKG formu açıldı`);
    if (await pf.count()) {
      const pa = await pf.evaluate((f) => [...f.querySelectorAll("textarea, input:not([type=checkbox]), select")].filter((e) => e.checkVisibility()).length);
      ok(pa <= 3, `${dil}: PKG formunda görünen alan ${pa}`);
      await pf.locator("[data-form-ayrintilari] > summary").tap();
      await p.waitForTimeout(200);
      ok(await pf.locator("[data-paket-sehir]").isVisible(), `${dil}: ayrıntılar açılınca şehir görünüyor`);
      await pf.locator(":scope > .form-alt .dugme-ikincil").tap();
    }

    // Ekip.
    const ekip = p.locator("[data-ekip-uye]").first();
    ok((await p.locator(".bolum:has([data-ekip-uye]) .vardiya-girdi:visible").count()) === 0, `${dil}: telefonda ekipte denetim yok`);
    ok((await ekip.boundingBox()).height >= 44, `${dil}: ekip çipi dokunmaya uygun`);
    const kim = await ekip.getAttribute("data-ekip-uye");
    await ekip.tap();
    await p.waitForTimeout(400);
    const pen = p.locator("dialog.pencere[open] [data-ekip-penceresi]");
    ok((await pen.count()) === 1, `${dil}: ekip üyesine dokununca pencere`);
    await pen.locator(".saat-girdisi").fill("0930");
    await pen.locator(".saat-girdisi").blur();
    await p.waitForTimeout(300);
    const uye = (await kayit()).planlar.flatMap((x) => x.ekip).find((e) => e.kisiId === kim);
    ok(uye?.vardiya === "09:30", `${dil}: pencerede vardiya kaydedildi (${uye?.vardiya})`);
    await p.keyboard.press("Escape");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: taşma yok`);

    // Plan adı meta metni (M-15).
    await p.goto(B + "#/oneriler");
    await p.waitForTimeout(800);
    const etk = p.locator(".rozet-plan").first();
    if (await etk.count()) ok((await etk.evaluate((e) => getComputedStyle(e).borderTopWidth)) === "0px", `${dil}: plan adı çerçevesiz`);

    // Muhabirin Önerilerim'i: tek kart, grup başlıklı, boş grup yok (M-40).
    await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "mu1"));
    await p.goto("about:blank");
    await p.goto(B + "#/oneriler");
    await p.waitForTimeout(800);
    ok((await p.locator(".muhabir-gruplari").count()) === 1, `${dil}: Önerilerim tek kart`);
    const bos = await p.evaluate(() => [...document.querySelectorAll(".muhabir-gruplari section")].filter((x) => !x.querySelector("li")).length);
    ok(bos === 0, `${dil}: boş grup çizilmiyor (${bos})`);
    if (await p.locator("[data-senin-siran]").count()) ok(await p.locator("[data-senin-siran] .grup-basligi .sayi-rozet").isVisible(), `${dil}: "Senin sıran" sayısı dolu`);
    await c.close();
  }
  // Masaüstü: form katlanmıyor, ekipte denetimler yerinde.
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-tasarim", "yeni"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank");
  await p.goto(B + "#/nextday/yarin");
  await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
  ok((await p.locator("[data-ekip-uye]").count()) === 0 && (await p.locator(".cip .vardiya-girdi").count()) > 0, "masaüstünde ekip denetimleri çipte");
  const kart = p.locator(".baslik-karti").first();
  await kart.locator(".ekle-satiri button").first().click();
  await p.waitForTimeout(400);
  ok((await kart.locator("[data-form-ayrintilari]").count()) === 0, "masaüstünde form katlanmıyor");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
