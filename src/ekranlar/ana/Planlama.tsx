import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle,
  CirclePlay,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  History,
  Lightbulb,
  ListChecks,
  MapPinned,
  Network,
  Tv,
  Users,
  Calendar,
  Package,
} from "lucide-react";
import type { ReactNode } from "react";
import { geciktiMi, paketSahibi } from "../../akis";
import { HareketAkisi } from "../../bilesenler/Hareket";
import { Avatar, Bos, Icerik, Ilerleme, Kart, Rozet, Sayac, Tumu } from "../../bilesenler/Parcalar";
import { OneriTablosu } from "../../bilesenler/Tablolar";
import { gunAdi, saatYaz, tarihYaz, useDil, type Anahtar } from "../../dil";
import { BIRIM_ADI, HAFTA_DURUM_ADI, HAFTA_DURUM_TONU, PLAN_DURUM_ADI, PLAN_DURUM_TONU, kisiAr, satir, sehirAdi } from "../../etiketler";
import { gundemde, kalemAdi } from "../../haftalik";
import { bugun, gunEkle, planlananHafta, yerelGun } from "../../tarih";
import { muhabirler, useVeri, type Durum, type Kisi } from "../../veri";
import { YaklasanFaaliyetlerAlani } from "../takvim/Planlarda";
import { CalismaAlani, type Alan } from "./Calisma";

/**
 * Planlama Birimi ana sayfası (rapor Şekil 4).
 *
 * Plan üretimini ve muhabirlerden gelen editoryal girdiyi merkeze alıyor;
 * diğer birimlerin durumu koordinasyon için özet olarak görünüyor.
 * Promptun 3. maddesindeki beş alan: bugünün ve yaklaşan günlerin Next Day
 * planları, haftalık/aylık erişim, değerlendirme bekleyen öneriler,
 * hazırlanan planlar ve özel yayınlar, koordinasyon gerektiren işler.
 * Görseldeki tür dağılımı halkası promptun "gereksiz grafik kullanma"
 * kuralı yüzünden yok; yerini koordinasyon listesi aldı.
 */

const KISAYOLLAR: { sayfa: string; renk: string; ikon: typeof CalendarDays; ad: Anahtar; aciklama: Anahtar }[] = [
  { sayfa: "nextday/yarin", renk: "renk-nextday", ikon: CalendarDays, ad: "ksNextday", aciklama: "ksNextdayA" },
  { sayfa: "haftalik", renk: "renk-haftalik", ikon: CalendarRange, ad: "ksHaftalik", aciklama: "ksHaftalikA" },
  { sayfa: "aylik", renk: "renk-aylik", ikon: Calendar, ad: "ksAylik", aciklama: "ksAylikA" },
  { sayfa: "ozel", renk: "renk-ozel", ikon: Tv, ad: "ksOzel", aciklama: "ksOzelA" },
  { sayfa: "saha", renk: "renk-saha", ikon: MapPinned, ad: "ksSaha", aciklama: "ksSahaA" },
  { sayfa: "takvim", renk: "renk-takvim", ikon: CalendarCheck, ad: "ksTakvim", aciklama: "ksTakvimA" },
];

export function PlanKisayollari() {
  const { t } = useDil();
  return (
    <nav className="kisayollar" aria-label={t("planlar")}>
      {KISAYOLLAR.map((k) => {
        const Ikon = k.ikon;
        return (
          <a key={k.sayfa} className={`kisayol ${k.renk}`} href={`#/${k.sayfa}`}>
            <span className="ikon">
              <Ikon size={22} />
            </span>
            <span>
              <b>{t(k.ad)}</b>
              <small>{t(k.aciklama)}</small>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export function SayfaBasi({ ikon, baslik, alt, sagUc }: { ikon: ReactNode; baslik: string; alt: string; sagUc?: ReactNode }) {
  const { dil } = useDil();
  const B = bugun();
  return (
    <header className="sayfa-basi">
      <span className="ikon-kutu">{ikon}</span>
      <div>
        <h1>{baslik}</h1>
        <p>{alt}</p>
      </div>
      <div className="sag-uc">
        {sagUc}
        <div className="tarih-kart">
          <CalendarDays size={22} />
          <div>
            <b>{tarihYaz(B, dil, "uzun")}</b>
            <small>{gunAdi(B, dil)}</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function PlanlamaAna({ ben, kisisel = true }: { ben: Kisi; kisisel?: boolean }) {
  const { t } = useDil();
  return (
    <>
      <SayfaBasi ikon={<Users size={28} />} baslik={t("planlamaBirimi")} alt={t("planlamaAlt")} />
      <CalismaAlani ben={ben} duzen="planlama" kisisel={kisisel} />
    </>
  );
}

function PlanlamaSayaclari() {
  const { t } = useDil();
  const v = useVeri();
  const B = bugun();
  const yarinPlan = v.planlar.find((p) => p.tarih === gunEkle(B, 1));
  const bugunPlan = v.planlar.find((p) => p.tarih === B);
  const planliPaketler = v.paketler.filter((p) => (p.planId === yarinPlan?.id || p.planId === bugunPlan?.id) && p.durum !== "iptal");
  const yediGun = new Date(Date.now() - 7 * 864e5).toISOString();
  return (
    <div className="sayaclar">
      <Sayac
        href="#/oneriler"
        ikon={<Lightbulb size={22} />}
        renk="renk-nextday"
        etiket={t("sYeniOneri")}
        deger={v.oneriler.filter((o) => o.durum === "yeni").length}
        alt={t("sBugunGelen", { n: v.oneriler.filter((o) => yerelGun(o.zaman) === B).length })}
      />
      <Sayac href="#/paketler" ikon={<Package size={22} />} renk="renk-haftalik" etiket={t("sPlanlanan")} deger={planliPaketler.length} alt={t("sBugunYarin")} />
      <Sayac
        href="#/oneriler"
        ikon={<Clock size={22} />}
        ton="uyari"
        etiket={t("sOnayBekleyen")}
        deger={v.paketler.filter((p) => p.durum === "taslak" || p.durum === "degerlendiriliyor").length + v.oneriler.filter((o) => o.durum === "degerlendiriliyor").length}
        alt={t("sAksamToplantisi")}
      />
      <Sayac href="#/uretim" ikon={<CirclePlay size={22} />} renk="renk-nextday" etiket={t("sDevamEden")} deger={v.paketler.filter((p) => p.durum === "uretimde").length} alt={t("sUretimde")} />
      <Sayac
        href="#/paketler"
        ikon={<CheckCircle size={22} />}
        ton="iyi"
        etiket={t("sTamamlanan")}
        deger={v.paketler.filter((p) => p.durum === "tamamlandi" && p.guncelleme > yediGun).length}
        alt={t("sSonYediGun")}
      />
      <Sayac href="#/uretim" ikon={<AlertTriangle size={22} />} ton="kotu" etiket={t("sGeciken")} deger={v.paketler.filter((p) => geciktiMi(p)).length} alt={t("sTeslimGecti")} />
    </div>
  );
}

/* Planlama'nın çalışma alanları; Next Day'i görebilen her masa ekleyebilir. */
const veriyle = (Bilesen: (p: { d: Durum }) => ReactNode) => () => <Bilesen d={useVeri()} />;
export const PLANLAMA_ALANLARI: Alan[] = [
  { id: "plKisayol", ad: "alPlanKisayollari", genis: true, grup: "planlama", sayfa: "nextday", Bilesen: () => <PlanKisayollari /> },
  { id: "plSayac", ad: "alOzetSayilar", genis: true, grup: "planlama", sayfa: "nextday", Bilesen: () => <PlanlamaSayaclari /> },
  { id: "plHafta", ad: "buHaftaninPlani", genis: true, grup: "planlama", sayfa: "haftalik", Bilesen: veriyle(HaftaKarti) },
  { id: "plTakvim", ad: "bugununTakvimi", grup: "planlama", sayfa: "nextday", Bilesen: veriyle(BugununTakvimi) },
  { id: "plToplanti", ad: "yaklasanToplantilar", grup: "planlama", sayfa: "nextday", Bilesen: veriyle(YaklasanToplantilar) },
  { id: "plFaaliyet", ad: "yaklasanFaaliyetler", grup: "planlama", sayfa: "takvim", Bilesen: ({ ben }) => <YaklasanFaaliyetlerAlani ben={ben} /> },
  { id: "plSonOneri", ad: "sonOneriler", genis: true, grup: "planlama", sayfa: "oneriler", Bilesen: () => <SonOneriler /> },
  { id: "plPlanlar", ad: "devamEdenPlanlar", grup: "planlama", sayfa: "nextday", Bilesen: veriyle(DevamEdenPlanlar) },
  { id: "plHareket", ad: "sonHareketler", grup: "planlama", sayfa: "nextday", Bilesen: () => <SonHareketler /> },
  { id: "plMuhabirler", ad: "muhabirlerinDurumu", grup: "planlama", sayfa: "muhabirler", Bilesen: veriyle(MuhabirDurumu) },
  { id: "plKoordinasyon", ad: "koordinasyon", grup: "planlama", sayfa: "nextday", Bilesen: veriyle(Koordinasyon) },
  { id: "plDosyalar", ad: "onemliDosyalar", grup: "planlama", sayfa: "nextday", Bilesen: veriyle(OnemliDosyalar) },
];

function SonOneriler() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("sonOneriler")} ikon={<ListChecks size={18} />} sagUc={<Tumu href="#/oneriler" />}>
      <OneriTablosu oneriler={[...v.oneriler].sort((a, b) => b.zaman.localeCompare(a.zaman)).slice(0, 6)} d={v} kisa />
    </Kart>
  );
}

function SonHareketler() {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("sonHareketler")} ikon={<History size={18} />}>
      <HareketAkisi hareketler={v.hareketler.slice(0, 7)} d={v} />
    </Kart>
  );
}

/* --- Kartlar --- */

/** Perşembe toplantısında hazırlanan haftanın şeridi (Cumartesi–Cuma). */
export function HaftaKarti({ d }: { d: Durum }) {
  const { t, dil } = useDil();
  const bas = planlananHafta(bugun());
  const gunler = Array.from({ length: 7 }, (_, i) => gunEkle(bas, i));
  const plan = d.haftalik.find((h) => h.baslangic === bas);
  const ozelGunler = new Set(d.ozel.map((o) => o.tarih));
  return (
    <Kart
      baslik={t("buHaftaninPlani")}
      ikon={<CalendarRange size={18} />}
      ek={`(${tarihYaz(gunler[0], dil, "kisa")} – ${tarihYaz(gunler[6], dil, "kisa")})`}
      sagUc={<Tumu href={plan ? `#/haftalik/${plan.id}` : "#/haftalik"} metin={t("planiGor")} />}
    >
      <div className="hafta">
        {gunler.map((g) => {
          const kalemler = plan?.kalemler.filter((k) => k.tarih === g && gundemde(k)) ?? [];
          return (
            <div key={g} className={`gun ${ozelGunler.has(g) ? "ozel-gun" : ""}`}>
              <div className="gun-bas">
                <b>{tarihYaz(g, dil, "kisa")}</b>
                <small>{gunAdi(g, dil)}</small>
              </div>
              <div className="gun-say">{kalemler.length}</div>
              <ul>
                {kalemler.map((k) => (
                  <li key={k.id} className={`tur-${k.tur}`} title={kalemAdi(k)}>
                    <i className="nokta" />
                    <span>
                      <Icerik>{k.yer || kalemAdi(k)}</Icerik>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="hafta-evre">
        {(["haber", "feature", "ekonomi", "program"] as const).map((tur) => (
          <span key={tur} className={`tur-${tur}`}>
            <i className="nokta" /> {t(`tur${tur[0].toUpperCase()}${tur.slice(1)}` as Anahtar)}
          </span>
        ))}
      </div>
    </Kart>
  );
}

export function BugununTakvimi({ d }: { d: Durum }) {
  const { t, dil } = useDil();
  const B = bugun();
  const bugunku = d.toplantilar
    .filter((x) => yerelGun(x.zaman) === B)
    .sort((a, b) => a.zaman.localeCompare(b.zaman));
  const an = new Date().toISOString();
  return (
    <Kart baslik={t("bugununTakvimi")} ikon={<CalendarCheck size={18} />} sagUc={<Tumu href="#/nextday" />}>
      {bugunku.length === 0 ? (
        <Bos kucuk metin={t("bugunToplantiYok")} />
      ) : (
        <ol className="cizelge">
          {bugunku.map((x) => (
            <li key={x.id}>
              <time dateTime={x.zaman}>{saatYaz(x.zaman, dil)}</time>
              <span className="cizgi-kol">
                <i className={x.zaman < an ? "gecti" : ""} />
              </span>
              <div className={`olay ${x.onemli ? "onemli" : ""}`}>
                <b>
                  <Icerik blok>{x.ad}</Icerik>
                </b>
                <small>
                  <Icerik blok>{x.aciklama}</Icerik>
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Kart>
  );
}

export function YaklasanToplantilar({ d }: { d: Durum }) {
  const { t, dil } = useDil();
  const an = new Date().toISOString();
  const B = bugun();
  const yaklasan = d.toplantilar.filter((x) => x.zaman > an).sort((a, b) => a.zaman.localeCompare(b.zaman)).slice(0, 4);
  const gunEtiketi = (z: string) => {
    const iso = yerelGun(z);
    if (iso === B) return t("bugun");
    if (iso === gunEkle(B, 1)) return t("yarin");
    return tarihYaz(iso, dil, "kisa");
  };
  return (
    <Kart baslik={t("yaklasanToplantilar")} ikon={<CalendarDays size={18} />} sagUc={<Tumu href="#/nextday" />}>
      {yaklasan.length === 0 ? (
        <Bos kucuk metin={t("toplantiYok")} />
      ) : (
        <ul className="liste liste-kutu">
          {yaklasan.map((x) => (
            <li key={x.id} className={x.onemli ? "onemli" : ""}>
              <span className="tarih-ikon">
                <CalendarDays size={18} />
              </span>
              <div className="ad">
                <small>
                  {gunEtiketi(x.zaman)} {saatYaz(x.zaman, dil)}
                </small>
                <b>
                  <Icerik blok>{x.ad}</Icerik>
                </b>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

function DevamEdenPlanlar({ d }: { d: Durum }) {
  const { t, dil } = useDil();
  const bugunPlan = d.planlar.find((p) => p.tarih === bugun());
  const yarinPlan = d.planlar.find((p) => p.tarih === gunEkle(bugun(), 1));
  const bas = planlananHafta(bugun());
  const hafta = d.haftalik.find((h) => h.baslangic === bas);
  const ay = d.aylik[0];
  const bugunPaketleri = d.paketler.filter((p) => p.planId === bugunPlan?.id && p.durum !== "iptal");
  const oran = (a: number, b: number) => (b ? a / b : 0);
  const satirlar: { ad: string; icerik?: boolean; alt: string; oran: number; renk: string; href: string; rozet?: { ad: Anahtar; ton: string } }[] = [];
  if (yarinPlan)
    satirlar.push({
      ad: t("nextday"),
      alt: tarihYaz(yarinPlan.tarih, dil, "kisa"),
      oran: (["taslak", "toplantida", "onayli", "devralindi"].indexOf(yarinPlan.durum) + 1) / 4,
      renk: "renk-nextday",
      href: `#/nextday/${yarinPlan.id}`,
      rozet: { ad: PLAN_DURUM_ADI[yarinPlan.durum], ton: PLAN_DURUM_TONU[yarinPlan.durum] },
    });
  if (bugunPlan)
    satirlar.push({
      ad: t("bugununUretimi"),
      alt: tarihYaz(bugunPlan.tarih, dil, "kisa"),
      oran: oran(bugunPaketleri.filter((p) => p.durum === "tamamlandi").length, bugunPaketleri.length),
      renk: "renk-nextday",
      href: `#/nextday/${bugunPlan.id}`,
    });
  if (hafta)
    satirlar.push({
      ad: t("haftalik"),
      alt: `${tarihYaz(hafta.baslangic, dil, "kisa")} – ${tarihYaz(gunEkle(hafta.baslangic, 6), dil, "kisa")}`,
      oran: oran(hafta.kalemler.filter((k) => k.karar !== "bekliyor").length, hafta.kalemler.length),
      renk: "renk-haftalik",
      href: `#/haftalik/${hafta.id}`,
      rozet: { ad: HAFTA_DURUM_ADI[hafta.durum], ton: HAFTA_DURUM_TONU[hafta.durum] },
    });
  if (ay)
    satirlar.push({
      ad: t("aylik"),
      alt: tarihYaz(ay.ay + "-01", dil, "ay"),
      oran: oran(ay.kalemler.filter((k) => k.onayli).length, ay.kalemler.length),
      renk: "renk-aylik",
      href: "#/aylik",
    });
  for (const o of d.ozel)
    satirlar.push({
      ad: o.ad,
      icerik: true,
      alt: tarihYaz(o.tarih, dil, "kisa"),
      oran: oran(o.hazirlik.filter((h) => h.tamam).length, o.hazirlik.length),
      renk: "renk-ozel",
      href: "#/ozel",
    });
  return (
    <Kart baslik={t("devamEdenPlanlar")} ikon={<FileText size={18} />}>
      <ul className="liste">
        {satirlar.map((s) => (
          <li key={s.ad + s.alt}>
            <div className="ad">
              <a href={s.href}>{s.icerik ? <Icerik blok>{s.ad}</Icerik> : s.ad}</a>
              <small>
                {s.alt} {s.rozet && <Rozet ton={s.rozet.ton}>{t(s.rozet.ad)}</Rozet>}
              </small>
            </div>
            <div className={`ilerleme-kutu ${s.renk}`}>
              <Ilerleme oran={s.oran} />
            </div>
          </li>
        ))}
      </ul>
    </Kart>
  );
}

function MuhabirDurumu({ d }: { d: Durum }) {
  const { t, ad } = useDil();
  const sira = { sahada: 0, yolda: 1, gorevde: 2, izinli: 3 } as const;
  const liste = [...muhabirler(d)].sort((a, b) => sira[a.durum] - sira[b.durum]);
  const gosterilen = liste.slice(0, 8);
  return (
    <Kart baslik={t("muhabirlerinDurumu")} ikon={<Users size={18} />} sagUc={<Tumu href="#/muhabirler" />}>
      <div className="avatarlar">
        {gosterilen.map((k) => (
          <a key={k.id} href={`#/muhabirler/${k.id}`} title={ad(k)}>
            <Avatar kisi={k} boy="buyuk" durum />
            <b>{ad(k).split(" ")[0]}</b>
            <small>{t(sehirAdi(k.sehir))}</small>
          </a>
        ))}
        {liste.length > gosterilen.length && (
          <a href="#/muhabirler">
            <span className="avatar buyuk avatar-fazla">+{liste.length - gosterilen.length}</span>
            <b>{t("diger")}</b>
          </a>
        )}
      </div>
    </Kart>
  );
}

/**
 * Koordinasyon gerektiren işler: başka bir birimin hareket etmesini
 * bekleyen kayıtlar. Liste kendiliğinden çıkıyor, ayrıca tutulmuyor.
 */
function Koordinasyon({ d }: { d: Durum }) {
  const { t } = useDil();
  /* Etiket arayüzün, konu içeriğin: konu arayüz cümlesinde de sağdan sola aksın diye ayrı. */
  const satirlar: { id: string; metin: string; konu?: string; birim: string; href: string; ton: string }[] = [];
  for (const p of d.paketler.filter((x) => geciktiMi(x))) {
    const s = paketSahibi(p);
    satirlar.push({ id: p.id, metin: t("kGeciken"), konu: p.baslik, birim: s ? t(BIRIM_ADI[s]) : "", href: `#/paketler/${p.id}`, ton: "kotu" });
  }
  for (const p of d.paketler.filter((x) => (x.durum === "degerlendiriliyor" || x.durum === "taslak") && x.sahaGerekli)) {
    satirlar.push({ id: p.id + "s", metin: t("kSaha"), konu: p.baslik, birim: t("biNewsgathering"), href: `#/paketler/${p.id}`, ton: "uyari" });
  }
  for (const g of d.gorevlendirmeler.filter((x) => x.durum === "talep")) {
    const k = d.kisiler.find((x) => x.id === g.kisiId);
    satirlar.push({ id: g.id, metin: t("kTalep"), konu: satir(g.yer, kisiAr(k)), birim: t("biNewsgathering"), href: "#/talepler", ton: "uyari" });
  }
  for (const p of d.planlar.filter((x) => x.durum === "onayli")) {
    satirlar.push({ id: p.id, metin: t("kDevirBekliyor"), birim: t("biNewsdesk"), href: `#/nextday/${p.id}`, ton: "vurgu" });
  }
  return (
    <Kart baslik={t("koordinasyon")} ikon={<Network size={18} />}>
      {satirlar.length === 0 ? (
        <Bos kucuk metin={t("koordinasyonYok")} />
      ) : (
        <ul className="liste">
          {satirlar.slice(0, 7).map((s) => (
            <li key={s.id}>
              <div className="ad">
                <a href={s.href}>
                  {s.metin}
                  {s.konu && (
                    <>
                      : <Icerik>{s.konu}</Icerik>
                    </>
                  )}
                </a>
              </div>
              <Rozet ton={s.ton}>{s.birim}</Rozet>
            </li>
          ))}
        </ul>
      )}
    </Kart>
  );
}

function OnemliDosyalar({ d }: { d: Durum }) {
  const { t, dil } = useDil();
  return (
    <Kart baslik={t("onemliDosyalar")} ikon={<FolderOpen size={18} />}>
      <ul className="liste">
        {d.dosyalar.map((f) => (
          <li key={f.id}>
            {f.tur === "xlsx" ? <FileSpreadsheet size={18} className="sonuk-yazi" /> : <FileText size={18} className="sonuk-yazi" />}
            <div className="ad">
              <b>
                <Icerik blok>{f.ad}</Icerik>
              </b>
              <small>
                {f.tur.toUpperCase()} · {t("guncellendi")} {tarihYaz(f.guncelleme, dil, "kisa")}
              </small>
            </div>
          </li>
        ))}
      </ul>
      <p className="bos-kucuk">{t("dosyaDeposuSonra")}</p>
    </Kart>
  );
}
