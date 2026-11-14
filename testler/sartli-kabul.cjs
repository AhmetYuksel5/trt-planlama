// Weekly şartlı kabul (kullanıcı: toplantıda paket bazen o an onaylanmıyor, "duruma göre onaylayalım" deniyor) ve
// kesinleştirmeden önce gözden geçirme penceresi. Şartlı karar koşulsuz verilmez; kesinleşince paket taslakta ve
// koşullu açılır, muhabire ön bilgi gider; Next Day onayı onu kabul saymaz; kararı Planlama "Şartlı kabul
// bekleyenler"den verir.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1000); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const oturum = (id) => p.evaluate((id) => localStorage.setItem("trt-planlama-oturum", id), id);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "yo3"); });
  await git("#/haftalik");

  const kur = await p.evaluate(() => {
    const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.durum !== "kesinlesti");
    // Haftanın ilk gününe toplantıdaki boş bir Next Day planı: haber oraya geçsin.
    const ornek = d.planlar.find((x) => x.durum === "taslak") || d.planlar[0];
    const plan = { ...ornek, id: "nd-sk-test", tarih: h.baslangic, durum: "toplantida", basliklar: [], hazirPaketler: [] };
    d.planlar = [plan, ...d.planlar.filter((x) => x.tarih !== h.baslangic)];
    h.durum = "toplantida";
    h.kalemler.forEach((x) => { x.karar = "kabul"; delete x.onInceleme; });
    const ms = d.kisiler.filter((x) => x.birim === "muhabir").slice(0, 2).map((x) => x.id);
    const ortak = { bicimler: ["pkg"], karar: "bekliyor" };
    h.kalemler.push({ ...ortak, id: "sk-haber", tarih: plan.tarih, baslikId: d.basliklar[0].id, yer: "", metin: "زيارة مرتقبة لوفد رسمي", paketBasligi: "زيارة مشروطة", tur: "haber", muhabirler: [ms[0]] });
    h.kalemler.push({ ...ortak, id: "sk-feature", bicimler: ["feature"], yer: "", metin: "قصة إنسانية عن صانع فخار", paketBasligi: "صانع الفخار", tur: "feature", muhabirler: [ms[1]] });
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, planId: plan.id, ms };
  });

  // 1. Şartlı karar koşulsuz verilmez; koşulla kaydedilince karar "şartlı"
  await git("#/haftalik/" + kur.hid);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  for (const [id, kosul] of [["sk-haber", "إذا تأكدت الزيارة"], ["sk-feature", "إذا وافقت العائلة"]]) {
    const kart = p.locator(`[data-kalem="${id}"]`);
    await kart.locator("[data-karar-dugme='sartli']").click(); await p.waitForTimeout(200);
    const form = kart.locator("[data-kosul-formu]");
    ok((await form.count()) === 1 && (await form.locator(".form-alt button").last().isDisabled()), `${id}: koşul formu açıldı, boşken kaydedilemiyor`);
    await form.locator("[data-kosul-girdi]").fill(kosul);
    // Koşulun son günü (isteğe bağlı): yalnız birine.
    if (id === "sk-haber")
      await form.locator("input[data-kosul-son]").evaluate((el) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, new Date().toLocaleDateString("sv"));
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await form.locator(".form-alt button").last().click(); await p.waitForTimeout(400);
  }
  const h1 = (await veri()).haftalik.find((x) => x.id === kur.hid);
  ok(["sk-haber", "sk-feature"].every((id) => { const k = h1.kalemler.find((x) => x.id === id); return k.karar === "sartli" && k.kosul; }), "iki kalem şartlı ve koşullu");
  ok((await p.locator(`[data-kalem="sk-haber"] [data-kosul]`).count()) === 1, "kalemin kartında koşul yazılı");
  ok(h1.kalemler.find((x) => x.id === "sk-haber").kosulSon && !h1.kalemler.find((x) => x.id === "sk-feature").kosulSon, "son gün yalnız girilen kalemde");

  // 2. Gözden geçirme: gruplu, özet şartlıyı sayıyor, tutanak kopyalanıyor, karar burada değişiyor
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  ok(/2 şartlı/.test(await p.locator("[data-gozden-ozet]").innerText()), "özette 2 şartlı");
  ok((await p.locator("[data-gozden-grup='sartli'] [data-gozden-kalem]").count()) === 2, "şartlı grubunda iki kalem");
  await p.locator("[data-tutanak-kopyala]").click(); await p.waitForTimeout(300);
  const tutanak = await p.evaluate(() => navigator.clipboard.readText());
  ok(tutanak.includes("Şartlı kabul (2)") && tutanak.includes("إذا تأكدت الزيارة"), "tutanakta şartlı grup ve koşul");
  const ilk = p.locator("[data-gozden-grup='kabul'] [data-gozden-kalem]").first();
  const ilkId = await ilk.getAttribute("data-gozden-kalem");
  await ilk.locator("[data-gozden-karar]").selectOption("bilgi"); await p.waitForTimeout(300);
  ok((await veri()).haftalik.find((x) => x.id === kur.hid).kalemler.find((x) => x.id === ilkId).karar === "bilgi", "pencerede karar değişti");
  await p.locator(`[data-gozden-kalem="${ilkId}"] [data-gozden-karar]`).selectOption("kabul"); await p.waitForTimeout(300);

  // 3. Kesinleşme: paketler taslakta ve koşullu, muhabire ön bilgi, görev değil
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(600);
  let d = await veri();
  const kalem = (id) => d.haftalik.find((x) => x.id === kur.hid).kalemler.find((x) => x.id === id);
  const pk = d.paketler.find((x) => x.id === kalem("sk-haber").aktarim?.paketId);
  const pf = d.paketler.find((x) => x.id === kalem("sk-feature").aktarim?.paketId);
  ok(d.haftalik.find((x) => x.id === kur.hid).durum === "kesinlesti", "hafta kesinleşti");
  ok(pk && pk.durum === "taslak" && pk.kosul === "إذا تأكدت الزيارة" && pk.planId === kur.planId, "haber Next Day'e taslak, koşullu paketle geçti");
  ok(pf && pf.durum === "taslak" && pf.kosul && !pf.planId, "feature plansız taslak, koşullu paket");
  ok(!pk.kunye?.gorevlendiren && !pf.kunye?.gorevlendiren, "künyede görevlendiren yok");
  const hr = (pid) => d.hareketler.filter((x) => x.paketId === pid).map((x) => x.tip);
  ok(hr(pk.id).includes("paketSartliKabul") && !hr(pk.id).includes("paketOnaylandi"), "muhabire şartlı bilgi, onay hareketi yok");

  // 4. Çıktıda ve Next Day planında koşul
  await git(`#/haftalik/${kur.hid}/cikti`);
  ok((await p.locator("main").innerText()).includes("(مشروط) إذا تأكدت الزيارة"), "Weekly çıktısında (مشروط) koşul");
  await git(`#/nextday/${kur.planId}`);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  ok((await p.locator(`[data-paket-notu]`, { hasText: "مشروط: إذا تأكدت الزيارة" }).count()) >= 1, "Next Day PKG satırında koşul");

  // 5. Next Day onayı şartlı paketi kabul saymıyor
  await p.getByRole("button", { name: "Planı onayla" }).first().click(); await p.waitForTimeout(600);
  d = await veri();
  ok(d.planlar.find((x) => x.id === kur.planId).durum === "onayli" && d.paketler.find((x) => x.id === pk.id).durum === "taslak", "plan onaylandı, şartlı paket taslakta kaldı");

  // 6. Muhabir paketini ön bilgi olarak görüyor
  await oturum(kur.ms[0]);
  await git(`#/paketler/${pk.id}`);
  ok((await p.locator("[data-paket-kosul]").innerText()).includes("إذا تأكدت الزيارة"), "muhabir paket sayfasında koşulu görüyor");

  // 7. Planlama kararı: biri kabul (görev gider), biri ret
  await oturum("pl1");
  await git("#/paketler");
  ok((await p.locator("[data-sartli-paket]").count()) === 2, "Paketler'de 'Şartlı kabul bekleyenler' iki paket");
  ok((await p.locator(`[data-sartli-paket="${pk.id}"] [data-kosul-son="var"]`).count()) === 1 && (await p.locator("[data-sartli-paket]").first().getAttribute("data-sartli-paket")) === pk.id, "son günü olan pakete geçti, listede önce");
  await p.locator(`[data-sartli-paket="${pk.id}"] [data-sartli-kabul]`).click(); await p.waitForTimeout(400);
  await p.locator(`[data-sartli-paket="${pf.id}"] [data-sartli-ret]`).click(); await p.waitForTimeout(400);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.id === pk.id), pf2 = d.paketler.find((x) => x.id === pf.id);
  ok(pk2.durum === "onaylandi" && pk2.kunye?.gorevlendiren && d.hareketler.some((x) => x.paketId === pk.id && x.tip === "paketOnaylandi"), "kabul: onaylı, görevlendiren yazıldı, muhabire görev");
  ok(pf2.durum === "iptal" && pf2.reddedildi, "ret: paket iptal, ret izi");
  ok((await p.locator("[data-sartli-paketler]").count()) === 0, "kart boşalınca kalktı");

  await oturum("yo3");
  // 8. 390 pikselde gözden geçirme penceresi taşmıyor
  await p.evaluate((hid) => {
    const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.find((x) => x.id === hid); h.durum = "toplantida"; h.kalemler.forEach((x) => (x.karar = "kabul"));
    h.kalemler[0].karar = "sartli"; h.kalemler[0].kosul = "شرط طويل نسبياً للتأكد من أن النافذة لا تتجاوز عرض الشاشة";
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
  }, kur.hid);
  const h2 = { id: kur.hid };
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/haftalik/" + h2.id);
    await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
    const t = await p.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, ...[...document.querySelectorAll("dialog[open] *")].map((e) => e.getBoundingClientRect().right - innerWidth)));
    ok(t <= 1, `390px gözden geçirme penceresi taşmıyor (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
