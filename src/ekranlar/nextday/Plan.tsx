import { ArrowLeft, Ban, CalendarDays, Check, Clock, Lightbulb, Lock, Megaphone, Plus, Printer, Send, Undo2, UserCheck } from "lucide-react";
import { useState } from "react";
import { Avatar, Bos, Icerik, NotKutu, Rozet, TalimatRozeti, bildir, icerikAlani, talimatOnce } from "../../bilesenler/Parcalar";
import { OneriDurumRozeti } from "../../bilesenler/Tablolar";
import { metin, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { baslikEkle, geriDonusGonder, oneriDurum, planBaslikEkle, planDurum } from "../../eylemler";
import { KANAL_ADI, PLAN_DURUM_ADI, PLAN_DURUM_TONU, satir, sehirAr } from "../../etiketler";
import { useBen } from "../../oturum";
import { yerelGun } from "../../tarih";
import { PLAN_DURUMLARI, kisiBul, useVeri, type Kisi, type NextDayPlan, type Oneri } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler, yapabilir } from "../../yetki";
import PlanaEkle from "../oneri/PlanaEkle";
import BaslikKarti from "./BaslikKarti";
import { Bolum, CanliBolumu, EkipBolumu, HareketBolumu, HazirBolumu, TakipBolumu } from "./Bolumler";

/**
 * Next Day planı düzenleme ekranı: promptun "en ayrıntılı geliştirilmesi
 * gereken bölüm" dediği yer.
 *
 * Üstte planın durum çizgisi (taslak → haber toplantısında → onaylı →
 * Newsdesk devraldı) ve yetkiye göre eylemler; altında bu gün için gelen
 * öneriler ve planın bölümleri, kurumun çıktısındaki sırayla. Temiz çıktı
 * ayrı ekranda (çıktı önizleme).
 */
export default function PlanEkrani({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const paketler = v.paketler.filter((p) => p.planId === plan.id && p.durum !== "iptal");
  const bekleyenGeriDonus = v.oneriler.filter(
    (o) => o.hedefTarih === plan.tarih && !o.geriDonus && ["planaEklendi", "reddedildi", "sonra"].includes(o.durum),
  ).length;

  const durumDegistir = (yeni: NextDayPlan["durum"], mesaj: Anahtar) => {
    if (planDurum(ben, plan.id, yeni)) bildir(t(mesaj));
  };

  return (
    <>
      <a className="geri-bag yazdirma-gizle" href="#/nextday">
        <ArrowLeft size={14} className="yon" /> {t("nextdayPlanlari")}
      </a>
      <header className="sayfa-basi">
        <span className="ikon-kutu">
          <CalendarDays size={26} />
        </span>
        <div>
          <h1>
            {t("nextday")} · {tarihYaz(plan.tarih, dil, "tam")}
          </h1>
          <p>
            <Rozet ton={PLAN_DURUM_TONU[plan.durum]}>{t(PLAN_DURUM_ADI[plan.durum])}</Rozet>{" "}
            {t("baslikPaketSayisi", { b: plan.basliklar.length, p: paketler.length })}
          </p>
        </div>
        <div className="sag-uc">
          {yapabilir(ben, "cagriHazirla") && plan.durum === "taslak" && (
            <a className="dugme dugme-ikincil" href={`#/oneriler/cagri/${plan.tarih}`}>
              <Megaphone size={16} /> {t("oneriCagrisi")}
            </a>
          )}
          <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/cikti`}>
            <Printer size={16} /> {t("ciktiOnizleme")}
          </a>
        </div>
      </header>

      <section className="kart">
        <div className="durum-cizgisi" aria-label={t("planDurumu")}>
          {PLAN_DURUMLARI.map((d, i) => {
            const simdi = PLAN_DURUMLARI.indexOf(plan.durum);
            return (
              <span key={d} className={i < simdi ? "gecti" : i === simdi ? "simdi" : ""}>
                {i > 0 && <span className="ayrac" aria-hidden="true" />}
                <i>{i < simdi ? <Check size={11} /> : i + 1}</i>
                {t(PLAN_DURUM_ADI[d])}
              </span>
            );
          })}
        </div>
        <div className="dugmeler ara-ust-2">
          {plan.durum === "taslak" && yapabilir(ben, "planDuzenle") && (
            <button className="dugme" onClick={() => durumDegistir("toplantida", "bToplantiya")}>
              <Send size={16} className="yon" /> {t("toplantiyaGotur")}
            </button>
          )}
          {plan.durum === "toplantida" && yapabilir(ben, "planOnayla") && (
            <button className="dugme dugme-iyi" onClick={() => durumDegistir("onayli", "bPlanOnaylandi")}>
              <Check size={16} /> {t("planiOnayla")}
            </button>
          )}
          {plan.durum === "toplantida" && yapabilir(ben, "planDuzenle") && (
            <button className="dugme dugme-ikincil" onClick={() => durumDegistir("taslak", "bTaslaga")}>
              <Undo2 size={16} /> {t("taslagaGeriAl")}
            </button>
          )}
          {plan.durum === "toplantida" && yapabilir(ben, "planDuzenle") && !yapabilir(ben, "planOnayla") && (
            <span className="bos-kucuk">{t("onayYoneticide")}</span>
          )}
          {plan.durum === "onayli" && yapabilir(ben, "planDevral") && (
            <button className="dugme" onClick={() => durumDegistir("devralindi", "bPlanDevralindi")}>
              <UserCheck size={16} /> {t("planiDevral")}
            </button>
          )}
          {yapabilir(ben, "geriDonus") && plan.durum !== "taslak" && bekleyenGeriDonus > 0 && (
            <button
              className="dugme dugme-ikincil"
              onClick={() => {
                const n = geriDonusGonder(ben, plan.id);
                if (n) bildir(t("bGeriDonus", { n }));
              }}
            >
              <Send size={16} className="yon" /> {t("geriDonusGonder", { n: bekleyenGeriDonus })}
            </button>
          )}
        </div>
        {!icerik && (
          <div className="ara-ust-2">
            <NotKutu ikon={<Lock size={16} />}>
              {plan.durum === "devralindi" ? t(operasyon ? "kilitOperasyon" : "kilitDevralindi") : plan.durum === "onayli" ? t("kilitOnayli") : t("kilitYetki")}
            </NotKutu>
          </div>
        )}
      </section>

      {icerik && <GelenOneriler ben={ben} plan={plan} />}

      <EkipBolumu plan={plan} duzenler={icerik} />
      <HareketBolumu plan={plan} duzenler={icerik} />
      <CanliBolumu plan={plan} duzenler={operasyon} d={v} />
      <HazirBolumu plan={plan} duzenler={icerik} d={v} />
      <GundemBolumu plan={plan} icerik={icerik} operasyon={operasyon} />
      <TakipBolumu plan={plan} duzenler={operasyon} d={v} no={6} />
    </>
  );
}

/* --- 5. Haber gündemi: merkezi başlıklardan seçilen ve sıralanan başlıklar --- */

function GundemBolumu({ plan, icerik, operasyon }: { plan: NextDayPlan; icerik: boolean; operasyon: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const ben = useBen();
  const [ekle, setEkle] = useState(false);
  const [yeni, setYeni] = useState("");
  const plandakiler = new Set(plan.basliklar.map((b) => b.baslikId));
  const havuz = v.basliklar.filter((b) => b.aktif && !plandakiler.has(b.id));

  const yeniEkle = () => {
    if (!ben || !yeni.trim()) return;
    const id = baslikEkle(ben, yeni);
    if (id) planBaslikEkle(ben, plan.id, id);
    setYeni("");
    setEkle(false);
  };

  return (
    <Bolum no={5} baslik={t("haberGundemi")} ek={t("baslikSayisi", { n: plan.basliklar.length })}>
      <p className="aciklama">{t("haberGundemiAciklama")}</p>
      {plan.basliklar.length === 0 && <Bos metin={t("baslikYok")} />}
      {plan.basliklar.map((pb, i) => (
        <BaslikKarti key={pb.id} plan={plan} pb={pb} sira={i} toplam={plan.basliklar.length} icerik={icerik} operasyon={operasyon} />
      ))}
      {icerik &&
        (ekle ? (
          <div className="form form-kutu ara-ust-2">
            <div className="alan-etiket">{t("baslikHavuzu")}</div>
            <div className="cipler">
              {havuz.map((b) => (
                <button
                  key={b.id}
                  className="dugme dugme-ikincil dugme-kucuk"
                  onClick={() => {
                    if (ben) planBaslikEkle(ben, plan.id, b.id);
                  }}
                >
                  <Plus size={13} /> <Icerik>{b.ad}</Icerik>
                </button>
              ))}
            </div>
            <div className="satir">
              <label>
                {t("havuzaYeniBaslik")}
                <input {...icerikAlani} value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder={metin("yeniBaslikIpucu", "ar")} onKeyDown={(e) => e.key === "Enter" && yeniEkle()} />
              </label>
            </div>
            <div className="form-alt">
              <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setEkle(false)}>
                {t("kapat")}
              </button>
              <button className="dugme dugme-kucuk" onClick={yeniEkle} disabled={!yeni.trim()}>
                {t("olusturVeEkle")}
              </button>
            </div>
          </div>
        ) : (
          <div className="ara-ust-2">
            <button className="dugme dugme-ikincil" onClick={() => setEkle(true)}>
              <Plus size={16} /> {t("baslikEkle")}
            </button>
          </div>
        ))}
    </Bolum>
  );
}

/* --- Bu tarihe gelen öneriler: plan hazırlanırken karar burada veriliyor --- */

function GelenOneriler({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState("");
  const [ret, setRet] = useState<{ id: string; gerekce: string } | null>(null);
  const oneriler = v.oneriler
    .filter((o) => o.hedefTarih === plan.tarih && o.durum !== "planaEklendi")
    .sort((a, b) => (a.durum === b.durum ? b.zaman.localeCompare(a.zaman) : sira(a) - sira(b)))
    .sort(talimatOnce);
  const bekleyen = oneriler.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length;

  return (
    <Bolum no="★" baslik={t("buPlanaGelenOneriler")} ek={t("bekleyenSayisi", { n: bekleyen })}>
      {oneriler.length === 0 ? (
        <Bos kucuk metin={t("oneriYok")} />
      ) : (
        oneriler.map((o) => {
          const k = kisiBul(v, o.muhabirId);
          const talimat = !!o.talimatVeren;
          return (
            <div key={o.id} className={`kayit ${talimat ? "kayit-talimat" : ""}`}>
              <div className="kayit-bas">
                <Avatar kisi={k ?? kisiBul(v, o.talimatVeren)} boy="kucuk" />
                <div>
                  <b>
                    <Icerik blok>{satir(sehirAr(k?.sehir), o.haberBasligi)}</Icerik>
                  </b>
                  <Icerik blok className="kayit-metin">
                    {o.gelisme}
                  </Icerik>
                  {o.paketBasligi && (
                    <Icerik blok className="kayit-metin">
                      {`PKG: ${o.paketBasligi}`}
                    </Icerik>
                  )}
                  <small>
                    <OneriDurumRozeti oneri={o} />
                    {talimat ? <TalimatRozeti veren={kisiBul(v, o.talimatVeren)} /> : <span>{ad(k)}</span>}
                    <span>
                      · {t(KANAL_ADI[o.kanal])} · {tarihYaz(yerelGun(o.zaman), dil, "kisa")} {saatYaz(o.zaman, dil)}
                    </span>
                    {o.gerekce && <span dir="auto">· {o.gerekce}</span>}
                  </small>
                </div>
                <div className="islemler">
                  {o.durum !== "reddedildi" && acik !== o.id && (
                    <button className="dugme dugme-iyi dugme-kucuk" onClick={() => setAcik(o.id)}>
                      {t("planaEkle")}
                    </button>
                  )}
                  {o.durum === "yeni" && (
                    <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => oneriDurum(ben, o.id, "degerlendiriliyor")} title={t("degerlendirmeyeAl")}>
                      <Clock size={14} />
                    </button>
                  )}
                  {/* Yönetici talimatı reddedilmez ve ertelenmez; eylem de aynı kuralı soruyor. */}
                  {!talimat && o.durum !== "sonra" && o.durum !== "reddedildi" && (
                    <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => oneriDurum(ben, o.id, "sonra")} title={t("odSonra")}>
                      <Lightbulb size={14} />
                    </button>
                  )}
                  {!talimat && o.durum !== "reddedildi" && (
                    <button className="dugme dugme-kotu dugme-kucuk" onClick={() => setRet({ id: o.id, gerekce: "" })} title={t("reddet")}>
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
              {acik === o.id && <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={() => setAcik("")} />}
              {ret?.id === o.id && (
                <div className="form form-kutu ara-ust-2">
                  <label>
                    {t("retGerekcesi")}
                    <input value={ret.gerekce} onChange={(e) => setRet({ ...ret, gerekce: e.target.value })} autoFocus />
                  </label>
                  <div className="form-alt">
                    <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setRet(null)}>
                      {t("iptal")}
                    </button>
                    <button
                      className="dugme dugme-kotu dugme-kucuk"
                      onClick={() => {
                        oneriDurum(ben, o.id, "reddedildi", ret.gerekce);
                        setRet(null);
                      }}
                    >
                      {t("reddet")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </Bolum>
  );
}

const SIRA: Record<Oneri["durum"], number> = { yeni: 0, degerlendiriliyor: 1, sonra: 2, reddedildi: 3, planaEklendi: 4 };
const sira = (o: Oneri) => SIRA[o.durum];
