import { Check, Mic, MicOff, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDil, type Dil } from "../dil";
import { alanSecenekleri, gorunurMu, type Degerler, type FormAlani } from "../asistan/araclar";
import { asistanaYaz, konusmayiTemizle, onayDegeri, useAsistan, type Gorunen } from "../asistan/motor";
import { AsistanMetni } from "./AsistanMetni";
import { Icerik, icerikAlani } from "./Parcalar";
import { SaatGirdisi, TarihGirdisi } from "./TarihSaat";
import { izlemede } from "../izleme";
import type { Kisi } from "../veri";
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
            {!hal.gorunen.length && <p className="asistan-bos">{t("asKarsilama")}</p>}
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
  return (
    <section className={`asistan-ileti onay asistan-onay-karti${g.durum ? ` ${g.durum}` : ""}`} data-asistan-ileti="onay" data-durum={g.durum}>
      <b className="asistan-onay-baslik">{g.metin}</b>
      {g.ozet && <Icerik blok className="asistan-onay-ozet">{g.ozet}</Icerik>}
      {alanlar.length > 0 && (
        <div className="form asistan-form">
          {alanlar.map((a) => (
            <OnayAlani key={a.ad} a={a} v={v} aktif={aktif} eksik={!!g.eksik?.includes(a.ad)} />
          ))}
        </div>
      )}
      {aktif ? (
        <div className="asistan-onay">
          <button type="button" className="dugme dugme-kucuk" disabled={mesgul} onClick={() => onayla(true)} data-asistan-evet>
            <Check size={14} /> {t(g.dugme ?? "asOnayla")}
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

function OnayAlani({ a, v, aktif, eksik }: { a: FormAlani; v: Degerler; aktif: boolean; eksik: boolean }) {
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
        <input type="checkbox" checked={deger === true} disabled={!aktif} onChange={(e) => onayDegeri(a.ad, e.target.checked)} data-asistan-alan={a.ad} /> {t(a.etiket)}
      </label>
    );
  if (a.tur === "coklu") {
    const secili = Array.isArray(deger) ? deger : [];
    return (
      <fieldset className={`asistan-coklu${eksik ? " eksik" : ""}`} data-asistan-alan={a.ad} disabled={!aktif}>
        <legend>{etiket}</legend>
        {alanSecenekleri(a, v).map((o) => (
          <label key={o.deger} className="secim-satiri">
            <input type="checkbox" checked={secili.includes(o.deger)} onChange={(e) => onayDegeri(a.ad, e.target.checked ? [...secili, o.deger] : secili.filter((x) => x !== o.deger))} /> {o.ad}
          </label>
        ))}
      </fieldset>
    );
  }
  let kontrol;
  if (a.tur === "secim") {
    const secenekler = alanSecenekleri(a, v);
    kontrol = (
      <select {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value)}>
        {!secenekler.some((o) => o.deger === "") && <option value="">—</option>}
        {secenekler.map((o) => (
          <option key={o.deger} value={o.deger}>
            {o.ad}
          </option>
        ))}
      </select>
    );
  } else if (a.tur === "tarih") kontrol = <TarihGirdisi {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value)} />;
  else if (a.tur === "saat") kontrol = <SaatGirdisi {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value)} />;
  else if (a.tur === "uzun") kontrol = <textarea {...ortak} rows={3} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value)} />;
  else kontrol = <input {...ortak} value={yazi} onChange={(e) => onayDegeri(a.ad, e.target.value)} />;
  return (
    <label className={eksik ? "eksik" : undefined}>
      {etiket}
      {kontrol}
    </label>
  );
}
