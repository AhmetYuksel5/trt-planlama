// Weekly'de günün kendi "PKG ekle"si ve dosyasız grubun "PKG ekle"si (kullanıcı: gün gün
// planda başlığın altına metinsiz başka paket ekleyemiyordu: düğme yalnız dolu dosya grubundaydı).
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1200); };
  const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-tasarim", "eski"); });
  await git("#/haftalik");
  const ids = await p.evaluate((k) => {
    const d = JSON.parse(localStorage.getItem(k));
    const h = d.haftalik[0];
    h.durum = "hazirlik";
    const gun = h.baslangic;
    h.kalemler = [{ id: "dz-1", karar: "bekliyor", tarih: gun, tur: "haber", yer: "", metin: "خبر بلا ملف", bicimler: ["pkg"], muhabirler: [] }];
    const baslik = d.basliklar.find((x) => x.aktif !== false) || d.basliklar[0];
    h.dosyalar = [...new Set([...(h.dosyalar || []), baslik.id])];
    localStorage.setItem(k, JSON.stringify(d));
    localStorage.setItem(k + "-iz", String(Date.now()));
    return { hid: h.id, gun, baslikId: baslik.id };
  }, K);
  await git("#/haftalik/" + ids.hid);
  await p.evaluate(() => document.querySelectorAll("main details").forEach((x) => (x.open = true)));

  // Günün "PKG ekle"si: dosya seçilir, metinsiz kaydedilir
  await p.locator(`[data-gun-pkg-ekle="${ids.gun}"] button`).first().click();
  let form = p.locator(".gun-blogu .form-kutu").first();
  await form.locator("[data-kalem-dosya]").selectOption(ids.baslikId);
  await form.locator("[data-kalem-strap]").fill("تقرير اليوم");
  await form.locator("button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  let h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  const k1 = h.kalemler.find((k) => k.paketBasligi === "تقرير اليوم");
  ok(k1 && !k1.metin && k1.tarih === ids.gun && k1.baslikId === ids.baslikId, "günden metinsiz PKG, seçilen dosyada");

  // Dosyasız grubun altında da
  const grup = p.locator(".dosya-grubu", { has: p.locator("[data-kalem='dz-1']") });
  await grup.locator("[data-dosya-pkg-ekle] button").click();
  form = grup.locator(".form-kutu");
  await form.locator("[data-kalem-strap]").fill("تقرير بلا ملف");
  await form.locator("button", { hasText: "Kaydet" }).click();
  await p.waitForTimeout(400);
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  const k2 = h.kalemler.find((k) => k.paketBasligi === "تقرير بلا ملف");
  ok(k2 && !k2.metin && !k2.baslikId && k2.tarih === ids.gun, "dosyasız grupta metinsiz PKG");

  // Günün "Kalem ekle" formunda da Strap yeter
  await p.locator(`section.gun-blogu[data-hf-gun="${ids.gun}"] .ekle-yanyana button`, { hasText: "Kalem ekle" }).first().click().catch(() => {});
  form = p.locator(".gun-blogu .form-kutu").first();
  if (await form.count()) {
    await form.locator("[data-kalem-strap]").fill("تقرير ثالث");
    ok(!(await form.locator("button", { hasText: "Kaydet" }).isDisabled()), "kalem formunda Strap yeterli");
    await form.locator("button", { hasText: "Vazgeç" }).click().catch(() => {});
  } else ok(false, "kalem formu açılmadı");

  // Belgede günün ekleme çubuğunda
  await git(`#/haftalik/${ids.hid}/belge`);
  const d = p.locator(`[data-gun-pkg-ekle="${ids.gun}"] button`).first();
  ok((await d.count()) === 1, "belgede günün PKG ekle düğmesi");
  await d.evaluate((el) => el.click());
  await p.waitForTimeout(300);
  const pen = p.locator("dialog[open]");
  await pen.locator("[data-kalem-dosya]").selectOption(ids.baslikId);
  await pen.locator("[data-kalem-strap]").fill("تقرير من الوثيقة");
  await pen.locator(".form-alt button.dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  h = (await oku()).haftalik.find((x) => x.id === ids.hid);
  ok(h.kalemler.some((k) => k.paketBasligi === "تقرير من الوثيقة" && !k.metin && k.baslikId === ids.baslikId), "belgeden metinsiz PKG");

  ok(hatalar.length === 0, "sayfa hatası yok: " + hatalar.join(" | "));
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
