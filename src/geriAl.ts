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
const ayni = (x: unknown, y: unknown) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null);

/*
 * Gerçekleşmiş dış olayın izi (kullanıcı: geri alma görevlendirme postasının
 * "gitti" işaretini de siliyordu, posta ise geri alınmıyor): PKG geri bildirimi
 * ve özel yayın görev postası (`takdirBildirimi`), planın postası (`gonderildi`),
 * çağrı hatırlatması (`hatirlatmalar`). Geri alma bunlara dokunmaz.
 */
const POSTA_IZI = new Set(["takdirBildirimi", "gonderildi", "hatirlatmalar"]);
const nesneMi = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
/** Posta izleri atılmış kopya (karşılaştırma için), iç içe dizilerde de. */
const izsiz = (x: unknown): unknown =>
  Array.isArray(x) ? x.map(izsiz) : nesneMi(x) ? Object.fromEntries(Object.entries(x).filter(([k]) => !POSTA_IZI.has(k)).map(([k, v]) => [k, izsiz(v)])) : x;
/** Eski hale dönen öğe posta izlerini şimdiki halinden alır; iç içe dizilerde kimlikle eşlenir. */
const izleriKoru = (eski: unknown, simdi: unknown): unknown => {
  if (Array.isArray(eski)) {
    if (!Array.isArray(simdi)) return eski;
    const s = new Map(simdi.filter(nesneMi).map((x) => [x.id, x]));
    return eski.map((x) => (nesneMi(x) && s.has(x.id) ? izleriKoru(x, s.get(x.id)) : x));
  }
  if (!nesneMi(eski) || !nesneMi(simdi)) return eski;
  const yeni: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(eski)) if (!POSTA_IZI.has(k)) yeni[k] = izleriKoru(v, simdi[k]);
  for (const k of POSTA_IZI) if (simdi[k] !== undefined) yeni[k] = simdi[k];
  return yeni;
};
/** Öğede (ya da iç içe dizilerinde) gitmiş posta izi var mı. */
const postaIziVar = (x: unknown): boolean =>
  Array.isArray(x) ? x.some(postaIziVar) : nesneMi(x) ? Object.entries(x).some(([k, v]) => (POSTA_IZI.has(k) && v !== undefined) || postaIziVar(v)) : false;

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
    for (const [id, [x, i]] of eskiler) {
      const y = yeniler.get(id);
      // Yalnız posta izi değiştiyse (posta gitti) geri alınacak düzenleme değil.
      if (y !== x && !(y && ayni(izsiz(x), izsiz(y)))) degisimler.push({ alan, id, once: x, sonra: y, sira: i });
    }
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

/**
 * Adımı güncel kayda geri uyguluyor. Değişen öğe o arada başka biçime
 * girdiyse (başkası düzenledi) null: üzerine yazılmıyor. Saf.
 */
export const geriUygula = (d: Durum, adim: GeriAdim): Durum | null => {
  for (const c of adim.degisimler) {
    const simdi = (d[c.alan] as unknown as Oge[]).find((x) => x.id === c.id);
    // Sonradan giden posta (iz) başkasının düzenlemesi sayılmaz.
    if (!ayni(izsiz(simdi), izsiz(c.sonra))) return null;
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
      else if (i >= 0) liste[i] = izleriKoru(c.once, liste[i]) as Oge;
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
  /** Silinecek kayıtların postası gitmiş: posta geri alınmaz. */
  postaGitti: boolean;
}
/* Silinecek öğeler: üstte eklenmiş olanlar, iç içe dizilerde eskisinde olmayanlar. */
const icSilinenler = (once: unknown, sonra: unknown): unknown[] => {
  if (Array.isArray(sonra)) {
    const eski = new Map((Array.isArray(once) ? once : []).filter(nesneMi).map((x) => [x.id, x]));
    return sonra.flatMap((x) => (!nesneMi(x) || !("id" in x) ? [] : eski.has(x.id) ? icSilinenler(eski.get(x.id), x) : [x]));
  }
  if (nesneMi(sonra)) {
    const o = nesneMi(once) ? once : {};
    return Object.entries(sonra).flatMap(([k, x]) => icSilinenler(o[k], x));
  }
  return [];
};
/* d verilirse silinecekler kaydın şimdiki halinden: posta adımdan sonra gitmiş olabilir. */
export const adimOzeti = (adim: GeriAdim, d?: Durum): AdimOzeti => {
  const simdi = (c: Degisim) => (d ? ((d[c.alan] as unknown as Oge[] | undefined)?.find((x) => x.id === c.id) ?? c.sonra) : c.sonra);
  let silinecek = 0;
  let degisecek = 0;
  for (const c of adim.degisimler) {
    if (!c.once) silinecek++;
    else {
      degisecek++;
      if (c.sonra) silinecek += icSilinenler(c.once, c.sonra).length;
    }
  }
  const silinenler = adim.degisimler.flatMap((c) => (!c.once ? [simdi(c)] : c.sonra ? icSilinenler(c.once, simdi(c)) : []));
  return { silinecek, degisecek, disari: adim.degisimler.some((c) => PLAN_DISI.has(c.alan)), postaGitti: silinenler.some(postaIziVar) };
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
