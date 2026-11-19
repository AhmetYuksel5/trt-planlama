import { Pencil, Plane, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar, Bos, Icerik, Kart, Rozet, bildir } from "../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../dil";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, kisiAr, satir } from "../etiketler";
import { hareketSil } from "../eylemler";
import { useBen } from "../oturum";
import { bugun } from "../tarih";
import { kisiBul, useVeri, type Gorevlendirme, type Kisi } from "../veri";
import { useAdimDurumu } from "../yol";
import { hareketDuzenleyebilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { IkonDugme } from "./nextday/Bolumler";
import { HareketPenceresi } from "./nextday/Formlar";

/*
 * Muhabir hareketleri (kullanıcı: menüde ayrı başlık; Next Day ve Weekly aynı
 * pencereyi açsın, hareketler güncellenip silinsin). Kayıt tek: planlar ona
 * bağlantı tutuyor, Weekly kayıttan okuyor. News Gathering etkinleşince bu
 * sayfa onun da işi (izin listesi `SAYFA_IZNI.hareketler`).
 */
const SEKMELER = ["suren", "gecmis"] as const;
type Sekme = (typeof SEKMELER)[number];

export default function Hareketler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [sekme, setSekme] = useAdimDurumu<Sekme>("hareketler:sekme", "suren");
  const [pencere, setPencere] = useState<Gorevlendirme | "yeni" | null>(null);
  const B = bugun();
  const duzenler = hareketDuzenleyebilir(ben);
  const suren = v.gorevlendirmeler.filter((g) => g.bitis >= B).sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  const gecmis = v.gorevlendirmeler.filter((g) => g.bitis < B).sort((a, b) => b.bitis.localeCompare(a.bitis));
  const liste = sekme === "suren" ? suren : gecmis;
  return (
    <>
      <SayfaBasi
        ikon={<Plane size={26} />}
        baslik={t("mHareketler")}
        sagUc={
          duzenler && (
            <button type="button" className="dugme" onClick={() => setPencere("yeni")} data-hareket-ekle>
              <Plus size={16} /> {t("yeniHareket")}
            </button>
          )
        }
      />
      <div className="sekmeler" role="tablist" aria-label={t("mHareketler")}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" role="tab" aria-selected={sekme === x} className={sekme === x ? "acik" : ""} onClick={() => setSekme(x)} data-hareket-sekme={x}>
            {t(x === "suren" ? "hrSuren" : "hrGecmis")} <em>{(x === "suren" ? suren : gecmis).length}</em>
          </button>
        ))}
      </div>
      <Kart>{liste.length === 0 ? <Bos metin={t("hrYok")} /> : <HareketListesi hareketler={liste} duzenle={duzenler ? setPencere : undefined} />}</Kart>
      {pencere && <HareketPenceresi mevcut={pencere === "yeni" ? undefined : pencere} gun={B} kapat={() => setPencere(null)} />}
    </>
  );
}

/*
 * Hareket satırları: "YER / ad", tür, tarih aralığı, açıklama; düzenleyende
 * kalem (pencere) ve çöp. Sayfa ve Weekly'nin bölümü aynı satırı kullanır.
 */
export function HareketListesi({ hareketler, duzenle }: { hareketler: Gorevlendirme[]; duzenle?: (g: Gorevlendirme) => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  return (
    <div className="hareket-listesi">
      {hareketler.map((g) => {
        const k = kisiBul(v, g.kisiId);
        return (
          <div key={g.id} className="kayit" data-hareket={g.id}>
            <div className="kayit-bas">
              <Avatar kisi={k} boy="kucuk" />
              <div>
                <b>
                  <Icerik blok>{satir(g.yer, kisiAr(k))}</Icerik>
                </b>
                {g.aciklama && (
                  <Icerik blok className="kayit-metin">
                    {g.aciklama}
                  </Icerik>
                )}
                <small>
                  <Rozet>{t(HAREKET_TURU_ADI[g.tur])}</Rozet>
                  {g.durum === "talep" && <Rozet ton="uyari">{t(GOREVLENDIRME_DURUM_ADI.talep)}</Rozet>} {tarihYaz(g.baslangic, dil, "kisa")}
                  {g.bitis !== g.baslangic && <> – {tarihYaz(g.bitis, dil, "kisa")}</>}
                </small>
              </div>
              {duzenle && <HareketIslemleri hareket={g} duzenle={duzenle} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HareketIslemleri({ hareket: g, duzenle }: { hareket: Gorevlendirme; duzenle: (g: Gorevlendirme) => void }) {
  const { t } = useDil();
  const ben = useBen();
  return (
    <div className="islemler">
      <IkonDugme ikon={<Pencil size={15} />} etiket={t("hareketDuzenle")} onClick={() => duzenle(g)} />
      <IkonDugme
        ikon={<Trash2 size={15} />}
        etiket={t("sil")}
        ton="kotu"
        onClick={() => ben && confirm(t("hareketSilinsinMi")) && hareketSil(ben, g.id) && bildir(t("bSilindi"))}
      />
    </div>
  );
}
