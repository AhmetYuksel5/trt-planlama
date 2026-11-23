// Stok haberler / Programlar (kullanıcı: Programlar'ın tasarımı, tıklanınca açılan kutucuklar; orada çalışan
// gelecek haftanın tekliflerini topluyor, daha önce planladığının üretimini izliyor, stoktaki paketleri
// planlara ekliyor; listeler tarihe ya da muhabire göre). Kurallar src/stokSayfasi.ts, ekran StokSayfasi.tsx.
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  // pl6: Planlama'nın feature/stok ekibi (kurgusal).
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl6"); });
  await git("#/stok");

  // 1. Kutucuklar: beş bölüm, varsayılan Üretim; kutucuk adres değiştirir, geri tuşu bölümler arasında gezer
  ok((await p.locator("[data-stok-kutu]").count()) === 5, "beş kutucuk");
  ok((await p.locator('[data-stok-kutu="uretim"][aria-selected="true"]').count()) === 1, "varsayılan Üretim kutusu");
  await p.locator('[data-stok-kutu="programlar"]').click(); await p.waitForTimeout(500);
  await p.locator('[data-stok-kutu="arsiv"]').click(); await p.waitForTimeout(500);
  ok((await p.evaluate(() => location.hash)) === "#/stok/arsiv" && (await p.locator('[data-stok-kutu="arsiv"][aria-selected="true"]').count()) === 1, "kutucuk adresi açıyor");
  await p.goBack(); await p.waitForTimeout(500);
  ok((await p.evaluate(() => location.hash)) === "#/stok/programlar", "geri tuşu önceki kutucuğa döndü");

  // 2. Teklifler: gelecek haftanın stok ve program teklifleri
  await git("#/stok/teklifler");
  const hafta = await p.locator("[data-stok-hafta]").getAttribute("data-stok-hafta");
  ok(!!hafta, "tekliflerin haftası: " + hafta);
  const gun = (n) => { const t = new Date(hafta + "T12:00:00"); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  await p.evaluate(({ k, gun2, gun3 }) => {
    const d = JSON.parse(localStorage.getItem(k));
    // Açık alanlarla, PKG türünde: "yeni" durumdaki takip türü öneriyi sistemin açılış işi siliyor.
    const yeni = (id, tur, tarih, baslik) => ({
      id, muhabirId: "mu2", ulke: "turkiye", haberBasligi: baslik, gelisme: baslik, paketBasligi: baslik, tur, bicim: "pkg",
      sahaGerekli: false, zaman: new Date().toISOString(), kanal: "sistem", durum: "yeni", hedefTarih: tarih,
    });
    d.oneriler.push(yeni("o-st-feature", "feature", gun2, "عرض مخزن اختباري"), yeni("o-st-haber", "haber", gun3, "خبر يومي اختباري"));
    localStorage.setItem(k, JSON.stringify(d));
  }, { k: K, gun2: gun(2), gun3: gun(3) });
  await git("#/stok/teklifler");
  ok((await p.locator('[data-stok-kapsam="stok"][aria-selected="true"]').count()) === 1, "varsayılan kapsam Stok ve programlar");
  ok((await p.locator('[data-oneri="o-st-feature"]').count()) === 1, "feature teklifi listede");
  ok((await p.locator('[data-oneri="o-st-haber"]').count()) === 0, "günlü haber teklifi stok kapsamında değil");
  await p.locator('[data-stok-kapsam="hepsi"]').click(); await p.waitForTimeout(300);
  ok((await p.locator('[data-oneri="o-st-haber"]').count()) === 1, "Bütün teklifler'de günlü haber de var");
  await p.locator('[data-stok-kapsam="stok"]').click(); await p.waitForTimeout(300);
  // Hafta açık değilse aç (planın "Gündeme ekle"si haftayı istiyor).
  if (await p.locator("[data-stok-hafta-ac]").count()) { await p.locator("[data-stok-hafta-ac]").first().click(); await p.waitForTimeout(500); }
  ok((await p.locator("[data-stok-weekly]").count()) === 1, "haftanın Weekly'si açık, bağlantısı var");
  await p.locator('[data-oneri="o-st-feature"] [data-oneri-ekle]').click(); await p.waitForTimeout(500);
  const form = p.locator('[data-gundeme-ekle-formu="o-st-feature"]');
  ok((await form.count()) === 1, "Gündeme ekle formu açıldı");
  ok((await form.locator("select").first().inputValue()) === "", "gün boş: Stok ve programlar'a düşecek");
  await form.locator(".form-alt .dugme:not(.dugme-ikincil)").click(); await p.waitForTimeout(700);
  let d = await durum();
  const plan = d.haftalik.find((h) => h.baslangic === hafta);
  const kalem = plan?.kalemler.find((x) => x.oneriId === "o-st-feature");
  ok(!!kalem && !kalem.tarih && kalem.karar === "bekliyor", "teklif Weekly'nin Stok ve programlar'ına girdi");
  ok((await p.locator(`[data-stok-kalem="${kalem?.id}"]`).count()) === 1, "Weekly gündeminde listesinde");
  ok((await p.locator('[data-oneri="o-st-feature"]').count()) === 0, "gündeme giren teklif gelenlerden düştü");

  // Günlü haber teklifinde gün kendi günüyle gelir (yanlışlıkla Stok ve programlar'a düşmesin).
  await p.locator('[data-stok-kapsam="hepsi"]').click(); await p.waitForTimeout(200);
  await p.locator('[data-oneri="o-st-haber"] [data-oneri-ekle]').click(); await p.waitForTimeout(500);
  ok((await p.locator('[data-gundeme-ekle-formu="o-st-haber"] select').first().inputValue()) === gun(3), "günlü haberde gün kendi günü");
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);

  // 3. Sıra: muhabire göre gruplar; seçim kutucuklar arasında kalıyor
  await p.locator("[data-stok-sira]").selectOption("muhabir"); await p.waitForTimeout(300);
  ok((await p.locator('[data-oneri-grup="mu2"] [data-oneri="o-st-haber"]').count()) === 1, "muhabire göre: teklif muhabirinin grubunda");
  await p.locator('[data-stok-kutu="stokta"]').click(); await p.waitForTimeout(500);
  ok((await p.locator("[data-stok-sira]").inputValue()) === "muhabir", "sıra seçimi kutucuk değişince kaldı");
  ok((await p.locator('[data-stok-liste="muhabir"]').count()) === 1, "Stokta da muhabire göre");
  await p.locator("[data-stok-sira]").selectOption("tarih"); await p.waitForTimeout(300);

  // 4. Üretim: üretime alınacaklar ve "Üretime al"; kutucuğun sayısı menüdekiyle aynı kural
  await git("#/stok/uretim");
  d = await durum();
  const alinacak = d.paketler.filter((x) => (x.stok || x.ozelId) && x.durum === "onaylandi" && !x.ozelId && !x.gorev);
  ok(alinacak.length > 0, "örnek veride üretime alınacak stok paketi var: " + alinacak.length);
  await p.locator('[data-stok-uretim-alan="alinacak"]').click(); await p.waitForTimeout(300);
  ok((await p.locator(`[data-stok-paket="${alinacak[0].id}"] [data-uretime-al]`).count()) === 1, "stok ekibinde kartta Üretime al");
  const say = await p.locator('[data-stok-kutu="uretim"] .prg-say').innerText().catch(() => "0");
  ok(Number(say) === (await p.locator("[data-uretime-al]").count()), "Üretim kutusunun sayısı Üretime al düğmeleri kadar: " + say);
  await p.locator('[data-stok-uretim-alan="uretimde"]').click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-stok-paket]").count()) > 0, "Üretimde paketleri");

  // 5. Stokta: plana alınmamış paketi açık Next Day'e ekle, sonra çıkar
  await git("#/stok/stokta");
  await p.locator('[data-stok-stokta-alan="bekleyen"]').click(); await p.waitForTimeout(300);
  const paketId = await p.locator("[data-stok-plana-ekle]").first().getAttribute("data-stok-plana-ekle");
  ok(!!paketId, "plana alınmamış stok paketi");
  await p.locator(`[data-stok-plana-ekle="${paketId}"]`).click(); await p.waitForTimeout(400);
  const planId = await p.locator("dialog [data-stok-plan]").first().getAttribute("data-stok-plan");
  ok(!!planId, "pencerede açık Next Day planları");
  await p.locator(`dialog [data-stok-plan="${planId}"]`).click(); await p.waitForTimeout(600);
  d = await durum();
  ok(d.planlar.find((x) => x.id === planId)?.hazirPaketler.includes(paketId), "paket planın hazır paketlerinde");
  await p.locator('[data-stok-stokta-alan="planda"]').click(); await p.waitForTimeout(300);
  ok((await p.locator(`[data-stok-planda="${paketId}"]`).count()) === 1, "Plana alınan'da planıyla");
  await p.locator(`[data-stok-plandan-cikar="${paketId}"]`).click(); await p.waitForTimeout(600);
  d = await durum();
  ok(!d.planlar.find((x) => x.id === planId)?.hazirPaketler.includes(paketId), "plandan çıkarıldı");
  await p.locator('[data-stok-stokta-alan="bekleyen"]').click(); await p.waitForTimeout(300);
  ok((await p.locator(`[data-stok-plana-ekle="${paketId}"]`).count()) === 1, "yeniden plana alınmamışlarda");

  // 6. Programlar: masaların paketleri, masa seçimi ve alanları
  await git("#/stok/programlar");
  ok((await p.locator("[data-stok-masa]").count()) === 3 && (await p.locator("[data-stok-masa-alan]").count()) === 4, "masa seçimi ve dört alan");
  await p.locator('[data-stok-masa="ekonomi"]').click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-stok-masa-liste]").count()) === 1, "masanın listesi");

  // 7. Arşiv: yayınlananlar, arama
  await git("#/stok/arsiv");
  const n = await p.locator("[data-stok-arsiv]").count();
  ok(n > 0, "yayınlanan stok paketleri arşivde: " + n);
  await p.locator("[data-stok-arsiv-ara]").fill("zzqq-yok"); await p.waitForTimeout(300);
  ok((await p.locator("[data-stok-arsiv]").count()) === 0, "arama süzüyor");

  // 8. 390 pikselde taşma yok, Türkçe ve Arapça
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const bolum of ["teklifler", "uretim", "stokta", "programlar", "arsiv"]) {
      await git("#/stok/" + bolum);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${bolum}): ${t}`);
    }
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
