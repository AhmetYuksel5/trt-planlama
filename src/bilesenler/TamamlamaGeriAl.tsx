import { RotateCcw } from "lucide-react";
import { metin, useDil } from "../dil";
import { tamamlamaGeriAl } from "../eylemler";
import { useVeri, type Kisi, type Oneri, type Paket } from "../veri";
import { tamamlamaGeriAlabilir } from "../yetki";
import { bildir } from "./Parcalar";

/*
 * "Tamamlandı" yanlışlıkla basılabiliyor: bildirimde hemen "Geri al", sonradan
 * fark edilirse haberin sayfasında düğme. İkisi de aynı eylem; öneri ile
 * paketi birlikte açıyor.
 */
type Hedef = { oneriId?: string; paketId?: string };

export const tamamlandiBildir = (ben: Kisi, yazi: string, hedef: Hedef) =>
  bildir(yazi, { ad: metin("geriAl"), f: () => tamamlamaGeriAl(ben, hedef) && bildir(metin("bTamamlamaGeriAlindi")) });

export function TamamlamaGeriAlDugmesi({ ben, oneri, paket }: { ben: Kisi; oneri?: Oneri; paket?: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const o = oneri ?? (paket?.oneriId ? v.oneriler.find((x) => x.id === paket.oneriId) : undefined);
  const p = paket ?? (oneri ? v.paketler.find((x) => x.oneriId === oneri.id && x.durum === "tamamlandi" && !x.ozelId) : undefined);
  if (!tamamlamaGeriAlabilir(ben, v, o, p)) return null;
  return (
    <button
      type="button"
      className="dugme dugme-ikincil dugme-kucuk"
      onClick={() => tamamlamaGeriAl(ben, { oneriId: o?.id, paketId: p?.id }) && bildir(t("bTamamlamaGeriAlindi"))}
      data-tamamlama-geri-al
    >
      <RotateCcw size={14} /> {t("tamamlamayiGeriAl")}
    </button>
  );
}
