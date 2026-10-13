import { birimAdi, kisiBirimleri, gorevAdi } from "../yapi";
import { Database, Lock, RotateCcw, Send, Settings } from "lucide-react";
import { useState } from "react";
import DilSecici from "../bilesenler/DilSecici";
import { WHATSAPP_YOLLARI, whatsappYolu, whatsappYoluKaydet, type WhatsappYolu } from "../bilesenler/WhatsApp";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { GERCEK } from "../kip";
import { muhabireOneriBirimleriKaydet } from "../eylemler";
import { sifirla, useVeri, type Kisi } from "../veri";
import { muhabireOneriBirimleri } from "../yetki";
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
            <b>{ad(ben)}</b> · {birimAdi(ben.birim)} ·{" "}
            {gorevAdi(ben.gorev)}
          </p>
        </Kart>
        <WhatsappAyari />
        {ben.hesapYoneticisi && <MuhabireOneriAyari ben={ben} />}
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

/* Bilgisayarda WhatsApp düğmesinin yolu; bu bilgisayarda saklanıyor (WhatsApp.tsx). */
const WHATSAPP_YOLU_ADI: Record<WhatsappYolu, Anahtar> = { otomatik: "waOtomatik", uygulama: "waUygulama", web: "waWeb" };

function WhatsappAyari() {
  const { t } = useDil();
  const [yol, setYol] = useState(whatsappYolu);
  return (
    <Kart baslik={t("waAyar")}>
      <fieldset className="secim-grubu" data-whatsapp-yolu>
        <legend className="gizli-metin">{t("waAyar")}</legend>
        {WHATSAPP_YOLLARI.map((y) => (
          <label key={y} className="secim-cip">
            <input
              type="radio"
              name="whatsapp-yolu"
              checked={yol === y}
              onChange={() => {
                whatsappYoluKaydet(y);
                setYol(y);
              }}
              data-yol={y}
            />
            {t(WHATSAPP_YOLU_ADI[y])}
          </label>
        ))}
      </fieldset>
    </Kart>
  );
}

/* Muhabire doğrudan haber önerebilen birimler: yalnız tam yönetici seçiyor; seçilmemişse Planlama. */
function MuhabireOneriAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const secili = muhabireOneriBirimleri(v);
  return (
    <Kart baslik={t("muhabireOneriBirimleri")} ikon={<Send size={18} className="yon" />}>
      <div className="yetki-listesi" data-muhabire-oneri-birimleri>
        {kisiBirimleri().filter((b) => b !== "muhabir").map((b) => (
          <label key={b} className="secim">
            <input
              type="checkbox"
              checked={secili.includes(b)}
              onChange={(e) => muhabireOneriBirimleriKaydet(ben, e.target.checked ? [...secili, b] : secili.filter((x) => x !== b))}
              data-birim={b}
            />
            {birimAdi(b)}
          </label>
        ))}
      </div>
    </Kart>
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
