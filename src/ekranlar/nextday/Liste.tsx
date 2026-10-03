import { CalendarDays, FilePlus2, Printer } from "lucide-react";
import { useEffect } from "react";
import { Bos, Kart, Rozet, bildir } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { planOlustur } from "../../eylemler";
import { PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import { bugun, gunEkle } from "../../tarih";
import { siradakiPlanGunu, useVeri, type Kisi } from "../../veri";
import { yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";

/**
 * Next Day plan listesi ve yeni plan.
 *
 * Yeni plan tek tıkla açılıyor: planı olmayan sıradaki gün, önceki planın
 * şablonuyla (eylemler.ts → planOlustur). Kurumda da dünün belgesi
 * kopyalanıp güncelleniyor; neyin taşınacağını seçtiren form bu yüzden
 * kalktı. Dünden gelenler plan ekranında hafif fonla ayrılıyor.
 */
export default function NextDayListe({ ben, yeni }: { ben: Kisi; yeni: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar = [...v.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const olusturabilir = yapabilir(ben, "planDuzenle");
  const sirada = siradakiPlanGunu(v);

  /* Seçim yok: plan önceki planın şablonuyla açılıyor, planlamacı orada düzeltiyor. */
  const ac = (tarih: string) => {
    const r = planOlustur(ben, tarih);
    if (!r) return git("nextday");
    if (!r.vardi) bildir(r.kaynak ? t("bPlanKopyalandi", { tarih: tarihYaz(r.kaynak, dil, "kisa") }) : t("bPlanOlusturuldu"));
    git(`nextday/${r.id}`);
  };
  /* Ana sayfadaki kısayol (#/nextday/yeni) yarının planına götürüyor; yoksa açıyor. Aynı gün için ikinci plan açılmıyor. */
  useEffect(() => {
    if (yeni) ac(gunEkle(bugun(), 1));
  }, [yeni]);

  return (
    <>
      <SayfaBasi
        ikon={<CalendarDays size={26} />}
        baslik={t("nextdayPlanlari")}
        alt={t("nextdayAlt")}
        sagUc={
          olusturabilir ? (
            <button className="dugme" onClick={() => ac(sirada)}>
              <FilePlus2 size={16} /> {t("planiAcTarih", { tarih: tarihYaz(sirada, dil, "uzun") })}
            </button>
          ) : undefined
        }
      />
      <Kart baslik={t("planlar")} ikon={<CalendarDays size={18} />}>
        {planlar.length === 0 ? (
          <Bos metin={t("planYok")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("tarih")}</th>
                  <th>{t("durum")}</th>
                  <th>{t("basliklar")}</th>
                  <th>{t("paketOnerileri")}</th>
                  <th>{t("ekip")}</th>
                  <th>{t("kopyaKaynagi")}</th>
                  <th className="dar" />
                </tr>
              </thead>
              <tbody>
                {planlar.map((p) => {
                  const kaynak = v.planlar.find((x) => x.id === p.kopyaKaynagi);
                  return (
                    <tr key={p.id} className="tiklanir" onClick={() => git(`nextday/${p.id}`)}>
                      <td className="birincil">
                        <a className="kalin" href={`#/nextday/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          {tarihYaz(p.tarih, dil, "tam")}
                        </a>
                        {p.tarih === gunEkle(bugun(), 1) && (
                          <>
                            {" "}
                            <Rozet ton="vurgu">{t("yarin")}</Rozet>
                          </>
                        )}
                        {p.tarih === bugun() && (
                          <>
                            {" "}
                            <Rozet ton="iyi">{t("bugun")}</Rozet>
                          </>
                        )}
                      </td>
                      <td data-etiket={t("durum")}>
                        <Rozet ton={PLAN_DURUM_TONU[p.durum]}>{t(PLAN_DURUM_ADI[p.durum])}</Rozet>
                      </td>
                      <td data-etiket={t("basliklar")}>{p.basliklar.length}</td>
                      <td data-etiket={t("paketOnerileri")}>{v.paketler.filter((x) => x.planId === p.id && x.durum !== "iptal").length}</td>
                      <td data-etiket={t("ekip")}>{p.ekip.length}</td>
                      <td className="sonuk" data-etiket={t("kopyaKaynagi")}>
                        {kaynak ? tarihYaz(kaynak.tarih, dil, "kisa") : "—"}
                      </td>
                      <td className="dar eylem">
                        <a className="dugme dugme-sade dugme-kucuk" href={`#/nextday/${p.id}/cikti`} onClick={(e) => e.stopPropagation()} title={t("ciktiOnizleme")}>
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
    </>
  );
}
