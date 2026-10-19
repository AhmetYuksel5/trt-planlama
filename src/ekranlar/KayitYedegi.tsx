import { DatabaseBackup } from "lucide-react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { indir } from "../bilesenler/indir";
import { useDil } from "../dil";
import { GERCEK, useSunucuyaEsit } from "../kip";
import { simdi } from "../tarih";
import { getir } from "../veri";

/*
 * Ayarlar › Kaydın yedeği (yalnız tam yönetici): bütün kayıt tek JSON
 * dosyası olarak iniyor. Öneri akışının yeni düzenine geçişten önce elde
 * bir kopya olsun; geçiş bir şeyi bozarsa kayıt bu dosyadan okunabilir.
 * Gerçek kipte kayıt sunucuyla eşitlenmeden düğme kapalı: önbellekteki
 * bayat kopya yedek sanılmasın.
 */
export function KayitYedegi() {
  const { t } = useDil();
  const esit = useSunucuyaEsit();
  const hazir = !GERCEK || esit;
  const al = () => {
    const d = getir();
    const z = simdi();
    const n = Object.values(d).reduce((top, x) => top + (Array.isArray(x) ? x.length : 0), 0);
    const dosya = { tur: "plannersflow-yedek", zaman: z, kip: GERCEK ? "gercek" : "demo", kayit: d };
    indir(`plannersflow-yedek-${z.slice(0, 16).replace(/[T:]/g, "-")}.json`, JSON.stringify(dosya, null, 1), "application/json");
    bildir(t("ydIndi", { n }));
  };
  return (
    <Kart baslik={t("ydBaslik")} ikon={<DatabaseBackup size={18} />}>
      <div className="dugmeler">
        <button
          type="button"
          className="dugme dugme-ikincil"
          aria-disabled={!hazir || undefined}
          title={hazir ? undefined : t("ydEsitleniyor")}
          onClick={() => hazir && al()}
          data-yedek-indir
        >
          <DatabaseBackup size={16} /> {t("ydIndir")}
        </button>
      </div>
    </Kart>
  );
}
