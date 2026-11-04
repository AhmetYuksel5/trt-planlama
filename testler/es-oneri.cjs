// Eş öneri: muhabirin önerisi elle yeniden girilince uyarı, plana eklerken soru, birleştirme (plan bağı asıla geçer, kopya silinir), şerit, 390px
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  const sorular = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => { sorular.push(x.message()); x.accept(); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v23")));
  const yaz = (d) => p.evaluate((x) => { localStorage.setItem("trt-planlama-v23", JSON.stringify(x)); localStorage.setItem("trt-planlama-v23-iz", String(Date.now())); }, d);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await git("#/oneriler");
  let d = await veri();
  const bugun = new Date().toISOString().slice(0, 10);
  // Asıl: muhabirin kendi gönderdiği, karar bekleyen öneri; kopyası planlamacının elle girdiği (biraz farklı yazılmış Header)
  const asil = d.oneriler.find((o) => o.muhabirId && !o.giren && !o.talimatVeren && ["yeni", "degerlendiriliyor"].includes(o.durum));
  const plan = d.planlar.filter((x) => x.tarih >= bugun && x.durum !== "devralindi").sort((a, b) => a.tarih.localeCompare(b.tarih))[0];
  asil.hedefTarih = plan.tarih;
  delete asil.hafta;
  const kopya = { ...asil, id: "o-es-kopya", giren: "pl1", kanal: "telefon", zaman: new Date().toISOString(), durum: "degerlendiriliyor", haberBasligi: asil.haberBasligi + " اليوم" };
  d.oneriler.push(kopya);
  await yaz(d);

  // 1. Giriş uyarısı: aynı muhabir ve Header yazılınca formda durum satırı
  await git("#/oneriler/yeni");
  const sec = p.locator("form select, .form select").filter({ has: p.locator(`option[value="${asil.muhabirId}"]`) }).first();
  await sec.selectOption(asil.muhabirId);
  await p.fill("[data-oneri-header]", asil.haberBasligi);
  ok((await p.locator("[data-es-uyari]").count()) === 1, "formda eş öneri uyarısı");
  await p.fill("[data-oneri-header]", "عنوان مختلف تماما عن أي شيء آخر");
  ok((await p.locator("[data-es-uyari]").count()) === 0, "farklı Header'da uyarı yok");

  // 2. Kopyayı plana eklerken asıl öneri söylenir
  await git("#/oneriler/o-es-kopya");
  await p.click("[data-oneri-plana-ekle]");
  await p.waitForTimeout(200);
  if (await p.locator('[data-pe-hedef-secim="nextday"]').count()) await p.click('[data-pe-hedef-secim="nextday"]');
  if (await p.locator("[data-pe-yeni]").count()) await p.fill("[data-pe-yeni]", "عنوان اختبار");
  sorular.length = 0;
  await p.click("[data-pe-ekle]");
  await p.waitForTimeout(300);
  ok(sorular.some((s) => s.includes(asil.haberBasligi)), "plana eklerken eş öneri sorusu: " + sorular[0]?.slice(0, 60));
  d = await veri();
  ok(d.oneriler.find((o) => o.id === "o-es-kopya").durum === "planaEklendi", "kopya plana eklendi (yine de eklendi)");
  ok(["yeni", "degerlendiriliyor"].includes(d.oneriler.find((o) => o.id === asil.id).durum), "asıl hâlâ değerlendirmede (sorunun kendisi)");

  // 3. Şerit ve ayrıntı
  await git("#/oneriler");
  ok((await p.locator("[data-es-ciftleri]").count()) === 1, "öneriler sayfasında eş öneri şeridi");
  await git("#/oneriler/" + asil.id);
  ok((await p.locator("[data-es-oneriler] [data-es-oneri='o-es-kopya']").count()) === 1, "asıl önerinin ayrıntısında eş listelendi");

  // 4. Birleştir: plan bağı asıla geçer, kopya silinir, asıl "plana eklendi"
  await p.click("[data-es-birlestir]");
  await p.waitForTimeout(300);
  d = await veri();
  const a2 = d.oneriler.find((o) => o.id === asil.id);
  ok(!d.oneriler.some((o) => o.id === "o-es-kopya"), "kopya silindi");
  ok(a2.durum === "planaEklendi" && !!a2.planId, "asıl plana eklendi oldu: " + a2.durum);
  ok(d.gelismeler.some((g) => g.oneriId === asil.id) && !d.gelismeler.some((g) => g.oneriId === "o-es-kopya"), "gelişmenin bağı asıla geçti");
  ok(!d.hareketler.some((h) => h.oneriId === "o-es-kopya") && d.hareketler.some((h) => h.tip === "onerilerBirlestirildi" && h.oneriId === asil.id), "hareketler asılda, birleştirme hareketi var");
  ok((await p.locator("[data-oneri-plana-ekle]").count()) === 0, "asılda 'Plana ekle' artık yok");
  await git("#/oneriler");
  ok((await p.locator("[data-es-ciftleri]").count()) === 0, "şerit kalktı");

  // 5. Muhabir: tek kart, plana eklendi
  await p.evaluate((m) => localStorage.setItem("trt-planlama-oturum", m), asil.muhabirId);
  await git("#/oneriler");
  ok((await p.locator("[data-es-ciftleri], [data-es-oneriler]").count()) === 0, "muhabir eş araçlarını görmüyor");

  // 6. 390px
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl1"));
  d = await veri();
  d.oneriler.push({ ...d.oneriler.find((o) => o.id === asil.id), id: "o-es-2", giren: "pl1", durum: "degerlendiriliyor", planId: undefined });
  await yaz(d);
  await p.setViewportSize({ width: 390, height: 800 });
  for (const h of ["#/oneriler", "#/oneriler/o-es-2"]) {
    await git(h);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t === 0, `390px ${h} taşma ${t}`);
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
