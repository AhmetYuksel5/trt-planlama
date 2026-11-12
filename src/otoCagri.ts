import { postaAdresi } from "./girisKodu";
import { HAFTALIK_TABLO, cagriGovdesi, cagriKonusu, etiketUret, govdeHtml, haftaAraligiAr, haftalikGovde } from "./eposta";
import { otoCagrilariKaydet } from "./eylemler";
import { postaKimlikGetir } from "./posta-kapi";
import { bugun, gunEkle } from "./tarih";
import { getir, muhabirler, type CagriTuru, type Durum, type Kisi } from "./veri";
import { kapiIstek } from "./yz";

/*
 * Otomatik öneri çağrısı (kapıda worker/src/oto-cagri.ts): Next Day her gün
 * 09:00'da ertesi günün planı için, haftalık her Cuma 10:00'da 8 gün sonra
 * başlayan hafta için (Perşembe toplantısında görüşülen). Gönderen planlamacı,
 * Kime planning grubu, muhabirler BCC'de; metin elle gönderilen çağrının aynı
 * şablonu, yalnız tarih değişiyor, son saat 15:00.
 *
 * Kapı veritabanını okuyamadığı için gönderenin tarayıcısı önümüzdeki iki
 * haftanın çağrılarını hazır haliyle ve BCC listesini kapıya bırakır; şablon
 * tek yerde kalır. Kapının gönderdiği çağrıyı kayda (yanıt eşleştirme için)
 * uygulamayı açan planlamacının tarayıcısı yazar.
 */

export const OTO_SON_SAAT = "15:00";
/* Kaç günlük çağrı önceden bırakılıyor: gönderen bu kadar gün uygulamayı açmasa da çağrı gider. */
export const OTO_PENCERE = 14;

export interface OtoKalem {
  etiket: string;
  tur: CagriTuru;
  tarih: string;
  gonderim: string;
  konu: string;
  metin: string;
  html: string;
  sonSaat: string;
}

export interface OtoKaydi {
  etiket: string;
  tur: CagriTuru;
  tarih: string;
  zaman: string;
  uid: string;
  kime: string;
  bccIdler: string[];
  konu: string;
  metin: string;
  sonSaat: string;
  tamam: boolean;
  hata?: string;
}

export interface OtoGorunum {
  acik: boolean;
  gonderen: string;
  benim: boolean;
  bccSayi: number;
  guncelleme: string;
  atla: string[];
  kalemler: Pick<OtoKalem, "etiket" | "tur" | "tarih" | "gonderim" | "konu">[];
  gecmis: OtoKaydi[];
}

const cumaMi = (g: string) => new Date(`${g}T12:00:00Z`).getUTCDay() === 5;
const sarili = (ic: string) => `<html><body>${ic}</body></html>`;

/* Önümüzdeki günlerin çağrıları; şablon elle çağrı ekranınınki (src/eposta.ts). */
export const otoCagriKalemleri = (gun: string, grup: string, pencere = OTO_PENCERE): OtoKalem[] => {
  const k: OtoKalem[] = [];
  for (let i = 0; i < pencere; i++) {
    const gonderim = gunEkle(gun, i);
    const tarih = gunEkle(gonderim, 1);
    const metin = cagriGovdesi(tarih, OTO_SON_SAAT);
    k.push({ etiket: etiketUret(tarih), tur: "nextday", tarih, gonderim, konu: cagriKonusu(tarih), metin, html: sarili(govdeHtml(metin)), sonSaat: OTO_SON_SAAT });
    if (cumaMi(gonderim)) {
      const bas = gunEkle(gonderim, 8);
      const hm = haftalikGovde(bas, grup);
      k.push({ etiket: etiketUret(bas, "haftalik"), tur: "haftalik", tarih: bas, gonderim, konu: cagriKonusu(bas, "haftalik"), metin: hm, html: sarili(govdeHtml(hm, { vurgu: haftaAraligiAr(bas), tablo: HAFTALIK_TABLO })), sonSaat: "" });
    }
  }
  return k;
};

/* BCC: izinde olmayan, kurumsal adresi olan muhabirler (elle çağrının varsayılanı). */
export const otoBcc = (d: Durum) => {
  const liste = muhabirler(d).filter((k) => k.durum !== "izinli" && postaAdresi(k));
  return { bcc: liste.map((k) => postaAdresi(k)), bccIdler: liste.map((k) => k.id) };
};

/* Kapıya bırakılan paket. Kayıtta çağrısı olan (elle gönderilmiş) etiket ikinci kez gitmesin. */
export const otoPaket = (d: Durum, gun: string, grup: string) => {
  const kalemler = otoCagriKalemleri(gun, grup);
  const var_ = new Set(d.cagrilar.map((c) => c.etiket));
  return { kalemler, ...otoBcc(d), gonderildi: kalemler.map((k) => k.etiket).filter((e) => var_.has(e)) };
};

export const otoCagriGetir = () => kapiIstek<OtoGorunum>("/oto-cagri");
export const otoCagriYaz = (g: Record<string, unknown>) => kapiIstek<OtoGorunum>("/oto-cagri", "PUT", g);

const IZ = "trt-planlama-oto-cagri";
const izOku = () => {
  try {
    return localStorage.getItem(IZ) ?? "";
  } catch {
    return "";
  }
};
const izYaz = (s: string) => {
  try {
    localStorage.setItem(IZ, s);
  } catch {
    /* depolama kapalı: bir sonraki açılışta yeniden bırakılır */
  }
};

/* Gönderenin grubuyla paketi kurup kapıya bırakır; değişmediyse yazmaz (KV'nin günlük yazma sınırı). */
export const otoPaketiBirak = async (ekle: Record<string, unknown> = {}) => {
  const k = await postaKimlikGetir();
  if (!k.tamam || !k.veri.grupAdresi || !k.veri.parolaVar) return { tamam: false as const, hata: "kimlik" };
  const paket = otoPaket(getir(), bugun(), k.veri.grupAdresi);
  const ozet = JSON.stringify(paket);
  if (!Object.keys(ekle).length && ozet === izOku()) return null;
  const r = await otoCagriYaz({ ...paket, ...ekle });
  if (r.tamam) izYaz(ozet);
  return r;
};

/*
 * Açılışta ve postaları çekmeden önce: kapının gönderdiği çağrıları kayda
 * yazar, gönderense listeyi tazeler. Dönen durum hatayı bildirmek için.
 */
export const otoCagriEsitle = async (ben: Kisi): Promise<OtoGorunum | null> => {
  const r = await otoCagriGetir();
  if (!r.tamam) return null;
  otoCagrilariKaydet(ben, r.veri.gecmis);
  if (r.veri.acik && r.veri.benim) await otoPaketiBirak();
  return r.veri;
};

/* Gönderilemeyen çağrı gönderene bir kez bildirilir (bu tarayıcıda). */
export const otoHataYeni = (zaman: string) => {
  try {
    if (localStorage.getItem(`${IZ}-hata`) === zaman) return false;
    localStorage.setItem(`${IZ}-hata`, zaman);
  } catch {
    /* depolama kapalı: her açılışta bildirilir */
  }
  return true;
};
