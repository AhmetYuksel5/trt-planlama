import { CalendarRange, FilePlus2, Printer } from "lucide-react";
import { useState } from "react";
import { Bos, Kart, Rozet, bildir } from "../../bilesenler/Parcalar";
import { aralikYaz, tarihYaz, useDil } from "../../dil";
import { HAFTA_DURUM_ADI, HAFTA_DURUM_TONU } from "../../etiketler";
import { haftalikOlustur } from "../../eylemler";
import { gundemde, haftaSonu, kararBekleyenler } from "../../haftalik";
import { bugun, haftaBasi, planlananHafta } from "../../tarih";
import { useVeri, type Kisi } from "../../veri";
import { yapabilir } from "../../yetki";
import { git } from "../../yol";
import { HaftaKarti, SayfaBasi } from "../ana/Planlama";
import { FormAlt } from "../nextday/Formlar";

/**
 * Haftalık planlar: haftalar ve durumları.
 *
 * Plan Cumartesi–Cuma; varsayılan, Perşembe toplantısında hazırlanan
 * gelecek hafta. Seçilen gün hangi haftadaysa o haftanın Cumartesi'sine
 * yuvarlanıyor; aynı hafta için ikinci plan açılmıyor, var olan açılıyor.
 */

const EVRELER = [
  ["hevOneri", "hevOneriGun"],
  ["hevPlan", "hevPlanGun"],
  ["hevOnInceleme", "hevOnIncelemeGun"],
  ["hevToplanti", "hevToplantiGun"],
  ["hevGeriDonus", "hevGeriDonusGun"],
] as const;

export default function HaftalikListe({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [form, setForm] = useState(false);
  const [gun, setGun] = useState(planlananHafta(bugun()));
  const haftalar = [...v.haftalik].sort((a, b) => b.baslangic.localeCompare(a.baslangic));
  const olusturabilir = yapabilir(ben, "haftalikDuzenle");
  const bas = haftaBasi(gun);

  const olustur = () => {
    const s = haftalikOlustur(ben, gun);
    if (!s) return;
    if (!s.vardi) bildir(t("bHaftalikOlusturuldu"));
    git(`haftalik/${s.id}`);
  };

  return (
    <>
      <SayfaBasi
        ikon={<CalendarRange size={26} />}
        baslik={t("haftalikPlanlar")}
       
        sagUc={
          olusturabilir && !form ? (
            <button className="dugme" onClick={() => setForm(true)}>
              <FilePlus2 size={16} /> {t("yeniHaftalik")}
            </button>
          ) : undefined
        }
      />
      {form && (
        <div className="form form-kutu">
          <div className="satir">
            <label>
              {t("haftaninBirGunu")}
              <input type="date" value={gun} onChange={(e) => setGun(e.target.value || planlananHafta(bugun()))} />
            </label>
          </div>
          <p className="ipucu">{t("haftaAraligi", { aralik: aralikYaz(bas, haftaSonu(bas), dil) })}</p>
          <FormAlt kapat={() => setForm(false)} kaydet={olustur} kaydetMetni={v.haftalik.some((h) => h.baslangic === bas) ? t("ac") : t("olustur")} />
        </div>
      )}

      <HaftaKarti d={v} />

      <Kart baslik={t("haftalikPlanlar")} ikon={<CalendarRange size={18} />}>
        {haftalar.length === 0 ? (
          <Bos metin={t("planYok")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("hafta")}</th>
                  <th>{t("durum")}</th>
                  <th>{t("gundemKalemi")}</th>
                  <th>{t("kararBekleyen")}</th>
                  <th>{t("onIncelemede")}</th>
                  <th>{t("krKabul")}</th>
                  <th className="dar" />
                </tr>
              </thead>
              <tbody>
                {haftalar.map((h) => {
                  const gundem = h.kalemler.filter(gundemde);
                  const planlanan = h.baslangic === planlananHafta(bugun());
                  const buHafta = h.baslangic === haftaBasi(bugun());
                  return (
                    <tr key={h.id} className="tiklanir" onClick={() => git(`haftalik/${h.id}`)}>
                      <td className="birincil">
                        <a className="kalin" href={`#/haftalik/${h.id}`} onClick={(e) => e.stopPropagation()}>
                          {aralikYaz(h.baslangic, haftaSonu(h.baslangic), dil)}
                        </a>{" "}
                        {planlanan && <Rozet ton="vurgu">{t("gelecekHafta")}</Rozet>}
                        {buHafta && <Rozet ton="iyi">{t("buHafta")}</Rozet>}
                        <small className="sonuk ince">{tarihYaz(h.baslangic, dil, "uzun")}</small>
                      </td>
                      <td data-etiket={t("durum")}>
                        <Rozet ton={HAFTA_DURUM_TONU[h.durum]}>{t(HAFTA_DURUM_ADI[h.durum])}</Rozet>
                      </td>
                      <td data-etiket={t("gundemKalemi")}>{gundem.length}</td>
                      <td data-etiket={t("kararBekleyen")}>{h.durum === "kesinlesti" ? "—" : kararBekleyenler(h).length}</td>
                      <td data-etiket={t("onIncelemede")}>{gundem.filter((k) => k.onInceleme?.durum === "gonderildi" && k.karar === "bekliyor").length}</td>
                      <td data-etiket={t("krKabul")}>{gundem.filter((k) => k.karar === "kabul").length}</td>
                      <td className="dar eylem">
                        <a className="dugme dugme-sade dugme-kucuk" href={`#/haftalik/${h.id}/cikti`} onClick={(e) => e.stopPropagation()} title={t("ciktiOnizleme")}>
                          <Printer size={15} /> {t("cikti")}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Kart>

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
          <div className="kol renk-saha">
            <b>{t("kolProgram")}</b>
            <p>{t("kolProgramA")}</p>
          </div>
        </div>
      </Kart>
    </>
  );
}
