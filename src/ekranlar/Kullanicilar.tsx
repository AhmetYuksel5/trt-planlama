import { BirimSecenekleri, UnvanSecenekleri } from "../bilesenler/BirimSecimi";
import { birimAdi, birimeUygunUnvan, disMuhabirMi, gorevAdi, icMuhabirMi, otomatikMuhabirUnvaniMi, sehirMuhabirUnvaniId, unvandanRol } from "../yapi";
import { AtSign, Copy, Eye, FileSpreadsheet, KeyRound, Link2, Mail, MessageCircle, Plus, RotateCcw, Ticket, Trash2, UserCog, UserPlus, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Avatar, Bos, Pencere, Rozet, bildir } from "../bilesenler/Parcalar";
import { metin, tarihYaz, useDil, oburAd, type Anahtar } from "../dil";
import { hataAnahtari, hataKodu } from "./GercekGiris";
import type { Davet, GirisKodu, KayitBaglantisi } from "../depo/firebase";
import { girisAdi, kodYaz, kullaniciAdiGecerli, kullaniciAdiOner } from "../girisKodu";
import { sehirAdi } from "../etiketler";
import { epostaListesiUygula, hesapsizKisiEkle, sehirEkle, kisiEpostasi, kisiHesabi, kisiSehri, kisiSil, kisiPozisyonu, kisiYetkileri, muhabirleriIceAktar } from "../eylemler";
import { muhabirTaslaklari, xlsxOku, type MuhabirTaslagi } from "../iceAktar";
import { bosAlan, epostaListesiniEslestir, listedenAdresler, type EpostaAlani, type EslesmeSatiri } from "../epostaEslestir";
import { izlemeBaslat } from "../izleme";
import { GERCEK, firebaseYukle } from "../kip";
import { HESAP_YETKILERI, getir, kisiBul, useVeri, type BirimId, type GorevId, type HesapYetkisi, type Kisi, type Sehir } from "../veri";
import { epostaDegistirebilir, hesapYetkisi } from "../yetki";
import { SehirSecenekleri, YENI_SEHIR, YeniSehirAlanlari, bosYeniSehir } from "../bilesenler/SehirSecimi";
import type { YeniSehir } from "../eylemler";
import { git } from "../yol";
import { IslemMenusu } from "../bilesenler/IslemMenusu";

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

const BOS_FORM = {
  eposta: "",
  adTr: "",
  adAr: "",
  adEn: "",
  birim: "planlama" as BirimId,
  gorev: "planlamaci" as GorevId,
  hesapYoneticisi: false,
  telefon: "",
  kullanici: "",
  sehir: "istanbul" as Sehir,
};

const YETKI_ADI: Record<HesapYetkisi, Anahtar> = {
  davet: "hyDavet",
  kayitBaglantisi: "hyKayitBaglantisi",
  kisiDuzenle: "hyKisiDuzenle",
  hesapAcKapa: "hyHesapAcKapa",
  hesapsizKisi: "hyHesapsizKisi",
  kisiSil: "hyKisiSil",
  paketOnayi: "hyPaketOnayi",
  geriAlma: "hyGeriAlma",
  baskaMuhabire: "hyBaskaMuhabire",
  arsivdenCikarma: "hyArsivdenCikarma",
  oneriSilme: "hyOneriSilme",
  muhasebe: "hyMuhasebe",
};

/* Üç yazımlı ad; boş bırakılan dil öbüründen. Ekranda Arapçası okunuyor, Latin yazım arama ve baş harf için. */
const adKur = (tr0: string, ar0: string, en0: string, yedek: string) => {
  const tr = tr0.trim() || en0.trim() || ar0.trim() || yedek;
  return { tr, ar: ar0.trim() || tr, en: en0.trim() || tr };
};

/*
 * Davet kaydı yazılıp e-posta gönderilemezse davet "bekliyor" kalıyor;
 * günlük sınır dolduysa ertesi gün "Yeniden gönder" ile gidiyor.
 */
const gonderimHatasi = (x: unknown) => {
  const kod = hataKodu(x);
  if (kod.startsWith("kod/")) return metin(hataAnahtari(x));
  if (kod === "auth/quota-exceeded") return metin("ghGunlukSinirDavet");
  console.error(x);
  // Tanınan hata kendi mesajıyla (yetki yok, ağ…); tanınmayan kodu yazılı, neden bulunsun.
  const anahtar = hataAnahtari(x);
  return anahtar !== "ghBilinmeyen" ? `${metin("davetGonderilemedi")} ${metin(anahtar)}` : metin("davetGonderilemediKod", undefined, { kod: kod || "?" });
};

/*
 * Hesap işleri Organizasyon › Kişiler'de (kullanıcı: Hesaplar ile Kişiler ayrı
 * iki yerdi, fazlalıktı; aktivasyonu kişinin satırından yapmak istedi). Bu
 * bağlam davetleri ve kayıt bağlantılarını bir kez dinler, pencereleri tutar;
 * Kişiler sekmesi araç çubuğunu (Kişi ekle, ⋯), satırın hesap menüsünü ve
 * henüz kaydı kurulmamış davetlerin satırlarını buradan alır.
 */
interface HesapIsleri {
  davetler: Davet[] | null;
  hata: string | null;
  /** Kişinin bekleyen daveti: "Hesaba bağla" ya da e-posta değişikliği (kisiId'li). */
  davetiOf: (k: Kisi) => Davet | undefined;
  /** Kaydı henüz kurulmamış bekleyen davetler (yeni kişi davet ya da kodla). */
  bekleyenDavetler: Davet[];
  ac: (p: Acik) => void;
}
type Acik =
  | { tur: "ekle" }
  | { tur: "baglantilar" }
  | { tur: "aktar" }
  | { tur: "eslestir" }
  | { tur: "duzenle" | "bagla" | "yeniKod" | "yetkiler"; kisi: Kisi }
  | { tur: "kod"; sonuc: KodSonucu };

const HesapBaglami = createContext<HesapIsleri | null>(null);
export const useHesapIsleri = () => useContext(HesapBaglami);

/* Hesap işi yapan yetkiler (davet, bağlantı, düzenleme, kapatma, hesapsız kişi, silme). */
const HESAP_ISLERI: HesapYetkisi[] = ["davet", "kayitBaglantisi", "kisiDuzenle", "hesapAcKapa", "hesapsizKisi", "kisiSil"];
export const hesapIsiVar = (ben: Kisi) => GERCEK && (!!ben.hesapYoneticisi || HESAP_ISLERI.some((y) => hesapYetkisi(ben, y)));

export function HesapIsleriSaglayici({ ben, children }: { ben: Kisi; children: ReactNode }) {
  const v = useVeri();
  const davetYetkisi = GERCEK && hesapYetkisi(ben, "davet");
  const [davetler, setDavetler] = useState<Davet[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [acik, setAcik] = useState<Acik | null>(null);

  // Yalnız yetkisi olan dinliyor: kurallar öbürüne okutmuyor, boşuna hata vermesin.
  useEffect(() => {
    if (!davetYetkisi) return;
    let kopar: (() => void) | undefined;
    let bitti = false;
    firebaseYukle().then((f) => {
      if (!bitti) kopar = f.davetleriIzle(setDavetler, setHata);
    });
    return () => {
      bitti = true;
      kopar?.();
    };
  }, [davetYetkisi]);

  const bekleyen = (davetler ?? []).filter((d) => d.durum === "bekliyor");
  const deger: HesapIsleri = {
    davetler,
    hata,
    davetiOf: (k) => bekleyen.find((d) => d.kisiId === k.id),
    // Kaydı kurulmuş (kişisi olan) davet kişinin kendi satırında görünüyor.
    bekleyenDavetler: bekleyen.filter((d) => !d.kisiId && !v.kisiler.some((k) => k.eposta === d.eposta)),
    ac: setAcik,
  };
  const alinmis = alinmisKullanicilar(v.kisiler, davetler);
  // Kod veren pencere önce kodu açtırıp sonra kendini kapatıyor: kapanış açılan kod penceresini silmesin.
  const kapat = () => setAcik((a) => (a?.tur === "kod" ? a : null));
  const kodVerildi = (sonuc: KodSonucu) => setAcik({ tur: "kod", sonuc });
  return (
    <HesapBaglami.Provider value={deger}>
      {children}
      {acik?.tur === "ekle" && <KisiEklePenceresi ben={ben} alinmis={alinmis} kodVerildi={kodVerildi} kapat={kapat} />}
      {acik?.tur === "baglantilar" && <BaglantilarPenceresi ben={ben} kapat={kapat} />}
      {acik?.tur === "aktar" && <AktarPenceresi ben={ben} kapat={kapat} />}
      {acik?.tur === "eslestir" && <EslestirPenceresi ben={ben} kapat={kapat} />}
      {acik?.tur === "duzenle" && <PozisyonPenceresi ben={ben} kisi={kisiBul(v, acik.kisi.id) ?? acik.kisi} kapat={kapat} />}
      {acik?.tur === "bagla" && <BaglaPenceresi ben={ben} kisi={acik.kisi} alinmis={alinmis} kodVerildi={kodVerildi} kapat={kapat} />}
      {acik?.tur === "yeniKod" && <YeniKodPenceresi ben={ben} kisi={acik.kisi} alinmis={alinmis} kodVerildi={kodVerildi} kapat={kapat} />}
      {acik?.tur === "yetkiler" && <YetkiPenceresi ben={ben} kisi={kisiBul(v, acik.kisi.id) ?? acik.kisi} kapat={kapat} />}
      {acik?.tur === "kod" && <KodPenceresi sonuc={acik.sonuc} kapat={() => setAcik(null)} />}
    </HesapBaglami.Provider>
  );
}

/* Kişinin hesap durumu: satırın tonu ve süzgeçler bundan. */
export type HesapDurumu = "etkin" | "yok" | "bekliyor" | "pasif";
export const hesapDurumu = (k: Kisi, davet?: Davet): HesapDurumu =>
  k.pasif ? "pasif" : k.yeniEposta || davet ? "bekliyor" : k.hesapsiz ? "yok" : "etkin";

export function HesapRozeti({ durum }: { durum: HesapDurumu }) {
  const { t } = useDil();
  if (durum === "etkin") return null;
  return (
    <span data-hesap-durumu={durum}>
      <Rozet ton={durum === "bekliyor" ? "uyari" : ""}>{t(durum === "yok" ? "hesapYok" : durum === "pasif" ? "hesapPasif" : "aktivasyonBekleniyor")}</Rozet>
    </span>
  );
}

/* Kişiler'in başındaki araçlar: "Kişi ekle" ve az kullanılanlar ⋯'de. */
export function HesapAraclari({ ben }: { ben: Kisi }) {
  const { t } = useDil();
  const h = useHesapIsleri();
  if (!h) return null;
  const ekle = GERCEK && (hesapYetkisi(ben, "davet") || hesapYetkisi(ben, "hesapsizKisi"));
  const aktar = GERCEK && hesapYetkisi(ben, "hesapsizKisi");
  const eslestir = hesapYetkisi(ben, "kisiDuzenle");
  const baglanti = GERCEK && hesapYetkisi(ben, "kayitBaglantisi");
  return (
    <>
      {ekle && (
        <button type="button" className="dugme dugme-kucuk" onClick={() => h.ac({ tur: "ekle" })} data-kisi-ekle-ac>
          <UserPlus size={14} /> {t("kisiEkle")}
        </button>
      )}
      {(aktar || eslestir || baglanti) && (
        <IslemMenusu etiket={t("digerIslemler")} dugmeSinifi="dugme dugme-ikincil dugme-kucuk dugme-ikon" menuSinifi="plan-menusu" katman>
          {aktar && (
            <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "aktar" })} data-excel-aktar>
              <FileSpreadsheet size={16} /> {t("excelAktar")}
            </button>
          )}
          {eslestir && (
            <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "eslestir" })} data-eposta-eslestir>
              <AtSign size={16} /> {t("epostaEslestir")}
            </button>
          )}
          {baglanti && (
            <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "baglantilar" })} data-kayit-baglantilari-ac>
              <Link2 size={16} /> {t("kayitBaglantilari")}
            </button>
          )}
        </IslemMenusu>
      )}
    </>
  );
}

/* Davetin işleri: kodu göster, yeni kod ya da yeniden gönder, iptal. Kişinin menüsünde ve davet satırında aynı. */
function DavetMaddeleri({ davet: d }: { davet: Davet }) {
  const { t, ad, dil } = useDil();
  const h = useHesapIsleri()!;
  const yenidenGonder = () =>
    firebaseYukle()
      .then((f) => f.baglantiGonder(d.eposta, dil))
      .then(() => bildir(t("davetGonderildi", { eposta: d.eposta })))
      .catch((x) => bildir(gonderimHatasi(x)));
  const kodYenile = () =>
    firebaseYukle()
      .then((f) => f.kodYenile(d.eposta))
      .then((k) => h.ac({ tur: "kod", sonuc: { ...k, ad: ad({ ad: d.ad }) } }))
      .catch((x) => bildir(gonderimHatasi(x)));
  const iptal = () => confirm(t("davetiIptalEt") + "?") && firebaseYukle().then((f) => f.davetIptal(d.eposta));
  return (
    <>
      {d.kod ? (
        <>
          {!!d.bitis && Date.now() < d.bitis && (
            <button
              type="button"
              role="menuitem"
              className="acilir-satir"
              onClick={() => h.ac({ tur: "kod", sonuc: { kod: d.kod!, kullanici: d.kullanici ?? girisAdi(d.eposta), eposta: d.eposta, bitis: d.bitis!, ad: ad({ ad: d.ad }) } })}
              data-kod-goster
            >
              <Ticket size={16} /> {t("koduGoster")}
            </button>
          )}
          <button type="button" role="menuitem" className="acilir-satir" onClick={kodYenile} data-kod-yenile>
            <RotateCcw size={16} /> {t("yeniKodVer")}
          </button>
        </>
      ) : (
        <button type="button" role="menuitem" className="acilir-satir" onClick={yenidenGonder} data-davet-yeniden>
          <RotateCcw size={16} /> {t("yenidenGonder")}
        </button>
      )}
      <button type="button" role="menuitem" className="acilir-satir" onClick={iptal} data-davet-iptal>
        <X size={16} /> {t("davetiIptalEt")}
      </button>
    </>
  );
}

/* Kişinin satırındaki hesap menüsü: yalnız yetkisi olan maddeler; hiçbiri yoksa çizilmez. */
export function KisiHesapMenusu({ ben, kisi: k }: { ben: Kisi; kisi: Kisi }) {
  const { t, ad } = useDil();
  const h = useHesapIsleri();
  if (!h || !GERCEK) return null;
  const davetYetkisi = hesapYetkisi(ben, "davet");
  const davet = davetYetkisi ? h.davetiOf(k) : undefined;
  // Şifresini unutan kod hesabına yeni kod: e-postayla sıfırlama yok (adres posta almıyor).
  const yeniKod = !!girisAdi(k.eposta) && davetYetkisi && epostaDegistirebilir(ben, k) && k.id !== ben.id && !k.pasif;
  const bagla = k.hesapsiz && davetYetkisi && !davet;
  // Şifre yenileme: e-postalı (kod hesabı değil), açık hesap; yönetici ve yetkilinin hesabına
  // yalnız tam yönetici (adres değiştirmeyle aynı kural, epostaDegistirebilir).
  const sifreYenile = !k.hesapsiz && !k.pasif && !!k.eposta && !girisAdi(k.eposta) && (k.id === ben.id || (davetYetkisi && epostaDegistirebilir(ben, k)));
  // Kendi hesabını kapatamıyor, yetkisini bırakamıyor: sistem yöneticisiz kalmasın.
  const kapatabilir = k.id !== ben.id && !k.hesapsiz && (!!ben.hesapYoneticisi || (hesapYetkisi(ben, "hesapAcKapa") && !k.hesapYoneticisi));
  const yetkiler = !!ben.hesapYoneticisi && k.id !== ben.id && !k.hesapsiz;
  const silebilir = k.id !== ben.id && (!!ben.hesapYoneticisi || (hesapYetkisi(ben, "kisiSil") && !k.hesapYoneticisi));
  if (!davet && !yeniKod && !bagla && !sifreYenile && !kapatabilir && !yetkiler && !silebilir) return null;
  return (
    <IslemMenusu etiket={t("hesapIslemleri", { ad: ad(k) })} dugmeSinifi="dugme dugme-sade dugme-kucuk dugme-ikon" menuSinifi="plan-menusu" katman>
      {bagla && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "bagla", kisi: k })} data-hesaba-bagla>
          <Mail size={16} /> {t("hesabaBagla")}
        </button>
      )}
      {davet && <DavetMaddeleri davet={davet} />}
      {yeniKod && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "yeniKod", kisi: k })} data-yeni-kod>
          <Ticket size={16} /> {t("yeniKodVer")}
        </button>
      )}
      {sifreYenile && (
        <button
          type="button"
          role="menuitem"
          className="acilir-satir"
          onClick={() => {
            if (!confirm(t("sifreYenileSoru", { eposta: k.eposta! }))) return;
            firebaseYukle()
              .then((f) => f.sifreYenilemeGonder(k.eposta!))
              .then(() => bildir(t("sifreYenileGitti", { eposta: k.eposta! })))
              .catch((x) => bildir(gonderimHatasi(x)));
          }}
          data-sifre-yenile
        >
          <RotateCcw size={16} /> {t("sifreYenile")}
        </button>
      )}
      {yetkiler && (
        <button type="button" role="menuitem" className="acilir-satir" onClick={() => h.ac({ tur: "yetkiler", kisi: k })} data-yetkiler>
          <KeyRound size={16} /> {t("yetkiler")}
          {!!k.yetkiler?.length && ` · ${k.yetkiler.length}`}
        </button>
      )}
      {kapatabilir && (
        <button
          type="button"
          role="menuitem"
          className="acilir-satir"
          onClick={() => confirm(t(k.pasif ? "hesabiAc" : "hesabiKapat") + "?") && kisiHesabi(ben, k.id, { pasif: !k.pasif })}
          data-hesap-pasif
        >
          <UserCog size={16} /> {t(k.pasif ? "hesabiAc" : "hesabiKapat")}
        </button>
      )}
      {silebilir && (
        <button
          type="button"
          role="menuitem"
          className="acilir-satir kotu-yazi"
          onClick={() => {
            if (!confirm(t("kisiSilinsinMi", { ad: ad(k) })) || !kisiSil(ben, k.id)) return;
            bildir(t("kisiSilindi", { ad: ad(k) }));
            void firebaseYukle().then((f) => f.kisiIzleriniTemizle(k));
          }}
          data-kisi-sil
        >
          <Trash2 size={16} /> {t("kisiSil")}
        </button>
      )}
    </IslemMenusu>
  );
}

/* Kaydı henüz kurulmamış davetin satırı: kişinin birimindeki yerinde, sarı tonda. */
export function DavetSatiri({ davet: d, yer }: { davet: Davet; yer?: boolean }) {
  const { t, ad } = useDil();
  const adi = ad({ ad: d.ad });
  return (
    <li className="hesap-bekliyor" data-davet={d.eposta}>
      <Avatar kisi={{ id: d.eposta, ad: d.ad } as Kisi} boy="kucuk" />
      <div className="ad">
        <span>{adi}</span>
        {yer && (
          <small className="sonuk-yazi">
            {birimAdi(d.birim)} › {gorevAdi(d.gorev)}
          </small>
        )}
        <small>
          <HesapRozeti durum="bekliyor" /> {d.kod ? <KullaniciAdi eposta={d.eposta} /> : <bdi className="soluk">{d.eposta}</bdi>}
        </small>
      </div>
      <IslemMenusu etiket={t("hesapIslemleri", { ad: adi })} dugmeSinifi="dugme dugme-sade dugme-kucuk dugme-ikon" menuSinifi="plan-menusu" katman>
        <DavetMaddeleri davet={d} />
      </IslemMenusu>
    </li>
  );
}

/* Kişi ekleme: davet, giriş kodu ya da hesapsız kişi; önce sayfanın kartıydı, şimdi Kişiler'in "Kişi ekle"sinden pencere. */
function KisiEklePenceresi({ ben, alinmis, kodVerildi, kapat }: { ben: Kisi; alinmis: Set<string>; kodVerildi: (k: KodSonucu) => void; kapat: () => void }) {
  const { t, dil } = useDil();
  const davetYetkisi = hesapYetkisi(ben, "davet");
  const hesapsizYetkisi = hesapYetkisi(ben, "hesapsizKisi");
  const [tur, setTur] = useState<"davet" | "kod" | "hesapsiz">(davetYetkisi ? "davet" : "hesapsiz");
  const [form, setForm] = useState(BOS_FORM);
  const [bekle, setBekle] = useState(false);
  const [yeniSehir, setYeniSehir] = useState<YeniSehir | null>(null);
  const alan = <K extends keyof typeof BOS_FORM>(k: K, deger: (typeof BOS_FORM)[K]) => setForm((f) => ({ ...f, [k]: deger }));
  // Dış muhabirin ünvanı seçilmiyor, şehrinden ("<Şehir> muhabiri"; Düzenle penceresindeki gibi).
  const disMuhabir = disMuhabirMi({ birim: form.birim });
  // Kayıtlı yapıda başlangıç görevi birimde yoksa formda görünen (birimin ilk ünvanı) gönderilsin.
  const gorev = disMuhabir ? sehirMuhabirUnvaniId(form.sehir) : birimeUygunUnvan(form.birim, form.gorev);
  // Yeni şehir önce kayda girer, kişi (ya da davet) onun kimliğiyle kurulur.
  const sehirKur = (): Sehir | null => (!disMuhabir ? form.sehir : yeniSehir ? sehirEkle(ben, yeniSehir) : form.sehir);
  const kodOnerisi = kullaniciAdiOner(form.adTr || form.adEn, alinmis);
  const hesapsizTur = tur === "hesapsiz";
  const kodTur = tur === "kod";

  const ekle = (e: FormEvent) => {
    e.preventDefault();
    if (!confirm(t("eminMisin"))) return;
    const eposta = form.eposta.trim().toLowerCase();
    const adi = adKur(form.adTr, form.adAr, form.adEn, eposta);
    const sehir = sehirKur();
    if (!sehir) return;
    const g = disMuhabir ? sehirMuhabirUnvaniId(sehir) : gorev;
    const sehirli = disMuhabir ? { sehir } : {};
    if (hesapsizTur) {
      if (hesapsizKisiEkle(ben, { ad: adi, birim: form.birim, gorev: g, eposta, telefon: form.telefon, ...sehirli })) {
        bildir(t("hesapsizEklendi", { ad: adi.tr }));
        kapat();
      }
      return;
    }
    if (kodTur) {
      const kullanici = form.kullanici.trim().toLowerCase() || kodOnerisi;
      if (!kullaniciAdiGecerli(kullanici) || alinmis.has(kullanici)) return bildir(t(alinmis.has(kullanici) ? "kodKullaniciVar" : "kullaniciAdiGecersiz"));
      setBekle(true);
      firebaseYukle()
        .then((f) => f.kodlaDavetEt({ kullanici, ad: adi, birim: form.birim, gorev: g, rol: unvandanRol(g), ...sehirli, hesapYoneticisi: ben.hesapYoneticisi ? form.hesapYoneticisi : false, davetEden: ben.id }))
        .then((k) => kodVerildi({ ...k, ad: adi.ar }))
        .catch((x) => {
          bildir(gonderimHatasi(x));
          setBekle(false);
        });
      return;
    }
    setBekle(true);
    firebaseYukle()
      .then((f) => f.davetEt({ eposta, ad: adi, birim: form.birim, gorev: g, rol: unvandanRol(g), ...sehirli, hesapYoneticisi: ben.hesapYoneticisi ? form.hesapYoneticisi : false, davetEden: ben.id }, dil))
      .then(() => {
        bildir(t("davetGonderildi", { eposta }));
        kapat();
      })
      .catch((x) => {
        bildir(gonderimHatasi(x));
        setBekle(false);
      });
  };

  return (
    <Pencere baslik={t("kisiEkle")} kapat={kapat}>
      <form className="form" onSubmit={ekle} data-davet-formu>
        {davetYetkisi && (
          <div className="sekmeler" role="tablist" aria-label={t("kisiEkle")}>
            <button type="button" role="tab" aria-selected={tur === "davet"} className={tur === "davet" ? "acik" : ""} onClick={() => setTur("davet")} data-tur-davet>
              {t("davetEt")}
            </button>
            <button type="button" role="tab" aria-selected={kodTur} className={kodTur ? "acik" : ""} onClick={() => setTur("kod")} data-tur-kod>
              {t("girisKodu")}
            </button>
            {hesapsizYetkisi && (
              <button type="button" role="tab" aria-selected={hesapsizTur} className={hesapsizTur ? "acik" : ""} onClick={() => setTur("hesapsiz")} data-tur-hesapsiz>
                {t("hesapsizKisi")}
              </button>
            )}
          </div>
        )}
        {kodTur ? (
          <label>
            {t("kullaniciAdi")}
            <input dir="ltr" autoCapitalize="none" spellCheck={false} value={form.kullanici} placeholder={kodOnerisi} onChange={(e) => alan("kullanici", e.target.value.toLowerCase())} data-kod-kullanici-adi />
          </label>
        ) : (
          <label>
            {t("eposta")}
            <input type="email" dir="ltr" value={form.eposta} onChange={(e) => alan("eposta", e.target.value)} required={!hesapsizTur} data-davet-eposta />
          </label>
        )}
        {hesapsizTur && (
          <label>
            {t("telefon")}
            <input type="tel" dir="ltr" value={form.telefon} onChange={(e) => alan("telefon", e.target.value)} data-hesapsiz-telefon />
          </label>
        )}
        {/* Ad her arayüz dilinde Arapça görünüyor, o yüzden zorunlu ve önde; Latin yazımlar aramada ve baş harfte. */}
        <label>
          {t("adArapca")}
          <input dir="rtl" lang="ar" value={form.adAr} onChange={(e) => alan("adAr", e.target.value)} required data-davet-ad-ar />
        </label>
        <label>
          {t("adTurkce")}
          <input value={form.adTr} onChange={(e) => alan("adTr", e.target.value)} data-davet-ad />
        </label>
        <label>
          {t("adIngilizce")}
          <input dir="ltr" value={form.adEn} onChange={(e) => alan("adEn", e.target.value)} />
        </label>
        <label>
          {t("birim")}
          <select value={form.birim} onChange={(e) => setForm((f) => ({ ...f, birim: e.target.value, gorev: birimeUygunUnvan(e.target.value, f.gorev) }))} data-davet-birim>
            <BirimSecenekleri />
          </select>
        </label>
        {disMuhabir ? (
          <label>
            {t("sehir")}
            <select
              value={yeniSehir ? YENI_SEHIR : form.sehir}
              data-davet-sehir
              onChange={(e) => {
                if (e.target.value === YENI_SEHIR) setYeniSehir(bosYeniSehir(form.sehir));
                else {
                  setYeniSehir(null);
                  alan("sehir", e.target.value);
                }
              }}
            >
              <SehirSecenekleri />
            </select>
            {!yeniSehir && <small data-davet-unvan>{gorevAdi(gorev)}</small>}
          </label>
        ) : (
          <label>
            {t("gorev")}
            <select value={gorev} onChange={(e) => alan("gorev", e.target.value)} data-davet-gorev>
              <UnvanSecenekleri birim={form.birim} />
            </select>
          </label>
        )}
        {disMuhabir && yeniSehir && <YeniSehirAlanlari yeni={yeniSehir} degistir={setYeniSehir} />}
        {/* Yöneticilik yalnız tam yöneticiden: davet yetkisi olan yönetici davet edemiyor (kurallar da). */}
        {!hesapsizTur && ben.hesapYoneticisi && (
          <label className="secim">
            <input type="checkbox" checked={form.hesapYoneticisi} onChange={(e) => alan("hesapYoneticisi", e.target.checked)} />
            {t("hesapYoneticisi")}
          </label>
        )}
        <div className="form-alt">
          {hesapsizTur ? (
            <button className="dugme" disabled={!gorev || (!!yeniSehir && !yeniSehir.ar.trim())} data-hesapsiz-ekle>
              <UserPlus size={16} /> {t("hesapsizKisiEkle")}
            </button>
          ) : kodTur ? (
            <button className="dugme" disabled={bekle || !gorev || (!!yeniSehir && !yeniSehir.ar.trim())} data-kod-olustur>
              <Ticket size={16} /> {t("kodOlustur")}
            </button>
          ) : (
            <button className="dugme" disabled={bekle || !gorev || (!!yeniSehir && !yeniSehir.ar.trim())} data-davet-gonder>
              <Mail size={16} /> {t("davetGonder")}
            </button>
          )}
        </div>
      </form>
    </Pencere>
  );
}

/* Paylaşılabilir kayıt bağlantıları (KayitSayfasi): yalnız geçerliler listede. */
function BaglantilarPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const [baglantilar, setBaglantilar] = useState<KayitBaglantisi[] | null>(null);
  useEffect(() => {
    let kopar: (() => void) | undefined;
    let bitti = false;
    firebaseYukle().then((f) => {
      if (!bitti) kopar = f.kayitBaglantilariIzle(setBaglantilar, () => setBaglantilar([]));
    });
    return () => {
      bitti = true;
      kopar?.();
    };
  }, []);
  const kopyala = (kod: string) =>
    firebaseYukle()
      .then((f) => navigator.clipboard.writeText(f.kayitAdresi(kod)))
      .then(() => bildir(t("bKopyalandi")))
      .catch(() => bildir(t("kopyalanamadi")));
  const baglantiAc = () =>
    firebaseYukle()
      .then((f) => f.kayitBaglantisiOlustur(ben.id))
      .then((b) => kopyala(b.kod))
      .catch((x) => {
        console.error(x);
        bildir(t("ghBilinmeyen"));
      });
  const baglantiKapat = (kod: string) => firebaseYukle().then((f) => f.kayitBaglantisiKapat(kod));
  const acikBaglantilar = (baglantilar ?? []).filter((b) => b.acik && Date.now() < b.bitis);
  return (
    <Pencere
      baslik={t("kayitBaglantilari")}
      kapat={kapat}
      altBilgi={
        <button type="button" className="dugme" onClick={baglantiAc} data-kayit-baglantisi-ac>
          <Plus size={16} /> {t("yeniKayitBaglantisi")}
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
    </Pencere>
  );
}

/**
 * Kişinin ekranını onun gözüyle, yalnız bakarak açar (izleme.ts). Yalnız tam
 * yönetici; kendini izlemek anlamsız.
 */
export function IzleDugmesi({ ben, kisi }: { ben: Kisi; kisi: Kisi }) {
  const { t, ad } = useDil();
  if (!ben.hesapYoneticisi || kisi.id === ben.id) return null;
  const etiket = t("kisininEkraniniIzle", { ad: ad(kisi) });
  return (
    <button
      type="button"
      className="dugme dugme-sade dugme-ikon"
      onClick={() => {
        izlemeBaslat(kisi.id);
        git("ana");
      }}
      title={etiket}
      aria-label={etiket}
      data-izle={kisi.id}
    >
      <Eye size={16} />
    </button>
  );
}

/*
 * Kurumun muhabir listesini (Excel) hesapsız muhabir olarak alır. Dosya
 * tarayıcıda okunuyor, sunucuya ya da depoya gitmiyor; önce önizleme,
 * onayla tek yazışta kayda.
 */
function AktarPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t } = useDil();
  const v = useVeri();
  const [liste, setListe] = useState<MuhabirTaslagi[] | null>(null);
  const [hata, setHata] = useState(false);
  const [bekle, setBekle] = useState(false);
  const sec = async (dosya?: File) => {
    if (!dosya) return;
    setHata(false);
    setBekle(true);
    try {
      const l = muhabirTaslaklari(await xlsxOku(await dosya.arrayBuffer()));
      setListe(l);
      if (!l.length) setHata(true);
    } catch (e) {
      console.error(e);
      setHata(true);
      setListe(null);
    } finally {
      setBekle(false);
    }
  };
  // Önizlemede kayıtlı olanlar işaretli; eylem de aynı ölçüyle atlıyor.
  const epostalar = new Set(v.kisiler.flatMap((k) => [k.eposta, k.kisiselEposta ?? ""]).filter(Boolean).map((e) => e.toLowerCase()));
  const adlar = new Set(v.kisiler.map((k) => (typeof k.ad === "string" ? k.ad : k.ad.ar).trim()));
  const kayitli = (m: MuhabirTaslagi) => (!!m.eposta && epostalar.has(m.eposta)) || (!!m.kisiselEposta && epostalar.has(m.kisiselEposta)) || adlar.has(m.adAr.trim());
  const yeni = (liste ?? []).filter((m) => !kayitli(m));
  const taninmayan = (liste ?? []).filter((m) => m.taninmadi);
  const ekle = () => {
    const r = muhabirleriIceAktar(ben, liste ?? []);
    if (r) {
      bildir(t("aktarSonuc", { n: String(r.eklenen), atlanan: String(r.atlanan) }));
      kapat();
    }
  };
  return (
    <Pencere baslik={t("excelAktar")} kapat={kapat} genis>
      <div className="form" data-aktar-penceresi>
        <label>
          {t("aktarDosya")}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => sec(e.target.files?.[0])} data-aktar-dosya />
        </label>
        {bekle && <p>{t("yukleniyor")}</p>}
        {hata && <p className="not-kutu uyari">{t("aktarOkunamadi")}</p>}
        {liste && liste.length > 0 && (
          <>
            <p data-aktar-ozet>{t("aktarOzet", { n: String(liste.length), yeni: String(yeni.length), kayitli: String(liste.length - yeni.length) })}</p>
            {taninmayan.length > 0 && (
              <p className="not-kutu uyari" data-aktar-taninmayan>
                {t("aktarTaninmayan", { liste: taninmayan.map((m) => m.konum || "—").join(", ") })}
              </p>
            )}
            <div className="tablo-sar">
              <table className="tablo kartli">
                <thead>
                  <tr>
                    <th>{t("ad")}</th>
                    <th>{t("konum")}</th>
                    <th>{t("telefon")}</th>
                    <th>{t("eposta")}</th>
                    <th>{t("durum")}</th>
                  </tr>
                </thead>
                <tbody>
                  {liste.map((m, i) => (
                    <tr key={i} data-aktar-satir>
                      <td className="birincil">
                        <bdi>{m.adAr}</bdi>
                        <small className="sonuk ince">
                          <bdi>{m.adLatin}</bdi>
                        </small>
                      </td>
                      <td data-etiket={t("konum")}>
                        {sehirAdi(m.sehir)}
                        {m.taninmadi && <small className="sonuk"> · {m.konum}</small>}
                      </td>
                      <td data-etiket={t("telefon")}>
                        <bdi>{m.telefon || "—"}</bdi>
                      </td>
                      <td data-etiket={t("eposta")}>
                        <bdi>{m.eposta || "—"}</bdi>
                      </td>
                      <td data-etiket={t("durum")}>{kayitli(m) ? <Rozet>{t("aktarKayitli")}</Rozet> : <Rozet ton="iyi">{t("aktarYeni")}</Rozet>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={!yeni.length} onClick={ekle} data-aktar-ekle>
            <FileSpreadsheet size={14} /> {t("aktarEkle", { n: String(yeni.length) })}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

/*
 * Yapıştırılan e-posta listesini muhabirlerle eşleştirir (epostaEslestir.ts):
 * çağrının CC'sindeki adresler teker teker girilmesin. Önizlemede her satırın
 * kişisi ve alanı değişir; kesin olmayan işaretsiz gelir, kişisi seçilince
 * işaretlenir. Kayıt onayla (eylemler.ts → epostaListesiUygula). Hesabı açık
 * kişide kurumsal alan giriş adresi, seçilemez. Hesaplar'da ve Dış muhabirler
 * sayfasında (demoda Hesaplar yok; asıl yeri muhabir listesi).
 */
type EslestirSatiri = EslesmeSatiri & { sec: boolean };

export function EslestirPenceresi({ ben, kapat }: { ben: Kisi; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const v = useVeri();
  const [metin, setMetin] = useState("");
  const [satirlar, setSatirlar] = useState<EslestirSatiri[] | null>(null);
  const kurumsalYazilir = (k: Kisi) => !GERCEK || !!k.hesapsiz;
  const muhabirler = v.kisiler.filter((k) => !k.pasif && (k.birim === "muhabir" || icMuhabirMi(k))).sort((a, b) => ad(a).localeCompare(ad(b)));
  // Eşleşen adayın iki yazımı: ad arayüzün dilinde, yanında öbürü (aynı ad iki kişide olabilir).
  const ikiYazim = (k: Kisi) => [ad(k), oburAd(k.ad, dil)].filter(Boolean).join(" · ");
  const kisi = (id?: string) => v.kisiler.find((k) => k.id === id);
  const eslestir = () =>
    setSatirlar(
      epostaListesiniEslestir(listedenAdresler(metin), muhabirler, v.kisiler, kurumsalYazilir).map((s) => ({ ...s, sec: s.durum === "eslesti" })),
    );
  const degistir = (i: number, yeni: Partial<EslestirSatiri>) => setSatirlar((l) => l && l.map((s, j) => (j === i ? { ...s, ...yeni } : s)));
  const kisiSec = (i: number, kisiId: string) => {
    const k = kisi(kisiId);
    degistir(i, { kisiId: kisiId || undefined, alan: k ? (bosAlan(k, kurumsalYazilir(k)) ?? "kisiselEposta") : undefined, sec: !!k });
  };
  const sayi = (d: EslesmeSatiri["durum"]) => (satirlar ?? []).filter((s) => s.durum === d).length;
  const kaydedilecek = (satirlar ?? []).filter((s) => s.sec && s.kisiId && s.alan && s.durum !== "kayitli");
  const kaydet = () => {
    const r = epostaListesiUygula(
      ben,
      kaydedilecek.map((s) => ({ kisiId: s.kisiId!, adres: s.adres, alan: s.alan! })),
    );
    if (!r) return;
    bildir(t("eslestirSonuc", { n: String(r.yazilan), a: String(r.atlanan) }));
    kapat();
  };
  const durumRozeti = (s: EslestirSatiri) =>
    s.durum === "kayitli" ? (
      <Rozet>{t("eslestirKayitli")}</Rozet>
    ) : s.durum === "eslesti" ? (
      <Rozet ton="iyi">{t("eslestirEslesti")}</Rozet>
    ) : s.durum === "dolu" ? (
      <Rozet ton="uyari">{t("eslestirDolu")}</Rozet>
    ) : s.durum === "belirsiz" ? (
      <Rozet ton="uyari">{t("eslestirSecilecek")}</Rozet>
    ) : (
      <Rozet ton="kotu">{t("eslestirBulunamadi")}</Rozet>
    );
  return (
    <Pencere baslik={t("epostaEslestir")} kapat={kapat} genis>
      <div className="form" data-eslestir-penceresi>
        <textarea dir="ltr" rows={4} value={metin} onChange={(e) => setMetin(e.target.value)} placeholder="ad.soyad@ornek.com, ad2@ornek.com" data-eslestir-metin />
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" disabled={!listedenAdresler(metin).length} onClick={eslestir} data-eslestir-dugme>
            <AtSign size={14} /> {t("eslestirDugme")}
          </button>
        </div>
        {satirlar && (
          <>
            <p data-eslestir-ozet>
              {t("eslestirOzet", {
                n: String(satirlar.length),
                e: String(sayi("eslesti")),
                b: String(sayi("belirsiz") + sayi("dolu")),
                y: String(sayi("bulunamadi")),
                k: String(sayi("kayitli")),
              })}
            </p>
            <div className="tablo-sar">
              <table className="tablo kartli">
                <thead>
                  <tr>
                    <th aria-label={t("kaydet")} />
                    <th>{t("eposta")}</th>
                    <th>{t("muhabir")}</th>
                    <th>{t("eslestirAlan")}</th>
                    <th>{t("durum")}</th>
                  </tr>
                </thead>
                <tbody>
                  {satirlar.map((s, i) => {
                    const k = kisi(s.kisiId);
                    // Önce uyan adaylar, sonra bütün muhabirler.
                    const adayKisiler = s.adaylar.map((id) => kisi(id)).filter((x): x is Kisi => !!x);
                    return (
                      <tr key={s.adres} data-eslestir-satir={s.adres}>
                        <td data-etiket={t("kaydet")}>
                          {s.durum !== "kayitli" && (
                            <input type="checkbox" checked={s.sec} disabled={!s.kisiId || !s.alan} onChange={(e) => degistir(i, { sec: e.target.checked })} aria-label={t("kaydet")} data-eslestir-sec />
                          )}
                        </td>
                        <td className="birincil">
                          <bdi dir="ltr">{s.adres}</bdi>
                        </td>
                        <td data-etiket={t("muhabir")}>
                          {s.durum === "kayitli" ? (
                            <bdi>{k ? ad(k) : "—"}</bdi>
                          ) : (
                            <select value={s.kisiId ?? ""} onChange={(e) => kisiSec(i, e.target.value)} data-eslestir-kisi>
                              <option value="">{t("eslestirAtla")}</option>
                              {adayKisiler.length > 0 && (
                                <optgroup label={t("eslestirAdaylar")}>
                                  {adayKisiler.map((x) => (
                                    <option key={x.id} value={x.id}>
                                      {ikiYazim(x)}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label={t("muhabir")}>
                                {muhabirler.map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {ikiYazim(x)}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                        </td>
                        <td data-etiket={t("eslestirAlan")}>
                          {s.durum !== "kayitli" && k && (
                            <>
                              <select value={s.alan ?? ""} onChange={(e) => degistir(i, { alan: e.target.value as EpostaAlani })} data-eslestir-alan>
                                <option value="eposta" disabled={!kurumsalYazilir(k)}>
                                  {t("kurumsalEposta")}
                                </option>
                                <option value="kisiselEposta">{t("kisiselEposta")}</option>
                              </select>
                              {s.alan && k[s.alan] && (
                                <small className="sonuk ince">
                                  {t("eslestirYerine")} <bdi dir="ltr">{k[s.alan]}</bdi>
                                </small>
                              )}
                            </>
                          )}
                        </td>
                        <td data-etiket={t("durum")}>{durumRozeti(s)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={!kaydedilecek.length} onClick={kaydet} data-eslestir-kaydet>
            {t("eslestirKaydet", { n: String(kaydedilecek.length) })}
          </button>
        </div>
      </div>
    </Pencere>
  );
}

/* Hesapsız kişiyi davet eder ya da giriş kodu verir; etkinleşince kaydı ve geçmişi hesabına geçer (davetteki kisiId). */
function BaglaPenceresi({ ben, kisi, alinmis, kodVerildi, kapat }: { ben: Kisi; kisi: Kisi; alinmis: Set<string>; kodVerildi: (k: KodSonucu) => void; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const [kodla, setKodla] = useState(false);
  const [eposta, setEposta] = useState(kisi.eposta);
  const adi = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
  const oneri = kullaniciAdiOner(adi.tr || adi.en, alinmis);
  const [kullanici, setKullanici] = useState("");
  const [bekle, setBekle] = useState(false);
  const gonder = (e: FormEvent) => {
    e.preventDefault();
    const ka = kullanici.trim().toLowerCase() || oneri;
    if (kodla && (!kullaniciAdiGecerli(ka) || alinmis.has(ka))) return bildir(t(alinmis.has(ka) ? "kodKullaniciVar" : "kullaniciAdiGecersiz"));
    if (!confirm(t("eminMisin"))) return;
    const adres = eposta.trim().toLowerCase();
    setBekle(true);
    const temel = { ad: adi, birim: kisi.birim, gorev: kisi.gorev, rol: kisi.rol, hesapYoneticisi: false, davetEden: ben.id, kisiId: kisi.id };
    firebaseYukle()
      .then(async (f) => {
        if (kodla) {
          const k = await f.kodlaDavetEt({ ...temel, kullanici: ka });
          kodVerildi({ ...k, ad: adi.ar });
        } else {
          await f.davetEt({ ...temel, eposta: adres }, dil);
          bildir(t("davetGonderildi", { eposta: adres }));
        }
        kapat();
      })
      .catch((x) => bildir(gonderimHatasi(x)))
      .finally(() => setBekle(false));
  };
  return (
    <Pencere baslik={t("hesabaBagla")} alt={ad(kisi)} kapat={kapat}>
      <form className="form" onSubmit={gonder} data-bagla-formu>
        <div className="sekmeler" role="tablist" aria-label={t("hesabaBagla")}>
          <button type="button" role="tab" aria-selected={!kodla} className={!kodla ? "acik" : ""} onClick={() => setKodla(false)}>
            {t("eposta")}
          </button>
          <button type="button" role="tab" aria-selected={kodla} className={kodla ? "acik" : ""} onClick={() => setKodla(true)} data-bagla-kod>
            {t("girisKodu")}
          </button>
        </div>
        {kodla ? (
          <label>
            {t("kullaniciAdi")}
            <input dir="ltr" autoCapitalize="none" spellCheck={false} value={kullanici} placeholder={oneri} onChange={(e) => setKullanici(e.target.value.toLowerCase())} data-bagla-kullanici />
          </label>
        ) : (
          <label>
            {t("eposta")}
            <input type="email" dir="ltr" value={eposta} onChange={(e) => setEposta(e.target.value)} required data-bagla-eposta />
          </label>
        )}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme dugme-kucuk" disabled={bekle} data-bagla-gonder>
            {kodla ? <Ticket size={14} /> : <Mail size={14} />} {t(kodla ? "kodOlustur" : "davetGonder")}
          </button>
        </div>
      </form>
    </Pencere>
  );
}

/*
 * Şifresini unutan kod hesabına yeni kod. Başkasının şifresi tarayıcıdan
 * değiştirilemiyor: yeni kullanıcı adıyla yeni hesap açılıyor, eski kayıt
 * e-posta değişikliğindeki gibi "yeni adres" işaretleniyor; kişi yeni kodla
 * girince kaydı, yetkileri ve geçmişi yeni hesaba geçiyor (eylemler.ts →
 * hesabaGecir). Eski kullanıcı adı o zamana kadar çalışıyor.
 */
function YeniKodPenceresi({ ben, kisi, alinmis, kodVerildi, kapat }: { ben: Kisi; kisi: Kisi; alinmis: Set<string>; kodVerildi: (k: KodSonucu) => void; kapat: () => void }) {
  const { t, ad } = useDil();
  // Kullanıcı: yeni kodda ada 1, 2, 3 eklenmesin; kişi aynı adla girsin. Hesap arkada "ad+n"de (girisKodu.ts → hesapAdresi).
  const kendi = girisAdi(kisi.eposta);
  const kendiAdlari = new Set([kendi, girisAdi(kisi.yeniEposta)].filter(Boolean));
  const [kullanici, setKullanici] = useState("");
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState("");
  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    const ka = kullanici.trim().toLowerCase() || kendi;
    const baskasinin = alinmis.has(ka) && !kendiAdlari.has(ka);
    if (!kullaniciAdiGecerli(ka) || baskasinin) return setHata(t(baskasinin ? "kodKullaniciVar" : "kullaniciAdiGecersiz"));
    if (!confirm(t("eminMisin"))) return;
    setBekle(true);
    setHata("");
    const adi = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
    try {
      const f = await firebaseYukle();
      const k = await f.kodlaDavetEt(
        {
          kullanici: ka,
          ad: adi,
          birim: kisi.birim,
          gorev: kisi.gorev,
          rol: kisi.rol,
          hesapYoneticisi: !!kisi.hesapYoneticisi,
          yetkiler: kisi.yetkiler,
          davetEden: ben.id,
          kisiId: kisi.id,
        },
        // Kişi yeni kodla girince kaydı bu işaretle taşınıyor (hesabaGecir); yazılamazsa (eşitlenmeden) kod verilmez.
        { isaretle: (adres) => kisiEpostasi(ben, kisi.id, adres) === "aktivasyon" },
      );
      kodVerildi({ ...k, ad: adi.ar });
      kapat();
    } catch (x) {
      setHata(hataKodu(x) === "kod/isaretlenemedi" ? t("kodIsaretlenemedi") : gonderimHatasi(x));
    } finally {
      setBekle(false);
    }
  };
  return (
    <Pencere baslik={t("yeniKodVer")} alt={ad(kisi)} kapat={kapat}>
      <form className="form" onSubmit={gonder} data-yeni-kod-formu>
        <label>
          {t("kullaniciAdi")}
          <input dir="ltr" autoCapitalize="none" spellCheck={false} value={kullanici} placeholder={kendi} onChange={(e) => setKullanici(e.target.value.toLowerCase())} data-yeni-kod-kullanici />
        </label>
        {hata && (
          <p className="not-kutu uyari" role="alert" data-yeni-kod-hata>
            {hata}
          </p>
        )}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button className="dugme dugme-kucuk" disabled={bekle} data-yeni-kod-olustur>
            <Ticket size={14} /> {t("kodOlustur")}
          </button>
        </div>
      </form>
    </Pencere>
  );
}

export type KodSonucu = GirisKodu & { kod: string; ad: string };

const kodAdresi = (kod: string) => `${location.origin}${location.pathname}#/kod/${kod}`;

/*
 * Kayıtta ve bekleyen davetlerde geçen kullanıcı adları (yeni kod önerisi bunlardan kaçınıyor).
 * Kullanılmış davetin adı, o adla kişi kalmadıysa boş: eskiden numaralı ad (ali.kaya2) almış
 * kişiye yeni kodda eski adı (ali.kaya) verilebilsin; Firebase'de kalan hesap "+n"le atlanıyor.
 */
const alinmisKullanicilar = (kisiler: Kisi[], davetler: Davet[] | null) =>
  new Set([...kisiler.flatMap((k) => [girisAdi(k.eposta), girisAdi(k.yeniEposta)]), ...(davetler ?? []).filter((d) => d.durum === "bekliyor").map((d) => girisAdi(d.eposta))].filter(Boolean));

export function KullaniciAdi({ eposta }: { eposta?: string }) {
  const { t } = useDil();
  return (
    <span className="kod-hesap" title={t("girisKodu")} data-kod-hesap>
      <Ticket size={12} /> <bdi dir="ltr">{girisAdi(eposta)}</bdi>
    </span>
  );
}

/*
 * Verilen kod: yönetici kişiye yüz yüze okur ya da mesajla gönderir. Mesaj
 * kodu, kullanıcı adını ve kodu içine alan bağlantıyı taşıyor; bağlantı kod
 * girilmiş halde açılıyor (KodlaGiris).
 */
function KodPenceresi({ sonuc, kapat }: { sonuc: KodSonucu; kapat: () => void }) {
  const { t } = useDil();
  const mesaj = t("kodMesaji", { ad: sonuc.ad, kod: kodYaz(sonuc.kod), kullanici: sonuc.kullanici, tarih: tarihYaz(new Date(sonuc.bitis).toISOString()), adres: kodAdresi(sonuc.kod) });
  const kopyala = () =>
    navigator.clipboard
      .writeText(mesaj)
      .then(() => bildir(t("bKopyalandi")))
      .catch(() => bildir(t("kopyalanamadi")));
  return (
    <Pencere baslik={t("girisKodu")} alt={sonuc.ad} kapat={kapat}>
      <div className="kod-sonucu" data-kod-sonucu>
        <output className="kod-buyuk" dir="ltr" data-kod={sonuc.kod}>
          {kodYaz(sonuc.kod)}
        </output>
        <dl className="kod-kunye">
          <dt>{t("kullaniciAdi")}</dt>
          <dd>
            <bdi dir="ltr" data-kod-sonuc-kullanici>
              {sonuc.kullanici}
            </bdi>
          </dd>
          <dt>{t("kodSonGecerlilik")}</dt>
          <dd>{tarihYaz(new Date(sonuc.bitis).toISOString())}</dd>
        </dl>
        <div className="dugmeler">
          <button type="button" className="dugme dugme-kucuk" onClick={kopyala} data-kod-kopyala>
            <Copy size={14} /> {t("kodMesajiniKopyala")}
          </button>
          <a className="dugme dugme-ikincil dugme-kucuk" href={`https://wa.me/?text=${encodeURIComponent(mesaj)}`} target="_blank" rel="noopener noreferrer" data-kod-whatsapp>
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </div>
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

/* Kişinin adı, birimi ve görevi (rol ünvandan, yapi.ts → unvandanRol); davet formundaki alanların aynısı. Organizasyon'da tayin de bu pencere. */
export function PozisyonPenceresi({ ben, kisi, kapat }: { ben: Kisi; kisi: Kisi; kapat: () => void }) {
  const { t, ad, dil } = useDil();
  const ilk = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
  const v = useVeri();
  const [p, setP] = useState({ birim: kisi.birim, gorev: kisi.gorev, kadin: !!kisi.kadin, ...ilk });
  const [sehir, setSehir] = useState<Sehir>(kisi.sehir);
  const [yeniSehir, setYeniSehir] = useState<YeniSehir | null>(null);
  // Kod hesabında giriş kullanıcı adıyla; alan kurum adresini değiştiriyor (girisKodu.ts).
  const kodHesabi = !!girisAdi(kisi.eposta);
  const [eposta, setEposta] = useState(kodHesabi ? (kisi.kurumEposta ?? "") : (kisi.yeniEposta ?? kisi.eposta ?? ""));
  const [bekle, setBekle] = useState(false);
  const epostaAcik = epostaDegistirebilir(ben, kisi);
  const disMuhabir = disMuhabirMi({ birim: p.birim });
  // Ünvan birimde seçilemiyorsa birimin ilk ünvanına geçiyor; kişi birimde olmayan ünvanla kalmasın.
  const birimSec = (birim: BirimId) => setP({ ...p, birim, gorev: birimeUygunUnvan(birim, p.gorev) });

  /*
   * E-posta: hesapsızda (ve demoda) doğrudan değişiyor. Etkin hesapta önce
   * yeni adrese aktivasyon daveti gidiyor (kişi, yöneticiliği ve yetkileriyle),
   * sonra kayıtta "yeni e-posta" işareti; kişi etkinleşene kadar eskisiyle
   * giriyor. Şimdiki adres geri yazılırsa bekleyen davet iptal.
   */
  const epostaKaydet = async (): Promise<boolean> => {
    const adres = eposta.trim().toLowerCase();
    const simdiki = (kodHesabi ? (kisi.kurumEposta ?? "") : (kisi.yeniEposta ?? kisi.eposta ?? "")).toLowerCase();
    if (!epostaAcik || adres === simdiki) return true;
    if (adres && v.kisiler.some((x) => x.id !== kisi.id && ((x.eposta ?? "").toLowerCase() === adres || (x.kurumEposta ?? "").toLowerCase() === adres))) {
      bildir(t("epostaKayitli"));
      return false;
    }
    if (kodHesabi) {
      if (girisAdi(adres)) return false;
      return !!kisiEpostasi(ben, kisi.id, adres);
    }
    if (!GERCEK || kisi.hesapsiz) return !!kisiEpostasi(ben, kisi.id, adres);
    if (!adres) return false;
    const f = await firebaseYukle();
    if (kisi.yeniEposta) await f.davetIptal(kisi.yeniEposta).catch(() => {});
    if (adres !== (kisi.eposta ?? "").toLowerCase()) {
      const adi = typeof kisi.ad === "string" ? { tr: kisi.ad, ar: kisi.ad, en: kisi.ad } : kisi.ad;
      await f.davetEt({ eposta: adres, ad: adi, birim: p.birim, gorev: p.gorev, rol: unvandanRol(p.gorev, kisi), hesapYoneticisi: !!kisi.hesapYoneticisi, yetkiler: kisi.yetkiler, davetEden: ben.id, kisiId: kisi.id }, dil);
    }
    const sonuc = kisiEpostasi(ben, kisi.id, adres);
    if (sonuc === "aktivasyon") bildir(t("epostaAktivasyon", { eposta: adres }));
    return !!sonuc;
  };

  const kaydet = async () => {
    const tr = p.tr.trim() || p.en.trim() || ad(kisi);
    // Rol ünvandan geliyor; yöneticiye çıkış sessiz olmasın (muhabir başka birime tayinde sorulmadan yönetici oluyordu).
    if (!disMuhabir && kisi.rol !== "yonetici" && unvandanRol(p.gorev, kisi) === "yonetici" && !confirm(t("orgYoneticiOlacak", { ad: ad(kisi), unvan: gorevAdi(p.gorev) }))) return;
    const once = { birim: kisi.birim, gorev: kisi.gorev, rol: kisi.rol };
    if (!kisiPozisyonu(ben, kisi.id, { birim: p.birim, gorev: p.gorev, kadin: p.kadin, ad: { tr, ar: p.ar.trim() || tr, en: p.en.trim() || tr } })) return;
    const sonra = getir().kisiler.find((x) => x.id === kisi.id);
    // Tayin hemen geçerli (taslağa girmiyor); yanlış tayin bildirimden geri alınsın.
    const geri = sonra && (sonra.birim !== once.birim || sonra.gorev !== once.gorev) ? { ad: t("geriAl"), f: () => kisiPozisyonu(ben, kisi.id, once) } : undefined;
    if (disMuhabir && (yeniSehir || sehir !== kisi.sehir) && !kisiSehri(ben, kisi.id, yeniSehir ?? sehir)) return;
    setBekle(true);
    try {
      if (await epostaKaydet()) {
        bildir(t("bKaydedildi"), geri);
        kapat();
      }
    } catch (x) {
      bildir(gonderimHatasi(x));
    } finally {
      setBekle(false);
    }
  };
  return (
    <Pencere baslik={ad(kisi)} alt={girisAdi(kisi.eposta) || kisi.eposta} kapat={kapat}>
      <div className="form" data-pozisyon-formu>
        <label>
          {t("adArapca")}
          <input dir="rtl" lang="ar" value={p.ar} onChange={(e) => setP({ ...p, ar: e.target.value })} data-pozisyon-ad-ar />
        </label>
        <label>
          {t("adTurkce")}
          <input value={p.tr} onChange={(e) => setP({ ...p, tr: e.target.value })} data-pozisyon-ad />
        </label>
        <label>
          {t("adIngilizce")}
          <input dir="ltr" value={p.en} onChange={(e) => setP({ ...p, en: e.target.value })} />
        </label>
        <label className="secim">
          <input type="checkbox" checked={p.kadin} onChange={(e) => setP({ ...p, kadin: e.target.checked })} data-kadin />
          {t("kisiKadin")}
        </label>
        <label>
          {t("eposta")}
          <input
            type="email"
            dir="ltr"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            disabled={!epostaAcik}
            title={epostaAcik ? undefined : t("epostaYalnizTamYonetici")}
            data-pozisyon-eposta
          />
          {kisi.yeniEposta && (
            <small data-pozisyon-eposta-bekliyor>
              {girisAdi(kisi.yeniEposta) ? t("kodBekliyor", { kullanici: girisAdi(kisi.yeniEposta) }) : t("epostaBekliyor", { eposta: kisi.yeniEposta })}
            </small>
          )}
        </label>
        <label>
          {t("birim")}
          <select value={p.birim} onChange={(e) => birimSec(e.target.value)} data-pozisyon-birim>
            <BirimSecenekleri dahil={kisi.birim} />
          </select>
        </label>
        {/* Dış muhabirin ünvanı seçilmiyor, şehrinden adlanıyor ("<Şehir> muhabiri"); öbür personelde şehir sorulmuyor. */}
        {!disMuhabir && (
          <label>
            {t("gorev")}
            <select value={p.gorev} onChange={(e) => setP({ ...p, gorev: e.target.value })} data-pozisyon-gorev>
              {/* Kişinin şimdiki ünvanı birimde olmasa da açılışta listede: pencere açılınca kendiliğinden değişmesin. */}
              <UnvanSecenekleri birim={p.birim} dahil={p.birim === kisi.birim && p.gorev === kisi.gorev ? kisi.gorev : undefined} />
            </select>
          </label>
        )}
        {disMuhabir && (
          <label>
            {t("sehir")}
            <select
              value={yeniSehir ? YENI_SEHIR : sehir}
              data-pozisyon-sehir
              onChange={(e) => {
                if (e.target.value === YENI_SEHIR) setYeniSehir(bosYeniSehir(sehir));
                else {
                  setYeniSehir(null);
                  setSehir(e.target.value);
                }
              }}
            >
              <SehirSecenekleri />
            </select>
            {!yeniSehir && otomatikMuhabirUnvaniMi(p.gorev) && <small data-pozisyon-unvan>{gorevAdi(sehirMuhabirUnvaniId(sehir))}</small>}
          </label>
        )}
        {disMuhabir && yeniSehir && <YeniSehirAlanlari yeni={yeniSehir} degistir={setYeniSehir} />}
        <div className="form-alt">
          <button type="button" className="dugme dugme-ikincil dugme-kucuk" onClick={kapat}>
            {t("iptal")}
          </button>
          <button type="button" className="dugme dugme-kucuk" disabled={(!disMuhabir && !p.gorev) || bekle || (disMuhabir && !!yeniSehir && !yeniSehir.ar.trim())} onClick={kaydet} data-pozisyon-kaydet>
            {t("kaydet")}
          </button>
        </div>
      </div>
    </Pencere>
  );
}
