import { Expand, FilePen, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Pencere } from "../../bilesenler/Parcalar";
import { ciktiTarihi, metin, useDil } from "../../dil";
import { useBen } from "../../oturum";
import type { NextDayPlan } from "../../veri";
import { planIcerikDuzenler, planOperasyonDuzenler } from "../../yetki";
import { NextDayBelgesi, type Baski } from "../belge/NextDayBelge";
import { CiktiAraclari } from "../belge/Parcalar";

/*
 * Baskı tasarımları (kullanıcı kurumun çıktısının görselinden memnun değil):
 * 1 klasik, 2 manşetli iki sütun, 3 gazete akışı, 4 künye bandı ve üç sütun.
 * "Kurum" eski düzen. Seçim tarayıcıda; plan ekranındaki "Çıktı" önizleme
 * penceresinde seçilir, yazdır tam sayfaya gidip baskıyı açar. @page bir
 * sınıfa bağlanamadığı için kenar boşluğu seçilince eklenen <style>'da.
 * Word ve "metni kopyala" her zaman kurumun düz kopyasından.
 */
const BASKI_ANAHTARI = "trt-planlama-baski";
const HEMEN_YAZDIR = "trt-planlama-hemen-yazdir";
const BASKILAR = [undefined, 1, 2, 3, 4] as const;
const kayitliBaski = (): Baski | undefined => {
  try {
    const b = Number(localStorage.getItem(BASKI_ANAHTARI));
    return b === 1 || b === 2 || b === 3 || b === 4 ? b : undefined;
  } catch {
    return undefined;
  }
};
const BASKI_SAYFA: Record<Baski, string> = {
  1: "@page { size: A4; margin: 18mm 17mm; }",
  2: "@page { size: A4; margin: 14mm 0; } @page :first { margin-top: 0; }",
  3: "@page { size: A4; margin: 14mm 13mm; }",
  4: "@page { size: A4; margin: 12mm 12mm 14mm; }",
};

function useBaski() {
  const [baski, setBaski] = useState<Baski | undefined>(kayitliBaski);
  const sec = (b: Baski | undefined) => {
    setBaski(b);
    try {
      localStorage.setItem(BASKI_ANAHTARI, b ? String(b) : "");
    } catch {
      /* saklanamazsa bu açılışta */
    }
  };
  return [baski, sec] as const;
}

function BaskiSecimi({ baski, sec }: { baski?: Baski; sec: (b: Baski | undefined) => void }) {
  const { t } = useDil();
  return (
    <div className="nd-gorunum baski-secimi" role="group" aria-label={t("baskiSecimi")} data-baski-secimi>
      {BASKILAR.map((b) => (
        <button key={b ?? 0} type="button" aria-pressed={baski === b} className={baski === b ? "secili" : ""} onClick={() => sec(b)} data-baski={b ?? 0}>
          {b ?? t("baskiKurum")}
        </button>
      ))}
    </div>
  );
}

export default function Cikti({ plan }: { plan: NextDayPlan }) {
  const { t } = useDil();
  const ben = useBen();
  const belge = useRef<HTMLElement>(null);
  const duzenler = !!ben && (planIcerikDuzenler(ben, plan) || planOperasyonDuzenler(ben, plan));
  const [baski, sec] = useBaski();

  // Önizlemeden "Yazdır" ile gelindiyse: yazı tipleri yüklenince baskı penceresi açılır.
  useEffect(() => {
    let hemen = false;
    try {
      hemen = sessionStorage.getItem(HEMEN_YAZDIR) === plan.id;
      sessionStorage.removeItem(HEMEN_YAZDIR);
    } catch {
      /* yoksa yalnız sayfa */
    }
    if (!hemen) return;
    let iptal = false;
    void document.fonts.ready.then(() => window.setTimeout(() => !iptal && window.print(), 250));
    return () => {
      iptal = true;
    };
  }, [plan.id]);

  return (
    <>
      <CiktiAraclari
        geri={{ href: `#/nextday/${plan.id}`, metin: t("planaDon") }}
        belge={belge}
        word={{ ad: `nextday-plan-${plan.tarih}.doc`, baslik: `${metin("ciktiBaslik", "ar")} ${ciktiTarihi(plan.tarih, "ar")}` }}
        ek={
          <>
            <BaskiSecimi baski={baski} sec={sec} />
            {duzenler && (
              <a className="dugme dugme-ikincil" href={`#/nextday/${plan.id}/belge`}>
                <FilePen size={16} /> {t("belgedeDuzenle")}
              </a>
            )}
          </>
        }
      />
      {baski && <style>{BASKI_SAYFA[baski]}</style>}
      <div className={`cikti-sarici${baski ? " baski-sarici" : ""}`}>
        <NextDayBelgesi plan={plan} baski={baski} belgeRef={baski ? undefined : belge} />
      </div>
      {baski && (
        <div className="word-kaynagi" aria-hidden="true">
          <NextDayBelgesi plan={plan} belgeRef={belge} />
        </div>
      )}
    </>
  );
}

/* Plan ekranındaki "Çıktı": küçültülmüş kağıt, üstte tasarım seçimi; yazdır tam sayfada açılır. */
export function CiktiOnizleme({ plan, kapat }: { plan: NextDayPlan; kapat: () => void }) {
  const { t } = useDil();
  const [baski, sec] = useBaski();
  const tamSayfa = `#/nextday/${plan.id}/cikti`;
  return (
    <Pencere genis baslik={t("ciktiOnizleme")} alt={ciktiTarihi(plan.tarih, "ar")} kapat={kapat}>
      <div className="onizleme-ust">
        <BaskiSecimi baski={baski} sec={sec} />
        <span className="bosluk-esnek" />
        <a className="dugme dugme-ikincil" href={tamSayfa} onClick={kapat} data-onizleme-tam>
          <Expand size={16} /> {t("tamSayfa")}
        </a>
        <a
          className="dugme"
          href={tamSayfa}
          onClick={() => {
            try {
              sessionStorage.setItem(HEMEN_YAZDIR, plan.id);
            } catch {
              /* yazdır tam sayfadan elle */
            }
            kapat();
          }}
          data-onizleme-yazdir
        >
          <Printer size={16} /> {t("yazdir")}
        </a>
      </div>
      {baski && <style>{BASKI_SAYFA[baski]}</style>}
      <div className="baski-onizleme" data-onizleme>
        <div className="onizleme-kagit">
          <NextDayBelgesi plan={plan} baski={baski} />
        </div>
      </div>
    </Pencere>
  );
}
