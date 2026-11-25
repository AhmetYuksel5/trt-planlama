// Weekly'de günün gündemi Next Day'in başlık altıyla eş (kullanıcı: Weekly'nin tasarımı kalsın, yetenekler
// birebir aynı olsun): kalemde saat ("12G"), Schedule, Teams ve muhabirin o günkü yeri; dosyada başlığın
// muhabirleri (yer, not), LIVE; hızlı ekleme satırı; başka dosyaya katma; belgede de aynısı; Next Day'e
// aktarımda hepsi başlığa ve gelişmeye taşınır.
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
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); });
  await git("#/haftalik");
  // Haftayı yarının Next Day planının haftasına kurar: aktarım o plana gitsin.
  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].filter((x) => x.durum === "taslak").sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    const t = new Date(plan.tarih + "T12:00:00Z");
    const cumartesi = new Date(t.getTime() - ((t.getUTCDay() + 1) % 7) * 864e5).toISOString().slice(0, 10);
    d.haftalik = d.haftalik.filter((x) => x.baslangic !== cumartesi);
    const h = d.haftalik[0];
    h.baslangic = cumartesi;
    h.durum = "hazirlik";
    const aktif = d.basliklar.filter((x) => x.aktif !== false && !plan.basliklar.some((pb) => pb.baslikId === x.id));
    const [x, y] = aktif;
    const muh = d.kisiler.filter((z) => z.birim === "muhabir" && !z.pasif);
    h.kalemler = [
      { id: "es-1", karar: "bekliyor", tarih: plan.tarih, baslikId: x.id, tur: "haber", yer: "", metin: "تطور أول", bicimler: [], muhabirler: [] },
      { id: "es-2", karar: "bekliyor", tarih: plan.tarih, baslikId: y.id, tur: "haber", yer: "", metin: "تطور في ملف آخر", bicimler: [], muhabirler: [] },
    ];
    h.dosyalar = [x.id, y.id];
    h.canlilar = []; h.nafizeler = []; h.dosyaBilgileri = [];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, gun: plan.tarih, planId: plan.id, x: x.id, y: y.id, m1: muh[0].id, m2: muh[1].id };
  }, K);
  await git("#/haftalik/" + ids.hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const grupX = () => p.locator(".dosya-grubu", { has: p.locator("[data-kalem='es-1']") });

  // Kalemi düzenle: saat, muhabir ve yeri, Teams, Schedule.
  await p.locator("[data-kalem='es-1'] .islemler button").first().click();
  let form = p.locator(".dosya-grubu .form-kutu").first();
  await form.locator("[data-kalem-saat]").fill("12:00");
  await form.locator("[data-kalem-saat]").press("Tab");
  await form.locator("select").filter({ has: p.locator(`option[value="${ids.m1}"]`) }).first().selectOption(ids.m1);
  await form.locator(`[data-kalem-muhabir-yer="${ids.m1}"]`).fill("رفح");
  await form.locator("[data-teams-ad]").fill("فريق تجريبي");
  await form.locator("[data-teams-ekle]").click();
  await form.locator("[data-schedule-kutusu]").check();
  await form.locator("[data-program] input:not([inputmode])").last().fill("وصول الوفد").catch(async () => { await form.locator("[data-program] input").last().fill("وصول الوفد"); });
  await form.locator("button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  let h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  let k1 = h.kalemler.find((k) => k.id === "es-1");
  ok(k1.saat === "12:00", "kalemin saati kaydedildi");
  ok(k1.muhabirYerleri?.[ids.m1] === "رفح", "muhabirin yeri kaydedildi");
  ok(k1.teams?.some((x) => x.ad === "فريق تجريبي"), "Teams kaydedildi");
  ok(k1.program?.some((x) => x.olay === "وصول الوفد"), "Schedule kaydedildi");
  const kart = p.locator("[data-kalem='es-1']");
  ok((await kart.locator("[data-gelisme-saat-eki]").innerText()).includes("12"), "kartta saat eki");
  ok((await kart.locator("[data-schedule]").count()) === 1 && (await kart.locator("[data-gelisme-teams]").count()) === 1, "kartta SCHEDULE ve TEAMS");
  ok((await kart.innerText()).includes("رفح"), "kartta muhabirin yeri");

  // Hızlı ekleme satırı: "YER / metin" + Enter.
  const hizli = grupX().locator("[data-hf-hizli-ekle]");
  await hizli.fill("القدس / تطور سريع");
  await hizli.press("Enter");
  await p.waitForTimeout(400);
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  ok(h.kalemler.some((k) => k.metin === "تطور سريع" && k.yer === "القدس" && k.baslikId === ids.x && k.tarih === ids.gun), "hızlı ekleme kalem açtı");
  // "/" menüsü
  await hizli.fill("/");
  ok((await grupX().locator("[data-hizli-secenek]").count()) >= 4, "hızlı ekleme '/' menüsü");
  await hizli.press("Escape");

  // Dosyanın muhabiri (yer, not) ve LIVE.
  await grupX().locator("[data-dosya-muhabir-ac] button").click();
  const pen = p.locator("dialog[open] [data-dosya-muhabir-formu]");
  await pen.locator("select").first().selectOption(ids.m2);
  await p.waitForTimeout(200);
  await pen.locator("[data-dosya-muhabir-yer]").fill("غزة");
  await pen.locator("[data-dosya-muhabir-not]").fill("تابع المعبر");
  await pen.locator("[data-dosya-muhabir-not]").press("Tab");
  await pen.locator("[data-live]").check();
  await p.waitForTimeout(300);
  await p.keyboard.press("Escape");
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  const db = h.dosyaBilgileri?.find((x) => x.baslikId === ids.x && x.tarih === ids.gun);
  ok(db?.live && db.muhabirler.some((m) => m.kisiId === ids.m2 && m.yer === "غزة" && m.not === "تابع المعبر"), "dosyanın muhabiri (yer, not) ve LIVE");
  ok((await grupX().locator("[data-live-satir]").count()) === 1 && (await grupX().locator(`[data-dosya-muhabir="${ids.m2}"]`).count()) === 1, "dosyanın satırları ekranda");

  // Başka dosyaya kat: Y, X'e.
  const grupY = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='es-2']") });
  await grupY.locator("[data-dosya-kat] button").click();
  await p.locator(`dialog[open] [data-kat-hedef="${ids.x}"]`).click();
  await p.waitForTimeout(400);
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  ok(h.kalemler.find((k) => k.id === "es-2").baslikId === ids.x, "dosya başka dosyaya katıldı");

  // Belgede de aynı satırlar.
  await git("#/haftalik/" + ids.hid + "/belge");
  ok((await p.locator("[data-live-satir]").count()) >= 1 && (await p.locator(`[data-dosya-muhabir="${ids.m2}"]`).count()) >= 1, "belgede dosyanın muhabiri ve LIVE");
  ok((await p.locator("[data-gelisme-saat-eki]").count()) >= 1 && (await p.locator("[data-schedule]").count()) >= 1 && (await p.locator("[data-gelisme-teams]").count()) >= 1, "belgede saat, SCHEDULE, TEAMS");

  // Kesinleşince Next Day'e: başlığın muhabiri yer ve notuyla, LIVE, gelişmenin saati, Schedule, Teams.
  await p.evaluate(([k, hid]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.id === hid);
    h.durum = "kesinlesti";
    h.kalemler.forEach((x) => (x.karar = "kabul"));
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, [K, ids.hid]);
  await git("#/");
  await p.waitForTimeout(800);
  const d = await oku();
  const plan = d.planlar.find((x) => x.id === ids.planId);
  const pb = plan.basliklar.find((x) => x.baslikId === ids.x);
  ok(!!pb, "dosya Next Day'de başlık oldu");
  ok(pb?.live === true, "LIVE başlığa geçti");
  ok(pb?.muhabirler.some((m) => m.kisiId === ids.m2 && m.yer === "غزة" && m.not === "تابع المعبر"), "dosyanın muhabiri yer ve notuyla başlıkta");
  ok(pb?.muhabirler.some((m) => m.kisiId === ids.m1 && m.yer === "رفح"), "kalemin muhabiri yeriyle başlıkta");
  const g = d.gelismeler.find((x) => x.haftalikKalemId === "es-1");
  ok(g?.saat === "12:00" && g.program?.length === 1 && g.teams?.length === 1, "gelişmeye saat, Schedule, Teams geçti");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
