import { Send, SpellCheck } from "lucide-react";
import { HarekeliAlan } from "../../bilesenler/Hareke";
import { useState } from "react";
import { Bos, Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { kisiAr } from "../../etiketler";
import { adimIlerle } from "../../eylemler";
import { ParcaSatiri } from "../../bilesenler/ParcaliMetin";
import { kisiBul, useVeri, type Kisi, type Paket } from "../../veri";
import { dilParcaSirasi, dilSirasi } from "../../yetki";
import { SayfaBasi } from "./Planlama";

/*
 * Dil denetmeninin tek sayfası: sırası ona gelmiş (dil durağındaki) metinler,
 * her biri düzenlenebilir alanda; "Düzelt ve gönder" düzeltilmiş metni pakete
 * yazıp işi sonraki durağa geçirir. Başka ayrıntı yok (kurumun isteği).
 */
export default function DilDenetimi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const sira = dilSirasi(v, ben).sort((a, b) => (a.teslim ?? "").localeCompare(b.teslim ?? ""));
  // Yeni yolda metin parça parça geliyor (intro, PTC…): her parça ayrı kart.
  const parcalar = dilParcaSirasi(v, ben);
  return (
    <>
      <SayfaBasi ikon={<SpellCheck size={26} />} baslik={t("ddBaslik")} />
      {/* Parça paket sayfasındaki satırın aynısı (ParcaSatiri); başlık paketin sayfasına götürür. */}
      {parcalar.map(({ p, parca }) => (
        <div key={parca.id} data-dd-metin={parca.id}>
          <Kart baslik={<a href={`#/paketler/${p.id}`}><Icerik>{p.baslik}</Icerik></a>} className="ara-alt-2">
            <small className="sonuk-yazi">
              <Icerik>{kisiAr(kisiBul(v, p.muhabirId ?? ""))}</Icerik>
            </small>
            <ParcaSatiri ben={ben} paket={p} parca={parca} />
          </Kart>
        </div>
      ))}
      {sira.map((p) => <MetinKarti key={p.id} ben={ben} p={p} />)}
      {!sira.length && !parcalar.length && <Bos metin={t("ddBos")} ikon={<SpellCheck size={28} />} />}
    </>
  );
}

/* Parçasız eski yol: metnin tamamı tek alanda. */
function MetinKarti({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const [metin, setMetin] = useState(p.metin ?? "");
  const gonder = () => {
    if (adimIlerle(ben, p.id, { metin: metin.trim() })) bildir(t("ddGonderildi"));
  };
  return (
    <div data-dd-metin={p.id}>
    <Kart baslik={<Icerik>{p.baslik}</Icerik>} className="ara-alt-2">
      <small className="sonuk-yazi">
        <Icerik>{kisiAr(kisiBul(v, p.muhabirId ?? ""))}</Icerik>
      </small>
      <HarekeliAlan {...icerikAlani} className="dd-alan" rows={12} value={metin} onChange={(e) => setMetin(e.target.value)} aria-label={t("ddBaslik")} />
      <div className="form-alt">
        <button className="dugme dugme-iyi" disabled={!metin.trim()} onClick={gonder} data-dd-gonder>
          <Send size={16} className="yon" /> {t("ddGonder")}
        </button>
      </div>
    </Kart>
    </div>
  );
}
