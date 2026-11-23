import { Mail, MailCheck } from "lucide-react";
import { useRef, useState } from "react";
import { tarihYaz, saatYaz, useDil } from "../dil";
import { planGonderildi } from "../eylemler";
import { GERCEK } from "../kip";
import { govdeliHtml, planPostasi } from "../planGonder";
import { postaGonder } from "../posta-kapi";
import { useVeri, type HaftalikPlan, type Kisi, type NextDayPlan } from "../veri";
import { planGonderebilir } from "../yetki";
import { HaftalikBelgesi } from "../ekranlar/belge/HaftalikBelge";
import { NextDayBelgesi } from "../ekranlar/belge/NextDayBelge";
import { kapiHatasi } from "../yz";
import { epostaHtml } from "./indir";
import { Pencere, bildir } from "./Parcalar";

/*
 * Planı gönder (planGonder.ts): onaylanan Next Day ve kesinleşen Weekly'nin
 * üstünde zarf. Pencerede alıcılar ve konu Ayarlar'daki şablondan, altında
 * planın kendisi; gönderilen gövde "E-posta için kopyala"nın biçimi.
 * Gönderilmiş planda zarf işaretli, saati ipucunda.
 */
type Hedef = { tur: "nextday"; plan: NextDayPlan } | { tur: "haftalik"; plan: HaftalikPlan };

export function PlanGonderDugmesi({ ben, hedef }: { ben: Kisi; hedef: Hedef }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  if (!planGonderebilir(ben, hedef.tur, hedef.plan)) return null;
  const g = hedef.plan.gonderildi;
  const ad = g ? `${t("pgGonder")} · ${t("pgGonderildi", { zaman: `${tarihYaz(g.zaman.slice(0, 10))} ${saatYaz(g.zaman)}` })}` : t("pgGonder");
  return (
    <>
      <button type="button" className={`dugme dugme-ikincil dugme-ikon${g ? " iyi-yazi" : ""}`} title={ad} aria-label={ad} onClick={() => setAcik(true)} data-plan-gonder={g ? "gonderildi" : ""}>
        {g ? <MailCheck size={16} /> : <Mail size={16} />}
      </button>
      {acik && <PlanGonderPenceresi ben={ben} hedef={hedef} kapat={() => setAcik(false)} />}
    </>
  );
}

function PlanGonderPenceresi({ ben, hedef, kapat }: { ben: Kisi; hedef: Hedef; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const tarih = hedef.tur === "nextday" ? hedef.plan.tarih : hedef.plan.baslangic;
  const [p, setP] = useState(() => planPostasi(v, hedef.tur, tarih));
  const [gidiyor, setGidiyor] = useState(false);
  const belge = useRef<HTMLElement>(null);
  const gonder = async () => {
    if (!belge.current || gidiyor) return;
    if (hedef.plan.gonderildi && !confirm(t("pgYeniden"))) return;
    const html = govdeliHtml(p.govde, epostaHtml(belge.current.innerHTML));
    const metin = [p.govde, belge.current.innerText].filter((x) => x.trim()).join("\n\n");
    setGidiyor(true);
    const r = GERCEK ? await postaGonder({ kime: p.kime, cc: p.cc, bcc: p.bcc, konu: p.konu.trim(), metin, html }) : { tamam: true as const };
    setGidiyor(false);
    if ("hata" in r) return bildir(r.hata === "eksikKimlik" ? t("bPostaCekKimlikYok") : r.hata === "kapali" ? t("bPostaCekKapali") : kapiHatasi(r, t("bPostaGonderHata")));
    planGonderildi(ben, hedef.tur, hedef.plan.id);
    bildir(t("pgGitti"));
    kapat();
  };
  const satir = (etiket: string, l: string[], ozellik: string, bos?: string) => (
    <div className="pg-alici" {...{ [ozellik]: l.join(",") }}>
      <b>{etiket}</b> <span dir="ltr">{l.length ? l.join(", ") : <span className="sonuk">{bos ?? "—"}</span>}</span>
    </div>
  );
  return (
    <Pencere
      genis
      baslik={t("pgGonder")}
      kapat={kapat}
      altBilgi={
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={gidiyor || !p.konu.trim()} onClick={gonder} data-plan-gonder-gonder>
            <Mail size={14} /> {t("gonder")}
          </button>
        </div>
      }
    >
      <div className="form" data-plan-gonder-penceresi>
        {satir(t("postaKime"), p.kime, "data-pg-kime", t("pgGrupKime"))}
        {p.cc.length > 0 && satir(t("gbCc"), p.cc, "data-pg-cc")}
        {p.bcc.length > 0 && satir(t("gbBcc"), p.bcc, "data-pg-bcc")}
        <label>
          {t("gbKonu")}
          <input dir="auto" value={p.konu} onChange={(e) => setP({ ...p, konu: e.target.value })} data-pg-konu />
        </label>
        {p.govde && (
          <p dir="auto" className="pg-govde">
            {p.govde}
          </p>
        )}
        <div className="cikti-sarici pg-onizleme">
          {hedef.tur === "nextday" ? <NextDayBelgesi plan={hedef.plan} belgeRef={belge} /> : <HaftalikBelgesi hafta={hedef.plan} belgeRef={belge} />}
        </div>
      </div>
    </Pencere>
  );
}
