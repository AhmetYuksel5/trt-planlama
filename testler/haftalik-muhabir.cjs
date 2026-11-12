// Weekly kaleminde muhabirler Next Day'deki gibi (kullanıcı: ikinci muhabir satırın yanına yazılıyordu): pakette tek
// muhabir "YER / strap / ad"; birden çoksa paket satırı "YER / strap", altında unvan (المراسلون) ve her muhabir "YER / ad".
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1000); };
  await git("#/oneriler");
  // Bir paketli kalemi muhabir sayısıyla kur.
  const kur = (n) => p.evaluate((n) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    const ms = d.kisiler.filter((k) => k.birim === "muhabir").slice(0, n).map((k) => k.id);
    const h = d.haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
    const k = h.kalemler.find((x) => x.id === "hm-test") || h.kalemler[0];
    k.id = "hm-test"; k.paketBasligi = "زيارة اختبارية"; k.bicimler = ["pkg"]; k.muhabirler = ms; k.karar = "kabul"; k.yer = "";
    localStorage.setItem("trt-planlama-v24", JSON.stringify(d)); localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
    return { hid: h.id, adlar: ms.map((id) => d.kisiler.find((k) => k.id === id).ad.ar) };
  }, n);

  const { hid, adlar } = await kur(2);
  for (const yol of [`#/haftalik/${hid}/cikti`, `#/haftalik/${hid}/belge`]) {
    await git(yol);
    const kalem = p.locator(".cikti-kalem", { has: p.locator("[data-kalem-pkg]", { hasText: "زيارة اختبارية" }) }).first();
    const pkg = await kalem.locator("[data-kalem-pkg]").innerText();
    ok(!adlar.some((a) => pkg.includes(a)), `${yol}: paket satırında muhabir adı yok (iki muhabir)`);
    ok((await kalem.locator("[data-kalem-muhabir-unvani]").innerText()).trim() === "المراسلون", `${yol}: unvan المراسلون`);
    const metin = await kalem.innerText();
    ok(adlar.every((a) => metin.split("\n").some((s) => s.includes(" / " + a) || s.endsWith(a))), `${yol}: her muhabir kendi satırında "YER / ad"`);
  }
  await git(`#/haftalik/${hid}`);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  const ekran = await p.locator("[data-kalem-pkg]", { hasText: "زيارة اختبارية" }).first().innerText();
  ok(ekran.includes("المراسلون") && ekran.split("\n").filter((s) => adlar.some((a) => s.includes(a))).length === 2, "plan ekranında da unvan ve iki ayrı satır");

  // Tek muhabirde Next Day'in paket satırı: "YER / strap / ad", unvan satırı yok
  const tek = await kur(1);
  await git(`#/haftalik/${hid}/cikti`);
  const kalem1 = p.locator(".cikti-kalem", { has: p.locator("[data-kalem-pkg]", { hasText: "زيارة اختبارية" }) }).first();
  ok((await kalem1.locator("[data-kalem-pkg]").innerText()).includes(tek.adlar[0]) && (await kalem1.locator("[data-kalem-muhabir-unvani]").count()) === 0, "tek muhabirde ad paket satırında, unvan yok");

  await kur(2);
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const yol of [`#/haftalik/${hid}`, `#/haftalik/${hid}/cikti`]) {
      await git(yol);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${yol}): ${t}`);
    }
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
