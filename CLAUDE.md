# TRT Arapça · Planlama ve Koordinasyon

TRT Arapça haber merkezi için planlama merkezli, birimler arası koordinasyon
prototipi. Kaynak kökte, derlenmiş çıktı `docs/` altında ve depoda.

- React + TypeScript + Vite. `npm install` bir kez; `npm run build`
  çıktıyı `docs/` içine üretiyor. **Derlemeden gönderme:** `docs/` elle
  düzenlenmez, kaynak değişince yeniden derlenir.
- Yayın iki yerde, ikisi de `main`'deki `docs/`'tan:
  - Firebase Hosting, `plannersflow.net` (projenin kendi sitesi
    `planners-flow-2026.web.app`; alan adı Cloudflare'de, DNS kaydı
    "DNS only")
    (`.github/workflows/firebase-yayin.yml`; `firebase.json` hedefi
    `uygulama`). Aynı iş Firestore kurallarını da depodakiyle eşitler.
    Anahtar depo gizli değeri `FIREBASE_SERVICE_ACCOUNT`; yoksa iş
    uyarıyla atlanır. `index.html` önbelleğe alınmaz, sürüm hemen görünür.
  - GitHub Pages (eski adres, kapatılana kadar).

  `base` göreli (`./`); depo adı ya da alan adı değişse de yapılandırma
  değişmiyor. Demo verisi tarayıcıda adrese bağlı: yeni adreste demo
  örnek kayıtla baştan açılır.
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
  - `eposta.ts`: çağrı e-postası ("Outlook'ta aç" `.eml` taslak dosyası;
    dosyasız mailto denendi, bilgisayarda sessizce açılmadı. "Telefonda aç"
    mailto, BCC sığmazsa panoya) ve gelen yanıtı
    eşleştirme kuralları; saf, sunucu fazında posta kutusunu izleyen hizmet
    de aynısını kullanacak (`belgeler/eposta-entegrasyonu.md`). Next Day
    etiketi `ND-`, haftalık `HP-` (haftanın Cumartesi'si)
  - `haftalik.ts`: haftalık planın okuma kuralları (gündemde mi, karar
    bekleyen, Next Day'e gider mi, ön inceleme bekleyenler)
  - `takvim.ts`: planlama takviminin okuma kuralları (tekrarların açılımı,
    yaklaşanlar, hatırlatma, yıllık yoğunluk, arama ve süzgeç)
  - `oturum.ts`: oturumdaki kişi (demoda seçim, gerçek kipte Firebase)
  - `kip.ts`: demo/gerçek kip ve gerçek kipin açılış durumu
  - `depo/fark.ts`: gerçek kipte eski ve yeni `Durum` arasındaki yazılacak
    belgeler (saf); `depo/firebase.ts`: Auth, davet, Firestore (yalnız
    gerçek kipte, sonradan yüklenen parça)
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
  - Next Day çalışma ekibindeki görev adları (منتج تنفيذي…) her arayüz
    dilinde çıktıdaki Arapçasıyla, form seçiminde de.
  - Planın "ŞEHİR / BAŞLIK / MUHABİR" satırı çıktıdaki gibi baştan sona
    Arapça (`satir`, `sehirAr`, `kisiAr`, `etiketler.ts`).
  - Kişi adı her arayüz dilinde Arapça yazımıyla (`useDil().ad`; kurum
    kararı). Latin yazım aramada, avatarın baş harfinde ve profilde adın
    altında. Kişi formlarında (davet, hesapsız, kayıt, düzenle) Arapça ad
    önde ve zorunlu. Notlar ve gerekçeler yazıldığı dilde (`dir="auto"`).
- Marka Plannersflow (`bilesenler/Logo.tsx`; dosyalar `src/varliklar/
  logo-plannersflow*.png`). Her dilde aynı, aynalanmaz. Yatay düzen (işaret
  solda, yazı sağda): menünün ve üst çubuğun alçak satırında alt alta
  düzenin yazısı okunmaz. Koyu zeminde (sol menü, giriş, proje planı)
  `<Logo koyu />` ("Planners" beyaz), açık zeminde düz `<Logo />`. Boyu
  yerine göre `--logo-*` token'larından. Favicon işaretin kendisi
  (`varliklar/simge.png`, `simge-180.png`). Kurumun eski logosu kalktı;
  paket ve klip kodlarındaki `TRT-AR`, `TRTA_` kurum kodu, marka değil.
- Haber türü (biçim: PKG, Live, Vox Pop…) kol'dan (haber, feature/ekonomi,
  program) ayrı alan. Kol akışı belirler, biçim ekrana nasıl çıktığını.
- Demoda veri tarayıcıda (`localStorage`, anahtar `trt-planlama-v23`;
  şema değişince anahtar da değişir) ve örnek kayıtla açılıyor. Gerçek
  kipte (aşağıda) kayıt Firestore'da; ekranlar ve eylemler aynı
  `useVeri`/`getir`/`kaydet`'i kullanıyor, fark yalnız `veri.ts`'in
  yükle/kaydet kısmında.
  - Aynı kaydı birden çok kopya paylaşıyor (workspace bölmeleri, sekmeler).
    Her yazış bir iz bırakır (`trt-planlama-v23-iz`); `getir` iz
    değişmişse kaydı yeniden okur, yani her eylem en taze kayıttan başlar.
  - `storage` olayı öbür kopyaları yeniden çizer; dil ve oturum da öyle.
  - Eylem kaydı yazarken temeli `getir()`'den alır; ekrandaki `useVeri`
    kopyası bayat olabilir, onunla yazma.
- Giriş demo: kişi seçiliyor, şifre yok. Muhabir yalnız kendi işini görür.
  Bildirimi de yalnız kendisiyle ilgili (`yetki.ts → muhabirBildirimi`):
  ona yazılan, alıcısı olduğu çağrı, kendi önerisine dönen karar ve yanıt,
  kendi haberinde sıranın ona geçtiği adım ve sonucu (öncelik, iptal,
  yayın); ara işler (kontrol, Media, not) zile düşmez.
  Yetki hem düğmede hem eylemde soruluyor.
- İzleme (`izleme.ts`): tam yönetici Organizasyon › Kişiler'de ve Hesaplar'da
  kişinin yanındaki 👁 (`Kullanicilar.tsx → IzleDugmesi`) ile sitenin o kişiye
  göründüğü halini açar: `useBen()` izleneni döndürür (menü, ana sayfa, yetki
  onun), oturum yöneticide kalır (`useGercekBen`). Yazış kapalı: `veri.ts →
  kaydet` izlemede hiçbir şey yazmaz, "değişiklik kaydedilmedi" bildirir;
  sistemin yazışları (yarının planı) da durur, yapay zeka düğmeleri görünmez
  (kapı yöneticinin oturumuyla çalışırdı). Sekmeye bağlı (`sessionStorage`,
  `trt-planlama-izleme`; bölmeler de izler), sekme kapanınca ya da şeritteki
  "Çık"la biter; kişi değişince ya da tam yönetici olmayanda iz silinir.
  Kabukta "X olarak izliyorsun" şeridi.
- Tanıtım sayfası (`ekranlar/Tanitim.tsx`): adres çıplak açılınca (hash
  yok) demoda tanıtım gelir; `#/tanitim` her kipte açar. Üstte Demo
  (demo kişi seçimi) ve Giriş (`#/gercek-giris`). Gerçek kipte kalmış
  kişi çıplak adreste doğrudan sisteme girer. Sayfa içi bağlantı `#…`
  olamaz (hash yönlendirmesi), bölümlere düğmeyle kayılır. Logoya üç tık
  kalktı.
- Gerçek kip (`kip.ts`, `belgeler/gercek-kip.md`): giriş tanıtımdaki
  "Giriş"ten (`#/gercek-giris`, `ekranlar/GercekGiris.tsx`); demodan
  kullanıcı menüsündeki "Kurum girişi"nden de.
  - Gerçek kipte üst çubukta "Demo" (ve kullanıcı menüsünde "Demoyu
    dene"; `kip.ts → demoyuAc`): Firebase oturumu kapanmadan demoya geçer.
    Girişe dönen kişinin oturumu tarayıcıda açıksa şifre sorulmaz
    (`depo/firebase.ts → sakliOturum`). Çıkış oturumu kapatıp tanıtıma döner.
  - Hesap davetle açılır (`ekranlar/Kullanicilar.tsx`, yalnız hesap
    yöneticisi). Etkin kişinin adı, birimi, görevi ve rolü aynı sayfada
    "Düzenle" ile değişir (`eylemler.ts → kisiPozisyonu`, kendisininki
    dahil). Kişi e-postadaki Firebase bağlantısıyla etkinleşir, şifre
    belirler; kişi kaydı davetten kurulur, kimliği Firebase uid'si.
  - E-posta "Düzenle" penceresinden (`eylemler.ts → kisiEpostasi`, yetki
    `yetki.ts → epostaDegistirebilir`): hesapsız kişide (ve demoda) doğrudan
    değişir. Etkin hesapta giriş adresi Firebase'de: yeni adres kişide
    `yeniEposta` olarak işaretlenir, o adrese `kisiId`'li aktivasyon daveti
    gider (yöneticilik ve yetkiler davette, `Davet.yetkiler`); listede
    "aktivasyon bekleniyor". Kişi yeni adresle etkinleşince `hesabaGecir`
    kaydı yeni hesaba taşır, eski kaydı siler; o zamana kadar eskisiyle
    girer. Kural eski kaydı yalnız `yeniEposta` adresinin sahibine, aynı
    yetkilerle sildirir. Yöneticinin ya da yetkili kişinin adresini yalnız
    tam yönetici değiştirir.
  - İkinci yol kayıt bağlantısı: yönetici paylaşılabilir, 7 günlük bağlantı
    açar (`kayitBaglantilari` koleksiyonu, `#/kayit/<kod>`,
    `ekranlar/KayitSayfasi.tsx`; demo açıkken de çalışır). Kişi adını,
    birimini, görevini ve şifresini kendisi girer; bilgiler başvuru belgesinde
    (`kayitBasvurulari/<e-posta>`, kural yalnız açık bağlantının koduyla
    yazdırır), doğrulama e-postasının dönüş adresinde (`kayit=`) ve
    tarayıcıda taşınır; `ilkKayit` kaydı hangisi varsa onunla kurar. Hesap
    önceden açılmışsa: şifre aynı ve e-posta doğrulanmışsa form kaydı kurup
    içeri alır; değilse şifre belirleme e-postasını kendisi gönderir
    (`kayit/sifre-gitti`), kişi yeni şifresiyle girince kaydı başvurudan kurulur. Personel,
    hesap yöneticisi değil, `kontrolBekliyor` işaretli; yönetici
    "Düzenle"de kaydedince işaret kalkar. Kural `kayitGecerli` (açık,
    süresi geçmemiş, e-posta doğrulanmış, yöneticisiz).
  - Hesapsız kişi (pilot; sistemi kullanmayan personel): yalnız adı var
    (`Kisi.hesapsiz`), her seçimde görünür, giriş yapamaz; işini Planlama
    onun adına görür. Kullanıcılar'daki "Kişi ekle" kartından
    (`eylemler.ts → hesapsizKisiEkle`). "Hesaba bağla" davete `kisiId`
    koyar; kişi etkinleşince `oncekiKimlik` taşır ve açılışta
    `hesabaGecir` eski kimliği bütün kayıtlarda yenisiyle değiştirir,
    eski kaydın profilini alır, eski kişi belgesini siler (kural bunu
    yalnız `oncekiKimlik`'i onu gösterene izin verir).
  - Kurumun muhabir listesi (Excel) Kullanıcılar › "Excel'den muhabir
    aktar" ile hesapsız muhabir olarak girer (`iceAktar.ts`: kitaplıksız
    .xlsx okuyucu ve başlık adıyla sütun eşleştirme; `eylemler.ts →
    muhabirleriIceAktar`). Gerçek kişi bilgisi depoya ve koda girmez,
    dosya tarayıcıda okunur. Pasaport, cinsiyet, doğum sütunları okunmaz.
    Aynı e-posta ya da Arapça ad kayıtlıysa atlanır; liste ikinci kez
    yüklenince çoğalmaz. Listedeki konum yazımları `KONUM` tablosuyla
    şehre bağlanır; tanınmayan İstanbul'a yazılır ve önizlemede uyarılır.
  - Muhabirin görev yaptığı şehir profil formunda ("Profili düzenle"; kişinin
    kendisi ve `profilDuzenle` yetkisi): listede yoksa "+ Yeni şehir…" ile
    Arapça adı (zorunlu), Türkçe ve İngilizce adı, ülkesi girilir. Yerleşik
    şehirler `veri.ts → SEHIRLER`, eklenenler kayıtta (`Durum.sehirler`,
    `profilGuncelle(…, yeniSehir)`); aynı Arapça adlı şehir varsa (yerleşik
    de) o kullanılır, liste çoğalmaz. Ad, ülke ve seçim listesi
    `etiketler.ts → sehirAdi`, `sehirUlkesi`, `sehirListesi`'nden;
    `SEHIRLER[...]`'a ve `s_<şehir>` anahtarına doğrudan bakılmaz (eklenen
    şehirde boş kalır). Gerçek kipte `sehirler` koleksiyonunu herkes okur,
    kısıtlı muhabir yalnız yeni şehir ekler (kural), var olanı değiştiremez.
    Excel aktarımı eklenen şehrin adlarını da tanır.
    Hesaplar'da her satırda şehir seçimi (`bilesenler/SehirSecimi.tsx →
    SatirSehirSecimi`): seçilen hemen kaydedilir (`eylemler.ts → kisiSehri`;
    profili düzenleyebilen ya da `kisiDuzenle` yetkili), "+ Yeni şehir…"
    küçük pencerede; "Düzenle" penceresinde de şehir. Seçenekler ve yeni şehir
    alanları her yerde aynı bileşenden (`SehirSecenekleri`, `YeniSehirAlanlari`).
  - Muhabir listesinde ve profilde WhatsApp düğmesi (`bilesenler/
    WhatsApp.tsx`): telefonda `wa.me`; numara uluslararası biçime çevrilir
    ("00…", başta tek sıfır Türkiye). Bilgisayarda önce masaüstü uygulaması
    (`whatsapp://`; kurum onu kullanıyor, açık uygulamada sohbet açılır).
    Uygulama açılınca sayfa odağı kaybeder; 1,5 saniyede kaybetmezse
    uygulama yok sayılır, WhatsApp Web açılır. Ayarlar'da "Bilgisayarda
    WhatsApp": otomatik / uygulama / Web, tarayıcıda (`trt-planlama-whatsapp`).
    Web sabit adlı pencereye açılır (`plannersflow-whatsapp`, `rel` yok);
    kişinin kendi açtığı WhatsApp Web sekmesine site ulaşamaz.
  - Seçmeli hesap yetkileri (`veri.ts → HESAP_YETKILERI`, `Kisi.yetkiler`):
    davet, kayıt bağlantısı, kişi düzenleme, hesap kapatma/açma, hesapsız
    kişi ekleme. Tam yönetici (`hesapYoneticisi`) hepsine sahip; yetki
    vermek ve tam yönetici yapmak yalnız onda ("Yetkiler" penceresi,
    `kisiYetkileri`); kişi silme de bu listede. Programda `yetki.ts → hesapYetkisi`, kuralda
    `yetkiVar`; davet yetkisiyle yönetici davet edilemez, tam yöneticinin
    hesabı yalnız tam yöneticice kapatılır. Kişi belgesinde bu alanlar
    yalnız doluyken yazılır (`depo/fark.ts`), yoksa eski belgeye yazış
    yetki alanı değişmiş sayılır.
  - Kişi silme (`eylemler.ts → kisiSil`, yetki `kisiSil`): tam yönetici ya
    da yetkili (tam yöneticiyi değil); kimse kendini silemez. Açık
    planlarda (taslak, toplantıda) ekipten ve başlık muhabirlerinden
    çıkar, kişiye bağlı görünüm kayıtları gider; geçmiş kayıtlar kimliği
    tutar. Kural `kisiler` silmede aynısını sorar. Firebase'deki giriş
    hesabı kalır ama kişi kaydı olmadan giremez.
  - Etkinleştirmede Firebase giriş bağlantısı (e-posta linki) kullanılmıyor:
    ücretsiz planda günde 5. Davette davetliye ikinci Firebase örneğinde
    (`hesap-acici`, yöneticinin oturumu değişmesin) rastgele şifreli hesap
    açılır, "şifreni belirle" e-postası gider (`baglantiGonder`, günde 150);
    kişi şifreyle girer (`?giris=sifre`). Kayıt bağlantısında kişi şifresini
    formda belirler, doğrulama e-postası gider (`kayitOl`, günde 1000);
    doğrulamadan kayıt kurulmaz (`ilkKayit → "dogrulanmadi"`). Eski
    bağlantılar (`?giris=baglanti`) çalışmaya devam eder. Sınır dolarsa
    `auth/quota-exceeded` açık mesajla; tanınmayan kod mesajda yazılır
    (`GercekGiris.tsx → hataKodu`).
  - Kurucu (ilk yönetici; Planlama'da planlamacı, yönetici rolü) davetsiz
    girebilen tek adres:
    `firebase-ayar.ts → kurucu` ve `firestore.rules → kurucuEposta()`.
  - Kayıt boş başlar. `Durum`'un her dizi alanı bir koleksiyon, her öğe bir
    belge (`{s: sıra, j: JSON}`); kişiye bağlı haritalarda anahtar başına
    belge. `kaydet` yalnız farkı yazar (`depo/fark.ts`); eylemler değişmeyen
    öğenin nesnesine dokunmamalı, fark nesne kimliğiyle çıkıyor.
  - Okuma da fark (`depo/fark.ts → farkAlaniMi`, `depo/firebase.ts`;
    ücretsiz planın günlük 50.000 okuması her açılışta bütün kaydı okumakla
    doluyordu): kişiler dışındaki belgede sunucu zamanı `z`; silme belgeyi
    kaldırmaz, `silindi` işaretiyle yazar. Bir tarayıcıda bir kez tam okunan
    koleksiyon (`trt-planlama-tam-okunan:<proje>`) açılışta Firestore
    önbelleğinden kurulur, sunucudan yalnız `z`'si yeni olanlar gelir.
    Önbellek sınırsız; boşsa tam okunur. Kayda REST ya da başka yoldan
    yazan da `z` yazmalı, yoksa sonradan açılan tarayıcı o değişikliği görmez.
    Sistemin yazışları (`App.tsx → yokla`: yarının planı, aktarımlar, çift
    plan toplama) "hazır"da değil, bütün koleksiyonlar sunucudan bir kez
    teyit edilince başlar (`depo/firebase.ts → sunucuGeldi`, `kip.ts →
    sunucuyaEsitlendi`, `useSunucuyaEsit`; dinleyiciler
    `includeMetadataChanges`). İlk görüntü önbellekten geliyor: bayat
    önbellekli tarayıcı başka cihazda açılmış planı "yok" sanıp aynı
    kimlikle şablondan yeniden yazıyor, gün içindeki düzenleme ve silmeler
    gidiyordu. Kişinin kendi yazışı da öyle: eşitlenmeden `veri.ts → kaydet`
    yazmaz, "eşitleniyor, kaydedilmedi" bildirir (`trt-esitlenmedi`); eşitlik
    bütün dinlenenlerden (kısıtlı kişinin tek belgeleri, genel ayar dahil)
    sunucu teyidiyle, bir kez olunca bağlantı kopsa da sürer. Hesap
    geçişleri de eşitlenince (`kip.ts → sunucuyaEsitOlunca`).
    `yarinPlaniniAc` ayrıca planın izi (açılış hareketi, ona bağlı
    gelişme, canlı, paket) varken de açmaz. O ezilmede düşen başlıkların
    gelişme, PKG ve canlıları ayrı belgelerde kaldı: Next Day ekranında
    "Başlığı kaybolmuş N kayıt" şeridi (`nextday/Plan.tsx → KayipSeridi`,
    kural `kayipKayitlar.ts`, eylem `kayipBaslikGeriGetir`; plan içeriğini
    düzenleyen), grup grup başlık seçilip geri konur: başlık planda yoksa
    kayıtların gösterdiği kimlikle eklenir, varsa kayıtlar ona geçer;
    önerinin ya da Weekly kaleminin dosyası önerilir. Başlık çıkarma
    altındakileri sildiği için şerit olağan akışta çıkmaz.
    Zaman sorgusunda `removed` silme sayılmaz (`diziDinle → isle(alan,
    true)`): kendi yazışımız sunucuya varana dek `z` bekleyen sunucu zamanı,
    belge sorgudan bir an çıkıyor; silinmiş sayılınca kayıt ekrandan kalkıp
    sayfa başa dönüyordu (haftalık toplantıda her kararda).
  - Kurallar (`firestore.rules`) "etkin kişi"yi, hesap alanlarını
    (`pasif`, `hesapYoneticisi`, `eposta`) ve kısıtlı kişiyi denetliyor;
    öbür birim yetkisi programda. Davetler `Durum`'da değil, `davetler`
    koleksiyonunda.
  - Muhabir yalnız kendi işini görür, kural düzeyinde (`depo/fark.ts →
    kisitliJson`, `KISITLI_OKUR`, `erisimListesi`; `yetki.ts → kisitliKisi`).
    Kısıtlı kişi: dış muhabir (`birim === "muhabir"`) ve kayıt bağlantısıyla
    gelip yönetici onayı bekleyen (`kontrolBekliyor`; kabukta "onay
    bekliyor" satırı). Kural onu kişi kaydının metninden aynı desenle tanır.
    - Kısıtlı kişinin okuduğu koleksiyonlarda (öneri, paket, takip,
      görevlendirme, faaliyet, mesaj, yanıt, çağrı, hareket) her belgede
      erişim listesi `m`: muhabirin kendi işi ve ona bağlı olanlar
      (önerisinin mesajı, paketinin hareketi, alıcısı olduğu çağrı). Liste
      yazışta kayıttan hesaplanır, "silindi" işaretinde de kalır.
    - Tarayıcısı yalnız `m`'sinde kendisi (ya da hesaba bağlanmadan önceki
      kaydı) olanları, kısıtsız kişileri (`kisiler.kisitli == false`) ve
      kendi kaydını, yapıyı, genel ayarı ve kendi ayar belgelerini dinler
      (`depo/firebase.ts → kayitBagla`). Planları, başlıkları, öbür
      muhabirleri hiç almaz.
    - Yazış: yalnız öneri, paket, takip, mesaj, hareket (listesinde adı
      kalan) ve kendi ayarları; kendi kişi kaydında kısıtı değiştiremez
      (birim, onay işareti yalnız kişi düzenleme yetkisiyle).
    - Sistemin yazışları (yarının planı, plan çiftleri) kısıtlı kişide
      çalışmaz (`App.tsx`): planı göremeyen boş plan yazardı.
    - Hesaba bağlanan muhabir yalnız gördüğünü taşır (`kendiKayitlariniTasi`);
      gerisini ve eski kaydın silinmesini tam yöneticinin tarayıcısı yapar
      (`bekleyenGecisleriTamamla`, açılışta ve kişi listesi değişince).
    - Tam yönetici açılışta erişim listelerini ve kişilerin `kisitli`
      işaretini kayıtla eşitler (`erisimiTazele`): listeden önce yazılmış
      belgeler ve öneriye sonradan bağlanan kayıt muhabire böyle görünür.
  - Gerçek kipte prototip etiketi, örnek veri ve "Örnek veriye dön" yok;
    çıkış tanıtıma döner. Firebase yapılandırması boşsa giriş ekranı nedenini
    yazar, demo etkilenmez.
- Yapay zeka (`belgeler/yapay-zeka.md`): Cloudflare Workers'ta yapay zeka
  kapısı (`worker/`, `yz.plannersflow.net`); veritabanı Firebase'de kalıyor.
  - **Kapı (`worker/`):**
    - Firebase oturum belgesini Google'ın açık anahtarlarıyla doğrular
      (`dogrula.ts`).
    - Kişi kaydını Firestore REST'ten kişinin kendi oturumuyla okur
      (pasif, `hesapYoneticisi`, birim).
    - Sağlayıcıyı çağırır (`saglayici.ts`): Claude resmî SDK'yla (düşük
      effort, destekleyen modelde `fallbacks: "default"`), öbürleri OpenAI
      uyumlu uçla.
  - **Ayar kapının KV deposunda, Firestore'da değil:** sağlayıcılar,
    anahtarlar, uç nokta adresleri, özellikler (açık, sağlayıcı, birimler,
    kişi başına günlük sınır).
    - Firestore'u her etkin kişi yazabildiği için adres oradan okunsaydı
      anahtar başka sunucuya yönlendirilebilirdi.
    - Model sağlayıcının listesinden seçilir (`/modeller`, "Modelleri getir";
      formdaki yeni anahtar yalnız o istekte kullanılır). Hata metinleri
      sağlayıcının kendi iletisiyle (`ayrinti`).
    - Claude sağlayıcısında isteğe bağlı "Çalışma alanı kimliği"
      (`Saglayici.calismaAlani`): anahtar Console'da bir çalışma alanına bağlı
      değilse Anthropic `anthropic-workspace-id` başlığını istiyor (400);
      kapı onu sohbete ve model listesine ekler (`saglayici.ts →
      claudeIstemcisi`, SDK `defaultHeaders`). Gizli değil; yalnız harf,
      rakam, `-`, `_` (başlığa başka şey sızmasın).
    - Beklenmeyen hata (KV yazışı reddedildi…) de izin başlığıyla `kapi` ve
      nedeniyle döner (`index.ts → isle`): Cloudflare'in kendi 500'ünü
      tarayıcı okuyamıyor, ekran "kapıya ulaşılamadı" diyordu. Ayar
      kaydetmede ekran kodu ve ayrıntıyı olduğu gibi yazar.
    - Anahtar yalnız yazılır, ekrana son dört hanesi gelir. Anahtar alanı
      gönderilmezse eskisi kalır, boş metin siler (`ayar.ts →
      ayarBirlestir`).
  - **İstemci (`src/yz.ts`):** `useYz(ozellik)` (açık mı, kalan hak),
    `yzCalistir`; tam yöneticiye Ayarlar › Yapay zeka (`ekranlar/
    YapayZeka.tsx`, yalnız gerçek kipte; demoda durum satırı).
    - Kapıya ulaşılamazsa özellik görünmez.
    - Demoda kapıya gidilmez, "Kısalt" ilk cümleyi verir.
  - **İlk özellik "Kısalt":** Next Day gelişme formunda, haftalık kalem ve
    ana dosya formunda (`bilesenler/YzKisalt.tsx`).
    Sonuç forma gelir, kişi kaydeder; "Önceki metin" geri alır. Belgede
    (Next Day gelişmesi, haftalık kalem ve ana dosya) satır yerinde
    düzenlendiği için satırın şeridinde ✨ (`YzKisaltSerit`):
    sonuç hemen kaydedilir, ↶ geri alır. Ayarlar'da özelliğin yanında "senin
    için açık/kapalı"; kapalı görünen durum sekmeye dönünce yeniden sorulur.
  - **"Biçimle"** (`bilesenler/YzOneri.tsx → YzBicimle`): öneri formlarında
    (yeni öneri `OneriAlanlari`, düzenle ve yeniden gönder `KisaOneriFormu`)
    Header, Strap, gelişme ve haber türü önerir; alan alan "Uygula" ya da
    "Hepsini uygula", "Önceki metin" geri alır, kişi kaydeder. Kapıya başlık
    havuzu (uyan dosya aynı adla gelsin) ve Planlama'nın son düzeltmeleri
    gider (`ilkHali` → havuzdaki başlık, plandaki gelişme): kurumun biçimi
    örnekten, eğitimsiz.
  - **"Haber değeri"** (`YzHaberDegeri`): öneri penceresinde ve ayrıntının
    değerlendirme kartında ölçüt başına 1–5 puan, gerekçe (isteyenin arayüz
    dilinde) ve genel kanaat; kartta rozet (`YzGorusRozeti`). Yalnız tavsiye,
    kararı değiştirmez. Görüş öneriden ayrı kayıtta (`Durum.yzGorusleri`,
    öneri başına bir, `eylemler.ts → yzGorusKaydet`), ekibin hepsi görür,
    muhabir görmez (`yetki.ts → yzGorusuGorur`); öneri silinince izi gider.
  - **"Son gelişmeler"** (`bilesenler/YzTakip.tsx → YzSonGelismeler`,
    kapıda `takipMetni`): başlık için internette arayıp kısa Arapça takip
    paragrafı (son 24 saat / 3 gün / 7 gün). Next Day'de başlığın "+"
    menüsünden pencere, "Gelişme olarak ekle" (kaynak türü medya, adı
    alıntılanan siteler); Weekly'de ana dosya formunda "Durum özetine
    yaz"; başlığın sayfasında yalnız kopyala. Bizdeki son satırlar gider
    (`baslikGecmisi`), model yenisini yazsın. Kaynak bağlantıları modelin
    yazdığı değil, sağlayıcının alıntıları; metne sızan bağlantı ayıklanır.
    Arama: Claude'da `web_search` aracı (`pause_turn` sürdürülür), OpenAI'da
    Responses API `web_search` (yoksa "arama" hatası); Ayarlar'da site
    listesi (`alanlar`, alan adına indirgenir; tanımayan uçta süzgeçsiz).
  - Ayarlar'da her özelliğe yöneticinin yönergesi (`yonerge`, varsayılan
    yönergenin arkasına; çelişirse o geçerli) ve haber değerine ölçütler
    (`kriterler`, boşsa `dil.ts → yzVarsayilanKriterler`, kapıdakiyle aynı).
    Alanlı sonuçlar JSON; kapı ayıklar (`ozellikler.ts → sonucCoz`), biçimi
    bozuk yanıt hak yemez. OpenAI'da JSON kipi, tanımayan uçta onsuz.
  - **Dağıtım:** `.github/workflows/yz-yayin.yml`. Gizli değerler
    `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; yoksa uyarıyla atlanır.
    KV kimliği dağıtımda yazılır (`wrangler.toml`'da `KV_KIMLIGI` yer
    tutucu).
  - **Testler:** `cd worker && npm test`.
- Organizasyon (`ekranlar/organizasyon/Organizasyon.tsx`, `#/organizasyon/<sekme>`;
  menüde Kullanıcılar'ın yerinde, eski adres Hesaplar sekmesini açar): kurumun
  yapısı veri (`yapi.ts`). Varsayılan yapı koddaki sabitlerin birebir karşılığı.
  - "Birimler ve ünvanlar": her birim bir kart, ünvanları içinde kıdem
    sırasıyla (`BirimTanimi.unvanlar`; ör. Newsdesk'te Executive Producer,
    Program Editor, Senior Producer…). Ünvan yazılıp eklenir (başka birimdeki
    ünvanın adı yazılırsa aynı ünvan eklenir, çoğalmaz; benzeyenler kutunun
    altında düğme, `datalist` değil: Android'de klavye dili değişince klavyeyi kapatıyordu), oklarla sıralanır,
    kalemle adı (üç dilde) ve "muhabir ünvanı" işareti değişir, birimden çıkarılır
    (kişisi ya da durağı varsa çıkmaz). Seçimler (`unvanListesi(birim)`) ve
    Kişiler ağacı bu sırayı izler; birimin ünvanı yoksa bütün ünvanlar.
    Birim: ad üç dilde, gizle, sil. Hepsi taslakta düzenlenir (`Durum.yapiTaslaklari`, yönetici başına),
    "Yayınla" yeni sürüm açar (`Durum.yapilar`); Sürümler'de eskisi taslağa
    alınıp geri getirilir. Yalnız tam yönetici (`yetki.ts → yapiDuzenleyebilir`,
    kuralda `yapilar`/`yapiTaslaklari` yazımı); demoda kurgusal yönetici `yo3`
    (örnek kişi listesinin sonunda: örnek veri sıradan türüyor).
  - Birimler ağaç (`BirimTanimi.ust`, derinlik serbest): iki kök, "Haber
    merkezi" (`KOK_MERKEZ`) ve "Dış muhabirler" (`KOK_DIS`); varsayılanda
    Input (Planlama, Newsdesk, News Gathering, Ekonomi), Output (Output,
    Media), Program, Yönetim ve Dış muhabirler › Muhabir. Grup düğümünün
    ünvanı yok. Birim penceresinde üst birim seçilir, oklar kardeşler arasında
    sıralar; altında birim olan silinmez (`orgAltBirimVar`). Yardımcılar
    `birimAgaci`, `ustBirimler`, `altindaMi`, `disMuhabirMi`. Eski yayın
    okunurken `tamamla` ağacı ve ekip görevlerini varsayılandan doldurur.
  - Plan ekibi (`organizasyon/EkipSekmesi.tsx`, `Yapi.ekipGorevleri`): Next
    Day ekibindeki görevler (منتج تنفيذي…) ve kuralları. Görev adı Arapça
    zorunlu; kural birim + ünvan seçimi (boşsa hepsi; birim seçimi altını da
    kapsar), pencerede kurala uyan kişi sayısı. Ekibe ekleme formu ve belge
    penceresi adayı `ekipAdayi(kisi, gorev)` ile süzer; sıra ve ad
    `ekipGorevListesi`/`ekipGorevAdi`. Geçmiş plan yüklemesinde açılan kişi
    görevin kuralındaki ilk birim/ünvanla (`eylemler.ts → ekipKisisi`).
  - İç muhabir: haber merkezindeki birimde "muhabir ünvanı" işaretli ünvan
    (`UnvanTanimi.muhabir`, `icMuhabirMi`). Plan ve paket muhabir seçicisinde
    (`MuhabirSecici`) dış muhabirlerden ayrı grupta; öneri, e-posta çağrısı
    ve yazışma seçicilerinde yok (`ic={false}`).
  - Kişi formları (davet, hesapsız, düzenle/tayin, kayıt bağlantısı) birim ve
    görevi `bilesenler/BirimSecimi.tsx`'ten alır: birim ağaç sırasıyla, grup
    seçilemez (`grupMu`, `kisiBirimSecenekleri`); görev yalnız birimin
    ünvanları, birim değişince birimin ilk ünvanına geçer (`birimeUygunUnvan`).
    Rol seçilmez, ünvandan gelir (`UnvanTanimi.yonetici`, "yönetici ünvanı";
    yerleşikte yönetici ve müdürler): yönetici ünvanına gelen yönetici,
    ayrılan personel olur, öbür tayinde rol değişmez (`unvandanRol`).
  - Dış muhabirin ünvanı şehrinden, kendiliğinden: "<Şehir> muhabiri"
    (`muhabir-s-<şehir>`, `yapi.ts → sehirMuhabirUnvaniId`). Adı `gorevAdi`
    şehirden türetir, yapıda kaydı gerekmez; şehir sonradan eklense ya da adı
    değişse de doğru çıkar. Kişi düzenleme penceresinde dış muhabire görev
    sorulmaz, şehir seçilir (altında çıkacak ünvan yazılı); öbür personelde
    şehir sorulmaz. Şehir nerede değişirse (profil, Hesaplar satırı,
    düzenleme) ünvan da değişir (`yapi.ts → yerUnvaniUygula`; sistemin verdiği
    ünvan, yani genel "Muhabir" ya da `muhabir-…`; elle verilene dokunmaz).
    Eski kayıtları açılışta sistemin işi eşitler (`eylemler.ts →
    muhabirUnvanlariniEsitle`), gerçek kipte kişi listesi değişince tam
    yöneticinin tarayıcısı da. Önce ülkede tek muhabir varsa ülke adı
    veriliyordu; kurum şehri istedi. Excel aktarımı şehrin ünvanıyla açar.
    Kişiler sekmesindeki "Muhabirlere yer ünvanı ver" (`muhabirlereUlkeUnvaniVer`)
    yapıdaki eski yer ünvanlarını toplar. Yer birim değil ünvan: yetki ve
    ekranlar birimin "muhabir" olmasına bakıyor.
  - Yerleşik birim ve ünvan silinmez, gizlenir; kişisi ya da durağı bağlı olan
    da (`birimEtkisi`, `unvanEtkisi`). Birime özel davranış (Planlama planı
    yapar…) yerleşikte kalır; yeni birim seçilen yerleşik birim "gibi" çalışır
    (`BirimTanimi.ornek`, `izinBirimi`: sayfa ve işlem izinleri, ana sayfanın
    varsayılanı), örneksizse yalnız herkese açık sayfalar (`SAYFA_IZNI` `HERKES`;
    ana sayfa da bunlardan, `GenelAna`: yoksa örneksiz birimdeki kişi girince
    "erişimin yok"ta kalıyordu).
  - Ekranda birim ve ünvan adı `birimAdi`/`gorevAdi`, seçimler
    `birimListesi`/`unvanListesi` (gizli olan yalnız şimdiki değerse görünür).
    `BIRIM_ADI`/`GOREV_ADI`'yı ekrana doğrudan yazma.
  - Plan yetkileri (`organizasyon/PlanYetkileri.tsx`, `#/organizasyon/planlar`;
    Ayarlar › İş akışı kartından da): Next Day'i toplantıya götürme/taslağa
    alma, onay, devir; Weekly'yi toplantıya götürme/hazırlığa alma,
    toplantıda karar, kesinleştirme. Kural yapıda (`Yapi.planYetkileri`,
    taslak ve "Yayınla"; yoksa `VARSAYILAN_PLAN_YETKILERI`, bugünkü
    davranış): satırlar (birim alt birimleriyle ve örnek aldığı yerleşik
    birim "gibi", istenirse ünvan, "yalnız yöneticiler"; birimsiz satır
    bütün haber merkezi) ya da adıyla kişiler (`adimYetkilisi`). Kimseyi
    kapsamayan kural kaydedilmez, adım kilitlenirdi. Düğme de eylem de
    `yetki.ts → planAdimiYapabilir` sorar; `planOnayla`, `planDevral`,
    `haftalikKesinlestir` artık `IZINLER`'de yok (proje planının matrisi
    varsayılan kuraldan). Yetkisi olmayan planlamacı Weekly'de kimin
    kesinleştirdiğini görür (`AdimYetkilileri`). Plan içeriğini düzenleme
    (`planDuzenle`, `haftalikDuzenle`) ayrı, değişmedi.
  - Kişiler: birim ağacı → ünvan (sayılar alt birimleri de toplar), "Tayin et" (`kisiPozisyonu`; birim ya da ünvan
    değişince `kisiTayinEdildi` hareketi, kişiye bildirim).
  - İş akışları (`organizasyon/Akislar.tsx`): kolların sahibi; her kolun bir
    akışı (yeni akış seçilenin kopyasıyla açılır, kol tek akışta). Durak kartı
    taşınır (oklar, sürükle), eklenir, silinir (son durak değil; bekleyen paket
    varsa söylenir). Durak: tür (programın bildiği iş ya da genel iş "Tamamla ve
    geç"), sorumlu (kolun sahibi, birim, ünvan [birimde], kişiler), birlikte
    çalışan birimler, "yalnız sahada", "geri gönderebilir", aşama.
  - Davranış durağın kimliğinden değil türünden: ekran ve eylem `adimTuru(p)`
    sorar, `p.adim === "kontrol"` yazılmaz. Geri gönderilen iş geride kalan son
    metin durağına, yoksa bir öncekine döner (`geriHedefi`). Genel iş
    `adimIlerle` ile ilerler, notu pakete, `durakTamamlandi` hareketi.
  - Üretim panosunun sütunları yayındaki akışın durakları; eski sürümle süren
    paketin durağı bugün yoksa kendi sütununda. Sırası gelen işler her birimin
    kataloğunda "Sıradaki işlerim" (`genSiram`); örneksiz yeni birimin ana
    sayfası onunla açılır.
  - Üretime giren paket akışın sürümünü taşır (`Paket.akis`, `akisDamgasi`):
    sonradan yayınlanan düzen yalnız yeni paketlere uygulanır. Damgasız ama
    üretimdeki paket (damgadan önce girmiş) başlangıç düzeniyle (sürüm 0) sürer.
  - `veri.ts` kaydı tembel kurar: örnek veri akış kurallarını kullanıyor,
    `akis → yapi → veri` döngüsünde açılışta akış henüz tanımsız olurdu.
    Kurulurken `anlik()` null döner, yapı o an varsayılan.
- Ana sayfa çalışma alanlarından oluşur (`ekranlar/ana/Calisma.tsx`):
  her kart bir `Alan` (kimlik, ad, geniş mi, grup, `sayfa`), birimin
  varsayılan düzeni `VARSAYILAN`'da. Kişi "Sayfayı düzenle" ile alan
  kaldırır, sıralar, ekler, varsayılana döner; düzeni `Durum.anaSayfa`
  (`kişi:düzen`). Alan eklemek için alanın `sayfa`'sını görebilmek gerekir
  ("muhabir" yalnız muhabirin kendi işi, "panel" kapsamı olan yönetici).
  Müdür birime inince birimin varsayılanını görür (`kisisel={false}`).
  "Sayfayı düzenle" sayfanın sonunda sakin bir düğme; düzenlerken üstte
  yapışkan düzen çubuğu (not, Varsayılana dön, Bitti), sayfadan çıkınca
  düzen kipi kapanır. Planlama'nın sayfasında başlık yok; varsayılanı üç
  alan (muhabir önerileri, muhabirlerin durumu, son hareketler). Plan
  kısayolları alan değil, üst çubukta (aşağıda).
  Yeni kart da böyle eklenir: birim dosyasındaki `*_ALANLARI` listesine.
  Katalog çizimde kurulur; alan dosyaları `Calisma.tsx`'i içe aktardığı
  için açılışta okunursa döngüde tanımsız kalır.
- Yönetici paneli (`ekranlar/YoneticiPaneli.tsx`) iş akışı ayrıntısı
  göstermez: sayılar, birim ışıkları (gerekçesi yazılı), planlar,
  talimatlar; ayrıntı için birimin kendi ekranına iner. "Dikkat
  gerektirenler" kartı kalktı: geciken paket, onay bekleyen plan, saha
  talebi gibi operasyonel satırlar yönetici için fazla ayrıntıydı.
  Müdahale yalnız öncelik, yönetici notu, haber talimatı ve görev. Tek
  "Talimat ver" düğmesi, içinde tür seçimi (`TalimatVer`): haber talimatı
  ayrı akış değil, Planlama'ya reddedilemeyen öneri olarak düşer; görev
  (`ekranlar/GorevVer.tsx`) iş taksimi kaydına (`Durum.isler`) bir ekibe
  (birim, `Is.birimler`), bir ya da birkaç kişiye iş olarak girer.
  Planlama kapsamı olmayan yönetici yalnız görev verir. Ekip ve kişi
  yöneticinin kapsamından (`isVerilebilecekBirimler`, `isAlabilir`;
  muhabir yok). Ekibe verilen işi ekibin herkesi görür, sonradan katılan
  da (`gorevler.ts → isKisinin`); bildirim o anki her alıcıya bir kez.
  Panelde "Verdiğim görevler". Planlama dışındaki birimlerde iş ana
  sayfanın ilk alanında, "Bana verilen işler" (`genIslerim`; açık iş
  yoksa çizilmez), oradan bitirilir.
- Next Day her gün kesintisiz sürer: yarının planını kullanıcı değil sistem
  açar (`eylemler.ts → yarinPlaniniAc`, `App.tsx`'te açılışta ve arada bir;
  hareket kaydında kişi `SISTEM`). Plan açma düğmesi ve neyin taşınacağını
  seçtiren form yok; plan önceki planın şablonuyla gelir. Yalnız önceki gün
  kullanılan başlık taşınır (`yarinPlaniniAc → kullanildi`): o gün eklenen,
  ya da gelişmesi, muhabiri, canlısı eklenen/düzenlenen/"bugün de geçerli"
  denen, paketi olan. Dokunulmadan devreden başlık düşer; yoksa eski
  başlıklar her gün birikiyordu. Bunun için taşınan kayıtta ayrıca `devir`
  (başlık, muhabir, gelişme, canlı): onay silmez (`onceki`yi siler),
  düzenleme ve "bugün de geçerli" siler. Taşınan kayıt `onceki` işaretli
  (hareket bağlantısında `NextDayPlan.oncekiHareketler`) ve ekranda
  `.onceki` hafif fonuyla görünür. Fon düzenleyince, "Bugün de geçerli"
  (`oncekiOnayla`) deyince ya da plan onaylanınca kalkar; çıktıda yoktur.
  Paket önerisi ve hazır paket taşınmaz.
  - Gün başına tek plan. Sistemin açtığı planın kimliği tarihten
    (`eylemler.ts → gunPlaniKimligi`, `nd-<tarih>`); içindeki taşınan
    kayıtların kimliği plandan ve kaynağından (`turet`, özetli). Gün dönünce
    açık duran her tarayıcı yarının planını yokluyor; rastgele kimlikle her
    biri ayrı plan açıyordu, şimdi aynı belgeyi yazıyorlar. Haftalıktan
    aktarılanlar da öyle. Eskiden birikmiş çiftleri açılışta sistem toplar
    (`planCiftleri.ts`, `planCiftleriniTopla`, hareket
    `planlarBirlestirildi`): en ilerideki plan kalır, öbürünün başlıkları
    (aynı başlık birleşir), gelişmeleri (şablondan ikisinde olan bir kez),
    canlıları, paketleri ve ona bağlı kayıtlar (öneri, hareket, takvim,
    haftalık aktarım) ona geçer.
  - "Plana ekle" (`oneri/PlanaEkle.tsx`): plan ekranından açılınca yalnız o
    plan (seçim yok); öneriler sayfasından önerinin günlerine düşen çalışılan
    Next Day planları (gün başına bir; düşmüyorsa bugün ve yarın) ve haftası
    kesişen haftalık plan, ikisi de varsa üstte Next Day / Weekly seçimi.
    Haftalıkta "Gündeme ekle": haftanın günü ve dosya
    (`haftalik/Plan.tsx → GundemeEkle`).
- Next Day plan ekranı (`nextday/Plan.tsx`) doğrudan doldurulan
  bölümlerle (1–6) başlar. Planın araçları başlığın yanında yazılı
  düğmeler (`PlanAraclari`: gelen öneriler, muhabir takipleri ve takvimden bu güne, sayılarıyla;
  çağrı, çıktı, belge); öneriler ve takvim geniş `Pencere`de açılır. Simgeli
  kare satır denendi, beğenilmedi. "Hepsini bugüne al" günün başlangıç işi:
  başlığın hemen altında (`OncekiSeridi`), dünden gelen kayıt varken.
  Durum çizgisi ve akış eylemleri (toplantıya götür, onayla, devral, geri
  dönüş) en altta `PlanDurumKarti`.
  - Başlığa gelişme muhabir önerisinden ve takibinden de eklenir: "Gelişme ekle"nin
    sağında ve gelişme formunun sağ üstünde "Öneri ve takiplerden al" (sayısıyla;
    `Formlar.tsx → OneridenAl`), `Pencere`de öneri kartları, her birinde
    "Ekle". Adaylar `oneriPlanlari.ts → gelismeOneriAdaylari`: karar bekleyen
    muhabir önerileri, önce bu planın gününe düşenler, sonra öbür
    günlerinkiler; talimat ve gündemdeki yok. "Ekle" "Plana ekle" ile aynı
    eylem (`oneriPlanaEkle`: öneri plana eklendi, başlığa bağlı, muhabir
    başlıkta, muhabire bildirim, PKG önerisi). PKG'nin adı
    `oneriPlanlari.ts → oneriPaketBasligi`: strap, yoksa muhabirin kendi
    önerisinde (uygulama, e-posta yanıtı) Header; e-posta yanıtında strap
    yok, paket hiç açılmıyordu. Planlama'nın elle girdiği strap'siz öneri
    yalnız gelişme; Live canlı yayın, takip paket değil. "Plana ekle"
    formundaki PKG işareti de aynı kuraldan. Formun içinde
    seçim kutusu denendi, beğenilmedi; form yalnız elle yazma.
  - Gelişme başka başlığa ya da başlıksız متابعات'e taşınır
    (`eylemler.ts → gelismeBasligaTasi`, `Bolumler.tsx →
    BaslikaTasiPenceresi`; plan ekranında gelişmenin yanında, belgede
    şeritte): hedefin sonuna; öneriden geldiyse önerinin başlığı ve bu
    plandaki PKG'si (eski başlıktaysa) de gider.
  - Başlık başka başlığa katılır (`eylemler.ts → planBaslikBirlestir`):
    başlığın "+" menüsünde "Başka başlığa kat" (hedef pencereden) ya da
    başlığı sürükleyip öbürünün üstüne bırakmak; onay sorulur, ↶ geri alır.
    Gelişmeler, PKG önerileri ve canlılar hedefin kendi kayıtlarının
    arkasına (kendi sıralarıyla), muhabirler yoksa saat ve yerleriyle;
    bu plandaki öneriler hedef başlığa bağlanır. Pencere kartın dışında
    çizilir (kapalı `<details>` içini göstermiyor).
  - Araç düğmeleri kendi satırında sayfaya ortalı (`.plan-araclari`):
    Türkçe ve Arapça arayüzde aynı yerde dursun.
  - Geri al (↶, Ctrl/⌘+Z yazı alanı dışında; `bilesenler/GeriAl.tsx`)
    Next Day, haftalık ve belge görünümünde. Kişinin o plandaki son
    düzenlemesini geri alır (`geriAl.ts`, `eylemler.ts → planGeriAl`):
    kaydın tamamı değil, yalnız o yazışta değişen öğeler eski haline
    döner; öğe o arada başkasınca değiştiyse geri alınmaz. Yığın bellekte,
    pencereye bağlı; hareket kaydı geri alınmaz, geri alma ayrı hareket.
    Sistemin yazışı (yarının planı) yığına girmez.
  - Geçmiş plandan aktar (yalnız simge; `nextday/IceAktar.tsx`,
    `planAktar.ts`, `eylemler.ts → planIceAktar`): kurumun eski
    الأجندة الإخبارية belgesi (.docx) ya da Plannersflow'un Word/HTML
    çıktısı satırlarına ayrılıp bölüm adlarıyla eşlenir. Ekip, canlı,
    başlık (havuzda aynı adla varsa o), gelişme, muhabir ve takip gelir;
    hareket ve paket gelmez. Kişi Arapça adla eşleşir, bulunamayan
    önizlemede yazılır. Gelenler şablondan gelen gibi `onceki` işaretli;
    eski ikili .doc okunmaz, .docx istenir. Haber başlığı satırı belgede
    biçimle ayrılır: .docx'te altı çizili paragraf, HTML'de h3, düz
    metinde "## " (`BASLIK_ISARETI`); işaretli satır varsa yalnız onlar
    başlık, yoksa eğik çizgisiz satır başlık.
  - Geçmiş planları toplu yükleme (tek seferlik, gerçek kip; Next Day
    planları sayfasında simge; `eylemler.ts → gecmisPlanlariYukle`):
    dosya `{tur: "plannersflow-gecmis-planlar", gunler: [{tarih,
    satirlar}]}`, satırlar belgenin kendisi ve aynı okuyucudan geçer.
    Ekipte adı geçip kayıtta olmayan hesapsız kişi olarak açılır
    (`kontrolBekliyor`; birimi ve görevi ekip görevinden, `ekipKisisi`),
    yönetici tam adını Kullanıcılar'da düzeltir. Günün planı yoksa açılır
    (geçmiş gün devredilmiş), varsa içine eklenir; ikinci yüklemede kişi,
    başlık, gelişme ve canlı çoğalmaz. Muhabir yalnız kayıttakiyle eşleşir:
    önce muhabir listesi (Excel), sonra planlar. Gerçek adlar depoya ve
    demoya girmez; dosya gerçek sitede yüklenir.
  - Muhabir henüz belli değilse "TBC" (`TbcKutusu`, muhabir seçiminin
    yanında): Next Day'de başlığın muhabirleri (`PlanBasligi.muhabirTbc`,
    `eylemler.ts → planMuhabirTbc`; belgede muhabir ata penceresinde de) ve
    PKG formu (`Paket.muhabirTbc`), Weekly'de kalem formu
    (`HaftalikKalem.muhabirTbc`). Çıktıda adın yerinde "TBC"
    (`etiketler.ts → muhabirYeri`); muhabir atanınca kalkar. Sahte kişi
    değil işaret: paketin muhabiri akışta görev ve bildirim alıyor.
    Weekly'den Next Day'e geçen kalemde TBC başlığa ve pakete taşınır.
  - Ekip satırında ad uzamasın diye kurum kişinin adını ya da soyadını
    yazar: `Kisi.planAdi` ("ad" | "soyad", yoksa tam ad), `etiketler.ts →
    ekipAdi`; "عبد المنعم", "أبو جهاد" gibi bileşik ad tek parça. Bütün
    planlamacılar seçer (`kisiPlanAdi`, `planDuzenle`): ekip çipinde ve
    belgedeki ekip penceresinde, seçenekler adın kendisiyle.
  - Dosyasız kayıt çıktının sonundaki yeşil "متابعات" bölümünde: başlıksız
    gelişmeler ve plana başlıksız giren haberler (paket, "YER / haber /
    muhabir"; hazır paketler kendi bölümünde).
  - 1–6 bölüm adları kurumun terimi: her arayüz dilinde çıktıdaki
    Arapçasıyla (`Bolum ar`, `metin(k, "ar")`); çevrilmez. Başlık satırı
    da çıktıdaki gibi sağdan başlar (`.bolum.ar > summary`), gövde
    arayüz dilinde kalır.
- Önerinin üç kaynağı var:
  - muhabir: uygulamadan, e-posta yanıtından ya da Planlama'nın onun adına
    girdiği telefon/mesaj/yüz yüze
  - yönetici talimatı
  - muhabir dışı kaynak: ajans, resmî, medya, kurum içi (`kaynakTuru`,
    `kaynakAdi`)

  Önerinin haber başlığının ekrandaki adı "Header", önerilen paket
  başlığınınki "Strap" (Arapçada العنوان الإخباري, عنوان التقرير المقترح).
  Muhabirin kendi önerisinde header, gelişme ve strap zorunlu (formda
  `oneriFormuGecerli(f, true)`, eylemde `oneriGonder`/`oneriYenidenGonder`);
  Planlama'nın elle girdiğinde strap isteğe bağlı.

  Öneri formunda ülke sorulmaz, muhabirin şehrinden gelir; yalnız "Saha
  görevlendirmesi gerekiyor" işaretlenince (ve muhabiri olmayan kaynakta)
  sorulur. Kolun ekrandaki adı "Masa" (`dil.ts → tur`). "Yeni öneri"
  sayfasının başlığı yok, doğrudan form. Formda Next Day / haftalık ayrımı
  yok: önerinin günü (`hedefTarih`) ve çok günlü etkinlikte isteğe bağlı
  bitişi (`Oneri.bitisTarih`). Öneri, Planlama'nın çalıştığı hangi planın
  günlerine düşüyorsa o planın etiketini alır (`oneriPlanlari.ts →
  oneriEtiketleri`; saklanmaz, her an hesaplanır): açık Next Day planı
  (`acikGunPlanlari`, `oneriGunde`), kesinleşmemiş haftalık plan
  (`oneriHaftada`), özel yayın günü. Karar verilmiş öneri (Next Day'e ya
  da haftalık gündeme girmiş, `oneriYeri`) yalnız girdiği planın etiketini
  taşır; gündemdeki öneri Next Day'e ayrıca eklenmez (kesinleşince
  aktarılıyor), plandaki de gündeme. Öneri penceresinde ve ayrıntısında
  "Plandan çıkar" / "Gündemden çıkar" (`eylemler.ts → oneriPlandanCikar`):
  gelişmesi ve paketi (üretime girmemişse) silinir, onunla gelen muhabir ve
  boş kalan başlık plandan kalkar, öneri "değerlendiriliyor"a döner. Plandan
  gelişmesi ya da paketi silinen (gelişme sil, paket sil, başlığı çıkar)
  öneri de öyle (`oneriBaglariniTazele`). Etiketler kartta, listede, ayrıntıda ve formun altında önizleme
  olarak (`Tablolar.tsx → OneriPlanEtiketleri`, planın rengiyle); öneriler
  sayfasında süzgeç (Bütün planlar / Next Day / Weekly / Özel yayın /
  Plana düşmeyen). Next Day planının gelen önerileri günü aralığa düşenler,
  haftalık planınki haftasıyla kesişenler; gündeme eklerken gün aralığın
  haftadaki ilk günüyle gelir. Çağrı bağı: önce aralıktaki Next Day
  çağrısı, yoksa haftasının haftalık çağrısı. Eski haftalık öneri
  (`Oneri.hafta`, `haftaGunu`; e-posta yanıtından ve haftalık ekrandan
  girilen) olduğu gibi yalnız haftalık.

  Özel yayın etiketi yok: günü özel yayın gününe denk gelen öneri de
  etiketlenmiyordu, özel yayının önerileri yayının içinde
  (`ONERI_ETIKETLERI` yalnız Next Day ve Weekly).

  Arşiv: uygulama günü geçmiş öneri güncel listelerden kalkar
  (`oneriPlanlari.ts → oneriArsivde`, `oneriSonGunu`: aralığın sonu, plana
  girdiyse planın günü, günü yoksa geldiği gün; e-posta takibi açıksa
  düşmez; saklanmaz). Öneriler sayfasında "Güncel" / "Arşiv" sekmeleri
  (`#/oneriler/arsiv`, muhabirde "Geçmiş önerilerim"; İşlerim'deki
  Önerilerim kartında da bağlantısı, kılavuzda `kl4g`). Planlama ana sayfası,
  menü ve yönetici paneli sayıları, "Önerilerden al" arşivi saymaz.

  Planlama öneriyi her aşamada düzeltir, plana eklendikten sonra da
  (`eylemler.ts → oneriDuzenle`, yetki `oneriDuzenleyebilir`; muhabire
  gönderilmiş teklif hariç): ayrıntıda ve plan ekranının öneri penceresinde
  "Düzenle". Gönderenin yazdığı ilk düzenlemede `Oneri.ilkHali`'nde kalır
  ("Gönderildiği hal"). Plana eklenmişse gelişme ve paket de güncellenir,
  ama yalnız plandaki metin hâlâ önerinin eski metniyse; havuzdaki başlığın
  adına dokunulmaz.

  Elle girilen öneride `giren` dolu. Plan ekranlarındaki "Öneri ekle" ile
  öneri sayfası aynı formu kullanır (`oneri/OneriFormu.tsx`). Ekranda
  kaynak her yerde `OneriKaynagi` / `OneriAvatari` ile gösterilir
  (`bilesenler/Tablolar.tsx`); muhabir/talimat ayrımı elle yazılmaz.
  Muhabir dışı kaynağın öneri çağrısıyla bağı ve geri dönüşü yoktur;
  plana eklenince gelişmenin kaynağı önerinin kaynağı olur.
- Muhabire geri bildirim (`geriBildirim.ts`, `oneri/GeriBildirim.tsx`):
  toplu "geri dönüş" düğmesi yok; her öneride değerlendirme bölümünden,
  karar verilmiş muhabir önerisinde. Şablondan e-posta (Outlook taslağı /
  mailto, CC ve BCC'li); metin, alıcılar ve not pencerede değişir.
  Şablonlar (onaylandı, reddedildi, sonra; `{muhabir} {header} {strap}
  {plan} {gerekce} {not}`) Ayarlar › "Muhabire geri bildirim"de
  (`Durum.geriBildirimSablonlari`, boşsa varsayılanlar; yetki
  `geriBildirimSablonuDuzenler`). Deneme süreci geçici:
  `Durum.geriBildirimAyari.epostaIleTakip` açıkken pencerede "takip
  edilsin mi" sorusu (onaylananda işaretli gelir, her kararda seçilebilir);
  seçilirse öneri `takip: "acik"`, yazışmaya ayardaki Arapça mesaj düşer,
  haber muhabirin İşlerim'inde ("Takipteki haberlerim", `muTakip`).
  "Tamamlandı"yı muhabir ya da Planlama işaretler (`takipTamamla`,
  `takipTamamlayabilir`). Diğer birimler devreye girince ayar kapanır.
- "Plana eklendi"nin tek doğru kaynağı plandaki kayıt
  (`oneriPlanlari.ts → oneriPlanKaydi`): önerinin gelişmesi, canlısı ya da
  iptal edilmemiş paketi, var olan Next Day planında. Önerideki durum,
  `planId`, `planTarihi`, `paketId` kopya (kısıtlı muhabir planı okuyamıyor,
  ekranı öneriden okuyor); `oneriPlanaGore` kopyayı kayda göre kurar,
  sistemin açılış işi `onerileriPlanlaEsitle` kaymış kopyaları yazar
  (plana girip çıkan öneri planda dururken "değerlendiriliyor" kalıyor,
  muhabire onay gönderilemiyordu). Kaydı kalmamış "plana eklendi"
  değerlendirmeye döner, kesinleşmiş haftada kabul ya da plansız paket
  hariç (`oneriPlansizKabul`); teklife dokunulmaz. `oneriYeri` ve geri
  bildirim kayda bakar. Yeni öneri akışının (tasarım belgesi, dört aşama)
  ilk adımı.
- Kaydın yedeği (Ayarlar, yalnız tam yönetici; `ekranlar/KayitYedegi.tsx`):
  bütün `Durum` tek JSON (`tur: "plannersflow-yedek"`); gerçek kipte sunucuyla
  eşitlenmeden düğme pasif. Davetler ve kayıt başvuruları `Durum`'da değil,
  yedekte yok.
- Kayıt temizliği (Ayarlar, yalnız tam yönetici; `temizlik.ts`,
  `eylemler.ts → kayitlariTemizle`, `ekranlar/KayitTemizligi.tsx`):
  deneme sürecinde girilenler tarih aralığı ve türle (öneri, Next Day,
  paket, haftalık, aylık/özel, çağrı ve yanıt, takip, takvim,
  görevlendirme, hareket ve bildirim, kullanılmayan başlık) izleriyle
  silinir. İz: önerinin yazışması, gelişmesi, paketi, haftalık kalemi;
  planın gelişmesi, canlı yayını, paketi; çağrının yanıtı; silinen kayda
  değen hareket. Kalan kayıttaki bağlantı kopar (önerinin planı, planın
  hazır paketi, takvim bağlantısı…). Sayılar silmeden önce aynı kuraldan;
  temizliğin kendisi tek hareket (`kayitTemizlendi`). Kişiler, kurum
  yapısı ve ayarlar girmez. Geri alınamaz, onay sorulur. Tek tek silme
  öneri sayfasında: tam yöneticiye ayrıntıda (sayfa ve pencere) "İzleriyle
  sil" (`eylemler.ts → oneriSil`, aynı kural `idler` ile); onayda kaç kayıt
  gideceği yazılı, hareketi `oneriSilindi` (başlık verisinde, öneriye bağlı
  değil; bağlansa iz sayılıp giderdi).
- Planlama görevleri ve iş taksimi (`ekranlar/Gorevler.tsx`, `#/gorevler`;
  kurallar `gorevler.ts`, eylemler `gorevKaydet`, `gorevDonemSorumlusu`,
  `isKaydet`, `isDurumu`; `Durum.gorevler`, `Durum.isler`): temel görevler
  planların kendisi (Next Day, Weekly, Aylık, Özel yayın; kayıtta görev
  yoksa sorumlusuz varsayılanlar), yan görevler serbest adlı, etiketli,
  istenirse bir temel göreve bağlı. Sorumlu sabit ya da sıralı (her gün /
  Cumartesi başlayan her hafta; formda "İlk kişinin sırası": listenin
  ilki o gün ya da o hafta, sonra dönem sayısıyla; izinli atlanır).
  Pencerede önümüzdeki dört dönemin sorumluları (`donemOnizlemesi`).
  Dönemin sorumlusu elle değişir (`degisiklikler`, dönem
  anahtarı `donemAnahtari`). Sorumlu saklanmaz, kayıttan hesaplanır.
  Sayfada seçilen gün için "Kim ne yapıyor", görevler (etiket süzgeci),
  tek seferlik işler (görev, etiket, kişiler, son tarih, durum). Düzenleme
  Planlama yöneticisi ve tam yöneticide (`gorevleriDuzenler`), iş ekleme
  sayfayı gören herkeste (Planlama, Yönetim); atanana bildirim
  (`isAtandi`), biten işi girene (`isDurumu`). Planlama ana sayfasının ilk
  alanı "Bugünkü görevlerim" (`plGorevlerim`, iş oradan bitirilir); Next
  Day başlığında planın sorumlusu, bir önceki günün Next Day görevlisi
  (planı önceki gün hazırlıyor). Kayıt temizliğinde "Görev işleri" türü.
- Muhabirin takipleri (`ekranlar/Takipler.tsx`, `#/takipler`, `Durum.takipler`):
  muhabirin izlediği güncel konu (olay, toplantı, etkinlik); iş önerisi
  değil, bilgilendirme. Muhabir menüsünde "Takiplerim" (öneriler menüden
  kalktı, İşlerim'de "Yeni öneri gönder"in yanında "Önerilerim" düğmesi);
  Planlama ve Yönetim'de "Muhabir takipleri", muhabirin profilinde de.
  Muhabir ekler, düzeltir, bitirir, siler (`takipKaydet`, `takipKapat`,
  `takipSil`; yalnız kendisininki, `yetki.ts → takipEkleyebilir`,
  `takipGorebilir`); yeni takip Planlama'ya bildirim (`takipEklendi`).
  Planlama WhatsApp'tan ulaşır, "Öneriye çevir"le takibi kendisi haber
  önerisine çevirir (elle öneri formu takibin konusu, açıklaması ve
  muhabiriyle dolu, `ElleOneriFormu baslangic/takipId`; öneri `takipId`
  taşır, plan ekranından açılınca o planın gününe düşer) ya da "Muhabire
  öner"le muhabire teklif gönderir (bilinen "muhabire öneri" akışı);
  takip kartı neye dönüştüğünü gösterir.
  Takip öneriye çevrilmeden plana gelişme olarak da girer (`eylemler.ts →
  takipGelismeEkle`): Next Day gelişme formundaki "Öneri ve takiplerden al"
  penceresinde "Muhabir takipleri" bölümü (o başlığa) ve Next Day'in "Muhabir
  takipleri" penceresinde kartta "Gelişme olarak ekle" (başlık seçilir ya da
  takibin konusuyla yeni başlık). Gelişme "YER / metin" (metin açıklama, yoksa
  konu; `onerenId` muhabir, kaynak muhabir), `Gelisme.takipId`; aynı takip
  aynı plana bir kez (`takipPlanda`). Muhabir başlığa yazılmaz (kaynak, haberi
  yapan değil), takip açık kalır; hareket `takipPlanaEklendi`, muhabire
  bildirim (`kime`). Kartta "Next Day'de · gün" bağı (Planlama'ya; muhabir
  planı okuyamıyor). Kılavuzda `kl2b`.
  Yalnız gelişme bildiren gönderi öneri değil takip: öneri formunun haber
  türünde en sonda "Takip" (`veri.ts → TAKIP_BICIMI`, `OneriBicimi`;
  `BICIMLER`'e girmez). Seçilince Strap sorulmaz, takip türü sorulur;
  `oneriGonder` yalnız takip açar (dönen kimlik takibin, `takipKimligiMi`;
  muhabir Takiplerim'e geçer, Planlama'ya `takipEklendi`). Öneri
  listelerine ve plan ekranının gelen önerilerine karışmaz: Next Day ve
  Weekly'de ayrı "Muhabir takipleri" düğmesi, sayısıyla, penceresinde
  açık takipler (`Takipler.tsx → PlanTakipleri`, `acikTakipler`). Eskiden
  takip türünde açılmış ve Planlama'nın dokunmadığı ("yeni") kopya öneri
  sistemin açılış işinde ayıklanır (`takipOnerileriniAyikla`; takip kalır,
  işlenmiş öneri yerinde). Takip silinince ona bağlı "yeni" takip önerisi
  izleriyle geri çekilir; karar verilmişse yalnız bağ kopar. Muhabir dışı
  kaynakta "Takip" yok.
- Plan ekranlarında (Next Day, haftalık) gelen öneri müstakil kart
  (`oneri/OneriKarti.tsx → OneriListesi`):
  - kartta kol, haber türü, ülke, durum; başlık önerilen paket
    (`paketBasligi`, yoksa `haberBasligi`), altında arka plan haberi,
    kısa gelişme, kaynak ve zaman. Renk yalnız kolda.
  - Karta basınca `Pencere`de bütün öneri: tam gelişme, kaynak, hedef plan,
    süreç, yazışma ve hareket geçmişi (ayrıntı sayfasına gitmek gerekmiyor).
    Plana/gündeme ekleme ve ret pencerede açılır, ızgarada form açılmaz;
    değerlendirmeye alma ve erteleme kartta.
  - Next Day'de başlık seçenekleri bütün havuz değil (`baslikSecimi.ts →
    ndBaslikSecenekleri`): planın kendi başlıkları ve bir önceki günün
    planlarındakiler ("Plana ekle" formu, plandaki "Başlık ekle"; Plana
    ekle'de önerinin kendi dosyası da). Yeni yazılan ad havuzda varsa o
    başlık kullanılır (`dosyaAc`, `baslikEkle`, `adiylaBaslik`); havuz tek.
  - Plana ekleme formu (`oneri/PlanaEkle.tsx`) önerinin bağlı olduğu
    başlıkla, yoksa plandaki aynı adlı başlıkla, o da yoksa önerinin kendi
    Header'ıyla yeni başlıkla açılır. Aynı
    ülkenin plandaki başlığı varsayılan değil: başka muhabirin haberi
    olabilir, fark edilmeden eklenen öneri onun başlığına giriyordu.
    Önerinin başlığı pasifse (listede yoksa) yine yeni başlık: seçici
    başka seçeneği gösterip kayıt görünmeyen başlığa gitmesin; haftalık
    gündem formunda da aynısı. Öneri penceresi ve ayrıntı sayfası öneriye
    göre yeniden kurulur (`key`), form bir öneriden ötekine iz taşımaz.
  - Next Day'in ve haftalığın gelen önerilerinde plana ya da gündeme eklenen
    öneri kalır, en sonda, altında "Plana eklendi / Gündeme eklendi · plan,
    gün · başlık" notuyla. Öneri plana kurumun düzeniyle
    girer: dosyanın (başlığın) altında "YER / gelişme" (gelişme önerinin
    açıklaması, boşsa Header; yer muhabirin şehri; `eylemler.ts →
    planMetni`, producer'lar planda kısaltıyor), paket önerisiyse "PKG"
    altında "YER / strap / muhabir" (`oneriPlanaEkle`, `oneriDuzenle`).
    Haftalık gündemde de aynısı (`oneriGundemeEkle`): kalem `yer` muhabirin
    şehri, `metin` açıklama, strap `HaftalikKalem.paketBasligi`; ekranda ve
    çıktıda paketli kalemde "PKG" ve "YER / strap / muhabir"
    (`bilesenler/Haftalik.tsx → kalemPaketli`), muhabir ve o biçim ayrıca
    yazılmaz. Next Day'e aktarılan paketin başlığı strap; kalem formunda
    paketli kalemde Strap alanı.
  - "Plana ekle" formunda (Next Day) PKG işaretinin yanında "Yalnız takip"
    (`PlanaEkle.tsx`, ikisi birbirini kaldırır; muhabiri olan öneride):
    gelişme plana girer, paket önerisi doğmaz, öneri `yalnizTakip` ve
    `takip: "acik"` (`oneriPlanaEkle`). Muhabir "Takipteki haberlerim"de
    "paket beklenmiyor" diye görür, bildirimi de öyle yazar
    (`hrOneriTakibeAlindi`, hareketin `veri.takip`'i); "Senin sıran"a ve
    arşive düşmez, "Tamamlandı" ile kapanır. Rozet "Yalnız takip"
    (`OneriDurumRozeti`). Plandan çıkınca işaret ve takip kalkar
    (`plandanDonmus`). Kılavuzda `kl7c`.
  - Haber türü "Live" olan öneri plana paket değil canlı yayın olarak girer
    (formda PKG yerine "Canlı yayın olarak ekle"; `oneriPlanaEkle → canliAc`):
    başlığın altında `CanliYayin` (konu strap, yoksa Header; yer muhabirin
    şehri; saat boş, çıktıda "TBC"), `CanliYayin.oneriId`. Paket önerisi
    doğsaydı çıktının "مباشر" bölümünde görünmüyordu. Plandan çıkınca,
    öneri silinince (temizlik) canlı da gider; canlıyı silmek öneriyi
    `oneriBaglariniTazele`'den geçirir. Weekly'de LIVE işaretli kalem de
    Next Day'e geçerken başlığın canlısı olur (`haftaliktanAktar`,
    `haftalikKalemId`, kimlik `cy-<turet>`); yalnız LIVE kalemden paket doğmaz.
  - Üçüncü karar "Düzeltmeye gönder": yalnız muhabirin önerisinde (talimat
    ve muhabir dışı kaynak değil), ne değişmesi gerektiği yazılmadan
    gitmez (`DuzeltmeFormu`, `eylemler.ts → oneriDuzeltmeIste`). Durum
    `duzeltme`, not `duzeltmeNotu` (ret `gerekce`'sinden ayrı). Sıra
    muhabirde: öneri ayrıntısında notu görür, "Düzelt ve yeniden gönder"
    (`oneriYenidenGonder`) aynı öneriyi günceller ve "yeni"ye döndürür;
    önceki hal hareketin verisinde. Kurallar `yetki.ts →
    oneriDuzeltmeyeGider`, `oneriYenidenGonderebilir`.
  - Önerinin yazışması (`oneri/Yazisma.tsx → OneriYazismasi`): muhabir ile
    Planlama arasında, önerinin ayrıntı sayfasında; her önerinin
    yazışması ayrı. Mesaj öneriden ayrı kayıt (`Durum.mesajlar`, gerçek
    kipte `mesajlar` koleksiyonu): iki taraf aynı anda yazınca öneri
    belgesi ezilmesin. Yazabilen `yetki.ts → oneriYazisabilir`; bildirim
    karşı tarafa (`oneriMesaji` hareketi). Geri almaya girmez.
  - Muhabire haber önerisi (`muhabireOneriGonder`): Planlama (ya da
    yöneticinin Ayarlar'da seçtiği birimler, `Durum.muhabireOneriBirimleri`,
    yoksa Planlama; gerçek kipte genel ayar belgesinde) öneriler sayfasından
    ya da muhabirin profilinden öneri gönderir. Öneri `yon: "muhabire"`,
    durum `teklif` ("muhabirin yanıtı bekleniyor"); sıra muhabirde, karar
    düğmesi yok. Muhabir kabul edince `degerlendiriliyor`, gerekçeyle geri
    çevirince `reddedildi` (`teklifYanitla`). Öneriler sayfasını görmeyen
    gönderen önerisini ve yazışmasını muhabirin profilinde izler
    (`MuhabireOnerilenler`).
  - Kart ya da liste kişinin seçimi, ana sayfa düzeni gibi kayıtta
    (`Durum.oneriGorunumu`, `eylemler.ts → oneriGorunumuKaydet`); aynı
    tarayıcıda başka biri girince kendi seçimini görür, seçmeyen kart görür.
  - Öneriler sayfası (`oneri/Oneriler.tsx → OnerilerListe`) da aynı seçimi
    izler: kartta karta basınca geniş pencerede ayrıntı sayfasının tamamı
    (`OneriDetay pencerede`: kararlar, yazışma, geçmiş), listede bugünkü
    tablo. Başlık kartındaki küçük liste bu
    kalıba girmez.
- Haftalık plan (`ekranlar/haftalik/`): Cumartesi–Cuma, Perşembe
  toplantısı. Hazırlık → haftalık toplantıda → kesinleşti.
  - Kalemin dosyası merkezi başlık havuzundaki başlık; Next Day'e aynı
    başlıkla geçer, havuz ikiye bölünmez.
  - Dosya seçimleri (kalem formu, "Gündeme ekle", ana dosya) her hafta boş
    başlar: yalnız o haftanın dosyaları (`haftalik.ts → haftaninDosyalari`:
    `HaftalikPlan.dosyalar`, kalemlerin ve ana dosyaların başlıkları) ve
    "+ Yeni dosya". Haftada eklenen ya da seçilen dosya o haftanın kaydına
    girer (`eylemler.ts → haftayaDosya`), kalemi silinse de o hafta kalır;
    bir sonraki haftaya geçmez. Önce bütün başlık havuzu geliyordu, eski
    haftaların dosyaları birikiyordu. Havuz yine tek: yeni dosyanın adı
    havuzda varsa o başlık kullanılır (`dosyaAc`, pasifse yeniden etkin),
    Next Day'e aynı başlıkla geçer. "Gündeme ekle"de önerinin kendi dosyası
    da seçilebilir.
  - "Haftanın ana dosyaları"nın başlığı da havuzdan (`AnaKonu.baslikId`,
    `eylemler.ts → anaKonuKaydet`): seçicide bu haftanın dosyaları, en sonda
    "+ Yeni başlık" (havuza girer; aynı adlı varsa o). Haftada zaten ana
    dosya olan başlık seçilemez. Eski kayıttaki havuzda olmayan başlık
    "yeni"de yazısıyla gelir. Belgede başlık yazıyla değişmez, "Düzenle"
    penceresinden; durum özeti yerinde.
  - Haftalık ekrandan ve haftalık çağrı e-postasından gelen öneri `Oneri.hafta`
    taşır, Next Day ekranlarına karışmaz; günü olan öneri haftasıyla kesişen
    haftalık plana da düşer (yukarıda, öneri etiketleri).
  - Toplantıda karar düğmelerinin yanında "Not / ek talep" (`Kalem.tsx →
    KararNotuFormu`, `eylemler.ts → kalemKararNotu`, yetki `kararNotuYazabilir`;
    kalem formunda da, belgede "Düzenle" penceresinden): `HaftalikKalem.kararNotu`
    ve `ekTalep`, çıktıdaki sarı nottan ayrı, kurumun çıktısına girmez (belgede
    yalnız düzenlerken). Kesinleşince pakete geçer (`toplantidan`), muhabire
    "paketOnaylandi" bildirimi gider (paket doğduğu an: kesinleşmede ya da
    günlük plan açılınca). Ret notu öneriye gerekçe olur.
  - Ön inceleme yalnız günü olmayan (stok) kalemde; inceleyen
    `yetki.ts → onIncelemeci` (kolu kapsamındaki müdür, ekonomide Ekonomi
    birimi). Görüş ya da gerekçeli ret; kabul kararı toplantıda.
  - Kesinleşince kabul edilen haber Next Day'e onaylı paket olarak geçer
    (`haftalikKalemId`, "Haftalık plandan" rozeti); feature, ekonomi ve
    program plansız onaylı paket olur. Paketin başlığı strap
    (`eylemler.ts → kalemStrapi`: kalemin, yoksa önerinin strap'i, yoksa
    dosyanın adı, sonra olay adı); kalemin metni açıklama, başlığa yazılınca
    PKG satırında gelişmenin aynısı çıkıyordu. Kalemde elle yazılan yer
    muhabirin şehri değilse `Paket.yer`'e geçer. Eskiden metinle aktarılmış
    paketi sistemin açılış işi düzeltir (`haftalikPaketBasliklariniDuzelt`;
    başlık hâlâ açıklamanın aynısıysa). Günün Next Day planı onaylanınca
    planındaki Weekly paketinin muhabirine hatırlatma (`paketOnaylandi`,
    `veri.hatirlatma`, `kime`; "hrPaketHatirlatma"). Aktarım tek yerde
    (`eylemler.ts → haftaliktanAktar`); kesinleştirmede, yarının planı
    açılınca ve sistemin açılış işinde (`haftalikAktarimlariniTamamla`:
    ikisini de kaçıran, aktarımı olmayan haber günün planına geçer) çağrılır.
    Hedef plan taslak, toplantıda ya da onaylı (`planAktarimaAcik`; onaylı
    plana önce girmiyordu, haber kayboluyordu), devredilmiş değil.
    Dosyasız kalem önerinin başlığına, yoksa Header'ıyla açılan başlığa girer
    (önce "متابعات"e düşüyordu). Next Day'de çıkarılır: Weekly'den gelen onaylı
    PKG üretime girmeden silinir, gelişme kalır (`yetki.ts →
    paketPlandanSilinir`, muhabire `paketIptal`, `kime`); öneri "Plandan
    çıkar"la bütünüyle çıkar, kesinleşmiş haftanın kalemi kayıt olarak kalır
    (`aktarim` durur, yeniden aktarılmaz), öneri yeniden Next Day'e eklenebilir.
  - Çıktı kurumun "الأجندة الأسبوعية" belgesini izler; yazdır/PDF ve Word
    (HTML tabanlı `.doc`). E-postayı planlamacı kendisi gönderir.
    Kesinleşen planın çıktısında yalnız kabul ve bilgi; kesinleşmeden
    önizleme karar bekleyenleri de basar (yoksa hazırlıktaki iş görünmüyordu).
    Kalem: "YER / metin", olayın adı yazılmışsa "YER - OLAY / metin";
    sonra muhabirler, biçim, not. Dosyasız kalemler bölümün (günün, zamana
    bağlı olmayanların) en altında yeşil, kalın "متابعات" başlığıyla
    (`HaftalikBelge.tsx → Dosyalar`). Belgede boş alan
    (yer, konu, not) satır kaplamaz; "Düzenle" penceresinden girilir.
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
    (`arkasina`). Canlı yayın saatle sıralı, taşınmaz; ekip de (sunucular
    dahil) görevin içinde vardiya saatiyle (`nextday/Bolumler.tsx →
    gorevEkibi`; plan ekranı, belge, çıktı; saatsiz sonda), saat değişince
    yerine geçer; haftalık hareketler
    saha görevlendirmelerinden türer, belgede salt.
  - Yetki plan ekranıyla aynı (`planIcerikDuzenler`/`planOperasyonDuzenler`,
    `haftalikDuzenler`, toplantıda `kararVerebilir`). Haftalıkta belgede
    yedi gün ve karar bekleyen kalem (soluk) de var; çıktıda yok.
  - Baskı, Word ve kopya ekranda görünmeyen temiz kopyadan (`.belge-temiz`);
    Word ortak (`bilesenler/indir.ts → wordIndir`), Next Day'de de var.
  - Aralık kurumun kuralı: aynı başlığın altındaki satırlar 1,15, başlıklar
    ve bölümler arası 1,30 satır; satırlar arasına başka boşluk girmez.
    Ekran, baskı (`.cikti`) ve Word (`WORD_BICIMI`) aynı değerde.
- Stok haberi ayrı kayıt değil, `Paket` (`stok: true`): haftalıkta kabul
  edilen plansız feature, ekonomi ya da günü olmayan haber. Durumu
  saklanmaz, kayıttan çıkar (`akis.ts → stokDurumu`): üretime alınacak →
  üretimde → stokta → yayınlandı.
  - Kolun Planlama'ya düşen adımlarını (görev verme, Media'ya iletme,
    montaj kontrolü ve yükleme) yalnız feature/stok ekibi (`stokTakip`)
    ve Planlama yöneticisi yapar (`yetki.ts → adimYapabilir`).
  - Adımın ekrandaki adı koldan: `akis.ts → adimAdi(adim, paket)`;
    `ADIM_ADI`'yı doğrudan pakete yazma.
  - Paketin yeri (`etiketler.ts → paketYeri`): listede olmayan yer
    formdaki şehir seçiminin "Diğer…"iyle elle, Arapça (`Paket.yer`); "YER /"
    da, paket listesinde ve ayrıntıda şehrin yerine o. Şehir alanı kalır
    (muhabirinki; ülke ve süzgeçler ondan).
  - Next Day'in "Hazır paketler" bölümü (`hazirPaketler`) stoktan seçer;
    plan devredilince seçili paket `yayinlandi` alır.
- Newsdesk sistemde değilken (`Durum.newsdeskDevrede` yok; Ayarlar › İş
  akışı, tam yönetici, gerçek kipte genel ayar belgesinde) iş Planlama'da
  biter: onaylı paketi (haftalıktan da, Next Day'de onaylanan PKG de)
  muhabir "Senin sıran"da "Teslim ettim" diye kapatır (satırda "Onaylandı ·
  hazırlaman bekleniyor"; "Tamamlandı" durum gibi okunuyordu; Planlama onun
  adına işaretlerken "Teslim edildi") (`eylemler.ts →
  paketTamamla`, yetki `paketTamamlayabilir`; `muhabirTeslimi` ölçüme
  girer, Planlama'ya bildirim). Hesapsız muhabir için Planlama paket
  ayrıntısından onun adına kapatır. Anahtar açılınca bu kapanış kalkar,
  devral ve üretim akışı geçerli; yarım paketler kendi yolunda.
  - Ekran bu pakete üç adım gösterir (`akis.ts → sadeAkis`, `SADE_ASAMA_ADI`):
    plana eklendi, muhabirde, tamamlandı; "şimdi kimde" onaydan sonra
    muhabir (`gorunenSahip`; iş akışının sahibi `paketSahibi` değişmez).
    Beş aşama ve üretim adımları yalnız üretime girmiş pakette.
  - Tek "Tamamlandı": paketi kapatmak önerinin e-posta takibini de kapatır,
    takibi kapatmak onaylı paketi de (`paketTamamla`, `takipTamamla`);
    paketli haber "Takipteki haberlerim"de ikinci kez durmaz. Haberi biten
    önerinin rozeti "Tamamlandı" (`OneriDurumRozeti`).
  - "Tamamlandı" geri alınır (yanlışlıkla basılınca; `eylemler.ts →
    tamamlamaGeriAl`, yetki `tamamlamaGeriAlabilir`: haberin muhabiri ya da
    Planlama): basınca çıkan bildirimde "Geri al", sonradan öneri
    ayrıntısında ve paket sayfasında "Tamamlamayı geri al"
    (`bilesenler/TamamlamaGeriAl.tsx`). Birlikte kapandıkları için öneri ile
    paket birlikte açılır (takip "açık", paket onaylı); muhabirin teslim
    zamanı yalnız o kapanışta yazıldıysa silinir. Hareketi
    `tamamlamaGeriAlindi`, öbür tarafa bildirim. Özel yayın paketi kendi
    aşama listesinde geri alınır.
- Özel yayın (`ekranlar/OzelYayin.tsx`, `#/ozel`, `#/ozel/:id`,
  `#/ozel/:id/cikti`; kurallar `ozel.ts`, eylemler `eylemler.ts → ozel*`,
  `nafize*`, `konuk*`): Planlama'nın denetiminde hazırlanır, onayı Plan
  yetkileri'nde (`ozOnay`, varsayılan Planlama yöneticisi). Künye: başlık,
  gün (ya da `bitis`), genel planın Arapça paragrafı (`aciklama`).
  - Sayfa sade: bölümler (yapılacaklar, nafizeler, paketler, talepler,
    görevlendirmeler, hazırlık) ve içlerindeki her kalem kapalı gelir
    (`Bolum`, `Kalem`; `<details>`); kapalıyken başlık, sayı, aşama. Pencere
    bölümün dışında çizilir (kapalı `<details>` içini göstermiyor).
  - Aşamalar kontrol listesi (`KontrolListesi`; sıra `ozel.ts → isaretli`,
    `siradaki`, `oncesi`): sırayla işaretlenir, yalnız sonuncu geri alınır;
    işaretleyen ve zaman izden (`isaretIzi`), her aşamanın notu kendi
    satırında (`OzelIz.asama`, `asamaNotlari`). Durum son işaretlenen.
    - Plan (`OZEL_SIRASI`): planlama tamam (onayda), onaylandı, uygulama
      tamam, yayına hazır; her biri ayrı işaretlenir (`ozelAsamaIsaretle`,
      `ozelAsamaDegisebilir`; onay `ozOnay`, öbürleri plan düzenleyen ya da
      onaylayan). Planın onayı onay bekleyen nafizeleri ve paket önerilerini
      de onaylar.
    - Nafize (`NAFIZE_SIRASI`): onay (tek başına da, `ozOnay`), Satdesk
      rezervasyonu, yer hazır, yayınlandı; iptal ayrı (`nafizeIptal`).
      Başlığı her dilde Arapça "25 أكتوبر - تل أبيب - 10G" (`nafizeBasligi`,
      `dil.ts → gunAy`); konu, muhabir (ya da TBC) ve konuklar içeride.
      Konuklar (aday, davet edildi, teyitli, iptal) sırasız, aşamaya bağlı
      değil.
    - Talep (`TALEP_SIRASI`): sürüyor, tamamlandı; iptal ayrı. Metin,
      istenirse birim (o birime bildirim) ve son tarih.
  - Paket önerisi (`OzelYayin.paketOnerileri`) özel yayının içinde, genel
    önerilere karışmaz; yazılınca paket doğmaz. Onayla (tek başına
    `ozelPaketOnerisiOnayla` ya da planın onayıyla) `Paket` açılır
    (`ozelId`, `ozelKaynak`, `sonTarih` zorunlu, `ozelAd`: muhabir özel
    yayının kaydını okuyamıyor). Onay görevlendirme sayılmaz: dış muhabirin
    paketi `ozelGorevBekliyor` ile onaylıda bekler, muhabir onu görmez
    (`paketGorebilir`, `ozelPaketTeslimEdebilir`); Planlama "Görevlendirildi"yi
    ayrıca işaretler (`ozelPaketGorevVer`, `ozelGorevVerebilir`; başlamadan
    geri alınır), görev ve bildirim muhabire o an, yayının adıyla
    (`ozelPaketAtandi`). In-house'ta görevlendirme Output müdürünün seçimi.
    Aşamaları (`ozelPaketAsamasi`): öneri → onaylandı →
    görevlendirildi (muhabir ya da hazırlayan) → hazırlanıyor (`ozelBasladi`,
    işi yapan ya da Planlama) → hazır (`tamamlandi`); ilerleyiş önerinin
    izine de düşer (`paketOnerisiIzi`), notlar öneride. Öneri kaydından önce
    doğrudan açılmış taslak paket önerisiz satır olarak sürer
    (`ozelPaketSatirlari`, `ozelPaketOnayla`). In-house görev Output'a düşer,
    Output'tan sorumlu yönetici (`ozelPaketDagitabilir`) ekibinden birine
    verir (`hazirlayanId`, `ozelPaketAta`; Output ana sayfasında "Özel yayın
    paket talepleri", `ouOzel`, yayının adıyla); dış muhabir görevi
    muhabirin kendi işi ("Senin sıran"da yayının adıyla; Görevlendirmelerim
    kartında ve `#/saha`'da da, `ozel.ts → ozelGorevleri`,
    `bilesenler/OzelGorevler.tsx`: bildirimi "görevlendirdi" diyor, muhabir
    orada arıyordu). Teslimi işi yapan
    ya da Planlama `paketTamamla` ile işler (`ozelPaketTeslimEdebilir`;
    Newsdesk şimdilik bu akışta yok). Plansız onaylı paket kuralları
    (üretime alma, kolun sahibi) bu pakete uygulanmaz.
  - Dış görevlendirme genel kayıtta (`Gorevlendirme.ozelId`), "talep":
    News Gathering'in görevlendirmeleriyle aynı yerden onaylanır; planın
    önünde ya da arkasında açılabilir. Özel yayında iki aşama: talepteyken
    planlama, onaylanınca hazır (`gorevHazir`).
  - Yapılacaklar bölümü bölüm bölüm yapılanı sayar, son tarihe göre sıralı,
    geciken kırmızı (`ozelOzeti`, `yapilacaklar`; saklanmaz).
  - Çıktı (`ekranlar/OzelCikti.tsx`) Next Day ve Weekly'nin kağıdıyla aynı
    biçim ve araç çubuğu (`CiktiAraclari`: kopyala, Word, yazdır/PDF), her
    arayüz dilinde Arapça: genel plan, nafizeler (başlık, konu, muhabir,
    konuklar), paketler ("YER / strap / muhabir", son tarih), talepler,
    görevlendirmeler, hazırlık. İptal basılmaz, onay bekleyen öneri basılır.
  - Eski hazırlık maddeleri (`hazirlik`, takvimden aktarılan da) yerinde.
    Kayıt temizliğinde özel yayınla paketleri ve görevlendirmeleri de
    gider. Hareketin özel yayına bağı `Hareket.ozelId`.
- Notta kişi anma (`@`; `bahsetme.ts`, `bilesenler/Anma.tsx`): bütün not
  alanları `AnmaGirdisi` (özel yayın notları, paket notu, durak notu,
  yönetici notu, haftalık kalemin notu, karar notu ve ek talep, öneri
  yazışması). "@" yazınca kişi listesi açılır (ok, Enter, Esc), seçilen
  kişinin Arapça adı nota yazılır; not düz metin kalır. Kimin anıldığını
  eylem metinden çıkarır (`anilanlar`: Arapça ve Latin ad, uzun ad önce,
  sözcük sınırında); her not eylemi `eylemler.ts → bahset` çağırır,
  düzenlenen notta yalnız yeni anılanlar (`yeniAnilanlar`), kendini anma
  sayılmaz. Anılana kayıt (`Durum.bahsetmeler`: notun metni, yazdığı sayfa
  `yol`, kaydın adı) ve bildirim (`bahsedildi`, `kime`; konusu `veri.yol`).
  Kayıt kişinin ana sayfasının başında, düzenden bağımsız, ve Görevler
  sayfasında "Senden bahsedilen notlar" (`AnildigimNotlar`): tıklayınca
  görüldü sayılıp sayfa açılır, "Gördüm" listeden kaldırır
  (`bahsetmeGoruldu`, yalnız kendi kaydı). Gerçek kipte `bahsetmeler`
  koleksiyonu kısıtlı okurlarda: erişim listesi anılan ve yazan; muhabir
  yazışmada Planlama'yı anabilir. Yeni not alanı da `AnmaGirdisi` alır ve
  eyleminde `bahset` çağırır.
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
  - Varsayılan kısayollarda (üst çubuk; telefonda ana sayfa ve Menü'deki renkli kutular)
    altıncı; beş ana başlıktan biri olmadığı için altıncı renk değil,
    lacivert (`.renk-takvim`).
  - Sürükle-bırak yalnız fareyle ve tek seferlik faaliyette; taşımada
    süre korunur, kenar tutamacı tek ucu değiştirir.
- Tasarım dili `src/tasarim.css`: lacivert, beyaz, açık gri. Beş ana
  başlığın her birinin kendi rengi var, kalan her şey tek vurgu rengi.
  Ekranlarda çıplak değer yok. Yerleşim mantıksal CSS özellikleriyle;
  Arapçada sağdan sola kendiliğinden. Tek bilinçli istisna içerik
  hizası: içerik her dilde sağa yaslı.
- Ekranlarda kullanımı anlatan metin yok: açıklama paragrafı, yönerge
  kutusu, ipucu, sayfa alt yazısı. Anlaşılmayan yer olursa kullanıcı
  kendisi ekletir. Kalan kısa satırlar durum bildirir (onay bekleniyor,
  sınır doldu, adım başka birimde). Simge düğmesinin adı `title` ve
  `aria-label`'da kalır. Kullanım anlatımı birim birim kılavuzda (PDF).
  İki istisna: tanıtım sayfası (işi sistemi anlatmak) ve muhabir kılavuzu
  (kullanıcının isteği; `ekranlar/ana/MuhabirKilavuzu.tsx`): İşlerim'in
  üstünde katlanır kart, ilk girişte açık, kapalılığı tarayıcıda
  (`trt-planlama-kilavuz`); metinler `dil.ts → kl*`. "PDF indir"
  kılavuzun temiz kopyasını `body`'ye koyup yazdırmayı açar
  (`html.kilavuz-baskisi`, baskıda yalnız o; belge adı PDF'in adı). Paket
  kapanışı anlatımı Newsdesk anahtarına göre (`kl7b`/`kl7bNewsdesk`);
  muhabirin akışı değişince kılavuz da güncellenir.
- Workspace (`ekranlar/ortam/`, `#/ortam/:id`): kişinin birkaç sayfayı bir
  arada açtığı çalışma ortamı. Kod adı `ortam`, bölme `Bolme`; `Pano` iş
  akışı panosunun adı.
  - Üst çubukta sekme olarak durur (aşağıda). Menüde ayrı madde değil;
    workspace'teyken menüde vurgulu sayfa yok, etkin olan sekmesi.
  - Adı ve numarası yok: sekmede bölmelerin şimdiki sayfalarının kısa
    adları, ekrandaki sırayla ("Next Day · Öneriler +1";
    `Sekmeler.tsx → useOrtamEtiketi`). Kısa ad menüde zorunlu
    (`AnaMenu.tsx → Madde.kisa`, `dil.ts → ka*`).
  - Boş workspace yok. "+" seçim sayfasını açar (`#/ortam/yeni`,
    `YeniOrtam.tsx`): sayfalar sırayla seçilir (en çok 4), "Aç" tek
    yazışla kurar (`ortamOlustur`). "+"ya basılan sayfa ilk sırada seçili
    gelir. Seçim sayfası ve kapanan workspace tarayıcı geçmişine girmez
    (`yol.ts → yerineGit`).
  - Eylemlerin yeri: workspace'in işleri sekmesinde (▾ yerleşim, sayfa
    ekle, kapat; ×), sayfanın işleri bölme başlığında (geri, yanına sayfa
    aç, büyüt, ⋯, ×), genel işler çubukta. Sayfanın üstünde ayrı satır yok.
  - Sayfa seçimi yerinde (`ModulIzgarasi.tsx`, önce kısayollar, sonra
    menünün grupları). "Yanına sayfa aç" ve "Sayfa ekle" geçici bölme açar;
    bölme kayda girmez (`gorunum.ts → eklemeyiAc`). "Sayfayı değiştir"
    bölmenin üstünde katmandır.
  - Kapatma onaysız, bildirimde "Geri al" (`Sekmeler.tsx → useOrtamKapat`,
    `ortamGeriAc`): aynı yere aynı bölmeler, boyutlar ve iç sayfalar. Yalnız
    bölmede açık pencere (yarım form) varsa sorulur. Orta tık ve Delete de
    kapatır; son bölmeyi kapatmak workspace'i kapatır.
  - Kayıtta `Durum.ortamlar` (kişi → workspace'ler), eylemler
    `eylemler.ts → ortam*/bolme*`, kurallar `ortam.ts` (sınırlar,
    `BOLMEYE_GIRMEZ`, `yerlesim`). Bölmeye kişinin menüde gördüğü sayfalar
    girer (`AnaMenu.tsx → bolmeModulleri`).
  - Bölme uygulamanın kendisi: iframe, `?bolme=1` gömülü kip
    (`yol.ts → GOMULU`, `bilesenler/Gomulu.tsx`).
    - Menü, üst çubuk ve prototip etiketi yok.
    - Giriş ekranı, proje planı, workspace ve seçim sayfası bölmede açılmaz.
    - Yarının planını yalnız üst pencere açar.
    - Bölmedeki Ctrl+K üst pencerenin aramasını açar (`BolmeAramasi`).
  - Bölme geçmişi büyütmeden gezinir. Navigation API geçmişe ekleyen adres
    değişimini yerinde değişime çevirir; önceki yollar bölmenin kendi
    yığınındadır. Bölme yerini `postMessage` ile bildirir
    (`BolmeBildirimi`), üst pencere `BolmeKomutu` gönderir.
  - iframe DOM'da taşınmaz, `src`'i değişmez; taşınırsa yeniden yüklenir,
    içindeki iş gider.
    - Sıra ve yerleşim yalnız ızgara alanından (`gridArea`); geçici bölme
      iframe'lerden sonra çizilir.
    - Arkadaki bölme `visibility: hidden`.
    - Sayfa değişimi bölmeye mesajla gider.
  - Yerleşim: yan yana, alt alta, ızgara 2×2, sekmeli. Telefonda hep
    sekmeli. Ayraç sürüklenir ya da ok tuşuyla kayar; boyut bölmenin
    payında (`Bolme.pay`).
  - Bölmenin içindeki yer, açık sekme ve büyütülen bölme tarayıcıda
    (`trt-planlama-ortam`), kayıtta değil: her tıklama bütün bölmelere
    kaydı yeniden okutmasın.
- Üst çubuk (`bilesenler/UstCubuk.tsx`): bütün sayfaların tek ince satırı
  (`--ust-yukseklik`, 52 piksel). Sayfanın kullanılır alanı geniş kalsın
  diye sayfanın üstüne başka satır (şerit, araç satırı, demo satırı, büyük
  kutucuk) eklenmez. Yeni genel iş çubuğa ikon olarak girer, adı ipucunda
  (`title`, `aria-label`).
  - Sıra: ☰, (menü gizliyken) logo, sekmeler ve "+", kısayollar, prototip
    etiketi, arama, dil (TR ▾), zil, avatar (ad, birim ve görev menünün
    başında).
  - Sekmeler (`ekranlar/ortam/Sekmeler.tsx → UstSekmeler`) tarayıcıdaki
    gibi:
    - sabit ilk sekme bulunulan sayfanın ikonu ve kısa adı; workspace'teyken
      bırakılan sayfaya döner (`gorunum.ts → sonAnaYolu`);
    - sonra workspace'ler, sonda "+";
    - etkin sekme sayfanın zeminiyle birleşir;
    - sığmayınca sekmeler daralır, kayar ve "Bütün workspace'ler" listesi
      çıkar.

    Kayan şeridin içindeki menü üst katmanda açılır
    (`IslemMenusu katman`, popover); yoksa şerit kırpar.
  - Kısayollar (`Kisayollar.tsx → UstKisayollar`): ilk altısı renkli kutu,
    simgenin altında küçük harfle menünün kısa adı (`Madde.kisa`; yalnız
    simge anlaşılmıyordu), kutu yazıya göre genişler (`.kisayol-kutu.yazili`);
    ★ hepsini adıyla ve "Kısayolları düzenle"yi gösterir. Kurallar
    `kisayol.ts`:
    - varsayılan planların beş ana başlığı ve takvim; muhabirde çubukta
      kısayol yok (menüsünün aynısıydı);
    - görebildiği sayfalar, en çok 10.

    Kayıtta `Durum.kisayollar` (kişi → sıralı yol), eylem
    `kisayollariKaydet`. Sabit haber başlığı da kısayol olur
    (`basliklar/<id>`; başlık havuzunda ve başlığın sayfasında 📌,
    `Basliklar.tsx → BaslikKisayolu`): adı başlığın kendisi (içerik).
    Başlığın sayfası (`BaslikSayfasi`) son Next Day planlarındaki
    gelişmeleri, muhabirleri, paketleri ve haftalık kalemleri toplar. Ad, ikon ve renk menüden. Renk yalnız planların
    ana başlıklarında, öbür sayfalar sade (`.renk-genel`).
  - Daralma çubuğun kendi eninden (`@container ust`, sol menüden bağımsız):
    önce prototip yazısı, sonra satırdaki kısayollar ★'a çekilir.
  - Prototip etiketi her sayfada: örnek veri gerçek sanılmasın. Tam cümle
    (`demoSerit`) ipucunda ve basınca; telefonda çubukta etiket yok, tam
    cümle çubuğun altında şerit (`Kabuk → .demo-serit`).
  - Arama penceresi (`bilesenler/KomutPaleti.tsx`, kurallar `arama.ts`):
    - açılış: 🔍, Ctrl/⌘+K ya da yazı alanı dışında "/" (tuş `e.code` ile,
      Arapça klavyede de);
    - arananlar: sayfalar (adlar üç dilde), workspace'ler, paket, öneri,
      kişi; yalnız kişinin görebildikleri (`kayitAra`);
    - boşken kısayollar ve workspace'ler.
  - Sayfanın adı sabit sekmede (`sekmeAdi.ts → useSekmeAdi`): `SayfaBasi`
    başlığını, plan ekranları planı ve tarihini ("Next Day · 12 Eki Pzt")
    bildirir. Altındaki büyük başlık ve ikon masaüstünde tekrar olduğu için
    görünmez (`.sayfa-adi-tekrar`; h1 ekran okuyucuda kalır); telefonda
    sekme yok, orada görünür. Kaydın kendisini adlandıran başlık (paket,
    öneri, kişi profili, haber başlığı) yerinde kalır.
  - Sınırda düğme pasif görünür ama odaklanabilir kalır (`aria-disabled`);
    nedeni ipucunda, çünkü pasif düğme ipucu göstermiyor.
- Menü tek tablo: `bilesenler/AnaMenu.tsx → MENU`. Yeni sayfa yalnız
  oraya girer; sol menüde de telefondaki panelde de çıkar. Planların
  menü adları "plan" sözcüğü olmadan: Next Day, Weekly, Aylık, Özel yayın.
  Muhabir listesinde diğer ülkeler, haber türleri ve nitelik puanı
  sütunu yok (süzgeçler duruyor). Personel iki sayfa: "Haber merkezi
  personeli" (`#/personel`, dış muhabir olmayan herkes; birim ağacı ve ünvan
  süzgeci) ve "Dış muhabirler" (`#/muhabirler`, `KOK_DIS` altındakiler);
  Editörler ve Diğer personel kalktı.
  - Muhabirin masaüstü düzeni sade (işi az): sol menü başlıksız tek liste
    (`AnaMenu.tsx → MUHABIR_MENUSU`: İşlerim, Önerilerim, Takiplerim,
    Haberlerim, Görevlendirmelerim, Takvimim; Ayarlar altta ayrık), kutuda
    kendi adı ve ünvanı. Üst çubukta workspace sekmeleri, "+" ve kısayollar
    yok, yalnız sayfanın adı. İşlerim tek sütun: başlıkta "Yeni öneri gönder",
    çağrılar tek kartta, sayaçlar ince satır (`.sayaclar.ince`). "Senin sıran"da
    paketlerden başka plana girmiş öneri de (`Muhabir.tsx → plandaki`): onaylı
    paketi yoksa (Planlama'nın strap'siz girdiği yalnız gelişme olur; PKG
    önerisi plan onayına dek değerlendirmede), planın günü geçmemişse, takipte
    değilse. Kısıtlı muhabir planı okuyamıyor; gün öneride (`Oneri.planTarihi`,
    `oneriPlanaEkle` ve haftalık aktarım yazar, plandan çıkınca silinir). Telefon
    düzeni (alt çubuk, Menü paneli) ayrı ve öbürleriyle aynı kalıyor.
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
  bir düzen. Workspace ve üst çubuk değişikliklerinden önceki haliyle
  duruyor; o değişiklikler telefonda beğenilmedi:
  - sol menü kalkıyor, alta sekme çubuğu (`AltCubuk`) geliyor; Planlama'da
    (ve onun "gibi" çalışan birimde) Next Day yerine Görevler, Next Day
    Menü'de
  - üst çubukta yalnız logo, arama ve zil (çerçeveli, 44 piksel) ve
    avatar; altında prototip şeridi
  - ana sayfanın başında kısayollar renkli plan kutuları (`KisayolKutulari`,
    `.yalniz-telefon`; muhabirde yok, işleri alt çubukta)
  - "Menü" (`MobilMenu`) kişiyi, aynı renkli kutuları, bütün sayfaları ve
    dili bir panelde topluyor. Workspace telefonda yok (bağlantıyla açılan
    çalışır); kısayol düzenleme masaüstünde
- Tablolar telefonda karta dönüyor: `tablo kartli` sınıfı, her hücrede
  `data-etiket`, başlık hücresinde `birincil`. Yeni tablo da böyle yazılır.
  Tek istisna yetki matrisi; o bir ızgara, yatay kayıyor.
- Dokunma hedefi en az 44 piksel. Telefonda yazı alanları 16 piksel; daha
  küçüğünde iPhone sayfayı yakınlaştırıyor, sayfa genişleyip yana kayıyor.
  Kural bilerek ağır seçicili (`html body :is(...)`): özgül kurallar (ekip
  çipindeki görev seçici, süzgeç) onu eziyordu.
- Telefonda üst çubuğun açılır panelleri (bildirimler, kullanıcı menüsü)
  düğmeye değil çubuğa göre, iki yanda 16 piksel boşlukla açılır: zilin
  sağında avatar olduğu için panel ekranın solundan taşıyordu.
- Pencerenin gövdesi tek sütunlu ızgara, sütunu `minmax(0, 1fr)`: içerik
  pencereyi genişletemez (liste görünümündeki tek satırlık gelişme telefonda
  pencereyi açıp başlığı ekran dışına itiyordu). Öneri liste satırında alt
  satır kırılır, karar düğmeleri dar yerde yazının altına iner. Telefon
  denetimi kart ve liste görünümünün ikisinde de yapılır (`oneriGorunumu`).
- Hata sınırı (`bilesenler/HataSiniri.tsx`, `main.tsx`): çizimde fırlatılan
  hata sayfayı beyaz bırakmaz, hatanın metni, "Yeniden yükle", "Ana sayfaya
  dön" ve "Hatayı kopyala" çıkar (normal pencerede beyaz, gizli pencerede
  açık kalan sayfa: tarayıcıda kalan kayıt bozuk bir yola giriyordu). Açılışta
  sistemin işleri (`App.tsx → yokla`) tek tek korumada; biri hata verirse
  atlanır, konsola yazılır.
- Özel yayında konuk listesi: ad kalın, unvan altında sönük, durum rozet gibi
  hap seçici (`.durum-secimi`), ekleme satırı `girdi` alanlarıyla
  (`.konuk-ekle`, telefonda alt alta).
- Doğrulama: `npx vite preview` ile açıp 390 piksel genişlikte her sayfada
  yatay taşmanın sıfır olduğuna bakılır, Arapçada da. Gerçek kip Firebase
  emülatörüyle denenir (`belgeler/gercek-kip.md`).
- Örnek veri kurgusal; kurumun belgelerindeki adlar dahil gerçek personel
  adı yazılmaz.
- Yorumlar Türkçe ve "neden" anlatır, "ne" değil.
- Commit iletisi maddeli: kısa başlık, sonra her madde ne değişti ve neden.
- Bir şey yapmadan önce ne yapacağını söyle.
