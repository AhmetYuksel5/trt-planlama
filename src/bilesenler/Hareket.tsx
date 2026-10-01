import { ArrowRight } from "lucide-react";
import { ADIM_ADI, ASAMALAR, ASAMA_ADI, type UretimAdimi } from "../akis";
import { gecenSure, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { yerelGun } from "../tarih";
import { BIRIM_ADI, ONERI_DURUM_ADI } from "../etiketler";
import { kisiBul, oneriBul, paketBul, planBul, type Birim, type Durum, type Hareket, type HareketTipi, type OneriDurum } from "../veri";
import { Avatar, Rozet } from "./Parcalar";

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
};

/* Aynı tip pakette ve planda farklı cümle istiyor: plan devri bir kez, paketin üretime girişi her pakette. */
const sablonSec = (h: Hareket): Anahtar => {
  if (h.tip === "planDevralindi" && h.paketId) return "hrPaketDevralindi";
  if (h.tip === "paketOnaylandi" && h.veri?.toplanti) return "hrPaketToplantidaOnay";
  return SABLON[h.tip];
};

export function useHareketMetni() {
  const { t, y, dil } = useDil();
  return (h: Hareket, d: Durum) => {
    const kisi = kisiBul(d, h.kisiId);
    const muhabir = kisiBul(d, h.veri?.muhabir);
    const degisken = {
      kisi: "\u0000",
      tarih: h.veri?.tarih ? tarihYaz(h.veri.tarih, dil, "kisa") : "",
      kaynak: h.veri?.kaynak ? tarihYaz(h.veri.kaynak, dil, "kisa") : "",
      kod: h.veri?.kod ?? "",
      muhabir: muhabir ? y(muhabir.ad) : "",
      sonuc: h.veri?.sonuc ? t(ONERI_DURUM_ADI[h.veri.sonuc as OneriDurum]) : "",
    };
    const [once, sonra = ""] = t(sablonSec(h), degisken).split("\u0000");
    return { kisi, once, sonra };
  };
}

/** Hareketin hangi kayda ait olduğu: başlık ve bağlantı. */
export function useHareketKonusu() {
  const { y, t, dil } = useDil();
  return (h: Hareket, d: Durum): { metin: string; href: string } | null => {
    const p = paketBul(d, h.paketId);
    if (p) return { metin: `${p.kod} · ${y(p.baslik)}`, href: `#/paketler/${p.id}` };
    const o = oneriBul(d, h.oneriId);
    if (o) return { metin: y(o.haberBasligi), href: `#/oneriler/${o.id}` };
    const plan = planBul(d, h.planId);
    if (plan) return { metin: `${t("nextday")} · ${tarihYaz(plan.tarih, dil, "kisa")}`, href: `#/nextday/${plan.id}` };
    return null;
  };
}

/** Panolardaki kısa akış: kim, ne yaptı, hangi kayıtta, ne zaman. */
export function HareketAkisi({ hareketler, d, konu = true }: { hareketler: Hareket[]; d: Durum; konu?: boolean }) {
  const { dil, y } = useDil();
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
              <b>{m.kisi ? y(m.kisi.ad) : "?"}</b>
              {m.sonra}
              {k && <a href={k.href}>{k.metin}</a>}
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
  const { t, y, dil } = useDil();
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
                <b>{m.kisi ? y(m.kisi.ad) : "?"}</b>
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
              {h.veri?.gerekce && <blockquote>{h.veri.gerekce}</blockquote>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
