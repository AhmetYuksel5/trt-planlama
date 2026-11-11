// Künye (kullanıcı: biten paketin ve canlının kimlik kartı, "direkt kim yaptıysa onun adı"; Muhasebe'ye de gitsin):
// adım yapıldığı an pakete yazılıyor; paket sayfasında, plan ekranının canlı satırında ve Muhasebe dökümünde görünüyor.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24") || "{}"));
  const rol = (kap, r) => p.locator(`${kap} [data-kunye-rol="${r}"]`);

  // 1. Planlama görev verir, muhabir "Yapıldı" der, tam yönetici onaylar
  await gir("pl1", "#/paketler");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await p.locator("[data-gorev-formu] select").first().selectOption("mu2");
  await p.locator("[data-gorev-baslik]").fill("تقرير البطاقة التعريفية");
  await p.locator("[data-gorev-gonder]").click(); await p.waitForTimeout(400);
  const pk = (await veri()).paketler.find((x) => x.baslik === "تقرير البطاقة التعريفية");
  ok(!!pk, "görev paketi açıldı");
  await gir("mu2", "#/oneriler");
  await p.locator(`[data-paket="${pk.id}"] [data-paket-yapildi]`).click(); await p.waitForTimeout(400);
  ok(!!(await veri()).paketler.find((x) => x.id === pk.id).isaret, "muhabir Yapıldı dedi");
  ok(!(await veri()).paketler.find((x) => x.id === pk.id).kunye, "onaydan önce künye boş (görev Paket.gorev'de)");
  await gir("yo3", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-kunye]").count()) === 0, "bitmemiş pakette künye kartı yok");
  await p.locator("[data-isaret-onayla]").first().click(); await p.waitForTimeout(500);
  const bitti = (await veri()).paketler.find((x) => x.id === pk.id);
  ok(bitti.durum === "tamamlandi" && bitti.kunye?.onaylayan?.[0]?.kisiId === "yo3", "onaylayan künyeye adıyla yazıldı");

  // 2. Paket sayfasında künye: görevlendiren, muhabir, onaylayan
  await gir("pl1", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-kunye]").count()) === 1, "biten pakette künye kartı");
  for (const r of ["gorevlendiren", "muhabir", "onaylayan"]) ok((await rol("[data-kunye]", r).count()) === 1, `künyede ${r} satırı`);
  ok((await rol("[data-kunye]", "metin").count()) === 0, "boş rol (metin düzelten) çizilmiyor");
  const adlar = await p.locator("[data-kunye]").innerText();
  const kisi = (id) => p.evaluate((i) => JSON.parse(localStorage.getItem("trt-planlama-v24")).kisiler.find((k) => k.id === i).ad.ar, id);
  ok(adlar.includes(await kisi("pl1")) && adlar.includes(await kisi("yo3")), "satırlarda kişinin kendi adı (birim değil)");

  // 3. Muhabir kendi paketinin künyesini görüyor
  await gir("mu2", `#/paketler/${pk.id}`);
  ok((await p.locator("[data-kunye]").count()) === 1, "muhabir kendi künyesini görüyor");

  // 4. Muhasebe: muhabirin sayfasında işin satırı açılınca künye
  await gir("mh1", "#/muhasebe/muhabir/mu2");
  const satir = p.locator(`[data-mh-is="${pk.id}"]`);
  ok((await satir.count()) === 1, "iş Muhasebe'de muhabirin bu ayında");
  await satir.locator("summary").click(); await p.waitForTimeout(200);
  ok((await rol(`[data-mh-is="${pk.id}"]`, "onaylayan").count()) === 1 && (await rol(`[data-mh-is="${pk.id}"]`, "gorevlendiren").count()) === 1, "Muhasebe satırında künye (görevlendiren, onaylayan)");

  // 5. Canlı: Newsdesk yapıldı işaretleyince satırda künye
  await gir("nd1", "#/nextday/yarin");
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  await p.waitForTimeout(200);
  const isaret = p.locator('.canli-sonuc button[aria-label="Canlı yapıldı"]').first();
  if (await isaret.count()) {
    await isaret.click(); await p.waitForTimeout(400);
    const c = (await veri()).canliYayinlar.find((x) => x.sonuc?.kisiId === "nd1");
    ok(!!c && (await p.locator(`[data-canli-kunye="${c.id}"]`).count()) === 1, "yapılmış canlının satırında künye");
    await p.locator(`[data-canli-kunye="${c.id}"] > summary`).click(); await p.waitForTimeout(200);
    ok((await rol(`[data-canli-kunye="${c.id}"]`, "yapildi").count()) === 1, "canlı künyesinde yapıldı işaretleyen");
  } else ok(false, "planda işaretlenecek canlı yok");

  // 6. 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const [kim, yol] of [["pl1", `#/paketler/${pk.id}`], ["mh1", "#/muhasebe/muhabir/mu2"]]) {
      await gir(kim, yol);
      await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
      await p.waitForTimeout(150);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${yol}): ${t}`);
    }
  }

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
