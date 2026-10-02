/** Tarayıcıda dosya indirme: sunucu olmadan Outlook taslağı ve rapor dosyası için. */
export const indir = (ad: string, icerik: string, tur: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icerik], { type: tur }));
  a.download = ad;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
