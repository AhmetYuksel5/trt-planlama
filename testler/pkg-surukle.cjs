// PKG sürükle-bırak (kullanıcı): gelişmenin altına ve geri, başlığın PKG bölümüne; belgede ve klasik plan ekranında.
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
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1000); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-nd-gorunum", "klasik"); });
  await git("#/nextday/nd-yarin/belge");
  let d = await veri();
  const plan = d.planlar.find((x) => x.id === "nd-yarin");
  // Başlık düzeyinde paketi ve gelişmesi olan bir başlık.
  let pb, pk, g;
  for (const b0 of plan.basliklar) {
    const gs = d.gelismeler.filter((x) => x.planBaslikId === b0.id);
    const ps = d.paketler.filter((x) => x.planBaslikId === b0.id && x.durum !== "iptal" && !x.gelismeId);
    if (gs.length && ps.length) { pb = b0; pk = ps[0]; g = gs[0]; break; }
  }
  ok(!!pk, "başlık düzeyinde paketi ve gelişmesi olan başlık var");

  // Belge: gelişmenin altına
  await p.locator(`[data-pkg-surukle="${pk.id}"]`).first().dragTo(p.locator(`[data-pkg-hedef="${g.id}"]`).first());
  await p.waitForTimeout(400);
  d = await veri();
  ok(d.paketler.find((x) => x.id === pk.id).gelismeId === g.id, "belgede gelişmenin altına taşındı");
  ok((await p.locator(`[data-pkg-hedef="${g.id}"] [data-pkg-surukle="${pk.id}"]`).count()) === 1, "satır gelişmenin altında çizildi");

  // Belge: geri, başlığın PKG bölümüne (başlığın satırına bırakılır)
  await p.locator(`[data-pkg-surukle="${pk.id}"]`).first().dragTo(p.locator(`[data-nd-baslik="${pb.id}"] h3`).first());
  await p.waitForTimeout(400);
  d = await veri();
  ok(!d.paketler.find((x) => x.id === pk.id).gelismeId, "belgede başlığın PKG bölümüne döndü");

  // Klasik plan ekranı
  await git("#/nextday/nd-yarin");
  const kart = p.locator(`details[data-plan-baslik="${pb.id}"]`);
  await p.evaluate(() => document.querySelectorAll("details:not([open])").forEach((d) => (d.open = true)));
  await p.waitForTimeout(300);
  await kart.locator(`[data-pkg-surukle="${pk.id}"]`).dragTo(kart.locator(`[data-gelisme="${g.id}"]`));
  await p.waitForTimeout(400);
  d = await veri();
  ok(d.paketler.find((x) => x.id === pk.id).gelismeId === g.id, "klasik ekranda gelişmenin altına taşındı");
  ok((await kart.locator(`.gelisme-alti [data-pkg-surukle="${pk.id}"]`).count()) === 1, "klasikte gelişmenin altında görünüyor");
  await kart.locator(`[data-pkg-surukle="${pk.id}"]`).dragTo(kart.locator(`[data-pkg-bolum="${pb.id}"] h4`));
  await p.waitForTimeout(400);
  d = await veri();
  ok(!d.paketler.find((x) => x.id === pk.id).gelismeId, "klasikte başlığın PKG bölümüne döndü");
  ok(d.planlar.find((x) => x.id === "nd-yarin").basliklar.map((x) => x.id).join() === plan.basliklar.map((x) => x.id).join(), "başlıkların sırası değişmedi");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
