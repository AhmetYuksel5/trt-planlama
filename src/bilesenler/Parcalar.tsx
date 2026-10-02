import { ArrowRight, Construction, Inbox, Info, Lock } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ADIM_ADI, ASAMALAR, ASAMA_ADI, asamaBul, geciktiMi, uretimYolu, type UretimAdimi } from "../akis";
import { useDil } from "../dil";
import { PAKET_DURUM_ADI, TUR_ADI } from "../etiketler";
import type { IcerikTuru, Kisi, Paket } from "../veri";

/* Ekranların ortak parçaları: kendi başına veri okumuyor, ne verilirse onu çiziyor. */

/*
 * Kayıt içeriği her arayüz dilinde Arapça ve sağdan sola. Yön `auto`
 * değil sabit `rtl`: "OPEC+ …" gibi Latin özel isimle başlayan başlık da
 * sağdan sola aksın, Latin parça kendi içinde doğru okunsun. Satır içi
 * biçim (`bdi`) arayüz cümlesinin akışını bozmadan yalıtıyor; `blok`
 * kendi satırını, hücresini ya da paragrafını alıp sağa yaslanıyor.
 * Ekranlar `dir`/`lang` elle yazmıyor, yön yalnız buradan geliyor.
 */
export function Icerik({ children, blok = false, className = "" }: { children?: ReactNode; blok?: boolean; className?: string }) {
  if (children === undefined || children === null || children === "") return null;
  const Oge = blok ? "span" : "bdi";
  return (
    <Oge dir="rtl" lang="ar" className={`icerik${blok ? " blok" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </Oge>
  );
}

/** İçerik yazılan form alanı: yazarken de sağdan sola. Dil denetimi yok; Latin özel isim serbest. */
export const icerikAlani = { dir: "rtl", lang: "ar" } as const;

export function Kart({
  baslik,
  ikon,
  ek,
  sagUc,
  children,
  className = "",
}: {
  baslik?: ReactNode;
  ikon?: ReactNode;
  ek?: ReactNode;
  sagUc?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`kart ${className}`}>
      {(baslik || sagUc) && (
        <header className="kart-bas">
          {baslik && (
            <h2>
              {ikon}
              {baslik}
            </h2>
          )}
          {ek && <span className="ek">{ek}</span>}
          {sagUc && <div className="sag-uc">{sagUc}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Tumu({ href, metin }: { href: string; metin?: string }) {
  const { t } = useDil();
  return (
    <a className="tumu" href={href}>
      {metin ?? t("tumu")} <ArrowRight size={13} className="yon" />
    </a>
  );
}

export function Rozet({ ton, children, title }: { ton?: string; children: ReactNode; title?: string }) {
  return (
    <span className={`rozet ${ton ? (ton.startsWith("tur-") ? ton : `rozet-${ton}`) : ""}`} title={title}>
      {children}
    </span>
  );
}

export function TurRozeti({ tur }: { tur: IcerikTuru }) {
  const { t } = useDil();
  return <Rozet ton={`tur-${tur}`}>{t(TUR_ADI[tur])}</Rozet>;
}

/*
 * Renk kişiye sabit: aynı kişi her ekranda aynı tonda görünsün. Kimlikler
 * birbirine çok benzediği için (pl1, pl2) karma altın açıyla dağıtılıyor;
 * yoksa ardışık kişiler aynı renge düşüyordu.
 */
const ton = (id: string) => Math.round(([...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7) * 137.508) % 360);

export function Avatar({ kisi, boy = "", durum = false }: { kisi?: Kisi; boy?: "" | "kucuk" | "buyuk"; durum?: boolean }) {
  const { ad: adi } = useDil();
  if (!kisi) return <span className={`avatar ${boy} avatar-fazla`}>?</span>;
  const ad = typeof kisi.ad === "string" ? kisi.ad : kisi.ad.tr;
  const harf = ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr");
  return (
    <span
      className={`avatar ${boy} ${durum ? `durum-${kisi.durum}` : ""}`}
      style={{ ["--ton" as string]: ton(kisi.id) }}
      title={adi(kisi)}
      aria-hidden="true"
    >
      {harf}
      {durum && <i className="durum-nokta" />}
    </span>
  );
}

export function KisiHucre({ kisi, alt }: { kisi?: Kisi; alt?: ReactNode }) {
  const { ad, t } = useDil();
  return (
    <span className="kisi-hucre">
      <Avatar kisi={kisi} boy="kucuk" />
      <span>
        {kisi ? ad(kisi) : t("atanmadi")}
        {alt && (
          <>
            <br />
            <small className="sonuk">{alt}</small>
          </>
        )}
      </span>
    </span>
  );
}

export function Sayac({
  ikon,
  etiket,
  deger,
  alt,
  ton = "",
  renk = "",
  href,
}: {
  ikon: ReactNode;
  etiket: string;
  deger: number | string;
  alt?: string;
  ton?: "" | "iyi" | "kotu" | "uyari";
  renk?: string;
  href?: string;
}) {
  const icerik = (
    <>
      <span className="ikon">{ikon}</span>
      <div>
        <span>{etiket}</span>
        <b>{deger}</b>
        {alt && <small>{alt}</small>}
      </div>
    </>
  );
  const sinif = `sayac ${ton} ${renk}`;
  return href ? (
    <a className={sinif} href={href}>
      {icerik}
    </a>
  ) : (
    <div className={sinif}>{icerik}</div>
  );
}

export function Ilerleme({ oran, renk = "" }: { oran: number; renk?: string }) {
  const yuzde = Math.round(Math.max(0, Math.min(1, oran)) * 100);
  return (
    <div className="ilerleme-satir">
      <div className={`ilerleme ${renk}`} role="progressbar" aria-valuenow={yuzde} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${yuzde}%` }} />
      </div>
      <b>%{yuzde}</b>
    </div>
  );
}

export function Bos({ metin, kucuk = false, ikon }: { metin: string; kucuk?: boolean; ikon?: ReactNode }) {
  if (kucuk) return <p className="bos-kucuk">{metin}</p>;
  return (
    <div className="bos">
      {ikon ?? <Inbox size={28} />}
      <span>{metin}</span>
    </div>
  );
}

/** Raporun tasarım ilkesi: tanımı bitmemiş akış kesinmiş gibi görünmesin. */
export function TaslakEtiketi({ metin }: { metin?: string }) {
  const { t } = useDil();
  return (
    <span className="taslak-etiketi" title={t("taslakAkisAciklama")}>
      <Construction size={13} /> {metin ?? t("taslakAkis")}
    </span>
  );
}

export function NotKutu({ ton = "", children, ikon }: { ton?: "" | "vurgu" | "uyari" | "iyi"; children: ReactNode; ikon?: ReactNode }) {
  return (
    <div className={`not-kutu ${ton}`}>
      {ikon ?? <Info size={16} />}
      <div>{children}</div>
    </div>
  );
}

export function Kilitli({ metin }: { metin: string }) {
  return (
    <span className="kilitli">
      <Lock size={13} /> {metin}
    </span>
  );
}

/* --- Paket durumu: beş aşama ve ince adımlar --- */

const PAKET_DURUM_TONU: Record<Paket["durum"], string> = {
  taslak: "",
  degerlendiriliyor: "uyari",
  onaylandi: "vurgu",
  uretimde: "vurgu",
  tamamlandi: "iyi",
  iptal: "kotu",
};

/** Paketin durum etiketi; üretimdeyse hangi adımda olduğunu da söylüyor. */
export function PaketDurumRozeti({ paket }: { paket: Paket }) {
  const { t } = useDil();
  if (paket.durum === "uretimde" && paket.adim) {
    return <Rozet ton={geciktiMi(paket) ? "kotu" : "vurgu"}>{t(ADIM_ADI[paket.adim as UretimAdimi])}</Rozet>;
  }
  return <Rozet ton={PAKET_DURUM_TONU[paket.durum]}>{t(PAKET_DURUM_ADI[paket.durum])}</Rozet>;
}

export function AsamaCubugu({ paket }: { paket: Paket }) {
  const { t } = useDil();
  const simdi = asamaBul(paket);
  const gecikti = geciktiMi(paket);
  return (
    <span
      className={`asama ${simdi === null ? "iptal" : ""}`}
      title={simdi === null ? t("pdIptal") : simdi >= ASAMALAR.length ? t("pdTamamlandi") : t(ASAMA_ADI[ASAMALAR[simdi]])}
    >
      {ASAMALAR.map((a, i) => (
        <i
          key={a}
          className={
            simdi === null ? "" : i < simdi ? "gecti" : i === simdi ? (gecikti ? "gecikti" : paket.durum === "tamamlandi" ? "gecti" : "simdi") : ""
          }
        />
      ))}
    </span>
  );
}

/** Detay ekranındaki büyük gösterim: beş aşama kutusu ve altında üretim adımları. */
export function AsamaBuyuk({ paket }: { paket: Paket }) {
  const { t } = useDil();
  const simdi = asamaBul(paket);
  const gecikti = geciktiMi(paket);
  const yol = uretimYolu(paket);
  const adimSirasi = paket.adim ? yol.indexOf(paket.adim as UretimAdimi) : paket.durum === "tamamlandi" ? yol.length : -1;
  return (
    <>
      <div className="asama-buyuk">
        {ASAMALAR.map((a, i) => {
          const durum =
            simdi === null ? "" : i < simdi || paket.durum === "tamamlandi" ? "gecti" : i === simdi ? (gecikti ? "gecikti" : "simdi") : "";
          const atlandi = a === "newsgathering" && !paket.sahaGerekli;
          return (
            <div key={a} className={atlandi ? "" : durum}>
              <span className="no">{i + 1}</span>
              <b>{t(ASAMA_ADI[a])}</b>
              <small>
                {atlandi
                  ? t("asamaAtlandi")
                  : durum === "gecti"
                    ? t("asamaGecti")
                    : durum === "simdi"
                      ? t("asamaSimdi")
                      : durum === "gecikti"
                        ? t("gecikti")
                        : t("asamaBekliyor")}
              </small>
            </div>
          );
        })}
      </div>
      {(paket.durum === "uretimde" || paket.durum === "tamamlandi") && (
        <div className="adim-seridi">
          {yol.map((a, i) => (
            <span key={a} className={i < adimSirasi ? "gecti" : i === adimSirasi ? (gecikti ? "gecikti" : "simdi") : ""}>
              {t(ADIM_ADI[a])}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/* --- Kısa bildirim: eylemin sonucunu söyleyip kayboluyor. --- */

let goster: ((m: string) => void) | null = null;
export const bildir = (m: string) => goster?.(m);

export function Bildiri() {
  const [mesaj, setMesaj] = useState<string | null>(null);
  useEffect(() => {
    goster = setMesaj;
    return () => {
      goster = null;
    };
  }, []);
  useEffect(() => {
    if (!mesaj) return;
    const z = setTimeout(() => setMesaj(null), 3200);
    return () => clearTimeout(z);
  }, [mesaj]);
  return mesaj ? (
    <div className="bildiri" role="status">
      {mesaj}
    </div>
  ) : null;
}
