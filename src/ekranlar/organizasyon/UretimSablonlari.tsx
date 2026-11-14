import { Pencil, Route, Trash2 } from "lucide-react";
import { useState } from "react";
import { UretimTablosu } from "../../bilesenler/UretimBalonu";
import { Kart, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { uretimSablonuDuzenler, uretimSablonuGuncelle, uretimSablonuSil, type UretimSecimi } from "../../eylemler";
import { ASAMA_ADI, PARCA_ADI, URETIM_ASAMALARI, asamaYolda, sablonAdi, uretimSablonlari, type UretimSablonu } from "../../uretim";
import { useVeri, type IcerikTuru, type Kisi } from "../../veri";
import { TUR_ADI } from "../../etiketler";
import { birimAdi } from "../../yapi";

const KOLLAR: IcerikTuru[] = ["haber", "feature", "ekonomi", "program", "spor"];

/*
 * Üretim şablonları (kullanıcı: iş akışları havada kalıyordu; yolu paketin
 * onayında üretim balonu belirliyor, tekrarlanan düzen şablon oluyor). Eski
 * "İş akışları" sekmesinin yerinde. Yeni şablon balondaki "Şablon olarak
 * kaydet"le doğar; burada adı, tikleri ve hangi paketlerde balonun onunla
 * açılacağı değişir, şablon silinir. Şablonla başlamış paketler yollarını
 * kendi kayıtlarında taşıdığı için değişiklik onları etkilemez.
 */
export function UretimSablonlari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [duzenlenen, setDuzenlenen] = useState<UretimSablonu | null>(null);
  const liste = uretimSablonlari(v);
  const duzenler = uretimSablonuDuzenler(ben);
  return (
    <Kart baslik={t("urSablonlar")} ikon={<Route size={18} />} ek={String(liste.length)}>
      <ul className="liste uretim-sablon-listesi" data-uretim-sablon-listesi>
        {liste.map((s) => (
          <li key={s.id} data-uretim-sablon-satiri={s.id}>
            <div className="ad">
              <b>{sablonAdi(s)}</b>
              <small className="uretim-sablon-yolu">
                {URETIM_ASAMALARI.filter((a) => a !== "grafik" || s.parca.gfx).map((a) => (
                  <span key={a} className={asamaYolda(s, a) ? "" : "sonuk-yazi"}>
                    {t(ASAMA_ADI[a])}: <b>{asamaYolda(s, a) ? birimAdi(s.yol[a]) : t("urAtla")}</b>
                  </span>
                ))}
                {(["stand", "gfx"] as const).filter((k) => s.parca[k]).map((k) => (
                  <Rozet key={k}>{t(PARCA_ADI[k])}</Rozet>
                ))}
              </small>
              {(s.kollar?.length || s.stok) && (
                <small className="sonuk-yazi">
                  {t("urSablonVarsayilan")}: {[...(s.kollar ?? []).map((k) => t(TUR_ADI[k])), ...(s.stok ? [t("urStok")] : [])].join(", ")}
                </small>
              )}
            </div>
            {duzenler && (
              <span className="dugmeler">
                <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setDuzenlenen(s)} data-uretim-sablon-duzenle={s.id}>
                  <Pencil size={14} /> {t("duzenle")}
                </button>
                <button
                  type="button"
                  className="dugme dugme-sade dugme-kucuk"
                  aria-label={t("urSablonSil")}
                  title={t("urSablonSil")}
                  aria-disabled={liste.length <= 1}
                  onClick={() => liste.length > 1 && confirm(t("urSablonSilOnay", { ad: sablonAdi(s) })) && uretimSablonuSil(ben, s.id) && bildir(t("bKaydedildi"))}
                  data-uretim-sablon-sil={s.id}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {duzenlenen && <SablonPenceresi ben={ben} sablon={duzenlenen} kapat={() => setDuzenlenen(null)} />}
    </Kart>
  );
}

function SablonPenceresi({ ben, sablon, kapat }: { ben: Kisi; sablon: UretimSablonu; kapat: () => void }) {
  const { t } = useDil();
  const [ad, setAd] = useState(sablonAdi(sablon));
  const [secim, setSecim] = useState<UretimSecimi>({ yol: { ...sablon.yol }, parca: { ...sablon.parca } });
  const [kollar, setKollar] = useState<IcerikTuru[]>(sablon.kollar ?? []);
  const [stok, setStok] = useState(!!sablon.stok);
  const kaydet = () => {
    if (!ad.trim()) return;
    const tamam = uretimSablonuGuncelle(ben, sablon.id, (s) => ({
      ...s,
      ad: ad.trim(),
      yol: secim.yol,
      parca: secim.parca,
      ...(kollar.length ? { kollar } : { kollar: undefined }),
      ...(stok ? { stok: true } : { stok: undefined }),
    }));
    if (!tamam) return;
    bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere
      genis
      baslik={t("urSablon")}
      alt={sablonAdi(sablon)}
      kapat={kapat}
      altBilgi={
        <div className="dugmeler">
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" disabled={!ad.trim()} onClick={kaydet} data-uretim-sablon-kaydet>
            {t("kaydet")}
          </button>
        </div>
      }
    >
      <label>
        {t("urSablonAdi")}
        <input value={ad} onChange={(e) => setAd(e.target.value)} dir="auto" data-uretim-sablon-ad />
      </label>
      <UretimTablosu secim={secim} setSecim={setSecim} />
      <fieldset className="uretim-varsayilan">
        <legend>{t("urSablonVarsayilan")}</legend>
        {KOLLAR.map((k) => (
          <label key={k} className="secim">
            <input type="checkbox" checked={kollar.includes(k)} onChange={(e) => setKollar((o) => (e.target.checked ? [...o, k] : o.filter((x) => x !== k)))} data-uretim-sablon-kol={k} />
            {t(TUR_ADI[k])}
          </label>
        ))}
        <label className="secim">
          <input type="checkbox" checked={stok} onChange={(e) => setStok(e.target.checked)} data-uretim-sablon-stok />
          {t("urStok")}
        </label>
      </fieldset>
    </Pencere>
  );
}
