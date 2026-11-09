// Eğitim videolarının ortak kayıt düzeni: telefon boyu, demo kaydı, sayfanın üstüne
// alt yazı, başlık kartı ve dokunma halkası çizilir (sessiz video; anlatım alt yazıda).
// Kayıt Chrome'un ekran yayınıyla (CDP screencast): kareler cihazın 2 kat çözünürlüğünde
// gelir. Playwright'ın kendi video kaydı sayfayı CSS boyunda çiziyordu, büyütünce bulanıktı.
// Kareler zaman damgasıyla diske, video ffmpeg ile kurulur (bitir()).
// Çalıştırma: önizleme açıkken (npx vite preview --port 4173) node video1.cjs <çıktı klasörü>
const { chromium } = require(process.env.PW || "playwright");
const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ADRES = process.env.ADRES || "http://localhost:4173/";
const EN = 390, BOY = 844;

// Sayfaya eklenen katman: kayıtta yalnız görüntü, uygulamaya dokunmuyor.
const KATMAN = () => {
  const kur = () => {
    if (document.getElementById("egt-stil")) return;
    const s = document.createElement("style");
    s.id = "egt-stil";
    s.textContent = `
      .demo-serit, [data-demo-serit] { display: none !important; }
      #egt-alt, #egt-kart, .egt-halka { margin: 0; border: 0; padding: 0; overflow: visible; }
      #egt-alt { position: fixed; inset: auto 14px 98px 14px; width: auto; height: auto; z-index: 2147483646; background: rgba(15, 30, 61, .92); color: #fff;
        font: 600 17px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 12px 16px; border-radius: 14px; text-align: center;
        box-shadow: 0 6px 24px rgba(0,0,0,.25); opacity: 0; transform: translateY(8px); transition: opacity .35s, transform .35s; pointer-events: none; }
      #egt-alt.acik { opacity: 1; transform: none; }
      #egt-kart { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 2147483647; background: #0f1e3d; color: #fff; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 14px; padding: 32px; text-align: center; opacity: 0; transition: opacity .45s; pointer-events: none;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      #egt-kart.acik { opacity: 1; }
      #egt-kart small { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: #7dd3c0; font-weight: 700; }
      #egt-kart b { font-size: 30px; line-height: 1.25; }
      #egt-kart span { font-size: 17px; color: #cbd5e1; }
      .egt-halka { position: fixed; z-index: 2147483645; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
        border: 4px solid #f59e0b !important; background: rgba(245, 158, 11, .18); pointer-events: none; animation: egt-halka .7s ease-out forwards; }
      @keyframes egt-halka { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
    `;
    document.head.appendChild(s);
    // Katmanlar popover: uygulamanın pencereleri (<dialog>) tarayıcının üst katmanında
    // açılıyor, z-index ne olursa olsun alt yazıyı örtüyordu. Pencere açılınca öne alınır.
    const alt = document.createElement("div");
    alt.id = "egt-alt";
    const kart = document.createElement("div");
    kart.id = "egt-kart";
    for (const e of [alt, kart]) e.setAttribute("popover", "manual");
    document.body.append(alt, kart);
    one();
    new MutationObserver(() => one()).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  };
  const one = () => {
    for (const id of ["egt-alt", "egt-kart"]) {
      const e = document.getElementById(id);
      if (!e) continue;
      if (e.matches(":popover-open")) e.hidePopover();
      e.showPopover();
    }
  };
  window.__egt = {
    alt(metin) {
      kur();
      const e = document.getElementById("egt-alt");
      if (!metin) return e.classList.remove("acik");
      e.textContent = metin;
      e.classList.add("acik");
    },
    kart(ust, baslik, alt) {
      kur();
      const e = document.getElementById("egt-kart");
      if (!baslik) return e.classList.remove("acik");
      e.innerHTML = "";
      for (const [etiket, yazi] of [["small", ust], ["b", baslik], ["span", alt]]) {
        if (!yazi) continue;
        const x = document.createElement(etiket);
        x.textContent = yazi;
        e.appendChild(x);
      }
      e.classList.add("acik");
    },
  };
  document.addEventListener("pointerdown", (e) => {
    const h = document.createElement("div");
    h.className = "egt-halka";
    h.setAttribute("popover", "manual");
    h.style.left = e.clientX + "px";
    h.style.top = e.clientY + "px";
    document.body.appendChild(h);
    h.showPopover();
    setTimeout(() => h.remove(), 800);
  }, true);
  document.addEventListener("DOMContentLoaded", kur);
};

async function baslat(klasor) {
  fs.mkdirSync(klasor, { recursive: true });
  const tarayici = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const baglam = await tarayici.newContext({
    viewport: { width: EN, height: BOY },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await baglam.addInitScript(KATMAN);
  const p = await baglam.newPage();
  // Demo planlamacıyla, Türkçe, örnek kayıtla açılır.
  await p.goto(ADRES);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem("trt-planlama-oturum", "pl1"); localStorage.setItem("trt-planlama-dil", "tr"); });
  await p.goto("about:blank");
  await p.goto(ADRES + "#/");
  await p.waitForTimeout(1500);
  const bekle = (sn) => p.waitForTimeout(sn * 1000);
  let cdp, kareKlasoru;
  const kareler = [];
  const v = {
    p,
    bekle,
    // Kayıt burada başlar: kurulum anları videoya girmez.
    async basla() {
      kareKlasoru = fs.mkdtempSync(path.join(klasor, "kareler-"));
      cdp = await baglam.newCDPSession(p);
      cdp.on("Page.screencastFrame", async (k) => {
        const ad = path.join(kareKlasoru, `${String(kareler.length).padStart(6, "0")}.jpg`);
        fs.writeFileSync(ad, Buffer.from(k.data, "base64"));
        kareler.push({ ad, zaman: k.metadata.timestamp });
        await cdp.send("Page.screencastFrameAck", { sessionId: k.sessionId }).catch(() => {});
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: EN * 2, maxHeight: BOY * 2, everyNthFrame: 1 });
    },
    alt: (metin) => p.evaluate((m) => window.__egt.alt(m), metin),
    kart: (ust, baslik, alt) => p.evaluate(([a, b, c]) => window.__egt.kart(a, b, c), [ust, baslik, alt]),
    // Parmak yerine fare: hedefe yavaşça gidip dokunur (halka pointerdown'da çizilir).
    async dokun(hedef, sonra = 0.6) {
      await v.goster(hedef);
      const k = await hedef.boundingBox();
      await p.mouse.move(k.x + k.width / 2, k.y + k.height / 2, { steps: 14 });
      await bekle(0.25);
      await hedef.click();
      await bekle(sonra);
    },
    // Hedef üst ve alt çubukların arasında değilse yumuşakça ortaya kaydırır (ani atlama izleyeni şaşırtıyor).
    async goster(hedef) {
      const k = await hedef.boundingBox();
      if (k && k.y > 70 && k.y + k.height < BOY - 100) return;
      await hedef.evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" }));
      await bekle(0.9);
    },
    async kaydir(y) {
      await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: "smooth" }), y);
      await bekle(0.9);
    },
    async yaz(hedef, metin) {
      await hedef.click();
      await hedef.pressSequentially(metin, { delay: 160 });
    },
  };
  v.bitir = async (ad) => {
    const son = Date.now() / 1000;
    await cdp.send("Page.stopScreencast");
    await baglam.close();
    await tarayici.close();
    // Yayın yalnız ekran değişince kare gönderiyor: her kare bir sonrakine kadar ekranda kalır.
    const liste = kareler.map((k, i) => `file '${k.ad}'\nduration ${(((kareler[i + 1]?.zaman ?? son) - k.zaman) || 0.04).toFixed(3)}`);
    liste.push(`file '${kareler[kareler.length - 1].ad}'`);
    const listeYolu = path.join(kareKlasoru, "liste.txt");
    fs.writeFileSync(listeYolu, liste.join("\n"));
    const cikti = path.join(klasor, `${ad}.mp4`);
    // 9:16 (1080×1920): sayfa yüksekliğe sığdırılır, kenarlar lacivert.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listeYolu,
      "-vf", "scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:color=0x0f1e3d,fps=30",
      "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", cikti]);
    fs.rmSync(kareKlasoru, { recursive: true, force: true });
    return cikti;
  };
  return v;
}

module.exports = { baslat };
