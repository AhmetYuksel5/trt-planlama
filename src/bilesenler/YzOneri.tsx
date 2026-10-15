import { Loader2, RefreshCw, Sparkles, Undo2, X } from "lucide-react";
import { useState } from "react";
import { gecenSure, useDil, type Anahtar } from "../dil";
import { BICIM_ADI, sehirAr } from "../etiketler";
import { yzGorusKaydet } from "../eylemler";
import { baslikBul, kisiBul, useVeri, type Durum, type Kisi, type Oneri, type OneriBicimi, type YzGenel } from "../veri";
import { useBen } from "../oturum";
import { yzGorusuGorur } from "../yetki";
import { useYz, yzHataMetni, yzIste, type YzBicimSonucu, type YzOneriGirdisi } from "../yz";
import { Icerik, Rozet, bildir } from "./Parcalar";

/*
 * Öneri üzerindeki yapay zeka işleri (src/yz.ts, belgeler/yapay-zeka.md):
 * "Biçimle" öneriyi kurumun biçimine çeviriyor (Header, Strap, gelişme,
 * haber türü), "Haber değeri" ölçütlerle görüş veriyor. İkisi de tavsiye:
 * biçimleme forma alan alan uygulanıyor, kişi kaydediyor; görüş kararı
 * değiştirmiyor. Özellik kişiye açık değilse düğme çizilmiyor.
 */

const GENEL_TONU: Record<YzGenel, string> = { yuksek: "iyi", orta: "uyari", dusuk: "kotu" };
const GENEL_ADI: Record<YzGenel, Anahtar> = { yuksek: "yzGenel_yuksek", orta: "yzGenel_orta", dusuk: "yzGenel_dusuk" };

/*
 * Planlama'nın elinden geçmiş öneriler örnek olarak gidiyor: muhabirin
 * yazdığı (ilk hal) → son hal. Son halin Header'ı havuzdaki dosyanın adı,
 * gelişmesi plana giren satır: producer'ların asıl biçimi o. Eğitim yok,
 * model kurumun düzeltmelerini her istekte görüyor.
 */
const ornekler = (d: Durum) =>
  d.oneriler
    .filter((o) => o.ilkHali)
    .sort((a, b) => (a.zaman < b.zaman ? 1 : -1))
    .slice(0, 5)
    .map((o) => ({
      once: o.ilkHali!,
      sonra: {
        haberBasligi: baslikBul(d, o.baslikId)?.ad ?? o.haberBasligi,
        paketBasligi: o.paketBasligi,
        gelisme: d.gelismeler.find((g) => g.oneriId === o.id)?.metin ?? o.gelisme,
      },
    }));

export interface BicimDegeri {
  haberBasligi: string;
  paketBasligi?: string;
  gelisme: string;
  bicim?: OneriBicimi;
}

export function YzBicimle({
  deger,
  muhabirId,
  strapli,
  uygula,
}: {
  deger: BicimDegeri;
  muhabirId?: string;
  /** Takipte strap ve haber türü yok; yalnız Header ve gelişme. */
  strapli: boolean;
  uygula: (p: Partial<BicimDegeri>) => void;
}) {
  const { t } = useDil();
  const v = useVeri();
  const ozellik = useYz("bicimle");
  const [bekliyor, setBekliyor] = useState(false);
  const [sonuc, setSonuc] = useState<YzBicimSonucu | null>(null);
  const [onceki, setOnceki] = useState<BicimDegeri | null>(null);
  if (!ozellik) return null;
  const bitti = ozellik.kalan <= 0;
  const bos = !deger.haberBasligi.trim() && !deger.gelisme.trim();
  const iste = async () => {
    if (bekliyor || bitti || bos) return;
    setBekliyor(true);
    const r = await yzIste("bicimle", {
      haberBasligi: deger.haberBasligi,
      paketBasligi: deger.paketBasligi,
      gelisme: deger.gelisme,
      yer: sehirAr(kisiBul(v, muhabirId)?.sehir),
      bicim: deger.bicim,
      basliklar: v.basliklar.filter((b) => b.aktif).map((b) => b.ad),
      ornekler: ornekler(v),
    });
    setBekliyor(false);
    if (r.tamam) setSonuc(r.veri);
    else bildir(yzHataMetni(t, r.hata));
  };
  // Yalnız değişen ve boş olmayan alanlar; aynı kalan alanı uygulamak anlamsız.
  const satirlar = sonuc
    ? (
        [
          ["haberBasligi", t("haberBasligi"), deger.haberBasligi, sonuc.haberBasligi],
          ["paketBasligi", t("onerilenPaketBasligi"), deger.paketBasligi ?? "", strapli ? sonuc.paketBasligi : ""],
          ["gelisme", t("gelismeAciklama"), deger.gelisme, sonuc.gelisme],
        ] as const
      ).filter(([, , eski, yeni]) => yeni && yeni !== eski.trim())
    : [];
  const bicimDegisir = !!sonuc?.bicim && strapli && sonuc.bicim !== deger.bicim;
  const hepsi: Partial<BicimDegeri> = Object.fromEntries([...satirlar.map(([k, , , yeni]) => [k, yeni]), ...(bicimDegisir ? [["bicim", sonuc!.bicim]] : [])]);
  const uygulaVeSakla = (p: Partial<BicimDegeri>) => {
    setOnceki((x) => x ?? deger);
    uygula(p);
  };
  return (
    <div className="yz-bicimle" data-yz-bicimle>
      <div className="yz-satir">
        <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={iste} aria-disabled={bekliyor || bitti || bos} title={bitti ? t("yzSinirDoldu") : t("yzBicimle")} data-yz-bicimle-dugme>
          {bekliyor ? <Loader2 size={14} className="donen" /> : <Sparkles size={14} />} {t("yzBicimle")}
        </button>
        {onceki && (
          <button
            type="button"
            className="dugme dugme-sade dugme-kucuk"
            onClick={() => {
              uygula(onceki);
              setOnceki(null);
            }}
            data-yz-bicimle-geri
          >
            <Undo2 size={14} /> {t("yzOncekiMetin")}
          </button>
        )}
        {bitti && <small className="sonuk">{t("yzSinirDoldu")}</small>}
      </div>
      {sonuc && (
        <div className="yz-oneri-kutu" data-yz-bicimle-sonuc>
          <div className="yz-oneri-bas">
            <b>
              <Sparkles size={14} /> {t("yzOnerisi")}
            </b>
            <button type="button" className="dugme dugme-sade dugme-ikon" onClick={() => setSonuc(null)} title={t("kapat")} aria-label={t("kapat")}>
              <X size={15} />
            </button>
          </div>
          {!satirlar.length && !bicimDegisir && <p className="sonuk">{t("yzDegisiklikYok")}</p>}
          {satirlar.map(([k, ad, , yeni]) => (
            <div key={k} className="yz-oneri-alan" data-yz-alan={k}>
              <small>{ad}</small>
              <Icerik blok>{yeni}</Icerik>
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => uygulaVeSakla({ [k]: yeni })} data-yz-uygula={k}>
                {t("yzUygula")}
              </button>
            </div>
          ))}
          {bicimDegisir && (
            <div className="yz-oneri-alan" data-yz-alan="bicim">
              <small>{t("haberTuru")}</small>
              <b>{t(BICIM_ADI(sonuc.bicim!))}</b>
              <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => uygulaVeSakla({ bicim: sonuc.bicim })} data-yz-uygula="bicim">
                {t("yzUygula")}
              </button>
            </div>
          )}
          {satirlar.length + (bicimDegisir ? 1 : 0) > 1 && (
            <div className="form-alt">
              <button
                type="button"
                className="dugme dugme-kucuk"
                onClick={() => {
                  uygulaVeSakla(hepsi);
                  setSonuc(null);
                }}
                data-yz-hepsini-uygula
              >
                {t("yzHepsiniUygula")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Kapıya giden öneri: yer ve ülke muhabirden, kaynak muhabir dışı kaynaktan. */
const degerGirdisi = (d: Durum, o: Oneri, ulkeAdi: string): YzOneriGirdisi => ({
  haberBasligi: o.haberBasligi,
  paketBasligi: o.paketBasligi,
  gelisme: o.gelisme,
  yer: sehirAr(kisiBul(d, o.muhabirId)?.sehir),
  ulke: ulkeAdi,
  bicim: o.bicim,
  kaynak: o.kaynakAdi,
  tarih: o.hedefTarih,
});

/*
 * Haber değeri görüşü: önerinin değerlendirme bölümünde. Görüş öneriye
 * bağlı ayrı kayıtta, ekibin hepsi görüyor; muhabir görmüyor. Özellik
 * kişiye kapalıysa var olan görüş yine okunuyor, yalnız düğme yok.
 */
export function YzHaberDegeri({ ben, oneri: o, ulkeAdi }: { ben: Kisi; oneri: Oneri; ulkeAdi: string }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const ozellik = useYz("haberDegeri");
  const [bekliyor, setBekliyor] = useState(false);
  const gorus = v.yzGorusleri?.find((g) => g.oneriId === o.id);
  if (!yzGorusuGorur(ben) || (!gorus && !ozellik)) return null;
  const bitti = !!ozellik && ozellik.kalan <= 0;
  const iste = async () => {
    if (bekliyor || bitti) return;
    setBekliyor(true);
    const r = await yzIste("haberDegeri", { ...degerGirdisi(v, o, ulkeAdi), dil, kriterler: t("yzVarsayilanKriterler").split("\n") });
    setBekliyor(false);
    if (r.tamam) yzGorusKaydet(ben, o.id, r.veri);
    else bildir(yzHataMetni(t, r.hata));
  };
  const kisi = kisiBul(v, gorus?.kisiId);
  return (
    <div className="yz-gorus" data-yz-gorus>
      <div className="alan-etiket">
        <Sparkles size={13} /> {t("yzGorus")}
      </div>
      {gorus && (
        <div className="yz-gorus-kutu">
          <p>
            <Rozet ton={GENEL_TONU[gorus.genel]}>{t(GENEL_ADI[gorus.genel])}</Rozet>{" "}
            <small className="sonuk">
              {kisi ? `${ad(kisi)} · ` : ""}
              {gecenSure(gorus.zaman, dil)}
            </small>
          </p>
          {gorus.ozet && <p dir="auto">{gorus.ozet}</p>}
          <ul className="yz-kriterler">
            {gorus.kriterler.map((k) => (
              <li key={k.ad}>
                <span className="yz-puan" aria-label={t("yzPuan", { n: k.puan })}>
                  {"●".repeat(k.puan)}
                  <span className="sonuk">{"○".repeat(5 - k.puan)}</span>
                </span>
                <b dir="auto">{k.ad}</b>
                {k.gerekce && k.gerekce !== "—" && <span dir="auto"> · {k.gerekce}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {ozellik && (
        <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={iste} aria-disabled={bekliyor || bitti} title={bitti ? t("yzSinirDoldu") : undefined} data-yz-gorus-al>
          {bekliyor ? <Loader2 size={14} className="donen" /> : gorus ? <RefreshCw size={14} /> : <Sparkles size={14} />} {t(gorus ? "yzGorusYenile" : "yzGorusAl")}
        </button>
      )}
    </div>
  );
}

/** Kartta küçük rozet: görüş alınmışsa genel kanaat. */
export function YzGorusRozeti({ oneri: o, d }: { oneri: Oneri; d: Durum }) {
  const { t } = useDil();
  const ben = useBen();
  const gorus = d.yzGorusleri?.find((g) => g.oneriId === o.id);
  if (!gorus || !yzGorusuGorur(ben)) return null;
  return (
    <Rozet ton={GENEL_TONU[gorus.genel]} title={`${t("yzGorus")}: ${t(GENEL_ADI[gorus.genel])}`}>
      <Sparkles size={11} /> {t(GENEL_ADI[gorus.genel])}
    </Rozet>
  );
}
