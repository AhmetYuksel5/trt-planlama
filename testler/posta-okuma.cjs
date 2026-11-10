// Posta: bütün postalarda arama (Sohbetler'in başlığında, "+"nın solunda) ve okunmamış işaretleri, menü sayısı, okunmadı yap, hepsini okundu say; 390px
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  const kim = async (id, dil = "tr") => { await p.goto(B); await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [id, dil]); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const menuSayi = async () => { const l = p.locator('.menu a[href="#/posta"] .say'); return (await l.count()) ? Number(await l.first().innerText()) : 0; };
  const rozet = async (id) => { const l = p.locator(`[data-posta-sohbet-bag="${id}"] [data-posta-okunmamis-say]`); return (await l.count()) ? Number(await l.innerText()) : 0; };
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());

  await kim("pl1");
  await git("#/");
  ok((await menuSayi()) === 0, "posta hiç açılmadan menüde sayı yok");
  await git("#/posta");
  const v1 = await veri();
  ok(!!v1.postaOkunan?.pl1?.taban, "ilk açılışta okundu tabanı kayda yazıldı");
  ok((await rozet("ornek-gazze")) === 2 && (await rozet("ornek-mukabele")) === 1 && (await rozet("ornek-studyo")) === 1, "son bir günün gelen postaları okunmamış (giden sayılmaz)");
  ok((await p.locator(".posta-sohbet.okunmamis").count()) === 3, "okunmamış sohbetler işaretli");
  ok((await p.locator("[data-posta-okunmamis-suz]").innerText()).includes("4"), "listede toplam okunmamış: 4");
  ok((await menuSayi()) === 4, "menüde Posta'nın sayısı okunmamış posta");

  // Açılan sohbet okunmuş sayılır
  await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').click();
  await p.waitForTimeout(400);
  ok((await rozet("ornek-gazze")) === 0 && !(await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').getAttribute("class")).includes("okunmamis"), "açılan sohbet okundu");
  ok((await menuSayi()) === 2, "menü sayısı düştü");
  ok(!!(await veri()).postaOkunan.pl1.k["ornek-gazze"], "okundu kayıtta (iplik başına)");

  // Okunmadı yap: sohbet kapanır, yeniden okunmamış
  await p.locator("[data-posta-okunmadi]").click();
  await p.waitForTimeout(400);
  ok((await rozet("ornek-gazze")) === 1, "okunmadı yap: son gelen posta yeniden okunmamış");
  ok((await p.locator("[data-posta-sohbet]").count()) === 0, "okunmadı yapınca sohbet kapandı");

  // Yalnız okunmamışlar süzgeci
  await p.locator('[data-posta-sohbet-bag="ornek-studyo"]').click();
  await p.waitForTimeout(300);
  await p.locator('[data-posta-sohbet-bag="ornek-mukabele"]').click();
  await p.waitForTimeout(300);
  await p.locator("[data-posta-okunmamis-suz]").click();
  await p.waitForTimeout(200);
  const suzulu = await p.locator("[data-posta-liste] > li").count();
  ok(suzulu === 2, "yalnız okunmamışlar (ve açık sohbet): " + suzulu);
  await p.locator("[data-posta-okunmamis-suz]").click();

  // Hepsini okundu say
  await p.locator("[data-posta-hepsi-okundu]").click();
  await p.waitForTimeout(300);
  ok((await p.locator(".posta-sohbet.okunmamis").count()) === 0 && (await menuSayi()) === 0, "hepsini okundu say");
  ok((await p.locator("[data-posta-hepsi-okundu]").count()) === 0, "okunmamış yokken çubuk gizli");

  // Bütün postalarda arama: düğme "+"nın hemen solunda
  const sira = await p.evaluate(() => {
    const a = document.querySelector("[data-posta-genel-ac]"), y = document.querySelector("[data-posta-yeni-ac]");
    return a && y && a.nextElementSibling === y;
  });
  ok(sira, "arama düğmesi \"+\"nın hemen solunda");
  await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').click();
  await p.waitForTimeout(200);
  await p.locator("[data-posta-genel-ac]").click();
  await p.locator("[data-posta-genel-girdi]").fill("الصور");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1 && (await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').count()) === 1, "mesaj metninde arama: yalnız o sohbet");
  ok((await p.locator("[data-posta-genel-ornek]").innerText()).includes("الصور"), "eşleşen mesaj satırda");
  await p.locator("[data-posta-genel-girdi]").fill("rafah-notlar");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1, "ek adında arama");
  await p.locator("[data-posta-genel-girdi]").fill("وزير");
  await p.waitForTimeout(300);
  ok((await p.locator('[data-posta-sohbet-bag="ornek-mukabele"]').count()) === 1 && (await p.locator("[data-posta-liste] > li").count()) === 1, "konu ve metinde arama");
  await p.locator('[data-posta-sohbet-bag="ornek-mukabele"]').click();
  await p.waitForTimeout(500);
  ok((await p.locator("[data-posta-ara-girdi]").inputValue()) === "وزير", "açılan sohbette aynı sorgu açık");
  ok((await p.locator(".posta-balon.bulundu").count()) >= 1, "eşleşen balon işaretli");
  await p.locator("[data-posta-genel-girdi]").fill("yokboylebirsey");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-liste] > li").count()) === 0, "eşleşmeyen sorgu: liste boş");
  await p.locator("[data-posta-genel-kapat]").click();
  await p.waitForTimeout(200);
  ok((await p.locator("[data-posta-liste] > li").count()) === 3, "arama kapanınca bütün sohbetler");

  // 390px taşma, Türkçe ve Arapça
  for (const dil of ["tr", "ar"]) {
    await kim("pl1", dil);
    await p.setViewportSize({ width: 390, height: 844 });
    await git("#/posta");
    await p.locator("[data-posta-genel-ac]").click();
    await p.locator("[data-posta-genel-girdi]").fill("الصور");
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t === 0, `390px taşma yok (${dil}): ${t}`);
    await p.setViewportSize({ width: 1440, height: 1000 });
  }

  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
