// Aşama kutuları (belgeler/asama-kutulari-brifing.md): iş kutunun içinde; şimdiki kutu açık,
// geçmiş kutuda yapanlar, gelecekte kimin yapacağı; ilerleyince yeni kutuya geçilir.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  let hata = 0;
  p.on("pageerror", (e) => (hata++, console.log("HATA", String(e))));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0, kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  const kim = async (id, dil = "tr") => {
    await p.goto(B);
    await p.evaluate(([id, dil]) => { localStorage.setItem("trt-planlama-oturum", id); localStorage.setItem("trt-planlama-dil", dil); }, [id, dil]);
  };
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(900); };

  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await kim("nd1");
  await git("#/paketler");
  // Görevlendirmede bekleyen balonlu paket; görevi şablona göre Newsdesk ya da Planlama veriyor.
  const [pid, kisi] = await p.evaluate((k) => {
    const x = JSON.parse(localStorage.getItem(k)).paketler.find((x) => x.durum === "uretimde" && x.uretim && x.adim === "newsdesk");
    return [x?.id, x?.uretim?.yol?.gorev === "planlama" ? "pl1" : "nd1"];
  }, K);
  ok(!!pid, "demoda görevlendirmede bekleyen balonlu paket var");
  await kim(kisi);
  await git("#/paketler/" + pid);

  // Masaüstü: liste solda, içerik sağda; şimdiki kutu açık ve işi içinde.
  ok((await p.locator("[data-asama-listesi] [data-asama-kutu]").count()) >= 4, "kutular listede");
  ok((await p.locator('[data-asama-kutu].acik[data-asama-durum="simdi"]').count()) === 1, "şimdiki kutu açık");
  const yan = p.locator(".asama-yan");
  ok((await yan.count()) === 1, "masaüstünde içerik yan sütunda");
  ok((await yan.locator("[data-asama-kimde]").count()) === 1, "şimdiki kutuda kimde satırı");
  ok((await yan.locator("button").count()) > 0, "şimdiki kutuda işin düğmesi");
  const bas = await p.locator("[data-asama-kutulari]").boundingBox();
  const lb = await p.locator("[data-asama-listesi]").boundingBox();
  const yb = await yan.boundingBox();
  ok(lb.width < bas.width / 2 && Math.abs(lb.y - yb.y) < 4, "iki sütun");

  // Geçmiş kutu: yapanlar ya da "Yapıldı"; gelecekte kimin yapacağı.
  await p.locator('[data-asama-kutu="planlama"] button').click();
  ok((await yan.getAttribute("data-asama-icerik")) === "planlama", "geçmiş kutu seçildi");
  ok((await yan.locator("[data-kunye], p").count()) > 0, "geçmiş kutuda künye ya da yapıldı");
  await p.locator('[data-asama-kutu="tamam"] button').click();
  ok(/yapacak|sırası gelmedi/i.test(await yan.innerText()), "gelecek kutuda kimin yapacağı: " + (await yan.innerText()).replace(/\n/g, " "));

  // Seçim geri dönünce kalır (geçmiş adımında).
  await p.goto(B + "#/paketler"); await p.waitForTimeout(500); await p.goBack(); await p.waitForTimeout(900);
  ok((await p.locator('[data-asama-kutu="tamam"].acik').count()) === 1, "geri gelince seçili kutu yerinde");

  // İlerleyince yeni kutu: seçimsiz açılışta Newsdesk görev verir, şimdiki kutu metne geçer.
  await git("#/paketler/" + pid);
  const once = await p.locator('[data-asama-kutu].acik').getAttribute("data-asama-kutu");
  const dugme = p.locator('.asama-yan button.dugme').first();
  await dugme.click(); await p.waitForTimeout(700);
  const sonra = await p.locator('[data-asama-kutu].acik').getAttribute("data-asama-kutu");
  ok(once !== sonra, `iş ilerleyince açık kutu değişti (${once} → ${sonra})`);

  // Telefon: içerik açık kutunun içinde, tekrar basınca kapanır; taşma yok (Türkçe, Arapça).
  await p.setViewportSize({ width: 390, height: 840 });
  for (const dil of ["tr", "ar"]) {
    await kim(kisi, dil);
    await git("#/paketler/" + pid);
    ok((await p.locator(".asama-yan").count()) === 0, dil + ": telefonda yan sütun yok");
    ok((await p.locator("[data-asama-kutu].acik [data-asama-icerik]").count()) === 1, dil + ": içerik açık kutunun içinde");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(tasma <= 0, dil + ": 390px taşma " + tasma);
    await p.locator("[data-asama-kutu].acik button").first().click();
    ok((await p.locator("[data-asama-icerik]").count()) === 0, dil + ": açık kutuya basınca kapandı");
  }

  // Sade akış (balonsuz onaylı paket): üç kutu.
  await kim("pl1"); await p.setViewportSize({ width: 1440, height: 1000 });
  await git("#/paketler");
  const sade = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).paketler.find((x) => x.durum === "onaylandi" && !x.uretim && !x.ozelId && !["ekonomi", "program", "spor"].includes(x.tur))?.id, K);
  if (sade) {
    await git("#/paketler/" + sade);
    ok((await p.locator('[data-asama-kutu^="sade-"]').count()) === 3, "sade akışta üç kutu");
  }

  // 2. parti: kutuların içerikleri.
  await kim("pl1"); await git("#/paketler");
  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    return {
      gfx: d.paketler.find((x) => x.durum === "uretimde" && x.uretim?.parca?.gfx)?.id,
      oneri: d.paketler.find((x) => x.durum === "uretimde" && x.uretim && x.oneriId && x.planId)?.id,
      ozel: d.paketler.find((x) => x.ozelId && x.durum !== "iptal")?.id,
      iptal: d.paketler.find((x) => x.durum === "iptal" && !x.ozelId)?.id,
    };
  }, K);
  if (ids.gfx) {
    await git("#/paketler/" + ids.gfx);
    ok((await p.locator('[data-asama-kutu="gfx"].yan-is').count()) === 1, "gfx'li pakette yan iş kutusu");
    await p.locator('[data-asama-kutu="gfx"] button').click();
    ok((await p.locator('[data-asama-icerik="gfx"]').count()) === 1, "gfx kutusu açılıyor");
  } else ok(false, "demoda gfx'li paket yok");
  await git("#/paketler/" + ids.oneri);
  await p.locator('[data-asama-kutu="planlama"] button').click();
  const pl = p.locator('[data-asama-icerik="planlama"]');
  ok((await pl.locator('a[href^="#/oneriler/"]').count()) === 1 && (await pl.locator('a[href^="#/nextday/"]').count()) === 1, "Planlama kutusunda öneri ve plan");
  ok((await pl.locator("[data-uretim-ozet]").count()) === 1, "Planlama kutusunda üretim şablonu");
  ok((await p.locator('.kart a[href^="#/oneriler/"]').count()) === 0, "öneri bağlantısı Bilgiler kartında tekrar edilmiyor");
  if (ids.ozel) {
    await git("#/paketler/" + ids.ozel);
    ok((await p.locator('[data-asama-kutu^="oz-"]').count()) === 5, "özel yayın paketinde kendi beş aşaması");
  }
  if (ids.iptal) {
    await git("#/paketler/" + ids.iptal);
    ok((await p.locator(".asama-kutulari.iptal").count()) === 1 && (await p.locator("[data-asama-kutu].acik").count()) === 0, "iptal pakette kutu açık değil");
    await p.locator("[data-asama-kutu] button").first().evaluate((e) => e.click());
    ok((await p.locator("[data-asama-kutu].acik").count()) === 0, "iptal pakette kutu açılmıyor");
  }

  // Dil denetmeni: parça paket sayfasındaki satırın aynısı, onay sorusu yok.
  let soru = 0;
  p.on("dialog", () => soru++);
  await kim("ou2"); await git("#/");
  const dd = p.locator("[data-dd-metin] [data-parca-alan]").first();
  if (await dd.count()) {
    await p.locator("[data-dd-metin] [data-dd-gonder]").first().click(); await p.waitForTimeout(400);
    ok(soru === 0, "dil denetiminde gönderirken onay sorulmadı");
  } else ok(false, "dil denetmeninin sırasında parça yok");
  ok(hata === 0, "sayfa hatası yok");
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
