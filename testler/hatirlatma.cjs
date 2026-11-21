// Weekly ⋯ › "Hatırlatma": haftalık çağrının altına iri, kalın, kırmızı "تذكير"; konu çağrınınki "RE:" ile (HP-
// etiketi yerinde, yanıtı öneriye düşer), alıcılar çağrının BCC'si. Demoda posta gitmez, hatırlatma kayda yazılır.
// Kesinleşmiş haftada ve çağrısı olmayan haftada düğme yok. 390 pikselde pencere taşmaz.
const { chromium } = require(process.env.PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  p.on("dialog", (d) => d.accept());
  const B = "http://localhost:4173/";
  const K = "trt-planlama-v25";
  let gec = 0;
  let kal = 0;
  const ok = (k, ad) => (k ? (gec++, console.log("✓", ad)) : (kal++, console.log("✗", ad)));
  const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const menu = async () => {
    await p.locator(".plan-basi [aria-haspopup]").last().click();
    await p.waitForTimeout(150);
  };
  await p.goto(B);
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("trt-planlama-oturum", "pl1");
    localStorage.setItem("trt-planlama-dil", "tr");
  });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik");
  await p.waitForTimeout(1200);
  const { hid, bas } = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik[0];
    h.durum = "hazirlik";
    d.cagrilar = d.cagrilar.filter((c) => !c.etiket.startsWith("HP-"));
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, bas: h.baslangic };
  }, K);
  const etiket = "HP-" + bas.replace(/-/g, "");

  // Çağrı yokken düğme yok
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1000);
  await menu();
  ok((await p.locator('[data-arac="hatirlatma"]').count()) === 0, "çağrı yokken hatırlatma yok");
  await p.keyboard.press("Escape");

  // Çağrı kaydedilmiş hafta
  const muhabirSayisi = await p.evaluate(
    ([k, et, tarih]) => {
      const d = JSON.parse(localStorage.getItem(k));
      const ms = d.kisiler.filter((x) => x.birim === "muhabir" && (x.eposta || x.kurumEposta)).slice(0, 3).map((x) => x.id);
      d.cagrilar.unshift({ id: "c-hatirlatma", tur: "haftalik", tarih, metin: "نص الطلب الأسبوعي", sonSaat: "", olusturan: "pl1", zaman: new Date().toISOString(), kime: "planning@ornek.local", bcc: ms, etiket: et });
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
      return ms.length;
    },
    [K, etiket, bas],
  );
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1000);
  await menu();
  ok((await p.locator('[data-arac="hatirlatma"]').count()) === 1, "çağrısı olan hazırlıktaki haftada ⋯ › Hatırlatma");
  await p.locator('[data-arac="hatirlatma"]').click();
  await p.waitForTimeout(400);
  const pencere = p.locator("dialog[open]");
  ok((await pencere.locator("[data-hatirlatma]").count()) === 1, "hatırlatma penceresi açıldı");
  const ust = await pencere.innerText();
  ok(ust.includes("RE:") && ust.includes(etiket), "konu çağrınınki RE: ile, etiket yerinde: " + etiket);
  const baslik = pencere.locator(".hatirlatma-baslik");
  ok((await baslik.innerText()).trim() === "تذكير", "önizlemede تذكير");
  const stil = await baslik.evaluate((e) => { const c = getComputedStyle(e); return { renk: c.color, kalin: Number(c.fontWeight), boy: parseFloat(c.fontSize) }; });
  ok(stil.kalin >= 700 && stil.boy >= 28 && /^rgb\((1[5-9]\d|2\d\d), \d{1,2}, \d{1,2}/.test(stil.renk), "başlık iri, kalın, kırmızı: " + JSON.stringify(stil));
  ok(ust.includes(String(muhabirSayisi)), "alıcı sayısı çağrının BCC'si: " + muhabirSayisi);
  await pencere.locator("[data-hatirlatma-not]").fill("نرجو إرسال المقترحات قبل الخميس");
  ok((await pencere.locator("[data-hatirlatma-onizleme]").innerText()).includes("نرجو إرسال"), "not önizlemede");
  await pencere.locator("[data-hatirlatma-gonder]").click();
  await p.waitForTimeout(500);
  const c = (await veri()).cagrilar.find((x) => x.id === "c-hatirlatma");
  ok(c.hatirlatmalar?.length === 1 && c.hatirlatmalar[0].alici === muhabirSayisi && c.hatirlatmalar[0].kisiId === "pl1", "hatırlatma kayda yazıldı (demoda posta gitmez)");
  ok((await p.locator("dialog[open] [data-hatirlatma]").count()) === 0, "gönderince pencere kapandı");
  await menu();
  ok((await p.locator('[data-arac="hatirlatma"] .dugme-sayi').innerText()).trim() === "1", "menüde hatırlatma sayısı");
  await p.locator('[data-arac="hatirlatma"]').click();
  await p.waitForTimeout(300);
  ok((await p.locator("dialog[open] [data-hatirlatma-onceki] li").count()) === 1, "önceki hatırlatmalar listede");

  // 390 piksel, Arapça
  await p.evaluate(() => localStorage.setItem("trt-planlama-dil", "ar"));
  await p.setViewportSize({ width: 390, height: 840 });
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1000);
  await menu();
  await p.locator('[data-arac="hatirlatma"]').click();
  await p.waitForTimeout(400);
  const tasma = await p.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? g.scrollWidth - g.clientWidth : -1; });
  ok(tasma >= 0 && tasma <= 1, "390 pikselde pencere taşmıyor (ar): " + tasma);
  await p.keyboard.press("Escape");

  // Kesinleşmiş haftada yok
  await p.evaluate(([k, id]) => {
    const d = JSON.parse(localStorage.getItem(k));
    d.haftalik.find((h) => h.id === id).durum = "kesinlesti";
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
  }, [K, hid]);
  await p.goto("about:blank");
  await p.goto(B + "#/haftalik/" + hid);
  await p.waitForTimeout(1000);
  await menu();
  ok((await p.locator('[data-arac="hatirlatma"]').count()) === 0, "kesinleşmiş haftada hatırlatma yok");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
