// Asistanın güçlendirilmesi (kullanıcı: asistanın yetenekleri artsın): ekran bağlamı (açık öneri modele
// gider), toplu onay (aynı yanıttaki birkaç yazma tek kartta, seçilenler yapılır), yeni araçlar (öneriyi
// düzenle, hazır pakete ekle, aylık olay, özel yayına nafize ve yapılacak, stok ve gündem okuma, plan
// postası penceresi) ve boş paneldeki "seni bekleyenler" çipleri. Sahte model asistan.cjs'teki gibi.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

const SAHTE = () => {
  window.__asistanModeli = async (mesajlar, baglam) => {
    const son = mesajlar[mesajlar.length - 1];
    const ilk = mesajlar.filter((m) => m.role === "user" && typeof m.content === "string").pop()?.content ?? "";
    const sonuclar = Array.isArray(son.content) ? son.content.filter((b) => b.type === "tool_result") : [];
    if (ilk === "ekran") return { icerik: [{ type: "text", text: "EKRAN " + (baglam?.ekran ?? "") }] };
    if (ilk.startsWith("arac ") || ilk.startsWith("toplu ")) {
      const istekler = ilk.startsWith("arac ") ? [JSON.parse(ilk.slice(5))] : JSON.parse(ilk.slice(6));
      if (!sonuclar.length) return { icerik: istekler.map(({ ad, girdi }, i) => ({ type: "tool_use", id: "t" + i + Math.random().toString(36).slice(2), name: ad, input: girdi })) };
      return { icerik: [{ type: "text", text: "SONUC " + (sonuclar.length === 1 ? sonuclar[0].content : JSON.stringify(sonuclar.map((x) => JSON.parse(x.content)))) }] };
    }
    return { icerik: [{ type: "text", text: "SORU " + ilk }] };
  };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(SAHTE);
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yaz = async (m) => { await p.fill("[data-asistan-yazi]", m); await p.press("[data-asistan-yazi]", "Enter"); await p.waitForTimeout(600); };
  const arac = (ad, girdi = {}) => yaz("arac " + JSON.stringify({ ad, girdi }));
  const bekleyen = '[data-asistan-ileti="onay"][data-durum="bekliyor"]';
  const alan = (ad) => p.locator(`${bekleyen} [data-asistan-alan="${ad}"]`).first();
  const sonMetin = () => p.locator('[data-asistan-ileti="asistan"]').last().innerText();
  const sonSonuc = async () => {
    const m = (await sonMetin()).replace(/^SONUC /, "");
    try { return JSON.parse(m); } catch { return {}; }
  };
  const ac = async () => { await p.keyboard.press("Control+KeyJ"); await p.waitForTimeout(300); };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/");
  let d = await durum();

  // Boş panelde bekleyenler: sayı kayıttan, basınca soru olarak gider.
  await ac();
  ok((await p.locator("[data-asistan-bekleyenler] [data-asistan-cip]").count()) >= 1, "boş panelde bekleyenler çipleri");
  const cip = p.locator('[data-asistan-cip="asCipOneri"]');
  if (await cip.count()) {
    await cip.click();
    await p.waitForTimeout(600);
    ok((await sonMetin()).startsWith("SORU Karar bekleyen"), "çip soruyu gönderdi");
  } else ok(false, "karar bekleyen öneri çipi yok");
  await p.click("[data-asistan-temizle]");

  // Ekran bağlamı: öneri ayrıntısı açıkken kimliği modele gider.
  const o = d.oneriler.find((x) => ["yeni", "degerlendiriliyor"].includes(x.durum));
  await git("#/oneriler/" + o.id);
  await ac();
  await yaz("ekran");
  ok((await sonMetin()).includes(o.id), "ekran bağlamında açık önerinin kimliği");

  // Öneriyi düzenle: model yeni Strap'i verir, öbür alanlar kayıttan.
  await arac("oneriDuzenle", { oneriId: o.id, paketBasligi: "عنوان مختصر جديد" });
  ok((await alan("haberBasligi").inputValue()) === o.haberBasligi, "Header kayıttan geldi");
  await yaz("evet");
  d = await durum();
  ok(d.oneriler.find((x) => x.id === o.id).paketBasligi === "عنوان مختصر جديد", "Strap düzeltildi");

  // Toplu onay: iki takvim faaliyeti tek kartta; ikincisinin seçimi kaldırılınca yalnız ilki yapılır.
  const fOnce = d.faaliyetler.length;
  await p.click("[data-asistan-temizle]");
  await yaz("toplu " + JSON.stringify([
    { ad: "faaliyetEkle", girdi: { baslik: "قمة أولى", baslangic: "2026-12-10", tur: "zirve", oncelik: "normal" } },
    { ad: "faaliyetEkle", girdi: { baslik: "قمة ثانية", baslangic: "2026-12-11", tur: "zirve", oncelik: "normal" } },
  ]));
  ok((await p.locator(`${bekleyen}[data-asistan-toplu="2"]`).count()) === 1, "iki iş tek kartta");
  await p.locator('[data-asistan-is="1"] [data-asistan-is-sec]').uncheck();
  await p.locator(`${bekleyen} button[data-asistan-evet]`).click().catch(async () => { await yaz("evet"); });
  await p.waitForTimeout(700);
  d = await durum();
  ok(d.faaliyetler.length === fOnce + 1 && d.faaliyetler.some((f) => f.baslik === "قمة أولى") && !d.faaliyetler.some((f) => f.baslik === "قمة ثانية"), "yalnız seçilen iş yapıldı");
  const sonuc = await sonSonuc();
  ok(Array.isArray(sonuc) && sonuc[1]?.vazgecti === true, "seçilmeyen iş 'vazgecti' döndü");

  // Stok okuma ve hazır pakete ekleme.
  await p.click("[data-asistan-temizle]");
  await arac("stokListele");
  const stok = await sonSonuc();
  ok(Array.isArray(stok.paketler), "stok listelendi (" + (stok.paketler?.length ?? 0) + ")");
  const aday = (stok.paketler ?? []).find((x) => x.hazirSecilebilir);
  if (aday) {
    await arac("hazirPaketEkle", { paketId: aday.paketId });
    ok((await alan("paketId").inputValue()) === aday.paketId, "hazır paket formu paketle açıldı");
    const planId = await alan("planId").inputValue();
    await yaz("evet");
    d = await durum();
    ok(d.planlar.find((x) => x.id === planId).hazirPaketler.includes(aday.paketId), "paket planın hazır paketlerinde");
  } else ok(true, "hazır pakete eklenecek stok paketi yok (örnek veri)");

  // Gündem okuma: Planlama'ya paylaşılmadığı için yetki hatası; tam yönetici demo akışını okur.
  await arac("gundemOzeti");
  ok((await sonSonuc()).hata === "yetki", "gündem paylaşılmayana kapalı");

  // Plan postası: onaylı plan yoksa ret, varsa pencere açılır.
  const onayli = d.planlar.find((x) => x.durum === "onayli");
  if (onayli) {
    await arac("planGonder", { planId: onayli.id });
    await p.waitForTimeout(800);
    ok((await p.locator("dialog[open]").count()) >= 1, "plan postası penceresi açıldı");
    await p.keyboard.press("Escape");
  }
  const taslak = d.planlar.find((x) => x.durum === "taslak");
  if (taslak) {
    await git("#/");
    await ac();
    await arac("planGonder", { planId: taslak.id });
    ok((await sonSonuc()).hata === "planOnaylanmadi", "onaysız plan gönderilmez");
  }

  // Örnek verinin özel yayını geçmişte: ileri bir güne alınır (yalnız bu testin kaydında).
  await p.evaluate((k) => { const x = JSON.parse(localStorage.getItem(k)); x.ozel[0].tarih = "2026-12-05"; localStorage.setItem(k, JSON.stringify(x)); }, K);
  await git("#/");
  await ac();
  d = await durum();
  const oz = d.ozel.find((x) => (x.bitis || x.tarih) >= new Date().toISOString().slice(0, 10));
  if (oz) {
    const cOnce = d.canliYayinlar.filter((c) => c.ozelId === oz.id).length;
    await arac("ozelNafizeEkle", { ozelId: oz.id, konu: "نافذة تجريبية", tarih: oz.tarih, saatGmt: "09:00", yer: "الدوحة" });
    ok((await alan("tarih").inputValue()) === oz.tarih, "nafize günü yayının gününden");
    await yaz("evet");
    await arac("ozelMaddeEkle", { ozelId: oz.id, metin: "حجز الأقمار" });
    await yaz("evet");
    d = await durum();
    ok(d.canliYayinlar.filter((c) => c.ozelId === oz.id).length === cOnce + 1, "özel yayına nafize eklendi");
    ok(JSON.stringify(d.ozel.find((x) => x.id === oz.id)).includes("حجز الأقمار"), "özel yayına yapılacak eklendi");
  } else ok(true, "süren özel yayın yok (örnek veri)");

  // Weekly kalemi Next Day gelişmesinin alanlarıyla; dosyanın muhabiri ve LIVE.
  d = await durum();
  const hf = d.haftalik.find((x) => x.durum !== "kesinlesti") || d.haftalik[0];
  await p.evaluate(([k, id]) => { const x = JSON.parse(localStorage.getItem(k)); const h = x.haftalik.find((y) => y.id === id); h.durum = "hazirlik"; localStorage.setItem(k, JSON.stringify(x)); }, [K, hf.id]);
  await git("#/");
  await ac();
  await arac("kalemEkle", { haftaId: hf.id, tarih: hf.baslangic, dosya: "ملف تجريبي", metin: "تطور مع جدول", saat: "12:00", teams: "فريق أول، فريق ثان", program: "09:00 وصول\n11:30 مؤتمر" });
  await yaz("evet");
  d = await durum();
  const yk = d.haftalik.find((x) => x.id === hf.id).kalemler.find((k) => k.metin === "تطور مع جدول");
  ok(yk && yk.saat === "12:00" && yk.teams?.length === 2 && yk.program?.length === 2 && yk.program[1].saat === "11:30", "asistan kalemi saat, Teams ve Schedule'la ekledi");
  const mh = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
  await arac("haftaDosyaMuhabiri", { haftaId: hf.id, tarih: hf.baslangic, dosya: "ملف تجريبي", muhabirId: mh.id, yer: "غزة", live: true });
  await yaz("evet");
  d = await durum();
  const db = d.haftalik.find((x) => x.id === hf.id).dosyaBilgileri?.find((x) => x.tarih === hf.baslangic && x.baslikId === yk?.baslikId);
  ok(db?.live && db.muhabirler.some((m) => m.kisiId === mh.id && m.yer === "غزة"), "asistan dosyaya muhabir ve LIVE yazdı");

  // Tam yönetici: aylık olay, özel yayına nafize ve yapılacak, gündem.
  await p.evaluate(() => { sessionStorage.clear(); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await git("#/");
  await ac();
  await p.click("[data-asistan-temizle]").catch(() => {});
  await arac("aylikOlayEkle", { baslik: "انتخابات تجريبية", tarih: "2026-12-20", yer: "تونس" });
  await yaz("evet");
  d = await durum();
  ok(d.aylikOlaylar?.some?.((x) => x.baslik === "انتخابات تجريبية") || JSON.stringify(d).includes("انتخابات تجريبية"), "aylık olay eklendi");

  await arac("gundemOzeti", { saat: 168 });
  const gd = await sonSonuc();
  ok(Array.isArray(gd.olaylar) && gd.olaylar.length > 0, "gündem olayları okundu (" + (gd.olaylar?.length ?? 0) + ")");

  // Araştırma arşivi: yalnız kişinin kendi notları, sözcük ve konuyla süzülür.
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.gundemArsivi = [
      { id: "gn-t1", kisiId: "yo3", baslik: "قمة إقليمية في الخرطوم", baglanti: "https://ornek.local/1", kaynak: "Örnek", konular: ["sudan"], not: "مهم للخطة", zaman: "2026-11-20T10:00:00.000Z" },
      { id: "gn-t2", kisiId: "yo3", baslik: "انتخابات في تونس", baglanti: "https://ornek.local/2", kaynak: "Örnek", konular: [], not: "", zaman: "2026-11-21T10:00:00.000Z" },
      { id: "gn-t3", kisiId: "pl1", baslik: "قمة أخرى في الخرطوم", baglanti: "https://ornek.local/3", kaynak: "Örnek", konular: ["sudan"], not: "", zaman: "2026-11-22T10:00:00.000Z" },
    ];
    localStorage.setItem(k, JSON.stringify(d));
  }, K);
  await git("#/");
  await ac();
  await p.click("[data-asistan-temizle]").catch(() => {});
  await arac("arastirmaArsivi", {});
  const ar = await sonSonuc();
  ok(ar.toplam === 2 && ar.notlar[0].baslik === "انتخابات في تونس", "arşiv yalnız kendi notları, en yenisi önce");
  await arac("arastirmaArsivi", { sorgu: "الخرطوم" });
  const ar2 = await sonSonuc();
  ok(ar2.toplam === 1 && ar2.notlar[0].not === "مهم للخطة", "arşivde sözcükle arandı");
  await arac("arastirmaArsivi", { konu: "sudan", baslangic: "2026-11-21" });
  ok((await sonSonuc()).toplam === 0, "konu ve tarih süzgeci");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
