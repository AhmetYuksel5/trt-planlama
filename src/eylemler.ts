import { ilkAdim, paketSahibi, sonrakiAdim, type UretimAdimi } from "./akis";
import type { Dil, Yazi } from "./dil";
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
  type Kanal,
  type Kisi,
  type NextDayPlan,
  type Paket,
  type PlanDurum,
  type PlanMuhabiri,
  type Sehir,
  type Ulke,
} from "./veri";
import { adimYapabilir, paketGorebilir, planIcerikDuzenler, planOperasyonDuzenler, yapabilir } from "./yetki";

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

/** Çağrı metni kaydediliyor ama gönderilmiyor: e-posta entegrasyonu yok, ekranda bu açıkça yazıyor. */
export const cagriKaydet = (ben: Kisi, g: { tarih: string; dil: Dil; metin: string; sonSaat: string }) => {
  if (!yapabilir(ben, "cagriHazirla")) return false;
  let d = getir();
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

export const oneriDurum = (ben: Kisi, id: string, yeni: "degerlendiriliyor" | "sonra" | "reddedildi", gerekce = "") => {
  if (!yapabilir(ben, "oneriDegerlendir")) return false;
  let d = getir();
  const o = oneriBul(d, id);
  if (!o || o.durum === "planaEklendi") return false;
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
  g: { planId: string; baslikId?: string; yeniBaslik?: string; paketOlustur: boolean },
): boolean => {
  let d = getir();
  const o = oneriBul(d, oneriId);
  const plan = planBul(d, g.planId);
  if (!o || !plan || !yapabilir(ben, "oneriDegerlendir") || !planIcerikDuzenler(ben, plan)) return false;

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
    muhabirler: pb.muhabirler.some((m) => m.kisiId === o.muhabirId) ? pb.muhabirler : [...pb.muhabirler, { kisiId: o.muhabirId }],
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
    kaynakTuru: "muhabir",
    kaynakAdi: "",
    tarih: o.zaman,
    onerenId: o.muhabirId,
    oneriId: o.id,
  };
  d = { ...d, gelismeler: [...d.gelismeler, gelisme] };

  let paketId: string | undefined;
  if (g.paketOlustur && o.paketBasligi) {
    const muhabir = kisiBul(d, o.muhabirId);
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
      muhabirId: o.muhabirId,
      aciklama: o.gelisme,
      tur: o.tur,
      durum: "degerlendiriliyor",
      sahaGerekli: o.sahaGerekli,
      oneriId: o.id,
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
      veri: { tarih: plan.tarih },
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
  baslik: Yazi;
  sehir: Sehir;
  muhabirId?: string;
  aciklama: Yazi;
  tur: IcerikTuru;
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
  d = paketGuncelle(d, paketId, (x) => ({ ...x, adim: "metin" }));
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

export const bildirimleriOku = (ben: Kisi) => {
  const d = getir();
  kaydet({ ...d, okundu: { ...d.okundu, [ben.id]: simdi() } });
};

/** Muhabirin şehrinden ülkesi; öneri formunda varsayılan. */
export const ulkesi = (s: Sehir): Ulke => SEHIRLER[s];
