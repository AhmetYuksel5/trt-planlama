import { TarihGirdisi } from "../bilesenler/TarihSaat";
import { birimAdi, gorevAdi } from "../yapi";
import { Activity, Database, Palette, Lock, RotateCcw, Settings, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import DilSecici from "../bilesenler/DilSecici";
import { KatlanirKartlar, Kart, bildir } from "../bilesenler/Parcalar";
import { gunAdi, useDil } from "../dil";
import { GERCEK, firebaseYukle } from "../kip";
import { kisiCalismaGunleri, sayimBaslangiciKaydet } from "../eylemler";
import { sifirla, useVeri, type Kisi } from "../veri";
import { geriBildirimSablonuDuzenler, kayitTemizleyebilir, postaGorebilir, yapabilir } from "../yetki";
import { GeriBildirimAyarlari, PlanPostasiAyarlari } from "./GeriBildirimSablonlari";
import { KayitTemizligi } from "./KayitTemizligi";
import { KayitYedegi } from "./KayitYedegi";
import { YapayZekaAyari } from "./YapayZeka";
import { PostaAyari } from "./PostaAyari";
import { RotaAyari } from "./RotaAyari";
import { PostaKimlikKart } from "./posta/PostaKimlik";
import { OtoCagriKart } from "./posta/OtoCagri";
import { SayfaBasi } from "./ana/Planlama";
import { MuhabirKilavuzu } from "./ana/MuhabirKilavuzu";
import { bipCal, sesAcik, sesKaydet } from "../bilesenler/Ses";
import { TASARIM_DILLERI, tasarimDiliKaydet, useTasarimDili, useYeniTasarim } from "../tasarimSecimi";
import { TEMALAR, temaKaydet, useTema } from "../tema";
import { birimMenusu } from "../bilesenler/AnaMenu";

/* Ayarlar: dil, oturum ve (demoda) örnek veri. Kalıcılığın sınırı burada açıkça yazıyor; gerçek kayıt buradan sıfırlanmıyor. */
export function Ayarlar({ ben }: { ben: Kisi }) {
  const { t, ad } = useDil();
  return (
    <>
      <SayfaBasi
        ikon={<Settings size={26} />}
        baslik={t("mAyarlar")}
       
      />
      {/* Her ayar bir başlık satırı, basınca açılır (kullanıcı: kartlar bütün sayfayı kaplamasın). */}
      <KatlanirKartlar.Provider value={true}>
      <div className="ayar-listesi" data-ayar-listesi>
        <Kart baslik={t("arayuzDili")}>
          <DilSecici />
        </Kart>
        <Kart baslik={t("oturum")}>
          <p>
            <b>{ad(ben)}</b> · {birimAdi(ben.birim)} ·{" "}
            {gorevAdi(ben.gorev)}
          </p>
        </Kart>
        {ben.birim === "muhabir" && <KisiselAyar ben={ben} />}
        <TasarimAyari />
        <TemaAyari ben={ben} />
        <SesAyari />
        {ben.hesapYoneticisi && <IsAkisiAyari />}
        {ben.hesapYoneticisi && <GunNotuAyari ben={ben} />}
        {geriBildirimSablonuDuzenler(ben) && <PlanPostasiAyarlari ben={ben} />}
        {geriBildirimSablonuDuzenler(ben) && <GeriBildirimAyarlari ben={ben} />}
        {ben.hesapYoneticisi && <YapayZekaAyari />}
        {ben.hesapYoneticisi && <PostaAyari />}
        {GERCEK && ben.hesapYoneticisi && <RotaAyari />}
        {GERCEK && postaGorebilir(ben) && <PostaKimlikKart />}
        {GERCEK && postaGorebilir(ben) && yapabilir(ben, "cagriHazirla") && <OtoCagriKart />}
        {GERCEK && ben.hesapYoneticisi && <OkumaSayaci />}
        {kayitTemizleyebilir(ben) && <KayitYedegi />}
        {kayitTemizleyebilir(ben) && <KayitTemizligi ben={ben} />}
        {!GERCEK && (
          <Kart baslik={t("ornekVeri")} ikon={<Database size={18} />}>
            <button
              className="dugme dugme-kotu"
              onClick={() => {
                if (confirm(t("sifirlansinMi"))) {
                  sifirla();
                  bildir(t("bSifirlandi"));
                }
              }}
            >
              <RotateCcw size={16} /> {t("ornekVeriyeDon")}
            </button>
          </Kart>
        )}
      </div>
      </KatlanirKartlar.Provider>
      {ben.birim === "muhabir" && <MuhabirKilavuzu />}
    </>
  );
}

/* Muhabirin kişisel bilgileri profilinde; çalışma günleri burada, kişinin kaydında. Hafta Cumartesi başlıyor. */
const HAFTA = [6, 0, 1, 2, 3, 4, 5];
const GUN_ORNEGI = (g: number) => `2026-10-${String(18 + g).padStart(2, "0")}`; // 18 Ekim 2026 Pazar

function KisiselAyar({ ben }: { ben: Kisi }) {
  const { t, dil } = useDil();
  const v = useVeri();
  const kisi = v.kisiler.find((k) => k.id === ben.id) ?? ben;
  const secili = kisi.calismaGunleri ?? [];
  return (
    <Kart baslik={t("kisiselBilgiler")}>
      <p>
        <a className="dugme dugme-ikincil" href="#/profil" data-profil-bagi>
          {t("profiliAc")}
        </a>
      </p>
      <p><b>{t("calismaGunleri")}</b></p>
      <div className="yetki-listesi" data-calisma-gunleri>
        {HAFTA.map((g) => (
          <label key={g} className="satir-kutu">
            <input
              type="checkbox"
              checked={secili.includes(g)}
              onChange={(e) => kisiCalismaGunleri(ben, ben.id, e.target.checked ? [...secili, g] : secili.filter((x) => x !== g))}
              data-calisma-gunu={g}
            />{" "}
            {gunAdi(GUN_ORNEGI(g), dil)}
          </label>
        ))}
      </div>
    </Kart>
  );
}

/*
 * Tasarım dili (tasarimSecimi.ts): yeni (varsayılan), Paper, eski; bu tarayıcıda saklanıyor. Her seçeneğin
 * küçük örneği kendi dilinin zemini, kartı, vurgusu ve yazı ailesiyle çiziliyor (`.tasarim-ornek`).
 */
const TASARIM_ADI = { yeni: "tasarimYeni", yesil: "tasarimYesil", paper: "tasarimPaper", eski: "tasarimEski" } as const;
function TasarimAyari() {
  const { t } = useDil();
  const secili = useTasarimDili();
  return (
    <Kart baslik={t("tasarimAyar")} ikon={<Palette size={18} />}>
      <div className="tasarim-secimi" role="group" aria-label={t("tasarimAyar")} data-tasarim-secimi>
        {TASARIM_DILLERI.map((d) => (
          <button key={d} type="button" aria-pressed={secili === d} onClick={() => tasarimDiliKaydet(d)} data-tasarim-dili={d}>
            <span className={`tasarim-ornek ornek-${d}`} aria-hidden>
              <i />
              <b>Aa</b>
            </span>
            {t(TASARIM_ADI[d])}
          </button>
        ))}
      </div>
    </Kart>
  );
}

/* Yeni bildirimde ses; bu tarayıcıda saklanıyor (Ses.ts). */
function SesAyari() {
  const { t } = useDil();
  const [acik, setAcik] = useState(sesAcik);
  return (
    <Kart baslik={t("sesUyari")}>
      <label className="satir-kutu">
        <input
          type="checkbox"
          checked={acik}
          onChange={(e) => {
            sesKaydet(e.target.checked);
            setAcik(e.target.checked);
            if (e.target.checked) bipCal();
          }}
          data-ses-ayari
        />{" "}
        {t("sesUyariAcik")}
      </label>
    </Kart>
  );
}

/* Günün notunun sayım başlangıcı: tam kullanıma geçilen günden önceki eksik kayıtlar uyarıları yanıltmasın. Boş bırakılırsa hepsi sayılır. */
function GunNotuAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("gunNotu")} ikon={<Sparkles size={18} />}>
      <label className="alan">
        <span>{t("gnSayimBaslangici")}</span>
        <TarihGirdisi value={v.sayimBaslangici ?? ""} onChange={(e) => sayimBaslangiciKaydet(ben, e.target.value) && bildir(t("bKaydedildi"))} data-sayim-baslangici />
      </label>
    </Kart>
  );
}

/*
 * İş akışı: planların onay ve kesinleştirme yetkileri ve paketlerin üretim
 * şablonları Organizasyon'da. "Newsdesk sistemde" anahtarı kalktı: paketin
 * hangi masalardan geçeceği üretim balonunda paket paket seçiliyor.
 */
function IsAkisiAyari() {
  const { t } = useDil();
  return (
    <Kart baslik={t("isAkisiBicimi")} ikon={<Workflow size={18} />}>
      <div className="dugmeler">
        {/* Planların onay ve kesinleştirme yetkileri kurum yapısında: taslak, yayın ve sürümleriyle. */}
        <a className="dugme dugme-ikincil dugme-kucuk" href="#/organizasyon/planlar" data-plan-yetkileri-bag>
          <ShieldCheck size={14} /> {t("orgPlanYetkileri")}
        </a>
        <a className="dugme dugme-ikincil dugme-kucuk" href="#/organizasyon/uretim" data-uretim-sablonlari-bag>
          <Workflow size={14} /> {t("urSablonlar")}
        </a>
      </div>
    </Kart>
  );
}

export function Yetkisiz() {
  const { t } = useDil();
  return (
    <div className="bos">
      <Lock size={32} />
      <h2>{t("yetkisizBaslik")}</h2>
      <p>{t("yetkisizAciklama")}</p>
      <a className="dugme dugme-ikincil" href="#/">
        {t("anaSayfayaDon")}
      </a>
    </div>
  );
}

/*
 * Tema rengi (tema.ts): yalnız renkli kabuğu olan kişide (muhabir, masalar, Planlama'nın yeni menüsü);
 * öbürlerinde seçimin görünür bir etkisi olmazdı. "Birimin rengi" seçimi kaldırır.
 */
function TemaAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const yeni = useYeniTasarim();
  const secili = useTema();
  const kabuk = birimMenusu(ben, yeni)?.tur;
  if (!kabuk) return null;
  const secenekler = [{ id: "", ad: "temaVarsayilan" as const, renk: `var(--masa-${kabuk})` }, ...TEMALAR];
  return (
    <Kart baslik={t("temaRengi")} ikon={<Palette size={18} />}>
      <div className="tema-secimi" role="group" aria-label={t("temaRengi")} data-tema-secimi>
        {secenekler.map((x) => (
          <button key={x.id || "birim"} type="button" aria-pressed={secili === x.id} onClick={() => temaKaydet(x.id)} data-tema={x.id || "birim"}>
            <span className="tema-ornek" style={{ ["--ornek" as string]: x.renk }} />
            {t(x.ad)}
          </button>
        ))}
      </div>
    </Kart>
  );
}

/*
 * Bu tarayıcının kota günü boyunca Firestore'dan okuduğu belgeler, koleksiyon başına (depo/firebase.ts →
 * okumaSayilari): ücretsiz planın günlük okuma kotası doluyordu, neyin tükettiği tahminle değil ölçerek bulunsun.
 * Başka sekme okudukça da artsın diye `storage` olayını da dinliyor.
 */
function OkumaSayaci() {
  const { t, dil } = useDil();
  const [s, setS] = useState<{ bas: number; sifir: number; liste: [string, number][] } | null>(null);
  useEffect(() => {
    let acik = true;
    const tazele = () => void firebaseYukle().then((f) => acik && setS(f.okumaSayilari()));
    tazele();
    window.addEventListener("trt-okuma", tazele);
    window.addEventListener("storage", tazele);
    return () => {
      acik = false;
      window.removeEventListener("trt-okuma", tazele);
      window.removeEventListener("storage", tazele);
    };
  }, []);
  const toplam = s?.liste.reduce((a, [, n]) => a + n, 0) ?? 0;
  return (
    <Kart baslik={t("okumaSayaci")} ikon={<Activity size={18} />} ek={String(toplam)}>
      {s && (
        <>
          <p className="sonuk-yazi" data-okuma-toplam>
            {t("okumaSayaciOzet", {
              n: String(toplam),
              saat: new Date(s.bas).toLocaleTimeString(dil, { hour: "2-digit", minute: "2-digit" }),
              sifir: new Date(s.sifir).toLocaleTimeString(dil, { hour: "2-digit", minute: "2-digit" }),
            })}
          </p>
          <ul className="liste" data-okuma-sayaci>
            {s.liste.map(([alan, n]) => (
              <li key={alan}>
                <span className="ad">{alan}</span>
                <b>{n}</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </Kart>
  );
}
