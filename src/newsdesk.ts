import { asamaListesi, gorunenSahip, parcaliMi } from "./akis";
import { muhabirDurumu } from "./muhabirDurumu";
import type { BirimId, Durum, Kisi, NextDayPlan, Paket } from "./veri";
import { gunEkle } from "./tarih";
import { adimYapabilir, newsdeskteMi, parcaYapabilir } from "./yetki";

/*
 * Newsdesk'in ana sayfasının kuralları (kullanıcı: Next Day onaylanınca
 * Newsdesk'in kontrolüne geçiyor; uygulayan, güncelleyen, muhabiri atayan,
 * yayınlanmayanı stoka geri gönderen, teslimi reddeden Newsdesk). Saklanmaz,
 * kayıttan.
 */

const teslimSirasi = (x: Paket, y: Paket) => (x.teslim ?? "~").localeCompare(y.teslim ?? "~");

/*
 * Sırası Newsdesk'te olan işler tek kuyrukta: durağı Newsdesk'in (video
 * kontrolü, yükleme…) ya da parçalı metinde editoryal denetimi bekleyen
 * parçası olan paket. Teslim saatine göre.
 */
export const newsdeskSirasi = (d: Pick<Durum, "paketler">, ben: Kisi): Paket[] =>
  d.paketler
    .filter(
      (p) =>
        p.durum === "uretimde" &&
        (adimYapabilir(ben, p) || (parcaliMi(p) && (p.parcalar ?? []).some((x) => x.asama === "newsdesk") && parcaYapabilir(ben, p, "newsdesk"))),
    )
    .sort(teslimSirasi);

/* Planın paketinin Newsdesk'teki yeri. */
export type YayinGrubu = "tbc" | "suruyor" | "teslim" | "red" | "stok";
export const YAYIN_GRUPLARI: readonly YayinGrubu[] = ["tbc", "suruyor", "teslim", "red", "stok"];

export const yayinGrubu = (p: Paket, planId: string): YayinGrubu | null => {
  if (p.stogaDondu?.planId === planId) return "stok";
  if (p.planId !== planId || p.durum === "iptal" || p.stok) return null;
  if (p.newsdeskRed) return "red";
  if (p.durum === "tamamlandi") return "teslim";
  if (p.muhabirTbc || !p.muhabirId) return "tbc";
  return "suruyor";
};

/* Planın paketleri gruplarıyla; planın hazır (stoktan seçilmiş) paketleri "teslim"de. */
export const yayinPaketleri = (d: Pick<Durum, "paketler">, plan: NextDayPlan): Record<YayinGrubu, Paket[]> => {
  const g: Record<YayinGrubu, Paket[]> = { tbc: [], suruyor: [], teslim: [], red: [], stok: [] };
  for (const p of d.paketler) {
    const x = yayinGrubu(p, plan.id) ?? (plan.hazirPaketler.includes(p.id) ? "teslim" : null);
    if (x) g[x].push(p);
  }
  for (const x of YAYIN_GRUPLARI) g[x].sort(teslimSirasi);
  return g;
};

/*
 * Paketin şimdiki aşaması ve kimde: metin durağında sıra parçalardan
 * (muhabirDurumu: muhabirin gözünden aynı kural), öbüründe paketin yolu.
 */
export const paketKimde = (d: Durum, p: Paket): { asama: string; kimde: BirimId | null } => {
  const m = muhabirDurumu(d, p);
  if (m) return { asama: m.asama ?? asamaListesi(p).find((a) => a.durum === "simdi" || a.durum === "gecikti")?.ad ?? "", kimde: m.sende ? "muhabir" : (m.kimde ?? gorunenSahip(p)) };
  return { asama: asamaListesi(p).find((a) => a.durum === "simdi" || a.durum === "gecikti")?.ad ?? "", kimde: gorunenSahip(p) };
};

/*
 * Newsdesk'in sayfası Programlar'ın kalıbıyla (kullanıcı: masaların tasarım
 * dili; sabit ana sayfa, altında kişinin özelleştirdiği alan). Kutucuklar:
 * sıradaki işler, planın paketleri, canlı yayınlar, arşiv. Adres
 * "#/newsdesk/<bölüm>".
 */
export const NEWSDESK_BOLUMLERI = ["sira", "yayin", "canli", "arsiv"] as const;
export type NewsdeskBolumu = (typeof NEWSDESK_BOLUMLERI)[number];

const bugunVeYarin = (b: string) => [b, gunEkle(b, 1)];

/* Bugünün canlıları (canlının kendi günü, yoksa planın günü), saat sırasıyla. */
export const bugunkuCanlilar = (d: Pick<Durum, "canliYayinlar" | "planlar">, b: string) =>
  d.canliYayinlar
    .filter((c) => c.tarih === b || (!c.tarih && d.planlar.find((p) => p.id === c.planId)?.tarih === b))
    .sort((x, y) => (x.saatGmt || "~").localeCompare(y.saatGmt || "~"));

/* Kutucukların ve menünün sayıları: sırada iş, bugün ve yarın muhabiri belli olmayan paket, sonucu işaretlenmemiş bugünkü canlı. */
export const newsdeskKararlari = (d: Durum, ben: Kisi, b: string) => {
  const planlar = d.planlar.filter((p) => bugunVeYarin(b).includes(p.tarih) && newsdeskteMi(p));
  return {
    sira: newsdeskSirasi(d, ben).length,
    tbc: planlar.reduce((s, p) => s + yayinPaketleri(d, p).tbc.length, 0),
    canli: bugunkuCanlilar(d, b).filter((c) => !c.sonuc).length,
  };
};

/* Arşiv: son yedi günün Newsdesk planlarında teslim edilen, reddedilen ve stoka dönen paketler, gün gün, yenisi önce. */
export const ARSIV_GUNU = 7;
export const newsdeskArsivi = (d: Pick<Durum, "paketler" | "planlar">, b: string) =>
  d.planlar
    .filter((p) => newsdeskteMi(p) && p.tarih <= b && p.tarih > gunEkle(b, -ARSIV_GUNU))
    .sort((x, y) => y.tarih.localeCompare(x.tarih))
    .map((plan) => {
      const g = yayinPaketleri(d, plan);
      return { plan, paketler: [...g.teslim, ...g.red, ...g.stok] };
    })
    .filter((x) => x.paketler.length > 0);
