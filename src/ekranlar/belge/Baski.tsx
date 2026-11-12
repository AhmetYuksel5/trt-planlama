import { Expand, Printer } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Pencere } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";

/*
 * Baskı tasarımları (kullanıcı kurumun çıktısının görselinden memnun değil):
 * 1 klasik, 2 manşetli iki sütun, 3 gazete akışı, 4 künye bandı ve üç sütun.
 * "Kurum" eski düzen. Next Day ve Weekly ortak (kullanıcı: Next Day'in çıktı
 * seçenekleri Weekly'de de olsun); seçim tarayıcıda, ikisinde aynı. Plan
 * ekranındaki "Çıktı" önizleme penceresinde seçilir, yazdır tam sayfaya gidip
 * baskıyı açar. @page bir sınıfa bağlanamadığı için kenar boşluğu seçilince
 * eklenen <style>'da. Word ve "metni kopyala" her zaman kurumun düz kopyasından.
 */
export type Baski = 1 | 2 | 3 | 4;
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

export function BaskiSayfasi({ baski }: { baski?: Baski }) {
  return baski ? <style>{BASKI_SAYFA[baski]}</style> : null;
}

export function useBaski() {
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

export function BaskiSecimi({ baski, sec }: { baski?: Baski; sec: (b: Baski | undefined) => void }) {
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

/* Önizlemeden "Yazdır" ile gelindiyse: yazı tipleri yüklenince baskı penceresi açılır. */
export function useHemenYazdir(id: string) {
  useEffect(() => {
    let hemen = false;
    try {
      hemen = sessionStorage.getItem(HEMEN_YAZDIR) === id;
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
  }, [id]);
}

/* Plan ekranındaki "Çıktı": küçültülmüş kağıt, üstte tasarım seçimi; yazdır tam sayfada açılır. */
export function BaskiOnizleme({ id, alt, tamSayfa, kapat, belge }: { id: string; alt: string; tamSayfa: string; kapat: () => void; belge: (baski?: Baski) => ReactNode }) {
  const { t } = useDil();
  const [baski, sec] = useBaski();
  return (
    <Pencere genis baslik={t("ciktiOnizleme")} alt={alt} kapat={kapat}>
      <div className="onizleme-ust">
        <BaskiSecimi baski={baski} sec={sec} />
        <span className="bosluk-esnek" />
        {/*
          Bağlantı pencereyi kapatmadan gider: kapanan pencere kendi geçmiş adımını geri alıyor,
          o da tam sayfaya gidişi iptal ediyordu (düğme hiçbir şey yapmıyor gibiydi). Sayfa
          değişince pencere kalkar, adımına dokunulmaz.
        */}
        <a className="dugme dugme-ikincil" href={tamSayfa} data-onizleme-tam>
          <Expand size={16} /> {t("tamSayfa")}
        </a>
        <a
          className="dugme"
          href={tamSayfa}
          onClick={() => {
            try {
              sessionStorage.setItem(HEMEN_YAZDIR, id);
            } catch {
              /* yazdır tam sayfadan elle */
            }
          }}
          data-onizleme-yazdir
        >
          <Printer size={16} /> {t("yazdir")}
        </a>
      </div>
      <BaskiSayfasi baski={baski} />
      <div className="baski-onizleme" data-onizleme>
        <div className="onizleme-kagit">{belge(baski)}</div>
      </div>
    </Pencere>
  );
}
