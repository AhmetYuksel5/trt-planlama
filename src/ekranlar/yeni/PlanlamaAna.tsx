import { useSessizPosta } from "../../bilesenler/sessizPosta";
import { useState } from "react";
import { AnildigimNotlar } from "../../bilesenler/Anma";
import { OnayBekleyenHesaplar } from "../../bilesenler/HesapOnayi";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { GorevTalepleri, SartliPaketler } from "../../bilesenler/PaketGorevi";
import { OnayKuyrugu } from "../../bilesenler/PaketSonucu";
import { Bos, Pencere } from "../../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../../dil";
import { HAFTA_DURUM_ADI, KISI_DURUM_ADI, PLAN_DURUM_ADI } from "../../etiketler";
import { oneriAkisi } from "../../anaPano";
import { gorunenFaaliyetler, yaklasanlar } from "../../takvim";
import { kisiBugunDurumu } from "../../muhabirIletisim";
import { oneriSekmesi } from "../../oneriSekmeleri";
import { kararlariGetir } from "../../planlamaKararlari";
import { bugun, gunFarki } from "../../tarih";
import { muhabirler, useVeri, type Kisi } from "../../veri";
import { BugunkuGorevlerim, GununNotu } from "../ana/Planlama";
import { MasalardakiOneriler } from "../oneri/MasaSorusu";
import { OneriListesi } from "../oneri/OneriGovde";
import type { PencereDurumu } from "../oneri/OneriKarti";
import { penceredenGit } from "../../yol";
import { useMedya } from "../takvim/ortak";
import AnaPano from "./AnaPano";

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

/* Masaüstünde pano (AnaPano: sabit, yerinde açılan), telefonda ve tablette kutular (mobil denetimde onaylanan düzen). */
export default function YeniPlanlamaAna({ ben }: { ben: Kisi }) {
  const masaustu = useMedya("(min-width: 961px)");
  // Posta sayısı Outlook'un okunmamışlarıyla eşit kalsın: kutu sessizce çekilir (15 dakikada bir).
  useSessizPosta(ben, true);
  return masaustu ? <AnaPano ben={ben} /> : <KutuluAna ben={ben} />;
}

/*
 * Telefon ve tablette tek ekran (kullanıcı: bütün temel şeylere buradan
 * ulaşılsın, telefonun tek sayfasına sığsın; çizimdeki öneri akışı): dört
 * bölüm. Öneriler: ham öneri (karar bekleyen, panelde karar) ve akışın öbür
 * dört kutusu (görevlendirilmiş, takip, arşiv öneri ve paket; sayfalarına
 * götürür). Kararlar ve işlerim: küçük sayı kutuları, panelde. Planlar 2×2,
 * Ekip üç kutu. Kutunun yeri sabit, boşken sönük; sayılar masaüstü panonun
 * şeridiyle aynı kuraldan (anaPano.ts → oneriAkisi).
 */
function KutuluAna({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const b = bugun();
  const k = kararlariGetir(v, ben, b);
  const a = oneriAkisi(v, ben, b);
  const [panel, setPanel] = useState<PanelTuru | null>(null);
  const muh = muhabirler(v).filter((x) => !x.pasif);
  const izinde = muh.filter((x) => kisiBugunDurumu(v, x, b) === "izinli").length;
  const takvim = yaklasanlar(gorunenFaaliyetler(v, ben), 7, b).length;
  const nd = k.nextDay;
  const hf = k.weekly;
  const ay = v.aylik.find((x) => x.ay === b.slice(0, 7));
  const ozel = v.ozel.filter((o) => (o.bitis ?? o.tarih) >= b).length;
  const paketSayi = k.onay + k.sartli + k.gorevTalebi;
  const birimSayi = k.birimGorusu + k.birimYanitladi;
  // Küçük sayı kutusu: panel açar ya da sayfaya götürür; boşken sönük (panel açılmaz).
  const mini = (id: string, ad: string, sayi: number, ac: PanelTuru | string, vurgu = sayi > 0, hep = false) => {
    const sonuk = !hep && sayi === 0;
    const sinif = `py-kutu py-mini${vurgu ? " vurgu" : ""}${sonuk ? " sonuk" : ""}`;
    const ic = (
      <>
        <span className="py-sayi">{sayi}</span>
        <b>{ad}</b>
      </>
    );
    return ac.startsWith("#") ? (
      <a key={id} href={ac} className={sinif} data-py-kutu={id}>
        {ic}
      </a>
    ) : (
      <button key={id} type="button" className={sinif} onClick={() => !sonuk && setPanel(ac as PanelTuru)} aria-disabled={sonuk || undefined} data-py-kutu={id}>
        {ic}
      </button>
    );
  };
  const plan = (id: string, ad: Anahtar, href: string, alt: string, uyari: boolean) => (
    <a key={id} href={href} className="py-kutu py-plan" data-py-kutu={id}>
      <b>{t(ad)}</b>
      <small className={uyari ? "uyari" : undefined}>{alt}</small>
    </a>
  );
  const akis = (id: string, ad: Anahtar, sayi: number, href: string, ton: string) => (
    <a key={id} href={href} className={`py-akis-kutu ${ton}`} data-py-akis={id}>
      <b>{sayi}</b>
      <span>{t(ad)}</span>
    </a>
  );
  return (
    <div className="py-ana py-tek" data-yeni-planlama>
      <section className="py-bolum" aria-labelledby="py-b-oneri">
        <h2 id="py-b-oneri">{t("mOneriler")}</h2>
        <div className="py-akis">
          <button type="button" className={`py-kutu py-ham${k.oneri ? " vurgu" : " sonuk"}`} onClick={() => k.oneri && setPanel("oneri")} aria-disabled={!k.oneri || undefined} data-py-kutu="oneri">
            <span>
              <b>{t("apHam")}</b>
              {k.oneri > 0 && <small>{t("apHamAlt", { yakin: k.oneriYakin, baska: a.baskasinda })}</small>}
            </span>
            <span className="py-sayi">{k.oneri}</span>
          </button>
          <div className="py-akis-hucreler">
            {akis("gorevli", "apGorevliKisa", a.gorevli, "#/paketler/gorevli", "ton-iyi")}
            {akis("takip", "apTakip", a.takip, "#/takipler", "ton-uyari")}
            {akis("arsivOneri", "apArsivOneri", a.arsivOneri, "#/oneriler/arsiv", "ton-sonuk")}
            {akis("arsivPaket", "apArsivPaket", a.arsivPaket, "#/paketler/arsiv", "ton-sonuk")}
          </div>
        </div>
      </section>
      <section className="py-bolum" aria-labelledby="py-b-karar">
        <h2 id="py-b-karar">{t("pyBolumKararlar")}</h2>
        <div className="py-kutular py-sira">
          {mini("paket", t("pyKisaPaket"), paketSayi, "paket")}
          {mini("birim", t("pyKisaBirim"), birimSayi, "birim", k.birimYanitladi > 0)}
          {mini("gorev", t("pyGorevlerim"), k.isler, "gorev")}
          {mini("anma", t("pyKisaAnma"), k.anma, "anma")}
          {k.hesapOnayi > 0 && mini("hesap", t("pyKisaHesap"), k.hesapOnayi, "hesap")}
        </div>
      </section>
      <section className="py-bolum" aria-labelledby="py-b-plan">
        <h2 id="py-b-plan">{t("apPlanlar")}</h2>
        <div className="py-kutular py-ikili">
          {plan("nextday", "mNextday", nd ? `#/nextday/${nd.id}` : "#/nextday/yarin", nd ? `${tarihYaz(nd.tarih, dil, "kisa")} · ${k.nextDayPkg ? t("pyKararsizPkg", { n: k.nextDayPkg }) : t(PLAN_DURUM_ADI[nd.durum])}` : t("pyPlanYok"), k.nextDayPkg > 0)}
          {plan("weekly", "mHaftalik", hf ? `#/haftalik/${hf.id}` : "#/haftalik", hf ? `${tarihYaz(hf.baslangic, dil, "kisa")} · ${k.weeklyKarar ? t("pyKararBekleyen", { n: k.weeklyKarar }) : t(HAFTA_DURUM_ADI[hf.durum])}` : t("pyPlanYok"), k.weeklyKarar > 0)}
          {plan("aylik", "mAylik", "#/aylik", ay ? `${tarihYaz(b, dil, "ay")} · ${t(ay.durum === "onayli" ? "ayOnayli" : "hazirlaniyor")}` : t("pyPlanYok"), false)}
          {plan("ozel", "mOzel", "#/ozel", ozel ? `${ozel} · ${t("pyYaklasan")}` : t("pyPlanYok"), false)}
        </div>
      </section>
      <section className="py-bolum" aria-labelledby="py-b-ekip">
        <h2 id="py-b-ekip">{t("pyBolumEkip")}</h2>
        <div className="py-kutular py-sira">
          {mini("muhabir", t("pyKisaMuhabir", { i: izinde }), muh.length, "muhabir", false, true)}
          {mini("posta", t("mPosta"), k.posta, "#/posta", k.posta > 0, true)}
          {mini("takvim", t("pyKisaTakvim"), takvim, "#/takvim", false, true)}
        </div>
      </section>
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
  hesap: "#/organizasyon/kisiler",
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
          <a className="dugme dugme-ikincil" href={sayfa} onClick={(e) => penceredenGit(e, kapat, sayfa)} data-py-sayfa>
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
  const [pencere, setPencere] = useState<PencereDurumu>(null);
  const liste = v.oneriler
    .filter((o) => oneriSekmesi(v, o, b) === "karar")
    .sort((x, y) => Math.abs(gunFarki(b, x.hedefTarih ?? "9999-12-31")) - Math.abs(gunFarki(b, y.hedefTarih ?? "9999-12-31")) || y.zaman.localeCompare(x.zaman));
  /*
   * Plan ekranlarının listesi: kartta "Plana ekle" ve ret simgesi, karar
   * pencere açmadan verilir (mobil denetim, akış önerisi: 5 dokunma 3'e).
   * "Plana ekle" önerinin günlerine düşen planları sorar (öneriler sayfası gibi).
   */
  return liste.length === 0 ? (
    <Bos metin={t("pyTemiz")} />
  ) : (
    <div className="py-oneriler">
      <OneriListesi ben={ben} d={v} oneriler={liste} gorunum="kart" pencere={pencere} setPencere={setPencere} ekleMetni={t("planaEkle")} ertelenebilir />
    </div>
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
