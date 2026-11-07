import { Loader2, Mail, Plug } from "lucide-react";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil } from "../dil";
import { GERCEK } from "../kip";
import { postaAyariGetir, postaAyariKaydet, postaDene, type PostaAyarGorunum } from "../posta-kapi";

/*
 * Ayarlar › E-posta kutusu (yalnız tam yönetici, gerçek kip). Exchange'in EWS
 * ucuna NTLM ile bağlanıp planlama kutusundaki postaları çeken kapının ayarı
 * (worker/src/ews.ts). Parola kapının KV'sinde duruyor, tarayıcıya hiç
 * gelmiyor; burada yalnız "kayıtlı mı" görünüyor (belgeler/eposta-entegrasyonu.md).
 */
export function PostaAyari() {
  const { t } = useDil();
  const [ayar, setAyar] = useState<PostaAyarGorunum | null>(null);
  const [hata, setHata] = useState("");
  const [parola, setParola] = useState("");
  const [deneniyor, setDeneniyor] = useState(false);

  useEffect(() => {
    if (!GERCEK) return;
    void postaAyariGetir().then((r) => (r.tamam ? setAyar(r.veri) : setHata(`${t("postaKapiYok")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GERCEK) {
    return (
      <Kart baslik={t("postaAyariBaslik")} ikon={<Mail size={18} />}>
        <p className="sonuk-yazi">{t("yzDemoda")}</p>
      </Kart>
    );
  }
  if (!ayar) {
    return (
      <Kart baslik={t("postaAyariBaslik")} ikon={<Mail size={18} />}>
        {hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );
  }

  const alan = (k: keyof PostaAyarGorunum, v: string | boolean) => setAyar({ ...ayar, [k]: v });
  const kaydet = async () => {
    const r = await postaAyariKaydet({ acik: ayar.acik, sunucu: ayar.sunucu, kullanici: ayar.kullanici, alan: ayar.alan, grupAdresi: ayar.grupAdresi, ...(parola ? { parola } : {}) });
    if (!r.tamam) return bildir(`${t("postaKapiYok")} [${r.hata}]${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
    setAyar(r.veri);
    setParola("");
    bildir(t("bKaydedildi"));
  };
  const dene = async () => {
    setDeneniyor(true);
    const r = await postaDene();
    setDeneniyor(false);
    bildir(r.tamam ? t("bPostaDeneTamam", { n: String(r.veri.sayi) }) : `${t("bPostaDeneHata")}${r.ayrinti ? ` (${r.ayrinti})` : ""}`);
  };

  return (
    <Kart baslik={t("postaAyariBaslik")} ikon={<Mail size={18} />}>
      <div className="form">
        <label className="secim">
          <input type="checkbox" checked={ayar.acik} onChange={(e) => alan("acik", e.target.checked)} />
          {t("postaAcikAyar")}
        </label>
        <div className="satir">
          <label>
            {t("postaSunucu")}
            <input dir="ltr" value={ayar.sunucu} onChange={(e) => alan("sunucu", e.target.value)} placeholder="posta.trt.net.tr" />
          </label>
          <label>
            {t("postaAlan")}
            <input dir="ltr" value={ayar.alan} onChange={(e) => alan("alan", e.target.value)} placeholder="TRT" />
          </label>
        </div>
        <div className="satir">
          <label>
            {t("postaKullanici")}
            <input dir="ltr" value={ayar.kullanici} onChange={(e) => alan("kullanici", e.target.value)} autoComplete="off" />
          </label>
          <label>
            {t("postaParola")}
            <input type="password" dir="ltr" value={parola} onChange={(e) => setParola(e.target.value)} placeholder={ayar.parolaVar ? t("postaParolaKayitli") : ""} autoComplete="new-password" />
          </label>
        </div>
        <label>
          {t("postaGrupAdresi")}
          <input type="email" dir="ltr" value={ayar.grupAdresi} onChange={(e) => alan("grupAdresi", e.target.value)} placeholder="planning@trtarabi.com" />
        </label>
        <div className="form-alt">
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
