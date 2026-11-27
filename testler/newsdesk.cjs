// Newsdesk (kullanıcı): onaylı Next Day Newsdesk'in kontrolünde (Planlama da müdahale eder); ana sayfada
// Planlama'nın zaman çizgisi, beklenen pakete basınca teslim saati ve muhabir yerinde; muhabiri Newsdesk
// atar; yayınlanmayan paket Planlama'nın stoğuna döner ve bildirilir; teslim gerekçeyle reddedilir
// (ödeme yok); paket görüşü; ücret ve nitelik puanı yok.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("nd4", "#/");

  // Bugünün planı onaylı; üç paketi: TBC (süren, teslim 12:00 GMT), teslim edilmiş iki paket.
  const k = await p.evaluate((K) => {
    const d = JSON.parse(localStorage.getItem(K));
    const t = new Date();
    const b = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    let plan = d.planlar.find((x) => x.tarih === b);
    plan.durum = "onayli";
    const pb = plan.basliklar[0];
    const muh = d.kisiler.filter((x) => x.birim === "muhabir" && !x.pasif);
    const sablon = d.paketler.find((x) => x.planId);
    const yap = (id, ek) => ({ ...JSON.parse(JSON.stringify(sablon)), id, kod: id, planId: plan.id, planBaslikId: pb.id, stok: undefined, ozelId: undefined, masaTakibi: undefined, isaret: undefined, yayinlandi: undefined, uretim: undefined, adim: undefined, parcalar: undefined, kunye: undefined, newsdeskRed: undefined, stogaDondu: undefined, yapilmadi: undefined, reddedildi: undefined, gorev: undefined, oneriId: undefined, ...ek });
    const tbc = yap("pk-nd-tbc", { baslik: "تقرير بلا مراسل", durum: "onaylandi", muhabirTbc: true, teslim: `${b}T12:00:00.000Z` });
    const stk = yap("pk-nd-stok", { baslik: "تقرير لم يبث", durum: "tamamlandi", muhabirId: muh[0].id });
    const red = yap("pk-nd-red", { baslik: "تقرير مرفوض", durum: "tamamlandi", muhabirId: muh[1].id });
    d.paketler = [...d.paketler.filter((x) => !x.id.startsWith("pk-nd-")), tbc, stk, red];
    d.canliYayinlar = [...d.canliYayinlar.filter((x) => x.id !== "cy-nd"), { id: "cy-nd", planId: plan.id, konu: "بث مباشر تجريبي", yer: "", tarih: b, saatGmt: "14:00", muhabirId: muh[2].id, notlar: "", aciklama: "" }];
    localStorage.setItem(K, JSON.stringify(d));
    localStorage.setItem(K + "-iz", String(Date.now()));
    return { plan: plan.id, muh: muh[3].id, stokMuh: muh[0].id, redMuh: muh[1].id };
  }, K);

  // Ana sayfa: zaman çizgisi, sıradaki işler, planın paketleri; ücret ve kontrol kartı yok.
  await gir("nd4", "#/");
  ok(await p.locator("[data-ap-cizgi]").isVisible(), "zaman çizgisi");
  ok((await p.locator('[data-ap-olay="paket"][data-ap-olay-id="pk-nd-tbc"]').count()) === 1, "beklenen paket çizgide");
  ok((await p.locator('[data-ap-olay="canli"][data-ap-olay-id="cy-nd"]').count()) === 1, "canlı çizgide");
  ok(await p.locator("[data-nd-sira]").isVisible(), "ana sayfada sıradaki işler");
  ok((await p.locator("[data-newsdesk-sayfasi] [data-nd-kutu]").count()) === 4, "dört kutucuk");
  ok(await p.locator("[data-nd-kendi]").isVisible(), "kendi alanım");
  ok((await p.locator('[data-birim-menusu] a[href="#/newsdesk/yayin"], nav.menu.masa-newsdesk a[href="#/newsdesk/yayin"]').count()) >= 1, "menüde Newsdesk'in bölümleri");
  await gir("nd4", "#/newsdesk/yayin");
  ok((await p.locator('[data-nd-grup="tbc"] [data-nd-paket="pk-nd-tbc"]').count()) === 1, "TBC grubu ilk açılır");
  ok((await p.locator('a[href="#/ucretler"]').count()) === 0, "ücret yok");

  // Çizgideki pakete bas: teslim saati ve muhabir yerinde.
  await gir("nd4", "#/");
  await p.click('[data-ap-olay-id="pk-nd-tbc"] .ap-olay-ad');
  ok(await p.locator("[data-nd-paket-penceresi]").isVisible(), "paket penceresi");
  await p.fill("[data-nd-teslim-saati]", "13:30");
  await p.locator("[data-nd-teslim-saati]").blur();
  await p.click("[data-nd-teslim-kaydet]");
  await p.waitForTimeout(300);
  let d = await oku();
  ok(d.paketler.find((x) => x.id === "pk-nd-tbc").teslim.includes("T13:30"), "teslim saati 13:30 GMT");
  await p.click('[data-nd-paket-penceresi] [data-paket-muhabir-ata]');
  await p.selectOption("[data-paket-muhabir-formu] select", k.muh);
  await p.click("[data-paket-muhabir-kaydet]");
  await p.waitForTimeout(300);
  d = await oku();
  const tbc = d.paketler.find((x) => x.id === "pk-nd-tbc");
  ok(tbc.muhabirId === k.muh && !tbc.muhabirTbc, "Newsdesk muhabir atadı");
  ok(d.hareketler.some((h) => h.tip === "paketMuhabirAtandi" && h.paketId === "pk-nd-tbc" && h.veri?.kime === k.muh), "muhabire bildirim");
  await p.keyboard.press("Escape");

  // Canlıya bas: form ve yapıldı/yapılmadı.
  await gir("nd4", "#/");
  await p.click('[data-ap-olay-id="cy-nd"] .ap-olay-ad');
  ok(await p.locator("[data-nd-canli]").isVisible(), "canlı penceresi");
  await p.keyboard.press("Escape");

  // Yayınlanmayan paket stoka döner, Planlama'ya ve muhabire bildirilir.
  await gir("nd4", "#/newsdesk/yayin");
  await p.click('[data-nd-grup-sec="teslim"]');
  await p.click('[data-nd-paket="pk-nd-stok"] [data-paket-stoga-dondur]');
  await p.fill("[data-stoga-sebep]", "ضيق الوقت");
  await p.click("[data-stoga-dondur-onay]");
  await p.waitForTimeout(300);
  d = await oku();
  const st = d.paketler.find((x) => x.id === "pk-nd-stok");
  ok(st.stok && st.stogaDondu?.sebep === "ضيق الوقت" && !st.planBaslikId, "stoka döndü, başlıktan çıktı");
  const sh = d.hareketler.find((h) => h.tip === "paketStogaDondu" && h.paketId === "pk-nd-stok");
  ok(sh?.veri?.sahip === "planlama" && sh?.veri?.kime === k.stokMuh, "Planlama ve muhabire bildirim");
  await p.click('[data-nd-grup-sec="stok"]');
  ok((await p.locator('[data-nd-grup="stok"] [data-nd-paket="pk-nd-stok"]').count()) === 1, "Stoka dönen grubunda");
  await gir("pl2", "#/paketler/pk-nd-stok");
  ok(await p.locator("[data-stoga-dondu]").isVisible(), "paket sayfasında stoka dönüş satırı");

  // Teslim gerekçeyle reddedilir; gerekçesiz olmaz; ödeme yok; geri alınır.
  await gir("nd4", "#/paketler/pk-nd-red");
  await p.click("[data-paket-newsdesk-reddet]");
  ok(await p.locator("[data-newsdesk-red-onay]").isDisabled(), "gerekçesiz reddedilmez");
  await p.fill("[data-newsdesk-red-gerekce]", "الصورة رديئة");
  await p.click("[data-newsdesk-red-onay]");
  await p.waitForTimeout(300);
  d = await oku();
  ok(d.paketler.find((x) => x.id === "pk-nd-red").newsdeskRed?.gerekce === "الصورة رديئة", "reddedildi");
  ok(d.hareketler.some((h) => h.tip === "paketNewsdeskReddetti" && h.veri?.kime === k.redMuh && h.veri?.sahip === "planlama"), "red bildirimi");
  ok(await p.locator("[data-newsdesk-red]").isVisible(), "red satırı");

  // Görüş: Newsdesk yazar, muhabir görmez.
  await p.fill("[data-newsdesk-gorus-girdi]", "إيقاع جيد لكن الصوت منخفض");
  await p.click("[data-newsdesk-gorus-ekle]");
  await p.waitForTimeout(300);
  d = await oku();
  ok((d.asamaNotlari ?? []).some((n) => n.paketId === "pk-nd-red" && n.asama === "gorus"), "görüş kaydedildi");
  await gir(k.redMuh, "#/paketler/pk-nd-red");
  ok((await p.locator("[data-newsdesk-gorusleri]").count()) === 0, "muhabir görüşü görmüyor");
  ok(await p.locator("[data-newsdesk-red]").isVisible(), "muhabir reddi görüyor");

  // Muhasebe: reddedilen paket dökümde yok (ödeme yapılmaz).
  await gir("nd4", "#/paketler/pk-nd-red");
  await p.click("[data-newsdesk-red-geri]");
  await p.waitForTimeout(300);
  d = await oku();
  ok(!d.paketler.find((x) => x.id === "pk-nd-red").newsdeskRed, "ret geri alındı");

  // Onaylı plan Newsdesk'in kontrolünde: plan ekranında düzenleme açık (geri al düğmesi düzenleyene çıkar).
  await gir("nd4", `#/nextday/${k.plan}`);
  ok((await p.locator("[data-geri-al], [data-arac='imla'], .plan-surukle").count()) > 0, "Newsdesk onaylı planı düzenliyor");

  // Telefonda taşma yok, Arapçada da.
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "ar"));
  for (const y of ["#/", "#/newsdesk/yayin", "#/newsdesk/canli", "#/newsdesk/arsiv"]) {
    await gir("nd4", y);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "390'da taşma yok " + y);
  }

  console.log(`newsdesk: ${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
