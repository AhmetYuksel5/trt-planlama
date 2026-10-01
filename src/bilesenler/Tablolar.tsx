import { ChevronRight } from "lucide-react";
import { geciktiMi, paketSahibi } from "../akis";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { BIRIM_ADI, KANAL_ADI, ONERI_DURUM_ADI, ONERI_DURUM_TONU, sehirAdi, ulkeAdi } from "../etiketler";
import { bugun, yerelGun } from "../tarih";
import { git } from "../yol";
import { kisiBul, type Durum, type Oneri, type Paket } from "../veri";
import { AsamaCubugu, Bos, KisiHucre, PaketDurumRozeti, Rozet, TurRozeti } from "./Parcalar";

/* Paket ve öneri tabloları: birçok ekran aynı sütunlarla gösteriyor, tek yerde dursun. */

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
  const { t, y, dil } = useDil();
  if (!paketler.length) return <Bos metin={bosMetin ?? t("kayitYok")} />;
  const var_ = (s: (typeof sutunlar)[number]) => sutunlar.includes(s);
  return (
    <div className="tablo-sar">
      <table className="tablo">
        <thead>
          <tr>
            {var_("kod") && <th>{t("kod")}</th>}
            {var_("baslik") && <th>{t("paketBasligi")}</th>}
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
          {paketler.map((p) => {
            const sahip = paketSahibi(p);
            const muhabir = kisiBul(d, p.muhabirId);
            const plan = d.planlar.find((x) => x.id === p.planId);
            return (
              <tr key={p.id} className="tiklanir" onClick={() => git(`paketler/${p.id}`)}>
                {var_("kod") && <td className="sonuk dar">{p.kod}</td>}
                {var_("baslik") && (
                  <td>
                    <a className="kalin" href={`#/paketler/${p.id}`} onClick={(e) => e.stopPropagation()}>
                      {y(p.baslik)}
                    </a>
                    <br />
                    <small className="sonuk">{t(sehirAdi(p.sehir))}</small>
                  </td>
                )}
                {var_("muhabir") && (
                  <td>
                    <KisiHucre kisi={muhabir} />
                  </td>
                )}
                {var_("tur") && (
                  <td>
                    <TurRozeti tur={p.tur} />
                  </td>
                )}
                {var_("plan") && <td className="sonuk">{plan ? tarihYaz(plan.tarih, dil, "kisa") : t("haftalikKaynak")}</td>}
                {var_("asama") && (
                  <td>
                    <AsamaCubugu paket={p} />
                    <div className="ara-ust">
                      <PaketDurumRozeti paket={p} />
                    </div>
                  </td>
                )}
                {var_("kimde") && <td>{sahip ? t(BIRIM_ADI[sahip]) : "—"}</td>}
                {var_("teslim") && (
                  <td className="dar">
                    {p.teslim ? (
                      <Rozet ton={geciktiMi(p) ? "kotu" : ""}>
                        {tarihYaz(yerelGun(p.teslim), dil, "kisa")} {saatYaz(p.teslim, dil)}
                      </Rozet>
                    ) : (
                      <span className="sonuk">—</span>
                    )}
                  </td>
                )}
                <td className="dar sonuk">
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
  const { t, y, dil } = useDil();
  if (!oneriler.length) return <Bos metin={t("oneriYok")} />;
  return (
    <div className="tablo-sar">
      <table className="tablo">
        <thead>
          <tr>
            <th>{t("zaman")}</th>
            <th>{t("muhabir")}</th>
            <th>{t("haberBasligi")}</th>
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
              <td className="sonuk dar">
                {kisa && yerelGun(o.zaman) === bugun() ? "" : `${tarihYaz(yerelGun(o.zaman), dil, "kisa")} `}
                {saatYaz(o.zaman, dil)}
              </td>
              <td>
                <KisiHucre kisi={kisiBul(d, o.muhabirId)} />
              </td>
              <td>
                <a className="kalin" href={`#/oneriler/${o.id}`} onClick={(e) => e.stopPropagation()}>
                  {y(o.haberBasligi)}
                </a>
                {o.paketBasligi && !kisa && (
                  <>
                    <br />
                    <small className="sonuk">PKG · {y(o.paketBasligi)}</small>
                  </>
                )}
              </td>
              {!kisa && (
                <td>
                  <TurRozeti tur={o.tur} />
                </td>
              )}
              <td>{t(ulkeAdi(o.ulke))}</td>
              {!kisa && <td className="sonuk">{t(KANAL_ADI[o.kanal])}</td>}
              <td>
                <OneriDurumRozeti oneri={o} />
              </td>
              <td className="dar sonuk">
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
