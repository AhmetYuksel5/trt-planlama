import { Calendar, CheckCircle, Circle, Tv } from "lucide-react";
import { Bos, Icerik, Ilerleme, Kart, NotKutu, Rozet, TaslakEtiketi, TurRozeti } from "../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../dil";
import { useVeri } from "../veri";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Aylık ve özel yayın planları: promptun 5. maddesindeki gibi ilk
 * prototipte temel liste düzeyinde; kayıtları Next Day'den ayrı.
 * Haftalık plan kendi klasöründe (ekranlar/haftalik).
 */

export function Aylik() {
  const { t, dil } = useDil();
  const v = useVeri();
  const plan = v.aylik[0];
  return (
    <>
      <SayfaBasi ikon={<Calendar size={26} />} baslik={t("aylik")} alt={t("aylikAlt")} sagUc={<TaslakEtiketi />} />
      <NotKutu>{t("aylikTaslakNotu")}</NotKutu>
      {plan ? (
        <Kart baslik={tarihYaz(plan.ay + "-01", dil, "ay")} sagUc={<Rozet ton="uyari">{t("hazirlaniyor")}</Rozet>}>
          <Ilerleme oran={plan.kalemler.filter((k) => k.onayli).length / Math.max(1, plan.kalemler.length)} />
          <ul className="liste ara-ust-2">
            {plan.kalemler.map((k) => (
              <li key={k.id}>
                {k.onayli ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
                <div className="ad">
                  <b>
                    <Icerik blok>{k.baslik}</Icerik>
                  </b>
                </div>
                <TurRozeti tur={k.tur} />
              </li>
            ))}
          </ul>
        </Kart>
      ) : (
        <Bos metin={t("planYok")} />
      )}
    </>
  );
}

export function Ozel() {
  const { t, dil } = useDil();
  const v = useVeri();
  return (
    <>
      <SayfaBasi ikon={<Tv size={26} />} baslik={t("ozel")} alt={t("ozelAlt")} sagUc={<TaslakEtiketi />} />
      <NotKutu>{t("ozelTaslakNotu")}</NotKutu>
      <div className="iz iz-2">
        {v.ozel.map((o) => (
          <Kart key={o.id} baslik={<Icerik>{o.ad}</Icerik>} ek={tarihYaz(o.tarih, dil, "uzun")}>
            <Ilerleme oran={o.hazirlik.filter((h) => h.tamam).length / Math.max(1, o.hazirlik.length)} />
            <ul className="liste ara-ust-2">
              {o.hazirlik.map((h) => (
                <li key={h.id}>
                  {h.tamam ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
                  <div className="ad">
                    <b>
                      <Icerik blok>{h.metin}</Icerik>
                    </b>
                  </div>
                </li>
              ))}
            </ul>
          </Kart>
        ))}
      </div>
    </>
  );
}
