import {
  AlertTriangle,
  Building,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  CirclePlay,
  ClipboardCheck,
  Clapperboard,
  Clock,
  History,
  Inbox,
  Lightbulb,
  ListChecks,
  MapPin,
  MapPinned,
  MonitorPlay,
  Route,
  SpellCheck,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { geciktiMi } from "../../akis";
import { planDurum } from "../../eylemler";
import { KalemListesi, OnIncelemeKarti } from "../../bilesenler/Haftalik";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Icerik, Kart, NotKutu, Rozet, Sayac, TaslakEtiketi, Tumu, bildir } from "../../bilesenler/Parcalar";
import { OneriTablosu, PaketTablosu } from "../../bilesenler/Tablolar";
import { tarihYaz, useDil } from "../../dil";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, PLAN_DURUM_ADI, PLAN_DURUM_TONU, kisiAr, satir, sehirAdi } from "../../etiketler";
import { gorusBekleyenler, gundemde } from "../../haftalik";
import { bugun, gunEkle, haftaBasi, planlananHafta } from "../../tarih";
import { kisiBul, muhabirler, sahaGorevi, useVeri, type Durum, type Kisi } from "../../veri";
import { adimYapabilir, yapabilir } from "../../yetki";
import { CalismaAlani, type Alan } from "./Calisma";
import { SayfaBasi } from "./Planlama";

/**
 * Diğer birimlerin ana sayfaları: promptun 3. maddesindeki ilk taslak.
 *
 * Her birimin ayrıntılı iş akışı sonra tanımlanacak; burada yalnız ortak
 * kayıtlardan kendiliğinden çıkan listeler var. Tanımı bitmemiş alanlar
 * (News Gathering lojistiği, program üretimi, ücret ödemesi) "taslak akış"
 * etiketi taşıyor ki kesinleşmiş gibi okunmasın.
 */

const uretimdeki = (d: Durum) => d.paketler.filter((p) => p.durum === "uretimde");

/* --- Newsdesk --- */

export function NewsdeskAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<Building size={26} />} baslik={t("biNewsdesk")} alt={t("newsdeskAlt")} />
      <CalismaAlani ben={ben} duzen="newsdesk" kisisel={kisisel} />
    </>
  );
}

function useNewsdesk(ben: Kisi) {
  const v = useVeri();
  const B = bugun();
  const bugunPlan = v.planlar.find((p) => p.tarih === B);
  return {
    v,
    bugunPlan,
    yarinPlan: v.planlar.find((p) => p.tarih === gunEkle(B, 1)),
    kontrol: uretimdeki(v).filter((p) => ["kontrol", "iletim", "inews"].includes(p.adim ?? "") && adimYapabilir(ben, p)),
    geciken: v.paketler.filter((p) => geciktiMi(p)),
    bugunku: v.paketler.filter((p) => p.planId === bugunPlan?.id && p.durum !== "iptal"),
  };
}

function NewsdeskSayaclari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, kontrol, geciken, bugunku } = useNewsdesk(ben);
  return (
    <div className="sayaclar">
      <Sayac href="#/uretim" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sUretimde")} deger={uretimdeki(v).length} />
      <Sayac href="#/metinkontrol" ikon={<SpellCheck size={22} />} ton="uyari" etiket={t("sKontrolBekleyen")} deger={kontrol.length} />
      <Sayac href="#/uretim" ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={geciken.length} />
      <Sayac href="#/paketler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sBugunTamamlanan")} deger={bugunku.filter((p) => p.durum === "tamamlandi").length} />
    </div>
  );
}

function UygulanacakPlan({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const { v, bugunPlan, yarinPlan } = useNewsdesk(ben);
  const devral = () => yarinPlan && planDurum(ben, yarinPlan.id, "devralindi") && bildir(t("bPlanDevralindi"));
  return (
    <Kart baslik={t("uygulanacakPlan")} ikon={<CalendarDays size={18} />}>
      <ul className="liste">
        {[bugunPlan, yarinPlan].filter(Boolean).map((p) => (
          <li key={p!.id}>
            <div className="ad">
              <a href={`#/nextday/${p!.id}`}>
                {t("nextday")} · {tarihYaz(p!.tarih, dil, "uzun")}
              </a>
              <small>{t("baslikPaketSayisi", { b: p!.basliklar.length, p: v.paketler.filter((x) => x.planId === p!.id && x.durum !== "iptal").length })}</small>
            </div>
            <Rozet ton={PLAN_DURUM_TONU[p!.durum]}>{t(PLAN_DURUM_ADI[p!.durum])}</Rozet>
          </li>
        ))}
      </ul>
      {yarinPlan?.durum === "onayli" && yapabilir(ben, "planDevral") && (
        <div className="ara-ust-2">
          <button className="dugme" onClick={devral}>
            {t("planiDevral")}
          </button>
        </div>
      )}
      {yarinPlan && yarinPlan.durum !== "onayli" && yarinPlan.durum !== "devralindi" && <p className="bos-kucuk">{t("devirIcinOnayBekleniyor")}</p>}
    </Kart>
  );
}

function KontrolBekleyen({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, kontrol } = useNewsdesk(ben);
  return (
    <Kart baslik={t("kontrolBekleyen")} ikon={<SpellCheck size={18} />}>
      <PaketTablosu paketler={kontrol} d={v} sutunlar={["baslik", "muhabir", "asama", "teslim"]} bosMetin={t("siraBos")} />
    </Kart>
  );
}

function BugununUretimi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, bugunku } = useNewsdesk(ben);
  return (
    <Kart baslik={t("bugununUretimi")} ikon={<ListChecks size={18} />} sagUc={<Tumu href="#/uretim" />}>
      <PaketTablosu paketler={bugunku} d={v} />
    </Kart>
  );
}

function GecikenOncelikli({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, geciken } = useNewsdesk(ben);
  return (
    <Kart baslik={t("gecikenOncelikli")} ikon={<AlertTriangle size={18} />}>
      <PaketTablosu paketler={geciken} d={v} sutunlar={["baslik", "muhabir", "kimde", "teslim"]} bosMetin={t("gecikenYok")} />
    </Kart>
  );
}

function UcretKarti() {
  const { t } = useDil();
  return (
    <Kart baslik={t("mUcretler")} ikon={<Wallet size={18} />} sagUc={<TaslakEtiketi metin={t("ornekEkran")} />}>
      <p className="aciklama">{t("ucretKartAciklama")}</p>
      <a className="dugme dugme-ikincil" href="#/ucretler">
        {t("ucretleriAc")}
      </a>
    </Kart>
  );
}

/* --- News Gathering --- */

export function NewsGatheringAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<MapPin size={26} />} baslik={t("biNewsgathering")} alt={t("ngAlt")} sagUc={<TaslakEtiketi />} />
      <CalismaAlani ben={ben} duzen="newsgathering" kisisel={kisisel} />
      <NotKutu>{t("ngTaslakNotu")}</NotKutu>
    </>
  );
}

function useNewsGathering() {
  const v = useVeri();
  const B = bugun();
  return {
    v,
    B,
    sahaAdimi: uretimdeki(v).filter((p) => p.adim === "gorevlendirme"),
    sahaGerekecek: v.paketler.filter((p) => p.sahaGerekli && ["taslak", "degerlendiriliyor", "onaylandi"].includes(p.durum)),
    talepler: v.gorevlendirmeler.filter((g) => g.durum === "talep"),
    sahada: muhabirler(v).filter((k) => k.durum === "sahada" || k.durum === "yolda"),
    takvim: v.gorevlendirmeler.filter((g) => g.bitis >= B && g.baslangic <= gunEkle(B, 14)).sort((a, b) => a.baslangic.localeCompare(b.baslangic)),
  };
}

function NgSayaclari() {
  const { t } = useDil();
  const { v, B, talepler, sahaAdimi, sahada } = useNewsGathering();
  return (
    <div className="sayaclar">
      <Sayac href="#/talepler" ikon={<Inbox size={22} />} ton="uyari" etiket={t("sYeniTalep")} deger={talepler.length + sahaAdimi.length} />
      <Sayac ikon={<MapPin size={22} />} renk="renk-nextday" etiket={t("sSahada")} deger={sahada.length} />
      <Sayac href="#/saha" ikon={<MapPinned size={22} />} renk="renk-saha" etiket={t("sSahaGorev")} deger={v.gorevlendirmeler.filter((g) => sahaGorevi(g) && g.bitis >= B).length} />
      <Sayac ikon={<Route size={22} />} renk="renk-haftalik" etiket={t("sSeyahat")} deger={v.gorevlendirmeler.filter((g) => g.tur === "seyahat" && g.bitis >= B).length} />
    </div>
  );
}

function GorevlendirmeBekleyen() {
  const { t, dil } = useDil();
  const { v, sahaAdimi, talepler } = useNewsGathering();
  return (
    <Kart baslik={t("gorevlendirmeBekleyen")} ikon={<Inbox size={18} />}>
      <PaketTablosu paketler={sahaAdimi} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
      {talepler.length > 0 && (
        <ul className="liste ara-ust-2">
          {talepler.map((g) => (
            <li key={g.id}>
              <Avatar kisi={kisiBul(v, g.kisiId)} boy="kucuk" />
              <div className="ad">
                <b>
                  <Icerik blok>{satir(g.yer, kisiAr(kisiBul(v, g.kisiId)))}</Icerik>
                </b>
                <small>
                  {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                </small>
                <small>
                  <Icerik blok>{g.aciklama}</Icerik>
                </small>
              </div>
              <Rozet ton="uyari">{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

function SahaGerekecek() {
  const { t } = useDil();
  const { v, sahaGerekecek } = useNewsGathering();
  return (
    <Kart baslik={t("sahaGerekecek")} ikon={<CalendarRange size={18} />}>
      <PaketTablosu paketler={sahaGerekecek} d={v} sutunlar={["baslik", "muhabir", "plan", "asama"]} bosMetin={t("kayitYok")} />
    </Kart>
  );
}

function SahadakiMuhabirler() {
  const { t, ad } = useDil();
  const { sahada } = useNewsGathering();
  return (
    <Kart baslik={t("sahadakiMuhabirler")} ikon={<Users size={18} />} sagUc={<Tumu href="#/muhabirler" />}>
      <ul className="liste">
        {sahada.map((k) => (
          <li key={k.id}>
            <Avatar kisi={k} durum />
            <div className="ad">
              <a href={`#/muhabirler/${k.id}`}>{ad(k)}</a>
              <small>{t(sehirAdi(k.sehir))}</small>
            </div>
          </li>
        ))}
      </ul>
    </Kart>
  );
}

function GorevlendirmeTakvimi() {
  const { t, dil } = useDil();
  const { v, takvim } = useNewsGathering();
  return (
    <Kart baslik={t("gorevlendirmeTakvimi")} ikon={<CalendarDays size={18} />} sagUc={<Tumu href="#/seyahat" />}>
      <ul className="liste">
        {takvim.map((g) => (
          <li key={g.id}>
            <div className="ad">
              <b>
                <Icerik blok>{satir(g.yer, kisiAr(kisiBul(v, g.kisiId)))}</Icerik>
              </b>
              <small>
                {t(HAREKET_TURU_ADI[g.tur])} · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
              </small>
            </div>
          </li>
        ))}
      </ul>
    </Kart>
  );
}

/* --- Ekonomi --- */

/**
 * Ekonomi birimi: üretimde masası yok (ekonomi paketini Planlama'nın
 * feature/stok ekibi yürütüyor), içerikten sorumlu. Haftalık planda
 * ekonomi kolunun stok önerilerine toplantıdan önce bakıyor; ana sayfası
 * bu ön inceleme, haftanın ekonomi kalemleri ve ekonomi paketleri.
 */
export function EkonomiAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<TrendingUp size={26} />} baslik={t("biEkonomi")} alt={t("ekonomiAlt")} />
      <CalismaAlani ben={ben} duzen="ekonomi" kisisel={kisisel} />
      <NotKutu>{t("ekonomiNotu")}</NotKutu>
    </>
  );
}

function useEkonomi() {
  const v = useVeri();
  const B = bugun();
  const paketler = v.paketler.filter((p) => p.tur === "ekonomi" && p.durum !== "iptal");
  return {
    v,
    gelecek: v.haftalik.find((h) => h.baslangic === planlananHafta(B)),
    buHafta: v.haftalik.find((h) => h.baslangic === haftaBasi(B)),
    ekonomi: (h?: (typeof v.haftalik)[number]) => h?.kalemler.filter((k) => k.tur === "ekonomi") ?? [],
    paketler,
    aktif: paketler.filter((p) => p.durum !== "tamamlandi"),
  };
}

function EkonomiSayaclari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, gelecek, ekonomi, aktif } = useEkonomi();
  const bekleyen = gorusBekleyenler(v, ben).length;
  return (
    <div className="sayaclar">
      <Sayac ikon={<ClipboardCheck size={22} />} ton={bekleyen ? "uyari" : ""} etiket={t("onIncelemeBekleyen")} deger={bekleyen} />
      <Sayac href="#/feature" ikon={<CirclePlay size={22} />} renk="renk-haftalik" etiket={t("ekonomiPaketleri")} deger={aktif.length} alt={t("sDevamEden")} />
      <Sayac
        href={gelecek ? `#/haftalik/${gelecek.id}` : "#/haftalik"}
        ikon={<CalendarRange size={22} />}
        renk="renk-haftalik"
        etiket={t("haftalikEkonomiKalemleri")}
        deger={ekonomi(gelecek).filter(gundemde).length}
        alt={t("gelecekHafta")}
      />
    </div>
  );
}

function EkonomiGelecek() {
  const { t } = useDil();
  const { gelecek, ekonomi } = useEkonomi();
  return (
    <Kart baslik={t("haftalikEkonomiKalemleri")} ek={t("gelecekHafta")} ikon={<CalendarRange size={18} />} sagUc={<Tumu href={gelecek ? `#/haftalik/${gelecek.id}` : "#/haftalik"} />}>
      <KalemListesi kalemler={ekonomi(gelecek)} />
    </Kart>
  );
}

function EkonomiBuHafta() {
  const { t } = useDil();
  const { buHafta, ekonomi } = useEkonomi();
  return (
    <Kart baslik={t("haftalikEkonomiKalemleri")} ek={t("buHafta")} ikon={<CalendarRange size={18} />} sagUc={<Tumu href={buHafta ? `#/haftalik/${buHafta.id}` : "#/haftalik"} />}>
      <KalemListesi kalemler={ekonomi(buHafta).filter(gundemde)} />
    </Kart>
  );
}

function EkonomiPaketleri() {
  const { t } = useDil();
  const { v, paketler } = useEkonomi();
  return (
    <Kart baslik={t("ekonomiPaketleri")} ikon={<CirclePlay size={18} />} sagUc={<Tumu href="#/feature" />}>
      <PaketTablosu paketler={paketler} d={v} sutunlar={["baslik", "muhabir", "plan", "asama", "kimde"]} bosMetin={t("kayitYok")} />
    </Kart>
  );
}

/* --- Programlar --- */

export function ProgramAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<Clapperboard size={26} />} baslik={t("biProgram")} alt={t("programAlt")} sagUc={<TaslakEtiketi />} />
      <CalismaAlani ben={ben} duzen="program" kisisel={kisisel} />
      <NotKutu>{t("programTaslakNotu")}</NotKutu>
    </>
  );
}

function ProgramHafta() {
  const { t } = useDil();
  const v = useVeri();
  const hafta = v.haftalik.find((h) => h.baslangic === planlananHafta(bugun()));
  return (
    <Kart baslik={t("haftalikProgramPlani")} ikon={<CalendarRange size={18} />} sagUc={<Tumu href={hafta ? `#/haftalik/${hafta.id}` : "#/haftalik"} />}>
      <KalemListesi kalemler={hafta?.kalemler.filter((k) => k.tur === "program" && gundemde(k)) ?? []} />
    </Kart>
  );
}

function ProgramUretim() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("programUretimDurumu")} ikon={<CirclePlay size={18} />} sagUc={<Tumu href="#/programlar" />}>
      <PaketTablosu paketler={v.paketler.filter((p) => p.tur === "program")} d={v} sutunlar={["baslik", "muhabir", "asama", "kimde"]} bosMetin={t("kayitYok")} />
    </Kart>
  );
}

function ProgramOnerileri() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("programOnerileri")} ikon={<Lightbulb size={18} />}>
      <OneriTablosu oneriler={v.oneriler.filter((o) => o.tur === "program")} d={v} kisa />
    </Kart>
  );
}

function KonukOrganizasyonu() {
  const { t } = useDil();
  return (
    <Kart baslik={t("konukOrganizasyonu")} ikon={<Users size={18} />} sagUc={<TaslakEtiketi />}>
      <Bos metin={t("konukTaslak")} />
    </Kart>
  );
}

/* --- Output ve dil denetimi --- */

export function OutputAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<SpellCheck size={26} />} baslik={t("biOutput")} alt={t("outputAlt")} />
      <CalismaAlani ben={ben} duzen="output" kisisel={kisisel} />
    </>
  );
}

const kontrolde = (d: Durum) => uretimdeki(d).filter((p) => p.adim === "kontrol");
const dilde = (d: Durum) => uretimdeki(d).filter((p) => p.adim === "dil");

function OutputSayaclari() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <div className="sayaclar">
      <Sayac href="#/metinkontrol" ikon={<SpellCheck size={22} />} ton="uyari" etiket={t("adKontrol")} deger={kontrolde(v).length} />
      <Sayac href="#/metinkontrol" ikon={<ListChecks size={22} />} renk="renk-nextday" etiket={t("adDil")} deger={dilde(v).length} />
      <Sayac ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={[...kontrolde(v), ...dilde(v)].filter((p) => geciktiMi(p)).length} />
    </div>
  );
}

function KontrolKuyrugu() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("metinKontrolKuyrugu")} ikon={<SpellCheck size={18} />}>
      <PaketTablosu paketler={kontrolde(v)} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
    </Kart>
  );
}

function DilKuyrugu() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("dilKuyrugu")} ikon={<ListChecks size={18} />}>
      <PaketTablosu paketler={dilde(v)} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
    </Kart>
  );
}

function SonIslemler() {
  const { t } = useDil();
  const v = useVeri();
  const son = v.hareketler.filter((h) => h.tip === "kontrolEdildi" || h.tip === "sonScript" || h.tip === "geriGonderildi").slice(0, 8);
  return (
    <Kart baslik={t("sonIslemler")} ikon={<History size={18} />}>
      {son.length ? <HareketAkisi hareketler={son} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
    </Kart>
  );
}

/* --- Media Manager --- */

export function MediaAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<MonitorPlay size={26} />} baslik={t("biMedia")} alt={t("mediaAlt")} />
      <CalismaAlani ben={ben} duzen="media" kisisel={kisisel} />
    </>
  );
}

function YuklemeKuyrugu() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("yuklemeKuyrugu")} ikon={<Upload size={18} />}>
      <PaketTablosu paketler={uretimdeki(v).filter((p) => p.adim === "media")} d={v} sutunlar={["kod", "baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
    </Kart>
  );
}

function YakindaGelecek() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("yakindaGelecek")} ikon={<Clock size={18} />}>
      <PaketTablosu paketler={uretimdeki(v).filter((p) => p.adim === "iletim" || p.adim === "video")} d={v} sutunlar={["baslik", "asama", "kimde"]} bosMetin={t("kayitYok")} />
    </Kart>
  );
}

function SonYuklenenler() {
  const { t } = useDil();
  const v = useVeri();
  const yuklenen = v.hareketler.filter((h) => h.tip === "klipKodu").slice(0, 8);
  return (
    <Kart baslik={t("sonYuklenenler")} ikon={<History size={18} />}>
      {yuklenen.length ? <HareketAkisi hareketler={yuklenen} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
    </Kart>
  );
}

/*
 * Birimlerin çalışma alanları. Ekleyebilmek için alanın kaydını gösteren
 * sayfayı görebilmek gerekiyor; ön inceleme kişinin önüne düşen öneri,
 * herkesin kendi listesi.
 */
export const BIRIM_ALANLARI: Alan[] = [
  { id: "ndSayac", ad: "alOzetSayilar", genis: true, grup: "newsdesk", sayfa: "uretim", Bilesen: NewsdeskSayaclari },
  { id: "ndPlan", ad: "uygulanacakPlan", grup: "newsdesk", sayfa: "nextday", Bilesen: UygulanacakPlan },
  { id: "ndKontrol", ad: "kontrolBekleyen", grup: "newsdesk", sayfa: "metinkontrol", Bilesen: KontrolBekleyen },
  { id: "ndUretim", ad: "bugununUretimi", genis: true, grup: "newsdesk", sayfa: "uretim", Bilesen: BugununUretimi },
  { id: "ndGeciken", ad: "gecikenOncelikli", grup: "newsdesk", sayfa: "uretim", Bilesen: GecikenOncelikli },
  { id: "ndUcret", ad: "mUcretler", grup: "newsdesk", sayfa: "ucretler", Bilesen: UcretKarti },
  { id: "ngSayac", ad: "alOzetSayilar", genis: true, grup: "newsgathering", sayfa: "seyahat", Bilesen: NgSayaclari },
  { id: "ngBekleyen", ad: "gorevlendirmeBekleyen", grup: "newsgathering", sayfa: "seyahat", Bilesen: GorevlendirmeBekleyen },
  { id: "ngSahaGerekecek", ad: "sahaGerekecek", grup: "newsgathering", sayfa: "seyahat", Bilesen: SahaGerekecek },
  { id: "ngSahada", ad: "sahadakiMuhabirler", grup: "newsgathering", sayfa: "muhabirler", Bilesen: SahadakiMuhabirler },
  { id: "ngTakvim", ad: "gorevlendirmeTakvimi", grup: "newsgathering", sayfa: "seyahat", Bilesen: GorevlendirmeTakvimi },
  { id: "ekSayac", ad: "alOzetSayilar", genis: true, grup: "ekonomi", sayfa: "haftalik", Bilesen: EkonomiSayaclari },
  { id: "ekOnInceleme", ad: "onIncelemeBekleyen", genis: true, grup: "ekonomi", sayfa: "haftalik", Bilesen: OnIncelemeKarti },
  { id: "ekGelecek", ad: "haftalikEkonomiKalemleri", ek: "gelecekHafta", grup: "ekonomi", sayfa: "haftalik", Bilesen: EkonomiGelecek },
  { id: "ekBuHafta", ad: "haftalikEkonomiKalemleri", ek: "buHafta", grup: "ekonomi", sayfa: "haftalik", Bilesen: EkonomiBuHafta },
  { id: "ekPaketler", ad: "ekonomiPaketleri", genis: true, grup: "ekonomi", sayfa: "feature", Bilesen: EkonomiPaketleri },
  { id: "prHafta", ad: "haftalikProgramPlani", grup: "program", sayfa: "programlar", Bilesen: ProgramHafta },
  { id: "prUretim", ad: "programUretimDurumu", grup: "program", sayfa: "programlar", Bilesen: ProgramUretim },
  { id: "prOneri", ad: "programOnerileri", grup: "program", sayfa: "programlar", Bilesen: ProgramOnerileri },
  { id: "prKonuk", ad: "konukOrganizasyonu", grup: "program", sayfa: "programlar", Bilesen: KonukOrganizasyonu },
  { id: "ouSayac", ad: "alOzetSayilar", genis: true, grup: "output", sayfa: "metinkontrol", Bilesen: OutputSayaclari },
  { id: "ouKontrol", ad: "metinKontrolKuyrugu", grup: "output", sayfa: "metinkontrol", Bilesen: KontrolKuyrugu },
  { id: "ouDil", ad: "dilKuyrugu", grup: "output", sayfa: "metinkontrol", Bilesen: DilKuyrugu },
  { id: "ouSon", ad: "sonIslemler", genis: true, grup: "output", sayfa: "metinkontrol", Bilesen: SonIslemler },
  { id: "meKuyruk", ad: "yuklemeKuyrugu", grup: "media", sayfa: "video", Bilesen: YuklemeKuyrugu },
  { id: "meYaklasan", ad: "yakindaGelecek", grup: "media", sayfa: "video", Bilesen: YakindaGelecek },
  { id: "meSon", ad: "sonYuklenenler", genis: true, grup: "media", sayfa: "video", Bilesen: SonYuklenenler },
];
