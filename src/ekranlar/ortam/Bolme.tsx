import { ArrowLeft, ExternalLink, LayoutPanelLeft, Maximize2, Minimize2, MoveLeft, MoveRight, Replace, X } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { maddeAdi, sayfaMaddesi } from "../../bilesenler/AnaMenu";
import { useDil } from "../../dil";
import { payKaydir, yolSayfasi, type Ayrac as AyracBilgisi } from "../../ortam";
import type { Bolme, Kisi } from "../../veri";
import { bolmeYolu } from "./gorunum";
import { IslemMenusu } from "./IslemMenusu";

/* Workspace bölmesi: başlık ve işlemler üst pencerede, sayfanın kendisi iframe'de (gömülü kip). */

/** Bölmenin bildirdiği an: nerede, kendi geçmişinde geri gidebilir mi. */
export interface BolmeDurumu {
  yol: string;
  geri: boolean;
}

export interface BolmeIslemleri {
  geri: () => void;
  /** Tek bölmede ve sekmelide büyütmenin anlamı yok; o zaman yok. */
  buyut?: () => void;
  buyuk: boolean;
  onceye?: () => void;
  sonraya?: () => void;
  degistir: () => void;
  kapat: () => void;
  /** Bölmenin şimdiki yeri, tam uygulamada. */
  yeniSekme: string;
}

/** Yolun modül adı ve ikonu; menüde olmayan yol ana sayfa sayılıyor. */
export function useModul(ben: Kisi) {
  const { t } = useDil();
  return (yol: string) => {
    const m = sayfaMaddesi(yolSayfasi(yol)) ?? sayfaMaddesi("ana");
    return { ad: m ? t(maddeAdi(ben, m)) : t("ortam"), Ikon: m?.ikon ?? LayoutPanelLeft };
  };
}

function Dugme({ ikon, etiket, onClick, devre, ton = "" }: { ikon: ReactNode; etiket: string; onClick: () => void; devre?: boolean; ton?: string }) {
  return (
    <button type="button" className={`dugme dugme-sade dugme-ikon ${ton}`} onClick={onClick} title={etiket} aria-label={etiket} disabled={devre}>
      {ikon}
    </button>
  );
}

/* Az kullanılan işlemler (taşı, değiştir, yeni sekme) menüde; başlık dar bölmede de sığsın. */
function DahaFazla({ islem }: { islem: BolmeIslemleri }) {
  const { t } = useDil();
  return (
    <IslemMenusu etiket={t("bolmeIslemleri")} dugmeSinifi="dugme dugme-sade dugme-ikon">
      {islem.onceye && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={islem.onceye}>
          <MoveLeft size={16} className="yon" /> {t("bolmeOnceye")}
        </button>
      )}
      {islem.sonraya && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={islem.sonraya}>
          <MoveRight size={16} className="yon" /> {t("bolmeSonraya")}
        </button>
      )}
      <button type="button" role="menuitem" className="acilir-satir" onClick={islem.degistir}>
        <Replace size={16} /> {t("modulDegistir")}
      </button>
      <a role="menuitem" className="acilir-satir" href={islem.yeniSekme} target="_blank" rel="noopener">
        <ExternalLink size={16} /> {t("yeniSekmedeAc")}
      </a>
    </IslemMenusu>
  );
}

export function BolmeEylemleri({ durum, islem }: { durum: BolmeDurumu; islem: BolmeIslemleri }) {
  const { t } = useDil();
  return (
    <div className="bolme-eylemleri">
      <Dugme ikon={<ArrowLeft size={16} className="yon" />} etiket={t("bolmeGeri")} onClick={islem.geri} devre={!durum.geri} />
      {islem.buyut && (
        <Dugme
          ikon={islem.buyuk ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          etiket={t(islem.buyuk ? "bolmeKucult" : "bolmeBuyut")}
          onClick={islem.buyut}
        />
      )}
      <DahaFazla islem={islem} />
      <Dugme ikon={<X size={16} />} etiket={t("bolmeKapat")} onClick={islem.kapat} />
    </div>
  );
}

/**
 * Bölmenin çerçevesi. `src` yalnız ilk çizimde kuruluyor: değişirse iframe
 * yeniden yüklenir, içinde yarım kalan iş gider. Başka sayfaya geçiş
 * bölmeye mesajla (BolmeKomutu) yapılıyor.
 */
export function BolmeCercevesi({
  ben,
  bolme,
  durum,
  yer,
  islem,
  cerceve,
}: {
  ben: Kisi;
  bolme: Bolme;
  durum: BolmeDurumu;
  yer: { alan: string; arkada: boolean };
  islem: BolmeIslemleri;
  cerceve: (f: HTMLIFrameElement | null) => void;
}) {
  const { t } = useDil();
  const modul = useModul(ben);
  const [src] = useState(() => `${location.pathname}?bolme=1#/${bolmeYolu(bolme.id, bolme.yol)}`);
  const { ad, Ikon } = modul(durum.yol);
  const etiket = t("bolmeCercevesi", { ad });
  return (
    <section id={`bolme-${bolme.id}`} className={`bolme ${yer.arkada ? "arkada" : ""}`} data-bolme={bolme.id} style={{ gridArea: yer.alan }} aria-label={etiket}>
      <header className="bolme-bas">
        <Ikon size={16} />
        <b className="bolme-ad">{ad}</b>
        <BolmeEylemleri durum={durum} islem={islem} />
      </header>
      <iframe ref={cerceve} className="bolme-cerceve" src={src} title={etiket} />
    </section>
  );
}

/* Klavyeyle her basışta ayracın kaydığı mesafe. */
const ADIM = 32;

/**
 * Bölmeler arasındaki ayraç: fareyle sürüklenir, klavyede ok tuşlarıyla
 * kayar. Sürüklerken fare iframe'in üstüne gelince olayları iframe yutar;
 * bu yüzden sürükleme sürerken sahne bölmelere tıklamayı kapatıyor
 * (`canli` dolu → `.suruklen`). Değişen yalnız iki komşu bölme; kayıt
 * bırakınca yazılıyor, sürüklerken bütün bölmelere kayıt gitmesin.
 */
export function Ayrac({
  ayrac,
  sahne,
  paylar,
  canli,
  birak,
}: {
  ayrac: AyracBilgisi;
  sahne: RefObject<HTMLDivElement | null>;
  paylar: [number, number];
  canli: (p: Record<string, number> | null) => void;
  birak: (p: Record<string, number>) => void;
}) {
  const { t } = useDil();
  const yan = ayrac.eksen === "yan";
  const bas = useRef<{ nokta: number; pxA: number; pxB: number; payA: number; payB: number; enAz: number; ters: boolean } | null>(null);

  const olc = (nokta: number) => {
    const s = sahne.current;
    const a = s?.querySelector(`[data-bolme="${ayrac.onceki}"]`)?.getBoundingClientRect();
    const b = s?.querySelector(`[data-bolme="${ayrac.sonraki}"]`)?.getBoundingClientRect();
    if (!s || !a || !b) return null;
    const stil = getComputedStyle(s);
    return {
      nokta,
      pxA: yan ? a.width : a.height,
      pxB: yan ? b.width : b.height,
      payA: paylar[0],
      payB: paylar[1],
      enAz: parseFloat(stil.getPropertyValue(yan ? "--bolme-en-dar" : "--bolme-en-alcak")) || 0,
      // Arapçada sütunlar sağdan başlıyor: sağa çekmek öndeki bölmeyi daraltıyor.
      ters: yan && stil.direction === "rtl",
    };
  };
  const hesapla = (b: NonNullable<typeof bas.current>, fark: number) => {
    const [x, y] = payKaydir(b.payA, b.payB, b.pxA, b.pxB, b.ters ? -fark : fark, b.enAz);
    return { [ayrac.onceki]: x, [ayrac.sonraki]: y };
  };
  const konum = (e: { clientX: number; clientY: number }) => (yan ? e.clientX : e.clientY);
  const bitir = () => {
    bas.current = null;
    canli(null);
  };

  return (
    <div
      className="ayrac"
      role="separator"
      tabIndex={0}
      aria-orientation={yan ? "vertical" : "horizontal"}
      aria-controls={`bolme-${ayrac.onceki}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((paylar[0] / (paylar[0] + paylar[1])) * 100)}
      aria-label={t("ayracEtiketi")}
      style={{ gridArea: ayrac.alan }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const o = olc(konum(e));
        if (!o) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        bas.current = o;
        canli({ [ayrac.onceki]: o.payA, [ayrac.sonraki]: o.payB });
      }}
      onPointerMove={(e) => bas.current && canli(hesapla(bas.current, konum(e) - bas.current.nokta))}
      onPointerUp={(e) => {
        if (!bas.current) return;
        birak(hesapla(bas.current, konum(e) - bas.current.nokta));
        bitir();
      }}
      onPointerCancel={bitir}
      onKeyDown={(e) => {
        const ileri = yan ? "ArrowRight" : "ArrowDown";
        const geri = yan ? "ArrowLeft" : "ArrowUp";
        if (e.key !== ileri && e.key !== geri) return;
        const o = olc(0);
        if (!o) return;
        e.preventDefault();
        birak(hesapla(o, e.key === ileri ? ADIM : -ADIM));
      }}
    />
  );
}
