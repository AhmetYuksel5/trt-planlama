import { Mail, RotateCcw, Send, UserCog, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar, Bos, Kart, Rozet, bildir } from "../bilesenler/Parcalar";
import { useDil, type Anahtar } from "../dil";
import type { Davet } from "../depo/firebase";
import { BIRIM_ADI, GOREV_ADI } from "../etiketler";
import { kisiHesabi } from "../eylemler";
import { firebaseYukle } from "../kip";
import { BIRIMLER, GOREVLER, useVeri, type Birim, type Gorev, type Kisi, type Rol } from "../veri";
import { SayfaBasi } from "./ana/Planlama";

/**
 * Gerçek kipte hesaplar (yalnız hesap yöneticisi; yetki.ts → sayfaGorebilir).
 *
 * Kayıt formu yok, kişi davetle geliyor: yönetici e-posta, ad, birim ve
 * görevi yazıp davet ediyor; Firebase kişiye etkinleştirme bağlantısını
 * gönderiyor (depo/firebase.ts → davetEt). Kişi bağlantıyla girip
 * şifresini belirleyince kaydı davetten kuruluyor.
 *
 * Davetler kaydın (`Durum`) parçası değil: hesap işi, planlama kaydına
 * karışmasın; doğrudan Firestore'dan dinleniyor.
 */

const DAVET_DURUM_ADI: Record<Davet["durum"], Anahtar> = { bekliyor: "davetBekliyor", kullanildi: "davetKullanildi", iptal: "davetIptal" };
const DAVET_DURUM_TONU: Record<Davet["durum"], string> = { bekliyor: "uyari", kullanildi: "iyi", iptal: "" };

const BOS_FORM = { eposta: "", adTr: "", adAr: "", adEn: "", birim: "planlama" as Birim, gorev: "planlamaci" as Gorev, rol: "personel" as Rol, hesapYoneticisi: false };

export default function Kullanicilar({ ben }: { ben: Kisi }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [davetler, setDavetler] = useState<Davet[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [form, setForm] = useState(BOS_FORM);
  const [bekle, setBekle] = useState(false);
  const alan = <K extends keyof typeof BOS_FORM>(k: K, deger: (typeof BOS_FORM)[K]) => setForm((f) => ({ ...f, [k]: deger }));

  useEffect(() => {
    let kopar: (() => void) | undefined;
    let bitti = false;
    firebaseYukle().then((f) => {
      if (!bitti) kopar = f.davetleriIzle(setDavetler, setHata);
    });
    return () => {
      bitti = true;
      kopar?.();
    };
  }, []);

  const davetEt = (e: FormEvent) => {
    e.preventDefault();
    const eposta = form.eposta.trim().toLowerCase();
    // Ad üç dilde; boş bırakılan dil öbüründen alınıyor (kişi adı arayüz dilinin yazımıyla okunuyor).
    const tr = form.adTr.trim() || form.adEn.trim() || eposta;
    const adi = { tr, ar: form.adAr.trim() || tr, en: form.adEn.trim() || tr };
    setBekle(true);
    firebaseYukle()
      .then((f) => f.davetEt({ eposta, ad: adi, birim: form.birim, gorev: form.gorev, rol: form.rol, hesapYoneticisi: form.hesapYoneticisi, davetEden: ben.id }, dil))
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

  const kisiler = [...v.kisiler].sort((a, b) => Number(!!a.pasif) - Number(!!b.pasif) || ad(a).localeCompare(ad(b)));

  return (
    <>
      <SayfaBasi ikon={<UserCog size={26} />} baslik={t("mKullanicilar")} alt={t("kullanicilarAlt")} />
      <Kart baslik={t("davetEt")} ikon={<Send size={18} />}>
        <form className="form" onSubmit={davetEt} data-davet-formu>
          <div className="satir">
            <label>
              {t("eposta")}
              <input type="email" dir="ltr" value={form.eposta} onChange={(e) => alan("eposta", e.target.value)} required data-davet-eposta />
            </label>
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
            <label>
              {t("rol")}
              <select value={form.rol} onChange={(e) => alan("rol", e.target.value as Rol)}>
                <option value="personel">{t("rolPersonel")}</option>
                <option value="yonetici">{t("rolYonetici")}</option>
              </select>
            </label>
          </div>
          <label className="secim">
            <input type="checkbox" checked={form.hesapYoneticisi} onChange={(e) => alan("hesapYoneticisi", e.target.checked)} />
            {t("hesapYoneticisi")}
            <span className="ipucu">{t("hesapYoneticisiAciklama")}</span>
          </label>
          <div className="form-alt">
            <button className="dugme" disabled={bekle} data-davet-gonder>
              <Mail size={16} /> {t("davetGonder")}
            </button>
          </div>
        </form>
      </Kart>

      <Kart baslik={t("davetler")} ek={davetler ? String(davetler.length) : undefined}>
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
                  <bdi>{k.eposta}</bdi>
                </td>
                <td data-etiket={t("birim")}>
                  {t(BIRIM_ADI[k.birim])} · {t(GOREV_ADI[k.gorev])}
                </td>
                <td data-etiket={t("durum")}>
                  <Rozet ton={k.pasif ? "" : "iyi"}>{t(k.pasif ? "hesapPasif" : "hesapEtkin")}</Rozet> {k.hesapYoneticisi && <Rozet ton="koyu">{t("hesapYoneticisi")}</Rozet>}
                </td>
                <td className="islem-hucre">
                  {/* Kendi hesabını kapatamıyor, yöneticiliğini bırakamıyor: sistem yöneticisiz kalmasın. */}
                  {k.id !== ben.id && (
                    <>
                      <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => kisiHesabi(ben, k.id, { pasif: !k.pasif })} data-hesap-pasif>
                        {t(k.pasif ? "hesabiAc" : "hesabiKapat")}
                      </button>
                      <button type="button" className="dugme dugme-sade dugme-kucuk" onClick={() => kisiHesabi(ben, k.id, { hesapYoneticisi: !k.hesapYoneticisi })}>
                        {t(k.hesapYoneticisi ? "yoneticiligiKaldir" : "yoneticiYap")}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kart>
    </>
  );
}
