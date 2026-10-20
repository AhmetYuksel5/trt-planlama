import { useSyncExternalStore } from "react";
import type { Yazi } from "./dil";
import { izlemede } from "./izleme";
import { GERCEK, sunucuyaEsitMi } from "./kip";
import { ORNEK } from "./ornek";
import { bugun, gunEkle } from "./tarih";
import type { Yapi } from "./yapi";

/**
 * Veri katmanı: kayıt tipleri, depo, yükle/kaydet.
 *
 * Kayıtlar "İlk taslak promptu"nun 7. maddesindeki gibi mantıksal olarak
 * ayrı: başlık havuzu, günlük plan, gelişme, öneri, personel,
 * görevlendirme, paket önerisi (stok haberi dahil), canlı yayın. Aynı merkezi
 * başlık farklı günlerin planlarında kullanılır; o günün gelişmeleri ve
 * atamaları o planın kendi kayıtlarıdır, başlık havuzu kirlenmez.
 *
 * Kayıt içeriği (başlık, gelişme, açıklama, script) düz metin ve Arapça:
 * kanal Arapça yayın yapıyor, planlama hep Arapça yazılıyor. Arayüz dili
 * yalnız menüyü ve etiketleri değiştiriyor, içeriği değil. Latin harfli
 * özel isim içerikte serbest; dil denetimi yok. Tek istisna kişi adı:
 * rehberdeki kimlik, arayüz dilinin yazımıyla (Latin ya da Arapça) okunuyor.
 *
 * Demo kipinde her şey tarayıcıda (localStorage) duruyor ve örnek veriyle
 * açılıyor. Gerçek kipte (kip.ts) kayıt Firestore'da; yalnız bu dosyanın
 * yükle/kaydet kısmı farklı (depo/firebase.ts), ekranlar `useVeri` ve
 * `eylemler.ts`'i aynı biçimde çağırıyor.
 */

/* --- Birimler ve kişiler --- */

/*
 * Ekonomi ayrı birim: haftalık planda ekonomi kolunun stok önerilerine
 * toplantıdan önce bakıyor (ön inceleme). Üretim akışında masası yok;
 * ekonomi paketini Planlama'nın feature/stok ekibi yürütüyor (akis.ts).
 */
export const BIRIMLER = ["planlama", "newsdesk", "newsgathering", "program", "ekonomi", "output", "media", "muhabir", "yonetim"] as const;
export type Birim = (typeof BIRIMLER)[number];
/** Yerleşik birim ya da yöneticinin açtığı birim (yapi.ts). */
export type BirimId = Birim | (string & {});

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
  /* Planlama'nın feature/stok ekibi: zamana bağlı olmayan paketin üretimini yürütüyor. */
  "stokTakip",
] as const;
export type Gorev = (typeof GOREVLER)[number];
/** Yerleşik ünvan ya da yöneticinin açtığı ünvan (yapi.ts). */
export type GorevId = Gorev | (string & {});

export type KisiDurum = "gorevde" | "sahada" | "yolda" | "izinli";

/*
 * Şehir → ülke. Öneri formundaki "ülke" ile paketin "ŞEHİR" alanı
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
  elhalil: "filistin",
  nablus: "filistin",
  musul: "irak",
  portsudan: "sudan",
  maskat: "umman",
  kuveyt: "kuveyt",
  cezayir: "cezayir",
  nuaksot: "moritanya",
  mogadisu: "somali",
  encamena: "cad",
  addisababa: "etiyopya",
  islamabad: "pakistan",
  kabil: "afganistan",
  moskova: "rusya",
  paris: "fransa",
  madrid: "ispanya",
  amsterdam: "hollanda",
  saraybosna: "bosna",
  saopaulo: "brezilya",
  buenosaires: "arjantin",
} as const;
/*
 * Muhabirin şehri olmayan ama çalışabildiği ülkeler ("çalışabildiği diğer
 * ülkeler"): kurumun muhabir listesinde Paris, São Paulo gibi üsler de var.
 */
const EK_ULKELER = ["kuveyt", "bae", "bahreyn", "umman", "cezayir", "fransa", "almanya", "rusya", "brezilya", "azerbaycan"] as const;

export type YerlesikSehir = keyof typeof SEHIRLER;
/* Yerleşik şehir ya da kayda eklenen (`Durum.sehirler`): muhabirin yeri listede yoksa profilinden eklenebiliyor. */
export type Sehir = YerlesikSehir | (string & {});
export type Ulke = (typeof SEHIRLER)[YerlesikSehir] | (typeof EK_ULKELER)[number];
export const ULKELER = [...new Set([...Object.values(SEHIRLER), ...EK_ULKELER])] as Ulke[];

/*
 * Kayda eklenen şehir. Adın Arapçası zorunlu (plan satırı ve çıktı Arapça);
 * Türkçesi ve İngilizcesi yoksa ekranda Arapçası görünüyor.
 */
export interface SehirTanimi {
  id: string;
  ad: { ar: string; tr?: string; en?: string };
  ulke: Ulke;
}

/*
 * Muhabirin üretebildiği haber türleri (biçim). Rapordaki üç kol
 * (haber, feature/ekonomi, program) işin hangi akıştan geçtiğini söylüyor;
 * biçim ise ekrana nasıl çıktığını: aynı kolda PKG de canlı bağlantı da
 * olabilir. Bu yüzden ayrı alan.
 */
export const BICIMLER = ["pkg", "canli", "voxpop", "walktalk", "feature", "derinlemesine", "ozelRoportaj", "hikayem"] as const;
export type Bicim = (typeof BICIMLER)[number];

/*
 * Öneride haber türünün yanında "Takip": muhabir konuyu yalnız izlediğini
 * bildiriyor, paket önermiyor. Öneri aynı anda muhabirin takiplerine de
 * giriyor (`Oneri.takipId`); Planlama türü değiştirince gerçek haber
 * önerisine dönüşüyor. Muhabirin profilindeki ve paketteki biçim değil,
 * bu yüzden BICIMLER'e girmiyor.
 */
export const TAKIP_BICIMI = "takip";
export type OneriBicimi = Bicim | typeof TAKIP_BICIMI;
/** Paket ve haftalık kalem gerçek biçim taşıyor; takip oraya biçim olarak geçmiyor. */
export const paketBicimi = (b?: OneriBicimi): Bicim | undefined => (b === TAKIP_BICIMI ? undefined : b);

/* Kurumun muhabir listesindeki ayrım: kadrolu, retainer (aylık sabit), serbest (paket başına). */
export const CALISMA_BICIMLERI = ["kadrolu", "retainer", "serbest"] as const;
export type CalismaBicimi = (typeof CALISMA_BICIMLERI)[number];

export interface Kisi {
  id: string;
  ad: Yazi;
  birim: BirimId;
  rol: Rol;
  gorev: GorevId;
  /** Ana görev yeri; ülkesi `SEHIRLER`'den ya da kayda eklenen şehirden (etiketler.ts → sehirUlkesi). */
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
  /** Gerçek kip: hesabı kapatılmış kişi; girse de kayda erişemiyor (firestore.rules). */
  pasif?: boolean;
  /** Gerçek kip: davet gönderebilen, hesapları yöneten kişi (Kullanıcılar sayfası). */
  hesapYoneticisi?: boolean;
  /** Gerçek kip: kendini kayıt bağlantısıyla kaydeden kişinin bağlantısı. */
  kayitKodu?: string;
  /** Bilgilerini kendisi girdi, hesap yöneticisi henüz bakmadı; "Düzenle"de kaydedince kalkar. */
  kontrolBekliyor?: boolean;
  /**
   * Gerçek kip, pilot: yalnız adı olan kişi; giriş yapamaz, işini Planlama
   * onun adına görür. "Hesaba bağla" ile davet edilip etkinleşince kaydı
   * hesabına geçer (eylemler.ts → hesabaGecir).
   */
  hesapsiz?: boolean;
  /** Hesaba bağlanırken bırakılan hesapsız kaydın kimliği; geçiş o kimliği her kayıtta bununla değiştiriyor. */
  oncekiKimlik?: string;
  /**
   * Etkin hesabın e-postası değişiyor: yönetici yeni adresi yazdı, o adrese
   * aktivasyon daveti gitti. Kişi yeni adresle etkinleşene kadar eskisiyle
   * giriyor; etkinleşince kaydı yeni hesaba geçiyor (eylemler.ts →
   * hesabaGecir). Kural eski kaydı yalnız bu adresin sahibine sildiriyor.
   */
  yeniEposta?: string;
  /** Tam yöneticinin verdiği seçmeli hesap yetkileri; tam yönetici (hesapYoneticisi) hepsine sahip. */
  yetkiler?: HesapYetkisi[];
  /** Planın ekip satırında yazılan ad parçası (PlanAdi); yoksa tam ad. */
  planAdi?: PlanAdi;
}

/* Kullanıcılar sayfasının parça parça verilebilen işleri; yetki vermek ve tam yönetici yapmak bunların dışında, yalnız tam yöneticide. */
/* Planın ekip satırında adın yazılan parçası; yoksa tam ad. Yazı uzamasın diye kurum adı ya da soyadı yazıyor. */
export type PlanAdi = "ad" | "soyad";

/*
 * Öneri akışının yetkileri (tasarım belgesi, 7. bölüm) de burada: paket
 * işaretinin onayı, geri alma, başka muhabire verme, arşivden çıkarma,
 * öneri silme. Bütün yetki tam yöneticide; o kişi kişi dağıtır. Planlama'nın
 * günlük kararları (ret, takip, plana ekleme…) yetki değil, birim işi.
 */
export const HESAP_YETKILERI = ["davet", "kayitBaglantisi", "kisiDuzenle", "hesapAcKapa", "hesapsizKisi", "kisiSil", "paketOnayi", "geriAlma", "baskaMuhabire", "arsivdenCikarma", "oneriSilme"] as const;
export type HesapYetkisi = (typeof HESAP_YETKILERI)[number];

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
/** Ekip görevleri artık kurumun yapısında (yapi.ts → Yapi.ekipGorevleri); yerleşikler eski planlarla uyumlu. */
export type EkipGoreviId = EkipGorevi | (string & {});

/*
 * Next Day önceki planın şablonuyla açılıyor. Önceki günden taşınıp henüz
 * dokunulmamış kayıt `onceki` taşıyor; ekranda hafif fonla ayrılıyor ki
 * planlamacı dünün yazısını bugünün yenisiyle karıştırmasın. Düzenlenince,
 * "bugün de geçerli" denince ya da plan onaylanınca kalkıyor.
 */
export interface EkipUyesi {
  kisiId: string;
  gorev: EkipGoreviId;
  vardiya: string;
  onceki?: true;
}

/** Başlık altındaki muhabir: yeri ve canlı saati o güne ait ("القدس / ..."; "06G"). */
export interface PlanMuhabiri {
  kisiId: string;
  yer?: string;
  saat?: string;
  onceki?: true;
  /** Önceki plandan dokunulmadan geldi; onay silmiyor, düzenleme siliyor (yarinPlaniniAc). */
  devir?: true;
}

/** Bir başlığın o günkü plandaki yeri: sıra listedeki yerinden, muhabirler o güne ait. */
export interface PlanBasligi {
  id: string;
  baslikId: string;
  muhabirler: PlanMuhabiri[];
  /** Muhabir henüz belli değil: çıktıda adın yerinde "TBC". Muhabir atanınca kalkıyor. */
  muhabirTbc?: true;
  /** Önceki plandan taşındı; o gün yeni eklenen başlıkta yok. */
  devir?: true;
}

export interface NextDayPlan {
  id: string;
  tarih: string;
  durum: PlanDurum;
  ekip: EkipUyesi[];
  gorevlendirmeler: string[];
  /** Stoktan seçilen paketler (Paket kimliği); plan Newsdesk'e devredilince yayınlanmış sayılıyor. */
  hazirPaketler: string[];
  basliklar: PlanBasligi[];
  /** Şablonun alındığı önceki plan. */
  kopyaKaynagi?: string;
  /** Önceki günden taşınıp dokunulmamış hareket bağlantıları; hareket ayrı kayıt, işaret plandaki bağlantıda. */
  oncekiHareketler?: string[];
  olusturan: string;
  olusturma: string;
}

/* "kurum": başka bir birimin ya da Planlama'nın kendi takibinden çıkan haber; dışarıdan gelmiyor ama muhabirin de değil. */
export const KAYNAK_TURLERI = ["muhabir", "ajans", "resmi", "medya", "kurum", "diger"] as const;
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
  /** Haftalık plandan aktarıldıysa kaynağı olan kalem. */
  haftalikKalemId?: string;
  /** Muhabirin takibinden (متابعة) eklendiyse o takip; aynı takip aynı plana iki kez girmesin. */
  takipId?: string;
  onceki?: true;
  devir?: true;
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
  onceki?: true;
  devir?: true;
  /*
   * Haber türü "Live" olan öneri ya da haftalık kalem plana canlı yayın olarak
   * giriyor; bağ, öneri plandan çıkınca ya da silinince canlının da gitmesi için.
   */
  oneriId?: string;
  haftalikKalemId?: string;
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
  /** Özel yayın için: genel görevlendirme kaydında, özel yayına bağlı. */
  ozelId?: string;
}

/*
 * Yurt içi ya da yurt dışı ayrımı yok: görevlendirme, seyahat ve diğer
 * hareketler aynı işlemle yürüyen saha görevlendirmesi. İzin saha işi
 * değil, yalnız izin listesinde görünüyor.
 */
export const sahaGorevi = (g: Gorevlendirme) => g.tur !== "izin";

/* --- Öneri: muhabirin gönderdiği haliyle korunur, değerlendirme ayrı alanlarda. --- */

/*
 * "duzeltme": Planlama öneriyi notla muhabire geri gönderdi; karar muhabirde
 * bekliyor. Muhabir düzeltip yeniden gönderince öneri "yeni"ye döner.
 */
/*
 * "teklif": Planlama'nın muhabire önerdiği haber. Muhabir reddedemez,
 * yazışmada konuşur; kararı (değerlendirmeye alma, geri çekme) gönderen verir.
 */
/*
 * "takip": güncel haber, muhabirin bölgesinde süren gelişme. Muhabir
 * Takiplerim'den ya da öneri formunda "Takip" türüyle açar, Planlama
 * öneriyi "takip olarak kalsın" diye buraya alır. Muhabir metni
 * değiştirmez, altına tarihli gelişme satırı ekler (`satirlar`); son
 * satırdan 2 gün sonra arşive düşer. Planlamacı istediği an plana ekler.
 */
/*
 * "geriCekildi": muhabir Planlama dokunmadan önerisini ya da planlamacı
 * muhabire gönderdiği teklifi geri çekti; öneri arşive gider.
 */
export const ONERI_DURUMLARI = ["teklif", "yeni", "degerlendiriliyor", "duzeltme", "takip", "planaEklendi", "reddedildi", "sonra", "geriCekildi"] as const;
export type OneriDurum = (typeof ONERI_DURUMLARI)[number];
export const KANALLAR = ["sistem", "eposta", "telefon", "mesaj", "yuzYuze"] as const;
export type Kanal = (typeof KANALLAR)[number];

export interface Oneri {
  id: string;
  /** Talimatta ve muhabir dışı kaynakta boş: muhabiri Planlama plana eklerken atıyor. */
  muhabirId?: string;
  /** Haber talimatıysa talimatı veren yönetici; Planlama reddedemiyor, öncelikli. */
  talimatVeren?: string;
  /*
   * Öneri yalnız sistemden gelmiyor: ajans, resmî duyuru, başka bir birim.
   * Muhabir dışı kaynakta tür ve ad burada; plana eklenince gelişmenin
   * kaynağı da bu oluyor.
   */
  kaynakTuru?: KaynakTuru;
  kaynakAdi?: string;
  /** Planlama elle girdiyse giren kişi; muhabirin kendi gönderdiğinde boş. */
  giren?: string;
  ulke: Ulke;
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  tur: IcerikTuru;
  bicim?: OneriBicimi;
  sahaGerekli: boolean;
  zaman: string;
  kanal: Kanal;
  /** Önerinin günü (çok günlü etkinlikte ilk gün); eski haftalık öneride boş. */
  hedefTarih?: string;
  /** Çok günlü etkinlikte son gün; boşsa tek gün. Hangi gün hangi haberin planlanacağı buradan. */
  bitisTarih?: string;
  /** Haftalık öneride haftanın Cumartesi'si; Next Day planlarına karışmıyor. */
  hafta?: string;
  durum: OneriDurum;
  cagriId?: string;
  baslikId?: string;
  planId?: string;
  /*
   * Girdiği Next Day planının günü. Kısıtlı muhabir planı okuyamıyor; işleri
   * ("Senin sıran") haberin hangi günün planında olduğunu buradan biliyor.
   */
  planTarihi?: string;
  paketId?: string;
  gerekce?: string;
  /** Başka muhabire verilen paketten doğan teklifse o paket; teklif akışına giriyor. */
  kaynakPaketId?: string;
  /** İkinci plana girmek için kopyalandıysa asıl önerinin kimliği; ikisi birbirine bağlı görünüyor. */
  kopyaKaynagi?: string;
  /** Planlamacının elle arşive gönderdiği an; günü beklemeden arşivde. */
  arsiv?: { zaman: string; kisiId: string };
  /*
   * Arşivden çıkarıldığı an: günü geçmiş ya da reddedilmiş öneri yeniden
   * açılınca hemen arşive geri düşmesin; arşiv günü bu andan sayılır.
   */
  arsivdenCikti?: string;
  /*
   * Planlama'nın düzeltme isteği; ret gerekçesinden ayrı, çünkü düzeltilip
   * yeniden gönderilen öneri sonra reddedilirse ikisi de okunmalı. Muhabir
   * yeniden gönderince silinmiyor: neye göre düzeltildiği görünsün.
   */
  duzeltmeNotu?: string;
  /** Takipte muhabirin eklediği tarihli gelişmeler; önceki satırlar kalır, Planlama neyin yeni olduğunu görür. İçerik: Arapça. */
  satirlar?: { zaman: string; metin: string }[];
  /** Takibin türü (olay, toplantı, etkinlik); takip aşamasındaki öneride. */
  takipTuru?: TakipTuru;
  /** Kaç kez düzeltmeye gönderildi. */
  duzeltmeSayisi?: number;
  geriDonus?: boolean;
  /** Muhabire giden geri bildirim e-postası (şablondan); ne zaman, kim, hangi şablonla. */
  geriBildirim?: { zaman: string; kisiId: string; sablonId?: string };
  /*
   * Deneme süreci: geri bildirimle birlikte "takip edilsin" denen haberin
   * uygulaması e-postayla yürüyor; muhabirin işlerinde görünüyor, muhabir ya
   * da Planlama bitince "tamamlandı" işaretliyor.
   */
  takip?: "acik" | "tamamlandi";
  takipBitis?: string;
  takipBitiren?: string;
  /**
   * Plana gelişme olarak girdi, paket istenmedi: muhabir konuyu izliyor
   * ("yalnız takip"). Takip açık açılıyor, gün geçince işlerden düşmüyor,
   * "Tamamlandı"ya kadar kalıyor.
   */
  yalnizTakip?: boolean;
  /** E-postayla geldiyse kaynağı olan yanıt; orijinal metin orada değişmeden duruyor. */
  yanitId?: string;
  /** Planlama'dan muhabire giden öneri (gönderen `giren`); yoksa muhabirden ya da kaynaktan gelen. */
  yon?: "muhabire";
  /** Haftalık öneride muhabirin haberi yapacağı gün; boşsa zamana bağlı değil. Gündeme eklerken gün hazır gelsin. */
  haftaGunu?: string;
  /**
   * Bağlı takip: Planlama'nın takipten işe dönüştürdüğü öneri ya da muhabirin
   * "Takip" türüyle gönderdiği öneri (öneri ile takip aynı işin iki yüzü,
   * tür takip kaldıkça birlikte değişiyor). Takip kartı neye dönüştüğünü gösteriyor.
   */
  takipId?: string;
  /** Planlama düzeltmeden önceki hal (ilk düzenlemede bir kez): gönderenin yazdığı kaybolmasın. */
  ilkHali?: { haberBasligi: string; gelisme: string; paketBasligi?: string };
}

/*
 * Muhabirin takibi: ülkesinde izlediği güncel konu (olay, toplantı,
 * etkinlik). İş önerisi değil, bilgilendirme: Planlama görüyor, gerekirse
 * muhabirle konuşuyor ya da takibi muhabire iş önerisine (paket ya da
 * başka haber türü) dönüştürüyor; öneri `takipId` taşıyor.
 */
export const TAKIP_TURLERI = ["olay", "toplanti", "etkinlik", "diger"] as const;
export type TakipTuru = (typeof TAKIP_TURLERI)[number];

export interface Takip {
  id: string;
  muhabirId: string;
  /** İçerik: Arapça. */
  konu: string;
  aciklama?: string;
  tur: TakipTuru;
  /** Olayın günü; süregelen konuda boş. */
  tarih?: string;
  sehir: Sehir;
  zaman: string;
  /** Muhabir takibi bitirince kapanıyor; geçmişte kalıyor. */
  kapandi?: boolean;
  /** Yeni düzene geçişte takip aşamasındaki öneriye taşındı (gecis.ts); kayıt bilgi olarak kalıyor, listelerde yok. */
  gecti?: string;
}

/**
 * Önerinin kendi yazışması: muhabir ile Planlama arasında, uygulamanın
 * içinde. Her önerinin yazışması ayrı; konu karışmasın. Öneriden ayrı
 * kayıt, çünkü iki taraf aynı anda yazınca öneri belgesi ezilmesin.
 */
/*
 * Muhabire geri bildirim e-postasının şablonu. Ayarlar'da düzenleniyor;
 * metin içerik gibi (Arapça), {muhabir} {header} {strap} {plan} {gerekce}
 * {not} alanları gönderirken dolduruluyor. Kime her zaman muhabir; CC ve
 * BCC virgülle ayrılmış adresler.
 */
export const GERI_BILDIRIM_KARARLARI = ["planaEklendi", "reddedildi", "sonra"] as const;
export type GeriBildirimKarari = (typeof GERI_BILDIRIM_KARARLARI)[number];
export interface GeriBildirimSablonu {
  id: string;
  ad: string;
  /** Hangi kararda kendiliğinden seçili gelir; boşsa elle seçilir. */
  karar?: GeriBildirimKarari;
  konu: string;
  govde: string;
  cc: string;
  bcc: string;
}
/** Deneme süreci ayarı: diğer birimler devreye girince kapatılıyor, takip uygulamadaki akışa dönüyor. */
export interface GeriBildirimAyari {
  epostaIleTakip: boolean;
  /** Takip seçilince önerinin yazışmasına düşen mesaj. */
  takipMesaji: string;
}

export interface Mesaj {
  id: string;
  oneriId: string;
  kisiId: string;
  metin: string;
  zaman: string;
}

/*
 * Yapay zekanın önerinin haber değeri hakkındaki görüşü (src/yz.ts); yalnız
 * tavsiye, kararı Planlama veriyor. Öneri belgesinden ayrı kayıt (mesaj gibi):
 * görüş alınırken öneri başkasınca değiştirilirse ezilmesin. Öneri başına
 * bir görüş (kimlik öneriden); yenisi eskisinin yerine geçiyor. Bir kez
 * alınınca ekibin hepsi görüyor, hak iki kez yenmiyor.
 */
export type YzGenel = "yuksek" | "orta" | "dusuk";
export interface YzGorus {
  id: string;
  oneriId: string;
  kisiId: string;
  zaman: string;
  genel: YzGenel;
  ozet: string;
  kriterler: { ad: string; puan: number; gerekce: string }[];
}

/*
 * Öneri çağrısı kurumun bugünkü e-postası gibi: Kime planlama grubu (bütün
 * planlama yazışmayı görsün), muhabirler BCC'de (her muhabirin yazışması
 * müstakil kalsın). Konudaki etiket yanıtları doğru çağrıya bağlıyor.
 */
export type CagriTuru = "nextday" | "haftalik";

export interface Cagri {
  id: string;
  /** Eski kayıtta yok: Next Day. */
  tur?: CagriTuru;
  /** Next Day'de planın günü, haftalıkta haftanın Cumartesi'si. */
  tarih: string;
  metin: string;
  sonSaat: string;
  olusturan: string;
  zaman: string;
  kime: string;
  /** BCC'deki muhabirler (kişi kimliği). */
  bcc: string[];
  /** Konudaki eşleştirme etiketi: ND-20260930, haftalıkta HP-20261003. */
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
  /*
   * Özel yayının paket talebi: in-house (Output müdürü dağıtıyor,
   * hazirlayanId) ya da dış muhabirden (muhabirId), son tarihli. Newsdesk
   * henüz yok: teslim edildiğinde "tamamlandi".
   */
  ozelId?: string;
  ozelKaynak?: "inhouse" | "dis";
  sonTarih?: string;
  hazirlayanId?: string;
  /** İşi yapan hazırlamaya başladığını işaretledi (görevlendirildi → hazırlanıyor). */
  ozelBasladi?: string;
  /**
   * Özel yayının dış muhabir paketi onaylandı ama görev henüz verilmedi:
   * onay görevlendirme sayılmıyor, Planlama ayrıca işaretliyor. O ana dek
   * muhabir paketi görmüyor. Eski kayıtta yok: muhabirliyse görevli sayılır.
   */
  ozelGorevBekliyor?: true;
  /** Özel yayının adı (Arapça): muhabir özel yayın kaydını okuyamıyor, işinin hangi yayın için olduğunu buradan görüyor. */
  ozelAd?: string;
  /** Listede olmayan yer ("Diğer"; muhabir başka yere gidip oradan yapıyor): Arapça, elle; çıktıda şehrin yerine. */
  yer?: string;
  muhabirId?: string;
  /*
   * Muhabir henüz belli değil: "YER / strap / TBC". Sahte kişi kimliği
   * değil işaret, çünkü paketin muhabiri akışta görev ve bildirim alıyor.
   */
  muhabirTbc?: true;
  /** Haftalık toplantının karar notu ve ek talebi (kalemden); muhabir görüyor. */
  kararNotu?: string;
  ekTalep?: string;
  aciklama: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  teslim?: string;
  yayin?: string;
  durum: PaketDurum;
  slug?: string;
  /** Yalnız "üretimde" iken anlamlı; adımlar `akis.ts`'te. */
  adim?: string;
  /** Üretime girdiği akış ve yapı sürümü; sonradan yayınlanan düzen bu pakete uygulanmıyor (yapi.ts). */
  akis?: { id: string; surum: number };
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
  /*
   * Toplantıda reddedildi: paket iptal, ama kayıt silinmiyor; "Reddedilen
   * paketler" listesinde ve muhabirin sayfasında duruyor. Haber planda
   * paketsiz kalıyor.
   */
  reddedildi?: { zaman: string; kisiId: string };
  /*
   * Muhabirin "yapıldı" ya da sebebiyle "yapılmadı" işareti, yetkilinin
   * onayını bekliyor. Onaylanınca yapıldı paketi kapatır (tamamlandı),
   * yapılmadı iptal eder ve `yapilmadi`'ya geçer; geri çevrilince silinir.
   */
  isaret?: { tur: "yapildi" | "yapilmadi"; zaman: string; kisiId: string; sebep?: string };
  /*
   * Başka muhabire verildi: paket iptal, yerine yeni muhabire teklif açıldı
   * (`oneriId`). Eski muhabirin geçmişinde iz olarak kalıyor.
   */
  devredildi?: { muhabirId: string; oneriId: string; zaman: string; kisiId: string };
  /** Onaylanmış "yapılmadı": Yapılmayan paketler listesinde sebebiyle. */
  yapilmadi?: { sebep: string; zaman: string; kisiId: string; onaylayan: string };
  /** Haftalık toplantıda kabul edilen kalemden doğduysa: "Haftalık plandan" rozeti. */
  haftalikKalemId?: string;
  /*
   * Stok haberi: bir Next Day planına bağlı olmadan üretiliyor (feature,
   * ekonomi, günü olmayan haber). Bitince stokta bekliyor; bir plana
   * seçilip plan Newsdesk'e devredilince yayınlanmış sayılıyor.
   */
  stok?: boolean;
  /** Paketin süresi: 3:20. */
  sure?: string;
  yayinlandi?: { planId: string; tarih: string };
  notlar: Not[];
  olusturma: string;
  guncelleme: string;
}

/* --- Haftalık plan: Perşembe toplantısında kesinleşen Cumartesi–Cuma gündemi --- */

/*
 * Kurumun haftalık çıktısındaki (الأجندة الأسبوعية) düzen: haftanın ana
 * dosyaları, sonra gün gün gündem. Gündemde her kalem bir dosyanın
 * (merkezi başlık havuzundaki başlık) altında; Next Day'e aktarılınca aynı
 * başlığa düşüyor, havuz ikiye bölünmüyor. Günü olmayan kalem zamana bağlı
 * olmayan (stok) dosyada: feature, ekonomi, program önerileri.
 */
export const HAFTA_DURUMLARI = ["hazirlik", "toplantida", "kesinlesti"] as const;
export type HaftaDurum = (typeof HAFTA_DURUMLARI)[number];

/** Toplantı kararı. "bilgi": çıktıda yer alır ama takip edilmez (لا نتابع). */
export const KARARLAR = ["bekliyor", "kabul", "bilgi", "ret"] as const;
export type Karar = (typeof KARARLAR)[number];

/** Haftanın ana dosyası (أهم ملفات الأسبوع): başlık ve bir paragraf durum özeti. */
export interface AnaKonu {
  id: string;
  /** Başlığın yazısı (çıktı bunu basıyor); havuzdan seçildiyse havuzdaki adı. */
  baslik: string;
  /** Merkezi başlık havuzundaki dosya: ana dosya da gündemle ve Next Day'le aynı başlığı kullansın. Eski kayıtta boş. */
  baslikId?: string;
  metin: string;
}

export interface Gorus {
  kisiId: string;
  zaman: string;
  metin: string;
}

/*
 * Ön inceleme: stok öneri toplantıdan önce o kolun yöneticisine gidiyor.
 * Yönetici görüş yazıyor ya da gerekçeyle reddediyor; reddedilen
 * gündemden düşüyor, kabul kararı yine toplantıda.
 */
export interface OnInceleme {
  durum: "gonderildi" | "reddedildi";
  gonderen: string;
  zaman: string;
  gorusler: Gorus[];
  reddeden?: string;
  gerekce?: string;
}

export interface HaftalikKalem {
  id: string;
  /** Boşsa zamana bağlı olmayan (stok) dosyada. */
  tarih?: string;
  /** Dosya: merkezi başlık havuzundaki başlık. */
  baslikId?: string;
  /** Olayın kısa adı; çıktıda "ad - yer / metin". */
  baslik?: string;
  yer?: string;
  metin: string;
  tur: IcerikTuru;
  /** Çıktıdaki biçim satırı: PKG + LIVE. */
  bicimler: Bicim[];
  /** Paket önerisinin başlığı (strap): çıktıda "PKG" altında "YER / strap / muhabir". */
  paketBasligi?: string;
  muhabirler: string[];
  /** Muhabir henüz belli değil (TBC); Next Day'e geçen pakete de taşınıyor. */
  muhabirTbc?: true;
  /*
   * Toplantıda kararla birlikte söylenen: karar notu (neden, nasıl) ve ek
   * talep (eklenecek röportaj, görüntü…). Çıktıdaki sarı nottan ayrı; kesinleşince
   * pakete geçiyor, muhabir görüyor. Ret notu öneriye gerekçe olarak gidiyor.
   */
  kararNotu?: string;
  ekTalep?: string;
  /** Çıktıda sarı vurgulu not. */
  not?: string;
  oneriId?: string;
  karar: Karar;
  onInceleme?: OnInceleme;
  /** Kabul edilip aktarılınca: Next Day planı ve doğan paket. */
  aktarim?: { planId?: string; paketId?: string };
}

export interface HaftalikPlan {
  id: string;
  /** Haftanın Cumartesi'si. */
  baslangic: string;
  durum: HaftaDurum;
  anaKonular: AnaKonu[];
  kalemler: HaftalikKalem[];
  /**
   * Bu haftada eklenen ya da seçilen dosyalar (havuzdaki başlıklar). Haftanın
   * dosya seçimleri yalnız bunları gösteriyor: her hafta boş başlıyor, eski
   * haftaların dosyaları önüne gelmiyor (haftalik.ts → haftaninDosyalari).
   */
  dosyalar?: string[];
  olusturan: string;
  olusturma: string;
}

/* --- Aylık ve özel planlar: Next Day'e karışmayan ayrı kayıtlar. --- */

export interface PlanKalemi {
  id: string;
  tarih?: string;
  baslik: string;
  tur: IcerikTuru;
  ulke?: Ulke;
  onayli: boolean;
}

export interface AylikPlan {
  id: string;
  ay: string;
  durum: "hazirlik" | "onayli";
  kalemler: PlanKalemi[];
}

/*
 * Özel yayın: başlık, gün (ya da aralık), genel planın paragrafı; altında
 * nafizeler (konuklu canlı yayın), paket talepleri (Paket, ozelId), diğer
 * talepler (grafik…), dış görevlendirmeler (Gorevlendirme, ozelId) ve
 * hazırlık maddeleri. Süreç günlerce sürüyor ve plan bitince takip
 * unutuluyordu: her kalemin kendi durumu ve izi var (kim, ne zaman, ne
 * yaptı, not), özet yapılanı ve yapılacağı ondan sayıyor.
 */
export interface OzelIz {
  kisiId: string;
  zaman: string;
  olay: "eklendi" | "duzenlendi" | "durum" | "not";
  /** Olay "durum"sa yeni durum (kalemin kendi durum listesinden). */
  durum?: string;
  /** Notun düştüğü aşama (kontrol listesinin satırı); yoksa kalemin genel notu. */
  asama?: string;
  not?: string;
}

/*
 * Nafizenin aşamaları sırayla işaretleniyor (kontrol listesi): onay (tek
 * başına ya da planın onayıyla), Satdesk rezervasyonu (yazışma ve işlemler
 * aşamanın notunda), yer hazır, yayınlandı. Durum son işaretlenen aşama.
 * Konuklar bundan bağımsız, sırasız ayarlanıyor.
 */
export const NAFIZE_DURUMLARI = ["planlandi", "onayli", "rezervasyon", "hazir", "yapildi", "iptal"] as const;
export type NafizeDurum = (typeof NAFIZE_DURUMLARI)[number];
/** Kontrol listesinin sırası: başta işaretsiz durum, sonra aşamalar. */
export const NAFIZE_SIRASI: readonly NafizeDurum[] = ["planlandi", "onayli", "rezervasyon", "hazir", "yapildi"];
export const KONUK_DURUMLARI = ["aday", "davetEdildi", "teyitli", "iptal"] as const;
export type KonukDurum = (typeof KONUK_DURUMLARI)[number];

/** Konuk koordinatörüyle belirlenen konuk; ad ve unvan Arapça. */
export interface Konuk {
  id: string;
  ad: string;
  unvan?: string;
  yer?: string;
  durum: KonukDurum;
}

/** Nafize (نافذة): özel yayın içindeki konuklu canlı yayın; muhabir sahada ya da dış muhabir. */
export interface Nafize {
  id: string;
  konu: string;
  tarih: string;
  saat?: string;
  yer?: string;
  muhabirId?: string;
  muhabirTbc?: true;
  konuklar: Konuk[];
  durum: NafizeDurum;
  iz: OzelIz[];
}

export const TALEP_DURUMLARI = ["acik", "suruyor", "tamam", "iptal"] as const;
export type TalepDurum = (typeof TALEP_DURUMLARI)[number];
export const TALEP_SIRASI: readonly TalepDurum[] = ["acik", "suruyor", "tamam"];

/*
 * Paket önerisi: özel yayının içinde, genel önerilerden ayrı. Yazılınca
 * paket doğmuyor; onaylanınca (tek başına ya da planın onayıyla) Paket
 * açılıyor ve görev muhabire ya da Output'a o an gidiyor. Aşama notları
 * burada (paketin ilerleyişi de izine düşüyor).
 */
export interface OzelPaketOnerisi {
  id: string;
  baslik: string;
  aciklama: string;
  kaynak: "inhouse" | "dis";
  muhabirId?: string;
  sonTarih?: string;
  tur: IcerikTuru;
  bicim: Bicim;
  durum: "oneri" | "onaylandi";
  paketId?: string;
  iz: OzelIz[];
}

/** Grafik ve öbür talepler: elle; istenirse bir birime (bildirim ona) ve son tarihle. */
export interface OzelTalep {
  id: string;
  metin: string;
  birim?: BirimId;
  sonTarih?: string;
  durum: TalepDurum;
  iz: OzelIz[];
}

/*
 * Planın aşamaları kontrol listesi: planlama tamam (onayda), onaylandı,
 * uygulama tamam, yayına hazır. Durum son işaretlenen aşama; her biri ayrı
 * işaretleniyor, kim ve ne zaman planın izinde.
 */
export const OZEL_SIRASI = ["hazirlik", "onayda", "onayli", "uygulandi", "hazir"] as const;
export type OzelDurum = (typeof OZEL_SIRASI)[number];

export interface OzelYayin {
  id: string;
  ad: string;
  tarih: string;
  /** Çok günlü yayında son gün. */
  bitis?: string;
  /** Genel olarak nasıl bir yayın planlandığı (Arapça paragraf). */
  aciklama?: string;
  /** Yoksa hazırlık (eski kayıt). */
  durum?: OzelDurum;
  hazirlik: { id: string; metin: string; tamam: boolean }[];
  nafizeler?: Nafize[];
  talepler?: OzelTalep[];
  paketOnerileri?: OzelPaketOnerisi[];
  /** Planın kendi izi: açılış, düzenleme, onay. */
  iz?: OzelIz[];
}

/*
 * Notta anılan kişi (@ad): bütün notlarda (özel yayın, paket, yönetici
 * notu, haftalık karar notu ve ek talep, öneri yazışması). Anılana
 * bildirim gidiyor; not işler listesinde de duruyor, tıklayınca ilgili
 * sayfa açılıyor. Ayrı kayıt: "gördüm" anılanın kendi işareti, hareket
 * kaydı sınırlı ve paylaşılan.
 */
export interface Bahsetme {
  id: string;
  /** Anılan. */
  kisiId: string;
  yazanId: string;
  zaman: string;
  metin: string;
  /** Notun yazıldığı sayfa (#/…). */
  yol: string;
  /** Kaydın adı (içerik, Arapça): özel yayın, paket, öneri başlığı… */
  baslik?: string;
  goruldu?: string;
}

/* --- Planlama takvimi: ileride haber olabilecek faaliyetler --- */

/*
 * Toplantı takviminden (d.toplantilar, akıştaki üç toplantı) ayrı: burası
 * yıl boyunca önceden bilinen seçim, zirve, konferans, resmî gün gibi
 * faaliyetler. Kendiliğinden plana dönüşmüyor; editör "plana ekle" deyince
 * ilgili planda kayıt doğuyor ve bağlantısı burada tutuluyor.
 */
export const FAALIYET_TURLERI = ["secim", "zirve", "konferans", "toplanti", "ziyaret", "parlamento", "dava", "spor", "kultur", "ekonomi", "ozelGun", "yildonumu", "ozelYayin", "gorevlendirme", "diger"] as const;
export type FaaliyetTuru = (typeof FAALIYET_TURLERI)[number];

export const ONCELIKLER = ["dusuk", "normal", "yuksek", "kritik"] as const;
export type Oncelik = (typeof ONCELIKLER)[number];

/** Haber potansiyeli: takipten özel yayın adayına. */
export const POTANSIYELLER = ["takip", "oneri", "kesin", "ozelYayin"] as const;
export type Potansiyel = (typeof POTANSIYELLER)[number];

export const FAALIYET_DURUMLARI = ["taslak", "takipte", "planaAlindi", "tamamlandi", "iptal"] as const;
export type FaaliyetDurum = (typeof FAALIYET_DURUMLARI)[number];

/* Bölge ülkeden çıkıyor ama faaliyette ayrıca tutuluyor: ülkesiz (küresel) ya da bölgesel faaliyet de var. */
export const BOLGELER = ["ortadogu", "korfez", "kuzeyAfrika", "turkiyeCevresi", "avrupa", "amerika", "kuresel"] as const;
export type Bolge = (typeof BOLGELER)[number];

export const ULKE_BOLGESI: Record<Ulke, Bolge> = {
  filistin: "ortadogu",
  lubnan: "ortadogu",
  suriye: "ortadogu",
  irak: "ortadogu",
  urdun: "ortadogu",
  iran: "ortadogu",
  katar: "korfez",
  suudi: "korfez",
  yemen: "korfez",
  kuveyt: "korfez",
  bae: "korfez",
  bahreyn: "korfez",
  umman: "korfez",
  misir: "kuzeyAfrika",
  sudan: "kuzeyAfrika",
  libya: "kuzeyAfrika",
  tunus: "kuzeyAfrika",
  fas: "kuzeyAfrika",
  cezayir: "kuzeyAfrika",
  turkiye: "turkiyeCevresi",
  azerbaycan: "turkiyeCevresi",
  ukrayna: "avrupa",
  belcika: "avrupa",
  ingiltere: "avrupa",
  fransa: "avrupa",
  almanya: "avrupa",
  rusya: "avrupa",
  abd: "amerika",
  brezilya: "amerika",
  pakistan: "kuresel",
  afganistan: "kuresel",
  somali: "kuresel",
  cad: "kuresel",
  etiyopya: "kuresel",
  moritanya: "kuzeyAfrika",
  ispanya: "avrupa",
  hollanda: "avrupa",
  bosna: "avrupa",
  arjantin: "amerika",
};

export const HATIRLATMA_SURELERI = ["1g", "3g", "1h", "1a"] as const;
export type HatirlatmaSuresi = (typeof HATIRLATMA_SURELERI)[number];
export type Hatirlatma = { once: HatirlatmaSuresi } | { zaman: string };

export const TEKRAR_SIKLIKLARI = ["yillik", "aylik", "haftalik"] as const;
export type TekrarSikligi = (typeof TEKRAR_SIKLIKLARI)[number];

export type BaglantiTuru = "nextday" | "haftalik" | "aylik" | "ozel";

/** Faaliyetin bir plandaki karşılığı; çoka çok: faaliyet birçok plana, plan birçok faaliyete. */
export interface FaaliyetBaglantisi {
  tur: BaglantiTuru;
  planId: string;
  /** Planda doğan kayıt (gelişme, kalem, aylık kalem, hazırlık maddesi); özel yayının kendisinde yok. */
  kayitId?: string;
  /** Hangi gün: tekrarlayan faaliyette hangi tekrar olduğu. */
  tarih: string;
  kisiId: string;
  zaman: string;
}

export interface Faaliyet {
  id: string;
  /** İçerik: Arapça, sağdan sola. */
  baslik: string;
  ulke?: Ulke;
  bolge?: Bolge;
  /** İçerik: Arapça şehir adı; muhabir şehirlerinden bağımsız serbest yazı. */
  sehir?: string;
  baslangic: string;
  bitis: string;
  saat?: string;
  bitisSaati?: string;
  tur: FaaliyetTuru;
  oncelik: Oncelik;
  potansiyel: Potansiyel;
  birim?: Birim;
  muhabirId?: string;
  /** Yazıldığı dilde. */
  notlar?: string;
  hatirlatma?: Hatirlatma;
  tekrar?: { siklik: TekrarSikligi; bitis?: string };
  durum: FaaliyetDurum;
  baglantilar: FaaliyetBaglantisi[];
  olusturan: string;
  olusturma: string;
  guncelleme: string;
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

/* --- Planlama görevleri: iş taksimi (gorevler.ts) --- */

/** Temel görevler planların kendisi; yan görev bunlardan birine bağlanabiliyor. */
export const TEMEL_GOREVLER = ["nextday", "haftalik", "aylik", "ozel"] as const;
export type TemelGorev = (typeof TEMEL_GOREVLER)[number];

/** Sabit: hep aynı kişi(ler). Sıralı: kişiler dönem dönem sırayla (gün ya da Cumartesi başlayan hafta). */
export type GorevDagilimi = { tur: "sabit"; kisiler: string[] } | { tur: "sirali"; kisiler: string[]; periyot: "gun" | "hafta"; baslangic: string };

export interface GorevTanimi {
  id: string;
  tur: "temel" | "yan";
  /** Temel görevde planın kendisi; yan görevde bağlı olduğu temel görev (yoksa bağımsız). */
  temel?: TemelGorev;
  /** Yan görevin adı (yazıldığı dilde); temel görevin adı dil tablosundan. */
  ad: string;
  etiketler: string[];
  dagilim: GorevDagilimi;
  /** Dönemin sorumlusunu elle değiştirmek (izin, nöbet değişimi): dönem anahtarı (gün ya da haftanın Cumartesi'si) → kişi. */
  degisiklikler?: Record<string, string>;
  pasif?: boolean;
}

export const IS_DURUMLARI = ["yapilacak", "suruyor", "bitti"] as const;
export type IsDurumu = (typeof IS_DURUMLARI)[number];

/** Tek seferlik iş: yan görevlerin altına düşen ya da bağımsız küçük iş. */
export interface Is {
  id: string;
  baslik: string;
  etiketler: string[];
  gorevId?: string;
  kisiler: string[];
  /** Ekibe verilen iş (yönetici panelinden): birimin bugünkü ve sonradan gelen herkesi işi görüyor. */
  birimler?: BirimId[];
  aciklama?: string;
  sonTarih?: string;
  durum: IsDurumu;
  olusturan: string;
  zaman: string;
}

/* --- Hareket kaydı: metni saklanmaz, dil tablosundaki şablondan üretilir. --- */

export const HAREKET_TIPLERI = [
  "cagriHazirlandi",
  "oneriGeldi",
  "oneriDegerlendirmede",
  "oneriPlanaEklendi",
  "oneriPlandanCikarildi",
  "oneriReddedildi",
  "oneriSonra",
  "geriDonus",
  "takipTamamlandi",
  "tamamlamaGeriAlindi",
  "planOlusturuldu",
  "planKopyalandi",
  "planGeriAlindi",
  "planIceAktarildi",
  "kisiSilindi",
  "kayitTemizlendi",
  "oneriSilindi",
  "baslikBirlestirildi",
  "planlarBirlestirildi",
  "gorevKaydedildi",
  "isAtandi",
  "isDurumu",
  "kisiTayinEdildi",
  "yapiYayinlandi",
  "oneriMuhabireGonderildi",
  "teklifKabulEdildi",
  "teklifReddedildi",
  "oneriGeriCekildi",
  "oneriTakibeAlindi",
  "takipSatiriEklendi",
  "oneriAsamayaDondu",
  "paketReddedildi",
  "paketBaskaMuhabire",
  "gecisUygulandi",
  "paketIsaretlendi",
  "paketIsaretOnaylandi",
  "paketIsaretGeriCevrildi",
  "oneriKopyalandi",
  "oneriArsiveGonderildi",
  "oneriArsivdenCikarildi",
  "oneriMesaji",
  "takipEklendi",
  "takipPlanaEklendi",
  "planToplantida",
  "planTaslaga",
  "planOnaylandi",
  "planDevralindi",
  "paketOlusturuldu",
  "ozelOlusturuldu",
  "ozelOnayaGonderildi",
  "ozelOnaylandi",
  "ozelAsama",
  "bahsedildi",
  "ozelHazirliga",
  "ozelPaketTalebi",
  "ozelPaketAtandi",
  "ozelPaketOnaylandi",
  "ozelPaketBasladi",
  "ozelPaketTeslim",
  "ozelTalep",
  "paketDegerlendirmede",
  "paketOnaylandi",
  "paketIptal",
  "gorevlendirildi",
  "gorevVerildi",
  "metinGeldi",
  "kontrolEdildi",
  "geriGonderildi",
  "durakTamamlandi",
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
  "oneriDuzeltmeIstendi",
  "oneriYenidenGonderildi",
  "talimatVerildi",
  "paketOncelikli",
  "paketOncelikKalkti",
  "yoneticiNotu",
  "haftalikOlusturuldu",
  "haftalikToplantida",
  "haftalikHazirliga",
  "haftalikKesinlesti",
  "onIncelemeyeGonderildi",
  "onIncelemeGorusu",
  "onIncelemedeReddedildi",
  "haftaliktanAktarildi",
  "uretimeAlindi",
  "stokYayinlandi",
  "faaliyetEklendi",
  "faaliyetPlanaAlindi",
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
  haftaId?: string;
  ozelId?: string;
  veri?: Record<string, string>;
}

/** Plan ekranında gelen öneriler: müstakil kart ya da tek satır. */
export type OneriGorunumu = "kart" | "liste";

/* --- Workspace: birkaç sayfayı bir arada açan kişisel çalışma ortamı --- */

/** Yan yana, alt alta, 2×2 ızgara ya da tek seferde bir bölme (sekmeli). */
export const ORTAM_DUZENLERI = ["yan", "alt", "izgara", "sekme"] as const;
export type OrtamDuzeni = (typeof ORTAM_DUZENLERI)[number];
/** Ayraçla boyutlanan iki yerleşim; payı her biri için ayrı tutuluyor. */
export type BolmeEkseni = "yan" | "alt";

export interface Bolme {
  id: string;
  /** Bölmede açılan sayfa, `#/` olmadan: "nextday", "paketler/p-1". */
  yol: string;
  /*
   * Ayraçla verilen boyut (fr). Bölmenin üstünde duruyor: taşıma ya da
   * kapatmada ayrı bir oranlar dizisi bölmelerle hizasını kaybederdi.
   */
  pay?: Partial<Record<BolmeEkseni, number>>;
}

/*
 * Adı yok: sekmede içindeki sayfaların kısa adları yazıyor (türetiliyor).
 * Eski kayıtta `ad` ve `no` durabilir; okunmuyor, şema değişmiyor.
 */
export interface Ortam {
  id: string;
  duzen: OrtamDuzeni;
  /** Dizideki sıra ekrandaki sıra. */
  bolmeler: Bolme[];
}

export interface Durum {
  surum: 18;
  kisiler: Kisi[];
  basliklar: Baslik[];
  planlar: NextDayPlan[];
  gelismeler: Gelisme[];
  canliYayinlar: CanliYayin[];
  gorevlendirmeler: Gorevlendirme[];
  oneriler: Oneri[];
  cagrilar: Cagri[];
  yanitlar: Yanit[];
  paketler: Paket[];
  haftalik: HaftalikPlan[];
  aylik: AylikPlan[];
  ozel: OzelYayin[];
  toplantilar: Toplanti[];
  faaliyetler: Faaliyet[];
  dosyalar: Dosya[];
  hareketler: Hareket[];
  mesajlar: Mesaj[];
  takipler: Takip[];
  geriBildirimSablonlari: GeriBildirimSablonu[];
  /** Yapay zekanın haber değeri görüşleri; eski kayıtta yok. */
  yzGorusleri?: YzGorus[];
  /** Yerleşik listede olmayan, sonradan eklenen şehirler. */
  sehirler?: SehirTanimi[];
  /** Planlama görevleri ve iş taksimi; eski kayıtta yok, boşsa varsayılan temel görevler (gorevler.ts). */
  gorevler?: GorevTanimi[];
  isler?: Is[];
  bahsetmeler?: Bahsetme[];
  /** Yayınlanmış kurum yapıları (yapi.ts); boşsa koddaki varsayılan. */
  yapilar: Yapi[];
  /** Yöneticinin yayınlamadığı taslak (kişi → yapı). */
  yapiTaslaklari?: Record<string, Yapi>;
  /** Kişi başına son bildirim bakışı; okunmamış sayısı buradan çıkıyor. */
  okundu: Record<string, string>;
  /** Kişinin kendi ana sayfa düzeni ("kişi:düzen" → alan sırası); yoksa birimin varsayılanı. */
  anaSayfa?: Record<string, string[]>;
  /** Kişinin plan ekranlarındaki öneri görünümü (kişi → kart ya da liste); yoksa kart. */
  oneriGorunumu?: Record<string, OneriGorunumu>;
  /** Kişinin workspace'leri (kişi → sekme sırasıyla); ana sayfa düzeni gibi kişisel. */
  ortamlar?: Record<string, Ortam[]>;
  /** Kişinin üst çubuktaki kısayolları (kişi → sıralı yol); yoksa birimin varsayılanı. */
  kisayollar?: Record<string, string[]>;
  /** Muhabire doğrudan haber önerebilen birimler; yönetici seçiyor. Yoksa yalnız Planlama. */
  muhabireOneriBirimleri?: BirimId[];
  /*
   * Newsdesk sistemde mi: değilse (şimdilik) iş Planlama'da bitiyor, onaylı
   * paketi muhabir "Tamamlandı" diye kapatıyor. Açılınca devral ve üretim
   * akışı. Gerçek kipte genel ayar belgesinde.
   */
  newsdeskDevrede?: boolean;
  /** Geri bildirim ve e-postayla takip ayarı (gerçek kipte genel ayar belgesinde). */
  geriBildirimAyari?: GeriBildirimAyari;
  sayac: number;
}

/* --- Saklama ve abonelik --- */

/*
 * Şema değişince anahtar da değişiyor: eski kayıt yeni ekranı bozmasın,
 * örnekten başlansın (v3: içerik Arapça, v4: e-posta yanıtları, v5:
 * görevlendirmede yurt içi/yurt dışı ayrımı yok, hepsi saha görevlendirmesi,
 * v6: yönetici talimatı, öncelik ve yönetici notu, v7: haftalık plan akışı,
 * ön inceleme, Ekonomi birimi, v8: hazır paket ayrı kayıt değil, stok
 * paketi, v9: elle girilen öneri ve muhabir dışı kaynak, v10: Next Day
 * önceki planın şablonuyla açılıyor, taşınan kayıt işaretli, v11: kişiye
 * özel ana sayfa düzeni, v12: kişinin öneri görünümü, v13: planlama
 * takvimi, faaliyetler, v14: workspace, v15: üst şeritte kişinin kısayolları, v16: öneri düzeltmeye
 * gönderilebiliyor, v17: öneri yazışması, muhabire öneri, v18: kurum yapısı (birim, ünvan, akış),
 * v19: muhabirin takipleri, haftalık öneride gün;
 * v20: özel yayının nafizeleri, talepleri, paket talepleri ve izi;
 * v21: özel yayının aşamaları, nafizede Satdesk rezervasyonu, paketin
 * plan/onay/hazırlanıyor adımları; v22: aşamalar kontrol listesi, aşama
 * notları, özel yayının paket önerileri; v23: notta anılanlar, özel yayın
 * paketinde ayrı görevlendirme).
 */
const SAKLA = "trt-planlama-v23";

/*
 * Workspace'in her bölmesi uygulamanın ayrı bir kopyası (iframe) ve aynı
 * kaydı paylaşıyor; iki sekme de öyle. Her kopyanın bellekte kendi `durum`u
 * var, `kaydet` kaydın tamamını yazıyor: bayat kopyayla yazan, öbürünün
 * işini siler. Bu yüzden her yazış yeni bir iz bırakıyor; `getir` iz
 * değişmişse kaydı yeniden okuyor, yani her eylem en taze kayıttan
 * başlıyor. Aynı kökenli çerçeveler tek iş parçacığında çalıştığından
 * oku-değiştir-yaz arada bölünmüyor. `storage` olayı da öbür kopyaları
 * yeniden çizdiriyor.
 */
const IZ = `${SAKLA}-iz`;
const izOku = () => {
  try {
    return localStorage.getItem(IZ);
  } catch {
    return null;
  }
};
const yeniIz = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

let iz = izOku();

const yaz = (d: Durum) => {
  try {
    localStorage.setItem(SAKLA, JSON.stringify(d));
    iz = yeniIz();
    localStorage.setItem(IZ, iz);
  } catch {
    /* saklanamazsa bellekte kalır */
  }
};

/*
 * Kayıt yoksa örnek veri hemen yazılıyor: workspace'in bölmeleri açılırken
 * her biri kendi örneğini kurmasın, hepsi aynı kaydı okusun. Başka bir
 * kopyanın olayıyla tazelerken yazılmıyor; yoksa kopyalar sırayla birbirinin
 * örneğini yazıp durur.
 */
const yukle = (eksikseYaz: boolean): Durum => {
  try {
    const ham = localStorage.getItem(SAKLA);
    if (ham) {
      const d = JSON.parse(ham) as Durum;
      if (d.surum === 18) return d;
    }
  } catch {
    /* bozuk kayıt: örnekten başla */
  }
  const d = ORNEK();
  if (eksikseYaz) yaz(d);
  return d;
};

/** Örnek kayıtsız iskelet: gerçek kip bununla başlıyor, kişiler davetle, gerisi kullanımla doluyor. */
export const bosDurum = (): Durum => ({
  surum: 18,
  kisiler: [],
  basliklar: [],
  planlar: [],
  gelismeler: [],
  canliYayinlar: [],
  gorevlendirmeler: [],
  oneriler: [],
  cagrilar: [],
  yanitlar: [],
  paketler: [],
  haftalik: [],
  aylik: [],
  ozel: [],
  toplantilar: [],
  faaliyetler: [],
  dosyalar: [],
  hareketler: [],
  mesajlar: [],
  takipler: [],
  geriBildirimSablonlari: [],
  yzGorusleri: [],
  sehirler: [],
  gorevler: [],
  isler: [],
  bahsetmeler: [],
  yapilar: [],
  okundu: {},
  sayac: 0,
});

/**
 * Gerçek kipte davetle gelen kişinin kaydı: davette yalnız ad, e-posta,
 * birim, görev ve rol var; gerisi (şehir, diller, telefon…) kişi ya da
 * yönetici profilden sonra dolduruyor.
 */
export const yeniKisi = (k: { id: string; ad: Yazi; eposta: string; birim: BirimId; gorev: GorevId; rol: Rol; hesapYoneticisi?: boolean }): Kisi => {
  const latin = (typeof k.ad === "string" ? k.ad : k.ad.tr || k.ad.en || k.eposta)
    .normalize("NFD")
    .replace(/[^A-Za-z ]/g, "")
    .trim()
    .split(/ +/)
    .filter(Boolean);
  const ilk = latin[0] ?? k.eposta;
  const son = latin[latin.length - 1] ?? k.eposta;
  return {
    id: k.id,
    ad: k.ad,
    birim: k.birim,
    rol: k.rol,
    gorev: k.gorev,
    sehir: "istanbul",
    diller: [],
    telefon: "",
    eposta: k.eposta,
    kisaltma: (ilk[0] + son.slice(latin.length > 1 ? 0 : 1, latin.length > 1 ? 2 : 3)).toUpperCase(),
    calisma: "kadrolu",
    digerUlkeler: [],
    bicimler: [],
    durum: "gorevde",
    pasif: false,
    hesapYoneticisi: !!k.hesapYoneticisi,
  };
};

/**
 * Gerçek kipin deposu (depo/firebase.ts): kaydı Firestore'dan dinliyor,
 * farkı yazıyor. Bağlanana kadar kayıt boş ve ekran "yükleniyor" diyor.
 */
export interface UzakDepo {
  yaz: (eski: Durum, yeni: Durum) => void;
}
let uzak: UzakDepo | null = null;

/*
 * Tembel: örnek veri akış kurallarını (akis.ts → yapi.ts → veri.ts döngüsü)
 * kullanıyor; kayıt modül açılırken kurulsaydı akış henüz tanımsız olabilirdi.
 */
let durum: Durum | null = null;
let kuruluyor = false;
const simdi = (): Durum => {
  if (!durum) {
    kuruluyor = true;
    try {
      durum = GERCEK ? bosDurum() : yukle(true);
    } finally {
      kuruluyor = false;
    }
  }
  return durum;
};
const dinleyiciler = new Set<() => void>();
const bildir = () => dinleyiciler.forEach((d) => d());

/** Gerçek kip: depo bağlandı; bundan sonra kayıt dışarıdan (başka kişiden) de değişebilir. */
export const uzakDepoyuTak = (d: UzakDepo, ilk: Durum) => {
  uzak = d;
  durum = ilk;
  bildir();
};

/** Gerçek kip: Firestore'dan gelen değişiklik (başka kişi ya da bölme yazdı). */
export const disaridanGeldi = (yeni: Durum) => {
  durum = yeni;
  bildir();
};

/** Başka kopya yazdıysa kaydı yeniden oku; değiştiyse true. */
const tazele = () => {
  if (GERCEK) return false;
  const yeni = izOku();
  if (yeni === iz) return false;
  iz = yeni;
  durum = yukle(false);
  return true;
};

/* Haber vermiyor: çizim sırasında da çağrılıyor (Takvim); yeniden çizim `storage` olayından. */
/** Taze okumadan şimdiki kayıt: çizim sırasında çok kez sorulan yapı (yapi.ts) için; eylemler getir'i kullanır. */
/* Kayıt kurulurken (örnek veri akışı soruyor) null: yapı o sırada varsayılan. */
export const anlik = (): Durum | null => (kuruluyor ? null : simdi());

export const getir = () => {
  tazele();
  return simdi();
};

/*
 * Her yazışı dinleyenler (plan ekranlarının geri alma kaydı, geriAl.ts):
 * eski ve yeni kayıt nesne kimliğiyle karşılaştırılıp yalnız değişen öğe
 * tutuluyor; yazışın kendisine karışmıyorlar.
 */
export const yazisDinleyicileri = new Set<(eski: Durum, yeni: Durum) => void>();

export const kaydet = (yeni: Durum) => {
  // İzlemede yönetici başkasının gözüyle bakıyor: hiçbir şey yazılmıyor, sistemin yazışları da.
  if (izlemede()) {
    window.dispatchEvent(new Event("trt-izleme-yazilmadi"));
    return;
  }
  // Gerçek kipte kayıt sunucuyla eşitlenmeden yazış yok: önbellekten kurulan eski görüntüye dayanan yazış sunucudaki yeni hali eziyordu.
  if (GERCEK && !sunucuyaEsitMi()) {
    window.dispatchEvent(new Event("trt-esitlenmedi"));
    return;
  }
  const eski = simdi();
  durum = yeni;
  for (const f of yazisDinleyicileri) f(eski, yeni);
  if (!GERCEK) yaz(yeni);
  // Depo bağlanmadan yazılan (olmamalı: ekran o sırada "yükleniyor") kayda gitmiyor.
  else uzak?.yaz(eski, yeni);
  bildir();
};

/* Örnek veriye dönüş yalnız demoda; gerçek kayıt silinmiyor. */
export const sifirla = () => {
  if (!GERCEK) kaydet(ORNEK());
};

/* Başka bölme ya da sekme yazınca bu kopya da yeni kayıtla çizilsin; anahtarsız olay localStorage.clear. Gerçek kipte Firestore haber veriyor. */
if (!GERCEK)
  window.addEventListener("storage", (e) => {
    if ((e.key === IZ || e.key === null) && tazele()) bildir();
  });

export function useVeri(): Durum {
  return useSyncExternalStore(
    (d) => {
      dinleyiciler.add(d);
      return () => dinleyiciler.delete(d);
    },
    () => simdi(),
  );
}

export const kimlik = (on: string) => `${on}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* --- Okuma yardımcıları --- */

export const kisiBul = (d: Durum, id?: string) => d.kisiler.find((k) => k.id === id);
export const baslikBul = (d: Durum, id?: string) => d.basliklar.find((b) => b.id === id);
export const planBul = (d: Durum, id?: string) => d.planlar.find((p) => p.id === id);

/** Tarihten önceki en yakın plan: yeni plan onun şablonuyla açılıyor. */
export const oncekiPlan = (d: Durum, tarih: string) =>
  d.planlar.filter((p) => p.tarih < tarih).sort((a, b) => b.tarih.localeCompare(a.tarih))[0];

/** Kişinin değil sistemin yaptığı iş (yarının planını açmak); hareket kaydında kişi yerine bu. */
export const SISTEM = "sistem";

/** Yarının planı: sistem her gün açtığı için hep var. */
export const yarinPlani = (d: Durum) => d.planlar.find((p) => p.tarih === gunEkle(bugun(), 1));

/** Planda önceki günden gelip henüz dokunulmamış kayıt sayısı. */
export const oncekiSayisi = (d: Durum, p: NextDayPlan) =>
  p.ekip.filter((e) => e.onceki).length +
  (p.oncekiHareketler?.length ?? 0) +
  p.basliklar.reduce((n, b) => n + b.muhabirler.filter((m) => m.onceki).length, 0) +
  d.gelismeler.filter((g) => g.planId === p.id && g.onceki).length +
  d.canliYayinlar.filter((c) => c.planId === p.id && c.onceki).length;
export const paketBul = (d: Durum, id?: string) => d.paketler.find((p) => p.id === id);
export const oneriBul = (d: Durum, id?: string) => d.oneriler.find((o) => o.id === id);
export const haftaBul = (d: Durum, id?: string) => d.haftalik.find((h) => h.id === id);
export const faaliyetBul = (d: Durum, id?: string) => d.faaliyetler.find((f) => f.id === id);
export const muhabirler = (d: Durum) => d.kisiler.filter((k) => k.birim === "muhabir");

/** Çağrının türü; alanı olmayan kayıt Next Day. */
export const cagriTuru = (c: { tur?: CagriTuru }): CagriTuru => c.tur ?? "nextday";

/** Açık çağrı: günü (haftalıkta haftası) henüz gelmemiş, en son hazırlanan. */
export const acikCagri = (d: Durum, tur: CagriTuru, bugun: string) =>
  d.cagrilar.filter((c) => cagriTuru(c) === tur && c.tarih > bugun).sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
