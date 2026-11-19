// Weekly toplantı kararları (kullanıcı): "Paketsiz takip" Next Day'e yalnız gelişme olarak geçer, paket doğmaz;
// "Next Day'de karar ver" paketi Next Day'e PKG PROPOSAL (değerlendirmede, görevsiz) olarak geçirir; "Plandan kaldır"
// (eski "Ret") kesinleşince kalemi plandan çıkarır.
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
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await git("#/haftalik");

  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    plan.durum = "taslak";
    const gun = (s, n) => new Date(Date.parse(s) + n * 864e5).toISOString().slice(0, 10);
    const h = d.haftalik.find((x) => x.baslangic <= plan.tarih && gun(x.baslangic, 6) >= plan.tarih) || d.haftalik[0];
    h.durum = "toplantida";
    h.kalemler.forEach((x) => { x.karar = "kabul"; delete x.onInceleme; x.tarih = undefined; x.tur = "feature"; });
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    // Dosyalı kalem: Next Day'de başlığın altında PKG / PKG PROPOSAL alt başlığıyla basılıyor.
    const baslikId = (d.basliklar.find((x) => x.aktif !== false) || d.basliklar[0]).id;
    const yeni = (id, karar, strap) => ({ id, karar, tarih: plan.tarih, tur: "haber", yer: "", metin: "تطور " + id, bicimler: ["pkg"], muhabirler: [mu.id], paketBasligi: strap, baslikId });
    h.kalemler.push(yeni("kl-bilgi", "bilgi", "تقرير لا يُطلب"), yeni("kl-nd", "nextday", "تقرير يُحسم غداً"), yeni("kl-kaldir", "ret", "تقرير يُحذف"));
    localStorage.setItem(k, JSON.stringify(d));
    return { hid: h.id, plan: plan.id };
  }, K);

  // Düğmelerin yeni adları
  await git("#/haftalik/" + ids.hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const metin = await p.locator("main").innerText();
  ok(metin.includes("Paketsiz takip"), "Bilgi'nin yeni adı Paketsiz takip");
  ok(metin.includes("Next Day'de karar ver"), "Yeni karar: Next Day'de karar ver");
  ok(metin.includes("Plandan kaldır"), "Ret'in yeni adı Plandan kaldır");
  ok(!metin.includes("(لا نتابع)"), "paketsiz takipte 'لا نتابع' notu yok");

  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(800);
  const d = await oku();
  const h = d.haftalik.find((x) => x.id === ids.hid);
  ok(h.durum === "kesinlesti", "hafta kesinleşti");

  // Paketsiz takip: gelişme planda, paket yok
  ok(d.gelismeler.some((g) => g.haftalikKalemId === "kl-bilgi" && g.planId === ids.plan), "paketsiz takip Next Day'e gelişme olarak geçti");
  ok(!d.paketler.some((x) => x.haftalikKalemId === "kl-bilgi"), "paketsiz takipte paket doğmadı");

  // Next Day'de karar ver: PKG PROPOSAL, görevsiz
  const nd = d.paketler.find((x) => x.haftalikKalemId === "kl-nd");
  ok(!!nd && nd.planId === ids.plan && nd.durum === "degerlendiriliyor", "Next Day'e değerlendirmedeki paket olarak geçti");
  ok(nd && !nd.kunye?.gorevlendiren, "görevlendiren yazılmadı (görev verilmedi)");
  ok(!d.hareketler.some((x) => x.paketId === nd?.id && x.tip === "paketOnaylandi"), "muhabire görev bildirimi gitmedi");

  // Plandan kaldır: kalem çıktı, Next Day'e bir şey gitmedi
  ok(!h.kalemler.some((x) => x.id === "kl-kaldir"), "kaldırılan kalem plandan çıktı");
  ok(!d.gelismeler.some((g) => g.haftalikKalemId === "kl-kaldir") && !d.paketler.some((x) => x.haftalikKalemId === "kl-kaldir"), "kaldırılanın gelişmesi ve paketi yok");

  // Next Day çıktısında PKG PROPOSAL altında
  await git(`#/nextday/${ids.plan}/cikti`);
  const c = await p.locator("article.cikti").first().innerText();
  // İlk geçiş "التقارير المتوقعة" listesinde; başlığın altındaki son geçiş.
  const i = c.lastIndexOf("تقرير يُحسم غداً");
  ok(i > 0 && c.lastIndexOf("PKG PROPOSAL", i) > 0, "Next Day çıktısında PKG PROPOSAL altında");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
