import { MessageSquare } from "lucide-react";
import { useDil } from "../dil";
import { konuAnahtari, konuKatilimcisi, konuMesajlari, okunmamisMi, paketKonusu } from "../mesajlasma";
import { useVeri, type Kisi, type Paket } from "../veri";
import { yapabilir } from "../yetki";

/*
 * İş kartındaki mesaj simgesi (masanın İçerikler'i, Stok, muhabirin
 * Yapılacaklar'ı): basınca işin konuşması Mesajlar'da açılır. Okunmamış
 * varsa sayısı vurgulu; boş konuşmada da durur, oradan yazışma başlar.
 * Yalnız katılımcıya.
 */
export function MesajRozeti({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const v = useVeri();
  const konu = paketKonusu(paket);
  if (!konuKatilimcisi(ben, v, konu, yapabilir(ben, "oneriDegerlendir"))) return null;
  const mesajlar = konuMesajlari(v, konu);
  const okuma = v.mesajOkunan?.[ben.id];
  const okunmamis = mesajlar.filter((m) => okunmamisMi(okuma, ben, m)).length;
  const ad = okunmamis ? t("msRozet", { sayi: String(okunmamis) }) : t("msRozetHepsi", { sayi: String(mesajlar.length) });
  return (
    <a
      href={`#/mesajlar/${konuAnahtari(konu)}`}
      className={`dugme dugme-ikincil dugme-ikon mesaj-rozeti${okunmamis ? " okunmamis" : ""}`}
      title={ad}
      aria-label={ad}
      data-mesaj-rozeti={okunmamis || ""}
    >
      <MessageSquare size={15} />
      {(okunmamis || mesajlar.length) > 0 && <em className="dugme-sayi">{okunmamis || mesajlar.length}</em>}
    </a>
  );
}
