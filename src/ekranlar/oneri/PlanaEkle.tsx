import { useState } from "react";
import { Icerik, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { oneriPlanaEkle } from "../../eylemler";
import { kalacakPlan } from "../../planCiftleri";
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
 * Öneriler sayfasından açıldıysa yalnız üzerinde çalışılan planlar (bugün,
 * yarın ve önerinin günü; gün başına tek plan): bütün geçmiş planlar ve
 * aynı güne açılmış çift planlar listede karışıklık yapıyordu. Haftalık
 * öneride Next Day değil haftanın gündemi: gün ve dosya soruluyor.
 */
export default function PlanaEkle({ ben, oneri, planId, kapat }: { ben: Kisi; oneri: Oneri; planId?: string; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  if (!planId && oneri.hafta) {
    const hafta = v.haftalik.find((h) => h.baslangic === oneri.hafta);
    if (!hafta || !haftalikDuzenler(ben, hafta)) return <p className="bos-kucuk">{t("duzenlenebilirPlanYok")}</p>;
    return <GundemeEkle ben={ben} hafta={hafta} oneri={oneri} kapat={kapat} />;
  }
  const B = bugun();
  const gunler = planId ? [] : [...new Set([B, gunEkle(B, 1), ...(oneri.hedefTarih && oneri.hedefTarih >= B ? [oneri.hedefTarih] : [])])].sort();
  const planlar = (
    planId
      ? v.planlar.filter((p) => p.id === planId)
      : gunler.map((g) => {
          const l = v.planlar.filter((p) => p.tarih === g);
          return l.length > 1 ? kalacakPlan(v, l) : l[0];
        })
  ).filter((p): p is NextDayPlan => !!p && planIcerikDuzenler(ben, p));
  return <NextDayeEkle ben={ben} oneri={oneri} planlar={planlar} kapat={kapat} />;
}

function NextDayeEkle({ ben, oneri, planlar, kapat }: { ben: Kisi; oneri: Oneri; planlar: NextDayPlan[]; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ilkPlan = planlar.find((p) => p.tarih === oneri.hedefTarih) ?? planlar.find((p) => p.tarih === gunEkle(bugun(), 1)) ?? planlar[0];
  const [pId, setPId] = useState(ilkPlan?.id ?? "");
  const gunAdi = (p: NextDayPlan) => (p.tarih === bugun() ? `${t("bugun")} · ` : p.tarih === gunEkle(bugun(), 1) ? `${t("yarin")} · ` : "");
  const plan = planlar.find((p) => p.id === pId);

  const plandakiler = plan?.basliklar.map((b) => b.baslikId) ?? [];
  // Önerinin başlığı listede yoksa (pasif) seçici ilk seçeneği gösterir ama kayıt görünmeyen başlığa giderdi; ekranla kayıt ayrışmasın.
  const secilebilir = (id?: string) => !!id && v.basliklar.some((b) => b.id === id && (b.aktif || plandakiler.includes(id)));
  const [baslikId, setBaslikId] = useState(secilebilir(oneri.baslikId) ? oneri.baslikId! : "yeni");
  const [yeniBaslik, setYeniBaslik] = useState(oneri.haberBasligi);
  const talimat = !!oneri.talimatVeren;
  const [paket, setPaket] = useState(!!oneri.paketBasligi);
  const [muhabirId, setMuhabirId] = useState("");

  if (!plan) return <p className="bos-kucuk">{t("duzenlenebilirPlanYok")}</p>;

  const ekle = () => {
    const tamam = oneriPlanaEkle(ben, oneri.id, {
      planId: plan.id,
      baslikId: baslikId === "yeni" ? undefined : baslikId,
      yeniBaslik: baslikId === "yeni" ? yeniBaslik : undefined,
      paketOlustur: talimat || paket,
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
            <select value={pId} onChange={(e) => setPId(e.target.value)} data-pe-plan>
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
            <optgroup label={t("plandakiBasliklar")}>
              {plan.basliklar.map((b) => (
                <option key={b.baslikId} value={b.baslikId}>
                  {v.basliklar.find((x) => x.id === b.baslikId)?.ad}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("baslikHavuzu")}>
              {v.basliklar
                .filter((b) => b.aktif && !plandakiler.includes(b.id))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
            </optgroup>
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
      {oneri.paketBasligi && !talimat && (
        <label className="secim">
          <input type="checkbox" checked={paket} onChange={(e) => setPaket(e.target.checked)} />
          {t("paketOnerisiOlustur")}: <b>
            <Icerik>{oneri.paketBasligi}</Icerik>
          </b>
        </label>
      )}
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
