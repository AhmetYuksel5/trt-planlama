import { ArrowLeft, KeyRound, LogIn, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil, type Anahtar } from "../dil";
import { gercekKipKurulu } from "../firebase-ayar";
import { GERCEK, demoyaDon, firebaseYukle, gercegeGec, useGercekDurum } from "../kip";

/**
 * Gerçek girişin sayfası (`#/gercek-giris`, logoya art arda üç tıkla).
 *
 * Adımlar:
 * - giriş: e-posta ve şifre; "Şifremi unuttum" ve "Etkinleştirme bağlantısı
 *   iste" (kurucu ya da süresi geçen davetli için);
 * - bağlantı: davet e-postasındaki bağlantıyla dönülünce e-posta onaylanıp
 *   giriş tamamlanıyor, kişi kaydı davetten kuruluyor;
 * - şifre: ilk girişte kişi şifresini belirliyor; sonraki girişler şifreyle.
 *
 * Davet yoksa ya da hesap kapalıysa nedeni yazılı, oturum kapatılıyor.
 * Firebase'in hata kodu ekranda çıplak görünmüyor; anahtara çevriliyor.
 */

type Adim = "giris" | "baglanti" | "sifre" | "davetYok" | "pasif" | "gonderildi" | "sifirlandi";

const HATALAR: Record<string, Anahtar> = {
  "auth/invalid-credential": "ghBilgiYanlis",
  "auth/wrong-password": "ghBilgiYanlis",
  "auth/user-not-found": "ghBilgiYanlis",
  "auth/invalid-email": "ghEpostaGecersiz",
  "auth/missing-email": "ghEpostaGecersiz",
  "auth/too-many-requests": "ghCokDeneme",
  "auth/network-request-failed": "ghAgYok",
  unavailable: "ghAgYok",
  "auth/invalid-action-code": "ghBaglantiGecersiz",
  "auth/expired-action-code": "ghBaglantiGecersiz",
  "auth/weak-password": "ghSifreZayif",
  "auth/requires-recent-login": "ghYenidenGir",
  "permission-denied": "ghYetkiYok",
};
const hataAnahtari = (e: unknown): Anahtar => HATALAR[e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : ""] ?? "ghBilinmeyen";

/* Firebase'in kendi alt sınırı 6; kurumda daha uzunu isteniyor. */
const SIFRE_EN_AZ = 8;

export default function GercekGiris() {
  const { t, dil } = useDil();
  const gd = useGercekDurum();
  const sorgu = new URLSearchParams(location.search);
  const baglantiyla = sorgu.get("giris") === "baglanti";
  const [adim, setAdim] = useState<Adim>(baglantiyla ? "baglanti" : "giris");
  const [eposta, setEposta] = useState(sorgu.get("e") ?? "");
  const [sifre, setSifre] = useState("");
  const [sifre2, setSifre2] = useState("");
  const [hata, setHata] = useState<Anahtar | null>(null);
  const [bekle, setBekle] = useState(false);
  const kurulu = gercekKipKurulu();

  // Gerçek kipte oturum var ama kişi kaydı yoksa (bağlantıyla gelip şifre adımında kalmış) kayıt tamamlanıyor.
  useEffect(() => {
    if (!GERCEK || !kurulu || baglantiyla) return;
    if (gd.tur === "pasif") setAdim("pasif");
    if (gd.tur !== "giris") return;
    firebaseYukle().then(async (f) => {
      if (!f.oturumdakiEposta()) return;
      setEposta(f.oturumdakiEposta());
      const hal = await f.ilkKayit().catch(() => "davetYok" as const);
      if (hal === "etkin") setAdim("sifre");
      else bitir(hal === "pasif" ? "pasif" : "davetYok");
    });
  }, [gd.tur]);

  const calis = async (f: () => Promise<void>) => {
    setHata(null);
    setBekle(true);
    try {
      await f();
    } catch (e) {
      // Yanlış şifre gibi kullanıcı hataları beklenen durum; yalnız bilinmeyenler günlüğe.
      const k = hataAnahtari(e);
      if (k === "ghBilinmeyen") console.error(e);
      setHata(k);
    } finally {
      setBekle(false);
    }
  };

  /* Giriş olmadı (davet yok, hesap kapalı): oturum açık kalmasın. */
  const bitir = async (a: Adim) => {
    setAdim(a);
    await (await firebaseYukle()).oturumuKapat().catch(() => {});
  };

  const girisYap = (e: FormEvent) => {
    e.preventDefault();
    calis(async () => {
      const f = await firebaseYukle();
      await f.sifreyleGir(eposta, sifre);
      const hal = await f.ilkKayit();
      if (hal === "etkin") gercegeGec();
      else await bitir(hal === "pasif" ? "pasif" : "davetYok");
    });
  };

  const baglantiyiTamamla = (e: FormEvent) => {
    e.preventDefault();
    calis(async () => {
      const f = await firebaseYukle();
      if (!f.baglantiMi()) throw { code: "auth/invalid-action-code" };
      await f.baglantiylaGir(eposta);
      const hal = await f.ilkKayit();
      if (hal === "etkin") setAdim("sifre");
      else await bitir(hal === "pasif" ? "pasif" : "davetYok");
    });
  };

  const sifreKaydet = (e: FormEvent) => {
    e.preventDefault();
    if (sifre.length < SIFRE_EN_AZ) return setHata("ghSifreKisa");
    if (sifre !== sifre2) return setHata("ghSifreUyusmuyor");
    calis(async () => {
      await (await firebaseYukle()).sifreBelirle(sifre);
      gercegeGec();
    });
  };

  const epostaGerekli = () => {
    if (eposta.trim()) return true;
    setHata("ghEpostaGecersiz");
    return false;
  };

  const sifreUnuttum = () =>
    epostaGerekli() &&
    calis(async () => {
      await (await firebaseYukle()).sifreSifirla(eposta, dil);
      setAdim("sifirlandi");
    });

  const baglantiIste = () =>
    epostaGerekli() &&
    calis(async () => {
      await (await firebaseYukle()).baglantiGonder(eposta, dil);
      setAdim("gonderildi");
    });

  const geri = async () => {
    if (!GERCEK) {
      location.hash = "#/";
      return;
    }
    // Yapılandırma boşsa Firebase başlamıyor; yine de demoya dönülsün.
    try {
      await (await firebaseYukle()).oturumuKapat();
    } catch {
      /* oturum zaten yok */
    }
    demoyaDon();
  };

  const epostaAlani = (
    <label>
      {t("eposta")}
      <input type="email" dir="ltr" autoComplete="email" value={eposta} onChange={(e) => setEposta(e.target.value)} required data-gg-eposta />
    </label>
  );

  let govde;
  if (!kurulu) govde = <p className="not-kutu uyari">{t("ggKurulmadi")}</p>;
  else if (GERCEK && gd.tur === "hata") govde = <p className="not-kutu uyari">{t("ggKayitHatasi", { kod: gd.kod })}</p>;
  else if (adim === "baglanti")
    govde = (
      <form className="form" onSubmit={baglantiyiTamamla}>
        {epostaAlani}
        <button className="dugme" disabled={bekle} data-gg-devam>
          <Mail size={16} /> {t("ggBaglantiyiOnayla")}
        </button>
      </form>
    );
  else if (adim === "sifre")
    govde = (
      <form className="form" onSubmit={sifreKaydet}>
        <label>
          {t("ggYeniSifre")}
          <input type="password" autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} required data-gg-sifre />
        </label>
        <label>
          {t("ggSifreTekrar")}
          <input type="password" autoComplete="new-password" value={sifre2} onChange={(e) => setSifre2(e.target.value)} required data-gg-sifre2 />
        </label>
        <button className="dugme" disabled={bekle} data-gg-sifre-kaydet>
          <KeyRound size={16} /> {t("ggSifreKaydet")}
        </button>
      </form>
    );
  else if (adim === "davetYok" || adim === "pasif")
    govde = (
      <p className="not-kutu uyari" data-gg-ret>
        <ShieldAlert size={16} /> {t(adim === "pasif" ? "ggPasif" : "ggDavetYok")}
      </p>
    );
  else if (adim === "gonderildi" || adim === "sifirlandi")
    govde = (
      <p className="not-kutu iyi" data-gg-gonderildi>
        <Mail size={16} /> {t(adim === "gonderildi" ? "ggBaglantiGonderildi" : "ggSifirlamaGonderildi", { eposta })}
      </p>
    );
  else
    govde = (
      <form className="form" onSubmit={girisYap}>
        {epostaAlani}
        <label>
          {t("sifre")}
          <input type="password" autoComplete="current-password" value={sifre} onChange={(e) => setSifre(e.target.value)} required data-gg-sifre />
        </label>
        <button className="dugme" disabled={bekle} data-gg-giris>
          <LogIn size={16} className="yon" /> {t("ggGirisYap")}
        </button>
        <div className="gg-baglantilar">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={sifreUnuttum} disabled={bekle}>
            {t("ggSifremiUnuttum")}
          </button>
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={baglantiIste} disabled={bekle} data-gg-baglanti-iste>
            {t("ggBaglantiIste")}
          </button>
        </div>
      </form>
    );

  return (
    <div className="gercek-giris">
      <main className="gercek-giris-kart">
        <Logo />
        <h1>{t("ggBaslik")}</h1>
        {govde}
        {hata && (
          <p className="not-kutu uyari" role="alert" data-gg-hata={hata}>
            {t(hata)}
          </p>
        )}
        <div className="gg-alt">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={geri}>
            <ArrowLeft size={14} className="yon" /> {t("ggDemoyaDon")}
          </button>
          <DilSecici />
        </div>
      </main>
    </div>
  );
}
