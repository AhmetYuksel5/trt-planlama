// Paketsiz plana giren öneri (kullanıcı: "Plana eklendi" yazıyordu ama paket olmadığı belli değildi): notta
// ve rozette "Gelişme olarak · paketsiz"; Planlama'nın listesinde, öneri sayfasında ve muhabirin ekranında.
// Paketli giren öneride yazmaz.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/", K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(1300); };
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); });
  await git("#/oneriler");
  const adaylar = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)).oneriler.filter((x) => x.muhabirId && x.durum === "yeni" && !x.talimatVeren && x.bicim !== "canli" && !x.takipTuru && !x.hafta).map((x) => ({ id: x.id, m: x.muhabirId })), K);
  const [a, c] = adaylar;
  const ekle = async (id, paketli) => {
    await git("#/oneriler/" + id);
    await p.locator("[data-oneri-alt] button", { hasText: "Plana ekle" }).first().click();
    await p.waitForTimeout(500);
    for (const cb of await p.locator("[data-oneri-mod] input[type=checkbox]").all()) {
      const t = await cb.evaluate((x) => x.closest("label")?.innerText ?? "");
      if (/Paket önerisi/.test(t) && (await cb.isChecked()) !== paketli) await (paketli ? cb.check() : cb.uncheck());
    }
    await p.locator("[data-oneri-mod] button.dugme:not(.dugme-ikincil)").last().click();
    await p.waitForTimeout(700);
  };
  await ekle(a.id, false);
  await ekle(c.id, true);
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  ok(d.oneriler.find((x) => x.id === a.id).durum === "planaEklendi" && !d.paketler.some((x) => x.oneriId === a.id), "öneri paketsiz plana girdi");
  ok(d.paketler.some((x) => x.oneriId === c.id && x.durum !== "iptal"), "öbürü paketle girdi");

  await git("#/oneriler/" + a.id);
  ok((await p.locator("[data-paketsiz]").count()) > 0, "öneri sayfasında 'gelişme olarak · paketsiz'");
  await git("#/oneriler/" + c.id);
  ok((await p.locator("[data-paketsiz], [data-oneri-paketsiz]").count()) === 0, "paketli öneride yazmıyor");
  await git("#/oneriler");
  await p.locator("button", { hasText: "Planda" }).first().click();
  await p.waitForTimeout(500);
  ok((await p.locator(`[data-oneri="${a.id}"] [data-paketsiz]`).count()) === 1, "Planda sekmesinin kartında");
  ok((await p.locator(`[data-oneri="${c.id}"] [data-paketsiz]`).count()) === 0, "paketli kartta yok");

  await p.evaluate((m) => localStorage.setItem("trt-planlama-oturum", m), a.m);
  await git("#/oneriler/" + a.id);
  ok((await p.locator("[data-paketsiz], [data-oneri-paketsiz]").count()) > 0, "muhabirin öneri sayfasında");
  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
