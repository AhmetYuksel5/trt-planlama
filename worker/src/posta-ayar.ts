/*
 * Posta köprüsünün ayarı iki parçalı:
 *  - Ortak (PostaAyar): Exchange sunucusu ve alan (domain), açık/kapalı. Yalnız
 *    tam yönetici bir kez girer, herkes için aynı.
 *  - Kişiye özel (PostaKimlik): kullanıcı adı, parola ve grup adresi. Her kişi
 *    kendi kurumsal hesabını ve kendi biriminin grup adresini girer; kapı bunu
 *    uid'ye bağlı saklar, böylece herkes kendi grubunun yazışmalarını görür.
 * Parola yapay zeka anahtarları gibi KV'de duruyor, tarayıcıya hiç gelmiyor
 * (yalnız "var mı" bilgisi). Doğrulama saf, test edilebilir
 * (test/posta-ayar.test.ts).
 */

export interface PostaAyar {
  acik: boolean;
  sunucu: string;
  alan: string;
}

export const bosPostaAyar = (): PostaAyar => ({ acik: false, sunucu: "", alan: "" });

export const postaGorunur = (a: PostaAyar) => ({ acik: a.acik, sunucu: a.sunucu, alan: a.alan });

export interface PostaKimlik {
  kullanici: string;
  parola: string;
  /** Yalnız bu adrese (To/Cc) gelen postalar alınıyor; kişinin kendi biriminin grup adresi. */
  grupAdresi: string;
}

export const bosPostaKimlik = (): PostaKimlik => ({ kullanici: "", parola: "", grupAdresi: "" });

/* Tarayıcıya giden hal: parola yerine yalnız "kayıtlı mı". */
export const postaKimlikGorunur = (k: PostaKimlik) => ({ kullanici: k.kullanici, grupAdresi: k.grupAdresi, parolaVar: k.parola.length > 0 });

const metinMi = (x: unknown): x is string => typeof x === "string";
const sunucuGecerli = (s: string) => /^[a-z0-9.-]{1,255}$/i.test(s);

/* Ortak ayarı birleştirir (açık/kapalı, sunucu, alan). */
export const postaAyarBirlestir = (eski: PostaAyar, gelen: unknown): { ayar: PostaAyar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  const sunucu = metinMi(g.sunucu) ? g.sunucu.trim() : eski.sunucu;
  if (sunucu && !sunucuGecerli(sunucu)) return { hata: "sunucu" };
  const alan = metinMi(g.alan) ? g.alan.trim() : eski.alan;
  if (alan && !/^[A-Za-z0-9._-]{1,120}$/.test(alan)) return { hata: "alan" };
  return { ayar: { acik: typeof g.acik === "boolean" ? g.acik : eski.acik, sunucu, alan } };
};

/*
 * Kişiye özel kimliği birleştirir. Parola yalnız boş olmayan metinle değişir
 * (boş/eksik alan eskiyi korur, kaza silmesin); açıkça silmek için null gönderilir.
 */
export const postaKimlikBirlestir = (eski: PostaKimlik, gelen: unknown): { kimlik: PostaKimlik } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "govde" };
  const g = gelen as Record<string, unknown>;
  const grupAdresi = metinMi(g.grupAdresi) ? g.grupAdresi.trim().toLowerCase() : eski.grupAdresi;
  if (grupAdresi && !/^[^\s@]+@[^\s@]+$/.test(grupAdresi)) return { hata: "grupAdresi" };
  let parola = eski.parola;
  if (g.parola === null) parola = "";
  else if (metinMi(g.parola) && g.parola.length > 0) parola = g.parola;
  return {
    kimlik: {
      kullanici: metinMi(g.kullanici) ? g.kullanici.trim() : eski.kullanici,
      parola,
      grupAdresi,
    },
  };
};
