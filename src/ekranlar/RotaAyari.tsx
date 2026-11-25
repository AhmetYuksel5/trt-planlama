import { Loader2, Sheet } from "lucide-react";
import { useEffect, useState } from "react";
import { Kart, bildir } from "../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import { GERCEK } from "../kip";
import { rotaAyariGetir, rotaAyariKaydet, rotaGetir, type RotaAyarGorunum } from "../posta-kapi";
import { bugun, gunEkle } from "../tarih";
import { kapiHatasi } from "../yz";
import { useBen } from "../oturum";
import { useVeri } from "../veri";
import { rotaDoneminiAktar } from "../rotaAktar";

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
  const [sunucuTablo, setSunucuTablo] = useState("");
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
      setSunucuTablo(r.veri.sunucuTabloId ? `https://docs.google.com/spreadsheets/d/${r.veri.sunucuTabloId}` : "");
    });
  }, []);

  const hataMetni = (h: string, ayrinti?: string) => (HATA[h] ? t(HATA[h]) : `${t("rotaHata")} [${h}${ayrinti ? ` ${ayrinti}` : ""}]`);

  if (!GERCEK || !ayar)
    return (
      <Kart baslik={t("rotaBaslik")} ikon={<Sheet size={18} />}>
        {!GERCEK ? <p className="sonuk-yazi">{t("yzDemoda")}</p> : hata ? <p className="sonuk-yazi">{hata}</p> : <Loader2 size={18} className="donen" />}
      </Kart>
    );

  const kaydet = async (g: { tablo?: string; sunucuTablo?: string; hesap?: string | null }) => {
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
    const yarin = gunEkle(bugun(), 1);
    const sonuc = async (tur: "rota" | "sunucu") => {
      const r = await rotaGetir(yarin, true, tur);
      return r.tamam ? t("rotaDenendi", { sekme: r.veri.sekme, n: r.veri.satirlar.length }) : hataMetni(r.hata, r.ayrinti);
    };
    const satirlar = [await sonuc("rota")];
    if (ayar.sunucuTabloId) satirlar.push(`${t("rotaSunucuTablo")}: ${await sonuc("sunucu")}`);
    setMesgul(false);
    setDeneme(satirlar.join(" · "));
  };

  return (
    <Kart baslik={t("rotaBaslik")} ikon={<Sheet size={18} />}>
      <div className="form" data-rota-ayari>
        <label>
          {t("rotaTablo")}
          <input dir="ltr" value={tablo} onChange={(e) => setTablo(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" data-rota-tablo />
        </label>
        <label>
          {t("rotaSunucuTablo")}
          <input dir="ltr" value={sunucuTablo} onChange={(e) => setSunucuTablo(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" data-rota-sunucu-tablo />
        </label>
        <label>
          {t("rotaHesap")}
          {ayar.anahtarVar && <small className="sonuk">{t("rotaHesapVar", { eposta: ayar.istemciEposta })}</small>}
          <textarea dir="ltr" rows={4} className="kod-alani" value={hesap} onChange={(e) => setHesap(e.target.value)} placeholder='{ "type": "service_account", … }' autoComplete="off" spellCheck={false} data-rota-hesap />
        </label>
        <div className="dugmeler">
          <button className="dugme" disabled={mesgul} onClick={() => void kaydet({ tablo, sunucuTablo, ...(hesap.trim() ? { hesap } : {}) })} data-rota-kaydet>
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
        {ayar.anahtarVar && ayar.tabloId && <RotaDonemi />}
      </div>
    </Kart>
  );
}

/*
 * Rotadan çalışma programı (rotaAktar.ts): dönemin aktarımı açılışta kendiliğinden; burada
 * son dönem, kaç kişiye yazıldığı, kayıtla eşleşmeyen adlar ve elle yeniden aktarma.
 */
function RotaDonemi() {
  const { t, dil } = useDil();
  const ben = useBen();
  const v = useVeri();
  const [mesgul, setMesgul] = useState(false);
  const son = [...(v.rotaProgramlari ?? [])].sort((a, b) => b.bas.localeCompare(a.bas))[0];
  const aktar = async () => {
    if (!ben) return;
    setMesgul(true);
    const r = await rotaDoneminiAktar(ben, true).catch(() => "yok" as const);
    setMesgul(false);
    bildir(t(r === "tamam" ? "bRpAktarildi" : "bRpOkunamadi"));
  };
  return (
    <div className="form" data-rota-donemi>
      {son && (
        <p className="sonuk-yazi">
          {t("rpRotaDonem", { bas: tarihYaz(son.bas, dil, "kisa"), bit: tarihYaz(son.bit, dil, "kisa"), n: Object.keys(son.kisiler).length })}
        </p>
      )}
      {son && son.eslesmeyen.length > 0 && (
        <p className="sonuk-yazi" data-rota-eslesmeyen>
          {t("rpEslesmeyen", { n: son.eslesmeyen.length, adlar: son.eslesmeyen.join(", ") })}
        </p>
      )}
      <div className="dugmeler">
        <button className="dugme dugme-ikincil" disabled={mesgul} onClick={() => void aktar()} data-rota-aktar>
          {t("rpAktar")}
        </button>
      </div>
    </div>
  );
}
