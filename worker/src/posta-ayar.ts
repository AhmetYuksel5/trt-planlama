/*
 * Posta köprüsünün ayarı: Exchange sunucusu, kullanıcı adı, alan, planlama
 * grubu adresi ve parola. Parola yapay zeka anahtarları gibi KV'de duruyor,
 * tarayıcıya hiç gelmiyor (yalnız "var mı" bilgisi). Doğrulama saf, test
 * edilebilir (test/posta-ayar.test.ts).
 */

export interface PostaAyar {
  acik: boolean;
  sunucu: string;
  kullanici: string;
  alan: string;
  /** Yalnız bu adrese (To/Cc) gelen postalar alınıyor; boşsa gelen kutusunun hepsi. */
  grupAdresi: string;
  parola: string;
}

export const bosPostaAyar = (): PostaAyar => ({ acik: false, sunucu: "", kullanici: "", alan: "", grupAdresi: "", parola: "" });

/* Tarayıcıya giden hal: parola yerine yalnız "kayıtlı mı". */
export const postaGorunur = (a: PostaAyar) => ({
  acik: a.acik,
  sunucu: a.sunucu,
  kullanici: a.kullanici,
  alan: a.alan,
  grupAdresi: a.grupAdresi,
  parolaVar: a.parola.length > 0,
});

const metinMi = (x: unknown): x is string => typeof x === "string";
const sunucuGecerli = (s: string) => /^[a-z0-9.-]{1,255}$/i.test(s);

/*
 * Gelen kısmi ayarı mevcutla birleştirir. Parola yalnız boş olmayan metinle
 * değişir (boş/eksik alan eskiyi korur, kazара silmesin); açıkça silmek için
 * parola alanına tek boşluk değil, null gönderilir.
 */
export const postaAyarBirlestir = (eski: PostaAyar, gelen: unknown): { ayar: PostaAyar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  const sunucu = metinMi(g.sunucu) ? g.sunucu.trim() : eski.sunucu;
  if (sunucu && !sunucuGecerli(sunucu)) return { hata: "sunucu" };
  const alan = metinMi(g.alan) ? g.alan.trim() : eski.alan;
  if (alan && !/^[A-Za-z0-9._-]{1,120}$/.test(alan)) return { hata: "alan" };
  const grupAdresi = metinMi(g.grupAdresi) ? g.grupAdresi.trim().toLowerCase() : eski.grupAdresi;
  if (grupAdresi && !/^[^\s@]+@[^\s@]+$/.test(grupAdresi)) return { hata: "grupAdresi" };
  let parola = eski.parola;
  if (g.parola === null) parola = "";
  else if (metinMi(g.parola) && g.parola.length > 0) parola = g.parola;
  return {
    ayar: {
      acik: typeof g.acik === "boolean" ? g.acik : eski.acik,
      sunucu,
      kullanici: metinMi(g.kullanici) ? g.kullanici.trim() : eski.kullanici,
      alan,
      grupAdresi,
      parola,
    },
  };
};
