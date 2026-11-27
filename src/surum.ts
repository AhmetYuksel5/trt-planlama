import { useSyncExternalStore } from "react";
import { GOMULU } from "./yol";

/*
 * Yeni sürüm (kullanıcı: güncellemeler yapılıyor ama kullanıcılar sayfayı
 * yenilemiyor; yenilemeden de güncel sürüm onlara gitsin). Derleme kimliği
 * uygulamada (`__SURUM__`) ve `surum.json`'da; sayfa dosyayı beş dakikada bir,
 * sekmeye dönünce ve ağ geri gelince önbelleksiz okur. Farklıysa:
 * - yarım iş yoksa sekme arka plandayken, önündeyse beş dakika dokunulmayınca
 *   kendini yeniler;
 * - yarım iş varsa (açık pencere, odaktaki yazı alanı, son üç dakikada yazılmış
 *   metin) yenilemez, üst çubukta "Yeni sürüm · Yenile" çıkar, kişi basar.
 * Firebase okuması değil, sitenin kendi dosyası; kota yemez. Bölmede (iframe)
 * çalışmaz: üst pencere yenilenince bölmeler de yenileniyor.
 */
declare const __SURUM__: string;

const DENETIM_ARASI = 5 * 60_000;
const BOS_SURE = 5 * 60_000;
const YAZI_SURESI = 3 * 60_000;

let yeni = false;
let sonYazi = 0;
let sonDokunus = Date.now();
const dinleyiciler = new Set<() => void>();
const yay = () => dinleyiciler.forEach((f) => f());

export const useYeniSurum = () =>
  useSyncExternalStore(
    (f) => (dinleyiciler.add(f), () => dinleyiciler.delete(f)),
    () => yeni,
  );

/** Yarım iş: yenileme onu silerdi. Kaydedilmiş taslaklar (posta, parça metni) zaten tarayıcıda. */
export const yarimIsVar = () => {
  if (document.querySelector("dialog[open]")) return true;
  const a = document.activeElement as HTMLElement | null;
  if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return true;
  return Date.now() - sonYazi < YAZI_SURESI;
};

const yenile = () => location.reload();

/* Yenilemeyi dener: yeni sürüm varsa ve kişiyi bölmeyecekse. */
const dene = () => {
  if (!yeni || yarimIsVar()) return;
  if (document.hidden || Date.now() - sonDokunus > BOS_SURE) yenile();
};

export const surumDenetle = async () => {
  if (yeni) return dene();
  try {
    const r = await fetch(`./surum.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return;
    const j = (await r.json()) as { surum?: string };
    if (j.surum && j.surum !== __SURUM__) {
      yeni = true;
      yay();
      dene();
    }
  } catch {
    // Ağ yoksa bir sonraki denetimde.
  }
};

export const yeniSurumuYukle = () => yenile();

export const surumIzle = () => {
  // Geliştirmede dosya yok; bölmede üst pencere yeniliyor.
  if (GOMULU || import.meta.env.DEV) return;
  const yazdi = () => (sonYazi = Date.now());
  const dokundu = () => (sonDokunus = Date.now());
  document.addEventListener("input", yazdi, true);
  for (const o of ["pointerdown", "keydown", "wheel", "touchstart"]) document.addEventListener(o, dokundu, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => void (document.hidden ? dene() : surumDenetle()));
  window.addEventListener("online", () => void surumDenetle());
  setInterval(() => void surumDenetle(), DENETIM_ARASI);
  // Yeni sürüm bilinirken kişinin işi bitince (dokunmayı bırakınca) yenilensin.
  setInterval(dene, 30_000);
  void surumDenetle();
};
