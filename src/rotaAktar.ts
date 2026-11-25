import { rotaProgramiKaydet } from "./eylemler";
import { GERCEK } from "./kip";
import { rotaGetir } from "./posta-kapi";
import { rotaDonemiKur, rotaGunleriniOku, rotaGuncel } from "./rotaProgrami";
import { bugun } from "./tarih";
import { getir, type Kisi } from "./veri";
import { yapabilir } from "./yetki";

/*
 * Dönemin programını rotadan kayda yazar (rotaProgrami.ts). App.tsx açılışta çağırır:
 * bugünü kapsayan dönem kayıttaysa bir şey yapmaz, yani dönem başına bir kez, o dönemde
 * sistemi ilk açan Planlama ya da tam yöneticinin tarayıcısında. Okunamazsa (rota ayarı yok,
 * Google yanıt vermedi) aynı tarayıcı o gün yeniden denemez. Demoda kapı yok; test sahte
 * okumayla (`window.__rotaGetir`) dener.
 */
declare global {
  interface Window {
    __rotaGetir?: (tarih: string, tur: "rota" | "sunucu") => Promise<{ sekme: string; satirlar: [string, string, string][] } | null>;
  }
}

const DENEME = "trt-planlama-rota-denendi";

export const rotaAktarabilir = (ben: Kisi | undefined | null) => !!ben && (yapabilir(ben, "planDuzenle") || !!ben.hesapYoneticisi);

export const rotaDoneminiAktar = async (ben: Kisi, zorla = false): Promise<"guncel" | "yok" | "tamam"> => {
  if (!rotaAktarabilir(ben)) return "yok";
  if (!zorla && rotaGuncel(getir())) return "guncel";
  const sahte = window.__rotaGetir;
  if (!GERCEK && !sahte) return "yok";
  try {
    if (!zorla && localStorage.getItem(DENEME) === bugun()) return "yok";
    localStorage.setItem(DENEME, bugun());
  } catch {
    /* tarayıcı saklamıyorsa her açılışta denenir */
  }
  const oku =
    sahte ??
    (async (tarih: string, tur: "rota" | "sunucu") => {
      const r = await rotaGetir(tarih, false, tur);
      return r.tamam ? r.veri : null;
    });
  // Rota ayarını yalnız tam yönetici okuyabiliyor: sunucular tablosunun varlığı ilk günün okumasından.
  const sunucuVar = !!(await oku(bugun(), "sunucu"));
  const gunler = await rotaGunleriniOku(oku, sunucuVar);
  if (!gunler.length) return "yok";
  const d = getir();
  return rotaProgramiKaydet(ben, rotaDonemiKur(gunler, d.kisiler, d.staffingEslesmeleri)) ? "tamam" : "yok";
};
