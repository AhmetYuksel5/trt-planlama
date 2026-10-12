import { Building2, Eye, EyeOff, History, Pencil, Plus, Search, Trash2, Undo2, Upload, UserCog } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Bos, Kart, NotKutu, Pencere, Rozet, bildir } from "../../bilesenler/Parcalar";
import { metin, tarihYaz, saatYaz, useDil, yaz, type Anahtar, type Metin, type Yazi } from "../../dil";
import { BIRIM_ADI, EKIP_GOREV_ADI, GOREV_ADI } from "../../etiketler";
import { yapiSurumunuTaslagaAl, yapiTaslagi, yapiTaslagiDegistir, yapiTaslaginiAt, yapiYayinla } from "../../eylemler";
import { GERCEK } from "../../kip";
import { yerelGun } from "../../tarih";
import { BIRIMLER, EKIP_GOREVLERI, kimlik, kisiBul, useVeri, type Birim, type BirimId, type EkipGorevi, type Gorev, type Kisi } from "../../veri";
import {
  birimAdi,
  birimEtkisi,
  birimGuncelle,
  birimListesi,
  gorevAdi,
  guncelYapi,
  silinebilir,
  unvanEtkisi,
  unvanGuncelle,
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

/**
 * Organizasyon: kurumun yapısı yöneticinin elinde.
 *
 * - Kişiler: birim → ünvan ağacında herkes; tayin (birim, ünvan, rol)
 *   hemen geçerli, geçmişe yazılıyor.
 * - Birimler ve Ünvanlar: taslakta düzenleniyor, "Yayınla" ile yeni sürüm
 *   oluyor (yapi.ts). Yerleşik birim ve ünvan silinmiyor, gizleniyor; kişisi
 *   ya da durağı olan da öyle. Silmeden önce dokunduğu kayıt söyleniyor.
 * - Sürümler: yayınlanan her düzen; eskisi taslağa alınıp geri getirilebiliyor.
 * - Hesaplar (gerçek kip): davet, kayıt bağlantısı, hesap yetkileri.
 */

type Sekme = "kisiler" | "birimler" | "unvanlar" | "surumler" | "hesaplar";

const SEKME_ADI: Record<Sekme, Anahtar> = {
  kisiler: "orgKisiler",
  birimler: "orgBirimler",
  unvanlar: "orgUnvanlar",
  surumler: "orgSurumler",
  hesaplar: "orgHesaplar",
};

/* Taslak üzerinde çalışan sekmeler: üstlerinde yayın çubuğu. */
const YAPI_SEKMELERI: Sekme[] = ["birimler", "unvanlar"];

export const orgSekmeleri = (ben: Kisi): Sekme[] => {
  const yapi = yapiDuzenleyebilir(ben);
  return [
    ...(yapi || hesapYetkisi(ben, "kisiDuzenle") ? (["kisiler"] as const) : []),
    ...(yapi ? (["birimler", "unvanlar", "surumler"] as const) : []),
    ...(GERCEK && (ben.hesapYoneticisi || ben.yetkiler?.length) ? (["hesaplar"] as const) : []),
  ];
};

export default function Organizasyon({ ben, sekme }: { ben: Kisi; sekme?: string }) {
  const { t } = useDil();
  const sekmeler = orgSekmeleri(ben);
  const acik = (sekmeler.includes(sekme as Sekme) ? sekme : sekmeler[0]) as Sekme;
  return (
    <>
      <SayfaBasi ikon={<Building2 size={26} />} baslik={t("mOrganizasyon")} />
      <div className="sekmeler ara-alt-2" role="tablist" aria-label={t("mOrganizasyon")}>
        {sekmeler.map((s) => (
          <a key={s} role="tab" href={`#/organizasyon/${s}`} aria-selected={acik === s} className={acik === s ? "acik" : ""} data-org-sekme={s}>
            {t(SEKME_ADI[s])}
          </a>
        ))}
      </div>
      {YAPI_SEKMELERI.includes(acik) && <TaslakCubugu ben={ben} />}
      {acik === "kisiler" && <KisilerSekmesi ben={ben} />}
      {acik === "birimler" && <BirimlerSekmesi ben={ben} />}
      {acik === "unvanlar" && <UnvanlarSekmesi ben={ben} />}
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
  return { v, yayindaki, taslak, farklar, degistir: (f: (y: Yapi) => Yapi) => yapiTaslagiDegistir(ben, f) };
}

function DegisiklikAdi({ d, yayindaki, taslak }: { d: Degisiklik; yayindaki: Yapi; taslak: Yapi }) {
  const { t } = useDil();
  const y = d.islem === "silindi" ? yayindaki : taslak;
  const ad = d.tur === "birim" ? birimAdi(d.id, y) : d.tur === "unvan" ? gorevAdi(d.id, y) : yaz(y.akislar.find((a) => a.id === d.id)?.ad) || d.id;
  const tur: Record<Degisiklik["tur"], Anahtar> = { birim: "birim", unvan: "orgUnvan", akis: "orgAkis" };
  const islem: Record<Degisiklik["islem"], Anahtar> = { eklendi: "orgEklendi", degisti: "orgDegisti", silindi: "orgSilindi" };
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
        <Rozet ton="uyari">{t("orgTaslak")}</Rozet> {t("orgDegisiklikSayisi", { n: farklar.length })}
      </span>
      <div className="dugmeler">
        <button
          type="button"
          className="dugme dugme-ikincil dugme-kucuk"
          onClick={() => confirm(t("orgTaslakAtilsinMi")) && yapiTaslaginiAt(ben)}
          data-taslak-at
        >
          <Undo2 size={14} /> {t("orgTaslagiAt")}
        </button>
        <button type="button" className="dugme dugme-kucuk" onClick={() => setYayin(true)} data-yapi-yayinla>
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
            <input dir="auto" value={not} onChange={(e) => setNot(e.target.value)} data-yayin-notu />
          </label>
        </Pencere>
      )}
    </div>
  );
}

/* --- Ad: üç dilde; yerleşikte boş bırakılan dil tablosundaki adı kullanıyor --- */

const metinMi = (x: Yazi | undefined): x is Metin => !!x && typeof x !== "string";

function AdAlanlari({ deger, varsayilan, degistir }: { deger: Yazi | undefined; varsayilan?: Metin; degistir: (m: Metin) => void }) {
  const { t } = useDil();
  const m: Metin = metinMi(deger) ? deger : { tr: deger ?? "", ar: deger ?? "", en: deger ?? "" };
  return (
    <>
      <label>
        {t("adTurkce")}
        <input value={m.tr} placeholder={varsayilan?.tr} onChange={(e) => degistir({ ...m, tr: e.target.value })} data-ad-tr />
      </label>
      <label>
        {t("adArapca")}
        <input dir="rtl" lang="ar" value={m.ar} placeholder={varsayilan?.ar} onChange={(e) => degistir({ ...m, ar: e.target.value })} data-ad-ar />
      </label>
      <label>
        {t("adIngilizce")}
        <input dir="ltr" value={m.en} placeholder={varsayilan?.en} onChange={(e) => degistir({ ...m, en: e.target.value })} data-ad-en />
      </label>
    </>
  );
}

/* Boş dil Türkçeden; hepsi boşsa ad yok (yerleşikte dil tablosundaki ada dönüyor). */
const adTemizle = (m: Metin | undefined): Metin | undefined => {
  if (!m) return undefined;
  const tr = m.tr.trim() || m.en.trim() || m.ar.trim();
  if (!tr) return undefined;
  return { tr, ar: m.ar.trim() || tr, en: m.en.trim() || tr };
};

/** Sınırdaki düğme: pasif görünür, odaklanır, nedeni ipucunda (CLAUDE.md: aria-disabled). */
function SinirliDugme({ izin, neden, onClick, children, ...p }: { izin: boolean; neden: string; onClick: () => void; children: ReactNode; className?: string; "data-sil"?: string }) {
  return (
    <button type="button" className={p.className} aria-disabled={!izin} title={izin ? undefined : neden} onClick={() => izin && onClick()} data-sil={p["data-sil"]}>
      {children}
    </button>
  );
}

/* --- Birimler --- */

function BirimlerSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
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
      <table className="tablo kartli" data-birim-tablosu>
        <thead>
          <tr>
            <th>{t("birim")}</th>
            <th>{t("orgKisi")}</th>
            <th>{t("orgCalisma")}</th>
            <th>{t("durum")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {taslak.birimler.map((b) => {
            const etki = birimEtkisi(taslak, v.kisiler, b.id);
            const yerlesik = yerlesikBirim(b.id);
            return (
              <tr key={b.id} data-birim-satiri={b.id} className={b.gizli ? "soluk" : ""}>
                <td className="birincil" data-etiket={t("birim")}>
                  <b>{birimAdi(b.id, taslak)}</b>
                </td>
                <td data-etiket={t("orgKisi")}>{etki.kisiler}</td>
                <td data-etiket={t("orgCalisma")}>{yerlesik ? t("orgYerlesik") : b.ornek ? t("orgGibi", { birim: birimAdi(b.ornek, taslak) }) : t("orgOrneksiz")}</td>
                <td data-etiket={t("durum")}>{b.gizli ? <Rozet>{t("orgGizli")}</Rozet> : <Rozet ton="iyi">{t("orgGorunur")}</Rozet>}</td>
                <td className="islem-hucre">
                  <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setAcik(b)} data-birim-duzenle={b.id}>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {acik && <BirimPenceresi ben={ben} birim={acik === "yeni" ? null : acik} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

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
      const yeni: BirimTanimi = { id: kimlik("b"), ad: temiz, ...(ornek ? { ornek } : {}) };
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

/* Yerleşiğin dil tablosundaki adı üç dilde (yer tutucu): yöneticinin verdiği ad değil. */
const dilde = (k: Anahtar): Metin => ({ tr: metin(k, "tr"), ar: metin(k, "ar"), en: metin(k, "en") });

/* --- Ünvanlar --- */

function UnvanlarSekmesi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const { v, taslak, degistir } = useTaslak(ben);
  const [acik, setAcik] = useState<UnvanTanimi | "yeni" | null>(null);
  return (
    <Kart
      baslik={t("orgUnvanlar")}
      ek={String(taslak.unvanlar.length)}
      sagUc={
        <button type="button" className="dugme dugme-kucuk" onClick={() => setAcik("yeni")} data-unvan-ekle>
          <Plus size={14} /> {t("orgUnvanEkle")}
        </button>
      }
    >
      <table className="tablo kartli" data-unvan-tablosu>
        <thead>
          <tr>
            <th>{t("orgUnvan")}</th>
            <th>{t("orgBirimlerde")}</th>
            <th>{t("orgEkipGorevi")}</th>
            <th>{t("orgKisi")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {taslak.unvanlar.map((u) => {
            const etki = unvanEtkisi(taslak, v.kisiler, u.id);
            return (
              <tr key={u.id} data-unvan-satiri={u.id} className={u.gizli ? "soluk" : ""}>
                <td className="birincil" data-etiket={t("orgUnvan")}>
                  <b>{gorevAdi(u.id, taslak)}</b> {u.gizli && <Rozet>{t("orgGizli")}</Rozet>}
                </td>
                <td data-etiket={t("orgBirimlerde")}>{u.birimler.length ? u.birimler.map((b) => birimAdi(b, taslak)).join(", ") : t("orgHerBirim")}</td>
                <td data-etiket={t("orgEkipGorevi")}>
                  {/* Ekip görevi kurumun terimi: her arayüz dilinde çıktıdaki Arapçasıyla. */}
                  {u.ekipGorevi ? <bdi lang="ar">{metin(EKIP_GOREV_ADI[u.ekipGorevi], "ar")}</bdi> : "—"}
                </td>
                <td data-etiket={t("orgKisi")}>{etki.kisiler}</td>
                <td className="islem-hucre">
                  <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setAcik(u)} data-unvan-duzenle={u.id}>
                    <Pencil size={14} /> {t("duzenle")}
                  </button>
                  <button
                    type="button"
                    className="dugme dugme-sade dugme-kucuk"
                    onClick={() => degistir((y) => unvanGuncelle(y, u.id, (x) => ({ ...x, gizli: !x.gizli || undefined })))}
                    data-unvan-gizle={u.id}
                  >
                    {u.gizli ? <Eye size={14} /> : <EyeOff size={14} />} {t(u.gizli ? "orgGoster" : "orgGizle")}
                  </button>
                  {!yerlesikGorev(u.id) && (
                    <SinirliDugme
                      className="dugme dugme-sade dugme-kucuk kotu-yazi"
                      izin={silinebilir(etki)}
                      neden={t("orgSilinemez", { kisi: etki.kisiler, durak: etki.duraklar })}
                      onClick={() => confirm(t("orgSilinsinMi", { ad: gorevAdi(u.id, taslak) })) && degistir((y) => ({ ...y, unvanlar: y.unvanlar.filter((x) => x.id !== u.id) }))}
                      data-sil={u.id}
                    >
                      <Trash2 size={14} /> {t("sil")}
                    </SinirliDugme>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {acik && <UnvanPenceresi ben={ben} unvan={acik === "yeni" ? null : acik} kapat={() => setAcik(null)} />}
    </Kart>
  );
}

function UnvanPenceresi({ ben, unvan, kapat }: { ben: Kisi; unvan: UnvanTanimi | null; kapat: () => void }) {
  const { t } = useDil();
  const { taslak, degistir } = useTaslak(ben);
  const yerlesik = !!unvan && yerlesikGorev(unvan.id);
  const [ad, setAd] = useState<Metin | undefined>(metinMi(unvan?.ad) ? unvan.ad : undefined);
  const [birimler, setBirimler] = useState<BirimId[]>(unvan?.birimler ?? []);
  const [ekip, setEkip] = useState<EkipGorevi | "">(unvan?.ekipGorevi ?? "");
  const temiz = adTemizle(ad);
  const hazir = yerlesik || !!temiz;
  const kaydet = () => {
    if (!hazir) return;
    const govde = { birimler, ...(ekip ? { ekipGorevi: ekip } : {}), ...(temiz ? { ad: temiz } : {}) };
    if (!unvan) degistir((y) => ({ ...y, unvanlar: [...y.unvanlar, { id: kimlik("u"), ...govde }] }));
    else
      degistir((y) =>
        unvanGuncelle(y, unvan.id, (x) => {
          const { ad: _, ekipGorevi: __, ...kalan } = x;
          return { ...kalan, ...govde };
        }),
      );
    kapat();
  };
  const varsayilan = yerlesik ? dilde(GOREV_ADI[unvan.id as Gorev]) : undefined;
  return (
    <Pencere
      baslik={unvan ? gorevAdi(unvan.id) : t("orgUnvanEkle")}
      kapat={kapat}
      altBilgi={
        <button className="dugme" disabled={!hazir} onClick={kaydet} data-unvan-kaydet>
          {t("kaydet")}
        </button>
      }
    >
      <div className="form" data-unvan-formu>
        <AdAlanlari deger={ad} varsayilan={varsayilan} degistir={setAd} />
        <fieldset className="yetki-listesi">
          <legend>{t("orgBirimlerde")}</legend>
          {birimListesi(undefined, taslak).map((b) => (
            <label key={b} className="secim">
              <input type="checkbox" checked={birimler.includes(b)} onChange={(e) => setBirimler(e.target.checked ? [...birimler, b] : birimler.filter((x) => x !== b))} data-unvan-birim={b} />
              {birimAdi(b, taslak)}
            </label>
          ))}
        </fieldset>
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
  const uyan = (k: Kisi) => !ara || [yaz(k.ad, "tr"), yaz(k.ad, "ar"), yaz(k.ad, "en"), k.eposta ?? ""].some((x) => x.toLocaleLowerCase().includes(ara));
  const kisiler = v.kisiler.filter(uyan);
  // Gizli birimde ya da yapıdan çıkmış birimde kalan kişi de görünsün: yönetici onu tayin etsin.
  const birimler = [...birimListesi(), ...new Set(kisiler.map((k) => k.birim))].filter((b, i, a) => a.indexOf(b) === i && kisiler.some((k) => k.birim === b));
  return (
    <Kart baslik={t("orgKisiler")} ek={String(kisiler.length)}>
      <label className="arama ara-alt-2">
        <Search size={16} />
        <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("kisiAra")} aria-label={t("kisiAra")} data-org-ara />
      </label>
      {!birimler.length && <Bos kucuk metin={t("kisiYok")} />}
      <div className="org-agac" data-org-agac>
        {birimler.map((b) => {
          const birimdekiler = kisiler.filter((k) => k.birim === b);
          const unvanlar = [...new Set(birimdekiler.map((k) => k.gorev))];
          return (
            <details key={b} open={!!ara || birimler.length <= 3} data-org-birim={b}>
              <summary>
                <b>{birimAdi(b)}</b> <em className="sonuk-yazi">{birimdekiler.length}</em>
              </summary>
              {unvanlar.map((g) => (
                <div key={g} className="org-unvan" data-org-unvan={g}>
                  <h4>
                    {gorevAdi(g)} <em className="sonuk-yazi">{birimdekiler.filter((k) => k.gorev === g).length}</em>
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
                              {k.rol === "yonetici" && <Rozet ton="koyu">{t("rolYonetici")}</Rozet>} {k.hesapsiz && <Rozet>{t("hesapYok")}</Rozet>}
                            </small>
                          </div>
                          {tayinEder && (
                            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setTayin(k)} data-tayin={k.id}>
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
      {tayin && <PozisyonPenceresi ben={ben} kisi={kisiBul(v, tayin.id) ?? tayin} kapat={() => setTayin(null)} />}
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
          {t("orgSurum", { n: y.surum })} {y.surum === yayindaki.surum && <Rozet ton="iyi">{t("orgYayinda")}</Rozet>}
        </b>
        <small className="sonuk-yazi">
          {y.surum === 0 ? t("orgBaslangic") : `${tarihYaz(yerelGun(y.zaman), dil, "kisa")} ${saatYaz(y.zaman, dil)} · ${ad(kisiBul(v, y.yayinlayan))}`}
        </small>
        {y.not && <small dir="auto">{y.not}</small>}
      </div>
      {y.surum !== yayindaki.surum && (
        <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => al(y.surum)} data-surume-don={y.surum}>
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
