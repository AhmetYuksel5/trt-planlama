import { birimAdi, gorevAdi } from "../yapi";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil } from "../dil";
import { gercekKipKurulu } from "../firebase-ayar";
import { firebaseYukle } from "../kip";
import { BIRIMLER, GOREVLER, type Birim, type Gorev } from "../veri";

/**
 * Kayıt bağlantısının sayfası (`#/kayit/<kod>`): hesap yöneticisinin
 * paylaştığı bağlantıyı açan kişi bilgilerini kendisi giriyor, e-postasına
 * etkinleştirme bağlantısı gidiyor. Bağlantıyla dönünce gerçek giriş
 * (GercekGiris) kişi kaydını bu bilgilerle kuruyor (depo/firebase.ts →
 * ilkKayit) ve şifresini belirletiyor.
 *
 * Demo açıkken de çalışıyor: bağlantıyı açan kişinin tarayıcısı demoda.
 */

type Adim = "yukleniyor" | "form" | "gecersiz" | "gonderildi";

export default function KayitSayfasi({ kod }: { kod: string }) {
  const { t, dil } = useDil();
  const kurulu = gercekKipKurulu();
  const [adim, setAdim] = useState<Adim>("yukleniyor");
  const [f, setF] = useState({ eposta: "", adTr: "", adAr: "", adEn: "", birim: "newsdesk" as Birim, gorev: "editor" as Gorev });
  const [hata, setHata] = useState(false);
  const [bekle, setBekle] = useState(false);
  const alan = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!kurulu) return;
    firebaseYukle()
      .then((x) => x.kayitBaglantisiOku(kod).then((b) => setAdim(b && x.kayitAcik(b) ? "form" : "gecersiz")))
      .catch(() => setAdim("gecersiz"));
  }, [kod]);

  const gonder = (e: FormEvent) => {
    e.preventDefault();
    setHata(false);
    setBekle(true);
    // Ad üç dilde; boş bırakılan dil öbüründen (davet formundaki gibi).
    const tr = f.adTr.trim() || f.adEn.trim() || f.adAr.trim();
    const ad = { tr, ar: f.adAr.trim() || tr, en: f.adEn.trim() || tr };
    firebaseYukle()
      .then((x) => x.kayitBaglantisiGonder(f.eposta, { kod, ad, birim: f.birim, gorev: f.gorev }, dil))
      .then(() => setAdim("gonderildi"))
      .catch((x) => {
        console.error(x);
        setHata(true);
      })
      .finally(() => setBekle(false));
  };

  let govde;
  if (!kurulu) govde = <p className="not-kutu uyari">{t("ggKurulmadi")}</p>;
  else if (adim === "yukleniyor") govde = <p>{t("yukleniyor")}</p>;
  else if (adim === "gecersiz")
    govde = (
      <p className="not-kutu uyari" data-kayit-gecersiz>
        <ShieldAlert size={16} /> {t("kayitBaglantisiGecersiz")}
      </p>
    );
  else if (adim === "gonderildi")
    govde = (
      <p className="not-kutu iyi" data-kayit-gonderildi>
        <Mail size={16} /> {t("ggBaglantiGonderildi", { eposta: f.eposta.trim() })}
      </p>
    );
  else
    govde = (
      <form className="form" onSubmit={gonder} data-kayit-formu>
        <label>
          {t("eposta")}
          <input type="email" dir="ltr" autoComplete="email" value={f.eposta} onChange={(e) => alan("eposta", e.target.value)} required data-kayit-eposta />
        </label>
        {/* Ad her arayüz dilinde Arapça görünüyor, o yüzden zorunlu ve önde. */}
        <label>
          {t("adArapca")}
          <input dir="rtl" lang="ar" value={f.adAr} onChange={(e) => alan("adAr", e.target.value)} required data-kayit-ad-ar />
        </label>
        <label>
          {t("adTurkce")}
          <input autoComplete="name" value={f.adTr} onChange={(e) => alan("adTr", e.target.value)} data-kayit-ad />
        </label>
        <label>
          {t("adIngilizce")}
          <input dir="ltr" value={f.adEn} onChange={(e) => alan("adEn", e.target.value)} />
        </label>
        <label>
          {t("birim")}
          <select value={f.birim} onChange={(e) => alan("birim", e.target.value as Birim)} data-kayit-birim>
            {BIRIMLER.map((b) => (
              <option key={b} value={b}>
                {birimAdi(b)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gorev")}
          <select value={f.gorev} onChange={(e) => alan("gorev", e.target.value as Gorev)} data-kayit-gorev>
            {GOREVLER.map((g) => (
              <option key={g} value={g}>
                {gorevAdi(g)}
              </option>
            ))}
          </select>
        </label>
        <button className="dugme" disabled={bekle} data-kayit-gonder>
          <Mail size={16} /> {t("kayitOl")}
        </button>
      </form>
    );

  return (
    <div className="gercek-giris">
      <main className="gercek-giris-kart">
        <Logo />
        <h1>{t("kayitBaslik")}</h1>
        {govde}
        {hata && (
          <p className="not-kutu uyari" role="alert">
            {t("ghBilinmeyen")}
          </p>
        )}
        <div className="gg-alt">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => (location.hash = "#/")}>
            <ArrowLeft size={14} className="yon" /> {t("ggDemoyaDon")}
          </button>
          <DilSecici />
        </div>
      </main>
    </div>
  );
}
