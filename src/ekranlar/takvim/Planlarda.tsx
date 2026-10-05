import { Bell, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Bos, Kart, Rozet, Tumu } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { bekleyenHatirlatmalar, gorunenFaaliyetler, olusumBaglantilari, plandakiFaaliyetler, type Olusum } from "../../takvim";
import { useVeri, type Kisi } from "../../veri";
import { FaaliyetAyrintisi, type AktarimTuru } from "./Ayrinti";
import { FaaliyetSatiri, HatirlatmaListesi, YaklasanListe } from "./ortak";

/*
 * Takvimin plan ekranlarındaki izi. Plan tarafında kayıt yok: bölüm
 * planın tarihlerine düşen faaliyetleri takvimden okuyor, plana alınmış
 * olanı bağlantısından tanıyor. Ekleme takvimdeki aktarım penceresiyle,
 * plan seçili açılıyor; editör onaylamadan plana bir şey girmiyor.
 */

interface Acik {
  id: string;
  bas: string;
  ilk: "ayrinti" | AktarimTuru;
}

export function TakvimdenListe({
  ben,
  bas,
  bit,
  tur,
  planId,
  ekleyebilir,
  eklemeMetni,
}: {
  ben: Kisi;
  bas: string;
  bit: string;
  tur: AktarimTuru;
  /** Bu planın kimliği; yoksa (aylık plan henüz açılmadı) hiçbir faaliyet "plana alındı" sayılmıyor. */
  planId?: string;
  ekleyebilir: boolean;
  eklemeMetni: string;
}) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState<Acik | null>(null);
  const liste = plandakiFaaliyetler(v, ben, bas, bit);
  const plandaMi = (o: Olusum) => !!planId && olusumBaglantilari(o).some((b) => b.tur === tur && b.planId === planId);
  return (
    <>
      <p className="aciklama">{t("takvimdenNotu")}</p>
      {liste.length ? (
        <ul className="tk-satirlar">
          {liste.map((o) => (
            <FaaliyetSatiri
              key={o.anahtar}
              o={o}
              ac={() => setAcik({ id: o.f.id, bas: o.bas, ilk: "ayrinti" })}
              ek={
                plandaMi(o) ? (
                  <Rozet ton="iyi">{t("fd_planaAlindi")}</Rozet>
                ) : (
                  ekleyebilir && (
                    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setAcik({ id: o.f.id, bas: o.bas, ilk: tur })}>
                      {eklemeMetni}
                    </button>
                  )
                )
              }
            />
          ))}
        </ul>
      ) : (
        <Bos kucuk metin={t("faaliyetYok")} />
      )}
      {acik && <FaaliyetAyrintisi key={`${acik.id}@${acik.bas}`} id={acik.id} bas={acik.bas} ilk={acik.ilk} planId={planId} kapat={() => setAcik(null)} />}
    </>
  );
}

/** Ana sayfa alanı: zamanı gelen hatırlatmalar ve yaklaşan altı faaliyet. */
export function YaklasanFaaliyetlerAlani({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState<{ id: string; bas: string } | null>(null);
  const liste = gorunenFaaliyetler(v, ben);
  const ac = (o: Olusum) => setAcik({ id: o.f.id, bas: o.bas });
  const hatirlatmaVar = bekleyenHatirlatmalar(liste).length > 0;
  return (
    <Kart baslik={t("yaklasanFaaliyetler")} ikon={<CalendarCheck size={18} />} sagUc={<Tumu href="#/takvim" />}>
      {hatirlatmaVar && (
        <div className="tk-ana-hatirlatma">
          <div className="alan-etiket">
            <Bell size={13} /> {t("hatirlatmalar")}
          </div>
          <HatirlatmaListesi liste={liste} ac={ac} />
        </div>
      )}
      <YaklasanListe liste={liste} ac={ac} kac={6} />
      {acik && <FaaliyetAyrintisi key={`${acik.id}@${acik.bas}`} id={acik.id} bas={acik.bas} kapat={() => setAcik(null)} />}
    </Kart>
  );
}
