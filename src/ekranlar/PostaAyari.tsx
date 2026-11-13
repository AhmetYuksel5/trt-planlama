import { Loader2, Mail } from "lucide-react";
import { kapiHatasi } from "../yz";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil } from "../dil";
import { GERCEK } from "../kip";
import { postaAyariGetir, postaAyariKaydet, type PostaAyarGorunum } from "../posta-kapi";

/*
 * Ayarlar › E-posta kutusu (yalnız tam yönetici, gerçek kip). Yalnız ORTAK
 * ayar: Exchange sunucusu, alan (domain), açık/kapalı. Kullanıcı adı, parola
 * ve grup adresi kişiye özel; onları herkes Posta sayfasında kendi girer
 * (belgeler/eposta-entegrasyonu.md).
 */
export function PostaAyari() {
  const { t } = useDil();
  const [ayar, setAyar] = useState<PostaAyarGorunum | null>(null);
  const [hata, setHata] = useState("");

  useEffect(() => {
    if (!GERCEK) return;
    void postaAyariGetir().then((r) => (r.tamam ? setAyar(r.veri) : setHata(kapiHatasi(r))));
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
    const r = await postaAyariKaydet({ acik: ayar.acik, sunucu: ayar.sunucu, alan: ayar.alan });
    if (!r.tamam) return bildir(kapiHatasi(r, `${t("postaKapiYok")} [${r.hata}]`));
    setAyar(r.veri);
    bildir(t("bKaydedildi"));
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
        <p className="sonuk-yazi">{t("postaKimlikKisiye")}</p>
        <div className="form-alt">
          <button className="dugme" onClick={kaydet}>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Kart>
  );
}
