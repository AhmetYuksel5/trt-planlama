// Öneriler sayfasının sekmeleri (oneriSekmeleri.ts): varsayılan karar bekleyen; gündeme giren öneri
// hemen "Planda / gündemde"ye, teklif "Sırası başkasında"ya geçer; takip sayfada yok; sayılar süzgeçle
// tutarlı; gün grupları; ⋯ menüsü; 390 pikselde taşma yok (Türkçe ve Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);
  const gun = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv-SE"); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/oneriler");
  const d = await veri();
  const yeni = (id, ek) => ({ ...d.oneriler.find((o) => o.muhabirId && !o.talimatVeren && !o.takipTuru && o.bicim !== "takip" && o.durum !== "takip"), id, zaman: new Date().toISOString(), giren: undefined, planId: undefined, planTarihi: undefined, paketId: undefined, hafta: undefined, arsiv: undefined, satirlar: undefined, ...ek });
  const IZ = "سكمة_اختبار";
  d.oneriler.push(
    yeni("o-sk-karar", { durum: "yeni", hedefTarih: gun(1), haberBasligi: IZ + " قرار" }),
    yeni("o-sk-gundem", { durum: "degerlendiriliyor", hedefTarih: gun(2), haberBasligi: IZ + " أجندة" }),
    yeni("o-sk-teklif", { durum: "teklif", yon: "muhabire", hedefTarih: gun(1), haberBasligi: IZ + " عرض" }),
    yeni("o-sk-takip", { durum: "takip", bicim: "takip", takipTuru: "olay", hedefTarih: gun(1), haberBasligi: IZ + " متابعة" }),
  );
  const h = d.haftalik.find((x) => x.durum !== "kesinlesti");
  h.kalemler.push({ ...h.kalemler[0], id: "kl-sk", oneriId: "o-sk-gundem", karar: undefined, aktarim: undefined });
  await yaz(d);

  await git("#/oneriler");
  ok((await p.getAttribute('[data-oneri-sekme="karar"]', "aria-selected")) === "true", "varsayılan sekme karar bekleyen");
  ok((await p.locator('[data-oneri="o-sk-karar"]').count()) === 1, "karar bekleyen öneri listede");
  ok((await p.locator('[data-oneri-gun="yarin"] [data-oneri="o-sk-karar"]').count()) === 1, "yarının önerisi Yarın grubunda");
  ok((await p.locator('[data-oneri="o-sk-gundem"]').count()) === 0, "gündemdeki öneri karar listesinde yok");
  ok((await p.locator('[data-oneri="o-sk-teklif"]').count()) === 0, "teklif karar listesinde yok");
  ok((await p.locator('[data-oneri="o-sk-takip"]').count()) === 0, "takip karar listesinde yok");

  // Sayılar süzgeçten: aramayla yalnız deneme önerileri kalır.
  await p.fill('input[type="search"]', IZ);
  await p.waitForTimeout(300);
  const sayi = async (s) => Number((await p.locator(`[data-oneri-sekme="${s}"] em`).innerText().catch(() => "0")) || 0);
  ok((await sayi("karar")) === 1, "karar sayısı aramayla 1");
  ok((await sayi("planda")) === 1, "planda sayısı aramayla 1");
  ok((await sayi("baskasinda")) === 1, "başkasında sayısı aramayla 1");
  ok((await p.locator("[data-oneri]").count()) === (await sayi("karar")), "sayı listedeki kartla aynı");

  await p.click('[data-oneri-sekme="planda"]');
  await p.waitForTimeout(300);
  ok((await p.locator('[data-oneri="o-sk-gundem"]').count()) === 1, "gündemdeki öneri Planda sekmesinde");
  await p.click('[data-oneri-sekme="baskasinda"]');
  await p.waitForTimeout(300);
  ok((await p.locator('[data-oneri="o-sk-teklif"]').count()) === 1, "teklif Sırası başkasında sekmesinde");
  ok(!(await p.locator('[data-oneri-sekme="arsiv"]').count()) || (await sayi("arsiv")) === 0, "boş arşiv sekmesi yok ya da sıfır");

  // Geri gelince sekme bırakıldığı gibi.
  await p.goto(B + "#/ayarlar");
  await p.waitForTimeout(400);
  await p.goBack();
  await p.waitForTimeout(600);
  ok((await p.getAttribute('[data-oneri-sekme="baskasinda"]', "aria-selected")) === "true", "geri dönünce sekme yerinde");

  // ⋯ menüsü: gelen yanıtlar, çağrı, takipler.
  await git("#/oneriler");
  await p.click('[aria-label="Diğer işlemler"]');
  ok((await p.locator('[data-oneri-menu="yanitlar"]').count()) === 1, "menüde gelen yanıtlar");
  ok((await p.locator('[data-oneri-menu="takipler"]').count()) === 1, "menüde muhabir takipleri");
  ok((await p.locator("[data-oneri-gir]").count()) === 1, "tek birincil düğme");

  // Arşiv adresi arşiv sekmesiyle açılır.
  await git("#/oneriler/arsiv");
  ok((await p.getAttribute('[data-oneri-sekme="arsiv"]', "aria-selected")) === "true", "arşiv adresi arşiv sekmesinde");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git("#/oneriler");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(tasma <= 0, `390px taşma yok (${dil}): ${tasma}`);
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
