// Teslim günü (kullanıcı: stok ve feature haberler zamana bağlı olmayabilir ama teslim süresi mutlaka
// belirlenir, takip ona göre): Weekly'nin "Stok ve programlar" kaleminde verilir, kesinleşince pakete
// geçer; Stok sayfasında günsüz paket "Teslim günü belirlenmedi" grubunda başta, gün orada belirlenir ve
// değişir (muhabire bildirim); kalan gün kartta; muhabirin Yapılacaklar'ı ve paket sayfası aynı günden.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const oturum = (kim) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), kim);
  // Tarih girdisinin yerleşik alanına yazar (TarihGirdisi değeri ve olayı ondan alıyor).
  const tarihYaz = (loc, deger) =>
    loc.evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, deger);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };
  const BUGUN = yerel(0);

  await p.goto(B);
  // pl1: Planlama yöneticisi (Weekly'yi düzenler, kesinleştirir; kurgusal).
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-stok-tablo", "kart"); });
  await git("#/haftalik");

  // Toplantıdaki haftaya üç kabul edilmiş kalem: ikisi "Stok ve programlar"da, biri günlü feature.
  const kur = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
    h.durum = "toplantida";
    const mu = d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif && !x.hesapsiz);
    const kalem = (id, tarih, strap) => ({ id, karar: "kabul", tarih, tur: "feature", yer: "", metin: "متن " + id, bicimler: ["pkg"], muhabirler: [mu.id], paketBasligi: strap });
    const t = new Date(h.baslangic + "T12:00:00"); t.setDate(t.getDate() + 2);
    const gunlu = t.toISOString().slice(0, 10);
    h.kalemler = [kalem("tg-yok", undefined, "تقرير بلا موعد"), kalem("tg-var", undefined, "تقرير بموعد"), kalem("tg-gunlu", gunlu, "تقرير بيوم")];
    localStorage.setItem(k, JSON.stringify(d));
    return { hid: h.id, mu: mu.id, gunlu };
  }, K);

  // 1. Weekly: kabul edilip teslim günü verilmemiş günsüz kalem uyarılı; kalem formunda teslim günü
  await git("#/haftalik/" + kur.hid);
  await p.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((x) => (x.open = true)));
  ok((await p.locator('[data-kalem="tg-yok"] [data-kalem-teslim=""]').count()) === 1, "kabul edilmiş günsüz kalemde 'Teslim günü belirlenmedi'");
  ok((await p.locator('[data-kalem="tg-gunlu"] [data-kalem-teslim]').count()) === 0, "günlü kalemde teslim günü sorulmaz (günü onun günü)");
  await p.locator('[data-kalem="tg-var"] button[aria-label="Düzenle"]').click(); await p.waitForTimeout(300);
  const alan = p.locator("input[data-kalem-teslim-gunu]");
  ok((await alan.count()) === 1, "kalem formunda Teslim günü alanı");
  await tarihYaz(alan, yerel(5));
  await p.locator(".form-kutu .form-alt button").last().click(); await p.waitForTimeout(500);
  let d = await durum();
  ok(d.haftalik.find((x) => x.id === kur.hid).kalemler.find((x) => x.id === "tg-var").teslimGunu === yerel(5), "kalemin teslim günü kaydedildi");
  ok((await p.locator(`[data-kalem="tg-var"] [data-kalem-teslim="${yerel(5)}"]`).count()) === 1, "kalem kartında teslim günü");

  // 2. Gözden geçirme de gösteriyor; kesinleşince teslim günü paketin günü olur
  await p.locator("[data-gozden-ac]").click(); await p.waitForTimeout(400);
  ok((await p.locator('[data-gozden-kalem="tg-yok"] [data-kalem-teslim=""]').count()) === 1, "gözden geçirmede günsüz kalem uyarılı");
  await p.locator("[data-gozden-kesinlestir]").click(); await p.waitForTimeout(800);
  d = await durum();
  const pk = (id) => d.paketler.find((x) => x.haftalikKalemId === id);
  ok(pk("tg-var")?.sonTarih === yerel(5), "kesinleşince paketin teslim günü kalemin teslim günü");
  ok(pk("tg-gunlu")?.sonTarih === kur.gunlu, "günlü feature paketinin teslim günü kalemin günü");
  ok(!!pk("tg-yok") && !pk("tg-yok").sonTarih, "teslim günü verilmemiş kalemin paketi günsüz");
  const yokId = pk("tg-yok").id, varId = pk("tg-var").id;

  // 3. Stok sayfası (pl6, stok ekibi): günsüz paket başta "Teslim günü belirlenmedi" grubunda; gün belirlenir
  await oturum("pl6");
  await git("#/stok/uretim");
  await p.locator('[data-stok-uretim-alan="alinacak"]').click(); await p.waitForTimeout(300);
  const ilkGrup = p.locator("[data-stok-grup]").first();
  ok((await ilkGrup.getAttribute("data-stok-grup")) === "-" && (await ilkGrup.locator("h3").innerText()).includes("Teslim günü belirlenmedi"), "ilk grup 'Teslim günü belirlenmedi'");
  ok(!(await p.locator("main").innerText()).includes("Zamana bağlı değil"), "paket listesinde 'Zamana bağlı değil' yok");
  ok((await p.locator(`[data-stok-grup="-"] [data-stok-paket="${yokId}"]`).count()) === 1, "günsüz paket o grupta");
  ok(/5 gün kaldı/.test(await p.locator(`[data-stok-paket="${varId}"] [data-teslim-satiri="${yerel(5)}"]`).innerText()), "teslim günlü kartta kalan gün");
  await p.locator(`[data-teslim-belirle="${yokId}"]`).click(); await p.waitForTimeout(400);
  await tarihYaz(p.locator("dialog input[data-teslim-gunu]"), yerel(1));
  await p.locator("dialog [data-teslim-kaydet]").click(); await p.waitForTimeout(500);
  d = await durum();
  ok(d.paketler.find((x) => x.id === yokId).sonTarih === yerel(1), "teslim günü belirlendi");
  const h1 = d.hareketler.find((x) => x.tip === "paketTeslimGunu" && x.paketId === yokId);
  ok(!!h1 && h1.veri.kime === kur.mu && h1.veri.tarih === yerel(1) && !h1.veri.kaynak, "hareket muhabire (ilk belirleme)");
  ok((await p.locator(`[data-stok-grup="-"] [data-stok-paket="${yokId}"]`).count()) === 0, "paket günsüz gruptan çıktı");
  ok((await p.locator(`[data-stok-paket="${yokId}"] .teslim-gun.yakin`).count()) === 1, "yarına kalan teslim turuncu");
  await p.locator(`[data-teslim-degistir="${varId}"]`).click(); await p.waitForTimeout(400);
  await tarihYaz(p.locator("dialog input[data-teslim-gunu]"), yerel(9));
  await p.locator("dialog [data-teslim-kaydet]").click(); await p.waitForTimeout(500);
  d = await durum();
  const h2 = d.hareketler.find((x) => x.tip === "paketTeslimGunu" && x.paketId === varId);
  ok(d.paketler.find((x) => x.id === varId).sonTarih === yerel(9) && h2?.veri.kaynak === yerel(5), "teslim günü değişti, önceki gün harekette");
  // Geçmiş gün seçilemez (eylem de reddeder).
  await p.locator(`[data-teslim-degistir="${varId}"]`).click(); await p.waitForTimeout(400);
  ok((await p.locator("dialog input[data-teslim-gunu]").getAttribute("min")) === BUGUN, "teslim günü bugünden önce olamaz");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);

  // 4. Paket sayfası: teslim günü başta, yetkiliye değiştirme düğmesi
  await git("#/paketler/" + varId);
  ok((await p.locator(`.paket-teslim [data-teslim-satiri="${yerel(9)}"]`).count()) === 1 && (await p.locator(`.paket-teslim [data-teslim-degistir="${varId}"]`).count()) === 1, "paket sayfasında teslim günü ve değiştirme");

  // 5. Muhabir: Yapılacaklar teslim gününden; günsüz iş kendi grubunda (son değişikliğin günüyle "Geciken" değil)
  await p.evaluate(({ k, mu }) => {
    const d = JSON.parse(localStorage.getItem(k));
    const o = d.paketler.find((x) => x.haftalikKalemId === "tg-gunlu");
    d.paketler.push({ ...o, id: "p-tg-gunsuz", kod: "TG-1", haftalikKalemId: undefined, sonTarih: undefined, teslim: undefined, muhabirId: mu, guncelleme: "2020-01-01T10:00:00.000Z" });
    localStorage.setItem(k, JSON.stringify(d));
  }, { k: K, mu: kur.mu });
  await oturum(kur.mu);
  await git("#/paketler/" + varId);
  ok((await p.locator(`.paket-teslim [data-teslim-satiri="${yerel(9)}"]`).count()) === 1 && (await p.locator("[data-teslim-degistir]").count()) === 0, "muhabir teslim gününü görür, değiştiremez");
  await git("#/yapilacaklar");
  ok((await p.locator(`[data-yk-grup="yarin"] [data-yapilacak="${yokId}"]`).count()) === 1, "Yapılacaklar: teslimi yarın olan iş Yarın'da");
  ok((await p.locator('[data-yk-grup="teslimsiz"] [data-yapilacak="p-tg-gunsuz"]').count()) === 1, "günsüz iş 'Teslim günü belirlenmedi'de");
  ok((await p.locator('[data-yk-grup="geciken"] [data-yapilacak="p-tg-gunsuz"]').count()) === 0, "günsüz iş gecikmiş sayılmadı");

  // 6. Teklifler: günsüz teklifin grubu "Stok ve programlar"; Gündeme ekle'de teslim günü
  await oturum("pl6");
  await git("#/stok/teklifler");
  const hafta = await p.locator("[data-stok-hafta]").getAttribute("data-stok-hafta");
  await p.evaluate(({ k, hafta }) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.oneriler.push({
      id: "o-tg", muhabirId: "mu2", ulke: "turkiye", haberBasligi: "عرض بلا يوم", gelisme: "عرض بلا يوم", paketBasligi: "عرض بلا يوم", tur: "feature", bicim: "pkg",
      sahaGerekli: false, zaman: new Date().toISOString(), kanal: "sistem", durum: "yeni", hafta,
    });
    localStorage.setItem(k, JSON.stringify(d));
  }, { k: K, hafta });
  await git("#/stok/teklifler");
  const grup = p.locator('[data-oneri-grup="-"]').filter({ has: p.locator('[data-oneri="o-tg"]') });
  ok((await grup.count()) === 1 && (await grup.locator("h3").innerText()).includes("Stok ve programlar"), "günsüz teklifin grubu 'Stok ve programlar'");
  if (await p.locator("[data-stok-hafta-ac]").count()) { await p.locator("[data-stok-hafta-ac]").first().click(); await p.waitForTimeout(500); }
  await p.locator('[data-oneri="o-tg"] [data-oneri-ekle]').click(); await p.waitForTimeout(500);
  const ge = p.locator('[data-gundeme-ekle-formu="o-tg"]');
  ok((await ge.locator("input[data-ge-teslim-gunu]").count()) === 1, "Gündeme ekle'de teslim günü");
  await tarihYaz(ge.locator("input[data-ge-teslim-gunu]"), yerel(7));
  await ge.locator(".form-alt .dugme:not(.dugme-ikincil)").click(); await p.waitForTimeout(700);
  d = await durum();
  const kalem = d.haftalik.find((h) => h.baslangic === hafta)?.kalemler.find((x) => x.oneriId === "o-tg");
  ok(kalem?.teslimGunu === yerel(7) && !kalem.tarih, "gündeme giren teklifin teslim günü kalemde");
  ok((await p.locator(`[data-stok-kalem="${kalem?.id}"] [data-kalem-teslim="${yerel(7)}"]`).count()) === 1, "Weekly gündeminde listesinde teslim günü");

  // 7. 390 pikselde taşma yok (Türkçe ve Arapça)
  await p.setViewportSize({ width: 390, height: 844 });
  for (const dil of ["tr", "ar"]) {
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const h of ["#/stok/uretim", "#/paketler/" + varId]) {
      await git(h);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${h}): ${t}`);
    }
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
