import { ArrowLeft, Circle, CircleCheck, CircleDot, Play, Presentation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../bilesenler/Parcalar";
import Logo from "../bilesenler/Logo";
import { useDil } from "../dil";
import { egitimDurumu, senaryoKisileri, senaryoPaketi, type EgitimAdimi, type EgitimBaglami } from "../egitim";
import type { EgitimVurgusu } from "../egitimVurgu";
import { kisiBul, sifirla, useVeri } from "../veri";
import { birimAdi } from "../yapi";
import type { BolmeBildirimi, BolmeKomutu } from "../yol";

/*
 * Eğitim sahnesi (kullanıcı: eğitimde ve sunumda aşamaları rol rol, eş
 * zamanlı göstermek; tek başına anlatırken adım adım). Yalnız demoda,
 * `#/egitim`. Ekran bölmelere ayrılır, her bölme uygulamanın kendisi ve
 * kendi kişisiyle (oturum.ts → `?kim=`); kayıt ortak olduğu için muhabirin
 * gönderdiği öneri Planlama'nın bölmesine hemen düşer. Solda senaryo: sıradaki
 * adım kayıttan çıkar (egitim.ts), o adımın kişisinin bölmesi doğru sayfayı
 * açar, basılacak düğme vurgulanır (egitimVurgu.ts). Tek ekranda bölme bir
 * tane, kişisi adımla değişir. Eğitimin anlatımı burada yazılı: tanıtım
 * sayfası gibi işi anlatmak.
 */

type Duzen = "tek" | "yan";
interface Kayit {
  b: EgitimBaglami | null;
  duzen: Duzen;
  tur: number;
}
const ANAHTAR = "trt-planlama-egitim";

const oku = (): Kayit => {
  try {
    return { b: null, duzen: "yan", tur: 0, ...JSON.parse(sessionStorage.getItem(ANAHTAR) ?? "{}") };
  } catch {
    return { b: null, duzen: "yan", tur: 0 };
  }
};

const AdimIkonu = ({ durum }: { durum: EgitimAdimi["durum"] }) =>
  durum === "gecti" ? <CircleCheck size={16} /> : durum === "simdi" ? <CircleDot size={16} /> : <Circle size={16} />;

export default function Egitim() {
  const { t } = useDil();
  const v = useVeri();
  const [k, setK] = useState<Kayit>(oku);
  const yaz = (y: Kayit) => {
    setK(y);
    try {
      sessionStorage.setItem(ANAHTAR, JSON.stringify(y));
    } catch {
      /* gizli pencere: yalnız bu sayfada */
    }
  };

  const baslat = () => {
    if (!confirm(t("egBaslatOnay"))) return;
    sifirla();
    yaz({ ...k, b: { baslangic: new Date().toISOString(), muhabirId: "mu1" }, tur: k.tur + 1 });
  };

  const durum = k.b ? egitimDurumu(v, k.b) : null;
  const is = durum?.is;
  const paket = k.b && durum ? senaryoPaketi(v, durum.oneriId) : undefined;
  // Yan yana düzende senaryonun rolleri; tek ekranda yalnız sıradaki adımın kişisi (bitince son kişi kalır).
  const sonKisi = useRef("mu1");
  if (is) sonKisi.current = is.kisiId;
  const bolmeler = !k.b ? [] : k.duzen === "tek" ? [sonKisi.current] : senaryoKisileri(v, k.b, paket);
  // Sıradaki adımın kişisi yan yana düzende yoksa (beşinci rol) son bölme ona geçer.
  if (is && k.duzen === "yan" && !bolmeler.includes(is.kisiId)) bolmeler[bolmeler.length - 1] = is.kisiId;
  const ev = paket ? `paketler/${paket.id}` : durum?.oneriId ? `oneriler/${durum.oneriId}` : "";

  return (
    <div className={`egitim${k.b ? "" : " bos"}`} data-egitim>
      <aside className="egitim-panel">
        <div className="egitim-ust">
          <a href="#/" className="dugme dugme-sade dugme-ikon" title={t("hsAnaSayfa")} aria-label={t("hsAnaSayfa")}>
            <ArrowLeft size={18} className="yon" />
          </a>
          <Logo />
        </div>
        <h1>
          <Presentation size={20} /> {t("egBaslik")}
        </h1>
        <p className="egitim-senaryo">{t("egSenaryo")}</p>
        <div className="egitim-duzen" role="group" aria-label={t("egDuzen")}>
          {(["tek", "yan"] as const).map((x) => (
            <button key={x} type="button" className="dugme dugme-ikincil dugme-kucuk" aria-pressed={k.duzen === x} onClick={() => yaz({ ...k, duzen: x })} data-egitim-duzen={x}>
              {t(x === "tek" ? "egTekEkran" : "egYanYana")}
            </button>
          ))}
        </div>
        <button type="button" className="dugme" onClick={baslat} data-egitim-baslat>
          <Play size={16} className="yon" /> {t("egBaslat")}
        </button>
        {durum && (
          <>
            <ol className="egitim-adimlar" data-egitim-adimlar>
              {durum.adimlar.map((a) => (
                <li key={a.id} className={a.durum} data-egitim-adim={a.id} data-egitim-durum={a.durum || "bekliyor"}>
                  <AdimIkonu durum={a.durum} /> {"anahtar" in a.ad ? t(a.ad.anahtar) : a.ad.metin}
                </li>
              ))}
            </ol>
            {is ? (
              <div className="egitim-is" data-egitim-is={is.metin}>
                <small>{t("egSiradaki")}</small>
                <KisiSatiri id={is.kisiId} />
                <p>{t(is.metin)}</p>
              </div>
            ) : (
              <p className="egitim-is" data-egitim-is={durum.bitti ? "bitti" : "yok"}>
                {t(durum.bitti ? "egBitti" : "egBekliyor")}
              </p>
            )}
          </>
        )}
      </aside>
      {k.b && (
        <main className={`egitim-sahne b${bolmeler.length}`} data-egitim-sahne>
          {bolmeler.map((id) => (
            <EgitimBolmesi key={`${k.tur}:${id}`} kisiId={id} aktif={is?.kisiId === id} yol={is?.kisiId === id ? is.yol : ev} secici={is?.kisiId === id ? is.secici : ""} />
          ))}
        </main>
      )}
    </div>
  );
}

function KisiSatiri({ id }: { id: string }) {
  const { ad } = useDil();
  const v = useVeri();
  const kisi = kisiBul(v, id);
  return (
    <span className="egitim-kisi">
      <Avatar kisi={kisi} boy="kucuk" />
      <b>{kisi ? ad(kisi) : id}</b>
      <span className="sonuk">{kisi ? birimAdi(kisi.birim) : ""}</span>
    </span>
  );
}

/*
 * Bir rolün bölmesi: iframe bir kez kurulur (taşınırsa ya da adresi değişirse
 * yeniden yüklenir, yarım iş gider). Sıra bu bölmeye gelince sayfası mesajla
 * değişir; vurgu bölme her yer değiştirdiğinde yeniden gönderilir.
 */
function EgitimBolmesi({ kisiId, aktif, yol, secici }: { kisiId: string; aktif: boolean; yol: string; secici: string }) {
  const cerceve = useRef<HTMLIFrameElement>(null);
  const [ilk] = useState(() => `./?bolme=1&kim=${encodeURIComponent(kisiId)}#/${yol}`);
  const vurgu = useRef(secici);
  vurgu.current = secici;

  const gonder = () => {
    const m: EgitimVurgusu = { tur: "trt-egitim-vurgu", secici: vurgu.current };
    cerceve.current?.contentWindow?.postMessage(m, location.origin);
  };

  // Sıra bu bölmeye geldi ya da adım değişti: sayfayı aç, düğmeyi vurgula.
  useEffect(() => {
    if (aktif) {
      const m: BolmeKomutu = { tur: "trt-bolme-git", yol };
      cerceve.current?.contentWindow?.postMessage(m, location.origin);
    }
    gonder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, yol, secici]);

  // Bölme yer değiştirince (kişi başka sayfaya geçti) vurgu yeniden.
  useEffect(() => {
    const dinle = (e: MessageEvent<BolmeBildirimi>) => {
      if (e.source === cerceve.current?.contentWindow && e.data?.tur === "trt-bolme") gonder();
    };
    window.addEventListener("message", dinle);
    return () => window.removeEventListener("message", dinle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={`egitim-bolme${aktif ? " aktif" : ""}`} data-egitim-bolme={kisiId} data-egitim-aktif={aktif || undefined}>
      <header>
        <KisiSatiri id={kisiId} />
      </header>
      <iframe ref={cerceve} src={ilk} title={kisiId} onLoad={gonder} />
    </section>
  );
}
