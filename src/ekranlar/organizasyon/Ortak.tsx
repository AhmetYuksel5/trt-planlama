import type { ReactNode } from "react";
import { metin, useDil, type Anahtar, type Metin, type Yazi } from "../../dil";

/* Organizasyon sekmelerinin ortak parçaları. */

/* --- Ad: üç dilde; yerleşikte boş bırakılan dil tablosundaki adı kullanıyor --- */

export const metinMi = (x: Yazi | undefined): x is Metin =>
  !!x && typeof x !== "string";

export function AdAlanlari({
  deger,
  varsayilan,
  degistir,
}: {
  deger: Yazi | undefined;
  varsayilan?: Metin;
  degistir: (m: Metin) => void;
}) {
  const { t } = useDil();
  const m: Metin = metinMi(deger)
    ? deger
    : { tr: deger ?? "", ar: deger ?? "", en: deger ?? "" };
  return (
    <>
      <label>
        {t("adTurkce")}
        <input
          value={m.tr}
          placeholder={varsayilan?.tr}
          onChange={(e) => degistir({ ...m, tr: e.target.value })}
          data-ad-tr
        />
      </label>
      <label>
        {t("adArapca")}
        <input
          dir="rtl"
          lang="ar"
          value={m.ar}
          placeholder={varsayilan?.ar}
          onChange={(e) => degistir({ ...m, ar: e.target.value })}
          data-ad-ar
        />
      </label>
      <label>
        {t("adIngilizce")}
        <input
          dir="ltr"
          value={m.en}
          placeholder={varsayilan?.en}
          onChange={(e) => degistir({ ...m, en: e.target.value })}
          data-ad-en
        />
      </label>
    </>
  );
}

/* Boş dil Türkçeden; hepsi boşsa ad yok (yerleşikte dil tablosundaki ada dönüyor). */
export const adTemizle = (m: Metin | undefined): Metin | undefined => {
  if (!m) return undefined;
  const tr = m.tr.trim() || m.en.trim() || m.ar.trim();
  if (!tr) return undefined;
  return { tr, ar: m.ar.trim() || tr, en: m.en.trim() || tr };
};

/** Sınırdaki düğme: pasif görünür, odaklanır, nedeni ipucunda (CLAUDE.md: aria-disabled). Simge düğmesinde ad `etiket`. */
export function SinirliDugme({
  izin,
  neden,
  onClick,
  children,
  etiket,
  ...p
}: {
  izin: boolean;
  neden: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  etiket?: string;
  "data-sil"?: string;
}) {
  return (
    <button
      type="button"
      className={p.className}
      aria-disabled={!izin}
      title={izin ? etiket : neden}
      aria-label={etiket}
      onClick={() => izin && onClick()}
      data-sil={p["data-sil"]}
    >
      {children}
    </button>
  );
}

/* Yerleşiğin dil tablosundaki adı üç dilde (yer tutucu): yöneticinin verdiği ad değil. */
export const dilde = (k: Anahtar): Metin => ({
  tr: metin(k, "tr"),
  ar: metin(k, "ar"),
  en: metin(k, "en"),
});
