// Weekly'nin gün gündeminde başlık Next Day'in başlığı gibi (kullanıcı: başlık tek paketin işi gibi görünüyordu):
// önce gelişmeler, sonra başlığın muhabirleri (المراسل/المراسلون), en sonda paketler "PKG PROPOSAL" / "PKG" altında.
// Paket yalnız Strap'li kalemden doğar; muhabirli gelişme Next Day'e gelişme olarak geçer.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
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
    const ms = d.kisiler.filter((x) => x.birim === "muhabir" && !x.pasif);
    const baslikId = (d.basliklar.find((x) => x.aktif !== false) || d.basliklar[0]).id;
    const ortak = { tarih: plan.tarih, tur: "haber", yer: "", bicimler: ["pkg"], baslikId, karar: "bekliyor" };
    h.kalemler = [
      { ...ortak, id: "bd-pkg", metin: "", paketBasligi: "تقرير المرحلة الأولى", muhabirler: [ms[0].id] },
      { ...ortak, id: "bd-gel", metin: "تطور الملف الأول", muhabirler: [ms[1].id] },
      { ...ortak, id: "bd-ikisi", metin: "تطور الملف الثاني", paketBasligi: "تقرير المرحلة الثانية", muhabirler: [ms[2].id], karar: "kabul" },
    ];
    h.dosyaBilgileri = [{ tarih: plan.tarih, baslikId, muhabirler: [{ kisiId: ms[3].id }] }];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, plan: plan.id, baslikId, dosyaMuhabir: ms[3].ad.ar, gelMuhabir: ms[1].ad.ar };
  }, K);

  for (const yol of [`#/haftalik/${ids.hid}/cikti`, `#/haftalik/${ids.hid}/belge`]) {
    await git(yol);
    const bolum = p.locator(".cikti-baslik", { has: p.locator("[data-kalem-pkg]", { hasText: "تقرير المرحلة الأولى" }) }).first();
    const metin = await bolum.innerText();
    const yer = (s) => metin.indexOf(s);
    ok(yer("تطور الملف الأول") >= 0 && yer("تطور الملف الثاني") >= 0, `${yol}: iki gelişme başlığın altında`);
    ok(yer("تطور الملف الثاني") < yer(ids.dosyaMuhabir), `${yol}: gelişmeler başlığın muhabirlerinden önce`);
    ok(yer(ids.dosyaMuhabir) < yer("PKG PROPOSAL") && yer(ids.dosyaMuhabir) < yer("تقرير المرحلة الثانية"), `${yol}: muhabirler paketlerden önce`);
    ok((await bolum.locator("[data-pkg-grubu]").allInnerTexts()).map((x) => x.trim()).join("|") === "PKG|PKG PROPOSAL", `${yol}: PKG ve PKG PROPOSAL birer kez, grup başlığı`);
    ok(yer("تقرير المرحلة الثانية") < yer("PKG PROPOSAL") && yer("تقرير المرحلة الأولى") > yer("PKG PROPOSAL"), `${yol}: her paket kendi grubunda`);
    ok(metin.split("تطور الملف الثاني").length === 2 && metin.split("تقرير المرحلة الثانية").length === 2, `${yol}: metni ve paketi olan kalem ikisi de bir kez`);
  }

  // Toplantı görünümü: paketli kalemin seçimi tek (paket satırında)
  await git(`#/haftalik/${ids.hid}/toplanti`);
  ok((await p.locator('[data-toplanti-kalem="bd-ikisi"]').count()) === 1, "toplantıda metinli paket tek seçilebilir satır");

  // Plan ekranı: gelişme formu Strap sormaz; paket kartları gelişmelerden sonra
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  await git(`#/haftalik/${ids.hid}`);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const grup = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='bd-gel']") });
  const sira = await grup.evaluate((g) => [...g.querySelectorAll("[data-kalem], [data-pkg-grubu], [data-dosya-bilgisi]")].map((x) => x.getAttribute("data-kalem") || x.getAttribute("data-pkg-grubu") || "muhabir"));
  ok(sira.join(",") === "bd-gel,muhabir,PKG,bd-ikisi,PKG PROPOSAL,bd-pkg", "plan ekranında gelişme, muhabirler, PKG, PKG PROPOSAL: " + sira.join(","));
  await grup.locator("[data-dosya-gelisme-ekle] button").click();
  const form = grup.locator(".form-kutu");
  ok((await form.locator("[data-kalem-strap]").count()) === 0, "gelişme formunda Strap yok");
  await form.locator("textarea").first().fill("تطور الملف الثالث");
  await form.locator("button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  let h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  const yeni = h.kalemler.find((k) => k.metin === "تطور الملف الثالث");
  ok(yeni && yeni.baslikId === ids.baslikId && !yeni.paketBasligi, "gelişme aynı dosyaya Strap'siz eklendi");

  // Kesinleşince: Strap'li kalemler paket, muhabirli gelişme paket değil, muhabiri başlıkta
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.haftalik.forEach((h) => h.kalemler.forEach((x) => { if (x.id.startsWith("bd-") || x.metin === "تطور الملف الثالث") x.karar = "kabul"; }));
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    localStorage.setItem("trt-planlama-oturum", "yo3");
  }, K);
  await git("#/haftalik/" + ids.hid);
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(800);
  const d = await oku();
  const paketler = d.paketler.filter((x) => ["bd-pkg", "bd-gel", "bd-ikisi"].includes(x.haftalikKalemId) && x.planId === ids.plan);
  ok(paketler.map((x) => x.haftalikKalemId).sort().join(",") === "bd-ikisi,bd-pkg", "yalnız Strap'li kalemler paket oldu: " + paketler.map((x) => x.haftalikKalemId).join(","));
  const gel = d.gelismeler.find((g) => g.haftalikKalemId === "bd-gel");
  ok(!!gel, "muhabirli gelişme Next Day'e gelişme olarak geçti");
  const pb = d.planlar.find((x) => x.id === ids.plan).basliklar.find((x) => x.id === gel?.planBaslikId);
  const gelMu = d.kisiler.find((x) => x.ad.ar === ids.gelMuhabir).id;
  ok(!!pb && pb.muhabirler.some((m) => m.kisiId === gelMu), "gelişmenin muhabiri başlığın muhabiri");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/haftalik/${ids.hid}/belge`);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(tasma <= 0, `390 piksel ${dil}: taşma yok (${tasma})`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
