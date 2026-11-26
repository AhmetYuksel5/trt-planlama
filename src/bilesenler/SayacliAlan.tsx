import { metin, useDil, type Anahtar } from "../dil";
import { Icerik, icerikAlani } from "./Parcalar";

/*
 * Öneri formunun sınırlı metin alanı: başlığı her arayüz dilinde Arapça ve
 * sağdan sola (kurumun formu), altında "125/300" sayacı. Sayaç boşlukları da
 * sayar (kurumun sınırı öyle). Metin kesilmez (kullanıcı: yapıştırılan uzun
 * metin sessizce kesiliyordu): sınırın %80'inde sayaç turuncu, aşınca kırmızı;
 * muhabir kısaltana dek gönderemez (form ve eylem sorar). `enAz` doluysa ve
 * altındaysa sayaçta "en az n".
 */
export function SayacliAlan({
  etiket,
  deger,
  degistir,
  sinir,
  satir = 4,
  ek,
  veri,
  enAz,
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
  /** Muhabirin kendi gönderiminde alt sınır. */
  enAz?: number;
}) {
  const { t } = useDil();
  const n = deger.trim().length;
  const ton = n > sinir ? " asti" : n >= sinir * 0.8 ? " yakin" : enAz && n > 0 && n < enAz ? " az" : "";
  return (
    <label className="sayacli-alan">
      <span className="sayacli-bas">
        <Icerik>{metin(etiket, "ar")}</Icerik>
        {ek}
      </span>
      <textarea {...icerikAlani} rows={satir} value={deger} onChange={(e) => degistir(e.target.value)} aria-invalid={n > sinir || undefined} {...{ [`data-${veri}`]: "" }} />
      <small className={`alan-sayaci${ton}`} aria-live="polite" data-sayac={veri}>
        {enAz && n < enAz && <span className="alan-sayaci-az">{t("ofEnAz", { n: enAz })} · </span>}
        {n}/{sinir}
      </small>
    </label>
  );
}
