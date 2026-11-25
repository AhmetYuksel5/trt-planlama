// Asistanın yeni araçları (kullanıcı: asistan muhabir ekleyebilsin, yetenekleri artsın): muhabir ekle (Arapça
// ad zorunlu, aynı adla ikinci kez eklenmez, ünvan şehirden), muhabir bilgisi düzelt, Next Day'e nafize (birkaç
// saat tek formda), ekibe ekle, Weekly'ye canlı ve nafize, takibe gelişme satırı; okuma: günün notu ve muhabir
// raporu. Sahte model (asistan.cjs'teki gibi): "arac {ad, girdi}" o aracı ister, sonucu metin olarak yazar.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

const SAHTE = () => {
  window.__asistanModeli = async (mesajlar) => {
    const son = mesajlar[mesajlar.length - 1];
    const ilk = mesajlar.filter((m) => m.role === "user" && typeof m.content === "string").pop()?.content ?? "";
    const sonuc = Array.isArray(son.content) ? son.content.find((b) => b.type === "tool_result") : null;
    if (ilk.startsWith("arac ")) {
      const { ad, girdi } = JSON.parse(ilk.slice(5));
      if (!sonuc) return { icerik: [{ type: "tool_use", id: "t" + Math.random().toString(36).slice(2), name: ad, input: girdi }] };
      return { icerik: [{ type: "text", text: "SONUC " + sonuc.content }] };
    }
    return { icerik: [{ type: "text", text: "?" }] };
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
  const yaz = async (m) => { await p.fill("[data-asistan-yazi]", m); await p.press("[data-asistan-yazi]", "Enter"); await p.waitForTimeout(500); };
  const arac = (ad, girdi = {}) => yaz("arac " + JSON.stringify({ ad, girdi }));
  const bekleyen = '[data-asistan-ileti="onay"][data-durum="bekliyor"]';
  const alan = (ad) => p.locator(`${bekleyen} [data-asistan-alan="${ad}"]`).first();
  const sonSonuc = async () => {
    const m = (await p.locator('[data-asistan-ileti="asistan"]').last().innerText()).replace(/^SONUC /, "");
    try { return JSON.parse(m); } catch { return {}; }
  };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await git("#/");
  await p.keyboard.press("Control+KeyJ");

  // Muhabir ekle: şehir adla verilir, ünvan şehirden.
  await arac("muhabirEkle", { adAr: "سليم الراوي", adTr: "Selim Ravi", sehir: "Bağdat", telefon: "+964 700 000 0000" });
  ok((await p.locator(bekleyen).count()) === 1, "muhabir ekleme kartı açıldı");
  ok((await alan("sehir").inputValue()) !== "", "şehir adından seçildi: " + (await alan("sehir").inputValue()));
  await yaz("evet");
  let d = await durum();
  const yeni = d.kisiler.find((k) => (k.ad.ar ?? k.ad) === "سليم الراوي");
  ok(!!yeni && yeni.birim === "muhabir" && yeni.hesapsiz, "hesapsız dış muhabir olarak eklendi");
  ok(yeni && yeni.gorev === "muhabir-s-" + yeni.sehir, "ünvanı şehrinden: " + yeni?.gorev);
  await arac("muhabirEkle", { adAr: "سليم الراوي" });
  ok((await p.locator(bekleyen).count()) === 0 && (await sonSonuc()).hata === "zatenKayitli", "aynı Arapça adla ikinci kez eklenmedi");

  // Muhabir bilgisi düzelt.
  await arac("muhabirBilgisiDuzenle", { kisiId: yeni.id, eposta: "selim@ornek.local" });
  await yaz("evet");
  d = await durum();
  const y2 = d.kisiler.find((k) => k.id === yeni.id);
  ok([y2.eposta, y2.kurumEposta].includes("selim@ornek.local") && y2.telefon === "+964 700 000 0000", "e-posta yazıldı, telefon kaldı");

  // Plan işleri Planlama'dan (tam yönetici planın içeriğini düzenlemiyor).
  await p.evaluate(() => { sessionStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/");
  await p.keyboard.press("Control+KeyJ");
  // Next Day'e nafize: iki saat, iki nafize.
  const plan = [...d.planlar].filter((x) => ["taslak", "toplantida", "onayli"].includes(x.durum)).sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
  const pb = plan.basliklar[0];
  const nfOnce = (plan.nafizeler ?? []).length;
  await arac("nafizeEkle", { planId: plan.id, planBaslikId: pb.id, saatler: "8, 11:30", yer: "استوديو 1", sunucuAd: "سامر خليل", konuklar: "محمد علي، أحمد حسن" });
  ok((await alan("saatler").inputValue()).includes("11:30"), "saatler formda");
  await yaz("evet");
  d = await durum();
  const nf = d.planlar.find((x) => x.id === plan.id).nafizeler ?? [];
  ok(nf.length === nfOnce + 2, "iki saat iki nafize (" + (nf.length - nfOnce) + ")");
  ok(nf.some((n) => n.saat === "11:30" && n.planBaslikId === pb.id && n.sunucu?.ad === "سامر خليل" && n.konuklar.length === 2), "saat, başlık, sunucu, konuklar doğru");

  // Ekibe ekle: görev seçilince adaylar o görevin.
  await arac("ekibeEkle", { planId: plan.id, gorev: "sunucu", vardiya: "06:00" });
  ok((await p.locator(bekleyen).count()) === 1, "ekip kartı açıldı");
  const adaylar = await alan("kisiId").locator("option").evaluateAll((l) => l.map((o) => o.value).filter(Boolean));
  const ekipte = new Set(plan.ekip.map((e) => e.kisiId));
  const aday = adaylar.find((x) => !ekipte.has(x));
  if (aday) {
    await alan("kisiId").selectOption(aday);
    await yaz("evet");
    ok((await durum()).planlar.find((x) => x.id === plan.id).ekip.some((e) => e.kisiId === aday && e.gorev === "sunucu" && e.vardiya === "06:00"), "kişi ekibe sunucu olarak eklendi");
  } else { await yaz("hayır"); ok(true, "ekipte olmayan sunucu adayı yok"); }

  // Weekly'ye canlı ve nafize.
  const hf = d.haftalik.find((h) => h.durum !== "kesinlesti") ?? d.haftalik[0];
  await p.evaluate(([k, id]) => { const x = JSON.parse(localStorage.getItem(k)); const h = x.haftalik.find((y) => y.id === id); h.durum = "hazirlik"; localStorage.setItem(k, JSON.stringify(x)); localStorage.setItem(k + "-iz", String(Date.now())); }, [K, hf.id]);
  await arac("haftaCanliEkle", { haftaId: hf.id, tarih: hf.baslangic, konu: "القمة العربية", yer: "الرياض", saat: "15:00", dosya: "القمة العربية في الرياض" });
  ok((await alan("baslikId").inputValue()) === "__yeni", "olmayan dosya yeni dosya olarak geldi");
  await yaz("evet");
  await arac("haftaNafizeEkle", { haftaId: hf.id, tarih: hf.baslangic, dosya: "القمة العربية في الرياض", saatler: "09:00", yer: "الرياض", sunucuAd: "ليلى" });
  ok((await alan("baslikId").inputValue()) !== "__yeni", "ilk araçla açılan dosya seçili geldi");
  await yaz("evet");
  d = await durum();
  const h2 = d.haftalik.find((x) => x.id === hf.id);
  const dosyaId = d.basliklar.find((x) => x.ad === "القمة العربية في الرياض")?.id;
  ok(h2.canlilar?.some((c) => c.konu === "القمة العربية" && c.saat === "15:00" && c.baslikId === dosyaId), "Weekly canlısı dosyasıyla");
  ok(h2.nafizeler?.some((n) => n.saat === "09:00" && n.baslikId === dosyaId), "Weekly nafizesi aynı dosyada");

  // Takibe gelişme satırı.
  const tk = d.oneriler.find((o) => o.durum === "takip") ?? d.oneriler.find((o) => ["yeni", "degerlendiriliyor"].includes(o.durum));
  if (tk) {
    const once = (tk.satirlar ?? []).length;
    await arac("takipSatiriEkle", { oneriId: tk.id, metin: "تطور جديد في المتابعة" });
    await yaz("evet");
    ok(((await durum()).oneriler.find((o) => o.id === tk.id).satirlar ?? []).length === once + 1, "takibe satır eklendi");
  } else ok(true, "örnekte takip yok");

  // Okuma: günün notu ve muhabir raporu.
  await arac("gununNotu");
  const gn = await sonSonuc();
  ok(Array.isArray(gn.notlar), "günün notu okundu (" + (gn.notlar?.length ?? "?") + " satır)");
  await arac("muhabirRaporu", {});
  const mr = await sonSonuc();
  ok(Array.isArray(mr.muhabirler) && /^\d{4}-\d{2}$/.test(mr.ay), "muhabir raporu okundu (" + (mr.muhabirler?.length ?? "?") + " muhabir)");

  // Yetkisiz: Planlama'nın personeli muhabir ekleyemez (tam yönetici ya da yetkili).
  await p.evaluate(() => { sessionStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/");
  await p.keyboard.press("Control+KeyJ");
  await arac("muhabirEkle", { adAr: "اسم آخر" });
  ok((await p.locator(bekleyen).count()) === 0 && (await sonSonuc()).hata === "yetki", "yetkisizde form açılmadı");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
