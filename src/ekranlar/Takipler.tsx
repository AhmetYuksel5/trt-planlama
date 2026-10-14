import { Binoculars, BriefcaseBusiness, CircleUser, Pencil, Plus, RotateCcw, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar, Bos, Icerik, Kart, Rozet, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../bilesenler/Tablolar";
import { WhatsAppDugmesi } from "../bilesenler/WhatsApp";
import { metin, tarihYaz, useDil } from "../dil";
import { takipKapat, takipKaydet, takipSil } from "../eylemler";
import { TAKIP_TUR_ADI, sehirAdi } from "../etiketler";
import { bugun } from "../tarih";
import { TAKIP_BICIMI, TAKIP_TURLERI, kisiBul, useVeri, type Kisi, type Takip, type TakipTuru } from "../veri";
import { muhabireOneriGonderebilir, takipEkleyebilir, takipGorebilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { MuhabireOneriPenceresi } from "./oneri/Yazisma";

/**
 * Takipler (`#/takipler`): muhabirin izlediği güncel konular. Muhabir
 * kendi takiplerini girer ("takip ediyorum"); Planlama ve Yönetim bütün
 * muhabirlerinkini görür, muhabire WhatsApp'tan ulaşır ya da takibi tek
 * basışla muhabire iş önerisine (paket ya da başka haber türü) çevirir.
 * Takip iş değil bilgilendirme: karar düğmesi yok, dönüşünce öneri
 * bilinen akışa (muhabirin kabulü, Planlama'nın değerlendirmesi) giriyor.
 */

const TUR_ADI = TAKIP_TUR_ADI;

/* Yaklaşan günlü takip önce, süregelenler en son eklenen önce. */
const sirala = (a: Takip, b: Takip) => (a.tarih ?? "9999").localeCompare(b.tarih ?? "9999") || b.zaman.localeCompare(a.zaman);

export default function Takipler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const muhabir = ben.birim === "muhabir";
  const [form, setForm] = useState<Takip | "yeni" | null>(null);
  const v = useVeri();
  const liste = v.takipler.filter((x) => takipGorebilir(ben, x)).sort(sirala);
  const acik = liste.filter((x) => !x.kapandi);
  const biten = liste.filter((x) => x.kapandi);
  return (
    <>
      <SayfaBasi
        ikon={<Binoculars size={26} />}
        baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")}
        sagUc={
          takipEkleyebilir(ben) && (
            <button type="button" className="dugme" onClick={() => setForm("yeni")} data-takip-ekle>
              <Plus size={16} /> {t("mtEkle")}
            </button>
          )
        }
      />
      {form && <TakipFormu ben={ben} mevcut={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
      <Kart baslik={t(muhabir ? "mTakiplerim" : "mMuhabirTakipleri")} ek={String(acik.length)}>
        {acik.length ? (
          <div className="takip-listesi" data-takipler>
            {acik.map((x) => (
              <TakipKarti key={x.id} ben={ben} takip={x} duzenle={() => setForm(x)} />
            ))}
          </div>
        ) : (
          <Bos metin={t("mtYok")} />
        )}
      </Kart>
      {biten.length > 0 && (
        <Kart baslik={t("mtBiten")} ek={String(biten.length)}>
          <div className="takip-listesi" data-biten-takipler>
            {biten.map((x) => (
              <TakipKarti key={x.id} ben={ben} takip={x} />
            ))}
          </div>
        </Kart>
      )}
    </>
  );
}

function TakipFormu({ ben, mevcut, kapat }: { ben: Kisi; mevcut?: Takip; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ konu: mevcut?.konu ?? "", aciklama: mevcut?.aciklama ?? "", tur: mevcut?.tur ?? ("olay" as TakipTuru), tarih: mevcut?.tarih ?? "" });
  const kaydet = () => {
    if (takipKaydet(ben, { id: mevcut?.id, ...f })) {
      bildir(t("mtKaydedildi"));
      kapat();
    }
  };
  return (
    <Kart baslik={t(mevcut ? "duzenle" : "mtEkle")}>
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
            <input type="date" value={f.tarih} min={mevcut?.tarih && mevcut.tarih < bugun() ? mevcut.tarih : bugun()} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-takip-tarih />
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

function TakipKarti({ ben, takip: x, duzenle }: { ben: Kisi; takip: Takip; duzenle?: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [donustur, setDonustur] = useState(false);
  const muhabir = kisiBul(v, x.muhabirId);
  const kendi = ben.id === x.muhabirId;
  const isler = v.oneriler.filter((o) => o.takipId === x.id);
  return (
    <article className={`kayit takip${x.kapandi ? " soluk" : ""}`} data-takip={x.id}>
      <div className="kayit-bas">
        {!kendi && <Avatar kisi={muhabir} boy="kucuk" />}
        <div>
          {!kendi && muhabir && (
            <small>
              <a href={`#/muhabirler/${muhabir.id}`}>{ad(muhabir)}</a> · {t(sehirAdi(x.sehir))}
            </small>
          )}
          <Icerik blok>
            <b>{x.konu}</b>
          </Icerik>
          {x.aciklama && (
            <Icerik blok className="kayit-metin">
              {x.aciklama}
            </Icerik>
          )}
          <small>
            <Rozet>{t(TUR_ADI[x.tur])}</Rozet>
            <span>{x.tarih ? tarihYaz(x.tarih, dil, "tam") : t("mtSurekli")}</span>
            {isler.map((o) => (
              <a key={o.id} href={`#/oneriler/${o.id}`} data-takip-isi={o.id}>
                {t(o.bicim === TAKIP_BICIMI ? "mtOneriyle" : "mtDonustu")} · <OneriDurumRozeti oneri={o} />
              </a>
            ))}
          </small>
        </div>
        <div className="islemler">
          {!kendi && muhabir && <WhatsAppDugmesi telefon={muhabir.telefon} />}
          {!kendi && muhabir && (
            <a className="dugme dugme-sade dugme-ikon" href={`#/muhabirler/${muhabir.id}`} title={t("mtProfil")} aria-label={t("mtProfil")}>
              <CircleUser size={16} />
            </a>
          )}
        </div>
      </div>
      <div className="dugmeler ara-ust">
        {!kendi && !x.kapandi && muhabireOneriGonderebilir(ben, v) && (
          <button type="button" className="dugme dugme-kucuk" onClick={() => setDonustur(true)} data-takip-donustur>
            <BriefcaseBusiness size={14} /> {t("mtIseDonustur")}
          </button>
        )}
        {kendi && duzenle && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={duzenle} data-takip-duzenle>
            <Pencil size={14} /> {t("duzenle")}
          </button>
        )}
        {kendi && (
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => takipKapat(ben, x.id, !x.kapandi)} data-takip-bitir>
            {x.kapandi ? <RotateCcw size={14} /> : <Square size={14} />} {t(x.kapandi ? "mtYenidenAc" : "mtBitir")}
          </button>
        )}
        {kendi && (
          <button type="button" className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && takipSil(ben, x.id)} data-takip-sil>
            <Trash2 size={14} /> {t("sil")}
          </button>
        )}
      </div>
      {donustur && <MuhabireOneriPenceresi ben={ben} takip={x} kapat={() => setDonustur(false)} />}
    </article>
  );
}

/** Muhabirin profilinde açık takipleri: Planlama muhabire bakarken neyi izlediğini de görsün. */
export function ProfilTakipleri({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = v.takipler.filter((x) => x.muhabirId === kisi.id && !x.kapandi && takipGorebilir(ben, x)).sort(sirala);
  if (!liste.length || ben.id === kisi.id) return null;
  return (
    <Kart baslik={t("mMuhabirTakipleri")} ek={String(liste.length)}>
      <div className="takip-listesi" data-profil-takipleri>
        {liste.map((x) => (
          <TakipKarti key={x.id} ben={ben} takip={x} />
        ))}
      </div>
    </Kart>
  );
}
