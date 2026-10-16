import { Calendar, CalendarCheck, CheckCircle, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Ilerleme, Kart, Rozet, TaslakEtiketi, TurRozeti } from "../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../dil";
import { ayEkle, aySonu, bugun } from "../tarih";
import { useVeri, type Kisi } from "../veri";
import { yapabilir } from "../yetki";
import { TakvimdenListe } from "./takvim/Planlarda";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Aylık ve özel yayın planları: promptun 5. maddesindeki gibi ilk
 * prototipte temel liste düzeyinde; kayıtları Next Day'den ayrı.
 * Haftalık plan kendi klasöründe (ekranlar/haftalik).
 */

/*
 * Ay okla geziliyor; açılışta bugünün ayı (o ayın planı yoksa var olan
 * ilk plan, eski davranış). Takvimden bu aya düşen faaliyetler altta;
 * aylık plana takvimin aktarım penceresiyle giriyorlar.
 */
export function Aylik({ ben, planId }: { ben: Kisi; planId?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const buAy = bugun().slice(0, 7);
  const [ay, setAy] = useState(() => v.aylik.find((a) => a.id === planId)?.ay ?? (v.aylik.some((a) => a.ay === buAy) ? buAy : (v.aylik[0]?.ay ?? buAy)));
  const plan = v.aylik.find((a) => a.ay === ay);
  const bas = ay + "-01";
  const kaydir = (n: number) => setAy(ayEkle(bas, n).slice(0, 7));
  return (
    <>
      <SayfaBasi ikon={<Calendar size={26} />} baslik={t("aylik")} sagUc={<TaslakEtiketi />} />
      <div className="tk-donem ara-ust-2">
        <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kaydir(-1)} aria-label={t("oncekiAy")} title={t("oncekiAy")}>
          <ChevronLeft size={18} className="yon" />
        </button>
        <b aria-live="polite">{tarihYaz(bas, dil, "ay")}</b>
        <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kaydir(1)} aria-label={t("sonrakiAy")} title={t("sonrakiAy")}>
          <ChevronRight size={18} className="yon" />
        </button>
      </div>
      {plan ? (
        <Kart baslik={tarihYaz(plan.ay + "-01", dil, "ay")} sagUc={<Rozet ton="uyari">{t("hazirlaniyor")}</Rozet>}>
          <Ilerleme oran={plan.kalemler.filter((k) => k.onayli).length / Math.max(1, plan.kalemler.length)} />
          <ul className="liste ara-ust-2">
            {plan.kalemler.map((k) => (
              <li key={k.id}>
                {k.onayli ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
                <div className="ad">
                  <b>
                    <Icerik blok>{k.baslik}</Icerik>
                  </b>
                  {k.tarih && <small>{tarihYaz(k.tarih, dil, "kisa")}</small>}
                </div>
                <TurRozeti tur={k.tur} />
              </li>
            ))}
          </ul>
        </Kart>
      ) : (
        <Bos metin={t("planYok")} />
      )}
      <Kart baslik={t("takvimdenAy")} ikon={<CalendarCheck size={18} />} className="ara-ust-2">
        <TakvimdenListe ben={ben} bas={bas} bit={aySonu(bas)} tur="aylik" planId={plan?.id} ekleyebilir={yapabilir(ben, "planDuzenle")} eklemeMetni={t("planaEkle")} />
      </Kart>
    </>
  );
}
