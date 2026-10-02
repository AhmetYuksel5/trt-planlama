import { ilkAdim, paketSahibi, sonrakiAdim, type UretimAdimi } from "./akis";
import { bosYanitMi, cagriyiBul, gondereniBul, yanittanOneriTaslagi, yeniMetin, type GelenEposta } from "./eposta";
import { simdi } from "./tarih";
import {
  SEHIRLER,
  getir,
  kaydet,
  kimlik,
  kisiBul,
  oneriBul,
  paketBul,
  planBul,
  type Birim,
  type CanliYayin,
  type Durum,
  type EkipUyesi,
  type Gelisme,
  type Gorevlendirme,
  type Hareket,
  type IcerikTuru,
  type Bicim,
  type Kanal,
  type Kisi,
  type NextDayPlan,
  type Oneri,
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
  mudahaleEdebilir,
  paketGorebilir,
  planIcerikDuzenler,
  planOperasyonDuzenler,
  profilDuzenler,
  talimatVerebilir,
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
export const cagriKaydet = (ben: Kisi, g: { tarih: string; metin: string; sonSaat: string; kime: string; bcc: string[]; etiket: string }) => {
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
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "cagriHazirlandi", veri: { tarih: g.tarih, sahip: "muhabir" } }));
  return true;
};

export interface OneriGirdisi {
  muhabirId: string;
  ulke: Ulke;
  haberBasligi: string;
  gelisme: string;
  paketBasligi?: string;
  tur: IcerikTuru;
  bicim?: Bicim;
  sahaGerekli: boolean;
  kanal: Kanal;
  hedefTarih: string;
}

export const oneriGonder = (ben: Kisi, g: OneriGirdisi): string | null => {
  if (!yapabilir(ben, "oneriGonder")) return null;
  // Muhabir yalnız kendi adına gönderir; Planlama e-postayla ya da telefonla gelen öneriyi muhabir adına girer.
  const muhabirId = ben.birim === "muhabir" ? ben.id : g.muhabirId;
  const kanal: Kanal = ben.birim === "muhabir" ? "sistem" : g.kanal;
  let d = getir();
  const cagri = d.cagrilar.find((c) => c.tarih === g.hedefTarih);
  const id = kimlik("o");
  d = {
    ...d,
    oneriler: [
      {
        id,
        muhabirId,
        ulke: g.ulke,
        haberBasligi: g.haberBasligi,
        gelisme: g.gelisme,
        paketBasligi: g.paketBasligi || undefined,
        tur: g.tur,
        bicim: g.bicim,
        sahaGerekli: g.sahaGerekli,
        zaman: simdi(),
        kanal,
        hedefTarih: g.hedefTarih,
        durum: "yeni",
        cagriId: cagri?.id,
      },
      ...d.oneriler,
    ],
  };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "oneriGeldi", oneriId: id, veri: { sahip: "planlama" } }));
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
  // Talimatın muhabiri yok; Planlama burada atıyor. Önerinin kendisi değişmiyor.
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
    kaynakTuru: o.talimatVeren ? "diger" : "muhabir",
    kaynakAdi: "",
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

/** Toplantıdan sonra muhabirlere kabul/ret bilgisi. E-posta yerine bildirim; gönderim entegrasyonu sonra. */
export const geriDonusGonder = (ben: Kisi, planId: string): number => {
  let d = getir();
  const plan = planBul(d, planId);
  if (!plan || !yapabilir(ben, "geriDonus")) return 0;
  const hedef = d.oneriler.filter(
    (o) => o.hedefTarih === plan.tarih && !o.geriDonus && ["planaEklendi", "reddedildi", "sonra"].includes(o.durum),
  );
  if (!hedef.length) return 0;
  const ids = new Set(hedef.map((o) => o.id));
  d = { ...d, oneriler: d.oneriler.map((o) => (ids.has(o.id) ? { ...o, geriDonus: true } : o)) };
  for (const o of hedef) {
    d = hareketYaz(d, { kisiId: ben.id, tip: "geriDonus", oneriId: o.id, planId, veri: { sonuc: o.durum } });
  }
  kaydet(d);
  return hedef.length;
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

export interface KopyaSecimi {
  kaynakId: string;
  ekip: boolean;
  gorevlendirmeler: string[];
  basliklar: string[];
  muhabirleriTasi: boolean;
  canliYayinlar: string[];
}

/**
 * Yeni plan. Kopyalanırken yalnız seçilen bölümler taşınıyor: ekip,
 * devam eden muhabir hareketleri, başlıklar (istenirse muhabir
 * atamalarıyla), ileri tarihli canlı yayınlar. Gelişmeler ve paket
 * önerileri hiçbir zaman taşınmıyor; onlar o günün kaydı. Kaynak plan
 * olduğu gibi kalıyor.
 */
export const planOlustur = (ben: Kisi, tarih: string, kopya?: KopyaSecimi): { id: string; vardi: boolean } | null => {
  if (!yapabilir(ben, "planDuzenle")) return null;
  let d = getir();
  const var_ = d.planlar.find((p) => p.tarih === tarih);
  if (var_) return { id: var_.id, vardi: true };
  const kaynak = kopya ? planBul(d, kopya.kaynakId) : undefined;
  const id = kimlik("nd");
  const pbEsle = new Map<string, string>();
  const basliklar =
    kaynak && kopya
      ? kaynak.basliklar
          .filter((b) => kopya.basliklar.includes(b.id))
          .map((b) => {
            const yeniId = kimlik("pb");
            pbEsle.set(b.id, yeniId);
            return { id: yeniId, baslikId: b.baslikId, muhabirler: kopya.muhabirleriTasi ? b.muhabirler.map((m) => ({ ...m })) : [] };
          })
      : [];
  const plan: NextDayPlan = {
    id,
    tarih,
    durum: "taslak",
    ekip: kaynak && kopya?.ekip ? kaynak.ekip.map((e) => ({ ...e })) : [],
    gorevlendirmeler: kaynak && kopya ? kaynak.gorevlendirmeler.filter((g) => kopya.gorevlendirmeler.includes(g)) : [],
    hazirPaketler: [],
    basliklar,
    kopyaKaynagi: kaynak?.id,
    olusturan: ben.id,
    olusturma: simdi(),
  };
  const canlilar: CanliYayin[] =
    kaynak && kopya
      ? d.canliYayinlar
          .filter((c) => c.planId === kaynak.id && kopya.canliYayinlar.includes(c.id))
          .map((c) => ({ ...c, id: kimlik("cy"), planId: id, planBaslikId: c.planBaslikId ? pbEsle.get(c.planBaslikId) : undefined }))
      : [];
  d = { ...d, planlar: [plan, ...d.planlar], canliYayinlar: [...d.canliYayinlar, ...canlilar] };
  kaydet(
    hareketYaz(d, {
      kisiId: ben.id,
      tip: kaynak ? "planKopyalandi" : "planOlusturuldu",
      planId: id,
      veri: { tarih, ...(kaynak ? { kaynak: kaynak.tarih } : {}) },
    }),
  );
  return { id, vardi: false };
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

export const ekipEkle = (ben: Kisi, planId: string, uye: EkipUyesi) =>
  planIcerik(ben, planId, (p) => (p.ekip.some((e) => e.kisiId === uye.kisiId) ? p : { ...p, ekip: [...p.ekip, uye] }));
export const ekipGuncelle = (ben: Kisi, planId: string, kisiId: string, g: Partial<Omit<EkipUyesi, "kisiId">>) =>
  planIcerik(ben, planId, (p) => ({ ...p, ekip: p.ekip.map((e) => (e.kisiId === kisiId ? { ...e, ...g } : e)) }));
export const ekipCikar = (ben: Kisi, planId: string, kisiId: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, ekip: p.ekip.filter((e) => e.kisiId !== kisiId) }));

export const planGorevlendirmeCikar = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, gorevlendirmeler: cikar(p.gorevlendirmeler, id) }));
export const planGorevlendirmeEkle = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, gorevlendirmeler: ekle(p.gorevlendirmeler, id) }));

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

export const hazirPaketEkle = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, hazirPaketler: ekle(p.hazirPaketler, id) }));
export const hazirPaketCikar = (ben: Kisi, planId: string, id: string) =>
  planIcerik(ben, planId, (p) => ({ ...p, hazirPaketler: cikar(p.hazirPaketler, id) }));

export const planBaslikEkle = (ben: Kisi, planId: string, baslikId: string) =>
  planIcerik(ben, planId, (p) =>
    p.basliklar.some((b) => b.baslikId === baslikId)
      ? p
      : { ...p, basliklar: [...p.basliklar, { id: kimlik("pb"), baslikId, muhabirler: [] }] },
  );

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

export const planMuhabir = (ben: Kisi, planId: string, pbId: string, kisiId: string, var_: boolean) =>
  planIcerik(ben, planId, (p) =>
    pbGuncelle(p, pbId, (m) =>
      var_ ? (m.some((x) => x.kisiId === kisiId) ? m : [...m, { kisiId }]) : m.filter((x) => x.kisiId !== kisiId),
    ),
  );

export const planMuhabirGuncelle = (ben: Kisi, planId: string, pbId: string, kisiId: string, g: { yer?: string; saat?: string }) =>
  planIcerik(ben, planId, (p) => pbGuncelle(p, pbId, (m) => m.map((x) => (x.kisiId === kisiId ? { ...x, ...g } : x))));

/* --- Gelişme ve canlı yayın: devirden sonra Newsdesk de ekleyebiliyor (operasyonel güncelleme). --- */

export const gelismeKaydet = (ben: Kisi, g: Omit<Gelisme, "id"> & { id?: string }) => {
  const d = getir();
  const plan = planBul(d, g.planId);
  if (!plan || !planOperasyonDuzenler(ben, plan)) return false;
  if (g.id) {
    kaydet({ ...d, gelismeler: d.gelismeler.map((x) => (x.id === g.id ? { ...x, ...g, id: x.id } : x)) });
  } else {
    kaydet({ ...d, gelismeler: [...d.gelismeler, { ...g, id: kimlik("g") }] });
  }
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
    kaydet({ ...d, canliYayinlar: d.canliYayinlar.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x)) });
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

export const paketKaydet = (ben: Kisi, g: PaketGirdisi): string | null => {
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
  d = { ...d, paketler: [paket, ...d.paketler] };
  kaydet(hareketYaz(d, { kisiId: ben.id, tip: "paketOlusturuldu", paketId: id, planId: plan.id }));
  return id;
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
