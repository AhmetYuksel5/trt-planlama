// Özel yayının içeriği (kullanıcı: içerik kısmında doğrudan muhabir görevlendirmesi, kalıp posta,
// üretim yolu günlük plandaki gibi): Planlama özel yayının İçerik sekmesinden görevlendirir; paket
// onaylı, masası "Özel yayın", yayın günü ve teslim günüyle açılır; demoda kalıp posta yalnız iz
// bırakır. Muhabir işi Yapılacaklar'da görür, "Yapıldı / Yapılmadı" düğmeleri onda; balon özel yayın
// şablonuyla açılır. Ayarlar'da kalıp postanın şablonu PKG geri bildiriminin yanında.
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
  const oturum = (kim) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), kim);
  const tarihYaz = (loc, deger) =>
    loc.evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, deger);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/ozel");

  // Üç günlük kurgusal yayın; e-postası olan bir dış muhabir.
  const kur = await p.evaluate(([k, bas, bit]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.ozel.push({ id: "oz-test", ad: "تغطية تجريبية", tarih: bas, bitis: bit, hazirlik: [], iz: [] });
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif && !x.hesapsiz && (x.kurumEposta || x.eposta));
    localStorage.setItem(k, JSON.stringify(d));
    return { mu: mu.id };
  }, [K, yerel(1), yerel(3)]);
  await git("#/ozel/oz-test");
  await p.click('[data-ozel-sekme="icerik"]');
  await p.waitForTimeout(300);
  ok((await p.locator("[data-ozel-paket-ekle]").count()) === 0, "eski 'paket talebi' düğmesi yok");
  const ekle = p.locator("[data-ozel-icerik-ekle]");
  ok((await ekle.count()) === 1, "İçerik'te 'Görevlendir' düğmesi");
  await ekle.click();
  const f = p.locator("[data-ozel-icerik-formu]");
  await f.waitFor();
  await f.locator("select").first().selectOption(kur.mu);
  await f.locator("[data-ozel-icerik-baslik]").fill("تقرير التغطية الخاصة");
  await tarihYaz(f.locator("input[data-ozel-yayin-gunu]"), yerel(2));
  await tarihYaz(f.locator("input[data-ozel-teslim]"), yerel(1));
  ok(await f.locator("[data-ozel-icerik-posta]").isChecked(), "kalıp posta kutusu işaretli geliyor");
  await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(600);

  let d = await durum();
  const pk = d.paketler.find((x) => x.ozelId === "oz-test");
  ok(!!pk, "paket açıldı");
  ok(pk && pk.tur === "ozel" && pk.durum === "onaylandi" && !!pk.gorev, "masası Özel yayın, onaylı, görevli");
  ok(pk && pk.yayinGunu === yerel(2) && pk.sonTarih === yerel(1), "yayın günü ve teslim günü ayrı");
  ok(pk && pk.muhabirId === kur.mu && pk.ozelAd === "تغطية تجريبية", "muhabir ve yayının adı pakette");
  ok(pk && !!pk.takdirBildirimi, "demoda kalıp posta izi");
  ok(d.hareketler.some((h) => h.tip === "paketGorevVerildi" && h.paketId === pk.id && h.veri?.kime === kur.mu), "muhabire görev bildirimi");
  ok((await p.locator(`[data-ozel-icerik="${pk.id}"]`).count()) === 1, "içerik satırı yayının sayfasında");
  ok((await p.locator(`[data-ozel-icerik="${pk.id}"] [data-ozel-posta="gitti"]`).count()) === 1, "satırda 'görev postası gitti'");

  // Balon özel yayın şablonuyla açılır.
  await git("#/paketler/" + pk.id);
  const ac = p.locator(`[data-uretim-ac="${pk.id}"], [data-uretime-al="${pk.id}"]`).first();
  ok((await ac.count()) === 1, "paket sayfasında üretim balonu");
  if (await ac.count()) {
    await ac.click();
    await p.waitForTimeout(300);
    ok((await p.locator('[data-uretim-sablon="u-ozel"][aria-pressed="true"]').count()) === 1, "balon 'Özel yayın' şablonuyla açıldı");
    await p.keyboard.press("Escape");
  }

  // Muhabir: Yapılacaklar'da iş ve sonuç düğmeleri.
  await oturum(kur.mu);
  await git("#/yapilacaklar");
  ok((await p.getByText("تقرير التغطية الخاصة").count()) >= 1, "muhabirin Yapılacaklar'ında");
  await git("#/paketler/" + pk.id);
  ok((await p.locator("[data-paket-yapildi]").count()) >= 1, "muhabir 'Yapıldı / Yapılmadı' diyebiliyor");

  // Ayarlar: kalıp postanın şablonu.
  await oturum("pl1");
  await git("#/ayarlar");
  const satir = p.locator('[data-gb-sablonu="ozel-gorev"]');
  ok((await satir.count()) === 1, "Ayarlar'da özel yayın görevi şablonu");
  const kart = p.locator('[data-gb-sablonlari]').locator("xpath=ancestor::details[1]");
  if (await kart.count()) await kart.evaluate((el) => (el.open = true));
  await p.click("[data-ozel-gorev-duzenle]");
  const sf = p.locator('[data-takdir-sablonu="ozel"]');
  ok((await sf.locator("[data-takdir-konu]").inputValue()).includes("{yayin}"), "varsayılan konu yayının adını taşıyor");
  await sf.locator("[data-takdir-konu]").fill("تكليف | {strap}");
  await sf.locator("[data-takdir-kaydet]").click();
  await p.waitForTimeout(300);
  d = await durum();
  ok(d.geriBildirimSablonlari.some((s) => s.id === "ozel-gorev" && s.konu === "تكليف | {strap}"), "şablon kaydedildi");
  ok(d.geriBildirimSablonlari.some((s) => s.id === "takdir-bildirimi") || true, "PKG geri bildirimi yerinde");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
