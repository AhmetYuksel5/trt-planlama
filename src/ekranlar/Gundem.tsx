import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Lightbulb,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Settings,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
  gundemSepeteEkle,
  gundemSepettenCikar,
  oneriyeSatirlarEkle,
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
  normal,
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
import { GERCEK, useSunucuyaEsit } from "../kip";
import { izlemede } from "../izleme";
import { takvimAdaylariniTopla } from "../eylemler";
import { bugun, gunEkle, yerelGun } from "../tarih";
import { yaklasanlar } from "../takvim";
import {
  ULKELER,
  baslikBul,
  useVeri,
  type Durum,
  type GundemKaynagi,
  type Kisi,
  type Ulke,
} from "../veri";
import { git, yerineGit } from "../yol";
import { gundemAkislari, gundemMakale, type Makale } from "../yz";
import { acikGunPlanlari, oneriArsivde } from "../oneriPlanlari";
import { gundemGorebilir, kisitliKisi, oneriSatiriEkleyebilir } from "../yetki";
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
  // Takvim botu: taranan haberlerdeki ileri tarihli olaylar takvime aday (takvimBotu.ts). İzlemede yazış yok, gerçek kipte eşitlenince.
  const esit = useSunucuyaEsit();
  useEffect(() => {
    if (!izlemede() && (!GERCEK || esit)) takvimAdaylariniTopla(ben, haberler);
  }, [haberler, esit, ben]);
  const [kaynakAcik, setKaynakAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [sepetAcik, setSepetAcik] = useState(false);
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
      {(v.gundemSepetleri?.[ben.id]?.length ?? 0) > 0 && (
        <div className="gundem-sepet-cubugu">
          <button className="dugme" onClick={() => setSepetAcik(true)} data-sepet-ac>
            <ShoppingBasket size={16} /> {t("gdSepet")} · {v.gundemSepetleri![ben.id].length}
          </button>
        </div>
      )}
      {sepetAcik && <SepetPenceresi ben={ben} kapat={() => setSepetAcik(false)} />}
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
  const [oku, setOku] = useState(false);
  const [cevir, setCevir] = useState(false);
  const bizde = bizdeki(v, o);
  const kayitli = (v.gundemArsivi ?? []).some(
    (n) =>
      n.kisiId === ben.id && o.haberler.some((h) => h.baglanti === n.baglanti),
  );
  const z = new Date(o.son);
  return (
    <li className="gundem-olay" data-olay={o.id} data-agirlik={o.agirlik}>
      <div className="gundem-olay-ust">
        {/* Başlık okuma penceresini açar; siteye gitmek ↗'da. Önce yeni sekmede site açılıyor, editör gidip dönüyordu. */}
        <button className="gundem-olay-baslik" onClick={() => setOku(true)} data-olay-oku>
          <Metin>{o.baslik}</Metin>
        </button>
        <a
          className="dugme dugme-sade dugme-ikon"
          href={o.haberler[0].baglanti}
          target="_blank"
          rel="noopener noreferrer"
          title={t("gdSiteyeGit")}
          aria-label={t("gdSiteyeGit")}
        >
          <ExternalLink size={15} />
        </a>
        <button
          className="dugme dugme-sade dugme-ikon"
          onClick={() => setCevir(true)}
          title={t("gdOneriyeCevir")}
          aria-label={t("gdOneriyeCevir")}
          data-olay-cevir
        >
          <Lightbulb size={16} />
        </button>
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
        {bizde && (
          <span className="cip cip-vurgu" title={bizde.ad} data-bizde>
            {t("gdPlandaVar").replace("{tarih}", tarihYaz(bizde.tarih, dil, "kisa"))}
          </span>
        )}
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
      {oku && <OkumaPenceresi o={o} ben={ben} kapat={() => setOku(false)} />}
      {cevir && (
        <OneriyeCevir
          baslik={o.baslik}
          kaynaklar={o.kaynaklar}
          gelisme={o.haberler[0].ozet}
          ulkeler={olayUlkeleri(o)}
          ben={ben}
          kapat={() => setCevir(false)}
        />
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



/*
 * Brifing konusu ajans listesinde bir grup: konu adı ve seviyesi, son 24
 * saatin haber satırları (yoksa "değişiklik yok"), altında önümüzdeki
 * günlerde izlenecekler.
 */
function BrifingKonusu({ s, secik, sec }: { s: BrifingSatiri; secik?: Olay; sec: (o: Olay) => void }) {
  const { t, dil } = useDil();
  return (
    <li className={`gundem-ajans-konu sev-${seviye(s.skor)}`} data-brifing-konu={s.konu.id}>
      <div className="gundem-ajans-konu-bas">
        <b>{t(s.konu.ad)}</b> <SeviyeRozeti skor={s.skor} />
      </div>
      {s.olaylar.length ? (
        <ul className="gundem-ajans-alt-liste">
          {s.olaylar.map((o) => (
            <AjansSatiri key={o.id} o={o} secili={secik?.id === o.id} sec={sec} />
          ))}
        </ul>
      ) : (
        <p className="gundem-ajans-yok" data-degisiklik-yok>
          {t("gdDegisiklikYok")}
        </p>
      )}
      {(s.izlenecek.length > 0 || s.etkinlikler.length > 0) && (
        <div className="gundem-ajans-izlenecek">
          <small>{t("gdIzlenecek")}</small>
          <ul>
            {s.izlenecek.map((o) => (
              <li key={o.id}>
                <button className="dugme-metin" onClick={() => sec(o)} data-izlenecek>
                  <Metin>{o.baslik}</Metin>
                </button>
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
      )}
    </li>
  );
}

/*
 * Sabah brifingi ajans düzeninde (akışla aynı): solda A, B, C bölümleri ve
 * konu grupları, satıra basınca sağda okuyucu; D (editoryal fırsatlar) haber
 * değil öneri, altta kendi kartında.
 */
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
  const sa = sirala(a);
  const sb = sirala(b);
  const c = capraz(olaylar, simdi).map((x) => ({ ...x, olaylar: x.olaylar.slice(0, 3) }));
  const f = firsatlar(v, olaylar, simdi);
  // Ok tuşları ekrandaki sırayla gezsin: A, B, C'nin haberleri art arda (aynı olay iki konuda olabilir).
  const duz = [...new Map([...sa, ...sb].flatMap((x) => x.olaylar).concat(c.flatMap((x) => x.olaylar)).map((o) => [o.id, o])).values()];
  const sec = useAjansSecimi(duz, ben);
  return (
    <div className="gundem-brifing" data-brifing>
      <section className="kart gundem-ajans">
        <div className="gundem-ajans-bas">
          <span className="gundem-ajans-sayi">{t("gdHaberSayisi", { n: String(duz.length) })}</span>
        </div>
        <div className="gundem-ajans-ic">
          <ul className="gundem-ajans-liste" onKeyDown={sec.tus} data-brifing-liste>
            <li className="gundem-ajans-bolum">A · {t("gdBrifA")}</li>
            {sa.map((s) => (
              <BrifingKonusu key={s.konu.id} s={s} secik={sec.secik} sec={sec.sec} />
            ))}
            <li className="gundem-ajans-bolum">B · {t("gdBrifB")}</li>
            {sb.map((s) => (
              <BrifingKonusu key={s.konu.id} s={s} secik={sec.secik} sec={sec.sec} />
            ))}
            <li className="gundem-ajans-bolum">C · {t("gdBrifC")}</li>
            <li data-brifing-c>
              {!c.length && <p className="gundem-ajans-yok">{t("gdDegisiklikYok")}</p>}
              <ul className="gundem-ajans-alt-liste">
                {c.map(({ bag, olaylar: l }) => (
                  <li key={bag.id} className="gundem-ajans-konu">
                    <div className="gundem-ajans-konu-bas">
                      <b>{t(bag.ad)}</b>
                    </div>
                    <ul className="gundem-ajans-alt-liste">
                      {l.map((o) => (
                        <AjansSatiri key={o.id} o={o} secili={sec.secik?.id === o.id} sec={sec.sec} />
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
          {sec.okuyucu}
        </div>
        {sec.pencere}
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
      <AkisIkili liste={liste} ben={ben} etiketSec={degistir} />
    </div>
  );
}

const SAYFA = 50;
/* İki sütun yalnız geniş ekranda; dar ekranda (tablet, telefon) haber pencerede okunur. */
const GENIS = "(min-width: 1100px)";
const useGenis = () => {
  const [g, setG] = useState(() => matchMedia(GENIS).matches);
  useEffect(() => {
    const m = matchMedia(GENIS);
    const f = () => setG(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return g;
};

/* Ajans satırı (akış ve brifing): saat ve tarih, başlık, kaynak sayısı, "planda var", etiketler. */
function AjansSatiri({ o, secili, sec, etiketSec }: { o: Olay; secili: boolean; sec: (o: Olay) => void; etiketSec?: (e: string) => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const z = new Date(o.son);
  const bizde = bizdeki(v, o);
  return (
    <li className={`gundem-ajans-satir${secili ? " secili" : ""}${o.agirlik >= 12 ? " agir" : ""}`} data-olay={o.id} data-agirlik={o.agirlik}>
      <span className="gundem-ajans-zaman" data-olay-zaman>
        <b>{saatYaz(z.toISOString(), dil)}</b>
        {/* Bu yılın değilse yıl da yazılıyor: eski haber bugünkü sanılmasın. */}
        <small>{tarihYaz(z.toISOString().slice(0, 10), dil, z.getFullYear() === new Date().getFullYear() ? "kisa" : "uzun")}</small>
      </span>
      <span className="gundem-ajans-govde">
        <button className="gundem-ajans-baslik" onClick={() => sec(o)} aria-current={secili} data-olay-oku>
          <Metin>{o.baslik}</Metin>
        </button>
        <span className="gundem-ajans-alt">
          <span data-olay-kaynaklar>{t("gdKaynakSayisi").replace("{n}", String(o.kaynaklar.length))}</span>
          {bizde && (
            <span className="cip cip-vurgu" title={bizde.ad} data-bizde>
              {t("gdPlandaVar").replace("{tarih}", tarihYaz(bizde.tarih, dil, "kisa"))}
            </span>
          )}
          {olayEtiketleri(o).map((e) => {
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
        </span>
      </span>
    </li>
  );
}

/*
 * Seçim (akış ve brifing): geniş ekranda seçilen haber sağdaki okuyucuda,
 * darda pencerede. Ok tuşları listedeki sırayla (`duz`) gezer.
 */
function useAjansSecimi(duz: Olay[], ben: Kisi) {
  const genis = useGenis();
  // Seçilen olayın kendisi tutuluyor: brifingin "izlenecek"leri ok tuşu sırasında (duz) yok.
  const [secili, setSecili] = useState<Olay | null>(null);
  const [pencere, setPencere] = useState<Olay | null>(null);
  const secik = (secili && (duz.find((o) => o.id === secili.id) ?? secili)) || (genis ? duz[0] : undefined);
  const sec = (o: Olay) => (genis ? setSecili(o) : setPencere(o));
  const tus = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const k = duz.findIndex((o) => o.id === secik?.id);
    const y = duz[Math.max(0, Math.min(duz.length - 1, k + (e.key === "ArrowDown" ? 1 : -1)))];
    if (!y) return;
    e.preventDefault();
    setSecili(y);
    document.querySelector<HTMLElement>(`[data-olay="${CSS.escape(y.id)}"] [data-olay-oku]`)?.focus();
  };
  const okuyucu =
    genis && secik ? (
      <div className="gundem-ajans-okuyucu" data-okuma-alani>
        <OkumaIcerik key={secik.id} o={secik} ben={ben} bant />
      </div>
    ) : null;
  return { secik, sec, tus, okuyucu, pencere: pencere && <OkumaPenceresi o={pencere} ben={ben} kapat={() => setPencere(null)} /> };
}

/*
 * Haber akışı ajans ekranı gibi (kullanıcının gösterdiği AFP Forum): solda
 * saatli liste, seçili haber vurgulu; sağda okuyucu (başlık bandı, etiketler,
 * kaynak · tarih · kelime, metin). Sayfa sayfa; ok tuşlarıyla haberler arası.
 * Ağır olay (çok kaynak, ağır sözcük) başlığı kırmızı, ajansın "URGENT"i gibi.
 */
function AkisIkili({ liste, ben, etiketSec }: { liste: Olay[]; ben: Kisi; etiketSec: (e: string) => void }) {
  const { t } = useDil();
  const [sayfa, setSayfa] = useState(0);
  const sayfaSayisi = Math.max(1, Math.ceil(liste.length / SAYFA));
  const s = Math.min(sayfa, sayfaSayisi - 1);
  const gorunen = liste.slice(s * SAYFA, (s + 1) * SAYFA);
  const a = useAjansSecimi(gorunen, ben);
  return (
    <section className="kart gundem-ajans" data-gundem-ajans>
      <div className="gundem-ajans-bas">
        <span className="gundem-ajans-sayi" data-akis-sayi>
          {t("gdHaberSayisi", { n: String(liste.length) })}
        </span>
        {sayfaSayisi > 1 && (
          <span className="gundem-ajans-sayfa">
            <button className="dugme dugme-sade dugme-ikon" disabled={s === 0} onClick={() => setSayfa(s - 1)} aria-label={t("gdOncekiSayfa")} title={t("gdOncekiSayfa")}>
              <ChevronLeft size={16} className="yon" />
            </button>
            <span dir="ltr">
              {s + 1} / {sayfaSayisi}
            </span>
            <button className="dugme dugme-sade dugme-ikon" disabled={s >= sayfaSayisi - 1} onClick={() => setSayfa(s + 1)} aria-label={t("gdSonrakiSayfa")} title={t("gdSonrakiSayfa")} data-sonraki-sayfa>
              <ChevronRight size={16} className="yon" />
            </button>
          </span>
        )}
      </div>
      {!liste.length && <Bos kucuk metin={t("gdAkisBos")} />}
      <div className="gundem-ajans-ic">
        <ul className="gundem-ajans-liste" data-olay-listesi="akis" onKeyDown={a.tus}>
          {gorunen.map((o) => (
            <AjansSatiri key={o.id} o={o} secili={a.secik?.id === o.id} sec={a.sec} etiketSec={etiketSec} />
          ))}
        </ul>
        {a.okuyucu}
      </div>
      {a.pencere}
    </section>
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
        <OneriyeCevir
          baslik={cevir.olay.baslik}
          kaynaklar={cevir.olay.kaynaklar}
          gelisme={cevir.olay.haberler[0].ozet}
          ulkeler={cevir.konu.ulkeler}
          saha={cevir.tur === "saha"}
          ben={ben}
          kapat={() => setCevir(null)}
        />
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
/*
 * Fırsat, haber satırı, okuma penceresi ve sepet aynı formu açıyor. Header Arapça
 * başlıktan; İngilizce başlık Header'a yazılmıyor (içerik Arapça). Sepetten gelen
 * gelişme parçaların kendisi, Arapça değilse de: editör çevirip kısaltıyor.
 */
function OneriyeCevir({
  baslik,
  kaynaklar,
  gelisme,
  ulkeler = [],
  saha = false,
  ben,
  kapat,
  gonderildi,
}: {
  baslik: string;
  kaynaklar: string[];
  gelisme?: string;
  ulkeler?: Ulke[];
  saha?: boolean;
  ben: Kisi;
  kapat: () => void;
  gonderildi?: () => void;
}) {
  const { t } = useDil();
  const ar = /[؀-ۿ]/.test(baslik);
  const [g, setG] = useState({
    haberBasligi: ar ? baslik : "",
    gelisme: gelisme ?? "",
    ulke: (ulkeler[0] ?? "turkiye") as Ulke,
    hedefTarih: bugun(),
  });
  const gonder = () => {
    const id = oneriGonder(ben, {
      kaynakTuru: "medya",
      kaynakAdi: [...new Set(kaynaklar)].join("، "),
      ulke: g.ulke,
      haberBasligi: g.haberBasligi.trim(),
      gelisme: g.gelisme.trim() || g.haberBasligi.trim(),
      tur: "haber",
      sahaGerekli: saha,
      kanal: "sistem",
      hedefTarih: g.hedefTarih,
    });
    if (!id) return bildir(t("gdOneriOlmadi"));
    gonderildi?.();
    kapat();
    bildir(t("gdOneriOldu"), { ad: t("ac"), f: () => git(`oneriler/${id}`) });
  };
  return (
    <Pencere
      baslik={t("gdOneriyeCevir")}
      alt={<Metin>{baslik}</Metin>}
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

/* --- Okuma penceresi ve sepet --- */

/*
 * Planda bu olaya benzeyen başlık (adı ve gelişmeleri, en az iki ortak anlamlı sözcük):
 * aynı konu ikinci kez önerilmesin diye satırda durum rozeti. Kayıt başına bir kez kurulur.
 */
const anlamli = (s: string) => new Set(normal(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4));
const bizdeOnbellek = new WeakMap<Durum, { tarih: string; ad: string; sozler: Set<string> }[]>();
function bizdeki(v: Durum, o: Olay): { tarih: string; ad: string } | null {
  let liste = bizdeOnbellek.get(v);
  if (!liste) {
    liste = acikGunPlanlari(v).flatMap((p) =>
      p.basliklar.map((b) => {
        const ad = baslikBul(v, b.baslikId)?.ad ?? "";
        const metin = [ad, ...v.gelismeler.filter((g) => g.planId === p.id && g.planBaslikId === b.id).map((g) => g.metin)].join(" ");
        return { tarih: p.tarih, ad, sozler: anlamli(metin) };
      }),
    );
    bizdeOnbellek.set(v, liste);
  }
  const ow = anlamli(o.baslik);
  if (ow.size < 2) return null;
  for (const x of liste) {
    let n = 0;
    for (const w of ow) if (x.sozler.has(w) && ++n >= 2) return { tarih: x.tarih, ad: x.ad };
  }
  return null;
}

const olayUlkeleri = (o: Olay): Ulke[] => o.konular.flatMap((k) => konuBul(k)?.ulkeler ?? []);

/*
 * Haberin tam metni sayfanın içinde: kapı siteyi okuyup paragraflara ayırıyor. Paragrafın
 * "+"sı ya da seçilen metin sepete gider. Okunamayan sitede (ücretli, bot korumalı) özet
 * kalır, ↗ siteyi açar. Telegram'da mesajın tamamı zaten akışta; demoda kapıya gidilmez.
 */
function OkumaIcerik({ o, ben, bant = false }: { o: Olay; ben: Kisi; bant?: boolean }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [i, setI] = useState(0);
  const h = o.haberler[Math.min(i, o.haberler.length - 1)];
  const [durum, setDurum] = useState<{ adres: string; makale?: Makale; hata?: string } | null>(null);
  const [not, setNot] = useState(false);
  const [cevir, setCevir] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const yerel = (): Makale => ({ adres: h.baglanti, site: h.kaynak, baslik: h.baslik, paragraflar: [h.baslik, h.ozet ?? ""].filter((x, j, l) => x && l.indexOf(x) === j) });
    if (!GERCEK || /^https:\/\/t\.me\//.test(h.baglanti)) {
      setDurum({ adres: h.baglanti, makale: yerel() });
      return;
    }
    let iptal = false;
    setDurum(null);
    void gundemMakale(h.baglanti).then((r) => {
      if (!iptal) setDurum(r.tamam ? { adres: h.baglanti, makale: r.veri.makale } : { adres: h.baglanti, hata: r.hata });
    });
    return () => {
      iptal = true;
    };
  }, [h.baglanti]);
  const paragraflar = durum?.makale?.paragraflar ?? (durum?.hata ? [h.ozet || h.baslik] : []);
  // Bant başlığın kendisi; paragrafların ilki başlığın tekrarıysa ikinci kez yazılmasın.
  const govde = bant && paragraflar.length > 1 && paragraflar[0] === h.baslik ? paragraflar.slice(1) : paragraflar;
  const kelime = paragraflar.join(" ").split(/\s+/).filter(Boolean).length;
  const ekle = (metin: string) => {
    if (!metin.trim()) return;
    if (gundemSepeteEkle(ben, { metin, baslik: o.baslik, kaynak: h.kaynak, baglanti: h.baglanti })) bildir(t("gdSepeteEklendi"));
  };
  const secimiEkle = () => {
    const s = window.getSelection();
    if (s && kutu.current && s.anchorNode && kutu.current.contains(s.anchorNode)) ekle(s.toString());
    else bildir(t("gdSecimYok"));
  };
  const bizde = bizdeki(v, o);
  const kayitli = (v.gundemArsivi ?? []).some((n) => n.kisiId === ben.id && o.haberler.some((x) => x.baglanti === n.baglanti));
  const z = new Date(h.zaman || o.son);
  const etiketler = olayEtiketleri(o).map((e) => etiketAdi(e)).filter((a): a is Anahtar => !!a);
  return (
    <div className="gundem-okuyucu" data-okuyucu>
      {/* Araçlar üstte: siteye git, arşiv, öneriye çevir, seçimi sepete. */}
      <div className="gundem-okuyucu-araclar">
        <a className="dugme dugme-sade dugme-ikon" href={h.baglanti} target="_blank" rel="noopener noreferrer" title={t("gdSiteyeGit")} aria-label={t("gdSiteyeGit")}>
          <ExternalLink size={16} />
        </a>
        <button className="dugme dugme-sade dugme-ikon" onClick={() => setNot(true)} title={t("gdArsiveEkle")} aria-label={t("gdArsiveEkle")} data-okuma-not data-arsive-ekle>
          {kayitli ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
        {/* Basınca seçim kaybolmasın diye odak düğmeye geçmiyor. */}
        <button className="dugme dugme-sade dugme-ikon" onMouseDown={(e) => e.preventDefault()} onClick={secimiEkle} title={t("gdSecimiEkle")} aria-label={t("gdSecimiEkle")} data-secimi-ekle>
          <ShoppingBasket size={16} />
        </button>
        <button className="dugme dugme-kucuk" onClick={() => setCevir(true)} data-okuma-cevir data-olay-cevir>
          <Lightbulb size={15} /> {t("gdOneriyeCevir")}
        </button>
      </div>
      {bant && (
        <h2 className="gundem-okuyucu-bant" dir="auto">
          {h.baslik}
        </h2>
      )}
      {etiketler.length > 0 && <div className="gundem-okuyucu-etiketler">{etiketler.map((a) => t(a)).join(" | ")}</div>}
      <div className="gundem-okuyucu-kunye" dir="ltr">
        {o.haberler.length > 1 ? (
          <span className="gundem-okuma-kaynaklar" role="tablist">
            {o.haberler.map((x, j) => (
              <button key={x.baglanti} role="tab" aria-selected={x === h} className={`cip cip-dugme${x === h ? " cip-vurgu" : ""}`} onClick={() => setI(j)} data-okuma-kaynak>
                {x.kaynak}
              </button>
            ))}
          </span>
        ) : (
          <b>{h.kaynak}</b>
        )}
        <span>
          {yerelGun(z.toISOString()).split("-").reverse().join("-")} · {saatYaz(z.toISOString(), dil)}
        </span>
        {durum?.makale && !durum.hata && kelime > 0 && <span>{t("gdKelime", { n: String(kelime) })}</span>}
      </div>
      {bizde && (
        <p className="gundem-okuyucu-bizde" data-bizde>
          {t("gdPlandaVar").replace("{tarih}", tarihYaz(bizde.tarih, dil, "kisa"))} · <Icerik>{bizde.ad}</Icerik>
        </p>
      )}
      <div ref={kutu} className="gundem-okuma" data-okuma>
        {!durum && <p className="soluk">{t("yukleniyor")}</p>}
        {durum?.hata && <p className="soluk" data-okuma-hata>{t("gdMetinYok")}</p>}
        {govde.map((p, k) => (
          <div key={k} className="gundem-paragraf" data-paragraf>
            <p dir="auto">{p}</p>
            <button className="dugme dugme-sade dugme-ikon" onClick={() => ekle(p)} title={t("gdSepeteEkle")} aria-label={t("gdSepeteEkle")} data-paragraf-ekle>
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
      {not && <ArsivPenceresi o={o} ben={ben} kapat={() => setNot(false)} />}
      {cevir && (
        <OneriyeCevir
          baslik={o.baslik}
          kaynaklar={o.kaynaklar}
          gelisme={paragraflar.slice(0, 2).join("\n")}
          ulkeler={olayUlkeleri(o)}
          ben={ben}
          kapat={() => setCevir(false)}
        />
      )}
    </div>
  );
}

/* Okuma penceresi (brifing, etkinlik, telefonda akış): aynı okuyucu pencerede. */
function OkumaPenceresi({ o, ben, kapat }: { o: Olay; ben: Kisi; kapat: () => void }) {
  return (
    <Pencere genis baslik={<Metin>{o.baslik}</Metin>} kapat={kapat}>
      <OkumaIcerik o={o} ben={ben} />
    </Pencere>
  );
}

/*
 * Sepet: birkaç haberden toplanan parçalar tek yere boşaltılır. Yeni öneri, var olan
 * önerinin gelişme satırları ya da tek not. Boşaltınca sepet temizlenir.
 */
function SepetPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const sepet = v.gundemSepetleri?.[ben.id] ?? [];
  const [hedef, setHedef] = useState<"" | "satir" | "not" | "oneri">("");
  const adaylar = v.oneriler.filter((o) => !oneriArsivde(o) && oneriSatiriEkleyebilir(ben, o)).sort((a, b) => b.zaman.localeCompare(a.zaman));
  const [oneriId, setOneriId] = useState("");
  const [not, setNot] = useState("");
  const kaynaklar = [...new Set(sepet.map((p) => p.kaynak))];
  const ilk = sepet.find((p) => /[؀-ۿ]/.test(p.baslik)) ?? sepet[0];
  const bitti = (mesaj: string, yol?: string) => {
    gundemSepettenCikar(ben);
    kapat();
    bildir(mesaj, yol ? { ad: t("ac"), f: () => git(yol) } : undefined);
  };
  const satirEkle = () => {
    if (oneriyeSatirlarEkle(ben, oneriId, sepet.map((p) => `${p.metin} (${p.kaynak})`))) bitti(t("gdSatirEklendi"), `oneriler/${oneriId}`);
  };
  const notKaydet = () => {
    if (
      ilk &&
      gundemNotuKaydet(ben, {
        baslik: ilk.baslik,
        baglanti: ilk.baglanti,
        kaynak: kaynaklar.join(", "),
        konular: [],
        not: [not.trim(), ...sepet.map((p) => `${p.metin} (${p.kaynak})`)].filter(Boolean).join("\n\n"),
        haberZamani: ilk.zaman,
      })
    )
      bitti(t("gdNotEklendi"));
  };
  if (!sepet.length) return null;
  return (
    <Pencere
      genis
      baslik={`${t("gdSepet")} · ${sepet.length}`}
      kapat={kapat}
      altBilgi={
        <div className="form-alt">
          <button className="dugme dugme-sade" onClick={() => gundemSepettenCikar(ben)} data-sepet-temizle>
            <Trash2 size={15} /> {t("gdSepetTemizle")}
          </button>
          <button className="dugme dugme-ikincil" onClick={() => setHedef("not")} aria-pressed={hedef === "not"} data-sepet-not>
            {t("gdNotaEkle")}
          </button>
          {adaylar.length > 0 && (
            <button className="dugme dugme-ikincil" onClick={() => setHedef("satir")} aria-pressed={hedef === "satir"} data-sepet-satir>
              {t("gdSatirEkle")}
            </button>
          )}
          <button className="dugme" onClick={() => setHedef("oneri")} data-sepet-oneri>
            {t("gdOneriyeCevir")}
          </button>
        </div>
      }
    >
      <ul className="gundem-sepet" data-sepet>
        {sepet.map((p) => (
          <li key={p.id} data-sepet-parca>
            <div>
              <p dir="auto">{p.metin}</p>
              <small className="soluk">{p.kaynak}</small>
            </div>
            <button className="dugme dugme-sade dugme-ikon" onClick={() => gundemSepettenCikar(ben, p.id)} title={t("cikar")} aria-label={t("cikar")}>
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      {hedef === "satir" && (
        <div className="form" data-sepet-satir-formu>
          <label>
            {t("oneri")}
            <select value={oneriId} onChange={(e) => setOneriId(e.target.value)} data-sepet-oneri-sec>
              <option value="">—</option>
              {adaylar.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.haberBasligi}
                </option>
              ))}
            </select>
          </label>
          <div className="form-alt">
            <button className="dugme" disabled={!oneriId} onClick={satirEkle} data-sepet-satir-kaydet>
              {t("gdSatirEkle")}
            </button>
          </div>
        </div>
      )}
      {hedef === "not" && (
        <div className="form" data-sepet-not-formu>
          <label>
            {t("not")}
            <textarea rows={3} dir="auto" value={not} onChange={(e) => setNot(e.target.value)} />
          </label>
          <div className="form-alt">
            <button className="dugme" onClick={notKaydet} data-sepet-not-kaydet>
              {t("kaydet")}
            </button>
          </div>
        </div>
      )}
      {hedef === "oneri" && ilk && (
        <OneriyeCevir
          baslik={ilk.baslik}
          kaynaklar={kaynaklar}
          gelisme={sepet.map((p) => p.metin).join("\n")}
          ben={ben}
          kapat={() => setHedef("")}
          gonderildi={() => bitti(t("gdOneriOldu"))}
        />
      )}
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
