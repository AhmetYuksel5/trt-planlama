/*
 * Kim, nasıl kullanıyor (kullanıcı: hangi kullanıcıların sistemi kullandığını,
 * hangilerinin uygulamayı indirip kullandığını tam yönetici görsün). Açılışta
 * kişi kendi izini kendi ayar belgesine yazar (Durum.kullanim, kişiye bağlı
 * harita): son görülme, açtığı yol, cihaz. Günde en çok bir yazış; yol ya da
 * cihaz değişmedikçe aynı gün yeniden yazılmaz (yazış kotası, öbür sekmeleri
 * yeniden çizdirme).
 */
import { iso } from "./tarih";

/** Tarayıcıda site, ana ekrana eklenmiş uygulama (PWA), Android uygulaması (APK, TWA). */
export type KullanimKanali = "tarayici" | "pwa" | "apk";
export type KullanimCihazi = "telefon" | "bilgisayar";

export interface KullanimIzi {
  /** Son açılış (ISO). */
  son: string;
  /** İlk görülme (ISO): iz yazılmaya başladığından beri. */
  ilk: string;
  kanal: KullanimKanali;
  cihaz: KullanimCihazi;
  /** Şimdiye dek kullandığı yollar: bugün tarayıcıdan açan da uygulamayı kurmuş olabilir. */
  kanallar: KullanimKanali[];
}

export const KANAL_SIRASI: KullanimKanali[] = ["apk", "pwa", "tarayici"];

/** Yeni iz; aynı gün, aynı yol ve cihazla açılış yazılmaz (null). */
export const kullanimIziKur = (eski: KullanimIzi | undefined, kanal: KullanimKanali, cihaz: KullanimCihazi, an: string): KullanimIzi | null => {
  const kanallar = KANAL_SIRASI.filter((k) => k === kanal || eski?.kanallar?.includes(k));
  if (eski && iso(new Date(eski.son)) === iso(new Date(an)) && eski.kanal === kanal && eski.cihaz === cihaz && kanallar.length === (eski.kanallar?.length ?? 0)) return null;
  return { son: an, ilk: eski?.ilk ?? an, kanal, cihaz, kanallar };
};

/** Uygulamayı (PWA ya da APK) en az bir kez kullanmış mı. */
export const uygulamaKullaniyor = (iz?: KullanimIzi) => !!iz?.kanallar?.some((k) => k !== "tarayici");

/*
 * Android uygulaması sitenin açılışında yönlendireni "android-app://<paket>"
 * olarak bırakıyor, sonraki gezinmede kayboluyor: ilk yüklemede sekmeye yazılıyor.
 */
const APK_ANAHTARI = "trt-planlama-apk";
const APK_PAKETI = "android-app://net.plannersflow.app";

export const kanalHatirla = () => {
  try {
    if (document.referrer.startsWith(APK_PAKETI)) sessionStorage.setItem(APK_ANAHTARI, "1");
  } catch {
    /* depolama kapalı: kanal tarayıcı/PWA sayılır */
  }
};

export const kanalAlgila = (): KullanimKanali => {
  try {
    if (sessionStorage.getItem(APK_ANAHTARI) === "1" || document.referrer.startsWith(APK_PAKETI)) return "apk";
  } catch {
    /* geç */
  }
  const ios = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios || matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches) return "pwa";
  return "tarayici";
};

export const cihazAlgila = (): KullanimCihazi =>
  /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (matchMedia("(pointer: coarse)").matches && innerWidth < 1024) ? "telefon" : "bilgisayar";
