// Asistan (belgeler/asistan.md): sahte modelle uçtan uca. Okuma aracı hemen çalışır; yazma aracı onay
// kartı açar: işin formu, modelin doldurduğu değerlerle; kişi alanları değiştirir, "Onayla" ya da "evet"
// ile iş formun son haliyle yapılır, "hayır" ile yapılmaz; zorunlu alan boşken iş bekler. Bağlı seçim
// (plan → başlık) planla değişir. Her yazma aracı form açıyor (duman). Kısıtlı kişide (muhabir) asistan yok.
// Sahte model (window.__asistanModeli): kişinin iletisi "arac {ad, girdi}" ise o aracı ister, sonucu
// metin olarak geri yazar; gerçek kapının ve sağlayıcının yerinde.
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
    const veri = sonuc ? JSON.parse(sonuc.content) : null;
    const arac = (name, input) => ({ icerik: [{ type: "tool_use", id: "t" + Math.random().toString(36).slice(2), name, input }] });
    if (ilk.startsWith("arac ")) {
      const { ad, girdi } = JSON.parse(ilk.slice(5));
      if (!sonuc) return arac(ad, girdi);
      return { icerik: [{ type: "text", text: "SONUC " + JSON.stringify(veri) }] };
    }
    if (ilk.includes("gelişme")) {
      if (!sonuc) return arac("planOzeti", {});
      if (veri.planId && veri.basliklar) return arac("gelismeEkle", { planId: veri.planId, planBaslikId: veri.basliklar[0].planBaslikId, metin: "تطور تجريبي من المساعد" });
      return { icerik: [{ type: "text", text: veri.tamam ? "Eklendi: " + veri.degerler.metin : "Eklenmedi." }] };
    }
    if (ilk.includes("biçimli")) return { icerik: [{ type: "text", text: "**Yarın** üç başlık var:\n\n- *Gazze*\n- `nd-yarin`\n\n1. bir\n2. iki" }] };
    if (ilk.includes("öneriler sayfası")) {
      if (!sonuc) return arac("sayfaAc", { yol: "#/oneriler" });
      return { icerik: [{ type: "text", text: "Açtım." }] };
    }
    return { icerik: [{ type: "text", text: "Anlamadım." }] };
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
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/");
  ok((await p.locator("[data-asistan-ac]").count()) === 1, "yüzen asistan düğmesi");
  await p.keyboard.press("Control+KeyJ");
  ok((await p.locator("[data-asistan-panel]").count()) === 1, "Ctrl+J paneli açıyor");

  // Yazma: form açılır, kişi metni değiştirir, "evet" formun son haliyle yapar.
  const once = (await durum()).gelismeler.length;
  await yaz("yarının planına bir gelişme ekle");
  ok((await p.locator(bekleyen).count()) === 1, "yazma işi önce onay kartında");
  ok((await alan("metin").inputValue()) === "تطور تجريبي من المساعد", "form modelin değeriyle açıldı");
  ok((await alan("planBaslikId").inputValue()) !== "", "başlık seçili geldi");
  ok((await durum()).gelismeler.length === once, "onaysız yazılmadı");
  await alan("metin").fill("نص عدّله الشخص");
  await alan("yer").fill("أنقرة");
  await yaz("evet");
  const d1 = await durum();
  ok(d1.gelismeler.length === once + 1 && d1.gelismeler.some((g) => g.metin === "نص عدّله الشخص" && g.yer === "أنقرة"), "\"evet\" kişinin düzelttiği değerlerle ekledi");
  ok((await p.locator('[data-asistan-ileti="onay"][data-durum="yapildi"]').count()) === 1, "onay kartı yapıldı");
  ok((await p.locator('[data-asistan-ileti="onay"][data-durum="yapildi"] [data-asistan-alan="metin"]').isDisabled()), "biten kart salt okunur");
  ok((await p.locator('[data-asistan-ileti="asistan"]').last().innerText()).includes("نص عدّله الشخص"), "modele son değerler gitti");

  // Zorunlu alan boşken iş bekler; doldurulunca düğmeyle yapılır.
  const d2 = await durum();
  const oneri = d2.oneriler.find((o) => ["yeni", "degerlendiriliyor"].includes(o.durum) && o.muhabirId && !o.talimatVeren && !o.kaynakTuru);
  await arac("oneriReddet", { oneriId: oneri.id });
  ok((await p.locator(bekleyen).count()) === 1, "ret kartı açıldı");
  await p.click(`${bekleyen} [data-asistan-evet]`);
  await p.waitForTimeout(300);
  ok((await durum()).oneriler.find((o) => o.id === oneri.id).durum !== "reddedildi", "gerekçesiz reddedilmedi");
  ok((await p.locator(`${bekleyen} label.eksik [data-asistan-alan="gerekce"]`).count()) === 1, "eksik alan işaretli");
  await alan("gerekce").fill("مكرر");
  await p.click(`${bekleyen} [data-asistan-evet]`);
  await p.waitForTimeout(500);
  const o2 = (await durum()).oneriler.find((o) => o.id === oneri.id);
  ok(o2.durum === "reddedildi" && o2.gerekce === "مكرر", "düğmeyle formdaki gerekçeyle reddedildi");

  // "hayır": yapılmaz.
  const oneri2 = (await durum()).oneriler.find((o) => ["yeni", "degerlendiriliyor"].includes(o.durum) && o.muhabirId && !o.talimatVeren && !o.kaynakTuru);
  await arac("oneriReddet", { oneriId: oneri2.id, gerekce: "تجربة" });
  await yaz("hayır");
  ok((await durum()).oneriler.find((o) => o.id === oneri2.id).durum !== "reddedildi", "\"hayır\" ile reddedilmedi");
  ok((await sonSonuc()).vazgecti === true, "vazgeçildiği modele gitti");

  // Bağlı seçim: plan değişince başlık seçenekleri o planın; "Yeni başlık" adı soruyor.
  const d3 = await durum();
  const gundemde = new Set(d3.haftalik.flatMap((h) => h.kalemler.map((k) => k.oneriId)));
  const oneri3 = d3.oneriler.find((o) => ["yeni", "degerlendiriliyor"].includes(o.durum) && o.muhabirId && !o.talimatVeren && !o.kaynakTuru && !gundemde.has(o.id) && !o.arsiv);
  await arac("oneriPlanaEkle", { oneriId: oneri3.id });
  ok((await p.locator(bekleyen).count()) === 1, "plana ekleme kartı açıldı");
  const planlar = await alan("planId").locator("option").evaluateAll((l) => l.map((o) => o.value));
  const basliklar = () => alan("planBaslikId").locator("option").evaluateAll((l) => l.map((o) => o.value).filter((v) => v && v !== "__yeni").sort().join());
  if (planlar.length > 1) {
    await alan("planId").selectOption(planlar[1]);
    const beklenen = d3.planlar.find((x) => x.id === planlar[1]).basliklar.map((x) => x.id).sort().join();
    ok((await basliklar()) === beklenen, "plan değişince başlıklar o planın");
  } else ok(true, "tek açık plan");
  await alan("planBaslikId").selectOption("__yeni");
  ok((await alan("yeniBaslik").count()) === 1, "yeni başlık seçilince ad soruluyor");
  await alan("yeniBaslik").fill("عنوان من المساعد");
  await yaz("tamam");
  const d4 = await durum();
  ok(d4.oneriler.find((o) => o.id === oneri3.id).durum === "planaEklendi" && d4.basliklar.some((x) => x.ad === "عنوان من المساعد"), "öneri formdaki yeni başlıkla plana girdi");

  // Çoklu seçim: iş birkaç kişiye.
  await arac("isVer", { baslik: "Asistan işi" });
  const kutular = p.locator(`${bekleyen} [data-asistan-alan="kisiler"] input[type=checkbox]`);
  await kutular.nth(0).check();
  await kutular.nth(1).check();
  await p.click(`${bekleyen} [data-asistan-evet]`);
  await p.waitForTimeout(500);
  const is = ((await durum()).isler ?? []).find((x) => x.baslik === "Asistan işi");
  ok(is && is.kisiler.length === 2, "iş seçilen iki kişiye verildi");

  // Duman: her yazma aracı form açıyor (ya da kaydı bulamayınca hata döndürüyor, sayfa çökmüyor).
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const t = new Date();
    t.setDate(t.getDate() + 2);
    d.ozel.push({ id: "oz-asistan", ad: "تغطية", tarih: t.toLocaleDateString("sv"), hazirlik: [], iz: [] });
    localStorage.setItem(k, JSON.stringify(d));
    // İz değişmezse sayfa kaydı yeniden okumaz (getir).
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);
  // Hatırlatma aracı için: son haftanın çağrısı (hazırlıkta).
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik[d.haftalik.length - 1];
    h.durum = "hazirlik";
    const et = "HP-" + h.baslangic.replace(/-/g, "");
    const ms = d.kisiler.filter((x) => x.birim === "muhabir" && (x.eposta || x.kurumEposta)).slice(0, 2).map((x) => x.id);
    if (!d.cagrilar.some((c) => c.etiket === et)) d.cagrilar.unshift({ id: "c-as-hat", tur: "haftalik", tarih: h.baslangic, metin: "نص الطلب", sonSaat: "", olusturan: "pl1", zaman: new Date().toISOString(), kime: "planning@ornek.local", bcc: ms, etiket: et });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);
  const d5 = await durum();
  const plan = d5.planlar.find((x) => x.durum !== "devralindi" && x.basliklar.length) ?? d5.planlar[0];
  const pb = plan.basliklar[0];
  const gel = d5.gelismeler.find((x) => x.planId === plan.id);
  const pk = d5.paketler.find((x) => x.planId === plan.id && x.durum !== "iptal");
  const hf = d5.haftalik[d5.haftalik.length - 1];
  const kalem = hf?.kalemler[0];
  const muh = d5.kisiler.find((k) => k.birim === "muhabir" && !k.pasif);
  const o5 = d5.oneriler.find((o) => ["yeni", "degerlendiriliyor"].includes(o.durum) && o.muhabirId);
  const oz = d5.ozel.find((o) => (o.bitis || o.tarih) >= new Date().toLocaleDateString("sv"));
  const gp = d5.paketler.find((x) => x.gorev && !x.ozelId && !x.planId && !x.masaTakibi && x.muhabirId && ["onaylandi", "uretimde"].includes(x.durum) && !d5.planlar.some((pl) => pl.hazirPaketler.includes(x.id)));
  const DUMAN = [
    ["oneriGir", { muhabirId: muh.id, haberBasligi: "عنوان" }],
    ["oneriGundemeEkle", { oneriId: o5.id }],
    ["oneriDegerlendirmeyeAl", { oneriId: o5.id }],
    ["oneriDuzeltmeIste", { oneriId: o5.id }],
    ["oneriTakibeAl", { oneriId: o5.id }],
    ["oneriPlandanCikar", { oneriId: o5.id }],
    ["oneriArsiveGonder", { oneriId: o5.id }],
    ["oneriMesajiGonder", { oneriId: o5.id }],
    ["muhabireOneriGonder", { muhabirId: muh.id }],
    ["oneriMasayaSor", { oneriId: o5.id }],
    ["oneriGorevlendir", { oneriId: o5.id }],
    ["planBaslikEkle", { planId: plan.id }],
    ["planBaslikCikar", { planId: plan.id, planBaslikId: pb.id }],
    ["gelismeEkle", { planId: plan.id }],
    ["gelismeDuzenle", { gelismeId: gel?.id }],
    ["gelismeSil", { gelismeId: gel?.id }],
    ["basligaMuhabirEkle", { planId: plan.id, planBaslikId: pb.id }],
    ["paketEkle", { planId: plan.id, planBaslikId: pb.id }],
    ["paketKarari", { paketId: pk?.id }],
    ["canliEkle", { planId: plan.id }],
    ["planAkisi", { planId: plan.id }],
    ["hareketKaydet", { kisiId: muh.id }],
    ["nafizeEkle", { planId: plan.id, planBaslikId: pb.id }],
    ["ekibeEkle", { planId: plan.id }],
    ["haftaCanliEkle", {}],
    ["haftaNafizeEkle", {}],
    ["muhabirBilgisiDuzenle", { kisiId: muh.id }],
    ["toplantiNotuEkle", {}],
    ["haftalikPlanAc", {}],
    ["kalemEkle", {}],
    ["kalemKarar", { haftaId: hf?.id, kalemId: kalem?.id }],
    ["haftalikAkisi", { haftaId: hf?.id }],
    ["paketGorevVer", { muhabirId: muh.id }],
    ["ozelIcerikGorevlendir", { ozelId: oz?.id, muhabirId: muh.id }],
    ...(gp ? [["paketiOzeleBagla", { paketId: gp.id, ozelId: oz?.id }]] : []),
    ["paketTeslimGunu", { paketId: pk?.id }],
    ["paketNotu", { paketId: pk?.id }],
    ["paketMetniDuzenle", { paketId: pk?.id }],
    ["isVer", {}],
    ["faaliyetEkle", {}],
    ["postaGonder", { kisiId: muh.id, konu: "Konu" }],
    ["cagriHatirlat", {}],
    ["ozelGorevPostasi", {}],
  ];
  let acilan = 0;
  const acilmayan = [];
  for (const [ad, girdi] of DUMAN) {
    await arac(ad, girdi);
    if ((await p.locator(bekleyen).count()) === 1) {
      acilan++;
      await yaz("hayır");
    } else acilmayan.push(`${ad}:${JSON.stringify(await sonSonuc())}`);
  }
  ok(acilan === DUMAN.length, `yazma araçları form açıyor (${acilan}/${DUMAN.length})${acilmayan.length ? " · " + acilmayan.join(" ") : ""}`);

  // "Hatırlatma gönder": Weekly'nin hatırlatmasıyla aynı iş, ayrı posta yazmıyor.
  await arac("cagriHatirlat", { not: "نذكركم بموعد التسليم" });
  ok((await p.locator(bekleyen).count()) === 1, "hatırlatma onay kartı açıldı");
  await yaz("evet");
  await p.waitForTimeout(500);
  const hc = (await durum()).cagrilar.find((c) => c.id === "c-as-hat" || c.etiket?.startsWith("HP-"));
  ok((hc?.hatirlatmalar?.length ?? 0) >= 1, "hatırlatma çağrıya kaydedildi (Weekly'deki gibi)");

  // Özel yayın görev postası: kartın şablonuyla (konu şablondan), ayrı posta yazılmıyor; kartta "gitti".
  const ozM = d5.kisiler.find((k) => k.birim === "muhabir" && !k.pasif && (k.kurumEposta || k.eposta));
  await p.evaluate(([k, ozId, mId]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const o = d.ozel.find((x) => x.id === ozId);
    d.paketler.push({ id: "p-as-ozg", baslik: "تقرير التغطية الخاصة", aciklama: "", tur: "haber", bicim: "pkg", durum: "onaylandi", muhabirId: mId, sehir: "istanbul", ozelId: ozId, ozelAd: o.ad, gorev: { veren: "pl1", zaman: new Date().toISOString() }, yayinGunu: o.tarih, sonTarih: o.tarih, guncelleme: new Date().toISOString(), notlar: [] });
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, [K, oz.id, ozM.id]);
  await arac("ozelGorevPostasi", { paketId: "p-as-ozg" });
  ok((await p.locator(bekleyen).count()) === 1, "özel yayın görev postası onay kartı açıldı");
  const konuAlani = await p.locator(bekleyen).locator('[data-asistan-alan="konu"]').first().inputValue().catch(() => "");
  ok(konuAlani.includes("تكليف تقرير للتغطية الخاصة"), "konu kartın şablonundan: " + konuAlani);
  await yaz("evet");
  await p.waitForTimeout(500);
  const d6 = await durum();
  ok(!!d6.paketler.find((x) => x.id === "p-as-ozg")?.takdirBildirimi, "içeriğin kartında görev postası gitti işareti");
  ok(d6.postaMesajlari.some((m) => m.giden && m.konu.includes("تكليف تقرير للتغطية الخاصة")), "giden posta şablonun konusuyla");

  // Biçimli yanıt: yıldızlar görünmez, kalın, liste ve kod çizilir.
  await yaz("biçimli yanıt ver");
  const son = p.locator('[data-asistan-ileti="asistan"]').last();
  ok((await son.locator("b").first().innerText()) === "Yarın" && !(await son.innerText()).includes("*"), "kalın yazı yıldızsız");
  ok((await son.locator("ul li").count()) === 2 && (await son.locator("ol li").count()) === 2 && (await son.locator("i").innerText()) === "Gazze" && (await son.locator("code").count()) === 1, "liste, eğik ve kod çizildi");

  // Gezinme.
  await yaz("öneriler sayfası");
  ok(p.url().endsWith("#/oneriler"), "sayfaAc öneriler sayfasını açtı");

  // Konuşma sekmede kalır; temizlenir.
  await git("#/");
  await p.keyboard.press("Control+KeyJ");
  ok((await p.locator("[data-asistan-ileti]").count()) > 0, "konuşma yeniden yüklemede duruyor");
  await p.click("[data-asistan-temizle]");
  ok((await p.locator("[data-asistan-ileti]").count()) === 0, "konuşma temizlendi");

  // Kısıtlı kişi: asistan yok.
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "mu1"));
  await git("#/");
  ok((await p.locator("[data-asistan-ac]").count()) === 0, "muhabirde asistan yok");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
