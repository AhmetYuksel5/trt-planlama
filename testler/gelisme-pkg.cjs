// Gelişmeye bağlı PKG (kullanıcı: başlık genel kalıyor, altında daha özel konular var; PKG başlığın en altında değil o
// gelişmenin hemen altında görünsün). Plan ekranında gelişmenin satırından eklenir, gelişmenin altında çizilir; çıktıda ve
// belgede gelişme paragrafının hemen ardından "PKG PROPOSAL"; gelişme silinince paket başlığın PKG'sine iner.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const ac = () => p.locator("details:not([open]) > summary").evaluateAll((s) => s.forEach((x) => x.click()));
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  await git("#/nextday/yarin"); await ac(); await p.waitForTimeout(300);

  // Birden çok gelişmesi olan bir başlığın ilk gelişmesi
  const d0 = await veri();
  const planId = await p.evaluate(() => location.hash.split("/")[2]);
  const plan = d0.planlar.find((x) => x.id === planId) || d0.planlar.find((x) => x.durum === "taslak");
  const pb = plan.basliklar.find((x) => d0.gelismeler.filter((g) => g.planBaslikId === x.id).length >= 2);
  const g = d0.gelismeler.filter((x) => x.planBaslikId === pb.id)[0];
  ok(!!g, "iki gelişmeli başlık bulundu");

  // 1. Gelişmenin satırından PKG ekle: form gelişme seçili açılıyor
  await p.locator(`[data-gelisme="${g.id}"]`).getByRole("button", { name: "Bu gelişmeye PKG ekle" }).click(); await p.waitForTimeout(300);
  const f = p.locator(".gelisme-alti .form-kutu").first();
  ok((await f.locator("[data-paket-gelisme]").inputValue()) === g.id, "formda gelişme seçili");
  await f.locator("input").first().fill("تقرير خاص بالتطور");
  await f.getByRole("button", { name: /^Kaydet$/ }).click(); await p.waitForTimeout(500);
  let d = await veri();
  const pk = d.paketler.find((x) => x.baslik === "تقرير خاص بالتطور");
  ok(pk && pk.gelismeId === g.id && pk.planBaslikId === pb.id, "paket gelişmeye ve başlığa bağlı");
  await ac();
  ok((await p.locator(".gelisme-alti", { hasText: "تقرير خاص بالتطور" }).count()) === 1, "plan ekranında gelişmenin altında");

  // 2. Çıktıda ve belgede gelişme paragrafının hemen ardından
  for (const yol of [`#/nextday/${plan.id}/cikti`, `#/nextday/${plan.id}/belge`]) {
    await git(yol);
    const sira = await p.evaluate(([gm, strap]) => {
      const art = document.querySelector("article.cikti");
      const t = art.innerText;
      const gi = t.indexOf(gm.slice(0, 25)), si = t.indexOf(strap, gi);
      const ara = gi >= 0 && si > gi ? t.slice(gi, si) : "";
      return { gi, si, araPkg: /PKG PROPOSAL/.test(ara), sonrakiGelisme: ara.split("\n").length };
    }, [g.metin, "تقرير خاص بالتطور"]);
    ok(sira.gi >= 0 && sira.si > sira.gi && sira.araPkg && sira.sonrakiGelisme < 8, `${yol}: PKG gelişmenin hemen ardından (${JSON.stringify(sira)})`);
    ok((await p.locator("[data-gelisme-pkg]").count()) >= 1, `${yol}: gelişmenin PKG alt başlığı`);
  }

  // 3. Paket formunda yer başlığa alınabiliyor
  await git(`#/nextday/${plan.id}`); await ac(); await p.waitForTimeout(300);
  const satir = p.locator(".gelisme-alti .kayit", { hasText: "تقرير خاص بالتطور" }).first();
  await satir.getByRole("button", { name: "Düzenle" }).first().click(); await p.waitForTimeout(300);
  await p.locator(".gelisme-alti [data-paket-gelisme]").selectOption("");
  await p.locator(".gelisme-alti .form-kutu").getByRole("button", { name: /^Kaydet$/ }).click(); await p.waitForTimeout(500);
  d = await veri();
  ok(!d.paketler.find((x) => x.id === pk.id).gelismeId, "formdan başlığın PKG'sine alındı");
  await ac();
  ok((await p.locator(".gelisme-alti", { hasText: "تقرير خاص بالتطور" }).count()) === 0, "artık gelişmenin altında değil");

  // 4. Gelişme silinince paket kalır, başlığın PKG'sine iner
  await p.evaluate(([pid, gid]) => {
    const k = "trt-planlama-v25", d = JSON.parse(localStorage.getItem(k));
    d.paketler.find((x) => x.id === pid).gelismeId = gid;
    localStorage.setItem(k, JSON.stringify(d)); localStorage.setItem(k + "-iz", String(Date.now()));
  }, [pk.id, g.id]);
  await git(`#/nextday/${plan.id}`); await ac(); await p.waitForTimeout(300);
  await p.locator(`[data-gelisme="${g.id}"]`).getByRole("button", { name: "Sil" }).click(); await p.waitForTimeout(500);
  d = await veri();
  const pk2 = d.paketler.find((x) => x.id === pk.id);
  ok(pk2 && !pk2.gelismeId && pk2.planBaslikId === pb.id && !d.gelismeler.some((x) => x.id === g.id), "gelişme silindi, paket başlıkta kaldı");

  // 5. 390 pikselde taşma yok
  for (const dil of ["tr", "ar"]) {
    await p.setViewportSize({ width: 390, height: 840 });
    await p.evaluate((x) => localStorage.setItem("trt-planlama-dil", x), dil);
    await git(`#/nextday/${plan.id}`); await ac(); await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(t <= 1, `390px taşma yok (${dil}): ${t}`);
  }
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
