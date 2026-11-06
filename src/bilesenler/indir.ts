/** Tarayıcıda dosya indirme: sunucu olmadan Outlook taslağı ve rapor dosyası için. */
export const indir = (ad: string, icerik: string, tur: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icerik], { type: tur }));
  a.download = ad;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

/*
 * Word dosyası HTML tabanlı: Word ve Google Docs biçimiyle açıyor. Ekran
 * CSS'i dosyaya gitmediği için belgenin kendi biçimi burada; renkler
 * kurumun belgesindeki kırmızı, yeşil ve sarı vurgu. Next Day ve haftalık
 * plan aynı biçimi kullanıyor.
 */
// Ekrandaki çıktıyla aynı aralık: satırlar 1,15, başlıklar arası 1,30 satır (13pt × 1,15 × 1,3 ≈ 19pt).
const WORD_BICIMI = `
body { font-family: Calibri, Arial, sans-serif; font-size: 13pt; line-height: 115%; direction: rtl; text-align: right; }
h1 { font-size: 16pt; line-height: 115%; text-align: center; color: #c00000; margin: 0; }
h2 { font-size: 14pt; line-height: 115%; margin: 19pt 0 0; }
h2.yesil { color: #4f7a28; } h2.kirmizi { color: #c00000; } h2.ortali { text-align: center; }
h3 { font-size: 13pt; line-height: 115%; text-decoration: underline; margin: 19pt 0 0; } h3.yesil { color: #4f7a28; text-decoration: none; }
h4.gun { font-size: 13pt; line-height: 115%; color: #c00000; margin: 19pt 0 0; }
p { margin: 0; line-height: 115%; }
.alt-baslik { font-weight: bold; }
.cikti-aciklama { color: #333333; }
.cikti-slug { font-size: 11pt; }
mark { background: #ffff00; }
`;

/** Belgenin HTML'inden Word (.doc) dosyası: her zaman Arapça ve sağdan sola. */
export const wordIndir = (ad: string, baslik: string, govde: string) => {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${baslik}</title><style>${WORD_BICIMI}</style></head><body dir="rtl" lang="ar">${govde}</body></html>`;
  indir(ad, "﻿" + html, "application/msword");
};

/*
 * E-postaya yapıştırılan kopya. Outlook ve Gmail sayfanın stil dosyasını almıyor,
 * yalnız öğenin üstüne yazılmış (satır içi) stili tutuyor; "Metni kopyala" düz
 * metin koyuyordu, sayfadan seçip kopyalayınca da biçim bozuluyordu (planlamacılar
 * Word'e indirip oradan kopyalıyordu: Word stili satır içine yazıyor). Burada aynı
 * Word biçimi her öğenin style'ına yazılır, panoya HTML ve düz metin birlikte konur.
 */
const EPOSTA_STILI: [string, string][] = [
  ["h1", "font-size:16pt;line-height:115%;text-align:center;color:#c00000;margin:0;font-weight:bold"],
  ["h2", "font-size:14pt;line-height:115%;margin:19pt 0 0;font-weight:bold"],
  ["h2.yesil", "color:#4f7a28"],
  ["h2.kirmizi", "color:#c00000"],
  ["h2.ortali", "text-align:center"],
  ["h3", "font-size:13pt;line-height:115%;text-decoration:underline;margin:19pt 0 0;font-weight:bold"],
  ["h3.yesil", "color:#4f7a28;text-decoration:none"],
  ["h4.gun", "font-size:13pt;line-height:115%;color:#c00000;margin:19pt 0 0;font-weight:bold"],
  ["p", "margin:0;line-height:115%"],
  [".alt-baslik", "font-weight:bold"],
  [".cikti-aciklama", "color:#333333"],
  [".cikti-slug", "font-size:11pt"],
  ["mark", "background:#ffff00"],
];
const GOVDE_STILI = "font-family:Calibri,Arial,sans-serif;font-size:13pt;line-height:115%;direction:rtl;text-align:right;color:#000000";

export const epostaHtml = (govde: string): string => {
  const belge = new DOMParser().parseFromString(`<div>${govde}</div>`, "text/html");
  const kok = belge.body.firstElementChild as HTMLElement;
  // Ekrana ait düğme ve şeritler kopyaya girmesin.
  kok.querySelectorAll("button, [aria-hidden='true'], .yazdirma-gizle").forEach((x) => x.remove());
  for (const [secici, stil] of EPOSTA_STILI) kok.querySelectorAll<HTMLElement>(secici).forEach((x) => x.setAttribute("style", `${x.getAttribute("style") ?? ""};${stil}`));
  kok.querySelectorAll<HTMLElement>("h1, h2, h3, h4, p, div, section, article").forEach((x) => {
    x.setAttribute("dir", "rtl");
    if (!/text-align/.test(x.getAttribute("style") ?? "")) x.setAttribute("style", `${x.getAttribute("style") ?? ""};text-align:right`);
  });
  kok.querySelectorAll("*").forEach((x) => {
    [...x.attributes].forEach((a) => (a.name === "class" || a.name.startsWith("data-")) && x.removeAttribute(a.name));
  });
  return `<div dir="rtl" lang="ar" style="${GOVDE_STILI}">${kok.innerHTML}</div>`;
};

/** Panoya biçimli kopya: önce Clipboard API (HTML + düz metin), olmazsa seçip kopyalama. */
export const zenginKopyala = async (html: string, metin: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([metin], { type: "text/plain" }) })]);
      return true;
    }
  } catch {
    /* izin yok ya da desteklenmiyor: seçerek kopyala */
  }
  const kap = document.createElement("div");
  kap.setAttribute("contenteditable", "true");
  kap.style.cssText = "position:fixed;inset-block-start:0;inset-inline-start:-9999px;opacity:0;";
  kap.innerHTML = html;
  document.body.appendChild(kap);
  const aralik = document.createRange();
  aralik.selectNodeContents(kap);
  const secim = getSelection();
  secim?.removeAllRanges();
  secim?.addRange(aralik);
  let oldu = false;
  try {
    oldu = document.execCommand("copy");
  } finally {
    secim?.removeAllRanges();
    kap.remove();
  }
  return oldu;
};
