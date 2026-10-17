import { useState } from "react";
import { useDil } from "../dil";
import { sehirAdi, sehirListesi, sehirUlkesi, ulkeAdi } from "../etiketler";
import type { YeniSehir } from "../eylemler";
import { ULKELER, useVeri, type Sehir, type Ulke } from "../veri";
import { Pencere, icerikAlani } from "./Parcalar";

/*
 * Şehir seçimi her yerde aynı: yerleşikler ve eklenenler, sonda "+ Yeni
 * şehir…". Profil formu, Hesaplar'daki satır ve kişi düzenleme penceresi bunu
 * kullanıyor; şehir bir yerde eklenince öbürlerinde de seçilebiliyor.
 */
export const YENI_SEHIR = "__yeni";

export function SehirSecenekleri() {
  const { t } = useDil();
  useVeri();
  return (
    <>
      {sehirListesi().map((s) => (
        <option key={s} value={s}>
          {sehirAdi(s)} · {t(ulkeAdi(sehirUlkesi(s)))}
        </option>
      ))}
      <option value={YENI_SEHIR}>{t("yeniSehir")}</option>
    </>
  );
}

export const bosYeniSehir = (s: Sehir): YeniSehir => ({ ar: "", tr: "", en: "", ulke: sehirUlkesi(s) });

export function YeniSehirAlanlari({ yeni, degistir }: { yeni: YeniSehir; degistir: (y: YeniSehir) => void }) {
  const { t } = useDil();
  return (
    <div className="satir" data-yeni-sehir>
      <label>
        {t("sehirAdiAr")}
        <input {...icerikAlani} value={yeni.ar} onChange={(e) => degistir({ ...yeni, ar: e.target.value })} placeholder="الدوحة" autoFocus data-yeni-sehir-ar />
      </label>
      <label>
        {t("sehirAdiTr")}
        <input value={yeni.tr} onChange={(e) => degistir({ ...yeni, tr: e.target.value })} data-yeni-sehir-tr />
      </label>
      <label>
        {t("sehirAdiEn")}
        <input dir="ltr" value={yeni.en} onChange={(e) => degistir({ ...yeni, en: e.target.value })} data-yeni-sehir-en />
      </label>
      <label>
        {t("ulke")}
        <select value={yeni.ulke} onChange={(e) => degistir({ ...yeni, ulke: e.target.value as Ulke })} data-yeni-sehir-ulke>
          {ULKELER.map((u) => (
            <option key={u} value={u}>
              {t(ulkeAdi(u))}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/*
 * Satır içi seçim (Hesaplar): seçilen şehir hemen kaydedilir; yeni şehir
 * küçük pencerede yazılır, pencere kaydedince kapanır.
 */
export function SatirSehirSecimi({ deger, kaydet, etiket }: { deger: Sehir; kaydet: (s: Sehir | YeniSehir) => boolean; etiket: string }) {
  const { t } = useDil();
  const [yeni, setYeni] = useState<YeniSehir | null>(null);
  return (
    <>
      <select
        className="girdi satir-secim"
        value={deger}
        aria-label={etiket}
        data-satir-sehir
        onChange={(e) => {
          if (e.target.value === YENI_SEHIR) setYeni(bosYeniSehir(deger));
          else kaydet(e.target.value);
        }}
      >
        <SehirSecenekleri />
      </select>
      {yeni && (
        <Pencere baslik={t("yeniSehir")} alt={etiket} kapat={() => setYeni(null)}>
          <div className="form">
            <YeniSehirAlanlari yeni={yeni} degistir={setYeni} />
            <div className="form-alt">
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setYeni(null)}>
                {t("iptal")}
              </button>
              <button type="button" className="dugme dugme-kucuk" disabled={!yeni.ar.trim()} onClick={() => kaydet(yeni) && setYeni(null)} data-yeni-sehir-kaydet>
                {t("kaydet")}
              </button>
            </div>
          </div>
        </Pencere>
      )}
    </>
  );
}
