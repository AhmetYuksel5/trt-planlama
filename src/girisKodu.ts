/*
 * Giriş koduyla hesap (kullanıcı: kurum e-postası postayı kaybediyor, kişiler
 * özel adres vermek istemiyor). E-postasız yol: yönetici kişiye kullanıcı
 * adı ve tek kullanımlık, süreli bir kod verir; kişi kodla girip kendi
 * şifresini belirler, sonra kullanıcı adı ve şifreyle girer.
 *
 * Firebase'in e-posta/şifre girişi bir adres istiyor: kullanıcı adı, posta
 * almayan sahte bir adrese çevriliyor (`ali@giris.plannersflow.net`). Kural
 * kişi kaydının e-postasını oturumun adresiyle karşılaştırdığı için kayıtta
 * da bu adres duruyor; posta gönderen her yer `postaAdresi` ile ona değil
 * kişinin kurum adresine (`Kisi.kurumEposta`) bakıyor.
 *
 * Kod hesabın ilk şifresi (yöneticinin tarayıcısı hesabı bu şifreyle açıyor):
 * kişi şifresini değiştirince kod kendiliğinden geçersiz. Bu yüzden davet
 * yolu olduğu gibi kullanılıyor; kodu bilmeyen hesaba giremiyor.
 */

export const GIRIS_ALANI = "giris.plannersflow.net";

/** Kodun ne kadar geçerli olduğu: kişiye ulaştırıp girmesine yetsin, unutulan kod açık kalmasın. */
export const KOD_SURESI_SAAT = 48;

/* Karışan harfler yok (0/O, 1/I/L): kod telefonda sesli de okunuyor. */
const HARFLER = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const KOD_UZUNLUGU = 8;

export const yeniKod = (rastgele: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string =>
  Array.from(rastgele(KOD_UZUNLUGU), (b) => HARFLER[b % HARFLER.length]).join("");

/** Kişinin yazdığı kod: boşluk, tire, küçük harf fark etmez. */
export const koduDuzenle = (girdi: string) => girdi.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const kodGecerliBicim = (kod: string) => kod.length === KOD_UZUNLUGU && [...kod].every((c) => HARFLER.includes(c));
/** Ekranda okunur: dörtlü iki grup. */
export const kodYaz = (kod: string) => (kod.length === KOD_UZUNLUGU ? `${kod.slice(0, 4)}-${kod.slice(4)}` : kod);

/*
 * Firebase şifresi koddan türetiliyor: projede şifre kuralı (büyük, küçük harf,
 * rakam, işaret) açılırsa yalnız büyük harfli kod hesabı açtırmazdı.
 */
export const kodSifresi = (kod: string) => `Pf1!${kod}${kod.toLowerCase()}`;

const KULLANICI_ADI = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;
export const kullaniciAdiGecerli = (ad: string) => KULLANICI_ADI.test(ad) && !/[._-]{2}/.test(ad);
export const kullaniciAdresi = (ad: string) => `${ad.trim().toLowerCase()}@${GIRIS_ALANI}`;

/** Kod hesabının kullanıcı adı; gerçek adreste boş. */
export const girisAdi = (eposta?: string | null): string => {
  const e = (eposta ?? "").trim().toLowerCase();
  return e.endsWith(`@${GIRIS_ALANI}`) ? e.slice(0, -GIRIS_ALANI.length - 1) : "";
};

/** Giriş alanına yazılan: "@" yoksa kullanıcı adı. */
export const girisAdresi = (girdi: string) => {
  const g = girdi.trim().toLowerCase();
  return g && !g.includes("@") ? kullaniciAdresi(g) : g;
};

const LATIN: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u", é: "e", è: "e", à: "a" };

/** Latin addan kullanıcı adı önerisi ("Ali Kaya" → ali.kaya); alınmışsa sonuna sayı. */
export const kullaniciAdiOner = (latinAd: string, alinmis: Set<string>): string => {
  const kok =
    latinAd
      .toLocaleLowerCase("tr")
      .replace(/[çğıöşüâîûéèà]/g, (h) => LATIN[h] ?? h)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 24) || "kullanici";
  const taban = kok.length < 3 ? `${kok}.pf` : kok;
  if (!alinmis.has(taban)) return taban;
  // Şifresini unutan kişiye yeni kod yeni hesap açıyor (eskisinin şifresi değiştirilemiyor): ali.kaya → ali.kaya2.
  const govde = taban.replace(/\d+$/, "");
  for (let i = 2; ; i++) if (!alinmis.has(`${govde}${i}`)) return `${govde}${i}`;
};

/** Posta gönderilecek adres: kod hesabında sahte giriş adresi değil, kişinin kurum adresi. */
export const postaAdresi = (k?: { eposta?: string; kurumEposta?: string } | null): string =>
  (girisAdi(k?.eposta) ? (k?.kurumEposta ?? "") : (k?.eposta ?? "")).trim().toLowerCase();
