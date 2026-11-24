import { SayfaBasi } from "./ekranlar/ana/Planlama";
import { PAKET_SEKMELERI, type PaketSekmesi } from "./paketSekmeleri";
import { useEffect, type ReactNode } from "react";
import { BolmeUyarisi, GomuluKabuk } from "./bilesenler/Gomulu";
import Kabuk from "./bilesenler/Kabuk";
import { MuhabirCerceve, MuhabirHaberlerim, MuhabirOnerilerim, MuhabirYapilacaklar } from "./ekranlar/ana/Muhabir";
import AnaSayfa from "./ekranlar/AnaSayfa";
import DilDenetimi from "./ekranlar/ana/DilDenetimi";
import YoneticiPaneli from "./ekranlar/YoneticiPaneli";
import { Ayarlar, Yetkisiz } from "./ekranlar/Ayarlar";
import Raporlar from "./ekranlar/Raporlar";
import Basliklar, { BaslikSayfasi } from "./ekranlar/Basliklar";
import Giris from "./ekranlar/Giris";
import GercekGiris from "./ekranlar/GercekGiris";
import Tanitim from "./ekranlar/Tanitim";
import Takipler from "./ekranlar/Takipler";
import Gorevler from "./ekranlar/Gorevler";
import Hareketler from "./ekranlar/Hareketler";
import KayitSayfasi from "./ekranlar/KayitSayfasi";
import KodlaGiris from "./ekranlar/KodlaGiris";
import NdToplanti from "./ekranlar/nextday/Toplanti";
import Organizasyon from "./ekranlar/organizasyon/Organizasyon";
import Gundem from "./ekranlar/Gundem";
import { IsAkisi, Paketler, Ucretler } from "./ekranlar/Listeler";
import { StokSayfasi } from "./ekranlar/StokSayfasi";
import { Muhasebe } from "./ekranlar/Muhasebe";
import Cikti from "./ekranlar/nextday/Cikti";
import TakdirBildirimi from "./ekranlar/nextday/Takdir";
import NextDayBelge from "./ekranlar/belge/NextDayBelge";
import HaftalikBelge from "./ekranlar/belge/HaftalikBelge";
import NextDayListe from "./ekranlar/nextday/Liste";
import PlanEkrani from "./ekranlar/nextday/Plan";
import { Cagri, Yanitlar } from "./ekranlar/oneri/Eposta";
import { Posta } from "./ekranlar/posta/Posta";
import {
  OneriDetay,
  OnerilerListe,
  YeniOneri,
} from "./ekranlar/oneri/Oneriler";
import PaketDetay from "./ekranlar/PaketDetay";
import {
  Gorevlendirmeler,
  KisiDetay,
  PersonelListe,
} from "./ekranlar/Personel";
import { Aylik } from "./ekranlar/aylik/Aylik";
import { OzelListe, OzelSayfa } from "./ekranlar/OzelYayin";
import OzelCikti from "./ekranlar/OzelCikti";
import HaftalikCagri from "./ekranlar/haftalik/Cagri";
import HaftalikCikti from "./ekranlar/haftalik/Cikti";
import HaftalikListe from "./ekranlar/haftalik/Liste";
import HaftalikPlanEkrani from "./ekranlar/haftalik/Plan";
import HaftalikToplanti from "./ekranlar/haftalik/Toplanti";
import ProjePlani from "./ekranlar/ProjePlani";
import Egitim from "./ekranlar/Egitim";
import OrtamSayfasi from "./ekranlar/ortam/Ortam";
import YeniOrtam from "./ekranlar/ortam/YeniOrtam";
import Takvim from "./ekranlar/takvim/Takvim";
import { Bos, bildir } from "./bilesenler/Parcalar";
import { useDil } from "./dil";
import { gercekKipKurulu } from "./firebase-ayar";
import { GERCEK, firebaseYukle, useGercekDurum, baglantiCanliMi, useSunucuyaEsit } from "./kip";
import { useBen } from "./oturum";
import {
  haftaBul,
  kisiBul,
  oneriBul,
  paketBul,
  planBul,
  useVeri,
  yarinPlani,
} from "./veri";
// veri.ts eylemler.ts'ten önce yüklenmeli: açılışta örnek veriyi kurarken eposta.ts'e dayanıyor (döngü).
import { MASA_ADI, MASA_IKONU, MasaSayfasi } from "./ekranlar/program/ProgramMasasi";
import { MASA_YOLU, PROGRAM_BOLUMLERI, type MasaBirimi, type ProgramBolumu } from "./programMasasi";
import { demoStaffingPostasi, demoTakvimAdaylari, dilDenetmenleriniTasi, eskiOnerileriCevir, eskiTakipleriSil, haftalikAktarimlariniTamamla, haftalikPaketBasliklariniDuzelt, masaPaketleriniStoktanAyir, kunyeleriDoldur, stokPaketleriniHazirlaraAl, hazirYayinlariniEsitle, kesinlesmisRetleriCikar, masaGorevleriniTakibeAl, gorevDuragindaKalanlariGecir, muhabirUnvanlariniEsitle, ozelNafizeleriCevir, ozelCanlilariniBagla, ozelTalepleriMaddeyeCevir, ozelYayinlananlariIsaretle, onerileriPlanlaEsitle, planCiftleriniTopla, yarinPlaniniAc, yonetimiAgacaTasi } from "./eylemler";
import { izlemede } from "./izleme";
import { otoCagriEsitle, otoHataYeni } from "./otoCagri";
import { otoHataMetni } from "./ekranlar/posta/OtoCagri";
import {
  kisitliKisi,
  oneriGorebilir,
  paketGorebilir,
  postaGorebilir,
  sayfaGorebilir,
  yapabilir,
  dilDenetmeniMi,
  muhasebeciMi,
  masaOneriyiGorur,
  hesapYetkisi,
} from "./yetki";
import { GOMULU, useYol } from "./yol";

/**
 * Uygulamanın girişi: oturum yoksa demo giriş, varsa kabuk ve sayfa.
 *
 * Proje planı girişsiz açılıyor; yöneticilere bağlantıyla gösterilecek.
 * Her sayfa önce birim iznine (yetki.ts → SAYFA_IZNI), kayıt sayfaları
 * ayrıca kaydın görünürlüğüne bakıyor: muhabir başka muhabirin paketinin
 * adresini elle yazsa da "yetkisiz" görüyor.
 *
 * Workspace bölmesinde (GOMULU) aynı sayfalar kabuksuz çiziliyor; menü ve
 * üst çubuk üst pencerede bir kez duruyor.
 *
 * Gerçek kipte (kip.ts) kayıt Firebase'den geliyor: oturum ve kayıt hazır
 * olana kadar "yükleniyor", oturum yoksa gerçek giriş. Demo giriş ekranı
 * yalnız demoda.
 */
/* Gün dönümünü yakalamak için arada bir: uygulama gece açık kalsa da sabah yarının planı hazır. */
const GUN_YOKLAMA = 10 * 60 * 1000;

/*
 * E-postadan dönüş: eski giriş bağlantısı (baglanti), şifre belirleme ve
 * doğrulama (sifre; depo/firebase.ts → sifreDonusu). İkisi de giriş ekranını açar.
 */
const BAGLANTI_DONUSU = ["baglanti", "sifre"].includes(new URLSearchParams(location.search).get("giris") ?? "");

export default function App() {
  const { t } = useDil();
  const yol = useYol();
  const ben = useBen();
  const v = useVeri();
  const gd = useGercekDurum();
  const kayitHazir = !GERCEK || gd.tur === "hazir";
  // Sistemin yazışları önbellekten kurulan ilk görüntüyle değil, sunucuyla eşitlenmiş kayıtla (kip.ts → sunucuyaEsitlendi).
  const esit = useSunucuyaEsit();
  const sistemHazir = kayitHazir && (!GERCEK || esit);

  // Gerçek kipte Firebase sonradan yükleniyor; oturum ve kayıt gelince ekran açılıyor.
  useEffect(() => {
    if (GERCEK && gercekKipKurulu())
      firebaseYukle().then((f) => f.gercekKipiBaslat());
  }, []);
  // Ortak kayda yazılamadıysa (bağlantı, yetki) kişi bilsin; iş ekranda kaldı ama kayda gitmedi.
  useEffect(() => {
    const f = () => bildir(t("kayitHatasi"));
    window.addEventListener("trt-kayit-hatasi", f);
    return () => window.removeEventListener("trt-kayit-hatasi", f);
  }, [t]);
  // Kayıt henüz sunucuyla eşitlenmedi (açılışın ilk saniyeleri): eylem yazılmadı, kişi bilsin.
  useEffect(() => {
    const f = () => setTimeout(() => bildir(t("esitlenmediYazilmadi")));
    window.addEventListener("trt-esitlenmedi", f);
    return () => window.removeEventListener("trt-esitlenmedi", f);
  }, [t]);
  // İzlemede eylem yazmadı; eylemin kendi "kaydedildi" bildirimi ardından gelmesin diye bir tur sonra.
  useEffect(() => {
    const f = () => setTimeout(() => bildir(t("izlemeYazilmadi")));
    window.addEventListener("trt-izleme-yazilmadi", f);
    return () => window.removeEventListener("trt-izleme-yazilmadi", f);
  }, [t]);
  // Next Day her gün sürüyor: yarının planı yoksa sistem önceki planın şablonuyla açıyor.
  // Bölmeler değil üst pencere yokluyor: dört bölme aynı işi dört kez yapmasın. Gerçek kipte kayıt gelince.
  // Gerçek kipte kısıtlı kişi (muhabir) kaydın yalnız kendi parçasını görüyor: planı yok sanıp gerçeğinin üstüne boş plan yazardı.
  const sistemYazar = !GERCEK || (!!ben && !kisitliKisi(ben));
  // Kişi taşıyan işler (birim değişir) gerçek kipte yalnız kişi düzenleme yetkilisinde: kural öbürünün yazışını reddediyor, her yoklamada "kayıt hatası" çıkıyordu.
  const kisiTasir = !GERCEK || (!!ben && hesapYetkisi(ben, "kisiDuzenle"));
  useEffect(() => {
    if (GOMULU || !sistemHazir || !sistemYazar) return;
    const yokla = () => {
      // İzlemede yazış kapalı; plan, yöneticinin kendi sekmesinde ya da başkasınınkinde açılır.
      if (izlemede()) return;
      // Bağlantı kopukken sistem yazmaz: önbellekteki görüntü bayat olabilir (kip.ts → baglantiCanliMi).
      if (GERCEK && !baglantiCanliMi()) return;
      /*
       * Her iş ayrı korumada: biri kayıttaki beklenmedik bir öğede hata
       * fırlatınca bütün uygulama beyaz kalıyordu (gizli pencerede, yani
       * kayıtsız açılınca sorun yoktu). Bozulan iş atlanıyor, öbürleri ve
       * sayfa çalışıyor; hata konsolda.
       */
      for (const is of [ozelNafizeleriCevir, ozelTalepleriMaddeyeCevir, ozelCanlilariniBagla, ozelYayinlananlariIsaretle, planCiftleriniTopla, haftalikPaketBasliklariniDuzelt, masaPaketleriniStoktanAyir, yarinPlaniniAc, haftalikAktarimlariniTamamla, eskiOnerileriCevir, eskiTakipleriSil, onerileriPlanlaEsitle, muhabirUnvanlariniEsitle, dilDenetmenleriniTasi, yonetimiAgacaTasi, demoTakvimAdaylari, demoStaffingPostasi, kunyeleriDoldur, stokPaketleriniHazirlaraAl, hazirYayinlariniEsitle, kesinlesmisRetleriCikar, masaGorevleriniTakibeAl, gorevDuragindaKalanlariGecir]) {
        if (!kisiTasir && (is === dilDenetmenleriniTasi || is === yonetimiAgacaTasi)) continue;
        try {
          is();
        } catch (hata) {
          console.error(is.name, hata);
        }
      }
    };
    yokla();
    const z = setInterval(yokla, GUN_YOKLAMA);
    return () => clearInterval(z);
  }, [sistemHazir, sistemYazar, kisiTasir]);

  /*
   * Otomatik çağrı (otoCagri.ts): kapının gönderdiği çağrı kayda girsin (yanıtlar
   * ona bağlanır), gönderen muhabir listesini tazelesin; saatte bir. Gönderim
   * olmadıysa gönderen bir kez bildirim görür.
   */
  const otoKisi = GERCEK && !!ben && postaGorebilir(ben) && yapabilir(ben, "cagriHazirla") ? ben : null;
  const otoId = otoKisi?.id;
  useEffect(() => {
    if (GOMULU || !sistemHazir || !otoKisi) return;
    const yokla = () => {
      if (izlemede() || !baglantiCanliMi()) return;
      otoCagriEsitle(otoKisi)
        .then((d) => {
          // Kendi hesabından gidemeyen ya da kimsenin göndermediği çağrı gönderen listesindekilere bildirilir.
          const son = d?.izinli && (!d.gecmis[0]?.uid || d.gecmis[0].uid === otoKisi.id) ? d.gecmis[0] : undefined;
          if (son && !son.tamam && otoHataYeni(son.zaman)) bildir(t("otoCagriHata", { hata: otoHataMetni(t, son.hata) }));
        })
        .catch((hata) => console.error("otoCagriEsitle", hata));
    };
    yokla();
    const z = setInterval(yokla, 3600_000);
    return () => clearInterval(z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sistemHazir, otoId]);

  // Tanıtım: adres çıplak açılınca (demoda; gerçek kipte kalmış kişi doğrudan sisteme) ya da `#/tanitim`.
  if (!GOMULU && !BAGLANTI_DONUSU && (yol.sayfa === "tanitim" || (!GERCEK && location.hash.length <= 1))) return <Tanitim />;
  // Kayıt bağlantısı (hesap yöneticisinin paylaştığı); demo açıkken de, bölmede değil.
  if (yol.sayfa === "kayit" && !GOMULU && !BAGLANTI_DONUSU) return <KayitSayfasi kod={yol.id ?? ""} />;
  // Giriş kodu (yöneticinin verdiği, e-postasız hesap): kayıt bağlantısı gibi demo açıkken de.
  if (yol.sayfa === "kod" && !GOMULU && !BAGLANTI_DONUSU) return <KodlaGiris kod={yol.id ?? ""} />;
  // Gerçek giriş (tanıtımdaki "Giriş") ve e-posta bağlantısının dönüşü; bölmede açılmıyor.
  if (yol.sayfa === "gercek-giris" || BAGLANTI_DONUSU)
    return GOMULU ? (
      <GomuluKabuk>
        <BolmeUyarisi tur="oturumYok" />
      </GomuluKabuk>
    ) : (
      <GercekGiris />
    );
  if (GERCEK && !kayitHazir) {
    if (gd.tur === "yukleniyor" && gercekKipKurulu())
      return (
        <div className="yukleniyor-sayfa">
          <Bos metin={t("yukleniyor")} />
        </div>
      );
    return GOMULU ? (
      <GomuluKabuk>
        <BolmeUyarisi tur="oturumYok" />
      </GomuluKabuk>
    ) : (
      <GercekGiris />
    );
  }

  // Eğitim sahnesi: yalnız demoda, oturumsuz da; bölmeleri kendi kişileriyle açılıyor.
  if (yol.sayfa === "egitim" && !GERCEK && !GOMULU) return <Egitim />;
  // Bölmede giriş ekranı yok: oradan kişi seçmek bütün pencerenin oturumunu değiştirirdi.
  if (!ben)
    return GOMULU ? (
      <GomuluKabuk>
        <BolmeUyarisi tur="oturumYok" />
      </GomuluKabuk>
    ) : GERCEK ? (
      <GercekGiris />
    ) : (
      <Giris />
    );
  // Proje planı giriş yapmış kişiye ve yalnız gerçek kipte (yetki.ts → sayfaGorebilir); önce girişsiz açılıyordu.
  if (yol.sayfa === "plan" && sayfaGorebilir(ben, "plan"))
    return GOMULU ? (
      <GomuluKabuk>
        <BolmeUyarisi tur="projePlani" />
      </GomuluKabuk>
    ) : (
      <ProjePlani />
    );

  const sayfa = yol.sayfa;
  let icerik: ReactNode;
  // Masaya sorulan öneri, öneriler sayfası menüsünde olmayan masaya da açık (yalnız o önerinin sayfası).
  const masaninOnerisi = sayfa === "oneriler" && yol.id ? oneriBul(v, yol.id) : undefined;
  const masaOnerisi = !!masaninOnerisi && masaOneriyiGorur(ben, masaninOnerisi, v);
  if (!sayfaGorebilir(ben, sayfa) && !masaOnerisi) {
    icerik = <Yetkisiz />;
  } else {
    switch (sayfa) {
      case "ana":
        icerik = dilDenetmeniMi(ben) ? <DilDenetimi ben={ben} /> : muhasebeciMi(ben) ? <Muhasebe ben={ben} sekme="" /> : <AnaSayfa ben={ben} />;
        break;
      case "ortam":
        icerik = GOMULU ? (
          <BolmeUyarisi tur="icIce" />
        ) : yol.id === "yeni" ? (
          <YeniOrtam ben={ben} />
        ) : (
          <OrtamSayfasi ben={ben} id={yol.id} />
        );
        break;
      case "panel":
        icerik = <YoneticiPaneli ben={ben} birim={yol.id} />;
        break;
      case "nextday": {
        // "yarin": ana sayfadaki kısayol hangi kimlik olduğunu bilmeden yarının planına gidiyor.
        const plan = yol.id === "yarin" ? yarinPlani(v) : planBul(v, yol.id);
        // Yarının planı yoksa (henüz açılmadı ya da kaydı kayboldu) liste: kayıp plan şeridi orada, "erişimin yok" yanıltıyordu.
        if (yol.id && yol.id !== "yarin" && !plan) icerik = <Yetkisiz />;
        else if (plan && yol.alt === "cikti") icerik = <Cikti plan={plan} />;
        else if (plan && yol.alt === "takdir") icerik = <TakdirBildirimi ben={ben} plan={plan} />;
        else if (plan && yol.alt === "toplanti") icerik = <NdToplanti ben={ben} plan={plan} />;
        else if (plan && yol.alt === "belge")
          icerik = <NextDayBelge ben={ben} plan={plan} />;
        else if (plan) icerik = <PlanEkrani ben={ben} plan={plan} />;
        else icerik = <NextDayListe ben={ben} />;
        break;
      }
      case "haftalik": {
        const hafta = haftaBul(v, yol.id);
        if (yol.id && !hafta) icerik = <Yetkisiz />;
        else if (hafta && yol.alt === "cikti")
          icerik = <HaftalikCikti hafta={hafta} />;
        else if (hafta && yol.alt === "belge")
          icerik = <HaftalikBelge ben={ben} hafta={hafta} />;
        else if (hafta && yol.alt === "toplanti")
          icerik = <HaftalikToplanti ben={ben} hafta={hafta} />;
        else if (hafta && yol.alt === "cagri")
          icerik = yapabilir(ben, "cagriHazirla") ? (
            <HaftalikCagri ben={ben} hafta={hafta} />
          ) : (
            <Yetkisiz />
          );
        else if (hafta) icerik = <HaftalikPlanEkrani ben={ben} hafta={hafta} />;
        else icerik = <HaftalikListe ben={ben} />;
        break;
      }
      case "aylik":
        icerik = <Aylik ben={ben} planId={yol.id} />;
        break;
      case "takvim":
        icerik = <Takvim ben={ben} yol={yol} />;
        break;
      case "ozel":
        icerik = !yol.id ? <OzelListe ben={ben} /> : yol.alt === "cikti" ? <OzelCikti id={yol.id} /> : <OzelSayfa ben={ben} id={yol.id} />;
        break;
      case "takipler":
        icerik = <Takipler ben={ben} />;
        break;
      case "yapilacaklar":
        icerik = <MuhabirYapilacaklar ben={ben} />;
        break;
      case "gorevler":
        icerik = <Gorevler ben={ben} />;
        break;
      case "hareketler":
        icerik = <Hareketler ben={ben} />;
        break;
      case "posta":
        icerik = postaGorebilir(ben) ? <Posta ben={ben} /> : <Yetkisiz />;
        break;
      case "oneriler": {
        if (yol.id === "yeni")
          icerik = <YeniOneri ben={ben} haftalik={yol.alt === "haftalik"} />;
        else if (yol.id === "arsiv") icerik = ben.birim === "muhabir" ? <MuhabirOnerilerim ben={ben} arsiv /> : <OnerilerListe ben={ben} arsiv />;
        else if (yol.id === "cagri")
          icerik = yapabilir(ben, "cagriHazirla") ? (
            <Cagri ben={ben} tarih={yol.alt} />
          ) : (
            <Yetkisiz />
          );
        else if (yol.id === "yanitlar")
          icerik = yapabilir(ben, "cagriHazirla") ? (
            <Yanitlar ben={ben} cagriId={yol.alt} />
          ) : (
            <Yetkisiz />
          );
        else if (yol.id) {
          const o = oneriBul(v, yol.id);
          icerik =
            o && oneriGorebilir(ben, o) ? (
              // Öneriden öneriye geçince sayfa baştan kuruluyor: açık form ve pencere öncekinin içeriğini taşımasın.
              <OneriDetay key={o.id} ben={ben} oneri={o} />
            ) : (
              <Yetkisiz />
            );
        } else icerik = ben.birim === "muhabir" ? <MuhabirOnerilerim ben={ben} /> : <OnerilerListe ben={ben} />;
        break;
      }
      case "basliklar":
        icerik = yol.id ? <BaslikSayfasi ben={ben} id={yol.id} /> : <Basliklar ben={ben} />;
        break;
      case "paketler":
        // "#/paketler/<sekme>" sayfanın sekmesi (ana sayfanın akış kutuları), paket kimliği değil.
        if (yol.id && (PAKET_SEKMELERI as readonly string[]).includes(yol.id))
          icerik = ben.birim === "muhabir" ? <MuhabirHaberlerim ben={ben} /> : <Paketler key={yol.id} ben={ben} sayfa="paketler" acilis={yol.id as PaketSekmesi} />;
        else if (yol.id) {
          const p = paketBul(v, yol.id);
          icerik =
            p && paketGorebilir(ben, p, v) ? (
              <PaketDetay ben={ben} paket={p} kutu={yol.alt} />
            ) : (
              <Yetkisiz />
            );
        } else icerik = ben.birim === "muhabir" ? <MuhabirHaberlerim ben={ben} /> : <Paketler ben={ben} sayfa="paketler" />;
        break;
      case "feature":
        icerik = <Paketler ben={ben} sayfa={sayfa} />;
        break;
      // Masaların sayfası (Programlar, Ekonomi, Spor; ProgramMasasi.tsx); "#/<masa>/<bölüm>" o bölümle açılır.
      case "programlar":
      case "ekonomi":
      case "spor": {
        const masa = (Object.keys(MASA_YOLU) as MasaBirimi[]).find((b) => MASA_YOLU[b] === sayfa)!;
        icerik = (
          <>
            <SayfaBasi ikon={MASA_IKONU[masa]} baslik={t(MASA_ADI[masa])} />
            <MasaSayfasi key={yol.id ?? ""} ben={ben} birim={masa} ilk={(PROGRAM_BOLUMLERI as readonly string[]).includes(yol.id ?? "") ? (yol.id as ProgramBolumu) : undefined} />
          </>
        );
        break;
      }
      // Kutucuklu sayfa (StokSayfasi.tsx); "#/stok/<bölüm>" o kutuyla açılır.
      case "stok":
        icerik = <StokSayfasi key={yol.id ?? ""} ben={ben} ilk={yol.id} />;
        break;
      case "profil":
        icerik = <KisiDetay ben={ben} kisi={ben} />;
        break;
      case "muhabirler":
      case "editorler":
      case "personel":
        if (yol.id) {
          const k = kisiBul(v, yol.id);
          icerik = k ? <KisiDetay ben={ben} kisi={k} /> : <Yetkisiz />;
        } else icerik = <PersonelListe ben={ben} sayfa={sayfa} />;
        break;
      case "izinler":
      case "saha":
      case "seyahat":
      case "talepler":
        icerik = <Gorevlendirmeler ben={ben} sayfa={sayfa} />;
        break;
      case "uretim":
      case "metinkontrol":
      case "video":
        icerik = <IsAkisi sayfa={sayfa} />;
        break;
      case "ucretler":
        icerik = <Ucretler ben={ben} />;
        break;
      case "muhasebe":
        icerik = <Muhasebe ben={ben} sekme={yol.id ?? ""} kisiId={yol.alt} />;
        break;
      case "raporlar":
        icerik = <Raporlar ben={ben} />;
        break;
      case "ayarlar":
        icerik = <Ayarlar ben={ben} />;
        break;
      case "gundem":
        icerik = <Gundem ben={ben} sekme={yol.id} />;
        break;
      case "organizasyon":
        icerik = <Organizasyon ben={ben} sekme={yol.id} />;
        break;
      /* Eski adres: hesaplar Organizasyon › Kişiler'de. */
      case "kullanicilar":
        icerik = <Organizasyon ben={ben} sekme="kisiler" />;
        break;
      default:
        icerik = <Yetkisiz />;
    }
    /*
     * Muhabirin bölüm sayfaları masalardaki gibi kutucukların altında (kullanıcı: muhabir sayfası program birimi
     * gibi); kutucuklar telefonda bölüm sayfasında gizli. Kaydın kendi sayfası (öneri, paket) ve form değil.
     */
    const bolum = sayfa as "yapilacaklar" | "oneriler" | "takipler" | "paketler" | "saha";
    if (ben.birim === "muhabir" && ["yapilacaklar", "oneriler", "takipler", "paketler", "saha"].includes(sayfa) && (!yol.id || (sayfa === "oneriler" && yol.id === "arsiv")))
      icerik = (
        <MuhabirCerceve ben={ben} bolum={bolum}>
          {icerik}
        </MuhabirCerceve>
      );
  }

  return GOMULU ? (
    <GomuluKabuk>{icerik}</GomuluKabuk>
  ) : (
    <Kabuk
      ben={ben}
      sayfa={sayfa}
      ortamAcik={sayfa === "ortam" && yol.id !== "yeni"}
    >
      {icerik}
    </Kabuk>
  );
}
