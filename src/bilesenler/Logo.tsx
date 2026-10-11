import logoAcik from "../varliklar/logo-plannersflow.png";
import logoKoyu from "../varliklar/logo-plannersflow-koyu.png";

/*
 * Plannersflow markası her arayüz dilinde aynı; Arapçada aynalanmıyor.
 * Yatay düzen (işaret solda, yazı sağda): menü ve üst çubuğun alçak
 * satırında alt alta düzenin yazısı okunmaz kalıyordu.
 *
 * Koyu zeminde (sol menü, giriş, proje planı) "Planners" beyaz sürüm;
 * lacivert yazı orada kaybolur. Boyu bulunduğu yerin CSS token'ından.
 */
export default function Logo({ koyu = false }: { koyu?: boolean }) {
  return <img className="logo" src={koyu ? logoKoyu : logoAcik} alt="Plannersflow" />;
}
