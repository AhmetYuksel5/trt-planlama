import { useState, type ReactNode } from "react";
import { bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { metin, useDil } from "../../dil";
import { KANAL_ADI, KAYNAK_ADI, TUR_ADI, ulkeAdi } from "../../etiketler";
import { oneriGonder, ulkesi, type OneriGirdisi } from "../../eylemler";
import { ICERIK_TURLERI, KANALLAR, KAYNAK_TURLERI, ULKELER, kisiBul, useVeri, type Bicim, type IcerikTuru, type Kanal, type KaynakTuru, type Kisi, type Ulke } from "../../veri";
import { BicimSecici, MuhabirSecici } from "../nextday/Formlar";

/*
 * Önerinin alanları tek yerde: öneri sayfası (#/oneriler/yeni) ile plan
 * ekranlarındaki "Öneri ekle" aynı formu kullanıyor. Öneri yalnız sistemden
 * gelmiyor; Planlama telefonla, mesajla ya da yüz yüze geleni muhabir adına,
 * ajans, resmî duyuru ya da başka birimden geleni muhabir dışı kaynak olarak
 * giriyor. Muhabir kaynak seçmiyor: kendi adına gönderiyor.
 */

export type KaynakSecimi = "muhabir" | "baska";

export interface OneriFormDurumu {
  kaynak: KaynakSecimi;
  muhabirId: string;
  kaynakTuru: KaynakTuru;
  kaynakAdi: string;
  kanal: Kanal;
  ulke: Ulke;
  haberBasligi: string;
  gelisme: string;
  paketBasligi: string;
  tur: IcerikTuru;
  bicim: Bicim;
  sahaGerekli: boolean;
}

export const oneriFormuBaslangic = (ben: Kisi, kanal: Kanal): OneriFormDurumu => {
  const muhabir = ben.birim === "muhabir";
  return {
    kaynak: "muhabir",
    muhabirId: muhabir ? ben.id : "",
    kaynakTuru: "ajans",
    kaynakAdi: "",
    kanal: muhabir ? "sistem" : kanal,
    ulke: muhabir ? ulkesi(ben.sehir) : "turkiye",
    haberBasligi: "",
    gelisme: "",
    paketBasligi: "",
    tur: "haber",
    bicim: "pkg",
    sahaGerekli: false,
  };
};

export const oneriFormuGecerli = (f: OneriFormDurumu) => (f.kaynak === "baska" || !!f.muhabirId) && !!f.haberBasligi.trim() && !!f.gelisme.trim();

/** Formdan eyleme: seçilmeyen kaynağın alanları gitmiyor, yoksa muhabir adına girilen öneri ajans gibi de görünürdü. */
export const oneriFormuGirdisi = (f: OneriFormDurumu): Omit<OneriGirdisi, "hedefTarih" | "hafta"> => ({
  muhabirId: f.kaynak === "muhabir" ? f.muhabirId : undefined,
  kaynakTuru: f.kaynak === "baska" ? f.kaynakTuru : undefined,
  kaynakAdi: f.kaynak === "baska" ? f.kaynakAdi.trim() : undefined,
  kanal: f.kanal,
  ulke: f.ulke,
  haberBasligi: f.haberBasligi.trim(),
  gelisme: f.gelisme.trim(),
  paketBasligi: f.paketBasligi.trim() || undefined,
  tur: f.tur,
  bicim: f.bicim,
  sahaGerekli: f.sahaGerekli,
});

const ELLE_KANALLAR = KANALLAR.filter((k) => k !== "sistem");
const BASKA_KAYNAKLAR = KAYNAK_TURLERI.filter((k) => k !== "muhabir");

export function OneriAlanlari({ ben, f, setF, hedef }: { ben: Kisi; f: OneriFormDurumu; setF: (f: OneriFormDurumu) => void; hedef?: ReactNode }) {
  const { t } = useDil();
  const v = useVeri();
  const muhabir = ben.birim === "muhabir";
  const kanalSecici = (
    <label>
      {t("kanal")}
      <select value={f.kanal} onChange={(e) => setF({ ...f, kanal: e.target.value as Kanal })}>
        {ELLE_KANALLAR.map((k) => (
          <option key={k} value={k}>
            {t(KANAL_ADI[k])}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      {!muhabir && (
        <>
          <div>
            <div className="alan-etiket">{t("kaynak")}</div>
            <div className="sekmeler ara-ust" role="tablist" aria-label={t("kaynak")}>
              <button type="button" role="tab" aria-selected={f.kaynak === "muhabir"} className={f.kaynak === "muhabir" ? "acik" : ""} onClick={() => setF({ ...f, kaynak: "muhabir" })}>
                {t("kyMuhabir")}
              </button>
              <button type="button" role="tab" aria-selected={f.kaynak === "baska"} className={f.kaynak === "baska" ? "acik" : ""} onClick={() => setF({ ...f, kaynak: "baska" })}>
                {t("baskaKaynak")}
              </button>
            </div>
          </div>
          <div className="satir">
            {f.kaynak === "muhabir" ? (
              <label>
                {t("muhabir")}
                <MuhabirSecici
                  deger={f.muhabirId}
                  degistir={(id) => {
                    const k = kisiBul(v, id);
                    setF({ ...f, muhabirId: id, ulke: k ? ulkesi(k.sehir) : f.ulke });
                  }}
                />
              </label>
            ) : (
              <>
                <label>
                  {t("kaynakTuru")}
                  <select value={f.kaynakTuru} onChange={(e) => setF({ ...f, kaynakTuru: e.target.value as KaynakTuru })}>
                    {BASKA_KAYNAKLAR.map((k) => (
                      <option key={k} value={k}>
                        {t(KAYNAK_ADI[k])}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("kaynakAdi")}
                  <input dir="auto" value={f.kaynakAdi} onChange={(e) => setF({ ...f, kaynakAdi: e.target.value })} placeholder={t("kaynakAdiIpucu")} />
                </label>
              </>
            )}
            {kanalSecici}
          </div>
        </>
      )}
      <div className="satir">
        {hedef}
        <label>
          {t("ulke")}
          <select value={f.ulke} onChange={(e) => setF({ ...f, ulke: e.target.value as Ulke })}>
            {ULKELER.map((u) => (
              <option key={u} value={u}>
                {t(ulkeAdi(u))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tur")}
          <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("haberTuru")}
          <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
        </label>
      </div>
      <label>
        {t("haberBasligi")}
        <input {...icerikAlani} value={f.haberBasligi} onChange={(e) => setF({ ...f, haberBasligi: e.target.value })} placeholder={metin("haberBasligiIpucu", "ar")} />
      </label>
      <label>
        {t("gelismeAciklama")}
        <textarea {...icerikAlani} value={f.gelisme} onChange={(e) => setF({ ...f, gelisme: e.target.value })} placeholder={metin("gelismeIpucu", "ar")} />
      </label>
      <label>
        {t("onerilenPaketBasligi")} <span className="ipucu">{t("varsa")}</span>
        <input {...icerikAlani} value={f.paketBasligi} onChange={(e) => setF({ ...f, paketBasligi: e.target.value })} />
      </label>
      <label className="secim">
        <input type="checkbox" checked={f.sahaGerekli} onChange={(e) => setF({ ...f, sahaGerekli: e.target.checked })} />
        {t("sahaGerekli")}
      </label>
    </>
  );
}

/**
 * Plan ekranındaki "Öneri ekle": hedef sabit (Next Day'de planın günü,
 * haftalıkta haftanın Cumartesi'si). Öneri her durumda listeye "yeni"
 * olarak düşüyor; "hemen" düğmesi kaydedip plana ekleme formunu açıyor,
 * çünkü toplantıda karar çoğu zaman o an veriliyor.
 */
export function ElleOneriFormu({
  ben,
  hedefTarih,
  hafta,
  hemenMetni,
  kaydet,
  kapat,
}: {
  ben: Kisi;
  hedefTarih?: string;
  hafta?: string;
  hemenMetni: string;
  kaydet: (id: string, hemen: boolean) => void;
  kapat: () => void;
}) {
  const { t } = useDil();
  const [f, setF] = useState(() => oneriFormuBaslangic(ben, "telefon"));
  const gecerli = oneriFormuGecerli(f);
  const gonder = (hemen: boolean) => {
    const id = oneriGonder(ben, { ...oneriFormuGirdisi(f), hedefTarih, hafta });
    if (id) {
      bildir(t("bOneriKaydedildi"));
      kaydet(id, hemen);
    }
  };
  return (
    <div className="form form-kutu ara-alt-2 elle-oneri">
      <OneriAlanlari ben={ben} f={f} setF={setF} />
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => gonder(false)} disabled={!gecerli}>
          {t("kaydet")}
        </button>
        <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => gonder(true)} disabled={!gecerli}>
          {hemenMetni}
        </button>
      </div>
    </div>
  );
}
