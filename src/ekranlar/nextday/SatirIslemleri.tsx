import { Ban, Check, CircleCheck, Hourglass, Lightbulb, Link2, X } from "lucide-react";
import { useState } from "react";
import { Icerik, Pencere, bildir, icerikAlani, talimatOnce } from "../../bilesenler/Parcalar";
import { OneriAvatari, OneriKaynagi } from "../../bilesenler/Tablolar";
import { YzSonGelismeler, kaynakAdlari } from "../../bilesenler/YzTakip";
import { useDil } from "../../dil";
import { baslikDuzenle, canliSonuc, gelismeKaydet, oneriPlandakineBagla, paketDurum, paketReddet, planBaslikBirlestir } from "../../eylemler";
import { oneriGunde, paketinOneriAdaylari } from "../../oneriPlanlari";
import { baslikBul, ozelIcerikMi, useVeri, type CanliYayin, type Durum, type Kisi, type NextDayPlan, type Paket, type PlanBasligi } from "../../veri";
import { canliSonucIsaretleyebilir, yapabilir } from "../../yetki";
import PlanaEkle from "../oneri/PlanaEkle";
import { FormAlt } from "./Formlar";
import { IkonDugme } from "./Bolumler";

/*
 * Plan satırlarının işlemleri tek yerde (kullanıcı: belgede düzenleme ile
 * plan ekranının özellikleri aynı olsun). Klasik başlık kartı ve belge
 * (Yeni, Sütunlu, belge sayfası) aynı bileşenleri çağırıyor; bir yere
 * eklenen işlem öbüründe eksik kalmasın.
 */

/** PKG kararı: değerlendirmeye al, kabul (muhabire görev), ret (paket iz olarak kalır), iptal. */
export function PaketKararDugmeleri({ ben, paket: p }: { ben: Kisi | null | undefined; paket: Paket }) {
  const { t } = useDil();
  if (!ben || !yapabilir(ben, "paketDegerlendir")) return null;
  const acik = p.durum === "taslak" || p.durum === "degerlendiriliyor";
  return (
    <>
      {p.durum === "taslak" && <IkonDugme ikon={<Hourglass size={15} />} etiket={t("degerlendirmeyeAl")} onClick={() => paketDurum(ben, p.id, "degerlendiriliyor")} />}
      {acik && <IkonDugme ikon={<CircleCheck size={15} />} etiket={t("kabulEt")} onClick={() => confirm(t("paketKabulOnay")) && paketDurum(ben, p.id, "onaylandi")} />}
      {acik && <IkonDugme ikon={<Ban size={15} />} etiket={t("reddet")} onClick={() => confirm(t("paketRetOnay")) && paketReddet(ben, p.id)} />}
      {/* Onaylı paket silinmez, plandan kaldırılır: iptal, kaydı kalır, muhabir duyar (yetki.ts → paketSilinebilir). Özel yayının içeriği özel yayından. */}
      {!acik && p.durum !== "tamamlandi" && p.durum !== "iptal" && !ozelIcerikMi(p) && (
        <span data-paket-kaldir={p.id}>
          <IkonDugme ikon={<Ban size={15} />} etiket={t("plandanKaldir")} onClick={() => confirm(t(p.muhabirId ? "plandanKaldirBildirimli" : "plandanKaldirSoru")) && paketDurum(ben, p.id, "iptal")} />
        </span>
      )}
    </>
  );
}

/*
 * Ters yön: planda muhabir adına doğrudan açılmış PKG'nin muhabirinin bekleyen,
 * benzer başlıklı önerisi varsa satırda bağla düğmesi. Paket ve plan değişmez.
 */
export function PaketOneriBagi({ ben, paket: p }: { ben: Kisi | null | undefined; paket: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  if (!ben || (!ben.hesapYoneticisi && !yapabilir(ben, "oneriDegerlendir"))) return null;
  const adaylar = paketinOneriAdaylari(v, p);
  if (!adaylar.length) return null;
  return (
    <>
      <span data-paket-oneri-bagi={p.id}>
        <IkonDugme ikon={<Link2 size={15} />} etiket={t("pbPaketAdayi")} onClick={() => setAcik(true)} />
      </span>
      {acik && (
        <Pencere baslik={t("pbPaketAdayi")} alt={<Icerik>{p.baslik}</Icerik>} kapat={() => setAcik(false)}>
          <ul className="liste" data-paket-oneri-adaylari>
            {adaylar.map((o) => (
              <li key={o.id}>
                <a href={`#/oneriler/${o.id}`}>
                  <Icerik>{o.haberBasligi}</Icerik>
                </a>{" "}
                <button
                  type="button"
                  className="dugme dugme-ikincil dugme-kucuk"
                  onClick={() => {
                    if (!confirm(t("pbBaglaOnay"))) return;
                    if (oneriPlandakineBagla(ben, o.id, { tur: "paket", id: p.id })) {
                      setAcik(false);
                      bildir(t("pbBaglandi"));
                    }
                  }}
                  data-paket-bagla
                >
                  {t("pbBagla")}
                </button>
              </li>
            ))}
          </ul>
        </Pencere>
      )}
    </>
  );
}

/** Canlının yapıldı mı (Newsdesk; muhasebe yapılanı sayar): plan kilitli olsa da işaretlenir. */
export function CanliSonucDugmeleri({ ben, canli: c }: { ben: Kisi | null | undefined; canli: CanliYayin }) {
  const { t } = useDil();
  if (!ben || !c.muhabirId || !canliSonucIsaretleyebilir(ben)) return null;
  return (
    <>
      <IkonDugme ikon={<Check size={15} />} etiket={t(c.sonuc?.durum === "yapildi" ? "csKaldir" : "csYapildi")} onClick={() => canliSonuc(ben, c.id, c.sonuc?.durum === "yapildi" ? null : "yapildi")} />
      <IkonDugme ikon={<X size={15} />} etiket={t(c.sonuc?.durum === "yapilmadi" ? "csKaldir" : "csYapilmadi")} onClick={() => canliSonuc(ben, c.id, c.sonuc?.durum === "yapilmadi" ? null : "yapilmadi")} />
    </>
  );
}

/** Başlığın gününe düşen, karar bekleyen öneriler ("Bu başlığa gelen öneriler"). */
export const baslikOnerileri = (v: Durum, plan: NextDayPlan, pb: PlanBasligi) =>
  v.oneriler.filter((o) => o.baslikId === pb.baslikId && oneriGunde(o, plan.tarih) && (o.durum === "yeni" || o.durum === "degerlendiriliyor")).sort(talimatOnce);

export function BaslikOnerileri({ ben, plan, pb }: { ben: Kisi | null | undefined; plan: NextDayPlan; pb: PlanBasligi }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState("");
  return (
    <>
      {baslikOnerileri(v, plan, pb).map((o) => (
        <div key={o.id} className={`kayit ${o.talimatVeren ? "kayit-talimat" : ""}`} data-baslik-onerisi={o.id}>
          <div className="kayit-bas">
            <OneriAvatari oneri={o} d={v} />
            <div>
              <b>
                <Icerik blok>{o.haberBasligi}</Icerik>
              </b>
              <Icerik blok className="kayit-metin">
                {o.gelisme}
              </Icerik>
              <small>
                <OneriKaynagi oneri={o} d={v} />
              </small>
            </div>
            {acik !== o.id && (
              <button className="dugme dugme-iyi dugme-kucuk" onClick={() => setAcik(o.id)}>
                {t("planaEkle")}
              </button>
            )}
          </div>
          {acik === o.id && ben && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setAcik("")} />}
        </div>
      ))}
    </>
  );
}

/** Belgenin başlık şeridinde: gelen öneri varsa sayısıyla simge, basınca pencerede liste. */
export function BaslikOnerileriDugmesi({ ben, plan, pb }: { ben: Kisi | null | undefined; plan: NextDayPlan; pb: PlanBasligi }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const n = baslikOnerileri(v, plan, pb).length;
  if (!n) return null;
  return (
    <>
      <span data-baslik-onerileri-ac={pb.id}>
        <IkonDugme ikon={<Lightbulb size={15} />} etiket={`${t("buBasligaGelenOneriler")} · ${n}`} onClick={() => setAcik(true)} />
      </span>
      {acik && (
        <Pencere genis baslik={t("buBasligaGelenOneriler")} alt={<Icerik>{baslikBul(v, pb.baslikId)?.ad}</Icerik>} kapat={() => setAcik(false)}>
          <BaslikOnerileri ben={ben} plan={plan} pb={pb} />
        </Pencere>
      )}
    </>
  );
}

/** Başlığı başka başlığın içine katma: hedef seçilir, onay sorulur (↶ geri alır). */
export function BaslikaKatPenceresi({ ben, plan, pb, kapat }: { ben: Kisi; plan: NextDayPlan; pb: PlanBasligi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const adi = (x: PlanBasligi) => baslikBul(v, x.baslikId)?.ad ?? "";
  return (
    <Pencere baslik={t("baslikaKat")} alt={<Icerik>{adi(pb)}</Icerik>} kapat={kapat}>
      <div className="dugmeler dikey" data-kat-hedefleri>
        {plan.basliklar
          .filter((x) => x.id !== pb.id)
          .map((x) => (
            <button
              key={x.id}
              type="button"
              className="dugme dugme-ikincil"
              data-kat-hedef={x.id}
              onClick={() => {
                kapat();
                if (!confirm(t("baslikKatilsinMi", { katilan: adi(pb), hedef: adi(x) }))) return;
                if (planBaslikBirlestir(ben, plan.id, pb.id, x.id)) bildir(t("baslikKatildi"));
              }}
            >
              <Icerik>{adi(x)}</Icerik>
            </button>
          ))}
      </div>
    </Pencere>
  );
}

/** Son gelişmeler (yapay zeka) gelişme olarak başlığın altına; kaynak alıntılanan siteler (medya). */
export function SonGelismelerPenceresi({ ben, plan, pb, kapat }: { ben: Kisi; plan: NextDayPlan; pb: PlanBasligi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const baslik = baslikBul(v, pb.baslikId);
  if (!baslik) return null;
  return (
    <Pencere baslik={t("yzTakipMetni")} alt={<Icerik>{baslik.ad}</Icerik>} kapat={kapat}>
      <YzSonGelismeler
        baslik={baslik.ad}
        baslikId={baslik.id}
        ekleMetni={t("yzGelismeOlarakEkle")}
        ekle={(s) => {
          const ok = gelismeKaydet(ben, { planId: plan.id, planBaslikId: pb.id, metin: s.metin, kaynakTuru: "medya", kaynakAdi: kaynakAdlari(s), tarih: "" });
          if (ok !== false) {
            bildir(t("bKaydedildi"));
            kapat();
          }
        }}
      />
    </Pencere>
  );
}

/** Başlığın adı (havuzdaki başlık; aynı başlığı kullanan her planda değişir). Belgede yerinde yazılıyor. */
export function BaslikAdiPenceresi({ ben, pb, kapat }: { ben: Kisi; pb: PlanBasligi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const [ad, setAd] = useState(baslikBul(v, pb.baslikId)?.ad ?? "");
  return (
    <Pencere baslik={t("baslik")} kapat={kapat}>
      <div className="form" data-baslik-adi-formu={pb.id}>
        <input {...icerikAlani} value={ad} onChange={(e) => setAd(e.target.value)} aria-label={t("baslik")} autoFocus data-baslik-adi />
        <FormAlt kapat={kapat} devre={!ad.trim()} kaydet={() => baslikDuzenle(ben, pb.baslikId, { ad: ad.trim() }) !== false && kapat()} />
      </div>
    </Pencere>
  );
}
