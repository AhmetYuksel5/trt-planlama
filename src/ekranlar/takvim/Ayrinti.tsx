import { CalendarDays, CalendarRange, Calendar, Link2, Pencil, Trash2, Tv } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Icerik, KisiHucre, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { aralikYaz, gecenSure, saatYaz, tarihYaz, useDil } from "../../dil";
import { BIRIM_ADI, TUR_ADI, bolgeAdi, faaliyetDurumAdi, faaliyetTuruAdi, hatirlatmaAdi, oncelikAdi, potansiyelAdi, tekrarAdi } from "../../etiketler";
import { faaliyetAylikaEkle, faaliyetDegistir, faaliyetHaftalikaBagla, faaliyetNextDayeEkle, faaliyetOzeleEkle, faaliyetSil } from "../../eylemler";
import { haftaSonu } from "../../haftalik";
import { useBen } from "../../oturum";
import { faaliyetBolgesi, faaliyetKolu, hatirlatmaZamani, olusumAc, olusumBaglantilari, olusumHaftalari, olusumPlanlari, type Olusum } from "../../takvim";
import {
  FAALIYET_DURUMLARI,
  ICERIK_TURLERI,
  ONCELIKLER,
  baslikBul,
  faaliyetBul,
  haftaBul,
  kisiBul,
  planBul,
  useVeri,
  type Durum,
  type FaaliyetBaglantisi,
  type FaaliyetDurum,
  type IcerikTuru,
  type Kisi,
  type Oncelik,
} from "../../veri";
import { faaliyetGorebilir, haftalikDuzenler, planIcerikDuzenler, planOperasyonDuzenler, yapabilir } from "../../yetki";
import { KalemFormu } from "../haftalik/Kalem";
import { FaaliyetFormu } from "./Form";
import { DurumRozeti, FaaliyetYeri, OncelikRozeti, TurIkonu, useTarihMetni } from "./ortak";

/**
 * Faaliyetin ayrıntısı ve plana aktarma pencereleri. Tek giriş noktası:
 * takvim, plan ekranlarının "Takvimden" bölümü ve ana sayfa kartı aynı
 * pencereyi açıyor. Plan ekranı doğrudan aktarım penceresiyle açabiliyor
 * (`ilk`); o zaman kaydedince pencere kapanıyor, ayrıntıya dönmüyor.
 */

export type AktarimTuru = "nextday" | "haftalik" | "aylik" | "ozel";
type Ekran = "ayrinti" | "duzenle" | AktarimTuru;

export interface AcikFaaliyet {
  id: string;
  bas: string;
}

export function FaaliyetAyrintisi({
  id,
  bas,
  ilk = "ayrinti",
  planId,
  kapat,
}: {
  id: string;
  bas: string;
  ilk?: "ayrinti" | AktarimTuru;
  /** Plan ekranından açıldıysa o plan (Next Day planı ya da hafta) seçili gelsin. */
  planId?: string;
  kapat: () => void;
}) {
  const v = useVeri();
  const ben = useBen();
  const [ekran, setEkran] = useState<Ekran>(ilk);
  const f = faaliyetBul(v, id);
  const gorur = !!f && !!ben && faaliyetGorebilir(ben, f);
  /* Faaliyet başka sekmede silindiyse pencere kendiliğinden kapansın. */
  useEffect(() => {
    if (!gorur) kapat();
  }, [gorur, kapat]);
  if (!f || !ben || !gorur) return null;
  const o = olusumAc(f, bas);
  const geri = ilk === "ayrinti" ? () => setEkran("ayrinti") : kapat;
  switch (ekran) {
    case "duzenle":
      return <FaaliyetFormu ben={ben} mevcut={f} kapat={() => setEkran("ayrinti")} />;
    case "nextday":
      return <NextDayAktarim o={o} ben={ben} planId={planId} geri={geri} />;
    case "haftalik":
      return <HaftalikAktarim o={o} ben={ben} haftaId={planId} geri={geri} />;
    case "aylik":
      return <AylikAktarim o={o} ben={ben} geri={geri} />;
    case "ozel":
      return <OzelAktarim o={o} ben={ben} geri={geri} />;
    default:
      return <Ayrinti o={o} ben={ben} ac={setEkran} kapat={kapat} />;
  }
}

/* --- Aktarımın açık olup olmadığı ve neden --- */

interface Kapi {
  acik: boolean;
  neden?: string;
}

export function useAktarimKapilari() {
  const { t } = useDil();
  return (v: Durum, ben: Kisi, o: Olusum): Record<AktarimTuru, Kapi> => {
    if (o.f.durum === "iptal") {
      const k = { acik: false, neden: t("fd_iptal") };
      return { nextday: k, haftalik: k, aylik: k, ozel: k };
    }
    const yetkiYok = { acik: false, neden: t("aktarimYetkiYok") };
    const planlar = olusumPlanlari(v, o);
    const nextday: Kapi = planlar.some((p) => planOperasyonDuzenler(ben, p))
      ? { acik: true }
      : !yapabilir(ben, "planDuzenle") && !yapabilir(ben, "operasyon")
        ? yetkiYok
        : planlar.length
          ? yetkiYok
          : { acik: false, neden: t("ndPlanYok") };
    const haftalik: Kapi = !yapabilir(ben, "haftalikDuzenle")
      ? yetkiYok
      : olusumHaftalari(v, o).some((h) => haftalikDuzenler(ben, h))
        ? { acik: true }
        : { acik: false, neden: t("hfPlanYok") };
    const planDuzen: Kapi = yapabilir(ben, "planDuzenle") ? { acik: true } : yetkiYok;
    return { nextday, haftalik, aylik: planDuzen, ozel: planDuzen };
  };
}

/** Aktarım bölümünü kim görüyor: herhangi bir plana yazabilen. */
export const aktarabilir = (ben: Kisi) => yapabilir(ben, "planDuzenle") || yapabilir(ben, "operasyon") || yapabilir(ben, "haftalikDuzenle");

const AKTARIM: { tur: AktarimTuru; ad: "nextDayeEkle" | "haftalikaEkle" | "aylikaEkle" | "ozeleEkle"; ikon: ReactNode }[] = [
  { tur: "nextday", ad: "nextDayeEkle", ikon: <CalendarDays size={15} /> },
  { tur: "haftalik", ad: "haftalikaEkle", ikon: <CalendarRange size={15} /> },
  { tur: "aylik", ad: "aylikaEkle", ikon: <Calendar size={15} /> },
  { tur: "ozel", ad: "ozeleEkle", ikon: <Tv size={15} /> },
];

/* --- Bağlantının ekrandaki adı ve adresi --- */

export function BaglantiSatiri({ b }: { b: FaaliyetBaglantisi }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  let metin: ReactNode = t(b.tur);
  let href = "";
  if (b.tur === "nextday") {
    const p = planBul(v, b.planId);
    if (p) [metin, href] = [`${t("nextday")} · ${tarihYaz(p.tarih, dil, "kisa")}`, `#/nextday/${p.id}`];
  } else if (b.tur === "haftalik") {
    const h = haftaBul(v, b.planId);
    if (h) [metin, href] = [`${t("haftalik")} · ${aralikYaz(h.baslangic, haftaSonu(h.baslangic), dil)}`, `#/haftalik/${h.id}`];
  } else if (b.tur === "aylik") {
    const a = v.aylik.find((x) => x.id === b.planId);
    if (a) [metin, href] = [`${t("aylik")} · ${tarihYaz(a.ay + "-01", dil, "ay")}`, `#/aylik/${a.id}`];
  } else {
    const oz = v.ozel.find((x) => x.id === b.planId);
    if (oz)
      [metin, href] = [
        <>
          {t("ozel")} · <Icerik>{oz.ad}</Icerik>
        </>,
        "#/ozel",
      ];
  }
  return (
    <li>
      <Link2 size={15} className="iyi-yazi" />
      <div className="ad">
        <b>{href ? <a href={href}>{metin}</a> : metin}</b>
        <small>
          {ad(kisiBul(v, b.kisiId))} · {gecenSure(b.zaman, dil)}
        </small>
      </div>
      {href && (
        <a className="dugme dugme-ikincil dugme-kucuk" href={href}>
          {t("plandaAc")}
        </a>
      )}
    </li>
  );
}

/* --- Ayrıntı --- */

function Ayrinti({ o, ben, ac, kapat }: { o: Olusum; ben: Kisi; ac: (e: Ekran) => void; kapat: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const tarihMetni = useTarihMetni();
  const kapilar = useAktarimKapilari()(v, ben, o);
  const f = o.f;
  const duzenler = yapabilir(ben, "takvimDuzenle");
  const baglantilar = olusumBaglantilari(o);
  const hz = hatirlatmaZamani(o);
  const sil = () => {
    if (!confirm(t("faaliyetSilOnay"))) return;
    if (faaliyetSil(ben, f.id)) {
      bildir(t("faaliyetSilindi"));
      kapat();
    }
  };
  return (
    <Pencere
      baslik={<Icerik>{f.baslik}</Icerik>}
      alt={
        <>
          {t(faaliyetTuruAdi(f.tur))} · {tarihMetni(o, true)}
        </>
      }
      kapat={kapat}
      altBilgi={
        <>
          {duzenler && (
            <>
              <button type="button" className="dugme dugme-kotu" onClick={sil}>
                <Trash2 size={15} /> {t("sil")}
              </button>
              <button type="button" className="dugme dugme-ikincil" onClick={() => ac("duzenle")}>
                <Pencil size={15} /> {t("duzenle")}
              </button>
            </>
          )}
          <button type="button" className="dugme" onClick={kapat}>
            {t("kapat")}
          </button>
        </>
      }
    >
      <div className="rozetler">
        <TurIkonu tur={f.tur} />
        <OncelikRozeti oncelik={f.oncelik} />
        <DurumRozeti o={o} />
        <Rozet ton="cizgi">{t(potansiyelAdi(f.potansiyel))}</Rozet>
        {f.tekrar && <Rozet ton="vurgu">{t(tekrarAdi(f.tekrar.siklik))}</Rozet>}
      </div>
      <div className="alanlar">
        {(f.sehir || f.ulke) && (
          <div className="alan">
            <small>{t("yer")}</small>
            <b>
              <FaaliyetYeri f={f} />
            </b>
          </div>
        )}
        <div className="alan">
          <small>{t("bolge")}</small>
          <b>{t(bolgeAdi(faaliyetBolgesi(f)))}</b>
        </div>
        {f.birim && (
          <div className="alan">
            <small>{t("sorumluBirim")}</small>
            <b>{t(BIRIM_ADI[f.birim])}</b>
          </div>
        )}
        {f.muhabirId && (
          <div className="alan">
            <small>{t("sorumluMuhabir")}</small>
            <KisiHucre kisi={kisiBul(v, f.muhabirId)} />
          </div>
        )}
        {f.hatirlatma && hz && (
          <div className="alan">
            <small>{t("hatirlatma")}</small>
            <b>
              {"once" in f.hatirlatma ? `${t(hatirlatmaAdi(f.hatirlatma.once))} · ` : ""}
              {tarihYaz(hz.toISOString(), dil, "kisa")} {saatYaz(hz.toISOString(), dil)}
            </b>
          </div>
        )}
        {f.tekrar && (
          <div className="alan">
            <small>{t("tekrar")}</small>
            <b>
              {t(tekrarAdi(f.tekrar.siklik))}
              {f.tekrar.bitis && ` · ${t("tekrarBitis")}: ${tarihYaz(f.tekrar.bitis, dil, "kisa")}`}
            </b>
          </div>
        )}
        <div className="alan">
          <small>{t("olusturan")}</small>
          <b>{ad(kisiBul(v, f.olusturan))}</b>
        </div>
        <div className="alan">
          <small>{t("sonGuncelleme")}</small>
          <b>{gecenSure(f.guncelleme, dil)}</b>
        </div>
      </div>
      {f.notlar && (
        <div>
          <div className="alan-etiket">{t("notlar")}</div>
          <p className="metin-kutu" dir="auto">
            {f.notlar}
          </p>
        </div>
      )}
      <div>
        <div className="alan-etiket">{t("planBaglantilari")}</div>
        {baglantilar.length ? (
          <ul className="liste ara-ust">
            {baglantilar.map((b) => (
              <BaglantiSatiri key={`${b.tur}-${b.planId}-${b.kayitId ?? ""}`} b={b} />
            ))}
          </ul>
        ) : (
          <p className="bos-kucuk">{t("planaAlinmadi")}</p>
        )}
      </div>
      {duzenler && (
        <div className="form">
          <div className="satir">
            <label>
              {t("oncelik")}
              <select value={f.oncelik} onChange={(e) => faaliyetDegistir(ben, f.id, { oncelik: e.target.value as Oncelik })}>
                {ONCELIKLER.map((x) => (
                  <option key={x} value={x}>
                    {t(oncelikAdi(x))}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("durum")}
              <select value={f.durum} onChange={(e) => faaliyetDegistir(ben, f.id, { durum: e.target.value as FaaliyetDurum })}>
                {FAALIYET_DURUMLARI.map((x) => (
                  <option key={x} value={x}>
                    {t(faaliyetDurumAdi(x))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
      {aktarabilir(ben) && (
        <section className="tk-aktarim" aria-label={t("planaAktar")}>
          <div className="alan-etiket">{t("planaAktar")}</div>
          <div className="tk-aktarim-dugmeleri">
            {AKTARIM.map((a) => (
              <div key={a.tur}>
                <button type="button" className="dugme dugme-ikincil" disabled={!kapilar[a.tur].acik} onClick={() => ac(a.tur)}>
                  {a.ikon} {t(a.ad)}
                </button>
                {kapilar[a.tur].neden && <small>{kapilar[a.tur].neden}</small>}
              </div>
            ))}
          </div>
        </section>
      )}
    </Pencere>
  );
}

/* --- Aktarım pencereleri: editörün onayı "Plana ekle" --- */

const YENI = "__yeni";

function NextDayAktarim({ o, ben, planId, geri }: { o: Olusum; ben: Kisi; planId?: string; geri: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const f = o.f;
  const planlar = olusumPlanlari(v, o).filter((p) => planOperasyonDuzenler(ben, p));
  const [secili, setSecili] = useState(planId && planlar.some((p) => p.id === planId) ? planId : (planlar[0]?.id ?? ""));
  const [baslik, setBaslik] = useState("");
  const [yeniAd, setYeniAd] = useState(f.baslik);
  const [yer, setYer] = useState(f.sehir ?? "");
  const [metin, setMetin] = useState(f.baslik);
  const plan = planBul(v, secili);
  const yeniAcabilir = !!plan && planIcerikDuzenler(ben, plan) && yapabilir(ben, "baslikYonet");
  const kaydet = () => {
    const id = faaliyetNextDayeEkle(ben, f.id, {
      tarih: o.bas,
      planId: secili,
      planBaslikId: baslik && baslik !== YENI ? baslik : undefined,
      yeniBaslik: baslik === YENI ? yeniAd : undefined,
      yer,
      metin,
    });
    if (id) {
      bildir(t("planaEklendiNd"));
      geri();
    }
  };
  return (
    <Pencere
      baslik={t("nextDayeEkle")}
      alt={<Icerik>{f.baslik}</Icerik>}
      kapat={geri}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil" onClick={geri}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" onClick={kaydet} disabled={!plan || !metin.trim() || (baslik === YENI && !yeniAd.trim())}>
            {t("planaEkle")}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="satir">
          <label>
            {t("plan")}
            <select value={secili} onChange={(e) => (setSecili(e.target.value), setBaslik(""))}>
              {planlar.map((p) => (
                <option key={p.id} value={p.id}>
                  {t("nextday")} · {tarihYaz(p.tarih, dil, "tam")}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("baslik")}
            <select value={baslik} onChange={(e) => setBaslik(e.target.value)}>
              <option value="">{t("takipBasliksiz")}</option>
              {plan?.basliklar.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {baslikBul(v, pb.baslikId)?.ad}
                </option>
              ))}
              {yeniAcabilir && <option value={YENI}>{t("yeniBaslikAc")}</option>}
            </select>
          </label>
        </div>
        {baslik === YENI && (
          <label>
            {t("yeniBaslikAdi")}
            <input {...icerikAlani} value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} />
          </label>
        )}
        <label>
          {t("yer")}
          <input {...icerikAlani} value={yer} onChange={(e) => setYer(e.target.value)} />
        </label>
        <label>
          {t("gelismeMetni")}
          <textarea {...icerikAlani} rows={3} value={metin} onChange={(e) => setMetin(e.target.value)} />
        </label>
      </div>
    </Pencere>
  );
}

function HaftalikAktarim({ o, ben, haftaId, geri }: { o: Olusum; ben: Kisi; haftaId?: string; geri: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const f = o.f;
  const haftalar = olusumHaftalari(v, o).filter((h) => haftalikDuzenler(ben, h));
  const [secili, setSecili] = useState(haftaId && haftalar.some((h) => h.id === haftaId) ? haftaId : (haftalar[0]?.id ?? ""));
  const hafta = haftaBul(v, secili);
  if (!hafta) return null;
  /* Kalemin günü: tekrar bu haftada başlıyorsa o gün, önceki haftadan sürüyorsa haftanın ilk günü. */
  const gun = o.bas < hafta.baslangic ? hafta.baslangic : o.bas;
  return (
    <Pencere baslik={t("haftalikaEkle")} alt={<Icerik>{f.baslik}</Icerik>} kapat={geri}>
      {haftalar.length > 1 && (
        <label className="form">
          <span className="alan-etiket">{t("hafta")}</span>
          <select className="girdi" value={secili} onChange={(e) => setSecili(e.target.value)}>
            {haftalar.map((h) => (
              <option key={h.id} value={h.id}>
                {aralikYaz(h.baslangic, haftaSonu(h.baslangic), dil)}
              </option>
            ))}
          </select>
        </label>
      )}
      <KalemFormu
        key={hafta.id}
        ben={ben}
        hafta={hafta}
        tarih={gun <= haftaSonu(hafta.baslangic) ? gun : undefined}
        ilk={{ baslik: f.baslik, yer: f.sehir ?? "", metin: f.baslik, tur: faaliyetKolu(f), muhabirler: f.muhabirId ? [f.muhabirId] : [] }}
        kaydedildi={(kalemId) => {
          if (faaliyetHaftalikaBagla(ben, f.id, hafta.id, kalemId, o.bas)) bildir(t("planaEklendiHf"));
        }}
        kapat={geri}
      />
    </Pencere>
  );
}

function AylikAktarim({ o, ben, geri }: { o: Olusum; ben: Kisi; geri: () => void }) {
  const { t } = useDil();
  const f = o.f;
  const [tur, setTur] = useState<IcerikTuru>(faaliyetKolu(f));
  const kaydet = () => {
    if (faaliyetAylikaEkle(ben, f.id, o.bas, tur)) {
      bildir(t("planaEklendiAy"));
      geri();
    }
  };
  return (
    <Pencere
      baslik={t("aylikaEkle")}
      alt={<Icerik>{f.baslik}</Icerik>}
      kapat={geri}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil" onClick={geri}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" onClick={kaydet}>
            {t("aylikaEkle")}
          </button>
        </>
      }
    >
      <div className="form">
        <label>
          {t("tur")}
          <select value={tur} onChange={(e) => setTur(e.target.value as IcerikTuru)}>
            {ICERIK_TURLERI.map((x) => (
              <option key={x} value={x}>
                {t(TUR_ADI[x])}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Pencere>
  );
}

function OzelAktarim({ o, ben, geri }: { o: Olusum; ben: Kisi; geri: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const f = o.f;
  const yayinlar = [...v.ozel].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const [mod, setMod] = useState<"yeni" | "var">("yeni");
  const [ozelId, setOzelId] = useState(yayinlar[0]?.id ?? "");
  const kaydet = () => {
    if (faaliyetOzeleEkle(ben, f.id, o.bas, mod === "var" ? ozelId : undefined)) {
      bildir(t("planaEklendiOz"));
      geri();
    }
  };
  return (
    <Pencere
      baslik={t("ozeleEkle")}
      alt={<Icerik>{f.baslik}</Icerik>}
      kapat={geri}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil" onClick={geri}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" onClick={kaydet} disabled={mod === "var" && !ozelId}>
            {t("ozeleEkle")}
          </button>
        </>
      }
    >
      <div className="form">
        <label className="secim">
          <input type="radio" name="ozel-mod" checked={mod === "yeni"} onChange={() => setMod("yeni")} />
          {t("ozelYeni")}
        </label>
        <label className="secim">
          <input type="radio" name="ozel-mod" checked={mod === "var"} onChange={() => setMod("var")} disabled={!yayinlar.length} />
          {t("ozelVar")}
        </label>
        {mod === "var" && (
          <select value={ozelId} onChange={(e) => setOzelId(e.target.value)}>
            {yayinlar.map((y) => (
              <option key={y.id} value={y.id}>
                {y.ad} · {tarihYaz(y.tarih, dil, "kisa")}
              </option>
            ))}
          </select>
        )}
      </div>
    </Pencere>
  );
}
