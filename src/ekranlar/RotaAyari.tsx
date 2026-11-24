import { Loader2, Sheet } from "lucide-react";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import { GERCEK } from "../kip";
import { rotaAyariGetir, rotaAyariKaydet, rotaGetir, type RotaAyarGorunum } from "../posta-kapi";
import { bugun, gunEkle } from "../tarih";
import { kapiHatasi } from "../yz";

/*
 * Ayarlar › Rota tablosu (yalnız tam yönetici, gerçek kip): haber merkezinin Google
 * tablosundan Next Day ekibi (worker/src/rota.ts). Tablo herkese açılmıyor; Google
 * Cloud'daki yalnız okuma yetkili hizmet hesabıyla paylaşılıyor, hesabın JSON
 * anahtarı burada bir kez yapıştırılıyor. Anahtar kapıda şifreli durur, ekrana
 * yalnız hesabın adresi gelir.
 */
const HATA: Record<string, Anahtar> = { paylasim: "rotaHataPaylasim", sekme: "rotaHataSekme", gun: "rotaHataGun", hesap: "rotaHataHesap", tablo: "rotaHataTablo", anahtar: "rotaHataHesap" };

export function RotaAyari() {
  const { t } = useDil();
  const [ayar, setAyar] = useState<RotaAyarGorunum | null>(null);
  const [tablo, setTablo] = useState("");
  const [hesap, setHesap] = useState("");
  const [hata, setHata] = useState("");
  const [deneme, setDeneme] = useState("");
  const [mesgul, setMesgul] = useState(false);

  useEffect(() => {
    if (!GERCEK) return;
    void rotaAyariGetir().then((r) => {
      if (!r.tamam) return setHata(kapiHatasi(r));
      setAyar(r.veri);
      setTablo(r.veri.tabloId ? `https://docs.google.com/spreadsheets/d/${r.veri.tabloId}` : "");
    });
  }, []);

  const hataMetni = (h: string, ayrinti?: string) => (HATA[h] ? t(HATA[h]) : `${t("rotaHata")} [${h}${ayrinti ? ` ${ayrinti}` : ""}]`);

  if (!GERCEK || !ayar)
    return (
      <Kart baslik={t("rotaBaslik")} ikon={<Sheet size={18} />}>
        {!GERCEK ? <p className="sonuk-yazi">{t("yzDemoda")}</p> : hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );

  const kaydet = async (g: { tablo?: string; hesap?: string | null }) => {
    setMesgul(true);
    const r = await rotaAyariKaydet(g);
    setMesgul(false);
    if (!r.tamam) return bildir(hataMetni(r.hata));
    setAyar(r.veri);
    setHesap("");
    bildir(t("bKaydedildi"));
  };
  const dene = async () => {
    setMesgul(true);
    setDeneme("");
    const r = await rotaGetir(gunEkle(bugun(), 1), true);
    setMesgul(false);
    setDeneme(r.tamam ? t("rotaDenendi", { sekme: r.veri.sekme, n: r.veri.satirlar.length }) : hataMetni(r.hata, r.ayrinti));
  };

  return (
    <Kart baslik={t("rotaBaslik")} ikon={<Sheet size={18} />}>
      <div className="form" data-rota-ayari>
        <label>
          {t("rotaTablo")}
          <input dir="ltr" value={tablo} onChange={(e) => setTablo(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" data-rota-tablo />
        </label>
        <label>
          {t("rotaHesap")}
          {ayar.anahtarVar && <small className="sonuk">{t("rotaHesapVar", { eposta: ayar.istemciEposta })}</small>}
          <textarea dir="ltr" rows={4} className="kod-alani" value={hesap} onChange={(e) => setHesap(e.target.value)} placeholder='{ "type": "service_account", … }' autoComplete="off" spellCheck={false} data-rota-hesap />
        </label>
        <div className="dugmeler">
          <button className="dugme" disabled={mesgul} onClick={() => void kaydet({ tablo, ...(hesap.trim() ? { hesap } : {}) })} data-rota-kaydet>
            {t("kaydet")}
          </button>
          {ayar.anahtarVar && ayar.tabloId && (
            <button className="dugme dugme-ikincil" disabled={mesgul} onClick={() => void dene()} data-rota-dene>
              {t("rotaDene")}
            </button>
          )}
          {ayar.anahtarVar && (
            <button className="dugme dugme-sade" disabled={mesgul} onClick={() => void kaydet({ hesap: null })}>
              {t("rotaHesapSil")}
            </button>
          )}
        </div>
        {deneme && <p className="sonuk-yazi" data-rota-sonuc>{deneme}</p>}
      </div>
    </Kart>
  );
}
