// Weekly toplantı görünümü (kullanıcı: toplantıda anlık not alıp paketleri onaylayacağı, sonra gözden geçirip son hali
// vereceği arayüz; toplantı planın tam metninden, ana dosyalar dahil takip edilsin): ortada planın belgesi, klavyeyle karar (1 kabul, 2 şartlı, 3 bilgi, 4 ret, 0 kaldır) ve sonrakine geçiş,
// N ile karar notu, süzgeç, genel toplantı notları (yalnız Planlama ve yöneticiler; ayrı kayıt), tutanakta notlar.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const oturum = (id) => p.evaluate((id) => localStorage.setItem("trt-planlama-oturum", id), id);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/haftalik");
  const hid = await p.evaluate(() => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    const h = [...d.haftalik].sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
    h.durum = "toplantida"; h.kalemler.forEach((x) => { x.karar = "bekliyor"; delete x.onInceleme; delete x.kosul; });
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
    return h.id;
  });
  const kalem = async (id) => (await veri()).haftalik.find((x) => x.id === hid).kalemler.find((x) => x.id === id);
  const secili = () => p.locator("[data-toplanti-kalem].secili").getAttribute("data-toplanti-kalem");

  // 1. Plan ekranından giriş
  await git("#/haftalik/" + hid);
  await p.locator("[data-toplanti-ac]").click(); await p.waitForTimeout(900);
  ok((await p.evaluate(() => location.hash)).endsWith("/toplanti"), "plan ekranından toplantı görünümüne");
  const ids = await p.locator("[data-toplanti-kalem]").evaluateAll((l) => l.map((x) => x.getAttribute("data-toplanti-kalem")));
  ok(ids.length > 3 && (await secili()) === ids[0], "belgedeki kalemler, ilk karar bekleyen seçili");
  const metin = await p.locator("[data-toplanti] .toplanti-belge").innerText();
  ok(metin.includes("أهم ملفات الأسبوع") && metin.includes("تحركات المراسلين") && metin.includes("الأجندة اليومية"), "planın tam metni: hareketler, ana dosyalar, günler");

  // 2. Klavyeyle karar ve sonrakine geçiş
  await p.keyboard.press("1"); await p.waitForTimeout(300);
  ok((await kalem(ids[0])).karar === "kabul" && (await secili()) === ids[1], "1 → kabul, sonraki kaleme geçti");
  await p.keyboard.press("3"); await p.waitForTimeout(300);
  ok((await kalem(ids[1])).karar === "bilgi" && (await secili()) === ids[2], "3 → bilgi");
  await p.keyboard.press("4"); await p.waitForTimeout(300);
  ok((await kalem(ids[2])).karar === "ret", "4 → ret");
  await p.keyboard.press("ArrowUp"); await p.keyboard.press("ArrowUp"); await p.keyboard.press("ArrowUp"); await p.waitForTimeout(200);
  ok((await secili()) === ids[0], "↑ ile geri");
  await p.keyboard.press("0"); await p.waitForTimeout(300);
  ok((await kalem(ids[0])).karar === "bekliyor" && (await secili()) === ids[0], "0 → karar kalktı, yerinde kaldı");
  ok((await p.locator("[data-toplanti-ayrinti] kbd").count()) === 4, "karar düğmelerinde kısayol rakamı");

  // 3. 2 → şartlı kabulün koşul formu; N → karar notu
  await p.keyboard.press("2"); await p.waitForTimeout(300);
  ok((await p.locator("[data-toplanti-ayrinti] [data-kosul-formu]").count()) === 1, "2 → koşul formu açıldı");
  await p.locator("[data-kosul-girdi]").fill("إذا تأكد الموعد");
  await p.locator("[data-kosul-formu] .form-alt button").last().click(); await p.waitForTimeout(300);
  ok((await kalem(ids[0])).karar === "sartli", "şartlı kabul kaydedildi");
  await p.locator("body").click({ position: { x: 5, y: 300 } });
  await p.keyboard.press("n"); await p.waitForTimeout(300);
  ok((await p.locator("[data-toplanti-ayrinti] [data-karar-notu-formu]").count()) === 1, "N → karar notu formu");
  await p.keyboard.press("Escape");

  // 4. "Karar bekleyen": belge yerinde kalır, kararı verilmiş kalem soluk ve gezinmede atlanır
  await p.locator("[data-toplanti-suzgec='bekleyen']").click(); await p.waitForTimeout(300);
  ok((await p.locator(".yalniz-bekleyen [data-toplanti-kalem]").count()) === ids.length, "süzgeçte belge tam kaldı");
  await p.keyboard.press("ArrowDown"); await p.waitForTimeout(200);
  const sonraki = await secili();
  ok((await kalem(sonraki)).karar === "bekliyor", "↓ karar bekleyene gitti (kararı verilenler atlandı)");

  // 5. Genel toplantı notu: Ctrl+Enter ile eklenir, ayrı kayıtta
  await p.locator("[data-toplanti-not-girdi]").fill("نتابع ملف الانتخابات مع المكتب");
  await p.locator("[data-toplanti-not-girdi]").press("Control+Enter"); await p.waitForTimeout(400);
  let d = await veri();
  ok((d.toplantiNotlari ?? []).some((n) => n.planId === hid && n.metin === "نتابع ملف الانتخابات مع المكتب" && n.kisiId === "pl2"), "not kaydedildi (toplantiNotlari)");
  ok((await p.locator("[data-toplanti-notu]").count()) === 1, "not listede");
  ok(!JSON.stringify(d.haftalik.find((x) => x.id === hid)).includes("نتابع ملف الانتخابات"), "not planın kaydına girmedi");

  // 6. Tutanakta notlar (gözden geçirme, tam yönetici)
  await p.evaluate((hid) => {
    const k = "trt-planlama-v24", d = JSON.parse(localStorage.getItem(k));
    d.haftalik.find((x) => x.id === hid).kalemler.forEach((x) => { if (x.karar === "bekliyor") x.karar = "kabul"; });
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
  }, hid);
  await oturum("yo3");
  await git(`#/haftalik/${hid}/toplanti`);
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  await p.locator("[data-tutanak-kopyala]").click(); await p.waitForTimeout(300);
  const tut = await p.evaluate(() => navigator.clipboard.readText());
  ok(tut.includes("Toplantı notları") && tut.includes("نتابع ملف الانتخابات مع المكتب"), "tutanakta toplantı notları");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);

  // 7. Notları yalnız Planlama ve yöneticiler görür
  const personel = d.kisiler.find((k) => !["planlama", "muhabir", "yonetim"].includes(k.birim) && k.rol !== "yonetici" && !k.hesapYoneticisi && !k.kontrolBekliyor && !k.hesapsiz);
  await oturum(personel.id);
  await git(`#/haftalik/${hid}/toplanti`);
  ok((await p.locator("[data-toplanti-notlari]").count()) === 0, `${personel.birim} personeli notları görmüyor`);

  // 8. 390 pikselde taşma yok
  await oturum("pl2");
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/haftalik/${hid}/toplanti`);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(t <= 1, `390px taşma yok (${dil}): ${t}`);
    await p.locator("[data-toplanti-kalem]").nth(1).click(); await p.waitForTimeout(400);
    ok((await p.locator("dialog[open] [data-toplanti-ayrinti]").count()) === 1, `telefonda kaleme dokununca karar kartı pencerede (${dil})`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
