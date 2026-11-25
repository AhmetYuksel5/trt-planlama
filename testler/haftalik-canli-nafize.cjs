// Weekly'de günün gündemine canlı yayın ve nafize (kullanıcı: haftadan gün gündemine canlı yayın ve nafize eklensin).
// Karar kalemi değil; çıktıda günün altında "مباشر" ve "نافذة"; hafta kesinleşince o günün Next Day planına geçer
// (canlı مباشر'a ve dosyanın başlığına, nafize dosyanın başlığının altına), geçen kayıt Weekly'de kilitlenir.
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
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/haftalik");

  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const plan = [...d.planlar].sort((a, c) => c.tarih.localeCompare(a.tarih))[0];
    plan.durum = "taslak";
    plan.nafizeler = [];
    const gun = (s, n) => new Date(Date.parse(s) + n * 864e5).toISOString().slice(0, 10);
    const h = d.haftalik.find((x) => x.baslangic <= plan.tarih && gun(x.baslangic, 6) >= plan.tarih) || d.haftalik[0];
    h.durum = "hazirlik";
    h.canlilar = [];
    h.nafizeler = [];
    const baslik = d.basliklar.find((x) => x.aktif !== false && !plan.basliklar.some((pb) => pb.baslikId === x.id)) || d.basliklar[0];
    h.dosyalar = [...new Set([...(h.dosyalar || []), baslik.id])];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, plan: plan.id, tarih: plan.tarih, baslikId: baslik.id };
  }, K);

  await git("#/haftalik/" + ids.hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  // Canlı yayın
  await p.locator(`[data-hf-canli-ekle="${ids.tarih}"] button`).first().click();
  let f = p.locator("dialog[open] [data-hf-canli-formu]");
  ok(await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().isDisabled(), "konusuz kaydedilmez");
  await f.locator("[data-hf-canli-konu]").fill("القمة الخليجية");
  await f.locator("[data-hf-canli-yer]").fill("الدوحة");
  await f.locator("[data-hf-canli-saat]").fill("1500");
  await f.locator("[data-hf-canli-saat]").blur();
  await f.locator("[data-hf-canli-dosya]").selectOption(ids.baslikId);
  await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  // Nafize: iki saat
  await p.locator(`[data-hf-nafize-ekle="${ids.tarih}"] button`).first().click();
  f = p.locator("dialog[open] [data-nafize-formu]");
  await f.locator("[data-nafize-baslik]").selectOption(ids.baslikId);
  await f.locator("[data-nafize-saat-girdi]").first().fill("9");
  await f.locator("[data-nafize-yer]").first().fill("استوديو 2");
  await f.locator("[data-nafize-sunucu-ad]").first().fill("سامر خليل");
  await f.locator("[data-nafize-konuklar]").first().fill("محمد علي");
  await f.locator("[data-nafize-satir-ekle]").click();
  await f.locator("[data-nafize-saat-girdi]").nth(1).fill("12");
  await f.locator("[data-nafize-kaydet]").click();
  await p.waitForTimeout(400);
  let h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  ok(h.canlilar?.length === 1 && h.canlilar[0].saat === "15:00" && h.canlilar[0].baslikId === ids.baslikId, "canlı haftaya yazıldı (saat, dosya)");
  ok(h.nafizeler?.length === 2 && h.nafizeler.every((n) => n.tarih === ids.tarih && n.baslikId === ids.baslikId), "iki nafize günün kaydında");
  ok(h.canlilar[0].aktarim === undefined, "hazırlıktaki hafta Next Day'e geçirmez");
  const gunMetni = await p.locator(`[data-hf-gun-cn="${ids.tarih}"]`).first().innerText();
  ok(gunMetni.includes("مباشر") && gunMetni.includes("الدوحة / القمة الخليجية / 15:00G") && gunMetni.includes("نوافذ"), "plan ekranında günün altında");

  // Çıktı
  await git(`#/haftalik/${ids.hid}/cikti`);
  const cikti = await p.locator(`article.cikti [data-hf-gun-cn="${ids.tarih}"]`).first().innerText();
  ok(cikti.includes("الدوحة / القمة الخليجية / 15:00G"), "çıktıda canlı satırı");
  ok(/09:00G - استوديو 2/.test(cikti) && /المذيع: سامر خليل \/ الضيف: محمد علي/.test(cikti), "çıktıda nafize biçimi");

  // Belgede düzenleme düğmeleri
  await git(`#/haftalik/${ids.hid}/belge`);
  ok((await p.locator(`[data-hf-canli-ekle="${ids.tarih}"]`).count()) === 1 && (await p.locator(`[data-hf-nafize-ekle="${ids.tarih}"]`).count()) === 1, "belgede günün ekleme çubuğunda");

  // Kesinleşince Next Day'e geçer
  await p.evaluate(({ k, hid }) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.haftalik.find((x) => x.id === hid).durum = "kesinlesti";
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
  }, { k: K, hid: ids.hid });
  await git("#/haftalik/" + ids.hid);
  await p.waitForTimeout(800);
  let d = await oku();
  h = d.haftalik.find((x) => x.id === ids.hid);
  const plan = d.planlar.find((x) => x.id === ids.plan);
  const pb = plan.basliklar.find((x) => x.baslikId === ids.baslikId);
  ok(!!pb, "dosyanın başlığı plana açıldı");
  const cy = d.canliYayinlar.filter((c) => c.planId === ids.plan && c.konu === "القمة الخليجية");
  ok(cy.length === 1 && cy[0].saatGmt === "15:00" && cy[0].planBaslikId === pb?.id, "canlı Next Day'e, başlığa bağlı");
  ok((plan.nafizeler || []).filter((n) => n.planBaslikId === pb?.id).length === 2, "nafizeler başlığın altına");
  ok(h.canlilar.every((c) => c.aktarim?.planId === ids.plan) && h.nafizeler.every((n) => n.aktarim), "haftada geçti işaretli");

  // İkinci açılış çoğaltmaz; geçen kayıt kilitli
  await git("#/haftalik/" + ids.hid);
  d = await oku();
  ok(d.canliYayinlar.filter((c) => c.konu === "القمة الخليجية").length === 1 && d.planlar.find((x) => x.id === ids.plan).nafizeler.length === 2, "ikinci açılışta çoğalmadı");
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  ok((await p.locator(`[data-hf-gun-cn="${ids.tarih}"] .islemler`).count()) === 0, "geçen kayıt düzenlenmiyor");

  // Next Day çıktısında başlığın altında
  await git(`#/nextday/${ids.plan}/cikti`);
  const nd = await p.locator(`article.cikti [data-nafizeler="${pb.id}"]`).count();
  ok(nd >= 1, "Next Day çıktısında نوافذ");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/haftalik/" + ids.hid);
    await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
