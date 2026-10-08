import { KOL_SAHIBI, ilkAdim, paketSahibi, sonrakiAdim, stokDurumu, type UretimAdimi } from "./akis";
import { bosYanitMi, cagriyiBul, gondereniBul, yanittanOneriTaslagi, yeniMetin, type GelenEposta } from "./eposta";
import { gundemde, haftaSonu, kararBekleyenler, nextDayeGider, onIncelemeyeGidebilir } from "./haftalik";
import { GERCEK } from "./kip";
import { KISAYOL_EN_COK, kisayolGorebilir } from "./kisayol";
import { BOLME_EN_COK, ORTAM_EN_COK, bolmeyeGirer, kisininOrtamlari, varsayilanDuzen, yolTemizle } from "./ortam";
import { TAKVIM_KAYNAGI } from "./takvim";
import { bugun, gunEkle, gunFarki, haftaBasi, simdi } from "./tarih";
import {
  ORTAM_DUZENLERI,
  SEHIRLER,
  ULKE_BOLGESI,
  cagriTuru,
  faaliyetBul,
  getir,
  haftaBul,
  kaydet,
  kimlik,
  kisiBul,
  SISTEM,
  oncekiPlan,
  oneriBul,
  paketBul,
  planBul,
  type Birim,
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
  type Gelisme,
  type Gorevlendirme,
  type Hareket,
  type IcerikTuru,
  type Bicim,
  type CagriTuru,
  type HaftalikKalem,
  type HaftalikPlan,
  type Kanal,
  type KaynakTuru,
  type Karar,
  type Kisi,
  type NextDayPlan,
  type Oneri,
  type OneriGorunumu,
  type Paket,
  type PlanDurum,
  type PlanMuhabiri,
  type Sehir,
  type Ulke,
  type Yanit,
  type YanitDurum,
} from "./veri";
import {
  adimYapabilir,
  haftalikDuzenler,
  kararVerebilir,
  mudahaleEdebilir,
  onIncelemeci,
  paketGorebilir,
  planIcerikDuzenler,
  planOperasyonDuzenler,
  profilDuzenler,
  sayfaGorebilir,
  talimatVerebilir,
  uretimeAlabilir,
  yapabilir,
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

const hareketYaz = (d: Durum, h: Omit<Hareket, "id" | "zaman">): Durum => ({
  ...d,
  hareketler: [{ id: kimlik("h"), zaman: simdi(), ...h }, ...d.hareketler].slice(0, EN_COK_HAREKET),
});

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
  bicim?: Bicim;
  sahaGerekli: boolean;
  kanal: Kanal;
  /** Biri dolu: Next Day önerisinde planın günü, haftalık öneride haftanın Cumartesi'si. */
  hedefTarih?: string;
  hafta?: string;
}

export const oneriGonder = (ben: Kisi, g: OneriGirdisi): string | null => {
  if (!yapabilir(ben, "oneriGonder") || (!g.hafta && !g.hedefTarih)) return null;
  const muhabir = ben.birim === "muhabir";
  /*
   * Muhabir yalnız kendi adına gönderir. Planlama sistem dışından geleni
   * elle girer: ya bir muhabir adına (telefon, mesaj) ya da muhabir dışı
   * bir kaynaktan (ajans, resmî duyuru, başka birim); ikisi birden değil.
   */
  const muhabirId = muhabir ? ben.id : g.muhabirId || undefined;
  const kaynakTuru = muhabir || muhabirId ? undefined : g.kaynakTuru;
  if (!muhabirId && (!kaynakTuru || kaynakTuru === "muhabir")) return null;
  const kanal: Kanal = muhabir ? "sistem" : g.kanal;
  let d = getir();
  if (!muhabir && muhabirId && kisiBul(d, muhabirId)?.birim !== "muhabir") return null;
  // Çağrı muhabirlere gidiyor; ajanstan ya da bakanlıktan gelen öneri ona verilmiş yanıt değil.
  const cagri = !muhabirId
    ? undefined
    : g.hafta
      ? d.cagrilar.find((c) => cagriTuru(c) === "haftalik" && c.tarih === g.hafta)
      : d.cagrilar.find((c) => cagriTuru(c) === "nextday" && c.tarih === g.hedefTarih);
  const id = kimlik("o");
  d = {
    ...d,
    oneriler: [
      {
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
        hafta: g.hafta,
        durum: "yeni",
        cagriId: cagri?.id,
      },
      ...d.oneriler,
    ],
  };
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
 * Öneriyi plana ekler. Öneri mevcut bir başlığa bağlanır ya da havuza yeni
 * başlık açar; gelişme o planın başlığı altına düşer, paket başlığı
 * önerilmişse "değerlendiriliyor" durumunda bir paket önerisi doğar.
 * Önerinin kendisi (muhabirin yazdığı metin) değişmez; yalnız durumu ve
 * bağlantıları güncellenir.
 */
export const oneriPlanaEkle = (
  ben: Kisi,
  oneriId: string,
  g: { planId: string; baslikId?: string; yeniBaslik?: string; paketOlustur: boolean; muhabirId?: string },
): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const plan = planBul(d, g.planId);
  if (!o || !plan || !yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, plan)) return false;
  // Talimatın ve muhabir dışı kaynağın muhabiri yok; Planlama burada atıyor. Önerinin kendisi değişmiyor.
  const muhabirId = o.muhabirId ?? (g.muhabirId || undefined);

  let baslikId = g.baslikId;
  if (!baslikId && g.yeniBaslik?.trim()) {
    baslikId = kimlik("b");
    d = { ...d, basliklar: [...d.basliklar, { id: baslikId, ad: g.yeniBaslik.trim(), ulke: o.ulke, aktif: true }] };
  }
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

  const gelisme: Gelisme = {
    id: kimlik("g"),
    planId: plan.id,
    planBaslikId: pbId,
    metin: o.gelisme,
    // Gelişmenin kaynağı önerinin kaynağı: ajanstan girilen öneri planda da ajans olarak görünsün.
    kaynakTuru: o.talimatVeren ? "diger" : (o.kaynakTuru ?? "muhabir"),
    kaynakAdi: o.kaynakAdi ?? "",
    tarih: o.zaman,
    onerenId: muhabirId,
    oneriId: o.id,
  };
  d = { ...d, gelismeler: [...d.gelismeler, gelisme] };

  let paketId: string | undefined;
  if (g.paketOlustur && o.paketBasligi) {
    const muhabir = kisiBul(d, muhabirId);
    let kod: string;
    [kod, d] = yeniKod(d);
    paketId = kimlik("p");
    const paket: Paket = {
      id: paketId,
      kod,
      planId: plan.id,
      planBaslikId: pbId,
      baslik: o.paketBasligi,
      sehir: muhabir?.sehir ?? "istanbul",
      muhabirId,
      aciklama: o.gelisme,
      tur: o.tur,
      bicim: o.bicim,
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

  d = {
    ...d,
    oneriler: d.oneriler.map((x) => (x.id === o.id ? { ...x, durum: "planaEklendi", baslikId, planId: plan.id, paketId } : x)),
  };
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "oneriPlanaEklendi",
      oneriId: o.id,
      paketId,
      planId: plan.id,
      // Talimat plana girince talimatı veren yönetici haberdar oluyor.
      veri: o.talimatVeren ? { tarih: plan.tarih, kime: o.talimatVeren } : { tarih: plan.tarih },
    }),
  );
  return true;
};

/** Kararı verilmiş, muhabire henüz bildirilmemiş öneri. Muhabiri olmayan (talimat, ajans, resmî duyuru) öneride geri dönülecek kimse yok. */
export const geriDonusBekliyor = (o: Oneri) => !!o.muhabirId && !o.geriDonus && ["planaEklendi", "reddedildi", "sonra"].includes(o.durum);

const geriDonusYaz = (ben: Kisi, kapsamda: (o: Oneri) => boolean, bag: { planId?: string; haftaId?: string }): number => {
  let d = getir();
  const hedef = d.oneriler.filter((o) => kapsamda(o) && geriDonusBekliyor(o));
  if (!hedef.length) return 0;
  const ids = new Set(hedef.map((o) => o.id));
  d = { ...d, oneriler: d.oneriler.map((o) => (ids.has(o.id) ? { ...o, geriDonus: true } : o)) };
  for (const o of hedef) {
    d = hareketYaz(d, { kisiId: ben.id, tip: "geriDonus", oneriId: o.id, ...bag, veri: { sonuc: o.durum } });
  }
  kaydet(d);
  return hedef.length;
};

/** Toplantıdan sonra muhabirlere kabul/ret bilgisi. E-posta yerine bildirim; gönderim entegrasyonu sonra. */
export const geriDonusGonder = (ben: Kisi, planId: string): number => {
  const plan = planBul(getir(), planId);
  if (!plan || !yapabilir(ben, "geriDonus")) return 0;
  return geriDonusYaz(ben, (o) => o.hedefTarih === plan.tarih, { planId });
};

/** Haftalık toplantının kararı muhabire: plan kesinleştikten sonra. */
export const haftalikGeriDonus = (ben: Kisi, haftaId: string): number => {
  const h = haftaBul(getir(), haftaId);
  if (!h || h.durum !== "kesinlesti" || !yapabilir(ben, "geriDonus")) return 0;
  return geriDonusYaz(ben, (o) => o.hafta === h.baslangic, { haftaId });
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
  if (!h || !haftalikDuzenler(ben, h) || h.durum === yeni) return false;
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

export const anaKonuKaydet = (ben: Kisi, haftaId: string, g: { id?: string; baslik: string; metin: string }, sonra?: string) =>
  haftaIcerik(ben, haftaId, (h) => {
    const temiz = { baslik: g.baslik.trim(), metin: g.metin.trim() };
    if (!temiz.baslik) return null;
    if (g.id) return { ...h, anaKonular: h.anaKonular.map((a) => (a.id === g.id ? { ...a, ...temiz } : a)) };
    const id = kimlik("ak");
    return { ...h, anaKonular: arkasina([...h.anaKonular, { id, ...temiz }], kimlikOf, id, sonra) };
  });

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
  muhabirler: string[];
  not?: string;
}

/* Yeni dosya havuza giriyor: Next Day'de de aynı başlık kullanılacak. */
const dosyaAc = (d: Durum, ad?: string): [string | undefined, Durum] => {
  if (!ad?.trim()) return [undefined, d];
  const id = kimlik("b");
  return [id, { ...d, basliklar: [...d.basliklar, { id, ad: ad.trim(), aktif: true }] }];
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
  const alanlar = {
    tarih: g.tarih || undefined,
    baslikId,
    baslik: g.baslik?.trim() || undefined,
    yer: g.yer?.trim() || undefined,
    metin: g.metin.trim(),
    tur: g.tur,
    bicimler: g.bicimler,
    muhabirler: g.muhabirler,
    not: g.not?.trim() || undefined,
  };
  if (g.id) {
    const id = g.id;
    if (!h.kalemler.some((k) => k.id === id)) return null;
    kaydet(kalemGuncelle(d, haftaId, id, (k) => ({ ...k, ...alanlar })));
    return id;
  }
  const id = kimlik("hk");
  kaydet(haftaGuncelle(d, haftaId, (x) => ({ ...x, kalemler: arkasina([...x.kalemler, { id, ...alanlar, karar: "bekliyor" as const }], kimlikOf, id, sonra) })));
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
  if (!h || !o || o.hafta !== h.baslangic || !haftalikDuzenler(ben, h) || !yapabilir(ben, "oneriDegerlendir")) return null;
  if (h.kalemler.some((k) => k.oneriId === o.id) || o.durum === "reddedildi") return null;
  if (g.tarih && (g.tarih < h.baslangic || g.tarih > haftaSonu(h.baslangic))) return null;
  let baslikId = g.baslikId || undefined;
  if (!baslikId && g.yeniBaslik?.trim()) [baslikId, d] = dosyaAc(d, g.yeniBaslik);
  const id = kimlik("hk");
  const kalem: HaftalikKalem = {
    id,
    tarih: g.tarih || undefined,
    baslikId,
    baslik: o.haberBasligi,
    metin: o.gelisme,
    tur: o.tur,
    bicimler: o.bicim ? [o.bicim] : [],
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
const haftaliktanAktar = (d: Durum, kisiId: string, haftaId: string, k: HaftalikKalem, plan: NextDayPlan): Durum => {
  let pbId: string | undefined;
  if (k.baslikId) {
    const var_ = plan.basliklar.find((b) => b.baslikId === k.baslikId);
    const pb = var_ ?? { id: kimlik("pb"), baslikId: k.baslikId, muhabirler: [] };
    pbId = pb.id;
    const yeniPb = { ...pb, muhabirler: [...pb.muhabirler, ...k.muhabirler.filter((m) => !pb.muhabirler.some((x) => x.kisiId === m)).map((kisiId) => ({ kisiId }))] };
    d = planGuncelle(d, plan.id, (p) => ({ ...p, basliklar: var_ ? p.basliklar.map((b) => (b.id === pb.id ? yeniPb : b)) : [...p.basliklar, yeniPb] }));
  }
  const muhabirId = k.muhabirler[0];
  // Kalem bir öneriden geldiyse gelişmenin kaynağı o önerinin kaynağı (muhabir, ajans, resmî duyuru…).
  const oneri = oneriBul(d, k.oneriId);
  const gelisme: Gelisme = {
    id: kimlik("g"),
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

  let paketId: string | undefined;
  const bicim = k.bicimler.length ? k.bicimler.find((b) => b !== "canli") : "pkg";
  if (muhabirId && bicim) {
    let kod: string;
    [kod, d] = yeniKod(d);
    paketId = kimlik("p");
    const paket: Paket = {
      id: paketId,
      kod,
      planId: plan.id,
      planBaslikId: pbId,
      baslik: k.baslik || k.metin,
      sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
      muhabirId,
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
  d = kalemGuncelle(d, haftaId, k.id, (x) => ({ ...x, aktarim: { planId: plan.id, paketId } }));
  if (k.oneriId) d = { ...d, oneriler: d.oneriler.map((o) => (o.id === k.oneriId ? { ...o, planId: plan.id, paketId: paketId ?? o.paketId } : o)) };
  return hareketYaz(d, { kisiId, tip: "haftaliktanAktarildi", haftaId, planId: plan.id, paketId, veri: { tarih: plan.tarih, kalem: k.id } });
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
    baslik: k.baslik || k.metin,
    sehir: kisiBul(d, muhabirId)?.sehir ?? "istanbul",
    muhabirId,
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
  return hareketYaz(d, { kisiId: ben.id, tip: "paketOnaylandi", paketId, haftaId, veri: { hafta: "1", sahip: KOL_SAHIBI[k.tur] } });
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
  if (!h || h.durum !== "toplantida" || !yapabilir(ben, "haftalikKesinlestir") || kararBekleyenler(h).length) return false;
  d = haftaGuncelle(d, haftaId, (x) => ({ ...x, durum: "kesinlesti" }));
  for (const k of h.kalemler.filter((x) => gundemde(x) && x.karar === "kabul")) {
    if (k.tur === "haber" && k.tarih) {
      const plan = d.planlar.find((p) => p.tarih === k.tarih);
      // Plan henüz yoksa sistem açınca çekiyor (yarinPlaniniAc); onaylanmış ya da devredilmişse elle eklenir.
      if (plan && (plan.durum === "taslak" || plan.durum === "toplantida")) d = haftaliktanAktar(d, ben.id, haftaId, k, plan);
    } else {
      d = haftaliktanPaket(d, ben, haftaId, k);
    }
  }
  const kalemi = new Map(h.kalemler.filter((k) => k.oneriId).map((k) => [k.oneriId!, k]));
  d = {
    ...d,
    oneriler: d.oneriler.map((o) => {
      if (o.hafta !== h.baslangic) return o;
      const k = kalemi.get(o.id);
      if (k) return k.karar === "ret" ? { ...o, durum: "reddedildi", gerekce: k.onInceleme?.gerekce ?? o.gerekce } : { ...o, durum: "planaEklendi" };
      return o.durum === "yeni" || o.durum === "degerlendiriliyor" ? { ...o, durum: "reddedildi" } : o;
    }),
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "haftalikKesinlesti", haftaId, veri: { tarih: h.baslangic } }));
  return true;
};

/* --- Merkezi başlık havuzu --- */

export const baslikEkle = (ben: Kisi, ad: string, ulke?: Ulke): string | null => {
  if (!yapabilir(ben, "baslikYonet") || !ad.trim()) return null;
  const id = kimlik("b");
  const d = getir();
  kaydet({ ...d, basliklar: [...d.basliklar, { id, ad: ad.trim(), ulke, aktif: true }] });
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
export const yarinPlaniniAc = (): string | null => {
  const tarih = gunEkle(bugun(), 1);
  let d = getir();
  if (d.planlar.some((p) => p.tarih === tarih)) return null;
  const kaynak = oncekiPlan(d, tarih);
  const id = kimlik("nd");
  const pbEsle = new Map<string, string>();
  const basliklar = (kaynak?.basliklar ?? []).map((b) => {
    const yeniId = kimlik("pb");
    pbEsle.set(b.id, yeniId);
    return { id: yeniId, baslikId: b.baslikId, muhabirler: b.muhabirler.map((m) => ({ ...m, onceki: true as const })) };
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
        .map((c) => ({ ...c, id: kimlik("cy"), planId: id, planBaslikId: c.planBaslikId ? pbEsle.get(c.planBaslikId) : undefined, onceki: true }))
    : [];
  /*
   * Gelişme metniyle taşınıyor; öneri ve haftalık kalem bağı kaynak kayıtta
   * kalıyor, yoksa aynı öneri iki planda "plana eklendi" görünürdü.
   */
  const gelismeler: Gelisme[] = kaynak
    ? d.gelismeler
        .filter((g) => g.planId === kaynak.id && (!g.planBaslikId || pbEsle.has(g.planBaslikId)))
        .map(({ oneriId: _o, haftalikKalemId: _h, ...g }) => ({ ...g, id: kimlik("g"), planId: id, planBaslikId: g.planBaslikId ? pbEsle.get(g.planBaslikId) : undefined, onceki: true }))
    : [];
  d = { ...d, planlar: [plan, ...d.planlar], canliYayinlar: [...d.canliYayinlar, ...canlilar], gelismeler: [...d.gelismeler, ...gelismeler] };
  d = hareketYaz(d, {
    kisiId: SISTEM,
    tip: kaynak ? "planKopyalandi" : "planOlusturuldu",
    planId: id,
    veri: { tarih, ...(kaynak ? { kaynak: kaynak.tarih } : {}) },
  });
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
    (yeni === "toplantida" && plan.durum === "taslak" && yapabilir(ben, "planDuzenle")) ||
    (yeni === "taslak" && plan.durum === "toplantida" && yapabilir(ben, "planDuzenle")) ||
    (yeni === "onayli" && plan.durum === "toplantida" && yapabilir(ben, "planOnayla")) ||
    (yeni === "devralindi" && plan.durum === "onayli" && yapabilir(ben, "planDevral"));
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
  }
  if (yeni === "devralindi") {
    for (const p of paketler.filter((x) => x.durum === "onaylandi")) {
      const adim = ilkAdim(p);
      d = paketGuncelle(d, p.id, (x) => ({ ...x, durum: "uretimde", adim }));
      const sahip = paketSahibi({ ...p, durum: "uretimde", adim });
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
/** Çıktıda aynı görevin satırında sıra. */
export const ekipTasi = (ben: Kisi, planId: string, kisiId: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => {
    const gorev = p.ekip.find((e) => e.kisiId === kisiId)?.gorev;
    const yeni = komsuylaDegis(p.ekip, (e) => e.kisiId === kisiId, (e) => e.gorev === gorev, yon);
    return yeni ? { ...p, ekip: yeni } : p;
  });

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
  d = {
    ...d,
    gelismeler: d.gelismeler.filter((g) => g.planBaslikId !== pbId),
    canliYayinlar: d.canliYayinlar.filter((c) => c.planBaslikId !== pbId),
  };
  kaydet(planGuncelle(d, planId, (p) => ({ ...p, basliklar: p.basliklar.filter((b) => b.id !== pbId) })));
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
  planIcerik(ben, planId, (p) =>
    pbGuncelle(p, pbId, (m) =>
      var_
        ? m.some((x) => x.kisiId === kisiId)
          ? m
          : arkasina([...m, { kisiId }], (x) => x.kisiId, kisiId, sonra)
        : m.filter((x) => x.kisiId !== kisiId),
    ),
  );

export const planMuhabirTasi = (ben: Kisi, planId: string, pbId: string, kisiId: string, yon: -1 | 1) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => komsuylaDegis(m, (x) => x.kisiId === kisiId, () => true, yon) ?? m));

export const planMuhabirGuncelle = (ben: Kisi, planId: string, pbId: string, kisiId: string, g: { yer?: string; saat?: string }) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => m.map((x) => (x.kisiId === kisiId ? { ...x, ...g, onceki: undefined } : x))));

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
    basliklar: p.basliklar.map((b) => ({ ...b, muhabirler: b.muhabirler.map((m) => (muhabirSecili(b.id, m.kisiId) ? { ...m, onceki: undefined } : m)) })),
  }));
  d = {
    ...d,
    gelismeler: d.gelismeler.map((g) => (g.planId === planId && secili("gelisme", g.id) ? { ...g, onceki: undefined } : g)),
    canliYayinlar: d.canliYayinlar.map((c) => (c.planId === planId && secili("canli", c.id) ? { ...c, onceki: undefined } : c)),
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
    kaydet({ ...d, gelismeler: d.gelismeler.map((x) => (x.id === g.id ? { ...x, ...g, id: x.id, onceki: undefined } : x)) });
  } else {
    const id = kimlik("g");
    kaydet({ ...d, gelismeler: arkasina([...d.gelismeler, { ...g, id }], kimlikOf, id, sonra) });
  }
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
  kaydet({ ...d, gelismeler: d.gelismeler.filter((x) => x.id !== id) });
  return true;
};

export const canliKaydet = (ben: Kisi, c: Omit<CanliYayin, "id"> & { id?: string }) => {
  const d = getir();
  const plan = planBul(d, c.planId);
  if (!plan || !planOperasyonDuzenler(ben, plan)) return false;
  if (c.id) {
    kaydet({ ...d, canliYayinlar: d.canliYayinlar.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id, onceki: undefined } : x)) });
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
  kaydet({ ...d, canliYayinlar: d.canliYayinlar.filter((x) => x.id !== id) });
  return true;
};

/* --- Paket önerisi --- */

export interface PaketGirdisi {
  id?: string;
  planId: string;
  planBaslikId: string;
  baslik: string;
  sehir: Sehir;
  muhabirId?: string;
  aciklama: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  teslim?: string;
  yayin?: string;
  sahaGerekli: boolean;
  slug?: string;
}

/* Yeni paket listelerde önde (en yeni üstte); belgede "altına ekle" denince o satırın arkasına giriyor. */
export const paketKaydet = (ben: Kisi, g: PaketGirdisi, sonra?: string): string | null => {
  let d = getir();
  const plan = planBul(d, g.planId);
  if (!plan || !planIcerikDuzenler(ben, plan)) return null;
  if (g.id) {
    const id = g.id;
    kaydet(paketGuncelle(d, id, (p) => ({ ...p, ...g, id })));
    return id;
  }
  let kod: string;
  [kod, d] = yeniKod(d);
  const id = kimlik("p");
  const paket: Paket = { ...g, id, kod, durum: "taslak", notlar: [], olusturma: simdi(), guncelleme: simdi() };
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
  if (!p || !plan || !planIcerikDuzenler(ben, plan) || !["taslak", "degerlendiriliyor"].includes(p.durum)) return false;
  kaydet({
    ...d,
    paketler: d.paketler.filter((x) => x.id !== id),
    oneriler: d.oneriler.map((o) => (o.paketId === id ? { ...o, paketId: undefined } : o)),
  });
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
  d = paketGuncelle(d, paketId, (x) => ({ ...x, durum: "uretimde", adim }));
  const sahip = paketSahibi({ ...p, durum: "uretimde", adim });
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
  const adim = p.adim as UretimAdimi;
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
    ...(adim === "newsdesk" ? { gorevZamani: simdi() } : {}),
    ...(adim === "video" ? { muhabirTeslimi: simdi() } : {}),
    ...(sonraki === "tamam" ? { durum: "tamamlandi", adim: undefined } : { adim: sonraki }),
  };
  d = paketGuncelle(d, paketId, () => yeni);
  const veri: Record<string, string> = { adim: sonraki, sahip: paketSahibi(yeni) ?? "" };
  // Stok paketi son adımda yayına değil stoğa giriyor; hareket cümlesi ona göre.
  if (sonraki === "tamam" && p.stok) veri.stok = "1";
  if (g.klipKodu) veri.kod = g.klipKodu;
  if (g.muhabirId) veri.muhabir = g.muhabirId;
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: ADIM_HAREKETI[adim], paketId, planId: p.planId, veri }));
  return true;
};

/** Metin kontrolü ya da dil denetimi metni gerekçeyle muhabire geri gönderebiliyor. */
export const geriGonder = (ben: Kisi, paketId: string, gerekce: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !adimYapabilir(ben, p) || !["kontrol", "dil"].includes(p.adim ?? "") || !gerekce.trim()) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, adim: "metin", duzeltmeSayisi: (x.duzeltmeSayisi ?? 0) + 1 }));
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: "geriGonderildi",
      paketId,
      planId: p.planId,
      veri: { gerekce: gerekce.trim(), adim: "metin", sahip: "muhabir" },
    }),
  );
  return true;
};

export const notEkle = (ben: Kisi, paketId: string, metin: string) => {
  let d = getir();
  const p = paketBul(d, paketId);
  if (!p || !metin.trim() || !paketGorebilir(ben, p, d)) return false;
  d = paketGuncelle(d, paketId, (x) => ({ ...x, notlar: [...x.notlar, { id: kimlik("n"), kisiId: ben.id, zaman: simdi(), metin: metin.trim() }] }));
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

export const profilGuncelle = (ben: Kisi, kisiId: string, g: ProfilGirdisi) => {
  let d = getir();
  const kisi = kisiBul(d, kisiId);
  if (!kisi || !profilDuzenler(ben, kisi)) return false;
  /* Kişi kendi çalışma biçimini değiştiremez: sözleşme Planlama ve Yönetim'in kaydı. */
  const izinli = ben.id === kisiId && !yapabilir(ben, "profilDuzenle") ? { ...g, calisma: undefined } : g;
  const temiz = Object.fromEntries(Object.entries(izinli).filter(([, x]) => x !== undefined)) as ProfilGirdisi;
  if ("foto" in g && g.foto === undefined) temiz.foto = undefined;
  d = { ...d, kisiler: d.kisiler.map((k) => (k.id === kisiId ? { ...k, ...temiz } : k)) };
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
  bicim?: Bicim;
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
 * E-postadan otomatik düşen önerinin başlığı yalnız ilk satır; plancı
 * değerlendirmeden önce düzeltiyor. Muhabirin uygulamadan gönderdiği öneri
 * düzenlenmiyor (orijinal haliyle korunur); burada orijinal, yanıtın kendisi.
 */
export const oneriDuzenle = (ben: Kisi, oneriId: string, g: YanitOneriGirdisi) => {
  if (!yapabilir(ben, "oneriDegerlendir") || !g.haberBasligi.trim()) return false;
  const d = getir();
  const o = oneriBul(d, oneriId);
  if (!o || !o.yanitId || !["yeni", "degerlendiriliyor", "sonra"].includes(o.durum)) return false;
  const yeni: Oneri = {
    ...o,
    haberBasligi: g.haberBasligi.trim(),
    gelisme: g.gelisme.trim(),
    paketBasligi: g.paketBasligi?.trim() || undefined,
    tur: g.tur,
    bicim: g.bicim,
    sahaGerekli: g.sahaGerekli,
  };
  kaydet(hareketYaz({ ...d, oneriler: d.oneriler.map((x) => (x.id === oneriId ? yeni : x)) }, { kisiId: ben.id, tip: "oneriDuzenlendi", oneriId }));
  return true;
};

export const bildirimleriOku = (ben: Kisi) => {
  const d = getir();
  kaydet({ ...d, okundu: { ...d.okundu, [ben.id]: simdi() } });
};

/** Muhabirin şehrinden ülkesi; öneri formunda varsayılan. */
export const ulkesi = (s: Sehir): Ulke => SEHIRLER[s];

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
 * Hesap yöneticisinin kişi hesabı üzerindeki işi: kapatma/açma ve hesap
 * yöneticiliği. Kurallar da aynısını soruyor (firestore.rules); kişi kendi
 * hesabını kapatamıyor, yöneticiliğini bırakamıyor: sistem yöneticisiz
 * kalmasın.
 */
export const kisiHesabi = (ben: Kisi, kisiId: string, ayar: { pasif?: boolean; hesapYoneticisi?: boolean }) => {
  if (!GERCEK || !ben.hesapYoneticisi || kisiId === ben.id) return false;
  const d = getir();
  if (!d.kisiler.some((k) => k.id === kisiId)) return false;
  kaydet({ ...d, kisiler: d.kisiler.map((k) => (k.id === kisiId ? { ...k, ...ayar } : k)) });
  return true;
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
