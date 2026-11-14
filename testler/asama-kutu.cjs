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
  ok(hata === 0, "sayfa hatası yok");
  console.log(`${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
