import { Copy, KeyRound, Link2, Mail, Plus, RotateCcw, Send, UserCog, UserPlus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar, Bos, Kart, Pencere, Rozet, bildir } from "../bilesenler/Parcalar";
import { tarihYaz, useDil, type Anahtar } from "../dil";
import type { Davet, KayitBaglantisi } from "../depo/firebase";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { hesapsizKisiEkle, kisiHesabi, kisiPozisyonu, kisiYetkileri } from "../eylemler";
import { firebaseYukle } from "../kip";
import { BIRIMLER, GOREVLER, HESAP_YETKILERI, useVeri, type Birim, type Gorev, type HesapYetkisi, type Kisi, type Rol } from "../veri";
import { hesapYetkisi } from "../yetki";
import { SayfaBasi } from "./ana/Planlama";

/**
 * Gerçek kipte hesaplar (yalnız hesap yöneticisi; yetki.ts → sayfaGorebilir).
 *
 * Kişi iki yoldan geliyor:
 * - davet: yönetici e-posta, ad, birim ve görevi yazıp davet ediyor; Firebase
 *   kişiye etkinleştirme bağlantısını gönderiyor (depo/firebase.ts → davetEt).
 *   Kişi bağlantıyla girip şifresini belirleyince kaydı davetten kuruluyor.
 * - kayıt bağlantısı: yönetici paylaşılabilir bir bağlantı açıyor, kişi
 *   bilgilerini kendisi giriyor (KayitSayfasi). Yetkisiz personel olarak
 *   açılıyor, "kontrol bekliyor" işaretiyle; yönetici "Düzenle" ile bakıyor.
 *
 * - hesapsız kişi (pilot): sistemi kullanmayan personel yalnız adıyla;
 *   seçimlerde görünür, giriş yapamaz. "Hesaba bağla" onu davet eder,
 *   etkinleşince kaydı hesabına geçer (eylemler.ts → hesabaGecir).
 *
 * Sayfanın işleri seçmeli yetkilerle bölünmüş (veri.ts → HESAP_YETKILERI):
 * kişi yalnız kendisine verilen kısmı görür. Yetki vermek ve tam yönetici
 * yapmak yalnız tam yöneticide.
 *
 * Davetler ve bağlantılar kaydın (`Durum`) parçası değil: hesap işi,
 * planlama kaydına karışmasın; doğrudan Firestore'dan dinleniyor.
 */

const DAVET_DURUM_ADI: Record<Davet["durum"], Anahtar> = { bekliyor: "davetBekliyor", kullanildi: "davetKullanildi", iptal: "davetIptal" };
const DAVET_DURUM_TONU: Record<Davet["durum"], string> = { bekliyor: "uyari", kullanildi: "iyi", iptal: "" };

const BOS_FORM = {
  eposta: "",
  adTr: "",
  adAr: "",
  adEn: "",
  birim: "planlama" as Birim,
  gorev: "planlamaci" as Gorev,
  rol: "personel" as Rol,
  hesapYoneticisi: false,
  telefon: "",
};

const YETKI_ADI: Record<HesapYetkisi, Anahtar> = {
  davet: "hyDavet",
  kayitBaglantisi: "hyKayitBaglantisi",
  kisiDuzenle: "hyKisiDuzenle",
  hesapAcKapa: "hyHesapAcKapa",
  hesapsizKisi: "hyHesapsizKisi",
};

/* Üç yazımlı ad; boş bırakılan dil öbüründen (kişi adı arayüz dilinin yazımıyla okunuyor). */
const adKur = (tr0: string, ar0: string, en0: string, yedek: string) => {
  const tr = tr0.trim() || en0.trim() || ar0.trim() || yedek;
  return { tr, ar: ar0.trim() || tr, en: en0.trim() || tr };
};

export default function Kullanicilar({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const davetYetkisi = hesapYetkisi(ben, "davet");
  const baglantiYetkisi = hesapYetkisi(ben, "kayitBaglantisi");
  const hesapsizYetkisi = hesapYetkisi(ben, "hesapsizKisi");
  const [davetler, setDavetler] = useState<Davet[] | null>(null);
  const [baglantilar, setBaglantilar] = useState<KayitBaglantisi[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [tur, setTur] = useState<"davet" | "hesapsiz">(davetYetkisi ? "davet" : "hesapsiz");
  const [form, setForm] = useState(BOS_FORM);
  const [bekle, setBekle] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Kisi | null>(null);
  const [baglanan, setBaglanan] = useState<Kisi | null>(null);
  const [yetkiVerilen, setYetkiVerilen] = useState<Kisi | null>(null);
  const alan = <K extends keyof typeof BOS_FORM>(k: K, deger: (typeof BOS_FORM)[K]) => setForm((f) => ({ ...f, [k]: deger }));

  // Yalnız yetkisi olan dinliyor: kurallar öbürüne okutmuyor, boşuna hata vermesin.
  useEffect(() => {
    let kopar: (() => void) | undefined;
    let bitti = false;
    firebaseYukle().then((f) => {
      if (bitti) return;
      const k1 = davetYetkisi ? f.davetleriIzle(setDavetler, setHata) : undefined;
      const k2 = baglantiYetkisi ? f.kayitBaglantilariIzle(setBaglantilar, setHata) : undefined;
      kopar = () => {
        k1?.();
        k2?.();
      };
    });
    return () => {
      bitti = true;
      kopar?.();
    };
  }, [davetYetkisi, baglantiYetkisi]);

  const ekle = (e: FormEvent) => {
    e.preventDefault();
    const eposta = form.eposta.trim().toLowerCase();
    const adi = adKur(form.adTr, form.adAr, form.adEn, eposta);
    if (tur === "hesapsiz") {
      if (hesapsizKisiEkle(ben, { ad: adi, birim: form.birim, gorev: form.gorev, eposta, telefon: form.telefon })) {
        bildir(t("hesapsizEklendi", { ad: adi.tr }));
        setForm(BOS_FORM);
      }
      return;
    }
    setBekle(true);
    firebaseYukle()
      .then((f) =>
        f.davetEt({ eposta, ad: adi, birim: form.birim, gorev: form.gorev, rol: form.rol, hesapYoneticisi: ben.hesapYoneticisi ? form.hesapYoneticisi : false, davetEden: ben.id }, dil),
      )
      .then(() => {
        bildir(t("davetGonderildi", { eposta }));
        setForm(BOS_FORM);
      })
      .catch((x) => {
        console.error(x);
        bildir(t("davetGonderilemedi"));
      })
      .finally(() => setBekle(false));
  };

  const yenidenGonder = (eposta: string) =>
    firebaseYukle()
      .then((f) => f.baglantiGonder(eposta, dil))
      .then(() => bildir(t("davetGonderildi", { eposta })))
      .catch(() => bildir(t("davetGonderilemedi")));
  const iptalEt = (eposta: string) => firebaseYukle().then((f) => f.davetIptal(eposta));

  const baglantiAc = () =>
    firebaseYukle()
      .then((f) => f.kayitBaglantisiOlustur(ben.id))
      .then((b) => kopyala(b.kod))
      .catch((x) => {
        console.error(x);
        bildir(t("ghBilinmeyen"));
      });
  const kopyala = (kod: string) =>
    firebaseYukle()
      .then((f) => navigator.clipboard.writeText(f.kayitAdresi(kod)))
      .then(() => bildir(t("bKopyalandi")))
      .catch(() => bildir(t("kopyalanamadi")));
  const baglantiKapat = (kod: string) => firebaseYukle().then((f) => f.kayitBaglantisiKapat(kod));
  // Kapalı ve süresi geçmiş bağlantı listede kalabalık etmesin; yalnız geçerliler.
  const acikBaglantilar = (baglantilar ?? []).filter((b) => b.acik && Date.now() < b.bitis);

  const kisiler = [...v.kisiler].sort((a, b) => Number(!!a.pasif) - Number(!!b.pasif) || Number(!!a.hesapsiz) - Number(!!b.hesapsiz) || ad(a).localeCompare(ad(b)));
  const kapatabilir = (k: Kisi) => k.id !== ben.id && !k.hesapsiz && (!!ben.hesapYoneticisi || (hesapYetkisi(ben, "hesapAcKapa") && !k.hesapYoneticisi));
  const ekleyebilir = davetYetkisi || hesapsizYetkisi;
  const hesapsizTur = tur === "hesapsiz";

  return (
    <>
      <SayfaBasi ikon={<UserCog size={26} />} baslik={t("mKullanicilar")} />
      {ekleyebilir && (
        <Kart baslik={t("kisiEkle")} ikon={<UserPlus size={18} />}>
          <form className="form" onSubmit={ekle} data-davet-formu>
            {davetYetkisi && hesapsizYetkisi && (
              <div className="sekmeler" role="tablist" aria-label={t("kisiEkle")}>
                <button type="button" role="tab" aria-selected={!hesapsizTur} className={!hesapsizTur ? "acik" : ""} onClick={() => setTur("davet")} data-tur-davet>
                  {t("davetEt")}
                </button>
                <button type="button" role="tab" aria-selected={hesapsizTur} className={hesapsizTur ? "acik" : ""} onClick={() => setTur("hesapsiz")} data-tur-hesapsiz>
                  {t("hesapsizKisi")}
                </button>
              </div>
            )}
            <div className="satir">
              <label>
                {t("eposta")}
                <input type="email" dir="ltr" value={form.eposta} onChange={(e) => alan("eposta", e.target.value)} required={!hesapsizTur} data-davet-eposta />
              </label>
              {hesapsizTur && (
                <label>
                  {t("telefon")}
                  <input type="tel" dir="ltr" value={form.telefon} onChange={(e) => alan("telefon", e.target.value)} data-hesapsiz-telefon />
                </label>
              )}
            </div>
            {/* Kişi adı içerik değil: arayüz dilinin yazımıyla okunuyor; üç yazımı ayrı. */}
            <div className="satir">
              <label>
                {t("adTurkce")}
                <input value={form.adTr} onChange={(e) => alan("adTr", e.target.value)} required data-davet-ad />
              </label>
              <label>
                {t("adArapca")}
                <input dir="rtl" lang="ar" value={form.adAr} onChange={(e) => alan("adAr", e.target.value)} />
              </label>
              <label>
                {t("adIngilizce")}
                <input dir="ltr" value={form.adEn} onChange={(e) => alan("adEn", e.target.value)} />
              </label>
            </div>
            <div className="satir">
              <label>
                {t("birim")}
                <select value={form.birim} onChange={(e) => alan("birim", e.target.value as Birim)} data-davet-birim>
                  {BIRIMLER.map((b) => (
                    <option key={b} value={b}>
                      {t(BIRIM_ADI[b])}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("gorev")}
                <select value={form.gorev} onChange={(e) => alan("gorev", e.target.value as Gorev)} data-davet-gorev>
                  {GOREVLER.map((g) => (
                    <option key={g} value={g}>
                      {t(GOREV_ADI[g])}
                    </option>
                  ))}
                </select>
              </label>
              {!hesapsizTur && (
                <label>
                  {t("rol")}
                  <select value={form.rol} onChange={(e) => alan("rol", e.target.value as Rol)}>
                    <option value="personel">{t("rolPersonel")}</option>
                    <option value="yonetici">{t("rolYonetici")}</option>
                  </select>
                </label>
              )}
            </div>
            {/* Yöneticilik yalnız tam yöneticiden: davet yetkisi olan yönetici davet edemiyor (kurallar da). */}
            {!hesapsizTur && ben.hesapYoneticisi && (
              <label className="secim">
                <input type="checkbox" checked={form.hesapYoneticisi} onChange={(e) => alan("hesapYoneticisi", e.target.checked)} />
                {t("hesapYoneticisi")}
              </label>
            )}
            <div className="form-alt">
              {hesapsizTur ? (
                <button className="dugme" data-hesapsiz-ekle>
                  <UserPlus size={16} /> {t("hesapsizKisiEkle")}
                </button>
              ) : (
                <button className="dugme" disabled={bekle} data-davet-gonder>
                  <Mail size={16} /> {t("davetGonder")}
                </button>
              )}
            </div>
          </form>
        </Kart>
      )}

      {baglantiYetkisi && (
        <Kart
          baslik={t("kayitBaglantilari")}
          ikon={<Link2 size={18} />}
          sagUc={
            <button type="button" className="dugme dugme-kucuk" onClick={baglantiAc} data-kayit-baglantisi-ac>
              <Plus size={14} /> {t("yeniKayitBaglantisi")}
            </button>
          }
        >
          {!baglantilar ? (
            <Bos kucuk metin={t("yukleniyor")} />
          ) : acikBaglantilar.length === 0 ? (
            <Bos kucuk metin={t("kayitBaglantisiYok")} />
          ) : (
            <ul className="kayit-baglantilari">
              {acikBaglantilar.map((b) => (
                <li key={b.kod} data-kayit-baglantisi={b.kod}>
                  <input readOnly dir="ltr" value={`…/#/kayit/${b.kod}`} aria-label={t("kayitBaglantilari")} onFocus={(e) => e.target.select()} />
                  <span className="soluk">{t("sonGecerlilik", { tarih: tarihYaz(new Date(b.bitis).toISOString()) })}</span>
                  <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={() => kopyala(b.kod)} data-kayit-kopyala>
                    <Copy size={14} /> {t("baglantiyiKopyala")}
                  </button>
                  <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => baglantiKapat(b.kod)} data-kayit-kapat>
                    <X size={14} /> {t("baglantiyiKapat")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Kart>
      )}

      {davetYetkisi && (
        <Kart baslik={t("davetler")} ek={davetler ? String(davetler.length) : undefined} ikon={<Send size={18} />}>
          {hata ? (
            <p className="not-kutu uyari">{t("ggKayitHatasi", { kod: hata })}</p>
          ) : !davetler ? (
            <Bos kucuk metin={t("yukleniyor")} />
          ) : davetler.length === 0 ? (
            <Bos kucuk metin={t("davetYok")} />
          ) : (
            <table className="tablo kartli">
              <thead>
                <tr>
                  <th>{t("eposta")}</th>
                  <th>{t("ad")}</th>
                  <th>{t("birim")}</th>
                  <th>{t("durum")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {davetler.map((d) => (
                  <tr key={d.eposta} data-davet={d.eposta}>
                    <td className="birincil">
                      <bdi>{d.eposta}</bdi>
                    </td>
                    <td data-etiket={t("ad")}>{ad({ ad: d.ad })}</td>
                    <td data-etiket={t("birim")}>
                      {t(BIRIM_ADI[d.birim])} · {t(GOREV_ADI[d.gorev])}
                    </td>
                    <td data-etiket={t("durum")}>
                      <Rozet ton={DAVET_DURUM_TONU[d.durum]}>{t(DAVET_DURUM_ADI[d.durum])}</Rozet>
                    </td>
                    <td className="islem-hucre">
                      {d.durum === "bekliyor" && (
                        <>
                          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => yenidenGonder(d.eposta)}>
                            <RotateCcw size={14} /> {t("yenidenGonder")}
                          </button>
                          <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => iptalEt(d.eposta)} data-davet-iptal>
                            <X size={14} /> {t("davetiIptalEt")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Kart>
      )}

      <Kart baslik={t("hesaplar")} ek={String(kisiler.length)}>
        <table className="tablo kartli">
          <thead>
            <tr>
              <th>{t("ad")}</th>
              <th>{t("eposta")}</th>
              <th>{t("birim")}</th>
              <th>{t("durum")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {kisiler.map((k) => (
              <tr key={k.id} data-hesap={k.id}>
                <td className="birincil">
                  <span className="kisi-hucre">
                    <Avatar kisi={k} boy="kucuk" /> {ad(k)}
                  </span>
                </td>
                <td data-etiket={t("eposta")}>
                  <bdi>{k.eposta || "—"}</bdi>
                </td>
                <td data-etiket={t("birim")}>
                  {t(BIRIM_ADI[k.birim])} · {t(GOREV_ADI[k.gorev])}
                </td>
                <td data-etiket={t("durum")}>
                  {k.hesapsiz ? (
                    <span data-hesap-yok>
                      <Rozet>{t("hesapYok")}</Rozet>
                    </span>
                  ) : (
                    <Rozet ton={k.pasif ? "" : "iyi"}>{t(k.pasif ? "hesapPasif" : "hesapEtkin")}</Rozet>
                  )}{" "}
                  {k.hesapYoneticisi && <Rozet ton="koyu">{t("hesapYoneticisi")}</Rozet>}
                  {!k.hesapYoneticisi && !!k.yetkiler?.length && (
                    <span data-yetki-sayisi={k.yetkiler.length}>
                      <Rozet ton="koyu" title={k.yetkiler.map((y) => t(YETKI_ADI[y])).join(", ")}>
                        {t("yetkiSayisi", { n: k.yetkiler.length })}
                      </Rozet>
                    </span>
                  )}{" "}
                  {k.kontrolBekliyor && (
                    <span data-kontrol-bekliyor>
                      <Rozet ton="uyari">{t("kontrolBekliyor")}</Rozet>
                    </span>
                  )}
                </td>
                <td className="islem-hucre">
                  {hesapYetkisi(ben, "kisiDuzenle") && (
                    <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setDuzenlenen(k)} data-pozisyon-duzenle>
                      {t("duzenle")}
                    </button>
                  )}
                  {k.hesapsiz && davetYetkisi && (
                    <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setBaglanan(k)} data-hesaba-bagla>
                      <Mail size={14} /> {t("hesabaBagla")}
                    </button>
                  )}
                  {/* Kendi hesabını kapatamıyor, yetkisini bırakamıyor: sistem yöneticisiz kalmasın. */}
                  {kapatabilir(k) && (
                    <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => kisiHesabi(ben, k.id, { pasif: !k.pasif })} data-hesap-pasif>
                      {t(k.pasif ? "hesabiAc" : "hesabiKapat")}
                    </button>
                  )}
                  {ben.hesapYoneticisi && k.id !== ben.id && !k.hesapsiz && (
                    <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => setYetkiVerilen(k)} data-yetkiler>
                      <KeyRound size={14} /> {t("yetkiler")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kart>
      {duzenlenen && <PozisyonPenceresi ben={ben} kisi={duzenlenen} kapat={() => setDuzenlenen(null)} />}
      {baglanan && <BaglaPenceresi ben={ben} kisi={baglanan} kapat={() => setBaglanan(null)} />}
      {yetkiVerilen && <YetkiPenceresi ben={ben} kisi={yetkiVerilen} kapat={() => setYetkiVerilen(null)} />}
    </>
  );
}

/* Hesapsız kişiyi davet eder; etkinleşince kaydı ve geçmişi hesabına geçer (davetteki kisiId). */
function BaglaPenceresi({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const [eposta, setEposta] = useState(kisi.eposta);
  const [bekle, setBekle] = useState(false);
  const gonder = (e: FormEvent) => {
    e.preventDefault();
    const adres = eposta.trim().toLowerCase();
    setBekle(true);
    const adi = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
    firebaseYukle()
      .then((f) => f.davetEt({ eposta: adres, ad: adi, birim: kisi.birim, gorev: kisi.gorev, rol: kisi.rol, hesapYoneticisi: false, davetEden: ben.id, kisiId: kisi.id }, dil))
      .then(() => {
        bildir(t("davetGonderildi", { eposta: adres }));
        kapat();
      })
      .catch((x) => {
        console.error(x);
        bildir(t("davetGonderilemedi"));
      })
      .finally(() => setBekle(false));
  };
  return (
    <Pencere baslik={t("hesabaBagla")} alt={ad(kisi)} kapat={kapat}>
      <form className="form" onSubmit={gonder} data-bagla-formu>
        <label>
          {t("eposta")}
          <input type="email" dir="ltr" value={eposta} onChange={(e) => setEposta(e.target.value)} required data-bagla-eposta />
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme dugme-kucuk" disabled={bekle} data-bagla-gonder>
            <Mail size={14} /> {t("davetGonder")}
          </button>
        </div>
      </form>
    </Pencere>
  );
}

/* Tam yönetici başkasına seçmeli yetki ya da tam yöneticilik veriyor. */
function YetkiPenceresi({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const [tam, setTam] = useState(!!kisi.hesapYoneticisi);
  const [secili, setSecili] = useState<HesapYetkisi[]>(kisi.yetkiler ?? []);
  const degistir = (y: HesapYetkisi, var_: boolean) => setSecili((l) => (var_ ? [...l, y] : l.filter((x) => x !== y)));
  const kaydet = () => {
    const a = tam !== !!kisi.hesapYoneticisi ? kisiHesabi(ben, kisi.id, { hesapYoneticisi: tam }) : true;
    // Sıra tablodaki gibi: kayıtta aynı yetki kümesi hep aynı görünsün.
    const b = kisiYetkileri(ben, kisi.id, HESAP_YETKILERI.filter((y) => secili.includes(y)));
    if (a && b) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={t("yetkiler")} alt={ad(kisi)} kapat={kapat}>
      <div className="form" data-yetki-formu>
        <label className="secim">
          <input type="checkbox" checked={tam} onChange={(e) => setTam(e.target.checked)} data-yetki-tam />
          {t("tamYonetici")}
        </label>
        <fieldset className="yetki-listesi" disabled={tam}>
          {HESAP_YETKILERI.map((y) => (
            <label key={y} className="secim">
              <input type="checkbox" checked={tam || secili.includes(y)} onChange={(e) => degistir(y, e.target.checked)} data-yetki={y} />
              {t(YETKI_ADI[y])}
            </label>
          ))}
        </fieldset>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" onClick={kaydet} data-yetki-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

/* Etkin kişinin adı, birimi, görevi ve rolü; davet formundaki alanların aynısı. */
function PozisyonPenceresi({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t, ad } = useDil();
  const ilk = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
  const [p, setP] = useState({ birim: kisi.birim, gorev: kisi.gorev, rol: kisi.rol, ...ilk });
  const kaydet = () => {
    const tr = p.tr.trim() || p.en.trim() || ad(kisi);
    if (kisiPozisyonu(ben, kisi.id, { birim: p.birim, gorev: p.gorev, rol: p.rol, ad: { tr, ar: p.ar.trim() || tr, en: p.en.trim() || tr } })) {
      bildir(t("bKaydedildi"));
      kapat();
    }
  };
  return (
    <Pencere baslik={ad(kisi)} alt={kisi.eposta} kapat={kapat}>
      <div className="form" data-pozisyon-formu>
        <label>
          {t("adTurkce")}
          <input value={p.tr} onChange={(e) => setP({ ...p, tr: e.target.value })} data-pozisyon-ad />
        </label>
        <label>
          {t("adArapca")}
          <input dir="rtl" lang="ar" value={p.ar} onChange={(e) => setP({ ...p, ar: e.target.value })} />
        </label>
        <label>
          {t("adIngilizce")}
          <input dir="ltr" value={p.en} onChange={(e) => setP({ ...p, en: e.target.value })} />
        </label>
        <label>
          {t("birim")}
          <select value={p.birim} onChange={(e) => setP({ ...p, birim: e.target.value as Birim })} data-pozisyon-birim>
            {BIRIMLER.map((b) => (
              <option key={b} value={b}>
                {t(BIRIM_ADI[b])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gorev")}
          <select value={p.gorev} onChange={(e) => setP({ ...p, gorev: e.target.value as Gorev })} data-pozisyon-gorev>
            {GOREVLER.map((g) => (
              <option key={g} value={g}>
                {t(GOREV_ADI[g])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("rol")}
          <select value={p.rol} onChange={(e) => setP({ ...p, rol: e.target.value as Rol })} data-pozisyon-rol>
            <option value="personel">{t("rolPersonel")}</option>
            <option value="yonetici">{t("rolYonetici")}</option>
          </select>
        </label>
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" onClick={kaydet} data-pozisyon-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}
