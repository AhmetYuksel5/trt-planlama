import { useSyncExternalStore } from "react";
import type { Anahtar } from "./dil";
import { GERCEK, firebaseYukle } from "./kip";

/*
 * Yapay zeka kapısının istemcisi (worker/, belgeler/yapay-zeka.md).
 * Veritabanı Firebase'de kalıyor; kapı yalnız sağlayıcı anahtarını saklayıp
 * isteği iletiyor. Tarayıcı her isteğe kişinin Firebase oturum belgesini
 * koyuyor, yetkiyi ve günlük sınırı kapı denetliyor.
 *
 * Demoda kapıya gidilmiyor: örnek kayıtla gerçek bir sağlayıcı
 * çağrılmasın. "Kısalt" demoda metnin ilk cümlesini veriyor, ayar
 * kaydedilmiyor.
 */

export const YZ_OZELLIKLERI = ["kisalt"] as const;
export type YzOzellik = (typeof YZ_OZELLIKLERI)[number];

export type SaglayiciTuru = "anthropic" | "openai";
export interface YzSaglayici {
  id: string;
  ad: string;
  tur: SaglayiciTuru;
  adres?: string;
  model: string;
  aktif: boolean;
  /** Kayıtlı anahtarın son dört hanesi; anahtarın kendisi tarayıcıya hiç gelmiyor. */
  anahtarSonu?: string;
  /** Yalnız gönderirken: yeni anahtar; boş metin siler, yoksa eskisi kalır. */
  anahtar?: string;
}
export interface YzOzellikAyari {
  acik: boolean;
  saglayici?: string;
  birimler: string[];
  gunlukSinir: number;
}
export interface YzAyar {
  saglayicilar: YzSaglayici[];
  ozellikler: Partial<Record<YzOzellik, YzOzellikAyari>>;
  kullanim?: Partial<Record<YzOzellik, number>>;
}

export type YzSonuc<T> = { tamam: true; veri: T } | { tamam: false; hata: string; ayrinti?: string };

/* Kapının adresi; deneme için bu tarayıcıda değiştirilebiliyor (firebase-ayar.ts'teki gibi). */
const DENEME = "trt-planlama-yz";
const ADRES = "https://yz.plannersflow.net";
const adres = () => {
  try {
    return localStorage.getItem(DENEME) || ADRES;
  } catch {
    return ADRES;
  }
};

const istek = async <T>(yol: string, method = "GET", govde?: unknown): Promise<YzSonuc<T>> => {
  const belge = await (await firebaseYukle()).oturumBelgesi().catch(() => null);
  if (!belge) return { tamam: false, hata: "oturum" };
  let r: Response;
  try {
    r = await fetch(`${adres()}${yol}`, {
      method,
      headers: { authorization: `Bearer ${belge}`, ...(govde === undefined ? {} : { "content-type": "application/json" }) },
      body: govde === undefined ? undefined : JSON.stringify(govde),
    });
  } catch {
    return { tamam: false, hata: "baglanti" };
  }
  const j = (await r.json().catch(() => null)) as (T & { hata?: string; ayrinti?: string }) | null;
  if (!r.ok || !j) return { tamam: false, hata: j?.hata ?? "baglanti", ...(j?.ayrinti ? { ayrinti: j.ayrinti } : {}) };
  return { tamam: true, veri: j };
};

/* --- Kişinin kullanabildiği özellikler: oturum boyunca bir kez soruluyor, kullanım sonrası tazeleniyor --- */

type Durum = Partial<Record<YzOzellik, { kalan: number; sinir: number }>>;
let durum: Durum | null = null;
let soruluyor = false;
const dinleyiciler = new Set<() => void>();
const yay = () => dinleyiciler.forEach((f) => f());

const DEMO_DURUM: Durum = { kisalt: { kalan: 50, sinir: 50 } };

export const yzDurumuTazele = async () => {
  if (!GERCEK) {
    durum = DEMO_DURUM;
    yay();
    return;
  }
  if (soruluyor) return;
  soruluyor = true;
  const r = await istek<{ ozellikler: Durum }>("/durum");
  soruluyor = false;
  // Kapıya ulaşılamıyorsa (henüz kurulmadı) özellikler görünmüyor.
  durum = r.tamam ? r.veri.ozellikler : {};
  yay();
};

/** Özellik bu kişiye açık mı; açıksa bugün kalan hakkı. */
export const useYz = (o: YzOzellik) => {
  const d = useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      if (durum === null) void yzDurumuTazele();
      return () => dinleyiciler.delete(f);
    },
    () => durum,
  );
  return d?.[o] ?? null;
};

/* Demoda kısaltma: ilk cümle, en çok yirmi sözcük. */
const demoKisalt = (metin: string) => {
  const cumle = metin.trim().split(/(?<=[.!؟?])\s+/)[0] ?? metin;
  const s = cumle.split(/\s+/);
  return s.length > 20 ? `${s.slice(0, 20).join(" ")}…` : cumle;
};

export const yzCalistir = async (o: YzOzellik, metin: string): Promise<YzSonuc<string>> => {
  if (!GERCEK) return { tamam: true, veri: demoKisalt(metin) };
  const r = await istek<{ sonuc: string; kalan: number }>("/calistir", "POST", { ozellik: o, girdi: { metin } });
  if (r.tamam && durum?.[o]) {
    durum = { ...durum, [o]: { ...durum[o]!, kalan: r.veri.kalan } };
    yay();
  }
  return r.tamam ? { tamam: true, veri: r.veri.sonuc } : r;
};

/* --- Yönetici ayarı (yalnız gerçek kipte; tam yönetici) --- */

export const yzAyarOku = () => istek<YzAyar>("/ayar");
export const yzAyarYaz = async (a: YzAyar) => {
  const r = await istek<YzAyar>("/ayar", "PUT", { saglayicilar: a.saglayicilar, ozellikler: a.ozellikler });
  // Ayar kişinin kendi hakkını da değiştirebilir (özellik açıldı, sınır değişti).
  if (r.tamam) void yzDurumuTazele();
  return r;
};
/** Sağlayıcının model listesi (tam yönetici); `anahtar` yalnız bu istekte kullanılıyor, saklanmıyor. */
export const yzModeller = (g: { saglayici?: string; tur: SaglayiciTuru; adres?: string; anahtar?: string }) => istek<{ modeller: string[] }>("/modeller", "POST", g);
export const yzSaglayiciDene = (id: string) => istek<{ tamam: true }>("/dene", "POST", { saglayici: id });

/* Kapının hata kodları ekranda kişinin dilinde. */
const HATA: Record<string, Anahtar> = {
  oturum: "yzHataOturum",
  kisi: "yzHataKisi",
  baglanti: "yzHataBaglanti",
  kapali: "yzHataKapali",
  gunlukSinir: "yzSinirDoldu",
  anahtar: "yzHataAnahtar",
  sinir: "yzHataSinir",
  red: "yzHataRed",
  bos: "yzHataSaglayici",
  saglayici: "yzHataSaglayici",
  girdi: "yzHataGirdi",
  yetki: "yzHataYetki",
  adres: "yzHataAdres",
  model: "yzHataModel",
};
export const yzHataMetni = (t: (k: Anahtar) => string, kod: string) => t(HATA[kod] ?? "yzHataSaglayici");
