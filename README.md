# TRT Arapça · Planlama ve Koordinasyon Platformu

TRT Arapça haber merkezi için tıklanabilir ilk prototip. Haber önerisinden
yayına kadar bütün süreç tek kayıt üzerinde yürüyor. Planlar tek yerde
hazırlanıyor, her birim kendi işini kendi ekranından yürütüyor.

**Adres:** https://ahmetyuksel5.github.io/TRTArabiFlow/ (depo adı
`TRTArabiFlow` olduktan sonra; öncesinde `…/trt-planlama/`). Girişsiz
açılan proje planı sayfası: adresin sonuna `#/plan`.

## Çalıştırma

```sh
npm install      # bir kez
npm run dev      # geliştirme sunucusu
npm run build    # docs/ içine derler; GitHub Pages buradan yayınlar
npm run preview  # derlenmiş hali yerelde
```

## Bu prototipte çalışanlar

- **Demo giriş:** kişi seçiliyor. Ana sayfa ve menü birime göre şekilleniyor
  (Planlama, Newsdesk, News Gathering, Programlar, Ekonomi, Output/dil,
  Media Manager, Muhabir, Yönetim).
- **Ana sayfa:** her birimin kendi çalışma alanlarıyla varsayılan bir
  sayfası var. Kişi "Sayfayı düzenle" ile istemediği alanı kaldırıyor,
  sırasını değiştiriyor, yetkisi olan başka birimlerin alanlarını ekliyor ve
  istediğinde varsayılana dönüyor; düzen yalnız onun sayfasını değiştiriyor.
  Planlama'nın varsayılanı yalın: son gelen muhabir önerileri,
  muhabirlerin durumu ve son hareketler; öbür alanlar katalogda.
- **Üst şerit:** ana sayfanın üstünde tek satır, yalnız ikonlar (ad
  üzerine gelince).
  - Başta ana sayfa, workspace'ler ve "+".
  - Ortada açık sayfanın işleri: Sayfayı düzenle, workspace yerleşimi,
    modül ekleme.
  - Sonda kısayollar: Next Day, Weekly, Aylık plan, Special Coverage, saha,
    takvim. Kalem ikonuyla kişi kendi kısayollarını seçiyor, sıralıyor,
    varsayılana dönüyor.
- **Workspace:** üst şeritteki "+" ile birkaç sayfa (Next Day, haber
  önerileri, başlıklar, takvim…) bir arada açılıyor.
  - Her bölme kendi içinde geziniyor. Birinde yapılan iş öbüründe
    yeniden yüklemeden görünüyor.
  - Yerleşim: yan yana, alt alta, 2×2 ızgara ya da sekmeli. Aradaki çizgi
    sürüklenerek boyutlanıyor, bölme tek tuşla büyüyor.
  - Workspace'ler kişiye kayıtlı ve adlandırılabiliyor. Telefonda bölmeler
    sekmeli.
- **Next Day planı:**
  - plan açma düğmesi yok: planlar her gün kesintisiz sürüyor, yarının
    planını sistem kendisi açıyor (uygulama açılınca ve gün dönünce);
    listede en üstte. Ana sayfadaki "Next Day" kısayolu doğrudan ona gidiyor
  - yeni plan önceki planın şablonuyla geliyor: ekip, devam
    eden hareketler, başlıklar ve muhabirleri, ileri tarihli canlı yayınlar,
    gelişmeler ve takipler taşınıyor; paket önerileri ve hazır paketler
    taşınmıyor. Dünden gelen satırlar çok hafif fonlu; düzenleyince,
    "Bugün de geçerli" deyince ya da plan onaylanınca fon kalkıyor
  - altı bölümlük düzenleme: ekip ve vardiya, muhabir hareketleri, canlı
    yayınlar, hazır paketler, başlık başlık haber gündemi, takipler
  - durum çizgisi: taslak → haber toplantısında → onaylı → Newsdesk devraldı
- **Çıktı önizleme:** kurumun "الأجندة الإخبارية" belgesinin düzeninde.
  Arapça ve sağdan sola, boş bölümler gizli; yazdır/PDF, Word ve kopyala.
- **Belge görünümü** ("Belgede düzenle", Next Day ve haftalık): plan,
  Word'de çalışır gibi çıktı belgesinin üzerinde hazırlanıyor. Yazıya
  basıp yerinde düzeltiliyor; satırın altındaki oklarla taşınıyor, altına
  ekleniyor, ayrıntısı açılıyor ya da çıkarılıyor. Muhabir, saat, haber
  türü, gün gibi seçimler küçük pencerede. Değişiklik plan ekranına
  anında yansıyor; çıktı aynı sayfadan alınıyor. Haftalık toplantıda
  karar da belgenin üzerinden veriliyor
- **Planlama takvimi:** ileride haber olabilecek, önceden bilinen
  faaliyetler (seçim, zirve, konferans, resmî ziyaret, dava, spor, özel
  gün, yıldönümü, muhabir görevlendirmesi…). Yıl, ay, hafta, gün ve
  yaklaşanlar görünümü; Cumartesi başlayan hafta. Öncelik (renkle), haber
  potansiyeli, durum, sorumlu birim ve muhabir, hatırlatma, her yıl / ay /
  hafta tekrar. Arama (arşiv dahil) ve süzgeçler; boş güne basınca o
  tarihle yeni faaliyet; fareyle sürükleyip taşıma. Ayrıntıdan "Next
  Day'e / haftalık / aylık / özel yayın planına ekle": kayıt yalnız
  editörün onayıyla planda açılıyor, plan ekranlarında "Takvimden"
  bölümünde görünüyor. Muhabir yalnız kendisine atananları görüyor
- **Öneriler:**
  - öneri çağrısı, kurumun bugünkü e-postası gibi: Kime planlama grubu,
    muhabirler BCC'de, etiketli konu. "Outlook'ta aç" (taslak dosyası),
    "Telefonda aç" (e-posta uygulaması), BCC adreslerini kopyala
  - gelen yanıtlar: kim yanıt verdi, kim "önerim yok" dedi, kim vermedi;
    hatırlatma; eşleşmeyen e-postayı muhabire bağlama
  - her e-posta yanıtı olduğu gibi tek öneri olarak düşüyor; plancı
    düzenliyor ve aynı yanıttan yeni öneriler ayırıyor, orijinal değişmiyor
  - sunucu gelene kadar köprü: Outlook'tan sürükle-bırak (.msg), .eml ya da
    yapıştırılan metin; sunucunun kullanacağı işlemeden geçiyor
  - gelen öneriler ve değerlendirme
  - plan ekranlarında her öneri bir kart: kol, haber türü (PKG, Walk &
    Talk…), ülke, önerilen başlık ve arkasındaki haber, kısa gelişme,
    kaynak. Karta basınca bütün öneri pencerede açılıyor; plana ekleme ve
    ret orada. Herkes kartla ya da listeyle çalışmayı kendi seçiyor; seçim
    kişiye ait, başka biri girince kendi seçimini görüyor
  - Haber önerileri sayfasında da aynı "Kartlar | Liste" seçimi (süzgeç
    satırının sonunda); liste görünümü tablo, kararlar ayrıntı sayfasında
  - sistem dışından gelen öneri elle giriliyor: Next Day ve haftalık plan
    ekranındaki "Öneri ekle" ya da öneri sayfası. Muhabir adına (telefon,
    mesaj, e-posta, yüz yüze) ya da muhabir dışı kaynaktan (ajans, resmî,
    medya, kurum içi; kaynak adıyla). Öneri listeye "yeni" olarak düşüyor;
    "Kaydet ve plana ekle" (haftalıkta "gündeme ekle") hemen ekleme
    formunu açıyor. Kimin girdiği öneride ve hareket geçmişinde görünüyor
  - mevcut ya da yeni başlığa bağlayıp plana ekleme
  - muhabirlere geri dönüş (muhabir dışı kaynağa geri dönüş yok)
- **Haftalık plan** (Cumartesi–Cuma, Perşembe toplantısı):
  - haftalık öneri çağrısı, kurumun e-postası gibi: dönem kırmızı, yanıt
    adresi Kime'deki planlama adresi, altında muhabirin dolduracağı tablo
    (الدولة | المدينة, اليوم, التاريخ, الحدث و أهميته, مقترح التعامل مع
    الحدث). Konudaki `HP-` etiketi yanıtı o haftanın önerisi yapıyor;
    Next Day planlarına karışmıyor. Muhabir uygulamadan da haftalık öneri
    gönderebiliyor
  - plan ekranı: gelen öneriler (gündeme alma ya da ret), muhabir
    hareketleri, haftanın ana dosyaları, gün gün gündem (dosyalara göre
    gruplu; ad, yer, metin, biçim, muhabirler, not) ve zamana bağlı
    olmayan dosya
  - ön inceleme: stok öneriler toplantıdan önce kolun yöneticisine gidiyor
    (feature: Input müdürü, ekonomi: Ekonomi birimi ve Input müdürü,
    program: Program müdürü). Yönetici görüş yazıyor ya da gerekçeyle
    reddediyor; reddedilen gündemden düşüyor
  - toplantı: her kalem kabul, bilgi (لا نتابع) ya da ret; plan
    kesinleşince kilitleniyor
  - kabul edilen haber gününün Next Day planına kendiliğinden, onaylı paket
    olarak giriyor ("Haftalık plandan" rozeti); plan o gün henüz yoksa
    açıldığında geliyor. Feature, ekonomi ve program kolunun sahibine
    plansız onaylı paket olarak düşüyor
  - muhabirlere kabul/ret geri dönüşü
  - çıktı: kurumun "الأجندة الأسبوعية" belgesinin düzeninde; yazdır/PDF,
    metni kopyala, Word (.doc). E-postayı planlamacı kendisi gönderiyor
- **Stok haberler** (feature, ekonomi ve günü olmayan haber):
  - haftalık toplantıda kabul edilen plansız paketi Planlama'nın
    feature/stok ekibi "Üretime al"ıyor
  - akış: stok ekibi görev verir → metin → kontrol (Output) → dil denetimi
    → video → Media Manager'a ilet (stok ekibi) → klip kodu (Media) →
    montaj kontrolü ve sisteme yükleme (stok ekibi) → paket stokta
  - "Stok haberler" sayfası: üretime alınacaklar, Üretimde / Stokta /
    Yayınlanan sekmeleri, paketin seçildiği plan
  - Next Day'in "Hazır paketler" bölümü stoktan seçiyor; plan Newsdesk'e
    devredilince seçili paketler yayınlanmış sayılıyor ve arşive geçiyor
  - iş panolarında stok paketinin adımı başka birimdeyse kartta yazıyor
- **Ekonomi birimi:** ön inceleme bekleyen ekonomi önerileri, haftalık
  planın ekonomi kalemleri, ekonomi paketleri. Üretimde masası yok; ekonomi
  paketini Planlama'nın feature/stok ekibi yürütüyor.
- **Merkezi haber başlıkları havuzu.**
- **Muhabir profili ve listesi:**
  - fotoğraf (yüklenebiliyor, tarayıcıda küçültülüp saklanıyor), ad,
    iletişim (telefon, kurumsal ve kişisel e-posta, yayın irtibatı),
    kısaltma, çalışma biçimi (kadrolu, retainer, serbest)
  - ana görev bölgesi ve çalışabildiği diğer ülkeler
  - üretebildiği haber türleri: PKG, Live / Is-Live, Vox Pop, Walk & Talk,
    Feature, In-depth, Exclusive Interview, My Story
  - performans: verilen ve tamamlanan haber, zamanında teslim, ortalama
    teslim süresi, ilk seferde kabul, nitelik puanı, öneri kabulü
  - listede ülkeye ve haber türüne göre süzme ("Lübnan'da Live yapabilen")
  - herkes kendi profilini "Profilim"den görüyor; düzenleme kişinin kendisi
    ile Planlama, News Gathering ve Yönetim'de; göstergeleri Output ve
    Media görmüyor
- **Yönetici paneli:** Input müdürü (Planlama, Newsdesk, News Gathering,
  muhabirler), Program müdürü (Program) ve her birim yöneticisi (kendi
  birimi) için.
  - günün sayıları, birim kartları ve gerekçesi yazılı durum ışığı
    (geciken iş, bekleyen karar ya da "yolunda")
  - dikkat gerektirenler: geciken ve öncelikli işler, onay ya da devir
    bekleyen plan, kesinleşme bekleyen haftalık plan, saha talepleri,
    bekleyen talimatlar
  - planların durumu sekmelerde: günlük (Next Day), haftalık, özel yayın,
    saha görevlendirmeleri. Satırda yalnız ad, durum ve ilerleme; basınca
    aşamaları ve birkaç sayıyı gösteren pencere açılıyor
  - ön inceleme bekleyen öneriler (kolu kapsamındaysa)
  - ayrıntı için birimin kendi çalışma ekranına inme
  - müdahale: işi öncelikli yapma ve yönetici notu; ikisi de işi o an
    yürüten birime bildirim
  - haber talimatı: "şunun haberini yapalım". Planlama'ya reddedilemeyen,
    en üstte duran öneri olarak düşer; Planlama plana ekler ve muhabiri
    atar, paket öncelikli doğar. Yönetici durumunu panelden izler.
- **Raporlar:** bugün / 7 gün / 30 gün; üretim, öneriler, birimlerin iş
  yükü, haber türleri, muhabirler. Yazdır/PDF ve Excel (CSV).
- **Paket önerisi ve üretim adımları:** saha, Newsdesk, metin, kontrol, dil,
  video, Media Manager, iNews. Ayrıca geri gönderme, koordinasyon notları
  ve tam hareket geçmişi.
- **Yetki:**
  - birim, rol ve alan bazlı (muhabir ücreti yalnız yetkiliye)
  - muhabir yalnız kendi işini görüyor
- **Üç dil:** Türkçe, Arapça (sağdan sola), İngilizce.

## Henüz uygulanmayanlar

- Yanıtların posta kutusundan kendiliğinden düşmesi: Microsoft Graph ile
  planlama kutusunu izleyen sunucu hizmeti. Kurulum ve BT'ye sorular
  `belgeler/eposta-entegrasyonu.md` içinde. Şimdilik içe aktarma köprüsü.
- Uygulamanın e-postayı kendisinin göndermesi; şimdilik planlamacının kendi
  e-postasından (Outlook taslağı ya da telefon).
- Kurum içi giriş, ortak veri tabanı, çok kullanıcılı eşzamanlı çalışma.
  Veri yalnız bu tarayıcıda (`localStorage`) duruyor.
- Next Day çıktısında Word dışa aktarma (haftalık çıktıda var). Şimdilik
  yazdır → PDF olarak kaydet.
- Dosya yükleme ve dosya deposu.
- iNews ve medya sistemi entegrasyonu. Klip kodu elle giriliyor.
- Aylık ve özel yayın şimdilik temel liste (takvimden kalem ve yayın
  eklenebiliyor, düzenleme ekranı yok).
- Takvim hatırlatmasının e-posta ya da telefon bildirimi; şimdilik
  uygulama içinde.
- Stoktaki paketin geçerlilik süresi; eskiyen stoğun ayıklanması.
- Haftalık plan e-postasının uygulamadan gönderilmesi; şimdilik planlamacı
  çıktıyı alıp kendisi gönderiyor.
- News Gathering talep, onay ve seyahat lojistiği; Program Birimi'nin kendi
  akışı.
- Ücret girişi, onayı ve ödeme takibi.
- Program müdürünün paneli şimdilik genel durum; program akışı birimle
  netleşecek.
- Arapça ve İngilizce metinlerin anadil kontrolü.

## Varsayımlar (geri alınabilir)

- Feature/ekonomi kolunda görev verme, Media Manager'a iletme, montaj
  kontrolü ve sisteme yükleme Planlama'nın feature/stok ekibinde
  ("Feature / stok takibi" unvanı; Planlama yöneticisi de yapabiliyor).
  Metin kontrolü ve dil Output'ta, klip kodu Media'da.
- Stok paketi plana seçildiği an değil, plan Newsdesk'e devredildiğinde
  yayınlanmış sayılıyor.
- Muhabir kendi ücretini görüyor.
- Vardiya kodu GMT başlangıç saati: `04G` = 04:00 GMT.
- Plan onayı Planlama yöneticisinde ya da Yönetim'de; haftalık planı da
  onlar kesinleştiriyor.
- Haftalık toplantıda kabul edilen haber Next Day'e onaylı paket olarak,
  planlamacının ayrıca onayı olmadan geçiyor. Yalnız canlı bağlantı olan
  kalemde paket yok, muhabir başlığın altında. Gündeme hiç alınmamış
  haftalık öneri plan kesinleşince reddedilmiş sayılıyor.
- Yönetici paketlerde kola göre sorumlu: haber kolu hangi birimin
  masasında olursa olsun Input müdürünün. Birim yöneticisi yalnız o an
  kendi masasındaki işe müdahale eder.
- Birim ışığındaki "karar bekliyor": onay ya da devir bekleyen plan,
  bekleyen talimat, yanıt bekleyen saha talebi.
- Örnek kişi ve kayıtlar kurgusal.
- İçerik (başlık, gelişme, paket, script, çıktı, öneri çağrısı) her zaman
  Arapça ve her arayüz dilinde sağdan sola. Arayüz TR/AR/EN seçilebiliyor.
  Latin harfli özel isim serbest; dil denetimi yok.
- Kişi adı rehberde arayüz dilinin yazımıyla, planın içerik satırlarında ve
  çıktıda Arapça.
- Performans göstergelerinin tanımları taslak (ekranda da öyle işaretli):
  zamanında teslim muhabirin videosunun teslim saatinden önce gelmesi,
  ilk seferde kabul metnin düzeltmeye hiç dönmemesi, nitelik puanı
  Newsdesk'in tamamlanan pakete verdiği 1–5. Ölçüt ve hedefler birimle
  netleşecek.
- Örnek veride son iki ayın tamamlanmış işlerinden kurgusal bir arşiv var;
  göstergeler boş görünmesin diye.
- Logo kanalın resmî dosyası (`src/varliklar/logo-trt-arabi.png`), her
  dilde aynı. Koyu lacivert zeminlerde (sol menü, giriş, proje planı)
  köşeleri yuvarlatılmış beyaz bir levhanın üstünde duruyor; logonun
  "عربي" kısmı lacivert olduğu için levhasız okunmuyor. Menü gizliyken üst
  çubukta, beyaz zeminde. Dosyanın kendisi değiştirilmedi.
- Sol menüde gruplar (Planlama, Personel, İçerik ve haberler,
  Görevlendirmeler, İş akışları, Diğer) basınca açılıp kapanıyor; kapalı
  grubun yanında bekleyen iş sayısı. Üst çubuktaki ☰ menüyü tamamen
  gizliyor, sayfa tam genişliğe geçiyor; seçim tarayıcıda hatırlanıyor.
