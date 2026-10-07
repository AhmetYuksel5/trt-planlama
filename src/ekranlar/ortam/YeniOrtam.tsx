import { LayoutPanelLeft, X } from "lucide-react";
import { useState } from "react";
import { Bos } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { ortamOlustur } from "../../eylemler";
import { BOLME_EN_COK, ORTAM_EN_COK, bolmeyeGirer, kisininOrtamlari, varsayilanDuzen } from "../../ortam";
import { ORTAM_DUZENLERI, useVeri, type Kisi, type OrtamDuzeni } from "../../veri";
import { yerineGit } from "../../yol";
import { onSecimiAl } from "./gorunum";
import { kisayolBilgisi } from "./Kisayollar";
import { ModulIzgarasi } from "./ModulIzgarasi";
import { DUZEN_ADI, DUZEN_SIMGESI } from "./Sekmeler";

/**
 * Yeni workspace: tarayıcının yeni sekme sayfası gibi içerikte bir sayfa
 * (`#/ortam/yeni`), pencere değil. Birlikte açılacak sayfalar sırayla
 * seçiliyor, "Aç" ile workspace o sayfalarla bir kerede kuruluyor.
 * Eskiden boş workspace açılıp modüller tek tek ekleniyordu; "workspace
 * aç" ile "modül ekle" yan yana durup karışıyordu. Boş workspace yok.
 *
 * "+"ya basılan sayfa (ana sayfa değilse) ilk sırada seçili geliyor
 * (gorunum.ts → onSecimiAl): "bu sayfayı bir şeyle yan yana aç".
 */
export default function YeniOrtam({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [secili, setSecili] = useState<string[]>(() => {
    const y = onSecimiAl();
    return y && bolmeyeGirer(ben, y) ? [y] : [];
  });
  // Kişi seçmedikçe yerleşim sayfa sayısına göre öneriliyor (dördü ızgara).
  const [secilenDuzen, setSecilenDuzen] = useState<OrtamDuzeni | null>(null);
  const duzen = secilenDuzen ?? varsayilanDuzen(secili.length);
  const dolu = secili.length >= BOLME_EN_COK;
  const adi = (yol: string) => {
    const b = kisayolBilgisi(ben, yol);
    return b ? t(b.ad) : yol;
  };

  if (kisininOrtamlari(v, ben.id).length >= ORTAM_EN_COK)
    return (
      <>
        <h1 className="gizli-metin">{t("yeniOrtam")}</h1>
        <Bos metin={t("ortamSiniri", { n: ORTAM_EN_COK })} ikon={<LayoutPanelLeft size={28} />} />
      </>
    );

  const sec = (yol: string) => setSecili((s) => (s.includes(yol) ? s.filter((x) => x !== yol) : s.length >= BOLME_EN_COK ? s : [...s, yol]));
  const ac = () => {
    if (!secili.length) return;
    const id = ortamOlustur(ben, secili, duzen);
    if (id) yerineGit(`ortam/${id}`);
  };

  return (
    <div className="yeni-ortam-sayfasi">
      <header className="yeni-ortam-bas">
        <h1>{t("yeniOrtam")}</h1>
        <p>{t("yeniOrtamAlt", { n: BOLME_EN_COK })}</p>
      </header>
      <ModulIzgarasi ben={ben} sec={sec} secili={secili} dolu={dolu} dolulukNedeni={t("secimSiniri", { n: BOLME_EN_COK })} />
      <div className="secim-tepsisi" role="region" aria-label={t("secilenler")}>
        <div className="secim-cipleri">
          <span className="alan-etiket">{t("secilenler")}</span>
          {secili.length === 0 ? (
            <span className="bos-kucuk">{t("acPasif")}</span>
          ) : (
            secili.map((y, i) => (
              <span key={y} className="secilen-cip" data-secilen={y}>
                <span className="sira-rozet" aria-hidden="true">
                  {i + 1}
                </span>
                {adi(y)}
                <button type="button" aria-label={t("secimiKaldir", { ad: adi(y) })} title={t("secimiKaldir", { ad: adi(y) })} onClick={() => sec(y)}>
                  <X size={13} />
                </button>
              </span>
            ))
          )}
          {dolu && <span className="bos-kucuk">{t("secimSiniri", { n: BOLME_EN_COK })}</span>}
        </div>
        {/* Telefonda workspace hep sekmeli; yerleşim seçimi orada anlamsız. */}
        <div className="gorunum-secici mobilde-gizli" role="group" aria-label={t("duzen")}>
          {ORTAM_DUZENLERI.map((d) => {
            const Ikon = DUZEN_SIMGESI[d];
            return (
              <button
                key={d}
                type="button"
                className={`dugme dugme-sade dugme-kucuk ${duzen === d ? "secili" : ""}`}
                aria-pressed={duzen === d}
                data-duzen={d}
                title={t(DUZEN_ADI[d])}
                onClick={() => setSecilenDuzen(d)}
              >
                <Ikon size={15} /> <span className="duzen-adi">{t(DUZEN_ADI[d])}</span>
              </button>
            );
          })}
        </div>
        {/* Pasif düğme ipucu göstermiyor; seçim yokken odaklanabilir kalıyor, nedeni ipucunda ve solda yazılı. */}
        <button type="button" className={`dugme ${secili.length ? "" : "pasif"}`} aria-disabled={!secili.length} title={secili.length ? undefined : t("acPasif")} data-ortam-ac onClick={ac}>
          {t("ac")}
        </button>
      </div>
    </div>
  );
}
