// Asistan (belgeler/asistan.md): sahte modelle uçtan uca. Okuma aracı hemen çalışır; yazma aracı önce
// sorulur, kişi "evet" yazınca yapılır, "hayır" yazınca yapılmaz; gezinme aracı sayfayı açar; kısıtlı
// kişide (muhabir) asistan yok. Sahte model (window.__asistanModeli) konuşmanın son iletisine bakıp
// sıradaki aracı ister: gerçek kapının ve sağlayıcının yerinde.
const { chromium } = require(process.env.PW || "playwright");
const B = "http://localhost:4173/";
const K = "trt-planlama-v25";
let gec = 0, kal = 0;
const ok = (k, m) => (k ? (gec++, console.log("✓ " + m)) : (kal++, console.log("✗ " + m)));

const SAHTE = () => {
  window.__asistanModeli = async (mesajlar) => {
    const son = mesajlar[mesajlar.length - 1];
    const ilk = mesajlar.filter((m) => m.role === "user" && typeof m.content === "string").pop()?.content ?? "";
    const sonuc = Array.isArray(son.content) ? son.content.find((b) => b.type === "tool_result") : null;
    const veri = sonuc ? JSON.parse(sonuc.content) : null;
    const arac = (name, input) => ({ icerik: [{ type: "tool_use", id: "t" + Math.random().toString(36).slice(2), name, input }] });
    if (ilk.includes("gelişme")) {
      if (!sonuc) return arac("planOzeti", {});
      if (veri.planId && veri.basliklar) return arac("gelismeEkle", { planId: veri.planId, planBaslikId: veri.basliklar[0].planBaslikId, metin: "تطور تجريبي من المساعد" });
      return { icerik: [{ type: "text", text: veri.tamam ? "Eklendi." : "Eklenmedi." }] };
    }
    if (ilk.includes("reddet")) {
      if (!sonuc) return arac("onerileriListele", { sekme: "karar" });
      if (veri.oneriler) return arac("oneriReddet", { oneriId: veri.oneriler[0].id, gerekce: "تجربة" });
      return { icerik: [{ type: "text", text: veri.vazgecti ? "Peki, reddetmedim." : "Reddedildi." }] };
    }
    if (ilk.includes("öneriler sayfası")) {
      if (!sonuc) return arac("sayfaAc", { yol: "#/oneriler" });
      return { icerik: [{ type: "text", text: "Açtım." }] };
    }
    return { icerik: [{ type: "text", text: "Anlamadım." }] };
  };
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(SAHTE);
  const hatalar = [];
  p.on("pageerror", (e) => hatalar.push(String(e)));
  const git = async (h) => { await p.goto("about:blank"); await p.goto(B + h); await p.waitForTimeout(1100); };
  const durum = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), K);
  const yaz = async (m) => { await p.fill("[data-asistan-yazi]", m); await p.press("[data-asistan-yazi]", "Enter"); await p.waitForTimeout(500); };

  await p.goto(B);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem("trt-planlama-dil", "tr"); localStorage.setItem("trt-planlama-oturum", "pl2"); });
  await git("#/");
  ok((await p.locator("[data-asistan-ac]").count()) === 1, "yüzen asistan düğmesi");
  await p.keyboard.press("Control+KeyJ");
  ok((await p.locator("[data-asistan-panel]").count()) === 1, "Ctrl+J paneli açıyor");

  // Yazma: sorulur, "evet" ile yapılır.
  const once = (await durum()).gelismeler.length;
  await yaz("yarının planına bir gelişme ekle");
  ok((await p.locator('[data-asistan-ileti="onay"][data-durum="bekliyor"]').count()) === 1, "yazma işi önce soruluyor");
  ok((await durum()).gelismeler.length === once, "onaysız yazılmadı");
  await yaz("evet");
  const d1 = await durum();
  ok(d1.gelismeler.length === once + 1 && d1.gelismeler.some((g) => g.metin === "تطور تجريبي من المساعد"), "\"evet\" ile gelişme eklendi");
  ok((await p.locator('[data-asistan-ileti="onay"][data-durum="yapildi"]').count()) === 1, "onay kartı yapıldı");
  ok((await p.locator('[data-asistan-ileti="asistan"]').last().innerText()).includes("Eklendi"), "asistan sonucu söyledi");

  // "hayır": yapılmaz.
  const kararda = (await durum()).oneriler.filter((o) => o.durum === "reddedildi").length;
  await yaz("karar bekleyen ilk öneriyi reddet");
  ok((await p.locator('[data-asistan-ileti="onay"][data-durum="bekliyor"]').count()) === 1, "ret soruldu");
  await yaz("hayır");
  ok((await durum()).oneriler.filter((o) => o.durum === "reddedildi").length === kararda, "\"hayır\" ile reddedilmedi");
  ok((await p.locator('[data-asistan-ileti="asistan"]').last().innerText()).includes("reddetmedim"), "vazgeçildiği modele gitti");

  // Gezinme.
  await yaz("öneriler sayfası");
  ok(p.url().endsWith("#/oneriler"), "sayfaAc öneriler sayfasını açtı");

  // Konuşma sekmede kalır; temizlenir.
  await git("#/");
  await p.keyboard.press("Control+KeyJ");
  ok((await p.locator("[data-asistan-ileti]").count()) > 0, "konuşma yeniden yüklemede duruyor");
  await p.click("[data-asistan-temizle]");
  ok((await p.locator("[data-asistan-ileti]").count()) === 0, "konuşma temizlendi");

  // Kısıtlı kişi: asistan yok.
  await p.evaluate(() => localStorage.setItem("trt-planlama-oturum", "mu1"));
  await git("#/");
  ok((await p.locator("[data-asistan-ac]").count()) === 0, "muhabirde asistan yok");

  ok(hatalar.length === 0, "sayfa hatası yok" + (hatalar.length ? ": " + hatalar.join(" | ") : ""));
  console.log(`\n${gec} geçti, ${kal} kaldı`);
  await b.close();
  process.exit(kal ? 1 : 0);
})();
