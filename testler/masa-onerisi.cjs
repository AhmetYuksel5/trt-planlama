// Masanın önerisi (kullanıcı: Programlar'dan gelen öneri doğrudan görevlendirme gibi geliyordu; muhabirin önerisi
// gibi, program etiketiyle gelsin): "Öneri gönder" Planlama'nın "Karar bekleyen"ine öneri düşürür, paket açmaz;
// karar verilene dek muhabir görmez.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1000);
  };
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const STRAP = "برنامج خاص عن الذكاء الاصطناعي";

  await gir("pr1", "#/programlar/oneriler");
  const once = await durum();
  const mu = once.kisiler.find((k) => k.birim === "muhabir" && !k.pasif && !k.hesapsiz);
  const dugme = p.locator("[data-gorevlendir='oneri']").first();
  ok((await dugme.count()) === 1 && (await p.locator("[data-gorevlendir='talep']").count()) === 0, "masada görev talebi yerine Öneri gönder");
  await dugme.click();
  const f = p.locator("[data-masa-oneri-formu]");
  await f.locator("select").first().selectOption(mu.id);
  await f.locator("[data-oneri-strap]").fill(STRAP);
  await f.locator("[data-oneri-gelisme]").fill("حلقة تتناول تأثير الذكاء الاصطناعي على الإعلام");
  await f.locator("[data-oneri-isleme]").fill("مقابلات مع خبراء");
  // Programda zaman sorusu zorunlu: seçilmeden gönderilmez
  ok(await p.locator("[data-masa-oneri-gonder]").isDisabled(), "zaman seçilmeden gönderilmez");
  await f.locator('[data-zaman-sec="zamansiz"]').click();
  await p.locator("[data-masa-oneri-gonder]").click();
  await p.waitForTimeout(500);
  let d = await durum();
  const o = d.oneriler.find((x) => x.paketBasligi === STRAP);
  ok(!!o && o.masa === "program" && o.durum === "yeni" && o.tur === "program" && o.giren === "pr1" && o.muhabirId === mu.id, "öneri program etiketli, yeni, kolu program, muhabirli");
  ok(o?.islemeFikri === "مقابلات مع خبراء", "kurumun alanları öneride");
  ok(d.paketler.length === once.paketler.length, "paket (görev talebi) açılmadı");
  ok(d.hareketler.some((h) => h.oneriId === o?.id && h.tip === "oneriGeldi" && h.veri?.sahip === "planlama"), "Planlama'ya bildirim");

  // Masanın kendi listesinde ve öneri sayfası ona açık
  await gir("pr1", "#/programlar/oneriler");
  await p.locator("[data-prg-oneri-sekme='bizim']").click();
  ok((await p.locator(`[data-prg-masa-oneri='${o.id}']`).count()) === 1, "Bizim önerilerimiz'de");
  await gir("pr1", `#/oneriler/${o.id}`);
  ok((await p.locator("main").innerText()).includes(STRAP), "masa önerinin sayfasını açar");

  // Muhabir karar verilene dek görmez
  await gir(mu.id, "#/oneriler");
  ok(!(await p.locator("main").innerText()).includes(STRAP), "muhabir karar aşamasındaki masa önerisini görmez");

  // Planlama: karar bekleyende, masanın etiketiyle
  await gir("pl1", "#/oneriler");
  const kart = p.locator("[data-oneri-masa='program']").first();
  ok((await kart.count()) === 1 && (await kart.innerText()).length > 0, "Planlama'nın listesinde program etiketi");
  ok((await p.locator("main").innerText()).includes(STRAP), "karar bekleyen listesinde");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await gir("pr1", "#/programlar/oneriler");
    await p.locator("[data-gorevlendir='oneri']").first().click();
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
