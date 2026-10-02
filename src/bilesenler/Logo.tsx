import { useDil } from "../dil";

/*
 * Kanalın logosu her arayüz dilinde aynı: "TRT عربي". Arayüz Türkçe ya da
 * İngilizce seçilse de kanalın adı değişmiyor. Resmî logo dosyası
 * geldiğinde yalnız burası değişecek (dosya public/ altına, burada img).
 */
export default function Logo() {
  const { t } = useDil();
  return (
    <>
      <b>TRT</b>
      <span lang="ar">{t("markaArapca")}</span>
    </>
  );
}
