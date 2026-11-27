import { useEffect, useState, type ReactNode } from "react";
import { gunOlaylari, siradakiOlay, type CizgiOlayi } from "../anaPano";
import { useDil, type Anahtar } from "../dil";
import { bugun } from "../tarih";
import { useVeri } from "../veri";
import { sureYazisi } from "./AsamaKutulari";
import { Icerik } from "./Parcalar";

/*
 * Bugünün zaman çizgisi (GMT): Planlama'nın masaüstü ana sayfasında ve
 * Newsdesk'in ana sayfasında (kullanıcı: Planlama'daki çizgi Newsdesk'te de
 * olsun, beklenen şeylere basıp pratikçe güncellensin). `paketler` beklenen
 * paketleri de çizer; `ac` verilirse kimliği olan olaya (canlı, paket) basınca
 * sayfa değişmez, yerinde düzenleme açılır.
 */

/* Dakikada bir yeniden çizer: geri sayım ve "şimdi" çizgisi kaysın. */
export function useDakika() {
  const [an, setAn] = useState(() => new Date());
  useEffect(() => {
    const z = setInterval(() => setAn(new Date()), 60_000);
    return () => clearInterval(z);
  }, []);
  return an;
}

// GMT; eskiden İstanbul 07–24 idi. Gece işi olan (Newsdesk'in geç teslimleri) çizgi en geç olaya dek uzar, en çok 24.
const BAS_SAAT = 4;
const konumlayici = (bit: number) => (saat: string) => {
  const [h, m] = saat.split(":").map(Number);
  const x = (h + m / 60 - BAS_SAAT) / (bit - BAS_SAAT);
  return Math.min(1, Math.max(0, x)) * 100;
};

/*
 * Olaylar çakışmasın (Newsdesk'te beklenen paketlerle çizgi kalabalık; üst
 * üste binen etiket basılanı başka olaya götürüyordu): her olay, etiketinin
 * sığdığı ilk sıraya. Sağ uçtaki olayın etiketi sola açılır, kartın dışına
 * taşmasın. Etiket rayın yaklaşık yedide biri.
 */
const ETIKET = 15;
const SAG = 82;
const EN_COK_SIRA = 6;
const siralar = (konumlar: number[]) => {
  const sira: [number, number][][] = [];
  return konumlar.map((x) => {
    const a: [number, number] = x > SAG ? [x - ETIKET, x] : [x, x + ETIKET];
    let i = sira.findIndex((l) => l.every(([b, s]) => s <= a[0] || b >= a[1]));
    if (i < 0) i = sira.length < EN_COK_SIRA ? sira.length : sira.length - 1;
    (sira[i] ??= []).push(a);
    return i;
  });
};

const TUR_ADI: Record<CizgiOlayi["tur"], Anahtar> = { cagri: "apCagriSon", toplanti: "apToplanti", canli: "apCanli", paket: "nkBeklenenPaket" };

export function GunCizgisi({ paketler = false, ac }: { paketler?: boolean; ac?: (o: CizgiOlayi) => void }) {
  const { t } = useDil();
  const v = useVeri();
  const an = useDakika();
  const b = bugun();
  const olaylar = gunOlaylari(v, b, { paketler });
  const sira = siradakiOlay(olaylar, an);
  const simdi = `${an.getUTCHours()}:${an.getUTCMinutes()}`;
  const simdiYazi = `${String(an.getUTCHours()).padStart(2, "0")}:${String(an.getUTCMinutes()).padStart(2, "0")}`;
  const enGec = Math.max(0, ...olaylar.map((o) => Number(o.saat.slice(0, 2)) + 1));
  const BIT_SAAT = Math.min(24, Math.max(21, enGec + (enGec % 2)));
  const konum = konumlayici(BIT_SAAT);
  const sira_ = siralar(olaylar.map((o) => konum(o.saat)));
  const sayi = Math.max(2, ...sira_.map((x) => x + 1));
  return (
    <section className="ap-cizgi" aria-label={t("apBugun")} data-ap-cizgi>
      <div className="ap-cizgi-bas">
        <b>{t("apBugun")}</b> <small className="ap-dilim">GMT</small>
        <span className={sira && sira.dakika <= 60 ? "ap-sira yakin" : "ap-sira"} data-ap-siradaki>
          {sira ? siradakiMetni(t, sira.olay.tur === "cagri" ? t("apCagriSon") : sira.olay.ad, sureYazisi(sira.dakika * 60_000, t), sira.olay.tur !== "cagri") : t("apGunBitti")}
        </span>
      </div>
      <div className="ap-cizgi-ray" dir="ltr" style={{ ["--siralar" as string]: sayi }}>
        {Array.from({ length: (BIT_SAAT - BAS_SAAT) / 2 + 1 }, (_, i) => BAS_SAAT + i * 2).map((h) => (
          <span key={h} className="ap-saat" style={{ insetInlineStart: `${konum(`${h}:00`)}%` }}>
            {String(h % 24).padStart(2, "0")}
          </span>
        ))}
        {olaylar.map((o, i) => {
          const ic = (
            <>
              <i aria-hidden="true" />
              <span className="ap-olay-ad">
                <b>{o.saat}</b> {o.tur === "cagri" ? t("apCagriSon") : <Icerik>{o.ad}</Icerik>}
              </span>
            </>
          );
          const sinif = `ap-olay ${o.tur}${konum(o.saat) > SAG ? " sag" : ""}`;
          const stil = { insetInlineStart: `${konum(o.saat)}%`, ["--sira" as string]: sira_[i] };
          const ipucu = `${o.saat} GMT · ${t(TUR_ADI[o.tur])}`;
          if (ac && o.id)
            return (
              <button key={i} type="button" className={sinif} style={stil} title={ipucu} onClick={() => ac(o)} data-ap-olay={o.tur} data-ap-olay-id={o.id}>
                {ic}
              </button>
            );
          return o.href ? (
            <a key={i} className={sinif} style={stil} href={o.href} title={ipucu} data-ap-olay={o.tur}>
              {ic}
            </a>
          ) : (
            <span key={i} className={sinif} style={stil} title={ipucu} data-ap-olay={o.tur}>
              {ic}
            </span>
          );
        })}
        <span className="ap-simdi" style={{ insetInlineStart: `${konum(simdi)}%` }} aria-hidden="true" />
      </div>
      {/* Telefonda ray okunmuyor (etiketler üst üste biniyordu): şimdiden sonraki olaylar alt alta, yerinde düzenleme aynı. */}
      <ol className="ap-cizgi-liste" data-ap-cizgi-liste>
        {olaylar
          .filter((o) => o.saat >= simdiYazi)
          .slice(0, 6)
          .map((o, i) => {
            const ic = (
              <>
                <b>{o.saat}</b> <span className={`ap-tur ${o.tur}`}>{t(TUR_ADI[o.tur])}</span> {o.tur !== "cagri" && <Icerik>{o.ad}</Icerik>}
              </>
            );
            return (
              <li key={i}>
                {ac && o.id ? (
                  <button type="button" className="bag-dugme" onClick={() => ac(o)} data-ap-liste-id={o.id}>
                    {ic}
                  </button>
                ) : o.href ? (
                  <a href={o.href}>{ic}</a>
                ) : (
                  <span>{ic}</span>
                )}
              </li>
            );
          })}
      </ol>
    </section>
  );
}

/* "Sıradaki: <ad> · 2 sa sonra": ad Arapça içerikse bdi içinde, metnin geri kalanı arayüzün dilinde. */
function siradakiMetni(t: ReturnType<typeof useDil>["t"], ad: string, sure: string, icerik: boolean): ReactNode {
  const [on, son] = t("apSiradaki", { ad: "\u0000", sure }).split("\u0000");
  return (
    <>
      {on}
      {icerik ? <Icerik>{ad}</Icerik> : <b>{ad}</b>}
      {son}
    </>
  );
}
