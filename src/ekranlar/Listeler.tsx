import { birimAdi, guncelYapi, type DurakTuru } from "../yapi";
import { PAKET_SONUCLARI, paketSonucu, type PaketSonucu } from "../paketSonucu";
import { CirclePlay, Clapperboard, Layers, MonitorPlay, Package, Search, SpellCheck, TrendingUp, Wallet, Workflow } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ADIM_ADI, STOK_DURUMLARI, adimAdi, adimTuru, durakSahibi, geciktiMi, sorumluBirimi, stokDurumu, type StokDurumu } from "../akis";
import { AsamaCubugu, Avatar, Bos, HaftalikRozeti, Icerik, Kart, Kilitli, Rozet, Sayac, TaslakEtiketi, TurRozeti, bildir } from "../bilesenler/Parcalar";
import { PaketTablosu } from "../bilesenler/Tablolar";
import { useDil, yaz, type Anahtar } from "../dil";
import { PAKET_DURUM_ADI, STOK_DURUM_ADI, TUR_ADI } from "../etiketler";
import { uretimeAl } from "../eylemler";
import { ICERIK_TURLERI, PAKET_DURUMLARI, kisiBul, useVeri, type IcerikTuru, type Kisi, type Paket, type PaketDurum } from "../veri";
import { paketGorebilir, ucretGorebilir, uretimeAlabilir } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/*
 * Liste ekranları. Hepsi aynı ortak kayıtların (paket önerileri) farklı
 * görünümü: haber paketleri, feature/ekonomi, program içerikleri, iş akışı
 * panoları ve ücretler. Kayıt bir kez giriliyor, her birim kendi
 * süzgeciyle görüyor.
 */

const ICERIK_SAYFASI: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; turler?: IcerikTuru[] }> = {
  paketler: { baslik: "mPaketler", alt: "paketlerAlt", ikon: <Package size={26} /> },
  feature: { baslik: "mFeature", alt: "featureAlt", ikon: <TrendingUp size={26} />, turler: ["feature", "ekonomi"] },
  programlar: { baslik: "mProgramlar", alt: "programlarAlt", ikon: <Clapperboard size={26} />, turler: ["program"] },
};

const SONUC_ADI: Record<PaketSonucu, Anahtar> = { onayBekliyor: "psOnayBekleyen", yapildi: "psYapilan", yapilmadi: "psYapilmayan", reddedildi: "psReddedilen" };

export function Paketler({ ben, sayfa }: { ben: Kisi; sayfa: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ayar = ICERIK_SAYFASI[sayfa] ?? ICERIK_SAYFASI.paketler;
  const [durum, setDurum] = useState<PaketDurum | "hepsi" | "aktif" | PaketSonucu>("aktif");
  const [tur, setTur] = useState<IcerikTuru | "">("");
  const [aranan, setAranan] = useState("");
  const muhabir = ben.birim === "muhabir";
  const gorunen = v.paketler.filter((p) => paketGorebilir(ben, p, v) && (!ayar.turler || ayar.turler.includes(p.tur)));
  const q = aranan.trim().toLocaleLowerCase();
  const liste = gorunen
    .filter(
      (p) =>
        (durum === "hepsi" ||
          (durum === "aktif" ? p.durum !== "tamamlandi" && p.durum !== "iptal" : (PAKET_SONUCLARI as readonly string[]).includes(durum) ? paketSonucu(p) === durum : p.durum === durum)) &&
        (!tur || p.tur === tur) &&
        (!q || `${p.kod} ${p.baslik} ${ad(kisiBul(v, p.muhabirId))}`.toLocaleLowerCase().includes(q)),
    )
    .sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(muhabir && sayfa === "paketler" ? "mPaketlerim" : ayar.baslik)} />
      <Kart>
        <div className="suzgec">
          <label className="arama arama-kutu">
            <Search size={16} />
            <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("paketAra")} aria-label={t("paketAra")} />
          </label>
          {!ayar.turler && (
            <select className="girdi" value={tur} onChange={(e) => setTur(e.target.value as IcerikTuru | "")} aria-label={t("tur")}>
              <option value="">{t("tumTurler")}</option>
              {ICERIK_TURLERI.map((x) => (
                <option key={x} value={x}>
                  {t(TUR_ADI[x])}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="sekmeler suzgec">
          <button className={durum === "aktif" ? "acik" : ""} onClick={() => setDurum("aktif")}>
            {t("aktif")} <em>{gorunen.filter((p) => p.durum !== "tamamlandi" && p.durum !== "iptal").length}</em>
          </button>
          {/* Paketin sonucu: muhabirin, Planlama'nın ve haber merkezinin ortak listeleri (onay bekleyen, yapılan, yapılmayan, reddedilen). */}
          {PAKET_SONUCLARI.map((x) => (
            <button key={x} className={durum === x ? "acik" : ""} onClick={() => setDurum(x)} data-paket-sonucu={x}>
              {t(SONUC_ADI[x])} <em>{gorunen.filter((p) => paketSonucu(p) === x).length}</em>
            </button>
          ))}
          {PAKET_DURUMLARI.map((d) => (
            <button key={d} className={durum === d ? "acik" : ""} onClick={() => setDurum(d)}>
              {t(PAKET_DURUM_ADI[d])} <em>{gorunen.filter((p) => p.durum === d).length}</em>
            </button>
          ))}
          <button className={durum === "hepsi" ? "acik" : ""} onClick={() => setDurum("hepsi")}>
            {t("hepsi")} <em>{gorunen.length}</em>
          </button>
        </div>
        <PaketTablosu paketler={liste} d={v} sutunlar={["kod", "baslik", "muhabir", "tur", "plan", "asama", "kimde", "teslim"]} />
      </Kart>
    </>
  );
}

/* --- İş akışları: üretim adımlarına göre pano --- */

/* Sayfanın gösterdiği durak türleri; boşsa hepsi (yöneticinin eklediği genel duraklar da). */
const PANO: Record<string, { baslik: Anahtar; ikon: ReactNode; turler?: readonly DurakTuru[] }> = {
  uretim: { baslik: "mUretim", ikon: <Workflow size={26} /> },
  metinkontrol: { baslik: "mMetinKontrol", ikon: <SpellCheck size={26} />, turler: ["metin", "kontrol", "dil"] },
  video: { baslik: "mVideo", ikon: <MonitorPlay size={26} />, turler: ["video", "iletim", "media", "inews"] },
};

/*
 * Sütunlar yayındaki akışın durakları. Eski sürümün akışıyla süren paketin
 * durağı bugünkü akışta yoksa kendi sütununda, sonda: yarım iş görünmez
 * olmasın.
 */
export function IsAkisi({ sayfa }: { sayfa: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ayar = PANO[sayfa] ?? PANO.uretim;
  const uretimde = v.paketler.filter((p) => p.durum === "uretimde" && (!ayar.turler || ayar.turler.includes(adimTuru(p) ?? "is")));
  const y = guncelYapi(v);
  const duraklar = y.akislar.flatMap((a) => a.duraklar).filter((d, i, l) => l.findIndex((x) => x.id === d.id) === i && (!ayar.turler || ayar.turler.includes(d.tur)));
  const sutunlar = [
    ...duraklar.map((d) => ({ id: d.id, ad: d.ad ? yaz(d.ad) : d.tur === "is" ? d.id : t(ADIM_ADI[d.tur]), sahip: sorumluBirimi(d.sorumlu, "haber", y) })),
    ...[...new Set(uretimde.map((p) => p.adim ?? ""))]
      .filter((a) => a && !duraklar.some((d) => d.id === a))
      .map((a) => {
        const p = uretimde.find((x) => x.adim === a)!;
        return { id: a, ad: adimAdi(a, p), sahip: durakSahibi(p, a) };
      }),
  ];
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(ayar.baslik)} />
      <div className="pano">
        {sutunlar.map((s) => {
          const paketler = uretimde.filter((p) => p.adim === s.id);
          return (
            <section key={s.id} className="pano-sutun" data-pano-sutun={s.id}>
              <header>
                <b>{s.ad}</b>
                <Rozet>{paketler.length}</Rozet>
                <small>{birimAdi(s.sahip)}</small>
              </header>
              {paketler.length === 0 && <p className="bos-kucuk">{t("bos")}</p>}
              {paketler.map((p) => {
                const sahip = durakSahibi(p, s.id);
                return (
                  <a key={p.id} className={`pano-kart ${geciktiMi(p) ? "gecikmis" : ""}`} href={`#/paketler/${p.id}`}>
                    <b>
                      <Icerik blok>{p.baslik}</Icerik>
                    </b>
                    <span className="kisi-hucre">
                      <Avatar kisi={kisiBul(v, p.muhabirId)} boy="kucuk" />
                      <small>{p.muhabirId ? ad(kisiBul(v, p.muhabirId)) : t("atanmadi")}</small>
                    </span>
                    <span className="pano-alt">
                      <TurRozeti tur={p.tur} />
                      {/* Sütunun sahibi haber koluna göre; stok paketinde adım başka birimdeyse kartta yazıyor. */}
                      {sahip !== s.sahip && <Rozet ton="vurgu">{birimAdi(sahip)}</Rozet>}
                      {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
                      <AsamaCubugu paket={p} />
                    </span>
                  </a>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}

/* --- Stok haberler: feature, ekonomi ve günü olmayan haberin üretimi, stoğu ve yayını --- */

type StokSekme = "uretimde" | "stokta" | "yayinlandi";
const STOK_SEKMELERI: StokSekme[] = ["uretimde", "stokta", "yayinlandi"];

/**
 * Hazır paketlerin yeni yeri. Haftalık toplantıda kabul edilen plansız
 * paket feature/stok ekibince üretime alınıyor, bitince stokta bekliyor;
 * bir Next Day planına seçilip plan Newsdesk'e devredilince yayınlanan
 * arşivine geçiyor. Durum kayıttan çıkıyor (akis.ts → stokDurumu).
 */
export function StokHaberler({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const [sekme, setSekme] = useState<StokSekme>("stokta");
  const durumda = (s: StokDurumu) => v.paketler.filter((p) => stokDurumu(p) === s);
  const bekleyen = durumda("bekliyor");
  const listeler: Record<StokSekme, Paket[]> = {
    uretimde: [...bekleyen, ...durumda("uretimde")],
    stokta: durumda("stokta").sort((a, b) => b.guncelleme.localeCompare(a.guncelleme)),
    yayinlandi: durumda("yayinlandi").sort((a, b) => (b.yayinlandi?.tarih ?? "").localeCompare(a.yayinlandi?.tarih ?? "")),
  };
  const SEKME_ADI: Record<StokSekme, Anahtar> = { uretimde: "sdUretimde", stokta: "sdStokta", yayinlandi: "sdYayinlanan" };
  return (
    <>
      <SayfaBasi ikon={<Layers size={26} />} baslik={t("mStok")} />
      <div className="sayaclar">
        {STOK_DURUMLARI.map((s) => (
          <Sayac key={s} ikon={<Layers size={22} />} ton={s === "bekliyor" && bekleyen.length ? "uyari" : ""} renk="renk-haftalik" etiket={t(STOK_DURUM_ADI[s])} deger={durumda(s).length} />
        ))}
      </div>
      {bekleyen.length > 0 && (
        <Kart baslik={t("uretimeAlinacaklar")} ikon={<CirclePlay size={18} />} ek={String(bekleyen.length)}>
          <ul className="liste">
            {bekleyen.map((p) => (
              <li key={p.id}>
                <div className="ad">
                  <a href={`#/paketler/${p.id}`}>
                    <Icerik blok>{p.baslik}</Icerik>
                  </a>
                  <small>
                    {p.kod} · {p.muhabirId ? ad(kisiBul(v, p.muhabirId)) : t("atanmadi")}
                  </small>
                </div>
                {p.haftalikKalemId && <HaftalikRozeti />}
                <TurRozeti tur={p.tur} />
                {uretimeAlabilir(ben, p) && (
                  <button className="dugme dugme-kucuk" onClick={() => uretimeAl(ben, p.id) && bildir(t("bUretimeAlindi"))} data-uretime-al={p.id}>
                    <CirclePlay size={14} /> {t("uretimeAl")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Kart>
      )}
      <Kart>
        <div className="sekmeler" role="tablist" aria-label={t("mStok")}>
          {STOK_SEKMELERI.map((s) => (
            <button key={s} role="tab" aria-selected={sekme === s} className={sekme === s ? "acik" : ""} onClick={() => setSekme(s)}>
              {t(SEKME_ADI[s])} <em>{listeler[s].length}</em>
            </button>
          ))}
        </div>
        <div className="ara-ust-2">
          <PaketTablosu
            paketler={listeler[sekme]}
            d={v}
            bosMetin={t(sekme === "stokta" ? "stokBos" : "kayitYok")}
            sutunlar={sekme === "uretimde" ? ["kod", "baslik", "muhabir", "tur", "asama", "kimde", "teslim"] : ["kod", "baslik", "muhabir", "tur", "sure", "stok"]}
          />
        </div>
      </Kart>
    </>
  );
}

/* --- Ücretler: Newsdesk'in örnek ekranı; alan bazlı yetkinin gösterimi --- */

export function Ucretler({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ucretli = v.paketler.filter((p) => p.ucret);
  const gorebilir = ucretli.some((p) => ucretGorebilir(ben, p));
  const toplam = (durum: string) =>
    ucretli.filter((p) => p.ucret?.durum === durum && ucretGorebilir(ben, p)).reduce((s, p) => s + (p.ucret?.tutar ?? 0), 0);
  return (
    <>
      <SayfaBasi ikon={<Wallet size={26} />} baslik={t("mUcretler")} sagUc={<TaslakEtiketi metin={t("ornekEkran")} />} />
      {gorebilir && (
        <div className="sayaclar">
          {(["bekliyor", "onaylandi", "odendi"] as const).map((d) => (
            <div key={d} className="sayac">
              <div>
                <span>{t(`uc_${d}`)}</span>
                <b>{toplam(d)} USD</b>
              </div>
            </div>
          ))}
        </div>
      )}
      <Kart>
        {ucretli.length === 0 ? (
          <Bos metin={t("kayitYok")} />
        ) : (
          <div className="tablo-sar">
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("muhabir")}</th>
                  <th className="icerik-sutun">{t("paketBasligi")}</th>
                  <th>{t("durum")}</th>
                  <th>{t("ucret")}</th>
                </tr>
              </thead>
              <tbody>
                {ucretli.map((p: Paket) => (
                  <tr key={p.id}>
                    <td data-etiket={t("muhabir")}>
                      <span className="kisi-hucre">
                        <Avatar kisi={kisiBul(v, p.muhabirId)} boy="kucuk" /> {ad(kisiBul(v, p.muhabirId))}
                      </span>
                    </td>
                    <td className="birincil icerik-sutun">
                      <a className="kalin" href={`#/paketler/${p.id}`}>
                        <Icerik blok>{p.baslik}</Icerik>
                      </a>
                    </td>
                    <td data-etiket={t("durum")}>
                      <Rozet>{t(PAKET_DURUM_ADI[p.durum])}</Rozet>
                    </td>
                    <td data-etiket={t("ucret")}>
                      {ucretGorebilir(ben, p) ? (
                        <b>
                          {p.ucret!.tutar} {p.ucret!.para} · {t(`uc_${p.ucret!.durum}`)}
                        </b>
                      ) : (
                        <Kilitli metin={t("maliAlanKilitli")} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kart>
    </>
  );
}
