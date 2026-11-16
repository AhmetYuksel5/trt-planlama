// Stok sayfasının beş aşaması (stokAkisi.ts): stok sorumlusu görevlendirilecek paketleri muhabir ve son günle
// toplu görevlendirir; hazır paketi Next Day'e önerir, masaya verir, yayınlandı işaretler ve geri alır; bitişinden
// 21 gün geçen hazır paket "bayatlıyor". Muhabir görevlendirme düğmesini görmez. 390 pikselde taşma yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
const gunEkle = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const asama = async (a) => {
    await p.click(`[data-stok-asama="${a}"]`);
    await p.waitForTimeout(250);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl6", "#/stok");

  // 1. Beş aşama ve sayıları.
  const asamalar = await p.locator("[data-stok-asama]").evaluateAll((e) => e.map((x) => x.getAttribute("data-stok-asama")));
  ok(asamalar.join() === "gorevlendirilecek,muhabirde,uretimde,hazir,yayinlandi", `beş aşama (${asamalar})`);

  // 2. Toplu görevlendirme: hepsini seç, son gün hepsine, muhabir satırda.
  const satirlar = await p.locator("[data-stok-satir]").evaluateAll((e) => e.map((x) => x.getAttribute("data-stok-satir")));
  ok(satirlar.length >= 1, "görevlendirilecek paket var");
  await p.check("[data-stok-hepsi]");
  await p.locator("[data-stok-toplu-gun]").fill(gunEkle(5));
  for (const id of satirlar) await p.locator(`[data-stok-satir="${id}"] select`).first().selectOption("mu2");
  await p.click("[data-stok-toplu-gorev]");
  await p.waitForTimeout(400);
  let d = await veri();
  const g = d.paketler.find((x) => x.id === satirlar[0]);
  ok(g.gorev?.veren === "pl6" && g.sonTarih === gunEkle(5) && g.muhabirId === "mu2", "görev, son gün ve muhabir yazıldı");
  ok(g.kunye?.gorevlendiren?.kisiId === "pl6" || JSON.stringify(g.kunye ?? {}).includes("pl6"), "künyede görevlendiren");
  ok(d.hareketler.some((h) => h.tip === "paketGorevVerildi" && h.paketId === g.id && h.veri.kime === "mu2"), "muhabire bildirim");
  ok((await p.locator("[data-stok-satir]").count()) === 0, "görevlendirilen listeden çıktı");
  await asama("muhabirde");
  ok((await p.locator(`[data-stok-paket="${g.id}"]`).count()) === 1, "paket Muhabirde aşamasında");

  // 3. Hazır: Next Day'e öner, masaya ver, yayınlandı.
  await asama("hazir");
  const hazirlar = await p.locator("[data-stok-paket]").evaluateAll((e) => e.map((x) => x.getAttribute("data-stok-paket")));
  ok(hazirlar.length >= 3, `hazır paketler (${hazirlar.length})`);
  const [h1, h2, h3] = hazirlar;
  const nd = p.locator(`[data-stok-nd-oner="${h1}"]`);
  const plan = await nd.locator("option").nth(1).getAttribute("value");
  await nd.selectOption(plan);
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.planlar.find((x) => x.id === plan).hazirPaketler.includes(h1), "Next Day'in hazır paketlerine girdi");
  ok((await p.locator(`[data-stok-paket="${h1}"] [data-stok-onerildi="${plan}"]`).count()) === 1, "satırda önerildiği plan");

  await p.locator(`[data-stok-masaya="${h2}"]`).selectOption("program");
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.paketler.find((x) => x.id === h2).masaTakibi === "program", "Programlar masasının takibine geçti");
  ok((await p.locator(`[data-stok-paket="${h2}"] [data-stok-masada="program"]`).count()) === 1, "satırda masada");

  await p.click(`[data-stok-yayinlandi="${h3}"]`);
  await p.waitForTimeout(300);
  d = await veri();
  ok(!!d.paketler.find((x) => x.id === h3).yayinlandi, "yayınlandı işaretlendi");
  ok(d.hareketler.some((h) => h.tip === "stokYayinIsaretlendi" && h.paketId === h3), "yayın hareketi");
  await asama("yayinlandi");
  ok((await p.locator(`[data-stok-paket="${h3}"]`).count()) === 1, "Yayınlandı aşamasında");
  await p.click(`[data-stok-yayin-geri="${h3}"]`);
  await p.waitForTimeout(300);
  d = await veri();
  ok(!d.paketler.find((x) => x.id === h3).yayinlandi, "yayın geri alındı");

  // 4. Program masası paketi İçerikler'de görür ve yayın kararını verir.
  await gir("pr1", "#/programlar/icerikler");
  await p.click('[data-prg-alan="hazir"]');
  await p.waitForTimeout(250);
  ok((await p.locator(`[data-prg-icerik="${h2}"]`).count()) === 1, "masanın İçerikler'inde");
  await p.click(`[data-prg-icerik="${h2}"] [data-masa-yayinlandi]`);
  await p.waitForTimeout(300);
  d = await veri();
  ok(d.paketler.find((x) => x.id === h2).yayinlandi?.masa === "program", "masa yayınladı");

  // 5. Bayatlayan hazır paket.
  await gir("pl6", "#/stok");
  await p.evaluate(([k, id, z]) => {
    const d = JSON.parse(localStorage.getItem(k));
    const x = d.paketler.find((y) => y.id === id);
    x.muhabirTeslimi = z;
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, [K, h1, gunEkle(-30) + "T10:00:00.000Z"]);
  await gir("pl6", "#/stok");
  await asama("hazir");
  ok((await p.locator(`[data-stok-paket="${h1}"] [data-stok-bayat]`).count()) === 1, "30 günlük hazır paket bayatlıyor");
  ok((await p.locator('[data-stok-asama="hazir"] .sa-uyari').count()) === 1, "aşamada bayat sayısı");

  // 6. Muhabir stok sayfasını açamaz; Newsdesk görür ama görevlendiremez.
  await gir("nd3", "#/stok");
  ok((await p.locator("[data-stok-toplu-gorev]").count()) === 0, "stok ekibi dışında görevlendirme yok");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pl6", "#/stok");
    for (const a of ["gorevlendirilecek", "muhabirde", "hazir", "yayinlandi"]) {
      await asama(a);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok (${a}, ${dil})`);
    }
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
