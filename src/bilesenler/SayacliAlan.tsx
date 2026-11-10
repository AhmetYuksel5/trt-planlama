import { metin, type Anahtar } from "../dil";
import { Icerik, icerikAlani } from "./Parcalar";

/*
 * Öneri formunun sınırlı metin alanı: başlığı her arayüz dilinde Arapça ve
 * sağdan sola (kurumun formu), altında "125/500" sayacı. Sayaç boşlukları da
 * sayar (kurumun sınırı öyle). maxLength yazarken aşmayı engeller; e-postadan
 * gelen uzun metin kesilmez, sayaç aşımı kırmızı gösterir, yalnız silinebilir.
 */
export function SayacliAlan({
  etiket,
  deger,
  degistir,
  sinir,
  satir = 4,
  ek,
  veri,
}: {
  etiket: Anahtar;
  deger: string;
  degistir: (s: string) => void;
  sinir: number;
  satir?: number;
  /** Etiketin yanındaki küçük not ("varsa"). */
  ek?: React.ReactNode;
  /** Test ve seçim için data-* adı. */
  veri: string;
}) {
  const n = deger.length;
  // Sınırı aşan eski metinde (e-posta) sınır şimdiki uzunluk: büyümez, kısalır.
  return (
    <label className="sayacli-alan">
      <span className="sayacli-bas">
        <Icerik>{metin(etiket, "ar")}</Icerik>
        {ek}
      </span>
      <textarea {...icerikAlani} rows={satir} maxLength={Math.max(sinir, n)} value={deger} onChange={(e) => degistir(e.target.value)} {...{ [`data-${veri}`]: "" }} />
      <small className={`alan-sayaci${n > sinir ? " asti" : ""}`} aria-live="polite" data-sayac={veri}>
        {n}/{sinir}
      </small>
    </label>
  );
}
