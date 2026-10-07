import { House, LayoutPanelLeft, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useDil } from "../../dil";
import { ortamOlustur } from "../../eylemler";
import { ORTAM_EN_COK, kisininOrtamlari } from "../../ortam";
import { useVeri, type Kisi, type Ortam } from "../../veri";
import { git } from "../../yol";
import { KisayolSeridi } from "./Kisayollar";

/** Workspace'in adı: verilmemişse sıra numarasıyla. */
export function useOrtamAdi() {
  const { t } = useDil();
  return (o: Ortam) => o.ad ?? t("ortamAdi", { n: o.no });
}

/**
 * Ana sayfanın ve workspace'in tek üst şeridi. Sayfanın kullanılır alanı
 * olabildiğince geniş kalsın diye her şey ikon, ad üzerine gelince:
 *
 * - başta ana sayfa, kişinin workspace'leri (sıra numarasıyla) ve yenisi;
 * - ortada açık sayfanın işleri (`ek`): ana sayfada "Sayfayı düzenle",
 *   workspace'te yerleşim, modül ekleme ve workspace işlemleri;
 * - sonda kişinin kısayolları.
 *
 * Eskiden sekme şeridi, araç satırı ve plan kutucukları ayrı satırlardı.
 */
export function AnaSerit({ ben, acik, ek }: { ben: Kisi; acik?: string; ek?: ReactNode }) {
  const { t } = useDil();
  const v = useVeri();
  const adi = useOrtamAdi();
  const liste = kisininOrtamlari(v, ben.id);
  const dolu = liste.length >= ORTAM_EN_COK;
  const anaAdi = t(ben.birim === "muhabir" ? "mIslerim" : "mAna");
  // Pasif düğme ipucu göstermiyor; sınırda düğme odaklanabilir kalıyor, nedeni ipucunda.
  const yeniAdi = dolu ? t("ortamSiniri", { n: ORTAM_EN_COK }) : t("yeniOrtam");
  const yeni = () => {
    if (dolu) return;
    const id = ortamOlustur(ben);
    if (id) git(`ortam/${id}`);
  };
  const secili = (evet: boolean) => (evet ? { "aria-current": "page" as const } : {});
  return (
    <div className="ana-serit">
      <nav className="serit-grup" aria-label={t("ortamSekmeleri")}>
        <a href="#/" className={`serit-dugme ${!acik ? "acik" : ""}`} aria-label={anaAdi} title={anaAdi} {...secili(!acik)}>
          <House size={18} />
        </a>
        {liste.map((o, i) => (
          <a
            key={o.id}
            href={`#/ortam/${o.id}`}
            data-ortam={o.id}
            className={`serit-dugme ortam-dugmesi ${acik === o.id ? "acik" : ""}`}
            aria-label={adi(o)}
            title={adi(o)}
            {...secili(acik === o.id)}
          >
            <LayoutPanelLeft size={16} />
            <span className="sira" aria-hidden="true">
              {i + 1}
            </span>
          </a>
        ))}
        <button type="button" className={`serit-dugme yeni-ortam ${dolu ? "pasif" : ""}`} onClick={yeni} aria-disabled={dolu} aria-label={yeniAdi} title={yeniAdi}>
          <Plus size={18} />
        </button>
      </nav>
      {ek && (
        <>
          <span className="serit-ayrac" aria-hidden="true" />
          <div className="serit-grup">{ek}</div>
        </>
      )}
      <KisayolSeridi ben={ben} />
    </div>
  );
}
