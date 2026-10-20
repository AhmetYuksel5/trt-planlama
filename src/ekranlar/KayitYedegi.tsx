import { ArrowRightLeft, DatabaseBackup } from "lucide-react";
import { Kart, Rozet, bildir } from "../bilesenler/Parcalar";
import { indir } from "../bilesenler/indir";
import { useDil, type Anahtar } from "../dil";
import { yeniDuzeneGecir } from "../eylemler";
import { gecisOnizlemesi } from "../gecis";
import { GERCEK, useSunucuyaEsit } from "../kip";
import { simdi } from "../tarih";
import { getir, useVeri, type Kisi } from "../veri";

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

/*
 * Ayarlar › Yeni öneri düzenine geçiş (yalnız tam yönetici): kaç kaydın
 * neye taşınacağı önce görünür, onaylanınca uygulanır (gecis.ts). Gerçek
 * kipte eşitlenmeden pasif; yedek kartı hemen üstte, önce o alınsın.
 */
export function YeniDuzenGecisi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const esit = useSunucuyaEsit();
  const hazir = !GERCEK || esit;
  const o = gecisOnizlemesi(v);
  const satirlar: [Anahtar, number][] = [
    ["gcSonra", o.sonra],
    ["gcEposta", o.eposta],
    ["gcKopya", o.kopya],
    ["gcTakip", o.takip],
    ["gcPlanda", o.planda],
    ["gcKapali", o.kapali],
  ];
  const uygula = () => {
    if (!confirm(t("gcOnay", { n: o.toplam }))) return;
    const n = yeniDuzeneGecir(ben);
    if (n !== null) bildir(t("bGecis", { n }));
  };
  return (
    <Kart baslik={t("gcBaslik")} ikon={<ArrowRightLeft size={18} />}>
      {o.toplam === 0 ? (
        <p data-gecis-tamam>
          <Rozet ton="iyi">{t("gcTamam")}</Rozet>
        </p>
      ) : (
        <>
          <ul className="liste" data-gecis-onizleme>
            {satirlar.map(([a, n]) => (
              <li key={a}>
                <span>{t(a)}</span> <b data-gecis-sayi={a}>{n}</b>
              </li>
            ))}
          </ul>
          <div className="dugmeler ara-ust-2">
            <button type="button" className="dugme" aria-disabled={!hazir || undefined} title={hazir ? undefined : t("ydEsitleniyor")} onClick={() => hazir && uygula()} data-gecis-uygula>
              {t("gcUygula")}
            </button>
          </div>
        </>
      )}
    </Kart>
  );
}
