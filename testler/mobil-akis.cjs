// Mobil denetimin akış önerileri (kullanıcı onayladı): ana sayfanın "Karar bekleyen" panelinde kartta hızlı
// karar (Plana ekle, ret); pencerede karar verilince pencere kapanır, vazgeçilen form pencereyi kapatmaz;
// telefonda Next Day başlığının altında tek satırlık gelişme ("YER / metin", Enter).
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
    const kayit = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
    const acikPencere = () => p.locator("dialog.pencere[open]").count();

    // Panelde hızlı karar.
    await gir("pl2", "#/");
    await p.locator('[data-py-kutu="oneri"]').tap();
    await p.waitForTimeout(400);
    ok((await p.locator('[data-py-panel="oneri"] [data-oneri-ekle]').count()) > 0, `${dil}: panelde "Plana ekle" kartta`);
    ok((await p.locator('[data-py-panel="oneri"] [data-oneri-hizli-ret]').count()) > 0, `${dil}: panelde ret simgesi kartta`);
    const retId = await p.locator('[data-py-panel="oneri"] [data-oneri]:has([data-oneri-hizli-ret])').first().getAttribute("data-oneri");
    await p.locator(`[data-py-panel="oneri"] [data-oneri="${retId}"] [data-oneri-hizli-ret]`).tap();
    await p.waitForTimeout(400);
    ok((await acikPencere()) === 2, `${dil}: ret formu önerinin penceresinde, panelin üstünde`);
    await p.locator("dialog.pencere[open]").last().locator(".form-kutu input").first().fill("خارج اهتماماتنا");
    await p.locator("dialog.pencere[open]").last().locator(".form-alt .dugme:not(.dugme-ikincil)").tap();
    await p.waitForTimeout(500);
    ok((await kayit()).oneriler.find((o) => o.id === retId)?.durum === "reddedildi", `${dil}: panelden reddedildi`);
    ok((await acikPencere()) === 1, `${dil}: karardan sonra öneri penceresi kapandı, panel açık`);

    // Pencerede: vazgeçilen form pencereyi kapatmaz; verilen karar kapatır.
    const id2 = await p.locator('[data-py-panel="oneri"] [data-oneri]:has([data-oneri-hizli-ret])').first().getAttribute("data-oneri");
    await p.locator(`[data-py-panel="oneri"] [data-oneri="${id2}"] .ok-baslik`).tap();
    await p.waitForTimeout(400);
    await p.locator("dialog.pencere[open]").last().locator("[data-oneri-reddet]").tap();
    await p.waitForTimeout(300);
    await p.locator("dialog.pencere[open]").last().locator(".form-alt .dugme-ikincil").tap();
    await p.waitForTimeout(300);
    ok((await acikPencere()) === 2, `${dil}: vazgeçince öneri penceresi açık kalıyor`);
    await p.locator("dialog.pencere[open]").last().locator("[data-oneri-reddet]").tap();
    await p.waitForTimeout(300);
    await p.locator("dialog.pencere[open]").last().locator(".form-kutu input").first().fill("مكرر");
    await p.locator("dialog.pencere[open]").last().locator(".form-alt .dugme:not(.dugme-ikincil)").tap();
    await p.waitForTimeout(500);
    ok((await kayit()).oneriler.find((o) => o.id === id2)?.durum === "reddedildi" && (await acikPencere()) === 1, `${dil}: pencerede karar verince pencere kapandı`);

    // Next Day: telefonda hızlı gelişme satırı.
    await gir("pl2", "#/nextday/yarin");
    await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await p.waitForTimeout(300);
    const satir = p.locator("[data-hizli-gelisme]").first();
    ok(await satir.isVisible(), `${dil}: başlığın altında hızlı gelişme satırı`);
    const pb = await satir.getAttribute("data-hizli-gelisme");
    const once = (await kayit()).gelismeler.filter((g) => g.planBaslikId === pb).length;
    await satir.locator("input").fill("الموصل / وصول وفد حكومي لتفقد السد");
    await satir.locator("input").press("Enter");
    await p.waitForTimeout(400);
    const gs = (await kayit()).gelismeler.filter((g) => g.planBaslikId === pb);
    const son = gs.find((g) => g.metin === "وصول وفد حكومي لتفقد السد");
    ok(gs.length === once + 1 && son && son.yer === "الموصل", `${dil}: gelişme eklendi, yer ayrıldı (${gs.length - once})`);
    ok((await satir.locator("input").inputValue()) === "", `${dil}: satır boşaldı`);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: taşma yok`);
    await c.close();
  }
  // Masaüstünde hızlı satır yok (klasik kartta düğmeler yerinde).
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await p.goto("about:blank");
  await p.goto(B + "#/nextday/yarin");
  await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  ok(!(await p.locator("[data-hizli-gelisme]").first().isVisible()), "masaüstünde hızlı gelişme satırı görünmüyor");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
