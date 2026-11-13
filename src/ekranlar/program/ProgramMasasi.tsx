import { Archive, CalendarRange, CirclePlay, Landmark, Trophy, ChevronLeft, ChevronRight, Clapperboard, FileText, Lightbulb, Pencil, Plus, Search, Trash2, Tv, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GorevlendirDugmesi } from "../../bilesenler/PaketGorevi";
import { MasaYayinDugmeleri } from "../../bilesenler/PaketSonucu";
import { Bos, Icerik, Kart, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { SaatGirdisi } from "../../bilesenler/TarihSaat";
import { kisaGunAdi, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { gorevTalebiGeriCek, icerikProgramaAktar, uretimeAl, masaSorusunuYanitla, programKaldir, programKaydet } from "../../eylemler";
import { BICIM_ADI, paketYeri } from "../../etiketler";
import { masaninSorulari } from "../../masaSorusu";
import {
  AKTIF_ALANLAR,
  ARSIV_SUZGECLERI,
  MASA_YOLU,
  arsivSuzgeceUyar,
  masaArsivi,
  masaBolumleri,
  masaKararlari,
  type ArsivKaydi,
  type ArsivSuzgeci,
  type MasaBirimi,
  bolumIcerikleri,
  bugunkuProgramlar,
  etkinProgramlar,
  haftaninBolumleri,
  icerikDurumAlani,
  masaIcerikleri,
  masaTalepleri,
  sonAylik,
  sonNextDay,
  sonOzel,
  sonWeekly,
  talepBekliyor,
  type IcerikAlani,
  type ProgramBolumu,
} from "../../programMasasi";
import { bugun, gunEkle, haftaBasi } from "../../tarih";
import { kisiBul, oneriBul, useVeri, type Kisi, type Paket, type ProgramTanimi } from "../../veri";
import { gorevTalebiGeriCekebilir, icerikAktarabilir, masaUyesi, uretimeAlabilir, masaYanitlar, programDuzenler } from "../../yetki";
import { KisiIletisim } from "../../bilesenler/KisiCipi";
import { sozcuklerUyar } from "../../arama";
import { useAdimDurumu } from "../../yol";
import { AylikBelgesi } from "../aylik/Aylik";
import { HaftalikBelgesi } from "../belge/HaftalikBelge";
import { NextDayBelgesi } from "../belge/NextDayBelge";
import { OzelBelgesi } from "../OzelCikti";

/*
 * Programlar'ın sayfası (kullanıcı: program programlamaya uygun, masaüstü ve
 * telefona uygun; kurallar programMasasi.ts). Dört kutucuk, seçilenin alanı
 * altında: Yayın planları (her planın son onaylanan çıktısı, salt okunur),
 * İçerikler (Planlamada, Üretimde, Yayına hazır, Arşiv), Öneriler (Planlama'dan,
 * bizim görev taleplerimiz, arşiv), Programlar (programlar, günleri, bölümlere
 * aktarılan içerik). Eski kartlar (program masası, haftalık program planı,
 * program önerileri, konuk organizasyonu) kalktı.
 */

const BOLUM_ADI: Record<ProgramBolumu, Anahtar> = { planlar: "pmPlanlar", icerikler: "pmIcerikler", oneriler: "pmOneriler", programlar: "pmProgramlar", arsiv: "pmArsiv" };
const BOLUM_IKONU: Record<ProgramBolumu, ReactNode> = {
  planlar: <FileText size={20} />,
  icerikler: <Clapperboard size={20} />,
  oneriler: <Lightbulb size={20} />,
  programlar: <Tv size={20} />,
  arsiv: <Archive size={20} />,
};
const ALAN_ADI: Record<IcerikAlani, Anahtar> = { planlamada: "pmAlanPlanlamada", uretimde: "pmAlanUretimde", hazir: "pmAlanHazir", arsiv: "pmAlanArsiv" };

export const MASA_ADI: Record<MasaBirimi, Anahtar> = { program: "biProgram", ekonomi: "biEkonomi", spor: "biSpor" };
export const MASA_IKONU: Record<MasaBirimi, ReactNode> = { program: <Clapperboard size={26} />, ekonomi: <Landmark size={26} />, spor: <Trophy size={26} /> };

/** Programlar'ın sayfası (eski ad; ana sayfa katalogu ve testler). */
export const ProgramMasasi = ({ ben, ilk }: { ben: Kisi; ilk?: ProgramBolumu }) => <MasaSayfasi ben={ben} birim="program" ilk={ilk} />;

/*
 * Masanın sayfası: kutucuklar bağlantı (menü ve telefondaki alt çubuk adresten
 * vurgulanıyor; kutucuk adres değiştirmeseydi menüde başka bölüm yanardı).
 * Ana sayfada (ozet) kutucukların üstünde masanın önündeki kararlar.
 */
export function MasaSayfasi({ ben, birim, ilk = "icerikler", ozet }: { ben: Kisi; birim: MasaBirimi; ilk?: ProgramBolumu; ozet?: boolean }) {
  const { t } = useDil();
  const v = useVeri();
  const bolumler = masaBolumleri(birim);
  const bolum = bolumler.includes(ilk) ? ilk : "icerikler";
  const B = bugun();
  const yol = MASA_YOLU[birim];
  const icerikler = masaIcerikleri(v, birim);
  const aktif = icerikler.filter((p) => icerikDurumAlani(p) !== "arsiv").length;
  const sorular = masaninSorulari(v, birim).filter((s) => !s.cevap).length;
  const talepler = masaTalepleri(v, birim).filter(talepBekliyor).length;
  const planSayisi = [sonNextDay(v), sonWeekly(v), sonAylik(v), sonOzel(v)].filter(Boolean).length;
  const programlar = etkinProgramlar(v);
  const bugunku = birim === "program" ? bugunkuProgramlar(v, B) : [];
  const arsiv = icerikler.length - aktif;
  const bilgi: Record<ProgramBolumu, { alt: string; say: number }> = {
    planlar: { alt: t("pmPlanlarAlt"), say: planSayisi },
    icerikler: { alt: t("pmIceriklerAlt", { n: aktif }), say: aktif },
    oneriler: { alt: t("pmOnerilerAlt", { n: sorular + talepler }), say: sorular + talepler },
    programlar: { alt: t("pmProgramlarAlt", { n: programlar.length, m: bugunku.length }), say: programlar.length },
    arsiv: { alt: t("pmArsivAlt", { n: arsiv }), say: 0 },
  };
  return (
    // Bölüm adresinde (alt çubuktan İçerikler, Öneriler…) telefonda kutucuklar gizli: alt çubuğu tekrarlıyor, içerik 650 pikselden sonra başlıyordu.
    <div className={`prg-masa masa-${birim}${!ozet && ilk ? " bolumde" : ""}`} data-program-masasi data-masa-sayfasi={birim}>
      {ozet && <KararOzeti birim={birim} />}
      <div className={`prg-kutular kutu-${bolumler.length}`} role="tablist">
        {bolumler.map((b) => (
          <a
            key={b}
            href={`#/${yol}/${b}`}
            role="tab"
            aria-selected={bolum === b}
            className={`prg-kutu prg-k-${b}${bolum === b ? " secili" : ""}`}
            data-prg-kutu={b}
          >
            <span className="prg-kutu-ik">{BOLUM_IKONU[b]}</span>
            <b>{t(BOLUM_ADI[b])}</b>
            <small>{bilgi[b].alt}</small>
            {bilgi[b].say > 0 && <em className="prg-say">{bilgi[b].say}</em>}
          </a>
        ))}
      </div>
      {bugunku.length > 0 && <BugunYayinda programlar={bugunku} />}
      {bolum === "planlar" && <YayinPlanlari birim={birim} />}
      {bolum === "icerikler" && <Icerikler ben={ben} birim={birim} />}
      {bolum === "oneriler" && <Oneriler ben={ben} birim={birim} />}
      {bolum === "programlar" && <Programlar ben={ben} />}
      {bolum === "arsiv" && <Arsiv birim={birim} />}
    </div>
  );
}

/* Ana sayfanın başı: bugün karar verilecekler; yoksa çizilmez. */
function KararOzeti({ birim }: { birim: MasaBirimi }) {
  const { t } = useDil();
  const v = useVeri();
  const k = masaKararlari(v, birim);
  const yol = MASA_YOLU[birim];
  const adaylar: { n: number; ad: Anahtar; href: string; o: string }[] = [
    { n: k.yayin, ad: "pmKararYayin", href: `#/${yol}/icerikler`, o: "yayin" },
    { n: k.soru, ad: "pmKararSoru", href: `#/${yol}/oneriler`, o: "soru" },
    { n: k.programsiz, ad: "pmKararProgramsiz", href: `#/${yol}/icerikler`, o: "programsiz" },
  ];
  const satirlar = adaylar.filter((x) => x.n > 0);
  if (!satirlar.length) return null;
  return (
    <div className="prg-ozet" data-prg-ozet>
      <span className="prg-bugun-bas">{t("pmKararlarim")}</span>
      {satirlar.map((x) => (
        <a key={x.o} href={x.href} className="prg-ozet-oge" data-prg-ozet-oge={x.o}>
          <b>{x.n}</b> {t(x.ad)}
        </a>
      ))}
    </div>
  );
}

function BugunYayinda({ programlar }: { programlar: ProgramTanimi[] }) {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  return (
    <div className="prg-bugun" data-prg-bugun>
      <span className="prg-bugun-bas">{t("pmBugunYayinda")}</span>
      {programlar.map((p) => {
        const n = bolumIcerikleri(v, p.id, B).length;
        return (
          <span key={p.id} className="prg-bugun-oge">
            <Icerik>{p.ad}</Icerik>
            {p.saat && <b>{p.saat}</b>}
            <small className={n ? "" : "uyari-yazi"}>{n ? t("pmIcerikSayisi", { n }) : t("pmIcerikYok")}</small>
          </span>
        );
      })}
    </div>
  );
}

/* --- Yayın planları: son onaylanan çıktılar, salt okunur --- */

type PlanTuru = "nextday" | "haftalik" | "aylik" | "ozel";
function YayinPlanlari({ birim }: { birim: MasaBirimi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar: { tur: PlanTuru; ad: Anahtar; alt?: string; href?: string; var: boolean }[] = [];
  const nd = sonNextDay(v);
  const hf = sonWeekly(v);
  const ay = sonAylik(v);
  const oz = sonOzel(v);
  planlar.push({ tur: "nextday", ad: "pmNextDay", alt: nd && tarihYaz(nd.tarih, dil, "tam"), href: nd && `#/nextday/${nd.id}`, var: !!nd });
  planlar.push({ tur: "haftalik", ad: "pmWeekly", alt: hf && `${tarihYaz(hf.baslangic, dil)} – ${tarihYaz(gunEkle(hf.baslangic, 6), dil)}`, href: hf && `#/haftalik/${hf.id}`, var: !!hf });
  planlar.push({ tur: "aylik", ad: "pmAylik", alt: ay && tarihYaz(ay.ay + "-01", dil, "ay"), href: ay && `#/aylik/${ay.id}`, var: !!ay });
  planlar.push({ tur: "ozel", ad: "pmOzel", alt: oz?.ad, href: oz && `#/ozel/${oz.id}`, var: !!oz });
  const [secim, setSecim] = useAdimDurumu<PlanTuru>(`${birim}:plan`, "nextday");
  const s = planlar.find((p) => p.tur === secim) ?? planlar[0];
  return (
    <Kart baslik={t("pmPlanlar")} ikon={<FileText size={18} />}>
      <div className="prg-plan-sec" role="tablist">
        {planlar.map((p) => (
          <button key={p.tur} type="button" role="tab" aria-selected={p.tur === s.tur} className={`renk-${p.tur === "haftalik" ? "haftalik" : p.tur}${p.tur === s.tur ? " acik" : ""}`} onClick={() => setSecim(p.tur)} data-prg-plan={p.tur}>
            <b>{t(p.ad)}</b>
            <small>{p.var ? p.alt : t("pmPlanYok")}</small>
          </button>
        ))}
      </div>
      {!s.var ? (
        <Bos metin={t("pmPlanYok")} />
      ) : (
        <div className="prg-cikti cikti-sarici" data-prg-cikti={s.tur}>
          {s.tur === "nextday" && nd && <NextDayBelgesi plan={nd} />}
          {s.tur === "haftalik" && hf && <HaftalikBelgesi hafta={hf} />}
          {s.tur === "aylik" && ay && <AylikBelgesi plan={ay} d={v} />}
          {s.tur === "ozel" && oz && <OzelBelgesi o={oz} />}
        </div>
      )}
    </Kart>
  );
}

/* --- İçerikler --- */

function Icerikler({ ben, birim }: { ben: Kisi; birim: MasaBirimi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [alan, setAlan] = useAdimDurumu<IcerikAlani>(`${birim}:alan`, "uretimde");
  const [aranan, setAranan] = useAdimDurumu(`${birim}:ara`, "");
  const [aktar, setAktar] = useState<Paket | null>(null);
  const q = aranan.trim().toLocaleLowerCase();
  const hepsi = masaIcerikleri(v, birim).filter((p) => !q || `${p.baslik} ${p.kod} ${ad(kisiBul(v, p.muhabirId))}`.toLocaleLowerCase().includes(q));
  const sayi = (a: IcerikAlani) => hepsi.filter((p) => icerikDurumAlani(p) === a).length;
  const liste = hepsi
    .filter((p) => icerikDurumAlani(p) === alan)
    .sort((a, b) => (a.sonTarih ?? "~").localeCompare(b.sonTarih ?? "~"));
  return (
    <Kart
      baslik={t("pmIcerikler")}
      ikon={<Clapperboard size={18} />}
      sagUc={
        <span className="prg-arac">
          <label className="arama arama-kutu">
            <Search size={15} />
            <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("paketAra")} aria-label={t("paketAra")} />
          </label>
          <GorevlendirDugmesi ben={ben} />
        </span>
      }
    >
      <div className="prg-seg" role="tablist" data-prg-alanlar>
        {AKTIF_ALANLAR.map((a) => (
          <button key={a} type="button" role="tab" aria-selected={a === alan} className={a === alan ? "acik" : ""} onClick={() => setAlan(a)} data-prg-alan={a}>
            {t(ALAN_ADI[a])} <em>{sayi(a)}</em>
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <div className="prg-icerikler">
          {liste.map((p) => (
            <IcerikKarti key={p.id} ben={ben} birim={birim} p={p} aktar={() => setAktar(p)} />
          ))}
        </div>
      )}
      {aktar && <AktarPenceresi ben={ben} paket={aktar} kapat={() => setAktar(null)} />}
    </Kart>
  );
}

function IcerikDurumu({ p }: { p: Paket }) {
  const { t } = useDil();
  const a = icerikDurumAlani(p);
  if (a === "arsiv")
    return p.yayinlandi ? <Rozet ton="iyi">{t("mtYayinlandi")}</Rozet> : p.yayinlanmadi ? <Rozet ton="kotu">{t("mtYayinlanmadi")}</Rozet> : <Rozet>{t("pmIptal")}</Rozet>;
  if (p.isaret) return <Rozet ton={p.isaret.tur === "yapildi" ? "iyi" : "uyari"}>{t(p.isaret.tur === "yapildi" ? "mtTeslimEdildi" : "mtYapilmadiDedi")}</Rozet>;
  if (a === "hazir") return <Rozet ton="iyi">{t("pmAlanHazir")}</Rozet>;
  if (p.durum === "uretimde") return <Rozet ton="uyari">{t("pmMontajda")}</Rozet>;
  if (a === "uretimde") return <Rozet ton="uyari">{t("mtMuhabirde")}</Rozet>;
  return <Rozet>{t("pmAlanPlanlamada")}</Rozet>;
}

function IcerikKarti({ ben, birim, p, aktar }: { ben: Kisi; birim: MasaBirimi; p: Paket; aktar: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const muhabir = p.muhabirId ? kisiBul(v, p.muhabirId) : undefined;
  const prg = p.programBolumu && v.programlar?.find((x) => x.id === p.programBolumu!.programId);
  const arsiv = icerikDurumAlani(p) === "arsiv";
  return (
    <div className="prg-icerik" data-prg-icerik={p.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="masa">{t(BICIM_ADI(p.bicim ?? "pkg"))}</Rozet>
        <Icerik>{paketYeri(p)}</Icerik>
        {p.sonTarih && <span className="soluk">· {tarihYaz(p.sonTarih, dil)}</span>}
        <span className="bosluk-esnek" />
        <IcerikDurumu p={p} />
      </div>
      <a href={`#/paketler/${p.id}`} className="prg-icerik-baslik">
        <Icerik blok>{p.baslik}</Icerik>
      </a>
      <div className="prg-icerik-alt">
        <span className="soluk">{muhabir ? ad(muhabir) : t("atanmadi")}</span>
        {/* İşin muhabirine ulaşma (kullanıcı: bütün muhabir listesi değil, iş bazında). */}
        {muhabir && !arsiv && masaUyesi(ben, birim) && (
          <span className="prg-iletisim" data-prg-iletisim={p.id}>
            <KisiIletisim ben={ben} kisi={muhabir} konu={p.baslik} />
          </span>
        )}
        <span className="bosluk-esnek" />
        {prg ? (
          <Rozet ton="iyi">
            <Tv size={12} /> <Icerik>{prg.ad}</Icerik> · {tarihYaz(p.programBolumu!.tarih, dil)}
          </Rozet>
        ) : (
          !arsiv &&
          birim === "program" &&
          icerikAktarabilir(ben, p) && (
            <button type="button" className="dugme dugme-yumusak dugme-kucuk" onClick={aktar} data-prg-aktar={p.id}>
              <Tv size={14} /> {t("pmProgramaAktar")}
            </button>
          )
        )}
        {/* Masanın paketi üretime masada alınıyor (eski masa kartındaki gibi kartın üstünden). */}
        {uretimeAlabilir(ben, p) && (
          <button type="button" className="dugme dugme-kucuk" onClick={() => uretimeAl(ben, p.id) && bildir(t("bUretimeAlindi"))} data-uretime-al={p.id}>
            <CirclePlay size={14} /> {t("uretimeAl")}
          </button>
        )}
        <MasaYayinDugmeleri ben={ben} paket={p} kucuk />
      </div>
    </div>
  );
}

/* Programa aktarma: program ve önümüzdeki dört haftanın bölüm günleri. */
function AktarPenceresi({ ben, paket, kapat, programId }: { ben: Kisi; paket?: Paket; kapat: () => void; programId?: string; tarih?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const programlar = etkinProgramlar(v);
  const [prg, setPrg] = useState(programId ?? programlar[0]?.id ?? "");
  const p = programlar.find((x) => x.id === prg);
  const B = bugun();
  const gunler = p ? [0, 7, 14, 21].flatMap((n) => haftaninBolumleri(p, gunEkle(B, n))).filter((g) => g >= B) : [];
  // Program değişince gün yeni programın ilk bölümüne döner: önceki programın günü yeni programda da varsa (ileriki hafta) kalıyor, içerik bu haftanın bölümü yerine oraya gidiyordu.
  const [tarih, setTarih] = useState(gunler[0] ?? "");
  const gecerliTarih = gunler.includes(tarih) ? tarih : gunler[0] ?? "";
  const aktar = () => paket && icerikProgramaAktar(ben, paket.id, prg, gecerliTarih) && (bildir(t("bKaydedildi")), kapat());
  return (
    <Pencere baslik={t("pmProgramaAktar")} kapat={kapat}>
      {!programlar.length ? (
        <Bos metin={t("pmProgramYok")} />
      ) : (
        <div className="form" data-prg-aktar-formu>
          {paket && (
            <p>
              <Icerik blok>{paket.baslik}</Icerik>
            </p>
          )}
          <label>
            {t("pmProgram")}
            <select value={prg} onChange={(e) => (setPrg(e.target.value), setTarih(""))} data-prg-aktar-program>
              {programlar.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.ad}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("pmBolum")}
            <select value={gecerliTarih} onChange={(e) => setTarih(e.target.value)} data-prg-aktar-tarih>
              {gunler.map((g) => (
                <option key={g} value={g}>
                  {tarihYaz(g, dil, "tam")}
                  {p?.saat ? ` · ${p.saat}` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="form-alt">
            <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
              {t("iptal")}
            </button>
            <button type="button" className="dugme" disabled={!gecerliTarih || !icerikAktarabilir(ben, paket!)} onClick={aktar} data-prg-aktar-onay>
              <Tv size={15} /> {t("pmAktar")}
            </button>
          </div>
        </div>
      )}
    </Pencere>
  );
}

/* --- Öneriler --- */

/* Yanıtlanan sorular ve sonuçlanan talepler Arşiv bölümünde. */
type OneriSekmesi = "planlamadan" | "bizim";
function Oneriler({ ben, birim }: { ben: Kisi; birim: MasaBirimi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [sekme, setSekme] = useAdimDurumu<OneriSekmesi>(`${birim}:oneri`, "planlamadan");
  const acikSorular = masaninSorulari(v, birim).filter((s) => !s.cevap);
  const bekleyen = masaTalepleri(v, birim).filter(talepBekliyor);
  const sekmeler: { s: OneriSekmesi; ad: Anahtar; n?: number }[] = [
    { s: "planlamadan", ad: "pmPlanlamadan", n: acikSorular.length },
    { s: "bizim", ad: "pmBizim", n: bekleyen.length },
  ];
  return (
    <Kart baslik={t("pmOneriler")} ikon={<Lightbulb size={18} />} sagUc={<GorevlendirDugmesi ben={ben} />}>
      <div className="prg-seg" role="tablist">
        {sekmeler.map((x) => (
          <button key={x.s} type="button" role="tab" aria-selected={x.s === sekme} className={x.s === sekme ? "acik" : ""} onClick={() => setSekme(x.s)} data-prg-oneri-sekme={x.s}>
            {t(x.ad)} {x.n !== undefined && <em>{x.n}</em>}
          </button>
        ))}
      </div>
      <div className="prg-oneriler">
        {sekme === "planlamadan" &&
          (acikSorular.length ? acikSorular.map((s) => <SoruKarti key={s.id} ben={ben} oneriId={s.oneriId} not={s.not} zaman={s.zaman} soran={s.soran} />) : <Bos metin={t("kayitYok")} />)}
        {sekme === "bizim" &&
          (bekleyen.length ? (
            bekleyen.map((p) => (
              <div key={p.id} className="prg-oneri" data-prg-talep={p.id}>
                <div className="prg-icerik-ust">
                  <Rozet ton="uyari">{t("pmKararda")}</Rozet>
                  {p.sonTarih && <span className="soluk">· {tarihYaz(p.sonTarih, dil)}</span>}
                </div>
                <a href={`#/paketler/${p.id}`}>
                  <Icerik blok>{p.baslik}</Icerik>
                </a>
                <div className="prg-icerik-alt">
                  <span className="soluk">{ad(kisiBul(v, p.muhabirId))}</span>
                  <span className="bosluk-esnek" />
                  {gorevTalebiGeriCekebilir(ben, p) && (
                    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => confirm(t("eminMisin")) && gorevTalebiGeriCek(ben, p.id) && bildir(t("bKaydedildi"))}>
                      {t("geriCek")}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <Bos metin={t("kayitYok")} />
          ))}
      </div>
    </Kart>
  );
}

/* Planlama'nın sorusu: önerinin başlığı, muhabiri, Planlama'nın notu; "Uygundur / Uygun değildir" notla. */
function SoruKarti({ ben, oneriId, not, zaman, soran }: { ben: Kisi; oneriId: string; not?: string; zaman: string; soran: string }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [karar, setKarar] = useState<boolean | null>(null);
  const [yazi, setYazi] = useState("");
  const o = oneriBul(v, oneriId);
  if (!o) return null;
  const yanitlar = masaYanitlar(ben, o, v);
  const gonder = () => karar !== null && confirm(t("eminMisin")) && masaSorusunuYanitla(ben, o.id, karar, yazi) && (bildir(t("bKaydedildi")), setKarar(null));
  return (
    <div className="prg-oneri" data-prg-soru={o.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="nextday">{t("pmPlanlamaSoruyor")}</Rozet>
        <span className="soluk">
          · {ad(kisiBul(v, soran))} · {tarihYaz(zaman, dil)} {saatYaz(zaman, dil)}
        </span>
      </div>
      <a href={`#/oneriler/${o.id}`}>
        <Icerik blok>{o.paketBasligi || o.haberBasligi}</Icerik>
      </a>
      {not && (
        <p className="soluk" dir="auto">
          {not}
        </p>
      )}
      {karar === null ? (
        <div className="prg-icerik-alt">
          <span className="soluk">{ad(kisiBul(v, o.muhabirId))}</span>
          <span className="bosluk-esnek" />
          {yanitlar && (
            <>
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setKarar(false)} data-prg-soru-almadi={o.id}>
                {t("msAlmayiz")}
              </button>
              <button type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setKarar(true)} data-prg-soru-aldi={o.id}>
                {t("msAliriz")}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="form form-kutu">
          <label>
            {t("pmNot")}
            <textarea dir="auto" rows={2} value={yazi} onChange={(e) => setYazi(e.target.value)} autoFocus data-prg-soru-not />
          </label>
          <div className="form-alt">
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setKarar(null)}>
              {t("iptal")}
            </button>
            <button type="button" className={`dugme dugme-kucuk ${karar ? "dugme-iyi" : "dugme-kotu"}`} onClick={gonder} data-prg-soru-gonder>
              {t(karar ? "msAliriz" : "msAlmayiz")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Programlar --- */

function Programlar({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [hafta, setHafta] = useAdimDurumu("programlar:hafta", haftaBasi(bugun()));
  const [form, setForm] = useState<ProgramTanimi | "yeni" | null>(null);
  const [aktar, setAktar] = useState<{ programId: string; tarih: string } | null>(null);
  const programlar = etkinProgramlar(v).sort((a, b) => (a.saat ?? "~").localeCompare(b.saat ?? "~"));
  const duzenler = programDuzenler(ben);
  return (
    <Kart
      baslik={t("pmProgramlar")}
      ikon={<Tv size={18} />}
      sagUc={
        <span className="prg-arac">
          <span className="prg-hafta">
            <button type="button" className="dugme dugme-ikincil dugme-ikon" onClick={() => setHafta(gunEkle(hafta, -7))} aria-label={t("pmOncekiHafta")} title={t("pmOncekiHafta")}>
              <ChevronLeft size={16} className="yon" />
            </button>
            <span>
              <CalendarRange size={14} /> <HaftaAdi hafta={hafta} />
            </span>
            <button type="button" className="dugme dugme-ikincil dugme-ikon" onClick={() => setHafta(gunEkle(hafta, 7))} aria-label={t("pmSonrakiHafta")} title={t("pmSonrakiHafta")}>
              <ChevronRight size={16} className="yon" />
            </button>
          </span>
          {duzenler && (
            <button type="button" className="dugme" onClick={() => setForm("yeni")} data-prg-yeni>
              <Plus size={15} /> {t("pmYeniProgram")}
            </button>
          )}
        </span>
      }
    >
      {programlar.length === 0 ? (
        <Bos metin={t("pmProgramYok")} />
      ) : (
        <div className="prg-programlar">
          {programlar.map((p) => (
            <ProgramKarti key={p.id} ben={ben} p={p} hafta={hafta} duzenle={() => setForm(p)} aktar={(tarih) => setAktar({ programId: p.id, tarih })} />
          ))}
        </div>
      )}
      {form && <ProgramFormu ben={ben} p={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
      {aktar && <BolumeAktar ben={ben} {...aktar} kapat={() => setAktar(null)} />}
    </Kart>
  );
}

function HaftaAdi({ hafta }: { hafta: string }) {
  const { dil } = useDil();
  const b = haftaBasi(hafta);
  return (
    <>
      {tarihYaz(b, dil)} – {tarihYaz(gunEkle(b, 6), dil)}
    </>
  );
}

function ProgramKarti({ ben, p, hafta, duzenle, aktar }: { ben: Kisi; p: ProgramTanimi; hafta: string; duzenle: () => void; aktar: (tarih: string) => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const bas = haftaBasi(hafta);
  const B = bugun();
  return (
    <div className="prg-program" data-prg-program={p.id}>
      <div className="prg-program-ad">
        <Icerik blok>{p.ad}</Icerik>
        <span className="bosluk-esnek" />
        {(p.saat || p.sure) && <Rozet>{[p.saat, p.sure && t("pmDk", { n: p.sure })].filter(Boolean).join(" · ")}</Rozet>}
        {programDuzenler(ben) && (
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={duzenle} aria-label={t("pmProgramDuzenle")} title={t("pmProgramDuzenle")} data-prg-duzenle={p.id}>
            <Pencil size={14} />
          </button>
        )}
      </div>
      <div className="prg-gunler" aria-label={t("pmYayinGunleri")}>
        {[0, 1, 2, 3, 4, 5, 6].map((g) => (
          <span key={g} className={p.gunler.includes(g) ? "var" : ""}>
            {kisaGunAdi(gunEkle(bas, g), dil)}
          </span>
        ))}
      </div>
      {haftaninBolumleri(p, hafta).map((g) => {
        const ic = bolumIcerikleri(v, p.id, g);
        return (
          <div key={g} className={`prg-bolum${g === B ? " bugun" : ""}`} data-prg-bolum={g}>
            <div className="prg-bolum-bas">
              <b>{tarihYaz(g, dil, "tam")}</b>
              <span className="bosluk-esnek" />
              <Rozet ton={ic.length ? "iyi" : ""}>{ic.length ? t("pmIcerikSayisi", { n: ic.length }) : t("pmBos")}</Rozet>
            </div>
            {ic.map((x) => (
              <div key={x.id} className="prg-bolum-oge">
                <a href={`#/paketler/${x.id}`}>
                  <Icerik>{x.baslik}</Icerik>
                </a>
                <span className="bosluk-esnek" />
                <IcerikDurumu p={x} />
                {icerikAktarabilir(ben, x) && (
                  <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => icerikProgramaAktar(ben, x.id, null) && bildir(t("bKaydedildi"))} aria-label={t("pmBolumdenCikar")} title={t("pmBolumdenCikar")}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {programDuzenler(ben) && g >= B && (
              <button type="button" className="prg-yuva" onClick={() => aktar(g)} data-prg-yuva={`${p.id}:${g}`}>
                <Plus size={14} /> {t("pmIcerikAktar")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Bölüme içerik aktarma: aktarılmamış, arşivde olmayan içerikler. */
function BolumeAktar({ ben, programId, tarih, kapat }: { ben: Kisi; programId: string; tarih: string; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const p = v.programlar?.find((x) => x.id === programId);
  const adaylar = masaIcerikleri(v, "program").filter((x) => !x.programBolumu && icerikDurumAlani(x) !== "arsiv" && icerikAktarabilir(ben, x));
  return (
    <Pencere baslik={t("pmIcerikAktar")} alt={p ? `${p.ad} · ${tarihYaz(tarih, dil, "tam")}` : undefined} kapat={kapat}>
      {adaylar.length === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <ul className="liste" data-prg-adaylar>
          {adaylar.map((x) => (
            <li key={x.id}>
              <div className="ad">
                <Icerik blok>{x.baslik}</Icerik>
                <small>
                  {ad(kisiBul(v, x.muhabirId))} · {t(ALAN_ADI[icerikDurumAlani(x)])}
                </small>
              </div>
              <button type="button" className="dugme dugme-kucuk" onClick={() => icerikProgramaAktar(ben, x.id, programId, tarih) && (bildir(t("bKaydedildi")), kapat())} data-prg-aday={x.id}>
                {t("pmAktar")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Pencere>
  );
}

function ProgramFormu({ ben, p, kapat }: { ben: Kisi; p?: ProgramTanimi; kapat: () => void }) {
  const { t, dil } = useDil();
  const [f, setF] = useState({ ad: p?.ad ?? "", saat: p?.saat ?? "", sure: p?.sure ? String(p.sure) : "", gunler: p?.gunler ?? [] });
  const bas = haftaBasi(bugun());
  const gecerli = !!f.ad.trim() && f.gunler.length > 0;
  const kaydet = () => {
    if (!gecerli) return;
    if (programKaydet(ben, { id: p?.id, ad: f.ad, saat: f.saat || undefined, sure: Number(f.sure) || undefined, gunler: f.gunler })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t(p ? "pmProgramDuzenle" : "pmYeniProgram")} kapat={kapat}>
      <div className="form" data-prg-formu>
        <label>
          {t("pmProgramAdi")}
          <input {...icerikAlani} value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} placeholder="نافذة على العالم" required data-prg-ad />
        </label>
        <div className="alanlar">
          <label>
            {t("pmYayinSaati")}
            <SaatGirdisi value={f.saat} onChange={(e) => setF({ ...f, saat: e.target.value })} data-prg-saat />
          </label>
          <label>
            {t("pmSure")}
            <input type="number" min={1} inputMode="numeric" value={f.sure} onChange={(e) => setF({ ...f, sure: e.target.value })} data-prg-sure />
          </label>
        </div>
        <fieldset className="prg-gun-secimi">
          <legend>{t("pmYayinGunleri")}</legend>
          {[0, 1, 2, 3, 4, 5, 6].map((g) => (
            <label key={g} className={f.gunler.includes(g) ? "secili" : ""}>
              <input
                type="checkbox"
                checked={f.gunler.includes(g)}
                onChange={(e) => setF({ ...f, gunler: e.target.checked ? [...f.gunler, g] : f.gunler.filter((x) => x !== g) })}
                data-prg-gun={g}
              />
              {kisaGunAdi(gunEkle(bas, g), dil)}
            </label>
          ))}
        </fieldset>
        <div className="form-alt">
          {p && programDuzenler(ben) && (
            <button
              type="button"
              className="dugme dugme-sade"
              onClick={() => confirm(t("pmKaldirOnay")) && programKaldir(ben, p.id) && (bildir(t("bKaydedildi")), kapat())}
              data-prg-kaldir
            >
              <Trash2 size={15} /> {t("pmKaldir")}
            </button>
          )}
          <span className="bosluk-esnek" />
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" disabled={!gecerli} onClick={kaydet} data-prg-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}


/* --- Arşiv --- */

/*
 * Kapanan işler tek listede (kullanıcı: bilgi yığını değil kullanışlı, aranır):
 * arama (başlık, kod, muhabir, program), süzgeç (yayınlanan, yayınlanmayan,
 * öneri), programda program seçimi; aylara bölünür, en yenisi önce, 40'ar.
 */
const ARSIV_SUZGEC_ADI: Record<ArsivSuzgeci, Anahtar> = { hepsi: "pmArsivHepsi", yayinlandi: "pmArsivYayinlanan", yayinlanmadi: "pmArsivYayinlanmayan", oneri: "pmArsivOneri" };
const SAYFA = 40;
function Arsiv({ birim }: { birim: MasaBirimi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [aranan, setAranan] = useAdimDurumu(`${birim}:arsivAra`, "");
  const [suzgec, setSuzgec] = useAdimDurumu<ArsivSuzgeci>(`${birim}:arsivSuzgec`, "hepsi");
  const [program, setProgram] = useAdimDurumu(`${birim}:arsivProgram`, "");
  const [kac, setKac] = useState(SAYFA);
  const prgAdi = (id?: string) => (id ? v.programlar?.find((x) => x.id === id)?.ad ?? "" : "");
  const hepsi = masaArsivi(v, birim);
  const aramali = hepsi.filter((k) => {
    if (program && k.programId !== program) return false;
    if (!aranan.trim()) return true;
    const m = k.muhabirId ? kisiBul(v, k.muhabirId) : undefined;
    return sozcuklerUyar([k.baslik, k.paket?.kod ?? "", m ? (typeof m.ad === "string" ? m.ad : Object.values(m.ad).join(" ")) : "", prgAdi(k.programId)].join(" "), aranan);
  });
  const liste = aramali.filter((k) => arsivSuzgeceUyar(k, suzgec));
  const gorunen = liste.slice(0, kac);
  // Arşivde geçen programlar (kaldırılmış olanlar da): seçim yalnız işe yarayanlar.
  const programlar = birim === "program" ? [...new Set(hepsi.map((k) => k.programId).filter((x): x is string => !!x))] : [];
  const aylar: { ay: string; kayitlar: ArsivKaydi[] }[] = [];
  for (const k of gorunen) {
    const ay = k.tarih.slice(0, 7);
    const son = aylar[aylar.length - 1];
    if (son?.ay === ay) son.kayitlar.push(k);
    else aylar.push({ ay, kayitlar: [k] });
  }
  return (
    <Kart
      baslik={t("pmArsiv")}
      ikon={<Archive size={18} />}
      sagUc={
        <span className="prg-arac">
          {programlar.length > 0 && (
            <select value={program} onChange={(e) => setProgram(e.target.value)} aria-label={t("pmProgram")} data-prg-arsiv-program>
              <option value="">{t("pmTumProgramlar")}</option>
              {programlar.map((id) => (
                <option key={id} value={id}>
                  {prgAdi(id)}
                </option>
              ))}
            </select>
          )}
          <label className="arama arama-kutu">
            <Search size={15} />
            <input type="search" value={aranan} onChange={(e) => (setAranan(e.target.value), setKac(SAYFA))} placeholder={t("pmArsivAra")} aria-label={t("pmArsivAra")} data-prg-arsiv-ara />
          </label>
        </span>
      }
    >
      <div className="prg-seg" role="tablist">
        {ARSIV_SUZGECLERI.map((x) => (
          <button key={x} type="button" role="tab" aria-selected={x === suzgec} className={x === suzgec ? "acik" : ""} onClick={() => (setSuzgec(x), setKac(SAYFA))} data-prg-arsiv-suzgec={x}>
            {t(ARSIV_SUZGEC_ADI[x])} <em>{aramali.filter((k) => arsivSuzgeceUyar(k, x)).length}</em>
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <div className="prg-arsiv">
          {aylar.map((a) => (
            <section key={a.ay} className="prg-arsiv-ay">
              <h3>{a.ay ? tarihYaz(a.ay + "-01", dil, "ay") : "—"}</h3>
              <ul>
                {a.kayitlar.map((k) => (
                  <ArsivSatiri key={k.tur + k.id} k={k} programAdi={prgAdi(k.programId)} muhabir={k.muhabirId ? ad(kisiBul(v, k.muhabirId)) : ""} />
                ))}
              </ul>
            </section>
          ))}
          {liste.length > kac && (
            <button type="button" className="dugme dugme-ikincil" onClick={() => setKac(kac + SAYFA)} data-prg-arsiv-daha>
              {t("pmDahaFazla", { n: liste.length - kac })}
            </button>
          )}
        </div>
      )}
    </Kart>
  );
}

function ArsivSatiri({ k, programAdi, muhabir }: { k: ArsivKaydi; programAdi: string; muhabir: string }) {
  const { t, dil } = useDil();
  const rozet =
    k.tur === "yayinlandi" ? <Rozet ton="iyi">{t("mtYayinlandi")}</Rozet>
    : k.tur === "yayinlanmadi" ? <Rozet ton="kotu">{t("mtYayinlanmadi")}</Rozet>
    : k.tur === "iptal" ? <Rozet>{t("pmIptal")}</Rozet>
    : k.tur === "soru" ? <Rozet ton={k.kabul ? "iyi" : "kotu"}>{t(k.kabul ? "msAldi" : "msAlmadi")}</Rozet>
    : <Rozet ton="kotu">{t("pmTalepSonuc")}</Rozet>;
  const href = k.oneriId ? `#/oneriler/${k.oneriId}` : `#/paketler/${k.id}`;
  return (
    <li className="prg-arsiv-satir" data-prg-arsiv={k.oneriId ?? k.id}>
      <span className="prg-arsiv-gun">{tarihYaz(k.tarih, dil)}</span>
      <a href={href}>
        <Icerik>{k.baslik}</Icerik>
      </a>
      <span className="prg-arsiv-alt">
        {rozet}
        {programAdi && (
          <span className="soluk">
            <Tv size={12} /> <Icerik>{programAdi}</Icerik>
          </span>
        )}
        {muhabir && <span className="soluk">{muhabir}</span>}
        {k.paket?.gorevTalebi?.red?.gerekce && (
          <span className="soluk" dir="auto">
            {k.paket.gorevTalebi.red.gerekce}
          </span>
        )}
      </span>
    </li>
  );
}
