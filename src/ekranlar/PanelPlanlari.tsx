import { CalendarDays, CalendarRange, CheckCircle, ChevronRight, Circle, ClipboardList, MapPinned, Printer, Tv } from "lucide-react";
import { useState, type ReactNode } from "react";
import { geciktiMi } from "../akis";
import { Bos, DurumCizgisi, Icerik, Ilerleme, Kart, Pencere, Rozet } from "../bilesenler/Parcalar";
import { aralikYaz, gunAdi, tarihYaz, useDil, type Anahtar } from "../dil";
import {
  GOREVLENDIRME_DURUM_ADI,
  HAFTA_DURUM_ADI,
  HAFTA_DURUM_TONU,
  HAREKET_TURU_ADI,
  PAKET_DURUM_ADI,
  PLAN_DURUM_ADI,
  PLAN_DURUM_TONU,
} from "../etiketler";
import { gundemde, haftaSonu, kararBekleyenler } from "../haftalik";
import { bugun, gunEkle } from "../tarih";
import {
  HAFTA_DURUMLARI,
  PAKET_DURUMLARI,
  PLAN_DURUMLARI,
  baslikBul,
  kisiBul,
  sahaGorevi,
  useVeri,
  type Durum,
  type Gorevlendirme,
  type GorevlendirmeDurum,
  type HaftalikPlan,
  type NextDayPlan,
  type OzelYayin,
} from "../veri";

/**
 * Yönetici panelinde planların durumu: günlük (Next Day), haftalık, özel
 * yayın ve saha görevlendirmeleri.
 *
 * Yönetici iş akışının ayrıntısında boğulmasın diye her sekmede yalnız
 * kısa satırlar var: ad, durum, ilerleme. Ayrıntı (aşamalar, birkaç
 * sayı, planı açma bağlantısı) satıra basınca açılan pencerede.
 */

type Sekme = "gunluk" | "haftalik" | "ozel" | "saha";
const SEKMELER: { id: Sekme; ad: Anahtar; ikon: ReactNode }[] = [
  { id: "gunluk", ad: "ypSekmeGunluk", ikon: <CalendarDays size={15} /> },
  { id: "haftalik", ad: "ypSekmeHaftalik", ikon: <CalendarRange size={15} /> },
  { id: "ozel", ad: "ypSekmeOzel", ikon: <Tv size={15} /> },
  { id: "saha", ad: "ypSekmeSaha", ikon: <MapPinned size={15} /> },
];

const SAHA_ASAMALARI: GorevlendirmeDurum[] = ["talep", "onayli", "suruyor", "bitti"];

type Secim = { tur: "gunluk"; plan: NextDayPlan } | { tur: "haftalik"; hafta: HaftalikPlan } | { tur: "ozel"; ozel: OzelYayin } | { tur: "saha"; g: Gorevlendirme } | null;

/** Satır: bütünü tek düğme, dokunma hedefi geniş; ayrıntı penceresini açıyor. */
function Satir({ ad, alt, rozet, oran, ac }: { ad: ReactNode; alt?: ReactNode; rozet: ReactNode; oran?: number; ac: () => void }) {
  return (
    <li>
      <button type="button" className="plan-satiri" onClick={ac}>
        <span className="ad">
          <b>{ad}</b>
          {alt && <small>{alt}</small>}
        </span>
        {oran !== undefined && (
          <span className="ilerleme-kutu">
            <Ilerleme oran={oran} />
          </span>
        )}
        {rozet}
        <ChevronRight size={16} className="yon sonuk-yazi" />
      </button>
    </li>
  );
}

const gunEtiketi = (tarih: string, t: (k: Anahtar) => string, dil: Parameters<typeof tarihYaz>[1]) => {
  const B = bugun();
  const goreli = tarih === B ? t("bugun") : tarih === gunEkle(B, 1) ? t("yarin") : tarih === gunEkle(B, -1) ? t("dun") : gunAdi(tarih, dil);
  return `${goreli} · ${tarihYaz(tarih, dil, "kisa")}`;
};

const planPaketleri = (d: Durum, p: NextDayPlan) => d.paketler.filter((x) => x.planId === p.id && x.durum !== "iptal");

/* --- Pencereler --- */

function SayiDizisi({ sayilar }: { sayilar: [string, number | string][] }) {
  return (
    <dl className="ozet-sayilar">
      {sayilar.map(([k, n]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{n}</dd>
        </div>
      ))}
    </dl>
  );
}

function GunlukPencere({ d, plan, kapat }: { d: Durum; plan: NextDayPlan; kapat: () => void }) {
  const { t, dil } = useDil();
  const paketler = planPaketleri(d, plan);
  return (
    <Pencere
      baslik={`${t("nextday")} · ${tarihYaz(plan.tarih, dil, "tam")}`}
      kapat={kapat}
      altBilgi={
        <>
          <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/cikti`}>
            <Printer size={16} /> {t("cikti")}
          </a>
          <a className="dugme" href={`#/nextday/${plan.id}`}>
            {t("planiAc")}
          </a>
        </>
      }
    >
      <DurumCizgisi etiket={t("planDurumu")} asamalar={PLAN_DURUMLARI.map((x) => t(PLAN_DURUM_ADI[x]))} simdi={PLAN_DURUMLARI.indexOf(plan.durum)} bitti={plan.durum === "devralindi"} />
      <SayiDizisi
        sayilar={[
          [t("basliklar"), plan.basliklar.length],
          ...PAKET_DURUMLARI.filter((x) => x !== "iptal" && paketler.some((p) => p.durum === x)).map((x): [string, number] => [t(PAKET_DURUM_ADI[x]), paketler.filter((p) => p.durum === x).length]),
          [t("sGeciken"), paketler.filter((p) => geciktiMi(p)).length],
        ]}
      />
      {plan.basliklar.length > 0 && (
        <>
          <div className="alan-etiket ara-ust-2">{t("basliklar")}</div>
          <div className="cipler ara-ust">
            {plan.basliklar.map((pb) => (
              <span key={pb.id} className="cip cip-duz">
                <Icerik>{baslikBul(d, pb.baslikId)?.ad}</Icerik>
              </span>
            ))}
          </div>
        </>
      )}
    </Pencere>
  );
}

function HaftalikPencere({ hafta, kapat }: { hafta: HaftalikPlan; kapat: () => void }) {
  const { t, dil } = useDil();
  const gundem = hafta.kalemler.filter(gundemde);
  const say = (k: (typeof gundem)[number]["karar"]) => gundem.filter((x) => x.karar === k).length;
  return (
    <Pencere
      baslik={`${t("haftalik")} · ${aralikYaz(hafta.baslangic, haftaSonu(hafta.baslangic), dil)}`}
      kapat={kapat}
      altBilgi={
        <>
          <a className="dugme dugme-ikincil" href={`#/haftalik/${hafta.id}/cikti`}>
            <Printer size={16} /> {t("cikti")}
          </a>
          <a className="dugme" href={`#/haftalik/${hafta.id}`}>
            {t("planiAc")}
          </a>
        </>
      }
    >
      <DurumCizgisi etiket={t("planDurumu")} asamalar={HAFTA_DURUMLARI.map((x) => t(HAFTA_DURUM_ADI[x]))} simdi={HAFTA_DURUMLARI.indexOf(hafta.durum)} bitti={hafta.durum === "kesinlesti"} />
      <SayiDizisi
        sayilar={[
          [t("gundemKalemi"), gundem.length],
          [t("kararBekleyen"), hafta.durum === "kesinlesti" ? "—" : kararBekleyenler(hafta).length],
          [t("onIncelemede"), gundem.filter((k) => k.onInceleme?.durum === "gonderildi" && k.karar === "bekliyor").length],
          [t("krKabul"), say("kabul")],
          [t("krBilgi"), say("bilgi")],
          [t("krRet"), hafta.kalemler.length - gundem.length + say("ret")],
        ]}
      />
      {hafta.anaKonular.length > 0 && (
        <>
          <div className="alan-etiket ara-ust-2">{t("haftaninAnaDosyalari")}</div>
          <ul className="liste ara-ust">
            {hafta.anaKonular.map((a) => (
              <li key={a.id}>
                <span className="ad">
                  <b>
                    <Icerik>{a.baslik}</Icerik>
                  </b>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Pencere>
  );
}

function OzelPencere({ ozel, kapat }: { ozel: OzelYayin; kapat: () => void }) {
  const { t, dil } = useDil();
  const tamam = ozel.hazirlik.filter((h) => h.tamam).length;
  const kalan = Math.round((new Date(ozel.tarih + "T12:00:00").getTime() - new Date(bugun() + "T12:00:00").getTime()) / 86_400_000);
  return (
    <Pencere
      baslik={<Icerik>{ozel.ad}</Icerik>}
      alt={`${tarihYaz(ozel.tarih, dil, "uzun")} · ${kalan > 0 ? t("kalanGun", { n: kalan }) : kalan === 0 ? t("bugun") : t("yayinlandi")}`}
      kapat={kapat}
      altBilgi={
        <a className="dugme" href="#/ozel">
          {t("planiAc")}
        </a>
      }
    >
      <div className="alan-etiket">
        {t("hazirlikAsamalari")} · {t("hazirlikOrani", { tamam, toplam: ozel.hazirlik.length })}
      </div>
      <Ilerleme oran={tamam / Math.max(1, ozel.hazirlik.length)} />
      <ul className="liste asama-listesi ara-ust-2">
        {ozel.hazirlik.map((h) => (
          <li key={h.id} className={h.tamam ? "tamam" : ""}>
            {h.tamam ? <CheckCircle size={16} className="iyi-yazi" /> : <Circle size={16} className="sonuk-yazi" />}
            <span className="ad">
              <Icerik>{h.metin}</Icerik>
            </span>
          </li>
        ))}
      </ul>
    </Pencere>
  );
}

function SahaPencere({ d, g, kapat }: { d: Durum; g: Gorevlendirme; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const kisi = kisiBul(d, g.kisiId);
  return (
    <Pencere
      baslik={<Icerik>{g.yer}</Icerik>}
      alt={`${ad(kisi)} · ${t(HAREKET_TURU_ADI[g.tur])} · ${tarihYaz(g.baslangic, dil, "kisa")} – ${tarihYaz(g.bitis, dil, "kisa")}`}
      kapat={kapat}
      altBilgi={
        <a className="dugme" href={g.durum === "talep" ? "#/talepler" : "#/saha"}>
          {t(g.durum === "talep" ? "mTalepler" : "mSaha")}
        </a>
      }
    >
      <DurumCizgisi etiket={t("durum")} asamalar={SAHA_ASAMALARI.map((x) => t(GOREVLENDIRME_DURUM_ADI[x]))} simdi={SAHA_ASAMALARI.indexOf(g.durum)} bitti={g.durum === "bitti"} />
      {g.aciklama && (
        <p className="ara-ust-2">
          <Icerik blok>{g.aciklama}</Icerik>
        </p>
      )}
    </Pencere>
  );
}

/* --- Kart --- */

const SAHA_TONU: Record<GorevlendirmeDurum, string> = { talep: "uyari", onayli: "vurgu", suruyor: "iyi", bitti: "" };

export default function PanelPlanlari() {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [sekme, setSekme] = useState<Sekme>("gunluk");
  const [secim, setSecim] = useState<Secim>(null);
  const B = bugun();

  const gunluk = v.planlar.filter((p) => p.tarih >= gunEkle(B, -1)).sort((a, b) => a.tarih.localeCompare(b.tarih));
  const haftalik = [...v.haftalik].sort((a, b) => a.baslangic.localeCompare(b.baslangic)).filter((h) => haftaSonu(h.baslangic) >= B);
  const ozel = [...v.ozel].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const saha = v.gorevlendirmeler.filter((g) => sahaGorevi(g) && g.bitis >= B).sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  const sayilar: Record<Sekme, number> = { gunluk: gunluk.length, haftalik: haftalik.length, ozel: ozel.length, saha: saha.length };

  let liste: ReactNode;
  if (sekme === "gunluk")
    liste = gunluk.map((p) => {
      const paketler = planPaketleri(v, p);
      return (
        <Satir
          key={p.id}
          ad={gunEtiketi(p.tarih, t, dil)}
          alt={t("planOzeti", { baslik: p.basliklar.length, paket: paketler.length })}
          oran={(PLAN_DURUMLARI.indexOf(p.durum) + 1) / PLAN_DURUMLARI.length}
          rozet={<Rozet ton={PLAN_DURUM_TONU[p.durum]}>{t(PLAN_DURUM_ADI[p.durum])}</Rozet>}
          ac={() => setSecim({ tur: "gunluk", plan: p })}
        />
      );
    });
  else if (sekme === "haftalik")
    liste = haftalik.map((h) => {
      const gundem = h.kalemler.filter(gundemde);
      return (
        <Satir
          key={h.id}
          ad={aralikYaz(h.baslangic, haftaSonu(h.baslangic), dil)}
          alt={t("haftaOzetSatiri", { kalem: gundem.length, bekleyen: h.durum === "kesinlesti" ? 0 : kararBekleyenler(h).length, dosya: h.anaKonular.length })}
          oran={gundem.filter((k) => k.karar !== "bekliyor").length / Math.max(1, gundem.length)}
          rozet={<Rozet ton={HAFTA_DURUM_TONU[h.durum]}>{t(HAFTA_DURUM_ADI[h.durum])}</Rozet>}
          ac={() => setSecim({ tur: "haftalik", hafta: h })}
        />
      );
    });
  else if (sekme === "ozel")
    liste = ozel.map((o) => {
      const tamam = o.hazirlik.filter((h) => h.tamam).length;
      return (
        <Satir
          key={o.id}
          ad={<Icerik>{o.ad}</Icerik>}
          alt={tarihYaz(o.tarih, dil, "uzun")}
          oran={tamam / Math.max(1, o.hazirlik.length)}
          rozet={<Rozet ton={tamam === o.hazirlik.length ? "iyi" : ""}>{t("hazirlikOrani", { tamam, toplam: o.hazirlik.length })}</Rozet>}
          ac={() => setSecim({ tur: "ozel", ozel: o })}
        />
      );
    });
  else
    liste = saha.map((g) => (
      <Satir
        key={g.id}
        ad={
          <>
            <Icerik>{g.yer}</Icerik> · {ad(kisiBul(v, g.kisiId))}
          </>
        }
        alt={`${tarihYaz(g.baslangic, dil, "kisa")} – ${tarihYaz(g.bitis, dil, "kisa")}`}
        rozet={<Rozet ton={SAHA_TONU[g.durum]}>{t(GOREVLENDIRME_DURUM_ADI[g.durum])}</Rozet>}
        ac={() => setSecim({ tur: "saha", g })}
      />
    ));

  const kapat = () => setSecim(null);
  return (
    <Kart baslik={t("ypPlanlar")} ikon={<ClipboardList size={18} />} className="panel-planlari">
      <div className="sekmeler" role="tablist" aria-label={t("ypPlanlar")}>
        {SEKMELER.map((s) => (
          <button key={s.id} type="button" role="tab" id={`pp-${s.id}`} aria-selected={sekme === s.id} aria-controls="pp-icerik" className={sekme === s.id ? "acik" : ""} onClick={() => setSekme(s.id)}>
            {s.ikon} {t(s.ad)} <em>{sayilar[s.id]}</em>
          </button>
        ))}
      </div>
      <div id="pp-icerik" role="tabpanel" aria-labelledby={`pp-${sekme}`} className="ara-ust-2">
        {sayilar[sekme] === 0 ? <Bos kucuk metin={t("kayitYok")} /> : <ul className="liste plan-satirlari">{liste}</ul>}
      </div>
      {secim?.tur === "gunluk" && <GunlukPencere d={v} plan={secim.plan} kapat={kapat} />}
      {secim?.tur === "haftalik" && <HaftalikPencere hafta={secim.hafta} kapat={kapat} />}
      {secim?.tur === "ozel" && <OzelPencere ozel={secim.ozel} kapat={kapat} />}
      {secim?.tur === "saha" && <SahaPencere d={v} g={secim.g} kapat={kapat} />}
    </Kart>
  );
}
