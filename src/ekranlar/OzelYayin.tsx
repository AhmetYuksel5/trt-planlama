import { AlertTriangle, Check, CheckCircle, Circle, ClipboardList, History, Mic, Package, Pencil, Plane, Plus, Trash2, Tv, Undo2, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, Bos, Icerik, Ilerleme, Kart, Pencere, Rozet, TbcKutusu, bildir, icerikAlani } from "../bilesenler/Parcalar";
import { aralikYaz, saatYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { GOREVLENDIRME_DURUM_ADI, HAREKET_TURU_ADI, TUR_ADI } from "../etiketler";
import {
  konukKaydet,
  konukSil,
  nafizeDurumu,
  nafizeKaydet,
  ozelDurumu,
  ozelGorevlendirme,
  ozelHazirlikEkle,
  ozelHazirlikIsaretle,
  ozelKalemNotu,
  ozelKalemSil,
  ozelKunyeKaydet,
  ozelOlustur,
  ozelPaketAta,
  ozelPaketTalebi,
  ozelTalepDurumu,
  ozelTalepKaydet,
  paketTamamla,
  type OzelKunye,
} from "../eylemler";
import { gecikti, ozelGecti, ozelGorevlendirmeleri, ozelOzeti, ozelPaketleri, yapilacaklar, OZEL_KALEM_TURLERI, type OzelKalemTuru } from "../ozel";
import { bugun } from "../tarih";
import {
  HAREKET_TURLERI,
  ICERIK_TURLERI,
  KONUK_DURUMLARI,
  NAFIZE_DURUMLARI,
  TALEP_DURUMLARI,
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
  type OzelIz,
  type OzelTalep,
  type OzelYayin,
  type Paket,
  type TalepDurum,
} from "../veri";
import { altindaMi, birimAdi, birimListesi, grupMu } from "../yapi";
import { ozelDuzenler, ozelPaketDagitabilir, paketTamamlayabilir, planAdimiYapabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";
import { BicimSecici, FormAlt, MuhabirSecici } from "./nextday/Formlar";
import { AdimYetkilileri } from "./organizasyon/PlanYetkileri";

/**
 * Özel yayın: liste (#/ozel) ve plan (#/ozel/:id).
 *
 * Planlama hazırlıyor: başlık ve genel plan, nafizeler (konuklu canlı
 * yayın) ve konukları, paket talepleri (in-house: Output müdürü dağıtıyor;
 * dış muhabir: kişisel, son tarihli), grafik gibi öbür talepler, dış
 * görevlendirmeler (genel görevlendirme kaydında, News Gathering'in
 * onayıyla) ve hazırlık maddeleri. Her kalemin durumu ve izi (kim, ne
 * zaman, not) yerinde; üstteki özet yapılanı ve yapılacağı sayıyor, yayın
 * günlere yayılsa da iş unutulmasın. Newsdesk şimdilik bu akışta yok.
 */

const NAFIZE_DURUM_ADI: Record<NafizeDurum, Anahtar> = { planlandi: "oyNfPlanlandi", hazir: "oyNfHazir", yapildi: "oyNfYapildi", iptal: "oyNfIptal" };
const KONUK_DURUM_ADI: Record<KonukDurum, Anahtar> = { aday: "oyKnAday", davetEdildi: "oyKnDavet", teyitli: "oyKnTeyit", iptal: "oyKnIptal" };
const TALEP_DURUM_ADI: Record<TalepDurum, Anahtar> = { acik: "oyTlAcik", suruyor: "oyTlSuruyor", tamam: "oyTlTamam", iptal: "oyTlIptal" };
const KALEM_TURU_ADI: Record<OzelKalemTuru, Anahtar> = { nafize: "oyNafizeler", paket: "oyPaketler", talep: "oyTalepler", gorev: "oyGorevler", hazirlik: "oyHazirlik" };
const KALEM_IKONU: Record<OzelKalemTuru, ReactNode> = {
  nafize: <Mic size={15} />,
  paket: <Package size={15} />,
  talep: <ClipboardList size={15} />,
  gorev: <Plane size={15} />,
  hazirlik: <CheckCircle size={15} />,
};
const DURUM_TONU: Record<string, string> = { yapildi: "iyi", tamam: "iyi", teyitli: "iyi", hazir: "vurgu", suruyor: "vurgu", davetEdildi: "vurgu", iptal: "kotu" };

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
          : d === "onayli"
            ? "oyDurumOnayli"
            : d === "hazirlik"
              ? "oyDurumHazirlik"
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

const OzelDurumRozeti = ({ o }: { o: OzelYayin }) => {
  const { t } = useDil();
  return o.durum === "onayli" ? <Rozet ton="iyi">{t("oyDurumOnayli")}</Rozet> : <Rozet ton="uyari">{t("oyDurumHazirlik")}</Rozet>;
};

function KunyePenceresi({ ben, o, kapat }: { ben: Kisi; o?: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState<OzelKunye>({ ad: o?.ad ?? "", tarih: o?.tarih ?? bugun(), bitis: o?.bitis ?? "", aciklama: o?.aciklama ?? "" });
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
          {duzen && (
            <button className="dugme dugme-sade dugme-ikon" onClick={() => setKunye(true)} title={t("duzenle")} aria-label={t("duzenle")} data-ozel-kunye-duzenle>
              <Pencil size={15} />
            </button>
          )}
        </div>
        <p className="sonuk-yazi">{yayinAraligi(o, dil)}</p>
        {o.aciklama && (
          <Icerik blok className="ozel-aciklama">
            {o.aciklama}
          </Icerik>
        )}
      </section>
      <OzetKarti o={o} d={v} />
      <Nafizeler ben={ben} o={o} />
      <Paketler ben={ben} o={o} />
      <Talepler ben={ben} o={o} />
      <Gorevlendirmeler ben={ben} o={o} />
      <Hazirlik ben={ben} o={o} />
      <DurumKarti ben={ben} o={o} />
      {kunye && <KunyePenceresi ben={ben} o={o} kapat={() => setKunye(false)} />}
    </div>
  );
}

function OzetKarti({ o, d }: { o: OzelYayin; d: Durum }) {
  const { t, dil, ad } = useDil();
  const oz = ozelOzeti(o, d);
  const bekleyen = yapilacaklar(o, d);
  return (
    <Kart baslik={t("oyOzet")} ikon={<ClipboardList size={18} />} ek={t("oyYapilan", { b: oz.biten, n: oz.toplam })}>
      <ul className="ozel-ozet" data-ozel-ozet>
        {OZEL_KALEM_TURLERI.filter((x) => oz.tur[x].toplam).map((x) => (
          <li key={x} data-ozet-tur={x}>
            {KALEM_IKONU[x]} {t(KALEM_TURU_ADI[x])} <b>{`${oz.tur[x].biten}/${oz.tur[x].toplam}`}</b>
          </li>
        ))}
      </ul>
      <h3 className="alan-etiket ara-ust-2">
        {t("oyYapilacaklar")}
        {oz.geciken > 0 && (
          <span className="kotu-yazi">
            {" · "}
            {t("oyGeciken", { n: oz.geciken })}
          </span>
        )}
      </h3>
      {bekleyen.length === 0 ? (
        <Bos kucuk metin={t("oyYapilacakYok")} />
      ) : (
        <ul className="liste" data-ozel-yapilacaklar>
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
    </Kart>
  );
}

/* --- Kalemin izi: kim, ne zaman, ne yaptı; not --- */

function IzListesi({ iz }: { iz: OzelIz[] }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  return (
    <ol className="ozel-iz">
      {[...iz].reverse().map((x, i) => {
        const kisi = kisiBul(v, x.kisiId);
        const da = durumAdi(x.durum);
        return (
          <li key={i}>
            <Avatar kisi={kisi} boy="kucuk" />
            <div>
              <small>
                <b>{ad(kisi)}</b> · {tarihYaz(x.zaman.slice(0, 10), dil, "kisa")} {saatYaz(x.zaman, dil)}
              </small>
              <span>
                {t(x.olay === "eklendi" ? "oyIzEklendi" : x.olay === "duzenlendi" ? "oyIzDuzenlendi" : x.olay === "durum" ? "oyIzDurum" : "oyIzNot")}
                {da && <> {t(da)}</>}
              </span>
              {x.not && (
                <span className="ozel-iz-not" dir="auto">
                  {x.not}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* Kalemin altındaki "Geçmiş ve notlar": iz ve not kutusu. */
function KalemGecmisi({ ben, o, tur, id, iz }: { ben: Kisi; o: OzelYayin; tur: "nafizeler" | "talepler"; id: string; iz: OzelIz[] }) {
  const { t } = useDil();
  const [not, setNot] = useState("");
  return (
    <details className="ozel-gecmis">
      <summary>
        <History size={14} /> {t("oyGecmis")} <span className="sonuk-yazi">({iz.length})</span>
      </summary>
      {ozelDuzenler(ben) && (
        <div className="ozel-not-satiri">
          <input value={not} onChange={(e) => setNot(e.target.value)} placeholder={t("oyNotYaz")} dir="auto" aria-label={t("oyNotEkle")} data-ozel-not />
          <button className="dugme dugme-ikincil dugme-kucuk" disabled={!not.trim()} onClick={() => ozelKalemNotu(ben, o.id, tur, id, not) && setNot("")} data-ozel-not-ekle>
            {t("oyNotEkle")}
          </button>
        </div>
      )}
      <IzListesi iz={iz} />
    </details>
  );
}

function DurumSecimi<T extends string>({ deger, liste, adlar, degistir, devre, etiket }: { deger: T; liste: readonly T[]; adlar: Record<T, Anahtar>; degistir: (x: T) => void; devre: boolean; etiket: string }) {
  const { t } = useDil();
  if (devre) return <Rozet ton={DURUM_TONU[deger]}>{t(adlar[deger])}</Rozet>;
  return (
    <select className={`durum-secimi ton-${DURUM_TONU[deger] ?? "yok"}`} value={deger} onChange={(e) => degistir(e.target.value as T)} aria-label={etiket} data-durum-secimi>
      {liste.map((x) => (
        <option key={x} value={x}>
          {t(adlar[x])}
        </option>
      ))}
    </select>
  );
}

/* --- Nafizeler ve konuklar --- */

function Nafizeler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const [form, setForm] = useState<Nafize | "yeni" | null>(null);
  const liste = [...(o.nafizeler ?? [])].sort((a, b) => `${a.tarih} ${a.saat ?? ""}`.localeCompare(`${b.tarih} ${b.saat ?? ""}`));
  return (
    <Kart
      baslik={t("oyNafizeler")}
      ikon={<Mic size={18} />}
      ek={String(liste.length)}
      sagUc={
        ozelDuzenler(ben) && (
          <button className="dugme dugme-kucuk" onClick={() => setForm("yeni")} data-nafize-ekle>
            <Plus size={14} /> {t("oyNafizeEkle")}
          </button>
        )
      }
    >
      {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      <div className="ozel-kalemler">
        {liste.map((n) => (
          <NafizeKarti key={n.id} ben={ben} o={o} n={n} duzenle={() => setForm(n)} />
        ))}
      </div>
      {form && <NafizePenceresi ben={ben} o={o} n={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </Kart>
  );
}

function NafizeKarti({ ben, o, n, duzenle }: { ben: Kisi; o: OzelYayin; n: Nafize; duzenle: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const duzen = ozelDuzenler(ben);
  const [konuk, setKonuk] = useState({ ad: "", unvan: "" });
  const muhabir = kisiBul(v, n.muhabirId);
  return (
    <article className={`ozel-kalem${n.durum === "iptal" ? " soluk" : ""}`} data-nafize={n.id}>
      <header>
        <Icerik blok className="ozel-kalem-ad">
          {n.konu}
        </Icerik>
        <DurumSecimi deger={n.durum} liste={NAFIZE_DURUMLARI} adlar={NAFIZE_DURUM_ADI} degistir={(x) => nafizeDurumu(ben, o.id, n.id, x)} devre={!duzen} etiket={t("durum")} />
        {duzen && (
          <span className="unvan-islem">
            <button className="dugme dugme-sade dugme-ikon" onClick={duzenle} title={t("duzenle")} aria-label={t("duzenle")}>
              <Pencil size={15} />
            </button>
            <button className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelKalemSil(ben, o.id, "nafizeler", n.id)} title={t("sil")} aria-label={t("sil")}>
              <Trash2 size={15} />
            </button>
          </span>
        )}
      </header>
      <small className="sonuk-yazi">
        {tarihYaz(n.tarih, dil, "kisa")}
        {n.saat ? ` · ${n.saat} GMT` : ""}
        {n.yer ? (
          <>
            {" · "}
            <Icerik>{n.yer}</Icerik>
          </>
        ) : null}
        {" · "}
        {muhabir ? ad(muhabir) : n.muhabirTbc ? "TBC" : t("atanmadi")}
      </small>
      <div className="ozel-konuklar">
        <span className="alan-etiket">
          <Users size={14} /> {t("oyKonuklar")} ({n.konuklar.filter((k) => k.durum !== "iptal").length})
        </span>
        <ul>
          {n.konuklar.map((k) => (
            <li key={k.id} className={k.durum === "iptal" ? "soluk" : ""} data-konuk={k.id}>
              <Icerik>
                {k.ad}
                {k.unvan ? ` (${k.unvan})` : ""}
              </Icerik>
              <DurumSecimi deger={k.durum} liste={KONUK_DURUMLARI} adlar={KONUK_DURUM_ADI} degistir={(x) => konukKaydet(ben, o.id, n.id, { ...k, durum: x })} devre={!duzen} etiket={t("durum")} />
              {duzen && (
                <button className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => konukSil(ben, o.id, n.id, k.id)} title={t("sil")} aria-label={t("sil")}>
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
        {duzen && (
          <div className="ozel-not-satiri">
            <input {...icerikAlani} value={konuk.ad} onChange={(e) => setKonuk({ ...konuk, ad: e.target.value })} placeholder={t("oyKonukAdi")} aria-label={t("oyKonukAdi")} data-konuk-ad />
            <input {...icerikAlani} value={konuk.unvan} onChange={(e) => setKonuk({ ...konuk, unvan: e.target.value })} placeholder={t("oyUnvan")} aria-label={t("oyUnvan")} />
            <button
              className="dugme dugme-ikincil dugme-kucuk"
              disabled={!konuk.ad.trim()}
              onClick={() => konukKaydet(ben, o.id, n.id, { ad: konuk.ad, unvan: konuk.unvan, durum: "aday" }) && setKonuk({ ad: "", unvan: "" })}
              data-konuk-ekle
            >
              <Plus size={14} /> {t("oyKonukEkle")}
            </button>
          </div>
        )}
      </div>
      <KalemGecmisi ben={ben} o={o} tur="nafizeler" id={n.id} iz={n.iz} />
    </article>
  );
}

function NafizePenceresi({ ben, o, n, kapat }: { ben: Kisi; o: OzelYayin; n?: Nafize; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ konu: n?.konu ?? "", tarih: n?.tarih ?? o.tarih, saat: n?.saat ?? "", yer: n?.yer ?? "", muhabirId: n?.muhabirId ?? "", muhabirTbc: !!n?.muhabirTbc });
  const kaydet = () => {
    if (nafizeKaydet(ben, o.id, { ...f, id: n?.id, muhabirTbc: f.muhabirTbc || undefined })) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t(n ? "duzenle" : "oyNafizeEkle")} kapat={kapat}>
      <div className="form" data-nafize-formu>
        <label>
          {t("oyKonu")}
          <textarea {...icerikAlani} rows={2} value={f.konu} onChange={(e) => setF({ ...f, konu: e.target.value })} data-nafize-konu />
        </label>
        <div className="satir">
          <label>
            {t("oyTarih")}
            <input type="date" value={f.tarih} onChange={(e) => setF({ ...f, tarih: e.target.value })} />
          </label>
          <label>
            {t("oySaat")}
            <input type="time" value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} />
          </label>
          <label>
            {t("oyYer")}
            <input {...icerikAlani} value={f.yer} onChange={(e) => setF({ ...f, yer: e.target.value })} />
          </label>
        </div>
        <div className="muhabir-sutunu">
          <label>
            {t("muhabir")}
            <MuhabirSecici deger={f.muhabirId} degistir={(x) => setF({ ...f, muhabirId: x, muhabirTbc: x ? false : f.muhabirTbc })} bosEtiket={t("atanmadi")} />
          </label>
          {!f.muhabirId && <TbcKutusu secili={f.muhabirTbc} degistir={(x) => setF({ ...f, muhabirTbc: x })} />}
        </div>
        <FormAlt kapat={kapat} kaydet={kaydet} devre={!f.konu.trim() || !f.tarih} />
      </div>
    </Pencere>
  );
}

/* --- Paketler: in-house (Output) ve dış muhabir --- */

const paketDurumAdi = (p: Paket): Anahtar => (p.durum === "tamamlandi" ? "oyTeslimEdildi" : p.ozelKaynak === "inhouse" && !p.hazirlayanId ? "oyTalepEdildi" : "oyHazirlaniyor");

function Paketler({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const v = useVeri();
  const [form, setForm] = useState(false);
  const paketler = ozelPaketleri(v, o.id);
  const gruplar: ["inhouse" | "dis", Anahtar][] = [
    ["inhouse", "oyInhouse"],
    ["dis", "oyDis"],
  ];
  return (
    <Kart
      baslik={t("oyPaketler")}
      ikon={<Package size={18} />}
      ek={String(paketler.length)}
      sagUc={
        ozelDuzenler(ben) && (
          <button className="dugme dugme-kucuk" onClick={() => setForm(true)} data-ozel-paket-ekle>
            <Plus size={14} /> {t("oyPaketTalebi")}
          </button>
        )
      }
    >
      {paketler.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {gruplar.map(([kaynak, ad]) => {
        const l = paketler.filter((p) => (p.ozelKaynak ?? "dis") === kaynak);
        return l.length ? (
          <div key={kaynak} className="ara-ust-2" data-ozel-paket-grubu={kaynak}>
            <div className="alan-etiket">{t(ad)}</div>
            <ul className="liste">
              {l.map((p) => (
                <OzelPaketSatiri key={p.id} ben={ben} p={p} />
              ))}
            </ul>
          </div>
        ) : null;
      })}
      {form && <PaketTalepPenceresi ben={ben} o={o} kapat={() => setForm(false)} />}
    </Kart>
  );
}

/* Output müdürünün görevlendirebileceği kişiler: Output'ta (alt birimleriyle) etkin olanlar. */
const outputEkibi = (d: Durum) => d.kisiler.filter((k) => !k.pasif && !k.hesapsiz && altindaMi(k.birim, "output"));

function OzelPaketSatiri({ ben, p }: { ben: Kisi; p: Paket }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const yapan = kisiBul(v, p.muhabirId ?? p.hazirlayanId);
  const gec = p.durum !== "tamamlandi" && !!p.sonTarih && p.sonTarih < bugun();
  return (
    <li className={gec ? "gecikti" : ""} data-ozel-paket={p.id}>
      <div className="ad">
        <a href={`#/paketler/${p.id}`}>
          <Icerik blok>{p.baslik}</Icerik>
        </a>
        <small>
          {p.kod}
          {p.sonTarih ? ` · ${t("oySonTarih")}: ${tarihYaz(p.sonTarih, dil, "kisa")}` : ""}
          {" · "}
          {yapan ? ad(yapan) : t("oyOutputMudurunde")}
        </small>
      </div>
      <Rozet ton={p.durum === "tamamlandi" ? "iyi" : gec ? "kotu" : "vurgu"}>{t(paketDurumAdi(p))}</Rozet>
      {ozelPaketDagitabilir(ben, p) && (
        <select aria-label={t("oyAta")} value={p.hazirlayanId ?? ""} onChange={(e) => e.target.value && ozelPaketAta(ben, p.id, e.target.value) && bildir(t("bKaydedildi"))} data-ozel-ata>
          <option value="">{t("oyAta")}</option>
          {outputEkibi(v).map((k) => (
            <option key={k.id} value={k.id}>
              {ad(k)}
            </option>
          ))}
        </select>
      )}
      {paketTamamlayabilir(ben, p, v) && (
        <button className="dugme dugme-iyi dugme-kucuk" onClick={() => paketTamamla(ben, p.id) && bildir(t("bKaydedildi"))} data-ozel-teslim>
          <Check size={14} /> {t("oyTeslimEdildi")}
        </button>
      )}
    </li>
  );
}

function PaketTalepPenceresi({ ben, o, kapat }: { ben: Kisi; o: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ baslik: "", aciklama: "", kaynak: "inhouse" as "inhouse" | "dis", muhabirId: "", sonTarih: o.tarih, tur: "haber" as IcerikTuru, bicim: "pkg" as Bicim });
  const hazir = !!f.baslik.trim() && (f.kaynak === "inhouse" || !!f.muhabirId);
  const kaydet = () => {
    if (!hazir) return;
    if (ozelPaketTalebi(ben, o.id, { ...f, muhabirId: f.kaynak === "dis" ? f.muhabirId : undefined, sonTarih: f.sonTarih || undefined })) bildir(t("bKaydedildi"));
    kapat();
  };
  return (
    <Pencere baslik={t("oyPaketTalebi")} kapat={kapat}>
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
              <MuhabirSecici deger={f.muhabirId} degistir={(x) => setF({ ...f, muhabirId: x })} bosEtiket={t("seciniz")} ic={false} />
            </label>
          )}
          <label>
            {t("oySonTarih")}
            <input type="date" value={f.sonTarih} onChange={(e) => setF({ ...f, sonTarih: e.target.value })} data-ozel-son-tarih />
          </label>
          <label>
            {t("tur")}
            <select value={f.tur} onChange={(e) => setF({ ...f, tur: e.target.value as IcerikTuru })}>
              {ICERIK_TURLERI.map((x) => (
                <option key={x} value={x}>
                  {t(TUR_ADI[x])}
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
    <Kart
      baslik={t("oyTalepler")}
      ikon={<ClipboardList size={18} />}
      ek={String(liste.length)}
      sagUc={
        duzen && (
          <button className="dugme dugme-kucuk" onClick={() => setForm("yeni")} data-talep-ekle>
            <Plus size={14} /> {t("oyTalepEkle")}
          </button>
        )
      }
    >
      {liste.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      <div className="ozel-kalemler">
        {liste.map((x) => {
          const gec = x.durum !== "tamam" && x.durum !== "iptal" && !!x.sonTarih && x.sonTarih < bugun();
          return (
            <article key={x.id} className={`ozel-kalem${x.durum === "iptal" ? " soluk" : ""}${gec ? " gecikti" : ""}`} data-talep={x.id}>
              <header>
                <Icerik blok className="ozel-kalem-ad">
                  {x.metin}
                </Icerik>
                <DurumSecimi deger={x.durum} liste={TALEP_DURUMLARI} adlar={TALEP_DURUM_ADI} degistir={(y) => ozelTalepDurumu(ben, o.id, x.id, y)} devre={!duzen} etiket={t("durum")} />
                {duzen && (
                  <span className="unvan-islem">
                    <button className="dugme dugme-sade dugme-ikon" onClick={() => setForm(x)} title={t("duzenle")} aria-label={t("duzenle")}>
                      <Pencil size={15} />
                    </button>
                    <button className="dugme dugme-sade dugme-ikon kotu-yazi" onClick={() => confirm(t("silinsinMi")) && ozelKalemSil(ben, o.id, "talepler", x.id)} title={t("sil")} aria-label={t("sil")}>
                      <Trash2 size={15} />
                    </button>
                  </span>
                )}
              </header>
              <small className="sonuk-yazi">
                {[x.birim ? birimAdi(x.birim) : "", x.sonTarih ? `${t("oySonTarih")}: ${tarihYaz(x.sonTarih, dil, "kisa")}` : ""].filter(Boolean).join(" · ")}
              </small>
              <KalemGecmisi ben={ben} o={o} tur="talepler" id={x.id} iz={x.iz} />
            </article>
          );
        })}
      </div>
      {form && <TalepPenceresi ben={ben} o={o} x={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </Kart>
  );
}

function TalepPenceresi({ ben, o, x, kapat }: { ben: Kisi; o: OzelYayin; x?: OzelTalep; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ metin: x?.metin ?? "", birim: (x?.birim ?? "") as BirimId | "", sonTarih: x?.sonTarih ?? "" });
  const kaydet = () => {
    if (ozelTalepKaydet(ben, o.id, { id: x?.id, metin: f.metin, birim: f.birim || undefined, sonTarih: f.sonTarih || undefined })) bildir(t("bKaydedildi"));
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
              {birimListesi(f.birim || undefined).filter((b) => b !== "muhabir" && !grupMu(b)).map((b) => (
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
    <Kart
      baslik={t("oyGorevler")}
      ikon={<Plane size={18} />}
      ek={String(liste.length)}
      sagUc={
        ozelDuzenler(ben) && (
          <button className="dugme dugme-kucuk" onClick={() => setForm(true)} data-ozel-gorev-ekle>
            <Plus size={14} /> {t("oyGorevEkle")}
          </button>
        )
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
                {t(HAREKET_TURU_ADI[g.tur])} · <Icerik>{g.yer}</Icerik> · {aralikYaz(g.baslangic, g.bitis, dil)}
              </small>
            </div>
            <Rozet ton={g.durum === "talep" ? "uyari" : "vurgu"}>{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>
          </li>
        ))}
      </ul>
      {form && <GorevPenceresi ben={ben} o={o} kapat={() => setForm(false)} />}
    </Kart>
  );
}

function GorevPenceresi({ ben, o, kapat }: { ben: Kisi; o: OzelYayin; kapat: () => void }) {
  const { t } = useDil();
  const [f, setF] = useState({ kisiId: "", tur: "gorevlendirme" as HareketTuru, yer: "", baslangic: o.tarih, bitis: o.bitis ?? o.tarih, aciklama: "" });
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
    <Kart baslik={t("oyHazirlik")} ikon={<CheckCircle size={18} />} ek={`${o.hazirlik.filter((h) => h.tamam).length}/${o.hazirlik.length}`}>
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
    </Kart>
  );
}

/* --- Planın durumu ve geçmişi: Planlama'nın denetiminde onay --- */

function DurumKarti({ ben, o }: { ben: Kisi; o: OzelYayin }) {
  const { t } = useDil();
  const onayli = o.durum === "onayli";
  const yetkili = planAdimiYapabilir(ben, "ozOnay");
  return (
    <section className="kart plan-durum-karti" data-ozel-durum={o.durum ?? "hazirlik"}>
      <div className="durum-cizgisi" aria-label={t("planDurumu")}>
        <span className={onayli ? "gecti" : "simdi"}>
          <i>{onayli ? <Check size={11} /> : 1}</i>
          {t("oyDurumHazirlik")}
        </span>
        <span className={onayli ? "simdi" : ""}>
          <span className="ayrac" aria-hidden="true" />
          <i>2</i>
          {t("oyDurumOnayli")}
        </span>
      </div>
      <div className="dugmeler ara-ust-2">
        {!onayli && yetkili && (
          <button className="dugme dugme-iyi" onClick={() => ozelDurumu(ben, o.id, "onayli") && bildir(t("bPlanOnaylandi"))} data-ozel-onayla>
            <Check size={16} /> {t("oyOnayla")}
          </button>
        )}
        {onayli && yetkili && (
          <button className="dugme dugme-ikincil" onClick={() => ozelDurumu(ben, o.id, "hazirlik") && bildir(t("bKaydedildi"))} data-ozel-hazirliga>
            <Undo2 size={16} /> {t("oyHazirligaAl")}
          </button>
        )}
        {!yetkili && !onayli && (
          <p className="bos-kucuk">
            {t("oyOnaylayan")} <AdimYetkilileri adim="ozOnay" />
          </p>
        )}
      </div>
      {(o.iz?.length ?? 0) > 0 && (
        <details className="ozel-gecmis ara-ust-2">
          <summary>
            <History size={14} /> {t("oyPlanIzi")}
          </summary>
          <IzListesi iz={o.iz!} />
        </details>
      )}
    </section>
  );
}

/* --- Output'un ana sayfası: in-house paket talepleri; müdür dağıtıyor, görevli teslim ediyor --- */

export function OzelTalepAlani({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter(
    (p) => p.ozelId && p.ozelKaynak === "inhouse" && p.durum === "onaylandi" && (ozelPaketDagitabilir(ben, p) || p.hazirlayanId === ben.id),
  );
  if (!liste.length && !ozelPaketDagitabilir(ben, { ozelId: "-", ozelKaynak: "inhouse", durum: "onaylandi" } as Paket)) return null;
  return (
    <Kart baslik={t("ozelPaketTalepleri")} ikon={<Tv size={18} />} ek={String(liste.length)}>
      {liste.length === 0 && <Bos kucuk metin={t("oyTalepYok")} />}
      <ul className="liste" data-ozel-talep-alani>
        {liste.map((p) => (
          <OzelPaketSatiri key={p.id} ben={ben} p={p} />
        ))}
      </ul>
    </Kart>
  );
}
