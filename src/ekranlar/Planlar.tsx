import { Calendar, CalendarRange, CheckCircle, Circle, Tv } from "lucide-react";
import { Bos, Ilerleme, Kart, NotKutu, Rozet, TaslakEtiketi, TurRozeti } from "../bilesenler/Parcalar";
import { gunAdi, tarihYaz, useDil } from "../dil";
import { ulkeAdi } from "../etiketler";
import { gunEkle } from "../tarih";
import { useVeri } from "../veri";
import { HaftaKarti, SayfaBasi } from "./ana/Planlama";

/*
 * Haftalık, aylık ve özel yayın planları: promptun 5. maddesindeki gibi
 * ilk prototipte temel liste düzeyinde. Kayıtları Next Day'den ayrı
 * tutuluyor; haftalıkta onaylanan haber/güncel işin Next Day'e aktarımı
 * (rapor bölüm 5) ve kollara ayrılması sonraki adımda.
 */

const EVRELER = [
  ["hevOneri", "hevOneriGun"],
  ["hevPlan", "hevPlanGun"],
  ["hevToplanti", "hevToplantiGun"],
  ["hevGeriDonus", "hevGeriDonusGun"],
] as const;

export function Haftalik() {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const plan = v.haftalik[0];
  return (
    <>
      <SayfaBasi ikon={<CalendarRange size={26} />} baslik={t("haftalik")} alt={t("haftalikAlt")} sagUc={<TaslakEtiketi />} />
      <NotKutu>{t("haftalikTaslakNotu")}</NotKutu>
      <Kart baslik={t("haftalikAkis")}>
        <div className="kollar">
          {EVRELER.map(([a, g]) => (
            <div key={a} className="kol renk-haftalik">
              <b>{t(a)}</b>
              <p>{t(g)}</p>
            </div>
          ))}
        </div>
      </Kart>
      <HaftaKarti d={v} />
      {plan && (
        <Kart baslik={t("haftalikKalemler")} ek={`${tarihYaz(plan.baslangic, dil, "kisa")} – ${tarihYaz(gunEkle(plan.baslangic, 6), dil, "kisa")}`}>
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("gun")}</th>
                  <th>{t("baslik")}</th>
                  <th>{t("tur")}</th>
                  <th>{t("ulke")}</th>
                  <th>{t("toplantiKarari")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.kalemler.map((k) => (
                  <tr key={k.id}>
                    <td className="sonuk" data-etiket={t("gun")}>
                      {k.tarih && `${gunAdi(k.tarih, dil)} ${tarihYaz(k.tarih, dil, "kisa")}`}
                    </td>
                    <td className="kalin birincil">{y(k.baslik)}</td>
                    <td data-etiket={t("tur")}>
                      <TurRozeti tur={k.tur} />
                    </td>
                    <td data-etiket={t("ulke")}>{k.ulke ? t(ulkeAdi(k.ulke)) : "—"}</td>
                    <td data-etiket={t("toplantiKarari")}>
                      <Rozet ton={k.onayli ? "iyi" : ""}>{t(k.onayli ? "onaylandi" : "beklemede")}</Rozet>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kart>
      )}
      <Kart baslik={t("kollar")}>
        <div className="kollar">
          <div className="kol renk-nextday">
            <b>{t("kolHaber")}</b>
            <p>{t("kolHaberA")}</p>
          </div>
          <div className="kol renk-haftalik">
            <b>{t("kolFeature")}</b>
            <p>{t("kolFeatureA")}</p>
          </div>
          <div className="kol renk-yurtdisi">
            <b>{t("kolProgram")}</b>
            <p>{t("kolProgramA")}</p>
          </div>
        </div>
      </Kart>
    </>
  );
}

export function Aylik() {
  const { t, y, dil } = useDil();
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
                  <b>{y(k.baslik)}</b>
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
  const { t, y, dil } = useDil();
  const v = useVeri();
  return (
    <>
      <SayfaBasi ikon={<Tv size={26} />} baslik={t("ozel")} alt={t("ozelAlt")} sagUc={<TaslakEtiketi />} />
      <NotKutu>{t("ozelTaslakNotu")}</NotKutu>
      <div className="iz iz-2">
        {v.ozel.map((o) => (
          <Kart key={o.id} baslik={y(o.ad)} ek={tarihYaz(o.tarih, dil, "uzun")}>
            <Ilerleme oran={o.hazirlik.filter((h) => h.tamam).length / Math.max(1, o.hazirlik.length)} />
            <ul className="liste ara-ust-2">
              {o.hazirlik.map((h) => (
                <li key={h.id}>
                  {h.tamam ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
                  <div className="ad">
                    <b>{y(h.metin)}</b>
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
