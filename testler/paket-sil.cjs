// Plana eklenip onaylanan paket silinir (kullanıcı: muhabire bildirim gitsin): üretime girmemiş onaylı PKG'nin
// satırında "Sil", onay sorusu bildirimi söylüyor; paket gider, muhabire `paketIptal`. Üretimdeki pakette yok.
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
  const sorular = [];
  p.on("dialog", (d) => { sorular.push(d.message()); d.accept(); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/yarin");
  // Yarının planında kurgusal iki onaylı PKG: biri üretimde değil, öbürü üretim yolunda.
  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    const pb = plan.basliklar[0];
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const temel = { sehir: mu.sehir || "istanbul", aciklama: "", tur: "haber", bicim: "pkg", durum: "onaylandi", sahaGerekli: false, planId: plan.id, planBaslikId: pb.id, muhabirId: mu.id, notlar: [], olusturma: new Date().toISOString(), guncelleme: new Date().toISOString() };
    d.paketler.push({ ...temel, id: "p-sil-1", kod: "S1", baslik: "تقرير يُحذف" }, { ...temel, id: "p-sil-2", kod: "S2", baslik: "تقرير قيد الإنتاج", durum: "uretimde", uretim: { sablon: "x", yol: {}, parcalar: [] } });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
    return { plan: plan.id, mu: mu.id };
  }, K);
  await git("#/nextday/" + kur.plan);
  await p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  await p.waitForTimeout(300);
  const kart = (id) => p.locator(`.kayit:has(a[href="#/paketler/${id}"])`).first();
  ok((await kart("p-sil-1").locator('button[aria-label="Sil"]').count()) === 1, "onaylı PKG'de Sil");
  ok((await kart("p-sil-2").locator('button[aria-label="Sil"]').count()) === 0, "üretimdeki pakette Sil yok");
  await kart("p-sil-1").locator('button[aria-label="Sil"]').click();
  await p.waitForTimeout(400);
  ok(sorular.some((x) => x.includes("Muhabire bildirim")), "onay sorusu muhabire bildirimi söylüyor");
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  ok(!d.paketler.some((x) => x.id === "p-sil-1"), "paket silindi");
  ok(d.hareketler.some((h) => h.tip === "paketIptal" && h.planId === kur.plan && h.veri?.kime === kur.mu), "muhabire bildirim (paketIptal)");
  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
