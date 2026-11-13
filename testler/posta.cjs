// Gelen posta sohbeti: örnek yazışmalar, kim kime yazdı, yanıtta @/cc/bcc satırları, yeni posta, silme, imza ayıklama, muhabir görmez, 390px
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

  // Planlamacı görür; içe aktarma kartı yok, demoda örnek yazışmalar var
  await kim("pl1");
  await git("#/");
  ok((await p.locator('a[href="#/posta"]').count()) >= 1, "planlamacının menüsünde posta");
  await git("#/posta");
  ok((await p.locator("[data-posta-kimden]").count()) === 0 && (await p.locator(".birakma-alani").count()) === 0, "içe aktarma kartı kalktı");
  ok((await p.locator("[data-posta-liste] > li").count()) === 3, "demoda üç örnek yazışma");
  const v0 = await veri();
  const muhabirler = v0.kisiler.filter((k) => k.birim === "muhabir");
  const kucuk = (a) => String(a || "").toLowerCase();
  const m1 = muhabirler[0], m2 = muhabirler[1];
  // Arayüz Türkçe: alıcı çipinde ad arayüzün dilinde (Latin yazım, yoksa Arapça).
  const arAd = (k) => (typeof k.ad === "string" ? k.ad : k.ad.tr || k.ad.ar);
  const trAd = (k) => (typeof k.ad === "string" ? k.ad : k.ad.tr);

  // Kim kime yazdı: her balonun altında alıcı satırı
  await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-sohbet] [data-posta-alici-satiri]").count()) === 3, "her balonda kime/CC satırı");
  ok((await p.locator("[data-posta-sohbet] .posta-balon.giden [data-posta-alici-satiri]").innerText()).includes("CC"), "giden balonda CC görünüyor");

  // Yanıt: @ yazılmazsa yazışmadaki herkese (tümünü yanıtla)
  ok((await p.locator("[data-posta-alicilar]").innerText()).includes(arAd(m1)), "yanıt varsayılan olarak yazışmadaki muhabire");
  const yaz = p.locator("[data-posta-yaz]");

  // Alıcılar metne yazılır: "@" Kime, "cc:" CC, "bcc:" BCC; virgülle birden çok
  await yaz.fill("@" + trAd(m2) + ", yeni.kisi@ornek.local\ncc: kopya@ornek.local, " + trAd(muhabirler[2]) + "\nbcc gizli@ornek.local\nTeşekkürler, planladık.");
  await p.waitForTimeout(200);
  const onizleme = await p.locator("[data-posta-alicilar]").innerText();
  ok(onizleme.includes(arAd(m2)) && !onizleme.includes(arAd(m1)), "@ yazılınca Kime o kişiler (önizleme): " + onizleme.replace(/\n/g, " "));
  ok((await p.locator('[data-posta-alicilar] [data-posta-cip="kopya@ornek.local"]').count()) === 1 && (await p.locator('[data-posta-alicilar] [data-posta-cip="gizli@ornek.local"]').count()) === 1, "CC ve BCC önizlemede");
  ok((await p.locator("[data-posta-alicilar] [data-posta-bulunamadi]").count()) === 0, "bütün adlar çözüldü");

  // Bulunamayan ad: kırmızı çip, gönderilmez
  await yaz.fill("@Kimseyok Yokoglu\nMerhaba");
  await p.waitForTimeout(150);
  ok((await p.locator("[data-posta-alicilar] [data-posta-bulunamadi]").count()) === 1, "bulunamayan ad işaretlendi");
  const mesajSayisi = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count();
  ok((await p.locator("[data-posta-gonder]").getAttribute("aria-disabled")) === "true", "gönder pasif görünüyor, nedeni ipucunda");
  await p.locator("[data-posta-gonder]").click({ force: true });
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === mesajSayisi, "bulunamayan alıcıyla gönderilmedi");

  // Satırda yazarken öneri; seçince satıra yazılır
  await yaz.fill("cc: " + trAd(muhabirler[3]).slice(0, -2));
  await yaz.press("End");
  await p.waitForTimeout(200);
  const hedef = kucuk(muhabirler[3].eposta);
  ok((await p.locator(`[data-posta-oneriler] [data-posta-oneri="${hedef}"]`).count()) === 1, "cc satırında öneri çıktı");
  await p.locator(`[data-posta-oneriler] [data-posta-oneri="${hedef}"]`).click();
  await p.waitForTimeout(150);
  ok((await p.locator(`[data-posta-alicilar] [data-posta-cip="${hedef}"]`).count()) === 1, "seçilen öneri CC'ye girdi");

  // Gönder: komut satırları metne girmez, alıcılar kayıtta, BCC kayda yazılmaz
  await yaz.fill("@" + trAd(m2) + ", yeni.kisi@ornek.local\ncc: kopya@ornek.local\nbcc: gizli@ornek.local\nTeşekkürler, planladık.");
  await p.locator("[data-posta-gonder]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === mesajSayisi + 1, "yanıt sohbete eklendi");
  const yanit = (await veri()).postaMesajlari.find((m) => m.giden && m.metin.includes("Teşekkürler, planladık."));
  ok(!!yanit && yanit.metin === "Teşekkürler, planladık.", "@/cc/bcc satırları posta metnine girmedi: " + JSON.stringify(yanit && yanit.metin));
  ok(!!yanit && yanit.kime.includes(kucuk(m2.eposta)) && yanit.kime.includes("yeni.kisi@ornek.local") && !yanit.kime.includes(kucuk(m1.eposta)), "Kime @ ile yazılanlar: " + JSON.stringify(yanit && yanit.kime));
  ok(!!yanit && yanit.cc.includes("kopya@ornek.local"), "CC kayıtta: " + JSON.stringify(yanit && yanit.cc));
  ok(!!yanit && !JSON.stringify(yanit).includes("gizli@ornek.local"), "BCC kayda yazılmadı");
  ok((await p.locator("[data-posta-sohbet] .posta-balon.giden").last().locator("[data-posta-alici-satiri]").innerText()).includes("kopya"), "giden balonda kime/CC satırı");
  ok((await yaz.inputValue()) === "", "gönderince kutu boşaldı");

  // Yeni posta: "+" ile; alıcısız gönderilmez, öneriyle kişi seçilir, BCC isteğe bağlı
  await p.locator("[data-posta-yeni-ac]").click();
  await p.waitForTimeout(200);
  ok(await p.locator("[data-posta-yeni-gonder]").isDisabled(), "alıcısız gönder pasif");
  await p.locator('[data-posta-yeni] [data-posta-adres-yaz="kime"]').fill(trAd(m2));
  await p.waitForTimeout(200);
  ok((await p.locator(`[data-posta-oneri="${kucuk(m2.eposta)}"]`).count()) === 1, "Latin adla yazınca öneri çıktı");
  await p.locator(`[data-posta-oneri="${kucuk(m2.eposta)}"]`).click();
  ok((await p.locator(`[data-posta-adres="kime"] [data-posta-cip="${kucuk(m2.eposta)}"]`).count()) === 1, "öneri Kime'ye eklendi");
  ok((await p.locator('[data-posta-adres="bcc"]').count()) === 0, "BCC kapalı gelir");
  await p.locator("[data-posta-bcc-ac]").click();
  ok((await p.locator('[data-posta-adres="bcc"]').count()) === 1, "BCC açıldı");
  await p.locator("[data-posta-yeni-konu]").fill("اجتماع التخطيط");
  await p.locator("[data-posta-yeni-metin]").fill("نرجو الحضور غداً.");
  await p.locator("[data-posta-yeni-gonder]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("dialog[open]").count()) === 0, "pencere kapandı");
  ok((await p.locator("[data-posta-liste] > li").count()) === 4, "yeni posta yeni sohbet açtı");
  ok((await p.locator("[data-posta-sohbet] .posta-balon.giden").count()) === 1 && (await p.locator("[data-posta-sohbet]").innerText()).includes("نرجو الحضور"), "yeni sohbet seçili, giden balon");

  // Sohbet izleriyle silinir
  const once = (await veri()).postaMesajlari.length;
  await p.locator("[data-posta-sil]").click();
  await p.waitForTimeout(400);
  const sonra = (await veri()).postaMesajlari.length;
  ok(sonra === once - 1 && (await p.locator("[data-posta-liste] > li").count()) === 3, "sohbet izleriyle silindi: " + once + " → " + sonra);

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

  // Yeni metin yoksa, düzeltilip dönen alıntı metni gösterilir
  const duzeltilmis = "Shafık SAHLI\nSenior Script Editor\nTRT Arabi Kanal\n00 30 326 (212) 90+\n\nFrom: Planlama <planning@trt.net.tr>\nSent: Monday\nTo: Shafık\nSubject: للتدقيق\n\nتَبْدُو فَرَنْسَا أَمَامَ حَالَةٍ مِنَ الِانْسِدَادِ.\nوَبَيْنَ احْتِجَاجَاتٍ تَتَوَاصَلُ.\n\nMehmet Safa\nمراسل TRT عربي";
  await p.evaluate((tamMetin) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    // metin: yeniMetin'in yaptığı gibi alıntı kesilmiş hali (yalnız imza kalır)
    const metin = "Shafık SAHLI\nSenior Script Editor\nTRT Arabi Kanal\n00 30 326 (212) 90+";
    v.postaMesajlari = (v.postaMesajlari || []).concat([{
      id: "pm-alinti-test", konuKimligi: "alinti-konu", kimden: "sahli@ornek.local",
      kimdenAd: "Shafık SAHLI", konu: "Düzeltme testi", metin, tamMetin,
      zaman: new Date().toISOString(), ekler: [], kaynak: "iceAktarma",
    }]);
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, duzeltilmis);
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag]').filter({ hasText: "Düzeltme testi" }).first().click();
  await p.waitForTimeout(300);
  const duzeltGovde = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(duzeltGovde.includes("تَبْدُو فَرَنْسَا"), "düzeltilip dönen alıntı metni gösterildi");
  ok(!duzeltGovde.includes("Senior Script") && !duzeltGovde.includes("From:") && !duzeltGovde.includes("Subject"), "alıntı başlığı ve imza alıntıda da temizlendi");
  ok((await p.locator("[data-posta-sohbet] .posta-alinti").count()) >= 1, "alıntı metni ayırt edici stille");

  // 390px: yatay taşma yok (Türkçe ve Arapça)
  // Sohbet içi arama: eşleşen balonlar işaretlenir, en yeniden başlar, oklarla gezilir.
  await kim("pl1");
  await git("#/posta");
  await p.locator('[data-posta-sohbet-bag="ornek-gazze"]').click();
  await p.waitForTimeout(200);
  await p.locator("[data-posta-ara-ac]").click();
  await p.locator("[data-posta-ara-girdi]").fill("النص");
  await p.waitForTimeout(200);
  ok((await p.locator("[data-posta-sohbet] .posta-balon.bulundu").count()) === 2, "aramada iki balon eşleşti");
  ok((await p.locator("[data-posta-ara-sayi]").innerText()) === "1/2", "sayaç 1/2");
  ok((await p.locator('[data-posta-mesaj="pm-o3"]').getAttribute("class")).includes("simdi"), "en yeni eşleşmeden başlıyor");
  await p.locator("[data-posta-ara-girdi]").press("Enter");
  await p.waitForTimeout(150);
  ok((await p.locator('[data-posta-mesaj="pm-o2"]').getAttribute("class")).includes("simdi") && (await p.locator("[data-posta-ara-sayi]").innerText()) === "2/2", "Enter daha eski eşleşmeye geçiyor");
  await p.locator("[data-posta-ara-onceki]").click();
  await p.waitForTimeout(150);
  ok((await p.locator('[data-posta-mesaj="pm-o3"]').getAttribute("class")).includes("simdi"), "yukarı ok daha yeniye dönüyor");
  await p.locator("[data-posta-ara-girdi]").fill("النصّ");
  await p.waitForTimeout(150);
  ok((await p.locator("[data-posta-sohbet] .posta-balon.bulundu").count()) === 2, "hareke aramayı bozmuyor");
  await p.locator("[data-posta-ara-girdi]").fill("xyzq");
  await p.waitForTimeout(150);
  ok((await p.locator("[data-posta-sohbet] .posta-balon.bulundu").count()) === 0 && (await p.locator("[data-posta-ara-sayi].yok").count()) === 1, "sonuç yok yazıyor");
  await p.locator("[data-posta-ara-girdi]").press("Escape");
  await p.waitForTimeout(150);
  ok((await p.locator("[data-posta-ara]").count()) === 0, "Esc aramayı kapatıyor");
  await p.locator("[data-posta-ara-ac]").click();
  await p.locator("[data-posta-ara-girdi]").fill("النص");
  await p.locator('[data-posta-sohbet-bag="ornek-mukabele"]').click();
  await p.waitForTimeout(150);
  ok((await p.locator("[data-posta-ara]").count()) === 0 && (await p.locator(".posta-balon.bulundu").count()) === 0, "başka sohbete geçince arama kapanıyor");

  for (const d of ["tr", "ar"]) {
    await kim("pl1", d);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/posta");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 1, "390px taşma yok (" + d + "): " + tasma);
    // Açık sohbet (alıcı satırı ve CC alanı) ve yeni posta penceresi de taşmasın
    await p.locator('[data-posta-sohbet-bag="ornek-mukabele"]').click();
    await p.waitForTimeout(300);
    const tasma2 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma2 <= 1, "390px açık sohbette taşma yok (" + d + "): " + tasma2);
    await p.locator("[data-posta-ara-ac]").click();
    await p.locator("[data-posta-ara-girdi]").fill("وزير");
    await p.waitForTimeout(200);
    const tasma4 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma4 <= 1, "390px sohbet aramasında taşma yok (" + d + "): " + tasma4);
    await p.locator("[data-posta-ara-kapat]").click();
    await p.locator(".posta-sohbet-sutun .geri-bag").click();
    await p.waitForTimeout(200);
    await p.locator("[data-posta-yeni-ac]").click();
    await p.waitForTimeout(200);
    const tasma3 = await p.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? g.scrollWidth - g.clientWidth : -1; });
    ok(tasma3 >= 0 && tasma3 <= 1, "390px yeni posta penceresi taşmıyor (" + d + "): " + tasma3);
    await p.keyboard.press("Escape");
  }
  await p.setViewportSize({ width: 1440, height: 1000 });

  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
