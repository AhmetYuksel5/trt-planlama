import { adiylaBaslik } from "./baslikSecimi";
import { kayipBasliklar, kayipMuhabirleri } from "./kayipKayitlar";
import { adimTuru, parcaliMi, parcalarHazir, akisDamgasi, durakSahibi, geriHedefi, kolSahibi, ilkAdim, paketSahibi, sonrakiAdim, hazirSecilebilir, type UretimAdimi } from "./akis";
import { bosYanitMi, cagriKonulari, cagriyiBul, etiketBul, gondereniBul, postaKonuCekirdegi, yanittanOneriTaslagi, yeniMetin, type GelenEposta } from "./eposta";
import { gundemde, haftaSonu, kalemAdi, kararBekleyenler, nextDayeGider, onIncelemeyeGidebilir, topluKabulAdaylari } from "./haftalik";
import { GERCEK, sunucuyaEsitMi } from "./kip";
import { izlemede } from "./izleme";
import { kapanisKimligi, type AnlasmaSatiri } from "./muhasebe";
import { ILK_TABAN_SAAT, budanmis, okunduYap, okunmadiYap, type PostaOkuma } from "./postaOkuma";
import type { MuhabirTaslagi } from "./iceAktar";
import { bosAlan } from "./epostaEslestir";
import { geriUygula, sessizce, sonAdimiAl } from "./geriAl";
import { arSade, planTaslagi, type PlanTaslagi } from "./planAktar";
import { TAKDIR_SABLONU, VARSAYILAN_SABLONLAR, sablonlar } from "./geriBildirim";
import { VARSAYILAN_TAKDIR } from "./takdir";
import { metin, yaz, type Yazi } from "./dil";
import { izinBirimi, ayniYapi, grupMu, icMuhabirMi, kademeHedefi, birimUnvanlari, birimdenUnvanCikar, birimeUnvanEkle, disMuhabirMi, ekipGorevleri, guncelYapi, tamamla, muhabirYerUnvani, otomatikMuhabirUnvaniMi, sehirMuhabirUnvaniId, unvanListesi, unvandanRol, yerUnvaniUygula, varsayilanYapi, type Yapi } from "./yapi";
import { KISAYOL_EN_COK, kisayolGorebilir } from "./kisayol";
import { BOLME_EN_COK, ORTAM_EN_COK, bolmeyeGirer, kisininOrtamlari, varsayilanDuzen, yolTemizle } from "./ortam";
import { TAKVIM_KAYNAGI } from "./takvim";
import { temizle, type TemizlikSecimi } from "./temizlik";
import { planCiftleriniBirlestir } from "./planCiftleri";
import { satir, sehirAdi, sehirAr, sehirListesi, sehirUlkesi } from "./etiketler";
import { gecisOnizlemesi, gecisUygula } from "./gecis";
import { kayipPlanlar } from "./kayipPlanlar";
import { oneriPlanKaydi, baglanabilirKayitlar, acikGundemde, oneriArsivde, oneriGeriHedefleri, oneriHaftada, oneriPaketBasligi, oneriPlanaGore, oneriSonGunu, oneriYeri, TAKIP_SILME_GUNU, takibinOnerisi, plandanDonmus, type OneriGeriHedefi } from "./oneriPlanlari";
import { donemAnahtari, gorevListesi, isListesi } from "./gorevler";
import { bugun, gunEkle, gunFarki, haftaBasi, simdi } from "./tarih";
import { demoHaberleri, type Haber } from "./gundem";
import { KURAL_SURUMU, adayTemizligi, haberAdaylari, yeniAdaylar } from "./takvimBotu";
import { oncesi, siradaki } from "./ozel";
import { olayAyi, olayBaglantilari, olayBicimleri } from "./aylik";
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
  type AylikOlay,
  type Durum,
  type EkipUyesi,
  type Faaliyet,
  type FaaliyetBaglantisi,
  type Oncelik,
  type Ortam,
  type OrtamDuzeni,
  type FaaliyetDurum,
  type Potansiyel,
  type GeriBildirimSablonu,
  type Gelisme,
  type Gorevlendirme,
  type GorevTanimi,
  type Is,
  type IsDurumu,
  type Hareket,
  type IcerikTuru,
  type Bicim,
  type Cagri,
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
  type MasaSorusu,
  type OneriGorunumu,
  type Paket,
  type MetinParcasi,
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
  type PostaMesaji,
  type Yanit,
  type YanitDurum,
  paketBicimi,
  baslikBul,
  gelismeMuhabirleri,
  TAKIP_BICIMI,
  oneriSinirIcinde,
  MASA_KOLLARI,
  masaPaketi,
  type OneriBicimi,
  type GundemKaynagi,
  type GundemNotu,
  type SepetParcasi,
  type MuhasebeAnlasmasi,
  type MuhasebeKapanisi,
  type MuhasebeTanimi,
} from "./veri";
import {
  adimYapabilir,
  parcaYapabilir,
  haftalikDuzenler,
  hesapYetkisi,
  epostaDegistirebilir,
  geriBildirimGonderebilir,
  geriBildirimSablonuDuzenler,
  tamamlamaGeriAlabilir,
  yalnizPlanlama,
  kararVerebilir,
  mudahaleEdebilir,
  muhabireOneriGonderebilir,
  oneriDuzeltmeyeGider,
  oneriYazisabilir,
  arsivdenCikarabilir,
  oneriSatiriEkleyebilir,
  oneriBirlestirebilir,
  geriAlabilir,
  oneriSilebilir,
  baskaMuhabireVerebilir,
  paketIsaretleyebilir,
  paketIsaretOnaylayabilir,
  oneriGeriCekebilir,
  teklifKarariVerebilir,
  oneriYenidenGonderebilir,
  onIncelemeci,
  paketGorebilir,
  planIcerikDuzenler,
  paketPlandanSilinir,
  planOperasyonDuzenler,
  profilDuzenler,
  sayfaGorebilir,
  takipEkleyebilir,
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
  gundemGorebilir,
  kisitliKisi,
  yonetimdeMi,
  muhasebeGorebilir,
  canliSonucIsaretleyebilir,
  paketGorevVerebilir,
  gorevTarihiUygun,
  gorevTalebiVerebilir,
  gorevTalebiKarariVerebilir,
  gorevTalebiGeriCekebilir,
  masayaSorabilir,
  masaYanitlar,
  oneriGorevlendirebilir,
} from "./yetki";
import { acikSoru, kabulSoru } from "./masaSorusu";
import { ADIM_ROLU, hareketlerdenKunye, kunyeYaz } from "./kunye";

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


/*
 * Kapının otomatik gönderdiği çağrılar (src/otoCagri.ts) kayda burada girer:
 * uygulamayı ilk açan planlamacının tarayıcısı yazar, postaları çekmeden önce
 * de; yanıt ND-/HP- etiketiyle bu kayda bağlanıyor. Kimlik etiketten: iki
 * tarayıcı aynı anda yazarsa aynı belgeyi yazsın, çağrı çoğalmasın.
 */
export const otoCagrilariKaydet = (
  ben: Kisi,
  kayitlar: { etiket: string; tur: CagriTuru; tarih: string; zaman: string; uid: string; kime: string; bccIdler: string[]; metin: string; sonSaat: string; tamam: boolean }[],
) => {
  if (!yapabilir(ben, "cagriHazirla")) return 0;
  let d = getir();
  const yeni = kayitlar.filter((k) => k.tamam && k.etiket && !d.cagrilar.some((c) => c.etiket === k.etiket));
  if (!yeni.length) return 0;
  for (const k of yeni) {
    const olusturan = d.kisiler.some((x) => x.id === k.uid) ? k.uid : ben.id;
    d = { ...d, cagrilar: [{ id: `oc-${k.etiket}`, tur: k.tur, tarih: k.tarih, metin: k.metin, sonSaat: k.sonSaat, kime: k.kime, bcc: k.bccIdler, etiket: k.etiket, olusturan, zaman: k.zaman }, ...d.cagrilar] };
    const haftaId = k.tur === "haftalik" ? d.haftalik.find((h) => h.baslangic === k.tarih)?.id : undefined;
    d = hareketYaz(d, { kisiId: olusturan, tip: "cagriHazirlandi", haftaId, veri: { tarih: k.tarih, sahip: "muhabir", ...(k.tur === "haftalik" ? { hafta: "1" } : {}) } });
  }
  kaydet(d);
  return yeni.length;
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
  islemeFikri?: string;
  gorselIsleme?: string;
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
}


export const oneriGonder = (ben: Kisi, g: OneriGirdisi): string | null => {
  // Gündem takibini kullanan (tam yönetici ya da paylaştığı) hangi birimde olursa olsun muhabir dışı
  // kaynaktan öneri girer: gündemdeki fırsat öneriye çevriliyor.
  if (!(yapabilir(ben, "oneriGonder") || (gundemGorebilir(getir(), ben) && !g.muhabirId && g.kaynakTuru && g.kaynakTuru !== "muhabir")) || (!g.hafta && !g.hedefTarih)) return null;
  const muhabir = ben.birim === "muhabir";
  const takip = g.bicim === TAKIP_BICIMI;
  // Muhabirin önerisinde header, gelişme ve strap zorunlu (formdaki kuralın aynısı); takipte paket önerilmiyor.
  // Formda Header sorulmuyor (1. alan strap; takipte takibin başlığı), Header ondan; sınırlar formdakiyle aynı.
  if (muhabir && (!(g.haberBasligi?.trim() || g.paketBasligi?.trim()) || !g.gelisme?.trim() || (!takip && !g.paketBasligi?.trim()) || !oneriSinirIcinde(g))) return null;
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
  // Çağrı muhabirlere gidiyor; ajanstan ya da bakanlıktan gelen öneri ona verilmiş yanıt değil.
  // Günü (aralığı) olan öneri önce o günün Next Day çağrısına, yoksa haftasının haftalık çağrısına bağlanıyor.
  const bitis = !g.hafta && g.hedefTarih && g.bitisTarih && g.bitisTarih > g.hedefTarih ? g.bitisTarih : undefined;
  const son = bitis ?? g.hedefTarih ?? "";
  // Takip bir çağrıya verilen yanıt değil, muhabirin bölgesindeki süren gelişme.
  const cagri = !muhabirId || takip
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
    haberBasligi: g.haberBasligi.trim() || g.paketBasligi?.trim() || "",
    gelisme: g.gelisme,
    paketBasligi: g.paketBasligi || undefined,
    ...(!takip && g.islemeFikri?.trim() && { islemeFikri: g.islemeFikri.trim() }),
    ...(!takip && g.gorselIsleme?.trim() && { gorselIsleme: g.gorselIsleme.trim() }),
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
    zaman: simdi(),
    kanal,
    hedefTarih: g.hafta ? undefined : g.hedefTarih,
    ...(bitis && { bitisTarih: bitis }),
    hafta: g.hafta,
    ...(g.hafta && g.haftaGunu && g.haftaGunu >= g.hafta && g.haftaGunu <= gunEkle(g.hafta, 6) && { haftaGunu: g.haftaGunu }),
    // Yalnız gelişme bildiren gönderi doğrudan Takip aşamasında; paket önerilmiyor.
    durum: takip ? "takip" : "yeni",
    ...(takip && { paketBasligi: undefined, takipTuru: g.takipTuru ?? "diger" }),
    cagriId: cagri?.id,
  };
  d = { ...d, oneriler: [oneri, ...d.oneriler] };
  // Elle girilende hareketi yapan giren kişi; geçmişte "gönderdi" değil "girdi" okunsun.
  const veri: Record<string, string> = takip ? (muhabir ? { sahip: "planlama" } : { kime: muhabirId! }) : { sahip: "planlama", ...(muhabir ? {} : { elle: "1" }) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: takip ? "takipEklendi" : "oneriGeldi", oneriId: id, veri }));
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

export const oneriDurum = (ben: Kisi, id: string, yeni: "degerlendiriliyor" | "sonra" | "reddedildi" | "takip", gerekce = "") => {
  let d = getir();
  const o = oneriBul(d, id);
  if (!o || o.durum === "planaEklendi" || o.durum === "geriCekildi") return false;
  if (yeni !== "degerlendiriliyor" && acikGundemde(d, o)) return false;
  // Teklifte karar gönderende (Planlama dışından da olabilir); reddedilmez: değerlendirmeye ya da takibe alınır, geri çekilir.
  if (o.durum === "teklif" ? !teklifKarariVerebilir(ben, o) || yeni === "reddedildi" || yeni === "sonra" : !yapabilir(ben, "oneriDegerlendir")) return false;
  // Talimat reddedilmez ve ertelenmez; yalnız değerlendirmeye alınıp plana eklenir.
  if (o.talimatVeren && yeni !== "degerlendiriliyor") return false;
  // Takip muhabirin bölgesindeki süren gelişme: muhabiri olmayan (ajans, kurum) öneri takibe alınmaz.
  if (yeni === "takip" && !o.muhabirId) return false;
  d = { ...d, oneriler: d.oneriler.map((x) => (x.id === id ? { ...x, durum: yeni, gerekce: gerekce || x.gerekce } : x)) };
  const tip = yeni === "degerlendiriliyor" ? "oneriDegerlendirmede" : yeni === "sonra" ? "oneriSonra" : yeni === "takip" ? "oneriTakibeAlindi" : "oneriReddedildi";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, oneriId: id, veri: yeni === "takip" ? { kime: o.muhabirId! } : gerekce ? { gerekce } : undefined }));
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
  if (!o || !metin || !oneriDuzeltmeyeGider(ben, o) || acikGundemde(d, o)) return false;
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
  const takipte = g.bicim === TAKIP_BICIMI;
  if (!o || !oneriYenidenGonderebilir(ben, o) || !g.haberBasligi.trim() || !g.gelisme.trim() || (!takipte && !g.paketBasligi?.trim()) || !oneriSinirIcinde(g)) return false;
  const onceki: Record<string, string> = { haberBasligi: o.haberBasligi, gelisme: o.gelisme };
  if (o.paketBasligi) onceki.paketBasligi = o.paketBasligi;
  if (o.islemeFikri) onceki.islemeFikri = o.islemeFikri;
  if (o.gorselIsleme) onceki.gorselIsleme = o.gorselIsleme;
  let yeni: Oneri = {
    ...o,
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    islemeFikri: (!takipte && g.islemeFikri?.trim()) || undefined,
    gorselIsleme: (!takipte && g.gorselIsleme?.trim()) || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
    durum: "yeni",
  };
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

/*
 * Plana ya da gündeme yalnız karar bekleyen öneri girer. Yetki yalnız düğmede
 * soruluyordu: muhabire giden teklif, reddedilen, geri çekilen, düzeltmede
 * bekleyen ya da arşive düşmüş öneri eylemle plana girebiliyordu.
 */
const plandaKarara = (o: Oneri) => !["teklif", "reddedildi", "geriCekildi", "duzeltme"].includes(o.durum) && !oneriArsivde(o);

export const oneriPlanaEkle = (
  ben: Kisi,
  oneriId: string,
  g: { planId: string; baslikId?: string; yeniBaslik?: string; paketOlustur: boolean; muhabirId?: string },
): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const plan = planBul(d, g.planId);
  if (!o || !plan || !yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, plan)) return false;
  if (!plandaKarara(o)) return false;
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
  // "Live" haber paket değil, planın canlı yayını: çıktıda "مباشر" bölümünde; paket önerisi doğsaydı orada hiç görünmüyordu.
  const canliMi = o.bicim === "canli";
  // Takip paketsiz girer; planlamacı paket önerisiyle almak isterse başlığı takibin konusu.
  const strap = oneriPaketBasligi(o) ?? (g.paketOlustur && (o.bicim === TAKIP_BICIMI || o.durum === "takip") ? o.haberBasligi : undefined);
  const paketli = g.paketOlustur && !!strap && !canliMi;
  const canliAc = g.paketOlustur && canliMi;
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
      ekleyen: { kisiId: ben.id, zaman: simdi() },
    };
    d = { ...d, canliYayinlar: [...d.canliYayinlar, canli] };
  }

  d = {
    ...d,
    oneriler: d.oneriler.map((x) =>
      x.id === o.id ? { ...x, durum: "planaEklendi", baslikId, planId: plan.id, planTarihi: plan.tarih, paketId } : x,
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
      // Paketsiz giren muhabir haberi: muhabire "takip olarak plana eklendi" (paket beklenmiyor) bildirimi.
      veri: { ...(o.talimatVeren ? { tarih: plan.tarih, kime: o.talimatVeren } : { tarih: plan.tarih }), ...(oneriPaketsizGirer(o, { paketli, canli: canliAc, muhabirId }) && { takip: "1" }) },
    }),
  );
  return true;
};

/*
 * Plana paketsiz girmiş öneriye sonradan PKG: haber gelişince planlamacı
 * paket istemeye karar verebiliyor. Paket önerinin gelişmesinin başlığına,
 * "Plana ekle"deki PKG'nin aynısı (değerlendirmede, muhabire görev plan
 * onayında); öneri paketine bağlanır, "Plandan çıkar" onu da kaldırır.
 */
export const oneriyePaketEklenebilir = (ben: Kisi, d: Durum, o: Oneri): boolean => {
  const plan = o.durum === "planaEklendi" ? planBul(d, o.planId) : undefined;
  if (!plan || o.bicim === "canli" || !yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, plan)) return false;
  if (!d.gelismeler.some((g) => g.planId === plan.id && g.oneriId === o.id)) return false;
  return !d.paketler.some((p) => p.oneriId === o.id && p.planId === plan.id && p.durum !== "iptal");
};

export const oneriyePaketEkle = (ben: Kisi, oneriId: string, strap: string): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !strap.trim() || !oneriyePaketEklenebilir(ben, d, o)) return false;
  const plan = planBul(d, o.planId)!;
  const g = d.gelismeler.find((x) => x.planId === plan.id && x.oneriId === o.id)!;
  const muhabirId = o.muhabirId ?? g.onerenId;
  let kod: string;
  [kod, d] = yeniKod(d);
  const paketId = kimlik("p");
  const paket: Paket = {
    id: paketId,
    kod,
    planId: plan.id,
    planBaslikId: g.planBaslikId,
    baslik: strap.trim(),
    sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
    muhabirId,
    aciklama: o.gelisme,
    tur: o.tur,
    bicim: paketBicimi(o.bicim === TAKIP_BICIMI ? "pkg" : o.bicim),
    durum: "degerlendiriliyor",
    sahaGerekli: o.sahaGerekli,
    oneriId: o.id,
    oncelikli: o.talimatVeren ? true : undefined,
    notlar: [],
    olusturma: simdi(),
    guncelleme: simdi(),
  };
  d = { ...d, paketler: [paket, ...d.paketler], oneriler: d.oneriler.map((x) => (x.id === o.id ? { ...x, paketId } : x)) };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "paketOlusturuldu", paketId, planId: plan.id, oneriId: o.id }));
  return true;
};

/** Plana paketsiz (canlısız) giren muhabir haberi: bildirim ve onay sorusu "takip olarak" diyor. */
export const oneriPaketsizGirer = (o: Oneri, g: { paketli: boolean; canli: boolean; muhabirId?: string }) => !g.paketli && !g.canli && !!g.muhabirId && !o.talimatVeren;

/*
 * Plandan çıkan öneri yeniden öneri olur. Önerinin gelişmesi ve paketi
 * plandan silinince öneri "plana eklendi"de kalıyor, listede kararı da
 * açılmıyordu. Yalnız az önce silinen kayda bağlı öneriler bakılıyor: eski
 * kayıtta gelişmesi zaten olmayan öneri her silişte geri dönmesin.
 */
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
/*
 * Önerinin plandaki ve gündemdeki izini kaldırır (kaydetmez): plandan
 * çıkarma ve aşamaya geri alma aynı kuralla çalışsın. Yazılacak hareketin
 * plan ya da hafta bağı da döner.
 */
// `geriAlmaYetkisi`: aşamayı geri alma yetkisi olan (tam yönetici ya da yetki verdiği) planı düzenleyemese de geri alır.
const plandanCikarilmis = (
  d: Durum,
  ben: Kisi,
  o: Oneri,
  geriAlmaYetkisi = false,
): { d: Durum; bag: Pick<Hareket, "planId" | "haftaId" | "veri"> | null } | "yetkisiz" | "paketIlerledi" => {
  const yer = oneriYeri(d, o);
  if (!yer) return { d, bag: null };
  // Kesinleşmiş haftadan Next Day'e geçmiş öneri planından çıkıyor; haftanın kalemi kayıt olarak kalıyor.
  const haftadan = !!yer.hafta && yer.hafta.durum === "kesinlesti" && yer.planda;
  if (yer.hafta && !haftadan && (yer.hafta.durum === "kesinlesti" || (!geriAlmaYetkisi && !haftalikDuzenler(ben, yer.hafta)))) return "yetkisiz";
  if (yer.planda && (!yer.plan || (!geriAlmaYetkisi && !planIcerikDuzenler(ben, yer.plan)))) return "yetkisiz";
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
  const bag = yer.planda && yer.plan ? { planId: yer.plan.id, veri: { tarih: yer.plan.tarih } } : { haftaId: yer.hafta?.id, veri: { tarih: yer.hafta?.baslangic ?? "" } };
  return { d, bag };
};

export const oneriPlandanCikar = (ben: Kisi, oneriId: string): "tamam" | "yetkisiz" | "paketIlerledi" => {
  const d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !oneriYeri(d, o) || !yapabilir(ben, "oneriDegerlendir")) return "yetkisiz";
  const r = plandanCikarilmis(d, ben, o);
  if (typeof r === "string") return r;
  kaydet(hareketYaz(r.d, { kisiId: ben.id, tip: "oneriPlandanCikarildi", oneriId: o.id, ...r.bag }));
  return "tamam";
};

/*
 * Geri alma: planlamacı bir kararı geri alınca önerinin hangi aşamaya
 * döneceğini seçer; yalnız geçerli önceki aşamalar sunulur
 * (oneriPlanlari.ts → oneriGeriHedefleri). Plandaysa plandaki kayıtları
 * plandan çıkarmayla aynı kuralla kalkar; hepsi tek hareket, muhabire
 * bildirim. Ret gerekçesi kalkar (hareket geçmişinde duruyor).
 */
export const oneriAsamayaDon = (ben: Kisi, oneriId: string, hedef: OneriGeriHedefi): "tamam" | "yetkisiz" | "paketIlerledi" => {
  const d0 = getir();
  const o = oneriBul(d0, oneriId);
  if (!o || !geriAlabilir(ben) || !oneriGeriHedefleri(d0, o).includes(hedef)) return "yetkisiz";
  const r = plandanCikarilmis(d0, ben, o, true);
  if (typeof r === "string") return r;
  let d = r.d;
  d = {
    ...d,
    oneriler: d.oneriler.map((x) => {
      if (x.id !== o.id) return x;
      const { gerekce: _, ...y } = x;
      return { ...y, durum: hedef };
    }),
  };
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "oneriAsamayaDondu",
      oneriId: o.id,
      ...(r.bag && { planId: r.bag.planId, haftaId: r.bag.haftaId }),
      veri: { sonuc: hedef, onceki: o.durum, ...(o.muhabirId && { kime: o.muhabirId }) },
    }),
  );
  return "tamam";
};

/*
 * Öneri ikinci bir plana girecekse çoğaltılır: kopya baştan,
 * değerlendirmeden başlar; asıl öneri ilk planında kalır. İkisi birbirine
 * bağlı görünür (kopyaKaynagi). Takip, satırlar, arşiv ve geri bildirim
 * kopyaya geçmez: o ayrı bir haber.
 */
export const oneriKopyala = (ben: Kisi, oneriId: string): string | null => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !yapabilir(ben, "oneriDegerlendir") || !oneriYeri(d, o)) return null;
  const id = kimlik("o");
  const {
    planId: _p,
    planTarihi: _t,
    paketId: _k,
    baslikId: _b,
    gerekce: _g,
    arsiv: _a,
    arsivdenCikti: _ac,
    takip: _tk,
    takipBitis: _tb,
    takipBitiren: _tr,
    yalnizTakip: _y,
    geriBildirim: _gb,
    geriDonus: _gd,
    satirlar: _s,
    // Takip, e-posta yanıtı ve düzeltme turu asılın geçmişi; kopya yeni karar (CLAUDE.md: "geçmez").
    takipId: _ti,
    yanitId: _yi,
    duzeltmeNotu: _dn,
    duzeltmeSayisi: _ds,
    ...ic
  } = o;
  const kopya: Oneri = { ...ic, id, zaman: simdi(), durum: "degerlendiriliyor", kopyaKaynagi: o.id };
  d = { ...d, oneriler: [kopya, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriKopyalandi", oneriId: id, veri: { asil: o.id } }));
  return id;
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
  if (!o || !oneriSilebilir(ben)) return null;
  const { yeni, toplam } = temizle(d, { turler: ["oneriler"], idler: [id] });
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "oneriSilindi", veri: { baslik: o.haberBasligi, sayi: String(toplam) } }));
  return toplam;
};

/*
 * E-posta yanıtından doğmuş, karara girmemiş öneri planlamacının tek
 * basışıyla izsiz silinir (kullanıcı: muhabir "günaydın" yazınca öneri
 * oluyordu). Plana girmiş, reddedilmiş, takipteki öneriye dokunulmaz.
 */
export const epostaOnerisiSilinir = (ben: Kisi | undefined, d: Durum, o: Oneri) =>
  !!ben && !ben.pasif && (yapabilir(ben, "oneriDegerlendir") || oneriSilebilir(ben)) && o.kanal === "eposta" && (o.durum === "yeni" || o.durum === "degerlendiriliyor") && !oneriPlanKaydi(d, o);

export const epostaOnerisiSil = (ben: Kisi, id: string) => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !epostaOnerisiSilinir(ben, d, o)) return false;
  // Öneri, yazışması ve hareketleri gider; ayrıca "silindi" hareketi yazılmaz.
  const { yeni } = temizle(d, { turler: ["oneriler"], idler: [id] });
  // E-postanın kendisi (yanıt kaydı) kalır, "önerisi yok" sayılır: Gelen yanıtlar'da kopuk bağ kalmasın.
  kaydet({ ...yeni, yanitlar: yeni.yanitlar.map((y) => (y.id === o.yanitId ? { ...y, durum: "oneriYok" as const } : y)) });
  return true;
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
 * kişi Outlook'ta ya da telefonda gönderiyor). Kayıtta zamanı ve şablonu.
 */
export const geriBildirimKaydet = (ben: Kisi, oneriId: string, g: { sablonId?: string }) => {
  let d = getir();
  const o0 = oneriBul(d, oneriId);
  // Karar plandaki kayda göre; kaymış kopya da bu yazışla düzeliyor.
  const o = o0 && oneriPlanaGore(d, o0);
  if (!o || !geriBildirimGonderebilir(ben, o)) return false;
  const z = simdi();
  d = {
    ...d,
    oneriler: d.oneriler.map((x) =>
      x.id === o.id ? { ...o, geriDonus: true, geriBildirim: { zaman: z, kisiId: ben.id, ...(g.sablonId ? { sablonId: g.sablonId } : {}) } } : x,
    ),
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "geriDonus", oneriId: o.id, planId: o.planId, veri: { sonuc: o.durum, kime: o.muhabirId ?? "" } }));
  return true;
};

/*
 * "Tamamlandı" geri alınıyor (yanlışlıkla onaylanmış): paket yeniden onaylı.
 * Paket yalnız onayla kapandığı için onu yalnız onay yetkilisi açıyor
 * (muhabir onaylanmış sonucu bozamasın). Muhabirin teslim zamanı yalnız bu
 * kapanışta yazıldıysa
 * siliniyor (ölçüme yanlış teslim girmesin).
 */
export const tamamlamaGeriAl = (ben: Kisi, hedef: { paketId?: string }) => {
  const d = getir();
  const p = paketBul(d, hedef.paketId);
  if (!p || !tamamlamaGeriAlabilir(ben, d, p)) return false;
  const z = simdi();
  let yeni: Durum = d;
  // Onayla kapanan pakette teslim zamanı o kapanışın (işaretin anı): geri alınınca o da gidiyor.
  const onaylaKapandi = !!p && d.hareketler.some((h) => h.tip === "paketIsaretOnaylandi" && h.paketId === p.id && h.veri?.tur === "yapildi");
  if (p.durum === "tamamlandi" && !p.ozelId && yalnizPlanlama(d))
    yeni = paketGuncelle(yeni, p.id, (x) => {
      const { muhabirTeslimi, ...kalan } = x;
      return { ...kalan, durum: "onaylandi", guncelleme: z, ...(muhabirTeslimi && muhabirTeslimi !== x.guncelleme && !onaylaKapandi ? { muhabirTeslimi } : {}) };
    });
  const muhabirId = p.muhabirId;
  kaydet(
    hareketYaz(yeni, {
      kisiId: ben.id,
      tip: "tamamlamaGeriAlindi",
      ...(p.oneriId && { oneriId: p.oneriId }),
      paketId: p.id,
      ...(p.planId && { planId: p.planId }),
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
  kaydet({ ...d, geriBildirimSablonlari: [...yeni, ...takdirKaydi(d)] });
  return true;
};

export const geriBildirimSablonuSil = (ben: Kisi, id: string) => {
  if (!geriBildirimSablonuDuzenler(ben)) return false;
  const d = getir();
  kaydet({ ...d, geriBildirimSablonlari: [...sablonlar(d).filter((x) => x.id !== id), ...takdirKaydi(d)] });
  return true;
};

/* Takdir şablonu aynı koleksiyonda; geri bildirim şablonu yazılırken düşmesin. */
const takdirKaydi = (d: Durum) => (d.geriBildirimSablonlari ?? []).filter((x) => x.id === TAKDIR_SABLONU);

/* Takdir bildiriminin şablonu (Ayarlar): geri bildirim şablonlarıyla aynı yetki. Öbür şablonlar yerinde kalır. */
export const takdirSablonuKaydet = (ben: Kisi, s: Pick<GeriBildirimSablonu, "konu" | "govde" | "cc" | "bcc">) => {
  if (!geriBildirimSablonuDuzenler(ben) || !s.konu.trim() || !s.govde.trim()) return false;
  const d = getir();
  const kayit: GeriBildirimSablonu = { ...VARSAYILAN_TAKDIR, ...s };
  const oteki = (d.geriBildirimSablonlari ?? []).filter((x) => x.id !== TAKDIR_SABLONU);
  // Kayıtta geri bildirim şablonu yokken yalnız takdiri yazmak varsayılanları silmesin diye onlar da yazılır.
  kaydet({ ...d, geriBildirimSablonlari: [...(oteki.length ? oteki : VARSAYILAN_SABLONLAR), kayit] });
  return true;
};

/*
 * Takdir postası gitti: paket işaretlenir (sayfada "gönderildi", ikinci kez
 * seçili gelmez), hareket kaydına düşer. Postayı kapı gönderiyor; bu yalnız iz.
 */
export const takdirBildirildi = (ben: Kisi, paketId: string) => {
  const d = getir();
  const p = paketBul(d, paketId);
  if (!p || !yapabilir(ben, "planDuzenle")) return false;
  const yeni = paketGuncelle(d, paketId, (x) => ({ ...x, takdirBildirimi: { zaman: simdi(), kisiId: ben.id } }));
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "takdirBildirildi", paketId, planId: p.planId, ...(p.oneriId && { oneriId: p.oneriId }) }));
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
  // Kimlik haftadan (Next Day'deki gunPlaniKimligi gibi): bayat görüntüyle iki tarayıcı aynı haftayı açarsa aynı belgeyi yazsın, iki plan doğmasın.
  const id = `hf-${baslangic}`;
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
  aylikOlayId?: string;
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
    ...(g.aylikOlayId && { aylikOlayId: g.aylikOlayId }),
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
  if (!h || !o || !oneriHaftada(o, h) || !haftalikDuzenler(ben, h) || !yapabilir(ben, "oneriDegerlendir") || !plandaKarara(o)) return null;
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
    const kime = d.kisiler.filter((x) => yonetimdeMi(x) && onIncelemeci(x, k)).map((x) => x.id);
    const birim = d.kisiler.find((x) => !yonetimdeMi(x) && onIncelemeci(x, k))?.birim;
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
  const kalan = new Set(topluKabulAdaylari(h).map((k) => k.id));
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
      ...(kisiId !== SISTEM && { ekleyen: { kisiId, zaman: simdi() } }),
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
    // Görev haftalığın kesinleşmesiyle gidiyor; sistemin sonradan yaptığı aktarımda (SISTEM) künyeye yazılmaz.
    d = { ...d, paketler: [kunyeYaz(paket, "gorevlendiren", kisiId, simdi()), ...d.paketler] };
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
    // Masa kolları (ekonomi, program, spor) kendi birimine gidiyor; gerisi (feature, günü olmayan haber) bitince stokta bekliyor.
    stok: !MASA_KOLLARI.includes(k.tur) || undefined,
    oneriId: k.oneriId,
    haftalikKalemId: k.id,
    notlar: [],
    olusturma: simdi(),
    guncelleme: simdi(),
  };
  d = { ...d, paketler: [kunyeYaz(paket, "gorevlendiren", ben.id, simdi()), ...d.paketler] };
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
// `acikReddet`: gündeme hiç alınmamış haftalık öneriler reddedilsin mi; hayırsa açık kalır, sonraki haftaya ya da Next Day'e gidebilir.
export const haftalikKesinlestir = (ben: Kisi, haftaId: string, acikReddet = true) => {
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
      return acikReddet && (o.durum === "yeni" || o.durum === "degerlendiriliyor" || o.durum === "duzeltme") ? { ...o, durum: "reddedildi" } : o;
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

/*
 * Kaydı kaybolmuş planı aynı kimlikle geri açar: bağlı gelişme, canlı ve
 * paket kendiliğinden ona döner; başlıklar plan belgesindeydi, onları
 * "Başlığı kaybolmuş N kayıt" şeridi geri koyar (kayipBaslikGeriGetir).
 * Ekip önceki planın şablonundan, "dünden" işaretli.
 */
export const kayipPlaniGeriGetir = (ben: Kisi, id: string): boolean => {
  let d = getir();
  const k = kayipPlanlar(d).find((x) => x.id === id);
  if (!k || !yapabilir(ben, "planDuzenle")) return false;
  const kaynak = oncekiPlan(d, k.tarih);
  const plan: NextDayPlan = {
    id,
    tarih: k.tarih,
    durum: "taslak",
    ekip: (kaynak?.ekip ?? []).map((e) => ({ ...e, onceki: true as const })),
    gorevlendirmeler: [],
    hazirPaketler: [],
    basliklar: [],
    olusturan: ben.id,
    olusturma: simdi(),
  };
  d = { ...d, planlar: [plan, ...d.planlar] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "planGeriGetirildi", planId: id, veri: { tarih: k.tarih } }));
  return true;
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
        // Gelişmedeki gibi öneri ve Weekly bağı kaynakta kalıyor: taşınan canlı öneriyi her gün "bugünün planında" tutuyordu.
        .map(({ oneriId: _o, haftalikKalemId: _h, ...c }) => ({ ...c, id: turet(id, c.id), planId: id, planBaslikId: c.planBaslikId ? pbEsle.get(c.planBaslikId) : undefined, onceki: true, devir: true }))
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
/*
 * Plan onaylanınca planda başlığa (ya da başlığın gelişmesine) eklenen her
 * muhabire "şu başlığa eklendin" ve planlamacının notu gidiyor; muhabir
 * planı okuyamıyor (kısıtlı), bilgi hareketin içinde taşınıyor ve
 * Takiplerim'de görünüyor. Onay geri alınıp yeniden verilirse aynı başlık,
 * aynı notla ikinci kez gitmiyor.
 */
const planMuhabirBildirimleri = (d: Durum, planId: string, ben: Kisi): Durum => {
  const plan = planBul(d, planId);
  if (!plan) return d;
  const gidecek = new Map<string, { kisiId: string; pbId: string; not: string }>();
  for (const pb of plan.basliklar) {
    for (const m of pb.muhabirler) gidecek.set(`${pb.id}|${m.kisiId}`, { kisiId: m.kisiId, pbId: pb.id, not: m.not?.trim() ?? "" });
    for (const g of d.gelismeler.filter((x) => x.planId === planId && x.planBaslikId === pb.id))
      for (const m of gelismeMuhabirleri(g)) if (!gidecek.has(`${pb.id}|${m.kisiId}`)) gidecek.set(`${pb.id}|${m.kisiId}`, { kisiId: m.kisiId, pbId: pb.id, not: "" });
  }
  for (const x of gidecek.values()) {
    const gitti = d.hareketler.some((h) => h.tip === "planaMuhabirEklendi" && h.planId === planId && h.veri?.pb === x.pbId && h.veri?.kime === x.kisiId && (h.veri?.not ?? "") === x.not);
    if (gitti || x.kisiId === ben.id) continue;
    const pb = plan.basliklar.find((b) => b.id === x.pbId)!;
    d = hareketYaz(d, { kisiId: ben.id, tip: "planaMuhabirEklendi", planId, veri: { kime: x.kisiId, muhabir: x.kisiId, tarih: plan.tarih, baslik: baslikBul(d, pb.baslikId)?.ad ?? "", pb: x.pbId, ...(x.not ? { not: x.not } : {}) } });
  }
  return d;
};

export const planDurum = (ben: Kisi, planId: string, yeni: PlanDurum) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan) return false;
  const gecerli =
    (yeni === "toplantida" && plan.durum === "taslak" && planAdimiYapabilir(ben, "ndToplanti")) ||
    (yeni === "taslak" && plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndToplanti")) ||
    (yeni === "onayli" && plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndOnay")) ||
    // Devir Newsdesk'e geçiştir: Newsdesk sistemde değilken plan devredilirse onaylı paketler Planlama'nın
    // "Yapıldı / onay" yolundan çıkıp üretim akışına düşüyor, orada sahipsiz kalıyordu.
    (yeni === "devralindi" && plan.durum === "onayli" && !yalnizPlanlama(d) && planAdimiYapabilir(ben, "ndDevral")) ||
    // Yanlış onayın dönüşü: plan toplantıya döner, onayla kabul edilen paketler kabullü kalır (muhabire görev gitmiş olabilir).
    (yeni === "toplantida" && plan.durum === "onayli" && planAdimiYapabilir(ben, "ndOnayGeri"));
  if (!gecerli) return false;

  d = planGuncelle(d, planId, (p) => ({ ...p, durum: yeni }));
  const paketler = d.paketler.filter((p) => p.planId === planId);

  if (yeni === "onayli") {
    // Toplantı planı onayladı: dünden gelen ile bugün eklenen ayrımı artık iş görmüyor.
    const sade = <T extends { onceki?: true }>(x: T): T => (x.onceki ? { ...x, onceki: undefined } : x);
    d = planGuncelle(d, planId, (p) => ({ ...p, ekip: p.ekip.map(sade), oncekiHareketler: undefined, basliklar: p.basliklar.map((b) => ({ ...b, muhabirler: b.muhabirler.map(sade) })) }));
    d = { ...d, gelismeler: d.gelismeler.map((g) => (g.planId === planId ? sade(g) : g)), canliYayinlar: d.canliYayinlar.map((c) => (c.planId === planId ? sade(c) : c)) };
    for (const p of paketler.filter((x) => x.durum === "taslak" || x.durum === "degerlendiriliyor")) {
      // Kararsız paket onayla kabul sayılıyor: muhabire görev planı onaylayandan.
      d = paketGuncelle(d, p.id, (x) => kunyeYaz({ ...x, durum: "onaylandi" }, "gorevlendiren", ben.id, simdi()));
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
  if (yeni === "onayli") d = planMuhabirBildirimleri(d, planId, ben);
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
      if (!p || !hazirSecilebilir(p)) continue;
      d = paketGuncelle(d, id, (x) => ({ ...x, yayinlandi: { planId, tarih: plan.tarih } }));
      d = hareketYaz(d, { kisiId: ben.id, tip: "stokYayinlandi", paketId: id, planId, veri: { tarih: plan.tarih } });
    }
  }
  const tip = yeni === "toplantida" && plan.durum === "onayli" ? "planOnayiGeriAlindi" : yeni === "toplantida" ? "planToplantida" : yeni === "onayli" ? "planOnaylandi" : yeni === "devralindi" ? "planDevralindi" : "planTaslaga";
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
// Belgede ekipteki kişi değişiyor; görev ve vardiya yerinde kalıyor. Zaten ekipte olan kişiye geçilmez, satır çoğalırdı.
export const ekipKisiDegistir = (ben: Kisi, planId: string, eskiId: string, yeniId: string) =>
  eskiId !== yeniId &&
  planIcerik(ben, planId, (p) =>
    p.ekip.some((e) => e.kisiId === yeniId) ? p : { ...p, ekip: p.ekip.map((e) => (e.kisiId === eskiId ? { ...e, kisiId: yeniId, onceki: undefined } : e)) },
  );
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

/** Plana yalnız stoktaki ya da masanın bitirdiği (henüz yayınlanmamış) paket seçiliyor. */
export const hazirPaketEkle = (ben: Kisi, planId: string, id: string) => {
  const p = paketBul(getir(), id);
  if (!p || !hazirSecilebilir(p)) return false;
  return planIcerik(ben, planId, (x) => ({ ...x, hazirPaketler: ekle(x.hazirPaketler, id) }));
};
/*
 * Planın beklenen paketi (PKG) aslında yapılmış: stok paketi oluyor.
 * Paket tamamlandı sayılır, Stok'un "Üretilmiş paketler"ine düşer (kullanıcı:
 * Next Day yapılırken stok diye işaretlenen paket oraya gitsin; önce bu
 * planın hazır paketlerine ekleniyordu), istenen gün "Hazır paketler"den
 * seçilir. Başlıktan ayrılır (iki yerde basılmasın) ya da planlamacı isterse
 * başlığın altında kalır. Üretimdeki ve iptal paket alınmaz: akışı ya da kararı var.
 */
export const paketStogaAlinabilir = (p: Paket) => !!p.planId && !p.stok && !p.ozelId && ["taslak", "degerlendiriliyor", "onaylandi", "tamamlandi"].includes(p.durum) && !p.yayinlandi;
/* Başlığın altında kalsın mı planlamacının seçimi: kurum bazen paketi haberinin yanında da görmek istiyor; beklenenlerde artık yok. */
export const paketStogaAl = (ben: Kisi, paketId: string, baslikta = false) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const plan = planBul(d, p?.planId);
  if (!p || !plan || !paketStogaAlinabilir(p) || !planIcerikDuzenler(ben, plan)) return false;
  d = paketGuncelle(d, p.id, (x) => ({ ...x, stok: true, durum: "tamamlandi", planBaslikId: baslikta ? x.planBaslikId : undefined, isaret: undefined }));
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "paketStogaAlindi", paketId: p.id, planId: plan.id }));
  return true;
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
/*
 * Başlığı kaybolmuş kayıtları (kayipKayitlar.ts) seçilen başlığa geri
 * bağlıyor. Başlık planda yoksa kayıtların hâlâ gösterdiği kimlikle geri
 * konuyor, kayıtlara dokunulmuyor; planda varsa kayıtlar o başlığa geçiyor.
 */
export const kayipBaslikGeriGetir = (ben: Kisi, planId: string, pbId: string, g: { baslikId?: string; yeniBaslik?: string }) => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return false;
  const grup = kayipBasliklar(d, plan).find((x) => x.pbId === pbId);
  if (!grup) return false;
  let baslikId = g.baslikId;
  if (!baslikId && g.yeniBaslik?.trim()) [baslikId, d] = dosyaAc(d, g.yeniBaslik);
  if (!baslikId) return false;
  const muhabirler = kayipMuhabirleri(grup);
  const hedef = plan.basliklar.find((b) => b.baslikId === baslikId);
  const muhabirEkle = (b: PlanBasligi) => {
    const yeni = muhabirler.filter((m) => !b.muhabirler.some((x) => x.kisiId === m));
    return yeni.length ? { ...b, muhabirler: [...b.muhabirler, ...yeni.map((kisiId) => ({ kisiId }))] } : b;
  };
  if (hedef) {
    const tasi = <T extends { planId?: string; planBaslikId?: string }>(x: T): T => (x.planId === planId && x.planBaslikId === pbId ? { ...x, planBaslikId: hedef.id } : x);
    d = {
      ...d,
      gelismeler: d.gelismeler.map(tasi),
      paketler: d.paketler.map(tasi),
      canliYayinlar: d.canliYayinlar.map(tasi),
    };
    d = planGuncelle(d, planId, (p) => ({ ...p, basliklar: p.basliklar.map((b) => (b.id === hedef.id ? muhabirEkle(b) : b)) }));
  } else {
    d = planGuncelle(d, planId, (p) => ({ ...p, basliklar: [...p.basliklar, muhabirEkle({ id: pbId, baslikId: baslikId!, muhabirler: [] })] }));
  }
  // Öneriden gelen kayıt önerinin dosyasıyla bağlı kalsın: başka başlık seçildiyse öneri de oraya.
  const oneriler = new Set([...grup.gelismeler, ...grup.paketler, ...grup.canlilar].map((x) => x.oneriId).filter(Boolean));
  if (oneriler.size) d = { ...d, oneriler: d.oneriler.map((o) => (oneriler.has(o.id) && o.planId === planId && o.baslikId !== baslikId ? { ...o, baslikId } : o)) };
  kaydet(d);
  return true;
};

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

/* Sürükle-bırak: başlık bırakıldığı başlığın yerine geçer (aşağı inerken arkasına, yukarı çıkarken önüne); katma "+" menüsünde. */
export const planBaslikYerine = (ben: Kisi, planId: string, pbId: string, hedefId: string) =>
  planIcerik(ben, planId, (p) => {
    const i = p.basliklar.findIndex((b) => b.id === pbId);
    const j = p.basliklar.findIndex((b) => b.id === hedefId);
    if (i < 0 || j < 0 || i === j) return p;
    const yeni = [...p.basliklar];
    const [b] = yeni.splice(i, 1);
    yeni.splice(j, 0, b);
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

/** Başlıkta canlı yayın alınabilir ("LIVE"); muhabirden bağımsız. */
export const planBaslikLive = (ben: Kisi, planId: string, pbId: string, acik: boolean) =>
  planIcerik(ben, planId, (p) => {
    const pb = p.basliklar.find((b) => b.id === pbId);
    if (!pb || !!pb.live === acik) return p;
    return { ...p, basliklar: p.basliklar.map((b) => (b.id === pbId ? { ...b, live: acik ? (true as const) : undefined, devir: undefined } : b)) };
  });

export const planMuhabirTasi = (ben: Kisi, planId: string, pbId: string, kisiId: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => komsuylaDegis(m, (x) => x.kisiId === kisiId, () => true, yon) ?? m));

export const planMuhabirGuncelle = (ben: Kisi, planId: string, pbId: string, kisiId: string, g: { yer?: string; saat?: string; not?: string }) =>
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
  /*
   * Öneriden gelen gelişmenin PKG'si ve muhabiri de onunla gider: hedef
   * başlıksız متابعات olunca ikisi eski başlıkta kalıyordu. Muhabir eski
   * başlıktan yalnız orada onun başka işi (önerisi, paketi) yoksa çıkar.
   */
  if (g.oneriId) {
    const eskiPb = g.planBaslikId;
    const o = oneriBul(d, g.oneriId);
    d = {
      ...d,
      oneriler: hedef ? d.oneriler.map((x) => (x.id === g.oneriId && x.baslikId !== hedef.baslikId ? { ...x, baslikId: hedef.baslikId } : x)) : d.oneriler,
      paketler: d.paketler.map((p) => (p.oneriId === g.oneriId && p.planId === plan.id && p.planBaslikId === eskiPb && p.durum !== "iptal" ? { ...p, planBaslikId: hedef?.id } : p)),
    };
    const m = o?.muhabirId;
    if (m && eskiPb) {
      const kaldi =
        d.gelismeler.some((x) => x.planId === plan.id && x.planBaslikId === eskiPb && x.oneriId && x.oneriId !== g.oneriId && oneriBul(d, x.oneriId)?.muhabirId === m) ||
        d.paketler.some((p) => p.planId === plan.id && p.planBaslikId === eskiPb && p.durum !== "iptal" && p.muhabirId === m);
      const eski = plan.basliklar.find((b) => b.id === eskiPb);
      const pm = eski?.muhabirler.find((x) => x.kisiId === m);
      d = planGuncelle(d, plan.id, (pl) => ({
        ...pl,
        basliklar: pl.basliklar.map((b) => {
          if (b.id === eskiPb && pm && !kaldi) return { ...b, muhabirler: b.muhabirler.filter((x) => x.kisiId !== m) };
          if (hedef && b.id === hedef.id && pm && !b.muhabirler.some((x) => x.kisiId === m)) return { ...b, muhabirler: [...b.muhabirler, { kisiId: m, ...(pm.yer && { yer: pm.yer }) }] };
          return b;
        }),
      }));
    }
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

/*
 * Öneriden gelen gelişmeyi ya da canlıyı silmek öneriyi değerlendirmeye
 * döndürüyor (oneriBaglariniTazele), yani "Plandan çıkar"la aynı sonuç; o
 * karar yetkisi istiyor. Devralınmış planda operasyon yetkisiyle Newsdesk
 * öneriyi sessizce geri çevirebiliyordu.
 */
const oneriBagiSilinir = (ben: Kisi, oneriId?: string) => !oneriId || yapabilir(ben, "oneriDegerlendir");

export const gelismeSil = (ben: Kisi, id: string) => {
  const d = getir();
  const g = d.gelismeler.find((x) => x.id === id);
  const plan = planBul(d, g?.planId);
  if (!g || !plan || !planOperasyonDuzenler(ben, plan) || !oneriBagiSilinir(ben, g.oneriId)) return false;
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
    kaydet({ ...d, canliYayinlar: [...d.canliYayinlar, { ...c, id: kimlik("cy"), ekleyen: { kisiId: ben.id, zaman: simdi() } }] });
  }
  return true;
};

export const canliSil = (ben: Kisi, id: string) => {
  const d = getir();
  const c = d.canliYayinlar.find((x) => x.id === id);
  const plan = planBul(d, c?.planId);
  if (!c || !plan || !planOperasyonDuzenler(ben, plan) || !oneriBagiSilinir(ben, c.oneriId)) return false;
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
  /** Formda girilen not; paketin notlarından biri olur, planda satırın sonunda parantez içinde (paketNotEki). */
  not?: string;
}

/* Formun notu paketin notlarında kendi kimliğiyle: düzenlemede o not değişir, öbür notlar (yönetici, durak) kalır. */
export const formNotuKimligi = (paketId: string) => `nf-${paketId}`;
const formNotuyla = (notlar: Paket["notlar"], paketId: string, metin: string | undefined, ben: Kisi): Paket["notlar"] => {
  const id = formNotuKimligi(paketId);
  const eski = notlar.find((n) => n.id === id);
  const m = metin?.trim() ?? "";
  if ((eski?.metin ?? "") === m) return notlar;
  const kalan = notlar.filter((n) => n.id !== id);
  return m ? [...kalan, { id, kisiId: ben.id, zaman: simdi(), metin: m }] : kalan;
};

/* Yeni paket listelerde önde (en yeni üstte); belgede "altına ekle" denince o satırın arkasına giriyor. */
export const paketKaydet = (ben: Kisi, g: PaketGirdisi, sonra?: string): string | null => {
  let d = getir();
  const plan = planBul(d, g.planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return null;
  g = { ...g, muhabirTbc: g.muhabirTbc && !g.muhabirId ? true : undefined };
  const { not: formNotu, ...alanlar } = g;
  if (g.id) {
    const id = g.id;
    kaydet(paketGuncelle(d, id, (p) => ({ ...p, ...alanlar, muhabirTbc: g.muhabirTbc || undefined, id, notlar: formNotuyla(p.notlar ?? [], id, formNotu, ben) })));
    return id;
  }
  let kod: string;
  [kod, d] = yeniKod(d);
  const id = kimlik("p");
  const paket: Paket = { ...alanlar, muhabirTbc: g.muhabirTbc || undefined, id, kod, durum: "taslak", notlar: formNotuyla([], id, formNotu, ben), olusturma: simdi(), guncelleme: simdi() };
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
  // Özel yayın dışındaki paket yalnız "Yapıldı" ve onayla kapanıyor; eylem de o yolu atlatmasın.
  if (!p || !p.ozelId || !paketTamamlayabilir(ben, p, d)) return false;
  const z = simdi();
  const muhabirKendisi = ben.id === p.muhabirId;
  // Künye: işi yapan değil de Planlama kapattıysa onu teslim alan onaylayan.
  const yapanKendisi = ben.id === (p.muhabirId ?? p.hazirlayanId);
  let yeni = paketGuncelle(d, id, (x) => {
    const y: Paket = { ...x, durum: "tamamlandi", adim: undefined, guncelleme: z, ...(muhabirKendisi && !x.muhabirTeslimi ? { muhabirTeslimi: z } : {}) };
    return yapanKendisi ? y : kunyeYaz(y, "onaylayan", ben.id, z);
  });
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

/*
 * Paketin sonucu: muhabir "yapıldı" ya da sebebiyle "yapılmadı" der, yetkili
 * onaylar ya da geri çevirir. Yetkilinin kendi işareti onay beklemez.
 * Onaylanan yapıldı paketi kapatır (muhabirin teslimi işaretin anı, ölçüme
 * girer), yapılmadı paketi sebebiyle
 * iptal eder (Yapılmayan paketler). Geri çevrilen işaret silinir, paket
 * yeniden muhabirin işlerinde.
 */
const isaretUygula = (d: Durum, ben: Kisi, p: Paket, kabul: boolean): Durum => {
  const i = p.isaret;
  if (!i || p.durum !== "onaylandi") return d;
  const z = simdi();
  const yeni = paketGuncelle(d, p.id, (x) => {
    const { isaret: _, ...y } = x;
    if (!kabul) return { ...y, guncelleme: z };
    if (i.tur === "yapilmadi") return { ...y, durum: "iptal", adim: undefined, yapilmadi: { sebep: i.sebep ?? "", zaman: i.zaman, kisiId: i.kisiId, onaylayan: ben.id }, guncelleme: z };
    return kunyeYaz({ ...y, durum: "tamamlandi", adim: undefined, guncelleme: z, ...(i.kisiId === x.muhabirId && !x.muhabirTeslimi ? { muhabirTeslimi: i.zaman } : {}) }, "onaylayan", ben.id, z);
  });
  return hareketYaz(yeni, { kisiId: ben.id, tip: kabul ? "paketIsaretOnaylandi" : "paketIsaretGeriCevrildi", paketId: p.id, planId: p.planId, veri: { tur: i.tur, ...(p.muhabirId && { kime: p.muhabirId }) } });
};

export const paketIsaretle = (ben: Kisi, id: string, tur: "yapildi" | "yapilmadi", sebep = "") => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p || !paketIsaretleyebilir(ben, p, d) || (tur === "yapilmadi" && !sebep.trim())) return false;
  const isaret = { tur, zaman: simdi(), kisiId: ben.id, ...(tur === "yapilmadi" && { sebep: sebep.trim() }) };
  let yeni = paketGuncelle(d, id, (x) => ({ ...x, isaret, guncelleme: simdi() }));
  // Onay bekleyen işaret onaylayabilecek kişilere gidiyor: yetki Planlama dışından birine de verilmiş olabilir.
  const onaylayanlar = d.kisiler.filter((k) => k.id !== ben.id && paketIsaretOnaylayabilir(k)).map((k) => k.id);
  yeni = hareketYaz(yeni, { kisiId: ben.id, tip: "paketIsaretlendi", paketId: id, planId: p.planId, veri: { tur, ...(onaylayanlar.length ? { kime: onaylayanlar.join(",") } : { sahip: "planlama" }) } });
  if (paketIsaretOnaylayabilir(ben)) yeni = isaretUygula(yeni, ben, paketBul(yeni, id)!, true);
  kaydet(yeni);
  return true;
};

export const paketIsaretKarar = (ben: Kisi, id: string, kabul: boolean) => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p?.isaret || p.durum !== "onaylandi" || !paketIsaretOnaylayabilir(ben)) return false;
  kaydet(isaretUygula(d, ben, p, kabul));
  return true;
};

/*
 * Onaylı paketi başka muhabire verme (yetki "baskaMuhabire"): paket yeni
 * muhabire planlamacının teklifi olarak gider ve teklif akışına girer;
 * eski paket iptal, `devredildi` iziyle eski muhabirin geçmişinde kalır.
 * Haber planda (önerinin gelişmesi) yerinde.
 */
export const paketBaskaMuhabireVer = (ben: Kisi, paketId: string, muhabirId: string): string | null => {
  let d = getir();
  const p = paketBul(d, paketId);
  const m = kisiBul(d, muhabirId);
  if (!p || !baskaMuhabireVerebilir(ben, p) || !m || m.pasif || m.id === p.muhabirId || m.birim !== "muhabir") return null;
  const asil = oneriBul(d, p.oneriId);
  const plan = planBul(d, p.planId);
  const z = simdi();
  const id = kimlik("o");
  const teklif: Oneri = {
    id,
    muhabirId: m.id,
    giren: ben.id,
    yon: "muhabire",
    ulke: sehirUlkesi(m.sehir, d),
    haberBasligi: asil?.haberBasligi ?? p.baslik,
    gelisme: p.aciklama || asil?.gelisme || p.baslik,
    paketBasligi: p.baslik,
    tur: p.tur,
    ...(p.bicim && { bicim: p.bicim }),
    sahaGerekli: p.sahaGerekli,
    zaman: z,
    kanal: "sistem",
    ...((plan?.tarih ?? asil?.hedefTarih) && { hedefTarih: plan?.tarih ?? asil?.hedefTarih }),
    durum: "teklif",
    kaynakPaketId: p.id,
  };
  d = paketGuncelle(d, p.id, (x) => ({ ...x, durum: "iptal", adim: undefined, devredildi: { muhabirId: m.id, oneriId: id, zaman: z, kisiId: ben.id }, guncelleme: z }));
  d = { ...d, oneriler: [teklif, ...d.oneriler] };
  d = hareketYaz(d, { kisiId: ben.id, tip: "paketBaskaMuhabire", paketId: p.id, planId: p.planId, veri: { kime: p.muhabirId! } });
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriMuhabireGonderildi", oneriId: id, veri: { kime: m.id, muhabir: m.id } }));
  return id;
};

/* Yeni öneri düzenine geçiş (gecis.ts): yalnız tam yönetici, önizlemeden sonra; tek hareket. "Plana eklendi" eşitlemesi sonra kendiliğinden. */
export const yeniDuzeneGecir = (ben: Kisi): number | null => {
  if (!ben.hesapYoneticisi) return null;
  const d = getir();
  const n = gecisOnizlemesi(d).toplam;
  if (!n) return 0;
  const yeni = gecisUygula(d, ben.id, simdi());
  kaydet(hareketYaz({ ...yeni, oneriler: yeni.oneriler.map((o) => oneriPlanaGore(yeni, o)) }, { kisiId: ben.id, tip: "gecisUygulandi", veri: { sayi: String(n) } }));
  return n;
};

/*
 * Sistemin açılış işi: öneriye çevrilmeyen takip son gelişmesinden iki gün
 * sonra izleriyle siliniyor (kurum kararı; arşive düşmüyor).
 */
export const eskiTakipleriSil = (): number => {
  const d = getir();
  const b = bugun();
  const eski = d.oneriler.filter((o) => o.durum === "takip" && !o.arsiv && gunEkle(oneriSonGunu(o), TAKIP_SILME_GUNU) < b).map((o) => o.id);
  // Öneriye dönüşmüş takip: gelişme satırları öneriye geçer, takip izleriyle gider.
  const cevrilen = new Map<string, Oneri>();
  for (const o of d.oneriler) {
    const hedef = takibinOnerisi(d, o);
    if (hedef && !eski.includes(o.id)) cevrilen.set(o.id, hedef);
  }
  const idler = [...eski, ...cevrilen.keys()];
  if (!idler.length) return 0;
  const satirlar = new Map<string, NonNullable<Oneri["satirlar"]>>();
  for (const [tid, h] of cevrilen) {
    const t = d.oneriler.find((o) => o.id === tid);
    if (t?.satirlar?.length) satirlar.set(h.id, [...(satirlar.get(h.id) ?? h.satirlar ?? []), ...t.satirlar].sort((x, y) => x.zaman.localeCompare(y.zaman)));
  }
  const katilmis = satirlar.size ? { ...d, oneriler: d.oneriler.map((o) => (satirlar.has(o.id) ? { ...o, satirlar: satirlar.get(o.id) } : o)) } : d;
  kaydet(temizle(katilmis, { turler: ["oneriler"], idler }).yeni);
  return idler.length;
};

/*
 * Sistemin açılış işi: eski düzende öneri kalmasın. Ayarlar'daki geçişle
 * aynı kural; eski biçimde bir şey yoksa hiçbir şey yazmaz.
 */
export const eskiOnerileriCevir = (): number => {
  const d = getir();
  const n = gecisOnizlemesi(d).toplam;
  if (!n) return 0;
  const yeni = gecisUygula(d, SISTEM, simdi());
  kaydet(hareketYaz({ ...yeni, oneriler: yeni.oneriler.map((o) => oneriPlanaGore(yeni, o)) }, { kisiId: SISTEM, tip: "gecisUygulandi", veri: { sayi: String(n) } }));
  return n;
};

/** Günün notunun sayım başlangıcı (tam yönetici); boş tarih kaldırır. */
export const sayimBaslangiciKaydet = (ben: Kisi, tarih: string) => {
  if (!ben.hesapYoneticisi) return false;
  if (tarih && !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return false;
  const d = getir();
  kaydet({ ...d, sayimBaslangici: tarih || undefined });
  return true;
};

/** Newsdesk'in sisteme katılıp katılmadığı (tam yönetici); yarım paketler kendi yolunda kalıyor. */
export const newsdeskDevredeKaydet = (ben: Kisi, devrede: boolean) => {
  if (!ben.hesapYoneticisi) return false;
  const d = getir();
  kaydet({ ...d, newsdeskDevrede: devrede || undefined });
  return true;
};

/*
 * Onaylanmış (ya da Weekly'den onaylı gelmiş) paketin yalnız metni: Strap ve
 * açıklama. Durum, muhabir, akış ve onay olduğu gibi kalır; paket formu
 * yalnız taslakta açılıyor, onaydan sonra yazım düzeltilemiyordu.
 */
export const paketMetniDuzenlenebilir = (ben: Kisi | undefined, d: Durum, p: Paket): boolean => {
  if (!ben || p.ozelId || p.durum !== "onaylandi" || !yapabilir(ben, "planDuzenle")) return false;
  const plan = p.planId ? planBul(d, p.planId) : undefined;
  return !plan || plan.durum !== "devralindi";
};

export const paketMetniDuzenle = (ben: Kisi, id: string, g: { baslik: string; aciklama: string }): boolean => {
  const d = getir();
  const p = d.paketler.find((x) => x.id === id);
  if (!p || !g.baslik.trim() || !paketMetniDuzenlenebilir(ben, d, p)) return false;
  if (p.baslik === g.baslik.trim() && (p.aciklama ?? "") === g.aciklama) return true;
  kaydet(paketGuncelle(d, id, (x) => ({ ...x, baslik: g.baslik.trim(), aciklama: g.aciklama, guncelleme: simdi() })));
  return true;
};

export const paketDurum = (ben: Kisi, id: string, yeni: "degerlendiriliyor" | "onaylandi" | "iptal") => {
  let d = getir();
  const p = paketBul(d, id);
  if (!p || !yapabilir(ben, "paketDegerlendir") || ["tamamlandi", "iptal"].includes(p.durum)) return false;
  if (yeni !== "iptal" && !["taslak", "degerlendiriliyor"].includes(p.durum)) return false;
  // İptalde bekleyen işaret de gidiyor: kuyrukta kalıp onaylanınca iptal paketi "tamamlandı"ya çeviriyordu.
  d = paketGuncelle(d, id, (x) => {
    const { isaret: _i, ...kalan } = x;
    // Toplantıda "Kabul et": muhabire görev o an gidiyor, görevlendiren kabul eden.
    return yeni === "iptal" ? { ...kalan, durum: yeni, adim: undefined } : yeni === "onaylandi" ? kunyeYaz({ ...x, durum: yeni }, "gorevlendiren", ben.id, simdi()) : { ...x, durum: yeni };
  });
  const tip = yeni === "degerlendiriliyor" ? "paketDegerlendirmede" : yeni === "onaylandi" ? "paketOnaylandi" : "paketIptal";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip, paketId: id, planId: p.planId }));
  return true;
};

/*
 * Toplantıda paket başına ret: paket iptal olur ama silinmez, "reddedildi"
 * işaretiyle kalır (Reddedilen paketler listesi, muhabirin sayfası).
 * Haber planda paketsiz kalır; önerinin gelişmesi yerinde. Muhabire bildirim.
 */
export const paketReddet = (ben: Kisi, id: string) => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p || p.ozelId || !yapabilir(ben, "paketDegerlendir") || !["taslak", "degerlendiriliyor"].includes(p.durum)) return false;
  const yeni = paketGuncelle(d, id, (x) => ({ ...x, durum: "iptal", adim: undefined, reddedildi: { zaman: simdi(), kisiId: ben.id }, guncelleme: simdi() }));
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "paketReddedildi", paketId: id, planId: p.planId, oneriId: p.oneriId, ...(p.muhabirId && { veri: { kime: p.muhabirId } }) }));
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

/*
 * Plansız görev (kullanıcı): Planlama (ileri tarihe de) ve Newsdesk (yalnız
 * o gün) muhabire bir plana eklemeden paket görevi verir; paket stokta
 * takip edilir, muhabir "Yapıldı"yla kapatır. Ekonomi, Program, Spor aynı
 * formla talep eder; talep Planlama onaylayınca göreve döner.
 */
export interface PaketGorevGirdisi {
  muhabirId: string;
  /** Strap (Arapça). */
  baslik: string;
  aciklama: string;
  bicim?: Bicim;
  /** Görevin günü (paketin `sonTarih`'i). */
  tarih: string;
  yer?: string;
  not?: string;
}

const gorevPaketi = (d: Durum, ben: Kisi, g: PaketGorevGirdisi, ek: Partial<Paket>): [Paket, Durum] | null => {
  const m = kisiBul(d, g.muhabirId);
  if (!m || m.pasif || !g.baslik.trim() || !g.tarih) return null;
  let kod: string;
  [kod, d] = yeniKod(d);
  const id = kimlik("p");
  const z = simdi();
  // Masadan gelen talep kendi kolunda (Output müdürü ekonomiyi görsün), ama masa akışına değil stoğa (masaPaketi).
  const b = izinBirimi(ben.birim);
  const tur: IcerikTuru = (MASA_KOLLARI as readonly string[]).includes(b) ? (b as IcerikTuru) : "haber";
  const paket: Paket = {
    id,
    kod,
    baslik: g.baslik.trim(),
    aciklama: g.aciklama.trim(),
    sehir: m.sehir,
    ...(g.yer?.trim() && { yer: g.yer.trim() }),
    muhabirId: m.id,
    tur,
    ...(g.bicim && { bicim: g.bicim }),
    sonTarih: g.tarih,
    sahaGerekli: false,
    stok: true,
    durum: "taslak",
    notlar: formNotuyla([], id, g.not, ben),
    olusturma: z,
    guncelleme: z,
    ...ek,
  };
  return [paket, { ...d, paketler: [paket, ...d.paketler] }];
};

export const paketGorevVer = (ben: Kisi, g: PaketGorevGirdisi): string | null => {
  const d = getir();
  if (!paketGorevVerebilir(ben) || !gorevTarihiUygun(ben, g.tarih)) return null;
  const z = simdi();
  const k = gorevPaketi(d, ben, g, { durum: "onaylandi", gorev: { veren: ben.id, zaman: z }, gorevZamani: z });
  if (!k) return null;
  const [p, yeni] = k;
  let son = hareketYaz(yeni, { kisiId: ben.id, tip: "paketGorevVerildi", paketId: p.id, veri: { kime: p.muhabirId!, muhabir: p.muhabirId!, tarih: g.tarih } });
  if (g.not?.trim()) son = bahset(son, ben, g.not, { yol: `#/paketler/${p.id}`, baslik: p.baslik });
  kaydet(son);
  return p.id;
};

export const gorevTalebiGonder = (ben: Kisi, g: PaketGorevGirdisi): string | null => {
  const d = getir();
  if (!gorevTalebiVerebilir(ben) || !g.tarih || g.tarih < bugun()) return null;
  const k = gorevPaketi(d, ben, g, { gorevTalebi: { kisiId: ben.id, birim: ben.birim, zaman: simdi() } });
  if (!k) return null;
  const [p, yeni] = k;
  let son = hareketYaz(yeni, { kisiId: ben.id, tip: "gorevTalebiGeldi", paketId: p.id, veri: { sahip: "planlama", muhabir: p.muhabirId!, birim: ben.birim, tarih: g.tarih } });
  if (g.not?.trim()) son = bahset(son, ben, g.not, { yol: `#/paketler/${p.id}`, baslik: p.baslik });
  kaydet(son);
  return p.id;
};

/** Planlama talebi göreve çevirir (günü değiştirebilir) ya da gerekçeyle reddeder. */
export const gorevTalebiKarar = (ben: Kisi, id: string, kabul: boolean, ek: { tarih?: string; gerekce?: string } = {}) => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p || !p.gorevTalebi || !gorevTalebiKarariVerebilir(ben, p)) return false;
  const z = simdi();
  if (kabul) {
    const tarih = ek.tarih || p.sonTarih || bugun();
    if (!gorevTarihiUygun(ben, tarih)) return false;
    let yeni = paketGuncelle(d, id, (x) => ({ ...x, durum: "onaylandi", sonTarih: tarih, gorev: { veren: ben.id, zaman: z }, gorevZamani: z, guncelleme: z }));
    yeni = hareketYaz(yeni, { kisiId: ben.id, tip: "paketGorevVerildi", paketId: id, veri: { kime: [p.muhabirId, p.gorevTalebi.kisiId].filter(Boolean).join(","), muhabir: p.muhabirId ?? "", tarih } });
    kaydet(yeni);
    return true;
  }
  const red = { kisiId: ben.id, zaman: z, ...(ek.gerekce?.trim() && { gerekce: ek.gerekce.trim() }) };
  const yeni = paketGuncelle(d, id, (x) => ({ ...x, durum: "iptal", gorevTalebi: { ...x.gorevTalebi!, red }, guncelleme: z }));
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "gorevTalebiReddedildi", paketId: id, veri: { kime: p.gorevTalebi.kisiId, ...(red.gerekce && { not: red.gerekce }) } }));
  return true;
};

/** Talep eden, Planlama karar vermeden talebini geri çeker (kayıt iz olarak iptalde kalır). */
export const gorevTalebiGeriCek = (ben: Kisi, id: string) => {
  const d = getir();
  const p = paketBul(d, id);
  if (!p || !gorevTalebiGeriCekebilir(ben, p)) return false;
  const yeni = paketGuncelle(d, id, (x) => ({ ...x, durum: "iptal", guncelleme: simdi() }));
  kaydet(hareketYaz(yeni, { kisiId: ben.id, tip: "gorevTalebiGeriCekildi", paketId: id, veri: { sahip: "planlama" } }));
  return true;
};

/*
 * Öneriyi masaya sorma (kullanıcı): Planlama ekonomi, program ya da sporla
 * ilgili öneriyi o masaya iletir; masa notuyla alır ya da almaz (öneriyi
 * düzenleyebilir, oneriDuzenleyebilir); alınan öneride muhabiri Planlama
 * görevlendirir. Soru öneriden ayrı kayıtta (veri.ts → MasaSorusu).
 */
export const oneriMasayaSor = (ben: Kisi, oneriId: string, birim: BirimId, not = ""): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !masayaSorabilir(ben, o, d) || !(MASA_KOLLARI as readonly string[]).includes(birim)) return false;
  const soru: MasaSorusu = { id: kimlik("ms"), oneriId, birim, soran: ben.id, zaman: simdi(), ...(not.trim() && { not: not.trim() }) };
  d = { ...d, masaSorulari: [...(d.masaSorulari ?? []), soru] };
  // Planlama'nın dokunduğu öneri "değerlendiriliyor"a geçer: muhabir artık geri çekemez.
  if (o.durum === "yeni") d = { ...d, oneriler: d.oneriler.map((x) => (x.id === oneriId ? { ...x, durum: "degerlendiriliyor" as const } : x)) };
  d = hareketYaz(d, { kisiId: ben.id, tip: "oneriMasayaIletildi", oneriId, veri: { sahip: birim, birim } });
  if (soru.not) d = bahset(d, ben, soru.not, { yol: `#/oneriler/${oneriId}`, baslik: o.haberBasligi });
  kaydet(d);
  return true;
};

export const masaSorusunuYanitla = (ben: Kisi, oneriId: string, kabul: boolean, not = ""): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const s = acikSoru(d, oneriId);
  if (!o || !s || !masaYanitlar(ben, o, d)) return false;
  const cevap = { kabul, kisiId: ben.id, zaman: simdi(), ...(not.trim() && { not: not.trim() }) };
  d = { ...d, masaSorulari: (d.masaSorulari ?? []).map((x) => (x.id === s.id ? { ...x, cevap } : x)) };
  d = hareketYaz(d, { kisiId: ben.id, tip: kabul ? "masaOneriyiAldi" : "masaOneriyiAlmadi", oneriId, veri: { kime: s.soran, birim: s.birim } });
  if (cevap.not) d = bahset(d, ben, cevap.not, { yol: `#/oneriler/${oneriId}`, baslik: o.haberBasligi });
  kaydet(d);
  return true;
};

/** Masanın aldığı öneride muhabire görev: plansız görev paketi (stokta), masanın kolunda, öneriye bağlı. */
export const oneriGorevlendir = (ben: Kisi, oneriId: string, tarih: string): string | null => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const s = kabulSoru(d, oneriId);
  if (!o || !s || !o.muhabirId || !oneriGorevlendirebilir(ben, o, d) || !gorevTarihiUygun(ben, tarih)) return null;
  const z = simdi();
  const k = gorevPaketi(d, ben, { muhabirId: o.muhabirId, baslik: o.paketBasligi || o.haberBasligi, aciklama: o.gelisme, bicim: o.bicim && o.bicim !== TAKIP_BICIMI ? o.bicim : undefined, tarih }, {
    durum: "onaylandi",
    gorev: { veren: ben.id, zaman: z },
    gorevZamani: z,
    oneriId,
    tur: s.birim as IcerikTuru,
    sahaGerekli: o.sahaGerekli,
  });
  if (!k) return null;
  const [p, yeni] = k;
  d = { ...yeni, oneriler: yeni.oneriler.map((x) => (x.id === oneriId ? { ...x, durum: "planaEklendi" as const, paketId: p.id } : x)) };
  // Muhabire görev, masaya "görevlendirildi" (sahip): ikisi de bu tek hareketten.
  d = hareketYaz(d, { kisiId: ben.id, tip: "paketGorevVerildi", paketId: p.id, veri: { kime: o.muhabirId, muhabir: o.muhabirId, tarih, sahip: s.birim } });
  kaydet(d);
  return p.id;
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
  videoKontrol: "videoOnaylandi",
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
  // Parçalı metin durağında metin parça parça gidiyor; durağı geçiren montajın video bağlantısı, bütün parçalar dönünce.
  const parcali = adim === "metin" && parcaliMi(p);
  if (adim === "gorevlendirme" && !(g.muhabirId || p.muhabirId)) return false;
  if (parcali && (!g.video?.trim() || !parcalarHazir(p))) return false;
  if (adim === "metin" && !parcali && !g.metin?.trim()) return false;
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
    ...(adim === "video" || parcali ? { muhabirTeslimi: simdi(), videoIade: undefined } : {}),
    ...(sonraki === "tamam" ? { durum: "tamamlandi", adim: undefined } : { adim: sonraki }),
  };
  // Künye: adımı yapan adıyla pakete (hareket kaydı sınırlı, eski paketin künyesi oradan kurulamaz).
  const rol = ADIM_ROLU[adim as UretimAdimi];
  d = paketGuncelle(d, paketId, () => (rol ? kunyeYaz(yeni, rol, ben.id, simdi()) : yeni));
  if (g.not?.trim()) d = bahset(d, ben, g.not, { yol: `#/paketler/${paketId}`, baslik: p.baslik });
  const veri: Record<string, string> = { adim: sonraki, sahip: paketSahibi(yeni) ?? "" };
  // Stok paketi son adımda yayına değil stoğa giriyor; hareket cümlesi ona göre.
  if (sonraki === "tamam" && p.stok) veri.stok = "1";
  if (g.klipKodu) veri.kod = g.klipKodu;
  if (g.muhabirId) veri.muhabir = g.muhabirId;
  if (adim === "is") veri.durak = p.adim ?? "";
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: adim === "is" ? "durakTamamlandi" : parcali ? "videoGeldi" : ADIM_HAREKETI[adim], paketId, planId: p.planId, veri }));
  return true;
};

/* --- Parçalı metin (akis.ts → parcaliMi): her parça muhabir → Newsdesk → Script Editor → hazır --- */

const parcaHareketi = (d: Durum, ben: Kisi, p: Paket, tip: Hareket["tip"], parca: MetinParcasi, sahip: string, ek: Record<string, string> = {}) =>
  hareketYaz(d, { kisiId: ben.id, tip, paketId: p.id, planId: p.planId, veri: { parca: parca.ad, sahip, ...ek } });

/** Muhabir yeni parça ya da iade edilen parçayı gönderiyor; parça Newsdesk'e düşer. */
export const parcaGonder = (ben: Kisi, paketId: string, g: { id?: string; ad: string; metin: string }) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !parcaYapabilir(ben, p, "muhabir") || !g.ad.trim() || !g.metin.trim()) return false;
  const eski = g.id ? p.parcalar?.find((x) => x.id === g.id) : undefined;
  if (g.id && eski?.asama !== "muhabir") return false;
  const parca: MetinParcasi = { id: eski?.id ?? kimlik("mp"), ad: g.ad.trim(), metin: g.metin.trim(), asama: "newsdesk" };
  const parcalar = eski ? p.parcalar!.map((x) => (x === eski ? parca : x)) : [...(p.parcalar ?? []), parca];
  d = paketGuncelle(d, paketId, (x) => ({ ...x, parcalar, guncelleme: simdi() }));
  kaydet(parcaHareketi(d, ben, p, "parcaGeldi", parca, kolSahibi(p.tur)));
  return true;
};

/** Newsdesk parçayı düzeltip Script Editor'e geçiriyor. */
export const parcaDuzelt = (ben: Kisi, paketId: string, parcaId: string, metin: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const eski = p?.parcalar?.find((x) => x.id === parcaId);
  if (!p || !eski || eski.asama !== "newsdesk" || !parcaYapabilir(ben, p, "newsdesk") || !metin.trim()) return false;
  const parca: MetinParcasi = { ...eski, metin: metin.trim(), asama: "dil" };
  d = paketGuncelle(d, paketId, (x) => kunyeYaz({ ...x, parcalar: x.parcalar!.map((y) => (y.id === parcaId ? parca : y)), guncelleme: simdi() }, "metin", ben.id, simdi()));
  kaydet(parcaHareketi(d, ben, p, "parcaDuzeltildi", parca, "scriptEditor"));
  return true;
};

/** Newsdesk parçayı gerekçesiyle muhabire iade ediyor; muhabir düzeltip yeniden gönderir. */
export const parcaIade = (ben: Kisi, paketId: string, parcaId: string, gerekce: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const eski = p?.parcalar?.find((x) => x.id === parcaId);
  if (!p || !eski || eski.asama !== "newsdesk" || !parcaYapabilir(ben, p, "newsdesk") || !gerekce.trim()) return false;
  const parca: MetinParcasi = { ...eski, asama: "muhabir", iade: gerekce.trim() };
  d = paketGuncelle(d, paketId, (x) => ({ ...x, parcalar: x.parcalar!.map((y) => (y.id === parcaId ? parca : y)), duzeltmeSayisi: (x.duzeltmeSayisi ?? 0) + 1, guncelleme: simdi() }));
  kaydet(parcaHareketi(d, ben, p, "parcaIade", parca, "muhabir", { gerekce: gerekce.trim() }));
  return true;
};

/**
 * Script Editor parçanın son halini veriyor (yalnız düzeltip ilerletiyor,
 * geri göndermiyor). Bütün parçalar hazırsa metin birleşir ve sıra montaja,
 * muhabire geçer.
 */
export const parcaSonHal = (ben: Kisi, paketId: string, parcaId: string, metin: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  const eski = p?.parcalar?.find((x) => x.id === parcaId);
  if (!p || !eski || eski.asama !== "dil" || !parcaYapabilir(ben, p, "dil") || !metin.trim()) return false;
  const parca: MetinParcasi = { ...eski, metin: metin.trim(), asama: "tamam" };
  const parcalar = p.parcalar!.map((y) => (y.id === parcaId ? parca : y));
  const hazir = parcalarHazir({ parcalar });
  d = paketGuncelle(d, paketId, (x) => kunyeYaz({ ...x, parcalar, ...(hazir && { metin: parcalar.map((y) => `${y.ad}\n${y.metin}`).join("\n\n") }), guncelleme: simdi() }, "dil", ben.id, simdi()));
  kaydet(parcaHareketi(d, ben, p, "parcaTamam", parca, hazir ? "muhabir" : ""));
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
  // Video kontrolünün revizyon gerekçesi muhabirin ekranında montaj formunun üstünde.
  const video = adimTuru(p) === "videoKontrol";
  d = paketGuncelle(d, paketId, (x) => ({ ...x, adim: hedef, duzeltmeSayisi: (x.duzeltmeSayisi ?? 0) + 1, ...(video && { videoIade: gerekce.trim() }) }));
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

/* --- Takvim botu (takvimBotu.ts): haberlerden olay adayı; takvime Planlama ekler --- */

/*
 * Gündem taranınca bulunan adaylar kayda girer: tarayan kişi Planlama
 * olmayabilir, adaylar takvimi düzenleyene görünsün. Yalnız yeni aday varsa
 * ya da eski aday atılacaksa yazılır; her açılışta boş yazış olmasın.
 */
export const takvimAdaylariniTopla = (ben: Kisi, haberler: Haber[]) => {
  const d = getir();
  if (!gundemGorebilir(d, ben)) return 0;
  const B = bugun();
  const mevcut = d.takvimAdaylari ?? [];
  const temiz = adayTemizligi(mevcut, B);
  const yeni = yeniAdaylar(haberAdaylari(haberler, B), temiz, d.faaliyetler);
  if (!yeni.length && temiz.length === mevcut.length) return 0;
  const z = simdi();
  kaydet({ ...d, takvimAdaylari: [...temiz, ...yeni.map((a) => ({ ...a, id: kimlik("ta"), bulundu: z, durum: "yeni" as const }))] });
  return yeni.length;
};

/*
 * Demoda Gündem'i yalnız tam yönetici açıyor; Planlama da adayları görsün diye
 * sistemin açılış işi örnek akıştan bir kez doldurur (gerçek kipte değil).
 * Örnek veride kurulmuyor: ornek.ts gündemi yüklerse açılışta modül döngüsü
 * (yetki henüz tanımsız) uygulamayı açtırmıyordu.
 */
export const demoTakvimAdaylari = () => {
  if (GERCEK) return;
  const d = getir();
  if (d.takvimAdaylari?.some((a) => a.kural === KURAL_SURUMU)) return;
  const z = simdi();
  const liste = haberAdaylari(demoHaberleri(Date.now()), bugun()).map((a, i) => ({ ...a, id: `ta-ornek-${i}`, bulundu: z, durum: "yeni" as const }));
  if (liste.length) kaydet({ ...d, takvimAdaylari: [...adayTemizligi(d.takvimAdaylari ?? [], bugun()), ...liste] });
};

/** Adayın kararı: "ilgisiz" ya da (faaliyet formu kaydedilince) "eklendi". Takvimi düzenleyen verir. */
export const takvimAdayiKarar = (ben: Kisi, id: string, durum: "eklendi" | "ilgisiz", faaliyetId?: string) => {
  if (!yapabilir(ben, "takvimDuzenle")) return false;
  const d = getir();
  const a = d.takvimAdaylari?.find((x) => x.id === id);
  if (!a) return false;
  kaydet({ ...d, takvimAdaylari: d.takvimAdaylari!.map((x) => (x === a ? { ...a, durum, faaliyetId, karar: { kisiId: ben.id, zaman: simdi() } } : x)) });
  return true;
};

/* --- Gündem takibi (gundem.ts): yalnız tam yönetici; arşiv kişinin kendi notları --- */

export const gundemNotuKaydet = (ben: Kisi, n: Omit<GundemNotu, "id" | "kisiId" | "zaman"> & { id?: string }) => {
  const d = getir();
  if (!gundemGorebilir(d, ben) || !n.baglanti) return null;
  const eski = d.gundemArsivi ?? [];
  const var_ = eski.find((x) => x.kisiId === ben.id && (x.id === n.id || x.baglanti === n.baglanti));
  // Aynı haber ikinci kez işaretlenince yeni kayıt değil, notu güncellenir.
  const yeni: GundemNotu = { ...var_, ...n, id: var_?.id ?? kimlik("gn"), kisiId: ben.id, zaman: var_?.zaman ?? simdi(), not: n.not.trim() };
  kaydet({ ...d, gundemArsivi: var_ ? eski.map((x) => (x === var_ ? yeni : x)) : [...eski, yeni] });
  return yeni.id;
};

export const gundemNotuSil = (ben: Kisi, id: string) => {
  const d = getir();
  const n = d.gundemArsivi?.find((x) => x.id === id);
  if (!n || n.kisiId !== ben.id) return false;
  kaydet({ ...d, gundemArsivi: d.gundemArsivi!.filter((x) => x !== n) });
  return true;
};

/** Gündemi kimlerle paylaştığını yalnız tam yönetici seçer; muhabir paylaşılamaz. */
export const gundemPaylasimKaydet = (ben: Kisi, birimler: BirimId[], kisiler: string[]) => {
  if (!ben.hesapYoneticisi) return false;
  const d = getir();
  const kisi = new Map(d.kisiler.map((k) => [k.id, k]));
  kaydet({
    ...d,
    gundemPaylasim: {
      birimler: [...new Set(birimler)].filter((b) => b !== "muhabir"),
      kisiler: [...new Set(kisiler)].filter((id) => { const k = kisi.get(id); return k && !kisitliKisi(k) && !k.hesapYoneticisi; }),
    },
  });
  return true;
};

/*
 * Eş öneriyi asıl öneriye katar (oneriPlanlari.ts → esOneriler): kopyanın plan
 * bağları (gelişme, canlı, paket, haftalık kalem), yazışması, hareketleri ve takip
 * satırları asıla geçer, kopya silinir. Asıl karar bekliyorsa kopyanın kararı
 * (plana eklendi, gündem…) asıla geçer; plan durumu sonra kayda göre kurulur.
 * Değişmeyen öğenin nesnesine dokunulmuyor (fark nesne kimliğiyle).
 */
export const oneriBirlestir = (ben: Kisi, asilId: string, kopyaId: string) => {
  const d = getir();
  const asil = oneriBul(d, asilId);
  const kopya = oneriBul(d, kopyaId);
  if (!asil || !kopya || asil === kopya || !oneriBirlestirebilir(ben, asil, kopya)) return false;
  const tasi = <T extends { oneriId?: string }>(l: T[]): T[] => (l.some((x) => x.oneriId === kopyaId) ? l.map((x) => (x.oneriId === kopyaId ? { ...x, oneriId: asilId } : x)) : l);
  const kararBekliyor = asil.durum === "yeni" || asil.durum === "degerlendiriliyor";
  const kopyaKarari = kararBekliyor && kopya.durum !== "yeni" && kopya.durum !== "degerlendiriliyor";
  let yeniAsil: Oneri = {
    ...asil,
    ...(kopyaKarari && {
      durum: kopya.durum,
      ...(kopya.planId && { planId: kopya.planId }),
      ...(kopya.planTarihi && { planTarihi: kopya.planTarihi }),
      ...(kopya.paketId && { paketId: kopya.paketId }),
      ...(kopya.gerekce && { gerekce: kopya.gerekce }),
      ...(kopya.hafta && { hafta: kopya.hafta }),
      ...(kopya.haftaGunu && { haftaGunu: kopya.haftaGunu }),
    }),
    ...((kopya.satirlar?.length ?? 0) > 0 && { satirlar: [...(asil.satirlar ?? []), ...kopya.satirlar!].sort((a, b) => a.zaman.localeCompare(b.zaman)) }),
  };
  const yzVar = d.yzGorusleri?.some((x) => x.oneriId === asilId);
  let y: Durum = {
    ...d,
    gelismeler: tasi(d.gelismeler),
    canliYayinlar: tasi(d.canliYayinlar),
    paketler: tasi(d.paketler),
    mesajlar: tasi(d.mesajlar ?? []),
    hareketler: tasi(d.hareketler),
    haftalik: d.haftalik.some((h) => h.kalemler.some((k) => k.oneriId === kopyaId)) ? d.haftalik.map((h) => (h.kalemler.some((k) => k.oneriId === kopyaId) ? { ...h, kalemler: tasi(h.kalemler) } : h)) : d.haftalik,
    // Asılın yapay zeka görüşü varsa kopyanınki gider (öneri başına bir görüş).
    ...(d.yzGorusleri && { yzGorusleri: yzVar ? d.yzGorusleri.filter((x) => x.oneriId !== kopyaId) : tasi(d.yzGorusleri) }),
  };
  yeniAsil = oneriPlanaGore(y, yeniAsil);
  y = {
    ...y,
    oneriler: y.oneriler.filter((x) => x.id !== kopyaId).map((x) => (x.id === asilId ? yeniAsil : x.kopyaKaynagi === kopyaId ? { ...x, kopyaKaynagi: asilId } : x)),
  };
  kaydet(hareketYaz(y, { kisiId: ben.id, tip: "onerilerBirlestirildi", oneriId: asilId, veri: { baslik: kopya.haberBasligi } }));
  return true;
};

/*
 * Plandaki paketi ya da gelişmeyi muhabirin önerisine bağlar (oneriPlanlari.ts →
 * baglanabilirKayitlar): kayda yalnız `oneriId` yazılır, planın içeriğine, paketin
 * durumuna ve onayına dokunulmaz; öneri kayda göre "plana eklendi" olur. Muhabire
 * yeni görev ya da iptal gitmez.
 */
export const oneriPlandakineBagla = (ben: Kisi, oneriId: string, kayit: { tur: "paket" | "gelisme"; id: string }) => {
  const d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !(oneriDuzenleyebilir(ben, o) || ben.hesapYoneticisi)) return false;
  if (!baglanabilirKayitlar(d, o).some((x) => x.tur === kayit.tur && x.id === kayit.id)) return false;
  let y: Durum =
    kayit.tur === "paket"
      ? { ...d, paketler: d.paketler.map((x) => (x.id === kayit.id ? { ...x, oneriId } : x)) }
      : { ...d, gelismeler: d.gelismeler.map((x) => (x.id === kayit.id ? { ...x, oneriId } : x)) };
  const yeni = oneriPlanaGore(y, o.durum === "planaEklendi" ? o : { ...o, durum: "degerlendiriliyor" });
  y = { ...y, oneriler: y.oneriler.map((x) => (x.id === oneriId ? yeni : x)) };
  kaydet(hareketYaz(y, { kisiId: ben.id, tip: "oneriPlandakineBaglandi", oneriId, planId: yeni.planId, veri: { kayit: kayit.tur } }));
  return true;
};

/* --- Gündem sepeti: kişinin kendi parçaları --- */

export const gundemSepeteEkle = (ben: Kisi, p: Omit<SepetParcasi, "id" | "zaman">) => {
  const d = getir();
  const metin = p.metin.trim();
  if (!gundemGorebilir(d, ben) || !metin) return false;
  const eski = d.gundemSepetleri?.[ben.id] ?? [];
  // Aynı parça ikinci kez eklenmez: paragrafın "+"sına iki kez basılabiliyor.
  if (eski.some((x) => x.metin === metin && x.baglanti === p.baglanti)) return true;
  kaydet({ ...d, gundemSepetleri: { ...d.gundemSepetleri, [ben.id]: [...eski, { ...p, metin, id: kimlik("sp"), zaman: simdi() }] } });
  return true;
};

export const gundemSepettenCikar = (ben: Kisi, id?: string) => {
  const d = getir();
  const eski = d.gundemSepetleri?.[ben.id];
  if (!eski) return false;
  const kalan = id ? eski.filter((x) => x.id !== id) : [];
  const yeni = { ...d.gundemSepetleri };
  if (kalan.length) yeni[ben.id] = kalan;
  else delete yeni[ben.id];
  kaydet({ ...d, gundemSepetleri: yeni });
  return true;
};

export const gundemKaynaklariKaydet = (ben: Kisi, liste: GundemKaynagi[]) => {
  if (!ben.hesapYoneticisi) return false;
  const temiz = liste.filter((k) => k.ad.trim() && /^https:\/\//.test(k.adres.trim())).map((k) => ({ ...k, ad: k.ad.trim(), adres: k.adres.trim() }));
  if (!temiz.length) return false;
  const d = getir();
  // Değişmeyen kaynağın nesnesi aynı kalsın: gerçek kipte yalnız değişen belge yazılır.
  const eski = new Map((d.gundemKaynaklari ?? []).map((k) => [k.id, k]));
  kaydet({ ...d, gundemKaynaklari: temiz.map((k) => { const e = eski.get(k.id); return e && JSON.stringify(e) === JSON.stringify(k) ? e : k; }) });
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
export const epostaYanitiIsle = (ben: Kisi | undefined, gelen: GelenEposta, kaynak: Yanit["kaynak"], cagriZorla?: Cagri): YanitSonucu | null => {
  if (kaynak === "iceAktarma" && !yapabilir(ben, "cagriHazirla")) return null;
  let d = getir();
  if (gelen.mesajKimligi && d.yanitlar.some((y) => y.mesajKimligi === gelen.mesajKimligi)) return { durum: "tekrar" };
  const zaman = gelen.zaman ?? simdi();
  const kisi = gondereniBul(d, gelen.kimden);
  // Kutudan gelen postada çağrıyı konudan çözen önceden buldu; tahmine bırakma.
  const cagri = cagriZorla ?? cagriyiBul(d, gelen.konu, zaman, kisi);
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

/*
 * Kutudan çekilen posta çağrıya verilmiş muhabir yanıtıysa öneri akışına da
 * girer; sohbette de kalır (kullanıcı: sohbet olduğu gibi dursun, işe yarayan
 * öneriye aktarılsın; öneri her halükarda Planlama'nın kontrolünden geçiyor).
 * - Konuda ND-/HP- etiketi: o çağrı. Gönderen tanınmıyorsa "eşleşmedi" olarak
 *   saklanır, Gelen yanıtlar'da elle bağlanır. Tanınıyor ama çağrının alıcısı
 *   ve muhabir değilse (planlamacının kendi yanıtı, grubun geri dönen postası)
 *   alınmaz: yoksa onun adına öneri açılırdı.
 * - Etiket silinmişse: gönderen o çağrının BCC'sinde ve konu çağrının
 *   konusuyla aynı olmalı; yoksa muhabirin her postası öneri olurdu.
 */
export const cagriYanitiysaIsle = (ben: Kisi, gelen: GelenEposta): YanitSonucu | null => {
  const d = getir();
  if (gelen.mesajKimligi && d.yanitlar.some((y) => y.mesajKimligi === gelen.mesajKimligi)) return null;
  const kisi = gondereniBul(d, gelen.kimden);
  const muhabirMi = (k: Kisi) => k.birim === "muhabir" || icMuhabirMi(k);
  const etiket = etiketBul(gelen.konu);
  if (etiket) {
    const cagri = d.cagrilar.find((c) => c.etiket === etiket);
    if (!cagri) return null;
    if (kisi && !cagri.bcc.includes(kisi.id) && !muhabirMi(kisi)) return null;
    return epostaYanitiIsle(ben, gelen, "posta", cagri);
  }
  if (!kisi) return null;
  const cekirdek = (konu: string) => postaKonuCekirdegi(konu.replace(/\[[^\]]*\]/g, ""));
  const konu = cekirdek(gelen.konu);
  if (!konu) return null;
  const cagri = [...d.cagrilar]
    .filter((c) => c.bcc.includes(kisi.id) && cagriKonulari(c.tarih, c.tur).some((k) => cekirdek(k) === konu))
    .sort((a, b) => b.zaman.localeCompare(a.zaman))[0];
  return cagri ? epostaYanitiIsle(ben, gelen, "posta", cagri) : null;
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
  /*
   * Aynı muhabirin aynı çağrıya sonraki postası (Planlama sordu, muhabir
   * açtı) yeni öneri açmasın: metni o önerinin altına satır olarak girer,
   * Planlama'ya bildirim gider. Reddedilmiş ya da geri çekilmişse yeni öneri.
   */
  const onceki = d.oneriler.find((o) => o.cagriId === cagri.id && o.muhabirId === kisi.id && o.kanal === "eposta" && o.durum !== "reddedildi" && o.durum !== "geriCekildi");
  if (onceki) {
    const yeni: Oneri = { ...onceki, satirlar: [...(onceki.satirlar ?? []), { zaman: y.zaman, metin: y.metin }] };
    d = { ...d, oneriler: d.oneriler.map((o) => (o.id === onceki.id ? yeni : o)) };
    kaydet(hareketYaz(d, { kisiId: kisi.id, tip: "takipSatiriEklendi", oneriId: onceki.id, veri: { sahip: "planlama", kanal: "eposta" } }));
    return onceki.id;
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

/* --- Gelen posta sohbeti (öneri-yanıt akışından ayrı) --- */

export interface PostaSonucu {
  durum: "eklendi" | "tekrar";
  mesajId?: string;
  konuKimligi?: string;
}

/*
 * Gelen postayı sohbete ekler: ekler atılıyor (yalnız ad kalıyor), alıntı ve
 * imza ayıklanıyor, konunun çekirdeğine göre iplikçiğe bağlanıyor ("RE:",
 * "FW:", "رد:" aynı sohbette). Aynı Message-ID ikinci kez eklenmiyor. Bugün
 * Planlama Outlook'tan içe aktarıyor; sunucu fazında posta kutusunu izleyen
 * hizmet (EWS/Graph) de bunu çağıracak, tarayıcıyla sunucu ayrışmasın.
 */
export const postaIsle = (ben: Kisi | undefined, gelen: GelenEposta, kaynak: PostaMesaji["kaynak"], grup?: string): PostaSonucu | null => {
  if (kaynak === "iceAktarma" && !yapabilir(ben, "cagriHazirla")) return null;
  const d = getir();
  const mevcut = d.postaMesajlari ?? [];
  if (gelen.mesajKimligi && mevcut.some((m) => m.mesajKimligi === gelen.mesajKimligi)) return { durum: "tekrar" };
  const metin = yeniMetin(gelen.metin) || gelen.metin.trim();
  const cekirdek = postaKonuCekirdegi(gelen.konu);
  const sunucuKonu = gelen.konuKimligi?.trim();

  /*
   * Kendi gönderdiğimiz posta grup CC'de olduğu için kutumuza geri düşüyor.
   * Yeni mesaj sayma (balon çiftlenirdi); ekrandaki giden balonu bul, kimliğini
   * öğren. Yeni postada ipliğin sunucudaki kimliği gönderirken bilinmiyordu:
   * öğrenilince iplik o kimliğe taşınıyor, sonraki yanıtlar oraya düşüyor.
   */
  const duz = (x: string) => x.replace(/\s+/g, " ").trim();
  const zamanFarki = (a: string) => Math.abs(new Date(a).getTime() - new Date(gelen.zaman ?? simdi()).getTime());
  const esGiden = mevcut.find((m) => m.giden && !m.mesajKimligi && duz(metin).startsWith(duz(m.metin).slice(0, 200)) && zamanFarki(m.zaman) < 6 * 3600_000);
  if (esGiden) {
    const eskiKonu = esGiden.konuKimligi;
    const yeniKonu = sunucuKonu || eskiKonu;
    kaydet({
      ...d,
      postaMesajlari: mevcut.map((m) =>
        m === esGiden ? { ...m, mesajKimligi: gelen.mesajKimligi, konuKimligi: yeniKonu } : m.konuKimligi === eskiKonu && yeniKonu !== eskiKonu ? { ...m, konuKimligi: yeniKonu } : m,
      ),
    });
    return { durum: "tekrar", konuKimligi: yeniKonu };
  }

  /*
   * İplik: sunucunun kimliği; o kimlikte sohbet yoksa ama aynı konuyla buradan
   * açılmış sohbet varsa (yeni posta, kimliği henüz öğrenilmemiş) ona katıl.
   */
  /*
   * Sunucunun kimliğinde sohbet yoksa aynı konu çekirdeğiyle (yeterince uzun)
   * var olan sohbete katıl: Yahoo'dan ya da Rusça Outlook'tan gelen yanıt yeni
   * yazışma kimliğiyle geliyor, aynı postanın yanıtı ayrı sohbet açıyordu.
   */
  const ayniKonu = sunucuKonu && !mevcut.some((m) => m.konuKimligi === sunucuKonu) && cekirdek.length >= 12
    ? mevcut.find((m) => postaKonuCekirdegi(m.konu) === cekirdek && (!grup || !m.grup || m.grup === grup.trim().toLowerCase()))
    : undefined;
  const konuKimligi =
    sunucuKonu && !mevcut.some((m) => m.konuKimligi === sunucuKonu) && cekirdek && mevcut.some((m) => m.konuKimligi === cekirdek)
      ? cekirdek
      : ayniKonu?.konuKimligi || sunucuKonu || cekirdek || kimlik("pk");
  const g = grup?.trim().toLowerCase();
  const kucukListe = (l?: string[]) => (l ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean);
  const mesaj: PostaMesaji = {
    id: kimlik("pm"),
    konuKimligi,
    kimden: gelen.kimden.trim(),
    kimdenAd: gelen.kimdenAd,
    konu: gelen.konu,
    metin,
    tamMetin: gelen.metin,
    zaman: gelen.zaman ?? simdi(),
    mesajKimligi: gelen.mesajKimligi,
    ekler: gelen.ekler ?? [],
    kaynak,
    ...(g ? { grup: g } : {}),
    ...(gelen.kime?.length ? { kime: kucukListe(gelen.kime) } : {}),
    ...(gelen.cc?.length ? { cc: kucukListe(gelen.cc) } : {}),
  };
  kaydet({ ...d, postaMesajlari: [mesaj, ...mevcut] });
  return { durum: "eklendi", mesajId: mesaj.id, konuKimligi };
};

/*
 * Buradan gönderilen postayı (yanıt ya da yeni posta) sohbete giden balon
 * olarak ekler. Gerçek gönderim kapı üzerinden EWS'yle; alıcılar kapının
 * gerçekten gönderdiği listeden (grup CC'si dahil), "kim kime yazdı" doğru
 * görünsün. Grup CC'de olduğu için posta kutudan geri de gelir; postaIsle onu
 * bu balonla eşleştiriyor, çiftlemiyor.
 */
export const postaGidenEkle = (
  ben: Kisi,
  konuKimligi: string,
  konu: string,
  metin: string,
  grup?: string,
  alicilar?: { kime: string[]; cc?: string[] },
): string | null => {
  if (!yapabilir(ben, "cagriHazirla")) return null;
  const d = getir();
  const g = grup?.trim().toLowerCase();
  const mesaj: PostaMesaji = {
    id: kimlik("pm"),
    konuKimligi,
    kimden: ben.eposta ?? "",
    konu,
    metin,
    tamMetin: metin,
    zaman: simdi(),
    ekler: [],
    kaynak: "iceAktarma",
    giden: true,
    ...(g ? { grup: g } : {}),
    ...(alicilar?.kime.length ? { kime: alicilar.kime } : {}),
    ...(alicilar?.cc?.length ? { cc: alicilar.cc } : {}),
  };
  kaydet({ ...d, postaMesajlari: [mesaj, ...(d.postaMesajlari ?? [])] });
  return mesaj.id;
};

/*
 * Etiketsiz (grup bilgisi olmayan) eski sohbetleri bir gruba atar: kişiye
 * özel kimliğe geçmeden önce admin hesabından çekilenler ortak havuzda
 * duruyordu; herkese görünmesin diye bir kez admin kendi grubuna mal eder.
 * Yalnız tam yönetici, yalnız etiketsizlere dokunur.
 */
export const postaEtiketsizleriGruba = (ben: Kisi, grup: string): number => {
  if (!ben.hesapYoneticisi) return 0;
  const g = grup.trim().toLowerCase();
  if (!g) return 0;
  const d = getir();
  const mevcut = d.postaMesajlari ?? [];
  const etiketsiz = mevcut.filter((m) => !m.grup);
  if (!etiketsiz.length) return 0;
  kaydet({ ...d, postaMesajlari: mevcut.map((m) => (m.grup ? m : { ...m, grup: g })) });
  return etiketsiz.length;
};

/* Sohbeti izleriyle siler (Planlama temizliği); çağrı ve öneri akışına dokunmaz. */
// Ekranda birleşmiş sohbet birden çok iplik kimliğinden oluşabiliyor (Posta.tsx → sohbetleriKur); hepsi gider.
/*
 * Posta okundu bilgisi (postaOkuma.ts). Sohbete bakmak kendiliğinden yazıyor:
 * izlemede ya da eşitlenmeden yazılamıyorsa sessizce geçilir, her tıklamada
 * "kaydedilmedi" bildirimi çıkmasın.
 */
const postaOkumaYaz = (ben: Kisi, f: (o: PostaOkuma, d: Durum) => PostaOkuma | null) => {
  if (izlemede() || (GERCEK && !sunucuyaEsitMi())) return;
  const d = getir();
  const eski = d.postaOkunan?.[ben.id];
  const taban = new Date(Date.now() - ILK_TABAN_SAAT * 3600_000).toISOString();
  const yeni = f(eski ?? { taban, k: {} }, d);
  const sonuc = yeni ?? (eski ? null : { taban, k: {} });
  if (!sonuc || sonuc === eski) return;
  kaydet({ ...d, postaOkunan: { ...d.postaOkunan, [ben.id]: budanmis(sonuc, d.postaMesajlari ?? []) } });
};

/** Posta ekranı açılınca: ilk kez açana taban kurulur, grup değiştiyse yazılır (menü sayısı onu kullanıyor). */
export const postaOkumaBaslat = (ben: Kisi, grup: string) =>
  postaOkumaYaz(ben, (o) => ((o.grup ?? "") === grup ? null : { ...o, grup: grup || undefined }));

export const postaOkundu = (ben: Kisi, kimlikler: string[], zaman: string) => postaOkumaYaz(ben, (o) => okunduYap(o, kimlikler, zaman));

export const postaOkunmadi = (ben: Kisi, kimlikler: string[], sonGelen: string) => postaOkumaYaz(ben, (o) => okunmadiYap(o, kimlikler, sonGelen));

/** Hepsini okundu say: taban şimdi, iplik başına anlar gereksiz. */
export const postaHepsiOkundu = (ben: Kisi) => postaOkumaYaz(ben, (o) => ({ ...o, taban: simdi(), k: {} }));

export const postaSil = (ben: Kisi, konuKimligi: string | string[]): boolean => {
  if (!yapabilir(ben, "cagriHazirla")) return false;
  const d = getir();
  const mevcut = d.postaMesajlari ?? [];
  const silinen = new Set(typeof konuKimligi === "string" ? [konuKimligi] : konuKimligi);
  if (!mevcut.some((m) => silinen.has(m.konuKimligi))) return false;
  kaydet({ ...d, postaMesajlari: mevcut.filter((m) => !silinen.has(m.konuKimligi)) });
  return true;
};

export interface YanitOneriGirdisi {
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  islemeFikri?: string;
  gorselIsleme?: string;
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
    ...(g.islemeFikri?.trim() && { islemeFikri: g.islemeFikri.trim() }),
    ...(g.gorselIsleme?.trim() && { gorselIsleme: g.gorselIsleme.trim() }),
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
  if (!o || !oneriDuzenleyebilir(ben, o, d) || !g.haberBasligi.trim()) return false;
  let yeni: Oneri = {
    ...o,
    ilkHali: o.ilkHali ?? { haberBasligi: o.haberBasligi, gelisme: o.gelisme, ...(o.paketBasligi && { paketBasligi: o.paketBasligi }) },
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    // Alan formda yoksa (eski çağıran) dokunulmuyor; takipte işleme sorulmuyor.
    ...(g.islemeFikri !== undefined && { islemeFikri: (g.bicim !== TAKIP_BICIMI && g.islemeFikri.trim()) || undefined }),
    ...(g.gorselIsleme !== undefined && { gorselIsleme: (g.bicim !== TAKIP_BICIMI && g.gorselIsleme.trim()) || undefined }),
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
  };
  // Plandaki gelişmenin metni oneriPlanaEkle'deki kuralla (planMetni).
  const metin = (x: Oneri, _paketli: boolean) => planMetni(x);
  const paketli = !!o.paketId;
  /*
   * Devralınmış plan Newsdesk'te: onun gelişmesine ve paketine dokunulmaz.
   * Paketin yalnız taslağı tam güncellenir; onaylıda yalnız metin (strap,
   * açıklama; paketMetniDuzenle ile aynı kural), üretimdeki ve bitmiş pakete
   * hiç: masa değişince paketin akışı da değişiyordu.
   */
  const devralinmis = (planId?: string) => planBul(d, planId)?.durum === "devralindi";
  d = {
    ...d,
    oneriler: d.oneriler.map((x) => (x.id === oneriId ? yeni : x)),
    gelismeler: d.gelismeler.map((x) => (x.oneriId === oneriId && !devralinmis(x.planId) && x.metin === metin(o, paketli) && metin(o, paketli) !== metin(yeni, paketli) ? { ...x, metin: metin(yeni, paketli) } : x)),
    paketler: d.paketler.map((p) => {
      if (p.oneriId !== oneriId || devralinmis(p.planId)) return p;
      const taslak = p.durum === "taslak" || p.durum === "degerlendiriliyor";
      if (!taslak && p.durum !== "onaylandi") return p;
      const yeniStrap = oneriPaketBasligi(yeni);
      const baslik = p.baslik === (oneriPaketBasligi(o) ?? "") && yeniStrap ? yeniStrap : p.baslik;
      const aciklama = p.aciklama === o.gelisme ? yeni.gelisme : p.aciklama;
      const tur = taslak && p.tur === o.tur ? yeni.tur : p.tur;
      const bicim = taslak && p.bicim === paketBicimi(o.bicim) ? (paketBicimi(yeni.bicim) ?? p.bicim) : p.bicim;
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
export const kisiPozisyonu = (ben: Kisi, kisiId: string, p: { birim: BirimId; gorev: GorevId; ad?: Yazi; kadin?: boolean }) => {
  // Demoda hesap yetkisi yalnız örnek yöneticide; tayini Organizasyon'da o deniyor.
  if (!hesapYetkisi(ben, "kisiDuzenle")) return false;
  const d = getir();
  const eski = d.kisiler.find((k) => k.id === kisiId);
  if (!eski) return false;
  let yeni: Durum = {
    ...d,
    kisiler: d.kisiler.map((k) => {
      if (k.id !== kisiId) return k;
      const { kontrolBekliyor: _, kadin: eskiKadin, ...kalan } = k;
      const kadin = p.kadin === undefined ? eskiKadin : p.kadin || undefined;
      // Dış muhabirde ünvan seçilmiyor, şehirden geliyor.
      const yeniK = yerUnvaniUygula({ ...kalan, ...(kadin ? { kadin: true as const } : {}), birim: p.birim, gorev: p.gorev, ...(p.ad ? { ad: p.ad } : {}) });
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
 * Kayıt bağlantısıyla gelen kişinin hesabını onaylar: "kontrol bekliyor"
 * kalkar, kişi kısıtlı olmaktan çıkar ve birimindeki kayıtları görür. Birim
 * ya da görevi düzeltmek gerekirse "Düzenle" (kisiPozisyonu) da onaylıyor.
 */
export const kayitOnayla = (ben: Kisi, kisiId: string) => {
  if (!hesapYetkisi(ben, "kisiDuzenle")) return false;
  const d = getir();
  const k = d.kisiler.find((x) => x.id === kisiId);
  if (!k?.kontrolBekliyor) return false;
  const { kontrolBekliyor: _, ...kalan } = k;
  kaydet(hareketYaz({ ...d, kisiler: d.kisiler.map((x) => (x === k ? kalan : x)) }, { kisiId: ben.id, tip: "kayitOnaylandi", veri: { ad: yaz(k.ad), kime: kisiId } }));
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

/*
 * Yöneticinin taslağı; yoksa yayındaki yapının kopyası (henüz kaydedilmemiş).
 * Taslak da okurken tamamlanır: yeni düzenden (yönetim kademesi, Script
 * Editor, yeni yol) önce kaydedilmiş taslakta Organizasyon ekranı eski hali
 * gösteriyordu, kullanıcı "bende hiçbir şey değişmedi" dedi.
 */
export const yapiTaslagi = (d: Durum, ben: Kisi): Yapi => {
  const t = d.yapiTaslaklari?.[ben.id];
  return t ? tamamla(t) : guncelYapi(d);
};

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
  // Eski düzende kaydedilmiş taslak tamamlanmış haliyle yayınlanır (ekranda görülen o).
  const yayin: Yapi = { ...tamamla(taslak), surum, id: kimlik("y"), zaman: simdi(), yayinlayan: ben.id, ...(not.trim() ? { not: not.trim() } : { not: undefined }) };
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

/*
 * Dil denetmenleri Output'un içindeydi; Script Editor birimi açılınca
 * (yapi.ts → scriptEditoruKur) Output'ta dil denetmeni ünvanıyla kalan
 * kişiler oraya geçiyor. Dil durağı Script Editor'ün; geçmeselerdi sıradaki
 * metni göremezlerdi.
 */
/*
 * Müdürler ve koordinatör Yönetim biriminden ağaçtaki yerlerine (yapi.ts →
 * kademeHedefi: Input müdürü Input'a, Program müdürü Program'a,
 * koordinatör Haber merkezi'ne). Yerinde ünvanı olmayan Yönetim'de kalır.
 * Sistemin açılış işi; gerçek kipte tam yöneticinin tarayıcısında da.
 */
export const yonetimiAgacaTasi = () => {
  const d = getir();
  const y = guncelYapi(d);
  const hedef = new Map(d.kisiler.filter((k) => k.birim === "yonetim").flatMap((k) => {
    const h = kademeHedefi(k.gorev, y);
    return h ? [[k.id, h] as const] : [];
  }));
  if (!hedef.size) return;
  kaydet({ ...d, kisiler: d.kisiler.map((k) => (hedef.has(k.id) ? { ...k, birim: hedef.get(k.id)! } : k)) });
};

export const dilDenetmenleriniTasi = () => {
  const d = getir();
  if (!d.kisiler.some((k) => k.birim === "output" && k.gorev === "dilDenetmeni")) return;
  kaydet({ ...d, kisiler: d.kisiler.map((k) => (k.birim === "output" && k.gorev === "dilDenetmeni" ? { ...k, birim: "scriptEditor" } : k)) });
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
  // Açık plandaki gelişme muhabirliği de gider: silinen kişi paragrafın altında "المراسل" olarak kalıyordu.
  const acikPlan = new Set(d.planlar.filter((p) => p.durum === "taslak" || p.durum === "toplantida").map((p) => p.id));
  const gelismeler = d.gelismeler.map((g) =>
    acikPlan.has(g.planId) && gelismeMuhabirleri(g).some((m) => m.kisiId === kisiId) ? { ...g, muhabirler: gelismeMuhabirleri(g).filter((m) => m.kisiId !== kisiId) } : g,
  );
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
        gelismeler: gelismeler.some((g, i) => g !== d.gelismeler[i]) ? gelismeler : d.gelismeler,
        okundu: anahtarlariAt(d.okundu, kendi) ?? {},
        anaSayfa: anahtarlariAt(d.anaSayfa, (x) => x.startsWith(`${kisiId}:`)),
        oneriGorunumu: anahtarlariAt(d.oneriGorunumu, kendi),
        ortamlar: anahtarlariAt(d.ortamlar, kendi),
        kisayollar: anahtarlariAt(d.kisayollar, kendi),
        postaOkunan: anahtarlariAt(d.postaOkunan, kendi),
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
/*
 * Yapıştırılan e-posta listesinden eşleşen adresleri kişilere yazar
 * (epostaEslestir.ts; kullanıcı onayladıktan sonra). Kişi düzenleme yetkisi.
 * Hesabı açık kişinin kurumsal adresi giriş adresidir, buradan değişmez
 * ("Düzenle"deki aktivasyon akışı); başka kişide kayıtlı adres yazılmaz.
 * Değişmeyen kişinin nesnesine dokunulmaz (fark nesne kimliğiyle çıkıyor).
 */
export const epostaListesiUygula = (ben: Kisi, satirlar: { kisiId: string; adres: string; alan: "eposta" | "kisiselEposta" }[]): { yazilan: number; atlanan: number } | null => {
  if (!ben.hesapYoneticisi && !hesapYetkisi(ben, "kisiDuzenle")) return null;
  const d = getir();
  const sahip = new Map<string, string>();
  for (const k of d.kisiler) for (const a of [k.eposta, k.kisiselEposta]) if (a) sahip.set(a.toLowerCase(), k.id);
  const degisen = new Map<string, Kisi>();
  let yazilan = 0;
  let atlanan = 0;
  for (const s of satirlar) {
    const adres = s.adres.trim().toLowerCase();
    const k = degisen.get(s.kisiId) ?? d.kisiler.find((x) => x.id === s.kisiId);
    const baskasinin = sahip.get(adres);
    if (!k || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(adres) || (baskasinin && baskasinin !== k.id) || (s.alan === "eposta" && GERCEK && !k.hesapsiz)) {
      atlanan++;
      continue;
    }
    degisen.set(k.id, { ...k, [s.alan]: adres });
    sahip.set(adres, k.id);
    yazilan++;
  }
  if (degisen.size) kaydet({ ...d, kisiler: d.kisiler.map((k) => degisen.get(k.id) ?? k) });
  return { yazilan, atlanan };
};

/*
 * Postadan kişiler (postaKisileri.ts; yönetici önizlemede seçtikten sonra),
 * tek yazışta. Kayıtlı kişide yalnız boş alan dolar (adres, telefon); dolu
 * bilgi değişmez. Birim ya da ünvan seçimi değiştiyse tayin
 * (kisiPozisyonu'nun kuralıyla, hareketiyle). Yeni kişi hesapsız açılır
 * (gerçek kipte), Arapça adı zorunlu; adresi başkasında kayıtlıysa atlanır.
 */
export interface PostaKisiKaydi {
  adres: string;
  /** Kayıtlı kişi; yoksa yeni kişi. */
  kisiId?: string;
  adAr?: string;
  adLatin?: string;
  telefon?: string;
  birim: BirimId;
  gorev: GorevId;
}

export const postaKisileriUygula = (ben: Kisi, satirlar: PostaKisiKaydi[]): { eklenen: number; guncellenen: number; atlanan: number } | null => {
  const duzenler = hesapYetkisi(ben, "kisiDuzenle");
  const ekler = hesapYetkisi(ben, "hesapsizKisi");
  if (!duzenler && !ekler) return null;
  let d = getir();
  const sahip = new Map<string, string>();
  for (const k of d.kisiler) for (const a of [k.eposta, k.kisiselEposta]) if (a) sahip.set(a.toLowerCase(), k.id);
  const gecerli = (b: BirimId, g: GorevId) => !!b && !grupMu(b) && unvanListesi(b).includes(g);
  const degisen = new Map<string, Kisi>();
  const tayinler: { eski: Kisi; yeni: Kisi }[] = [];
  const yeniler: Kisi[] = [];
  let atlanan = 0;
  satirlar.forEach((s, i) => {
    const adres = s.adres.trim().toLowerCase();
    const baskasinin = sahip.get(adres);
    const telefon = s.telefon?.trim();
    if (s.kisiId) {
      const eski = d.kisiler.find((k) => k.id === s.kisiId);
      const k = degisen.get(s.kisiId) ?? eski;
      if (!duzenler || !k || !eski || (baskasinin && baskasinin !== k.id)) return void atlanan++;
      let yeni: Kisi = k;
      if (!baskasinin) {
        const alan = bosAlan(k, !GERCEK || !!k.hesapsiz);
        if (alan) {
          yeni = { ...yeni, [alan]: adres };
          sahip.set(adres, k.id);
        }
      }
      if (telefon && !k.telefon?.trim()) yeni = { ...yeni, telefon };
      if ((s.birim !== k.birim || s.gorev !== k.gorev) && gecerli(s.birim, s.gorev)) {
        const { kontrolBekliyor: _, ...kalan } = yeni;
        const yerli = yerUnvaniUygula({ ...kalan, birim: s.birim, gorev: s.gorev });
        yeni = { ...yerli, rol: unvandanRol(yerli.gorev, k) };
      }
      if (yeni === k) return void atlanan++;
      degisen.set(k.id, yeni);
      return;
    }
    const adAr = s.adAr?.trim();
    if (!ekler || baskasinin || !adAr || !gecerli(s.birim, s.gorev)) return void atlanan++;
    const latin = s.adLatin?.trim() || adAr;
    const k: Kisi = {
      ...yeniKisi({ id: `${kimlik("kh")}${i}`, ad: { tr: latin, ar: adAr, en: latin }, eposta: adres, birim: s.birim, gorev: s.gorev, rol: unvandanRol(s.gorev), hesapYoneticisi: false }),
      ...(telefon ? { telefon } : {}),
      ...(GERCEK ? { hesapsiz: true } : {}),
    };
    sahip.set(adres, k.id);
    yeniler.push(k);
  });
  for (const [id, yeni] of degisen) {
    const eski = d.kisiler.find((k) => k.id === id)!;
    if (eski.birim !== yeni.birim || eski.gorev !== yeni.gorev) tayinler.push({ eski, yeni });
  }
  if (!degisen.size && !yeniler.length) return { eklenen: 0, guncellenen: 0, atlanan };
  d = { ...d, kisiler: [...d.kisiler.map((k) => degisen.get(k.id) ?? k), ...yeniler] };
  // Tayin geçmişte kalsın, kişiye bildirim düşsün (kisiPozisyonu gibi).
  for (const { eski, yeni } of tayinler)
    d = hareketYaz(d, { kisiId: ben.id, tip: "kisiTayinEdildi", veri: { ad: yaz(eski.ad), kime: eski.id, birim: yeni.birim, gorev: yeni.gorev, eskiBirim: eski.birim, eskiGorev: eski.gorev } });
  kaydet(d);
  return { eklenen: yeniler.length, guncellenen: degisen.size, atlanan };
};

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

/*
 * Takvimden aylık plana: takvim not gibi, aylık plan kesinleşen plan; ikisi ayrı
 * kayıt. Faaliyetin adı, günü ve yeri aylık plana yeni olay olarak kopyalanır,
 * sonra aylık planda kendi başına düzenlenir. Bağlantı takvim tarafında kalıyor.
 */
export const faaliyetAylikaEkle = (ben: Kisi, id: string, tarih: string, _tur: IcerikTuru): string | null => {
  const d = getir();
  const f = faaliyetBul(d, id);
  if (!f || !aylikDuzenler(ben)) return null;
  const [y, olayId] = aylikOlayYaz(d, ben, { baslik: f.baslik, tarih, yer: f.sehir, etiketler: [], gunler: [], ekip: [] });
  const planId = y.aylik.find((a) => a.olaylar?.some((o) => o.id === olayId))!.id;
  kaydet(baglantiYaz(y, ben, f, { tur: "aylik", planId, kayitId: olayId, tarih }));
  return planId;
};

/* --- Aylık plan (aylik.ts): olaylar, onay, Weekly'ye ve özel yayına öneri --- */

export const aylikDuzenler = (ben: Kisi) => yapabilir(ben, "planDuzenle") || !!ben.hesapYoneticisi;

export type AylikOlayGirdisi = Omit<AylikOlay, "id"> & { id?: string };

/* Olay başladığı ayın planına girer; plan yoksa açılır, günü başka aya taşınan olay o aya geçer. */
const aylikOlayYaz = (d: Durum, ben: Kisi, g: AylikOlayGirdisi): [Durum, string] => {
  const id = g.id ?? kimlik("ao");
  const ay = olayAyi(g.tarih);
  const temiz: AylikOlay = {
    ...g,
    id,
    baslik: g.baslik.trim(),
    ...(g.bitis && g.bitis > g.tarih ? { bitis: g.bitis } : { bitis: undefined }),
    gunler: g.gunler.map((x) => ({ ...x, satirlar: x.satirlar.filter((s) => s.metin.trim() || s.tur !== "diger") })).filter((x) => x.satirlar.length).sort((a, b) => a.tarih.localeCompare(b.tarih)),
    ekip: g.ekip.filter((e) => e.kisiId || e.ad?.trim() || e.tbc),
    baglanti: undefined,
    baglantilar: olayBaglantilari(g),
  };
  let aylik = d.aylik.map((a) => (a.olaylar?.some((o) => o.id === id) && a.ay !== ay ? { ...a, olaylar: a.olaylar.filter((o) => o.id !== id) } : a));
  if (!aylik.some((a) => a.ay === ay)) aylik = [...aylik, { id: kimlik("ay"), ay, durum: "hazirlik", kalemler: [], olaylar: [] } satisfies AylikPlan];
  aylik = aylik.map((a) => (a.ay !== ay ? a : { ...a, olaylar: a.olaylar?.some((o) => o.id === id) ? a.olaylar.map((o) => (o.id === id ? temiz : o)) : [...(a.olaylar ?? []), temiz] }));
  return [hareketYaz({ ...d, aylik }, { kisiId: ben.id, tip: "aylikOlayKaydedildi", veri: { ay, baslik: temiz.baslik } }), id];
};

export const aylikOlayKaydet = (ben: Kisi, g: AylikOlayGirdisi): string | null => {
  if (!aylikDuzenler(ben) || !g.baslik.trim() || !g.tarih) return null;
  const [y, id] = aylikOlayYaz(getir(), ben, g);
  kaydet(y);
  return id;
};

export const aylikOlaySil = (ben: Kisi, olayId: string) => {
  const d = getir();
  if (!aylikDuzenler(ben) || !d.aylik.some((a) => a.olaylar?.some((o) => o.id === olayId))) return false;
  kaydet({ ...d, aylik: d.aylik.map((a) => (a.olaylar?.some((o) => o.id === olayId) ? { ...a, olaylar: a.olaylar.filter((o) => o.id !== olayId) } : a)) });
  return true;
};

/** Hazırlık → onaylı ve geri; yetki Plan yetkileri'nde ("ayOnay", varsayılan Planlama yöneticisi). */
export const aylikDurum = (ben: Kisi, planId: string, durum: AylikPlan["durum"]) => {
  const d = getir();
  const p = d.aylik.find((a) => a.id === planId);
  if (!p || p.durum === durum || !planAdimiYapabilir(ben, "ayOnay")) return false;
  const yeni: AylikPlan = durum === "onayli" ? { ...p, durum, onay: { kisiId: ben.id, zaman: simdi() } } : { ...p, durum, onay: undefined };
  kaydet(hareketYaz({ ...d, aylik: d.aylik.map((a) => (a.id === planId ? yeni : a)) }, { kisiId: ben.id, tip: durum === "onayli" ? "aylikOnaylandi" : "aylikHazirligaAlindi", veri: { ay: p.ay } }));
  return true;
};

/*
 * Aylık olayı haftanın gündemine kalem olarak alır: kesin değil, Weekly'de
 * karar bekleyen kalem (yeniden değerlendirilir). Yer, açıklama, biçimler,
 * strap (ilk PKG satırı), muhabir (ya da TBC) ve not olaydan; kalem olayı gösterir.
 */
export const aylikOlayiGundemeEkle = (ben: Kisi, haftaId: string, olayId: string, tarih?: string): string | null => {
  const d = getir();
  const h = haftaBul(d, haftaId);
  const olay = d.aylik.flatMap((a) => a.olaylar ?? []).find((o) => o.id === olayId);
  if (!h || !olay || h.kalemler.some((k) => k.aylikOlayId === olayId)) return null;
  const muhabirler = olay.ekip.filter((e) => e.gorev === "muhabir" && e.kisiId).map((e) => e.kisiId!);
  return kalemKaydet(ben, haftaId, {
    tarih,
    baslik: olay.baslik,
    yer: olay.yer,
    metin: (olay.aciklama || olay.baslik).trim(),
    tur: olay.etiketler.includes("ekonomi") ? "ekonomi" : "haber",
    bicimler: olayBicimleri(olay),
    paketBasligi: olay.gunler.flatMap((g) => g.satirlar).find((s) => s.tur === "pkg" && s.metin.trim())?.metin,
    muhabirler,
    muhabirTbc: !muhabirler.length && olay.ekip.some((e) => e.gorev === "muhabir" && e.tbc),
    not: olay.not,
    aylikOlayId: olayId,
  });
};

/** Aylık plandaki özel yayın önerisi Özel yayın bölümünde açılır; yayın kendi onayına (ozOnay) tabi. */
export const aylikOlaydanOzel = (ben: Kisi, olayId: string): string | null => {
  const olay = getir().aylik.flatMap((a) => a.olaylar ?? []).find((o) => o.id === olayId);
  if (!olay) return null;
  const ozelId = ozelOlustur(ben, { ad: olay.baslik, tarih: olay.tarih, bitis: olay.bitis, aciklama: [olay.aciklama, olay.onem].filter(Boolean).join("\n") });
  if (!ozelId) return null;
  const d = getir();
  kaydet({ ...d, aylik: d.aylik.map((a) => (a.olaylar?.some((o) => o.id === olayId) ? { ...a, olaylar: a.olaylar.map((o) => (o.id === olayId ? { ...o, ozelId } : o)) } : a)) });
  return ozelId;
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

/** Kişinin çalışma günleri: kişi kendisi ya da profili düzenleyebilen yazar; Planlama kimin hangi gün çalıştığını görsün. */
export const kisiCalismaGunleri = (ben: Kisi, kisiId: string, gunler: number[]) => {
  const d = getir();
  const kisi = d.kisiler.find((k) => k.id === kisiId);
  if (!kisi || !profilDuzenler(ben, kisi)) return false;
  const temiz = [...new Set(gunler.filter((g) => Number.isInteger(g) && g >= 0 && g <= 6))].sort();
  kaydet({
    ...d,
    kisiler: d.kisiler.map((k) => {
      if (k.id !== kisiId) return k;
      const { calismaGunleri: _, ...kalan } = k;
      return temiz.length ? { ...kalan, calismaGunleri: temiz } : kalan;
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
    durum: "teklif",
  };
  d = { ...d, oneriler: [o, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriMuhabireGonderildi", oneriId: id, veri: { kime: m.id, muhabir: m.id } }));
  return id;
};

/*
 * Geri çekme: muhabir Planlama dokunmadan önerisini, planlamacı muhabire
 * gönderdiği teklifi. Öneri silinmez, arşive gider; karşı taraf haberdar.
 */
export const oneriGeriCek = (ben: Kisi, id: string) => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !oneriGeriCekebilir(ben, o)) return false;
  const muhabir = ben.id === o.muhabirId;
  kaydet(
    hareketYaz(
      { ...d, oneriler: d.oneriler.map((x) => (x.id === id ? { ...x, durum: "geriCekildi" as const } : x)) },
      { kisiId: ben.id, tip: "oneriGeriCekildi", oneriId: id, veri: muhabir ? { sahip: "planlama" } : { kime: o.muhabirId ?? "" } },
    ),
  );
  return true;
};

/* Planlamacı öneriyi günü beklemeden arşive gönderir; kayıt yerinde, yalnız güncel listelerden kalkar. */
export const oneriArsiveGonder = (ben: Kisi, id: string) => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !yapabilir(ben, "oneriDegerlendir") || o.arsiv) return false;
  const { arsivdenCikti: _, ...x } = o;
  kaydet(
    hareketYaz(
      { ...d, oneriler: d.oneriler.map((y) => (y.id === id ? { ...x, arsiv: { zaman: simdi(), kisiId: ben.id } } : y)) },
      { kisiId: ben.id, tip: "oneriArsiveGonderildi", oneriId: id },
    ),
  );
  return true;
};

/*
 * Arşivden çıkarma: elle arşiv kalkar, arşiv günü bu andan sayılır.
 * Reddedilmiş ya da geri çekilmiş öneri yeniden değerlendirmeye açılır;
 * öbürü olduğu aşamada kalır.
 */
export const oneriArsivdenCikar = (ben: Kisi, id: string) => {
  const d = getir();
  const o = oneriBul(d, id);
  if (!o || !arsivdenCikarabilir(ben)) return false;
  const { arsiv: _, ...x } = o;
  const kapali = o.durum === "reddedildi" || o.durum === "geriCekildi";
  // Değerlendirmeye açılan reddedilmiş önerinin eski ret gerekçesi kalmasın: yeniden karar bekliyor.
  const { gerekce: _g, ...acik } = x;
  const yeni: Oneri = { ...(kapali ? acik : x), arsivdenCikti: simdi(), ...(kapali && { durum: "degerlendiriliyor" as const }) };
  kaydet(
    hareketYaz({ ...d, oneriler: d.oneriler.map((y) => (y.id === id ? yeni : y)) }, { kisiId: ben.id, tip: "oneriArsivdenCikarildi", oneriId: id, veri: o.muhabirId ? { kime: o.muhabirId } : undefined }),
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
  konu: string;
  aciklama?: string;
  tur: TakipTuru;
  tarih?: string;
}

/**
 * Muhabir izlediği konuyu ekler (takip aşamasında öneri; sonra öneri gibi düzeltilir).
 * Yeni takip Planlama'ya bildirim: işe dönüştürmek ya da muhabirle
 * konuşmak onların kararı.
 */
export const takipKaydet = (ben: Kisi, g: TakipGirdisi): string | null => {
  if (!takipEkleyebilir(ben) || !g.konu.trim()) return null;
  let d = getir();
  const alanlar = { konu: g.konu.trim(), tur: g.tur, ...(g.aciklama?.trim() && { aciklama: g.aciklama.trim() }), ...(g.tarih && { tarih: g.tarih }) };
  // Takip, Takip aşamasında öneri; ayrı takip kaydı yalnız eski düzenden (geçiş çeviriyor).
  const id = kimlik("o");
  const oneri: Oneri = {
    id,
    muhabirId: ben.id,
    ulke: sehirUlkesi(ben.sehir, d),
    haberBasligi: alanlar.konu,
    gelisme: alanlar.aciklama ?? alanlar.konu,
    tur: "haber",
    bicim: TAKIP_BICIMI,
    takipTuru: g.tur,
    sahaGerekli: false,
    zaman: simdi(),
    kanal: "sistem",
    ...(alanlar.tarih && { hedefTarih: alanlar.tarih }),
    durum: "takip",
  };
  d = { ...d, oneriler: [oneri, ...d.oneriler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "takipEklendi", oneriId: id, veri: { sahip: "planlama" } }));
  return id;
};

/*
 * Muhabir kendi takibini öneriye çeviriyor (kurum kararı): takip Planlama'ya
 * "yeni" öneri olarak düşüyor; muhabirin önerisinde strap ve gün zorunlu
 * (oneriGonder'in kuralı). Gelişme satırları önerinin gelişmesine eklenir,
 * kaybolmasın. Çevrilen takip artık silinmeye gitmiyor.
 */
export const takipOneriyeCevir = (ben: Kisi, oneriId: string, g: { paketBasligi: string; bicim: Bicim; hedefTarih: string }) => {
  const d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || o.durum !== "takip" || o.muhabirId !== ben.id || !g.paketBasligi.trim() || !g.hedefTarih) return false;
  const satirlar = (o.satirlar ?? []).map((x) => x.metin).join("\n");
  const { takipTuru: _t, ...kalan } = o;
  const yeni: Oneri = { ...kalan, durum: "yeni", bicim: g.bicim, paketBasligi: g.paketBasligi.trim(), hedefTarih: g.hedefTarih, gelisme: satirlar ? `${o.gelisme}\n${satirlar}` : o.gelisme };
  kaydet(hareketYaz({ ...d, oneriler: d.oneriler.map((x) => (x.id === oneriId ? yeni : x)) }, { kisiId: ben.id, tip: "oneriGeldi", oneriId, veri: { sahip: "planlama" } }));
  return true;
};

/*
 * Takipte muhabir metni değiştirmez, altına tarihli gelişme satırı ekler:
 * önceki satırlar kalır, Planlama neyin yeni olduğunu görür. Son satır
 * arşiv gününü ileri taşır, takip canlı kalır. Planlama'ya bildirim.
 */
export const takipSatiriEkle = (ben: Kisi, oneriId: string, metin: string) => {
  return oneriyeSatirlarEkle(ben, oneriId, [metin]);
};

/** Bir ya da birkaç satır tek yazışla (gündem sepeti); satırların zamanı sırayı korusun diye milisaniye arayla. */
export const oneriyeSatirlarEkle = (ben: Kisi, oneriId: string, metinler: string[]) => {
  const d = getir();
  const o = oneriBul(d, oneriId);
  const temiz = metinler.map((m) => m.trim()).filter(Boolean);
  if (!o || !oneriSatiriEkleyebilir(ben, o) || !temiz.length) return false;
  const t0 = Date.now();
  const yeni: Oneri = { ...o, satirlar: [...(o.satirlar ?? []), ...temiz.map((metin, i) => ({ zaman: new Date(t0 + i).toISOString(), metin }))] };
  kaydet(hareketYaz({ ...d, oneriler: d.oneriler.map((x) => (x.id === oneriId ? yeni : x)) }, { kisiId: ben.id, tip: "takipSatiriEklendi", oneriId, veri: { sahip: "planlama" } }));
  return true;
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
/*
 * Ekonomi (ve masası olan öbür kollar) önce stoka düşüyordu, Planlama'nın
 * stok ekibi üretiyordu; şimdi kendi masasında. Sistemin açılış işi:
 * henüz üretime alınmamış masa paketinin stok işareti kalkar, masasına
 * geçer. Bitmiş (stokta) paket yerinde kalır, Next Day'den yine seçilir.
 */
/*
 * Künyeden önce bitmiş paketin künyesi hareket kaydından (kunye.ts →
 * hareketlerdenKunye): yalnız izi hâlâ duran yakın tarihli paket; sistemin
 * açılış işi, yalnız bir şey bulunca yazar.
 */
export const kunyeleriDoldur = (): number => {
  let d = getir();
  const izli = new Set(d.hareketler.map((h) => h.paketId).filter(Boolean));
  let n = 0;
  for (const p of d.paketler) {
    if (p.durum !== "tamamlandi" || p.kunye || !izli.has(p.id)) continue;
    const y = hareketlerdenKunye(d, p);
    if (y === p) continue;
    d = paketGuncelle(d, p.id, () => y);
    n++;
  }
  if (n) kaydet(d);
  return n;
};

export const masaPaketleriniStoktanAyir = (): number => {
  let d = getir();
  const tasinacak = d.paketler.filter((p) => p.stok && masaPaketi(p) && p.durum === "onaylandi" && !p.adim);
  for (const p of tasinacak) d = paketGuncelle(d, p.id, (x) => ({ ...x, stok: undefined }));
  if (tasinacak.length) kaydet(d);
  return tasinacak.length;
};

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

/*
 * Önerideki "plana eklendi" (durum, plan, gün, paket) plandaki kayıttan
 * türeyen kopya; sistemin açılış işi onu kayıtla eşitliyor. Kopya ayrı
 * yazıldığı için kayabiliyordu: plana birkaç kez girip çıkan öneri planda
 * durduğu halde "değerlendiriliyor" kalıyor, muhabire onay gönderilemiyordu.
 * Kopyanın kalması muhabir yüzünden: kısıtlı muhabir planı okuyamıyor,
 * kendi ekranı öneriden okuyor. Kural `oneriPlanaGore`'de.
 */
export const onerileriPlanlaEsitle = (): number => {
  const d = getir();
  let n = 0;
  const oneriler = d.oneriler.map((o) => {
    const x = oneriPlanaGore(d, o);
    if (x !== o) n++;
    return x;
  });
  if (n) kaydet({ ...d, oneriler });
  return n;
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
  // Yayına hazır: yayının stoktaki dosya paketleri bu yayınla verildi, Stok'ta "yayınlanan"a geçer (geri alınınca stoka döner).
  if (adim === "hazir") {
    for (const p of d.paketler.filter((x) => x.ozelId === id && x.durum === "tamamlandi"))
      if (tamam ? !p.yayinlandi : p.yayinlandi?.ozelId === id) d = paketGuncelle(d, p.id, (x) => ({ ...x, yayinlandi: tamam ? { ozelId: id, tarih: o.bitis ?? o.tarih } : undefined }));
  }
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
    return ver ? kunyeYaz({ ...kalan, guncelleme: simdi() }, "gorevlendiren", ben.id, simdi()) : { ...kalan, ozelGorevBekliyor: true as const, guncelleme: simdi() };
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
  d = paketOnerisiIzi(paketGuncelle(d, paketId, (x) => kunyeYaz({ ...x, hazirlayanId: kisiId, guncelleme: simdi() }, "gorevlendiren", ben.id, simdi())), ben, p, "gorevli");
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

/* --- Muhasebe (muhasebe.ts). Hareket yazılmaz: hareket kaydını herkes okuyor, anlaşma bilgisi gizli. --- */

const muhasebeYaz = (ben: Kisi, f: (d: Durum) => Durum | null): boolean => {
  if (!muhasebeGorebilir(ben)) return false;
  const d = getir();
  const y = f(d);
  if (!y) return false;
  kaydet(y);
  return true;
};

export const muhasebeTanimKaydet = (ben: Kisi, t: Omit<MuhasebeTanimi, "id"> & { id?: string }) =>
  muhasebeYaz(ben, (d) => {
    const ad = t.ad.trim();
    if (!ad) return null;
    const l = d.muhasebeTanimlari ?? [];
    if (l.some((x) => x.tur === t.tur && x.id !== t.id && x.ad.trim().toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"))) return null;
    const yeni: MuhasebeTanimi = { id: t.id ?? kimlik("mt"), tur: t.tur, ad, ...(t.tur === "fiyat" ? { isler: t.isler ?? [] } : {}) };
    return { ...d, muhasebeTanimlari: t.id ? l.map((x) => (x.id === t.id ? yeni : x)) : [...l, yeni] };
  });

export const muhasebeTanimSil = (ben: Kisi, id: string) =>
  muhasebeYaz(ben, (d) => ((d.muhasebeTanimlari ?? []).some((x) => x.id === id) ? { ...d, muhasebeTanimlari: d.muhasebeTanimlari!.filter((x) => x.id !== id) } : null));

export const muhasebeAnlasmaKaydet = (ben: Kisi, a: MuhasebeAnlasmasi) =>
  muhasebeYaz(ben, (d) => {
    const l = d.muhasebeAnlasmalari ?? [];
    const yeni: MuhasebeAnlasmasi = { ...a, degisti: { kisiId: ben.id, zaman: simdi() } };
    return { ...d, muhasebeAnlasmalari: l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? yeni : x)) : [...l, yeni] };
  });

export const muhasebeAnlasmaSil = (ben: Kisi, kisiId: string) =>
  muhasebeYaz(ben, (d) => ((d.muhasebeAnlasmalari ?? []).some((x) => x.id === kisiId) ? { ...d, muhasebeAnlasmalari: d.muhasebeAnlasmalari!.filter((x) => x.id !== kisiId) } : null));

/** Ayın kapanışı: o aya özel kota, onay ya da ödendi işareti (null kaldırır). */
export const muhasebeKapanisKaydet = (
  ben: Kisi,
  ayi: string,
  kisiId: string,
  degisiklik: { kotaPaket?: number | null; kotaCanli?: number | null; onay?: boolean; odendi?: boolean },
) =>
  muhasebeYaz(ben, (d) => {
    const id = kapanisKimligi(ayi, kisiId);
    const l = d.muhasebeKapanislari ?? [];
    const eski = l.find((x) => x.id === id) ?? { id, ay: ayi, kisiId };
    const iz = { kisiId: ben.id, zaman: simdi() };
    const yeni: MuhasebeKapanisi = { ...eski };
    for (const k of ["kotaPaket", "kotaCanli"] as const)
      if (degisiklik[k] !== undefined) {
        if (degisiklik[k] === null) delete yeni[k];
        else yeni[k] = degisiklik[k]!;
      }
    for (const k of ["onay", "odendi"] as const)
      if (degisiklik[k] !== undefined) {
        if (degisiklik[k]) yeni[k] = iz;
        else delete yeni[k];
      }
    // Ödendi onaydan sonra; onay kalkınca ödendi de kalkar.
    if (yeni.odendi && !yeni.onay) yeni.onay = iz;
    if (degisiklik.onay === false) delete yeni.odendi;
    return { ...d, muhasebeKapanislari: l.some((x) => x.id === id) ? l.map((x) => (x.id === id ? yeni : x)) : [...l, yeni] };
  });

/** İlk kurulum: Excel'den eşlenen satırlar anlaşma olur; listede olmayan para birimi ve ödeme aracı tanım olarak eklenir. */
export const muhasebeIceAktar = (ben: Kisi, satirlar: AnlasmaSatiri[]): number => {
  let n = 0;
  muhasebeYaz(ben, (d) => {
    let tanim = [...(d.muhasebeTanimlari ?? [])];
    const tanimAdi = (tur: "para" | "odeme", ad?: string) => {
      const x = ad?.trim();
      if (!x) return undefined;
      const var_ = tanim.find((t) => t.tur === tur && t.ad.toLocaleLowerCase("tr") === x.toLocaleLowerCase("tr"));
      if (var_) return var_.ad;
      tanim = [...tanim, { id: kimlik("mt"), tur, ad: x }];
      return x;
    };
    const l = [...(d.muhasebeAnlasmalari ?? [])];
    for (const s of satirlar) {
      if (!s.kisiId || !s.tur) continue;
      const eski = l.find((a) => a.id === s.kisiId);
      const yeni: MuhasebeAnlasmasi = {
        ...eski,
        id: s.kisiId,
        tur: s.tur,
        ...(s.tutar !== undefined && { tutar: s.tutar }),
        ...(s.kotaPaket !== undefined && { kotaPaket: s.kotaPaket }),
        ...(s.kotaCanli !== undefined && { kotaCanli: s.kotaCanli }),
        ...(s.para && { para: tanimAdi("para", s.para) }),
        ...(s.odeme && { odeme: tanimAdi("odeme", s.odeme) }),
        degisti: { kisiId: ben.id, zaman: simdi() },
      };
      if (eski) l[l.indexOf(eski)] = yeni;
      else l.push(yeni);
      n++;
    }
    return n ? { ...d, muhasebeAnlasmalari: l, muhasebeTanimlari: tanim } : null;
  });
  return n;
};

/** Newsdesk canlı yayının yapılıp yapılmadığını işaretler (null kaldırır); muhasebe yapılanı sayar. */
export const canliSonuc = (ben: Kisi, canliId: string, durum: "yapildi" | "yapilmadi" | null): boolean => {
  if (!canliSonucIsaretleyebilir(ben)) return false;
  const d = getir();
  const c = d.canliYayinlar.find((x) => x.id === canliId);
  if (!c || (c.sonuc?.durum ?? null) === durum) return false;
  const yeni = { ...c };
  if (durum) yeni.sonuc = { durum, kisiId: ben.id, zaman: simdi() };
  else delete yeni.sonuc;
  kaydet({ ...d, canliYayinlar: d.canliYayinlar.map((x) => (x.id === canliId ? yeni : x)) });
  return true;
};
