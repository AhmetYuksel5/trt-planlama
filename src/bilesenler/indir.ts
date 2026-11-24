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
/*
 * Satırlar 1,15. Başlıklar (bölüm, haber başlığı, gün) arasında tek boş satır
 * (kullanıcı: satır aralığı artırılarak değil, birer boş satırla; Word'de
 * açılınca araya bir Enter basılmış gibi): `bosSatirlaAyir` başlıkların önüne
 * boş paragraf koyar, başlığın kendi üst boşluğu yok.
 */
const WORD_BICIMI = `
body { font-family: Calibri, Arial, sans-serif; font-size: 13pt; line-height: 115%; direction: rtl; text-align: right; }
h1 { font-size: 16pt; line-height: 115%; text-align: center; color: #c00000; margin: 0; }
h2 { font-size: 14pt; line-height: 115%; margin: 0; }
h2.yesil { color: #4f7a28; } h2.kirmizi { color: #c00000; } h2.ortali { text-align: center; }
h3 { font-size: 13pt; line-height: 115%; text-decoration: underline; margin: 0; } h3.yesil { color: #4f7a28; text-decoration: none; }
h4.gun { font-size: 13pt; line-height: 115%; color: #c00000; margin: 0; }
p { margin: 0; line-height: 115%; }
.alt-baslik { font-weight: bold; }
.cikti-aciklama { color: #333333; }
.cikti-slug { font-size: 11pt; }
.cikti-pkg-not { font-style: italic; padding-right: 18pt; }
mark { background: #ffff00; }
`;

/*
 * Başlıkların (h2, h3, h4) önüne boş paragraf: belgenin ilk satırı değilse.
 * Word ve e-posta istemcisi onu gerçek boş satır olarak açar.
 */
const BOS_SATIR = "<p class=\"bos-satir\">&nbsp;</p>";
const bosSatirlaAyir = (kok: Element) => {
  const ilk = kok.querySelector("h1, h2, h3, h4, p");
  kok.querySelectorAll("h2, h3, h4").forEach((h) => {
    if (h !== ilk) h.insertAdjacentHTML("beforebegin", BOS_SATIR);
  });
};
const bosSatirli = (govde: string) => {
  const kok = new DOMParser().parseFromString(`<div>${govde}</div>`, "text/html").body.firstElementChild as HTMLElement;
  bosSatirlaAyir(kok);
  return kok.innerHTML;
};

/** Belgenin HTML'inden Word (.doc) dosyası: her zaman Arapça ve sağdan sola. */
export const wordIndir = (ad: string, baslik: string, govde_: string) => {
  const govde = bosSatirli(govde_);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${baslik}</title><style>${WORD_BICIMI}</style></head><body dir="rtl" lang="ar">${govde}</body></html>`;
  indir(ad, "﻿" + html, "application/msword");
};

/*
 * E-postaya yapıştırılan kopya. Outlook ve Gmail sayfanın stil dosyasını almıyor,
 * yalnız öğenin üstüne yazılmış (satır içi) stili tutuyor. Biçim Word dosyasınınki
 * (`WORD_BICIMI`, tek kaynak; önce elle tutulan ikinci bir listeydi): belge o
 * biçimle görünmez bir çerçevede çizilir, her öğenin hesaplanmış biçimi kendi
 * style'ına yazılır. Yazı tipi ve punto her paragrafta (kullanıcı: yapıştırınca
 * boyut ve biçim değişiyordu: yalnız dış kutuda olduğu için Outlook paragraflara
 * kendi varsayılanını, başlıklara mavi "Başlık" stilini veriyordu). Başlıklar
 * aynı biçimle paragrafa, Outlook'un tanımadığı bdi ve mark span'e çevrilir.
 */
const YAZI_TIPI = "Calibri,Arial,sans-serif";
const BLOK = new Set(["H1", "H2", "H3", "H4", "P", "DIV", "SECTION", "ARTICLE", "UL", "OL", "LI", "TABLE", "TD", "TH"]);
const pt = (px: string) => `${Math.round(parseFloat(px) * 7.5) / 10}pt`;
const hex = (renk: string) => {
  const m = renk.match(/\d+(\.\d+)?/g);
  if (!m || (m.length > 3 && Number(m[3]) === 0)) return "";
  return "#" + m.slice(0, 3).map((x) => Math.round(Number(x)).toString(16).padStart(2, "0")).join("");
};
const kalin = (agirlik: string) => (Number(agirlik) >= 600 || agirlik === "bold" ? "bold" : "normal");

const blokStili = (c: CSSStyleDeclaration) => {
  const l = [
    `font-family:${YAZI_TIPI}`,
    `font-size:${pt(c.fontSize)}`,
    `font-weight:${kalin(c.fontWeight)}`,
    `font-style:${c.fontStyle === "italic" ? "italic" : "normal"}`,
    `text-decoration:${c.textDecorationLine.includes("underline") ? "underline" : "none"}`,
    `color:${hex(c.color) || "#000000"}`,
    `text-align:${c.textAlign === "center" ? "center" : c.textAlign === "left" ? "left" : "right"}`,
    "line-height:115%",
    "margin:0",
    "direction:rtl",
  ];
  const zemin = hex(c.backgroundColor);
  if (zemin) l.push(`background:${zemin}`);
  if (parseFloat(c.paddingRight) > 0) l.push(`padding-right:${pt(c.paddingRight)}`);
  if (parseFloat(c.paddingLeft) > 0) l.push(`padding-left:${pt(c.paddingLeft)}`);
  return l.join(";");
};
// Satır içi öğede yalnız üstünden farklı olan: kalın, eğik, altı çizili, renk, punto, vurgu.
const satirIciStili = (c: CSSStyleDeclaration, u: CSSStyleDeclaration) => {
  const l: string[] = [];
  if (kalin(c.fontWeight) !== kalin(u.fontWeight)) l.push(`font-weight:${kalin(c.fontWeight)}`);
  if (c.fontStyle !== u.fontStyle) l.push(`font-style:${c.fontStyle === "italic" ? "italic" : "normal"}`);
  if (c.textDecorationLine !== u.textDecorationLine) l.push(`text-decoration:${c.textDecorationLine.includes("underline") ? "underline" : "none"}`);
  if (c.color !== u.color) l.push(`color:${hex(c.color) || "#000000"}`);
  if (c.fontSize !== u.fontSize) l.push(`font-size:${pt(c.fontSize)}`);
  const zemin = hex(c.backgroundColor);
  if (zemin) l.push(`background:${zemin}`);
  return l.join(";");
};

const yenidenAdlandir = (el: Element, etiket: string) => {
  const yeni = el.ownerDocument.createElement(etiket);
  for (const a of [...el.attributes]) yeni.setAttribute(a.name, a.value);
  while (el.firstChild) yeni.appendChild(el.firstChild);
  el.replaceWith(yeni);
};

export const epostaHtml = (govde: string): string => {
  const kaynak = new DOMParser().parseFromString(`<div>${govde}</div>`, "text/html").body.firstElementChild as HTMLElement;
  // Ekrana ait düğme ve şeritler kopyaya girmesin.
  kaynak.querySelectorAll("button, [aria-hidden='true'], .yazdirma-gizle").forEach((x) => x.remove());
  bosSatirlaAyir(kaynak);
  const cerceve = document.createElement("iframe");
  cerceve.setAttribute("aria-hidden", "true");
  cerceve.style.cssText = "position:fixed;inset-block-start:0;inset-inline-start:-10000px;inline-size:900px;block-size:10px;visibility:hidden;border:0";
  document.body.appendChild(cerceve);
  try {
    const cd = cerceve.contentDocument!;
    cd.open();
    cd.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>${WORD_BICIMI}</style></head><body dir="rtl">${kaynak.innerHTML}</body></html>`);
    cd.close();
    const pencere = cerceve.contentWindow!;
    const govdeBicimi = pencere.getComputedStyle(cd.body);
    const ogeler = [...cd.body.querySelectorAll<HTMLElement>("*")];
    // Önce hepsi okunur (yazmak sonraki öğelerin hesabını değiştirmesin), sonra yazılır.
    const stiller = ogeler.map((el) => {
      const c = pencere.getComputedStyle(el);
      if (BLOK.has(el.tagName)) return blokStili(c);
      return satirIciStili(c, el.parentElement ? pencere.getComputedStyle(el.parentElement) : govdeBicimi);
    });
    ogeler.forEach((el, i) => {
      [...el.attributes].forEach((a) => a.name !== "href" && el.removeAttribute(a.name));
      if (stiller[i]) el.setAttribute("style", stiller[i]);
      if (BLOK.has(el.tagName)) el.setAttribute("dir", "rtl");
    });
    cd.body.querySelectorAll("h1, h2, h3, h4").forEach((h) => yenidenAdlandir(h, "p"));
    cd.body.querySelectorAll("bdi, mark").forEach((x) => yenidenAdlandir(x, "span"));
    return `<div dir="rtl" lang="ar" style="font-family:${YAZI_TIPI};font-size:${pt(govdeBicimi.fontSize)};line-height:115%;direction:rtl;text-align:right;color:#000000">${cd.body.innerHTML}</div>`;
  } finally {
    cerceve.remove();
  }
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
