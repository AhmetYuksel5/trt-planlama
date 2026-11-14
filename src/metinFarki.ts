import { harekesiz } from "./bilesenler/Hareke";

/*
 * Parçanın muhabirden gelen haliyle bugünkü hali arasındaki sözcük farkı
 * (aşama kutuları, kullanıcı kararı: ilk metin saklansın). Sözcükler
 * harekesiz karşılaştırılır: dil denetmeninin harekelemesi zaten kırmızı
 * görünüyor, her sözcüğü "değişti" saymasın. Saf; en uzun ortak alt dizi.
 */
export type FarkParcasi = { tur: "ayni" | "silindi" | "eklendi"; metin: string };

const parcala = (s: string) => s.split(/(\s+)/).filter((x) => x !== "");

export const sozcukFarki = (eski: string, yeni: string): FarkParcasi[] => {
  const a = parcala(eski);
  const b = parcala(yeni);
  const ak = a.map(harekesiz);
  const bk = b.map(harekesiz);
  // Çok uzun metinde tablo büyümesin: ikisi de yan yana verilir.
  if (a.length * b.length > 4_000_000) return [{ tur: "silindi", metin: eski }, { tur: "eklendi", metin: yeni }];
  const n = a.length;
  const m = b.length;
  const L: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = ak[i] === bk[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const s: FarkParcasi[] = [];
  const ekle = (tur: FarkParcasi["tur"], metin: string) => {
    const son = s[s.length - 1];
    if (son && son.tur === tur) son.metin += metin;
    else s.push({ tur, metin });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ak[i] === bk[j]) ekle("ayni", b[j]), i++, j++;
    else if (L[i + 1][j] >= L[i][j + 1]) ekle("silindi", a[i++]);
    else ekle("eklendi", b[j++]);
  }
  while (i < n) ekle("silindi", a[i++]);
  while (j < m) ekle("eklendi", b[j++]);
  return s;
};
