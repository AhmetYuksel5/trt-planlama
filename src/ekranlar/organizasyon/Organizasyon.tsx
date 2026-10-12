import {
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  EyeOff,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  Undo2,
  Upload,
  UserCog,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
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
  metin,
  tarihYaz,
  saatYaz,
  useDil,
  yaz,
  type Anahtar,
  type Metin,
} from "../../dil";
import { BIRIM_ADI, EKIP_GOREV_ADI, GOREV_ADI } from "../../etiketler";
import {
  yapiSurumunuTaslagaAl,
  yapiTaslagi,
  yapiTaslagiDegistir,
  yapiTaslaginiAt,
  yapiYayinla,
} from "../../eylemler";
import { GERCEK } from "../../kip";
import { yerelGun } from "../../tarih";
import {
  BIRIMLER,
  EKIP_GOREVLERI,
  kimlik,
  kisiBul,
  useVeri,
  type Birim,
  type EkipGorevi,
  type Gorev,
  type Kisi,
} from "../../veri";
import {
  birimAdi,
  birimEtkisi,
  birimGuncelle,
  birimListesi,
  birimUnvanlari,
  birimdenUnvanCikar,
  birimeUnvanEkle,
  gorevAdi,
  guncelYapi,
  silinebilir,
  unvanGuncelle,
  unvanTasi,
  varsayilanYapi,
  yapiFarki,
  yerlesikBirim,
  yerlesikGorev,
  type BirimTanimi,
  type Degisiklik,
  type UnvanTanimi,
  type Yapi,
} from "../../yapi";
import { hesapYetkisi, yapiDuzenleyebilir } from "../../yetki";
import { SayfaBasi } from "../ana/Planlama";
import Kullanicilar, { PozisyonPenceresi } from "../Kullanicilar";
import { AkislarSekmesi } from "./Akislar";
import { AdAlanlari, SinirliDugme, adTemizle, dilde, metinMi } from "./Ortak";

/**
 * Organizasyon: kurumun yapısı yöneticinin elinde.
 *
 * - Kişiler: birim → ünvan ağacında herkes; tayin (birim, ünvan, rol)
 *   hemen geçerli, geçmişe yazılıyor.
 * - Birimler: her birimin kartında ünvanları kıdem sırasıyla. Taslakta
 *   düzenleniyor, "Yayınla" ile yeni sürüm oluyor (yapi.ts). Yerleşik birim
 *   silinmiyor, gizleniyor; kişisi ya da durağı bağlı birim ve ünvan da
 *   kaldırılamıyor, nedeni düğmenin ipucunda.
 * - İş akışları (Akislar.tsx): durakların sırası, sorumlusu, koşulu.
 * - Sürümler: yayınlanan her düzen; eskisi taslağa alınıp geri getirilebiliyor.
 * - Hesaplar (gerçek kip): davet, kayıt bağlantısı, hesap yetkileri.
 */

type Sekme =
  | "kisiler"
  | "birimler"
  | "akislar"
  | "surumler"
  | "hesaplar";

const SEKME_ADI: Record<Sekme, Anahtar> = {
  kisiler: "orgKisiler",
  birimler: "orgBirimler",
  akislar: "orgAkislar",
  surumler: "orgSurumler",
  hesaplar: "orgHesaplar",
};

/* Taslak üzerinde çalışan sekmeler: üstlerinde yayın çubuğu. */
const YAPI_SEKMELERI: Sekme[] = ["birimler", "akislar"];

export const orgSekmeleri = (ben: Kisi): Sekme[] => {
  const yapi = yapiDuzenleyebilir(ben);
  return [
    ...(yapi || hesapYetkisi(ben, "kisiDuzenle") ? (["kisiler"] as const) : []),
    ...(yapi ? (["birimler", "akislar", "surumler"] as const) : []),
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
  const acik = (
    sekmeler.includes(sekme as Sekme) ? sekme : sekmeler[0]
  ) as Sekme;
  return (
    <>
      <SayfaBasi ikon={<Building2 size={26} />} baslik={t("mOrganizasyon")} />
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
      {acik === "akislar" && <AkislarSekmesi ben={ben} />}
      {acik === "surumler" && <SurumlerSekmesi ben={ben} />}
      {acik === "hesaplar" && <Kullanicilar ben={ben} gomulu />}
    </>
  );
}

/* --- Taslak ve yayın --- */

function useTaslak(ben: Kisi) {
  const v = useVeri();
  const yayindaki = guncelYapi(v);
  const taslak = yapiTaslagi(v, ben);
  const farklar = yapiFarki(yayindaki, taslak);
  return {
    v,
    yayindaki,
    taslak,
    farklar,
    degistir: (f: (y: Yapi) => Yapi) => yapiTaslagiDegistir(ben, f),
  };
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
        : yaz(y.akislar.find((a) => a.id === d.id)?.ad) || d.id;
  const tur: Record<Degisiklik["tur"], Anahtar> = {
    birim: "birim",
    unvan: "orgUnvan",
    akis: "orgAkis",
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
  if (!farklar.length) return null;
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
  const [acik, setAcik] = useState<BirimTanimi | "yeni" | null>(null);
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
      <div className="org-birimler" data-birim-tablosu>
        {taslak.birimler.map((b) => (
          <BirimKarti key={b.id} ben={ben} birim={b} duzenle={() => setAcik(b)} />
        ))}
      </div>
      {acik && <BirimPenceresi ben={ben} birim={acik === "yeni" ? null : acik} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

function BirimKarti({ ben, birim: b, duzenle }: { ben: Kisi; birim: BirimTanimi; duzenle: () => void }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const [yeni, setYeni] = useState("");
  const [unvan, setUnvan] = useState<UnvanTanimi | null>(null);
  const etki = birimEtkisi(taslak, v.kisiler, b.id);
  const yerlesik = yerlesikBirim(b.id);
  const unvanlar = birimUnvanlari(b.id, taslak);
  const kisiSayisi = (id: string) => v.kisiler.filter((k) => k.birim === b.id && k.gorev === id).length;
  const durakSayisi = (id: string) =>
    taslak.akislar.flatMap((a) => a.duraklar).filter((d) => d.sorumlu.tur === "unvan" && d.sorumlu.unvan === id && (!d.sorumlu.birim || d.sorumlu.birim === b.id)).length;
  // Başka birimdeki ünvan adıyla yazılırsa yenisi açılmıyor, aynı ünvan ekleniyor.
  const baskaBirimde = taslak.unvanlar.filter((u) => !unvanlar.includes(u.id));
  const ekle = (e: FormEvent) => {
    e.preventDefault();
    const ad = yeni.trim();
    if (!ad) return;
    const aranan = ad.toLocaleLowerCase();
    const var_ = taslak.unvanlar.find((u) => (["tr", "ar", "en"] as const).some((d) => gorevAdiDilde(u.id, d, taslak).toLocaleLowerCase() === aranan));
    if (var_ && unvanlar.includes(var_.id)) return setYeni("");
    degistir((y) => birimeUnvanEkle(y, b.id, var_ ? var_.id : { id: kimlik("u"), ad: { tr: ad, ar: ad, en: ad }, birimler: [b.id] }));
    setYeni("");
  };
  return (
    <section className={`org-birim${b.gizli ? " soluk" : ""}`} data-birim-satiri={b.id}>
      <header>
        <div>
          <b>{birimAdi(b.id, taslak)}</b> {b.gizli && <Rozet>{t("orgGizli")}</Rozet>}
          <small className="sonuk-yazi">
            {t("orgKisiSayisi", { n: etki.kisiler })} · {yerlesik ? t("orgYerlesik") : b.ornek ? t("orgGibi", { birim: birimAdi(b.ornek, taslak) }) : t("orgOrneksiz")}
          </small>
        </div>
        <div className="dugmeler">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={duzenle} data-birim-duzenle={b.id}>
            <Pencil size={14} /> {t("duzenle")}
          </button>
          <button
            type="button"
            className="dugme dugme-sade dugme-kucuk"
            onClick={() => degistir((y) => birimGuncelle(y, b.id, (x) => ({ ...x, gizli: !x.gizli || undefined })))}
            data-birim-gizle={b.id}
          >
            {b.gizli ? <Eye size={14} /> : <EyeOff size={14} />} {t(b.gizli ? "orgGoster" : "orgGizle")}
          </button>
          {!yerlesik && (
            <SinirliDugme
              className="dugme dugme-sade dugme-kucuk kotu-yazi"
              izin={silinebilir(etki)}
              neden={t("orgSilinemez", { kisi: etki.kisiler, durak: etki.duraklar })}
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
            <li key={id} data-unvan={id}>
              <span className="kidem">{i + 1}</span>
              <span className="unvan-adi">
                <b>{gorevAdi(id, taslak)}</b>
                {/* Ekip görevi kurumun terimi: her arayüz dilinde çıktıdaki Arapçasıyla. */}
                {u.ekipGorevi && (
                  <small lang="ar" dir="rtl">
                    {metin(EKIP_GOREV_ADI[u.ekipGorevi], "ar")}
                  </small>
                )}
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
        <input value={yeni} onChange={(e) => setYeni(e.target.value)} list={`unvanlar-${b.id}`} aria-label={t("orgUnvanEkle")} data-unvan-yeni={b.id} />
        <datalist id={`unvanlar-${b.id}`}>
          {baskaBirimde.map((u) => (
            <option key={u.id} value={gorevAdi(u.id, taslak)} />
          ))}
        </datalist>
        <button type="submit" className="dugme dugme-ikincil dugme-kucuk" disabled={!yeni.trim()} data-unvan-ekle={b.id}>
          <Plus size={14} /> {t("orgUnvanEkle")}
        </button>
      </form>
      {unvan && <UnvanPenceresi ben={ben} unvan={unvan} kapat={() => setUnvan(null)} />}
    </section>
  );
}

/* Ünvanın bir dildeki adı (adla eşleştirmek için): yöneticinin verdiği, yoksa dil tablosundaki. */
const gorevAdiDilde = (id: string, d: "tr" | "ar" | "en", y: Yapi) => {
  const u = y.unvanlar.find((x) => x.id === id);
  if (u?.ad) return yaz(u.ad, d);
  return yerlesikGorev(id) ? metin(GOREV_ADI[id as Gorev], d) : id;
};

function BirimPenceresi({ ben, birim, kapat }: { ben: Kisi; birim: BirimTanimi | null; kapat: () => void }) {
  const { t } = useDil();
  const { degistir } = useTaslak(ben);
  const yerlesik = !!birim && yerlesikBirim(birim.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(birim?.ad) ? birim.ad : undefined);
  const [ornek, setOrnek] = useState<Birim | "">(birim?.ornek ?? "");
  const temiz = adTemizle(ad);
  const hazir = yerlesik || !!temiz;
  const kaydet = () => {
    if (!hazir) return;
    if (!birim) {
      const yeni: BirimTanimi = { id: kimlik("b"), ad: temiz, unvanlar: [], ...(ornek ? { ornek } : {}) };
      degistir((y) => ({ ...y, birimler: [...y.birimler, yeni] }));
    } else
      degistir((y) =>
        birimGuncelle(y, birim.id, (x) => {
          const { ad: _, ornek: __, ...kalan } = x;
          return { ...kalan, ...(temiz ? { ad: temiz } : {}), ...(!yerlesik && ornek ? { ornek } : {}) };
        }),
      );
    kapat();
  };
  const varsayilan = yerlesik ? dilde(BIRIM_ADI[birim.id as Birim]) : undefined;
  return (
    <Pencere
      baslik={birim ? birimAdi(birim.id) : t("orgBirimEkle")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-birim-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-birim-formu>
        <AdAlanlari deger={ad} varsayilan={varsayilan} degistir={setAd} />
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
  const { degistir } = useTaslak(ben);
  const yerlesik = yerlesikGorev(unvan.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(unvan.ad) ? unvan.ad : undefined);
  const [ekip, setEkip] = useState<EkipGorevi | "">(unvan.ekipGorevi ?? "");
  const temiz = adTemizle(ad);
  const hazir = yerlesik || !!temiz;
  const kaydet = () => {
    if (!hazir) return;
    degistir((y) =>
      unvanGuncelle(y, unvan.id, (x) => {
        const { ad: _, ekipGorevi: __, ...kalan } = x;
        return { ...kalan, ...(ekip ? { ekipGorevi: ekip } : {}), ...(temiz ? { ad: temiz } : {}) };
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
        <label>
          {t("orgEkipGorevi")}
          <select value={ekip} onChange={(e) => setEkip(e.target.value as EkipGorevi | "")} data-unvan-ekip>
            <option value="">—</option>
            {EKIP_GOREVLERI.map((g) => (
              <option key={g} value={g} lang="ar">
                {metin(EKIP_GOREV_ADI[g], "ar")}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Pencere>
  );
}

/* --- Kişiler: birim → ünvan ağacı, tayin --- */

function KisilerSekmesi({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [aranan, setAranan] = useState("");
  const [tayin, setTayin] = useState<Kisi | null>(null);
  const tayinEder = hesapYetkisi(ben, "kisiDuzenle");
  const ara = aranan.trim().toLocaleLowerCase();
  const uyan = (k: Kisi) =>
    !ara ||
    [yaz(k.ad, "tr"), yaz(k.ad, "ar"), yaz(k.ad, "en"), k.eposta ?? ""].some(
      (x) => x.toLocaleLowerCase().includes(ara),
    );
  const kisiler = v.kisiler.filter(uyan);
  // Gizli birimde ya da yapıdan çıkmış birimde kalan kişi de görünsün: yönetici onu tayin etsin.
  const birimler = [
    ...birimListesi(),
    ...new Set(kisiler.map((k) => k.birim)),
  ].filter(
    (b, i, a) => a.indexOf(b) === i && kisiler.some((k) => k.birim === b),
  );
  return (
    <Kart baslik={t("orgKisiler")} ek={String(kisiler.length)}>
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
      {!birimler.length && <Bos kucuk metin={t("kisiYok")} />}
      <div className="org-agac" data-org-agac>
        {birimler.map((b) => {
          const birimdekiler = kisiler.filter((k) => k.birim === b);
          // Ünvan grupları birimin kıdem sırasıyla; listede olmayan ünvandaki kişi sonda.
          const sira = birimUnvanlari(b);
          const unvanlar = [...new Set(birimdekiler.map((k) => k.gorev))].sort((x, y) => (sira.indexOf(x) + 1 || 999) - (sira.indexOf(y) + 1 || 999));
          return (
            <details
              key={b}
              open={!!ara || birimler.length <= 3}
              data-org-birim={b}
            >
              <summary>
                <b>{birimAdi(b)}</b>{" "}
                <em className="sonuk-yazi">{birimdekiler.length}</em>
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
                        <li key={k.id} data-org-kisi={k.id}>
                          <Avatar kisi={k} boy="kucuk" />
                          <div className="ad">
                            <a href={`#/personel/${k.id}`}>{ad(k)}</a>
                            <small>
                              {k.rol === "yonetici" && (
                                <Rozet ton="koyu">{t("rolYonetici")}</Rozet>
                              )}{" "}
                              {k.hesapsiz && <Rozet>{t("hesapYok")}</Rozet>}
                            </small>
                          </div>
                          {tayinEder && (
                            <button
                              type="button"
                              className="dugme dugme-sade dugme-kucuk"
                              onClick={() => setTayin(k)}
                              data-tayin={k.id}
                            >
                              <UserCog size={14} /> {t("orgTayin")}
                            </button>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </details>
          );
        })}
      </div>
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
