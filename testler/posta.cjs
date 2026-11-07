// Gelen posta sohbeti: yapıştırma ile sohbete düşme, alıntı ayıklama, konuya göre iplik, silme, muhabir görmez, 390px
const { chromium } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (x) => x.accept());
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(500); };
  const kim = async (id, dil = "tr") => { await p.goto(B); await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); }, [id, dil]); };
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());

  // Muhabir posta sayfasını görmez
  await kim("mu1");
  await git("#/");
  ok((await p.locator('a[href="#/posta"]').count()) === 0, "muhabirin menüsünde posta yok");
  await git("#/posta");
  ok((await p.locator("[data-posta-liste]").count()) === 0 && (await p.locator("[data-posta-kimden]").count()) === 0, "muhabir posta sayfasını açamıyor");

  // Planlamacı görür ve yapıştırarak ekler
  await kim("pl1");
  await git("#/");
  ok((await p.locator('a[href="#/posta"]').count()) >= 1, "planlamacının menüsünde posta");
  await git("#/posta");
  ok((await p.locator("[data-posta-kimden]").count()) === 1, "köprü açık");

  const metinli = "Yarın Gazze'den bir paket önerim var.\n\nOn Mon, 3 Nov 2026 at 10:00, Planlama <planning@trt.net.tr> wrote:\n> Önerilerinizi bekliyoruz";
  await p.locator("[data-posta-kimden]").fill("omar@ornek.local");
  await p.locator("[data-posta-konu]").fill("Gazze önerisi");
  await p.locator("[data-posta-metin]").fill(metinli);
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1, "yapıştırılan posta sohbete düştü");

  // Sohbeti aç: alıntı ayıklanmış, ekleniş metni görünür
  await p.locator("[data-posta-sohbet-bag]").first().click();
  await p.waitForTimeout(300);
  const govde = await p.locator("[data-posta-sohbet] [data-posta-mesaj]").first().innerText();
  ok(govde.includes("paket önerim var"), "yeni metin sohbette");
  ok(!govde.includes("wrote:") && !govde.includes("Önerilerinizi bekliyoruz"), "alıntı ayıklandı");

  // Aynı konunun yanıtı (RE:) aynı sohbete
  await p.locator("[data-posta-kimden]").fill("omar@ornek.local");
  await p.locator("[data-posta-konu]").fill("RE: Gazze önerisi");
  await p.locator("[data-posta-metin]").fill("Ek olarak canlı yayın da olabilir.");
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 1, "RE: yanıtı yeni sohbet açmadı, tek iplik");
  await p.locator("[data-posta-sohbet-bag]").first().click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === 2, "sohbette iki mesaj, zaman sırasıyla");

  // Buradan yanıt gönder (demoda yalnız ekrana giden balon)
  await p.locator("[data-posta-yaz]").fill("Teşekkürler, planladık.");
  await p.locator("[data-posta-gonder]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-sohbet] [data-posta-mesaj]").count()) === 3, "gönderilen yanıt sohbete eklendi");
  ok((await p.locator("[data-posta-sohbet] .posta-balon.giden").count()) === 1, "giden balon sağda");

  // Farklı konu ayrı sohbet
  await p.locator("[data-posta-kimden]").fill("selin@ornek.local");
  await p.locator("[data-posta-konu]").fill("Kudüs gelişmesi");
  await p.locator("[data-posta-metin]").fill("Bugün Kudüs'te gerginlik var.");
  await p.locator("[data-posta-isle]").click();
  await p.waitForTimeout(400);
  ok((await p.locator("[data-posta-liste] > li").count()) === 2, "farklı konu ayrı sohbet");

  // Tekillik: aynı Message-ID yoksa yapıştırmada mesaj kimliği yok, ama kayıt sayısı artar; silme izleriyle gider
  const once = (await veri()).postaMesajlari.length;
  ok(once === 4, "dört mesaj kayıtlı (2 Gazze + 1 giden + 1 Kudüs): " + once);
  await p.locator('[data-posta-sohbet-bag]').first().click();
  await p.waitForTimeout(200);
  await p.locator('.posta-duzen .kart').last().locator('button[title]').click();
  await p.waitForTimeout(400);
  const sonra = (await veri()).postaMesajlari.length;
  ok(sonra < once, "sohbet izleriyle silindi: " + once + " → " + sonra);

  // 390px: yatay taşma yok (Türkçe ve Arapça)
  for (const d of ["tr", "ar"]) {
    await kim("pl1", d);
    await p.setViewportSize({ width: 390, height: 840 });
    await git("#/posta");
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 1, "390px taşma yok (" + d + "): " + tasma);
  }
  await p.setViewportSize({ width: 1440, height: 1000 });

  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
