// Postadan kişiler (Organizasyon › Kişiler): kurum adresleri toplanır, imzadan ünvan/telefon/Arapça ad okunur,
// birim tahmin edilir, toplu atanır, tek yazışta kaydedilir. Adresler ve kişiler kurgusal.
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
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await p.goto(B);
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
  await git("#/organizasyon/kisiler");
  // Kayıtlı bir kişinin telefonu boş, imzasında telefon olan postası; imzasız yeni bir adres; bir grup adresi.
  const v0 = await veri();
  const kayitli = v0.kisiler.find((k) => k.birim === "newsdesk" && k.eposta);
  await p.evaluate((kid) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const k = v.kisiler.find((x) => x.id === kid);
    k.telefon = "";
    const z = new Date().toISOString();
    v.postaMesajlari.push(
      { id: "pk-t1", konuKimligi: "pk-t1", kimden: k.eposta, kimdenAd: "Kayitli Kisi", konu: "x", metin: "tamam", tamMetin: "tamam\n\nBest regards\nNewsdesk Editor\nMobile: +90 555 000 00 01", zaman: z, ekler: [], kaynak: "posta", kime: ["planning@ornek.local"], cc: ["zeynep.kurt@ornek.local", "newsdesk@ornek.local", "dis@baska.example"] },
    );
    localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
  }, kayitli.id);
  await git("#/organizasyon/kisiler");
  ok((await p.locator("[data-pk-ac]").count()) === 1, "Kişiler sekmesinde 'Postadan kişiler' düğmesi");
  await p.locator("[data-pk-ac]").click();
  await p.waitForTimeout(300);
  await p.locator('[data-pk-kume="hepsi"]').click();
  const satir = (a) => p.locator(`[data-pk-satir="${a}"]`);
  ok((await satir("planning@ornek.local").count()) === 0 && (await satir("newsdesk@ornek.local").count()) === 0, "grup adresleri listede yok");
  ok((await satir("dis@baska.example").count()) === 0, "kurum dışı adres listede yok");
  const selim = satir("selim.aras@ornek.local");
  ok((await selim.getAttribute("data-pk-durum")) === "yeni", "kayıtta olmayan gönderen 'yeni'");
  ok((await selim.locator("[data-pk-ad-ar]").inputValue()) === "سليم آراس", "imzadaki Arapça ad dolu geldi");
  ok((await selim.locator("[data-pk-birim]").inputValue()) === "newsdesk" && (await selim.locator("[data-pk-unvan]").inputValue()) === "newsdesk", "imzadaki ünvandan birim ve ünvan tahmini");
  ok((await selim.innerText()).includes("+90 500 000 00 00"), "imzadaki telefon görünüyor");
  ok(await selim.locator("[data-pk-sec]").isChecked(), "eksiksiz yeni kişi işaretli");
  const kay = satir(kayitli.eposta.toLowerCase());
  ok((await kay.getAttribute("data-pk-durum")) === "kayitli" && (await kay.innerText()).includes("+90 555 000 00 01"), "kayıtlı kişi, imzadaki cep telefonu");
  ok(await kay.locator("[data-pk-sec]").isChecked(), "telefonu eksik kayıtlı kişi işaretli");
  const zeynep = satir("zeynep.kurt@ornek.local");
  ok((await zeynep.getAttribute("data-pk-durum")) === "yeni" && !(await zeynep.locator("[data-pk-sec]").isChecked()), "CC'deki imzasız adres yeni, işaretsiz");
  ok((await zeynep.innerText()).includes("Zeynep Kurt"), "adı adresten");
  await zeynep.locator("[data-pk-sec]").check();
  ok((await zeynep.innerText()).length > 0 && (await zeynep.locator(".rozet, [class*=rozet]").count()) >= 1, "Arapça adsız seçilince uyarı");
  await zeynep.locator("[data-pk-ad-ar]").fill("زينب كورت");
  // Toplu atama: yalnız Zeynep seçili kalsın
  await selim.locator("[data-pk-sec]").uncheck();
  await kay.locator("[data-pk-sec]").uncheck();
  await p.locator("[data-pk-toplu-birim]").selectOption("planlama");
  await p.locator("[data-pk-toplu-ata]").click();
  ok((await zeynep.locator("[data-pk-birim]").inputValue()) === "planlama", "toplu atama seçili satıra birimi verdi");
  ok((await selim.locator("[data-pk-birim]").inputValue()) === "newsdesk", "seçili olmayan satır değişmedi");
  await selim.locator("[data-pk-sec]").check();
  await kay.locator("[data-pk-sec]").check();
  ok((await p.locator("[data-pk-kaydet]").innerText()).includes("3"), "üç satır kaydedilecek");
  await p.locator("[data-pk-kaydet]").click();
  await p.waitForTimeout(500);
  const v1 = await veri();
  const s1 = v1.kisiler.find((k) => k.eposta === "selim.aras@ornek.local");
  const z1 = v1.kisiler.find((k) => k.eposta === "zeynep.kurt@ornek.local");
  ok(s1 && s1.ad.ar === "سليم آراس" && s1.ad.tr === "Selim Aras" && s1.birim === "newsdesk" && s1.telefon === "+90 500 000 00 00", "yeni kişi imzadaki bilgilerle eklendi");
  ok(z1 && z1.birim === "planlama" && z1.ad.ar === "زينب كورت", "toplu atanan kişi eklendi");
  ok(v1.kisiler.find((k) => k.id === kayitli.id).telefon === "+90 555 000 00 01", "kayıtlı kişinin boş telefonu doldu");
  ok(v1.kisiler.find((k) => k.id === kayitli.id).birim === kayitli.birim, "kayıtlı kişinin birimi değişmedi");
  // Yeniden açınca eklenenler kayıtlı
  await p.locator("[data-pk-ac]").click();
  await p.waitForTimeout(300);
  await p.locator('[data-pk-kume="hepsi"]').click();
  ok((await satir("selim.aras@ornek.local").getAttribute("data-pk-durum")) === "kayitli", "eklenen kişi artık kayıtlı");
  // Kayıtlı kişinin birimini değiştirmek tayin
  const s2 = satir("selim.aras@ornek.local");
  await s2.locator("[data-pk-birim]").selectOption("output");
  await s2.locator("[data-pk-sec]").check();
  await p.locator("[data-pk-kaydet]").click();
  await p.waitForTimeout(500);
  const v2 = await veri();
  ok(v2.kisiler.find((k) => k.eposta === "selim.aras@ornek.local").birim === "output", "kayıtlı kişinin birimi değişti");
  ok(v2.hareketler.some((h) => h.tip === "kisiTayinEdildi" && h.veri?.kime === s1.id), "tayin hareketi yazıldı");
  // Telefonda ve Arapçada taşma
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/organizasyon/kisiler");
    await p.locator("[data-pk-ac]").click();
    await p.waitForTimeout(300);
    await p.locator('[data-pk-kume="hepsi"]').click();
    const tasma = await p.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? g.scrollWidth - g.clientWidth : -1; });
    ok(tasma >= 0 && tasma <= 1, `390px pencere taşmıyor (${dil}): ` + tasma);
    const sayfa = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(sayfa <= 0, `390px sayfa taşmıyor (${dil}): ` + sayfa);
    if (dil === "tr") await p.screenshot({ path: (process.env.OUT || "/tmp") + "/posta-kisileri-390.png" });
  }
  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
