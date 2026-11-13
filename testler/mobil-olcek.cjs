// Mobil denetimin 3. adımı (yeni tasarım): telefonda yazı ölçeği (gövde 15, 12 pikselin altında yazı yok;
// avatar harfi 11), puntolar rem (tarayıcının yazı büyütmesi uyar), dokunmatikte hedefler en az 24 piksel ve
// düğmeler 44 (yatay telefon da), Organizasyon'da kişinin satırı dokunma alanı, avatar nötr; taşma yok.
const { chromium, devices } = require(process.env.PW);
const B = "http://localhost:4173/";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? gec++ : (kal++, console.log("✗ " + m)));
const SAYFALAR = [["pl2", ["#/", "#/oneriler", "#/nextday/yarin", "#/haftalik", "#/posta", "#/muhabirler", "#/ayarlar"]], ["mu1", ["#/oneriler", "#/oneriler/yeni", "#/takipler"]], ["yo3", ["#/organizasyon/kisiler"]], ["pr1", ["#/programlar/icerikler"]]];
(async () => {
  const b = await chromium.launch();
  for (const dil of ["tr", "ar"]) {
    const c = await b.newContext({ ...devices["iPhone 13"] });
    const p = await c.newPage();
    p.on("pageerror", (e) => console.log("HATA", String(e)));
    for (const [kim, yollar] of SAYFALAR) {
      await p.goto(B);
      await p.evaluate(([k, d]) => { localStorage.setItem("trt-planlama-oturum", k); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-tasarim", "yeni"); }, [kim, dil]);
      for (const y of yollar) {
        await p.goto("about:blank");
        await p.goto(B + y);
        await p.waitForTimeout(800);
        await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
        const r = await p.evaluate(() => {
          const kucuk = [];
          for (const e of document.querySelectorAll("a[href], button, input, select, textarea, summary")) {
            const b = e.getBoundingClientRect();
            if (!b.width || !b.height || getComputedStyle(e).visibility === "hidden" || e.classList.contains("tarih-gizli")) continue;
            if (e.tagName === "A" && e.closest("p")) continue; // paragraf içindeki bağlantı istisna
            if (e.closest("li[data-org-kisi]") && e.tagName === "A") continue; // dokunma alanı satır, aşağıda ayrıca
            if (b.width < 24 || b.height < 24) kucuk.push(`${e.tagName}.${String(e.className).split(" ")[0]} ${Math.round(b.width)}x${Math.round(b.height)}`);
          }
          const yazi = [];
          for (const e of document.querySelectorAll("main *")) {
            if (e.closest(".avatar") || ![...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())) continue;
            const f = parseFloat(getComputedStyle(e).fontSize);
            if (f < 11.9) yazi.push(`${e.tagName}.${String(e.className).split(" ")[0]} ${f}`);
          }
          return { kucuk, yazi, tasma: document.documentElement.scrollWidth - innerWidth };
        });
        ok(!r.kucuk.length, `${kim} ${dil} ${y}: 24 pikselden küçük hedef ${r.kucuk.slice(0, 4).join(", ")}`);
        ok(!r.yazi.length, `${kim} ${dil} ${y}: 12 pikselden küçük yazı ${r.yazi.slice(0, 4).join(", ")}`);
        ok(r.tasma <= 0, `${kim} ${dil} ${y}: taşma ${r.tasma}`);
      }
    }
    // Gövde 15, avatar nötr.
    await p.goto(B);
    await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "pl2"));
    await p.goto("about:blank");
    await p.goto(B + "#/muhabirler");
    await p.waitForTimeout(800);
    ok((await p.evaluate(() => getComputedStyle(document.body).fontSize)) === "15px", `${dil}: telefonda gövde 15 piksel`);
    const av = await p.locator("main .avatar").first().evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color]);
    ok(av[0] === "rgb(234, 236, 240)", `${dil}: avatar nötr (${av[0]})`);
    // Organizasyon: satıra basınca kişinin sayfası.
    await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "yo3"));
    await p.goto("about:blank");
    await p.goto(B + "#/organizasyon/kisiler");
    await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelectorAll("main details").forEach((d) => (d.open = true)));
    const li = p.locator("li[data-org-kisi]").first();
    const kimlik = await li.getAttribute("data-org-kisi");
    const lb = await li.boundingBox();
    ok(lb.height >= 44, `${dil}: Organizasyon kişi satırı ${Math.round(lb.height)} piksel`);
    // Avatarın üstüne bas: bağlantının kendisi değil, satırın dokunma alanı (düğmeler kendi işini yapar).
    const avb = await li.locator(".avatar").boundingBox();
    await p.mouse.click(avb.x + avb.width / 2, avb.y + avb.height / 2);
    await p.waitForTimeout(500);
    ok(p.url().endsWith(`#/personel/${kimlik}`), `${dil}: satıra basınca kişinin sayfası (${p.url().split("#")[1]})`);
    await c.close();
  }

  // Puntolar rem: kök yazı büyüyünce arayüz yazısı da büyür.
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(B);
  await p.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-tasarim", "yeni"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank");
  await p.goto(B + "#/oneriler");
  await p.waitForTimeout(800);
  const once = await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  await p.evaluate(() => (document.documentElement.style.fontSize = "125%"));
  const sonra = await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  ok(sonra > once * 1.2, `yazı büyütmeye uyuyor (${once} → ${sonra})`);
  await p.close();

  // Yatay telefon (dokunmatik, tablet düzeni): düğmeler ve onay kutuları dokunmaya uygun.
  const c = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const y = await c.newPage();
  await y.goto(B);
  await y.evaluate(() => { localStorage.setItem("trt-planlama-oturum", "pl2"); localStorage.setItem("trt-planlama-tasarim", "yeni"); });
  await y.goto("about:blank");
  await y.goto(B + "#/nextday/yarin");
  await y.waitForTimeout(900);
  const dugmeler = await y.evaluate(() => [...document.querySelectorAll("main .dugme")].filter((e) => e.getBoundingClientRect().height).map((e) => e.getBoundingClientRect().height));
  ok(dugmeler.length && Math.min(...dugmeler) >= 43.5, `yatay telefonda düğmeler en az 44 (${Math.min(...dugmeler)})`);
  await c.close();
  await b.close();
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  process.exit(kal ? 1 : 0);
})();
