import { useSyncExternalStore } from "react";
import type { Yazi } from "./dil";
import { ORNEK } from "./ornek";

/**
 * Veri katmanı: kayıt tipleri, depo, yükle/kaydet.
 *
 * Kayıtlar "İlk taslak promptu"nun 7. maddesindeki gibi mantıksal olarak
 * ayrı: başlık havuzu, günlük plan, gelişme, öneri, personel,
 * görevlendirme, hazır paket, paket önerisi, canlı yayın. Aynı merkezi
 * başlık farklı günlerin planlarında kullanılır; o günün gelişmeleri ve
 * atamaları o planın kendi kayıtlarıdır, başlık havuzu kirlenmez.
 *
 * Kayıt içeriği (başlık, gelişme, açıklama, script) düz metin ve Arapça:
 * kanal Arapça yayın yapıyor, planlama hep Arapça yazılıyor. Arayüz dili
 * yalnız menüyü ve etiketleri değiştiriyor, içeriği değil. Latin harfli
 * özel isim içerikte serbest; dil denetimi yok. Tek istisna kişi adı:
 * rehberdeki kimlik, arayüz dilinin yazımıyla (Latin ya da Arapça) okunuyor.
 *
 * Bu sürümde her şey tarayıcıda (localStorage) duruyor ve örnek veriyle
 * açılıyor. Çok kullanıcılı sunucu katmanı geldiğinde yalnız bu dosyanın
 * yükle/kaydet kısmı değişecek; ekranlar `useVeri` ve `eylemler.ts`'i aynı
 * biçimde çağırmaya devam edecek.
 */

/* --- Birimler ve kişiler --- */

export const BIRIMLER = ["planlama", "newsdesk", "newsgathering", "program", "output", "media", "muhabir", "yonetim"] as const;
export type Birim = (typeof BIRIMLER)[number];

export type Rol = "yonetici" | "personel";

/* Çalışma ekibi bölümündeki görev ayrımı promptun 4.3 maddesinden; kalanlar birimlerin kendi unvanları. */
export const GOREVLER = [
  "muhabir",
  "editor",
  "tercuman",
  "newsdesk",
  "programEditoru",
  "sunucu",
  "planlamaci",
  "dilDenetmeni",
  "mediaManager",
  "koordinator",
  "yonetici",
  /* Yönetim birimindeki müdürler; sorumlu oldukları birimler yetki.ts → MUDURLUKLER. */
  "inputMuduru",
  "programMuduru",
] as const;
export type Gorev = (typeof GOREVLER)[number];

export type KisiDurum = "gorevde" | "sahada" | "yolda" | "izinli";

/*
 * Şehir → ülke. Öneri formundaki "ülke" ile hazır paketin "ŞEHİR" alanı
 * aynı tablodan beslensin diye tek yerde.
 */
export const SEHIRLER = {
  gazze: "filistin",
  kudus: "filistin",
  ramallah: "filistin",
  beyrut: "lubnan",
  sam: "suriye",
  halep: "suriye",
  kahire: "misir",
  bagdat: "irak",
  erbil: "irak",
  amman: "urdun",
  doha: "katar",
  riyad: "suudi",
  sana: "yemen",
  hartum: "sudan",
  trablus: "libya",
  tunus: "tunus",
  rabat: "fas",
  istanbul: "turkiye",
  ankara: "turkiye",
  tahran: "iran",
  kiev: "ukrayna",
  washington: "abd",
  newyork: "abd",
  bruksel: "belcika",
  londra: "ingiltere",
} as const;
/*
 * Muhabirin şehri olmayan ama çalışabildiği ülkeler ("çalışabildiği diğer
 * ülkeler"): kurumun muhabir listesinde Paris, São Paulo gibi üsler de var.
 */
const EK_ULKELER = ["kuveyt", "bae", "bahreyn", "umman", "cezayir", "fransa", "almanya", "rusya", "brezilya", "azerbaycan"] as const;

export type Sehir = keyof typeof SEHIRLER;
export type Ulke = (typeof SEHIRLER)[Sehir] | (typeof EK_ULKELER)[number];
export const ULKELER = [...new Set([...Object.values(SEHIRLER), ...EK_ULKELER])] as Ulke[];

/*
 * Muhabirin üretebildiği haber türleri (biçim). Rapordaki üç kol
 * (haber, feature/ekonomi, program) işin hangi akıştan geçtiğini söylüyor;
 * biçim ise ekrana nasıl çıktığını: aynı kolda PKG de canlı bağlantı da
 * olabilir. Bu yüzden ayrı alan.
 */
export const BICIMLER = ["pkg", "canli", "voxpop", "walktalk", "feature", "derinlemesine", "ozelRoportaj", "hikayem"] as const;
export type Bicim = (typeof BICIMLER)[number];

/* Kurumun muhabir listesindeki ayrım: kadrolu, retainer (aylık sabit), serbest (paket başına). */
export const CALISMA_BICIMLERI = ["kadrolu", "retainer", "serbest"] as const;
export type CalismaBicimi = (typeof CALISMA_BICIMLERI)[number];

export interface Kisi {
  id: string;
  ad: Yazi;
  birim: Birim;
  rol: Rol;
  gorev: Gorev;
  /** Ana görev yeri; ülkesi `SEHIRLER`'den. */
  sehir: Sehir;
  diller: string[];
  telefon: string;
  /** Kurumsal e-posta. */
  eposta: string;
  kisiselEposta?: string;
  /** Uydu ya da yapım şirketi irtibatı: canlı bağlantıda aranacak masa. */
  irtibat?: string;
  /** Üç harfli kısaltma; slug'ın sonunda (GAZA-HEALTH-PKG-OHA). */
  kisaltma: string;
  calisma: CalismaBicimi;
  /** Küçültülmüş fotoğraf (data URL); sunucu fazında dosya deposuna taşınır. */
  foto?: string;
  digerUlkeler: Ulke[];
  bicimler: Bicim[];
  durum: KisiDurum;
  /** Newsdesk içinde ücret alanlarını görebilen kişi (rapor bölüm 9). */
  ucretYetkisi?: boolean;
}

/* --- İçerik türü: haftalık akışın üç kolu (rapor bölüm 4) bu alandan ayrılıyor. --- */

export const ICERIK_TURLERI = ["haber", "feature", "ekonomi", "program"] as const;
export type IcerikTuru = (typeof ICERIK_TURLERI)[number];

/* --- Merkezi haber başlıkları --- */

export interface Baslik {
  id: string;
  ad: string;
  ulke?: Ulke;
  aktif: boolean;
}

/* --- Next Day planı --- */

export const PLAN_DURUMLARI = ["taslak", "toplantida", "onayli", "devralindi"] as const;
export type PlanDurum = (typeof PLAN_DURUMLARI)[number];

/*
 * Çalışma ekibindeki görevler, kurumun bugünkü Next Day çıktısından
 * (الأجندة الإخبارية): منتج تنفيذي، منتج نشرات، مذيعون، قسم المراسلين،
 * منتج مقابلات، مترجم. Vardiya o çıktıdaki gibi GMT başlangıç saati;
 * ekranda "04G", "1145G" biçiminde yazılıyor.
 */
export const EKIP_GOREVLERI = ["yapimciSef", "bultenYapimcisi", "sunucu", "muhabirMasasi", "roportajYapimcisi", "tercuman", "editor", "diger"] as const;
export type EkipGorevi = (typeof EKIP_GOREVLERI)[number];

export interface EkipUyesi {
  kisiId: string;
  gorev: EkipGorevi;
  vardiya: string;
}

/** Başlık altındaki muhabir: yeri ve canlı saati o güne ait ("القدس / ..."; "06G"). */
export interface PlanMuhabiri {
  kisiId: string;
  yer?: string;
  saat?: string;
}

/** Bir başlığın o günkü plandaki yeri: sıra listedeki yerinden, muhabirler o güne ait. */
export interface PlanBasligi {
  id: string;
  baslikId: string;
  muhabirler: PlanMuhabiri[];
}

export interface NextDayPlan {
  id: string;
  tarih: string;
  durum: PlanDurum;
  ekip: EkipUyesi[];
  gorevlendirmeler: string[];
  hazirPaketler: string[];
  basliklar: PlanBasligi[];
  kopyaKaynagi?: string;
  olusturan: string;
  olusturma: string;
}

export const KAYNAK_TURLERI = ["muhabir", "ajans", "resmi", "medya", "diger"] as const;
export type KaynakTuru = (typeof KAYNAK_TURLERI)[number];

/**
 * Gelişme: "طهران / ..." satırı. Bir başlığa bağlıysa haber gündeminde o
 * başlığın altında; bağlı değilse çıktının sonundaki "takipler"
 * (متابعات) bölümünde duruyor.
 */
export interface Gelisme {
  id: string;
  planId: string;
  planBaslikId?: string;
  yer?: string;
  metin: string;
  kaynakTuru: KaynakTuru;
  kaynakAdi: string;
  tarih: string;
  onerenId?: string;
  oneriId?: string;
}

export interface CanliYayin {
  id: string;
  planId: string;
  /** Boşsa planın genel "canlı yayınlar ve etkinlikler" bölümünde durur. */
  planBaslikId?: string;
  konu: string;
  aciklama: string;
  tarih: string;
  saatGmt: string;
  yer: string;
  muhabirId?: string;
  notlar: string;
}

/* --- Hazır paket arşivi: üretimi bitmiş, plana yalnız seçilerek girer. --- */

export interface HazirPaket {
  id: string;
  sehir: Sehir;
  baslik: string;
  muhabirId: string;
  aciklama: string;
  /** Arşivdeki dosya adı, çıktıda başlığın altında: GAZA-PRESERVESEEDS-PKG-MAH. */
  slug: string;
  tur: IcerikTuru;
  sure: string;
  hazirlanma: string;
}

/* --- Muhabir hareketleri: görevlendirme, seyahat, izin. Planlar bunlara bağlantı tutar. --- */

export const HAREKET_TURLERI = ["gorevlendirme", "seyahat", "izin", "diger"] as const;
export type HareketTuru = (typeof HAREKET_TURLERI)[number];
export type GorevlendirmeDurum = "talep" | "onayli" | "suruyor" | "bitti";

export interface Gorevlendirme {
  id: string;
  kisiId: string;
  tur: HareketTuru;
  yer: string;
  baslangic: string;
  bitis: string;
  aciklama: string;
  durum: GorevlendirmeDurum;
}

/*
 * Yurt içi ya da yurt dışı ayrımı yok: görevlendirme, seyahat ve diğer
 * hareketler aynı işlemle yürüyen saha görevlendirmesi. İzin saha işi
 * değil, yalnız izin listesinde görünüyor.
 */
export const sahaGorevi = (g: Gorevlendirme) => g.tur !== "izin";

/* --- Öneri: muhabirin gönderdiği haliyle korunur, değerlendirme ayrı alanlarda. --- */

export const ONERI_DURUMLARI = ["yeni", "degerlendiriliyor", "planaEklendi", "reddedildi", "sonra"] as const;
export type OneriDurum = (typeof ONERI_DURUMLARI)[number];
export const KANALLAR = ["sistem", "eposta", "telefon", "mesaj"] as const;
export type Kanal = (typeof KANALLAR)[number];

export interface Oneri {
  id: string;
  /** Yöneticinin haber talimatında boş: muhabiri Planlama plana eklerken atıyor. */
  muhabirId?: string;
  /** Haber talimatıysa talimatı veren yönetici; Planlama reddedemiyor, öncelikli. */
  talimatVeren?: string;
  ulke: Ulke;
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  sahaGerekli: boolean;
  zaman: string;
  kanal: Kanal;
  hedefTarih: string;
  durum: OneriDurum;
  cagriId?: string;
  baslikId?: string;
  planId?: string;
  paketId?: string;
  gerekce?: string;
  geriDonus?: boolean;
  /** E-postayla geldiyse kaynağı olan yanıt; orijinal metin orada değişmeden duruyor. */
  yanitId?: string;
}

/*
 * Öneri çağrısı kurumun bugünkü e-postası gibi: Kime planlama grubu (bütün
 * planlama yazışmayı görsün), muhabirler BCC'de (her muhabirin yazışması
 * müstakil kalsın). Konudaki etiket yanıtları doğru çağrıya bağlıyor.
 */
export interface Cagri {
  id: string;
  tarih: string;
  metin: string;
  sonSaat: string;
  olusturan: string;
  zaman: string;
  kime: string;
  /** BCC'deki muhabirler (kişi kimliği). */
  bcc: string[];
  /** Konudaki eşleştirme etiketi: ND-20260930. */
  etiket: string;
}

/*
 * Çağrıya gelen e-posta yanıtı: olduğu gibi saklanıyor (alıntısız yeni
 * metin ve tam metin). Öneri buradan türüyor; yanıt hiç değişmiyor.
 * Sunucu fazında posta kutusunu izleyen hizmet de aynı kaydı yazacak.
 */
export const YANIT_DURUMLARI = ["oneri", "oneriYok", "eslesmedi"] as const;
export type YanitDurum = (typeof YANIT_DURUMLARI)[number];

export interface Yanit {
  id: string;
  cagriId?: string;
  kisiId?: string;
  kimden: string;
  kimdenAd?: string;
  konu: string;
  /** Alıntı ve imza ayıklanmış yeni metin. */
  metin: string;
  /** E-postanın tam metni; ayıklama yanlış kesse de hiçbir şey kaybolmasın. */
  tamMetin: string;
  zaman: string;
  /** Message-ID: aynı e-posta iki kez gelirse ikinci kez işlenmesin. */
  mesajKimligi?: string;
  ekler: string[];
  durum: YanitDurum;
  /** Nereden geldi: posta kutusu (sunucu) ya da elle içe aktarma. */
  kaynak: "posta" | "iceAktarma";
}

/* --- Paket önerisi: birimler arası ortak kayıt (rapor bölüm 7). --- */

export const PAKET_DURUMLARI = ["taslak", "degerlendiriliyor", "onaylandi", "uretimde", "tamamlandi", "iptal"] as const;
export type PaketDurum = (typeof PAKET_DURUMLARI)[number];

export interface Not {
  id: string;
  kisiId: string;
  zaman: string;
  metin: string;
  /** Yöneticinin müdahale notu; listede vurgulu. */
  yonetici?: boolean;
}

export interface Ucret {
  tutar: number;
  para: "USD" | "TRY";
  durum: "bekliyor" | "onaylandi" | "odendi";
}

export interface Paket {
  id: string;
  kod: string;
  planId?: string;
  planBaslikId?: string;
  baslik: string;
  sehir: Sehir;
  muhabirId?: string;
  aciklama: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  teslim?: string;
  yayin?: string;
  durum: PaketDurum;
  slug?: string;
  /** Yalnız "üretimde" iken anlamlı; adımlar `akis.ts`'te. */
  adim?: string;
  sahaGerekli: boolean;
  oneriId?: string;
  metin?: string;
  video?: string;
  klipKodu?: string;
  ucret?: Ucret;
  /** Tamamlanan pakete Newsdesk'in verdiği nitelik puanı (1–5); ölçütü birimle netleşecek. */
  nitelik?: number;
  /*
   * Performans ölçüm noktaları kaydın kendisinde: hareket kaydı sınırlı
   * tutuluyor, eski işin göstergesi onunla birlikte silinmesin.
   */
  /** Muhabire görevin verildiği an ("görev verildi" adımı). */
  gorevZamani?: string;
  /** Muhabirin kendi payını bitirdiği an (video bağlantısı geldi). */
  muhabirTeslimi?: string;
  /** Metnin kontrolden düzeltmeye kaç kez döndüğü. */
  duzeltmeSayisi?: number;
  /** Yöneticinin müdahalesi: her listede rozetli ve başta. */
  oncelikli?: boolean;
  notlar: Not[];
  olusturma: string;
  guncelleme: string;
}

/* --- Haftalık, aylık ve özel planlar: Next Day'e karışmayan ayrı kayıtlar. --- */

export interface PlanKalemi {
  id: string;
  tarih?: string;
  baslik: string;
  tur: IcerikTuru;
  ulke?: Ulke;
  onayli: boolean;
}

export interface HaftalikPlan {
  id: string;
  baslangic: string;
  durum: "hazirlik" | "toplantida" | "onayli";
  kalemler: PlanKalemi[];
}

export interface AylikPlan {
  id: string;
  ay: string;
  durum: "hazirlik" | "onayli";
  kalemler: PlanKalemi[];
}

export interface OzelYayin {
  id: string;
  ad: string;
  tarih: string;
  hazirlik: { id: string; metin: string; tamam: boolean }[];
}

export interface Toplanti {
  id: string;
  ad: string;
  aciklama: string;
  zaman: string;
  birim: Birim;
  onemli?: boolean;
}

export interface Dosya {
  id: string;
  ad: string;
  tur: "docx" | "xlsx" | "pdf";
  guncelleme: string;
}

/* --- Hareket kaydı: metni saklanmaz, dil tablosundaki şablondan üretilir. --- */

export const HAREKET_TIPLERI = [
  "cagriHazirlandi",
  "oneriGeldi",
  "oneriDegerlendirmede",
  "oneriPlanaEklendi",
  "oneriReddedildi",
  "oneriSonra",
  "geriDonus",
  "planOlusturuldu",
  "planKopyalandi",
  "planToplantida",
  "planTaslaga",
  "planOnaylandi",
  "planDevralindi",
  "paketOlusturuldu",
  "paketDegerlendirmede",
  "paketOnaylandi",
  "paketIptal",
  "gorevlendirildi",
  "gorevVerildi",
  "metinGeldi",
  "kontrolEdildi",
  "geriGonderildi",
  "sonScript",
  "videoGeldi",
  "mediayaGonderildi",
  "klipKodu",
  "tamamlandi",
  "notEklendi",
  "nitelikPuanlandi",
  "profilGuncellendi",
  "yanitOneriYok",
  "oneriDuzenlendi",
  "talimatVerildi",
  "paketOncelikli",
  "paketOncelikKalkti",
  "yoneticiNotu",
] as const;
export type HareketTipi = (typeof HAREKET_TIPLERI)[number];

export interface Hareket {
  id: string;
  zaman: string;
  kisiId: string;
  tip: HareketTipi;
  paketId?: string;
  oneriId?: string;
  planId?: string;
  veri?: Record<string, string>;
}

export interface Durum {
  surum: 6;
  kisiler: Kisi[];
  basliklar: Baslik[];
  planlar: NextDayPlan[];
  gelismeler: Gelisme[];
  canliYayinlar: CanliYayin[];
  hazirPaketler: HazirPaket[];
  gorevlendirmeler: Gorevlendirme[];
  oneriler: Oneri[];
  cagrilar: Cagri[];
  yanitlar: Yanit[];
  paketler: Paket[];
  haftalik: HaftalikPlan[];
  aylik: AylikPlan[];
  ozel: OzelYayin[];
  toplantilar: Toplanti[];
  dosyalar: Dosya[];
  hareketler: Hareket[];
  /** Kişi başına son bildirim bakışı; okunmamış sayısı buradan çıkıyor. */
  okundu: Record<string, string>;
  sayac: number;
}

/* --- Saklama ve abonelik --- */

/*
 * Şema değişince anahtar da değişiyor: eski kayıt yeni ekranı bozmasın,
 * örnekten başlansın (v3: içerik Arapça, v4: e-posta yanıtları, v5:
 * görevlendirmede yurt içi/yurt dışı ayrımı yok, hepsi saha görevlendirmesi,
 * v6: yönetici talimatı, öncelik ve yönetici notu).
 */
const SAKLA = "trt-planlama-v6";

const yukle = (): Durum => {
  try {
    const ham = localStorage.getItem(SAKLA);
    if (ham) {
      const d = JSON.parse(ham) as Durum;
      if (d.surum === 6) return d;
    }
  } catch {
    /* bozuk kayıt: örnekten başla */
  }
  return ORNEK();
};

let durum: Durum = yukle();
const dinleyiciler = new Set<() => void>();

export const getir = () => durum;

export const kaydet = (yeni: Durum) => {
  durum = yeni;
  try {
    localStorage.setItem(SAKLA, JSON.stringify(yeni));
  } catch {
    /* saklanamazsa bellekte kalır */
  }
  dinleyiciler.forEach((d) => d());
};

export const sifirla = () => kaydet(ORNEK());

export function useVeri(): Durum {
  return useSyncExternalStore(
    (d) => {
      dinleyiciler.add(d);
      return () => dinleyiciler.delete(d);
    },
    () => durum,
  );
}

export const kimlik = (on: string) => `${on}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* --- Okuma yardımcıları --- */

export const kisiBul = (d: Durum, id?: string) => d.kisiler.find((k) => k.id === id);
export const baslikBul = (d: Durum, id?: string) => d.basliklar.find((b) => b.id === id);
export const planBul = (d: Durum, id?: string) => d.planlar.find((p) => p.id === id);
export const paketBul = (d: Durum, id?: string) => d.paketler.find((p) => p.id === id);
export const oneriBul = (d: Durum, id?: string) => d.oneriler.find((o) => o.id === id);
export const muhabirler = (d: Durum) => d.kisiler.filter((k) => k.birim === "muhabir");
