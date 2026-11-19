import { Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Pencere, bildir } from "../../bilesenler/Parcalar";
import { saatYaz, useDil } from "../../dil";
import { haftalikTakdirBildirildi } from "../../eylemler";
import { kalemAdi } from "../../haftalik";
import { GERCEK } from "../../kip";
import { useBen } from "../../oturum";
import { postaGonder } from "../../posta-kapi";
import { haftalikTakdirKalemleri, kalemBildirimi, kalemTakdirEpostasi, takdirAdresi, type TakdirEpostasi } from "../../takdir";
import { getir, kisiBul, useVeri, type Durum, type HaftalikKalem, type HaftalikPlan, type Kisi } from "../../veri";
import { yapabilir } from "../../yetki";
import { TakdirListesi, type TakdirSatiri } from "../nextday/Takdir";

/*
 * Weekly ⋯ › "Kabul edilen paketler" (kullanıcı: kesinleşen haftanın paketleri
 * sıralansın, dilediğine posta göndereyim; gönderilmeyen Next Day hazırlanırken
 * karşıma çıksın). Next Day'in PKG geri bildirimiyle aynı liste ve şablon;
 * paket henüz doğmamış olabildiği için iz kalemde (eylemler.ts →
 * haftalikTakdirBildirildi). Sıra planınki: gün sırası; günsüzler kendi sekmesinde.
 */
export function HaftalikTakdirPenceresi({ ben, hafta, kapat }: { ben: Kisi; hafta: HaftalikPlan; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const kalemler = [...haftalikTakdirKalemleri(hafta)].sort((a, b) => (a.tarih ?? "9").localeCompare(b.tarih ?? "9"));
  // İki ayrı liste (kullanıcı): günlük haberler Next Day'e gidiyor, "Stok ve programlar"ın
  // günsüz paketleri stoka ve masalara; görev postaları toplantıdan sonra ayrı ayrı gönderiliyor.
  const gruplar = { gunluk: kalemler.filter((k) => k.tarih), stok: kalemler.filter((k) => !k.tarih) };
  const [sekme, setSekme] = useState<keyof typeof gruplar>(gruplar.gunluk.length || !gruplar.stok.length ? "gunluk" : "stok");
  const satirlar: TakdirSatiri[] = gruplar[sekme].map((k) => ({
    id: k.id,
    baslik: k.paketBasligi || kalemAdi(k),
    muhabirId: k.muhabirler[0],
    gitti: kalemBildirimi(v, k),
    eposta: (d, gonderen) => kalemTakdirEpostasi(d, d.haftalik.find((h) => h.id === hafta.id)?.kalemler.find((x) => x.id === k.id) ?? k, gonderen),
    isaretle: (b) => haftalikTakdirBildirildi(b, hafta.id, k.id),
  }));
  return (
    <Pencere baslik={t("kabulEdilenPaketler")} kapat={kapat} genis>
      <div className="sekmeler" role="tablist" aria-label={t("kabulEdilenPaketler")}>
        {(["gunluk", "stok"] as const).map((x) => (
          <button key={x} type="button" role="tab" aria-selected={sekme === x} className={sekme === x ? "acik" : ""} onClick={() => setSekme(x)} data-takdir-sekme={x}>
            {t(x === "gunluk" ? "tkGunluk" : "stokVeProgramlar")} <em>{gruplar[x].length}</em>
          </button>
        ))}
      </div>
      {/* Seçim listenin ilk halinden kuruluyor; sekme değişince liste yeniden kurulsun. */}
      <TakdirListesi key={sekme} ben={ben} satirlar={satirlar} yetkili={yapabilir(ben, "haftalikDuzenle")} />
    </Pencere>
  );
}

/*
 * Toplantı görünümünde kabul edilen paketin satırındaki zarf (kullanıcı: geri
 * bildirim orada da olsun, basınca onaylansın gitsin). Weekly'nin kalemi ve
 * Next Day'in paketi aynı düğmeyi kullanıyor; tek posta, listedekiyle aynı
 * şablon ve iz; gönderilmişse saatiyle onay işareti.
 */
export function ZarfDugmesi({
  gitti,
  muhabirId,
  eposta,
  isaretle,
}: {
  gitti?: { zaman: string };
  muhabirId?: string;
  /** Gönderim anında en taze kayıttan. */
  eposta: (d: Durum, gonderen: Kisi) => TakdirEpostasi;
  isaretle: (ben: Kisi) => boolean;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [mesgul, setMesgul] = useState(false);
  if (!ben) return null;
  if (gitti) {
    const etiket = `${t("tkGitti")} · ${saatYaz(gitti.zaman, dil)}`;
    return (
      <span className="kalem-posta gitti" title={etiket} aria-label={etiket} data-kalem-posta-gitti>
        <MailCheck size={16} />
      </span>
    );
  }
  const adres = takdirAdresi(kisiBul(v, muhabirId));
  const etiket = adres ? `${t("tkGonder", { n: "1" })} · ${adres}` : t("tkAdresYok");
  const gonder = async (e: React.MouseEvent) => {
    // Kalemi seçmesin: satırın kendisi toplantıda seçim düğmesi.
    e.stopPropagation();
    if (!adres) return bildir(t("tkAdresYok"));
    if (mesgul || !confirm(t("tkGonderOnay", { n: "1" }))) return;
    setMesgul(true);
    const p = eposta(getir(), ben);
    const r = GERCEK ? await postaGonder({ kime: p.kime, cc: p.cc, bcc: p.bcc, konu: p.konu, metin: p.metin }) : { tamam: true as const };
    setMesgul(false);
    if (r.tamam && isaretle(ben)) bildir(t("tkGonderildi", { n: "1" }));
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

/* Kesinleşmiş haftanın kabul edilen kalemi. */
export function KalemPostaDugmesi({ hafta, kalem }: { hafta: HaftalikPlan; kalem: HaftalikKalem }) {
  const v = useVeri();
  const ben = useBen();
  if (!ben || !yapabilir(ben, "haftalikDuzenle") || !haftalikTakdirKalemleri(hafta).some((k) => k.id === kalem.id)) return null;
  return (
    <ZarfDugmesi
      gitti={kalemBildirimi(v, kalem)}
      muhabirId={kalem.muhabirler[0]}
      eposta={(d, g) => kalemTakdirEpostasi(d, d.haftalik.find((h) => h.id === hafta.id)?.kalemler.find((x) => x.id === kalem.id) ?? kalem, g)}
      isaretle={(b) => haftalikTakdirBildirildi(b, hafta.id, kalem.id)}
    />
  );
}
