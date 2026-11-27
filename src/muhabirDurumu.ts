import { adimTuru, kolSahibi, paketYolu, parcalarHazir, parcaliMi } from "./akis";
import { metin } from "./dil";
import { eksikParcalar } from "./uretim";
import { adimYapabilir, paketTamamlayabilir } from "./yetki";
import { kisiBul, type BirimId, type Durum, type Paket } from "./veri";

/*
 * Muhabirin gözünden paketin durumu (kullanıcı: muhabir metni gönderiyor,
 * sonra ne olacağı, işin kimde olduğu belli değil; muhabir askıda kalıyordu).
 * Tek kural: Yapılacaklar'ın "sıra sende"si, menünün sayısı, paket sayfasının
 * şeridi ve gönderim anının bildirimi buradan. Saklanmaz, kayıttan.
 *
 * Metin durağında paketin adımı muhabirin durağı olarak kalıyor (parçalar
 * birbirini beklemiyor); sıra yalnız parçalardan anlaşılır: iade edilen ya da
 * beklenip gelmeyen parça varsa ya da bütün parçalar hazırsa (video) muhabirde,
 * yoksa en geride kalan parçanın masasında. Süre vaadi yok (kullanıcı kararı):
 * yalnız olgu, "x'ten beri".
 */
export type MuhabireIs = "duzelt" | "parca" | "video" | "sonuc" | "is";

export interface MuhabirDurumu {
  /** Sıra muhabirde mi. */
  sende: boolean;
  /** Muhabirin şimdi yapacağı iş (sendeyken) ya da sıra ona dönünce yapacağı. */
  is?: MuhabireIs;
  /** Sıra başkasındayken işin birimi ve aşamanın adı. */
  kimde?: BirimId;
  asama?: string;
  /** İşin o aşamaya geçtiği an (olgu). */
  beri?: string;
  /** Sonraki aşamaların adları (en çok iki). */
  sonra: string[];
  /** Parçalı metinde hazır / beklenen parça sayısı. */
  parca?: { hazir: number; toplam: number };
}

const SON_PARCA_HAREKETI = new Set(["parcaGeldi", "parcaDuzeltildi", "parcaTamam", "parcaIade"]);

export const muhabirDurumu = (d: Durum, p: Paket): MuhabirDurumu | null => {
  if (p.durum !== "onaylandi" && p.durum !== "uretimde") return null;
  const muhabir = kisiBul(d, p.muhabirId);
  if (p.durum === "uretimde" && p.adim && adimTuru(p) === "metin" && parcaliMi(p)) {
    const parcalar = p.parcalar ?? [];
    const eksik = eksikParcalar(p);
    const hazir = parcalar.filter((x) => x.asama === "tamam").length;
    const parca = { hazir, toplam: parcalar.length + eksik.length };
    const sonraki = paketYolu(p).slice(paketYolu(p).findIndex((a) => a.id === p.adim) + 1).filter((a) => a.id !== "tamam");
    const sonraAdlari = sonraki.slice(0, 2).map((a) => a.ad);
    if (parcalar.some((x) => x.asama === "muhabir")) return { sende: true, is: "duzelt", sonra: sonraAdlari, parca };
    if (parcalarHazir(p)) return { sende: true, is: "video", sonra: sonraAdlari, parca };
    if (eksik.length || !parcalar.length) return { sende: true, is: "parca", sonra: sonraAdlari, parca };
    // Hepsi gönderildi, denetimde: en geride kalan parçanın masası.
    const editorde = parcalar.some((x) => x.asama === "newsdesk");
    const kimde = editorde ? (p.uretim?.yol.editoryal ?? kolSahibi(p.tur)) : (p.uretim?.yol.dil ?? "scriptEditor");
    const beri = d.hareketler.find((h) => h.paketId === p.id && SON_PARCA_HAREKETI.has(h.tip))?.zaman;
    // Sıra muhabire video için dönecek; o satır şeritte ayrı ("Sana dönünce").
    const sonra = editorde && p.uretim?.yol.dil !== "atla" ? [metin("urDil")] : [];
    return { sende: false, is: "video", kimde, asama: metin(editorde ? "urEditoryal" : "urDil"), ...(beri && { beri }), sonra, parca };
  }
  const yol = paketYolu(p);
  const simdi = yol.findIndex((a) => a.durum === "simdi" || a.durum === "gecikti");
  const sonraki = simdi < 0 ? [] : yol.slice(simdi + 1).filter((a) => a.id !== "tamam");
  const sende = !!muhabir && (adimYapabilir(muhabir, p) || paketTamamlayabilir(muhabir, p, d));
  const sonra = sonraki.slice(0, 2).map((a) => a.ad);
  if (sende) return { sende, is: p.durum === "onaylandi" && !p.uretim ? "sonuc" : adimTuru(p) === "video" ? "video" : "is", sonra };
  const su = simdi < 0 ? undefined : yol[simdi];
  const beri = p.adim ? p.asamaIzi?.[p.adim]?.giris : undefined;
  // Sıra muhabire dönecekse (yolda muhabirin durağı var) ne için döneceği.
  const donus = sonraki.some((a) => a.masa === "muhabir") ? "video" : undefined;
  return { sende: false, ...(donus && { is: donus as MuhabireIs }), ...(su?.masa && { kimde: su.masa }), ...(su && { asama: su.ad }), ...(beri && { beri }), sonra };
};
