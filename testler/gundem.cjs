// Gündem takibi: yalnız tam yönetici, 12 sekme, sınıflandırma ve öncelik, bölgeler arası, arşiv, öneriye çevirme, 390px
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
  ok((await p.locator("[data-gundem-sekme]").count()) === 12, "12 sekme");
  ok((await p.locator("[data-brifing] [data-brifing-konu]").count()) >= 18, "brifingde A ve B konuları");
  const sudan = p.locator('[data-brifing] [data-brifing-konu="sudan"]');
  ok((await sudan.locator("[data-olay]").count()) >= 1 && (await sudan.locator("[data-seviye]").first().getAttribute("data-seviye")) !== "sakin", "Sudan brifingde, hareketli");
  ok((await p.locator('[data-brifing-konu="libya"] [data-degisiklik-yok]').count()) === 1, "Libya (30 saat önce) için 'değişiklik yok'");
  ok((await p.locator("[data-brifing-c] [data-olay]").count()) >= 1, "C: bölgeler arası olay");
  ok((await p.locator("[data-brifing-d] [data-firsat]").count()) >= 1, "D: editoryal fırsat");

  // Aynı olayı iki kaynak: tek olay, iki kaynak
  await git("#/gundem/ortadogu");
  const fil = p.locator('[data-konu="filistin"]');
  const hanYunus = fil.locator("[data-olay]").filter({ hasText: "خان يونس" });
  ok((await hanYunus.count()) === 1 && (await hanYunus.locator("[data-olay-kaynaklar]").innerText()).includes("2"), "iki kaynağın aynı haberi tek olay, 2 kaynak");
  const ilk = await p.locator(".gundem-izgara > [data-konu]").first().getAttribute("data-konu");
  const son = await p.locator(".gundem-izgara > [data-konu]").last().getAttribute("class");
  ok(["filistin", "sudan"].includes(ilk) && son.includes("sev-sakin"), `öncelik sırası: önde ${ilk}, sonda sakin konu`);

  // Etiyopya dosyası: alt başlıklar
  await git("#/gundem/boynuz");
  const et = p.locator('[data-konu="etiyopya"]');
  ok((await et.locator("[data-alt]").count()) === 11, "Etiyopya dosyasında 11 alt başlık");
  await et.locator('[data-alt="amhara"]').click();
  ok((await et.locator("[data-olay]").count()) === 1 && (await et.locator("[data-olay]").innerText()).includes("Fano"), "Amhara/Fano süzgeci");
  // Türkiye: iç gündem değil, dış politika
  await git("#/gundem/turkiye");
  ok((await p.locator('[data-konu="turkiye"] [data-olay]').count()) === 1, "Türkiye klasöründe dış politika haberi");

  // Arşiv
  await git("#/gundem/ortadogu");
  await p.locator('[data-konu="sudan"] [data-olay] [data-arsive-ekle]').first().click();
  await p.locator("[data-arsiv-not]").fill("Darfur dosyası için kaynak");
  await p.locator("[data-arsiv-kaydet]").click();
  await p.waitForTimeout(300);
  let d = await veri();
  ok(d.gundemArsivi.length === 1 && d.gundemArsivi[0].kisiId === "yo3" && d.gundemArsivi[0].konular.includes("sudan"), "arşive not kaydedildi");
  await p.locator('[data-konu="sudan"] [data-olay] [data-arsive-ekle]').first().click();
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

  // Kaynaklar
  await git("#/gundem");
  await p.locator("[data-gundem-kaynaklar]").click();
  ok((await p.locator("[data-kaynak]").count()) >= 10, "kurulu kaynak listesi");
  await p.locator("[data-kaynak-ad]").fill("Örnek akış");
  await p.locator("[data-kaynak-adres]").fill("https://ornek.test/rss");
  await p.locator("[data-kaynak-ekle]").click();
  ok((await p.locator('[data-kaynak^="gk-ara-"]').count()) >= 20, "konu aramaları kurulu listede");
  await p.locator("[data-arama-sorgu]").fill("Assab OR عصب");
  await p.locator("[data-arama-ekle]").click();
  await p.locator("[data-kaynak-kaydet]").click();
  await p.waitForTimeout(300);
  const kk = (await veri()).gundemKaynaklari;
  ok(kk.some((k) => k.adres === "https://ornek.test/rss"), "kaynak eklendi, kayda yazıldı");
  ok(kk.some((k) => k.tur === "arama" && k.adres.startsWith("https://news.google.com/rss/search?q=") && decodeURIComponent(k.adres).includes("Assab OR عصب when:1d")), "konu araması son 24 saatle eklendi");
  // Kayıtlı listeden çıkan kurulu kaynak "eksik"te geri gelir
  await p.locator("[data-gundem-kaynaklar]").click();
  await p.locator('[data-kaynak="gk-aawsat"] button').click();
  ok((await p.locator("[data-varsayilan-ekle]").count()) === 1, "eksik kurulu kaynak düğmesi");
  await p.locator("[data-varsayilan-ekle]").click();
  ok((await p.locator('[data-kaynak="gk-aawsat"]').count()) === 1 && (await p.locator("[data-varsayilan-ekle]").count()) === 0, "eksik kurulu kaynak geri eklendi");
  await p.keyboard.press("Escape");

  // 390px
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await kim("yo3", dil);
    for (const s of ["brifing", "ortadogu", "boynuz", "capraz", "etkinlikler", "firsatlar", "arsiv"]) {
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
