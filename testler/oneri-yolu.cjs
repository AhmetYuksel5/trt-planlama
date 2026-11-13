// Planlama'nın yeni mimarisi, 2. aşama (yeni tasarımda): önerinin yolu (kartta şerit, pencerede
// tıklanır çizgi ve "kimde"), plandan öneriye ve öneriden başlığa geçiş, plan satırlarında kişi
// çipi, muhabirin "Şimdi"si ve kayıttan durum rozeti; 390px taşma yok (Türkçe, Arapça).
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol, yeni = true) => {
    await p.evaluate(([k, y]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-tasarim", y ? "yeni" : "eski"); }, [kim, yeni]);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });

  await gir("pl2", "#/oneriler", false);
  ok((await p.locator("[data-oneri-yolu]").count()) === 0, "anahtar kapalıyken yol yok");
  await gir("pl2", "#/oneriler");
  const kart = await p.locator(".oneri-karti").count();
  ok(kart > 0 && (await p.locator('.oneri-karti [data-oneri-yolu="ince"]').count()) === kart, "her kartta yol şeridi");

  const d = await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  // PKG kararı bekleyen öneri: yol PKG'de, sıra Planlama'da.
  const bek = d.paketler.find((x) => x.oneriId && x.planId && (x.durum === "taslak" || x.durum === "degerlendiriliyor"));
  await gir("pl2", "#/oneriler/" + bek.oneriId);
  ok((await p.locator('[data-oneri-yolu="tam"]').getAttribute("data-yol-simdi")) === "pkg", "karar bekleyen PKG'de yol PKG adımında");
  ok((await p.locator("[data-yol-kimde]").innerText()).includes("Planlama"), "kimde: Planlama");
  ok((await p.locator('[data-yol-adim="plan"]').getAttribute("data-yol-durum")) === "gecti", "plan adımı geçti");
  await p.click('[data-yol-git="plan"]');
  await p.waitForTimeout(700);
  ok((await p.evaluate(() => location.hash)) === "#/nextday/" + bek.planId, "plan adımı planı açıyor");
  ok((await p.locator(`[data-plan-baslik="${bek.planBaslikId}"].hedef-vurgu:visible, [data-nd-baslik="${bek.planBaslikId}"].hedef-vurgu:visible`).count()) === 1, "önerinin başlığı açılıp vurgulanıyor");

  // Üretimdeki paketin önerisi: sıra muhabirde ya da üretimde.
  const ur = d.paketler.find((x) => x.oneriId && x.durum === "uretimde");
  await gir("pl2", "#/oneriler/" + ur.oneriId);
  ok((await p.locator('[data-oneri-yolu="tam"]').getAttribute("data-yol-simdi")) === "muhabir", "üretimdeki paketin önerisi muhabir adımında");

  // Plandaki satırdan önerisine.
  await gir("pl2", "#/nextday/" + bek.planId);
  const sim = p.locator(`[data-plan-oneri="${bek.oneriId}"]:visible`).first();
  await p.evaluate((id) => { for (let x = document.querySelector(`[data-plan-baslik="${id}"]`); x; x = x.parentElement) if (x.tagName === "DETAILS") x.open = true; }, bek.planBaslikId);
  ok((await sim.count()) === 1, "PKG satırında öneri simgesi");
  await sim.click();
  await p.waitForTimeout(400);
  ok((await p.locator('dialog[open] [data-oneri-yolu="tam"]').count()) === 1, "simge önerinin penceresini açıyor");
  // Pencereden aynı plana geri: pencere kapanır, başlık vurgulanır.
  await p.locator('dialog[open] [data-plana-git]').first().click();
  await p.waitForTimeout(700);
  ok((await p.locator("dialog[open]").count()) === 0, "aynı plana geçişte pencere kapanıyor");
  ok((await p.locator(".hedef-vurgu").count()) === 1, "aynı planda başlık vurgulanıyor");
  ok((await p.locator(".baslik-karti [data-kisi-cipi]").count()) > 0, "başlık ve PKG satırında kişi çipi");
  await gir("pl2", "#/nextday/" + bek.planId, false);
  ok((await p.locator("[data-plan-oneri], .baslik-karti [data-kisi-cipi]").count()) === 0, "anahtar kapalıyken plan satırı eskisi gibi");

  // Weekly kaleminde kişi çipi.
  const h = d.haftalik.find((x) => x.kalemler.some((k) => k.muhabirler.length));
  await gir("pl2", "#/haftalik/" + h.id);
  ok((await p.locator("[data-kalem] [data-kisi-cipi]").count()) > 0, "Weekly kaleminde kişi çipi");

  // Muhabirin "Şimdi"si: sırası bizde olan öneri; izin kaydı rozeti değiştiriyor.
  const muh = d.oneriler.find((o) => o.id === bek.oneriId).muhabirId;
  await gir("pl2", "#/muhabirler/" + muh);
  ok((await p.locator(`[data-md="bizde"] [data-md-is="${bek.oneriId}"]`).count()) === 1, "Şimdi: sırası bizde olan öneri");
  const bugun = await p.evaluate(() => new Date().toLocaleDateString("sv"));
  await p.evaluate(([m, g]) => {
    const x = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    x.kisiler.find((k) => k.id === m).durum = "gorevde";
    x.gorevlendirmeler.push({ id: "test-izin", kisiId: m, tur: "izin", durum: "onayli", baslangic: g, bitis: g, ulke: "TR", sehir: "istanbul", aciklama: "" });
    localStorage.setItem("trt-planlama-v24", JSON.stringify(x));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, [muh, bugun]);
  await gir("pl2", "#/muhabirler/" + muh);
  ok((await p.locator(".profil-bas [data-kisi-durum]").getAttribute("data-kisi-durum")) === "izinli", "profilde durum izin kaydından");
  await gir("pl2", "#/muhabirler");
  ok((await p.locator("[data-kisi-durum=izinli]").count()) >= 1, "listede durum izin kaydından");
  await gir(muh, "#/oneriler/" + bek.oneriId);
  ok((await p.locator("[data-oneri-yolu], [data-muhabir-simdi]").count()) === 0, "muhabir yolu görmüyor");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const yol of ["#/oneriler/" + bek.oneriId, "#/muhabirler/" + muh, "#/nextday/" + bek.planId]) {
      await gir("pl2", yol);
      ok((await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `390px taşma yok ${yol} (${dil})`);
    }
  }
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
