import { Database, Lock, RotateCcw, Settings } from "lucide-react";
import DilSecici from "../bilesenler/DilSecici";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil } from "../dil";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { GERCEK } from "../kip";
import { sifirla, type Kisi } from "../veri";
import { SayfaBasi } from "./ana/Planlama";

/* Ayarlar: dil, oturum ve (demoda) örnek veri. Kalıcılığın sınırı burada açıkça yazıyor; gerçek kayıt buradan sıfırlanmıyor. */
export function Ayarlar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  return (
    <>
      <SayfaBasi
        ikon={<Settings size={26} />}
        baslik={t("mAyarlar")}
       
      />
      <div className="iz iz-2">
        <Kart baslik={t("arayuzDili")}>
          <DilSecici />
        </Kart>
        <Kart baslik={t("oturum")}>
          <p>
            <b>{ad(ben)}</b> · {t(BIRIM_ADI[ben.birim])} ·{" "}
            {t(GOREV_ADI[ben.gorev])}
          </p>
        </Kart>
        {!GERCEK && (
          <Kart baslik={t("ornekVeri")} ikon={<Database size={18} />}>
            <button
              className="dugme dugme-kotu"
              onClick={() => {
                if (confirm(t("sifirlansinMi"))) {
                  sifirla();
                  bildir(t("bSifirlandi"));
                }
              }}
            >
              <RotateCcw size={16} /> {t("ornekVeriyeDon")}
            </button>
          </Kart>
        )}
      </div>
    </>
  );
}

export function Yetkisiz() {
  const { t } = useDil();
  return (
    <div className="bos">
      <Lock size={32} />
      <h2>{t("yetkisizBaslik")}</h2>
      <p>{t("yetkisizAciklama")}</p>
      <a className="dugme dugme-ikincil" href="#/">
        {t("anaSayfayaDon")}
      </a>
    </div>
  );
}
