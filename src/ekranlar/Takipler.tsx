import { Binoculars, Plus } from "lucide-react";
import { useState } from "react";
import { Bos, Kart, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { metin, useDil } from "../dil";
import { takipKaydet } from "../eylemler";
import { TAKIP_TUR_ADI } from "../etiketler";
import { bugun } from "../tarih";
import { TAKIP_TURLERI, useVeri, type Durum, type Kisi, type NextDayPlan, type Oneri, type TakipTuru } from "../veri";
import { oneriArsivde, oneriSonGunu } from "../oneriPlanlari";
import { git } from "../yol";
import { OneriKarti } from "./oneri/OneriKarti";
import PlanaEkle from "./oneri/PlanaEkle";
import { oneriGorebilir, planIcerikDuzenler, takipEkleyebilir, yapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/**
 * Takipler (`#/takipler`): muhabirin izlediği güncel konular. Takip
 * önerinin aşaması (durum "takip"): muhabir "Yeni takip"le açar, öneri
 * ayrıntısında gelişme satırı ekler; Planlama ve Yönetim bütün muhabirlerinkini
 * görür, plan ekranından plana alır. Eski düzenin ayrı takip kayıtları
 * açılışta takip önerisine çevriliyor (gecis.ts).
 */

const TUR_ADI = TAKIP_TUR_ADI;

export default function Takipler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const [form, setForm] = useState(false);
  const v = useVeri();
  const oneriler = takipOnerileri(ben, v);
  return (
    <>
      <SayfaBasi
        ikon={<Binoculars size={26} />}
        baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")}
        sagUc={
          takipEkleyebilir(ben) && (
            <button type="button" className="dugme" onClick={() => setForm(true)} data-takip-ekle>
              <Plus size={16} /> {t("mtEkle")}
            </button>
          )
        }
      />
      {form && <TakipFormu ben={ben} kapat={() => setForm(false)} />}
      <Kart baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")} ek={String(oneriler.length)}>
        {oneriler.length ? <TakipOnerileri ben={ben} liste={oneriler} /> : <Bos metin={t("mtYok")} />}
      </Kart>
    </>
  );
}

function TakipFormu({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ konu: "", aciklama: "", tur: "olay" as TakipTuru, tarih: "" });
  const kaydet = () => {
    if (takipKaydet(ben, f)) {
      bildir(t("mtKaydedildi"));
      kapat();
    }
  };
  return (
    <Kart baslik={t("mtEkle")}>
      <div className="form" data-takip-formu>
        <div className="satir">
          <label>
            {t("mtTur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as TakipTuru })} data-takip-tur>
              {TAKIP_TURLERI.map((x) => (
                <option key={x} value={x}>
                  {t(TUR_ADI[x])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("mtTarih")} <span className="ipucu">{t("varsa")}</span>
            <input type="date" value={f.tarih} min={bugun()} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-takip-tarih />
          </label>
        </div>
        <label>
          {t("mtKonu")}
          <input {...icerikAlani} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} placeholder={metin("mtKonuIpucu", "ar")} data-takip-konu />
        </label>
        <label>
          {t("mtAciklama")} <span className="ipucu">{t("varsa")}</span>
          <textarea {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} data-takip-aciklama />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" disabled={!f.konu.trim()} onClick={kaydet} data-takip-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}

/* Takip aşamasındaki öneriler; arşive düşen (son satırdan 2 gün sonra) listede yok. */
export const takipOnerileri = (ben: Kisi, d: Durum) =>
  d.oneriler.filter((o) => o.durum === "takip" && oneriGorebilir(ben, o) && !oneriArsivde(o, bugun())).sort((a, b) => oneriSonGunu(b).localeCompare(oneriSonGunu(a)) || b.zaman.localeCompare(a.zaman));

/** Takip önerilerinin kartları; plan verilince planlamacı takibi oradan plana alır. */
function TakipOnerileri({ ben, liste, plan }: { ben: Kisi; liste: Oneri[]; plan?: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [ekle, setEkle] = useState<string | null>(null);
  const ekler = !!plan && yapabilir(ben, "oneriDegerlendir") && planIcerikDuzenler(ben, plan);
  return (
    <div className="oneri-kartlari" data-takip-onerileri>
      {liste.map((o) => (
        <div key={o.id}>
          <OneriKarti
            oneri={o}
            d={v}
            ac={() => git(`oneriler/${o.id}`)}
            eylemler={
              ekler && (
                <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setEkle(ekle === o.id ? null : o.id)} data-takip-plana-ekle={o.id}>
                  {t("planaEkle")}
                </button>
              )
            }
          />
          {ekle === o.id && plan && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setEkle(null)} />}
        </div>
      ))}
    </div>
  );
}

/*
 * Plan ekranında takipler gelen önerilerden ayrı pencerede: yalnız gelişme
 * bildiren takip öneri listesini kalabalıklaştırmasın.
 */
export function PlanTakipleri({ ben, plan }: { ben: Kisi; plan?: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const oneriler = takipOnerileri(ben, v);
  return oneriler.length ? <TakipOnerileri ben={ben} liste={oneriler} plan={plan} /> : <Bos metin={t("mtYok")} />;
}

/** Muhabirin profilinde açık takipleri: Planlama muhabire bakarken neyi izlediğini de görsün. */
export function ProfilTakipleri({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const oneriler = takipOnerileri(ben, v).filter((o) => o.muhabirId === kisi.id);
  if (!oneriler.length || ben.id === kisi.id) return null;
  return (
    <Kart baslik={t("mMuhabirTakipleri")} ek={String(oneriler.length)}>
      <div data-profil-takipleri>
        <TakipOnerileri ben={ben} liste={oneriler} />
      </div>
    </Kart>
  );
}
