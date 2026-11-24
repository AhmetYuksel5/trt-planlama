// Özel yayının eski düzeninden geçiş: görevi verilmiş, süren eski paket açılışta yeni içerik oluyor (masası
// "Özel yayın", görevi veren, yayın günü), günün planına girmeye hazır; görevi verilmemiş olan eski akışta
// kalıyor (stok ekibinin listesinde). Çıktıda içerikler yayın günüyle.
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/ozel");

  // Kurgusal eski düzen: görevi verilmiş dış paket, hazırlayanı belli in-house paket, görevi bekleyen paket.
  await p.evaluate(([k, bas, bit, onceki]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const ic = d.kisiler.find((x) => x.birim === "planlama" && !x.pasif);
    d.ozel.push({ id: "oz-g", ad: "تغطية الانتقال", tarih: bas, bitis: bit, hazirlik: [], iz: [],
      paketOnerileri: [{ id: "po-g", baslik: "تقرير مقترح قديم", aciklama: "", kaynak: "dis", muhabirId: mu.id, sonTarih: bit, tur: "haber", bicim: "pkg", durum: "onaylandi", paketId: "p-g1", iz: [] }] });
    const temel = { sehir: "istanbul", aciklama: "", tur: "haber", bicim: "pkg", sahaGerekli: false, ozelId: "oz-g", ozelAd: "تغطية الانتقال", notlar: [], olusturma: "2026-01-01T09:00:00Z", guncelleme: "2026-01-01T09:00:00Z" };
    d.paketler.push(
      { ...temel, id: "p-g1", kod: "G1", baslik: "تقرير خارجي قديم", durum: "onaylandi", muhabirId: mu.id, ozelKaynak: "dis", sonTarih: onceki, stok: true },
      { ...temel, id: "p-g2", kod: "G2", baslik: "تقرير داخلي قديم", durum: "onaylandi", hazirlayanId: ic.id, ozelKaynak: "inhouse", sonTarih: bit },
      { ...temel, id: "p-g3", kod: "G3", baslik: "تقرير ينتظر التكليف", durum: "onaylandi", muhabirId: mu.id, ozelKaynak: "dis", ozelGorevBekliyor: true, sonTarih: bit },
    );
    d.hareketler.unshift({ id: "h-g1", zaman: "2026-01-02T10:00:00Z", kisiId: "pl1", tip: "ozelPaketAtandi", paketId: "p-g1", ozelId: "oz-g" });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  }, [K, yerel(1), yerel(3), yerel(-2)]);
  await git("#/ozel/oz-g");
  const d = await durum();
  const pk = (id) => d.paketler.find((x) => x.id === id);
  const g1 = pk("p-g1"), g2 = pk("p-g2"), g3 = pk("p-g3");
  ok(g1.tur === "ozel" && g1.gorev?.veren === "pl1" && !g1.stok, "görevi verilmiş eski paket içerik oldu (masa, görevi veren hareketten)");
  ok(g1.yayinGunu === yerel(1) && g1.sonTarih <= g1.yayinGunu, "yayın günü yayının aralığına çekildi, teslim ondan sonra değil");
  ok(g2.tur === "ozel" && !!g2.gorev && g2.muhabirId === g2.hazirlayanId && g2.yayinGunu === yerel(3), "in-house paketin işi hazırlayana");
  ok(!g3.gorev && g3.tur === "haber", "görevi bekleyen eski akışta kaldı");
  const plan = d.planlar.find((x) => x.tarih === yerel(1));
  ok(!plan || g1.planId === plan.id, "içerik yayın gününün planına bağlandı");

  // Sayfa: çevrilen içerik İçerik listesinde, önerisi eski listede ikinci kez yok.
  await p.click('[data-ozel-sekme="icerik"]');
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  ok((await p.locator('[data-ozel-icerik="p-g1"]').count()) === 1, "çevrilen paket içerikler arasında");
  ok((await p.getByText("تقرير مقترح قديم").count()) === 0, "önerisi eski listede ikinci kez yok");

  // Çıktı: içerik yayın günüyle.
  await git("#/ozel/oz-g/cikti");
  const metin = await p.locator("[data-ozel-belge]").innerText();
  ok(metin.includes("تقرير خارجي قديم") && metin.includes("تقرير داخلي قديم"), "çıktıda içerikler");

  // İkinci açılışta değişiklik yok.
  await git("#/ozel/oz-g");
  const d2 = await durum();
  ok(JSON.stringify(d2.paketler.find((x) => x.id === "p-g1")) === JSON.stringify(d.paketler.find((x) => x.id === "p-g1")), "ikinci açılışta aynı");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
