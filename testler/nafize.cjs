// Nafize (kullanıcı): canlı yayın bölümünde "Nafize ekle"; "مباشر"da görünmez, seçilen başlığın gelişmelerinin
// altında "نافذة / نوافذ" başlığıyla, "08:00G - mekan" ve altında "المذيع: ad / الضيف: ad"; birkaç saat tek formda.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/oneriler");
  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    plan.durum = "taslak";
    plan.nafizeler = [];
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    return { plan: plan.id, pb: plan.basliklar[1].id };
  }, K);

  await git(`#/nextday/${ids.plan}`);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const dugme = p.locator("[data-nafize-ekle] button").first();
  ok((await dugme.count()) === 1, "canlı yayın bölümünde Nafize ekle");
  await dugme.click();
  const f = p.locator("dialog[open] [data-nafize-formu]");
  await f.locator("[data-nafize-baslik]").selectOption(ids.pb);
  await f.locator("[data-nafize-saat-girdi]").first().fill("8");
  await f.locator("[data-nafize-yer]").first().fill("استوديو الدوحة");
  await f.locator("[data-nafize-sunucu-ad]").first().fill("سامر خليل");
  await f.locator("[data-nafize-konuklar]").first().fill("محمد علي، أحمد حسن");
  await f.locator("[data-nafize-satir-ekle]").click();
  await f.locator("[data-nafize-saat-girdi]").nth(1).fill("1130");
  await f.locator("[data-nafize-konuklar]").nth(1).fill("ليلى سعيد");
  await f.locator("[data-nafize-kaydet]").click();
  await p.waitForTimeout(500);
  const pl = (await oku()).planlar.find((x) => x.id === ids.plan);
  ok(pl.nafizeler?.length === 2 && pl.nafizeler.every((n) => n.planBaslikId === ids.pb), "iki saat iki nafize, seçilen başlıkta");
  const [a, c] = pl.nafizeler;
  ok(a.saat === "08:00" && c.saat === "11:30" && a.konuklar.length === 2, "saat SS:DD, konuklar ayrıldı");
  ok(c.yer === "استوديو الدوحة" && c.sunucu?.ad === "سامر خليل", "ikinci satır öncekinin mekanı ve sunucusuyla geldi");

  // Klasik başlık kartında
  await git(`#/nextday/${ids.plan}`);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const kart = await p.locator(`[data-nafizeler="${ids.pb}"]`).first().innerText();
  ok(kart.includes("نوافذ") && kart.includes("08:00G") && kart.includes("المذيع:"), "plan ekranında başlığın altında");

  // Çıktı: başlığın altında, مباشر'da değil
  await git(`#/nextday/${ids.plan}/cikti`);
  const cikti = p.locator("article.cikti").first();
  const canli = await cikti.locator("[data-bolum='canli']").allInnerTexts();
  ok(!canli.join(" ").includes("سامر خليل"), "مباشر bölümünde yok");
  const blok = (await cikti.locator(`[data-nafizeler="${ids.pb}"]`).count()) === 1;
  ok(blok, "çıktıda نوافذ alt başlığı");
  const satirlar = await cikti.locator("[data-nafize]").allInnerTexts();
  ok(/08:00G - استوديو الدوحة/.test(satirlar[0]) && /المذيع: سامر خليل \/ الضيوف: محمد علي، أحمد حسن/.test(satirlar[0]), "biçim: saat - mekan, المذيع / الضيوف (" + satirlar[0].replace(/\n/g, " | ") + ")");
  ok(/الضيف: ليلى سعيد/.test(satirlar[1]), "tek konukta الضيف");

  // Belgede sil
  await git(`#/nextday/${ids.plan}/belge`);
  await p.locator("[data-nafize]").first().hover();
  const sil = p.locator(".belge-satir", { has: p.locator("[data-nafize]") }).first().locator(".satir-seridi button").last();
  await sil.evaluate((el) => el.click());
  await p.waitForTimeout(400);
  ok((await oku()).planlar.find((x) => x.id === ids.plan).nafizeler.length === 1, "belgede silindi");
  await git(`#/nextday/${ids.plan}/cikti`);
  ok((await p.locator(`article.cikti [data-nafizeler="${ids.pb}"]`).first().innerText()).trim() === "نافذة", "tekse نافذة");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/nextday/${ids.plan}`);
    await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
    await p.locator("[data-nafize-ekle] button").first().click();
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
