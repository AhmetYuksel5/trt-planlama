# TRT Arapça · Planlama ve Koordinasyon

TRT Arapça haber merkezi için planlama merkezli, birimler arası koordinasyon
prototipi. Kaynak kökte, derlenmiş çıktı `docs/` altında ve depoda.

- React + TypeScript + Vite. `npm install` bir kez; `npm run build`
  çıktıyı `docs/` içine üretiyor. **Derlemeden gönderme:** `docs/` elle
  düzenlenmez, kaynak değişince yeniden derlenir.
- GitHub Pages `main` dalındaki `docs/` klasöründen yayınlıyor. `base`
  göreli (`./`); depo adı değişse de (trt-planlama → TRTArabiFlow)
  yapılandırma değişmiyor.
- Dayanağı dört belge:
  - notlardaki beş aşama ve birimler
  - "Görselli Kapsamlı Rapor": Next Day'in on kutusu, haftalık akış ve üç
    kol, birim pencereleri, ortak kayıt, yetki, mimari
  - "İlk Taslak Promptu": ilk teslimatın kapsamı, Next Day ekranı, menü
  - kurumun Next Day çıktısı (الأجندة الإخبارية): çıktı ekranı onun bölüm
    sırasını ve biçimini izliyor

  Eşlemeler `src/akis.ts` ve `src/veri.ts` başındaki yorumlarda.
- Katmanlar:
  - `veri.ts`: tipler, depo, yükle/kaydet
  - `akis.ts`: adımlar, aşamalar, adım sahipleri
  - `yetki.ts`: birim/rol/alan yetkisi, görünürlük, sayfa izinleri;
    yönetici kapsamı (`MUDURLUKLER`, `kapsam`): Input müdürü Planlama,
    Newsdesk, News Gathering ve muhabirlerden, Program müdürü Program'dan,
    birim yöneticisi kendi biriminden sorumlu
  - `eylemler.ts`: kaydı değiştiren her şey; önce yetki, sonra hareket kaydı
  - `performans.ts`: muhabir göstergeleri; saklanmaz, paket kaydındaki
    ölçüm noktalarından (gorevZamani, muhabirTeslimi, duzeltmeSayisi,
    nitelik) hesaplanır, sınırlı hareket kaydından değil
  - `rapor.ts`: raporlar; performans gibi saklanmaz, aynı ölçümle
    (`olcumler`) kayıtlardan hesaplanır
  - `eposta.ts`: çağrı e-postası (Outlook taslağı, mailto) ve gelen yanıtı
    eşleştirme kuralları; saf, sunucu fazında posta kutusunu izleyen hizmet
    de aynısını kullanacak (`belgeler/eposta-entegrasyonu.md`). Next Day
    etiketi `ND-`, haftalık `HP-` (haftanın Cumartesi'si)
  - `haftalik.ts`: haftalık planın okuma kuralları (gündemde mi, karar
    bekleyen, Next Day'e gider mi, ön inceleme bekleyenler)
  - `takvim.ts`: planlama takviminin okuma kuralları (tekrarların açılımı,
    yaklaşanlar, hatırlatma, yıllık yoğunluk, arama ve süzgeç)
  - `oturum.ts`: demo giriş
  - `ornek.ts`: örnek veri
- Dil: arayüz üç dilli (Türkçe, Arapça, İngilizce). Bütün metinler
  `src/dil.ts` içinde tek tabloda ve üç dil zorunlu; eksik çeviri derlemeyi
  kırar. Ekranlara çıplak metin yazılmaz.
- İçerik her zaman Arapça ve her arayüz dilinde sağdan sola. İçerik: başlık,
  gelişme, paket, canlı yayın, plan kalemi, script; düz `string`.
  - Ekranda `<Icerik>` (satır içi, `bdi`) ya da `<Icerik blok>` (kendi
    satırı, hücresi, paragrafı; sağa yaslı) ile gösterilir. Tablo sütunu
    `icerik-sutun`. Ekranlar `dir`/`lang` elle yazmaz.
  - Form alanı `{...icerikAlani}` alır, yer tutucu örneği Arapça.
  - Dil denetimi yok: Latin harfli özel isim (NATO, OPEC+) serbest.
  - Planın "ŞEHİR / BAŞLIK / MUHABİR" satırı çıktıdaki gibi baştan sona
    Arapça (`satir`, `sehirAr`, `kisiAr`, `etiketler.ts`).
  - Kişi adı içerik değil: arayüz dilinin yazımıyla (`useDil().ad`).
    Notlar ve gerekçeler yazıldığı dilde (`dir="auto"`).
- Logo resmî dosya (`src/varliklar/logo-trt-arabi.png`, `bilesenler/Logo.tsx`);
  her dilde aynı, dosyaya dokunulmaz. Koyu zeminde (sol menü, giriş, proje
  planı) `<Logo levha />` beyaz levhada durur ("عربي" lacivert, levhasız
  kaybolur); menü gizliyken ve telefonda üst çubukta, beyaz zeminde
  levhasız. Boyu yerine göre `--logo-*` token'larından. Favicon logonun "TRT" kısmından
  (`varliklar/simge.png`).
- Haber türü (biçim: PKG, Live, Vox Pop…) kol'dan (haber, feature/ekonomi,
  program) ayrı alan. Kol akışı belirler, biçim ekrana nasıl çıktığını.
- Veri bu sürümde tarayıcıda (`localStorage`, anahtar `trt-planlama-v15`;
  şema değişince anahtar da değişir)
  ve örnek kayıtla açılıyor. Sunucu katmanı geldiğinde yalnız `src/veri.ts`
  içindeki yükle/kaydet değişecek.
  - Aynı kaydı birden çok kopya paylaşıyor (workspace bölmeleri, sekmeler).
    Her yazış bir iz bırakır (`trt-planlama-v15-iz`); `getir` iz
    değişmişse kaydı yeniden okur, yani her eylem en taze kayıttan başlar.
  - `storage` olayı öbür kopyaları yeniden çizer; dil ve oturum da öyle.
  - Eylem kaydı yazarken temeli `getir()`'den alır; ekrandaki `useVeri`
    kopyası bayat olabilir, onunla yazma.
- Giriş demo: kişi seçiliyor, şifre yok. Muhabir yalnız kendi işini görür.
  Yetki hem düğmede hem eylemde soruluyor.
- Ana sayfa çalışma alanlarından oluşur (`ekranlar/ana/Calisma.tsx`):
  her kart bir `Alan` (kimlik, ad, geniş mi, grup, `sayfa`), birimin
  varsayılan düzeni `VARSAYILAN`'da. Kişi "Sayfayı düzenle" ile alan
  kaldırır, sıralar, ekler, varsayılana döner; düzeni `Durum.anaSayfa`
  (`kişi:düzen`). Alan eklemek için alanın `sayfa`'sını görebilmek gerekir
  ("muhabir" yalnız muhabirin kendi işi, "panel" kapsamı olan yönetici).
  Müdür birime inince birimin varsayılanını görür (`kisisel={false}`).
  Planlama'nın sayfasında başlık yok; varsayılanı üç alan (muhabir
  önerileri, muhabirlerin durumu, son hareketler). Plan kısayolları alan
  değil, üst şeritte (aşağıda).
  Yeni kart da böyle eklenir: birim dosyasındaki `*_ALANLARI` listesine.
  Katalog çizimde kurulur; alan dosyaları `Calisma.tsx`'i içe aktardığı
  için açılışta okunursa döngüde tanımsız kalır.
- Yönetici paneli (`ekranlar/YoneticiPaneli.tsx`) iş akışı ayrıntısı
  göstermez: sayılar, birim ışıkları (gerekçesi yazılı), dikkat
  gerektirenler, talimatlar; ayrıntı için birimin kendi ekranına iner.
  Müdahale yalnız öncelik, yönetici notu ve haber talimatı. Talimat ayrı
  akış değil: Planlama'ya reddedilemeyen öneri olarak düşer.
- Next Day her gün kesintisiz sürer: yarının planını kullanıcı değil sistem
  açar (`eylemler.ts → yarinPlaniniAc`, `App.tsx`'te açılışta ve arada bir;
  hareket kaydında kişi `SISTEM`). Plan açma düğmesi ve neyin taşınacağını
  seçtiren form yok; plan önceki planın şablonuyla gelir. Taşınan kayıt `onceki` işaretli
  (hareket bağlantısında `NextDayPlan.oncekiHareketler`) ve ekranda
  `.onceki` hafif fonuyla görünür. Fon düzenleyince, "Bugün de geçerli"
  (`oncekiOnayla`) deyince ya da plan onaylanınca kalkar; çıktıda yoktur.
  Paket önerisi ve hazır paket taşınmaz.
- Önerinin üç kaynağı var:
  - muhabir: uygulamadan, e-posta yanıtından ya da Planlama'nın onun adına
    girdiği telefon/mesaj/yüz yüze
  - yönetici talimatı
  - muhabir dışı kaynak: ajans, resmî, medya, kurum içi (`kaynakTuru`,
    `kaynakAdi`)

  Elle girilen öneride `giren` dolu. Plan ekranlarındaki "Öneri ekle" ile
  öneri sayfası aynı formu kullanır (`oneri/OneriFormu.tsx`). Ekranda
  kaynak her yerde `OneriKaynagi` / `OneriAvatari` ile gösterilir
  (`bilesenler/Tablolar.tsx`); muhabir/talimat ayrımı elle yazılmaz.
  Muhabir dışı kaynağın öneri çağrısıyla bağı ve geri dönüşü yoktur;
  plana eklenince gelişmenin kaynağı önerinin kaynağı olur.
- Plan ekranlarında (Next Day, haftalık) gelen öneri müstakil kart
  (`oneri/OneriKarti.tsx → OneriListesi`):
  - kartta kol, haber türü, ülke, durum; başlık önerilen paket
    (`paketBasligi`, yoksa `haberBasligi`), altında arka plan haberi,
    kısa gelişme, kaynak ve zaman. Renk yalnız kolda.
  - Karta basınca `Pencere`de bütün öneri: tam gelişme, kaynak, hedef plan,
    süreç, "Ayrıntı ve geçmiş". Plana/gündeme ekleme ve ret pencerede
    açılır, ızgarada form açılmaz; değerlendirmeye alma ve erteleme kartta.
  - Kart ya da liste kişinin seçimi, ana sayfa düzeni gibi kayıtta
    (`Durum.oneriGorunumu`, `eylemler.ts → oneriGorunumuKaydet`); aynı
    tarayıcıda başka biri girince kendi seçimini görür, seçmeyen kart görür.
  - Öneriler sayfası (`oneri/Oneriler.tsx → OnerilerListe`) da aynı seçimi
    izler: kartta aynı kart ve pencere ama karar yok (kararlar ayrıntı
    sayfasında), listede bugünkü tablo. Başlık kartındaki küçük liste bu
    kalıba girmez.
- Haftalık plan (`ekranlar/haftalik/`): Cumartesi–Cuma, Perşembe
  toplantısı. Hazırlık → haftalık toplantıda → kesinleşti.
  - Kalemin dosyası merkezi başlık havuzundaki başlık; Next Day'e aynı
    başlıkla geçer, havuz ikiye bölünmez.
  - Haftalık öneri `Oneri.hafta` taşır, `hedefTarih` taşımaz; Next Day
    ekranlarına karışmaz.
  - Ön inceleme yalnız günü olmayan (stok) kalemde; inceleyen
    `yetki.ts → onIncelemeci` (kolu kapsamındaki müdür, ekonomide Ekonomi
    birimi). Görüş ya da gerekçeli ret; kabul kararı toplantıda.
  - Kesinleşince kabul edilen haber Next Day'e onaylı paket olarak geçer
    (`haftalikKalemId`, "Haftalık plandan" rozeti); feature, ekonomi ve
    program plansız onaylı paket olur. Aktarım tek yerde
    (`eylemler.ts → haftaliktanAktar`); hem kesinleştirmede hem
    `planOlustur`'da çağrılır.
  - Çıktı kurumun "الأجندة الأسبوعية" belgesini izler; yazdır/PDF ve Word
    (HTML tabanlı `.doc`). E-postayı planlamacı kendisi gönderir.
- Belge görünümü (`ekranlar/belge/`, `#/nextday/:id/belge`,
  `#/haftalik/:id/belge`): plan çıktı belgesinin üzerinde düzenleniyor;
  girişi çıktı önizlemesinde ve plan başlığında "Belgede düzenle".
  - Belge bileşeni tek (`NextDayBelgesi`, `HaftalikBelgesi`): `duzen`
    verilmezse çıktı, verilirse aynı kağıt düzenlenebilir. Çıktı sayfaları
    da bunu çağırır; belge ile çıktı ayrışmaz. Bileşenin içinde bileşen
    tanımlanmaz, yoksa yazı kutusu her kayıtta sıfırlanır.
  - Satır `BelgeSatiri` + `SatirSeridi` (taşı, altına ekle, düzenle, bugün
    de geçerli, çıkar); yazılar `YerindeMetin`, seçimler plan ekranının
    formlarıyla `Pencere`de. Yeni satır türü eklenince hem belgeye hem
    şeride girer; eylemi plan ekranınınki.
  - Sıra dizinin sırası: taşıma aynı grubun komşusuyla yer değiştirir
    (`komsuylaDegis`), "altına ekle" `sonra` ile satırın arkasına koyar
    (`arkasina`). Canlı yayın saatle sıralı, taşınmaz; haftalık hareketler
    saha görevlendirmelerinden türer, belgede salt.
  - Yetki plan ekranıyla aynı (`planIcerikDuzenler`/`planOperasyonDuzenler`,
    `haftalikDuzenler`, toplantıda `kararVerebilir`). Haftalıkta belgede
    yedi gün ve karar bekleyen kalem (soluk) de var; çıktıda yok.
  - Baskı, Word ve kopya ekranda görünmeyen temiz kopyadan (`.belge-temiz`);
    Word ortak (`bilesenler/indir.ts → wordIndir`), Next Day'de de var.
- Stok haberi ayrı kayıt değil, `Paket` (`stok: true`): haftalıkta kabul
  edilen plansız feature, ekonomi ya da günü olmayan haber. Durumu
  saklanmaz, kayıttan çıkar (`akis.ts → stokDurumu`): üretime alınacak →
  üretimde → stokta → yayınlandı.
  - Kolun Planlama'ya düşen adımlarını (görev verme, Media'ya iletme,
    montaj kontrolü ve yükleme) yalnız feature/stok ekibi (`stokTakip`)
    ve Planlama yöneticisi yapar (`yetki.ts → adimYapabilir`).
  - Adımın ekrandaki adı koldan: `akis.ts → adimAdi(adim, paket)`;
    `ADIM_ADI`'yı doğrudan pakete yazma.
  - Next Day'in "Hazır paketler" bölümü (`hazirPaketler`) stoktan seçer;
    plan devredilince seçili paket `yayinlandi` alır.
- Ekonomi ayrı birim; üretimde masası yok (ekonomi paketini Planlama'nın
  feature/stok ekibi yürütür). Yöneticisinin kapsamı kola göre
  (`yetki.ts → KOL_BIRIMLERI`).
- Yönetici panelindeki "Planların durumu" kartı sekmeli (günlük, haftalık,
  özel yayın, saha); satırda yalnız ad, durum, ilerleme, ayrıntı
  `Pencere`de (yerleşik `<dialog>`). Panele yeni bilgi eklenecekse de bu
  kalıp: önce kısa satır, ayrıntı pencerede.
- Toplantı takvimine (`d.toplantilar`) yalnız akışta tanımlı toplantı
  girer (akşam haber toplantısı, Newsdesk sabah toplantısı, Perşembe
  haftalık toplantısı). Planlama takvimi ondan ayrı (aşağıda).
- Planlama takvimi (`ekranlar/takvim/`, `#/takvim/<görünüm>/<gün>`,
  `#/takvim/faaliyet/<id>`): önceden bilinen faaliyetler (seçim, zirve,
  resmî gün…), `d.faaliyetler`.
  - Tekrar saklanmaz; görünüm hangi aralığı çiziyorsa `takvim.ts →
    olusumlar` açar. Tekrarın kimliği faaliyet + başladığı gün.
  - Plana kendiliğinden dönüşmez. Editör "… ekle" deyince planda kayıt
    doğar (Next Day'e gelişme, haftalığa kalem, aylığa onaysız kalem,
    özel yayına yeni yayın ya da hazırlık maddesi), bağlantı faaliyette
    (`baglantilar`, çoka çok); plan tarafı değişmez. Plan ekranlarının
    "Takvimden" bölümü bağlantıyı tersinden okur. Aktarım tek pencereden
    (`takvim/Ayrinti.tsx → FaaliyetAyrintisi`), plan ekranı da onu açar.
  - Plana aktarım planın açık olmasını ister (Next Day yalnız bugün ve
    yarın); değilse düğme pasif, nedeni yazılı.
  - Yetki: `takvimDuzenle` (Planlama ve Yönetim; öbür masalarda yalnız
    birim yöneticisi), aktarım o planın kendi yetkisi. Muhabir yalnız
    sorumlu muhabiri olduğu faaliyeti görür (`faaliyetGorebilir`).
  - Hafta Cumartesi başlar. Renk yalnız öncelikte (`.on-*`); hatırlatma
    uygulama içinde (yan panel, ana sayfa kartı, menü sayısı).
  - Üst şeridin varsayılan kısayollarında ve telefondaki Menü'nün plan
    kutucuklarında (`PlanKisayollari`) altıncı; beş ana başlıktan biri
    olmadığı için altıncı renk değil, lacivert (`.renk-takvim`).
  - Sürükle-bırak yalnız fareyle ve tek seferlik faaliyette; taşımada
    süre korunur, kenar tutamacı tek ucu değiştirir.
- Tasarım dili `src/tasarim.css`: lacivert, beyaz, açık gri. Beş ana
  başlığın her birinin kendi rengi var, kalan her şey tek vurgu rengi.
  Ekranlarda çıplak değer yok. Yerleşim mantıksal CSS özellikleriyle;
  Arapçada sağdan sola kendiliğinden. Tek bilinçli istisna içerik
  hizası: içerik her dilde sağa yaslı.
- Workspace (`ekranlar/ortam/`, `#/ortam/:id`): kişinin birkaç sayfayı bir
  arada açtığı çalışma ortamı. Kod adı `ortam`, bölme `Bolme`; `Pano` iş
  akışı panosunun adı.
  - Üst şeritte durur (aşağıda): ana sayfa, kişinin workspace'leri, "+".
    Menüde ayrı madde değil, ana sayfanın alt sayfası; menüde ana sayfa
    vurgulu kalır.
  - Kayıtta `Durum.ortamlar` (kişi → workspace'ler), eylemler
    `eylemler.ts → ortam*/bolme*`, kurallar `ortam.ts` (sınırlar,
    `BOLMEYE_GIRMEZ`, `yerlesim`). Bölmeye kişinin menüde gördüğü sayfalar
    girer (`AnaMenu.tsx → bolmeModulleri`).
  - Bölme uygulamanın kendisi: iframe, `?bolme=1` gömülü kip
    (`yol.ts → GOMULU`, `bilesenler/Gomulu.tsx`). Menü, üst çubuk ve demo
    şeridi yok. Giriş ekranı, proje planı ve workspace bölmede açılmaz;
    yarının planını yalnız üst pencere açar.
  - Bölme geçmişi büyütmeden gezinir. Navigation API geçmişe ekleyen adres
    değişimini yerinde değişime çevirir; önceki yollar bölmenin kendi
    yığınındadır. Bölme yerini `postMessage` ile bildirir
    (`BolmeBildirimi`), üst pencere `BolmeKomutu` gönderir.
  - iframe DOM'da taşınmaz, `src`'i değişmez; taşınırsa yeniden yüklenir,
    içindeki iş gider.
    - Sıra ve yerleşim yalnız ızgara alanından (`gridArea`).
    - Arkadaki bölme `visibility: hidden`.
    - Modül değişimi bölmeye mesajla gider.
  - Yerleşim: yan yana, alt alta, ızgara 2×2, sekmeli. Telefonda hep
    sekmeli. Ayraç sürüklenir ya da ok tuşuyla kayar; boyut bölmenin
    payında (`Bolme.pay`).
  - Bölmenin içindeki yer, açık sekme ve büyütülen bölme tarayıcıda
    (`trt-planlama-ortam`), kayıtta değil: her tıklama bütün bölmelere
    kaydı yeniden okutmasın.
- Üst şerit (`ekranlar/ortam/Serit.tsx → AnaSerit`): ana sayfanın ve
  workspace'in tek satırı; bütün birimlerde. Sayfanın kullanılır alanı
  geniş kalsın diye her şey ikon, ad ipucunda (`title`, `aria-label`).
  Ayrı sekme şeridi, araç satırı ya da büyük kutucuk eklenmez; yeni iş bu
  şeride ikon olarak girer.
  - Başta ana sayfa, kişinin workspace'leri (sıra numarasıyla, ad yok),
    "+" (New Workspace).
  - Ortada açık sayfanın işleri (`ek`):
    - ana sayfada "Sayfayı düzenle" (`Calisma.tsx → SayfaDuzenDugmesi`;
      düzen kipi şeritle alanlar arasında `SeritteDuzen` ile paylaşılıyor);
    - workspace'te yerleşim, modül ekleme ve ⋯ (adlandır, sil).
  - Sonda kişinin kısayolları (`Kisayollar.tsx`). Kurallar `kisayol.ts`:
    - varsayılan planların beş ana başlığı ve takvim; muhabirde kendi
      işleri;
    - görebildiği sayfalar, en çok 10.
  - Kısayollar kayıtta `Durum.kisayollar` (kişi → sıralı yol), eylem
    `kisayollariKaydet`. Ad, ikon ve renk menüden. Renk yalnız planların
    ana başlıklarında, öbür sayfalar sade (`.renk-genel`).
  - Sınırda düğme pasif görünür ama odaklanabilir kalır (`aria-disabled`);
    nedeni ipucunda, çünkü pasif düğme ipucu göstermiyor.
- Menü tek tablo: `bilesenler/AnaMenu.tsx → MENU`. Yeni sayfa yalnız
  oraya girer; sol menüde de telefondaki panelde de çıkar.
  - Masaüstünde sol menü. Gruplar katlanır: grup adına basınca açılıp
    kapanır, kapalı grubun yanında maddelerin sayıları toplanır, açık
    sayfanın grubu kendiliğinden açılır. Başlıksız grup (ana sayfa, panel)
    ve kişinin tek maddesini gördüğü grup katlanmaz.
  - Üst çubuktaki ☰ masaüstünde menüyü tamamen gizler (sayfa tam
    genişlik, logo üst çubuğa geçer), tablette (761–960) çekmeceyi açar.
  - Gizleme ve açık gruplar kişiye değil tarayıcıya bağlı görünüm
    tercihi (dil gibi): `localStorage`, `trt-planlama-menu` ve
    `trt-planlama-menu-gruplar`; kayıt şeması değişmez.
- Telefon düzeni (760 piksel ve altı) masaüstünün küçültülmüşü değil, ayrı
  bir düzen:
  - sol menü kalkıyor, alta sekme çubuğu (`AltCubuk`) geliyor
  - "Menü" (`MobilMenu`) plan kısayollarını, bütün sayfaları, dili ve
    oturumu bir panelde topluyor
- Tablolar telefonda karta dönüyor: `tablo kartli` sınıfı, her hücrede
  `data-etiket`, başlık hücresinde `birincil`. Yeni tablo da böyle yazılır.
  Tek istisna yetki matrisi; o bir ızgara, yatay kayıyor.
- Dokunma hedefi en az 44 piksel. Telefonda yazı alanları 16 piksel; daha
  küçüğünde iPhone sayfayı yakınlaştırıyor.
- Doğrulama: `npx vite preview` ile açıp 390 piksel genişlikte her sayfada
  yatay taşmanın sıfır olduğuna bakılır, Arapçada da.
- Örnek veri kurgusal; kurumun belgelerindeki adlar dahil gerçek personel
  adı yazılmaz.
- Yorumlar Türkçe ve "neden" anlatır, "ne" değil.
- Commit iletisi maddeli: kısa başlık, sonra her madde ne değişti ve neden.
- Bir şey yapmadan önce ne yapacağını söyle.
