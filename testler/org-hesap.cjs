// Hesaplar sekmesi Kişiler'e katıldı: sekme yok, eski adresler Kişiler'i açar, hesabı olmayan kişi soluk tonda.
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
    const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(600); };
    await p.goto(B);
    await p.evaluate(() => localStorage.clear());
    await p.goto(B);
    await p.evaluate((d) => { localStorage.setItem("trt-planlama-oturum", "yo3"); localStorage.setItem("trt-planlama-dil", d); }, dil);
    await git("#/organizasyon/kisiler");
    // Bir kişiyi hesapsız yap (demoda Excel'den gelmiş gibi).
    const kimlik = await p.evaluate(() => {
      const v = JSON.parse(localStorage.getItem("trt-planlama-v25"));
      const k = v.kisiler.find((x) => x.birim === "planlama" && x.id !== "yo3");
      k.hesapsiz = true;
      localStorage.setItem("trt-planlama-v25", JSON.stringify(v));
      localStorage.setItem("trt-planlama-v25-iz", String(Date.now()));
      return k.id;
    });
    await git("#/organizasyon/kisiler");
    ok((await p.locator('[data-org-sekme="hesaplar"]').count()) === 0, `${dil}: Hesaplar sekmesi yok`);
    ok((await p.locator('[data-org-sekme="kisiler"][aria-selected="true"]').count()) === 1, `${dil}: Kişiler açık`);
    await p.locator(`[data-org-birim="planlama"] > summary`).click().catch(() => {});
    await p.waitForTimeout(200);
    const sinif = await p.locator(`[data-org-kisi="${kimlik}"]`).first().getAttribute("class");
    ok((sinif ?? "").includes("hesap-yok"), `${dil}: hesabı olmayan kişi soluk tonda (${sinif})`);
    ok((await p.locator(`[data-org-kisi="${kimlik}"] [data-hesap-durumu="yok"]`).count()) >= 1, `${dil}: "Hesabı yok" rozeti`);
    await git("#/organizasyon/hesaplar");
    ok((await p.locator('[data-org-sekme="kisiler"][aria-selected="true"]').count()) === 1, `${dil}: eski Hesaplar adresi Kişiler'i açar`);
    await git("#/kullanicilar");
    ok((await p.locator('[data-org-sekme="kisiler"][aria-selected="true"]').count()) === 1, `${dil}: eski Kullanıcılar adresi Kişiler'i açar`);
    // Demoda hesap işleri yok (davet edilecek gerçek hesap yok): satırda hesap menüsü ve "Kişi ekle" çizilmez.
    ok((await p.locator("[data-kisi-ekle-ac]").count()) === 0, `${dil}: demoda Kişi ekle yok`);
    const tasma = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(tasma <= 0, `${dil}: ${gen} pikselde taşma yok (${tasma})`);
    await p.close();
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
