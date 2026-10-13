import { useState } from "react";
import { Icerik, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { oneriPlanaEkle } from "../../eylemler";
import { useVeri, type Kisi, type Oneri } from "../../veri";
import { planIcerikDuzenler } from "../../yetki";
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
export default function PlanaEkle({ ben, oneri, planId, kapat }: { ben: Kisi; oneri: Oneri; planId?: string; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar = v.planlar.filter((p) => planIcerikDuzenler(ben, p)).sort((a, b) => a.tarih.localeCompare(b.tarih));
  const ilkPlan = planlar.find((p) => p.id === planId) ?? planlar.find((p) => p.tarih === oneri.hedefTarih) ?? planlar[0];
  const [pId, setPId] = useState(ilkPlan?.id ?? "");
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
        <label>
          {t("plan")}
          <select value={pId} onChange={(e) => setPId(e.target.value)} data-pe-plan>
            {planlar.map((p) => (
              <option key={p.id} value={p.id}>
                {t("nextday")} · {tarihYaz(p.tarih, dil, "tam")}
              </option>
            ))}
          </select>
        </label>
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
