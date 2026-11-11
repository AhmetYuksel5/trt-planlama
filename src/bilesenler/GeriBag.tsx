import { ArrowLeft } from "lucide-react";
import { useDil } from "../dil";
import { geriTikla, geriVarMi } from "../yol";

/*
 * Sayfanın "←" bağlantısı: uygulamanın içinden gelindiyse geldiği yere döner
 * ve adı "Geri"; bağlantıyla doğrudan açılmış sayfada sabit listeye (`href`)
 * gider ve adı listenin adı. Önce hep listeye gidiyordu (kullanıcı: geri
 * gelmiyor, başka yerden çıkıyor).
 */
export function GeriBag({ href, metin, ikon, className }: { href: string; metin: string; ikon?: boolean; className?: string }) {
  const { t } = useDil();
  const geri = geriVarMi();
  const ad = geri ? t("bolmeGeri") : metin;
  if (ikon)
    return (
      <a className={`dugme dugme-sade dugme-ikon pb-geri yazdirma-gizle${className ? ` ${className}` : ""}`} href={href} onClick={geriTikla} title={ad} aria-label={ad} data-geri-bag={geri ? "geri" : "liste"}>
        <ArrowLeft size={18} className="yon" />
      </a>
    );
  return (
    <a className={`geri-bag${className ? ` ${className}` : ""}`} href={href} onClick={geriTikla} data-geri-bag={geri ? "geri" : "liste"}>
      <ArrowLeft size={14} className="yon" /> {ad}
    </a>
  );
}
