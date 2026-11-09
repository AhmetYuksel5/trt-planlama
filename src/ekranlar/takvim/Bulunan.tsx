import { ExternalLink, Radar } from "lucide-react";
import { useState } from "react";
import { Bos, Icerik, Pencere } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil } from "../../dil";
import { faaliyetTuruAdi, ulkeAdi } from "../../etiketler";
import { takvimAdayiKarar } from "../../eylemler";
import { bugun } from "../../tarih";
import { bekleyenAdaylar, type TakvimAdayi } from "../../takvimBotu";
import { useVeri, type Kisi } from "../../veri";
import { FaaliyetFormu } from "./Form";

/*
 * Takvim botunun bulduğu faaliyetler (takvimBotu.ts): haberlerde ileri
 * tarihle geçen olaylar. Takvime kendiliğinden girmez; "Takvime ekle" formu
 * haberden doldurulmuş açar, kişi düzeltip kaydeder. Düğme sayfa başında,
 * yalnız bekleyen varken: sayfanın üstüne yeni satır eklenmiyor.
 */
export function BulunanFaaliyetler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const [ekle, setEkle] = useState<TakvimAdayi | null>(null);
  const liste = bekleyenAdaylar(v.takvimAdaylari ?? [], v.faaliyetler, bugun());
  if (!liste.length && !acik && !ekle) return null;
  return (
    <>
      <button type="button" className="dugme dugme-ikincil" onClick={() => setAcik(true)} data-tb-ac>
        <Radar size={16} /> {t("tbBulunan")} <span className="rozet rozet-vurgu">{liste.length}</span>
      </button>
      {acik && (
        <Pencere baslik={t("tbBulunan")} kapat={() => setAcik(false)} genis>
          {liste.length === 0 ? (
            <Bos kucuk metin={t("tbYok")} />
          ) : (
            <ul className="liste tb-adaylar">
              {liste.map((a) => (
                <AdaySatiri
                  key={a.id}
                  a={a}
                  ekle={() => {
                    setAcik(false);
                    setEkle(a);
                  }}
                  ilgisiz={() => takvimAdayiKarar(ben, a.id, "ilgisiz")}
                />
              ))}
            </ul>
          )}
        </Pencere>
      )}
      {ekle && (
        <FaaliyetFormu
          ben={ben}
          taslak={{ baslik: ekle.baslik, tarih: ekle.tarih, tur: ekle.tur, ulke: ekle.ulke, notlar: `${t("tbKaynak")}: ${ekle.kaynak}\n${ekle.baglanti}` }}
          kapat={() => setEkle(null)}
          kaydedildi={(id) => {
            takvimAdayiKarar(ben, ekle.id, "eklendi", id);
          }}
        />
      )}
    </>
  );
}

function AdaySatiri({ a, ekle, ilgisiz }: { a: TakvimAdayi; ekle: () => void; ilgisiz: () => void }) {
  const { t, dil } = useDil();
  return (
    <li data-tb-aday={a.id}>
      <div className="ad">
        <b>
          <Icerik>{a.baslik}</Icerik>
        </b>
        <small>
          {tarihYaz(a.tarih, dil, "tam")} · {t(faaliyetTuruAdi(a.tur))}
          {a.ulke && <> · {t(ulkeAdi(a.ulke))}</>}
          {" · "}
          <a href={a.baglanti} target="_blank" rel="noreferrer" title={a.baglanti}>
            {a.kaynak} <ExternalLink size={12} aria-hidden="true" />
          </a>
          {a.haberSayisi > 1 && <> · {t("tbHaberSayisi", { n: a.haberSayisi })}</>}
        </small>
      </div>
      <div className="dugmeler">
        <button type="button" className="dugme dugme-kucuk" onClick={ekle} data-tb-ekle>
          {t("tbTakvimeEkle")}
        </button>
        <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={ilgisiz} data-tb-ilgisiz>
          {t("tbIlgisiz")}
        </button>
      </div>
    </li>
  );
}
