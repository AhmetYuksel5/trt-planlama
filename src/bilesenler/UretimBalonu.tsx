import { CirclePlay, CircleCheck, Route, Save } from "lucide-react";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useDil } from "../dil";
import { uretimSablonuDuzenler, uretimSablonuKaydet, uretimYoluDegistir, uretimiBaslat, type UretimSecimi } from "../eylemler";
import {
  ASAMA_ADI,
  PARCA_ADI,
  URETIM_ASAMALARI,
  URETIM_MASALARI,
  gecenAsamalar,
  istisnaAsamalari,
  paketSablonu,
  sablonAdi,
  uretimSablonlari,
  type UretimAsamasi,
  type UretimMasasi,
} from "../uretim";
import { useVeri, type Kisi, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { uretimYoluBelirleyebilir } from "../yetki";
import { Pencere, bildir } from "./Parcalar";

/* Masanın rengi; birim renkleri tasarım dilinde (`--masa-*`), olmayan nötr. */
const masaRengi = (m: UretimMasasi) => (m === "atla" ? "var(--sonuk)" : `var(--masa-${m}, var(--vurgu))`);

/*
 * Üretim balonu (kullanıcı): paket onaylanınca her aşamanın masası tiklerle
 * seçilir, şablon paketin türüne göre seçili gelir; istisna satırı sarı.
 * Sık kullanılan düzen "Şablon olarak kaydet"le saklanır. Üretimdeki pakette
 * geçmiş aşamalar kilitli, yalnız kalan aşamalar değişir.
 */
export function UretimBalonu({ ben, paket, kapat }: { ben: Kisi; paket: Paket; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const sablonlar = uretimSablonlari(v);
  const uretimde = paket.durum === "uretimde" && !!paket.uretim;
  const [secim, setSecim] = useState<UretimSecimi>(() => {
    if (paket.uretim) return { sablon: paket.uretim.sablon, yol: { ...paket.uretim.yol }, parca: { ...paket.uretim.parca } };
    const s = paketSablonu(v, paket);
    return { sablon: s.id, yol: { ...s.yol }, parca: { ...s.parca } };
  });
  const [kayit, setKayit] = useState<string | null>(null);
  const gecen = gecenAsamalar(paket);
  const sablon = sablonlar.find((s) => s.id === secim.sablon);
  const istisna = istisnaAsamalari(secim, sablon);
  const parcaKilitli = gecen.includes("editoryal");

  const sablonSec = (id: string) => {
    const s = sablonlar.find((x) => x.id === id);
    if (!s) return;
    setSecim((o) => ({
      sablon: s.id,
      yol: Object.fromEntries(URETIM_ASAMALARI.map((a) => [a, gecen.includes(a) ? o.yol[a] : s.yol[a]])) as UretimSecimi["yol"],
      parca: parcaKilitli ? o.parca : { ...s.parca },
    }));
  };

  const gonder = () => {
    const tamam = uretimde ? uretimYoluDegistir(ben, paket.id, secim) : uretimiBaslat(ben, paket.id, secim);
    if (!tamam) return;
    bildir(t(uretimde ? "bYolGuncellendi" : "bUretimBasladi"));
    kapat();
  };
  const sablonKaydet = (e: FormEvent) => {
    e.preventDefault();
    const id = kayit?.trim() && uretimSablonuKaydet(ben, { ...secim, ad: kayit });
    if (!id) return;
    setSecim((o) => ({ ...o, sablon: id }));
    setKayit(null);
    bildir(t("bSablonKaydedildi"));
  };

  return (
    <Pencere
      genis
      baslik={t("urBalon")}
      alt={paket.baslik}
      kapat={kapat}
      altBilgi={
        <div className="uretim-alt">
          <span className="sonuk-yazi" data-uretim-fark={istisna.length}>
            {istisna.length ? t("urFark", { n: istisna.length }) : sablon ? t("urAyni", { ad: sablonAdi(sablon) }) : ""}
          </span>
          <span className="dugmeler">
            {uretimSablonuDuzenler(ben) && kayit === null && (
              <button type="button" className="dugme dugme-ikincil" onClick={() => setKayit("")} data-uretim-sablon-ac>
                <Save size={15} /> {t("urSablonKaydet")}
              </button>
            )}
            <button type="button" className="dugme" onClick={gonder} data-uretim-gonder>
              <CircleCheck size={15} /> {t(uretimde ? "urGuncelle" : "urBaslat")}
            </button>
          </span>
        </div>
      }
    >
      <div className="uretim-sablonlar" role="group" aria-label={t("urSablon")} data-uretim-sablonlar>
        {sablonlar.map((s) => (
          <button key={s.id} type="button" className="secim-hap" aria-pressed={s.id === secim.sablon} onClick={() => sablonSec(s.id)} data-uretim-sablon={s.id}>
            {sablonAdi(s)}
          </button>
        ))}
      </div>
      {kayit !== null && (
        <form className="uretim-kaydet" onSubmit={sablonKaydet} data-uretim-sablon-formu>
          <input value={kayit} onChange={(e) => setKayit(e.target.value)} placeholder={t("urSablonAdi")} aria-label={t("urSablonAdi")} autoFocus data-uretim-sablon-adi />
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => setKayit(null)}>
            {t("iptal")}
          </button>
          <button type="submit" className="dugme dugme-kucuk" disabled={!kayit.trim()}>
            {t("kaydet")}
          </button>
        </form>
      )}
      <UretimTablosu secim={secim} setSecim={setSecim} gecen={gecen} istisna={istisna} />
    </Pencere>
  );
}


/*
 * Aşama × masa tik tablosu: balon ve Organizasyon'daki şablon düzenleme
 * aynı tabloyu kullanıyor. Geçmiş aşamalar (üretimdeki pakette) kilitli,
 * gfx seçilmezse grafik satırı kapalı, şablondan farklı satır sarı.
 */
export function UretimTablosu({
  secim,
  setSecim,
  gecen = [],
  istisna = [],
}: {
  secim: UretimSecimi;
  setSecim: (f: (o: UretimSecimi) => UretimSecimi) => void;
  gecen?: UretimAsamasi[];
  istisna?: UretimAsamasi[];
}) {
  const { t } = useDil();
  const parcaKilitli = gecen.includes("editoryal");
  const tikle = (a: UretimAsamasi, m: UretimMasasi) => setSecim((o) => ({ ...o, yol: { ...o.yol, [a]: m } }));
  const parcaDegis = (k: "stand" | "gfx", x: boolean) => setSecim((o) => ({ ...o, parca: { ...o.parca, [k]: x || undefined } }));
  return (
      <div className="uretim-tablo-kap">
        <table className="uretim-tablo" data-uretim-tablo>
          <thead>
            <tr>
              <th scope="col">{t("urAsama")}</th>
              {URETIM_MASALARI.map((m) => (
                <th key={m} scope="col">
                  <i style={{ background: masaRengi(m) }} />
                  {birimAdi(m)}
                </th>
              ))}
              <th scope="col">{t("urAtla")}</th>
            </tr>
          </thead>
          <tbody>
            {URETIM_ASAMALARI.map((a) => {
              const kilit = gecen.includes(a);
              const kapali = a === "grafik" && !secim.parca.gfx;
              const fark = !kilit && !kapali && istisna.includes(a);
              return (
                <tr key={a} className={kilit ? "gecti" : kapali ? "kapali" : fark ? "istisna" : ""} data-uretim-asama={a}>
                  <th scope="row">
                    <span className="uretim-asama-adi">{t(ASAMA_ADI[a])}</span>
                    {(kilit || kapali || fark) && <span className="uretim-etiket">{t(kilit ? "urYapildi" : kapali ? "urGfxYok" : "urIstisna")}</span>}
                    {a === "editoryal" && (
                      <span className="uretim-parcalar">
                        <label>
                          <input type="checkbox" checked disabled />
                          {t(PARCA_ADI.metin)}
                        </label>
                        {(["stand", "gfx"] as const).map((k) => (
                          <label key={k}>
                            <input type="checkbox" checked={!!secim.parca[k]} disabled={parcaKilitli} onChange={(e) => parcaDegis(k, e.target.checked)} data-uretim-parca={k} />
                            {t(PARCA_ADI[k])} ({t("urVarsa")})
                          </label>
                        ))}
                      </span>
                    )}
                    {a === "yukleme" && secim.parca.gfx && <small className="sonuk-yazi">{t("urYuklemeBekler")}</small>}
                  </th>
                  {[...URETIM_MASALARI, "atla" as const].map((m) => (
                    <td key={m}>
                      <button
                        type="button"
                        role="radio"
                        className={`uretim-tik${m === "atla" ? " atla" : ""}`}
                        aria-checked={secim.yol[a] === m}
                        aria-label={`${t(ASAMA_ADI[a])}: ${m === "atla" ? t("urAtla") : birimAdi(m)}`}
                        disabled={kilit || kapali}
                        style={{ "--renk": masaRengi(m) } as CSSProperties}
                        onClick={() => tikle(a, m)}
                        data-uretim-tik={`${a}:${m}`}
                      >
                        ✓
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
  );
}

/** Balonu açan düğme: onaylı pakette "Üretim yolunu belirle", balonla yürüyen pakette "Yolu düzenle". */
export function UretimBalonuDugmesi({ ben, paket, kucuk = false }: { ben: Kisi; paket: Paket; kucuk?: boolean }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  if (!uretimYoluBelirleyebilir(ben, paket)) return null;
  const duzen = paket.durum === "uretimde";
  return (
    <>
      <button type="button" className={`dugme${duzen ? " dugme-ikincil" : ""}${kucuk ? " dugme-kucuk" : ""}`} onClick={() => setAcik(true)} data-uretim-ac={paket.id}>
        <Route size={15} /> {t(duzen ? "urDuzenle" : "urBelirle")}
      </button>
      {acik && <UretimBalonu ben={ben} paket={paket} kapat={() => setAcik(false)} />}
    </>
  );
}

/* Listelerdeki "Üretime al" (plansız ve masa paketi): artık doğrudan değil, balonla; yol seçilip başlatılıyor. */
export function UretimeAlDugmesi({ ben, paket }: { ben: Kisi; paket: Paket }) {
  const { t } = useDil();
  const [acik, setAcik] = useState(false);
  return (
    <>
      <button type="button" className="dugme dugme-kucuk" onClick={() => setAcik(true)} data-uretime-al={paket.id}>
        <CirclePlay size={14} /> {t("uretimeAl")}
      </button>
      {acik && <UretimBalonu ben={ben} paket={paket} kapat={() => setAcik(false)} />}
    </>
  );
}
