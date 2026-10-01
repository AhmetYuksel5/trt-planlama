/*
 * Tarih yardımcıları. Ayrı dosyada, çünkü hem veri katmanı hem örnek veri
 * kullanıyor; veri.ts'te dursa örnek veriyle aralarında döngü oluşurdu.
 */

export const iso = (t: Date) =>
  `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;

export const bugun = () => iso(new Date());

/* ISO zamanın yerel takvimdeki günü; UTC'ye göre kesmek gece yarısına yakın kayıtları bir gün kaydırırdı. */
export const yerelGun = (isoZaman: string) => iso(new Date(isoZaman));

/* Öğlen üzerinden hesaplanıyor ki yaz saati geçişinde gün kaymasın. */
export const gunEkle = (tarih: string, n: number) => {
  const t = new Date(tarih + "T12:00:00");
  t.setDate(t.getDate() + n);
  return iso(t);
};

export const simdi = () => new Date().toISOString();

/** Yerel saatle verilen gün ve saatin ISO zamanı. */
export const zaman = (tarih: string, saat: string) => new Date(`${tarih}T${saat}:00`).toISOString();

/** ISO zaman → `<input type="datetime-local">` değeri (yerel saat). */
export const yerelGirdi = (isoZaman?: string) => {
  if (!isoZaman) return "";
  const t = new Date(isoZaman);
  return `${iso(t)}T${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
};

/** `<input type="datetime-local">` değeri → ISO zaman; boşsa tanımsız. */
export const girdidenIso = (deger: string) => (deger ? new Date(deger).toISOString() : undefined);

/** Haftalık akış Cumartesi başlıyor; verilen günü içeren haftanın Cumartesi'si. */
export const haftaBasi = (tarih: string) => {
  const g = new Date(tarih + "T12:00:00").getDay();
  return gunEkle(tarih, -((g + 1) % 7));
};

/** Planlama "bu hafta" derken Perşembe toplantısında hazırlanan gelecek haftayı kastediyor. */
export const planlananHafta = (tarih: string) => gunEkle(haftaBasi(tarih), 7);

/**
 * Vardiya saati kurumun çıktısındaki gibi: "04:00" → "04G", "11:45" → "1145G".
 * G, saatin GMT olduğunu söylüyor.
 */
export const vardiyaYaz = (saat: string) => {
  if (!saat) return "";
  const [s, d = "00"] = saat.split(":");
  return `${s}${d === "00" ? "" : d}G`;
};
