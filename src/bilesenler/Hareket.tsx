import { ArrowRight } from "lucide-react";
import { ADIM_ADI, ASAMALAR, ASAMA_ADI, type UretimAdimi } from "../akis";
import { aralikYaz, gecenSure, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { haftaSonu, kalemAdi } from "../haftalik";
import { yerelGun } from "../tarih";
import { BIRIM_ADI, ONERI_DURUM_ADI } from "../etiketler";
import { haftaBul, kisiBul, oneriBul, paketBul, planBul, type Birim, type Durum, type Hareket, type HareketTipi, type OneriDurum } from "../veri";
import { Avatar, Icerik, Rozet } from "./Parcalar";

/**
 * Hareket kaydının ekrandaki hali.
 *
 * Kayıt metin saklamıyor; tipi ve verisi dil tablosundaki şablondan
 * cümleye dönüyor. Böylece aynı geçmiş üç dilde de okunuyor ve sonradan
 * bir sözcük değişirse eski kayıtlar da yeni sözcükle görünüyor.
 */

const SABLON: Record<HareketTipi, Anahtar> = {
  cagriHazirlandi: "hrCagri",
  oneriGeldi: "hrOneriGeldi",
  oneriDegerlendirmede: "hrOneriDegerlendirmede",
  oneriPlanaEklendi: "hrOneriPlanaEklendi",
  oneriReddedildi: "hrOneriReddedildi",
  oneriSonra: "hrOneriSonra",
  geriDonus: "hrGeriDonus",
  planOlusturuldu: "hrPlanOlusturuldu",
  planKopyalandi: "hrPlanKopyalandi",
  planToplantida: "hrPlanToplantida",
  planTaslaga: "hrPlanTaslaga",
  planOnaylandi: "hrPlanOnaylandi",
  planDevralindi: "hrPlanDevralindi",
  paketOlusturuldu: "hrPaketOlusturuldu",
  paketDegerlendirmede: "hrPaketDegerlendirmede",
  paketOnaylandi: "hrPaketOnaylandi",
  paketIptal: "hrPaketIptal",
  gorevlendirildi: "hrGorevlendirildi",
  gorevVerildi: "hrGorevVerildi",
  metinGeldi: "hrMetinGeldi",
  kontrolEdildi: "hrKontrolEdildi",
  geriGonderildi: "hrGeriGonderildi",
  sonScript: "hrSonScript",
  videoGeldi: "hrVideoGeldi",
  mediayaGonderildi: "hrMediayaGonderildi",
  klipKodu: "hrKlipKodu",
  tamamlandi: "hrTamamlandi",
  notEklendi: "hrNotEklendi",
  nitelikPuanlandi: "hrNitelik",
  yanitOneriYok: "hrYanitOneriYok",
  oneriDuzenlendi: "hrOneriDuzenlendi",
  profilGuncellendi: "hrProfil",
  talimatVerildi: "hrTalimat",
  paketOncelikli: "hrOncelikli",
  paketOncelikKalkti: "hrOncelikKalkti",
  yoneticiNotu: "hrYoneticiNotu",
  haftalikOlusturuldu: "hrHaftalikOlusturuldu",
  haftalikToplantida: "hrHaftalikToplantida",
  haftalikHazirliga: "hrHaftalikHazirliga",
  haftalikKesinlesti: "hrHaftalikKesinlesti",
  onIncelemeyeGonderildi: "hrOnIncelemeyeGonderildi",
  onIncelemeGorusu: "hrOnIncelemeGorusu",
  onIncelemedeReddedildi: "hrOnIncelemedeReddedildi",
  haftaliktanAktarildi: "hrHaftaliktanAktarildi",
};

/* Aynı tip pakette ve planda farklı cümle istiyor: plan devri bir kez, paketin üretime girişi her pakette. */
const sablonSec = (h: Hareket): Anahtar => {
  if (h.tip === "planDevralindi" && h.paketId) return "hrPaketDevralindi";
  if (h.tip === "paketOnaylandi" && h.veri?.toplanti) return "hrPaketToplantidaOnay";
  if (h.tip === "paketOnaylandi" && h.veri?.hafta) return "hrPaketHaftalikOnay";
  if (h.tip === "cagriHazirlandi" && h.veri?.hafta) return "hrHaftalikCagri";
  return SABLON[h.tip];
};

export function useHareketMetni() {
  const { t, ad, dil } = useDil();
  return (h: Hareket, d: Durum) => {
    const kisi = kisiBul(d, h.kisiId);
    const muhabir = kisiBul(d, h.veri?.muhabir);
    const degisken = {
      kisi: "\u0000",
      tarih: h.veri?.tarih ? tarihYaz(h.veri.tarih, dil, "kisa") : "",
      kaynak: h.veri?.kaynak ? tarihYaz(h.veri.kaynak, dil, "kisa") : "",
      kod: h.veri?.kod ?? "",
      muhabir: ad(muhabir),
      sonuc: h.veri?.sonuc ? t(ONERI_DURUM_ADI[h.veri.sonuc as OneriDurum]) : "",
      puan: h.veri?.puan ?? "",
    };
    const [once, sonra = ""] = t(sablonSec(h), degisken).split("\u0000");
    return { kisi, once, sonra };
  };
}

/*
 * Hareketin hangi kayda ait olduğu. Kod ve plan adı arayüzün, başlık
 * içeriğin parçası: ayrı tutuluyor ki başlık arayüz cümlesinin içinde de
 * kendi yönünde (sağdan sola) aksın.
 */
export interface Konu {
  href: string;
  kod?: string;
  baslik?: string;
  metin?: string;
}

export function useHareketKonusu() {
  const { t, dil } = useDil();
  return (h: Hareket, d: Durum): Konu | null => {
    const p = paketBul(d, h.paketId);
    if (p) return { kod: p.kod, baslik: p.baslik, href: `#/paketler/${p.id}` };
    const o = oneriBul(d, h.oneriId);
    if (o) return { baslik: o.haberBasligi, href: `#/oneriler/${o.id}` };
    const hafta = haftaBul(d, h.haftaId);
    const kalem = hafta?.kalemler.find((k) => k.id === h.veri?.kalem);
    if (hafta && kalem) return { baslik: kalemAdi(kalem), href: `#/haftalik/${hafta.id}` };
    const plan = planBul(d, h.planId);
    if (plan) return { metin: `${t("nextday")} · ${tarihYaz(plan.tarih, dil, "kisa")}`, href: `#/nextday/${plan.id}` };
    if (hafta) return { metin: `${t("haftalik")} · ${aralikYaz(hafta.baslangic, haftaSonu(hafta.baslangic), dil)}`, href: `#/haftalik/${hafta.id}` };
    return null;
  };
}

export function KonuMetni({ k }: { k: Konu }) {
  return (
    <>
      {k.kod && `${k.kod} · `}
      {k.baslik !== undefined ? <Icerik>{k.baslik}</Icerik> : k.metin}
    </>
  );
}

/** Panolardaki kısa akış: kim, ne yaptı, hangi kayıtta, ne zaman. */
export function HareketAkisi({ hareketler, d, konu = true }: { hareketler: Hareket[]; d: Durum; konu?: boolean }) {
  const { dil, ad } = useDil();
  const metni = useHareketMetni();
  const konusu = useHareketKonusu();
  return (
    <ul className="akis">
      {hareketler.map((h) => {
        const m = metni(h, d);
        const k = konu ? konusu(h, d) : null;
        return (
          <li key={h.id}>
            <Avatar kisi={m.kisi} boy="kucuk" />
            <div className="metin">
              {m.once}
              <b>{m.kisi ? ad(m.kisi) : "?"}</b>
              {m.sonra}
              {k && (
                <a href={k.href}>
                  <KonuMetni k={k} />
                </a>
              )}
            </div>
            <time dateTime={h.zaman}>{gecenSure(h.zaman, dil)}</time>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Kaydın tam geçmişi: ne zaman, kim, hangi birimden, işi kime bıraktı,
 * paket hangi aşamaya geçti. Rapor bölüm 7'deki "haber nerede bekliyor,
 * en son kim işlem yaptı, hangi birimden hangisine devredildi" soruları.
 */
export function HareketGecmisi({ hareketler, d }: { hareketler: Hareket[]; d: Durum }) {
  const { t, ad, dil } = useDil();
  const metni = useHareketMetni();
  const sirali = [...hareketler].sort((a, b) => a.zaman.localeCompare(b.zaman));
  return (
    <ol className="gecmis">
      {sirali.map((h) => {
        const m = metni(h, d);
        const sahip = h.veri?.sahip as Birim | undefined;
        const adim = h.veri?.adim as UretimAdimi | "tamam" | "metin" | undefined;
        const nokta = h.tip === "geriGonderildi" || h.tip === "oneriReddedildi" || h.tip === "paketIptal" ? "geri" : h.tip === "tamamlandi" ? "tamam" : "";
        return (
          <li key={h.id}>
            <time dateTime={h.zaman}>
              <b>{saatYaz(h.zaman, dil)}</b>
              {tarihYaz(yerelGun(h.zaman), dil, "kisa")}
            </time>
            <span className="cizgi-kol">
              <i className={nokta} />
            </span>
            <div className="olay">
              <p>
                {m.once}
                <b>{m.kisi ? ad(m.kisi) : "?"}</b>
                {m.sonra}
              </p>
              <small>
                {m.kisi && <span>{t(BIRIM_ADI[m.kisi.birim])}</span>}
                {sahip && m.kisi && sahip !== m.kisi.birim && (
                  <>
                    <ArrowRight size={12} className="yon" />
                    <span>{t(BIRIM_ADI[sahip])}</span>
                  </>
                )}
                {adim && adim !== "tamam" && adim in ADIM_ADI && <Rozet ton="vurgu">{t(ADIM_ADI[adim as UretimAdimi])}</Rozet>}
                {adim === "tamam" && <Rozet ton="iyi">{t(ASAMA_ADI[ASAMALAR[4]])}</Rozet>}
              </small>
              {h.veri?.gerekce && <blockquote dir="auto">{h.veri.gerekce}</blockquote>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
