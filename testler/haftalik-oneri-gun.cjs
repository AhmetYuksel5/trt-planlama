// Weekly'den girilen öneride gün (kullanıcı: "Bu haftaya gelen öneriler"e öneri eklerken hangi günün olduğu belli
// olmuyordu, öneri yalnız haftaya bağlanıyordu): gün seçilmeden kaydedilmez; seçilen gün önerinin günü olur, kartta
// yazılır ve "Gündeme ekle" o günle açılır. "Zamana bağlı değil" eskisi gibi yalnız hafta.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1000); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await git("#/oneriler");
  const h = (await veri()).haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
  const gunEkle = (iso, n) => { const t = new Date(iso + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const gun = gunEkle(h.baslangic, 2);

  const formuAc = async () => {
    await git("#/haftalik/" + h.id);
    await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
    await p.locator("main .oneri-arac button").first().click(); await p.waitForTimeout(300);
    // Muhabir seçicisinin ilk muhabiri (seçicinin ikinci seçeneği; ilki boş).
    const m = p.locator(".elle-oneri select:has(option[value^='mu'])").first();
    await m.selectOption(await m.locator("option[value^='mu']").first().getAttribute("value"));
  };

  // 1. Gün sorulur, seçilmeden kaydedilmez
  await formuAc();
  const sec = p.locator("[data-elle-oneri-gun]");
  ok((await sec.count()) === 1, "formda gün seçimi var");
  ok((await sec.locator("option").count()) === 9, "haftanın yedi günü, yer tutucu ve 'zamana bağlı değil'");
  await p.locator(".elle-oneri [data-oneri-header]").fill("اختبار يوم الأسبوع");
  await p.locator(".elle-oneri [data-oneri-gelisme]").fill("تفاصيل الاختبار");
  const kaydet = p.locator(".elle-oneri .form-alt button", { hasText: "Kaydet ve gündeme ekle" });
  ok(await kaydet.isDisabled(), "gün seçilmeden kaydedilemiyor");

  // 2. Gün ve bitiş seçilir; öneri o günü taşır, gündeme ekleme o günle açılır
  await sec.selectOption(gun);
  await p.locator("[data-elle-oneri-bitis]").selectOption(gunEkle(h.baslangic, 3));
  await kaydet.click(); await p.waitForTimeout(700);
  const o = (await veri()).oneriler.find((x) => x.haberBasligi === "اختبار يوم الأسبوع");
  ok(!!o && o.hedefTarih === gun && o.bitisTarih === gunEkle(h.baslangic, 3) && !o.hafta, "öneri seçilen günü ve bitişi taşıyor (hafta günden)");
  const ekle = p.locator("dialog[open] [data-oneri-mod='ekle'] select").first();
  ok((await ekle.count()) === 1 && (await ekle.inputValue()) === gun, "'Gündeme ekle' seçilen günle açıldı");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await git("#/haftalik/" + h.id);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  ok((await p.locator(`[data-oneri="${o?.id}"] .ok-gun`).count()) === 1, "kartın bilgi satırında günü yazılı");

  // 3. Zamana bağlı değil: eskisi gibi yalnız hafta
  await formuAc();
  await p.locator(".elle-oneri [data-oneri-header]").fill("اختبار بلا موعد");
  await p.locator(".elle-oneri [data-oneri-gelisme]").fill("تفاصيل");
  await p.locator("[data-elle-oneri-gun]").selectOption("yok");
  ok((await p.locator("[data-elle-oneri-bitis]").count()) === 0, "zamana bağlı olmayanda bitiş sorulmuyor");
  await p.locator(".elle-oneri .form-alt button", { hasText: /^Kaydet$/ }).click(); await p.waitForTimeout(600);
  const o2 = (await veri()).oneriler.find((x) => x.haberBasligi === "اختبار بلا موعد");
  ok(!!o2 && o2.hafta === h.baslangic && !o2.hedefTarih, "zamana bağlı olmayan öneri yalnız haftaya bağlı");
  await git("#/haftalik/" + h.id);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  ok((await p.locator(`[data-oneri="${o2?.id}"] .ok-gun`).innerText()).trim() === "Zamana bağlı değil", "kartta 'Zamana bağlı değil' yazıyor");

  // 4. 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await formuAc();
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil}, form açık): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
