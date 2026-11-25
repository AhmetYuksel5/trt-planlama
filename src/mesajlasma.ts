import { izinBirimi } from "./yapi";
import { paketinMasasi } from "./yetki";
import type { BirimId, Durum, Kisi, Mesaj, Oneri, Paket } from "./veri";

/*
 * Mesajlar (kullanıcı: muhabir görevlendirilen paketi için yazışmaya yazdı,
 * Programlar'a bildirim gitti ama mesaj bulunamadı; yazışma yalnız önerinin
 * penceresinde katlıydı, paket ve masa sayfasında yoktu). Yazışma işin
 * kendisine bağlı: öneri pakete dönünce aynı konuşma sürer (konu öneri),
 * önerisiz paketin konusu paketin kendisi. Katılanlar işin sorumlularından:
 * muhabir, Planlama, öneriyi giren ve paket masanın takibindeyse o masa.
 * Saf: yetki ve ekran aynı kuralı okur. Posta'dan ayrı (kullanıcı).
 */

export interface MesajKonusu {
  oneriId?: string;
  paketId?: string;
}

/** Konunun adresteki ve okuma izindeki anahtarı. */
export const konuAnahtari = (k: MesajKonusu) => (k.oneriId ? `o-${k.oneriId}` : `p-${k.paketId}`);
export const anahtarKonusu = (a: string): MesajKonusu | null =>
  a.startsWith("o-") ? { oneriId: a.slice(2) } : a.startsWith("p-") ? { paketId: a.slice(2) } : null;

/** Paketin yazışması: önerisi varsa önerininki (konuşma kopmasın), yoksa kendisi. */
export const paketKonusu = (p: Pick<Paket, "id" | "oneriId">): MesajKonusu => (p.oneriId ? { oneriId: p.oneriId } : { paketId: p.id });

export const mesajKonusu = (m: Pick<Mesaj, "oneriId" | "paketId">): MesajKonusu => (m.oneriId ? { oneriId: m.oneriId } : { paketId: m.paketId });

export const konuMesajlari = (d: Pick<Durum, "mesajlar">, k: MesajKonusu): Mesaj[] =>
  d.mesajlar.filter((m) => (k.oneriId ? m.oneriId === k.oneriId : !m.oneriId && m.paketId === k.paketId)).sort((a, b) => a.zaman.localeCompare(b.zaman));

export const konuOnerisi = (d: Pick<Durum, "oneriler">, k: MesajKonusu): Oneri | undefined => (k.oneriId ? d.oneriler.find((o) => o.id === k.oneriId) : undefined);

/** Konunun işi süren paketi: önerinin iptal edilmemiş son paketi. */
export const konuPaketi = (d: Pick<Durum, "paketler">, k: MesajKonusu): Paket | undefined =>
  k.paketId ? d.paketler.find((p) => p.id === k.paketId) : d.paketler.filter((p) => p.oneriId === k.oneriId && p.durum !== "iptal").pop() ?? d.paketler.filter((p) => p.oneriId === k.oneriId).pop();

export const konuMuhabiri = (d: Pick<Durum, "oneriler" | "paketler">, k: MesajKonusu): string | undefined =>
  konuOnerisi(d, k)?.muhabirId ?? konuPaketi(d, k)?.muhabirId;

/* Masanın takibindeki ya da masa kolundaki paketin masası. */
export const konuMasasi = (d: Pick<Durum, "paketler">, k: MesajKonusu): BirimId | undefined => {
  const p = konuPaketi(d, k);
  return p && p.durum !== "iptal" ? paketinMasasi(p) : undefined;
};

/** Ekranda konunun adı: Strap, yoksa Header ya da paketin başlığı. */
export const konuBasligi = (d: Pick<Durum, "oneriler" | "paketler">, k: MesajKonusu): string => {
  const o = konuOnerisi(d, k);
  const p = konuPaketi(d, k);
  return o?.paketBasligi || o?.haberBasligi || p?.baslik || "";
};

/** İşin sayfası: süren paket varsa paketin sayfası, yoksa önerinin. */
export const konuSayfasi = (d: Pick<Durum, "oneriler" | "paketler">, k: MesajKonusu): string => {
  const p = konuPaketi(d, k);
  if (p && (p.durum !== "iptal" || !k.oneriId)) return `#/paketler/${p.id}`;
  return k.oneriId ? `#/oneriler/${k.oneriId}` : "#/mesajlar";
};

/*
 * Yazışmaya katılan: muhabirin kendisi, öneriyi giren ya da talimatı veren,
 * Planlama (öneri değerlendiren; "gibi" çalışan birim de) ve tam yönetici,
 * paket masanın takibindeyse masanın üyesi. Kısıtlı kişi yalnız kendi işinde.
 */
export const konuKatilimcisi = (k: Kisi | undefined, d: Pick<Durum, "oneriler" | "paketler">, konu: MesajKonusu, degerlendirir: boolean): boolean => {
  if (!k || k.pasif) return false;
  const muhabir = konuMuhabiri(d, konu);
  if (!muhabir) return false;
  if (k.id === muhabir) return true;
  if (k.birim === "muhabir" || k.kontrolBekliyor) return false;
  const o = konuOnerisi(d, konu);
  if (o && (k.id === o.giren || k.id === o.talimatVeren)) return true;
  if (degerlendirir || k.hesapYoneticisi) return true;
  const masa = konuMasasi(d, konu);
  return !!masa && izinBirimi(k.birim) === masa;
};

/*
 * Bildirim: yazan dışındaki taraflara. Muhabir yazdıysa Planlama'ya ve
 * masaya (birim), öneriyi Planlama dışından giren kişiye; öbürü yazdıysa
 * muhabire ve yazanın birimi olmayan Planlama/masaya. Birden çok birim
 * virgülle (`veri.sahip`, yetki.ts → bildirimMi).
 */
export const mesajAlicilari = (ben: Kisi, d: Pick<Durum, "oneriler" | "paketler" | "kisiler">, konu: MesajKonusu): Record<string, string> => {
  const muhabir = konuMuhabiri(d, konu);
  const masa = konuMasasi(d, konu);
  const o = konuOnerisi(d, konu);
  const benimBirim = izinBirimi(ben.birim);
  const disaridan = o?.giren && o.giren !== ben.id && d.kisiler.find((x) => x.id === o.giren)?.birim !== "planlama" ? o.giren : "";
  const kime = [ben.id === muhabir ? "" : muhabir, disaridan].filter((x): x is string => !!x);
  const sahip = (["planlama", masa] as (BirimId | undefined)[]).filter((b): b is BirimId => !!b && b !== benimBirim);
  return { ...(kime.length && { kime: [...new Set(kime)].join(",") }), ...(sahip.length && { sahip: [...new Set(sahip)].join(",") }) };
};

/* --- Okunmamış: kişi başına konu konu son bakış (postaOkuma.ts'in kalıbı) --- */

export interface MesajOkuma {
  /** Bundan önceki mesajlar okunmuş sayılır (ilk açılışta eskiler birden okunmamış görünmesin). */
  taban: string;
  /** Konu anahtarı → son bakış. */
  k: Record<string, string>;
}

export const okunmamisMi = (o: MesajOkuma | undefined, ben: Kisi, m: Mesaj): boolean => {
  if (m.kisiId === ben.id) return false;
  const son = o?.k[konuAnahtari(mesajKonusu(m))] ?? o?.taban;
  return !son || m.zaman > son;
};

export interface KonuOzeti {
  konu: MesajKonusu;
  anahtar: string;
  mesajlar: Mesaj[];
  son: Mesaj;
  okunmamis: number;
}

/** Kişinin katıldığı, mesajı olan konular; en yeni mesaj önce. */
export const kisininKonulari = (d: Pick<Durum, "mesajlar" | "oneriler" | "paketler" | "mesajOkunan">, ben: Kisi, degerlendirir: boolean): KonuOzeti[] => {
  const gruplar = new Map<string, Mesaj[]>();
  for (const m of d.mesajlar) {
    const a = konuAnahtari(mesajKonusu(m));
    gruplar.set(a, [...(gruplar.get(a) ?? []), m]);
  }
  const okuma = d.mesajOkunan?.[ben.id];
  return [...gruplar]
    .flatMap(([anahtar, l]) => {
      const konu = anahtarKonusu(anahtar)!;
      if (!konuKatilimcisi(ben, d, konu, degerlendirir)) return [];
      const mesajlar = [...l].sort((a, b) => a.zaman.localeCompare(b.zaman));
      return [{ konu, anahtar, mesajlar, son: mesajlar[mesajlar.length - 1], okunmamis: mesajlar.filter((m) => okunmamisMi(okuma, ben, m)).length }];
    })
    .sort((a, b) => b.son.zaman.localeCompare(a.son.zaman));
};

export const okunmamisMesajSayisi = (d: Pick<Durum, "mesajlar" | "oneriler" | "paketler" | "mesajOkunan">, ben: Kisi, degerlendirir: boolean): number =>
  kisininKonulari(d, ben, degerlendirir).reduce((t, x) => t + x.okunmamis, 0);
