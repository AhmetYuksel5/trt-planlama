import { useEffect } from "react";
import { kisiAdiDilde } from "../dil";
import { PAKET_DURUM_ADI, PLAN_DURUM_ADI } from "../etiketler";
import { metin } from "../dil";
import { baslikBul, haftaBul, kisiBul, paketBul, planBul, yarinPlani, type Durum } from "../veri";

/*
 * Asistanın ekran bilgisi (kullanıcı: asistan ekranı görmüyor, "bunu plana ekle" denince önce
 * arıyor ya da soruyordu). İki kaynak: adres (açık sayfanın kaydı: öneri, paket, plan, hafta,
 * özel yayın, kişi) ve sayfaların kendi bildirdiği o anki seçim (açık öneri penceresi,
 * toplantıda seçili kalem). Model bunu sistem yönergesinde görür; kimlikle birlikte gider ki
 * okuma aracına gerek kalmadan doğru kayda gitsin. Kayda girmez, yalnız istekte.
 */

const kayitlar = new Map<number, string>();
let sayac = 0;

/** Sayfa o an ekranda duran kaydı bildirir; bileşen kapanınca düşer. */
export const useEkranKaydi = (satir: string | undefined) =>
  useEffect(() => {
    if (!satir) return;
    const id = ++sayac;
    kayitlar.set(id, satir);
    return () => {
      kayitlar.delete(id);
    };
  }, [satir]);

const kisa = (x: string | undefined, n = 120) => {
  const s = (x ?? "").replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

export const oneriSatiri = (o: { id: string; haberBasligi: string; paketBasligi?: string }) => `öneri ${o.id} «${kisa(o.paketBasligi || o.haberBasligi)}»`;

/* Adresten açık sayfanın kaydı. */
const adrestenKayit = (d: Durum, hash: string): string => {
  const [sayfa, id, alt] = hash.replace(/^#\/?/, "").split("/");
  if (!sayfa) return "ana sayfa";
  if (sayfa === "oneriler" && id && !["arsiv"].includes(id)) {
    const o = d.oneriler.find((x) => x.id === id);
    return o ? `${oneriSatiri(o)} ayrıntısı` : "";
  }
  if (sayfa === "paketler" && id && !["karar", "gorevli", "arsiv"].includes(id)) {
    const p = paketBul(d, id);
    return p ? `paket ${p.id} «${kisa(p.baslik)}» (${metin(PAKET_DURUM_ADI[p.durum], "tr")})` : "";
  }
  if (sayfa === "nextday") {
    const p = id === "yarin" ? yarinPlani(d) : id ? planBul(d, id) : undefined;
    if (!p) return "Next Day planları listesi";
    const basliklar = p.basliklar.slice(0, 25).map((b) => `${b.id} «${kisa(baslikBul(d, b.baslikId)?.ad, 60)}»`).join(", ");
    return `Next Day planı ${p.id} (${p.tarih}, ${metin(PLAN_DURUM_ADI[p.durum], "tr")}${alt ? `, ${alt} görünümü` : ""}); başlıklar: ${basliklar || "yok"}`;
  }
  if (sayfa === "haftalik") {
    const h = id ? haftaBul(d, id) : undefined;
    return h ? `Weekly ${h.id} (${h.baslangic} haftası, ${h.durum}${alt ? `, ${alt} görünümü` : ""})` : "Weekly listesi";
  }
  if (sayfa === "ozel") {
    const o = id ? d.ozel.find((x) => x.id === id) : undefined;
    return o ? `özel yayın ${o.id} «${kisa(o.ad)}» (${o.tarih}${o.bitis ? ` – ${o.bitis}` : ""})` : "özel yayınlar";
  }
  if ((sayfa === "muhabirler" || sayfa === "personel") && id) {
    const k = kisiBul(d, id);
    return k ? `kişi ${k.id} «${kisiAdiDilde(k.ad, "tr")}» profili` : "";
  }
  return `${sayfa} sayfası`;
};

/** Modele giden ekran özeti: önce adresin kaydı, sonra sayfaların bildirdiği seçimler (en son açılan sonda). */
export const ekranBaglami = (d: Durum, hash = location.hash) =>
  [adrestenKayit(d, hash), ...kayitlar.values()].filter(Boolean).join("\n").slice(0, 2000);
