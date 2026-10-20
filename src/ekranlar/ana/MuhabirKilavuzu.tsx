import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, FileDown } from "lucide-react";
import Logo from "../../bilesenler/Logo";
import { useDil, type Anahtar } from "../../dil";
import { useVeri } from "../../veri";

/**
 * Muhabirin kılavuzu: İşlerim'in üstünde katlanır kart, PDF olarak da.
 *
 * Ekranlarda kullanım anlatımı yok kuralının bilinçli istisnası: muhabir
 * sistemi en az tanıyan ve en seyrek giren kişi, kılavuzu ayrı dosyada
 * aramasın diye istendi. Açık/kapalı tarayıcıda; ilk girişte açık gelir,
 * kapatan bir daha görmek istemedikçe kapalı görür.
 *
 * PDF tarayıcının yazdırmasından: sayfa değil kılavuzun temiz kopyası
 * basılsın diye baskı anında kopya body'ye konur, gerisi baskıda gizli.
 */

const SAKLA = "trt-planlama-kilavuz";

const okuAcik = () => {
  try {
    return localStorage.getItem(SAKLA) !== "kapali";
  } catch {
    return true;
  }
};

type Bolum = { baslik: Anahtar; maddeler: Anahtar[]; durumlar?: [Anahtar, Anahtar][] };

function useBolumler(): Bolum[] {
  const v = useVeri();
  return [
    { baslik: "kl1", maddeler: ["kl1a", "kl1b", "kl1c", "kl1d", "kl1e"] },
    { baslik: "kl2", maddeler: ["kl2a", "kl2b"] },
    {
      baslik: "kl3",
      maddeler: [],
      durumlar: [
        ["odYeni", "kl3Yeni"],
        ["odDegerlendiriliyor", "kl3Degerlendiriliyor"],
        ["odPlanaEklendi", "kl3Plana"],
        ["odDuzeltme", "kl3Duzeltme"],
        ["odSonra", "kl3Sonra"],
        ["odReddedildi", "kl3Red"],
        ["odGeriCekildi", "kl3GeriCekildi"],
        ["sadeTamam", "kl3Tamam"],
      ],
    },
    { baslik: "kl4", maddeler: ["kl4a"] },
    { baslik: "kl4g", maddeler: ["kl4ga"] },
    { baslik: "kl4c", maddeler: ["kl4ca"] },
    { baslik: "kl5", maddeler: ["kl5a"] },
    { baslik: "kl6", maddeler: ["kl6a"] },
    // Newsdesk devredeyken muhabir paketi kapatmıyor, sırası gelen adımı yapıyor.
    { baslik: "kl7", maddeler: ["kl7a", v.newsdeskDevrede ? "kl7bNewsdesk" : "kl7b", "kl7c"] },
    { baslik: "kl8", maddeler: ["kl8a"] },
    { baslik: "kl9", maddeler: ["kl9a", "kl9b", "kl9c"] },
  ];
}

function Govde() {
  const { t } = useDil();
  return (
    <div className="kilavuz-govde">
      <p className="kilavuz-giris">{t("klGiris")}</p>
      <ol className="kilavuz-bolumler">
        {useBolumler().map((b) => (
          <li key={b.baslik}>
            <h3>{t(b.baslik)}</h3>
            {b.maddeler.length > 0 && (
              <ul>
                {b.maddeler.map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ul>
            )}
            {b.durumlar && (
              <dl className="kilavuz-durumlar">
                {b.durumlar.map(([ad, aciklama]) => (
                  <div key={ad}>
                    <dt>{t(ad)}</dt>
                    <dd>{t(aciklama)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MuhabirKilavuzu() {
  const { t } = useDil();
  const [acik, setAcik] = useState(okuAcik);
  const [baski, setBaski] = useState(false);

  const degis = (yeni: boolean) => {
    setAcik(yeni);
    try {
      localStorage.setItem(SAKLA, yeni ? "acik" : "kapali");
    } catch {
      /* saklanamazsa yalnız bu açılışta geçerli */
    }
  };

  useEffect(() => {
    if (!baski) return;
    const kok = document.documentElement;
    const eskiAd = document.title;
    // Kaydedilen PDF'in adı belgenin adından geliyor.
    document.title = `Plannersflow · ${t("klBaslik")}`;
    kok.classList.add("kilavuz-baskisi");
    const bitir = () => setBaski(false);
    window.addEventListener("afterprint", bitir);
    // Kopya çizilsin, sonra yazdırma açılsın.
    const zaman = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(zaman);
      window.removeEventListener("afterprint", bitir);
      kok.classList.remove("kilavuz-baskisi");
      document.title = eskiAd;
    };
  }, [baski, t]);

  return (
    <>
      <details className="kart kilavuz" open={acik} data-kilavuz onToggle={(e) => degis(e.currentTarget.open)}>
        <summary>
          <BookOpen size={18} />
          <span className="kilavuz-ad">{t("klBaslik")}</span>
          <button
            type="button"
            className="dugme dugme-ikincil dugme-kucuk"
            data-kilavuz-pdf
            onClick={(e) => {
              // Düğme özetin içinde: basınca kart açılıp kapanmasın.
              e.preventDefault();
              e.stopPropagation();
              setBaski(true);
            }}
          >
            <FileDown size={16} /> {t("klPdf")}
          </button>
        </summary>
        <Govde />
      </details>
      {baski &&
        createPortal(
          <div className="kilavuz-baski" data-kilavuz-baski>
            <div className="kilavuz-baski-ust">
              <Logo />
              <h2>{t("klBaslik")}</h2>
            </div>
            <Govde />
          </div>,
          document.body,
        )}
    </>
  );
}
