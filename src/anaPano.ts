import { asamaListesi, gorunenSahip } from "./akis";
import { sartliBekleyen } from "./haftalik";
import { masaninSorulari, SORU_MASALARI } from "./masaSorusu";
import { oneriSekmesi } from "./oneriSekmeleri";
import { oneriArsivde, oneriSonGunu, takibinOnerisi } from "./oneriPlanlari";
import { surenPaketGunu } from "./bitmisPaket";
import { arsivSonucu, arsivdeYeni, paketArsivGunu, paketSekmesi } from "./paketSekmeleri";
import { gunEkle, yerelGun } from "./tarih";
import type { BirimId, Durum, Kisi, Paket } from "./veri";
import { gorevTalebiKarariVerebilir, hesapYetkisi, paketGorebilir, paketIsaretOnaylayabilir, yapabilir } from "./yetki";

/*
 * Planlama'nın masaüstü ana sayfası (kullanıcı: sabit sayfa, bütün alan dolu,
 * yan panel yok, açtıkça yerinde büyüsün; beş tasarımcının ortak önerisi):
 * bugünün zaman çizgisi, tek karar kuyruğu, üretimdeki paketler, çağrıya yanıt
 * vermeyen muhabirler. Saklanmaz, kayıttan hesaplanır; sayılar menünün
 * kuralıyla (planlamaKararlari.ts) aynı.
 */

/* --- Öneri akışı --- */

/*
 * Kullanıcının çizdiği öneri akışı: ham öneri (karar bekleyen; sırası
 * başkasında olan ayrıca sayılır), görevlendirilmiş, takip, arşivdeki öneri
 * ve paket. Her kutu açtığı sekmenin kuralıyla sayar (öneri: oneriSekmeleri.ts,
 * paket: paketSekmeleri.ts); arşivler sekmenin ilk grubu, son 7 gün. Masaüstü
 * panonun şeridi ve telefondaki kutular bu tek kuraldan sayar.
 */
export interface OneriAkisi {
  baskasinda: number;
  gorevli: number;
  geciken: number;
  takip: number;
  arsivOneri: number;
  arsivPaket: number;
  yapilmadi: number;
}

export function oneriAkisi(d: Durum, ben: Kisi, b: string): OneriAkisi {
  let baskasinda = 0, takip = 0, arsivOneri = 0;
  for (const o of d.oneriler) {
    const s = oneriSekmesi(d, o, b);
    if (s === "baskasinda") baskasinda++;
    else if (s === "arsiv" && arsivdeYeni(oneriSonGunu(o), b)) arsivOneri++;
    // Takiplerim'in kuralı (Takipler.tsx → takipOnerileri): öneriye dönüşmüş takip sayılmaz.
    if (o.durum === "takip" && !oneriArsivde(o, b) && !takibinOnerisi(d, o)) takip++;
  }
  // Paketler sayfasının gördüğü paketler (paketGorebilir), sekmesinin kuralıyla.
  const gorunen = d.paketler.filter((p) => paketGorebilir(ben, p, d));
  const gorevli = gorunen.filter((p) => paketSekmesi(p) === "gorevli");
  const arsiv = gorunen.filter((p) => paketSekmesi(p) === "arsiv" && arsivdeYeni(paketArsivGunu(d, p), b));
  return {
    baskasinda,
    gorevli: gorevli.length,
    // Teslim günü olmayan paket gecikmiş sayılmaz (önce son değişikliğin günü teslim günü sanılıyordu).
    geciken: gorevli.filter((p) => {
      const g = surenPaketGunu(d, p);
      return !!g && g < b;
    }).length,
    takip,
    arsivOneri,
    arsivPaket: arsiv.length,
    yapilmadi: arsiv.filter((p) => arsivSonucu(p) === "yapilmadi").length,
  };
}

/* --- Bugünün zaman çizgisi --- */

export interface CizgiOlayi {
  /** "HH:MM", GMT: planın, belgenin ve üst çubuğun saati. */
  saat: string;
  tur: "toplanti" | "cagri" | "canli" | "paket";
  /** Toplantı, canlı ve pakette Arapça içerik; çağrıda boş (ekran kendi metnini yazar). */
  ad: string;
  href?: string;
  /** Canlının ya da paketin kimliği: Newsdesk çizgide basınca yerinde günceller. */
  id?: string;
}

/*
 * Çizgi GMT'de (kullanıcı: plana 16 GMT girilen canlı çizgide "19:00" görünüyordu).
 * Kurum planı GMT'yle yazıyor (canlı, vardiya, üst çubuk); çizgi İstanbul'a (+3)
 * çeviriyor ama dilimini yazmıyordu, toplantıları da tarayıcının yerel saatiyle
 * koyuyordu. Şimdi her olay GMT: canlı kayıttaki haliyle, toplantı UTC'den,
 * çağrının son saati (İstanbul, sabit +3) geri çevrilerek.
 */
const ikiHane = (h: number, m: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
const gmtSaat = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return Number.isNaN(h) ? "" : ikiHane(h, m);
};
const istanbuldanGmt = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return Number.isNaN(h) ? "" : ikiHane(h - 3, m);
};
const utcSaat = (iso: string) => {
  const t = new Date(iso);
  return ikiHane(t.getUTCHours(), t.getUTCMinutes());
};

export const gunOlaylari = (
  d: Pick<Durum, "toplantilar" | "cagrilar" | "canliYayinlar"> & Partial<Pick<Durum, "paketler" | "planlar">>,
  b: string,
  { paketler = false }: { paketler?: boolean } = {},
): CizgiOlayi[] => {
  const l: CizgiOlayi[] = [];
  for (const t of d.toplantilar ?? []) if (yerelGun(t.zaman) === b) l.push({ saat: utcSaat(t.zaman), tur: "toplanti", ad: t.ad });
  // Yarının planına bugün gönderilmiş çağrının son saati: o saate dek yanıt bekleniyor.
  for (const c of d.cagrilar ?? [])
    if ((c.tur ?? "nextday") === "nextday" && c.tarih === gunEkle(b, 1) && c.sonSaat && yerelGun(c.zaman) <= b) l.push({ saat: istanbuldanGmt(c.sonSaat), tur: "cagri", ad: "", href: "#/oneriler" });
  for (const c of d.canliYayinlar ?? []) {
    const s = c.tarih === b && c.saatGmt ? gmtSaat(c.saatGmt) : "";
    if (s) l.push({ saat: s, tur: "canli", ad: c.konu, href: `#/nextday/${c.planId}`, id: c.id });
  }
  /*
   * Newsdesk'in çizgisinde beklenen paketler (kullanıcı: çizgideki beklenen
   * şeylere basıp pratikçe güncellesin): bugünün planının teslim saati bugün
   * olan, sürmekte ya da bitmiş paketleri; saat UTC'den.
   */
  if (paketler) {
    const planlar = new Set((d.planlar ?? []).filter((x) => x.tarih === b).map((x) => x.id));
    for (const p of d.paketler ?? [])
      if (p.planId && planlar.has(p.planId) && !p.stok && p.teslim && yerelGun(p.teslim) === b && ["onaylandi", "uretimde", "tamamlandi"].includes(p.durum))
        l.push({ saat: utcSaat(p.teslim), tur: "paket", ad: p.baslik, href: `#/paketler/${p.id}`, id: p.id });
  }
  return l.sort((x, y) => x.saat.localeCompare(y.saat));
};

/** Şimdiden sonraki ilk olay ve kalan dakika (olaylar GMT, şimdi de UTC'den). */
export const siradakiOlay = (l: CizgiOlayi[], simdi: Date): { olay: CizgiOlayi; dakika: number } | null => {
  const an = simdi.getUTCHours() * 60 + simdi.getUTCMinutes();
  for (const o of l) {
    const [h, m] = o.saat.split(":").map(Number);
    const dk = h * 60 + m - an;
    if (dk > 0) return { olay: o, dakika: dk };
  }
  return null;
};

/* --- Tek karar kuyruğu --- */

export type KuyrukTuru = "oneri" | "birim" | "onay" | "sartli" | "talep" | "anma" | "hesap";
export interface KuyrukOgesi {
  /** Satırın kimliği: tür + kaydın kimliği. */
  id: string;
  tur: KuyrukTuru;
  /** Kaydın kendisi (öneri, paket, anma, kişi). */
  ref: string;
  baslik: string;
  /** Başlık Arapça içerik mi (öneri, paket, anma notu). */
  icerik: boolean;
  kisiId?: string;
  /** Ne zamandan beri bekliyor. */
  zaman?: string;
  /** Son gün: önerinin günü, şartlı kabulün son günü. */
  son?: string;
  /** Bugün ve yarına düşen ya da bekletilemeyen (onay, talep, anma): kuyruğun başında. */
  acil: boolean;
}

/*
 * Öneriler'in "Karar bekleyen" sekmesi, birimin yanıtladığı soru, "Yapıldı"
 * onayı, şartlı kabul, görev talebi, anılan not, kayıt onayı: tek listede,
 * son gününe ve bekleme süresine göre (tasarımcılar: türe göre ayrı kutular
 * hangisinin önce yapılacağını söylemiyordu).
 */
export function kararKuyrugu(d: Durum, ben: Kisi, b: string): KuyrukOgesi[] {
  const yarin = gunEkle(b, 1);
  const l: KuyrukOgesi[] = [];
  const birimdeYanitli = new Set<string>();
  for (const m of SORU_MASALARI)
    for (const s of masaninSorulari(d, m)) {
      if (!s.cevap) continue;
      const o = d.oneriler.find((x) => x.id === s.oneriId);
      if (!o || birimdeYanitli.has(o.id)) continue;
      birimdeYanitli.add(o.id);
      l.push({ id: `birim-${o.id}`, tur: "birim", ref: o.id, baslik: o.haberBasligi, icerik: true, kisiId: o.muhabirId, zaman: s.cevap.zaman, son: o.hedefTarih, acil: true });
    }
  for (const o of d.oneriler) {
    if (birimdeYanitli.has(o.id) || oneriSekmesi(d, o, b) !== "karar") continue;
    const gun = o.hedefTarih;
    const acil = !!gun && gun <= yarin && (o.bitisTarih ?? gun) >= b;
    l.push({ id: `oneri-${o.id}`, tur: "oneri", ref: o.id, baslik: o.paketBasligi || o.haberBasligi, icerik: true, kisiId: o.muhabirId, zaman: o.zaman, son: gun, acil });
  }
  if (paketIsaretOnaylayabilir(ben))
    for (const p of d.paketler)
      if (p.isaret && p.durum === "onaylandi" && !p.masaTakibi) l.push({ id: `onay-${p.id}`, tur: "onay", ref: p.id, baslik: p.baslik, icerik: true, kisiId: p.muhabirId ?? p.isaret.kisiId, zaman: p.isaret.zaman, acil: true });
  if (yapabilir(ben, "paketDegerlendir"))
    for (const p of d.paketler)
      if (sartliBekleyen(p) && !p.ozelId) l.push({ id: `sartli-${p.id}`, tur: "sartli", ref: p.id, baslik: p.baslik, icerik: true, kisiId: p.muhabirId, zaman: p.guncelleme, son: p.kosulSon, acil: !!p.kosulSon && p.kosulSon <= yarin });
  for (const p of d.paketler)
    if (p.gorevTalebi && !p.gorev && p.durum === "taslak" && gorevTalebiKarariVerebilir(ben, p))
      l.push({ id: `talep-${p.id}`, tur: "talep", ref: p.id, baslik: p.baslik, icerik: true, kisiId: p.gorevTalebi.kisiId, zaman: p.olusturma, son: p.sonTarih, acil: true });
  for (const a of d.bahsetmeler ?? [])
    if (a.kisiId === ben.id && !a.goruldu) l.push({ id: `anma-${a.id}`, tur: "anma", ref: a.id, baslik: a.metin, icerik: false, kisiId: a.yazanId, zaman: a.zaman, acil: true });
  if (hesapYetkisi(ben, "kisiDuzenle"))
    for (const k of d.kisiler) if (k.kontrolBekliyor && !k.pasif) l.push({ id: `hesap-${k.id}`, tur: "hesap", ref: k.id, baslik: "", icerik: false, kisiId: k.id, acil: false });
  // Acil önce; içinde son günü yakın olan, sonra en uzun bekleyen.
  return l.sort((x, y) => Number(y.acil) - Number(x.acil) || (x.son ?? "9999").localeCompare(y.son ?? "9999") || (x.zaman ?? "").localeCompare(y.zaman ?? ""));
}

/* --- Üretimdeki paketler: şimdi hangi aşamada, kimde, ne zamandır --- */

/** Bu kadar dakikadan uzun aynı aşamada duran paket turuncu (tasarımcılar: nerede tıkandığı görünsün). */
export const UZUN_DAKIKA = 180;

export interface UretimSatiri {
  paket: Paket;
  asama: string;
  kimde: BirimId | null;
  /** Aşamaya girdiği an (asamaIzi), yoksa son değişiklik. */
  beri: string;
}

/*
 * Bugünün ve yarının işi: üretimde olan ve günü bugün ya da yarın olan onaylı
 * paket (planının günü ya da son günü). Bekleyen en uzunu önce.
 */
export function uretimdekiler(d: Pick<Durum, "paketler" | "planlar">, b: string): UretimSatiri[] {
  const yarin = gunEkle(b, 1);
  const gun = (p: Paket) => d.planlar.find((x) => x.id === p.planId)?.tarih ?? p.sonTarih;
  return d.paketler
    .filter((p) => p.durum === "uretimde" || (p.durum === "onaylandi" && !!gun(p) && gun(p)! >= b && gun(p)! <= yarin))
    .map((p) => {
      const simdi = asamaListesi(p).find((a) => a.durum === "simdi" || a.durum === "gecikti");
      return { paket: p, asama: simdi?.ad ?? "", kimde: gorunenSahip(p), beri: (p.adim && p.asamaIzi?.[p.adim]?.giris) || p.guncelleme };
    })
    .sort((x, y) => x.beri.localeCompare(y.beri));
}

/* --- Çağrıya yanıt vermeyen muhabirler (Günün notunun kuralı, oran süzgeci olmadan) --- */

export function cagriDurumu(d: Pick<Durum, "cagrilar" | "oneriler" | "yanitlar" | "kisiler">, b: string): { yanitlayan: number; toplam: number; sessiz: string[] } | null {
  const cagri = d.cagrilar.filter((c) => (c.tur ?? "nextday") === "nextday" && c.tarih >= b).sort((x, y) => y.zaman.localeCompare(x.zaman))[0];
  if (!cagri) return null;
  const yanitlayan = new Set([...d.oneriler.filter((o) => o.cagriId === cagri.id || o.zaman >= cagri.zaman).map((o) => o.muhabirId), ...(d.yanitlar ?? []).filter((y) => y.cagriId === cagri.id).map((y) => y.kisiId)]);
  const bcc = cagri.bcc.filter((kid) => d.kisiler.some((k) => k.id === kid && !k.pasif));
  return { yanitlayan: bcc.filter((k) => yanitlayan.has(k)).length, toplam: bcc.length, sessiz: bcc.filter((k) => !yanitlayan.has(k)) };
}
