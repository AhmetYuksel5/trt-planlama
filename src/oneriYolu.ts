import { gorunenSahip } from "./akis";
import { acikSoru } from "./masaSorusu";
import { oneriPlanKaydi, oneriYeri } from "./oneriPlanlari";
import { paketSonucu } from "./paketSonucu";
import type { BirimId, Durum, NextDayPlan, Oneri, Paket } from "./veri";

/*
 * Önerinin yolu (yeni mimari, 2. aşama; belgeler/planlama-yeni-mimari.md):
 * geldi → değerlendirme → plan ya da gündem → PKG → muhabirde → sonuç, ve
 * "şimdi kimde, ne zamandan beri". Planlamacı bunu önce dört ayrı yerden
 * (rozet, plan etiketi, paket sayfası, hareket geçmişi) topluyordu. Saf,
 * saklanmaz: plandaki kayıt (`oneriPlanKaydi`) ve paketin kendisi doğru
 * kaynak, önerideki durum yalnız karar aşamasında okunur. Paketsiz plana
 * giren öneri (takip, gelişme, canlı) planla biter: PKG ve muhabir adımı yok.
 */

export const YOL_ADIMLARI = ["geldi", "degerlendirme", "plan", "pkg", "muhabir", "sonuc"] as const;
export type YolAdimi = (typeof YOL_ADIMLARI)[number];
/** geçti, şimdiki, sırada, kesildi (ret, yapılmadı). */
export type YolDurumu = "gecti" | "simdi" | "sirada" | "ret";

export interface OneriYolu {
  adimlar: { adim: YolAdimi; durum: YolDurumu }[];
  /** Plan adımı Next Day mi haftalık gündem mi. */
  gundem: boolean;
  plan?: NextDayPlan;
  planBaslikId?: string;
  hafta?: string;
  paket?: Paket;
  /** İş şimdi kimde: birim ya da kişi (muhabir); bitmiş ya da kesilmiş yolda yok. */
  kimde?: { birim?: BirimId; kisiId?: string };
  /** O adımın başladığı an: öneriye ya da paketine düşen son hareket, yoksa önerinin gelişi. */
  beri: string;
  bitti: boolean;
}

const KARAR = new Set<Oneri["durum"]>(["yeni", "degerlendiriliyor", "sonra", "takip"]);

/* Önerinin paketi: süren önce; yoksa en son iptal olan (ret ya da yapılmadı yolda görünsün). */
const oneriPaketi = (d: Pick<Durum, "paketler">, o: Oneri): Paket | undefined => {
  const hepsi = d.paketler.filter((p) => p.oneriId === o.id);
  return hepsi.find((p) => p.durum !== "iptal") ?? hepsi.filter((p) => !p.devredildi).at(-1);
};

export function oneriYolu(d: Durum, o: Oneri): OneriYolu {
  const yer = o.durum === "teklif" ? null : oneriYeri(d, o);
  const kayit = yer?.planda ? oneriPlanKaydi(d, o) : null;
  const p = o.durum === "teklif" ? undefined : oneriPaketi(d, o);
  const planda = !!yer || !!p || o.durum === "planaEklendi";
  const sonuc = p && paketSonucu(p);
  const adimlar: OneriYolu["adimlar"] = [{ adim: "geldi", durum: "gecti" }];
  let kimde: OneriYolu["kimde"];
  let bitti = false;
  const ekle = (adim: YolAdimi, durum: YolDurumu) => adimlar.push({ adim, durum });

  if (o.durum === "reddedildi" || o.durum === "geriCekildi") {
    ekle("degerlendirme", "ret");
    bitti = true;
  } else if (!planda) {
    ekle("degerlendirme", "simdi");
    const soru = acikSoru(d, o.id);
    if (o.durum === "teklif" || o.durum === "duzeltme") kimde = o.muhabirId ? { kisiId: o.muhabirId } : undefined;
    else if (soru) kimde = { birim: soru.birim };
    else if (KARAR.has(o.durum)) kimde = { birim: "planlama" };
    ekle("plan", "sirada");
  } else {
    ekle("degerlendirme", "gecti");
    if (!p) {
      // Paketsiz: plan ya da gündem son adım.
      ekle("plan", "gecti");
      bitti = true;
    } else {
      ekle("plan", "gecti");
      if (p.durum === "taslak" || p.durum === "degerlendiriliyor") {
        ekle("pkg", "simdi");
        kimde = { birim: "planlama" };
        ekle("muhabir", "sirada");
        ekle("sonuc", "sirada");
      } else if (sonuc === "reddedildi" || (p.durum === "iptal" && !p.yapilmadi)) {
        ekle("pkg", "ret");
        bitti = true;
      } else {
        ekle("pkg", "gecti");
        if (sonuc === "yapildi") {
          ekle("muhabir", "gecti");
          ekle("sonuc", "gecti");
          bitti = true;
        } else if (sonuc === "yapilmadi") {
          ekle("muhabir", "gecti");
          ekle("sonuc", "ret");
          bitti = true;
        } else if (sonuc === "onayBekliyor") {
          ekle("muhabir", "gecti");
          ekle("sonuc", "simdi");
          kimde = { birim: "planlama" };
        } else {
          ekle("muhabir", "simdi");
          const sahip = gorunenSahip(p);
          kimde = sahip === "muhabir" || !sahip ? (p.muhabirId ? { kisiId: p.muhabirId } : undefined) : { birim: sahip };
          ekle("sonuc", "sirada");
        }
      }
    }
  }
  const ilgili = (h: Durum["hareketler"][number]) => h.oneriId === o.id || (!!p && h.paketId === p.id);
  let beri = o.zaman;
  for (const h of d.hareketler) if (h.zaman > beri && ilgili(h)) beri = h.zaman;
  return {
    adimlar,
    gundem: !!yer && !yer.planda,
    plan: kayit?.plan ?? (p?.planId ? d.planlar.find((x) => x.id === p.planId) : undefined),
    planBaslikId: p?.planBaslikId ?? d.gelismeler.find((g) => g.oneriId === o.id && g.planId === kayit?.plan.id)?.planBaslikId ?? d.canliYayinlar.find((c) => c.oneriId === o.id && c.planId === kayit?.plan.id)?.planBaslikId,
    hafta: yer?.hafta?.id,
    paket: p,
    kimde: bitti ? undefined : kimde,
    beri,
    bitti,
  };
}
