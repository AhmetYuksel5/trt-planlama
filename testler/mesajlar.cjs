// Mesajlar (kullanıcı: muhabir görevlendirilen paketi için yazışmaya yazdı, Programlar'a bildirim gitti ama
// mesaj bulunamadı): yazışma paket sayfasında da, masanın takibindeki pakette masa katılır ve bildirim alır,
// menüde "Mesajlar · okunmamış", bildirim doğrudan konuşmayı açar, okununca sayı düşer.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900); };
  const kim = (id) => p.evaluate((x) => localStorage.setItem("trt-planlama-oturum", x), id);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/ana");
  // Beyrut paketi Programlar'ın takibinde (Planlama masa için görevlendirmiş gibi).
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.paketler = d.paketler.map((x) => (x.id === "p-beyrut" ? { ...x, durum: "onaylandi", masaTakibi: "program" } : x));
    d.mesajlar = d.mesajlar.filter((m) => m.oneriId !== "o-beyrut");
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, K);

  // Muhabir paketin sayfasından yazıyor.
  await kim("mu3");
  await git("#/paketler/p-beyrut");
  const kart = p.locator('[data-yazisma="o-o-beyrut"]');
  ok((await kart.count()) === 1, "paket sayfasında işin yazışması");
  await kart.locator("[data-mesaj-yazi]").fill("وصلت إلى بيروت، التصوير غداً");
  await kart.locator("[data-mesaj-gonder]").click();
  await p.waitForTimeout(300);
  let d = await veri();
  const h = [...d.hareketler].reverse().find((x) => x.tip === "oneriMesaji" && x.oneriId === "o-beyrut");
  ok(h && h.veri.sahip.split(",").includes("program") && h.veri.sahip.split(",").includes("planlama"), `bildirim Programlar'a ve Planlama'ya (${h && h.veri.sahip})`);

  // Programlar: menüde sayı, bildirim konuşmaya götürür.
  await kim("pr2");
  await git("#/programlar/icerikler");
  const menu = p.locator('a[href="#/mesajlar"]').first();
  ok((await menu.count()) === 1 && /1/.test(await menu.innerText()), `Programlar menüsünde Mesajlar · 1 (${await menu.innerText().catch(() => "")})`);
  ok((await p.locator('[data-mesaj-rozeti="1"]').count()) >= 1, "İçerikler kartında okunmamış mesaj simgesi");
  await p.locator('button[aria-label="Bildirimler"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator('a[href="#/mesajlar/o-o-beyrut"]').count()) >= 1, "bildirim doğrudan konuşmaya götürüyor");
  await git("#/mesajlar");
  ok((await p.locator('[data-mesaj-konu="o-o-beyrut"].okunmamis').count()) === 1, "listede okunmamış, kalın");
  await p.locator('[data-mesaj-konu="o-o-beyrut"]').click();
  await p.waitForTimeout(700);
  ok((await p.locator('[data-mesaj-konusma] [data-mesaj]').count()) === 1, "konuşma açıldı");
  d = await veri();
  ok(!!d.mesajOkunan?.pr2?.k["o-o-beyrut"], "göründü, okunmuş sayıldı");
  ok(!/\d/.test(await p.locator('a[href="#/mesajlar"]').first().innerText()), "menüde sayı düştü");
  // Programlar cevap yazar; muhabire gider.
  await p.locator("[data-mesaj-konusma] [data-mesaj-yazi]").fill("تمام، بانتظار المواد");
  await p.locator("[data-mesaj-konusma] [data-mesaj-gonder]").click();
  await p.waitForTimeout(300);
  d = await veri();
  const h2 = [...d.hareketler].reverse().find((x) => x.tip === "oneriMesaji" && x.kisiId === "pr2");
  ok(h2 && h2.veri.kime === "mu3" && h2.veri.sahip === "planlama", `cevap muhabire ve Planlama'ya (${h2 && JSON.stringify(h2.veri)})`);
  ok((await p.locator('[data-mesaj-is]').getAttribute("href")) === "#/paketler/p-beyrut", "İşi aç paketin sayfasına");

  // Masası olmayan birim katılamaz.
  await kim("nd1");
  await git("#/mesajlar");
  ok((await p.locator('[data-mesaj-konu="o-o-beyrut"]').count()) === 0, "katılımcı olmayanın listesinde yok");

  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    // Uzun Arapça mesajlı demo konuşmaları da (Planlama, muhabir): satır sütunu genişletiyordu.
    for (const [kisi, yol] of [["pr2", "#/mesajlar"], ["pr2", "#/mesajlar/o-o-beyrut"], ["pl1", "#/mesajlar"], ["mu1", "#/mesajlar"]]) {
      await kim(kisi);
      await git(yol);
      const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(tasma === 0, `390px taşma yok (${dil} ${yol}): ${tasma}`);
    }
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
