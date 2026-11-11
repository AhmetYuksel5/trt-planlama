import { useCallback, useEffect, useState } from "react";

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
    // Kaydırma burada değil (aşağıda, "Geri"): geri tuşunda sayfa bırakılan yerine dönmeli.
    const dinle = () => ayarla(cozumle());
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
      // Bölmede yeni sayfa başından açılsın (üst pencerede bunu aşağıdaki geçmiş damgası yapıyor).
      window.scrollTo(0, 0);
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
export const yerineGit = (yol: string) => {
  // Yerine geçen adım derinliği artırmaz: yoksa "←" uygulamanın dışına geri giderdi.
  yerineGeciyor = true;
  location.replace(`#/${yol}`);
};

/**
 * Sayfayı yeniden çizmeden adresi günceller (takvimin görünümü ve günü):
 * tazeleyince yerinde açılsın, geçmişe adım eklenmesin. Bölme de yerini
 * üst pencereye bildirsin diye olay yayıyor; `replaceState` kendisi olay
 * çıkarmıyor.
 */
export const yerindeDegistir = (yol: string) => {
  // Adımın damgası kalsın (derinlik, kaydırma yeri); yoksa yeni adım sanılır.
  history.replaceState(history.state, "", `#/${yol}`);
  simdikiHash = location.hash;
  if (GOMULU) oncekiHash = location.hash;
  window.dispatchEvent(new Event("trt-yol"));
};

/* --- Geri: tarayıcı geçmişi ve kaydırma yeri --- */

/*
 * Kullanıcı: "geri"ye basınca bazen geldiği yere dönmüyordu. İki neden:
 * sayfadaki "←" bağlantıları sabit listeye gidiyordu (pakete Next Day'den
 * gelinse de paket listesine), ve her adres değişiminde sayfa başa
 * sarılıyordu (geri tuşunda uzun planın başına düşülüyordu). Her geçmiş
 * adımına damga konuyor (`history.state`): kimlik (kaydırma yeri onunla) ve
 * uygulamanın içindeki derinlik. Damgasız adım yeni açılmıştır (başa sar),
 * damgalı adıma geri ya da ileri gelinmiştir (yerine dön).
 */
interface Damga {
  pf: number;
  d: number;
}
const damga = (): Damga | null => {
  const s = history.state as Partial<Damga> | null;
  return s && typeof s.pf === "number" && typeof s.d === "number" ? (s as Damga) : null;
};
let sayac = Date.now();
let derinlik = 0;
let simdikiPf = 0;
/* Ekrandaki adımın adresi: geçiş sırasında (adres değişmiş, ekran henüz değil) gelen kaydırma yazılmasın. */
let simdikiHash = "";
let yerineGeciyor = false;
const kaydirma = new Map<number, number>();
/*
 * Açık katlanır satırlar da adımın parçası (kullanıcı: Organizasyon ›
 * Kişiler'de kişiye girip dönünce birim ve ünvan satırları kapalı açılıyor,
 * sayfa kısalıp başa düşüyordu). Sayfadan çıkarken sayfadaki `<details>`'in
 * hangileri açıksa sırasıyla saklanır, dönünce önce onlar açılır.
 */
const acikSatirlar = new Map<number, number[]>();
const satirlar = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("main details"));

const damgala = (d: number) => {
  const yeni = { pf: ++sayac, d };
  history.replaceState({ ...(history.state as object | null), ...yeni }, "");
  derinlik = d;
  simdikiPf = yeni.pf;
  simdikiHash = location.hash;
};

/* İçerik geç çiziliyor (kayıt, pencere): yer tutana dek birkaç kare yeniden dene. */
const kaydirYerine = (y: number, acik?: number[]) => {
  const bas = performance.now();
  const dene = () => {
    if (acik) {
      const l = satirlar();
      for (const i of acik) if (l[i] && !l[i].open) l[i].open = true;
    }
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) > 2 && performance.now() - bas < 1500) requestAnimationFrame(dene);
  };
  requestAnimationFrame(dene);
};

if (!GOMULU) {
  const ilk = damga();
  if (ilk) {
    derinlik = ilk.d;
    simdikiPf = ilk.pf;
    simdikiHash = location.hash;
  } else damgala(0);
  // Kaydırmayı biz geri getiriyoruz; tarayıcının kendi düzeltmesi geri tuşunda eski sayfada kaydırıp yanlış yeri yazdırıyordu.
  try {
    history.scrollRestoration = "manual";
  } catch {
    /* desteklemeyen tarayıcı */
  }
  let kare = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (kare) return;
      kare = requestAnimationFrame(() => {
        kare = 0;
        // Yalnız ekrandaki adımın adresindeyken yaz: bağlantıda ve geri tuşunda adres önce değişiyor,
        // tarayıcı o arada sayfayı kaydırıyor; o kaydırma çıkılan ya da dönülen adımın yerini ezerdi.
        if (simdikiPf && location.hash === simdikiHash) kaydirma.set(simdikiPf, window.scrollY);
      });
    },
    { passive: true },
  );
  window.addEventListener("hashchange", () => {
    // Ekran henüz çıkılan sayfa (React yeni sayfayı sonra çiziyor): açık satırları onun adımına yaz.
    if (simdikiPf) acikSatirlar.set(simdikiPf, satirlar().flatMap((d, i) => (d.open ? [i] : [])));
    const s = damga();
    if (s) {
      derinlik = s.d;
      simdikiPf = s.pf;
      simdikiHash = location.hash;
      const y = kaydirma.get(s.pf);
      if (y !== undefined) kaydirYerine(y, acikSatirlar.get(s.pf));
      return;
    }
    damgala(yerineGeciyor ? derinlik : derinlik + 1);
    yerineGeciyor = false;
    window.scrollTo(0, 0);
  });
}

/** Uygulamanın içinden mi gelindi: "←" o zaman bir önceki sayfaya döner. */
export const geriVarMi = () => (GOMULU ? yigin.length > 0 : derinlik > 0);

/**
 * Sayfadaki "←" bağlantısının tıklaması: uygulamanın içinden gelindiyse
 * geldiği yere döner, bağlantıyla doğrudan açılmış sayfada `href`'e
 * (sabit listeye) gider. Yeni sekme ve değiştirici tuşlar tarayıcıda kalır.
 */
export const geriTikla = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; preventDefault: () => void }) => {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !geriVarMi()) return;
  e.preventDefault();
  if (GOMULU) bolmeGeri();
  else history.back();
};

/* --- Açık pencere ve geri tuşu --- */

/*
 * Kullanıcı: telefonda pencere açıkken geri tuşu pencereyi kapatmıyor,
 * sayfadan çıkıyordu. Pencere açılınca geçmişe adım eklenir (aynı adres,
 * damgası kopyalanır); geri tuşu o adımı alınca pencere kapanır. Pencere
 * ×, Esc ya da kaydetle kapanırsa kendi adımını geri alır, geçmişte boş
 * adım kalmaz. İç içe pencere yığın gibi. Bölmede geçmiş üst pencereyle
 * ortak, eklenmez.
 */
interface AcikPencere {
  no: number;
  kapat: () => void;
}
const acikPencereler: AcikPencere[] = [];
let pencereSayac = 0;
let gormezdenGel = 0;

export const pencereAdimi = (kapat: () => void): (() => void) => {
  if (GOMULU) return () => undefined;
  const no = ++pencereSayac;
  history.pushState({ ...(history.state as object | null), pencere: no }, "");
  acikPencereler.push({ no, kapat });
  return () => {
    const i = acikPencereler.findIndex((p) => p.no === no);
    if (i < 0) return; // geri tuşuyla kapandı, adımı zaten gitti
    acikPencereler.splice(i, 1);
    // Pencereden başka sayfaya gidildiyse adım arkada kaldı; dokunulmaz.
    if ((history.state as { pencere?: number } | null)?.pencere === no) {
      gormezdenGel++;
      history.back();
    }
  };
};

if (!GOMULU)
  window.addEventListener("popstate", () => {
    if (gormezdenGel) {
      gormezdenGel--;
      return;
    }
    const ust = (history.state as { pencere?: number } | null)?.pencere ?? 0;
    while (acikPencereler.length && acikPencereler[acikPencereler.length - 1].no > ust) acikPencereler.pop()!.kapat();
  });

/* --- Sayfadaki seçimler geçmiş adımında --- */

/*
 * Kullanıcı: sekme, süzgeç, ay seçimi geri dönünce varsayılana
 * sıfırlanıyordu. Seçim o geçmiş adımının durumuna yazılır
 * (`history.state.s`): geri ya da ileri gelinince sayfa bırakıldığı
 * seçimlerle açılır, menüden yeniden girilince (yeni adım) varsayılanla.
 * Anahtar sayfaya özgü olmalı ("paketler:durum").
 */
type Secimler = Record<string, unknown>;
const secimler = (): Secimler => ((history.state as { s?: Secimler } | null)?.s ?? {});

export function useAdimDurumu<T>(anahtar: string, varsayilan: T | (() => T)): [T, (v: T | ((eski: T) => T)) => void] {
  const [deger, setDeger] = useState<T>(() => {
    const s = secimler();
    return anahtar in s ? (s[anahtar] as T) : typeof varsayilan === "function" ? (varsayilan as () => T)() : varsayilan;
  });
  const yaz = useCallback(
    (v: T | ((eski: T) => T)) =>
      setDeger((eski) => {
        const yeni = typeof v === "function" ? (v as (e: T) => T)(eski) : v;
        try {
          const st = (history.state as { s?: Secimler } | null) ?? {};
          history.replaceState({ ...st, s: { ...st.s, [anahtar]: yeni } }, "");
        } catch {
          /* saklanamayan değer (çok büyük) seçimi yalnız ekranda tutar */
        }
        return yeni;
      }),
    [anahtar],
  );
  return [deger, yaz];
}
