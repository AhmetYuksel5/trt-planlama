import { birimAdi, kisiBirimleri, gorevAdi } from "../yapi";
import { Database, Lock, RotateCcw, Send, Settings, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useState } from "react";
import DilSecici from "../bilesenler/DilSecici";
import { WHATSAPP_YOLLARI, whatsappYolu, whatsappYoluKaydet, type WhatsappYolu } from "../bilesenler/WhatsApp";
import { KatlanirKartlar, Kart, bildir } from "../bilesenler/Parcalar";
import { gunAdi, useDil, type Anahtar } from "../dil";
import { GERCEK } from "../kip";
import { kisiCalismaGunleri, muhabireOneriBirimleriKaydet, newsdeskDevredeKaydet, sayimBaslangiciKaydet } from "../eylemler";
import { sifirla, useVeri, type Kisi } from "../veri";
import { geriBildirimSablonuDuzenler, kayitTemizleyebilir, muhabireOneriBirimleri, postaGorebilir, yapabilir } from "../yetki";
import { GeriBildirimAyarlari, TakdirAyari } from "./GeriBildirimSablonlari";
import { KayitTemizligi } from "./KayitTemizligi";
import { KayitYedegi, YeniDuzenGecisi } from "./KayitYedegi";
import { YapayZekaAyari } from "./YapayZeka";
import { PostaAyari } from "./PostaAyari";
import { PostaKimlikKart } from "./posta/PostaKimlik";
import { OtoCagriKart } from "./posta/OtoCagri";
import { InewsDenemesi } from "./InewsDenemesi";
import { SayfaBasi } from "./ana/Planlama";
import { MuhabirKilavuzu } from "./ana/MuhabirKilavuzu";
import { bipCal, sesAcik, sesKaydet } from "../bilesenler/Ses";
import { useYeniTasarim, yeniTasarimKaydet } from "../tasarimSecimi";

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
        {/* Muhabirin ekranında WhatsApp düğmesi yok (muhabir listesi ve profil başkalarının). */}
        {ben.birim !== "muhabir" && <WhatsappAyari />}
        <SesAyari />
        {ben.hesapYoneticisi && <MuhabireOneriAyari ben={ben} />}
        {ben.hesapYoneticisi && <IsAkisiAyari ben={ben} />}
        {ben.hesapYoneticisi && <GunNotuAyari ben={ben} />}
        {geriBildirimSablonuDuzenler(ben) && <GeriBildirimAyarlari ben={ben} />}
        {geriBildirimSablonuDuzenler(ben) && <TakdirAyari ben={ben} />}
        {ben.hesapYoneticisi && <YapayZekaAyari />}
        {ben.hesapYoneticisi && <PostaAyari />}
        {GERCEK && postaGorebilir(ben) && <PostaKimlikKart />}
        {GERCEK && postaGorebilir(ben) && yapabilir(ben, "cagriHazirla") && <OtoCagriKart />}
        {/* Geçici: iNEWS kopyala-yapıştır denemesi; işe yararsa FTP aktarımına geçilip silinecek. */}
        {ben.hesapYoneticisi && <InewsDenemesi />}
        {kayitTemizleyebilir(ben) && <KayitYedegi />}
        {kayitTemizleyebilir(ben) && <YeniDuzenGecisi ben={ben} />}
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

/* Yeni tasarım denemesi; bu tarayıcıda saklanıyor (tasarimSecimi.ts). */
function TasarimAyari() {
  const { t } = useDil();
  const acik = useYeniTasarim();
  return (
    <Kart baslik={t("yeniTasarim")}>
      <label className="satir-kutu">
        <input type="checkbox" checked={acik} onChange={(e) => yeniTasarimKaydet(e.target.checked)} data-tasarim-ayari />{" "}
        {t("yeniTasarimiAc")}
      </label>
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

/* Bilgisayarda WhatsApp düğmesinin yolu; bu bilgisayarda saklanıyor (WhatsApp.tsx). */
const WHATSAPP_YOLU_ADI: Record<WhatsappYolu, Anahtar> = { otomatik: "waOtomatik", uygulama: "waUygulama", web: "waWeb" };

function WhatsappAyari() {
  const { t } = useDil();
  const [yol, setYol] = useState(whatsappYolu);
  return (
    <Kart baslik={t("waAyar")}>
      <fieldset className="secim-grubu" data-whatsapp-yolu>
        <legend className="gizli-metin">{t("waAyar")}</legend>
        {WHATSAPP_YOLLARI.map((y) => (
          <label key={y} className="secim-cip">
            <input
              type="radio"
              name="whatsapp-yolu"
              checked={yol === y}
              onChange={() => {
                whatsappYoluKaydet(y);
                setYol(y);
              }}
              data-yol={y}
            />
            {t(WHATSAPP_YOLU_ADI[y])}
          </label>
        ))}
      </fieldset>
    </Kart>
  );
}

/* Muhabire doğrudan haber önerebilen birimler: yalnız tam yönetici seçiyor; seçilmemişse Planlama. */
function MuhabireOneriAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  const secili = muhabireOneriBirimleri(v);
  return (
    <Kart baslik={t("muhabireOneriBirimleri")} ikon={<Send size={18} className="yon" />}>
      <div className="yetki-listesi" data-muhabire-oneri-birimleri>
        {kisiBirimleri().filter((b) => b !== "muhabir").map((b) => (
          <label key={b} className="secim">
            <input
              type="checkbox"
              checked={secili.includes(b)}
              onChange={(e) => muhabireOneriBirimleriKaydet(ben, e.target.checked ? [...secili, b] : secili.filter((x) => x !== b))}
              data-birim={b}
            />
            {birimAdi(b)}
          </label>
        ))}
      </div>
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
        <input type="date" value={v.sayimBaslangici ?? ""} onChange={(e) => sayimBaslangiciKaydet(ben, e.target.value) && bildir(t("bKaydedildi"))} data-sayim-baslangici />
      </label>
    </Kart>
  );
}

/*
 * Newsdesk sistemde değilken (şimdilik) onaylı paketi muhabir "Tamamlandı"
 * diye kapatıyor; açılınca devral ve üretim akışı (Organizasyon › İş
 * akışları). Yalnız tam yönetici.
 */
function IsAkisiAyari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const v = useVeri();
  return (
    <Kart baslik={t("isAkisiBicimi")} ikon={<Workflow size={18} />}>
      <label className="secim">
        <input type="checkbox" checked={!!v.newsdeskDevrede} onChange={(e) => newsdeskDevredeKaydet(ben, e.target.checked) && bildir(t("bKaydedildi"))} data-newsdesk-devrede />
        {t("newsdeskDevrede")}
      </label>
      <div className="dugmeler ara-ust-2">
        {/* Planların onay ve kesinleştirme yetkileri kurum yapısında: taslak, yayın ve sürümleriyle. */}
        <a className="dugme dugme-ikincil dugme-kucuk" href="#/organizasyon/planlar" data-plan-yetkileri-bag>
          <ShieldCheck size={14} /> {t("orgPlanYetkileri")}
        </a>
        <a className="dugme dugme-ikincil dugme-kucuk" href="#/organizasyon/akislar">
          <Workflow size={14} /> {t("orgAkislar")}
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
