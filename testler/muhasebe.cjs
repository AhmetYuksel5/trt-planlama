// Muhasebe (News Gathering'in alt birimi): sade ekran, aylık döküm (sayım, ödeme, onay/ödendi), anlaşma formu, tanımlar,
// Excel'den ilk kurulum, Newsdesk'in canlı "yapıldı" işareti, gizlilik (başka birim görmez), 390px TR/AR
const { chromium } = require(process.env.PW);
const zlib = require("zlib");
const fs = require("fs");
const os = require("os");
const path = require("path");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

// Sıkıştırmasız (stored) zip: okuyucu CRC'ye bakmıyor; kurgusal veriyle küçük bir .xlsx.
const zip = (dosyalar) => {
  const yerel = [], merkez = [];
  let ofs = 0;
  for (const [ad, icerik] of dosyalar) {
    const a = Buffer.from(ad), v = Buffer.from(icerik);
    const crc = zlib.crc32 ? zlib.crc32(v) : 0;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc >>> 0, 14); h.writeUInt32LE(v.length, 18); h.writeUInt32LE(v.length, 22); h.writeUInt16LE(a.length, 26);
    yerel.push(h, a, v);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc >>> 0, 16); c.writeUInt32LE(v.length, 20); c.writeUInt32LE(v.length, 24); c.writeUInt16LE(a.length, 28); c.writeUInt32LE(ofs, 42);
    merkez.push(c, a);
    ofs += 30 + a.length + v.length;
  }
  const m = Buffer.concat(merkez);
  const son = Buffer.alloc(22); son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(dosyalar.length, 8); son.writeUInt16LE(dosyalar.length, 10); son.writeUInt32LE(m.length, 12); son.writeUInt32LE(ofs, 16);
  return Buffer.concat([...yerel, m, son]);
};
const xlsx = (satirlar) => {
  const harf = (i) => String.fromCharCode(65 + i);
  const kac = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const sayfa = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${satirlar
    .map((r, i) => `<row r="${i + 1}">${r.map((h, j) => `<c r="${harf(j)}${i + 1}" t="inlineStr"><is><t>${kac(h)}</t></is></c>`).join("")}</row>`)
    .join("")}</sheetData></worksheet>`;
  return zip([
    ["xl/workbook.xml", `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`],
    ["xl/worksheets/sheet1.xml", sayfa],
  ]);
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  const kim = async (id, dil = "tr") => { await p.goto(B); await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [id, dil]); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);
  const odeme = async (id) => (await p.locator(`[data-mh-kisi="${id}"] [data-mh-odeme]`).innerText()).trim();
  const sayi = (s) => Number(s.replace(/[^\d.]/g, ""));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());

  // Muhasebe çalışanı: sade ekran, ana sayfası Muhasebe
  await kim("mh1");
  await git("#/");
  ok((await p.locator("[data-mh-sekme]").count()) === 4, "ana sayfası Muhasebe (dört sekme)");
  ok((await p.locator('.menu a[href="#/muhasebe"]').count()) === 1 && (await p.locator('.menu a[href="#/nextday"]').count()) === 0 && (await p.locator('.menu a[href="#/posta"]').count()) === 0, "menüde yalnız Muhasebe (ve Ayarlar)");
  await git("#/nextday");
  ok((await p.locator("[data-mh-sekme]").count()) === 0 && (await p.locator(".plan-listesi, [data-nd-liste]").count()) === 0, "masa sayfaları muhasebeye açık değil");

  // Aylık döküm: anlaşmalı muhabirler, sabit maaşın ödemesi
  await git("#/muhasebe");
  ok((await p.locator("[data-mh-liste] [data-mh-kisi]").count()) >= 3, "dökümde anlaşmalı muhabirler");
  ok((await odeme("mu1")) === "2,500 USD", "sabit maaş: aylık tutar (" + (await odeme("mu1")) + ")");

  // Parça başı: tamamlanan Walk & Talk ve Newsdesk'in yapıldı dediği canlı fiyatıyla eklenir
  const once = sayi(await odeme("mu3"));
  const d = await veri();
  const bugun = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const ornekPaket = d.paketler[0];
  d.paketler.push({ ...ornekPaket, id: "p-mh-test", muhabirId: "mu3", planId: undefined, ozelId: undefined, durum: "tamamlandi", bicim: "walktalk", baslik: "اختبار", sonTarih: bugun, yapilmadi: undefined, reddedildi: undefined });
  d.paketler.push({ ...ornekPaket, id: "p-mh-iptal", muhabirId: "mu3", planId: undefined, ozelId: undefined, durum: "iptal", bicim: "pkg", baslik: "ملغى", sonTarih: bugun });
  d.canliYayinlar.push({ id: "cy-mh-test", planId: d.planlar[0].id, konu: "بث", aciklama: "", tarih: bugun, saatGmt: "10:00", yer: "", muhabirId: "mu3", notlar: "", sonuc: { durum: "yapildi", kisiId: "nd1", zaman: new Date().toISOString() } });
  d.canliYayinlar.push({ id: "cy-mh-isaretsiz", planId: d.planlar[0].id, konu: "بث", aciklama: "", tarih: bugun, saatGmt: "09:00", yer: "", muhabirId: "mu3", notlar: "" });
  await yaz(d);
  await git("#/muhasebe");
  const sonra = sayi(await odeme("mu3"));
  ok(sonra - once === 300, `parça başı: walk & talk 180 + canlı 120 (fark ${sonra - once}); iptal ve işaretsiz sayılmadı`);

  // Ayrıntı saklı, istenince; ay kapanışı onay ve ödendi
  ok(!(await p.locator('[data-mh-kisi="mu3"]').evaluate((e) => e.open)), "ayrıntı kapalı gelir");
  await p.locator('[data-mh-kisi="mu3"] > summary').click();
  ok((await p.locator('[data-mh-kisi="mu3"] [data-mh-isler] li').count()) >= 2, "ayrıntıda tarih tarih işler");
  await p.locator('[data-mh-kisi="mu3"] [data-mh-onay]').click();
  await p.waitForTimeout(200);
  await p.locator('[data-mh-kisi="mu3"] [data-mh-odendi]').click();
  await p.waitForTimeout(200);
  const k = (await veri()).muhasebeKapanislari.find((x) => x.kisiId === "mu3");

  // Muhabir sayfası: satırdan muhabirin bütün işlerine; ay ay özet, seçilen ayın işleri
  await p.locator('[data-mh-kisi="mu3"] [data-mh-muhabire="mu3"]').click();
  await p.waitForTimeout(200);
  ok(p.url().endsWith("#/muhasebe/muhabir/mu3") && (await p.locator('[data-mh-kunye="mu3"]').count()) === 1, "satırdan muhabir sayfasına");
  ok((await p.locator("[data-mh-aylar] tbody tr").count()) >= 1, "ay ay özet");
  const buAy = new Date().toISOString().slice(0, 7);
  ok((await p.locator(`[data-mh-ay-satir="${buAy}"]`).getAttribute("aria-selected")) === "true", "bu ay seçili gelir");
  ok((await p.locator("[data-mh-isler] li").count()) >= 2, "seçilen ayın işleri");
  ok((await p.locator(`[data-mh-ay-satir="${buAy}"] .rozet`).count()) === 1, "ödendi bilgisi ay satırında");
  if (await p.locator("[data-mh-tur]").count()) {
    const tur = await p.locator("[data-mh-tur]").first().getAttribute("data-mh-tur");
    await p.locator("[data-mh-tur]").first().click();
    const n = await p.locator(`[data-mh-tur="${tur}"]`).innerText();
    ok((await p.locator("[data-mh-isler] li").count()) === Number(n.split("·").pop().trim()), "tür süzgeci");
  }
  await p.locator("[data-mh-muhabir-sec]").selectOption("mu1");
  await p.waitForTimeout(200);
  ok(p.url().endsWith("#/muhasebe/muhabir/mu1") && (await p.locator('[data-mh-kunye="mu1"]').count()) === 1, "seçiciyle başka muhabir");
  await git("#/muhasebe/muhabirler");
  await p.locator('[data-mh-muhabire="mu2"]').click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-mh-kunye="mu2"]').count()) === 1, "anlaşmalar tablosundan muhabir sayfasına");
  await git("#/muhasebe");
  ok(!!k?.onay && !!k?.odendi, "ay onaylandı ve ödendi işaretlendi");

  // Aylık anlaşmada bu aya özel kota: kotayı aşan iş ek ödeme olur
  await p.locator('[data-mh-kisi="mu2"] > summary').click();
  const mu2Once = sayi(await odeme("mu2"));
  const kotaGirdi = p.locator('[data-mh-kisi="mu2"] [data-mh-ay-kota] input').first();
  await kotaGirdi.fill("0");
  await kotaGirdi.blur();
  await p.waitForTimeout(300);
  ok((await veri()).muhasebeKapanislari.some((x) => x.kisiId === "mu2" && x.kotaPaket === 0), "bu ayın kotası kapanışa yazıldı");
  ok(sayi(await odeme("mu2")) >= mu2Once, "kota düşünce ödeme azalmaz");

  // Tanımlar: ödeme aracı ekle
  await git("#/muhasebe/tanimlar");
  await p.locator('[data-mh-yeni-tanim="odeme"]').fill("Kripto (deneme)");
  await p.locator('[data-mh-tanim-ekle="odeme"]').click();
  await p.waitForTimeout(200);
  ok((await veri()).muhasebeTanimlari.some((x) => x.tur === "odeme" && x.ad === "Kripto (deneme)"), "ödeme aracı tanımlandı");

  // Anlaşma formu: mu4 parça başı, fiyatla
  await git("#/muhasebe/muhabirler");
  ok((await p.locator("[data-mh-anlasmalar] tbody tr").count()) > 10, "muhabirler tablosu");
  await p.locator('[data-mh-duzenle="mu4"]').click();
  await p.selectOption("[data-mh-tur]", "parca");
  await p.selectOption('[data-mh-secim="para"]', "USD");
  await p.locator('[data-mh-fiyat="mt-paket"]').fill("200");
  await p.locator("[data-mh-kaydet]").click();
  await p.waitForTimeout(300);
  const a4 = (await veri()).muhasebeAnlasmalari.find((x) => x.id === "mu4");
  ok(a4?.tur === "parca" && a4.para === "USD" && a4.fiyatlar?.["mt-paket"] === 200, "anlaşma kaydedildi");

  // Excel'den ilk kurulum: Latin adla eşlenen satır aktarılır, bilinmeyen atlanır, yeni ödeme aracı tanımlanır
  const kisiler = (await veri()).kisiler;
  const mu5 = kisiler.find((x) => x.id === "mu5");
  const dosya = path.join(os.tmpdir(), `muhasebe-deneme-${Date.now()}.xlsx`);
  fs.writeFileSync(dosya, xlsx([["Ad Soyad", "Anlaşma şekli", "Tutar", "Para birimi", "Ödeme aracı", "Paket kotası"], [typeof mu5.ad === "string" ? mu5.ad : mu5.ad.tr, "Sabit maaş", "1800", "EUR", "PayPal (deneme)", "6"], ["Kimse Yok", "Parça başı", "", "USD", "", ""]]));
  await p.locator("[data-mh-aktar-ac]").click();
  await p.locator("[data-mh-dosya]").setInputFiles(dosya);
  await p.waitForTimeout(500);
  ok((await p.locator('[data-mh-onizleme-satir="eslesti"]').count()) === 1 && (await p.locator('[data-mh-onizleme-satir="yok"]').count()) === 1, "önizlemede eşleşen ve bulunamayan");
  await p.locator("[data-mh-aktar]").click();
  await p.waitForTimeout(300);
  const v2 = await veri();
  const a5 = v2.muhasebeAnlasmalari.find((x) => x.id === "mu5");
  ok(a5?.tur === "sabit" && a5.tutar === 1800 && a5.para === "EUR" && a5.kotaPaket === 6 && a5.odeme === "PayPal (deneme)", "Excel'den anlaşma aktarıldı");
  ok(v2.muhasebeTanimlari.some((x) => x.tur === "odeme" && x.ad === "PayPal (deneme)"), "yeni ödeme aracı tanım oldu");
  fs.unlinkSync(dosya);

  // Gizlilik: Newsdesk ve Planlama muhasebeyi görmez; kademe müdürü görür
  for (const [id, gorur] of [["nd1", false], ["pl1", false], ["yo1", true], ["yo3", true]]) {
    await kim(id);
    await git("#/muhasebe");
    const sayfa = (await p.locator("[data-mh-sekme]").count()) > 0;
    const menu = (await p.locator('.menu a[href="#/muhasebe"]').count()) > 0;
    ok(sayfa === gorur && menu === gorur, `${id} muhasebeyi ${gorur ? "görür" : "görmez"}`);
  }

  // Newsdesk canlıyı işaretler; planlamacıda düğme yok
  const plan = (await veri()).planlar.find((x) => x.tarih === bugun) ?? (await veri()).planlar[0];
  for (const [id, var_] of [["nd1", true], ["pl1", false]]) {
    await kim(id);
    await git(`#/nextday/${plan.id}`);
    await p.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await p.waitForTimeout(200);
    const n = await p.locator('.canli-sonuc button[aria-label="Canlı yapıldı"], .canli-sonuc button[aria-label="İşareti kaldır"]').count();
    ok(var_ ? n > 0 : n === 0, `${id}: canlı işaret düğmesi ${var_ ? "var" : "yok"}`);
    if (var_) {
      const hedef = (await veri()).canliYayinlar.find((c) => c.planId === plan.id && c.muhabirId && !c.sonuc);
      const dugme = p.locator('.canli-sonuc button[aria-label="Canlı yapıldı"]').first();
      await dugme.click();
      await p.waitForTimeout(200);
      const isaretli = (await veri()).canliYayinlar.filter((c) => c.planId === plan.id && c.sonuc?.durum === "yapildi" && c.sonuc.kisiId === "nd1");
      ok(isaretli.length > 0 || !hedef, "Newsdesk canlıyı yapıldı işaretledi");
    }
  }

  // 390px taşma, Türkçe ve Arapça
  for (const dil of ["tr", "ar"]) {
    await kim("mh1", dil);
    await p.setViewportSize({ width: 390, height: 844 });
    for (const s of ["dokum", "muhabir/mu3", "muhabirler", "tanimlar"]) {
      await git(`#/muhasebe/${s}`);
      if (s === "dokum") await p.locator("[data-mh-kisi] > summary").first().click();
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t === 0, `390px taşma yok (${dil}, ${s}): ${t}`);
    }
    await p.setViewportSize({ width: 1440, height: 1000 });
  }

  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  await b.close();
  console.log(`${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
