// Tanıtım sayfası güncel akışla (kullanıcı: eskimişti) ve kuruma ait iç bilgi vermez: proje planı (iç
// tartışma notları) girişsiz ve demoda açılmaz, tanıtımda ve demo girişinde bağlantısı yok.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  for (const [dil, gen] of [["tr", 1400], ["ar", 390], ["en", 1000]]) {
    const p = await b.newPage({ viewport: { width: gen, height: 900 } });
    p.on("pageerror", (e) => hatalar.push(String(e)));
    await p.goto(B);
    await p.evaluate((d) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); }, dil);
    await p.goto("about:blank");
    await p.goto(B);
    await p.waitForTimeout(800);
    ok((await p.locator("[data-tanitim-nasil] .tanitim-adimlar li").count()) === 5, `${dil}: beş adım`);
    ok((await p.locator("[data-tanitim-ozellikler] .tanitim-kart").count()) === 12, `${dil}: on iki özellik kartı`);
    ok((await p.locator(".tanitim-ilkeler > div").count()) === 4, `${dil}: dört ilke`);
    ok((await p.locator('a[href="#/plan"]').count()) === 0, `${dil}: proje planı bağlantısı yok`);
    // Birimler listesinde Newsdesk ve News Gathering birim adı olarak durur; akış ve özellikler onları aşama diye anlatmaz.
    const metin = (await p.locator("[data-tanitim-nasil]").innerText()) + (await p.locator("[data-tanitim-ozellikler]").innerText()) + (await p.locator(".tanitim-ilkeler").innerText());
    ok(!/News Gathering|Newsdesk|Teknik|iNews|Exchange|EWS|trt\.net|@/.test(metin), `${dil}: eski aşama ya da altyapı adı yok`);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma === 0, `${dil}: yatay taşma yok (${tasma})`);
    await p.close();
  }
  // Demoda proje planı açılmaz (giriş ekranında da bağlantı yok); kişi seçilmiş olsa da.
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank");
  await p.goto(B + "#/giris");
  await p.waitForTimeout(600);
  ok((await p.locator('a[href="#/plan"]').count()) === 0, "demo girişinde proje planı bağlantısı yok");
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  await p.goto("about:blank");
  await p.goto(B + "#/plan");
  await p.waitForTimeout(800);
  ok(!(await p.locator("body").innerText()).includes("Haberlerin planlanmasından hazırlanmasına"), "demoda proje planı açılmıyor");
  ok((await p.locator('a[href="#/plan"]:not([data-ana-sekme])').count()) === 0, "demoda menüde proje planı yok");
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
