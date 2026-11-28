/*
 * Yönetici kokpiti (kullanıcı: yöneticiler yoğun, karmaşık bölmeye ilgi
 * göstermez; basit, havalı, genel akışı ve kim ne yapıyor onu görsün, kontrol
 * hissi versin; planın yalnız başlıkları, seçince ayrıntı; muhabir
 * görevlendirmeleri, özel yayınlar ve muhabir istatistikleri önemli). Üç yönetici
 * asistanı ajanla çalışıldı. Saf: kayda bakar, yazmaz; her şey kayıttan hesaplanır.
 */
import { muhabirRaporu } from "./muhabirRaporu";
import { ayKaydir } from "./muhasebe";
import { ozelAsamaDurumlari, ozelGecti, ozelIcerikleri, ozelNafizeleri, type OzelAsamaDurumu } from "./ozel";
import { paketGunu } from "./bitmisPaket";
import { PANO_SUTUNLARI, panoSutunu, type PanoSutunu } from "./uretim";
import { gunEkle, haftaBasi, yerelGun } from "./tarih";
import type { CanliYayin, Durum, Gelisme, Gorevlendirme, HaftalikKalem, NextDayPlan, OzelYayin, Paket, PlanBasligi } from "./veri";

/* --- Planın başlıkları: başlık önce, ayrıntı seçince --- */

export interface BaslikOzeti {
  pb: PlanBasligi;
  ad: string;
  gelismeler: Gelisme[];
  paketler: Paket[];
  canlilar: CanliYayin[];
  muhabirler: { kisiId: string; yer?: string }[];
  live: boolean;
  /** Özel yayının başlığı (planda kimliği `<plan>-oz-<yayın>`). */
  ozelId?: string;
}

export const planBasliklari = (d: Durum, plan: NextDayPlan): BaslikOzeti[] =>
  plan.basliklar.map((pb) => {
    const gelismeler = d.gelismeler.filter((g) => g.planId === plan.id && g.planBaslikId === pb.id);
    const canlilar = d.canliYayinlar.filter((c) => c.planId === plan.id && c.planBaslikId === pb.id);
    const oz = pb.id.split("-oz-")[1];
    return {
      pb,
      ad: d.basliklar.find((b) => b.id === pb.baslikId)?.ad ?? "",
      gelismeler,
      paketler: d.paketler.filter((p) => p.planId === plan.id && p.planBaslikId === pb.id && p.durum !== "iptal"),
      canlilar,
      muhabirler: pb.muhabirler.map((m) => ({ kisiId: m.kisiId, yer: m.yer })),
      live: !!pb.live || canlilar.length > 0,
      ozelId: oz && d.ozel.some((o) => o.id === oz) ? oz : undefined,
    };
  });

/** Paketin kararı başlık özetinde: karar bekleyen (taslak, değerlendirmede) ya da kabul. */
export const paketKarariOzet = (p: Paket): "bekliyor" | "kabul" | "bitti" =>
  p.durum === "taslak" || p.durum === "degerlendiriliyor" ? "bekliyor" : p.durum === "tamamlandi" ? "bitti" : "kabul";

/* --- Haftanın dosyaları: ana dosyalar ve günlerin dosyaları --- */

export interface HaftaDosyaOzeti {
  baslikId: string;
  ad: string;
  kalemler: HaftalikKalem[];
  pkg: number;
}

export const haftaOzeti = (d: Durum, gun: string) => {
  const hafta = d.haftalik.find((h) => h.baslangic === haftaBasi(gun));
  if (!hafta) return undefined;
  const ad = (id?: string) => d.basliklar.find((b) => b.id === id)?.ad ?? "";
  const dosyalar = new Map<string, HaftaDosyaOzeti>();
  for (const k of hafta.kalemler) {
    if (!k.baslikId || k.karar === "ret") continue;
    const x = dosyalar.get(k.baslikId) ?? { baslikId: k.baslikId, ad: ad(k.baslikId), kalemler: [], pkg: 0 };
    x.kalemler.push(k);
    if (k.paketBasligi) x.pkg++;
    dosyalar.set(k.baslikId, x);
  }
  const anaIdler = new Set(hafta.anaKonular.map((a) => a.baslikId).filter(Boolean));
  return {
    hafta,
    anaDosyalar: hafta.anaKonular.map((a) => ({ ...a, ad: a.baslikId ? ad(a.baslikId) || a.baslik : a.baslik, dosya: a.baslikId ? dosyalar.get(a.baslikId) : undefined })),
    dosyalar: [...dosyalar.values()].filter((x) => !anaIdler.has(x.baslikId)).sort((a, b) => b.kalemler.length - a.kalemler.length),
  };
};

/* --- Muhabir görevlendirmeleri: haftanın şeridi --- */

export interface GorevSeridi {
  g: Gorevlendirme;
  /** Haftanın içindeki ilk ve son gün (0 Cumartesi … 6 Cuma). */
  bas: number;
  son: number;
  tur: "gorev" | "ozel" | "izin";
}

export const haftaGunleri = (gun: string) => Array.from({ length: 7 }, (_, i) => gunEkle(haftaBasi(gun), i));

export const haftaninGorevleri = (d: Durum, gun: string): GorevSeridi[] => {
  const gunler = haftaGunleri(gun);
  const ilk = gunler[0];
  const son = gunler[6];
  return d.gorevlendirmeler
    .filter((g) => g.durum !== "talep" && g.baslangic <= son && (g.bitis || g.baslangic) >= ilk)
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic) || a.kisiId.localeCompare(b.kisiId))
    .map((g) => ({
      g,
      bas: Math.max(0, gunler.indexOf(g.baslangic < ilk ? ilk : g.baslangic)),
      son: gunler.indexOf((g.bitis || g.baslangic) > son ? son : g.bitis || g.baslangic),
      tur: g.tur === "izin" ? "izin" : g.ozelId ? "ozel" : "gorev",
    }));
};

/* --- Özel yayınlar: süren ve yaklaşan --- */

export interface OzelKarti {
  o: OzelYayin;
  kalanGun: number;
  asamalar: OzelAsamaDurumu[];
  nafize: number;
  icerik: number;
  hazir: number;
  eksik: number;
}

const gunFarki = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86_400_000);

export const ozelKartlari = (d: Durum, gun: string, en = 3): OzelKarti[] =>
  d.ozel
    .filter((o) => !ozelGecti(o, gun))
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
    .slice(0, en)
    .map((o) => {
      const asamalar = ozelAsamaDurumlari(o, d);
      const icerikler = ozelIcerikleri(d, o.id);
      return {
        o,
        kalanGun: Math.max(0, gunFarki(gun, o.tarih)),
        asamalar,
        nafize: ozelNafizeleri(d, o.id).length,
        icerik: icerikler.length,
        hazir: icerikler.filter((p) => p.durum === "tamamlandi").length,
        eksik: asamalar.reduce((n, a) => n + a.eksikler.length, 0),
      };
    });

/* --- Muhabir istatistikleri --- */

/** Ayın en çok iş bitiren muhabirleri (Muhasebe'nin "biten iş" kuralıyla, muhabirRaporu'ndan), önceki ayla. */
export const ilkMuhabirler = (d: Durum, ayi: string, en = 5) =>
  muhabirRaporu(d, ayi)
    .filter((s) => s.bu.biten > 0 || s.onceki.biten > 0)
    .sort((a, b) => b.bu.biten - a.bu.biten || b.onceki.biten - a.onceki.biten)
    .slice(0, en);

/** Ayın kabul ve reddi (bütün muhabirler); takip sayılmaz. */
export const ayinKabulu = (d: Durum, ayi: string) => {
  let kabul = 0;
  let ret = 0;
  for (const s of muhabirRaporu(d, ayi)) {
    kabul += s.bu.kabul;
    ret += s.bu.ret;
  }
  return { kabul, ret, oran: kabul + ret ? kabul / (kabul + ret) : null };
};

/** Son n haftanın öneri ve yayınlanan iş sayısı (haftalar Cumartesi başlar, en eskisi önce). */
export const haftalikSeri = (d: Durum, gun: string, n = 8) => {
  const bu = haftaBasi(gun);
  return Array.from({ length: n }, (_, i) => {
    const bas = gunEkle(bu, -7 * (n - 1 - i));
    const son = gunEkle(bas, 6);
    const icinde = (g?: string) => !!g && g >= bas && g <= son;
    return {
      bas,
      oneri: d.oneriler.filter((o) => o.durum !== "takip" && !o.takipTuru && icinde(yerelGun(o.zaman))).length,
      yayin: d.paketler.filter((p) => p.durum === "tamamlandi" && icinde(paketGunu(d, p))).length,
    };
  });
};

export const oncekiAy = (ayi: string) => ayKaydir(ayi, -1);

/* --- Üretim hattı: kapsamdaki paketler aşama aşama --- */

export const UZUN_BEKLEME = 180;

export const uretimHatti = (paketler: Paket[], simdi = Date.now()) => {
  const sutunlar = PANO_SUTUNLARI.filter((s): s is Exclude<PanoSutunu, "grafik"> => s !== "grafik");
  return sutunlar
    .map((s) => {
      const l = paketler.filter((p) => panoSutunu(p) === s);
      const enUzun = Math.max(0, ...l.map((p) => (simdi - new Date(p.asamaIzi?.[p.adim ?? ""]?.giris ?? p.guncelleme).getTime()) / 60_000));
      return { sutun: s, sayi: l.length, enUzun };
    })
    .filter((x) => x.sutun !== "eski" || x.sayi > 0);
};

/* --- Kanalın nabzı: birimlerin en kötü ışığı --- */

export type Isik = "iyi" | "uyari" | "kotu";
export const nabiz = (birimler: { geciken: number; bekleyen: number }[]) => {
  const geciken = birimler.reduce((n, b) => n + b.geciken, 0);
  const bekleyen = birimler.reduce((n, b) => n + b.bekleyen, 0);
  const isik: Isik = geciken ? "kotu" : bekleyen ? "uyari" : "iyi";
  return { isik, geciken, bekleyen };
};
