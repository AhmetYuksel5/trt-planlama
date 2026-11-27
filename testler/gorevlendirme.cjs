// Görevlendirme kartı (kullanıcı: paket yapılırken ya da sonra, muhabire görevlendirmede ne söylendiği,
// ne üzerine görevlendirildiği istenince görülsün): paket sayfasında "Görevlendirme" düğmesi; planın
// başlığı, Strap, işleme fikri, planlamacının notu, karar notu, notlar ve gönderilen postanın metni.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl2", "#/");

  // Plandaki onaylı paket: planlamacının başlıktaki notu, işleme fikri, karar notu ve paket notu.
  const pk = await p.evaluate(() => {
    const k = "trt-planlama-v25";
    const d = JSON.parse(localStorage.getItem(k));
    const x = d.paketler.find((y) => y.planId && y.planBaslikId && !y.ozelId && d.kisiler.find((z) => z.id === y.muhabirId)?.birim === "muhabir" && d.planlar.find((q) => q.id === y.planId)?.basliklar.some((b) => b.id === y.planBaslikId));
    x.durum = "onaylandi";
    delete x.takdirBildirimi; delete x.adim; delete x.isaret; delete x.muhabirTbc;
    const plan = d.planlar.find((y) => y.id === x.planId);
    const pb = plan.basliklar.find((y) => y.id === x.planBaslikId);
    pb.muhabirler = [...pb.muhabirler.filter((m) => m.kisiId !== x.muhabirId), { kisiId: x.muhabirId, not: "ركز على شهادات النازحين" }];
    plan.durum = "onaylandi";
    x.planIsleme = "فكرة: مقابلات ميدانية";
    x.kararNotu = "لا يتجاوز دقيقتين";
    x.notlar = [{ id: "nt1", kisiId: "pl2", zaman: new Date().toISOString(), metin: "صور من المخيم" }];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { id: x.id, planId: x.planId, muhabirId: x.muhabirId, baslik: d.basliklar.find((y) => y.id === pb.baslikId)?.ad };
  });

  await gir("pl2", "#/paketler/" + pk.id);
  await p.click("[data-gorevlendirme-ac]");
  const kart = p.locator("[data-gorevlendirme]");
  ok(await kart.isVisible(), "pencere açıldı");
  const metin = await kart.innerText();
  ok(metin.includes(pk.baslik), "planın başlığı");
  ok(metin.includes("ركز على شهادات النازحين"), "planlamacının notu");
  ok(metin.includes("مقابلات ميدانية"), "işleme fikri");
  ok(metin.includes("لا يتجاوز دقيقتين"), "karar notu");
  ok(metin.includes("صور من المخيم"), "paket notu");
  ok((await p.locator('[data-gk="posta"]').count()) === 0, "posta gitmeden posta satırı yok");

  // PKG geri bildirimi gönderilince konu ve metin pakete yazılır, kartta görünür.
  await gir("pl2", `#/nextday/${pk.planId}/takdir`);
  await p.click("[data-takdir-gonder]");
  await p.waitForTimeout(500);
  const iz = await p.evaluate((id) => JSON.parse(localStorage.getItem("trt-planlama-v25")).paketler.find((x) => x.id === id).takdirBildirimi, pk.id);
  ok(!!iz?.konu && !!iz?.metin, "posta izinde konu ve metin");
  await gir(pk.muhabirId, "#/paketler/" + pk.id);
  await p.click("[data-gorevlendirme-ac]");
  const posta = await p.locator('[data-gk="posta"]').innerText().catch(() => "");
  ok(iz && posta.includes(iz.konu), "muhabir postanın konusunu görüyor");
  ok((await p.locator('[data-gk="plan-notu"]').count()) === 1, "muhabir planlamacının notunu görüyor");

  // Telefonda taşma yok, Arapçada da.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "ar"));
  await gir(pk.muhabirId, "#/paketler/" + pk.id);
  await p.click("[data-gorevlendirme-ac]");
  ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390'da taşma yok");

  console.log(`gorevlendirme: ${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
