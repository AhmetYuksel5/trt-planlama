import { Bell } from "lucide-react";
import { useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil } from "../dil";
import { cihaziAc, cihaziKapat, denemeGonder, desteklenir, genelAnahtar, useBildirimDurumu } from "../bildirim";
import type { Kisi } from "../veri";

/*
 * Bildirimler (bildirim.ts): tam yönetici herkes için açar (varsayılan kapalı);
 * her kişi kendi cihazında ayrıca açar. Olaylar şimdilik yalnız yeni haber önerisi.
 */
export function BildirimAyari({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const [yenile, setYenile] = useState(0);
  const [bekle, setBekle] = useState(false);
  const d = useBildirimDurumu(yenile);
  const yap = async (is: () => Promise<unknown>) => {
    setBekle(true);
    try {
      await is();
    } finally {
      setBekle(false);
      setYenile((x) => x + 1);
    }
  };
  if (!desteklenir())
    return (
      <Kart baslik={t("bdBildirimler")} ikon={<Bell size={18} />}>
        <p className="sonuk">{t("bdDestekYok")}</p>
      </Kart>
    );
  const durum = d && !("hata" in d) ? d : null;
  return (
    <Kart baslik={t("bdBildirimler")} ikon={<Bell size={18} />}>
      <div className="alanlar" data-bildirim-ayari>
        {ben.hesapYoneticisi && (
          <label className="secim">
            <input
              type="checkbox"
              checked={!!durum?.acik}
              disabled={!durum || bekle}
              onChange={(e) => yap(async () => {
                const r = await genelAnahtar(e.target.checked);
                if (!r.tamam) bildir(t("bdHata"));
              })}
              data-bildirim-genel
            />
            {t("bdGenel")} <small className="sonuk">· {t("bdOlayOneri")}</small>
          </label>
        )}
        {durum && !durum.acik && !ben.hesapYoneticisi && <p className="sonuk">{t("bdGenelKapali")}</p>}
        <label className="secim">
          <input
            type="checkbox"
            checked={!!durum?.cihaz}
            disabled={!durum || bekle}
            onChange={(e) => yap(async () => {
              if (!e.target.checked) return cihaziKapat();
              const r = await cihaziAc(dil);
              if (r !== true) bildir(t(r === "izin" ? "bdIzinYok" : r === "destek" ? "bdDestekYok" : "bdHata"));
            })}
            data-bildirim-cihaz
          />
          {t("bdCihaz")}
        </label>
        {durum?.izin === "denied" && <p className="sonuk">{t("bdIzinYok")}</p>}
        {durum?.cihaz && (
          <div>
            <button
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              disabled={bekle}
              onClick={() => yap(async () => {
                const r = await denemeGonder();
                bildir(t(r.tamam ? "bdDenemeGitti" : "bdHata"));
              })}
              data-bildirim-dene
            >
              <Bell size={14} /> {t("bdDene")}
            </button>
          </div>
        )}
        {d && "hata" in d && <p className="sonuk">{t("bdHata")}</p>}
      </div>
    </Kart>
  );
}
