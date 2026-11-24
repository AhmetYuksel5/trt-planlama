// Özel yayının içeriği planlarda (kullanıcı: paketler özel yayının uygulanacağı günün planına eklenecek,
// haftalıkta haftalığa; stokta "special coverage" olarak görülecek, takibi oradan da yapılacak):
// görevlendirilen içerik yayın gününün Next Day planına yayının adıyla açılan başlığın altında PKG olarak
// girer (plan açılmamışsa açılınca), Stok'un "Special Coverage" kutusunda yayın yayın görünür, Üretim'de
// ikinci kez değil; Weekly'de salt okunur "التغطيات الخاصة" bölümünde.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const tarihYaz = (loc, deger) =>
    loc.evaluate((el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, deger);
  const yerel = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("sv"); };
  const YARIN = yerel(1), SONRA = yerel(3);
  const AD = "تغطية الاختبار الخاصة";

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/ozel");
  const mu = await p.evaluate(([k, ad, bas, bit]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.ozel.push({ id: "oz-p", ad, tarih: bas, bitis: bit, hazirlik: [], iz: [] });
    localStorage.setItem(k, JSON.stringify(d));
    return d.kisiler.find((x) => x.birim === "muhabir" && !x.pasif && !x.hesapsiz).id;
  }, [K, AD, YARIN, yerel(4)]);

  const gorevlendir = async (gun, strap) => {
    await git("#/ozel/oz-p");
    await p.click('[data-ozel-sekme="icerik"]');
    await p.click("[data-ozel-icerik-ekle]");
    const f = p.locator("[data-ozel-icerik-formu]");
    await f.waitFor();
    await f.locator("select").first().selectOption(mu);
    await f.locator("[data-ozel-icerik-baslik]").fill(strap);
    await tarihYaz(f.locator("input[data-ozel-yayin-gunu]"), gun);
    await f.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
    await p.waitForTimeout(500);
  };
  await gorevlendir(YARIN, "تقرير اليوم الأول");
  await gorevlendir(SONRA, "تقرير اليوم الثالث");

  let d = await durum();
  const plan = d.planlar.find((x) => x.tarih === YARIN);
  const p1 = d.paketler.find((x) => x.ozelId === "oz-p" && x.yayinGunu === YARIN);
  const p2 = d.paketler.find((x) => x.ozelId === "oz-p" && x.yayinGunu === SONRA);
  ok(!!p1 && !p1.stok, "içerik stok paketi değil");
  ok(p1 && plan && p1.planId === plan.id, "yayın gününün Next Day planına girdi");
  const pb = plan && plan.basliklar.find((x) => x.id === p1?.planBaslikId);
  const havuz = pb && d.basliklar.find((x) => x.id === pb.baslikId);
  ok(!!havuz && havuz.ad === AD, "planda yayının adıyla başlık, paket onun altında");
  ok(!!p2 && !p2.planId, "planı açılmamış gündeki içerik bekliyor");

  // Next Day: başlık ve PKG satırı.
  await git("#/nextday/" + plan.id);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));
  ok((await p.getByText(AD).count()) >= 1, "Next Day'de yayının başlığı");
  ok((await p.getByText("تقرير اليوم الأول").count()) >= 1, "Next Day'de içeriğin PKG satırı");

  // Plan sonradan açılınca bağlanır.
  await p.evaluate(([k, t]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.planlar.push({ id: "nd-" + t, tarih: t, durum: "taslak", ekip: [], gorevlendirmeler: [], hazirPaketler: [], basliklar: [], olusturan: "pl1", olusturma: new Date().toISOString() });
    localStorage.setItem(k, JSON.stringify(d));
  }, [K, SONRA]);
  await git("#/stok/ozel");
  d = await durum();
  const p2b = d.paketler.find((x) => x.id === p2.id);
  ok(p2b.planId === "nd-" + SONRA && d.planlar.find((x) => x.id === "nd-" + SONRA).basliklar.some((x) => x.id === p2b.planBaslikId), "plan açılınca içerik ona, yayının başlığı altına bağlandı");
  // Aynı yayının iki günü aynı havuz başlığını kullanıyor.
  const bid = (pid, pbid) => d.planlar.find((x) => x.id === pid).basliklar.find((x) => x.id === pbid).baslikId;
  ok(bid(plan.id, p1.planBaslikId) === bid("nd-" + SONRA, p2b.planBaslikId), "iki günde aynı başlık (havuz tek)");

  // Stok: Special Coverage kutusu, Üretim'de değil.
  ok((await p.locator('[data-stok-kutu="ozel"], a[href="#/stok/ozel"]').count()) >= 1, "Stok'ta Special Coverage kutucuğu");
  ok((await p.locator(`[data-stok-ozel="oz-p"] [data-stok-paket="${p1.id}"]`).count()) === 1, "içerik Special Coverage'ta yayının altında");
  await git("#/stok/uretim");
  ok((await p.locator(`[data-stok-paket="${p1.id}"]`).count()) === 0, "Üretim'de ikinci kez yok");

  // Weekly: salt okunur bölüm (belge ve plan ekranı).
  const hafta = d.haftalik.find((h) => { const s = new Date(h.baslangic + "T12:00:00"); s.setDate(s.getDate() + 6); return h.baslangic <= YARIN && s.toLocaleDateString("sv") >= YARIN; });
  if (hafta) {
    await git("#/haftalik/" + hafta.id + "/belge");
    ok((await p.locator('[data-hafta-ozel-yayin="oz-p"]').count()) >= 1, "Weekly belgesinde özel yayın bölümü");
    ok((await p.locator('[data-hafta-ozel-yayin="oz-p"]').first().innerText()).includes("تقرير اليوم الأول"), "bölümde içerik satırı");
    await git("#/haftalik/" + hafta.id);
    ok((await p.locator('[data-hafta-ozel-yayin="oz-p"]').count()) >= 1, "Weekly plan ekranında da");
  } else ok(true, "bu haftanın Weekly'si yok (bölüm sınanmadı)");

  // Yayının sayfasında içerik Stok'un kartıyla; görevi geri alınca iptal, plandan ve boş kalan başlıktan düşer.
  await git("#/ozel/oz-p");
  await p.click('[data-ozel-sekme="icerik"]');
  ok((await p.locator(`[data-ozel-icerik="${p2.id}"] [data-stok-paket="${p2.id}"]`).count()) === 1, "içerik Stok kartıyla");
  await p.locator(`[data-ozel-icerik="${p2.id}"] [data-ozel-icerik-geri-al]`).click();
  await p.waitForTimeout(400);
  d = await durum();
  const p2c = d.paketler.find((x) => x.id === p2.id);
  const plan2 = d.planlar.find((x) => x.id === "nd-" + SONRA);
  ok(p2c.durum === "iptal" && !p2c.planId, "görevi geri alınan içerik iptal, plandan düştü");
  ok(!plan2.basliklar.some((x) => x.id === p2b.planBaslikId), "boş kalan yayın başlığı plandan kalktı");
  ok(d.hareketler.some((h) => h.tip === "paketIptal" && h.paketId === p2.id && h.veri?.kime === mu), "muhabire bildirim");
  ok((await p.locator(`[data-ozel-icerik="${p2.id}"]`).count()) === 0, "listeden kalktı");
  ok((await p.locator(`[data-ozel-icerik="${p1.id}"] [data-ozel-icerik-geri-al]`).count()) === 1, "öbür içerikte geri alma düğmesi");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
