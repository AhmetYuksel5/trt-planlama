import { Check, Mic, MicOff, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDil, type Dil } from "../dil";
import { alanSecenekleri, gorunurMu, type Degerler, type FormAlani } from "../asistan/araclar";
import { asistanaYaz, isSecimi, konusmayiTemizle, onayDegeri, useAsistan, type Gorunen, type TopluIs } from "../asistan/motor";
import { AsistanMetni } from "./AsistanMetni";
import { Icerik, icerikAlani } from "./Parcalar";
import { SaatGirdisi, TarihGirdisi } from "./TarihSaat";
import { izlemede } from "../izleme";
import { haftaBul, planBul, useVeri, type Durum, type Kisi } from "../veri";
import { kararlariGetir } from "../planlamaKararlari";
import type { Anahtar } from "../dil";
import { useAsistanPenceresi } from "../asistan/pencere";
import { ImlaPenceresi } from "./YzImla";
import { PlanGonderPenceresi } from "./PlanGonder";
import { kisitliKisi } from "../yetki";
import { git } from "../yol";
import { useYz } from "../yz";

/*
 * Asistan paneli (belgeler/asistan.md): kişi yazarak ya da konuşarak iş yaptırır. Yüzen düğme ve
 * Ctrl/⌘+J açar; konuşma sekmeye bağlı (motor.ts). Yazma işinde onay kartı çıkar: işin formu,
 * asistanın doldurduğu değerlerle; kişi alanları değiştirir, altta "Onayla" (ya da "evet" yazar,
 * söyler). İş bitince kart salt okunur kalır. Kısıtlı kişide (muhabir, onay bekleyen)
 * ve izlemede yok: ilk araçlar Planlama'nın işleri.
 */

const KONUSMA_DILI: Record<Dil, string> = { tr: "tr-TR", ar: "ar-SA", en: "en-US" };

type Tanima = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
const tanimaKurucu = (): (new () => Tanima) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Tanima; webkitSpeechRecognition?: new () => Tanima };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export default function Asistan({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const ozellik = useYz("asistan");
  const hal = useAsistan();
  const [acik, setAcik] = useState(false);
  const [yazi, setYazi] = useState("");
  const [dinliyor, setDinliyor] = useState(false);
  const tanima = useRef<Tanima | null>(null);
  const liste = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const gorunur = (!!ozellik || !!window.__asistanModeli) && !kisitliKisi(ben) && !izlemede();

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyJ") {
        e.preventDefault();
        setAcik((a) => !a);
      } else if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, []);
  useEffect(() => {
    if (acik) alan.current?.focus();
  }, [acik]);
  useEffect(() => {
    const l = liste.current;
    if (!l) return;
    // Yeni onay kartı uzun bir form: dibe değil başına kaydırılır, başlığı ve ilk alanları görünsün.
    const son = l.lastElementChild as HTMLElement | null;
    if (son?.dataset.durum === "bekliyor") l.scrollTo({ top: son.offsetTop - l.offsetTop - 8 });
    else l.scrollTo({ top: l.scrollHeight });
  }, [hal.gorunen.length, hal.mesgul]);

  // Asistanın açtırdığı onay pencereleri (pencere.ts): imla ve plan postası her görünümde buradan.
  const [pencere, setPencere] = useState<{ tur: "imla" | "planGonder"; id: string } | null>(null);
  useAsistanPenceresi("imla", "*", (id) => setPencere({ tur: "imla", id }));
  useAsistanPenceresi("planGonder", "*", (id) => setPencere({ tur: "planGonder", id }));
  const v = useVeri();
  const pencereHedefi = (() => {
    if (!pencere) return null;
    const nd = planBul(v, pencere.id);
    if (nd) return { tur: "nextday" as const, plan: nd };
    const h = haftaBul(v, pencere.id);
    return h ? { tur: "haftalik" as const, plan: h } : null;
  })();
  const pencereler = pencereHedefi && (pencere?.tur === "imla" ? <ImlaPenceresi ben={ben} hedef={pencereHedefi} kapat={() => setPencere(null)} /> : <PlanGonderPenceresi ben={ben} hedef={pencereHedefi} kapat={() => setPencere(null)} />);

  if (!gorunur) return null;
  const oturum = { ben, dil, git };
  const gonder = (m = yazi) => {
    if (!m.trim() || hal.mesgul) return;
    setYazi("");
    void asistanaYaz(m, oturum);
  };
  const Kurucu = tanimaKurucu();
  const dinle = () => {
    if (!Kurucu) return;
    if (dinliyor) {
      tanima.current?.stop();
      return;
    }
    const r = new Kurucu();
    r.lang = KONUSMA_DILI[dil];
    r.interimResults = false;
    // Konuşma bitince söylenen doğrudan gider: düğmeye basmadan iş ("evet" de sesle).
    r.onresult = (e) => gonder(Array.from(e.results).map((x) => x[0].transcript).join(" "));
    r.onend = () => setDinliyor(false);
    tanima.current = r;
    setDinliyor(true);
    r.start();
  };

  return (
    <>
      {pencereler}
      {!acik && (
        <button type="button" className="asistan-ac" onClick={() => setAcik(true)} title={`${t("asistan")} (Ctrl+J)`} aria-label={t("asistan")} data-asistan-ac>
          <Sparkles size={22} />
        </button>
      )}
      {acik && (
        <section className="asistan-panel" role="dialog" aria-label={t("asistan")} data-asistan-panel>
          <header className="asistan-bas">
            <Sparkles size={18} />
            <b>{t("asistan")}</b>
            <span className="bosluk" />
            {hal.gorunen.length > 0 && (
              <button type="button" className="dugme-ikon" onClick={konusmayiTemizle} title={t("asTemizle")} aria-label={t("asTemizle")} data-asistan-temizle>
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" className="dugme-ikon" onClick={() => setAcik(false)} title={t("kapat")} aria-label={t("kapat")}>
              <X size={18} />
            </button>
          </header>
          <div className="asistan-liste" ref={liste} data-asistan-liste>
            {!hal.gorunen.length && (
              <>
                <p className="asistan-bos">{t("asKarsilama")}</p>
                <Bekleyenler d={v} ben={ben} sor={(m) => gonder(m)} />
              </>
            )}
            {hal.gorunen.map((g, i) =>
              g.tur === "onay" ? (
                <OnayKarti key={i} g={g} aktif={g.durum === "bekliyor" && !!hal.bekleyen} mesgul={hal.mesgul} onayla={(evet) => void asistanaYaz("", oturum, evet)} />
              ) : (
                <div key={i} className={`asistan-ileti ${g.tur}`} dir="auto" data-asistan-ileti={g.tur}>
                  {g.tur === "asistan" ? <AsistanMetni metin={g.metin} /> : g.metin}
                </div>
              ),
            )}
            {hal.mesgul && <div className="asistan-ileti asistan yaziyor" aria-live="polite">…</div>}
          </div>
          <form
            className="asistan-yaz"
            onSubmit={(e) => {
              e.preventDefault();
              gonder();
            }}
          >
            <textarea
              ref={alan}
              dir="auto"
              rows={2}
              value={yazi}
              placeholder={t(hal.bekleyen ? "asOnayYer" : "asYer")}
              onChange={(e) => setYazi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  gonder();
                }
              }}
              aria-label={t("asistan")}
              data-asistan-yazi
            />
            {Kurucu && (
              <button type="button" className={`dugme-ikon${dinliyor ? " dinliyor" : ""}`} onClick={dinle} title={t("asKonus")} aria-label={t("asKonus")} aria-pressed={dinliyor}>
                {dinliyor ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
            <button type="submit" className="dugme-ikon" aria-label={t("gonder")} title={t("gonder")} disabled={hal.mesgul} data-asistan-gonder>
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

const SONUC_ADI = { yapildi: "asYapildi", vazgecildi: "asVazgecildi", hata: "asYapilamadi" } as const;

/* Onay kartı: işin formu. Aktifken alanlar değişir, değişiklik motorda tutulur (yazılan "evet" de onu kullanır). */
function OnayKarti({ g, aktif, mesgul, onayla }: { g: Gorunen; aktif: boolean; mesgul: boolean; onayla: (evet: boolean) => void }) {
  const { t } = useDil();
  const v: Degerler = g.degerler ?? {};
  const alanlar = (g.alanlar ?? []).filter((a) => gorunurMu(a, v));
  const secili = g.isler?.filter((x) => x.secili).length ?? 0;
  return (
    <section className={`asistan-ileti onay asistan-onay-karti${g.durum ? ` ${g.durum}` : ""}`} data-asistan-ileti="onay" data-durum={g.durum} {...(g.isler ? { "data-asistan-toplu": g.isler.length } : {})}>
      <b className="asistan-onay-baslik">{g.metin}</b>
      {g.ozet && <Icerik blok className="asistan-onay-ozet">{g.ozet}</Icerik>}
      {g.isler ? (
        <ol className="asistan-isler">
          {g.isler.map((x, k) => (
            <TopluIsSatiri key={k} x={x} sira={k} aktif={aktif} />
          ))}
        </ol>
      ) : (
        alanlar.length > 0 && (
          <div className="form asistan-form">
            {alanlar.map((a) => (
              <OnayAlani key={a.ad} a={a} v={v} aktif={aktif} eksik={!!g.eksik?.includes(a.ad)} />
            ))}
          </div>
        )
      )}
      {aktif ? (
        <div className="asistan-onay">
          <button type="button" className="dugme dugme-kucuk" disabled={mesgul || (!!g.isler && !secili)} onClick={() => onayla(true)} data-asistan-evet>
            <Check size={14} /> {g.isler ? t("asSeciliOnayla", { n: String(secili) }) : t(g.dugme ?? "asOnayla")}
          </button>
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={mesgul} onClick={() => onayla(false)} data-asistan-hayir>
            {t("iptal")}
          </button>
        </div>
      ) : (
        g.durum && g.durum !== "bekliyor" && <small className="asistan-sonuc">{t(SONUC_ADI[g.durum])}</small>
      )}
    </section>
  );
}

/* Toplu kartta bir iş: başta seçim kutusu ve işin adı; alanlar katlı, eksik ya da açılınca görünür. */
function TopluIsSatiri({ x, sira, aktif }: { x: TopluIs; sira: number; aktif: boolean }) {
  const { t } = useDil();
  const alanlar = x.alanlar.filter((a) => gorunurMu(a, x.degerler));
  return (
    <li className={`asistan-is${x.secili ? "" : " secilmedi"}${x.durum ? ` ${x.durum}` : ""}`} data-asistan-is={sira} data-durum={x.durum}>
      <details open={!!x.eksik?.length || undefined}>
        <summary>
          <input type="checkbox" checked={x.secili} disabled={!aktif} onChange={(e) => isSecimi(sira, e.target.checked)} onClick={(e) => e.stopPropagation()} aria-label={x.metin} data-asistan-is-sec />
          <span className="asistan-is-ad">
            <b>{x.metin}</b>
            {x.ozet && <Icerik>{x.ozet}</Icerik>}
          </span>
          {x.durum && <small className="asistan-sonuc">{t(SONUC_ADI[x.durum])}</small>}
        </summary>
        {alanlar.length > 0 && (
          <div className="form asistan-form">
            {alanlar.map((a) => (
              <OnayAlani key={a.ad} a={a} v={x.degerler} aktif={aktif && x.secili} eksik={!!x.eksik?.includes(a.ad)} sira={sira} />
            ))}
          </div>
        )}
      </details>
    </li>
  );
}

function OnayAlani({ a, v, aktif, eksik, sira }: { a: FormAlani; v: Degerler; aktif: boolean; eksik: boolean; sira?: number }) {
  const { t } = useDil();
  const deger = v[a.ad];
  const yazi = typeof deger === "string" ? deger : "";
  const ortak = { disabled: !aktif, "aria-invalid": eksik || undefined, "data-asistan-alan": a.ad, ...(a.icerik ? icerikAlani : {}) };
  const etiket = (
    <span>
      {t(a.etiket)}
      {a.zorunlu && !(a.yeter && v[a.yeter]) && aktif && <span aria-hidden> *</span>}
    </span>
  );
  if (a.tur === "onay")
    return (
      <label className="secim-satiri">
        <input type="checkbox" checked={deger === true} disabled={!aktif} onChange={(e) => onayDegeri(a.ad, e.target.checked, sira)} data-asistan-alan={a.ad} /> {t(a.etiket)}
      </label>
    );
  if (a.tur === "coklu") {
    const secili = Array.isArray(deger) ? deger : [];
    return (
      <fieldset className={`asistan-coklu${eksik ? " eksik" : ""}`} data-asistan-alan={a.ad} disabled={!aktif}>
        <legend>{etiket}</legend>
        {alanSecenekleri(a, v).map((o) => (
          <label key={o.deger} className="secim-satiri">
            <input type="checkbox" checked={secili.includes(o.deger)} onChange={(e) => onayDegeri(a.ad, e.target.checked ? [...secili, o.deger] : secili.filter((x) => x !== o.deger), sira)} /> {o.ad}
          </label>
        ))}
      </fieldset>
    );
  }
  let kontrol;
  if (a.tur === "secim") {
    const secenekler = alanSecenekleri(a, v);
    kontrol = (
      <select {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value, sira)}>
        {!secenekler.some((o) => o.deger === "") && <option value="">—</option>}
        {secenekler.map((o) => (
          <option key={o.deger} value={o.deger}>
            {o.ad}
          </option>
        ))}
      </select>
    );
  } else if (a.tur === "tarih") kontrol = <TarihGirdisi {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value, sira)} />;
  else if (a.tur === "saat") kontrol = <SaatGirdisi {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value, sira)} />;
  else if (a.tur === "uzun") kontrol = <textarea {...ortak} rows={3} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value, sira)} />;
  else kontrol = <input {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value, sira)} />;
  return (
    <label className={eksik ? "eksik" : undefined}>
      {etiket}
      {kontrol}
    </label>
  );
}

/*
 * Açılış özeti (kullanıcı: asistan açılınca seni bekleyenleri göstersin): boş konuşmada
 * sayıları kayıttan (planlamaKararlari.ts, ana sayfayla aynı kural) çip olarak; basınca
 * kişinin dilinde soru olarak gider, model okuma araçlarıyla ayrıntıyı getirir.
 */
const CIPLER: { sayi: (k: ReturnType<typeof kararlariGetir>) => number; ad: Anahtar; soru: Anahtar }[] = [
  { sayi: (k) => k.oneri, ad: "asCipOneri", soru: "asCipOneriSoru" },
  { sayi: (k) => k.nextDayPkg, ad: "asCipPkg", soru: "asCipPkgSoru" },
  { sayi: (k) => k.onay, ad: "asCipOnay", soru: "asCipOnaySoru" },
  { sayi: (k) => k.gununNotu, ad: "asCipGununNotu", soru: "asCipGununNotuSoru" },
];
function Bekleyenler({ d, ben, sor }: { d: Durum; ben: Kisi; sor: (m: string) => void }) {
  const { t } = useDil();
  const k = kararlariGetir(d, ben);
  const l = CIPLER.map((c) => ({ ...c, n: c.sayi(k) })).filter((c) => c.n > 0);
  if (!l.length) return null;
  return (
    <div className="asistan-cipler" data-asistan-bekleyenler>
      {l.map((c) => (
        <button key={c.ad} type="button" className="asistan-cip" onClick={() => sor(t(c.soru))} data-asistan-cip={c.ad}>
          {t(c.ad, { n: c.n })}
        </button>
      ))}
    </div>
  );
}
