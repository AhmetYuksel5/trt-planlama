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
/**
 * Elle yazılan saat "SS:DD"ye: "14", "9", "14:30", "14.30", "1430", "14G",
 * "1430G", Arapça rakamla da. Boş "" (TBC), okunamayan null. Tarayıcının saat
 * kutusu yalnız saat yazılınca ("14") boş değer veriyordu, canlı yayın
 * kaydedildiği halde TBC kalıyordu.
 */
export const saatCoz = (s: string): string | null => {
  const t = s
    .trim()
    .replace(/[٠-٩]/g, (r) => String(r.charCodeAt(0) - 0x660))
    .replace(/\s*(G|GMT)$/i, "");
  if (!t) return "";
  const m = t.match(/^(\d{1,2})(?:[:.]?(\d{2}))?$/);
  if (!m) return null;
  const sa = Number(m[1]);
  const dk = Number(m[2] ?? "0");
  if (sa > 23 || dk > 59) return null;
  return `${String(sa).padStart(2, "0")}:${String(dk).padStart(2, "0")}`;
};

export const vardiyaYaz = (saat: string) => {
  if (!saat) return "";
  const [s, d = "00"] = saat.split(":");
  return `${s}${d === "00" ? "" : d}G`;
};

/** İki gün arasındaki gün sayısı (b - a); öğlen üzerinden, yaz saatinden etkilenmesin diye. */
export const gunFarki = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86_400_000);

/** n ay sonrası; ayın son gününü aşan gün o ayın son gününe iner (31 Ocak → 28 Şubat). */
export const ayEkle = (tarih: string, n: number) => {
  const [y, a, g] = tarih.split("-").map(Number);
  const t = new Date(y, a - 1 + n, 1, 12);
  t.setDate(Math.min(g, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return iso(t);
};

export const ayBasi = (tarih: string) => tarih.slice(0, 8) + "01";
export const aySonu = (tarih: string) => gunEkle(ayEkle(ayBasi(tarih), 1), -1);
