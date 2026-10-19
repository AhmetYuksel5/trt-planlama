import { useState } from "react";
import { Icerik, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { oneriPlanaEkle } from "../../eylemler";
import { kalacakPlan } from "../../planCiftleri";
import { adiylaBaslik, ndBaslikSecenekleri } from "../../baslikSecimi";
import { acikGunPlanlari, oneriGunde, oneriHaftada } from "../../oneriPlanlari";
import { bugun, gunEkle } from "../../tarih";
import { useVeri, type Kisi, type NextDayPlan, type Oneri } from "../../veri";
import { haftalikDuzenler, planIcerikDuzenler } from "../../yetki";
import { GundemeEkle } from "../haftalik/Plan";
import { MuhabirSecici } from "../nextday/Formlar";

/**
 * Öneriyi plana ekleme formu.
 *
 * Promptun 4.2 maddesi: öneri mevcut bir haber başlığına bağlanabilsin ya
 * da yeni başlık oluşturabilsin. Varsayılan seçim önerinin bağlı olduğu
 * başlık, yoksa önerinin kendi başlığıyla yeni başlık. Aynı ülkenin
 * plandaki başlığı varsayılan olmuyor: başka muhabirin haberi olabilir,
 * fark edilmeden eklenen öneri onun başlığına girip muhabiri de oraya
 * yazıyordu. Mevcut başlığa bağlamak elle seçiliyor. Paket başlığı önerilmişse paket
 * önerisi de doğuyor; onu kapatmak yalnız gelişmeyi ekliyor.
 *
 * Yönetici talimatında muhabir yok: Planlama burada atıyor. Talimat bir
 * haber siparişi olduğu için paket her zaman doğuyor ve öncelikli.
 */
/*
 * Hangi planın seçeneği çıkıyor: plan ekranından açıldıysa yalnız o plan.
 * Öneriler sayfasından açıldıysa önerinin günlerine (aralığına) düşen
 * çalışılan Next Day planları (gün başına bir) ve haftası kesişen haftalık
 * plan; ikisi de varsa üstte Next Day / Weekly seçimi. Haftalık hedefte
 * gün ve dosya soruluyor (GundemeEkle). Önerinin günü çalışılan planlara
 * düşmüyorsa bugünün ve yarının planı.
 */
export default function PlanaEkle({ ben, oneri, planId, kapat }: { ben: Kisi; oneri: Oneri; planId?: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const tekGun = (l: NextDayPlan[]) =>
    [...new Set(l.map((p) => p.tarih))].sort().map((g) => {
      const ayni = l.filter((p) => p.tarih === g);
      return ayni.length > 1 ? kalacakPlan(v, ayni) : ayni[0];
    });
  // Haftanın gündemi: önerinin günleri bu haftaya düşüyor ve henüz gündemde değil.
  const hafta = planId ? undefined : v.haftalik.find((h) => oneriHaftada(oneri, h) && haftalikDuzenler(ben, h) && !h.kalemler.some((k) => k.oneriId === oneri.id));
  const gunlerinde = planId || (oneri.hafta && !oneri.hedefTarih) ? [] : acikGunPlanlari(v).filter((p) => oneriGunde(oneri, p.tarih));
  const planlar = (
    planId
      ? v.planlar.filter((p) => p.id === planId)
      : oneri.hafta && !oneri.hedefTarih
        ? []
        : gunlerinde.length || hafta
          ? tekGun(gunlerinde)
          : // Önerinin günü çalışılan planlara düşmüyorsa Planlama yine bugünün ya da yarının planına alabilsin.
            tekGun(v.planlar.filter((p) => p.tarih === B || p.tarih === gunEkle(B, 1)))
  ).filter((p) => planIcerikDuzenler(ben, p));
  const [secim, setSecim] = useState<"nextday" | "haftalik">(planlar.length ? "nextday" : "haftalik");
  if (!planlar.length && !hafta) return <p className="bos-kucuk">{t("duzenlenebilirPlanYok")}</p>;
  return (
    <>
      {planlar.length > 0 && hafta && (
        <div className="sekmeler ara-alt-2" role="tablist" data-pe-hedef>
          {(["nextday", "haftalik"] as const).map((x) => (
            <button key={x} type="button" role="tab" aria-selected={secim === x} className={`${secim === x ? "acik" : ""}`} onClick={() => setSecim(x)} data-pe-hedef-secim={x}>
              {t(x === "nextday" ? "mNextday" : "mHaftalik")}
            </button>
          ))}
        </div>
      )}
      {secim === "haftalik" && hafta ? <GundemeEkle ben={ben} hafta={hafta} oneri={oneri} kapat={kapat} /> : <NextDayeEkle ben={ben} oneri={oneri} planlar={planlar} kapat={kapat} />}
    </>
  );
}

function NextDayeEkle({ ben, oneri, planlar, kapat }: { ben: Kisi; oneri: Oneri; planlar: NextDayPlan[]; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ilkPlan = planlar.find((p) => oneriGunde(oneri, p.tarih)) ?? planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0];
  const [pId, setPId] = useState(ilkPlan?.id ?? "");
  const gunAdi = (p: NextDayPlan) => (p.tarih === bugun() ? `${t("bugun")} · ` : p.tarih === gunEkle(bugun(), 1) ? `${t("yarin")} · ` : "");
  const plan = planlar.find((p) => p.id === pId);

  // Seçenekler planın başlıkları ve dünün başlıkları (baslikSecimi.ts); önerinin kendi dosyası onların dışındaysa ayrıca.
  const secenek = (p?: NextDayPlan) => {
    const { plandaki, onceki } = p ? ndBaslikSecenekleri(v, p) : { plandaki: [], onceki: [] };
    const kendi = v.basliklar.find((b) => b.id === oneri.baslikId && b.aktif && ![...plandaki, ...onceki].some((x) => x.id === b.id));
    return { plandaki, onceki, kendi };
  };
  /*
   * Varsayılan: önerinin dosyası, yoksa plandaki aynı adlı başlık, yoksa yeni başlık.
   * Aynı ülkenin başlığı varsayılan değil (başka muhabirin haberi olabilir). Önerinin
   * başlığı seçeneklerde yoksa (pasif) yine yeni: seçici başka seçeneği gösterip kayıt
   * görünmeyen başlığa gitmesin.
   */
  const varsayilan = (p?: NextDayPlan) => {
    const { plandaki, onceki, kendi } = secenek(p);
    const hepsi = [...plandaki, ...onceki, ...(kendi ? [kendi] : [])];
    if (oneri.baslikId && hepsi.some((b) => b.id === oneri.baslikId)) return oneri.baslikId;
    const ayni = adiylaBaslik({ basliklar: plandaki }, oneri.haberBasligi);
    return ayni?.id ?? "yeni";
  };
  const [baslikId, setBaslikId] = useState(() => varsayilan(plan));
  const [yeniBaslik, setYeniBaslik] = useState(oneri.haberBasligi);
  const talimat = !!oneri.talimatVeren;
  // "Live" öneri plana paket değil canlı yayın olarak giriyor; strap'i yoksa Header'ıyla.
  const canli = oneri.bicim === "canli";
  const [paket, setPaket] = useState(!!oneri.paketBasligi || canli);
  // Paket istenmeyen haber: muhabir izliyor, işlerinde "yalnız takip" olarak kalıyor. Paketle birlikte seçilmiyor.
  const [takip, setTakip] = useState(false);
  const [muhabirId, setMuhabirId] = useState("");

  if (!plan) return <p className="bos-kucuk">{t("duzenlenebilirPlanYok")}</p>;
  const secenekler = secenek(plan);

  const ekle = () => {
    const tamam = oneriPlanaEkle(ben, oneri.id, {
      planId: plan.id,
      baslikId: baslikId === "yeni" ? undefined : baslikId,
      yeniBaslik: baslikId === "yeni" ? yeniBaslik : undefined,
      paketOlustur: !takip && (talimat || paket),
      yalnizTakip: takip,
      muhabirId: oneri.muhabirId ? undefined : muhabirId,
    });
    if (tamam) {
      bildir(t("bOneriPlanda", { tarih: tarihYaz(plan.tarih, dil, "kisa") }));
      kapat();
    }
  };

  return (
    <div className="form form-kutu" data-plana-ekle-formu={oneri.id}>
      <div className="satir">
        {/* Tek plan varsa seçim yok, hangi plana girdiği yazılı. */}
        {planlar.length > 1 ? (
          <label>
            {t("plan")}
            <select
              value={pId}
              onChange={(e) => {
                setPId(e.target.value);
                setBaslikId(varsayilan(planlar.find((p) => p.id === e.target.value)));
              }}
              data-pe-plan
            >
              {planlar.map((p) => (
                <option key={p.id} value={p.id}>
                  {gunAdi(p)}
                  {t("nextday")} · {tarihYaz(p.tarih, dil, "tam")}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="alan" data-pe-plan-tek={plan.id}>
            <small>{t("plan")}</small>
            <b>
              {gunAdi(plan)}
              {t("nextday")} · {tarihYaz(plan.tarih, dil, "tam")}
            </b>
          </div>
        )}
        <label>
          {t("haberBasligi")}
          <select value={baslikId} onChange={(e) => setBaslikId(e.target.value)} data-pe-baslik>
            {secenekler.plandaki.length > 0 && (
              <optgroup label={t("plandakiBasliklar")}>
                {secenekler.plandaki.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
              </optgroup>
            )}
            {secenekler.onceki.length > 0 && (
              <optgroup label={t("oncekiGununBasliklari")}>
                {secenekler.onceki.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
              </optgroup>
            )}
            {secenekler.kendi && (
              <optgroup label={t("onerininBasligi")}>
                <option value={secenekler.kendi.id}>{secenekler.kendi.ad}</option>
              </optgroup>
            )}
            <option value="yeni">+ {t("yeniBaslikOlustur")}</option>
          </select>
        </label>
      </div>
      {baslikId === "yeni" && (
        <label>
          {t("yeniBaslikAdi")}
          <input {...icerikAlani} value={yeniBaslik} onChange={(e) => setYeniBaslik(e.target.value)} data-pe-yeni />
        </label>
      )}
      {!oneri.muhabirId && (
        <label>
          {t("muhabirAta")}
          <MuhabirSecici deger={muhabirId} degistir={setMuhabirId} bosEtiket={t("atanmadi")} />
        </label>
      )}
      <div className="secim-satiri">
        {(oneri.paketBasligi || canli) && !talimat && (
          <label className="secim">
            <input
              type="checkbox"
              checked={paket && !takip}
              onChange={(e) => {
                setPaket(e.target.checked);
                if (e.target.checked) setTakip(false);
              }}
              data-pe-paket
            />
            {t(canli ? "canliOlarakEkle" : "paketOnerisiOlustur")}: <b>
              <Icerik>{oneri.paketBasligi || oneri.haberBasligi}</Icerik>
            </b>
          </label>
        )}
        {(oneri.muhabirId || muhabirId) && (
          <label className="secim">
            <input
              type="checkbox"
              checked={takip}
              onChange={(e) => {
                setTakip(e.target.checked);
                if (e.target.checked) setPaket(false);
              }}
              data-pe-yalniz-takip
            />
            {t("yalnizTakip")}
          </label>
        )}
      </div>
      <div className="form-alt">
        <button className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button className="dugme dugme-iyi" onClick={ekle} disabled={baslikId === "yeni" && !yeniBaslik.trim()} data-pe-ekle>
          {t("planaEkle")}
        </button>
      </div>
    </div>
  );
}
