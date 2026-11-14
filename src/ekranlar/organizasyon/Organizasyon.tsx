import { OnayBekleyenHesaplar } from "../../bilesenler/HesapOnayi";
import { useAdimDurumu } from "../../yol";
import { kisiUyar, sozcuklerUyar } from "../../arama";
import { sehirAdi } from "../../etiketler";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  EyeOff,
  Globe,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
  Upload,
  UserCog,
  X,
  FolderPlus,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  Avatar,
  Bos,
  Kart,
  NotKutu,
  Pencere,
  Rozet,
  bildir,
} from "../../bilesenler/Parcalar";
import {
  DILLER,
  metin,
  tarihYaz,
  saatYaz,
  useDil,
  yaz,
  type Anahtar,
  type Metin,
} from "../../dil";
import { BIRIM_ADI, GOREV_ADI } from "../../etiketler";
import {
  yapiSurumunuTaslagaAl,
  yapiTaslagi,
  yapiTaslagiDegistir,
  yapiTaslaginiAt,
  yapiYayinla,
  muhabirlereUlkeUnvaniVer,
  ulkeUnvaniBekleyenler,
  kisilerPozisyonu,
  yoneticiligiKaldir,
} from "../../eylemler";
import { GERCEK } from "../../kip";
import { yerelGun } from "../../tarih";
import { ekipEtkisi, etkiVarMi, unvanlariGoreveEkle, type EkipEtkisi, type UnvanOnerisi } from "../../yapiEtkisi";
import {
  BIRIMLER,
  getir,
  kimlik,
  kisiBul,
  useVeri,
  type Birim,
  type BirimId,
  type Gorev,
  type Kisi,
} from "../../veri";
import {
  KOK_MERKEZ,
  agacAdi,
  altindaMi,
  birimAgaci,
  birimSiraTasi,
  birimTasi,
  unvanMuhabirMi,
  unvanYoneticiMi,
  kademeDisiYonetici,
  birimAdi,
  birimEtkisi,
  birimGuncelle,
  birimUnvanlari,
  birimdenUnvanCikar,
  birimeUnvanEkle,
  ekipGorevAdi,
  gorevAdi,
  gorevAdiDilde,
  birimAdiDilde,
  ayirtEdiciBirimAdi,
  guncelYapi,
  silinebilir,
  unvanGuncelle,
  unvanTasi,
  varsayilanYapi,
  yapiFarki,
  kademeMi,
  yerlesikBirim,
  yerlesikGorev,
  type BirimTanimi,
  type Degisiklik,
  type UnvanTanimi,
  type PlanAdimi,
  type Yapi,
} from "../../yapi";
import { hesapYetkisi, yapiDuzenleyebilir } from "../../yetki";
import { SayfaBasi } from "../ana/Planlama";
import { EkipSekmesi } from "./EkipSekmesi";
import { PostaKisileriDugmesi } from "./PostaKisileri";
import Kullanicilar, { IzleDugmesi, PozisyonPenceresi } from "../Kullanicilar";
import { UretimSablonlari } from "./UretimSablonlari";
import { PLAN_ADIMI_ADI, PlanYetkileriSekmesi } from "./PlanYetkileri";
import { AdAlanlari, SinirliDugme, adTemizle, dilde, metinMi } from "./Ortak";

/**
 * Organizasyon: kurumun yapısı yöneticinin elinde.
 *
 * - Kişiler: birim → ünvan ağacında herkes; tayin (birim, ünvan, rol)
 *   hemen geçerli, geçmişe yazılıyor.
 * - Birimler: ağaç (Haber Merkezi › Input › Planlama…), her birimin
 *   kartında ünvanları kıdem sırasıyla. Taslakta
 *   düzenleniyor, "Yayınla" ile yeni sürüm oluyor (yapi.ts). Yerleşik birim
 *   silinmiyor, gizleniyor; kişisi ya da durağı bağlı birim ve ünvan da
 *   kaldırılamıyor, nedeni düğmenin ipucunda.
 * - Plan ekibi (EkipSekmesi.tsx): plandaki ekip görevleri, adları, sırası
 *   ve kime yazılabileceği (birim ve ünvan kuralı).
 * - Üretim şablonları (UretimSablonlari.tsx): üretim balonunun hazır yolları;
 *   eski "İş akışları" sekmesinin yerinde (yol artık paketin onayında seçiliyor).
 * - Plan yetkileri (PlanYetkileri.tsx): planları kim toplantıya götürür,
 *   kim onaylar, kim kesinleştirir.
 * - Sürümler: yayınlanan her düzen; eskisi taslağa alınıp geri getirilebiliyor.
 * - Hesaplar (gerçek kip): davet, kayıt bağlantısı, hesap yetkileri.
 */

type Sekme =
  | "kisiler"
  | "birimler"
  | "ekip"
  | "uretim"
  | "planlar"
  | "surumler"
  | "hesaplar";

const SEKME_ADI: Record<Sekme, Anahtar> = {
  kisiler: "orgKisiler",
  birimler: "orgBirimler",
  ekip: "orgPlanEkibi",
  uretim: "urSablonlar",
  planlar: "orgPlanYetkileri",
  surumler: "orgSurumler",
  hesaplar: "orgHesaplar",
};

/* Taslak üzerinde çalışan sekmeler: üstlerinde yayın çubuğu. */
const YAPI_SEKMELERI: Sekme[] = ["birimler", "ekip", "planlar"];

export const orgSekmeleri = (ben: Kisi): Sekme[] => {
  const yapi = yapiDuzenleyebilir(ben);
  return [
    ...(yapi || hesapYetkisi(ben, "kisiDuzenle") ? (["kisiler"] as const) : []),
    ...(yapi ? (["birimler", "ekip", "uretim", "planlar", "surumler"] as const) : []),
    ...(GERCEK && (ben.hesapYoneticisi || ben.yetkiler?.length)
      ? (["hesaplar"] as const)
      : []),
  ];
};

export default function Organizasyon({
  ben,
  sekme,
}: {
  ben: Kisi;
  sekme?: string;
}) {
  const { t } = useDil();
  const sekmeler = orgSekmeleri(ben);
  // Eski "İş akışları" adresi yerine geçen üretim şablonlarını açar.
  const istenen = sekme === "akislar" ? "uretim" : sekme;
  const acik = (
    sekmeler.includes(istenen as Sekme) ? istenen : sekmeler[0]
  ) as Sekme;
  return (
    <>
      <SayfaBasi ikon={<Building2 size={26} />} baslik={t("mOrganizasyon")} />
      {/* Onay bekleyen hesaplar her sekmenin üstünde: menüdeki sayı buraya getiriyor. */}
      <OnayBekleyenHesaplar ben={ben} />
      <div
        className="sekmeler ara-alt-2"
        role="tablist"
        aria-label={t("mOrganizasyon")}
      >
        {sekmeler.map((s) => (
          <a
            key={s}
            role="tab"
            href={`#/organizasyon/${s}`}
            aria-selected={acik === s}
            className={acik === s ? "acik" : ""}
            data-org-sekme={s}
          >
            {t(SEKME_ADI[s])}
          </a>
        ))}
      </div>
      {YAPI_SEKMELERI.includes(acik) && <TaslakCubugu ben={ben} />}
      {acik === "kisiler" && <KisilerSekmesi ben={ben} />}
      {acik === "birimler" && <BirimlerSekmesi ben={ben} />}
      {acik === "ekip" && <EkipSekmesi ben={ben} />}
      {acik === "uretim" && <UretimSablonlari ben={ben} />}
      {acik === "planlar" && <PlanYetkileriSekmesi ben={ben} />}
      {acik === "surumler" && <SurumlerSekmesi ben={ben} />}
      {acik === "hesaplar" && <Kullanicilar ben={ben} gomulu />}
      <EkipEtkisiPenceresi ben={ben} />
    </>
  );
}

/* --- Taslak ve yayın --- */

/*
 * Birim ve ünvan değişikliğinin Plan ekibine etkisi (yapiEtkisi.ts):
 * değişiklik yapıldıktan sonra sorulur, "Geri al" önceki taslağa döner.
 * Pencere sayfanın kökünde; değişikliği yapan kart ya da pencere kapanmış
 * olabilir.
 */
interface EtkiSorusu {
  once: Yapi;
  etki: EkipEtkisi;
}
let etkiGoster: ((s: EtkiSorusu) => void) | null = null;

export function useTaslak(ben: Kisi, etkiSor = false) {
  const v = useVeri();
  const yayindaki = guncelYapi(v);
  const taslak = yapiTaslagi(v, ben);
  const farklar = yapiFarki(yayindaki, taslak);
  return {
    v,
    yayindaki,
    taslak,
    farklar,
    degistir: (f: (y: Yapi) => Yapi) => {
      const once = yapiTaslagi(getir(), ben);
      const taslakVardi = !!getir().yapiTaslaklari?.[ben.id];
      const sonuc = yapiTaslagiDegistir(ben, f);
      // Taslağın ilk değişikliğinde söyleniyor: Kişiler'deki tayin hemen geçerli, burası değil; ayrım belli değildi.
      if (sonuc && !taslakVardi && getir().yapiTaslaklari?.[ben.id]) bildir(metin("orgTaslagaEklendi"));
      if (sonuc && etkiSor && etkiGoster) {
        const d = getir();
        const etki = ekipEtkisi(once, yapiTaslagi(d, ben), d.kisiler);
        if (etkiVarMi(etki)) etkiGoster({ once, etki });
      }
      return sonuc;
    },
  };
}

function EkipEtkisiPenceresi({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const [soru, setSoru] = useState<EtkiSorusu | null>(null);
  const [secilen, setSecilen] = useState<UnvanOnerisi[]>([]);
  useEffect(() => {
    etkiGoster = (s) => {
      setSoru(s);
      setSecilen([]);
    };
    return () => {
      etkiGoster = null;
    };
  }, []);
  if (!soru) return null;
  const { once, etki } = soru;
  const kapat = () => setSoru(null);
  const anahtar = (o: UnvanOnerisi) => `${o.gorev}~${o.unvan}`;
  const secili = (o: UnvanOnerisi) => secilen.some((s) => anahtar(s) === anahtar(o));
  const adlar = (l: Kisi[]) => l.map((k) => ad(k)).join("، ");
  const uygula = () => {
    if (secilen.length) yapiTaslagiDegistir(ben, (y) => unvanlariGoreveEkle(y, secilen));
    kapat();
  };
  const geriAl = () => {
    yapiTaslagiDegistir(ben, () => once);
    kapat();
  };
  return (
    <Pencere
      baslik={t("orgEtkiBaslik")}
      kapat={kapat}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil" onClick={geriAl} data-etki-geri-al>
            <Undo2 size={16} /> {t("orgEtkiGeriAl")}
          </button>
          <button type="button" className="dugme" onClick={uygula} data-etki-tamam>
            {t(secilen.length ? "orgEtkiUygula" : "orgEtkiKalsin")}
          </button>
        </>
      }
    >
      <div className="org-etki" data-ekip-etkisi>
        {etki.kapsam.map((k) => (
          <div key={k.gorev} className="org-etki-satir" data-etki-gorev={k.gorev}>
            <b>
              <bdi>{ekipGorevAdi(k.gorev)}</bdi>
            </b>
            {k.eklenen.length > 0 && (
              <small>
                + {t("orgEtkiGirecek", { n: k.eklenen.length })}: <bdi>{adlar(k.eklenen)}</bdi>
              </small>
            )}
            {k.cikan.length > 0 && (
              <small className="kotu-yazi">
                − {t("orgEtkiCikacak", { n: k.cikan.length })}: <bdi>{adlar(k.cikan)}</bdi>
              </small>
            )}
          </div>
        ))}
        {etki.yeniUnvan.length > 0 && (
          <fieldset className="org-etki-unvan">
            <legend>{t("orgEtkiYeniUnvan")}</legend>
            {etki.yeniUnvan.map((o) => (
              <label key={anahtar(o)} className="secim" data-etki-unvan={anahtar(o)}>
                <input
                  type="checkbox"
                  checked={secili(o)}
                  onChange={(e) => setSecilen((l) => (e.target.checked ? [...l, o] : l.filter((s) => anahtar(s) !== anahtar(o))))}
                />
                {t("orgEtkiUnvanGoreve", { unvan: gorevAdi(o.unvan), gorev: ekipGorevAdi(o.gorev) })}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </Pencere>
  );
}

function DegisiklikAdi({
  d,
  yayindaki,
  taslak,
}: {
  d: Degisiklik;
  yayindaki: Yapi;
  taslak: Yapi;
}) {
  const { t } = useDil();
  const y = d.islem === "silindi" ? yayindaki : taslak;
  const ad =
    d.tur === "birim"
      ? birimAdi(d.id, y)
      : d.tur === "unvan"
        ? gorevAdi(d.id, y)
        : d.tur === "ekip"
          ? ekipGorevAdi(d.id, "ar", y)
          : d.tur === "plan"
            ? t(PLAN_ADIMI_ADI[d.id as PlanAdimi])
            : yaz(y.akislar.find((a) => a.id === d.id)?.ad) || d.id;
  const tur: Record<Degisiklik["tur"], Anahtar> = {
    birim: "birim",
    unvan: "orgUnvan",
    akis: "orgAkis",
    ekip: "orgEkipGorevi",
    plan: "orgPlanYetkisi",
  };
  const islem: Record<Degisiklik["islem"], Anahtar> = {
    eklendi: "orgEklendi",
    degisti: "orgDegisti",
    silindi: "orgSilindi",
  };
  return (
    <>
      {t(tur[d.tur])} · <b>{ad}</b> · {t(islem[d.islem])}
    </>
  );
}

/**
 * Yayınlanmamış değişiklik varken sekmelerin üstünde: ne değiştiğini
 * listeliyor, yayınlatıyor ya da taslağı attırıyor.
 */
function TaslakCubugu({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { yayindaki, taslak, farklar } = useTaslak(ben);
  const [yayin, setYayin] = useState(false);
  const [not, setNot] = useState("");
  if (!farklar.length)
    return (
      <p className="taslak-cubugu yayinda ara-alt-2" data-yapi-yayinda>
        <Rozet ton="iyi">{t("orgYayinda")}</Rozet> {t("orgSurum", { n: yayindaki.surum })}
      </p>
    );
  return (
    <div className="taslak-cubugu ara-alt-2" data-yapi-taslak>
      <span>
        <Rozet ton="uyari">{t("orgTaslak")}</Rozet>{" "}
        {t("orgDegisiklikSayisi", { n: farklar.length })}
      </span>
      <div className="dugmeler">
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk"
          onClick={() =>
            confirm(t("orgTaslakAtilsinMi")) && yapiTaslaginiAt(ben)
          }
          data-taslak-at
        >
          <Undo2 size={14} /> {t("orgTaslagiAt")}
        </button>
        <button
          type="button"
          className="dugme dugme-kucuk"
          onClick={() => setYayin(true)}
          data-yapi-yayinla
        >
          <Upload size={14} /> {t("orgYayinla")}
        </button>
      </div>
      {yayin && (
        <Pencere
          baslik={t("orgYayinla")}
          kapat={() => setYayin(false)}
          altBilgi={
            <button
              className="dugme"
              onClick={() => {
                if (yapiYayinla(ben, not)) {
                  bildir(t("orgYayinlandi"));
                  setYayin(false);
                  setNot("");
                }
              }}
              data-yayin-onay
            >
              <Upload size={15} /> {t("orgYayinla")}
            </button>
          }
        >
          <ul className="liste" data-degisiklikler>
            {farklar.map((d) => (
              <li key={`${d.tur}:${d.id}`}>
                <span>
                  <DegisiklikAdi d={d} yayindaki={yayindaki} taslak={taslak} />
                </span>
              </li>
            ))}
          </ul>
          <label className="form ara-ust-2">
            {t("orgYayinNotu")}
            <input
              dir="auto"
              value={not}
              onChange={(e) => setNot(e.target.value)}
              data-yayin-notu
            />
          </label>
        </Pencere>
      )}
    </div>
  );
}

/* --- Birimler ve ünvanları --- */

/*
 * Her birim bir kart, ünvanları kıdem sırasıyla içinde: Newsdesk'te
 * Executive Producer, Program Editor, Senior Producer… Yönetici ünvanı
 * yazıp ekliyor, oklarla sıralıyor, adını değiştiriyor, birimden çıkarıyor.
 * Başka birimde olan ünvan adıyla yazılırsa aynı ünvan bu birime de ekleniyor.
 */
function BirimlerSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { taslak } = useTaslak(ben);
  // "yeni": üstteki düğme; { ust }: kartın "Alt birim ekle"si (kullanıcı: alt birim eklemenin yolu bulunmuyordu, üst birim yalnız pencerenin seçimindeydi).
  // Alt birim ekleme ayrı işaretle: birim kaydının da `ust` alanı var, `"ust" in acik` alt birimin "Düzenle"sini alt birim eklemeye çeviriyordu.
  const [acik, setAcik] = useState<BirimTanimi | "yeni" | { altBirimUst: BirimId } | null>(null);
  // Arama: birim ve ünvan adı üç dilde. Sayfa telefonda ~11 ekran boyu; "Sunucu" hangi birimde, gözle aranıyordu.
  const [aranan, setAranan] = useAdimDurumu("orgBirimler:ara", "");
  const ara = aranan.trim();
  const uyar = (adlar: string[]) => sozcuklerUyar(adlar.join(" "), ara);
  const birimUyar = (id: BirimId) => uyar(DILLER.map((d) => birimAdiDilde(id, d, taslak)));
  const unvanUyar = (id: string) => uyar(DILLER.map((d) => gorevAdiDilde(id, d, taslak)));
  const satirlar = birimAgaci(taslak).filter(({ id }) => !ara || birimUyar(id) || birimUnvanlari(id, taslak).some(unvanUyar));
  return (
    <Kart
      baslik={t("orgBirimler")}
      ek={String(taslak.birimler.length)}
      sagUc={
        <button type="button" className="dugme dugme-kucuk" onClick={() => setAcik("yeni")} data-birim-ekle>
          <Plus size={14} /> {t("orgBirimEkle")}
        </button>
      }
    >
      <label className="arama ara-alt-2">
        <Search size={16} />
        <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("orgBirimAra")} aria-label={t("orgBirimAra")} data-org-birim-ara />
      </label>
      {ara && !satirlar.length && <Bos kucuk metin={t("orgBirimBulunamadi")} />}
      {/* Ağaç sırasıyla, alt birim üstünün altında girintili (yapi.ts → birimAgaci); aramada yalnız uyanlar, girintisiz. */}
      <div className="org-birimler" data-birim-tablosu>
        {satirlar.map(({ id, derinlik }) => {
          const b = taslak.birimler.find((x) => x.id === id)!;
          return (
            <BirimKarti
              key={id}
              ben={ben}
              birim={b}
              derinlik={ara ? 0 : derinlik}
              vurgu={ara && !birimUyar(id) ? unvanUyar : undefined}
              duzenle={() => setAcik(b)}
              altEkle={() => setAcik({ altBirimUst: b.id })}
            />
          );
        })}
      </div>
      {acik && <BirimPenceresi ben={ben} birim={acik === "yeni" || "altBirimUst" in acik ? null : acik} ustBirim={acik !== "yeni" && "altBirimUst" in acik ? acik.altBirimUst : undefined} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

function BirimKarti({ ben, birim: b, derinlik, vurgu, duzenle, altEkle }: { ben: Kisi; birim: BirimTanimi; derinlik: number; vurgu?: (unvan: string) => boolean; duzenle: () => void; altEkle: () => void }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben, true);
  const [yeni, setYeni] = useState("");
  const [unvan, setUnvan] = useState<UnvanTanimi | null>(null);
  const etki = birimEtkisi(taslak, v.kisiler, b.id);
  // Altında birim olan silinmez: alt birimler sahipsiz köke düşerdi.
  const altBirimi = taslak.birimler.some((x) => x.ust === b.id);
  const yerlesik = yerlesikBirim(b.id);
  const kademe = kademeMi(b.id, taslak);
  const unvanlar = birimUnvanlari(b.id, taslak);
  const kisiSayisi = (id: string) => v.kisiler.filter((k) => k.birim === b.id && k.gorev === id).length;
  const durakSayisi = (id: string) =>
    taslak.akislar.flatMap((a) => a.duraklar).filter((d) => d.sorumlu.tur === "unvan" && d.sorumlu.unvan === id && (!d.sorumlu.birim || d.sorumlu.birim === b.id)).length;
  // Başka birimdeki ünvan adıyla yazılırsa yenisi açılmıyor, aynı ünvan ekleniyor.
  const baskaBirimde = taslak.unvanlar.filter((u) => !unvanlar.includes(u.id));
  const aranan = yeni.trim().toLocaleLowerCase();
  const benzerler = aranan
    ? baskaBirimde.filter((u) => (["tr", "ar", "en"] as const).some((d) => gorevAdiDilde(u.id, d, taslak).toLocaleLowerCase().includes(aranan))).slice(0, 5)
    : [];
  const ekleVar = (id: string) => {
    degistir((y) => birimeUnvanEkle(y, b.id, id));
    setYeni("");
  };
  const ekle = (e: FormEvent) => {
    e.preventDefault();
    const ad = yeni.trim();
    if (!ad) return;
    const aranan = ad.toLocaleLowerCase();
    const var_ = taslak.unvanlar.find((u) => (["tr", "ar", "en"] as const).some((d) => gorevAdiDilde(u.id, d, taslak).toLocaleLowerCase() === aranan));
    if (var_ && unvanlar.includes(var_.id)) return setYeni("");
    // Kademeye (Input, Output… düğümü) eklenen ünvan müdürün ünvanı: yönetici rolü verir.
    degistir((y) => birimeUnvanEkle(y, b.id, var_ ? var_.id : { id: kimlik("u"), ad: { tr: ad, ar: ad, en: ad }, birimler: [b.id], ...(kademe ? { yonetici: true } : {}) }));
    setYeni("");
  };
  return (
    <section className={`org-birim${b.gizli ? " soluk" : ""}`} style={{ "--derinlik": derinlik } as CSSProperties} data-birim-satiri={b.id} data-derinlik={derinlik}>
      <header>
        <div>
          <b>{birimAdi(b.id, taslak)}</b> {b.gizli && <Rozet>{t("orgGizli")}</Rozet>}
          <small className="sonuk-yazi">
            {t("orgKisiSayisi", { n: etki.kisiler })} · {yerlesik ? t("orgYerlesik") : b.ornek ? t("orgGibi", { birim: birimAdi(b.ornek, taslak) }) : kademe ? t("orgKademe") : t("orgOrneksiz")}
          </small>
        </div>
        <div className="dugmeler">
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => degistir((y) => birimSiraTasi(y, b.id, -1))} title={t("yukari")} aria-label={t("yukari")} data-birim-yukari={b.id}>
            <ArrowUp size={15} />
          </button>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => degistir((y) => birimSiraTasi(y, b.id, 1))} title={t("asagi")} aria-label={t("asagi")} data-birim-asagi={b.id}>
            <ArrowDown size={15} />
          </button>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={altEkle} title={t("orgAltBirimEkle")} aria-label={t("orgAltBirimEkle")} data-alt-birim-ekle={b.id}>
            <FolderPlus size={15} />
          </button>
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={duzenle} data-birim-duzenle={b.id}>
            <Pencil size={14} /> {t("duzenle")}
          </button>
          <button
            type="button"
            className="dugme dugme-sade dugme-kucuk"
            onClick={() =>
              // Kökü, alt birimi ya da kişisi olan birimi gizlemek onay soruyor: "Haber Merkezi" tek dokunuşla bütünüyle gizleniyordu.
              (b.gizli || (b.ust && !altBirimi && !etki.kisiler) || confirm(t("orgGizlensinMi", { ad: birimAdi(b.id, taslak), n: etki.kisiler }))) &&
              degistir((y) => birimGuncelle(y, b.id, (x) => ({ ...x, gizli: !x.gizli || undefined })))
            }
            data-birim-gizle={b.id}
          >
            {b.gizli ? <Eye size={14} /> : <EyeOff size={14} />} {t(b.gizli ? "orgGoster" : "orgGizle")}
          </button>
          {!yerlesik && (
            <SinirliDugme
              className="dugme dugme-sade dugme-kucuk kotu-yazi"
              izin={silinebilir(etki) && !altBirimi}
              neden={altBirimi ? t("orgAltBirimVar") : t("orgSilinemez", { kisi: etki.kisiler, durak: etki.duraklar })}
              onClick={() => confirm(t("orgSilinsinMi", { ad: birimAdi(b.id, taslak) })) && degistir((y) => ({ ...y, birimler: y.birimler.filter((x) => x.id !== b.id) }))}
              data-sil={b.id}
            >
              <Trash2 size={14} /> {t("sil")}
            </SinirliDugme>
          )}
        </div>
      </header>
      <ol className="unvan-listesi" aria-label={t("orgUnvanlar")} data-unvanlar={b.id}>
        {unvanlar.map((id, i) => {
          const u = taslak.unvanlar.find((x) => x.id === id)!;
          const n = kisiSayisi(id);
          const durak = durakSayisi(id);
          return (
            <li key={id} data-unvan={id} className={vurgu?.(id) ? "eslesti" : undefined}>
              <span className="kidem">{i + 1}</span>
              <span className="unvan-adi">
                <b>{gorevAdi(id, taslak)}</b>
                {unvanMuhabirMi(id, taslak) && <small>{t("orgMuhabirUnvani")}</small>}
                {unvanYoneticiMi(id, taslak) && <small>{t("orgYoneticiUnvani")}</small>}
              </span>
              <em className="sonuk-yazi" title={t("orgKisi")}>
                {n}
              </em>
              <span className="unvan-islem">
                <button type="button" className="dugme dugme-sade dugme-ikon" disabled={i === 0} onClick={() => degistir((y) => unvanTasi(y, b.id, i, i - 1))} title={t("yukari")} aria-label={t("yukari")} data-unvan-yukari={id}>
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="dugme dugme-sade dugme-ikon"
                  disabled={i === unvanlar.length - 1}
                  onClick={() => degistir((y) => unvanTasi(y, b.id, i, i + 1))}
                  title={t("asagi")}
                  aria-label={t("asagi")}
                  data-unvan-asagi={id}
                >
                  <ArrowDown size={15} />
                </button>
                <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setUnvan(u)} title={t("duzenle")} aria-label={t("duzenle")} data-unvan-duzenle={id}>
                  <Pencil size={15} />
                </button>
                <SinirliDugme
                  className="dugme dugme-sade dugme-ikon kotu-yazi"
                  izin={n === 0 && durak === 0}
                  neden={t("orgSilinemez", { kisi: n, durak })}
                  etiket={t("orgBirimdenCikar")}
                  onClick={() => degistir((y) => birimdenUnvanCikar(y, b.id, id))}
                  data-sil={id}
                >
                  <X size={15} />
                </SinirliDugme>
              </span>
            </li>
          );
        })}
      </ol>
      <form className="form unvan-ekle" onSubmit={ekle}>
        <input value={yeni} onChange={(e) => setYeni(e.target.value)} aria-label={t("orgUnvanEkle")} data-unvan-yeni={b.id} />
        <button type="submit" className="dugme dugme-ikincil dugme-kucuk" disabled={!yeni.trim()} data-unvan-ekle={b.id}>
          <Plus size={14} /> {t("orgUnvanEkle")}
        </button>
      </form>
      {/* datalist yerine sayfanın kendi düğmeleri: Android Chrome datalist'i klavyenin üstünde ayrı sistem
          penceresinde açıyor; klavye dili değişince o pencere klavyeyi kapatıyordu. */}
      {benzerler.length > 0 && (
        <div className="unvan-onerileri" data-unvan-onerileri={b.id}>
          {benzerler.map((u) => (
            <button key={u.id} type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => ekleVar(u.id)} data-unvan-oneri={u.id}>
              <Plus size={14} /> {gorevAdi(u.id, taslak)}
            </button>
          ))}
        </div>
      )}
      {unvan && <UnvanPenceresi ben={ben} unvan={unvan} kapat={() => setUnvan(null)} />}
    </section>
  );
}

function BirimPenceresi({ ben, birim, ustBirim, kapat }: { ben: Kisi; birim: BirimTanimi | null; ustBirim?: BirimId; kapat: () => void }) {
  const { t } = useDil();
  const { taslak, degistir } = useTaslak(ben, true);
  const yerlesik = !!birim && yerlesikBirim(birim.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(birim?.ad) ? birim.ad : undefined);
  // Alt birim üstü gibi çalışarak açılır (Planlama'nın alt birimi Planlama gibi); seçim değişebilir.
  const ust0 = ustBirim ? taslak.birimler.find((x) => x.id === ustBirim) : undefined;
  const ustunOrnegi: Birim | "" = ust0 ? (yerlesikBirim(ust0.id) ? (ust0.id as Birim) : (ust0.ornek ?? "")) : "";
  const [ornek, setOrnek] = useState<Birim | "">(birim?.ornek ?? ustunOrnegi);
  const [ust, setUst] = useState<BirimId>(birim?.ust ?? ustBirim ?? KOK_MERKEZ);
  const temiz = adTemizle(ad);
  const hazir = yerlesik || !!temiz;
  // Üst birim seçiminde kendisi ve altındakiler yok: birim kendi altına taşınamaz.
  const ustler = birimAgaci(taslak).filter((s) => !birim || !altindaMi(s.id, birim.id, taslak));
  const kaydet = () => {
    if (!hazir) return;
    if (!birim) {
      const yeni: BirimTanimi = { id: kimlik("b"), ad: temiz, unvanlar: [], ...(ornek ? { ornek } : {}), ...(ust ? { ust } : {}) };
      degistir((y) => ({ ...y, birimler: [...y.birimler, yeni] }));
    } else
      degistir((y) =>
        birimTasi(
          birimGuncelle(y, birim.id, (x) => {
            const { ad: _, ornek: __, ...kalan } = x;
            return { ...kalan, ...(temiz ? { ad: temiz } : {}), ...(!yerlesik && ornek ? { ornek } : {}) };
          }),
          birim.id,
          ust || undefined,
        ),
      );
    kapat();
  };
  const varsayilan = yerlesik ? dilde(BIRIM_ADI[birim.id as Birim]) : undefined;
  return (
    <Pencere
      baslik={birim ? birimAdi(birim.id) : t(ustBirim ? "orgAltBirimEkle" : "orgBirimEkle")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-birim-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-birim-formu>
        <AdAlanlari deger={ad} varsayilan={varsayilan} degistir={setAd} />
        <label>
          {t("orgUstBirim")}
          <select value={ust} onChange={(e) => setUst(e.target.value)} data-birim-ust>
            <option value="">{t("orgKok")}</option>
            {ustler.map((s) => (
              <option key={s.id} value={s.id}>
                {agacAdi(s, taslak)}
              </option>
            ))}
          </select>
        </label>
        {!yerlesik && (
          <label>
            {t("orgCalisma")}
            <select value={ornek} onChange={(e) => setOrnek(e.target.value as Birim | "")} data-birim-ornek>
              <option value="">{t("orgOrneksiz")}</option>
              {BIRIMLER.map((b) => (
                <option key={b} value={b}>
                  {t("orgGibi", { birim: birimAdi(b, varsayilanYapi()) })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </Pencere>
  );
}

/* Ünvanın adı (üç dilde) ve plandaki ekip görevi. Ünvan birden fazla birimdeyse ad hepsinde değişir. */
function UnvanPenceresi({ ben, unvan, kapat }: { ben: Kisi; unvan: UnvanTanimi; kapat: () => void }) {
  const { t } = useDil();
  const { degistir } = useTaslak(ben, true);
  const yerlesik = yerlesikGorev(unvan.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(unvan.ad) ? unvan.ad : undefined);
  const [muhabir, setMuhabir] = useState(unvanMuhabirMi(unvan.id));
  const [yonetici, setYonetici] = useState(unvanYoneticiMi(unvan.id));
  const temiz = adTemizle(ad);
  const hazir = yerlesik || !!temiz;
  const kaydet = () => {
    if (!hazir) return;
    degistir((y) =>
      unvanGuncelle(y, unvan.id, (x) => {
        const { ad: _, muhabir: __, yonetici: ___, ...kalan } = x;
        return { ...kalan, muhabir, yonetici, ...(temiz ? { ad: temiz } : {}) };
      }),
    );
    kapat();
  };
  const varsayilan = yerlesik ? dilde(GOREV_ADI[unvan.id as Gorev]) : undefined;
  return (
    <Pencere
      baslik={gorevAdi(unvan.id)}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-unvan-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-unvan-formu>
        <AdAlanlari deger={ad} varsayilan={varsayilan} degistir={setAd} />
        <label className="secim">
          <input type="checkbox" checked={muhabir} onChange={(e) => setMuhabir(e.target.checked)} data-unvan-muhabir />
          {t("orgMuhabirUnvaniSec")}
        </label>
        <label className="secim">
          <input type="checkbox" checked={yonetici} onChange={(e) => setYonetici(e.target.checked)} data-unvan-yonetici />
          {t("orgYoneticiUnvaniSec")}
        </label>
      </div>
    </Pencere>
  );
}

/* --- Kişiler: birim → ünvan ağacı, tayin --- */

function KisilerSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [aranan, setAranan] = useAdimDurumu("orgKisiler:ara", "");
  const [tayin, setTayin] = useState<Kisi | null>(null);
  const tayinEder = hesapYetkisi(ben, "kisiDuzenle");
  const [yoneticiler, setYoneticiler] = useAdimDurumu("orgKisiler:yoneticiler", false);
  const ara = aranan.trim();
  const yoneticiMi = (k: Kisi) => k.rol === "yonetici" || unvanYoneticiMi(k.gorev) || !!k.hesapYoneticisi;
  const kisiler = (ara ? v.kisiler.filter((k) => kisiUyar(k, ara, v)) : v.kisiler).filter((k) => !yoneticiler || yoneticiMi(k));
  const yoneticiSayisi = v.kisiler.filter(yoneticiMi).length;
  /*
   * Ağaç sırasıyla (Haber Merkezi › Input › Planlama…): kendisinde ya da
   * altında kişi olan birimler, derinliğine göre girintili; sayı alt
   * birimleriyle. Gizli birimde ya da yapıdan çıkmış birimde kalan kişi de
   * görünsün, yönetici onu tayin etsin.
   */
  const altta = (b: BirimId) => kisiler.filter((k) => altindaMi(k.birim, b));
  const agac = birimAgaci();
  const ulkeBekleyen = ulkeUnvaniBekleyenler(v);
  const birimler = [
    ...agac.filter((s) => altta(s.id).length),
    ...[...new Set(kisiler.map((k) => k.birim))].filter((b) => !agac.some((s) => s.id === b)).map((id) => ({ id, derinlik: 0 })),
  ];
  return (
    <Kart
      baslik={t("orgKisiler")}
      ek={String(kisiler.length)}
      sagUc={
        <span className="pk-ust-dugmeler">
          <button
            type="button"
            className={`dugme dugme-kucuk ${yoneticiler ? "" : "dugme-ikincil"}`}
            aria-pressed={yoneticiler}
            onClick={() => setYoneticiler(!yoneticiler)}
            data-org-yoneticiler
          >
            <UserCog size={14} /> {t("orgYoneticiler")} · {yoneticiSayisi}
          </button>
          <PostaKisileriDugmesi ben={ben} />
          {yapiDuzenleyebilir(ben) && ulkeBekleyen.length > 0 && (
            <button
              type="button"
              className="dugme dugme-ikincil dugme-kucuk"
              onClick={() => confirm(t("orgUlkeUnvanlariSoru", { n: ulkeBekleyen.length })) && bildir(t("orgUlkeUnvanlariTamam", { n: muhabirlereUlkeUnvaniVer(ben) }))}
              data-ulke-unvanlari
            >
              <Globe size={14} /> {t("orgUlkeUnvanlari")}
            </button>
          )}
        </span>
      }
    >
      <label className="arama ara-alt-2">
        <Search size={16} />
        <input
          type="search"
          value={aranan}
          onChange={(e) => setAranan(e.target.value)}
          placeholder={t("kisiAra")}
          aria-label={t("kisiAra")}
          data-org-ara
        />
      </label>
      {!kisiler.length && <Bos kucuk metin={t("kisiYok")} />}
      {/* Aramada sonucun kendisi: ağaçta tek kişi 4–5 kat içeride, telefonda ekranın dibinde kalıyordu. */}
      {yoneticiler ? (
        <YoneticiListesi ben={ben} kisiler={kisiler} tayin={tayinEder ? setTayin : undefined} />
      ) : ara ? (
        <ul className="liste org-sonuclar" data-org-sonuclar>
          {kisiler.map((k) => (
            <KisiSatiri key={k.id} ben={ben} kisi={k} tayin={tayinEder ? () => setTayin(k) : undefined} yer />
          ))}
        </ul>
      ) : (
      <div className="org-agac" data-org-agac>
        {birimler.map(({ id: b, derinlik }) => {
          const birimdekiler = kisiler.filter((k) => k.birim === b);
          // Ünvan grupları birimin kıdem sırasıyla; listede olmayan ünvandaki kişi sonda.
          const sira = birimUnvanlari(b);
          const unvanlar = [...new Set(birimdekiler.map((k) => k.gorev))].sort((x, y) => (sira.indexOf(x) + 1 || 999) - (sira.indexOf(y) + 1 || 999));
          return (
            <details
              key={b}
              open={!!ara || birimler.length <= 3 || !birimdekiler.length}
              style={{ "--derinlik": derinlik } as CSSProperties}
              data-org-birim={b}
            >
              <summary>
                <b>{birimAdi(b)}</b>{" "}
                <em className="sonuk-yazi">{altta(b).length}</em>
              </summary>
              {unvanlar.map((g) => (
                <div key={g} className="org-unvan" data-org-unvan={g}>
                  <h4>
                    {gorevAdi(g)}{" "}
                    <em className="sonuk-yazi">
                      {birimdekiler.filter((k) => k.gorev === g).length}
                    </em>
                  </h4>
                  <ul className="liste">
                    {birimdekiler
                      .filter((k) => k.gorev === g)
                      .map((k) => (
                        <KisiSatiri key={k.id} ben={ben} kisi={k} tayin={tayinEder ? () => setTayin(k) : undefined} />
                      ))}
                  </ul>
                </div>
              ))}
            </details>
          );
        })}
      </div>
      )}
      {tayin && (
        <PozisyonPenceresi
          ben={ben}
          kisi={kisiBul(v, tayin.id) ?? tayin}
          kapat={() => setTayin(null)}
        />
      )}
    </Kart>
  );
}

/*
 * Yöneticiler süzgeci (kullanıcı: kurumda yönetici yalnız koordinatör, müdürler ve tam
 * yöneticinin yetki verdiği kişi): kademe dışındakiler işaretli gelir, toplu personele
 * çevrilir. Kendiliğinden çevrilmez: gerçek bir birim yöneticisi de olabilir.
 */
function YoneticiListesi({ ben, kisiler, tayin }: { ben: Kisi; kisiler: Kisi[]; tayin?: (k: Kisi) => void }) {
  const { t } = useDil();
  const disarida = kisiler.filter((k) => kademeDisiYonetici(k));
  const [secili, setSecili] = useState<string[]>(() => disarida.map((k) => k.id));
  const sirali = [...disarida, ...kisiler.filter((k) => !disarida.includes(k))];
  const cevir = () => {
    if (!confirm(t("orgPersoneleCevirSoru", { n: secili.length }))) return;
    const once = yoneticiligiKaldir(ben, secili);
    if (!once) return;
    setSecili([]);
    bildir(t("orgPersoneleCevrildi", { n: once.length }), { ad: t("geriAl"), f: () => kisilerPozisyonu(ben, once) });
  };
  return (
    <>
      {tayin && disarida.length > 0 && (
        <p className="org-yonetici-cubugu ara-alt-2">
          <Rozet ton="uyari">{t("orgKademeDisi", { n: disarida.length })}</Rozet>
          <button
            type="button"
            className="dugme dugme-kucuk"
            aria-disabled={!secili.length}
            title={secili.length ? undefined : t("orgSecimYok")}
            onClick={() => secili.length && cevir()}
            data-org-personele-cevir
          >
            {t("orgPersoneleCevir")} · {secili.length}
          </button>
        </p>
      )}
      <ul className="liste org-sonuclar" data-org-yonetici-listesi>
        {sirali.map((k) => (
          <KisiSatiri
            key={k.id}
            ben={ben}
            kisi={k}
            tayin={tayin ? () => tayin(k) : undefined}
            yer
            sec={
              tayin && disarida.includes(k)
                ? { secili: secili.includes(k.id), degistir: (x: boolean) => setSecili(x ? [...secili, k.id] : secili.filter((y) => y !== k.id)) }
                : undefined
            }
          />
        ))}
      </ul>
    </>
  );
}

/* Kişinin satırı; aramada altında yeri ("Birim › Ünvan · Şehir"), ağaçta birim ve ünvan zaten başlıkta. */
function KisiSatiri({ ben, kisi: k, tayin, yer, sec }: { ben: Kisi; kisi: Kisi; tayin?: () => void; yer?: boolean; sec?: { secili: boolean; degistir: (x: boolean) => void } }) {
  const { t, ad } = useDil();
  return (
    <li data-org-kisi={k.id}>
      {sec && (
        <input type="checkbox" checked={sec.secili} onChange={(e) => sec.degistir(e.target.checked)} aria-label={t("orgSec")} data-org-yonetici-sec={k.id} />
      )}
      <Avatar kisi={k} boy="kucuk" />
      <div className="ad">
        <a href={`#/personel/${k.id}`}>{ad(k)}</a>
        {yer && (
          <small className="sonuk-yazi" data-org-kisi-yeri>
            {ayirtEdiciBirimAdi(k.birim)} › {gorevAdi(k.gorev)}
            {k.sehir ? ` · ${sehirAdi(k.sehir)}` : ""}
          </small>
        )}
        <small>
          {k.rol === "yonetici" && <Rozet ton="koyu">{t("rolYonetici")}</Rozet>}{" "}
          {k.hesapsiz && <Rozet>{t("hesapYok")}</Rozet>}{" "}
          {k.kontrolBekliyor && (
            <span data-org-onay-bekliyor>
              <Rozet ton="uyari">{t("kontrolBekliyor")}</Rozet>
            </span>
          )}
        </small>
      </div>
      <IzleDugmesi ben={ben} kisi={k} />
      {tayin && (
        <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={tayin} data-tayin={k.id}>
          <UserCog size={14} /> {t("orgTayin")}
        </button>
      )}
    </li>
  );
}

/* --- Sürümler --- */

function SurumlerSekmesi({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const yayindaki = guncelYapi(v);
  const surumler = [...v.yapilar].sort((a, b) => b.surum - a.surum);
  const al = (s: number) => {
    if (yapiSurumunuTaslagaAl(ben, s)) {
      bildir(t("orgTaslagaAlindi"));
      location.hash = "#/organizasyon/birimler";
    }
  };
  const satir = (y: Yapi) => (
    <li key={y.id} data-surum={y.surum}>
      <History size={16} />
      <div className="ad">
        <b>
          {t("orgSurum", { n: y.surum })}{" "}
          {y.surum === yayindaki.surum && (
            <Rozet ton="iyi">{t("orgYayinda")}</Rozet>
          )}
        </b>
        <small className="sonuk-yazi">
          {y.surum === 0
            ? t("orgBaslangic")
            : `${tarihYaz(yerelGun(y.zaman), dil, "kisa")} ${saatYaz(y.zaman, dil)} · ${ad(kisiBul(v, y.yayinlayan))}`}
        </small>
        {y.not && <small dir="auto">{y.not}</small>}
      </div>
      {y.surum !== yayindaki.surum && (
        <button
          type="button"
          className="dugme dugme-sade dugme-kucuk"
          onClick={() => al(y.surum)}
          data-surume-don={y.surum}
        >
          <Undo2 size={14} /> {t("orgTaslagaAl")}
        </button>
      )}
    </li>
  );
  return (
    <Kart baslik={t("orgSurumler")} ek={String(surumler.length + 1)}>
      {v.yapiTaslaklari?.[ben.id] && (
        <NotKutu ton="uyari">
          <a href="#/organizasyon/birimler">{t("orgTaslakVar")}</a>
        </NotKutu>
      )}
      <ul className="liste" data-surumler>
        {surumler.map(satir)}
        {satir(varsayilanYapi())}
      </ul>
    </Kart>
  );
}
