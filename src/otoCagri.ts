import { postaAdresi } from "./girisKodu";
import { HAFTALIK_TABLO, cagriGovdesi, cagriKonusu, etiketUret, govdeHtml, haftaAraligiAr, haftalikGovde, noktali } from "./eposta";
import { gunAdi } from "./dil";
import { otoCagrilariKaydet } from "./eylemler";
import { postaKimlikGetir } from "./posta-kapi";
import { bugun, gunEkle } from "./tarih";
import { temelSorumlular } from "./gorevler";
import { getir, muhabirler, type CagriTuru, type Durum, type Kisi } from "./veri";
import { kapiIstek } from "./yz";

/*
 * Otomatik öneri çağrısı (kapıda worker/src/oto-cagri.ts): Next Day her gün
 * ertesi günün planı için, haftalık haftada bir, sonraki haftadan sonraki
 * hafta için (Perşembe toplantısında görüşülen). Saatler, haftalığın günü,
 * son saat ve metin ayarda (kullanıcı: dinamik ayarlansın). Gönderen o günün
 * görevlisi, Görevler'den (kullanıcı: ayrı gönderen takvimi karışıktı): Next Day
 * çağrısında gönderildiği günün Next Day görevlisi (o gün ertesi günün planını o
 * hazırlıyor), haftalıkta Weekly görevlisi; kişi kendi hesabından gönderilmesine
 * izin vermişse. Kime planning grubu, muhabirler BCC'de.
 *
 * Kapı veritabanını okuyamadığı için gönderen listesindeki planlamacıların
 * tarayıcısı önümüzdeki iki haftanın çağrılarını hazır haliyle ve BCC
 * listesini kapıya bırakır; şablon tek yerde kalır. Kapının gönderdiği çağrıyı
 * kayda (yanıt eşleştirme için) uygulamayı açan planlamacının tarayıcısı yazar.
 */

export interface OtoZaman {
  nd: string;
  /** 0 Pazar … 6 Cumartesi. */
  hpGun: number;
  hp: string;
  sonSaat: string;
}
export const VARSAYILAN_ZAMAN: OtoZaman = { nd: "09:00", hpGun: 5, hp: "10:00", sonSaat: "15:00" };
export interface OtoSablon {
  nd?: string;
  hp?: string;
}
/* Kaç günlük çağrı önceden bırakılıyor: gönderen bu kadar gün uygulamayı açmasa da çağrı gider. */
export const OTO_PENCERE = 14;

export interface OtoKalem {
  etiket: string;
  tur: CagriTuru;
  tarih: string;
  gonderim: string;
  saat: string;
  konu: string;
  metin: string;
  html: string;
  sonSaat: string;
  /** Görevler'deki görevli (uid; "" görevli yok). */
  gorevli: string;
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
  gonderenler: string[];
  /** Bu kişi kendi hesabından gönderilmesine izin vermiş mi. */
  izinli: boolean;
  /** Haftanın günü (0 Pazar) → gönderen. */
  haftalik: Record<string, string>;
  /** Gün → gönderen ("" o gün kimse). */
  istisna: Record<string, string>;
  zaman: OtoZaman;
  sablon: OtoSablon;
  bccSayi: number;
  guncelleme: string;
  atla: string[];
  /** uid: izinli gönderen ("" gitmeyecek); gorevli: Görevler'deki kişi (eski pakette yok). */
  kalemler: (Pick<OtoKalem, "etiket" | "tur" | "tarih" | "gonderim" | "saat" | "konu"> & { uid: string; gorevli?: string })[];
  gecmis: OtoKaydi[];
}

const haftaninGunu = (g: string) => new Date(`${g}T12:00:00Z`).getUTCDay();
const sarili = (ic: string) => `<html><body>${ic}</body></html>`;

/* Elle yazılmış şablonda {gun} {tarih} {saat} (Next Day), {aralik} {adres} (haftalık); bilinmeyen yer tutucu kalır. */
const yerlestir = (s: string, p: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, x: string) => p[x] ?? `{${x}}`);

/* Next Day metni: ayardaki şablon, yoksa kurumun metni (elle çağrınınki). */
export const ndMetni = (tarih: string, sonSaat: string, sablon?: string) =>
  sablon ? yerlestir(sablon, { gun: gunAdi(tarih, "ar"), tarih: noktali(tarih), saat: sonSaat }) : cagriGovdesi(tarih, sonSaat);
export const hpMetni = (bas: string, grup: string, sablon?: string) =>
  sablon ? yerlestir(sablon, { aralik: haftaAraligiAr(bas), adres: grup }) : haftalikGovde(bas, grup);

/* Haftalık çağrı sonraki haftadan sonraki hafta için: Cuma gönderilirse 8 gün sonraki Cumartesi. */
export const hpHaftasi = (gonderim: string) => gunEkle(gonderim, ((6 - haftaninGunu(gonderim) + 7) % 7 || 7) + 7);

/* Önümüzdeki günlerin çağrıları; şablon elle çağrı ekranınınki (src/eposta.ts) ya da ayardaki. */
/* Çağrının görevlisi: Next Day'de gönderildiği günün, haftalıkta gönderildiği haftanın görevlisi. */
export const cagriGorevlisi = (d: Durum, tur: CagriTuru, gonderim: string) => temelSorumlular(d, tur === "haftalik" ? "haftalik" : "nextday", gonderim)[0] ?? "";

export const otoCagriKalemleri = (gun: string, grup: string, z: OtoZaman = VARSAYILAN_ZAMAN, sablon: OtoSablon = {}, pencere = OTO_PENCERE, gorevli: (tur: CagriTuru, gonderim: string) => string = () => ""): OtoKalem[] => {
  const k: OtoKalem[] = [];
  for (let i = 0; i < pencere; i++) {
    const gonderim = gunEkle(gun, i);
    const tarih = gunEkle(gonderim, 1);
    const metin = ndMetni(tarih, z.sonSaat, sablon.nd);
    k.push({ etiket: etiketUret(tarih), tur: "nextday", tarih, gonderim, saat: z.nd, konu: cagriKonusu(tarih), metin, html: sarili(govdeHtml(metin)), sonSaat: z.sonSaat, gorevli: gorevli("nextday", gonderim) });
    if (haftaninGunu(gonderim) === z.hpGun) {
      const bas = hpHaftasi(gonderim);
      const hm = hpMetni(bas, grup, sablon.hp);
      k.push({ etiket: etiketUret(bas, "haftalik"), tur: "haftalik", tarih: bas, gonderim, saat: z.hp, konu: cagriKonusu(bas, "haftalik"), metin: hm, html: sarili(govdeHtml(hm, { vurgu: haftaAraligiAr(bas), tablo: HAFTALIK_TABLO })), sonSaat: "", gorevli: gorevli("haftalik", gonderim) });
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
export const otoPaket = (d: Durum, gun: string, grup: string, z?: OtoZaman, sablon?: OtoSablon) => {
  const kalemler = otoCagriKalemleri(gun, grup, z, sablon, OTO_PENCERE, (tur, gonderim) => cagriGorevlisi(d, tur, gonderim));
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

/*
 * Bırakanın grubuyla paketi kurup kapıya bırakır; değişmediyse yazmaz (KV'nin
 * günlük yazma sınırı). Zaman ya da şablon değişiyorsa (`ekle`) paket yenisiyle kurulur.
 */
export const otoPaketiBirak = async (ayar: Pick<OtoGorunum, "zaman" | "sablon">, ekle: { zaman?: OtoZaman; sablon?: OtoSablon } & Record<string, unknown> = {}) => {
  const k = await postaKimlikGetir();
  if (!k.tamam || !k.veri.grupAdresi || !k.veri.parolaVar) return { tamam: false as const, hata: "kimlik" };
  const paket = otoPaket(getir(), bugun(), k.veri.grupAdresi, ekle.zaman ?? ayar.zaman, ekle.sablon ?? ayar.sablon);
  const ozet = JSON.stringify(paket);
  if (!Object.keys(ekle).length && ozet === izOku()) return null;
  // "Bunu gönderme" kalktı (atlanacaksa görevli değişir ya da anahtar kapanır); eski işaretler temizlenir.
  const r = await otoCagriYaz({ ...paket, atla: [], ...ekle });
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
  if (r.veri.acik && r.veri.izinli) await otoPaketiBirak(r.veri);
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
