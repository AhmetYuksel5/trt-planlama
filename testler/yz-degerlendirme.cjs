// Öneri penceresinin Değerlendirme bölümü (kullanıcı: yapay zeka düğmesi kiremit, bölümü
// kaplıyordu; tasarım ajanının önerisi): yapay zeka sonda, tek sönük satır; görüş alınınca
// kanaat düz yazı, puanlar mürekkep, yenileme simge; Paper'da düğme kiremite bürünmüyor.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const gir = async (yol) => {
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "paper"); });
  await gir("#/oneriler");
  const d = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const o = d.oneriler.find((x) => x.muhabirId && ["yeni", "degerlendiriliyor"].includes(x.durum) && !(d.yzGorusleri ?? []).some((g) => g.oneriId === x.id));
  ok(!!o, "uygun öneri var");
  await gir("#/oneriler/" + o.id);
  const bolum = p.locator('[data-oneri-bolum="degerlendirme"]');
  const son = await bolum.locator(".katlanir-govde > *").last().getAttribute("data-yz-gorus");
  ok(son !== null, "yapay zeka bölümün sonunda");
  const al = bolum.locator("[data-yz-gorus-al]");
  ok((await al.count()) === 1 && (await al.innerText()).includes("Görüş al"), "boşken kısa 'Görüş al'");
  await al.hover();
  const renk = await al.evaluate((e) => getComputedStyle(e).backgroundColor);
  ok(renk !== "rgb(196, 98, 63)" && renk !== "rgb(166, 79, 47)", "Paper'da üstündeyken kiremit değil: " + renk);
  await al.click();
  await p.waitForTimeout(600);
  ok((await bolum.locator("[data-yz-kanaat]").count()) === 1, "kanaat düz yazı");
  ok((await bolum.locator(".rozet").count()) === 0 || (await bolum.locator(".yz-gorus .rozet").count()) === 0, "yapay zekada renkli rozet yok");
  ok((await bolum.locator("button.ikon-dugme[data-yz-gorus-al]").count()) === 1, "yenileme simge düğmesi");
  ok((await bolum.locator(".yz-kriterler li").count()) >= 3, "ölçütler listede");
  await p.screenshot({ path: process.env.GORUNTU || "/tmp/yz-degerlendirme.png", fullPage: false });
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("#/oneriler/" + o.id);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `390px taşma yok (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
