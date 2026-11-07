// Gelen posta sohbeti: yapıştırma ile sohbete düşme, alıntı ayıklama, konuya göre iplik, silme, muhabir görmez, 390px
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
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());

  // Muhabir posta sayfasını görmez
  await kim("mu1");
  await git("#/");
  ok((await p.locator('a[href="#/posta"]').count()) === 0, "muhabirin menüsünde posta yok");
  await git("#/posta");
  ok((await p.locator("[data-posta-liste]").count()) === 0 && (await p.locator("[data-posta-kimden]").count()) === 0, "muhabir posta sayfasını açamıyor");

  // Planlamacı görür ve yapıştırarak ekler
  await kim("pl1");
  await git("#/");
  ok((await p.locator('a[href="#/posta"]').count()) >= 1, "planlamacının menüsünde posta");
  await git("#/posta");
  ok((await p.locator("[data-posta-kimden]").count()) === 1, "köprü açık");

  const metinli = "Yarın Gazze'den bir paket önerim var.\nDetay: https://ornek.local/haber\n\nMuhammed Ali\nمراسل TRT عربي\nجوال: +90 555 111 2233\n\nOn Mon, 3 Nov 2026 at 10:00, Planlama <planning@trt.net.tr> wrote:\n> Önerilerinizi bekliyoruz";
  await p.locator("[data-posta-kimden]").fill("omar@ornek.local");
  await p.locator("[data-posta-konu]").fill("Gazze önerisi");
  await p.locator("[data-posta-metin]").fill(metinli);
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1, "yapıştırılan posta sohbete düştü");

  // Sohbeti aç: alıntı ayıklanmış, ekleniş metni görünür
  await p.locator("[data-posta-sohbet-bag]").first().click();
  await p.waitForTimeout(300);
  const govde = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(govde.includes("paket önerim var"), "yeni metin sohbette");
  ok(!govde.includes("wrote:") && !govde.includes("Önerilerinizi bekliyoruz"), "alıntı ayıklandı");
  ok(!govde.includes("https://") && !govde.includes("ornek.local"), "bağlantı silindi");
  ok(!govde.includes("مراسل") && !govde.includes("555"), "imza/ünvan/telefon silindi");

  // Aynı konunun yanıtı (RE:) aynı sohbete
  await p.locator("[data-posta-kimden]").fill("omar@ornek.local");
  await p.locator("[data-posta-konu]").fill("RE: Gazze önerisi");
  await p.locator("[data-posta-metin]").fill("Ek olarak canlı yayın da olabilir.");
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1, "RE: yanıtı yeni sohbet açmadı, tek iplik");
  await p.locator("[data-posta-sohbet-bag]").first().click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === 2, "sohbette iki mesaj, zaman sırasıyla");

  // Buradan yanıt gönder (demoda yalnız ekrana giden balon)
  await p.locator("[data-posta-yaz]").fill("Teşekkürler, planladık.");
  await p.locator("[data-posta-gonder]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === 3, "gönderilen yanıt sohbete eklendi");
  ok((await p.locator("[data-posta-sohbet] .posta-balon.giden").count()) === 1, "giden balon sağda");

  // Farklı konu ayrı sohbet
  await p.locator("[data-posta-kimden]").fill("selin@ornek.local");
  await p.locator("[data-posta-konu]").fill("Kudüs gelişmesi");
  await p.locator("[data-posta-metin]").fill("Bugün Kudüs'te gerginlik var.");
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 2, "farklı konu ayrı sohbet");

  // Tekillik: aynı Message-ID yoksa yapıştırmada mesaj kimliği yok, ama kayıt sayısı artar; silme izleriyle gider
  const once = (await veri()).postaMesajlari.length;
  ok(once === 4, "dört mesaj kayıtlı (2 Gazze + 1 giden + 1 Kudüs): " + once);
  await p.locator('[data-posta-sohbet-bag]').first().click();
  await p.waitForTimeout(200);
  await p.locator('.posta-duzen .kart').last().locator('button[title]').click();
  await p.waitForTimeout(400);
  const sonra = (await veri()).postaMesajlari.length;
  ok(sonra < once, "sohbet izleriyle silindi: " + once + " → " + sonra);

  // Ek filtresi: gerçek dosya görünür, imza/logo görseli gizli
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.postaMesajlari = (v.postaMesajlari || []).concat([{
      id: "pm-ek-test", konuKimligi: "ek-test-konu", kimden: "ekli@ornek.local",
      kimdenAd: "Ekli Gönderen", konu: "Ekli posta", metin: "Rapor ektedir.", tamMetin: "Rapor ektedir.",
      zaman: new Date().toISOString(), ekler: ["rapor.pdf", "image001.png", "logo.png", "imza-banner.jpg", "trtlogo_fa524c36-bb0d-49e9-9a6b-04762f995512.png", "facebook_13f4222f-a2aa-44fb-93ad-116e2eecf20a.png"],
      kaynak: "iceAktarma",
    }]);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  });
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag]').filter({ hasText: "Ekli posta" }).first().click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-sohbet] .posta-ek").count()) === 1, "yalnız gerçek dosya eki görünür (pdf), görseller gizli");
  ok((await p.locator("[data-posta-sohbet] .posta-ek").first().innerText()).includes("rapor.pdf"), "görünen ek rapor.pdf");

  // İmza/isim bloğu silinir, içerik kalır
  const imzali = "رجاء مراجعة التقرير المرفق قبل الغد.\n\nمحمد صفا\nمراسل TRT عربي\nجوال: +90 555 111 2233\nmehmet@trt.net.tr\nمع التحية";
  await p.evaluate((metin) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.postaMesajlari = (v.postaMesajlari || []).concat([{
      id: "pm-imza-test", konuKimligi: "imza-test-konu", kimden: "muhammed@trt.net.tr",
      kimdenAd: "Muhammed Ali", konu: "İmza testi", metin, tamMetin: metin,
      zaman: new Date().toISOString(), ekler: [], kaynak: "iceAktarma",
    }]);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, imzali);
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag]').filter({ hasText: "İmza testi" }).first().click();
  await p.waitForTimeout(300);
  const imzaGovde = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(imzaGovde.includes("مراجعة التقرير"), "içerik kaldı");
  ok(!imzaGovde.includes("محمد صفا") && !imzaGovde.includes("مراسل") && !imzaGovde.includes("مع التحية") && !imzaGovde.includes("555"), "isim/ünvan/kapanış/telefon silindi");

  // Ana metindeki bağlantı korunur; imza bağlantısı ve isim gider
  const linkli = "الخبر مهم، التفاصيل هنا https://example.com/haber\nنرجو المتابعة اليوم\nمحمد صفا\nمراسل TRT عربي\nhttps://trtarabi.com";
  await p.evaluate((metin) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.postaMesajlari = (v.postaMesajlari || []).concat([{
      id: "pm-link-test", konuKimligi: "link-test-konu", kimden: "selim@ornek.local",
      kimdenAd: "Selim", konu: "Link testi", metin, tamMetin: metin,
      zaman: new Date().toISOString(), ekler: [], kaynak: "iceAktarma",
    }]);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, linkli);
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag]').filter({ hasText: "Link testi" }).first().click();
  await p.waitForTimeout(300);
  const linkGovde = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(linkGovde.includes("example.com/haber"), "ana metindeki bağlantı korundu");
  ok(!linkGovde.includes("trtarabi.com") && !linkGovde.includes("محمد صفا") && !linkGovde.includes("مراسل"), "imza bağlantısı ve isim silindi");

  // Gövde tümüyle imza (içerik yok): ham imza dökülmez, "yalnızca imza" işareti
  const yalnizImza = "https://www.trt.net.tr/>>\n<https://www.trtarabi.com/>\nShafık SAHLI\n\nSenior Script Editor\nTRT Arabi Kanal\n00 30 326 (212) 90+";
  await p.evaluate((metin) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.postaMesajlari = (v.postaMesajlari || []).concat([{
      id: "pm-imzaonly-test", konuKimligi: "imzaonly-konu", kimden: "sahli@ornek.local",
      kimdenAd: "Shafık SAHLI", konu: "Yalnız imza testi", metin, tamMetin: metin,
      zaman: new Date().toISOString(), ekler: [], kaynak: "iceAktarma",
    }]);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, yalnizImza);
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag]').filter({ hasText: "Yalnız imza testi" }).first().click();
  await p.waitForTimeout(300);
  const imzaOnly = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(!imzaOnly.includes("trt.net.tr") && !imzaOnly.includes("Senior Script") && !imzaOnly.includes("212"), "ham imza dökülmedi");
  ok((await p.locator("[data-posta-sohbet] .posta-bos").count()) === 1, "yalnızca imza işareti gösterildi");

  // 390px: yatay taşma yok (Türkçe ve Arapça)
  for (const d of ["tr", "ar"]) {
    await kim("pl1", d);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/posta");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 1, "390px taşma yok (" + d + "): " + tasma);
  }
  await p.setViewportSize({ width: 1440, height: 1000 });

  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
