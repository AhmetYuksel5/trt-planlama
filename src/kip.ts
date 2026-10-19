import { useSyncExternalStore } from "react";

/**
 * Uygulamanın iki kipi.
 *
 * - Demo (varsayılan): örnek veri, kişi seçerek giriş, kayıt tarayıcıda.
 *   Program her açılışta böyle başlıyor; kurumun içinde gösterilen yüz bu.
 * - Gerçek: davetle açılan hesaplar, e-postayla etkinleşme, kayıt
 *   Firebase'de ve herkes için ortak. Girişi tanıtım sayfasındaki "Giriş"
 *   (`#/gercek-giris`).
 *
 * Adres çıplak açılınca (hash yok) demoda tanıtım sayfası geliyor; gerçek
 * kipte kalmış kişi doğrudan sisteme giriyor.
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

/** Firebase katmanı ayrı parça: yalnız gerçek kipte ve giriş ekranında indiriliyor. */
export const firebaseYukle = () => import("./depo/firebase");

export const gercegeGec = () => kipeGec("gercek", "#/");
export const demoyaDon = () => kipeGec("demo", "#/");
/** Gerçek hesaptan çıkış: tanıtım sayfasına (hash'siz adres). */
export const tanitimaDon = () => kipeGec("demo", "");

/** Tanıtımın düğmeleri. Gerçek kipten demoya geçmek Firebase oturumunu kapatmıyor; "Giriş" geri getiriyor. */
export const demoyuAc = () => (GERCEK ? demoyaDon() : (location.hash = "#/"));
export const girisiAc = () => (location.hash = GERCEK ? "#/" : "#/gercek-giris");

/** Uygulamanın içinden tanıtım: kip değişmiyor, adresi `#/tanitim`. */
export const tanitimiAc = () => {
  location.hash = "#/tanitim";
};

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

/*
 * Kayıt sunucuyla eşitlendi mi: açılışta kayıt önce tarayıcının önbelleğinden
 * kuruluyor, sunucudaki yeni hali sonra geliyor. Sistemin yazışları (yarının
 * planı, aktarımlar, çift plan toplama) bundan önce çalışırsa bayat görüntüye
 * göre yazıyordu: başka cihazda açılıp üzerinde çalışılan plan "yok" sanılıp
 * aynı kimlikle şablondan yeniden yazılıyor, silinenler geri geliyordu.
 */
let esit = false;
const esitBekleyen: (() => void)[] = [];
export const sunucuyaEsitlendi = () => {
  if (esit) return;
  esit = true;
  dinleyiciler.forEach((f) => f());
  esitBekleyen.splice(0).forEach((f) => f());
};
export const sunucuyaEsitMi = () => esit;
/* Eşitlenince bir kez çalışacak iş (hesap geçişleri); eşitse hemen. */
export const sunucuyaEsitOlunca = (f: () => void) => (esit ? f() : void esitBekleyen.push(f));
export const useSunucuyaEsit = () =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => esit,
  );
