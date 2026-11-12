import type { Kisi } from "./veri";

/*
 * E-posta listesini kayıtlı kişilerle eşleştirme (kullanıcı: çağrının CC'sine
 * eklenen muhabir adreslerini teker teker girmek istemiyor). Gerçek adresler
 * depoya ve koda girmez: liste tarayıcıda yapıştırılır, burada yalnız kurallar.
 *
 * Adresin yerel kısmı muhabirin Latin adının parçalarıyla karşılaştırılır
 * ("hashem.manaa" → Hashem Manaa; bitişik "djerbiraoufdz" de Raouf Djerbi'yi
 * içerir). Kişinin kayıtlı adreslerinin yerel kısmı da parça sayılır
 * (kurumsal "ahmadhassan.shalha" kişisel "ahmadshalha1"i tanıtır). Kesin
 * olmayan seçilecek bırakılır: yanlış kişiye adres yazılırsa çağrı yanıtı
 * başkasının önerisi olur.
 */

export type EpostaAlani = "eposta" | "kisiselEposta";
export type EslesmeDurumu = "eslesti" | "belirsiz" | "bulunamadi" | "kayitli" | "dolu";

export interface EslesmeSatiri {
  adres: string;
  durum: EslesmeDurumu;
  /** Önerilen ya da (kayıtlıysa) adresin sahibi. */
  kisiId?: string;
  /** Belirsizde uyan kişiler, en iyisi önce. */
  adaylar: string[];
  alan?: EpostaAlani;
}

/* Yapıştırılan metinden adresler: virgül, noktalı virgül, boşluk, satır, "Ad <adres>". */
export const listedenAdresler = (metin: string): string[] => [
  ...new Set((metin.match(/[^\s@<>"',;:()[\]]+@[^\s@<>"',;:()[\]]+\.[^\s@<>"',;:()[\]]+/g) ?? []).map((a) => a.toLowerCase())),
];

/* Türkçe ve aksanlı harfler Latin'e: "Şükrü" → "sukru"; ı NFD'de ayrışmıyor, elle. */
const latin = (s: string) =>
  s
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const harfler = (s: string) => latin(s).replace(/[^a-z]/g, "");

/* Kişinin adından ve kayıtlı adreslerinin yerel kısmından anlamlı parçalar. */
const adParcalari = (k: Kisi): string[] => {
  const adlar = typeof k.ad === "string" ? [k.ad] : [k.ad.tr, k.ad.en];
  const yereller = [k.eposta, k.kisiselEposta].filter((a): a is string => !!a).map((a) => a.split("@")[0]);
  return [...new Set([...adlar, ...yereller].filter((x): x is string => !!x).flatMap((s) => latin(s).split(/[^a-z]+/)).filter((p) => p.length >= 3))];
};

/* Kişinin boş alanı: önce kurumsal (çağrının BCC'si oradan), sonra kişisel. Hesabı açık kişide kurumsal giriş adresi, yazılmaz. */
export const bosAlan = (k: Kisi, kurumsalYazilir: boolean, alinan: Set<EpostaAlani> = new Set()): EpostaAlani | undefined => {
  if (kurumsalYazilir && !k.eposta && !alinan.has("eposta")) return "eposta";
  if (!k.kisiselEposta && !alinan.has("kisiselEposta")) return "kisiselEposta";
  return undefined;
};

/**
 * Listeyi eşleştirir. `adaylar` muhabirler (çağrının alıcıları); `herkes`
 * kayıtlı adresin sahibini bulmak için bütün kişiler. `kurumsalYazilir`
 * kişinin kurumsal alanı yazılabilir mi (hesapsız ya da demo).
 */
export const epostaListesiniEslestir = (adresler: string[], adaylar: Kisi[], herkes: Kisi[], kurumsalYazilir: (k: Kisi) => boolean): EslesmeSatiri[] => {
  const sahip = new Map<string, string>();
  for (const k of herkes) for (const a of [k.eposta, k.kurumEposta, k.kisiselEposta]) if (a) sahip.set(a.toLowerCase(), k.id);
  const parcalar = new Map(adaylar.map((k) => [k.id, adParcalari(k)]));
  // Aynı listede iki adres aynı kişiye düşerse ikincisi öbür alana.
  const alinan = new Map<string, Set<EpostaAlani>>();
  return adresler.map((adres): EslesmeSatiri => {
    const kayitli = sahip.get(adres);
    if (kayitli) return { adres, durum: "kayitli", kisiId: kayitli, adaylar: [] };
    const h = harfler(adres.split("@")[0]);
    const puanlar = adaylar
      .map((k) => {
        const tutan = (parcalar.get(k.id) ?? []).filter((p) => h.includes(p));
        return { k, sayi: tutan.length, uzunluk: tutan.reduce((a, p) => a + p.length, 0) };
      })
      .filter((p) => p.sayi > 0)
      .sort((a, b) => b.sayi - a.sayi || b.uzunluk - a.uzunluk);
    const [ilk, ikinci] = puanlar;
    if (!ilk) return { adres, durum: "bulunamadi", adaylar: [] };
    const acik = ilk.sayi >= 2 && (!ikinci || ikinci.sayi < ilk.sayi || ikinci.uzunluk < ilk.uzunluk);
    if (!acik) return { adres, durum: "belirsiz", adaylar: puanlar.slice(0, 5).map((p) => p.k.id) };
    const kume = alinan.get(ilk.k.id) ?? new Set<EpostaAlani>();
    const alan = bosAlan(ilk.k, kurumsalYazilir(ilk.k), kume);
    if (alan) kume.add(alan);
    alinan.set(ilk.k.id, kume);
    return { adres, durum: alan ? "eslesti" : "dolu", kisiId: ilk.k.id, adaylar: [ilk.k.id], alan };
  });
};
