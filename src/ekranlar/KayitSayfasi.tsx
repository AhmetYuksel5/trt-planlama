import { birimAdi, birimListesi, gorevAdi, unvanListesi } from "../yapi";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil, type Anahtar } from "../dil";
import { gercekKipKurulu } from "../firebase-ayar";
import { firebaseYukle } from "../kip";
import { SIFRE_EN_AZ, hataAnahtari, hataKodu } from "./GercekGiris";
import type { BirimId, GorevId } from "../veri";

/**
 * Kayıt bağlantısının sayfası (`#/kayit/<kod>`): hesap yöneticisinin
 * paylaştığı bağlantıyı açan kişi bilgilerini ve şifresini kendisi giriyor;
 * hesabı açılıp adresine doğrulama e-postası gidiyor. Doğrulayıp şifresiyle
 * girince gerçek giriş (GercekGiris) kişi kaydını bu bilgilerle kuruyor
 * (depo/firebase.ts → ilkKayit). Giriş bağlantısı (e-posta linki)
 * kullanılmıyor: Firebase'in ücretsiz planı günde yalnız 5 gönderiyor.
 *
 * Demo açıkken de çalışıyor: bağlantıyı açan kişinin tarayıcısı demoda.
 */

type Adim = "yukleniyor" | "form" | "gecersiz" | "gonderildi";

export default function KayitSayfasi({ kod }: { kod: string }) {
  const { t, dil } = useDil();
  const kurulu = gercekKipKurulu();
  const [adim, setAdim] = useState<Adim>("yukleniyor");
  const [f, setF] = useState({ eposta: "", adTr: "", adAr: "", adEn: "", birim: "newsdesk" as BirimId, gorev: "editor" as GorevId, sifre: "", sifre2: "" });
  // Hata ya tanınan anahtar ya da (tanınmayan) Firebase kodu.
  const [hata, setHata] = useState<{ anahtar: Anahtar; kod: string } | null>(null);
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
    setHata(null);
    if (f.sifre.length < SIFRE_EN_AZ) return setHata({ anahtar: "ghSifreKisa", kod: "" });
    if (f.sifre !== f.sifre2) return setHata({ anahtar: "ghSifreUyusmuyor", kod: "" });
    setBekle(true);
    // Ad üç dilde; boş bırakılan dil öbüründen (davet formundaki gibi).
    const tr = f.adTr.trim() || f.adEn.trim() || f.adAr.trim();
    const ad = { tr, ar: f.adAr.trim() || tr, en: f.adEn.trim() || tr };
    firebaseYukle()
      .then((x) => x.kayitOl(f.eposta, f.sifre, { kod, ad, birim: f.birim, gorev: f.gorev }, dil))
      .then(() => setAdim("gonderildi"))
      .catch((x) => {
        // Kayıtlı e-posta, zayıf şifre gibi durumlar beklenen; yalnız bilinmeyen hata günlüğe.
        const anahtar = hataAnahtari(x);
        if (anahtar === "ghBilinmeyen") console.error(x);
        setHata({ anahtar, kod: hataKodu(x) });
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
        <Mail size={16} /> {t("kayitDogrulamaGitti", { eposta: f.eposta.trim() })}
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
          <select value={f.birim} onChange={(e) => alan("birim", e.target.value)} data-kayit-birim>
            {birimListesi().map((b) => (
              <option key={b} value={b}>
                {birimAdi(b)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gorev")}
          <select value={f.gorev} onChange={(e) => alan("gorev", e.target.value)} data-kayit-gorev>
            {unvanListesi(f.birim, f.gorev).map((g) => (
              <option key={g} value={g}>
                {gorevAdi(g)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("sifre")}
          <input type="password" autoComplete="new-password" value={f.sifre} onChange={(e) => alan("sifre", e.target.value)} required data-kayit-sifre />
        </label>
        <label>
          {t("ggSifreTekrar")}
          <input type="password" autoComplete="new-password" value={f.sifre2} onChange={(e) => alan("sifre2", e.target.value)} required data-kayit-sifre2 />
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
          <p className="not-kutu uyari" role="alert" data-kayit-hata={hata.anahtar}>
            {hata.anahtar === "ghBilinmeyen" && hata.kod ? t("ghBilinmeyenKod", { kod: hata.kod }) : t(hata.anahtar)}
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
