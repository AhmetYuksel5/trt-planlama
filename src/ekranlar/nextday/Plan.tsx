import { ArrowLeft, CalendarDays, CalendarSearch, Check, FilePen, Lightbulb, Megaphone, Plus, Printer, Send, Undo2, UserCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Bos, Pencere, Rozet, bildir, talimatOnce } from "../../bilesenler/Parcalar";
import { metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { geriDonusBekliyor, geriDonusGonder, oncekiOnayla, planDurum } from "../../eylemler";
import { PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import { PLAN_DURUMLARI, oncekiSayisi, planBul, useVeri, type Kisi, type NextDayPlan, type Oneri } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler, yapabilir } from "../../yetki";
import { GorunumSecici, OneriListesi, useOneriGorunumu, type PencereDurumu } from "../oneri/OneriKarti";
import { ElleOneriFormu } from "../oneri/OneriFormu";
import PlanaEkle from "../oneri/PlanaEkle";
import { plandakiFaaliyetler } from "../../takvim";
import { TakvimdenListe } from "../takvim/Planlarda";
import BaslikKarti from "./BaslikKarti";
import { BaslikEkleFormu, Bolum, CanliBolumu, EkipBolumu, EkleDugmesi, HareketBolumu, HazirBolumu, TakipBolumu } from "./Bolumler";

/**
 * Next Day planı düzenleme ekranı: promptun "en ayrıntılı geliştirilmesi
 * gereken bölüm" dediği yer. Bölümler kurumun çıktısındaki sırayla, durum
 * çizgisi (taslak → haber toplantısında → onaylı → Newsdesk devraldı) ve
 * akış eylemleri en altta. Temiz çıktı ayrı ekranda (çıktı önizleme).
 */
/*
 * Planın araçları (çağrı, çıktı, belge, gelen öneriler, takvim) bölümlerin
 * üstünde tek satırda kare simgeler; ekran doğrudan doldurulan bölümlerle
 * (1–6) başlıyor. Öneriler ve takvim pencerede açılıyor. Simge satırı iki
 * biçimde deneniyor: altında kısa adıyla ve yalnız simge (adı ipucunda).
 */
type AracPenceresi = "oneriler" | "takvim" | null;

export default function PlanEkrani({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const paketler = v.paketler.filter((p) => p.planId === plan.id && p.durum !== "iptal");
  const [arac, setArac] = useState<AracPenceresi>(null);

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
      </header>

      <div className="arac-denemesi">
        <PlanAraclari ben={ben} plan={plan} ac={setArac} yazili />
        <PlanAraclari ben={ben} plan={plan} ac={setArac} />
      </div>

      <EkipBolumu plan={plan} duzenler={icerik} />
      <HareketBolumu plan={plan} duzenler={icerik} />
      <CanliBolumu plan={plan} duzenler={operasyon} d={v} />
      <HazirBolumu plan={plan} duzenler={icerik} d={v} />
      <GundemBolumu plan={plan} icerik={icerik} operasyon={operasyon} />
      <TakipBolumu plan={plan} duzenler={operasyon} d={v} no={6} />

      <PlanDurumKarti ben={ben} plan={plan} />

      {arac === "oneriler" && (
        <Pencere genis baslik={t("buPlanaGelenOneriler")} alt={tarihYaz(plan.tarih, dil, "tam")} kapat={() => setArac(null)}>
          <GelenOneriler ben={ben} plan={plan} />
        </Pencere>
      )}
      {arac === "takvim" && (
        <Pencere genis baslik={t("takvimdenGun")} alt={tarihYaz(plan.tarih, dil, "tam")} kapat={() => setArac(null)}>
          <TakvimdenListe ben={ben} bas={plan.tarih} bit={plan.tarih} tur="nextday" planId={plan.id} ekleyebilir={operasyon} eklemeMetni={t("planaEkle")} />
        </Pencere>
      )}
    </>
  );
}

function PlanAraclari({ ben, plan, ac, yazili = false }: { ben: Kisi; plan: NextDayPlan; ac: (a: AracPenceresi) => void; yazili?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const bekleyen = v.oneriler.filter((o) => o.hedefTarih === plan.tarih && (o.durum === "yeni" || o.durum === "degerlendiriliyor")).length;
  const faaliyet = plandakiFaaliyetler(v, ben, plan.tarih, plan.tarih).length;
  const kare = (anahtar: string, ikon: ReactNode, ad: Anahtar, tam: Anahtar, hedef: string | (() => void), sayi = 0) => {
    const ic = (
      <>
        <span className="arac-simge">
          {ikon}
          {sayi > 0 && <em className="arac-sayi">{sayi}</em>}
        </span>
        {yazili && <span className="arac-ad">{t(ad)}</span>}
      </>
    );
    const ortak = { className: "arac-kare", title: t(tam), "aria-label": t(tam), "data-arac": anahtar };
    return typeof hedef === "string" ? (
      <a key={anahtar} href={hedef} {...ortak}>
        {ic}
      </a>
    ) : (
      <button key={anahtar} type="button" onClick={hedef} {...ortak}>
        {ic}
      </button>
    );
  };
  return (
    <nav className={`plan-araclari${yazili ? " yazili" : ""}`} aria-label={t("planAraclari")}>
      {yapabilir(ben, "cagriHazirla") && plan.durum === "taslak" && kare("cagri", <Megaphone size={22} />, "araCagri", "oneriCagrisi", `#/oneriler/cagri/${plan.tarih}`)}
      {kare("cikti", <Printer size={22} />, "araCikti", "ciktiOnizleme", `#/nextday/${plan.id}/cikti`)}
      {(icerik || operasyon) && kare("belge", <FilePen size={22} />, "araBelge", "belgedeDuzenle", `#/nextday/${plan.id}/belge`)}
      {icerik && kare("oneriler", <Lightbulb size={22} />, "araOneriler", "buPlanaGelenOneriler", () => ac("oneriler"), bekleyen)}
      {kare("takvim", <CalendarSearch size={22} />, "araTakvim", "takvimdenGun", () => ac("takvim"), faaliyet)}
    </nav>
  );
}

/* Planın durumu ve akıştaki eylemler: bölümlerin altında. */
function PlanDurumKarti({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const bekleyenGeriDonus = v.oneriler.filter((o) => o.hedefTarih === plan.tarih && geriDonusBekliyor(o)).length;
  const sablon = planBul(v, plan.kopyaKaynagi);
  const onceki = oncekiSayisi(v, plan);
  const durumDegistir = (yeni: NextDayPlan["durum"], mesaj: Anahtar) => {
    if (planDurum(ben, plan.id, yeni)) bildir(t(mesaj));
  };
  return (
    <section className="kart plan-durum-karti">
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
        {/* Şablondan gelenler hafif fonlu; düğmenin yanındaki örnek fon neyin dünden olduğunu gösteriyor. */}
        {sablon && onceki > 0 && (icerik || operasyon) && (
          <button className="dugme dugme-ikincil" onClick={() => oncekiOnayla(ben, plan.id)}>
            <span className="onceki-ornek" aria-hidden="true" /> {t("hepsiniBuguneAl")}
          </button>
        )}
      </div>
    </section>
  );
}

/* --- 5. Haber gündemi: merkezi başlıklardan seçilen ve sıralanan başlıklar --- */

function GundemBolumu({ plan, icerik, operasyon }: { plan: NextDayPlan; icerik: boolean; operasyon: boolean }) {
  const { t } = useDil();
  const [ekle, setEkle] = useState(false);

  return (
    <Bolum ar no={5} baslik={metin("haberGundemi", "ar")} ek={t("baslikSayisi", { n: plan.basliklar.length })}>
      {plan.basliklar.length === 0 && <Bos metin={t("baslikYok")} />}
      {plan.basliklar.map((pb, i) => (
        <BaslikKarti key={pb.id} plan={plan} pb={pb} sira={i} toplam={plan.basliklar.length} icerik={icerik} operasyon={operasyon} />
      ))}
      {icerik &&
        (ekle ? (
          <BaslikEkleFormu plan={plan} kapat={() => setEkle(false)} />
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

/* --- Bu tarihe gelen öneriler (araç penceresinde): plan hazırlanırken karar burada veriliyor --- */

function GelenOneriler({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  /* Öneri yalnız sistemden gelmiyor: telefonla, ajanstan, resmî duyurudan geleni Planlama burada giriyor. */
  const [elle, setElle] = useState(false);
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [pencere, setPencere] = useState<PencereDurumu>(null);
  const oneriler = v.oneriler
    .filter((o) => o.hedefTarih === plan.tarih && o.durum !== "planaEklendi")
    .sort((a, b) => (a.durum === b.durum ? b.zaman.localeCompare(a.zaman) : sira(a) - sira(b)))
    .sort(talimatOnce);

  return (
    <>
      {elle ? (
        <ElleOneriFormu
          ben={ben}
          hedefTarih={plan.tarih}
          hemenMetni={t("kaydetVePlanaEkle")}
          kapat={() => setElle(false)}
          kaydet={(id, hemen) => {
            setElle(false);
            if (hemen) setPencere({ id, mod: "ekle" });
          }}
        />
      ) : (
        <div className="oneri-arac ara-alt-2">
          {yapabilir(ben, "oneriGonder") && <EkleDugmesi metin={t("oneriEkle")} onClick={() => setElle(true)} />}
          <span className="bosluk-esnek" />
          <GorunumSecici deger={gorunum} degistir={setGorunum} />
        </div>
      )}
      <OneriListesi
        ben={ben}
        d={v}
        oneriler={oneriler}
        gorunum={gorunum}
        pencere={pencere}
        setPencere={setPencere}
        ekleMetni={t("planaEkle")}
        ekleFormu={(o, kapat) => <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={kapat} />}
        ertelenebilir
      />
    </>
  );
}

// Düzeltmedeki öneri muhabirde bekliyor; Planlama'nın önündekilerin arkasında.
const SIRA: Record<Oneri["durum"], number> = { yeni: 0, degerlendiriliyor: 1, duzeltme: 2, sonra: 3, reddedildi: 4, planaEklendi: 5 };
const sira = (o: Oneri) => SIRA[o.durum];
