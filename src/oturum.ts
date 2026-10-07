import { useSyncExternalStore } from "react";
import { kisiBul, useVeri, type Kisi } from "./veri";

/**
 * Demo oturum.
 *
 * Kurum içi kimlik doğrulama henüz kararlaştırılmadı; prototipte giriş
 * ekranından bir kişi seçiliyor, şifre yok. Ekranlar "ben kimim" diye
 * yalnız `useBen()`'e bakıyor; gerçek giriş geldiğinde kişi kimliği bu
 * dosyada oturum çerezinden okunacak, ekranlar değişmeyecek.
 */

const SAKLA = "trt-planlama-oturum";

const oku = () => {
  try {
    return localStorage.getItem(SAKLA);
  } catch {
    return null;
  }
};

let kisiId: string | null = oku();

const dinleyiciler = new Set<() => void>();

/* Çıkış üst pencerede; açık bölmeler ve öbür sekmeler eski kişiyle kalmasın. */
window.addEventListener("storage", (e) => {
  if (e.key !== SAKLA && e.key !== null) return;
  const yeni = oku();
  if (yeni === kisiId) return;
  kisiId = yeni;
  dinleyiciler.forEach((d) => d());
});

const ayarla = (id: string | null) => {
  kisiId = id;
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
