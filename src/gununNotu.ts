import { geciktiMi } from "./akis";
import { oneriArsivde } from "./oneriPlanlari";
import { gunEkle, gunFarki, yerelGun } from "./tarih";
import { gorunenFaaliyetler, olusumBaglantilari, aralikOlusumlari, etkin } from "./takvim";
import type { Durum, Kisi, NextDayPlan } from "./veri";

/*
 * Günün notu (Planlama ana sayfası): kayıttan kurallarla çıkan uyarılar,
 * yapay zekasız. Kullanıcı sitenin kendi işleyişinden öğrenip öneri yapan
 * bir asistan istedi; ilk adım ücretsiz katman: sistem her işi zaten
 * kaydediyor, bekleyen ve gözden kaçan işler buradan hesaplanıyor.
 * Saklanmıyor, her çizimde kayıttan. Sonraki adımda yapay zeka bu notu
 * okuyup yorum yazabilir; kurallar o zaman da buradan.
 */

export type NotTuru = "kararGunu" | "cevapsizOneri" | "durganBaslik" | "sonucBekleyen" | "gecikenPaket" | "plansizFaaliyet" | "sessizMuhabir";
export type NotTonu = "kotu" | "uyari" | "bilgi";

export interface GununNotuSatiri {
  tur: NotTuru;
  ton: NotTonu;
  sayi: number;
  /** Basınca açılacak sayfa. */
  yol: string;
  /** İlk birkaç kaydın adı (içerik, Arapça) ya da kişi kimliği. */
  ornekler: string[];
  /** Örnekler kişi kimliği mi (muhabir adı Arapça yazımıyla gösterilir). */
  kisiler?: true;
  /** Durgun başlıkta en uzun süre (gün). */
  gun?: number;
}

/* Yanıt bekleyen öneri bu kadar saatten eskiyse uyarıya girer: aynı gün gelen öneri henüz "geç" değil. */
export const CEVAPSIZ_SAAT = 24;
/* Başlık bu kadar gün aynı gelişmelerle planda kalırsa durgun sayılır. */
export const DURGUN_GUN = 3;
/* Muhabirin kabul oranı son bu kadar günden; az öneride oran anlamsız, en az bu kadar öneri. */
export const KABUL_GUNU = 30;
export const KABUL_EN_AZ = 3;
export const KABUL_ORANI = 0.5;
const ORNEK = 3;

/* Planlama'nın çalıştığı plan: yarınınki, yoksa bugününki. */
export const calisilanPlan = (d: Pick<Durum, "planlar">, b: string): NextDayPlan | undefined =>
  d.planlar.find((p) => p.tarih === gunEkle(b, 1)) ?? d.planlar.find((p) => p.tarih === b);

const sade = (s: string) => s.replace(/\s+/g, " ").trim();
const gelismeImzasi = (d: Pick<Durum, "gelismeler">, planId: string, pbId: string) =>
  d.gelismeler
    .filter((g) => g.planId === planId && g.planBaslikId === pbId)
    .map((g) => sade(g.metin))
    .sort()
    .join("\n");

/*
 * Başlığın kaç gündür aynı gelişmelerle taşındığı. "devir" işareti "bugün de
 * geçerli" deyince kalkıyor, yeni gelişmeyi onaydan ayıramıyor; bu yüzden
 * gelişmelerin metnine bakılıyor: önceki günlerin planında aynı metinler
 * duruyorsa yeni bir şey eklenmemiş.
 */
export const durganGun = (d: Pick<Durum, "planlar" | "gelismeler">, plan: NextDayPlan, baslikId: string, bas = ""): number => {
  const pb = plan.basliklar.find((x) => x.baslikId === baslikId);
  if (!pb) return 0;
  const imza = gelismeImzasi(d, plan.id, pb.id);
  let gun = 1;
  for (;;) {
    const onceki = d.planlar.find((p) => p.tarih === gunEkle(plan.tarih, -gun));
    const opb = onceki?.basliklar.find((x) => x.baslikId === baslikId);
    if (!onceki || onceki.tarih < bas || !opb || gelismeImzasi(d, onceki.id, opb.id) !== imza) return gun;
    gun++;
  }
};

export function gununNotu(d: Durum, ben: Kisi, b: string, an = Date.now()): GununNotuSatiri[] {
  const notlar: GununNotuSatiri[] = [];
  const ekle = (n: Omit<GununNotuSatiri, "sayi" | "ornekler"> & { liste: string[] }) => {
    const { liste, ...geri } = n;
    if (liste.length) notlar.push({ ...geri, sayi: liste.length, ornekler: liste.slice(0, ORNEK) });
  };
  /*
   * Sayım başlangıcından önceki kayıt sayılmaz: sistem yarım kullanılırken
   * kararı dışarıda verilip işlenmemiş öneri, sonucu işaretlenmemiş paket
   * uyarıları ve kabul oranını yanıltıyordu. Takvim ve gecikme bugüne baktığı
   * için etkilenmez.
   */
  const bas = d.sayimBaslangici ?? "";
  const acik = d.oneriler.filter((o) => !oneriArsivde(o, b) && yerelGun(o.zaman) >= bas);
  const yarin = gunEkle(b, 1);

  // Günü bugün ya da yarın, karar verilmemiş: akşam toplantısından önce bakılmazsa haber kaçar.
  const kararda = acik.filter((o) => (o.durum === "yeni" || o.durum === "degerlendiriliyor") && !!o.hedefTarih && o.hedefTarih <= yarin && (o.bitisTarih ?? o.hedefTarih) >= b)
    .sort((x, y) => (x.hedefTarih ?? "").localeCompare(y.hedefTarih ?? ""));
  ekle({ tur: "kararGunu", ton: "kotu", yol: "#/oneriler", liste: kararda.map((o) => o.haberBasligi) });

  // Yanıt bekleyen öneri; yukarıda sayılan tekrar edilmiyor.
  const kararIds = new Set(kararda.map((o) => o.id));
  const cevapsiz = acik.filter((o) => o.durum === "yeni" && !kararIds.has(o.id) && an - new Date(o.zaman).getTime() > CEVAPSIZ_SAAT * 3_600_000)
    .sort((x, y) => x.zaman.localeCompare(y.zaman));
  ekle({ tur: "cevapsizOneri", ton: "uyari", yol: "#/oneriler", liste: cevapsiz.map((o) => o.haberBasligi) });

  // Günlerdir yeni gelişmesiz taşınan başlıklar.
  const plan = calisilanPlan(d, b);
  if (plan) {
    const durgun = plan.basliklar
      .map((pb) => ({ pb, gun: durganGun(d, plan, pb.baslikId, bas) }))
      .filter((x) => x.gun >= DURGUN_GUN)
      .sort((x, y) => y.gun - x.gun);
    const ad = (id: string) => d.basliklar.find((h) => h.id === id)?.ad ?? "";
    ekle({ tur: "durganBaslik", ton: "uyari", yol: `#/nextday/${plan.id}`, gun: durgun[0]?.gun, liste: durgun.map((x) => ad(x.pb.baslikId)).filter(Boolean) });
  }

  // Planın günü geçmiş, onaylı ama muhabirin sonucu (yapıldı/yapılmadı) gelmemiş paketler.
  const planGunu = new Map(d.planlar.map((p) => [p.id, p.tarih]));
  const sonucsuz = d.paketler.filter((p) => {
    if (p.durum !== "onaylandi" || p.isaret || p.ozelId || p.stok || !p.planId) return false;
    const g = planGunu.get(p.planId);
    return !!g && g >= bas && gunFarki(g, b) >= 1;
  });
  ekle({ tur: "sonucBekleyen", ton: "uyari", yol: "#/paketler", liste: sonucsuz.map((p) => p.baslik) });

  ekle({ tur: "gecikenPaket", ton: "kotu", yol: "#/uretim", liste: d.paketler.filter((p) => geciktiMi(p, an)).map((p) => p.baslik) });

  // Bugün ve yarınki faaliyet, hiçbir plana aktarılmamış.
  const plansiz = aralikOlusumlari(gorunenFaaliyetler(d, ben), b, yarin).filter((o) => etkin(o) && olusumBaglantilari(o).length === 0);
  ekle({
    tur: "plansizFaaliyet",
    ton: "bilgi",
    yol: plansiz.length === 1 ? `#/takvim/faaliyet/${plansiz[0].f.id}` : `#/takvim/gun/${b}`,
    liste: plansiz.map((o) => o.f.baslik),
  });

  /*
   * Açık Next Day çağrısına yanıt vermemiş ama önerisi genelde kabul edilen
   * muhabir: hatırlatmaya değer olanlar. Önerisi az olanın oranı anlamsız.
   */
  const cagri = d.cagrilar.filter((c) => (c.tur ?? "nextday") === "nextday" && c.tarih >= b).sort((x, y) => y.zaman.localeCompare(x.zaman))[0];
  if (cagri) {
    const otuz = new Date(an - KABUL_GUNU * 864e5).toISOString();
    const basAn = bas ? new Date(bas + "T00:00:00").toISOString() : "";
    const sinir = basAn > otuz ? basAn : otuz;
    const yanitlayan = new Set([
      ...d.oneriler.filter((o) => o.cagriId === cagri.id || o.zaman >= cagri.zaman).map((o) => o.muhabirId),
      ...d.yanitlar.filter((y) => y.cagriId === cagri.id).map((y) => y.kisiId),
    ]);
    const kabul = (kid: string) => {
      const l = d.oneriler.filter((o) => o.muhabirId === kid && o.zaman >= sinir && o.yon !== "muhabire" && o.durum !== "takip");
      const k = l.filter((o) => o.durum === "planaEklendi" || !!o.paketId).length;
      return l.length >= KABUL_EN_AZ ? k / l.length : 0;
    };
    const sessiz = cagri.bcc
      .filter((kid) => !yanitlayan.has(kid) && d.kisiler.some((k) => k.id === kid && !k.pasif))
      .map((kid) => ({ kid, oran: kabul(kid) }))
      .filter((x) => x.oran >= KABUL_ORANI)
      .sort((x, y) => y.oran - x.oran);
    ekle({ tur: "sessizMuhabir", ton: "bilgi", kisiler: true, yol: "#/muhabirler", liste: sessiz.map((x) => x.kid) });
  }
  return notlar;
}
