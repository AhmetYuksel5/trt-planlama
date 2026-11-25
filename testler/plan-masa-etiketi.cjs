// Next Day'de masanın işi etiketli (kullanıcı: plana eklenen öneri ekonomi için yapılıyorsa ekonomi etiketiyle plan
// metnine girsin, öbür birimler için de): gelişme ve PKG'nin üstünde birimin Arapça adı; aynı önerinin PKG'si tekrar etmez.
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); });
  await git("#/oneriler");

  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    plan.durum = "taslak";
    const pb = plan.basliklar[0];
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif);
    const z = new Date().toISOString();
    const oneri = (id, tur, ek = {}) => ({ id, muhabirId: mu.id, ulke: "turkiye", haberBasligi: "عنوان " + id, gelisme: "تطور " + id, paketBasligi: "تقرير " + id, tur, bicim: "pkg", sahaGerekli: false, zaman: z, kanal: "sistem", hedefTarih: plan.tarih, durum: "planaEklendi", planId: plan.id, ...ek });
    d.oneriler.unshift(oneri("o-ek", "ekonomi"), oneri("o-hb", "haber"), oneri("o-pr", "haber", { masa: "program", giren: "pr1" }));
    const gel = (id, oneriId) => ({ id, planId: plan.id, planBaslikId: pb.id, metin: "تطور " + oneriId, kaynakTuru: "muhabir", kaynakAdi: "", tarih: z, onerenId: mu.id, oneriId });
    d.gelismeler.push(gel("g-ek", "o-ek"), gel("g-hb", "o-hb"), gel("g-pr", "o-pr"));
    const pak = (id, tur, oneriId) => ({ id, kod: "TRTA_" + id, planId: plan.id, planBaslikId: pb.id, baslik: "تقرير " + id, sehir: mu.sehir, muhabirId: mu.id, tur, bicim: "pkg", durum: "onaylandi", sahaGerekli: false, notlar: [], olusturma: z, guncelleme: z, ...(oneriId && { oneriId }) });
    d.paketler.unshift(pak("p-ek", "ekonomi", "o-ek"), pak("p-sp", "spor"), pak("p-hb", "haber", "o-hb"));
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    return { plan: plan.id };
  }, K);

  for (const yol of [`#/nextday/${ids.plan}/cikti`, `#/nextday/${ids.plan}/belge`, `#/nextday/${ids.plan}`]) {
    await git(yol);
    await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
    const et = async (id) => ((await p.locator(`[data-plan-masa="${id}"]`).count()) ? (await p.locator(`[data-plan-masa="${id}"]`).first().innerText()).trim() : "");
    const ek = await et("g-ek"), sp = await et("p-sp"), pr = await et("g-pr");
    ok(ek.length > 0, `${yol}: ekonomi önerisinin gelişmesi etiketli (${ek})`);
    ok(sp.length > 0 && sp !== ek, `${yol}: spor PKG'si kendi biriminin adıyla (${sp})`);
    ok(pr.length > 0 && pr !== ek && pr !== sp, `${yol}: Programlar'ın önerisi program etiketli (${pr})`);
    ok(!(await et("g-hb")) && !(await et("p-hb")), `${yol}: haber masasının işi etiketsiz`);
    ok(!(await et("p-ek")), `${yol}: aynı önerinin PKG'si etiketi tekrar etmiyor`);
    ok(/[؀-ۿ]/.test(ek + sp + pr), `${yol}: etiket Arapça`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
