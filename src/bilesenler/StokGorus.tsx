import { Check, Layers, MessageSquarePlus, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { aralikYaz, useDil, type Anahtar } from "../dil";
import { stokGorusuVer } from "../eylemler";
import { kisiAr, satir, sehirAr } from "../etiketler";
import { haftaSonu } from "../haftalik";
import { bekleyenStokGorusleri, gorusBirimi, kalemGorusleri, stokGorusAcik, stokOnerileri } from "../stokHazirlik";
import { STOK_GORUS_TURLERI, kisiBul, useVeri, type HaftalikKalem, type HaftalikPlan, type Kisi, type StokGorusTuru } from "../veri";
import { birimAdi } from "../yapi";
import { Icerik, Kart, Rozet, TurRozeti, bildir } from "./Parcalar";

/*
 * Stok önerilerine birimlerin toplantı öncesi görüşü (stokHazirlik.ts).
 * Görüş tavsiye: üç seçenek ve isteğe bağlı kısa not; kararı toplantı verir.
 */

export const GORUS_ADI: Record<StokGorusTuru, Anahtar> = { uygun: "sgUygun", bizAlalim: "sgBizAlalim", uygunDegil: "sgUygunDegil" };
const GORUS_TONU: Record<StokGorusTuru, string> = { uygun: "iyi", bizAlalim: "vurgu", uygunDegil: "kotu" };
const GORUS_IKONU = { uygun: ThumbsUp, bizAlalim: Check, uygunDegil: ThumbsDown } as const;

/** Kalemin altında birimlerin görüşleri: "Program · Biz alalım"; not ipucunda ve altında. */
export function BirimGorusOzeti({ kalem }: { kalem: HaftalikKalem }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const l = kalemGorusleri(v, kalem.id);
  if (!l.length) return null;
  return (
    <div className="stok-gorusler" data-stok-gorus-ozet={kalem.id}>
      {l.map((g) => (
        <span key={g.id} className="stok-gorus" data-stok-gorus-birim={g.birim} title={`${ad(kisiBul(v, g.kisiId))}${g.not ? ` · ${g.not}` : ""}`}>
          <Rozet ton={GORUS_TONU[g.tur]}>
            {birimAdi(g.birim)} · {t(GORUS_ADI[g.tur])}
          </Rozet>
          {g.not && (
            <small className="sonuk-yazi" dir="auto">
              {g.not}
            </small>
          )}
        </span>
      ))}
    </div>
  );
}

/** Kişinin birimi adına görüş düğmeleri; seçili olan basılı, not isteğe bağlı. */
export function StokGorusDugmeleri({ ben, hafta, kalem }: { ben: Kisi; hafta: HaftalikPlan; kalem: HaftalikKalem }) {
  const { t } = useDil();
  const v = useVeri();
  const birim = gorusBirimi(ben);
  const mevcut = (v.stokGorusleri ?? []).find((g) => g.kalemId === kalem.id && g.birim === birim);
  const [notAcik, setNotAcik] = useState(false);
  const [not, setNot] = useState(mevcut?.not ?? "");
  if (!birim || !stokGorusAcik(hafta) || !stokOnerileri(hafta).some((k) => k.id === kalem.id)) return null;
  const ver = (tur: StokGorusTuru) => stokGorusuVer(ben, hafta.id, kalem.id, tur, not) && (setNotAcik(false), bildir(t("bKaydedildi")));
  return (
    <div className="stok-gorus-dugmeleri" data-stok-gorus-ver={kalem.id}>
      <div className="dugmeler">
        {STOK_GORUS_TURLERI.map((tur) => {
          const Ikon = GORUS_IKONU[tur];
          const secili = mevcut?.tur === tur;
          return (
            <button key={tur} type="button" className={`dugme dugme-kucuk ${secili ? "" : "dugme-ikincil"}`} aria-pressed={secili} onClick={() => ver(tur)} data-stok-gorus={tur}>
              <Ikon size={14} /> {t(GORUS_ADI[tur])}
            </button>
          );
        })}
        {!notAcik && (
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setNotAcik(true)} data-stok-gorus-not-ac>
            <MessageSquarePlus size={14} /> {t(mevcut?.not ? "sgNotDegistir" : "sgNotEkle")}
          </button>
        )}
      </div>
      {notAcik && (
        <input className="girdi" dir="auto" value={not} onChange={(e) => setNot(e.target.value)} placeholder={t("sgNotYer")} aria-label={t("sgNotEkle")} data-stok-gorus-not />
      )}
    </div>
  );
}

/*
 * Ana sayfanın başında (düzenden bağımsız): birimin görüşünü bekleyen stok
 * önerileri. Bekleyen yokken çizilmez; verilenler yerinde değiştirilir.
 */
export function StokGorusIstegi({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const l = bekleyenStokGorusleri(v, ben);
  const bekleyen = l.filter((x) => !x.gorus).length;
  if (!bekleyen) return null;
  return (
    <Kart baslik={t("sgIstekBaslik")} ikon={<Layers size={18} />} ek={String(bekleyen)}>
      <ul className="liste stok-gorus-listesi" data-stok-gorus-istegi>
        {l.map(({ hafta, kalem, gorus }) => {
          const muhabir = kisiBul(v, kalem.muhabirler[0]);
          return (
            <li key={kalem.id} data-stok-gorus-kalem={kalem.id} className={gorus ? "verildi" : ""}>
              <div className="ad">
                <Icerik blok>{kalem.paketBasligi ? satir(kalem.yer || sehirAr(muhabir?.sehir), kalem.paketBasligi, kisiAr(muhabir)) : satir(kalem.yer, kalem.metin)}</Icerik>
                <small>
                  <TurRozeti tur={kalem.tur} /> {t("haftalik")} · {aralikYaz(hafta.baslangic, haftaSonu(hafta.baslangic), dil)}
                </small>
              </div>
              <StokGorusDugmeleri ben={ben} hafta={hafta} kalem={kalem} />
            </li>
          );
        })}
      </ul>
    </Kart>
  );
}
