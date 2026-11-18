// Hazır paketin yayını planın onayına bağlı (kullanıcı: stoka çevrilen paket yayınlanmış görünmüyor, başka planın
// "Hazır paketler"inde yine seçiliyordu; önce yalnız kalkmış plan devrinde yayınlandı sayılıyordu).
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
const K = "trt-planlama-v25";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const ac = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1200); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await ac("#/nextday/yarin");

  // İki stok paketi kur: biri yarının (onaylanmış sayılacak) planının hazırında, öbürü stokta serbest.
  const ids = await p.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K));
    const planlar = [...d.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih));
    const [yarin, bugun, dun] = planlar;
    const adaylar = d.paketler.filter((x) => !x.ozelId && x.durum !== "iptal").slice(0, 3);
    for (const x of adaylar) Object.assign(x, { stok: true, durum: "tamamlandi", planId: undefined, planBaslikId: undefined, yayinlandi: undefined, isaret: undefined });
    for (const pl of d.planlar) pl.hazirPaketler = pl.hazirPaketler.filter((i) => !adaylar.some((a) => a.id === i));
    yarin.hazirPaketler.push(adaylar[0].id);
    yarin.durum = "onayli";
    bugun.durum = "taslak";
    // Kullanıcının durumu: onaylanmadan günü geçmiş planın hazırındaki paket.
    dun.durum = "taslak";
    dun.hazirPaketler.push(adaylar[2].id);
    localStorage.setItem(K, JSON.stringify(d));
    return { a: adaylar[0].id, b: adaylar[1].id, c: adaylar[2].id, yarin: yarin.id, bugun: bugun.id, dun: dun.id };
  }, K);
  const paket = (id) => p.evaluate(([K, id]) => JSON.parse(localStorage.getItem(K)).paketler.find((x) => x.id === id), [K, id]);

  // 1. Açılış işi: onaylı planın hazırındaki paket yayınlandı alır (devirden önce kalmış kayıt)
  await ac("#/nextday/yarin");
  ok((await paket(ids.a)).yayinlandi?.planId === ids.yarin, "onaylı planın hazır paketi yayınlandı");
  ok((await paket(ids.c)).yayinlandi?.planId === ids.dun, "onaylanmadan günü geçmiş planın hazır paketi de yayınlandı");

  // 2. Bugünün planında "Stoktan seç": yayınlanan paket yok, serbest paket var
  await ac(`#/nextday/${ids.bugun}`);
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  const sec = p.locator('button:has-text("Stoktan seç")').first();
  if (await sec.count()) await sec.click();
  await p.waitForTimeout(300);
  ok((await p.locator(`[data-hazir-sec="${ids.a}"]`).count()) === 0, "yayınlanan paket başka planda seçilemiyor");
  ok((await p.locator(`[data-hazir-sec="${ids.b}"]`).count()) === 1, "stoktaki serbest paket seçilebiliyor");

  // 3. Taslak plana seçilen paket öbür planda seçilmez; o plan onaylanınca yayınlanır
  await p.locator(`[data-hazir-sec="${ids.b}"]`).click(); await p.waitForTimeout(400);
  ok(!(await paket(ids.b)).yayinlandi, "onaylanmamış plana seçilen paket henüz yayınlanmadı");
  await p.evaluate(([K, id]) => { const d = JSON.parse(localStorage.getItem(K)); d.planlar.find((x) => x.id === id).durum = "toplantida"; localStorage.setItem(K, JSON.stringify(d)); }, [K, ids.yarin]);
  await p.evaluate(([K, a]) => { const d = JSON.parse(localStorage.getItem(K)); d.paketler.find((x) => x.id === a).yayinlandi = undefined; localStorage.setItem(K, JSON.stringify(d)); }, [K, ids.a]);
  await ac(`#/nextday/${ids.yarin}`);
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  const sec2 = p.locator('button:has-text("Stoktan seç")').first();
  if (await sec2.count()) await sec2.click();
  await p.waitForTimeout(300);
  ok((await p.locator(`[data-hazir-sec="${ids.b}"]`).count()) === 0, "başka planın hazırındaki paket ikinci plana seçilemiyor");

  // 4. Onay yayınlar, onayı geri almak stoka döndürür (UI: tam yönetici)
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
  await ac(`#/nextday/${ids.yarin}`);
  const onayla = p.locator('button:has-text("Planı onayla")').first();
  ok((await onayla.count()) > 0, "Planı onayla düğmesi var");
  await onayla.click(); await p.waitForTimeout(600);
  ok((await paket(ids.a)).yayinlandi?.planId === ids.yarin, "plan onayıyla hazır paket yayınlandı");
  if (await p.locator(".pb-uc button[aria-haspopup]").count()) { await p.locator(".pb-uc button[aria-haspopup]").click(); await p.waitForTimeout(200); }
  await p.locator("[data-onay-geri]").first().click(); await p.waitForTimeout(500);
  ok(!(await paket(ids.a)).yayinlandi, "onay geri alınınca paket stoka döndü");

  ok(!hatalar.length, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar[0] : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
