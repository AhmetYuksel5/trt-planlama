import { Pencere } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { haftalikTakdirBildirildi } from "../../eylemler";
import { kalemAdi } from "../../haftalik";
import { haftalikTakdirKalemleri, kalemBildirimi, kalemTakdirEpostasi } from "../../takdir";
import { useVeri, type HaftalikPlan, type Kisi } from "../../veri";
import { yapabilir } from "../../yetki";
import { TakdirListesi, type TakdirSatiri } from "../nextday/Takdir";

/*
 * Weekly ⋯ › "Kabul edilen paketler" (kullanıcı: kesinleşen haftanın paketleri
 * sıralansın, dilediğine posta göndereyim; gönderilmeyen Next Day hazırlanırken
 * karşıma çıksın). Next Day'in PKG geri bildirimiyle aynı liste ve şablon;
 * paket henüz doğmamış olabildiği için iz kalemde (eylemler.ts →
 * haftalikTakdirBildirildi). Sıra planınki: gün, sonra zamana bağlı olmayanlar.
 */
export function HaftalikTakdirPenceresi({ ben, hafta, kapat }: { ben: Kisi; hafta: HaftalikPlan; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const kalemler = [...haftalikTakdirKalemleri(hafta)].sort((a, b) => (a.tarih ?? "9").localeCompare(b.tarih ?? "9"));
  const satirlar: TakdirSatiri[] = kalemler.map((k) => ({
    id: k.id,
    baslik: k.paketBasligi || kalemAdi(k),
    muhabirId: k.muhabirler[0],
    gitti: kalemBildirimi(v, k),
    eposta: (d, gonderen) => kalemTakdirEpostasi(d, d.haftalik.find((h) => h.id === hafta.id)?.kalemler.find((x) => x.id === k.id) ?? k, gonderen),
    isaretle: (b) => haftalikTakdirBildirildi(b, hafta.id, k.id),
  }));
  return (
    <Pencere baslik={t("kabulEdilenPaketler")} kapat={kapat} genis>
      <TakdirListesi ben={ben} satirlar={satirlar} yetkili={yapabilir(ben, "haftalikDuzenle")} />
    </Pencere>
  );
}
