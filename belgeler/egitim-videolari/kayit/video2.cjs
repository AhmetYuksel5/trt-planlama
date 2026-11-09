// Video 2 — Next Day planı, çıktı ve belge (senaryo-1-2.md).
const { baslat } = require("./ortak.cjs");

(async () => {
  const klasor = process.argv[2] || "videolar";
  const v = await baslat(klasor);
  const { p, bekle } = v;

  await v.kart("Plannersflow · Eğitim 2", "Next Day planı", "Doldurma, çıktı ve belge");
  await bekle(0.6);
  await v.basla();
  await bekle(3.5);
  await v.kart();
  await bekle(0.4);

  await v.alt("Yarının planını sistem kendisi açar; sen doldurursun.");
  await bekle(1.5);
  await v.dokun(p.locator(".kisayol-kutulari a:visible, a:visible", { hasText: "Next Day" }).first(), 1.2);
  await bekle(2.5);

  await v.alt("Üstte planın tarihi, durumu ve araçları.");
  await bekle(4.5);

  const bugune = p.locator("[data-bugune-al]");
  if (await bugune.count()) {
    await v.alt("Dünden gelen kayıtlar soluk görünür. Geçerliyse \"Hepsini bugüne al\".");
    await v.goster(bugune);
    await bekle(2.5);
    await v.dokun(bugune, 2.5);
  }

  await v.alt("Haber başlıkları 5. bölümde. Başlığa dokun, içi açılır.");
  const bolum = p.locator("details.bolum", { hasText: "الأحداث الإخبارية" }).locator("> summary");
  await v.dokun(bolum, 1);
  const kart = p.locator("details.baslik-karti").first();
  await v.dokun(kart.locator("> summary"), 2.5);

  await v.alt("Başlığa gelişme ekle: yer ve metin.");
  await v.dokun(kart.locator("button", { hasText: "Gelişme ekle" }), 0.8);
  const form = kart.locator(".form-kutu").first();
  await v.goster(form);
  await v.yaz(form.locator("input").first(), "دمشق");
  await bekle(0.4);
  await v.yaz(form.locator("textarea").first(), "اجتماع لوزراء الخارجية العرب لبحث التطورات الأخيرة");
  await bekle(1);
  await v.dokun(form.locator("button", { hasText: "Kaydet" }), 2);

  await v.alt("Muhabiri seç. Belli değilse TBC, canlı alınabilirse LIVE.");
  await v.dokun(kart.locator("button", { hasText: "Muhabir ata" }), 0.8);
  const secici = kart.locator(".form select").first();
  await v.goster(secici);
  await v.dokun(secici, 0.4);
  const deger = await secici.locator("option").nth(3).getAttribute("value");
  await secici.selectOption(deger);
  await bekle(1.5);
  const live = kart.locator("input[data-live]");
  await v.dokun(live, 2.5);

  await v.alt("Yanlış mı yaptın? ↶ son düzenlemeni geri alır.");
  await v.kaydir(0);
  await bekle(1);
  const geri = p.locator("button[title*='Geri al'], button[aria-label*='Geri al']").first();
  await v.dokun(geri, 3);

  await v.alt("Çıktı önizleme: kurumun belgesi, istediğin tasarımla.");
  await v.dokun(p.locator("button:visible, a:visible", { hasText: "Çıktı önizleme" }).first(), 1.5);
  for (const n of ["2", "4", "Kurum"]) await v.dokun(p.locator("dialog[open] [data-baski]", { hasText: n }).first(), 1.6);
  await v.dokun(p.locator("dialog[open] button", { hasText: "Kapat" }).first().or(p.locator("dialog[open] button[aria-label='Kapat']").first()), 0.6);

  await v.alt("Belgede düzenle: çıktının üstünde satır satır düzelt.");
  await v.dokun(p.locator("a:visible, button:visible", { hasText: "Belgede düzenle" }).first(), 1.5);
  await bekle(1);
  const satir = p.locator(".yerinde[title='Gelişme']").first();
  await v.goster(satir);
  await bekle(1);
  await v.dokun(satir, 0.6);
  const kutu = p.locator("textarea:focus, input:focus").first();
  await kutu.press("Control+End");
  await kutu.pressSequentially(" (محدث)", { delay: 140 });
  await bekle(0.6);
  await kutu.evaluate((e) => e.blur());
  await bekle(2.5);

  await v.alt("Hazır olunca kopyala, Word'e indir ya da yazdır.");
  await v.kaydir(0);
  await bekle(1.2);
  await v.goster(p.locator("button:visible", { hasText: "E-posta için kopyala" }).first());
  await bekle(4);
  await v.alt();

  await v.kart("Plannersflow · Eğitim 2", "Sıradaki: Öneri oluşturma");
  await bekle(3);

  console.log(await v.bitir("02-next-day-plani"));
})();
