// Önerinin ek bilgileri (kullanıcı: masraf yazıdan ibaret kalmasın, teklif kabul edilince pakete geçsin;
// bağlantılar ve görsel teklife eklensin): ayrıntıda görünür, "Plana ekle"de masraf kutusu
// işaretliyse kalemler pakete geçer, kaldırılırsa geçmez.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const gir = async (kim, yol) => {
    await p.evaluate((k) => localStorage.setItem("trt-planlama-oturum", k), kim);
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(900);
  };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); });
  await gir("pl1", "#/oneriler");
  let d = await veri();
  const yarin = d.planlar.find((x) => x.id === "nd-yarin");
  const planda = new Set([...d.gelismeler, ...d.paketler, ...d.canliYayinlar].map((x) => x.oneriId).filter(Boolean));
  const uygun = d.oneriler.filter((x) => x.muhabirId && !x.talimatVeren && x.paketBasligi && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.hedefTarih === yarin.tarih && x.bicim !== "canli" && !x.takipTuru && !planda.has(x.id));
  ok(uygun.length >= 2, "iki uygun öneri var");
  const [o1, o2] = uygun;
  const MASRAF = [{ id: "ms-t1", tur: "ulasim", tutar: 80, para: "USD" }, { id: "ms-t2", tur: "konaklama", tutar: 150, para: "USD" }];
  await p.evaluate(([a, c, m]) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    d.oneriler = d.oneriler.map((x) => (x.id === a ? { ...x, masraflar: m, baglantilar: ["https://ornek.example/kaynak"] } : x.id === c ? { ...x, masraflar: [{ ...m[0], id: "ms-t3" }] } : x));
    localStorage.setItem("trt-planlama-v25", JSON.stringify(d));
  }, [o1.id, o2.id, MASRAF]);

  await gir("pl1", "#/oneriler/" + o1.id);
  const ekler = p.locator("[data-oneri-ekleri]").first();
  ok((await ekler.count()) === 1, "ayrıntıda ek bilgiler");
  const metin = await ekler.innerText();
  ok(metin.includes("80") && metin.includes("150") && metin.includes("ornek.example"), "masraf kalemleri ve bağlantının sitesi görünüyor");
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(300);
  const kutu = p.locator("[data-masraf-onay-kutusu] input");
  ok((await kutu.count()) === 1 && (await kutu.isChecked()), "Plana ekle'de masraf kutusu işaretli gelir");
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk1 = d.paketler.find((x) => x.oneriId === o1.id);
  ok(pk1 && pk1.masraflar?.length === 2 && pk1.masraflar.map((m) => m.id).join() === "ms-t1,ms-t2", "masraf kalemleri pakete geçti");

  await gir("pl1", "#/oneriler/" + o2.id);
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(300);
  await p.locator("[data-masraf-onay-kutusu] input").uncheck();
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.oneriId === o2.id);
  ok(pk2 && !pk2.masraflar?.length, "kutu kaldırılınca masraf pakete geçmez");
  ok(d.oneriler.find((x) => x.id === o2.id).masraflar?.length === 1, "önerinin kalemleri yerinde");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
