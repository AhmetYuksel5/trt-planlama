// Kullanım izi (kullanim.ts; kullanıcı: kimin sistemi, kimin uygulamayı kullandığını tam yönetici görsün):
// açılışta kişinin kendi izi yazılır, aynı gün aynı yolla yeniden yazılmaz; ana ekran uygulaması ve
// Android uygulaması tanınır; Organizasyon › Kişiler'de satırda ve süzgeçte yalnız tam yöneticiye görünür.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const sayfa = async (ayar = {}, kurulum) => {
    const c = await b.newContext({ viewport: { width: 1400, height: 900 }, ...ayar });
    if (kurulum) await c.addInitScript(kurulum);
    const p = await c.newPage();
    p.on("pageerror", (e) => hatalar.push(String(e)));
    return p;
  };
  const veri = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const gir = async (p, kim, yol = "#/") => {
    await p.goto(B);
    await p.evaluate((k) => {
      localStorage.setItem("trt-planlama-dil", "tr");
      localStorage.setItem("trt-planlama-oturum", k);
    }, kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1200);
  };

  // 1. Bilgisayarda tarayıcıdan giren.
  const p = await sayfa();
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await gir(p, "pl1");
  let d = await veri(p);
  const iz = d.kullanim?.pl1;
  ok(iz && iz.kanal === "tarayici" && iz.cihaz === "bilgisayar", "tarayıcı ve bilgisayar izi yazıldı");
  // 2. Aynı gün yeniden açılış yazılmaz.
  await gir(p, "pl1");
  d = await veri(p);
  ok(d.kullanim.pl1.son === iz.son, "aynı gün aynı yolla yeniden yazılmadı");
  const kayit = await p.evaluate(() => localStorage.getItem("trt-planlama-v25"));

  // 3. Ana ekran uygulaması (display-mode: standalone), telefonda.
  const p2 = await sayfa(
    { viewport: { width: 390, height: 800 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148" },
    () => {
      const asil = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : asil(q));
    },
  );
  await p2.goto(B);
  await p2.evaluate((k) => localStorage.setItem("trt-planlama-v25", k), kayit);
  await gir(p2, "pl1");
  d = await veri(p2);
  ok(d.kullanim.pl1.kanal === "pwa" && d.kullanim.pl1.cihaz === "telefon", "ana ekran uygulaması ve telefon tanındı");
  ok(d.kullanim.pl1.kanallar.includes("tarayici") && d.kullanim.pl1.kanallar.includes("pwa"), "önceki yol da listede");
  ok(d.kullanim.pl1.ilk === iz.ilk, "ilk görülme korundu");

  // 4. Android uygulaması (yönlendiren android-app://, sekmeye yazılmış).
  const kayit2 = await p2.evaluate(() => localStorage.getItem("trt-planlama-v25"));
  const p3 = await sayfa({ userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile" }, () => {
    try {
      sessionStorage.setItem("trt-planlama-apk", "1");
    } catch {
      /* about:blank */
    }
  });
  await p3.goto(B);
  await p3.evaluate((k) => localStorage.setItem("trt-planlama-v25", k), kayit2);
  await gir(p3, "pl1");
  d = await veri(p3);
  ok(d.kullanim.pl1.kanal === "apk", "Android uygulaması tanındı");

  // 5. Tam yönetici Kişiler'de görür; süzgeçler.
  const kayit3 = await p3.evaluate(() => localStorage.getItem("trt-planlama-v25"));
  // Oturum da aynı anda yo3: pl1 olarak masaüstünde bir açılış izi "tarayıcı"ya çevirirdi.
  await p.evaluate((k) => {
    localStorage.setItem("trt-planlama-v25", k);
    localStorage.setItem("trt-planlama-oturum", "yo3");
  }, kayit3);
  await gir(p, "yo3", "#/organizasyon/kisiler");
  ok((await p.locator('[data-org-hesap-suz="uygulama"]').count()) === 1, "Uygulamayla giren süzgeci var");
  await p.click('[data-org-hesap-suz="uygulama"]');
  await p.waitForTimeout(300);
  const satir = p.locator('[data-org-kisi="pl1"] [data-kullanim]').first();
  ok((await satir.getAttribute("data-kullanim")) === "apk", "satırda son yol Android uygulaması");
  ok(/Android/.test(await satir.innerText()), "satırda yolun adı");
  const uygulamada = await p.locator("[data-org-kisi]").evaluateAll((l) => l.map((x) => x.getAttribute("data-org-kisi")));
  ok(uygulamada.includes("pl1") && !uygulamada.includes("yo3"), "süzgeç yalnız uygulamayı kullananları gösterir");
  await p.click('[data-org-hesap-suz="uygulama"]');
  await p.click('[data-org-hesap-suz="girmedi"]');
  await p.waitForTimeout(300);
  const girmeyen = await p.locator("[data-org-kisi]").evaluateAll((l) => l.map((x) => x.getAttribute("data-org-kisi")));
  ok(girmeyen.length > 0 && !girmeyen.includes("pl1") && !girmeyen.includes("yo3"), "Hiç girmemiş süzgeci girenleri göstermez");

  // 6. Tam yönetici olmayan görmez.
  await gir(p, "pl1", "#/organizasyon/kisiler");
  ok((await p.locator("[data-kullanim]").count()) === 0, "tam yönetici olmayan kullanım izini görmez");
  ok((await p.locator('[data-org-hesap-suz="uygulama"]').count()) === 0, "tam yönetici olmayanda süzgeç yok");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
