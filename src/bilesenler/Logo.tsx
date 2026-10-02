import { useDil } from "../dil";
import logo from "../varliklar/logo-trt-arabi.png";

/*
 * Kanalın resmî logosu her arayüz dilinde aynı: "TRT عربي". Arayüz
 * Türkçe ya da İngilizce seçilse de kanalın adı değişmiyor, Arapçada
 * aynalanmıyor.
 *
 * Logonun "عربي" kısmı koyu lacivert; koyu zeminde kaybolmasın diye
 * orada `levha` ile beyaz bir zeminin üstünde duruyor. Logo dosyasının
 * kendisine dokunulmuyor. Boyu bulunduğu yerin CSS token'ından geliyor.
 */
export default function Logo({ levha = false }: { levha?: boolean }) {
  const { t } = useDil();
  const resim = <img className="logo" src={logo} alt={`TRT ${t("markaArapca")}`} />;
  return levha ? <span className="logo-levha">{resim}</span> : resim;
}
