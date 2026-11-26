// Weekly'de bir dosyanın altına istediği kadar PKG (kullanıcı: gündemde başlığa yalnız bir paket ekleyebiliyordu).
// Her kalem tek paket taşıyor; "Bu dosyaya PKG ekle" aynı gün ve dosyada Strap'li, metinsiz kalem açar, her biri ayrı paket olur.
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
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-tasarim", "eski"); });
  await git("#/haftalik");

  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    plan.durum = "taslak";
    const gun = (s, n) => new Date(Date.parse(s) + n * 864e5).toISOString().slice(0, 10);
    const h = d.haftalik.find((x) => x.baslangic <= plan.tarih && gun(x.baslangic, 6) >= plan.tarih) || d.haftalik[0];
    h.durum = "toplantida";
    h.kalemler = [];
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const baslikId = (d.basliklar.find((x) => x.aktif !== false) || d.basliklar[0]).id;
    h.kalemler.push({ id: "kc-1", karar: "bekliyor", tarih: plan.tarih, tur: "haber", yer: "", metin: "تطور الملف", bicimler: ["pkg"], muhabirler: [mu.id], paketBasligi: "التقرير الأول", baslikId });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, plan: plan.id, tarih: plan.tarih, baslikId };
  }, K);

  // Plan ekranında dosyanın altında "Bu dosyaya PKG ekle": iki paket daha (planlamacı haftalığı düzenler)
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  await git("#/haftalik/" + ids.hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  for (const strap of ["التقرير الثاني", "التقرير الثالث"]) {
    const grup = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='kc-1']") });
    await grup.locator("[data-dosya-pkg-ekle] button").click();
    const form = grup.locator(".form-kutu");
    ok(await form.locator("button", { hasText: "Kaydet" }).isDisabled().catch(() => true), "Strap boşken kaydedilmez");
    await form.locator("[data-kalem-strap]").fill(strap);
    await form.locator("button", { hasText: "Kaydet" }).click();
    await p.waitForTimeout(400);
  }
  let h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  const ekler = h.kalemler.filter((k) => k.id !== "kc-1");
  ok(ekler.length === 2, "dosyaya iki paket daha eklendi");
  ok(ekler.every((k) => k.tarih === ids.tarih && k.baslikId === ids.baslikId && !k.metin && k.bicimler.includes("pkg")), "aynı gün ve dosya, metinsiz PKG kalemi");
  ok(h.kalemler.map((k) => k.paketBasligi).join("|") === "التقرير الأول|التقرير الثاني|التقرير الثالث", "sıra: eklenenler dosyanın sonunda");
  const grupMetni = await p.locator(".dosya-grubu", { has: p.locator("[data-kalem='kc-1']") }).innerText();
  ok(["التقرير الأول", "التقرير الثاني", "التقرير الثالث"].every((s) => grupMetni.includes(s)), "plan ekranında üç paket aynı dosyada");

  // Dosya başlığının simge satırındaki 📦 da aynı formu açar (alttaki düğme uzun dosyada gözden kaçıyordu)
  {
    const grup = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='kc-1']") });
    await grup.locator("[data-dosya-pkg-ust] button").click();
    const form = grup.locator(".form-kutu");
    await form.locator("[data-kalem-strap]").fill("التقرير الرابع");
    await form.locator("button", { hasText: "Kaydet" }).click();
    await p.waitForTimeout(400);
    const hh = (await oku()).haftalik.find((x) => x.id === ids.hid);
    ok(hh.kalemler.length === 4 && hh.kalemler[3].paketBasligi === "التقرير الرابع" && hh.kalemler[3].baslikId === ids.baslikId, "başlıktaki simgeyle dördüncü paket aynı dosyada");
  }

  // Çıktıda üç PKG satırı, ek paketlerde boş metin satırı yok
  await git(`#/haftalik/${ids.hid}/cikti`);
  const pkgler = await p.locator("article.cikti [data-kalem-pkg]").allInnerTexts();
  ok(pkgler.filter((x) => x.includes("التقرير")).length === 4, "çıktıda dört PKG satırı");
  const satirlar = (await p.locator("article.cikti").first().innerText()).split("\n").map((s) => s.trim());
  ok(!satirlar.some((s) => s === "/" || s.endsWith(" /")), "metinsiz kalem boş satır bırakmadı");

  // Belgede dosya şeridinde aynı düğme, pencerede Strap
  await git(`#/haftalik/${ids.hid}/belge`);
  const dugme = p.locator("[data-dosya-pkg-ekle] button").first();
  ok((await dugme.count()) === 1, "belgede dosyanın şeridinde PKG ekle");
  await dugme.evaluate((el) => el.click());
  await p.waitForTimeout(300);
  const pencere = p.locator("dialog[open]");
  await pencere.locator("[data-kalem-strap]").fill("التقرير الخامس");
  await pencere.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  ok(h.kalemler.filter((k) => k.baslikId === ids.baslikId && k.tarih === ids.tarih).length === 5, "belgeden beşinci paket eklendi");

  // Kesinleşince her biri ayrı paket olarak aynı başlığın altına; metinsiz kalem boş gelişme açmaz
  await git("#/haftalik/" + ids.hid);
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.haftalik.forEach((h) => h.kalemler.forEach((x) => { if (x.baslikId) { x.karar = "kabul"; if (!x.muhabirler.length) x.muhabirTbc = true; } }));
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    localStorage.setItem("trt-planlama-oturum", "yo3");
  }, K);
  await git("#/haftalik/" + ids.hid);
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(800);
  const d = await oku();
  const kalemIdleri = d.haftalik.find((x) => x.id === ids.hid).kalemler.map((k) => k.id);
  const paketler = d.paketler.filter((x) => kalemIdleri.includes(x.haftalikKalemId) && x.planId === ids.plan);
  ok(paketler.length === 5, "beş ayrı paket Next Day'e geçti: " + paketler.length + " " + d.haftalik.find((x) => x.id === ids.hid).durum + " " + JSON.stringify(d.haftalik.find((x) => x.id === ids.hid).kalemler.map((k) => [k.karar, k.muhabirler.length, k.aktarim])));
  ok(new Set(paketler.map((x) => x.planBaslikId)).size === 1, "hepsi aynı başlığın altında");
  const gelismeler = d.gelismeler.filter((g) => kalemIdleri.includes(g.haftalikKalemId));
  ok(gelismeler.length === 1 && gelismeler[0].metin === "تطور الملف", "yalnız metinli kalem gelişme açtı");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/haftalik/" + ids.hid);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
