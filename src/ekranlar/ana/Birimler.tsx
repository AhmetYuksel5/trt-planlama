import {
  AlertTriangle,
  Building,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  CirclePlay,
  Clapperboard,
  Clock,
  Gauge,
  History,
  Inbox,
  Lightbulb,
  ListChecks,
  MapPin,
  MonitorPlay,
  Plane,
  Route,
  SpellCheck,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { ASAMALAR, ASAMA_ADI, asamaBul, geciktiMi, paketSahibi } from "../../akis";
import { planDurum } from "../../eylemler";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Ilerleme, Kart, NotKutu, Rozet, Sayac, TaslakEtiketi, Tumu, bildir } from "../../bilesenler/Parcalar";
import { OneriTablosu, PaketTablosu } from "../../bilesenler/Tablolar";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { BIRIM_ADI, GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, PLAN_DURUM_ADI, PLAN_DURUM_TONU, sehirAdi } from "../../etiketler";
import { bugun, gunEkle, planlananHafta } from "../../tarih";
import { BIRIMLER, kisiBul, muhabirler, useVeri, type Durum, type Kisi } from "../../veri";
import { adimYapabilir, yapabilir } from "../../yetki";
import { BugununTakvimi, HaftaKarti, SayfaBasi, YaklasanToplantilar } from "./Planlama";

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

export function NewsdeskAna({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const bugunPlan = v.planlar.find((p) => p.tarih === B);
  const yarinPlan = v.planlar.find((p) => p.tarih === gunEkle(B, 1));
  const kontrol = uretimdeki(v).filter((p) => ["kontrol", "iletim", "inews"].includes(p.adim ?? "") && adimYapabilir(ben, p));
  const geciken = v.paketler.filter((p) => geciktiMi(p));
  const bugunku = v.paketler.filter((p) => p.planId === bugunPlan?.id && p.durum !== "iptal");
  const devral = () => yarinPlan && planDurum(ben, yarinPlan.id, "devralindi") && bildir(t("bPlanDevralindi"));

  return (
    <>
      <SayfaBasi ikon={<Building size={26} />} baslik={t("biNewsdesk")} alt={t("newsdeskAlt")} />
      <div className="sayaclar">
        <Sayac href="#/uretim" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sUretimde")} deger={uretimdeki(v).length} />
        <Sayac href="#/metinkontrol" ikon={<SpellCheck size={22} />} ton="uyari" etiket={t("sKontrolBekleyen")} deger={kontrol.length} />
        <Sayac href="#/uretim" ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={geciken.length} />
        <Sayac href="#/paketler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sBugunTamamlanan")} deger={bugunku.filter((p) => p.durum === "tamamlandi").length} />
      </div>
      <div className="iz iz-2">
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
          {yarinPlan && yarinPlan.durum !== "onayli" && yarinPlan.durum !== "devralindi" && (
            <p className="bos-kucuk">{t("devirIcinOnayBekleniyor")}</p>
          )}
        </Kart>
        <Kart baslik={t("kontrolBekleyen")} ikon={<SpellCheck size={18} />}>
          <PaketTablosu paketler={kontrol} d={v} sutunlar={["baslik", "muhabir", "asama", "teslim"]} bosMetin={t("siraBos")} />
        </Kart>
      </div>
      <Kart baslik={t("bugununUretimi")} ikon={<ListChecks size={18} />} sagUc={<Tumu href="#/uretim" />}>
        <PaketTablosu paketler={bugunku} d={v} />
      </Kart>
      <div className="iz iz-2">
        <Kart baslik={t("gecikenOncelikli")} ikon={<AlertTriangle size={18} />}>
          <PaketTablosu paketler={geciken} d={v} sutunlar={["baslik", "muhabir", "kimde", "teslim"]} bosMetin={t("gecikenYok")} />
        </Kart>
        <Kart baslik={t("mUcretler")} ikon={<Wallet size={18} />} sagUc={<TaslakEtiketi metin={t("ornekEkran")} />}>
          <p className="aciklama">{t("ucretKartAciklama")}</p>
          <a className="dugme dugme-ikincil" href="#/ucretler">
            {t("ucretleriAc")}
          </a>
        </Kart>
      </div>
    </>
  );
}

/* --- News Gathering --- */

export function NewsGatheringAna() {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const sahaAdimi = uretimdeki(v).filter((p) => p.adim === "gorevlendirme");
  const sahaGerekecek = v.paketler.filter((p) => p.sahaGerekli && ["taslak", "degerlendiriliyor", "onaylandi"].includes(p.durum));
  const talepler = v.gorevlendirmeler.filter((g) => g.durum === "talep");
  const sahada = muhabirler(v).filter((k) => k.durum === "sahada" || k.durum === "yolda");
  const takvim = v.gorevlendirmeler.filter((g) => g.bitis >= B && g.baslangic <= gunEkle(B, 14)).sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  return (
    <>
      <SayfaBasi ikon={<MapPin size={26} />} baslik={t("biNewsgathering")} alt={t("ngAlt")} sagUc={<TaslakEtiketi />} />
      <div className="sayaclar">
        <Sayac href="#/talepler" ikon={<Inbox size={22} />} ton="uyari" etiket={t("sYeniTalep")} deger={talepler.length + sahaAdimi.length} />
        <Sayac ikon={<MapPin size={22} />} renk="renk-nextday" etiket={t("sSahada")} deger={sahada.length} />
        <Sayac href="#/yurtdisi" ikon={<Plane size={22} />} renk="renk-yurtdisi" etiket={t("sYurtdisiGorev")} deger={v.gorevlendirmeler.filter((g) => g.yurtdisi && g.bitis >= B).length} />
        <Sayac ikon={<Route size={22} />} renk="renk-haftalik" etiket={t("sSeyahat")} deger={v.gorevlendirmeler.filter((g) => g.tur === "seyahat" && g.bitis >= B).length} />
      </div>
      <div className="iz iz-2">
        <Kart baslik={t("gorevlendirmeBekleyen")} ikon={<Inbox size={18} />}>
          <PaketTablosu paketler={sahaAdimi} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
          {talepler.length > 0 && (
            <ul className="liste ara-ust-2">
              {talepler.map((g) => (
                <li key={g.id}>
                  <Avatar kisi={kisiBul(v, g.kisiId)} boy="kucuk" />
                  <div className="ad">
                    <b>
                      {y(kisiBul(v, g.kisiId)?.ad ?? "")} · {y(g.yer)}
                    </b>
                    <small>
                      {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")} · {y(g.aciklama)}
                    </small>
                  </div>
                  <Rozet ton="uyari">{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
                </li>
              ))}
            </ul>
          )}
        </Kart>
        <Kart baslik={t("sahaGerekecek")} ikon={<CalendarRange size={18} />}>
          <PaketTablosu paketler={sahaGerekecek} d={v} sutunlar={["baslik", "muhabir", "plan", "asama"]} bosMetin={t("kayitYok")} />
        </Kart>
      </div>
      <div className="iz iz-2">
        <Kart baslik={t("sahadakiMuhabirler")} ikon={<Users size={18} />} sagUc={<Tumu href="#/muhabirler" />}>
          <ul className="liste">
            {sahada.map((k) => (
              <li key={k.id}>
                <Avatar kisi={k} durum />
                <div className="ad">
                  <a href={`#/muhabirler/${k.id}`}>{y(k.ad)}</a>
                  <small>{t(sehirAdi(k.sehir))}</small>
                </div>
              </li>
            ))}
          </ul>
        </Kart>
        <Kart baslik={t("gorevlendirmeTakvimi")} ikon={<CalendarDays size={18} />} sagUc={<Tumu href="#/seyahat" />}>
          <ul className="liste">
            {takvim.map((g) => (
              <li key={g.id}>
                <div className="ad">
                  <b>
                    {y(kisiBul(v, g.kisiId)?.ad ?? "")} · {y(g.yer)}
                  </b>
                  <small>
                    {t(HAREKET_TURU_ADI[g.tur])} · {tarihYaz(g.baslangic, dil, "kisa")} – {tarihYaz(g.bitis, dil, "kisa")}
                  </small>
                </div>
                {g.yurtdisi && <Rozet ton="tur-program">{t("yurtdisiKisa")}</Rozet>}
              </li>
            ))}
          </ul>
        </Kart>
      </div>
      <NotKutu>{t("ngTaslakNotu")}</NotKutu>
    </>
  );
}

/* --- Programlar --- */

export function ProgramAna() {
  const { t, y, dil } = useDil();
  const v = useVeri();
  const hafta = v.haftalik.find((h) => h.baslangic === planlananHafta(bugun()));
  const programKalemleri = hafta?.kalemler.filter((k) => k.tur === "program") ?? [];
  const programOnerileri = v.oneriler.filter((o) => o.tur === "program");
  const programPaketleri = v.paketler.filter((p) => p.tur === "program");
  return (
    <>
      <SayfaBasi ikon={<Clapperboard size={26} />} baslik={t("biProgram")} alt={t("programAlt")} sagUc={<TaslakEtiketi />} />
      <div className="iz iz-2">
        <Kart baslik={t("haftalikProgramPlani")} ikon={<CalendarRange size={18} />} sagUc={<Tumu href="#/haftalik" />}>
          {programKalemleri.length === 0 ? (
            <Bos kucuk metin={t("kayitYok")} />
          ) : (
            <ul className="liste">
              {programKalemleri.map((k) => (
                <li key={k.id}>
                  <div className="ad">
                    <b>{y(k.baslik)}</b>
                    <small>{k.tarih && tarihYaz(k.tarih, dil, "uzun")}</small>
                  </div>
                  <Rozet ton={k.onayli ? "iyi" : ""}>{t(k.onayli ? "onaylandi" : "beklemede")}</Rozet>
                </li>
              ))}
            </ul>
          )}
        </Kart>
        <Kart baslik={t("programUretimDurumu")} ikon={<CirclePlay size={18} />} sagUc={<Tumu href="#/programlar" />}>
          <PaketTablosu paketler={programPaketleri} d={v} sutunlar={["baslik", "muhabir", "asama", "kimde"]} bosMetin={t("kayitYok")} />
        </Kart>
      </div>
      <div className="iz iz-2">
        <Kart baslik={t("programOnerileri")} ikon={<Lightbulb size={18} />}>
          <OneriTablosu oneriler={programOnerileri} d={v} kisa />
        </Kart>
        <Kart baslik={t("konukOrganizasyonu")} ikon={<Users size={18} />} sagUc={<TaslakEtiketi />}>
          <Bos metin={t("konukTaslak")} />
        </Kart>
      </div>
      <NotKutu>{t("programTaslakNotu")}</NotKutu>
    </>
  );
}

/* --- Output ve dil denetimi --- */

export function OutputAna() {
  const { t } = useDil();
  const v = useVeri();
  const kontrol = uretimdeki(v).filter((p) => p.adim === "kontrol");
  const dil_ = uretimdeki(v).filter((p) => p.adim === "dil");
  const son = v.hareketler.filter((h) => h.tip === "kontrolEdildi" || h.tip === "sonScript" || h.tip === "geriGonderildi").slice(0, 8);
  return (
    <>
      <SayfaBasi ikon={<SpellCheck size={26} />} baslik={t("biOutput")} alt={t("outputAlt")} />
      <div className="sayaclar">
        <Sayac href="#/metinkontrol" ikon={<SpellCheck size={22} />} ton="uyari" etiket={t("adKontrol")} deger={kontrol.length} />
        <Sayac href="#/metinkontrol" ikon={<ListChecks size={22} />} renk="renk-nextday" etiket={t("adDil")} deger={dil_.length} />
        <Sayac ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={[...kontrol, ...dil_].filter((p) => geciktiMi(p)).length} />
      </div>
      <div className="iz iz-2">
        <Kart baslik={t("metinKontrolKuyrugu")} ikon={<SpellCheck size={18} />}>
          <PaketTablosu paketler={kontrol} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
        </Kart>
        <Kart baslik={t("dilKuyrugu")} ikon={<ListChecks size={18} />}>
          <PaketTablosu paketler={dil_} d={v} sutunlar={["baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
        </Kart>
      </div>
      <Kart baslik={t("sonIslemler")} ikon={<History size={18} />}>
        {son.length ? <HareketAkisi hareketler={son} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
      </Kart>
    </>
  );
}

/* --- Media Manager --- */

export function MediaAna() {
  const { t } = useDil();
  const v = useVeri();
  const kuyruk = uretimdeki(v).filter((p) => p.adim === "media");
  const yaklasan = uretimdeki(v).filter((p) => p.adim === "iletim" || p.adim === "video");
  const yuklenen = v.hareketler.filter((h) => h.tip === "klipKodu").slice(0, 8);
  return (
    <>
      <SayfaBasi ikon={<MonitorPlay size={26} />} baslik={t("biMedia")} alt={t("mediaAlt")} />
      <div className="iz iz-2">
        <Kart baslik={t("yuklemeKuyrugu")} ikon={<Upload size={18} />}>
          <PaketTablosu paketler={kuyruk} d={v} sutunlar={["kod", "baslik", "muhabir", "teslim"]} bosMetin={t("siraBos")} />
        </Kart>
        <Kart baslik={t("yakindaGelecek")} ikon={<Clock size={18} />}>
          <PaketTablosu paketler={yaklasan} d={v} sutunlar={["baslik", "asama", "kimde"]} bosMetin={t("kayitYok")} />
        </Kart>
      </div>
      <Kart baslik={t("sonYuklenenler")} ikon={<History size={18} />}>
        {yuklenen.length ? <HareketAkisi hareketler={yuklenen} d={v} /> : <Bos kucuk metin={t("kayitYok")} />}
      </Kart>
    </>
  );
}

/* --- Yönetim: ortak pano (rapor Şekil 1) --- */

const PLANLAMA_TAKVIMI: [Anahtar, Anahtar][] = [
  ["nextday", "ptNextday"],
  ["haftalik", "ptHaftalik"],
  ["aylik", "ptAylik"],
  ["ozel", "ptOzel"],
];

export function YonetimAna() {
  const { t } = useDil();
  const v = useVeri();
  const aktif = v.paketler.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal");
  const asamaSayisi = ASAMALAR.map((_, i) => aktif.filter((p) => asamaBul(p) === i).length);
  const enCok = Math.max(1, ...asamaSayisi);
  const yuk = BIRIMLER.map((b) => ({ b, n: aktif.filter((p) => paketSahibi(p) === b).length })).filter((x) => x.n > 0);
  const onayBekleyen = v.planlar.filter((p) => p.durum === "toplantida");
  return (
    <>
      <SayfaBasi ikon={<Gauge size={26} />} baslik={t("ortakPano")} alt={t("yonetimAlt")} />
      <div className="sayaclar">
        <Sayac href="#/paketler" ikon={<ListChecks size={22} />} renk="renk-nextday" etiket={t("sAktifPaket")} deger={aktif.length} />
        <Sayac href="#/paketler" ikon={<CheckCircle size={22} />} ton="iyi" etiket={t("sTamamlanan")} deger={v.paketler.filter((p) => p.durum === "tamamlandi").length} />
        <Sayac href="#/uretim" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sDevamEden")} deger={uretimdeki(v).length} />
        <Sayac href="#/nextday" ikon={<Clock size={22} />} ton="uyari" etiket={t("sOnayBekleyen")} deger={onayBekleyen.length + v.paketler.filter((p) => p.durum === "degerlendiriliyor").length} />
        <Sayac href="#/yurtdisi" ikon={<Plane size={22} />} renk="renk-yurtdisi" etiket={t("sYurtdisiGorev")} deger={v.gorevlendirmeler.filter((g) => g.yurtdisi && g.bitis >= bugun()).length} />
        <Sayac href="#/uretim" ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={v.paketler.filter((p) => geciktiMi(p)).length} />
      </div>
      <div className="iz iz-pano">
        <HaftaKarti d={v} />
        <BugununTakvimi d={v} />
        <YaklasanToplantilar d={v} />
      </div>
      <div className="iz iz-3">
        <Kart baslik={t("asamalaraGore")} ikon={<ListChecks size={18} />}>
          <ul className="liste">
            {ASAMALAR.map((a, i) => (
              <li key={a}>
                <div className="ad">
                  <b>
                    {i + 1}. {t(ASAMA_ADI[a])}
                  </b>
                </div>
                <div className="ilerleme-kutu">
                  <Ilerleme oran={asamaSayisi[i] / enCok} />
                </div>
                <b>{asamaSayisi[i]}</b>
              </li>
            ))}
          </ul>
        </Kart>
        <Kart baslik={t("birimIsYuku")} ikon={<Users size={18} />}>
          <ul className="liste">
            {yuk.map(({ b, n }) => (
              <li key={b}>
                <div className="ad">
                  <b>{t(BIRIM_ADI[b])}</b>
                </div>
                <Rozet>{n}</Rozet>
              </li>
            ))}
          </ul>
        </Kart>
        <Kart baslik={t("planlamaTakvimi")} ikon={<CalendarDays size={18} />}>
          <ul className="liste">
            {PLANLAMA_TAKVIMI.map(([a, b]) => (
              <li key={a}>
                <div className="ad">
                  <b>{t(a)}</b>
                </div>
                <span className="not">{t(b)}</span>
              </li>
            ))}
          </ul>
        </Kart>
      </div>
      <div className="iz iz-2">
        <Kart baslik={t("gecikenOncelikli")} ikon={<AlertTriangle size={18} />}>
          <PaketTablosu paketler={v.paketler.filter((p) => geciktiMi(p))} d={v} sutunlar={["baslik", "muhabir", "kimde", "teslim"]} bosMetin={t("gecikenYok")} />
        </Kart>
        <Kart baslik={t("sonHareketler")} ikon={<History size={18} />}>
          <HareketAkisi hareketler={v.hareketler.slice(0, 8)} d={v} />
        </Kart>
      </div>
    </>
  );
}

