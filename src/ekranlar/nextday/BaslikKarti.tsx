import { ArrowDown, ArrowUp, CircleCheck, Hourglass, Lightbulb, Pencil, Radio, Trash2, Users, X, Ban, Newspaper, Package } from "lucide-react";
import { useState } from "react";
import { Avatar, Icerik, OncelikRozeti, PaketDurumRozeti, Rozet, TalimatRozeti, bildir, oncelikliOnce, talimatOnce } from "../../bilesenler/Parcalar";
import { metin, saatYaz, useDil } from "../../dil";
import { paketDurum, paketSil, planBaslikCikar, planBaslikTasi, planMuhabir, planMuhabirGuncelle } from "../../eylemler";
import { kisiAr, satir, sehirAr } from "../../etiketler";
import { useBen } from "../../oturum";
import { vardiyaYaz } from "../../tarih";
import { baslikBul, kisiBul, useVeri, type NextDayPlan, type PlanBasligi } from "../../veri";
import { yapabilir } from "../../yetki";
import PlanaEkle from "../oneri/PlanaEkle";
import { CanliListesi, EkleDugmesi, GelismeListesi, IkonDugme } from "./Bolumler";
import { MuhabirSecici, PaketFormu } from "./Formlar";

/**
 * Haber gündemindeki bir başlık: kurumun çıktısında altı çizili başlık ve
 * altında gelişmeler, المراسلون ve PKG satırları. Promptun 4.4 maddesi:
 * bir başlığa birden fazla muhabir atanabiliyor, paket önerisi olmasa da;
 * paket önerileri hazır paketlerden ayrı; ajanstan gelen gelişmenin paket
 * olması gerekmiyor.
 */
export default function BaslikKarti({
  plan,
  pb,
  sira,
  toplam,
  icerik,
  operasyon,
}: {
  plan: NextDayPlan;
  pb: PlanBasligi;
  sira: number;
  toplam: number;
  icerik: boolean;
  operasyon: boolean;
}) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [paketForm, setPaketForm] = useState("");
  const [muhabirEkle, setMuhabirEkle] = useState(false);
  const [oneriAcik, setOneriAcik] = useState("");
  const baslik = baslikBul(v, pb.baslikId);
  const gelismeler = v.gelismeler.filter((g) => g.planBaslikId === pb.id);
  const paketler = v.paketler.filter((p) => p.planBaslikId === pb.id);
  const canlilar = v.canliYayinlar.filter((c) => c.planBaslikId === pb.id);
  const oneriler = v.oneriler.filter(
    (o) => o.baslikId === pb.baslikId && o.hedefTarih === plan.tarih && (o.durum === "yeni" || o.durum === "degerlendiriliyor"),
  );
  const degerlendirir = yapabilir(ben, "paketDegerlendir");
  const cikabilir = !paketler.some((p) => p.durum !== "iptal");

  return (
    <details className="baslik-karti">
      <summary>
        <span className="sira">{sira + 1}</span>
        <h3>
          <Icerik>{baslik?.ad}</Icerik>
        </h3>
        <span className="sayimlar">
          <span>
            <Newspaper size={12} /> {gelismeler.length}
          </span>
          <span>
            <Users size={12} /> {pb.muhabirler.length}
          </span>
          <span>
            <Package size={12} /> {paketler.filter((p) => p.durum !== "iptal").length}
          </span>
          <span>
            <Radio size={12} /> {canlilar.length}
          </span>
          {oneriler.length > 0 && <Rozet ton="vurgu">{t("yeniOneriSayisi", { n: oneriler.length })}</Rozet>}
        </span>
        {icerik && (
          <span className="sag-uc" onClick={(e) => e.preventDefault()}>
            <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukariTasi")} onClick={() => ben && sira > 0 && planBaslikTasi(ben, plan.id, pb.id, -1)} />
            <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagiTasi")} onClick={() => ben && sira < toplam - 1 && planBaslikTasi(ben, plan.id, pb.id, 1)} />
            <IkonDugme
              ikon={<Trash2 size={15} />}
              etiket={cikabilir ? t("plandanCikar") : t("paketliBaslikCikmaz")}
              onClick={() => {
                if (!ben) return;
                if (!cikabilir) return bildir(t("paketliBaslikCikmaz"));
                if (confirm(t("baslikCikarilsinMi"))) planBaslikCikar(ben, plan.id, pb.id);
              }}
            />
          </span>
        )}
      </summary>

      <div className="baslik-govde">
        <section className="alt-alan">
          <h4>
            <Newspaper size={14} /> {t("gelismeler")}
          </h4>
          <GelismeListesi plan={plan} gelismeler={gelismeler} duzenler={operasyon} planBaslikId={pb.id} />
        </section>

        <section className="alt-alan">
          <h4>
            <Users size={14} /> {t("takipEdenMuhabirler")}
          </h4>
          <div className="cipler">
            {pb.muhabirler.map((m) => {
              const k = kisiBul(v, m.kisiId);
              return (
                <span key={m.kisiId} className="cip">
                  <Avatar kisi={k} boy="kucuk" />
                  <Icerik>{satir(m.yer || sehirAr(k?.sehir), kisiAr(k) || "?")}</Icerik>
                  {icerik ? (
                    <input
                      className="girdi vardiya-girdi"
                      type="time"
                      value={m.saat ?? ""}
                      title={t("canliSaati")}
                      aria-label={t("canliSaati")}
                      onChange={(e) => ben && planMuhabirGuncelle(ben, plan.id, pb.id, m.kisiId, { saat: e.target.value || undefined })}
                    />
                  ) : (
                    m.saat && <Rozet>{vardiyaYaz(m.saat)}</Rozet>
                  )}
                  {icerik && (
                    <button onClick={() => ben && planMuhabir(ben, plan.id, pb.id, m.kisiId, false)} aria-label={t("cikar")} title={t("cikar")}>
                      <X size={13} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {pb.muhabirler.length === 0 && <p className="bos-kucuk">{t("muhabirAtanmadi")}</p>}
          {icerik &&
            (muhabirEkle ? (
              <div className="form ara-ust-2">
                <MuhabirSecici
                  deger=""
                  degistir={(id) => {
                    if (ben && id) planMuhabir(ben, plan.id, pb.id, id, true);
                    setMuhabirEkle(false);
                  }}
                />
              </div>
            ) : (
              <div className="ara-ust-2">
                <EkleDugmesi metin={t("muhabirAta")} onClick={() => setMuhabirEkle(true)} />
              </div>
            ))}
        </section>

        <section className="alt-alan">
          <h4>
            <Package size={14} /> {t("paketOnerileri")} (PKG)
          </h4>
          {paketler.length === 0 && paketForm !== "yeni" && <p className="bos-kucuk">{t("paketOnerisiYok")}</p>}
          {[...paketler].sort(oncelikliOnce).map((p) =>
            paketForm === p.id ? (
              <PaketFormu key={p.id} plan={plan} planBaslikId={pb.id} mevcut={p} kapat={() => setPaketForm("")} />
            ) : (
              <div key={p.id} className="kayit">
                <div className="kayit-bas">
                  <div>
                    <a href={`#/paketler/${p.id}`} className="kalin-bag">
                      <Icerik blok>{satir(sehirAr(p.sehir), p.baslik, p.muhabirId ? kisiAr(kisiBul(v, p.muhabirId)) : metin("atanmadi", "ar"))}</Icerik>
                    </a>
                    <small>
                      {p.oncelikli && <OncelikRozeti />}
                      <PaketDurumRozeti paket={p} />
                      <span>{p.kod}</span>
                      {p.yayin && <span>· {t("yayin")} {saatYaz(p.yayin, dil)}</span>}
                      {p.sahaGerekli && <Rozet ton="uyari">{t("saha")}</Rozet>}
                    </small>
                  </div>
                  <div className="islemler">
                    {icerik && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={() => setPaketForm(p.id)} />
                    )}
                    {degerlendirir && p.durum === "taslak" && (
                      <IkonDugme ikon={<Hourglass size={15} />} etiket={t("degerlendirmeyeAl")} onClick={() => ben && paketDurum(ben, p.id, "degerlendiriliyor")} />
                    )}
                    {degerlendirir && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<CircleCheck size={15} />} etiket={t("onayla")} onClick={() => ben && paketDurum(ben, p.id, "onaylandi")} />
                    )}
                    {degerlendirir && !["tamamlandi", "iptal"].includes(p.durum) && (
                      <IkonDugme ikon={<Ban size={15} />} etiket={t("iptalEt")} onClick={() => ben && confirm(t("iptalEdilsinMi")) && paketDurum(ben, p.id, "iptal")} />
                    )}
                    {icerik && ["taslak", "degerlendiriliyor"].includes(p.durum) && (
                      <IkonDugme ikon={<Trash2 size={15} />} etiket={t("sil")} onClick={() => ben && confirm(t("silinsinMi")) && paketSil(ben, p.id)} />
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
          {icerik && paketForm === "yeni" && <PaketFormu plan={plan} planBaslikId={pb.id} kapat={() => setPaketForm("")} />}
          {icerik && !paketForm && (
            <div className="ara-ust-2">
              <EkleDugmesi metin={t("paketOnerisiEkle")} onClick={() => setPaketForm("yeni")} />
            </div>
          )}
        </section>

        <section className="alt-alan">
          <h4>
            <Radio size={14} /> {t("canliYayinlar")}
          </h4>
          <CanliListesi plan={plan} canlilar={canlilar} duzenler={operasyon} planBaslikId={pb.id} />
        </section>

        {icerik && oneriler.length > 0 && (
          <section className="alt-alan alt-alan-genis">
            <h4>
              <Lightbulb size={14} /> {t("buBasligaGelenOneriler")}
            </h4>
            {[...oneriler].sort(talimatOnce).map((o) => (
              <div key={o.id} className={`kayit ${o.talimatVeren ? "kayit-talimat" : ""}`}>
                <div className="kayit-bas">
                  <Avatar kisi={kisiBul(v, o.muhabirId ?? o.talimatVeren)} boy="kucuk" />
                  <div>
                    <b>
                      <Icerik blok>{o.haberBasligi}</Icerik>
                    </b>
                    <Icerik blok className="kayit-metin">
                      {o.gelisme}
                    </Icerik>
                    <small>{o.talimatVeren ? <TalimatRozeti veren={kisiBul(v, o.talimatVeren)} /> : ad(kisiBul(v, o.muhabirId))}</small>
                  </div>
                  {oneriAcik !== o.id && (
                    <button className="dugme dugme-iyi dugme-kucuk" onClick={() => setOneriAcik(o.id)}>
                      {t("planaEkle")}
                    </button>
                  )}
                </div>
                {oneriAcik === o.id && ben && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setOneriAcik("")} />}
              </div>
            ))}
          </section>
        )}
      </div>
    </details>
  );
}
