import type { UretimAdimi } from "./akis";
import { SISTEM, type CanliYayin, type Durum, type KunyeIzi, type KunyeRolu, type Paket } from "./veri";

/*
 * Künye (kullanıcı: biten paketin ve canlının kimlik kartı; "direkt kim
 * yaptıysa onun adı"): yazma ve okuma kuralları. Saf; eylemler adım yapıldığı
 * an `kunyeYaz` çağırır. Görevlendiren ve onaylayan tek kişi (son yapan);
 * metin ve dil denetimi parça parça başka kişilere düşebildiği için liste.
 */

const TEK: readonly KunyeRolu[] = ["gorevlendiren", "onaylayan"];

export const kunyeYaz = (p: Paket, rol: KunyeRolu, kisiId: string, zaman: string): Paket => {
  // Sistemin kendi işi (yarının planı, aktarım) kimsenin emeği değil.
  if (!kisiId || kisiId === SISTEM) return p;
  const eski = p.kunye?.[rol] ?? [];
  if (TEK.includes(rol)) {
    if (eski.length === 1 && eski[0].kisiId === kisiId) return p;
    return { ...p, kunye: { ...p.kunye, [rol]: [{ kisiId, zaman }] } };
  }
  if (eski.some((x) => x.kisiId === kisiId)) return p;
  return { ...p, kunye: { ...p.kunye, [rol]: [...eski, { kisiId, zaman }] } };
};

/** Üretim adımının künyedeki rolü; muhabirin kendi adımları (metin, video) ve iletim künyeye girmiyor. */
export const ADIM_ROLU: Partial<Record<UretimAdimi, KunyeRolu>> = {
  gorevlendirme: "gorevlendiren",
  newsdesk: "gorevlendiren",
  kontrol: "metin",
  dil: "dil",
  videoKontrol: "videoKontrol",
  media: "yukleyen",
  inews: "yukleyen",
};

/*
 * Künyesi olmayan biten paketin geçmişi hareket kaydından (yalnız izi hâlâ
 * duran yakın tarihli paket): sistemin açılış işi bir kez doldurur.
 */
const HAREKET_ROLU: Record<string, KunyeRolu> = {
  gorevlendirildi: "gorevlendiren",
  gorevVerildi: "gorevlendiren",
  paketOnaylandi: "gorevlendiren",
  ozelPaketAtandi: "gorevlendiren",
  paketGorevVerildi: "gorevlendiren",
  kontrolEdildi: "metin",
  parcaDuzeltildi: "metin",
  sonScript: "dil",
  parcaTamam: "dil",
  videoOnaylandi: "videoKontrol",
  klipKodu: "yukleyen",
  tamamlandi: "yukleyen",
  paketIsaretOnaylandi: "onaylayan",
};

export const hareketlerdenKunye = (d: Durum, p: Paket): Paket => {
  let y = p;
  // Hareketler en yenisi başta: eskiden yeniye işleniyor, tek kişilik rolde son yapan kalsın.
  for (const h of [...d.hareketler].reverse()) {
    if (h.paketId !== p.id) continue;
    const rol = HAREKET_ROLU[h.tip];
    // Planın onayı hatırlatma hareketi de yazıyor; o görev vermek değil. Muhabirin kendi "tamamlandı"sı da yükleme değil.
    if (!rol || (h.tip === "paketOnaylandi" && h.veri?.hatirlatma) || (h.tip === "tamamlandi" && h.kisiId === p.muhabirId)) continue;
    // Kesinleşmede onaylı paket: görevi plandan önce veren yok, plan onayı ancak görevlendiren yoksa sayılır.
    if (h.tip === "paketOnaylandi" && y.kunye?.gorevlendiren) continue;
    y = kunyeYaz(y, rol, h.kisiId, h.zaman);
  }
  return y;
};

/** Ekranda künyenin bir satırı: rol, kişiler (zamanla); boş rol çizilmez. */
export interface KunyeSatiri {
  rol: KunyeRolu | "oneren" | "muhabir" | "teslim" | "planlayan" | "yapildi";
  kisiler: KunyeIzi[];
  /** Kişi değil ad (muhabir dışı kaynak: ajans, resmî duyuru). */
  ad?: string;
}

export const paketKunyesi = (d: Durum, p: Paket): KunyeSatiri[] => {
  const s: KunyeSatiri[] = [];
  const o = d.oneriler.find((x) => x.id === p.oneriId);
  if (o) {
    // Önerinin sahibi: talimatı veren yönetici, muhabire teklifte öneren planlamacı, yoksa muhabir; muhabir dışı kaynağın adı.
    const oneren = o.talimatVeren ?? (o.yon === "muhabire" ? o.giren : o.muhabirId);
    if (oneren) s.push({ rol: "oneren", kisiler: [{ kisiId: oneren, zaman: o.zaman }] });
    else if (o.kaynakAdi) s.push({ rol: "oneren", kisiler: [], ad: o.kaynakAdi });
  }
  // Plansız görev künyeden önce de görevi vereni tutuyordu (Paket.gorev).
  const gorev = p.kunye?.gorevlendiren ?? (p.gorev ? [{ kisiId: p.gorev.veren, zaman: p.gorev.zaman }] : []);
  if (gorev.length) s.push({ rol: "gorevlendiren", kisiler: gorev });
  const muhabir = p.muhabirId ?? p.hazirlayanId;
  if (muhabir) s.push({ rol: "muhabir", kisiler: [{ kisiId: muhabir, zaman: p.muhabirTeslimi ?? "" }] });
  for (const rol of ["metin", "dil", "videoKontrol", "yukleyen", "onaylayan"] as const) {
    const k = p.kunye?.[rol];
    if (k?.length) s.push({ rol, kisiler: k });
  }
  return s;
};

export const canliKunyesi = (c: CanliYayin): KunyeSatiri[] => {
  const s: KunyeSatiri[] = [];
  if (c.ekleyen) s.push({ rol: "planlayan", kisiler: [c.ekleyen] });
  if (c.muhabirId) s.push({ rol: "muhabir", kisiler: [{ kisiId: c.muhabirId, zaman: "" }] });
  if (c.sonuc?.durum === "yapildi") s.push({ rol: "yapildi", kisiler: [{ kisiId: c.sonuc.kisiId, zaman: c.sonuc.zaman }] });
  return s;
};
