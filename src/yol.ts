import { useEffect, useState } from "react";

/**
 * Adres çubuğundaki `#/nextday/nd-yarin/cikti` ile açık sayfayı eşler.
 *
 * Kütüphane yerine adresin kendisi: GitHub Pages alt klasörden sunuyor,
 * `#` sonrası sunucuya gitmediği için her sayfa tazelenince yerinde
 * açılıyor; tarayıcının geri tuşu da bedavaya çalışıyor. Bağlantı
 * paylaşılınca karşı taraf aynı kaydı açıyor (yetkisi varsa).
 */
export interface Yol {
  sayfa: string;
  id?: string;
  alt?: string;
}

const cozumle = (): Yol => {
  const [sayfa = "", id, alt] = location.hash.replace(/^#\/?/, "").split("/");
  return {
    sayfa: sayfa || "ana",
    id: id ? decodeURIComponent(id) : undefined,
    alt: alt ? decodeURIComponent(alt) : undefined,
  };
};

export function useYol(): Yol {
  const [yol, ayarla] = useState<Yol>(cozumle);
  useEffect(() => {
    const dinle = () => {
      ayarla(cozumle());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", dinle);
    return () => window.removeEventListener("hashchange", dinle);
  }, []);
  return yol;
}

/* --- Workspace bölmesi (gömülü kip) --- */

/*
 * Workspace'in her bölmesi uygulamanın kendisi, iframe'de `?bolme=1` ile
 * açılıyor: menü ve üst çubuk yok, sayfa kendi içinde geziniyor. Adres
 * tek başına yetmiyor; bölmeden yeni sekmeye açılan bağlantı da aynı
 * adresi taşıyor ve orada normal kabukla açılmalı.
 */
export const GOMULU = (() => {
  try {
    return new URLSearchParams(location.search).has("bolme") && window.frameElement !== null;
  } catch {
    return false;
  }
})();

/** Bölmenin şimdiki yolu, `#/` olmadan. */
export const simdikiYol = () => location.hash.replace(/^#\/?/, "");

/** Bölmeden üst pencereye: bölme nerede, geri gidebilir mi. */
export interface BolmeBildirimi {
  tur: "trt-bolme";
  yol: string;
  geri: boolean;
}
/** Bölmeden üst pencereye: arama penceresini aç. Bölmenin içindeki tuşlar üst pencereye ulaşmıyor. */
export interface BolmeAramasi {
  tur: "trt-bolme-ara";
}
/** Üst pencereden bölmeye: bölmenin kendi geçmişinde geri git ya da başka sayfa aç. */
export type BolmeKomutu = { tur: "trt-bolme-geri" } | { tur: "trt-bolme-git"; yol: string };

/*
 * Çerçeveler tarayıcı geçmişini üst pencereyle paylaşıyor: bölmede her
 * tıklama tarayıcının geri tuşuna bir adım ekler, `history.back()` da başka
 * bölmenin adımını geri alabilirdi. Bu yüzden bölme geçmişi büyütmeden
 * (`location.replace`) geziniyor ve önceki yolları kendi yığınında
 * tutuyor; tarayıcının geri tuşu workspace'ten çıkar, bölmenin "Geri"si
 * yalnız o bölmeyi geri alır.
 */
const YIGIN_EN_COK = 50;
const yigin: string[] = [];
let oncekiHash = GOMULU ? location.hash : "";
let geriGidiyor = false;

const bildirUste = () => {
  const m: BolmeBildirimi = { tur: "trt-bolme", yol: simdikiYol(), geri: yigin.length > 0 };
  window.parent.postMessage(m, location.origin);
};

const yerine = (hash: string) => {
  if (hash === location.hash) return;
  location.replace(hash);
};

export const bolmeGeri = () => {
  const onceki = yigin.pop();
  if (onceki === undefined) return;
  geriGidiyor = true;
  yerine(onceki);
};

if (GOMULU) {
  document.documentElement.classList.add("gomulu");
  window.addEventListener("hashchange", () => {
    if (geriGidiyor) geriGidiyor = false;
    else {
      yigin.push(oncekiHash);
      if (yigin.length > YIGIN_EN_COK) yigin.shift();
    }
    oncekiHash = location.hash;
    bildirUste();
  });
  /*
   * Sıradan bağlantı da geçmişi büyütmesin. Bağlantıların bir kısmı satır
   * tıklamasıyla çakışmasın diye olayın yayılmasını durduruyor; belge
   * düzeyinde tıklama dinlemek onları kaçırıyor. Navigation API her
   * gezinmeyi tıklamadan sonra görüyor: geçmişe ekleyen adres değişimi
   * iptal edilip yerinde yapılıyor. API'si olmayan tarayıcıda tıklama
   * dinleniyor; yeni sekme, indirme ve değiştirici tuşlar tarayıcıda kalıyor.
   */
  const gezinme = (window as unknown as { navigation?: EventTarget }).navigation;
  if (gezinme) {
    gezinme.addEventListener("navigate", (olay) => {
      const e = olay as Event & { navigationType: string; hashChange: boolean; cancelable: boolean; destination: { url: string } };
      if (e.navigationType !== "push" || !e.hashChange || !e.cancelable) return;
      e.preventDefault();
      yerine(new URL(e.destination.url).hash);
    });
  } else {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href?.startsWith("#") || a.target || a.hasAttribute("download")) return;
      e.preventDefault();
      yerine(href);
    });
  }
  window.addEventListener("message", (e: MessageEvent<BolmeKomutu>) => {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    if (e.data?.tur === "trt-bolme-geri") bolmeGeri();
    else if (e.data?.tur === "trt-bolme-git") {
      // Bölmeye başka sayfa açıldı: eski sayfanın geçmişi yeni sayfaya ait değil.
      yigin.length = 0;
      geriGidiyor = true;
      if (`#/${e.data.yol}` === location.hash) {
        geriGidiyor = false;
        bildirUste();
      } else yerine(`#/${e.data.yol}`);
    }
  });
  window.addEventListener("trt-yol", bildirUste);
  document.addEventListener("keydown", (e) => {
    // Tuşun yeri (code): Arapça klavyede de K tuşu.
    if (!(e.ctrlKey || e.metaKey) || e.code !== "KeyK") return;
    e.preventDefault();
    const m: BolmeAramasi = { tur: "trt-bolme-ara" };
    window.parent.postMessage(m, location.origin);
  });
  bildirUste();
}

export const git = (yol: string) => {
  if (GOMULU) yerine(`#/${yol}`);
  else location.hash = `#/${yol}`;
};

/**
 * Geçmişe adım eklemeden gider: yeni workspace seçim sayfasından ve kapanan
 * workspace'ten çıkış. Tarayıcının Geri tuşu yarım kalmış seçime ya da
 * artık olmayan workspace'e dönmesin.
 */
export const yerineGit = (yol: string) => location.replace(`#/${yol}`);

/**
 * Sayfayı yeniden çizmeden adresi günceller (takvimin görünümü ve günü):
 * tazeleyince yerinde açılsın, geçmişe adım eklenmesin. Bölme de yerini
 * üst pencereye bildirsin diye olay yayıyor; `replaceState` kendisi olay
 * çıkarmıyor.
 */
export const yerindeDegistir = (yol: string) => {
  history.replaceState(null, "", `#/${yol}`);
  if (GOMULU) oncekiHash = location.hash;
  window.dispatchEvent(new Event("trt-yol"));
};
