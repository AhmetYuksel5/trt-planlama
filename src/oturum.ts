import { useEffect, useSyncExternalStore } from "react";
import { izlemeAboneOl, izlemeBitir, izlenenKisi } from "./izleme";
import { GERCEK, tanitimaDon, firebaseYukle } from "./kip";
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
  // Kişi değişince izleme biter: başkası bu sekmede yöneticinin izlemesiyle açılmasın.
  if (id !== kisiId) izlemeBitir();
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
    .then(tanitimaDon);
};

/** Oturumu açan kişinin kendisi; izlemede de (şerit, izlemenin sahibi). */
export function useGercekBen(): Kisi | undefined {
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

/**
 * Oturumdaki kişi; örnek veri sıfırlanıp kişi silinmişse oturum yok sayılıyor.
 * İzlemede izlenen kişi: menü, ana sayfa ve yetkiler onunki, yazış kapalı
 * (veri.ts → kaydet). İzleme yalnız tam yöneticinin; başkasında kalmış iz
 * silinir.
 */
export function useBen(): Kisi | undefined {
  const gercek = useGercekBen();
  const iz = useSyncExternalStore(izlemeAboneOl, izlenenKisi);
  const v = useVeri();
  const izlenen = iz && gercek?.hesapYoneticisi && iz !== gercek.id ? kisiBul(v, iz) : undefined;
  const gecersiz = !!iz && !!gercek && !izlenen;
  useEffect(() => {
    if (gecersiz) izlemeBitir();
  }, [gecersiz]);
  return izlenen ?? gercek;
}
