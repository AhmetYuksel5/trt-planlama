// Plana eklerken önerinin فكرة المعالجة ve المعالجة البصرية metni isteğe bağlı plana girer
// (kullanıcı): PKG satırının altında içeriden, italik; belgede kaldırılabilir, öneri değişmez.
const { chromium } = require(process.env.PW);
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
  const o = d.oneriler.find((x) => x.muhabirId && !x.talimatVeren && x.paketBasligi && ["yeni", "degerlendiriliyor"].includes(x.durum) && x.hedefTarih === yarin.tarih && x.bicim !== "canli" && !x.takipTuru && !planda.has(x.id));
  ok(!!o, "uygun öneri var");
  const ISLEME = "معالجة تجريبية عبر شهادات ميدانية";
  const GORSEL = "لقطات جوية وخريطة تفاعلية";
  await p.evaluate(([id, a, g]) => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    d.oneriler = d.oneriler.map((x) => (x.id === id ? { ...x, islemeFikri: a, gorselIsleme: g } : x));
    localStorage.setItem("trt-planlama-v25", JSON.stringify(d));
  }, [o.id, ISLEME, GORSEL]);

  await gir("pl1", "#/oneriler/" + o.id);
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(300);
  ok((await p.locator("[data-pe-isleme]").count()) === 1 && (await p.locator("[data-pe-gorsel]").count()) === 1, "formda iki isteğe bağlı kutu");
  ok(!(await p.locator("[data-pe-isleme]").isChecked()), "kendiliğinden işaretli değil");
  await p.check("[data-pe-isleme]");
  await p.check("[data-pe-gorsel]");
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(500);
  d = await veri();
  const pk = d.paketler.find((x) => x.oneriId === o.id);
  ok(pk && pk.planIsleme === ISLEME && pk.planGorsel === GORSEL, "paketin plan notlarına yazıldı");

  await gir("pl1", `#/nextday/${yarin.id}/cikti`);
  const notlar = p.locator("article.cikti").first().locator(".cikti-pkg-not");
  ok((await notlar.count()) === 2, "çıktıda PKG'nin altında iki satır");
  const stil = await notlar.first().evaluate((e) => getComputedStyle(e).fontStyle);
  ok(stil === "italic", "italik");
  ok((await p.locator("article.cikti .cikti-pkg-not button").count()) === 0, "çıktıda silme düğmesi yok");

  await gir("pl1", `#/nextday/${yarin.id}/belge`);
  const sil = p.locator(`[data-pkg-not="planIsleme"] button`).first();
  ok((await sil.count()) === 1, "belgede kaldırma düğmesi");
  await sil.click();
  await p.waitForTimeout(400);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.id === pk.id);
  ok(!pk2.planIsleme && pk2.planGorsel === GORSEL, "işleme fikri plandan kalktı, görsel işleme kaldı");
  ok(d.oneriler.find((x) => x.id === o.id).islemeFikri === ISLEME, "önerinin kendisi değişmedi");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
