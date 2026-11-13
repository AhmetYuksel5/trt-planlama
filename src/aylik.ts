import { haftaSonu } from "./haftalik";
import type { AylikEtiketi, AylikOlay, AylikPlan, AylikSatirTuru, Durum, HaftalikPlan } from "./veri";

/*
 * Aylık planın okuma kuralları. Saklanmaz, kayıttan hesaplanır: olayların
 * sırası, Weekly'ye düşenler, görev tabloları, Özel yayın önerileri.
 */

export const olaylar = (p: AylikPlan | undefined): AylikOlay[] => [...(p?.olaylar ?? [])].sort((a, b) => a.tarih.localeCompare(b.tarih) || a.baslik.localeCompare(b.baslik));

export const olaySonu = (o: Pick<AylikOlay, "tarih" | "bitis">) => o.bitis && o.bitis > o.tarih ? o.bitis : o.tarih;

/** Ay "YYYY-MM"; olay ayın içine düşüyorsa o ayın planına girer (başladığı ay). */
/* Olayın bağlantıları; ilk sürümdeki tek bağlantı da listede. */
export const olayBaglantilari = (o: Pick<AylikOlay, "baglanti" | "baglantilar">): string[] =>
  [...new Set([...(o.baglantilar ?? []), ...(o.baglanti ? [o.baglanti] : [])].map((b) => b.trim()).filter(Boolean))];

export const olayAyi = (tarih: string) => tarih.slice(0, 7);

/*
 * Weekly'ye düşen olaylar: günleri (ya da gün gün kapsamı) haftayla kesişen,
 * her aylık planın (hazırlıkta da) olayları. Kesin değil, öneri: haftalıkta
 * yeniden değerlendiriliyor. Gündeme alınmış olan "gündemde" işaretli.
 */
export interface HaftayaDusen {
  plan: AylikPlan;
  olay: AylikOlay;
  /** Olayın bu haftadaki ilk günü: gündeme bu günle girer. */
  gun: string;
  kalemId?: string;
}
export const haftayaDusenler = (d: Durum, h: HaftalikPlan): HaftayaDusen[] => {
  const bas = h.baslangic;
  const bit = haftaSonu(bas);
  const l: HaftayaDusen[] = [];
  for (const plan of d.aylik)
    for (const olay of olaylar(plan)) {
      const ici = olay.gunler.map((g) => g.tarih).filter((g) => g >= bas && g <= bit).sort();
      const kesisir = olay.tarih <= bit && olaySonu(olay) >= bas;
      if (!kesisir && !ici.length) continue;
      const gun = ici[0] ?? (olay.tarih >= bas ? olay.tarih : bas);
      l.push({ plan, olay, gun, kalemId: h.kalemler.find((k) => k.aylikOlayId === olay.id)?.id });
    }
  return l.sort((a, b) => a.gun.localeCompare(b.gun));
};

/** Özel yayın önerileri: "ozel" etiketli, henüz açılmamış (açılanın yayını kendi bölümünde). */
export const ozelOnerileri = (d: Durum): { plan: AylikPlan; olay: AylikOlay }[] =>
  d.aylik.flatMap((plan) => olaylar(plan).filter((o) => o.etiketler.includes("ozel") && !(o.ozelId && d.ozel.some((x) => x.id === o.ozelId))).map((olay) => ({ plan, olay })));

/* Kurumun belgesindeki kodlar; her dilde aynı (PKG gibi). */
export const SATIR_KODU: Record<AylikSatirTuru, string> = {
  pkg: "PKG",
  live: "LIVE",
  walktalk: "WALK & TALK",
  rebroadcast: "rebroadcast",
  nafize: "نافذة",
  konuk: "ضيف",
  grafik: "جرافيك",
  diger: "",
};
export const ETIKET_KODU: Record<AylikEtiketi, string> = {
  inhouseOutput: "INHOUSE-COVERAGE / OUTPUT",
  inhouseInput: "INHOUSE-COVERAGE / INPUT",
  disGorev: "DEPLOYMENT",
  ozel: "SPECIAL COVERAGE",
  ekonomi: "ECONOMY",
  news: "NEWS",
  yeniSabah: "YENI SABAH",
};
/** Ana kapsam satırındaki "تشمل التغطية المقترحة ( تقارير + لايفات )": olayın satır türlerinden. */
const TUR_AR: Partial<Record<AylikSatirTuru, string>> = { pkg: "تقارير", live: "لايفات", walktalk: "ووك آند توك", nafize: "نوافذ", konuk: "ضيوف", grafik: "جرافيك" };
export const kapsamOzeti = (o: AylikOlay): string => [...new Set(o.gunler.flatMap((g) => g.satirlar.map((s) => TUR_AR[s.tur]).filter(Boolean)))].join(" + ");

/** Belgenin sonundaki görevlendirme tablosu, gidiş sırasıyla. */
export const gorevler = (p: AylikPlan | undefined) => olaylar(p).filter((o) => o.gorev).sort((a, b) => (a.gorev?.gidis ?? a.tarih).localeCompare(b.gorev?.gidis ?? b.tarih));

/** Weekly kaleminin biçimleri olayın satırlarından (PKG → pkg, LIVE → canli, Walk & Talk). */
export const olayBicimleri = (o: AylikOlay) => {
  const t = new Set(o.gunler.flatMap((g) => g.satirlar.map((s) => s.tur)));
  return [...(t.has("pkg") ? (["pkg"] as const) : []), ...(t.has("live") ? (["canli"] as const) : []), ...(t.has("walktalk") ? (["walktalk"] as const) : [])];
};

/*
 * Aylık olaydan özel yayına geçişte olayın kapsamı da gelir (yeni mimari, 3.
 * aşama; önce yalnız ad, gün ve açıklama geçiyordu, kapsam satırları, ekip ve
 * görevlendirme yeniden yazılıyordu). Saf; eylem (`aylikOlaydanOzel`) yazar.
 * - PKG ve Walk & Talk satırı paket önerisi (onaysız; olayın muhabiri varsa
 *   dış muhabir paketi, yoksa in-house), son tarihi satırın günü;
 * - LIVE ve نافذة satırı nafize (planlandı), günü satırın günü;
 * - öbür satırlar (konuk, grafik, tekrar yayın, diğer), ekip ve görevlendirme
 *   hazırlık maddesi, kurumun Arapça adlarıyla.
 * Öneriler planın onayıyla onaylanır, özel yayının kendi akışı değişmez.
 */
export interface OzeleGecenler {
  paketler: { baslik: string; muhabirId?: string; sonTarih: string; bicim: "pkg" | "walktalk"; tbc: boolean }[];
  nafizeler: { konu: string; tarih: string; yer?: string; muhabirId?: string; tbc: boolean }[];
  hazirlik: string[];
}

export function olaydanOzele(o: AylikOlay, ekipAdi: (e: AylikOlay["ekip"][number]) => string, gorevAdi: (g: AylikOlay["ekip"][number]["gorev"]) => string): OzeleGecenler {
  const muhabirId = o.ekip.find((e) => e.gorev === "muhabir" && e.kisiId)?.kisiId;
  const g: OzeleGecenler = { paketler: [], nafizeler: [], hazirlik: [] };
  for (const gun of [...o.gunler].sort((a, b) => a.tarih.localeCompare(b.tarih)))
    for (const s of gun.satirlar) {
      const metin = s.metin.trim();
      if (s.tur === "pkg" || s.tur === "walktalk")
        g.paketler.push({ baslik: metin || o.baslik, muhabirId, sonTarih: gun.tarih, bicim: s.tur, tbc: !!s.tbc });
      else if (s.tur === "live" || s.tur === "nafize") g.nafizeler.push({ konu: metin || o.baslik, tarih: gun.tarih, yer: o.yer, muhabirId: s.tbc ? undefined : muhabirId, tbc: !!s.tbc || !muhabirId });
      else g.hazirlik.push([gun.tarih, SATIR_KODU[s.tur], metin].filter(Boolean).join(" · "));
    }
  for (const e of o.ekip) g.hazirlik.push(`${gorevAdi(e.gorev)}: ${e.tbc ? "TBC" : ekipAdi(e)}`);
  if (o.gorev?.gidis || o.gorev?.donus) g.hazirlik.push(`DEPLOYMENT: ${o.gorev.gidis ?? "?"} – ${o.gorev.donus ?? "?"}`);
  return g;
}
