import { gecenSure, useDil, type Anahtar } from "../dil";
import { oneriYolu, type YolAdimi } from "../oneriYolu";
import { useBen } from "../oturum";
import { useYeniTasarim } from "../tasarimSecimi";
import type { Durum, Oneri } from "../veri";
import { birimAdi } from "../yapi";
import { kisitliKisi } from "../yetki";
import { baslikaGit } from "./baslikaGit";
import { KisiCipi } from "./KisiCipi";

/*
 * Önerinin yolu ekranda (kurallar oneriYolu.ts). Kartta etiketsiz ince şerit
 * (taramak için; adım ve kimde ipucunda), pencerede adlı çizgi ve "kimde ·
 * ne zamandan beri" satırı. Pencerede plan adımı başlığa, PKG ve sonuç
 * paketin sayfasına götürür. Yalnız yeni tasarımda ve kısıtlı olmayan kişide:
 * muhabir planı okuyamıyor, kendi ekranında aşamaları zaten görüyor.
 */

const ADIM_ADI: Record<YolAdimi, Anahtar> = {
  geldi: "oyGeldi",
  degerlendirme: "oyDegerlendirme",
  plan: "oyPlan",
  pkg: "oyPkg",
  muhabir: "oyMuhabirde",
  sonuc: "oySonuc",
};

/** Yolun şimdiki adımının adı (muhabir dosyası, özet satırları). */
export const yolAdimAnahtari = (y: ReturnType<typeof oneriYolu>): Anahtar => {
  const a = y.adimlar.find((x) => x.durum === "simdi")?.adim;
  if (!a) return y.bitti ? "oyBitti" : "oyGeldi";
  return a === "plan" && y.gundem ? "oyGundem" : ADIM_ADI[a];
};

export function OneriYolu({ oneri: o, d, ince = false, kapat }: { oneri: Oneri; d: Durum; ince?: boolean; kapat?: () => void }) {
  const { t, dil, ad } = useDil();
  const ben = useBen();
  const yeni = useYeniTasarim();
  if (!yeni || !ben || kisitliKisi(ben)) return null;
  const y = oneriYolu(d, o);
  const adi = (a: YolAdimi) => t(a === "plan" && y.gundem ? "oyGundem" : ADIM_ADI[a]);
  const simdi = y.adimlar.find((a) => a.durum === "simdi");
  const kimKisi = y.kimde?.kisiId ? d.kisiler.find((k) => k.id === y.kimde!.kisiId) : undefined;
  const kimAdi = kimKisi ? ad(kimKisi) : y.kimde?.birim ? birimAdi(y.kimde.birim) : "";
  const sure = gecenSure(y.beri, dil);

  if (ince) {
    const ozet = [simdi ? adi(simdi.adim) : t(y.bitti ? "oyBitti" : "oyGeldi"), kimAdi, sure].filter(Boolean).join(" · ");
    return (
      <span className="oy-serit" data-oneri-yolu="ince" data-yol-simdi={simdi?.adim ?? ""} title={ozet} aria-label={`${t("oyBaslik")}: ${ozet}`} role="img">
        {y.adimlar.map((a) => (
          <i key={a.adim} className={`oy-${a.durum}`} />
        ))}
      </span>
    );
  }

  const git = (a: YolAdimi): (() => void) | undefined => {
    if (a === "plan" && y.plan) return () => (kapat?.(), baslikaGit(y.plan!.id, y.planBaslikId));
    if (a === "plan" && y.hafta) return () => (kapat?.(), (location.hash = `#/haftalik/${y.hafta}`));
    if ((a === "pkg" || a === "sonuc") && y.paket) return () => (kapat?.(), (location.hash = `#/paketler/${y.paket!.id}`));
    return undefined;
  };
  return (
    <div className="oneri-yolu" data-oneri-yolu="tam" data-yol-simdi={simdi?.adim ?? ""}>
      <ol aria-label={t("oyBaslik")}>
        {y.adimlar.map((a) => {
          const f = git(a.adim);
          return (
            <li key={a.adim} className={`oy-${a.durum}`} data-yol-adim={a.adim} data-yol-durum={a.durum} aria-current={a.durum === "simdi" ? "step" : undefined}>
              {f ? (
                <button type="button" className="oy-bag" onClick={f} data-yol-git={a.adim}>
                  {adi(a.adim)}
                </button>
              ) : (
                <span>{adi(a.adim)}</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="oy-kimde sonuk" data-yol-kimde>
        {y.bitti ? (
          <>{t("oyBitti")} · {sure}</>
        ) : kimKisi ? (
          <>
            {t("oyKimde")} <KisiCipi ben={ben} kisi={kimKisi} konu={o.paketBasligi || o.haberBasligi} /> · {sure}
          </>
        ) : (
          <>
            {t("oyKimde")} <b>{kimAdi || "—"}</b> · {sure}
          </>
        )}
      </div>
    </div>
  );
}
