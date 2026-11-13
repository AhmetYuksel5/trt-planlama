// Organizasyon, 1. parti (üç yönetici ajanının brifingi, belgeler/organizasyon-brifing.md): kişi araması hemze,
// birim, ünvan ve şehirle buluyor, sonuç düz liste (O-01); Birimler'de birim ve ünvan araması (O-01); seçimde aynı
// adlı birim yoluyla (O-02); tayinde yönetici olmayan ilk ünvan, yöneticiye çıkışta onay, bildirimde "Geri al"
// (O-04); kökü gizlemek onaylı, taslağın ilk değişikliği bildiriliyor, taslak yokken "Yayında · sürüm" (O-03, O-09).
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 800 } });
  p.on("pageerror", (e) => console.log("HATA", String(e)));
  const sorular = [];
  let cevap = true;
  p.on("dialog", (x) => (sorular.push(x.message()), cevap ? x.accept() : x.dismiss()));
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await p.goto("about:blank");
  await p.goto(B + "#/organizasyon/kisiler");
  await p.waitForTimeout(800);
  const kayit = () => p.evaluate(() => JSON.parse(localStorage.getItem("trt-planlama-v24")));
  const sonuc = async (q) => {
    await p.fill("[data-org-ara]", q);
    await p.waitForTimeout(150);
    return p.locator("[data-org-sonuclar] [data-org-kisi]").count();
  };

  // Arama.
  const hemzeli = await sonuc("أحمد");
  ok(hemzeli > 0 && (await sonuc("احمد")) === hemzeli, `hemzesiz "احمد" hemzeliyle aynı (${hemzeli})`);
  ok((await sonuc("ahmet")) === (await sonuc("ahmed")), "Ahmet / Ahmed aynı");
  ok((await sonuc("dil denetmeni")) > 0, "ünvanla bulunuyor");
  ok((await p.locator("[data-org-kisi-yeri]").first().innerText()).includes("›"), "sonuçta birim › ünvan");
  ok((await sonuc("Kahire")) > 0, "şehirle bulunuyor");
  ok((await p.locator("[data-org-agac]").count()) === 0, "aramada ağaç yok, düz liste");
  await p.fill("[data-org-ara]", "");
  await p.waitForTimeout(150);
  ok((await p.locator("[data-org-agac]").count()) === 1, "arama boşken ağaç");

  // Tayin: Spor'a geçen dil denetmeni yönetici olmuyor; yönetici ünvanı onay soruyor; "Geri al" geri getiriyor.
  await sonuc("dil denetmeni");
  const kim = await p.locator("[data-org-sonuclar] [data-org-kisi]").first().getAttribute("data-org-kisi");
  const once = (await kayit()).kisiler.find((k) => k.id === kim);
  await p.locator(`[data-org-sonuclar] [data-tayin="${kim}"]`).click();
  await p.waitForTimeout(300);
  const secenekler = await p.evaluate(() => [...document.querySelectorAll("[data-pozisyon-birim] option")].map((o) => o.textContent.trim()));
  ok(secenekler.filter((x) => x === "Output").length === 0 && secenekler.some((x) => x.includes("› Output")), `aynı adlı birim yoluyla (${secenekler.filter((x) => x.includes("Output")).join(", ")})`);
  await p.selectOption("[data-pozisyon-birim]", "spor");
  await p.waitForTimeout(100);
  ok((await p.inputValue("[data-pozisyon-gorev]")) !== "yonetici", "birim değişince yönetici olmayan ünvan");
  await p.selectOption("[data-pozisyon-gorev]", "yonetici");
  cevap = false;
  await p.locator("dialog[open] [data-pozisyon-formu]").locator("xpath=ancestor::dialog").locator(".dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(300);
  ok(sorular.some((x) => x.includes("yönetici olacak")), "yöneticiye çıkışta onay soruluyor");
  ok((await kayit()).kisiler.find((k) => k.id === kim).birim === once.birim, "onay verilmeyince tayin yok");
  cevap = true;
  await p.locator("dialog[open] [data-pozisyon-formu]").locator("xpath=ancestor::dialog").locator(".dugme:not(.dugme-ikincil)").last().click();
  await p.waitForTimeout(400);
  const sonra = (await kayit()).kisiler.find((k) => k.id === kim);
  ok(sonra.birim === "spor" && sonra.rol === "yonetici", `tayin kaydedildi (${sonra.birim}, ${sonra.rol})`);
  const geri = p.getByRole("button", { name: "Geri al" });
  ok((await geri.count()) > 0, "bildirimde Geri al");
  await geri.first().click();
  await p.waitForTimeout(300);
  const geriAlindi = (await kayit()).kisiler.find((k) => k.id === kim);
  ok(geriAlindi.birim === once.birim && geriAlindi.gorev === once.gorev && geriAlindi.rol === once.rol, `geri alındı (${geriAlindi.birim}, ${geriAlindi.gorev}, ${geriAlindi.rol})`);

  // Birimler ve ünvanlar.
  await p.goto(B + "#/organizasyon/birimler");
  await p.waitForTimeout(700);
  ok((await p.locator("[data-yapi-yayinda]").count()) === 1, "taslak yokken yayında satırı");
  const hepsi = await p.locator("[data-birim-satiri]").count();
  await p.fill("[data-org-birim-ara]", "dil denetmeni");
  await p.waitForTimeout(150);
  const kalan = await p.locator("[data-birim-satiri]").count();
  ok(kalan > 0 && kalan < hepsi, `ünvan aramasında yalnız uyan birimler (${kalan}/${hepsi})`);
  ok((await p.locator("[data-unvan].eslesti").count()) > 0, "uyan ünvan vurgulu");
  await p.fill("[data-org-birim-ara]", "");
  await p.waitForTimeout(150);
  sorular.length = 0;
  cevap = false;
  const kok = p.locator("[data-birim-gizle]").first();
  await kok.click();
  await p.waitForTimeout(200);
  ok(sorular.length === 1, "kökü gizlemek onay soruyor");
  ok((await p.locator("[data-yapi-taslak]").count()) === 0, "onay verilmeyince taslak yok");
  cevap = true;
  await kok.click();
  await p.waitForTimeout(300);
  ok((await p.locator("[data-yapi-taslak]").count()) === 1, "onaylanınca taslakta");
  ok((await p.getByText("Taslağa eklendi").count()) > 0, "taslağın ilk değişikliği bildirildi");
  await kok.click();
  await p.waitForTimeout(300);

  // Telefonda Arapça: sonuç listesi taşmıyor.
  const c = await b.newContext({ ...devices["iPhone 13"] });
  const t = await c.newPage();
  await t.goto(B);
  await t.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", "ar"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await t.goto("about:blank");
  await t.goto(B + "#/organizasyon/kisiler");
  await t.waitForTimeout(800);
  await t.fill("[data-org-ara]", "احمد");
  await t.waitForTimeout(200);
  ok((await t.locator("[data-org-sonuclar] [data-org-kisi]").count()) > 0, "ar telefon: sonuç var");
  ok((await t.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, "ar telefon: taşma yok");
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
