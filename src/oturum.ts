import { useSyncExternalStore } from "react";
import { GERCEK, demoyaDon, firebaseYukle } from "./kip";
import { kisiBul, useVeri, type Kisi } from "./veri";

/**
 * Oturum: ekranlar "ben kimim" diye yalnız `useBen()`'e bakıyor.
 *
 * - Demo: giriş ekranından kişi seçiliyor, şifre yok; seçim tarayıcıda.
 * - Gerçek kip: kişi Firebase oturumundan (kimliği Firebase uid'si);
 *   depo/firebase.ts oturum açılınca `girisYap`'ı çağırıyor. Tarayıcıya
 *   yazılmıyor, Firebase kendi oturumunu saklıyor; demo seçimi de
 *   ezilmiyor.
 */

const SAKLA = "trt-planlama-oturum";

const oku = () => {
  if (GERCEK) return null;
  try {
    return localStorage.getItem(SAKLA);
  } catch {
    return null;
  }
};

let kisiId: string | null = oku();

const dinleyiciler = new Set<() => void>();

/* Çıkış üst pencerede; açık bölmeler ve öbür sekmeler eski kişiyle kalmasın. */
if (!GERCEK)
  window.addEventListener("storage", (e) => {
    if (e.key !== SAKLA && e.key !== null) return;
    const yeni = oku();
    if (yeni === kisiId) return;
    kisiId = yeni;
    dinleyiciler.forEach((d) => d());
  });

const ayarla = (id: string | null) => {
  kisiId = id;
  if (!GERCEK)
    try {
      if (id) localStorage.setItem(SAKLA, id);
      else localStorage.removeItem(SAKLA);
    } catch {
      /* özel pencerede oturum sekme kapanınca biter, sorun değil */
    }
  dinleyiciler.forEach((d) => d());
};

export const girisYap = (id: string) => ayarla(id);
export const cikisYap = () => ayarla(null);

/**
 * Kullanıcı menüsündeki çıkış. Demoda kişi değişiyor (giriş ekranı);
 * gerçek kipte Firebase oturumu kapanıyor ve program demoya dönüyor:
 * açılış yüzü hep demo.
 */
export const oturumdanCik = () => {
  if (!GERCEK) {
    cikisYap();
    location.hash = "#/";
    return;
  }
  firebaseYukle()
    .then((f) => f.oturumuKapat())
    .catch(() => {})
    .then(demoyaDon);
};

/** Oturumdaki kişi; örnek veri sıfırlanıp kişi silinmişse oturum yok sayılıyor. */
export function useBen(): Kisi | undefined {
  const id = useSyncExternalStore(
    (d) => {
      dinleyiciler.add(d);
      return () => dinleyiciler.delete(d);
    },
    () => kisiId,
  );
  const v = useVeri();
  return id ? kisiBul(v, id) : undefined;
}
