import { ArrowDown, ArrowLeft, ArrowUp, Check, ClipboardCopy, FileDown, Pencil, Plus, Printer, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { wordIndir } from "../../bilesenler/indir";
import { bildir, icerikAlani } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { IkonDugme } from "../nextday/Bolumler";

/*
 * Belge görünümü: plan, çıktı belgesinin (الأجندة) kendisi üzerinde
 * düzenleniyor. Belge bileşeni tek; `duzen` verilmezse çıktı, verilirse
 * aynı kağıt yerinde yazı, satır şeridi ve pencereyle. Böylece ekranda
 * düzenlenen ile basılan ayrışamıyor. Şerit, yer tutucu ve ekleme
 * düğmeleri yalnız ekranda; baskı, Word ve kopya temiz kopyadan alınıyor.
 */

/*
 * Arapça belgenin içindeki arayüz parçası (şerit, ekle düğmesi, not)
 * arayüzün dilini taşıyor; taşımazsa ekran okuyucu Türkçe düğmeyi Arapça
 * okur. Şerit ve ekleme çubuğu ise kağıdın yönünde kalıyor: Arapça
 * satırın başında (sağda) açılsınlar; yazılı düğmenin içi arayüz yönünde.
 */
export function useArayuz() {
  const { dil } = useDil();
  return { lang: dil, dir: dil === "ar" ? "rtl" : "ltr" } as const;
}

/** Belgedeki yazı: basınca aynı yerde yazı kutusu. Enter ya da dışarı tıklama kaydeder, Esc vazgeçer; çok satırlıda Ctrl+Enter. */
export function YerindeMetin({
  deger,
  goster,
  kaydet,
  etiket,
  acik,
  cokSatir = false,
}: {
  deger: string;
  /** Değer boşken belgede görünen (ör. muhabirin şehri); düzenlenince yerine yazılan geçer. */
  goster?: string;
  kaydet: (yeni: string) => unknown;
  etiket: string;
  acik: boolean;
  cokSatir?: boolean;
}) {
  const arayuz = useArayuz();
  const [duzen, setDuzen] = useState(false);
  const [taslak, setTaslak] = useState("");
  // Esc'ten sonra kutu kalkarken gelen blur kaydetmesin.
  const vazgecildi = useRef(false);
  const gorunen = deger || goster || "";
  if (!acik) return <>{gorunen}</>;

  const baslat = () => {
    vazgecildi.current = false;
    setTaslak(deger);
    setDuzen(true);
  };
  if (!duzen)
    return (
      <span
        className={`yerinde${gorunen ? "" : " yerinde-bos"}`}
        role="button"
        tabIndex={0}
        title={etiket}
        aria-label={gorunen ? `${etiket}: ${gorunen}` : etiket}
        onClick={baslat}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            baslat();
          }
        }}
      >
        {gorunen || <span {...arayuz}>{etiket}</span>}
      </span>
    );

  const bitir = () => {
    setDuzen(false);
    if (!vazgecildi.current && taslak.trim() !== deger.trim()) kaydet(taslak.trim());
  };
  const ortak = {
    ...icerikAlani,
    className: `yerinde-kutu${cokSatir ? " cok" : ""}`,
    value: taslak,
    "aria-label": etiket,
    autoFocus: true,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTaslak(e.target.value),
    onBlur: bitir,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        vazgecildi.current = true;
        setDuzen(false);
      } else if (e.key === "Enter" && (!cokSatir || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
  };
  return cokSatir ? <textarea rows={Math.max(2, Math.ceil(taslak.length / 70))} {...ortak} /> : <input size={Math.max(6, taslak.length + 2)} {...ortak} />;
}

/** Satırın altındaki şerit ("oklar"): taşı, altına ekle, ayrıntılar, bugün de geçerli, çıkar. Verilmeyen düğme çizilmiyor. */
export function SatirSeridi({
  yukari,
  asagi,
  ekle,
  ekleEtiket,
  duzenle,
  onceki,
  ek,
  cikar,
  cikarEtiket,
}: {
  yukari?: () => unknown;
  asagi?: () => unknown;
  ekle?: () => unknown;
  ekleEtiket?: string;
  duzenle?: () => unknown;
  onceki?: () => unknown;
  ek?: ReactNode;
  cikar?: () => unknown;
  cikarEtiket?: string;
}) {
  const { t } = useDil();
  const arayuz = useArayuz();
  return (
    <div className="satir-seridi" lang={arayuz.lang}>
      {yukari && <IkonDugme ikon={<ArrowUp size={15} />} etiket={t("yukariTasi")} onClick={yukari} />}
      {asagi && <IkonDugme ikon={<ArrowDown size={15} />} etiket={t("asagiTasi")} onClick={asagi} />}
      {ekle && <IkonDugme ikon={<Plus size={15} />} etiket={ekleEtiket ?? t("altinaEkle")} onClick={ekle} />}
      {duzenle && <IkonDugme ikon={<Pencil size={15} />} etiket={t("duzenle")} onClick={duzenle} />}
      {onceki && <IkonDugme ikon={<Check size={15} />} etiket={t("bugunDeGecerli")} onClick={onceki} />}
      {ek}
      {cikar && <IkonDugme ikon={<X size={15} />} etiket={cikarEtiket ?? t("cikar")} ton="kotu-yazi" onClick={cikar} />}
    </div>
  );
}

/** Düzende satır ve şeridi bir arada; çıktıda yalnız satırın kendisi, sarıcı yok. */
export function BelgeSatiri({ duzen, onceki, soluk, serit, children }: { duzen: boolean; onceki?: boolean; soluk?: boolean; serit?: ReactNode; children: ReactNode }) {
  const { t } = useDil();
  if (!duzen) return <>{children}</>;
  return (
    <div className={`belge-satir${onceki ? " onceki" : ""}${soluk ? " soluk" : ""}`} title={onceki ? t("oncekiGunden") : undefined}>
      {children}
      {serit}
    </div>
  );
}

/** Bölümün ya da başlığın sonundaki ekleme düğmeleri. */
export function EkleCubugu({ children }: { children: ReactNode }) {
  return <div className="belge-ekle">{children}</div>;
}

export function EkleDugmesi({ metin, onClick }: { metin: string; onClick: () => void }) {
  const arayuz = useArayuz();
  return (
    <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={onClick} {...arayuz}>
      <Plus size={14} /> {metin}
    </button>
  );
}

/** Belgede yalnız ekranda görünen kısa açıklama. */
export function BelgeNotu({ children }: { children: ReactNode }) {
  const arayuz = useArayuz();
  return (
    <p className="belge-not" {...arayuz}>
      {children}
    </p>
  );
}

/** Onay sorup çalıştırır: belgede çıkarma bugünkü plan ekranındaki gibi soruluyor. */
export const onayla = (mesaj: string, f: () => unknown) => () => {
  if (confirm(mesaj)) f();
};

/** Çıktı ve belge sayfasının üst çubuğu: geri, ek bağlantılar, kopyala, Word, yazdır. Hepsi temiz belgeden. */
export function CiktiAraclari({
  geri,
  belge,
  word,
  yazdirMetni = "yazdir",
  ek,
}: {
  geri: { href: string; metin: string };
  belge: RefObject<HTMLElement | null>;
  word: { ad: string; baslik: string };
  yazdirMetni?: Anahtar;
  ek?: ReactNode;
}) {
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
    <div className="dugmeler yazdirma-gizle">
      <a className="geri-bag" href={geri.href}>
        <ArrowLeft size={14} className="yon" /> {geri.metin}
      </a>
      <span className="bosluk-esnek" />
      {ek}
      <button className="dugme dugme-ikincil" onClick={kopyala}>
        <ClipboardCopy size={16} /> {t("metniKopyala")}
      </button>
      <button className="dugme dugme-ikincil" onClick={() => wordIndir(word.ad, word.baslik, belge.current?.innerHTML ?? "")}>
        <FileDown size={16} /> {t("wordIndir")}
      </button>
      <button className="dugme" onClick={() => window.print()}>
        <Printer size={16} /> {t(yazdirMetni)}
      </button>
    </div>
  );
}
