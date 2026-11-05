import { Send, SpellCheck } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Kart, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { kisiAr } from "../../etiketler";
import { adimIlerle, parcaSonHal } from "../../eylemler";
import { kisiBul, useVeri, type Kisi, type MetinParcasi, type Paket } from "../../veri";
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
      {parcalar.map(({ p, parca }) => <MetinKarti key={parca.id} ben={ben} p={p} parca={parca} />)}
      {sira.map((p) => <MetinKarti key={p.id} ben={ben} p={p} />)}
      {!sira.length && !parcalar.length && <Bos metin={t("ddBos")} ikon={<SpellCheck size={28} />} />}
    </>
  );
}

function MetinKarti({ ben, p, parca }: { ben: Kisi; p: Paket; parca?: MetinParcasi }) {
  const { t } = useDil();
  const v = useVeri();
  const [metin, setMetin] = useState((parca ? parca.metin : p.metin) ?? "");
  const gonder = () => {
    if (!confirm(t("ddGonderOnay"))) return;
    if (parca ? parcaSonHal(ben, p.id, parca.id, metin) : adimIlerle(ben, p.id, { metin: metin.trim() })) bildir(t("ddGonderildi"));
  };
  return (
    <div data-dd-metin={parca ? parca.id : p.id}>
    <Kart baslik={<Icerik>{parca ? `${p.baslik} · ${parca.ad}` : p.baslik}</Icerik>} className="ara-alt-2">
      <small className="sonuk-yazi">
        <Icerik>{kisiAr(kisiBul(v, p.muhabirId ?? ""))}</Icerik>
      </small>
      <textarea {...icerikAlani} className="dd-alan" rows={12} value={metin} onChange={(e) => setMetin(e.target.value)} aria-label={t("ddBaslik")} />
      <div className="form-alt">
        <button className="dugme dugme-iyi" disabled={!metin.trim()} onClick={gonder} data-dd-gonder>
          <Send size={16} className="yon" /> {t("ddGonder")}
        </button>
      </div>
    </Kart>
    </div>
  );
}
