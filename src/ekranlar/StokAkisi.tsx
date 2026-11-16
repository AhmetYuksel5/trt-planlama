import { CalendarClock, CheckCircle2, Clock, Send, Undo2, UsersRound } from "lucide-react";
import { useState } from "react";
import { PaketSeridi } from "../bilesenler/BitmisPaket";
import { Bos, Icerik, Rozet, TurRozeti, bildir } from "../bilesenler/Parcalar";
import { TarihGirdisi } from "../bilesenler/TarihSaat";
import { UretimeAlDugmesi } from "../bilesenler/UretimBalonu";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import { hazirPaketEkle, stokMasayaVer, stokTopluGorevlendir, stokYayiniGeriAl, stokYayinlandi } from "../eylemler";
import { SORU_MASALARI } from "../masaSorusu";
import { acikGunPlanlari } from "../oneriPlanlari";
import { STOK_ASAMALARI, asamaPaketleri, bayatMi, gorevGecikti, hazirYasi, onerildigiPlanlar, type StokAsamasi } from "../stokAkisi";
import { bugun } from "../tarih";
import { kisiBul, useVeri, type Kisi, type Paket } from "../veri";
import { birimAdi } from "../yapi";
import { ileriGorevVerebilir, planIcerikDuzenler, stokEkibi, stokGorevlendirebilir, stokYayinIsler, stokYayiniGeriAlabilir, uretimeAlabilir } from "../yetki";
import { useAdimDurumu } from "../yol";
import { MuhabirSecici } from "./nextday/Formlar";

/*
 * Stok sayfasının akışı (kullanıcı: stok sorumlusu kararlaştırılan paketleri
 * görevlendiriyor, muhabirlere süre veriyor, hazırlananları listede tutup
 * yayınlanmasını takip ediyor): beş aşama tek şeritte, seçilen aşamanın işi
 * altında. Aşama kayıttan okunur (stokAkisi.ts).
 */

const ASAMA_ADI: Record<StokAsamasi, Anahtar> = {
  gorevlendirilecek: "stAsGorev",
  muhabirde: "stAsMuhabirde",
  uretimde: "stAsUretimde",
  hazir: "stAsHazir",
  yayinlandi: "stAsYayinlandi",
};

export function StokAkisi({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const [asama, setAsama] = useAdimDurumu<StokAsamasi>("stok:asama", "gorevlendirilecek");
  const bg = bugun();
  const listeler = Object.fromEntries(STOK_ASAMALARI.map((a) => [a, asamaPaketleri(v, a)])) as Record<StokAsamasi, Paket[]>;
  // Aşamanın yanında dikkat isteyen sayı: geciken görev, bayatlayan hazır paket.
  const uyari: Partial<Record<StokAsamasi, number>> = {
    muhabirde: listeler.muhabirde.filter((p) => gorevGecikti(p, bg)).length,
    hazir: listeler.hazir.filter((p) => bayatMi(p, bg)).length,
  };
  const l = listeler[asama];
  return (
    <section className="stok-akis" data-stok-akis>
      <nav className="stok-asamalari" aria-label={t("mStok")}>
        {STOK_ASAMALARI.map((a, i) => (
          <button key={a} type="button" className={asama === a ? "secili" : ""} aria-pressed={asama === a} onClick={() => setAsama(a)} data-stok-asama={a}>
            <span className="sa-no">{i + 1}</span>
            <span className="sa-ad">{t(ASAMA_ADI[a])}</span>
            <em>{listeler[a].length}</em>
            {!!uyari[a] && (
              <span className="sa-uyari" title={t(a === "hazir" ? "stBayat" : "stGecikti")}>
                {uyari[a]}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="stok-asama-govde" data-stok-govde={asama}>
        {l.length === 0 ? (
          <Bos kucuk metin={t("stBos")} />
        ) : asama === "gorevlendirilecek" ? (
          <TopluGorev ben={ben} paketler={l} />
        ) : (
          <div className="bp-liste">
            {l.map((p) => (
              <StokSatiri key={p.id} ben={ben} paket={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* Satır başına muhabir ve son gün; işaretlenenler tek düğmeyle görevlendirilir, "Seçilenlerin son günü" hepsine yazar. */
function TopluGorev({ ben, paketler }: { ben: Kisi; paketler: Paket[] }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const yetkili = stokEkibi(ben) && ileriGorevVerebilir(ben);
  const [satir, setSatir] = useState<Record<string, { sec: boolean; muhabirId: string; sonTarih: string }>>({});
  const al = (p: Paket) => satir[p.id] ?? { sec: false, muhabirId: p.muhabirTbc ? "" : (p.muhabirId ?? ""), sonTarih: p.sonTarih && p.sonTarih >= bugun() ? p.sonTarih : "" };
  const yaz = (p: Paket, x: Partial<{ sec: boolean; muhabirId: string; sonTarih: string }>) => setSatir((s) => ({ ...s, [p.id]: { ...al(p), ...x } }));
  const secili = paketler.filter((p) => al(p).sec);
  const hazir = secili.filter((p) => al(p).muhabirId && al(p).sonTarih);
  const hepsi = paketler.length > 0 && secili.length === paketler.length;
  const gonder = () => {
    if (!hazir.length || !confirm(t("eminMisin"))) return;
    const n = stokTopluGorevlendir(
      ben,
      hazir.map((p) => ({ paketId: p.id, muhabirId: al(p).muhabirId, sonTarih: al(p).sonTarih })),
    );
    if (n) {
      setSatir({});
      bildir(t("stGorevlendirildi", { n }));
    }
  };
  return (
    <div className="stok-toplu" data-stok-toplu>
      {yetkili && (
        <div className="stok-toplu-cubuk">
          <label className="secim">
            <input type="checkbox" checked={hepsi} onChange={(e) => paketler.forEach((p) => yaz(p, { sec: e.target.checked }))} data-stok-hepsi />
            {t("stHepsiniSec")}
          </label>
          <label className="stok-toplu-gun">
            <span>{t("stTopluSonGun")}</span>
            <TarihGirdisi value="" min={bugun()} onChange={(e) => secili.forEach((p) => yaz(p, { sonTarih: e.target.value }))} disabled={!secili.length} data-stok-toplu-gun />
          </label>
          <button
            type="button"
            className="dugme"
            aria-disabled={!hazir.length}
            title={hazir.length ? undefined : t("stEksik")}
            onClick={gonder}
            data-stok-toplu-gorev
          >
            <Send size={15} /> {t("stGorevlendir", { n: hazir.length })}
          </button>
        </div>
      )}
      <ul className="liste stok-gorev-listesi">
        {paketler.map((p) => {
          const s = al(p);
          const izin = yetkili && stokGorevlendirebilir(ben, p);
          return (
            <li key={p.id} className="stok-gorev-satiri" data-stok-satir={p.id}>
              {izin && <input type="checkbox" checked={s.sec} onChange={(e) => yaz(p, { sec: e.target.checked })} aria-label={t("sec")} data-stok-sec={p.id} />}
              <div className="ad">
                <a href={`#/paketler/${p.id}`}>
                  <Icerik blok>{p.baslik}</Icerik>
                </a>
                <small>
                  <TurRozeti tur={p.tur} /> {p.kod}
                </small>
              </div>
              {izin ? (
                <div className="stok-gorev-alanlari">
                  <MuhabirSecici deger={s.muhabirId} degistir={(id) => yaz(p, { muhabirId: id, sec: true })} />
                  <TarihGirdisi value={s.sonTarih} min={bugun()} onChange={(e) => yaz(p, { sonTarih: e.target.value, sec: true })} aria-label={t("stSonGunAd")} data-stok-son={p.id} />
                </div>
              ) : (
                <small>{p.muhabirId ? ad(kisiBul(v, p.muhabirId)) : t("atanmadi")}</small>
              )}
              {uretimeAlabilir(ben, p) && <UretimeAlDugmesi ben={ben} paket={p} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Görevdeki, üretimdeki, hazır ve yayınlanan paket: şerit ve altında aşamanın bilgisi ve işi. */
function StokSatiri({ ben, paket: p }: { ben: Kisi; paket: Paket }) {
  const { t, dil, ad } = useDil();
  const v = useVeri();
  const bg = bugun();
  const gun = (x: string) => tarihYaz(x, dil, "kisa");
  const yayinIsi = stokYayinIsler(ben, p);
  const oneriler = onerildigiPlanlar(v, p);
  // Önerilebilecek planlar: bugün ve sonrası, açık, henüz bu paketi taşımayan, kişinin düzenleyebildiği.
  const planlar = acikGunPlanlari(v).filter((x) => !x.hazirPaketler.includes(p.id) && planIcerikDuzenler(ben, x)).sort((a, b) => a.tarih.localeCompare(b.tarih));
  return (
    <div className="stok-satir" data-stok-paket={p.id}>
      <PaketSeridi ben={ben} paket={p} />
      <div className="stok-satir-alt">
        {p.sonTarih && !p.yayinlandi && p.durum !== "tamamlandi" && (
          <span className={gorevGecikti(p, bg) ? "kotu-yazi" : ""} data-stok-gecikti={gorevGecikti(p, bg) || undefined}>
            <CalendarClock size={14} /> {t("stSonGun", { gun: gun(p.sonTarih) })}
          </span>
        )}
        {p.durum === "tamamlandi" && !p.yayinlandi && (
          <span>
            <Clock size={14} /> {t("stHazirGun", { n: Math.max(0, hazirYasi(p, bg)) })}
          </span>
        )}
        {bayatMi(p, bg) && (
          <span data-stok-bayat>
            <Rozet ton="uyari">{t("stBayat")}</Rozet>
          </span>
        )}
        {oneriler.map((x) => (
          <span key={x.id} data-stok-onerildi={x.id}>
            <Rozet>{t("stNdOnerildi", { gun: gun(x.tarih) })}</Rozet>
          </span>
        ))}
        {p.masaTakibi && !p.yayinlandi && (
          <span data-stok-masada={p.masaTakibi}>
            <Rozet>{t("stMasada", { masa: birimAdi(p.masaTakibi) })}</Rozet>
          </span>
        )}
        {p.yayinlandi && (
          <span>
            <CheckCircle2 size={14} /> {t("stYayinGunu", { gun: gun(p.yayinlandi.tarih) })}
            {p.yayinlandi.masa && ` · ${birimAdi(p.yayinlandi.masa)}`}
          </span>
        )}
        {yayinIsi && (
          <span className="stok-satir-isler">
            {planlar.length > 0 && (
              <select
                className="girdi"
                value=""
                aria-label={t("stNdOner")}
                onChange={(e) => e.target.value && hazirPaketEkle(ben, e.target.value, p.id) && bildir(t("bKaydedildi"))}
                data-stok-nd-oner={p.id}
              >
                <option value="">{t("stNdOner")}</option>
                {planlar.map((x) => (
                  <option key={x.id} value={x.id}>
                    Next Day · {gun(x.tarih)}
                  </option>
                ))}
              </select>
            )}
            {!p.masaTakibi && (
              <select
                className="girdi"
                value=""
                aria-label={t("stMasayaVer")}
                onChange={(e) => e.target.value && confirm(t("eminMisin")) && stokMasayaVer(ben, p.id, e.target.value) && bildir(t("bKaydedildi"))}
                data-stok-masaya={p.id}
              >
                <option value="">{t("stMasayaVer")}</option>
                {SORU_MASALARI.map((m) => (
                  <option key={m} value={m}>
                    {birimAdi(m)}
                  </option>
                ))}
              </select>
            )}
            <button type="button" className="dugme dugme-kucuk dugme-yumusak" onClick={() => confirm(t("stYayinOnay")) && stokYayinlandi(ben, p.id) && bildir(t("bKaydedildi"))} data-stok-yayinlandi={p.id}>
              <CheckCircle2 size={14} /> {t("stYayinlandiIsaretle")}
            </button>
          </span>
        )}
        {stokYayiniGeriAlabilir(ben, p) && (
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => confirm(t("eminMisin")) && stokYayiniGeriAl(ben, p.id) && bildir(t("bKaydedildi"))} data-stok-yayin-geri={p.id}>
            <Undo2 size={14} /> {t("stYayinGeriAl")}
          </button>
        )}
        {p.muhabirId && p.durum === "onaylandi" && !p.isaret && (
          <span className="sonuk-yazi">
            <UsersRound size={14} /> {ad(kisiBul(v, p.muhabirId))}
          </span>
        )}
      </div>
    </div>
  );
}
