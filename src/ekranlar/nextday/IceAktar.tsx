import { FileUp } from "lucide-react";
import { useState } from "react";
import { Icerik, Pencere, bildir } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { planIceAktar } from "../../eylemler";
import { belgeSatirlari, planTaslagi, taslakBosMu, type PlanTaslagi } from "../../planAktar";
import { getir, type Kisi, type NextDayPlan } from "../../veri";

/**
 * Geçmiş plan belgesini bugünün taslağına alma penceresi: dosya seçilir,
 * ne geleceği sayılarıyla görünür, "Plana aktar" yazar. Gelenler şablondan
 * gelen gibi işaretli; planlamacı gözden geçirip bugüne alıyor.
 */
export default function IceAktarPenceresi({ ben, plan, kapat }: { ben: Kisi; plan: NextDayPlan; kapat: () => void }) {
  const { t, dil } = useDil();
  const [taslak, setTaslak] = useState<{ t: PlanTaslagi; ad: string } | null>(null);
  const [hata, setHata] = useState<Anahtar | null>(null);

  const sec = async (f?: File) => {
    setTaslak(null);
    setHata(null);
    if (!f) return;
    try {
      const x = planTaslagi(await belgeSatirlari(f), getir());
      if (taslakBosMu(x)) setHata("aktarBos");
      else setTaslak({ t: x, ad: f.name });
    } catch (e) {
      console.error(e);
      setHata("aktarEskiWord");
    }
  };
  const aktar = () => {
    if (!taslak) return;
    const n = planIceAktar(ben, plan.id, taslak.t, taslak.ad);
    bildir(n ? t("planAktarildi", { n }) : t("aktarBos"));
    kapat();
  };
  const x = taslak?.t;
  const gelisme = x ? x.basliklar.reduce((n, b) => n + b.gelismeler.length, 0) : 0;
  const muhabir = x ? x.basliklar.reduce((n, b) => n + b.muhabirler.length, 0) : 0;

  return (
    <Pencere
      baslik={t("planIceAktar")}
      alt={tarihYaz(plan.tarih, dil, "tam")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!taslak} onClick={aktar} data-plan-aktar-ekle>
          <FileUp size={16} /> {t("plana_aktar")}
        </button>
      }
    >
      <div className="form">
        <label>
          {t("aktarDosyaSec")}
          <input type="file" accept=".docx,.doc,.htm,.html,.txt" onChange={(e) => sec(e.target.files?.[0])} data-plan-aktar-dosya />
        </label>
      </div>
      {hata && (
        <p className="not-kutu uyari" role="alert" data-plan-aktar-hata>
          {t(hata)}
        </p>
      )}
      {x && (
        <div className="aktar-ozet" data-plan-aktar-ozet>
          <ul>
            <li>
              {t("calismaEkibi")}: <b>{x.ekip.length}</b>
            </li>
            <li>
              {t("canliYayinlar")}: <b>{x.canlilar.length}</b>
            </li>
            <li>
              {t("baslik")}: <b>{x.basliklar.length}</b> · {t("aktarGelismeSayisi")}: <b>{gelisme}</b> · {t("muhabirler")}: <b>{muhabir}</b>
            </li>
            <li>
              {t("takipler")}: <b>{x.takipler.length}</b>
            </li>
          </ul>
          {x.basliklar.length > 0 && (
            <ul className="aktar-basliklar">
              {x.basliklar.map((b, i) => (
                <li key={i}>
                  <Icerik blok>{b.ad}</Icerik>
                </li>
              ))}
            </ul>
          )}
          {x.bulunamayan.length > 0 && (
            <p className="not-kutu uyari" data-plan-aktar-bulunamayan>
              {t("aktarBulunamayan")}:{" "}
              {x.bulunamayan.map((ad, i) => (
                <span key={ad}>
                  {i > 0 && "، "}
                  <Icerik>{ad}</Icerik>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </Pencere>
  );
}
