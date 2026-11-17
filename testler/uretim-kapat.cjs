// Üretim bitmeden "Yapıldı olarak kapat" (kullanıcı: yol yanlışlıkla verilmiş, öbür birimler sistemde değil, paket
// metin durağında bekliyordu ama yayınlandı): onay yetkilisi kapatır, paket tamamlanır, künyede onaylayan; "Tamamlamayı
// geri al" paketi kaldığı durağa döndürür. Muhabir düğmeyi görmez.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v25", JSON.stringify(x)); localStorage.setItem("trt-planlama-v25-iz", String(Date.now())); }, d);
  const kim = async (id, h) => { await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), id); await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(700); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await kim("yo3", "#/");

  let d = await veri();
  const pk = d.paketler.find((x) => x.tur === "haber" && !x.ozelId && !x.masaTakibi && x.muhabirId);
  Object.assign(pk, {
    durum: "uretimde", adim: "metin", isaret: undefined, masaTakibi: undefined, stok: undefined,
    uretim: { yol: { gorev: "newsdesk", editoryal: "newsdesk", dil: "scriptEditor", grafik: "atla", video: "newsdesk", yukleme: "newsdesk", yayin: "newsdesk" }, parca: { metin: true } },
  });
  await yaz(d);

  await kim(pk.muhabirId, "#/paketler/" + pk.id);
  ok((await p.locator("[data-uretim-kapat]").count()) === 0, "muhabir kapatamaz");

  await kim("yo3", "#/paketler/" + pk.id);
  const dugme = p.locator(`[data-uretim-kapat="${pk.id}"]`).first();
  ok((await dugme.count()) === 1, "tam yöneticide düğme var");
  await dugme.click();
  await p.waitForTimeout(500);
  d = await veri();
  let x = d.paketler.find((y) => y.id === pk.id);
  ok(x.durum === "tamamlandi" && !x.adim, "paket tamamlandı: " + x.durum);
  ok(x.uretim?.kapandi?.adim === "metin", "kapandığı durak saklı");
  ok(x.kunye?.onaylayan?.[0]?.kisiId === "yo3", "künyede onaylayan");
  ok(d.hareketler.some((h) => h.tip === "uretimKapatildi" && h.paketId === pk.id), "hareket yazıldı");

  await kim("yo3", "#/paketler/" + pk.id);
  await p.locator("[data-tamamlama-geri-al]").first().click();
  await p.waitForTimeout(500);
  x = (await veri()).paketler.find((y) => y.id === pk.id);
  ok(x.durum === "uretimde" && x.adim === "metin" && !x.uretim?.kapandi, "geri alınınca metin durağına döndü");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
