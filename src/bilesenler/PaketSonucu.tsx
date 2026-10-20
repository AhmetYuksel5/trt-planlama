import { CheckCircle, CircleSlash, Undo2 } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { paketIsaretKarar, paketIsaretle } from "../eylemler";
import { kisiBul, useVeri, type Kisi, type Paket } from "../veri";
import { paketIsaretOnaylayabilir, paketIsaretleyebilir } from "../yetki";
import { Rozet, bildir } from "./Parcalar";

/*
 * Paketin sonucu: muhabir "Yapıldı" ya da sebebiyle "Yapılmadı" der, yetkili
 * onaylar ya da geri çevirir. Kritik geçiş, onay soruluyor. Muhabirin
 * işlerinde ve paket sayfasında aynı bileşen.
 */
export function PaketSonucDugmeleri({ ben, paket: p, kucuk = false }: { ben: Kisi; paket: Paket; kucuk?: boolean }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [sebep, setSebep] = useState<string | null>(null);
  const k = kucuk ? " dugme-kucuk" : "";
  if (p.isaret) {
    const i = p.isaret;
    return (
      <div className="dugmeler" data-paket-isaret={p.id}>
        <Rozet ton="uyari">
          {t("isaretOnayBekliyor")} · {t(i.tur === "yapildi" ? "yapildi" : "yapilmadi")}
        </Rozet>
        {i.sebep && (
          <span dir="auto" className="soluk">
            {ad(kisiBul(v, i.kisiId))}: {i.sebep}
          </span>
        )}
        {paketIsaretOnaylayabilir(ben) && (
          <>
            <button type="button" className={`dugme dugme-iyi${k}`} onClick={() => confirm(t("isaretOnayOnay")) && paketIsaretKarar(ben, p.id, true) && bildir(t("bKaydedildi"))} data-isaret-onayla>
              <CheckCircle size={14} /> {t("isaretOnayla")}
            </button>
            <button type="button" className={`dugme dugme-ikincil${k}`} onClick={() => confirm(t("isaretRetOnay")) && paketIsaretKarar(ben, p.id, false) && bildir(t("bKaydedildi"))} data-isaret-geri>
              <Undo2 size={14} /> {t("isaretGeriCevir")}
            </button>
          </>
        )}
      </div>
    );
  }
  if (!paketIsaretleyebilir(ben, p, v)) return null;
  if (sebep !== null)
    return (
      <div className="form form-kutu" data-yapilmadi-formu={p.id}>
        <label>
          {t("yapilmadiSebep")}
          <textarea dir="auto" rows={2} value={sebep} onChange={(e) => setSebep(e.target.value)} autoFocus data-yapilmadi-sebep />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setSebep(null)}>
            {t("iptal")}
          </button>
          <button
            type="button"
            className="dugme dugme-kotu dugme-kucuk"
            disabled={!sebep.trim()}
            onClick={() => confirm(t("yapilmadiOnayi")) && paketIsaretle(ben, p.id, "yapilmadi", sebep) && (setSebep(null), bildir(t("bIsaretGonderildi")))}
            data-yapilmadi-gonder
          >
            {t("yapilmadi")}
          </button>
        </div>
      </div>
    );
  return (
    <div className="dugmeler">
      <button type="button" className={`dugme dugme-iyi${k}`} onClick={() => confirm(t("yapildiOnayi")) && paketIsaretle(ben, p.id, "yapildi") && bildir(t("bIsaretGonderildi"))} data-paket-yapildi={p.id}>
        <CheckCircle size={14} /> {t("yapildi")}
      </button>
      <button type="button" className={`dugme dugme-ikincil${k}`} onClick={() => setSebep("")} data-paket-yapilmadi={p.id}>
        <CircleSlash size={14} /> {t("yapilmadi")}
      </button>
    </div>
  );
}
