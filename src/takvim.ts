import { sade, ucDilde } from "./arama";
import { DILLER, yaz } from "./dil";
import { bolgeAdi, faaliyetTuruAdi, ulkeAdi } from "./etiketler";
import { ayBasi, ayEkle, aySonu, bugun, gunEkle, gunFarki, zaman } from "./tarih";
import { ULKE_BOLGESI, kisiBul, type Birim, type Bolge, type Durum, type Faaliyet, type FaaliyetBaglantisi, type FaaliyetDurum, type FaaliyetTuru, type IcerikTuru, type Kisi, type Oncelik, type Potansiyel, type Ulke } from "./veri";
import { faaliyetGorebilir } from "./yetki";

/**
 * Planlama takviminin okuma kuralları; kaydı değiştirenler eylemler.ts'te.
 *
 * Faaliyet bir kez kaydediliyor, tekrarları saklanmıyor: takvim hangi
 * aralığı çiziyorsa tekrarlar o aralığa açılıyor (olusumlar). Tekrarın
 * kimliği faaliyet ve başladığı gün; plan bağlantısı da bu günü taşıyor,
 * böylece BM Genel Kurulu'nun bu yılki toplantısı plana alınınca gelecek
 * yılınki "takipte" kalıyor.
 */

/** Planda faaliyetten doğan gelişmenin kaynağı (kurum içi); içerik olduğu için Arapça. */
export const TAKVIM_KAYNAGI = "تقويم التخطيط";

export interface Olusum {
  f: Faaliyet;
  bas: string;
  bit: string;
  /** Faaliyet + başladığı gün: tekrarlar arasında ayırt etmek için. */
  anahtar: string;
}

export const ONCELIK_SIRASI: Record<Oncelik, number> = { kritik: 0, yuksek: 1, normal: 2, dusuk: 3 };

/* Aralığın başına ancak süresi kadar önce başlayan tekrar uzanabilir; ilk adayı oradan hesaplıyoruz, baştan saymıyoruz. */
const ilkAdim = (f: Faaliyet, bas: string, sure: number) => {
  const geri = gunEkle(bas, -sure);
  if (geri <= f.baslangic) return 0;
  if (f.tekrar!.siklik === "haftalik") return Math.max(0, Math.floor(gunFarki(f.baslangic, geri) / 7));
  const ay = (t: string) => Number(t.slice(0, 4)) * 12 + Number(t.slice(5, 7));
  const fark = ay(geri) - ay(f.baslangic) - 1;
  return Math.max(0, f.tekrar!.siklik === "yillik" ? Math.floor(fark / 12) : fark);
};

const tekrarBasi = (f: Faaliyet, k: number) =>
  f.tekrar!.siklik === "haftalik" ? gunEkle(f.baslangic, 7 * k) : ayEkle(f.baslangic, (f.tekrar!.siklik === "yillik" ? 12 : 1) * k);

/** Faaliyetin [bas, bit] aralığına değen tekrarları; süre her tekrarda korunuyor. */
export const olusumlar = (f: Faaliyet, bas: string, bit: string): Olusum[] => {
  const sure = Math.max(0, gunFarki(f.baslangic, f.bitis));
  const ol = (b: string): Olusum => ({ f, bas: b, bit: gunEkle(b, sure), anahtar: `${f.id}@${b}` });
  if (!f.tekrar) return f.bitis >= bas && f.baslangic <= bit ? [ol(f.baslangic)] : [];
  const sinir = f.tekrar.bitis && f.tekrar.bitis < bit ? f.tekrar.bitis : bit;
  const sonuc: Olusum[] = [];
  for (let k = ilkAdim(f, bas, sure), i = 0; i < 600; k++, i++) {
    const b = tekrarBasi(f, k);
    if (b > sinir) break;
    const o = ol(b);
    if (o.bit >= bas) sonuc.push(o);
  }
  return sonuc;
};

/* Gün boyu olan önce, sonra saat; aynı saatte öncelik. */
export const olusumSirala = (a: Olusum, b: Olusum) =>
  a.bas.localeCompare(b.bas) || (a.f.saat ?? "").localeCompare(b.f.saat ?? "") || ONCELIK_SIRASI[a.f.oncelik] - ONCELIK_SIRASI[b.f.oncelik];

export const aralikOlusumlari = (liste: Faaliyet[], bas: string, bit: string) => liste.flatMap((f) => olusumlar(f, bas, bit)).sort(olusumSirala);

export const gundeMi = (o: Olusum, gun: string) => o.bas <= gun && o.bit >= gun;

/** Kişinin gördüğü faaliyetler: muhabir yalnız kendisine atananları. */
export const gorunenFaaliyetler = (d: Durum, ben: Kisi) => d.faaliyetler.filter((f) => faaliyetGorebilir(ben, f));

/** Tekrarın bağlantıları; tek seferlik faaliyette hepsi (tarihi sonradan değişse de). */
export const olusumBaglantilari = (o: Olusum): FaaliyetBaglantisi[] => (o.f.tekrar ? o.f.baglantilar.filter((b) => b.tarih === o.bas) : o.f.baglantilar);

/*
 * Tekrarlayan faaliyetin durumu bütün tekrarlarını anlatıyor; plana
 * alınmak tek tekrarın işi, o yüzden ekranda tekrarın kendi bağlantısından
 * çıkıyor.
 */
export const olusumDurumu = (o: Olusum): FaaliyetDurum =>
  o.f.tekrar && (o.f.durum === "taslak" || o.f.durum === "takipte") && olusumBaglantilari(o).length ? "planaAlindi" : o.f.durum;

/** Sayılara ve hatırlatmaya girmeyenler: iptal ve bitmiş. */
export const etkin = (o: Olusum) => o.f.durum !== "iptal" && o.f.durum !== "tamamlandi";

/** Bugünden ileri (sürmekte olan dahil) etkin tekrarlar. */
export const yaklasanlar = (liste: Faaliyet[], gun = 30, b = bugun()) => aralikOlusumlari(liste, b, gunEkle(b, gun)).filter(etkin);

export const faaliyetBolgesi = (f: Faaliyet): Bolge => f.bolge ?? (f.ulke ? ULKE_BOLGESI[f.ulke] : "kuresel");

/* --- Hatırlatma: sunucu yok, uygulamanın içinde gösteriliyor --- */

/* Saatsiz faaliyet sabah dokuzda başlıyor sayılıyor; "1 gün önce" önceki sabah dokuz. */
const baslamaZamani = (gun: string, f: Faaliyet) => new Date(zaman(gun, f.saat || "09:00"));

/** Tekrarın hatırlatma anı. Özel zaman ilk tekrara göre yazılmış; sonraki tekrarlara aynı farkla kayıyor. */
export const hatirlatmaZamani = (o: Olusum): Date | null => {
  const h = o.f.hatirlatma;
  if (!h) return null;
  const bas = baslamaZamani(o.bas, o.f);
  if ("zaman" in h) return new Date(bas.getTime() + (new Date(h.zaman).getTime() - baslamaZamani(o.f.baslangic, o.f).getTime()));
  if (h.once === "1a") return new Date(zaman(ayEkle(o.bas, -1), o.f.saat || "09:00"));
  return new Date(zaman(gunEkle(o.bas, h.once === "1g" ? -1 : h.once === "3g" ? -3 : -7), o.f.saat || "09:00"));
};

/** Zamanı gelmiş, faaliyeti henüz bitmemiş hatırlatmalar; faaliyet bitince kendiliğinden düşüyor. */
export const bekleyenHatirlatmalar = (liste: Faaliyet[], an = new Date()) => {
  const b = bugun();
  return aralikOlusumlari(
    liste.filter((f) => f.hatirlatma),
    b,
    gunEkle(b, 400),
  ).filter((o) => {
    const z = hatirlatmaZamani(o);
    return etkin(o) && !!z && z <= an;
  });
};

/* --- Yıllık görünüm --- */

export interface AyOzeti {
  ay: string;
  sayi: number;
  kritik: boolean;
  /** Ayın günlerinden hangilerinde faaliyet var (1..31). */
  gunler: Set<number>;
  ilkler: Olusum[];
}

/** Yılın on iki ayında kaç faaliyet var; iptaller sayılmıyor. Tekrarlar ekranın süzgeciyle açılmış geliyor. */
export const ayYogunlugu = (acilim: (bas: string, bit: string) => Olusum[], yil: string): AyOzeti[] =>
  Array.from({ length: 12 }, (_, i) => {
    const bas = `${yil}-${String(i + 1).padStart(2, "0")}-01`;
    const bit = aySonu(bas);
    const ol = acilim(bas, bit).filter((o) => o.f.durum !== "iptal");
    const gunler = new Set<number>();
    for (const o of ol) for (let g = o.bas < bas ? bas : o.bas; g <= o.bit && g <= bit; g = gunEkle(g, 1)) gunler.add(Number(g.slice(8)));
    return { ay: bas, sayi: ol.length, kritik: ol.some((o) => o.f.oncelik === "kritik"), gunler, ilkler: ol.slice(0, 3) };
  });

/* --- Özet sayaçları --- */

export const takvimOzeti = (liste: Faaliyet[], b = bugun()) => {
  const buAy = aralikOlusumlari(liste, ayBasi(b), aySonu(b)).filter((o) => o.f.durum !== "iptal").length;
  const yuksek = yaklasanlar(liste, 90, b).filter((o) => o.f.oncelik === "kritik" || o.f.oncelik === "yuksek").length;
  const yaklasan = yaklasanlar(liste, 30, b).length;
  const aktarilan = liste.filter((f) => f.baglantilar.length > 0).length;
  return { buAy, yuksek, yaklasan, aktarilan };
};

/* --- Arama ve süzgeç --- */

/*
 * Arama dilden bağımsız (arama.ts → sade). Ülke, bölge, tür ve muhabir
 * adı üç dilde de aranıyor; Türkçe arayüzdeki kullanıcı "Irak" da yazsa
 * "العراق" da bulsun.
 */
export const aramaUyar = (d: Durum, f: Faaliyet, sorgu: string) => {
  const sozcukler = sade(sorgu).split(/\s+/).filter(Boolean);
  if (!sozcukler.length) return true;
  const muhabir = kisiBul(d, f.muhabirId);
  const samanlik = sade(
    [
      f.baslik,
      f.sehir,
      f.notlar,
      f.ulke && ucDilde(ulkeAdi(f.ulke)),
      ucDilde(bolgeAdi(faaliyetBolgesi(f))),
      ucDilde(faaliyetTuruAdi(f.tur)),
      muhabir && DILLER.map((x) => yaz(muhabir.ad, x)).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
  return sozcukler.every((s) => samanlik.includes(s));
};

export interface Suzgec {
  ulke?: Ulke;
  bolge?: Bolge;
  tur?: FaaliyetTuru;
  oncelik?: Oncelik;
  birim?: Birim;
  muhabirId?: string;
  potansiyel?: Potansiyel;
  durum?: FaaliyetDurum;
  bas?: string;
  bit?: string;
}

/** Tarih dışındaki süzgeçler; tarih aralığı tekrarlara uygulanıyor (suzgecliOlusumlar). */
export const suzgeceUyar = (f: Faaliyet, s: Suzgec) =>
  (!s.ulke || f.ulke === s.ulke) &&
  (!s.bolge || faaliyetBolgesi(f) === s.bolge) &&
  (!s.tur || f.tur === s.tur) &&
  (!s.oncelik || f.oncelik === s.oncelik) &&
  (!s.birim || f.birim === s.birim) &&
  (!s.muhabirId || f.muhabirId === s.muhabirId) &&
  (!s.potansiyel || f.potansiyel === s.potansiyel) &&
  (!s.durum || f.durum === s.durum);

export const tarihSuzgeci = (s: Suzgec) => (o: Olusum) => (!s.bas || o.bit >= s.bas) && (!s.bit || o.bas <= s.bit);

export const etkinSuzgecSayisi = (s: Suzgec) => Object.values(s).filter(Boolean).length;

/* --- Planlara aktarım --- */

/** Faaliyetin plandaki kolu: ekonomi ekonomiye, program biriminin ve kültürün işi programa/feature'a, kalanı habere. */
export const faaliyetKolu = (f: Faaliyet): IcerikTuru =>
  f.tur === "ekonomi" ? "ekonomi" : f.birim === "program" ? "program" : f.tur === "kultur" ? "feature" : "haber";

/** Tekrarın günlerine düşen Next Day planları (yalnız bugün ve yarın açık). */
export const olusumPlanlari = (d: Durum, o: Olusum) => d.planlar.filter((p) => p.tarih >= o.bas && p.tarih <= o.bit).sort((a, b) => a.tarih.localeCompare(b.tarih));

/** Tekrarın günlerine değen haftalık planlar. */
export const olusumHaftalari = (d: Durum, o: Olusum) => d.haftalik.filter((h) => h.baslangic <= o.bit && gunEkle(h.baslangic, 6) >= o.bas);

/** Bir planın tarih aralığına düşen ve kişinin gördüğü faaliyetler: plan ekranlarının "Takvimden" bölümü. */
export const plandakiFaaliyetler = (d: Durum, ben: Kisi, bas: string, bit: string) =>
  aralikOlusumlari(gorunenFaaliyetler(d, ben), bas, bit).filter((o) => o.f.durum !== "iptal");

export const sureGun = (f: Faaliyet) => gunFarki(f.baslangic, f.bitis) + 1;

/** Kimliği ve günüyle tekrarı yeniden kuruyor (ayrıntı penceresi, adres). Tek seferlikte gün faaliyetin kendi günü. */
export const olusumAc = (f: Faaliyet, bas?: string): Olusum => {
  const b = f.tekrar && bas ? bas : f.baslangic;
  return { f, bas: b, bit: gunEkle(b, Math.max(0, gunFarki(f.baslangic, f.bitis))), anahtar: `${f.id}@${b}` };
};

/** Adresten gelen faaliyetin gösterilecek tekrarı: bugünden sonraki ilk tekrar, yoksa sonuncusu. */
export const siradakiOlusum = (f: Faaliyet, b = bugun()): Olusum => {
  if (!f.tekrar) return olusumAc(f);
  const ileri = olusumlar(f, b, gunEkle(b, 800))[0];
  if (ileri) return ileri;
  const geri = olusumlar(f, gunEkle(b, -800), b);
  return geri[geri.length - 1] ?? olusumAc(f);
};
