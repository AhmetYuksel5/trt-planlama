import { ChevronRight } from "lucide-react";
import { geciktiMi, paketSahibi } from "../akis";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { BICIM_ADI, BIRIM_ADI, KANAL_ADI, ONERI_DURUM_ADI, ONERI_DURUM_TONU, sehirAdi, ulkeAdi } from "../etiketler";
import { bugun, yerelGun } from "../tarih";
import { git } from "../yol";
import { kisiBul, type Durum, type Oneri, type Paket } from "../veri";
import { AsamaCubugu, Bos, Icerik, KisiHucre, OncelikRozeti, PaketDurumRozeti, Rozet, TalimatRozeti, TurRozeti, oncelikliOnce } from "./Parcalar";

/*
 * Paket ve öneri tabloları: birçok ekran aynı sütunlarla gösteriyor, tek
 * yerde dursun. Yöneticinin öncelikli işaretlediği paket her tabloda başta.
 */

export function PaketTablosu({
  paketler,
  d,
  bosMetin,
  sutunlar = ["kod", "baslik", "muhabir", "tur", "asama", "kimde", "teslim"],
}: {
  paketler: Paket[];
  d: Durum;
  bosMetin?: string;
  sutunlar?: ("kod" | "baslik" | "muhabir" | "tur" | "asama" | "kimde" | "teslim" | "plan")[];
}) {
  const { t, dil } = useDil();
  if (!paketler.length) return <Bos metin={bosMetin ?? t("kayitYok")} />;
  const var_ = (s: (typeof sutunlar)[number]) => sutunlar.includes(s);
  return (
    <div className="tablo-sar">
      <table className="tablo kartli">
        <thead>
          <tr>
            {var_("kod") && <th>{t("kod")}</th>}
            {var_("baslik") && <th className="icerik-sutun">{t("paketBasligi")}</th>}
            {var_("muhabir") && <th>{t("muhabir")}</th>}
            {var_("tur") && <th>{t("tur")}</th>}
            {var_("plan") && <th>{t("plan")}</th>}
            {var_("asama") && <th>{t("asama")}</th>}
            {var_("kimde") && <th>{t("simdiKimde")}</th>}
            {var_("teslim") && <th>{t("teslim")}</th>}
            <th className="dar" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {[...paketler].sort(oncelikliOnce).map((p) => {
            const sahip = paketSahibi(p);
            const muhabir = kisiBul(d, p.muhabirId);
            const plan = d.planlar.find((x) => x.id === p.planId);
            return (
              <tr key={p.id} className="tiklanir" onClick={() => git(`paketler/${p.id}`)}>
                {var_("kod") && (
                  <td className="sonuk dar" data-etiket={t("kod")}>
                    {p.kod}
                  </td>
                )}
                {var_("baslik") && (
                  <td className="birincil icerik-sutun">
                    <a className="kalin" href={`#/paketler/${p.id}`} onClick={(e) => e.stopPropagation()}>
                      <Icerik blok>{p.baslik}</Icerik>
                    </a>
                    <small className="sonuk">
                      {p.oncelikli && <OncelikRozeti />} {t(sehirAdi(p.sehir))}
                      {p.bicim && ` · ${t(BICIM_ADI(p.bicim))}`}
                    </small>
                  </td>
                )}
                {var_("muhabir") && (
                  <td data-etiket={t("muhabir")}>
                    <KisiHucre kisi={muhabir} />
                  </td>
                )}
                {var_("tur") && (
                  <td data-etiket={t("tur")}>
                    <TurRozeti tur={p.tur} />
                  </td>
                )}
                {var_("plan") && (
                  <td className="sonuk" data-etiket={t("plan")}>
                    {/* Plan kaydı olmayan tamamlanmış iş (arşiv) yayın tarihiyle; olmayan açık iş haftalık plandan. */}
                    {plan ? tarihYaz(plan.tarih, dil, "kisa") : p.durum === "tamamlandi" && p.yayin ? tarihYaz(yerelGun(p.yayin), dil, "kisa") : t("haftalikKaynak")}
                  </td>
                )}
                {var_("asama") && (
                  <td data-etiket={t("asama")}>
                    <AsamaCubugu paket={p} />
                    <div className="ara-ust">
                      <PaketDurumRozeti paket={p} />
                    </div>
                  </td>
                )}
                {var_("kimde") && <td data-etiket={t("simdiKimde")}>{sahip ? t(BIRIM_ADI[sahip]) : "—"}</td>}
                {var_("teslim") && (
                  <td className="dar" data-etiket={t("teslim")}>
                    {p.teslim ? (
                      <Rozet ton={geciktiMi(p) ? "kotu" : ""}>
                        {tarihYaz(yerelGun(p.teslim), dil, "kisa")} {saatYaz(p.teslim, dil)}
                      </Rozet>
                    ) : (
                      <span className="sonuk">—</span>
                    )}
                  </td>
                )}
                <td className="dar sonuk ok-hucre">
                  <ChevronRight size={16} className="yon" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OneriDurumRozeti({ oneri }: { oneri: Oneri }) {
  const { t } = useDil();
  return <Rozet ton={ONERI_DURUM_TONU[oneri.durum]}>{t(ONERI_DURUM_ADI[oneri.durum])}</Rozet>;
}

export function OneriTablosu({ oneriler, d, kisa = false }: { oneriler: Oneri[]; d: Durum; kisa?: boolean }) {
  const { t, dil } = useDil();
  if (!oneriler.length) return <Bos metin={t("oneriYok")} />;
  return (
    <div className="tablo-sar">
      <table className="tablo kartli">
        <thead>
          <tr>
            <th>{t("zaman")}</th>
            <th>{t("muhabir")}</th>
            <th className="icerik-sutun">{t("haberBasligi")}</th>
            {!kisa && <th>{t("tur")}</th>}
            <th>{t("ulke")}</th>
            {!kisa && <th>{t("kanal")}</th>}
            <th>{t("durum")}</th>
            <th className="dar" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {oneriler.map((o) => (
            <tr key={o.id} className="tiklanir" onClick={() => git(`oneriler/${o.id}`)}>
              <td className="sonuk dar" data-etiket={t("zaman")}>
                {kisa && yerelGun(o.zaman) === bugun() ? "" : `${tarihYaz(yerelGun(o.zaman), dil, "kisa")} `}
                {saatYaz(o.zaman, dil)}
              </td>
              <td data-etiket={t("muhabir")}>
                {o.talimatVeren ? <TalimatRozeti veren={kisiBul(d, o.talimatVeren)} /> : <KisiHucre kisi={kisiBul(d, o.muhabirId)} />}
              </td>
              <td className="birincil icerik-sutun">
                <a className="kalin" href={`#/oneriler/${o.id}`} onClick={(e) => e.stopPropagation()}>
                  <Icerik blok>{o.haberBasligi}</Icerik>
                </a>
                {o.paketBasligi && !kisa && (
                  <small className="sonuk">
                    PKG · <Icerik>{o.paketBasligi}</Icerik>
                  </small>
                )}
              </td>
              {!kisa && (
                <td data-etiket={t("tur")}>
                  <TurRozeti tur={o.tur} />
                </td>
              )}
              <td data-etiket={t("ulke")}>{t(ulkeAdi(o.ulke))}</td>
              {!kisa && (
                <td className="sonuk" data-etiket={t("kanal")}>
                  {t(KANAL_ADI[o.kanal])}
                </td>
              )}
              <td data-etiket={t("durum")}>
                <OneriDurumRozeti oneri={o} />
              </td>
              <td className="dar sonuk ok-hucre">
                <ChevronRight size={16} className="yon" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Muhabirin şehri: çıktıda "ŞEHİR / ad" satırının ilk yarısı. */
export const useSehir = () => {
  const { t } = useDil();
  return (d: Durum, kisiId?: string) => {
    const k = kisiBul(d, kisiId);
    return k ? t(sehirAdi(k.sehir)) : "";
  };
};
