import { Check, Mic, MicOff, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDil, type Dil } from "../dil";
import { asistanaYaz, konusmayiTemizle, useAsistan } from "../asistan/motor";
import { izlemede } from "../izleme";
import type { Kisi } from "../veri";
import { kisitliKisi } from "../yetki";
import { git } from "../yol";
import { useYz } from "../yz";

/*
 * Asistan paneli (belgeler/asistan.md): kişi yazarak ya da konuşarak iş yaptırır. Yüzen düğme ve
 * Ctrl/⌘+J açar; konuşma sekmeye bağlı (motor.ts). Yazma işinde asistan ne yapacağını söyler,
 * kişi "evet" yazar ya da söyler (düğme de var, şart değil). Kısıtlı kişide (muhabir, onay bekleyen)
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
    liste.current?.scrollTo({ top: liste.current.scrollHeight });
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
            {hal.gorunen.map((g, i) => (
              <div key={i} className={`asistan-ileti ${g.tur}${g.durum ? ` ${g.durum}` : ""}`} dir="auto" data-asistan-ileti={g.tur} data-durum={g.durum}>
                {g.metin}
                {g.tur === "onay" && g.durum === "bekliyor" && hal.bekleyen && (
                  <div className="asistan-onay">
                    <button type="button" className="dugme dugme-kucuk" onClick={() => void asistanaYaz("", oturum, true)} data-asistan-evet>
                      <Check size={14} /> {t("asEvet")}
                    </button>
                    <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => void asistanaYaz("", oturum, false)} data-asistan-hayir>
                      {t("iptal")}
                    </button>
                  </div>
                )}
                {g.tur === "onay" && g.durum && g.durum !== "bekliyor" && <small className="asistan-sonuc">{t(g.durum === "yapildi" ? "asYapildi" : "asVazgecildi")}</small>}
              </div>
            ))}
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
