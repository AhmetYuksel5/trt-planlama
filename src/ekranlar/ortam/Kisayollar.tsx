import { ArrowDown, ArrowUp, Pencil, Plus, Star, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { MENU, maddeAdi, maddeGorunur, sayfaMaddesi } from "../../bilesenler/AnaMenu";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { Bos, Pencere } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { kisayollariKaydet } from "../../eylemler";
import { KISAYOL_EN_COK, kisayolGorebilir, kisininKisayollari } from "../../kisayol";
import { yolSayfasi } from "../../ortam";
import { useVeri, type Kisi } from "../../veri";
import { IkonDugme } from "../nextday/Bolumler";

/*
 * Kısayolun görünüşü menüden: ikon menü maddesinin, ad kişinin menüde
 * gördüğü ad. Planların beş ana başlığı kendi rengini, takvim laciverti
 * taşıyor; öbür sayfalar tek vurgu renginde (renk yalnız ana başlıklarda).
 * Planların adı birimin kullandığı ad (Next Day, Weekly, Special Coverage);
 * muhabirde menüsündeki ad ("Görevlerim", "Takvimim").
 */
const RENK: Record<string, string> = {
  nextday: "renk-nextday",
  haftalik: "renk-haftalik",
  aylik: "renk-aylik",
  ozel: "renk-ozel",
  saha: "renk-saha",
  takvim: "renk-takvim",
};
const PLAN_ADI: Record<string, Anahtar> = {
  "nextday/yarin": "ksNextday",
  haftalik: "ksHaftalik",
  aylik: "ksAylik",
  ozel: "ksOzel",
  saha: "ksSaha",
  takvim: "ksTakvim",
};

export function kisayolBilgisi(ben: Kisi, kimlik: string): { ad: Anahtar; ikon: LucideIcon; renk: string } | undefined {
  const sayfa = yolSayfasi(kimlik);
  const m = sayfaMaddesi(sayfa);
  if (!m) return undefined;
  // Yarının planı menüde ayrı madde değil; muhabir Next Day'i zaten görmüyor.
  const ad = PLAN_ADI[kimlik] && (ben.birim !== "muhabir" || kimlik === "nextday/yarin") ? PLAN_ADI[kimlik] : maddeAdi(ben, m);
  return { ad, ikon: m.ikon, renk: RENK[sayfa] ?? "renk-genel" };
}

/** Eklenebilecek kısayollar, menünün gruplarıyla; Next Day'in başında yarının planı. */
const kisayolSecenekleri = (ben: Kisi) =>
  MENU.map((g) => {
    const kimlikler = g.maddeler.filter((m) => maddeGorunur(ben, m) && kisayolGorebilir(ben, m.sayfa)).map((m) => m.sayfa);
    if (g.ad === "mgPlanlama" && kisayolGorebilir(ben, "nextday/yarin")) kimlikler.unshift("nextday/yarin");
    return { ad: g.ad, kimlikler };
  }).filter((g) => g.kimlikler.length > 0);

export function KisayolKutusu({ ben, kimlik, bag = true }: { ben: Kisi; kimlik: string; bag?: boolean }) {
  const { t } = useDil();
  const b = kisayolBilgisi(ben, kimlik);
  if (!b) return null;
  const Ikon = b.ikon;
  const ad = t(b.ad);
  return bag ? (
    <a href={`#/${kimlik}`} className={`kisayol-kutu ${b.renk}`} data-kisayol={kimlik} aria-label={ad} title={ad}>
      <Ikon size={18} />
    </a>
  ) : (
    <span className={`kisayol-kutu ${b.renk}`} aria-hidden="true">
      <Ikon size={16} />
    </span>
  );
}

/**
 * Kısayolları düzenleme: sırala, kaldır, menüden ekle. Her adım hemen
 * kaydediliyor (ana sayfa düzeni gibi); kayıt yoksa birimin varsayılanı.
 */
function KisayolPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const liste = kisininKisayollari(v, ben);
  const kayitli = !!v.kisayollar?.[ben.id];
  const dolu = liste.length >= KISAYOL_EN_COK;
  const kaydet = (l: string[] | null) => kisayollariKaydet(ben, l);
  const tasi = (i: number, yon: -1 | 1) => {
    const yeni = [...liste];
    [yeni[i], yeni[i + yon]] = [yeni[i + yon], yeni[i]];
    kaydet(yeni);
  };
  const adi = (k: string) => {
    const b = kisayolBilgisi(ben, k);
    return b ? t(b.ad) : k;
  };
  return (
    <Pencere
      baslik={t("kisayollariDuzenle")}
      alt={t("kisayolDuzenNotu")}
      kapat={kapat}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => kaydet(null)} disabled={!kayitli}>
            {t("varsayilanaDon")}
          </button>
          <button type="button" className="dugme dugme-kucuk" onClick={kapat}>
            {t("bitti")}
          </button>
        </>
      }
    >
      {liste.length === 0 ? (
        <Bos kucuk metin={t("kisayolYok")} />
      ) : (
        <ol className="kisayol-listesi">
          {liste.map((k, i) => (
            <li key={k} data-kisayol={k}>
              <KisayolKutusu ben={ben} kimlik={k} bag={false} />
              <span className="kisayol-adi">{adi(k)}</span>
              {i > 0 && <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukariTasi")} onClick={() => tasi(i, -1)} />}
              {i < liste.length - 1 && <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagiTasi")} onClick={() => tasi(i, 1)} />}
              <IkonDugme ikon={<X size={15} />} etiket={t("kisayoluKaldir")} ton="kotu-yazi" onClick={() => kaydet(liste.filter((x) => x !== k))} />
            </li>
          ))}
        </ol>
      )}
      <div className="modul-secici ara-ust-2">
        <div className="alan-etiket">{t("kisayolEkle")}</div>
        {dolu && <p className="bos-kucuk">{t("kisayolSiniri", { n: KISAYOL_EN_COK })}</p>}
        {kisayolSecenekleri(ben).map((g, i) => {
          const eklenebilir = g.kimlikler.filter((k) => !liste.includes(k));
          if (!eklenebilir.length) return null;
          return (
            <section key={g.ad ?? i} className="modul-grup">
              {g.ad && <h3>{t(g.ad)}</h3>}
              <div className="modul-secenekler">
                {eklenebilir.map((k) => (
                  <button key={k} type="button" className="modul-secenek" data-kisayol-ekle={k} disabled={dolu} onClick={() => kaydet([...liste, k])}>
                    <KisayolKutusu ben={ben} kimlik={k} bag={false} /> {adi(k)}
                    <Plus size={14} className="ekle-isareti" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Pencere>
  );
}

/* Çubukta satır içinde en çok bu kadar kısayol; fazlası ve adları ★ menüsünde. */
const CUBUKTA = 6;

/**
 * Üst çubuğun kısayolları: ilk altısı renkli ikon (ad ipucunda); ★ hepsini
 * adıyla ve "Kısayolları düzenle"yi açıyor. Dar çubukta yalnız ★ kalıyor
 * (CSS); tarayıcının yer imleri çubuğundaki "»" gibi.
 */
export function UstKisayollar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [duzen, setDuzen] = useState(false);
  const liste = kisininKisayollari(v, ben);
  // Pencere gezinme bölgesinin dışında: içindeki küçük kutucuklar çubuğun kısayolu sayılmasın.
  return (
    <>
      <nav className="ust-kisayollar" aria-label={t("kisayollar")}>
        <span className="ust-kisayol-satiri">
          {liste.slice(0, CUBUKTA).map((k) => (
            <KisayolKutusu key={k} ben={ben} kimlik={k} />
          ))}
        </span>
        <IslemMenusu etiket={t("tumKisayollar")} dugmeSinifi="ikon-dugme" ikon={<Star size={17} />} menuSinifi="kisayol-menusu">
          {liste.map((k) => {
            const b = kisayolBilgisi(ben, k);
            return (
              b && (
                <a key={k} role="menuitem" className="acilir-satir" href={`#/${k}`} data-kisayol-menu={k}>
                  <KisayolKutusu ben={ben} kimlik={k} bag={false} /> {t(b.ad)}
                </a>
              )
            );
          })}
          <button type="button" role="menuitem" className="acilir-satir" onClick={() => setDuzen(true)}>
            <Pencil size={16} /> {t("kisayollariDuzenle")}
          </button>
        </IslemMenusu>
      </nav>
      {duzen && <KisayolPenceresi ben={ben} kapat={() => setDuzen(false)} />}
    </>
  );
}

/** Telefondaki Menü paneli: kısayollar adıyla, dokunmaya uygun; sonda düzenleme. */
export function KisayolKutulari({ ben, sec }: { ben: Kisi; sec?: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const [duzen, setDuzen] = useState(false);
  const liste = kisininKisayollari(v, ben);
  return (
    <>
      <nav className="kisayol-kutulari" aria-label={t("kisayollarim")}>
        {liste.map((k) => {
          const b = kisayolBilgisi(ben, k);
          return (
            b && (
              <a key={k} href={`#/${k}`} data-kisayol={k} onClick={sec}>
                <KisayolKutusu ben={ben} kimlik={k} bag={false} /> {t(b.ad)}
              </a>
            )
          );
        })}
        <button type="button" onClick={() => setDuzen(true)}>
          <Pencil size={16} /> {t("kisayollariDuzenle")}
        </button>
      </nav>
      {duzen && <KisayolPenceresi ben={ben} kapat={() => setDuzen(false)} />}
    </>
  );
}
