// Planlama'nın yeni mimarisi (yeni tasarım anahtarının arkasında; belgeler/planlama-yeni-mimari.md):
// kendi menüsü (gruplar katlanmaz, sayılar tek kaynaktan), kutulu ana sayfa, sağ panel, kişi çipi;
// anahtar kapalıyken eski düzen; 390px taşma yok (Türkçe, Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol, yeni = true) => {
    await p.evaluate(([k, y]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-tasarim", y ? "yeni" : "eski"); }, [kim, yeni]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });

  // Anahtar kapalı: eski düzen.
  await gir("pl2", "#/", false);
  ok((await p.locator("[data-yeni-planlama]").count()) === 0 && (await p.locator("[data-birim-menusu]").count()) === 0, "anahtar kapalıyken eski ana sayfa ve menü");

  // Planlamacı: kendi menüsü.
  await gir("pl2", "#/");
  ok((await p.locator('[data-birim-menusu="planlama"]').count()) === 1, "yeni tasarımda Planlama'nın menüsü");
  ok((await p.locator(".menu .menu-grup-bas").count()) === 0, "gruplar katlanmıyor");
  ok((await p.locator('.menu a[href="#/feature"], .menu a[href="#/ekonomi"], .menu a[href="#/programlar"], .menu a[href="#/basliklar"]').count()) === 0, "başka masaların sayfaları menüde yok");
  ok((await p.locator('.menu a[href="#/raporlar"]').count()) === 0, "personelde Yönetim grubu yok");
  const menuSayi = Number(await p.locator('.menu a[href="#/oneriler"] .say').innerText().catch(() => "0"));
  const kutuSayi = Number(await p.locator('[data-py-kutu="oneri"] .py-sayi').innerText());
  ok(menuSayi === kutuSayi && kutuSayi > 0, `menüdeki öneri sayısı kutuyla aynı (${menuSayi}/${kutuSayi})`);
  await gir("pl2", "#/oneriler");
  const sekmeSayi = Number((await p.locator('[data-oneri-sekme="karar"] em, [data-oneri-sekme="karar"] .say').first().innerText().catch(() => "-1")).replace(/\D/g, ""));
  ok(sekmeSayi === kutuSayi, `"Karar bekleyen" sekmesiyle aynı sayı (${sekmeSayi}/${kutuSayi})`);

  // Kutular ve panel.
  await gir("pl2", "#/");
  ok((await p.locator("[data-py-kutu]").count()) >= 12, "kutular");
  ok((await p.locator('a[data-py-kutu="nextday"]').getAttribute("href")).startsWith("#/nextday"), "Next Day kutusu planın sayfasına götürüyor");
  await p.click('[data-py-kutu="oneri"]');
  await p.waitForTimeout(400);
  ok((await p.locator('[data-py-panel="oneri"] [data-oneri]').count()) === kutuSayi, "panelde karar bekleyen öneriler");
  await p.locator('[data-py-panel="oneri"] [data-oneri]').first().click();
  await p.waitForTimeout(400);
  ok((await p.locator("dialog[open]").count()) === 2, "öneri penceresi panelin üstünde açılıyor");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  ok((await p.locator("dialog[open]").count()) === 1 && (await p.locator('[data-py-panel="oneri"]').count()) === 1, "kapatınca panele dönülüyor");
  await p.goBack();
  await p.waitForTimeout(300);
  ok((await p.locator("dialog[open]").count()) === 0, "geri tuşu paneli kapatıyor");
  await p.click('[data-py-kutu="muhabir"]');
  await p.waitForTimeout(300);
  ok((await p.locator('[data-py-panel="muhabir"] [data-kisi-cipi]').count()) > 5, "muhabir panelinde kişi çipleri");
  await p.keyboard.press("Escape");

  // Yönetici: Yönetim grubu.
  await gir("pl1", "#/");
  ok((await p.locator('.menu a[href="#/raporlar"]').count()) === 1, "yöneticide Yönetim grubu");

  // Tam yönetici de yeni düzende; eski menüdeki kendi sayfaları (Muhasebe, Organizasyon…) kaybolmuyor.
  await gir("yo3", "#/", false);
  const eskiMenu = await p.locator(".menu a[href^='#/']").evaluateAll((e) => e.map((a) => a.getAttribute("href")));
  await gir("yo3", "#/");
  ok((await p.locator('[data-birim-menusu="planlama"]').count()) === 1 && (await p.locator("[data-py-kutu]").count()) >= 12, "tam yönetici yeni menü ve kutulu ana sayfa");
  const yeniMenu = await p.locator(".menu a[href^='#/']").evaluateAll((e) => e.map((a) => a.getAttribute("href")));
  const eksik = eskiMenu.filter((h) => !yeniMenu.includes(h));
  ok(eksik.length === 0, `tam yöneticinin hiçbir sayfası menüden düşmedi (${eksik.join(",")})`);

  // Kişi çipi: paket sayfasında, posta konusu paketin başlığı.
  const d = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const pk = d.paketler.find((x) => x.muhabirId && x.durum === "onaylandi" && d.kisiler.find((k) => k.id === x.muhabirId)?.eposta);
  await gir("pl2", "#/paketler/" + pk.id);
  await p.locator(`[data-kisi-cipi="${pk.muhabirId}"] button`).first().click();
  await p.waitForTimeout(300);
  ok((await p.locator(".kisi-karti [data-kisi-durum]").count()) === 1, "çipin kartında bugünkü durum");
  await p.locator(".kisi-karti [data-is-postasi]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-yeni-konu]").inputValue()) === pk.baslik, "posta penceresi paketin başlığıyla");

  // Muhabirin kendisi çip kartını görmüyor.
  const muh = d.kisiler.find((k) => k.id === pk.muhabirId);
  await gir(muh.id, "#/paketler/" + pk.id);
  ok((await p.locator(".kisi-karti, [data-kisi-iletisim]").count()) === 0, "muhabir iletişim kartını görmüyor");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pl2", "#/");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${dil})`);
    ok((await p.locator('.alt-cubuk a[href="#/nextday"]').count()) === 1, `telefonda alt çubukta Next Day (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
