import { ArrowRight, Ban, Clock, FolderOpen, LayoutGrid, Lightbulb, List, MapPin, MapPinned } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BicimRozeti, Bos, DurumCizgisi, Icerik, NotKutu, PaketDurumRozeti, Pencere, TurRozeti } from "../../bilesenler/Parcalar";
import { OneriAvatari, OneriDurumRozeti, OneriKaynagi } from "../../bilesenler/Tablolar";
import { aralikYaz, gecenSure, saatYaz, tarihYaz, useDil } from "../../dil";
import { BICIM_ADI, KANAL_ADI, TUR_ADI, ulkeAdi } from "../../etiketler";
import { oneriDurum } from "../../eylemler";
import { haftaSonu } from "../../haftalik";
import { yerelGun } from "../../tarih";
import { paketBul, type Durum, type Kisi, type Oneri } from "../../veri";
import { FormAlt } from "../nextday/Formlar";

/*
 * Plan hazırlanırken gelen öneri: müstakil kart, basınca pencerede bütün
 * öneri. Haber odalarının öneri (pitch) kartlarındaki sıra: üstte
 * sınıflama (kol, haber türü, ülke), ortada başlık ve arkasındaki haber,
 * altında kısa gelişme, en altta kim, ne zaman, durum. Renk yalnız kolda.
 * Kararlar (plana ekle, ret) pencerede veriliyor; ızgara form açılınca
 * dağılmıyor.
 */

/** Kartın başlığı önerilen paket; muhabir paket önermediyse haberin kendisi. */
const baslikOf = (o: Oneri) => o.paketBasligi || o.haberBasligi;
/** Arka plan haberi yalnız başlıktan farklıysa ayrı satır. */
const arkaPlan = (o: Oneri) => (o.paketBasligi && o.paketBasligi !== o.haberBasligi ? o.haberBasligi : undefined);

export type Gorunum = "kart" | "liste";
export type PencereDurumu = { id: string; mod: "goster" | "ekle" | "ret" } | null;

/* Görünüm kişinin bu tarayıcıdaki tercihi; kayıt değil, saklanamazsa kart. */
const GORUNUM_ANAHTARI = "trt-planlama-oneri-gorunum";
export function useOneriGorunumu(): [Gorunum, (g: Gorunum) => void] {
  const [g, setG] = useState<Gorunum>(() => {
    try {
      return localStorage.getItem(GORUNUM_ANAHTARI) === "liste" ? "liste" : "kart";
    } catch {
      return "kart";
    }
  });
  const degistir = (yeni: Gorunum) => {
    setG(yeni);
    try {
      localStorage.setItem(GORUNUM_ANAHTARI, yeni);
    } catch {
      /* özel pencere: bu oturumda geçerli */
    }
  };
  return [g, degistir];
}

export function GorunumSecici({ deger, degistir }: { deger: Gorunum; degistir: (g: Gorunum) => void }) {
  const { t } = useDil();
  const secenek = (g: Gorunum, ikon: ReactNode, ad: string) => (
    <button type="button" className={`dugme dugme-sade dugme-ikon ${deger === g ? "secili" : ""}`} aria-pressed={deger === g} aria-label={ad} title={ad} onClick={() => degistir(g)}>
      {ikon}
    </button>
  );
  return (
    <div className="gorunum-secici" role="group" aria-label={t("gorunum")}>
      {secenek("kart", <LayoutGrid size={16} />, t("kartGorunumu"))}
      {secenek("liste", <List size={16} />, t("listeGorunumu"))}
    </div>
  );
}

export function OneriKarti({ oneri: o, d, ac, eylemler }: { oneri: Oneri; d: Durum; ac: () => void; eylemler?: ReactNode }) {
  const { t, dil } = useDil();
  const arka = arkaPlan(o);
  return (
    <article
      className={`oneri-karti tur-${o.tur} ${o.talimatVeren ? "talimat" : ""} ${o.durum === "reddedildi" ? "sonuk-kart" : ""}`}
      data-oneri={o.id}
      // Kartın boş yerine basmak da açıyor; düğme ve bağlantılar kendi işini yapsın.
      onClick={(e) => !(e.target as HTMLElement).closest("button, a") && ac()}
    >
      <div className="ok-ust">
        <TurRozeti tur={o.tur} />
        {o.bicim && <BicimRozeti bicim={o.bicim} />}
        <span className="ok-ulke">
          <MapPin size={13} /> {t(ulkeAdi(o.ulke))}
        </span>
        <span className="bosluk-esnek" />
        <OneriDurumRozeti oneri={o} />
      </div>
      <button type="button" className="ok-baslik" onClick={ac} aria-label={`${t("oneriyiAc")}: ${baslikOf(o)}`}>
        <Icerik blok>{baslikOf(o)}</Icerik>
      </button>
      {arka && (
        <div className="ok-arka" title={t("arkaPlanHaber")}>
          <FolderOpen size={13} />
          <Icerik>{arka}</Icerik>
        </div>
      )}
      <Icerik blok className="ok-metin">
        {o.gelisme}
      </Icerik>
      <div className="ok-alt">
        <OneriAvatari oneri={o} d={d} />
        <span className="ok-kaynak">
          <OneriKaynagi oneri={o} d={d} />
        </span>
        <span className="sonuk">· {gecenSure(o.zaman, dil)}</span>
        {o.sahaGerekli && (
          <span className="ok-saha" title={t("sahaGerekli")} aria-label={t("sahaGerekli")}>
            <MapPinned size={14} />
          </span>
        )}
      </div>
      {o.gerekce && (
        <p className="ok-gerekce" dir="auto">
          {o.gerekce}
        </p>
      )}
      {eylemler && <div className="ok-eylem">{eylemler}</div>}
    </article>
  );
}

/** Liste görünümü: çok öneriyi hızlı taramak için tek satır. */
export function OneriSatiri({ oneri: o, d, ac, eylemler }: { oneri: Oneri; d: Durum; ac: () => void; eylemler?: ReactNode }) {
  const { t, dil } = useDil();
  return (
    <div className={`kayit oneri-satiri ${o.talimatVeren ? "kayit-talimat" : ""}`} data-oneri={o.id}>
      <div className="kayit-bas">
        <OneriAvatari oneri={o} d={d} />
        <div>
          <button type="button" className="ok-baslik" onClick={ac} aria-label={`${t("oneriyiAc")}: ${baslikOf(o)}`}>
            <Icerik blok>{baslikOf(o)}</Icerik>
          </button>
          <Icerik blok className="kayit-metin satir-tek">
            {o.gelisme}
          </Icerik>
          <small>
            <OneriDurumRozeti oneri={o} />
            {o.bicim && <BicimRozeti bicim={o.bicim} />}
            <OneriKaynagi oneri={o} d={d} />
            <span>
              · {t(KANAL_ADI[o.kanal])} · {gecenSure(o.zaman, dil)}
            </span>
            {o.gerekce && <span dir="auto">· {o.gerekce}</span>}
          </small>
        </div>
        {eylemler && <div className="islemler">{eylemler}</div>}
      </div>
    </div>
  );
}

/* Süreç çizgisinin adımları: ret ve erteleme çizgide değil, gerekçesiyle ayrı gösteriliyor. */
const SUREC: Partial<Record<Oneri["durum"], number>> = { yeni: 0, degerlendiriliyor: 1, planaEklendi: 2 };

/** Bütün öneri: içerik, kaynak, hedef, süreç ve ayrıntı bağlantısı; karar formu altta. */
export function OneriPenceresi({ oneri: o, d, kapat, altBilgi, children }: { oneri: Oneri; d: Durum; kapat: () => void; altBilgi?: ReactNode; children?: ReactNode }) {
  const { t, dil } = useDil();
  const arka = arkaPlan(o);
  const paket = paketBul(d, o.paketId);
  const siniflama = [t(TUR_ADI[o.tur]), o.bicim ? t(BICIM_ADI(o.bicim)) : "", t(ulkeAdi(o.ulke))].filter(Boolean).join(" · ");
  const hedef = o.hafta ? `${t("haftalik")} · ${aralikYaz(o.hafta, haftaSonu(o.hafta), dil)}` : o.hedefTarih ? tarihYaz(o.hedefTarih, dil, "tam") : "—";
  return (
    <Pencere baslik={<Icerik>{baslikOf(o)}</Icerik>} alt={siniflama} kapat={kapat} altBilgi={altBilgi}>
      {arka && (
        <div>
          <div className="alan-etiket">{t("arkaPlanHaber")}</div>
          <Icerik blok className="op-arka">
            {arka}
          </Icerik>
        </div>
      )}
      <div>
        <div className="alan-etiket">{t("gelismeAciklama")}</div>
        <div className="metin-kutu">
          <Icerik blok>{o.gelisme}</Icerik>
        </div>
      </div>
      <div className="alanlar">
        <div className="alan">
          <small>{t("kaynak")}</small>
          <OneriKaynagi oneri={o} d={d} hucre />
        </div>
        <div className="alan">
          <small>{t("kanal")}</small>
          <b>
            {t(KANAL_ADI[o.kanal])} · {tarihYaz(yerelGun(o.zaman), dil, "kisa")} {saatYaz(o.zaman, dil)}
          </b>
        </div>
        <div className="alan">
          <small>{t("hedefPlan")}</small>
          <b>{hedef}</b>
        </div>
        <div className="alan">
          <small>{t("saha")}</small>
          <b>{t(o.sahaGerekli ? "evet" : "hayir")}</b>
        </div>
      </div>
      <div>
        <div className="alan-etiket">{t("surec")}</div>
        {o.durum === "reddedildi" || o.durum === "sonra" ? (
          <NotKutu ton="uyari">
            <OneriDurumRozeti oneri={o} /> {o.gerekce && <span dir="auto">{o.gerekce}</span>}
          </NotKutu>
        ) : (
          <DurumCizgisi
            asamalar={[t("odGeldi"), t("odDegerlendiriliyor"), t("odPlanaEklendi")]}
            simdi={SUREC[o.durum] ?? 0}
            bitti={o.durum === "planaEklendi"}
            etiket={t("surec")}
          />
        )}
        {paket && (
          <p className="ara-ust">
            <a href={`#/paketler/${paket.id}`}>{paket.kod}</a> <PaketDurumRozeti paket={paket} />
          </p>
        )}
      </div>
      <a className="tumu op-ayrinti" href={`#/oneriler/${o.id}`}>
        {t("ayrintiVeGecmis")} <ArrowRight size={13} className="yon" />
      </a>
      {children}
    </Pencere>
  );
}

function RetFormu({ ben, oneri, kapat }: { ben: Kisi; oneri: Oneri; kapat: () => void }) {
  const { t } = useDil();
  const [gerekce, setGerekce] = useState("");
  return (
    <div className="form form-kutu">
      <label>
        {t("retGerekcesi")}
        <input dir="auto" value={gerekce} onChange={(e) => setGerekce(e.target.value)} autoFocus />
      </label>
      <FormAlt kapat={kapat} kaydet={() => oneriDurum(ben, oneri.id, "reddedildi", gerekce) && kapat()} kaydetMetni={t("reddet")} />
    </div>
  );
}

/**
 * Plan ekranının öneri listesi: kart ızgarası ya da satırlar, tek pencere.
 * Ekranlar yalnız ekleme formunu veriyor (Next Day'de plana, haftalıkta
 * gündeme); değerlendirmeye alma ve erteleme yalnız Next Day'de.
 */
export function OneriListesi({
  ben,
  d,
  oneriler,
  gorunum,
  pencere,
  setPencere,
  ekleMetni,
  ekleFormu,
  ertelenebilir = false,
}: {
  ben: Kisi;
  d: Durum;
  oneriler: Oneri[];
  gorunum: Gorunum;
  pencere: PencereDurumu;
  setPencere: (p: PencereDurumu) => void;
  ekleMetni: string;
  ekleFormu: (o: Oneri, kapat: () => void) => ReactNode;
  ertelenebilir?: boolean;
}) {
  const { t } = useDil();
  const kapat = () => setPencere(null);
  // Pencere listeden değil bütün öneriler içinden: plana eklenen öneri listeden düşse de pencere kapanana kadar dursun.
  const acik = pencere ? d.oneriler.find((o) => o.id === pencere.id) : undefined;

  const eylemler = (o: Oneri, tam = false) => {
    // Yönetici talimatı reddedilmez ve ertelenmez; eylem de aynı kuralı soruyor.
    const talimat = !!o.talimatVeren;
    const kararAcik = o.durum !== "reddedildi" && o.durum !== "planaEklendi";
    const ikonlu = (ikon: ReactNode, ad: string, sinif: string, f: () => void) => (
      <button key={ad} type="button" className={`dugme ${sinif} dugme-kucuk`} onClick={f} title={ad} aria-label={tam ? undefined : ad}>
        {ikon}
        {tam && ` ${ad}`}
      </button>
    );
    const dugmeler = [
      kararAcik && (
        <button key="ekle" type="button" className="dugme dugme-iyi dugme-kucuk" onClick={() => setPencere({ id: o.id, mod: "ekle" })}>
          {ekleMetni}
        </button>
      ),
      ertelenebilir && o.durum === "yeni" && ikonlu(<Clock size={14} />, t("degerlendirmeyeAl"), "dugme-ikincil", () => oneriDurum(ben, o.id, "degerlendiriliyor")),
      ertelenebilir && kararAcik && !talimat && o.durum !== "sonra" && ikonlu(<Lightbulb size={14} />, t("odSonra"), "dugme-ikincil", () => oneriDurum(ben, o.id, "sonra")),
      kararAcik && !talimat && ikonlu(<Ban size={14} />, t("reddet"), "dugme-kotu", () => setPencere({ id: o.id, mod: "ret" })),
    ].filter(Boolean);
    // Karar kalmadıysa (reddedilmiş ya da plana girmiş) kartta da pencerede de boş şerit çizilmesin.
    return dugmeler.length ? <>{dugmeler}</> : undefined;
  };

  return (
    <>
      {oneriler.length === 0 ? (
        <Bos kucuk metin={t("oneriYok")} />
      ) : gorunum === "kart" ? (
        <div className="oneri-kartlari">
          {oneriler.map((o) => (
            <OneriKarti key={o.id} oneri={o} d={d} ac={() => setPencere({ id: o.id, mod: "goster" })} eylemler={eylemler(o)} />
          ))}
        </div>
      ) : (
        oneriler.map((o) => <OneriSatiri key={o.id} oneri={o} d={d} ac={() => setPencere({ id: o.id, mod: "goster" })} eylemler={eylemler(o)} />)
      )}
      {acik && (
        <OneriPenceresi key={acik.id} oneri={acik} d={d} kapat={kapat} altBilgi={pencere?.mod === "goster" ? eylemler(acik, true) : undefined}>
          {pencere?.mod === "ekle" && ekleFormu(acik, kapat)}
          {pencere?.mod === "ret" && <RetFormu ben={ben} oneri={acik} kapat={kapat} />}
        </OneriPenceresi>
      )}
    </>
  );
}
