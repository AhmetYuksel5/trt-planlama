// Weekly etiketi ile "Bu haftaya gelen öneriler" listesi aynı kuraldan: günü olan öneri (eski `hafta` alanı başka
// haftayı gösterse de) gününün haftasında listelenir; etiket o planı gösterir ve ayrıntıda basınca onu açar.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(900); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v24", JSON.stringify(x)); localStorage.setItem("trt-planlama-v24-iz", String(Date.now())); }, d);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/haftalik");
  const d = await veri();
  const h = d.haftalik.filter((x) => x.durum !== "kesinlesti").sort((a, c) => c.baslangic.localeCompare(a.baslangic))[0];
  const gun = (n) => { const t = new Date(h.baslangic + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const m = d.kisiler.find((k) => k.birim === "muhabir");
  // Günü bu haftada, eski hafta alanı bir önceki haftada: önce etiket "Weekly" deyip liste göstermiyordu.
  d.oneriler.unshift({ id: "o-hf-test", muhabirId: m.id, ulke: "filistin", haberBasligi: "اختبار الأسبوع", gelisme: "تفاصيل", paketBasligi: "عنوان", tur: "haber", bicim: "pkg", sahaGerekli: false, zaman: new Date().toISOString(), kanal: "sistem", durum: "yeni", hedefTarih: gun(1), bitisTarih: gun(2), hafta: gun(-7) });
  await yaz(d);
  await git("#/haftalik/" + h.id);
  // Kartın başlığı Strap; Header kartta yok (kullanıcı: kart sade), öneri kimliğiyle aranıyor.
  ok((await p.locator('[data-oneri="o-hf-test"]').count()) > 0, "öneri haftanın listesinde");
  await git("#/oneriler/o-hf-test");
  const e = p.locator('[data-oneri-etiketi="haftalik"]');
  ok((await e.count()) === 1, "Weekly etiketi var");
  ok((await e.getAttribute("href")) === "#/haftalik/" + h.id, "etiket o planı açıyor");
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
