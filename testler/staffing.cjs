// Staffing postasından Next Day ekibi: kurgusal posta (ornek.ts → staffingOrnegi) yarının planına şerit, önizleme, ekibe yazış.
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const hatalar = [];
  for (const [dil, gen] of [["tr", 1440], ["ar", 390]]) {
    const p = await b.newPage({ viewport: { width: gen, height: 900 } });
    p.on("pageerror", (e) => hatalar.push(String(e)));
    const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v25")));
    await p.goto(B);
    await p.evaluate(() => localStorage.clear());
    await p.goto(B);
    await p.evaluate((d) => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-dil", d); }, dil);
    await p.goto("about:blank");
    await p.goto(B + "#/nextday/nd-yarin");
    await p.waitForTimeout(800);
    ok((await p.locator("[data-staffing-seridi]").count()) === 1, `${dil}: yarının planında staffing şeridi`);
    // Postası olmayan eski demo kaydı (özellikten önce kurulmuş): açılış işi postayı ekliyor.
    await p.evaluate(() => {
      const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
      v.postaMesajlari = v.postaMesajlari.filter((m) => !m.id.startsWith("pm-staffing"));
      localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
      localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
    });
    await p.goto("about:blank");
    await p.goto(B + "#/nextday/nd-yarin");
    await p.waitForTimeout(1500);
    ok((await p.locator("[data-staffing-seridi]").count()) === 1, `${dil}: eski demo kaydında da şerit (postayı açılış işi ekliyor)`);
    await p.goto("about:blank");
    await p.goto(B + "#/nextday/nd-bugun");
    await p.waitForTimeout(500);
    ok((await p.locator("[data-staffing-seridi]").count()) === 0, `${dil}: başka günün planında şerit yok`);
    await p.goto("about:blank");
    await p.goto(B + "#/nextday/nd-yarin");
    await p.waitForTimeout(600);
    await p.locator("[data-staffing-ac]").click();
    await p.waitForTimeout(400);
    const gorevler = await p.locator("[data-staffing-gorev]").evaluateAll((l) => l.map((x) => x.dataset.staffingGorev));
    ok(["sunucu", "yapimciSef", "bultenYapimcisi", "tercuman", "muhabirMasasi"].every((g) => gorevler.includes(g)), `${dil}: postadaki görevler önizlemede (${gorevler})`);
    ok(!gorevler.some((g) => !["sunucu", "yapimciSef", "bultenYapimcisi", "tercuman", "muhabirMasasi"].includes(g)), `${dil}: eşlemesi olmayan grup (Output Producer) girmiyor`);
    const satirlar = await p.locator("[data-staffing-satir]").count();
    ok(satirlar === 6, `${dil}: program satırı ve izinli (OFF) girmiyor, 6 satır (${satirlar})`);
    ok((await p.locator('[data-staffing-satir][data-eslesti="0"]').count()) === 1, `${dil}: kayıtta olmayan ad eşleşmiyor`);
    ok((await p.locator('[data-staffing-satir][data-eslesti="0"] input[type=checkbox]').isDisabled()), `${dil}: eşleşmeyen satır işaretlenemiyor`);
    const tasma = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, ...[...document.querySelectorAll("dialog[open]")].map((d) => d.scrollWidth - d.clientWidth + document.documentElement.clientWidth)) - document.documentElement.clientWidth);
    ok(tasma <= 0, `${dil}: ${gen} pikselde taşma yok (${tasma})`);
    await p.locator("[data-staffing-yaz]").click();
    await p.waitForTimeout(500);
    const plan = (await veri()).planlar.find((x) => x.id === "nd-yarin");
    const uye = (id) => plan.ekip.find((e) => e.kisiId === id);
    ok(uye("pr6")?.gorev === "sunucu" && uye("pr6")?.vardiya === "03:00", `${dil}: sunucu GMT vardiyayla (06.00 İstanbul → 03G)`);
    ok(uye("nd1")?.gorev === "yapimciSef" && uye("nd1")?.vardiya === "04:00", `${dil}: EP yapım şefi 04G`);
    ok(uye("nd4")?.gorev === "bultenYapimcisi" && uye("ou6")?.gorev === "tercuman" && uye("pl3")?.gorev === "muhabirMasasi", `${dil}: PE, tercüman, planlama yerinde`);
    ok(!uye("pl2") && !uye("ou1"), `${dil}: OFF ve eşlemesiz grup ekipte yok`);
    ok(plan.ekip.filter((e) => e.gorev === "sunucu").length === 1, `${dil}: postadaki görevin eski ekibi değişti`);
    ok(plan.staffingPosta?.startsWith("pm-staffing-"), `${dil}: posta işaretlendi`);
    ok((await p.locator("[data-staffing-seridi]").count()) === 0, `${dil}: yazınca şerit kalkıyor`);
    await p.close();
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
