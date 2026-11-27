// Önerinin teslim tahmini akışta (kullanıcı: teslim süresi havada kalmasın, postada
// "bu teslim gününe kadar" densin) ve muhabirde başlık bağlantısı (kullanıcı: muhabir
// "başlığa eklendi"deki başlığa basınca "erişimin yok" görüyordu; kural: muhabir planı görmez).
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (f, arg) => p.evaluate(([src, a]) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    localStorage.setItem("trt-planlama-v25", JSON.stringify(new Function("d", "a", src)(d, a)));
  }, [f, arg]);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl1", "#/oneriler");
  let d = await veri();
  const yarin = d.planlar.find((x) => x.id === "nd-yarin");
  const planda = new Set([...d.gelismeler, ...d.paketler, ...d.canliYayinlar].map((x) => x.oneriId).filter(Boolean));
  const o = d.oneriler.find((x) => x.muhabirId && !x.talimatVeren && x.paketBasligi && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.hedefTarih === yarin.tarih && x.bicim !== "canli" && !x.takipTuru && !planda.has(x.id));
  ok(!!o, "uygun öneri var");
  const t = new Date(yarin.tarih + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + 3);
  const TESLIM = t.toISOString().slice(0, 10);
  await yaz("return { ...d, oneriler: d.oneriler.map((x) => (x.id === a[0] ? { ...x, teslimTahmini: a[1] } : x)) };", [o.id, TESLIM]);

  // 1. Plana eklenince paketin teslim günü önerinin tahmini.
  await gir("pl1", "#/oneriler/" + o.id);
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(300);
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk = d.paketler.find((x) => x.oneriId === o.id && x.durum !== "iptal");
  ok(pk && pk.sonTarih === TESLIM, "paketin teslim günü önerinin teslim tahmini");

  // 2. PKG geri bildirimi postasında "موعد التسليم".
  await yaz("return { ...d, paketler: d.paketler.map((x) => (x.id === a ? { ...x, durum: 'onaylandi' } : x)) };", pk.id);
  await gir("pl1", `#/nextday/${yarin.id}/takdir`);
  await p.click(`[data-takdir-paket="${pk.id}"] [data-takdir-onizle]`);
  await p.waitForTimeout(300);
  const onizleme = await p.locator(`[data-takdir-paket="${pk.id}"] [data-takdir-onizleme]`).innerText();
  ok(onizleme.includes("موعد التسليم"), "geri bildirim postasında teslim satırı");

  // 3. Görevlendirme formu teslim tahminiyle açılır.
  const sorulan = new Set((d.masaSorulari ?? []).map((s) => s.oneriId));
  const o2 = d.oneriler.find((x) => x.id !== o.id && !sorulan.has(x.id) && x.hedefTarih === yarin.tarih && x.muhabirId && !x.talimatVeren && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.bicim !== "canli" && !x.takipTuru && !planda.has(x.id));
  await yaz("return { ...d, oneriler: d.oneriler.map((x) => (x.id === a[0] ? { ...x, teslimTahmini: a[1] } : x)) };", [o2.id, TESLIM]);
  await gir("pl1", "#/oneriler/" + o2.id);
  await p.locator("[data-oneri-alt] button[aria-haspopup='menu']").first().click();
  await p.waitForTimeout(200);
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  const gun = await p.locator("[data-oneri-gorevlendir-formu] input[type=date]").first().inputValue();
  ok(gun === TESLIM, "görevlendirme formu teslim tahmininin günüyle açılır (" + gun + ")");

  // 4. Muhabir: plana girmiş önerisinde başlık bağlantı değil; Planlama'da bağlantı.
  d = await veri();
  const ben = o.muhabirId;
  await gir("pl1", "#/oneriler/" + o.id);
  ok((await p.locator("[data-plana-git]").count()) >= 1, "Planlama'da plan satırı bağlantı");
  await gir(ben, "#/oneriler/" + o.id);
  ok((await p.locator("[data-plana-eklendi]").count()) >= 1, "muhabir plana eklendi satırını görüyor");
  ok((await p.locator("[data-plana-git]").count()) === 0, "muhabirde başlık bağlantı değil");
  ok((await p.locator('a[data-oneri-etiketi][href^="#/nextday"], a[data-oneri-etiketi][href^="#/haftalik"]').count()) === 0, "muhabirde plan etiketi bağlantı değil");

  // 5. "Planda eklendin" bildirimi muhabiri Takiplerim'e götürür.
  await yaz("return { ...d, hareketler: [{ id: 'h-tt', zaman: new Date().toISOString(), kisiId: 'pl1', tip: 'planaMuhabirEklendi', planId: a[0], veri: { kime: a[1], muhabir: a[1], tarih: a[2], baslik: 'باريس', pb: 'x' } }, ...d.hareketler] };", [yarin.id, ben, yarin.tarih]);
  await gir(ben, "#/");
  await p.click('button[aria-label="Bildirimler"]');
  await p.waitForTimeout(300);
  const hrefler = await p.locator(".acilir-satir").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  ok(hrefler.length > 0 && !hrefler.some((h) => /^#\/(nextday|haftalik)/.test(h || "")), "muhabirin bildirimlerinde plan bağlantısı yok");
  ok(hrefler.includes("#/takipler"), "planda eklendin bildirimi Takiplerim'e");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
