// E-postayla gelen öneride muhabire posta (kullanıcı: yeni posta değil, muhabirin gönderdiği postaya yanıt):
// kime postayı gönderen adres, konu "RE: …", giden balon o postanın sohbetinde. E-postasız öneride yeni posta.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));
(async () => {
  const b = await chromium.launch();
  const hatalar = [];
  for (const [dil, gen] of [["tr", 1400], ["ar", 390]]) {
    const p = await b.newPage({ viewport: { width: gen, height: 900 } });
    p.on("pageerror", (e) => hatalar.push(String(e)));
    p.on("dialog", (x) => x.accept());
    const veri = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
    const git = async (yol) => { await p.goto("about:blank"); await p.goto(B + yol); await p.waitForTimeout(900); };
    await p.goto(B);
    await p.evaluate((d) => { localStorage.clear(); localStorage.setItem("trt-planlama-dil", d); localStorage.setItem("trt-planlama-oturum", "pl2"); }, dil);
    await git("#/oneriler");
    // E-postayla gelmiş bir öneri; postası Posta'da da olsun (sohbetine yanıt düşsün).
    const kur = await p.evaluate((k) => {
      const d = JSON.parse(localStorage.getItem(k));
      const o = d.oneriler.find((x) => x.yanitId && d.yanitlar.find((y) => y.id === x.yanitId)?.mesajKimligi);
      const y = d.yanitlar.find((x) => x.id === o.yanitId);
      d.postaMesajlari = d.postaMesajlari ?? [];
      d.postaMesajlari.push({ id: "pm-test-yanit", konuKimligi: "sohbet-test-yanit", kimden: y.kimden, konu: y.konu, metin: "اقتراح", tamMetin: "اقتراح", zaman: y.zaman, mesajKimligi: y.mesajKimligi, ekler: [], kaynak: "posta" });
      const duz = d.oneriler.find((x) => !x.yanitId && x.muhabirId && !x.talimatVeren);
      localStorage.setItem(k, JSON.stringify(d));
      localStorage.setItem(k + "-iz", String(Date.now()));
      return { id: o.id, kimden: y.kimden.toLowerCase(), konu: y.konu, duz: duz?.id };
    }, K);
    await git(`#/oneriler/${kur.id}`);
    const dugme = p.locator('[data-is-postasi="yanit"]').first();
    ok((await dugme.count()) === 1, `${dil}: e-postalı önerinin posta düğmesi yanıt`);
    await dugme.click();
    await p.waitForTimeout(300);
    const konu = await p.locator("[data-posta-yeni-konu]").inputValue();
    ok(/^RE: /.test(konu) && konu.includes(kur.konu.replace(/^\s*(re|ynt|aw|رد)\s*:\s*/i, "").trim()), `${dil}: konu "RE: …" (${konu})`);
    await p.locator("[data-posta-yeni-metin]").fill("شكرا على الاقتراح");
    await p.locator("[data-posta-yeni-gonder]").click();
    await p.waitForTimeout(500);
    const d = await veri();
    const giden = d.postaMesajlari.find((m) => m.giden && m.metin === "شكرا على الاقتراح");
    ok(!!giden && giden.konuKimligi === "sohbet-test-yanit", `${dil}: giden balon muhabirin postasının sohbetinde`);
    ok(!!giden && (giden.kime ?? []).map((x) => x.toLowerCase()).includes(kur.kimden), `${dil}: kime postayı gönderen adres`);
    if (kur.duz) {
      await git(`#/oneriler/${kur.duz}`);
      ok((await p.locator('[data-is-postasi="yanit"]').count()) === 0 && (await p.locator("[data-is-postasi]").count()) > 0, `${dil}: e-postasız öneride yeni posta`);
    }
    await p.close();
  }
  ok(!hatalar.length, "sayfa hatası yok " + hatalar.join(" | "));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
