import { ArrowLeft, KeyRound, LogIn, ShieldAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil, type Anahtar } from "../dil";
import { gercekKipKurulu } from "../firebase-ayar";
import { kodGecerliBicim, koduDuzenle, kodYaz } from "../girisKodu";
import { firebaseYukle, gercegeGec, tanitimiAc } from "../kip";
import { SIFRE_EN_AZ, hataAnahtari, hataKodu } from "./GercekGiris";

/**
 * Giriş koduyla ilk giriş (`#/kod`, `#/kod/<kod>`; girisKodu.ts). Kişi
 * yöneticinin verdiği kodu girer; kod hesabın ilk şifresi, oturum açılınca
 * kişi kaydı davetten kurulur (depo/firebase.ts → ilkKayit), kişi kendi
 * şifresini belirler, kodun okuma belgesi silinir. Sonraki girişler
 * kullanıcı adı ve şifreyle (GercekGiris). Kayıt bağlantısı gibi demo
 * açıkken de çalışıyor.
 */

type Adim = "kod" | "sifre";

export default function KodlaGiris({ kod: ilkKod }: { kod: string }) {
  const { t } = useDil();
  const kurulu = gercekKipKurulu();
  const [kod, setKod] = useState(kodYaz(koduDuzenle(ilkKod)));
  const [adim, setAdim] = useState<Adim>("kod");
  const [kullanici, setKullanici] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [hata, setHata] = useState<{ anahtar: Anahtar; kod: string } | null>(null);
  const [bekle, setBekle] = useState(false);

  const calis = async (f: () => Promise<void>) => {
    setHata(null);
    setBekle(true);
    try {
      await f();
    } catch (e) {
      const anahtar = hataAnahtari(e);
      if (anahtar === "ghBilinmeyen") console.error(e);
      setHata({ anahtar, kod: hataKodu(e) });
    } finally {
      setBekle(false);
    }
  };

  const koduGir = (e: FormEvent) => {
    e.preventDefault();
    const k = koduDuzenle(kod);
    if (!kodGecerliBicim(k)) return setHata({ anahtar: "kodGecersiz", kod: "" });
    calis(async () => {
      const f = await firebaseYukle();
      const belge = await f.koduOku(k).catch(() => null);
      if (!belge || Date.now() > belge.bitis) throw { code: "kod/gecersiz" };
      await f.kodlaGir(k, belge);
      const hal = await f.ilkKayit();
      if (hal !== "etkin") {
        await f.oturumuKapat().catch(() => {});
        throw { code: hal === "pasif" ? "kayit/pasif" : "kod/gecersiz" };
      }
      setKullanici(belge.kullanici);
      setAdim("sifre");
    });
  };

  const sifreKaydet = (e: FormEvent) => {
    e.preventDefault();
    if (sifre.length < SIFRE_EN_AZ) return setHata({ anahtar: "ghSifreKisa", kod: "" });
    if (sifre !== sifre2) return setHata({ anahtar: "ghSifreUyusmuyor", kod: "" });
    calis(async () => {
      const f = await firebaseYukle();
      await f.sifreBelirle(sifre);
      // Şifre değişti, kod artık girmiyor; okuma belgesi de kalmasın. Silinemese de kod işe yaramaz.
      await f.koduKapat(koduDuzenle(kod)).catch(() => {});
      gercegeGec();
    });
  };

  let govde;
  if (!kurulu) govde = <p className="not-kutu uyari">{t("ggKurulmadi")}</p>;
  else if (adim === "sifre")
    govde = (
      <form className="form" onSubmit={sifreKaydet} data-kod-sifre-formu>
        <p className="kod-kullanici">
          {t("kullaniciAdi")}: <b dir="ltr" data-kod-kullanici>{kullanici}</b>
        </p>
        <label>
          {t("ggYeniSifre")}
          <input type="password" autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} required data-kod-sifre />
        </label>
        <label>
          {t("ggSifreTekrar")}
          <input type="password" autoComplete="new-password" value={sifre2} onChange={(e) => setSifre2(e.target.value)} required data-kod-sifre2 />
        </label>
        {/* Tarayıcının parola yöneticisi kullanıcı adını şifreyle birlikte saklasın. */}
        <input type="text" autoComplete="username" value={kullanici} readOnly hidden />
        <button className="dugme" disabled={bekle} data-kod-sifre-kaydet>
          <KeyRound size={16} /> {t("ggSifreKaydet")}
        </button>
      </form>
    );
  else
    govde = (
      <form className="form" onSubmit={koduGir} data-kod-formu>
        <label>
          {t("girisKodu")}
          <input
            className="kod-girdi"
            dir="ltr"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            required
            data-kod-girdi
          />
        </label>
        <button className="dugme" disabled={bekle} data-kod-devam>
          <LogIn size={16} className="yon" /> {t("kodlaDevam")}
        </button>
      </form>
    );

  return (
    <div className="gercek-giris">
      <main className="gercek-giris-kart">
        <Logo />
        <h1>{t("kodlaGirisBaslik")}</h1>
        {govde}
        {hata && (
          <p className="not-kutu uyari" role="alert" data-kod-hata={hata.anahtar}>
            <ShieldAlert size={16} /> {hata.anahtar === "ghBilinmeyen" && hata.kod ? t("ghBilinmeyenKod", { kod: hata.kod }) : t(hata.anahtar)}
          </p>
        )}
        <div className="gg-alt">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={tanitimiAc}>
            <ArrowLeft size={14} className="yon" /> {t("ggAnaSayfa")}
          </button>
          <DilSecici />
        </div>
      </main>
    </div>
  );
}
