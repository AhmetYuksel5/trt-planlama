// Plansız paket görevi (kullanıcı): Planlama Paketler'den ve muhabirin profilinden, bir plana eklemeden
// muhabire paket görevi verir (ileri tarihe de); Newsdesk yalnız o güne. Ekonomi, Program, Spor görev talep
// eder, talep Planlama'nın onayıyla göreve döner; onaya dek muhabir görmez. Görev paketi Stok'tan takip edilir.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
const gunEkle = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900);
  };
  const paketler = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24") || "{}").paketler ?? []);
  const formuDoldur = async (muhabir, strap, tarih) => {
    if (muhabir) await p.locator("[data-gorev-formu] select").first().selectOption(muhabir);
    await p.locator("[data-gorev-baslik]").fill(strap);
    await p.locator("[data-gorev-aciklama]").fill("تفاصيل التكليف");
    if (tarih) await p.locator("[data-gorev-tarih]").fill(tarih);
    await p.locator("[data-gorev-gonder]").click(); await p.waitForTimeout(500);
  };

  // 1. Planlama Paketler'den ileri tarihe görev verir; paket onaylı, stokta, plansız
  await gir("pl1", "#/paketler");
  ok((await p.locator('[data-gorevlendir="gorev"]').count()) === 1, "Planlama'da Paketler'de \"Görevlendir\"");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await formuDoldur("mu2", "تقرير التكليف الأول", gunEkle(3));
  const g1 = (await paketler()).find((x) => x.baslik === "تقرير التكليف الأول");
  ok(!!g1 && g1.durum === "onaylandi" && g1.stok && !g1.planId && g1.gorev?.veren === "pl1" && g1.sonTarih === gunEkle(3) && g1.muhabirId === "mu2", "görev paketi: onaylı, stokta, plansız, ileri tarihli");

  // 2. Stok'ta "üretimde"de; "Üretime al" beklemiyor
  await gir("pl1", "#/stok");
  ok((await p.locator(`[data-uretime-al="${g1?.id}"]`).count()) === 0, "görev paketi \"Üretime al\" beklemiyor");
  await p.getByRole("tab").first().click(); await p.waitForTimeout(300);
  ok((await p.locator(`main a[href="#/paketler/${g1?.id}"]`).count()) >= 1, "Stok'un üretimde sekmesinde");

  // 3. Muhabirin profilinden: muhabir seçili gelir
  await gir("pl1", "#/personel/mu3");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  ok((await p.locator("[data-gorev-formu] select").count()) === 1, "profilden açılınca muhabir sorulmuyor (yalnız haber türü)");
  await formuDoldur(null, "تقرير من الملف الشخصي");
  ok((await paketler()).some((x) => x.baslik === "تقرير من الملف الشخصي" && x.muhabirId === "mu3" && x.sonTarih === gunEkle(0)), "profilden verilen görev o muhabire");

  // 4. Newsdesk yalnız bugüne
  await gir("nd2", "#/paketler");
  ok((await p.locator('[data-gorevlendir="gorev"]').count()) === 1, "Newsdesk'te \"Görevlendir\"");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  ok(await p.locator("[data-gorev-tarih]").isDisabled(), "Newsdesk'te gün bugüne sabit");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);

  // 5. Ekonomi talep eder; muhabir onaya dek görmez
  await gir("ek2", "#/ekonomi");
  ok((await p.locator('[data-gorevlendir="talep"]').count()) === 1, "Ekonomi'de \"Görev talebi\"");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await formuDoldur("mu2", "طلب تكليف من الاقتصاد", gunEkle(2));
  const t1 = (await paketler()).find((x) => x.baslik === "طلب تكليف من الاقتصاد");
  ok(!!t1 && t1.durum === "taslak" && t1.gorevTalebi?.kisiId === "ek2" && !t1.gorev && t1.tur === "ekonomi", "talep: taslak, Planlama'nın onayını bekliyor");
  await gir("ek2", "#/ekonomi/oneriler");
  await p.click('[data-prg-oneri-sekme="bizim"]');
  ok((await p.locator(`[data-prg-talep="${t1?.id}"]`).count()) === 1, "talep eden kendi talebini görüyor (Öneriler › Bizim önerilerimiz)");
  await gir("mu2", "#/oneriler");
  ok((await p.locator(`[data-paket="${t1?.id}"]`).count()) === 0 && (await p.locator(`[data-paket="${g1?.id}"]`).count()) === 1, "muhabir görevi \"Senin sıran\"da görüyor, talebi görmüyor");

  // 6. Planlama Stok'ta talebi göreve çevirir; muhabire düşer, ekonomi masasına değil
  await gir("pl1", "#/stok");
  ok((await p.locator(`[data-gorev-onayla="${t1?.id}"]`).count()) === 1, "Planlama Stok'ta talebi görüyor");
  await p.locator(`[data-gorev-onayla="${t1?.id}"]`).click(); await p.waitForTimeout(500);
  const t2 = (await paketler()).find((x) => x.id === t1?.id);
  ok(t2?.durum === "onaylandi" && t2.gorev?.veren === "pl1", "talep göreve döndü");
  await gir("mu2", "#/oneriler");
  ok((await p.locator(`[data-paket="${t1?.id}"]`).count()) === 1, "onaydan sonra muhabirin sırasında");
  // Muhabir "Yapıldı" der, onaylanınca stokta (Üretilmiş paketler)
  await p.locator(`[data-paket="${g1?.id}"] button`).first().click(); await p.waitForTimeout(400);
  const isaretli = (await paketler()).find((x) => x.id === g1?.id);
  ok(isaretli?.isaret?.tur === "yapildi", "muhabir \"Yapıldı\" dedi");

  // 7. Ret: ikinci talep gerekçeyle reddedilir, talep eden görür
  await gir("ek2", "#/ekonomi");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await formuDoldur("mu4", "طلب سيرفض", gunEkle(1));
  const r1 = (await paketler()).find((x) => x.baslik === "طلب سيرفض");
  await gir("pl1", "#/paketler");
  await p.locator(`[data-gorev-reddet="${r1?.id}"]`).click();
  await p.locator("[data-gorev-red-gerekce]").fill("لا حاجة");
  await p.locator("[data-gorev-red-onay]").click(); await p.waitForTimeout(400);
  const r2 = (await paketler()).find((x) => x.id === r1?.id);
  ok(r2?.durum === "iptal" && r2.gorevTalebi?.red?.gerekce === "لا حاجة", "talep gerekçeyle reddedildi");
  await gir("ek2", "#/ekonomi/arsiv");
  ok((await p.locator(`[data-prg-arsiv="${r1?.id}"]`).innerText()).includes("لا حاجة"), "talep eden reddi gerekçesiyle arşivde görüyor");

  // 8. 390 pikselde taşma yok (talep kartı ve pencere açıkken)
  await gir("ek2", "#/ekonomi");
  await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
  await formuDoldur("mu1", "طلب للعرض", gunEkle(1));
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((d) => localStorage.setItem("trt-planlama-dil", d), dil);
    for (const yol of ["#/stok", "#/paketler"]) {
      await gir("pl1", yol);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok((await p.locator("[data-gorev-talepleri]").count()) === 1 && t <= 1, `390px taşma yok, talepler kartı (${dil} ${yol}): ${t}`);
    }
    await p.locator("[data-gorevlendir]").click(); await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok, görev penceresi (${dil}): ${t}`);
  }

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
