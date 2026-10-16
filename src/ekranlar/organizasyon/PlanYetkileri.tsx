import { CalendarDays, CalendarRange, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Kart, Pencere } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { useVeri, type Kisi } from "../../veri";
import {
  VARSAYILAN_PLAN_YETKILERI,
  adimYetkilisi,
  birimAdi,
  birimAgaci,
  birimUnvanlari,
  gorevAdi,
  planYetkisi,
  unvanListesi,
  yapi,
  type AdimYetkisi,
  type PlanAdimi,
  type YetkiSatiri,
  type Yapi,
} from "../../yapi";
import { useTaslak } from "./Organizasyon";

/**
 * Plan yetkileri: Next Day ve Weekly'nin akış adımlarını (toplantıya
 * götürme, onay, devir, karar, kesinleştirme) kimin yaptığı. Kural
 * satırlardan (birim, ünvan, yalnız yöneticiler) ve adıyla seçilen
 * kişilerden; plan ekranının düğmesi de eylemi de aynı kurala soruyor
 * (yetki.ts → planAdimiYapabilir). Öbür yapı sekmeleri gibi taslakta,
 * "Yayınla" ile geçerli.
 */

export const PLAN_ADIMI_ADI: Record<PlanAdimi, Anahtar> = {
  ndToplanti: "pyNdToplanti",
  ndOnay: "pyNdOnay",
  ndDevral: "pyNdDevral",
  hfToplanti: "pyHfToplanti",
  hfKarar: "pyHfKarar",
  hfKesinlestir: "pyHfKesinlestir",
};

const GRUPLAR: { ad: Anahtar; ikon: React.ReactNode; adimlar: PlanAdimi[] }[] = [
  { ad: "pyNextDay", ikon: <CalendarDays size={18} />, adimlar: ["ndToplanti", "ndOnay", "ndDevral"] },
  { ad: "pyWeekly", ikon: <CalendarRange size={18} />, adimlar: ["hfToplanti", "hfKarar", "hfKesinlestir"] },
];

type T = ReturnType<typeof useDil>["t"];

/* "Planlama · yöneticiler", "Newsdesk · Executive Producer", "Haber merkezi" */
const satirOzeti = (s: YetkiSatiri, y: Yapi, t: T) =>
  [s.birim ? birimAdi(s.birim, y) : t("pyTumMerkez"), s.unvan ? gorevAdi(s.unvan, y) : "", s.yonetici ? t("pyYoneticiler") : ""].filter(Boolean).join(" · ");

/** Kuralın tek satırlık özeti; plan ekranında "kim yapar" satırı da bunu kullanıyor. */
export function YetkiOzeti({ a, y }: { a: AdimYetkisi; y?: Yapi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const yy = y ?? yapi();
  const kisiler = a.kisiler.map((id) => ad(v.kisiler.find((k) => k.id === id))).filter(Boolean);
  return <>{[...a.satirlar.map((s) => satirOzeti(s, yy, t)), ...kisiler].join(", ")}</>;
}

/** Yayındaki kurala göre "bu adımı kim yapar": yetkisi olmayana durum satırında. */
export const AdimYetkilileri = ({ adim }: { adim: PlanAdimi }) => <YetkiOzeti a={planYetkisi(adim)} />;

export function PlanYetkileriSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const [acik, setAcik] = useState<PlanAdimi | null>(null);
  // Hesapsız kişi giriş yapamıyor: sayıya girse adım yapılabilir sanılırdı.
  const etkin = v.kisiler.filter((k) => !k.pasif && !k.hesapsiz);
  return (
    <>
      {GRUPLAR.map((g) => (
        <Kart key={g.ad} baslik={t(g.ad)} ikon={g.ikon}>
          <ul className="liste plan-yetkileri">
            {g.adimlar.map((adim) => {
              const a = planYetkisi(adim, taslak);
              const uyan = etkin.filter((k) => adimYetkilisi(k, a, taslak)).length;
              const varsayilan = !taslak.planYetkileri?.[adim];
              return (
                <li key={adim} data-plan-yetkisi={adim}>
                  <div className="ad">
                    <b>{t(PLAN_ADIMI_ADI[adim])}</b>
                    <small data-plan-yetkisi-ozet>
                      <YetkiOzeti a={a} y={taslak} />
                    </small>
                    <small className="sonuk-yazi" data-plan-yetkisi-uyan={uyan}>
                      {t("orgKuralaUyan", { n: uyan })}
                      {varsayilan && ` · ${t("pyVarsayilan")}`}
                    </small>
                  </div>
                  <span className="unvan-islem">
                    {!varsayilan && (
                      <button
                        type="button"
                        className="dugme dugme-sade dugme-ikon"
                        onClick={() =>
                          degistir((y) => {
                            const { [adim]: _, ...kalan } = y.planYetkileri ?? {};
                            return { ...y, planYetkileri: kalan };
                          })
                        }
                        title={t("pyVarsayilanaDon")}
                        aria-label={t("pyVarsayilanaDon")}
                        data-plan-yetkisi-varsayilan={adim}
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAcik(adim)} title={t("duzenle")} aria-label={t("duzenle")} data-plan-yetkisi-duzenle={adim}>
                      <Pencil size={15} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </Kart>
      ))}
      {acik && <AdimPenceresi ben={ben} adim={acik} kapat={() => setAcik(null)} />}
    </>
  );
}

function AdimPenceresi({ ben, adim, kapat }: { ben: Kisi; adim: PlanAdimi; kapat: () => void }) {
  const { t, ad } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const ilk = planYetkisi(adim, taslak);
  const [satirlar, setSatirlar] = useState<YetkiSatiri[]>(ilk.satirlar);
  const [kisiler, setKisiler] = useState<string[]>(ilk.kisiler);
  const agac = birimAgaci(taslak, false);
  const deneme: AdimYetkisi = { satirlar, kisiler };
  const etkin = v.kisiler.filter((k) => !k.pasif && !k.hesapsiz);
  const uyanlar = etkin.filter((k) => adimYetkilisi(k, deneme, taslak));
  // Kimseyi kapsamayan kural adımı kilitlerdi: plan o adımda kalırdı.
  const hazir = uyanlar.length > 0;
  const satirDegis = (i: number, f: (s: YetkiSatiri) => YetkiSatiri) => setSatirlar(satirlar.map((s, j) => (j === i ? f(s) : s)));
  const eklenebilir = etkin.filter((k) => !kisiler.includes(k.id)).sort((a, b) => ad(a).localeCompare(ad(b), "ar"));
  const kaydet = () => {
    if (!hazir) return;
    // Varsayılanın aynısı kayda yazılmıyor: varsayılan sonra değişirse bu adım da onu izlesin.
    const ayni = JSON.stringify(deneme) === JSON.stringify(VARSAYILAN_PLAN_YETKILERI[adim]);
    degistir((y) => {
      const { [adim]: _, ...kalan } = y.planYetkileri ?? {};
      return { ...y, planYetkileri: ayni ? kalan : { ...kalan, [adim]: deneme } };
    });
    kapat();
  };
  return (
    <Pencere
      baslik={t(PLAN_ADIMI_ADI[adim])}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-plan-yetkisi-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-plan-yetkisi-formu>
        <fieldset className="yetki-satirlari">
          <legend>{t("pyBirimVeUnvan")}</legend>
          {satirlar.map((s, i) => {
            const unvanlar = s.birim ? birimUnvanlari(s.birim, taslak) : unvanListesi(undefined, undefined, taslak);
            return (
              <div key={i} className="yetki-satiri" data-yetki-satiri={i}>
                <select aria-label={t("birim")} value={s.birim ?? ""} onChange={(e) => satirDegis(i, (x) => ({ ...x, birim: e.target.value || undefined, unvan: undefined }))} data-yetki-birim>
                  <option value="">{t("pyTumMerkez")}</option>
                  {agac.map((b) => (
                    <option key={b.id} value={b.id}>
                      {" ".repeat(b.derinlik * 2)}
                      {birimAdi(b.id, taslak)}
                    </option>
                  ))}
                </select>
                <select aria-label={t("gorev")} value={s.unvan ?? ""} onChange={(e) => satirDegis(i, (x) => ({ ...x, unvan: e.target.value || undefined }))} data-yetki-unvan>
                  <option value="">{t("orgKuralTumUnvan")}</option>
                  {[...unvanlar, ...(s.unvan && !unvanlar.includes(s.unvan) ? [s.unvan] : [])].map((u) => (
                    <option key={u} value={u}>
                      {gorevAdi(u, taslak)}
                    </option>
                  ))}
                </select>
                <label className="secim">
                  <input type="checkbox" checked={!!s.yonetici} onChange={(e) => satirDegis(i, (x) => ({ ...x, yonetici: e.target.checked || undefined }))} data-yetki-yonetici />
                  {t("pyYalnizYoneticiler")}
                </label>
                <button type="button" className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => setSatirlar(satirlar.filter((_, j) => j !== i))} title={t("sil")} aria-label={t("sil")} data-yetki-satir-sil>
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          <div>
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setSatirlar([...satirlar, { birim: agac.find((b) => !b.derinlik)?.id }])} data-yetki-satir-ekle>
              <Plus size={14} /> {t("pySatirEkle")}
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("pyKisiler")}</legend>
          {kisiler.length > 0 && (
            <div className="cipler ara-alt">
              {kisiler.map((id) => (
                <span key={id} className="cip" data-yetki-kisi={id}>
                  {ad(v.kisiler.find((k) => k.id === id)) || id}
                  <button type="button" onClick={() => setKisiler(kisiler.filter((x) => x !== id))} title={t("sil")} aria-label={t("sil")}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <select aria-label={t("pyKisiEkle")} value="" onChange={(e) => e.target.value && setKisiler([...kisiler, e.target.value])} data-yetki-kisi-ekle>
            <option value="">{t("pyKisiEkle")}</option>
            {eklenebilir.map((k) => (
              <option key={k.id} value={k.id}>
                {ad(k)} · {birimAdi(k.birim, taslak)}
              </option>
            ))}
          </select>
        </fieldset>
        <p className={hazir ? "sonuk-yazi" : "kotu-yazi"} data-plan-yetkisi-onizleme={uyanlar.length}>
          {hazir ? t("orgKuralaUyan", { n: uyanlar.length }) : t("pyKimseYok")}
        </p>
        {hazir && (
          <p className="sonuk-yazi" data-plan-yetkisi-adlar>
            {uyanlar
              .slice(0, 12)
              .map((k) => ad(k))
              .join("، ")}
            {uyanlar.length > 12 && ` +${uyanlar.length - 12}`}
          </p>
        )}
      </div>
    </Pencere>
  );
}

