import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { metin as dilMetni, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { masrafEkle, masrafOnayla, masrafSil } from "../eylemler";
import { masrafToplami, masrafYaz, paketSenaryosu, paraBirimleri, type SenaryoTuru } from "../paketMetni";
import { MASRAF_TURLERI, kisiBul, useVeri, type Kisi, type Masraf, type MasrafTuru, type Paket } from "../veri";
import { masrafGirebilir, masrafOnaylayabilir } from "../yetki";
import { HarekeliMetin } from "./Hareke";
import { Icerik, Kart, Rozet, bildir } from "./Parcalar";

const TUR_ADI: Record<SenaryoTuru, Anahtar> = { strap: "pmStrap", intro: "pt_intro", metin: "pt_metin", roportaj: "pt_roportaj", stand: "pt_stand" };

/*
 * Paketin metni yayındaki sırasıyla (paketMetni.ts → paketSenaryosu): Strap,
 * intro, metin (röportajlar içinde, aslıyla), stand. Yalnız Strap varsa (metin
 * henüz gelmedi) kart çizilmez: başlık sayfanın üstünde zaten.
 */
export function PaketMetniKarti({ paket }: { paket: Paket }) {
  const { t } = useDil();
  const l = paketSenaryosu(paket);
  if (l.length < 2) return null;
  // Kopya düz metin, kurumun yazışındaki gibi Arapça; tür adları da Arapça (çıktının dili).
  const kopyala = async () => {
    const yazi = l.map((x) => `${dilMetni(TUR_ADI[x.tur], "ar")}\n${x.asil ? `${x.asil}\n` : ""}${x.metin}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(yazi);
      bildir(t("bKopyalandi"));
    } catch {
      /* Pano izni yoksa sessiz: metin ekranda seçilebilir. */
    }
  };
  return (
    <Kart
      baslik={t("pmBaslik")}
      sagUc={
        <button type="button" className="dugme dugme-sade dugme-ikon" onClick={kopyala} title={t("pmKopyala")} aria-label={t("pmKopyala")} data-pm-kopyala>
          <Copy size={16} />
        </button>
      }
    >
      <ol className="pm-liste" data-paket-metni>
        {l.map((x) => (
          <li key={x.id} className={`pm-parca pm-${x.tur}`} data-pm-tur={x.tur}>
            <small className="pm-tur">{t(TUR_ADI[x.tur])}</small>
            {x.asil && (
              <p className="pm-asil" dir="auto">
                {x.asil}
              </p>
            )}
            <div className={x.tur === "strap" ? "pm-strap" : "metin-kutu"}>
              <Icerik blok>{x.tur === "strap" ? x.metin : <HarekeliMetin metin={x.metin} />}</Icerik>
            </div>
          </li>
        ))}
      </ol>
    </Kart>
  );
}

/** Onaylanmış ya da bekleyen masrafların salt listesi (paket sayfası, Muhasebe'nin iş satırı). */
export function MasrafListesi({ masraflar, sil }: { masraflar: Masraf[]; sil?: (id: string) => void }) {
  const { t } = useDil();
  return (
    <ul className="ms-liste" data-masraf-listesi>
      {masraflar.map((m) => (
        <li key={m.id} data-masraf={m.tur}>
          <b>{t(`ms_${m.tur}` as Anahtar)}</b>
          <span className="ms-tutar" dir="ltr">
            {m.tutar} {m.para}
          </span>
          {m.aciklama && (
            <span className="sonuk-yazi" dir="auto">
              {m.aciklama}
            </span>
          )}
          {sil && (
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => sil(m.id)} title={t("msSil")} aria-label={t("msSil")} data-masraf-sil>
              <Trash2 size={15} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/*
 * Ek masraflar (kullanıcı: muhabir girer, Planlama onaylar; "Yapıldı"nın onayı
 * masrafı da onaylar, künyeyle Muhasebe'ye gider). Onaydan sonra salt okunur.
 */
export function MasrafKarti({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const l = paket.masraflar ?? [];
  const girer = masrafGirebilir(ben, paket);
  const onaylar = masrafOnaylayabilir(ben, paket);
  const [acik, setAcik] = useState(false);
  if (!l.length && !girer) return null;
  const onay = paket.masrafOnayi;
  return (
    <Kart
      baslik={t("msMasraf")}
      sagUc={l.length > 0 && <b dir="ltr">{masrafYaz(masrafToplami(l))}</b>}
    >
      <div data-masraf-karti>
        {l.length > 0 && <MasrafListesi masraflar={l} sil={girer ? (id) => masrafSil(ben, paket.id, id) : undefined} />}
        {l.length > 0 &&
          (onay ? (
            <p className="sonuk-yazi" data-masraf-onayli>
              <Rozet ton="iyi">{t("msOnayli", { ad: ad(kisiBul(v, onay.kisiId)) })}</Rozet> {tarihYaz(onay.zaman.slice(0, 10), dil, "kisa")} {saatYaz(onay.zaman, dil)}
            </p>
          ) : (
            <p className="sonuk-yazi" data-masraf-bekliyor>
              {t("msOnayBekliyor")}
            </p>
          ))}
        {onaylar && (
          <div className="dugmeler">
            <button type="button" className="dugme dugme-iyi" onClick={() => confirm(t("msOnayOnay")) && masrafOnayla(ben, paket.id)} data-masraf-onayla>
              {t("msOnayla")}
            </button>
          </div>
        )}
        {girer &&
          (acik ? (
            <MasrafFormu ben={ben} paket={paket} kapat={() => setAcik(false)} />
          ) : (
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik(true)} data-masraf-ac>
              <Plus size={15} /> {t("msEkle")}
            </button>
          ))}
      </div>
    </Kart>
  );
}

function MasrafFormu({ ben, paket, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const paralar = paraBirimleri(v);
  const son = paket.masraflar?.at(-1)?.para;
  const [tur, setTur] = useState<MasrafTuru>("ulasim");
  const [tutar, setTutar] = useState("");
  const [para, setPara] = useState(son ?? paralar[0]);
  const [aciklama, setAciklama] = useState("");
  const sayi = Number(tutar.replace(",", "."));
  const gecerli = sayi > 0 && (tur !== "diger" || aciklama.trim());
  const ekle = () => {
    if (masrafEkle(ben, paket.id, { tur, tutar: sayi, para, aciklama })) {
      bildir(t("bMasrafEklendi"));
      kapat();
    }
  };
  return (
    <div className="form form-kutu" data-masraf-formu>
      <div className="dugmeler" role="group" aria-label={t("msMasraf")}>
        {MASRAF_TURLERI.map((x) => (
          <button key={x} type="button" className="dugme dugme-ikincil dugme-kucuk" aria-pressed={tur === x} onClick={() => setTur(x)} data-masraf-tur={x}>
            {t(`ms_${x}` as Anahtar)}
          </button>
        ))}
      </div>
      <div className="satir">
        <label>
          {t("mhTutar")}
          <input inputMode="decimal" value={tutar} onChange={(e) => setTutar(e.target.value)} dir="ltr" data-masraf-tutar />
        </label>
        <label>
          {t("mhPara")}
          <select value={para} onChange={(e) => setPara(e.target.value)} data-masraf-para>
            {paralar.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {t("aciklama")}
        <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} dir="auto" data-masraf-aciklama />
      </label>
      <div className="form-alt">
        <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
          {t("iptal")}
        </button>
        <button type="button" className="dugme" disabled={!gecerli} onClick={ekle} data-masraf-ekle>
          {t("msEkle")}
        </button>
      </div>
    </div>
  );
}
