// Beklenen paketler belgede (kullanıcı): yerinde düzenlenir, aşağıdaki PKG satırı aynı kayıttan düzelir;
// sıra varsayılan olarak başlıklarınki, sürükleyerek elle değişir, "Başlık sırasına dön" varsayılana döner.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  for (const dil of ["tr", "ar"]) {
    const p = await b.newPage({ viewport: { width: 1400, height: 3000 } });
    p.on("pageerror", (e) => hatalar.push(String(e)));
    p.on("dialog", (x) => x.accept());
    const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
    const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900); };
    await p.goto(B);
    await p.evaluate((d) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); }, dil);
    await git("#/nextday/nd-yarin/belge");
    await p.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem(k));
      const plan = d.planlar.find((x) => x.id === "nd-yarin");
      // Yalnız test paketleri beklenende olsun.
      d.paketler = d.paketler.filter((x) => x.planId !== plan.id);
      const kabul = (pb, i) => ({ id: "be-" + i, kod: "B" + i, planId: plan.id, planBaslikId: pb.id, baslik: "تقرير متوقع " + i, sehir: "istanbul", tur: "haber", bicim: "pkg", durum: "onaylandi", notlar: [], olusturma: new Date().toISOString(), guncelleme: new Date().toISOString() });
      d.paketler.unshift(...plan.basliklar.slice(0, 3).map(kabul));
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
    }, K);
    await git("#/nextday/nd-yarin/belge");
    const sira = () => p.locator('[data-beklenen] [data-sur="beklenen"]').evaluateAll((l) => l.map((x) => x.dataset.surId));
    ok((await sira()).join() === "be-0,be-1,be-2", `${dil}: varsayılan başlıkların sırası`);
    ok((await p.locator("[data-beklenen-varsayilan]").count()) === 0, `${dil}: elle sıra yokken "Başlık sırasına dön" yok`);

    // Sürükle: be-0 → be-2'nin yerine (aşağı: altına).
    const dt = await p.evaluateHandle(() => new DataTransfer());
    const kaynak = p.locator('[data-beklenen] [data-sur="beklenen"][data-sur-id="be-0"]');
    const hedef = p.locator('[data-beklenen] [data-sur="beklenen"][data-sur-id="be-2"]');
    await kaynak.dispatchEvent("dragstart", { dataTransfer: dt });
    await hedef.dispatchEvent("dragover", { dataTransfer: dt });
    await p.waitForTimeout(100);
    ok(await hedef.evaluate((x) => x.classList.contains("sur-araya-alt")), `${dil}: hedefin altına çizgi`);
    await hedef.dispatchEvent("drop", { dataTransfer: dt });
    await kaynak.dispatchEvent("dragend", { dataTransfer: dt }).catch(() => {});
    await p.waitForTimeout(400);
    let plan = (await veri()).planlar.find((x) => x.id === "nd-yarin");
    ok((plan.beklenenSira ?? []).join() === "be-1,be-2,be-0", `${dil}: elle sıra kaydedildi (${plan.beklenenSira})`);
    ok((await sira()).join() === "be-1,be-2,be-0", `${dil}: belgede elle sıra`);
    // Aşağıdaki başlıklar yerinde: sürükleme başlık sırasını değiştirmez.
    const basliklar = plan.basliklar.slice(0, 3).map((x) => x.id);
    ok((await veri()).paketler.find((x) => x.id === "be-0").planBaslikId === basliklar[0], `${dil}: paket başlığında kaldı`);

    // Oklarla: be-0 yukarı.
    await p.locator('[data-beklenen] [data-sur-id="be-0"]').hover();
    const yukari = p.locator('[data-beklenen] [data-sur-id="be-0"] button[aria-label]').filter({ has: p.locator("svg.lucide-arrow-up, svg.lucide-chevron-up") });
    if (await yukari.count()) {
      await yukari.first().click();
      await p.waitForTimeout(300);
      ok((await sira()).join() === "be-1,be-0,be-2", `${dil}: okla yukarı`);
    }

    // Yerinde düzenleme: beklenendeki yazı aşağıdaki PKG satırında da.
    const alan = p.locator('[data-beklenen] [data-sur-id="be-1"]');
    await alan.locator("span.yerinde").first().click();
    const girdi = alan.locator("input, textarea").first();
    if (await girdi.count()) {
      await girdi.fill("تقرير معدل");
      await girdi.press("Enter");
      await p.waitForTimeout(400);
    }
    const pk = (await veri()).paketler.find((x) => x.id === "be-1");
    ok(pk.baslik === "تقرير معدل", `${dil}: beklenende düzenlenen başlık kayda yazıldı (${pk.baslik})`);
    const asagidaki = await p.locator(`[data-nd-baslik="${basliklar[1]}"]`).first().innerText();
    ok(asagidaki.includes("تقرير معدل"), `${dil}: aşağıdaki PKG satırı da düzeldi`);

    // Yeni paket elle sıra varken varsayılan yerine girer (be-1'in arkasına, aynı başlıkta).
    await p.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem(k));
      const ilk = d.paketler.find((x) => x.id === "be-1");
      d.paketler.push({ ...ilk, id: "be-3", kod: "B3", baslik: "تقرير جديد" });
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
    }, K);
    await git("#/nextday/nd-yarin/belge");
    const s4 = await sira();
    ok(s4.length === 4 && s4.indexOf("be-3") === s4.indexOf("be-1") + 1, `${dil}: yeni paket varsayılan yerinde (${s4})`);

    // Varsayılana dön.
    await p.locator("[data-beklenen-varsayilan]").first().click();
    await p.waitForTimeout(400);
    plan = (await veri()).planlar.find((x) => x.id === "nd-yarin");
    ok(!plan.beklenenSira, `${dil}: "Başlık sırasına dön" elle sırayı siliyor`);
    ok((await sira())[0] === "be-0", `${dil}: varsayılan sıra geri geldi`);
    // Çıktıda düğme yok.
    await git("#/nextday/nd-yarin/cikti");
    ok((await p.locator("[data-beklenen-varsayilan]").count()) === 0, `${dil}: çıktıda düzenleme düğmesi yok`);
    await p.close();
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
