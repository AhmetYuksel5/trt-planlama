// Özel yayının nafizesi (kullanıcı: nafize canlı etkinlik biçiminde, saati sistemin öbür unsurlarıyla
// eş zamanlı; günün planına canlı eklemek gibi): nafize CanliYayin kaydı (ozelId), günün Next Day planı
// açıksa ona bağlanır, açılmamışsa bekler, açılınca bağlanır; Next Day'de "مباشر"da aynı kayıt, oradan
// silinmez. Eski düzenin nafizelerini sistemin açılış işi canlıya çevirir.
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
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const ac = () => p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  const tarihYaz = (loc, deger) =>
    loc.evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, deger);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };
  const YARIN = yerel(1), SONRA = yerel(4);

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/ozel");

  // Örnek verinin eski nafizeleri açılışta canlıya çevrildi.
  let d = await durum();
  ok(d.ozel.every((o) => !o.nafizeler || !o.nafizeler.length), "eski nafizeler özel yayının içinde kalmadı");
  ok(d.canliYayinlar.some((c) => c.ozelId), "eski nafizeler canlı yayın oldu");

  await p.evaluate(([k, bas, bit]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.ozel.push({ id: "oz-n", ad: "تغطية النوافذ", tarih: bas, bitis: bit, hazirlik: [], iz: [] });
    localStorage.setItem(k, JSON.stringify(d));
  }, [K, YARIN, yerel(6)]);
  const yarinPlani = d.planlar.find((x) => x.tarih === YARIN);
  ok(!!yarinPlani, "yarının planı açık");

  const nafizeEkle = async (gun, saat, yer, konu) => {
    await git("#/ozel/oz-n");
    await p.click('[data-ozel-sekme="nafize"]');
    await p.click("[data-nafize-ekle]");
    const f = p.locator("[data-nafize-formu]");
    await f.waitFor();
    await tarihYaz(f.locator("input[data-nafize-tarih]"), gun);
    await f.locator("[data-nafize-saat]").fill(saat);
    await f.locator("[data-nafize-yer]").fill(yer);
    await f.locator("[data-nafize-konu]").fill(konu);
    await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
    await p.waitForTimeout(400);
  };
  await nafizeEkle(YARIN, "16:00", "الدوحة", "نافذة مع ضيف من الدوحة");
  await nafizeEkle(SONRA, "10:30", "عمّان", "نافذة من عمّان");

  d = await durum();
  const n1 = d.canliYayinlar.find((c) => c.ozelId === "oz-n" && c.tarih === YARIN);
  const n2 = d.canliYayinlar.find((c) => c.ozelId === "oz-n" && c.tarih === SONRA);
  ok(!!n1 && n1.saatGmt === "16:00" && n1.yer === "الدوحة", "nafize canlı kaydı olarak açıldı (GMT saat, yer)");
  ok(n1 && yarinPlani && n1.planId === yarinPlani.id, "günün planı açıkken ona bağlandı");
  ok(!!n2 && n2.planId === "", "planı açılmamış gündeki nafize bekliyor");

  // Yayının sayfasında: satır, planın bağı ya da "plan bekliyor"; konuk ve rezervasyon işareti.
  await ac();
  const k1 = p.locator(`[data-nafize="${n1.id}"]`);
  ok((await k1.locator(`[data-nafize-plan="${yarinPlani.id}"]`).count()) === 1, "satırda günün planının bağlantısı");
  ok((await p.locator(`[data-nafize="${n2.id}"] [data-nafize-plan=""]`).count()) === 1, "bekleyen nafizede 'plan açılınca girer'");
  await k1.locator("[data-konuk-ad]").fill("ضيف تجريبي");
  await k1.locator("[data-konuk-ekle]").click();
  await k1.locator('[data-nafize-isaret="rezervasyon"] input').check();
  await p.waitForTimeout(300);
  d = await durum();
  const n1b = d.canliYayinlar.find((c) => c.id === n1.id);
  ok(n1b.konuklar?.some((x) => x.ad === "ضيف تجريبي"), "konuk canlının kaydında");
  ok(!!n1b.rezervasyon, "Satdesk rezervasyonu işaretlendi");
  ok((await k1.locator('[data-nafize-durum="rezervasyon"]').count()) >= 1, "durum rozeti rezervasyon");

  // Next Day: aynı kayıt "مباشر"da, özel yayının adıyla, silme düğmesi yok.
  await git("#/nextday/" + yarinPlani.id);
  await ac();
  const satir = p.locator(`[data-canli-ozel="oz-n"]`);
  ok((await satir.count()) >= 1, "Next Day'de canlı satırında özel yayın işareti");
  const kutu = satir.first().locator("xpath=ancestor::div[contains(@class,'kayit')][1]");
  ok((await kutu.locator('button[aria-label="Sil"]').count()) === 0, "Next Day'de nafizeyi silme düğmesi yok");

  // Planı sonradan açılan gün: açılışta nafize bağlanıyor.
  await p.evaluate(([k, t]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.planlar.push({ id: "nd-" + t, tarih: t, durum: "taslak", ekip: [], gorevlendirmeler: [], hazirPaketler: [], basliklar: [], olusturan: "pl1", olusturma: new Date().toISOString() });
    localStorage.setItem(k, JSON.stringify(d));
  }, [K, SONRA]);
  await git("#/ozel/oz-n");
  d = await durum();
  ok(d.canliYayinlar.find((c) => c.id === n2.id)?.planId === "nd-" + SONRA, "plan açılınca bekleyen nafize ona bağlandı");

  // Gün değişince yeni günün planına geçer.
  await p.click('[data-ozel-sekme="nafize"]');
  await ac();
  await p.locator(`[data-nafize="${n2.id}"] [data-nafize-duzenle]`).click();
  await tarihYaz(p.locator("[data-nafize-formu] input[data-nafize-tarih]"), YARIN);
  await p.locator("[data-nafize-formu] .form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(300);
  d = await durum();
  ok(d.canliYayinlar.find((c) => c.id === n2.id)?.planId === yarinPlani.id, "günü değişen nafize yeni gününün planına geçti");

  // Yarının planını açan sistem nafizeyi önceki günden kopyalamıyor.
  ok(!d.canliYayinlar.some((c) => c.ozelId === "oz-n" && c.devir), "nafize ertesi güne kopyalanmadı");

  // Silme özel yayından: canlı plandan da kalkar.
  await ac();
  await p.locator(`[data-nafize="${n2.id}"] [data-nafize-sil]`).click();
  await p.waitForTimeout(300);
  d = await durum();
  ok(!d.canliYayinlar.some((c) => c.id === n2.id), "silinen nafize canlı kaydından da gitti");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
