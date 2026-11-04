import { Calendar, CalendarCheck, Check, ChevronLeft, ChevronRight, ClipboardCopy, FileDown, Plus, Printer, Trash2, Undo2 } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { Bos, Kart, Pencere, Rozet, bildir, icerikAlani } from "../../bilesenler/Parcalar";
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
 * Aylık plan: kurumun "الخطة الشهرية المتوقعة" belgesinin kendisi. Sayfa
 * belgedir; planı hazırlayan teknolojiye yabancı olduğu için tek büyük
 * "Olay ekle" düğmesi ve adım adım form var, olaya basınca aynı form açılır.
 * Kesin plan ama bağlayıcı değil: olaylar Weekly'de yeniden değerlendirilir
 * (aylik.ts → haftayaDusenler), Next Day'le bağı yok.
 */
export function Aylik({ ben, planId }: { ben: Kisi; planId?: string }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const buAy = bugun().slice(0, 7);
  const [ay, setAy] = useState(() => v.aylik.find((a) => a.id === planId)?.ay ?? buAy);
  const [form, setForm] = useState<AylikOlay | "yeni" | null>(null);
  const belge = useRef<HTMLElement>(null);
  const plan = v.aylik.find((a) => a.ay === ay);
  const bas = ay + "-01";
  const duzenler = aylikDuzenler(ben) && plan?.durum !== "onayli";
  const onaylar = planAdimiYapabilir(ben, "ayOnay");
  const kaydir = (n: number) => setAy(ayEkle(bas, n).slice(0, 7));
  const ol = olaylar(plan);
  return (
    <>
      <SayfaBasi ikon={<Calendar size={26} />} baslik={t("aylik")} />
      <section className="kart ay-ust">
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
        <div className="dugmeler ara-ust-2">
          {(duzenler || (!plan && aylikDuzenler(ben))) && (
            <button className="dugme dugme-buyuk" data-ay-olay-ekle onClick={() => setForm("yeni")}>
              <Plus size={20} /> {t("ayOlayEkle")}
            </button>
          )}
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
          {ol.length > 0 && <BelgeAraclari belge={belge} ay={ay} />}
        </div>
        {plan?.durum === "hazirlik" && !onaylar && ol.length > 0 && (
          <p className="bos-kucuk ara-ust">
            {t("ayOnayYetkili")} <AdimYetkilileri adim="ayOnay" />
          </p>
        )}
      </section>

      {ol.length ? (
        <div className="cikti-sarici ara-ust-2">
          <AylikBelgesi plan={plan!} d={v} belgeRef={belge} ac={duzenler ? (o) => setForm(o) : undefined} />
        </div>
      ) : (
        <Bos metin={t("ayBos")} ikon={<Calendar size={28} />} />
      )}

      <Kart baslik={t("takvimdenAy")} ikon={<CalendarCheck size={18} />} className="ara-ust-2">
        <TakvimdenListe ben={ben} bas={bas} bit={aySonu(bas)} tur="aylik" planId={plan?.id} ekleyebilir={aylikDuzenler(ben)} eklemeMetni={t("planaEkle")} />
      </Kart>

      {form && <OlayFormu ben={ben} ay={ay} olay={form === "yeni" ? undefined : form} kapat={() => setForm(null)} />}
    </>
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

const ayBasligi = (ay: string) => `${metin("ayCiktiBaslik", "ar")} ${tarihYaz(ay + "-01", "ar", "ay")}`;
const gunYaz = (o: Pick<AylikOlay, "tarih" | "bitis">) => (olaySonu(o) > o.tarih ? aralikYaz(o.tarih, olaySonu(o), "ar") : tarihYaz(o.tarih, "ar", "uzun"));
const ekipAdi = (d: Durum, e: AylikEkip) => (e.tbc ? "TBC" : e.ad || kisiAr(kisiBul(d, e.kisiId ?? "")) || "TBC");
const ekipSatiri = (d: Durum, o: AylikOlay) => o.ekip.map((e) => `${metin(`ayEkip_${e.gorev}` as Anahtar, "ar")} / ${ekipAdi(d, e)}`);

/*
 * Belge kurumun düzeniyle, her arayüz dilinde Arapça: başlık, ana kapsamlar,
 * öne çıkan olaylar (kırmızı gün başlığı, "YER / olay", açıklama, önem,
 * etiket kodları, gün gün kapsam, ekip), en sonda görevlendirme tablosu.
 */
function AylikBelgesi({ plan, d, belgeRef, ac }: { plan: AylikPlan; d: Durum; belgeRef: RefObject<HTMLElement | null>; ac?: (o: AylikOlay) => void }) {
  const ol = olaylar(plan);
  const ana = ol.filter((o) => o.anaKapsam);
  const tablo = (baslik: Anahtar) => {
    const l = gorevler(plan);
    if (!l.length) return null;
    return (
      <section>
        <h2 className="kirmizi">{metin(baslik, "ar")}</h2>
        <table className="ay-tablo">
          <thead>
            <tr>
              <th>{metin("ayOlay", "ar")}</th>
              <th>{metin("ayYer", "ar")}</th>
              <th>{metin("ayTabloEkip", "ar")}</th>
              <th>{metin("ayGidis", "ar")}</th>
              <th>{metin("ayDonus", "ar")}</th>
            </tr>
          </thead>
          <tbody>
            {l.map((o) => (
              <tr key={o.id}>
                <td>{o.baslik}</td>
                <td>{o.yer}</td>
                <td>{ekipSatiri(d, o).join("، ")}</td>
                <td>{o.gorev?.gidis && tarihYaz(o.gorev.gidis, "ar", "kisa")}</td>
                <td>{o.gorev?.donus && tarihYaz(o.gorev.donus, "ar", "kisa")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  };
  return (
    <article ref={belgeRef} className="cikti ay-belge" dir="rtl" lang="ar">
      <h1>{ayBasligi(plan.ay)}</h1>
      {ana.length > 0 && (
        <section>
          <h2 className="kirmizi">{metin("ayAnaKapsamlar", "ar")}</h2>
          {ana.map((o) => (
            <p key={o.id}>
              <b>{o.baslik}</b>
              {o.anaOzet && <>: {o.anaOzet}</>}
              {kapsamOzeti(o) && <> {metin("ayKapsamCumlesi", "ar").replace("{tur}", kapsamOzeti(o))}</>}
            </p>
          ))}
        </section>
      )}
      <section>
        <h2 className="ortali">{metin("ayOneCikanlar", "ar")}</h2>
        {ol.map((o) => {
          const govde = (
            <>
              <h2 className="kirmizi">{gunYaz(o)}</h2>
              <h3>{[o.yer, o.baslik].filter(Boolean).join(" / ")}</h3>
              {o.aciklama && <p>{o.aciklama}</p>}
              {o.onem && <p>{o.onem}</p>}
              {o.etiketler.length > 0 && (
                <p>
                  <b dir="ltr">{o.etiketler.map((e) => ETIKET_KODU[e]).join(" · ")}</b>
                </p>
              )}
              {o.gunler.map((g) => (
                <div key={g.tarih}>
                  <p>
                    <b>{tarihYaz(g.tarih, "ar", "tam")}</b>
                  </p>
                  {g.satirlar.map((s) => (
                    <p key={s.id}>{[SATIR_KODU[s.tur], s.tbc ? "TBC" : s.metin].filter(Boolean).join(" / ")}</p>
                  ))}
                </div>
              ))}
              {ekipSatiri(d, o).map((s, i) => (
                <p key={i}>{s}</p>
              ))}
              {o.not && <p className="ay-not">{o.not}</p>}
            </>
          );
          return ac ? (
            <div key={o.id} className="ay-olay tiklanir" role="button" tabIndex={0} data-ay-olay={o.id} onClick={() => ac(o)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ac(o))}>
              {govde}
            </div>
          ) : (
            <div key={o.id} className="ay-olay" data-ay-olay={o.id}>
              {govde}
            </div>
          );
        })}
      </section>
      {tablo("ayGorevler")}
    </article>
  );
}

const ADIMLAR: Anahtar[] = ["ayAdim1", "ayAdim2", "ayAdim3", "ayAdim4", "ayAdim5", "ayAdim6"];
const yeniId = () => Math.random().toString(36).slice(2, 10);

/** Olayın günleri: başlangıçtan bitişe (en çok 31), var olan satırlar korunur. */
const gunleriKur = (tarih: string, bitis: string | undefined, eski: AylikGun[]): AylikGun[] => {
  if (!tarih) return [];
  const son = bitis && bitis > tarih ? bitis : tarih;
  const l: AylikGun[] = [];
  for (let g = tarih; g <= son && l.length < 31; g = gunEkle(g, 1)) l.push(eski.find((x) => x.tarih === g) ?? { tarih: g, satirlar: [] });
  return l;
};

/*
 * Adım adım form: her adımda birkaç alan, "İleri" ile geçilir; zorunlu
 * yalnız olayın adı ve günü, kaydet her adımda açık (kısa olay iki adımda biter).
 */
function OlayFormu({ ben, ay, olay, kapat }: { ben: Kisi; ay: string; olay?: AylikOlay; kapat: () => void }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const [adim, setAdim] = useState(0);
  const [f, setF] = useState<AylikOlayGirdisi>(() => olay ?? { baslik: "", tarih: "", etiketler: [], gunler: [], ekip: [] });
  const gunler = gunleriKur(f.tarih, f.bitis, f.gunler);
  const gecerli = !!f.baslik.trim() && !!f.tarih;
  const kisiler = v.kisiler.filter((k) => !k.pasif).sort((a, b) => ad(a).localeCompare(ad(b)));
  const gunDegis = (tarih: string, satirlar: AylikGun["satirlar"]) => setF((x) => ({ ...x, gunler: gunleriKur(x.tarih, x.bitis, x.gunler).map((g) => (g.tarih === tarih ? { ...g, satirlar } : g)) }));
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
      baslik={t(olay ? "ayOlayDuzenle" : "ayOlayEkle")}
      alt={`${adim + 1} / ${ADIMLAR.length} · ${t(ADIMLAR[adim])}`}
      kapat={kapat}
      altBilgi={
        <div className="form-alt ay-form-alt">
          {olay && (
            <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={sil} title={t("sil")} aria-label={t("sil")}>
              <Trash2 size={16} />
            </button>
          )}
          <span className="bosluk-esnek" />
          {adim > 0 && (
            <button type="button" className="dugme dugme-ikincil" onClick={() => setAdim(adim - 1)}>
              {t("ayGeri")}
            </button>
          )}
          {adim < ADIMLAR.length - 1 && (
            <button type="button" className="dugme dugme-ikincil" data-ay-ileri disabled={adim === 0 ? !f.baslik.trim() : adim === 1 ? !f.tarih : false} onClick={() => setAdim(adim + 1)}>
              {t("ayIleri")}
            </button>
          )}
          <button type="button" className="dugme" data-ay-kaydet disabled={!gecerli} onClick={kaydet}>
            {t("kaydet")}
          </button>
        </div>
      }
    >
      <ol className="ay-adimlar" aria-hidden="true">
        {ADIMLAR.map((a, i) => (
          <li key={a} className={i === adim ? "simdi" : i < adim ? "gecti" : ""}>
            <button type="button" onClick={() => (i <= 1 || gecerli) && setAdim(i)}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <div className="form">
        {adim === 0 && (
          <>
            <label>
              {t("ayOlay")}
              <input {...icerikAlani} data-ay-baslik autoFocus value={f.baslik} onChange={(e) => setF({ ...f, baslik: e.target.value })} placeholder="القمة العربية الطارئة" />
            </label>
            <label>
              {t("ayYer")}
              <input {...icerikAlani} value={f.yer ?? ""} onChange={(e) => setF({ ...f, yer: e.target.value })} placeholder="مصر / القاهرة" />
            </label>
            <label>
              {t("ayAciklama")}
              <textarea {...icerikAlani} value={f.aciklama ?? ""} onChange={(e) => setF({ ...f, aciklama: e.target.value })} />
            </label>
          </>
        )}
        {adim === 1 && (
          <div className="satir">
            <label>
              {t("ayBas")}
              <input type="date" data-ay-tarih value={f.tarih} min={ay + "-01"} onChange={(e) => setF({ ...f, tarih: e.target.value, bitis: f.bitis && f.bitis < e.target.value ? undefined : f.bitis })} />
            </label>
            <label>
              {t("ayBitis")}
              <input type="date" value={f.bitis ?? ""} min={f.tarih || undefined} onChange={(e) => setF({ ...f, bitis: e.target.value || undefined })} />
            </label>
          </div>
        )}
        {adim === 2 && (
          <>
            <label>
              {t("ayOnem")}
              <textarea {...icerikAlani} value={f.onem ?? ""} onChange={(e) => setF({ ...f, onem: e.target.value })} placeholder="وتكمن أهمية الحدث في…" />
            </label>
            <label className="secim">
              <input type="checkbox" checked={!!f.anaKapsam} onChange={(e) => setF({ ...f, anaKapsam: e.target.checked || undefined })} />
              {t("ayAnaKapsam")}
            </label>
            {f.anaKapsam && (
              <label>
                {t("ayAnaOzet")}
                <input {...icerikAlani} value={f.anaOzet ?? ""} onChange={(e) => setF({ ...f, anaOzet: e.target.value })} />
              </label>
            )}
          </>
        )}
        {adim === 3 &&
          (gunler.length ? (
            gunler.map((g) => (
              <fieldset key={g.tarih} className="ay-gun" data-ay-gun={g.tarih}>
                <legend>{tarihYaz(g.tarih, dil, "tam")}</legend>
                {g.satirlar.map((s, i) => (
                  <div key={s.id} className="satir">
                    <select value={s.tur} aria-label={t("ayOlay")} onChange={(e) => gunDegis(g.tarih, g.satirlar.map((x, j) => (j === i ? { ...x, tur: e.target.value as typeof s.tur } : x)))}>
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
                <button type="button" className="dugme dugme-ikincil dugme-kucuk" data-ay-satir-ekle onClick={() => gunDegis(g.tarih, [...g.satirlar, { id: yeniId(), tur: g.satirlar.length ? "live" : "pkg", metin: "" }])}>
                  <Plus size={14} /> {t("aySatirEkle")}
                </button>
              </fieldset>
            ))
          ) : (
            <p className="bos-kucuk">{t("ayGunYok")}</p>
          ))}
        {adim === 4 && (
          <>
            {f.ekip.map((e, i) => (
              <div key={i} className="satir">
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
                  <input type="checkbox" checked={!!e.tbc} onChange={(x) => ekipDegis(i, { tbc: x.target.checked || undefined })} />
                  TBC
                </label>
                <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setF((x) => ({ ...x, ekip: x.ekip.filter((_, j) => j !== i) }))} title={t("cikar")} aria-label={t("cikar")}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" data-ay-ekip-ekle onClick={() => setF((x) => ({ ...x, ekip: [...x.ekip, { gorev: "muhabir" }] }))}>
              <Plus size={14} /> {t("ayEkipEkle")}
            </button>
            <div className="satir ara-ust-2">
              <label className="secim">
                <input type="checkbox" data-ay-gorev checked={!!f.gorev} onChange={(e) => setF({ ...f, gorev: e.target.checked ? { ...f.gorev } : undefined })} />
                {t("ayGorevVar")}
              </label>
              {f.gorev && (
                <>
                  <label>
                    {t("ayGidis")}
                    <input type="date" value={f.gorev.gidis ?? ""} onChange={(e) => setF({ ...f, gorev: { ...f.gorev!, gidis: e.target.value || undefined } })} />
                  </label>
                  <label>
                    {t("ayDonus")}
                    <input type="date" value={f.gorev.donus ?? ""} onChange={(e) => setF({ ...f, gorev: { ...f.gorev!, donus: e.target.value || undefined } })} />
                  </label>
                </>
              )}
            </div>
          </>
        )}
        {adim === 5 && (
          <>
            <div className="ay-etiketler">
              {AYLIK_ETIKETLERI.map((e) => (
                <label key={e} className="secim">
                  <input type="checkbox" checked={f.etiketler.includes(e)} onChange={(x) => setF({ ...f, etiketler: x.target.checked ? [...f.etiketler, e] : f.etiketler.filter((y) => y !== e) })} />
                  <span dir="ltr">{ETIKET_KODU[e]}</span>
                </label>
              ))}
            </div>
            <label>
              {t("not")}
              <textarea dir="auto" value={f.not ?? ""} onChange={(e) => setF({ ...f, not: e.target.value })} />
            </label>
          </>
        )}
      </div>
    </Pencere>
  );
}

