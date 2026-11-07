import { Loader2, Plug, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { kimlikDurumYaz } from "../../posta-kimlik-durum";
import { postaKimlikGetir, postaKimlikKaydet, postaDene, type PostaKimlikGorunum } from "../../posta-kapi";

/*
 * Posta kimliği kişiye özel: herkes kendi kurumsal kullanıcı adı/parolasını ve
 * kendi biriminin grup adresini girer (planlamacı planlama grubunu, Newsdesk
 * kendi grubunu). Parola kapının KV'sinde uid'ye bağlı, tarayıcıya hiç gelmiyor.
 * İlk girişte bu kart çıkar; "Sonra yap" denince zilde hatırlatma kalır.
 */
export function PostaKimlikKart({ onKaydedildi, onSonra }: { onKaydedildi: () => void; onSonra: () => void }) {
  const { t } = useDil();
  const [kimlik, setKimlik] = useState<PostaKimlikGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [parola, setParola] = useState("");
  const [deneniyor, setDeneniyor] = useState(false);

  useEffect(() => {
    void postaKimlikGetir().then((r) => (r.tamam ? setKimlik(r.veri) : setHata(`${t("postaKapiYok")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!kimlik) {
    return (
      <Kart baslik={t("postaKimlikBaslik")} ikon={<UserCog size={18} />}>
        {hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );
  }

  const alan = (k: "kullanici" | "grupAdresi", v: string) => setKimlik({ ...kimlik, [k]: v });
  const kaydet = async () => {
    const r = await postaKimlikKaydet({ kullanici: kimlik.kullanici, grupAdresi: kimlik.grupAdresi, ...(parola ? { parola } : {}) });
    if (!r.tamam) return bildir(`${t("postaKapiYok")} [${r.hata}]${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    setKimlik(r.veri);
    setParola("");
    if (r.veri.parolaVar) {
      kimlikDurumYaz("var");
      bildir(t("bKaydedildi"));
      onKaydedildi();
    } else {
      bildir(t("bKaydedildi"));
    }
  };
  const dene = async () => {
    setDeneniyor(true);
    const r = await postaDene();
    setDeneniyor(false);
    bildir(r.tamam ? t("bPostaDeneTamam", { n: String(r.veri.sayi) }) : `${t("bPostaDeneHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
  };
  const sonra = () => {
    kimlikDurumYaz("sonra");
    onSonra();
  };

  return (
    <Kart baslik={t("postaKimlikBaslik")} ikon={<UserCog size={18} />}>
      <div className="form">
        <div className="satir">
          <label>
            {t("postaKullanici")}
            <input dir="ltr" value={kimlik.kullanici} onChange={(e) => alan("kullanici", e.target.value)} autoComplete="off" placeholder="mehmetsafa.bicer" />
          </label>
          <label>
            {t("postaParola")}
            <input type="password" dir="ltr" value={parola} onChange={(e) => setParola(e.target.value)} placeholder={kimlik.parolaVar ? t("postaParolaKayitli") : ""} autoComplete="new-password" />
          </label>
        </div>
        <label>
          {t("postaGrupAdresi")}
          <input type="email" dir="ltr" value={kimlik.grupAdresi} onChange={(e) => alan("grupAdresi", e.target.value)} placeholder="planning@trtarabi.com" />
        </label>
        <div className="form-alt">
          <button className="dugme dugme-sade" onClick={sonra}>
            {t("postaSonraYap")}
          </button>
          <button className="dugme dugme-ikincil" onClick={dene} disabled={deneniyor}>
            {deneniyor ? <Loader2 size={16} className="donen" /> : <Plug size={16} />} {t("postaBaglantiDene")}
          </button>
          <button className="dugme" onClick={kaydet}>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
