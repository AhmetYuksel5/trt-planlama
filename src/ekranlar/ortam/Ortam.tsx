import { Columns2, LayoutGrid, LayoutPanelLeft, PanelsTopLeft, Pencil, Rows2, SquarePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bos, Pencere } from "../../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../../dil";
import { bolmeDegistir, bolmeEkle, bolmeKapat, bolmePaylari, bolmeTasi, ortamAdlandir, ortamDuzeni, ortamSil } from "../../eylemler";
import { BOLME_EN_COK, ORTAM_ADI_EN_UZUN, bolmePayi, ortamBul, yerlesim } from "../../ortam";
import { ORTAM_DUZENLERI, useVeri, type Bolme, type Kisi, type Ortam, type OrtamDuzeni } from "../../veri";
import { git, type BolmeBildirimi, type BolmeKomutu } from "../../yol";
import { useTelefon } from "../takvim/ortak";
import { Ayrac, BolmeCercevesi, BolmeEylemleri, useModul, type BolmeDurumu, type BolmeIslemleri } from "./Bolme";
import { acikBolmeyiYaz, bolmeYolu, bolmeYolunuYaz, bolmeyiUnut, buyukBolmeyiYaz, ortamiUnut, useOrtamGorunumu } from "./gorunum";
import { IslemMenusu } from "./IslemMenusu";
import { ModulSecici } from "./ModulSecici";
import { AnaSerit, useOrtamAdi } from "./Serit";

/**
 * Workspace: kişinin birlikte açtığı sayfalar. Her bölme uygulamanın
 * kendisi (iframe, gömülü kip): bölmedeki bağlantı yalnız o bölmeyi
 * götürüyor, pencere yalnız o bölmeyi kilitliyor, dar bölme telefon ve
 * tablet düzenini kendiliğinden alıyor. Bölmeler aynı kaydı paylaşıyor;
 * birinde yapılan iş öbüründe yeniden yüklemeden görünüyor (veri.ts → iz).
 */

const DUZEN: Record<OrtamDuzeni, { ad: Anahtar; ikon: ReactNode }> = {
  yan: { ad: "duzenYan", ikon: <Columns2 size={15} /> },
  alt: { ad: "duzenAlt", ikon: <Rows2 size={15} /> },
  izgara: { ad: "duzenIzgara", ikon: <LayoutGrid size={15} /> },
  sekme: { ad: "duzenSekme", ikon: <PanelsTopLeft size={15} /> },
};

/* Üst şeritte yalnız ikon; adı üzerine gelince. */
function DuzenSecici({ deger, degistir }: { deger: OrtamDuzeni; degistir: (d: OrtamDuzeni) => void }) {
  const { t } = useDil();
  return (
    <div className="gorunum-secici serit-secici" role="group" aria-label={t("duzen")}>
      {ORTAM_DUZENLERI.map((d) => (
        <button
          key={d}
          type="button"
          className={`dugme dugme-sade dugme-ikon ${deger === d ? "secili" : ""}`}
          aria-pressed={deger === d}
          aria-label={t(DUZEN[d].ad)}
          title={t(DUZEN[d].ad)}
          data-duzen={d}
          onClick={() => degistir(d)}
        >
          {DUZEN[d].ikon}
        </button>
      ))}
    </div>
  );
}

function AdPenceresi({ ortam, kaydet, kapat }: { ortam: Ortam; kaydet: (ad: string) => void; kapat: () => void }) {
  const { t } = useDil();
  const [ad, setAd] = useState(ortam.ad ?? "");
  return (
    <Pencere
      baslik={t("ortamiAdlandir")}
      kapat={kapat}
      altBilgi={
        <>
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="submit" form="ortam-adi" className="dugme dugme-kucuk">
            {t("kaydet")}
          </button>
        </>
      }
    >
      <form
        id="ortam-adi"
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          kaydet(ad);
        }}
      >
        {/* Ad kişinin kendi notu, içerik değil: yazıldığı dilde. */}
        <label>
          {t("ortamAdiEtiket")}
          <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={ORTAM_ADI_EN_UZUN} dir="auto" placeholder={t("ortamAdi", { n: ortam.no })} autoFocus />
        </label>
        <p className="bos-kucuk">{t("ortamAdiNotu")}</p>
      </form>
    </Pencere>
  );
}

export default function OrtamSayfasi({ ben, id }: { ben: Kisi; id?: string }) {
  const { t } = useDil();
  const v = useVeri();
  const adi = useOrtamAdi();
  const o = ortamBul(v, ben.id, id);
  return (
    <>
      <h1 className="gizli-metin">{o ? adi(o) : t("ortam")}</h1>
      {/* Workspace değişince bölmeler, seçici ve sürükleme durumu sıfırdan kurulsun. */}
      {o ? (
        <OrtamGovdesi key={o.id} ben={ben} ortam={o} />
      ) : (
        <>
          <AnaSerit ben={ben} acik={id} />
          <Bos metin={t("ortamBulunamadi")} ikon={<LayoutPanelLeft size={28} />} />
        </>
      )}
    </>
  );
}

/* DOM'daki sıra kimliğe göre sabit; ekrandaki sıra yalnız ızgara alanından. iframe DOM'da yer değiştirirse yeniden yüklenir. */
const kimlikSirasi = (a: Bolme, b: Bolme) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function OrtamGovdesi({ ben, ortam: o }: { ben: Kisi; ortam: Ortam }) {
  const { t } = useDil();
  const adi = useOrtamAdi();
  const modul = useModul(ben);
  const telefon = useTelefon();
  const gorunum = useOrtamGorunumu();
  // Boş workspace'te seçici kendiliğinden açık: yeni workspace'in ilk işi modül eklemek.
  const [secici, setSecici] = useState<{ bolmeId?: string } | null>(() => (o.bolmeler.length === 0 ? {} : null));
  const [adlandir, setAdlandir] = useState(false);
  const [canli, setCanli] = useState<Record<string, number> | null>(null);
  const [durumlar, setDurumlar] = useState<Record<string, BolmeDurumu>>({});
  const sahne = useRef<HTMLDivElement>(null);
  const cerceveler = useRef(new Map<string, HTMLIFrameElement>());

  // Bölmeler yerini bildiriyor; hangi bölme olduğu mesajın geldiği pencereden.
  useEffect(() => {
    const dinle = (e: MessageEvent<BolmeBildirimi>) => {
      if (e.origin !== location.origin || e.data?.tur !== "trt-bolme") return;
      for (const [id, f] of cerceveler.current) {
        if (f.contentWindow !== e.source) continue;
        const { yol, geri } = e.data;
        setDurumlar((d) => ({ ...d, [id]: { yol, geri } }));
        bolmeYolunuYaz(id, yol);
      }
    };
    window.addEventListener("message", dinle);
    return () => window.removeEventListener("message", dinle);
  }, []);

  const komut = (bolmeId: string, m: BolmeKomutu) => cerceveler.current.get(bolmeId)?.contentWindow?.postMessage(m, location.origin);

  // Telefonda ekran tek bölmelik: yerleşim seçimi saklı kalıyor, görünüm sekmeli.
  const duzen: OrtamDuzeni = telefon ? "sekme" : o.duzen;
  const eksen = duzen === "alt" ? "alt" : "yan";
  const buyuk = telefon ? undefined : gorunum.buyuk[o.id];
  const gosterilen = canli ? o.bolmeler.map((b) => (canli[b.id] === undefined ? b : { ...b, pay: { ...b.pay, [eksen]: canli[b.id] } })) : o.bolmeler;
  const y = yerlesim(duzen, gosterilen, { buyuk, acik: gorunum.acik[o.id] });
  const dolu = o.bolmeler.length >= BOLME_EN_COK;
  const eklemeAdi = dolu ? t("bolmeDolu", { n: BOLME_EN_COK }) : t("modulEkle");
  const durumu = (b: Bolme): BolmeDurumu => durumlar[b.id] ?? { yol: bolmeYolu(b.id, b.yol), geri: false };

  const islemler = (b: Bolme, i: number): BolmeIslemleri => ({
    geri: () => komut(b.id, { tur: "trt-bolme-geri" }),
    buyuk: buyuk === b.id,
    buyut: duzen === "sekme" || o.bolmeler.length < 2 ? undefined : () => buyukBolmeyiYaz(o.id, buyuk === b.id ? null : b.id),
    onceye: i > 0 ? () => bolmeTasi(ben, o.id, b.id, -1) : undefined,
    sonraya: i < o.bolmeler.length - 1 ? () => bolmeTasi(ben, o.id, b.id, 1) : undefined,
    degistir: () => setSecici({ bolmeId: b.id }),
    kapat: () => {
      if (!bolmeKapat(ben, o.id, b.id)) return;
      bolmeyiUnut(o.id, b.id);
      cerceveler.current.delete(b.id);
    },
    yeniSekme: `${location.pathname}#/${durumu(b).yol}`,
  });

  const sec = (sayfa: string) => {
    if (secici?.bolmeId) {
      if (bolmeDegistir(ben, o.id, secici.bolmeId, sayfa)) komut(secici.bolmeId, { tur: "trt-bolme-git", yol: sayfa });
    } else {
      const yeni = bolmeEkle(ben, o.id, sayfa);
      if (yeni) {
        // Yeni bölme görünsün: sekmelide öne geçiyor, büyütülmüş bölme küçülüyor.
        acikBolmeyiYaz(o.id, yeni);
        if (buyuk) buyukBolmeyiYaz(o.id, null);
      }
    }
    setSecici(null);
  };

  const sil = () => {
    if (!confirm(t("ortamSilinsinMi", { ad: adi(o) }))) return;
    const idler = o.bolmeler.map((b) => b.id);
    if (ortamSil(ben, o.id)) {
      ortamiUnut(o.id, idler);
      git("");
    }
  };

  const onde = y.tek ? o.bolmeler.find((b) => b.id === y.tek) : undefined;
  const ondeSira = onde ? o.bolmeler.indexOf(onde) : -1;

  return (
    <>
      <AnaSerit
        ben={ben}
        acik={o.id}
        ek={
          <>
            {!telefon && <DuzenSecici deger={o.duzen} degistir={(d) => ortamDuzeni(ben, o.id, d)} />}
            {/* Pasif düğme ipucu göstermiyor; sınırda düğme odaklanabilir kalıyor, nedeni ipucunda. */}
            <button
              type="button"
              className={`serit-dugme ${dolu ? "pasif" : ""}`}
              onClick={() => !dolu && setSecici({})}
              aria-disabled={dolu}
              aria-label={eklemeAdi}
              title={eklemeAdi}
              data-modul-ekle
            >
              <SquarePlus size={18} />
            </button>
            <IslemMenusu etiket={t("ortamIslemleri")} dugmeSinifi="serit-dugme">
              <button type="button" role="menuitem" className="acilir-satir" onClick={() => setAdlandir(true)}>
                <Pencil size={16} /> {t("ortamiAdlandir")}
              </button>
              <button type="button" role="menuitem" className="acilir-satir kotu-yazi" onClick={sil}>
                <Trash2 size={16} /> {t("ortamiSil")}
              </button>
            </IslemMenusu>
          </>
        }
      />

      {o.bolmeler.length === 0 ? (
        <Bos metin={t("ortamBos")} ikon={<LayoutPanelLeft size={28} />} />
      ) : (
        <>
          {duzen === "sekme" && onde && (
            <div className="bolme-sekmeleri">
              <div className="sekmeler bolme-sekme-listesi" role="tablist" aria-label={t("ortam")}>
                {o.bolmeler.map((b) => {
                  const { ad, Ikon } = modul(durumu(b).yol);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="tab"
                      aria-selected={b.id === onde.id}
                      aria-controls={`bolme-${b.id}`}
                      className={b.id === onde.id ? "acik" : ""}
                      data-bolme-sekme={b.id}
                      onClick={() => acikBolmeyiYaz(o.id, b.id)}
                    >
                      <Ikon size={15} /> {ad}
                    </button>
                  );
                })}
              </div>
              <BolmeEylemleri durum={durumu(onde)} islem={islemler(onde, ondeSira)} />
            </div>
          )}
          <div
            ref={sahne}
            className={`ortam-sahne ${canli ? "suruklen" : ""}`}
            data-duzen={buyuk && y.tek ? "buyuk" : duzen}
            style={{ gridTemplateColumns: y.sutunlar, gridTemplateRows: y.satirlar }}
          >
            {[...o.bolmeler].sort(kimlikSirasi).map((b) => (
              <BolmeCercevesi
                key={b.id}
                ben={ben}
                bolme={b}
                durum={durumu(b)}
                yer={y.yerler[b.id]}
                islem={islemler(b, o.bolmeler.indexOf(b))}
                cerceve={(f) => {
                  if (f) cerceveler.current.set(b.id, f);
                }}
              />
            ))}
            {y.ayraclar.map((a) => {
              const onceki = gosterilen.find((b) => b.id === a.onceki)!;
              const sonraki = gosterilen.find((b) => b.id === a.sonraki)!;
              return (
                <Ayrac
                  key={`${a.onceki}-${a.sonraki}`}
                  ayrac={a}
                  sahne={sahne}
                  paylar={[bolmePayi(onceki, a.eksen), bolmePayi(sonraki, a.eksen)]}
                  canli={setCanli}
                  birak={(p) => bolmePaylari(ben, o.id, a.eksen, p)}
                />
              );
            })}
          </div>
        </>
      )}

      {secici && (
        <ModulSecici ben={ben} baslik={t(secici.bolmeId ? "modulDegistir" : "modulSec")} sec={sec} kapat={() => setSecici(null)} />
      )}
      {adlandir && (
        <AdPenceresi
          ortam={o}
          kapat={() => setAdlandir(false)}
          kaydet={(ad) => {
            ortamAdlandir(ben, o.id, ad);
            setAdlandir(false);
          }}
        />
      )}
    </>
  );
}
