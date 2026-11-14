import { ChevronRight, Lock, Undo2 } from "lucide-react";
import { useState } from "react";
import { bitmisGorunum, bitmisSonuc, bitmisTarihi } from "../bitmisPaket";
import { durakBul } from "../akis";
import { saatYaz, tarihYaz, useDil } from "../dil";
import { paketKunyesi } from "../kunye";
import { yerelGun } from "../tarih";
import { kisiBul, useVeri, type Kisi, type KunyeRolu, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { SON_KUTU, TUR_ROLLERI, listeKur, sureYazisi } from "./AsamaKutulari";
import { HarekeliMetin } from "./Hareke";
import { KunyeListesi } from "./Kunye";
import { Icerik } from "./Parcalar";

/*
 * Biten paketin şeridi (kullanıcı: aşama bittikten sonra yalnız ince bir
 * şerit; basınca yapım aşamaları, kim ne kadar görmeliyse o kadar; kurallar
 * bitmisPaket.ts). Kapalıyken tek satır: sonucun noktası, başlık, muhabir,
 * tarih. Açılınca aşamalar zaman çizgisi (aşama kutularıyla aynı liste,
 * yapan künyeden, süre ve iade asamaIzi'nden), son metin, video, klip kodu,
 * ekip notları. Paket sayfasında başlık sayfanın kendisinde olduğu için
 * yalnız içi (`sayfada`).
 */
export function BitmisPaketSeridi({ ben, paket, sayfada = false }: { ben: Kisi; paket: Paket; sayfada?: boolean }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const [acik, setAcik] = useState(false);
  if (sayfada) return <BitmisIci ben={ben} paket={paket} sayfada />;
  const sonuc = bitmisSonuc(paket);
  return (
    <div className={`bp-serit${acik ? " acik" : ""}`} data-bitmis-serit={paket.id}>
      <button type="button" className="bp-bas" aria-expanded={acik} onClick={() => setAcik(!acik)}>
        <span className={`bp-nokta ${sonuc}`} title={t(sonuc === "stok" ? "sdStokta" : sonuc === "yapilmadi" ? "psYapilmayan" : "sdYayinlandi")} />
        <span className="bp-baslik">
          <Icerik>{paket.baslik}</Icerik>
        </span>
        <span className="bp-alt">
          <span className="bp-kim">{ad(kisiBul(v, paket.muhabirId ?? paket.hazirlayanId))}</span>
          <span className="bp-tarih">{tarihYaz(bitmisTarihi(paket), dil, "kisa")}</span>
        </span>
        <ChevronRight size={16} className="bp-ok yon" aria-hidden="true" />
      </button>
      {acik && <BitmisIci ben={ben} paket={paket} />}
    </div>
  );
}

function BitmisIci({ ben, paket, sayfada = false }: { ben: Kisi; paket: Paket; sayfada?: boolean }) {
  const { ad, dil, t } = useDil();
  const v = useVeri();
  const g = bitmisGorunum(ben);
  const [metin, setMetin] = useState(false);
  const kunye = paketKunyesi(v, paket);
  const satirlar = listeKur(paket)
    .filter((a) => !SON_KUTU.has(a.id))
    .map((a) => {
      const tur = durakBul(paket, a.id)?.tur ?? a.id;
      const roller = TUR_ROLLERI[tur] ?? [];
      const izler = kunye.filter((s) => roller.includes(s.rol as KunyeRolu)).flatMap((s) => s.kisiler);
      const kisiler = [...new Set(izler.map((k) => k.kisiId))];
      const zaman = izler.map((k) => k.zaman).filter(Boolean).sort().at(-1);
      return { a, kisiler, zaman, iz: paket.asamaIzi?.[a.id] };
    })
    // Yapılmadan kapanan pakette yalnız iz bırakan aşamalar.
    .filter((s) => paket.durum === "tamamlandi" || s.kisiler.length || s.iz);
  const notlar = g.not ? (v.asamaNotlari ?? []).filter((n) => n.paketId === paket.id) : [];
  return (
    <div className={`bp-ic${sayfada ? " sayfada" : ""}`} data-bitmis-ic={paket.id}>
      {sayfada && <h2 className="bp-ic-baslik">{t("bpYapim")}</h2>}
      <ol className="bp-cizgi">
        {satirlar.map(({ a, kisiler, zaman, iz }) => {
          const sure = g.sure(a.masa) && iz;
          return (
            <li key={a.id} className={a.id === "gfx" ? "yan" : ""} data-bp-asama={a.id}>
              <span className="bp-i" aria-hidden="true" />
              <span className="bp-ad">{a.ad}</span>
              <span className="bp-yapan">
                {kisiler.length ? kisiler.map((k) => ad(kisiBul(v, k))).join(" · ") : "—"}
                {a.masa && <small> · {birimAdi(a.masa)}</small>}
              </span>
              <span className="bp-zaman">
                {zaman && `${tarihYaz(yerelGun(zaman), dil, "kisa")} ${saatYaz(zaman, dil)}`}
                {sure && iz.sure >= 60_000 && <span data-bp-sure> · {sureYazisi(iz.sure, t)}</span>}
                {sure && !!iz.iade && (
                  <span className="bp-iade" title={t("akIade", { n: iz.iade })} aria-label={t("akIade", { n: iz.iade })}>
                    {" "}
                    <Undo2 size={12} /> {iz.iade}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {g.cikti && (paket.metin || paket.video || paket.klipKodu) && (
        <div className="bp-ciktilar">
          {paket.metin && (
            <button type="button" className="dugme dugme-ikincil dugme-kucuk" aria-expanded={metin} onClick={() => setMetin(!metin)} data-bp-metin>
              {t("bpSonMetin")}
            </button>
          )}
          {paket.video && (
            <a className="dugme dugme-ikincil dugme-kucuk" href={paket.video} target="_blank" rel="noreferrer">
              {t("videoBaglantisi")} ↗
            </a>
          )}
          {paket.klipKodu && (
            <span className="bp-kod" dir="ltr" title={t("klipKodu")}>
              {paket.klipKodu}
            </span>
          )}
        </div>
      )}
      {g.cikti && metin && paket.metin && (
        <div className="metin-kutu">
          <Icerik blok>
            <HarekeliMetin metin={paket.metin} />
          </Icerik>
        </div>
      )}
      {notlar.map((n) => (
        <p key={n.id} className="bp-not" data-bp-not>
          <Lock size={12} aria-hidden="true" /> <b>{ad(kisiBul(v, n.kisiId))}</b> <span dir="auto">{n.metin}</span>
        </p>
      ))}
      {/* Sayfada bütün künye de (öneren, görevlendiren, onaylayan): çizgi yalnız aşamaların yapanı. */}
      {sayfada && <KunyeListesi satirlar={kunye} />}
      {!sayfada && (
        <a className="bp-sayfa" href={`#/paketler/${paket.id}`}>
          {t("bpSayfayiAc")} <ChevronRight size={14} className="yon" />
        </a>
      )}
    </div>
  );
}
