// Çağrı listesi (kullanıcı: muhabirlere giden günlük ve haftalık çağrının BCC'si programdan
// güncellenebilsin): çağrı penceresinde seçim kalıcı yapılır, sonraki çağrı ve otomatik
// çağrının listesi onsuz açılır.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await p.goto("about:blank"); await p.goto(B + "#/oneriler/cagri"); await p.waitForTimeout(1200);
  const sayi = async () => Number((await p.locator(".alan-etiket").first().innerText()).match(/\d+/)[0]);
  const ilk = await sayi();
  ok(ilk > 1, "çağrının BCC'si dolu: " + ilk);
  await p.getByRole("button", { name: /Alıcıları düzenle|Alıcılar/ }).first().click();
  ok((await p.locator("[data-cagri-listesi-kaydet]").count()) === 0, "seçim değişmeden kalıcı yap düğmesi yok");
  const kutu = p.locator(".secim-grubu input[type=checkbox]:checked").first();
  await kutu.uncheck();
  ok((await sayi()) === ilk - 1, "bir muhabir çıkarıldı");
  await p.click("[data-cagri-listesi-kaydet]");
  await p.waitForTimeout(300);
  const d = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  ok((d.cagriDisi ?? []).length === 1, "kalıcı listeye yazıldı");
  // Yeni pencerede varsayılan liste onsuz.
  await p.goto("about:blank"); await p.goto(B + "#/oneriler/cagri"); await p.waitForTimeout(1000);
  ok((await sayi()) === ilk - 1, "sonraki çağrı onsuz açılıyor");
  await p.getByRole("button", { name: /Alıcıları düzenle|Alıcılar/ }).first().click();
  ok((await p.locator(".secim-cip", { hasText: "Listede değil" }).count()) === 1, "listede değil işareti");
  ok(hatalar.length === 0, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
