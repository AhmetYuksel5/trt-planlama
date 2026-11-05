import { UserCheck } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { kayitOnayla } from "../eylemler";
import { PozisyonPenceresi } from "../ekranlar/Kullanicilar";
import { useVeri, type Kisi } from "../veri";
import { birimAdi, gorevAdi } from "../yapi";
import { hesapYetkisi } from "../yetki";
import { Kart, bildir } from "./Parcalar";

/** Kayıt bağlantısıyla gelip onay bekleyen hesaplar; onaylayabilen için. */
export const onayBekleyenler = (kisiler: Kisi[], ben: Kisi) => (hesapYetkisi(ben, "kisiDuzenle") ? kisiler.filter((k) => k.kontrolBekliyor && !k.pasif) : []);

/*
 * Onay bekleyen hesaplar kartı: yöneticinin ana sayfasının başında (düzenden
 * bağımsız) ve Hesaplar'ın başında. Önce yalnız Hesaplar listesindeki rozetle
 * "Düzenle"den onaylanıyordu; kayıt olan kişi beklerken yönetici görmüyordu.
 */
export function OnayBekleyenHesaplar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [duzenlenen, setDuzenlenen] = useState<Kisi | null>(null);
  const liste = onayBekleyenler(v.kisiler, ben);
  if (!liste.length) return null;
  return (
    <Kart baslik={`${t("onayBekleyenHesaplar")} · ${liste.length}`} ikon={<UserCheck size={18} />} className="ara-alt-2">
      <div className="form" data-onay-bekleyen-hesaplar>
        {liste.map((k) => (
          <div key={k.id} className="kayit-bas" data-onay-hesap={k.id}>
            <div>
              <b>{ad(k)}</b>
              <small className="sonuk-yazi">
                {" "}
                {birimAdi(k.birim)} · {gorevAdi(k.gorev)} · <bdi>{k.eposta}</bdi>
              </small>
            </div>
            <div className="dugmeler">
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setDuzenlenen(k)}>
                {t("duzenle")}
              </button>
              <button type="button" className="dugme dugme-iyi dugme-kucuk" data-hesap-onayla onClick={() => confirm(t("hesapOnayOnay")) && kayitOnayla(ben, k.id) && bildir(t("bHesapOnaylandi"))}>
                {t("hesabiOnayla")}
              </button>
            </div>
          </div>
        ))}
      </div>
      {duzenlenen && <PozisyonPenceresi ben={ben} kisi={duzenlenen} kapat={() => setDuzenlenen(null)} />}
    </Kart>
  );
}
