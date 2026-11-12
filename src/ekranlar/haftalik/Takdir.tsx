import { Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { saatYaz, useDil } from "../../dil";
import { haftalikTakdirBildirildi } from "../../eylemler";
import { kalemAdi } from "../../haftalik";
import { GERCEK } from "../../kip";
import { useBen } from "../../oturum";
import { postaGonder } from "../../posta-kapi";
import { haftalikTakdirKalemleri, kalemBildirimi, kalemTakdirEpostasi, takdirAdresi } from "../../takdir";
import { getir, kisiBul, useVeri, type HaftalikKalem, type HaftalikPlan, type Kisi } from "../../veri";
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

/*
 * Kesinleşmiş haftanın toplantı görünümünde kabul edilen paketin satırındaki
 * zarf (kullanıcı: geri bildirim orada da olsun, basınca onaylansın gitsin).
 * Tek posta, listedekiyle aynı şablon ve iz; gönderilmişse saatiyle onay işareti.
 */
export function KalemPostaDugmesi({ hafta, kalem }: { hafta: HaftalikPlan; kalem: HaftalikKalem }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [mesgul, setMesgul] = useState(false);
  if (!ben || !yapabilir(ben, "haftalikDuzenle") || !haftalikTakdirKalemleri(hafta).some((k) => k.id === kalem.id)) return null;
  const gitti = kalemBildirimi(v, kalem);
  if (gitti) {
    const etiket = `${t("tkGitti")} · ${saatYaz(gitti.zaman, dil)}`;
    return (
      <span className="kalem-posta gitti" title={etiket} aria-label={etiket} data-kalem-posta-gitti>
        <MailCheck size={16} />
      </span>
    );
  }
  const adres = takdirAdresi(kisiBul(v, kalem.muhabirler[0]));
  const etiket = adres ? `${t("tkGonder", { n: "1" })} · ${adres}` : t("tkAdresYok");
  const gonder = async (e: React.MouseEvent) => {
    // Kalemi seçmesin: satırın kendisi toplantıda seçim düğmesi.
    e.stopPropagation();
    if (!adres) return bildir(t("tkAdresYok"));
    if (mesgul || !confirm(t("tkGonderOnay", { n: "1" }))) return;
    setMesgul(true);
    const d = getir();
    const guncel = d.haftalik.find((h) => h.id === hafta.id)?.kalemler.find((x) => x.id === kalem.id) ?? kalem;
    const p = kalemTakdirEpostasi(d, guncel, ben);
    const r = GERCEK ? await postaGonder({ kime: p.kime, cc: p.cc, bcc: p.bcc, konu: p.konu, metin: p.metin }) : { tamam: true as const };
    setMesgul(false);
    if (r.tamam && haftalikTakdirBildirildi(ben, hafta.id, kalem.id)) bildir(t("tkGonderildi", { n: "1" }));
    else if (!r.tamam) bildir(`${t("tkGonderilemedi")} (${r.ayrinti ?? r.hata})`);
  };
  return (
    <button
      type="button"
      className="kalem-posta"
      title={etiket}
      aria-label={etiket}
      aria-disabled={!adres || mesgul || undefined}
      onClick={(e) => void gonder(e)}
      onKeyDown={(e) => e.stopPropagation()}
      data-kalem-posta
    >
      <Mail size={16} />
    </button>
  );
}
