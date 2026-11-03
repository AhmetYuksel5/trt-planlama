import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe,
  Lightbulb,
  RefreshCw,
  Settings,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bos,
  Icerik,
  Pencere,
  Rozet,
  bildir,
  icerikAlani,
} from "../bilesenler/Parcalar";
import { saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { ulkeAdi } from "../etiketler";
import {
  gundemKaynaklariKaydet,
  gundemNotuKaydet,
  gundemNotuSil,
  gundemPaylasimKaydet,
  oneriGonder,
} from "../eylemler";
import {
  BRIFING_A,
  BRIFING_B,
  GUNDEM_BOLUMLERI,
  brifingSatiri,
  capraz,
  demoHaberleri,
  firsatlar,
  aramaAdresi,
  telegramAdresi,
  eksikVarsayilanlar,
  gundemKaynaklari,
  haberleriSakla,
  ileriOlaylar,
  akisOlaylari,
  BUTUN_ETIKETLER,
  etiketAdi,
  etiketSayilari,
  olayEtiketleri,
  takipEtiketleri,
  takipEtiketleriniYaz,
  yalnizTakipOku,
  yalnizTakipYaz,
  konuBul,
  olaylariKur,
  sakliHaberler,
  seviye,
  type BrifingSatiri,
  type Firsat,
  type FirsatTuru,
  type GundemBolumu,
  type Haber,
  type Olay,
  type Seviye,
} from "../gundem";
import { GERCEK } from "../kip";
import { bugun, gunEkle } from "../tarih";
import { yaklasanlar } from "../takvim";
import {
  ULKELER,
  useVeri,
  type GundemKaynagi,
  type Kisi,
  type Ulke,
} from "../veri";
import { git, yerineGit } from "../yol";
import { gundemAkislari } from "../yz";
import { gundemGorebilir, kisitliKisi } from "../yetki";
import { birimAdi, kisiBirimleri } from "../yapi";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Gündem takibi (yalnız tam yönetici): haber akışları konu klasörlerinde,
 * önceliğe göre. Kurallar gundem.ts'te; burada okuma, tarama ve görünüm.
 * Haberler tarayıcıda tutuluyor (kişinin kolaylığı), kayıtta yalnız kaynak
 * listesi ve araştırma arşivi.
 */

const BOLUM_ADI: Record<GundemBolumu, Anahtar> = {
  brifing: "gdBrifing",
  akis: "gdAkis",
  etkinlikler: "gdEtkinlikler",
  firsatlar: "gdFirsatlar",
  arsiv: "gdArsiv",
};

const SEVIYE_ADI: Record<Seviye, Anahtar> = {
  yuksek: "gdSevYuksek",
  orta: "gdSevOrta",
  dusuk: "gdSevDusuk",
  sakin: "gdSevSakin",
};
const SEVIYE_TONU: Record<Seviye, string> = {
  yuksek: "kotu",
  orta: "uyari",
  dusuk: "bilgi",
  sakin: "",
};
const FIRSAT_ADI: Record<FirsatTuru, Anahtar> = {
  paket: "gdFPaket",
  saha: "gdFSaha",
  roportaj: "gdFRoportaj",
  aciklayici: "gdFAciklayici",
  ozel: "gdFOzel",
};

/* Ağdan yeniden okuma aralığı: kapı akışı 10 dakika önbellekte tutuyor, daha sık gitmenin anlamı yok. */
const TAZELEME = 10 * 60_000;
const SON_TARAMA = "trt-planlama-gundem-tarama";

const sonTaramaOku = () => {
  try {
    return Number(localStorage.getItem(SON_TARAMA) ?? 0) || 0;
  } catch {
    return 0;
  }
};

function useGundemHaberleri() {
  const v = useVeri();
  const [haberler, setHaberler] = useState<Haber[]>(() =>
    GERCEK ? sakliHaberler() : demoHaberleri(Date.now()),
  );
  const [taraniyor, setTaraniyor] = useState(false);
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [son, setSon] = useState(sonTaramaOku);
  const kaynaklar = gundemKaynaklari(v).filter((k) => !k.kapali);

  const tara = async () => {
    if (!GERCEK) {
      setHaberler(demoHaberleri(Date.now()));
      setSon(Date.now());
      return;
    }
    setTaraniyor(true);
    /*
     * Paket paket: Cloudflare'in ücretsiz planı tek istekte en çok 50 dış
     * çağrıya izin veriyor; kapı da istek başına 40 akış okuyor.
     */
    const adresler = kaynaklar.map((k) => k.adres);
    const paketler: string[][] = [];
    for (let i = 0; i < adresler.length; i += 30)
      paketler.push(adresler.slice(i, i + 30));
    const sonuclar = await Promise.all(paketler.map((p) => gundemAkislari(p)));
    setTaraniyor(false);
    const basarisiz = sonuclar.find((r) => !r.tamam);
    if (basarisiz && !basarisiz.tamam && sonuclar.every((r) => !r.tamam)) {
      bildir(basarisiz.hata);
      return;
    }
    const yeni: Haber[] = [];
    const h: Record<string, string> = {};
    for (const a of sonuclar.flatMap((r) => (r.tamam ? r.veri.akislar : []))) {
      const k = kaynaklar.find((x) => x.adres === a.adres);
      if (!k) continue;
      if (a.hata) h[k.id] = a.hata;
      /*
       * Tarihi okunamayan haber alınmıyor: önce okunduğu an sayılıyordu, akışta
       * duran eski haber bugünün haberi gibi görünüyordu. Yaş sınırı haberleriSakla'da.
       */
      for (const o of a.ogeler ?? [])
        if (o.zaman)
          yeni.push({
            baslik: o.baslik,
            baglanti: o.baglanti,
            zaman: o.zaman,
            ozet: o.ozet,
            kaynakId: k.id,
            // Konu aramasında haberin asıl yayıncısı: "kaç farklı kaynak" Google sayılmasın.
            kaynak: o.kaynak ?? k.ad,
          });
    }
    setHatalar(h);
    setHaberler(haberleriSakla(yeni, Date.now()));
    const t = Date.now();
    setSon(t);
    try {
      localStorage.setItem(SON_TARAMA, String(t));
    } catch {
      /* kapalı */
    }
  };

  useEffect(() => {
    if (!GERCEK || Date.now() - sonTaramaOku() > TAZELEME) void tara();
    // Yalnız açılışta: sonrası düğmeyle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { haberler, taraniyor, hatalar, son, tara };
}

export default function Gundem({ ben, sekme }: { ben: Kisi; sekme?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bolum: GundemBolumu = (GUNDEM_BOLUMLERI as readonly string[]).includes(
    sekme ?? "",
  )
    ? (sekme as GundemBolumu)
    : "brifing";
  // Kaldırılan klasör sekmelerinin (ortadogu, boynuz…) eski adresi brifinge döner, adres de düzelsin.
  useEffect(() => {
    if (sekme && sekme !== bolum) yerineGit(`gundem/${bolum}`);
  }, [sekme, bolum]);
  const { haberler, taraniyor, hatalar, son, tara } = useGundemHaberleri();
  const [kaynakAcik, setKaynakAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const simdiAn = useMemo(() => Date.now(), [haberler]);
  const olaylar = useMemo(() => olaylariKur(haberler), [haberler]);

  if (!gundemGorebilir(v, ben)) return <Bos metin={t("gdErisim")} />;

  return (
    <div className="gundem" data-gundem>
      <SayfaBasi
        ikon={<Globe size={26} />}
        baslik={t("mGundem")}
        alt={
          son
            ? `${t("gdSonTarama")}: ${tarihYaz(new Date(son).toISOString().slice(0, 10), dil)} ${saatYaz(new Date(son).toISOString(), dil)}`
            : undefined
        }
        sagUc={
          <div className="gundem-araclar">
            <button
              className="dugme dugme-ikincil dugme-kucuk"
              onClick={() => void tara()}
              disabled={taraniyor}
              data-gundem-tara
            >
              <RefreshCw size={15} className={taraniyor ? "donuyor" : ""} />{" "}
              {t("gdTara")}
            </button>
            {ben.hesapYoneticisi && (
              <button
                className="dugme dugme-sade dugme-ikon"
                onClick={() => setPaylasAcik(true)}
                title={t("gdPaylas")}
                aria-label={t("gdPaylas")}
                data-gundem-paylas
              >
                <Share2 size={16} />
              </button>
            )}
            {ben.hesapYoneticisi && <button
              className="dugme dugme-sade dugme-ikon"
              onClick={() => setKaynakAcik(true)}
              title={t("gdKaynaklar")}
              aria-label={t("gdKaynaklar")}
              data-gundem-kaynaklar
            >
              <Settings size={16} />
            </button>}
          </div>
        }
      />
      <nav className="sekmeler gundem-sekmeler" role="tablist">
        {GUNDEM_BOLUMLERI.map((b, i) => (
          <a
            key={b}
            role="tab"
            aria-selected={b === bolum}
            className={b === bolum ? "acik" : ""}
            href={`#/gundem/${b}`}
            data-gundem-sekme={b}
          >
            {i + 1}. {t(BOLUM_ADI[b])}
          </a>
        ))}
      </nav>
      {bolum === "brifing" && (
        <Brifing olaylar={olaylar} simdi={simdiAn} ben={ben} />
      )}
      {bolum === "akis" && <Akis olaylar={olaylar} simdi={simdiAn} ben={ben} />}
      {bolum === "etkinlikler" && (
        <Etkinlikler olaylar={olaylar} simdi={simdiAn} ben={ben} />
      )}
      {bolum === "firsatlar" && (
        <Firsatlar liste={firsatlar(v, olaylar, simdiAn)} ben={ben} />
      )}
      {bolum === "arsiv" && <Arsiv ben={ben} />}
      {paylasAcik && <PaylasimPenceresi ben={ben} kapat={() => setPaylasAcik(false)} />}
      {kaynakAcik && (
        <KaynakPenceresi
          ben={ben}
          hatalar={hatalar}
          kapat={() => setKaynakAcik(false)}
        />
      )}
    </div>
  );
}

/* --- Parçalar --- */

/* Tam yönetici gündemi birimle (alt birimleriyle) ya da kişiyle paylaşır; seçim hemen kaydedilir. */
function PaylasimPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const p = v.gundemPaylasim ?? { birimler: [], kisiler: [] };
  const [ara, setAra] = useState("");
  const yaz = (birimler: string[], kisiler: string[]) => gundemPaylasimKaydet(ben, birimler as typeof p.birimler, kisiler);
  const adaylar = v.kisiler
    .filter((k) => !k.pasif && !k.hesapYoneticisi && !kisitliKisi(k))
    .filter((k) => !ara.trim() || `${ad(k)} ${k.ad}`.toLowerCase().includes(ara.trim().toLowerCase()))
    .sort((a, b) => Number(p.kisiler.includes(b.id)) - Number(p.kisiler.includes(a.id)));
  return (
    <Pencere baslik={t("gdPaylas")} kapat={kapat}>
      <h3>{t("gdPaylasBirimler")}</h3>
      <div className="yetki-listesi" data-gundem-paylas-birimler>
        {kisiBirimleri().filter((b) => b !== "muhabir").map((b) => (
          <label key={b} className="secim">
            <input
              type="checkbox"
              checked={p.birimler.includes(b)}
              onChange={(e) => yaz(e.target.checked ? [...p.birimler, b] : p.birimler.filter((x) => x !== b), p.kisiler)}
              data-birim={b}
            />
            {birimAdi(b)}
          </label>
        ))}
      </div>
      <h3>{t("gdPaylasKisiler")}</h3>
      <input className="girdi" value={ara} onChange={(e) => setAra(e.target.value)} placeholder={t("ara")} aria-label={t("ara")} />
      <div className="yetki-listesi" data-gundem-paylas-kisiler>
        {adaylar.map((k) => (
          <label key={k.id} className="secim">
            <input
              type="checkbox"
              checked={p.kisiler.includes(k.id)}
              onChange={(e) => yaz(p.birimler, e.target.checked ? [...p.kisiler, k.id] : p.kisiler.filter((x) => x !== k.id))}
              data-kisi={k.id}
            />
            {ad(k)} · {birimAdi(k.birim)}
          </label>
        ))}
      </div>
    </Pencere>
  );
}

function SeviyeRozeti({ skor }: { skor: number }) {
  const { t } = useDil();
  const s = seviye(skor);
  return (
    <span data-seviye={s}>
      <Rozet ton={SEVIYE_TONU[s]}>{t(SEVIYE_ADI[s])}</Rozet>
    </span>
  );
}


/* Haber metni akışın dilinde: Arapça başlık sağdan, İngilizce soldan; yön metinden. */
const Metin = ({ children }: { children: ReactNode }) => (
  <span dir="auto">{children}</span>
);

function OlaySatiri({
  o,
  ben,
  kisa = false,
  etiketSec,
}: {
  o: Olay;
  ben: Kisi;
  kisa?: boolean;
  /** Akışta etikete basınca süzgece eklenir. */
  etiketSec?: (e: string) => void;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [ac, setAc] = useState(false);
  const [arsiv, setArsiv] = useState(false);
  const kayitli = (v.gundemArsivi ?? []).some(
    (n) =>
      n.kisiId === ben.id && o.haberler.some((h) => h.baglanti === n.baglanti),
  );
  const z = new Date(o.son);
  return (
    <li className="gundem-olay" data-olay={o.id} data-agirlik={o.agirlik}>
      <div className="gundem-olay-ust">
        <a
          href={o.haberler[0].baglanti}
          target="_blank"
          rel="noopener noreferrer"
          className="gundem-olay-baslik"
        >
          <Metin>{o.baslik}</Metin>
        </a>
        <button
          className="dugme dugme-sade dugme-ikon"
          onClick={() => setArsiv(true)}
          title={t("gdArsiveEkle")}
          aria-label={t("gdArsiveEkle")}
          data-arsive-ekle
        >
          {kayitli ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
      <div className="gundem-olay-alt">
        <span>
          {saatYaz(z.toISOString(), dil)} ·{" "}
          {/* Bu yılın değilse yıl da yazılıyor: eski haber bugünkü sanılmasın. */}
          {tarihYaz(
            z.toISOString().slice(0, 10),
            dil,
            z.getFullYear() === new Date().getFullYear() ? "kisa" : "uzun",
          )}
        </span>
        <button
          className="dugme-metin"
          onClick={() => setAc(!ac)}
          aria-expanded={ac}
          data-olay-kaynaklar
        >
          {t("gdKaynakSayisi").replace("{n}", String(o.kaynaklar.length))}
        </button>
        {!kisa &&
          olayEtiketleri(o).map((e) => {
            const ad = etiketAdi(e);
            if (!ad) return null;
            return etiketSec ? (
              <button key={e} className={`cip cip-dugme${e.startsWith("bag:") ? " cip-vurgu" : ""}`} onClick={() => etiketSec(e)} data-olay-etiket={e}>
                {t(ad)}
              </button>
            ) : (
              <span key={e} className={`cip${e.startsWith("bag:") ? " cip-vurgu" : ""}`} data-olay-etiket={e}>
                {t(ad)}
              </span>
            );
          })}
      </div>
      {ac && (
        <ul className="gundem-kaynak-listesi">
          {o.haberler.map((h) => (
            <li key={h.baglanti}>
              <a href={h.baglanti} target="_blank" rel="noopener noreferrer">
                <b>{h.kaynak}</b> · <Metin>{h.baslik}</Metin>{" "}
                <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      )}
      {arsiv && (
        <ArsivPenceresi o={o} ben={ben} kapat={() => setArsiv(false)} />
      )}
    </li>
  );
}

function OlayListesi({
  olaylar,
  ben,
  bos,
  veri,
  enCok = 30,
}: {
  olaylar: Olay[];
  ben: Kisi;
  bos: string;
  veri: string;
  enCok?: number;
}) {
  const [hepsi, setHepsi] = useState(false);
  const { t } = useDil();
  if (!olaylar.length) return <Bos kucuk metin={bos} />;
  const liste = hepsi ? olaylar : olaylar.slice(0, enCok);
  return (
    <>
      <ul className="gundem-olaylar" data-olay-listesi={veri}>
        {liste.map((o) => (
          <OlaySatiri key={o.id} o={o} ben={ben} />
        ))}
      </ul>
      {olaylar.length > liste.length && (
        <button
          className="dugme dugme-sade dugme-kucuk"
          onClick={() => setHepsi(true)}
        >
          {t("gdHepsi")} ({olaylar.length})
        </button>
      )}
    </>
  );
}

/* --- Bölümler --- */



function BrifingKonusu({ s, ben }: { s: BrifingSatiri; ben: Kisi }) {
  const { t, dil } = useDil();
  return (
    <div
      className={`gundem-brifing-konu sev-${seviye(s.skor)}`}
      data-brifing-konu={s.konu.id}
    >
      <h4>
        {t(s.konu.ad)} <SeviyeRozeti skor={s.skor} />
      </h4>
      <div className="gundem-brifing-sutunlar">
        <div>
          <h5>{t("gdSon24")}</h5>
          {s.olaylar.length ? (
            <ul className="gundem-olaylar">
              {s.olaylar.map((o) => (
                <OlaySatiri key={o.id} o={o} ben={ben} kisa />
              ))}
            </ul>
          ) : (
            <p className="sonuk-yazi" data-degisiklik-yok>
              {t("gdDegisiklikYok")}
            </p>
          )}
        </div>
        <div>
          <h5>{t("gdIzlenecek")}</h5>
          {!s.izlenecek.length && !s.etkinlikler.length && (
            <p className="sonuk-yazi">—</p>
          )}
          <ul className="gundem-izlenecek">
            {s.izlenecek.map((o) => (
              <li key={o.id}>
                <Metin>{o.baslik}</Metin>
              </li>
            ))}
            {s.etkinlikler.map((x) => (
              <li key={x.anahtar}>
                <a href={`#/takvim/faaliyet/${x.f.id}`}>
                  {tarihYaz(x.bas, dil)} · <Icerik>{x.f.baslik}</Icerik>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Brifing({
  olaylar,
  simdi,
  ben,
}: {
  olaylar: Olay[];
  simdi: number;
  ben: Kisi;
}) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const a = BRIFING_A.map((k) => brifingSatiri(v, olaylar, k, simdi, B));
  const b = BRIFING_B.map((k) => brifingSatiri(v, olaylar, k, simdi, B));
  // Hareketli konular önde; sakin olan sırasını korur, sonda "değişiklik yok" der.
  const sirala = (l: BrifingSatiri[]) =>
    [...l].sort(
      (x, y) => (y.skor > 0 ? 1 : 0) - (x.skor > 0 ? 1 : 0) || y.skor - x.skor,
    );
  const c = capraz(olaylar, simdi);
  const f = firsatlar(v, olaylar, simdi);
  return (
    <div className="gundem-brifing" data-brifing>
      <section className="kart">
        <h3>A · {t("gdBrifA")}</h3>
        {sirala(a).map((s) => (
          <BrifingKonusu key={s.konu.id} s={s} ben={ben} />
        ))}
      </section>
      <section className="kart">
        <h3>B · {t("gdBrifB")}</h3>
        {sirala(b).map((s) => (
          <BrifingKonusu key={s.konu.id} s={s} ben={ben} />
        ))}
      </section>
      <section className="kart" data-brifing-c>
        <h3>C · {t("gdBrifC")}</h3>
        {!c.length && <p className="sonuk-yazi">{t("gdDegisiklikYok")}</p>}
        {c.map(({ bag, olaylar: l }) => (
          <div key={bag.id} className="gundem-brifing-konu">
            <h4>{t(bag.ad)}</h4>
            <ul className="gundem-olaylar">
              {l.slice(0, 3).map((o) => (
                <OlaySatiri key={o.id} o={o} ben={ben} />
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="kart" data-brifing-d>
        <h3>D · {t("gdBrifD")}</h3>
        <FirsatSatirlari liste={f.slice(0, 8)} ben={ben} />
      </section>
    </div>
  );
}


/*
 * Haber akışı: en yenisi üstte, etiketle süzülür. Seçim bu oturumda; takip
 * edilen etiketler tarayıcıda kalır, "Takip ettiklerim" açıkken akış onlarla
 * süzülür. Etikete yıldızla takibe alınır.
 */
function Akis({ olaylar, simdi, ben }: { olaylar: Olay[]; simdi: number; ben: Kisi }) {
  const { t } = useDil();
  const [takip, setTakip] = useState<string[]>(takipEtiketleri);
  const [secili, setSecili] = useState<string[]>([]);
  const [yalnizTakip, setYalnizTakipDurum] = useState(yalnizTakipOku);
  const setYalnizTakip = (a: boolean) => {
    setYalnizTakipDurum(a);
    yalnizTakipYaz(a);
  };
  // Telefonda çubuk kapalı gelir: bütün etiketler ekranı kaplıyor, ilk ekranda haber görünmüyordu.
  const [tumu, setTumu] = useState(() => !matchMedia("(max-width: 760px)").matches);
  const [hepsi, setHepsi] = useState(false);
  const sayilar = useMemo(() => etiketSayilari(olaylar, simdi), [olaylar, simdi]);
  // Takip açıkken seçilen etiket takip ettiklerinin içinde daraltır; ikisi birbirini ezmez.
  const takipAcik = yalnizTakip && takip.length > 0;
  const liste = akisOlaylari(takipAcik ? akisOlaylari(olaylar, takip) : olaylar, secili);
  const degistir = (e: string) => setSecili((l) => (l.includes(e) ? l.filter((x) => x !== e) : [...l, e]));
  const takibeAl = (e: string) => {
    const yeni = takip.includes(e) ? takip.filter((x) => x !== e) : [...takip, e];
    // İlk yıldızda anahtar da açılır: yoksa yıldız işe yaramıyor sanılıyordu.
    if (!takip.length && yeni.length) setYalnizTakip(true);
    setTakip(yeni);
    takipEtiketleriniYaz(yeni);
  };
  // Çubukta yalnız akışta geçen ya da takip edilen etiketler; boş etiket kalabalık etmesin.
  const gorunen = BUTUN_ETIKETLER.filter((e) => (tumu ? sayilar[e] : false) || takip.includes(e) || secili.includes(e));
  const kapaliSayi = BUTUN_ETIKETLER.filter((e) => sayilar[e]).length;
  return (
    <div className="gundem-akis" data-gundem-akis>
      <section className="kart gundem-etiketler">
        <div className="gundem-etiket-ust">
          <label className="kontrol-kutu">
            <input type="checkbox" checked={takipAcik} onChange={(e) => setYalnizTakip(e.target.checked)} disabled={!takip.length} data-yalniz-takip />
            {t("gdTakipEttiklerim")} ({takip.length})
          </label>
          <button className="dugme dugme-sade dugme-kucuk" onClick={() => setTumu(!tumu)} aria-expanded={tumu} data-tum-etiketler>
            {t(tumu ? "gdEtiketleriKapat" : "gdTumEtiketler")} ({kapaliSayi})
          </button>
          {secili.length > 0 && (
            <button className="dugme dugme-sade dugme-kucuk" onClick={() => setSecili([])} data-secimi-temizle>
              {t("gdSecimiTemizle")}
            </button>
          )}
        </div>
        <div className="gundem-altlar">
          {gorunen.map((e) => {
            const ad = etiketAdi(e);
            if (!ad) return null;
            const s = secili.includes(e);
            const tk = takip.includes(e);
            return (
              <span key={e} className={`gundem-etiket${s ? " secili" : ""}${e.startsWith("bag:") ? " bag" : ""}${e.includes(":") && !e.startsWith("bag:") ? " alt" : ""}`} data-etiket={e}>
                <button className="gundem-etiket-ad" aria-pressed={s} onClick={() => degistir(e)}>
                  {t(ad)} <em>{sayilar[e] ?? 0}</em>
                </button>
                <button className="gundem-etiket-takip" aria-pressed={tk} onClick={() => takibeAl(e)} title={t(tk ? "gdTakiptenCikar" : "gdTakibeAl")} aria-label={t(tk ? "gdTakiptenCikar" : "gdTakibeAl")} data-etiket-takip>
                  {tk ? <Star size={13} fill="currentColor" /> : <Star size={13} />}
                </button>
              </span>
            );
          })}
        </div>
      </section>
      <section className="kart">
        {!liste.length && <Bos kucuk metin={t("gdAkisBos")} />}
        <ul className="gundem-olaylar" data-olay-listesi="akis">
          {(hepsi ? liste : liste.slice(0, 60)).map((o) => (
            <OlaySatiri key={o.id} o={o} ben={ben} etiketSec={degistir} />
          ))}
        </ul>
        {!hepsi && liste.length > 60 && (
          <button className="dugme dugme-sade dugme-kucuk" onClick={() => setHepsi(true)}>
            {t("gdHepsi")} ({liste.length})
          </button>
        )}
      </section>
    </div>
  );
}

function Etkinlikler({
  olaylar,
  simdi,
  ben,
}: {
  olaylar: Olay[];
  simdi: number;
  ben: Kisi;
}) {
  const { t, dil } = useDil();
  const v = useVeri();
  const takvim = yaklasanlar(v.faaliyetler, 14, bugun());
  return (
    <div className="gundem-izgara">
      <section className="kart gundem-konu">
        <header className="gundem-konu-ust">
          <h3>{t("gdTakvimden")}</h3>
        </header>
        {!takvim.length && <Bos kucuk metin={t("kayitYok")} />}
        <ul className="gundem-izlenecek" data-etkinlik-takvim>
          {takvim.map((x) => (
            <li key={x.anahtar}>
              <a href={`#/takvim/faaliyet/${x.f.id}`}>
                {tarihYaz(x.bas, dil)} · <Icerik>{x.f.baslik}</Icerik>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="kart gundem-konu">
        <header className="gundem-konu-ust">
          <h3>{t("gdHaberlerden")}</h3>
        </header>
        <OlayListesi
          olaylar={ileriOlaylar(olaylar, simdi)}
          ben={ben}
          bos={t("kayitYok")}
          veri="ileri"
          enCok={15}
        />
      </section>
    </div>
  );
}

/* --- Editoryal fırsatlar --- */

function FirsatSatirlari({ liste, ben }: { liste: Firsat[]; ben: Kisi }) {
  const { t, ad } = useDil();
  const [cevir, setCevir] = useState<Firsat | null>(null);
  if (!liste.length)
    return <p className="sonuk-yazi">{t("gdDegisiklikYok")}</p>;
  return (
    <>
      <ul className="gundem-firsatlar">
        {liste.map((f, i) => (
          <li key={`${f.tur}-${f.olay.id}-${i}`} data-firsat={f.tur}>
            <Lightbulb size={16} />
            <div>
              <b>{t(FIRSAT_ADI[f.tur])}</b> · {t(f.konu.ad)}
              <div>
                <Metin>{f.olay.baslik}</Metin>
              </div>
              {f.muhabirler && (
                <div className="sonuk-yazi">
                  {f.muhabirler.map((k) => ad(k)).join("، ")}
                </div>
              )}
            </div>
            <button
              className="dugme dugme-ikincil dugme-kucuk"
              onClick={() => setCevir(f)}
              data-oneriye-cevir
            >
              {t("gdOneriyeCevir")}
            </button>
          </li>
        ))}
      </ul>
      {cevir && (
        <OneriyeCevir f={cevir} ben={ben} kapat={() => setCevir(null)} />
      )}
    </>
  );
}

function Firsatlar({ liste, ben }: { liste: Firsat[]; ben: Kisi }) {
  const { t } = useDil();
  if (!liste.length) return <Bos metin={t("gdDegisiklikYok")} />;
  const turler = [...new Set(liste.map((f) => f.tur))];
  return (
    <div className="gundem-izgara">
      {turler.map((tur) => (
        <section key={tur} className="kart gundem-konu">
          <header className="gundem-konu-ust">
            <h3>{t(FIRSAT_ADI[tur])}</h3>
          </header>
          <FirsatSatirlari
            liste={liste.filter((f) => f.tur === tur)}
            ben={ben}
          />
        </section>
      ))}
    </div>
  );
}

/* Fırsat bizim öneri akışına muhabir dışı kaynak (medya) olarak girer; Header Arapça yazılır. */
function OneriyeCevir({
  f,
  ben,
  kapat,
}: {
  f: Firsat;
  ben: Kisi;
  kapat: () => void;
}) {
  const { t } = useDil();
  const ar = /[؀-ۿ]/.test(f.olay.baslik);
  const [g, setG] = useState({
    haberBasligi: ar ? f.olay.baslik : "",
    gelisme: ar ? (f.olay.haberler[0].ozet ?? "") : "",
    ulke: (f.konu.ulkeler[0] ?? "turkiye") as Ulke,
    hedefTarih: bugun(),
  });
  const gonder = () => {
    const id = oneriGonder(ben, {
      kaynakTuru: "medya",
      kaynakAdi: f.olay.kaynaklar.join("، "),
      ulke: g.ulke,
      haberBasligi: g.haberBasligi.trim(),
      gelisme: g.gelisme.trim() || g.haberBasligi.trim(),
      tur: "haber",
      sahaGerekli: f.tur === "saha",
      kanal: "sistem",
      hedefTarih: g.hedefTarih,
    });
    if (!id) return bildir(t("gdOneriOlmadi"));
    kapat();
    bildir(t("gdOneriOldu"), { ad: t("ac"), f: () => git(`oneriler/${id}`) });
  };
  return (
    <Pencere
      baslik={t("gdOneriyeCevir")}
      alt={<Metin>{f.olay.baslik}</Metin>}
      kapat={kapat}
      altBilgi={
        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button
            className="dugme"
            onClick={gonder}
            disabled={!g.haberBasligi.trim()}
            data-cevir-gonder
          >
            {t("gonder")}
          </button>
        </div>
      }
    >
      <div className="form">
        <label>
          Header
          <input
            {...icerikAlani}
            value={g.haberBasligi}
            onChange={(e) => setG({ ...g, haberBasligi: e.target.value })}
            placeholder="العنوان الإخباري"
            data-cevir-header
          />
        </label>
        <label>
          {t("gelismeMetni")}
          <textarea
            rows={3}
            {...icerikAlani}
            value={g.gelisme}
            onChange={(e) => setG({ ...g, gelisme: e.target.value })}
          />
        </label>
        <div className="satir">
          <label>
            {t("ulke")}
            <select
              value={g.ulke}
              onChange={(e) => setG({ ...g, ulke: e.target.value as Ulke })}
            >
              {ULKELER.map((u) => (
                <option key={u} value={u}>
                  {t(ulkeAdi(u))}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("tarih")}
            <input
              type="date"
              value={g.hedefTarih}
              min={gunEkle(bugun(), -1)}
              onChange={(e) => setG({ ...g, hedefTarih: e.target.value })}
            />
          </label>
        </div>
      </div>
    </Pencere>
  );
}

/* --- Kişisel araştırma arşivi --- */

function ArsivPenceresi({
  o,
  ben,
  kapat,
}: {
  o: Olay;
  ben: Kisi;
  kapat: () => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const eski = (v.gundemArsivi ?? []).find(
    (n) =>
      n.kisiId === ben.id && o.haberler.some((h) => h.baglanti === n.baglanti),
  );
  const [not, setNot] = useState(eski?.not ?? "");
  const kaydet = () => {
    const h = o.haberler[0];
    if (
      gundemNotuKaydet(ben, {
        id: eski?.id,
        baslik: o.baslik,
        baglanti: eski?.baglanti ?? h.baglanti,
        kaynak: o.kaynaklar.join(", "),
        konular: o.konular,
        not,
        haberZamani: o.son,
      })
    )
      kapat();
  };
  return (
    <Pencere
      baslik={t("gdArsiveEkle")}
      alt={<Metin>{o.baslik}</Metin>}
      kapat={kapat}
      altBilgi={
        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme" onClick={kaydet} data-arsiv-kaydet>
            {t("kaydet")}
          </button>
        </div>
      }
    >
      <label className="form">
        {t("not")}
        <textarea
          rows={4}
          dir="auto"
          value={not}
          onChange={(e) => setNot(e.target.value)}
          data-arsiv-not
        />
      </label>
    </Pencere>
  );
}

function Arsiv({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [ara, setAra] = useState("");
  const liste = (v.gundemArsivi ?? [])
    .filter((n) => n.kisiId === ben.id)
    .filter(
      (n) =>
        !ara.trim() ||
        `${n.baslik} ${n.not} ${n.kaynak}`
          .toLowerCase()
          .includes(ara.trim().toLowerCase()),
    )
    .sort((a, b) => b.zaman.localeCompare(a.zaman));
  return (
    <section className="kart" data-gundem-arsiv>
      <div className="suzgec">
        <input
          className="girdi arama-kutu"
          type="search"
          dir="auto"
          value={ara}
          onChange={(e) => setAra(e.target.value)}
          placeholder={t("ara")}
          aria-label={t("ara")}
        />
      </div>
      {!liste.length && <Bos kucuk metin={t("kayitYok")} />}
      <ul className="gundem-olaylar">
        {liste.map((n) => (
          <li key={n.id} className="gundem-olay" data-arsiv-notu={n.id}>
            <div className="gundem-olay-ust">
              <a
                href={n.baglanti}
                target="_blank"
                rel="noopener noreferrer"
                className="gundem-olay-baslik"
              >
                <Metin>{n.baslik}</Metin>
              </a>
              <button
                className="dugme dugme-sade dugme-ikon"
                onClick={() => gundemNotuSil(ben, n.id)}
                title={t("sil")}
                aria-label={t("sil")}
                data-arsiv-sil
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="gundem-olay-alt">
              <span>{tarihYaz(n.zaman.slice(0, 10), dil)}</span>
              <span>{n.kaynak}</span>
              {n.konular.map(
                (k) =>
                  konuBul(k) && (
                    <span key={k} className="cip">
                      {t(konuBul(k)!.ad)}
                    </span>
                  ),
              )}
            </div>
            {n.not && (
              <p dir="auto" className="gundem-not">
                {n.not}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --- Kaynaklar --- */

function KaynakPenceresi({
  ben,
  hatalar,
  kapat,
}: {
  ben: Kisi;
  hatalar: Record<string, string>;
  kapat: () => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const [liste, setListe] = useState<GundemKaynagi[]>(() =>
    gundemKaynaklari(v),
  );
  const [yeni, setYeni] = useState({ ad: "", adres: "" });
  const [arama, setArama] = useState<{ sorgu: string; dil: "ar" | "en" }>({
    sorgu: "",
    dil: "ar",
  });
  const eksik = eksikVarsayilanlar(liste);
  const [kanal, setKanal] = useState("");
  const kanalAdresi = telegramAdresi(kanal);
  const kanalEkle = () => {
    if (!kanalAdresi || liste.some((k) => k.adres.toLowerCase() === kanalAdresi.toLowerCase())) return setKanal("");
    const ad = kanalAdresi.split("/").pop()!;
    setListe([...liste, { id: `gk-tg-${ad.toLowerCase()}-${Date.now().toString(36)}`, ad: `@${ad}`, adres: kanalAdresi, dil: "ar", tur: "telegram" }]);
    setKanal("");
  };
  const aramaEkle = () => {
    const sorgu = arama.sorgu.trim();
    if (!sorgu) return;
    setListe([
      ...liste,
      {
        id: `gk-ara-${Date.now().toString(36)}`,
        ad: `🔎 ${sorgu}`,
        adres: aramaAdresi(sorgu, arama.dil),
        dil: arama.dil,
        tur: "arama",
      },
    ]);
    setArama({ ...arama, sorgu: "" });
  };
  const degis = (id: string, d: Partial<GundemKaynagi>) =>
    setListe(liste.map((k) => (k.id === id ? { ...k, ...d } : k)));
  const ekle = () => {
    if (!yeni.ad.trim() || !/^https:\/\//.test(yeni.adres.trim())) return;
    setListe([
      ...liste,
      {
        id: `gk-${Date.now().toString(36)}`,
        ad: yeni.ad.trim(),
        adres: yeni.adres.trim(),
        dil: /[؀-ۿ]/.test(yeni.ad) ? "ar" : "en",
        tur: "yayin",
      },
    ]);
    setYeni({ ad: "", adres: "" });
  };
  const kaydet = () => {
    if (gundemKaynaklariKaydet(ben, liste)) kapat();
  };
  return (
    <Pencere
      baslik={t("gdKaynaklar")}
      kapat={kapat}
      genis
      altBilgi={
        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme" onClick={kaydet} data-kaynak-kaydet>
            {t("kaydet")}
          </button>
        </div>
      }
    >
      <ul className="gundem-kaynaklar" data-kaynak-listesi>
        {liste.map((k) => (
          <li key={k.id} className={k.kapali ? "soluk" : ""} data-kaynak={k.id}>
            <label className="kontrol-kutu">
              <input
                type="checkbox"
                checked={!k.kapali}
                onChange={(e) =>
                  degis(k.id, { kapali: !e.target.checked || undefined })
                }
              />
              <b>{k.ad}</b>
            </label>
            <span className="sonuk-yazi gundem-adres">{k.adres}</span>
            {hatalar[k.id] && <Rozet ton="kotu">{hatalar[k.id]}</Rozet>}
            <button
              className="dugme dugme-sade dugme-ikon"
              onClick={() => setListe(liste.filter((x) => x.id !== k.id))}
              title={t("sil")}
              aria-label={t("sil")}
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      <div className="satir gundem-kaynak-ekle">
        <input
          value={yeni.ad}
          onChange={(e) => setYeni({ ...yeni, ad: e.target.value })}
          placeholder={t("ad")}
          aria-label={t("ad")}
          data-kaynak-ad
        />
        <input
          value={yeni.adres}
          onChange={(e) => setYeni({ ...yeni, adres: e.target.value })}
          placeholder="https://…/rss"
          aria-label="RSS"
          dir="ltr"
          data-kaynak-adres
        />
        <button
          className="dugme dugme-ikincil"
          onClick={ekle}
          disabled={!yeni.ad.trim() || !/^https:\/\//.test(yeni.adres.trim())}
          data-kaynak-ekle
        >
          {t("ekle")}
        </button>
      </div>
      <div className="satir gundem-kaynak-ekle">
        <input
          value={arama.sorgu}
          onChange={(e) => setArama({ ...arama, sorgu: e.target.value })}
          dir="auto"
          placeholder={t("gdAramaYerTutucu")}
          aria-label={t("gdAramaEkle")}
          data-arama-sorgu
        />
        <select
          value={arama.dil}
          onChange={(e) =>
            setArama({ ...arama, dil: e.target.value as "ar" | "en" })
          }
          aria-label={t("gdAramaDili")}
          data-arama-dil
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
        <button
          className="dugme dugme-ikincil"
          onClick={aramaEkle}
          disabled={!arama.sorgu.trim()}
          data-arama-ekle
        >
          {t("gdAramaEkle")}
        </button>
      </div>
      <div className="satir gundem-kaynak-ekle">
        <input value={kanal} onChange={(e) => setKanal(e.target.value)} dir="ltr" placeholder="@kanal / t.me/kanal" aria-label={t("gdTelegramEkle")} data-telegram-kanal />
        <button className="dugme dugme-ikincil" onClick={kanalEkle} disabled={!kanalAdresi} data-telegram-ekle>
          {t("gdTelegramEkle")}
        </button>
      </div>
      {eksik.length > 0 && (
        <button
          className="dugme dugme-sade"
          onClick={() => setListe([...liste, ...eksik])}
          data-varsayilan-ekle
        >
          {t("gdVarsayilanEkle").replace("{n}", String(eksik.length))}
        </button>
      )}
    </Pencere>
  );
}
