import { gunAdi, metin } from "./dil";
import { SEHIRLER, type Cagri, type Durum, type Kisi, type Oneri, type Yanit } from "./veri";

/**
 * Öneri çağrısının e-posta tarafı.
 *
 * Kurumun bugünkü işleyişi: sabah planlama, Kime'de planlama grubu (bütün
 * planlama yazışmayı görsün), BCC'de muhabirler (her muhabirin yazışması
 * müstakil kalsın) olacak şekilde Arapça bir e-posta atıyor; muhabirler
 * "yanıtla" ile önerilerini gönderiyor. Yanıt planlama kutusuna düştüğü
 * için hangi istemciden (Outlook, Gmail, telefon) yazıldığı fark etmiyor.
 *
 * Buradaki işlevler saf: tarayıcıdaki içe aktarma da sunucu fazında
 * planlama kutusunu Microsoft Graph ile izleyecek hizmet de aynı kuralla
 * eşleştirsin, aynı kaydı üretsin diye (bkz. belgeler/eposta-entegrasyonu.md).
 */

/* --- Giden çağrı --- */

/** Planlama grubu adresi örnekte kurgusal; gerçeği çağrı ekranında giriliyor, bu herkese açık sitede yazmıyor. */
export const ORNEK_PLANLAMA_ADRESI = "planning@ornek.local";

/** Konudaki eşleştirme etiketi. "RE:", "FW:", "رد:" eklense de etiket kalıyor. */
export const etiketUret = (tarih: string) => `ND-${tarih.replace(/-/g, "")}`;
export const etiketBul = (konu: string) => konu.match(/ND-\d{8}/)?.[0];

/** Kurumun e-postasındaki tarih biçimi: 30.09.2026. */
const noktali = (tarih: string) => tarih.split("-").reverse().join(".");

export const cagriKonusu = (tarih: string) =>
  `${metin("cagriKonu", "ar", { gun: gunAdi(tarih, "ar"), tarih: noktali(tarih) })} [${etiketUret(tarih)}]`;

export const cagriGovdesi = (tarih: string, sonSaat: string) =>
  metin("cagriSablonu", "ar", { gun: gunAdi(tarih, "ar"), tarih: noktali(tarih), saat: sonSaat });

const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Outlook'ta sağdan sola açılan gövde; "ملاحظة هامة" kurumun e-postasındaki gibi kırmızı. */
export const govdeHtml = (govde: string) =>
  `<div dir="rtl" lang="ar" style="font-family:Calibri,Arial,sans-serif;font-size:14pt;text-align:right">` +
  govde
    .split("\n")
    .map((s) => (s.trim() ? `<p style="margin:0 0 8px">${kac(s).replace(/^(ملاحظة هامة\s*:?)/, '<b style="color:#c00000">$1</b>')}</p>` : "<p>&nbsp;</p>"))
    .join("") +
  `</div>`;

const utf8Base64 = (s: string) => {
  let ikili = "";
  for (const b of new TextEncoder().encode(s)) ikili += String.fromCharCode(b);
  return btoa(ikili);
};

export interface GidenEposta {
  kime: string;
  bcc: string[];
  konu: string;
  govde: string;
}

/*
 * Outlook taslağı: X-Unsent başlığı Outlook'a dosyayı gönderilmemiş
 * taslak olarak açtırıyor; Kime, BCC, konu ve sağdan sola gövde dolu,
 * kullanıcı yalnız Gönder'e basıyor. Uzun BCC satırı 998 karakter
 * sınırını aşmasın diye katlanıyor.
 */
export const emlUret = (e: GidenEposta) => {
  const bcc = e.bcc.reduce<string[]>((satirlar, adres) => {
    const son = satirlar[satirlar.length - 1];
    if (son && son.length + adres.length < 900) satirlar[satirlar.length - 1] = `${son}, ${adres}`;
    else satirlar.push(adres);
    return satirlar;
  }, []);
  const govde = utf8Base64(`<html><body>${govdeHtml(e.govde)}</body></html>`).replace(/.{76}/g, "$&\r\n");
  return [
    `To: ${e.kime}`,
    `Bcc: ${bcc.join(",\r\n ")}`,
    `Subject: =?UTF-8?B?${utf8Base64(e.konu)}?=`,
    "X-Unsent: 1",
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    govde,
  ].join("\r\n");
};

/** Telefondaki e-posta uygulaması (Gmail, Outlook, Mail) için; gövde düz metin. */
export const mailtoUret = (e: GidenEposta) =>
  `mailto:${encodeURIComponent(e.kime)}?bcc=${e.bcc.map(encodeURIComponent).join(",")}&subject=${encodeURIComponent(e.konu)}&body=${encodeURIComponent(e.govde)}`;

/* --- Gelen yanıt --- */

export interface GelenEposta {
  kimden: string;
  kimdenAd?: string;
  konu: string;
  metin: string;
  zaman?: string;
  mesajKimligi?: string;
  ekler?: string[];
}

/*
 * Yanıtın altına eklenen alıntı ve imza: Outlook (Türkçe, Arapça, İngilizce
 * arayüz), Gmail ve telefon uygulamalarının kalıpları. Kesim yanlış olsa
 * da tam metin ayrıca saklanıyor; hiçbir şey kaybolmuyor.
 */
const ALINTI = [
  /^-{2,}\s*(Original Message|Özgün İleti|Orijinal İleti|الرسالة الأصلية)\s*-{2,}/im,
  /^_{10,}\s*$/m,
  /^(On|Le|Am) .+(wrote|a écrit|schrieb)\s*:\s*$/m,
  /^.+ tarihinde .+ şunu yazdı\s*:\s*$/m,
  /^في .+ كتب.*:\s*$/m,
  /^(From|Kimden|من|De|Von)\s*:.+\n(.+\n){0,3}?(Sent|Date|Gönderildi|Tarih|تاريخ الإرسال|أرسلت|التاريخ|Envoyé|Gesendet)\s*:/im,
  /^>/m,
];
const IMZA = [/^--\s*$/m, /^(Sent from|Get Outlook for|Gönderen:? iPhone|iPhone'umdan gönderildi|أُرسلت من|ارسلت من|تم الإرسال من)/im];

export const yeniMetin = (tam: string) => {
  let m = tam.replace(/\r\n?/g, "\n");
  for (const k of [...ALINTI, ...IMZA]) {
    const i = m.search(k);
    if (i >= 0) m = m.slice(0, i);
  }
  return m.replace(/\n{3,}/g, "\n\n").trim();
};

/*
 * E-posta herkesten yanıt istiyor ("حتى و لو لم يكن لديكم"): "لا يوجد"
 * gibi kısa yanıt öneri listesini doldurmasın, "yanıt verdi, önerisi yok"
 * olarak işaretlensin. Yalnız kısa ve bu kalıplardan biriyle başlayan yanıt.
 */
const BOS = /^(لا يوجد|لايوجد|لا شيء|لا شي|لا جديد|ليس لدي|ليس لدينا|لا مقترحات|لا يوجد لدي|nothing|no news|none|yok|bende yok)/i;
export const bosYanitMi = (m: string) => m.length <= 80 && BOS.test(m.replace(/^[\s\p{P}]+/u, ""));

const kucuk = (s?: string) => (s ?? "").trim().toLowerCase();

/** Gönderen adresi muhabirin kurumsal ya da kişisel adresiyle eşleşiyor mu. */
export const gondereniBul = (d: Durum, adres: string): Kisi | undefined =>
  d.kisiler.find((k) => kucuk(k.eposta) === kucuk(adres) || kucuk(k.kisiselEposta) === kucuk(adres));

/** Önce konudaki etiket; etiket silinmişse muhabirin e-postadan önceki son çağrısı. */
export const cagriyiBul = (d: Durum, konu: string, zaman: string, kisi?: Kisi): Cagri | undefined => {
  const etiket = etiketBul(konu);
  if (etiket) return d.cagrilar.find((c) => c.etiket === etiket);
  if (!kisi) return undefined;
  return [...d.cagrilar].filter((c) => c.zaman <= zaman && c.bcc.includes(kisi.id)).sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
};

/** Yanıttan öneri: başlık ilk satır, gelişme bütün metin; plancı sonra düzenliyor ve bölüyor. */
export const yanittanOneriTaslagi = (y: Yanit, kisi: Kisi, cagri: Cagri, id: string): Oneri => {
  const ilk = y.metin.split("\n").find((s) => s.trim()) ?? y.konu;
  return {
    id,
    muhabirId: kisi.id,
    ulke: SEHIRLER[kisi.sehir],
    haberBasligi: ilk.trim().slice(0, 140),
    gelisme: y.metin,
    tur: "haber",
    sahaGerekli: false,
    zaman: y.zaman,
    kanal: "eposta",
    hedefTarih: cagri.tarih,
    durum: "yeni",
    cagriId: cagri.id,
    yanitId: y.id,
  };
};
