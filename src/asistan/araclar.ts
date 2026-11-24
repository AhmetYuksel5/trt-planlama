import { metin, kisiAdiDilde, yaz, type Anahtar, type Dil } from "../dil";
import {
  baslikEkle,
  canliKaydet,
  canliSil,
  faaliyetKaydet,
  gelismeKaydet,
  gelismeSil,
  haftalikDurum,
  haftalikKesinlestir,
  haftalikOlustur,
  hareketKaydet,
  hareketSil,
  isDurumu,
  isKaydet,
  kalemKaydet,
  kalemKarar,
  muhabireOneriGonder,
  notEkle,
  oneriArsiveGonder,
  oneriDurum,
  oneriDuzeltmeIste,
  oneriGonder,
  oneriGorevlendir,
  oneriGundemeEkle,
  oneriMasayaSor,
  oneriMesajiGonder,
  oneriPlanaEkle,
  oneriPlandanCikar,
  paketDurum,
  paketGorevVer,
  paketIsaretKarar,
  paketKaydet,
  paketMetniDuzenle,
  paketReddet,
  paketSil,
  paketTeslimGunu,
  planBaslikCikar,
  planBaslikEkle,
  planDurum,
  planMuhabir,
  planMuhabirGuncelle,
  postaGidenEkle,
  toplantiNotuEkle,
} from "../eylemler";
import { kayitAra } from "../arama";
import { BICIM_ADI, HAREKET_TURU_ADI, IS_DURUM_ADI, KANAL_ADI, KARAR_ADI, KISI_DURUM_ADI, PAKET_DURUM_ADI, PLAN_DURUM_ADI, TUR_ADI, faaliyetTuruAdi, kisiAr, oncelikAdi, sehirAdi, sehirUlkesi } from "../etiketler";
import { postaKonuCekirdegi } from "../eposta";
import { isKisinin, isListesi } from "../gorevler";
import { haftaninDosyalari, haftaSonu } from "../haftalik";
import { GERCEK } from "../kip";
import { kisiBugunDurumu, muhabirAdresi } from "../muhabirIletisim";
import { acikGundemde, acikGunPlanlari, oneriHaftada, oneriYeri } from "../oneriPlanlari";
import { oneriSekmesi, type OneriSekmesi } from "../oneriSekmeleri";
import { paketSekmesi } from "../paketSekmeleri";
import { postaGonder as kapiPostaGonder, postaKimlikGetir } from "../posta-kapi";
import { olusumlar } from "../takvim";
import { bugun, gunEkle, haftaBasi, planlananHafta } from "../tarih";
import {
  BICIMLER,
  KARARLAR,
  SECILEN_HAREKET_TURLERI,
  SECILEN_TURLER,
  baslikBul,
  getir,
  haftaBul,
  kimlik,
  kisiBul,
  paketBul,
  planBul,
  type Bicim,
  type BirimId,
  type Durum,
  type FaaliyetTuru,
  type HaftalikPlan,
  type IcerikTuru,
  type IsDurumu,
  type Kanal,
  type Karar,
  type Kisi,
  type NextDayPlan,
  type Oncelik,
} from "../veri";
import { birimAdi, disMuhabirMi, gorevAdi, icMuhabirMi } from "../yapi";
import { isAlabilir, kisitliKisi, oneriGorebilir, paketGorebilir, planIcerikDuzenler, yapabilir } from "../yetki";

/*
 * Asistanın araç yürütücüleri (belgeler/asistan.md). Adlar kapıdaki listeyle aynı
 * (worker/src/asistan.ts → ARACLAR; eşitlik worker/test/asistan.test.ts'te). Her araç kişinin
 * kendi yetkisiyle, ekranın kullandığı eylemle çalışır; asistan yeni yetki doğurmaz.
 *
 * Okuma aracı sonucu hemen döner. Yazma aracı bir form döner (kullanıcı: ekranlar olmasa da her iş
 * asistandan yapılabilsin; söyler, onay ekranı çıkar, orada seçim ve değişiklik yapılır, altında
 * onay): alanlar modelin doldurduğu değerlerle açılır, seçenekler kayıttan. Kişi onaylayınca
 * `calistir` formun son haliyle eylemi çağırır. Kimlik kayıtta yoksa ya da yetki yoksa araç hata
 * döner, form açılmaz. Kişisel alanlar (telefon, e-posta) modele giden sonuca girmez.
 */

export interface AracBaglami {
  ben: Kisi;
  dil: Dil;
  git: (yol: string) => void;
}
export type AracSonucu = Record<string, unknown>;
export interface Secenek {
  deger: string;
  ad: string;
}
export type AlanTuru = "metin" | "uzun" | "tarih" | "saat" | "secim" | "onay" | "coklu";
export interface FormAlani {
  ad: string;
  etiket: Anahtar;
  tur: AlanTuru;
  /** Arapça içerik: sağdan sola. */
  icerik?: boolean;
  zorunlu?: boolean;
  secenekler?: Secenek[];
  /** Seçenekler başka alanın değerine bağlı (plan değişince başlıklar): o alanın değeri → seçenekler. */
  bagli?: { alan: string; harita: Record<string, Secenek[]> };
  /** Yalnız başka alan bu değerdeyken görünür (yeni başlığın adı). */
  kosul?: { alan: string; deger: string };
}
export type Deger = string | boolean | string[];
export type Degerler = Record<string, Deger>;
export interface Form {
  baslik: Anahtar;
  /** Kaydın adı (önerinin Header'ı, paketin Strap'i…): kartın başında, içerik. */
  ozet?: string;
  alanlar: FormAlani[];
  degerler: Degerler;
  /** Onay düğmesinin adı; yoksa "Onayla" (posta ve mesajda "Gönder"). */
  dugme?: Anahtar;
  calistir: (v: Degerler) => AracSonucu | Promise<AracSonucu>;
}
export type Yurutum = { sonuc: AracSonucu } | { form: Form };
type Girdi = Record<string, unknown>;
type Yurutucu = (g: Girdi, b: AracBaglami) => Yurutum;

const s = (x: unknown, en = 2000) => (typeof x === "string" ? x.trim().slice(0, en) : "");
const gun = (x: unknown) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : "");
const saat = (x: unknown) => (typeof x === "string" && /^\d{1,2}:\d{2}$/.test(x.trim()) ? x.trim().padStart(5, "0") : "");
const hata = (kod: string): Yurutum => ({ sonuc: { hata: kod } });
const tamam = (r: unknown, ek: AracSonucu = {}): AracSonucu => (r ? { tamam: true, ...ek } : { hata: "yapilamadi" });
const vs = (v: Degerler, ad: string) => (typeof v[ad] === "string" ? (v[ad] as string).trim() : "");
const vb = (v: Degerler, ad: string) => v[ad] === true;
const va = (v: Degerler, ad: string) => (Array.isArray(v[ad]) ? (v[ad] as string[]) : []);
// Modelin verdiği değer seçeneklerde yoksa boş: form seçtirsin, yanlış kimlik sessizce gitmesin.
const icinde = (x: string, l: Secenek[]) => (l.some((o) => o.deger === x) ? x : "");

const YENI = "__yeni";

/* --- Seçenekler: kayıttan, kişinin dilinde --- */

const kisiAdi = (k: Kisi, dil: Dil) => kisiAdiDilde(k.ad, dil);
const muhabirMi = (k: Kisi) => !k.pasif && (disMuhabirMi(k) || icMuhabirMi(k));
const muhabirSecenekleri = (d: Durum, dil: Dil, bos?: Anahtar): Secenek[] => [
  ...(bos ? [{ deger: "", ad: metin(bos, dil) }] : []),
  ...d.kisiler
    .filter(muhabirMi)
    .map((k) => ({ deger: k.id, ad: `${kisiAdi(k, dil)} · ${sehirAdi(k.sehir, dil)}` }))
    .sort((a, b) => a.ad.localeCompare(b.ad, dil)),
];
const planAdi = (p: NextDayPlan, dil: Dil) => `${p.tarih} · ${metin(PLAN_DURUM_ADI[p.durum], dil)}`;
const duzenlenenPlanlar = (d: Durum, ben: Kisi) => acikGunPlanlari(d).filter((p) => planIcerikDuzenler(ben, p)).sort((a, b) => a.tarih.localeCompare(b.tarih));
const planSecenekleri = (d: Durum, ben: Kisi, dil: Dil): Secenek[] => duzenlenenPlanlar(d, ben).map((p) => ({ deger: p.id, ad: planAdi(p, dil) }));
const baslikAdi = (d: Durum, p: NextDayPlan, pbId: string) => baslikBul(d, p.basliklar.find((b) => b.id === pbId)?.baslikId)?.ad ?? "";
/* Planın başlıkları; `deger` plandaki başlığın kimliği. */
const pbSecenekleri = (d: Durum, p: NextDayPlan, ek: Secenek[] = []): Secenek[] => [...p.basliklar.map((b) => ({ deger: b.id, ad: baslikBul(d, b.baslikId)?.ad ?? "" })), ...ek];
const pbHaritasi = (d: Durum, planlar: NextDayPlan[], ek: Secenek[] = []) => Object.fromEntries(planlar.map((p) => [p.id, pbSecenekleri(d, p, ek)]));
const bicimSecenekleri = (dil: Dil): Secenek[] => BICIMLER.map((b) => ({ deger: b, ad: metin(BICIM_ADI(b), dil) }));
const turSecenekleri = (dil: Dil): Secenek[] => SECILEN_TURLER.filter((t) => t !== "ozel").map((t) => ({ deger: t, ad: metin(TUR_ADI[t], dil) }));
const sec = (dil: Dil, l: [string, Anahtar][]): Secenek[] => l.map(([deger, a]) => ({ deger, ad: metin(a, dil) }));
const haftaAdi = (h: HaftalikPlan) => `${h.baslangic} – ${haftaSonu(h.baslangic)}`;
const dosyaSecenekleri = (d: Durum, h: HaftalikPlan, dil: Dil): Secenek[] => [
  { deger: "", ad: metin("asODosyasiz", dil) },
  ...haftaninDosyalari(h).map((id) => ({ deger: id, ad: baslikBul(d, id)?.ad ?? id })),
  { deger: YENI, ad: metin("asOYeniBaslik", dil) },
];
const haftaGunleri = (h: HaftalikPlan, dil: Dil): Secenek[] => [
  { deger: "", ad: metin("asOStokProgram", dil) },
  ...Array.from({ length: 7 }, (_, i) => gunEkle(h.baslangic, i)).map((t) => ({ deger: t, ad: t })),
];
// Havuzdaki başlığın adıyla eşleşen kimlik (modelin "Gazze" dediği dosya).
const adlaBaslik = (d: Durum, ad: string) => {
  const a = ad.trim();
  return a ? d.basliklar.find((b) => b.ad.trim() === a)?.id : undefined;
};

/* Ortak alanlar */
const A = {
  plan: (secenekler: Secenek[]): FormAlani => ({ ad: "planId", etiket: "asAPlan", tur: "secim", zorunlu: true, secenekler }),
  pb: (harita: Record<string, Secenek[]>, zorunlu = false): FormAlani => ({ ad: "planBaslikId", etiket: "asABaslik", tur: "secim", zorunlu, bagli: { alan: "planId", harita } }),
  muhabir: (secenekler: Secenek[], zorunlu = true, ad = "muhabirId"): FormAlani => ({ ad, etiket: "asAMuhabir", tur: "secim", zorunlu, secenekler }),
  icerik: (ad: string, etiket: Anahtar, zorunlu = false, uzun = false): FormAlani => ({ ad, etiket, tur: uzun ? "uzun" : "metin", icerik: true, zorunlu }),
  yazi: (ad: string, etiket: Anahtar, zorunlu = false, uzun = true): FormAlani => ({ ad, etiket, tur: uzun ? "uzun" : "metin", zorunlu }),
  tarih: (ad: string, etiket: Anahtar, zorunlu = false): FormAlani => ({ ad, etiket, tur: "tarih", zorunlu }),
  saat: (ad: string, etiket: Anahtar = "asASaat"): FormAlani => ({ ad, etiket, tur: "saat" }),
  secim: (ad: string, etiket: Anahtar, secenekler: Secenek[], zorunlu = true): FormAlani => ({ ad, etiket, tur: "secim", zorunlu, secenekler }),
};

/* Kaydın bulunması ve okunur özeti */
const oneriVar = (g: Girdi, ben: Kisi) => {
  const d = getir();
  const o = d.oneriler.find((x) => x.id === s(g.oneriId, 100));
  return o && oneriGorebilir(ben, o) ? { d, o } : null;
};
const oneriOzeti = (d: Durum, id: string) => {
  const o = d.oneriler.find((x) => x.id === id);
  if (!o) return null;
  return { id: o.id, header: o.haberBasligi, strap: o.paketBasligi ?? "", gun: o.hedefTarih ?? "", bitis: o.bitisTarih ?? "", durum: o.durum, bicim: o.bicim ?? "", muhabir: kisiAr(kisiBul(d, o.muhabirId)), muhabirId: o.muhabirId ?? "" };
};
const kisa = (x: string, n = 240) => (x.length > n ? `${x.slice(0, n)}…` : x);
const planBulTarihle = (d: Durum, tarih: string) => d.planlar.filter((p) => p.tarih === tarih).sort((a, b) => b.id.localeCompare(a.id))[0];

/* --- Okuma --- */

const OKUMA: Record<string, Yurutucu> = {
  ara: (g, { ben, dil }) => {
    const sorgu = s(g.sorgu, 200);
    if (!sorgu) return hata("girdi");
    return { sonuc: { sonuclar: kayitAra(getir(), ben, sorgu, dil).slice(0, 15).map((x) => ({ tur: x.tur, id: x.id, ad: x.metin, ust: x.ust ?? "", yol: x.href ?? "" })) } };
  },

  sayfaAc: (g, { git }) => {
    const yol = s(g.yol, 200);
    // Yalnız uygulamanın içi: model dışarıya bağlantı açtırmasın.
    if (!/^#\/[\w\-/]*$/.test(yol)) return hata("yol");
    git(yol.slice(2));
    return { sonuc: { acildi: yol } };
  },

  onerileriListele: (g, { ben }) => {
    const d = getir();
    const sekme = (["karar", "baskasinda", "planda", "arsiv"].includes(s(g.sekme)) ? s(g.sekme) : "karar") as OneriSekmesi;
    const t = gun(g.gun);
    const m = s(g.muhabirId, 100);
    const liste = d.oneriler
      .filter((o) => oneriGorebilir(ben, o) && oneriSekmesi(d, o) === sekme && (!m || o.muhabirId === m) && (!t || o.hedefTarih === t || (!!o.bitisTarih && o.hedefTarih! <= t && t <= o.bitisTarih)))
      .slice(0, 40)
      .map((o) => oneriOzeti(d, o.id));
    return { sonuc: { sekme, sayi: liste.length, oneriler: liste } };
  },

  oneriAyrintisi: (g, { ben }) => {
    const v = oneriVar(g, ben);
    if (!v) return hata("bulunamadi");
    const { d, o } = v;
    const yer = oneriYeri(d, o);
    return {
      sonuc: {
        ...oneriOzeti(d, o.id),
        gelisme: o.gelisme,
        islemeFikri: o.islemeFikri ?? "",
        gorselIsleme: o.gorselIsleme ?? "",
        gerekce: o.gerekce ?? "",
        satirlar: (o.satirlar ?? []).slice(-10).map((x) => ({ zaman: x.zaman, metin: kisa(x.metin) })),
        plan: yer?.plan ? { id: yer.plan.id, tarih: yer.plan.tarih } : null,
        gundemde: !!yer?.hafta,
        yazisma: d.mesajlar.filter((x) => x.oneriId === o.id).slice(-8).map((x) => ({ kimden: kisiAr(kisiBul(d, x.kisiId)), metin: kisa(x.metin), zaman: x.zaman })),
      },
    };
  },

  planOzeti: (g, { ben, dil }) => {
    const d = getir();
    const tarih = gun(g.tarih) || gunEkle(bugun(), 1);
    const p = planBul(d, s(g.planId, 100)) ?? planBulTarihle(d, tarih);
    const acikPlanlar = acikGunPlanlari(d).map((x) => ({ planId: x.id, tarih: x.tarih, durum: x.durum }));
    if (!p) return { sonuc: { tarih, plan: null, acikPlanlar } };
    const muhabir = (id: string) => kisiAr(kisiBul(d, id));
    const gelismeler = (pbId?: string) =>
      d.gelismeler.filter((x) => x.planId === p.id && (x.planBaslikId ?? "") === (pbId ?? "")).map((x) => ({ gelismeId: x.id, yer: x.yer ?? "", metin: kisa(x.metin), saat: x.saat ?? "", oneriId: x.oneriId ?? "" }));
    const paketler = (pbId?: string) =>
      d.paketler
        .filter((x) => x.planId === p.id && (x.planBaslikId ?? "") === (pbId ?? "") && x.durum !== "iptal")
        .map((x) => ({ paketId: x.id, strap: x.baslik, durum: x.durum, muhabir: x.muhabirId ? muhabir(x.muhabirId) : "", stok: !!x.stok }));
    const canlilar = (pbId?: string) => d.canliYayinlar.filter((x) => x.planId === p.id && (x.planBaslikId ?? "") === (pbId ?? "")).map((x) => ({ canliId: x.id, konu: x.konu, saatGmt: x.saatGmt, yer: x.yer }));
    return {
      sonuc: {
        planId: p.id,
        tarih: p.tarih,
        durum: p.durum,
        duzenleyebilir: planIcerikDuzenler(ben, p),
        ekip: p.ekip.map((e) => ({ gorev: e.gorev, kisi: muhabir(e.kisiId) })),
        basliklar: p.basliklar.map((b) => ({
          planBaslikId: b.id,
          ad: baslikBul(d, b.baslikId)?.ad ?? "",
          muhabirler: b.muhabirler.map((m) => ({ muhabirId: m.kisiId, ad: muhabir(m.kisiId), yer: m.yer ?? "" })),
          gelismeler: gelismeler(b.id),
          paketler: paketler(b.id),
          canlilar: canlilar(b.id),
        })),
        basliksiz: { gelismeler: gelismeler(), paketler: paketler(), canlilar: canlilar() },
        hazirPaketler: (p.hazirPaketler ?? []).map((id) => ({ paketId: id, strap: paketBul(d, id)?.baslik ?? "" })),
        acikPlanlar,
        // Kişinin dilinde: model durumu okurken karıştırmasın.
        durumAdi: metin(PLAN_DURUM_ADI[p.durum], dil),
      },
    };
  },

  haftalikOzeti: (g, { dil }) => {
    const d = getir();
    const h = haftaBul(d, s(g.haftaId, 100)) ?? d.haftalik.find((x) => x.baslangic === (gun(g.tarih) ? haftaBasi(gun(g.tarih)) : planlananHafta(bugun())));
    if (!h) return { sonuc: { hafta: null, haftalar: d.haftalik.slice(-6).map((x) => ({ haftaId: x.id, baslangic: x.baslangic, durum: x.durum })) } };
    return {
      sonuc: {
        haftaId: h.id,
        baslangic: h.baslangic,
        bitis: haftaSonu(h.baslangic),
        durum: h.durum,
        anaDosyalar: h.anaKonular.map((a) => baslikBul(d, a.baslikId)?.ad ?? a.baslik ?? ""),
        kalemler: h.kalemler.map((k) => ({
          kalemId: k.id,
          gun: k.tarih ?? "",
          dosya: baslikBul(d, k.baslikId)?.ad ?? "",
          metin: kisa(k.metin),
          strap: k.paketBasligi ?? "",
          karar: k.karar,
          kararAdi: metin(KARAR_ADI[k.karar], dil),
          muhabirler: k.muhabirler.map((id) => kisiAr(kisiBul(d, id))),
          oneriId: k.oneriId ?? "",
        })),
      },
    };
  },

  paketleriListele: (g, { ben }) => {
    const d = getir();
    const sekme = ["karar", "gorevli", "arsiv"].includes(s(g.sekme)) ? s(g.sekme) : "gorevli";
    const m = s(g.muhabirId, 100);
    const liste = d.paketler
      .filter((p) => paketGorebilir(ben, p, d) && paketSekmesi(p) === sekme && (!m || p.muhabirId === m))
      .slice(0, 40)
      .map((p) => ({ paketId: p.id, kod: p.kod, strap: p.baslik, durum: p.durum, muhabir: kisiAr(kisiBul(d, p.muhabirId)), plan: planBul(d, p.planId)?.tarih ?? "", teslim: p.sonTarih ?? "" }));
    return { sonuc: { sekme, sayi: liste.length, paketler: liste } };
  },

  paketAyrintisi: (g, { ben, dil }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p || !paketGorebilir(ben, p, d)) return hata("bulunamadi");
    return {
      sonuc: {
        paketId: p.id,
        kod: p.kod,
        strap: p.baslik,
        aciklama: kisa(p.aciklama ?? "", 600),
        durum: p.durum,
        durumAdi: metin(PAKET_DURUM_ADI[p.durum], dil),
        muhabir: kisiAr(kisiBul(d, p.muhabirId)),
        muhabirId: p.muhabirId ?? "",
        plan: p.planId ? { planId: p.planId, tarih: planBul(d, p.planId)?.tarih ?? "" } : null,
        teslim: p.sonTarih ?? "",
        isaret: p.isaret ? { tur: p.isaret.tur, sebep: p.isaret.sebep ?? "" } : null,
        oneriId: p.oneriId ?? "",
        notlar: (p.notlar ?? []).slice(-5).map((n) => ({ kimden: kisiAr(kisiBul(d, n.kisiId)), metin: kisa(n.metin) })),
      },
    };
  },

  kisileriListele: (g, { dil }) => {
    const d = getir();
    const tur = s(g.tur) || "muhabir";
    const sorgu = s(g.sorgu, 80).toLocaleLowerCase(dil);
    const liste = d.kisiler
      .filter((k) => !k.pasif && (tur === "hepsi" || (tur === "muhabir" ? muhabirMi(k) : !disMuhabirMi(k))))
      .filter((k) => !sorgu || (["tr", "ar", "en"] as Dil[]).some((l) => yaz(k.ad, l).toLocaleLowerCase(dil).includes(sorgu)))
      .slice(0, 60)
      .map((k) => ({ kisiId: k.id, ad: kisiAdi(k, dil), adAr: kisiAr(k), birim: birimAdi(k.birim), unvan: gorevAdi(k.gorev), sehir: sehirAdi(k.sehir, dil), bugun: metin(KISI_DURUM_ADI[kisiBugunDurumu(d, k)], dil) }));
    return { sonuc: { sayi: liste.length, kisiler: liste } };
  },

  takvimListele: (g, { dil }) => {
    const d = getir();
    const bas = gun(g.baslangic) || bugun();
    const bit = gun(g.bitis) || gunEkle(bas, 14);
    const liste = d.faaliyetler
      .flatMap((f) => olusumlar(f, bas, bit).map((o) => ({ faaliyetId: f.id, ad: f.baslik, baslangic: o.bas, bitis: o.bit, tur: metin(faaliyetTuruAdi(f.tur), dil), oncelik: f.oncelik })))
      .sort((a, b) => a.baslangic.localeCompare(b.baslangic))
      .slice(0, 60);
    return { sonuc: { baslangic: bas, bitis: bit, faaliyetler: liste } };
  },

  isleriListele: (_g, { ben, dil }) => {
    const d = getir();
    const liste = isListesi(d)
      .filter((x) => x.durum !== "bitti" && (isKisinin(d, x, ben.id) || x.olusturan === ben.id))
      .slice(0, 40)
      .map((x) => ({ isId: x.id, ad: x.baslik, durum: metin(IS_DURUM_ADI[x.durum], dil), sonTarih: x.sonTarih ?? "", kisiler: x.kisiler.map((id) => kisiAdi(kisiBul(d, id) ?? ben, dil)), benim: isKisinin(d, x, ben.id) }));
    return { sonuc: { isler: liste } };
  },

  hareketleriListele: (g, { dil }) => {
    const d = getir();
    const k = s(g.kisiId, 100);
    const liste = d.gorevlendirmeler
      .filter((x) => x.bitis >= bugun() && (!k || x.kisiId === k))
      .sort((a, b) => a.baslangic.localeCompare(b.baslangic))
      .slice(0, 40)
      .map((x) => ({ hareketId: x.id, kisi: kisiAr(kisiBul(d, x.kisiId)), tur: metin(HAREKET_TURU_ADI[x.tur], dil), yer: x.yer, baslangic: x.baslangic, bitis: x.bitis }));
    return { sonuc: { hareketler: liste } };
  },
};

/* --- Yazma: form --- */

const form = (f: Form): Yurutum => ({ form: f });

const YAZMA: Record<string, Yurutucu> = {
  /* Öneriler */
  oneriGir: (g, { ben, dil }) => {
    const d = getir();
    if (!yapabilir(ben, "oneriGonder")) return hata("yetki");
    const muhabirler = muhabirSecenekleri(d, dil);
    return form({
      baslik: "asTOneriGir",
      alanlar: [
        A.muhabir(muhabirler),
        A.secim("kanal", "asAKanal", sec(dil, (["telefon", "mesaj", "yuzYuze", "eposta"] as Kanal[]).map((k) => [k, KANAL_ADI[k]]))),
        A.icerik("haberBasligi", "asAHeader", true),
        A.icerik("paketBasligi", "asAStrap"),
        A.icerik("gelisme", "asAGelisme", true, true),
        A.secim("bicim", "asABicim", bicimSecenekleri(dil)),
        A.secim("tur", "asAMasa", turSecenekleri(dil)),
        A.tarih("hedefTarih", "asAGun", true),
        A.tarih("bitisTarih", "asABitis"),
      ],
      degerler: {
        muhabirId: icinde(s(g.muhabirId, 100), muhabirler),
        kanal: ["telefon", "mesaj", "yuzYuze", "eposta"].includes(s(g.kanal)) ? s(g.kanal) : "telefon",
        haberBasligi: s(g.haberBasligi, 300),
        paketBasligi: s(g.paketBasligi, 300),
        gelisme: s(g.gelisme),
        bicim: (BICIMLER as readonly string[]).includes(s(g.bicim)) ? s(g.bicim) : "pkg",
        tur: (SECILEN_TURLER as readonly string[]).includes(s(g.tur)) ? s(g.tur) : "haber",
        hedefTarih: gun(g.hedefTarih) || gunEkle(bugun(), 1),
        bitisTarih: gun(g.bitisTarih),
      },
      calistir: (v) => {
        const m = kisiBul(getir(), vs(v, "muhabirId"));
        if (!m) return { hata: "bulunamadi" };
        const id = oneriGonder(ben, {
          muhabirId: m.id,
          ulke: sehirUlkesi(m.sehir),
          haberBasligi: vs(v, "haberBasligi"),
          paketBasligi: vs(v, "paketBasligi") || undefined,
          gelisme: vs(v, "gelisme"),
          bicim: vs(v, "bicim") as Bicim,
          tur: vs(v, "tur") as IcerikTuru,
          sahaGerekli: false,
          kanal: vs(v, "kanal") as Kanal,
          hedefTarih: vs(v, "hedefTarih"),
          ...(vs(v, "bitisTarih") > vs(v, "hedefTarih") ? { bitisTarih: vs(v, "bitisTarih") } : {}),
        });
        return tamam(id, { oneriId: id });
      },
    });
  },

  oneriPlanaEkle: (g, { ben, dil }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { d, o } = v0;
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    // Ekranın "Plana ekle"yi göstermediği hallerde form açılmasın: model nedenini kişiye söylesin.
    if (acikGundemde(d, o)) return hata("weeklyGundeminde");
    if (o.durum === "planaEklendi") return hata("zatenPlanda");
    if (["reddedildi", "geriCekildi", "teklif", "duzeltme"].includes(o.durum)) return hata("kararAsamasindaDegil");
    const planlar = duzenlenenPlanlar(d, ben);
    if (!planlar.length) return hata("acikPlanYok");
    const yeni = { deger: YENI, ad: metin("asOYeniBaslik", dil) };
    const planId = icinde(s(g.planId, 100), planSecenekleri(d, ben, dil)) || (planlar.find((p) => p.tarih === o.hedefTarih) ?? planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0]).id;
    const p = planlar.find((x) => x.id === planId)!;
    const verilen = p.basliklar.find((b) => b.id === s(g.planBaslikId, 100));
    const kendi = p.basliklar.find((b) => b.baslikId === o.baslikId);
    const pbId = verilen?.id ?? (s(g.yeniBaslik) ? YENI : (kendi?.id ?? YENI));
    return form({
      baslik: "asTOneriPlanaEkle",
      ozet: o.haberBasligi,
      alanlar: [A.plan(planSecenekleri(d, ben, dil)), A.pb(pbHaritasi(d, planlar, [yeni]), true), { ...A.icerik("yeniBaslik", "asAYeniBaslik", true), kosul: { alan: "planBaslikId", deger: YENI } }, { ad: "paket", etiket: "asAPkg", tur: "onay" }],
      degerler: { planId, planBaslikId: pbId, yeniBaslik: s(g.yeniBaslik, 300) || o.haberBasligi, paket: typeof g.paket === "boolean" ? g.paket : !!o.paketBasligi && o.bicim !== "canli" },
      calistir: (v) => {
        const d2 = getir();
        const plan = planBul(d2, vs(v, "planId"));
        if (!plan) return { hata: "bulunamadi" };
        const pb = plan.basliklar.find((b) => b.id === vs(v, "planBaslikId"));
        return tamam(oneriPlanaEkle(ben, o.id, { planId: plan.id, ...(pb ? { baslikId: pb.baslikId } : { yeniBaslik: vs(v, "yeniBaslik") }), paketOlustur: vb(v, "paket") }));
      },
    });
  },

  oneriGundemeEkle: (g, { ben, dil }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { d, o } = v0;
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    const haftalar = d.haftalik.filter((h) => oneriHaftada(o, h));
    if (!haftalar.length) return hata("haftaYok");
    const haftaId = haftalar.find((h) => h.id === s(g.haftaId, 100))?.id ?? haftalar[0].id;
    const h = haftalar.find((x) => x.id === haftaId)!;
    const dosya = adlaBaslik(d, s(g.dosya, 300)) ?? (o.baslikId && haftaninDosyalari(h).includes(o.baslikId) ? o.baslikId : "");
    const t = gun(g.tarih) || (o.hedefTarih && o.hedefTarih >= h.baslangic && o.hedefTarih <= haftaSonu(h.baslangic) ? o.hedefTarih : "");
    return form({
      baslik: "asTOneriGundemeEkle",
      ozet: o.haberBasligi,
      alanlar: [
        A.secim("haftaId", "asAHafta", haftalar.map((x) => ({ deger: x.id, ad: haftaAdi(x) }))),
        { ad: "tarih", etiket: "asAGun", tur: "secim", bagli: { alan: "haftaId", harita: Object.fromEntries(haftalar.map((x) => [x.id, haftaGunleri(x, dil)])) } },
        { ad: "baslikId", etiket: "asADosya", tur: "secim", bagli: { alan: "haftaId", harita: Object.fromEntries(haftalar.map((x) => [x.id, dosyaSecenekleri(d, x, dil)])) } },
        { ...A.icerik("yeniBaslik", "asAYeniBaslik", true), kosul: { alan: "baslikId", deger: YENI } },
      ],
      degerler: { haftaId, tarih: t, baslikId: dosya || (s(g.dosya) ? YENI : ""), yeniBaslik: s(g.dosya, 300) || o.haberBasligi },
      calistir: (v) => {
        const b = vs(v, "baslikId");
        return tamam(oneriGundemeEkle(ben, vs(v, "haftaId"), o.id, { tarih: vs(v, "tarih") || undefined, ...(b === YENI ? { yeniBaslik: vs(v, "yeniBaslik") } : b ? { baslikId: b } : {}) }));
      },
    });
  },

  oneriReddet: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    const { o } = v0;
    return form({ baslik: "asTOneriReddet", ozet: o.haberBasligi, alanlar: [A.yazi("gerekce", "asAGerekce", true)], degerler: { gerekce: s(g.gerekce, 1000) }, calistir: (v) => tamam(oneriDurum(ben, o.id, "reddedildi", vs(v, "gerekce"))) });
  },

  oneriDegerlendirmeyeAl: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    if (!yapabilir(ben, "oneriDegerlendir")) return hata("yetki");
    const { o } = v0;
    return form({ baslik: "asTOneriDegerlendirmeyeAl", ozet: o.haberBasligi, alanlar: [], degerler: {}, calistir: () => tamam(oneriDurum(ben, o.id, "degerlendiriliyor")) });
  },

  oneriDuzeltmeIste: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    return form({ baslik: "asTOneriDuzeltmeIste", ozet: o.haberBasligi, alanlar: [A.yazi("not", "asANot", true)], degerler: { not: s(g.not, 1000) }, calistir: (v) => tamam(oneriDuzeltmeIste(ben, o.id, vs(v, "not"))) });
  },

  oneriTakibeAl: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    return form({ baslik: "asTOneriTakibeAl", ozet: o.haberBasligi, alanlar: [], degerler: {}, calistir: () => tamam(oneriDurum(ben, o.id, "takip")) });
  },

  oneriPlandanCikar: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    return form({
      baslik: "asTOneriPlandanCikar",
      ozet: o.haberBasligi,
      alanlar: [],
      degerler: {},
      calistir: () => {
        const r = oneriPlandanCikar(ben, o.id);
        return r === "tamam" ? { tamam: true } : { hata: r };
      },
    });
  },

  oneriArsiveGonder: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    return form({ baslik: "asTOneriArsiveGonder", ozet: o.haberBasligi, alanlar: [], degerler: {}, calistir: () => tamam(oneriArsiveGonder(ben, o.id)) });
  },

  oneriMesajiGonder: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    return form({ baslik: "asTOneriMesajiGonder",
      dugme: "asGonder", ozet: o.haberBasligi, alanlar: [A.yazi("metin", "asAMetin", true)], degerler: { metin: s(g.metin, 2000) }, calistir: (v) => tamam(oneriMesajiGonder(ben, o.id, vs(v, "metin"))) });
  },

  muhabireOneriGonder: (g, { ben, dil }) => {
    const d = getir();
    const muhabirler = muhabirSecenekleri(d, dil).filter((x) => disMuhabirMi(kisiBul(d, x.deger)!));
    return form({
      baslik: "asTMuhabireOneriGonder",
      dugme: "asGonder",
      alanlar: [
        A.muhabir(muhabirler),
        A.icerik("haberBasligi", "asAHeader", true),
        A.icerik("paketBasligi", "asAStrap"),
        A.icerik("gelisme", "asAGelisme", true, true),
        A.secim("bicim", "asABicim", bicimSecenekleri(dil)),
        A.secim("tur", "asAMasa", turSecenekleri(dil)),
        A.tarih("hedefTarih", "asAGun"),
      ],
      degerler: {
        muhabirId: icinde(s(g.muhabirId, 100), muhabirler),
        haberBasligi: s(g.haberBasligi, 300),
        paketBasligi: s(g.paketBasligi, 300),
        gelisme: s(g.gelisme),
        bicim: (BICIMLER as readonly string[]).includes(s(g.bicim)) ? s(g.bicim) : "pkg",
        tur: (SECILEN_TURLER as readonly string[]).includes(s(g.tur)) ? s(g.tur) : "haber",
        hedefTarih: gun(g.hedefTarih),
      },
      calistir: (v) => {
        const m = kisiBul(getir(), vs(v, "muhabirId"));
        if (!m) return { hata: "bulunamadi" };
        return tamam(
          muhabireOneriGonder(ben, {
            muhabirId: m.id,
            haberBasligi: vs(v, "haberBasligi"),
            gelisme: vs(v, "gelisme"),
            paketBasligi: vs(v, "paketBasligi") || undefined,
            ulke: sehirUlkesi(m.sehir),
            tur: vs(v, "tur") as IcerikTuru,
            bicim: vs(v, "bicim") as Bicim,
            sahaGerekli: false,
            hedefTarih: vs(v, "hedefTarih") || undefined,
          }),
        );
      },
    });
  },

  oneriMasayaSor: (g, { ben }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    const birimler = (["ekonomi", "program", "spor"] as BirimId[]).map((b) => ({ deger: b, ad: birimAdi(b) }));
    return form({
      baslik: "asTOneriMasayaSor",
      ozet: o.haberBasligi,
      alanlar: [A.secim("birim", "asABirim", birimler), A.yazi("not", "asANot")],
      degerler: { birim: icinde(s(g.birim), birimler) || (o.tur && ["ekonomi", "program", "spor"].includes(o.tur) ? o.tur : ""), not: s(g.not, 1000) },
      calistir: (v) => tamam(oneriMasayaSor(ben, o.id, vs(v, "birim") as BirimId, vs(v, "not"))),
    });
  },

  oneriGorevlendir: (g, { ben, dil }) => {
    const v0 = oneriVar(g, ben);
    if (!v0) return hata("bulunamadi");
    const { o } = v0;
    const masalar: Secenek[] = [{ deger: "", ad: metin("asOHaberMerkezi", dil) }, ...(["program", "ekonomi", "spor"] as BirimId[]).map((b) => ({ deger: b, ad: birimAdi(b) }))];
    return form({
      baslik: "asTOneriGorevlendir",
      ozet: o.haberBasligi,
      alanlar: [A.tarih("tarih", "asAGun", true), A.secim("masa", "asAMasa", masalar, false)],
      degerler: { tarih: gun(g.tarih) || o.hedefTarih || bugun(), masa: icinde(s(g.masa), masalar) },
      calistir: (v) => {
        const id = oneriGorevlendir(ben, o.id, vs(v, "tarih"), vs(v, "masa") as BirimId | "");
        return tamam(id, { paketId: id });
      },
    });
  },

  /* Next Day */
  planBaslikEkle: (g, { ben, dil }) => {
    const d = getir();
    const planlar = planSecenekleri(d, ben, dil);
    if (!planlar.length) return hata("acikPlanYok");
    return form({
      baslik: "asTPlanBaslikEkle",
      alanlar: [A.plan(planlar), A.icerik("ad", "asAAd", true)],
      degerler: { planId: icinde(s(g.planId, 100), planlar) || planlar.find((p) => p.ad.startsWith(gunEkle(bugun(), 1)))?.deger || planlar[0].deger, ad: s(g.ad, 300) },
      calistir: (v) => {
        const id = baslikEkle(ben, vs(v, "ad"));
        return id ? tamam(planBaslikEkle(ben, vs(v, "planId"), id)) : { hata: "yapilamadi" };
      },
    });
  },

  planBaslikCikar: (g, { ben }) => {
    const d = getir();
    const p = planBul(d, s(g.planId, 100));
    const pbId = s(g.planBaslikId, 100);
    if (!p || !p.basliklar.some((b) => b.id === pbId)) return hata("bulunamadi");
    if (!planIcerikDuzenler(ben, p)) return hata("yetki");
    return form({ baslik: "asTPlanBaslikCikar", ozet: baslikAdi(d, p, pbId), alanlar: [], degerler: {}, calistir: () => tamam(planBaslikCikar(ben, p.id, pbId)) });
  },

  gelismeEkle: (g, { ben, dil }) => {
    const d = getir();
    const planlar = duzenlenenPlanlar(d, ben);
    if (!planlar.length) return hata("acikPlanYok");
    const secenekler = planSecenekleri(d, ben, dil);
    const planId = icinde(s(g.planId, 100), secenekler) || (planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0]).id;
    const harita = pbHaritasi(d, planlar, [{ deger: "", ad: metin("asOBasliksiz", dil) }]);
    return form({
      baslik: "asTGelismeEkle",
      alanlar: [A.plan(secenekler), A.pb(harita), A.icerik("yer", "asAYer"), A.icerik("metin", "asAMetin", true, true), A.saat("saat")],
      degerler: { planId, planBaslikId: icinde(s(g.planBaslikId, 100), harita[planId]), yer: s(g.yer, 120), metin: s(g.metin), saat: saat(g.saat) },
      calistir: (v) => {
        const pb = vs(v, "planBaslikId");
        return tamam(
          gelismeKaydet(ben, {
            planId: vs(v, "planId"),
            ...(pb ? { planBaslikId: pb } : {}),
            metin: vs(v, "metin"),
            ...(vs(v, "yer") ? { yer: vs(v, "yer") } : {}),
            ...(saat(vs(v, "saat")) ? { saat: saat(vs(v, "saat")) } : {}),
            kaynakTuru: "ajans",
            kaynakAdi: "",
            tarih: "",
          }),
        );
      },
    });
  },

  gelismeDuzenle: (g, { ben }) => {
    const d = getir();
    const x = d.gelismeler.find((y) => y.id === s(g.gelismeId, 100));
    const p = planBul(d, x?.planId);
    if (!x || !p) return hata("bulunamadi");
    if (!planIcerikDuzenler(ben, p)) return hata("yetki");
    return form({
      baslik: "asTGelismeDuzenle",
      ozet: x.planBaslikId ? baslikAdi(d, p, x.planBaslikId) : undefined,
      alanlar: [A.icerik("yer", "asAYer"), A.icerik("metin", "asAMetin", true, true), A.saat("saat")],
      degerler: { yer: typeof g.yer === "string" ? s(g.yer, 120) : (x.yer ?? ""), metin: s(g.metin) || x.metin, saat: saat(g.saat) || x.saat || "" },
      calistir: (v) => {
        const { id, ...eski } = x;
        return tamam(gelismeKaydet(ben, { ...eski, id, metin: vs(v, "metin"), yer: vs(v, "yer") || undefined, saat: saat(vs(v, "saat")) || undefined }));
      },
    });
  },

  gelismeSil: (g, { ben }) => {
    const d = getir();
    const x = d.gelismeler.find((y) => y.id === s(g.gelismeId, 100));
    const p = planBul(d, x?.planId);
    if (!x || !p) return hata("bulunamadi");
    if (!planIcerikDuzenler(ben, p)) return hata("yetki");
    return form({ baslik: "asTGelismeSil", ozet: x.metin, alanlar: [], degerler: {}, calistir: () => tamam(gelismeSil(ben, x.id)) });
  },

  basligaMuhabirEkle: (g, { ben, dil }) => {
    const d = getir();
    const planlar = duzenlenenPlanlar(d, ben);
    if (!planlar.length) return hata("acikPlanYok");
    const secenekler = planSecenekleri(d, ben, dil);
    const planId = icinde(s(g.planId, 100), secenekler) || (planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0]).id;
    const harita = pbHaritasi(d, planlar);
    const muhabirler = muhabirSecenekleri(d, dil);
    return form({
      baslik: "asTBasligaMuhabirEkle",
      alanlar: [A.plan(secenekler), A.pb(harita, true), A.muhabir(muhabirler), A.icerik("yer", "asAYer"), A.yazi("not", "asANot")],
      degerler: { planId, planBaslikId: icinde(s(g.planBaslikId, 100), harita[planId]), muhabirId: icinde(s(g.muhabirId, 100), muhabirler), yer: s(g.yer, 120), not: s(g.not, 1000) },
      calistir: (v) => {
        const [p, pb, m] = [vs(v, "planId"), vs(v, "planBaslikId"), vs(v, "muhabirId")];
        if (!planMuhabir(ben, p, pb, m, true)) return { hata: "yapilamadi" };
        if (vs(v, "yer") || vs(v, "not")) planMuhabirGuncelle(ben, p, pb, m, { ...(vs(v, "yer") ? { yer: vs(v, "yer") } : {}), ...(vs(v, "not") ? { not: vs(v, "not") } : {}) });
        return { tamam: true };
      },
    });
  },

  basliktanMuhabirCikar: (g, { ben, dil }) => {
    const d = getir();
    const p = planBul(d, s(g.planId, 100));
    const pb = p?.basliklar.find((b) => b.id === s(g.planBaslikId, 100));
    const m = kisiBul(d, s(g.muhabirId, 100));
    if (!p || !pb || !m || !pb.muhabirler.some((x) => x.kisiId === m.id)) return hata("bulunamadi");
    if (!planIcerikDuzenler(ben, p)) return hata("yetki");
    return form({ baslik: "asTBasliktanMuhabirCikar", ozet: `${baslikAdi(d, p, pb.id)} · ${kisiAdi(m, dil)}`, alanlar: [], degerler: {}, calistir: () => tamam(planMuhabir(ben, p.id, pb.id, m.id, false)) });
  },

  paketEkle: (g, { ben, dil }) => {
    const d = getir();
    const planlar = duzenlenenPlanlar(d, ben);
    if (!planlar.length) return hata("acikPlanYok");
    const secenekler = planSecenekleri(d, ben, dil);
    const planId = icinde(s(g.planId, 100), secenekler) || (planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0]).id;
    const harita = pbHaritasi(d, planlar);
    const muhabirler = muhabirSecenekleri(d, dil, "asOTbc");
    return form({
      baslik: "asTPaketEkle",
      alanlar: [A.plan(secenekler), A.pb(harita, true), A.icerik("baslik", "asAStrap", true), A.muhabir(muhabirler, false), A.secim("bicim", "asABicim", bicimSecenekleri(dil)), A.icerik("aciklama", "asAAciklama", false, true), A.yazi("not", "asANot")],
      degerler: { planId, planBaslikId: icinde(s(g.planBaslikId, 100), harita[planId]), baslik: s(g.baslik, 300), muhabirId: icinde(s(g.muhabirId, 100), muhabirler), bicim: (BICIMLER as readonly string[]).includes(s(g.bicim)) ? s(g.bicim) : "pkg", aciklama: s(g.aciklama), not: s(g.not, 1000) },
      calistir: (v) => {
        const m = kisiBul(getir(), vs(v, "muhabirId"));
        const id = paketKaydet(ben, {
          planId: vs(v, "planId"),
          planBaslikId: vs(v, "planBaslikId"),
          baslik: vs(v, "baslik"),
          sehir: m?.sehir ?? ben.sehir ?? "istanbul",
          ...(m ? { muhabirId: m.id } : { muhabirTbc: true }),
          aciklama: vs(v, "aciklama"),
          tur: "haber",
          bicim: vs(v, "bicim") as Bicim,
          sahaGerekli: false,
          ...(vs(v, "not") ? { not: vs(v, "not") } : {}),
        });
        return tamam(id, { paketId: id });
      },
    });
  },

  paketKarari: (g, { ben, dil }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p || !paketGorebilir(ben, p, d)) return hata("bulunamadi");
    const kararlar = sec(dil, [
      ["kabul", "asOKabul"],
      ["reddet", "asOReddet"],
      ["plandanKaldir", "asOPlandanKaldir"],
      ["sil", "asOSil"],
    ]);
    return form({
      baslik: "asTPaketKarari",
      ozet: `${p.baslik} · ${metin(PAKET_DURUM_ADI[p.durum], dil)}`,
      alanlar: [A.secim("karar", "asAKarar", kararlar)],
      degerler: { karar: icinde(s(g.karar), kararlar) },
      calistir: (v) => {
        const k = vs(v, "karar");
        return tamam(k === "kabul" ? paketDurum(ben, p.id, "onaylandi") : k === "reddet" ? paketReddet(ben, p.id) : k === "plandanKaldir" ? paketDurum(ben, p.id, "iptal") : k === "sil" ? paketSil(ben, p.id) : false);
      },
    });
  },

  canliEkle: (g, { ben, dil }) => {
    const d = getir();
    const planlar = duzenlenenPlanlar(d, ben);
    if (!planlar.length) return hata("acikPlanYok");
    const secenekler = planSecenekleri(d, ben, dil);
    const planId = icinde(s(g.planId, 100), secenekler) || (planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0]).id;
    const harita = pbHaritasi(d, planlar, [{ deger: "", ad: metin("asOMubasir", dil) }]);
    const muhabirler = muhabirSecenekleri(d, dil, "asOSecilmedi");
    return form({
      baslik: "asTCanliEkle",
      alanlar: [A.plan(secenekler), A.pb(harita), A.icerik("konu", "asAKonu", true), A.icerik("yer", "asAYer"), A.saat("saatGmt", "asASaatGmt"), A.muhabir(muhabirler, false)],
      degerler: { planId, planBaslikId: icinde(s(g.planBaslikId, 100), harita[planId]), konu: s(g.konu, 300), yer: s(g.yer, 120), saatGmt: saat(g.saatGmt), muhabirId: icinde(s(g.muhabirId, 100), muhabirler) },
      calistir: (v) => {
        const p = planBul(getir(), vs(v, "planId"));
        if (!p) return { hata: "bulunamadi" };
        return tamam(
          canliKaydet(ben, {
            planId: p.id,
            ...(vs(v, "planBaslikId") ? { planBaslikId: vs(v, "planBaslikId") } : {}),
            konu: vs(v, "konu"),
            aciklama: "",
            tarih: p.tarih,
            saatGmt: saat(vs(v, "saatGmt")),
            yer: vs(v, "yer"),
            ...(vs(v, "muhabirId") ? { muhabirId: vs(v, "muhabirId") } : {}),
            notlar: "",
          }),
        );
      },
    });
  },

  canliSil: (g, { ben }) => {
    const d = getir();
    const c = d.canliYayinlar.find((x) => x.id === s(g.canliId, 100));
    if (!c) return hata("bulunamadi");
    return form({ baslik: "asTCanliSil", ozet: c.konu, alanlar: [], degerler: {}, calistir: () => tamam(canliSil(ben, c.id)) });
  },

  planAkisi: (g, { ben, dil }) => {
    const d = getir();
    const planlar = acikGunPlanlari(d);
    if (!planlar.length) return hata("acikPlanYok");
    const secenekler = planlar.map((p) => ({ deger: p.id, ad: planAdi(p, dil) }));
    const adimlar = sec(dil, [
      ["toplantiya", "asOToplantiya"],
      ["taslaga", "asOTaslaga"],
      ["onayla", "asOOnayla"],
    ]);
    return form({
      baslik: "asTPlanAkisi",
      alanlar: [A.plan(secenekler), A.secim("adim", "asAAdim", adimlar)],
      degerler: { planId: icinde(s(g.planId, 100), secenekler) || secenekler[0].deger, adim: icinde(s(g.adim), adimlar) },
      calistir: (v) => tamam(planDurum(ben, vs(v, "planId"), vs(v, "adim") === "toplantiya" ? "toplantida" : vs(v, "adim") === "taslaga" ? "taslak" : "onayli")),
    });
  },

  hareketKaydet: (g, { ben, dil }) => {
    const d = getir();
    const muhabirler = muhabirSecenekleri(d, dil);
    const turler = sec(dil, SECILEN_HAREKET_TURLERI.map((t) => [t, HAREKET_TURU_ADI[t]]));
    return form({
      baslik: "asTHareketKaydet",
      alanlar: [A.muhabir(muhabirler, true, "kisiId"), A.secim("tur", "asATur", turler), A.icerik("yer", "asAYer", true), A.tarih("baslangic", "asABaslangic", true), A.tarih("bitis", "asABitis"), A.yazi("aciklama", "asAAciklama")],
      degerler: { kisiId: icinde(s(g.kisiId, 100), muhabirler), tur: icinde(s(g.tur), turler) || "gorevlendirme", yer: s(g.yer, 120), baslangic: gun(g.baslangic) || bugun(), bitis: gun(g.bitis), aciklama: s(g.aciklama, 1000) },
      calistir: (v) => {
        const id = hareketKaydet(ben, { kisiId: vs(v, "kisiId"), tur: vs(v, "tur") as (typeof SECILEN_HAREKET_TURLERI)[number], yer: vs(v, "yer"), aciklama: vs(v, "aciklama"), baslangic: vs(v, "baslangic"), bitis: vs(v, "bitis") || vs(v, "baslangic") });
        return tamam(id, { hareketId: id });
      },
    });
  },

  hareketSil: (g, { ben, dil }) => {
    const d = getir();
    const x = d.gorevlendirmeler.find((y) => y.id === s(g.hareketId, 100));
    if (!x) return hata("bulunamadi");
    const k = kisiBul(d, x.kisiId);
    return form({ baslik: "asTHareketSil", ozet: `${k ? kisiAdi(k, dil) : ""} · ${x.yer} · ${x.baslangic}`, alanlar: [], degerler: {}, calistir: () => tamam(hareketSil(ben, x.id)) });
  },

  toplantiNotuEkle: (g, { ben, dil }) => {
    const d = getir();
    const secenekler: Secenek[] = [
      ...acikGunPlanlari(d).map((p) => ({ deger: p.id, ad: `Next Day · ${planAdi(p, dil)}` })),
      ...d.haftalik.filter((h) => h.durum !== "kesinlesti" || h.baslangic >= haftaBasi(bugun())).map((h) => ({ deger: h.id, ad: `Weekly · ${haftaAdi(h)}` })),
    ];
    if (!secenekler.length) return hata("acikPlanYok");
    return form({
      baslik: "asTToplantiNotuEkle",
      alanlar: [A.secim("planId", "asAPlan", secenekler), A.yazi("metin", "asANot", true)],
      degerler: { planId: icinde(s(g.planId, 100), secenekler) || secenekler[0].deger, metin: s(g.metin, 2000) },
      calistir: (v) => tamam(toplantiNotuEkle(ben, vs(v, "planId"), vs(v, "metin"))),
    });
  },

  /* Weekly */
  haftalikPlanAc: (g, { ben, git }) =>
    form({
      baslik: "asTHaftalikPlanAc",
      alanlar: [A.tarih("tarih", "asAGun", true)],
      degerler: { tarih: gun(g.tarih) || planlananHafta(bugun()) },
      calistir: (v) => {
        const r = haftalikOlustur(ben, vs(v, "tarih"));
        if (!r) return { hata: "yetki" };
        git(`haftalik/${r.id}`);
        return { tamam: true, haftaId: r.id, vardi: r.vardi };
      },
    }),

  kalemEkle: (g, { ben, dil }) => {
    const d = getir();
    const haftalar = d.haftalik.filter((h) => h.baslangic >= haftaBasi(bugun()));
    if (!haftalar.length) return hata("haftaYok");
    const haftaId = haftalar.find((h) => h.id === s(g.haftaId, 100))?.id ?? (haftalar.find((h) => h.baslangic === planlananHafta(bugun())) ?? haftalar[0]).id;
    const h = haftalar.find((x) => x.id === haftaId)!;
    const muhabirler = muhabirSecenekleri(d, dil, "asOSecilmedi");
    const dosya = adlaBaslik(d, s(g.dosya, 300));
    const t = gun(g.tarih);
    return form({
      baslik: "asTKalemEkle",
      alanlar: [
        A.secim("haftaId", "asAHafta", haftalar.map((x) => ({ deger: x.id, ad: haftaAdi(x) }))),
        { ad: "tarih", etiket: "asAGun", tur: "secim", bagli: { alan: "haftaId", harita: Object.fromEntries(haftalar.map((x) => [x.id, haftaGunleri(x, dil)])) } },
        { ad: "baslikId", etiket: "asADosya", tur: "secim", bagli: { alan: "haftaId", harita: Object.fromEntries(haftalar.map((x) => [x.id, dosyaSecenekleri(d, x, dil)])) } },
        { ...A.icerik("yeniBaslik", "asAYeniBaslik", true), kosul: { alan: "baslikId", deger: YENI } },
        A.icerik("yer", "asAYer"),
        A.icerik("metin", "asAMetin", true, true),
        A.icerik("paketBasligi", "asAStrap"),
        A.muhabir(muhabirler, false),
        A.secim("bicim", "asABicim", bicimSecenekleri(dil)),
        A.secim("tur", "asAMasa", turSecenekleri(dil)),
      ],
      degerler: {
        haftaId,
        tarih: t >= h.baslangic && t <= haftaSonu(h.baslangic) ? t : "",
        baslikId: dosya ?? (s(g.dosya) ? YENI : ""),
        yeniBaslik: s(g.dosya, 300),
        yer: s(g.yer, 120),
        metin: s(g.metin),
        paketBasligi: s(g.paketBasligi, 300),
        muhabirId: icinde(s(g.muhabirId, 100), muhabirler),
        bicim: (BICIMLER as readonly string[]).includes(s(g.bicim)) ? s(g.bicim) : "pkg",
        tur: (SECILEN_TURLER as readonly string[]).includes(s(g.tur)) ? s(g.tur) : "haber",
      },
      calistir: (v) => {
        const b = vs(v, "baslikId");
        const id = kalemKaydet(ben, vs(v, "haftaId"), {
          tarih: vs(v, "tarih") || undefined,
          ...(b === YENI ? { yeniBaslik: vs(v, "yeniBaslik") } : b ? { baslikId: b } : {}),
          yer: vs(v, "yer") || undefined,
          metin: vs(v, "metin"),
          tur: vs(v, "tur") as IcerikTuru,
          bicimler: [vs(v, "bicim") as Bicim],
          paketBasligi: vs(v, "paketBasligi") || undefined,
          muhabirler: vs(v, "muhabirId") ? [vs(v, "muhabirId")] : [],
        });
        return tamam(id, { kalemId: id });
      },
    });
  },

  kalemKarar: (g, { ben, dil }) => {
    const d = getir();
    const h = haftaBul(d, s(g.haftaId, 100));
    const k = h?.kalemler.find((x) => x.id === s(g.kalemId, 100));
    if (!h || !k) return hata("bulunamadi");
    const kararlar = sec(dil, KARARLAR.map((x) => [x, KARAR_ADI[x]]));
    return form({
      baslik: "asTKalemKarar",
      ozet: k.paketBasligi || k.metin,
      alanlar: [A.secim("karar", "asAKarar", kararlar), { ...A.yazi("kosul", "asAKosul", true, false), kosul: { alan: "karar", deger: "sartli" } }],
      degerler: { karar: icinde(s(g.karar), kararlar), kosul: s(g.kosul, 500) },
      calistir: (v) => tamam(kalemKarar(ben, h.id, k.id, vs(v, "karar") as Karar, vs(v, "karar") === "sartli" ? vs(v, "kosul") : undefined)),
    });
  },

  haftalikAkisi: (g, { dil, ben }) => {
    const d = getir();
    const h = haftaBul(d, s(g.haftaId, 100));
    if (!h) return hata("bulunamadi");
    const adimlar = sec(dil, [
      ["toplantiya", "asOToplantiya"],
      ["hazirliga", "asOHazirliga"],
      ["kesinlestir", "asOKesinlestir"],
    ]);
    return form({
      baslik: "asTHaftalikAkisi",
      ozet: haftaAdi(h),
      alanlar: [A.secim("adim", "asAAdim", adimlar)],
      degerler: { adim: icinde(s(g.adim), adimlar) },
      calistir: (v) => tamam(vs(v, "adim") === "kesinlestir" ? haftalikKesinlestir(ben, h.id) : haftalikDurum(ben, h.id, vs(v, "adim") === "toplantiya" ? "toplantida" : "hazirlik")),
    });
  },

  /* Paketler */
  paketGorevVer: (g, { ben, dil }) => {
    const d = getir();
    const muhabirler = muhabirSecenekleri(d, dil);
    return form({
      baslik: "asTPaketGorevVer",
      alanlar: [A.muhabir(muhabirler), A.icerik("baslik", "asAStrap", true), A.icerik("aciklama", "asAAciklama", false, true), A.secim("bicim", "asABicim", bicimSecenekleri(dil)), A.tarih("tarih", "asAGun", true), A.yazi("not", "asANot")],
      degerler: { muhabirId: icinde(s(g.muhabirId, 100), muhabirler), baslik: s(g.baslik, 300), aciklama: s(g.aciklama), bicim: (BICIMLER as readonly string[]).includes(s(g.bicim)) ? s(g.bicim) : "pkg", tarih: gun(g.tarih) || bugun(), not: s(g.not, 1000) },
      calistir: (v) => {
        const id = paketGorevVer(ben, { muhabirId: vs(v, "muhabirId"), baslik: vs(v, "baslik"), aciklama: vs(v, "aciklama"), bicim: vs(v, "bicim") as Bicim, tarih: vs(v, "tarih"), ...(vs(v, "not") ? { not: vs(v, "not") } : {}) });
        return tamam(id, { paketId: id });
      },
    });
  },

  paketTeslimGunu: (g, { ben }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p) return hata("bulunamadi");
    return form({ baslik: "asTPaketTeslimGunu", ozet: p.baslik, alanlar: [A.tarih("tarih", "asAGun", true)], degerler: { tarih: gun(g.tarih) || p.sonTarih || "" }, calistir: (v) => tamam(paketTeslimGunu(ben, p.id, vs(v, "tarih"))) });
  },

  paketSonucuKarari: (g, { ben, dil }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p?.isaret) return hata("bulunamadi");
    const secenekler = sec(dil, [
      ["onay", "asOOnayVer"],
      ["geri", "asOGeriCevir"],
    ]);
    return form({
      baslik: "asTPaketSonucuKarari",
      ozet: `${p.baslik} · ${metin(p.isaret.tur === "yapildi" ? "asOYapildi" : "asOYapilmadi", dil)}${p.isaret.sebep ? ` · ${p.isaret.sebep}` : ""}`,
      alanlar: [A.secim("karar", "asAKarar", secenekler)],
      degerler: { karar: g.onay === false ? "geri" : g.onay === true ? "onay" : "" },
      calistir: (v) => tamam(paketIsaretKarar(ben, p.id, vs(v, "karar") === "onay")),
    });
  },

  paketNotu: (g, { ben }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p || !paketGorebilir(ben, p, d)) return hata("bulunamadi");
    return form({ baslik: "asTPaketNotu", ozet: p.baslik, alanlar: [A.yazi("metin", "asANot", true)], degerler: { metin: s(g.metin, 2000) }, calistir: (v) => tamam(notEkle(ben, p.id, vs(v, "metin"))) });
  },

  paketMetniDuzenle: (g, { ben }) => {
    const d = getir();
    const p = paketBul(d, s(g.paketId, 100));
    if (!p) return hata("bulunamadi");
    return form({
      baslik: "asTPaketMetniDuzenle",
      alanlar: [A.icerik("baslik", "asAStrap", true), A.icerik("aciklama", "asAAciklama", false, true)],
      degerler: { baslik: s(g.baslik, 300) || p.baslik, aciklama: typeof g.aciklama === "string" ? s(g.aciklama) : (p.aciklama ?? "") },
      calistir: (v) => tamam(paketMetniDuzenle(ben, p.id, { baslik: vs(v, "baslik"), aciklama: vs(v, "aciklama") })),
    });
  },

  /* Diğer */
  isVer: (g, { ben, dil }) => {
    const d = getir();
    const kisiler = d.kisiler
      .filter((k) => !k.pasif && !kisitliKisi(k) && isAlabilir(ben, k))
      .map((k) => ({ deger: k.id, ad: kisiAdi(k, dil) }))
      .sort((a, b) => a.ad.localeCompare(b.ad, dil));
    const verilen = Array.isArray(g.kisiler) ? (g.kisiler as unknown[]).map((x) => s(x, 100)).filter((x) => kisiler.some((k) => k.deger === x)) : [];
    return form({
      baslik: "asTIsVer",
      alanlar: [A.yazi("baslik", "asAAd", true, false), { ad: "kisiler", etiket: "asAKisiler", tur: "coklu", zorunlu: true, secenekler: kisiler }, A.yazi("aciklama", "asAAciklama"), A.tarih("sonTarih", "asASonTarih")],
      degerler: { baslik: s(g.baslik, 300), kisiler: verilen, aciklama: s(g.aciklama, 1000), sonTarih: gun(g.sonTarih) },
      calistir: (v) => {
        const id = kimlik("is");
        return tamam(isKaydet(ben, { id, baslik: vs(v, "baslik"), etiketler: [], kisiler: va(v, "kisiler"), ...(vs(v, "aciklama") ? { aciklama: vs(v, "aciklama") } : {}), ...(vs(v, "sonTarih") ? { sonTarih: vs(v, "sonTarih") } : {}) }), { isId: id });
      },
    });
  },

  isDurumu: (g, { ben, dil }) => {
    const d = getir();
    const x = isListesi(d).find((y) => y.id === s(g.isId, 100));
    if (!x) return hata("bulunamadi");
    const durumlar = sec(dil, (["yapilacak", "suruyor", "bitti"] as IsDurumu[]).map((t) => [t, IS_DURUM_ADI[t]]));
    return form({ baslik: "asTIsDurumu", ozet: x.baslik, alanlar: [A.secim("durum", "asADurum", durumlar)], degerler: { durum: icinde(s(g.durum), durumlar) || "bitti" }, calistir: (v) => tamam(isDurumu(ben, x.id, vs(v, "durum") as IsDurumu)) });
  },

  faaliyetEkle: (g, { ben, dil }) => {
    if (!yapabilir(ben, "takvimDuzenle")) return hata("yetki");
    const turler = sec(dil, (["secim", "zirve", "konferans", "toplanti", "ziyaret", "parlamento", "dava", "spor", "kultur", "ekonomi", "ozelGun", "yildonumu", "diger"] as FaaliyetTuru[]).map((t) => [t, faaliyetTuruAdi(t)]));
    const oncelikler = sec(dil, (["dusuk", "normal", "yuksek", "kritik"] as Oncelik[]).map((o) => [o, oncelikAdi(o)]));
    return form({
      baslik: "asTFaaliyetEkle",
      alanlar: [A.icerik("baslik", "asAAd", true), A.tarih("baslangic", "asABaslangic", true), A.tarih("bitis", "asABitis"), A.saat("saat"), A.secim("tur", "asATur", turler), A.secim("oncelik", "asAOncelik", oncelikler), A.icerik("sehir", "asASehir"), A.yazi("notlar", "asANot")],
      degerler: { baslik: s(g.baslik, 300), baslangic: gun(g.baslangic), bitis: gun(g.bitis), saat: saat(g.saat), tur: icinde(s(g.tur), turler) || "toplanti", oncelik: icinde(s(g.oncelik), oncelikler) || "normal", sehir: s(g.sehir, 120), notlar: s(g.notlar, 1000) },
      calistir: (v) => {
        const id = faaliyetKaydet(ben, {
          baslik: vs(v, "baslik"),
          baslangic: vs(v, "baslangic"),
          bitis: vs(v, "bitis") || vs(v, "baslangic"),
          saat: saat(vs(v, "saat")) || undefined,
          tur: vs(v, "tur") as FaaliyetTuru,
          oncelik: vs(v, "oncelik") as Oncelik,
          potansiyel: "oneri",
          sehir: vs(v, "sehir"),
          notlar: vs(v, "notlar"),
          durum: "takipte",
        });
        return tamam(id, { faaliyetId: id });
      },
    });
  },

  postaGonder: (g, { ben }) => {
    const d = getir();
    const k = kisiBul(d, s(g.kisiId, 100));
    const kime = [muhabirAdresi(k), ...s(g.kime, 500).split(/[,;\s]+/)].filter((a, i, l) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) && l.indexOf(a) === i);
    return form({
      baslik: "asTPostaGonder",
      dugme: "asGonder",
      alanlar: [A.yazi("kime", "asAKime", true, false), A.yazi("konu", "asAKonu", true, false), A.yazi("metin", "asAMetin", true)],
      degerler: { kime: kime.join(", "), konu: s(g.konu, 300), metin: s(g.metin, 8000) },
      calistir: async (v) => {
        const alicilar = vs(v, "kime").split(/[,;\s]+/).filter((a) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a));
        if (!alicilar.length) return { hata: "adres" };
        let gidenler = { kime: alicilar, cc: [] as string[] };
        let grup = "";
        if (GERCEK) {
          const r = await kapiPostaGonder({ kime: alicilar, konu: vs(v, "konu"), metin: vs(v, "metin") });
          if (!r.tamam) return { hata: r.hata };
          gidenler = { kime: r.veri.kime, cc: r.veri.cc };
          const kimlik_ = await postaKimlikGetir();
          grup = kimlik_.tamam ? (kimlik_.veri.grupAdresi || "").trim().toLowerCase() : "";
        }
        // Giden balon Posta'daki sohbete düşer (ekrandan gönderilen gibi).
        postaGidenEkle(ben, postaKonuCekirdegi(vs(v, "konu")) || `pk-${Date.now().toString(36)}`, vs(v, "konu"), vs(v, "metin"), grup || undefined, gidenler);
        return { tamam: true };
      },
    });
  },
};

export const ARAC_YURUTUCULERI: Record<string, Yurutucu> = { ...OKUMA, ...YAZMA };
export const YAZMA_ARACLARI = Object.keys(YAZMA);

/* Formun eksik zorunlu alanları (görünenler). */
export const gorunurMu = (a: FormAlani, v: Degerler) => !a.kosul || v[a.kosul.alan] === a.kosul.deger;
export const alanSecenekleri = (a: FormAlani, v: Degerler): Secenek[] => (a.bagli ? (a.bagli.harita[String(v[a.bagli.alan] ?? "")] ?? []) : (a.secenekler ?? []));
export const eksikAlanlar = (alanlar: FormAlani[], v: Degerler) =>
  alanlar.filter((a) => a.zorunlu && gorunurMu(a, v) && (a.tur === "coklu" ? !va(v, a.ad).length : a.tur === "onay" ? false : !vs(v, a.ad))).map((a) => a.ad);

// Kişinin "evet"i: düğmesiz onay (belgeler/asistan.md, ilke 3). Yalnız kişinin kendi yazdığı iletiden.
const EVET = /^\s*(evet|tamam|onayla(yorum)?|olur|yap|g[öo]nder|ok(ey)?|yes|sure|confirm|send|نعم|أجل|موافق|تمام|حسنا|حسناً|أرسل)[\s.!]*$/i;
const HAYIR = /^\s*(hay[ıi]r|vazge[çc]|iptal|yapma|no|cancel|لا|إلغاء|الغ)[\s.!]*$/i;
export const onayYaniti = (m: string): "evet" | "hayir" | null => (EVET.test(m) ? "evet" : HAYIR.test(m) ? "hayir" : null);
