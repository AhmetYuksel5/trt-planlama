import { Archive, CalendarRange, ChevronLeft, ChevronRight, CirclePlay, Clapperboard, Layers, Lightbulb, Plus, Search, Tv, X } from "lucide-react";
import { MesajRozeti } from "../bilesenler/MesajRozeti";
import { useState, type ReactNode } from "react";
import { asamaListesi, geciktiMi, gorunenSahip, stokDurumu } from "../akis";
import { sozcuklerUyar } from "../arama";
import { KalemTeslimGunu, KararRozeti } from "../bilesenler/Haftalik";
import { KisiIletisim } from "../bilesenler/KisiCipi";
import { GorevTalepleri, GorevlendirDugmesi, SartliPaketler } from "../bilesenler/PaketGorevi";
import { Bos, HaftalikRozeti, Icerik, Kart, Pencere, Rozet, Tumu, TurRozeti, bildir } from "../bilesenler/Parcalar";
import { TeslimSatiri } from "../bilesenler/TeslimGunu";
import { UretimeAlDugmesi } from "../bilesenler/UretimBalonu";
import type { PostaSablonu } from "./posta/Posta";
import { aralikYaz, tarihYaz, useDil, type Anahtar } from "../dil";
import { BICIM_ADI, HAFTA_DURUM_ADI, HAFTA_DURUM_TONU, PLAN_DURUM_ADI, PLAN_DURUM_TONU, paketYeri } from "../etiketler";
import { haftalikOlustur, hazirPaketCikar, hazirPaketEkle } from "../eylemler";
import { haftaSonu, kalemAdi } from "../haftalik";
import {
  AKTIF_ALANLAR,
  MASA_BIRIMLERI,
  MASA_YOLU,
  icerikDurumAlani,
  masaIcerikleri,
  masaTalepleri,
  talepBekliyor,
  type IcerikAlani,
  type MasaBirimi,
} from "../programMasasi";
import {
  STOKTA_ALANLARI,
  OZEL_STOK_ALANLARI,
  ozelStokAlani,
  type OzelStokAlani,
  STOK_ARSIV_ALANLARI,
  STOK_BAYAT_GUN,
  STOK_BOLUMLERI,
  URETIM_ALANLARI,
  arsivTarihi,
  eklenebilirPlanlar,
  grupla,
  haftaStokKalemleri,
  haftaTeklifleri,
  stokArsivAlani,
  stokPaketGunu,
  stokPaketKisisi,
  stokPlani,
  stokTeklifiMi,
  stoktaAlani,
  stoktaGun,
  teklifGunu,
  teklifHaftasi,
  uretimAlani,
  type StokArsivAlani,
  type StokBolumu,
  type StokGrubu,
  type GrupBirimi,
  type StokSirasi,
  type StoktaAlani,
  type UretimAlani,
} from "../stokSayfasi";
import { bugun, gunEkle, haftaBasi } from "../tarih";
import { eskiOzelPaket, kisiBul, useVeri, type Kisi, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { gorevTalebiKarariVerebilir, planIcerikDuzenler, teslimGunuBelirleyebilir, uretimYoluBelirleyebilir, uretimeAlabilir, yapabilir } from "../yetki";
import { useAdimDurumu } from "../yol";
import { SayfaBasi } from "./ana/Planlama";
import { GundemeEkle } from "./haftalik/Plan";
import { OneriListesi } from "./oneri/OneriGovde";
import { GorunumSecici, useOneriGorunumu, type PencereDurumu } from "./oneri/OneriKarti";
import { OzelTalepAlani, ozelGorevSablonlari } from "./OzelYayin";
import { ALAN_ADI, IcerikKarti, MASA_ADI } from "./program/ProgramMasasi";

/*
 * Stok haberler / Programlar (kullanıcı: Programlar'ın sayfası gibi tıklanınca
 * altında açılan kutucuklar; orada çalışan bir yandan gelecek haftanın
 * tekliflerini topluyor, bir yandan daha önce planladığının üretimini izliyor,
 * bir yandan stoktaki paketleri kontrol edip planlara ekliyor; listeler tarihe
 * ya da muhabire göre). Kurallar stokSayfasi.ts. Kutucuklar bağlantı
 * (`#/stok/<bölüm>`): geri tuşu bölümler arasında gezer, menü vurgusu kalır.
 * Önce iki alanlıydı (haber merkezi / programlar), sekmeli tablolarla.
 */

const BOLUM_ADI: Record<StokBolumu, Anahtar> = {
  teklifler: "skTeklifler",
  uretim: "skUretim",
  stokta: "skStokta",
  ozel: "skOzel",
  programlar: "stAlanMasa",
  arsiv: "pmArsiv",
};
const BOLUM_IKONU: Record<StokBolumu, ReactNode> = {
  teklifler: <Lightbulb size={20} />,
  uretim: <CirclePlay size={20} />,
  stokta: <Layers size={20} />,
  ozel: <Tv size={20} />,
  programlar: <Clapperboard size={20} />,
  arsiv: <Archive size={20} />,
};
const URETIM_ALAN_ADI: Record<UretimAlani, Anahtar> = {
  alinacak: "sdBekliyor",
  uretimde: "sdUretimde",
};
const STOKTA_ALAN_ADI: Record<StoktaAlani, Anahtar> = {
  bekleyen: "skPlanaAlinmamis",
  planda: "skPlanaAlinan",
};
const ARSIV_ALAN_ADI: Record<StokArsivAlani, Anahtar> = {
  yayinlandi: "sdYayinlanan",
  yapilmadi: "skYapilmayan",
};

/* Sıra seçimi tarayıcıda (görünüm tercihi): kutucuklar arasında geçerken sıfırlanmasın. */
const SIRA_ANAHTARI = "trt-planlama-stok-sira";
const kayitliSira = (): StokSirasi => {
  try {
    return localStorage.getItem(SIRA_ANAHTARI) === "muhabir" ? "muhabir" : "tarih";
  } catch {
    return "tarih";
  }
};

export function StokSayfasi({ ben, ilk }: { ben: Kisi; ilk?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const bolum: StokBolumu = (STOK_BOLUMLERI as readonly string[]).includes(ilk ?? "") ? (ilk as StokBolumu) : "uretim";
  const [sira, setSiraD] = useState(kayitliSira);
  const setSira = (s: StokSirasi) => {
    setSiraD(s);
    try {
      localStorage.setItem(SIRA_ANAHTARI, s);
    } catch {
      /* gizli pencerede yalnız bu açılışta */
    }
  };
  const hafta = teklifHaftasi(v, B);
  const teklif = haftaTeklifleri(v, hafta, B).filter(stokTeklifiMi).length;
  const uretim = v.paketler.map(uretimAlani);
  const stok = v.paketler.map((p) => stoktaAlani(v, p));
  const stokSayisi = stok.filter(Boolean).length;
  const planda = stok.filter((a) => a === "planda").length;
  const ozelSuren = v.paketler.filter((p) => ozelStokAlani(p) === "suren").length;
  const masaAktif = MASA_BIRIMLERI.reduce((n, b) => n + masaIcerikleri(v, b).filter((p) => icerikDurumAlani(p) !== "arsiv").length, 0);
  const bilgi: Record<StokBolumu, { alt: string; say: number }> = {
    teklifler: {
      alt: t("skTekliflerAlt", { hafta: tarihYaz(hafta, dil), n: teklif }),
      say: teklif,
    },
    // Sayılar menüdekiyle aynı kuraldan: kişinin üretime alabileceği ve karar verebileceği talep.
    uretim: {
      alt: t("skUretimAlt", {
        n: uretim.filter((a) => a === "uretimde").length,
        m: uretim.filter((a) => a === "alinacak").length,
      }),
      say: v.paketler.filter((p) => uretimeAlabilir(ben, p) || (uretimAlani(p) && !stokPaketGunu(v, p) && teslimGunuBelirleyebilir(ben, p))).length,
    },
    stokta: {
      alt: t("skStoktaAlt", { n: stokSayisi, m: planda }),
      say: stokSayisi - planda,
    },
    ozel: {
      alt: t("skOzelAlt", { n: ozelSuren, m: new Set(v.paketler.filter((p) => ozelStokAlani(p)).map((p) => p.ozelId)).size }),
      say: ozelSuren,
    },
    programlar: {
      alt: t("pmIceriklerAlt", { n: masaAktif }),
      say: MASA_BIRIMLERI.reduce((n, b) => n + masaTalepleri(v, b).filter((p) => talepBekliyor(p) && gorevTalebiKarariVerebilir(ben, p)).length, 0),
    },
    arsiv: {
      alt: t("skArsivAlt", {
        n: v.paketler.filter((p) => stokArsivAlani(p) === "yayinlandi").length,
      }),
      say: 0,
    },
  };
  const siraSecimi = <SiraSecimi sira={sira} setSira={setSira} />;
  return (
    <>
      <SayfaBasi ikon={<Layers size={26} />} baslik={t("mStok")} sagUc={<GorevlendirDugmesi ben={ben} />} />
      <div className="prg-masa masa-planlama stok-sayfa" data-stok-sayfasi={bolum}>
        <div className="prg-kutular kutu-6" role="tablist">
          {STOK_BOLUMLERI.map((b) => (
            <a
              key={b}
              href={`#/stok/${b}`}
              role="tab"
              aria-selected={bolum === b}
              className={`prg-kutu prg-k-${b}${bolum === b ? " secili" : ""}`}
              data-stok-kutu={b}
            >
              <span className="prg-kutu-ik">{BOLUM_IKONU[b]}</span>
              <b>{t(BOLUM_ADI[b])}</b>
              <small>{bilgi[b].alt}</small>
              {bilgi[b].say > 0 && <em className="prg-say">{bilgi[b].say}</em>}
            </a>
          ))}
        </div>
        {bolum === "teklifler" && <Teklifler ben={ben} sira={sira} siraSecimi={siraSecimi} />}
        {bolum === "uretim" && <Uretim ben={ben} sira={sira} siraSecimi={siraSecimi} />}
        {bolum === "stokta" && <Stokta ben={ben} sira={sira} siraSecimi={siraSecimi} />}
        {bolum === "ozel" && <OzelKutusu ben={ben} />}
        {bolum === "programlar" && <Programlar ben={ben} sira={sira} siraSecimi={siraSecimi} />}
        {bolum === "arsiv" && <Arsiv sira={sira} siraSecimi={siraSecimi} />}
      </div>
    </>
  );
}

function SiraSecimi({ sira, setSira }: { sira: StokSirasi; setSira: (s: StokSirasi) => void }) {
  const { t } = useDil();
  return (
    <select
      className="girdi girdi-kisa"
      value={sira}
      onChange={(e) => setSira(e.target.value as StokSirasi)}
      aria-label={t("psSirala")}
      title={t("psSirala")}
      data-stok-sira
    >
      <option value="tarih">{t("skSiraTarih")}</option>
      <option value="muhabir">{t("psSiraMuhabir")}</option>
    </select>
  );
}

/*
 * Grubun başlığı: gün, hafta (yakın haftalar adıyla) ya da ay; ya da muhabirin
 * adı, muhabirsiz. Günsüz grup pakette "Teslim günü belirlenmedi" (kullanıcı:
 * stok ve feature zamana bağlı olmayabilir ama teslim süresi mutlaka
 * belirlenir; önce "Zamana bağlı değil" yazıyordu), teklifte Weekly'de
 * düşeceği yer, "Stok ve programlar".
 */
function useGrupBasligi(sira: StokSirasi, birim: GrupBirimi = "gun", bos: Anahtar = "skTeslimYok") {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const bu = haftaBasi(bugun());
  return (anahtar: string) => {
    if (sira === "muhabir") return anahtar ? ad(kisiBul(v, anahtar)) : t("psMuhabirsiz");
    if (!anahtar) return t(bos);
    if (birim === "ay") return tarihYaz(anahtar + "-01", dil, "ay");
    if (birim === "gun") return tarihYaz(anahtar, dil, "tam");
    const yakin = anahtar === bu ? t("buHafta") : anahtar === gunEkle(bu, 7) ? t("gelecekHafta") : anahtar === gunEkle(bu, -7) ? t("skGecenHafta") : "";
    return [yakin, aralikYaz(anahtar, haftaSonu(anahtar), dil)].filter(Boolean).join(" · ");
  };
}

/* Bölümün sekmeleri (Programlar'daki alanlar gibi): ad ve sayı. */
function Alanlar<T extends string>({
  alanlar,
  secili,
  sec,
  ad,
  sayi,
  veri,
}: {
  alanlar: readonly T[];
  secili: T;
  sec: (a: T) => void;
  ad: (a: T) => Anahtar;
  sayi: (a: T) => number;
  veri: string;
}) {
  const { t } = useDil();
  return (
    <div className="prg-seg" role="tablist">
      {alanlar.map((a) => (
        <button
          key={a}
          type="button"
          role="tab"
          aria-selected={a === secili}
          className={a === secili ? "acik" : ""}
          onClick={() => sec(a)}
          {...{ [`data-${veri}`]: a }}
        >
          {t(ad(a))} <em>{sayi(a)}</em>
        </button>
      ))}
    </div>
  );
}

function PaketGruplari({ gruplar, sira, kart }: { gruplar: StokGrubu<Paket>[]; sira: StokSirasi; kart: (p: Paket) => ReactNode }) {
  const { t } = useDil();
  const baslik = useGrupBasligi(sira, "hafta");
  if (!gruplar.length) return <Bos metin={t("kayitYok")} />;
  return (
    <div className={sira === "muhabir" ? "stok-kolonlu" : undefined}>
      <div className="bp-gruplar" data-stok-liste={sira}>
        {gruplar.map((g) => (
          <section key={g.anahtar || "-"} className="bp-grup" data-stok-grup={g.anahtar || "-"}>
            <h3 className={`bp-grup-baslik${!g.anahtar && sira === "tarih" ? " uyari" : ""}`}>
              {baslik(g.anahtar)} <em>{g.liste.length}</em>
            </h3>
            <div className="prg-icerikler">{g.liste.map(kart)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* Paketin durumu: üretimde şimdiki aşama ve kimde; stokta kaç gündür beklediği. */
function StokRozeti({ p }: { p: Paket }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const s = stokDurumu(p);
  if (p.durum === "iptal") return <Rozet ton="kotu">{t(p.yapilmadi ? "skYapilmayan" : "pdIptal")}</Rozet>;
  if (s === "yayinlandi") return <Rozet ton="iyi">{t("sdYayinlandi")}</Rozet>;
  if (s === "stokta") {
    const n = stoktaGun(p, bugun());
    return <Rozet ton={n >= STOK_BAYAT_GUN ? "uyari" : "iyi"}>{n ? t("skStoktaGun", { n }) : t("skBugunStokta")}</Rozet>;
  }
  // Üretime alınacak: sekmesi zaten söylüyor, kartta "Üretime al" düğmesi var.
  if (s === "bekliyor") return null;
  const kisi = stokPaketKisisi(p);
  // Özel yayın dosyasının kendi aşamaları var (paket sayfasında); burada işin kimde olduğu yeter.
  const simdi = eskiOzelPaket(p) ? undefined : asamaListesi(p).find((a) => a.durum === "simdi" || a.durum === "gecikti");
  const sahip = eskiOzelPaket(p) ? "muhabir" : gorunenSahip(p);
  const kimde = sahip === "muhabir" ? (kisi ? ad(kisiBul(v, kisi)) : "") : sahip ? birimAdi(sahip) : "";
  return <Rozet ton={geciktiMi(p) ? "kotu" : "vurgu"}>{[simdi?.ad ?? t("sdUretimde"), kimde].filter(Boolean).join(" · ")}</Rozet>;
}

/* Programlar'ın içerik kartının kalıbı: tür, yer, gün, durum; başlık; muhabir, iletişim ve bölümün işi. */
/** `yayinsiz`: özel yayının kendi sayfasında kartta yayının adı tekrar edilmiyor. */
export function StokKarti({ ben, p, ek, yayinsiz, sablonlar }: { ben: Kisi; p: Paket; ek?: ReactNode; yayinsiz?: boolean; sablonlar?: PostaSablonu[] }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const kisiId = stokPaketKisisi(p);
  const kisi = kisiId ? kisiBul(v, kisiId) : undefined;
  const acik = p.durum === "onaylandi" || p.durum === "uretimde";
  const gun = stokPaketGunu(v, p);
  return (
    <div className="prg-icerik" data-stok-paket={p.id}>
      <div className="prg-icerik-ust">
        <Rozet ton="masa">{t(BICIM_ADI(p.bicim ?? "pkg"))}</Rozet>
        <Icerik>{paketYeri(p)}</Icerik>
        {!acik && gun && <span className="soluk">· {tarihYaz(gun, dil)}</span>}
        {p.haftalikKalemId && <HaftalikRozeti />}
        <span className="bosluk-esnek" />
        <StokRozeti p={p} />
      </div>
      <a href={`#/paketler/${p.id}`} className="prg-icerik-baslik">
        <Icerik blok>{p.baslik}</Icerik>
      </a>
      {p.ozelAd && !yayinsiz && (
        <span className="soluk">
          <Tv size={12} /> <Icerik>{p.ozelAd}</Icerik>
        </span>
      )}
      {acik && <TeslimSatiri ben={ben} p={p} gun={gun} />}
      <div className="prg-icerik-alt">
        <span className="soluk">{kisi ? ad(kisi) : t("atanmadi")}</span>
        {/* İşi süren paketin muhabirine ulaşma (Programlar'daki gibi iş bazında). */}
        {kisi && acik && (
          <span className="prg-iletisim">
            <KisiIletisim ben={ben} kisi={kisi} konu={p.baslik} sablonlar={sablonlar} />
          </span>
        )}
        {acik && <MesajRozeti ben={ben} paket={p} />}
        <span className="bosluk-esnek" />
        {ek}
      </div>
    </div>
  );
}

/* --- Teklifler: gelecek haftanın Weekly'si --- */

function Teklifler({ ben, sira, siraSecimi }: { ben: Kisi; sira: StokSirasi; siraSecimi: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const B = bugun();
  const [hafta, setHafta] = useAdimDurumu("stok:hafta", () => teklifHaftasi(v, B));
  const [kapsam, setKapsam] = useAdimDurumu<"stok" | "hepsi">("stok:kapsam", "stok");
  const [gorunum, setGorunum] = useOneriGorunumu(ben);
  const [pencere, setPencere] = useState<PencereDurumu>(null);
  const baslik = useGrupBasligi(sira, "gun", "stokVeProgramlar");
  const plan = v.haftalik.find((h) => h.baslangic === hafta);
  const hepsi = haftaTeklifleri(v, hafta, B);
  const stok = hepsi.filter(stokTeklifiMi);
  const liste = kapsam === "stok" ? stok : hepsi;
  const gruplar = grupla(liste, sira, {
    tarih: teklifGunu,
    kisi: (o) => o.muhabirId,
    ad: (id) => ad(kisiBul(v, id)),
    artan: true,
    dil,
  });
  const kalemler = haftaStokKalemleri(v, hafta);
  const kalemSirasi =
    sira === "muhabir" ? [...kalemler].sort((a, b) => ad(kisiBul(v, a.muhabirler[0])).localeCompare(ad(kisiBul(v, b.muhabirler[0])), dil)) : kalemler;
  const acabilir = yapabilir(ben, "haftalikDuzenle");
  const haftaAc = () => {
    if (haftalikOlustur(ben, hafta)) bildir(t("bKaydedildi"));
  };
  return (
    <>
      <Kart
        baslik={t("skTeklifler")}
        ikon={<Lightbulb size={18} />}
        sagUc={
          <span className="prg-arac">
            <GorunumSecici deger={gorunum} degistir={setGorunum} />
            {siraSecimi}
          </span>
        }
      >
        <div className="stok-hafta" data-stok-hafta={hafta}>
          <span className="prg-hafta">
            <button
              type="button"
              className="dugme dugme-ikincil dugme-ikon"
              onClick={() => setHafta(gunEkle(hafta, -7))}
              aria-label={t("pmOncekiHafta")}
              title={t("pmOncekiHafta")}
            >
              <ChevronLeft size={16} className="yon" />
            </button>
            <span>
              <CalendarRange size={14} /> {t("pmWeekly")} · {aralikYaz(hafta, haftaSonu(hafta), dil)}
            </span>
            <button
              type="button"
              className="dugme dugme-ikincil dugme-ikon"
              onClick={() => setHafta(gunEkle(hafta, 7))}
              aria-label={t("pmSonrakiHafta")}
              title={t("pmSonrakiHafta")}
            >
              <ChevronRight size={16} className="yon" />
            </button>
          </span>
          <span className="bosluk-esnek" />
          {plan ? (
            <>
              <Rozet ton={HAFTA_DURUM_TONU[plan.durum]}>{t(HAFTA_DURUM_ADI[plan.durum])}</Rozet>
              <a className="dugme dugme-ikincil dugme-kucuk" href={`#/haftalik/${plan.id}`} data-stok-weekly={plan.id}>
                {t("skHaftayiAc")}
              </a>
            </>
          ) : (
            <>
              <span className="soluk">{t("skHaftaYok")}</span>
              {acabilir && (
                <button type="button" className="dugme dugme-kucuk" onClick={haftaAc} data-stok-hafta-ac>
                  <Plus size={14} /> {t("yeniHaftalik")}
                </button>
              )}
            </>
          )}
        </div>
        <Alanlar
          alanlar={["stok", "hepsi"] as const}
          secili={kapsam}
          sec={setKapsam}
          ad={(a) => (a === "stok" ? "stokVeProgramlar" : "skButunTeklifler")}
          sayi={(a) => (a === "stok" ? stok.length : hepsi.length)}
          veri="stok-kapsam"
        />
        <div className={sira === "muhabir" ? "stok-kolonlu" : undefined}>
          <OneriListesi
            ben={ben}
            d={v}
            oneriler={liste}
            gorunum={gorunum}
            pencere={pencere}
            setPencere={setPencere}
            ekleMetni={t("gundemeEkle")}
            // Stok teklifinde gün boş gelir, teklif Weekly'nin "Stok ve programlar"ına düşer; günlü haberde kendi günü.
            ekleFormu={(o, kapat) =>
              plan ? (
                <GundemeEkle ben={ben} hafta={plan} oneri={o} kapat={kapat} stok={stokTeklifiMi(o)} />
              ) : (
                <div className="form form-kutu ara-ust-2">
                  <span className="soluk">{t("skHaftaYok")}</span>
                  {acabilir && (
                    <div className="form-alt">
                      <button type="button" className="dugme dugme-kucuk" onClick={haftaAc} data-stok-hafta-ac>
                        <Plus size={14} /> {t("yeniHaftalik")}
                      </button>
                    </div>
                  )}
                </div>
              )
            }
            gruplar={gruplar.map((g) => ({
              anahtar: g.anahtar,
              baslik: baslik(g.anahtar),
              oneriler: g.liste,
            }))}
          />
        </div>
      </Kart>
      <Kart baslik={t("skGundemde")} ikon={<CalendarRange size={18} />} ek={String(kalemler.length)} sagUc={plan && <Tumu href={`#/haftalik/${plan.id}`} />}>
        {kalemler.length === 0 ? (
          <Bos kucuk metin={t("kayitYok")} />
        ) : (
          <ul className="liste" data-stok-kalemler>
            {kalemSirasi.map((k) => (
              <li key={k.id} data-stok-kalem={k.id}>
                <div className="ad">
                  <Icerik blok>{k.paketBasligi || kalemAdi(k)}</Icerik>
                  <small>{k.muhabirler.length ? k.muhabirler.map((id) => ad(kisiBul(v, id))).join(" · ") : k.muhabirTbc ? "TBC" : t("atanmadi")}</small>
                  <KalemTeslimGunu kalem={k} kucuk />
                </div>
                <TurRozeti tur={k.tur} />
                <KararRozeti kalem={k} />
              </li>
            ))}
          </ul>
        )}
      </Kart>
    </>
  );
}

/* --- Üretim: daha önce planlananın takibi --- */

function Uretim({ ben, sira, siraSecimi }: { ben: Kisi; sira: StokSirasi; siraSecimi: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter((p) => uretimAlani(p));
  // İlk açılışta dolu ilk alan (boş alanla açılmasın).
  const [alan, setAlan] = useAdimDurumu<UretimAlani>(
    "stok:uretimAlan",
    () => URETIM_ALANLARI.find((a) => liste.some((p) => uretimAlani(p) === a)) ?? "alinacak",
  );
  const gruplar = grupla(
    liste.filter((p) => uretimAlani(p) === alan),
    sira,
    {
      tarih: (p) => stokPaketGunu(v, p),
      kisi: stokPaketKisisi,
      ad: (id) => ad(kisiBul(v, id)),
      artan: true,
      birim: "hafta",
      dil,
      bosOnce: true,
    },
  );
  return (
    <>
      {/* Toplantıdan şartlı dönen ve özel yayının dağıtılacak dosyaları: üretimin önündeki kararlar. */}
      <SartliPaketler ben={ben} />
      <OzelTalepAlani ben={ben} bosGizle />
      <Kart baslik={t("skUretim")} ikon={<CirclePlay size={18} />} sagUc={siraSecimi}>
        <Alanlar
          alanlar={URETIM_ALANLARI}
          secili={alan}
          sec={setAlan}
          ad={(a) => URETIM_ALAN_ADI[a]}
          sayi={(a) => liste.filter((p) => uretimAlani(p) === a).length}
          veri="stok-uretim-alan"
        />
        <PaketGruplari
          gruplar={gruplar}
          sira={sira}
          kart={(p) => <StokKarti key={p.id} ben={ben} p={p} ek={uretimeAlabilir(ben, p) && <UretimeAlDugmesi ben={ben} paket={p} />} />}
        />
      </Kart>
    </>
  );
}

/* --- Special Coverage: özel yayınların içerikleri, yayın yayın --- */

/*
 * Özel yayında görevlendirilen içerikler (kullanıcı: stokta "special coverage"
 * olarak da görülsün, takibi buradan da yapılsın). Kart Stok'unkiyle aynı
 * (aşama, kimde, teslim, muhabire ulaşma), "Üretime al" balonu; yayının
 * başlığı yayının sayfasına götürür. Süren / biten.
 */
function OzelKutusu({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter((p) => ozelStokAlani(p));
  const [alan, setAlan] = useAdimDurumu<OzelStokAlani>("stok:ozelAlan", "suren");
  const secili = liste.filter((p) => ozelStokAlani(p) === alan);
  const yayinlar = v.ozel.filter((o) => secili.some((p) => p.ozelId === o.id)).sort((a, b) => b.tarih.localeCompare(a.tarih));
  return (
    <Kart baslik={t("skOzel")} ikon={<Tv size={18} />}>
      <Alanlar alanlar={OZEL_STOK_ALANLARI} secili={alan} sec={setAlan} ad={(a) => (a === "suren" ? "sdUretimde" : "skOzelBiten")} sayi={(a) => liste.filter((p) => ozelStokAlani(p) === a).length} veri="stok-ozel-alan" />
      {yayinlar.length === 0 && <Bos kucuk metin={t("kayitYok")} />}
      {yayinlar.map((o) => (
        <section key={o.id} className="ara-ust-2" data-stok-ozel={o.id}>
          <a href={`#/ozel/${o.id}`} className="alan-etiket">
            <Tv size={14} /> <Icerik>{o.ad}</Icerik> · {o.bitis ? aralikYaz(o.tarih, o.bitis, dil) : tarihYaz(o.tarih, dil)}
          </a>
          <div className="prg-icerikler">
            {secili
              .filter((p) => p.ozelId === o.id)
              .sort((a, b) => (a.yayinGunu ?? "").localeCompare(b.yayinGunu ?? ""))
              .map((p) => (
                <StokKarti key={p.id} ben={ben} p={p} sablonlar={ozelGorevSablonlari(ben, v, p, t)} ek={uretimYoluBelirleyebilir(ben, p) && p.durum === "onaylandi" && !p.uretim && <UretimeAlDugmesi ben={ben} paket={p} />} />
              ))}
          </div>
        </section>
      ))}
    </Kart>
  );
}

/* --- Stokta: kontrol ve planlara ekleme --- */

function Stokta({ ben, sira, siraSecimi }: { ben: Kisi; sira: StokSirasi; siraSecimi: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const liste = v.paketler.filter((p) => stoktaAlani(v, p));
  const [alan, setAlan] = useAdimDurumu<StoktaAlani>(
    "stok:stoktaAlan",
    () => STOKTA_ALANLARI.find((a) => liste.some((p) => stoktaAlani(v, p) === a)) ?? "bekleyen",
  );
  const [ekle, setEkle] = useState<Paket | null>(null);
  const ekleyebilir = yapabilir(ben, "planDuzenle");
  // Yeniden eskiye: en son stoka giren önce; uzun bekleyen rozetiyle (STOK_BAYAT_GUN) göze çarpar.
  const gruplar = grupla(
    liste.filter((p) => stoktaAlani(v, p) === alan),
    sira,
    {
      tarih: (p) => stokPaketGunu(v, p),
      kisi: stokPaketKisisi,
      ad: (id) => ad(kisiBul(v, id)),
      artan: false,
      birim: "hafta",
      dil,
    },
  );
  const isi = (p: Paket) => {
    const plan = stokPlani(v, p);
    if (plan)
      return (
        <span className="stok-plan" data-stok-planda={p.id}>
          <a className="rozet rozet-vurgu" href={`#/nextday/${plan.id}`}>
            {t("skNextDay", { tarih: tarihYaz(plan.tarih, dil) })}
          </a>
          {planIcerikDuzenler(ben, plan) && (
            <button
              type="button"
              className="dugme dugme-sade dugme-ikon"
              onClick={() => hazirPaketCikar(ben, plan.id, p.id) && bildir(t("bKaydedildi"))}
              aria-label={t("plandanCikar")}
              title={t("plandanCikar")}
              data-stok-plandan-cikar={p.id}
            >
              <X size={14} />
            </button>
          )}
        </span>
      );
    return (
      ekleyebilir && (
        <button type="button" className="dugme dugme-yumusak dugme-kucuk" onClick={() => setEkle(p)} data-stok-plana-ekle={p.id}>
          <Plus size={14} /> {t("planaEkle")}
        </button>
      )
    );
  };
  return (
    <Kart baslik={t("skStokta")} ikon={<Layers size={18} />} sagUc={siraSecimi}>
      <Alanlar
        alanlar={STOKTA_ALANLARI}
        secili={alan}
        sec={setAlan}
        ad={(a) => STOKTA_ALAN_ADI[a]}
        sayi={(a) => liste.filter((p) => stoktaAlani(v, p) === a).length}
        veri="stok-stokta-alan"
      />
      <PaketGruplari gruplar={gruplar} sira={sira} kart={(p) => <StokKarti key={p.id} ben={ben} p={p} ek={isi(p)} />} />
      {ekle && <PlanaEklePenceresi ben={ben} paket={ekle} kapat={() => setEkle(null)} />}
    </Kart>
  );
}

/* Stoktaki paketi açık bir Next Day planının hazır paketlerine koyma (planın kendi "Stoktan seç"iyle aynı eylem). */
function PlanaEklePenceresi({ ben, paket, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const planlar = eklenebilirPlanlar(v, ben, bugun());
  const sec = (planId: string) => {
    if (hazirPaketEkle(ben, planId, paket.id)) {
      bildir(t("skPlanaEklendi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t("planaEkle")} alt={<Icerik>{paket.baslik}</Icerik>} kapat={kapat}>
      {planlar.length === 0 ? (
        <Bos metin={t("skAcikPlanYok")} />
      ) : (
        <ul className="liste" data-stok-planlar>
          {planlar.map((p) => (
            <li key={p.id}>
              <div className="ad">
                <b>{t("skNextDay", { tarih: tarihYaz(p.tarih, dil, "tam") })}</b>
                <small>{t("skHazirSayisi", { n: p.hazirPaketler.length })}</small>
              </div>
              <Rozet ton={PLAN_DURUM_TONU[p.durum]}>{t(PLAN_DURUM_ADI[p.durum])}</Rozet>
              <button type="button" className="dugme dugme-kucuk" onClick={() => sec(p.id)} data-stok-plan={p.id}>
                {t("sec")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Pencere>
  );
}

/* --- Programlar: masaların paketleri (takibi masada; burada yalnız nerede oldukları) --- */

function Programlar({ ben, sira, siraSecimi }: { ben: Kisi; sira: StokSirasi; siraSecimi: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [masa, setMasa] = useAdimDurumu<MasaBirimi>("stok:masa", "program");
  const icerik = masaIcerikleri(v, masa);
  const [alan, setAlan] = useAdimDurumu<IcerikAlani>(
    "stok:masaAlan",
    () => AKTIF_ALANLAR.find((a) => icerik.some((p) => icerikDurumAlani(p) === a)) ?? "planlamada",
  );
  const gruplar = grupla(
    icerik.filter((p) => icerikDurumAlani(p) === alan),
    sira,
    {
      tarih: (p) => stokPaketGunu(v, p),
      kisi: stokPaketKisisi,
      ad: (id) => ad(kisiBul(v, id)),
      artan: true,
      birim: "hafta",
      dil,
      bosOnce: true,
    },
  );
  return (
    <>
      {/* Masaların görev talepleri: kararı Planlama veriyor, kabul edilen masanın takibine geçiyor. */}
      <GorevTalepleri ben={ben} />
      <Kart
        baslik={t("stAlanMasa")}
        ikon={<Clapperboard size={18} />}
        sagUc={
          <span className="prg-arac">
            {siraSecimi}
            <Tumu href={`#/${MASA_YOLU[masa]}/icerikler`} />
          </span>
        }
      >
        <div className="secim-grubu ara-alt-2" role="group" aria-label={t("stAlanMasa")}>
          {MASA_BIRIMLERI.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={masa === b}
              data-stok-masa={b}
              className={`dugme dugme-kucuk ${masa === b ? "" : "dugme-ikincil"}`}
              onClick={() => setMasa(b)}
            >
              {t(MASA_ADI[b])} <em>{masaIcerikleri(v, b).filter((p) => icerikDurumAlani(p) !== "arsiv").length}</em>
            </button>
          ))}
        </div>
        <Alanlar
          alanlar={AKTIF_ALANLAR}
          secili={alan}
          sec={setAlan}
          ad={(a) => ALAN_ADI[a]}
          sayi={(a) => icerik.filter((p) => icerikDurumAlani(p) === a).length}
          veri="stok-masa-alan"
        />
        <div data-stok-masa-liste>
          <PaketGruplari
            gruplar={gruplar}
            sira={sira}
            kart={(p) => (
              <IcerikKarti
                key={p.id}
                ben={ben}
                birim={masa}
                p={p}
                teslim={(p.durum === "onaylandi" || p.durum === "uretimde") && <TeslimSatiri ben={ben} p={p} gun={stokPaketGunu(v, p)} />}
              />
            )}
          />
        </div>
      </Kart>
    </>
  );
}

/* --- Arşiv: yayınlanan ve yapılmayan stok paketleri, aranır --- */

const SAYFA = 40;
function Arsiv({ sira, siraSecimi }: { sira: StokSirasi; siraSecimi: ReactNode }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [alan, setAlan] = useAdimDurumu<StokArsivAlani>("stok:arsivAlan", "yayinlandi");
  const [aranan, setAranan] = useAdimDurumu("stok:arsivAra", "");
  const [kac, setKac] = useState(SAYFA);
  const baslik = useGrupBasligi(sira, "ay");
  const kisiMetni = (p: Paket) => {
    const k = kisiBul(v, stokPaketKisisi(p));
    return k ? (typeof k.ad === "string" ? k.ad : Object.values(k.ad).join(" ")) : "";
  };
  const hepsi = v.paketler.filter((p) => stokArsivAlani(p) && (!aranan.trim() || sozcuklerUyar([p.baslik, p.kod, kisiMetni(p)].join(" "), aranan)));
  const gruplar = grupla(
    hepsi.filter((p) => stokArsivAlani(p) === alan),
    sira,
    {
      tarih: arsivTarihi,
      kisi: stokPaketKisisi,
      ad: (id) => ad(kisiBul(v, id)),
      artan: false,
      birim: "ay",
      dil,
    },
  );
  // Sayfalama sıralanmış listeden: gruplar ilk `kac` kayda kadar.
  let kalan = kac;
  const gorunen = gruplar.flatMap((g) => {
    if (kalan <= 0) return [];
    const l = g.liste.slice(0, kalan);
    kalan -= l.length;
    return [{ ...g, liste: l }];
  });
  const toplam = gruplar.reduce((n, g) => n + g.liste.length, 0);
  const nerede = (p: Paket) => {
    if (p.yayinlandi?.ozelId) return v.ozel.find((o) => o.id === p.yayinlandi!.ozelId)?.ad ?? p.ozelAd ?? "";
    const plan = v.planlar.find((x) => x.id === p.yayinlandi?.planId);
    return plan ? t("skNextDay", { tarih: tarihYaz(plan.tarih, dil) }) : "";
  };
  return (
    <Kart
      baslik={t("pmArsiv")}
      ikon={<Archive size={18} />}
      sagUc={
        <span className="prg-arac">
          <label className="arama arama-kutu">
            <Search size={15} />
            <input
              type="search"
              value={aranan}
              onChange={(e) => (setAranan(e.target.value), setKac(SAYFA))}
              placeholder={t("skArsivAra")}
              aria-label={t("skArsivAra")}
              data-stok-arsiv-ara
            />
          </label>
          {siraSecimi}
        </span>
      }
    >
      <Alanlar
        alanlar={STOK_ARSIV_ALANLARI}
        secili={alan}
        sec={(a) => (setAlan(a), setKac(SAYFA))}
        ad={(a) => ARSIV_ALAN_ADI[a]}
        sayi={(a) => hepsi.filter((p) => stokArsivAlani(p) === a).length}
        veri="stok-arsiv-alan"
      />
      {toplam === 0 ? (
        <Bos metin={t("kayitYok")} />
      ) : (
        <div className="prg-arsiv" data-stok-liste={sira}>
          {gorunen.map((g) => (
            <section key={g.anahtar || "-"} className="prg-arsiv-ay" data-stok-grup={g.anahtar || "-"}>
              <h3>{baslik(g.anahtar)}</h3>
              <ul>
                {g.liste.map((p) => (
                  <li key={p.id} className="prg-arsiv-satir" data-stok-arsiv={p.id}>
                    <span className="prg-arsiv-gun">{tarihYaz(arsivTarihi(p), dil)}</span>
                    <a href={`#/paketler/${p.id}`}>
                      <Icerik>{p.baslik}</Icerik>
                    </a>
                    <span className="prg-arsiv-alt">
                      <StokRozeti p={p} />
                      {nerede(p) && <span className="soluk">{nerede(p)}</span>}
                      <span className="soluk">{stokPaketKisisi(p) ? ad(kisiBul(v, stokPaketKisisi(p))) : t("psMuhabirsiz")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {toplam > kac && (
            <button type="button" className="dugme dugme-ikincil" onClick={() => setKac(kac + SAYFA)} data-stok-arsiv-daha>
              {t("pmDahaFazla", { n: toplam - kac })}
            </button>
          )}
        </div>
      )}
    </Kart>
  );
}
