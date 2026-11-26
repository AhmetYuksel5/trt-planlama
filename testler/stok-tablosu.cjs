// Rapor önerileri tablosu (kullanıcı: stok haberler kurumun Excel tablosu gibi, aynı biçimde çıktı,
// haftalık öneriler tabloya doğrudan düşsün): satırlar kayıttan, muhabire göre gruplu, hücre yerinde
// düzeltilir, "+ Weekly" gündeme ekler, Excel dosyası kurumun sütunlarıyla; telefonda kartlar.
// Kurallar src/stokTablosu.ts, ekran src/ekranlar/StokTablosu.tsx, yazıcı src/xlsx.ts.
const { chromium } = require(process.env.PW || "playwright");
const fs = require("fs");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);

  // 1. Muhabirin formu: programa önerirken birden çok program adayı, zamana bağlı değilse teslim günü, kalemli masraf ve bağlantı
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "mu1"); });
  await git("#/oneriler/yeni");
  await p.locator(".oneri-meta-satir select").filter({ has: p.locator('option[value="program"]') }).first().selectOption("program");
  await p.waitForTimeout(200);
  const adaylar = p.locator("[data-program-aday]");
  ok((await adaylar.count()) > 1, "program adayları listelendi");
  const prgA = await adaylar.nth(0).getAttribute("data-program-aday"), prgB = await adaylar.nth(1).getAttribute("data-program-aday");
  await adaylar.nth(0).click(); await adaylar.nth(1).click();
  ok((await p.locator('[data-oneri-zaman="secilmedi"]').count()) === 1, "programda zaman sorusu seçilmemiş gelir");
  await p.locator('[data-zaman-sec="zamansiz"]').click();
  ok((await p.locator("[data-oneri-teslim]").count()) === 1 && (await p.locator("[data-oneri-tarih]").count()) === 0, "zamana bağlı değilse yalnız teslim günü");
  const strap = "ورش الخزف في الخليل تستعيد زبائنها";
  await p.fill("[data-oneri-strap]", strap);
  await p.fill("[data-oneri-gelisme]", "عودة الحرفيين إلى الأسواق بعد سنوات من الركود بفضل الطلب السياحي المتزايد");
  await p.fill("[data-oneri-isleme]", "قصص ثلاثة حرفيين من ثلاثة أجيال");
  await p.fill("[data-oneri-gorsel]", "لقطات الأفران والرسم على الخزف");
  await p.locator("[data-oneri-ek-bilgiler] > summary").click();
  await p.locator("[data-oneri-masraf-ekle]").click();
  await p.locator('[data-oneri-masraf="0"] [data-oneri-masraf-tur="konaklama"]').click();
  await p.fill('[data-oneri-masraf="0"] [data-oneri-masraf-tutar]', "120");
  await p.fill("[data-oneri-baglanti-yaz]", "https://ornek.example/haber https://ornek.example/haber yazi");
  await p.locator("[data-oneri-baglanti-ekle]").click().catch(() => {});
  await p.locator(".form-alt button.dugme").last().click();
  await p.waitForTimeout(600);
  let d = await durum();
  const mo = d.oneriler.find((x) => x.paketBasligi === strap);
  ok(!!mo && JSON.stringify(mo.programAdaylari) === JSON.stringify([prgA, prgB]), "iki program adayı kayıtta");
  ok(mo && mo.masraflar?.length === 1 && mo.masraflar[0].tur === "konaklama" && mo.masraflar[0].tutar === 120 && !mo.ekMasraf, "kalemli masraf kayıtta");
  ok(mo && JSON.stringify(mo.baglantilar) === JSON.stringify(["https://ornek.example/haber"]), "bağlantı ayıklandı, tekrar yok: " + JSON.stringify(mo?.baglantilar));
  ok(mo && !mo.hedefTarih && !!mo.teslimTahmini && !!mo.hafta, "zamana bağlı değil: teslim günü ve hafta");

  // 2. Planlamacı: tablonun haftasına düşen feature önerisi (teslim tahmini ve masrafla)
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl6"); });
  await git("#/stok/teklifler");
  const hafta = await p.locator("[data-stok-tablo]").getAttribute("data-stok-tablo");
  ok(!!hafta, "Teklifler varsayılan olarak tablo: " + hafta);
  const gun = (n) => { const t = new Date(hafta + "T12:00:00"); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
  await p.evaluate(({ k, hafta, teslim, gelecek, gelecekHafta }) => {
    const d = JSON.parse(localStorage.getItem(k));
    const yeni = (id, muhabirId, baslik, ek) => ({
      id, muhabirId, ulke: "turkiye", haberBasligi: baslik, gelisme: baslik, paketBasligi: baslik, tur: "feature", bicim: "pkg",
      sahaGerekli: false, zaman: new Date().toISOString(), kanal: "sistem", durum: "yeni", hafta, ...ek,
    });
    d.oneriler.push(
      yeni("o-tb-1", "mu2", "سوق الكتب القديمة يستعيد زواره", { islemeFikri: "قصص الباعة القدامى", gorselIsleme: "لقطات صباحية", teslimTahmini: teslim, ekMasraf: "USD 200" }),
      yeni("o-tb-2", "mu2", "مزارعو النخيل والملوحة", {}),
      // Bu haftaya gönderilmiş ama teslimi gelecek haftada: bu haftanın tablosunda değil.
      yeni("o-tb-3", "mu3", "تقرير يسلم الأسبوع المقبل", { teslimTahmini: gelecek }),
      // Gelecek haftaya gönderilmiş ama teslimi bu hafta: bu haftanın tablosunda.
      { ...yeni("o-tb-4", "mu3", "تقرير يسلم هذا الأسبوع", { teslimTahmini: teslim }), hafta: gelecekHafta },
    );
    localStorage.setItem(k, JSON.stringify(d));
  }, { k: K, hafta, teslim: gun(5), gelecek: gun(9), gelecekHafta: gun(7) });
  await git("#/stok/teklifler");
  const satir = p.locator('[data-tablo-satir="o-o-tb-1"]');
  ok((await satir.count()) === 1, "haftalık öneri tabloya kendiliğinden düştü");
  const basliklar = await p.locator(".st-izgara thead th").allInnerTexts();
  ok(basliklar.length === 10 && basliklar[1].includes("اسم المراسل") && basliklar[8].includes("تكاليف إضافية"), "kurumun dokuz sütunu ve durum");
  const tarih = gun(5).split("-").reverse().join(".");
  ok((await satir.locator('[data-tablo-hucre="teslim"]').innerText()).trim() === tarih, "teslim kurumun biçiminde: " + tarih);
  ok((await satir.locator('[data-tablo-hucre="masraf"]').innerText()).includes("USD 200"), "masraf sütunda");
  ok((await satir.getAttribute("data-durum")) === "yeni", "durum Yeni");
  // Aynı muhabirin iki satırı aynı tonda, ad yalnız ilkinde
  const s2 = p.locator('[data-tablo-satir="o-o-tb-2"]');
  const ton1 = (await satir.getAttribute("class")).match(/st-ton-\d/)[0];
  ok((await s2.getAttribute("class")).includes(ton1), "aynı muhabirin satırları aynı tonda");
  const adlar = [(await satir.locator('[data-tablo-hucre="muhabir"]').innerText()).trim(), (await s2.locator('[data-tablo-hucre="muhabir"]').innerText()).trim()];
  ok(adlar[1] === "", "muhabirin adı grubun yalnız ilk satırında");
  ok((await p.locator("[data-tablo-weekly]").count()) === 0, "düğmeler seçilmeden görünmüyor");

  // 3. Hücre yerinde düzeltilir: çift tık, yaz, Enter
  await satir.locator('[data-tablo-hucre="isleme"]').dblclick();
  await p.locator('[data-tablo-duzen="isleme"]').fill("قصص الباعة القدامى والجيل الجديد");
  await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  d = await durum();
  let o = d.oneriler.find((x) => x.id === "o-tb-1");
  ok(o.islemeFikri === "قصص الباعة القدامى والجيل الجديد" && !!o.ilkHali, "hücre öneriye yazıldı, ilk hali saklandı");
  await satir.locator('[data-tablo-hucre="masraf"]').dblclick();
  await p.locator('[data-tablo-duzen="masraf"]').fill("USD 250");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok((await durum()).oneriler.find((x) => x.id === "o-tb-1").ekMasraf === "USD 200", "Esc vazgeçer");

  // 4. Satır seçilince "+ Weekly": teslim günü önerinin tahminiyle gelir, kalem Stok ve programlar'a
  await satir.locator('[data-tablo-hucre="n"]').click(); await p.waitForTimeout(200);
  // Hafta açık değilse düğme önce haftayı açar.
  await p.locator('[data-tablo-weekly="o-o-tb-1"]').click(); await p.waitForTimeout(600);
  const form = p.locator('[data-gundeme-ekle-formu="o-tb-1"]');
  ok((await form.count()) === 1, "+ Weekly Gündeme ekle formunu açtı");
  ok((await form.locator("[data-ge-teslim-gunu]").inputValue()) === gun(5), "teslim günü önerinin tahmininden");
  await form.locator(".form-alt .dugme:not(.dugme-ikincil)").click(); await p.waitForTimeout(700);
  d = await durum();
  const kalem = d.haftalik.find((h) => h.baslangic === hafta)?.kalemler.find((x) => x.oneriId === "o-tb-1");
  ok(!!kalem && !kalem.tarih && kalem.teslimGunu === gun(5), "Weekly'nin Stok ve programlar kalemi, teslim günüyle");
  ok((await p.locator('[data-tablo-satir="o-o-tb-1"]').getAttribute("data-durum")) === "gundemde", "satır tabloda kaldı, durumu Gündemde");

  // 5. Kalem doğunca strap kaleme yazılır (Weekly ile ayrışmasın)
  await p.locator('[data-tablo-satir="o-o-tb-1"] [data-tablo-hucre="strap"]').dblclick();
  await p.locator('[data-tablo-duzen="strap"]').fill("سوق المتنبي يستعيد زواره");
  await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  d = await durum();
  ok(d.haftalik.find((h) => h.baslangic === hafta).kalemler.find((x) => x.oneriId === "o-tb-1").paketBasligi === "سوق المتنبي يستعيد زواره", "strap kaleme yazıldı");

  // 5b. Tarih: satır teslim gününün haftasında
  ok((await p.locator('[data-tablo-satir="o-o-tb-3"]').count()) === 0, "teslimi gelecek haftada olan bu haftanın tablosunda yok");
  ok((await p.locator('[data-tablo-satir="o-o-tb-4"]').count()) === 1, "gelecek haftaya gönderilip teslimi bu hafta olan burada");
  await p.locator(`[aria-label="Sonraki hafta"]`).first().click(); await p.waitForTimeout(500);
  ok((await p.locator('[data-tablo-satir="o-o-tb-3"]').count()) === 1 && (await p.locator('[data-tablo-satir="o-o-tb-4"]').count()) === 0, "gelecek haftanın tablosunda yalnız teslimi orada olan");
  await p.locator(`[aria-label="Önceki hafta"]`).first().click(); await p.waitForTimeout(500);

  // 5c. Program: جهة العرض hücresinden Programlar'ın programı seçilir
  const prg = await p.evaluate((k) => (JSON.parse(localStorage.getItem(k)).programlar ?? []).find((x) => !x.pasif), K);
  ok(!!prg, "demoda program var: " + prg?.ad);
  await p.locator('[data-tablo-satir="o-o-tb-2"] [data-tablo-hucre="jiha"]').dblclick();
  await p.locator('[data-tablo-duzen="jiha"]').selectOption(prg.id); await p.waitForTimeout(400);
  ok((await durum()).oneriler.find((x) => x.id === "o-tb-2").programId === prg.id, "program öneriye yazıldı");
  ok((await p.locator('[data-tablo-satir="o-o-tb-2"] [data-tablo-hucre="jiha"]').innerText()).includes(prg.ad), "sütunda programın adı");

  // 6. Excel: kurumun sütunları, bant, sağdan sola; kaldırılan satır girmez
  const [indirme] = await Promise.all([p.waitForEvent("download"), p.locator('[data-tablo-arac="excel"]').click()]);
  const yol = await indirme.path();
  const ham = fs.readFileSync(yol);
  ok(indirme.suggestedFilename() === `muqtarahat-taqarir_${hafta}_${gun(6)}.xlsx`, "dosya adı haftayla: " + indirme.suggestedFilename());
  const metin = ham.toString("utf8");
  ok(ham.slice(0, 2).toString() === "PK", "zip dosyası");
  ok(metin.includes('rightToLeft="1"') && metin.includes("اسم المراسل") && metin.includes("سوق المتنبي يستعيد زواره") && metin.includes(tarih), "sayfa sağdan sola, sütunlar ve satır içinde");
  ok(metin.includes('<mergeCell ref="A1:I1"/>') && metin.includes("مقترحات تقارير"), "bant birleşik ilk satırda");

  // 7. Kopya: Google Tablolar'a yapışan HTML ve sekmeli düz metin
  await p.locator('[data-tablo-arac="kopya"]').click(); await p.waitForTimeout(400);
  const pano = await p.evaluate(() => navigator.clipboard.readText().catch(() => ""));
  ok(pano.split("\n")[1]?.split("\t").length === 9 && pano.includes("سوق المتنبي يستعيد زواره"), "panoda sekmeli tablo (9 sütun)");

  // 8. Kapsam: Bütün teklifler sayısı tablonun satırlarıyla
  const sayi = Number((await p.locator('[data-stok-kapsam="stok"]').innerText()).match(/\d+$/)[0]);
  ok(sayi === (await p.locator("[data-tablo-satir]").count()), "kapsam sayısı tablodaki satırlar");

  // 9. Kart görünümüne geçiş ve geri
  await p.locator('[data-stok-gorunum-sec="kart"]').click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-stok-tablo]").count()) === 0 && (await p.locator("[data-oneri]").count()) > 0, "Kartlar görünümü eski liste");
  await p.locator('[data-stok-gorunum-sec="tablo"]').click(); await p.waitForTimeout(300);

  // 10. Telefon: kartlar, yatay taşma yok
  const t = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const pt = await t.newPage();
  pt.on("pageerror", (e) => hatalar.push(String(e)));
  await pt.goto(B);
  const kayit = await p.evaluate((k) => localStorage.getItem(k), K);
  await pt.evaluate(([k, v]) => { localStorage.setItem(k, v); localStorage.setItem("trt-planlama-dil", "ar"); localStorage.setItem("trt-planlama-oturum", "pl6"); }, [K, kayit]);
  await pt.goto("about:blank"); await pt.goto(B + "#/stok/teklifler"); await pt.waitForTimeout(1300);
  ok((await pt.locator(".st-kartlar [data-tablo-satir]").count()) > 0 && (await pt.locator(".st-izgara").count()) === 0, "telefonda kartlar");
  await pt.locator('[data-tablo-satir="o-o-tb-2"] .st-kart-bas').click(); await pt.waitForTimeout(200);
  ok((await pt.locator('[data-tablo-satir="o-o-tb-2"] [data-tablo-weekly]').count()) === 1, "açık kartta + Weekly");
  ok((await pt.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390 pikselde yatay taşma yok (Arapça)");

  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
