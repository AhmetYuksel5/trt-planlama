import { asamaListesi, gorunenSahip, parcaliMi } from "./akis";
import { muhabirDurumu } from "./muhabirDurumu";
import type { BirimId, Durum, Kisi, NextDayPlan, Paket } from "./veri";
import { adimYapabilir, parcaYapabilir } from "./yetki";

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
