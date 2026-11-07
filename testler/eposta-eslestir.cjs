// E-posta listesiyle eşleştirme: yapıştır, eşleştir, önizle, seç, kaydet; adresler kişiye yazılır. Kurgusal adresler.
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
  const veri = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  await p.goto(B);
  await p.evaluate(() => localStorage.clear());
  await p.goto(B);
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
  await git("#/muhabirler");
  // Örnek veri kendini kurdu; üç muhabirin e-posta alanlarını boşalt (Excel'den adressiz gelmiş gibi).
  const v0 = await veri();
  const muh = v0.kisiler.filter((k) => k.birim === "muhabir").slice(0, 3);
  await p.evaluate((ids) => {
    const v = JSON.parse(localStorage.getItem("trt-planlama-v24"));
    v.kisiler = v.kisiler.map((k) => (ids.includes(k.id) ? { ...k, eposta: "", kisiselEposta: undefined } : k));
    localStorage.setItem("trt-planlama-v24", JSON.stringify(v));
    localStorage.setItem("trt-planlama-v24-iz", String(Date.now()));
  }, muh.map((k) => k.id));
  await git("#/muhabirler");
  const tr = (k) => (typeof k.ad === "string" ? k.ad : k.ad.tr);
  const nokta = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z]+/g, ".");
  const bitisik = (s) => nokta(s).replace(/\./g, "");
  const a1 = nokta(tr(muh[0])) + "@kurgu.example";
  const a2 = bitisik(tr(muh[1])) + "77@kurgu.example";
  const a3 = nokta(tr(muh[0])) + "2@kurgu.example"; // aynı kişinin ikinci adresi → kişisel
  const kayitli = v0.kisiler.find((k) => k.eposta && !muh.some((m) => m.id === k.id)).eposta;
  ok((await p.locator("[data-eposta-eslestir]").count()) === 1, "Dış muhabirler sayfasında eşleştir düğmesi");
  await p.locator("[data-eposta-eslestir]").click();
  await p.waitForTimeout(200);
  ok(await p.locator("[data-eslestir-dugme]").isDisabled(), "adressiz metinde eşleştir pasif");
  await p.locator("[data-eslestir-metin]").fill(`${a1}, ${a2}; ${a3}\n${kayitli}, kimse.yok@kurgu.example`);
  await p.locator("[data-eslestir-dugme]").click();
  await p.waitForTimeout(200);
  ok((await p.locator("[data-eslestir-satir]").count()) === 5, "beş satır önizlemede");
  const kisiDegeri = (a) => p.locator(`[data-eslestir-satir="${a.toLowerCase()}"] [data-eslestir-kisi]`).inputValue();
  ok((await kisiDegeri(a1)) === muh[0].id, "noktalı adres doğru muhabire");
  ok((await kisiDegeri(a2)) === muh[1].id, "bitişik, rakamlı adres doğru muhabire");
  ok((await p.locator(`[data-eslestir-satir="${a3}"] [data-eslestir-alan]`).inputValue()) === "kisiselEposta", "aynı kişinin ikinci adresi kişisel alana");
  ok((await p.locator(`[data-eslestir-satir="${kayitli.toLowerCase()}"]`).innerText()).length > 0 && (await p.locator(`[data-eslestir-satir="${kayitli.toLowerCase()}"] [data-eslestir-sec]`).count()) === 0, "kayıtlı adres seçilemez");
  ok(!(await p.locator('[data-eslestir-satir="kimse.yok@kurgu.example"] [data-eslestir-sec]').isChecked()), "bulunamayan işaretsiz");
  // Bulunamayana elle kişi seç: işaretlenir
  await p.locator('[data-eslestir-satir="kimse.yok@kurgu.example"] [data-eslestir-kisi]').selectOption(muh[2].id);
  ok(await p.locator('[data-eslestir-satir="kimse.yok@kurgu.example"] [data-eslestir-sec]').isChecked(), "elle kişi seçilince işaretlendi");
  ok((await p.locator("[data-eslestir-kaydet]").innerText()).includes("4"), "dört adres kaydedilecek");
  await p.locator("[data-eslestir-kaydet]").click();
  await p.waitForTimeout(400);
  const v1 = await veri();
  const k = (id) => v1.kisiler.find((x) => x.id === id);
  ok(k(muh[0].id).eposta === a1 && k(muh[0].id).kisiselEposta === a3, "birinci muhabire kurumsal ve kişisel yazıldı");
  ok(k(muh[1].id).eposta === a2, "ikinci muhabire kurumsal yazıldı");
  ok(k(muh[2].id).eposta === "kimse.yok@kurgu.example", "elle seçilen kişiye yazıldı");
  ok((await p.locator("dialog[open]").count()) === 0, "pencere kapandı");
  // 390px taşma
  await p.setViewportSize({ width: 390, height: 840 });
  await p.locator("[data-eposta-eslestir]").click();
  await p.locator("[data-eslestir-metin]").fill(`${a1}, yeni.biri@kurgu.example`);
  await p.locator("[data-eslestir-dugme]").click();
  await p.waitForTimeout(200);
  const tasma = await p.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? g.scrollWidth - g.clientWidth : -1; });
  ok(tasma >= 0 && tasma <= 1, "390px pencere taşmıyor: " + tasma);
  ok(hatalar.length === 0, "konsol hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
