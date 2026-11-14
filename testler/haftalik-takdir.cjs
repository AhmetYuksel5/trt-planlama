// Weekly ⋯ › "Kabul edilen paketler": kesinleşen haftanın kabul edilen paketleri listelenir, seçilene görevlendirme
// postası gider (demoda yalnız işaret). Postası gitmemiş Weekly paketi Next Day'in "Sıradaki" kartında hatırlatılır;
// gönderilince hatırlatma kalkar. Reddedilen kalem listede yok.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? gec++ : (kal++, console.log("✗", ad)));
  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "pl1");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik");
  await p.waitForTimeout(1200);
  const { hid, kid, planId } = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const m = d.kisiler.find((x) => x.birim === "muhabir" && x.eposta && !x.hesapsiz);
    const h = d.haftalik[0];
    h.durum = "kesinlesti";
    const temel = { tur: "feature", bicimler: ["pkg"], muhabirler: [m.id], metin: "تفاصيل التقرير", karar: "kabul" };
    h.kalemler = [
      { ...temel, id: "kl-takdir-1", paketBasligi: "تقرير مقبول للاختبار" },
      { ...temel, id: "kl-takdir-ret", paketBasligi: "تقرير مرفوض", karar: "bilgi" },
    ];
    const plan = d.planlar.find((x) => x.durum === "taslak");
    const ornek = d.paketler[0];
    d.paketler.unshift({ ...ornek, id: "p-takdir-test", planId: plan.id, durum: "onaylandi", muhabirId: m.id, muhabirTbc: undefined, ozelId: undefined, haftalikKalemId: "kl-takdir-1", takdirBildirimi: undefined, baslik: "تقرير مقبول للاختبار" });
    localStorage.setItem(k, JSON.stringify(d));
    return { hid: h.id, kid: "kl-takdir-1", planId: plan.id };
  }, K);

  // Next Day'de hatırlatma.
  await p.goto("about:blank");
  await p.goto(B + "#/nextday/" + planId);
  await p.waitForTimeout(1200);
  ok((await p.locator("[data-haftalik-takdir]").count()) === 1, "Next Day'de Weekly posta hatırlatması");

  // Weekly ⋯ › Kabul edilen paketler.
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1000);
  await p.locator(".plan-basi [aria-haspopup], .plan-basi .dugme-ikon").last().click();
  await p.locator('[data-arac="kabul-paketler"]').click();
  await p.waitForTimeout(400);
  const satirlar = await p.locator("dialog [data-takdir-paket]").evaluateAll((l) => l.map((e) => e.getAttribute("data-takdir-paket")));
  ok(satirlar.length === 1 && satirlar[0] === kid, "yalnız kabul edilen paket listede: " + satirlar);
  await p.locator("dialog [data-takdir-onizle]").first().click();
  ok(/تقرير مقبول للاختبار/.test(await p.locator("dialog [data-takdir-onizleme]").innerText()), "önizlemede strap");
  await p.locator("dialog [data-takdir-gonder]").click();
  await p.waitForTimeout(600);
  ok((await p.locator("dialog [data-takdir-gitti]").count()) === 1, "gönderildi rozeti");
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  ok(!!d.haftalik.find((h) => h.id === hid).kalemler.find((k) => k.id === kid).takdirBildirimi, "kalemde iz");
  ok(!!d.paketler.find((x) => x.id === "p-takdir-test").takdirBildirimi, "doğmuş pakette iz");

  await p.goto(B + "#/nextday/" + planId);
  await p.waitForTimeout(1000);
  ok((await p.locator("[data-haftalik-takdir]").count()) === 0, "gönderilince hatırlatma kalktı");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
