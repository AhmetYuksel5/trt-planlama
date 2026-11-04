// Plandakine bağla: muhabir adına doğrudan açılmış (öneriye bağlı olmayan) dünkü onaylı PKG, öneriye ayrıntıdan ve plan satırından bağlanır; paket değişmez, öneri "plana eklendi"
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
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v23")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v23", JSON.stringify(x)); localStorage.setItem("trt-planlama-v23-iz", String(Date.now())); }, d);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/oneriler");
  let d = await veri();
  const dun = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  // Günün tek planı var (açılış işi aynı günün çiftlerini topluyor): dünkü plan varsa o, yoksa bir kopya.
  let plan = d.planlar.find((x) => x.tarih === dun && x.basliklar.length);
  if (plan) plan.durum = "onayli";
  else {
    plan = { ...d.planlar.find((x) => x.basliklar.length), id: "nd-test-dun", tarih: dun, durum: "onayli" };
    d.planlar.push(plan);
  }
  const bekleyen = d.oneriler.filter((o) => o.muhabirId && !o.giren && !o.talimatVeren && ["yeni", "degerlendiriliyor"].includes(o.durum) && !d.gelismeler.some((g) => g.oneriId === o.id) && !d.paketler.some((x) => x.oneriId === o.id));
  const [a1, a2] = bekleyen.filter((o, i, l) => l.findIndex((x) => x.muhabirId === o.muhabirId) === i);
  const sablon = d.paketler.find((x) => x.planId);
  const paket = (id, o) => ({ ...sablon, id, kod: id, planId: plan.id, planBaslikId: plan.basliklar[0].id, muhabirId: o.muhabirId, baslik: o.paketBasligi || o.haberBasligi, durum: "onaylandi", oneriId: undefined, haftalikKalemId: undefined, ozelId: undefined, isaret: undefined, stok: undefined });
  d.paketler.push(paket("p-bagla-1", a1), paket("p-bagla-2", a2));
  await yaz(d);

  // 1. Önerinin ayrıntısından
  await git("#/oneriler/" + a1.id);
  ok((await p.locator("[data-plandakine-bagla] [data-bagla-aday='p-bagla-1']").count()) === 1, "ayrıntıda dünkü onaylı PKG aday");
  await p.locator("[data-bagla-aday='p-bagla-1'] [data-bagla]").click();
  await p.waitForTimeout(300);
  d = await veri();
  let o = d.oneriler.find((x) => x.id === a1.id);
  let pk = d.paketler.find((x) => x.id === "p-bagla-1");
  ok(o.durum === "planaEklendi" && o.paketId === "p-bagla-1" && o.planTarihi === dun, "öneri plana eklendi, paketi ve günü dünkü: " + o.durum);
  ok(pk.oneriId === a1.id && pk.durum === "onaylandi" && pk.muhabirId === a1.muhabirId, "paket bağlandı, durum ve muhabir değişmedi");
  ok(d.hareketler.some((h) => h.tip === "oneriPlandakineBaglandi" && h.oneriId === a1.id), "bağlama hareketi");
  ok(!d.hareketler.some((h) => h.paketId === "p-bagla-1" && ["paketOnaylandi", "paketIptal"].includes(h.tip)), "muhabire yeni görev ya da iptal gitmedi");
  ok((await p.locator("[data-plandakine-bagla]").count()) === 0, "bağlandıktan sonra aday listesi kalktı");

  // 2. Plan satırından (ters yön)
  await git("#/nextday/" + plan.id);
  await p.locator("details").evaluateAll((l) => l.forEach((x) => (x.open = true)));
  const dugme = p.locator(`[aria-label="Muhabirin önerisi var, bağla"]`);
  ok((await dugme.count()) === 1, "plandaki bağsız PKG satırında bağla düğmesi (yalnız bağsız olanda)");
  await dugme.first().click();
  await p.locator("[data-paket-bagla]").first().click();
  await p.waitForTimeout(300);
  d = await veri();
  o = d.oneriler.find((x) => x.id === a2.id);
  ok(o.durum === "planaEklendi" && o.paketId === "p-bagla-2", "plan satırından bağlandı: " + o.durum);

  // 3. Açılış eşitlemesi geri düşürmüyor
  await git("#/oneriler");
  d = await veri();
  ok(d.oneriler.find((x) => x.id === a1.id).durum === "planaEklendi", "yeniden açılışta plana eklendi kaldı");

  // 4. Muhabir: değerlendiriliyor kartı yok
  await p.evaluate((m) => localStorage.setItem("trt-planlama-oturum", m), a1.muhabirId);
  await git("#/oneriler");
  ok((await p.locator("[data-plandakine-bagla], [data-bagla]").count()) === 0, "muhabir bağlama araçlarını görmüyor");
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
