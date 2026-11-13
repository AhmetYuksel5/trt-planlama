import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { useMemo } from "react";
import { indir } from "../../bilesenler/indir";
import { Bos, Kart } from "../../bilesenler/Parcalar";
import { KisiCipi } from "../../bilesenler/KisiCipi";
import { csvMetni } from "../../csv";
import { ayAdi, tarihYaz, useDil, type Anahtar } from "../../dil";
import { sehirAdi } from "../../etiketler";
import { ayKaydir } from "../../muhasebe";
import { muhabirRaporu, RAPOR_SUTUNLARI, sutunDegeri, type MuhabirAyi, type MuhabirRaporSatiri, type RaporSutunu } from "../../muhabirRaporu";
import { bugun } from "../../tarih";
import { useVeri, type Kisi } from "../../veri";
import { useAdimDurumu } from "../../yol";

/*
 * Muhabir raporu (yeni tasarımda Raporlar'ın ilk sekmesi; kurallar
 * muhabirRaporu.ts): ay seçici, bir önceki ayla fark (▲▼), başlığa basınca
 * sıralanan tablo, işi olmayan muhabir soluk, ada basınca kişi kartı ve
 * dosyası. CSV ekrandaki tablonun aynısı, sıralamasıyla.
 */

const SUTUN_ADI: Record<RaporSutunu, Anahtar> = {
  oneri: "mrOneri",
  kabulOrani: "mrKabul",
  verilen: "mrVerilen",
  biten: "mrBiten",
  yapilmayan: "mrYapilmayan",
  yanitOrani: "mrYanit",
  sonIs: "mrSonIs",
};

const yuzde = (x: number | null) => (x === null ? "—" : `%${Math.round(x * 100)}`);

function Fark({ bu, onceki }: { bu: number; onceki: number }) {
  const { t } = useDil();
  const f = bu - onceki;
  if (!f) return null;
  return (
    <span className={`mr-fark ${f > 0 ? "artti" : "azaldi"}`} title={t("mrOncekiAy", { n: onceki })} aria-label={t("mrOncekiAy", { n: onceki })}>
      {f > 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(f)}
    </span>
  );
}

const hucre = (c: RaporSutunu, a: MuhabirAyi, sonIs: string | undefined, dil: Parameters<typeof tarihYaz>[1]) =>
  c === "sonIs" ? (sonIs ? tarihYaz(sonIs, dil, "kisa") : "—") : c === "kabulOrani" || c === "yanitOrani" ? yuzde(a[c]) : String(a[c]);

export default function MuhabirRaporu({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const buAy = bugun().slice(0, 7);
  const [ayi, setAy] = useAdimDurumu("raporlar:ay", buAy);
  const [sira, setSira] = useAdimDurumu<RaporSutunu>("raporlar:sira", "biten");
  const satirlar = useMemo(() => muhabirRaporu(v, ayi), [v, ayi]);
  const sirali = useMemo(() => {
    const deger = (s: MuhabirRaporSatiri) => sutunDegeri(s, sira);
    return [...satirlar].sort((a, b) => {
      const x = deger(a), y = deger(b);
      if (x === null && y !== null) return 1;
      if (y === null && x !== null) return -1;
      if (x !== null && y !== null && x !== y) return x < y ? 1 : -1;
      return ad(a.kisi).localeCompare(ad(b.kisi), "ar");
    });
  }, [satirlar, sira, ad]);
  const toplam = (k: "oneri" | "verilen" | "biten" | "yapilmayan") => satirlar.reduce((n, s) => n + s.bu[k], 0);
  const toplamOnceki = (k: "oneri" | "verilen" | "biten" | "yapilmayan") => satirlar.reduce((n, s) => n + s.onceki[k], 0);
  const csv = () =>
    indir(
      `muhabir-raporu-${ayi}.csv`,
      csvMetni(
        [
          [t("muhabir"), t("sehir"), ...RAPOR_SUTUNLARI.map((c) => t(SUTUN_ADI[c])), t("mrBitenCanli")],
          ...sirali.map((s) => [ad(s.kisi), s.kisi.sehir ? sehirAdi(s.kisi.sehir) : "", ...RAPOR_SUTUNLARI.map((c) => hucre(c, s.bu, s.sonIs, dil)), s.bu.bitenCanli]),
        ],
        dil,
      ),
      "text/csv;charset=utf-8",
    );
  return (
    <div className="mr" data-muhabir-raporu>
      <div className="mr-ust">
        <div className="ay-secici" role="group" aria-label={t("mrAy")}>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAy(ayKaydir(ayi, -1))} aria-label={t("oncekiAy")} title={t("oncekiAy")} data-mr-ay="-1">
            <ChevronLeft size={16} className="yon" />
          </button>
          <strong data-mr-ay-adi={ayi}>{ayAdi(`${ayi}-01`, dil, "yil")}</strong>
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setAy(ayKaydir(ayi, 1))} disabled={ayi >= buAy} aria-label={t("sonrakiAy")} title={t("sonrakiAy")} data-mr-ay="1">
            <ChevronRight size={16} className="yon" />
          </button>
        </div>
        <button type="button" className="dugme dugme-ikincil" onClick={csv} data-mr-csv>
          <FileDown size={16} /> {t("rpCsv")}
        </button>
      </div>
      <div className="mr-ozet">
        {(["oneri", "verilen", "biten", "yapilmayan"] as const).map((k) => (
          <div key={k} className="mr-ozet-kutu" data-mr-ozet={k}>
            <span className="sonuk">{t(SUTUN_ADI[k])}</span>
            <b>
              {toplam(k)} <Fark bu={toplam(k)} onceki={toplamOnceki(k)} />
            </b>
          </div>
        ))}
      </div>
      <Kart>
        {!satirlar.length ? (
          <Bos kucuk metin={t("kayitYok")} />
        ) : (
          <table className="tablo kartli mr-tablo">
            <thead>
              <tr>
                <th>{t("muhabir")}</th>
                {RAPOR_SUTUNLARI.map((c) => (
                  <th key={c} aria-sort={sira === c ? "descending" : undefined}>
                    <button type="button" className={`mr-sirala${sira === c ? " secili" : ""}`} onClick={() => setSira(c)} data-mr-sirala={c}>
                      {t(SUTUN_ADI[c])}
                      {sira === c && <ArrowDown size={12} />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sirali.map((s) => (
                <tr key={s.kisi.id} className={s.bos ? "soluk" : ""} data-mr-satir={s.kisi.id}>
                  <td className="birincil" data-etiket={t("muhabir")}>
                    <KisiCipi ben={ben} kisi={s.kisi} />
                    <small className="sonuk">{[s.kisi.sehir && sehirAdi(s.kisi.sehir), s.ic && t("mrIc")].filter(Boolean).join(" · ")}</small>
                  </td>
                  {RAPOR_SUTUNLARI.map((c) => (
                    <td key={c} data-etiket={t(SUTUN_ADI[c])} data-mr-hucre={c}>
                      {hucre(c, s.bu, s.sonIs, dil)}
                      {(c === "oneri" || c === "verilen" || c === "biten" || c === "yapilmayan") && <Fark bu={s.bu[c]} onceki={s.onceki[c]} />}
                      {c === "biten" && s.bu.bitenCanli > 0 && <small className="sonuk"> ({t("mrCanliSay", { n: s.bu.bitenCanli })})</small>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Kart>
    </div>
  );
}
