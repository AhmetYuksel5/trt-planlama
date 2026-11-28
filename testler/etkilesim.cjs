// Etkileşim ilkeleri (kullanıcı: örnek sayfadaki ilkeler uygulansın): "Bugün de geçerli"de satır nabız
// atar, kopyalayınca simge bulanık geçişle onaya döner, toplantıda seçili kalem öne çıkar ve verilen
// kararın rozeti sıçrar, yapay zekâ görüşü beklenirken iskelet, az hareket tercihinde animasyon yok.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
// Belgede bir an görünen işareti yakalamak için: gözlemci bulduğunu window'a yazar.
const izle = (p, secici) =>
  p.evaluate((s) => {
    window.__goruldu = false;
    const bak = () => document.querySelector(s) && (window.__goruldu = true);
    new MutationObserver(bak).observe(document.body, { subtree: true, childList: true, attributes: true });
  }, secici);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const gir = async (yol) => {
    await p.goto("about:blank");
    await p.goto(B + yol);
    await p.waitForTimeout(1000);
  };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await gir("#/nextday");

  // 1. Belgede "Bugün de geçerli": satır nabız atar.
  await gir("#/nextday/nd-yarin/belge");
  const bg = p.locator("[data-bugun-gecerli]").first();
  ok((await bg.count()) === 1, "belgede 'Bugün de geçerli' düğmesi");
  await izle(p, "[data-nabiz]");
  await bg.evaluate((e) => e.click()); // şeridin düğmesi yalnız üstüne gelince görünür
  await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__goruldu), "basılan satır nabız attı");

  // 2. Çıktıda kopyala: simge onaya geçer, sonra geri döner.
  await gir("#/nextday/nd-yarin/cikti");
  const kop = p.locator("[data-kopyala]").first();
  ok((await kop.locator("[data-simge-gecis='once']").count()) === 1, "kopyala simgesi başta pano");
  await kop.click();
  await p.waitForTimeout(300);
  ok((await kop.getAttribute("data-kopyala")) === "oldu" && (await kop.locator("[data-simge-gecis='sonra']").count()) === 1, "kopyalanınca onay simgesi");
  const gizli = await kop.locator(".simge-gecis > .gizli").evaluate((e) => getComputedStyle(e).filter);
  ok(gizli.includes("blur"), "giden simge bulanık: " + gizli);
  await p.waitForTimeout(1800);
  ok((await kop.locator("[data-simge-gecis='once']").count()) === 1, "bir süre sonra pano simgesine döndü");

  // 3. Toplantı: seçili kalem öne çıkar, karar rozeti sıçrar.
  await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.planlar.find((x) => x.id === "nd-yarin").durum = "toplantida";
    localStorage.setItem(k, JSON.stringify(d));
  }, K);
  await gir("#/nextday/nd-yarin/toplanti");
  const op = await p.locator("[data-toplanti-kalem]").evaluateAll((l) => l.map((e) => [e.classList.contains("secili"), +getComputedStyle(e).opacity]));
  ok(op.length >= 2 && op.some(([s, o]) => s && o === 1) && op.some(([s, o]) => !s && o < 0.8), "seçili kalem öne çıkıyor: " + JSON.stringify(op.slice(0, 3)));
  await izle(p, "[data-nabiz='sicra']");
  await p.keyboard.press("1");
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__goruldu), "kararın rozeti sıçradı");

  // 4. Yapay zekâ görüşü beklenirken iskelet.
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const o = d.oneriler.find((x) => x.muhabirId && ["yeni", "degerlendiriliyor"].includes(x.durum) && !(d.yzGorusleri ?? []).some((g) => g.oneriId === x.id));
  await gir("#/oneriler/" + o.id);
  const bolum = p.locator('[data-oneri-bolum="degerlendirme"]');
  await izle(p, "[data-yz-iskelet]");
  await bolum.locator("[data-yz-gorus-al]").click();
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__goruldu), "beklerken iskelet göründü");
  ok((await bolum.locator("[data-yz-iskelet]").count()) === 0 && (await bolum.locator("[data-yz-kanaat]").count()) === 1, "görüş gelince iskelet gitti");

  // 5. Az hareket: iskelet ve nabız animasyonsuz.
  await p.emulateMedia({ reducedMotion: "reduce" });
  const anim = await p.evaluate(() => {
    const e = document.createElement("span");
    e.className = "iskelet";
    e.setAttribute("data-nabiz", "");
    document.body.append(e);
    const a = getComputedStyle(e).animationName;
    e.remove();
    return a;
  });
  ok(anim === "none", "az hareket tercihinde animasyon yok: " + anim);

  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
