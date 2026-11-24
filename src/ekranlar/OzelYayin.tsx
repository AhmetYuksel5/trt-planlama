import { SaatGirdisi, TarihGirdisi } from "../bilesenler/TarihSaat";
import { AlertTriangle, CheckCircle, Mail, Circle, ClipboardList, FileText, History, MessageSquare, Mic, Package, Pencil, Plane, Plus, RotateCcw, Trash2, Tv, Users, CalendarDays } from "lucide-react";
import { useAdimDurumu } from "../yol";
import { GeriBag } from "../bilesenler/GeriBag";
import { ozelOnerileri } from "../aylik";
import { useState, type ReactNode } from "react";
import { AnmaGirdisi } from "../bilesenler/Anma";
import { Avatar, Bos, Icerik, Ilerleme, Kart, PaketDurumRozeti, Pencere, Rozet, TbcKutusu, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { aralikYaz, gunAdi, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { ozelGorevEpostasi } from "../takdir";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, TUR_ADI } from "../etiketler";
import {
  aylikOlaydanOzel,
  konukKaydet,
  konukSil,
  nafizeIsaret,
  nafizeKaydet,
  nafizeSil,
  ozelOnayDegisebilir,
  ozelOnayla,
  ozelAsamaNotu,
  ozelGorevlendirme,
  ozelHazirlikIsaretle,
  ozelMaddeKaydet,
  ozelMaddeSil,
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
  paketTamamla,
  ozelIcerikGorevlendir,
  ozelIcerikGeriAl,
  ozelIcerikGeriAlinabilir,
  ozelIcerikYayinGunu,
  ozelIcerikYayinGunuDegisebilir,
  ozelPaketOnayGeriAl,
  ozelPaketOnayiGeriAlinabilir,
  ozelIcerikGunuUygun,
  ozelGorevPostasiGitti,
  type OzelKunye,
} from "../eylemler";
import {
  asamaNotlari,
  gorevHazir,
  isaretIzi,
  nafizeBasligi,
  nafizeHazir,
  ozelNafizeleri,
  ozelAsamasi,
  ozelAsamaDurumlari,
  ozelGunu,
  yayinGunleri,
  type OzelEksik,
  ozelGecti,
  ozelGorevlendirmeleri,
  ozelOnayli,
  ozelOzeti,
  ozelPaketAsamasi,
  ozelPaketSatirlari,
  ozelIcerikleri,
  OZEL_ASAMA_ADI,
  OZEL_ASAMALARI,
  OZEL_PAKET_ASAMALARI,
  type OzelKalemTuru,
  type OzelPaketAsamasi,
  type OzelPaketSatiri,
} from "../ozel";
import { bugun, gunEkle } from "../tarih";
import {
  HAREKET_TURLERI,
  KONUK_DURUMLARI,
  SECILEN_TURLER,
  eskiOzelPaket,
  ozelIcerikMi,
  kisiBul,
  useVeri,
  type Bicim,
  type BirimId,
  type Durum,
  type HareketTuru,
  type IcerikTuru,
  type Kisi,
  type KonukDurum,
  type CanliYayin,
  type NafizeDurum,
  type OzelDurum,
  type OzelIz,
  type OzelMadde,
  type OzelYayin,
  type Paket,
  type TalepDurum,
} from "../veri";
import { altindaMi, birimAdi, birimListesi, grupMu } from "../yapi";
import { geriBildirimSablonuDuzenler, ileriGorevVerebilir, uretimYoluBelirleyebilir, ozelDuzenler, ozelPaketDagitabilir, ozelPaketTeslimEdebilir, paketTamamlayabilir, planAdimiYapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { IslemMenusu } from "../bilesenler/IslemMenusu";
import { PlanBasiKalibi, adimlariKur } from "../bilesenler/PlanBasi";
import { BicimSecici, FormAlt, MuhabirSecici } from "./nextday/Formlar";
import { PAKET_ASAMA_ADI } from "../bilesenler/OzelGorevler";
import { AdimYetkilileri } from "./organizasyon/PlanYetkileri";
import { TakdirFormu } from "./GeriBildirimSablonlari";
import type { PostaSablonu } from "./posta/Posta";
import { StokKarti } from "./StokSayfasi";
import { UretimeAlDugmesi } from "../bilesenler/UretimBalonu";
import { TamamlamaGeriAlDugmesi } from "../bilesenler/TamamlamaGeriAl";

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
const KALEM_IKONU: Record<OzelKalemTuru | "plan", ReactNode> = {
  nafize: <Mic size={15} />,
  paket: <Package size={15} />,
  gorev: <Plane size={15} />,
  madde: <ClipboardList size={15} />,
  plan: <FileText size={15} />,
};
/* Eksiğe basınca açılan sekme: işi yapılacak yer. */
const EKSIK_SEKMESI: Record<OzelKalemTuru | "plan", OzelSekme> = { nafize: "nafize", paket: "icerik", gorev: "gorev", madde: "hazirlik", plan: "icerik" };
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

/*
 * Aylık planda özel yayın işaretli olaylar burada öneri olarak bekler;
 * "Özel yayın olarak aç" yayını açar, yayın kendi onayına (ozOnay) tabi.
 */
function AylikOzelOnerileri({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const l = ozelOnerileri(useVeri());
  if (!l.length) return null;
  return (
    <Kart baslik={t("ayOzelOnerileri")} className="ara-alt-2">
      <ul className="liste" data-aylik-ozel>
        {l.map(({ olay }) => (
          <li key={olay.id}>
            <div className="ad">
              <b>
                <Icerik blok>{olay.baslik}</Icerik>
              </b>
              <small>{olay.bitis && olay.bitis > olay.tarih ? aralikYaz(olay.tarih, olay.bitis, dil) : tarihYaz(olay.tarih, dil)}</small>
            </div>
            {ozelDuzenler(ben) && (
              <button
                className="dugme dugme-ikincil dugme-kucuk"
                data-aylik-ozel-ac={olay.id}
                onClick={() => {
                  if (!confirm(t("ayOzelAcOnay", { ad: olay.baslik }))) return;
                  const id = aylikOlaydanOzel(ben, olay.id);
                  if (id) location.hash = `#/ozel/${id}`;
                }}
              >
                {t("ayOzelAc")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Kart>
  );
}

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
      <AylikOzelOnerileri ben={ben} />
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
  const a = ozelAsamasi(o, useVeri());
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
            <TarihGirdisi value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-ozel-tarih />
          </label>
          <label>
            {t("oyBitis")}
            <TarihGirdisi value={f.bitis ?? ""} min={f.tarih} onChange={(e) => setF({ ...f, bitis: e.target.value })} />
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
function Bolum({ ad, ikon, ek, ekle, acik, children }: { ad: string; ikon: ReactNode; ek?: ReactNode; ekle?: { metin: string; ac: () => void; veri: string }; acik?: boolean; children: ReactNode }) {
  return (
    <details className="kart ozel-bolum" data-ozel-bolum={ad} open={acik}>
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

type OzelSekme = "genel" | "program" | "nafize" | "icerik" | "gorev" | "hazirlik";

const OZEL_SEKMELERI: [OzelSekme, Anahtar][] = [
  ["genel", "oySekGenel"],
  ["program", "oySekProgram"],
  ["nafize", "oyNafizeler"],
  ["icerik", "oySekIcerik"],
  ["gorev", "oySekGorev"],
  ["hazirlik", "oySekHazirlik"],
];

/*
 * Özel yayının üst kısmı plan ekranlarının ortak kalıbıyla (bilesenler/PlanBasi):
 * yayının adı, ⋯ (çıktı, künyeyi düzenle), "Sıradaki" kartı: kayıttan okunan
 * aşamalar ve elle verilen tek adım, planın onayı. Eksikler Genel bakış'ta.
 */
function OzelBasi({ ben, o, duzen, kunyeAc }: { ben: Kisi; o: OzelYayin; duzen: boolean; kunyeAc: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const durumlar = ozelAsamaDurumlari(o, v);
  const asama = ozelAsamasi(o, v);
  const eksik = durumlar.find((a) => a.asama === asama)?.eksikler.length ?? 0;
  const onaylayan = planAdimiYapabilir(ben, "ozOnay");
  const asamalar = [...OZEL_ASAMALARI, "tamam"] as const;
  return (
    <PlanBasiKalibi
      geri={<GeriBag ikon href="#/ozel" metin={t("ozel")} />}
      baslik={<Icerik>{o.ad}</Icerik>}
      baslikTekrar={false}
      uc={
        <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-ikon" menuSinifi="plan-menusu" katman>
          <a role="menuitem" className="acilir-satir" href={`#/ozel/${o.id}/cikti`} data-ozel-cikti>
            <FileText size={16} /> {t("cikti")}
          </a>
          {duzen && (
            <button type="button" role="menuitem" className="acilir-satir" onClick={kunyeAc} data-ozel-kunye-duzenle>
              <Pencil size={16} /> {t("duzenle")}
            </button>
          )}
        </IslemMenusu>
      }
      adimlar={adimlariKur(asamalar, asama, (a) => ({ ad: t(a === "onay" ? "oyKisaOnay" : OZEL_ASAMA_ADI[a]), ipucu: t(OZEL_ASAMA_ADI[a]) }))}
      metin={
        asama === "onay" && !onaylayan ? (
          <>
            {t("oyOnaylayan")} <AdimYetkilileri adim="ozOnay" />
          </>
        ) : asama !== "onay" && eksik > 0 ? (
          t("oyBekleyenIs", { n: eksik })
        ) : null
      }
      dugmeler={!ozelOnayli(o) && ozelOnayDegisebilir(ben, o, true) && <OnayDugmesi ben={ben} o={o} />}
      kunye={yayinAraligi(o, dil)}
    />
  );
}

/* Planın onayı: elle verilen tek aşama. Eski düzenin onay bekleyen paket önerileri de onaylanıyor; soru kaçını söylüyor. */
function OnayDugmesi({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const onayla = () => {
    const p = (o.paketOnerileri ?? []).filter((x) => x.durum === "oneri").length;
    if (!confirm(p ? t("oyOnaySayili", { p }) : t("planOnaySoru"))) return;
    if (ozelOnayla(ben, o.id, true)) bildir(t("bPlanOnaylandi"));
  };
  return (
    <button type="button" className="dugme" onClick={onayla} data-ozel-onayla>
      <CheckCircle size={16} /> {t("oyOnayla")}
    </button>
  );
}

export function OzelSayfa({ ben, id }: { ben: Kisi; id: string }) {
  const { t } = useDil();
  const v = useVeri();
  const [kunye, setKunye] = useState(false);
  const [sekme, setSekme] = useAdimDurumu<OzelSekme>("ozel:sekme", "genel");
  const o = v.ozel.find((x) => x.id === id);
  if (!o) return <Bos metin={t("oyYok")} />;
  const duzen = ozelDuzenler(ben);
  const ozet = ozelOzeti(o, v);
  const sayilar: [Anahtar, number][] = [
    ["oyGunSayisi", yayinGunleri(o, v).length],
    ["oyNafizeler", ozelNafizeleri(v, o.id).length],
    ["oyPaketler", ozelIcerikleri(v, o.id).length + ozelPaketSatirlari(o, v).length],
    ["oyHazirlik", o.hazirlik.filter((h) => !h.tamam).length],
  ];
  return (
    <div className="ozel-sayfa" data-ozel-sayfa={o.id}>
      <OzelBasi ben={ben} o={o} duzen={duzen} kunyeAc={() => setKunye(true)} />
      <section className="kart ozel-kunye">
        <div className="ozel-sayilar">
          {sayilar.map(([k, n]) => (
            <div key={k} className="ozel-sayi" data-ozel-sayi={k}>
              <b>{n}</b>
              <span>{t(k)}</span>
            </div>
          ))}
          <div className="ozel-sayi ozel-sayi-ilerleme">
            <span>
              {t("oyIlerleme")} · {ozet.biten}/{ozet.toplam}
            </span>
            <Ilerleme oran={ozet.toplam ? ozet.biten / ozet.toplam : 0} />
          </div>
        </div>
        {o.aciklama && (
          <details className="ozel-gecmis">
            <summary>{t("oyAciklama")}</summary>
            <Icerik blok className="ozel-aciklama">
              {o.aciklama}
            </Icerik>
          </details>
        )}
      </section>
      <nav className="sekmeler ozel-sekmeler" role="tablist">
        {OZEL_SEKMELERI.map(([s, k]) => (
          <button key={s} role="tab" aria-selected={sekme === s} className={sekme === s ? "acik" : ""} onClick={() => setSekme(s)} data-ozel-sekme={s}>
            {t(k)}
          </button>
        ))}
      </nav>
      {sekme === "genel" && <PlanAsamalari ben={ben} o={o} git={setSekme} kunyeAc={() => setKunye(true)} />}
      {sekme === "program" && <GunlukProgram ben={ben} o={o} />}
      {sekme === "nafize" && <Nafizeler ben={ben} o={o} />}
      {sekme === "icerik" && <Paketler ben={ben} o={o} />}
      {sekme === "gorev" && <Gorevlendirmeler ben={ben} o={o} />}
      {sekme === "hazirlik" && <Maddeler ben={ben} o={o} />}
      {kunye && <KunyePenceresi ben={ben} o={o} kapat={() => setKunye(false)} />}
    </div>
  );
}

/*
 * Günlük program: solda günler, ortada seçili günün nafizeleri saat sırasıyla ve o gün yayınlanacak
 * içerikler, sağda o gün sahada olanlar, o günün yapılacakları ve konuklar. Kayıtlar kendi yerlerinde;
 * burada yalnız güne göre okunuyor (ozel.ts → ozelGunu).
 */
function GunlukProgram({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const gunler = yayinGunleri(o, v);
  const sayi = (g: string) => {
    const x = ozelGunu(o, v, g);
    return x.nafizeler.length + x.icerikler.length + x.gorevler.length + x.maddeler.length;
  };
  const ilk = gunler.includes(bugun()) ? bugun() : (gunler.find((g) => sayi(g) > 0) ?? gunler[0]);
  const [gun, setGun] = useState(ilk);
  const [ac, setAc] = useState<string | null>(null);
  const [form, setForm] = useState<CanliYayin | "yeni" | null>(null);
  const secili = gunler.includes(gun) ? gun : ilk;
  const g = ozelGunu(o, v, secili);
  const acik = g.nafizeler.find((n) => n.id === ac);
  const konuklar = g.nafizeler.flatMap((n) => (n.konuklar ?? []).map((k) => ({ k, n })));
  const duzen = ozelDuzenler(ben);
  const baslik = (k: Anahtar, n: number) => (
    <h4>
      {t(k)} <em>{n}</em>
    </h4>
  );
  return (
    <div className="ozel-program" data-ozel-program>
      <section className="kart ozel-gunler">
        <h3>{t("oyGunler")}</h3>
        <div className="ozel-gun-listesi">
          {gunler.map((x) => {
            const n = sayi(x);
            return (
              <button key={x} className={`ozel-gun${x === secili ? " acik" : ""}`} aria-pressed={x === secili} onClick={() => setGun(x)} data-ozel-gun={x}>
                <span>{gunAdi(x, dil)}</span>
                <b>{tarihYaz(x, dil)}</b>
                {n > 0 && <em>{n}</em>}
              </button>
            );
          })}
        </div>
      </section>
      <section className="kart ozel-akis">
        <div className="ozel-akis-ust">
          <h3>
            {gunAdi(secili, dil)} · {tarihYaz(secili, dil, "uzun")}
          </h3>
          {duzen && (
            <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => setForm("yeni")} data-program-nafize-ekle>
              <Plus size={15} /> {t("oyNafizeEkle")}
            </button>
          )}
        </div>
        {g.nafizeler.length === 0 && <Bos kucuk metin={t("oyGunBos")} />}
        <ol className="ozel-zaman-cizelgesi">
          {g.nafizeler.map((n) => {
            const muhabir = kisiBul(v, n.muhabirId);
            return (
              <li key={n.id}>
                <span className="ozel-saat">{n.saatGmt ? `${n.saatGmt} GMT` : "TBC"}</span>
                <button className="ozel-nafize-satiri" onClick={() => setAc(n.id)} data-program-nafize={n.id}>
                  <Icerik blok>{n.konu}</Icerik>
                  <span className="ozel-nafize-alt">
                    {n.yer && <Icerik>{n.yer}</Icerik>}
                    {muhabir ? (
                      <span className="ozel-kisi">
                        <Avatar kisi={muhabir} boy="kucuk" /> {ad(muhabir)}
                      </span>
                    ) : null}
                    {(n.konuklar ?? []).length > 0 && (
                      <span>
                        <Users size={14} /> {n.konuklar!.length}
                      </span>
                    )}
                  </span>
                  <NafizeRozeti n={n} />
                </button>
              </li>
            );
          })}
        </ol>
        {g.icerikler.length > 0 && (
          <>
            {baslik("oyPaketler", g.icerikler.length)}
            <ul className="ozel-ozet-listesi" data-program-icerikler>
              {g.icerikler.map((p) => (
                <li key={p.id} data-program-icerik={p.id}>
                  <a href={`#/paketler/${p.id}`}>
                    <Icerik>{p.baslik}</Icerik>
                  </a>
                  <small className="sonuk-yazi">{ad(kisiBul(v, p.muhabirId ?? p.hazirlayanId))}</small>
                  <PaketDurumRozeti paket={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="kart ozel-gun-ozeti">
        <h3>{t("oyGunOzeti")}</h3>
        {baslik("oySahada", g.gorevler.length)}
        {g.gorevler.length === 0 && <p className="sonuk-yazi">—</p>}
        <ul className="ozel-ozet-listesi" data-program-gorevler>
          {g.gorevler.map((x) => (
            <li key={x.id}>
              <span>
                <b>{ad(kisiBul(v, x.kisiId))}</b>
                <small>
                  <Icerik>{x.yer}</Icerik>
                </small>
              </span>
              <Rozet ton={gorevHazir(x) ? "iyi" : "uyari"}>{t(GOREVLENDIRME_DURUM_ADI[x.durum])}</Rozet>
            </li>
          ))}
        </ul>
        {baslik("oyGunMaddeleri", g.maddeler.length)}
        {g.maddeler.length === 0 && <p className="sonuk-yazi">—</p>}
        <ul className="ozel-ozet-listesi" data-program-maddeler>
          {g.maddeler.map((h) => (
            <li key={h.id}>
              <MaddeKutusu ben={ben} o={o} h={h} />
            </li>
          ))}
        </ul>
        {baslik("oyKonuklar", konuklar.length)}
        {konuklar.length === 0 && <p className="sonuk-yazi">—</p>}
        <ul className="ozel-ozet-listesi">
          {konuklar.map(({ k, n }) => (
            <li key={`${n.id}-${k.id}`}>
              <span>
                <b dir="auto">{k.ad}</b>
                {k.unvan && <small dir="auto">{k.unvan}</small>}
              </span>
              <Rozet ton={DURUM_TONU[k.durum] ?? ""}>{t(KONUK_DURUM_ADI[k.durum])}</Rozet>
            </li>
          ))}
        </ul>
      </section>
      {acik && (
        <Pencere baslik={<Icerik>{nafizeBasligi(acik)}</Icerik>} kapat={() => setAc(null)} genis>
          <NafizeKalemi ben={ben} n={acik} duzenle={() => { setAc(null); setForm(acik); }} />
        </Pencere>
      )}
      {form && <NafizePenceresi ben={ben} o={o} n={form === "yeni" ? undefined : form} gun={secili} kapat={() => setForm(null)} />}
    </div>
  );
}

/*
 * Planın aşamaları kayıttan (ozel.ts → ozelAsamaDurumlari): her aşamanın
 * durumu ve altında eksikleri; eksiğe basınca işin sekmesi açılır. Elle
 * verilen tek adım planın onayı (Plan yetkileri › ozOnay).
 */
function PlanAsamalari({ ben, o, git, kunyeAc }: { ben: Kisi; o: OzelYayin; git: (s: OzelSekme) => void; kunyeAc: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const durumlar = ozelAsamaDurumlari(o, v);
  const simdi = durumlar.find((a) => !a.tamam)?.asama;
  const onaylayan = planAdimiYapabilir(ben, "ozOnay");
  const onayIzi = ozelOnayli(o) ? isaretIzi(o.iz, "onayli") : undefined;
  const geriAl = () => confirm(t("oyOnayGeriSoru")) && ozelOnayla(ben, o.id, false) && bildir(t("bKaydedildi"));
  return (
    <section className="kart" data-ozel-asamalar data-ozel-asama={simdi ?? "tamam"}>
      <header className="kart-bas">
        <h2>
          <CheckCircle size={18} /> {t("oyAsamalar")}
        </h2>
        <span className="ek">{t(OZEL_ASAMA_ADI[simdi ?? "tamam"])}</span>
      </header>
      <ol className="ozel-asama-listesi">
        {durumlar.map((a) => (
          <li key={a.asama} className={a.tamam ? "tamam" : a.asama === simdi ? "simdi" : ""} data-asama={a.asama} data-tamam={a.tamam ? "1" : "0"}>
            <div className="ozel-asama-bas">
              {a.tamam ? <CheckCircle size={18} className="iyi-yazi" /> : <Circle size={18} className={a.asama === simdi ? "vurgu-yazi" : "sonuk-yazi"} />}
              <b>{t(OZEL_ASAMA_ADI[a.asama])}</b>
              {a.asama !== "onay" && a.eksikler.length > 0 && <span className="ek">{a.eksikler.length}</span>}
              {a.asama === "onay" && ozelOnayDegisebilir(ben, o, false) && (
                <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={geriAl} data-ozel-onay-geri>
                  {t("onayiGeriAl")}
                </button>
              )}
            </div>
            {a.asama === "onay" ? (
              onayIzi ? (
                <small className="sonuk-yazi">
                  <bdi>{ad(kisiBul(v, onayIzi.kisiId))}</bdi> · <bdi>{`${tarihYaz(onayIzi.zaman.slice(0, 10), dil, "kisa")} ${saatYaz(onayIzi.zaman, dil)}`}</bdi>
                </small>
              ) : (
                !onaylayan && (
                  <small className="sonuk-yazi">
                    {t("oyOnaylayan")} <AdimYetkilileri adim="ozOnay" />
                  </small>
                )
              )
            ) : (
              <EksikListesi eksikler={a.eksikler} git={(e) => (e.tur === "plan" && e.id === "aciklama" ? kunyeAc() : git(EKSIK_SEKMESI[e.tur]))} />
            )}
          </li>
        ))}
      </ol>
      <Gecmis iz={o.iz ?? []} />
      {(ozelDuzenler(ben) || onaylayan) && <NotSatiri ekle={(m) => ozelAsamaNotu(ben, o.id, simdi ?? "tamam", m)} veri="plan" />}
    </section>
  );
}

/* Aşamanın eksikleri: ilk altısı, gerisi "+n daha" ile; günü geçen kırmızı. */
function EksikListesi({ eksikler, git }: { eksikler: OzelEksik[]; git: (e: OzelEksik) => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [hepsi, setHepsi] = useState(false);
  if (!eksikler.length) return null;
  const gorunen = hepsi ? eksikler : eksikler.slice(0, 6);
  return (
    <ul className="ozel-eksikler" data-ozel-eksikler>
      {gorunen.map((e) => {
        const gec = !!e.tarih && e.tarih < bugun();
        const kisi = kisiBul(v, e.kisiId);
        return (
          <li key={`${e.tur}-${e.id}`} className={gec ? "gecikti" : ""} data-eksik={e.id} data-eksik-tur={e.tur}>
            <button type="button" className="ozel-eksik" onClick={() => git(e)}>
              <span className="sonuk-yazi">{KALEM_IKONU[e.tur]}</span>
              <span className="ad">
                {e.ad ? <Icerik>{e.ad}</Icerik> : t(e.neden)}
                <small>{[e.ad ? t(e.neden) : "", e.tarih ? tarihYaz(e.tarih, dil, "kisa") : "", kisi ? ad(kisi) : ""].filter(Boolean).join(" · ")}</small>
              </span>
              {gec && <AlertTriangle size={15} className="kotu-yazi" aria-label={t("oyGecikti")} />}
            </button>
          </li>
        );
      })}
      {!hepsi && eksikler.length > 6 && (
        <li>
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setHepsi(true)}>
            {t("oyEkDaha", { n: eksikler.length - 6 })}
          </button>
        </li>
      )}
    </ul>
  );
}

/* --- Nafizeler ve konuklar --- */

/*
 * Nafize özel yayının canlı yayını (veri.ts → CanliYayin.ozelId): günün
 * Next Day planındaki canlıyla tek kayıt, saati GMT. Durumu kayıttan:
 * yayınlandıysa Newsdesk'in "yapıldı/yapılmadı"sı, değilse Satdesk
 * rezervasyonu ve yerin hazır olması (başka kayıtta tutulmayan iki işaret).
 */
const nafizeDurumu = (n: CanliYayin): NafizeDurum | "yapilmadi" =>
  n.sonuc ? (n.sonuc.durum === "yapildi" ? "yapildi" : "yapilmadi") : n.rezervasyon && n.yerHazir ? "hazir" : n.rezervasyon ? "rezervasyon" : "planlandi";

function NafizeRozeti({ n }: { n: CanliYayin }) {
  const { t } = useDil();
  const d = nafizeDurumu(n);
  return (
    <Rozet ton={d === "yapilmadi" ? "kotu" : (DURUM_TONU[d] ?? "")}>
      <span data-nafize-durum={d}>{t(d === "yapilmadi" ? "oyNfYapilmadi" : NAFIZE_DURUM_ADI[d])}</span>
    </Rozet>
  );
}

function Nafizeler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<CanliYayin | "yeni" | null>(null);
  const liste = ozelNafizeleri(v, o.id);
  return (
    <>
      <Bolum
        ad={t("oyNafizeler")}
        ikon={<Mic size={18} />}
        ek={`${liste.filter(nafizeHazir).length}/${liste.length}`}
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
            <NafizeKalemi key={n.id} ben={ben} n={n} duzenle={() => setForm(n)} />
          ))}
        </div>
      </Bolum>
      {form && <NafizePenceresi ben={ben} o={o} n={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
  );
}

function NafizeKalemi({ ben, n, duzenle }: { ben: Kisi; n: CanliYayin; duzenle: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const duzen = ozelDuzenler(ben);
  const [konuk, setKonuk] = useState({ ad: "", unvan: "" });
  const muhabir = kisiBul(v, n.muhabirId);
  const konuklar = n.konuklar ?? [];
  const plan = n.planId ? v.planlar.find((p) => p.id === n.planId) : undefined;
  const isaret = (alan: "rezervasyon" | "yerHazir", ad_: Anahtar) => {
    const iz = n[alan];
    const kisi = kisiBul(v, iz?.kisiId);
    return (
      <label className="secim" data-nafize-isaret={alan}>
        <input type="checkbox" checked={!!iz} disabled={!duzen} onChange={(e) => nafizeIsaret(ben, n.id, alan, e.target.checked)} />
        {t(ad_)}
        {iz && <small className="sonuk-yazi">{` · ${kisi ? ad(kisi) : ""} ${tarihYaz(iz.zaman.slice(0, 10), dil, "kisa")}`}</small>}
      </label>
    );
  };
  return (
    <Kalem veri={{ "data-nafize": n.id }} baslik={<Icerik>{nafizeBasligi(n)}</Icerik>} rozet={<NafizeRozeti n={n} />}>
      <Icerik blok className="ozel-nafize-konu">
        {n.konu}
      </Icerik>
      <small className="sonuk-yazi">
        {t("muhabir")}: {muhabir ? ad(muhabir) : t("atanmadi")}
      </small>
      {/* Günün planı açıksa canlı orada; değilse plan açılınca kendiliğinden girer. */}
      <small className="sonuk-yazi" data-nafize-plan={plan ? plan.id : ""}>
        {plan ? (
          <a href={`#/nextday/${plan.id}`}>
            {t("nextday")} · {tarihYaz(plan.tarih, dil, "kisa")}
          </a>
        ) : (
          t("oyNfPlanBekliyor")
        )}
      </small>
      <div className="dugmeler">
        {isaret("rezervasyon", "oyNfRezervasyon")}
        {isaret("yerHazir", "oyNfHazir")}
      </div>
      <div className="ozel-konuklar">
        <span className="alan-etiket">
          <Users size={14} /> {t("oyKonuklar")} ({konuklar.filter((k) => k.durum !== "iptal").length})
        </span>
        <ul className="konuk-listesi">
          {konuklar.map((k) => (
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
                  onChange={(e) => konukKaydet(ben, n.id, { ...k, durum: e.target.value as KonukDurum })}
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
                <button className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => konukSil(ben, n.id, k.id)} title={t("sil")} aria-label={t("sil")}>
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
              onClick={() => konukKaydet(ben, n.id, { ad: konuk.ad, unvan: konuk.unvan, durum: "aday" }) && setKonuk({ ad: "", unvan: "" })}
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
          <button className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={() => confirm(t("oyNfSilOnay")) && nafizeSil(ben, n.id)} data-nafize-sil>
            <Trash2 size={14} /> {t("sil")}
          </button>
        </div>
      )}
    </Kalem>
  );
}

function NafizePenceresi({ ben, o, n, gun, kapat }: { ben: Kisi; o: OzelYayin; n?: CanliYayin; gun?: string; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({
    konu: n?.konu ?? "",
    tarih: n?.tarih ?? gun ?? o.tarih,
    saatGmt: n?.saatGmt ?? "",
    yer: n?.yer ?? "",
    muhabirId: n?.muhabirId ?? "",
  });
  const kaydet = () => {
    if (nafizeKaydet(ben, o.id, { ...f, id: n?.id })) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(n ? "duzenle" : "oyNafizeEkle")} kapat={kapat}>
      <div className="form" data-nafize-formu>
        <div className="satir">
          <label>
            {t("oyTarih")}
            <TarihGirdisi value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-nafize-tarih />
          </label>
          <label>
            {t("oyYer")}
            <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="تل أبيب" data-nafize-yer />
          </label>
          <label>
            {t("oyNfSaatGmt")}
            <SaatGirdisi value={f.saatGmt} onChange={(e) => setF({ ...f, saatGmt: e.target.value })} data-nafize-saat />
          </label>
        </div>
        <label>
          {t("oyKonu")}
          <textarea {...icerikAlani} rows={2} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} data-nafize-konu />
        </label>
        <label>
          {t("muhabir")}
          <MuhabirSecici deger={f.muhabirId} degistir={(x) => setF({ ...f, muhabirId: x })} bosEtiket={t("atanmadi")} />
        </label>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.konu.trim() || !f.tarih} />
      </div>
    </Pencere>
  );
}

/* --- Paketler: öneri → onay → görev → hazırlık → hazır --- */

function Paketler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [form, setForm] = useState<OzelPaketSatiri | null>(null);
  const [gorev, setGorev] = useState(false);
  const satirlar = ozelPaketSatirlari(o, v);
  const icerikler = ozelIcerikleri(v, o.id);
  const gruplar: ["inhouse" | "dis", Anahtar][] = [
    ["inhouse", "oyInhouse"],
    ["dis", "oyDis"],
  ];
  return (
    <>
      <Bolum
        acik
        ad={t("oyPaketler")}
        ikon={<Package size={18} />}
        ek={`${icerikler.filter((p) => p.durum === "tamamlandi").length + satirlar.filter((s) => s.asama === "hazir").length}/${icerikler.length + satirlar.length}`}
        ekle={
          ileriGorevVerebilir(ben)
            ? {
                metin: t("oyIcerikGorevlendir"),
                ac: () => setGorev(true),
                veri: "data-ozel-icerik-ekle",
              }
            : undefined
        }
      >
        {satirlar.length + icerikler.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
        {/* Yayın günü yayın günü, Stok'taki gibi kart ızgarasında. */}
        {[...new Set(icerikler.map((p) => p.yayinGunu ?? ""))].sort((a, b) => (a || "9999").localeCompare(b || "9999")).map((g) => (
          <section key={g || "gunsuz"} className="ara-ust-2" data-ozel-icerikler={g}>
            <div className="alan-etiket">{g ? `${t("oyYayinGunu")} · ${gunAdi(g, dil)} ${tarihYaz(g, dil, "kisa")}` : `${t("oyYayinGunu")} · TBC`}</div>
            <div className="prg-icerikler">
              {icerikler
                .filter((p) => (p.yayinGunu ?? "") === g)
                .map((p) => (
                  <IcerikKalemi key={p.id} ben={ben} p={p} />
                ))}
            </div>
          </section>
        ))}
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
      {form && <PaketOneriPenceresi ben={ben} o={o} s={form} kapat={() => setForm(null)} />}
      {gorev && <IcerikPenceresi ben={ben} o={o} kapat={() => setGorev(false)} />}
    </>
  );
}


/*
 * Özel yayın görevinin postası kendiliğinden gitmiyor (kullanıcı): içeriğin
 * kartındaki posta düğmesinde gövdenin üstünde şablon olarak seçilir,
 * gönderilince pakette iz; şablon oradan düzenlenip kaydedilir (yetkiliye).
 * Yayının İçerik sekmesi ve Stok'un Special Coverage kutusu aynısını kullanır.
 */
export const ozelGorevSablonlari = (ben: Kisi, d: Durum, p: Paket, t: (k: Anahtar) => string): PostaSablonu[] => {
  if (!ozelIcerikMi(p) || !ileriGorevVerebilir(ben)) return [];
  const e = ozelGorevEpostasi(d, p, ben);
  return [
    {
      id: "ozel-gorev",
      ad: t("ozgSablonBaslik"),
      konu: e.konu,
      metin: e.metin,
      cc: e.cc,
      bcc: e.bcc,
      gitti: () => ozelGorevPostasiGitti(ben, p.id),
      ...(geriBildirimSablonuDuzenler(ben) ? { duzenleFormu: <TakdirFormu ben={ben} tur="ozel" /> } : {}),
    },
  ];
};

/*
 * Yeni düzenin içeriği Stok'un kartıyla (kullanıcı: görevlendirme tasarımı standart stoklardaki gibi):
 * tür, yer, aşama · kimde, başlık, teslim satırı, muhabir ve ona ulaşma; altta görev postası, "Üretime al"
 * ve geri alma (görevi ya da tamamlamayı). Ayrıntı ve üretim paketin sayfasında.
 */
function IcerikKalemi({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const sablonlar = ozelGorevSablonlari(ben, v, p, t);
  const geriAl = () => confirm(t("oyGorevGeriAlSoru")) && ozelIcerikGeriAl(ben, p.id) && bildir(t("oyGorevGeriAlindi"));
  const [gunAc, setGunAc] = useState(false);
  const acik = p.durum === "onaylandi" || p.durum === "uretimde";
  const posta = acik && p.takdirBildirimi && (
    <span className="sonuk-yazi" title={saatYaz(p.takdirBildirimi.zaman, dil)} data-ozel-posta="gitti">
      <Mail size={14} /> {t("oyPostaGitti")}
    </span>
  );
  return (
    <div className="icerik-sarma" data-ozel-icerik={p.id}>
      <StokKarti
        ben={ben}
        p={p}
        yayinsiz
        sablonlar={sablonlar}
        ek={
          <>
            {posta}
            {uretimYoluBelirleyebilir(ben, p) && p.durum === "onaylandi" && !p.uretim && <UretimeAlDugmesi ben={ben} paket={p} />}
            {ozelIcerikYayinGunuDegisebilir(ben, p) && (
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setGunAc(true)} data-ozel-yayin-gunu-ac>
                <CalendarDays size={14} /> {p.yayinGunu ? `${t("oyYayinGunu")}: ${tarihYaz(p.yayinGunu, dil, "kisa")}` : t("oyYayinGunuBelirle")}
              </button>
            )}
            {ozelIcerikGeriAlinabilir(ben, p) && (
              <button type="button" className="dugme dugme-sade dugme-kucuk kotu-yazi" onClick={geriAl} data-ozel-icerik-geri-al>
                <RotateCcw size={14} /> {t("oyGorevGeriAl")}
              </button>
            )}
            {p.durum === "tamamlandi" && <TamamlamaGeriAlDugmesi ben={ben} paket={p} />}
          </>
        }
      />
      {gunAc && <YayinGunuPenceresi ben={ben} p={p} kapat={() => setGunAc(false)} />}
    </div>
  );
}

/* Yayın gününü sonradan belirle ya da değiştir: yayının günlerinden biri ya da TBC. */
function YayinGunuPenceresi({ ben, p, kapat }: { ben: Kisi; p: Paket; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const o = v.ozel.find((x) => x.id === p.ozelId);
  const [gun, setGun] = useState(p.yayinGunu ?? "");
  if (!o) return null;
  const gunler: string[] = [];
  for (let g = o.tarih, i = 0; g <= (o.bitis || o.tarih) && i < 62; g = gunEkle(g, 1), i++) gunler.push(g);
  const kaydet = () => {
    if (ozelIcerikYayinGunu(ben, p.id, gun)) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t("oyYayinGunu")} alt={<Icerik>{p.baslik}</Icerik>} kapat={kapat}>
      <div className="form" data-ozel-yayin-gunu-formu>
        <label>
          {t("oyYayinGunu")}
          <select value={gun} onChange={(e) => setGun(e.target.value)} data-ozel-yayin-gunu-sec>
            <option value="">TBC</option>
            {gunler.map((g) => (
              <option key={g} value={g}>
                {`${gunAdi(g, dil)} · ${tarihYaz(g, dil, "kisa")}`}
              </option>
            ))}
          </select>
        </label>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={gun === (p.yayinGunu ?? "")} />
      </div>
    </Pencere>
  );
}

/* Doğrudan görevlendirme: muhabir, Strap, yayın günü (yayının günlerinden), teslim günü, haber türü, not; kalıp posta isteğe bağlı. */
function IcerikPenceresi({ ben, o, kapat }: { ben: Kisi; o: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const ilkGun = o.tarih < bugun() && (o.bitis || o.tarih) >= bugun() ? bugun() : o.tarih;
  const [f, setF] = useState({ muhabirId: "", baslik: "", aciklama: "", yayinGunu: ilkGun, tbc: false, tarih: "", bicim: "pkg" as Bicim, not: "" });
  // Yayın günü TBC: teslim yayının son gününe dek, boşsa yayının ilk günü (eylemle aynı kural).
  const yayinGunu = f.tbc ? "" : f.yayinGunu;
  const sonGun = yayinGunu || o.bitis || o.tarih;
  const teslim = f.tarih || yayinGunu || ilkGun;
  const hazir = !!f.muhabirId && !!f.baslik.trim() && (f.tbc || ozelIcerikGunuUygun(o, f.yayinGunu)) && teslim <= sonGun && teslim >= bugun();
  const kaydet = () => {
    if (!hazir) return;
    const id = ozelIcerikGorevlendir(ben, o.id, { muhabirId: f.muhabirId, baslik: f.baslik, aciklama: f.aciklama, yayinGunu: yayinGunu || undefined, tarih: teslim, bicim: f.bicim, not: f.not });
    if (!id) return;
    bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t("oyIcerikGorevlendir")} kapat={kapat}>
      <div className="form" data-ozel-icerik-formu>
        <label>
          {t("muhabir")}
          <MuhabirSecici deger={f.muhabirId} degistir={(m) => setF({ ...f, muhabirId: m })} bosEtiket={t("seciniz")} />
        </label>
        <label>
          {t("paketBasligi")}
          <input {...icerikAlani} value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} data-ozel-icerik-baslik />
        </label>
        <label>
          {t("kisaAciklama")}
          <textarea {...icerikAlani} rows={3} value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
        </label>
        <div className="satir">
          <label>
            {t("oyYayinGunu")}
            <span className="tbc-satiri">
              {!f.tbc && <TarihGirdisi value={f.yayinGunu} min={o.tarih} max={o.bitis || o.tarih} required onChange={(e) => setF({ ...f, yayinGunu: e.target.value })} data-ozel-yayin-gunu />}
              <span data-ozel-yayin-tbc>
                <TbcKutusu secili={f.tbc} degistir={(x) => setF({ ...f, tbc: x })} />
              </span>
            </span>
          </label>
          <label>
            {t("oyTeslim")}
            <TarihGirdisi value={f.tarih} min={bugun()} max={sonGun} onChange={(e) => setF({ ...f, tarih: e.target.value })} data-ozel-teslim />
          </label>
          <label>
            {t("haberTuru")}
            <BicimSecici deger={f.bicim} degistir={(b) => setF({ ...f, bicim: b })} />
          </label>
        </div>
        <label>
          {t("not")}
          <AnmaGirdisi cokSatir rows={2} deger={f.not} degistir={(x) => setF({ ...f, not: x })} />
        </label>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!hazir} />
      </div>
    </Pencere>
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
  const onayGeriAl = () => p && confirm(t("oyOnayGeriSoru")) && ozelPaketOnayGeriAl(ben, o.id, p.id) && bildir(t("bKaydedildi"));
  const yapan = kisiBul(v, s.muhabirId ?? p?.hazirlayanId);
  const gec = s.asama !== "hazir" && !!s.sonTarih && s.sonTarih < bugun();
  /* Her aşamanın işaretini kim koyuyor: onayı onaylayan, görevi Output müdürü (dışta onayla), hazırlığı işi yapan ya da Planlama. */
  const degistir = (adim: OzelPaketAsamasi): (() => unknown) | undefined => {
    // Görevi verilmemiş onay geri alınıyor (kutunun işareti kalkınca).
    if (adim === "onayli" && s.asama === "onayli" && p && ozelPaketOnayiGeriAlinabilir(ben, p)) return () => onayGeriAl();
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
        {ozelPaketOnayiGeriAlinabilir(ben, p) && (
          <button className="dugme dugme-sade dugme-kucuk" onClick={onayGeriAl} data-ozel-paket-onay-geri>
            <RotateCcw size={14} /> {t("onayiGeriAl")}
          </button>
        )}
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
            <TarihGirdisi value={f.sonTarih} onChange={(e) => setF({ ...f, sonTarih: e.target.value })} data-ozel-son-tarih />
          </label>
          <label>
            {t("tur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
              {SECILEN_TURLER.map((y) => (
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
              {HAREKET_TURLERI.filter((x) => x !== "izin" && x !== "seyahat").map((x) => (
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
            <TarihGirdisi value={f.baslangic} onChange={(e) => setF({ ...f, baslangic: e.target.value })} />
          </label>
          <label>
            {t("bitis")}
            <TarihGirdisi value={f.bitis} min={f.baslangic} onChange={(e) => setF({ ...f, bitis: e.target.value })} />
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

/* --- Yapılacaklar: hazırlık maddeleri ve eski talepler tek listede, gün gün --- */

/* Maddenin kutusu: işaretleyebilen için onay kutusu, öbürüne durum simgesi; birim ve gecikme yanında. */
function MaddeKutusu({ ben, o, h }: { ben: Kisi; o: OzelYayin; h: OzelMadde }) {
  const { t } = useDil();
  const gec = !h.tamam && !!h.gun && h.gun < bugun();
  const yazi = (
    <>
      <Icerik>{h.metin}</Icerik>
      {h.birim && <small className="sonuk-yazi"> · {birimAdi(h.birim)}</small>}
      {gec && <AlertTriangle size={14} className="kotu-yazi" aria-label={t("oyGecikti")} />}
    </>
  );
  return ozelDuzenler(ben) ? (
    <label className="secim" data-madde-kutu={h.id}>
      <input type="checkbox" checked={h.tamam} onChange={(e) => ozelHazirlikIsaretle(ben, o.id, h.id, e.target.checked)} />
      <span>{yazi}</span>
    </label>
  ) : (
    <span className="secim">
      {h.tamam ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
      <span>{yazi}</span>
    </span>
  );
}

function Maddeler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const duzen = ozelDuzenler(ben);
  const [form, setForm] = useState<OzelMadde | "yeni" | null>(null);
  const gunler = yayinGunleri(o, v);
  const gruplar: [string, OzelMadde[]][] = [
    ...gunler.map((g): [string, OzelMadde[]] => [g, o.hazirlik.filter((h) => h.gun === g)]),
    ["", o.hazirlik.filter((h) => !h.gun || !gunler.includes(h.gun))],
  ].filter(([, l]) => l.length) as [string, OzelMadde[]][];
  return (
    <>
      <Bolum
        acik
        ad={t("oyHazirlik")}
        ikon={<ClipboardList size={18} />}
        ek={`${o.hazirlik.filter((h) => h.tamam).length}/${o.hazirlik.length}`}
        ekle={duzen ? { metin: t("oyMaddeEkle"), ac: () => setForm("yeni"), veri: "data-madde-ekle" } : undefined}
      >
        {!o.hazirlik.length && <Bos kucuk metin={t("kayitYok")} />}
        {gruplar.map(([g, l]) => (
          <div key={g || "gunsuz"} className="ara-ust-2" data-madde-grubu={g}>
            <div className="alan-etiket">{g ? `${gunAdi(g, dil)} · ${tarihYaz(g, dil, "kisa")}` : t("oyMaddeGunsuz")}</div>
            <ul className="liste">
              {l.map((h) => (
                <li key={h.id} data-hazirlik={h.id} data-ozel-madde={h.id}>
                  <MaddeKutusu ben={ben} o={o} h={h} />
                  {duzen && (
                    <span className="dugmeler">
                      <button className="dugme dugme-sade dugme-ikon dugme-kucuk" onClick={() => setForm(h)} title={t("duzenle")} aria-label={t("duzenle")} data-madde-duzenle>
                        <Pencil size={14} />
                      </button>
                      <button className="dugme dugme-sade dugme-ikon dugme-kucuk kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelMaddeSil(ben, o.id, h.id)} title={t("sil")} aria-label={t("sil")} data-madde-sil>
                        <Trash2 size={14} />
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Bolum>
      {form && <MaddePenceresi ben={ben} o={o} h={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
  );
}

function MaddePenceresi({ ben, o, h, kapat }: { ben: Kisi; o: OzelYayin; h?: OzelMadde; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const gunler = yayinGunleri(o, v);
  const [f, setF] = useState({ metin: h?.metin ?? "", gun: h?.gun ?? "", birim: (h?.birim ?? "") as BirimId | "" });
  const kaydet = () => {
    if (ozelMaddeKaydet(ben, o.id, { id: h?.id, metin: f.metin, gun: f.gun || undefined, birim: f.birim || undefined })) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(h ? "duzenle" : "oyMaddeEkle")} kapat={kapat}>
      <div className="form" data-madde-formu>
        <label>
          {t("oyTalepMetni")}
          <textarea rows={3} {...icerikAlani} value={f.metin} onChange={(e) => setF({ ...f, metin: e.target.value })} data-madde-metni />
        </label>
        <div className="satir">
          <label>
            {t("oyTarih")}
            <select value={f.gun} onChange={(e) => setF({ ...f, gun: e.target.value })} data-madde-gun>
              <option value="">{t("oyMaddeGunsuz")}</option>
              {[...new Set([...gunler, ...(f.gun ? [f.gun] : [])])].sort().map((g) => (
                <option key={g} value={g}>
                  {`${gunAdi(g, dil)} · ${tarihYaz(g, dil, "kisa")}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("birim")}
            <select value={f.birim} onChange={(e) => setF({ ...f, birim: e.target.value as BirimId })} data-madde-birim>
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
        </div>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.metin.trim()} />
      </div>
    </Pencere>
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

/* `bosGizle`: Stok sayfasının Üretim kutusunda boşken çizilmez (kartlar kalabalıklaşmasın). */
export function OzelTalepAlani({ ben, bosGizle }: { ben: Kisi; bosGizle?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter((p) => eskiOzelPaket(p) && p.ozelKaynak === "inhouse" && p.durum === "onaylandi" && (ozelPaketDagitabilir(ben, p) || p.hazirlayanId === ben.id));
  if (bosGizle && !liste.length) return null;
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
