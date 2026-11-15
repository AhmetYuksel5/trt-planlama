// Planlama'nın masaüstü ana sayfası (ekranlar/yeni/AnaPano.tsx, kurallar anaPano.ts): zaman çizgisi, tek karar
// kuyruğu (satır yerinde açılır, pencere açılmaz, karar orada verilir), planlar, üretim, muhabirler;
// sayfa ekranı doldurur, yatay taşma yok (1440, 1280; Türkçe, Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });

  await gir("pl2", "#/");
  ok((await p.locator("[data-ana-pano]").count()) === 1, "masaüstünde pano");
  ok((await p.locator("[data-ap-cizgi]").count()) === 1 && (await p.locator("[data-ap-siradaki]").innerText()).length > 0, "zaman çizgisi ve sıradaki");
  ok((await p.locator("[data-ap-olay]").count()) >= 2, "çizgide bugünün olayları");
  ok((await p.locator('[data-ap-sutun]').count()) === 3, "üç sütun");
  const kuyruk = await p.locator("[data-ap-karar]").count();
  ok(kuyruk > 5, `karar kuyruğu dolu (${kuyruk})`);
  ok((await p.locator('[data-ap-grup="apAcil"]').count()) === 1, "bugün ve yarın grubu");
  ok((await p.locator("[data-py-panel], dialog[open]").count()) === 0, "yan panel yok");
  const sayfa = await p.evaluate(() => [document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight]);
  ok(sayfa[0] <= 0 && sayfa[1] <= 8, `ekranı dolduruyor, taşmıyor (${sayfa})`);

  // Öneri satırı yerinde açılıyor; ikinci satır açılınca ilki kapanıyor.
  const oneriler = p.locator('[data-ap-karar="oneri"]');
  const ilkRef = await oneriler.nth(0).getAttribute("data-ap-ref");
  await oneriler.nth(0).locator(".ap-satir-bas").click();
  await p.waitForTimeout(400);
  ok((await p.locator(`[data-oneri-yerinde="${ilkRef}"]`).count()) === 1 && (await p.locator("dialog[open]").count()) === 0, "öneri yerinde açıldı, pencere yok");
  await oneriler.nth(1).locator(".ap-satir-bas").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-oneri-yerinde]").count()) === 1 && (await p.locator(`[data-oneri-yerinde="${ilkRef}"]`).count()) === 0, "aynı anda tek satır açık");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok((await p.locator("[data-oneri-yerinde]").count()) === 0, "Esc satırı kapatıyor");

  // Karar satırın içinde: ret; satır kuyruktan düşer.
  // Talimat reddedilemiyor: reddedilebilen ilk öneri.
  let ref = "";
  for (let i = 0; i < (await oneriler.count()) && !ref; i++) {
    await oneriler.nth(i).locator(".ap-satir-bas").click();
    await p.waitForTimeout(300);
    if (await p.locator("[data-oneri-yerinde] [data-oneri-reddet]").count()) ref = await oneriler.nth(i).getAttribute("data-ap-ref");
  }
  await p.locator("[data-oneri-yerinde] [data-oneri-reddet]").click();
  await p.waitForTimeout(300);
  await p.locator("[data-oneri-yerinde] .form-kutu input").fill("Planla örtüşüyor");
  await p.locator("[data-oneri-yerinde] .form-kutu .form-alt button:not(.dugme-ikincil)").click();
  await p.waitForTimeout(500);
  const d1 = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  ok(d1.oneriler.find((o) => o.id === ref)?.durum === "reddedildi", "satırdan reddedildi");
  ok((await p.locator(`[data-ap-ref="${ref}"]`).count()) === 0 && (await p.locator("[data-ap-karar]").count()) === kuyruk - 1, "kuyruktan düştü");

  // Sonuç onayı: muhabir masraf girip "Yapıldı" der; onaylayan satırda masrafı görür, onay masrafı da onaylar.
  const pk = d1.paketler.find((x) => x.durum === "onaylandi" && !x.isaret && !x.masaTakibi && !x.ozelId && !x.adim && d1.kisiler.find((k) => k.id === x.muhabirId)?.birim === "muhabir");
  await gir(pk.muhabirId, "#/paketler/" + pk.id);
  await p.click("[data-masraf-ac]");
  await p.click('[data-masraf-tur="konaklama"]');
  await p.fill("[data-masraf-tutar]", "120");
  await p.click("[data-masraf-ekle]");
  await p.waitForTimeout(300);
  await p.click(`[data-paket-yapildi="${pk.id}"]`);
  await p.waitForTimeout(400);
  // Onay yetkisi (paketOnayi) demoda tam yöneticide.
  await gir("yo3", "#/");
  const onay = p.locator(`[data-ap-karar="onay"][data-ap-ref="${pk.id}"]`);
  ok((await onay.count()) === 1, "kuyrukta sonuç onayı");
  await onay.locator(".ap-satir-bas").click();
  await p.waitForTimeout(300);
  ok((await onay.locator("[data-ap-masraf]").innerText()).includes("120"), "onay satırında masraf");
  await onay.locator("[data-isaret-onayla]").click();
  await p.waitForTimeout(500);
  const d2 = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const pk2 = d2.paketler.find((x) => x.id === pk.id);
  ok(pk2.durum === "tamamlandi" && !!pk2.masrafOnayi, "Yapıldı onayı masrafı da onayladı");

  // Dar masaüstü ve Arapça: taşma yok.
  for (const [w, h, dil] of [[1280, 720, "tr"], [1440, 900, "ar"]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pl2", "#/");
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${w}px taşma yok (${dil})`);
    ok((await p.locator("[data-ap-karar]").count()) > 0, `${w}px kuyruk görünüyor (${dil})`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
