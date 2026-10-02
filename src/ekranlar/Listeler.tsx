import { Clapperboard, Layers, MonitorPlay, Package, Search, SpellCheck, TrendingUp, Wallet, Workflow } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ADIM_ADI, URETIM_ADIMLARI, adimSahibi, geciktiMi } from "../akis";
import { AsamaCubugu, Avatar, Bos, Icerik, Kart, Kilitli, NotKutu, Rozet, TaslakEtiketi, TurRozeti } from "../bilesenler/Parcalar";
import { PaketTablosu } from "../bilesenler/Tablolar";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, PAKET_DURUM_ADI, TUR_ADI, sehirAdi } from "../etiketler";
import { ICERIK_TURLERI, PAKET_DURUMLARI, kisiBul, useVeri, type IcerikTuru, type Kisi, type Paket, type PaketDurum } from "../veri";
import { paketGorebilir, ucretGorebilir } from "../yetki";
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

export function Paketler({ ben, sayfa }: { ben: Kisi; sayfa: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ayar = ICERIK_SAYFASI[sayfa] ?? ICERIK_SAYFASI.paketler;
  const [durum, setDurum] = useState<PaketDurum | "hepsi" | "aktif">("aktif");
  const [tur, setTur] = useState<IcerikTuru | "">("");
  const [aranan, setAranan] = useState("");
  const muhabir = ben.birim === "muhabir";
  const gorunen = v.paketler.filter((p) => paketGorebilir(ben, p, v) && (!ayar.turler || ayar.turler.includes(p.tur)));
  const q = aranan.trim().toLocaleLowerCase();
  const liste = gorunen
    .filter(
      (p) =>
        (durum === "hepsi" || (durum === "aktif" ? p.durum !== "tamamlandi" && p.durum !== "iptal" : p.durum === durum)) &&
        (!tur || p.tur === tur) &&
        (!q || `${p.kod} ${p.baslik} ${ad(kisiBul(v, p.muhabirId))}`.toLocaleLowerCase().includes(q)),
    )
    .sort((a, b) => b.guncelleme.localeCompare(a.guncelleme));
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(muhabir && sayfa === "paketler" ? "mPaketlerim" : ayar.baslik)} alt={t(ayar.alt)} />
      {sayfa === "programlar" && <NotKutu>{t("programTaslakNotu")}</NotKutu>}
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

const PANO: Record<string, { baslik: Anahtar; alt: Anahtar; ikon: ReactNode; adimlar: readonly string[] }> = {
  uretim: { baslik: "mUretim", alt: "uretimAlt", ikon: <Workflow size={26} />, adimlar: URETIM_ADIMLARI },
  metinkontrol: { baslik: "mMetinKontrol", alt: "metinKontrolAlt", ikon: <SpellCheck size={26} />, adimlar: ["metin", "kontrol", "dil"] },
  video: { baslik: "mVideo", alt: "videoAlt", ikon: <MonitorPlay size={26} />, adimlar: ["video", "iletim", "media", "inews"] },
};

export function IsAkisi({ sayfa }: { sayfa: string }) {
  const { t, ad } = useDil();
  const v = useVeri();
  const ayar = PANO[sayfa] ?? PANO.uretim;
  const uretimde = v.paketler.filter((p) => p.durum === "uretimde");
  return (
    <>
      <SayfaBasi ikon={ayar.ikon} baslik={t(ayar.baslik)} alt={t(ayar.alt)} />
      <div className="pano">
        {ayar.adimlar.map((a) => {
          const paketler = uretimde.filter((p) => p.adim === a);
          const adim = a as (typeof URETIM_ADIMLARI)[number];
          return (
            <section key={a} className="pano-sutun">
              <header>
                <b>{t(ADIM_ADI[adim])}</b>
                <Rozet>{paketler.length}</Rozet>
                <small>{t(BIRIM_ADI[adimSahibi(adim, "haber")])}</small>
              </header>
              {paketler.length === 0 && <p className="bos-kucuk">{t("bos")}</p>}
              {paketler.map((p) => (
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
                    {geciktiMi(p) && <Rozet ton="kotu">{t("gecikti")}</Rozet>}
                    <AsamaCubugu paket={p} />
                  </span>
                </a>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

/* --- Hazır paket arşivi --- */

export function HazirPaketler() {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  return (
    <>
      <SayfaBasi ikon={<Layers size={26} />} baslik={t("mHazirPaketler")} alt={t("hazirAlt")} />
      <Kart>
        <div className="tablo-sar">
          <table className="tablo kartli">
            <thead>
              <tr>
                <th>{t("sehirUlke")}</th>
                <th className="icerik-sutun">{t("paketBasligi")}</th>
                <th>{t("muhabir")}</th>
                <th>{t("tur")}</th>
                <th>{t("sure")}</th>
                <th>{t("slug")}</th>
                <th>{t("hazirlanma")}</th>
              </tr>
            </thead>
            <tbody>
              {v.hazirPaketler.map((h) => (
                <tr key={h.id}>
                  <td className="kalin" data-etiket={t("sehirUlke")}>
                    {t(sehirAdi(h.sehir))}
                  </td>
                  <td className="birincil icerik-sutun">
                    <b>
                      <Icerik blok>{h.baslik}</Icerik>
                    </b>
                    <small className="sonuk">
                      <Icerik blok>{h.aciklama}</Icerik>
                    </small>
                  </td>
                  <td data-etiket={t("muhabir")}>{ad(kisiBul(v, h.muhabirId))}</td>
                  <td data-etiket={t("tur")}>
                    <TurRozeti tur={h.tur} />
                  </td>
                  <td data-etiket={t("sure")}>{h.sure}</td>
                  <td className="sonuk" data-etiket={t("slug")}>
                    <bdi>{h.slug}</bdi>
                  </td>
                  <td className="sonuk" data-etiket={t("hazirlanma")}>
                    {tarihYaz(h.hazirlanma, dil, "kisa")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <SayfaBasi ikon={<Wallet size={26} />} baslik={t("mUcretler")} alt={t("ucretAlt")} sagUc={<TaslakEtiketi metin={t("ornekEkran")} />} />
      <NotKutu>{t("ucretYetkiNotu")}</NotKutu>
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
