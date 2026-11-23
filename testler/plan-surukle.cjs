// Next Day'de plan hazırlarken sürükle-bırak (kullanıcı: PKG'deki gibi öbür işlemler de): gelişme sıralama,
// başka başlığa ve متابعات'e; başlığın muhabiri başka başlığa ve sıralama; canlı yayın başlığa ve "مباشر"a;
// PKG başka başlığa ve PKG'ler arasında sıralama. Belgede (Yeni/Sütunlu/belge sayfası) ve klasik ekranda.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 9000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1000); };
  // Pencere uzun: hedefe kaydırmak sürüklemeyi farenin altındaki başka satırdan başlatıyordu. Satırın kenarından tutulur (muhabirin ortasında yer alanı var).
  const birak = async (kaynak, hedef, kenar = true, ust = false) => {
    // Taşımadan sonra yeniden çizilen kart kapanabiliyor; satırların yeri kaymasın.
    await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
    await p.waitForTimeout(150);
    await kaynak.first().dragTo(hedef.first(), { ...(kenar ? { sourcePosition: { x: 4, y: 4 } } : {}), ...(ust ? { targetPosition: { x: 8, y: 4 } } : {}) }); await p.waitForTimeout(400); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/nd-yarin/belge");

  // Kurulum: iki başlık, ilkinde iki gelişme ve bir muhabir, bağsız bir canlı, ilk başlıkta bir PKG.
  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = d.planlar.find((x) => x.id === "nd-yarin");
    const [b1, b2] = plan.basliklar;
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif && !b1.muhabirler.some((m) => m.kisiId === x.id) && !b2.muhabirler.some((m) => m.kisiId === x.id));
    b1.muhabirler.push({ kisiId: mu.id, yer: "حلب" });
    const gel = (id, metin) => ({ id, planId: plan.id, planBaslikId: b1.id, metin, kaynakTuru: "ajans", tarih: plan.tarih });
    d.gelismeler.push(gel("g-s1", "تطور أول للاختبار"), gel("g-s2", "تطور ثان للاختبار"));
    d.canliYayinlar.push({ id: "c-s1", planId: plan.id, konu: "بث للاختبار", aciklama: "", tarih: plan.tarih, saatGmt: "10:00", yer: "انقرة", notlar: "" });
    const ornek = d.paketler.find((x) => x.planId === plan.id && x.durum !== "iptal");
    d.paketler.unshift({ ...ornek, id: "p-s1", kod: "S-1", baslik: "تقرير للاختبار", planBaslikId: b1.id, gelismeId: undefined, durum: "taslak" });
    d.paketler.unshift({ ...ornek, id: "p-s2", kod: "S-2", baslik: "تقرير ثان للاختبار", planBaslikId: b1.id, gelismeId: undefined, durum: "taslak" });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { b1: b1.id, b2: b2.id, mu: mu.id };
  }, K);
  await git("#/nextday/nd-yarin/belge");
  const sira = (d, pb) => d.gelismeler.filter((x) => x.planId === "nd-yarin" && x.planBaslikId === pb).map((x) => x.id);
  const baslik = (pb) => p.locator(`[data-nd-baslik="${pb}"] h3`);
  const satir = (tur, id) => p.locator(`[data-sur="${tur}"][data-sur-id="${id}"]`);

  // 1. Belge: gelişme sıralama, başka başlığa, متابعات'e
  let d = await veri();
  ok(sira(d, kur.b1).indexOf("g-s1") < sira(d, kur.b1).indexOf("g-s2"), "başta g-s1 önde");
  await birak(satir("gelisme", "g-s2"), satir("gelisme", "g-s1"));
  d = await veri();
  ok(sira(d, kur.b1).indexOf("g-s2") < sira(d, kur.b1).indexOf("g-s1"), "belgede gelişme sıralandı (g-s2 öne geçti)");
  await birak(satir("gelisme", "g-s1"), baslik(kur.b2));
  d = await veri();
  ok(d.gelismeler.find((x) => x.id === "g-s1").planBaslikId === kur.b2, "belgede gelişme başka başlığa taşındı");
  await birak(satir("gelisme", "g-s1"), p.locator("[data-sur-takip] h2"));
  d = await veri();
  ok(!d.gelismeler.find((x) => x.id === "g-s1").planBaslikId, "belgede gelişme متابعات'e taşındı");

  // 2. Belge: muhabir başka başlığa
  await birak(satir("muhabir", kur.mu), baslik(kur.b2));
  d = await veri();
  let plan = d.planlar.find((x) => x.id === "nd-yarin");
  const m2 = plan.basliklar.find((x) => x.id === kur.b2).muhabirler.find((x) => x.kisiId === kur.mu);
  ok(!!m2 && m2.yer === "حلب" && !plan.basliklar.find((x) => x.id === kur.b1).muhabirler.some((x) => x.kisiId === kur.mu), "belgede muhabir yeriyle başka başlığa geçti");

  // 3. Belge: canlı başlığa ve "مباشر"a geri
  await birak(satir("canli", "c-s1"), baslik(kur.b1));
  d = await veri();
  ok(d.canliYayinlar.find((x) => x.id === "c-s1").planBaslikId === kur.b1, "belgede canlı başlığa bağlandı");
  await birak(p.locator(`[data-nd-baslik="${kur.b1}"] [data-sur="canli"][data-sur-id="c-s1"]`), p.locator("[data-sur-canli] h2"));
  d = await veri();
  ok(!d.canliYayinlar.find((x) => x.id === "c-s1").planBaslikId, "belgede canlı مباشر'a döndü");

  // 4. Belge: PKG sıralama ve başka başlığa
  const pkSira = (d) => d.paketler.filter((x) => x.planBaslikId === kur.b1 && ["p-s1", "p-s2"].includes(x.id)).map((x) => x.id);
  ok(pkSira(d)[0] === "p-s2", "başta p-s2 önde");
  await birak(p.locator('[data-pkg-surukle="p-s2"]'), p.locator('[data-pkg-surukle="p-s1"]'));
  d = await veri();
  ok(pkSira(d)[0] === "p-s1", "belgede PKG sıralandı");
  await birak(p.locator('[data-pkg-surukle="p-s1"]'), baslik(kur.b2));
  d = await veri();
  ok(d.paketler.find((x) => x.id === "p-s1").planBaslikId === kur.b2, "belgede PKG başka başlığa taşındı");

  // 5. Klasik ekran: gelişme, muhabir, canlı başka başlığa
  await git("#/nextday/nd-yarin");
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  await p.waitForTimeout(300);
  const kart = (pb) => p.locator(`details[data-plan-baslik="${pb}"] > summary`);
  await birak(satir("gelisme", "g-s2"), kart(kur.b2));
  d = await veri();
  ok(d.gelismeler.find((x) => x.id === "g-s2").planBaslikId === kur.b2, "klasikte gelişme başka başlığa taşındı");
  await birak(satir("gelisme", "g-s2"), p.locator("[data-sur-takip]"), true, true);
  d = await veri();
  ok(!d.gelismeler.find((x) => x.id === "g-s2").planBaslikId, "klasikte gelişme متابعات'e taşındı");
  await birak(satir("muhabir", kur.mu), kart(kur.b1));
  d = await veri();
  plan = d.planlar.find((x) => x.id === "nd-yarin");
  ok(plan.basliklar.find((x) => x.id === kur.b1).muhabirler.some((x) => x.kisiId === kur.mu), "klasikte muhabir başka başlığa geçti");
  await birak(satir("canli", "c-s1"), kart(kur.b2));
  d = await veri();
  ok(d.canliYayinlar.find((x) => x.id === "c-s1").planBaslikId === kur.b2, "klasikte canlı başlığa bağlandı");
  await birak(p.locator('[data-pkg-surukle="p-s1"]'), kart(kur.b1));
  d = await veri();
  ok(d.paketler.find((x) => x.id === "p-s1").planBaslikId === kur.b1, "klasikte PKG başka başlığa taşındı");

  // 6. Yazı alanından başlayan sürükleme satırı taşımaz (muhabirin yer alanı)
  const once = JSON.stringify((await veri()).planlar.find((x) => x.id === "nd-yarin").basliklar.map((x) => x.muhabirler.map((m) => m.kisiId)));
  await birak(p.locator(`[data-sur="muhabir"][data-sur-id="${kur.mu}"] input`), kart(kur.b2), false);
  const sonra = JSON.stringify((await veri()).planlar.find((x) => x.id === "nd-yarin").basliklar.map((x) => x.muhabirler.map((m) => m.kisiId)));
  ok(once === sonra, "yer alanından sürükleme muhabiri taşımadı");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
