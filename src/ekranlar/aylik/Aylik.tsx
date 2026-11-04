import { Calendar, CalendarCheck, Check, ChevronLeft, ChevronRight, ClipboardCopy, FileDown, Plus, Printer, Trash2, Undo2 } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { Bos, Icerik, Kart, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { wordIndir } from "../../bilesenler/indir";
import { aralikYaz, metin, tarihYaz, useDil, type Anahtar } from "../../dil";
import { ETIKET_KODU, SATIR_KODU, gorevler, kapsamOzeti, olaylar, olaySonu } from "../../aylik";
import { kisiAr } from "../../etiketler";
import { aylikDurum, aylikDuzenler, aylikOlayKaydet, aylikOlaySil, type AylikOlayGirdisi } from "../../eylemler";
import { ayEkle, aySonu, bugun, gunEkle } from "../../tarih";
import { AYLIK_EKIP_GOREVLERI, AYLIK_ETIKETLERI, AYLIK_SATIR_TURLERI, kisiBul, useVeri, type AylikEkip, type AylikGun, type AylikOlay, type AylikPlan, type Durum, type Kisi } from "../../veri";
import { planAdimiYapabilir } from "../../yetki";
import { AdimYetkilileri } from "../organizasyon/PlanYetkileri";
import { TakvimdenListe } from "../takvim/Planlarda";
import { SayfaBasi } from "../ana/Planlama";

/*
 * Aylık plan kurumun "الخطة الشهرية المتوقعة" şablonunun hiyerarşisiyle:
 * ay planı → bölüm (ana kapsamlar, öne çıkan olaylar ve etkinlikler,
 * görevlendirmeler) → olay → kapsam günü → satır. Ana kapsam ayrı kayıt
 * değil, işaretli olay: 1. bölümde özetiyle, 2. bölümde ayrıntısıyla.
 * Görevlendirme tablosu olaylardan türer. Plan görünümü çalışma ekranı,
 * çıktı şablonun kağıdı. Kesin plan ama bağlayıcı değil: olaylar Weekly'de
 * yeniden değerlendirilir (aylik.ts → haftayaDusenler), Next Day'le bağı yok.
 */
type Form = { olay?: AylikOlay; yeni?: Partial<AylikOlayGirdisi> };

export function Aylik({ ben, planId }: { ben: Kisi; planId?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const buAy = bugun().slice(0, 7);
  const [ay, setAy] = useState(() => v.aylik.find((a) => a.id === planId)?.ay ?? buAy);
  const [gorunum, setGorunum] = useState<"plan" | "cikti">("plan");
  const [form, setForm] = useState<Form | null>(null);
  const belge = useRef<HTMLElement>(null);
  const plan = v.aylik.find((a) => a.ay === ay);
  const bas = ay + "-01";
  const duzenler = aylikDuzenler(ben) && plan?.durum !== "onayli";
  const onaylar = planAdimiYapabilir(ben, "ayOnay");
  const kaydir = (n: number) => setAy(ayEkle(bas, n).slice(0, 7));
  const ol = olaylar(plan);
  const ana = ol.filter((o) => o.anaKapsam);
  const gorev = gorevler(plan);
  const ac = duzenler ? (o: AylikOlay) => setForm({ olay: o }) : undefined;
  const ekle = (yeni: Partial<AylikOlayGirdisi>) => setForm({ yeni });

  return (
    <>
      <SayfaBasi ikon={<Calendar size={26} />} baslik={t("aylik")} />
      <section className="kart ay-ust">
        <div className="ay-ust-satir">
          <div className="tk-donem">
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kaydir(-1)} aria-label={t("oncekiAy")} title={t("oncekiAy")}>
              <ChevronLeft size={18} className="yon" />
            </button>
            <b aria-live="polite">{tarihYaz(bas, dil, "ay")}</b>
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => kaydir(1)} aria-label={t("sonrakiAy")} title={t("sonrakiAy")}>
              <ChevronRight size={18} className="yon" />
            </button>
            {plan && <Rozet ton={plan.durum === "onayli" ? "iyi" : "uyari"}>{t(plan.durum === "onayli" ? "ayOnayli" : "hazirlaniyor")}</Rozet>}
          </div>
          <div className="secim-grubu" role="tablist">
            {(["plan", "cikti"] as const).map((g) => (
              <button key={g} type="button" role="tab" aria-selected={gorunum === g} data-ay-gorunum={g} className={`dugme dugme-kucuk ${gorunum === g ? "" : "dugme-ikincil"}`} onClick={() => setGorunum(g)}>
                {t(g === "plan" ? "ayPlanGorunum" : "ayCiktiGorunum")}
              </button>
            ))}
          </div>
        </div>
        <div className="dugmeler ara-ust-2">
          {plan && plan.durum === "hazirlik" && onaylar && ol.length > 0 && (
            <button className="dugme dugme-iyi" data-ay-onayla onClick={() => confirm(t("ayOnayOnay")) && aylikDurum(ben, plan.id, "onayli") && bildir(t("bAyOnaylandi"))}>
              <Check size={16} /> {t("ayOnayla")}
            </button>
          )}
          {plan && plan.durum === "onayli" && onaylar && (
            <button className="dugme dugme-ikincil" data-ay-geri-al onClick={() => aylikDurum(ben, plan.id, "hazirlik") && bildir(t("bAyHazirliga"))}>
              <Undo2 size={16} /> {t("hazirligaGeriAl")}
            </button>
          )}
          {gorunum === "cikti" && ol.length > 0 && <BelgeAraclari belge={belge} ay={ay} />}
        </div>
        {plan?.durum === "hazirlik" && !onaylar && ol.length > 0 && (
          <p className="bos-kucuk ara-ust">
            {t("ayOnayYetkili")} <AdimYetkilileri adim="ayOnay" />
          </p>
        )}
      </section>

      {gorunum === "cikti" ? (
        ol.length ? (
          <div className="cikti-sarici ara-ust-2">
            <AylikBelgesi plan={plan!} d={v} belgeRef={belge} />
          </div>
        ) : (
          <Bos metin={t("ayBos")} ikon={<Calendar size={28} />} />
        )
      ) : (
        <>
          <AyBolumu no={1} baslik={t("ayAnaKapsamlar")} sayi={ana.length} ekle={duzenler && <EkleDugme metin={t("ayAnaKapsamEkle")} veri="ana" tikla={() => ekle({ anaKapsam: true })} />}>
            {ana.map((o) => (
              <OlaySatiri key={o.id} o={o} d={v} ac={ac} ozet />
            ))}
          </AyBolumu>
          <AyBolumu
            no={2}
            baslik={t("ayOneCikanlar")}
            sayi={ol.length}
            ekle={
              duzenler && (
                <>
                  <EkleDugme metin={t("ayOlayEkle")} veri="olay" tikla={() => ekle({})} birincil />
                  <EkleDugme metin={t("ayUlusGunEkle")} veri="gun" tikla={() => ekle({ tur: "gun" })} />
                </>
              )
            }
          >
            {gunGruplari(ol).map(([gun, l]) => (
              <div key={gun} className="ay-gun-grubu">
                <h3 className="ay-gun-baslik">{tarihYaz(gun, dil, "tam")}</h3>
                {l.map((o) => (
                  <OlaySatiri key={o.id} o={o} d={v} ac={ac} />
                ))}
              </div>
            ))}
          </AyBolumu>
          <AyBolumu no={3} baslik={t("ayGorevler")} sayi={gorev.length}>
            {gorev.map((o) => (
              <OlaySatiri key={o.id} o={o} d={v} ac={ac} gorev />
            ))}
          </AyBolumu>
          <Kart baslik={t("takvimdenAy")} ikon={<CalendarCheck size={18} />} className="ara-ust-2">
            <TakvimdenListe ben={ben} bas={bas} bit={aySonu(bas)} tur="aylik" planId={plan?.id} ekleyebilir={aylikDuzenler(ben)} eklemeMetni={t("planaEkle")} />
          </Kart>
        </>
      )}

      {form && <OlayDuzenle ben={ben} ay={ay} olay={form.olay} yeni={form.yeni} kapat={() => setForm(null)} />}
    </>
  );
}

/** Olaylar başladıkları güne göre; şablonun 2. bölümü tarih sırasıyla. */
const gunGruplari = (l: AylikOlay[]): [string, AylikOlay[]][] => {
  const m = new Map<string, AylikOlay[]>();
  for (const o of l) m.set(o.tarih, [...(m.get(o.tarih) ?? []), o]);
  return [...m];
};

function AyBolumu({ no, baslik, sayi, ekle, children }: { no: number; baslik: string; sayi: number; ekle?: ReactNode; children: ReactNode }) {
  const { t } = useDil();
  return (
    <section className="kart ay-bolum ara-ust-2" data-ay-bolum={no}>
      <header className="ay-bolum-ust">
        <span className="ay-bolum-no">{no}</span>
        <h2>{baslik}</h2>
        <span className="sayi-hap">{sayi}</span>
        <span className="bosluk-esnek" />
        {ekle}
      </header>
      {sayi ? <div className="ay-satirlar">{children}</div> : <p className="bos-kucuk">{t("ayBolumBos")}</p>}
    </section>
  );
}

function EkleDugme({ metin: m, veri, tikla, birincil = false }: { metin: string; veri: string; tikla: () => void; birincil?: boolean }) {
  return (
    <button type="button" className={`dugme dugme-kucuk ${birincil ? "" : "dugme-ikincil"}`} data-ay-ekle={veri} onClick={tikla}>
      <Plus size={14} /> {m}
    </button>
  );
}

/*
 * Bölüm satırı: yer / olay, gün, kategori kodları, kapsam ve ekip özeti.
 * Ana kapsamda kapsam cümlesi, görevlendirmede gidiş-dönüş öne çıkar.
 */
function OlaySatiri({ o, d, ac, ozet = false, gorev = false }: { o: AylikOlay; d: Durum; ac?: (o: AylikOlay) => void; ozet?: boolean; gorev?: boolean }) {
  const { t, dil, ad } = useDil();
  const gunSayisi = o.gunler.filter((g) => g.satirlar.length).length;
  const ekip = o.ekip.map((e) => (e.tbc ? "TBC" : e.ad || ad(kisiBul(d, e.kisiId ?? "")) || "TBC"));
  const ic = (
    <>
      <div className="ay-satir-ust">
        <span className="ay-tarih">{olaySonu(o) > o.tarih ? aralikYaz(o.tarih, olaySonu(o), dil) : tarihYaz(o.tarih, dil)}</span>
        {o.tur === "gun" && <Rozet>{t("ayUlusGun")}</Rozet>}
        {o.etiketler.map((e) => (
          <span key={e} className="ay-kod" dir="ltr">
            {ETIKET_KODU[e]}
          </span>
        ))}
      </div>
      <b>
        <Icerik blok>{[o.yer, o.baslik].filter(Boolean).join(" / ")}</Icerik>
      </b>
      {ozet && (o.anaOzet || kapsamOzeti(o)) && <Icerik blok>{[o.anaOzet, kapsamOzeti(o) && `( ${kapsamOzeti(o)} )`].filter(Boolean).join(" ")}</Icerik>}
      {(gunSayisi > 0 || ekip.length > 0 || (gorev && o.gorev)) && (
        <small className="sonuk-yazi ay-satir-alt">
          {gunSayisi > 0 && <span>{t("ayGunSayisi", { n: gunSayisi })}</span>}
          {ekip.length > 0 && <Icerik>{ekip.join("، ")}</Icerik>}
          {gorev && o.gorev && <span>{[o.gorev.gidis && tarihYaz(o.gorev.gidis, dil), o.gorev.donus && tarihYaz(o.gorev.donus, dil)].filter(Boolean).join(" → ")}</span>}
        </small>
      )}
    </>
  );
  return ac ? (
    <button type="button" className="ay-satir tiklanir" data-ay-olay={o.id} onClick={() => ac(o)}>
      {ic}
    </button>
  ) : (
    <div className="ay-satir" data-ay-olay={o.id}>
      {ic}
    </div>
  );
}

function BelgeAraclari({ belge, ay }: { belge: RefObject<HTMLElement | null>; ay: string }) {
  const { t } = useDil();
  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(belge.current?.innerText ?? "");
      bildir(t("bKopyalandi"));
    } catch {
      bildir(t("kopyalanamadi"));
    }
  };
  return (
    <>
      <span className="bosluk-esnek" />
      <button className="dugme dugme-ikincil" onClick={kopyala}>
        <ClipboardCopy size={16} /> {t("metniKopyala")}
      </button>
      <button className="dugme dugme-ikincil" onClick={() => wordIndir(`aylik-plan-${ay}.doc`, ayBasligi(ay), belge.current?.innerHTML ?? "")}>
        <FileDown size={16} /> {t("wordIndir")}
      </button>
      <button className="dugme dugme-ikincil" onClick={() => window.print()}>
        <Printer size={16} /> {t("rpYazdir")}
      </button>
    </>
  );
}

const ayAdiAr = (ay: string) => tarihYaz(ay + "-01", "ar", "ay");
const ayBasligi = (ay: string) => `${metin("ayCiktiBaslik", "ar")} ${ayAdiAr(ay)}`;
const gunYaz = (bas: string, bit?: string) => (bit && bit > bas ? aralikYaz(bas, bit, "ar") : tarihYaz(bas, "ar", "uzun"));
const ekipAdi = (d: Durum, e: AylikEkip) => (e.tbc ? "TBC" : e.ad || kisiAr(kisiBul(d, e.kisiId ?? "")) || "TBC");
const ekipEtiketi = (e: AylikEkip) => metin(`ayEkip_${e.gorev}` as Anahtar, "ar");
const AYRAC = "—----------------";

/*
 * Çıktı şablonun kağıdı, her arayüz dilinde Arapça: başlık; 1. ana kapsamlar
 * (gri bantta "yer / gün / olay", planlanan kapsam cümlesi); 2. öne çıkan
 * olaylar (gri bantta "yer / olay" ve kırmızı kategori kodu, sarı tarih
 * kutusu, açıklama, ** önemi, önerilen kapsam: süre ve gün gün satırlar,
 * ekip, bağlantı, not); 3. görevlendirme tablosu.
 */
function AylikBelgesi({ plan, d, belgeRef }: { plan: AylikPlan; d: Durum; belgeRef: RefObject<HTMLElement | null> }) {
  const ol = olaylar(plan);
  const ana = ol.filter((o) => o.anaKapsam);
  const gorev = gorevler(plan);
  const kodlar = (o: AylikOlay) =>
    o.etiketler.length > 0 && (
      <>
        {" "}
        <span className="ay-kirmizi" dir="ltr">
          {o.etiketler.map((e) => ETIKET_KODU[e]).join(" / ")}
        </span>
      </>
    );
  return (
    <article ref={belgeRef} className="cikti ay-belge" dir="rtl" lang="ar">
      <h1>{ayBasligi(plan.ay)}</h1>
      {ana.length > 0 && (
        <section>
          <h2>**{metin("ayCiktiAna", "ar").replace("{ay}", ayAdiAr(plan.ay))}</h2>
          {ana.map((o) => (
            <div key={o.id} className="ay-kayit">
              <p className="ay-bant">
                -{[o.yer, gunYaz(o.tarih, o.bitis), o.baslik].filter(Boolean).join(" / ")}
              </p>
              {o.anaOzet && <p>**{o.anaOzet}</p>}
              {kapsamOzeti(o) && <p>{metin("ayKapsamCumlesi", "ar").replace("{tur}", kapsamOzeti(o))}</p>}
              <p className="ay-ayrac">{AYRAC}</p>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>**{metin("ayCiktiOlaylar", "ar").replace("{ay}", ayAdiAr(plan.ay))} :</h2>
        {ol.map((o) => {
          const kapsam = o.gunler.filter((g) => g.satirlar.length);
          return (
            <div key={o.id} className="ay-kayit" data-ay-belge-olay={o.id}>
              <p className="ay-bant">
                -{o.tur === "gun" && `${metin("ayUlusGun", "ar")} / `}
                {[o.yer, o.baslik].filter(Boolean).join(" / ")}
                {kodlar(o)}
              </p>
              <p>
                <span className="ay-sari">{gunYaz(o.tarih, o.bitis)}</span>
              </p>
              {o.aciklama && <p>{o.aciklama}</p>}
              {o.onem && <p>** {o.onem}</p>}
              {kapsam.length > 0 && (
                <>
                  <p>
                    <b className="ay-alti-cizili">{metin("ayKapsamBolum", "ar")}:</b>
                  </p>
                  {(o.kapsamBas || o.kapsamBit) && (
                    <p>
                      <b>{metin("ayKapsamSuresi", "ar")}:</b> {gunYaz(o.kapsamBas ?? o.tarih, o.kapsamBit)}
                    </p>
                  )}
                  {kapsam.map((g) => (
                    <div key={g.tarih}>
                      <p>
                        <span className="ay-sari">{tarihYaz(g.tarih, "ar", "kisa")}</span>
                      </p>
                      {g.satirlar.map((s) => (
                        <p key={s.id}>
                          <b dir="ltr">{[SATIR_KODU[s.tur], s.tbc && "TBC"].filter(Boolean).join(" ")}</b>
                          {SATIR_KODU[s.tur] || s.tbc ? " / " : ""}
                          {s.metin}
                        </p>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {o.ekip.length > 0 && (
                <>
                  <p>
                    <b className="ay-alti-cizili">{metin("ayEkipBolum", "ar")}:</b>
                  </p>
                  {o.ekip.map((e, i) => (
                    <p key={i}>
                      {ekipEtiketi(e)} : {ekipAdi(d, e)}
                    </p>
                  ))}
                </>
              )}
              {o.baglanti && (
                <p>
                  {metin("ayBaglanti", "ar")} : <span dir="ltr">{o.baglanti}</span>
                </p>
              )}
              {o.not && (
                <p>
                  <b>{metin("ayNotBolum", "ar")} //</b> {o.not}
                </p>
              )}
              <p className="ay-ayrac">{AYRAC}</p>
            </div>
          );
        })}
      </section>
      {gorev.length > 0 && (
        <section>
          <table className="ay-tablo">
            <thead>
              <tr>
                <th colSpan={3}>
                  **{metin("ayCiktiGorevler", "ar").replace("{ay}", ayAdiAr(plan.ay))}
                </th>
              </tr>
              <tr>
                <th>{metin("ayTabloKapsam", "ar")}</th>
                <th>{metin("ayTabloUlke", "ar")}</th>
                <th>{metin("ayTabloTarih", "ar")}</th>
              </tr>
            </thead>
            <tbody>
              {gorev.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.baslik}</b>
                    <br />
                    {gunYaz(o.kapsamBas ?? o.tarih, o.kapsamBit ?? o.bitis)}
                    {o.ekip.map((e, i) => (
                      <span key={i}>
                        <br />
                        {ekipEtiketi(e)} : {ekipAdi(d, e)}
                      </span>
                    ))}
                  </td>
                  <td>{o.yer}</td>
                  <td>
                    {o.gorev?.gidis && `${metin("ayGidis", "ar")} : ${tarihYaz(o.gorev.gidis, "ar", "kisa")}`}
                    {o.gorev?.donus && (
                      <>
                        <br />
                        {`${metin("ayDonus", "ar")} : ${tarihYaz(o.gorev.donus, "ar", "kisa")}`}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </article>
  );
}

const yeniId = () => Math.random().toString(36).slice(2, 10);

/** Kapsam günleri: kapsam süresi (yoksa olayın günleri), en çok 31; var olan satırlar korunur. */
const gunleriKur = (f: Pick<AylikOlayGirdisi, "tarih" | "bitis" | "kapsamBas" | "kapsamBit" | "gunler">): AylikGun[] => {
  const bas = f.kapsamBas || f.tarih;
  if (!bas) return [];
  const bit = f.kapsamBit || f.bitis || f.tarih;
  const son = bit && bit > bas ? bit : bas;
  const l: AylikGun[] = [];
  for (let g = bas; g <= son && l.length < 31; g = gunEkle(g, 1)) l.push(f.gunler.find((x) => x.tarih === g) ?? { tarih: g, satirlar: [] });
  return l;
};

/** Şablondaki başlıkla bir düzenleme bölümü; boş isteğe bağlı bölüm "+ …" düğmesiyle açılır. */
function DuzenBolumu({ baslik, acik, ac, acMetni, children }: { baslik: string; acik: boolean; ac?: () => void; acMetni?: string; children: ReactNode }) {
  if (!acik && ac)
    return (
      <button type="button" className="dugme dugme-ikincil dugme-kucuk ay-bolum-ac" onClick={ac}>
        <Plus size={14} /> {acMetni ?? baslik}
      </button>
    );
  return (
    <fieldset className="ay-duzen-bolum">
      <legend>{baslik}</legend>
      {children}
    </fieldset>
  );
}

/*
 * Olayın tek düzenleme penceresi, şablonun başlıklarıyla alt alta: künye,
 * önemi, önerilen kapsam, ekip, görevlendirme, bağlantı ve not. Zorunlu
 * yalnız ad ve gün; isteğe bağlı bölümler boşken kapalı, küçük olay iki
 * satırda biter. Uluslararası günde yalnız künye, açıklama ve not.
 */
function OlayDuzenle({ ben, ay, olay, yeni, kapat }: { ben: Kisi; ay: string; olay?: AylikOlay; yeni?: Partial<AylikOlayGirdisi>; kapat: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [f, setF] = useState<AylikOlayGirdisi>(() => olay ?? { baslik: "", tarih: "", etiketler: [], gunler: [], ekip: [], ...yeni });
  const gunMu = f.tur === "gun";
  const [acik, setAcik] = useState(() => ({
    onem: !!(f.onem || f.anaKapsam),
    kapsam: f.gunler.some((g) => g.satirlar.length) || !!f.kapsamBas,
    ekip: f.ekip.length > 0,
    gorev: !!f.gorev,
    not: !!(f.not || f.baglanti),
  }));
  const gunler = gunleriKur(f);
  const gecerli = !!f.baslik.trim() && !!f.tarih;
  const kisiler = v.kisiler.filter((k) => !k.pasif).sort((a, b) => ad(a).localeCompare(ad(b)));
  const gunDegis = (tarih: string, satirlar: AylikGun["satirlar"]) => setF((x) => ({ ...x, gunler: gunleriKur(x).map((g) => (g.tarih === tarih ? { ...g, satirlar } : g)) }));
  const ekipDegis = (i: number, e: Partial<AylikEkip>) => setF((x) => ({ ...x, ekip: x.ekip.map((y, j) => (j === i ? { ...y, ...e } : y)) }));
  const kaydet = () => {
    if (aylikOlayKaydet(ben, { ...f, gunler: gunler.filter((g) => g.satirlar.length) })) {
      bildir(t("bAyOlayKaydedildi"));
      kapat();
    }
  };
  const sil = () => olay && confirm(t("ayOlaySilOnay")) && aylikOlaySil(ben, olay.id) && (bildir(t("bAyOlaySilindi")), kapat());

  return (
    <Pencere
      genis
      baslik={t(gunMu ? "ayUlusGunDuzenle" : olay ? "ayOlayDuzenle" : "ayOlayEkle")}
      kapat={kapat}
      altBilgi={
        <div className="form-alt ay-form-alt">
          {olay && (
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={sil} title={t("sil")} aria-label={t("sil")}>
              <Trash2 size={16} />
            </button>
          )}
          <span className="bosluk-esnek" />
          <button type="button" className="dugme dugme-ikincil" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme" data-ay-kaydet disabled={!gecerli} onClick={kaydet}>
            {t("kaydet")}
          </button>
        </div>
      }
    >
      <div className="form ay-duzen">
        <DuzenBolumu baslik={t("ayKunye")} acik>
          <label>
            {t("ayOlay")}
            <input {...icerikAlani} data-ay-baslik autoFocus value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} placeholder={gunMu ? "اليوم العالمي للقهوة" : "القمة العربية الطارئة"} />
          </label>
          <div className="satir">
            {!gunMu && (
              <label>
                {t("ayYer")}
                <input {...icerikAlani} value={f.yer ?? ""} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="مصر / القاهرة" />
              </label>
            )}
            <label>
              {t("ayBas")}
              <input type="date" data-ay-tarih value={f.tarih} min={ay + "-01"} onChange={(e) => setF({ ...f, tarih: e.target.value, bitis: f.bitis && f.bitis < e.target.value ? undefined : f.bitis })} />
            </label>
            {!gunMu && (
              <label>
                {t("ayBitis")}
                <input type="date" value={f.bitis ?? ""} min={f.tarih || undefined} onChange={(e) => setF({ ...f, bitis: e.target.value || undefined })} />
              </label>
            )}
          </div>
          <label>
            {t("ayAciklama")}
            <textarea {...icerikAlani} value={f.aciklama ?? ""} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
          </label>
          <div>
            <span className="alan-adi">{t("ayKategori")}</span>
            <div className="ay-etiketler">
              {AYLIK_ETIKETLERI.map((e) => (
                <label key={e} className="secim">
                  <input type="checkbox" checked={f.etiketler.includes(e)} onChange={(x) => setF({ ...f, etiketler: x.target.checked ? [...f.etiketler, e] : f.etiketler.filter((y) => y !== e) })} />
                  <span dir="ltr">{ETIKET_KODU[e]}</span>
                </label>
              ))}
            </div>
          </div>
        </DuzenBolumu>

        {!gunMu && (
          <>
            <DuzenBolumu baslik={t("ayOnemBolum")} acik={acik.onem} ac={() => setAcik({ ...acik, onem: true })}>
              <label>
                {t("ayOnem")}
                <textarea {...icerikAlani} data-ay-onem value={f.onem ?? ""} onChange={(e) => setF({ ...f, onem: e.target.value })} placeholder="وتكمن أهمية الحدث في…" />
              </label>
              <label className="secim">
                <input type="checkbox" data-ay-ana checked={!!f.anaKapsam} onChange={(e) => setF({ ...f, anaKapsam: e.target.checked || undefined })} />
                {t("ayAnaKapsam")}
              </label>
              {f.anaKapsam && (
                <label>
                  {t("ayAnaOzet")}
                  <input {...icerikAlani} value={f.anaOzet ?? ""} onChange={(e) => setF({ ...f, anaOzet: e.target.value })} placeholder="من المخطط أن تبدأ التغطية…" />
                </label>
              )}
            </DuzenBolumu>

            <DuzenBolumu baslik={t("ayKapsamBolum")} acik={acik.kapsam} ac={() => setAcik({ ...acik, kapsam: true })} acMetni={t("ayKapsamAc")}>
              <div className="satir">
                <label>
                  {t("ayKapsamSuresi")} · {t("ayBas")}
                  <input type="date" value={f.kapsamBas ?? ""} onChange={(e) => setF({ ...f, kapsamBas: e.target.value || undefined })} />
                </label>
                <label>
                  {t("ayKapsamSuresi")} · {t("ayBitis")}
                  <input type="date" value={f.kapsamBit ?? ""} min={f.kapsamBas || f.tarih || undefined} onChange={(e) => setF({ ...f, kapsamBit: e.target.value || undefined })} />
                </label>
              </div>
              {gunler.map((g) => (
                <div key={g.tarih} className="ay-gun" data-ay-gun={g.tarih}>
                  <b>{tarihYaz(g.tarih, dil, "tam")}</b>
                  {g.satirlar.map((s, i) => (
                    <div key={s.id} className="ay-kapsam-satiri">
                      <select value={s.tur} aria-label={t("ayKapsamBolum")} onChange={(e) => gunDegis(g.tarih, g.satirlar.map((x, j) => (j === i ? { ...x, tur: e.target.value as typeof s.tur } : x)))}>
                        {AYLIK_SATIR_TURLERI.map((tr) => (
                          <option key={tr} value={tr}>
                            {SATIR_KODU[tr] || t("ayDiger")}
                          </option>
                        ))}
                      </select>
                      <input {...icerikAlani} value={s.metin} aria-label={t("ayAciklama")} onChange={(e) => gunDegis(g.tarih, g.satirlar.map((x, j) => (j === i ? { ...x, metin: e.target.value } : x)))} />
                      <label className="secim">
                        <input type="checkbox" checked={!!s.tbc} onChange={(e) => gunDegis(g.tarih, g.satirlar.map((x, j) => (j === i ? { ...x, tbc: e.target.checked || undefined } : x)))} />
                        TBC
                      </label>
                      <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => gunDegis(g.tarih, g.satirlar.filter((_, j) => j !== i))} title={t("cikar")} aria-label={t("cikar")}>
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="dugme dugme-sade dugme-kucuk" data-ay-satir-ekle onClick={() => gunDegis(g.tarih, [...g.satirlar, { id: yeniId(), tur: g.satirlar.length ? "live" : "pkg", metin: "" }])}>
                    <Plus size={14} /> {t("aySatirEkle")}
                  </button>
                </div>
              ))}
            </DuzenBolumu>

            <DuzenBolumu
              baslik={t("ayEkipBolum")}
              acik={acik.ekip}
              ac={() => {
                setAcik({ ...acik, ekip: true });
                setF((x) => ({ ...x, ekip: x.ekip.length ? x.ekip : [{ gorev: "muhabir" }] }));
              }}
            >
              {f.ekip.map((e, i) => (
                <div key={i} className="ay-kapsam-satiri">
                  <select value={e.gorev} aria-label={t("ayGorev")} onChange={(x) => ekipDegis(i, { gorev: x.target.value as AylikEkip["gorev"] })}>
                    {AYLIK_EKIP_GOREVLERI.map((g) => (
                      <option key={g} value={g}>
                        {t(`ayEkip_${g}` as Anahtar)}
                      </option>
                    ))}
                  </select>
                  <select value={e.tbc ? "" : (e.kisiId ?? "")} aria-label={t("ayKisi")} disabled={e.tbc} onChange={(x) => ekipDegis(i, { kisiId: x.target.value || undefined })}>
                    <option value="">—</option>
                    {kisiler.map((k) => (
                      <option key={k.id} value={k.id}>
                        {ad(k)}
                      </option>
                    ))}
                  </select>
                  <label className="secim">
                    <input type="checkbox" data-ay-ekip-tbc checked={!!e.tbc} onChange={(x) => ekipDegis(i, { tbc: x.target.checked || undefined })} />
                    TBC
                  </label>
                  <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setF((x) => ({ ...x, ekip: x.ekip.filter((_, j) => j !== i) }))} title={t("cikar")} aria-label={t("cikar")}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="dugme dugme-sade dugme-kucuk" data-ay-ekip-ekle onClick={() => setF((x) => ({ ...x, ekip: [...x.ekip, { gorev: "muhabir" }] }))}>
                <Plus size={14} /> {t("ayEkipEkle")}
              </button>
            </DuzenBolumu>

            <DuzenBolumu
              baslik={t("ayGorev")}
              acik={acik.gorev}
              ac={() => {
                setAcik({ ...acik, gorev: true });
                setF((x) => ({ ...x, gorev: x.gorev ?? {} }));
              }}
            >
              <div className="satir">
                <label>
                  {t("ayGidis")}
                  <input type="date" data-ay-gidis value={f.gorev?.gidis ?? ""} onChange={(e) => setF({ ...f, gorev: { ...f.gorev, gidis: e.target.value || undefined } })} />
                </label>
                <label>
                  {t("ayDonus")}
                  <input type="date" value={f.gorev?.donus ?? ""} onChange={(e) => setF({ ...f, gorev: { ...f.gorev, donus: e.target.value || undefined } })} />
                </label>
                <button
                  type="button"
                  className="dugme dugme-ikincil dugme-kucuk"
                  onClick={() => {
                    setF({ ...f, gorev: undefined });
                    setAcik({ ...acik, gorev: false });
                  }}
                  title={t("cikar")}
                  aria-label={t("cikar")}
                >
                  ×
                </button>
              </div>
            </DuzenBolumu>
          </>
        )}

        <DuzenBolumu baslik={`${t("ayBaglanti")} · ${t("ayNotBolum")}`} acik={acik.not || gunMu} ac={() => setAcik({ ...acik, not: true })}>
          {!gunMu && (
            <label>
              {t("ayBaglanti")}
              <input type="url" dir="ltr" value={f.baglanti ?? ""} onChange={(e) => setF({ ...f, baglanti: e.target.value })} />
            </label>
          )}
          <label>
            {t("ayNotBolum")}
            <textarea dir="auto" value={f.not ?? ""} onChange={(e) => setF({ ...f, not: e.target.value })} />
          </label>
        </DuzenBolumu>
      </div>
    </Pencere>
  );
}
