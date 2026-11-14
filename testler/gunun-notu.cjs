// Günün notu (Planlama ana sayfası): kayıttan kurallarla bekleyen ve gözden kaçan işler. Kayıtlar kurgusal.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(700); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/");
  // Günün notu varsayılan düzende yok (kullanıcı); kişi "Sayfayı düzenle"den ekliyor, burada kaydına yazılıyor.
  ok((await p.locator("[data-gun-notu]").count()) === 0 && (await p.getByText(/Günün notu/).count()) === 0, "varsayılan ana sayfada Günün notu yok");
  await p.evaluate(() => {
    const x = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    x.anaSayfa = { ...(x.anaSayfa ?? {}), "pl1:planlama": ["plGunNotu", "plGorevlerim", "plSonOneri", "plMuhabirler", "plHareket"] };
    localStorage.setItem("trt-planlama-v25", JSON.stringify(x));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  });
  await git("#/");
  ok((await p.locator(".gun-notu, [data-gun-notu]").count()) >= 0 && (await p.getByText(/Günün notu/).count()) >= 1, "Planlama ana sayfasında Günün notu kartı");

  const sayi = async (t) => ((await p.locator(`[data-gun-notu="${t}"]`).count()) ? Number(await p.locator(`[data-gun-notu="${t}"] .rozet, [data-gun-notu="${t}"] [class*=rozet]`).last().innerText()) : 0);
  const once = { cevapsiz: await sayi("cevapsizOneri"), karar: await sayi("kararGunu") };
  // Kurgusal durum: eski cevapsız öneri, günü yarın kararsız öneri, üç gündür aynı gelişmeli başlık,
  // günü geçmiş sonuçsuz paket, bugün plansız faaliyet.
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const gun = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };
    const o0 = v.oneriler.find((o) => o.muhabirId && !o.takipId && o.bicim !== "takip" && !o.yon);
    const temel = { ...o0, planId: undefined, paketId: undefined, baslikId: undefined, cagriId: undefined, arsiv: undefined, satirlar: undefined, bitisTarih: undefined, planTarihi: undefined, takipId: undefined, kopyaKaynagi: undefined, hafta: undefined };
    v.oneriler.push(
      { ...temel, id: "gn-o1", durum: "yeni", haberBasligi: "اختبار مقترح قديم", zaman: new Date(Date.now() - 50 * 3600e3).toISOString(), hedefTarih: gun(5) },
      { ...temel, id: "gn-o2", durum: "degerlendiriliyor", haberBasligi: "اختبار موعده غدا", zaman: new Date().toISOString(), hedefTarih: gun(1) },
    );
    v.basliklar.push({ id: "gn-b", ad: "اختبار عنوان راكد", aktif: true });
    const plan = v.planlar.find((x) => x.tarih === gun(1)) ?? v.planlar.find((x) => x.tarih === gun(0));
    const enGeri = plan.tarih === gun(1) ? -1 : -2;
    const ekleBaslik = (pl) => { pl.basliklar.push({ id: "gn-pb-" + pl.id, baslikId: "gn-b", muhabirler: [] }); v.gelismeler.push({ id: "gn-g-" + pl.id, planId: pl.id, planBaslikId: "gn-pb-" + pl.id, metin: "تطور ثابت", kaynakTuru: "ajans", kaynakAdi: "x", tarih: pl.tarih }); };
    ekleBaslik(plan);
    for (let g = 1; g <= 2; g++) {
      const t = (() => { const d = new Date(plan.tarih + "T12:00:00"); d.setDate(d.getDate() - g); return d.toLocaleDateString("sv-SE"); })();
      let pl = v.planlar.find((x) => x.tarih === t);
      if (!pl) { pl = { ...plan, id: "gn-p" + g, tarih: t, durum: "devredildi", basliklar: [] }; v.planlar.push(pl); }
      ekleBaslik(pl);
    }
    const dun = v.planlar.find((x) => x.tarih < gun(0));
    const pk0 = v.paketler[0];
    v.paketler.push({ ...pk0, id: "gn-pk", baslik: "اختبار تقرير بلا نتيجة", durum: "onaylandi", planId: dun.id, isaret: undefined, ozelId: undefined, stok: false, adim: undefined, teslim: undefined });
    const f0 = v.faaliyetler[0];
    v.faaliyetler.push({ ...f0, id: "gn-f", baslik: "اختبار فعالية اليوم", baslangic: gun(0), bitis: gun(0), tekrar: undefined, durum: "planlandi", baglantilar: [] });
    localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  });
  await git("#/");
  const satir = (t) => p.locator(`[data-gun-notu="${t}"]`);
  ok((await sayi("cevapsizOneri")) === once.cevapsiz + 1, "bir günden eski cevapsız öneri sayıldı");
  ok((await sayi("kararGunu")) === once.karar + 1, "günü yarın, karar verilmemiş öneri sayıldı");
  ok(!(await satir("cevapsizOneri").innerText()).includes("اختبار موعده غدا"), "karar günü olan öneri cevapsızlarda tekrar edilmiyor");
  ok((await satir("durganBaslik").innerText()).includes("اختبار عنوان راكد"), "üç gündür aynı gelişmeli başlık");
  ok((await satir("sonucBekleyen").innerText()).includes("اختبار تقرير بلا نتيجة"), "günü geçmiş sonuçsuz paket");
  ok((await satir("plansizFaaliyet").innerText()).includes("اختبار فعالية اليوم"), "bugün plana girmemiş faaliyet");
  // Başlığa yeni gelişme eklenince durgunluk biter.
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const g = v.gelismeler.filter((x) => x.id.startsWith("gn-g-")).sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    v.gelismeler.push({ ...g, id: "gn-g-yeni", metin: "تطور جديد" });
    localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  });
  await git("#/");
  ok(!((await satir("durganBaslik").count()) && (await satir("durganBaslik").innerText()).includes("اختبار عنوان راكد")), "yeni gelişme eklenince başlık durgun değil");
  // Açık çağrıya yanıt vermeyen, önerisi genelde kabul edilen muhabir
  const sessiz = await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const gun = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };
    const yanitli = new Set(v.oneriler.map((o) => o.muhabirId));
    const m = v.kisiler.find((k) => k.birim === "muhabir" && !k.pasif && !yanitli.has(k.id)) ?? v.kisiler.find((k) => k.birim === "muhabir" && !k.pasif);
    const o0 = v.oneriler.find((o) => o.muhabirId && !o.takipId && o.bicim !== "takip" && !o.yon);
    const eski = new Date(Date.now() - 5 * 864e5).toISOString();
    // "Plana eklendi"nin kaynağı plandaki kayıt (açılış işi kaydı olmayanı geri alıyor): gelişmeyle bağlı.
    const pl = v.planlar[0];
    for (let i = 0; i < 3; i++) {
      v.oneriler.push({ ...o0, id: "gn-m" + i, muhabirId: m.id, durum: "planaEklendi", planId: pl.id, planTarihi: pl.tarih, zaman: eski, hedefTarih: pl.tarih, cagriId: undefined, takipId: undefined, paketId: undefined });
      v.gelismeler.push({ id: "gn-mg" + i, planId: pl.id, metin: "x" + i, kaynakTuru: "muhabir", kaynakAdi: "", tarih: pl.tarih, oneriId: "gn-m" + i });
    }
    v.cagrilar.push({ id: "gn-c", tur: "nextday", tarih: gun(1), metin: "x", sonSaat: "15:00", olusturan: "pl1", zaman: new Date().toISOString(), kime: "planning@ornek.local", bcc: [m.id], etiket: "ND-TEST" });
    localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
    return m.ad.tr || m.ad.ar; // arayüz Türkçe: ad arayüzün dilinde
  });
  await git("#/");
  ok((await satir("sessizMuhabir").count()) === 1 && (await satir("sessizMuhabir").innerText()).includes(sessiz), "çağrıya yanıt vermeyen, önerisi kabul edilen muhabir: " + sessiz);
  // Sayım başlangıcı: tam yönetici Ayarlar'dan girer, öncesindeki kayıt sayılmaz
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
  await git("#/ayarlar");
  const kart = p.locator("details.katlanir", { has: p.locator("[data-sayim-baslangici]") });
  await kart.locator("summary").click();
  const bugunStr = await p.evaluate(() => new Date().toLocaleDateString("sv-SE"));
  await p.locator("[data-sayim-baslangici]").fill(bugunStr);
  await p.waitForTimeout(300);
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")).sayimBaslangici)) === bugunStr, "sayım başlangıcı kayda yazıldı");
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  await git("#/");
  ok((await satir("cevapsizOneri").count()) === 0, "başlangıçtan önceki cevapsız öneriler sayılmıyor");
  ok((await satir("sonucBekleyen").count()) === 0, "başlangıçtan önceki plandaki paket sayılmıyor");
  ok((await satir("sessizMuhabir").count()) === 0, "kabul oranı başlangıçtan önceki önerilerden hesaplanmıyor");
  ok((await satir("plansizFaaliyet").count()) === 1, "takvim uyarısı başlangıçtan etkilenmiyor");
  await p.evaluate(() => { const v = JSON.parse(localStorage.getItem("trt-planlama-v25")); delete v.sayimBaslangici; localStorage.setItem("trt-planlama-v25", JSON.stringify(v)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); });
  await git("#/");
  // Satır işin sayfasına gider
  await satir("cevapsizOneri").locator("a").click();
  await p.waitForTimeout(400);
  ok(p.url().includes("#/oneriler"), "satıra basınca öneriler açılıyor");
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `390px taşmıyor (${dil}): ${tasma}`);
    if (dil === "tr") await p.locator("[data-gun-notu]").first().screenshot({ path: (process.env.OUT || "/tmp") + "/gunun-notu-390.png" }).catch(() => {});
  }
  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
