import { useEffect, useSyncExternalStore } from "react";
import { SISTEM, yazisDinleyicileri, type Durum } from "./veri";

/**
 * Plan ekranlarında "geri al": kişinin o planda yaptığı son düzenlemeyi
 * geri çeviriyor.
 *
 * Kaydın tamamı saklanıp geri yazılmıyor; aynı kaydı başkaları da
 * düzenliyor (workspace bölmeleri, gerçek kipte öbür kişiler) ve eski
 * kaydı yazmak onların işini silerdi. Bunun yerine her yazışta yalnız
 * değişen öğeler (önceki ve sonraki halleriyle) tutuluyor; geri alma
 * yalnız onları eski haline döndürüyor. Öğe o arada başkasınca
 * değiştirildiyse geri alma yapılmıyor, üzerine yazmıyor.
 *
 * Yığın bellekte ve pencereye bağlı: sayfa yenilenince boşalıyor. Hareket
 * kaydı geri alınmıyor; geçmiş silinmez, geri alma kendisi ayrı hareket.
 */

/* Kişiye bağlı görünüm tercihleri (harita) ve geçmiş geri alınmıyor. */
const ATLA = new Set<keyof Durum>(["hareketler", "kisiler", "okundu", "anaSayfa", "oneriGorunumu", "ortamlar", "kisayollar", "gundemSepetleri", "postaOkunan", "mesajOkunan", "surum", "sayac", "mesajlar", "yapilar", "yapiTaslaklari"]);
const SINIR = 30;

type Oge = { id: string };
interface Degisim {
  alan: keyof Durum;
  id: string;
  once?: Oge;
  sonra?: Oge;
  /** Öğenin eski kayıttaki sırası; silineni yerine koymak için. */
  sira: number;
}
export interface GeriAdim {
  degisimler: Degisim[];
  /** Yalnız sırası değişen diziler (taşıma): eski kimlik sırası. */
  siralar: Partial<Record<keyof Durum, string[]>>;
}

const diziMi = (x: unknown): x is Oge[] => Array.isArray(x);

/** İki kayıt arasındaki değişen öğeler; değişen yoksa null. Saf. */
export const farkCikar = (eski: Durum, yeni: Durum): GeriAdim | null => {
  const degisimler: Degisim[] = [];
  const siralar: GeriAdim["siralar"] = {};
  for (const alan of Object.keys(yeni) as (keyof Durum)[]) {
    if (ATLA.has(alan)) continue;
    const a = eski[alan];
    const b = yeni[alan];
    if (a === b || !diziMi(a) || !diziMi(b)) continue;
    const eskiler = new Map(a.map((x, i) => [x.id, [x, i] as const]));
    const yeniler = new Map(b.map((x) => [x.id, x]));
    for (const [id, [x, i]] of eskiler) if (yeniler.get(id) !== x) degisimler.push({ alan, id, once: x, sonra: yeniler.get(id), sira: i });
    b.forEach((x, i) => {
      if (!eskiler.has(x.id)) degisimler.push({ alan, id: x.id, sonra: x, sira: i });
    });
    // Taşımada öğeler aynı nesne kalıyor, yalnız sıra değişiyor.
    const ortak = b.filter((x) => eskiler.has(x.id)).map((x) => x.id);
    const eskiSira = a.filter((x) => yeniler.has(x.id)).map((x) => x.id);
    if (ortak.some((id, i) => id !== eskiSira[i])) siralar[alan] = a.map((x) => x.id);
  }
  return degisimler.length || Object.keys(siralar).length ? { degisimler, siralar } : null;
};

const ayni = (x: unknown, y: unknown) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null);

/**
 * Adımı güncel kayda geri uyguluyor. Değişen öğe o arada başka biçime
 * girdiyse (başkası düzenledi) null: üzerine yazılmıyor. Saf.
 */
export const geriUygula = (d: Durum, adim: GeriAdim): Durum | null => {
  for (const c of adim.degisimler) {
    const simdi = (d[c.alan] as unknown as Oge[]).find((x) => x.id === c.id);
    if (!ayni(simdi, c.sonra)) return null;
  }
  const yeni = { ...d } as Record<keyof Durum, unknown>;
  const alanlar = new Set([...adim.degisimler.map((c) => c.alan), ...(Object.keys(adim.siralar) as (keyof Durum)[])]);
  for (const alan of alanlar) {
    const liste = [...(d[alan] as unknown as Oge[])];
    const bu = adim.degisimler.filter((c) => c.alan === alan);
    // Önce eklenenler çıkıyor, değişenler eski haline dönüyor; silinenler eski sıralarıyla yerine giriyor.
    for (const c of bu) {
      const i = liste.findIndex((x) => x.id === c.id);
      if (!c.once) liste.splice(i, 1);
      else if (i >= 0) liste[i] = c.once;
    }
    for (const c of bu.filter((x) => x.once && !liste.some((y) => y.id === x.id)).sort((x, y) => x.sira - y.sira))
      liste.splice(Math.min(c.sira, liste.length), 0, c.once!);
    const sira = adim.siralar[alan];
    if (sira) {
      // Yalnız eski sırada bulunan öğelerin yerleri kendi aralarında diziliyor; sonradan gelen öğe yerinde kalıyor.
      const yer = new Map(sira.map((id, i) => [id, i]));
      const yerler = liste.flatMap((x, i) => (yer.has(x.id) ? [i] : []));
      const dizili = yerler.map((i) => liste[i]).sort((x, y) => yer.get(x.id)! - yer.get(y.id)!);
      yerler.forEach((i, j) => (liste[i] = dizili[j]));
    }
    yeni[alan] = liste;
  }
  return yeni as unknown as Durum;
};

/*
 * Geri almanın neye dokunacağı (kullanıcı: Weekly'de paket ekleyip görevlendirdi,
 * ↶ sormadan hepsini sildi). Silinecek kayıt iç içe dizilerde de sayılıyor:
 * Weekly kalemi planın içinde, kalem eklemenin geri alınması üstte yalnız
 * "değişiklik" görünüyor. Saf.
 */
const PLAN_DISI = new Set<string>(["paketler", "oneriler", "gorevlendirmeler"]);
export interface AdimOzeti {
  silinecek: number;
  degisecek: number;
  /** Paket, öneri ya da görevlendirme de geri alınıyor. */
  disari: boolean;
}
const icSilinen = (once: unknown, sonra: unknown): number => {
  if (Array.isArray(sonra)) {
    const eski = Array.isArray(once) ? once : [];
    const kimlik = (x: unknown) => (x && typeof x === "object" && "id" in x ? String((x as Oge).id) : null);
    const eskiler = new Map(eski.map((x) => [kimlik(x), x]));
    return sonra.reduce((n: number, x) => {
      const id = kimlik(x);
      if (id === null) return n;
      return n + (eskiler.has(id) ? icSilinen(eskiler.get(id), x) : 1);
    }, 0);
  }
  if (sonra && typeof sonra === "object") {
    const o = (once && typeof once === "object" ? once : {}) as Record<string, unknown>;
    return Object.entries(sonra as Record<string, unknown>).reduce((n, [k, x]) => n + icSilinen(o[k], x), 0);
  }
  return 0;
};
export const adimOzeti = (adim: GeriAdim): AdimOzeti => {
  let silinecek = 0;
  let degisecek = 0;
  for (const c of adim.degisimler) {
    if (!c.once) silinecek++;
    else {
      degisecek++;
      if (c.sonra) silinecek += icSilinen(c.once, c.sonra);
    }
  }
  return { silinecek, degisecek, disari: adim.degisimler.some((c) => PLAN_DISI.has(c.alan)) };
};
/* Sormadan geri alınan yalnız plan içindeki, hiçbir şey silmeyen düzeltme. */
export const sorulmali = (o: AdimOzeti) => o.silinecek > 0 || o.disari;

/* --- Yığın: kişi ve plan başına, bu pencerede --- */

const yiginlar = new Map<string, GeriAdim[]>();
/* Geri alınanlar (yinele); yeni bir düzenleme gelince boşalıyor. */
const ileriler = new Map<string, GeriAdim[]>();
let etkin: { anahtar: string; kisiId: string } | null = null;
let susturuldu = false;
const dinleyiciler = new Set<() => void>();
let surum = 0;
const haber = () => {
  surum++;
  for (const f of dinleyiciler) f();
};

const anahtarOf = (kisiId: string, planId: string) => `${kisiId}:${planId}`;

yazisDinleyicileri.add((eski, yeni) => {
  if (susturuldu || !etkin) return;
  // Sistemin kendi yazışı (yarının planını açmak gibi) kişinin düzenlemesi değil.
  const onceki = new Set(eski.hareketler);
  const yeniHareket = yeni.hareketler.filter((h) => !onceki.has(h));
  if (yeniHareket.length && yeniHareket.every((h) => h.kisiId === SISTEM)) return;
  const adim = farkCikar(eski, yeni);
  if (!adim) return;
  const yigin = yiginlar.get(etkin.anahtar) ?? [];
  yiginlar.set(etkin.anahtar, [...yigin, adim].slice(-SINIR));
  ileriler.delete(etkin.anahtar);
  haber();
});

/** Plan ekranı açıkken bu penceredeki düzenlemeler o planın yığınına giriyor. */
export const useGeriAlKaydi = (kisiId: string | undefined, planId: string) => {
  useEffect(() => {
    if (!kisiId) return;
    const bu = { anahtar: anahtarOf(kisiId, planId), kisiId };
    etkin = bu;
    return () => {
      if (etkin === bu) etkin = null;
    };
  }, [kisiId, planId]);
};

export const geriAlinabilir = (kisiId: string, planId: string) => (yiginlar.get(anahtarOf(kisiId, planId))?.length ?? 0) > 0;
export const yinelenebilir = (kisiId: string, planId: string) => (ileriler.get(anahtarOf(kisiId, planId))?.length ?? 0) > 0;
/** Sıradaki geri almaya yığından almadan bakmak (onay sorusu için). */
export const sonAdimaBak = (kisiId: string, planId: string) => yiginlar.get(anahtarOf(kisiId, planId))?.at(-1);
/** Geri alınan adımın tersi ileri yığına; yinelenen adımın tersi geri yığına. */
export const ileriyeEkle = (kisiId: string, planId: string, adim: GeriAdim) => {
  const a = anahtarOf(kisiId, planId);
  ileriler.set(a, [...(ileriler.get(a) ?? []), adim].slice(-SINIR));
  haber();
};
export const geriyeEkle = (kisiId: string, planId: string, adim: GeriAdim) => {
  const a = anahtarOf(kisiId, planId);
  yiginlar.set(a, [...(yiginlar.get(a) ?? []), adim].slice(-SINIR));
  haber();
};
export const ileriAdimiAl = (kisiId: string, planId: string): GeriAdim | undefined => {
  const adim = ileriler.get(anahtarOf(kisiId, planId))?.pop();
  haber();
  return adim;
};
export const useYinelenebilir = (kisiId: string | undefined, planId: string) =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => surum,
  ) >= 0 && !!kisiId && yinelenebilir(kisiId, planId);

export const useGeriAlinabilir = (kisiId: string | undefined, planId: string) =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => surum,
  ) >= 0 && !!kisiId && geriAlinabilir(kisiId, planId);

/** Son adımı yığından alıyor; eylem uygulayamazsa geri koymuyor (kayıt artık başka). */
export const sonAdimiAl = (kisiId: string, planId: string): GeriAdim | undefined => {
  const yigin = yiginlar.get(anahtarOf(kisiId, planId));
  const adim = yigin?.pop();
  haber();
  return adim;
};

/** Geri almanın kendi yazışı yığına girmesin. */
export const sessizce = <T>(f: () => T): T => {
  susturuldu = true;
  try {
    return f();
  } finally {
    susturuldu = false;
  }
};
