// Öneri görselleri (demo: küçültülmüş görsel kayıtta; gerçek kipte Drive, gorsel.ts) ve bildirim altyapısı:
// muhabir görsel ekler, kaldırır, gönderir; Planlama öneri penceresinde küçük resmi ve büyük halini görür.
// Servis betiği (sw.js) kaydolur, uygulama tanımı (manifest) standalone; Android uygulama bağı yayında.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
// 2×2 piksellik PNG (kurgusal görsel).
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==", "base64");

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(e.message));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  const kim = async (id) => { await p.goto(B); await p.evaluate((k) => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", k); }, id); };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));

  await kim("mu1");
  await git("#/oneriler/yeni");
  ok((await p.locator("[data-gorsel-ekle]").count()) === 1, "muhabir formunda Görsel ekle");
  const dosya = (ad) => ({ name: ad, mimeType: "image/png", buffer: PNG });
  await p.locator("[data-gorsel-dosya]").setInputFiles([dosya("a.png"), dosya("b.png")]);
  await p.waitForTimeout(800);
  ok((await p.locator("[data-gorsel-alani] .gorsel-kucuk img").count()) === 2, "iki görsel eklendi");
  await p.locator("[data-gorsel-kaldir]").first().click();
  ok((await p.locator("[data-gorsel-alani] .gorsel-kucuk img").count()) === 1, "biri kaldırıldı");
  const strap = "صور من المعبر الحدودي";
  await p.fill("[data-oneri-strap]", strap);
  await p.fill("[data-oneri-gelisme]", "حركة الشاحنات عند المعبر تعود تدريجيا بعد توقف دام عدة أيام بسبب الأحوال الجوية");
  await p.locator(".form-alt button.dugme").last().click();
  await p.waitForTimeout(600);
  const o = (await durum()).oneriler.find((x) => x.paketBasligi === strap);
  ok(o && o.gorseller?.length === 1 && o.gorseller[0].veri?.startsWith("data:image/jpeg"), "kayıtta bir görsel (demoda JPEG'e küçültülmüş)");

  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl2"));
  await git("#/oneriler/" + o.id);
  ok((await p.locator("[data-gorsel-listesi] [data-gorsel]").count()) === 1, "Planlama öneride görseli görüyor");
  await p.locator("[data-gorsel]").first().click();
  await p.waitForTimeout(400);
  ok((await p.locator("dialog[open] .gorsel-buyuk img").count()) === 1, "büyük hali pencerede");

  // Servis betiği ve uygulama tanımı.
  await git("#/");
  await p.waitForTimeout(800);
  ok(await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), "servis betiği kayıtlı");
  const m = await (await p.request.get(B + "manifest.webmanifest")).json();
  ok(m.display === "standalone" && m.icons.some((i) => i.sizes === "512x512"), "manifest standalone, 512 simge");
  const al = await (await p.request.get(B + ".well-known/assetlinks.json")).json();
  ok(al[0].target.package_name === "net.plannersflow.app" && al[0].target.sha256_cert_fingerprints.length === 1, "Android uygulama bağı yayında");
  ok((await p.request.get(B + "indir/plannersflow.apk")).ok(), "APK indirilebilir");
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
