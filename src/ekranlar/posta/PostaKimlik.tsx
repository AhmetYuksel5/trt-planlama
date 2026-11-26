import { Loader2, Plug, UserCog } from "lucide-react";
import { kapiHatasi } from "../../yz";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../../bilesenler/Parcalar";
import { useDil } from "../../dil";
import { postaKimlikGetir, postaKimlikKaydet, postaDene, type PostaKimlikGorunum } from "../../posta-kapi";

/*
 * Posta kimliği kişiye özel: herkes kendi kurumsal kullanıcı adı/parolasını ve
 * kendi biriminin grup adresini girer (planlamacı planlama grubunu, Newsdesk
 * kendi grubunu). Parola kapının KV'sinde uid'ye bağlı, tarayıcıya hiç gelmiyor.
 * Kart Ayarlar'da; dileyen girer, zorlama ve hatırlatma yok.
 */
export function PostaKimlikKart() {
  const { t } = useDil();
  const [kimlik, setKimlik] = useState<PostaKimlikGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [parola, setParola] = useState("");
  const [deneniyor, setDeneniyor] = useState(false);

  useEffect(() => {
    void postaKimlikGetir().then((r) => (r.tamam ? setKimlik(r.veri) : setHata(kapiHatasi(r))));
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
  const deneSonucu = (r: Awaited<ReturnType<typeof postaDene>>) =>
    r.tamam ? t("bPostaDeneTamam", { n: String(r.veri.sayi) }) : r.hata === "kimlikReddedildi" ? t("postaParolaReddedildi") : `${t("bPostaDeneHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`;
  const kaydet = async () => {
    const yeni = parola;
    const r = await postaKimlikKaydet({ kullanici: kimlik.kullanici, grupAdresi: kimlik.grupAdresi, ...(yeni ? { parola: yeni } : {}) });
    if (!r.tamam) return bildir(kapiHatasi(r, `${t("postaKapiYok")} [${r.hata}]`));
    setKimlik(r.veri);
    setParola("");
    if (!yeni) return bildir(t("bKaydedildi"));
    // Yeni şifre hemen sınanır: kabul edilmediyse kişi kaydederken öğrensin, kapı da sonradan eskisiyle denemesin.
    setDeneniyor(true);
    const d = await postaDene();
    setDeneniyor(false);
    bildir(`${t("bKaydedildi")} · ${deneSonucu(d)}`);
    const g = await postaKimlikGetir();
    if (g.tamam) setKimlik(g.veri);
  };
  // Yazılmış ama kaydedilmemiş şifre ve kullanıcı adı denenir: önce kayıtlı eski şifre deneniyordu.
  const dene = async () => {
    setDeneniyor(true);
    const r = await postaDene({ kullanici: kimlik.kullanici, ...(parola ? { parola } : {}) });
    setDeneniyor(false);
    bildir(deneSonucu(r));
    if (!parola) {
      const g = await postaKimlikGetir();
      if (g.tamam) setKimlik(g.veri);
    }
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
        {kimlik.parolaReddedildi && !parola && (
          <p className="uyari-yazi" data-posta-parola-reddi>
            {t("postaParolaReddedildi")}
          </p>
        )}
        <label>
          {t("postaGrupAdresi")}
          <input type="email" dir="ltr" value={kimlik.grupAdresi} onChange={(e) => alan("grupAdresi", e.target.value)} placeholder="planning@trtarabi.com" />
        </label>
        <div className="form-alt">
          <button className="dugme dugme-ikincil" onClick={dene} disabled={deneniyor}>
            {deneniyor ? <Loader2 size={16} className="donen" /> : <Plug size={16} />} {t("postaBaglantiDene")}
          </button>
          <button className="dugme" onClick={kaydet} disabled={deneniyor}>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
