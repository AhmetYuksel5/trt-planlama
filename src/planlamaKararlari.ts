import { kisininIsleri } from "./gorevler";
import { calisilanPlan, gununNotu } from "./gununNotu";
import { kararBekleyenler, sartliBekleyen } from "./haftalik";
import { masaninSorulari, SORU_MASALARI } from "./masaSorusu";
import { esCiftleri } from "./oneriPlanlari";
import { oneriSekmesi } from "./oneriSekmeleri";
import { okunmamisSayisi } from "./postaOkuma";
import { bugun, gunEkle, planlananHafta } from "./tarih";
import type { Durum, HaftalikPlan, Kisi, NextDayPlan, Paket } from "./veri";
import { gorevTalebiKarariVerebilir, hesapYetkisi, paketIsaretOnaylayabilir, uretimeAlabilir, yapabilir } from "./yetki";

/*
 * Planlama'nın önündeki kararların sayıları tek yerde (yeni mimari,
 * belgeler/planlama-yeni-mimari.md). Menü, telefondaki alt çubuk ve ana
 * sayfanın kutuları aynı sonucu okuyor: önce her biri kendi kuralıyla sayıyor,
 * menüdeki öneri sayısı Öneriler'in "Karar bekleyen" sekmesini tutmuyordu.
 * Saklanmaz; kabukta bir kez hesaplanıp bağlamla dağıtılır.
 */

export interface PlanlamaKararlari {
  /** Öneriler'in "Karar bekleyen" sekmesiyle aynı kural. */
  oneri: number;
  /** Bugüne ve yarına düşenler (karar bekleyenlerin içinden). */
  oneriYakin: number;
  esOneri: number;
  /** Çağrıya gelip muhabirle eşleşmeyen e-posta yanıtı. */
  eslesmeyenYanit: number;
  /** Muhabirin "Yapıldı / Yapılmadı" işareti, onay bekleyen (kişi onaylayabiliyorsa). */
  onay: number;
  onayEnEski?: string;
  /** Şartlı kabul bekleyen paket (paket değerlendiren). */
  sartli: number;
  /** Masaların görev talebi, karar bekleyen. */
  gorevTalebi: number;
  /** Masalarda: yanıt bekleyen ve yanıtı gelip görevlendirme bekleyen sorular. */
  birimGorusu: number;
  birimYanitladi: number;
  /** Üretime alınacak stok paketi (stok ekibi). */
  uretim: number;
  anma: number;
  isler: number;
  posta: number;
  hesapOnayi: number;
  gununNotu: number;
  nextDay?: NextDayPlan;
  /** Next Day'de karar bekleyen PKG (taslak ya da değerlendirmede). */
  nextDayPkg: number;
  weekly?: HaftalikPlan;
  weeklyKarar: number;
}

const kararBekleyenPkg = (p: Paket) => p.durum === "taslak" || p.durum === "degerlendiriliyor";

export function planlamaKararlari(d: Durum, ben: Kisi, b: string = bugun()): PlanlamaKararlari {
  const yarinGun = gunEkle(b, 1);
  let oneri = 0;
  let oneriYakin = 0;
  for (const o of d.oneriler) {
    if (oneriSekmesi(d, o, b) !== "karar") continue;
    oneri++;
    const gun = o.hedefTarih ?? "";
    if (gun && gun <= yarinGun && (o.bitisTarih ?? gun) >= b) oneriYakin++;
  }
  const onayListesi = paketIsaretOnaylayabilir(ben) ? d.paketler.filter((p) => p.isaret && p.durum === "onaylandi" && !p.masaTakibi) : [];
  const sorular = SORU_MASALARI.flatMap((m) => masaninSorulari(d, m));
  const nextDay = calisilanPlan(d, b);
  const hafta = planlananHafta(b);
  const weekly = d.haftalik.find((h) => h.baslangic === hafta) ?? d.haftalik.find((h) => h.baslangic === gunEkle(hafta, -7));
  return {
    oneri,
    oneriYakin,
    esOneri: esCiftleri(d).length,
    eslesmeyenYanit: (d.yanitlar ?? []).filter((y) => y.durum === "eslesmedi").length,
    onay: onayListesi.length,
    onayEnEski: onayListesi.map((p) => p.isaret!.zaman).sort()[0],
    sartli: yapabilir(ben, "paketDegerlendir") ? d.paketler.filter((p) => sartliBekleyen(p) && !p.ozelId).length : 0,
    gorevTalebi: d.paketler.filter((p) => p.gorevTalebi && !p.gorev && p.durum === "taslak" && gorevTalebiKarariVerebilir(ben, p)).length,
    birimGorusu: sorular.filter((s) => !s.cevap).length,
    birimYanitladi: sorular.filter((s) => !!s.cevap).length,
    uretim: d.paketler.filter((p) => uretimeAlabilir(ben, p)).length,
    anma: (d.bahsetmeler ?? []).filter((x) => x.kisiId === ben.id && !x.goruldu).length,
    isler: kisininIsleri(d, ben.id).length,
    posta: okunmamisSayisi(d, ben.id),
    hesapOnayi: hesapYetkisi(ben, "kisiDuzenle") ? d.kisiler.filter((k) => k.kontrolBekliyor && !k.pasif).length : 0,
    gununNotu: gununNotu(d, ben, b).length,
    nextDay,
    nextDayPkg: nextDay ? d.paketler.filter((p) => p.planId === nextDay.id && kararBekleyenPkg(p)).length : 0,
    weekly,
    weeklyKarar: weekly ? kararBekleyenler(weekly).length : 0,
  };
}

/*
 * Menü, alt çubuk ve ana sayfa aynı çizimde aynı sayıları istiyor: kayıt
 * nesnesine bağlı önbellek, kayıt değişince (yeni nesne) kendiliğinden düşer.
 * Bağlam yerine bu: sayıyı isteyen bileşen kabuğa bağımlı kalmasın.
 */
const onbellek = new WeakMap<Durum, Map<string, PlanlamaKararlari>>();
export function kararlariGetir(d: Durum, ben: Kisi, b: string = bugun()): PlanlamaKararlari {
  let m = onbellek.get(d);
  if (!m) onbellek.set(d, (m = new Map()));
  const anahtar = `${ben.id}|${b}`;
  let k = m.get(anahtar);
  if (!k) m.set(anahtar, (k = planlamaKararlari(d, ben, b)));
  return k;
}
