// Beklenen paketler (التقارير المتوقعة) aşağıdaki başlıkların sırasıyla (kullanıcı); başlık sırası değişince o da değişir.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1000); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/nextday/nd-yarin/cikti");
  // Başlıklardan iki kabul edilmiş paket: biri gelişmenin altında (sırayı karıştırmak için dizide ters sırada).
  await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const plan = d.planlar.find((x) => x.id === "nd-yarin");
    const kabul = (pb, i) => ({ id: "test-pk-" + i, kod: "T" + i, planId: plan.id, planBaslikId: pb.id, baslik: "تقرير اختبار " + i, sehir: "istanbul", tur: "haber", bicim: "pkg", durum: "onaylandi", notlar: [], olusturma: new Date().toISOString(), guncelleme: new Date().toISOString() });
    const yeni = plan.basliklar.slice(0, 3).map(kabul);
    d.paketler = [...yeni.reverse(), ...d.paketler];
    localStorage.setItem("trt-planlama-v25", JSON.stringify(d));
  });
  const sirasi = async () => {
    await git("#/nextday/nd-yarin/cikti");
    const metin = await p.locator("article.cikti").first().innerText();
    const [once, sonra] = [metin.split("التقارير المتوقعة")[1].split("الأحداث الإخبارية")[0], metin.split("الأحداث الإخبارية")[1]];
    const adlar = [...once.matchAll(/تقرير اختبار (\d)/g)].map((m) => m[1]);
    const asagi = [...sonra.matchAll(/تقرير اختبار (\d)/g)].map((m) => m[1]);
    return { adlar, asagi };
  };
  let s = await sirasi();
  ok(s.adlar.length === 3, "üç test paketi beklenenlerde: " + s.adlar.join());
  ok(s.adlar.join() === s.asagi.join(), "beklenenlerin sırası başlıklarınkiyle aynı: " + s.adlar.join() + " / " + s.asagi.join());
  // Başlıkların sırası ters çevrilince beklenenler de.
  await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("trt-planlama-v25"));
    const plan = d.planlar.find((x) => x.id === "nd-yarin");
    plan.basliklar.reverse();
    localStorage.setItem("trt-planlama-v25", JSON.stringify(d));
  });
  s = await sirasi();
  ok(s.adlar.join() === s.asagi.join() && s.adlar.join() === "2,1,0", "başlıklar ters sırada, beklenenler de: " + s.adlar.join());

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
