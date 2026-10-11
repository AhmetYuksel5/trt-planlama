import { CalendarDays, Printer, Upload } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import { bugun, gunEkle } from "../../tarih";
import { gecmisPlanlariYukle } from "../../eylemler";
import { GERCEK } from "../../kip";
import { arSade, gecmisDosyaOku, planTaslagi, type GecmisGun } from "../../planAktar";
import { getir, useVeri, type Kisi } from "../../veri";
import { hesapYetkisi, yapabilir } from "../../yetki";
import { git } from "../../yol";
import { SayfaBasi } from "../ana/Planlama";

/**
 * Next Day plan listesi. Yeni plan açma düğmesi yok: planlar her gün
 * kesintisiz sürüyor, yarının planını sistem önceki planın şablonuyla
 * kendisi açıyor (eylemler.ts → yarinPlaniniAc). Liste yeniden eskiye;
 * yarının planı en üstte.
 */
export default function NextDayListe({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [yukle, setYukle] = useState(false);
  const planlar = [...v.planlar].sort((a, b) => b.tarih.localeCompare(a.tarih));
  // Geçmiş planların tek seferlik yüklemesi: gerçek kipte, ekip adlarından kişi kaydı açabilen planlamacı.
  const yukleyebilir = GERCEK && yapabilir(ben, "planDuzenle") && hesapYetkisi(ben, "hesapsizKisi");

  return (
    <>
      <SayfaBasi
        ikon={<CalendarDays size={26} />}
        baslik={t("nextdayPlanlari")}
        sagUc={
          yukleyebilir && (
            <button type="button" className="dugme dugme-ikincil dugme-ikon" title={t("gecmisPlanlar")} aria-label={t("gecmisPlanlar")} onClick={() => setYukle(true)} data-gecmis-planlar>
              <Upload size={16} />
            </button>
          )
        }
      />
      {yukle && <GecmisPenceresi ben={ben} kapat={() => setYukle(false)} />}
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

/* Toplu dosyanın önizlemesi: kaç gün, kaç kayıt, hangi ekip adları kişi olarak açılacak, hangi muhabir bulunamadı. */
function GecmisPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, dil } = useDil();
  const [dosya, setDosya] = useState<{ ad: string; gunler: GecmisGun[] } | null>(null);
  const [hata, setHata] = useState(false);
  const sec = async (f?: File) => {
    setDosya(null);
    setHata(false);
    if (!f) return;
    const gunler = gecmisDosyaOku(await f.text());
    if (gunler) setDosya({ ad: f.name, gunler });
    else setHata(true);
  };
  const d = getir();
  const taslaklar = dosya?.gunler.map((g) => ({ g, x: planTaslagi(g.satirlar, d) })) ?? [];
  const yeniEkip = new Map<string, string>();
  for (const { x } of taslaklar) for (const e of x.yeniEkip) yeniEkip.set(arSade(e.ad), e.ad);
  const bulunamayan = [...new Set(taslaklar.flatMap(({ x }) => x.bulunamayan).filter((a) => !yeniEkip.has(arSade(a))))];
  const kayit = taslaklar.reduce((n, { x }) => n + x.ekip.length + x.canlilar.length + x.takipler.length + x.basliklar.reduce((m, b) => m + 1 + b.gelismeler.length + b.muhabirler.length, 0), 0);
  const yeniPlan = taslaklar.filter(({ g }) => !d.planlar.some((p) => p.tarih === g.tarih)).length;
  const yukle = () => {
    if (!dosya) return;
    const r = gecmisPlanlariYukle(ben, dosya.gunler, dosya.ad);
    if (r) bildir(t("gecmisYuklendi", { plan: r.plan, kisi: r.kisi }));
    kapat();
  };
  return (
    <Pencere
      baslik={t("gecmisPlanlar")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!dosya} onClick={yukle} data-gecmis-yukle>
          <Upload size={16} /> {t("gecmisYukle")}
        </button>
      }
    >
      <div className="form">
        <label>
          {t("gecmisDosya")}
          <input type="file" accept=".json,application/json" onChange={(e) => sec(e.target.files?.[0])} data-gecmis-dosya />
        </label>
      </div>
      {hata && (
        <p className="not-kutu uyari" role="alert">
          {t("gecmisGecersiz")}
        </p>
      )}
      {dosya && (
        <div className="aktar-ozet" data-gecmis-ozet>
          <p>
            <b>{t("gecmisOzet", { plan: dosya.gunler.length, yeni: yeniPlan, kayit })}</b>
          </p>
          <ul>
            {taslaklar.map(({ g, x }) => (
              <li key={g.tarih}>
                {tarihYaz(g.tarih, dil, "tam")}: {t("baslik")} {x.basliklar.length} · {t("calismaEkibi")} {x.ekip.length + x.yeniEkip.length}
              </li>
            ))}
          </ul>
          {yeniEkip.size > 0 && (
            <p data-gecmis-yeni-kisi={yeniEkip.size}>
              {t("gecmisYeniKisiler")}: <Icerik>{[...yeniEkip.values()].join("، ")}</Icerik>
            </p>
          )}
          {bulunamayan.length > 0 && (
            <p className="not-kutu uyari" data-gecmis-bulunamayan>
              {t("aktarBulunamayan")}: <Icerik>{bulunamayan.join("، ")}</Icerik>
            </p>
          )}
        </div>
      )}
    </Pencere>
  );
}
