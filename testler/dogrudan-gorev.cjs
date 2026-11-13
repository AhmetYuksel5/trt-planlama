// Öneriden doğrudan görevlendirme (kullanıcı): muhabirin önerisi plana eklenmeden görevlendirilir
// (plansız onaylı görev paketi); sonra plana eklenince yeni paket açılmaz, aynı paket o başlığa
// onaylı PKG olarak girer. Muhabir bu düğmeyi görmez.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl1", "#/oneriler");
  let d = await veri();
  const yarin = d.planlar.find((x) => x.id === "nd-yarin");
  const sorulan = new Set((d.masaSorulari ?? []).map((s) => s.oneriId));
  const planda = new Set([...d.gelismeler, ...d.paketler, ...d.canliYayinlar].map((x) => x.oneriId).filter(Boolean));
  const o = d.oneriler.find((x) => x.muhabirId && !x.talimatVeren && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.hedefTarih === yarin.tarih && x.bicim !== "canli" && !x.takipTuru && !sorulan.has(x.id) && !planda.has(x.id));
  ok(!!o, "uygun öneri var");

  const menu = async () => {
    await p.locator("[data-oneri-alt] button[aria-haspopup='menu']").first().click();
    await p.waitForTimeout(200);
  };
  await gir("pl1", "#/oneriler/" + o.id);
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 1, "⋯ menüsünde 'Muhabiri görevlendir'");
  await p.click("[data-oneri-dogrudan-gorev]");
  await p.waitForTimeout(300);
  await p.click("[data-oneri-gorev-formu] [data-oneri-gorevlendir]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk = d.paketler.find((x) => x.oneriId === o.id);
  ok(pk && pk.durum === "onaylandi" && pk.gorev && !pk.planId && pk.stok, "plansız onaylı görev paketi açıldı");
  ok(d.oneriler.find((x) => x.id === o.id).durum === "planaEklendi", "öneri plansız kabul");
  ok(d.hareketler.some((h) => h.tip === "paketGorevVerildi" && h.paketId === pk.id && h.veri?.kime === o.muhabirId), "muhabire görev bildirimi");

  // Sonra plana eklenince aynı paket onaylı PKG olarak plana girer.
  await gir("pl1", "#/oneriler/" + o.id);
  await menu();
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 0, "görevlendirilmiş öneride ikinci kez yok");
  await p.keyboard.press("Escape");
  ok((await p.locator("[data-oneri-plana-ekle]").count()) === 1, "'Plana ekle' hâlâ var");
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(300);
  ok((await p.locator(`[data-pe-gorevli="${pk.id}"]`).count()) === 1 && (await p.locator("[data-pe-paket]").count()) === 0, "formda görevli paket, yeni PKG sorulmuyor");
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.id === pk.id);
  ok(pk2.planId === yarin.id && pk2.planBaslikId && pk2.durum === "onaylandi" && !pk2.stok, "aynı paket planın başlığına onaylı girdi, stoktan çıktı");
  ok(d.paketler.filter((x) => x.oneriId === o.id).length === 1, "yeni paket açılmadı");
  ok(d.gelismeler.some((g) => g.oneriId === o.id && g.planId === yarin.id), "gelişmesi planda");
  ok((await p.locator("[data-oneri-plana-ekle]").count()) === 0, "plana girdikten sonra 'Plana ekle' yok");

  // Muhabir düğmeyi görmüyor.
  const o2 = d.oneriler.find((x) => x.muhabirId && x.id !== o.id && ["yeni", "degerlendiriliyor"].includes(x.durum));
  await gir(o2.muhabirId, "#/oneriler/" + o2.id);
  ok((await p.locator("[data-oneri-dogrudan-gorev]").count()) === 0, "muhabir görmüyor");

  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
