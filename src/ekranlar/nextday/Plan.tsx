import {
  ArrowLeft,
  MoreHorizontal,
  PanelRight,
  X,
  Binoculars,
  CalendarSearch,
  Check,
  FilePen,
  FileUp,
  Lightbulb,
  MailCheck,
  Megaphone,
  Plus,
  Printer,
  Send,
  Undo2,
  UserCheck,
} from "lucide-react";
import { CiktiOnizleme } from "./Cikti";
import { PlanTakipleri, takipOnerileri } from "../Takipler";
import { oneriBuGunun, oneriYeri } from "../../oneriPlanlari";
import { useState, type ReactNode } from "react";
import {
  Bos,
  Icerik,
  Pencere,
  Rozet,
  bildir,
  icerikAlani,
  talimatOnce,
} from "../../bilesenler/Parcalar";
import { temelSorumlular } from "../../gorevler";
import { gunEkle } from "../../tarih";
import { kisaGunAdi, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { useSekmeAdi } from "../../sekmeAdi";
import { kayipBaslikGeriGetir, planDurum } from "../../eylemler";
import { kayipBasliklar, type KayipGrup } from "../../kayipKayitlar";
import { takdirPaketleri } from "../../takdir";
import { git } from "../../yol";
import { ndBaslikSecenekleri } from "../../baslikSecimi";
import { PLAN_DURUM_ADI, PLAN_DURUM_TONU } from "../../etiketler";
import {
  PLAN_DURUMLARI,
  baslikBul,
  getir,
  useVeri,
  type Durum,
  type Kisi,
  type NextDayPlan,
  type Oneri,
} from "../../veri";
import {
  planAdimiYapabilir,
  planIcerikDuzenler,
  planOperasyonDuzenler,
  yalnizPlanlama,
  yapabilir,
} from "../../yetki";
import {
  GorunumSecici,
  ONERI_TURU,
  OneriListesi,
  useOneriGorunumu,
  type PencereDurumu,
} from "../oneri/OneriKarti";
import { ElleOneriFormu } from "../oneri/OneriFormu";
import PlanaEkle from "../oneri/PlanaEkle";
import { plandakiFaaliyetler } from "../../takvim";
import { TakvimdenListe } from "../takvim/Planlarda";
import BaslikKarti from "./BaslikKarti";
import {
  NdPencereIcerik,
  NextDayBelgesi,
  type NdPencere,
} from "../belge/NextDayBelge";
import GeriAlDugmesi from "../../bilesenler/GeriAl";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { DurumAdimlari, PlanBasiKalibi, adimlariKur } from "../../bilesenler/PlanBasi";
import IceAktarPenceresi from "./IceAktar";
import {
  BaslikEkleFormu,
  Bolum,
  CanliBolumu,
  EkipBolumu,
  EkleDugmesi,
  HareketBolumu,
  HazirBolumu,
  TakipBolumu,
} from "./Bolumler";

/**
 * Next Day planı düzenleme ekranı: promptun "en ayrıntılı geliştirilmesi
 * gereken bölüm" dediği yer. Bölümler kurumun çıktısındaki sırayla, durum
 * çizgisi (taslak → haber toplantısında → onaylı → Newsdesk devraldı) ve
 * akış eylemleri en altta. Temiz çıktı ayrı ekranda (çıktı önizleme).
 */
/*
 * Planın araçları (çağrı, çıktı, belge, gelen öneriler, takvim) başlığın
 * yanında yazılı düğmeler; ekran doğrudan doldurulan bölümlerle (1–6)
 * başlıyor. Öneriler ve takvim pencerede açılıyor. Dünden gelenleri bugüne
 * alma planın başlangıç işi: başlığın hemen altında.
 */
type AracPenceresi = "oneriler" | "takipler" | "takvim" | "aktar" | null;

/*
 * Plan ekranının iki görünümü: klasik (bölümler ve formlar) ve yeni (tek
 * yüzey: belge yerinde düzenlenir, ayrıntı yan panelde; belgeler/kimlik.md).
 * Yeni görünüm denemede: seçim tarayıcıda, beğenilirse klasik silinecek.
 */
const GORUNUM_ANAHTARI = "trt-planlama-nd-gorunum";
type NdGorunum = "klasik" | "yeni" | "sutunlu";
const GORUNUMLER: NdGorunum[] = ["klasik", "yeni", "sutunlu"];
const kayitliGorunum = (): NdGorunum => {
  try {
    const g = localStorage.getItem(GORUNUM_ANAHTARI) as NdGorunum | null;
    return g && GORUNUMLER.includes(g) ? g : "klasik";
  } catch {
    return "klasik";
  }
};

export default function PlanEkrani({
  ben,
  plan,
}: {
  ben: Kisi;
  plan: NextDayPlan;
}) {
  const [gorunum, setGorunum] = useState(kayitliGorunum);
  const degistir = (g: NdGorunum) => {
    setGorunum(g);
    try {
      localStorage.setItem(GORUNUM_ANAHTARI, g);
    } catch {
      /* tarayıcı saklamıyor: bu oturumda geçerli */
    }
  };
  const secim = <NdGorunumSecimi deger={gorunum} degistir={degistir} />;
  if (gorunum === "klasik")
    return <KlasikPlan ben={ben} plan={plan} secim={secim} />;
  return (
    <YeniPlan
      key={gorunum}
      ben={ben}
      plan={plan}
      secim={secim}
      sutunlu={gorunum === "sutunlu"}
    />
  );
}

function NdGorunumSecimi({
  deger,
  degistir,
}: {
  deger: NdGorunum;
  degistir: (g: NdGorunum) => void;
}) {
  const { t } = useDil();
  return (
    <div
      className="nd-gorunum yazdirma-gizle"
      role="group"
      aria-label={t("ndGorunum")}
    >
      {GORUNUMLER.map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={deger === g}
          className={deger === g ? "secili" : ""}
          onClick={() => degistir(g)}
          data-nd-gorunum={g}
        >
          {t(
            g === "klasik" ? "ndKlasik" : g === "yeni" ? "ndYeni" : "ndSutunlu",
          )}
        </button>
      ))}
    </div>
  );
}

type YanSekme = "oneri" | "takip" | "takvim" | "durum";

/*
 * Yeni görünüm: solda içindekiler, ortada planın belgesi (NextDayBelgesi
 * düzenleme kipinde; satır yerinde yazılır), sağda öneriler, takipler,
 * takvim ve planın durumu. Ayrıntı penceresi CSS'te yandan açılan panel
 * (.yeni-plan dialog.pencere): plan yerinde kalsın, ekranı kaplayan form yok.
 */
/*
 * sutunlu (deneme, kullanıcının çizimi): içindekiler yok, belge iki sütun (başlıklar
 * geniş, sabit bölümler dar); öneri/takip/takvim paneli çekmece, kapalıyken belge
 * tam genişlik. Çekmece kipsiz: açıkken öneri kartı belgeye sürüklenebilsin.
 */
function YeniPlan({
  ben,
  plan,
  secim,
  sutunlu,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  secim: ReactNode;
  sutunlu?: boolean;
}) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const [pencere, setPencere] = useState<NdPencere | null>(null);
  const [sekme, setSekme] = useState<YanSekme>("oneri");
  // Klasiğin başlık kartı (paket kararları, LIVE/TBC, muhabire not, başlık menüsü, 🔗…) yan panelde: yeni görünümde özellik eksilmesin.
  const [baslikPanel, setBaslikPanel] = useState<string | null>(null);
  const [hedef, setHedef] = useState<string | null>(null);
  const [birak, setBirak] = useState<{
    oneriId: string;
    baslikId: string;
  } | null>(null);
  const [aktar, setAktar] = useState(false);
  const [cekmece, setCekmece] = useState(false);
  const [onizleme, setOnizleme] = useState(false);
  const sorumlu = temelSorumlular(v, "nextday", gunEkle(plan.tarih, -1));
  useSekmeAdi(
    `${t("nextday")} · ${tarihYaz(plan.tarih, dil, "kisa")} ${kisaGunAdi(plan.tarih, dil)}`,
  );
  const duzen =
    icerik || operasyon
      ? { ben, icerik, operasyon, ac: setPencere, hizli: true }
      : undefined;
  const paketler = v.paketler.filter(
    (p) => p.planId === plan.id && p.durum !== "iptal",
  );
  const kay = (id: string) =>
    document
      .querySelector(`[data-nd-baslik="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  const SEKMELER: [YanSekme, Anahtar][] = [
    ["oneri", "ndSekmeOneri"],
    ["takip", "ndSekmeTakip"],
    ["takvim", "ndSekmeTakvim"],
    ["durum", "ndSekmeDurum"],
  ];
  return (
    <div className={`yeni-plan${sutunlu ? " sutunlu" : ""}`} data-yeni-plan>
      <header className="yp-ust">
        <a className="geri-bag" href="#/nextday">
          <ArrowLeft size={14} className="yon" /> {t("nextdayPlanlari")}
        </a>
        <h1 className="sayfa-adi-tekrar">
          {t("nextday")} · {tarihYaz(plan.tarih, dil, "tam")}
        </h1>
        <Rozet ton={PLAN_DURUM_TONU[plan.durum]}>
          {t(PLAN_DURUM_ADI[plan.durum])}
        </Rozet>
        <span className="sonuk-yazi">
          {t("baslikPaketSayisi", {
            b: plan.basliklar.length,
            p: paketler.length,
          })}
          {sorumlu.length > 0 && (
            <span data-nd-sorumlu={sorumlu.join(",")}>
              {" · "}
              {t("gvBugununSorumlusu")}:{" "}
              {sorumlu
                .map((id) => ad(v.kisiler.find((k) => k.id === id)))
                .join(", ")}
            </span>
          )}
        </span>
        <span className="yp-ust-sag">
          {(icerik || operasyon) && (
            <GeriAlDugmesi ben={ben} planId={plan.id} />
          )}
          {icerik && (
            <button
              type="button"
              className="dugme dugme-ikincil dugme-ikon"
              title={t("planIceAktar")}
              aria-label={t("planIceAktar")}
              onClick={() => setAktar(true)}
              data-arac="aktar"
            >
              <FileUp size={16} />
            </button>
          )}
          {yapabilir(ben, "cagriHazirla") && plan.durum === "taslak" && (
            <a
              className="dugme dugme-ikincil dugme-kucuk"
              href={`#/oneriler/cagri/${plan.tarih}`}
              data-arac="cagri"
            >
              <Megaphone size={15} /> {t("oneriCagrisi")}
            </a>
          )}
          <button
            type="button"
            className="dugme dugme-ikincil dugme-kucuk"
            onClick={() => setOnizleme(true)}
            data-arac="cikti"
          >
            <Printer size={15} /> {t("cikti")}
          </button>
          {sutunlu && (
            <button
              type="button"
              className={`dugme dugme-ikincil dugme-kucuk${cekmece ? " secili" : ""}`}
              aria-pressed={cekmece}
              onClick={() => setCekmece((x) => !x)}
              data-yp-cekmece
            >
              <PanelRight size={15} /> {t("ndYanPanel")}
            </button>
          )}
          {secim}
        </span>
      </header>
      <KayipSeridi ben={ben} plan={plan} />
      <div className="yp-izgara">
        {!sutunlu && (
          <nav className="yp-icindekiler" aria-label={t("icindekiler")}>
            <span className="yp-etiket">{t("icindekiler")}</span>
            {plan.basliklar.map((pb) => {
              const n =
                v.gelismeler.filter((g) => g.planBaslikId === pb.id).length +
                paketler.filter((p) => p.planBaslikId === pb.id).length;
              return (
                <div key={pb.id} className="yp-icindekiler-satir">
                  <button
                    type="button"
                    onClick={() => kay(pb.id)}
                    data-yp-icindekiler={pb.id}
                  >
                    <Icerik>{baslikBul(v, pb.baslikId)?.ad ?? ""}</Icerik>
                    <span className="sonuk-yazi">{n}</span>
                  </button>
                  <button
                    type="button"
                    className="yp-islem"
                    title={t("baslikIslemleri")}
                    aria-label={t("baslikIslemleri")}
                    onClick={() => setBaslikPanel(pb.id)}
                    data-yp-baslik-islem={pb.id}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              );
            })}
          </nav>
        )}
        <div
          className={`yp-belge cikti-sarici belge-duzen ${hedef ? "birakiliyor" : ""}`}
          // Öneri kartı başlığa bırakılınca "Plana ekle" o başlıkla açılır; PKG/canlı kararı ve onay formda.
          onDragOver={(e) => {
            if (!icerik || !e.dataTransfer.types.includes(ONERI_TURU)) return;
            const b = (e.target as HTMLElement).closest<HTMLElement>(
              "[data-nd-baslik]",
            );
            e.currentTarget
              .querySelectorAll(".hedef")
              .forEach((x) => x !== b && x.classList.remove("hedef"));
            if (!b) return setHedef(null);
            e.preventDefault();
            b.classList.add("hedef");
            setHedef(b.dataset.ndBaslik ?? null);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            e.currentTarget
              .querySelectorAll(".hedef")
              .forEach((x) => x.classList.remove("hedef"));
            setHedef(null);
          }}
          onDrop={(e) => {
            e.currentTarget
              .querySelectorAll(".hedef")
              .forEach((x) => x.classList.remove("hedef"));
            const id = e.dataTransfer.getData(ONERI_TURU);
            const pb = plan.basliklar.find((x) => x.id === hedef);
            setHedef(null);
            if (!id || !pb) return;
            e.preventDefault();
            setBirak({ oneriId: id, baslikId: pb.baslikId });
          }}
          data-yp-hedef={hedef ?? undefined}
        >
          <NextDayBelgesi plan={plan} duzen={duzen} sutunlu={sutunlu} />
        </div>
        {(!sutunlu || cekmece) && (
          <aside className={`yp-yan${sutunlu ? " yp-cekmece" : ""}`}>
            {sutunlu && (
              <button
                type="button"
                className="dugme dugme-sade dugme-ikon yp-cekmece-kapat"
                title={t("kapat")}
                aria-label={t("kapat")}
                onClick={() => setCekmece(false)}
              >
                <X size={16} />
              </button>
            )}
            <div className="yp-sekmeler" role="tablist">
              {SEKMELER.map(([s, ad]) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={sekme === s}
                  className={sekme === s ? "secili" : ""}
                  onClick={() => setSekme(s)}
                  data-yp-sekme={s}
                >
                  {t(ad)}
                </button>
              ))}
            </div>
            <div className="yp-yan-icerik">
              {sekme === "oneri" && <GelenOneriler ben={ben} plan={plan} />}
              {sekme === "takip" && <PlanTakipleri ben={ben} plan={plan} />}
              {sekme === "takvim" && (
                <TakvimdenListe
                  ben={ben}
                  bas={plan.tarih}
                  bit={plan.tarih}
                  tur="nextday"
                  planId={plan.id}
                  ekleyebilir={operasyon}
                  eklemeMetni={t("planaEkle")}
                />
              )}
              {sekme === "durum" && <PlanDurumKarti ben={ben} plan={plan} />}
            </div>
          </aside>
        )}
      </div>
      {pencere && duzen && (
        <NdPencereIcerik
          ben={ben}
          plan={plan}
          p={pencere}
          kapat={() => setPencere(null)}
        />
      )}
      {baslikPanel &&
        (() => {
          const i = plan.basliklar.findIndex((x) => x.id === baslikPanel);
          const pb = plan.basliklar[i];
          if (!pb) return null;
          return (
            <Pencere
              baslik={t("baslikIslemleri")}
              alt={<Icerik>{baslikBul(v, pb.baslikId)?.ad ?? ""}</Icerik>}
              kapat={() => setBaslikPanel(null)}
            >
              <BaslikKarti
                plan={plan}
                pb={pb}
                sira={i}
                toplam={plan.basliklar.length}
                icerik={icerik}
                operasyon={operasyon}
                acik
              />
            </Pencere>
          );
        })()}
      {birak &&
        (() => {
          const o = v.oneriler.find((x) => x.id === birak.oneriId);
          if (!o) return null;
          return (
            <Pencere
              baslik={t("planaEkle")}
              alt={<Icerik>{o.haberBasligi}</Icerik>}
              kapat={() => setBirak(null)}
            >
              <PlanaEkle
                ben={ben}
                oneri={o}
                planId={plan.id}
                baslikId={birak.baslikId}
                kapat={() => setBirak(null)}
              />
            </Pencere>
          );
        })()}
      {aktar && (
        <IceAktarPenceresi
          ben={ben}
          plan={plan}
          kapat={() => setAktar(false)}
        />
      )}
      {onizleme && (
        <CiktiOnizleme plan={plan} kapat={() => setOnizleme(false)} />
      )}
    </div>
  );
}

function KlasikPlan({
  ben,
  plan,
  secim,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  secim: ReactNode;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const paketler = v.paketler.filter(
    (p) => p.planId === plan.id && p.durum !== "iptal",
  );
  const [arac, setArac] = useState<AracPenceresi>(null);
  useSekmeAdi(
    `${t("nextday")} · ${tarihYaz(plan.tarih, dil, "kisa")} ${kisaGunAdi(plan.tarih, dil)}`,
  );
  // Bir günün planını önceki gün hazırlıyor: sorumlu, bir önceki günün Next Day görevlisi (iş taksimi, gorevler.ts).
  const sorumlu = temelSorumlular(v, "nextday", gunEkle(plan.tarih, -1));

  return (
    <>
      <PlanBasi ben={ben} plan={plan} secim={secim} ac={setArac} sorumlu={sorumlu} paket={paketler.length} />
      <KayipSeridi ben={ben} plan={plan} />

      <EkipBolumu plan={plan} duzenler={icerik} />
      <HareketBolumu plan={plan} duzenler={icerik} />
      <CanliBolumu plan={plan} duzenler={operasyon} d={v} />
      <HazirBolumu plan={plan} duzenler={icerik} d={v} />
      <GundemBolumu plan={plan} icerik={icerik} operasyon={operasyon} />
      <TakipBolumu plan={plan} duzenler={operasyon} d={v} no={6} />

      {arac === "oneriler" && (
        <Pencere
          genis
          baslik={t("buPlanaGelenOneriler")}
          alt={tarihYaz(plan.tarih, dil, "tam")}
          kapat={() => setArac(null)}
        >
          <GelenOneriler ben={ben} plan={plan} />
        </Pencere>
      )}
      {/* Muhabir takipleri gelen önerilerden ayrı: yalnız gelişme bildiren takip öneri listesini kalabalıklaştırmasın. */}
      {arac === "takipler" && (
        <Pencere
          genis
          baslik={t("mtAcikTakipler")}
          alt={tarihYaz(plan.tarih, dil, "tam")}
          kapat={() => setArac(null)}
        >
          <PlanTakipleri ben={ben} plan={plan} />
        </Pencere>
      )}
      {arac === "takvim" && (
        <Pencere
          genis
          baslik={t("takvimdenGun")}
          alt={tarihYaz(plan.tarih, dil, "tam")}
          kapat={() => setArac(null)}
        >
          <TakvimdenListe
            ben={ben}
            bas={plan.tarih}
            bit={plan.tarih}
            tur="nextday"
            planId={plan.id}
            ekleyebilir={operasyon}
            eklemeMetni={t("planaEkle")}
          />
        </Pencere>
      )}
      {arac === "aktar" && (
        <IceAktarPenceresi ben={ben} plan={plan} kapat={() => setArac(null)} />
      )}
    </>
  );
}

/*
 * Klasik görünümün üst kısmı (kullanıcı: "üstte gereksiz kalabalık"; üç
 * tasarım önerisinin birleşimi): tek satır başlık, ↶ ve ⋯; altında
 * "Sıradaki" kartı (planın durumu ve o anki tek iş); altında künye ve sayılı
 * Öneri / Takip / Takvim. Nadir işler (çıktı, belge, öneri çağrısı, geçmiş
 * plandan aktarma, görünüm seçimi) ⋯ menüsünde. Telefonda plan ilk ekranda
 * başlıyor; önce dört satır düğme ve tam genişlik mavi şerit vardı.
 */
function PlanBasi({
  ben,
  plan,
  secim,
  ac,
  sorumlu,
  paket,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  secim: ReactNode;
  ac: (a: AracPenceresi) => void;
  sorumlu: string[];
  paket: number;
}) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const [onizleme, setOnizleme] = useState(false);
  const bugunun = v.oneriler.filter((o) => oneriBuGunun(o, plan.tarih) && o.durum !== "takip");
  const bekleyen = bugunun.filter((o) => o.durum === "yeni" || o.durum === "degerlendiriliyor").length;
  const takip = takipOnerileri(ben, v).length;
  const faaliyet = plandakiFaaliyetler(v, ben, plan.tarih, plan.tarih).length;
  // Sayı "bekleyen/toplam": kırmızı yalnız karar bekleyen varken, gerisi sönük (önce yalnız toplam yazıyordu, acil olan anlaşılmıyordu).
  const sayi = (n: string | number, kirmizi: boolean) => <em className={`dugme-sayi${kirmizi ? "" : " sonuk"}`}>{n}</em>;
  const cip = (anahtar: string, ikon: ReactNode, adi: Anahtar, baslik: Anahtar, hedef: () => void, sayac?: ReactNode) => (
    <button key={anahtar} type="button" className="dugme dugme-ikincil" onClick={hedef} title={t(baslik)} data-arac={anahtar}>
      {ikon} {t(adi)}
      {sayac}
    </button>
  );
  const is = useSiradakiIs(ben, plan);
  const adimlar = useNdAdimlari(plan);
  return (
    <>
      <PlanBasiKalibi
        geri={
          <a className="dugme dugme-sade dugme-ikon pb-geri yazdirma-gizle" href="#/nextday" title={t("nextdayPlanlari")} aria-label={t("nextdayPlanlari")}>
            <ArrowLeft size={18} className="yon" />
          </a>
        }
        baslik={`${t("nextday")} · ${tarihYaz(plan.tarih, dil, "kisa")} ${kisaGunAdi(plan.tarih, dil)}`}
        uc={
          <>
            {(icerik || operasyon) && <GeriAlDugmesi ben={ben} planId={plan.id} />}
            <PlanMenusu ben={ben} plan={plan} secim={secim} ac={ac} onizle={() => setOnizleme(true)} />
          </>
        }
        adimlar={adimlar}
        metin={is.metin}
        dugmeler={is.dugmeler}
        kunye={
          <>
            {t("baslikPaketSayisi", { b: plan.basliklar.length, p: paket })}
            {sorumlu.length > 0 && (
              <span data-nd-sorumlu={sorumlu.join(",")}>
                {" · "}
                {t("gvBugununSorumlusu")}: {sorumlu.map((id) => ad(v.kisiler.find((k) => k.id === id))).join(", ")}
              </span>
            )}
          </>
        }
        araclar={
          <>
            {icerik && cip("oneriler", <Lightbulb size={16} />, "oneri", "buPlanaGelenOneriler", () => ac("oneriler"), bugunun.length > 0 && sayi(bekleyen ? `${bekleyen}/${bugunun.length}` : bugunun.length, bekleyen > 0))}
            {icerik && cip("takipler", <Binoculars size={16} />, "pbTakip", "mtAcikTakipler", () => ac("takipler"), takip > 0 && sayi(takip, true))}
            {cip("takvim", <CalendarSearch size={16} />, "ndSekmeTakvim", "takvimdenGun", () => ac("takvim"), faaliyet > 0 && sayi(faaliyet, false))}
          </>
        }
      />
      {onizleme && <CiktiOnizleme plan={plan} kapat={() => setOnizleme(false)} />}
    </>
  );
}

/* ⋯: her gün gerekmeyen işler. Görünüm seçimi de burada (bir kez seçilen tercih, her gün satır kaplıyordu). */
function PlanMenusu({
  ben,
  plan,
  secim,
  ac,
  onizle,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  secim: ReactNode;
  ac: (a: AracPenceresi) => void;
  onizle: () => void;
}) {
  const { t } = useDil();
  const icerik = planIcerikDuzenler(ben, plan);
  const operasyon = planOperasyonDuzenler(ben, plan);
  const a = usePlanAkisi(ben, plan);
  return (
    <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-ikon" menuSinifi="plan-menusu" katman>
      <button type="button" role="menuitem" className="acilir-satir" onClick={onizle} data-arac="cikti">
        <Printer size={16} /> {t("ciktiOnizleme")}
      </button>
      {(icerik || operasyon) && (
        <a role="menuitem" className="acilir-satir" href={`#/nextday/${plan.id}/belge`} data-arac="belge">
          <FilePen size={16} /> {t("belgedeDuzenle")}
        </a>
      )}
      {yapabilir(ben, "cagriHazirla") && plan.durum === "taslak" && (
        <a role="menuitem" className="acilir-satir" href={`#/oneriler/cagri/${plan.tarih}`} data-arac="cagri">
          <Megaphone size={16} /> {t("oneriCagrisi")}
        </a>
      )}
      {icerik && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={() => ac("aktar")} data-arac="aktar">
          <FileUp size={16} /> {t("planIceAktar")}
        </button>
      )}
      {a.onayGeriAlir && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={a.onayGeriAl} data-onay-geri>
          <Undo2 size={16} /> {t("onayiGeriAl")}
        </button>
      )}
      <div className="plan-menusu-gorunum" onClick={(e) => e.stopPropagation()}>
        <small>{t("ndGorunum")}</small>
        {secim}
      </div>
    </IslemMenusu>
  );
}

/*
 * "Sıradaki" kartı (kimliğin üç sorusu: ne oluyor, kimde, sıradaki ne):
 * durum çizgisi ve planın o anki tek işi. Dolu düğme yalnız gerçek kararda
 * (onay); rutin işler (dünden gelenleri almak, toplantıya götürmek) yumuşak.
 * Önce "Hepsini bugüne al" tam genişlik mavi şeritti, sayfanın en ağır öğesiydi;
 * plan akışının düğmeleri sayfanın dibindeydi.
 */
function useSiradakiIs(ben: Kisi, plan: NextDayPlan): { metin: ReactNode; dugmeler: ReactNode } {
  const { t } = useDil();
  const a = usePlanAkisi(ben, plan);
  let metin: ReactNode = null;
  let dugmeler: ReactNode = null;
  // Dünden gelenler için ayrı iş yok (kullanıcı: renkli duruyorlar, yeter); taslakta sıradaki iş toplantı.
  if (plan.durum === "taslak") {
    dugmeler = a.toplantiyaGoturur && (
      <button type="button" className="dugme dugme-yumusak" onClick={a.toplantiyaGotur}>
        <Send size={16} className="yon" /> {t("toplantiyaGotur")}
      </button>
    );
  } else if (plan.durum === "toplantida") {
    metin = a.kararsiz ? t("skKararsiz", { n: a.kararsiz, m: a.gorevli }) : t("skKararYok");
    dugmeler = (
      <>
        {a.taslagaAlir && (
          <button type="button" className="dugme dugme-sade" onClick={a.taslagaAl}>
            <Undo2 size={16} /> {t("taslagaGeriAl")}
          </button>
        )}
        {a.onaylar && (
          <button type="button" className="dugme" onClick={a.onayla}>
            <Check size={16} /> {t("planiOnayla")}
          </button>
        )}
      </>
    );
  } else {
    metin = a.takdirSayisi ? t("skKabul", { n: a.takdirSayisi }) : t(PLAN_DURUM_ADI[plan.durum]);
    dugmeler = (
      <>
        {a.takdirAcar && (
          <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/takdir`} data-takdir-ac>
            <MailCheck size={16} /> {t("tkBildir")}
          </a>
        )}
        {a.devralir && (
          <button type="button" className="dugme" onClick={a.devral}>
            <UserCheck size={16} /> {t("planiDevral")}
          </button>
        )}
      </>
    );
  }
  return { metin, dugmeler };
}

/* Kartın kısa adımları: Newsdesk sistemde değilken "devraldı" adımı gelmiyor, gösterilmez. */
function useNdAdimlari(plan: NextDayPlan) {
  const { t } = useDil();
  const v = useVeri();
  const sira = yalnizPlanlama(v) && plan.durum !== "devralindi" ? PLAN_DURUMLARI.filter((d) => d !== "devralindi") : PLAN_DURUMLARI;
  return adimlariKur(sira, plan.durum, (d) => ({ ad: t(KISA_DURUM_ADI[d]), ipucu: t(PLAN_DURUM_ADI[d]) }));
}

/*
 * Başlığı kaybolmuş kayıtlar (kayipKayitlar.ts): plan şablondan yeniden
 * yazıldığında o gün eklenen başlıklar düştü, altındakiler görünmez kaldı.
 * Planlamacı her grubu doğru başlığa geri koyuyor.
 */
function KayipSeridi({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const gruplar = kayipBasliklar(v, plan);
  if (!planIcerikDuzenler(ben, plan) || (!gruplar.length && !acik)) return null;
  const sayi = gruplar.reduce(
    (n, g) => n + g.gelismeler.length + g.paketler.length + g.canlilar.length,
    0,
  );
  return (
    <>
      {gruplar.length > 0 && (
        <div className="onceki-seridi" data-kayip-seridi>
          <span className="onceki-sayi">{t("kayipKayitlar", { n: sayi })}</span>
          <button className="dugme" onClick={() => setAcik(true)} data-kayip-ac>
            <Undo2 size={16} /> {t("geriGetir")}
          </button>
        </div>
      )}
      {acik && (
        <Pencere
          genis
          baslik={t("kayipKayitlarBaslik")}
          kapat={() => setAcik(false)}
        >
          {gruplar.length === 0 ? (
            <Bos kucuk metin={t("kayitYok")} />
          ) : (
            gruplar.map((g) => (
              <KayipGrupSatiri key={g.pbId} ben={ben} plan={plan} grup={g} />
            ))
          )}
        </Pencere>
      )}
    </>
  );
}

function KayipGrupSatiri({
  ben,
  plan,
  grup,
}: {
  ben: Kisi;
  plan: NextDayPlan;
  grup: KayipGrup;
}) {
  const { t } = useDil();
  const v = useVeri();
  const { plandaki, onceki } = ndBaslikSecenekleri(v, plan);
  const onerilen = grup.onerilen
    ? v.basliklar.find((b) => b.id === grup.onerilen)
    : undefined;
  const ekBaslik =
    onerilen && ![...plandaki, ...onceki].some((b) => b.id === onerilen.id)
      ? onerilen
      : undefined;
  const [secim, setSecim] = useState(onerilen?.id ?? "yeni");
  const [yeni, setYeni] = useState("");
  const geriKoy = () => {
    if (
      kayipBaslikGeriGetir(
        ben,
        plan.id,
        grup.pbId,
        secim === "yeni" ? { yeniBaslik: yeni } : { baslikId: secim },
      )
    )
      bildir(t("bKaydedildi"));
  };
  return (
    <section className="kart form" data-kayip-grup={grup.pbId}>
      <ul className="kayip-liste">
        {grup.gelismeler.map((x) => (
          <li key={x.id}>
            <Icerik blok>{x.yer ? `${x.yer} / ${x.metin}` : x.metin}</Icerik>
          </li>
        ))}
        {grup.paketler.map((x) => (
          <li key={x.id}>
            <Icerik blok>{`PKG · ${x.baslik}`}</Icerik>
          </li>
        ))}
        {grup.canlilar.map((x) => (
          <li key={x.id}>
            <Icerik blok>{`LIVE · ${x.konu}`}</Icerik>
          </li>
        ))}
      </ul>
      <div className="satir">
        <label>
          {t("baslik")}
          <select
            value={secim}
            onChange={(e) => setSecim(e.target.value)}
            data-kayip-baslik
          >
            {plandaki.length > 0 && (
              <optgroup label={t("plandakiBasliklar")}>
                {plandaki.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
              </optgroup>
            )}
            {onceki.length > 0 && (
              <optgroup label={t("oncekiGununBasliklari")}>
                {onceki.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ad}
                  </option>
                ))}
              </optgroup>
            )}
            {ekBaslik && (
              <optgroup label={t("onerininBasligi")}>
                <option value={ekBaslik.id}>{ekBaslik.ad}</option>
              </optgroup>
            )}
            <option value="yeni">+ {t("yeniBaslikOlustur")}</option>
          </select>
        </label>
        {secim === "yeni" && (
          <label>
            {t("yeniBaslik")}
            <input
              {...icerikAlani}
              value={yeni}
              onChange={(e) => setYeni(e.target.value)}
              data-kayip-yeni
            />
          </label>
        )}
      </div>
      <div className="form-alt">
        <button
          className="dugme"
          onClick={geriKoy}
          disabled={secim === "yeni" && !yeni.trim()}
          data-kayip-koy
        >
          {t("basligaGeriKoy")}
        </button>
      </div>
    </section>
  );
}

/* Planın durumu ve akıştaki eylemler: bölümlerin altında. */
/*
 * Planın akış adımları (toplantıya götür, onayla, taslağa al, onayı geri al,
 * devral) tek yerde: üstteki "Sıradaki" kartı (klasik) ve yeni görünümün
 * durum sekmesi aynı eylemi aynı soruyla çağırıyor.
 */
function usePlanAkisi(ben: Kisi, plan: NextDayPlan) {
  const { t } = useDil();
  const v = useVeri();
  // Onay kararsız paketleri kabul sayıyor (planDurum); onay penceresi kaç paketin kabul edileceğini, kaç muhabire görev gideceğini söylüyor.
  const kararsiz = v.paketler.filter(
    (p) =>
      p.planId === plan.id &&
      (p.durum === "taslak" || p.durum === "degerlendiriliyor"),
  );
  const gorevli = new Set(kararsiz.map((p) => p.muhabirId).filter(Boolean))
    .size;
  const durumDegistir = (yeni: NextDayPlan["durum"], mesaj: Anahtar) => {
    if (!planDurum(ben, plan.id, yeni)) return false;
    bildir(t(mesaj));
    return true;
  };
  const takdirSayisi = takdirPaketleri(v, plan.id).length;
  return {
    kararsiz: kararsiz.length,
    gorevli,
    takdirSayisi,
    toplantiyaGoturur: plan.durum === "taslak" && planAdimiYapabilir(ben, "ndToplanti"),
    onaylar: plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndOnay"),
    taslagaAlir: plan.durum === "toplantida" && planAdimiYapabilir(ben, "ndToplanti"),
    onayGeriAlir: plan.durum === "onayli" && planAdimiYapabilir(ben, "ndOnayGeri"),
    // Newsdesk sistemde değilken devir yok: Next Day paketleri Planlama'nın yolunda kapanıyor.
    devralir: plan.durum === "onayli" && !yalnizPlanlama(v) && planAdimiYapabilir(ben, "ndDevral"),
    takdirAcar: (plan.durum === "onayli" || plan.durum === "devralindi") && takdirSayisi > 0 && yapabilir(ben, "planDuzenle"),
    toplantiyaGotur: () => confirm(t("toplantiyaGoturSoru")) && durumDegistir("toplantida", "bToplantiya"),
    // Onaydan sonra PKG geri bildirimi sayfası açılıyor (kullanıcı: paketleri tek tek işaretleyip göndereyim; kendiliğinden gitmesin).
    onayla: () => {
      if (!confirm(kararsiz.length ? t("planOnaySayili", { n: kararsiz.length, m: gorevli }) : t("planOnaySoru"))) return;
      if (durumDegistir("onayli", "bPlanOnaylandi") && yapabilir(ben, "planDuzenle") && takdirPaketleri(getir(), plan.id).length) git(`nextday/${plan.id}/takdir`);
    },
    taslagaAl: () => durumDegistir("taslak", "bTaslaga"),
    onayGeriAl: () => confirm(t("onayiGeriAlSoru")) && durumDegistir("toplantida", "bOnayGeriAlindi"),
    devral: () => durumDegistir("devralindi", "bPlanDevralindi"),
  };
}

const KISA_DURUM_ADI: Record<NextDayPlan["durum"], Anahtar> = {
  taslak: "pdKisaTaslak",
  toplantida: "pdKisaToplanti",
  onayli: "pdKisaOnayli",
  devralindi: "pdKisaDevralindi",
};

function DurumCizgisi({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  return <DurumAdimlari adimlar={adimlariKur(PLAN_DURUMLARI, plan.durum, (d) => ({ ad: t(PLAN_DURUM_ADI[d]) }))} />;
}

/* Yeni görünümün durum sekmesi: çizgi ve bütün adımlar alt alta. */
function PlanDurumKarti({ ben, plan }: { ben: Kisi; plan: NextDayPlan }) {
  const { t } = useDil();
  const a = usePlanAkisi(ben, plan);
  return (
    <section className="kart plan-durum-karti">
      <DurumCizgisi plan={plan} />
      <div className="dugmeler ara-ust-2">
        {a.toplantiyaGoturur && (
          <button className="dugme" onClick={a.toplantiyaGotur}>
            <Send size={16} className="yon" /> {t("toplantiyaGotur")}
          </button>
        )}
        {a.onaylar && (
          <button className="dugme dugme-iyi" onClick={a.onayla}>
            <Check size={16} /> {t("planiOnayla")}
          </button>
        )}
        {a.taslagaAlir && (
          <button className="dugme dugme-ikincil" onClick={a.taslagaAl}>
            <Undo2 size={16} /> {t("taslagaGeriAl")}
          </button>
        )}
        {a.onayGeriAlir && (
          <button className="dugme dugme-ikincil" data-onay-geri onClick={a.onayGeriAl}>
            <Undo2 size={16} /> {t("onayiGeriAl")}
          </button>
        )}
        {a.takdirAcar && (
          <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/takdir`} data-takdir-ac>
            <MailCheck size={16} /> {t("tkBildir")}
          </a>
        )}
        {a.devralir && (
          <button className="dugme" onClick={a.devral}>
            <UserCheck size={16} /> {t("planiDevral")}
          </button>
        )}
      </div>
    </section>
  );
}

/* --- 5. Haber gündemi: merkezi başlıklardan seçilen ve sıralanan başlıklar --- */

function GundemBolumu({
  plan,
  icerik,
  operasyon,
}: {
  plan: NextDayPlan;
  icerik: boolean;
  operasyon: boolean;
}) {
  const { t } = useDil();
  const [ekle, setEkle] = useState(false);

  return (
    <Bolum
      ar
      no={5}
      baslik={metin("haberGundemi", "ar")}
      ek={t("baslikSayisi", { n: plan.basliklar.length })}
    >
      {plan.basliklar.length === 0 && <Bos metin={t("baslikYok")} />}
      {plan.basliklar.map((pb, i) => (
        <BaslikKarti
          key={pb.id}
          plan={plan}
          pb={pb}
          sira={i}
          toplam={plan.basliklar.length}
          icerik={icerik}
          operasyon={operasyon}
        />
      ))}
      {icerik &&
        (ekle ? (
          <BaslikEkleFormu plan={plan} kapat={() => setEkle(false)} />
        ) : (
          <div className="ara-ust-2">
            <button
              className="dugme dugme-ikincil"
              onClick={() => setEkle(true)}
            >
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
    // Plana eklenen de listede kalıyor (en sonda, "Plana eklendi" notuyla): ne geldiği ve ne olduğu bir arada görünsün.
    // Takipteki öneri "Muhabir takipleri" penceresinde; gelen öneriler listesini kalabalıklaştırmasın.
    .filter((o) => oneriBuGunun(o, plan.tarih) && o.durum !== "takip")
    .sort((a, b) => sira(v, a) - sira(v, b) || b.zaman.localeCompare(a.zaman))
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
          {yapabilir(ben, "oneriGonder") && (
            <EkleDugmesi metin={t("oneriEkle")} onClick={() => setElle(true)} />
          )}
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
        ekleFormu={(o, kapat) => (
          <PlanaEkle ben={ben} oneri={o} planId={plan.id} kapat={kapat} />
        )}
        ertelenebilir
      />
    </>
  );
}

// Düzeltmedeki öneri muhabirde bekliyor; Planlama'nın önündekilerin arkasında.
const SIRA: Record<Oneri["durum"], number> = {
  yeni: 0,
  degerlendiriliyor: 1,
  duzeltme: 2,
  takip: 2,
  teklif: 3,
  sonra: 4,
  reddedildi: 5,
  geriCekildi: 5,
  planaEklendi: 6,
};
// Haftalık gündeme alınan öneri de karar almış: plana eklenenle birlikte en sonda.
const sira = (d: Durum, o: Oneri) =>
  o.durum !== "planaEklendi" && oneriYeri(d, o)
    ? SIRA.planaEklendi
    : SIRA[o.durum];
