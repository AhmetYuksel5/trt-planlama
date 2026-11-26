import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { useDil } from "../dil";
import { gorselAdresi, gorselSayfasi, gorselYukle } from "../gorsel";
import { GERCEK } from "../kip";
import { GORSEL_SINIRI, useVeri, type Kisi, type OneriGorseli } from "../veri";
import { kisiAr } from "../etiketler";
import { yaz } from "../dil";
import { Pencere, bildir } from "./Parcalar";

/* Formda görsel ekleme: küçük resimler, kaldırma ve "Görsel ekle". Adres tanımlı değilse (gerçek kip) çizilmez. */
export function GorselEkleAlani({ ben, gorseller, degistir }: { ben: Kisi; gorseller: OneriGorseli[]; degistir: (g: OneriGorseli[]) => void }) {
  const { t } = useDil();
  const v = useVeri();
  const [yukleniyor, setYukleniyor] = useState(0);
  if (GERCEK && !v.gorselAdresi) return null;
  const sec = async (dosyalar: FileList | null) => {
    const l = [...(dosyalar ?? [])].slice(0, GORSEL_SINIRI - gorseller.length);
    if (!l.length) return;
    setYukleniyor(l.length);
    let yeni = gorseller;
    for (const f of l) {
      // Klasör kişinin adıyla: Latin yazımı varsa o (Drive'da aranırken), yoksa Arapça.
      const r = await gorselYukle(f, v.gorselAdresi, { id: ben.id, ad: yaz(ben.ad, "tr") || kisiAr(ben) });
      if (r.tamam) {
        yeni = [...yeni, r.gorsel];
        degistir(yeni);
      } else bildir(`${t("grHata")} (${r.hata})`);
      setYukleniyor((x) => x - 1);
    }
  };
  return (
    <div className="gorsel-alani" data-gorsel-alani>
      {gorseller.map((g) => (
        <span key={g.id} className="gorsel-kucuk">
          <img src={gorselAdresi(g, 200)} alt={g.ad ?? ""} loading="lazy" />
          <button type="button" onClick={() => degistir(gorseller.filter((x) => x.id !== g.id))} title={t("grKaldir")} aria-label={t("grKaldir")} data-gorsel-kaldir>
            <X size={14} />
          </button>
        </span>
      ))}
      {yukleniyor > 0 && <span className="gorsel-kucuk yukleniyor" aria-live="polite">{t("grYukleniyor")}</span>}
      {gorseller.length + yukleniyor < GORSEL_SINIRI && (
        <label className="dugme dugme-ikincil dugme-kucuk gorsel-ekle" data-gorsel-ekle>
          <ImagePlus size={16} /> {t("grEkle")}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => (void sec(e.target.files), (e.target.value = ""))} data-gorsel-dosya />
        </label>
      )}
    </div>
  );
}

/* Öneride görseller: küçük resimler, basınca büyük hali pencerede. */
export function GorselListesi({ gorseller }: { gorseller?: OneriGorseli[] }) {
  const { t } = useDil();
  const [acik, setAcik] = useState<OneriGorseli | null>(null);
  if (!gorseller?.length) return null;
  return (
    <div>
      <div className="alan-etiket">{t("grGorseller")}</div>
      <div className="gorsel-alani" data-gorsel-listesi>
        {gorseller.map((g) => (
          <button key={g.id} type="button" className="gorsel-kucuk" onClick={() => setAcik(g)} aria-label={g.ad ?? t("grGorseller")} data-gorsel>
            <img src={gorselAdresi(g, 200)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {acik && (
        <Pencere genis baslik={acik.ad ?? t("grGorseller")} kapat={() => setAcik(null)}>
          <a href={gorselSayfasi(acik)} target="_blank" rel="noreferrer" className="gorsel-buyuk">
            <img src={gorselAdresi(acik, 1600)} alt={acik.ad ?? ""} />
          </a>
        </Pencere>
      )}
    </div>
  );
}
