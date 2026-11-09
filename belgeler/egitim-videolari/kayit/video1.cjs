// Video 1 — Sisteme giriş ve gezinme (senaryo-1-2.md).
const { baslat } = require("./ortak.cjs");

(async () => {
  const klasor = process.argv[2] || "videolar";
  const v = await baslat(klasor);
  const { p, bekle } = v;

  await v.kart("Plannersflow · Eğitim 1", "Sisteme giriş ve gezinme", "Planlama ekibi için");
  await bekle(0.6);
  await v.basla();
  await bekle(3.5);
  await v.kart();
  await bekle(0.5);

  await v.alt("Giriş yapınca ana sayfan açılır.");
  await bekle(5);

  await v.alt("Bir notta adın geçerse burada görünür. ✓ ile \"gördüm\" dersin.");
  await bekle(3.5);
  const gordum = p.locator("[data-anma-gordum]").first();
  if (await gordum.count()) await v.dokun(gordum, 2.5);
  else await bekle(2.5);

  await v.alt("Planlara en kısa yol: renkli kutular.");
  await bekle(6.5);

  await v.alt("Altta bugünkü görevlerin ve son gelen öneriler.");
  await v.kaydir(700);
  await bekle(2);
  await v.kaydir(1300);
  await bekle(2.5);
  await v.kaydir(0);

  await v.alt("Alttaki çubukla sayfalar arasında geçersin.");
  await bekle(3);
  await v.dokun(p.locator(".alt-cubuk > button"), 1);

  await v.alt("Menü'de bütün sayfalar ve dil seçimi var.");
  await bekle(1.5);
  await p.locator(".mobil-menu").evaluate((e) => e.scrollTo({ top: 600, behavior: "smooth" })).catch(() => {});
  await bekle(2.5);
  await v.dokun(p.locator(".mobil-menu-ust button"), 0.6);

  await v.alt("Arama: sayfa, öneri, paket ya da kişi bul.");
  await v.dokun(p.locator("[data-ara]"), 0.6);
  await v.yaz(p.locator("[data-palet] input").first(), "غزة");
  await bekle(3);
  await p.keyboard.press("Escape");
  await bekle(0.6);

  await v.alt("Zil: sana düşen işler ve kararlar.");
  await v.dokun(p.locator("button[title='Bildirimler']").first(), 4);
  await p.keyboard.press("Escape");
  await v.alt();
  await bekle(0.4);

  await v.kart("Plannersflow · Eğitim 1", "Sıradaki: Next Day planı");
  await bekle(3);

  console.log(await v.bitir("01-giris-ve-gezinme"));
})();
