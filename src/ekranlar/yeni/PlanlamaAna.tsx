import { AtSign, Building2, CalendarDays, CalendarRange, CheckCircle, ClipboardList, Lightbulb, Mail, Share2, Sparkles, Tv, Users, Calendar, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnildigimNotlar } from "../../bilesenler/Anma";
import { OnayBekleyenHesaplar } from "../../bilesenler/HesapOnayi";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { GorevTalepleri, SartliPaketler } from "../../bilesenler/PaketGorevi";
import { OnayKuyrugu } from "../../bilesenler/PaketSonucu";
import { Bos, Pencere } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAFTA_DURUM_ADI, KISI_DURUM_ADI, PLAN_DURUM_ADI } from "../../etiketler";
import { kisiBugunDurumu } from "../../muhabirIletisim";
import { oneriSekmesi } from "../../oneriSekmeleri";
import { kararlariGetir } from "../../planlamaKararlari";
import { bugun, gunFarki } from "../../tarih";
import { muhabirler, useVeri, type Kisi } from "../../veri";
import { BugunkuGorevlerim, GununNotu } from "../ana/Planlama";
import { MasalardakiOneriler } from "../oneri/MasaSorusu";
import { OneriAyrinti } from "../oneri/OneriGovde";
import { OneriKarti } from "../oneri/OneriKarti";

/*
 * Planlama'nın ana sayfası, yeni tasarımda (belgeler/planlama-yeni-mimari.md).
 * Kullanıcı: ana sayfa çok işlevsel olsun; bilgiler aynı anda dökülmesin ama
 * ulaşmak kolay olsun. Sayfa kutulardan oluşur: kısa kararların kutusu sağdan
 * açılan panelde açılır, iş panelde biter (öneri kartına basınca önerinin
 * penceresi panelin üstüne açılır, kapatınca panele dönülür); uzun işin
 * kutusu (planlar) kendi sayfasına götürür. Kutunun yeri sabit (ezber
 * bozulmasın), boşken sönük. Sayılar tek kaynaktan (planlamaKararlari.ts),
 * menüyle aynı.
 */

type PanelTuru = "oneri" | "paket" | "birim" | "gorev" | "anma" | "gunNotu" | "muhabir" | "hesap";

interface Kutu {
  id: string;
  ad: Anahtar;
  ikon: LucideIcon;
  sayi: number;
  alt: ReactNode;
  panel?: PanelTuru;
  href?: string;
  genis?: boolean;
  /** Bekleyen iş kişide: sayı vurgulu. */
  vurgu?: boolean;
  /** İş olmasa da göster (planlar, muhabirler). */
  hep?: boolean;
}

export default function YeniPlanlamaAna({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const b = bugun();
  const k = kararlariGetir(v, ben, b);
  const [panel, setPanel] = useState<PanelTuru | null>(null);
  const muh = muhabirler(v).filter((x) => !x.pasif);
  const durumlar = muh.map((x) => kisiBugunDurumu(v, x, b));
  const sahada = durumlar.filter((x) => x === "sahada").length;
  const izinde = durumlar.filter((x) => x === "izinli").length;
  const nd = k.nextDay;
  const hf = k.weekly;
  const ay = v.aylik.find((a) => a.ay === b.slice(0, 7));
  const kutular: Kutu[] = [
    { id: "oneri", ad: "pyOneriler", ikon: Lightbulb, sayi: k.oneri, alt: k.oneriYakin ? t("pyYakin", { n: k.oneriYakin }) : t("pyTemiz"), panel: "oneri", vurgu: k.oneri > 0 },
    { id: "paket", ad: "pyPaketKararlari", ikon: CheckCircle, sayi: k.onay + k.sartli + k.gorevTalebi, alt: [k.onay && t("pyOnay", { n: k.onay }), k.sartli && t("pySartli", { n: k.sartli }), k.gorevTalebi && t("pyTalep", { n: k.gorevTalebi })].filter(Boolean).join(" · ") || t("pyTemiz"), panel: "paket", vurgu: k.onay + k.sartli + k.gorevTalebi > 0 },
    { id: "birim", ad: "pyBirimGorusu", ikon: Share2, sayi: k.birimGorusu + k.birimYanitladi, alt: k.birimYanitladi ? t("pyYanitladi", { n: k.birimYanitladi }) : k.birimGorusu ? t("pyBekliyor", { n: k.birimGorusu }) : t("pyTemiz"), panel: "birim", vurgu: k.birimYanitladi > 0 },
    { id: "gorev", ad: "pyGorevlerim", ikon: ClipboardList, sayi: k.isler, alt: k.isler ? t("pyAcikIs") : t("pyTemiz"), panel: "gorev", vurgu: k.isler > 0, hep: true },
    { id: "anma", ad: "pyAnmalar", ikon: AtSign, sayi: k.anma, alt: k.anma ? t("pyGorulmedi") : t("pyTemiz"), panel: "anma", vurgu: k.anma > 0 },
    { id: "gunNotu", ad: "gunNotu", ikon: Sparkles, sayi: k.gununNotu, alt: k.gununNotu ? t("pyDikkat") : t("pyTemiz"), panel: "gunNotu", vurgu: k.gununNotu > 0 },
    { id: "muhabir", ad: "pyMuhabirler", ikon: Users, sayi: muh.length, alt: t("pySahadaIzinde", { s: sahada, i: izinde }), panel: "muhabir", hep: true },
    { id: "posta", ad: "mPosta", ikon: Mail, sayi: k.posta, alt: k.posta ? t("pyOkunmamis") : t("pyTemiz"), href: "#/posta", vurgu: k.posta > 0, hep: true },
    ...(k.hesapOnayi ? [{ id: "hesap", ad: "pyHesapOnayi" as Anahtar, ikon: Building2, sayi: k.hesapOnayi, alt: t("pyBekliyor", { n: k.hesapOnayi }), panel: "hesap" as const, vurgu: true }] : []),
    {
      id: "nextday",
      ad: "mNextday",
      ikon: CalendarDays,
      sayi: k.nextDayPkg,
      alt: nd ? `${tarihYaz(nd.tarih, dil)} · ${t(PLAN_DURUM_ADI[nd.durum])}${k.nextDayPkg ? ` · ${t("pyKararsizPkg", { n: k.nextDayPkg })}` : ""}` : t("pyPlanYok"),
      href: nd ? `#/nextday/${nd.id}` : "#/nextday/yarin",
      genis: true,
      vurgu: k.nextDayPkg > 0,
      hep: true,
    },
    {
      id: "weekly",
      ad: "mHaftalik",
      ikon: CalendarRange,
      sayi: k.weeklyKarar,
      alt: hf ? `${tarihYaz(hf.baslangic, dil)} · ${t(HAFTA_DURUM_ADI[hf.durum])}${k.weeklyKarar ? ` · ${t("pyKararBekleyen", { n: k.weeklyKarar })}` : ""}` : t("pyPlanYok"),
      href: hf ? `#/haftalik/${hf.id}` : "#/haftalik",
      genis: true,
      vurgu: k.weeklyKarar > 0,
      hep: true,
    },
    {
      id: "aylik",
      ad: "mAylik",
      ikon: Calendar,
      sayi: ay?.olaylar?.length ?? 0,
      alt: ay ? `${tarihYaz(b, dil, "ay")} · ${t(ay.durum === "onayli" ? "ayOnayli" : "hazirlaniyor")}` : t("pyPlanYok"),
      href: "#/aylik",
      hep: true,
    },
    { id: "ozel", ad: "mOzel", ikon: Tv, sayi: v.ozel.filter((o) => (o.bitis ?? o.tarih) >= b).length, alt: t("pyYaklasan"), href: "#/ozel", hep: true },
  ];
  return (
    <div className="py-ana" data-yeni-planlama>
      <div className="py-kutular">
        {kutular.map((x) => {
          const Ikon = x.ikon;
          const sonuk = !x.hep && x.sayi === 0;
          const ic = (
            <>
              <span className="py-kutu-bas">
                <Ikon size={17} />
                <b>{t(x.ad)}</b>
              </span>
              {(x.sayi > 0 || x.hep) && <span className="py-sayi">{x.sayi}</span>}
              {x.alt && <small>{x.alt}</small>}
            </>
          );
          const sinif = `py-kutu${x.genis ? " genis" : ""}${x.vurgu ? " vurgu" : ""}${sonuk ? " sonuk" : ""}`;
          return x.href ? (
            <a key={x.id} href={x.href} className={sinif} data-py-kutu={x.id}>
              {ic}
            </a>
          ) : (
            <button key={x.id} type="button" className={sinif} onClick={() => !sonuk && setPanel(x.panel!)} aria-disabled={sonuk || undefined} data-py-kutu={x.id}>
              {ic}
            </button>
          );
        })}
      </div>
      {panel && <KararPaneli ben={ben} tur={panel} kapat={() => setPanel(null)} />}
    </div>
  );
}

const PANEL_ADI: Record<PanelTuru, Anahtar> = {
  oneri: "pyOneriler",
  paket: "pyPaketKararlari",
  birim: "pyBirimGorusu",
  gorev: "pyGorevlerim",
  anma: "pyAnmalar",
  gunNotu: "gunNotu",
  muhabir: "pyMuhabirler",
  hesap: "pyHesapOnayi",
};
const PANEL_SAYFASI: Partial<Record<PanelTuru, string>> = {
  oneri: "#/oneriler",
  paket: "#/paketler",
  birim: "#/oneriler",
  gorev: "#/gorevler",
  anma: "#/gorevler",
  muhabir: "#/muhabirler",
  hesap: "#/organizasyon/hesaplar",
};

/* Sağdan açılan panel (yeni tasarımda pencere sağdan açılıyor): içinde var olan kart ve listeler, iş burada biter. */
function KararPaneli({ ben, tur, kapat }: { ben: Kisi; tur: PanelTuru; kapat: () => void }) {
  const { t } = useDil();
  const sayfa = PANEL_SAYFASI[tur];
  return (
    <Pencere
      baslik={t(PANEL_ADI[tur])}
      kapat={kapat}
      altBilgi={
        sayfa && (
          <a className="dugme dugme-ikincil" href={sayfa} onClick={kapat} data-py-sayfa>
            {t("pySayfayiAc")}
          </a>
        )
      }
    >
      <div className="py-panel" data-py-panel={tur}>
        {tur === "oneri" && <OneriPaneli ben={ben} />}
        {tur === "paket" && (
          <>
            <OnayKuyrugu ben={ben} />
            <SartliPaketler ben={ben} />
            <GorevTalepleri ben={ben} />
          </>
        )}
        {tur === "birim" && <MasalardakiOneriler ben={ben} />}
        {tur === "gorev" && <BugunkuGorevlerim ben={ben} />}
        {tur === "anma" && <AnildigimNotlar ben={ben} />}
        {tur === "gunNotu" && <GununNotu ben={ben} />}
        {tur === "muhabir" && <MuhabirPaneli ben={ben} />}
        {tur === "hesap" && <OnayBekleyenHesaplar ben={ben} />}
      </div>
    </Pencere>
  );
}

/* Karar bekleyen öneriler, Öneriler'in "Karar bekleyen" sekmesinin kuralıyla; bugüne ve yarına düşenler önce. */
function OneriPaneli({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const b = bugun();
  const [acik, setAcik] = useState<string | null>(null);
  const liste = v.oneriler
    .filter((o) => oneriSekmesi(v, o, b) === "karar")
    .sort((x, y) => Math.abs(gunFarki(b, x.hedefTarih ?? "9999-12-31")) - Math.abs(gunFarki(b, y.hedefTarih ?? "9999-12-31")) || y.zaman.localeCompare(x.zaman));
  const o = acik ? v.oneriler.find((x) => x.id === acik) : undefined;
  return (
    <>
      {liste.length === 0 ? (
        <Bos metin={t("pyTemiz")} />
      ) : (
        <div className="py-oneriler">
          {liste.map((x) => (
            <OneriKarti key={x.id} oneri={x} d={v} ac={() => setAcik(x.id)} />
          ))}
        </div>
      )}
      {o && <OneriAyrinti key={o.id} ben={ben} oneri={o} kapat={() => setAcik(null)} />}
    </>
  );
}

/* Muhabirler: bugün sahada ve izinde olanlar önce (kayıttan), her satırda çip (iletişim kartı). */
function MuhabirPaneli({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const b = bugun();
  const sira = { sahada: 0, yolda: 1, izinli: 2, gorevde: 3 } as const;
  const liste = muhabirler(v)
    .filter((x) => !x.pasif)
    .map((x) => ({ k: x, durum: kisiBugunDurumu(v, x, b) }))
    .sort((a, c) => sira[a.durum] - sira[c.durum]);
  return (
    <ul className="liste py-muhabirler">
      {liste.map(({ k, durum }) => (
        <li key={k.id} data-py-muhabir={k.id}>
          <KisiCipi ben={ben} kisi={k} />
          <span className={`durum-hap kd-${durum}`}>{t(KISI_DURUM_ADI[durum])}</span>
        </li>
      ))}
    </ul>
  );
}
