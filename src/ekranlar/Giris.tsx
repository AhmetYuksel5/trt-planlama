import { BookOpen, CheckCircle, Search } from "lucide-react";
import { useState } from "react";
import DilSecici from "../bilesenler/DilSecici";
import { Avatar, Rozet } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { BIRIM_ADI, GOREV_ADI, sehirAdi } from "../etiketler";
import { girisYap } from "../oturum";
import { BIRIMLER, useVeri, type Birim, type Kisi } from "../veri";

/**
 * Demo giriş.
 *
 * Kurum içi kimlik doğrulama henüz seçilmedi; şimdilik kişi seçiliyor,
 * şifre yok. Önerilen kişiler her birimden bir örnek: akışı uçtan uca
 * denemek için kişi değiştirmek yetiyor (proje planı sayfasındaki "bu
 * kişiyle dene" adımları da bunlara bağlanıyor).
 */

export const DEMO_KISILERI = ["pl1", "pl2", "mu1", "nd1", "nd2", "ng1", "pr1", "ou5", "ou2", "me2", "yo1"];

const OZELLIKLER: Anahtar[] = ["girisOz1", "girisOz2", "girisOz3", "girisOz4"];

export default function Giris() {
  const { t, y } = useDil();
  const v = useVeri();
  const [birim, setBirim] = useState<Birim | "hepsi">("hepsi");
  const [aranan, setAranan] = useState("");
  const q = aranan.trim().toLocaleLowerCase();

  const onerilen = DEMO_KISILERI.map((id) => v.kisiler.find((k) => k.id === id)).filter((k): k is Kisi => !!k);
  const liste = v.kisiler.filter(
    (k) =>
      (birim === "hepsi" || k.birim === birim) &&
      (!q || (typeof k.ad === "string" ? k.ad : `${k.ad.tr} ${k.ad.ar}`).toLocaleLowerCase().includes(q)),
  );

  const kart = (k: Kisi, onerilenMi = false) => (
    <button key={k.id} className={`kisi-kart ${onerilenMi ? "onerilen" : ""}`} onClick={() => girisYap(k.id)}>
      <Avatar kisi={k} durum />
      <div>
        <b>{y(k.ad)}</b>
        <small>
          {t(GOREV_ADI[k.gorev])} · {t(sehirAdi(k.sehir))}
        </small>
        <Rozet ton={k.rol === "yonetici" ? "koyu" : ""}>{t(BIRIM_ADI[k.birim])}</Rozet>
      </div>
    </button>
  );

  return (
    <div className="giris">
      <aside className="giris-sol">
        <span className="marka">
          <b>TRT</b>
          <span>{t("markaArapca")}</span>
        </span>
        <h1>{t("girisBaslik")}</h1>
        <p>{t("girisAciklama")}</p>
        <DilSecici />
        <ul className="ozellikler">
          {OZELLIKLER.map((k) => (
            <li key={k}>
              <CheckCircle size={16} />
              {t(k)}
            </li>
          ))}
        </ul>
        <a className="dugme dugme-ikincil kendi-hizasi" href="#/plan">
          <BookOpen size={16} /> {t("mProjePlani")}
        </a>
        <p className="alt">{t("girisDemoNotu")}</p>
      </aside>
      <main className="giris-sag">
        <div>
          <h2>{t("girisKimsin")}</h2>
          <p className="sonuk-yazi">
            {t("girisKimsinAciklama")}
          </p>
        </div>
        <section>
          <h3 className="kucuk-baslik">{t("girisOnerilen")}</h3>
          <div className="demo-kisiler">{onerilen.map((k) => kart(k, true))}</div>
        </section>
        <section>
          <h3 className="kucuk-baslik">
            {t("girisTumu")} <span>({v.kisiler.length})</span>
          </h3>
          <div className="suzgec">
            <label className="arama arama-kutu">
              <Search size={16} />
              <input type="search" value={aranan} onChange={(e) => setAranan(e.target.value)} placeholder={t("kisiAra")} aria-label={t("kisiAra")} />
            </label>
            <div className="sekmeler">
              <button className={birim === "hepsi" ? "acik" : ""} onClick={() => setBirim("hepsi")}>
                {t("hepsi")}
              </button>
              {BIRIMLER.map((b) => (
                <button key={b} className={birim === b ? "acik" : ""} onClick={() => setBirim(b)}>
                  {t(BIRIM_ADI[b])}
                  <em>{v.kisiler.filter((k) => k.birim === b).length}</em>
                </button>
              ))}
            </div>
          </div>
          <div className="demo-kisiler">{liste.map((k) => kart(k))}</div>
        </section>
      </main>
    </div>
  );
}
