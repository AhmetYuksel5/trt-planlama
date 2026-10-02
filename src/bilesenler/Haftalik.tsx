import { Ban, ClipboardCheck, MessageSquare } from "lucide-react";
import { useState } from "react";
import { aralikYaz, gunAdi, saatYaz, tarihYaz, useDil } from "../dil";
import { BICIM_KODU, KARAR_ADI, KARAR_TONU } from "../etiketler";
import { onIncelemeGorusu, onIncelemeReddet } from "../eylemler";
import { haftaSonu, kalemAdi, onIncelemeBekleyenler } from "../haftalik";
import { yerelGun } from "../tarih";
import { kisiBul, useVeri, type Durum, type HaftalikKalem, type Kisi } from "../veri";
import { yapabilir } from "../yetki";
import { Avatar, Bos, Icerik, Kart, Rozet, TurRozeti, bildir } from "./Parcalar";

/*
 * Haftalık planın birden çok ekranda görünen parçaları: kalemin kararı,
 * kısa kalem listesi (Program ve Ekonomi ana sayfaları) ve ön inceleme
 * kartı (yönetici paneli, Ekonomi ana sayfası).
 */

export function KararRozeti({ kalem }: { kalem: HaftalikKalem }) {
  const { t } = useDil();
  if (kalem.onInceleme?.durum === "reddedildi") return <Rozet ton="kotu">{t("onIncelemedeReddedildi")}</Rozet>;
  if (kalem.karar === "bekliyor" && kalem.onInceleme) return <Rozet ton="uyari">{t("onIncelemede")}</Rozet>;
  return <Rozet ton={KARAR_TONU[kalem.karar]}>{t(KARAR_ADI[kalem.karar])}</Rozet>;
}

/** Kalemin günü; günü yoksa zamana bağlı olmayan dosyada. */
export function KalemGunu({ kalem }: { kalem: HaftalikKalem }) {
  const { t, dil } = useDil();
  return <>{kalem.tarih ? `${gunAdi(kalem.tarih, dil)} ${tarihYaz(kalem.tarih, dil, "kisa")}` : t("zamanaBagliOlmayan")}</>;
}

export const bicimSatiri = (k: HaftalikKalem) => k.bicimler.map((b) => BICIM_KODU[b]).join(" + ");

export function KalemListesi({ kalemler }: { kalemler: HaftalikKalem[] }) {
  const { t } = useDil();
  if (!kalemler.length) return <Bos kucuk metin={t("kayitYok")} />;
  return (
    <ul className="liste">
      {kalemler.map((k) => (
        <li key={k.id}>
          <div className="ad">
            <b>
              <Icerik blok>{kalemAdi(k)}</Icerik>
            </b>
            <small>
              <KalemGunu kalem={k} />
            </small>
          </div>
          <TurRozeti tur={k.tur} />
          <KararRozeti kalem={k} />
        </li>
      ))}
    </ul>
  );
}

/** Ön incelemede yazılan görüşler: kim, ne zaman; metin yazıldığı dilde. */
export function Gorusler({ kalem, d }: { kalem: HaftalikKalem; d: Durum }) {
  const { ad, dil, t } = useDil();
  const oi = kalem.onInceleme;
  if (!oi) return null;
  return (
    <>
      {oi.gorusler.map((g, i) => (
        <div key={i} className="gorus">
          <Avatar kisi={kisiBul(d, g.kisiId)} boy="kucuk" />
          <div>
            <small>
              <b>{ad(kisiBul(d, g.kisiId))}</b> · {tarihYaz(yerelGun(g.zaman), dil, "kisa")} {saatYaz(g.zaman, dil)}
            </small>
            <p dir="auto">{g.metin}</p>
          </div>
        </div>
      ))}
      {oi.durum === "reddedildi" && (
        <div className="gorus gorus-ret">
          <Avatar kisi={kisiBul(d, oi.reddeden)} boy="kucuk" />
          <div>
            <small>
              <b>{ad(kisiBul(d, oi.reddeden))}</b> · {t("onIncelemedeReddetti")}
            </small>
            <p dir="auto">{oi.gerekce}</p>
          </div>
        </div>
      )}
    </>
  );
}

function IncelemeSatiri({ ben, haftaId, kalem }: { ben: Kisi; haftaId: string; kalem: HaftalikKalem }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<"" | "gorus" | "ret">("");
  const [metin, setMetin] = useState("");
  const muhabir = kisiBul(v, kalem.muhabirler[0]);
  const yazdim = kalem.onInceleme?.gorusler.some((g) => g.kisiId === ben.id);
  const gonder = () => {
    const ok = form === "gorus" ? onIncelemeGorusu(ben, haftaId, kalem.id, metin) : onIncelemeReddet(ben, haftaId, kalem.id, metin);
    if (ok) {
      bildir(t(form === "gorus" ? "bGorusYazildi" : "bOnIncelemeRet"));
      setForm("");
      setMetin("");
    }
  };
  return (
    <div className="kayit">
      <div className="kayit-bas">
        <Avatar kisi={muhabir} boy="kucuk" />
        <div>
          <b>
            <Icerik blok>{kalemAdi(kalem)}</Icerik>
          </b>
          {kalem.baslik && (
            <Icerik blok className="kayit-metin">
              {kalem.metin}
            </Icerik>
          )}
          <small>
            <TurRozeti tur={kalem.tur} />
            {muhabir && <span>{ad(muhabir)}</span>}
            {kalem.bicimler.length > 0 && <bdi>· {bicimSatiri(kalem)}</bdi>}
            {yazdim && <Rozet ton="iyi">{t("gorusYazildi")}</Rozet>}
          </small>
        </div>
      </div>
      <Gorusler kalem={kalem} d={v} />
      {form ? (
        <div className="form form-kutu ara-ust">
          <label>
            {t(form === "gorus" ? "gorusun" : "retGerekcesi")}
            <textarea dir="auto" rows={2} value={metin} onChange={(e) => setMetin(e.target.value)} autoFocus />
          </label>
          <div className="form-alt">
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("")}>
              {t("iptal")}
            </button>
            <button className={`dugme dugme-kucuk ${form === "ret" ? "dugme-kotu" : ""}`} onClick={gonder} disabled={!metin.trim()}>
              {t(form === "gorus" ? "gorusGonder" : "reddet")}
            </button>
          </div>
        </div>
      ) : (
        <div className="dugmeler ara-ust">
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("gorus")}>
            <MessageSquare size={14} /> {t("gorusYaz")}
          </button>
          <button className="dugme dugme-kotu dugme-kucuk" onClick={() => setForm("ret")}>
            <Ban size={14} /> {t("reddet")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Ön inceleme bekleyen öneriler: toplantıdan önce kolun yöneticisinin
 * önünde. Görüş toplantıya not olarak gidiyor, ret öneriyi gündemden
 * düşürüyor; kabul kararı toplantıda.
 */
export function OnIncelemeKarti({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  if (!yapabilir(ben, "onInceleme")) return null;
  const liste = onIncelemeBekleyenler(v, ben);
  return (
    <Kart baslik={t("onIncelemeBekleyen")} ikon={<ClipboardCheck size={18} />} ek={liste.length ? String(liste.length) : undefined} className="on-inceleme-karti">
      <p className="bos-kucuk">{t("onIncelemeAciklama")}</p>
      {liste.length === 0 ? (
        <Bos kucuk metin={t("onIncelemeYok")} />
      ) : (
        liste.map(({ hafta, kalem }) => (
          <div key={kalem.id} className="ara-ust-2">
            <div className="alan-etiket">
              <a href={`#/haftalik/${hafta.id}`}>
                {t("haftalik")} · {aralikYaz(hafta.baslangic, haftaSonu(hafta.baslangic), dil)}
              </a>
            </div>
            <IncelemeSatiri ben={ben} haftaId={hafta.id} kalem={kalem} />
          </div>
        ))
      )}
    </Kart>
  );
}
