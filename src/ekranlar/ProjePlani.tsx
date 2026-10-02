import { ArrowRight, Check, Circle, LogIn, X } from "lucide-react";
import { NEXTDAY_KUTULARI } from "../akis";
import DilSecici from "../bilesenler/DilSecici";
import { Avatar, Rozet } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { BIRIM_ADI } from "../etiketler";
import { girisYap, useBen } from "../oturum";
import { BIRIMLER, kisiBul, useVeri, type Birim } from "../veri";
import { yetkiMatrisi } from "../yetki";

/**
 * Proje planı sayfası: girişsiz açılıyor, yöneticilere bağlantıyla
 * gösterilebiliyor.
 *
 * İçerik üç belgeden: notlardaki beş aşama ve birimler, kapsamlı rapor
 * (akışlar, birim pencereleri, ortak kayıt, yetki, mimari, sonraki
 * çalışmalar) ve ilk taslak promptu (ilk teslimatın kapsamı). Next Day
 * şeması ve yetki matrisi koddaki tablolardan çiziliyor; belge ile
 * uygulama ayrışmasın diye elle yazılmıyor.
 */

const ASAMA_ORNEGI: [Anahtar, Anahtar][] = [
  ["ppA1", "ppA1a"],
  ["ppA2", "ppA2a"],
  ["ppA3", "ppA3a"],
  ["ppA4", "ppA4a"],
  ["ppA5", "ppA5a"],
];

const BIRIM_PENCERESI: [Birim, Anahtar, Anahtar][] = [
  ["planlama", "ppBpPlanlama", "ppBpPlanlamaE"],
  ["newsdesk", "ppBpNewsdesk", "ppBpNewsdeskE"],
  ["newsgathering", "ppBpNg", "ppBpNgE"],
  ["program", "ppBpProgram", "ppBpProgramE"],
  ["output", "ppBpOutput", "ppBpOutputE"],
  ["media", "ppBpMedia", "ppBpMediaE"],
  ["muhabir", "ppBpMuhabir", "ppBpMuhabirE"],
  ["yonetim", "ppBpYonetim", "ppBpYonetimE"],
];

const ZINCIR: Anahtar[] = ["zc1", "zc2", "zc3", "zc4", "zc5", "zc6", "zc7", "zc8", "zc9", "zc10", "zc11", "zc12", "zc13"];

const YAPILDI: Anahtar[] = ["ppY1", "ppY2", "ppY3", "ppY4", "ppY5", "ppY6", "ppY7", "ppY8"];
const YOK: Anahtar[] = ["ppN1", "ppN2", "ppN3", "ppN4", "ppN5", "ppN6", "ppN7", "ppN8", "ppN9", "ppN10", "ppN11", "ppN12"];
const SORULAR: Anahtar[] = ["ppS1", "ppS2", "ppS3", "ppS4", "ppS5", "ppS6", "ppS7"];
const YOL: [Anahtar, Anahtar][] = [
  ["ppR1", "ppR1a"],
  ["ppR2", "ppR2a"],
  ["ppR3", "ppR3a"],
  ["ppR4", "ppR4a"],
  ["ppR5", "ppR5a"],
  ["ppR6", "ppR6a"],
  ["ppR7", "ppR7a"],
];

/* "Bu kişiyle dene": [kişi, ne yapacak, nereye] — Gazze akışı uçtan uca. */
const DENE: [string, Anahtar, string][] = [
  ["pl2", "dn1", "oneriler/cagri"],
  ["mu1", "dn2", "oneriler/yeni"],
  ["pl2", "dn3", "nextday/nd-yarin"],
  ["pl1", "dn4", "nextday/nd-yarin"],
  ["pl2", "dn5", "nextday/nd-yarin/cikti"],
  ["nd1", "dn6", "nextday/nd-yarin"],
  ["ng1", "dn7", "ana"],
  ["me2", "dn8", "paketler/p-gazze"],
  ["nd3", "dn9", "paketler/p-gazze"],
  ["mu1", "dn10", "ana"],
  ["ou5", "dn11", "ana"],
  ["nd2", "dn12", "ucretler"],
  ["yo1", "dn13", "ana"],
];

export default function ProjePlani() {
  const { t, ad } = useDil();
  const v = useVeri();
  const ben = useBen();
  const matris = yetkiMatrisi();
  const dene = (kisiId: string, hedef: string) => {
    girisYap(kisiId);
    location.hash = `#/${hedef}`;
  };

  return (
    <div className="belge-sayfa">
      <header className="belge-ust">
        <span className="marka">
          <b>TRT</b>
          <span>{t("markaArapca")}</span>
        </span>
        <span className="bosluk" />
        <DilSecici />
        <a className="dugme" href="#/" aria-label={t(ben ? "prototipeDon" : "prototipeGir")}>
          <LogIn size={16} className="yon" /> <span className="mobilde-gizli">{t(ben ? "prototipeDon" : "prototipeGir")}</span>
        </a>
      </header>

      <main className="belge">
        <section className="belge-kapak">
          <span className="rozet rozet-koyu kendi-hizasi">{t("mProjePlani")}</span>
          <h1>{t("ppBaslik")}</h1>
          <p>{t("ppOzet")}</p>
          <p className="vurgu-satir">{t("ppTemelModel")}</p>
        </section>

        <section>
          <h2>
            <span className="no">1</span>
            {t("ppNasil")}
          </h2>
          <p>{t("ppNasilA")}</p>
          <div className="akis-kutulari">
            {ASAMA_ORNEGI.map(([b, a], i) => (
              <div key={b} className="akis-kutusu">
                <span className="no">{i + 1}</span>
                <b>{t(b)}</b>
                <p>{t(a)}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>
            <span className="no">2</span>
            {t("ppNextday")}
          </h2>
          <p>{t("ppNextdayA")}</p>
          <div className="akis-kutulari">
            {NEXTDAY_KUTULARI.map((k) => (
              <div key={k.no} className={`akis-kutusu ${k.no <= 3 ? "renk-nextday" : k.no <= 7 ? "renk-haftalik" : "renk-yurtdisi"}`}>
                <span className="no">{k.no}</span>
                <b>{t(k.baslik)}</b>
                <p>{t(k.aciklama)}</p>
                <div className="cipler">
                  <Rozet>{t(k.vakit)}</Rozet>
                  {k.birimler.map((b) => (
                    <Rozet key={b} ton="vurgu">
                      {t(BIRIM_ADI[b])}
                    </Rozet>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="ara-ust-2">{t("ppKritikAyrim")}</p>
        </section>

        <section>
          <h2>
            <span className="no">3</span>
            {t("ppHaftalik")}
          </h2>
          <p>{t("ppHaftalikA")}</p>
          <div className="kollar">
            <div className="kol renk-nextday">
              <b>{t("kolHaber")}</b>
              <p>{t("kolHaberA")}</p>
            </div>
            <div className="kol renk-haftalik">
              <b>{t("kolFeature")}</b>
              <p>{t("kolFeatureA")}</p>
            </div>
            <div className="kol renk-yurtdisi">
              <b>{t("kolProgram")}</b>
              <p>{t("kolProgramA")}</p>
            </div>
          </div>
          <p className="ara-ust-2">{t("ppBag")}</p>
        </section>

        <section>
          <h2>
            <span className="no">4</span>
            {t("ppBirimler")}
          </h2>
          <p>{t("ppBirimlerA")}</p>
          <div className="kart">
            <div className="tablo-sar">
              <table className="tablo kartli">
                <thead>
                  <tr>
                    <th>{t("birim")}</th>
                    <th>{t("ppGorevi")}</th>
                    <th>{t("ppAnaSayfasinda")}</th>
                  </tr>
                </thead>
                <tbody>
                  {BIRIM_PENCERESI.map(([b, g, e]) => (
                    <tr key={b}>
                      <td className="kalin birincil">{t(BIRIM_ADI[b])}</td>
                      <td data-etiket={t("ppGorevi")}>{t(g)}</td>
                      <td className="sonuk" data-etiket={t("ppAnaSayfasinda")}>
                        {t(e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2>
            <span className="no">5</span>
            {t("ppOrtakKayit")}
          </h2>
          <p>{t("ppOrtakKayitA")}</p>
          <div className="zincir">
            {ZINCIR.map((z, i) => (
              <span key={z} className="zincir-oge">
                {i > 0 && <ArrowRight size={14} className="yon" />}
                <span>{t(z)}</span>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2>
            <span className="no">6</span>
            {t("ppYetki")}
          </h2>
          <p>{t("ppYetkiA")}</p>
          <div className="kart">
            <div className="tablo-sar">
              {/* Yetki matrisi bir ızgara; telefonda karta dönmüyor, yatay kayıyor. */}
              <table className="tablo matris">
                <thead>
                  <tr>
                    <th>{t("ppIslem")}</th>
                    {BIRIMLER.map((b) => (
                      <th key={b}>{t(BIRIM_ADI[b])}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matris.map((s) => (
                    <tr key={s.ad}>
                      <td>{t(s.ad)}</td>
                      {BIRIMLER.map((b) => (
                        <td key={b}>
                          {s.birimler.includes(b) ? (
                            s.yonetici.includes(b) ? (
                              <span className="yonetici" title={t("yalnizYonetici")}>
                                ◆
                              </span>
                            ) : (
                              <Check size={15} className="evet" aria-label={t("evet")} />
                            )
                          ) : (
                            <span className="sonuk">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bos-kucuk">
              <span className="yonetici">◆</span> {t("yalnizYonetici")} · {t("ppGorunurluk")}
            </p>
          </div>
        </section>

        <section>
          <h2>
            <span className="no">7</span>
            {t("ppMimari")}
          </h2>
          <div className="kollar">
            <div className="kol renk-nextday">
              <b>{t("ppKatmanVeri")}</b>
              <p>{t("ppKatmanVeriA")}</p>
            </div>
            <div className="kol renk-haftalik">
              <b>{t("ppKatmanAkis")}</b>
              <p>{t("ppKatmanAkisA")}</p>
            </div>
            <div className="kol renk-yurtdisi">
              <b>{t("ppKatmanArayuz")}</b>
              <p>{t("ppKatmanArayuzA")}</p>
            </div>
          </div>
          <p className="ara-ust-2">{t("ppMimariA")}</p>
        </section>

        <section>
          <h2>
            <span className="no">8</span>
            {t("ppPrototip")}
          </h2>
          <div className="iz iz-2">
            <div className="kart">
              <h3 className="kucuk-baslik">{t("ppYapildi")}</h3>
              <ul className="liste">
                {YAPILDI.map((k) => (
                  <li key={k}>
                    <Check size={16} className="iyi-yazi" />
                    <div className="ad">{t(k)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="kart">
              <h3 className="kucuk-baslik">{t("ppHenuzYok")}</h3>
              <ul className="liste">
                {YOK.map((k) => (
                  <li key={k}>
                    <X size={16} className="sonuk-yazi" />
                    <div className="ad">{t(k)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>
            <span className="no">9</span>
            {t("ppDene")}
          </h2>
          <p>{t("ppDeneA")}</p>
          <ol className="dene-adimlari">
            {DENE.map(([id, adim, hedef], i) => {
              const k = kisiBul(v, id);
              return (
                <li key={i}>
                  <span>{i + 1}</span>
                  <Avatar kisi={k} boy="kucuk" />
                  <p>
                    {t(adim)}
                    <small>
                      {ad(k)} · {k ? t(BIRIM_ADI[k.birim]) : ""}
                    </small>
                  </p>
                  <button className="dugme dugme-ikincil dugme-kucuk" onClick={() => dene(id, hedef)}>
                    {t("buKisiyleDene")} <ArrowRight size={14} className="yon" />
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2>
            <span className="no">10</span>
            {t("ppSorular")}
          </h2>
          <p>{t("ppSorularA")}</p>
          <ul className="yol-haritasi">
            {SORULAR.map((s) => (
              <li key={s}>
                <div>{t(s)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>
            <span className="no">11</span>
            {t("ppYolHaritasi")}
          </h2>
          <ol className="yol-haritasi">
            {YOL.map(([b, a], i) => (
              <li key={b} className={i === 0 ? "simdi" : ""}>
                <div>
                  <b>{t(b)}</b>
                  <p>{t(a)}</p>
                </div>
                {i === 0 && (
                  <Rozet ton="vurgu">
                    <Circle size={8} /> {t("simdiBurada")}
                  </Rozet>
                )}
              </li>
            ))}
          </ol>
          <p className="ara-ust-2">{t("ppIlke")}</p>
        </section>
      </main>
    </div>
  );
}
