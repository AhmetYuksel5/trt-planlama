import { X } from "lucide-react";
import { useDil } from "../../dil";
import { paketPlanNotuSil } from "../../eylemler";
import type { Kisi, Paket } from "../../veri";
import { IkonDugme } from "./Bolumler";

const ALANLAR = ["planIsleme", "planGorsel"] as const;

/*
 * Önerinin işleme fikri ve görsel işlemesi, planlamacı plana eklerken
 * istediyse: PKG satırının altında içeriden, italik, alt alta (kullanıcı).
 * Plan ekranı, belge ve çıktı aynı satırı çizer; düzenleyende yanında
 * kaldırma düğmesi (`ben` verilince), çıktıda ve Word'de yalnız metin.
 */
export function PaketPlanNotlari({ paket, ben }: { paket: Paket; ben?: Kisi }) {
  const { t } = useDil();
  const alanlar = ALANLAR.filter((a) => paket[a]);
  if (!alanlar.length) return null;
  return (
    <>
      {alanlar.map((a) => (
        <p key={a} className="cikti-pkg-not" dir="rtl" lang="ar" data-pkg-not={a}>
          <i>{paket[a]}</i>
          {ben && (
            <IkonDugme ikon={<X size={14} />} etiket={t("pkgNotuSil")} onClick={() => confirm(t("silinsinMi")) && paketPlanNotuSil(ben, paket.id, a)} />
          )}
        </p>
      ))}
    </>
  );
}
