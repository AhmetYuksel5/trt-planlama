import { LayoutPanelLeft, Plus, Replace, SquarePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bos } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { bolmeDegistir, bolmeEkle, bolmeKapat, bolmePaylari, bolmeTasi } from "../../eylemler";
import { BOLME_EN_COK, bolmePayi, ortamBul, yerlesim } from "../../ortam";
import { useVeri, type Bolme, type Kisi, type Ortam, type OrtamDuzeni } from "../../veri";
import type { BolmeBildirimi, BolmeKomutu } from "../../yol";
import { useTelefon } from "../takvim/ortak";
import { Ayrac, BolmeCercevesi, BolmeEylemleri, useModul, type BolmeDurumu, type BolmeIslemleri } from "./Bolme";
import { acikBolmeyiYaz, bolmeYolu, bolmeYolunuYaz, bolmeyiUnut, buyukBolmeyiYaz, eklemeyiAc, eklemeyiKapat, useEkleme, useOrtamGorunumu } from "./gorunum";
import { ModulIzgarasi } from "./ModulIzgarasi";
import { useOrtamEtiketi, useOrtamKapat } from "./Sekmeler";

/**
 * Workspace: kişinin birlikte açtığı sayfalar. Her bölme uygulamanın
 * kendisi (iframe, gömülü kip): bölmedeki bağlantı yalnız o bölmeyi
 * götürüyor, pencere yalnız o bölmeyi kilitliyor, dar bölme telefon ve
 * tablet düzenini kendiliğinden alıyor. Bölmeler aynı kaydı paylaşıyor;
 * birinde yapılan iş öbüründe yeniden yüklemeden görünüyor (veri.ts → iz).
 *
 * Sayfanın üstünde ayrı şerit yok: workspace'in işleri üst çubuktaki
 * sekmesinde (Sekmeler.tsx), sayfanın işleri bölmenin başlığında.
 */

export default function OrtamSayfasi({ ben, id }: { ben: Kisi; id?: string }) {
  const { t } = useDil();
  const v = useVeri();
  const etiket = useOrtamEtiketi(ben);
  const o = ortamBul(v, ben.id, id);
  return (
    <>
      <h1 className="gizli-metin">{o ? t("ortamEtiketi", { adlar: etiket(o).tam }) : t("ortam")}</h1>
      {/* Workspace değişince bölmeler, seçimler ve sürükleme durumu sıfırdan kurulsun. */}
      {o ? <OrtamGovdesi key={o.id} ben={ben} ortam={o} /> : <Bos metin={t("ortamBulunamadi")} ikon={<LayoutPanelLeft size={28} />} />}
    </>
  );
}

/* DOM'daki sıra kimliğe göre sabit; ekrandaki sıra yalnız ızgara alanından. iframe DOM'da yer değiştirirse yeniden yüklenir. */
const kimlikSirasi = (a: Bolme, b: Bolme) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/* Geçici bölmenin yerleşimdeki kimliği; kayda hiç girmiyor. */
const YENI = "__yeni";

/**
 * Seçim kutucukları bölmenin içinde: geçici bölmede ("Yanına sayfa aç",
 * "Sayfa ekle") ve bölmenin üstündeki katmanda ("Sayfayı değiştir").
 * Ayrı pencere yerine yerinde, çünkü seçimin nereye açılacağı görünsün.
 * Açılınca odak ilk kutucukta, Esc vazgeçiyor.
 */
function SayfaSecimi({ ben, baslik, ikon, sec, vazgec }: { ben: Kisi; baslik: string; ikon: ReactNode; sec: (yol: string) => void; vazgec: () => void }) {
  const { t } = useDil();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(".modul-secenek")?.focus();
  }, []);
  return (
    <div
      ref={ref}
      className="sayfa-secimi"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.stopPropagation();
        vazgec();
      }}
    >
      <header className="bolme-bas">
        {ikon}
        <b className="bolme-ad">{baslik}</b>
        <div className="bolme-eylemleri">
          <button type="button" className="dugme dugme-sade dugme-ikon" onClick={vazgec} aria-label={t("iptal")} title={t("iptal")} data-secim-vazgec>
            <X size={16} />
          </button>
        </div>
      </header>
      <div className="sayfa-secimi-govde">
        <ModulIzgarasi ben={ben} sec={sec} kompakt />
      </div>
    </div>
  );
}

function OrtamGovdesi({ ben, ortam: o }: { ben: Kisi; ortam: Ortam }) {
  const { t } = useDil();
  const modul = useModul(ben);
  const telefon = useTelefon();
  const gorunum = useOrtamGorunumu();
  const ekleme = useEkleme();
  const ortamKapat = useOrtamKapat(ben);
  const [degisen, setDegisen] = useState<string | null>(null);
  const [canli, setCanli] = useState<Record<string, number> | null>(null);
  const [durumlar, setDurumlar] = useState<Record<string, BolmeDurumu>>({});
  const sahne = useRef<HTMLDivElement>(null);
  const cerceveler = useRef(new Map<string, HTMLIFrameElement>());

  const dolu = o.bolmeler.length >= BOLME_EN_COK;
  // Eski kayıttan kalan boş workspace'te seçim kendiliğinden açık; yenisi boş açılmıyor.
  const yeniAcik = !dolu && (ekleme?.ortamId === o.id || o.bolmeler.length === 0);
  const sonra = ekleme?.ortamId === o.id ? ekleme.sonra : undefined;

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

  // Yarım kalan seçim workspace'ten çıkınca kapanıyor; dönünce yeniden açılmasın.
  useEffect(() => () => eklemeyiKapat(), []);
  // Geçici bölme görünsün: büyütülmüş bölme küçülüyor.
  useEffect(() => {
    if (yeniAcik && gorunum.buyuk[o.id]) buyukBolmeyiYaz(o.id, null);
  }, [yeniAcik, gorunum.buyuk, o.id]);

  const komut = (bolmeId: string, m: BolmeKomutu) => cerceveler.current.get(bolmeId)?.contentWindow?.postMessage(m, location.origin);

  // Telefonda ekran tek bölmelik: yerleşim seçimi saklı kalıyor, görünüm sekmeli.
  const duzen: OrtamDuzeni = telefon ? "sekme" : o.duzen;
  const eksen = duzen === "alt" ? "alt" : "yan";
  const buyuk = telefon || yeniAcik ? undefined : gorunum.buyuk[o.id];
  const gosterilen = canli ? o.bolmeler.map((b) => (canli[b.id] === undefined ? b : { ...b, pay: { ...b.pay, [eksen]: canli[b.id] } })) : o.bolmeler;
  // Geçici bölme yerleşimde gerçek bölme gibi yer alıyor: basılan bölmenin hemen arkasında, yoksa sonda.
  const yerlesen = (() => {
    if (!yeniAcik) return gosterilen;
    const l = [...gosterilen];
    const i = sonra ? l.findIndex((b) => b.id === sonra) : -1;
    l.splice(i < 0 ? l.length : i + 1, 0, { id: YENI, yol: "" });
    return l;
  })();
  const y = yerlesim(duzen, yerlesen, { buyuk, acik: yeniAcik ? YENI : gorunum.acik[o.id] });
  const durumu = (b: Bolme): BolmeDurumu => durumlar[b.id] ?? { yol: bolmeYolu(b.id, b.yol), geri: false };

  const islemler = (b: Bolme, i: number): BolmeIslemleri => ({
    geri: () => komut(b.id, { tur: "trt-bolme-geri" }),
    buyuk: buyuk === b.id,
    buyut: duzen === "sekme" || o.bolmeler.length < 2 ? undefined : () => buyukBolmeyiYaz(o.id, buyuk === b.id ? null : b.id),
    onceye: i > 0 ? () => bolmeTasi(ben, o.id, b.id, -1) : undefined,
    sonraya: i < o.bolmeler.length - 1 ? () => bolmeTasi(ben, o.id, b.id, 1) : undefined,
    // Sekmelide "yan" yok; orada sekmelerin sonundaki "+" ekliyor.
    yaninaAc: duzen === "sekme" ? undefined : () => eklemeyiAc(o.id, b.id),
    altAlta: duzen === "alt",
    dolu,
    degistir: () => setDegisen(b.id),
    // Son sayfa kapanınca workspace de kapanıyor (geri alınabilir); boş workspace kalmasın.
    kapat: () => {
      if (o.bolmeler.length === 1) return ortamKapat(o);
      if (!bolmeKapat(ben, o.id, b.id)) return;
      bolmeyiUnut(o.id, b.id);
      cerceveler.current.delete(b.id);
    },
    yeniSekme: `${location.pathname}#/${durumu(b).yol}`,
  });

  const ekle = (yol: string) => {
    const yeni = bolmeEkle(ben, o.id, yol, sonra);
    if (!yeni) return;
    acikBolmeyiYaz(o.id, yeni);
    eklemeyiKapat();
  };
  const vazgec = () => (o.bolmeler.length === 0 ? ortamKapat(o) : eklemeyiKapat());
  const degistir = (bolmeId: string, yol: string) => {
    if (bolmeDegistir(ben, o.id, bolmeId, yol)) komut(bolmeId, { tur: "trt-bolme-git", yol });
    setDegisen(null);
  };

  const onde = y.tek && y.tek !== YENI ? o.bolmeler.find((b) => b.id === y.tek) : undefined;
  const ekleAdi = dolu ? t("bolmeDolu", { n: BOLME_EN_COK }) : t("sayfaEkle");

  return (
    <>
      {duzen === "sekme" && (
        <div className="bolme-sekmeleri">
          <div className="sekmeler bolme-sekme-listesi" role="tablist" aria-label={t("ortam")}>
            {yerlesen.map((b) => {
              const secili = b.id === y.tek;
              if (b.id === YENI)
                return (
                  <button key={YENI} type="button" role="tab" aria-selected={secili} aria-controls="bolme-yeni" className={secili ? "acik" : ""} data-bolme-sekme={YENI}>
                    <SquarePlus size={15} /> {t("sayfaSec")}
                  </button>
                );
              const { ad, Ikon } = modul(durumu(b).yol);
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={secili}
                  aria-controls={`bolme-${b.id}`}
                  className={secili ? "acik" : ""}
                  data-bolme-sekme={b.id}
                  onClick={() => {
                    eklemeyiKapat();
                    acikBolmeyiYaz(o.id, b.id);
                  }}
                >
                  <Ikon size={15} /> {ad}
                </button>
              );
            })}
          </div>
          {/* Pasif düğme ipucu göstermiyor; sınırda odaklanabilir kalıyor, nedeni ipucunda. */}
          <button
            type="button"
            className={`dugme dugme-sade dugme-ikon ${dolu || yeniAcik ? "pasif" : ""}`}
            aria-disabled={dolu || yeniAcik}
            aria-label={ekleAdi}
            title={ekleAdi}
            data-bolme-ekle
            onClick={() => !dolu && !yeniAcik && eklemeyiAc(o.id)}
          >
            <Plus size={16} />
          </button>
          {onde && <BolmeEylemleri durum={durumu(onde)} islem={islemler(onde, o.bolmeler.indexOf(onde))} />}
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
            katman={
              degisen === b.id && (
                <SayfaSecimi ben={ben} baslik={t("sayfayiDegistir")} ikon={<Replace size={16} />} sec={(yol) => degistir(b.id, yol)} vazgec={() => setDegisen(null)} />
              )
            }
          />
        ))}
        {/* iframe'lerden sonra: geçici bölme açılıp kapanınca çerçeveler DOM'da kımıldamıyor. */}
        {yeniAcik && (
          <section id="bolme-yeni" className="bolme bolme-yeni" data-bolme-yeni style={{ gridArea: y.yerler[YENI].alan }} aria-label={t("sayfaSec")}>
            <SayfaSecimi ben={ben} baslik={t("sayfaSec")} ikon={<SquarePlus size={16} />} sec={ekle} vazgec={vazgec} />
          </section>
        )}
        {y.ayraclar
          // Geçici bölmenin payı yok; yanındaki ayraç sürüklenmiyor, yalnız boşluk kalıyor.
          .filter((a) => a.onceki !== YENI && a.sonraki !== YENI)
          .map((a) => {
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
  );
}
