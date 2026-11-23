// Belgede başlık sürükleme (kullanıcı: başlıktan tutunca içeriğiyle bütün bölgesi taşınsın, bölge belli
// olsun; yalnız yeri değişsin, başka başlığın içine girmesin; alt satırlar başka başlığa yine taşınır).
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  for (const [dil, gorunum] of [["tr", "klasik"], ["ar", "yeni"]]) {
    const p = await b.newPage({ viewport: { width: 1400, height: 3000 } });
    p.on("pageerror", (e) => hatalar.push(String(e)));
    p.on("dialog", (x) => x.accept());
    const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
    const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1000); };
    await p.goto(B);
    await p.evaluate(([d, g]) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", g); }, [dil, gorunum]);
    // Belge sayfası (klasikte) ya da Yeni görünümün ortasındaki belge.
    const yol = gorunum === "klasik" ? "#/nextday/nd-yarin/belge" : "#/nextday/nd-yarin";
    await git(yol);
    const kur = await p.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem(k));
      const plan = d.planlar.find((x) => x.id === "nd-yarin");
      while (plan.basliklar.length < 3) {
        const bid = "bs-test-" + plan.basliklar.length;
        d.basliklar.push({ id: bid, ad: "عنوان للاختبار " + plan.basliklar.length, etkin: true });
        plan.basliklar.push({ id: "pb-test-" + plan.basliklar.length, baslikId: bid, muhabirler: [] });
      }
      const [b1] = plan.basliklar;
      d.gelismeler.push({ id: "g-bs1", planId: plan.id, planBaslikId: b1.id, metin: "تطور للاختبار", kaynakTuru: "ajans", tarih: plan.tarih });
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
      return plan.basliklar.map((x) => x.id);
    }, K);
    await git(yol);
    const [b1, b2, b3] = kur;
    ok((await p.locator(`[data-nd-baslik="${b1}"] .baslik-tutamak`).count()) === 1, `${dil}/${gorunum}: başlıkta tutamak var`);

    // Sürüklemeyi elle yürüt: bölgenin işaretini ve hedefin kenar işaretini ara adımda görmek için.
    const dt = await p.evaluateHandle(() => new DataTransfer());
    const kaynak = p.locator(`[data-nd-baslik="${b1}"] [data-sur="baslik"]`).first();
    const hedef = p.locator(`[data-nd-baslik="${b3}"] h3`).first();
    await kaynak.dispatchEvent("dragstart", { dataTransfer: dt });
    await hedef.dispatchEvent("dragover", { dataTransfer: dt });
    await p.waitForTimeout(100);
    ok(await p.locator(`[data-nd-baslik="${b1}"]`).first().evaluate((x) => x.classList.contains("baslik-tasiniyor")), `${dil}/${gorunum}: sürüklenen başlığın bütün bölgesi işaretli`);
    ok(await p.locator(`[data-nd-baslik="${b3}"]`).first().evaluate((x) => x.classList.contains("sur-araya-alt") && !x.classList.contains("sur-hedef")), `${dil}/${gorunum}: hedefte içi değil geçeceği kenar işaretli`);
    await hedef.dispatchEvent("drop", { dataTransfer: dt });
    await kaynak.dispatchEvent("dragend", { dataTransfer: dt }).catch(() => {});
    await p.waitForTimeout(400);
    let d = await veri();
    let plan = d.planlar.find((x) => x.id === "nd-yarin");
    const sira = plan.basliklar.map((x) => x.id);
    ok(sira.indexOf(b1) === sira.indexOf(b3) + 1 && sira.indexOf(b2) < sira.indexOf(b3), `${dil}/${gorunum}: başlık yer değiştirdi (b3'ün altına)`);
    ok(plan.basliklar.length === kur.length, `${dil}/${gorunum}: başlık başka başlığa katılmadı`);
    ok(d.gelismeler.find((x) => x.id === "g-bs1").planBaslikId === b1, `${dil}/${gorunum}: içeriği başlığıyla birlikte`);
    ok((await p.locator(".baslik-tasiniyor, .sur-araya-alt, .sur-araya-ust").count()) === 0, `${dil}/${gorunum}: bırakınca işaretler kalkıyor`);

    // Yukarı taşıma hedefin üstüne geçer.
    const dt2 = await p.evaluateHandle(() => new DataTransfer());
    const k2 = p.locator(`[data-nd-baslik="${b1}"] [data-sur="baslik"]`).first();
    const h2 = p.locator(`[data-nd-baslik="${b2}"] h3`).first();
    await k2.dispatchEvent("dragstart", { dataTransfer: dt2 });
    await h2.dispatchEvent("dragover", { dataTransfer: dt2 });
    await p.waitForTimeout(100);
    ok(await p.locator(`[data-nd-baslik="${b2}"]`).first().evaluate((x) => x.classList.contains("sur-araya-ust")), `${dil}/${gorunum}: yukarı taşımada üst kenar işaretli`);
    await h2.dispatchEvent("drop", { dataTransfer: dt2 });
    await p.waitForTimeout(400);
    d = await veri();
    plan = d.planlar.find((x) => x.id === "nd-yarin");
    ok(plan.basliklar.map((x) => x.id).indexOf(b1) === plan.basliklar.map((x) => x.id).indexOf(b2) - 1, `${dil}/${gorunum}: yukarı taşınan başlık hedefin üstünde`);

    // Alt satır başka başlığa yine taşınır (sıralama değil, içine).
    const dt3 = await p.evaluateHandle(() => new DataTransfer());
    const g = p.locator('[data-sur="gelisme"][data-sur-id="g-bs1"]').first();
    const h3 = p.locator(`[data-nd-baslik="${b3}"] h3`).first();
    await g.dispatchEvent("dragstart", { dataTransfer: dt3 });
    await h3.dispatchEvent("dragover", { dataTransfer: dt3 });
    await p.waitForTimeout(100);
    ok(await p.locator(`[data-nd-baslik="${b3}"]`).first().evaluate((x) => x.classList.contains("sur-hedef")), `${dil}/${gorunum}: gelişme sürüklenince başlığın içi vurgulanıyor`);
    await h3.dispatchEvent("drop", { dataTransfer: dt3 });
    await p.waitForTimeout(400);
    d = await veri();
    ok(d.gelismeler.find((x) => x.id === "g-bs1").planBaslikId === b3, `${dil}/${gorunum}: gelişme başka başlığa taşındı`);
    await p.close();
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
