import { useEffect, useRef, type ReactNode } from "react";

/*
 * Etkileşim ilkeleri (örnek sayfa: kullanıcının seçtiği dokuz ilkeden bizde olanlar).
 * Titreşim: "Bugün de geçerli" gibi yerinde onaylanan işte kişinin gözü sonucu
 * görsün diye satır bir kez nabız atar. İşaret React'in yönetmediği `data-nabiz`
 * özniteliğinde: satırın sınıfı (onceki fonu kalkınca) yeniden yazılsa da sürsün.
 */
export function nabizAt(el: Element | null | undefined, tur: "" | "sicra" = "") {
  if (!(el instanceof HTMLElement)) return;
  el.removeAttribute("data-nabiz");
  void el.offsetWidth; // aynı satıra ikinci basışta animasyon baştan başlasın
  el.setAttribute("data-nabiz", tur);
  const bitir = () => el.removeAttribute("data-nabiz");
  el.addEventListener("animationend", bitir, { once: true });
  setTimeout(bitir, 900);
}

/** Basılan düğmenin satırına (belge satırı, kayıt kutusu, başlık) nabız. */
export const satiraNabiz = (dugme: Element | null) => nabizAt(dugme?.closest(".belge-satir, .kayit, .baslik-karti, li") ?? dugme);

/*
 * Simgenin durum değişimi (kopyalandı, gönderildi): iki simge üst üste, biri
 * bulanıklaşıp küçülürken öbürü belirir. Simge bir anda değişince göz kaçırıyordu.
 */
export function SimgeGecisi({ acik, once, sonra }: { acik: boolean; once: ReactNode; sonra: ReactNode }) {
  return (
    <span className="simge-gecis" data-simge-gecis={acik ? "sonra" : "once"} aria-hidden="true">
      <span className={acik ? "gizli" : ""}>{once}</span>
      <span className={acik ? "" : "gizli"}>{sonra}</span>
    </span>
  );
}

/*
 * Toplantıda verilen kararın rozeti: değer değişince bir kez sıçrar (karar
 * klavyeyle verilip seçim sonraki kaleme geçtiği için göz eski kalemde kalmıyor).
 * Son görülen değer kimliğe bağlı modül belleğinde: kabul edilen paket "PKG
 * PROPOSAL"dan "PKG" grubuna geçerken satırı yeniden kuruluyor, bileşenin kendi
 * belleği değişimi göremiyordu. İlk görülüş sayılmaz: sayfa açılırken rozetler oynamasın.
 */
const sonDegerler = new Map<string, unknown>();
export function Sicra({ kimlik, deger, children }: { kimlik: string; deger: unknown; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const once = sonDegerler.get(kimlik);
    sonDegerler.set(kimlik, deger);
    if (once !== undefined && once !== deger) nabizAt(ref.current, "sicra");
  }, [kimlik, deger]);
  return (
    <span ref={ref} className="sicra">
      {children}
    </span>
  );
}
