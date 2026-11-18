// "Yapılmadı"nın türü (kullanıcı: ziyaret iptal olunca muhabire verilen paket muhabir raporunda yapılmayan sayılıyordu):
// "Haber düştü" ya da "Muhabir yapamadı" seçilmeden gönderilmez; rapor yalnız ikincisini sayar; onay yetkilisi türü sonradan değiştirir.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25") || "{}"));
  const paket = async (id) => (await veri()).paketler.find((x) => x.id === id);
  const yapilmayan = async () => {
    await gir("pl1", "#/raporlar");
    return Number((await p.locator('[data-mr-satir="mu2"] [data-mr-hucre="yapilmayan"]').innerText()).trim().match(/^\d+/)?.[0] ?? -1);
  };

  const once = await yapilmayan();
  ok(once >= 0, `raporda muhabirin yapılmayan sayısı okunuyor (${once})`);

  // 1. Görev, muhabir "Yapılmadı": tür seçilmeden gönder pasif
  await gir("pl1", "#/paketler");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await p.locator("[data-gorev-formu] select").first().selectOption("mu2");
  await p.locator("[data-gorev-baslik]").fill("زيارة رئيس الوزراء");
  await p.locator("[data-gorev-gonder]").click(); await p.waitForTimeout(400);
  const pk = (await veri()).paketler.find((x) => x.baslik === "زيارة رئيس الوزراء");
  ok(!!pk, "görev paketi açıldı");
  await gir("mu2", `#/paketler/${pk.id}`);
  await p.locator(`[data-paket-yapilmadi="${pk.id}"]`).click(); await p.waitForTimeout(200);
  await p.locator("[data-yapilmadi-sebep]").fill("ألغيت الزيارة");
  ok(await p.locator("[data-yapilmadi-gonder]").isDisabled(), "tür seçilmeden gönderilmiyor");
  await p.locator('[data-yapilmama-nedeni] [data-neden="haber"]').click();
  ok(!(await p.locator("[data-yapilmadi-gonder]").isDisabled()), "tür seçilince gönderilir");
  await p.locator("[data-yapilmadi-gonder]").click(); await p.waitForTimeout(400);
  ok((await paket(pk.id)).isaret?.neden === "haber", "işarette tür: haber düştü");

  // 2. Yetkili onaylar: tür kapanışa geçer, rapor saymaz
  await gir("yo3", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-paket-isaret]").innerText()).includes("Haber düştü"), "onay bekleyen işarette tür yazılı");
  await p.locator("[data-isaret-onayla]").first().click(); await p.waitForTimeout(500);
  const kapandi = await paket(pk.id);
  ok(kapandi.durum === "iptal" && kapandi.yapilmadi?.neden === "haber", "kapanışta tür: haber düştü");
  await gir("yo3", `#/paketler/${pk.id}`);
  ok((await p.locator('[data-yapilmadi-satiri="haber"]').count()) === 1, "paket sayfasında yapılmadı satırı, türüyle");
  ok((await yapilmayan()) === once, "haber düştü raporda yapılmayan sayılmıyor");

  // 3. Onay yetkilisi türü değiştirir; muhabir değiştiremez
  await gir("mu2", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-yapilmadi-tur-degistir]").count()) === 0, "muhabirde tür değiştirme yok");
  await gir("yo3", `#/paketler/${pk.id}`);
  await p.locator("[data-yapilmadi-tur-degistir]").click(); await p.waitForTimeout(200);
  await p.locator('[data-yapilmadi-satiri] [data-neden="muhabir"]').click(); await p.waitForTimeout(400);
  ok((await paket(pk.id)).yapilmadi?.neden === "muhabir", "tür muhabir yapamadı oldu");
  ok((await yapilmayan()) === once + 1, "muhabir yapamadı raporda sayılıyor");

  // 4. 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("yo3", `#/paketler/${pk.id}`);
    await p.locator("[data-yapilmadi-tur-degistir]").click(); await p.waitForTimeout(200);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `390 pikselde taşma yok (${dil})`);
  }

  ok(!hatalar.length, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar[0] : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
