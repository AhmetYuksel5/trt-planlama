// Yönetim kademesi: müdürler ve koordinatör ağaçtaki yerlerinde (Input, Program, Haber merkezi),
// sorumluluk ağaçtan; eski "Yönetim" birimindeki kişi açılışta yerine taşınıyor. Kişiler kurgusal.
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const oturum = (id) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), id);
  const panelBirimleri = () => p.locator(".birim-kartlari a[href^='#/panel/'], .birim-kartlari a[href='#/muhabirler']").evaluateAll((l) => l.map((a) => a.getAttribute("href").replace("#/panel/", "").replace("#/muhabirler", "muhabir")).sort());

  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await p.goto(B);
  await oturum("yo1");
  await git("#/");
  const v0 = await veri();
  const kisi = (v, id) => v.kisiler.find((k) => k.id === id);
  ok(kisi(v0, "yo1").birim === "bInput" && kisi(v0, "yo2").birim === "bProgram" && kisi(v0, "yo3").birim === "kHaberMerkezi", "örnekte müdürler ve koordinatör ağaçtaki yerinde");
  ok((await p.locator(".birim-kartlari").count()) === 1, "Input müdürünün ana sayfası yönetici paneli");
  ok(JSON.stringify(await panelBirimleri()) === JSON.stringify(["ekonomi", "muhabir", "newsdesk", "newsgathering", "planlama"]), "Input müdürü Input'un altındakilerden ve muhabirlerden sorumlu: " + (await panelBirimleri()));
  await oturum("yo2");
  await git("#/");
  ok(JSON.stringify(await panelBirimleri()) === JSON.stringify(["program"]), "Program müdürü Program'dan sorumlu");
  await oturum("yo3");
  await git("#/");
  const hepsi = await panelBirimleri();
  ok(hepsi.length >= 9 && hepsi.includes("output") && hepsi.includes("muhabir"), "koordinatör (Haber merkezi) her şeyden sorumlu: " + hepsi);

  // Organizasyon: Yönetim gizli, kademelerde müdür ünvanları
  await git("#/organizasyon/birimler");
  ok((await p.locator('[data-birim-satiri="yonetim"]').getAttribute("class")).includes("soluk"), "Yönetim birimi gizli");
  ok((await p.locator('[data-unvanlar="kHaberMerkezi"] [data-unvan="koordinator"]').count()) === 1, "Haber merkezi'nde koordinatör ünvanı");
  ok((await p.locator('[data-unvanlar="bInput"] [data-unvan="inputMuduru"]').count()) === 1, "Input'ta Input müdürü ünvanı");
  ok((await p.locator('[data-birim-satiri="bOutput"]').innerText()).includes("Yönetim kademesi"), "grup düğümünde 'Yönetim kademesi' etiketi");
  // Output'a müdür ünvanı ekle: yönetici ünvanı olarak
  await p.fill('[data-unvan-yeni="bOutput"]', "Output müdürü");
  await p.click('[data-unvan-ekle="bOutput"]');
  await p.waitForTimeout(200);
  const taslak = (await veri()).yapiTaslaklari?.yo3 ?? Object.values((await veri()).yapiTaslaklari ?? {})[0];
  const yeniUnvan = taslak?.unvanlar?.find((u) => u.ad?.tr === "Output müdürü");
  ok(yeniUnvan && yeniUnvan.yonetici === true, "kademeye eklenen ünvan yönetici ünvanı");

  // Yeni düzenden önce kaydedilmiş taslak: Organizasyon ekranı onu da yeni düzende gösterir
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    const t = v.yapiTaslaklari.yo3;
    const yon = t.birimler.find((b) => b.id === "yonetim");
    yon.gizli = false;
    yon.unvanlar = ["koordinator", "inputMuduru", "programMuduru"];
    for (const b of t.birimler) if (b.id !== "yonetim") b.unvanlar = (b.unvanlar ?? []).filter((u) => !yon.unvanlar.includes(u));
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  });
  await git("#/organizasyon/birimler");
  ok((await p.locator('[data-birim-satiri="yonetim"]').getAttribute("class")).includes("soluk"), "eski düzende kaydedilmiş taslakta da Yönetim gizli");
  ok((await p.locator('[data-unvanlar="bInput"] [data-unvan="inputMuduru"]').count()) === 1, "eski taslakta Input müdürü Input'a indi");

  // Eski düzen: Yönetim'deki kişi açılışta yerine geçer
  await p.evaluate(() => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.kisiler = v.kisiler.map((k) => (k.id === "yo1" || k.id === "yo3" ? { ...k, birim: "yonetim" } : k));
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  });
  await git("#/");
  await p.waitForTimeout(800);
  const v1 = await veri();
  ok(kisi(v1, "yo1").birim === "bInput" && kisi(v1, "yo3").birim === "kHaberMerkezi", "eski Yönetim'deki müdür ve koordinatör yerine taşındı");

  // Kişi formunda kademe seçilebiliyor, yalnız kendi ünvanıyla
  await git("#/organizasyon/kisiler");
  ok((await p.locator('[data-org-birim="bInput"] > [data-org-unvan="inputMuduru"] [data-org-kisi="yo1"]').count()) === 1, "Input müdürü Kişiler ağacında Input'un kendisinde");

  // Telefonda taşma yok
  await p.setViewportSize({ width: 390, height: 840 });
  for (const yol of ["#/", "#/organizasyon/birimler"]) {
    await git(yol);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `390px ${yol} taşmıyor: ${tasma}`);
  }
  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
