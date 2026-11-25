// Rotadan çalışma programı (kullanıcı: kayıtlı haber merkezi personelinin hangi gün, hangi saatte
// çalıştığı rotadan çekilsin; dönemin ilk günü sistemi ilk açanın tarayıcısı doldursun). Demoda kapı
// yok: sahte rota okuması (`window.__rotaGetir`) kurgusal adlarla. Dönem sekmeden: sekme değişince durur.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

const SAHTE = () => {
  window.__rotaOkuma = 0;
  window.__rotaGetir = async (tarih, tur) => {
    window.__rotaOkuma++;
    const r = JSON.parse(localStorage.getItem("test-rota") || "null");
    if (!r || tur === "sunucu") return null;
    const sekme = tarih <= r.bitis ? "2026: DONEM1" : "2026: DONEM2";
    // Birinci kişi her gün 07:00; ikincisi Cuma ve Cumartesi izinli, Pazartesi 10:00, öbür günler 13:45.
    const hg = new Date(tarih + "T12:00:00Z").getUTCDay();
    return {
      sekme,
      satirlar: [
        ["EP TEAM", "", ""],
        ["EP", "0700-1600", r.a],
        ["EP", "1345-2245", hg >= 5 || hg === 1 ? "OFF" : r.b],
        ["EP", "1000-1900", hg === 1 ? r.b : ""],
        ["EP", "0900-1800", "Zeynep Qwerty"],
      ],
    };
  };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.addInitScript(SAHTE);
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1500); };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/");
  const kisiler = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    // Latin adı iki parçalı, haber merkezinden iki kişi (eşleşme adın parçalarıyla).
    const l = d.kisiler.filter((x) => x.birim !== "muhabir" && !x.pasif && typeof x.ad === "object" && (x.ad.tr || "").split(" ").length >= 2);
    const bitis = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
    localStorage.setItem("test-rota", JSON.stringify({ a: l[0].ad.tr, b: l[1].ad.tr, bitis }));
    // İlk açılışta rota yoktu, o günün denemesi işaretlendi; gerçek kipte ertesi gün yeniden denenir.
    localStorage.removeItem("trt-planlama-rota-denendi");
    return { a: l[0].id, b: l[1].id, bitis };
  }, K);
  // Açılışta dönem kayıtta yok: aktarılır.
  await git("#/");
  await p.waitForTimeout(1500);
  let d = await oku();
  const pr = (d.rotaProgramlari || [])[0];
  ok(!!pr && pr.sekme === "2026: DONEM1", "dönem aktarıldı");
  ok(pr && pr.bit === kisiler.bitis, "dönem sekme değişince bitti: " + pr?.bit);
  ok(pr && Object.values(pr.kisiler[kisiler.a] || {}).every((s) => s === "07:00-16:00") && Object.keys(pr.kisiler[kisiler.a] || {}).length >= 9, "birinci kişi her gün 07:00");
  ok(pr && Object.keys(pr.kisiler[kisiler.b] || {}).every((t) => new Date(t + "T12:00:00Z").getUTCDay() < 5), "ikinci kişi Cuma ve Cumartesi yok");
  ok(pr && pr.eslesmeyen.includes("Zeynep Qwerty"), "kayıtta olmayan ad eşleşmeyenlerde");

  // Dönem kayıtta: ikinci açılışta okunmaz.
  await git("#/");
  ok((await p.evaluate(() => window.__rotaOkuma)) === 0, "dönem içinde yeniden okunmadı");

  // Profilde çalışma programı.
  await git("#/personel/" + kisiler.b);
  const kart = p.locator(`[data-rota-program="${kisiler.b}"]`);
  ok((await kart.count()) === 1, "profilde çalışma programı kartı");
  const metin = await kart.innerText();
  ok((await kart.locator("[data-rota-izin]").innerText()).trim() === "Cumartesi, Cuma", "izin günleri: " + (await kart.locator("[data-rota-izin]").innerText()));
  ok((await kart.locator("[data-rota-saat]").innerText()).includes("13:45–22:45"), "çalışma saati vardiyayla");
  ok((await kart.locator("[data-rota-farkli]").innerText()).includes("10:00–19:00"), "farklı saatli gün ayrıca");
  await git("#/personel/" + kisiler.a);
  ok((await p.locator(`[data-rota-program="${kisiler.a}"] [data-rota-izin]`).innerText()).trim() === "Yok", "her gün çalışanın izin günü yok");

  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
