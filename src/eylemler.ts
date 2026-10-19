import { adiylaBaslik } from "./baslikSecimi";
import { adimTuru, akisDamgasi, durakSahibi, geriHedefi, kolSahibi, ilkAdim, paketSahibi, sonrakiAdim, stokDurumu, type UretimAdimi } from "./akis";
import { bosYanitMi, cagriyiBul, gondereniBul, yanittanOneriTaslagi, yeniMetin, type GelenEposta } from "./eposta";
import { gundemde, haftaSonu, kalemAdi, kararBekleyenler, nextDayeGider, onIncelemeyeGidebilir } from "./haftalik";
import { GERCEK } from "./kip";
import type { MuhabirTaslagi } from "./iceAktar";
import { geriUygula, sessizce, sonAdimiAl } from "./geriAl";
import { arSade, planTaslagi, type PlanTaslagi } from "./planAktar";
import { geriBildirimAyari, sablonlar } from "./geriBildirim";
import { metin, yaz, type Yazi } from "./dil";
import { ayniYapi, birimUnvanlari, birimdenUnvanCikar, birimeUnvanEkle, disMuhabirMi, ekipGorevleri, guncelYapi, muhabirYerUnvani, otomatikMuhabirUnvaniMi, sehirMuhabirUnvaniId, unvanListesi, unvandanRol, yerUnvaniUygula, varsayilanYapi, type Yapi } from "./yapi";
import { KISAYOL_EN_COK, kisayolGorebilir } from "./kisayol";
import { BOLME_EN_COK, ORTAM_EN_COK, bolmeyeGirer, kisininOrtamlari, varsayilanDuzen, yolTemizle } from "./ortam";
import { TAKVIM_KAYNAGI } from "./takvim";
import { temizle, type TemizlikSecimi } from "./temizlik";
import { planCiftleriniBirlestir } from "./planCiftleri";
import { satir, sehirAdi, sehirAr, sehirListesi, sehirUlkesi } from "./etiketler";
import { oneriHaftada, oneriPaketBasligi, oneriYeri } from "./oneriPlanlari";
import { donemAnahtari, gorevListesi, isListesi } from "./gorevler";
import { bugun, gunEkle, gunFarki, haftaBasi, simdi } from "./tarih";
import { oncesi, siradaki } from "./ozel";
import { yeniAnilanlar } from "./bahsetme";
import {
  ORTAM_DUZENLERI,
  ULKE_BOLGESI,
  cagriTuru,
  faaliyetBul,
  getir,
  haftaBul,
  kaydet,
  kimlik,
  kisiBul,
  yeniKisi,
  SISTEM,
  NAFIZE_SIRASI,
  OZEL_SIRASI,
  oncekiPlan,
  oneriBul,
  paketBul,
  planBul,
  type Birim,
  type EkipGoreviId,
  type BirimId,
  type GorevId,
  type Mesaj,
  type YzGorus,
  type PlanAdi,
  type BolmeEkseni,
  type CanliYayin,
  type AylikPlan,
  type Durum,
  type EkipUyesi,
  type Faaliyet,
  type FaaliyetBaglantisi,
  type Oncelik,
  type Ortam,
  type OrtamDuzeni,
  type FaaliyetDurum,
  type Potansiyel,
  type GeriBildirimAyari,
  type GeriBildirimSablonu,
  type Gelisme,
  type Gorevlendirme,
  type GorevTanimi,
  type Is,
  type IsDurumu,
  type Hareket,
  type IcerikTuru,
  type Bicim,
  type CagriTuru,
  type HaftalikKalem,
  type HaftalikPlan,
  type Kanal,
  type KaynakTuru,
  type Karar,
  type HesapYetkisi,
  type Kisi,
  type NextDayPlan,
  type Oneri,
  type OneriGorunumu,
  type Paket,
  type OzelYayin,
  type OzelIz,
  type OzelDurum,
  type Nafize,
  type NafizeDurum,
  type Konuk,
  type OzelTalep,
  type OzelPaketOnerisi,
  type PlanBasligi,
  type Bahsetme,
  type TalepDurum,
  type PlanDurum,
  type PlanMuhabiri,
  type Sehir,
  type TakipTuru,
  type Ulke,
  type Yanit,
  type YanitDurum,
  paketBicimi,
  baslikBul,
  TAKIP_BICIMI,
  type OneriBicimi,
  type Takip,
} from "./veri";
import {
  adimYapabilir,
  haftalikDuzenler,
  hesapYetkisi,
  epostaDegistirebilir,
  geriBildirimGonderebilir,
  geriBildirimSablonuDuzenler,
  takipTamamlayabilir,
  tamamlamaGeriAlabilir,
  yalnizPlanlama,
  kararVerebilir,
  mudahaleEdebilir,
  muhabireOneriGonderebilir,
  oneriDuzeltmeyeGider,
  oneriYazisabilir,
  teklifYanitlayabilir,
  oneriYenidenGonderebilir,
  onIncelemeci,
  paketGorebilir,
  planIcerikDuzenler,
  paketPlandanSilinir,
  planOperasyonDuzenler,
  profilDuzenler,
  sayfaGorebilir,
  takipEkleyebilir,
  takipGorebilir,
  talimatVerebilir,
  uretimeAlabilir,
  yapabilir,
  yapiDuzenleyebilir,
  kayitTemizleyebilir,
  gorevleriDuzenler,
  isDegistirebilir,
  isEkleyebilir,
  isAlabilir,
  isVerilebilecekBirimler,
  oneriDuzenleyebilir,
  yzGorusuGorur,
  kararNotuYazabilir,
  paketTamamlayabilir,
  planAdimiYapabilir,
  ozelDuzenler,
  ozelPaketDagitabilir,
  ozelPaketTeslimEdebilir,
} from "./yetki";

/**
 * Eylemler: kaydı değiştiren her şey buradan geçiyor.
 *
 * Her eylem önce yetkiyi yeniden soruyor (düğme gizli olsa bile eski bir
 * sekmeden gelen istek geri dönsün), sonra kaydı değiştirip hareket
 * geçmişine yazıyor. Hareketin `veri.sahip` alanı işin kimin önüne
 * düştüğünü tutuyor; bildirimler oradan çıkıyor. Yetkisi olmayan çağrı
 * sessizce hiçbir şey yapmıyor ve false dönüyor.
 */

const EN_COK_HAREKET = 2000;

/** `id` verilirse o: aynı işi aynı anda yapan iki tarayıcı (sistemin planı) aynı hareketi yazsın, çift kayıt doğmasın. */
const hareketYaz = (d: Durum, h: Omit<Hareket, "id" | "zaman">, id?: string): Durum => ({
  ...d,
  hareketler: [{ id: id ?? kimlik("h"), zaman: simdi(), ...h }, ...d.hareketler.filter((x) => !id || x.id !== id)].slice(0, EN_COK_HAREKET),
});

/*
 * Sistemin açtığı günün planının kimliği tarihten: gün dönünce açık duran
 * her tarayıcı yarının planını yokluyor ve gerçek kipte öbürünün açtığı
 * plan ona geç ulaşıyor. Rastgele kimlikle her biri ayrı plan açıyordu
 * (aynı güne birden çok plan); kimlik aynı olunca aynı belgeyi yazıyorlar.
 * Planın içindeki kayıtların kimliği de kaynağından türüyor, yoksa aynı
 * plana iki kopya içerik düşerdi.
 */
export const gunPlaniKimligi = (tarih: string) => `nd-${tarih}`;

/** Plandaki kaydın kimliği plandan ve kaynağından; kaynağın kimliği özetleniyor, yoksa kopya kopyası her gün uzardı. */
const turet = (planId: string, kaynak: string) => {
  let h = 5381;
  for (let i = 0; i < kaynak.length; i++) h = ((h << 5) + h + kaynak.charCodeAt(i)) >>> 0;
  return `${planId}-${h.toString(36)}`;
};

const planGuncelle = (d: Durum, id: string, f: (p: NextDayPlan) => NextDayPlan): Durum => ({
  ...d,
  planlar: d.planlar.map((p) => (p.id === id ? f(p) : p)),
});

const paketGuncelle = (d: Durum, id: string, f: (p: Paket) => Paket): Durum => ({
  ...d,
  paketler: d.paketler.map((p) => (p.id === id ? { ...f(p), guncelleme: simdi() } : p)),
});

const yeniKod = (d: Durum): [string, Durum] => {
  const sayac = d.sayac + 1;
  return [`TRT-AR-${new Date().getFullYear()}-${String(sayac).padStart(4, "0")}`, { ...d, sayac }];
};

/* --- Öneri çağrısı ve öneriler --- */

/*
 * Çağrı kaydı: gönderim planlamacının kendi e-postasından (Outlook taslağı
 * ya da telefon), uygulama göndermiyor. Kayıt muhabir ekranına açık çağrı
 * düşürüyor ve gelen yanıtların eşleşeceği etiketi ve BCC listesini tutuyor.
 */
export const cagriKaydet = (
  ben: Kisi,
  g: { tur: CagriTuru; tarih: string; metin: string; sonSaat: string; kime: string; bcc: string[]; etiket: string },
) => {
  if (!yapabilir(ben, "cagriHazirla") || !g.kime.trim()) return false;
  let d = getir();
  /* Aynı plan için ikinci kez açılırsa yeni çağrı değil güncelleme: yanıtlar tek etikete bağlanıyor. */
  const var_ = d.cagrilar.find((c) => c.etiket === g.etiket);
  if (var_) {
    kaydet({ ...d, cagrilar: d.cagrilar.map((c) => (c.id === var_.id ? { ...c, ...g } : c)) });
    return true;
  }
  const id = kimlik("c");
  d = { ...d, cagrilar: [{ id, olusturan: ben.id, zaman: simdi(), ...g }, ...d.cagrilar] };
  const haftaId = g.tur === "haftalik" ? d.haftalik.find((h) => h.baslangic === g.tarih)?.id : undefined;
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "cagriHazirlandi",
      haftaId,
      veri: { tarih: g.tarih, sahip: "muhabir", ...(g.tur === "haftalik" ? { hafta: "1" } : {}) },
    }),
  );
  return true;
};


export interface OneriGirdisi {
  /** Muhabir adına girilende muhabir; muhabir dışı kaynakta boş, kaynakTuru dolu. */
  muhabirId?: string;
  kaynakTuru?: KaynakTuru;
  kaynakAdi?: string;
  ulke: Ulke;
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  tur: IcerikTuru;
  bicim?: OneriBicimi;
  /** "Takip" türünde muhabirin takibine giden tür; boşsa "diğer". */
  takipTuru?: TakipTuru;
  sahaGerekli: boolean;
  kanal: Kanal;
  /** Biri dolu: önerinin günü (muhabirin formu, Next Day ekranı) ya da haftalık ekrandan girilende haftanın Cumartesi'si. */
  hedefTarih?: string;
  /** Çok günlü etkinlikte son gün (hedefTarih'ten sonra); boşsa tek gün. */
  bitisTarih?: string;
  hafta?: string;
  /** Haftalık öneride muhabirin haberi yapacağı gün (haftanın içinde); boşsa zamana bağlı değil. */
  haftaGunu?: string;
  /** Planlama takibi öneriye çeviriyor: öneri takibe bağlanıyor (takip kartında "İşe dönüştü"). */
  takipId?: string;
}

/** Gönderilen "Takip" türü öneri olmuyor, takip açıyor (oneriGonder); dönen kimlik takibin. */
export const takipKimligiMi = (id: string) => id.startsWith("tk");

/*
 * "Takip" türündeki öneri ile muhabirin takibi aynı işin iki yüzü: öneri
 * takip türünde kaldıkça ve plana girmedikçe başlık (Header ↔ konu) ve
 * gelişme (↔ açıklama) ikisinde aynı. Bağlı takip yoksa (öneri yeni
 * gönderildi ya da sonradan takibe çevrildi) muhabire takip açılıyor.
 * Planlama türü değiştirince (işe çevirince) bağ kalıyor, metinler ayrışıyor.
 */
const takibiEsle = (d: Durum, o: Oneri, tur?: TakipTuru): [Durum, Oneri] => {
  if (o.bicim !== TAKIP_BICIMI || !o.muhabirId || o.durum === "planaEklendi") return [d, o];
  const t = o.takipId ? d.takipler.find((x) => x.id === o.takipId) : undefined;
  if (t) {
    if (t.konu === o.haberBasligi && (t.aciklama ?? "") === o.gelisme) return [d, o];
    const { aciklama: _, ...kalan } = t;
    return [{ ...d, takipler: d.takipler.map((x) => (x === t ? { ...kalan, konu: o.haberBasligi, ...(o.gelisme && { aciklama: o.gelisme }) } : x)) }, o];
  }
  const tarih = o.hedefTarih ?? o.haftaGunu;
  const yeni: Takip = {
    id: kimlik("tk"),
    muhabirId: o.muhabirId,
    sehir: kisiBul(d, o.muhabirId)?.sehir ?? "istanbul",
    zaman: simdi(),
    konu: o.haberBasligi,
    ...(o.gelisme && { aciklama: o.gelisme }),
    tur: tur ?? "diger",
    ...(tarih && { tarih }),
  };
  return [{ ...d, takipler: [yeni, ...d.takipler] }, { ...o, takipId: yeni.id }];
};

export const oneriGonder = (ben: Kisi, g: OneriGirdisi): string | null => {
  if (!yapabilir(ben, "oneriGonder") || (!g.hafta && !g.hedefTarih)) return null;
  const muhabir = ben.birim === "muhabir";
  const takip = g.bicim === TAKIP_BICIMI;
  // Muhabirin önerisinde header, gelişme ve strap zorunlu (formdaki kuralın aynısı); takipte paket önerilmiyor.
  if (muhabir && (!g.haberBasligi?.trim() || !g.gelisme?.trim() || (!takip && !g.paketBasligi?.trim()))) return null;
  /*
   * Muhabir yalnız kendi adına gönderir. Planlama sistem dışından geleni
   * elle girer: ya bir muhabir adına (telefon, mesaj) ya da muhabir dışı
   * bir kaynaktan (ajans, resmî duyuru, başka birim); ikisi birden değil.
   */
  const muhabirId = muhabir ? ben.id : g.muhabirId || undefined;
  const kaynakTuru = muhabir || muhabirId ? undefined : g.kaynakTuru;
  if (!muhabirId && (!kaynakTuru || kaynakTuru === "muhabir")) return null;
  // Takip muhabirin takiplerine giriyor; muhabiri olmayan kaynakta takip yok.
  if (takip && !muhabirId) return null;
  const kanal: Kanal = muhabir ? "sistem" : g.kanal;
  let d = getir();
  if (!muhabir && muhabirId && kisiBul(d, muhabirId)?.birim !== "muhabir") return null;
  /*
   * Yalnız gelişme bildiren gönderi öneri değil, takip: Planlama'nın öneri
   * listelerine ve plan ekranının gelen önerilerine karışmıyor, muhabirin
   * ve Planlama'nın takiplerine düşüyor. Planlama isterse takibi öneriye
   * çeviriyor (takipten öneri, aşağıda takipId).
   */
  if (takip && muhabirId) {
    const tk: Takip = {
      id: kimlik("tk"),
      muhabirId,
      sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
      zaman: simdi(),
      konu: g.haberBasligi.trim(),
      ...(g.gelisme.trim() && { aciklama: g.gelisme.trim() }),
      tur: g.takipTuru ?? "diger",
      ...((g.hedefTarih ?? g.haftaGunu) && { tarih: g.hedefTarih ?? g.haftaGunu }),
    };
    d = { ...d, takipler: [tk, ...d.takipler] };
    kaydet(hareketYaz(d, { kisiId: ben.id, tip: "takipEklendi", veri: { takipId: tk.id, ...(muhabir ? { sahip: "planlama" } : { kime: muhabirId }) } }));
    return tk.id;
  }
  // Takipten çevrilen öneri o takibe bağlanıyor; takip aynı muhabirin olmalı.
  const kaynakTakip = g.takipId ? d.takipler.find((x) => x.id === g.takipId && x.muhabirId === muhabirId) : undefined;
  // Çağrı muhabirlere gidiyor; ajanstan ya da bakanlıktan gelen öneri ona verilmiş yanıt değil.
  // Günü (aralığı) olan öneri önce o günün Next Day çağrısına, yoksa haftasının haftalık çağrısına bağlanıyor.
  const bitis = !g.hafta && g.hedefTarih && g.bitisTarih && g.bitisTarih > g.hedefTarih ? g.bitisTarih : undefined;
  const son = bitis ?? g.hedefTarih ?? "";
  const cagri = !muhabirId
    ? undefined
    : g.hafta
      ? d.cagrilar.find((c) => cagriTuru(c) === "haftalik" && c.tarih === g.hafta)
      : (d.cagrilar.find((c) => cagriTuru(c) === "nextday" && c.tarih >= g.hedefTarih! && c.tarih <= son) ??
        d.cagrilar.find((c) => cagriTuru(c) === "haftalik" && c.tarih <= son && gunEkle(c.tarih, 6) >= g.hedefTarih!));
  const id = kimlik("o");
  let oneri: Oneri = {
    id,
    muhabirId,
    kaynakTuru,
    kaynakAdi: kaynakTuru ? g.kaynakAdi?.trim() || undefined : undefined,
    giren: muhabir ? undefined : ben.id,
    ulke: g.ulke,
    haberBasligi: g.haberBasligi,
    gelisme: g.gelisme,
    paketBasligi: g.paketBasligi || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
    zaman: simdi(),
    kanal,
    hedefTarih: g.hafta ? undefined : g.hedefTarih,
    ...(bitis && { bitisTarih: bitis }),
    hafta: g.hafta,
    ...(g.hafta && g.haftaGunu && g.haftaGunu >= g.hafta && g.haftaGunu <= gunEkle(g.hafta, 6) && { haftaGunu: g.haftaGunu }),
    durum: "yeni",
    cagriId: cagri?.id,
    ...(kaynakTakip && { takipId: kaynakTakip.id }),
  };
  [d, oneri] = takibiEsle(d, takip ? { ...oneri, paketBasligi: undefined } : oneri, g.takipTuru);
  d = { ...d, oneriler: [oneri, ...d.oneriler] };
  // Elle girilende hareketi yapan giren kişi; geçmişte "gönderdi" değil "girdi" okunsun.
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriGeldi", oneriId: id, veri: { sahip: "planlama", ...(muhabir ? {} : { elle: "1" }) } }));
  return id;
};

/*
 * Yöneticinin haber talimatı: "şunun haberini yapalım". Ayrı bir akış
 * kurulmuyor; Planlama'nın önüne öneri gibi düşüyor ama reddedilemiyor,
 * plana eklenince doğan paket öncelikli. Muhabiri Planlama atıyor.
 */
export interface TalimatGirdisi {
  haberBasligi: string;
  aciklama: string;
  ulke: Ulke;
  hedefTarih: string;
}

export const talimatVer = (ben: Kisi, g: TalimatGirdisi): string | null => {
  if (!talimatVerebilir(ben) || !g.haberBasligi.trim()) return null;
  let d = getir();
  const id = kimlik("o");
  const baslik = g.haberBasligi.trim();
  d = {
    ...d,
    oneriler: [
      {
        id,
        talimatVeren: ben.id,
        ulke: g.ulke,
        haberBasligi: baslik,
        gelisme: g.aciklama.trim() || baslik,
        paketBasligi: baslik,
        tur: "haber",
        sahaGerekli: false,
        zaman: simdi(),
        kanal: "sistem",
        hedefTarih: g.hedefTarih,
        durum: "yeni",
      },
      ...d.oneriler,
    ],
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "talimatVerildi", oneriId: id, veri: { sahip: "planlama" } }));
  return id;
};

export const oneriDurum = (ben: Kisi, id: string, yeni: "degerlendiriliyor" | "sonra" | "reddedildi", gerekce = "") => {
  if (!yapabilir(ben, "oneriDegerlendir")) return false;
  let d = getir();
  const o = oneriBul(d, id);
  if (!o || o.durum === "planaEklendi") return false;
  // Talimat reddedilmez ve ertelenmez; yalnız değerlendirmeye alınıp plana eklenir.
  if (o.talimatVeren && yeni !== "degerlendiriliyor") return false;
  d = { ...d, oneriler: d.oneriler.map((x) => (x.id === id ? { ...x, durum: yeni, gerekce: gerekce || x.gerekce } : x)) };
  const tip = yeni === "degerlendiriliyor" ? "oneriDegerlendirmede" : yeni === "sonra" ? "oneriSonra" : "oneriReddedildi";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, oneriId: id, veri: gerekce ? { gerekce } : undefined }));
  return true;
};

/**
 * Öneriyi neyin değişmesi gerektiğini yazarak muhabire geri gönderir. Not
 * zorunlu: muhabir ne yapacağını bilmeden geri dönen öneri bir tur daha
 * kaybettirir. Hareketin sahibi yok; muhabir kendi işindeki hareketten
 * bildirimi zaten alıyor.
 */
export const oneriDuzeltmeIste = (ben: Kisi, id: string, not: string) => {
  const metin = not.trim();
  let d = getir();
  const o = oneriBul(d, id);
  if (!o || !metin || !oneriDuzeltmeyeGider(ben, o)) return false;
  d = {
    ...d,
    oneriler: d.oneriler.map((x) => (x.id === id ? { ...x, durum: "duzeltme" as const, duzeltmeNotu: metin, duzeltmeSayisi: (x.duzeltmeSayisi ?? 0) + 1 } : x)),
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriDuzeltmeIstendi", oneriId: id, veri: { not: metin } }));
  return true;
};

/*
 * Muhabir düzeltilen öneriyi yeniden gönderir; öneri aynı kayıt kalır
 * (geçmiş, çağrı ve hedef plan kopmasın), Planlama'nın önüne yeniden
 * "yeni" olarak düşer. Önceki hal hareketin verisinde: önerinin
 * gönderildiği hal böylece kaybolmuyor.
 */
export const oneriYenidenGonder = (ben: Kisi, id: string, g: YanitOneriGirdisi) => {
  let d = getir();
  const o = oneriBul(d, id);
  if (!o || !oneriYenidenGonderebilir(ben, o) || !g.haberBasligi.trim() || !g.gelisme.trim() || (g.bicim !== TAKIP_BICIMI && !g.paketBasligi?.trim())) return false;
  const onceki: Record<string, string> = { haberBasligi: o.haberBasligi, gelisme: o.gelisme };
  if (o.paketBasligi) onceki.paketBasligi = o.paketBasligi;
  let yeni: Oneri = {
    ...o,
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
    durum: "yeni",
  };
  [d, yeni] = takibiEsle(d, yeni);
  d = { ...d, oneriler: d.oneriler.map((x) => (x.id === id ? yeni : x)) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriYenidenGonderildi", oneriId: id, veri: { sahip: "planlama", ...onceki } }));
  return true;
};

/**
 * Öneriyi plana ekler. Öneri mevcut bir başlığa bağlanır ya da havuza yeni
 * başlık açar; gelişme o planın başlığı altına düşer, paket başlığı
 * önerilmişse "değerlendiriliyor" durumunda bir paket önerisi doğar.
 * Önerinin kendisi (muhabirin yazdığı metin) değişmez; yalnız durumu ve
 * bağlantıları güncellenir.
 */
/*
 * Öneri plana girince "YER /" ardından yazılan: önerinin gelişme/açıklama
 * metni. Önce Header yazılıyordu; producer'lar planda gelişmeyi görüp
 * kendileri kısaltmak istedi. Açıklaması boşsa Header.
 */
export const planMetni = (o: Oneri) => o.gelisme.trim() || o.haberBasligi;

export const oneriPlanaEkle = (
  ben: Kisi,
  oneriId: string,
  g: { planId: string; baslikId?: string; yeniBaslik?: string; paketOlustur: boolean; yalnizTakip?: boolean; muhabirId?: string },
): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const plan = planBul(d, g.planId);
  if (!o || !plan || !yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, plan)) return false;
  // Haftalık gündemdeki öneri Next Day'e ayrıca girmez: kesinleşince haftalıktan aktarılıyor, iki kez düşerdi.
  // Kesinleşmiş haftanın kalemi yalnız kayıt: Next Day'den çıkarılan öneri yeniden eklenebiliyor.
  if (o.durum === "planaEklendi" || d.haftalik.some((h) => h.durum !== "kesinlesti" && h.kalemler.some((k) => k.oneriId === o.id))) return false;
  // Talimatın ve muhabir dışı kaynağın muhabiri yok; Planlama burada atıyor. Önerinin kendisi değişmiyor.
  const muhabirId = o.muhabirId ?? (g.muhabirId || undefined);

  let baslikId = g.baslikId;
  // Yeni yazılan ad havuzda varsa o başlık: aynı dosya ikinci kez açılmasın, plandaki başlığa girsin.
  if (!baslikId && g.yeniBaslik?.trim()) [baslikId, d] = dosyaAc(d, g.yeniBaslik, o.ulke);
  if (!baslikId) return false;

  let pb = plan.basliklar.find((b) => b.baslikId === baslikId);
  if (!pb) pb = { id: kimlik("pb"), baslikId, muhabirler: [] };
  const pbId = pb.id;
  const yeniPb = {
    ...pb,
    muhabirler: !muhabirId || pb.muhabirler.some((m) => m.kisiId === muhabirId) ? pb.muhabirler : [...pb.muhabirler, { kisiId: muhabirId }],
  };
  d = planGuncelle(d, plan.id, (p) => ({
    ...p,
    basliklar: p.basliklar.some((b) => b.id === pbId) ? p.basliklar.map((b) => (b.id === pbId ? yeniPb : b)) : [...p.basliklar, yeniPb],
  }));

  /*
   * Kurumun düzeni: dosyanın altında "YER / gelişme" (yer muhabirin şehri,
   * ekranda ve çıktıda gelişmenin yeri), paket önerisiyse "PKG" altında
   * "YER / strap / muhabir". Gelişme satırına önerinin açıklaması yazılıyor
   * (planMetni); producer'lar onu planda kısaltıp düzeltiyor.
   */
  // Yalnız takip paketi dışlıyor: paket istenmedi, muhabir konuyu izliyor.
  const yalnizTakip = !!g.yalnizTakip && !!muhabirId;
  // "Live" haber paket değil, planın canlı yayını: çıktıda "مباشر" bölümünde; paket önerisi doğsaydı orada hiç görünmüyordu.
  const canliMi = o.bicim === "canli";
  const strap = oneriPaketBasligi(o);
  const paketli = g.paketOlustur && !!strap && !yalnizTakip && !canliMi;
  const canliAc = g.paketOlustur && canliMi && !yalnizTakip;
  const gelisme: Gelisme = {
    id: kimlik("g"),
    planId: plan.id,
    planBaslikId: pbId,
    metin: planMetni(o),
    // Gelişmenin kaynağı önerinin kaynağı: ajanstan girilen öneri planda da ajans olarak görünsün.
    kaynakTuru: o.talimatVeren ? "diger" : (o.kaynakTuru ?? "muhabir"),
    kaynakAdi: o.kaynakAdi ?? "",
    tarih: o.zaman,
    onerenId: muhabirId,
    oneriId: o.id,
  };
  d = { ...d, gelismeler: [...d.gelismeler, gelisme] };

  let paketId: string | undefined;
  if (paketli) {
    const muhabir = kisiBul(d, muhabirId);
    let kod: string;
    [kod, d] = yeniKod(d);
    paketId = kimlik("p");
    const paket: Paket = {
      id: paketId,
      kod,
      planId: plan.id,
      planBaslikId: pbId,
      baslik: strap ?? "",
      sehir: muhabir?.sehir ?? "istanbul",
      muhabirId,
      aciklama: o.gelisme,
      tur: o.tur,
      bicim: paketBicimi(o.bicim),
      durum: "degerlendiriliyor",
      sahaGerekli: o.sahaGerekli,
      oneriId: o.id,
      oncelikli: o.talimatVeren ? true : undefined,
      notlar: [],
      olusturma: simdi(),
      guncelleme: simdi(),
    };
    d = { ...d, paketler: [paket, ...d.paketler] };
  }
  if (canliAc) {
    const canli: CanliYayin = {
      id: kimlik("cy"),
      planId: plan.id,
      planBaslikId: pbId,
      konu: o.paketBasligi?.trim() || o.haberBasligi,
      aciklama: "",
      tarih: plan.tarih,
      // Saat öneride yok; çıktıda "TBC", Planlama sonra yazıyor.
      saatGmt: "",
      yer: sehirAr(kisiBul(d, muhabirId)?.sehir),
      muhabirId,
      notlar: "",
      oneriId: o.id,
    };
    d = { ...d, canliYayinlar: [...d.canliYayinlar, canli] };
  }

  d = {
    ...d,
    oneriler: d.oneriler.map((x) =>
      x.id === o.id ? { ...x, durum: "planaEklendi", baslikId, planId: plan.id, planTarihi: plan.tarih, paketId, ...(yalnizTakip && { yalnizTakip: true, takip: "acik" as const }) } : x,
    ),
  };
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "oneriPlanaEklendi",
      oneriId: o.id,
      paketId,
      planId: plan.id,
      // Talimat plana girince talimatı veren yönetici haberdar oluyor.
      veri: { ...(o.talimatVeren ? { tarih: plan.tarih, kime: o.talimatVeren } : { tarih: plan.tarih }), ...(yalnizTakip && { takip: "1" }) },
    }),
  );
  return true;
};

/** Takibin bu plandaki gelişmesi (varsa): takip aynı plana iki kez girmiyor. */
export const takipPlanda = (d: Pick<Durum, "gelismeler">, takipId: string, planId: string) => d.gelismeler.find((g) => g.takipId === takipId && g.planId === planId);

/*
 * Muhabirin takibi (متابعة) plandaki başlığın altına gelişme olarak giriyor:
 * takip iş önerisi değil bilgi, ama bildirdiği gelişme planın satırı olabilir.
 * Öneriye çevirmeden doğrudan; kurumun düzeniyle "YER / metin" (yer muhabirin
 * şehri, onerenId'den), metin takibin açıklaması, yoksa konusu. Muhabir başlığa
 * yazılmıyor: kaynak o, haberi yapan değil. Takip açık kalıyor, muhabire bildirim.
 */
export const takipGelismeEkle = (ben: Kisi, takipId: string, g: { planId: string; baslikId?: string; yeniBaslik?: string }): boolean => {
  let d = getir();
  const tk = d.takipler.find((x) => x.id === takipId);
  const plan = planBul(d, g.planId);
  if (!tk || tk.kapandi || !plan || !takipGorebilir(ben, tk) || !planOperasyonDuzenler(ben, plan) || takipPlanda(d, tk.id, plan.id)) return false;
  let baslikId = g.baslikId;
  // Havuzda aynı adlı başlık varsa o: havuz ikiye bölünmesin.
  if (!baslikId && g.yeniBaslik?.trim()) [baslikId, d] = dosyaAc(d, g.yeniBaslik, ulkesi(tk.sehir));
  if (!baslikId) return false;
  let pb = plan.basliklar.find((b) => b.baslikId === baslikId);
  if (!pb) {
    pb = { id: kimlik("pb"), baslikId, muhabirler: [] };
    const yeniPb = pb;
    d = planGuncelle(d, plan.id, (p) => ({ ...p, basliklar: [...p.basliklar, yeniPb] }));
  }
  const gelisme: Gelisme = {
    id: kimlik("g"),
    planId: plan.id,
    planBaslikId: pb.id,
    metin: tk.aciklama?.trim() || tk.konu,
    kaynakTuru: "muhabir",
    kaynakAdi: "",
    tarih: simdi(),
    onerenId: tk.muhabirId,
    takipId: tk.id,
  };
  d = { ...d, gelismeler: [...d.gelismeler, gelisme] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "takipPlanaEklendi", planId: plan.id, veri: { takipId: tk.id, tarih: plan.tarih, kime: tk.muhabirId } }));
  return true;
};

/*
 * Plandan çıkan öneri yeniden öneri olur. Önerinin gelişmesi ve paketi
 * plandan silinince öneri "plana eklendi"de kalıyor, listede kararı da
 * açılmıyordu. Yalnız az önce silinen kayda bağlı öneriler bakılıyor: eski
 * kayıtta gelişmesi zaten olmayan öneri her silişte geri dönmesin.
 */
const plandanDonmus = (o: Oneri): Oneri => {
  const { planId: _p, planTarihi: _t, paketId: _k, ...x } = o;
  // Yalnız takip plan kararıydı: plandan çıkınca takip de kalkıyor.
  if (x.yalnizTakip) {
    const { yalnizTakip: _y, takip: _tk, takipBitis: _tb, takipBitiren: _tr, ...y } = x;
    return { ...y, durum: "degerlendiriliyor" };
  }
  return { ...x, durum: "degerlendiriliyor" };
};
const oneriBaglariniTazele = (d: Durum, oneriIdleri: (string | undefined)[]): Durum => {
  const ids = new Set(
    oneriIdleri.filter((id): id is string => {
      const o = id ? oneriBul(d, id) : undefined;
      return (
        !!o &&
        o.durum === "planaEklendi" &&
        !d.gelismeler.some((g) => g.oneriId === o.id && g.planId === o.planId) &&
        !d.paketler.some((p) => p.oneriId === o.id && p.planId === o.planId && p.durum !== "iptal") &&
        !d.canliYayinlar.some((c) => c.oneriId === o.id && c.planId === o.planId)
      );
    }),
  );
  return ids.size ? { ...d, oneriler: d.oneriler.map((o) => (ids.has(o.id) ? plandanDonmus(o) : o)) } : d;
};

/**
 * Öneriyi girdiği plandan çıkarır, öneri yeniden "değerlendiriliyor":
 * Next Day'de gelişmesi ve paketi (ileri gitmemişse) silinir, başlığa
 * onunla gelen muhabir başka işi yoksa çıkar, başlık boş kaldıysa o da;
 * haftalıkta gündemdeki kalemi (hafta kesinleşmemişse). Paketi üretime
 * girmişse "paketIlerledi": geçmişi kalsın, paket ekranından iptal edilir.
 */
export const oneriPlandanCikar = (ben: Kisi, oneriId: string): "tamam" | "yetkisiz" | "paketIlerledi" => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const yer = o ? oneriYeri(d, o) : null;
  if (!o || !yer || !yapabilir(ben, "oneriDegerlendir")) return "yetkisiz";
  // Kesinleşmiş haftadan Next Day'e geçmiş öneri planından çıkıyor; haftanın kalemi kayıt olarak kalıyor.
  const haftadan = !!yer.hafta && yer.hafta.durum === "kesinlesti" && yer.planda;
  if (yer.hafta && !haftadan && (yer.hafta.durum === "kesinlesti" || !haftalikDuzenler(ben, yer.hafta))) return "yetkisiz";
  if (yer.planda && (!yer.plan || !planIcerikDuzenler(ben, yer.plan))) return "yetkisiz";
  if (yer.planda && yer.plan) {
    const plan = yer.plan;
    const paketler = d.paketler.filter((p) => p.oneriId === o.id && p.planId === plan.id);
    if (paketler.some((p) => p.durum !== "iptal" && !paketPlandanSilinir(p))) return "paketIlerledi";
    const gidenG = new Set(d.gelismeler.filter((g) => g.oneriId === o.id && g.planId === plan.id).map((g) => g.id));
    const gidenP = new Set(paketler.map((p) => p.id));
    d = {
      ...d,
      gelismeler: d.gelismeler.filter((g) => !gidenG.has(g.id)),
      paketler: d.paketler.filter((p) => !gidenP.has(p.id)),
      canliYayinlar: d.canliYayinlar.filter((c) => !(c.oneriId === o.id && c.planId === plan.id)),
    };
    const muhabirId = o.muhabirId;
    const pbIdler = new Set(plan.basliklar.filter((b) => b.baslikId === o.baslikId).map((b) => b.id));
    const isVar = (pbId: string, kisiId?: string) =>
      d.gelismeler.some((g) => g.planBaslikId === pbId && (!kisiId || g.onerenId === kisiId)) ||
      d.paketler.some((p) => p.planBaslikId === pbId && (!kisiId || p.muhabirId === kisiId)) ||
      (!kisiId && d.canliYayinlar.some((c) => c.planBaslikId === pbId));
    if (pbIdler.size)
      d = planGuncelle(d, plan.id, (p) => ({
        ...p,
        basliklar: p.basliklar
          .map((b) => (pbIdler.has(b.id) && muhabirId && !isVar(b.id, muhabirId) ? { ...b, muhabirler: b.muhabirler.filter((m) => m.kisiId !== muhabirId) } : b))
          .filter((b) => !pbIdler.has(b.id) || b.muhabirler.length > 0 || isVar(b.id)),
      }));
  }
  if (yer.hafta && yer.kalem && !haftadan) {
    const kalemId = yer.kalem.id;
    d = haftaGuncelle(d, yer.hafta.id, (x) => ({ ...x, kalemler: x.kalemler.filter((k) => k.id !== kalemId) }));
  }
  d = { ...d, oneriler: d.oneriler.map((x) => (x.id === o.id ? plandanDonmus(x) : x)) };
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "oneriPlandanCikarildi",
      oneriId: o.id,
      ...(yer.planda && yer.plan ? { planId: yer.plan.id, veri: { tarih: yer.plan.tarih } } : { haftaId: yer.hafta?.id, veri: { tarih: yer.hafta?.baslangic ?? "" } }),
    }),
  );
  return "tamam";
};

/**
 * Kayıt temizliği: tam yönetici deneme sürecinde girilenleri izleriyle
 * siliyor (temizlik.ts). Silinen sayısı döner; temizliğin kendisi tek
 * hareket olarak kalıyor: kimin ne zaman sildiği izlensin.
 */
export const kayitlariTemizle = (ben: Kisi, secim: TemizlikSecimi): number | null => {
  if (!kayitTemizleyebilir(ben) || !secim.turler.length) return null;
  const { yeni, toplam } = temizle(getir(), secim);
  if (!toplam) return 0;
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "kayitTemizlendi", veri: { sayi: String(toplam) } }));
  return toplam;
};

/**
 * Tek öneriyi izleriyle silmek (öneri sayfasında "İzleriyle sil"): toplu
 * temizlikle aynı kural. Hareket silinen öneriye bağlanmıyor (o da iz
 * sayılıp giderdi); başlığı verisinde kalıyor.
 */
export const oneriSil = (ben: Kisi, id: string): number | null => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !kayitTemizleyebilir(ben)) return null;
  const { yeni, toplam } = temizle(d, { turler: ["oneriler"], idler: [id] });
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "oneriSilindi", veri: { baslik: o.haberBasligi, sayi: String(toplam) } }));
  return toplam;
};

/** Yapay zekanın haber değeri görüşü öneriye bağlı ayrı kayıtta; öneri başına bir tane, yenisi eskisinin yerine. */
export const yzGorusKaydet = (ben: Kisi, oneriId: string, g: Pick<YzGorus, "genel" | "ozet" | "kriterler">) => {
  const d = getir();
  if (!oneriBul(d, oneriId) || !yzGorusuGorur(ben)) return false;
  const id = `yzg-${oneriId}`;
  const yeni: YzGorus = { id, oneriId, kisiId: ben.id, zaman: simdi(), ...g };
  const eski = d.yzGorusleri ?? [];
  kaydet({ ...d, yzGorusleri: eski.some((x) => x.id === id) ? eski.map((x) => (x.id === id ? yeni : x)) : [...eski, yeni] });
  return true;
};

/**
 * Muhabire geri bildirim gönderildi (e-postayı ekran şablondan kuruyor,
 * kişi Outlook'ta ya da telefonda gönderiyor). Kayıtta zamanı ve şablonu;
 * "takip edilsin" denirse ve e-postayla takip açıksa haber muhabirin
 * işlerinde takibe giriyor ve yazışmaya deneme süreci mesajı düşüyor.
 * Takip karardan bağımsız seçenek: onaylanan öneride önerilir, ötekinde
 * istenirse.
 */
export const geriBildirimKaydet = (ben: Kisi, oneriId: string, g: { sablonId?: string; takip: boolean }) => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !geriBildirimGonderebilir(ben, o)) return false;
  const ayar = geriBildirimAyari(d);
  const takipEt = g.takip && ayar.epostaIleTakip && o.takip !== "tamamlandi";
  const z = simdi();
  d = {
    ...d,
    oneriler: d.oneriler.map((x) =>
      x.id === o.id ? { ...x, geriDonus: true, geriBildirim: { zaman: z, kisiId: ben.id, ...(g.sablonId ? { sablonId: g.sablonId } : {}) }, ...(takipEt ? { takip: "acik" as const } : {}) } : x,
    ),
  };
  if (takipEt && o.takip !== "acik" && ayar.takipMesaji.trim()) {
    d = { ...d, mesajlar: [...d.mesajlar, { id: kimlik("ms"), oneriId: o.id, kisiId: ben.id, metin: ayar.takipMesaji.trim(), zaman: z }] };
  }
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "geriDonus", oneriId: o.id, planId: o.planId, veri: { sonuc: o.durum, kime: o.muhabirId ?? "" } }));
  return true;
};

/** Takipteki haber bitti: muhabir kendisi ya da Planlama işaretliyor; karşı taraf bildirim alıyor. */
export const takipTamamla = (ben: Kisi, oneriId: string) => {
  const d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !takipTamamlayabilir(ben, o)) return false;
  const muhabir = ben.id === o.muhabirId;
  const z = simdi();
  let yeni: Durum = { ...d, oneriler: d.oneriler.map((x) => (x.id === o.id ? { ...x, takip: "tamamlandi", takipBitis: z, takipBitiren: ben.id } : x)) };
  // Haberin paketi de aynı iş: Newsdesk yokken onaylı paket de kapanıyor, iki ayrı "tamamlandı" kalmıyor.
  const p = d.paketler.find((x) => x.oneriId === o.id && x.durum === "onaylandi");
  if (p && !d.newsdeskDevrede)
    yeni = paketGuncelle(yeni, p.id, (x) => ({ ...x, durum: "tamamlandi", adim: undefined, guncelleme: z, ...(muhabir && !x.muhabirTeslimi ? { muhabirTeslimi: z } : {}) }));
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "takipTamamlandi", oneriId: o.id, planId: o.planId, ...(p && { paketId: p.id }), veri: muhabir ? { sahip: "planlama" } : { kime: o.muhabirId ?? "" } }));
  return true;
};

/*
 * "Tamamlandı" geri alınıyor (yanlışlıkla basılmış): önerinin takibi yeniden
 * açık, onunla kapanan onaylı paket yeniden onaylı; paketten başlanırsa
 * önerisi de. İkisi birlikte kapandığı için birlikte açılıyor, yoksa haber
 * yarım açık kalırdı. Muhabirin teslim zamanı yalnız bu kapanışta yazıldıysa
 * siliniyor (ölçüme yanlış teslim girmesin).
 */
export const tamamlamaGeriAl = (ben: Kisi, hedef: { oneriId?: string; paketId?: string }) => {
  const d = getir();
  const p0 = paketBul(d, hedef.paketId);
  const o = oneriBul(d, hedef.oneriId ?? p0?.oneriId);
  const p = p0 ?? (o ? d.paketler.find((x) => x.oneriId === o.id && x.durum === "tamamlandi" && !x.ozelId) : undefined);
  if (!tamamlamaGeriAlabilir(ben, d, o, p)) return false;
  const z = simdi();
  let yeni: Durum = d;
  if (o?.takip === "tamamlandi")
    yeni = {
      ...yeni,
      oneriler: yeni.oneriler.map((x) => {
        if (x.id !== o.id) return x;
        const { takipBitis: _b, takipBitiren: _k, ...kalan } = x;
        return { ...kalan, takip: "acik" };
      }),
    };
  if (p && p.durum === "tamamlandi" && !p.ozelId && yalnizPlanlama(d))
    yeni = paketGuncelle(yeni, p.id, (x) => {
      const { muhabirTeslimi, ...kalan } = x;
      return { ...kalan, durum: "onaylandi", guncelleme: z, ...(muhabirTeslimi && muhabirTeslimi !== x.guncelleme ? { muhabirTeslimi } : {}) };
    });
  const muhabirId = o?.muhabirId ?? p?.muhabirId;
  kaydet(
    hareketYaz(yeni, {
      kisiId: ben.id,
      tip: "tamamlamaGeriAlindi",
      ...(o && { oneriId: o.id }),
      ...(p && { paketId: p.id }),
      ...((p?.planId ?? o?.planId) && { planId: p?.planId ?? o?.planId }),
      veri: ben.id === muhabirId ? { sahip: "planlama" } : { kime: muhabirId ?? "" },
    }),
  );
  return true;
};

/* Şablonlar ve ayar: yalnız tam yönetici ve Planlama yöneticisi. Kayıtta şablon yoksa varsayılanlardan başlanıyor. */
export const geriBildirimSablonuKaydet = (ben: Kisi, s: GeriBildirimSablonu) => {
  if (!geriBildirimSablonuDuzenler(ben) || !s.ad.trim() || !s.konu.trim() || !s.govde.trim()) return false;
  const d = getir();
  const l = sablonlar(d);
  const yeni = l.some((x) => x.id === s.id) ? l.map((x) => (x.id === s.id ? s : x)) : [...l, s];
  kaydet({ ...d, geriBildirimSablonlari: yeni });
  return true;
};

export const geriBildirimSablonuSil = (ben: Kisi, id: string) => {
  if (!geriBildirimSablonuDuzenler(ben)) return false;
  const d = getir();
  kaydet({ ...d, geriBildirimSablonlari: sablonlar(d).filter((x) => x.id !== id) });
  return true;
};

export const geriBildirimAyariKaydet = (ben: Kisi, ayar: GeriBildirimAyari) => {
  if (!geriBildirimSablonuDuzenler(ben)) return false;
  const d = getir();
  kaydet({ ...d, geriBildirimAyari: ayar });
  return true;
};

/* --- Haftalık plan --- */

const haftaGuncelle = (d: Durum, id: string, f: (h: HaftalikPlan) => HaftalikPlan): Durum => ({
  ...d,
  haftalik: d.haftalik.map((h) => (h.id === id ? f(h) : h)),
});

const kalemGuncelle = (d: Durum, haftaId: string, kalemId: string, f: (k: HaftalikKalem) => HaftalikKalem): Durum =>
  haftaGuncelle(d, haftaId, (h) => ({ ...h, kalemler: h.kalemler.map((k) => (k.id === kalemId ? f(k) : k)) }));

/** Verilen günü içeren haftanın planı; aynı hafta için ikinci plan açılmıyor. */
export const haftalikOlustur = (ben: Kisi, gun: string): { id: string; vardi: boolean } | null => {
  if (!yapabilir(ben, "haftalikDuzenle")) return null;
  const baslangic = haftaBasi(gun);
  let d = getir();
  const var_ = d.haftalik.find((h) => h.baslangic === baslangic);
  if (var_) return { id: var_.id, vardi: true };
  const id = kimlik("hf");
  const plan: HaftalikPlan = { id, baslangic, durum: "hazirlik", anaKonular: [], kalemler: [], olusturan: ben.id, olusturma: simdi() };
  d = { ...d, haftalik: [plan, ...d.haftalik] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "haftalikOlusturuldu", haftaId: id, veri: { tarih: baslangic } }));
  return { id, vardi: false };
};

/** Hazırlık ile toplantı arasında gidip gelebiliyor; kesinleştirme ayrı eylem. */
export const haftalikDurum = (ben: Kisi, id: string, yeni: "hazirlik" | "toplantida") => {
  let d = getir();
  const h = haftaBul(d, id);
  if (!h || h.durum === "kesinlesti" || !planAdimiYapabilir(ben, "hfToplanti") || h.durum === yeni) return false;
  d = haftaGuncelle(d, id, (x) => ({ ...x, durum: yeni }));
  const tip = yeni === "toplantida" ? "haftalikToplantida" : "haftalikHazirliga";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, haftaId: id, veri: { tarih: h.baslangic, sahip: yeni === "toplantida" ? "yonetim" : "" } }));
  return true;
};

/*
 * Belge görünümünde sıra belgedeki sıra: satır yalnız kendi grubundaki
 * komşusuyla yer değiştiriyor (aynı başlık, aynı gün ve dosya…), dizideki
 * öbür kayıtlar yerinde kalıyor. Uçtaysa null.
 */
const komsuylaDegis = <T>(dizi: T[], secili: (x: T) => boolean, grup: (x: T) => boolean, yon: -1 | 1): T[] | null => {
  const i = dizi.findIndex(secili);
  if (i < 0) return null;
  let j = i + yon;
  while (j >= 0 && j < dizi.length && !grup(dizi[j])) j += yon;
  if (j < 0 || j >= dizi.length) return null;
  const yeni = [...dizi];
  [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
  return yeni;
};

/* "Altına ekle": yeni kayıt belgede basılan satırın hemen arkasına giriyor; satır yoksa yeri değişmiyor. */
const arkasina = <T>(dizi: T[], kimi: (x: T) => string, id: string, sonra?: string): T[] => {
  const x = dizi.find((y) => kimi(y) === id);
  if (!x || !sonra || sonra === id) return dizi;
  const kalan = dizi.filter((y) => kimi(y) !== id);
  const i = kalan.findIndex((y) => kimi(y) === sonra);
  return i < 0 ? dizi : [...kalan.slice(0, i + 1), x, ...kalan.slice(i + 1)];
};
const kimlikOf = (x: { id: string }) => x.id;

/* İçerik düzenlemeleri aynı kalıpta: yetki ve kilit tek yerde. */
const haftaIcerik = (ben: Kisi, id: string, f: (h: HaftalikPlan) => HaftalikPlan | null) => {
  const d = getir();
  const h = haftaBul(d, id);
  if (!h || !haftalikDuzenler(ben, h)) return false;
  const yeni = f(h);
  if (!yeni) return false;
  kaydet(haftaGuncelle(d, id, () => yeni));
  return true;
};

export interface AnaKonuGirdisi {
  id?: string;
  /** Havuzdaki başlık. */
  baslikId?: string;
  /** Havuzda yoksa açılan yeni başlık (kalemdeki gibi havuza giriyor). */
  yeniBaslik?: string;
  metin: string;
}

/*
 * Ana dosyanın başlığı havuzdan seçiliyor ya da yeni açılıyor; ikisi de
 * yoksa (belgede yalnız durum özeti düzeltildi) eski başlık yerinde kalıyor.
 */
export const anaKonuKaydet = (ben: Kisi, haftaId: string, g: AnaKonuGirdisi, sonra?: string) => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  if (!h || !haftalikDuzenler(ben, h)) return false;
  const eski = g.id ? h.anaKonular.find((a) => a.id === g.id) : undefined;
  if (g.id && !eski) return false;
  let baslikId = g.baslikId || undefined;
  if (!baslikId && g.yeniBaslik?.trim()) {
    if (!yapabilir(ben, "baslikYonet")) return false;
    // Aynı adla havuzda varsa o (dosyaAc): havuz ikiye bölünmesin.
    [baslikId, d] = dosyaAc(d, g.yeniBaslik);
  }
  const havuz = baslikId ? baslikBul(d, baslikId) : undefined;
  if (baslikId && !havuz) return false;
  const baslik = havuz ? { baslik: havuz.ad, baslikId: havuz.id } : eski ? { baslik: eski.baslik, ...(eski.baslikId && { baslikId: eski.baslikId }) } : undefined;
  if (!baslik) return false;
  const alanlar = { ...baslik, metin: g.metin.trim() };
  if (eski && eski.baslik === alanlar.baslik && eski.baslikId === alanlar.baslikId && eski.metin === alanlar.metin) return true;
  d = haftayaDosya(d, haftaId, baslikId);
  kaydet(
    haftaGuncelle(d, haftaId, (x) => {
      if (eski) return { ...x, anaKonular: x.anaKonular.map((a) => (a.id === eski.id ? { id: a.id, ...alanlar } : a)) };
      const id = kimlik("ak");
      return { ...x, anaKonular: arkasina([...x.anaKonular, { id, ...alanlar }], kimlikOf, id, sonra) };
    }),
  );
  return true;
};

export const anaKonuSil = (ben: Kisi, haftaId: string, id: string) =>
  haftaIcerik(ben, haftaId, (h) => ({ ...h, anaKonular: h.anaKonular.filter((a) => a.id !== id) }));

export const anaKonuTasi = (ben: Kisi, haftaId: string, id: string, yon: -1 | 1) =>
  haftaIcerik(ben, haftaId, (h) => {
    const i = h.anaKonular.findIndex((a) => a.id === id);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= h.anaKonular.length) return null;
    const yeni = [...h.anaKonular];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    return { ...h, anaKonular: yeni };
  });

export interface KalemGirdisi {
  id?: string;
  tarih?: string;
  baslikId?: string;
  /** Dosya havuzda yoksa açılıyor. */
  yeniBaslik?: string;
  baslik?: string;
  yer?: string;
  metin: string;
  tur: IcerikTuru;
  bicimler: Bicim[];
  paketBasligi?: string;
  muhabirler: string[];
  muhabirTbc?: boolean;
  kararNotu?: string;
  ekTalep?: string;
  not?: string;
}

/*
 * Yeni dosya havuza giriyor: Next Day'de de aynı başlık kullanılacak. Haftanın
 * dosya listesi her hafta boş başladığı için eski başlık yeniden yazılıyor;
 * aynı adlı başlık havuzda varsa o (pasifse yeniden etkin), havuz ikiye bölünmesin.
 */
const dosyaAc = (d: Durum, ad?: string, ulke?: Ulke): [string | undefined, Durum] => {
  const temiz = ad?.trim();
  if (!temiz) return [undefined, d];
  const var_ = adiylaBaslik(d, temiz);
  if (var_) return [var_.id, var_.aktif ? d : { ...d, basliklar: d.basliklar.map((b) => (b.id === var_.id ? { ...b, aktif: true } : b)) }];
  const id = kimlik("b");
  return [id, { ...d, basliklar: [...d.basliklar, { id, ad: temiz, ...(ulke && { ulke }), aktif: true }] }];
};

/** Dosya bu haftanın listesine giriyor; kalemi silinse de o hafta seçilebilir kalıyor. */
const haftayaDosya = (d: Durum, haftaId: string, baslikId?: string): Durum => {
  const h = baslikId ? haftaBul(d, haftaId) : undefined;
  if (!h || !baslikId || h.dosyalar?.includes(baslikId)) return d;
  return haftaGuncelle(d, haftaId, (x) => ({ ...x, dosyalar: [...(x.dosyalar ?? []), baslikId] }));
};

/** Kalemi ekler ya da düzeltir; karar, ön inceleme ve öneri bağı düzeltmede korunuyor. */
export const kalemKaydet = (ben: Kisi, haftaId: string, g: KalemGirdisi, sonra?: string): string | null => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  if (!h || !haftalikDuzenler(ben, h) || !g.metin.trim()) return null;
  if (g.tarih && (g.tarih < h.baslangic || g.tarih > haftaSonu(h.baslangic))) return null;
  let baslikId = g.baslikId || undefined;
  if (!baslikId && g.yeniBaslik?.trim()) {
    if (!yapabilir(ben, "baslikYonet")) return null;
    [baslikId, d] = dosyaAc(d, g.yeniBaslik);
  }
  d = haftayaDosya(d, haftaId, baslikId);
  const alanlar = {
    tarih: g.tarih || undefined,
    baslikId,
    baslik: g.baslik?.trim() || undefined,
    yer: g.yer?.trim() || undefined,
    metin: g.metin.trim(),
    tur: g.tur,
    bicimler: g.bicimler,
    paketBasligi: g.bicimler.some((b) => b !== "canli") ? g.paketBasligi?.trim() || undefined : undefined,
    muhabirler: g.muhabirler,
    // TBC yalnız muhabir seçilmemişken: atanınca belirsizlik kalmadı.
    muhabirTbc: g.muhabirTbc && !g.muhabirler.length ? (true as const) : undefined,
    kararNotu: g.kararNotu?.trim() || undefined,
    ekTalep: g.ekTalep?.trim() || undefined,
    not: g.not?.trim() || undefined,
  };
  // Kalemin notları (sarı not, karar notu, ek talep) tek metin gibi: anılan yeni kişiye bildirim.
  const notlar = (k: { not?: string; kararNotu?: string; ekTalep?: string }) => [k.not, k.kararNotu, k.ekTalep].filter(Boolean).join("\n");
  const anma = (yd: Durum, eski = "") => bahset(yd, ben, notlar(alanlar), { yol: `#/haftalik/${haftaId}`, baslik: alanlar.baslik || satir(alanlar.yer, alanlar.metin) }, eski);
  if (g.id) {
    const id = g.id;
    const eski = h.kalemler.find((k) => k.id === id);
    if (!eski) return null;
    kaydet(anma(kalemGuncelle(d, haftaId, id, (k) => ({ ...k, ...alanlar })), notlar(eski)));
    return id;
  }
  const id = kimlik("hk");
  kaydet(anma(haftaGuncelle(d, haftaId, (x) => ({ ...x, kalemler: arkasina([...x.kalemler, { id, ...alanlar, karar: "bekliyor" as const }], kimlikOf, id, sonra) }))));
  return id;
};

/** Kalem aynı gün ve aynı dosyanın içinde yer değiştiriyor; başka güne gitmesi formdan (tarih). */
export const kalemTasi = (ben: Kisi, haftaId: string, kalemId: string, yon: -1 | 1) =>
  haftaIcerik(ben, haftaId, (h) => {
    const k = h.kalemler.find((x) => x.id === kalemId);
    if (!k) return null;
    const yeni = komsuylaDegis(h.kalemler, (x) => x.id === kalemId, (x) => x.tarih === k.tarih && x.baslikId === k.baslikId && gundemde(x) && x.karar !== "ret", yon);
    return yeni ? { ...h, kalemler: yeni } : null;
  });

/** Kalem silinince öneri yeniden değerlendirmeye dönüyor; önerinin kendisi kalıyor. */
export const kalemSil = (ben: Kisi, haftaId: string, kalemId: string) => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  const k = h?.kalemler.find((x) => x.id === kalemId);
  if (!h || !k || !haftalikDuzenler(ben, h)) return false;
  d = haftaGuncelle(d, haftaId, (x) => ({ ...x, kalemler: x.kalemler.filter((y) => y.id !== kalemId) }));
  if (k.oneriId) d = { ...d, oneriler: d.oneriler.map((o) => (o.id === k.oneriId ? { ...o, durum: "degerlendiriliyor" } : o)) };
  kaydet(d);
  return true;
};

/** Haftalık öneriyi gündeme alır: bir güne ya da zamana bağlı olmayan dosyaya, bir dosyanın altına. */
export const oneriGundemeEkle = (
  ben: Kisi,
  haftaId: string,
  oneriId: string,
  g: { tarih?: string; baslikId?: string; yeniBaslik?: string },
): string | null => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  const o = oneriBul(d, oneriId);
  // Haftalık öneri ya da günü (aralığı) bu haftaya düşen öneri.
  if (!h || !o || !oneriHaftada(o, h) || !haftalikDuzenler(ben, h) || !yapabilir(ben, "oneriDegerlendir")) return null;
  if (d.haftalik.some((x) => x.kalemler.some((k) => k.oneriId === o.id)) || o.durum === "reddedildi" || o.durum === "planaEklendi") return null;
  if (g.tarih && (g.tarih < h.baslangic || g.tarih > haftaSonu(h.baslangic))) return null;
  let baslikId = g.baslikId || undefined;
  if (!baslikId && g.yeniBaslik?.trim()) [baslikId, d] = dosyaAc(d, g.yeniBaslik);
  d = haftayaDosya(d, haftaId, baslikId);
  const id = kimlik("hk");
  /*
   * Kurumun düzeni: dosyanın altında "YER / gelişme" (yer muhabirin şehri,
   * metin önerinin açıklaması, planMetni), paket önerisiyse altında "PKG"
   * ve "YER / strap / muhabir".
   */
  const muhabir = kisiBul(d, o.muhabirId);
  const kalem: HaftalikKalem = {
    id,
    tarih: g.tarih || undefined,
    baslikId,
    ...(muhabir && { yer: sehirAr(muhabir.sehir) }),
    metin: planMetni(o),
    tur: o.tur,
    bicimler: paketBicimi(o.bicim) ? [paketBicimi(o.bicim)!] : [],
    ...(o.paketBasligi && paketBicimi(o.bicim) && { paketBasligi: o.paketBasligi }),
    muhabirler: o.muhabirId ? [o.muhabirId] : [],
    oneriId: o.id,
    karar: "bekliyor",
  };
  d = haftaGuncelle(d, haftaId, (x) => ({ ...x, kalemler: [...x.kalemler, kalem] }));
  d = { ...d, oneriler: d.oneriler.map((x) => (x.id === o.id ? { ...x, durum: "degerlendiriliyor", baslikId: baslikId ?? x.baslikId } : x)) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriDegerlendirmede", oneriId: o.id, haftaId }));
  return id;
};

/* --- Ön inceleme --- */

/** Stok önerileri toplantıdan önce kolun yöneticisine: müdürlere kişi olarak, Ekonomi'ye birim olarak bildirim. */
export const onIncelemeyeGonder = (ben: Kisi, haftaId: string, kalemIdleri: string[]): number => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  if (!h || !haftalikDuzenler(ben, h)) return 0;
  const secilen = h.kalemler.filter((k) => kalemIdleri.includes(k.id) && onIncelemeyeGidebilir(k));
  if (!secilen.length) return 0;
  const zaman = simdi();
  const ids = new Set(secilen.map((k) => k.id));
  d = haftaGuncelle(d, haftaId, (x) => ({
    ...x,
    kalemler: x.kalemler.map((k) => (ids.has(k.id) ? { ...k, onInceleme: { durum: "gonderildi", gonderen: ben.id, zaman, gorusler: [] } } : k)),
  }));
  for (const k of secilen) {
    const kime = d.kisiler.filter((x) => x.birim === "yonetim" && onIncelemeci(x, k)).map((x) => x.id);
    const birim = d.kisiler.find((x) => x.birim !== "yonetim" && onIncelemeci(x, k))?.birim;
    d = hareketYaz(d, { kisiId: ben.id, tip: "onIncelemeyeGonderildi", haftaId, veri: { kalem: k.id, kime: kime.join(","), sahip: birim ?? "" } });
  }
  kaydet(d);
  return secilen.length;
};

const incelenen = (ben: Kisi, haftaId: string, kalemId: string) => {
  const d = getir();
  const h = haftaBul(d, haftaId);
  const k = h?.kalemler.find((x) => x.id === kalemId);
  if (!h || !k || h.durum === "kesinlesti" || k.onInceleme?.durum !== "gonderildi" || !onIncelemeci(ben, k)) return null;
  return { d, h, k };
};

export const onIncelemeGorusu = (ben: Kisi, haftaId: string, kalemId: string, metin: string) => {
  const x = incelenen(ben, haftaId, kalemId);
  if (!x || !metin.trim()) return false;
  let d = kalemGuncelle(x.d, haftaId, kalemId, (k) => ({
    ...k,
    onInceleme: k.onInceleme && { ...k.onInceleme, gorusler: [...k.onInceleme.gorusler, { kisiId: ben.id, zaman: simdi(), metin: metin.trim() }] },
  }));
  d = hareketYaz(d, { kisiId: ben.id, tip: "onIncelemeGorusu", haftaId, veri: { kalem: kalemId, sahip: "planlama" } });
  kaydet(d);
  return true;
};

/** Toplantı olmadan ret: gerekçe zorunlu; kalem gündemden düşüyor, öneri kesinleşince reddedilmiş sayılıyor. */
export const onIncelemeReddet = (ben: Kisi, haftaId: string, kalemId: string, gerekce: string) => {
  const x = incelenen(ben, haftaId, kalemId);
  if (!x || !gerekce.trim()) return false;
  let d = kalemGuncelle(x.d, haftaId, kalemId, (k) => ({
    ...k,
    karar: "ret",
    onInceleme: k.onInceleme && { ...k.onInceleme, durum: "reddedildi", reddeden: ben.id, gerekce: gerekce.trim() },
  }));
  d = hareketYaz(d, { kisiId: ben.id, tip: "onIncelemedeReddedildi", haftaId, veri: { kalem: kalemId, gerekce: gerekce.trim(), sahip: "planlama" } });
  kaydet(d);
  return true;
};

/* --- Toplantı kararı ve kesinleştirme --- */

export const kalemKarar = (ben: Kisi, haftaId: string, kalemId: string, karar: Karar) => {
  const d = getir();
  const h = haftaBul(d, haftaId);
  const k = h?.kalemler.find((x) => x.id === kalemId);
  if (!h || !k || !gundemde(k) || !kararVerebilir(ben, h)) return false;
  kaydet(kalemGuncelle(d, haftaId, kalemId, (x) => ({ ...x, karar })));
  return true;
};

/*
 * Toplantıda kararla birlikte söylenen not ve ek talep; karardan ayrı
 * kaydediliyor ki karar düğmesine basmak notu silmesin. Boş metin siler.
 */
export const kalemKararNotu = (ben: Kisi, haftaId: string, kalemId: string, g: { kararNotu: string; ekTalep: string }) => {
  const d = getir();
  const h = haftaBul(d, haftaId);
  const k = h?.kalemler.find((x) => x.id === kalemId);
  if (!h || !k || !kararNotuYazabilir(ben, h)) return false;
  const yd = kalemGuncelle(d, haftaId, kalemId, (x) => ({ ...x, kararNotu: g.kararNotu.trim() || undefined, ekTalep: g.ekTalep.trim() || undefined }));
  kaydet(bahset(yd, ben, `${g.kararNotu}\n${g.ekTalep}`, { yol: `#/haftalik/${haftaId}`, baslik: kalemAdi(k) }, `${k.kararNotu ?? ""}\n${k.ekTalep ?? ""}`));
  return true;
};

/** Toplantının sonunda kalan kalemlerin hepsine kabul. */
export const kalanlariKabulEt = (ben: Kisi, haftaId: string): number => {
  const d = getir();
  const h = haftaBul(d, haftaId);
  if (!h || !kararVerebilir(ben, h)) return 0;
  const kalan = new Set(kararBekleyenler(h).map((k) => k.id));
  if (!kalan.size) return 0;
  kaydet(haftaGuncelle(d, haftaId, (x) => ({ ...x, kalemler: x.kalemler.map((k) => (kalan.has(k.id) ? { ...k, karar: "kabul" } : k)) })));
  return kalan.size;
};

/*
 * Haftalıktan Next Day'e aktarım tek yerde: hem kesinleştirmede (o günün
 * planı açıksa) hem plan sonradan açılınca. Dosya o planın başlığı oluyor,
 * muhabirleri başlığın altına, metni gelişme olarak düşüyor; muhabiri ve
 * paket biçimi olan kalemde onaylı paket doğuyor. Yalnız canlı bağlantıysa
 * paket yok, muhabir başlığın altında. Dosyası olmayan kalem takiplere.
 */
/* Toplantının karar notu ve ek talebi pakete geçiyor: muhabir işi neyle yapacağını paketinde görüyor. */
/*
 * Pakete giden başlık strap: kalemde yoksa önerisininki, o da yoksa dosyanın
 * (başlık havuzundaki) adı, sonra olayın adı. Kalemin metni açıklama; o
 * başlığa yazılınca Next Day'de gelişmenin aynısı PKG satırında da
 * görünüyordu. Metin yalnız başka hiçbir şey yoksa.
 */
const kalemStrapi = (d: Durum, k: HaftalikKalem) =>
  k.paketBasligi || oneriBul(d, k.oneriId)?.paketBasligi || (k.baslikId ? d.basliklar.find((b) => b.id === k.baslikId)?.ad : undefined) || k.baslik || undefined;
const kalemPaketBasligi = (d: Durum, k: HaftalikKalem) => kalemStrapi(d, k) || k.metin;

/* Kalemde elle yazılan yer muhabirin şehri değilse pakete taşınıyor (muhabir başka yerden yapıyor). */
const kalemPaketYeri = (k: HaftalikKalem, sehir: Sehir) => (k.yer?.trim() && k.yer.trim() !== sehirAr(sehir) ? { yer: k.yer.trim() } : {});

const toplantidan = (k: HaftalikKalem) => ({ ...(k.kararNotu ? { kararNotu: k.kararNotu } : {}), ...(k.ekTalep ? { ekTalep: k.ekTalep } : {}) });

const planAktarimaAcik = (p: NextDayPlan) => p.durum === "taslak" || p.durum === "toplantida" || p.durum === "onayli";

/*
 * Sistemin açılış işi: kesinleşmiş haftanın kabul edilen, günü olan haberi
 * o günün açık planına henüz geçmemişse geçiriyor. Aktarım iki anda
 * yapılıyordu (kesinleşme, planın açılışı); ikisini de kaçıran (plan o an
 * devredilemeyecek durumdaydı, plan başka yoldan açıldı) haber hiç gelmiyordu.
 */
export const haftalikAktarimlariniTamamla = (): boolean => {
  let d = getir();
  const once = d;
  for (const h of d.haftalik.filter((x) => x.durum === "kesinlesti")) {
    for (const k of h.kalemler.filter((x) => nextDayeGider(x) && !x.aktarim?.planId)) {
      const plan = d.planlar.find((p) => p.tarih === k.tarih);
      if (plan && planAktarimaAcik(plan)) d = haftaliktanAktar(d, SISTEM, h.id, k, plan);
    }
  }
  if (d === once) return false;
  kaydet(d);
  return true;
};

const haftaliktanAktar = (d: Durum, kisiId: string, haftaId: string, k: HaftalikKalem, plan: NextDayPlan): Durum => {
  let pbId: string | undefined;
  /*
   * Dosyasız kalem (gündeme dosya seçilmeden eklenen öneri) önerinin
   * başlığına, yoksa Header'ıyla açılan başlığa giriyor: başlıksız gidince
   * gelişme ve PKG "متابعات"e düşüyordu, haberin dosyası görünmüyordu.
   */
  const kaynakOneri = oneriBul(d, k.oneriId);
  let baslikId = k.baslikId ?? kaynakOneri?.baslikId;
  if (!baslikId && kaynakOneri?.haberBasligi.trim()) [baslikId, d] = dosyaAc(d, kaynakOneri.haberBasligi, kaynakOneri.ulke);
  if (baslikId) {
    const var_ = plan.basliklar.find((b) => b.baslikId === baslikId);
    // Kimlikler plandan ve kalemden: aktarım iki tarayıcıda aynı anda olursa aynı kayıtlar yazılsın.
    const pb = var_ ?? { id: turet(plan.id, baslikId), baslikId, muhabirler: [] };
    pbId = pb.id;
    const muhabirler = [...pb.muhabirler, ...k.muhabirler.filter((m) => !pb.muhabirler.some((x) => x.kisiId === m)).map((kisiId) => ({ kisiId }))];
    // Kalemin TBC'si muhabirsiz başlığa geçiyor; başlıkta muhabir varsa belirsizlik yok.
    const yeniPb = { ...pb, muhabirler, ...(k.muhabirTbc && !muhabirler.length ? { muhabirTbc: true as const } : {}) };
    d = planGuncelle(d, plan.id, (p) => ({ ...p, basliklar: var_ ? p.basliklar.map((b) => (b.id === pb.id ? yeniPb : b)) : [...p.basliklar, yeniPb] }));
  }
  const muhabirId = k.muhabirler[0];
  // Kalem bir öneriden geldiyse gelişmenin kaynağı o önerinin kaynağı (muhabir, ajans, resmî duyuru…).
  const oneri = oneriBul(d, k.oneriId);
  const gelisme: Gelisme = {
    id: turet(plan.id, k.id),
    planId: plan.id,
    planBaslikId: pbId,
    yer: k.yer,
    metin: k.baslik ? `${k.baslik} / ${k.metin}` : k.metin,
    kaynakTuru: oneri ? (oneri.kaynakTuru ?? (oneri.muhabirId ? "muhabir" : "diger")) : "diger",
    kaynakAdi: oneri?.kaynakAdi ?? "",
    tarih: simdi(),
    onerenId: oneri?.muhabirId,
    oneriId: k.oneriId,
    haftalikKalemId: k.id,
  };
  d = { ...d, gelismeler: [...d.gelismeler, gelisme] };
  // "LIVE" işaretli kalem Next Day'de başlığın canlı yayını; yalnız biçimdeydi, çıktının "مباشر" bölümüne girmiyordu.
  if (k.bicimler.includes("canli")) {
    const canli: CanliYayin = {
      id: `cy-${turet(plan.id, k.id)}`,
      planId: plan.id,
      planBaslikId: pbId,
      konu: k.baslik?.trim() || k.paketBasligi?.trim() || baslikBul(d, k.baslikId)?.ad || k.metin,
      aciklama: "",
      tarih: plan.tarih,
      saatGmt: "",
      yer: k.yer?.trim() || sehirAr(kisiBul(d, muhabirId)?.sehir),
      muhabirId,
      notlar: "",
      oneriId: k.oneriId,
      haftalikKalemId: k.id,
    };
    if (!d.canliYayinlar.some((c) => c.id === canli.id)) d = { ...d, canliYayinlar: [...d.canliYayinlar, canli] };
  }

  let paketId: string | undefined;
  const bicim = k.bicimler.length ? k.bicimler.find((b) => b !== "canli") : "pkg";
  // Muhabiri TBC olan kalemin paketi de girer: "YER / strap / TBC", muhabir sonra atanır.
  if ((muhabirId || k.muhabirTbc) && bicim) {
    let kod: string;
    [kod, d] = yeniKod(d);
    paketId = `p-${turet(plan.id, k.id)}`;
    const paket: Paket = {
      id: paketId,
      kod,
      planId: plan.id,
      planBaslikId: pbId,
      baslik: kalemPaketBasligi(d, k),
      sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
      ...kalemPaketYeri(k, kisiBul(d, muhabirId)?.sehir ?? "istanbul"),
      muhabirId,
      ...(!muhabirId && k.muhabirTbc ? { muhabirTbc: true as const } : {}),
      ...toplantidan(k),
      aciklama: k.metin,
      tur: k.tur,
      bicim,
      durum: "onaylandi",
      sahaGerekli: false,
      oneriId: k.oneriId,
      haftalikKalemId: k.id,
      notlar: [],
      olusturma: simdi(),
      guncelleme: simdi(),
    };
    d = { ...d, paketler: [paket, ...d.paketler] };
  }
  // Paket ancak günlük plan açılınca da doğabiliyor (kesinleşmeden sonra); muhabir o an haberdar oluyor. Kimlik plandan: iki tarayıcı tek bildirim.
  if (paketId && muhabirId) d = hareketYaz(d, { kisiId, tip: "paketOnaylandi", paketId, haftaId, planId: plan.id, veri: { kime: muhabirId } }, `po-${turet(plan.id, k.id)}`);
  d = kalemGuncelle(d, haftaId, k.id, (x) => ({ ...x, aktarim: { planId: plan.id, paketId } }));
  if (k.oneriId) d = { ...d, oneriler: d.oneriler.map((o) => (o.id === k.oneriId ? { ...o, planId: plan.id, planTarihi: plan.tarih, paketId: paketId ?? o.paketId } : o)) };
  return hareketYaz(d, { kisiId, tip: "haftaliktanAktarildi", haftaId, planId: plan.id, paketId, veri: { tarih: plan.tarih, kalem: k.id } }, `h-${turet(plan.id, k.id)}`);
};

/* Next Day'e gitmeyen kabul: plansız, onaylı paket; kolun sahibi (stok ekibi, Program) üretime alıyor. */
const haftaliktanPaket = (d: Durum, ben: Kisi, haftaId: string, k: HaftalikKalem): Durum => {
  const muhabirId = k.muhabirler[0];
  let kod: string;
  [kod, d] = yeniKod(d);
  const paketId = kimlik("p");
  const paket: Paket = {
    id: paketId,
    kod,
    baslik: kalemPaketBasligi(d, k),
    sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
    ...kalemPaketYeri(k, kisiBul(d, muhabirId)?.sehir ?? "istanbul"),
    muhabirId,
    ...(!muhabirId && k.muhabirTbc ? { muhabirTbc: true as const } : {}),
    ...toplantidan(k),
    aciklama: k.metin,
    tur: k.tur,
    bicim: k.bicimler[0],
    durum: "onaylandi",
    sahaGerekli: false,
    // Program kendi birimine gidiyor; gerisi bitince stokta bekleyen paket.
    stok: k.tur !== "program" || undefined,
    oneriId: k.oneriId,
    haftalikKalemId: k.id,
    notlar: [],
    olusturma: simdi(),
    guncelleme: simdi(),
  };
  d = { ...d, paketler: [paket, ...d.paketler] };
  d = kalemGuncelle(d, haftaId, k.id, (x) => ({ ...x, aktarim: { paketId } }));
  if (k.oneriId) d = { ...d, oneriler: d.oneriler.map((o) => (o.id === k.oneriId ? { ...o, paketId } : o)) };
  // Muhabire de: onaylanan haber sayfasına ve zile düşüyor.
  return hareketYaz(d, { kisiId: ben.id, tip: "paketOnaylandi", paketId, haftaId, veri: { hafta: "1", sahip: kolSahibi(k.tur), ...(muhabirId ? { kime: muhabirId } : {}) } });
};

/**
 * Perşembe toplantısının sonu: plan kilitleniyor ve kabul edilenler
 * kollara dağılıyor. Karar bekleyen kalem varken kesinleşmiyor.
 * Haftaya gelen öneriler kalemin kararını alıyor; gündeme hiç alınmamış
 * öneri reddedilmiş sayılıyor. Muhabire bildirim ayrı düğmeyle (geri dönüş).
 */
export const haftalikKesinlestir = (ben: Kisi, haftaId: string) => {
  let d = getir();
  const h = haftaBul(d, haftaId);
  if (!h || h.durum !== "toplantida" || !planAdimiYapabilir(ben, "hfKesinlestir") || kararBekleyenler(h).length) return false;
  d = haftaGuncelle(d, haftaId, (x) => ({ ...x, durum: "kesinlesti" }));
  for (const k of h.kalemler.filter((x) => gundemde(x) && x.karar === "kabul")) {
    if (k.tur === "haber" && k.tarih) {
      const plan = d.planlar.find((p) => p.tarih === k.tarih);
      // Plan henüz yoksa sistem açınca çekiyor (yarinPlaniniAc). Onaylı plana da giriyor (önce kayboluyordu); devredilmiş gün geçmişte kaldı.
      if (plan && planAktarimaAcik(plan)) d = haftaliktanAktar(d, ben.id, haftaId, k, plan);
    } else {
      d = haftaliktanPaket(d, ben, haftaId, k);
    }
  }
  const kalemi = new Map(h.kalemler.filter((k) => k.oneriId).map((k) => [k.oneriId!, k]));
  d = {
    ...d,
    oneriler: d.oneriler.map((o) => {
      const k = kalemi.get(o.id);
      // Günüyle gelen öneri gündemdeyse haftanın kararını alır; gündemde değilse açık kalır, Next Day'e gidebilir.
      if (o.hafta !== h.baslangic && !k) return o;
      // Toplantının ret notu muhabirin önerisine gerekçe olarak düşüyor.
      if (k) return k.karar === "ret" ? { ...o, durum: "reddedildi", gerekce: k.kararNotu || k.onInceleme?.gerekce || o.gerekce } : { ...o, durum: "planaEklendi" };
      // Düzeltmesi beklenen öneri de kapanıyor: hafta kesinleşti, yeniden gönderilecek gündem kalmadı.
      return o.durum === "yeni" || o.durum === "degerlendiriliyor" || o.durum === "duzeltme" ? { ...o, durum: "reddedildi" } : o;
    }),
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "haftalikKesinlesti", haftaId, veri: { tarih: h.baslangic } }));
  return true;
};

/* --- Merkezi başlık havuzu --- */

/** Havuzda aynı adlı başlık varsa onu döndürür (pasifse etkinleştirir): plan ekranında seçenek kısaldı, aynı ad yeniden yazılabiliyor. */
export const baslikEkle = (ben: Kisi, ad: string, ulke?: Ulke): string | null => {
  if (!yapabilir(ben, "baslikYonet") || !ad.trim()) return null;
  const [id, d] = dosyaAc(getir(), ad, ulke);
  if (!id) return null;
  kaydet(d);
  return id;
};

export const baslikDuzenle = (ben: Kisi, id: string, g: { ad?: string; ulke?: Ulke; aktif?: boolean }) => {
  if (!yapabilir(ben, "baslikYonet")) return false;
  const d = getir();
  kaydet({
    ...d,
    basliklar: d.basliklar.map((b) =>
      b.id === id ? { ...b, ...(g.ad?.trim() ? { ad: g.ad.trim() } : {}), ...("ulke" in g ? { ulke: g.ulke } : {}), ...("aktif" in g ? { aktif: !!g.aktif } : {}) } : b,
    ),
  });
  return true;
};

/* --- Next Day planı --- */

/**
 * Next Day her gün kesintisiz sürüyor; yarının planını kimse açmıyor,
 * sistem açıyor (uygulama açılınca ve gün dönünce, App.tsx). Plan önceki
 * planın şablonuyla geliyor; kurumda da dünün belgesi
 * kopyalanıp güncelleniyor. Taşınanlar: ekip, devam eden muhabir
 * hareketleri, başlıklar ve muhabirleri, ileri tarihli canlı yayınlar,
 * gelişmeler ve takipler. Paket önerileri (üretim kaydı) ve hazır
 * paketler (o günün stok seçimi) taşınmıyor. Taşınan her şey `onceki`
 * işaretli; kaynak plan olduğu gibi kalıyor.
 */
/*
 * Aynı güne açılmış çift planları sistem tek plana topluyor (planCiftleri.ts);
 * açılışta yarının planından önce çalışıyor. Hareketin kimliği birleşimden:
 * iki tarayıcı aynı anda birleştirirse aynı hareketi yazar.
 */
export const planCiftleriniTopla = (): number => {
  const { yeni, birlesimler } = planCiftleriniBirlestir(getir());
  if (!birlesimler.length) return 0;
  let d = yeni;
  for (const b of birlesimler)
    d = hareketYaz(d, { kisiId: SISTEM, tip: "planlarBirlestirildi", planId: b.kalan, veri: { tarih: b.tarih, sayi: String(b.gidenler.length + 1) } }, `h-${turet(b.kalan, b.gidenler.join(","))}`);
  kaydet(d);
  return birlesimler.length;
};

export const yarinPlaniniAc = (): string | null => {
  const tarih = gunEkle(bugun(), 1);
  let d = getir();
  if (d.planlar.some((p) => p.tarih === tarih)) return null;
  const id = gunPlaniKimligi(tarih);
  /*
   * Kimlik tarihten: plan bir kez açıldıysa yeniden açmak var olan planı ve
   * ona taşınmış kayıtları şablonla ezer, silinenler geri gelir. Planın kendisi
   * görünmese de izi (açılış hareketi, ona bağlı kayıt) varsa açılmıyor.
   */
  if (
    d.hareketler.some((h) => h.id === `h-${id}` || h.planId === id) ||
    d.gelismeler.some((g) => g.planId === id) ||
    d.canliYayinlar.some((c) => c.planId === id) ||
    d.paketler.some((p) => p.planId === id)
  )
    return null;
  const kaynak = oncekiPlan(d, tarih);
  const pbEsle = new Map<string, string>();
  /*
   * Yalnız önceki gün kullanılan başlık taşınıyor: o gün eklenen, ya da
   * gelişmesi, muhabiri, canlısı eklenen/düzenlenen/"bugün de geçerli"
   * denen, paketi olan. Dokunulmadan devreden başlık düşüyor; yoksa her gün
   * bir öncekinin hepsi geçiyor, eski başlıklar birikiyordu. "Devir" işareti
   * onayla silinmiyor (onay `onceki`yi siliyor), bu yüzden ayrı.
   */
  const kullanildi = (b: PlanBasligi) =>
    !!kaynak &&
    (!b.devir ||
      (b.muhabirler ?? []).some((m) => !m.devir) ||
      d.gelismeler.some((g) => g.planId === kaynak.id && g.planBaslikId === b.id && !g.devir) ||
      d.canliYayinlar.some((c) => c.planId === kaynak.id && c.planBaslikId === b.id && !c.devir) ||
      d.paketler.some((p) => p.planId === kaynak.id && p.planBaslikId === b.id && p.durum !== "iptal"));
  const basliklar = (kaynak?.basliklar ?? []).filter(kullanildi).map((b) => {
    const yeniId = turet(id, b.id);
    pbEsle.set(b.id, yeniId);
    return { id: yeniId, baslikId: b.baslikId, muhabirler: (b.muhabirler ?? []).map((m) => ({ ...m, onceki: true as const, devir: true as const })), devir: true as const };
  });
  // Bitmiş hareket taşınmıyor; plan gününde süren hareket taşınıyor.
  const hareketler = (kaynak?.gorevlendirmeler ?? []).filter((gid) => {
    const g = d.gorevlendirmeler.find((x) => x.id === gid);
    return !!g && g.bitis >= tarih;
  });
  const plan: NextDayPlan = {
    id,
    tarih,
    durum: "taslak",
    ekip: (kaynak?.ekip ?? []).map((e) => ({ ...e, onceki: true as const })),
    gorevlendirmeler: hareketler,
    oncekiHareketler: hareketler.length ? hareketler : undefined,
    hazirPaketler: [],
    basliklar,
    kopyaKaynagi: kaynak?.id,
    olusturan: SISTEM,
    olusturma: simdi(),
  };
  const canlilar: CanliYayin[] = kaynak
    ? d.canliYayinlar
        .filter((c) => c.planId === kaynak.id && c.tarih >= tarih)
        .filter((c) => !c.planBaslikId || pbEsle.has(c.planBaslikId))
        .map((c) => ({ ...c, id: turet(id, c.id), planId: id, planBaslikId: c.planBaslikId ? pbEsle.get(c.planBaslikId) : undefined, onceki: true, devir: true }))
    : [];
  /*
   * Gelişme metniyle taşınıyor; öneri ve haftalık kalem bağı kaynak kayıtta
   * kalıyor, yoksa aynı öneri iki planda "plana eklendi" görünürdü.
   */
  const gelismeler: Gelisme[] = kaynak
    ? d.gelismeler
        .filter((g) => g.planId === kaynak.id && (!g.planBaslikId || pbEsle.has(g.planBaslikId)))
        .map(({ oneriId: _o, haftalikKalemId: _h, ...g }) => ({ ...g, id: turet(id, g.id), planId: id, planBaslikId: g.planBaslikId ? pbEsle.get(g.planBaslikId) : undefined, onceki: true, devir: true }))
    : [];
  d = { ...d, planlar: [plan, ...d.planlar], canliYayinlar: [...d.canliYayinlar, ...canlilar], gelismeler: [...d.gelismeler, ...gelismeler] };
  d = hareketYaz(
    d,
    {
      kisiId: SISTEM,
      tip: kaynak ? "planKopyalandi" : "planOlusturuldu",
      planId: id,
      veri: { tarih, ...(kaynak ? { kaynak: kaynak.tarih } : {}) },
    },
    `h-${id}`,
  );
  // Haftalık toplantıda bu güne kabul edilmiş, henüz aktarılmamış haberler kendiliğinden geliyor.
  for (const h of d.haftalik.filter((x) => x.durum === "kesinlesti")) {
    for (const k of h.kalemler.filter((x) => nextDayeGider(x) && x.tarih === tarih && !x.aktarim?.planId)) {
      d = haftaliktanAktar(d, SISTEM, h.id, k, planBul(d, id)!);
    }
  }
  kaydet(d);
  return id;
};

/**
 * Planın durum çizgisi: taslak → toplantıda → onaylı → Newsdesk devraldı.
 * Onayda plandaki paket önerileri "onaylandı"ya, devirde "üretimde"ye
 * geçiyor; böylece akşam toplantısının kararı her paketin geçmişine
 * ayrı ayrı düşüyor.
 */
export const planDurum = (ben: Kisi, planId: string, yeni: PlanDurum) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan) return false;
  const gecerli =
    (yeni === "toplantida" && plan.durum === "taslak" && planAdimiYapabilir(ben, "ndToplanti")) ||
    (yeni === "taslak" && plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndToplanti")) ||
    (yeni === "onayli" && plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndOnay")) ||
    (yeni === "devralindi" && plan.durum === "onayli" && planAdimiYapabilir(ben, "ndDevral"));
  if (!gecerli) return false;

  d = planGuncelle(d, planId, (p) => ({ ...p, durum: yeni }));
  const paketler = d.paketler.filter((p) => p.planId === planId);

  if (yeni === "onayli") {
    // Toplantı planı onayladı: dünden gelen ile bugün eklenen ayrımı artık iş görmüyor.
    const sade = <T extends { onceki?: true }>(x: T): T => (x.onceki ? { ...x, onceki: undefined } : x);
    d = planGuncelle(d, planId, (p) => ({ ...p, ekip: p.ekip.map(sade), oncekiHareketler: undefined, basliklar: p.basliklar.map((b) => ({ ...b, muhabirler: b.muhabirler.map(sade) })) }));
    d = { ...d, gelismeler: d.gelismeler.map((g) => (g.planId === planId ? sade(g) : g)), canliYayinlar: d.canliYayinlar.map((c) => (c.planId === planId ? sade(c) : c)) };
    for (const p of paketler.filter((x) => x.durum === "taslak" || x.durum === "degerlendiriliyor")) {
      d = paketGuncelle(d, p.id, (x) => ({ ...x, durum: "onaylandi" }));
      d = hareketYaz(d, { kisiId: ben.id, tip: "paketOnaylandi", paketId: p.id, planId, veri: { toplanti: "1" } });
    }
    /*
     * Haftalıktan gelen paket aktarılırken zaten onaylı; muhabir onayı
     * günler önce almış olabiliyor. Günün planı onaylanınca hatırlatma:
     * haberin o günün planında, iş artık yarın.
     */
    for (const p of paketler.filter((x) => x.haftalikKalemId && x.muhabirId && x.durum === "onaylandi"))
      d = hareketYaz(d, { kisiId: ben.id, tip: "paketOnaylandi", paketId: p.id, planId, veri: { hatirlatma: "1", tarih: plan.tarih, kime: p.muhabirId! } });
  }
  if (yeni === "devralindi") {
    for (const p of paketler.filter((x) => x.durum === "onaylandi")) {
      const adim = ilkAdim(p);
      // Akışın o anki sürümü pakette kalıyor: sonradan yayınlanan düzen yarım işi bozmasın.
      const akis = akisDamgasi(p);
      d = paketGuncelle(d, p.id, (x) => ({ ...x, durum: "uretimde", adim, akis }));
      const sahip = paketSahibi({ ...p, durum: "uretimde", adim, akis });
      d = hareketYaz(d, { kisiId: ben.id, tip: "planDevralindi", paketId: p.id, planId, veri: { adim, sahip: sahip ?? "" } });
    }
    // Plana stoktan seçilen paketler bu planla yayına çıkıyor; stoktan düşüp arşive geçiyor.
    for (const id of plan.hazirPaketler) {
      const p = paketBul(d, id);
      if (!p || stokDurumu(p) !== "stokta") continue;
      d = paketGuncelle(d, id, (x) => ({ ...x, yayinlandi: { planId, tarih: plan.tarih } }));
      d = hareketYaz(d, { kisiId: ben.id, tip: "stokYayinlandi", paketId: id, planId, veri: { tarih: plan.tarih } });
    }
  }
  const tip = yeni === "toplantida" ? "planToplantida" : yeni === "onayli" ? "planOnaylandi" : yeni === "devralindi" ? "planDevralindi" : "planTaslaga";
  const sahip: Birim | "" = yeni === "toplantida" ? "yonetim" : yeni === "onayli" ? "newsdesk" : "";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, planId, veri: { tarih: plan.tarih, durum: yeni, sahip } }));
  return true;
};

/* Planın içerik bölümleri: hepsi aynı kalıpta, yetki kontrolü tek yerde. */
const planIcerik = (ben: Kisi, planId: string, f: (p: NextDayPlan, d: Durum) => NextDayPlan) => {
  const d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return false;
  kaydet(planGuncelle(d, planId, (p) => f(p, d)));
  return true;
};

const ekle = <T>(liste: T[], x: T) => (liste.includes(x) ? liste : [...liste, x]);
const cikar = <T>(liste: T[], x: T) => liste.filter((y) => y !== x);
/* Boş işaret listesi saklanmıyor; kayıt sade kalsın. */
const bosIse = <T>(liste: T[]) => (liste.length ? liste : undefined);

export const ekipEkle = (ben: Kisi, planId: string, uye: EkipUyesi) =>
  planIcerik(ben, planId, (p) => (p.ekip.some((e) => e.kisiId === uye.kisiId) ? p : { ...p, ekip: [...p.ekip, uye] }));
// Dokunulan kayıt artık bugünün kaydı: "önceki günden" işareti kalkıyor.
export const ekipGuncelle = (ben: Kisi, planId: string, kisiId: string, g: Partial<Omit<EkipUyesi, "kisiId" | "onceki">>) =>
  planIcerik(ben, planId, (p) => ({ ...p, ekip: p.ekip.map((e) => (e.kisiId === kisiId ? { ...e, ...g, onceki: undefined } : e)) }));
export const ekipCikar = (ben: Kisi, planId: string, kisiId: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, ekip: p.ekip.filter((e) => e.kisiId !== kisiId) }));
export const planGorevlendirmeCikar = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, gorevlendirmeler: cikar(p.gorevlendirmeler, id), oncekiHareketler: bosIse(cikar(p.oncekiHareketler ?? [], id)) }));
export const planGorevlendirmeEkle = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, gorevlendirmeler: ekle(p.gorevlendirmeler, id) }));
export const planGorevlendirmeTasi = (ben: Kisi, planId: string, id: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => {
    const yeni = komsuylaDegis(p.gorevlendirmeler, (x) => x === id, () => true, yon);
    return yeni ? { ...p, gorevlendirmeler: yeni } : p;
  });

/**
 * Belgede hareketin yeri ve açıklaması düzeltiliyor. Hareket ayrı kayıt
 * ama yazısı plana basılıyor; planın içerik yetkisi olan ve hareket o
 * plandaysa düzeltebiliyor. Kişi, tür ve tarih görevlendirme akışında kalıyor.
 */
export const gorevlendirmeMetni = (ben: Kisi, planId: string, id: string, g: { yer?: string; aciklama?: string }) => {
  const d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan) || !plan.gorevlendirmeler.includes(id)) return false;
  if (g.yer !== undefined && !g.yer.trim()) return false;
  const temiz = { ...(g.yer !== undefined && { yer: g.yer.trim() }), ...(g.aciklama !== undefined && { aciklama: g.aciklama.trim() }) };
  kaydet(planGuncelle({ ...d, gorevlendirmeler: d.gorevlendirmeler.map((x) => (x.id === id ? { ...x, ...temiz } : x)) }, planId, (p) => ({
    ...p,
    oncekiHareketler: bosIse(cikar(p.oncekiHareketler ?? [], id)),
  })));
  return true;
};

/** Plan ekranından yeni muhabir hareketi: ayrı kayıt olarak doğuyor, plan yalnız bağlantı tutuyor. */
export const gorevlendirmeOlustur = (ben: Kisi, planId: string, g: Omit<Gorevlendirme, "id" | "durum">) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return false;
  const id = kimlik("gr");
  d = { ...d, gorevlendirmeler: [{ ...g, id, durum: "onayli" }, ...d.gorevlendirmeler] };
  kaydet(planGuncelle(d, planId, (p) => ({ ...p, gorevlendirmeler: [...p.gorevlendirmeler, id] })));
  return true;
};

/** Plana yalnız stoktaki (bitmiş, henüz yayınlanmamış) paket seçiliyor. */
export const hazirPaketEkle = (ben: Kisi, planId: string, id: string) => {
  const p = paketBul(getir(), id);
  if (!p || stokDurumu(p) !== "stokta") return false;
  return planIcerik(ben, planId, (x) => ({ ...x, hazirPaketler: ekle(x.hazirPaketler, id) }));
};
export const hazirPaketCikar = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, hazirPaketler: cikar(p.hazirPaketler, id) }));
export const hazirPaketTasi = (ben: Kisi, planId: string, id: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => {
    const yeni = komsuylaDegis(p.hazirPaketler, (x) => x === id, () => true, yon);
    return yeni ? { ...p, hazirPaketler: yeni } : p;
  });

export const planBaslikEkle = (ben: Kisi, planId: string, baslikId: string, sonra?: string) =>
  planIcerik(ben, planId, (p) => {
    if (p.basliklar.some((b) => b.baslikId === baslikId)) return p;
    const id = kimlik("pb");
    return { ...p, basliklar: arkasina([...p.basliklar, { id, baslikId, muhabirler: [] }], kimlikOf, id, sonra) };
  });

/** Başlık plandan çıkınca o günkü gelişmeleri ve canlı yayınları da gidiyor; paketi olan başlık çıkmıyor. */
export const planBaslikCikar = (ben: Kisi, planId: string, pbId: string) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return false;
  if (d.paketler.some((p) => p.planBaslikId === pbId && p.durum !== "iptal")) return false;
  const oneriler = d.gelismeler.filter((g) => g.planBaslikId === pbId).map((g) => g.oneriId);
  d = {
    ...d,
    gelismeler: d.gelismeler.filter((g) => g.planBaslikId !== pbId),
    canliYayinlar: d.canliYayinlar.filter((c) => c.planBaslikId !== pbId),
  };
  kaydet(oneriBaglariniTazele(planGuncelle(d, planId, (p) => ({ ...p, basliklar: p.basliklar.filter((b) => b.id !== pbId) })), oneriler));
  return true;
};

/* --- Planlama görevleri ve iş taksimi (gorevler.ts) --- */

/*
 * Görev tanımı ekleniyor ya da değişiyor. Kayıtta görev yoksa varsayılan
 * temel görevler ilk yazışta kayda geçiyor (şablonlar gibi). Temel görev
 * silinmez, pasifleşir; yan görev silinir.
 */
export const gorevKaydet = (ben: Kisi, g: GorevTanimi) => {
  if (!gorevleriDuzenler(ben) || (g.tur === "yan" && !g.ad.trim())) return false;
  const d = getir();
  const liste = gorevListesi(d);
  const temiz: GorevTanimi = { ...g, ad: g.ad.trim(), etiketler: [...new Set(g.etiketler.map((x) => x.trim()).filter(Boolean))] };
  const yeni = liste.some((x) => x.id === g.id) ? liste.map((x) => (x.id === g.id ? temiz : x)) : [...liste, temiz];
  kaydet(hareketYaz({ ...d, gorevler: yeni }, { kisiId: ben.id, tip: "gorevKaydedildi", veri: { baslik: temiz.ad } }));
  return true;
};

export const gorevSil = (ben: Kisi, id: string) => {
  const d = getir();
  const g = gorevListesi(d).find((x) => x.id === id);
  if (!gorevleriDuzenler(ben) || !g || g.tur === "temel") return false;
  kaydet({
    ...d,
    gorevler: gorevListesi(d).filter((x) => x.id !== id),
    // İşin bağı kopuyor, iş kalıyor.
    isler: isListesi(d).map((x) => (x.gorevId === id ? { ...x, gorevId: undefined } : x)),
  });
  return true;
};

/** Dönemin sorumlusunu elle değiştirmek (izin, nöbet değişimi); kişi boşsa sıradaki hesaba döner. */
export const gorevDonemSorumlusu = (ben: Kisi, id: string, tarih: string, kisiId: string | null) => {
  const d = getir();
  const g = gorevListesi(d).find((x) => x.id === id);
  if (!gorevleriDuzenler(ben) || !g) return false;
  const anahtar = donemAnahtari(g, tarih);
  const degisiklikler = { ...(g.degisiklikler ?? {}) };
  if (kisiId) degisiklikler[anahtar] = kisiId;
  else delete degisiklikler[anahtar];
  return gorevKaydet(ben, { ...g, degisiklikler });
};

/** Tek seferlik iş: yeni ya da düzeltme; yeni atanan kişiye bildirim. */
export const isKaydet = (ben: Kisi, g: Omit<Is, "olusturan" | "zaman" | "durum"> & { durum?: IsDurumu }) => {
  let d = getir();
  const eski = isListesi(d).find((x) => x.id === g.id);
  if (!g.baslik.trim() || (eski ? !isDegistirebilir(ben, eski) : !isEkleyebilir(ben))) return false;
  // Yeni eklenen kişi ve ekip verenin kapsamında olmalı; eskiden kalan dokunulmadan geçer.
  const yeniKisiler = g.kisiler.filter((k) => !eski?.kisiler.includes(k));
  const yeniBirimler = (g.birimler ?? []).filter((b) => !eski?.birimler?.includes(b));
  if (yeniKisiler.some((id) => { const k = d.kisiler.find((x) => x.id === id); return !k || !isAlabilir(ben, k); })) return false;
  if (yeniBirimler.some((b) => !isVerilebilecekBirimler(ben).includes(b))) return false;
  const is: Is = {
    ...(eski ?? { olusturan: ben.id, zaman: simdi(), durum: "yapilacak" as IsDurumu }),
    ...g,
    baslik: g.baslik.trim(),
    etiketler: [...new Set(g.etiketler.map((x) => x.trim()).filter(Boolean))],
    aciklama: g.aciklama?.trim(),
    durum: g.durum ?? eski?.durum ?? "yapilacak",
  };
  // Boş alan kayıtta durmasın: düzenlemede silinen açıklama ya da ekip izi kalmasın.
  if (!is.aciklama) delete is.aciklama;
  if (!is.birimler?.length) delete is.birimler;
  d = { ...d, isler: eski ? isListesi(d).map((x) => (x.id === is.id ? is : x)) : [is, ...isListesi(d)] };
  // Bildirim yeni alıcılara: adıyla eklenenler ve yeni ekibin bugünkü kişileri, her biri bir kez.
  const ekip = d.kisiler.filter((k) => !k.pasif && !k.hesapsiz && yeniBirimler.includes(k.birim as BirimId)).map((k) => k.id);
  const alicilar = [...new Set([...yeniKisiler, ...ekip])].filter((k) => k !== ben.id && !eski?.kisiler.includes(k));
  for (const k of alicilar) d = hareketYaz(d, { kisiId: ben.id, tip: "isAtandi", veri: { baslik: is.baslik, kime: k } });
  kaydet(d);
  return true;
};

export const isDurumu = (ben: Kisi, id: string, durum: IsDurumu) => {
  const d = getir();
  const x = isListesi(d).find((y) => y.id === id);
  if (!x || !isDegistirebilir(ben, x) || x.durum === durum) return false;
  const yeni = { ...d, isler: isListesi(d).map((y) => (y.id === id ? { ...y, durum } : y)) };
  // Bitince işi girene haber; kendisi bitirdiyse gerek yok.
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "isDurumu", veri: { baslik: x.baslik, isDurumu: durum, ...(x.olusturan !== ben.id && durum === "bitti" ? { kime: x.olusturan } : {}) } }));
  return true;
};

export const isSil = (ben: Kisi, id: string) => {
  const d = getir();
  const x = isListesi(d).find((y) => y.id === id);
  if (!x || !(x.olusturan === ben.id || gorevleriDuzenler(ben))) return false;
  kaydet({ ...d, isler: isListesi(d).filter((y) => y.id !== id) });
  return true;
};

/*
 * Planda bir başlığı başka başlığın içine katmak ("+" menüsü ya da
 * sürükle-bırak): kaynak başlığın gelişmeleri, PKG önerileri ve canlı
 * yayınları hedef başlığa geçiyor, hedefin kendi kayıtlarının arkasına
 * (kendi aralarındaki sırayla); muhabirler hedefte yoksa saat ve yerleriyle
 * ekleniyor. Bu plandaki öneriler de hedef başlığa bağlanıyor ki "plana
 * eklendi · başlık" notu doğru başlığı göstersin. Kaynak başlık plandan
 * çıkıyor; havuzdaki başlığa dokunulmuyor (başka planlarda olabilir).
 */
export const planBaslikBirlestir = (ben: Kisi, planId: string, kaynakId: string, hedefId: string) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan) || kaynakId === hedefId) return false;
  const kaynak = plan.basliklar.find((b) => b.id === kaynakId);
  const hedef = plan.basliklar.find((b) => b.id === hedefId);
  if (!kaynak || !hedef) return false;
  // Taşınan kayıtlar dizide hedefin son kaydının arkasına: ekran ve çıktı dizinin sırasını izliyor.
  const tasi = <T extends { planBaslikId?: string }>(l: T[]): T[] => {
    const gelen = l.filter((x) => x.planBaslikId === kaynakId).map((x) => ({ ...x, planBaslikId: hedefId }));
    if (!gelen.length) return l;
    const kalan = l.filter((x) => x.planBaslikId !== kaynakId);
    const son = kalan.map((x) => x.planBaslikId).lastIndexOf(hedefId);
    const yer = son < 0 ? kalan.length : son + 1;
    return [...kalan.slice(0, yer), ...gelen, ...kalan.slice(yer)];
  };
  d = {
    ...d,
    gelismeler: tasi(d.gelismeler),
    canliYayinlar: tasi(d.canliYayinlar),
    paketler: tasi(d.paketler),
    oneriler: d.oneriler.map((o) => (o.planId === planId && o.baslikId === kaynak.baslikId ? { ...o, baslikId: hedef.baslikId } : o)),
  };
  const muhabirler = [...hedef.muhabirler, ...kaynak.muhabirler.filter((m) => !hedef.muhabirler.some((x) => x.kisiId === m.kisiId))];
  d = planGuncelle(d, planId, (p) => ({
    ...p,
    basliklar: p.basliklar.filter((b) => b.id !== kaynakId).map((b) => (b.id === hedefId ? { ...b, muhabirler } : b)),
  }));
  const ad = (id: string) => d.basliklar.find((b) => b.id === id)?.ad ?? "";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "baslikBirlestirildi", planId, veri: { katilan: ad(kaynak.baslikId), hedef: ad(hedef.baslikId), tarih: plan.tarih } }));
  return true;
};

export const planBaslikTasi = (ben: Kisi, planId: string, pbId: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => {
    const i = p.basliklar.findIndex((b) => b.id === pbId);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= p.basliklar.length) return p;
    const yeni = [...p.basliklar];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    return { ...p, basliklar: yeni };
  });

const pbGuncelle = (p: NextDayPlan, pbId: string, f: (m: PlanMuhabiri[]) => PlanMuhabiri[]): NextDayPlan => ({
  ...p,
  basliklar: p.basliklar.map((b) => (b.id === pbId ? { ...b, muhabirler: f(b.muhabirler) } : b)),
});

export const planMuhabir = (ben: Kisi, planId: string, pbId: string, kisiId: string, var_: boolean, sonra?: string) =>
  planIcerik(ben, planId, (p) => {
    const yeni = pbGuncelle(p, pbId, (m) =>
      var_
        ? m.some((x) => x.kisiId === kisiId)
          ? m
          : arkasina([...m, { kisiId }], (x) => x.kisiId, kisiId, sonra)
        : m.filter((x) => x.kisiId !== kisiId),
    );
    // Muhabir atanınca TBC kalkıyor: belirsizlik kalmadı.
    return var_ ? { ...yeni, basliklar: yeni.basliklar.map((b) => (b.id === pbId && b.muhabirTbc ? { ...b, muhabirTbc: undefined } : b)) } : yeni;
  });

/** Başlığın muhabiri henüz belli değil (TBC); yalnız muhabirsiz başlıkta işaretlenir. */
export const planMuhabirTbc = (ben: Kisi, planId: string, pbId: string, tbc: boolean) =>
  planIcerik(ben, planId, (p) => {
    const pb = p.basliklar.find((b) => b.id === pbId);
    if (!pb || (tbc && pb.muhabirler.length) || !!pb.muhabirTbc === tbc) return p;
    return { ...p, basliklar: p.basliklar.map((b) => (b.id === pbId ? { ...b, muhabirTbc: tbc ? (true as const) : undefined } : b)) };
  });

export const planMuhabirTasi = (ben: Kisi, planId: string, pbId: string, kisiId: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => komsuylaDegis(m, (x) => x.kisiId === kisiId, () => true, yon) ?? m));

export const planMuhabirGuncelle = (ben: Kisi, planId: string, pbId: string, kisiId: string, g: { yer?: string; saat?: string }) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => m.map((x) => (x.kisiId === kisiId ? { ...x, ...g, onceki: undefined, devir: undefined } : x))));

export type OncekiHedef = { ekip: string } | { hareket: string } | { muhabir: [string, string] } | { gelisme: string } | { canli: string };

/**
 * "Bugün de geçerli": önceki günden gelen kaydı değiştirmeden bugünün
 * kaydı sayar. Hedef yoksa planın bütün işaretleri kalkıyor. Canlı yayın
 * ve gelişme devirden sonra Newsdesk'in de işi olduğu için yetki ikisinden
 * biri yeterli.
 */
export const oncekiOnayla = (ben: Kisi, planId: string, hedef?: OncekiHedef) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !(planIcerikDuzenler(ben, plan) || planOperasyonDuzenler(ben, plan))) return false;
  const secili = (tur: "ekip" | "hareket" | "gelisme" | "canli", id: string) => !hedef || (tur in hedef && (hedef as Record<string, unknown>)[tur] === id);
  const muhabirSecili = (pbId: string, kisiId: string) => !hedef || ("muhabir" in hedef && hedef.muhabir[0] === pbId && hedef.muhabir[1] === kisiId);
  d = planGuncelle(d, planId, (p) => ({
    ...p,
    ekip: p.ekip.map((e) => (secili("ekip", e.kisiId) ? { ...e, onceki: undefined } : e)),
    oncekiHareketler: bosIse((p.oncekiHareketler ?? []).filter((id) => !secili("hareket", id))),
    basliklar: p.basliklar.map((b) => ({ ...b, muhabirler: b.muhabirler.map((m) => (muhabirSecili(b.id, m.kisiId) ? { ...m, onceki: undefined, devir: undefined } : m)) })),
  }));
  d = {
    ...d,
    gelismeler: d.gelismeler.map((g) => (g.planId === planId && secili("gelisme", g.id) ? { ...g, onceki: undefined, devir: undefined } : g)),
    canliYayinlar: d.canliYayinlar.map((c) => (c.planId === planId && secili("canli", c.id) ? { ...c, onceki: undefined, devir: undefined } : c)),
  };
  kaydet(d);
  return true;
};

/* --- Gelişme ve canlı yayın: devirden sonra Newsdesk de ekleyebiliyor (operasyonel güncelleme). --- */

export const gelismeKaydet = (ben: Kisi, g: Omit<Gelisme, "id"> & { id?: string }, sonra?: string) => {
  const d = getir();
  const plan = planBul(d, g.planId);
  if (!plan || !planOperasyonDuzenler(ben, plan)) return false;
  if (g.id) {
    kaydet({ ...d, gelismeler: d.gelismeler.map((x) => (x.id === g.id ? { ...x, ...g, id: x.id, onceki: undefined, devir: undefined } : x)) });
  } else {
    const id = kimlik("g");
    kaydet({ ...d, gelismeler: arkasina([...d.gelismeler, { ...g, id }], kimlikOf, id, sonra) });
  }
  return true;
};

/*
 * Gelişme başka başlığa (ya da başlıksız takiplere) geçiyor, hedefin sonuna.
 * Öneriden geldiyse önerinin başlığı da değişiyor; önerinin bu plandaki
 * paketi eski başlıktaysa onunla birlikte gidiyor: paket eski başlıkta kalıp
 * gelişmeden ayrışmasın. Dokunulan kayıt bugünün kaydı ("önceki" işareti kalkıyor).
 */
export const gelismeBasligaTasi = (ben: Kisi, id: string, hedefPbId?: string) => {
  let d = getir();
  const g = d.gelismeler.find((x) => x.id === id);
  const plan = planBul(d, g?.planId);
  if (!g || !plan || !planOperasyonDuzenler(ben, plan) || g.planBaslikId === hedefPbId) return false;
  const hedef = hedefPbId ? plan.basliklar.find((b) => b.id === hedefPbId) : undefined;
  if (hedefPbId && !hedef) return false;
  const yeni: Gelisme = { ...g, planBaslikId: hedefPbId, onceki: undefined, devir: undefined };
  d = { ...d, gelismeler: [...d.gelismeler.filter((x) => x.id !== id), yeni] };
  if (g.oneriId && hedef) {
    const eskiPb = g.planBaslikId;
    d = {
      ...d,
      oneriler: d.oneriler.map((o) => (o.id === g.oneriId && o.baslikId !== hedef.baslikId ? { ...o, baslikId: hedef.baslikId } : o)),
      paketler: d.paketler.map((p) => (p.oneriId === g.oneriId && p.planId === plan.id && p.planBaslikId === eskiPb && p.durum !== "iptal" ? { ...p, planBaslikId: hedef.id } : p)),
    };
  }
  kaydet(d);
  return true;
};

/** Gelişme yalnız aynı başlığın (başlıksızsa takiplerin) içinde yer değiştiriyor. */
export const gelismeTasi = (ben: Kisi, id: string, yon: -1 | 1) => {
  const d = getir();
  const g = d.gelismeler.find((x) => x.id === id);
  const plan = planBul(d, g?.planId);
  if (!g || !plan || !planOperasyonDuzenler(ben, plan)) return false;
  const yeni = komsuylaDegis(d.gelismeler, (x) => x.id === id, (x) => x.planId === g.planId && x.planBaslikId === g.planBaslikId, yon);
  if (!yeni) return false;
  kaydet({ ...d, gelismeler: yeni });
  return true;
};

export const gelismeSil = (ben: Kisi, id: string) => {
  const d = getir();
  const g = d.gelismeler.find((x) => x.id === id);
  const plan = planBul(d, g?.planId);
  if (!g || !plan || !planOperasyonDuzenler(ben, plan)) return false;
  kaydet(oneriBaglariniTazele({ ...d, gelismeler: d.gelismeler.filter((x) => x.id !== id) }, [g.oneriId]));
  return true;
};

export const canliKaydet = (ben: Kisi, c: Omit<CanliYayin, "id"> & { id?: string }) => {
  const d = getir();
  const plan = planBul(d, c.planId);
  if (!plan || !planOperasyonDuzenler(ben, plan)) return false;
  if (c.id) {
    kaydet({ ...d, canliYayinlar: d.canliYayinlar.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id, onceki: undefined, devir: undefined } : x)) });
  } else {
    kaydet({ ...d, canliYayinlar: [...d.canliYayinlar, { ...c, id: kimlik("cy") }] });
  }
  return true;
};

export const canliSil = (ben: Kisi, id: string) => {
  const d = getir();
  const c = d.canliYayinlar.find((x) => x.id === id);
  const plan = planBul(d, c?.planId);
  if (!c || !plan || !planOperasyonDuzenler(ben, plan)) return false;
  kaydet(oneriBaglariniTazele({ ...d, canliYayinlar: d.canliYayinlar.filter((x) => x.id !== id) }, [c.oneriId]));
  return true;
};

/* --- Paket önerisi --- */

export interface PaketGirdisi {
  id?: string;
  planId: string;
  planBaslikId: string;
  baslik: string;
  sehir: Sehir;
  yer?: string;
  muhabirId?: string;
  aciklama: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  teslim?: string;
  yayin?: string;
  sahaGerekli: boolean;
  slug?: string;
  muhabirTbc?: boolean;
}

/* Yeni paket listelerde önde (en yeni üstte); belgede "altına ekle" denince o satırın arkasına giriyor. */
export const paketKaydet = (ben: Kisi, g: PaketGirdisi, sonra?: string): string | null => {
  let d = getir();
  const plan = planBul(d, g.planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return null;
  g = { ...g, muhabirTbc: g.muhabirTbc && !g.muhabirId ? true : undefined };
  if (g.id) {
    const id = g.id;
    kaydet(paketGuncelle(d, id, (p) => ({ ...p, ...g, muhabirTbc: g.muhabirTbc || undefined, id })));
    return id;
  }
  let kod: string;
  [kod, d] = yeniKod(d);
  const id = kimlik("p");
  const paket: Paket = { ...g, muhabirTbc: g.muhabirTbc || undefined, id, kod, durum: "taslak", notlar: [], olusturma: simdi(), guncelleme: simdi() };
  d = { ...d, paketler: arkasina([paket, ...d.paketler], kimlikOf, id, sonra) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "paketOlusturuldu", paketId: id, planId: plan.id }));
  return id;
};

/** Çıktıda başlığın PKG satırlarının sırası; iptal edilen çıktıda olmadığı için atlanıyor. */
export const paketTasi = (ben: Kisi, id: string, yon: -1 | 1) => {
  const d = getir();
  const p = paketBul(d, id);
  const plan = planBul(d, p?.planId);
  if (!p || !plan || !planIcerikDuzenler(ben, plan)) return false;
  const yeni = komsuylaDegis(d.paketler, (x) => x.id === id, (x) => x.planId === p.planId && x.planBaslikId === p.planBaslikId && x.durum !== "iptal", yon);
  if (!yeni) return false;
  kaydet({ ...d, paketler: yeni });
  return true;
};

/** Yalnız henüz değerlendirmedeki paket silinir; ileri gitmiş olan iptal edilir ki geçmişi kalsın. */
export const paketSil = (ben: Kisi, id: string) => {
  const d = getir();
  const p = paketBul(d, id);
  const plan = planBul(d, p?.planId);
  if (!p || !plan || !planIcerikDuzenler(ben, plan) || !paketPlandanSilinir(p)) return false;
  let yeni = oneriBaglariniTazele(
    {
      ...d,
      paketler: d.paketler.filter((x) => x.id !== id),
      oneriler: d.oneriler.map((o) => (o.paketId === id ? { ...o, paketId: undefined } : o)),
    },
    [p.oneriId],
  );
  // Onaylı paketin muhabiri onayı duymuştu; paket gidince o da duysun (paket kaydı kalmadığı için kime ile).
  if (p.durum === "onaylandi" && p.muhabirId) yeni = hareketYaz(yeni, { kisiId: ben.id, tip: "paketIptal", planId: plan.id, oneriId: p.oneriId, veri: { kime: p.muhabirId } });
  kaydet(yeni);
  return true;
};

/*
 * Newsdesk sistemde değilken onaylı paketin kapanışı: muhabir haberi
 * yaptığını işaretliyor (Planlama da onun adına). Muhabirin teslimi
 * performans ölçümüne giriyor. Bildirim karşı tarafa.
 */
export const paketTamamla = (ben: Kisi, id: string) => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p || !paketTamamlayabilir(ben, p, d)) return false;
  const z = simdi();
  const muhabirKendisi = ben.id === p.muhabirId;
  let yeni = paketGuncelle(d, id, (x) => ({ ...x, durum: "tamamlandi", adim: undefined, guncelleme: z, ...(muhabirKendisi && !x.muhabirTeslimi ? { muhabirTeslimi: z } : {}) }));
  // Önerisi e-postayla takipteyse takip de bitiyor: aynı haber için iki ayrı "tamamlandı" yok.
  if (p.oneriId) yeni = { ...yeni, oneriler: yeni.oneriler.map((o) => (o.id === p.oneriId && o.takip === "acik" ? { ...o, takip: "tamamlandi", takipBitis: z, takipBitiren: ben.id } : o)) };
  // Özel yayın talebi: teslimi Planlama izliyor; işi yapan değil de Planlama kapattıysa işi yapana haber.
  if (p.ozelId) {
    const yapan = p.muhabirId ?? p.hazirlayanId;
    yeni = paketOnerisiIzi(yeni, ben, p, "hazir");
    kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "ozelPaketTeslim", paketId: id, ozelId: p.ozelId, veri: ben.id === yapan || !yapan ? { sahip: "planlama" } : { kime: yapan } }));
    return true;
  }
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "tamamlandi", paketId: id, planId: p.planId, veri: muhabirKendisi ? { sahip: "planlama" } : { ...(p.muhabirId ? { kime: p.muhabirId } : {}) } }));
  return true;
};

/** Newsdesk'in sisteme katılıp katılmadığı (tam yönetici); yarım paketler kendi yolunda kalıyor. */
export const newsdeskDevredeKaydet = (ben: Kisi, devrede: boolean) => {
  if (!ben.hesapYoneticisi) return false;
  const d = getir();
  kaydet({ ...d, newsdeskDevrede: devrede || undefined });
  return true;
};

export const paketDurum = (ben: Kisi, id: string, yeni: "degerlendiriliyor" | "onaylandi" | "iptal") => {
  let d = getir();
  const p = paketBul(d, id);
  if (!p || !yapabilir(ben, "paketDegerlendir") || ["tamamlandi", "iptal"].includes(p.durum)) return false;
  if (yeni !== "iptal" && !["taslak", "degerlendiriliyor"].includes(p.durum)) return false;
  d = paketGuncelle(d, id, (x) => ({ ...x, durum: yeni, adim: yeni === "iptal" ? undefined : x.adim }));
  const tip = yeni === "degerlendiriliyor" ? "paketDegerlendirmede" : yeni === "onaylandi" ? "paketOnaylandi" : "paketIptal";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, paketId: id, planId: p.planId }));
  return true;
};

/**
 * Plansız onaylı paketi üretime alır: haftalık toplantıda kabul edilen
 * feature, ekonomi, günü olmayan haber ya da program. Next Day paketinde
 * bunu planın devri yapıyor; plansız paketin devri kolun sahibinde.
 */
export const uretimeAl = (ben: Kisi, paketId: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !uretimeAlabilir(ben, p)) return false;
  const adim = ilkAdim(p);
  const akis = akisDamgasi(p);
  d = paketGuncelle(d, paketId, (x) => ({ ...x, durum: "uretimde", adim, akis }));
  const sahip = paketSahibi({ ...p, durum: "uretimde", adim, akis });
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "uretimeAlindi", paketId, veri: { adim, sahip: sahip ?? "" } }));
  return true;
};

/* --- Üretim adımları (rapor 4-10. kutular) --- */

export interface AdimGirdisi {
  muhabirId?: string;
  teslim?: string;
  metin?: string;
  video?: string;
  klipKodu?: string;
  /** Genel durakta sorumlunun kısa notu; paketin notlarına giriyor. */
  not?: string;
}

const ADIM_HAREKETI: Record<UretimAdimi, Hareket["tip"]> = {
  gorevlendirme: "gorevlendirildi",
  newsdesk: "gorevVerildi",
  metin: "metinGeldi",
  kontrol: "kontrolEdildi",
  dil: "sonScript",
  video: "videoGeldi",
  iletim: "mediayaGonderildi",
  media: "klipKodu",
  inews: "tamamlandi",
};

/** Paketi bir adım ileri taşır; adımın istediği bilgi (metin, link, klip kodu) yoksa taşımaz. */
export const adimIlerle = (ben: Kisi, paketId: string, g: AdimGirdisi = {}) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !adimYapabilir(ben, p)) return false;
  // Davranış durağın türünden: yöneticinin eklediği ikinci bir kontrol durağı da kontrol gibi işliyor.
  const adim = adimTuru(p) ?? "is";
  if (adim === "gorevlendirme" && !(g.muhabirId || p.muhabirId)) return false;
  if (adim === "metin" && !g.metin?.trim()) return false;
  if (adim === "video" && !g.video?.trim()) return false;
  if (adim === "media" && !g.klipKodu?.trim()) return false;

  const sonraki = sonrakiAdim(p);
  const yeni: Paket = {
    ...p,
    ...(g.muhabirId ? { muhabirId: g.muhabirId } : {}),
    ...(g.teslim ? { teslim: g.teslim } : {}),
    ...(g.metin ? { metin: g.metin } : {}),
    ...(g.video ? { video: g.video } : {}),
    ...(g.klipKodu ? { klipKodu: g.klipKodu } : {}),
    ...(g.not?.trim() ? { notlar: [...p.notlar, { id: kimlik("n"), kisiId: ben.id, zaman: simdi(), metin: g.not.trim() }] } : {}),
    ...(adim === "newsdesk" ? { gorevZamani: simdi() } : {}),
    ...(adim === "video" ? { muhabirTeslimi: simdi() } : {}),
    ...(sonraki === "tamam" ? { durum: "tamamlandi", adim: undefined } : { adim: sonraki }),
  };
  d = paketGuncelle(d, paketId, () => yeni);
  if (g.not?.trim()) d = bahset(d, ben, g.not, { yol: `#/paketler/${paketId}`, baslik: p.baslik });
  const veri: Record<string, string> = { adim: sonraki, sahip: paketSahibi(yeni) ?? "" };
  // Stok paketi son adımda yayına değil stoğa giriyor; hareket cümlesi ona göre.
  if (sonraki === "tamam" && p.stok) veri.stok = "1";
  if (g.klipKodu) veri.kod = g.klipKodu;
  if (g.muhabirId) veri.muhabir = g.muhabirId;
  if (adim === "is") veri.durak = p.adim ?? "";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: adim === "is" ? "durakTamamlandi" : ADIM_HAREKETI[adim], paketId, planId: p.planId, veri }));
  return true;
};

/**
 * Geri gönderen durak (varsayılanda metin kontrolü ve dil denetimi) işi
 * gerekçeyle geri yolluyor: metin durağına, yoksa bir önceki durağa
 * (akis.ts → geriHedefi).
 */
export const geriGonder = (ben: Kisi, paketId: string, gerekce: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const hedef = p && geriHedefi(p);
  if (!p || !hedef || !adimYapabilir(ben, p) || !gerekce.trim()) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, adim: hedef, duzeltmeSayisi: (x.duzeltmeSayisi ?? 0) + 1 }));
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "geriGonderildi",
      paketId,
      planId: p.planId,
      veri: { gerekce: gerekce.trim(), adim: hedef, sahip: durakSahibi(p, hedef) },
    }),
  );
  return true;
};

/*
 * Notta anılanlar (bahsetme.ts): her not eylemi kaydederken bunu çağırıyor.
 * Anılana kayıt (işler listesinde) ve bildirim; düzenlenen notta yalnız
 * yeni anılanlar. Kendini anan ve pasif kişi düşüyor.
 */
export const bahset = (d: Durum, ben: Kisi, metin: string, baglam: { yol: string; baslik?: string }, eski = ""): Durum => {
  const ids = yeniAnilanlar(metin, eski, d.kisiler).filter((id) => id !== ben.id);
  if (!ids.length) return d;
  const z = simdi();
  const yeni: Bahsetme[] = ids.map((kisiId) => ({ id: kimlik("bh"), kisiId, yazanId: ben.id, zaman: z, metin: metin.trim(), yol: baglam.yol, ...(baglam.baslik ? { baslik: baglam.baslik } : {}) }));
  d = { ...d, bahsetmeler: [...yeni, ...(d.bahsetmeler ?? [])] };
  return hareketYaz(d, { kisiId: ben.id, tip: "bahsedildi", veri: { kime: ids.join(","), not: metin.trim().slice(0, 160), yol: baglam.yol, ...(baglam.baslik ? { baslik: baglam.baslik } : {}) } });
};

/** Anılan notu gördü: işler listesinden kalkıyor. Yalnız kendi kaydı. */
export const bahsetmeGoruldu = (ben: Kisi, id: string) => {
  const d = getir();
  const b = d.bahsetmeler?.find((x) => x.id === id);
  if (!b || b.kisiId !== ben.id || b.goruldu) return false;
  kaydet({ ...d, bahsetmeler: d.bahsetmeler!.map((x) => (x.id === id ? { ...x, goruldu: simdi() } : x)) });
  return true;
};

export const notEkle = (ben: Kisi, paketId: string, metin: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !metin.trim() || !paketGorebilir(ben, p, d)) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, notlar: [...x.notlar, { id: kimlik("n"), kisiId: ben.id, zaman: simdi(), metin: metin.trim() }] }));
  d = bahset(d, ben, metin, { yol: `#/paketler/${paketId}`, baslik: p.baslik });
  const sahip = paketSahibi(p);
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "notEklendi", paketId, planId: p.planId, veri: { sahip: sahip ?? "" } }));
  return true;
};

/* --- Yöneticinin müdahalesi: öncelik ve not; işi o an yürüten birime bildirim düşer --- */

export const oncelikDegistir = (ben: Kisi, paketId: string, oncelikli: boolean) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !mudahaleEdebilir(ben, p) || !!p.oncelikli === oncelikli) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, oncelikli: oncelikli || undefined }));
  const tip = oncelikli ? "paketOncelikli" : "paketOncelikKalkti";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, paketId, planId: p.planId, veri: { sahip: paketSahibi(p) ?? "" } }));
  return true;
};

export const yoneticiNotu = (ben: Kisi, paketId: string, metin: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !metin.trim() || !mudahaleEdebilir(ben, p)) return false;
  d = paketGuncelle(d, paketId, (x) => ({
    ...x,
    notlar: [...x.notlar, { id: kimlik("n"), kisiId: ben.id, zaman: simdi(), metin: metin.trim(), yonetici: true }],
  }));
  d = bahset(d, ben, metin, { yol: `#/paketler/${paketId}`, baslik: p.baslik });
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "yoneticiNotu", paketId, planId: p.planId, veri: { sahip: paketSahibi(p) ?? "" } }));
  return true;
};

/** Tamamlanan pakete nitelik puanı: göstergeye girer, ölçütü birimle netleşecek. */
export const nitelikPuanla = (ben: Kisi, paketId: string, puan: number) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || p.durum !== "tamamlandi" || !yapabilir(ben, "nitelikPuanla") || !Number.isInteger(puan) || puan < 1 || puan > 5) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, nitelik: puan }));
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "nitelikPuanlandi", paketId, planId: p.planId, veri: { puan: String(puan) } }));
  return true;
};

export type ProfilGirdisi = Partial<
  Pick<Kisi, "telefon" | "eposta" | "kisiselEposta" | "irtibat" | "kisaltma" | "sehir" | "digerUlkeler" | "bicimler" | "calisma" | "foto">
>;

/* Profil formunda listede olmayan şehir: Arapça adı zorunlu, ülkesi seçilir. */
export interface YeniSehir {
  ar: string;
  tr?: string;
  en?: string;
  ulke: Ulke;
}

/*
 * Aynı Arapça adlı şehir varsa (yerleşik ya da eklenmiş) o kullanılır:
 * iki kişi aynı şehri ayrı ayrı yazınca liste çoğalmasın.
 */
const sehirKur = (d: Durum, y: YeniSehir): { d: Durum; id: Sehir } => {
  const ar = y.ar.trim();
  const sade = (x: string) => x.trim().replace(/\s+/g, " ");
  const var_ = sehirListesi(d).find((s) => sade(sehirAdi(s, "ar", d)) === sade(ar));
  if (var_) return { d, id: var_ };
  const id = kimlik("s-");
  const ad = { ar, ...(y.tr?.trim() && { tr: y.tr.trim() }), ...(y.en?.trim() && { en: y.en.trim() }) };
  return { d: { ...d, sehirler: [...(d.sehirler ?? []), { id, ad, ulke: y.ulke }] }, id };
};

/*
 * Kişinin şehri tek başına (Hesaplar'daki satır, kişi düzenleme penceresi).
 * Profili düzenleyebilen ya da kişi düzenleme yetkisi olan değiştirir.
 */
export const kisiSehri = (ben: Kisi, kisiId: string, sehir: Sehir | YeniSehir): boolean => {
  let d = getir();
  const kisi = kisiBul(d, kisiId);
  if (!kisi || !(profilDuzenler(ben, kisi) || hesapYetkisi(ben, "kisiDuzenle"))) return false;
  let id: Sehir;
  let eklendi = false;
  if (typeof sehir === "string") {
    if (!sehirListesi(d).includes(sehir)) return false;
    id = sehir;
  } else {
    if (!sehir.ar.trim()) return false;
    const k = sehirKur(d, sehir);
    eklendi = k.d !== d;
    d = k.d;
    id = k.id;
  }
  if (id === kisi.sehir && !eklendi) return true;
  // Dış muhabirin ünvanı şehrinden ("<Şehir> muhabiri"): şehirle birlikte değişiyor.
  d = { ...d, kisiler: d.kisiler.map((k) => (k.id === kisiId ? yerUnvaniUygula({ ...k, sehir: id }) : k)) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "profilGuncellendi", veri: { muhabir: kisiId, sehir: id } }));
  return true;
};

export const profilGuncelle = (ben: Kisi, kisiId: string, g: ProfilGirdisi, yeniSehir?: YeniSehir) => {
  let d = getir();
  const kisi = kisiBul(d, kisiId);
  if (!kisi || !profilDuzenler(ben, kisi)) return false;
  if (yeniSehir) {
    if (!yeniSehir.ar.trim()) return false;
    const k = sehirKur(d, yeniSehir);
    d = k.d;
    g = { ...g, sehir: k.id };
  }
  /* Kişi kendi çalışma biçimini değiştiremez: sözleşme Planlama ve Yönetim'in kaydı. */
  const izinli = ben.id === kisiId && !yapabilir(ben, "profilDuzenle") ? { ...g, calisma: undefined } : g;
  const temiz = Object.fromEntries(Object.entries(izinli).filter(([, x]) => x !== undefined)) as ProfilGirdisi;
  if ("foto" in g && g.foto === undefined) temiz.foto = undefined;
  d = { ...d, kisiler: d.kisiler.map((k) => (k.id === kisiId ? yerUnvaniUygula({ ...k, ...temiz }) : k)) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "profilGuncellendi", veri: { muhabir: kisiId } }));
  return true;
};

/* --- E-postayla gelen yanıtlar --- */

export interface YanitSonucu {
  durum: YanitDurum | "tekrar";
  yanitId?: string;
  oneriId?: string;
}

/*
 * Gelen e-postayı işler: gönderen muhabire, konudaki etiket çağrıya
 * bağlanıyor; alıntı ayıklanıyor; kısa "önerim yok" yanıtı öneri listesini
 * doldurmuyor; gerisi olduğu gibi tek öneri olarak düşüyor (bölmeyi plancı
 * yapıyor). Eşleşmeyen e-posta kaybolmuyor, ayrı listede bekliyor. Aynı
 * Message-ID ikinci kez işlenmiyor. Sunucu fazında posta kutusunu izleyen
 * hizmet de bunu çağıracak; tarayıcıda yalnız Planlama içe aktarabiliyor.
 */
export const epostaYanitiIsle = (ben: Kisi | undefined, gelen: GelenEposta, kaynak: Yanit["kaynak"]): YanitSonucu | null => {
  if (kaynak === "iceAktarma" && !yapabilir(ben, "cagriHazirla")) return null;
  let d = getir();
  if (gelen.mesajKimligi && d.yanitlar.some((y) => y.mesajKimligi === gelen.mesajKimligi)) return { durum: "tekrar" };
  const zaman = gelen.zaman ?? simdi();
  const kisi = gondereniBul(d, gelen.kimden);
  const cagri = cagriyiBul(d, gelen.konu, zaman, kisi);
  const metin = yeniMetin(gelen.metin) || gelen.metin.trim();
  const durum: YanitDurum = !kisi || !cagri ? "eslesmedi" : bosYanitMi(metin) ? "oneriYok" : "oneri";
  const yanit: Yanit = {
    id: kimlik("y"),
    cagriId: cagri?.id,
    kisiId: kisi?.id,
    kimden: gelen.kimden.trim(),
    kimdenAd: gelen.kimdenAd,
    konu: gelen.konu,
    metin,
    tamMetin: gelen.metin,
    zaman,
    mesajKimligi: gelen.mesajKimligi,
    ekler: gelen.ekler ?? [],
    durum,
    kaynak,
  };
  d = { ...d, yanitlar: [yanit, ...d.yanitlar] };
  return { durum, yanitId: yanit.id, oneriId: yanitiYerlestir(d, yanit) };
};

/* Eşleşmiş yanıt: öneri ya da "önerisi yok" hareketi; eşleşmemiş yalnız saklanıyor. */
const yanitiYerlestir = (d: Durum, y: Yanit): string | undefined => {
  const kisi = kisiBul(d, y.kisiId);
  const cagri = d.cagrilar.find((c) => c.id === y.cagriId);
  if (!kisi || !cagri || y.durum === "eslesmedi") {
    kaydet(d);
    return undefined;
  }
  if (y.durum === "oneriYok") {
    kaydet(hareketYaz(d, { kisiId: kisi.id, tip: "yanitOneriYok", veri: { tarih: cagri.tarih } }));
    return undefined;
  }
  const oneri = yanittanOneriTaslagi(y, kisi, cagri, kimlik("o"));
  d = { ...d, oneriler: [oneri, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: kisi.id, tip: "oneriGeldi", oneriId: oneri.id, veri: { sahip: "planlama", kanal: "eposta" } }));
  return oneri.id;
};

/** Eşleşmeyen yanıtı muhabire (ve gerekirse çağrıya) bağlar; sonra eşleşmiş gibi yerleşir. */
export const yanitBagla = (ben: Kisi, yanitId: string, kisiId: string, cagriId: string): YanitSonucu | null => {
  if (!yapabilir(ben, "oneriDegerlendir")) return null;
  let d = getir();
  const y = d.yanitlar.find((x) => x.id === yanitId);
  if (!y || y.durum !== "eslesmedi" || !kisiBul(d, kisiId) || !d.cagrilar.some((c) => c.id === cagriId)) return null;
  const durum: YanitDurum = bosYanitMi(y.metin) ? "oneriYok" : "oneri";
  const yeni = { ...y, kisiId, cagriId, durum };
  d = { ...d, yanitlar: d.yanitlar.map((x) => (x.id === yanitId ? yeni : x)) };
  return { durum, yanitId, oneriId: yanitiYerlestir(d, yeni) };
};

export interface YanitOneriGirdisi {
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  tur: IcerikTuru;
  bicim?: OneriBicimi;
  sahaGerekli: boolean;
}

/** Bir yanıtta birden çok öneri varsa plancı her birini ayrı öneri olarak açıyor; yanıt değişmiyor. */
export const yanittanOneri = (ben: Kisi, yanitId: string, g: YanitOneriGirdisi): string | null => {
  if (!yapabilir(ben, "oneriDegerlendir") || !g.haberBasligi.trim()) return null;
  let d = getir();
  const y = d.yanitlar.find((x) => x.id === yanitId);
  const kisi = kisiBul(d, y?.kisiId);
  const cagri = d.cagrilar.find((c) => c.id === y?.cagriId);
  if (!y || !kisi || !cagri) return null;
  const oneri: Oneri = {
    ...yanittanOneriTaslagi(y, kisi, cagri, kimlik("o")),
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
  };
  d = { ...d, oneriler: [oneri, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriDuzenlendi", oneriId: oneri.id, veri: { sahip: "planlama" } }));
  return oneri.id;
};

/*
 * Planlama öneriyi her aşamada düzeltiyor: e-postadan düşen önerinin ilk
 * satırı, eksik ya da yanlış yazılmış başlık, plana eklendikten sonra da.
 * Gönderenin yazdığı ilk düzenlemede `ilkHali`'ne bir kez saklanıyor.
 * Plana eklenmiş önerinin gelişmesi ve paketi de güncelleniyor; ama yalnız
 * plandaki metin hâlâ önerinin eski metniyse (planda ayrıca elle
 * değiştirilmişse o emek ezilmesin). Başlık havuzundaki başlığın adına
 * dokunulmuyor: başka gelişmeler de onun altında olabilir.
 */
export const oneriDuzenle = (ben: Kisi, oneriId: string, g: YanitOneriGirdisi) => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !oneriDuzenleyebilir(ben, o) || !g.haberBasligi.trim()) return false;
  let yeni: Oneri = {
    ...o,
    ilkHali: o.ilkHali ?? { haberBasligi: o.haberBasligi, gelisme: o.gelisme, ...(o.paketBasligi && { paketBasligi: o.paketBasligi }) },
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
  };
  [d, yeni] = takibiEsle(d, yeni);
  // Plandaki gelişmenin metni oneriPlanaEkle'deki kuralla (planMetni).
  const metin = (x: Oneri, _paketli: boolean) => planMetni(x);
  const paketli = !!o.paketId;
  d = {
    ...d,
    oneriler: d.oneriler.map((x) => (x.id === oneriId ? yeni : x)),
    gelismeler: d.gelismeler.map((x) => (x.oneriId === oneriId && x.metin === metin(o, paketli) && metin(o, paketli) !== metin(yeni, paketli) ? { ...x, metin: metin(yeni, paketli) } : x)),
    paketler: d.paketler.map((p) => {
      if (p.oneriId !== oneriId) return p;
      const yeniStrap = oneriPaketBasligi(yeni);
      const baslik = p.baslik === (oneriPaketBasligi(o) ?? "") && yeniStrap ? yeniStrap : p.baslik;
      const aciklama = p.aciklama === o.gelisme ? yeni.gelisme : p.aciklama;
      const tur = p.tur === o.tur ? yeni.tur : p.tur;
      const bicim = p.bicim === paketBicimi(o.bicim) ? (paketBicimi(yeni.bicim) ?? p.bicim) : p.bicim;
      if (baslik === p.baslik && aciklama === p.aciklama && tur === p.tur && bicim === p.bicim) return p;
      return { ...p, baslik, aciklama, tur, ...(bicim ? { bicim } : {}), guncelleme: simdi() };
    }),
    canliYayinlar: d.canliYayinlar.map((c) => {
      const eski = o.paketBasligi?.trim() || o.haberBasligi;
      const yeniKonu = yeni.paketBasligi?.trim() || yeni.haberBasligi;
      return c.oneriId === oneriId && c.konu === eski && eski !== yeniKonu ? { ...c, konu: yeniKonu } : c;
    }),
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriDuzenlendi", oneriId, veri: { onceki: o.haberBasligi } }));
  return true;
};

export const bildirimleriOku = (ben: Kisi) => {
  const d = getir();
  kaydet({ ...d, okundu: { ...d.okundu, [ben.id]: simdi() } });
};

/** Muhabirin şehrinden ülkesi; öneri formunda varsayılan. */
export const ulkesi = (s: Sehir): Ulke => sehirUlkesi(s, getir());

/* --- Ana sayfa düzeni --- */

/**
 * Kişinin kendi ana sayfasındaki alanlar ve sırası; null birimin
 * varsayılanına döndürüyor. İş kaydı değil kişisel tercih: hareket
 * yazılmıyor, herkes yalnız kendi düzenini değiştiriyor.
 */
export const anaSayfaKaydet = (ben: Kisi, duzen: string, alanlar: string[] | null) => {
  const d = getir();
  const anahtar = `${ben.id}:${duzen}`;
  const yeni = { ...(d.anaSayfa ?? {}) };
  if (alanlar) yeni[anahtar] = [...new Set(alanlar)];
  else delete yeni[anahtar];
  kaydet({ ...d, anaSayfa: yeni });
  return true;
};

/**
 * Plan ekranlarındaki öneriler kart mı liste mi; ana sayfa düzeni gibi
 * kişinin tercihi. Aynı tarayıcıda başka biri girince kendi seçimini
 * görsün diye tarayıcıda değil kayıtta; hareket yazılmıyor.
 */
export const oneriGorunumuKaydet = (ben: Kisi, gorunum: OneriGorunumu) => {
  const d = getir();
  kaydet({ ...d, oneriGorunumu: { ...(d.oneriGorunumu ?? {}), [ben.id]: gorunum } });
  return true;
};

/* --- Üst çubuktaki kısayollar --- */

/**
 * Kişinin kısayolları ve sırası; null birimin varsayılanına döndürüyor.
 * Ana sayfa düzeni gibi kişisel tercih: hareket yazılmıyor. Görünmeyen
 * sayfa ve sınırın üstü düğmede olduğu gibi burada da eleniyor.
 */
export const kisayollariKaydet = (ben: Kisi, liste: string[] | null) => {
  const d = getir();
  const yeni = { ...(d.kisayollar ?? {}) };
  if (liste) yeni[ben.id] = [...new Set(liste)].filter((k) => kisayolGorebilir(ben, k)).slice(0, KISAYOL_EN_COK);
  else delete yeni[ben.id];
  kaydet({ ...d, kisayollar: yeni });
  return true;
};

/* --- Gerçek kip: hesaplar --- */

/**
 * Hesabı kapatma/açma (hesapAcKapa yetkisi) ve tam yöneticilik (yalnız tam
 * yönetici). Kurallar da aynısını soruyor (firestore.rules); kişi kendi
 * hesabını kapatamıyor, yöneticiliğini bırakamıyor: sistem yöneticisiz
 * kalmasın. Tam yöneticinin hesabını yalnız tam yönetici kapatıyor.
 */
export const kisiHesabi = (ben: Kisi, kisiId: string, ayar: { pasif?: boolean; hesapYoneticisi?: boolean }) => {
  if (!GERCEK || kisiId === ben.id) return false;
  const d = getir();
  const k = d.kisiler.find((x) => x.id === kisiId);
  if (!k || k.hesapsiz) return false;
  if (ayar.hesapYoneticisi !== undefined && !ben.hesapYoneticisi) return false;
  if (ayar.pasif !== undefined && !(ben.hesapYoneticisi || (hesapYetkisi(ben, "hesapAcKapa") && !k.hesapYoneticisi))) return false;
  kaydet({ ...d, kisiler: d.kisiler.map((x) => (x.id === kisiId ? { ...x, ...ayar } : x)) });
  return true;
};

/* Seçmeli hesap yetkileri: yalnız tam yönetici verir, kendisininkine dokunmaz. */
export const kisiYetkileri = (ben: Kisi, kisiId: string, yetkiler: HesapYetkisi[]) => {
  if (!GERCEK || !ben.hesapYoneticisi || kisiId === ben.id) return false;
  const d = getir();
  const k = d.kisiler.find((x) => x.id === kisiId);
  if (!k || k.hesapsiz) return false;
  const temiz = [...new Set(yetkiler)];
  kaydet({
    ...d,
    kisiler: d.kisiler.map((x) => {
      if (x.id !== kisiId) return x;
      const { yetkiler: _, ...kalan } = x;
      return temiz.length ? { ...kalan, yetkiler: temiz } : kalan;
    }),
  });
  return true;
};

/*
 * Pozisyon (birim, görev, rol) ve ad değişince hesap yöneticisi (ya da
 * kisiDuzenle yetkisi olan) düzeltiyor; kendi kaydı da dahil (kurucu ilk
 * girişte varsayılan pozisyonla açılıyor). Kayıt bağlantısıyla gelen kişinin
 * girdiklerine yönetici böyle bakıyor; kaydedince "kontrol bekliyor"
 * kalkıyor. Hesap alanları (pasif, yöneticilik, yetkiler) burada değişmiyor.
 */
export const kisiPozisyonu = (ben: Kisi, kisiId: string, p: { birim: BirimId; gorev: GorevId; ad?: Yazi }) => {
  // Demoda hesap yetkisi yalnız örnek yöneticide; tayini Organizasyon'da o deniyor.
  if (!hesapYetkisi(ben, "kisiDuzenle")) return false;
  const d = getir();
  const eski = d.kisiler.find((k) => k.id === kisiId);
  if (!eski) return false;
  let yeni: Durum = {
    ...d,
    kisiler: d.kisiler.map((k) => {
      if (k.id !== kisiId) return k;
      const { kontrolBekliyor: _, ...kalan } = k;
      // Dış muhabirde ünvan seçilmiyor, şehirden geliyor.
      const yeniK = yerUnvaniUygula({ ...kalan, birim: p.birim, gorev: p.gorev, ...(p.ad ? { ad: p.ad } : {}) });
      return { ...yeniK, rol: unvandanRol(yeniK.gorev, k) };
    }),
  };
  const sonra = yeni.kisiler.find((k) => k.id === kisiId)!;
  // Birim ya da ünvan değiştiyse tayin: geçmişte kalsın, kişiye de bildirim düşsün.
  if (eski.birim !== sonra.birim || eski.gorev !== sonra.gorev)
    yeni = hareketYaz(yeni, { kisiId: ben.id, tip: "kisiTayinEdildi", veri: { ad: yaz(eski.ad), kime: kisiId, birim: sonra.birim, gorev: sonra.gorev, eskiBirim: eski.birim, eskiGorev: eski.gorev } });
  kaydet(yeni);
  return true;
};

/**
 * Kişinin e-postası. Hesapsızda (ve demoda) doğrudan değişiyor. Etkin
 * hesapta giriş adresi Firebase'de, yönetici onu değiştiremiyor: yeni
 * adres "yeniEposta" olarak işaretleniyor, o adrese aktivasyon daveti
 * (ekran gönderiyor) gidiyor; kişi etkinleşince kaydı yeni hesaba geçiyor.
 * Şimdiki adres yazılırsa bekleyen değişiklik kalkıyor.
 */
export const kisiEpostasi = (ben: Kisi, kisiId: string, eposta: string): "degisti" | "aktivasyon" | "geriAlindi" | false => {
  const d = getir();
  const k = d.kisiler.find((x) => x.id === kisiId);
  const adres = eposta.trim().toLowerCase();
  if (!k || !epostaDegistirebilir(ben, k)) return false;
  const dogrudan = !GERCEK || !!k.hesapsiz;
  if (adres && d.kisiler.some((x) => x.id !== kisiId && (x.eposta ?? "").toLowerCase() === adres)) return false;
  const sonuc = dogrudan ? "degisti" : adres === (k.eposta ?? "").toLowerCase() ? "geriAlindi" : "aktivasyon";
  if (!dogrudan && !adres) return false;
  kaydet({
    ...d,
    kisiler: d.kisiler.map((x) => {
      if (x.id !== kisiId) return x;
      if (dogrudan) return { ...x, eposta: adres };
      const { yeniEposta: _, ...kalan } = x;
      return sonuc === "geriAlindi" ? kalan : { ...kalan, yeniEposta: adres };
    }),
  });
  return sonuc;
};

/* --- Kurumun yapısı (yapi.ts): taslak, yayın, sürüme dönüş; yalnız tam yönetici --- */

/** Yöneticinin taslağı; yoksa yayındaki yapının kopyası (henüz kaydedilmemiş). */
export const yapiTaslagi = (d: Durum, ben: Kisi): Yapi => d.yapiTaslaklari?.[ben.id] ?? guncelYapi(d);

/**
 * Taslağı değiştiriyor. Yayındaki yapıya dokunmuyor: yönetici birkaç
 * değişikliği birlikte görüp tek seferde yayınlıyor, yarım düzen kimsenin
 * işini bozmuyor. Değişiklik yayındakine dönerse taslak kalkıyor.
 */
export const yapiTaslagiDegistir = (ben: Kisi, f: (y: Yapi) => Yapi) => {
  if (!yapiDuzenleyebilir(ben)) return false;
  const d = getir();
  const yeni = f(yapiTaslagi(d, ben));
  const { [ben.id]: _, ...kalan } = d.yapiTaslaklari ?? {};
  kaydet({ ...d, yapiTaslaklari: ayniYapi(yeni, guncelYapi(d)) ? kalan : { ...kalan, [ben.id]: yeni } });
  return true;
};

export const yapiTaslaginiAt = (ben: Kisi) => {
  const d = getir();
  if (!yapiDuzenleyebilir(ben) || !d.yapiTaslaklari?.[ben.id]) return false;
  const { [ben.id]: _, ...kalan } = d.yapiTaslaklari ?? {};
  kaydet({ ...d, yapiTaslaklari: kalan });
  return true;
};

/**
 * Taslağı yeni sürüm olarak yayınlıyor. Eski sürümler kalıyor: üretimdeki
 * paket girdiği sürümün akışıyla bitiyor (Paket.akis), yönetici de istediği
 * sürüme geri dönebiliyor.
 */
export const yapiYayinla = (ben: Kisi, not = "") => {
  const d = getir();
  const taslak = d.yapiTaslaklari?.[ben.id];
  if (!yapiDuzenleyebilir(ben) || !taslak) return false;
  const surum = Math.max(0, ...d.yapilar.map((y) => y.surum)) + 1;
  const yayin: Yapi = { ...taslak, surum, id: kimlik("y"), zaman: simdi(), yayinlayan: ben.id, ...(not.trim() ? { not: not.trim() } : { not: undefined }) };
  const { [ben.id]: _, ...kalan } = d.yapiTaslaklari ?? {};
  kaydet(hareketYaz({ ...d, yapilar: [...d.yapilar, yayin], yapiTaslaklari: kalan }, { kisiId: ben.id, tip: "yapiYayinlandi", veri: { sayi: String(surum) } }));
  return true;
};

/*
 * Sistemin açılış işi: dış muhabirin sistemin verdiği ünvanı şehrine uymuyorsa
 * (eski ülke ünvanı, genel "Muhabir", şehri sonradan değişmiş) "<Şehir>
 * muhabiri"ne geçiyor. Ünvanın adı şehirden türediği için yapı yayınlamak
 * gerekmiyor; yalnız değişen kişi yazılıyor.
 */
export const muhabirUnvanlariniEsitle = () => {
  const d = getir();
  const y = guncelYapi(d);
  let degisti = false;
  const kisiler = d.kisiler.map((k) => {
    const yeni = yerUnvaniUygula(k, y);
    if (yeni !== k) degisti = true;
    return yeni;
  });
  if (degisti) kaydet({ ...d, kisiler });
};

/** Ünvanı sistemin verdiği (genel ya da eski yer ünvanı) ve olması gerekenden farklı dış muhabirler; elle verilmiş ünvana dokunulmuyor. */
export const ulkeUnvaniBekleyenler = (d: Durum): Kisi[] => {
  const y = guncelYapi(d);
  return d.kisiler.filter((k) => disMuhabirMi(k, y) && otomatikMuhabirUnvaniMi(k.gorev) && k.gorev !== muhabirYerUnvani(k).id);
};

/**
 * Dış muhabirlere şehrinden ünvan ("Gazze muhabiri"). Eksik ünvanlar
 * kişinin birimine eklenip yeni sürüm olarak yayınlanıyor, artık kimsede
 * kalmayan yer ünvanı birimden çıkıyor; kişiler aynı yazışta geçiyor, kimse
 * yayında olmayan ünvanla kalmasın. Ünvan birim değil, çünkü yetki ve
 * ekranlar birimin "muhabir" olmasına bakıyor. Yöneticinin açık taslağına
 * da aynı değişiklik uygulanıyor, yayınlayınca geri gitmesin.
 */
export const muhabirlereUlkeUnvaniVer = (ben: Kisi) => {
  if (!yapiDuzenleyebilir(ben)) return 0;
  const d = getir();
  const yayinda = guncelYapi(d);
  const adaylar = ulkeUnvaniBekleyenler(d);
  if (!adaylar.length) return 0;
  const hedef = new Map(adaylar.map((k) => [k.id, muhabirYerUnvani(k)]));
  const kisiler = d.kisiler.map((k) => (hedef.has(k.id) ? { ...k, gorev: hedef.get(k.id)!.id } : k));
  const sirali = [...adaylar].sort((a, b) => yaz(hedef.get(a.id)!.ad!, "tr").localeCompare(yaz(hedef.get(b.id)!.ad!, "tr"), "tr"));
  const kullanilan = new Set(kisiler.map((k) => k.gorev));
  const uygula = (y: Yapi) => {
    const eklenmis = sirali.reduce((y2, k) => {
      const u = hedef.get(k.id)!;
      return birimeUnvanEkle(y2, k.birim, y2.unvanlar.some((x) => x.id === u.id) ? u.id : u);
    }, y);
    // Eski yer ünvanı kimsede kalmadıysa listede durmasın (genel "Muhabir" yerleşik, kalıyor).
    return eklenmis.birimler.reduce(
      (y2, b) => birimUnvanlari(b.id, y2).filter((u) => u.startsWith("muhabir-") && !kullanilan.has(u)).reduce((y3, u) => birimdenUnvanCikar(y3, b.id, u), y2),
      eklenmis,
    );
  };
  const yeniYapi = uygula(yayinda);
  const surum = Math.max(0, ...d.yapilar.map((y) => y.surum)) + 1;
  const yapilar = ayniYapi(yeniYapi, yayinda)
    ? d.yapilar
    : [...d.yapilar, { ...yeniYapi, surum, id: kimlik("y"), zaman: simdi(), yayinlayan: ben.id, not: metin("orgUlkeUnvanlari", "tr") }];
  const taslak = d.yapiTaslaklari?.[ben.id];
  let yeni: Durum = { ...d, yapilar, kisiler, ...(taslak ? { yapiTaslaklari: { ...d.yapiTaslaklari, [ben.id]: uygula(taslak) } } : {}) };
  if (yapilar !== d.yapilar) yeni = hareketYaz(yeni, { kisiId: ben.id, tip: "yapiYayinlandi", veri: { sayi: String(surum) } });
  kaydet(yeni);
  return adaylar.length;
};

/** Eski sürümü taslağa alıyor; yönetici bakıp yayınlayınca yeni sürüm olarak geri geliyor. */
export const yapiSurumunuTaslagaAl = (ben: Kisi, surum: number) => {
  const d = getir();
  const eski = surum === 0 ? varsayilanYapi() : d.yapilar.find((y) => y.surum === surum);
  if (!eski) return false;
  return yapiTaslagiDegistir(ben, () => eski);
};

/* Kişiye bağlı haritadan kişinin anahtarları çıkıyor; değişmeyen harita aynı nesne kalsın (fark.ts). */
const anahtarlariAt = <T>(h: Record<string, T> | undefined, at: (k: string) => boolean) =>
  h && Object.keys(h).some(at) ? Object.fromEntries(Object.entries(h).filter(([k]) => !at(k))) : h;

/**
 * Kişiyi silmek: tam yönetici ya da kişi silme yetkisi olan (tam yöneticiyi
 * değil). Kendini silemiyor, sistem yöneticisiz kalmasın. Açık planlarda
 * (taslak, toplantıda) ekipten ve başlık muhabirlerinden çıkıyor; geçmiş
 * kayıtlar (paket, hareket, onaylı plan) kimliği tutuyor, geçmiş
 * değiştirilmiyor. Kişinin görünüm tercihleri de gidiyor. Gerçek kipte
 * Firebase'deki giriş hesabı kalır ama kişi kaydı olmadan giremez.
 */
export const kisiSil = (ben: Kisi, kisiId: string) => {
  if (kisiId === ben.id) return false;
  const d = getir();
  const k = d.kisiler.find((x) => x.id === kisiId);
  if (!k || !(ben.hesapYoneticisi || (hesapYetkisi(ben, "kisiSil") && !k.hesapYoneticisi))) return false;
  const planlar = d.planlar.map((p) => {
    if (p.durum !== "taslak" && p.durum !== "toplantida") return p;
    const ekipte = p.ekip.some((e) => e.kisiId === kisiId);
    const baslikta = p.basliklar.some((b) => b.muhabirler.some((m) => m.kisiId === kisiId));
    if (!ekipte && !baslikta) return p;
    return {
      ...p,
      ekip: ekipte ? p.ekip.filter((e) => e.kisiId !== kisiId) : p.ekip,
      basliklar: baslikta ? p.basliklar.map((b) => (b.muhabirler.some((m) => m.kisiId === kisiId) ? { ...b, muhabirler: b.muhabirler.filter((m) => m.kisiId !== kisiId) } : b)) : p.basliklar,
    };
  });
  const kendi = (x: string) => x === kisiId;
  const ad = typeof k.ad === "string" ? k.ad : k.ad.ar || k.ad.tr;
  kaydet(
    hareketYaz(
      {
        ...d,
        kisiler: d.kisiler.filter((x) => x.id !== kisiId),
        planlar: planlar.some((p, i) => p !== d.planlar[i]) ? planlar : d.planlar,
        okundu: anahtarlariAt(d.okundu, kendi) ?? {},
        anaSayfa: anahtarlariAt(d.anaSayfa, (x) => x.startsWith(`${kisiId}:`)),
        oneriGorunumu: anahtarlariAt(d.oneriGorunumu, kendi),
        ortamlar: anahtarlariAt(d.ortamlar, kendi),
        kisayollar: anahtarlariAt(d.kisayollar, kendi),
      },
      { kisiId: ben.id, tip: "kisiSilindi", veri: { ad } },
    ),
  );
  return true;
};

/**
 * Pilot: sistemi kullanmayan personel yalnız adıyla kayıtta. Her seçimde
 * (muhabir, ekip, plan satırı) görünüyor, giriş yapamıyor; işini Planlama
 * onun adına görüyor. Yetkisiz: rolü personel.
 */
export const hesapsizKisiEkle = (ben: Kisi, k: { ad: Yazi; birim: BirimId; gorev: GorevId; eposta?: string; telefon?: string; sehir?: Sehir }) => {
  if (!GERCEK || !hesapYetkisi(ben, "hesapsizKisi")) return null;
  const d = getir();
  const yeni: Kisi = {
    ...yeniKisi({ id: kimlik("kh"), ad: k.ad, eposta: (k.eposta ?? "").trim().toLowerCase(), birim: k.birim, gorev: k.gorev, rol: "personel", hesapYoneticisi: false }),
    ...(k.telefon ? { telefon: k.telefon.trim() } : {}),
    ...(k.sehir ? { sehir: k.sehir } : {}),
    hesapsiz: true,
  };
  kaydet({ ...d, kisiler: [...d.kisiler, yeni] });
  return yeni.id;
};

/*
 * Kurumun muhabir listesi (iceAktar.ts) hesapsız muhabir olarak, tek
 * yazışta. Zaten kayıtlı olan (aynı e-posta ya da aynı Arapça ad) atlanıyor:
 * liste ikinci kez yüklenince kişi çoğalmasın. Hepsi hesapsız; yönetici
 * zamanla "Hesaba bağla" ile davet edip etkinleştiriyor.
 */
export const muhabirleriIceAktar = (ben: Kisi, taslaklar: MuhabirTaslagi[]) => {
  if (!GERCEK || !hesapYetkisi(ben, "hesapsizKisi")) return null;
  const d = getir();
  const epostalar = new Set(d.kisiler.flatMap((k) => [k.eposta, k.kisiselEposta ?? ""]).filter(Boolean).map((e) => e.toLowerCase()));
  const adlar = new Set(d.kisiler.map((k) => (typeof k.ad === "string" ? k.ad : k.ad.ar).trim()));
  const eklenen: Kisi[] = [];
  let atlanan = 0;
  taslaklar.forEach((t, i) => {
    const var_ = (t.eposta && epostalar.has(t.eposta)) || (t.kisiselEposta && epostalar.has(t.kisiselEposta)) || adlar.has(t.adAr.trim());
    if (var_) {
      atlanan++;
      return;
    }
    const k: Kisi = {
      ...yeniKisi({ id: `${kimlik("kh")}${i}`, ad: { tr: t.adLatin || t.adAr, ar: t.adAr, en: t.adLatin || t.adAr }, eposta: t.eposta, birim: "muhabir", gorev: sehirMuhabirUnvaniId(t.sehir), rol: "personel", hesapYoneticisi: false }),
      sehir: t.sehir,
      ...(t.telefon ? { telefon: t.telefon } : {}),
      ...(t.kisaltma ? { kisaltma: t.kisaltma } : {}),
      ...(t.kisiselEposta ? { kisiselEposta: t.kisiselEposta } : {}),
      ...(t.irtibat ? { irtibat: t.irtibat } : {}),
      ...(t.calisma ? { calisma: t.calisma } : {}),
      hesapsiz: true,
    };
    eklenen.push(k);
    if (t.eposta) epostalar.add(t.eposta);
    adlar.add(t.adAr.trim());
  });
  if (eklenen.length) kaydet({ ...d, kisiler: [...d.kisiler, ...eklenen] });
  return { eklenen: eklenen.length, atlanan };
};

/*
 * Kayıttaki her değerde eski kimliği yenisiyle değiştiriyor: kimlik bir
 * değerin tamamı olarak geçiyor (muhabirId, ekip, hareketin kişisi…),
 * JSON'da tırnaklı aranınca başka metne değmiyor. Değişmeyen öğenin nesnesi
 * aynı kalıyor; fark yalnız değişenleri yazsın.
 */
const kimlikDegistir = <T>(x: T, eski: string, yeni: string): T => {
  const j = JSON.stringify(x);
  const ara = JSON.stringify(eski);
  return j.includes(ara) ? (JSON.parse(j.split(ara).join(JSON.stringify(yeni))) as T) : x;
};

/**
 * Hesapsız kişi hesaba bağlandı ya da etkin hesabın e-postası değişti
 * (davet `kisiId` taşıyordu): yeni hesap
 * etkinleşince eski kaydın bilgileri yeni kişiye geçiyor, kayıtlardaki eski
 * kimlik yenisiyle değişiyor ve eski kişi kaydı siliniyor. Kişi kendisi
 * yapıyor (gercekKipiBaslat, kayıt gelince); kurallar eski kaydı yalnız
 * `oncekiKimlik`'i onu gösteren kişiye sildiriyor. Bir kez çalışır: eski
 * kayıt kalmayınca yapacak iş yok.
 */
/* Eski kimliği kişiler dışındaki bütün kayıtlarda ve kişiye bağlı haritaların anahtarlarında yenisiyle değiştirir. */
const kimligiTasi = (d: Durum, eski: string, yeniId: string): Durum => {
  const yeni: Durum = { ...d };
  for (const [alan, deger] of Object.entries(d) as [keyof Durum, unknown][]) {
    if (alan === "kisiler") continue;
    if (Array.isArray(deger)) {
      let degisti = false;
      const liste = deger.map((o) => {
        const n = kimlikDegistir(o, eski, yeniId);
        if (n !== o) degisti = true;
        return n;
      });
      if (degisti) (yeni as unknown as Record<string, unknown>)[alan] = liste;
    } else if (deger && typeof deger === "object") {
      // Kişiye bağlı haritalar: anahtar kişi ya da "kişi:…".
      const m: Record<string, unknown> = {};
      let degisti = false;
      for (const [k, v] of Object.entries(deger)) {
        const yk = k === eski ? yeniId : k.startsWith(`${eski}:`) ? yeniId + k.slice(eski.length) : k;
        const yv = kimlikDegistir(v, eski, yeniId);
        if (yk !== k || yv !== v) degisti = true;
        m[yk] = yv;
      }
      if (degisti) (yeni as unknown as Record<string, unknown>)[alan] = m;
    }
  }
  return yeni;
};

export const hesabaGecir = (benId: string) => {
  if (!GERCEK) return false;
  const d = getir();
  const ben = d.kisiler.find((k) => k.id === benId);
  const eski = ben?.oncekiKimlik;
  // Eski kayıt hesapsız kişi ya da e-postası bu hesabın adresine değişen hesap (kural da aynısını soruyor).
  const eskiKisi = eski ? d.kisiler.find((k) => k.id === eski && (k.hesapsiz || (!!k.yeniEposta && k.yeniEposta === ben?.eposta?.toLowerCase()))) : undefined;
  if (!ben || !eski || !eskiKisi) return false;
  const { hesapsiz: _, kontrolBekliyor: __, yeniEposta: ___, pasif: ____, ...profil } = eskiKisi;
  // Profil (şehir, telefon, diller, kısaltma…) eski kayıttan; hesap alanları yeni hesaptan.
  const birlesik: Kisi = { ...profil, id: ben.id, ad: ben.ad, birim: ben.birim, gorev: ben.gorev, rol: ben.rol, eposta: ben.eposta, oncekiKimlik: eski, ...(ben.hesapYoneticisi ? { hesapYoneticisi: true } : {}), ...(ben.yetkiler ? { yetkiler: ben.yetkiler } : {}) };
  const yeni = kimligiTasi(d, eski, ben.id);
  yeni.kisiler = d.kisiler.filter((k) => k.id !== eski).map((k) => (k.id === ben.id ? birlesik : kimlikDegistir(k, eski, ben.id)));
  kaydet(yeni);
  return true;
};

/*
 * Kısıtlı kişi (muhabir) hesaba bağlanınca yalnız gördüğü kayıtları, yani
 * kendi işini, yeni kimliğe taşıyor: eski kaydını ve başkalarının
 * kayıtlarını göremiyor. Gerisini ve eski kişi kaydının silinmesini tam
 * yöneticinin açılışı tamamlıyor (bekleyenGecisleriTamamla).
 */
export const kendiKayitlariniTasi = (benId: string) => {
  if (!GERCEK) return false;
  const d = getir();
  const eski = d.kisiler.find((k) => k.id === benId)?.oncekiKimlik;
  if (!eski) return false;
  const yeni = kimligiTasi(d, eski, benId);
  if ((Object.keys(d) as (keyof Durum)[]).every((k) => yeni[k] === d[k])) return false;
  kaydet(yeni);
  return true;
};

/** Tam yönetici: hesaba bağlanmış ama eski kaydı duran kişilerin geçişini tamamlıyor (muhabir kendisi yapamıyor). */
export const bekleyenGecisleriTamamla = () => {
  if (!GERCEK) return 0;
  let n = 0;
  for (const k of getir().kisiler) if (k.oncekiKimlik && getir().kisiler.some((x) => x.id === k.oncekiKimlik) && hesabaGecir(k.id)) n++;
  return n;
};

/* --- Workspace --- */

/*
 * Workspace kişinin kendi çalışma düzeni, ana sayfa düzeni gibi: hareket
 * yazılmıyor, herkes yalnız kendi workspace'lerini değiştiriyor (kayıt
 * kişinin kimliği altında, başka kişininkine yol yok).
 */
const ortamlariYaz = (d: Durum, ben: Kisi, f: (l: Ortam[]) => Ortam[]) =>
  kaydet({ ...d, ortamlar: { ...(d.ortamlar ?? {}), [ben.id]: f(kisininOrtamlari(d, ben.id)) } });

const ortamGuncelle = (ben: Kisi, id: string, f: (o: Ortam) => Ortam | null) => {
  const d = getir();
  const o = kisininOrtamlari(d, ben.id).find((x) => x.id === id);
  const yeni = o && f(o);
  if (!yeni) return false;
  ortamlariYaz(d, ben, (l) => l.map((x) => (x.id === id ? yeni : x)));
  return true;
};

/**
 * Seçim sayfasında seçilen sayfalarla yeni workspace; kimliği döner.
 * Bölmeler tek yazışta kuruluyor: her bölme ayrı yazılsa açık çerçeveler
 * kaydı birkaç kez yeniden okurdu. Boş workspace yok; seçilecek sayfa
 * yoksa, sayfa görünmüyorsa ya da sınırdaysa null.
 */
export const ortamOlustur = (ben: Kisi, yollar: string[], duzen?: OrtamDuzeni): string | null => {
  const d = getir();
  const liste = kisininOrtamlari(d, ben.id);
  const gecerli = [...new Set(yollar.map(yolTemizle))].filter((y) => bolmeyeGirer(ben, y)).slice(0, BOLME_EN_COK);
  if (!sayfaGorebilir(ben, "ortam") || liste.length >= ORTAM_EN_COK || gecerli.length === 0) return null;
  const id = kimlik("or");
  const bolmeler = gecerli.map((yol) => ({ id: kimlik("bo"), yol }));
  const secilen = duzen && ORTAM_DUZENLERI.includes(duzen) ? duzen : varsayilanDuzen(bolmeler.length);
  ortamlariYaz(d, ben, (l) => [...l, { id, duzen: secilen, bolmeler }]);
  return id;
};

/** Kapatılan workspace'i aynı yerine geri koyar (bildirimdeki "Geri al"). */
export const ortamGeriAc = (ben: Kisi, ortam: Ortam, sira: number) => {
  const d = getir();
  const liste = kisininOrtamlari(d, ben.id);
  if (liste.some((o) => o.id === ortam.id) || liste.length >= ORTAM_EN_COK) return false;
  ortamlariYaz(d, ben, (l) => {
    const yeni = [...l];
    yeni.splice(Math.min(Math.max(sira, 0), yeni.length), 0, ortam);
    return yeni;
  });
  return true;
};

export const ortamSil = (ben: Kisi, id: string) => {
  const d = getir();
  if (!kisininOrtamlari(d, ben.id).some((o) => o.id === id)) return false;
  ortamlariYaz(d, ben, (l) => l.filter((o) => o.id !== id));
  return true;
};

export const ortamDuzeni = (ben: Kisi, id: string, duzen: OrtamDuzeni) =>
  ORTAM_DUZENLERI.includes(duzen) && ortamGuncelle(ben, id, (o) => ({ ...o, duzen }));

/**
 * Bölmeye sayfa ekler; kimliği döner. "Yanına sayfa aç" yeni bölmeyi
 * basılan bölmenin hemen arkasına koyuyor (`sonra`), yoksa sona. Sınır ve
 * sayfa izni düğmede olduğu gibi burada da soruluyor.
 */
export const bolmeEkle = (ben: Kisi, ortamId: string, yol: string, sonra?: string): string | null => {
  if (!bolmeyeGirer(ben, yol)) return null;
  const id = kimlik("bo");
  const tamam = ortamGuncelle(ben, ortamId, (o) => {
    if (o.bolmeler.length >= BOLME_EN_COK) return null;
    const yeni = [...o.bolmeler];
    const i = sonra ? yeni.findIndex((b) => b.id === sonra) : -1;
    yeni.splice(i < 0 ? yeni.length : i + 1, 0, { id, yol: yolTemizle(yol) });
    return { ...o, bolmeler: yeni };
  });
  return tamam ? id : null;
};

/** Bölmede başka sayfa; boyutu ve yeri aynı kalıyor. */
export const bolmeDegistir = (ben: Kisi, ortamId: string, bolmeId: string, yol: string) =>
  bolmeyeGirer(ben, yol) &&
  ortamGuncelle(ben, ortamId, (o) =>
    o.bolmeler.some((b) => b.id === bolmeId) ? { ...o, bolmeler: o.bolmeler.map((b) => (b.id === bolmeId ? { ...b, yol: yolTemizle(yol) } : b)) } : null,
  );

export const bolmeKapat = (ben: Kisi, ortamId: string, bolmeId: string) =>
  ortamGuncelle(ben, ortamId, (o) => (o.bolmeler.some((b) => b.id === bolmeId) ? { ...o, bolmeler: o.bolmeler.filter((b) => b.id !== bolmeId) } : null));

/** Bölmeyi komşusuyla yer değiştirir (ekrandaki sıra). */
export const bolmeTasi = (ben: Kisi, ortamId: string, bolmeId: string, yon: -1 | 1) =>
  ortamGuncelle(ben, ortamId, (o) => {
    const i = o.bolmeler.findIndex((b) => b.id === bolmeId);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= o.bolmeler.length) return null;
    const yeni = [...o.bolmeler];
    [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
    return { ...o, bolmeler: yeni };
  });

/* Payların uç değerleri: sürüklemede piksel sınırı zaten var, bu bozuk değere karşı. */
const PAY_EN_AZ = 0.05;
const PAY_EN_COK = 20;

/** Ayraçtan gelen boyutlar (bölme → fr); geçersiz değer yazılmıyor. */
export const bolmePaylari = (ben: Kisi, ortamId: string, eksen: BolmeEkseni, paylar: Record<string, number>) =>
  ortamGuncelle(ben, ortamId, (o) => ({
    ...o,
    bolmeler: o.bolmeler.map((b) => {
      const p = paylar[b.id];
      if (p === undefined || !Number.isFinite(p)) return b;
      return { ...b, pay: { ...b.pay, [eksen]: Math.min(Math.max(p, PAY_EN_AZ), PAY_EN_COK) } };
    }),
  }));

/* --- Planlama takvimi --- */

const faaliyetGuncelle = (d: Durum, id: string, f: (x: Faaliyet) => Faaliyet): Durum => ({
  ...d,
  faaliyetler: d.faaliyetler.map((x) => (x.id === id ? { ...f(x), guncelleme: simdi() } : x)),
});

export type FaaliyetGirdisi = Omit<Faaliyet, "id" | "baglantilar" | "olusturan" | "olusturma" | "guncelleme"> & { id?: string };

const bosOlmasin = (x?: string) => x?.trim() || undefined;

/**
 * Faaliyeti ekler ya da düzeltir; bağlantılar ve kim açtığı düzeltmede
 * korunuyor. Bitiş boşsa tek günlük; başlangıçtan önce olamaz. Bölge
 * seçilmediyse ülkeden, ülke de yoksa küresel.
 */
export const faaliyetKaydet = (ben: Kisi, g: FaaliyetGirdisi): string | null => {
  if (!yapabilir(ben, "takvimDuzenle")) return null;
  const baslik = g.baslik.trim();
  const bitis = g.bitis || g.baslangic;
  if (!baslik || !g.baslangic || bitis < g.baslangic) return null;
  let d = getir();
  const temiz = {
    ...g,
    baslik,
    bitis,
    bolge: g.bolge ?? (g.ulke ? ULKE_BOLGESI[g.ulke] : "kuresel"),
    sehir: bosOlmasin(g.sehir),
    notlar: bosOlmasin(g.notlar),
    saat: g.saat || undefined,
    bitisSaati: g.bitisSaati || undefined,
    muhabirId: g.muhabirId || undefined,
    birim: g.birim || undefined,
    tekrar: g.tekrar ? { siklik: g.tekrar.siklik, bitis: g.tekrar.bitis && g.tekrar.bitis >= g.baslangic ? g.tekrar.bitis : undefined } : undefined,
  };
  if (g.id) {
    if (!faaliyetBul(d, g.id)) return null;
    kaydet(faaliyetGuncelle(d, g.id, (x) => ({ ...x, ...temiz, id: x.id })));
    return g.id;
  }
  const id = kimlik("f");
  const z = simdi();
  d = { ...d, faaliyetler: [...d.faaliyetler, { ...temiz, id, baglantilar: [], olusturan: ben.id, olusturma: z, guncelleme: z }] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "faaliyetEklendi", veri: { faaliyetId: id, tarih: g.baslangic } }));
  return id;
};

/* Planlarda doğan kayıtlar (gelişme, kalem…) yerinde kalıyor: plana alınan iş artık planın. */
export const faaliyetSil = (ben: Kisi, id: string) => {
  const d = getir();
  if (!yapabilir(ben, "takvimDuzenle") || !faaliyetBul(d, id)) return false;
  kaydet({ ...d, faaliyetler: d.faaliyetler.filter((f) => f.id !== id) });
  return true;
};

/** Ayrıntıdaki hızlı değişim: öncelik, potansiyel, durum. */
export const faaliyetDegistir = (ben: Kisi, id: string, g: { oncelik?: Oncelik; potansiyel?: Potansiyel; durum?: FaaliyetDurum }) => {
  const d = getir();
  if (!yapabilir(ben, "takvimDuzenle") || !faaliyetBul(d, id)) return false;
  kaydet(faaliyetGuncelle(d, id, (x) => ({ ...x, ...g })));
  return true;
};

/*
 * Sürükle-bırak. Taşımada süre korunuyor; kenardan sürüklemede yalnız o
 * uç değişiyor, bitiş başlangıcın önüne geçemiyor. Tekrarlayan faaliyet
 * sürüklenmiyor: bir tekrarı taşımak bütün seriyi mi kaydırır belirsiz,
 * tarihi formdan değişiyor.
 */
export const faaliyetTasi = (ben: Kisi, id: string, baslangic: string) => {
  const d = getir();
  const f = faaliyetBul(d, id);
  if (!f || f.tekrar || !yapabilir(ben, "takvimDuzenle") || f.baslangic === baslangic) return false;
  const sure = gunFarki(f.baslangic, f.bitis);
  kaydet(faaliyetGuncelle(d, id, (x) => ({ ...x, baslangic, bitis: gunEkle(baslangic, sure) })));
  return true;
};

export const faaliyetUcu = (ben: Kisi, id: string, uc: "baslangic" | "bitis", tarih: string) => {
  const d = getir();
  const f = faaliyetBul(d, id);
  if (!f || f.tekrar || !yapabilir(ben, "takvimDuzenle") || f[uc] === tarih) return false;
  const yeni = { ...f, [uc]: tarih };
  if (yeni.bitis < yeni.baslangic) return false;
  kaydet(faaliyetGuncelle(d, id, () => yeni));
  return true;
};

/*
 * Plana alma editörün kararı: takvim kendiliğinden plana dönüşmüyor.
 * Bağlantı faaliyette tutuluyor (plan tarafı değişmiyor); ilk bağlantıda
 * taslak ya da takipteki faaliyet "plana alındı" oluyor. Tekrarlayanın
 * durumu bütün seriyi anlattığı için değişmiyor; tekrarın kendisi
 * bağlantısından "plana alındı" görünüyor (takvim.ts → olusumDurumu).
 */
const baglantiYaz = (d: Durum, ben: Kisi, f: Faaliyet, b: Omit<FaaliyetBaglantisi, "kisiId" | "zaman">): Durum => {
  const durum = !f.tekrar && (f.durum === "taslak" || f.durum === "takipte") ? "planaAlindi" : f.durum;
  d = faaliyetGuncelle(d, f.id, (x) => ({ ...x, durum, baglantilar: [...x.baglantilar, { ...b, kisiId: ben.id, zaman: simdi() }] }));
  return hareketYaz(d, {
    kisiId: ben.id,
    tip: "faaliyetPlanaAlindi",
    planId: b.tur === "nextday" ? b.planId : undefined,
    haftaId: b.tur === "haftalik" ? b.planId : undefined,
    veri: { faaliyetId: f.id, tur: b.tur, tarih: b.tarih },
  });
};

export interface NextDayAktarimi {
  /** Hangi tekrar: tekrarın başladığı gün. */
  tarih: string;
  planId: string;
  planBaslikId?: string;
  /** Plana yeni başlık açılacaksa adı; havuzda aynı adda başlık varsa o kullanılıyor. */
  yeniBaslik?: string;
  yer?: string;
  metin: string;
}

/** Next Day'e gelişme olarak: seçilen başlığın altına, yoksa takiplere. */
export const faaliyetNextDayeEkle = (ben: Kisi, id: string, g: NextDayAktarimi): string | null => {
  let d = getir();
  const f = faaliyetBul(d, id);
  const plan = planBul(d, g.planId);
  if (!f || !plan || !planOperasyonDuzenler(ben, plan) || !g.metin.trim()) return null;
  let planBaslikId = g.planBaslikId || undefined;
  const ad = g.yeniBaslik?.trim();
  if (ad) {
    /* Yeni başlık planın içeriği: devirden sonra Newsdesk açamıyor, Planlama da havuz yetkisiyle açıyor. */
    if (!planIcerikDuzenler(ben, plan) || !yapabilir(ben, "baslikYonet")) return null;
    let baslik = d.basliklar.find((b) => b.ad.trim() === ad);
    if (!baslik) {
      baslik = { id: kimlik("b"), ad, ulke: f.ulke, aktif: true };
      d = { ...d, basliklar: [...d.basliklar, baslik] };
    }
    const bid = baslik.id;
    const varolan = plan.basliklar.find((b) => b.baslikId === bid);
    planBaslikId = varolan?.id ?? kimlik("pb");
    if (!varolan) d = planGuncelle(d, plan.id, (p) => ({ ...p, basliklar: [...p.basliklar, { id: planBaslikId!, baslikId: bid, muhabirler: [] }] }));
  } else if (planBaslikId && !plan.basliklar.some((b) => b.id === planBaslikId)) return null;
  const gelismeId = kimlik("g");
  d = {
    ...d,
    gelismeler: [
      ...d.gelismeler,
      { id: gelismeId, planId: plan.id, planBaslikId, yer: bosOlmasin(g.yer), metin: g.metin.trim(), kaynakTuru: "kurum", kaynakAdi: TAKVIM_KAYNAGI, tarih: simdi() },
    ],
  };
  kaydet(baglantiYaz(d, ben, f, { tur: "nextday", planId: plan.id, kayitId: gelismeId, tarih: g.tarih }));
  return gelismeId;
};

/**
 * Haftalık plana: kalemi plan ekranının formu (KalemFormu) kaydediyor,
 * bağlantı arkasından buradan kuruluyor; kalem yoksa bağlanmıyor.
 */
export const faaliyetHaftalikaBagla = (ben: Kisi, id: string, haftaId: string, kalemId: string, tarih: string) => {
  const d = getir();
  const f = faaliyetBul(d, id);
  const h = haftaBul(d, haftaId);
  if (!f || !h || !haftalikDuzenler(ben, h) || !h.kalemler.some((k) => k.id === kalemId)) return false;
  kaydet(baglantiYaz(d, ben, f, { tur: "haftalik", planId: haftaId, kayitId: kalemId, tarih }));
  return true;
};

/** Aylık plana kalem olarak; o ayın planı yoksa açılıyor. Kalem onaysız girer, onay aylık planın işi. */
export const faaliyetAylikaEkle = (ben: Kisi, id: string, tarih: string, tur: IcerikTuru): string | null => {
  let d = getir();
  const f = faaliyetBul(d, id);
  if (!f || !yapabilir(ben, "planDuzenle")) return null;
  const ay = tarih.slice(0, 7);
  let plan = d.aylik.find((a) => a.ay === ay);
  if (!plan) {
    plan = { id: kimlik("ay"), ay, durum: "hazirlik", kalemler: [] } satisfies AylikPlan;
    d = { ...d, aylik: [...d.aylik, plan] };
  }
  const planId = plan.id;
  const kalemId = kimlik("ak");
  d = { ...d, aylik: d.aylik.map((a) => (a.id === planId ? { ...a, kalemler: [...a.kalemler, { id: kalemId, tarih, baslik: f.baslik, tur, ulke: f.ulke, onayli: false }] } : a)) };
  kaydet(baglantiYaz(d, ben, f, { tur: "aylik", planId, kayitId: kalemId, tarih }));
  return planId;
};

/** Özel yayın planına: yeni yayın açılıyor ya da var olan yayına hazırlık maddesi giriyor. */
export const faaliyetOzeleEkle = (ben: Kisi, id: string, tarih: string, ozelId?: string): string | null => {
  let d = getir();
  const f = faaliyetBul(d, id);
  if (!f || !yapabilir(ben, "planDuzenle")) return null;
  if (ozelId) {
    if (!d.ozel.some((o) => o.id === ozelId)) return null;
    const maddeId = kimlik("oz");
    d = { ...d, ozel: d.ozel.map((o) => (o.id === ozelId ? { ...o, hazirlik: [...o.hazirlik, { id: maddeId, metin: f.baslik, tamam: false }] } : o)) };
    kaydet(baglantiYaz(d, ben, f, { tur: "ozel", planId: ozelId, kayitId: maddeId, tarih }));
    return ozelId;
  }
  const yeniId = kimlik("oz");
  d = { ...d, ozel: [...d.ozel, { id: yeniId, ad: f.baslik, tarih, hazirlik: [] }] };
  kaydet(baglantiYaz(d, ben, f, { tur: "ozel", planId: yeniId, tarih }));
  return yeniId;
};

/* --- Geri alma ve geçmiş plandan aktarma --- */

/**
 * Kişinin bu plandaki son düzenlemesini geri alıyor (geriAl.ts). Yetki
 * bugünkü yetki: plan o arada kilitlendiyse geri alınmıyor. Değişen
 * kayıt başkasınca yeniden değiştirildiyse "degisti": üzerine yazılmıyor.
 */
export const planGeriAl = (ben: Kisi, planId: string): "tamam" | "bos" | "yetkisiz" | "degisti" => {
  const d = getir();
  const plan = planBul(d, planId);
  const hafta = plan ? undefined : haftaBul(d, planId);
  if (plan ? !planOperasyonDuzenler(ben, plan) : !hafta || !yapabilir(ben, "haftalikDuzenle")) return "yetkisiz";
  const adim = sonAdimiAl(ben.id, planId);
  if (!adim) return "bos";
  const yeni = geriUygula(d, adim);
  if (!yeni) return "degisti";
  const iz = plan ? { planId, veri: { tarih: plan.tarih } } : { haftaId: planId, veri: { tarih: hafta!.baslangic } };
  sessizce(() => kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "planGeriAlindi", ...iz })));
  return "tamam";
};

/**
 * Geçmiş planın belgesinden (planAktar.ts) bugünün taslağına: kayıtlar
 * şablondan gelen gibi `onceki` işaretli, planlamacı gözden geçirip
 * "bugün de geçerli" diyor ya da düzenliyor. Başlık havuzda aynı adla
 * varsa o kullanılıyor (havuz ikiye bölünmesin), yoksa açılıyor; başlık
 * açma yetkisi olmayanın yeni başlığı atlanıyor. Plandaki kayıt
 * çoğalmıyor: aynı kişi, aynı başlık bir kez.
 */
export const planIceAktar = (ben: Kisi, planId: string, t: PlanTaslagi, dosya: string): number => {
  const d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return 0;
  const r = taslakUygula(d, ben, plan, t, dosya, true);
  if (!r.sayi) return 0;
  kaydet(hareketYaz(r.d, { kisiId: ben.id, tip: "planIceAktarildi", planId, veri: { tarih: plan.tarih, dosya, sayi: String(r.sayi) } }));
  return r.sayi;
};

/*
 * Taslağı plana yazan ortak parça (tek plan aktarımı ve toplu geçmiş
 * yüklemesi). `isaretle`: açık plana gelen kayıt "gözden geçirilecek"
 * (onceki) işaretli; kapanmış geçmiş planda işaretin anlamı yok.
 */
const taslakUygula = (d: Durum, ben: Kisi, plan: NextDayPlan, t: PlanTaslagi, dosya: string, isaretle: boolean): { d: Durum; sayi: number } => {
  const planId = plan.id;
  const isaret = isaretle ? ({ onceki: true } as const) : {};
  let sayi = 0;
  const ekip = [...plan.ekip];
  for (const e of t.ekip)
    if (!ekip.some((x) => x.kisiId === e.kisiId)) {
      ekip.push({ ...e, ...isaret });
      sayi++;
    }
  const havuz = [...d.basliklar];
  const pbler = plan.basliklar.map((b) => ({ ...b, muhabirler: [...b.muhabirler] }));
  const gelismeler: Gelisme[] = [];
  const gelisme = (g: { yer?: string; metin: string }, planBaslikId?: string): Gelisme => ({
    id: kimlik("g"),
    planId,
    planBaslikId,
    yer: g.yer,
    metin: g.metin,
    kaynakTuru: "kurum",
    kaynakAdi: dosya,
    tarih: simdi(),
    ...isaret,
  });
  // Aynı belge ikinci kez gelince (muhabir listesi sonradan yüklendi) yalnız eksikler eklensin, gelişme çoğalmasın.
  const varMi = (g: { yer?: string; metin: string }, planBaslikId?: string) =>
    d.gelismeler.some((x) => x.planId === planId && x.planBaslikId === planBaslikId && x.metin === g.metin && (x.yer ?? "") === (g.yer ?? ""));
  for (const b of t.basliklar) {
    const ad = arSade(b.ad);
    const bulunan = havuz.filter((x) => arSade(x.ad) === ad).sort((x, y) => Number(y.aktif) - Number(x.aktif))[0];
    let baslikId = bulunan?.id;
    if (!baslikId) {
      if (!yapabilir(ben, "baslikYonet")) continue;
      baslikId = kimlik("b");
      havuz.push({ id: baslikId, ad: b.ad.trim(), aktif: true });
    }
    let pb = pbler.find((x) => x.baslikId === baslikId);
    if (!pb) {
      pb = { id: kimlik("pb"), baslikId, muhabirler: [] };
      pbler.push(pb);
      sayi++;
    }
    for (const m of b.muhabirler)
      if (!pb.muhabirler.some((x) => x.kisiId === m.kisiId)) {
        pb.muhabirler.push({ kisiId: m.kisiId, ...(m.yer && { yer: m.yer }), ...(m.saat && { saat: m.saat }), ...isaret });
        sayi++;
      }
    for (const g of b.gelismeler) if (!varMi(g, pb.id)) gelismeler.push(gelisme(g, pb.id));
  }
  gelismeler.push(...t.takipler.filter((g) => !varMi(g)).map((g) => gelisme(g)));
  const canlilar: CanliYayin[] = t.canlilar.filter((c) => !d.canliYayinlar.some((x) => x.planId === planId && x.konu === c.konu && x.saatGmt === c.saatGmt)).map((c) => ({ id: kimlik("cy"), planId, konu: c.konu, aciklama: c.aciklama, tarih: plan.tarih, saatGmt: c.saatGmt, yer: c.yer, muhabirId: c.muhabirId, notlar: "", ...isaret }));
  sayi += gelismeler.length + canlilar.length;
  if (!sayi) return { d, sayi };
  // Değişmeyen plan nesnesine dokunulmuyor; burada plan her zaman değişiyor.
  const basliklar = pbler.map((b, i) => {
    const eski = plan.basliklar[i];
    return eski && eski.id === b.id && eski.muhabirler.length === b.muhabirler.length ? eski : b;
  });
  d = planGuncelle({ ...d, basliklar: havuz.length === d.basliklar.length ? d.basliklar : havuz }, planId, (p) => ({ ...p, ekip: ekip.length === p.ekip.length ? p.ekip : ekip, basliklar }));
  return { d: { ...d, gelismeler: [...d.gelismeler, ...gelismeler], canliYayinlar: [...d.canliYayinlar, ...canlilar] }, sayi };
};

/*
 * Ekip görevinden kişi kaydının birimi ve görevi: "Ekibe ekle" onu bu
 * görevin listesinde göstersin. Görevin kuralındaki ilk birim ve ilk ünvan
 * (Organizasyon › Plan ekibi); kural boşsa Newsdesk, ünvansız.
 */
const ekipKisisi = (gorev: EkipGoreviId, y: Yapi): { birim: BirimId; gorev: GorevId } => {
  const g = ekipGorevleri(y).find((x) => x.id === gorev);
  const birim = g?.birimler[0] ?? "newsdesk";
  return { birim, gorev: g?.unvanlar[0] ?? unvanListesi(birim, undefined, y)[0] ?? "koordinator" };
};

export interface GecmisYukleme {
  plan: number;
  yeniPlan: number;
  kisi: number;
  kayit: number;
}

/**
 * Geçmiş planları toplu yüklemek (tek seferlik, gerçek kipte): her gün
 * belgenin satırlarıyla geliyor (planAktar.ts → planTaslagi okuyor).
 * Ekipte adı geçip kayıtta olmayan kişi hesapsız kişi olarak açılıyor,
 * "kontrol bekliyor" işaretli: belgede çoğu kez tek adı yazılı, yönetici
 * Kullanıcılar'da tam adını düzeltiyor. O günün planı yoksa açılıyor
 * (geçmiş gün devredilmiş sayılıyor), varsa içine ekleniyor; ikinci
 * yüklemede kişi, başlık ve ekip çoğalmıyor. Muhabir yalnız kayıttakiyle
 * eşleşiyor (muhabir listesi Excel'den geliyor, ad çeşitlemesi çift kayıt
 * açmasın). Gerçek kişi adı demoya girmesin diye yalnız gerçek kipte.
 */
export const gecmisPlanlariYukle = (ben: Kisi, gunler: { tarih: string; satirlar: string[] }[], dosya: string): GecmisYukleme | null => {
  if (!GERCEK || !yapabilir(ben, "planDuzenle") || !hesapYetkisi(ben, "hesapsizKisi")) return null;
  let d = getir();
  const sonuc: GecmisYukleme = { plan: 0, yeniPlan: 0, kisi: 0, kayit: 0 };
  // Önce kişiler: bütün günlerin ekibinde bulunamayanlar, ilk göründükleri görevle bir kez.
  const yeniler = new Map<string, { ad: string; gorev: EkipGoreviId }>();
  for (const g of gunler) for (const e of planTaslagi(g.satirlar, d).yeniEkip) if (!yeniler.has(arSade(e.ad))) yeniler.set(arSade(e.ad), e);
  const kisiler: Kisi[] = [...yeniler.values()].map((e) => ({
    ...yeniKisi({ id: kimlik("kh"), ad: { tr: e.ad, ar: e.ad, en: e.ad }, eposta: "", ...ekipKisisi(e.gorev, guncelYapi(d)), rol: "personel", hesapYoneticisi: false }),
    hesapsiz: true,
    kontrolBekliyor: true,
  }));
  if (kisiler.length) d = { ...d, kisiler: [...d.kisiler, ...kisiler] };
  sonuc.kisi = kisiler.length;
  for (const g of [...gunler].sort((x, y) => x.tarih.localeCompare(y.tarih))) {
    let plan = d.planlar.find((p) => p.tarih === g.tarih);
    const vardi = !!plan;
    if (!plan) {
      plan = { id: gunPlaniKimligi(g.tarih), tarih: g.tarih, durum: g.tarih < bugun() ? "devralindi" : "taslak", ekip: [], gorevlendirmeler: [], hazirPaketler: [], basliklar: [], olusturan: ben.id, olusturma: simdi() };
      d = { ...d, planlar: [plan, ...d.planlar] };
      sonuc.yeniPlan++;
    }
    // Kapanmış plana yazmak yalnız bu yüklemede; açık plana gelen "gözden geçirilecek" işaretli.
    const acik = plan.durum === "taslak" || plan.durum === "toplantida";
    const r = taslakUygula(d, ben, plan, planTaslagi(g.satirlar, d), dosya, vardi && acik);
    d = r.d;
    sonuc.plan++;
    sonuc.kayit += r.sayi;
    d = hareketYaz(d, { kisiId: ben.id, tip: "planIceAktarildi", planId: plan.id, veri: { tarih: g.tarih, dosya, sayi: String(r.sayi) } });
  }
  kaydet(d);
  return sonuc;
};

/** Planın ekip satırında kişinin adının hangi parçası yazılsın: bütün planlamacılar seçiyor, kayıtta kişinin üzerinde. */
export const kisiPlanAdi = (ben: Kisi, kisiId: string, secim: PlanAdi | undefined) => {
  if (!yapabilir(ben, "planDuzenle")) return false;
  const d = getir();
  if (!d.kisiler.some((k) => k.id === kisiId)) return false;
  kaydet({
    ...d,
    kisiler: d.kisiler.map((k) => {
      if (k.id !== kisiId) return k;
      const { planAdi: _, ...kalan } = k;
      return secim ? { ...kalan, planAdi: secim } : kalan;
    }),
  });
  return true;
};

/* --- Muhabire haber önerisi ve önerinin yazışması --- */

export interface MuhabireOneriGirdisi {
  muhabirId: string;
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  ulke: Ulke;
  tur: IcerikTuru;
  bicim?: Bicim;
  sahaGerekli: boolean;
  hedefTarih?: string;
  /** Muhabirin takibinden dönüştürülüyorsa takip; takip kartı öneriyi gösteriyor. */
  takipId?: string;
}

/**
 * Planlama (ya da yöneticinin izin verdiği birim) muhabire haber önerir.
 * Öneri muhabirin önerileri arasına "yanıt bekleniyor" olarak düşer;
 * muhabir kabul edince Planlama'nın değerlendirmesine girer, geri
 * çevirirse gerekçesiyle kapanır.
 */
export const muhabireOneriGonder = (ben: Kisi, g: MuhabireOneriGirdisi): string | null => {
  let d = getir();
  const m = kisiBul(d, g.muhabirId);
  if (!muhabireOneriGonderebilir(ben, d) || !m || m.birim !== "muhabir" || !g.haberBasligi.trim() || !g.gelisme.trim()) return null;
  const id = kimlik("o");
  const o: Oneri = {
    id,
    muhabirId: m.id,
    giren: ben.id,
    yon: "muhabire",
    ulke: g.ulke,
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    ...(g.paketBasligi?.trim() && { paketBasligi: g.paketBasligi.trim() }),
    tur: g.tur,
    ...(g.bicim && { bicim: g.bicim }),
    sahaGerekli: g.sahaGerekli,
    zaman: simdi(),
    kanal: "sistem",
    ...(g.hedefTarih && { hedefTarih: g.hedefTarih }),
    ...(g.takipId && d.takipler.some((x) => x.id === g.takipId && x.muhabirId === m.id) && { takipId: g.takipId }),
    durum: "teklif",
  };
  d = { ...d, oneriler: [o, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriMuhabireGonderildi", oneriId: id, veri: { kime: m.id, muhabir: m.id } }));
  return id;
};

/** Muhabirin yanıtı: kabulde öneri Planlama'nın önüne "değerlendiriliyor" olarak gider; retde gerekçe zorunlu. */
export const teklifYanitla = (ben: Kisi, id: string, kabul: boolean, gerekce = "") => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !teklifYanitlayabilir(ben, o)) return false;
  if (!kabul && !gerekce.trim()) return false;
  const yeni: Oneri = kabul ? { ...o, durum: "degerlendiriliyor" } : { ...o, durum: "reddedildi", gerekce: gerekce.trim() };
  // Gönderen Planlama dışından olabilir; o da haberdar olsun.
  const kime = o.giren && kisiBul(d, o.giren)?.birim !== "planlama" ? o.giren : "";
  kaydet(
    hareketYaz(
      { ...d, oneriler: d.oneriler.map((x) => (x.id === id ? yeni : x)) },
      { kisiId: ben.id, tip: kabul ? "teklifKabulEdildi" : "teklifReddedildi", oneriId: id, veri: { sahip: "planlama", ...(kime && { kime }), ...(!kabul && { gerekce: gerekce.trim() }) } },
    ),
  );
  return true;
};

/**
 * Önerinin yazışmasına yazmak. Bildirim karşı tarafa: muhabir yazdıysa
 * Planlama'ya (ve Planlama dışından gönderen kişiye), Planlama yazdıysa
 * muhabire.
 */
export const oneriMesajiGonder = (ben: Kisi, oneriId: string, metin: string) => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !oneriYazisabilir(ben, o) || !metin.trim()) return false;
  const mesaj: Mesaj = { id: kimlik("ms"), oneriId, kisiId: ben.id, metin: metin.trim(), zaman: simdi() };
  d = { ...d, mesajlar: [...d.mesajlar, mesaj] };
  d = bahset(d, ben, metin, { yol: `#/oneriler/${oneriId}`, baslik: o.paketBasligi || o.haberBasligi });
  const muhabirYazdi = ben.id === o.muhabirId;
  const disaridan = o.giren && kisiBul(d, o.giren)?.birim !== "planlama" ? o.giren : "";
  const veri: Record<string, string> = muhabirYazdi ? { sahip: "planlama", ...(disaridan && { kime: disaridan }) } : { kime: o.muhabirId! };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriMesaji", oneriId, veri }));
  return true;
};

/** Muhabire öneri gönderebilecek birimler: yalnız tam yönetici seçiyor. */
export const muhabireOneriBirimleriKaydet = (ben: Kisi, birimler: BirimId[]) => {
  if (!ben.hesapYoneticisi) return false;
  const d = getir();
  kaydet({ ...d, muhabireOneriBirimleri: [...new Set(birimler)].filter((b) => b !== "muhabir") });
  return true;
};

/* --- Muhabirin takipleri --- */

export interface TakipGirdisi {
  id?: string;
  konu: string;
  aciklama?: string;
  tur: TakipTuru;
  tarih?: string;
}

/**
 * Muhabir izlediği konuyu ekler ya da düzeltir; yalnız kendi takibini.
 * Yeni takip Planlama'ya bildirim: işe dönüştürmek ya da muhabirle
 * konuşmak onların kararı.
 */
export const takipKaydet = (ben: Kisi, g: TakipGirdisi): string | null => {
  if (!takipEkleyebilir(ben) || !g.konu.trim()) return null;
  let d = getir();
  const alanlar = { konu: g.konu.trim(), tur: g.tur, ...(g.aciklama?.trim() && { aciklama: g.aciklama.trim() }), ...(g.tarih && { tarih: g.tarih }) };
  if (g.id) {
    const eski = d.takipler.find((x) => x.id === g.id);
    if (!eski || eski.muhabirId !== ben.id) return null;
    const { aciklama: _, tarih: __, ...kalan } = eski;
    d = { ...d, takipler: d.takipler.map((x) => (x === eski ? { ...kalan, ...alanlar } : x)) };
    // Takip türündeki bağlı öneri de aynı metne geliyor (takibiEsle'nin öbür yönü).
    const metin = { haberBasligi: alanlar.konu, gelisme: alanlar.aciklama ?? alanlar.konu };
    d = {
      ...d,
      oneriler: d.oneriler.map((o) =>
        o.takipId === eski.id && o.bicim === TAKIP_BICIMI && o.durum !== "planaEklendi" && (o.haberBasligi !== metin.haberBasligi || o.gelisme !== metin.gelisme) ? { ...o, ...metin } : o,
      ),
    };
    kaydet(d);
    return eski.id;
  }
  const id = kimlik("tk");
  d = { ...d, takipler: [{ id, muhabirId: ben.id, sehir: ben.sehir, zaman: simdi(), ...alanlar }, ...d.takipler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "takipEklendi", veri: { takipId: id, sahip: "planlama" } }));
  return id;
};

/*
 * Eskiden "Takip" türünde gönderilen öneri hem öneri hem takip olarak
 * kaydediliyordu; şimdi yalnız takip. Planlama'nın dokunmadığı ("yeni")
 * ve takibi duran kopya öneri, izleriyle kaldırılıyor (takip kalıyor);
 * Planlama'nın işlediği öneri yerinde. Sistemin açılış işi (App.tsx).
 */
/*
 * Strap kuralından önce Weekly'den aktarılan paketin başlığı kalemin metni
 * (açıklamanın aynısı) olabiliyordu. Sistemin açılış işi: başlığı hâlâ
 * açıklamasıyla aynı olan Weekly paketine strap'i (yoksa dosyanın adını)
 * yazıyor; elle değiştirilmiş başlığa dokunmuyor.
 */
export const haftalikPaketBasliklariniDuzelt = (): number => {
  let d = getir();
  const kalemler = new Map(d.haftalik.flatMap((h) => h.kalemler.map((k) => [k.id, k] as const)));
  let n = 0;
  for (const p of d.paketler) {
    const k = p.haftalikKalemId ? kalemler.get(p.haftalikKalemId) : undefined;
    if (!k || p.baslik !== p.aciklama || p.baslik !== k.metin) continue;
    const yeni = kalemStrapi(d, k);
    if (!yeni || yeni === p.baslik) continue;
    d = paketGuncelle(d, p.id, (x) => ({ ...x, baslik: yeni }));
    n++;
  }
  if (n) kaydet(d);
  return n;
};

export const takipOnerileriniAyikla = (): number => {
  const d = getir();
  const idler = d.oneriler.filter((o) => o.bicim === TAKIP_BICIMI && o.durum === "yeni" && !!o.takipId && d.takipler.some((x) => x.id === o.takipId)).map((o) => o.id);
  if (!idler.length) return 0;
  kaydet(temizle(d, { turler: ["oneriler"], idler }).yeni);
  return idler.length;
};

/** Takip bitti (ya da yeniden açıldı); kayıt geçmişte kalıyor. */
export const takipKapat = (ben: Kisi, id: string, kapandi: boolean) => {
  const d = getir();
  const t = d.takipler.find((x) => x.id === id);
  if (!t || t.muhabirId !== ben.id) return false;
  const { kapandi: _, ...kalan } = t;
  kaydet({ ...d, takipler: d.takipler.map((x) => (x === t ? { ...kalan, ...(kapandi && { kapandi: true }) } : x)) });
  return true;
};

/*
 * Takip silinince Planlama'nın henüz dokunmadığı "Takip" önerisi de geri
 * çekiliyor (aynı işin öbür yüzü, izleriyle); üzerinde karar verilmiş
 * öneri kalıyor, yalnız takiple bağı kopuyor.
 */
export const takipSil = (ben: Kisi, id: string) => {
  let d = getir();
  const t = d.takipler.find((x) => x.id === id);
  if (!t || t.muhabirId !== ben.id) return false;
  const geriCek = d.oneriler.filter((o) => o.takipId === id && o.bicim === TAKIP_BICIMI && o.durum === "yeni").map((o) => o.id);
  if (geriCek.length) d = temizle(d, { turler: ["oneriler"], idler: geriCek }).yeni;
  d = {
    ...d,
    takipler: d.takipler.filter((x) => x.id !== id),
    oneriler: d.oneriler.map((o) => {
      if (o.takipId !== id) return o;
      const { takipId: _, ...kalan } = o;
      return kalan;
    }),
  };
  kaydet(d);
  return true;
};

/* --- Özel yayın --- */

/*
 * Özel yayın tek belge (Durum.ozel); nafize, konuk ve talep onun içinde,
 * her biri kendi izini (kim, ne zaman, ne yaptı, not) taşıyor. Paket
 * talepleri gerçek paket (ozelId): dış muhabir onu kendi işi olarak
 * görüyor, in-house paketi Output müdürü dağıtıyor. Dış görevlendirme
 * genel görevlendirme kaydında, "talep" olarak: News Gathering'in
 * görevlendirmeleriyle aynı yerden koordine ediliyor.
 */
const izYaz = (ben: Kisi, olay: OzelIz["olay"], ek: Partial<OzelIz> = {}): OzelIz => ({ kisiId: ben.id, zaman: simdi(), olay, ...ek });
const ozelBul = (d: Durum, id: string) => d.ozel.find((o) => o.id === id);
const ozelGuncelle = (d: Durum, id: string, f: (o: OzelYayin) => OzelYayin): Durum => ({ ...d, ozel: d.ozel.map((o) => (o.id === id ? f(o) : o)) });

export interface OzelKunye {
  ad: string;
  tarih: string;
  bitis?: string;
  aciklama?: string;
}

export const ozelOlustur = (ben: Kisi, g: OzelKunye): string | null => {
  if (!ozelDuzenler(ben) || !g.ad.trim() || !g.tarih) return null;
  const id = kimlik("oz");
  const o: OzelYayin = {
    id,
    ad: g.ad.trim(),
    tarih: g.tarih,
    ...(g.bitis && g.bitis > g.tarih ? { bitis: g.bitis } : {}),
    ...(g.aciklama?.trim() ? { aciklama: g.aciklama.trim() } : {}),
    durum: "hazirlik",
    hazirlik: [],
    nafizeler: [],
    talepler: [],
    iz: [izYaz(ben, "eklendi")],
  };
  const d = getir();
  kaydet(hareketYaz({ ...d, ozel: [...d.ozel, o] }, { kisiId: ben.id, tip: "ozelOlusturuldu", ozelId: id, veri: { tarih: g.tarih } }));
  return id;
};

export const ozelKunyeKaydet = (ben: Kisi, id: string, g: OzelKunye) => {
  const d = getir();
  if (!ozelDuzenler(ben) || !ozelBul(d, id) || !g.ad.trim() || !g.tarih) return false;
  kaydet(
    ozelGuncelle(d, id, (o) => ({
      ...o,
      ad: g.ad.trim(),
      tarih: g.tarih,
      bitis: g.bitis && g.bitis > g.tarih ? g.bitis : undefined,
      aciklama: g.aciklama?.trim() || undefined,
      iz: [...(o.iz ?? []), izYaz(ben, "duzenlendi")],
    })),
  );
  return true;
};

/*
 * Planın aşamaları kontrol listesi: planlama tamam (onayda), onaylandı,
 * uygulama tamam, yayına hazır. Sırayla işaretleniyor, yalnız sonuncu geri
 * alınıyor. Onay kuralı Plan yetkileri'nde (ozOnay); öbürlerini plan
 * düzenleyen de onaylayan da işaretliyor. Planın onayı onay bekleyen
 * nafizeleri ve paket önerilerini de onaylıyor (tek tek onaylanmamışsa).
 */
export const ozelAsamaDegisebilir = (ben: Kisi, o: OzelYayin, adim: Exclude<OzelDurum, "hazirlik">, tamam: boolean) => {
  const simdiki = o.durum ?? "hazirlik";
  if (tamam ? siradaki(OZEL_SIRASI, simdiki) !== adim : !oncesi(OZEL_SIRASI, simdiki, adim)) return false;
  return adim === "onayli" ? planAdimiYapabilir(ben, "ozOnay") : ozelDuzenler(ben) || planAdimiYapabilir(ben, "ozOnay");
};

/* Onaylanan paketin görevi: dış muhabire kişisel, in-house Output'a (müdürü dağıtıyor); hangi yayın için olduğu yazılı. */
const ozelPaketGorevi = (d: Durum, ben: Kisi, p: Paket): Durum =>
  hareketYaz(d, {
    kisiId: ben.id,
    tip: "ozelPaketOnaylandi",
    paketId: p.id,
    ozelId: p.ozelId,
    // Dış muhabire görev onayla değil, Planlama görevlendirmeyi işaretleyince gidiyor (ozelPaketGorevVer).
    veri: { ...(p.sonTarih ? { tarih: p.sonTarih } : {}), ...(p.ozelAd ? { ad: p.ozelAd } : {}), ...(p.muhabirId ? {} : { sahip: "output" }) },
  });

/* Öneri kaydından önce doğrudan açılmış taslak paket: onayla görev gidiyor. */
const ozelPaketiOnayla = (d: Durum, ben: Kisi, p: Paket): Durum =>
  ozelPaketGorevi(paketGuncelle(d, p.id, (x) => ({ ...x, durum: "onaylandi", ...(x.muhabirId ? { ozelGorevBekliyor: true as const } : {}), guncelleme: simdi() })), ben, p);

/* Paket önerisinin onayı: paket o an doğuyor, öneri paketine bağlanıyor. */
const paketOnerisiniOnayla = (d: Durum, ben: Kisi, o: OzelYayin, x: OzelPaketOnerisi): Durum => {
  const muhabir = x.kaynak === "dis" ? kisiBul(d, x.muhabirId) : undefined;
  let kod: string;
  [kod, d] = yeniKod(d);
  const id = kimlik("p");
  const paket: Paket = {
    id,
    kod,
    baslik: x.baslik,
    sehir: muhabir?.sehir ?? "istanbul",
    ...(muhabir ? { muhabirId: muhabir.id, ozelGorevBekliyor: true as const } : {}),
    aciklama: x.aciklama,
    tur: x.tur,
    bicim: x.bicim,
    durum: "onaylandi",
    sahaGerekli: false,
    ozelId: o.id,
    ozelKaynak: x.kaynak,
    ozelAd: o.ad,
    ...(x.sonTarih ? { sonTarih: x.sonTarih } : {}),
    notlar: [],
    olusturma: simdi(),
    guncelleme: simdi(),
  };
  d = { ...d, paketler: [paket, ...d.paketler] };
  d = ozelGuncelle(d, o.id, (y) => ({ ...y, paketOnerileri: (y.paketOnerileri ?? []).map((z) => (z.id === x.id ? { ...z, durum: "onaylandi" as const, paketId: id, iz: [...z.iz, izYaz(ben, "durum", { durum: "onayli" })] } : z)) }));
  return ozelPaketGorevi(d, ben, paket);
};

export const ozelAsamaIsaretle = (ben: Kisi, id: string, adim: Exclude<OzelDurum, "hazirlik">, tamam: boolean) => {
  let d = getir();
  const o = ozelBul(d, id);
  if (!o || !ozelAsamaDegisebilir(ben, o, adim, tamam)) return false;
  const yeni = tamam ? adim : oncesi(OZEL_SIRASI, o.durum ?? "hazirlik", adim)!;
  // İşaret kaldırılınca izde kaldırılan aşama ("geri") yazılı: kim geri aldı görünsün.
  d = ozelGuncelle(d, id, (x) => ({ ...x, durum: yeni, iz: [...(x.iz ?? []), izYaz(ben, "durum", tamam ? { durum: adim } : { durum: yeni, asama: adim, not: "↶" })] }));
  if (tamam && adim === "onayli") {
    d = ozelGuncelle(d, id, (x) => ({ ...x, nafizeler: (x.nafizeler ?? []).map((n) => (n.durum === "planlandi" ? { ...n, durum: "onayli" as const, iz: [...n.iz, izYaz(ben, "durum", { durum: "onayli" })] } : n)) }));
    for (const x of ozelBul(d, id)!.paketOnerileri ?? []) if (x.durum === "oneri") d = paketOnerisiniOnayla(d, ben, ozelBul(d, id)!, x);
    for (const p of d.paketler.filter((x) => x.ozelId === id && x.durum === "taslak")) d = ozelPaketiOnayla(d, ben, p);
  }
  const tip = !tamam ? "ozelHazirliga" : adim === "onayli" ? "ozelOnaylandi" : adim === "onayda" ? "ozelOnayaGonderildi" : "ozelAsama";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, ozelId: id, veri: { tarih: o.tarih, sahip: "planlama", ad: o.ad, asama: adim } }));
  return true;
};

/** Aşamanın notu: planın izinde, aşamaya bağlı. */
export const ozelAsamaNotu = (ben: Kisi, id: string, asama: string, metin: string) => {
  const d = getir();
  const n = metin.trim();
  const o = ozelBul(d, id);
  if (!n || !o || !(ozelDuzenler(ben) || planAdimiYapabilir(ben, "ozOnay"))) return false;
  kaydet(bahset(ozelGuncelle(d, id, (x) => ({ ...x, iz: [...(x.iz ?? []), izYaz(ben, "not", { not: n, asama })] })), ben, n, { yol: `#/ozel/${id}`, baslik: o.ad }));
  return true;
};

/* Nafize, talep, konuk: aynı kalıp; kalemin kendi izine yazılıyor. */
type KalemTuru = "nafizeler" | "talepler" | "paketOnerileri";
type KalemOf<T extends KalemTuru> = NonNullable<OzelYayin[T]>[number];

// Onay adımı plan düzenleme yetkisi olmayan onaylayana da açık: izin dışarıdan gelebiliyor.
const kalemDegistir = <T extends KalemTuru>(ben: Kisi, ozelId: string, tur: T, kalemId: string, f: (k: KalemOf<T>) => KalemOf<T>, ek?: (d: Durum, k: KalemOf<T>) => Durum, izin = ozelDuzenler(ben)) => {
  let d = getir();
  const o = ozelBul(d, ozelId);
  const k = (o?.[tur] as KalemOf<T>[] | undefined)?.find((x) => x.id === kalemId);
  if (!o || !k || !izin) return false;
  const yeni = f(k);
  d = ozelGuncelle(d, ozelId, (x) => ({ ...x, [tur]: (x[tur] as KalemOf<T>[]).map((y) => (y.id === kalemId ? yeni : y)) }));
  kaydet(ek ? ek(d, yeni) : d);
  return true;
};

export type NafizeGirdisi = Omit<Nafize, "id" | "iz" | "durum" | "konuklar"> & { id?: string };

export const nafizeKaydet = (ben: Kisi, ozelId: string, g: NafizeGirdisi): string | null => {
  const temiz = { ...g, konu: g.konu.trim(), saat: g.saat || undefined, yer: g.yer?.trim() || undefined, muhabirId: g.muhabirId || undefined, muhabirTbc: !g.muhabirId && g.muhabirTbc ? (true as const) : undefined };
  if (!temiz.konu || !temiz.tarih) return null;
  if (g.id) return kalemDegistir(ben, ozelId, "nafizeler", g.id, (n) => ({ ...n, ...temiz, id: n.id, iz: [...n.iz, izYaz(ben, "duzenlendi")] })) ? g.id : null;
  const d = getir();
  if (!ozelBul(d, ozelId) || !ozelDuzenler(ben)) return null;
  const id = kimlik("nf");
  const n: Nafize = { ...temiz, id, konuklar: [], durum: "planlandi", iz: [izYaz(ben, "eklendi")] };
  kaydet(ozelGuncelle(d, ozelId, (o) => ({ ...o, nafizeler: [...(o.nafizeler ?? []), n] })));
  return id;
};

/*
 * Nafizenin kontrol listesi: onay (onaylayan; tek başına ya da planın
 * onayıyla), Satdesk rezervasyonu, yer hazır, yayınlandı. Sırayla; yalnız
 * sonuncu geri alınıyor. Rezervasyon onaydan önce yapılmıyor.
 */
export const nafizeAsamaDegisebilir = (ben: Kisi, n: Nafize, adim: NafizeDurum, tamam: boolean) => {
  if (n.durum === "iptal" || (tamam ? siradaki(NAFIZE_SIRASI, n.durum) !== adim : !oncesi(NAFIZE_SIRASI, n.durum, adim))) return false;
  return adim === "onayli" ? planAdimiYapabilir(ben, "ozOnay") : ozelDuzenler(ben);
};

export const nafizeAsamasi = (ben: Kisi, ozelId: string, id: string, adim: NafizeDurum, tamam: boolean) => {
  const n = ozelBul(getir(), ozelId)?.nafizeler?.find((x) => x.id === id);
  if (!n || !nafizeAsamaDegisebilir(ben, n, adim, tamam)) return false;
  const durum = tamam ? adim : oncesi(NAFIZE_SIRASI, n.durum, adim)!;
  return kalemDegistir(ben, ozelId, "nafizeler", id, (x) => ({ ...x, durum, iz: [...x.iz, izYaz(ben, "durum", tamam ? { durum: adim } : { durum, asama: adim, not: "↶" })] }), undefined, true);
};

/** İptal ve geri alma: iptal edilen nafize işaretlerini kaybediyor, baştan planlanıyor. */
export const nafizeIptal = (ben: Kisi, ozelId: string, id: string, iptal: boolean) =>
  kalemDegistir(ben, ozelId, "nafizeler", id, (n) => (iptal === (n.durum === "iptal") ? n : { ...n, durum: iptal ? "iptal" : "planlandi", iz: [...n.iz, izYaz(ben, "durum", { durum: iptal ? "iptal" : "planlandi" })] }));

export const konukKaydet = (ben: Kisi, ozelId: string, nafizeId: string, g: Omit<Konuk, "id"> & { id?: string }) => {
  const ad = g.ad.trim();
  if (!ad) return false;
  const konuk: Konuk = { id: g.id ?? kimlik("kn"), ad, unvan: g.unvan?.trim() || undefined, yer: g.yer?.trim() || undefined, durum: g.durum };
  return kalemDegistir(ben, ozelId, "nafizeler", nafizeId, (n) => {
    const eski = n.konuklar.find((x) => x.id === konuk.id);
    const konuklar = eski ? n.konuklar.map((x) => (x.id === konuk.id ? konuk : x)) : [...n.konuklar, konuk];
    // Konuğun durumu değişti mi: izde konuğun adıyla (kim teyit etti, ne zaman).
    const iz = !eski ? izYaz(ben, "eklendi", { not: ad }) : eski.durum !== konuk.durum ? izYaz(ben, "durum", { durum: konuk.durum, not: ad }) : izYaz(ben, "duzenlendi", { not: ad });
    return { ...n, konuklar, iz: [...n.iz, iz] };
  });
};

export const konukSil = (ben: Kisi, ozelId: string, nafizeId: string, konukId: string) =>
  kalemDegistir(ben, ozelId, "nafizeler", nafizeId, (n) => ({ ...n, konuklar: n.konuklar.filter((x) => x.id !== konukId) }));

export type TalepGirdisi = { id?: string; metin: string; birim?: BirimId; sonTarih?: string };

export const ozelTalepKaydet = (ben: Kisi, ozelId: string, g: TalepGirdisi): string | null => {
  const temiz = { metin: g.metin.trim(), birim: g.birim || undefined, sonTarih: g.sonTarih || undefined };
  if (!temiz.metin) return null;
  if (g.id) return kalemDegistir(ben, ozelId, "talepler", g.id, (x) => ({ ...x, ...temiz, iz: [...x.iz, izYaz(ben, "duzenlendi")] })) ? g.id : null;
  let d = getir();
  if (!ozelBul(d, ozelId) || !ozelDuzenler(ben)) return null;
  const id = kimlik("ot");
  const talep: OzelTalep = { id, ...temiz, durum: "acik", iz: [izYaz(ben, "eklendi")] };
  d = ozelGuncelle(d, ozelId, (o) => ({ ...o, talepler: [...(o.talepler ?? []), talep] }));
  // Talep bir birime yazıldıysa (grafik…) o birime iş düşüyor.
  if (temiz.birim) d = hareketYaz(d, { kisiId: ben.id, tip: "ozelTalep", ozelId, veri: { sahip: temiz.birim, ...(temiz.sonTarih ? { tarih: temiz.sonTarih } : {}) } });
  kaydet(d);
  return id;
};

/** Talebin kontrol listesi (sürüyor, tamamlandı) ve iptal; durum doğrudan veriliyor, sıra ekranda. */
export const ozelTalepDurumu = (ben: Kisi, ozelId: string, id: string, durum: TalepDurum) =>
  kalemDegistir(ben, ozelId, "talepler", id, (x) => (x.durum === durum ? x : { ...x, durum, iz: [...x.iz, izYaz(ben, "durum", { durum })] }));

/** Her aşamaya not: kim yazdı, ne zaman; sonradan bakan görsün. */
/** Kalemin notu; aşama verilirse kontrol listesinin o satırına düşüyor. */
export const ozelKalemNotu = (ben: Kisi, ozelId: string, tur: KalemTuru, id: string, metin: string, asama?: string) =>
  !!metin.trim() &&
  kalemDegistir(
    ben,
    ozelId,
    tur,
    id,
    (x) => ({ ...x, iz: [...x.iz, izYaz(ben, "not", { not: metin.trim(), ...(asama ? { asama } : {}) })] }),
    (d) => bahset(d, ben, metin, { yol: `#/ozel/${ozelId}`, baslik: ozelBul(d, ozelId)?.ad }),
    ozelDuzenler(ben) || planAdimiYapabilir(ben, "ozOnay"),
  );

/** Silinen kalem planda iz bırakıyor: ne silindi, kim sildi. */
export const ozelKalemSil = (ben: Kisi, ozelId: string, tur: KalemTuru, id: string) => {
  const d = getir();
  const o = ozelBul(d, ozelId);
  const k = (o?.[tur] as { id: string; konu?: string; metin?: string; baslik?: string; durum?: string }[] | undefined)?.find((x) => x.id === id);
  // Onaylanmış paket önerisi silinmiyor: paketi ve görevi doğdu.
  if (!o || !k || !ozelDuzenler(ben) || (tur === "paketOnerileri" && k.durum !== "oneri")) return false;
  kaydet(ozelGuncelle(d, ozelId, (x) => ({ ...x, [tur]: (x[tur] as { id: string }[]).filter((y) => y.id !== id), iz: [...(x.iz ?? []), izYaz(ben, "duzenlendi", { not: k.konu ?? k.metin ?? k.baslik })] })));
  return true;
};

/* --- Özel yayın paketi: in-house (Output'a) ya da dış muhabire, son tarihli talep --- */

export interface OzelPaketGirdisi {
  baslik: string;
  aciklama: string;
  kaynak: "inhouse" | "dis";
  muhabirId?: string;
  sonTarih?: string;
  tur: IcerikTuru;
  bicim?: Bicim;
}

/*
 * Paket önerisi özel yayının içinde kalıyor (genel önerilere karışmıyor);
 * paket ve görev onayla doğuyor. Onaydan önce düzeltilir ve silinir.
 */
export const ozelPaketOnerisiKaydet = (ben: Kisi, ozelId: string, g: OzelPaketGirdisi & { id?: string }): string | null => {
  const d = getir();
  const o = ozelBul(d, ozelId);
  if (!o || !ozelDuzenler(ben) || !g.baslik.trim()) return null;
  if (g.kaynak === "dis" && !kisiBul(d, g.muhabirId)) return null;
  const temiz = {
    baslik: g.baslik.trim(),
    aciklama: g.aciklama.trim(),
    kaynak: g.kaynak,
    muhabirId: g.kaynak === "dis" ? g.muhabirId : undefined,
    sonTarih: g.sonTarih || undefined,
    tur: g.tur,
    bicim: g.bicim ?? "pkg",
  };
  if (g.id) {
    const eski = o.paketOnerileri?.find((x) => x.id === g.id);
    if (!eski || eski.durum !== "oneri") return null;
    return kalemDegistir(ben, ozelId, "paketOnerileri", g.id, (x) => ({ ...x, ...temiz, iz: [...x.iz, izYaz(ben, "duzenlendi")] })) ? g.id : null;
  }
  const id = kimlik("po");
  const oneri: OzelPaketOnerisi = { id, ...temiz, durum: "oneri", iz: [izYaz(ben, "eklendi")] };
  kaydet(hareketYaz(ozelGuncelle(d, ozelId, (x) => ({ ...x, paketOnerileri: [...(x.paketOnerileri ?? []), oneri] })), { kisiId: ben.id, tip: "ozelPaketTalebi", ozelId, veri: { ad: o.ad, ...(temiz.sonTarih ? { tarih: temiz.sonTarih } : {}) } }));
  return id;
};

/** Paket önerisi tek başına onaylanıyor (planın onayını beklemeden); kural planınki (ozOnay). */
export const ozelPaketOnerisiOnaylanabilir = (ben: Kisi | undefined, x: OzelPaketOnerisi) => !!ben && x.durum === "oneri" && planAdimiYapabilir(ben, "ozOnay");

export const ozelPaketOnerisiOnayla = (ben: Kisi, ozelId: string, oneriId: string) => {
  const d = getir();
  const o = ozelBul(d, ozelId);
  const x = o?.paketOnerileri?.find((y) => y.id === oneriId);
  if (!o || !x || !ozelPaketOnerisiOnaylanabilir(ben, x)) return false;
  kaydet(paketOnerisiniOnayla(d, ben, o, x));
  return true;
};

/** Öneri kaydından önce doğrudan açılmış taslak paket (eski kayıt) tek başına onaylanıyor. */
export const ozelPaketOnaylanabilir = (ben: Kisi | undefined, p: Paket) => !!ben && !!p.ozelId && p.durum === "taslak" && planAdimiYapabilir(ben, "ozOnay");

export const ozelPaketOnayla = (ben: Kisi, paketId: string) => {
  const d = getir();
  const p = paketBul(d, paketId);
  if (!p || !ozelPaketOnaylanabilir(ben, p)) return false;
  kaydet(ozelPaketiOnayla(d, ben, p));
  return true;
};

/* Paketin ilerleyişi önerinin izine de düşüyor: kontrol listesinde kim, ne zaman. */
const paketOnerisiIzi = (d: Durum, ben: Kisi, p: Paket, durum: string): Durum => {
  const o = p.ozelId ? ozelBul(d, p.ozelId) : undefined;
  if (!o?.paketOnerileri?.some((x) => x.paketId === p.id)) return d;
  return ozelGuncelle(d, o.id, (y) => ({ ...y, paketOnerileri: y.paketOnerileri!.map((x) => (x.paketId === p.id ? { ...x, iz: [...x.iz, izYaz(ben, "durum", { durum })] } : x)) }));
};

/** İşi yapan hazırlamaya başladı: görevlendirildi → hazırlanıyor. Planlama da onun adına işaretleyebiliyor. */
export const ozelPaketBasladi = (ben: Kisi, paketId: string) => {
  const d = getir();
  const p = paketBul(d, paketId);
  if (!p || p.ozelBasladi || !(p.muhabirId ?? p.hazirlayanId) || !ozelPaketTeslimEdebilir(ben, p)) return false;
  const yapan = p.muhabirId ?? p.hazirlayanId;
  const yd = paketOnerisiIzi(paketGuncelle(d, paketId, (x) => ({ ...x, ozelBasladi: simdi(), guncelleme: simdi() })), ben, p, "hazirlaniyor");
  kaydet(hareketYaz(yd, { kisiId: ben.id, tip: "ozelPaketBasladi", paketId, ozelId: p.ozelId, veri: ben.id === yapan ? { sahip: "planlama" } : { kime: yapan! } }));
  return true;
};

/*
 * Dış muhabire görev: onaydan ayrı, Planlama işaretliyor; görev ve
 * bildirim muhabire o an gidiyor. Muhabir başlamadan geri alınabiliyor.
 */
export const ozelGorevVerebilir = (ben: Kisi | undefined, p: Paket, ver: boolean) =>
  !!ben && !!p.ozelId && !!p.muhabirId && p.durum === "onaylandi" && ozelDuzenler(ben) && (ver ? !!p.ozelGorevBekliyor : !p.ozelGorevBekliyor && !p.ozelBasladi);

export const ozelPaketGorevVer = (ben: Kisi, paketId: string, ver: boolean) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !ozelGorevVerebilir(ben, p, ver)) return false;
  d = paketGuncelle(d, paketId, (x) => {
    const { ozelGorevBekliyor: _, ...kalan } = x;
    return ver ? { ...kalan, guncelleme: simdi() } : { ...kalan, ozelGorevBekliyor: true as const, guncelleme: simdi() };
  });
  const o = ozelBul(d, p.ozelId!);
  if (o?.paketOnerileri?.some((x) => x.paketId === p.id))
    d = ozelGuncelle(d, o.id, (y) => ({ ...y, paketOnerileri: y.paketOnerileri!.map((x) => (x.paketId === p.id ? { ...x, iz: [...x.iz, izYaz(ben, "durum", ver ? { durum: "gorevli" } : { durum: "onayli", asama: "gorevli", not: "↶" })] } : x)) }));
  if (ver) d = hareketYaz(d, { kisiId: ben.id, tip: "ozelPaketAtandi", paketId, ozelId: p.ozelId, veri: { kime: p.muhabirId!, ...(p.ozelAd ? { ad: p.ozelAd } : {}), ...(p.sonTarih ? { tarih: p.sonTarih } : {}) } });
  kaydet(d);
  return true;
};

/** Output müdürü in-house paketi ekibinden birine veriyor; değiştirebiliyor da. */
export const ozelPaketAta = (ben: Kisi, paketId: string, kisiId: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const k = kisiBul(d, kisiId);
  if (!p || !k || k.pasif || !ozelPaketDagitabilir(ben, p) || p.hazirlayanId === kisiId) return false;
  d = paketOnerisiIzi(paketGuncelle(d, paketId, (x) => ({ ...x, hazirlayanId: kisiId, guncelleme: simdi() })), ben, p, "gorevli");
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "ozelPaketAtandi", paketId, ozelId: p.ozelId, veri: { kime: kisiId, ...(p.ozelAd ? { ad: p.ozelAd } : {}), ...(p.sonTarih ? { tarih: p.sonTarih } : {}) } }));
  return true;
};

/** Dış görevlendirme: genel kayıtta "talep", News Gathering'in onayından geçiyor. */
export const ozelGorevlendirme = (ben: Kisi, ozelId: string, g: Omit<Gorevlendirme, "id" | "durum" | "ozelId">): string | null => {
  const d = getir();
  if (!ozelBul(d, ozelId) || !ozelDuzenler(ben) || !g.kisiId || !g.yer.trim()) return null;
  const id = kimlik("gr");
  kaydet(
    hareketYaz(
      { ...d, gorevlendirmeler: [{ ...g, yer: g.yer.trim(), aciklama: g.aciklama.trim(), bitis: g.bitis < g.baslangic ? g.baslangic : g.bitis, id, durum: "talep", ozelId }, ...d.gorevlendirmeler] },
      { kisiId: ben.id, tip: "ozelTalep", ozelId, veri: { sahip: "newsgathering", tarih: g.baslangic } },
    ),
  );
  return id;
};

/** Hazırlık maddesi (eski düzenin listesi, takvimden gelenler de buraya düşüyor). */
export const ozelHazirlikEkle = (ben: Kisi, ozelId: string, metin: string) => {
  const d = getir();
  if (!ozelBul(d, ozelId) || !ozelDuzenler(ben) || !metin.trim()) return false;
  kaydet(ozelGuncelle(d, ozelId, (o) => ({ ...o, hazirlik: [...o.hazirlik, { id: kimlik("oz"), metin: metin.trim(), tamam: false }], iz: [...(o.iz ?? []), izYaz(ben, "eklendi", { not: metin.trim() })] })));
  return true;
};

export const ozelHazirlikIsaretle = (ben: Kisi, ozelId: string, maddeId: string, tamam: boolean) => {
  const d = getir();
  const m = ozelBul(d, ozelId)?.hazirlik.find((x) => x.id === maddeId);
  if (!m || !ozelDuzenler(ben) || m.tamam === tamam) return false;
  kaydet(ozelGuncelle(d, ozelId, (o) => ({ ...o, hazirlik: o.hazirlik.map((x) => (x.id === maddeId ? { ...x, tamam } : x)), iz: [...(o.iz ?? []), izYaz(ben, "durum", { durum: tamam ? "tamam" : "acik", not: m.metin })] })));
  return true;
};
