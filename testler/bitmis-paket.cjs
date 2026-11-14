// Biten paket şeridi (kullanıcı: aşama bittikten sonra ince şerit; başlık, muhabir, tarih; basınca yapım
// aşamaları, birim ne kadar görmeliyse o kadar). Paketler › Yapılan, muhabirin Haberlerim'i, paket sayfası.
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
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25") || "{}"));

  // Biten paket: görev, muhabirin "Yapıldı"sı, onay; aşama izine süre ve not ekle.
  await gir("pl1", "#/paketler");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await p.locator("[data-gorev-formu] select").first().selectOption("mu2");
  await p.locator("[data-gorev-baslik]").fill("تقرير الشريط المنتهي");
  await p.locator("[data-gorev-gonder]").click(); await p.waitForTimeout(400);
  const pk = (await veri()).paketler.find((x) => x.baslik === "تقرير الشريط المنتهي");
  await gir("mu2", "#/oneriler");
  await p.locator(`[data-paket="${pk.id}"] [data-paket-yapildi]`).click(); await p.waitForTimeout(400);
  await gir("yo3", `#/paketler/${pk.id}`);
  await p.locator("[data-isaret-onayla]").first().click(); await p.waitForTimeout(500);
  ok((await veri()).paketler.find((x) => x.id === pk.id).durum === "tamamlandi", "paket tamamlandı");

  // 1. Paket sayfası: aşama kutuları yerine yapım aşamaları ve künye
  await gir("pl1", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-asama-listesi]").count()) === 0, "biten pakette aşama kutuları yok");
  ok((await p.locator(`[data-bitmis-ic="${pk.id}"]`).count()) === 1, "sayfada yapım aşamaları");
  ok((await p.locator("[data-kunye]").count()) === 1, "sayfada künye");

  // 2a. Aktif sekme de tablo değil şerit (kullanıcı: paketler öneriden ayrı, yalnız başlık, gün, muhabir); sıralanır.
  await gir("pl1", "#/paketler");
  ok((await p.locator('[data-paket-listesi="gun"] [data-serit-tur="aktif"]').count()) > 0, "aktif paketler güne göre gruplu şeritte");
  ok((await p.locator("main table").count()) === 0, "Paketler'de tablo yok");
  const aktif = p.locator('[data-serit-tur="aktif"]').filter({ has: p.locator(".bp-bar") }).first();
  await aktif.locator(".bp-bas").click(); await p.waitForTimeout(200);
  ok((await aktif.locator('[data-bp-durum="simdi"]').count()) === 1, "süren pakette şimdiki aşama belli");
  await p.locator("[data-paket-sira]").selectOption("muhabir"); await p.waitForTimeout(200);
  ok((await p.locator('[data-paket-listesi="muhabir"] [data-paket-grup]').count()) > 1, "muhabire göre gruplu");
  await p.locator("[data-paket-sira]").selectOption("baslik"); await p.waitForTimeout(200);
  ok((await p.locator('[data-paket-listesi="baslik"]').count()) === 1 && (await p.locator("[data-paket-grup]").count()) === 0, "başlığa göre düz liste");
  await p.locator("[data-paket-sira]").selectOption("gun");

  // 2. Paketler › Yapılan: tablo değil şerit, kapalı; basınca açılır
  await gir("pl1", "#/paketler");
  await p.locator('[data-paket-sonucu="yapildi"]').click();
  await p.waitForTimeout(300);
  const serit = p.locator(`[data-bitmis-serit="${pk.id}"]`);
  ok((await serit.count()) === 1, "Yapılan sekmesinde şerit");
  const h = await serit.locator(".bp-bas").boundingBox();
  ok(h && h.height <= 60, `şerit ince (${h && Math.round(h.height)} px)`);
  ok((await serit.locator("[data-bitmis-ic]").count()) === 0, "şerit kapalı geliyor");
  ok((await serit.innerText()).includes("الشريط المنتهي"), "şeritte başlık");
  await serit.locator(".bp-bas").click(); await p.waitForTimeout(200);
  ok((await serit.locator("[data-bitmis-ic] [data-bp-asama]").count()) >= 1, "açılınca aşamalar");
  ok((await serit.locator(".bp-sayfa").count()) === 1, "açılınca sayfaya bağlantı");

  // 3. Muhabirin Haberlerim'i: kendi paketi şerit
  await gir("mu2", "#/paketler");
  ok((await p.locator(`[data-haberlerim] [data-bitmis-serit="${pk.id}"]`).count()) === 1, "Haberlerim'de şerit");
  await p.locator(`[data-bitmis-serit="${pk.id}"] .bp-bas`).click(); await p.waitForTimeout(200);
  ok((await p.locator("[data-bp-sure]").count()) === 0 && (await p.locator("[data-bp-not]").count()) === 0, "muhabir süre ve ekip notu görmüyor");

  // 4. 390 pikselde taşma yok (tr, ar)
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const [kim, yol] of [["pl1", `#/paketler/${pk.id}`], ["mu2", "#/paketler"]]) {
      await gir(kim, yol);
      await p.evaluate(() => document.querySelectorAll(".bp-bas").forEach((x) => x.click()));
      await p.waitForTimeout(200);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(t <= 0, `${dil} ${kim} 390 px taşma yok (${t})`);
    }
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
