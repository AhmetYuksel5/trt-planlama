import { ArrowLeft, KeyRound, LogIn, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import DilSecici from "../bilesenler/DilSecici";
import Logo from "../bilesenler/Logo";
import { useDil, type Anahtar } from "../dil";
import { gercekKipKurulu } from "../firebase-ayar";
import { GERCEK, firebaseYukle, gercegeGec, tanitimaDon, tanitimiAc, useGercekDurum } from "../kip";

/**
 * Gerçek girişin sayfası (`#/gercek-giris`, tanıtımdaki "Giriş").
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
 * Tanınmayan kod ise "beklenmeyen hata"nın yanında yazılıyor: gerçek
 * Firebase emülatörde çıkmayan kodlar döndürebiliyor, kişi kodu iletince
 * neden bulunsun.
 */

type Adim = "giris" | "baglanti" | "sifre" | "davetYok" | "pasif" | "gonderildi" | "sifirlandi" | "dogrula" | "dogrulamaGitti";

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
  "auth/email-already-in-use": "ghEpostaKayitli",
  // Kayıt formu: hesap önceden açılmış; başvuru kaydedildi, kişi şifresiyle girince kaydı kurulur.
  "kayit/hesap-var": "kayitHesapVar",
  "kayit/sifre-gitti": "kayitSifreGitti",
  "kayit/pasif": "ggPasif",
  // Ücretsiz planda günde gönderilebilen giriş bağlantısı sınırlı; ertesi gün açılıyor.
  "auth/quota-exceeded": "ghGunlukSinir",
  // Projede şifre kuralı açıksa (büyük harf, rakam…) Firebase bunu döndürüyor.
  "auth/password-does-not-meet-requirements": "ghSifreKurali",
  "auth/user-disabled": "ghHesapKapali",
  // Konsolda e-posta bağlantısı ya da e-posta/şifre girişi kapalı.
  "auth/operation-not-allowed": "ghYontemKapali",
  "auth/admin-restricted-operation": "ghYontemKapali",
  "auth/unauthorized-domain": "ghAdresIzinsiz",
  "auth/unauthorized-continue-uri": "ghAdresIzinsiz",
  "auth/invalid-continue-uri": "ghAdresIzinsiz",
  "auth/argument-error": "ghBaglantiGecersiz",
  "auth/missing-action-code": "ghBaglantiGecersiz",
  "deadline-exceeded": "ghAgYok",
  "auth/requires-recent-login": "ghYenidenGir",
  "permission-denied": "ghYetkiYok",
};
export const hataKodu = (e: unknown): string =>
  e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.name : "";
export const hataAnahtari = (e: unknown): Anahtar => HATALAR[hataKodu(e)] ?? "ghBilinmeyen";

/* Firebase'in kendi alt sınırı 6; kurumda daha uzunu isteniyor. */
export const SIFRE_EN_AZ = 8;

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
  const [hataKod, setHataKod] = useState("");
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
      else if (hal === "dogrulanmadi") setAdim("dogrula");
      else bitir(hal === "pasif" ? "pasif" : "davetYok");
    });
  }, [gd.tur]);

  // Demodan "Giriş"e basan kişinin oturumu bu tarayıcıda açıksa (demoyu denemeye geçmiş) şifre sorulmuyor.
  useEffect(() => {
    if (GERCEK || !kurulu || sorgu.get("giris")) return;
    firebaseYukle().then(async (f) => {
      if (!(await f.sakliOturum().catch(() => ""))) return;
      const hal = await f.ilkKayit().catch(() => "davetYok" as const);
      if (hal === "etkin") gercegeGec();
      else if (hal === "dogrulanmadi") {
        setEposta(f.oturumdakiEposta());
        setAdim("dogrula");
      } else await f.oturumuKapat().catch(() => {});
    });
  }, []);

  const calis = async (f: () => Promise<void>) => {
    setHata(null);
    setBekle(true);
    try {
      await f();
    } catch (e) {
      // Yanlış şifre gibi kullanıcı hataları beklenen durum; yalnız bilinmeyenler günlüğe.
      const k = hataAnahtari(e);
      setHataKod(hataKodu(e));
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
      // Kayıt bağlantısıyla gelen, e-postasını henüz doğrulamamış: oturum açık kalıyor, yeniden gönderebilsin.
      else if (hal === "dogrulanmadi") setAdim("dogrula");
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

  const dogrulamaIste = () =>
    calis(async () => {
      const f = await firebaseYukle();
      await f.dogrulamaGonder(dil);
      await bitir("dogrulamaGitti");
    });

  const baglantiIste = () =>
    epostaGerekli() &&
    calis(async () => {
      await (await firebaseYukle()).baglantiGonder(eposta, dil);
      setAdim("gonderildi");
    });

  const geri = async () => {
    if (!GERCEK) return tanitimiAc();
    // Yapılandırma boşsa Firebase başlamıyor; yine de tanıtıma dönülsün.
    try {
      await (await firebaseYukle()).oturumuKapat();
    } catch {
      /* oturum zaten yok */
    }
    tanitimaDon();
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
  else if (adim === "dogrula")
    govde = (
      <div className="form" data-gg-dogrula>
        <p className="not-kutu uyari">
          <Mail size={16} /> {t("ggDogrulaBekliyor", { eposta })}
        </p>
        <button type="button" className="dugme dugme-ikincil" onClick={dogrulamaIste} disabled={bekle} data-gg-dogrulama-iste>
          {t("ggDogrulamaIste")}
        </button>
      </div>
    );
  else if (adim === "dogrulamaGitti")
    govde = (
      <p className="not-kutu iyi" data-gg-gonderildi>
        <Mail size={16} /> {t("kayitDogrulamaGitti", { eposta })}
      </p>
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
            {hata === "ghBilinmeyen" && hataKod ? t("ghBilinmeyenKod", { kod: hataKod }) : t(hata)}
          </p>
        )}
        <div className="gg-alt">
          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={geri}>
            <ArrowLeft size={14} className="yon" /> {t("ggAnaSayfa")}
          </button>
          <DilSecici />
        </div>
      </main>
    </div>
  );
}
