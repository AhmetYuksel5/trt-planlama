import { useSyncExternalStore } from "react";

/*
 * Workspace'in tarayıcıda tutulan anlık görünümü: bölmenin içinde gidilen
 * yer, sekmelide açık bölme, büyütülen bölme. Workspace'in kendisi
 * (bölmeler, yerleşim, boyut) kayıtta; bunlar kayda girseydi bölmede her
 * tıklama kaydı yazar, bütün bölmeler kaydı yeniden okurdu (veri.ts → iz).
 * Dil ve menü gizleme gibi tarayıcıya bağlı; kimlikler kişiye özel
 * olduğundan aynı tarayıcıdaki başka kişinin görünümüyle karışmıyor.
 */
const SAKLA = "trt-planlama-ortam";

interface Gorunum {
  /** Bölme → içinde açık yol. */
  yol: Record<string, string>;
  /** Workspace → sekmelide öndeki bölme. */
  acik: Record<string, string>;
  /** Workspace → büyütülmüş bölme. */
  buyuk: Record<string, string>;
}

const oku = (): Gorunum => {
  try {
    const ham = localStorage.getItem(SAKLA);
    if (ham) {
      const g = JSON.parse(ham) as Partial<Gorunum>;
      return { yol: g.yol ?? {}, acik: g.acik ?? {}, buyuk: g.buyuk ?? {} };
    }
  } catch {
    /* bozuk ya da erişilemez: boş görünümle başla */
  }
  return { yol: {}, acik: {}, buyuk: {} };
};

let gorunum = oku();
const dinleyiciler = new Set<() => void>();

const yaz = (g: Gorunum) => {
  gorunum = g;
  try {
    localStorage.setItem(SAKLA, JSON.stringify(g));
  } catch {
    /* özel pencerede saklanamaz; yalnız bu oturumda geçerli */
  }
  dinleyiciler.forEach((d) => d());
};

const cikar = (r: Record<string, string>, anahtar: string) => {
  const { [anahtar]: _, ...kalan } = r;
  return kalan;
};

export const useOrtamGorunumu = () =>
  useSyncExternalStore(
    (d) => {
      dinleyiciler.add(d);
      return () => dinleyiciler.delete(d);
    },
    () => gorunum,
  );

/** Bölmenin açılışta yükleyeceği yer; yoksa bölmenin sayfası. */
export const bolmeYolu = (bolmeId: string, varsayilan: string) => gorunum.yol[bolmeId] ?? varsayilan;

export const bolmeYolunuYaz = (bolmeId: string, yol: string) => {
  if (gorunum.yol[bolmeId] !== yol) yaz({ ...gorunum, yol: { ...gorunum.yol, [bolmeId]: yol } });
};

export const acikBolmeyiYaz = (ortamId: string, bolmeId: string) => {
  if (gorunum.acik[ortamId] !== bolmeId) yaz({ ...gorunum, acik: { ...gorunum.acik, [ortamId]: bolmeId } });
};

export const buyukBolmeyiYaz = (ortamId: string, bolmeId: string | null) =>
  yaz({ ...gorunum, buyuk: bolmeId ? { ...gorunum.buyuk, [ortamId]: bolmeId } : cikar(gorunum.buyuk, ortamId) });

/* Kapatılan bölme ve silinen workspace'in izi kalmasın. */
export const bolmeyiUnut = (ortamId: string, bolmeId: string) =>
  yaz({
    yol: cikar(gorunum.yol, bolmeId),
    acik: gorunum.acik[ortamId] === bolmeId ? cikar(gorunum.acik, ortamId) : gorunum.acik,
    buyuk: gorunum.buyuk[ortamId] === bolmeId ? cikar(gorunum.buyuk, ortamId) : gorunum.buyuk,
  });

export const ortamiUnut = (ortamId: string, bolmeIdleri: string[]) =>
  yaz({
    yol: Object.fromEntries(Object.entries(gorunum.yol).filter(([id]) => !bolmeIdleri.includes(id))),
    acik: cikar(gorunum.acik, ortamId),
    buyuk: cikar(gorunum.buyuk, ortamId),
  });
