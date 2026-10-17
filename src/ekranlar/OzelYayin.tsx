import { AlertTriangle, CheckCircle, Circle, ClipboardList, FileText, History, MessageSquare, Mic, Package, Pencil, Plane, Plus, Trash2, Tv, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnmaGirdisi } from "../bilesenler/Anma";
import { Avatar, Bos, Icerik, Ilerleme, Pencere, Rozet, TbcKutusu, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { aralikYaz, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, TUR_ADI } from "../etiketler";
import {
  konukKaydet,
  konukSil,
  nafizeAsamaDegisebilir,
  nafizeAsamasi,
  nafizeIptal,
  nafizeKaydet,
  ozelAsamaDegisebilir,
  ozelAsamaIsaretle,
  ozelAsamaNotu,
  ozelGorevlendirme,
  ozelHazirlikEkle,
  ozelHazirlikIsaretle,
  ozelKalemNotu,
  ozelKalemSil,
  ozelKunyeKaydet,
  ozelOlustur,
  ozelPaketAta,
  ozelPaketBasladi,
  ozelPaketGorevVer,
  ozelGorevVerebilir,
  ozelPaketOnayla,
  ozelPaketOnaylanabilir,
  ozelPaketOnerisiKaydet,
  ozelPaketOnerisiOnayla,
  ozelPaketOnerisiOnaylanabilir,
  ozelTalepDurumu,
  ozelTalepKaydet,
  paketTamamla,
  type OzelKunye,
} from "../eylemler";
import {
  asamaNotlari,
  gecikti,
  gorevHazir,
  isaretIzi,
  isaretli,
  nafizeBasligi,
  oncesi,
  ozelAsamasi,
  ozelGecti,
  ozelGorevlendirmeleri,
  ozelOnayli,
  ozelOzeti,
  ozelPaketAsamasi,
  ozelPaketSatirlari,
  siradaki,
  yapilacaklar,
  OZEL_ASAMA_ADI,
  OZEL_KALEM_TURLERI,
  OZEL_PAKET_ASAMALARI,
  type OzelKalemTuru,
  type OzelPaketAsamasi,
  type OzelPaketSatiri,
} from "../ozel";
import { bugun } from "../tarih";
import {
  HAREKET_TURLERI,
  ICERIK_TURLERI,
  KONUK_DURUMLARI,
  NAFIZE_SIRASI,
  OZEL_SIRASI,
  TALEP_SIRASI,
  kisiBul,
  useVeri,
  type Bicim,
  type BirimId,
  type Durum,
  type HareketTuru,
  type IcerikTuru,
  type Kisi,
  type KonukDurum,
  type Nafize,
  type NafizeDurum,
  type OzelDurum,
  type OzelIz,
  type OzelTalep,
  type OzelYayin,
  type Paket,
  type TalepDurum,
} from "../veri";
import { altindaMi, birimAdi, birimListesi, grupMu } from "../yapi";
import { ozelDuzenler, ozelPaketDagitabilir, ozelPaketTeslimEdebilir, paketTamamlayabilir, planAdimiYapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { BicimSecici, FormAlt, MuhabirSecici } from "./nextday/Formlar";
import { PAKET_ASAMA_ADI } from "../bilesenler/OzelGorevler";
import { AdimYetkilileri } from "./organizasyon/PlanYetkileri";

/**
 * Özel yayın: liste (#/ozel), plan (#/ozel/:id), çıktı (#/ozel/:id/cikti).
 *
 * Sayfa kalabalıktı: bölümler ve içlerindeki her kalem kapalı geliyor,
 * kapalıyken yalnız başlık, sayı ve aşama; ayrıntı basınca açılıyor.
 * Aşamalar kontrol listesi (ozel.ts): sırayla işaretleniyor, kim ve ne
 * zaman yanında, her aşamanın altına not düşülüyor. Planın aşamaları,
 * nafizeler ve paket önerileri ayrı ayrı onaylanıyor; planın onayı
 * bekleyenleri de onaylıyor. Paket önerisi özel yayının içinde kalıyor,
 * paket ve görev onayla doğuyor. Konuklar sırasız, aşamaya bağlı değil.
 * Newsdesk şimdilik bu akışta yok.
 */

const NAFIZE_DURUM_ADI: Record<NafizeDurum, Anahtar> = {
  planlandi: "oyNfPlanlandi",
  onayli: "oyNfOnayli",
  rezervasyon: "oyNfRezervasyon",
  hazir: "oyNfHazir",
  yapildi: "oyNfYapildi",
  iptal: "oyNfIptal",
};
const KONUK_DURUM_ADI: Record<KonukDurum, Anahtar> = {
  aday: "oyKnAday",
  davetEdildi: "oyKnDavet",
  teyitli: "oyKnTeyit",
  iptal: "oyKnIptal",
};
const TALEP_DURUM_ADI: Record<TalepDurum, Anahtar> = {
  acik: "oyTlAcik",
  suruyor: "oyTlSuruyor",
  tamam: "oyTlTamam",
  iptal: "oyTlIptal",
};
const PLAN_ADIM_ADI: Record<OzelDurum, Anahtar> = {
  hazirlik: "oyAsamaPlanlama",
  onayda: "oyAdimPlanlama",
  onayli: "oyAdimOnay",
  uygulandi: "oyAdimUygulama",
  hazir: "oyAdimHazir",
};
const KALEM_TURU_ADI: Record<OzelKalemTuru, Anahtar> = {
  nafize: "oyNafizeler",
  paket: "oyPaketler",
  talep: "oyTalepler",
  gorev: "oyGorevler",
  hazirlik: "oyHazirlik",
};
const KALEM_IKONU: Record<OzelKalemTuru, ReactNode> = {
  nafize: <Mic size={15} />,
  paket: <Package size={15} />,
  talep: <ClipboardList size={15} />,
  gorev: <Plane size={15} />,
  hazirlik: <CheckCircle size={15} />,
};
const DURUM_TONU: Record<string, string> = {
  yapildi: "iyi",
  tamam: "iyi",
  teyitli: "iyi",
  hazir: "iyi",
  rezervasyon: "vurgu",
  onayli: "vurgu",
  gorevli: "vurgu",
  hazirlaniyor: "vurgu",
  suruyor: "vurgu",
  davetEdildi: "vurgu",
  planlandi: "uyari",
  plan: "uyari",
  iptal: "kotu",
};

/* İzdeki durum adı: kalemin türüne göre hangi listeden. */
const durumAdi = (d?: string): Anahtar | undefined =>
  !d
    ? undefined
    : d in NAFIZE_DURUM_ADI
      ? NAFIZE_DURUM_ADI[d as NafizeDurum]
      : d in KONUK_DURUM_ADI
        ? KONUK_DURUM_ADI[d as KonukDurum]
        : d in TALEP_DURUM_ADI
          ? TALEP_DURUM_ADI[d as TalepDurum]
          : d in PLAN_ADIM_ADI
            ? PLAN_ADIM_ADI[d as OzelDurum]
            : d in PAKET_ASAMA_ADI
              ? PAKET_ASAMA_ADI[d as OzelPaketAsamasi]
              : undefined;

const yayinAraligi = (o: OzelYayin, dil: ReturnType<typeof useDil>["dil"]) => (o.bitis ? aralikYaz(o.tarih, o.bitis, dil) : tarihYaz(o.tarih, dil, "uzun"));

/* --- Liste --- */

export function OzelListe({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [yeni, setYeni] = useState(false);
  const sirali = [...v.ozel].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const gelecek = sirali.filter((o) => !ozelGecti(o));
  const gecmis = sirali.filter((o) => ozelGecti(o)).reverse();
  return (
    <>
      <SayfaBasi
        ikon={<Tv size={26} />}
        baslik={t("ozel")}
        sagUc={
          ozelDuzenler(ben) && (
            <button className="dugme" onClick={() => setYeni(true)} data-ozel-yeni>
              <Plus size={16} /> {t("oyYeni")}
            </button>
          )
        }
      />
      {gelecek.length === 0 && <Bos metin={t("oyYok")} ikon={<Tv size={28} />} />}
      <div className="iz iz-2">
        {gelecek.map((o) => (
          <OzelKarti key={o.id} o={o} d={v} />
        ))}
      </div>
      {gecmis.length > 0 && (
        <details className="ara-ust-2">
          <summary className="bos-kucuk">{t("oyGecmisYayinlar", { n: gecmis.length })}</summary>
          <div className="iz iz-2 ara-ust-2">
            {gecmis.map((o) => (
              <OzelKarti key={o.id} o={o} d={v} />
            ))}
          </div>
        </details>
      )}
      {yeni && <KunyePenceresi ben={ben} kapat={() => setYeni(false)} />}
    </>
  );
}

function OzelKarti({ o, d }: { o: OzelYayin; d: Durum }) {
  const { t, dil } = useDil();
  const oz = ozelOzeti(o, d);
  return (
    <a className="kart ozel-karti" href={`#/ozel/${o.id}`} data-ozel={o.id}>
      <div className="ozel-karti-ust">
        <b>
          <Icerik>{o.ad}</Icerik>
        </b>
        <OzelDurumRozeti o={o} />
      </div>
      <small className="sonuk-yazi">{yayinAraligi(o, dil)}</small>
      <Ilerleme oran={oz.biten / Math.max(1, oz.toplam)} />
      <small className="sonuk-yazi">
        {t("oyYapilan", { b: oz.biten, n: oz.toplam })}
        {oz.geciken > 0 && (
          <>
            {" · "}
            <span className="kotu-yazi">{t("oyGeciken", { n: oz.geciken })}</span>
          </>
        )}
      </small>
    </a>
  );
}

const ASAMA_TONU: Record<string, string> = {
  planlama: "",
  onay: "uyari",
  uygulama: "vurgu",
  hazir: "vurgu",
  tamam: "iyi",
};

function OzelDurumRozeti({ o }: { o: OzelYayin }) {
  const { t } = useDil();
  const a = ozelAsamasi(o);
  return (
    <span data-ozel-asama={a}>
      <Rozet ton={ASAMA_TONU[a]}>{t(OZEL_ASAMA_ADI[a])}</Rozet>
    </span>
  );
}

function KunyePenceresi({ ben, o, kapat }: { ben: Kisi; o?: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState<OzelKunye>({
    ad: o?.ad ?? "",
    tarih: o?.tarih ?? bugun(),
    bitis: o?.bitis ?? "",
    aciklama: o?.aciklama ?? "",
  });
  const kaydet = () => {
    if (o) {
      if (ozelKunyeKaydet(ben, o.id, f)) bildir(t("bKaydedildi"));
    } else {
      const id = ozelOlustur(ben, f);
      if (id) location.hash = `#/ozel/${id}`;
    }
    kapat();
  };
  return (
    <Pencere baslik={t(o ? "duzenle" : "oyYeni")} kapat={kapat}>
      <div className="form" data-ozel-kunye>
        <label>
          {t("oyAd")}
          <input {...icerikAlani} value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} placeholder="الانتخابات الرئاسية" data-ozel-ad />
        </label>
        <div className="satir">
          <label>
            {t("oyTarih")}
            <input type="date" value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-ozel-tarih />
          </label>
          <label>
            {t("oyBitis")}
            <input type="date" value={f.bitis ?? ""} min={f.tarih} onChange={(e) => setF({ ...f, bitis: e.target.value })} />
          </label>
        </div>
        <label>
          {t("oyAciklama")}
          <textarea {...icerikAlani} rows={5} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} data-ozel-aciklama />
        </label>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.ad.trim() || !f.tarih} />
      </div>
    </Pencere>
  );
}

/* --- Ortak parçalar: katlanır bölüm, kontrol listesi, not, iz --- */

/*
 * Katlanır bölüm: kapalı gelir, başlıkta sayı. Ekleme düğmesi başlıkta;
 * basınca bölüm açılıp kapanmasın diye olay durduruluyor.
 */
function Bolum({ ad, ikon, ek, ekle, children }: { ad: string; ikon: ReactNode; ek?: ReactNode; ekle?: { metin: string; ac: () => void; veri: string }; children: ReactNode }) {
  return (
    <details className="kart ozel-bolum" data-ozel-bolum={ad}>
      <summary>
        {ikon}
        <h2>{ad}</h2>
        {ek !== undefined && <span className="ek">{ek}</span>}
        {ekle && (
          <button
            type="button"
            className="dugme dugme-kucuk"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              ekle.ac();
            }}
            {...{ [ekle.veri]: "" }}
          >
            <Plus size={14} /> {ekle.metin}
          </button>
        )}
      </summary>
      <div className="ozel-bolum-govde">{children}</div>
    </details>
  );
}

function NotSatiri({ ekle, veri = "" }: { ekle: (metin: string) => boolean; veri?: string }) {
  const { t } = useDil();
  const [not, setNot] = useState("");
  return (
    <div className="ozel-not-satiri" data-not-satiri={veri}>
      <AnmaGirdisi deger={not} degistir={setNot} placeholder={t("oyNotYaz")} aria-label={t("oyNotEkle")} data-ozel-not />
      <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={!not.trim()} onClick={() => ekle(not) && setNot("")} data-ozel-not-ekle>
        {t("oyNotEkle")}
      </button>
    </div>
  );
}

function IzSatiri({ x }: { x: OzelIz }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const kisi = kisiBul(v, x.kisiId);
  const da = durumAdi(x.durum);
  return (
    <li>
      <Avatar kisi={kisi} boy="kucuk" />
      <div>
        <small>
          <b>
            <bdi>{ad(kisi)}</bdi>
          </b>{" "}
          · <bdi>{`${tarihYaz(x.zaman.slice(0, 10), dil, "kisa")} ${saatYaz(x.zaman, dil)}`}</bdi>
        </small>
        {x.olay !== "not" && (
          <span>
            {t(x.olay === "eklendi" ? "oyIzEklendi" : x.olay === "duzenlendi" ? "oyIzDuzenlendi" : "oyIzDurum")}
            {da && <> {t(da)}</>}
          </span>
        )}
        {x.not && (
          <span className="ozel-iz-not" dir="auto">
            {x.not}
          </span>
        )}
      </div>
    </li>
  );
}

function IzListesi({ iz }: { iz: OzelIz[] }) {
  return (
    <ol className="ozel-iz">
      {[...iz].reverse().map((x, i) => (
        <IzSatiri key={i} x={x} />
      ))}
    </ol>
  );
}

/* Kalemin bütün geçmişi: kontrol listesinin dışındaki olaylar (ekleme, düzenleme, konuk) da burada. */
function Gecmis({ iz }: { iz: OzelIz[] }) {
  const { t } = useDil();
  if (!iz.length) return null;
  return (
    <details className="ozel-gecmis">
      <summary>
        <History size={14} /> {t("oyGecmis")} <span className="sonuk-yazi">({iz.length})</span>
      </summary>
      <IzListesi iz={iz} />
    </details>
  );
}

interface KontrolSatiri {
  adim: string;
  ad: Anahtar;
  tamam: boolean;
  degistir?: () => unknown;
}

/*
 * Kontrol listesi: aşama işaretlenir, işaretleyen ve zaman yanında; her
 * aşamanın notları kendi satırında açılır. İşaretlenemeyen kutu pasif.
 */
function KontrolListesi({ satirlar, iz, notEkle }: { satirlar: KontrolSatiri[]; iz: OzelIz[]; notEkle?: (asama: string, metin: string) => boolean }) {
  return (
    <ul className="kontrol-listesi">
      {satirlar.map((s) => (
        <KontrolSatir key={s.adim} s={s} iz={iz} notEkle={notEkle} />
      ))}
    </ul>
  );
}

function KontrolSatir({ s, iz, notEkle }: { s: KontrolSatiri; iz: OzelIz[]; notEkle?: (asama: string, metin: string) => boolean }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  const isaret = s.tamam ? isaretIzi(iz, s.adim) : undefined;
  const notlar = asamaNotlari(iz, s.adim);
  return (
    <li className={s.tamam ? "tamam" : ""} data-kontrol={s.adim} data-tamam={s.tamam ? "1" : "0"}>
      <div className="kontrol-satiri">
        <label className="kontrol-kutu">
          <input type="checkbox" checked={s.tamam} disabled={!s.degistir} onChange={() => s.degistir?.()} data-kontrol-kutu />
          <span>{t(s.ad)}</span>
        </label>
        {isaret && (
          <small className="sonuk-yazi">
            <bdi>{ad(kisiBul(v, isaret.kisiId))}</bdi> · <bdi>{`${tarihYaz(isaret.zaman.slice(0, 10), dil, "kisa")} ${saatYaz(isaret.zaman, dil)}`}</bdi>
          </small>
        )}
        {(notlar.length > 0 || notEkle) && (
          <button
            type="button"
            className={`dugme dugme-sade dugme-kucuk kontrol-not${notlar.length ? " var" : ""}`}
            onClick={() => setAcik(!acik)}
            aria-expanded={acik}
            title={t("notlar")}
            aria-label={t("notlar")}
            data-kontrol-not
          >
            <MessageSquare size={14} /> {notlar.length || ""}
          </button>
        )}
      </div>
      {acik && (
        <div className="kontrol-notlari">
          {notlar.length > 0 && (
            <ol className="ozel-iz">
              {notlar.map((x, i) => (
                <IzSatiri key={i} x={x} />
              ))}
            </ol>
          )}
          {notEkle && <NotSatiri ekle={(m) => notEkle(s.adim, m)} veri={s.adim} />}
        </div>
      )}
    </li>
  );
}

/* Sıralı aşamalardan kontrol listesi: yalnız sıradaki işaretlenir, yalnız sonuncu kaldırılır. */
function siraSatirlari<T extends string>(
  sira: readonly T[],
  simdi: T,
  adlar: Record<T, Anahtar>,
  izinli: (adim: T, tamam: boolean) => boolean,
  degistir: (adim: T, tamam: boolean) => unknown,
): KontrolSatiri[] {
  return sira.slice(1).map((adim) => {
    const tamam = sira.includes(simdi) && isaretli(sira, simdi, adim);
    const olur = tamam ? oncesi(sira, simdi, adim) !== undefined : siradaki(sira, simdi) === adim;
    return {
      adim,
      ad: adlar[adim],
      tamam,
      degistir: olur && izinli(adim, !tamam) ? () => degistir(adim, !tamam) : undefined,
    };
  });
}

/* Kalem: kapalı gelir; başlıkta içerik, aşama rozeti ve gecikme. */
function Kalem({ veri, baslik, rozet, gec, soluk, children }: { veri: Record<string, string>; baslik: ReactNode; rozet?: ReactNode; gec?: boolean; soluk?: boolean; children: ReactNode }) {
  const { t } = useDil();
  return (
    <details className={`ozel-kalem${soluk ? " soluk" : ""}${gec ? " gecikti" : ""}`} {...veri}>
      <summary>
        <span className="ozel-kalem-ad">{baslik}</span>
        {gec && <AlertTriangle size={15} className="kotu-yazi" aria-label={t("oyGecikti")} />}
        {rozet}
      </summary>
      <div className="ozel-kalem-govde">{children}</div>
    </details>
  );
}

/* --- Plan sayfası --- */

export function OzelSayfa({ ben, id }: { ben: Kisi; id: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [kunye, setKunye] = useState(false);
  const o = v.ozel.find((x) => x.id === id);
  if (!o) return <Bos metin={t("oyYok")} />;
  const duzen = ozelDuzenler(ben);
  return (
    <div className="ozel-sayfa" data-ozel-sayfa={o.id}>
      <SayfaBasi ikon={<Tv size={26} />} baslik={t("ozel")} />
      <section className="kart ozel-kunye">
        <div className="ozel-karti-ust">
          <h2>
            <Icerik>{o.ad}</Icerik>
          </h2>
          <OzelDurumRozeti o={o} />
          <a className="dugme dugme-ikincil dugme-kucuk" href={`#/ozel/${o.id}/cikti`} data-ozel-cikti>
            <FileText size={15} /> {t("cikti")}
          </a>
          {duzen && (
            <button className="dugme dugme-sade dugme-ikon" onClick={() => setKunye(true)} title={t("duzenle")} aria-label={t("duzenle")} data-ozel-kunye-duzenle>
              <Pencil size={15} />
            </button>
          )}
        </div>
        <p className="sonuk-yazi">{yayinAraligi(o, dil)}</p>
        {o.aciklama && (
          <details className="ozel-gecmis">
            <summary>{t("oyAciklama")}</summary>
            <Icerik blok className="ozel-aciklama">
              {o.aciklama}
            </Icerik>
          </details>
        )}
      </section>
      <PlanAsamalari ben={ben} o={o} />
      <Yapilacaklar o={o} d={v} />
      <Nafizeler ben={ben} o={o} />
      <Paketler ben={ben} o={o} />
      <Talepler ben={ben} o={o} />
      <Gorevlendirmeler ben={ben} o={o} />
      <Hazirlik ben={ben} o={o} />
      {kunye && <KunyePenceresi ben={ben} o={o} kapat={() => setKunye(false)} />}
    </div>
  );
}

/* Planın aşamaları: her biri ayrı işaretleniyor; onay Plan yetkileri'ndeki kurala göre. */
function PlanAsamalari({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const v = useVeri();
  const durum = o.durum ?? "hazirlik";
  const satirlar = siraSatirlari(
    OZEL_SIRASI,
    durum,
    PLAN_ADIM_ADI,
    (adim, tamam) => ozelAsamaDegisebilir(ben, o, adim as Exclude<OzelDurum, "hazirlik">, tamam),
    (adim, tamam) => {
      if (ozelAsamaIsaretle(ben, o.id, adim as Exclude<OzelDurum, "hazirlik">, tamam)) bildir(t(adim === "onayli" && tamam ? "bPlanOnaylandi" : "bKaydedildi"));
    },
  );
  const bekleyen = yapilacaklar(o, v).length;
  const onaylayan = planAdimiYapabilir(ben, "ozOnay");
  return (
    <section className="kart" data-ozel-durum={durum}>
      <header className="kart-bas">
        <h2>
          <CheckCircle size={18} /> {t("oyAsamalar")}
        </h2>
        {ozelOnayli(o) && bekleyen > 0 && <span className="ek">{t("oyBekleyenIs", { n: bekleyen })}</span>}
      </header>
      <KontrolListesi satirlar={satirlar} iz={o.iz ?? []} notEkle={ozelDuzenler(ben) || onaylayan ? (asama, m) => ozelAsamaNotu(ben, o.id, asama, m) : undefined} />
      {!onaylayan && !ozelOnayli(o) && (
        <p className="bos-kucuk ara-ust">
          {t("oyOnaylayan")} <AdimYetkilileri adim="ozOnay" />
        </p>
      )}
    </section>
  );
}

function Yapilacaklar({ o, d }: { o: OzelYayin; d: Durum }) {
  const { t, dil, ad } = useDil();
  const oz = ozelOzeti(o, d);
  const bekleyen = yapilacaklar(o, d);
  return (
    <Bolum
      ad={t("oyYapilacaklar")}
      ikon={<ClipboardList size={18} />}
      ek={
        <>
          {t("oyYapilan", { b: oz.biten, n: oz.toplam })}
          {oz.geciken > 0 && <span className="kotu-yazi">{` · ${t("oyGeciken", { n: oz.geciken })}`}</span>}
        </>
      }
    >
      <ul className="ozel-ozet" data-ozel-ozet>
        {OZEL_KALEM_TURLERI.filter((x) => oz.tur[x].toplam).map((x) => (
          <li key={x} data-ozet-tur={x}>
            {KALEM_IKONU[x]} {t(KALEM_TURU_ADI[x])} <b>{`${oz.tur[x].biten}/${oz.tur[x].toplam}`}</b>
          </li>
        ))}
      </ul>
      {bekleyen.length === 0 ? (
        <Bos kucuk metin={t("oyYapilacakYok")} />
      ) : (
        <ul className="liste ara-ust" data-ozel-yapilacaklar>
          {bekleyen.map((k) => {
            const kisi = kisiBul(d, k.kisiId);
            return (
              <li key={`${k.tur}-${k.id}`} className={gecikti(k) ? "gecikti" : ""} data-yapilacak={k.id}>
                <span className="sonuk-yazi" title={t(KALEM_TURU_ADI[k.tur])}>
                  {KALEM_IKONU[k.tur]}
                </span>
                <div className="ad">
                  <Icerik blok>{k.ad}</Icerik>
                  <small>
                    {k.sonTarih ? tarihYaz(k.sonTarih, dil, "kisa") : ""}
                    {kisi ? `${k.sonTarih ? " · " : ""}${ad(kisi)}` : ""}
                  </small>
                </div>
                {gecikti(k) && <AlertTriangle size={15} className="kotu-yazi" aria-label={t("oyGecikti")} />}
              </li>
            );
          })}
        </ul>
      )}
    </Bolum>
  );
}

/* --- Nafizeler ve konuklar --- */

function Nafizeler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const [form, setForm] = useState<Nafize | "yeni" | null>(null);
  const liste = [...(o.nafizeler ?? [])].sort((a, b) => `${a.tarih} ${a.saat ?? ""}`.localeCompare(`${b.tarih} ${b.saat ?? ""}`));
  const hazir = liste.filter((n) => n.durum === "hazir" || n.durum === "yapildi").length;
  return (
    <>
      <Bolum
        ad={t("oyNafizeler")}
        ikon={<Mic size={18} />}
        ek={`${hazir}/${liste.filter((n) => n.durum !== "iptal").length}`}
        ekle={
          ozelDuzenler(ben)
            ? {
                metin: t("oyNafizeEkle"),
                ac: () => setForm("yeni"),
                veri: "data-nafize-ekle",
              }
            : undefined
        }
      >
        {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
        <div className="ozel-kalemler">
          {liste.map((n) => (
            <NafizeKalemi key={n.id} ben={ben} o={o} n={n} duzenle={() => setForm(n)} />
          ))}
        </div>
      </Bolum>
      {form && <NafizePenceresi ben={ben} o={o} n={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
  );
}

function NafizeKalemi({ ben, o, n, duzenle }: { ben: Kisi; o: OzelYayin; n: Nafize; duzenle: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const duzen = ozelDuzenler(ben);
  const [konuk, setKonuk] = useState({ ad: "", unvan: "" });
  const muhabir = kisiBul(v, n.muhabirId);
  const iptal = n.durum === "iptal";
  const satirlar = siraSatirlari(
    NAFIZE_SIRASI,
    n.durum,
    NAFIZE_DURUM_ADI,
    (adim, tamam) => nafizeAsamaDegisebilir(ben, n, adim, tamam),
    (adim, tamam) => nafizeAsamasi(ben, o.id, n.id, adim, tamam),
  );
  return (
    <Kalem veri={{ "data-nafize": n.id }} baslik={<Icerik>{nafizeBasligi(n)}</Icerik>} soluk={iptal} rozet={<Rozet ton={DURUM_TONU[n.durum]}>{t(NAFIZE_DURUM_ADI[n.durum])}</Rozet>}>
      <Icerik blok className="ozel-nafize-konu">
        {n.konu}
      </Icerik>
      <small className="sonuk-yazi">
        {t("muhabir")}: {muhabir ? ad(muhabir) : n.muhabirTbc ? "TBC" : t("atanmadi")}
      </small>
      {!iptal && (
        <KontrolListesi satirlar={satirlar} iz={n.iz} notEkle={duzen || planAdimiYapabilir(ben, "ozOnay") ? (asama, m) => ozelKalemNotu(ben, o.id, "nafizeler", n.id, m, asama) : undefined} />
      )}
      <div className="ozel-konuklar">
        <span className="alan-etiket">
          <Users size={14} /> {t("oyKonuklar")} ({n.konuklar.filter((k) => k.durum !== "iptal").length})
        </span>
        <ul className="konuk-listesi">
          {n.konuklar.map((k) => (
            <li key={k.id} className={k.durum === "iptal" ? "soluk" : ""} data-konuk={k.id}>
              <span className="konuk-adi">
                <Icerik blok>{k.ad}</Icerik>
                {k.unvan && (
                  <small>
                    <Icerik blok>{k.unvan}</Icerik>
                  </small>
                )}
              </span>
              {duzen ? (
                <select
                  className={`durum-secimi ton-${DURUM_TONU[k.durum] ?? "yok"}`}
                  value={k.durum}
                  onChange={(e) =>
                    konukKaydet(ben, o.id, n.id, {
                      ...k,
                      durum: e.target.value as KonukDurum,
                    })
                  }
                  aria-label={t("durum")}
                  data-durum-secimi
                >
                  {KONUK_DURUMLARI.map((x) => (
                    <option key={x} value={x}>
                      {t(KONUK_DURUM_ADI[x])}
                    </option>
                  ))}
                </select>
              ) : (
                <Rozet ton={DURUM_TONU[k.durum]}>{t(KONUK_DURUM_ADI[k.durum])}</Rozet>
              )}
              {duzen && (
                <button className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => konukSil(ben, o.id, n.id, k.id)} title={t("sil")} aria-label={t("sil")}>
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {duzen && (
          <div className="konuk-ekle">
            <input {...icerikAlani} className="girdi" value={konuk.ad} onChange={(e) => setKonuk({ ...konuk, ad: e.target.value })} placeholder={t("oyKonukAdi")} aria-label={t("oyKonukAdi")} data-konuk-ad />
            <input {...icerikAlani} className="girdi" value={konuk.unvan} onChange={(e) => setKonuk({ ...konuk, unvan: e.target.value })} placeholder={t("oyUnvan")} aria-label={t("oyUnvan")} />
            <button
              className="dugme dugme-ikincil dugme-kucuk"
              disabled={!konuk.ad.trim()}
              onClick={() =>
                konukKaydet(ben, o.id, n.id, {
                  ad: konuk.ad,
                  unvan: konuk.unvan,
                  durum: "aday",
                }) && setKonuk({ ad: "", unvan: "" })
              }
              data-konuk-ekle
            >
              <Plus size={14} /> {t("oyKonukEkle")}
            </button>
          </div>
        )}
      </div>
      {duzen && (
        <div className="dugmeler">
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={duzenle} data-nafize-duzenle>
            <Pencil size={14} /> {t("duzenle")}
          </button>
          <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => nafizeIptal(ben, o.id, n.id, !iptal)} data-nafize-iptal>
            {t(iptal ? "oyIptaliKaldir" : "oyIptalEt")}
          </button>
          <button className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelKalemSil(ben, o.id, "nafizeler", n.id)}>
            <Trash2 size={14} /> {t("sil")}
          </button>
        </div>
      )}
      <Gecmis iz={n.iz} />
    </Kalem>
  );
}

function NafizePenceresi({ ben, o, n, kapat }: { ben: Kisi; o: OzelYayin; n?: Nafize; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({
    konu: n?.konu ?? "",
    tarih: n?.tarih ?? o.tarih,
    saat: n?.saat ?? "",
    yer: n?.yer ?? "",
    muhabirId: n?.muhabirId ?? "",
    muhabirTbc: !!n?.muhabirTbc,
  });
  const kaydet = () => {
    if (
      nafizeKaydet(ben, o.id, {
        ...f,
        id: n?.id,
        muhabirTbc: f.muhabirTbc || undefined,
      })
    )
      bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(n ? "duzenle" : "oyNafizeEkle")} kapat={kapat}>
      <div className="form" data-nafize-formu>
        <div className="satir">
          <label>
            {t("oyTarih")}
            <input type="date" value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} />
          </label>
          <label>
            {t("oyYer")}
            <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="تل أبيب" data-nafize-yer />
          </label>
          <label>
            {t("oySaat")}
            <input type="time" value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} data-nafize-saat />
          </label>
        </div>
        <label>
          {t("oyKonu")}
          <textarea {...icerikAlani} rows={2} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} data-nafize-konu />
        </label>
        <div className="muhabir-sutunu">
          <label>
            {t("muhabir")}
            <MuhabirSecici
              deger={f.muhabirId}
              degistir={(x) =>
                setF({
                  ...f,
                  muhabirId: x,
                  muhabirTbc: x ? false : f.muhabirTbc,
                })
              }
              bosEtiket={t("atanmadi")}
            />
          </label>
          {!f.muhabirId && <TbcKutusu secili={f.muhabirTbc} degistir={(x) => setF({ ...f, muhabirTbc: x })} />}
        </div>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.konu.trim() || !f.tarih} />
      </div>
    </Pencere>
  );
}

/* --- Paketler: öneri → onay → görev → hazırlık → hazır --- */

function Paketler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<OzelPaketSatiri | "yeni" | null>(null);
  const satirlar = ozelPaketSatirlari(o, v);
  const gruplar: ["inhouse" | "dis", Anahtar][] = [
    ["inhouse", "oyInhouse"],
    ["dis", "oyDis"],
  ];
  return (
    <>
      <Bolum
        ad={t("oyPaketler")}
        ikon={<Package size={18} />}
        ek={`${satirlar.filter((s) => s.asama === "hazir").length}/${satirlar.length}`}
        ekle={
          ozelDuzenler(ben)
            ? {
                metin: t("oyPaketTalebi"),
                ac: () => setForm("yeni"),
                veri: "data-ozel-paket-ekle",
              }
            : undefined
        }
      >
        {satirlar.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
        {gruplar.map(([kaynak, ad]) => {
          const l = satirlar.filter((s) => s.kaynak === kaynak);
          return l.length ? (
            <div key={kaynak} className="ara-ust-2" data-ozel-paket-grubu={kaynak}>
              <div className="alan-etiket">{t(ad)}</div>
              <div className="ozel-kalemler">
                {l.map((s) => (
                  <PaketKalemi key={s.id} ben={ben} o={o} s={s} duzenle={() => setForm(s)} />
                ))}
              </div>
            </div>
          ) : null;
        })}
      </Bolum>
      {form && <PaketOneriPenceresi ben={ben} o={o} s={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
  );
}

/* Output müdürünün görevlendirebileceği kişiler: Output'ta (alt birimleriyle) etkin olanlar. */
const outputEkibi = (d: Durum) => d.kisiler.filter((k) => !k.pasif && !k.hesapsiz && altindaMi(k.birim, "output"));

function OutputAta({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t, ad } = useDil();
  const v = useVeri();
  if (!ozelPaketDagitabilir(ben, p)) return null;
  return (
    <select aria-label={t("oyAta")} value={p.hazirlayanId ?? ""} onChange={(e) => e.target.value && ozelPaketAta(ben, p.id, e.target.value) && bildir(t("bKaydedildi"))} data-ozel-ata>
      <option value="">{t("oyAta")}</option>
      {outputEkibi(v).map((k) => (
        <option key={k.id} value={k.id}>
          {ad(k)}
        </option>
      ))}
    </select>
  );
}

function PaketKalemi({ ben, o, s, duzenle }: { ben: Kisi; o: OzelYayin; s: OzelPaketSatiri; duzenle: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const p = s.paket;
  const sira = OZEL_PAKET_ASAMALARI;
  const yapan = kisiBul(v, s.muhabirId ?? p?.hazirlayanId);
  const gec = s.asama !== "hazir" && !!s.sonTarih && s.sonTarih < bugun();
  /* Her aşamanın işaretini kim koyuyor: onayı onaylayan, görevi Output müdürü (dışta onayla), hazırlığı işi yapan ya da Planlama. */
  const degistir = (adim: OzelPaketAsamasi): (() => unknown) | undefined => {
    if (adim === "onayli" && s.asama === "plan") {
      if (s.oneri && ozelPaketOnerisiOnaylanabilir(ben, s.oneri)) return () => ozelPaketOnerisiOnayla(ben, o.id, s.oneri!.id) && bildir(t("bKaydedildi"));
      if (!s.oneri && p && ozelPaketOnaylanabilir(ben, p)) return () => ozelPaketOnayla(ben, p.id);
    }
    // Dış muhabirde görevlendirme ayrı işaret (in-house'ta Output müdürünün seçimi); başlamadan geri alınıyor.
    if (adim === "gorevli" && p && ozelGorevVerebilir(ben, p, s.asama === "onayli")) return () => ozelPaketGorevVer(ben, p.id, s.asama === "onayli") && bildir(t("bKaydedildi"));
    if (adim === "hazirlaniyor" && s.asama === "gorevli" && p && ozelPaketTeslimEdebilir(ben, p)) return () => ozelPaketBasladi(ben, p.id);
    if (adim === "hazir" && (s.asama === "gorevli" || s.asama === "hazirlaniyor") && p && paketTamamlayabilir(ben, p, v)) return () => paketTamamla(ben, p.id);
    return undefined;
  };
  const satirlar: KontrolSatiri[] = sira.slice(1).map((adim) => ({
    adim,
    ad: PAKET_ASAMA_ADI[adim],
    tamam: sira.indexOf(s.asama) >= sira.indexOf(adim),
    degistir: degistir(adim),
  }));
  return (
    <Kalem veri={{ "data-ozel-paket": s.id }} baslik={<Icerik>{s.baslik}</Icerik>} gec={gec} rozet={<Rozet ton={DURUM_TONU[s.asama]}>{t(PAKET_ASAMA_ADI[s.asama])}</Rozet>}>
      <small className="sonuk-yazi" data-asama={s.asama}>
        {[p?.kod, s.sonTarih ? `${t("oySonTarih")}: ${tarihYaz(s.sonTarih, dil, "kisa")}` : "", yapan ? ad(yapan) : s.asama === "onayli" ? t("oyOutputMudurunde") : ""].filter(Boolean).join(" · ")}
      </small>
      {(s.oneri?.aciklama || p?.aciklama) && <Icerik blok>{s.oneri?.aciklama || p?.aciklama}</Icerik>}
      <KontrolListesi
        satirlar={satirlar}
        iz={s.iz}
        notEkle={s.oneri && (ozelDuzenler(ben) || planAdimiYapabilir(ben, "ozOnay")) ? (asama, m) => ozelKalemNotu(ben, o.id, "paketOnerileri", s.oneri!.id, m, asama) : undefined}
      />
      <div className="dugmeler">
        {p && <OutputAta ben={ben} p={p} />}
        {p && (
          <a className="dugme dugme-ikincil dugme-kucuk" href={`#/paketler/${p.id}`}>
            <Package size={14} /> {p.kod}
          </a>
        )}
        {s.oneri?.durum === "oneri" && ozelDuzenler(ben) && (
          <>
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={duzenle} data-paket-duzenle>
              <Pencil size={14} /> {t("duzenle")}
            </button>
            <button className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelKalemSil(ben, o.id, "paketOnerileri", s.oneri!.id)}>
              <Trash2 size={14} /> {t("sil")}
            </button>
          </>
        )}
      </div>
      <Gecmis iz={s.iz} />
    </Kalem>
  );
}

function PaketOneriPenceresi({ ben, o, s, kapat }: { ben: Kisi; o: OzelYayin; s?: OzelPaketSatiri; kapat: () => void }) {
  const { t } = useDil();
  const x = s?.oneri;
  const [f, setF] = useState({
    baslik: x?.baslik ?? "",
    aciklama: x?.aciklama ?? "",
    kaynak: x?.kaynak ?? ("inhouse" as "inhouse" | "dis"),
    muhabirId: x?.muhabirId ?? "",
    sonTarih: x?.sonTarih ?? o.tarih,
    tur: x?.tur ?? ("haber" as IcerikTuru),
    bicim: x?.bicim ?? ("pkg" as Bicim),
  });
  // Son tarih zorunlu: görev muhabire deadline'ıyla gidiyor.
  const hazir = !!f.baslik.trim() && !!f.sonTarih && (f.kaynak === "inhouse" || !!f.muhabirId);
  const kaydet = () => {
    if (!hazir) return;
    if (
      ozelPaketOnerisiKaydet(ben, o.id, {
        ...f,
        id: x?.id,
        muhabirId: f.kaynak === "dis" ? f.muhabirId : undefined,
      })
    )
      bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(x ? "duzenle" : "oyPaketTalebi")} kapat={kapat}>
      <div className="form" data-ozel-paket-formu>
        <div className="secim-grubu" role="radiogroup" aria-label={t("oyKaynak")}>
          {(["inhouse", "dis"] as const).map((k) => (
            <label key={k} className="secim">
              <input type="radio" name="ozel-kaynak" checked={f.kaynak === k} onChange={() => setF({ ...f, kaynak: k })} data-ozel-kaynak={k} />
              {t(k === "inhouse" ? "oyInhouse" : "oyDis")}
            </label>
          ))}
        </div>
        <label>
          {t("paketBasligi")}
          <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} data-ozel-paket-baslik />
        </label>
        <label>
          {t("kisaAciklama")}
          <textarea {...icerikAlani} rows={3} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
        </label>
        <div className="satir">
          {f.kaynak === "dis" && (
            <label>
              {t("muhabir")}
              <MuhabirSecici deger={f.muhabirId} degistir={(m) => setF({ ...f, muhabirId: m })} bosEtiket={t("seciniz")} ic={false} />
            </label>
          )}
          <label>
            {t("oySonTarih")}
            <input type="date" value={f.sonTarih} onChange={(e) => setF({ ...f, sonTarih: e.target.value })} data-ozel-son-tarih />
          </label>
          <label>
            {t("tur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
              {ICERIK_TURLERI.map((y) => (
                <option key={y} value={y}>
                  {t(TUR_ADI[y])}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("haberTuru")}
            <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
          </label>
        </div>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!hazir} />
      </div>
    </Pencere>
  );
}

/* --- Diğer talepler (grafik…) --- */

function Talepler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t, dil } = useDil();
  const duzen = ozelDuzenler(ben);
  const [form, setForm] = useState<OzelTalep | "yeni" | null>(null);
  const liste = o.talepler ?? [];
  return (
    <>
      <Bolum
        ad={t("oyTalepler")}
        ikon={<ClipboardList size={18} />}
        ek={`${liste.filter((x) => x.durum === "tamam").length}/${liste.filter((x) => x.durum !== "iptal").length}`}
        ekle={
          duzen
            ? {
                metin: t("oyTalepEkle"),
                ac: () => setForm("yeni"),
                veri: "data-talep-ekle",
              }
            : undefined
        }
      >
        {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
        <div className="ozel-kalemler">
          {liste.map((x) => {
            const iptal = x.durum === "iptal";
            const gec = x.durum !== "tamam" && !iptal && !!x.sonTarih && x.sonTarih < bugun();
            const satirlar = iptal
              ? []
              : siraSatirlari(
                  TALEP_SIRASI,
                  x.durum,
                  TALEP_DURUM_ADI,
                  () => duzen,
                  (adim, tamam) => ozelTalepDurumu(ben, o.id, x.id, tamam ? adim : oncesi(TALEP_SIRASI, x.durum, adim)!),
                );
            return (
              <Kalem
                key={x.id}
                veri={{ "data-talep": x.id }}
                baslik={<Icerik>{x.metin}</Icerik>}
                soluk={iptal}
                gec={gec}
                rozet={<Rozet ton={DURUM_TONU[x.durum]}>{t(TALEP_DURUM_ADI[x.durum])}</Rozet>}
              >
                <small className="sonuk-yazi">{[x.birim ? birimAdi(x.birim) : "", x.sonTarih ? `${t("oySonTarih")}: ${tarihYaz(x.sonTarih, dil, "kisa")}` : ""].filter(Boolean).join(" · ")}</small>
                {!iptal && <KontrolListesi satirlar={satirlar} iz={x.iz} notEkle={duzen ? (asama, m) => ozelKalemNotu(ben, o.id, "talepler", x.id, m, asama) : undefined} />}
                {duzen && (
                  <div className="dugmeler">
                    <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm(x)}>
                      <Pencil size={14} /> {t("duzenle")}
                    </button>
                    <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ozelTalepDurumu(ben, o.id, x.id, iptal ? "acik" : "iptal")}>
                      {t(iptal ? "oyIptaliKaldir" : "oyIptalEt")}
                    </button>
                    <button className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelKalemSil(ben, o.id, "talepler", x.id)}>
                      <Trash2 size={14} /> {t("sil")}
                    </button>
                  </div>
                )}
                <Gecmis iz={x.iz} />
              </Kalem>
            );
          })}
        </div>
      </Bolum>
      {form && <TalepPenceresi ben={ben} o={o} x={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
  );
}

function TalepPenceresi({ ben, o, x, kapat }: { ben: Kisi; o: OzelYayin; x?: OzelTalep; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({
    metin: x?.metin ?? "",
    birim: (x?.birim ?? "") as BirimId | "",
    sonTarih: x?.sonTarih ?? "",
  });
  const kaydet = () => {
    if (
      ozelTalepKaydet(ben, o.id, {
        id: x?.id,
        metin: f.metin,
        birim: f.birim || undefined,
        sonTarih: f.sonTarih || undefined,
      })
    )
      bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(x ? "duzenle" : "oyTalepEkle")} kapat={kapat}>
      <div className="form" data-talep-formu>
        <label>
          {t("oyTalepMetni")}
          <textarea rows={3} dir="auto" value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} data-talep-metni />
        </label>
        <div className="satir">
          <label>
            {t("birim")}
            <select value={f.birim} onChange={(e) => setF({ ...f, birim: e.target.value as BirimId })}>
              <option value="">—</option>
              {birimListesi(f.birim || undefined)
                .filter((b) => b !== "muhabir" && !grupMu(b))
                .map((b) => (
                  <option key={b} value={b}>
                    {birimAdi(b)}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {t("oySonTarih")}
            <input type="date" value={f.sonTarih} onChange={(e) => setF({ ...f, sonTarih: e.target.value })} />
          </label>
        </div>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.metin.trim()} />
      </div>
    </Pencere>
  );
}

/* --- Dış görevlendirmeler: genel kayıtta, News Gathering'in onayıyla --- */

function Gorevlendirmeler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [form, setForm] = useState(false);
  const liste = ozelGorevlendirmeleri(v, o.id);
  return (
    <>
      <Bolum
        ad={t("oyGorevler")}
        ikon={<Plane size={18} />}
        ek={`${liste.filter(gorevHazir).length}/${liste.length}`}
        ekle={
          ozelDuzenler(ben)
            ? {
                metin: t("oyGorevEkle"),
                ac: () => setForm(true),
                veri: "data-ozel-gorev-ekle",
              }
            : undefined
        }
      >
        {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
        <ul className="liste">
          {liste.map((g) => (
            <li key={g.id} data-ozel-gorev={g.id}>
              <Avatar kisi={kisiBul(v, g.kisiId)} boy="kucuk" />
              <div className="ad">
                <b>{ad(kisiBul(v, g.kisiId))}</b>
                <small>
                  {t(HAREKET_TURU_ADI[g.tur])} · <Icerik>{g.yer}</Icerik> · {aralikYaz(g.baslangic, g.bitis, dil)} · {t(GOREVLENDIRME_DURUM_ADI[g.durum])}
                </small>
              </div>
              <span data-gorev-asama={gorevHazir(g) ? "hazir" : "planlama"}>
                <Rozet ton={gorevHazir(g) ? "iyi" : "uyari"}>{t(gorevHazir(g) ? "oyPkHazir" : "oyAsamaPlanlama")}</Rozet>
              </span>
            </li>
          ))}
        </ul>
      </Bolum>
      {form && <GorevPenceresi ben={ben} o={o} kapat={() => setForm(false)} />}
    </>
  );
}

function GorevPenceresi({ ben, o, kapat }: { ben: Kisi; o: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({
    kisiId: "",
    tur: "gorevlendirme" as HareketTuru,
    yer: "",
    baslangic: o.tarih,
    bitis: o.bitis ?? o.tarih,
    aciklama: "",
  });
  const kaydet = () => {
    if (ozelGorevlendirme(ben, o.id, f)) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t("oyGorevEkle")} kapat={kapat}>
      <div className="form" data-ozel-gorev-formu>
        <div className="satir">
          <label>
            {t("muhabir")}
            <MuhabirSecici deger={f.kisiId} degistir={(x) => setF({ ...f, kisiId: x })} bosEtiket={t("seciniz")} />
          </label>
          <label>
            {t("tur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as HareketTuru })}>
              {HAREKET_TURLERI.filter((x) => x !== "izin").map((x) => (
                <option key={x} value={x}>
                  {t(HAREKET_TURU_ADI[x])}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t("oyYer")}
          <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} data-ozel-gorev-yer />
        </label>
        <div className="satir">
          <label>
            {t("baslangic")}
            <input type="date" value={f.baslangic} onChange={(e) => setF({ ...f, baslangic: e.target.value })} />
          </label>
          <label>
            {t("bitis")}
            <input type="date" value={f.bitis} min={f.baslangic} onChange={(e) => setF({ ...f, bitis: e.target.value })} />
          </label>
        </div>
        <label>
          {t("aciklama")}
          <input {...icerikAlani} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
        </label>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.kisiId || !f.yer.trim()} />
      </div>
    </Pencere>
  );
}

/* --- Hazırlık maddeleri --- */

function Hazirlik({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const [metin, setMetin] = useState("");
  const duzen = ozelDuzenler(ben);
  if (!o.hazirlik.length && !duzen) return null;
  return (
    <Bolum ad={t("oyHazirlik")} ikon={<CheckCircle size={18} />} ek={`${o.hazirlik.filter((h) => h.tamam).length}/${o.hazirlik.length}`}>
      <ul className="liste">
        {o.hazirlik.map((h) => (
          <li key={h.id} data-hazirlik={h.id}>
            {duzen ? (
              <label className="secim">
                <input type="checkbox" checked={h.tamam} onChange={(e) => ozelHazirlikIsaretle(ben, o.id, h.id, e.target.checked)} />
                <Icerik>{h.metin}</Icerik>
              </label>
            ) : (
              <>
                {h.tamam ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
                <Icerik>{h.metin}</Icerik>
              </>
            )}
          </li>
        ))}
      </ul>
      {duzen && (
        <div className="ozel-not-satiri ara-ust">
          <input {...icerikAlani} value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={t("oyMaddeEkle")} aria-label={t("oyMaddeEkle")} />
          <button className="dugme dugme-ikincil dugme-kucuk" disabled={!metin.trim()} onClick={() => ozelHazirlikEkle(ben, o.id, metin) && setMetin("")}>
            <Plus size={14} /> {t("oyMaddeEkle")}
          </button>
        </div>
      )}
    </Bolum>
  );
}

/* --- Output'un ana sayfası: in-house paket görevleri; müdür dağıtıyor, görevli işaretliyor --- */

function OutputPaketSatiri({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const asama = ozelPaketAsamasi(p);
  const yapan = kisiBul(v, p.hazirlayanId);
  const gec = p.durum !== "tamamlandi" && !!p.sonTarih && p.sonTarih < bugun();
  return (
    <li className={gec ? "gecikti" : ""} data-ozel-paket={p.id}>
      <div className="ad">
        <a href={`#/paketler/${p.id}`}>
          <Icerik blok>{p.baslik}</Icerik>
        </a>
        <small data-asama={asama}>
          {[p.ozelAd ? `${t("ozel")}: ${p.ozelAd}` : "", p.sonTarih ? `${t("oySonTarih")}: ${tarihYaz(p.sonTarih, dil, "kisa")}` : "", yapan ? ad(yapan) : t("oyOutputMudurunde")]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </div>
      <Rozet ton={gec ? "kotu" : DURUM_TONU[asama]}>{t(gec ? "oyGecikti" : PAKET_ASAMA_ADI[asama])}</Rozet>
      <OutputAta ben={ben} p={p} />
      {asama === "gorevli" && ozelPaketTeslimEdebilir(ben, p) && (
        <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => ozelPaketBasladi(ben, p.id) && bildir(t("bKaydedildi"))} data-ozel-basladi>
          {t("oyBasladi")}
        </button>
      )}
      {asama !== "onayli" && paketTamamlayabilir(ben, p, v) && (
        <button className="dugme dugme-iyi dugme-kucuk" onClick={() => paketTamamla(ben, p.id) && bildir(t("bKaydedildi"))} data-ozel-teslim>
          {t("oyTeslimEdildi")}
        </button>
      )}
    </li>
  );
}

export function OzelTalepAlani({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter((p) => p.ozelId && p.ozelKaynak === "inhouse" && p.durum === "onaylandi" && (ozelPaketDagitabilir(ben, p) || p.hazirlayanId === ben.id));
  if (
    !liste.length &&
    !ozelPaketDagitabilir(ben, {
      ozelId: "-",
      ozelKaynak: "inhouse",
      durum: "onaylandi",
    } as Paket)
  )
    return null;
  return (
    <section className="kart">
      <header className="kart-bas">
        <h2>
          <Tv size={18} /> {t("ozelPaketTalepleri")}
        </h2>
        <span className="ek">{liste.length}</span>
      </header>
      {liste.length === 0 && <Bos kucuk metin={t("oyTalepYok")} />}
      <ul className="liste" data-ozel-talep-alani>
        {liste.map((p) => (
          <OutputPaketSatiri key={p.id} ben={ben} p={p} />
        ))}
      </ul>
    </section>
  );
}
