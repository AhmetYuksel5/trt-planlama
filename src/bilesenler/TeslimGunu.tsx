import { CalendarClock, Pencil } from "lucide-react";
import { useState } from "react";
import { tarihYaz, useDil } from "../dil";
import { paketTeslimGunu } from "../eylemler";
import { teslimeKalan } from "../stokSayfasi";
import { bugun } from "../tarih";
import type { Kisi, Paket } from "../veri";
import { teslimGunuBelirleyebilir } from "../yetki";
import { Icerik, Pencere, Rozet, bildir } from "./Parcalar";
import { TarihGirdisi } from "./TarihSaat";

/*
 * Süren paketin teslim günü (kullanıcı: stok ve feature zamana bağlı
 * olmayabilir ama teslim süresi mutlaka belirlenir, takip ona göre): gün ve
 * kalan gün; yaklaşınca turuncu, geçince kırmızı. Gün yoksa "belirlenmedi".
 * Yetkiliye (Planlama, tam yönetici) belirleme ya da değiştirme düğmesi.
 */
export function TeslimSatiri({ ben, p, gun }: { ben: Kisi; p: Paket; gun?: string }) {
  const { t, dil } = useDil();
  const [acik, setAcik] = useState(false);
  const yetki = teslimGunuBelirleyebilir(ben, p);
  const kalan = gun ? teslimeKalan(gun, bugun()) : 0;
  return (
    <span className="teslim-satiri" data-teslim-satiri={gun ?? ""}>
      {gun ? (
        <span className={`teslim-gun ${kalan < 0 ? "kotu-yazi" : kalan <= 1 ? "yakin" : "sonuk-yazi"}`}>
          <CalendarClock size={13} /> {t("teslim")}: <bdi>{tarihYaz(gun, dil)}</bdi> ·{" "}
          {kalan < 0 ? t("skGunGecikti", { n: -kalan }) : kalan === 0 ? t("skBugunTeslim") : t("kalanGun", { n: kalan })}
        </span>
      ) : (
        <Rozet ton="uyari">{t("skTeslimYok")}</Rozet>
      )}
      {yetki &&
        (gun ? (
          <button
            type="button"
            className="dugme dugme-sade dugme-ikon"
            onClick={() => setAcik(true)}
            aria-label={t("skTeslimDegistir")}
            title={t("skTeslimDegistir")}
            data-teslim-degistir={p.id}
          >
            <Pencil size={14} />
          </button>
        ) : (
          <button type="button" className="dugme dugme-yumusak dugme-kucuk" onClick={() => setAcik(true)} data-teslim-belirle={p.id}>
            <CalendarClock size={14} /> {t("skTeslimBelirle")}
          </button>
        ))}
      {acik && <TeslimGunuPenceresi ben={ben} p={p} gun={gun} kapat={() => setAcik(false)} />}
    </span>
  );
}

function TeslimGunuPenceresi({ ben, p, gun, kapat }: { ben: Kisi; p: Paket; gun?: string; kapat: () => void }) {
  const { t } = useDil();
  const B = bugun();
  const [tarih, setTarih] = useState(gun && gun >= B ? gun : "");
  const kaydet = () => {
    if (paketTeslimGunu(ben, p.id, tarih)) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t(gun ? "skTeslimDegistir" : "skTeslimBelirle")} alt={<Icerik>{p.baslik}</Icerik>} kapat={kapat}>
      <div className="form">
        <label>
          {t("teslimGunu")}
          <TarihGirdisi value={tarih} min={B} required onChange={(e) => setTarih(e.target.value)} data-teslim-gunu />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" onClick={kaydet} disabled={!tarih} data-teslim-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}
