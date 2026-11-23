// Weekly'de sürükle-bırak (kullanıcı: Next Day'deki gibi Weekly'de de): kalem başka kalemin yerine, başka
// güne (dosyası kalır), başka dosyaya, "Stok ve programlar"a; ana dosyalar arasında sıralama; öneri kartı
// güne ya da dosyaya bırakılınca "Gündeme ekle" o yerle açılır. Belgede ve plan ekranında.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  // Pencere uzun: hedefe kaydırmak sürüklemeyi farenin altındaki başka satırdan başlatıyor.
  const p = await b.newPage({ viewport: { width: 1400, height: 9000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1200); };
  const birak = async (kaynak, hedef, ust = true) => {
    await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
    await p.waitForTimeout(150);
    await kaynak.first().dragTo(hedef.first(), { sourcePosition: { x: 4, y: 4 }, ...(ust && { targetPosition: { x: 12, y: 4 } }) });
    await p.waitForTimeout(400);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/haftalik");

  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum === "hazirlik") ?? d.haftalik[0];
    h.durum = "hazirlik";
    const gun = (n) => new Date(new Date(h.baslangic + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
    const X = d.basliklar.find((x) => x.aktif).id;
    const kalem = (id, tarih, baslikId, metin) => ({ id, tarih, baslikId, metin, yer: "أنقرة", tur: "haber", bicimler: [], muhabirler: [], karar: "bekliyor" });
    h.kalemler = [kalem("hk-a", gun(0), X, "بند أول للاختبار"), kalem("hk-b", gun(0), X, "بند ثان للاختبار"), kalem("hk-c", gun(1), undefined, "بند ثالث للاختبار")];
    h.dosyalar = [X];
    h.anaKonular = [{ id: "ak-1", baslikId: X, baslik: "ملف أول", metin: "ملخص أول" }, { id: "ak-2", baslik: "ملف ثان", metin: "ملخص ثان" }];
    // Gelen önerilerde karar bekleyen, haftanın üçüncü gününe bir öneri.
    const o = d.oneriler.find((x) => x.id === "o-elle-telefon");
    Object.assign(o, { durum: "yeni", hedefTarih: gun(2), bitisTarih: undefined, hafta: undefined, haftaGunu: undefined, baslikId: undefined });
    for (const x of d.haftalik) x.kalemler = x.kalemler.filter((y) => y.oneriId !== o.id);
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, X, g: [0, 1, 2, 3].map(gun), oid: o.id };
  }, K);
  const hafta = (d) => d.haftalik.find((x) => x.id === kur.hid);
  const kalemi = (d, id) => hafta(d).kalemler.find((x) => x.id === id);
  const sira = (d) => hafta(d).kalemler.map((x) => x.id);
  const satir = (tur, id) => p.locator(`[data-hf-sur="${tur}"][data-hf-sur-id="${id}"]`);

  // 1. Belge
  await git(`#/haftalik/${kur.hid}/belge`);
  ok((await satir("kalem", "hk-a").count()) === 1, "belgede kalem sürüklenebilir");
  await birak(satir("kalem", "hk-b"), satir("kalem", "hk-a"), false);
  let d = await veri();
  ok(sira(d).indexOf("hk-b") < sira(d).indexOf("hk-a"), "belgede kalem sıralandı");
  await birak(satir("kalem", "hk-a"), p.locator(`.cikti-gun[data-hf-gun="${kur.g[1]}"] h4`));
  d = await veri();
  ok(kalemi(d, "hk-a").tarih === kur.g[1] && kalemi(d, "hk-a").baslikId === kur.X, "belgede kalem başka güne geçti, dosyası kaldı");
  await birak(satir("kalem", "hk-c"), p.locator(`[data-hf-gun="${kur.g[1]}"][data-hf-dosya="${kur.X}"] h3`));
  d = await veri();
  ok(kalemi(d, "hk-c").baslikId === kur.X, "belgede dosyasız kalem dosyaya girdi");
  await birak(satir("kalem", "hk-b"), p.locator('section[data-hf-gun=""] h2'));
  d = await veri();
  ok(!kalemi(d, "hk-b").tarih, "belgede kalem Stok ve programlar'a geçti");
  await birak(satir("ana", "ak-2"), satir("ana", "ak-1"), false);
  d = await veri();
  ok(hafta(d).anaKonular[0].id === "ak-2", "belgede ana dosyalar sıralandı");

  // 2. Plan ekranı
  await git(`#/haftalik/${kur.hid}`);
  await birak(satir("kalem", "hk-b"), p.locator(`section.gun-blogu[data-hf-gun="${kur.g[0]}"] h3`));
  d = await veri();
  ok(kalemi(d, "hk-b").tarih === kur.g[0], "plan ekranında kalem stoktan güne geçti");
  await birak(satir("kalem", "hk-c"), p.locator(`.dosya-grubu[data-hf-gun="${kur.g[0]}"][data-hf-dosya="${kur.X}"] .alan-etiket`));
  d = await veri();
  ok(kalemi(d, "hk-c").tarih === kur.g[0] && kalemi(d, "hk-c").baslikId === kur.X, "plan ekranında kalem başka günün dosyasına geçti");
  await birak(satir("ana", "ak-1"), satir("ana", "ak-2"), false);
  d = await veri();
  ok(hafta(d).anaKonular[0].id === "ak-1", "plan ekranında ana dosyalar sıralandı");

  // 3. Öneri kartı güne bırakılınca Gündeme ekle o günle açılır
  const kart = p.locator(`[data-oneri="${kur.oid}"]`);
  ok((await kart.count()) > 0, "öneri gelen önerilerde");
  await birak(kart, p.locator(`section.gun-blogu[data-hf-gun="${kur.g[3]}"] h3`));
  const form = p.locator(`dialog [data-gundeme-ekle-formu="${kur.oid}"]`);
  ok((await form.count()) === 1, "Gündeme ekle penceresi açıldı");
  ok((await form.locator("select").first().inputValue()) === kur.g[3], "gün bırakılan gün");
  await form.locator("button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(500);
  d = await veri();
  const yeni = hafta(d).kalemler.find((x) => x.oneriId === kur.oid);
  ok(!!yeni && yeni.tarih === kur.g[3], "öneri o güne gündeme girdi");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
