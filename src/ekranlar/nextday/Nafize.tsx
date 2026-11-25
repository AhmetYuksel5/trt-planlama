import { Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { Icerik, Pencere, icerikAlani } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { planNafizeKaydet, planNafizeleriEkle, planNafizeSil } from "../../eylemler";
import { kisiAr } from "../../etiketler";
import { useBen } from "../../oturum";
import { saatCoz } from "../../tarih";
import { disMuhabirMi, ekipAdayi, icMuhabirMi } from "../../yapi";
import { planIcerikDuzenler } from "../../yetki";
import { kisiBul, useVeri, type Durum, type Kisi, type NextDayPlan, type PlanNafize } from "../../veri";
import { BelgeSatiri, SatirSeridi } from "../belge/Parcalar";
import { EkleDugmesi, IkonDugme } from "./Bolumler";

/*
 * Nafize (kullanıcı): "مباشر"da değil, başlığın gelişmelerinin altında "نافذة"
 * (birden çoksa "نوافذ") başlığıyla; her biri "08:00G - mekan", altında
 * "المذيع: ad / الضيف: ad". Metin kurumun çıktısı gibi her dilde Arapça.
 */
export const baslikNafizeleri = (plan: NextDayPlan, pbId: string) =>
  (plan.nafizeler ?? []).filter((n) => n.planBaslikId === pbId).sort((a, b) => (a.saat || "99").localeCompare(b.saat || "99"));

type NafizeIcerigi = Pick<PlanNafize, "saat" | "yer" | "sunucu" | "konuklar">;
const sunucuAdi = (v: Durum, n: NafizeIcerigi) => (!n.sunucu ? "" : "ad" in n.sunucu ? n.sunucu.ad : kisiAr(kisiBul(v, n.sunucu.kisiId)) || "?");

/* İki satır: saat ve mekan; sunucu ve konuklar (boşsa çizilmez). */
export const nafizeSatirlari = (v: Durum, n: NafizeIcerigi): [ReactNode, ReactNode | null] => {
  const sunucu = sunucuAdi(v, n);
  const ikinci: ReactNode[] = [];
  if (sunucu)
    ikinci.push(
      <Fragment key="s">
        <b>المذيع:</b> {sunucu}
      </Fragment>,
    );
  if (n.konuklar.length)
    ikinci.push(
      <Fragment key="k">
        <b>{n.konuklar.length > 1 ? "الضيوف" : "الضيف"}:</b> {n.konuklar.join("، ")}
      </Fragment>,
    );
  return [
    <>
      <b data-nafize-saat>{n.saat ? `${n.saat}G` : "TBC"}</b>
      {n.yer && <> - {n.yer}</>}
    </>,
    ikinci.length ? ikinci.flatMap((x, i) => (i ? [" / ", x] : [x])) : null,
  ];
};

export const nafizeBasligi = (sayi: number) => (sayi > 1 ? "نوافذ" : "نافذة");

type FormSatiri = { saat: string; yer: string; kisiId: string; ad: string; konuklar: string };
const bosSatir = (onceki?: FormSatiri): FormSatiri => ({ saat: "", yer: onceki?.yer ?? "", kisiId: onceki?.kisiId ?? "", ad: onceki?.ad ?? "", konuklar: "" });
const satirdan = (n: NafizeIcerigi): FormSatiri => ({
  saat: n.saat ?? "",
  yer: n.yer,
  kisiId: n.sunucu && "kisiId" in n.sunucu ? n.sunucu.kisiId : "",
  ad: n.sunucu && "ad" in n.sunucu ? n.sunucu.ad : "",
  konuklar: n.konuklar.join("، "),
});
const konukListesi = (s: string) => s.split(/[،,؛;]/).map((x) => x.trim()).filter(Boolean);

export const YENI_DOSYA = "__yeni";
export type NafizeKaydi = NafizeIcerigi;

/*
 * Yeni nafizede satırlar: bir sunucunun birkaç saatte nafizesi tek formda; yeni satır öncekinin
 * sunucusu ve mekanıyla gelir. Next Day'de başlık planın başlıkları, Weekly'de haftanın dosyaları.
 */
export function NafizeFormu({
  baslik,
  secenekler,
  ilkBaslik,
  baslikSor,
  yeniDosya,
  ekipSunuculari = [],
  mevcut,
  kaydet: kaydetFn,
  kapat,
}: {
  baslik: string;
  secenekler: { id: string; ad: string }[];
  ilkBaslik: string;
  baslikSor: boolean;
  yeniDosya?: boolean;
  ekipSunuculari?: string[];
  mevcut?: NafizeIcerigi;
  kaydet: (baslikId: string, kayitlar: NafizeKaydi[], yeniDosya?: string) => void;
  kapat: () => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const [pbId, setPbId] = useState(ilkBaslik);
  const [yeniAd, setYeniAd] = useState("");
  const [satirlar, setSatirlar] = useState<FormSatiri[]>(mevcut ? [satirdan(mevcut)] : [bosSatir()]);
  // Sunucu yerinde muhabir de olabiliyor (kullanıcı): seçimde sunucular ve muhabirler, adları kayıttaki tam Arapça yazımla (ekip satırının kısa adıyla değil).
  const adSirasi = (a: Kisi, b: Kisi) => kisiAr(a).localeCompare(kisiAr(b), "ar");
  const sunucular = v.kisiler.filter((k) => !k.pasif && !disMuhabirMi(k) && (ekipSunuculari.includes(k.id) || ekipAdayi(k, "sunucu"))).sort(adSirasi);
  const muhabirler = v.kisiler.filter((k) => !k.pasif && !sunucular.includes(k) && (disMuhabirMi(k) || icMuhabirMi(k))).sort(adSirasi);
  const gecersiz = satirlar.some((x) => saatCoz(x.saat) === null);
  const baslikEksik = !pbId || (pbId === YENI_DOSYA && !yeniAd.trim());
  const degis = (i: number, f: Partial<FormSatiri>) => setSatirlar((l) => l.map((x, j) => (j === i ? { ...x, ...f } : x)));
  const kaydet = () => {
    if (baslikEksik || gecersiz) return;
    const kayitlar = satirlar.map((x) => ({
      saat: saatCoz(x.saat) || undefined,
      yer: x.yer,
      sunucu: x.kisiId ? { kisiId: x.kisiId } : x.ad.trim() ? { ad: x.ad.trim() } : undefined,
      konuklar: konukListesi(x.konuklar),
    }));
    kaydetFn(pbId === YENI_DOSYA ? "" : pbId, kayitlar, pbId === YENI_DOSYA ? yeniAd.trim() : undefined);
    kapat();
  };
  return (
    <Pencere baslik={baslik} kapat={kapat}>
      <div className="form" data-nafize-formu>
        {baslikSor && (
          <label>
            {t("baslik")}
            <select className="girdi" value={pbId} onChange={(e) => setPbId(e.target.value)} data-nafize-baslik>
              {!secenekler.length && !yeniDosya && <option value="">{t("nafizeBaslikYok")}</option>}
              {yeniDosya && !pbId && <option value="">—</option>}
              {secenekler.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ad}
                </option>
              ))}
              {yeniDosya && <option value={YENI_DOSYA}>+ {t("yeniDosya")}</option>}
            </select>
          </label>
        )}
        {pbId === YENI_DOSYA && (
          <label>
            {t("yeniDosya")}
            <input {...icerikAlani} className="girdi" value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} data-nafize-yeni-dosya />
          </label>
        )}
        {satirlar.map((x, i) => (
          <div key={i} className="form form-kutu" data-nafize-satir={i}>
            <div className="satir">
              <label>
                {t("saatGmt")}
                <input className="girdi" value={x.saat} onChange={(e) => degis(i, { saat: e.target.value })} onBlur={() => saatCoz(x.saat) && degis(i, { saat: saatCoz(x.saat)! })} placeholder="08:00" aria-invalid={saatCoz(x.saat) === null || undefined} data-nafize-saat-girdi />
              </label>
              <label>
                {t("yer")}
                <input {...icerikAlani} className="girdi" value={x.yer} onChange={(e) => degis(i, { yer: e.target.value })} placeholder="استوديو 1" data-nafize-yer />
              </label>
            </div>
            <div className="satir">
              <label>
                {t("nafizeSunucu")}
                <select className="girdi" value={x.kisiId} onChange={(e) => degis(i, { kisiId: e.target.value, ad: "" })} data-nafize-sunucu>
                  <option value="">—</option>
                  {[
                    ["egSunucu", sunucular],
                    ["muhabirler", muhabirler],
                  ].map(([ad, liste]) =>
                    (liste as Kisi[]).length ? (
                      <optgroup key={ad as string} label={t(ad as "egSunucu")}>
                        {(liste as Kisi[]).map((k) => (
                          <option key={k.id} value={k.id}>
                            {kisiAr(k)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null,
                  )}
                </select>
              </label>
              {!x.kisiId && (
                <label>
                  {t("teamsElleAd")}
                  <input {...icerikAlani} className="girdi" value={x.ad} onChange={(e) => degis(i, { ad: e.target.value })} data-nafize-sunucu-ad />
                </label>
              )}
            </div>
            <label>
              {t("nafizeKonuklar")}
              <input {...icerikAlani} className="girdi" value={x.konuklar} onChange={(e) => degis(i, { konuklar: e.target.value })} placeholder="محمد علي، أحمد حسن" title={t("nafizeKonukIpucu")} data-nafize-konuklar />
            </label>
            {satirlar.length > 1 && (
              <div className="form-alt">
                <IkonDugme ikon={<Trash2 size={15} />} etiket={t("cikar")} onClick={() => setSatirlar((l) => l.filter((_, j) => j !== i))} />
              </div>
            )}
          </div>
        ))}
        {!mevcut && (
          <div>
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" data-nafize-satir-ekle onClick={() => setSatirlar((l) => [...l, bosSatir(l.at(-1))])}>
              <Plus size={15} /> {t("nafizeSatirEkle")}
            </button>
          </div>
        )}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" onClick={kaydet} disabled={baslikEksik || gecersiz} data-nafize-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}


/* Next Day: başlıktan açılınca başlık sorulmaz. */
export function NafizePenceresi({ plan, planBaslikId, mevcut, kapat }: { plan: NextDayPlan; planBaslikId?: string; mevcut?: PlanNafize; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  return (
    <NafizeFormu
      baslik={t(mevcut ? "nafizeDuzenle" : "nafizeEkle")}
      secenekler={plan.basliklar.map((b) => ({ id: b.id, ad: v.basliklar.find((x) => x.id === b.baslikId)?.ad ?? "" }))}
      ilkBaslik={mevcut?.planBaslikId ?? planBaslikId ?? plan.basliklar[0]?.id ?? ""}
      baslikSor={!planBaslikId || !!mevcut}
      ekipSunuculari={plan.ekip.filter((u) => u.gorev === "sunucu").map((u) => u.kisiId)}
      mevcut={mevcut}
      kaydet={(pbId, kayitlar) => {
        if (!ben) return;
        if (mevcut) planNafizeKaydet(ben, plan.id, { ...kayitlar[0], planBaslikId: pbId, id: mevcut.id });
        else planNafizeleriEkle(ben, plan.id, kayitlar.map((k) => ({ ...k, planBaslikId: pbId })));
      }}
      kapat={kapat}
    />
  );
}

export function NafizeEkleDugmesi({ plan, planBaslikId }: { plan: NextDayPlan; planBaslikId?: string }) {
  const { t } = useDil();
  const ben = useBen();
  const [acik, setAcik] = useState(false);
  if (!ben || !planIcerikDuzenler(ben, plan)) return null;
  return (
    <span data-nafize-ekle>
      <EkleDugmesi metin={t("nafizeEkle")} onClick={() => setAcik(true)} />
      {acik && <NafizePenceresi plan={plan} planBaslikId={planBaslikId} kapat={() => setAcik(false)} />}
    </span>
  );
}

/* Klasik plan ekranı: başlık kartında gelişmelerin altında. */
export function NafizeListesi({ plan, pbId }: { plan: NextDayPlan; pbId: string }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [duzen, setDuzen] = useState<PlanNafize>();
  const liste = baslikNafizeleri(plan, pbId);
  if (!liste.length) return null;
  const yazar = !!ben && planIcerikDuzenler(ben, plan);
  return (
    <div data-nafizeler={pbId}>
      <Icerik blok>
        <b>{nafizeBasligi(liste.length)}</b>
      </Icerik>
      {liste.map((n) => {
        const [bir, iki] = nafizeSatirlari(v, n);
        return (
          <div key={n.id} className="kayit" data-nafize={n.id}>
            <div className="kayit-bas">
              <div>
                <Icerik blok className="kayit-metin">
                  {bir}
                </Icerik>
                {iki && (
                  <Icerik blok className="kayit-metin">
                    {iki}
                  </Icerik>
                )}
              </div>
              {yazar && (
                <div className="islemler">
                  <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setDuzen(n)} />
                  <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t("silinsinMi")) && planNafizeSil(ben, plan.id, n.id)} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {duzen && <NafizePenceresi plan={plan} mevcut={duzen} kapat={() => setDuzen(undefined)} />}
    </div>
  );
}

/* Belge ve çıktı: gelişmelerin altında alt başlık ve satırlar; düzenlerken şerit. */
export function NafizeBelgede({ plan, pbId, duzen }: { plan: NextDayPlan; pbId: string; duzen: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [acik, setAcik] = useState<PlanNafize>();
  const liste = baslikNafizeleri(plan, pbId);
  if (!liste.length) return null;
  const yazar = duzen && !!ben && planIcerikDuzenler(ben, plan);
  return (
    <>
      <p className="alt-baslik" data-nafizeler={pbId}>
        {nafizeBasligi(liste.length)}
      </p>
      {liste.map((n) => {
        const [bir, iki] = nafizeSatirlari(v, n);
        return (
          <BelgeSatiri key={n.id} duzen={yazar} serit={<SatirSeridi duzenle={() => setAcik(n)} cikar={() => ben && confirm(t("silinsinMi")) && planNafizeSil(ben, plan.id, n.id)} />}>
            <div data-nafize={n.id}>
              <p>{bir}</p>
              {iki && <p>{iki}</p>}
            </div>
          </BelgeSatiri>
        );
      })}
      {acik && <NafizePenceresi plan={plan} mevcut={acik} kapat={() => setAcik(undefined)} />}
    </>
  );
}
