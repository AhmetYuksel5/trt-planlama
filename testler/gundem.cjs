// Gündem takibi: yalnız tam yönetici, etiketli akış ve takip edilen etiketler, sınıflandırma ve öncelik, bölgeler arası, arşiv, öneriye çevirme, 390px
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const kim = async (id, dil = "tr") => { await p.goto(B); await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [id, dil]); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v23")));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());

  await kim("pl1");
  await git("#/");
  ok((await p.locator('a[href="#/gundem"]').count()) === 0, "planlamacının menüsünde gündem takibi yok");
  await git("#/gundem");
  ok((await p.locator("[data-gundem]").count()) === 0, "planlamacı sayfayı açamıyor");

  await kim("yo3");
  await git("#/");
  ok((await p.locator('a[href="#/gundem"]').count()) >= 1, "tam yöneticinin menüsünde gündem takibi");
  await git("#/gundem");
  ok((await p.locator("[data-gundem-sekme]").count()) === 5, "5 sekme (brifing, akış, etkinlikler, fırsatlar, arşiv)");
  ok((await p.locator("[data-brifing] [data-brifing-konu]").count()) >= 18, "brifingde A ve B konuları");
  const sudan = p.locator('[data-brifing] [data-brifing-konu="sudan"]');
  ok((await sudan.locator("[data-olay]").count()) >= 1 && (await sudan.locator("[data-seviye]").first().getAttribute("data-seviye")) !== "sakin", "Sudan brifingde, hareketli");
  ok((await p.locator('[data-brifing-konu="libya"] [data-degisiklik-yok]').count()) === 1, "Libya (30 saat önce) için 'değişiklik yok'");
  ok((await p.locator("[data-brifing-c] [data-olay]").count()) >= 1, "C: bölgeler arası olay");
  ok((await p.locator("[data-brifing-d] [data-firsat]").count()) >= 1, "D: editoryal fırsat");

  // Haber akışı: en yenisi üstte, etiketlerle
  await git("#/gundem/akis");
  const zamanlar = await p.locator('[data-olay-listesi="akis"] > [data-olay]').evaluateAll((l) => l.map((e) => e.querySelector(".gundem-olay-alt span").textContent));
  ok(zamanlar.length >= 10, "akışta haberler: " + zamanlar.length);
  const hanYunus = p.locator('[data-olay-listesi="akis"] [data-olay]').filter({ hasText: "خان يونس" });
  ok((await hanYunus.count()) === 1 && (await hanYunus.locator("[data-olay-kaynaklar]").innerText()).includes("2"), "iki kaynağın aynı haberi tek olay, 2 kaynak");
  const ilkIki = await p.locator('[data-olay-listesi="akis"] > [data-olay]').evaluateAll((l) => l.slice(0, 2).map((e) => e.textContent));
  ok(ilkIki[0].includes("خان يونس"), "en yeni haber üstte");
  ok((await hanYunus.locator('[data-olay-etiket="filistin"]').count()) === 1, "haberde etiketi");
  // Etikete basınca süzülür; alt başlık yalnız kendisi
  await p.locator('[data-etiket="etiyopya:amhara"] .gundem-etiket-ad').click();
  ok((await p.locator('[data-olay-listesi="akis"] > [data-olay]').count()) === 1 && (await p.locator('[data-olay-listesi="akis"]').innerText()).includes("Fano"), "Amhara/Fano etiketi süzdü");
  await p.locator('[data-etiket="sudan"] .gundem-etiket-ad').click();
  ok((await p.locator('[data-olay-listesi="akis"] > [data-olay]').count()) >= 3, "iki etiket: birine uyanlar");
  await p.locator("[data-secimi-temizle]").click();
  // Habercikteki etikete basınca da süzer
  await hanYunus.locator('[data-olay-etiket="filistin"]').click();
  ok((await p.locator('[data-etiket="filistin"]').getAttribute("class")).includes("secili"), "haberdeki etiketten süzgeç");
  await p.locator("[data-secimi-temizle]").click();
  const tuzak = p.locator('[data-olay-listesi="akis"] [data-olay]').filter({ hasText: "مشاركة واسعة" });
  ok((await tuzak.count()) === 1 && (await tuzak.locator("[data-olay-etiket]").count()) === 0, "Arapça sözcük sınırı: مشاركة/الرياضة/حلبة etiket almadı");
  const etiketleri = async (metin) => p.locator('[data-olay-listesi="akis"] [data-olay]').filter({ hasText: metin }).first().locator("[data-olay-etiket]").evaluateAll((l) => l.map((e) => e.dataset.olayEtiket));
  const paris = await etiketleri("ماكرون يستقبل");
  ok(paris.includes("lubnan") && !paris.includes("sudan"), "özetteki tek sözcük konu vermez: Paris haberi Lübnan, Sudan değil " + paris);
  const sudani = await etiketleri("شياع السوداني");
  ok(sudani.includes("irak") && !sudani.includes("sudan"), "Irak başbakanının soyadı Sudan sayılmaz " + sudani);
  // Türkiye: iç gündem değil, dış politika
  await p.locator('[data-etiket="turkiye"] .gundem-etiket-ad').click();
  ok((await p.locator('[data-olay-listesi="akis"] > [data-olay]').count()) === 1, "Türkiye etiketinde dış politika haberi");
  await p.locator("[data-secimi-temizle]").click();
  // Takip edilen etiketler: kaydedilir, "takip ettiklerim" bütün akışı süzer
  await p.locator('[data-etiket="sudan"] [data-etiket-takip]').click();
  ok(await p.locator("[data-yalniz-takip]").isChecked(), "ilk yıldızda anahtar açıldı");
  await p.locator('[data-etiket="etiyopya"] [data-etiket-takip]').click();
  ok(JSON.stringify(await p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-gundem-etiket")))) === '["sudan","etiyopya"]', "takip edilen etiketler tarayıcıda");
  await git("#/gundem/akis");
  ok(await p.locator("[data-yalniz-takip]").isChecked(), "açılışta takip ettiklerim açık");
  const takipteki = await p.locator('[data-olay-listesi="akis"] > [data-olay]').evaluateAll((l) => l.map((e) => [...e.querySelectorAll("[data-olay-etiket]")].map((x) => x.dataset.olayEtiket)));
  ok(takipteki.length > 0 && takipteki.every((e) => e.some((x) => x === "sudan" || x === "etiyopya")), "akış yalnız takip edilen etiketler");
  await p.locator('[data-etiket="etiyopya:amhara"] .gundem-etiket-ad').click();
  ok((await p.locator('[data-olay-listesi="akis"] > [data-olay]').count()) === 1 && (await p.locator("[data-yalniz-takip]").isChecked()), "takip açıkken seçilen etiket takip içinde daralttı");
  await p.locator("[data-secimi-temizle]").click();
  await p.locator("[data-yalniz-takip]").uncheck();
  ok((await p.locator('[data-olay-listesi="akis"] > [data-olay]').count()) > takipteki.length, "anahtar kapanınca bütün haberler");

  // Arşiv
  const sudanHaberi = () => p.locator('[data-olay-listesi="akis"] [data-olay]').filter({ has: p.locator('[data-olay-etiket="sudan"]') }).first();
  await sudanHaberi().locator("[data-arsive-ekle]").click();
  await p.locator("[data-arsiv-not]").fill("Darfur dosyası için kaynak");
  await p.locator("[data-arsiv-kaydet]").click();
  await p.waitForTimeout(300);
  let d = await veri();
  ok(d.gundemArsivi.length === 1 && d.gundemArsivi[0].kisiId === "yo3" && d.gundemArsivi[0].konular.includes("sudan"), "arşive not kaydedildi");
  await sudanHaberi().locator("[data-arsive-ekle]").click();
  await p.locator("[data-arsiv-kaydet]").click();
  await p.waitForTimeout(300);
  ok((await veri()).gundemArsivi.length === 1, "aynı haber ikinci kez: çoğalmadı");
  await git("#/gundem/arsiv");
  ok((await p.locator("[data-arsiv-notu]").count()) === 1, "arşiv sekmesinde");

  // Öneriye çevir
  await git("#/gundem/firsatlar");
  await p.locator("[data-oneriye-cevir]").first().click();
  await p.locator("[data-cevir-header]").fill("تصعيد في الفاشر");
  await p.locator("[data-cevir-gonder]").click();
  await p.waitForTimeout(300);
  d = await veri();
  const o = d.oneriler.find((x) => x.haberBasligi === "تصعيد في الفاشر");
  ok(o && o.kaynakTuru === "medya" && o.durum === "yeni", "fırsat öneri akışına muhabir dışı kaynak olarak girdi " + (o && o.kaynakTuru));
  await p.locator(".bildiri button, [data-bildiri] button").filter({ hasText: /Aç/ }).first().click().catch(() => {});
  await p.waitForTimeout(300);
  ok(p.url().endsWith(`#/oneriler/${o && o.id}`), "bildirimdeki Aç önerinin sayfasını açtı: " + p.url());

  // Kaynaklar
  await git("#/gundem");
  await p.locator("[data-gundem-kaynaklar]").click();
  ok((await p.locator("[data-kaynak]").count()) >= 10, "kurulu kaynak listesi");
  await p.locator("[data-kaynak-ad]").fill("Örnek akış");
  await p.locator("[data-kaynak-adres]").fill("https://ornek.test/rss");
  await p.locator("[data-kaynak-ekle]").click();
  ok((await p.locator('[data-kaynak^="gk-ara-"]').count()) >= 20, "konu aramaları kurulu listede");
  ok((await p.locator('[data-kaynak^="gk-tg-"]').count()) >= 8, "Telegram kanalları kurulu listede");
  await p.locator("[data-telegram-kanal]").fill("t.me/OrnekKanal");
  await p.locator("[data-telegram-ekle]").click();
  await p.locator("[data-telegram-kanal]").fill("@OrnekKanal");
  ok(!(await p.locator("[data-telegram-ekle]").isDisabled()), "@kanal biçimi tanınıyor");
  await p.locator("[data-telegram-ekle]").click();
  await p.locator("[data-telegram-kanal]").fill("geçersiz kanal!");
  ok(await p.locator("[data-telegram-ekle]").isDisabled(), "geçersiz kanal adı eklenmez");
  await p.locator("[data-telegram-kanal]").fill("");
  await p.locator("[data-arama-sorgu]").fill("Assab OR عصب");
  await p.locator("[data-arama-ekle]").click();
  await p.locator("[data-kaynak-kaydet]").click();
  await p.waitForTimeout(300);
  const kk = (await veri()).gundemKaynaklari;
  ok(kk.some((k) => k.adres === "https://ornek.test/rss"), "kaynak eklendi, kayda yazıldı");
  ok(kk.filter((k) => k.adres.toLowerCase() === "https://t.me/s/ornekkanal" && k.tur === "telegram").length === 1, "Telegram kanalı bir kez eklendi");
  ok(kk.some((k) => k.tur === "arama" && k.adres.startsWith("https://news.google.com/rss/search?q=") && decodeURIComponent(k.adres).includes("Assab OR عصب when:1d")), "konu araması son 24 saatle eklendi");
  // Kayıtlı listeden çıkan kurulu kaynak "eksik"te geri gelir
  await p.locator("[data-gundem-kaynaklar]").click();
  await p.locator('[data-kaynak="gk-aawsat"] button').click();
  ok((await p.locator("[data-varsayilan-ekle]").count()) === 1, "eksik kurulu kaynak düğmesi");
  await p.locator("[data-varsayilan-ekle]").click();
  ok((await p.locator('[data-kaynak="gk-aawsat"]').count()) === 1 && (await p.locator("[data-varsayilan-ekle]").count()) === 0, "eksik kurulu kaynak geri eklendi");
  await p.keyboard.press("Escape");

  // Telefonda etiket çubuğu kapalı: yalnız takip edilenler, ilk ekranda haber görünür
  await p.setViewportSize({ width: 390, height: 844 });
  await git("#/gundem/akis");
  const ilkHaberY = await p.locator('[data-olay-listesi="akis"] > [data-olay]').first().evaluate((e) => e.getBoundingClientRect().top);
  ok(ilkHaberY < 844, "telefonda ilk ekranda haber var: y=" + Math.round(ilkHaberY));
  ok((await p.locator("[data-etiket]").count()) === 2, "telefonda çubukta yalnız takip edilen etiketler");
  await p.setViewportSize({ width: 1440, height: 1000 });

  // 390px
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await kim("yo3", dil);
    for (const s of ["brifing", "akis", "etkinlikler", "firsatlar", "arsiv"]) {
      await git("#/gundem/" + s);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t === 0, `390px ${dil} ${s}: taşma ${t}`);
    }
  }
  await p.screenshot({ path: (process.env.OUT || ".") + "/gundem-390-ar.png", fullPage: false });
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
