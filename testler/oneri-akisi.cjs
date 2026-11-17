// Öneri akışı (kullanıcının çizimi: ham öneri, görevlendirilmiş, takip, arşiv öneri ve paket): masaüstü panoda zaman
// çizgisinin altında şerit, sütunlar yerinde; telefonda Planlama ana sayfası tek ekran (kaydırmasız) ve sayılar iki
// ekranda aynı kuraldan (anaPano.ts → oneriAkisi). Telefonda "Sıradaki" yok, masaüstünde var.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const gir = async (p, kim, dil, yol = "#/") => {
    await p.goto(B);
    await p.evaluate(([k, d]) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-oturum", k); }, [kim, dil]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1200);
  };

  // Masaüstü: şerit, beş kutu, yerleşim aynı.
  const m = await b.newPage({ viewport: { width: 1440, height: 900 } });
  m.on("pageerror", (e) => hatalar.push(String(e)));
  await gir(m, "pl1", "tr");
  ok((await m.locator(".ap-serit [data-ap-serit]").count()) === 5, "masaüstünde şeritte beş kutu");
  const sira = await m.evaluate(() => [...document.querySelector("[data-ana-pano]").children].map((e) => e.className));
  ok(sira[0] === "ap-cizgi" && sira[1] === "ap-serit" && sira[2] === "ap-izgara", "sıra: zaman çizgisi, şerit, üç sütun: " + sira.join(","));
  ok((await m.locator("[data-ap-sutun]").count()) === 3, "üç sütun yerinde");
  ok((await m.locator(".ap-cizgi .ap-sira").count()) === 1, "masaüstünde Sıradaki duruyor");
  const masa = await m.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-ap-serit]")].map((e) => [e.dataset.apSerit, Number(e.querySelector("b").textContent)])));
  ok((await m.locator('[data-ap-serit="apHam"]').getAttribute("href")) === "#/oneriler", "ham öneri Öneriler'e götürüyor");

  // Her kutu kendi sekmesini açar ve sekmenin sayısı (arşivde ilk grup) kutununkiyle aynı (paketSekmeleri.ts).
  const em = async (sec) => Number((await m.locator(sec).first().innerText().catch(() => "0")).replace(/\D/g, "") || 0);
  ok((await m.locator('[data-ap-serit="apGorevli"]').getAttribute("href")) === "#/paketler/gorevli", "görevli kutusu Paketler › Görevlendirilmiş");
  await m.click('[data-ap-serit="apGorevli"]');
  await m.waitForTimeout(600);
  ok((await m.locator('[data-paket-sekme="gorevli"][aria-selected="true"]').count()) === 1, "Görevlendirilmiş sekmesi açık");
  ok((await em('[data-paket-sekme="gorevli"] em')) === masa.apGorevli, `görevli sayısı aynı (${await em('[data-paket-sekme="gorevli"] em')}/${masa.apGorevli})`);
  ok((await m.locator("[data-paket-sekme]").count()) === 3, "Paketler'de üç sekme");
  ok((await m.locator("main h1").first().textContent()).includes("·"), "başlıkta açık sekme");
  await gir(m, "pl1", "tr", "#/paketler/arsiv");
  ok((await m.locator('[data-paket-sekme="arsiv"][aria-selected="true"]').count()) === 1, "Arşiv sekmesi açık");
  ok((await em('[data-paket-arsiv-grubu="son7"] em')) === masa.apArsivPaket, `paket arşivi son 7 gün aynı (${await em('[data-paket-arsiv-grubu="son7"] em')}/${masa.apArsivPaket})`);
  ok((await m.locator("[data-arsiv-sonuc] [data-paket-sonucu]").count()) >= 2, "arşivde sonuç süzgeci");
  await gir(m, "pl1", "tr", "#/oneriler/arsiv");
  ok((await em('[data-oneri-gun="son7"] em')) === masa.apArsivOneri, `öneri arşivi son 7 gün aynı (${await em('[data-oneri-gun="son7"] em')}/${masa.apArsivOneri})`);

  // Birimin uygun bulduğu öneri reddedilince "görevlendirme bekliyor"dan çıkar (masaSorusu.ts → masaninSorulari).
  const soru = await m.evaluate(() => {
    const k = "trt-planlama-v25";
    const d = JSON.parse(localStorage.getItem(k));
    const o = d.oneriler.find((x) => x.muhabirId && !x.talimatVeren && ["yeni", "degerlendiriliyor"].includes(x.durum));
    o.durum = "degerlendiriliyor";
    d.masaSorulari = [...(d.masaSorulari ?? []), { id: "ms-test", oneriId: o.id, birim: "ekonomi", soran: "pl1", zaman: new Date().toISOString(), cevap: { kabul: true, kisiId: "ek1", zaman: new Date().toISOString() } }];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return o.id;
  });
  const git = async (yol) => { await m.goto("about:blank"); await m.goto(B + yol); await m.waitForTimeout(1000); };
  await git("#/oneriler");
  ok((await m.locator(`[data-masalardaki-oneriler] [data-masa-oneri="${soru}"]`).count()) === 1, "uygun bulunan öneri görev bekliyor");
  await m.evaluate((id) => {
    const k = "trt-planlama-v25";
    const d = JSON.parse(localStorage.getItem(k));
    d.oneriler.find((x) => x.id === id).durum = "reddedildi";
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, soru);
  await git("#/oneriler");
  ok((await m.locator(`[data-masalardaki-oneriler] [data-masa-oneri="${soru}"]`).count()) === 0, "reddedilince birim görüşü listesinden çıkıyor");

  // Telefon: tek ekran, sayılar masaüstüyle aynı.
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"] });
    const p = await c.newPage();
    p.on("pageerror", (e) => hatalar.push(String(e)));
    await gir(p, "pl1", dil);
    ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${dil}: yatay taşma yok`);
    // Prototip şeridi gerçek kipte yok: sayfa ona rağmen görünür alana (birkaç piksel payla) sığıyor.
    const fazla = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    ok(fazla <= 8, `${dil}: telefonda kaydırmasız (${fazla} px fazla)`);
    ok((await p.locator(".ap-sira, [data-ana-pano]").count()) === 0, `${dil}: telefonda Sıradaki ve pano yok`);
    ok((await p.locator("[data-py-akis]").count()) === 4, `${dil}: akışın dört kutusu`);
    const tel = await p.evaluate(() => ({
      apHam: Number(document.querySelector('[data-py-kutu="oneri"] .py-sayi').textContent),
      apGorevli: Number(document.querySelector('[data-py-akis="gorevli"] b').textContent),
      apTakip: Number(document.querySelector('[data-py-akis="takip"] b').textContent),
      apArsivOneri: Number(document.querySelector('[data-py-akis="arsivOneri"] b').textContent),
      apArsivPaket: Number(document.querySelector('[data-py-akis="arsivPaket"] b').textContent),
    }));
    ok(JSON.stringify(tel) === JSON.stringify(masa), `${dil}: sayılar masaüstüyle aynı ${JSON.stringify(tel)} / ${JSON.stringify(masa)}`);
    ok((await p.locator('[data-py-akis="takip"]').getAttribute("href")) === "#/takipler", `${dil}: takip Takiplerim'e götürüyor`);
    const kutular = await p.evaluate(() => [...document.querySelectorAll("[data-py-kutu]")].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height < 44).length);
    ok(kutular === 0, `${dil}: kutular 44 pikselden alçak değil`);
    await p.locator('[data-py-kutu="oneri"]').tap();
    await p.waitForTimeout(400);
    ok((await p.locator('[data-py-panel="oneri"]').count()) === 1, `${dil}: ham öneri paneli açıyor`);
    await c.close();
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
