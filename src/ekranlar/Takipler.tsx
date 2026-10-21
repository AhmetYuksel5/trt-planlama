import { Binoculars, Plus } from "lucide-react";
import { useState } from "react";
import { Bos, Kart, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { metin, useDil } from "../dil";
import { takipKaydet, takipOneriyeCevir } from "../eylemler";
import { BICIM_ADI, TAKIP_TUR_ADI } from "../etiketler";
import { bugun, gunEkle } from "../tarih";
import { BICIMLER, TAKIP_TURLERI, useVeri, type Bicim, type Durum, type Kisi, type NextDayPlan, type Oneri, type TakipTuru } from "../veri";
import { oneriArsivde, oneriSonGunu, takibinOnerisi } from "../oneriPlanlari";
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
    if (confirm(t("eminMisin")) && takipKaydet(ben, f)) {
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

/* Takip aşamasındaki öneriler; öneriye dönüşmüş takip (ikinci kart olurdu) listede yok. */
export const takipOnerileri = (ben: Kisi, d: Durum) =>
  d.oneriler.filter((o) => o.durum === "takip" && oneriGorebilir(ben, o) && !oneriArsivde(o, bugun()) && !takibinOnerisi(d, o)).sort((a, b) => oneriSonGunu(b).localeCompare(oneriSonGunu(a)) || b.zaman.localeCompare(a.zaman));

/** Takip önerilerinin kartları; plan verilince planlamacı takibi oradan plana alır. */
function TakipOnerileri({ ben, liste, plan }: { ben: Kisi; liste: Oneri[]; plan?: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [ekle, setEkle] = useState<string | null>(null);
  const ekler = !!plan && yapabilir(ben, "oneriDegerlendir") && planIcerikDuzenler(ben, plan);
  const [cevir, setCevir] = useState<string | null>(null);
  return (
    <div className="oneri-kartlari" data-takip-onerileri>
      {liste.map((o) => (
        <div key={o.id}>
          <OneriKarti
            oneri={o}
            d={v}
            ac={() => git(`oneriler/${o.id}`)}
            eylemler={
              ekler ? (
                <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setEkle(ekle === o.id ? null : o.id)} data-takip-plana-ekle={o.id}>
                  {t("planaEkle")}
                </button>
              ) : (
                o.muhabirId === ben.id && (
                  <button type="button" className="dugme dugme-kucuk" onClick={() => setCevir(cevir === o.id ? null : o.id)} data-takip-oneriye={o.id}>
                    {t("mtOneriyeCevir")}
                  </button>
                )
              )
            }
          />
          {ekle === o.id && plan && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setEkle(null)} />}
          {cevir === o.id && <OneriyeCevirFormu ben={ben} oneri={o} kapat={() => setCevir(null)} />}
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

/* Muhabir takibini öneriye çeviriyor: muhabirin önerisinde strap, haber türü ve gün zorunlu. */
function OneriyeCevirFormu({ ben, oneri: o, kapat }: { ben: Kisi; oneri: Oneri; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ paketBasligi: "", bicim: "pkg" as Bicim, hedefTarih: o.hedefTarih && o.hedefTarih >= bugun() ? o.hedefTarih : gunEkle(bugun(), 1) });
  const gonder = () => {
    if (!confirm(t("eminMisin"))) return;
    if (takipOneriyeCevir(ben, o.id, f)) {
      bildir(t("bOneriGonderildi"));
      kapat();
    }
  };
  return (
    <div className="form form-kutu" data-oneriye-cevir={o.id}>
      <label>
        {t("onerilenPaketBasligi")}
        <input {...icerikAlani} value={f.paketBasligi} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} placeholder={metin("mtKonuIpucu", "ar")} data-cevir-strap />
      </label>
      <div className="satir">
        <label>
          {t("haberTuru")}
          <select value={f.bicim} onChange={(e) => setF({ ...f, bicim: e.target.value as Bicim })} data-cevir-bicim>
            {BICIMLER.map((b) => (
              <option key={b} value={b}>
                {t(BICIM_ADI(b))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gun")}
          <input type="date" value={f.hedefTarih} min={bugun()} onChange={(e) => setF({ ...f, hedefTarih: e.target.value })} data-cevir-gun />
        </label>
      </div>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme" disabled={!f.paketBasligi.trim() || !f.hedefTarih} onClick={gonder} data-cevir-gonder>
          {t("oneriGonder")}
        </button>
      </div>
    </div>
  );
}
