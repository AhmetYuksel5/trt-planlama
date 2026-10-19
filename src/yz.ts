import { useSyncExternalStore } from "react";
import type { Anahtar } from "./dil";
import { izlemede } from "./izleme";
import { GERCEK, firebaseYukle } from "./kip";
import type { Bicim, YzGenel } from "./veri";

/*
 * Yapay zeka kapısının istemcisi (worker/, belgeler/yapay-zeka.md).
 * Veritabanı Firebase'de kalıyor; kapı yalnız sağlayıcı anahtarını saklayıp
 * isteği iletiyor. Tarayıcı her isteğe kişinin Firebase oturum belgesini
 * koyuyor, yetkiyi ve günlük sınırı kapı denetliyor.
 *
 * Demoda kapıya gidilmiyor: örnek kayıtla gerçek bir sağlayıcı
 * çağrılmasın. "Kısalt" demoda metnin ilk cümlesini veriyor, "Biçimle" ve
 * "Haber değeri" metinden türeyen sabit bir sonuç; ayar kaydedilmiyor.
 */

export const YZ_OZELLIKLERI = ["kisalt", "bicimle", "haberDegeri", "takipMetni"] as const;
export type YzOzellik = (typeof YZ_OZELLIKLERI)[number];

export type SaglayiciTuru = "anthropic" | "openai";
export interface YzSaglayici {
  id: string;
  ad: string;
  tur: SaglayiciTuru;
  adres?: string;
  model: string;
  /** Claude: anahtar bir çalışma alanına bağlı değilse o alanın kimliği (kapı `anthropic-workspace-id` başlığında gönderiyor). */
  calismaAlani?: string;
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
  /** Yöneticinin kendi yönergesi; kapıdaki varsayılan yönergenin arkasına ekleniyor. */
  yonerge?: string;
  /** Haber değeri ölçütleri; boşsa varsayılanlar (dil.ts → yzVarsayilanKriterler). */
  kriterler?: string[];
  /** İnternet aramasının sınırlandığı siteler (alan adı); boşsa bütün web. */
  alanlar?: string[];
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
  // JSON olmayan yanıtta (Cloudflare'in kendi hata sayfası) HTTP durumu ayrıntıda: neden en azından kodla görünsün.
  if (!r.ok || !j) return { tamam: false, hata: j?.hata ?? "baglanti", ...(j?.ayrinti ? { ayrinti: j.ayrinti } : !j ? { ayrinti: `HTTP ${r.status}` } : {}) };
  return { tamam: true, veri: j };
};

/* --- Kişinin kullanabildiği özellikler: oturum boyunca bir kez soruluyor, kullanım sonrası tazeleniyor --- */

type Durum = Partial<Record<YzOzellik, { kalan: number; sinir: number }>>;
let durum: Durum | null = null;
let soruluyor = false;
let soruldu = 0;
const dinleyiciler = new Set<() => void>();
const yay = () => dinleyiciler.forEach((f) => f());

const DEMO_DURUM: Durum = Object.fromEntries(YZ_OZELLIKLERI.map((o) => [o, { kalan: 50, sinir: 50 }]));

export const yzDurumuTazele = async () => {
  if (!GERCEK) {
    durum = DEMO_DURUM;
    yay();
    return;
  }
  if (soruluyor) return;
  soruluyor = true;
  soruldu = Date.now();
  const r = await istek<{ ozellikler: Durum }>("/durum");
  soruluyor = false;
  // Kapıya ulaşılamıyorsa (henüz kurulmadı) özellikler görünmüyor.
  durum = r.tamam ? r.veri.ozellikler : {};
  yay();
};

/*
 * Kapalı görünen durum bir süre sonra yeniden soruluyor: sayfa açıkken
 * özellik başka sekmede açılınca ya da kapıya o an ulaşılamayınca düğme
 * sayfa yenilenene kadar hiç çıkmıyordu.
 */
const bosVeEski = () => !!durum && !Object.keys(durum).length && Date.now() - soruldu > 15_000;
if (typeof window !== "undefined") window.addEventListener("focus", () => bosVeEski() && void yzDurumuTazele());

/** Özellik bu kişiye açık mı; açıksa bugün kalan hakkı. */
export const useYz = (o: YzOzellik) => {
  const d = useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      if (durum === null || bosVeEski()) void yzDurumuTazele();
      return () => dinleyiciler.delete(f);
    },
    () => durum,
  );
  // İzlemede kapı yöneticinin oturumuyla çalışırdı; izlenen kişinin hakkı ölçülemez, sonuç da kaydedilemez.
  if (izlemede()) return null;
  return d?.[o] ?? null;
};

/* Önerinin kapıya giden alanları; kapı her birini ayrıca sınırlıyor (worker/src/ozellikler.ts). */
export interface YzOneriGirdisi {
  haberBasligi: string;
  paketBasligi?: string;
  gelisme: string;
  /** Muhabirin şehri, Arapça; plan satırının "YER"i. */
  yer?: string;
  ulke?: string;
  bicim?: string;
  kaynak?: string;
  tarih?: string;
}
export interface YzBicimGirdisi extends YzOneriGirdisi {
  /** Başlık havuzu: uyan dosya varsa Header aynı adla gelsin. */
  basliklar: string[];
  /** Planlama'nın önceki düzeltmeleri: muhabirin yazdığı → son hal. */
  ornekler: { once: Pick<YzOneriGirdisi, "haberBasligi" | "paketBasligi" | "gelisme">; sonra: Pick<YzOneriGirdisi, "haberBasligi" | "paketBasligi" | "gelisme"> }[];
}
export interface YzBicimSonucu {
  haberBasligi: string;
  paketBasligi: string;
  gelisme: string;
  bicim?: Bicim;
}
export interface YzDegerSonucu {
  kriterler: { ad: string; puan: number; gerekce: string }[];
  genel: YzGenel;
  ozet: string;
}
export interface YzKaynak {
  url: string;
  baslik: string;
}
export interface YzTakipSonucu {
  metin: string;
  /** Sağlayıcının alıntıladığı sayfalar; modelin yazdığı değil. */
  kaynaklar: YzKaynak[];
}
interface Girdiler {
  kisalt: { metin: string };
  /** `gecmis`: bizim son satırlarımız, model yenisini yazsın; `bugun` İstanbul günü. */
  takipMetni: { baslik: string; gun: 1 | 3 | 7; bugun: string; gecmis: string[] };
  bicimle: YzBicimGirdisi;
  /** `dil`: gerekçeler isteyenin arayüz dilinde; `kriterler` yalnız demoda (kapı kendi ayarından okuyor). */
  haberDegeri: YzOneriGirdisi & { dil: string; kriterler?: string[] };
}
interface Sonuclar {
  kisalt: string;
  takipMetni: YzTakipSonucu;
  bicimle: YzBicimSonucu;
  haberDegeri: YzDegerSonucu;
}

/* Demoda kısaltma: ilk cümle, en çok yirmi sözcük. */
const demoKisalt = (metin: string) => {
  const cumle = metin.trim().split(/(?<=[.!؟?])\s+/)[0] ?? metin;
  const s = cumle.split(/\s+/);
  return s.length > 20 ? `${s.slice(0, 20).join(" ")}…` : cumle;
};
const ilkSozcukler = (m: string, n: number) => m.trim().split(/\s+/).slice(0, n).join(" ");

/* Demoda puan metinden türüyor: aynı öneri her seferinde aynı görüşü alsın. */
const ozet = (m: string) => [...m].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const demo = <O extends YzOzellik>(o: O, g: Girdiler[O]): Sonuclar[O] => {
  if (o === "kisalt") return demoKisalt((g as Girdiler["kisalt"]).metin) as Sonuclar[O];
  // Demoda internete çıkılmıyor: bizdeki son satır, kaynaksız.
  if (o === "takipMetni") {
    const t = g as Girdiler["takipMetni"];
    return { metin: t.gecmis[0] ?? t.baslik, kaynaklar: [] } as YzTakipSonucu as Sonuclar[O];
  }
  if (o === "bicimle") {
    const b = g as YzBicimGirdisi;
    const metin = `${b.haberBasligi} ${b.gelisme}`;
    const header = b.basliklar.find((x) => metin.includes(x)) ?? ilkSozcukler(b.haberBasligi, 5);
    return { haberBasligi: header, paketBasligi: b.paketBasligi?.trim() || ilkSozcukler(b.gelisme, 8), gelisme: demoKisalt(b.gelisme) } as Sonuclar[O];
  }
  const h = g as Girdiler["haberDegeri"];
  const tohum = ozet(`${h.haberBasligi}${h.gelisme}`);
  const kriterler = (h.kriterler ?? []).map((ad, i) => ({ ad, puan: 2 + ((tohum >>> (i * 3)) % 4), gerekce: "—" }));
  const ort = kriterler.reduce((a, k) => a + k.puan, 0) / (kriterler.length || 1);
  return { kriterler, genel: ort >= 4 ? "yuksek" : ort >= 3 ? "orta" : "dusuk", ozet: "" } as Sonuclar[O];
};

/** Özelliği çalıştırır; sonuç kısaltmada metin, öbürlerinde alanlı nesne. */
export const yzIste = async <O extends YzOzellik>(o: O, girdi: Girdiler[O]): Promise<YzSonuc<Sonuclar[O]>> => {
  if (!GERCEK) return { tamam: true, veri: demo(o, girdi) };
  const r = await istek<{ sonuc: Sonuclar[O]; kalan: number }>("/calistir", "POST", { ozellik: o, girdi });
  if (r.tamam && durum?.[o]) {
    durum = { ...durum, [o]: { ...durum[o]!, kalan: r.veri.kalan } };
    yay();
  }
  return r.tamam ? { tamam: true, veri: r.veri.sonuc } : r;
};

export const yzCalistir = (o: "kisalt", metin: string) => yzIste(o, { metin });

/* --- Yönetici ayarı (yalnız gerçek kipte; tam yönetici) --- */

export const yzAyarOku = () => istek<YzAyar>("/ayar");
export const yzAyarYaz = async (a: YzAyar) => {
  const r = await istek<YzAyar>("/ayar", "PUT", { saglayicilar: a.saglayicilar, ozellikler: a.ozellikler });
  // Ayar kişinin kendi hakkını da değiştirebilir (özellik açıldı, sınır değişti).
  if (r.tamam) void yzDurumuTazele();
  return r;
};
/** Sağlayıcının model listesi (tam yönetici); `anahtar` yalnız bu istekte kullanılıyor, saklanmıyor. */
export const yzModeller = (g: { saglayici?: string; tur: SaglayiciTuru; adres?: string; anahtar?: string; calismaAlani?: string }) => istek<{ modeller: string[] }>("/modeller", "POST", g);
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
  arama: "yzHataArama",
  bicim: "yzHataBicim",
  kimlik: "yzHataBicim",
  tur: "yzHataBicim",
  kapi: "yzHataKapi",
  calismaAlani: "yzHataCalismaAlani",
};
export const yzHataMetni = (t: (k: Anahtar) => string, kod: string) => t(HATA[kod] ?? "yzHataSaglayici");
