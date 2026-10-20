import { RotateCcw } from "lucide-react";
import { metin, useDil } from "../dil";
import { tamamlamaGeriAl } from "../eylemler";
import { useVeri, type Kisi, type Paket } from "../veri";
import { tamamlamaGeriAlabilir } from "../yetki";
import { bildir } from "./Parcalar";

/*
 * Onaylanmış "Yapıldı" yanlışlıkla olabiliyor: bildirimde hemen "Geri al",
 * sonradan fark edilirse paketin sayfasında düğme. İkisi de aynı eylem.
 */
type Hedef = { paketId?: string };

export const tamamlandiBildir = (ben: Kisi, yazi: string, hedef: Hedef) =>
  bildir(yazi, { ad: metin("geriAl"), f: () => tamamlamaGeriAl(ben, hedef) && bildir(metin("bTamamlamaGeriAlindi")) });

export function TamamlamaGeriAlDugmesi({ ben, paket: p }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  if (!tamamlamaGeriAlabilir(ben, v, p)) return null;
  return (
    <button
      type="button"
      className="dugme dugme-ikincil dugme-kucuk"
      onClick={() => tamamlamaGeriAl(ben, { paketId: p.id }) && bildir(t("bTamamlamaGeriAlindi"))}
      data-tamamlama-geri-al
    >
      <RotateCcw size={14} /> {t("tamamlamayiGeriAl")}
    </button>
  );
}
