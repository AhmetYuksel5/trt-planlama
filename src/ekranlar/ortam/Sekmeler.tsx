import { House, LayoutPanelLeft, Plus } from "lucide-react";
import { useDil } from "../../dil";
import { ortamOlustur } from "../../eylemler";
import { ORTAM_EN_COK, kisininOrtamlari } from "../../ortam";
import { useVeri, type Kisi, type Ortam } from "../../veri";
import { git } from "../../yol";

/** Workspace'in görünen adı: verilmemişse sıra numarasıyla. */
export function useOrtamAdi() {
  const { t } = useDil();
  return (o: Ortam) => o.ad ?? t("ortamAdi", { n: o.no });
}

/**
 * Ana sayfanın üstündeki sekmeler: ana sayfa, kişinin workspace'leri ve
 * yenisi. Workspace ana sayfanın yanında duruyor, menüde ayrı madde değil;
 * kişi günün işini ana sayfadan, birlikte açtığı sayfaları buradan sürüyor.
 */
export function OrtamSekmeleri({ ben, acik }: { ben: Kisi; acik?: string }) {
  const { t } = useDil();
  const v = useVeri();
  const adi = useOrtamAdi();
  const liste = kisininOrtamlari(v, ben.id);
  const dolu = liste.length >= ORTAM_EN_COK;
  const yeni = () => {
    const id = ortamOlustur(ben);
    if (id) git(`ortam/${id}`);
  };
  const sekme = (secili: boolean) => (secili ? { "aria-current": "page" as const, className: "acik" } : {});
  return (
    <nav className="ortam-sekmeleri" aria-label={t("ortamSekmeleri")}>
      <a href="#/" {...sekme(!acik)}>
        <House size={15} /> {t(ben.birim === "muhabir" ? "mIslerim" : "mAna")}
      </a>
      {liste.map((o) => (
        <a key={o.id} href={`#/ortam/${o.id}`} data-ortam={o.id} {...sekme(acik === o.id)}>
          <LayoutPanelLeft size={15} /> <bdi dir="auto">{adi(o)}</bdi>
        </a>
      ))}
      <button type="button" className="yeni-ortam" onClick={yeni} disabled={dolu}>
        <Plus size={15} /> {t("yeniOrtam")}
      </button>
      {dolu && <span className="bos-kucuk">{t("ortamSiniri", { n: ORTAM_EN_COK })}</span>}
    </nav>
  );
}
