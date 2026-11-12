// Önerinin masaya sorulması (kullanıcı): Planlama muhabir önerisini Ekonomi, Program ya da Spor'a iletir; masa
// notuyla (ve öneriyi düzenleyerek) alır ya da almaz; aldığında muhabiri Planlama görevlendirir. Masanın notu ve
// soru hareketleri muhabire görünmez.
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
  const durum = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24") || "{}"));
  // "Birimin görüşüne sun" önerinin ⋯ menüsünde (kullanıcı: kart yer kaplıyordu); menü açılmadan madde yok.
  const menu = (kap = "[data-oneri-alt]") => p.locator(`${kap} button[aria-haspopup="menu"]`).first();
  const sorulabilir = async (kap) => {
    if (!(await menu(kap).count())) return false;
    await menu(kap).click(); await p.waitForTimeout(150);
    const n = await p.locator("[data-masaya-sor-ac]").count();
    await menu(kap).click(); await p.waitForTimeout(100);
    return n > 0;
  };
  const sorAc = async (kap) => { await menu(kap).click(); await p.waitForTimeout(150); await p.locator("[data-masaya-sor-ac]").click(); await p.waitForTimeout(200); };

  // 1. Planlama'nın karar vereceği bir muhabir önerisi bul; masaya iletilebiliyor
  await gir("pl1", "#/oneriler");
  const yollar = await p.locator("main [data-oneri]").evaluateAll((l) => [...new Set(l.map((a) => "#/oneriler/" + a.getAttribute("data-oneri")))]);
  let oneriYolu = null;
  for (const y of yollar) {
    await gir("pl1", y);
    if (await sorulabilir()) { oneriYolu = y; break; }
  }
  ok(!!oneriYolu, "masaya iletilebilen öneri bulundu: " + oneriYolu);
  const oneriId = oneriYolu.split("/").pop();
  await sorAc();
  await p.locator("[data-masa-birim]").selectOption("ekonomi");
  await p.locator("[data-masa-sor-notu]").fill("هل يناسبكم؟");
  await p.locator("[data-masaya-ilet]").click(); await p.waitForTimeout(400);
  let d = await durum();
  const soru = d.masaSorulari.find((m) => m.oneriId === oneriId);
  ok(!!soru && soru.birim === "ekonomi" && !soru.cevap && soru.soran === "pl1", "soru kaydı açıldı (ekonomi, yanıt bekliyor)");
  ok(!(await sorulabilir()), "açık soru varken ikinci kez iletilmiyor");
  ok((await p.locator('[data-oneri-meta] [data-masa-rozeti="ekonomi"]').count()) >= 1, "bilgi satırında birim rozeti (Ekonomi · görüş bekleniyor)");
  const muhabirId = d.oneriler.find((o) => o.id === oneriId).muhabirId;

  // 2. Planlama'nın öneriler sayfasında "Masalardaki öneriler"
  await gir("pl1", "#/oneriler");
  ok((await p.locator(`[data-masalardaki-oneriler] [data-masa-oneri="${oneriId}"]`).count()) === 1, "Planlama masalardaki öneriyi listede görüyor");

  // 3. Ekonomi: ana sayfasında ve Ekonomi sayfasında görür, önerinin sayfasına girer, düzenler, notuyla alır
  await gir("ek2", "#/ana");
  ok((await p.locator('[data-prg-ozet-oge="soru"]').count()) === 1, "Ekonomi ana sayfasında görüş bekleyen öneri kararlarda");
  await gir("ek2", "#/ekonomi/oneriler");
  ok((await p.locator(`[data-prg-soru="${oneriId}"]`).count()) === 1, "Ekonomi'nin Öneriler bölümünde Planlama'dan gelen öneri");
  await p.locator(`[data-prg-soru="${oneriId}"] a`).first().click(); await p.waitForTimeout(600);
  ok((await p.locator("[data-masa-al]").count()) === 1, "Ekonomi önerinin sayfasına girdi, yanıt düğmeleri var");
  ok((await p.locator("[data-oneri-duzenle]").count()) === 1, "Ekonomi öneriyi düzenleyebiliyor");
  await p.locator("[data-masa-yanit-notu]").fill("نعم مع زاوية اقتصادية");
  await p.locator("[data-masa-al]").click(); await p.waitForTimeout(400);
  d = await durum();
  const s2 = d.masaSorulari.find((m) => m.id === soru.id);
  ok(s2?.cevap?.kabul === true && s2.cevap.not === "نعم مع زاوية اقتصادية", "Ekonomi notuyla aldı");
  ok(d.hareketler.some((h) => h.tip === "masaOneriyiAldi" && h.oneriId === oneriId && h.veri?.kime === "pl1"), "Planlama'ya bildirim (masaOneriyiAldi)");

  // 4. Öbür masa (Program) bu öneriye giremez; muhabir masa kartını ve hareketlerini görmez
  await gir("pr2", oneriYolu);
  ok((await p.locator("[data-masa-al], [data-oneri-duzenle]").count()) === 0, "başka masa bu öneriye erişemiyor");
  await gir(muhabirId, oneriYolu);
  const metin = await p.locator("main").innerText();
  ok((await p.locator("[data-masa-sorulari]").count()) === 0 && !metin.includes("زاوية اقتصادية") && !/görüşüne sundu|uygun buldu/.test(metin), "muhabir masa kartını, notu ve hareketleri görmüyor");

  // 5. Planlama muhabiri görevlendirir: görev paketi, öneriye bağlı, ekonomi kolunda, masanın takibinde
  await gir("pl1", oneriYolu);
  ok((await p.locator("[data-oneri-gorevlendir]").count()) === 1, "Planlama'da \"Muhabiri görevlendir\"");
  await p.locator("[data-oneri-gorevlendir-formu] input[type=date]").fill(gunEkle(2));
  await p.locator("[data-oneri-gorevlendir]").click(); await p.waitForTimeout(500);
  d = await durum();
  const pk = d.paketler.find((x) => x.oneriId === oneriId && x.gorev);
  const o2 = d.oneriler.find((o) => o.id === oneriId);
  ok(!!pk && pk.durum === "onaylandi" && pk.tur === "ekonomi" && !pk.stok && pk.masaTakibi === "ekonomi" && pk.sonTarih === gunEkle(2) && pk.muhabirId === muhabirId, "görev paketi: onaylı, ekonomi kolunda, masanın takibinde (stokta değil), günüyle");
  ok(o2.durum === "planaEklendi" && o2.paketId === pk?.id, "öneri görevlendirildi (plana eklendi, paketine bağlı)");
  ok((await p.locator("[data-masa-paket]").count()) === 1 && (await p.locator("[data-oneri-gorevlendir]").count()) === 0, "kartta \"Görevlendirildi\", düğme kalktı");
  await gir("ek2", "#/ekonomi/oneriler");
  ok((await p.locator(`[data-prg-soru="${oneriId}"]`).count()) === 0, "görevlendirilen öneri masanın bekleyen listesinden düştü");
  await gir(muhabirId, "#/oneriler");
  ok((await p.locator(`[data-paket="${pk?.id}"]`).count()) === 1, "muhabirin \"Senin sıran\"ında görev");

  // 6. Ret: başka öneri Program'a iletilir, Program almaz; Planlama yeniden başka masaya iletebilir
  await gir("pl1", "#/oneriler");
  let ikinci = null;
  for (const y of yollar.filter((y) => y !== oneriYolu)) {
    await gir("pl1", y);
    if (await sorulabilir()) { ikinci = y; break; }
  }
  await sorAc();
  await p.locator("[data-masa-birim]").selectOption("program");
  await p.locator("[data-masaya-ilet]").click(); await p.waitForTimeout(400);
  await gir("pr2", ikinci);
  await p.locator("[data-masa-alma]").click(); await p.waitForTimeout(400);
  d = await durum();
  const s3 = d.masaSorulari.filter((m) => m.oneriId === ikinci.split("/").pop()).at(-1);
  ok(s3?.cevap?.kabul === false, "Program almadı");
  await gir("pl1", ikinci);
  ok((await sorulabilir()) && (await p.locator("[data-oneri-gorevlendir]").count()) === 0, "reddedilen öneri başka masaya iletilebiliyor, görevlendirilemiyor");

  // 6b. Next Day'de çalışırken de: plan ekranının öneri penceresinden birim görüşüne sunulur
  await gir("pl1", "#/nextday/yarin");
  await p.getByRole("button", { name: /^Öneri/ }).first().click(); await p.waitForTimeout(500);
  const kart = p.locator("dialog[open] [data-oneri]").first();
  ok((await kart.locator("[data-oneri-ekle]").count()) + (await kart.locator("[data-oneri-hizli-ret]").count()) >= 1, "kartta hızlı karar (Plana ekle / Reddet)");
  let ndSordu = false;
  for (const k of await p.locator("dialog[open] [data-oneri] .ok-baslik").all()) {
    await k.click(); await p.waitForTimeout(400);
    const kap = "dialog[open] > footer";
    if (await sorulabilir(kap)) {
      ok((await p.locator("dialog[open] [data-oneri-bolum]").count()) >= 3, "pencerede katlanır bölümler");
      await sorAc(kap);
      await p.locator("dialog[open] [data-masa-birim]").last().selectOption("spor");
      await p.locator("dialog[open] [data-masaya-ilet]").last().click(); await p.waitForTimeout(400);
      ndSordu = (await durum()).masaSorulari.some((m) => m.birim === "spor");
      break;
    }
    await p.locator("dialog[open] > header button[aria-label='Kapat']").last().click(); await p.waitForTimeout(200);
  }
  ok(ndSordu, "Next Day penceresinden birimin görüşüne sunuldu (Spor)");

  // 7. 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    for (const [kim, yol] of [["pl1", ikinci], ["pl1", "#/oneriler"], ["ek2", "#/ana"]]) {
      await gir(kim, yol);
      const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(t <= 1, `390px taşma yok (${dil} ${kim} ${yol}): ${t}`);
    }
  }

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
