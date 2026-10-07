import { Bell, CalendarCheck, CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Link2, Plus, Search, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bos, Kart, Sayac } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { BIRIM_ADI, bolgeAdi, faaliyetDurumAdi, faaliyetTuruAdi, oncelikAdi, potansiyelAdi, ulkeAdi } from "../../etiketler";
import {
  aramaUyar,
  etkinSuzgecSayisi,
  gorunenFaaliyetler,
  olusumAc,
  aralikOlusumlari,
  siradakiOlusum,
  suzgeceUyar,
  takvimOzeti,
  tarihSuzgeci,
  type Olusum,
  type Suzgec,
} from "../../takvim";
import { ayEkle, bugun, gunEkle } from "../../tarih";
import { BIRIMLER, BOLGELER, FAALIYET_DURUMLARI, FAALIYET_TURLERI, ONCELIKLER, POTANSIYELLER, ULKELER, faaliyetBul, getir, muhabirler, useVeri, type Durum, type Kisi } from "../../veri";
import { faaliyetGorebilir, yapabilir } from "../../yetki";
import { yerindeDegistir, type Yol } from "../../yol";
import { Yetkisiz } from "../Ayarlar";
import { SayfaBasi } from "../ana/Planlama";
import { FaaliyetAyrintisi, type AcikFaaliyet } from "./Ayrinti";
import { FaaliyetFormu } from "./Form";
import { AyGorunumu, GunGorunumu, HaftaGorunumu, ListeGorunumu, YilGorunumu, donemAdi, type Gorunum, type GorunumOrtak } from "./Gorunumler";
import { FaaliyetSatiri, HatirlatmaListesi, YaklasanListe, useMedya } from "./ortak";

/**
 * Planlama takvimi: ileride haber olabilecek, önceden bilinen faaliyetler.
 *
 * Adres `#/takvim/<görünüm>/<tarih>` ya da `#/takvim/faaliyet/<id>`.
 * Sayfa içinde ileri geri gidince adres `replaceState` ile güncelleniyor:
 * bağlantı paylaşılabilir kalıyor ama her ay değişiminde sayfa başa
 * kaymıyor (hashchange bunu yapıyor). Dışarıdan gelen adres (menü,
 * hareket bağlantısı) durumu yeniden kuruyor.
 */

const GORUNUMLER: Gorunum[] = ["yil", "ay", "hafta", "gun"];
const GORUNUM_ADI = { yil: "gYil", ay: "gAy", hafta: "gHafta", gun: "gGun", liste: "tkYaklasanlar" } as const;
const TARIH = /^\d{4}-\d{2}-\d{2}$/;

interface Baslangic {
  gorunum: Gorunum;
  tarih: string;
  acik: AcikFaaliyet | null;
}

const adrestenKur = (yol: Yol, ben: Kisi, d: Durum): Baslangic | null => {
  const B = bugun();
  if (yol.id === "faaliyet") {
    const f = faaliyetBul(d, yol.alt);
    if (!f || !faaliyetGorebilir(ben, f)) return null;
    const o = siradakiOlusum(f);
    return { gorunum: "ay", tarih: o.bas, acik: { id: f.id, bas: o.bas } };
  }
  const gorunum = ([...GORUNUMLER, "liste"] as string[]).includes(yol.id ?? "") ? (yol.id as Gorunum) : ben.birim === "muhabir" ? "liste" : "ay";
  return { gorunum, tarih: yol.alt && TARIH.test(yol.alt) ? yol.alt : B, acik: null };
};

/*
 * Her hashchange yeni bir Yol nesnesi veriyor; sayfa ona göre sıfırdan
 * kuruluyor. Adresin metnine göre anahtar yetmezdi: ay değiştirip
 * (replaceState) menüden aynı adrese dönülünce sayfa yerinde kalırdı.
 */
const yolSurumu = new WeakMap<Yol, number>();
let yolSayaci = 0;
const yolAnahtari = (y: Yol) => {
  if (!yolSurumu.has(y)) yolSurumu.set(y, ++yolSayaci);
  return yolSurumu.get(y)!;
};

export default function Takvim({ ben, yol }: { ben: Kisi; yol: Yol }) {
  /* Adres yalnız açılışta okunuyor: sonradan (ör. açılan faaliyet silinince) sayfa yetkisize dönmesin. */
  const ilk = useMemo(() => adrestenKur(yol, ben, getir()), [yol, ben.id]);
  if (!ilk) return <Yetkisiz />;
  return <TakvimSayfasi key={yolAnahtari(yol)} ben={ben} ilk={ilk} />;
}

function TakvimSayfasi({ ben, ilk }: { ben: Kisi; ilk: Baslangic }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const [gorunum, setGorunum] = useState<Gorunum>(ilk.gorunum);
  const [tarih, setTarih] = useState(ilk.tarih);
  const [acik, setAcik] = useState<AcikFaaliyet | null>(ilk.acik);
  const [yeni, setYeni] = useState<string | null>(null);
  const [sorgu, setSorgu] = useState("");
  const [suzgec, setSuzgec] = useState<Suzgec>({});
  const fare = useMedya("(hover: hover) and (pointer: fine)");
  const duzenler = yapabilir(ben, "takvimDuzenle");
  const muhabir = ben.birim === "muhabir";
  const B = bugun();

  useEffect(() => {
    yerindeDegistir(`takvim/${gorunum}/${tarih}`);
  }, [gorunum, tarih]);

  const git = useCallback((g: Gorunum, x: string) => {
    setGorunum(g);
    setTarih(x);
  }, []);
  const kapat = useCallback(() => setAcik(null), []);

  const gorunen = gorunenFaaliyetler(v, ben);
  const suzulmus = gorunen.filter((f) => suzgeceUyar(f, suzgec) && aramaUyar(v, f, sorgu));
  const tarihUyar = tarihSuzgeci(suzgec);
  const acilim = (bas: string, bit: string) => aralikOlusumlari(suzulmus, bas, bit).filter(tarihUyar);
  const ozet = takvimOzeti(gorunen);
  const ac = (o: Olusum) => setAcik({ id: o.f.id, bas: o.bas });

  const ileriGeri = (yon: -1 | 1) => {
    if (gorunum === "yil") setTarih(ayEkle(tarih, 12 * yon));
    else if (gorunum === "ay") setTarih(ayEkle(tarih, yon));
    else if (gorunum === "hafta") setTarih(gunEkle(tarih, 7 * yon));
    else if (gorunum === "gun") setTarih(gunEkle(tarih, yon));
  };

  const ortak: GorunumOrtak = { ben, tarih, acilim, ac, yeni: duzenler ? setYeni : undefined, git, surukle: duzenler && fare };

  return (
    <>
      <SayfaBasi
        ikon={<CalendarCheck size={26} />}
        baslik={t(muhabir ? "mTakvimim" : "mTakvim")}
        alt={t(muhabir ? "takvimAltMuhabir" : "takvimAlt")}
        sagUc={
          duzenler && (
            <button type="button" className="dugme" onClick={() => setYeni(gorunum === "liste" ? B : tarih)}>
              <Plus size={16} /> {t("yeniFaaliyet")}
            </button>
          )
        }
      />
      <div className="sayaclar ara-alt">
        <Sayac ikon={<CalendarDays size={20} />} etiket={t("tkBuAy")} deger={ozet.buAy} href={`#/takvim/ay/${B}`} />
        <Sayac ikon={<TriangleAlert size={20} />} etiket={t("tkYuksek")} deger={ozet.yuksek} alt={t("tkYuksekAlt")} ton={ozet.yuksek ? "kotu" : ""} />
        <Sayac ikon={<CalendarClock size={20} />} etiket={t("tkYaklasan")} deger={ozet.yaklasan} alt={t("tkYaklasanAlt")} href="#/takvim/liste" />
        <Sayac ikon={<Link2 size={20} />} etiket={t("tkAktarilan")} deger={ozet.aktarilan} alt={t("tkAktarilanAlt")} ton="iyi" />
      </div>

      <div className="tk-arac">
        <div className="tk-arac-satir">
          <label className="tk-arama">
            <Search size={16} aria-hidden="true" />
            <input type="search" className="girdi" value={sorgu} onChange={(e) => setSorgu(e.target.value)} placeholder={t("tkAraIpucu")} aria-label={t("ara")} />
          </label>
          <Suzgecler ben={ben} suzgec={suzgec} degistir={setSuzgec} />
        </div>
        <div className="tk-arac-satir">
          <div className="tk-hizli">
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => git("gun", B)}>
              {t("bugun")}
            </button>
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => git("hafta", B)}>
              {t("tkBuHafta")}
            </button>
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => git("ay", B)}>
              {t("tkBuAy")}
            </button>
            <button type="button" className={`dugme dugme-ikincil dugme-kucuk${gorunum === "liste" ? " secili" : ""}`} onClick={() => git("liste", B)}>
              {t("tkYaklasanlar")}
            </button>
          </div>
          {gorunum !== "liste" && (
            <div className="tk-donem">
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => ileriGeri(-1)} aria-label={t("oncekiDonem")} title={t("oncekiDonem")}>
                <ChevronLeft size={18} className="yon" />
              </button>
              <b aria-live="polite">{donemAdi(gorunum, tarih, dil)}</b>
              <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => ileriGeri(1)} aria-label={t("sonrakiDonem")} title={t("sonrakiDonem")}>
                <ChevronRight size={18} className="yon" />
              </button>
            </div>
          )}
          <div className="gorunum-secici" role="group" aria-label={t("takvimGorunumu")}>
            {GORUNUMLER.map((g) => (
              <button key={g} type="button" className={`dugme dugme-sade dugme-kucuk${gorunum === g ? " secili" : ""}`} aria-pressed={gorunum === g} onClick={() => setGorunum(g)}>
                {t(GORUNUM_ADI[g])}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sorgu.trim() && <AramaSonuclari sonuclar={suzulmus} ac={(o) => (setTarih(o.bas), gorunum === "liste" && setGorunum("ay"), ac(o))} />}

      <div className="iz iz-ana-yan">
        <div className="tk-ana">
          {gorunum === "yil" && <YilGorunumu {...ortak} />}
          {gorunum === "ay" && <AyGorunumu key={tarih.slice(0, 7)} {...ortak} />}
          {gorunum === "hafta" && <HaftaGorunumu {...ortak} />}
          {gorunum === "gun" && <GunGorunumu {...ortak} />}
          {gorunum === "liste" && <ListeGorunumu {...ortak} />}
        </div>
        <aside className="iz">
          <Kart baslik={t("hatirlatmalar")} ikon={<Bell size={18} />} className="tk-hatirlatmalar">
            <HatirlatmaListesi liste={gorunen} ac={ac} />
          </Kart>
          <Kart baslik={t("yaklasanFaaliyetler")} ikon={<CalendarClock size={18} />}>
            <YaklasanListe liste={gorunen} ac={ac} />
          </Kart>
        </aside>
      </div>

      {yeni && <FaaliyetFormu ben={ben} tarih={yeni} kapat={() => setYeni(null)} />}
      {acik && <FaaliyetAyrintisi key={`${acik.id}@${acik.bas}`} id={acik.id} bas={acik.bas} kapat={kapat} />}
    </>
  );
}

/* --- Süzgeç paneli --- */

function Suzgecler({ ben, suzgec, degistir }: { ben: Kisi; suzgec: Suzgec; degistir: (s: Suzgec) => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const sayi = etkinSuzgecSayisi(suzgec);
  const ayarla = (k: keyof Suzgec, x: string) => degistir({ ...suzgec, [k]: x || undefined });
  const secim = <K extends keyof Suzgec>(k: K, etiket: string, secenekler: [string, string][]) => (
    <label>
      {etiket}
      <select value={suzgec[k] ?? ""} onChange={(e) => ayarla(k, e.target.value)}>
        <option value="">{t("tumu")}</option>
        {secenekler.map(([d, a]) => (
          <option key={d} value={d}>
            {a}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <details className="tk-filtre">
      <summary className="dugme dugme-ikincil dugme-kucuk">
        <SlidersHorizontal size={15} /> {t("filtreler")}
        {sayi > 0 && <em>{sayi}</em>}
      </summary>
      <div className="form tk-filtre-govde">
        <div className="satir">
          {secim(
            "ulke",
            t("ulke"),
            [...ULKELER].map((u) => [u, t(ulkeAdi(u))] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], dil)),
          )}
          {secim("bolge", t("bolge"), BOLGELER.map((b) => [b, t(bolgeAdi(b))]))}
          {secim("tur", t("faaliyetTuru"), FAALIYET_TURLERI.map((x) => [x, t(faaliyetTuruAdi(x))]))}
          {secim("oncelik", t("oncelik"), ONCELIKLER.map((x) => [x, t(oncelikAdi(x))]))}
          {secim("potansiyel", t("haberPotansiyeli"), POTANSIYELLER.map((x) => [x, t(potansiyelAdi(x))]))}
          {secim("durum", t("durum"), FAALIYET_DURUMLARI.map((x) => [x, t(faaliyetDurumAdi(x))]))}
          {secim("birim", t("sorumluBirim"), BIRIMLER.filter((b) => b !== "muhabir").map((b) => [b, t(BIRIM_ADI[b])]))}
          {ben.birim !== "muhabir" &&
            secim(
              "muhabirId",
              t("sorumluMuhabir"),
              muhabirler(v)
                .filter((k) => v.faaliyetler.some((f) => f.muhabirId === k.id))
                .map((k) => [k.id, ad(k)] as [string, string])
                .sort((a, b) => a[1].localeCompare(b[1], dil)),
            )}
          <label>
            {t("tarihten")}
            <input type="date" value={suzgec.bas ?? ""} onChange={(e) => ayarla("bas", e.target.value)} />
          </label>
          <label>
            {t("tarihe")}
            <input type="date" value={suzgec.bit ?? ""} min={suzgec.bas} onChange={(e) => ayarla("bit", e.target.value)} />
          </label>
        </div>
        {sayi > 0 && (
          <div className="form-alt">
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => degistir({})}>
              {t("filtreTemizle")}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

/* --- Arama sonuçları: arşiv dahil, her faaliyet bir kez --- */

function AramaSonuclari({ sonuclar, ac }: { sonuclar: ReturnType<typeof gorunenFaaliyetler>; ac: (o: Olusum) => void }) {
  const { t } = useDil();
  const B = bugun();
  /* Tekrarlayanın gösterilen tekrarı sıradaki; önce yaklaşanlar, sonra geçmiş (yeniden eskiye). */
  const ol = sonuclar.map((f) => (f.tekrar ? siradakiOlusum(f) : olusumAc(f)));
  const ileri = ol.filter((o) => o.bit >= B).sort((a, b) => a.bas.localeCompare(b.bas));
  const geri = ol.filter((o) => o.bit < B).sort((a, b) => b.bas.localeCompare(a.bas));
  return (
    <Kart baslik={t("aramaSonuclari")} ek={`${ol.length} · ${t("aramaArsivNotu")}`} className="tk-sonuclar ara-alt">
      {ol.length ? (
        <ul className="tk-satirlar">
          {[...ileri, ...geri].map((o) => (
            <FaaliyetSatiri key={o.anahtar} o={o} ac={ac} />
          ))}
        </ul>
      ) : (
        <Bos kucuk metin={t("aramaBos")} />
      )}
    </Kart>
  );
}
