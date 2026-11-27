import { saatYaz, tarihYaz, useDil } from "../dil";
import { muhabirDurumu, type MuhabirDurumu } from "../muhabirDurumu";
import { bugun, yerelGun } from "../tarih";
import { getir, paketBul, useVeri, type Paket } from "../veri";
import { birimAdi } from "../yapi";

/* "14:32 itibarıyla"; başka günse günüyle. Süre vaadi yok, yalnız olgu (kullanıcı kararı). */
export const useBeri = () => {
  const { t, dil } = useDil();
  return (z: string) => t("mdBeri", { zaman: yerelGun(z) === bugun() ? saatYaz(z, dil) : `${tarihYaz(yerelGun(z), dil, "kisa")} ${saatYaz(z, dil)}` });
};

/* Kısa satır: Yapılacaklar ve gönderim bildirimi aynı cümleyi kurar. */
export const useDurumSatiri = () => {
  const { t } = useDil();
  const beri = useBeri();
  return (m: MuhabirDurumu) =>
    [m.kimde && birimAdi(m.kimde), m.asama, m.beri && beri(m.beri), m.parca && t("mdParca", { hazir: String(m.parca.hazir), toplam: String(m.parca.toplam) })]
      .filter(Boolean)
      .join(" · ");
};

/*
 * Paket sayfasının başında muhabirin şeridi (kullanıcı: muhabir gönderdikten
 * sonra ne olacağını, işin kimde olduğunu bilmiyordu): sıra sende mi, değilse
 * hangi birimde ve ne zamandan beri, sonra ne var, sıra sana dönünce ne
 * yapacaksın. Kişi adı değil birim adı.
 */
export function MuhabirDurumSeridi({ paket }: { paket: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const satir = useDurumSatiri();
  const m = muhabirDurumu(v, paket);
  if (!m) return null;
  return (
    <section className={`muhabir-durum${m.sende ? " sende" : ""}`} data-muhabir-durum={m.sende ? "sende" : "baska"} aria-live="polite">
      <b>
        {m.sende ? t("mdSende") : t("mdSendeDegil")}
        {m.sende && m.is && m.is !== "is" && ` · ${t(`mdIs_${m.is}`)}`}
      </b>
      {!m.sende && <span>{satir(m)}</span>}
      {m.sende && m.parca && <span className="sonuk">{t("mdParca", { hazir: String(m.parca.hazir), toplam: String(m.parca.toplam) })}</span>}
      {m.sonra.length > 0 && <span className="sonuk">{t("mdSonra", { liste: m.sonra.join(" › ") })}</span>}
      {!m.sende && m.is === "video" && <span className="sonuk">{t("mdDonusVideo")}</span>}
    </section>
  );
}

/*
 * Muhabir gönderdiği an ne olduğunu görsün (kullanıcı: "Adım tamamlandı" bir
 * şey söylemiyordu): "Gönderildi · Şimdi: Newsdesk · Sonra: dil denetimi".
 * Sıra hâlâ muhabirdeyse (başka parça bekleniyor) yapacağı iş.
 */
export const useGonderimBildirimi = () => {
  const { t } = useDil();
  return (paketId: string): string => {
    const d = getir();
    const p = paketBul(d, paketId);
    const m = p && muhabirDurumu(d, p);
    if (!m) return t("bAdimTamam");
    if (m.sende) return `${t("tkGitti")} · ${t("mdSende")}${m.is && m.is !== "is" ? `: ${t(`mdIs_${m.is}`)}` : ""}`;
    const kimde = [m.kimde && birimAdi(m.kimde), m.asama].filter(Boolean).join(" · ");
    const sonra = [...m.sonra, ...(m.is === "video" ? [t("mdIs_video")] : [])].join(" › ") || "—";
    return t("mdGonderildi", { kimde: kimde || "—", sonra });
  };
};
