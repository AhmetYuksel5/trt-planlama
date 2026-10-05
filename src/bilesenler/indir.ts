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
const WORD_BICIMI = `
body { font-family: Calibri, Arial, sans-serif; font-size: 13pt; direction: rtl; text-align: right; }
h1 { font-size: 16pt; text-align: center; color: #c00000; }
h2 { font-size: 14pt; margin: 14pt 0 4pt; }
h2.yesil { color: #4f7a28; } h2.kirmizi { color: #c00000; } h2.ortali { text-align: center; }
h3 { font-size: 13pt; text-decoration: underline; margin: 10pt 0 2pt; }
h4.gun { font-size: 13pt; color: #c00000; margin: 14pt 0 4pt; }
p { margin: 0 0 3pt; }
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
