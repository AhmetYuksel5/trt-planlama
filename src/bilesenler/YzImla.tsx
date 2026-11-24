import { Check, Loader2, SpellCheck } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDil, type Anahtar } from "../dil";
import { imlaUygula } from "../eylemler";
import { hfImlaSatirlari, imlaKimligi, ndImlaSatirlari, satirOnizleme, sozcukDegistir, type ImlaOnerisi, type ImlaSatiri, type ImlaTuru } from "../imla";
import { getir, type HaftalikPlan, type Kisi, type NextDayPlan } from "../veri";
import { useYz, yzHataMetni, yzIste } from "../yz";
import { Icerik, Pencere, bildir } from "./Parcalar";

/*
 * İmla denetimi penceresi (imla.ts): planın satırları kapıya gider, dönen
 * öneriler satır satır, değişen sözcük işaretli gösterilir. Hepsi işaretsiz
 * gelir; yalnız kişinin seçtikleri "Seçilenleri uygula"yla yazılır, ↶ geri alır.
 */
type Hedef = { tur: "nextday"; plan: NextDayPlan } | { tur: "haftalik"; plan: HaftalikPlan };

const ALAN_ADI: Record<ImlaTuru, Anahtar> = {
  g: "imAlanGelisme",
  pb: "imAlanStrap",
  pa: "imAlanAciklama",
  c: "imAlanCanli",
  k: "imAlanKalem",
  kp: "imAlanStrap",
  a: "imAlanAnaKonu",
};

/** Menü maddesi: özellik bu kişiye açıksa. */
export const useImlaAcik = () => !!useYz("imla");

const satirlariTopla = (h: Hedef): ImlaSatiri[] => {
  const d = getir();
  if (h.tur === "nextday") return ndImlaSatirlari(d, h.plan);
  const hafta = d.haftalik.find((x) => x.id === h.plan.id);
  return hafta ? hfImlaSatirlari(hafta) : [];
};

const anahtar = (o: ImlaOnerisi) => `${o.id}#${o.sira}`;

export function ImlaPenceresi({ ben, hedef, kapat }: { ben: Kisi; hedef: Hedef; kapat: () => void }) {
  const { t } = useDil();
  const ozellik = useYz("imla");
  // Satırlar açılış anındaki halleriyle: öneriler onlara göre, uygulamada şimdiki hal yeniden sorulur.
  const [satirlar] = useState(() => satirlariTopla(hedef));
  const [oneriler, setOneriler] = useState<ImlaOnerisi[] | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const bitti = !!ozellik && ozellik.kalan <= 0;

  useEffect(() => {
    if (!satirlar.length || bitti) {
      setOneriler([]);
      return;
    }
    let iptal = false;
    void yzIste("imla", { satirlar: satirlar.map((s) => ({ id: s.id, metin: s.metin })) }).then((r) => {
      if (iptal) return;
      if (!r.tamam) {
        bildir(yzHataMetni(t, r.hata));
        setOneriler([]);
        return;
      }
      // Kapının süzgecinden geçmiş olsa da yerel kuraldan bir kez daha: satırda o sözcük yoksa ya da kural dışıysa gösterilmez.
      const metinler = new Map(satirlar.map((s) => [s.id, s.metin]));
      setOneriler(r.veri.duzeltmeler.filter((o) => metinler.has(o.id) && sozcukDegistir(metinler.get(o.id)!, o) !== null));
    });
    return () => {
      iptal = true;
    };
    // Pencere açılışında bir kez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gruplar = useMemo(() => {
    const m = new Map<string, ImlaOnerisi[]>();
    for (const o of oneriler ?? []) m.set(o.id, [...(m.get(o.id) ?? []), o]);
    return satirlar.filter((s) => m.has(s.id)).map((s) => ({ satir: s, oneriler: m.get(s.id)! }));
  }, [oneriler, satirlar]);

  const degistir = (o: ImlaOnerisi) =>
    setSecili((s) => {
      const y = new Set(s);
      if (y.has(anahtar(o))) y.delete(anahtar(o));
      else y.add(anahtar(o));
      return y;
    });
  const hepsi = oneriler?.length ? secili.size === oneriler.length : false;
  const uygula = () => {
    const l = (oneriler ?? []).filter((o) => secili.has(anahtar(o)));
    if (!l.length) return;
    const n = imlaUygula(ben, hedef.plan.id, l);
    bildir(n ? t("imUygulandi", { sayi: String(n) }) : t("imUygulanmadi"));
    kapat();
  };

  return (
    <Pencere
      genis
      baslik={t("imDenetim")}
      kapat={kapat}
      altBilgi={
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("kapat")}
          </button>
          {!!oneriler?.length && (
            <button type="button" className="dugme dugme-kucuk" disabled={!secili.size} onClick={uygula} data-imla-uygula>
              <Check size={14} /> {t("imUygula", { sayi: String(secili.size) })}
            </button>
          )}
        </div>
      }
    >
      <div className="imla" data-imla-penceresi>
        {oneriler === null ? (
          <p className="sonuk" data-imla-bekliyor>
            <Loader2 size={14} className="donen" /> {t("imBekliyor")}
          </p>
        ) : bitti ? (
          <p className="sonuk">{t("yzSinirDoldu")}</p>
        ) : !gruplar.length ? (
          <p className="sonuk" data-imla-yok>
            <SpellCheck size={14} /> {t("imYok")}
          </p>
        ) : (
          <>
            <label className="imla-hepsi">
              <input type="checkbox" checked={hepsi} onChange={() => setSecili(hepsi ? new Set() : new Set(oneriler.map(anahtar)))} data-imla-hepsi />{" "}
              {t("imHepsi", { sayi: String(oneriler.length) })}
            </label>
            {gruplar.map(({ satir, oneriler: l }) => {
              const k = imlaKimligi(satir.id);
              return (
                <div key={satir.id} className="imla-satir" data-imla-satir={satir.id}>
                  <small className="sonuk">{k ? t(ALAN_ADI[k.tur]) : ""}</small>
                  <Icerik blok>
                    {satirOnizleme(satir.metin, l).map(({ sozcuk, oneri }, i) => (
                      <Fragment key={i}>
                        {i > 0 && " "}
                        {oneri ? <mark className={secili.has(anahtar(oneri)) ? "imla-secili" : "imla-oneri"}>{secili.has(anahtar(oneri)) ? oneri.yeni : sozcuk}</mark> : sozcuk}
                      </Fragment>
                    ))}
                  </Icerik>
                  <div className="imla-oneriler">
                    {l.map((o) => (
                      <label key={anahtar(o)} className="imla-oneri-satiri" data-imla-oneri={anahtar(o)}>
                        <input type="checkbox" checked={secili.has(anahtar(o))} onChange={() => degistir(o)} />{" "}
                        <Icerik>
                          <del>{o.eski}</del> ← <b>{o.yeni}</b>
                        </Icerik>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Pencere>
  );
}
