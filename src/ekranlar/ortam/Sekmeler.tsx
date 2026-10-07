import { ChevronDown, Columns2, House, LayoutGrid, PanelsTopLeft, Plus, Rows2, SquarePlus, X, type LucideIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { kisaAdi, sayfaMaddesi } from "../../bilesenler/AnaMenu";
import { IslemMenusu } from "../../bilesenler/IslemMenusu";
import { bildir } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { ortamDuzeni, ortamGeriAc, ortamSil } from "../../eylemler";
import { BOLME_EN_COK, ORTAM_EN_COK, bolmeyeGirer, kisininOrtamlari, yolSayfasi } from "../../ortam";
import { ORTAM_DUZENLERI, getir, useVeri, type Kisi, type Ortam, type OrtamDuzeni } from "../../veri";
import { git, simdikiYol, useYol, yerineGit } from "../../yol";
import { eklemeyiAc, onSecimiYaz, ortamDiliminiAl, ortamDiliminiYaz, ortamiUnut, sonAnaYolu, sonAnaYolunuYaz, useOrtamGorunumu } from "./gorunum";

/*
 * Üst çubuğun sekmeleri, tarayıcıdaki gibi: başta sabit ana görünüm,
 * sonra kişinin workspace'leri, sonda "+". Sekme adresi değiştirdiği için
 * bağlantı (`aria-current`), sekme listesi (tablist) değil.
 *
 * Eylemlerin yeri: workspace'in işleri kendi sekmesinde (▾, ×), sayfanın
 * işleri bölme başlığında, genel işler çubukta. Eskiden hepsi sayfanın
 * üstünde ayrı bir şeritteydi ve "workspace aç" ile "modül ekle" yan yana
 * durup karışıyordu.
 */

export const DUZEN_SIMGESI: Record<OrtamDuzeni, LucideIcon> = { yan: Columns2, alt: Rows2, izgara: LayoutGrid, sekme: PanelsTopLeft };
export const DUZEN_ADI: Record<OrtamDuzeni, Anahtar> = { yan: "duzenYan", alt: "duzenAlt", izgara: "duzenIzgara", sekme: "duzenSekme" };

/* Sekmede ilk iki sayfanın adı; fazlası "+N", tam liste ipucunda. */
const GORUNEN_AD = 2;

/**
 * Workspace'in etiketi: içindeki sayfaların kısa adları, ekrandaki sırayla.
 * Bölmenin şimdiki sayfası (içinde gezindiyse oraya gittiği), başlığıyla
 * aynı olsun diye; tekrar edenler bir kez.
 */
export function useOrtamEtiketi(ben: Kisi) {
  const { t } = useDil();
  const gorunum = useOrtamGorunumu();
  return (o: Ortam) => {
    const adlar = [
      ...new Set(
        o.bolmeler.map((b) => {
          const m = sayfaMaddesi(yolSayfasi(gorunum.yol[b.id] ?? b.yol));
          return m ? t(kisaAdi(ben, m)) : t("ortam");
        }),
      ),
    ];
    const gorunen = adlar.slice(0, GORUNEN_AD);
    return {
      adlar,
      gorunen,
      fazla: adlar.length - gorunen.length,
      // "+N" soldan sağa yalıtılmış: Arapçada "1+" okunmasın.
      kisa: adlar.length ? gorunen.join(" · ") + (adlar.length > GORUNEN_AD ? ` \u2066+${adlar.length - GORUNEN_AD}\u2069` : "") : t("yeniOrtam"),
      tam: adlar.length ? adlar.join(", ") : t("yeniOrtam"),
      Ikon: DUZEN_SIMGESI[o.duzen],
    };
  };
}

/* Açık bölmelerden birinde pencere (yarım form) var mı; varsa kapatmadan önce sorulur. */
const acikPencereVar = () =>
  [...document.querySelectorAll<HTMLIFrameElement>("iframe.bolme-cerceve")].some((f) => {
    try {
      return !!f.contentDocument?.querySelector("dialog[open]");
    } catch {
      return false;
    }
  });

/**
 * Workspace'i kapatır: hemen, onaysız; bildirimde "Geri al" aynı yerine
 * aynı bölmelerle, boyutlarla ve iç sayfalarla geri getiriyor. Yalnız
 * etkin workspace'te açık bir pencere varsa soruluyor: yazılanı geri al
 * kurtaramaz.
 */
export function useOrtamKapat(ben: Kisi) {
  const { t } = useDil();
  const etiket = useOrtamEtiketi(ben);
  const yol = useYol();
  return (o: Ortam) => {
    const etkin = yol.sayfa === "ortam" && yol.id === o.id;
    if (etkin && acikPencereVar() && !confirm(t("ortamKapatOnay"))) return;
    // Sıra ve kayıt kapanmadan alınıyor; ekrandaki kopya bayat olabilir.
    const sira = kisininOrtamlari(getir(), ben.id).findIndex((x) => x.id === o.id);
    const idler = o.bolmeler.map((b) => b.id);
    const dilim = ortamDiliminiAl(o.id, idler);
    const ad = etiket(o).kisa;
    if (!ortamSil(ben, o.id)) return;
    ortamiUnut(o.id, idler);
    if (etkin) yerineGit(sonAnaYolu());
    bildir(t("ortamKapandi", { ad }), {
      ad: t("geriAl"),
      f: () => {
        if (ortamGeriAc(ben, o, sira)) ortamDiliminiYaz(o.id, dilim);
      },
    });
  };
}

/**
 * Yeni workspace: seçim sayfasını açar. Bulunduğun sayfa bölmeye
 * girebiliyorsa orada ilk sırada seçili gelir ("bunu bir şeyle yan yana
 * aç"). Üst çubuktaki "+" ile telefondaki Menü aynısını kullanıyor.
 */
export function useYeniOrtam(ben: Kisi) {
  const { t } = useDil();
  const v = useVeri();
  const yol = useYol();
  const dolu = kisininOrtamlari(v, ben.id).length >= ORTAM_EN_COK;
  return {
    dolu,
    ad: dolu ? t("ortamSiniri", { n: ORTAM_EN_COK }) : t("yeniOrtam"),
    ac: () => {
      if (dolu) return;
      const burasi = simdikiYol();
      onSecimiYaz(yol.sayfa !== "ortam" && yolSayfasi(burasi) !== "ana" && bolmeyeGirer(ben, burasi) ? burasi : null);
      git("ortam/yeni");
    },
  };
}

/** Etkin workspace sekmesinin ▾ menüsü: yerleşim, sayfa ekle, kapat. */
function OrtamMenusu({ ben, ortam: o, kapat }: { ben: Kisi; ortam: Ortam; kapat: () => void }) {
  const { t } = useDil();
  const dolu = o.bolmeler.length >= BOLME_EN_COK;
  return (
    <IslemMenusu etiket={t("ortamMenusu")} dugmeSinifi="ust-sekme-menu" ikon={<ChevronDown size={15} />} menuSinifi="ortam-menusu" katman>
      <div className="acilir-baslik" role="presentation">
        {t("duzen")}
      </div>
      {ORTAM_DUZENLERI.map((d) => {
        const Ikon = DUZEN_SIMGESI[d];
        return (
          <button key={d} type="button" role="menuitemradio" aria-checked={o.duzen === d} className="acilir-satir yerlesim-secenegi" data-duzen={d} onClick={() => ortamDuzeni(ben, o.id, d)}>
            <Ikon size={16} /> {t(DUZEN_ADI[d])}
          </button>
        );
      })}
      <hr />
      {/* Sınırda pasif ama odaklanabilir: nedeni ipucunda. */}
      <button
        type="button"
        role="menuitem"
        className={`acilir-satir ${dolu ? "pasif" : ""}`}
        aria-disabled={dolu}
        title={dolu ? t("bolmeDolu", { n: BOLME_EN_COK }) : undefined}
        data-sayfa-ekle
        onClick={() => !dolu && eklemeyiAc(o.id)}
      >
        <SquarePlus size={16} /> {t("sayfaEkle")}
      </button>
      <button type="button" role="menuitem" className="acilir-satir kotu-yazi" onClick={kapat}>
        <X size={16} /> {t("ortamiKapat")}
      </button>
    </IslemMenusu>
  );
}

export function UstSekmeler({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const yol = useYol();
  const etiket = useOrtamEtiketi(ben);
  const kapat = useOrtamKapat(ben);
  const liste = kisininOrtamlari(v, ben.id);
  const ortamda = yol.sayfa === "ortam";
  const yeniSayfa = ortamda && yol.id === "yeni";
  const yeni = useYeniOrtam(ben);
  const serit = useRef<HTMLDivElement>(null);
  const [tasiyor, setTasiyor] = useState(false);

  // Workspace dışındaki son sayfa: ilk sekme workspace'ten dönünce oraya açsın (takvim yerinde değişince de).
  useEffect(() => {
    if (ortamda) return;
    const yaz = () => sonAnaYolunuYaz(simdikiYol());
    yaz();
    window.addEventListener("trt-yol", yaz);
    return () => window.removeEventListener("trt-yol", yaz);
  }, [ortamda, yol]);

  // Sekmeler sığmayınca "Bütün workspace'ler" listesi çıkıyor; etkin sekme görünür kalıyor.
  useLayoutEffect(() => {
    const s = serit.current;
    if (!s) return;
    const olc = () => setTasiyor(s.scrollWidth > s.clientWidth + 1);
    olc();
    const g = new ResizeObserver(olc);
    g.observe(s);
    s.querySelector<HTMLElement>(".ust-sekme.acik")?.scrollIntoView({ block: "nearest", inline: "nearest" });
    return () => g.disconnect();
  }, [liste.length, yol]);

  const anaYol = ortamda ? sonAnaYolu() : simdikiYol();
  const anaMadde = sayfaMaddesi(yolSayfasi(anaYol)) ?? sayfaMaddesi("ana");
  const anaAd = anaMadde ? t(kisaAdi(ben, anaMadde)) : t("mAna");
  const AnaIkon = yolSayfasi(anaYol) === "ana" || !anaMadde ? House : anaMadde.ikon;


  return (
    <div className="ust-sekmeler">
      <nav className="ust-sekme-seridi" ref={serit} aria-label={t("sekmeler")}>
        <div className={`ust-sekme sabit ${!ortamda ? "acik" : ""}`}>
          <a
            href={`#/${anaYol}`}
            data-ana-sekme
            aria-current={!ortamda ? "page" : undefined}
            aria-label={t("anaGorunum", { ad: anaAd })}
            title={t("anaGorunum", { ad: anaAd })}
          >
            <AnaIkon size={16} />
            <span className="ust-sekme-ad">{anaAd}</span>
          </a>
        </div>
        {liste.map((o) => {
          const e = etiket(o);
          const etkin = ortamda && yol.id === o.id;
          return (
            <div key={o.id} className={`ust-sekme ${etkin ? "acik" : ""}`} data-ortam={o.id}>
              <a
                href={`#/ortam/${o.id}`}
                aria-current={etkin ? "page" : undefined}
                aria-label={t("ortamEtiketi", { adlar: e.tam })}
                title={t("ortamEtiketi", { adlar: e.tam })}
                onAuxClick={(ev) => {
                  if (ev.button !== 1) return;
                  ev.preventDefault();
                  kapat(o);
                }}
                onMouseDown={(ev) => ev.button === 1 && ev.preventDefault()}
                onKeyDown={(ev) => ev.key === "Delete" && kapat(o)}
              >
                <e.Ikon size={15} />
                <span className="ust-sekme-ad">
                  {e.gorunen.map((ad, i) => (
                    <span key={i}>
                      {i > 0 && <i aria-hidden="true"> · </i>}
                      {ad}
                    </span>
                  ))}
                </span>
                {e.fazla > 0 && (
                  <span className="ust-sekme-fazla" dir="ltr">
                    +{e.fazla}
                  </span>
                )}
              </a>
              {etkin && <OrtamMenusu ben={ben} ortam={o} kapat={() => kapat(o)} />}
              {/* Sekme sırası kısa kalsın: yalnız etkin sekmenin × düğmesi Tab'la geliyor; öbürleri Delete ile de kapanıyor. */}
              <button
                type="button"
                className="ust-sekme-kapat"
                data-ortam-kapat={o.id}
                tabIndex={etkin ? 0 : -1}
                aria-label={t("ortamKapat", { ad: e.kisa })}
                title={t("ortamKapat", { ad: e.kisa })}
                onClick={() => kapat(o)}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        {yeniSayfa && (
          <div className="ust-sekme acik gecici">
            <a href="#/ortam/yeni" aria-current="page">
              <Plus size={15} />
              <span className="ust-sekme-ad">{t("yeniOrtam")}</span>
            </a>
            <button type="button" className="ust-sekme-kapat" aria-label={t("kapat")} title={t("kapat")} onClick={() => yerineGit(sonAnaYolu())}>
              <X size={14} />
            </button>
          </div>
        )}
      </nav>
      {tasiyor && (
        <IslemMenusu etiket={t("tumOrtamlar")} dugmeSinifi="ust-sekme-menu" ikon={<ChevronDown size={16} />} menuSinifi="ortam-listesi">
          {liste.map((o) => {
            const e = etiket(o);
            return (
              <a key={o.id} role="menuitem" className="acilir-satir" href={`#/ortam/${o.id}`}>
                <e.Ikon size={16} /> {e.kisa}
              </a>
            );
          })}
        </IslemMenusu>
      )}
      {/* Pasif düğme ipucu göstermiyor; sınırda odaklanabilir kalıyor, nedeni ipucunda. */}
      <button type="button" className={`ikon-dugme yeni-ortam ${yeni.dolu ? "pasif" : ""}`} data-yeni-ortam onClick={yeni.ac} aria-disabled={yeni.dolu} aria-label={yeni.ad} title={yeni.ad}>
        <Plus size={18} />
      </button>
    </div>
  );
}
