import { useSyncExternalStore } from "react";

/**
 * Uygulamanın iki kipi.
 *
 * - Demo (varsayılan): örnek veri, kişi seçerek giriş, kayıt tarayıcıda.
 *   Program her açılışta böyle başlıyor; kurumun içinde gösterilen yüz bu.
 * - Gerçek: davetle açılan hesaplar, e-postayla etkinleşme, kayıt
 *   Firebase'de ve herkes için ortak. Girişi gizli (logoya art arda üç tık,
 *   `#/gercek-giris`); demo gösterilirken gerçek kayıt ekranda belirmesin.
 *
 * Kip tarayıcıda saklanıyor ve açılışta bir kez okunuyor: oturumun ortasında
 * veri kaynağı değişmesin. Kip değişince sayfa baştan yükleniyor.
 */

const SAKLA = "trt-planlama-kip";

export type Kip = "demo" | "gercek";

const oku = (): Kip => {
  try {
    return localStorage.getItem(SAKLA) === "gercek" ? "gercek" : "demo";
  } catch {
    return "demo";
  }
};

export const KIP: Kip = oku();
export const GERCEK = KIP === "gercek";

const kipeGec = (kip: Kip, hash: string) => {
  try {
    localStorage.setItem(SAKLA, kip);
  } catch {
    /* saklanamazsa demo kalır */
  }
  // Sorgu (e-posta bağlantısının kodları) adresten silinsin; yenilemede yeniden işlenmesin.
  history.replaceState(null, "", `${location.pathname}${hash}`);
  location.reload();
};

/** Firebase katmanı ayrı parça: yalnız gerçek kipte ve gizli girişte indiriliyor. */
export const firebaseYukle = () => import("./depo/firebase");

export const gercegeGec = () => kipeGec("gercek", "#/");
export const demoyaDon = () => kipeGec("demo", "#/");

/* --- Gerçek kipin açılış durumu --- */

/*
 * Firebase kitaplığı yalnız gerçek kipte ve sonradan yükleniyor; kayıt
 * gelene kadar ekran ne olduğunu bu durumdan okuyor. Kitaplığa bağlı değil:
 * demo bu dosyayı içe aktarınca Firebase yüklenmiyor.
 */
export type GercekDurum =
  | { tur: "yukleniyor" }
  /** Oturum yok ya da kişi kaydı yok: giriş ekranı. */
  | { tur: "giris" }
  | { tur: "pasif" }
  | { tur: "hazir" }
  | { tur: "hata"; kod: string };

let durum: GercekDurum = { tur: "yukleniyor" };
const dinleyiciler = new Set<() => void>();

export const gercekDurumuYaz = (d: GercekDurum) => {
  durum = d;
  dinleyiciler.forEach((f) => f());
};

export const useGercekDurum = () =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => durum,
  );
