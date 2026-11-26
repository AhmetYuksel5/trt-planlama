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
    yönetici kapsamı (`kapsam`): kademedeki müdür ağaçta altındaki
    birimlerden (aşağıda, Yönetim kademesi), birim yöneticisi kendi
    biriminden sorumlu; `MUDURLUKLER` yalnız eski Yönetim birimindeki kişi için
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
    etiketi `ND-`, haftalık `HP-` (haftanın Cumartesi'si). Ayrıca gelen posta
    sohbetinin konu çekirdeği (`postaKonuCekirdegi`, "RE:/FW:/رد:" ayıklanıp
    normalleştirilir; aynı yazışma tek iplik) ve ekrandaki başlığı
    (`postaKonuBasligi`)
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
  - Kişi adı arayüzde arayüzün dilinde (`useDil().ad`, `dil.ts →
    kisiAdiDilde`; kullanıcı: önce her dilde Arapçaydı): Türkçede Türkçe,
    İngilizcede İngilizce (yoksa Türkçe) yazım, Arapçada Arapça; o dilde
    yazımı yoksa Arapçası. Plan metninde (çıktı, belge, "YER / ad" satırları)
    ve posta şablonlarında her zaman Arapça (`etiketler.ts → kisiAr`). Profilde
    ve kişi kartında adın altında öbür yazımı (`oburAd`). Avatarın baş harfi
    Latin yazımdan. Kişi formlarında (davet, hesapsız, kayıt, düzenle) Arapça ad
    önde ve zorunlu. Notlar ve gerekçeler yazıldığı dilde (`dir="auto"`).
- Marka Plannersflow (`bilesenler/Logo.tsx`; dosyalar `src/varliklar/
  logo-plannersflow*.png`). Her dilde aynı, aynalanmaz. Yatay düzen (işaret
  solda, yazı sağda): menünün ve üst çubuğun alçak satırında alt alta
  düzenin yazısı okunmaz. Koyu zeminde (sol menü, giriş, proje planı)
  `<Logo koyu />` ("Planners" beyaz), açık zeminde düz `<Logo />`. Boyu
  yerine göre `--logo-*` token'larından. Favicon işaretin kendisi
  (`varliklar/simge.png`, `simge-180.png`). Kurumun eski logosu arayüzden kalktı (TRT عربي logosu yalnız çıktının baskı tasarımlarında);
  paket ve klip kodlarındaki `TRT-AR`, `TRTA_` kurum kodu, marka değil.
- Haber türü (biçim: PKG, Long PKG, Live, Vox Pop, Rushes, Ulay, SOT, Overlay,
  Standup, GFX…; `veri.ts → BICIMLER`) kol'dan (haber, feature/ekonomi, program, özel yayın)
  ayrı alan. Kol akışı belirler, biçim ekrana nasıl çıktığını. "Ulay + SOT"
  Ulay ve SOT'un yanında yeniden seçilebilir (kullanıcı; bir süre eski türdü).
  Seçimden kalkan tür (`ESKI_BICIMLER`: In-depth) eski kayıtta adıyla görünür,
  yeniden seçilmez; kapının
  listesi (`worker/src/ozellikler.ts → BICIMLER`) seçilebilenlerle aynı.
- Demoda veri tarayıcıda (`localStorage`, anahtar `trt-planlama-v25`;
  şema değişince anahtar da değişir) ve örnek kayıtla açılıyor. Gerçek
  kipte (aşağıda) kayıt Firestore'da; ekranlar ve eylemler aynı
  `useVeri`/`getir`/`kaydet`'i kullanıyor, fark yalnız `veri.ts`'in
  yükle/kaydet kısmında.
  - Aynı kaydı birden çok kopya paylaşıyor (workspace bölmeleri, sekmeler).
    Her yazış bir iz bırakır (`trt-planlama-v25-iz`); `getir` iz
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
- İzleme (`izleme.ts`): tam yönetici Organizasyon › Kişiler'de
  kişinin yanındaki 👁 (`Kullanicilar.tsx → IzleDugmesi`) ile sitenin o kişiye
  göründüğü halini açar: `useBen()` izleneni döndürür (menü, ana sayfa, yetki
  onun), oturum yöneticide kalır (`useGercekBen`). Yazış kapalı: `veri.ts →
  kaydet` izlemede hiçbir şey yazmaz, "değişiklik kaydedilmedi" bildirir;
  sistemin yazışları (yarının planı) da durur, yapay zeka düğmeleri görünmez
  (kapı yöneticinin oturumuyla çalışırdı). Sekmeye bağlı (`sessionStorage`,
  `trt-planlama-izleme`; bölmeler de izler), sekme kapanınca ya da şeritteki
  "Çık"la biter; kişi değişince ya da tam yönetici olmayanda iz silinir.
  Kabukta "X olarak izliyorsun" şeridi.
- Eğitim sahnesi (kullanıcı: eğitim ve sunumda aşamaları rol rol, eş zamanlı
  göstermek; tek başına anlatırken adım adım; `ekranlar/Egitim.tsx`,
  `#/egitim`, yalnız demoda, oturumsuz da açılır; avatar menüsünde "Eğitim
  sahnesi"). Ekran bölmelere ayrılır, her bölme uygulamanın kendisi
  (`?bolme=1&kim=<kişi>`: `oturum.ts → BOLME_KISISI`, bölmenin kişisi
  tarayıcının oturumuna yazılmaz, öbür bölmeleri değiştirmez); kayıt ortak,
  muhabirin gönderdiği öneri Planlama'nın bölmesine hemen düşer. Düzen "Roller
  yan yana" (senaryonun kişileri, en çok dört: muhabir, Planlama ve yolun
  masaları, `senaryoKisileri`) ya da "Tek ekran" (tek bölme, kişisi sıradaki
  adımınki). "Örnek veriyle baştan başlat" demo kaydını örnek veriyle kurar
  (onaylı), senaryonun başlangıcını tarayıcının sekmesine yazar
  (`sessionStorage`, `trt-planlama-egitim`). Senaryo "Öneriden yayına"
  (`egitim.ts`, saf): kayda bakar, yazmaz; sıradaki adım her an kayıttan çıkar
  (öneri gönderildi mi, plana PKG'yle girdi mi, kabul, üretim başladı mı,
  sonra paketin yolu: `asamaListesi`), adım yapılınca kendiliğinden geçilir.
  Üretimden sonraki adımlar paketin yolundan, kişi masadan (`masaKisisi`:
  örnek veride o birimin kişisi); metin durağında parçaların hâlinden
  (muhabir, editör, dil, iade, video), gfx bekleniyorsa grafik. Adımın
  bölmesi mavi çerçeveli, sayfası mesajla açılır (`trt-bolme-git`), basılacak
  düğme bölmenin içinde yanıp sönen halkayla (`egitimVurgu.ts`, `.egitim-vurgu`;
  bölme yer değiştirdikçe ve pencere açıldıkça yeniden aranır). Üretim adımı
  balonda "Günlük haber · Newsdesk" şablonunu gösterir (daha çok rol). Anlatım
  metni burada yazılı (`dil.ts → eg*`): tanıtım sayfası gibi işi anlatan sayfa.
  Test `testler/egitim.cjs`. Sonraki adım çok bilgisayarlı eğitim odası
  (kayıt Firebase'de ayrı alanda).
- Tanıtım sayfası (`ekranlar/Tanitim.tsx`): adres çıplak açılınca (hash
  yok) demoda tanıtım gelir; `#/tanitim` her kipte açar. Üstte Demo
  (demo kişi seçimi) ve Giriş (`#/gercek-giris`). Gerçek kipte kalmış
  kişi çıplak adreste doğrudan sisteme girer. Sayfa içi bağlantı `#…`
  olamaz (hash yönlendirmesi), bölümlere düğmeyle kayılır. Logoya üç tık
  kalktı. İçerik bugünkü akışla (kullanıcı: eskimişti, beş sabit aşamayı ve
  Newsdesk devrini anlatıyordu): beş adım öneri, plan ve toplantı, görev,
  üretim yolu, yayın ve künye (`ADIMLAR`); on iki özellik kartı (Posta,
  Masalar, Stok ve programlar, Takvim ve gündem, Muhasebe ve künye da);
  dört ilke ("Telefonda da tam"). Sayfa girişsiz okunduğu için metin genel:
  kurumun altyapısının adı (posta sunucusu, yayın sistemi), adres ve kişi
  geçmez; birimler varsayılan yapıdan. Test `testler/tanitim.cjs`.
- Proje planı (`ekranlar/ProjePlani.tsx`, `#/plan`) kurumun iç tartışma
  notları (açık sorular, altyapı, yol haritası): yalnız gerçek kipte giriş
  yapmış kişiye (`yetki.ts → sayfaGorebilir`, `App.tsx`'te giriş denetiminin
  arkasında; kullanıcı: tanıtımda mahrem olabilecek bilgi). Demo şifresiz ve
  herkese açık, orada menüde, avatar menüsünde ve telefon panelinde yok,
  adres "erişimin yok" açar; tanıtımın altındaki ve demo girişindeki
  bağlantı kalktı.
- Gerçek kip (`kip.ts`, `belgeler/gercek-kip.md`): giriş tanıtımdaki
  "Giriş"ten (`#/gercek-giris`, `ekranlar/GercekGiris.tsx`); demodan
  kullanıcı menüsündeki "Kurum girişi"nden de.
  - Gerçek kipte üst çubukta "Demo" (ve kullanıcı menüsünde "Demoyu
    dene"; `kip.ts → demoyuAc`): Firebase oturumu kapanmadan demoya geçer.
    Girişe dönen kişinin oturumu tarayıcıda açıksa şifre sorulmaz
    (`depo/firebase.ts → sakliOturum`). Çıkış oturumu kapatıp tanıtıma döner.
  - Hesap davetle açılır (Organizasyon › Kişiler, `ekranlar/Kullanicilar.tsx`; yalnız hesap
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
    "Düzenle"de kaydedince ya da "Onayla"yla (`eylemler.ts → kayitOnayla`,
    hareket `kayitOnaylandi`, kişiye bildirim) işaret kalkar. Onay bekleyenler
    kişi düzenleme yetkilisinin ana sayfasının başında (düzenden bağımsız),
    Organizasyon'un her sekmesinin üstünde kart (`bilesenler/HesapOnayi.tsx →
    OnayBekleyenHesaplar`), menüde Organizasyon'un sayısı; önce yalnız
    Hesaplar listesinde rozetti, yönetici bekleyen kişiyi görmüyordu. Kural `kayitGecerli` (açık,
    süresi geçmemiş, e-posta doğrulanmış, yöneticisiz).
  - Giriş kodu (kullanıcı: kurum postası kayboluyor, kişiler özel adres
    vermiyor; `girisKodu.ts`): e-postasız hesap. Yönetici Kullanıcılar'da
    "Giriş kodu" sekmesinden (davet yetkisi; hesapsız kişide "Hesaba bağla"da
    da) kullanıcı adı (Latin addan önerilir) ve ad girer; `depo/firebase.ts →
    kodlaDavetEt` ikinci örnekte hesabı `<ad>@giris.plannersflow.net` sahte
    adresiyle, şifresi koddan (`kodSifresi`) açar, daveti (kod, `bitis` 48
    saat) ve kodun okuma belgesini (`girisKodlari/<kod>`: adres, kullanıcı adı,
    süre) yazar. Pencerede kod (XXXX-XXXX), kullanıcı adı, süre; "Mesajı
    kopyala" ve WhatsApp (kod gömülü `#/kod/<kod>` bağlantısıyla). Kişi
    `#/kod`'da (`ekranlar/KodlaGiris.tsx`; girişte "Giriş kodum var") kodu
    girer, koddan girilir, kayıt davetten kurulur (`ilkKayit`; kod davetinde
    e-posta doğrulaması yok), kendi şifresini belirler, kod belgesi silinir:
    kod tek kullanımlık, şifre değişince girmez. Sonra kullanıcı adı ve
    şifreyle (`girisAdresi`: "@" yoksa sahte adres). Şifre sıfırlama e-postası
    yok ("Şifremi unuttum" nedenini yazar): yönetici satırdaki "Yeni kod"la
    yeni kullanıcı adıyla (ali.kaya → ali.kaya2) yeni hesap açar, eski kayıt
    `yeniEposta` işaretlenir, kişi yeni kodla girince kaydı `hesabaGecir`'le
    taşınır (başkasının şifresi tarayıcıdan değişmiyor). Kullanılmamış kodun
    yenisi `kodYenile` (eski kodla girip şifreyi yeni koda çevirir).
    Kurallar: `girisKodlari` herkes `get`, liste yok, yalnız davet yetkilisi
    yalnız giriş adresine yazar, sahibi siler; davetle kayıt `bitis`'ten
    sonra kurulmaz. Kod hesabında kayıttaki `eposta` giriş adresi: posta
    gönderen her yer `postaAdresi` (kurum adresi `Kisi.kurumEposta`;
    hesaba bağlanan hesapsızın eski adresi oraya geçer, "Düzenle" ve profil
    formundaki e-posta onu değiştirir). Testler `testler/kurallar.mjs`,
    emülatörle uçtan uca `testler/giris-kodu.mjs` (`belgeler/gercek-kip.md`).
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
  - E-posta listesiyle eşleştirme (kullanıcı: çağrının CC'sindeki muhabir
    adreslerini teker teker girmek istemiyor; `epostaEslestir.ts`, pencere
    `Kullanicilar.tsx → EslestirPenceresi`, Dış muhabirler sayfasının başında
    ve Organizasyon › Kişiler'in ⋯'sinde). Liste yapıştırılır (virgül, noktalı
    virgül, satır, "Ad <adres>"), adresin yerel kısmı muhabirin Latin adının
    parçalarıyla (Türkçe/aksanlı harf Latin'e; kayıtlı adreslerin yerel
    kısmı da parça) karşılaştırılır: noktalı, bitişik, rakamlı yazım tutar.
    En az iki parça tutan ve ikinciden açıkça iyi olan "eşleşti" (işaretli);
    tek parça ya da eşit adaylar "seçilecek" (adaylar önce), hiç tutmayan
    "bulunamadı", başkasında kayıtlı "zaten kayıtlı". Yanlış kişiye yazılan
    adres çağrı yanıtını başkasının önerisi yapardı; bu yüzden kesin olmayan
    işaretsiz. Alan: boşsa kurumsal (çağrının BCC'si oradan), sonra kişisel;
    aynı kişinin listedeki ikinci adresi öbür alana, üçüncüsü "alanlar
    dolu". Hesabı açık kişinin kurumsal adresi giriş adresi, buradan yazılmaz
    (kişisele; değişimi "Düzenle"deki aktivasyon akışı). Kayıt
    `eylemler.ts → epostaListesiUygula` (kişi düzenleme yetkisi; başkasında
    kayıtlı adres atlanır). Gerçek adresler depoya girmez: liste tarayıcıda.
    Test `testler/eposta-eslestir.cjs` (kurgusal adresler).
  - Postadan kişiler (kullanıcı: posta çoğunlukla haber merkezi
    çalışanlarından geliyor, onları personele eklemek, kayıtlıların eksiğini
    tamamlamak, birimini kolayca vermek istiyor; Organizasyon › Kişiler'de
    düğme, `organizasyon/PostaKisileri.tsx`, kurallar `postaKisileri.ts`):
    kayıtlı postalardaki kurum adresleri (`KURUM_ALANLARI`: trt.net.tr,
    trtarabi.com; demoda ornek.local) gönderen, Kime ve CC'den toplanır;
    grup kutuları (`PostaMesaji.grup`, `GRUP_ADRESI` deseni) ve otomatik
    adresler girmez. İmzadan (`eposta.ts → imzaSatirlari`, `imzaBilgisi`;
    sadeleştirmeyle aynı imza bölgesi, `imzaBolgesi`) telefon (cep önce),
    ünvan satırı (kurum adı ayıklanır) ve Arapça ad okunur; ünvan ve birim
    Organizasyon'daki adlarla üç dilde eşlenir (`birimUnvanTahmini`: önce
    ünvan, adı metinden atılıp birim; birim yoksa ünvanı taşıyan ilk haber
    merkezi birimi). Kayıtlı kişiyle eşleme e-posta eşleştirmesinin kuralıyla;
    tek sözcük tutan (yaygın ad) aday yalnız öneri, satır "yeni". Kümeler:
    yeni, eksik bilgi, seçilecek, kayıtlı. Birim ve ünvan satırda seçilir,
    işaretli satırlara üstteki çubuktan toplu verilir. "Seçilenleri kaydet"
    tek yazış (`eylemler.ts → postaKisileriUygula`): yeni kişi hesapsız
    (gerçek kipte), Arapça adı zorunlu, `hesapsizKisi` yetkisi; kayıtlı
    kişide yalnız boş alan dolar (adres `bosAlan` kuralıyla, telefon), birim
    ya da ünvan değiştiyse tayin (`kisiTayinEdildi`), `kisiDuzenle` yetkisi.
    Gerçek bilgiler depoya girmez, kayıtta kalır. Test `testler/posta-kisileri.cjs`.
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
    Hesaplar sekmesinin satırındaki şehir seçimi Kişiler'e taşınmadı, şehir "Düzenle"de;
    `bilesenler/SehirSecimi.tsx → SatirSehirSecimi` duruyor: seçilen hemen kaydedilir (`eylemler.ts → kisiSehri`;
    profili düzenleyebilen ya da `kisiDuzenle` yetkili), "+ Yeni şehir…"
    küçük pencerede; "Düzenle" penceresinde de şehir. Seçenekler ve yeni şehir
    alanları her yerde aynı bileşenden (`SehirSecenekleri`, `YeniSehirAlanlari`).
  - Muhabir listesinde ve profilde WhatsApp düğmesi (`bilesenler/
    WhatsApp.tsx`): telefonda `wa.me`; numara uluslararası biçime çevrilir
    ("00…", başta tek sıfır Türkiye). Bilgisayarda önce masaüstü uygulaması
    (`whatsapp://`; kurum onu kullanıyor, açık uygulamada sohbet açılır).
    Uygulama açılınca sayfa odağı kaybeder; 1,5 saniyede kaybetmezse
    uygulama yok sayılır, WhatsApp Web açılır. Seçim ayarı yok (kullanıcı:
    "Bilgisayarda WhatsApp" ayarı gereksizdi, kalktı): hep önce uygulama.
    Web sabit adlı pencereye açılır (`plannersflow-whatsapp`, `rel` yok);
    kişinin kendi açtığı WhatsApp Web sekmesine site ulaşamaz.
  - Seçmeli hesap yetkileri (`veri.ts → HESAP_YETKILERI`, `Kisi.yetkiler`):
    davet, kayıt bağlantısı, kişi düzenleme, hesap kapatma/açma, hesapsız
    kişi ekleme; öneri akışının yetkileri (tasarım 7. bölüm): paket işaretinin
    onayı (`paketOnayi`), aşamayı geri alma (`geriAlma`), başka muhabire verme
    (`baskaMuhabire`), arşivden çıkarma (`arsivdenCikarma`), öneriyi izleriyle
    silme (`oneriSilme`); `yetki.ts → paketIsaretOnaylayabilir`, `geriAlabilir`,
    `baskaMuhabireVerebilir`, `arsivdenCikarabilir`, `oneriSilebilir`. Bunlar
    programda, kuralda değil. Tam yönetici (`hesapYoneticisi`) hepsine sahip; yetki
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
    "Silindi" işaretleri birikmesin diye tam yöneticinin tarayıcısı 30 günden
    eskilerini haftada bir siler (`depo/firebase.ts → eskiIzleriSil`); 20
    gündür sunucuyla eşitlenmemiş tarayıcı önbelleğe güvenmeyip baştan tam okur
    (`bayatsaTamOku`, `trt-planlama-son-esitlik:<proje>`): işareti kaçıran
    tarayıcı silmeyi öğrenemezdi.
    Günlük okuma kotası (50.000) kurum tam kullanmadan doldu, posta ve yapay
    zeka durdu (kullanıcı): kişiye bağlı ayarlar (`HARITA_ALANLARI`, fark
    sorgusu yok) her açılışta herkesinkiyle baştan okunuyordu; artık kişi
    yalnız kendi belgesini (ana sayfa düzeninde `<uid>:` önekli belgeleri)
    dinler, tam yönetici hepsini (kayıt temizliği ve hesap geçişi
    başkalarınınkine bakıyor). Posta mesajları yalnız postayı kullanan sekmede
    (`depo/firebase.ts → postaDinle`; bu tarayıcıda Posta ya da Postadan
    kişiler açıldıysa açılıştan, `trt-planlama-posta-kullanir`); sayfa
    çekmeden önce listenin sunucudan gelmesini bekler (yarım listeyle aynı
    posta ikinci kez eklenirdi). Ayarlar › "Okuma sayacı" (tam yönetici,
    gerçek kip; `okumaSayilari`): bu tarayıcının kota günü boyunca
    sunucudan aldığı belgeler, koleksiyon başına; bütün sekme ve açılışlarda
    birikir (`trt-planlama-okuma:<proje>`), kota günü (ABD Pasifik) değişince
    sıfırlanır, kartta sıfırlanma saati (kullanıcı: sekmeye bağlıyken her
    açılışta sıfırlanıyordu). Kurumun toplamı değil, bu tarayıcınınki;
    faturanın birebiri değil, tüketeni gösteriyor.
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
    Plan belgesi kaybolup bağlı gelişme, canlı ya da paketi kalırsa
    (`kayipPlanlar.ts`; gün `nd-<tarih>` kimliğinden ya da açılış
    hareketinden) sistem o günü yeniden açmaz, plan hiç görünmüyordu: Next
    Day listesinde (ve plansız `#/nextday/yarin`'de) "kaydı kaybolmuş" şeridi,
    "Planı geri getir" (`eylemler.ts → kayipPlaniGeriGetir`, `planDuzenle`)
    aynı kimlikle boş plan açar, kayıtlar ona döner, başlıkları "Başlığı
    kaybolmuş" şeridi geri koyar; ekip önceki planın şablonundan.
    Sistemin yazışları bağlantı canlıyken çalışır (`kip.ts → baglantiCanliMi`:
    dinlenenlerden biri bile önbellekten geliyorsa değil): eşitlik bir kez
    olunca sürüyor, uyuyup bağlantısız uyanan dizüstü yarının planını bayat
    görüntüyle kurup düzenlenmiş planı eziyordu.
    Zaman sorgusunda `removed` silme sayılmaz (`diziDinle → isle(alan,
    true)`): kendi yazışımız sunucuya varana dek `z` bekleyen sunucu zamanı,
    belge sorgudan bir an çıkıyor; silinmiş sayılınca kayıt ekrandan kalkıp
    sayfa başa dönüyordu (haftalık toplantıda her kararda).
  - Kurallar (`firestore.rules`) "etkin kişi"yi, hesap alanlarını
    (`pasif`, `hesapYoneticisi`, `eposta`) ve kısıtlı kişiyi denetliyor;
    öbür birim yetkisi programda.
    - Kişi kaydının metni (`j`) düz alanlarla tutarlı olmalı (`jTutarli`):
      program kişiyi `j`'den kuruyor, kişi kendi `j`'sini yazabiliyor; içine
      "hesapYoneticisi": true yazıp yöneticinin tarayıcısı onu düz alana
      taşıyınca tam yönetici oluyordu. Okumada yetki alanları düz alandan
      (`depo/fark.ts → kisiBelgedenOku`); birim, rol, görev düz alanda da
      (`ogeBelgesi`) ve `j`'de bir kez. Bunları ve `ucretYetkisi`'ni yalnız tam
      yönetici ve kişi düzenleme yetkilisi değiştirir (`pozisyonAyni`; şehirden
      gelen muhabir ünvanı hariç). Yetkili dallar kuralda önce: pozisyon
      karşılaştırması pahalı, reddedilen dal 1000 ifade sınırını doldurup
      meşru yazışı düşürüyordu.
    - Kısıtlı kişinin yazdığı içerik (`kisitliIcerik`): önerinin durumu yalnız
      yeni/takip açma, düzeltip yeniden gönderme, takibi öneriye çevirme ve
      geri çekmeyle; paketin durumu değişmez (özel yayın paketinin teslimi
      hariç); hareket ve mesaj yalnız kendi adıyla (düz `k`, `ogeBelgesi`).
    - Davetle ilk kayıt (kod incelemesi, `belgeler/kod-inceleme.md`): adres doğrulanmış olmalı (giriş kodu
      adresi hariç); davet edilecek adresle önceden hesap açan daveti üstleniyordu. Şifre belirleme bağlantısı
      doğruluyor; doğrulanmamış hesap `ilkKayit → "dogrulanmadi"`. Rol ve görev de davetteki (davetli kendini
      yönetici kurabiliyordu). Özel yayın teslimi yalnız eski belgede de `ozelId` olan pakette.
    - Önceki kimlik yalnız o kayıt hesapsızsa, e-postası bu hesaba
      taşınıyorsa ya da silinmişse (geçişi tam yönetici tamamlamış) geçerli
      (`oncekiGecerli`; silinince sayılmıyordu, tarayıcı iki kimlikle
      sorguladığı için muhabir "permission-denied"la hiç giremiyordu; kişi
      önceki kimliği kendisi yazamıyor, kayıt bağlantısında boş); davetteki `kisiId` hesapsız kişiyi
      ya da kişi düzenleme yetkilisinde yöneticisiz, yetkisiz kişiyi gösterir
      (`davetKisisi`). Test `testler/kurallar.mjs` (`belgeler/gercek-kip.md`). Davetler `Durum`'da değil, `davetler`
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
  - Kişi kaydı kapıda önbellekte (`index.ts → kisiGetir`, Cache API, 10 dakika
    taze): her istekte Firestore'dan okuyordu, ücretsiz planın günlük okuma kotası
    dolunca (429) posta ve yapay zeka bütünüyle kilitleniyordu. Firestore kota,
    sunucu ya da bağlantı yüzünden yanıt vermezse son 24 saatte okunmuş kayıt
    kullanılır; "pasif" ve bulunamayan kişi önbelleğe girmez. Önbellekte kaydı
    olmayan kişiye kotada `hata: "kota"` (503); ekran "kapıya ulaşılamadı" yerine
    kotanın dolduğunu ve yenilenme saatini yazar (`yz.ts → kapiHatasi`,
    `dil.ts → kapiKota`; kota ABD Pasifik gece yarısı, İstanbul 11:00/yazın 10:00).
  - **Ayar kapının KV deposunda, Firestore'da değil:** sağlayıcılar,
    anahtarlar, uç nokta adresleri, özellikler (açık, sağlayıcı, birimler,
    kişi başına günlük sınır).
    - Firestore'u her etkin kişi yazabildiği için adres oradan okunsaydı
      anahtar başka sunucuya yönlendirilebilirdi.
    - Model sağlayıcının listesinden seçilir (`/modeller`, "Modelleri getir";
      formdaki yeni anahtar yalnız o istekte kullanılır). Kayıtlı anahtar yalnız
      kayıtlı adrese ve türe gider; istekteki adres yalnız yeni anahtarla. Hata metinleri
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
    dilinde) ve genel kanaat; öneri kartında rozet yok (kullanıcı: kararı
    yönlendiriyordu, kart kalabalıktı). Yalnız tavsiye,
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
  - **Asistan** (kullanıcı: kişi düğmeye basmadan, yalnız doğal dille, yazarak ya da konuşarak iş
    yaptırsın; sonra: planlamacının bütün işleri, ekranlar olmasa da panelden; plan `belgeler/asistan.md`):
    yüzen düğme ve Ctrl/⌘+J (`bilesenler/Asistan.tsx`, kabukta; kısıtlı kişide ve izlemede yok), mikrofon
    tarayıcının konuşma tanımasıyla (söylenen doğrudan gider). Kapı yazmaz: `/asistan` ucu
    (`worker/src/asistan.ts`: araç tanımları `ARACLAR`, yönerge, konuşma denetimi `asistanIstegiCoz`;
    `saglayici.ts → asistanCagir`, şimdilik yalnız Claude, araç listesi önbellekte) konuşmayı modele
    götürür, araç isteklerini döndürür; araçları tarayıcı kişinin kendi yetkisiyle var olan eylemlerle
    çalıştırır (`src/asistan/araclar.ts`, `OKUMA` ve `YAZMA`; adlar kapıdakiyle aynı). Döngü
    `src/asistan/motor.ts` (en çok 8 tur; konuşma sekmede, `trt-planlama-asistan`). Okuma araçları
    (öneri, plan, Weekly, paket, kişi, takvim, iş, hareket) hemen; yazma araçları (öneriler, Next Day,
    Weekly, paketler, iş, takvim, posta; tam liste belgede) onay kartı açar: işin formu (`Form`: alanlar,
    seçenekler kayıttan, plan → başlık bağlı seçim, "+ Yeni başlık"ta ad), değerler modelin doldurduğu;
    kişi değiştirir (`onayDegeri`), "Onayla" (postada "Gönder") ya da "evet/tamam/نعم/yes" yazar ya da
    söyler, iş formun son haliyle yapılır; zorunlu alan boşsa bekler (`eksikAlanlar`), başka bir şey
    vazgeçirir (`onayYaniti`). Asistanın yanıtı biçimli çizilir (kullanıcı: "**…**" yıldızlarıyla görünüyordu; `bilesenler/AsistanMetni.tsx`: kalın, eğik, kod, madde ve sıralı liste, başlık satırı; HTML enjekte edilmez). Ekranın düğmeyi göstermediği halde araç form açmaz, nedenini döner. Kapıda
    "YAZMA" açıklı araç tarayıcıda formlu tarafta olmak zorunda (kapı testi). Asistan da yapay zeka
    özelliği (`asistan`; Ayarlar › Yapay zeka'da açılır, birimler, günlük sınır yalnız kişinin kendi
    iletisinde artar). Demoda kapıya gidilmez ("gerçek kipte çalışır"); test sahte modelle
    (`window.__asistanModeli`): `testler/asistan.cjs` (form, düzeltme, eksik alan, bağlı seçim, çoklu
    seçim, her yazma aracının formu), kapıda `worker/test/asistan.test.ts`.
    Yeni araçlar (kullanıcı: asistan muhabir ekleyebilsin, yetenekleri artsın): `muhabirEkle` (hesapsız dış
    muhabir, Arapça ad zorunlu, aynı Arapça adla kayıtlıysa "zatenKayitli", şehir adından da çözülür;
    `hesapsizKisiEkle` artık demoda da çalışır ve ünvanı şehirden kurar), `muhabirBilgisiDuzenle`,
    `takipSatiriEkle`, Next Day'e `nafizeEkle` ve `ekibeEkle`, Weekly'ye `haftaCanliEkle` ve
    `haftaNafizeEkle`; okuma `gununNotu`, `muhabirRaporu`. Nafize formu ortak değil, araçta saatler
    virgülle ("8, 11:30", `saatCoz`), her saat ayrı nafize. `kalemEkle`'de Strap varsa metin isteğe bağlı
    (kullanıcı: asistana metinsiz paket ekletemiyordu; form alanının `yeter`'i: o alan doluysa zorunluluk
    düşer), kapının tanımı bir dosyaya birden çok PKG'yi ayrı kalem diye anlatır. Test `testler/asistan-yeni.cjs`.
    Güçlendirme (kullanıcı: asistanın yetenekleri artsın; muhabirin asistanı ve demoda çalışma hariç):
    ekran bağlamı (`src/asistan/ekran.ts`: adresin kaydı ve sayfaların `useEkranKaydi`'yle bildirdiği seçim,
    açık öneri penceresi, toplantıda seçili kalem/paket; istekte `baglam.ekran`, yönergede "Ekranda şu an";
    "bunu plana ekle" kimlikle gider); toplu onay (aynı yanıttaki birkaç yazma aracı tek kartta,
    `Gorunen.isler`, iş başına seçim kutusu, "Seçilenleri onayla · n"; seçilmeyen `vazgecti`, eksik alanı
    olan seçili iş kartı bekletir; okuma araçları eşzamansız da olabilir); yeni araçlar: okuma `stokListele`,
    `postaOzeti` (kişinin grubunun son sohbetleri, gerçek kipte postayı yükler), `gundemOzeti` (bu tarayıcıdaki
    son taramadan olaylar, `gundemGorebilir`), `arastirmaArsivi` (kullanıcı: asistan araştırma arşivimi kullanabiliyor mu; kişinin kendi `gundemArsivi` notları, sözcük, konu ve eklendiği gün aralığıyla, en çok 30); pencere açanlar (`src/asistan/pencere.ts →
    asistanPencereIste`, kendi penceresi zaten onay ekranı) `planGonder`, `staffingEkibeYaz`, `imlaDenetimi`
    (imla ve plan postası pencereleri asistan panelinde, her görünümde); yazma `hazirPaketEkle`,
    `uretimeBaslat` (şablonla), `pkgGeriBildirimi` (kurumun şablonu, paket başına posta), `oneriDuzenle`
    (kısalt/biçimle: metni model yazar, kişi formda görür), `aylikOlayEkle`, `ozelNafizeEkle`,
    `ozelMaddeEkle`, `ozelOnayla`. Boş panelde "seni bekleyenler" çipleri (`Asistan.tsx → Bekleyenler`,
    sayılar `planlamaKararlari.ts`'ten; basınca soru olarak gider). Uzun ya da çok turlu istekte effort
    medium (`worker/src/asistan.ts → derinMi`), max_tokens 8000. Test `testler/asistan-guclu.cjs`.
    Weekly kalemi Next Day gelişmesinin alanlarıyla (`kalemEkle`: saat, Teams virgülle, Schedule satır
    satır "SS:DD olay") ve günün dosyasına muhabir, yer, not, TBC, LIVE (`haftaDosyaMuhabiri`).
  - **"İmla denetimi"** (kullanıcı: plan metinlerinde imla düzeltilsin ama tatsız
    sürpriz olmasın; özellik `imla`): Next Day ve Weekly'nin ⋯ menüsünde
    (`data-arac="imla"`, `bilesenler/YzImla.tsx → ImlaPenceresi`). Satırlar
    `imla.ts → ndImlaSatirlari` (gelişme, PKG Strap ve açıklaması, canlının konusu;
    başlık adı havuzda ortak, girmez) ve `hfImlaSatirlari` (kalemin metni ve Strap'i,
    ana dosyanın özeti); kimlik "<tür>:<kayıt>". Model düzeltilmiş satırı yazar,
    öneriye neyin geçeceğine kapının süzgeci karar verir (`worker/src/imla.ts`,
    yönergeye bırakılmaz): sözcük sayısı değişen ya da dörtten çok sözcüğü değişen
    satır bütünüyle atılır; hemze, ة/ه, ى/ي kendi aralarında serbest, başka harf
    değişikliği kısa sözcükte hiç, uzunda bir-iki harf; rakam ve Latin harf taşıyan
    sözcüğe dokunulmaz; yalnız hareke ekleyen sayılmaz. Tarayıcı aynı kuralı
    (`imla.ts → sozcukDuzeltmesiMi`) uygulamadan önce yeniden sorar. Pencerede satır
    satır, değişen sözcük işaretli, öneriler işaretsiz gelir ("Hepsini seç" var);
    yalnız seçilenler "Seçilenleri uygula"yla tek yazışta (`eylemler.ts →
    imlaUygula`, hareket `imlaDuzeltildi`), satır o arada değiştiyse öneri atlanır,
    ↶ geri alır. Yetki plan ekranındaki düzenlemeyle aynı (onaylı PKG'de paket metni,
    kilitli Weekly kalemi değil); "önceki gün" işareti kalmaz. Demoda kapıya
    gidilmez, sık hemze hataları sabit listeden (`demoImla`). Test `testler/imla.cjs`,
    kapıda `worker/test/imla.test.ts`.
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
- Gündem takibi (`ekranlar/Gundem.tsx`, `#/gundem/<sekme>`, kurallar `gundem.ts`;
  tam yönetici ve paylaştıkları, `yetki.ts → gundemGorebilir`): haber akışlarından (RSS,
  Atom) jeopolitik izleme. Yapay zeka yok, her tarama ücretsiz.
  - Paylaşım: tam yönetici sayfadaki paylaş düğmesinden birim (alt birimleriyle)
    ve kişi seçer (`Durum.gundemPaylasim`, genel ayar belgesinde; `eylemler.ts →
    gundemPaylasimKaydet`). Muhabir ve onay bekleyen paylaşılmaz. Paylaşılan sayfayı tam
    kullanır (tarar, arşive not düşer, fırsatı öneriye çevirir; `oneriGonder` her birimde); kaynakları ve paylaşımı yalnız tam yönetici değiştirir. Kural
    genel belgede `gundemPaylasim`'ı yalnız tam yöneticiye yazdırır (herkes sayacı
    yazıyor, kendini ekleyemesin); kapı `/rss`'te genel belgeyi kişinin oturumuyla
    okuyup kişiyi ya da birimini arar (`index.ts → gundemPaylasildi`; alt birim
    kapıda tanınmaz, seçilen birimin kendisi).
  - Haber akışı ajans ekranı gibi (kullanıcının gösterdiği AFP Forum, bizim
    renklerle; `Gundem.tsx → AkisIkili`): başta haber sayısı ve sayfa (50'şer),
    solda saatli liste (seçili satır lacivert, ağır olay [`agirlik` ≥ 12]
    kırmızı), sağda seçili haberin okuyucusu (`OkumaIcerik bant`: lacivert
    başlık bandı, etiket satırı, "kaynak | tarih · saat | sözcük" künyesi,
    metin; araçlar üstte). Ok tuşları haberler arasında gezer. İki sütun
    1100 pikselden genişte; daha darda haber okuma penceresinde açılır.
    Sabah brifingi de aynı düzende (`Brifing`, ortak `AjansSatiri`,
    `useAjansSecimi`): solda A, B, C bölüm bantları ve konu grupları (ad,
    seviye, satırlar ya da "değişiklik yok", altında izlenecekler), sağda
    okuyucu; D (editoryal fırsatlar) haber değil öneri, altta kendi kartında.
  - Okuma penceresi (`Gundem.tsx → OkumaPenceresi`, içi `OkumaIcerik`, akışın okuyucusuyla aynı): haberin başlığı siteyi değil
    pencereyi açar (siteye gidip dönmek uzundu; site ↗'da). Tam metni kapı okur
    (`worker/src/makale.ts`, `POST /makale`, yalnız basınca, tek adres, 10 dakika
    önbellek): `<article>` önce, menü/yan sütun/betik atılır, paragraflar; Google
    Haberler yönlendirmesi sayfadaki asıl adresten (`yonlendirmeCoz`). Okunamayan
    sitede özet ve "tam metin yok" satırı; Telegram'da ve demoda kapıya gidilmez.
    Tam metin kayda girmez. Pencerede kaynaklar arasında geçilir, paragrafın "+"sı
    ya da seçili metin sepete gider; not ve "Öneriye çevir" de oradan. Haber
    satırında da "Öneriye çevir" (`OneriyeCevir` fırsat, satır, pencere ve sepette
    ortak). Planda benzeyen başlık varsa satırda ve pencerede "Next Day'de var"
    (`bizdeki`: açık Next Day başlığının adı ve gelişmeleriyle en az iki ortak
    anlamlı sözcük; yalnız bildirir).
  - Sepet (`Durum.gundemSepetleri`, kişiye bağlı harita, kayıtta: telefonda toplanan
    bilgisayarda da; `eylemler.ts → gundemSepeteEkle`, `gundemSepettenCikar`; aynı
    parça çoğalmaz). Sayfanın altında yapışık "Sepet · n"; pencerede üç hedef: yeni
    öneri (gelişme parçaların kendisi), var olan öneriye gelişme satırı
    (`oneriyeSatirlarEkle`, satır sonunda kaynak adı), tek not. Boşaltınca temizlenir.
  - Öneriye gelişme satırını muhabir kendi takibine, Planlama (öneriyi
    düzenleyebilen) ve tam yönetici her güncel öneriye ekler (`yetki.ts →
    oneriSatiriEkleyebilir`; reddedilen, geri çekilen ve teklif hariç); ayrıntıdaki
    satır formu da bu kuralla.
  - Akışı kapı okur (`worker/src/rss.ts`, `POST /rss`, tam yönetici ve paylaştıkları,
    yalnız https, 10 dakika Cloudflare önbelleği, Cache API; KV değil:
    ücretsiz planda KV'ye günde 1000 yazma, her tarama 60'ı aşkın akış
    yazıyordu; önbelleğe yazılamasa da haber döner): tarayıcı haber
    sitelerini doğrudan okuyamıyor. Demoda kapıya gidilmez, kurgusal örnek akış
    (`demoHaberleri`).
  - Kaynaklar kayıtta (`Durum.gundemKaynaklari`, boşsa
    `VARSAYILAN_KAYNAKLAR`: canlı denenip seçilmiş siteler ve konu başına
    Arapça/İngilizce Google Haberler araması, `aramaAdresi`, "when:1d";
    Reuters, AP ve bot korumalı siteler yok (akışsız ya da bot korumalı
    site, kullanıcının eklettikleri gibi, Google Haberler'in o siteye özel
    aramasıyla: `siteAramasi`, 3 günlük pencere, İbranice dahil; koruma
    aşılmaya çalışılmaz); Telegram'ın açık haber
    kanalları, `t.me/s/<kanal>` web görünümü, kapıda `telegramCoz`: ilk
    cümle başlık, "عاجل", işaret, bağlantı ve imza atılır; kapalı grup ve
    özel kanal okunamaz), ⚙ penceresinde eklenir (`@kanal` ya da
    `t.me/kanal`, `telegramAdresi`),
    kapatılır, okunamayan hatasıyla; kullanıcı kendi aramasını ekler,
    kayıtlı listede olmayan kurulu kaynaklar "eksik"ten eklenir
    (`eksikVarsayilanlar`). Toplayıcıda haberin kaynağı asıl yayıncı (kapı
    `<source>`'u okuyor, başlıktaki " - Yayıncı" atılıyor): ağırlık farklı
    kaynak sayısından. Tarama 30'luk paketler (Cloudflare ücretsizde istek
    başına 50 dış çağrı). Tarihsiz, bir haftadan eski ve ileri tarihli haber
    alınmaz; bu yıldan değilse tarih yılıyla yazılır. Okunan haberler ve günlük skor
    geçmişi tarayıcıda (`trt-planlama-gundem`, `-skor`; bir hafta), kayıtta değil.
  - Konular `KONULAR` (Arapça ve İngilizce anahtar sözcük; Arapça
    normalleştirilmiş, Latin sözcük başında): Orta Doğu ve çatışma coğrafyası
    ana bölge; Etiyopya dosyası alt başlıklarıyla (Tigray, Amhara/Fano,
    Oromia/OLA, Afar, federal, Eritre, Somali, Sudan sınırı, GERD, Mısır,
    Kızıldeniz/Assab); Türkiye ve ABD'de `sart` (dış politika, bölge) iç
    gündemi dışarıda tutar. Bölgeler arası bağlar `BAGLAR`: olay ikisine
    düşerse iki klasörde de aynı kayıt, "Bölgeler arası"nda da.
  - Sınıflandırma başlığa dayanır (`siniflandir(baslik, ozet)`,
    `haberSiniflandir`): konu başlıkta geçer ya da özette o konunun en az iki
    ayrı sözcüğü geçer; özetten başlık tekrarı ve yayıncı adı atılır
    (`temizOzet`). Özetteki tek sözcük ve yayıncı adı (ör. "…السودانية")
    Fransa haberini Sudan'a düşürüyordu. Kişi adları konudan dışlanır
    (`haric`: Irak başbakanı "شياع السوداني" Sudan değil).
  - Aynı olayı veren haberler başlık sözcükleri örtüşünce (36 saat) tek olay
    (`olaylariKur`); başlık konuları ortaksız iki haber birleşmez. Konu klasörleri kalktı (kullanıcı: klasöre bölünme iyi
    işlemiyor): "Haber akışı" tek liste, en yenisi üstte, her haber
    etiketleriyle (`olayEtiketleri`: konu, alt başlık `konu:alt`, bağ
    `bag:…`; ad `etiketAdi`). Çubuktan ya da haberin etiketinden süzülür,
    birden çok etiket birine uyanı gösterir (`akisOlaylari`); alt başlık
    yalnız kendisini. Yıldızla takip edilen etiketler tarayıcıda
    (`trt-planlama-gundem-etiket`, `takipEtiketleri`), "Takip ettiğim
    etiketler" açıkken bütün akış onlarla süzülür. Çubukta yalnız son 24
    saatte geçen, takip edilen ya da seçili etiketler, sayılarıyla. Öncelik
    (brifing ve fırsatlarda) haber sayısından değil: olayın ağırlığı farklı
    kaynak sayısı, ağır sözcükler (`AGIR`), ana bölge ve bağ; konunun skoru
    son 24 saatin en ağır üç olayı (`konuSkoru`, `seviye`).
  - Sekmeler: sabah brifingi, haber akışı, yaklaşan etkinlikler, editoryal
    fırsatlar, araştırma arşivi (`GUNDEM_BOLUMLERI`). Sabah brifingi
    A–D: her konu için son 24 saat ve önümüzdeki 24–72 saat (ileriye bakan
    olaylar `ILERI`, takvimin önümüzdeki 3 günü); değişiklik yoksa açıkça
    yazar. Editoryal fırsatlar kurallardan (`firsatlar`: paket, saha
    muhabiri [o ülkedeki muhabir], röportaj, açıklayıcı, özel yayın);
    "Öneriye çevir" muhabir dışı kaynak (medya) önerisi açar (tam yönetici
    her birimde girebilir, `oneriGonder`). Haberi araştırma arşivine not
    düşerek ekler (`Durum.gundemArsivi`, `gundemNotuKaydet`; aynı haber
    çoğalmaz, kişinin kendi notları).
- Organizasyon (`ekranlar/organizasyon/Organizasyon.tsx`, `#/organizasyon/<sekme>`;
  menüde Kullanıcılar'ın yerinde, eski adres Kişiler'i açar): kurumun
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
    Script Editor, Media, Spor), Program, Grafik (grafik ekibi, yerleşik birim
    `grafik`, ünvanlar yönetici ve grafiker; kullanıcı: Input, Output gibi kendi
    müdürlüğü olan bölüm; onsuz yayınlanmış yapıda okurken eklenir, `yapi.ts →
    grafigiKur`; demoda kurgusal `gr1`), Yönetim ve Dış muhabirler › Muhabir.
    Script Editor dil denetmenlerinin birimi; dil durağının sorumlusu o.
    Sonradan yerleşik oldu: onsuz yayınlanmış yapıda okurken birim Output'un
    yanına, dil denetmeni ünvanı ve Output'a verilmiş dil durağı ona geçer
    (`yapi.ts → scriptEditoruKur`, `tamamla` içinde); Output'ta kalan dil
    denetmenlerini sistemin işi taşır (`eylemler.ts → dilDenetmenleriniTasi`,
    açılışta ve gerçek kipte tam yöneticinin tarayıcısında). Grup düğümünün
    ünvanı yalnız yöneticisininki (aşağıda). Birim penceresinde üst birim seçilir, oklar kardeşler arasında
    sıralar; her kartta "Alt birim ekle" (`data-alt-birim-ekle`; kullanıcı:
    alt birim eklemenin yolu bulunmuyordu, yalnız pencerenin seçimindeydi):
    pencere o birim üst seçili, çalışma biçimi üstünün (yerleşikse kendisi,
    değilse örneği) gibi açılır, ikisi de değişir. Test `testler/alt-birim.cjs`; altında birim olan silinmez (`orgAltBirimVar`). Yardımcılar
    `birimAgaci`, `ustBirimler`, `altindaMi`, `disMuhabirMi`. Eski yayın
    okunurken `tamamla` ağacı ve ekip görevlerini varsayılandan doldurur.
  - Yönetim kademesi (kullanıcı: kurumda Yönetim ayrı birim değil; en üstte
    kanalın müdürü koordinatör, altında Input, Output, Program, Creative ve
    müdürleri; "Yönetim" ayrı birim gibi görünüp karışıklık yapıyordu):
    müdür kendi grup düğümünde durur. Altında birim olan yerleşik olmayan
    düğüm kademe (`yapi.ts → kademeMi`); izinlerde "yonetim" sayılır
    (`izinBirimi`; izin listeleri, plan yetkileri, ana sayfa [yönetici
    paneli], menü bu adla kaldı, `yetki.ts → yonetimdeMi`). Düğümün kendi
    ünvanı müdürünki: Haber merkezi koordinatör, Input Input müdürü, Program
    Program müdürü, Grafik Grafik müdürü (`KADEME_UNVANLARI`); kademeye eklenen ünvan yönetici
    ünvanı, Output ve Creative'in müdür ünvanını kurum ekler. Ünvanı olan
    düğüm `grupMu` değil, kişi formlarında seçilir (yalnız kendi ünvanıyla).
    Sorumluluk ağaçtan (`yetki.ts → kademeKapsami`): altındaki bütün birimler,
    kolları `BIRIM_KOLLARI`'ndan; Planlama'yı kapsayan muhabirleri de; kökteki
    (koordinatör) her şey; müdür kolundaki ve altındaki masada duran paketten
    sorumlu (`paketKapsamda`). Ekonomi Output'a taşınınca Output müdürü
    kendiliğinden görür. Yönetim birimi gizli; önceden yayınlanmış yapıda
    okurken Yönetim'in ünvanları gruplara iner, Yönetim gizlenir
    (`yonetimiKademeyeKur`, `tamamla` içinde); kişileri sistemin açılış işi
    taşır (`eylemler.ts → yonetimiAgacaTasi`, `kademeHedefi`; gerçek kipte
    tam yöneticinin tarayıcısında da). Yöneticinin taslağı da okurken
    tamamlanır (`eylemler.ts → yapiTaslagi`, yayında `tamamla(taslak)`;
    `tamamla` sürüm 0'ı ayrıca geçmez): değişiklikten önce kaydedilmiş taslak
    Organizasyon ekranında eski hali gösteriyordu, kullanıcı "bende hiçbir şey
    değişmedi" dedi. Test `testler/yonetim-kademe.cjs`.
  - Birim kartındaki "Düzenle" birimin kendisini açar; alt birim eklemenin
    işareti ayrı (`{ altBirimUst }`): birim kaydının da `ust` alanı olduğu için
    alt birimin (Muhasebe, Planlama…) "Düzenle"si "Alt birim ekle" açıyordu.
  - Değişikliğin Plan ekibine etkisi (kullanıcı: burada yapılan değişiklik
    plan ekibi gibi başka yerleri de etkileyebilir, sonra sorup teyit al;
    kurallar `yapiEtkisi.ts`, pencere `Organizasyon.tsx →
    EkipEtkisiPenceresi`, `useTaslak(ben, true)`: birim kartı, birim ve ünvan
    penceresi): değişiklikten sonra her ekip görevinin kapsadığı kişiler
    önceki ve sonraki taslakla karşılaştırılır ("n kişi göreve girecek /
    çıkacak", adlarıyla); birime yeni giren ünvan, o birimin ünvanlarını
    tek tek seçmiş göreve eklensin mi diye işaretlenir. "Böyle kalsın" /
    "Seçilenleri ekle" ya da "Değişikliği geri al" (önceki taslağa döner).
    Etkisiz değişiklikte sorulmaz; Plan ekibi sekmesindeki düzenleme sormaz.
    Test `testler/org-etki.cjs`.
  - Plan ekibi (`organizasyon/EkipSekmesi.tsx`, `Yapi.ekipGorevleri`): Next
    Day ekibindeki görevler (منتج تنفيذي…) ve kuralları. Görev adı Arapça
    zorunlu; kural birim + ünvan seçimi (boşsa hepsi; birim seçimi altını da
    kapsar), pencerede kurala uyan kişi sayısı. Ekibe ekleme formu ve belge
    penceresi adayı `ekipAdayi(kisi, gorev)` ile süzer; sıra ve ad
    `ekipGorevListesi`/`ekipGorevAdi`. Belgede ekip üyesinin penceresinde
    kişi de değişir (`eylemler.ts → ekipKisiDegistir`; seçenekler görevin
    kuralına uyan, ekipte olmayanlar; görev ve vardiya kalır). Geçmiş plan yüklemesinde açılan kişi
    görevin kuralındaki ilk birim/ünvanla (`eylemler.ts → ekipKisisi`).
  - İç muhabir: haber merkezindeki birimde "muhabir ünvanı" işaretli ünvan
    (`UnvanTanimi.muhabir`, `icMuhabirMi`). Plan ve paket muhabir seçicisinde
    (`MuhabirSecici`) dış muhabirlerden ayrı grupta; öneri, e-posta çağrısı
    ve yazışma seçicilerinde yok (`ic={false}`).
  - Kişi formları (davet, hesapsız, düzenle/tayin, kayıt bağlantısı) birim ve
    görevi `bilesenler/BirimSecimi.tsx`'ten alır: birim ağaç sırasıyla, ünvansız
    grup seçilemez (`grupMu`, `kisiBirimSecenekleri`; müdür ünvanlı kademe
    seçilir); görev yalnız birimin
    ünvanları, birim değişince birimin ilk ünvanına geçer (`birimeUygunUnvan`).
    Rol seçilmez, ünvandan gelir (`UnvanTanimi.yonetici`, "yönetici ünvanı";
    yerleşikte yönetici ve müdürler): yönetici ünvanına gelen yönetici,
    ayrılan personel olur, öbür tayinde rol değişmez (`unvandanRol`).
  - Dış muhabirin ünvanı şehrinden, kendiliğinden: "<Şehir> muhabiri"
    (`muhabir-s-<şehir>`, `yapi.ts → sehirMuhabirUnvaniId`). Adı `gorevAdi`
    şehirden türetir, yapıda kaydı gerekmez; şehir sonradan eklense ya da adı
    değişse de doğru çıkar. Kişi düzenleme penceresinde dış muhabire görev
    sorulmaz, şehir seçilir (altında çıkacak ünvan yazılı); öbür personelde
    şehir sorulmaz. Şehir nerede değişirse (profil,
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
    alma, onay, onayı geri alma (`ndOnayGeri`: yanlış onaylanan plan toplantı
    aşamasına döner, onayla kabul edilen paketler kabullü kalır; varsayılan
    Planlama yöneticisi, tam yönetici kuraldan bağımsız her zaman; devredilmiş
    plan geri alınmaz, paketler üretimde); Weekly'yi toplantıya götürme/hazırlığa alma,
    toplantıda karar, kesinleştirme; Aylık'ın onayı ve hazırlığa alınması; özel yayının onayı.
    Plan devri kalktığı için "devralma" adımı listede yok (kullanıcı: sekme güncel mi;
    Newsdesk ana sayfasında eylemi reddeden ölü "Planı devral" düğmesi de kalktı; kayıttaki
    `ndDevral` kuralı eski yapıyla uyum için tipte). Test `testler/plan-yetkileri.cjs`. Kural yapıda (`Yapi.planYetkileri`,
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
  - Hesaplar Kişiler'de (kullanıcı: Hesaplar ve Kişiler aynı kişileri iki ayrı yerde
    gösteriyordu, fazlalıktı; aktivasyonu kişinin satırından yapmak istedi): Hesaplar
    sekmesi kalktı, `#/organizasyon/hesaplar` ve `#/kullanicilar` Kişiler'i açar
    (izni Organizasyon'unki). Hesap işleri `Kullanicilar.tsx → HesapIsleriSaglayici`
    bağlamında (davetleri bir kez dinler, pencereleri tutar): başlıkta "Kişi ekle"
    (davet, giriş kodu, hesapsız kişi aynı pencerede, `data-kisi-ekle-ac`) ve ⋯
    (Excel'den muhabir aktar, e-posta eşleştir, kayıt bağlantıları penceresi);
    kişinin satırında ⋯ (`KisiHesapMenusu`: hesaba bağla, bekleyen davetin kodu /
    yeni kodu / yeniden gönderimi / iptali, yeni kod, şifre yenileme bağlantısı, yetkiler,
    hesabı kapat/aç, sil; yalnız yetkili maddeler, gerçek kipte). Şifre yenileme
    (kullanıcı: kullanıcılara şifre yenileme bağlantısı gönderebileyim; `data-sifre-yenile`,
    `depo/firebase.ts → sifreYenilemeGonder`): açık, e-postalı hesapta (kod hesabının adresi
    posta almıyor, ona "Yeni kod"), onay sorularak Firebase'in şifre sıfırlama postası kişinin
    giriş adresine, davetinkiyle aynı şablon ve dönüş adresi; yetki adres değiştirmeninki
    (`epostaDegistirebilir` ve davet yetkisi; yöneticinin ve yetkilinin hesabına yalnız tam
    yönetici), kişi kendine de. Test `testler/sifre-yenile.mjs` (emülatör, `giris-kodu.mjs` gibi). Hesap durumu satırın tonunda
    (`hesapDurumu`): hesabı yok soluk (`.hesap-yok`), aktivasyon bekleyen sarımsı
    (`yeniEposta` ya da kişiye bağlı bekleyen davet), kapalı gri ve adı çizili;
    kod hesabında kullanıcı adı satırda. Kaydı henüz kurulmamış davet kendi biriminde
    ve ünvanında "aktivasyon bekleniyor" satırı (`DavetSatiri`, `data-davet`).
    Başlıkta süzgeç "Aktivasyon bekleyen · n" ve "Hesabı yok · n" (`data-org-hesap-suz`,
    `useAdimDurumu`; düz liste). Ayrı davetler tablosu kalktı. Test
    `testler/org-hesap.cjs`; gerçek kip emülatörle `testler/giris-kodu.mjs`.
  - Kişiler: birim ağacı → ünvan (sayılar alt birimleri de toplar), "Tayin et" (`kisiPozisyonu`; birim ya da ünvan
    değişince `kisiTayinEdildi` hareketi, kişiye bildirim).
  - Bulma ve güvenli tayin (kullanıcı: Organizasyon karmaşık, isim bulmak ve işlem
    yapmak zor; üç yönetici ajanıyla incelendi, `belgeler/organizasyon-brifing.md`,
    1. parti): Kişiler araması `arama.ts → kisiUyar` (ad üç dilde, e-postalar,
    birim, ünvan, şehir; hemze ve hareke fark etmez, Latin sözcük sonunda t/d aynı:
    Ahmet/Ahmed); arama varken ağaç yerine düz liste (`data-org-sonuclar`, satırda
    "Birim › Ünvan · Şehir", onay bekleyen rozetli). Birimler ve ünvanlar'da arama
    (birim ve ünvan adı üç dilde, `yapi.ts → birimAdiDilde`, `gorevAdiDilde`;
    yalnız uyan kartlar, uyan ünvan `.eslesti`). Kişi formlarında aynı adlı birim
    üstüyle ("Output › Output", `ayirtEdiciBirimAdi`). Birim değişince görev
    birimin yönetici olmayan ilk ünvanı (`birimeUygunUnvan`; ilk ünvan çoğu birimde
    "Birim yöneticisi", muhabir Spor'a tayinde sorulmadan yönetici oluyordu; davet,
    hesapsız kişi, kayıt bağlantısı ve postadan kişiler formları da birim seçilince
    ona geçtiği için kurumda gerçek kipte kişiler "rastgele" yönetici görünüyordu;
    geçmiş plan yüklemesinin açtığı ekip üyesi de, `eylemler.ts → ekipKisisi`);
    yöneticiye çıkış onay sorar, tayin hemen geçerli olduğu için bildirimde "Geri
    al" (önceki birim, ünvan ve rol, `kisiPozisyonu(…, { rol })`). Kökü, alt birimi
    ya da kişisi olan birimi gizlemek onaylı; taslağın ilk değişikliği "Taslağa
    eklendi, henüz yayınlanmadı" bildirir, taslak yokken sekmelerde "Yayında ·
    Sürüm n". Test `testler/org-bulma.cjs`.
  - Yöneticiler süzgeci (kullanıcı: kurumda yönetici yalnız koordinatör, müdürler ve
    tam yöneticinin yetki verdiği kişi; eski formlar birim seçilince "Birim yöneticisi"
    veriyordu): Kişiler'in başlığında "Yöneticiler · n" (`data-org-yoneticiler`,
    `useAdimDurumu`), yönetici rolü, yönetici ünvanı ya da tam yöneticiliği olanlar düz
    listede; kademe dışındakiler (`yapi.ts → kademeDisiYonetici`: kademede değil, eski
    Yönetim'de değil, tam yönetici değil) önde ve işaretli, "Personele çevir" onayla
    (`eylemler.ts → yoneticiligiKaldir`: rol personel, yönetici ünvanındaysa birimin
    yönetici olmayan ilk ünvanı; tek yazış `kisilerPozisyonu`), bildirimde "Geri al".
    Kendiliğinden çevrilmez. Test `testler/org-yoneticiler.cjs`.
  - Üretim balonu (kullanıcı: paketin onayından sonra üretimin her aşamasını
    hangi masanın yapacağı tiklerle seçilsin, tekrarlanan düzen bir kez şablon
    olsun; "İş akışları" havada kalıyordu, kullanıcının çizimi; kurallar
    `uretim.ts`, ekran `bilesenler/UretimBalonu.tsx`). Aşamalar: görevlendirme,
    editoryal kontrol (parçalar: metin hep, stand ve gfx "varsa"), dil
    denetimi, gfx hazırlama (gfx varsa; dil denetiminden sonra video
    kontrolüyle yan yana), video kontrolü, yükleme (grafik montajda; gfx'i
    bekler), yayın kararı. Masalar (`URETIM_MASALARI`): Planlama, Newsdesk,
    Program, Ekonomi, Spor, Script Editor, Grafik ya da "Atla". Balon
    (`Pencere`, aşama × masa tik tablosu `UretimTablosu`) paketin şablonuyla
    açılır (`paketSablonu`: stok paketi stok şablonu, öbürü kolunun şablonu);
    şablondan farklı satır sarı "istisna" (`istisnaAsamalari`); "Şablon olarak
    kaydet" (`uretimSablonuKaydet`; ilk kayıtta yerleşikler de kayda geçer).
    "Üretime başlat" (`eylemler.ts → uretimiBaslat`, yetki `yetki.ts →
    uretimYoluBelirleyebilir`: onaylı paket, Planlama [paket değerlendiren],
    tam yönetici ya da plansızı üretime alabilen masa; özel yayın ve masanın
    takibindeki paket değil) yolu pakete yazar (`Paket.uretim`: şablon, yol,
    parçalar, `gfxTamam`), ilk durağı açar. Muhabiri belli (TBC değil)
    paketin görevi kabulde verildi (künyede görevlendiren, muhabire bildirim):
    üretim görev durağını geçip metin durağıyla, sıra muhabirde başlar
    (`uretim.ts → gorevVerilmis`, `ilkDurak`; kullanıcı: kabul edilmiş paket
    üretime başlatınca görevlendirmede havada kalıyordu); muhabir TBC ya da
    boşsa görev durağında atanır. Görev durağında kalmış eskileri sistemin
    açılış işi geçirir (`eylemler.ts → gorevDuragindaKalanlariGecir`). Akış motoru yolu kolun akışı
    yerine okur (`akis.ts → paketAkisi` → `uretimAkisi`: görev, parçalı metin,
    video kontrolü, yükleme, "Yayın kararı" genel işi; atlanan durak yok).
    Editoryal kontrol ve dil denetimi parçalı metnin aşamaları: tetkikçi ve
    dilci yoldan (`parcaYapabilir`), atlanan aşamayı parça geçer
    (`parcaIlkAsama`, `parcaDilSonrasi`). Gfx yan iş: gfx parçası dil denetiminden
    geçince Grafik'e haber (`gfxSirada`, `gfxAcik`; öbür parçaları beklemez), paket sayfasının gfx kutusunda "Gfx
    hazır" (`gfxTamamla`, `gfxYapabilir`), "Sıradaki işlerim"de de; yükleme
    düğmesi o zamana dek pasif (`gfxBekliyor`, eylem de reddeder). Üretimdeki
    pakette "Yolu düzenle" (`uretimYoluDegistir`): geçmiş aşamalar kilitli
    (`gecenAsamalar`), bulunduğu durak yoldan çıkarsa sonrakine
    (`yeniDurak`), hareket `uretimYoluDegisti`. Yol bitmeden "Yapıldı olarak kapat" (kullanıcı: yol yanlışlıkla
    verilmiş, öbür birimler sistemde değil, paket metinde bekliyordu ama
    yayınlandı; metin durağı her yolda olduğu için "Yolu düzenle" kapatamıyor):
    şimdiki aşamanın kutusunda, işin altında (`PaketDetay.tsx → EylemKarti`,
    `UretimiKapatDugmesi`, `data-uretim-kapat`), onaylı; `eylemler.ts →
    uretimiKapat`, yetki `yetki.ts → uretimiKapatabilir` ("Yapıldı"nın onay
    yetkisi `paketOnayi`; masa takibi ve özel yayın değil). Paket tamamlanır,
    künyede onaylayan, masraf onaylanır, hareket `uretimKapatildi` (muhabire);
    kaldığı durak `UretimYolu.kapandi`'da, "Tamamlamayı geri al" paketi oraya
    döndürür. Test `testler/uretim-kapat.cjs`. Ayrı "Üretim yolu" kartı
    kalktı: aşama ve masa kutularda, şablon ve istisna Planlama kutusunda. Listelerdeki ve masa sayfasındaki "Üretime al" balonu açar
    (`UretimeAlDugmesi`). Paket sayfasının "Aşamalar"ı, durum rozeti ve
    listedeki çubuk (`AsamaCubugu`) paketin kendi yolu (`akis.ts → paketYolu`:
    Planlama, masa paketinde masanın üretime alması, durakların balondaki
    adları, Tamamlandı); eski beş sabit aşama (News Gathering, Newsdesk,
    Teknik), "Newsdesk devraldı" adları ve "akış kutusu" kalktı, sıradakinin
    birimi `durakSahibi`'nden. Demoda üretimdeki örnek paketler de balonla
    başlamış (`ornek.ts → balonlaKur`, `BALON_YERI`: eski durak balonun
    yerine, şablon `PaketTanimi.sablon`, parçalar ve hareketler ondan); kayıt
    anahtarı bunun için v25 oldu, eski demo kaydı yeni örnekle açılır.
    Parça formunda tür seçimi (aşağıda, sade paket sayfası). Balonsuz onaylı paket eskisi gibi muhabirin "Yapıldı"sıyla
    kapanır; üretimdeki eski paket kolun akışıyla biter.
  - Üretim şablonları (`organizasyon/UretimSablonlari.tsx`,
    `#/organizasyon/uretim`; eski "İş akışları" sekmesinin ve
    `#/organizasyon/akislar` adresinin yerinde, `Akislar.tsx` silindi):
    kayıtta (`Durum.uretimSablonlari`, koleksiyon `uretimSablonlari`; boşsa
    yerleşik altısı `VARSAYILAN_URETIM_SABLONLARI`: Günlük haber · Newsdesk,
    Günlük haber · Planlama, Stok · Planlama [tetkik Newsdesk, yükleme
    Planlama], Ekonomi, Program, Spor masası). Satırda aşamalar ve masaları;
    "Düzenle" adı, tikleri ve balonun hangi kol ya da stok pakette bu şablonla
    açılacağını değiştirir (`uretimSablonuGuncelle`), silinir (son şablon
    değil). Şablonu Planlama ve tam yönetici yönetir
    (`uretimSablonuDuzenler`); şablonla başlamış paketin yolu kendi kaydında.
    Test `testler/uretim-balonu.cjs`.
  - Varsayılan paket yolu (akış kimliği `yol`, `yapi.ts → VARSAYILAN_DURAKLAR`):
    Newsdesk görev verir → parçalı metin (muhabir) → video kontrolü (Newsdesk,
    revizyona iade: `geriHedefi` video durağına, yoksa metin durağına;
    gerekçe `Paket.videoIade`) → sisteme yükleme (Newsdesk; kod isteğe bağlı,
    `klipKodu`) → yayına hazır (`tamamlandi`). Output'un metin kontrolü,
    iletim, Media Manager ve News Gathering saha görevlendirmesi bu yolda yok.
    Eski yol `uretim` kimliğiyle kolsuz duruyor: damgasız üretimdeki ve eski
    damgalı paket onunla biter (`akis.ts → paketAkisi`); yeni yoldan önce
    yayınlanmış yapıya okurken yeni yol eklenir, kollar ona geçer
    (`yapi.ts → yeniYoluKur`, `tamamla` içinde).
  - Parçalı metin (`Durak.parcali`, `Paket.parcalar`, `MetinParcasi`): muhabir
    metni bölüm bölüm gönderir (ad şimdilik serbest; intro, text, PTC türleri
    sonra), PTC çekimden önce denetime girebilsin diye parçalar birbirini
    beklemez. Her parça muhabir → Newsdesk (düzeltip Script Editor'e geçirir
    ya da gerekçeyle iade eder) → Script Editor (yalnız düzeltip ilerletir) →
    hazır (`eylemler.ts → parcaGonder`, `parcaDuzelt`, `parcaIade`,
    `parcaSonHal`; yetki `yetki.ts → parcaYapabilir`, durağın yardımcısı
    yok). Video bağlantısı ancak bütün parçalar hazırken gönderilir
    (`akis.ts → parcalarHazir`, `adimIlerle`), metin parçalardan birleşir.
    Hazır: balonun beklediği parçalar gelmiş (`uretim.ts → eksikParcalar`:
    metin her zaman, intro, metin ya da röportaj türünden en az biri; balonda
    işaretliyse stand ve gfx) ve gönderilen her parça denetimden geçmiş
    (kullanıcı: muhabir intro'yu gönderip o onaylanınca metin bitmiş sayılıyor,
    video açılıyor, Grafik'e haber gidiyordu; balonun stand ve gfx işaretleri
    beklenmiyordu). Gelmeyen parça kartta "bekleniyor" satırı
    (`data-parca-bekleniyor`); balonsuz pakette beklenen yok. Test
    `testler/parca-beklenen.cjs`.
    Kart (`bilesenler/ParcaliMetin.tsx`) paket sayfasında herkese açık, düğme
    sırası gelende; dil denetmeninin sayfasında parça başına kart
    (`dilParcaSirasi`).
  - Aşama kutuları (kullanıcı: kutular yalnız aşamayı göstermesin, iş kutunun
    içinde olsun, ilerleyince iş hangi kutudaysa oraya gidilsin; on iki ajanla
    brifing `belgeler/asama-kutulari-brifing.md`, 1. parti; `bilesenler/
    AsamaKutulari.tsx`): paket sayfasının "Aşamalar"ı dikey liste
    (`asamaListesi`: balonlu, masa ve üretimdeki pakette `paketYolu`, balonsuz
    onaylıda sade akışın üç adımı; `GorunenAsama.id`, `masa`), tek kutu açık.
    Masaüstünde (961+) liste solda, içerik sağda; telefonda içerik açık kutunun
    içinde, açık kutuya basınca kapanır. Şimdiki kutuda kimde satırı, teslim ve
    sayfanın işlem kartı (`EylemKarti`, çerçevesiz); geçmiş kutuda adımı yapanlar
    (künye satırları adımın türünden, `TUR_ROLLERI`), yoksa "Yapıldı"; gelecekte
    "<birim> yapacak". Seçim geçmiş adımında (`paket:<id>:asama`); seçim yokken
    şimdiki kutu açık, iş ilerleyince yeni kutuya kayılır. Eski `AsamaBuyuk` ve
    "Şimdi kimde" bloğu kalktı. Test `testler/asama-kutu.cjs`.
    2. parti, içerikler: adımın bilgisi yalnız kendi kutusunda, Bilgiler
    kartında tekrar edilmez (`bilgi`): Planlama kutusunda öneri, plan ve
    başlık, karar notu ve ek talep, balonun şablonu ve istisnaları, "Yolu
    düzenle"; video kutusunda bağlantı (kontrolde katlı birleşik metin ve
    revizyonda dönülecek adım, `iadeDonecek`); yükleme kutusunda klip kodu ve
    "gfx bekleniyor"; son kutuda yayın ya da stok satırı, işlem (geri alma, masa
    kararı) ve bütün künye (yan sütundaki künye kartı ve ayrı "Üretim yolu"
    kartı kalktı). Gfx yan iş kutusu (`gfx`, kesik kenarlı, numarasız "+"):
    metin durağının arkasında, yolun şimdisini değiştirmez; içinde dil
    denetiminden geçmiş gfx parçası salt okunur ve kopyalanır, "Gfx hazır"
    (`gfxYapabilir`) ya da kimin bitirdiği; sırası grafikteyse varsayılan kutu
    o. Özel yayın paketi kendi beş aşamasıyla (`oz-*`, `ozelPaketAsamasi`).
    İptal pakette kutular sönük, açılmaz. Parçanın satırı (`ParcaliMetin.tsx →
    ParcaSatiri`) dil denetmeninin sayfasında da aynısı; editörün, dil
    denetmeninin ve muhabirin parça adımında onay sorulmaz (video gönderiminde
    sorulur).
    3. parti, iz ve bağlantı: aşamanın süresi ve iade sayısı pakette
    (`Paket.asamaIzi`, durak başına `giris`, `sure`, `iade`): adımı değiştiren
    eylemlere dokunulmadan `veri.ts → kaydet` yazıştan önce eski ve yeni paketi
    karşılaştırır (`asamaIzi.ts → asamaIziIsle`, saf): çıkışta süre eklenir,
    girişte an, yolda geriye gidişte ve parça iadesinde çıkılan aşamanın iadesi
    artar; kutu satırında süre ("25 dk", "3 sa", "2 gün") ve ↶ iade. Ekibe özel
    aşama notu ayrı kayıtta (`Durum.asamaNotlari`, `AsamaNotu`, koleksiyon
    `asamaNotlari`; kısıtlı kişi dinlemiyor, kural okutmuyor; `yetki.ts →
    asamaNotuGorur`, `eylemler.ts → asamaNotuEkle`, `asamaNotuSil`; anma
    çalışır, temizlikte paketle gider): her açık kutunun altında, muhabirde
    yok. Parçada muhabirin gönderdiği hal (`MetinParcasi.ilk`, `parcaGonder`)
    ve editörde/dilde "Değişiklikleri göster" (`metinFarki.ts → sozcukFarki`,
    sözcükler harekesiz karşılaştırılır: harekeleme fark sayılmaz). Bildirimden
    kutuya: `#/paketler/<id>/<kutu>` (`akis.ts → hareketKutusu`: gfx haberi gfx,
    parça haberi metin durağı; ekip notunun anması da). Kişi başka kutuya
    bakarken üstte "Şimdi: X ›" (`data-asama-simdi`); açık tuttuğu kutuyu
    başkası geçirince "az önce X tarafından geçildi", sayfa kaymaz. Parça
    metni taslak olarak tarayıcıda kalır (`bilesenler/metinTaslagi.ts`,
    `trt-planlama-taslak:<paket>:<parça>:<aşama>`; gönderilince silinir).
    Masaüstünde görünüm ayarları (⚙ `data-ak-gorunum`: yazı boyu, Arapça metin
    boyu, sıklık, adım sütunu, karşıtlık; tarayıcıda
    `trt-planlama-asama-gorunum`).
  - Biten paket şeridi (kullanıcı: aşama bittikten sonra kutular yerine ince,
    düzenli şerit; başlık, muhabir, tarih; basınca yapım aşamaları, birim ne
    kadar görmeliyse o kadar; `bilesenler/BitmisPaket.tsx`, kurallar
    `bitmisPaket.ts`): tamamlanan ya da "yapılmadı"yla kapanan paket
    (`bitmisMi`). Kapalı satırda sonucun noktası (yeşil yayın, gri stok, kırmızı
    yapılmadı), başlık, muhabir, tarih; açılınca aşama kutularının listesi
    (`listeKur`) zaman çizgisi olarak: yapan künyeden (`TUR_ROLLERI`), saat,
    süre ve ↶ iade (`asamaIzi`), son metin, video, klip kodu, ekip notları,
    "Sayfayı aç". Görünürlük `bitmisGorunum`: süre Planlama, kademe ve tam
    yöneticide hepsi, masada yalnız kendi aşaması; ekip notu `asamaNotuGorur`;
    muhabir süre ve not görmez; muhasebeci yalnız yapanlar. Paket sayfasında
    aşama kutularının yerinde aynı içerik ve tam künye; muhabirin
    Haberlerim'inde şerit listesi. Paketler sayfasının her sekmesi de şerit
    (kullanıcı: paketler dağınık durmasın, yalnız başlık, gün, muhabir;
    öneriden ayırt edilsin, muhabire ve güne göre sıralansın; `PaketSeridi`,
    `PaketListesi`): her paket ayrı kutu, kenarı ve paket simgesi durumunun
    renginde (`paketSeritTuru`: süren mavi, yayın yeşil, stok gri, yapılmadı
    ve iptal kırmızı), altında ince aşama çizgisi; gün `paketGunu` (biten
    pakette bittiği gün, sürende teslim günü, yoksa planın günü). Açılınca
    süren pakette şimdiki aşama ve kimde, sıradakiler sönük. "Sırala"
    (`data-paket-sira`, `useAdimDurumu`): güne (gruplu; her sekmede yeniden
    eskiye, aşağı doğru; kullanıcı, önce Aktif'te yakından uzağaydı), muhabire, aşamaya (gruplu),
    başlığa, son değişene. Tablo kalktı. Test `testler/bitmis-paket.cjs`.
  - Sade paket sayfası (kullanıcı: biten paketin sayfasında koordinasyon notları,
    muhabirin bilgileri, önerinin özeti, Strap kartı saçma; metnin kendisi sırasıyla,
    künye, video ve ek masraf yeter; `ekranlar/PaketDetay.tsx`): koordinasyon notları,
    "Bilgiler" kartı (şehir, yayın saati, saha, nitelik puanı, ücret, kısa açıklama),
    Strap düzenleme kartı ve "Başka muhabire ver" sayfadan kalktı (eylemleri yerinde);
    muhabir başlığın altında yalnız çip, özel yayın bağı başlıkta (`OzelBag`), hareket
    geçmişi katlı (`data-paket-gecmis`). "Paket metni" kartı (`bilesenler/PaketMetni.tsx
    → PaketMetniKarti`, kurallar `paketMetni.ts → paketSenaryosu`): Strap → intro →
    metin (röportajlar girildiği yerde, aslı sönük üstte) → stand; gfx grafiğin içeriği,
    kendi kutusunda. Parçanın türü `MetinParcasi.tur` (intro, metin, röportaj, stand,
    balonda gfx seçildiyse gfx; formda düğme, adı türden gelir, serbest), röportajda
    konuşmanın aslı `asil`; eski parçada addan tahmin (`parcaTuru`: INTRO, PTC, SOT,
    مقابلة…). Biten paketin şeridi sayfada metni tekrar etmez.
  - Ek masraflar (kullanıcı: muhabir girer, Planlama onaylar; "Yapıldı"nın onayı
    masrafı da onaylar, künyeyle Muhasebe'ye; `Paket.masraflar`, `Masraf`: çekim,
    ulaşım, konaklama, harcırah, diğer [açıklama zorunlu]; tutar, para birimi
    [Muhasebe'nin tanımları, muhabir okuyamadığı için yoksa USD/EUR/TRY,
    `paraBirimleri`], açıklama). Paket sayfasında `MasrafKarti`; girer/siler
    `yetki.ts → masrafGirebilir` (onaylı ya da üretimdeki paketin muhabiri, onun
    adına paket değerlendiren; onaydan sonra kimse). Onay `Paket.masrafOnayi`:
    `isaretUygula` "yapıldı"yı onaylarken yazar; üretimden (işaretsiz) biten pakette
    "Masrafları onayla" (`masrafOnaylayabilir`, hesap yetkisi `paketOnayi`). Onay
    kuyruğunda ve panonun onay satırında tutar görünür. Muhasebe: onaylı masraf işin
    satırında ve künyesinin altında (`MuhasebeIsi.masraflar`), ayın satırında para
    birimine göre toplam (`AylikDokum.masraf`, ödemeye katılmaz), CSV'de sütun. Kural:
    kısıtlı kişi `masrafOnayi`'ni yazamaz, onaylanmış masrafı değiştiremez
    (`firestore.rules → masrafAyni`, j'den desenle). Test `testler/paket-metni.cjs`.
  - Harekeler kırmızı (kullanıcı: dil denetimi harekeliyor; `bilesenler/
    Hareke.tsx`): harekeyi ayrı `<span>`'da boyamak Chrome'da çalışmıyor (harf
    ve hareke tek parça çiziliyor), bu yüzden iki katman üst üste: altta tam
    metin `--hareke` renginde, üstte harekesiz metin (`harekesiz`) yazı
    renginde; hareke eni sıfır, harfler çakışır, açıkta harekeler kalır.
    Okunur metin `HarekeliMetin` (parçanın okunur hali, paket metni; ekran
    okuyucu ve kopya alttaki tam metni alır), yazı alanı `HarekeliAlan`
    (parçalı metnin denetim alanı, dil denetmeni ekranı): alanın yazısı
    saydam, imleç görünür, arkadaki katmanlar alanın o anki ölçülerini kopyalar
    (yazı alanı stili sayfaya göre değişiyor), alan metinle uzar. Yalnız
    ekranda; kayıt, çıktı, Word ve posta düz metin. Test `testler/hareke.cjs`.
  - Davranış durağın kimliğinden değil türünden: ekran ve eylem `adimTuru(p)`
    sorar, `p.adim === "kontrol"` yazılmaz. Geri gönderilen iş geride kalan son
    metin durağına, yoksa bir öncekine döner (`geriHedefi`). Genel iş
    `adimIlerle` ile ilerler, notu pakete, `durakTamamlandi` hareketi.
  - Haber üretimi panosu (`#/uretim`, `Listeler.tsx → UretimPanosu`; kullanıcı:
    güncel sisteme göre, önce yapının eski akış durakları sütundu): sütunlar
    üretim balonunun aşamaları (`uretim.ts → PANO_SUTUNLARI`, `panoSutunu`):
    görevlendirme, muhabir, editoryal kontrol, dil, video, (gfx sırası varsa)
    grafik, yükleme, yayın kararı; metin durağındaki paket en geride kalan
    parçasının aşamasında, bütün parçalar hazırsa muhabirde (video). Kartta
    işin masası (`panoMasasi`) ve aşamada geçen süre (`asamaIzi`, 180 dakikayı
    aşan kırmızı); balonsuz eski üretim paketi "Eski akışla süren" sütununda.
    Metin kontrolü ve video panoları yapının durakları. Test
    `testler/uretim-panosu.cjs`. Sırası gelen işler her birimin
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
- Günün notu (kullanıcı: sitenin işleyişinden öğrenip öneri yapan asistan
  istedi; ilk adım yapay zekasız, ücretsiz katman): Planlama ana sayfasının
  alanı (`plGunNotu`, `Planlama.tsx → GununNotu`); varsayılan düzende ve yeni
  tasarımın kutularında yok (kullanıcı), isteyen "Sayfayı düzenle"den ekler. Kurallar `gununNotu.ts`, saklanmaz: günü bugün
  ya da yarın olup karar verilmemiş öneri; bir günden (`CEVAPSIZ_SAAT`) uzun
  yanıt bekleyen öneri (öncekinde sayılan tekrar edilmez); çalışılan planda
  (yarınınki, yoksa bugününki) en az `DURGUN_GUN` gündür aynı gelişmelerle
  duran başlık (`durganGun`: "devir" işareti "bugün de geçerli"yle kalktığı
  için gelişme metinleri karşılaştırılır); günü geçmiş, sonucu bildirilmemiş
  onaylı paket; geciken paket; bugün ve yarın plana aktarılmamış takvim
  faaliyeti; açık Next Day çağrısına yanıt vermemiş, son 30 günde önerilerinin
  en az yarısı plana girmiş (en az 3 öneri) muhabir. Her satır sayı, ilk üç
  örnek ve işin sayfasına bağlantı. Sayım başlangıcı (kullanıcı: sistem tam
  faal değilken bot yanlış şey öğrenir mi; Ayarlar › Günün notu, tam yönetici,
  `Durum.sayimBaslangici`, gerçek kipte genel ayar belgesinde, `eylemler.ts →
  sayimBaslangiciKaydet`): o günden önce girilen öneri, öncesindeki plan ve
  paket, kabul oranındaki öneriler sayılmaz; takvim ve gecikme bugüne baktığı
  için etkilenmez; boşsa hepsi sayılır. Sonraki adımda yapay zeka bu notu okuyup
  yorum yazacak; kurallar yine buradan. Test `testler/gunun-notu.cjs`.
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
  `.onceki` fonuyla ve başında mavi kenar şeridiyle (`--onceki-serit`)
  görünür (kullanıcı: hafif fon seçilmiyordu). Fon düzenleyince, "Bugün de geçerli"
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
- Next Day'in iki görünümü (deneme; `nextday/Plan.tsx → PlanEkrani`): plan
  başlığındaki "Klasik / Yeni" geçişi, seçim tarayıcıda (`trt-planlama-nd-gorunum`).
  Yeni görünüm (`YeniPlan`, `belgeler/kimlik.md`): tek yüzey, ortada planın
  belgesi düzenleme kipinde (`NextDayBelgesi`, satır yerinde yazılır), solda
  içindekiler (başlıklar, sayılarıyla, `data-nd-baslik`'a kayar), sağda sekmeli
  panel (gelen öneriler, takipler, takvim, plan durumu); ayrıntı penceresi
  ortada değil yandan açılan panel (`.yeni-plan dialog.pencere`). Klasiğin
  özellikleri eksilmesin diye içindekilerde her başlığın ⋯ düğmesi klasik
  başlık kartını (`BaslikKarti acik`: paket kararları, LIVE/TBC, muhabire not,
  başlık menüsü, 🔗, stok paket) yan panelde açar; başlıkta sorumlu, öneri
  çağrısı ve geçmiş plandan aktar da var. Belgede her başlığın altında hızlı
  ekleme satırı (`NdDuzen.hizli`, `NextDayBelge.tsx → HizliEkle`): yazıp Enter
  gelişme ("YER / metin" ise yer ayrılır, kaynak ajans), "/" menüsü gelişme,
  PKG, muhabir ve canlı pencerelerini açar. Sağ paneldeki öneri kartı
  sürüklenip belgedeki başlığa bırakılır (`OneriKarti.tsx → ONERI_TURU`):
  "Plana ekle" o başlık seçili açılır (`PlanaEkle baslikId`), PKG/canlı kararı
  ve onay formda kalır. Ekranda
  içerik Naskh, başlık Kufi; baskı ve Word klasik çıktıdan, Calibri'yle.
  Beğenilirse klasik görünüm (`KlasikPlan`) ve ayrı belge sayfası silinecek.
  Üçüncü deneme "Sütunlu" (kullanıcının çizimi; `YeniPlan sutunlu`): aynı
  sade belge iki sütunda (`NextDayBelgesi sutunlu`, `.cikti-sutunlu`):
  başlıklar ve beklenen paketler geniş alanda, her başlık ince çizgili
  kutuda; ekip, hareketler, canlı, hazır paketler ve متابعات sağda dar,
  yapışkan sütunda. İçindekiler yok; öneriler, takipler, takvim ve durum
  "Öneriler ve takvim" çekmecesinde (kipsiz, öneri belgeye sürüklenir).
  Çıktı, baskı ve Word tek sütunda kalır.
- Next Day plan ekranı (`nextday/Plan.tsx`) doğrudan doldurulan
  bölümlerle (1–6) başlar. Üst kısım klasik görünümde `PlanBasi` (kullanıcı:
  "üstte gereksiz kalabalık"; üç tasarım önerisinin birleşimi). Kalıp ortak:
  `bilesenler/PlanBasi.tsx → PlanBasiKalibi` (başlık, `uc`, `adimlar`
  [`adimlariKur`, `DurumAdimlari`], `metin`, `dugmeler`, `kunye`, `araclar`);
  Weekly, Aylık ve Özel yayın da onu kullanır (aşağıda):
  - Tek satır başlık (telefonda; masaüstünde sekmede), sağda ↶ ve ⋯.
  - Altında "Sıradaki" kartı (`SiradakiKarti`): kısa durum çizgisi
    (`DurumCizgisi kisa`; Newsdesk sistemde değilken "devraldı" adımı yok) ve
    planın o anki tek işi. Taslakta "Toplantıya götür"; toplantıda "Kararsız n PKG · m muhabire görev · Planı onayla"
    (+ Taslağa geri al); onaylıda "Kabul edilen n paket · PKG geri bildirimi"
    (+ devral). Rutin iş yumuşak düğme (`.dugme-yumusak`, mavinin açık tonu),
    dolu mavi yalnız onayda; akış düğmeleri önce sayfanın dibindeydi.
    "Hepsini bugüne al" kalktı (kullanıcı: dünden gelenler renkli duruyor,
    yeter); `.onceki` fonu düzenleyince, satırdaki "bugün de geçerli"yle ya da
    onayla kalkar.
  - Künye ve sayılı Öneri / Takip / Takvim düğmeleri (pencerede açılır):
    Öneri "bekleyen/toplam", kırmızı yalnız karar bekleyen varken.
  - ⋯ (`PlanMenusu`, `IslemMenusu katman`): çıktı önizleme
    (`data-arac="cikti"`), belgede düzenle, öneri çağrısı, geçmiş plandan
    aktar, onayı geri al (`data-onay-geri`), Klasik/Yeni/Sütunlu seçimi.
  - Akış adımları tek kancada (`usePlanAkisi`): kart ve yeni görünümün durum
    sekmesi (`PlanDurumKarti`) aynı eylemi aynı soruyla çağırır.
  - Toplantı görünümü (kullanıcı: Weekly için yapılanlar Next Day'de de;
    `nextday/Toplanti.tsx`, `#/nextday/:id/toplanti`): toplantıdaki planın
    "Sıradaki" kartında (`data-toplanti-ac`) ve ⋯'de (taslak dışında).
    Ortada planın tam belgesi (`NextDayBelgesi toplanti`): PKG satırı
    (`paketSatiri` → `ToplantiPaketi`, `data-toplanti-kalem`, `data-karar`
    bekliyor/kabul, `paketKarari`) tıklanınca seçilir, altında durum rozeti
    ve notları; yanda seçili paketin kartı (`PaketKarari`: Kabul et / Reddet
    onay sorularak, toplantıda ve `paketDegerlendir`; "Not / ek talep"
    `Paket.kararNotu`/`ekTalep`, `eylemler.ts → paketKararNotu`, onaydan
    sonra da) ve toplantı notları (`ToplantiNotlari planId`; `toplantiNotuEkle`
    Next Day planını da tanır, kayıt temizliğinde planla gider). Klavye ↑/↓
    (j/k), 1 kabul, 4 ret, N not; kararla sonraki pakete. Üstte ilerleme
    (belgede çizilen PKG'lerden), Hepsi / Karar bekleyen, "Planı onayla"
    (`usePlanAkisi`). Reddedilen paket iptal olduğu için belgeden çıkar.
    Onaydan sonra kabul edilen paketin solunda zarf (`haftalik/Takdir.tsx →
    ZarfDugmesi`, Weekly'yle ortak; `takdirPaketleri`, `takdirBildirildi`);
    ⋯'de "Kabul edilen paketler" planın bildirim sayfasını açar. Notlar
    çıktıya girmez. Şartlı kabul Next Day'de yok. Test `testler/nd-toplanti.cjs`.
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
    başlığın "+" menüsünde "Başka başlığa kat" (hedef pencereden); onay
    sorulur, ↶ geri alır. Başlığı sürükleyip bırakmak katmaz, sıralar:
    bırakıldığı başlığın yerine geçer (`eylemler.ts → planBaslikYerine`). Belgede de (Yeni,
    Sütunlu, belge sayfası; kullanıcı: başlıktan tutunca içeriğiyle bütün
    bölgesi taşınsın, belli olsun, başka başlığın içine girmesin): başlık
    satırında tutamak (`NextDayBelge.tsx → BaslikTutamagi`, satır `suruklenir
    ("baslik")`), sürüklenen görüntü ve işaret bölgenin kendisi
    (`.baslik-tasiniyor`), hedefte içi değil geçeceği kenar (`.sur-araya-ust`/
    `-alt`; `planSurukle.ts`). Alt satırlar (gelişme, muhabir, canlı, PKG)
    başka başlığın içine yine taşınır. Test `testler/belge-baslik-surukle.cjs`.
    Gelişmeler, PKG önerileri ve canlılar hedefin kendi kayıtlarının
    arkasına (kendi sıralarıyla), muhabirler yoksa saat ve yerleriyle;
    bu plandaki öneriler hedef başlığa bağlanır. Pencere kartın dışında
    çizilir (kapalı `<details>` içini göstermiyor).
  - Başlık kartının satırı ve açılınca içindeki kutular her arayüz dilinde
    sağdan sola (`.baslik-karti > summary`, `.baslik-govde { direction: rtl }`,
    kutunun içi arayüzün yönünde): numara başlığın sağında, Gelişmeler sağda.
    Telefonda sayaçlar başlığın altında, düğmeler kenarda 2×2. Düğmeleri 36
    piksele sabitleyen kural "+" menüsünün satırlarına uymaz (`:not(.acilir *)`;
    kullanıcı: menü dar şeride sıkışıp yazılar kesiliyordu; `testler/baslik-menusu.cjs`).
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
  - Başlıkta "LIVE" kutusu (`LiveKutusu`, muhabirlerin altında, muhabir olsa
    da; `PlanBasligi.live`, `eylemler.ts → planBaslikLive`): o haberden canlı
    yayın alınabilir. Belgede ve çıktıda muhabirlerin altında "LIVE" satırı.
    Saatli canlı yayın (`CanliYayin`, "مباشر" bölümü) ayrı; işaret ertesi güne
    taşınmaz.
  - Canlı yayın satırı ("مباشر" ve başlığın altındaki LIVE) "YER / etkinlik /
    saat" (kullanıcı; saat kalın, "16G" biçiminde `vardiyaYaz`, yoksa "TBC";
    önce "ŞEHİR / saat / konu / ayrıntı / muhabir"dı). Klasik plan ekranında da.
  - Başlığa bağlı canlı yayın (`CanliYayin.planBaslikId`) belgede ve çıktıda
    üstteki "مباشر" bölümünde ve başlığın altında "LIVE" alt başlığıyla, iki
    yerde de.
  - Gelişmeye özel muhabir (`Gelisme.muhabirler`, gelişme formunda "Bu gelişmeyi
    takip eden muhabirler", her muhabire o günkü yer): başlığın içindeki ayrı
    konuyu takip eden muhabir plan ekranında, belgede ve çıktıda o paragrafın
    hemen altında, kurumun biçimiyle: unvan satırı "المراسل" (kişide `kadin`
    işaretliyse "المراسلة", birden çoksa çoğul; `etiketler.ts →
    muhabirUnvani`), altında "YER / ad". `kadin` kişi Düzenle penceresinde
    (`kisiPozisyonu`); Excel'in cinsiyet sütunu yine okunmuyor. İlk sürümde
    kayıt düz kimlikti, okuma `veri.ts → gelismeMuhabirleri`'nden. Başlığın
    genel muhabirleri (`PlanBasligi.muhabirler`) ayrı kalır.
  - Gelişmeye isteğe bağlı "Teams" (`Gelisme.teams`, gelişme formunda):
    kayıtlı personelden seçilir (dış muhabir değil), kayıtta yoksa ad elle
    yazılır (`{ ad }`). Plan ekranında, belgede ve çıktıda muhabirlerin altında
    kalın "TEAMS", altında her ad bir satır (`Bolumler.tsx →
    gelismeTeamAdlari`, `GelismeTeamSatirlari`).
  - Başlığın altındaki paketler iki alt başlıkta (`etiketler.ts →
    pkgGruplari`; belge ve çıktı): kabul edilenler "PKG", karar bekleyenler
    (taslak, değerlendirmede) "PKG PROPOSAL"; boş grup yazılmaz. Beklenen
    paketler (التقارير المتوقعة) yalnız kabul edilenler (`pkgOnerisiMi` değil;
    kullanıcı): öneri yalnız başlığının ya da gelişmesinin altında.
    Beklenenlerin sırası aşağıdaki başlıklarınki (kullanıcı; `NextDayBelge.tsx →
    beklenenSirasi`): başlık sırası, başlığın içinde gelişme altındakiler
    gelişme sırasıyla, sonra başlığın PKG'leri; başlıksız sonda. Saklanmaz,
    başlık ya da PKG yer değiştirince kendiliğinden. Test `testler/beklenen-sira.cjs`.
    Planlamacı sırayı belgede elle değiştirir (kullanıcı: varsayılan başlık
    sırası kalsın ama sürükle-bırakla değişsin): satır `suruklenir("beklenen")`,
    oklar da; planın elle sırası `NextDayPlan.beklenenSira` (`eylemler.ts →
    beklenenSiraKaydet`, kural `beklenenSira.ts → beklenenDuzeni`: sonradan
    eklenen paket varsayılandaki yerine, kendinden önceki paketin arkasına;
    plandan çıkan düşer). Elle sıra varken bölüm başlığında "Başlık sırasına
    dön" (`data-beklenen-varsayilan`). Beklenendeki satır aşağıdaki PKG'yle
    aynı kayıt, belgede yerinde düzenlenir (taslakta `paketKaydet`, onaylıda
    `paketMetniDuzenle`; şeritte düzenle penceresi), aşağısı da düzelir. Test
    `testler/beklenen-elle.cjs`.
  - Gelişmeye bağlı PKG (kullanıcı: başlık bazen genel, altında daha özel
    konular var; PKG başlığın en altında değil o gelişmenin altında görünsün;
    `Paket.gelismeId`): gelişmenin satırında "Bu gelişmeye PKG ekle" (plan
    ekranı ve belgede şerit), paket formunda "Planda yeri" (başlığın PKG
    bölümü ya da başlığın gelişmelerinden biri, `data-paket-gelisme`). Plan
    ekranında gelişmenin hemen altında (`GelismeListesi gelismeAlti`,
    `BaslikKarti → paketSatiri`, `.gelisme-alti`), belgede ve çıktıda
    paragrafın (schedule, muhabir, teams) ardından "PKG"/"PKG PROPOSAL" alt
    başlığıyla (`NextDayBelge.tsx → gelismeSatiri`, ortak `paketSatiri`);
    başlığın PKG bölümünde yalnız öbürleri. Gelişme silinince paket başlığın
    PKG'sine iner (`gelismeSil`), başka başlığa taşınınca onunla gider
    (`gelismeBasligaTasi`); sıralama aynı yerdeki paketler arasında
    (`paketTasi`). Beklenen paketler (التقارير المتوقعة) listesinde kabul
    edilmiş her PKG yine var. Test `testler/gelisme-pkg.cjs`.
    Yeri sürükle-bırakla da değişir (kullanıcı: geri almak da kolay olsun;
    `nextday/paketSurukle.ts`, eylem `eylemler.ts → paketYerineTasi`, plan
    içeriğini düzenleyen): PKG satırı (`data-pkg-surukle`) gelişmenin üstüne
    bırakılınca onun altına, başlığın başka yerine (klasikte PKG bölümü
    `data-pkg-bolum`, belgede başlık satırı) bırakılınca başlığın PKG'sine;
    başka başlığa da (o başlığın PKG'si), başka PKG'nin üstüne bırakılınca onun
    yerine (sıralama); durum ve onay değişmez. Belgede gelişme ve altı
    `.pkg-hedef` (yalnız düzenlerken; çıktı ve Word'de sarmal yok), bırakılacak
    yer kesik çizgiyle (`.pkg-birakilir`). Telefonda sürükleme yok, formdaki
    "Planda yeri" kalır. Test `testler/pkg-surukle.cjs`.
    Planın öbür satırları da sürüklenir (kullanıcı: plan hazırlarken her işlem
    sürükle-bırakla; `nextday/planSurukle.ts`): gelişme başka gelişmenin yerine
    (sıralama), başka başlığa ya da متابعات'e (`eylemler.ts → gelismeSurukle`,
    taşımada "Başka başlığa taşı"nın kuralı, PKG'si de gider); başlığın muhabiri
    yeri ve notuyla başka başlığa ya da başka muhabirin yerine
    (`planMuhabirSurukle`, plan içeriğini düzenleyen); canlı yayın başlığa,
    başlıktan "مباشر"a (`canliBasligaBagla`). Satır yalnız işaret taşır
    (`suruklenir`: `data-sur`, `data-sur-id`, `data-sur-pb`), hedefi planın kabındaki
    tek dinleyici çözer (`planSurukleKabi`; klasikte `.plan-surukle`, belgede
    `<article>`): başlık `[data-plan-baslik]`/`[data-nd-baslik]`, متابعات
    `[data-sur-takip]`, مباشر `[data-sur-canli]`; hedef `.sur-hedef`. Yazı
    alanında başlayan sürükleme (muhabirin yeri, yerinde yazılan metin) metin
    seçimidir, satırı taşımaz. Taşınan kaydın "önceki gün" izi kalkar. Test
    `testler/plan-surukle.cjs`.
  - Gelişme ve PKG formunda gün varsayılan olarak planın günü (kullanıcı:
    Next Day ertesi günün planı, eklenen bugünün tarihini taşıyordu): gelişmede
    `TarihGirdisi` ve ayrı, isteğe bağlı saat (`Gelisme.saat`, "SS:DD"); boş
    tarihle kaydedilen (hızlı ekleme, "Son gelişmeler") planın gününü alır
    (`eylemler.ts → gelismeKaydet`). Saat girildiyse plan ekranında, belgede ve
    çıktıda metnin sonunda kalın "12G" (`vardiyaYaz`, `data-gelisme-saat-eki`),
    girilmediyse hiçbir şey; kayıt satırında yalnız gün. PKG'de teslim günü
    planın günüyle açılır, saati boş; saatsiz teslim yazılmaz. Test
    `testler/gelisme-saat.cjs`.
  - Gelişmeye isteğe bağlı "Schedule" (`Gelisme.program`, saat + olay
    satırları; gelişme formunda kutu işaretlenince açılır): ziyaret, zirve
    gibi olayın saat saat programı. Plan ekranında, belgede ve çıktıda
    paragrafın hemen altında kalın "SCHEDULE" satırı, sonra "SAAT / olay" (saat kalın), saat
    sırasıyla (`veri.ts → gelismeProgrami`, `Bolumler.tsx → GelismeProgrami`).
  - Haber türü PKG değilse Next Day'de haberin satırının sonunda kodu
    (`etiketler.ts → bicimEki`, `BICIM_KODU`: "… / ad VideoWall"): paket
    satırında paketin türü; paketsiz plana giren önerinin gelişmesinde
    önerinin türü (`gelismeBicimEki`; paketi varsa yalnız pakette). PKG
    yazılmaz, bölümün adı zaten o.
  - Masanın işi plan metninde etiketli (kullanıcı: plana eklenen öneri ekonomi için
    yapılıyorsa ekonomi etiketiyle plan metnine girsin, öbür birimler için de; sonra:
    paketin yer, başlık, muhabir satırı bittikten sonra tire ve kalın): PKG satırının
    ("YER / Strap / muhabir") arkasında " - " ve kalın birimin Arapça adı (الاقتصاد، البرامج، الرياضة; `masaEtiketi.ts`, `nextday/MasaEki.tsx`,
    `data-plan-masa`; klasik plan ekranı, belge, çıktı, beklenen paketler, متابعات, Word ve
    kopya). Kural tek (Weekly de onu kullanır, orada alt başlık): kolu masanınsa kolun
    sahibi, masanın önerisiyse (`Oneri.masa`) o masa, öneri bir masaya sorulup "Uygundur"
    dendiyse o masa. Aynı öneriden (ya da Weekly kaleminden) gelen PKG aynı başlıkta
    etiketi taşıyorsa gelişmede tekrar edilmez; paketsiz gelişmede metnin sonunda
    (`gelismeMasaEtiketi`). Saklanmaz. Test `testler/plan-masa-etiketi.cjs`.
  - Nafize (kullanıcı: "Nafize ekle" başlığın canlı yayın kutusunda, "Canlı yayın ekle"nin
    yanında; üstteki "مباشر" bölümünde değil, onunla ilgisi yok; belgede başlığın ekleme
    çubuğunda): `NextDayPlan.nafizeler` (`PlanNafize`: başlık, saat GMT "SS:DD", mekan,
    sunucu [kayıtlı kişi ya da elle ad], konuklar), planın kendi kaydında; ertesi güne
    taşınmaz. Sunucu seçiminde sunucular ve muhabirler (kullanıcı: sunucu yerinde muhabir de
    olur), adlar kayıttaki tam Arapça yazımla, ekip satırının kısa adıyla değil. Başlıktan
    açılınca başlık sorulmaz; birkaç saat satır satır girilir (yeni satır
    öncekinin sunucusu ve mekanıyla; her satır ayrı nafize; `eylemler.ts →
    planNafizeleriEkle`, `planNafizeKaydet`, `planNafizeSil`, plan içeriğini düzenleyen).
    Plan ekranında, belgede ve çıktıda başlığın gelişmelerinin altında "نافذة" (birden çoksa
    "نوافذ") alt başlığı, saat sırasıyla her biri iki satır: "**08:00G** - mekan", altında
    "**المذيع:** ad / **الضيف:** ad" (birden çok konukta الضيوف). Başlık çıkınca nafizesi
    gider, başka başlığa katılınca onunla. `nextday/Nafize.tsx`; test `testler/nafize.cjs`.
  - Pakete eklenen notlar (`Paket.notlar`: paket formundaki "Not" alanı,
    kimliği `eylemler.ts → formNotuKimligi`, düzenlemede o not değişir;
    not, yönetici notu, durak notu)
    planda paket satırının sonunda parantez içinde (`etiketler.ts →
    paketNotEki`; PKG, başlıksız ve hazır paket; plan ekranı, belge, çıktı).
  - Önerinin فكرة المعالجة ve المعالجة البصرية metni (kullanıcı: plana yalnız
    gelişme giriyordu): "Plana ekle" formunda paket açılıyorsa iki işaretsiz
    kutu (`data-pe-isleme`, `data-pe-gorsel`), işaretlenen pakete kopyalanır
    (`Paket.planIsleme`, `planGorsel`; `oneriPlanaEkle(…, { isleme, gorsel })`).
    Plan ekranında, belgede ve çıktıda PKG satırının (ve kodunun) altında
    içeriden, italik, alt alta (`nextday/PaketPlanNotlari.tsx`, `.cikti-pkg-not`,
    Word ve e-posta kopyasında da); plan içeriğini düzenleyen satırın ×'iyle
    kaldırır (`eylemler.ts → paketPlanNotuSil`), öneri değişmez. Test
    `testler/pkg-isleme.cjs`.
  - Başlıktaki muhabire planlamacının notu (`PlanMuhabiri.not`; plan ekranında
    çipteki not simgesi, doluysa ipucunda notun kendisi; belgede muhabir
    penceresinde): neyi takip edeceği, işiyle ilgili. Çıktıya girmez. Plan
    onaylanınca başlıktaki ve başlığın gelişmelerindeki her muhabire
    `planaMuhabirEklendi` hareketi (`eylemler.ts → planMuhabirBildirimleri`;
    `veri.kime`, başlığın adı ve not içinde: kısıtlı muhabir planı okuyamıyor);
    zilde ve muhabirin Takiplerim'inde "Planda eklendiğin başlıklar"
    (`Takipler.tsx → PlandaEklendiklerim`; başlık başına son kayıt, en yenisi
    üstte, eklenişinden 7 gün sonra listeden düşer). Onay geri alınıp yeniden verilince aynı başlık aynı
    notla ikinci kez gitmez; not değiştiyse yenisi gider.
  - Muhabirin plandaki yeri her yerde değişir: başlık muhabirinin çipinde yazı
    alanı (plan ekranı, çıkınca kaydedilir; belgede muhabir penceresinde),
    gelişme muhabirinde formda; boşsa muhabirin şehri.
  - Ekip staffing postasından (kullanıcı: kurumun her gün gelen "TRT Arabi News
    Staffing <gün> <17th Nov 2026>" postası; `staffing.ts`, ekran
    `nextday/Staffing.tsx`): posta Posta'ya düşünce konudaki tarihin Next Day
    planında, ekibin üstünde "Staffing postası · n kişi" şeridi
    (`data-staffing-seridi`; plan içeriğini düzenleyen, klasik ve yeni
    görünüm). Gövde HTML tablosundan düz metne inmiş: PRESENTER (saat, ad;
    program satırı ve "SB" girmez), NEWSROOM (grup başlığı ardından tek "1",
    ünvan, saat, ad), NEWSGATHERING ve VISUAL TEAM (büyük harfli grup, ünvan,
    ad, durum "0900+", "OFF"…). Postada bütün personel yok; yalnız eşlemesi
    olan gruplar ekibe (`staffingGorevi`): PRESENTER → مذيعون, EP TEAM → منتج
    تنفيذي, PE … TEAM (siyasi programlar hariç) → منتج نشرات, Interpreter →
    مترجم, INTERVIEW TEAM → منتج مقابلات, SCRIPT EDITORS → محرر, NEWSDESK → قسم
    المراسلين (kullanıcı: önce PLANNING'den alınıyordu, yanlıştı); izinli/rapor/telafi ve saatsiz girmez. Saat İstanbul,
    vardiya GMT (−3). Ad Latin yazımla kayıttaki kişiye (`staffingKisisi`: en az
    iki parça, en iyisi tek; yoksa "Kayıtta yok", elle seçilir). Kişinin Latin
    adı, e-postalarının yerel kısmı ve Arapça adının ünsüz iskeleti (`iskelet`:
    ünlüler, و ve ي düşer, aynı sesin harfleri birleşir; "عبد الرحمن" bileşik
    okunuşlarıyla) karşılaştırılır (kullanıcı: plana ekli kişiler eşleşmiyordu,
    kayıtta çoğunun yalnız Arapça adı var); eşit adaylardan yalnız biri planın
    ekibindeyse o. Önizlemede elle seçilen ya da değiştirilen kişi öğrenilir
    (kullanıcı: bilinmeyeni bir kez seçeyim, sonra hep o gelsin; `Durum.
    staffingEslesmeleri`, anahtar `staffingAdAnahtari`, gerçek kipte genel ayar
    belgesinde, bütün planlamacılara ortak; `ekipPostadanYaz(…, ogren)`): o ad
    bir daha gelince tahmin yerine o kişi (`data-ogrenildi`); sistemin kendi
    bulduğu öğrenilmez. Satırın kişi seçiminde yalnız görevin Plan ekibi kuralına
    uyanlar (`ekipAdayi`; kullanıcı: sunucu satırında bütün personel değil
    sunucular), seçili olan uymasa da kalır; eşit adaylardan yalnız biri kurala
    uyuyorsa o. Kendiliğinden
    yazılmaz: önizlemede işaretlenenler "Ekibe yaz"la (`eylemler.ts →
    ekipPostadanYaz`): postadaki görevlerin ekibi postadakiyle değişir, öbür
    görevler kalır; "Yoksay" yalnız işaretler (`NextDayPlan.staffingPosta`,
    düzeltilmiş posta gelince şerit yeniden). Gerçek adlar depoya girmez;
    posta grup adresine değil kurumun dağıtım listesine gidiyor: kapı konusunda "News Staffing" geçen postayı grup süzgecinden geçirir (`worker/src/ews.ts → STAFFING_KONUSU`, `grubaUygun`). Kapı kutunun en yeni 25 postasını okuyor; staffing postası üstüne daha çok posta gelince okunmuyordu (kullanıcı: grup CC'de olsa da Posta'ya düşmedi): son 36 saatte gelen, konusunda "News Staffing" geçen postalar (en çok altı) ayrıca aranır (FindItem sıralamıyor; tarihsiz aramada kutuda biriken eski staffing postaları günün postasını örtüyordu) (`staffingAramaIstegi`, sunucu reddederse yok sayılır) ve her biri tek başına, önce okunur (gövdesi büyük tablo). Okunamayan GetItem grubu bırakılmaz: postalar tek tek denenir, sonraki gruplara geçilir; arka arkaya iki bağlantı kopmasında durur, alınanlar uyarıyla döner. GetItem'in posta başına hatası (`ResponseClass="Error"`, yanıt yine 200) da uyarıya yazılır (`getItemHatalari`; önce posta sessizce düşüyordu), staffing aramasının hatası da; metne çevrilemeyen staffing postası HTML olarak istenip kapıda satır satır metne çevrilir (`htmlMetin`). Arama yalnız gelen kutusunda, tek deneme: gereksiz (junk) klasörünü de kapsayan arama kurumun sunucusunda çekişi bütünüyle düşürdü (kullanıcı: posta çekilemiyor). Her "Postaları çek" bildiriminde tanı satırı (kullanıcı: düzeltmelere rağmen posta gelmiyordu, nedeni görünmüyordu; kapıda `StaffingDurumu`, istemcide `posta-kapi.ts → StaffingTanisi`, `dil.ts → bStaffingTani`): kutuda kaç staffing postası bulundu, kaçı okundu, kaçı kayda yeni girdi, arama hatası. Staffing postası herkese gittiği ve Message-ID'si bir kez işlendiği için önce çekenin grubuna yazılıyordu; Posta listesi, menü sayısı ve ana sayfa onu her grupta gösterir (`postaOkuma.ts → gorunenPostalar`). Postalar yalnız Posta'yı açan tarayıcıda yüklendiği için Next Day'i düzenleyen planı açınca postalar yüklenir, posta kimliği olan kişide kutu sessizce çekilir, tarayıcıda 15 dakikada bir (`Staffing.tsx → useStaffingPostasi`, `trt-planlama-nd-posta-cek`; kullanıcı: Posta'ya girmeyen planlamacı şeridi hiç görmüyordu); demoda kurgusal posta (`staffing.ts → staffingOrnegi`; yarının planına, önceden kurulmuş demo kaydına sistemin açılış işi ekler: `eylemler.ts → demoStaffingPostasi`, kullanıcı demoda şeridi göremedi). Gerçek kipte posta
    yalnız Posta'yı kullanan tarayıcıda yüklü. Rota tablosu (kullanıcı: staffing'i haber merkezinin Google tablosundan, "Newsroom Rota", günde bir okuyarak çeksin): tablo herkese açılmaz, Google Cloud'daki yalnız okuma yetkili hizmet hesabıyla "Görüntüleyici" olarak paylaşılır; tam yönetici Ayarlar › "Rota tablosu"nda (`ekranlar/RotaAyari.tsx`) tablonun adresini ve hesabın JSON anahtarını bir kez girer (kapının KV'sinde `rota-ayar`, özel anahtar `POSTA_ANAHTARI`yla şifreli, ekrana yalnız hesabın adresi; "Yarını dene"). Kapı (`worker/src/rota.ts`, `POST /rota`, kısıtlı kişi hariç) hizmet hesabının JWT'siyle (RS256, WebCrypto, kapsam yalnız okuma) erişim alır, sekmeyi adından seçer (`sekmeAraligi`: "2026: NOV16-DEC13", yıl dönen "2026: DEC14-2027:JAN10"), 1. satırdaki tarihle günün sütununu bulur, yalnız [ünvan, vardiya, o günün hücresi] satırlarını döndürür (tablonun gerisi tarayıcıya gitmez); sonuç kapıda 6 saat önbellekte (Google'a gün başına bir iki okuma, ücretsiz). Tarayıcı (`staffing.ts → rotaKayitlari`: grup başlığı A dolu B boş satır, "COMP/OFF" izinli; `kayitlardanOneriler` postayla ortak eşleme ve öğrenme) şeridi "Rota tablosu · n kişi" diye açar (`data-staffing-kaynak="rota"`), rota yoksa postaya döner; kimlik `rotaKimligi` (tablo değişince şerit yeniden). Sunucular ayrı tablodan (kullanıcı; aynı hizmet hesabıyla paylaşılır, Ayarlar'da ikinci adres "Sunucular tablosu", `RotaAyar.sunucuTabloId`, `POST /rota {tur: "sunucu"}`): tarih satırı ilk on satırda aranır ("16 November" yılsız, `gunSutunu`), altında A vardiya ("05.00-15.00"), hücrede günün sunucusu; yedek (SB) satırları tarihin üstünde, program satırları ("20.00-20.25 - …"), izin ve COMP vardiya biçiminde olmadığı için girmez (`staffing.ts → sunucuKayitlari`); ilk günün sütunu B olduğu için kapı B'yi boş döndürür. Asıl tabloyu paylaşamayan (yalnız görüntüleyici) kendi kopyasını verir: IMPORTRANGE'li "Bu dönem" / "Sonraki dönem" sekmeleri, sekme adı formülde tarihten (28 günlük dönem); adı tarih aralığı olmayan sekmelerde kapı günü tek tek arar (`rotaOku`, en çok dört sekme). Sunucular tablosu varsa مذيعون yalnız ondan, rota ya da postanın sunucu satırları düşer (`kayitlariBirlestir`). Kapı testi `worker/test/rota.test.ts`. Test `testler/staffing.cjs`. Rotadan çalışma programı (kullanıcı: kayıtlı haber merkezi personelinin hangi gün, hangi saatte çalıştığı rotadan çekilsin; rota ayda bir ya da iki haftada bir değişiyor, dönemin ilk günü sistemi ilk açanın tarayıcısı doldursun; `rotaProgrami.ts`, saf; `rotaAktar.ts`): `Durum.rotaProgramlari` (`RotaProgrami`, dönem başına bir kayıt, koleksiyon `rotaProgramlari`; kişi → gün → işe başlama saati İstanbul; o gün yoksa çalışmıyor; kayıtla eşleşmeyen adlar `eslesmeyen`). Açılışta (`App.tsx`, Planlama ya da tam yönetici, `rotaAktarabilir`) bugünü kapsayan dönem kayıtta yoksa bugünden başlayıp rotanın sekmesi değişene (en çok 35 gün, `EN_COK_GUN`) gün gün okunur (`rotaGunleriniOku`; sunucular tablosu ilk günün okumasıyla anlaşılır, rota ayarını yalnız tam yönetici okuyabiliyor), kişiler staffing şeridinin eşlemesi ve öğrenilmiş eşleşmelerle (`rotaDonemiKur`: yalnız kesin eşleşen yazılır; kişi aynı gün iki satırdaysa erken saat) kayda yazılır (`eylemler.ts → rotaProgramiKaydet`; son üç dönem kalır). Dönem içinde yeniden okunmaz; okunamayan gün o tarayıcıda o gün yeniden denenmez (`trt-planlama-rota-denendi`). Değer vardiyanın kendisi ("07:00-16:00", `StaffingKaydi.bitis`). Dönem kuralın sürümünü taşır (`RotaProgrami.surum`, `ROTA_SURUMU` 2); yalnız başlangıç saatli eski dönem `rotaGuncel` sayılmaz, bir kez yeniden aktarılır (kullanıcı: bitiş görünmüyordu); kart aynı günü kapsayan dönemlerden en son aktarılanı okur. Profilde personelin "Çalışma programı" kartı (`bilesenler/RotaProgrami.tsx`, `rotaProgrami.ts → calismaOzeti`; kullanıcı: izin günleri düzenli, gün gün cetvel gereksiz): bugünün dönemi, yoksa en yenisi; izin günleri (haftanın o gününün yarısından azında çalışıyorsa), en sık vardiya, ondan farklı saatler gün sayısıyla, altta rotanın dönemi. Ayarlar › Rota tablosu'nda son dönem, kişi sayısı, eşleşmeyen adlar ve "Programı şimdi aktar". Demoda kapı yok, test sahte okumayla (`window.__rotaGetir`): `testler/rota-programi.cjs`.
  - Ekip satırında ad uzamasın diye kurum kişinin adını ya da soyadını
    yazar: `Kisi.planAdi` ("ad" | "soyad", yoksa tam ad), `etiketler.ts →
    ekipAdi`; "عبد المنعم", "أبو جهاد" gibi bileşik ad tek parça. Bütün
    planlamacılar seçer (`kisiPlanAdi`, `planDuzenle`): ekip çipinde ve
    belgedeki ekip penceresinde, seçenekler adın kendisiyle.
  - Muhabir hareketi tek kayıt (`Durum.gorevlendirmeler`; kullanıcı: menüde
    ayrı başlık, Next Day ve Weekly aynı yeri açsın, hareket güncellenip
    silinsin): sayfa `#/hareketler` (`ekranlar/Hareketler.tsx`, menüde
    Görevlendirme grubunda ve Planlama menüsünün Ekip'inde; izin
    `SAYFA_IZNI.hareketler`: Planlama, News Gathering, Yönetim; News Gathering
    etkinleşince onun da işi), "Süren ve yaklaşan" / "Geçmiş" sekmeleri. Ekleme,
    düzeltme ve silme tek pencerede (`nextday/Formlar.tsx → HareketPenceresi`,
    `GorevlendirmeFormu`): sayfa, Next Day'in hareket bölümü (yeni ve satırdaki
    ✎) ve Weekly'nin bölümü (`haftalik/Plan.tsx → MuhabirHareketleri`, ✎ ve
    "Yeni hareket") aynısını açar; her iki bölümde "Bütün hareketler". Eylemler
    `eylemler.ts → hareketKaydet` (yeni/düzelt; yetki `yetki.ts →
    hareketDuzenleyebilir` ya da Next Day'den açılınca planı düzenleyen),
    `hareketSil` (kayıt ve bütün planlardaki bağı). Hareket gününe düşen açık
    Next Day planlarına (bugün ve sonrası, devredilmemiş) kendiliğinden girer,
    tarihi değişince düşmeyenden çıkar (`hareketPlanlariEsitle`; talep girmez);
    yarının planı önceki günden süreni taşır, o gün başlayanı da alır
    (`yarinPlaniniAc`). Weekly kayıttan okur. Test `testler/hareketler.cjs`.
  - Muhabir hareketleri (تحركات وإجازات المراسلين) belgede ve çıktıda
    "مكان / اسم / نوع / تاريخ" (Next Day ve Weekly; kullanıcı): tür Arapça
    adıyla (مهمة، إجازة، أخرى), süre tek günse o gün, değilse aralık
    (`dil.ts → sureYaz`); açıklama satıra yazılmaz, formda kalır. Türler
    görevlendirme, izin, diğer (`veri.ts → SECILEN_HAREKET_TURLERI`; seyahat
    kalktı, eski seyahat kaydı adıyla görünür). Test `testler/canli-satiri.cjs`.
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
  Muhabirin formu kurumun dört alanı (`OneriFormu.tsx → OneriMetinAlanlari`,
  sayaçlı alan `bilesenler/SayacliAlan.tsx`; başlıklar her arayüz dilinde
  Arapça, `dil.ts → of*`): عنوان التقرير المقترح (strap, 100), تفاصيل
  التطور (gelişme, 500), فكرة المعالجة (`Oneri.islemeFikri`, 700), المعالجة
  البصرية (`Oneri.gorselIsleme`, 500); sınırlar `veri.ts → ONERI_SINIRI`,
  karakter boşluklarla, altta "n/sınır" sayacı, `maxLength` aşmaz. Header
  sorulmuyor, 1. alandan (`oneriFormuGirdisi`). Strap ve gelişme zorunlu,
  3 ve 4 isteğe bağlı; takipte yalnız 1 ve 2 (1. alan takibin başlığı).
  Eylem de sorar (`oneriGonder`/`oneriYenidenGonder`: `oneriSinirIcinde`).
  "Düzelt ve yeniden gönder" aynı dört alan (`KisaOneriFormu strapGerekli`;
  eski öneride Header strap'ten ayrıysa korunur). Planlama'nın elle girdiği
  ve düzenlediği formda Header kalır, strap isteğe bağlı, dört alan aynı
  sayaçlı alanlar. E-postadan gelen öneri kesilmez (metin gelişmeye girer):
  sınırı aşan metinde sayaç kırmızı, alan yalnız kısalır (`maxLength` şimdiki
  uzunluk), Planlama kaydedebilir; sınır yalnız muhabirin kendi yazışında.
  İşleme fikri ve görsel işleme ayrıntıda ve pencerede
  (`OneriIslemeMetinleri`). Test `testler/oneri-formu.cjs`.

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
  öneri de öyle (`oneriBaglariniTazele`). Plana paketsiz girmiş öneriye
  sonradan PKG eklenir (öneri ayrıntısında ve penceresinde "Paket önerisi
  ekle", `eylemler.ts → oneriyePaketEkle`, `oneriyePaketEklenebilir`; Live
  değil, paketi yokken): strap sorulur, paket gelişmenin başlığına
  "değerlendiriliyor"da açılır, önerinin paketi olur, plandan çıkarınca o da
  gider. Etiketler kartta, listede, ayrıntıda ve formun altında önizleme
  olarak (`Tablolar.tsx → OneriPlanEtiketleri`, planın rengiyle); öneriler
  sayfasında süzgeç (Bütün planlar / Next Day / Weekly / Özel yayın /
  Plana düşmeyen). Next Day planının gelen önerileri yalnız o güne gönderilenler
  (`oneriBuGunun`: plana girdiyse planın günü, yoksa önerinin ilk günü;
  aralığa bakınca başka günlerin önerisi de çıkıyordu; Next Day etiketi ve
  "Önerilerden al"ın "bu gün" ayrımı da bu kuraldan),
  haftalık planınki haftasıyla kesişenler; gündeme eklerken gün aralığın
  haftadaki ilk günüyle gelir. Çağrı bağı: önce aralıktaki Next Day
  çağrısı, yoksa haftasının haftalık çağrısı. Eski haftalık öneri
  (`Oneri.hafta`, `haftaGunu`; e-posta yanıtından ve haftalık ekrandan
  girilen) olduğu gibi yalnız haftalık.

  Etiket ile planın listesi tek kuraldan (`oneriPlanlari.ts →
  oneriEtiketPlanlari`, haftalıkta `haftaninOnerisi`; "Bu haftaya gelen
  öneriler" de onu kullanır): "Weekly" diyen öneri o planın listesinde.
  Günü olan öneride hafta günden (`oneriHaftada`; `hafta` yalnız günü
  olmayan eski öneride), ekranda 15–16 Kasım yazan öneri başka haftanın
  `hafta`'sıyla listeye düşmüyordu. Etiketin ipucunda düştüğü plan, öneri
  ayrıntısında etikete basınca o plan açılır (`OneriPlanEtiketleri bagli`).
  Haftalık planın kimliği haftadan (`haftalikOlustur`, `hf-<Cumartesi>`):
  iki tarayıcı aynı haftayı açarsa aynı belge. Test `testler/haftalik-oneri.cjs`.

  Özel yayın etiketi yok: günü özel yayın gününe denk gelen öneri de
  etiketlenmiyordu, özel yayının önerileri yayının içinde
  (`ONERI_ETIKETLERI` yalnız Next Day ve Weekly).

  Arşiv tek kural (`oneriPlanlari.ts → oneriArsivde`, `oneriSonGunu`;
  saklanmaz, bütün sistemde aynı): günü geçen öneri ertesi gün güncel
  listelerden kalkar (`ARSIV_GUNU` 0; günü 21'se 22'sinde). Takip arşive
  düşmez: öneriye çevrilmeyen takip son gelişmesinden 2 gün sonra
  (`TAKIP_SILME_GUNU`) sistemin açılış işiyle izleriyle silinir
  (`eylemler.ts → eskiTakipleriSil`). Gün aralığın sonu, plana
  girdiyse planın günü, günü yoksa geldiği gün. Açık paket öneriyi tutmaz
  (kimsenin kapatmadığı eski onaylı paketler önerileri haftalarca güncelde
  bırakıyordu); paketin takibi Paketler sayfasında, onay kuyruğunda ve
  muhabirin "Senin sıran"ında. Reddedilen ve geri çekilen günü beklemez.
  Planlamacı elle arşive gönderir (`oneriArsiveGonder`, `Oneri.arsiv`);
  arşivden çıkarma (`oneriArsivdenCikar`, `arsivdenCikarabilir`: hesap
  yetkisi `arsivdenCikarma`) günü o andan saydırır
  (`arsivdenCikti`), reddedilen/geri çekileni değerlendirmeye açar.
  Düğmeler öneri ayrıntısında (`Oneriler.tsx → OneriKapiDugmeleri`), onay
  sorularak; ret, plana ve gündeme ekleme de onaylı. Planlama ana sayfası,
  menü ve yönetici paneli sayıları, "Önerilerden al" arşivi saymaz.

  Öneriler sayfası (kullanıcı: karışıktı, plana giren öneri günü geçene dek
  "güncel"de duruyordu, on durum çipi vardı; altı ajanla incelendi, birinci
  aşama; `Oneriler.tsx → OnerilerListe`, kurallar `oneriSekmeleri.ts`): dört
  sekme, varsayılan "Karar bekleyen" (yeni, değerlendiriliyor); "Sırası
  başkasında" (muhabire teklif, düzeltme, birimin görüşündeki: `acikSoru`);
  "Planda / gündemde" (`oneriYeri` ya da "plana eklendi": gündemdeki öneri
  durumda "değerlendiriliyor" olsa da karar listesinden hemen kalkar); "Arşiv"
  (`oneriArsivde`, kural aynı; `#/oneriler/arsiv` bu sekmeyle açılır; liste "Son 7
  gün" ve "Daha eski", ana sayfanın arşiv kutusu ilk grubu sayar). Başlıkta açık
  sekme ("Haber önerileri · Arşiv"; varsayılanda yalnız sayfanın adı). Takip
  öneri sayfasında yok, ⋯'de "Muhabir takipleri · n". Durum çipleri ve
  Güncel/Arşiv sekmeleri kalktı. Sayılar (sekme ve plan çipi) arama, masa ve
  ülke süzgeçlerinden geçmiş listeden; boş sekme ve plan çipi çizilmez (karar
  bekleyen ve seçili olan hep). Liste gün gruplarında (Bugün, başlamış çok
  günlü dahil; Yarın; İleri günler; Zamana bağlı değil; `oneriGunGrubu`),
  bekleyen talimat önde, sonra gün sırası; arşiv yalnız yenisi önce. Üstte tek
  birincil "Öneri gir"; Gelen yanıtlar, Öneri çağrısı, Muhabire haber öner ⋯
  menüsünde. Kol süzgecinin adı "Tüm masalar". Muhabir kendi ekranında
  (aşağıda; kılavuzda `kl4g`). Test `testler/oneri-sekmeleri.cjs`.

  Planlama öneriyi her aşamada düzeltir, plana eklendikten sonra da
  (`eylemler.ts → oneriDuzenle`, yetki `oneriDuzenleyebilir`; muhabire
  gönderilmiş teklif hariç): ayrıntıda ve plan ekranının öneri penceresinde
  "Düzenle". Gönderenin yazdığı ilk düzenlemede `Oneri.ilkHali`'nde kalır
  ("Gönderildiği hal"). Plana eklenmişse gelişme ve paket de güncellenir,
  ama yalnız plandaki metin hâlâ önerinin eski metniyse; havuzdaki başlığın
  adına dokunulmaz.

  Plana ve gündeme yalnız karar bekleyen öneri girer, eylem de sorar
  (`eylemler.ts → plandaKarara`: teklif, ret, geri çekilmiş, düzeltmede,
  arşivde değil). Açık haftanın gündemindeki öneri reddedilmez, düzeltmeye
  ve takibe gitmez (`oneriPlanlari.ts → acikGundemde`; önce "Gündemden
  çıkar"). `oneriDuzenle` devralınmış planın kaydına dokunmaz, paketi yalnız
  taslakta tam, onaylıda yalnız metniyle günceller. Öneriden gelen gelişme
  ya da canlıyı silmek karar yetkisi ister (`oneriBagiSilinir`; öneriyi
  değerlendirmeye döndürüyor). Gelişme başka başlığa ya da متابعات'e
  taşınınca PKG'si ve muhabiri de gider. "İzleriyle sil" ve temizlik
  boşalan başlığı, önerinin muhabirini ve anılma kayıtlarını da kaldırır.

  Eş öneri (`oneriPlanlari.ts → esOneriler`, `esBasliklar`): aynı muhabirin
  aynı haberi iki kayıtta. Planlamacı muhabirin gönderdiğini kullanmayıp onun
  adına elle yeniden girince doğuyordu: "plana eklendi" elle girilende,
  muhabirin kendi önerisi "değerlendiriliyor"da kalıyor, "Plana ekle"
  sürüyordu. Header Arapça normalleştirilip karşılaştırılır (aynısı ya da kısa
  olanın anlamlı sözcüklerinin üçte ikisi; günleri bir haftadan uzak değil;
  talimat, teklif, ret, geri çekilmiş ve "Başka plana da ekle" kopyası dışarıda).
  Kendiliğinden birleştirilmez. Muhabir adına giriş formunda durum satırı
  (`OneriFormu.tsx → EsUyarisi`); elle girilen eşi plana eklerken asıl öneri
  onay sorusunda (`PlanaEkle`). Ayrıntıda "Aynı haber olabilir" ve "Bu öneriye
  kat" (`Oneriler.tsx → EsOneriler`), öneriler sayfasında "N eş öneri" şeridi
  (`EsCiftleri`, `esCiftleri`); eylem `eylemler.ts → oneriBirlestir` (yetki
  `oneriBirlestirebilir`: ikisini de düzenleyen ya da tam yönetici): kopyanın
  gelişme, canlı, paket, haftalık kalem, yazışma, hareket ve takip satırları
  asıla (muhabirin gönderdiği, `esAsili`) geçer, asıl karar bekliyorsa kopyanın
  kararı da; durum kayda göre (`oneriPlanaGore`), kopya silinir, hareket
  `onerilerBirlestirildi`.

  Plandakine bağlama (`oneriPlanlari.ts → baglanabilirKayitlar`,
  `paketinOneriAdaylari`; eylem `eylemler.ts → oneriPlandakineBagla`): planlamacı
  önerinin yerine planda doğrudan muhabir adına PKG ya da gelişme açınca öneri
  "değerlendiriliyor"da kalıyor, muhabir aynı işi hem öneri hem görev olarak
  görüyordu. Adaylar son 7 günün (`BAGLAMA_GUNU`) bütün Next Day planlarında,
  onaylı ve devredilmiş de: öneriye bağlı olmayan, aynı muhabirin paketi ve
  gelişmesi (başlığın muhabiri de), benzer başlıklı önce. Bağlamak kayda yalnız
  `oneriId` yazar; plan, paketin durumu ve onayı değişmez, muhabire bildirim
  gitmez; öneri kayda göre "plana eklendi" (`oneriPlanaGore`), hareket
  `oneriPlandakineBaglandi`. Adaylar yalnız bugünün ve sonraki günlerin
  planlarında (`BAGLAMA_GUNU` 0; kullanıcı: geçmiş planlara dokunulmuyor,
  önce son 7 gündü). Önerinin ayrıntısında "Planda bu muhabirin
  kayıtları" (`Oneriler.tsx → PlandakineBagla`), plandaki bağsız PKG satırında
  benzer başlıklı bekleyen öneri varsa 🔗 (`BaslikKarti.tsx → PaketOneriBagi`);
  Planlama (öneri değerlendiren) ve tam yönetici. PKG için plandaki öneri de
  aday, iptal edilmemiş paketi yoksa (`paketBaglanabilirOneri`): öneri plana
  gelişmeyle girip PKG'si muhabir adına ayrıca açılınca (eş öneri
  birleştirmesinden sonra da) muhabir paketi öneriden ayrı satırda görüyordu;
  gelişme bağlama yalnız plana girmemiş öneride.

  Elle girilen öneride `giren` dolu. Plan ekranlarındaki "Öneri ekle" ile
  öneri sayfası aynı formu kullanır (`oneri/OneriFormu.tsx`). Ekranda
  kaynak her yerde `OneriKaynagi` / `OneriAvatari` ile gösterilir
  (`bilesenler/Tablolar.tsx`); muhabir/talimat ayrımı elle yazılmaz.
  Muhabir dışı kaynağın öneri çağrısıyla bağı ve geri dönüşü yoktur;
  plana eklenince gelişmenin kaynağı önerinin kaynağı olur.
- Gelen posta sohbeti (`ekranlar/posta/Posta.tsx`, `#/posta`; dış muhabir ve
  onay bekleyen dışında haber merkezinin herkesi, `yetki.ts → postaGorebilir`,
  `SAYFA_IZNI.posta` `MASA`): kişinin grup kutusuna düşen postalar, eklerinden arındırılmış (yalnız ad) ve alıntı/imza
  ayıklanmış (`eposta.ts → yeniMetin`; kapıda `ews.ts → yeniMetin` aynı kurallar,
  iletilen posta ayracı "Forwarded Message" ve Yahoo imzası da; ekran eski kayda
  da yeniden uygular) biçimde, konuya göre sohbet
  iplikçiklerinde. Öneri-yanıt akışından ayrı (`Durum.postaMesajlari`,
  `PostaMesaji`, `eylemler.ts → postaIsle`, `postaSil`); çağrıya bağlı değil,
  öneri doğurmuyor. İplik `konuKimligi`: sunucuda Graph'ın conversationId'si,
  içe aktarmada konu çekirdeğinden. Yahoo'dan ya da Rusça Outlook'tan gelen
  yanıt yeni yazışma kimliğiyle geliyor, ayrı sohbet açıyordu: kimliği yeni
  olan posta aynı konu çekirdeğiyle (12+ harf) var olan sohbete katılır
  (`postaIsle → ayniKonu`), ekranda da aynı çekirdekli iplikler tek sohbet
  (`Posta.tsx → sohbetleriKur`, `kimlikler`; silme hepsini). Konu öneki
  Rusça "Отв.:", Almanca "AW:", Türkçe "YNT:" de (`KONU_ON_EK`). İmza
  kuyruğunda Rusça "Отправлено из Yahoo Почты" (`IMZA`, kapıda da) ve dört
  sözcüklü Latin ad (`adGibiSatir`; balona adın Latin yazımı da gider). Aynı Message-ID iki kez işlenmiyor.
  Görünüm (kullanıcının gösterdiği örnekten; `.posta-govde`/`.posta-balon`/`.posta-yaz`):
  gelen balon başta, giden sonda, aralarında girinti; her gönderenin hafif tonu
  (`Posta.tsx → gonderenTonu`, `--ton`; giden kırmızımsı, gelen o tona düşmez),
  az yuvarlak köşe; gönderenin adı grup başına bir kez (adres görünmez: kayıtlı
  kişiyse adı, yoksa `kimdenAd`/adresin yerel kısmı; `gonderenAdi`), altta gün
  ve saat (gün ayracı yok). Ek balonda türünün renkli ikonuyla (`DosyaIkonu`:
  PDF kırmızı, XLS yeşil, DOC mavi; .xlsx da "XLS"). Sohbetin dosyaları yanda
  dikey sütunda (`SohbetDosyalari`, `.posta-dosyalar`; kullanıcı: üstte yatay
  şerit değil), en yenisi üstte, basınca mesajına kayar; telefonda dar sütun. Balonda gövde ekranda
  `eposta.ts → postaMetniSadelestir` ile daha da sadeleşiyor: gömülü görsel
  izleri ([cid:…], <logo.png>), yasal uyarı/tarama footer'ı ve sondaki imza
  bloğu atılıyor; tam metin `tamMetin`'de duruyor. İmza bloğu "bölge" olarak
  kesiliyor: en alttaki kesintisiz blok (boş / güçlü çıpa / gönderen adı / kısa
  ad-gibi / yalnız-bağlantı satırları) toplanır, blokta gerçek bir çıpa varsa
  atılır; yoksa hiçbir şey kesilmez (içerik korunur). Çıpa: e-posta, telefon,
  sosyal, kurum [TRT/قناة], ünvan/iletişim sözcüğü, kapanış selamı [مع التحية/
  Saygılarımla] ya da gönderen adı (adın sözcükleriyle bulanık eşleşme, altında
  ünvan/telefon olmasa da en sondaki ismi yakalar). JS `\b` yalnız ASCII sınırı
  olduğu için sözcük sınırı Unicode harf/rakam lookaround'u (`(?<![\p{L}\p{N}])`).
  İçerik sözcüğü taşıyan satır isim sanılıp kesilmiyor. **Bağlantılar koşulsuz
  silinmiyor:** ana metindeki bağlantı içeriktir, korunuyor; yalnız imza
  bölgesindeki (neredeyse tümüyle linkten ibaret) site/sosyal bağlantısı
  atılıyor (`baglantiSatiri`). Gövde tümüyle imza çıkarsa (ör. muhabir metni
  mail üzerinden düzeltip yalnız imzasıyla dönmüş) ham imza dökülmüyor: bölgede
  "sert çıpa" (e-posta, telefon, bağlantı, ünvan, kurum) varsa gövde boş
  bırakılıp ekranda sönük "yalnızca imza" işareti (`.posta-bos`, `postaBosGovde`)
  çıkıyor; yalnız kapanış/ad ise (ör. "شكرا") kısa metin korunuyor. Yeni metin
  boşsa düzeltilip dönen metin alıntıdadır: `postaAlintiMetni` tamMetin'deki ilk
  alıntı bloğunu çıkarıyor (From/Sent/To/Subject başlıkları ve "> " ön ekleri
  atılır, ikinci/iç içe alıntıda durulur, kalan imza temizliğinden geçer) ve
  balonda ince kenarlı alıntı stiliyle (`.posta-alinti`) gösteriliyor; böylece
  muhabirin mail üzerinden harekeleyip/düzeltip döndüğü metin görünüyor. Ekler başlıksız, dosya
  biçiminde kutu (`.posta-ek`, dosya ikonu + ad; basınca dosya iner, aşağıda "Ekin kendisi");
  imza/gömülü görsel ekleri (`gizliEkMi`: svg/ico/gif/bmp/webp/tiff, GUID'li
  otomatik adlar [trtlogo_<guid>.png], image001.png, logo/sosyal/imza geçen
  png/jpg) gösterilmiyor, pdf/docx gibi gerçek dosyalar kalıyor. Sohbet listesi kontürlü ayrı kartlar
  (`.posta-sohbet`: renkli avatar harfi, başlık, `@gönderen`, mesaj sayısı). Telefonda tek ekran:
  sohbet seçilince liste gizlenir, "← Sohbetler"le dönülür (`.posta-duzen.secili`).
  Boşluksuz uzun konu ve gönderen adı (gerçek postada "RE:FW:TRT_Arabi_…",
  adsız gönderenin adresi) kırılır (kullanıcı: telefonda Posta sağa taşıyordu;
  `.posta-duzen { overflow-wrap: anywhere }`, esnek öğeler `min-inline-size: 0`),
  saat ve sayılar tek satırda. Demonun örnek postaları boşluklu olduğu için
  testler yakalamıyordu; `testler/posta.cjs` uzun konulu posta ekliyor.
  Sohbetin başlığında 🔍 (kullanıcı: sohbet içinde arama; `Posta.tsx →
  useSohbetAramasi`, `SohbetAramaCubugu`): balonda görünen metin, gönderenin
  adı ve ek adları aranır (`balonIcerigi`, `arama.ts → sozcuklerUyar`: hareke
  ve hemze fark etmez; gizli imza ya da alıntı eşleşip boş görünen balonu
  işaretlemesin diye ham metin değil). Eşleşen balon çerçeveli, gezilen dolu;
  en yeni eşleşmeden başlar, sayaç "1/n", oklar ve Enter/Shift+Enter gezer,
  Esc kapatır; başka sohbete geçince kapanır.
  Bütün postalarda arama (kullanıcı: sohbet içi değil, hepsinde; "Sohbetler"
  kartının başlığında "+"nın hemen solunda 🔍, `Posta.tsx → useGenelArama`):
  konu, balonun metni, gönderen ve ek adları; liste eşleşen sohbetlere süzülür,
  satırda eşleşen son mesaj ve eşleşme sayısı; açılan sohbette aynı sorgu sohbet
  içi aramada açık gelir (`useSohbetAramasi(…, onSorgu)`).
  Okunmamış (kullanıcı: hangisi okunmuş görünmüyordu; kurallar `postaOkuma.ts`):
  kişiye bağlı harita `Durum.postaOkunan` (`HARITA_ALANLARI`, kuralda
  `kendiAyari`): taban, grup ve iplik başına son bakış; ondan yeni gelen posta
  okunmamış, giden sayılmaz. İlk açılışta taban dün (`ILK_TABAN_SAAT`): eski
  postalar birden okunmamış görünmesin. Açılan sohbet okunmuş sayılır; sohbette
  "Okunmadı yap", listede "Okunmamış · n" süzgeci ve "Hepsini okundu say".
  Okunmamış sohbet kalın, kenarı vurgulu, sayılı; menüde Posta'nın sayısı
  (`okunmamisSayisi`, grubu kayıttan: kapıyı beklemesin). Bakış kendiliğinden
  yazıldığı için izlemede ve eşitlenmeden sessizce yazılmaz
  (`eylemler.ts → postaOkumaYaz`). Test `testler/posta-okuma.cjs`.
  Basit mesaj mantığı (kullanıcı: "karmaşık olmasın, ama kim kime yazdı
  bilinsin"):
  - Yanıtta (`Yazma`, `.posta-yaz-alani`) alıcılar metne yazılır (kullanıcı):
    "@Ali, Veli" satırı Kime, "cc: …" (ya da "cc …") CC, "bcc: …" BCC; Arapça
    klavyede "نسخة:" CC, "مخفية:" BCC (iki nokta şart: "نسخة من التقرير…"
    cümlesi CC sanılmasın). Virgülle (Arapça "،", ";") birden çok, satır
    nerede olursa olsun; bu satırlar postanın metnine girmez (`eposta.ts →
    postaKomutlari`, `komutSatiri`). Ad ya da adres: `adresCoz` (tam ad
    Arapça/Latin/yerel kısım, yoksa adın geçtiği tek kişi; birden çok uyarsa
    yazışmadakiler öncelikli, yine çoksa bulunamadı). Satırda yazarken öneri
    (`yarimOge`; önce yazışmadakiler), seçilen satıra yazılır (ad tek kişiye
    çözülüyorsa ad, değilse adres). @ yoksa "tümünü yanıtla" (`yanitAlicilari`:
    son gelen postanın göndereni ve Kime'si Kime'ye, CC'si CC'ye; kendi adresi
    ve grup çıkar; gelen yoksa gidenin alıcıları). @ varsa Kime o; yazışmanın
    CC'si kalır, cc satırı eklenir. Kime/CC/BCC kutunun üstünde çip satırında
    (`data-posta-alicilar`); bulunamayan ad kırmızı çip, gönder pasif
    (`aria-disabled`, nedeni ipucunda ve basınca). BCC kayda yazılmaz: kayıt
    grupta ortak, CC'deki grup BCC'yi görürdü. Konu "RE: …".
  - "Sohbetler"in yanında "+" yeni posta (`YeniPosta`, `Pencere`): Kime, CC
    (grup kilitli çip), "BCC ekle"yle BCC, konu, metin; alıcısız gönderilmez.
    Sohbet konunun çekirdeğiyle açılır.
  - Adres girdisi çip + yazı alanı; Enter/virgül çipe çevirir, geçersiz adres
    çip olmaz ve bildirilir; öneriler (e-postası olan kayıtlı kişiler ve
    yazışmalarda geçen adresler; Arapça, Latin ad ya da adresle) kutunun
    altında düğme (`datalist` değil, Android).
  - Kim kime yazdı: her balonun altında sönük "→ kime · CC: …"
    (`AliciSatiri`, `PostaMesaji.kime`/`cc`; adres yerine kayıtlı kişinin adı,
    yoksa yerel kısmı, tamamı ipucunda). Kapı gelen postanın To ve Cc'sini ayrı
    okuyor (`ews.ts → getItemCoz`, `EwsMesaj.kime`/`cc`).
  - Gönderim kapıda EWS `CreateItem` (`SendAndSaveCopy`; `worker/src/ews.ts →
    createItemIstegi`, `GidenPosta`: çoklu Kime, CC, BCC; şema sırası To, Cc,
    Bcc). Gövde her zaman HTML: düz metin `ews.ts → metinHtml` ile satır
    satır yönlü (`satirYonu`: harflerin çoğunluğu Arapçaysa `dir="rtl"` ve sağa
    yaslı, değilse sola, eşitlikte ilk harf; harfsiz satır öncekinin yönünde;
    kullanıcı: karışık postada Latin satırlar sağa yaslanıyordu). Satır `<p>`,
    yönü `dir`, `align` ve `direction`/`text-align` ile (`satirHtml`): Arapça
    çağrıya yanıtta Outlook'un Word motoru div'in hizasını ezebiliyor; plan
    postasının metni de aynı kuralla (`planGonder.ts → govdeliHtml`), süzgeç
    `align`'ı tutar. Düz metin gövdede
    Outlook Arapça postayı karşıya sola yaslı gönderiyordu; PKG geri
    bildirimi de bu yoldan, `POST /posta/gonder` (dış muhabir ve onay bekleyen hariç).
    **Grup adresini kapı her zaman CC'ye ekler** (tarayıcıya bırakılmıyor:
    yazışma grupta kalsın, yanıtlar kutudan geri gelsin); adreslerden biri
    bile geçersizse gönderim reddedilir (`index.ts → adresListesi`), en çok 50
    alıcı. Kapı gerçekten gönderdiği Kime/CC'yi döndürür; giden balon onunla
    eklenir (`eylemler.ts → postaGidenEkle`, `PostaMesaji.giden`, sağda yeşil).
    Demoda yalnız ekrana.
  - Grup CC'de olduğu için gönderilen posta kutuya geri düşer:
    `postaIsle` onu Message-ID'siz giden balonla (metnin başı aynı, 6 saat
    içinde) eşleştirip yeni mesaj saymaz, yalnız Message-ID'sini ve sunucudaki
    yazışma kimliğini öğrenir; konudan açılmış iplik o kimliğe taşınır. Kendi
    postası dönmeden yanıt gelirse sunucu kimliğinde sohbet yoksa aynı konuyla
    buradan açılmış sohbete katılır.
  - Çağrı yanıtı öneriye de aktarılır (kullanıcı: sohbet olduğu gibi dursun,
    işe yarayan öneriye geçsin; öneri her halükarda Planlama'nın
    kontrolünden geçiyor): kutudan çekilen her posta sohbete yazıldıktan
    sonra `eylemler.ts → cagriYanitiysaIsle`'den geçer, çağrıya verilmiş
    muhabir yanıtıysa mevcut yanıt akışına (`epostaYanitiIsle`, "Gelen
    yanıtlar", `yanittanOneriTaslagi`) girer. Konuda `ND-`/`HP-` etiketi
    varsa o çağrı: gönderen tanınmıyorsa "eşleşmedi" (elle bağlanır),
    tanınıyor ama çağrının BCC'sinde değil ve muhabir (dış ya da iç) değilse
    alınmaz (planlamacının kendi yanıtı, grubun geri dönen postası onun adına
    öneri açardı). Etiket silinmişse gönderen o çağrının BCC'sinde ve konu
    çağrının konusuyla (`cagriKonusu`, etiketsiz çekirdek; kurumun başlığı "طلب خطة اليوم التالي / 06 نوفمبر - الجمعة", "طلب الخطة الأسبوعية للفترة بين 14 - 20 نوفمبر", önceki başlık da `cagriKonulari`'nda) aynı olmalı; yoksa
    muhabirin her postası öneri olurdu. Aynı muhabirin aynı çağrıya sonraki
    postası (reddedilmemiş, geri çekilmemiş e-posta önerisi varken) yeni öneri
    açmaz: metni önerinin `satirlar`'ına girer, hareket `takipSatiriEklendi`
    (Planlama'ya); elle içe aktarmada da aynı. "Önerim yok" önerisiz.
    Yalnız selam ya da teşekkürden oluşan kısa yanıt ("günaydın", "صباح الخير",
    "شكرا"; `eposta.ts → selamMi`, `bosYanitMi` içinde) öneri olmaz, "önerisi
    yok" sayılır. E-postadan doğmuş, karara girmemiş öneriyi (yeni ya da
    değerlendirmede, planda kaydı yok) planlamacı her yerde "Sil"le izsiz
    siler (`Tablolar.tsx → EpostaOneriSil`: kartta ve satırda çöp simgesi, ana
    sayfa tablosunda, plan ekranının öneri penceresinde, ayrıntıda; ilk sürümde
    yalnız ayrıntıdaydı, Planlama orada aramıyordu; `eylemler.ts →
    epostaOnerisiSil`, `epostaOnerisiSilinir`; öneri değerlendiren ya da
    `oneriSilme` yetkili): öneri, yazışması ve hareketleri gider, "silindi"
    hareketi yazılmaz; e-posta Gelen yanıtlar'da "önerisi yok" olarak kalır.
    Bildirimde "N yeni posta · M öneriye aktarıldı". Gerçek kipte, Node'da
    denendi; e2e'ye girmiyor (demoda kutu yok).
  - İçe aktarma kartı (Outlook'tan sürükle-bırak, `.eml`, yapıştır) kalktı:
    posta kutudan geliyor. Demoda örnek yazışmalar `ornek.ts → ornekPosta`
    (kurgusal). Kısıtlı muhabir görmez (koleksiyon `KISITLI_OKUR`'da değil;
    kural catch-all'u kapsıyor). Test `testler/posta.cjs`; `postaIsle`'nin
    geri dönüş ve iplik kuralı gerçek kipte, e2e'ye girmiyor.
  - Sohbet gruba göre ayrı (gerçek kip): her mesaj çekildiği grup adresine
    etiketleniyor (`PostaMesaji.grup`, küçük harf; `postaIsle`/`postaGidenEkle`/
    `postalariCek` grubu yazıyor, giden yanıt ipliğin grubuna); Posta ekranı
    yalnız kişinin kendi grubunu (`postaKimlikGetir().grupAdresi`) gösteriyor,
    biri kendi hesabıyla çekince başka birimin postası karışmasın. Koleksiyon
    hâlâ ortak (herkes okuyabiliyor), ayrım ekranda süzgeçle; demoda süzgeç
    yok. Kişiye özel kimliğe geçmeden önce admin hesabından çekilip ortak
    havuzda kalan etiketsiz mesajları, admin Posta'yı açınca bir kez kendi
    grubuna mal ediyor (`eylemler.ts → postaEtiketsizleriGruba`, yalnız tam
    yönetici, yalnız etiketsize dokunur).
  - Gerçek kipte otomatik besleme EWS köprüsüyle (`worker/src/ews.ts`,
    `ntlm.ts`, `posta-ayar.ts`): kurumun Exchange'i (posta.trt.net.tr) yalnız
    NTLM/Negotiate kabul ettiği ve Worker'ın fetch'i NTLM el sıkışmasını tek
    bağlantıya sabitleyemediği için ham TLS soketinde (`cloudflare:sockets`)
    elle NTLMv2 + minimal HTTP/1.1 yürütülüyor. Worker FindItem+GetItem ile
    gelen kutusunu okuyor (GetItem küçük gruplar hâlinde, aynı bağlantıda:
    tek büyük yanıt okuma zaman aşımına düşüyordu; her okumada 20 sn sınır;
    sunucu bağlantıyı yanıtsız kapatırsa ya da okuma zaman aşımına düşerse
    `ews.ts → okumaOturumu` yeni bağlantıda el sıkışıp aynı isteği yineler
    (en çok iki kez), "Connection: close"da sonraki istek yeni bağlantıda; "bağlantı
    yanıt gelmeden kapandı" uyarısı böyle çıkıyordu. Hata adımıyla döner
    ("GetItem 2/5: … (0 bayt) · 3 bağlantı denendi"): sunucu mu kesiyor görülsün.
    Bir grup alınamazsa alınan postalar `uyari`yla yine döner, bildirimde
    "bir kısmı alınamadı"; bağlantı kopunca hepsi gitmiyor. Gönderim yinelenmez,
    posta iki kez gidebilirdi),
    planlama grubu adresine (To/Cc) gelenleri süzüyor,
    ekleri ad olarak bırakıp gövdeyi `yeniMetin`le temizliyor. **Servis hesabı
    istemiyoruz:** Worker Firestore'a kendi yazmıyor, çektiğini döndürüyor;
    tarayıcı (`src/posta-kapi.ts → postalariCek`) kişinin kendi oturumuyla
    `postaIsle` ile yazıyor. Yani otomatik çekme bir Planlama tarayıcısı
    açıkken olur (bilgisayar tümüyle kapalıyken değil). Posta ekranı gerçek
    kipte açılışta bir kez ve "Postaları çek" düğmesiyle çekiyor. **Kimlik
    kişiye özel:** ortak ayar (sunucu, alan, açık/kapalı) tam yöneticide
    (`posta-ayar` KV; Ayarlar › "E-posta kutusu (EWS)", `ekranlar/PostaAyari.tsx`);
    kullanıcı adı, parola ve grup adresi herkesin kendisinde (kapının KV'sinde
    uid'ye bağlı `posta-kimlik:<uid>`, parola tarayıcıya hiç gelmiyor). Parola
    KV'de AES-GCM ile şifreli (`worker/src/gizli.ts`; kullanıcı: şifreler düz mü
    duruyor): anahtar Worker'ın gizli değeri `POSTA_ANAHTARI`, dağıtım işi yoksa
    rastgele üretip yazar, varsa dokunmaz (değişse kayıtlı şifreler çözülemez,
    çözülemeyen boş sayılır, kişi yeniden girer). Düz kalmış eski kayıt anahtar
    varken ilk okumada şifrelenir. Test `worker/test/gizli.test.ts`. Şifre reddi (kullanıcı: şifresi değişen kişi yeni şifreyi girip kaydedince kabul edilmiyordu):
    "Bağlantıyı dene" kayıtlı eski şifreyi deniyordu, kapı da eskisiyle her 15 dakikada iki kez giriş
    deneyip kurumun sunucusunda hesabı kilitleyebiliyordu. Exchange 401 dönünce kimlik işaretlenir
    (`PostaKimlik.reddedildi`, `index.ts → kimlikReddiniYaz`), işaret dururken çekme, gönderme, ek ve
    otomatik çağrı o şifreyle denemez (`kimlikReddedildi`, ekranda `kapiParolaReddi`); yanıt gönderiminde
    iki yolda da reddedilen şifreyle yeni posta denenmez. Yeni şifre ya da kullanıcı adı işareti kaldırır
    (`postaKimlikBirlestir`). "Bağlantıyı dene" formda yazılmış, kaydedilmemiş şifreyi dener
    (`/posta/dene {kullanici, parola}`, kaydetmez); kayıtlı şifreyle denemede başarı işareti kaldırır.
    Kaydet yeni şifreyi hemen sınar, kart reddi satırla söyler (`data-posta-parola-reddi`). Her kişi
    kendi kurumsal hesabını ve kendi biriminin grup adresini girer (planlamacı
    planlama grubunu, Newsdesk kendi grubunu), böylece herkes kendi grubunun
    yazışmalarını görür. Kimlik formu Ayarlar'da (`ekranlar/posta/
    PostaKimlik.tsx`, Ayarlar'da `GERCEK && postaGorebilir(ben)`); dileyen
    girer, zorlama ve hatırlatma yok (Posta sayfasındaki zorunlu kart, zilde
    hatırlatma ve `posta-kimlik-durum.ts` kalktı). Posta sayfası açılışta parola
    varsa sessizce çeker, yoksa hiçbir şey yapmaz; kimliksiz kişi Ayarlar'dan
    girer. `/posta/cek`, `/posta/gonder`, `/posta/dene` çağıranın
    kendi kimliğini (uid) + ortak sunucu/alanı kullanır, çağıranın grup
    adresiyle süzer. Worker uçları: `GET/PUT /posta/ayar` (tam yönetici, ortak),
    `GET/PUT /posta/kimlik` ve `POST /posta/dene` (Planlama/yönetici, kendi),
    `POST /posta/cek` (Planlama/yönetici).
    Ekin kendisi (`POST /posta/ek`, `ews.ts → ekIndir`, istemcide `posta-kapi.ts →
    postaEkiGetir`, `Posta.tsx → useEkIndir`): kayıtta yalnız adı var; kişi
    ekte ya da yandaki dosya sütununda basınca kapı postayı onun kendi
    kutusunda (gelen kutusu) Message-ID'siyle bulur (EWS kimlikleri kutuya
    özgü, sohbet ortak), ekleri listeler, adı tutanı GetAttachment ile çekip
    olduğu gibi döndürür; tarayıcı indirir, hiçbir yere saklanmaz. 20 MB üstü
    reddedilir (Worker belleği); kişinin kutusunda olmayan posta "bulunamadı".
    Yanıt okuyucu parçaları biriktirip yalnız tamamlanınca birleştiriyor
    (`yanitOku`): her parçada bütün tamponu kopyalamak büyük ekte işlemciyi
    bitiriyordu. Demoda kutu yok, iner yerine bildirim.
    NTLMv2 kriptosu MS-NLMP §4.2.4 vektörleriyle sınanıyor; testler
    `worker/test/ntlm.test.ts`, `ews.test.ts`, `posta-ayar.test.ts`
    (`cd worker && npm test`). Microsoft Graph yolu (dinleyici kutu +
    abonelik) ileride aynı `postaIsle`'yi besleyebilir
    (`belgeler/eposta-entegrasyonu.md`).
  - Otomatik öneri çağrısı (kullanıcı: çağrıyı her gün elle göndermek
    istemiyor; sonra: metin, saat ve takvimde kimin göndereceği ayarlansın,
    ekran kalabalık olmasın; `src/otoCagri.ts`, kapıda `worker/src/oto-cagri.ts`):
    Next Day her gün ertesi günün planı için, haftalık haftada bir sonraki
    haftadan sonraki hafta için (`hpHaftasi`; Cuma'dan 8 gün sonraki
    Cumartesi). Ayar kapının KV'sinde (`OtoCagriAyar`): `zaman` (Next Day
    saati, haftalığın günü ve saati, yanıt için son saat; varsayılan 09:00,
    Cuma 10:00, 15:00), `sablon` (Next Day ve Weekly metni; boşsa kurumun
    metni `cagriGovdesi`/`haftalikGovde`, yer tutucular {gun} {tarih} {saat},
    {aralik} {adres}). Gönderen o çağrının görevlisi (kullanıcı: ayrı gönderen
    takvimi, istisna günleri ve tek tek "gönderme" işaretleri çok karışıktı;
    Görevler'de zaten görevli var): Next Day çağrısında gönderildiği günün Next
    Day görevlisi (o gün ertesi günün planını o hazırlıyor), haftalıkta Weekly
    görevlisi (`otoCagri.ts → cagriGorevlisi`, `gorevler.ts → temelSorumlular`).
    Tarayıcı paketi kurarken görevliyi kaleme yazar (`OtoKalem.gorevli`, "" yok);
    kapı yalnız "Görevli olduğum gün çağrı benim hesabımdan gitsin" diyene
    gönderir (`gonderenler`, kişi yalnız kendini ekler/çıkarır, `katil`): posta
    o kişinin EWS kimliğiyle gider; izin vermemiş görevlide geçmişe `izinsiz`
    (adıyla), görevli yoksa `gonderen` yazılır, başkasına düşmez. Görevlisi
    yazılmamış eski pakette eski takvim (`haftalik`, `istisna`) geçerli
    (`worker/src/oto-cagri.ts → gununGondereni`); ilk sürümün tek göndereni
    (`uid`) okurken her günün göndereni olur (`otoCagriNormal`). "Bunu gönderme"
    (`atla`) kalktı, paket bırakılırken eski işaretler silinir.
    Kime gönderenin grup adresi, muhabirler BCC'de (izinde olmayan, kurumsal
    adresi olan); HTML gövde. Zamanlayıcı 15 dakikada bir (`wrangler.toml`,
    `index.ts → CRON_OTO`): saati gelmiş kalemi gönderir (`gununKalemi`,
    İstanbul saati), başarısızı üç kez dener (istek sunucuya yazıldıktan sonra kopan gönderim `belirsiz`, yeniden denenmez: çağrı iki kez gidebilirdi), görevli yoksa ya da izin
    vermemişse ve liste bayatsa geçmişe bir kez yazar. Kapı veritabanını okuyamıyor: gönderen
    listesindeki planlamacının tarayıcısı önümüzdeki 14 günün çağrılarını
    (saatiyle) ve BCC listesini kapıya bırakır (`otoPaketiBirak`; açılışta ve
    saatte bir, değişmediyse yazmaz; zaman ya da metin kaydedilince yeniden
    kurulur). Kayıtta çağrısı olan etiket (elle gönderilmiş) gitmez. Gönderilen çağrıyı kayda uygulamayı açan
    planlamacının tarayıcısı yazar (`otoCagrilariKaydet`, kimlik `oc-<etiket>`,
    hareket `cagriHazirlandi`; `postalariCek` postayı çekmeden önce de): yanıt
    ND-/HP- etiketiyle ona bağlanır. Gönderilemeyen gönderen listesindekilere
    bir kez bildirilir. Ekran Ayarlar › "Otomatik öneri çağrısı"
    (`ekranlar/posta/OtoCagri.tsx`; gerçek kip, çağrı hazırlayan): açık anahtarı,
    kişinin kendi izni (`data-oto-izin`), sıradaki iki çağrı kutuda (tür, gün ve
    saat; "Gönderecek: X", yoksa "Bu gün görevli yok" ve Görevler'e bağlantı ya
    da "X izin vermedi"; konu tek satır); altında katlı "Zaman ve metin" ve
    "Geçmiş". Testler
    `worker/test/oto-cagri.test.ts`.
- Çağrıya hatırlatma (kullanıcı: haftalık çağrıdan sonra haftanın belli
  vakitlerinde aynı postanın altına iri, kalın, kırmızı "تذكير"; yanıtları
  öneriye düşmeye devam etsin): Weekly ⋯ › "Hatırlatma" (`data-arac="hatirlatma"`;
  çağrısı olan, kesinleşmemiş hafta, `cagriHazirla`), pencere
  `haftalik/Cagri.tsx → HatirlatmaPenceresi` (önizleme, isteğe bağlı not, alıcı
  sayısı, önceki hatırlatmalar). Kişinin EWS kimliğiyle `POST /posta/gonder`:
  Kime çağrının Kime'si, BCC çağrının muhabirleri (kapı sınırı 50, 45'lik
  parçalar), konu `eposta.ts → hatirlatmaKonusu` ("RE: " + çağrının konusu,
  HP- etiketi yerinde: yanıt `cagriYanitiysaIsle`'den öneriye), gövde not ve
  çağrının metni (`hatirlatmaMetni`). Kırmızı başlığı kapı kurar (`baslik`,
  `ews.ts → baslikliHtml`; tarayıcıdan HTML alınmaz). Çağrı Posta'daysa
  (grup Kime'de, kutuya düşüyor) en eski aynı etiketli postanın Message-ID'si
  `yanitlanan` (`cagriMesajKimligi`): kapı `InReplyTo` ve `References` yazar,
  muhabirin posta programında çağrının altına düşer; sunucu şemada reddederse
  bağsız bir kez daha (posta gitmemişti). Kayıt `Cagri.hatirlatmalar`
  (`eylemler.ts → cagriHatirlatildi`), menüde sayısı. Demoda posta gitmez,
  yalnız kayıt. Gönderim tek yerde (`hatirlatmaGonder.ts →
  cagriHatirlatmasiGonder`): pencere de asistan da onu çağırır. Asistanda
  `cagriHatirlat` aracı (kullanıcı: "hatırlatma gönder" deyince asistan ayrı
  posta yazıyordu): onay kartında hafta (çağrısı olan açık haftalar) ve isteğe
  bağlı not, metin kurumun hatırlatması; kapının araç tanımı ve `postaGonder`'in
  açıklaması onu gösterir. Test `testler/hatirlatma.cjs`, `testler/asistan.cjs`,
  kapıda `ews.test.ts`.
- PKG geri bildirimi (kodda "takdir"; ekrandaki adı kullanıcının isteğiyle
  "PKG geri bildirimi", önce "Takdir bildirimi"ydi; kullanıcı: plan onaylanınca kabul edilen paketin
  muhabirine hazır şablonla posta; kendiliğinden gitmesin, tek tek işaretleyip
  göndereyim; `src/takdir.ts`, sayfa `nextday/Takdir.tsx`,
  `#/nextday/:id/takdir`): Next Day "Planı onayla"dan sonra (planlamacıda,
  kabul edilen paket varsa) sayfa açılır; onaylı planda "Takdir bildirimi"
  düğmesiyle sonradan da. Satır başına paket (onaylı ya da üretimde, muhabiri
  belli, TBC ve özel yayın değil; `takdirPaketleri`), her biri ayrı posta;
  adresi (kurumsal, yoksa kişisel) olmayan seçilemez, gönderilmiş olan
  işaretsiz gelir ve "gönderildi · saat" (`Paket.takdirBildirimi`,
  `eylemler.ts → takdirBildirildi`, hareket `takdirBildirildi`). Gönderim
  kişinin EWS kimliğiyle `POST /posta/gonder` (grup CC'de, kapı ekliyor),
  sırayla; demoda yalnız işaret. Şablon (konu "تكليف تقرير من {sehir} |
  {strap}", metin "sen" diliyle ama cinsiyetsiz: "مرحبًا", emir kipi yok,
  "نرجو منك" + mastar, sonda "غرفة الأخبار ile iletişim") Ayarlar › "Muhabire
  geri bildirim" kartının ilk satırı "PKG geri bildirimi" (kullanıcı: ayrı
  kartı aynı işi görüyordu, birleşti; `GeriBildirimSablonlari.tsx →
  TakdirFormu`, pencerede; konu, metin, CC, BCC, varsayılana dön; silinmez):
  geri bildirim şablonlarının koleksiyonunda sabit kimlikle (`TAKDIR_SABLONU`),
  öbür şablonların arasında ikinci kez görünmez, onlar yazılırken düşmez. Değeri boş alanın satırı düşer (notsuz "ملاحظة:" yok).
  Test `testler/takdir.cjs`.
  Weekly'de de (kullanıcı: kesinleşen haftanın ⋯ menüsünde "Kabul edilen
  paketler", dilediğine posta; gönderilmeyen Next Day hazırlanırken karşıma
  çıksın; `haftalik/Takdir.tsx → HaftalikTakdirPenceresi`): kabul edilen
  (şartlı değil), muhabiri belli, yalnız canlı olmayan kalemler gün sırasıyla
  (`takdir.ts → haftalikTakdirKalemleri`), aynı şablon ve liste
  (`nextday/Takdir.tsx → TakdirListesi`, iki sayfa ortak). Paket henüz
  doğmamış olabildiği için iz kalemde (`HaftalikKalem.takdirBildirimi`,
  `eylemler.ts → haftalikTakdirBildirildi`; doğmuş paketine de yazılır, sonra
  doğan pakete taşınır). Next Day taslak ve toplantıdayken postası gitmemiş
  Weekly paketi "Sıradaki" kartında "Weekly · n paketin postası gitmedi"
  (`bildirilmemisHaftalik`, `data-haftalik-takdir`), basınca planın bildirim
  sayfası. Reddedilene posta yok; muhabir önerisinin sayfasında görür.
  Test `testler/haftalik-takdir.cjs`. Kesinleşmiş haftanın toplantı
  görünümünde de (kullanıcı: geri bildirim orada da olsun, e-posta ikonu,
  basınca onaylansın gitsin): kabul edilen paketin satırının solunda zarf
  (`haftalik/Takdir.tsx → KalemPostaDugmesi`, `.kalem-posta`; belge sağdan
  sola, satırın sonu boş): onay sorulur, tek posta aynı şablonla gider,
  kalemi seçmez; gönderilmişse yeşil işaret, ipucunda saat; adresi yoksa pasif.
  Test `testler/toplanti-posta.cjs`.
- Planı gönder (kullanıcı: onaylanan plan üstteki zarfla, plan metnindeki
  biçimiyle postaya gitsin; CC ve başlık Ayarlar'da bir kez; `planGonder.ts`,
  `bilesenler/PlanGonder.tsx`): onaylı (ya da devralınmış) Next Day'in (klasik ve
  yeni görünüm) ve kesinleşmiş Weekly'nin başlığında zarf (`data-plan-gonder`;
  yetki `yetki.ts → planGonderebilir`: planDuzenle / haftalikDuzenle). Pencerede
  Kime, CC, BCC ve konu şablondan (konu değişir), altında planın temiz kopyası;
  gövde "E-posta için kopyala"nın biçimi (`indir.ts → epostaHtml`), şablonun metni
  varsa planın üstünde (`govdeliHtml`). Kişinin EWS kimliğiyle `POST /posta/gonder`
  `html`'le: kapı tarayıcıdan gelen HTML'i izin listesiyle süzer (`ews.ts →
  guvenliHtml`: biçim etiketleri ve style/dir/lang; betik, bağlantı, resim, olay
  özniteliği, url() atılır; önce kapı tarayıcıdan HTML hiç almıyordu); grup yine
  CC'de, Kime boşsa grup Kime'ye. Gönderilince planda `gonderildi` (zaman, kişi;
  `eylemler.ts → planGonderildi`), zarf yeşil, saati ipucunda; yeniden gönderim
  sorulur. Demoda posta gitmez, yalnız iz. Şablonlar Ayarlar › "Planların postası"
  kartında (`GeriBildirimSablonlari.tsx → PlanPostasiAyarlari`, `data-plan-postasi`;
  kullanıcı: önce "Muhabire geri bildirim" kartının içindeydi, bulunmuyordu)
  Next Day ve Weekly satırları (`PlanGonderFormu`): Gönderen (`GeriBildirimSablonu.gonderen`;
  boşsa gönderenin kendi hesabı, doluysa posta o adresin adına gider: kapı EWS
  `From` yazar, `ews.ts → createItemIstegi`; Exchange "farklı gönder" yetkisini
  sorar, yoksa `gonderenYetki` ve açık bildirim `pgGonderenYetki`), Kime, CC, BCC,
  konu, metin; geri bildirim koleksiyonunda sabit kimlikle
  (`plan-gonder-nd`, `plan-gonder-hf`; `geriBildirim.ts → SABIT_SABLONLAR`, PKG
  geri bildirimiyle aynı yol), `GeriBildirimSablonu.kime`, yer tutucular {tarih}
  {gun}, {aralik} ve {aralikEn} (İngilizce, büyük harf: "21 - 27 NOVEMBER");
  varsayılan konu "الأجندة الإخبارية - {tarih}" ve "الأجندة الأسبوعية {aralik}".
  "Plan nasıl gitsin" (`GeriBildirimSablonu.ek`, `data-pg-sablon-ek`): postanın
  metninde ya da ekte Word dosyası (kullanıcı: kurum haftalık planı kısa iki dilli
  yazı ve ekte kesinleşmiş planla gönderiyor); Next Day metinde, Weekly ekte, Weekly'nin
  varsayılan metni kurumunki (`HAFTALIK_METIN`). Ek "Word indir"in dosyasının aynısı
  (`indir.ts → wordBelgesi`, base64 `base64Metin`), pencerede "Ek" satırı
  (`data-pg-ek`); gövde yalnız şablonun metni, satır satır yönlü (`govdeliHtml`:
  Arapça satır sağa, İngilizce sola). PDF eki yok: tarayıcıda Arapçayı düzgün dizmek
  kütüphane ister. Kapı eki `CreateItem`'da Body'nin ardında `Attachments`'a yazar
  (`ews.ts → GidenPosta.ekler`); `/posta/gonder` yalnız .doc/.docx/.pdf, Word ya da
  PDF türü, en çok üç ek, toplam 4 MB kabul eder (`index.ts → ekListesi`).
  Test `testler/plan-gonder.cjs`, kapıda `ews.test.ts`.
- Deneme sürecinin e-postayla takibi kalktı (tasarım 9. bölüm): yerini
  görev ve "yapıldı" akışı aldı; kodu da silindi ("Takipteki haberlerim",
  "Tamamlandı", "Yalnız takip", ayar). Paketsiz eklemek zaten takip olarak.
  Eski kayıttaki izleri açılıştaki geçiş temizler (aşağıda). `Durum.
  geriBildirimAyari` ve öneri alanları (`takip`, `yalnizTakip`…) yalnız
  eski kaydı okumak için tipte.
- Yeni öneri düzenine geçiş. Kural: eski düzende öneri kalmaz. Sistemin
  açılış işi (`eylemler.ts → eskiOnerileriCevir`, `App.tsx → yokla`) eski
  biçimde ne kaldıysa kendiliğinden çevirir (örnek veri de ilk açılışta);
  Ayarlar'daki elle geçiş kartı kalktı (kullanıcı).
  Kurallar `gecis.ts`. Öneri üzerindeki e-postayla takip izleri (`takip`,
  `yalnizTakip`, `takipBitis`, `takipBitiren`) silinir: plana paketsiz giren
  haber zaten takip olarak plandadır, paket "Yapıldı" ve onayla kapanır;
  eski "Tamamlandı" ve onu geri açan yol bu izlerle canlı kalıyordu. Eski
  takip kaydının ikinci yüzü olan "yeni" durumdaki takip türü öneri (eskiden
  açılış işi `takipOnerileriniAyikla` siliyordu) izleriyle silinir. "Sonra"
  değerlendirilecek öneri takibe (muhabirsizse değerlendirmeye); eski takip
  kaydı takipteki öneriye (`o-<takip>`, `takipId`; bitmiş takip arşivde,
  planda gelişmesi olan gelişmenin `oneriId` bağıyla "plana eklendi"),
  takip kaydı `gecti` işaretiyle bilgi olarak kalır, listelerde görünmez
  (`takipGorebilir`). İkinci kez çalışınca değişiklik yok; eski alanlar ve
  hareketler yerinde; tek hareket `gecisUygulandi` (açılışta kişisi `SISTEM`).
  Eski takip kayıtlarının ekranları ve eylemleri (kart, öneriye çevir, muhabire
  öner, takipten gelişme, düzelt/bitir/sil) silindi; `Durum.takipler` yalnız
  geçiş, kayıt temizliği ve eski hareketlerin metni için. Gerçek kipte eşitlenmeden
  pasif; önce yedek kartı.
- Muhabire geri bildirim (`geriBildirim.ts`, `oneri/GeriBildirim.tsx`):
  toplu "geri dönüş" düğmesi yok; her öneride değerlendirme bölümünden,
  karar verilmiş muhabir önerisinde. Şablondan e-posta (Outlook taslağı /
  mailto, CC ve BCC'li); metin, alıcılar ve not pencerede değişir.
  Şablonlar (onaylandı, reddedildi, sonra; `{muhabir} {header} {strap}
  {plan} {gerekce} {not}`) Ayarlar › "Muhabire geri bildirim"de
  (`Durum.geriBildirimSablonlari`, boşsa varsayılanlar; yetki
  `geriBildirimSablonuDuzenler`).
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
- Geri almada aşama seçimi ve ikinci plana kopya (tasarım 2c; öneri
  ayrıntısındaki `OneriKapiDugmeleri`, onaylı):
  - "Geri al" (hesap yetkisi `geriAlma`): dönülebilecek geçerli önceki aşamalar sorulur
    (`oneriPlanlari.ts → oneriGeriHedefleri`: plandaki/gündemdeki,
    reddedilen ve eski "sonra" değerlendirmeye ya da takibe; takipteki ve
    düzeltmedeki değerlendirmeye; takip muhabirsiz ve talimatta yok).
    `eylemler.ts → oneriAsamayaDon` plandaki kayıtları plandan çıkarmayla
    aynı kuralla kaldırır (`plandanCikarilmis`, `oneriPlandanCikar` da onu
    kullanıyor; üretime girmiş paket varsa durur), ret gerekçesini siler;
    plana girmeden görevlendirilmiş önerinin plansız görev paketini de geri
    alır (kullanıcı: Programlar için görevlendirdiği öneride aşamayı geri aldı,
    "Programlar · Görevlendirildi" kalıyordu, ⋯'de "Muhabiri görevlendir"
    çıkmıyordu: paket planda olmadığı için dokunulmuyor, canlı kaldığından öneri
    görevli sayılıyordu): başlamamış paket iptal, muhabire ve masaya
    `paketIptal` (`gorevPaketiniIptal`), üretime ya da sonuca girmişse durur;
    bu düzeltmeden önce geri alınıp paketi canlı kalanları sistemin açılış işi
    geri alır (`geriAlinanGorevleriTemizle`: görevden sonra geri alma hareketi
    varsa, arada mesaj gelse de; önce yalnız son hareketine bakıyordu, muhabir
    yazışmaya yazınca atlanıyordu; başlamışsa öneri "plana eklendi"ye döner). Test `testler/gorev-geri-al.cjs`;
    tek hareket `oneriAsamayaDondu` (`veri.sonuc` hedef), muhabire bildirim.
  - "Başka plana da ekle": öneri ikinci plana girecekse çoğaltılır
    (`oneriKopyala`): kopya değerlendirmeden başlar, `kopyaKaynagi` asılı
    gösterir; plan bağı, takip, satırlar, arşiv, geri bildirim geçmez.
    İkisi ayrıntıda "Bağlı öneriler"de (`BagliOneriler`).
- Muhasebe (kullanıcının çizimi; News Gathering'in alt birimi, yerleşik birim
  `muhasebe`, ünvanlar yönetici ve `muhasebeci`; onsuz yayınlanmış yapıda
  okurken eklenir, `yapi.ts → muhasebeyiKur`). Sayfa `ekranlar/Muhasebe.tsx`
  (`#/muhasebe/<sekme>`), kurallar `muhasebe.ts`, eylemler `eylemler.ts →
  muhasebe*`:
  - Kendine özel, sade ekran (`yetki.ts → muhasebeciMi`, `sadeEkranMi`; dil
    denetmeni gibi): ana sayfası Muhasebe, menüde yalnız o ve Ayarlar; masa
    sayfaları ona açık değil (`MASA` muhasebesiz).
  - Gizli (`muhasebeGorebilir`, kuralda `muhasebeci`, ikisi aynı kural:
    `depo/fark.ts → muhasebeOkur`): muhasebe birimi, tam yönetici, kademedeki
    müdürler (koordinatör, Input, Output, Program düğümleri ve eski Yönetim;
    kurumun açtığı kademeye hesap yetkisi `muhasebe` verilir). Koleksiyonlar
    (`MUHASEBE_ALANLARI`: tanımlar, anlaşmalar, kapanışlar) catch-all'dan
    çıkarıldı; tarayıcı yetkisizde dinlemiyor (red bütün dinlemeyi durdururdu),
    hak değişince sayfa yenilenir. Hareket yazılmaz (hareketleri herkes okur).
    Muhabir ücretleri örnek sayfası menüden kalktı, yerine Muhasebe.
  - Sekmeler: Aylık döküm (ay seçilir; muhabir başına PKG, öbür türler, canlı,
    kota, ödeme; ayrıntı satırın içinde katlanır: tarih tarih işler; o aya
    özel kota; "Ayı onayla" ve "Ödendi"; Excel'e CSV), Muhabirler ve
    anlaşmalar (Excel gibi tablo, satırda düzenle; ilk kurulumda "Excel'den
    aktar": başlık adıyla sütun, kişi e-postayla ya da adla, bilinmeyen para
    birimi ve ödeme aracı tanım olur; gerçek bilgi depoya girmez), Tanımlar
    (fiyat türleri ve kapsadığı iş türleri, ödeme araçları, para birimleri;
    hepsini muhasebe girer).
  - Muhabir sekmesi (`#/muhasebe/muhabir/<kişi>`, `Muhasebe.tsx →
    MuhabirSayfasi`; kullanıcı: muhabiri tek tek seçip işlerini görmek istedi,
    döküm bütün muhabirleri tek ayda gösteriyordu): seçici, dökümün açılan
    satırından ve anlaşmalar tablosundan da (`MuhabireGit`). Künyede anlaşma ve
    toplam iş; ay ay tablo ilk işinden (ya da kapanışından) bu aya, en çok 24
    ay (`muhasebe.ts → muhabirAylari`); seçilen ayın işleri tür süzgeciyle,
    kota, onay ve ödendi dökümle aynı gövdeden (`DokumAyrintisi`).
  - Anlaşma: sabit maaş (aylık tutar, minimum kota; altında kalan kırmızı),
    parça başı (fiyat türü başına ücret), aylık anlaşma (tutar + kotayı aşan
    iş başına ek ücret). Kota aylık, ayın kapanışında o aya özel değişir.
  - Sayılan iş (saklanmaz): tamamlanmış paket (yapılmadı, reddedilen, iptal
    değil; türü haber türü), Newsdesk'in "yapıldı" işaretlediği canlı
    (`CanliYayin.sonuc`, `eylemler.ts → canliSonuc`, yetki
    `canliSonucIsaretleyebilir`: Newsdesk ve tam yönetici; plan ekranındaki
    canlı satırında ✓/✕, plan kilitliyken de), yayınlanmış nafize.
    İşaretlenmemiş geçmiş canlı sayılmaz, dökümde uyarı.
  - Günü olmayan paketin ayı kapanış anından (teslim, onay, üretimin kapanışı,
    yayın; yerel günle), son değişiklikten (`guncelleme`) değil: düzenlenen
    paket kapanmış aydan sonraki aya kayıyordu (kod incelemesi 4.1). `sonTarih`
    yalnız plansız görevde ve özel yayında işin günü; stok ve feature paketinde
    teslim günü (son gün), orada da kapanış anı: erken teslim sonraki aya, geç
    teslim kapanmış (ödenmiş) aya düşmesin.
  - Demoda kurgusal `mh1` ve örnek anlaşmalar. Test `testler/muhasebe.cjs`,
    kural testleri `testler/kurallar.mjs`.
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
  sil" (`eylemler.ts → oneriSil`, hesap yetkisi `oneriSilme`, aynı kural `idler` ile); onayda kaç kayıt
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
- Muhabirin takipleri (`ekranlar/Takipler.tsx`, `#/takipler`): muhabirin
  izlediği güncel konu (olay, toplantı, etkinlik). Muhabir menüsünde
  "Takiplerim"; Planlama ve Yönetim'de "Muhabir takipleri",
  muhabirin profilinde de (`ProfilTakipleri`). Kılavuzda `kl2b`.
  Takip önerinin aşaması (durum `takip`; tasarım belgesi, 2b): yeni takip
  ayrı kayıt değil öneri. Muhabir Takiplerim'deki "Yeni takip"ten
  (`takipKaydet`) ya da öneri formunda haber türü "Takip"le (`veri.ts →
  TAKIP_BICIMI`, `BICIMLER`'e girmez; Strap sorulmaz, takip türü
  `Oneri.takipTuru`) açar; `oneriGonder` doğrudan `takip` durumunda açar,
  çağrıya bağlamaz, hareket `takipEklendi`. Planlama değerlendirmedeki
  muhabir önerisini "Takip olarak kalsın"la, teklifi "Takibe al"la buraya
  alır (`oneriDurum(…, "takip")`, hareket `oneriTakibeAlindi`, muhabire);
  "Sonra değerlendirilecek" düğmesi bunun yerinde kalktı (eski "sonra"
  kayıtlar rozetle duruyor). Muhabir metni değiştirmez, öneri ayrıntısında
  altına tarihli gelişme satırı ekler (`Oneri.satirlar`, `takipSatiriEkle`,
  `yetki.ts → takipSatiriEkleyebilir`: takipte ya da takip türü plana
  girdikten sonra; `Oneriler.tsx → TakipSatirlari`, yenisi üstte;
  Planlama'ya `takipSatiriEklendi`). Arşiv günü son satırın günü
  (`oneriSonGunu`): son satırdan 2 gün sonra silinir. Takiplerim ve plan
  ekranlarının "Muhabir takipleri" penceresi takip önerilerini
  (`Takipler.tsx → takipOnerileri`, `TakipOnerileri`) eski takip
  kayıtlarının yanında gösterir; sayılar ikisini toplar. Pencerede kartta
  "Plana ekle" (`PlanaEkle`, o planla): takip paketsiz gelir, istenirse PKG
  işaretlenir (adı strap, yoksa takibin konusu; `oneriPlanaEkle`).
  "Öneri ve takiplerden al" adaylarında da (`gelismeOneriAdaylari`).
  Paketsiz (canlısız) giren önerinin "Plana eklendi" notunun ve rozetinin
  yanında "Gelişme olarak · paketsiz" (kullanıcı: paket olmadığı belli
  değildi, haber türü "PKG" de görünüyordu; `OneriKarti.tsx →
  PlanaEklendiNotu`, `Tablolar.tsx → OneriDurumRozeti`; muhabirin ekranında
  da). Test `testler/oneri-paketsiz.cjs`.
  Plana paketsiz (canlısız) giren her muhabir haberinde hareket
  `veri.takip` (`eylemler.ts → oneriPaketsizGirer`): muhabire "takip olarak
  plana eklendi; paket beklenmiyor"; "Plana ekle" ve "Önerilerden al" onay
  sorusunda bunu söyler (`takipPaketsizOnay`). Muhabir dışı kaynakta
  "Takip" yok.
- Plan ekranlarında (Next Day, haftalık) gelen öneri müstakil kart
  (`oneri/OneriGovde.tsx → OneriListesi`, kart `OneriKarti.tsx`).
  Kullanıcı kartı ve pencereyi karışık, yer kaplayan buldu, örnek verdi;
  iki planlamacı ve iki tasarımcı ajanla tekrarlar ayıklandı:
  - Kart üç satır: başlık (önerilen paket, yoksa Header; iki satırda kesilir)
    ve tek durum rozeti; bilgi satırı (`OneriMetaSatiri`: kısa gün, plan
    etiketi, ülke, haber türü, saha, birim görüşü rozeti; plana girmişse
    etiket ve gün yerine yeşil "Plana eklendi · plan gün · başlık",
    "plana eklendi" rozeti o zaman çizilmez, `OneriDurumRozeti planaGizle`);
    avatar, kaynak (giren yok, `OneriKaynagi girensiz`), geçen süre ve
    hızlı karar: "Plana ekle" / "Gündeme ekle" ve ret simgesi
    (`data-oneri-ekle`, `data-oneri-hizli-ret`; kullanıcı ikisini istedi).
    Kol rengi yalnız şeritte, adı ipucunda. Gelişme, arka plan haberi,
    gerekçe, yapay zeka rozeti ve silme kartta yok (kullanıcı kararı).
    Liste görünümü (`OneriSatiri`) aynı bilgi tek satırlık başlıkla.
  - Karta basınca tek pencere (`OneriAyrinti`; ayrıntı sayfası ve öneriler
    sayfasının penceresi de aynısı, önce plan ekranındaki ayrı ve eksikti:
    birim görüşü, takip satırları, eş öneri yoktu): başlık ve rozet, altında
    bilgi satırı; katlanır bölümler (`data-oneri-bolum`): Özet (açık; şimdiki
    düzeltme notu ya da gerekçe, "Düzenle", Header, gelişme, takip
    satırları ve materyal: işleme fikri, görsel işleme, ilk hali, orijinal
    e-posta; kullanıcı: ayrı "Materyal" bölümü özeti tekrar ediyordu), Plan ve öneri (gün ve etiketler, plan, dosya, paket, kol,
    saha, kaynak, giren, kanal ve geliş; eş, bağlı ve plandakine bağla;
    bunlardan biri varsa açık), Değerlendirme (yapay zeka, birim görüşü,
    önceki düzeltme, gerekçe, geri bildirim, arşiv), Yazışma · n, Hareket
    geçmişi · n. Boş bölüm çizilmez (CSS `:has`). Ayrıntı sayfasında
    bölümler açık. Altta (`data-oneri-alt`; sayfada başlığın altında)
    kişi (ad, "Muhabir · şehir"), ⋯ menüsü, "Plandan çıkar", "Paket önerisi
    ekle", "Reddet" ve "Plana ekle". ⋯: birimin görüşüne sun, teklifte
    değerlendirmeye/takibe al, değerlendirmeye al (Next Day'de), düzeltmeye
    gönder, takip olarak kalsın, Weekly'de değerlendir, başka plana ekle,
    aşamayı geri al, geri çek, arşive gönder/çıkar, sil. Seçilen kararın
    formu bölümlerin üstünde (`data-oneri-mod`); açılınca forma kayılır
    (kullanıcı: telefonda "Gündeme ekle"ye basınca form yukarıda, görünmeden
    açılıyordu), fareli cihazda ilk alana odaklanılır, form açıkken alttaki
    karar düğmeleri gizlenir. Karttaki hızlı düğmeyle açılan form bitince
    pencere kapanır. Ayrı muhabir kartı ve süreç
    çizgisi kalktı (durum rozetinin ve adın tekrarı). Plan ekranı kendi
    ekleme formunu verir (`ekleFormu`).
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
  - Haber türü "Live" olan öneri plana paket değil canlı yayın olarak girer
    (formda PKG yerine "Canlı yayın olarak ekle"; `oneriPlanaEkle → canliAc`):
    başlığın altında `CanliYayin` (konu strap, yoksa Header; yer muhabirin
    şehri; saat boş, çıktıda "TBC"), `CanliYayin.oneriId`. Paket önerisi
    doğsaydı çıktının "مباشر" bölümünde görünmüyordu. Plandan çıkınca,
    öneri silinince (temizlik) canlı da gider; canlıyı silmek öneriyi
    `oneriBaglariniTazele`'den geçirir. Ertesi güne taşınan canlıda öneri ve
    Weekly kalemi bağı kaynakta kalır, gelişmedeki gibi (`yarinPlaniniAc`;
    taşınan kopya öneriyi her gün "bugünün planında" tutuyordu). Weekly'de LIVE işaretli kalem de
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
  - İşin yazışması ve Mesajlar (kullanıcı: muhabir görevlendirilen paketi için
    yazdı, Programlar'a bildirim gitti ama mesaj bulunamadı; yazışma yalnız
    önerinin penceresinde katlıydı; Posta'ya karışmasın; kurallar
    `mesajlasma.ts`, kart `oneri/Yazisma.tsx → IsYazismasi`): konu öneri, öneri
    pakete dönünce aynı konuşma sürer; önerisiz paketin konusu paket
    (`Mesaj.oneriId` ya da `paketId`, anahtar `konuAnahtari`: "o-…"/"p-…").
    Mesaj öneriden ayrı kayıt (`Durum.mesajlar`, gerçek kipte `mesajlar`
    koleksiyonu; erişim listesi önerinin ya da paketin muhabiri). Katılan
    (`konuKatilimcisi`): muhabir, öneriyi giren ya da talimatı veren, Planlama
    (öneri değerlendiren) ve tam yönetici, paket masanın takibindeyse ya da
    masa kolundaysa o masa (`konuMasasi` → `paketinMasasi`). Eylem
    `eylemler.ts → mesajGonder` (hareket `oneriMesaji`, `oneriMesajiGonder`
    sarmalı): bildirim öbür taraflara (`mesajAlicilari`; muhabir yazınca
    Planlama ve masa birim olarak, `veri.sahip` virgülle, `yetki.ts →
    bildirimMi`; öbürü yazınca muhabire ve yazanın birimi olmayan Planlama/masaya),
    bildirim konuşmanın kendisine götürür (`#/mesajlar/<konu>`,
    `Hareket.tsx → useHareketKonusu`). Kart önerinin penceresinde ve paket
    sayfasında (katılımcıya ya da mesajı varsa). Mesajlar sayfası
    (`ekranlar/Mesajlar.tsx`, `#/mesajlar/<konu>`, `SAYFA_IZNI.mesajlar` herkes):
    kişinin katıldığı konuşmalar en yeni mesaj önce, okunmamış kalın ve sayılı,
    Hepsi / Okunmamış (`useAdimDurumu`), sağda konuşma ve "İşi aç"
    (`konuSayfasi`); telefonda tek ekran. Menüde "Mesajlar · okunmamış"
    (Planlama'da Gelenler, masada İletişim, muhabirde İşlerim). Okunmamış kişiye
    bağlı harita `Durum.mesajOkunan` (`HARITA_ALANLARI`, kuralda `kendiAyari`,
    kısıtlı kişi kendi belgesini dinler; taban ilk kayıtta dün): konuşma ekranda
    göründüğünde okunmuş sayılır (`IntersectionObserver`; katlı bölümdeyken değil,
    `eylemler.ts → mesajOkundu`, izlemede ve eşitlenmeden yazılmaz), yazan kendi
    konuşmasını okumuş sayılır. İş kartlarında mesaj simgesi
    (`bilesenler/MesajRozeti.tsx`: masanın İçerikler'i, Stok, muhabirin
    Yapılacaklar'ı; okunmamış sayısı vurgulu, basınca konuşma). Geri almaya
    girmez. Test `testler/mesajlar.cjs`.
  - Muhabire haber önerisi (`muhabireOneriGonder`): Planlama (onun "gibi"
    çalışan birim de) ve tam yönetici (`yetki.ts → muhabireOneriGonderebilir`;
    Ayarlar'daki birim seçimi kalktı, kullanıcı: havada kalıyordu) öneriler sayfasından
    ya da muhabirin profilinden öneri gönderir. Öneri `yon: "muhabire"`,
    durum `teklif` ("Muhabire teklif"). Muhabir reddedemez, yazışmada konuşur
    (ekranında yalnız `TeklifNotu`); kararı gönderen ya da Planlama verir
    (`yetki.ts → teklifKarariVerebilir`): değerlendirmeye alır (`oneriDurum`)
    ya da geri çeker (`oneriGeriCek`, durum `geriCekildi`, arşive). Muhabir
    de önerisini Planlama dokunmadıysa geri çeker (`oneriGeriCekebilir`:
    "yeni", elle girilmemiş, düzeltme istenmemiş). Öneriler sayfasını görmeyen
    gönderen önerisini ve yazışmasını muhabirin profilinde izler
    (`MuhabireOnerilenler`).
  - Kart ya da liste kişinin seçimi, ana sayfa düzeni gibi kayıtta
    (`Durum.oneriGorunumu`, `eylemler.ts → oneriGorunumuKaydet`); aynı
    tarayıcıda başka biri girince kendi seçimini görür, seçmeyen kart görür.
  - Öneri penceresi kısa (kullanıcı: aşağı çok uzuyordu): satırsız öneride
    "Gelişmeler" kartı yerine "Gelişme ekle" düğmesi, boş yazışmada "mesaj
    yok" satırı yok, bölümler katlanır, alanlar dar sütunda
    (`dialog.pencere .alanlar`).
  - Öneriler sayfası (`oneri/Oneriler.tsx → OnerilerListe`) da aynı seçimi
    izler: kartta karta basınca aynı pencere (`OneriAyrinti`), listede
    bugünkü tablo. Başlık kartındaki küçük liste bu kalıba girmez.
- Haftalık plan (`ekranlar/haftalik/`): Cumartesi–Cuma, Perşembe
  toplantısı. Hazırlık → haftalık toplantıda → kesinleşti.
  - Üst kısım `PlanBasiKalibi` (Next Day'deki gibi): "Weekly · aralık", ↶ ve
    ⋯ (çıktı, belge, haftalık çağrı, gelen yanıtlar); "Sıradaki" kartında
    hazırlıkta "Haftalık toplantıya götür", toplantıda "Hazırlığa geri al",
    "Kalanları kabul et" ve dolu "Planı kesinleştir" (karar bekleyen varken
    pasif, sayısı kartta), kesinleşmişte bekleyen aktarım; künye ve Takip.
    Önce büyük ikon, ortalı düğmeler ve ayrı durum kartı vardı.
  - Sürükle-bırak (kullanıcı: Next Day'deki gibi; `haftalik/haftaSurukle.ts`,
    kalıbı `nextday/planSurukle.ts`): kalem başka kalemin üstüne bırakılınca
    onun gününü ve dosyasını alıp yerine geçer, dosya grubuna bırakılınca o gün
    ve dosyanın sonuna, günün kendisine bırakılınca dosyası kalır ve gün değişir,
    "Stok ve programlar"a bırakılınca günsüz (`eylemler.ts → kalemSurukle`;
    haftalık düzenleyen, gündemdeki ve kilitli olmayan kalem; teslim günü
    `kalemKaydet`'in kuralıyla). Ana dosyalar birbirinin yerine
    (`anaKonuYerine`). Öneri kartı güne ya da dosyaya bırakılınca "Gündeme ekle"
    o yerle pencerede açılır (`GundemeEkle yer`), kayıt formdan. Satır
    `haftaSuruklenir` (`data-hf-sur`), yer `hfYer` (`data-hf-gun`, dosya grubunda
    `data-hf-dosya`, dosyasız ""), tek dinleyici `haftaSurukleKabi` (plan
    ekranında `.plan-surukle`, belgede `<article>`). Test `testler/hafta-surukle.cjs`.
  - Kalemin dosyası merkezi başlık havuzundaki başlık; Next Day'e aynı
    başlıkla geçer, havuz ikiye bölünmez.
  - Bir dosyaya istediği kadar PKG (kullanıcı: gündemde başlığa yalnız bir paket
    ekleyebiliyordu): kalem tek paket taşır, bu yüzden dosya grubunun altında
    "Bu dosyaya PKG ekle" (`data-dosya-pkg-ekle`; plan ekranında `DosyaGruplari`,
    belgede dosya satırının şeridinde) aynı gün ve dosyada yeni kalem açar
    (`KalemFormu pkg`: Strap önde ve zorunlu, metin isteğe bağlı). Kalemin metni ya
    da Strap'li PKG'si olmalı (`haftalik.ts → kalemIcerigiVar`, `kalemKaydet`);
    metinsiz kalem ekranda, belgede ve çıktıda yalnız PKG satırıyla, Next Day'e
    gelişmesiz, ayrı paketle (her biri kendi kararıyla) geçer. Test
    `testler/haftalik-coklu-pkg.cjs`. Düğme dosyasız grupta da; günün ve "Stok ve programlar"ın
    ekleme çubuğunda "PKG ekle" (`data-gun-pkg-ekle`, plan ekranı ve belge; formda dosya
    seçilir); kalem formunda Strap yazılınca metin "varsa" (kullanıcı: gün gün planda
    başlığın altına metinsiz başka paket ekleyemiyordu, düğme yalnız dolu dosya grubundaydı).
    Test `testler/haftalik-gun-pkg.cjs`.
  - Gün gündemi Next Day'in başlık altıyla eş (kullanıcı: Weekly'nin tasarımı kalsın, özellik ve
    yetenekler birebir aynı olsun): kalemde saat (metnin sonunda kalın "12G"), Schedule, Teams
    (`nextday/Formlar.tsx → TeamsAlani`, `ScheduleAlani`, iki form ortak), kaynak ve muhabirin o günkü
    yeri (`HaftalikKalem.saat`, `program`, `teams`, `kaynakTuru`/`kaynakAdi`, `muhabirYerleri`; formda
    muhabir çipinde yer, öbürleri "Diğer ayrıntılar"da; düzeltmede verilmeyen alan kalır). Günün
    dosyası Next Day başlığı gibi (`haftalik/Dosya.tsx`): başlığın muhabirleri yer ve muhabire notla,
    TBC, LIVE (`HaftalikPlan.dosyaBilgileri`, `HaftaDosyasi`, gün + dosya başına; `eylemler.ts →
    haftaDosyasiDegistir`, `haftaDosyaMuhabiri`; dosyanın kalemi Next Day'e geçtiyse kilitli); dosya
    araçları (`DosyaAraclari`; plan ekranında dosya adının yanında, belgede şeritte): bu dosyaya gelen
    öneriler, öneri ve takiplerden al (seçilen öneri o gün ve dosyayla "Gündeme ekle"), muhabir,
    canlı ve nafize (dosya seçili), son gelişmeler (kalem olarak, kaynak medya), başka dosyaya kat
    (`haftaDosyaKat`: kalemler, canlı ve nafizeler, muhabirler; geçmiş kayıt kalır); dosyanın altında
    hızlı ekleme satırı (`HizliKalem`: "YER / metin" + Enter, "/" menüsü). Kalemsiz ama bilgisi olan
    dosya da görünür. Kesinleşince (`haftaliktanAktar`) dosyanın muhabirleri, TBC ve LIVE başlığa,
    kalemin muhabiri yeriyle başlığa, saat, Schedule, Teams ve kaynak gelişmeye geçer. Test
    `testler/haftalik-esit.cjs`.
  - Günün canlı yayını ve nafizesi (kullanıcı: haftadan gün gündemine canlı yayın ve nafize
    eklensin; `haftalik/CanliNafize.tsx`, `HaftalikPlan.canlilar`/`nafizeler`, `HaftaCanli`,
    `HaftaNafize`): günün "Kalem ekle"sinin yanında "Canlı yayın / etkinlik ekle" (konu, yer, saat
    GMT, muhabir, isteğe bağlı dosya) ve "Nafize ekle" (Next Day'in formu `nextday/Nafize.tsx →
    NafizeFormu`, başlık yerine haftanın dosyası, "+ Yeni dosya"; birkaç saat tek formda). Karar
    kalemi değil; plan ekranında, belgede ve çıktıda günün altında "مباشر" ("YER / konu / **saatG**",
    TBC) ve "نافذة/نوافذ" (satırın sonunda dosyası). Eylemler `eylemler.ts → haftaCanliKaydet`,
    `haftaNafizeleriEkle`, `haftaNafizeKaydet`, `haftaCanliNafizeSil` (haftalık düzenleyen).
    Hafta kesinleşince, kesinleşmiş haftaya eklenince, yarının planı açılınca ve sistemin açılış
    işinde o günün Next Day planına geçer (`haftaCanliNafizeAktar`; kimlik plandan ve kayıttan):
    canlı "مباشر"a, dosyası varsa başlığın LIVE'ına; nafize dosyanın başlığının altına (başlık
    planda yoksa açılır). Geçen kayıt haftada `aktarim`'lı, kilitli. Test
    `testler/haftalik-canli-nafize.cjs`.
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
  - Haftalık çağrı e-postasından gelen öneri `Oneri.hafta` taşır, Next Day
    ekranlarına karışmaz; günü olan öneri haftasıyla kesişen haftalık plana da
    düşer (yukarıda, öneri etiketleri). "Bu haftaya gelen öneriler"deki "Öneri
    ekle"de (`OneriFormu.tsx → ElleOneriFormu hafta`) gün sorulur (kullanıcı:
    önerinin hangi günün olduğu belli olmuyordu): haftanın yedi günü ve
    "Zamana bağlı değil", seçilmeden kaydedilmez, istenirse bitiş günü.
    Seçilen gün `hedefTarih`/`bitisTarih` olur (hafta günden), "Gündeme ekle"
    o günle açılır; "Zamana bağlı değil" eskisi gibi yalnız `hafta`. Kartın
    bilgi satırında günsüz haftalık öneride `haftaGunu` ya da "Zamana bağlı
    değil" (`useKisaGun`). Test `testler/haftalik-oneri-gun.cjs`.
  - Toplantıda karar düğmelerinin yanında "Not / ek talep" (`Kalem.tsx →
    KararNotuFormu`, `eylemler.ts → kalemKararNotu`, yetki `kararNotuYazabilir`;
    kalem formunda da, belgede "Düzenle" penceresinden): `HaftalikKalem.kararNotu`
    ve `ekTalep`, çıktıdaki sarı nottan ayrı, kurumun çıktısına girmez (belgede
    yalnız düzenlerken). Kesinleşince pakete geçer (`toplantidan`), muhabire
    "paketOnaylandi" bildirimi gider (paket doğduğu an: kesinleşmede ya da
    günlük plan açılınca). Ret notu öneriye gerekçe olur.
  - Kararlar (kullanıcı; `veri.ts → KARARLAR`, `haftalik.ts → isDogurur`,
    `paketDogurur`): Kabul, Şartlı kabul (aşağıda), "Paketsiz takip" (`bilgi`;
    önce "Bilgi (takip yok)", çıktıda "لا نتابع"): günü olan haber Next Day'e
    yalnız gelişme olarak geçer, paket doğmaz, kalemin strap ve PKG satırı
    yazılmaz (`kalemPaketli`); "Next Day'de karar ver" (`nextday`, 5. tuş): paket
    Next Day'e "değerlendiriliyor" olarak, PKG PROPOSAL alt başlığıyla geçer;
    görevlendiren yazılmaz, muhabire bildirim gitmez, kabul, ret ya da paketsiz
    bırakmak o günün planında (plan onayı kararsız paketi kabul sayar); günü
    olmayan kalemde plansız paket "Karar bekleyen"de. "Plandan kaldır" (`ret`,
    önce "Ret"): kesinleşince kalem gelişmesi ve paket önerisiyle plandan çıkar,
    öneri reddedilir. Test `testler/haftalik-karar.cjs`.
  - Şartlı kabul (kullanıcı: toplantıda paket bazen o an onaylanmıyor,
    "duruma göre onaylayalım" deniyor; karar `sartli`, `HaftalikKalem.kosul`,
    `haftalik.ts → kabulMu`): kalem kartında ve belgede "Şartlı kabul" koşul
    formunu açar (`Kalem.tsx → KosulFormu`), koşulsuz verilmez (eylem de
    sorar). Kesinleşince iş kabul gibi doğar ama paket taslakta ve koşullu
    (`Paket.kosul`; `eylemler.ts → kalemPaketDurumu`): günü belli haber Next
    Day'e "PKG PROPOSAL" olarak geçer, gerisi plansız taslak; görevlendiren
    künyeye yazılmaz, muhabire ön bilgi (`paketSartliKabul`, koşul notta;
    paket sayfasında koşul satırı). Next Day onayı şartlı paketi kabul saymaz
    (`planDurum`, onay sorusunun sayısı da). Kararı Planlama verir: Paketler ve
    Stok'ta "Şartlı kabul bekleyenler" (`PaketGorevi.tsx → SartliPaketler`,
    `sartliBekleyen`; Kabul et `paketDurum`, Reddet `paketReddet`), paket
    sayfasında ve Next Day'in PKG satırında da. Koşul karar verilene dek
    paketin not ekinde (`paketNotEki`: "مشروط: …"), Weekly çıktısında sarı
    notta "(مشروط) …". Test `testler/sartli-kabul.cjs`.
  - Toplantı görünümü (`haftalik/Toplanti.tsx`, `#/haftalik/:id/toplanti`;
    kullanıcı: toplantıda anlık not alıp paketleri onaylayacağı, sonra gözden
    geçirip son hali vereceği arayüz): toplantıdaki planın "Sıradaki"
    kartında ve ⋯'de "Toplantı görünümü" (karar verebilen ya da notları
    gören). Ortada planın tam metni (kullanıcı: yalnız karar bekleyen liste
    yetmedi, toplantı ana dosyalar dahil bütün metinden takip edilsin):
    `HaftalikBelgesi toplanti` (hareketler, ana dosyalar, günler, dosyalar,
    zamana bağlı olmayanlar; reddedilen de görünür, karar geri alınsın);
    kalem tıklanınca seçilir (`ToplantiSecimi` bağlamı, `data-toplanti-kalem`,
    `.toplanti-kalem.secili`), altında karar rozeti ve notları. Sağda yapışkan
    sütunda seçili kalemin kartı (`KalemKarti kisayol`: karar, şartlı kabulün
    koşulu, karar notu ve ek talep, plan ekranınınkiyle aynı) ve genel notlar;
    1100 pikselden darda kalem dokununca kart pencerede. Klavye (yazı alanı ve
    açık pencere dışında): ↑/↓ (j/k) belgedeki sırayla kalem, 1 kabul, 2
    şartlı (koşul formu), 3 paketsiz takip, 4 plandan kaldır, 5 Next Day'de karar ver, 0 kararı kaldırır, N karar notu;
    karar verince sonraki kaleme geçer. Üstte ilerleme ("n/m"), Hepsi / Karar
    bekleyen (`useAdimDurumu`; belge yerinde kalır, kararı verilmiş kalem soluk
    ve gezinmede atlanır), "Planı kesinleştir" gözden geçirme penceresini
    açar. Test `testler/toplanti.cjs`.
  - Toplantı notları (kaleme bağlı olmayan, o an alınan not; kullanıcı:
    Planlama ve yöneticiler görsün, muhabir görmesin): ayrı kayıtta
    (`Durum.toplantiNotlari`, `ToplantiNotu`, koleksiyon `toplantiNotlari`;
    kısıtlı kişi dinlemiyor, kural okutmuyor), `eylemler.ts →
    toplantiNotuEkle`, `toplantiNotuSil` (yazan, Planlama yöneticisi, tam
    yönetici). Görür ve yazar `yetki.ts → toplantiNotuGorur`: tam yönetici,
    Planlama, kademe, rolü yönetici olan. `AnmaGirdisi` (Ctrl/⌘+Enter
    ekler, `bahset`). Toplantı görünümünde ve plan ekranında "Toplantı
    notları" bölümü; gözden geçirmenin tutanağının sonunda. Kayıt
    temizliğinde haftalık planla gider. Notlar kesinleşmeden sonra da
    düzenlenir (kullanıcı: toplantı görünümünde kalsın, çıktıda görünmesin):
    kalemin karar notu ve ek talebi (`yetki.ts → kararNotuYazabilir`,
    kesinleşmişte haftalık düzenleyen ya da karar yetkilisi; karar düğmeleri
    yok), genel not kalemle (`eylemler.ts → toplantiNotuDuzenle`, silmenin
    yetkisi). Sonraki düzeltme doğmuş pakete gitmez; çıktılara hiç girmez.
    Test `testler/toplanti-notu-sonra.cjs`.
  - Kesinleştirme gözden geçirme penceresinden (`haftalik/GozdenGecirme.tsx`;
    kullanıcı: toplantıdan sonra gözden geçirip plana son hali verilsin; önce
    iki ardışık onay sorusuydu, kararlar görünmüyordu): kalemler kararlarına
    göre gruplu, notları ve koşuluyla; karar burada da değişir (yeni şartlı
    kabul kalemin kartından); özet satırı (`kesinlesmeOzeti`: Next Day'e
    geçecek haber, açılacak paket, şartlı, reddedilecek öneri); "Tutanağı
    kopyala" düz metin; gündeme alınmamış açık haftalık öneri varsa işaretli
    kutu, kaldırılırsa açık kalır (`haftalikKesinlestir(…, acikReddet)`);
    "Planı kesinleştir" en altta. Kesinleşince toplantıda reddedilen kalem
    plandan çıkar (kullanıcı: ret kalemi kesinleşen planda durmasın;
    `haftalikKesinlestir`, özette "n reddedilen plandan çıkacak"); öneriden
    geldiyse öneri reddedilir, karar notu gerekçesi olur. Önceden kesinleşmiş
    haftalarda kalanları sistemin açılış işi siler (`kesinlesmisRetleriCikar`).
    Test `testler/ret-cikar.cjs`. "Kalanları kabul et" ön
    incelemedeki kalemi almaz (`topluKabulAdaylari`), onay sorar. Next Day'de
    toplantıya götürme ve onay da sorar; onay kararsız paket sayısını ve görev
    gidecek muhabiri yazar. Özel yayının onayı birlikte onaylanacak nafize ve
    paket önerisi sayısını yazar.
  - Kesinleşmiş hafta da güncellenir (kullanıcı: haftalık program
    güncellenebilmeli, toplantı bir durak; orada onaylananlar onaylanır,
    sonradan eklenenler sonradan): `yetki.ts → haftalikDuzenler` duruma
    bakmaz, `kararVerebilir` kesinleşmişte de. Sonradan eklenen kalem karar
    bekler ("Sıradaki" kartında "Sonradan eklenen n kalem karar bekliyor",
    `data-sonradan-bekleyen`; çıktıya girmez); karar kesinleşmenin o kaleme
    yaptığını hemen yapar (`eylemler.ts → sonradanKarar`: kabul günü olan
    haberi günün açık Next Day planına geçirir, plan yoksa açılınca çekilir;
    öbürünün paketini açar; ret kalemi çıkarır, öneriyi reddeder). Next Day'e
    ya da pakete geçmiş kalem kilitli (`haftalik.ts → kalemKilitli`:
    düzenleme, silme, karar; değişikliği oraya gitmezdi). "Kalanları kabul
    et" yalnız toplantıda. Test `testler/haftalik-sonradan.cjs`.
  - Ön inceleme yalnız günü olmayan (stok) kalemde; inceleyen
    `yetki.ts → onIncelemeci` (kolu kapsamındaki müdür, ekonomide Ekonomi
    birimi). Görüş ya da gerekçeli ret; kabul kararı toplantıda.
  - Kesinleşince kabul edilen haber Next Day'e onaylı paket olarak geçer
    (`haftalikKalemId`, "Haftalık plandan" rozeti); feature, ekonomi ve
    program plansız onaylı paket olur (teslim günü kalemin teslim günü ya da günü;
    yukarıda, Stok sayfası › Teslim günü). Paketin başlığı strap
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
    PKG "Plandan kaldır"la iptal edilir, gelişme kalır (aşağıda, paketi plandan
    kaldırmanın tek kuralı); öneri "Plandan çıkar"la bütünüyle çıkar, kesinleşmiş haftanın kalemi kayıt olarak kalır
    (`aktarim` durur, yeniden aktarılmaz), öneri yeniden Next Day'e eklenebilir.
  - Çıktı kurumun "الأجندة الأسبوعية" belgesini izler; yazdır/PDF ve Word
    (HTML tabanlı `.doc`). E-postayı planlamacı kendisi gönderir.
    Kesinleşen planın çıktısında yalnız kabul ve bilgi; kesinleşmeden
    önizleme karar bekleyenleri de basar (yoksa hazırlıktaki iş görünmüyordu).
    Kalem: "YER / metin", olayın adı yazılmışsa "YER - OLAY / metin";
    sonra muhabirler, biçim, not. Muhabirler Next Day'deki gibi
    (kullanıcı: ikinci muhabir paket satırının yanına yazılıyordu): pakette
    tek muhabir "YER / strap / ad"; birden çoksa paket satırı "YER / strap",
    altında unvan (`etiketler.ts → muhabirUnvani`: المراسل, المراسلة,
    المراسلون) ve her muhabir kendi satırında "YER / ad"; paketsiz kalemde de
    unvan ve "YER / ad" (önce "ad / YER"di). Plan ekranının kalemi de aynı
    (`Kalem.tsx`). Test `testler/haftalik-muhabir.cjs`. Masaya önerilen kalemin üstünde
    o birimin Arapça adı kalın alt başlıkla (kullanıcı; `bilesenler/Haftalik.tsx →
    kalemMasalari`, `kalemMasaEtiketi`: kalemin kolu Ekonomi/Program/Spor ise kolun
    sahibi, önerisi bir masaya sorulup "Uygundur" dendiyse o masa; belge, çıktı ve
    plan ekranı). Paketli kalemin alt başlığı kabul edilmişse "PKG", değilse
    (bekleyen, şartlı, bilgi) "PKG PROPOSAL" (`kalemPkgEtiketi`, Next Day'deki
    gibi). Test `testler/haftalik-etiket.cjs`. Dosyasız kalemler bölümün (günün, zamana
    bağlı olmayanların) en altında yeşil, kalın "متابعات" başlığıyla
    (`HaftalikBelge.tsx → Dosyalar`). Belgede boş alan
    (yer, konu, not) satır kaplamaz; "Düzenle" penceresinden girilir.
- Aylık plan (`ekranlar/aylik/Aylik.tsx`, kurallar `aylik.ts`, eylemler
  `eylemler.ts → aylik*`): kurumun "الخطة الشهرية المتوقعة" şablonu. Takvimden
  ayrı (takvim not gibi), kesin plan ama bağlayıcı değil; Next Day'le bağı yok.
  - Hiyerarşi şablondan: ay planı → bölüm → olay → kapsam günü → satır
    (PKG / LIVE / WALK & TALK…). Bölümler: 1. ana kapsamlar (ayrı kayıt değil,
    `anaKapsam` işaretli olay; özet cümlesiyle), 2. öne çıkan olaylar ve
    etkinlikler (gün gün; olay ya da uluslararası gün, `AylikOlay.tur`), 3.
    görevlendirmeler (olayın `gorev`'inden türer; kurumda iç/dış ayrımı yok).
  - "Plan" görünümü çalışma ekranı: üç numaralı bölüm, her birinin kendi "Ekle"
    düğmesi (türü eklendiği yer belirler), satıra basınca olayın tek düzenleme
    penceresi. Pencere şablonun başlıklarıyla alt alta: künye (kategori kodları
    dahil), önemi, önerilen kapsam (kapsam süresi `kapsamBas`/`kapsamBit`, gün gün
    satırlar), ekip, görevlendirme, bağlantı ve not; boş isteğe bağlı bölüm "+"
    düğmesiyle açılır. Bağlantı birden çok (`AylikOlay.baglantilar`, "+ Bağlantı
    ekle"; ilk sürümün tek `baglanti`'sı `aylik.ts → olayBaglantilari` ile okunur,
    kaydedince listeye geçer); çıktıda "الرابط :" satırının altında her biri
    ayrı satırda (kullanıcı: başlığın yanında değil), sola yaslı (Latin
    harfli adres; `dir="ltr"`, Word'de de). Adım adım form denendi, ciddi plan gibi durmadı.
  - "Çıktı" görünümü şablonun kağıdı, her arayüz dilinde Arapça: gri bant
    başlık ve kırmızı kategori kodu, sarı tarih kutusu, "**" önem, التغطية
    المقترحة / مدة التغطية, الفريق المعتمد للتغطية, ayraç; sonda görevlendirme
    tablosu. Kopyala, Word, yazdır.
  - Onay Plan yetkilerinde (`ayOnay`, varsayılan Planlama yöneticisi); onaylı
    plan düzenlenmez, "Hazırlığa al" açar. Üst kısım `PlanBasiKalibi`: ‹ "Aylık ·
    ay" ›, "Sıradaki" kartında Hazırlanıyor/Onaylandı ve onay düğmesi
    (`data-ay-onayla`, `data-ay-geri-al`), altında Plan/Çıktı ve belge araçları.
  - Weekly'de "Aylık plandan" bölümü (`haftayaDusenler`): haftayla kesişen
    olaylar, "Gündeme ekle" karar bekleyen kalem açar (`aylikOlayiGundemeEkle`,
    `HaftalikKalem.aylikOlayId`); toplantıda yeniden değerlendirilir.
  - "SPECIAL COVERAGE" etiketli olay Özel yayın sayfasında öneri
    (`ozelOnerileri`); "Özel yayın olarak aç" yayını açar (`aylikOlaydanOzel`),
    yayın kendi onayına (`ozOnay`) tabi.
- Next Day çıktısında baskı tasarımları (kullanıcı kurumun çıktısının görselinden
  memnun değil; `nextday/Cikti.tsx`, `NextDayBelgesi baski`, CSS `.cikti.baski-1…4`):
  "Kurum" (eski düzen) · 1 klasik (ölçülü aralık, numaralı başlık, alt başlık
  altındakinden ayrılmaz) · 2 manşetli iki sütun (sağda ekip, hareketler, canlı,
  hazır; solda beklenen ve başlıklar; متابعات sonda tam genişlikte; `Manset`) ·
  3 gazete akışı (künye bandı, canlı yayın zaman çizgisi, başlıklar iki sütunda) ·
  4 künye bandı ve üç sütun (sayfa sütunlara bölününce ilk bakılan ekip, hareketler
  ve canlı en üstte üç kutuda; başlıklar üç sütunda akar). Plan ekranındaki
  "Çıktı" önizleme penceresi açar (`CiktiOnizleme`: küçültülmüş kağıt, üstte
  seçim; "Yazdır" tam sayfaya gidip baskıyı açar, `trt-planlama-hemen-yazdir`).
  Seçim tarayıcıda (`trt-planlama-baski`). Ekranda ve baskıda aynı; `@page`
  kenarı seçilince eklenen `<style>`da. Sütunlu akışta başlık bölünebilir, başlık
  satırı gövdesinden ayrılmaz; ızgara içinde sütun kullanılmaz (Chrome sayfaya
  bölmüyor). Word ve "metni kopyala" her zaman kurumun düz kopyasından
  (`.word-kaynagi`, gizli). Bölümler `data-bolum` (ekip, hareket, canlı) ile seçilir.
  Baskılarda kurumun logosu TRT عربي (`varliklar/trt-arabi.svg`, manşette
  `trt-arabi-beyaz.svg`); kurum düzeninde ve Word'de yok. Test `testler/baski.cjs`.
  Weekly de aynı seçeneklerle (kullanıcı: Next Day'in çıktı seçenekleri
  Weekly'de de olsun): seçim, önizleme penceresi ("Tam sayfa" ve "Yazdır"
  pencereyi kapatmadan gider: kapanan pencere geçmiş adımını geri alıp gidişi
  iptal ediyordu, `baski.cjs` bu yüzden kırıktı), `@page` ve hemen yazdır
  ortak parçada (`belge/Baski.tsx`: `BaskiSecimi`, `useBaski`, `BaskiOnizleme`,
  `useHemenYazdir`; seçim iki planda aynı), Weekly'nin ⋯ › "Çıktı önizleme"
  pencere açar (`haftalik/Cikti.tsx → HaftalikCiktiOnizleme`).
  `HaftalikBelgesi baski` (`.cikti.hf.baski-N`): 2'de manşet (`HaftaManset`:
  haftanın günleri, dosya, PKG, LIVE sayısı) ve iki sütun (sağda hareketler
  ve zamana bağlı olmayanlar); numara yalnız ana dosyalarda (`data-bolum="ana"`); 3 ve 4'te günler sütunlara akar; hareketler `data-bolum`.
  Test `testler/haftalik-baski.cjs`.
- Belge görünümü (`ekranlar/belge/`, `#/nextday/:id/belge`,
  `#/haftalik/:id/belge`): plan çıktı belgesinin üzerinde düzenleniyor;
  girişi çıktı önizlemesinde ve plan başlığında "Belgede düzenle".
  - Belge bileşeni tek (`NextDayBelgesi`, `HaftalikBelgesi`): `duzen`
    verilmezse çıktı, verilirse aynı kağıt düzenlenebilir. Çıktı sayfaları
    da bunu çağırır; belge ile çıktı ayrışmaz. Bileşenin içinde bileşen
    tanımlanmaz, yoksa yazı kutusu her kayıtta sıfırlanır.
  - Belge ile plan ekranının işlemleri aynı (kullanıcı: eşitlensin). Satırın
    işi iki yerde ayrı yazılmaz, ortak bileşenden (`nextday/SatirIslemleri.tsx`):
    PKG kararı (değerlendirmeye al, kabul, ret, iptal: `PaketKararDugmeleri`),
    öneriye bağlama (`PaketOneriBagi`), canlının yapıldı/yapılmadı
    (`CanliSonucDugmeleri`), başlığa gelen öneriler (`BaslikOnerileri`; belgede
    şeritte sayılı simge), başka başlığa katma, son gelişmeler, başlığın adı
    (pencereleri). Belgede ayrıca onaylı paketin metni ("Düzenle" →
    `PaketMetniFormu`), başlığa canlı ekleme ve "Öneri ve takiplerden al"
    (ekleme çubuğunda), canlıda "bugün de geçerli", belge sayfasında hızlı ekleme
    satırı; klasikte başlığın adı (+ menüsü), gelişmede ✨, muhabirde "bugün de
    geçerli". Weekly'de belgenin kalemi kartın kurallarıyla: seçili karara
    basmak kararı kaldırır, ön incelemeye gönder, karar notu ve ek talep (kilitli
    kalemde de, `kalemGirdisi` ortak), görüşler ve teslim günü düzenlerken;
    klasikte kalem ve ana dosyada ✨. Yeni işlem iki yüzeye birden girer. Test
    `testler/belge-esit.cjs`.
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
  - "E-posta için kopyala" (`CiktiAraclari`; Next Day, Weekly, Özel yayın):
    panoya Word'ün biçimi satır içi stil olarak yazılmış HTML ve düz metin
    birlikte (`indir.ts → epostaHtml`, `zenginKopyala`; Clipboard API, olmazsa
    seçip kopyalama). E-posta istemcisi stil dosyasını almıyor; düz metin
    kopyası ve sayfadan seçme biçimi bozuyordu, Word'e indirip oradan
    kopyalanıyordu. Biçimin tek kaynağı Word'ünki (`WORD_BICIMI`; önce elle tutulan
    ikinci liste `EPOSTA_STILI` vardı): belge o biçimle görünmez çerçevede çizilir,
    her öğenin hesaplanmış biçimi kendi style'ına yazılır; yazı tipi ve punto her
    paragrafta, başlıklar aynı biçimle paragrafa, `bdi`/`mark` span'e (kullanıcı:
    yapıştırınca boyut ve biçim değişiyordu: biçim yalnız dış kutudaydı, Outlook
    paragraflara kendi varsayılanını, başlıklara mavi "Başlık" stilini veriyordu).
    Planı gönder de bu HTML'le gider. Test `testler/kopya.cjs`.
  - Aralık kurumun kuralı: aynı başlığın altındaki satırlar 1,15; başlıklar
    ve bölümler arasında tek boş satır (kullanıcı: satır aralığını artırarak
    değil, birer boş satırla; önce 1,30 satırdı). Word dosyasında ve e-posta
    kopyasında başlığın (h2, h3, h4) önüne gerçek boş paragraf girer, başlığın
    üst boşluğu yok (`indir.ts → bosSatirlaAyir`; belgenin ilk satırında
    değil); ekranda ve baskıda bir gövde satırı (`--cikti-bos`, 14,5px ×
    1,15). Satırlar arasına başka boşluk girmez. Test `testler/bos-satir.cjs`.
- Stok haberi ayrı kayıt değil, `Paket` (`stok: true`): haftalıkta kabul
  edilen plansız feature ya da günü olmayan haber, Next Day'de "stok" diye
  işaretlenen paket ve özel yayının dosya paketi (`ozelId`; kullanıcı:
  önceden hazırlanıp yayın günü stoktan veriliyor). Ekonomi, program ve
  spor stoka düşmez, masasına (aşağıda). Durumu saklanmaz, kayıttan çıkar
  (`akis.ts → stokDurumu`): üretime alınacak → üretimde → stokta
  (Stok sayfasının Stokta kutusu) → yayınlandı. Özel yayın
  paketi kendi görevlendirmesiyle ilerler (onaylıysa "üretimde"), yayının
  "yayına hazır" aşaması işaretlenince stoktaki dosya paketleri o yayınla
  yayınlandı (`Paket.yayinlandi.ozelId`; aşama geri alınınca stoka döner;
  `eylemler.ts → ozelAsamaIsaretle`). Stok sayfasının başında özel yayın
  paketleri (`OzelYayin.tsx → OzelTalepAlani`): in-house paketi Planlama'nın
  stok ekibi (ya da Planlama yöneticisi, tam yönetici) hazırlayana verir
  (`yetki.ts → ozelPaketDagitabilir`; kullanıcı: özel yayın paketlerini stok
  ekibi takip etsin; önce Output'un yöneticisiydi, `ouOzel` Output'un
  varsayılanından kalktı).
  Sayfanın adı "Stok haberler / Programlar" (kullanıcı: Weekly'nin günsüz bölümü
  "Stok ve programlar" oldu, feature ve program önerileri düzenlenip oraya giriyor,
  toplantıda aynı kararlarla değerlendiriliyor). Gün seçimlerindeki günsüz seçenek
  (kalem formu, "Gündeme ekle") ve kalemin gün etiketi de bu adla (`stokVeProgramlar`;
  kullanıcı: eski "Zamana bağlı olmayan dosya" adı kalmıştı). Programlar masasının kalıbıyla
  (kullanıcı: tıklanınca altında açılan kutucuklar; orada çalışan bir yandan gelecek
  haftanın tekliflerini topluyor, bir yandan daha önce planladığının üretimini
  izliyor, bir yandan stoktaki paketleri kontrol edip planlara ekliyor; sıralama
  tarih ya da muhabir; `ekranlar/StokSayfasi.tsx`, kurallar `stokSayfasi.ts`; önce
  "Haber merkezi / Programlar" seçimi ve sekmeli tablolardı). Beş kutucuk bağlantı
  (`#/stok/<bölüm>`, `data-stok-kutu`; geri tuşu bölümler arasında, menü vurgusu
  kalır), Planlama'nın renginde (`.prg-masa.masa-planlama`); telefonda üç sütun,
  alt yazısız (alt çubukta bölümleri yok). Varsayılan Üretim.
  - Teklifler: tekliflerin haftası `teklifHaftasi` (Perşembe toplantısının gelecek
    haftası, `planlananHafta`; kesinleştiyse bir sonraki), ‹ › ile değişir. Haftaya
    düşen, karar bekleyen teklifler (`haftaTeklifleri`: `oneriHaftada` ve Öneriler'in
    "Karar bekleyen" kuralı `oneriSekmesi`); kapsam "Stok ve programlar"
    (`stokTeklifiMi`: masası haber olmayan ya da günü olmayan) / "Bütün teklifler"
    (`data-stok-kapsam`). Kartlar plan ekranlarının öneri listesi (`OneriListesi
    gruplar`, tek pencere); "Gündeme ekle" Weekly'nin formu (`GundemeEkle stok`: stok
    teklifinde gün boş gelir, teklif "Stok ve programlar"a düşer; günlü haberde
    kendi günü; "Stok ve programlar"a giren paket önerisinde teslim günü). Günü
    olmayan teklifin grubu "Stok ve programlar" (Weekly'de düşeceği yer). Haftanın
    Weekly'si yoksa "Yeni haftalık plan" (`haftalikOlustur`). Altta haftanın "Stok ve
    programlar" kalemleri ("Weekly gündeminde", `haftaStokKalemleri`, kararı ve teslim
    günüyle).
  - Üretim: üretime alınacak ve üretimde (`uretimAlani`, `akis.ts → stokDurumu`);
    kartta tür, yer, aşama · kimde, muhabire ulaşma, "Üretime al" ve teslim günü
    satırı (aşağıda). Başta şartlı kabul bekleyenler ve özel yayın paket talepleri
    (`OzelTalepAlani bosGizle`). Kutucuğun sayısı kişinin işi: üretime alacağı ve
    teslim gününü belirleyeceği paketler.
  - Teslim günü (kullanıcı: stok ve feature zamana bağlı olmayabilir ama teslim
    süresi mutlaka belirlenir, takip ona göre; önce günsüz paket "Zamana bağlı
    değil" grubundaydı): paketin `sonTarih`'i (plansız görevde görevin günü, özel
    yayında son tarih de o). Weekly'de "Stok ve programlar"daki paket önerisi
    (`haftalik.ts → teslimGunuSorulur`) kalem formunda ve "Gündeme ekle"de teslim
    günü alır (`HaftalikKalem.teslimGunu`; kalem bir güne geçince düşer), kalem
    kartında, gözden geçirmede ve "Weekly gündeminde"de görünür; kabul edilip günü
    verilmemişse "Teslim günü belirlenmedi" uyarısı (`bilesenler/Haftalik.tsx →
    KalemTeslimGunu`). Kesinleşince paketin `sonTarih`'i olur (`haftaliktanPaket`;
    günü olan feature, ekonomi… kaleminde kalemin günü). Süren paketin günü
    `bitmisPaket.ts → surenPaketGunu` (`sonTarih`, planın günü, saatli teslimin günü;
    sıra `paketGunu`'nunki; yoksa yok): Stok sayfasında günsüz paket başta, uyarı
    renginde "Teslim günü belirlenmedi" grubunda (`grupla bosOnce`; Üretim ve
    Programlar), kartta
    `bilesenler/TeslimGunu.tsx → TeslimSatiri`: gün ve "n gün kaldı / Bugün teslim /
    n gün gecikti" (bir gün kala turuncu, geçince kırmızı), yoksa uyarı rozeti;
    yetkiliye "Teslim günü belirle" ya da ✎, pencerede gün (bugünden önce değil).
    Eylem `eylemler.ts → paketTeslimGunu` (yetki `yetki.ts → teslimGunuBelirleyebilir`:
    ileri tarihe görev verebilen [Planlama, tam yönetici]; plansız, süren, özel
    yayın değil; saatli teslimin saati kalır, günü değişir), hareket `paketTeslimGunu`
    (muhabire `kime`, masa paketinde masaya `sahip`; önceki gün `kaynak`'ta, metni
    "… yerine … yaptı"). Paket sayfasının başında da (`.paket-teslim`; görevde günü
    görev künyesinde). Muhabirin Yapılacaklar'ı ve ana panonun "geciken"i aynı
    günden: günsüz iş gecikmiş sayılmaz. Örnek veride plansız paketlerin teslim günü
    var, Bağdat'taki sahaf paketi bilerek günsüz (`PaketTanimi.sonGun`). Test
    `testler/teslim-gunu.cjs`.
  - Stokta: plana alınmamış / plana alınan (`stoktaAlani`, `stokPlani`: hazır
    paketlerinde durduğu Next Day planı; yayına çıkınca arşive). Kartta "n gündür
    stokta" (`stoktaGun`, `STOK_BAYAT_GUN` 14'ten sonra uyarı rengi). "Plana ekle"
    penceresi açık Next Day planlarını listeler (`eklenebilirPlanlar`: bugün ve
    sonrası, içeriği düzenlenebilen), seçilen planın hazır paketlerine
    (`hazirPaketEkle`, planın "Stoktan seç"iyle aynı eylem); plandakinde planın
    çipi ve × (`hazirPaketCikar`).
  - Programlar: masaların (Programlar, Ekonomi, Spor) paketleri, masa sayfasının
    İçerikler'iyle aynı alanlar, kural ve kart (`masaIcerikleri`,
    `icerikDurumAlani`, `ProgramMasasi.tsx → IcerikKarti`), takibi masada; başta
    masaların görev talepleri (`GorevTalepleri`).
  - Arşiv: yayınlanan ve yapılmayan stok paketleri (`stokArsivAlani`), ay ay,
    aranır, 40'ar.
  - Sıra (`data-stok-sira`): tarihe göre (teklifler gün gün, paketler hafta hafta:
    "Bu hafta", "Gelecek hafta", "Geçen hafta" ve aralık; arşiv ay ay; ileriye bakan
    listede yakından uzağa, stok ve arşivde yeniden eskiye) ya da muhabire göre
    (`grupla`; muhabirsiz sonda). Muhabire göre gruplar gazete sütunu gibi yan yana
    akar (`.stok-kolonlu`; grupların çoğu bir-iki kart, alt alta sayfa çok uzuyordu).
    Seçim tarayıcıda (`trt-planlama-stok-sira`): kutucuklar arasında sıfırlanmasın.
  Test `testler/stok-sayfasi.cjs`. Weekly'nin "Kabul edilen paketler" penceresi iki
  sekme: Günlük ve Stok ve programlar (günsüz kalemler; `data-takdir-sekme`). Test
  `testler/stok-programlar.cjs`.
- Plansız paket görevi (kullanıcı: planlamacı muhabire bir plana eklemeden
  paket görevi verebilsin; `bilesenler/PaketGorevi.tsx`, eylemler
  `eylemler.ts → paketGorevVer`, `gorevTalebiGonder`, `gorevTalebiKarar`,
  `gorevTalebiGeriCek`). "Görevlendir" düğmesi Paketler (Ekonomi ve Programlar
  da), Stok ve muhabirin profilinde (`GorevlendirDugmesi`): muhabir, gün,
  haber türü, Strap, açıklama, not. Yetki `yetki.ts → paketGorevVerebilir`
  (izin `paketGorevVer`: Planlama, Newsdesk; tam yönetici); Newsdesk yalnız o
  güne, Planlama ileri tarihe de (`ileriGorevVerebilir`, `gorevTarihiUygun`).
  Paket `stok`, onaylı, plansız, `Paket.gorev` (veren), gün `sonTarih`;
  muhabire `paketGorevVerildi`. Stokta "üretimde" (`stokDurumu`), "Üretime
  al" yok, sahibi muhabir (`paketSahibi`); muhabir "Yapıldı / Yapılmadı"yla
  kapatır, Newsdesk sistemdeyken de (`paketTamamlayabilir`, `sadeAkis`);
  onaylanınca stokta, Next Day "Hazır paketler"den seçilir. Masa kolundan
  olsa da masa akışına girmez (`masaPaketi`).
  - Görev talebi (eski; masa artık öneri gönderiyor, aşağıda Masaların sayfası;
    kayıttaki talepler aynı kurallarla sürer): Ekonomi, Program, Spor (izin `gorevTalebi`,
    `gorevTalebiVerebilir`) aynı formla "Görev talebi"; paket taslak,
    `Paket.gorevTalebi` (talep eden, birimi), kol talep edenin masası.
    Planlama'ya `gorevTalebiGeldi`. Yalnız Planlama (ve tam yönetici) karar
    verir (`gorevTalebiKarariVerebilir`): "Göreve çevir" (günü değişebilir)
    ya da gerekçeyle "Reddet" (iptal, `gorevTalebi.red`, talep edene
    `gorevTalebiReddedildi`); talep eden kararsızken geri çeker. "Görev
    talepleri" kartı (`GorevTalepleri`) Stok'ta ve Paketler'de: Planlama'ya
    bekleyenler, talep edene kendi bekleyenleri ve bir haftada reddedilenler.
  - Onaya dek muhabir talebi görmez: `paketGorebilir`, gerçek kipte erişim
    listesinde de (`depo/fark.ts → erisimListesi`, `talepte`; talebin
    hareketi de). Paket sayfasında künye (`GorevKunyesi`). Test
    `testler/paket-gorevi.cjs`.
- Önerinin masaya sorulması (kullanıcı: ekonomi ya da programla ilgili
  öneriyi Planlama o birime iletir, "alırız" derlerse notlarıyla ya da öneriyi
  kendileri düzenleyerek, muhabiri Planlama görevlendirir; başka öneriyi de
  "işinize yarar mı" diye sorar). Kurallar `masaSorusu.ts`, ekran
  `oneri/MasaSorusu.tsx`: sorma formu önerinin ⋯ menüsünde ("Birimin
  görüşüne sun", `MasayaSorFormu`, `data-masaya-sor-ac`), durum bilgi
  satırında tek rozet (`MasaRozeti`: "Ekonomi · görüş bekleniyor"), soru
  geçmişi, yanıt ve görevlendirme Değerlendirme bölümünde (`MasaBolumu`).
  Kullanıcı: büyük kart yer kaplıyordu, Next Day ve Weekly'de çalışırken de
  yönlendirilsin; tek pencere olduğu için plan ekranlarında da var,
  eylemler `eylemler.ts → oneriMasayaSor`, `masaSorusunuYanitla`,
  `oneriGorevlendir`. Soru öneriden ayrı kayıtta (`Durum.masaSorulari`,
  `MasaSorusu`; yapay zeka görüşü gibi): masanın notu muhabire gitmesin;
  kısıtlı kişi koleksiyonu dinlemiyor, kural okutmuyor, soru hareketleri
  (`MASA_HAREKETLERI`) muhabirin erişim listesine ve öneri geçmişine girmez.
  - Planlama (öneri değerlendiren, tam yönetici) karar aşamasındaki muhabir
    önerisini (`SORULABILIR_DURUM`) Ekonomi, Program ya da Spor'a
    (`SORU_MASALARI`) notla iletir (`masayaSorabilir`; açık sorusu ya da
    görevi olmayan; "yeni" öneri "değerlendiriliyor"a geçer), masaya
    `oneriMasayaIletildi` (`sahip`). Tek açık soru; almayan masadan sonra
    başka masaya sorulur, geçmiş kartta. Soru da "görevlendirme bekliyor" da
    yalnız öneri karar aşamasındayken listede (`masaninSorulari`:
    `SORULABILIR_DURUM`, arşivde değil; kullanıcı: birimin uygun bulduğu öneri
    Planlama'ca reddedilince "görevlendirme bekliyor" etiketiyle kalıyordu);
    ana sayfanın birim görüşü sayısı da bu kuraldan.
  - Masa (`masaYanitlar`, birimi ya da "gibi" çalıştığı birim) notla "Uygundur" /
    "Uygun değildir" (kullanıcı: "Alırız / Almayız" profesyonel durmadı; kart
    "Birim görüşü", düğme "Birimin görüşüne sun"); Planlama'ya `masaOneriyiAldi` / `masaOneriyiAlmadi`. Masa
    öneriyi sorulduğundan görevlendirilene dek düzenler (`oneriDuzenleyebilir`
    → `masaOneriyiDuzenler`). Öneriler sayfası masanın menüsünde yok; yalnız
    sorulan önerinin sayfası açık (`App.tsx`, `masaOneriyiGorur`). Masanın
    listesi masa sayfasının Öneriler bölümünde (aşağıda; eski `MasaOnerileri`
    kartı Paketler'de kaldı); Planlama'nınki
    "Birim görüşündeki öneriler" (`MasalardakiOneriler`) öneriler sayfasında.
  - Alınan öneride Planlama "Muhabiri görevlendir" (`oneriGorevlendirebilir`,
    gün ileri tarih de): plansız görev paketi (yukarıda), öneriye bağlı
    (`oneriId`, öneri "plana eklendi", `oneriPlansizKabul`), kolu masanın,
    Strap önerinin; muhabire ve masaya tek `paketGorevVerildi`. Test
    `testler/masa-sorusu.cjs`.
  - Doğrudan görev (kullanıcı: masaya sormadan da, plana eklemeden muhabire
    görev; sonra plana eklenince onaylı paket olarak girsin): önerinin ⋯
    menüsünde "Muhabiri görevlendir" (`data-oneri-dogrudan-gorev`, form
    `MasaSorusu.tsx → GorevlendirFormu`, eylem yine `oneriGorevlendir`: masa
    sorusu yoksa doğrudan yol). Yetki `yetki.ts →
    oneriDogrudanGorevlendirebilir`: ileri tarihe görev verebilen (Planlama,
    tam yönetici), karar aşamasındaki muhabir önerisi, masaya sorulmamış,
    planda ve açık haftanın gündeminde değil, canlı ve takip değil. Paket
    plansız onaylı görev paketi (stok, kolu önerinin), öneri "plana eklendi"
    (plansız kabul). Plana eklenince (`oneriPlanaEkle`, `oneriPlanlari.ts →
    oneriBekleyenGorevPaketi`) yeni PKG açılmaz: aynı paket başlığa onaylı
    girer, stoktan çıkar; formda PKG sorusu yerine görevli paketin satırı
    (`data-pe-gorevli`), öneri penceresinde "Plana ekle" o zamana dek durur.
    Test `testler/dogrudan-gorev.cjs`.
  - Masa için görev (kullanıcı: birimin "Uygundur" dediği öneride doğrudan
    görevlendirme bulunmuyordu, yalnız Değerlendirme bölümünün içindeydi;
    Planlama haber merkezi için planladığı gibi Programlar, Ekonomi ve Spor
    için de planlar, onlar için görevlendirilen masanın sayfasında durur,
    takibi ve yayını masada): ⋯ menüsündeki "Muhabiri görevlendir" masanın
    aldığı öneride de (`oneriDogrudanGorevlendirebilir ||
    oneriGorevlendirebilir`). Formda "Kimin için" (`data-oneri-gorev-masa`):
    Haber merkezi (stok) ya da Programlar, Ekonomi, Spor; varsayılan birimin
    aldığı sorudan, yoksa önerinin masa kolundan (`oneriGorevlendir(…,
    masa)`). Masa seçilince paket stok değil masanın takibinde (`masaTakibi`,
    kolu masanın), masaya `paketGorevVerildi` (`sahip`). Masa sayfasının
    İçerikler'inde yeni ilk alan "Görevlendirilen" (`icerikDurumAlani →
    gorevli`: muhabire verilmiş, teslim bekleyen; sayfa dolu ilk alanla, önce bununla açılır), teslim
    edilince "Yayına hazır". Birimin yanıtı beklenmez (kullanıcı: Ekonomi'ye sorulmuş, "görüş bekleniyor"daki öneriye görev verilemiyordu; `oneriGorevlendirebilir` açık soruda da): görev soruyu geçer, masa varsayılanı sorulan birim, rozet "görevlendirildi". Test `testler/masa-gorev.cjs`.
  - Paket masanın takibine geçer (kullanıcı: masanın paketi Planlama'nın
    günlük ve haftalık planına girmiyor, masa yayınlıyor ve takip ediyor;
    `Paket.masaTakibi`, stok değil): Planlama'nın Stok'unda, Next Day "Hazır
    paketler"inde ve onay kuyruğunda yok, Planlama onun adına işaret de
    vermez. Muhabir "Yapıldı / Yapılmadı"yla teslim eder (işaret masaya,
    `sahip`), onaya gitmez (`paketIsaretOnaylayabilir(k, p)`). Masa
    (`masaYayinKarariVerebilir`: masanın üyesi ya da tam yönetici) teslimi
    beklemeden de "Yayınlandı" ya da sebebiyle "Yayınlanmadı" der
    (`eylemler.ts → masaYayinKarari`, `PaketSonucu.tsx → MasaYayinDugmeleri`;
    hareket `masaYayinladi`/`masaYayinlamadi`, muhabire bildirim). Yayınlandı:
    tamamlandı, `yayinlandi.masa`. Yayınlanmadı: muhabir teslim ettiyse paket
    tamamlanmış sayılır, Muhasebe sayar (kullanıcı kararı; `yayinlanmadi`),
    etmediyse iptal (`yapilmadi`). "Tamamlamayı geri al" masada da (yayın izi
    silinir). Masa paketleri masa sayfasının İçerikler'inde, kapananlar
    Arşiv'de (aşağıda; eski "Takibimizdeki paketler" kartı ana sayfadan
    kalktı). Bu kuraldan önce görevlendirilmiş paketi sistemin açılış işi
    takibe alır (`masaGorevleriniTakibeAl`). Test `testler/masa-takibi.cjs`.
- Masaların sayfası (Programlar, Ekonomi, Spor; kullanıcı: program programlamaya
  uygun, masaüstü ve telefona uygun; sonra "Spor ve Ekonomi de aynı mantıkla,
  onlarda program yok; renkleri ayrı: program mor, spor yeşil, ekonomi
  lacivert"; `ekranlar/program/ProgramMasasi.tsx → MasaSayfasi`, kurallar
  `programMasasi.ts`): masanın ana sayfası (`Birimler.tsx → MasaAna`, `AnaSayfa`
  `yetki.ts → masaBirimi` ile: izinlerde program/ekonomi/spor olan, tam yönetici
  ve kademedeki müdür değil; müdür birime inince de) ve `#/programlar`,
  `#/ekonomi`, `#/spor` (`programMasasi.ts → MASA_YOLU`; `#/<masa>/<bölüm>`).
  Kutucuklar bağlantı (`data-prg-kutu`; menü ve alt çubuk adresten vurgulanıyor),
  Programlar'da beş (Yayın planları, İçerikler, Öneriler, Programlar, Arşiv),
  öbürlerinde dört (`masaBolumleri`). Renk `.masa-<birim>` (`--masa-*`
  token'ları; menüde açık tonu). Ana sayfada kutucukların üstünde "Bugün karar
  vereceklerim" (`KararOzeti`, `masaKararlari`: yayın kararı bekleyen, görüş
  bekleyen soru, programa konmamış hazır içerik; yoksa çizilmez); Ekonomi'de
  Weekly ön incelemesi bekliyorsa onun kartı. Planlama ve yönetim de sayfayı
  açar, karar düğmeleri yok.
  - Yayın planları: Next Day, Weekly, Aylık, Özel yayın; her birinin yalnız son
    onaylanan çıktısı salt okunur (`sonNextDay` onaylı ya da devredilmiş,
    `sonWeekly` kesinleşmiş, `sonAylik` onaylı, `sonOzel` onaydan sonraki);
    kağıtlar planlarınkiyle aynı bileşen (`NextDayBelgesi`, `HaftalikBelgesi`,
    `AylikBelgesi`, `OzelCikti.tsx → OzelBelgesi`).
  - İçerikler: masanın paketleri (`masaIcerikleri`: masanın takibindeki ve kolu
    masaya ait; karar bekleyen görev talebi öneri sayılır) üç alanda
    (`AKTIF_ALANLAR`, `icerikDurumAlani`): Planlamada (talep, taslak, üretime
    alınmamış; "Üretime al" kartta), Görevlendirilen (Planlama'nın masa için
    görevlendirdiği, muhabirde teslim bekleyen), Üretimde (akışta), Yayına
    hazır (teslim edilmiş ya da masanın akışında bitmiş, yayın kararı bekleyen).
    Kartta tür, yer, gün, durum, muhabir; işin muhabirine WhatsApp ve posta
    (kullanıcı: bütün muhabirlere değil, çalıştığı muhabire iş bazında;
    `data-prg-iletisim`, yalnız masanın üyesi; posta `posta/Posta.tsx →
    IsPostasi`: yeni posta penceresi Kime muhabirin adresi, konu paketin
    başlığı, kişinin grubu CC'de); "Programa aktar" (Programlar) ve masanın
    yayın kararı (`MasaYayinDugmeleri`; masa paketinin tamamlanmış halinde de,
    `masaYayinKarariVerebilir`, `paketinMasasi`). "Yayınlanmadı" denen masa
    paketi Next Day'in hazır paketlerinden de düşer.
  - Öneriler: Planlama'dan (masaya sorulan, "Uygundur / Uygun değildir" notla,
    `masaSorusunuYanitla`), Bizim önerilerimiz (masanın Planlama'ya gönderdiği
    öneriler, durumlarıyla; kalmış eski görev talepleri). Görev talebi kabul
    edilince paket masanın takibine geçer (`gorevTalebiKarar`, `masaTakibi`;
    eskileri `masaGorevleriniTakibeAl`).
  - Masanın önerisi (kullanıcı: Programlar'dan gelen öneri doğrudan görevlendirme
    gibi geliyordu, muhabirin önerisi gibi, program etiketiyle gelsin; `oneri/
    MasaOnerisi.tsx`, `eylemler.ts → masaOneriGonder`, yetki
    `masaOneriGonderebilir`): masada "Görev talebi" düğmesinin yerinde "Öneri
    gönder" (`GorevlendirDugmesi`, `data-gorevlendir="oneri"`; masa sayfası ve
    Paketler). Form muhabirinkinin dört alanı (`OneriMetinAlanlari`), gün, haber
    türü, isteğe bağlı muhabir (yoksa kaynak kurum içi, masanın adıyla). Paket
    açılmaz: `Oneri.masa`'lı, kolu masanın, "yeni" öneri Planlama'nın "Karar
    bekleyen"ine düşer, kartın bilgi satırında masanın adı masanın renginde
    (`MasaEtiketi`, `data-oneri-masa`); karar her öneri gibi (plana ekle,
    muhabiri görevlendir [masa varsayılanı kolundan], reddet). Düzeltmeye
    gitmez (muhabir yazmadı). Karar aşamasında (yeni, değerlendirme, ret, geri
    çekilmiş) muhabir görmez (`veri.ts → masaOnerisiGizli`, `oneriGorebilir`,
    gerçek kipte erişim listesi boş), görev talebindeki gibi. Masa kendi önerisinin
    sayfasını açar (`masaOneriyiGorur`). Test `testler/masa-onerisi.cjs`.
  - Programlar (yalnız Programlar; `Durum.programlar`, `ProgramTanimi`,
    koleksiyon `programlar`): ad (Arapça), yayın saati (24 saat), süre, yayın
    günleri (Cumartesi 0); `eylemler.ts → programKaydet`, `programKaldir`
    (pasif), yetki `programDuzenler` (Programlar birimi, tam yönetici). Bölüm
    kayıt değil, günlerden açılır (`haftaninBolumleri`), içerik pakete yazılır
    (`Paket.programBolumu`, `icerikProgramaAktar`, hareket `programaAktarildi`;
    `icerikAktarabilir`). Hafta ‹ › ile değişir; bölümde içerikler, "+ İçerik
    aktar" ve bölümden çıkarma. Konuk ve çekim saati yok (kullanıcı: gerek yok).
  - Arşiv (kullanıcı: programlar, kullanılan paketler; bilgi yığını değil
    kullanışlı, aranır; `masaArsivi`, saklanmaz): kapanan içerikler
    (yayınlanan, yayınlanmayan, iptal; tarih yayın ya da bölüm günü), yanıtlanan
    sorular, göreve dönmemiş talepler (Planlama'nın gerekçesiyle). Arama başlık,
    kod, muhabir (Arapça ve Latin), program adı (`sozcuklerUyar`); süzgeç Hepsi /
    Yayınlananlar / Yayınlanmayanlar / Öneriler (`ARSIV_SUZGECLERI`);
    Programlar'da program seçimi (arşivde geçenler); aylara bölünür, en yenisi
    önce, 40'ar ("Daha fazla"). Satırda gün, başlık, sonuç, program, muhabir.
  Eski kartlar (program masası, haftalık program planı, program önerileri,
  konuk organizasyonu, üretim durumu; Ekonomi ve Spor'un masa kartı ve
  "Takibimizdeki paketler"i) kalktı, ana sayfa düzen çizmiyor; katalogda
  `prSayfa`, `ekSayfa`, `spSayfa` (müdürün birim görünümü için düzen).
  Ekonomi'nin eski paket listesi (`#/ekonomi`, `Listeler.tsx → ICERIK_SAYFASI`)
  yerine bu sayfa; Spor'a ayrı sayfa açıldı (`SAYFA_IZNI.spor`), Planlama'nın
  menüsünde de. Demoda kurgusal üç program ve iki Spor kişisi (`sp1`, `sp2`,
  listenin sonunda). Test `testler/programlar.cjs`.
  - Masanın menüsü (kullanıcı: menü de programcılara özel, yalnız kendi
    çalışma alanlarına, ihtiyaçlarına ve görev çerçevelerine uygun; iki
    programcı ve bir planlamacı ajanla brifing): `AnaMenu.tsx → masaMenusu`
    (`menuGruplari`, telefondaki panel de): Ana sayfa; Masam (İçerikler ·
    yayın kararı sayısı, Öneriler · görüş bekleyen sayısı, Programlar
    [yalnız Programlar], Arşiv, Üretim panosu [kullanıcı: kalsın]); Planlar
    (Yayın planları, Weekly yalnız yöneticiye ve Ekonomi'ye [ön inceleme],
    Takvim); İletişim (Posta, İzinler); Ayarlar altta. Gruplar katlanmıyor,
    etkin madde masanın renginde. Üst çubukta plan kısayolları yok (muhabir
    gibi). Telefonda alt çubuk Ana sayfa, İçerikler, Öneriler, Programlar (öbür
    masada Arşiv), Menü, sayılarıyla (`AltCubuk.tsx → masaSekmeleri`).
    Haber merkezinin havuzları masaya kapalı (`yetki.ts → HABER_MERKEZI`): dış
    muhabirler, personel, feature, stok, başlıklar (adresle de). Next Day,
    Weekly, Aylık, Özel yayın ve paket sayfası açık kalır: Yayın planlarının
    "Aç"ı ve bildirimler oraya gidiyor; düzenleme eylemde zaten Planlama'da.
    Posta zaten açıktı (kişi kendi grup adresini Ayarlar'da girer).
- Künye (kullanıcı: biten paketin ve canlının kimlik kartı, kısa; "direkt kim
  yaptıysa onun adı", birim değil; Muhasebe'ye de gitsin). Kurallar
  `kunye.ts`, kart `bilesenler/Kunye.tsx`. Adım yapıldığı an pakete yazılır
  (`Paket.kunye`, `KUNYE_ROLLERI`, `kunyeYaz`): hareket kaydı son 2000'le
  sınırlı (`EN_COK_HAREKET`), eski paketin künyesi oradan kurulsa boşalırdı.
  - Roller: görevlendiren (tek, son veren: Newsdesk/görevlendirme adımı,
    toplantıda "Kabul et", plan onayı, haftalığın kesinleşmesi, özel yayın
    görevi ve ataması; plansız görevde `Paket.gorev`), metni düzelten (kontrol
    adımı, `parcaDuzelt`), dil denetimi (dil adımı, `parcaSonHal`), video
    kontrolü, sisteme yükleyen (media, inews), onaylayan (tek: "Yapıldı"nın
    onayı `isaretUygula`, özel yayında teslimi alan); metin ve dil parça
    parça başka kişilere düşebildiği için liste. Adım rolü `ADIM_ROLU`;
    muhabirin kendi adımları ve iletim girmez, sistemin işi (`SISTEM`) yazılmaz.
    Öneren ve muhabir (teslim saatiyle) kayıttan okunur (`paketKunyesi`).
  - Canlı: `CanliYayin.ekleyen` (`canliKaydet`, öneriden ve haftalıktan açılan),
    muhabir, yapıldı işaretleyen (`sonuc`; `canliKunyesi`).
  - Görünür: paket sayfasında biten pakette kart (`PaketKunyeKarti`), plan
    ekranında yapılmış canlının satırında katlanır (`CanliKunyesi`), Muhasebe
    dökümünde ve muhabir sekmesinde iş satırı açılınca (`IsKunyesi`;
    muhasebeci paket sayfasını açamıyor, kart satırın içinde). Ücret yok, yalnız
    ad ve saat; muhabir kendi paketininkini görür. Boş rol çizilmez.
  - Künyeden önce bitmiş paketi sistemin açılış işi bir kez hareket kaydından
    doldurur (`eylemler.ts → kunyeleriDoldur`, `hareketlerdenKunye`); izi
    silinmiş eski pakette yalnız bilinen satırlar. Test `testler/kunye.cjs`.
- Masalar (kullanıcı: Ekonomi, Program ve Spor kendi bülteni ya da programı
  için üretimi Newsdesk gibi takip ediyor; `veri.ts → MASA_KOLLARI`,
  `masaPaketi`): kolun sahibi kendi birimi (`akis.ts → KOL_SAHIBI`, yapıda
  `kolSahibi`; ekonomi önce Planlama'daydı). Paket Weekly'den de Next Day'den
  de masasına düşer (`paketSahibi`: onaylı masa paketi planı olsa da kol
  sahibinde), masası "Üretime al"ı yapar (`uretimeAlabilir`), akış
  Organizasyon'daki yol, "kol" durakları masanın. Muhabirin "Yapıldı /
  Yapılmadı"sı ve sade akış yok (`sadeAkis`, `paketTamamlayabilir`), Günün
  notunun "sonuç bekleyen"ine girmez. Masanın paketleri masa sayfasının
  İçerikler'inde (yukarıda, Masaların sayfası; eski `MasaPaketleri` kartı
  katalogdan kalktı). Bitmiş masa paketi Next Day "Hazır
  paketler"den seçilir (`akis.ts → hazirSecilebilir`; stoktakiyle birlikte,
  `StoktanSecici`, `hazirPaketEkle`, devirde yayınlandı). Spor yeni yerleşik
  birim ve kol, Output'un altında, ünvanları yönetici ve editör; onsuz
  yayınlanmış yapıda okurken eklenir, ekonominin sahibi Planlama'ysa
  Ekonomi'ye geçer, spor kolu ekonominin akışına katılır (`yapi.ts →
  masalariKur`, `tamamla` içinde). Eski kayıtta üretime alınmamış ekonomi
  stok paketi masasına geçer (`eylemler.ts → masaPaketleriniStoktanAyir`,
  sistemin açılış işi); bitmiş olan stokta kalır. Muhabir kılavuzunda `kl7d`.
  Test `testler/masa-stok.cjs`.
  - Ekonomi menüde ayrı sayfa (`#/ekonomi`; kullanıcı: ekonomi ayrı birim,
    "Feature / ekonomi" tek sayfaydı); şimdi masa sayfası (yukarıda).
    "Feature / stok" yalnız feature.
  - Masa paketinin aşamaları beş sabit aşama değil, kendi yolu (`akis.ts →
    masaYolu`, `Parcalar.tsx → AsamaCubugu`, `AsamaBuyuk`, `data-masa-asama`):
    Planlama → "<masa> · üretime alma" → akışın durakları → Tamamlandı
    (kullanıcı: işin Planlama'dan sonra doğrudan masaya gittiği görünmüyordu,
    News Gathering ve Newsdesk "sırada" duruyordu). Kolun "newsdesk" türlü
    durağının adı "<masa> görev verecek" (`adMasaGorev`), yükleme durağı stok
    kolundaki gibi. Örnek veride üretimdeki masa paketi yeni yolun damgasıyla.
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
    seçili paket plan onaylanınca ya da planın günü geçince (kurumda plan her
    zaman onaylanmıyor) `yayinlandi` alır, onay geri alınınca ya da
    paket hazırdan çıkınca stoka döner (`eylemler.ts → hazirYayiniEsitle`;
    kullanıcı: stoka çevrilen paket yayınlanmış görünmüyor, başka planda yine
    seçiliyordu: yayın kalkmış plan devrine bağlıydı). Onaylıdan önce kalmışları
    sistemin açılış işi eşitler (`hazirYayinlariniEsitle`). Başka planın
    hazırında duran paket ikinci plana seçilmez (`akis.ts → baskaPlandaHazir`).
    Test `testler/hazir-yayin.cjs`.
    Planın beklenen paketi (PKG) yapılmışsa satırındaki "Stok paket olarak
    ekle" (plan ekranında ve belgede; `eylemler.ts → paketStogaAl`,
    `paketStogaAlinabilir`: plan içeriğini düzenleyen, üretimde, iptal ve özel
    yayın paketi değil) onu stok paketi yapar (`tamamlandi`): bu planın hazır
    paketlerine (التقارير الجاهزة) girer ve Stok'un Stokta kutusunda (Plana
    alınan) durur, plan onaylanınca yayınlandı; başka planda "Stoktan seç"le de
    seçilir; hareket `paketStogaAlindi`. Bir süre (10–12 Kasım) yalnız Stok'a
    gidiyordu: hazır listesinde olmayan paket "beklenen" sayılıp التقارير
    المتوقعة'da basılıyordu (kullanıcı: hazır paketlerde görünmeli); o arada
    alınanları sistemin açılış işi kendi planının hazırına koyar
    (`stokPaketleriniHazirlaraAl`, bugün ve sonrası, açık plan). Stoktaki
    paket hazırdan çıkarılsa da beklenenlerde ve متابعات'ta basılmaz. Beklenen
    paketlerde (التقارير المتوقعة) basılmaz; başlığın altında kalıp kalmayacağı sorulur (`stokBaslikta`,
    `paketStogaAl(…, baslikta)`), hayırsa başlıktan ayrılır. Hazır pakette açıklama ve kod (slug) satırın hemen
    altında; PKG satırında da kod altında.
    Stoka alınan paket sonradan düzenlenir ve silinir (kullanıcı: ikisi de
    yapılamıyordu; çöp simgesi yalnız plandan çıkarıp stoka bırakıyordu):
    hazır paket satırında (plan ekranı ve belge) "Düzenle" Strap, açıklama ve
    kod (`paketMetniDuzenlenebilir` stokta ve yayınlanmamış paketi de kapsar,
    `PaketMetniFormu`'nda stokta slug alanı), "Plandan çıkar" (×, stoka geri
    bırakır) ve bu planda stoka alınmışsa "Sil" (`eylemler.ts → stokPaketiSil`,
    `stokPaketiSilinebilir`: başka planın hazırında değil; onaylı, paket ve
    hazır listelerindeki izi gider, planın tarihçesinde hareket
    `stokPaketiSilindi`, bildirimsiz; başlığın altında da kalan stok paket
    başlığın PKG satırından da, plan ekranında ve belgede; kullanıcı: yalnız
    yukarıdan siliniyordu). Testler `testler/stok-paket.cjs`,
    `testler/stok-paket-baslikta.cjs`.
    Paketi plandan kaldırmanın tek kuralı (kullanıcı: stok, normal ve özel
    yayın paketinin eklenip çıkarılması, silinmesi karışmasın; onaylı paket
    hiçbir yoldan izsiz kaybolmasın; `yetki.ts → paketSilinebilir`,
    `paketPlandanKaldirilir`): karar verilmemiş PKG (taslak, değerlendirmede)
    "Sil"le gider, kaydı kalmaz (`paketSil`); onaylı PKG (Weekly'den gelen de)
    silinmez, satırdaki "Plandan kaldır" (`SatirIslemleri.tsx →
    PaketKararDugmeleri`, `data-paket-kaldir`; eski "İptal et") onu iptal
    eder: plandan düşer, kaydı tarihçede kalır, muhabire `paketIptal` (`kime`;
    `paketDurum(…, "iptal")`, onaylı ve üretimdeki pakette), onay sorusu
    bildirimi söyler. Önerinin "Plandan çıkar"ı (ve aşamayı geri alma,
    `plandanCikarilmis`) onaylı paketi aynı biçimde iptal eder, kararsızı
    siler; üretime ya da parçalı metne girmiş pakette durur. Özel yayının
    içeriği yalnız özel yayından geri alınır (`ozelIcerikGeriAl`; `paketDurum`
    reddeder). Stok paketin "Plandan çıkar"ı ve "Sil"i yukarıdaki gibi
    (geçici çözüm, bildirimsiz). Bir süre (24 Kasım) onaylı PKG "Sil"le
    kaydıyla gidiyordu. Test `testler/paket-sil.cjs`.
- Onaylı paketin kapanışı (tasarım belgesi 3. aşama). "Newsdesk sistemde"
  anahtarı (`Durum.newsdeskDevrede`) kalktı (kullanıcı: Newsdesk aktif değil
  diye bütün düzeni dondurmaya gerek yok; paketin Newsdesk'ten geçip
  geçmeyeceği üretim balonunda seçiliyor): `yetki.ts → yalnizPlanlama` hep
  doğru, kayıttaki eski değer okunmuyor, Ayarlar'daki kutu yok. Aşağıdaki
  "Newsdesk sistemde değilken" kuralları her zaman geçerli:
  - Toplantıda paket başına karar: plan ekranında ve paket sayfasında
    "Kabul et" (`paketDurum(…, "onaylandi")`, muhabire görev) ve "Reddet"
    (`eylemler.ts → paketReddet`: paket iptal, `Paket.reddedildi` izi, haber
    planda paketsiz, muhabire `paketReddedildi`); ikisi onaylı. Öneri plana
    eklendi kalır (gelişmesi planda); rozetinin yanında "PKG reddedildi"
    (`Tablolar.tsx → OneriDurumRozeti`; yoksa ret hiçbir yerde görünmüyordu). Plan
    onaylanınca kararsız paketler kabul sayılır (`planDurum`).
  - Onaylı paketin sonucu muhabirden ("Senin sıran", paket sayfası;
    `bilesenler/PaketSonucu.tsx → PaketSonucDugmeleri`): "Yapıldı" ya da
    sebebiyle "Yapılmadı" (`paketIsaretle`, `Paket.isaret`, yetki
    `paketIsaretleyebilir`; Planlama'ya `paketIsaretlendi`). İşaret yetkili
    onaylayana dek "Onay bekliyor"; onay ya da geri çevirme
    `paketIsaretKarar` (yetki `paketIsaretOnaylayabilir`, hesap yetkisi
    `paketOnayi`). Bildirim onaylayabilenlere (`kime`), onay kuyruğu
    yetkilinin ana sayfasının başında (`PaketSonucu.tsx → OnayKuyrugu`,
    `Calisma.tsx`, düzenden bağımsız). Onaylanan
    yapıldı paketi kapatır (`tamamlandi`, `muhabirTeslimi` işaretin anı,
    önerinin e-posta takibi de), yapılmadı iptal eder (`Paket.yapilmadi`
    sebebiyle); geri çevrilen işaret silinir. Yetkilinin kendi işareti onay
    beklemez. Muhabire `paketIsaretOnaylandi` / `paketIsaretGeriCevrildi`.
  - "Yapılmadı"nın türü (kullanıcı: ziyaret iptal olunca muhabire verilen paket
    muhabir raporunda yapılmayan sayılıyordu; `YapilmamaNedeni`): formda sebebin
    üstünde "Haber düştü" / "Muhabir yapamadı", seçilmeden gönderilmez
    (`PaketSonucu.tsx → NedenSecimi`, `Paket.isaret.neden`, onayla
    `yapilmadi.neden`'e). Muhabir raporu yalnız "muhabir yapamadı"yı (ve türsüz
    eskiyi) yapılmayan sayar (`muhabirRaporu.ts`). Paket sayfasında biten paketin
    altında satır (`YapilmadiSatiri`, `data-yapilmadi-satiri`): tür, sebep, kim
    dedi; onay yetkilisi türü sonradan değiştirir (`eylemler.ts →
    yapilmamaNedeni`). Plana dokunulmaz (kullanıcı: plan Newsdesk'in alanı).
    Rozet "Haber düştü". Test `testler/yapilmadi-neden.cjs`.
  - Sonuç saklanmaz (`paketSonucu.ts`): onay bekleyen, yapılan, yapılmayan,
    reddedilen; rozet `PaketDurumRozeti`.
  - Paketler sayfasının sekmeleri (kullanıcı: ana sayfanın "Görevlendirilmiş" ve
    "Arşiv · paket" kutusu "Aktif" sekmesine düşüyordu, on sekme üç ayrı mantıktan
    karışıktı; `paketSekmeleri.ts`, `Listeler.tsx → Paketler`): üç sekme, çizimdeki
    akışın paket yarısı: Karar bekleyen (taslak, değerlendirmede, şartlı),
    Görevlendirilmiş (onaylı ve üretimde; görevi verilmemiş özel yayın paketi
    değil), Arşiv (tamamlanan ve iptal; içinde sonuç süzgeci `ARSIV_SONUCLARI`:
    yapıldı, yapılmadı, reddedildi, iptal; `data-paket-sonucu`, liste "Son 7 gün" ve
    "Daha eski", `arsivdeYeni`). `#/paketler/<sekme>` o sekmeyle açar (App.tsx;
    paket kimliği değil), varsayılan Görevlendirilmiş; başlıkta açık sekme
    ("Haber paketleri · Arşiv"). Sayılar arama ve tür süzgecinden geçmiş listeden.
    Muhabirde Haberlerim.
  - "Başka muhabire ver" (paket sayfası, `PaketSonucu.tsx → BaskaMuhabireVer`,
    `eylemler.ts → paketBaskaMuhabireVer`, hesap yetkisi `baskaMuhabire`):
    onaylı paket yeni muhabire teklif olarak gider (`Oneri.kaynakPaketId`,
    teklif akışı); eski paket iptal, `Paket.devredildi` iziyle eski muhabirin
    geçmişinde; iki muhabire bildirim.
  - Plan devri ("Planı Newsdesk olarak devral") yok (anahtar kalktı):
    düğme (`nextday/Plan.tsx`) ve eylem (`planDurum`, `yalnizPlanlama`)
    kapalı. Devredilen planın onaylı paketleri üretim akışına düşüyor, Newsdesk
    sistemde olmadığı için orada sahipsiz kalıyordu. Paket üretime yalnız
    üretim balonuyla girer (yolu paket paket seçiliyor).
  - Özel yayın paketi kendi teslimiyle (`paketTamamla`). Hesapsız muhabir
    için Planlama paket
  ayrıntısından onun adına kapatır. Anahtar açılınca bu kapanış kalkar,
  devral ve üretim akışı geçerli; yarım paketler kendi yolunda.
  - Ekran bu pakete üç adım gösterir (`akis.ts → sadeAkis`, `SADE_ASAMA_ADI`):
    plana eklendi, muhabirde, tamamlandı; "şimdi kimde" onaydan sonra
    muhabir (`gorunenSahip`; iş akışının sahibi `paketSahibi` değişmez).
    Beş aşama ve üretim adımları yalnız üretime girmiş pakette.
  - Paket yalnız işaret ve onayla kapanır (özel yayın dışında `paketTamamla`
    eylemi de reddeder). Haberi biten önerinin rozeti "Tamamlandı"
    (`OneriDurumRozeti`, paketinden).
  - Onaylı paketin (Weekly'den gelen de) yalnız metni sonradan düzeltilir:
    Strap ve açıklama (`eylemler.ts → paketMetniDuzenle`,
    `paketMetniDuzenlenebilir`: plan düzenleyen, onaylı, özel yayın değil,
    planı devralınmamış; plan ekranında paketin kalemi, paket sayfasında
    kart). Durum, muhabir, akış ve onay değişmez; paket formu yalnız
    taslakta açık kalır.
  - Paket iptal edilince (`paketDurum`) bekleyen işaret silinir; onay yalnız
    onaylı pakete uygulanır, kuyruk ve "onay bekliyor" yalnız onaylı paketi
    gösterir (iptal paketi "tamamlandı"ya dönüyordu).
  - Onaylanmış "Yapıldı" geri alınır (yanlışlıkla onaylanınca; `eylemler.ts →
    tamamlamaGeriAl`, yetki `tamamlamaGeriAlabilir`: yalnız onay yetkilisi
    `paketOnayi`, muhabir onaylanmış sonucu bozamaz): onaydan sonra çıkan
    bildirimde "Geri al", sonradan paket sayfasında "Tamamlamayı geri al"
    (`bilesenler/TamamlamaGeriAl.tsx`). Paket yeniden onaylı; muhabirin teslim
    zamanı yalnız o kapanışta yazıldıysa silinir. Hareketi
    `tamamlamaGeriAlindi`, muhabire bildirim. Özel yayın paketi kendi aşama
    listesinde geri alınır.
- Özel yayın (`ekranlar/OzelYayin.tsx`, `#/ozel`, `#/ozel/:id`,
  `#/ozel/:id/cikti`; kurallar `ozel.ts`, eylemler `eylemler.ts → ozel*`,
  `nafize*`, `konuk*`): Planlama'nın denetiminde hazırlanır, onayı Plan
  yetkileri'nde (`ozOnay`, varsayılan Planlama yöneticisi). Künye: başlık,
  gün (ya da `bitis`), genel planın Arapça paragrafı (`aciklama`).
  - Yeniden tasarım (kullanıcı: özel yayın öbür planlarla tamamen uyumlu
    olsun; beş adım, onaylı öneri; içerikleri genel kayıtlarda, yayının
    kimliğiyle). 1. adım: masa listesinde "Özel yayın" (`IcerikTuru`
    `ozel`, sahibi Planlama, `TUR_ADI → turOzel`); öneri ve plan formlarında
    seçilmez (`veri.ts → SECILEN_TURLER`; paketi bir yayına bağlı). İçerik
    sekmesinde "Görevlendir" (`data-ozel-icerik-ekle`, `IcerikPenceresi`):
    muhabir, Strap, yayın günü (`Paket.yayinGunu`, yayının aralığında,
    `ozelIcerikGunuUygun`), teslim günü (`sonTarih`, yayın gününden sonra
    değil; boşsa yayın günü), haber türü, not; `eylemler.ts →
    ozelIcerikGorevlendir` (yetki `ileriGorevVerebilir`: Planlama, tam
    yönetici) paketi onaylı, `gorev`'li, stokta açar, muhabire
    `paketGorevVerildi`. Plansız görev paketi gibi ilerler (muhabirin
    "Yapıldı"sı ve onay, üretim balonu: yerleşik şablon `u-ozel`, stokun yolu;
    `paketSablonu` özel yayın paketine önce onu). Kalıp posta (`takdir.ts →
    VARSAYILAN_OZEL_GOREV`, `ozelGorevEpostasi`; yer tutucular {yayin} {gun}
    {teslim}…) kendiliğinden gitmez (kullanıcı: görevlendirmede posta
    gitmesin, karttaki posta düğmesinde şablon olsun): içeriğin kartındaki
    posta düğmesi (yayının İçerik sekmesi ve Stok'un Special Coverage
    kutusu; `OzelYayin.tsx → ozelGorevSablonlari`, `StokKarti sablonlar` →
    `KisiIletisim sablonlar` → `IsPostasiPenceresi`) yeni posta penceresinde
    gövdenin üstünde "Şablon · Özel yayın görevi" (`posta/Posta.tsx →
    PostaSablonu`, `data-posta-sablon`): seçilince konu, metin, CC ve BCC
    şablondan; kişinin EWS kimliğiyle gider, iz `takdirBildirimi`
    (`ozelGorevPostasiGitti`, kartta "gitti"), demoda yalnız iz. Şablon
    yanındaki kalemle düzenlenip kaydedilir (`GeriBildirimSablonlari.tsx →
    TakdirFormu`, yetki `geriBildirimSablonuDuzenler`); Ayarlar › "Muhabire
    geri bildirim"de de PKG geri bildiriminin altında (`ozel-gorev`,
    `SABIT_SABLONLAR`). Eski düzenin paketi (öneri → onay → görevlendirildi →
    kendi teslimi) `veri.ts → eskiOzelPaket` (`ozelId` var, `gorev` yok): ayrı
    kurallar yalnız ona; yeni paket öbür paketlerin kurallarıyla. Eski "Paket
    talebi" düğmesi kalktı, var olan öneriler düzenlenir. Plansız açılmış
    görev (kullanıcı: asistan yayın için plansız paket görevi açmıştı, İçerik'te
    görünmüyordu) İçerik sekmesindeki "Var olan görevi bağla · n"
    (`data-ozel-gorev-bagla`) ile yeniden açılmadan yayına alınır
    (`eylemler.ts → paketiOzeleBagla`, `ozeleBaglanabilir`: ileri görev veren;
    plansız, görevli, masa takibinde ve hazırda değil): stoktan çıkar, yayın günü
    seçilen gün ya da TBC, teslim yayının son gününe çekilir, hareket
    `paketTeslimGunu` (`veri.bag`, `hrOzeleBaglandi`). Asistanda
    `ozelYayinlariListele`, `ozelIcerikGorevlendir`, `paketiOzeleBagla` ve
    `ozelGorevPostasi` (kullanıcı: "görevlendirme maili gönder" deyince asistan
    kendi postasını yazıyordu): kartın posta düğmesinin şablonu
    (`ozelGorevEpostasi`), konu ve metin onay kartında şablonla dolu, gidince
    `ozelGorevPostasiGitti`; kapıda `postaGonder`'in açıklaması onu gösterir. Test
    `testler/ozel-icerik.cjs`.
    2. adım, nafize canlı yayın (kullanıcı: nafize canlı etkinlik biçiminde,
    saati sistemin öbür unsurlarıyla eş zamanlı; günün planına canlı eklemek
    gibi): nafize `CanliYayin` kaydı (`ozelId`, `konuklar`, `rezervasyon`,
    `yerHazir`; `eylemler.ts → nafizeKaydet`, `nafizeIsaret`, `nafizeSil`,
    `konukKaydet`, `konukSil`, yetki `ozelDuzenler`), saat GMT. Günün Next
    Day planı açıksa ona bağlanır, açılmamışsa `planId` boş bekler
    (`ozelCanlilariEsitle`: nafize kaydında, plandaki canlı düzenlemesinde,
    `yarinPlaniniAc`'ta ve sistemin açılış işi `ozelCanlilariniBagla`'da); günü
    değişen yeni gününün planına geçer, eski başlık bağı düşer. Next Day'de
    "مباشر"da aynı kayıt, özel yayının adı rozetle (`data-canli-ozel`), Newsdesk
    "yapıldı/yapılmadı" der, Muhasebe canlı olarak sayar; plandan silinmez
    (`canliSil` reddeder, düğme yok), yarının planına kopyalanmaz. Kayıt
    temizliği planı silince nafize kalır (bağı düşer), `kayipPlanlar` onu
    saymaz; özel yayın silinince gider. Durum kayıttan (`OzelYayin.tsx →
    nafizeDurumu`): yapıldı / yapılmadı, yoksa rezervasyon ve yer hazır;
    onay ve iptal aşaması kalktı (silmek iptal). Eski düzenin nafizesini
    sistemin açılış işi bir kez canlıya çevirir (`ozelNafizeleriCevir`, kimlik
    `cy-<nafize>`, iptal edilen gelmez, aşama işaretleri izden). Liste
    `ozel.ts → ozelNafizeleri`, hazır `nafizeHazir`. Test `testler/ozel-nafize.cjs`.
    3. adım, içerik planlarda (kullanıcı: paketler özel yayının uygulanacağı
    günün planına, haftalıkta haftalığa eklenecek; stokta "special coverage"
    olarak görülecek, takibi oradan da): yeni düzenin içeriği
    (`veri.ts → ozelIcerikMi`: `ozelId` ve `gorev`) stok paketi değil; yayın
    gününün Next Day planına yayının adıyla açılan başlığın (havuzda aynı adlı
    varsa o, `dosyaAc`; planda kimliği `<plan>-oz-<yayın>`) altında onaylı PKG
    olarak girer, plan açılmamışsa plansız bekler, açılınca bağlanır
    (`eylemler.ts → ozelPaketleriEsitle`, nafizeyle birlikte
    `ozelKayitlariEsitle`). Plandan silinmez (`paketSil` reddeder); başlık
    altında paket varken çıkarılamıyor. Stok'ta altıncı kutucuk "Special
    Coverage" (`#/stok/ozel`, `StokSayfasi.tsx → OzelKutusu`, kural
    `stokSayfasi.ts → ozelStokAlani`: süren / biten): yayın yayın, Stok'un
    kartıyla (aşama, kimde, teslim, muhabire ulaşma) ve "Üretime al" balonu;
    Üretim, Stokta ve Arşiv'de ikinci kez yok. Weekly'de salt okunur
    "التغطيات الخاصة" (`HaftalikBelge.tsx → HaftaOzelBolumu`; belge, çıktı,
    toplantı ve plan ekranında `OzelYayinBolumu`): yayın yayın, gün gün LIVE
    (nafizeler) ve PKG (içerikler); karar kalemi değil. Test
    `testler/ozel-plan.cjs`.
    4. adım, aşamalar kayıttan (kullanıcı: aşamaları işaretliyorum, programa
    etki ediyor mu, havada mı; elle işaretlenenler hiçbir şeye bağlı değildi,
    iş bitse de "Planlama"da kalıyordu): `ozel.ts → ozelAsamaDurumlari`,
    saklanmaz. Planlama (genel plan yazılmış, en az bir nafize ya da içerik),
    Onay (elle verilen tek adım: `eylemler.ts → ozelOnayla`, Plan yetkileri
    `ozOnay`; eski düzenin onay bekleyen paket önerilerini de onaylar, "Onayı
    geri al" `data-ozel-onay-geri`), Uygulama (nafizenin rezervasyonu ve yeri,
    dış görevlendirmenin News Gathering onayı, eski paketin görevi, açık
    yapılacak maddeler), Teslim (içerikler), hepsi tamamsa "Yayına hazır".
    Şimdiki aşama tamamlanmamış ilk aşama (`ozelAsamasi(o, d)`); Genel
    bakış'ta her aşamanın altında eksikleri (`EksikListesi`, `data-eksik`,
    günü geçen kırmızı), basınca işin sekmesi açılır (genel plan eksiği
    künyeyi). Kontrol kutusu yok; eski kayıttaki "uygulandı", "hazır" onaylı
    sayılır. "Yayına hazır"ın eski etkisi (bitmiş paketler yayınlandı)
    yayının son günü geçince sistemin açılış işinde
    (`ozelYayinlananlariIsaretle`). "Diğer talepler" ve hazırlık maddeleri
    tek "Yapılacaklar" listesi (`OzelMadde`: metin, isteğe bağlı gün ve
    birim, iz; `ozelMaddeKaydet` birime bildirim `ozelTalep`, `ozelMaddeSil`,
    `ozelHazirlikIsaretle`): sekmede gün gün gruplu, günsüzler sonda;
    eski talepleri açılış işi maddeye çevirir (`ozelTalepleriMaddeyeCevir`:
    son tarih gün olur, iptal taşınmaz). Günlük program (`ozel.ts → ozelGunu`,
    `yayinGunleri`): ortada günün nafizeleri ve o gün yayınlanacak içerikler,
    sağda o gün sahada olanlar, o günün yapılacakları (oradan işaretlenir) ve
    konuklar; gün düğmesinde toplam. Test `testler/ozel-asama.cjs`.
    5. adım, geçiş ve aylık bağı: eski düzende görevi verilmiş, süren paket
    (`eskiOzelPaket`, onaylı, muhabiri ya da hazırlayanı belli, görevi
    bekleyen değil) sistemin açılış işiyle yeni içerik olur
    (`eylemler.ts → ozelEskiPaketleriCevir`: masası "Özel yayın", görevi veren
    son atama ya da onay hareketinden, işi in-house'ta hazırlayana, yayın günü
    son tarih yayının aralığına çekilerek; günün planına bağlanır). Görevi
    verilmemiş ya da onaylanmamış olan eski akışta kalır (stok ekibinin
    listesi `OzelTalepAlani` yalnız onları gösterir), görevi verilince
    sonraki açılışta çevrilir; bitmiş olan geçmiş kayıt. Önerisi eski listede
    ikinci kez görünmez (`ozelPaketSatirlari`). Aylık olaydan açılan yayında
    PKG ve Walk & Talk satırı artık eski paket önerisi değil, o günün yapılacak
    maddesi ("PKG · başlık · muhabir"; içerik İçerik sekmesinden görevlendirilir),
    öbür satırlar da günüyle madde (`aylik.ts → olaydanOzele`). Çıktıda
    içerikler yayın günüyle. Test `testler/ozel-gecis.cjs`, aylık bağı
    `testler/planlama-3.cjs`.
    Geri alma ve kart (kullanıcı: onaylanan paketler özel yayın planında geri
    alınabilsin; içerikteki görevlendirme tasarımı standart stoklardaki
    gibi): İçerik sekmesinde içerik Stok'un kartıyla (`StokSayfasi.tsx →
    StokKarti`, `yayinsiz`: yayının adı kartta tekrar edilmez; `.icerik-sarma`
    `display: contents`), yayın günü yayın günü kart ızgarasında; altta görev
    postası, "Üretime al", "Görevi geri al" (`eylemler.ts → ozelIcerikGeriAl`,
    `ozelIcerikGeriAlinabilir`: ileri görev veren, onaylı, üretime ve sonuç
    işaretine girmemiş; iptal, plandan düşer, boş kalan yayın başlığı kalkar,
    muhabire `paketIptal`) ve biten içerikte "Tamamlamayı geri al". Eski
    düzenin onaylı paketinde görevi verilmemişse "Onayı geri al"
    (`ozelPaketOnayGeriAl`, `ozelPaketOnayiGeriAlinabilir`, ozOnay; kontrol
    listesinde "Onaylandı" kutusu da kalkar): öneriden doğan paket silinir,
    öneri yeniden onay bekler; önerisiz paket taslağa döner. Testler
    `testler/ozel-plan.cjs`, `testler/ozel-gecis.cjs`.
    Yayın günü TBC (kullanıcı: yayın günü sonradan ayarlanabiliyor):
    görevlendirme formunda yayın gününün yanında TBC (`TbcKutusu`,
    `data-ozel-yayin-tbc`); `Paket.yayinGunu` boş kalır, içerik hiçbir günün
    planına girmez, teslim yayının son gününe dek (boşsa yayının ilk günü).
    Kartta "Yayın gününü belirle" (`data-ozel-yayin-gunu-ac`, pencerede
    yayının günleri ya da TBC; `eylemler.ts → ozelIcerikYayinGunu`, yetki
    `ozelIcerikYayinGunuDegisebilir`): gün verilince o günün planına geçer,
    TBC'ye dönünce plandan çıkar (`ozelPaketleriEsitle`; boş kalan yayın
    başlığı `ozelBaslikTemizle` ile kalkar), teslim yeni günden sonraysa ona
    çekilir; muhabire `paketTeslimGunu` (`veri.yayin`, metin
    `hrOzelYayinGunu`/`hrOzelYayinGunuTbc`). İçerik sekmesinde TBC grubu
    sonda, Uygulama aşamasında eksik "Yayın günü belirlenmedi"
    (`oyEkYayinGunu`), çıktıda "TBC". Test `testler/ozel-plan.cjs`.
  - Üst kısım `PlanBasiKalibi` (`OzelYayin.tsx → OzelBasi`): yayının adı, ⋯
    (çıktı `data-ozel-cikti`, künyeyi düzenle), "Sıradaki" kartında kayıttan
    okunan aşamalar (Planlama, Onay, Uygulama, Teslim, Yayına hazır), şimdiki
    aşamanın eksik sayısı ve onaysızsa "Planı onayla" (`data-ozel-onayla`);
    eksikler ve notlar Genel bakış'ta.
  - Künyede sayı kutuları (gün, nafize, paket, açık yapılacak) ve ilerleme
    (`ozelOzeti`); altında sekmeler (`OZEL_SEKMELERI`): Genel bakış
    (aşamalar ve eksikleri), Günlük program, Nafizeler, İçerik, Görevlendirmeler,
    Yapılacaklar. Telefonda günlük programın günleri yatay şerit, sütunlar alt
    alta.
  - Sekmelerde bölümler (nafizeler, paketler, görevlendirmeler, yapılacaklar)
    ve içlerindeki her kalem kapalı gelir
    (`Bolum`, `Kalem`; `<details>`); kapalıyken başlık, sayı, aşama. Pencere
    bölümün dışında çizilir (kapalı `<details>` içini göstermiyor).
  - Kontrol listesi (`KontrolListesi`; sıra `ozel.ts → isaretli`,
    `siradaki`, `oncesi`) yalnız eski düzenin paket önerilerinde: sırayla
    işaretlenir, yalnız sonuncu geri alınır; işaretleyen ve zaman izden
    (`isaretIzi`), her aşamanın notu kendi satırında (`OzelIz.asama`,
    `asamaNotlari`). Planın aşamaları kayıttan (yukarıda, 4. adım).
    - Nafize (eski düzen, açılış işi canlıya çevirdi) (`NAFIZE_SIRASI`): onay (tek başına da, `ozOnay`), Satdesk
      rezervasyonu, yer hazır, yayınlandı; iptal ayrı (`nafizeIptal`).
      Başlığı her dilde Arapça "25 أكتوبر - تل أبيب - 10G" (`nafizeBasligi`,
      `dil.ts → gunAy`); konu, muhabir (ya da TBC) ve konuklar içeride.
      Konuklar (aday, davet edildi, teyitli, iptal) sırasız, aşamaya bağlı
      değil.
  - Paket önerisi (`OzelYayin.paketOnerileri`) özel yayının içinde, genel
    önerilere karışmaz; yazılınca paket doğmaz. Onayla (tek başına
    `ozelPaketOnerisiOnayla` ya da planın onayıyla) `Paket` açılır
    (`ozelId`, `ozelKaynak`, `sonTarih` zorunlu, `ozelAd`: muhabir özel
    yayının kaydını okuyamıyor). Onay görevlendirme sayılmaz: dış muhabirin
    paketi `ozelGorevBekliyor` ile onaylıda bekler, muhabir onu görmez
    (`paketGorebilir`, `ozelPaketTeslimEdebilir`); Planlama "Görevlendirildi"yi
    ayrıca işaretler (`ozelPaketGorevVer`, `ozelGorevVerebilir`; başlamadan
    geri alınır), görev ve bildirim muhabire o an, yayının adıyla
    (`ozelPaketAtandi`). In-house'ta görevlendirme stok ekibinin seçimi.
    Aşamaları (`ozelPaketAsamasi`): öneri → onaylandı →
    görevlendirildi (muhabir ya da hazırlayan) → hazırlanıyor (`ozelBasladi`,
    işi yapan ya da Planlama) → hazır (`tamamlandi`); ilerleyiş önerinin
    izine de düşer (`paketOnerisiIzi`), notlar öneride. Öneri kaydından önce
    doğrudan açılmış taslak paket önerisiz satır olarak sürer
    (`ozelPaketSatirlari`, `ozelPaketOnayla`). In-house görev Planlama'nın stok
    ekibine düşer, stok ekibi (`ozelPaketDagitabilir`) birine verir
    (`hazirlayanId`, `ozelPaketAta`; Stok sayfasının başında "Özel yayın
    paket talepleri", yayının adıyla; önce Output'taydı); dış muhabir görevi
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
  - İlerleme ve yönetici panelinin sayıları kalem kalem yapılanı sayar
    (`ozelOzeti`, `yapilacaklar`; saklanmaz).
  - Çıktı (`ekranlar/OzelCikti.tsx`) Next Day ve Weekly'nin kağıdıyla aynı
    biçim ve araç çubuğu (`CiktiAraclari`: kopyala, Word, yazdır/PDF), her
    arayüz dilinde Arapça: genel plan, nafizeler (başlık, konu, muhabir,
    konuklar), paketler ("YER / strap / muhabir", son tarih),
    görevlendirmeler, yapılacaklar (günüyle). İptal basılmaz, onay bekleyen öneri basılır.
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
- Ekonomi ve Spor ayrı birim, kendi masalarıyla (yukarıda, Masalar).
  Yöneticilerinin kapsamı kola göre (`yetki.ts → KOL_BIRIMLERI`).
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
  - Takvim botu (kullanıcı: gündemdeki zirve, seçim, faaliyetleri bulup
    takvime eklesin; ilk katman yapay zekasız, ücretsiz; kurallar
    `takvimBotu.ts`): Gündem taranınca (`Gundem.tsx`, eşitlenince, izlemede
    değil) haberlerde olay sözcüğüyle (`OLAY_SOZLERI`, türü de oradan) ileri
    tarih geçenler aday olur (`eylemler.ts → takvimAdaylariniTopla`,
    `Durum.takvimAdaylari`). Tarih okuyucu `tarihleriBul`: ay adı + gün
    (Mısır/Körfez, Levant ve İngilizce adlar, Arapça rakam; yıl yoksa haberin
    yılı, geçmişte kalıyorsa ertesi yıl ama yalnız `YIL_ATLAMA_GUNU` 90 gün
    içindeyse), "غدا/tomorrow", "بعد غد", "الأحد المقبل/next Sunday"; "on
    Sunday" ve belirsiz "gelecek hafta" alınmaz (geçmiş haberde de geçiyor,
    tarih uydurulmasın). Ay adlı tarihte metinde ileriye bakan ifade de şart
    (`GELECEK`: سيعقد، من المقرر، المقبل، قبيل، will, to be held, ahead of, "to
    + fiil" manşet kalıbı…; `ileriyeBakar`). Kullanıcı ilk sürümde listenin
    alakasız 2027 tarihleriyle dolduğunu gösterdi: geçmiş seçimi yorumlayan
    haberlerdeki "27 Ekim" ertesi yıla atılıyordu. Sonra liste bugün tarihli
    haberlerle doldu: özetin başındaki yayın tarihi ("Nov 9, 2026 —") olayın
    günü sanılıyordu; haberin kendi günü ve bugün aday olmaz, yarından sonrası
    olur. Bugünden önceki ve
    `UFUK_GUNU` 180 günden ileri tarih alınmaz. Aday bulan kuralın sürümünü
    taşır (`KURAL_SURUMU`); eski sürümün karar bekleyen adayı listede
    görünmez, ilk taramada kayıttan atılır (`adayTemizligi`). Aynı gün aynı olayı veren haberler tek aday
    (`benzer`, haber sayısı); takvimde aynı gün benzer adlı faaliyet ya da
    önceki aday (kararı ne olursa olsun) varsa yazılmaz, "ilgisiz" denen geri
    gelmez; günü bir aydan çok geçen aday atılır. Takvime kendiliğinden
    girmez: takvimi düzenleyene sayfa başında "Bulunan faaliyetler · n"
    (`takvim/Bulunan.tsx`, yalnız bekleyen varken), pencerede tarih, tür,
    ülke, kaynak ↗; "Takvime ekle" faaliyet formunu haberden dolu açar
    (`FaaliyetFormu taslak`, notta kaynak ve bağlantı), kaydedince aday
    "eklendi" (`takvimAdayiKarar`); "İlgisiz". Demoda Gündem'i yalnız tam
    yönetici açtığı için sistemin açılış işi örnek akıştan bir kez doldurur
    (`demoTakvimAdaylari`; `ornek.ts` gündemi yüklerse modül döngüsü açılışı
    bozuyordu). Sonraki katman: yapay zekayla ayıklama ve haftalık internet
    taraması. Test `testler/takvim-botu.cjs`.
- Kimlik `belgeler/kimlik.md`: konum (Newsroom Operations Platform), üç soru
  (şu an ne oluyor, kimde bekliyor, sıradaki ne), ilkeler, renk/yazı sistemi,
  ses ve yapılmayacaklar. Tasarım kararları ona dayanır; çelişen istek gelirse
  önce belge güncellenir.
- Yeni tasarım (kullanıcı: Linear'ın görünüşü, Monday'in işlevi;
  `belgeler/kimlik.md`): varsayılan (kullanıcı); eski tasarım silinmeden
  yanında, Ayarlar'da "Eski tasarıma dön" ve avatar menüsünde; seçim tarayıcıda
  (yalnız "eski" yazılıysa eskisi). Eski tasarımın sayfalarını sınayan testler
  "eski"yi kendisi yazar
  (`tasarimSecimi.ts`, `trt-planlama-tasarim`), açıkken `<html>`'de
  `yeni-tasarim` sınıfı (ilk çizimden önce, `main.tsx` içe aktarıyor).
  Bütün değişiklik `tasarim.css`'in sonundaki `html.yeni-tasarim` bloğunda:
  kimliğin token'ları (nötrler, tek mavi, planların renkleri lacivert,
  durum renkleri, gölgesiz 8 piksel kart, 12·13·15·17·20·28 ölçeği, Arapça
  içerik Naskh), açık zeminli menü (logo `koyu={!yeniTasarim}`), sade
  kısayollar, üst çubukta GMT/İstanbul saati (`UstCubuk.tsx → UstSaat`,
  IBM Plex Mono), lacivert birincil düğme, sağdan açılan pencere, şeritsiz
  öneri kartı. Sonraki adımlar sayfa sayfa (durum dairesi, grup + sütun
  tablosu, Liste/Pano görünümü, klavye). Beğenilirse token'lar `:root`'a
  taşınır, eski blok ve anahtar kalkar. Test `testler/yeni-tasarim.cjs`.
  - Tasarım dili (kullanıcı: Ayarlar'da tema olsun ama renkten çok tasarım dili;
    öbür uygulamasının "kâğıt" ekranlarını gösterip "renk tonlarını çek, uyarla"
    dedi): Ayarlar › "Tasarım dili" üç seçenek, her biri kendi küçük örneğiyle
    (`Ayarlar.tsx → TasarimAyari`, `.tasarim-ornek`): Yeni (varsayılan), Paper,
    Eski (`tasarimSecimi.ts → TasarimDili`, `tasarimDiliKaydet`,
    `useTasarimDili`; aynı anahtar `trt-planlama-tasarim`, değer "paper").
    Paper yeni tasarımın düzeni üstüne `<html>`'de `paper` sınıfı; bütün
    değişiklik `tasarim.css`'in sonundaki `html.yeni-tasarim.paper` bloğunda,
    değerler ekranlardan: kâğıt zemin #f3efe7, krem kart, kahverengiye çalan
    mürekkep, kiremit vurgu #c4623f (birincil düğme, seçili menü), hardal uyarı,
    yaprak yeşili iyi, 3 piksel köşe, hafif kâğıt gölgesi, yazı serif (Source
    Serif 4; Arapça arayüz Naskh), küçük etiketler aralıklı büyük harf. Planların
    renkleri mürekkep. Avatar menüsündeki eski/yeni geçişi Paper'ı yeni sayar.
    Tema rengi ayrı kalır (renkli kabuklarda). Test `testler/paper.cjs`.
    Dördüncü dil "Logo yeşili" (kullanıcı: logonun yeşiliyle, yeşile boğmadan, kararında; iki
    ajana onaylatıldı): `<html>`'de `yesil`, blok `html.yeni-tasarim.yesil`. Renkler logodan
    ölçüldü: yeşil #389480 (`--marka-yesil`, yalnız süs ve simge), yazıdaki vurgu bir tık koyusu
    #237a68, petrol `--petrol` #0e4250, mürekkep #0f1d2b. Yeşil yalnız: seçili menü (sis ve başta
    3 piksel çizgi), birincil düğme (yeşilden petrole geçiş; varyantlar dışarıda, `:not(...)`),
    üst çubuğun bitişinde 1,5 piksel şerit (RTL'de yansır), "Sıradaki" kartının ve staffing
    şeridinin başında ince çizgi, kart başı simgesi, asistan düğmesi. Durum yeşili markayla
    karışmasın diye zeytin (`--iyi` #3d7524), süren paket, şimdiki adım ve bilgi rozeti mavi
    (`--bilgi` #2f63a8), geçilen adım petrolün %60 soluğu, görevlendirilmiş sayısı nötr; WhatsApp düğmeleri nötr, gün daireleri nötr.
  - Planlama'nın yeni mimarisi bu anahtarın arkasında (kullanıcı: ana sayfa
    çok işlevsel olsun, planların iç akışı sürsün ve iyileşsin, muhabirle
    iletişim ve raporlama pratikleşsin; iki tur ajan görüşü, brifing ve ham
    notlar `belgeler/planlama-yeni-mimari.md`, aşamaları orada). Kapsam
    `AnaMenu.tsx → planlamaYeniMi`: anahtar açık, izinlerde Planlama (onun
    "gibi" çalışan birim de) ya da tam yönetici (kullanıcı isteği; önce eski
    menüde kalıyordu); kademedeki müdür panelinde. Tam yöneticinin ana sayfası
    kademede dursa da kutulu sayfa (`AnaSayfa.tsx`), yönetici paneli menüde;
    eski menüde görüp Planlama menüsünde olmayan sayfaları (Muhasebe, proje
    planı, masalar, başlıklar…) Yönetim grubunun sonunda (`planlamaMenusu`).
    1. aşama:
    - Sayıların tek kaynağı `planlamaKararlari.ts` (`kararlariGetir`: kayıt
      nesnesine bağlı önbellek, menü, alt çubuk ve ana sayfa aynı sonucu
      okuyor). Menüdeki öneri sayısı artık her düzende Öneriler'in "Karar
      bekleyen" sekmesinin kuralı (önce yalnız "yeni"yi sayıyordu).
    - Menü `planlamaMenusu` (`birimMenusu`, masaların menüsüyle aynı çizim,
      `data-birim-menusu`): Planlar, Gelenler, Paketler (Üretim panosu
      yönetici ve stok ekibinde), Ekip, Yönetim (yöneticide); katlanmaz,
      sayı yalnız kararda. Kalkan sayfalar aramada ve adresle. Rengi
      camgöbeği (`--masa-planlama`), yalnız birimin kabuğunda. Telefonda alt
      çubuk Ana sayfa, Öneriler, Next Day (doğrudan `#/nextday/yarin`), Posta
      (okunmamış sayısıyla; kullanıcı onayladı: gün içinde en sık dönülen yer,
      Muhabirler Menü'de ve kişi çipinden); Menü panelinde kısayol kutuları
      yok, Ayarlar satırı var (birimin menüsünde Ayarlar alttaki ayrı satırda,
      panelde hiç yoktu). Üst çubuk kısayolları şimdilik yerinde.
    - Ana sayfa `ekranlar/yeni/PlanlamaAna.tsx`: kutular (başlık, büyük sayı,
      tek satır durum; yeri sabit, boşken sönük). Kısa karar kutuları
      (karar bekleyen öneriler, paket kararları [onay kuyruğu, şartlı, görev
      talebi], birim görüşleri, görevlerim, anmalar, muhabirler,
      hesap onayı) sağdan açılan pencerede (yeni tasarımda `Pencere` zaten
      sağdan), içinde var olan bileşenler; öneri kartına basınca önerinin
      penceresi üstüne açılır, kapatınca panele dönülür, geri tuşu paneli
      kapatır; altta "Sayfayı aç". Uzun işler (Next Day, Weekly, Aylık, Özel,
      Posta) kendi sayfasına götürür. Kullanıcı modal düzeni sordu: kısa
      kararlar için uygun, uzun işler için değil (iç içe pencere, dar alan).
    - Kişi çipi `bilesenler/KisiCipi.tsx` (her düzende): ada basınca kart
      (şehir, ünvan, bugünkü durum, açık işler, WhatsApp, posta, kişinin
      sayfası); `KisiIletisim` yalnız düğmeler. Öneri penceresinin kişi
      satırı, paket sayfası, onay kuyruğu, masaların içerik kartı. Kısıtlı
      kişi yalnız adı görür. Kurallar `muhabirIletisim.ts`: tek adres kuralı
      `muhabirAdresi` (kurumsal, yoksa kişisel; PKG geri bildirimi, muhabire
      geri bildirim ve iş postası onu kullanıyor), `kisiBugunDurumu` (onaylı
      izin ve saha kaydı kişideki sabit alandan önce), `kisiOzeti`. Posta
      penceresi `posta/Posta.tsx → IsPostasiPenceresi` (açılır kart kapanınca
      gitmesin diye ayrı). WhatsApp'a basış kaydedilmez.
      E-postayla gelen önerinin penceresinde ve yolunun kimde satırında
      muhabirin posta düğmesi yanıt (kullanıcı: yeni posta değil, muhabirin
      gönderdiği postaya yanıt gitsin; `muhabirIletisim.ts → oneriPostaYaniti`,
      `KisiIletisim yanit`, `data-is-postasi="yanit"`): kime postayı gönderen
      adres, konu "RE: …", yanıtın Message-ID'si kapıda InReplyTo/References
      (`postaGonder yanitlanan`), giden balon postanın Posta'daki sohbetine.
      Kapı yanıtlananı gönderenin gelen kutusunda Message-ID'siyle bulur ve
      EWS `ReplyToItem`'la gerçek yanıt gönderir (`ews.ts → yanitIstegi`,
      `kutudaBul`; kullanıcı: yalnız InReplyTo'lu yeni posta ayrı posta
      olarak gitti, Outlook sohbeti ConversationIndex'ten kuruyor); konu
      sunucunun "RE: …"su, eski metin altta alıntı; hatırlatma da öyle.
      Kutuda yoksa ya da yanıt reddedilirse InReplyTo'lu yeni posta.
      Test `testler/oneri-posta-yanit.cjs`.
    Test `testler/yeni-planlama.cjs`.
    2. aşama (kişi çipinden sonrakiler de yalnız yeni tasarımda, kısıtlı
    olmayan kişide):
    - Önerinin yolu (`oneriYolu.ts`, saf): geldi → değerlendirme → plan ya da
      gündem → PKG → muhabirde → sonuç; plandaki kayıt ve paket doğru kaynak,
      önerinin durumu yalnız karar aşamasında. Paketsiz plana giren öneri
      planla biter. "Kimde" (Planlama, masa sorusundaki birim, teklif ve
      düzeltmede muhabir, paketin `gorunenSahip`'i) ve "ne zamandan beri"
      (öneriye ya da paketine düşen son hareket). Ekranda
      `bilesenler/OneriYolu.tsx`: kartta etiketsiz şerit (ipucunda adım,
      kimde, süre), pencerede adlı çizgi (`data-yol-adim`, `data-yol-durum`),
      plan adımı başlığa, PKG ve sonuç paketin sayfasına; altında kimde
      satırı (kişiyse `KisiCipi`).
    - Öneriden başlığa (`bilesenler/baslikaGit.ts`): plan açılır, başlık ve
      üstündeki kapalı bölümler açılıp kayılır, bir an vurgulanır
      (`.hedef-vurgu`); hedef sekmede (hash sorgu taşımıyor), plan zaten
      açıksa olayla. Yolun plan adımı ve pencerenin "Plana eklendi" notu
      (`PlanaEklendiNotu bagli`) bunu kullanır, pencereyi kapatarak.
    - Plandan öneriye (`oneri/OneriyiAc.tsx`): Next Day'de `oneriId`'li
      gelişme, PKG ve canlı satırında öneri simgesi (`data-plan-oneri`; plan
      ekranı ve belge), basınca önerinin penceresi.
    - Kişi çipi `sade` (yalnız avatar; satırda ad zaten "YER / ad"): Next Day
      başlığının muhabirleri, PKG satırı, Weekly kalemi. Çıktıda yok.
    - Muhabirin "Şimdi"si (`muhabirDosyasi.ts`, `bilesenler/MuhabirSimdi.tsx`;
      profilin başında, kendisi hariç): sırası bizde, sırası onda (yoldan;
      önerisiz paket de), bugün ve yarın planda (başlığa götürür), takipleri;
      başlıkta önümüzdeki 7 güne düşen izin ve son yazışma.
    - Durum rozeti her düzende kayıttan (`KisiDurumRozeti`, `kisiBugunDurumu`):
      personel ve muhabir listesi, profil. Önce kişideki alan, izindeki
      muhabir "görevde" görünüyordu.
    Test `testler/oneri-yolu.cjs`.
    3. aşama:
    - Muhabir raporu (`muhabirRaporu.ts`, `ekranlar/yeni/MuhabirRaporu.tsx`;
      yeni tasarımda Raporlar'ın ilk sekmesi, "Genel" eski rapor): ay seçici
      (`useAdimDurumu`), bir önceki ayla fark (▲▼), başlığa basınca sıralanan
      tablo (öneri, kabul oranı, verilen, biten, yapılmayan, çağrıya yanıt,
      son iş). Dış ve iç muhabirler, işi olmayan soluk; ada basınca kişi
      kartı. Biten iş Muhasebe'nin kuralıyla (`muhasebe.ts → muhabirIsleri`:
      paket, "yapıldı" canlı, nafize), iki sayfa ayrışmasın; kabul oranı
      kabul / (kabul + ret), takip sayılmaz. CSV ekrandaki tablo, sırasıyla.
      CSV ortak `csv.ts → csvMetni` (BOM; Türkçede noktalı virgül): Raporlar
      ve Muhasebe kullanıyor, Muhasebe önce her dilde virgül yazıyordu.
    - Toplu iletişim (`bilesenler/TopluIletisim.tsx`): Dış muhabirler
      listesinde seçim kutuları (`data-toplu-sec`, "hepsini seç"), yapışık
      çubukta "Posta · n" ve WhatsApp. Posta adresleri BCC'de
      (`posta/Posta.tsx → TopluPostaPenceresi`; Kime boş kalabilir, kapı
      grubu Kime'ye yazar), en çok 49 adres. WhatsApp tarayıcıdan toplu
      gitmez: metin bir kez yazılır, her kişinin düğmesi sohbeti metin yazılı
      açar (`WhatsAppDugmesi metin`, `whatsappAdresi(telefon, metin)`);
      basılanlar yalnız pencerede işaretli, kaydedilmez.
    - Şartlı kabule isteğe bağlı son gün (`HaftalikKalem.kosulSon`,
      `Paket.kosulSon`; koşul formunda, `kalemKarar(…, kosulSon)`,
      kesinleşince pakete): "Şartlı kabul bekleyenler" son günü yakın olanı
      önce gösterir, geçeni kırmızı (`data-kosul-son`). Kendiliğinden karar
      vermez.
    - Aylık olaydan özel yayın (`aylik.ts → olaydanOzele`,
      `eylemler.ts → aylikOlaydanOzel`): PKG ve Walk & Talk satırı o günün
      yapılacak maddesi (muhabiriyle; içerik özel yayının İçerik sekmesinden
      görevlendirilir), LIVE ve نافذة nafize (o gün), öbür satırlar günüyle,
      ekip ve görevlendirme günsüz yapılacak madde. Önce yalnız ad, gün ve açıklama
      geçiyordu.
    - Çok günlü aylık olay Weekly'de gün gün (`aylikOlayiGundemeEkle`): haftaya
      düşen, satırı olan her kapsam günü kendi kalemi, o günün satırlarıyla;
      tek günde eskisi gibi tek kalem.
    Test `testler/planlama-3.cjs`; şartlı kabulün son günü `sartli-kabul.cjs`.
    4. aşama, masaüstü ana sayfa (kullanıcı: ortada rastgele kutular, alan iyi
    kullanılmıyor; sabit sayfa, bütün alan dolu, sağdan/soldan açılan panel yok,
    açtıkça yerinde büyüsün; beş tasarımcıya danışıldı, ortak öneri; `ekranlar/yeni/
    AnaPano.tsx`, kurallar `anaPano.ts`): 961 pikselden genişte `PlanlamaAna` panoyu
    çizer, dar ekranda kutular ve sağ panel (mobil denetimde onaylı) kalır. Üstte
    bugünün zaman çizgisi (GMT, başlıkta yazılı; 04–21, toplantılar, yarının çağrısının
    son saati, canlılar kayıttaki GMT saatiyle, "şimdi" çizgisi; kullanıcı: 16 GMT girilen canlı
    İstanbul'a çevrilip dilimsiz "19:00" görünüyordu; `anaPano.ts → gunOlaylari`; test
    `testler/zaman-cizgisi.cjs`; `gunOlaylari`, `siradakiOlay`: "Sıradaki: X · 2 sa
    sonra", bir saatten azsa kırmızı). Altında üç sütun (1400 altında iki: kararlar
    solda, öbürleri sağda alt alta); sayfa ekranı doldurur, sütun kendi içinde kayar
    (720 piksel altında sayfa uzar). Sıradaki kararlar tek kuyruk (`kararKuyrugu`:
    karar bekleyen öneri, birimin yanıtladığı soru, "Yapıldı" onayı, şartlı kabul, görev
    talebi, anılan not, kayıt onayı; "Bugün ve yarın" önce, son gün ve bekleme
    süresine göre): satır yerinde açılır, aynı anda bir satır, Esc kapatır, j/k gezer;
    öneri `OneriAyrinti yerinde` (pencere değil, karar verilince satır kapanır), onayda
    masraf ve sonuç düğmeleri, şartlıda kabul/ret, talepte `TalepSatiri`. Planlar:
    Next Day (başlık sayısı, kararsız PKG, çağrı yanıtı; başlıkları yerinde açılır,
    toplantıdaysa toplantı görünümü), Weekly, Aylık, Özel, önümüzdeki 7 günün takvimi,
    üretimdeki paketler (`uretimdekiler`: aşama · kimde · süre, `UZUN_DAKIKA` 180'i
    aşan turuncu). Muhabirler: çağrıya yanıt vermeyenler (`cagriDurumu`, WhatsApp),
    sahada ve izinde olanlar, okunmamış posta iplikleri. Kişisel alan ("+" ile kendi
    kutuları) sonraki adım. Üst çubuktaki saat 1100 pikselden dar çubukta gizli
    (1280 ekranda avatarı dışarı itiyordu). Test `testler/ana-pano.cjs`.
    5. aşama, öneri akışı (kullanıcının çizimi: ham öneri, görevlendirilmiş, takip,
    arşiv · öneri, arşiv · paket; telefonda bütün temel girişler tek ekranda):
    her kutu açtığı sekmenin kuralıyla sayar (`anaPano.ts → oneriAkisi`; kullanıcı:
    arşiv kutuları "Haber önerileri", "Haber paketleri"ne düşüyor, zorlama
    birliktelik gibiydi): ham öneri Öneriler › Karar bekleyen (menüyle aynı), yanında
    "sırası başkasında"; görevlendirilmiş Paketler › Görevlendirilmiş
    (`#/paketler/gorevli`, `paketSekmeleri.ts`, Paketler'in gördüğü paketler),
    geciken paketin gününden; takip Takiplerim'in kuralı; arşivler sekmesinin ilk
    grubu, son 7 gün (`ARSIV_PENCERESI`; Öneriler › Arşiv `#/oneriler/arsiv`,
    Paketler › Arşiv `#/paketler/arsiv`), paket arşivinde "yapılmadı" sayısı.
    Masaüstünde zaman çizgisinin altında ince şerit (`AnaPano.tsx → OneriSeridi`,
    `.ap-serit`, her kutu kendi sekmesini açar); zaman çizgisi, Sıradaki ve üç sütun yerinde (kullanıcı:
    yerli yerindelik bozulmasın, Sıradaki masaüstünde kalsın). Telefon ve tablette
    `KutuluAna` tek ekran (`.py-tek`, Sıradaki yok): Öneriler (ham öneri satırı panel
    açar, altında akışın dört kutusu), Kararlar ve işlerim (paket, birim görüşü,
    görevlerim, anmalar, varsa hesap onayı; küçük sayı kutuları, panelde), Planlar
    2×2, Ekip (muhabir paneli, Posta, Takvim). iPhone 13'te (görünür 664 piksel,
    prototip şeridiyle) kaydırmasız. Test `testler/oneri-akisi.cjs`.
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
  İstisnalar: tanıtım sayfası (işi sistemi anlatmak), eğitim sahnesi ve muhabir kılavuzu
  (kullanıcının isteği; `ekranlar/ana/MuhabirKilavuzu.tsx`): muhabirin
  Ayarlar sayfasının altında katlanır kart, ilk girişte açık, kapalılığı tarayıcıda
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
    cümle çubuğun altında şerit (`Kabuk → .demo-serit`); şerit nötr renkte ve
    12 piksel (kullanıcı onayı; sarı ve kalındı, ilk ekranı kaplıyordu).
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
  - Muhabirin ekranı masaların kalıbıyla (kullanıcı: "muhabir sayfasının tasarımı
    program birimi gibi"; önce en sade haliydi, ana sayfa yoktu; `ekranlar/ana/
    Muhabir.tsx → MuhabirCerceve`): kendi rengi turuncu (`.masa-muhabir`,
    `--masa-muhabir*`). Ana sayfa ve bölüm sayfaları (Yapılacaklar, Önerilerim,
    Takiplerim, Haberlerim, Görevlendirmelerim; `App.tsx` sarar) beş kutucuğun
    altında (`data-mb-kutu`, bağlantı, sayısıyla); telefonda bölüm sayfasında
    kutucuklar gizli. Ana sayfa kutucuklar ve Yapılacaklar. Menü gruplu
    (`AnaMenu.tsx → muhabirMenusu`, `birimMenusu` tür "muhabir"): Ana sayfa ve
    Öneri gönder; İşlerim (Yapılacaklar, Önerilerim, Takiplerim,
    Görevlendirmelerim); Yayınlananlar (Haberlerim); Ayarlar altta. Birim kutusu
    yok; adı ve ünvanı sayfanın üstünde ince satırda (`Kabuk → .muhabir-adi`).
    Üst çubukta sekme, "+" ve kısayol yok; zil kalır, yeni bildirimde ses
    (`bilesenler/Ses.ts`, Ayarlar'da açılıp kapanır, tarayıcıda
    `trt-planlama-ses`). Sayaç, çağrı ve bildirim kartı yok (çağrı bildirim
    olarak gelir). Test `testler/muhabir-sayfasi.cjs`.
    - Yapılacaklar (`#/yapilacaklar`, `SAYFA_IZNI` yalnız muhabir; kurallar
      `yapilacaklar.ts`, saklanmaz; kullanıcı: öneri paket görevine dönünce
      yapılacaklara düşsün, bugün, yarın ve yakın gelecek; yapım aşamasındaki
      işler buradan izlensin): muhabirin onaylı ve üretimdeki paketleri (özel
      yayın görevi dahil, görevi verilmemişi değil), paketin teslim günüyle
      (`surenPaketGunu`) Geciken, Bugün, Yarın, Yakında (7 gün), İleride; teslim
      günü yoksa sonda "Teslim günü belirlenmedi" (önce son değişikliğin günüyle
      "Geciken"di). Satırda
      gün, teslim, şimdiki aşama ve sıra başkasındaysa birimi, paketin yolu
      çubukta (`AsamaCubugu`); sıra muhabirdeyse adımın düğmesi (sonuç
      bildirme, metin/video), değilse "İzle". Menüde ve alt çubukta sayı:
      bugüne dek sırası muhabirde olan iş (`bugunkuYapilacakSayisi`).
    - Tema rengi (Ayarlar; `tema.ts`, kullanıcı): renkli kabuğu olan kişide
      (muhabir, masalar, Planlama'nın yeni menüsü) birimin rengi yerine seçilen
      renk (menünün etkin maddesi, kutucuklar, seçimler); "Birimin rengi" geri
      döner. Tarayıcıda (`trt-planlama-tema`), `<html data-tema>` ve `--tema*`;
      planların ve durumların renkleri değişmez.
    - Önerilerim: Güncel sekmesinde "Senin sıran" (teklif, düzeltme isteği,
      sonucu bildirilecek paket, özel yayın görevi; plana girmiş öneri de,
      onaylı paketi yoksa ve planın günü geçmemişse: gün öneride,
      `Oneri.planTarihi`, kısıtlı muhabir planı okuyamıyor), anıldığı notlar
      başta, Yakında (günü iki gün
      içinde) ve İleride; Arşiv'de Kabul edilmeyenler ve Tamamlananlar
      (`oneriPlanlari.ts → muhabirBolumu`; "yapılmadı" onaylı paket kabul
      edilmeyende). Önerisiz paket (plana doğrudan girmiş) de arşivde: iptal
      olan kabul edilmeyenlerde, tamamlanan tamamlananlarda (paketin
      sayfasına gider). Takip burada değil, Takiplerim'de.
    - Haberlerim (`#/paketler`, `MuhabirHaberlerim`): tamamlanan paketlerin
      yalnız başlıkları, önerinin (yoksa paketin) sayfasına gider; paketsiz
      plana giren haber tamamlanmış sayılır ama burada yok. Aylık, haftalık
      (Cumartesi başlar) ya da tek liste gruplanır (kullanıcı; `data-haber-grup`,
      `useAdimDurumu`), en yenisi önce.
    - Takiplerim'de kendi takibine "Öneriye çevir" (`eylemler.ts →
      takipOneriyeCevir`: strap, haber türü, gün; satırlar gelişmeye eklenir,
      öneri "yeni"). Çevrilmeyen takip son satırından 2 gün sonra izleriyle
      silinir (`eskiTakipleriSil`, sistemin açılış işi; `TAKIP_SILME_GUNU`).
      Öneriye dönüşmüş takip (aynı muhabirin aynı Header'lı, sonradan açılmış
      önerisi; Planlama onun adına elle girince ayrı kayıt doğuyor,
      `oneriPlanlari.ts → takibinOnerisi`) listelerde ikinci kart olmaz,
      açılış işi satırlarını öneriye katıp takibi siler.
    - Görevlendirmelerim'de yalnız saha görevlendirmeleri; özel yayın görevi
      Önerilerim'in "Senin sıran"ında.
    - Ayarlar'da kişisel bilgiler (profile bağlantı), çalışma günleri
      (`Kisi.calismaGunleri`, `eylemler.ts → kisiCalismaGunleri`), ses ve
      kılavuz. İstatistik sonra.
    - Telefonda alt çubuk Ana sayfa, Yapılacaklar, Öneri gönder, Önerilerim,
      Menü (`AltCubuk.tsx → MUHABIR_SEKMELERI`; Takiplerim ve Haberlerim
      kutucuklarda ve Menü'de); Menü paneli muhabirin
      menüsünü gösterir (`data-mobil-muhabir`).
    - Temel, geri dönülemeyen ya da yöneticinin düzeltmesini gerektiren
      adımda (öneri ve takip gönderme, düzeltip yeniden gönderme, öneriye
      çevirme, teslim, davet) "Emin misin?" sorulur (`eminMisin`).
  - Dil denetmeninin ekranı da en sade hali (kurumun isteği; `yetki.ts →
    dilDenetmeniMi`: görevi dil denetmeni, yönetici değil): ana sayfası
    `ekranlar/ana/DilDenetimi.tsx`, sırası gelen (dil durağındaki) metinler
    düzenlenebilir alanda, "Düzelt ve gönder" düzeltilmiş metni pakete yazıp
    işi sonraki durağa geçirir (`adimIlerle(…, { metin })`). Menüde yalnız bu
    sayfa (sayısı `dilSirasi`) ve Ayarlar; üst çubukta sekme ve kısayol yok,
    telefonda alt çubukta yalnız Menü. Başka ayrıntı yok.
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
- Mobil denetim (kullanıcı: altı uzman ajanla kapsamlı denetim, yeni tasarım
  üzerinden; birleşik rapor `belgeler/mobil-denetim.md`, M-01…M-69, Konsept
  A "Sakin liste" onaylandı, yol haritası beş adım). 1. adım: yeni
  tasarımda `.dugme-yumusak` açıkça tanımlı (lacivert `.dugme` onu eziyor,
  "Sıradaki" düğmesi 1,72:1 okunmuyordu); menünün zemini (gradyan) yalnız
  961 pikselden genişte ve menü açıkken (telefonda 244 piksellik iki tonlu
  zemin kalıyordu); girdi kenarı `--cizgi-girdi` #868fa0 (3,26:1; `--cizgi`
  1,24:1); ⋯ menüsü (`IslemMenusu`) altta yer yoksa yukarı açılır, iki
  yönde de sığmazsa kısalıp kayar (öneri penceresinin ⋯'si Pixel 7'de
  ekranın altında kalıyordu, kararlar verilemiyordu); tam boy pencerede
  gövde alanı doldurur, alt satır dipte; telefonda bildirim alt çubuğun
  üstünde; gönderilen öneri formu geçmişte kalmaz (`yerineGit`); Posta'nın
  "← Sohbetler" düğmesi biçimli ve 44 piksel. Test `testler/mobil-1.cjs`
  (iPhone 13 ve Pixel 7, Türkçe ve Arapça).
  Akış önerileri (kullanıcı onayladı): ana sayfanın "Karar bekleyen" paneli
  plan ekranlarının listesi (`OneriListesi`, `ekleFormu`'suz: "Plana ekle"
  önerinin günlerine düşen planları sorar), kartta "Plana ekle" ve ret
  simgesi; pencerede verilen karar (plana ekle, reddet, düzeltmeye gönder)
  pencereyi de kapatır, vazgeçilen form kapatmaz (`OneriGovde.tsx →
  kararIzi`: önerinin durumu, plandaki yeri, planı ve paketi); telefonda
  klasik Next Day başlık kartında tek satırlık gelişme (`BaslikKarti.tsx →
  HizliGelisme`, "YER / metin", Enter ya da ➤; Yeni görünümün hızlı
  satırıyla aynı kural). Test `testler/mobil-akis.cjs`.
  2. adım, geri tuşunun tek kuralı: üstte açılan her şey geçmiş adımı,
  geri tuşu onu kapatır (`yol.ts → useGeriKapatir`, pencerenin
  `pencereAdimi`'si): Menü paneli (açıkken sayfa `inert`, odak panelde),
  telefonda zil, avatar ve prototip panelleri, arama, telefonda Posta'da
  açık sohbet ("← Sohbetler" de `history.back()`). Katmandaki bağlantı
  `katmanBaglantisi`/`penceredenGit` ile: önce katman kapanır, sonra
  gidilir, geçmişte boş adım kalmaz. Telefonda üst çubuk paneli açıkken
  saydam perde (`.ust-perde`, body'de: çubuk CSS kapsayıcısı, içindeki
  sabit öğe ekranı kaplamıyor): dışarı ilk dokunuş yalnız kapatır, alttaki
  bağlantıyı çalıştırıyordu. Posta yanıtı sohbete bağlı taslak
  (`sessionStorage`, `trt-planlama-posta-taslak:<konu>`), gönderince silinir.
  Test `testler/mobil-geri.cjs`.
  3. adım, ölçek ve dokunma: yeni tasarımın puntoları rem (tarayıcının yazı
  büyütmesi uyar; piksel puntolar büyümüyordu); telefonda roller bir basamak
  büyür (gövde 15, meta 13, satır başlığı 17; ölçek kimliğin aynı 12·13·15·
  17·20·28), Arapça içerik en az 16, Arapça arayüz yazısı en az 13; iç içe
  `small` küçülmez. Avatar nötr (`--yuzey-3`/`--sonuk`, harf en az 11;
  kişi başına ton durum renkleriyle karışıyordu). Dokunma kuralları
  `(pointer: coarse)` için de (yatay telefon ve tablet tablet düzeni
  alıyordu): düğme ve ikon düğmesi 44, onay kutusu ve radyo 24, geri
  bağlantısı 44; Organizasyon'da kişinin satırı bağlantının dokunma alanı.
  Test `testler/mobil-olcek.cjs`.
  4. adım, Konsept A sayfa yerleşimleri (ilk parti): Öneriler telefonda
  arama ve "Süzgeç · n" tek satır (`Oneriler.tsx → useTelefon`), masa,
  ülke, plan ve görünüm pencerede, etkin süzgeç kaldırılabilen çip, sekmeler
  yapışkan (ilk öneri 565 pikselden ~400'e); telefonda sayfa başlığının ikon
  karosu yok; birincil "Plana ekle" lacivert (yeşil yalnız durum); yeni
  tasarımda kapalı katlanır kart 48 piksel; Planlama ana sayfasında boş kutu
  (Görevlerim ve Posta da) adı ve kesik çizgi (aşağıda, delik bırakmadan), vurgu yalnız
  sayıda, başlık iki satıra kırılır; masa sayfasının bölüm adresinde
  (`#/programlar/oneriler`…) telefonda kutucuklar yok (alt çubuğu
  tekrarlıyordu); muhabirin öneri formunda içerik alanları önde (CSS
  `order`), telefonda Gönder yapışık, pasifken eksik alanlar yazılı, basınca
  ilk eksiğe gider; Dış muhabirler telefonda iki satırlık satır (263 → 85
  piksel; performans sayıları profilde), WhatsApp ikincil; Next Day başlık
  kartında sıfır sayaç çizilmez (sayacın adı ipucunda), telefonda sırala ve
  çıkar ⋯ menüsünde (`.telefon-satiri`); Weekly listesinin anlatım kartları
  kalktı (ekranda kullanım anlatımı yok). Test `testler/mobil-sayfa.cjs`.
  İkinci parti: Next Day'in gelişme ve PKG formu telefonda asıl alanla başlar
  (gelişmede metin ve yer, PKG'de Strap ve muhabir), öbürleri "Diğer
  ayrıntılar"da katlı (`Formlar.tsx → FormAyrintilari`; doldurulmuş isteğe bağlı
  alan varsa açık, masaüstünde katlanmaz), form açılınca ekrana kayar
  (`useFormaKay`, pencerede değil), `.form-kutu`'nun İptal/Kaydet satırı
  telefonda yapışık (sayfada alt çubuğun üstünde, pencerede dipte). Ekip
  telefonda salt okunur çip (ad, vardiya); düzenleyende dokununca pencere
  (`Bolumler.tsx → EkipUyesiPenceresi`: plandaki ad, vardiya, görev, çıkar;
  her değişiklik hemen kaydedilir). Yeni tasarımda plan adı (`.rozet-plan`)
  çerçevesiz meta metni (kimlik: planlar renkli kutu taşımaz). Muhabirin
  Önerilerim'i tek kart, grup başlıklı (`.muhabir-gruplari`, `.grup-basligi`):
  "Senin sıran" ilk grup, sayısı lacivert dolu; boş grup çizilmez, hepsi boşsa
  tek "öneri yok". Kartın ızgara sütunu `minmax(0, 1fr)`: içeriğe göre açılınca
  uzun Arapça başlık satırları telefonda kartın dışına taşıyordu, başlık görünmüyordu
  (kullanıcı; `testler/muhabir-tasma.cjs`). Test `testler/mobil-form.cjs`.
  Üçüncü parti: telefonda yazı alanı odaktayken (klavye açık) alt çubuk gizli;
  `--alt-cubuk` sıfırlanmaz (düğmeye dokununca önce odak gidip çubuk geri
  geliyor, yapışık Gönder kayıp dokunuş boşa düşüyordu); tarih seçici
  altta da üstte de sığmazsa ekranın içine sabitlenir; öneri kartının yol
  şeridi dokunmatikte (`pointer: coarse`) aynı özetin meta metni
  (`.oy-metin`; ipucu orada görünmüyor); takibe satır ekleyen düğme "Ekle"
  (açan "Gelişme ekle"yle aynı addı); muhabirin takibi açıkken alt çubukta
  Takiplerim vurgulu; `Pencere` açıldıktan sonraki 350 ms gövdesi dokunuş
  almaz (`data-yeni-acildi`; kutuya çift dokunuş panelin ilk önerisini
  açıyordu); Raporlar'da soluk satır opaklıkla değil renkle; az hareket
  tercihinde geçiş ve kaydırma yumuşatması yok. Kısayolun "Special Coverage"
  adı bilinçli (Next Day, Weekly gibi kurumun terimi). Test
  `testler/mobil-ince.cjs`.
  Dördüncü parti, 320 piksel (yazısı büyütülmüş telefon): Öneriler'in arama +
  Süzgeç satırında arama daralır (`.suzgec-telefon .arama-kutu`); `.form` ve
  proje planının adım listesi `minmax(0, 1fr)` sütunlu, telefonda formun alt
  düğmeleri ve adım düğmesi satıra kırılır; paket geçmişinin rozeti kırılır;
  kart başının araçları sığmayınca alta iner (Programlar'ın hafta gezgini);
  proje planının üst satırında logo daralır. Programlar'da Arapça gün adı tek
  harf (`dil.ts → darGunAdi`, tam adı ipucunda `uzunGunAdi`; tarih seçici de
  onu kullanıyor; kısa ad Arapçada tam addı, yedili ızgarada kesiliyordu,
  M-66); yayın planının kağıdı telefonda iç içe kaymaz (M-65). Test
  `testler/mobil-dar.cjs` (isMobile'sız: Chrome sayfayı sığdırıp taşmayı
  gizliyor).
  Planlama ana sayfasının kutuları aralarında delik bırakmadan dolar
  (kullanıcı: boş kutu tek satıra iniyor, yanında ve geniş kutudan önce boşluk
  kalıyordu, "düzensiz"; satır listesi denendi, istenmedi: kutular kalsın):
  boş kutu da öbürleriyle aynı yükseklikte, soluk ve kesik çizgili; tek kalan
  yeri sonraki tek kutu doldurur (`grid-auto-flow: dense`).
- Telefonda kayıt kutusunda (gelişme, paket, canlı…; `.kayit > .kayit-bas`)
  işlem simgeleri metnin üstünde yatay satır, metin bütün genişlikte; başlık
  kartının iç kutularında kenar boşluğu dar (kullanıcı: simgeler yan sütunda
  metni dar şeride sıkıştırıyordu).
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
- Geri (kullanıcı: "geri"ye basınca bazen geldiği yere dönmüyor, başka yerden
  çıkıyordu; `yol.ts`, sonundaki "Geri" bölümü): her tarayıcı geçmişi adımı
  damgalı (`history.state`: kimlik `pf`, uygulama içindeki derinlik `d`).
  Damgasız adım yeni açılmıştır, başa sarılır; damgalıya geri/ileri
  gelinmiştir, bırakılan kaydırma yerine döner (her adımın yeri bellekte;
  içerik geç çizilirse birkaç kare yeniden denenir). Açık katlanır satırlar
  (`main details`) da adımın parçası: çıkarken hangileri açıksa sırasıyla
  saklanır, dönünce önce onlar açılır, sonra kaydırılır (kullanıcı:
  Organizasyon › Kişiler'de kişiye girip dönünce birimler kapalı açılıyor,
  sayfa kısalıp başa düşüyordu). Kaydırma yeri yalnız adres ekrandaki adımın
  adresiyken (`simdikiHash`) ve o adıma (`simdikiPf`) yazılır; tarayıcının
  kendi kaydırma düzeltmesi kapalı (`scrollRestoration = "manual"`): bağlantıda
  ve geri tuşunda adres ekrandan önce değişiyor, o arada gelen kaydırma (başa
  sarma, kısa sayfada kırpma) çıkılan ya da dönülen adımın yerini eziyordu.
  Sayfadaki "←" bağlantısı
  `bilesenler/GeriBag.tsx`: uygulamanın içinden gelindiyse adı "Geri",
  `history.back()` (bölmede `bolmeGeri`); doğrudan açılan sayfada sabit
  listeye (`href`) gider, siteden dışarı atmaz. Önce sabit listeye gidiyordu
  (pakete Ekonomi'den gelinse de paket listesine). `yerineGit` derinliği
  artırmaz, `yerindeDegistir` damgayı korur. Belli bir sayfaya dönen adlı
  düğmeler ("Plana dön", "Panele dön") sabit kalır.
  - Açık pencere (kullanıcı: telefonda geri tuşu pencereyi kapatmıyor,
    sayfadan çıkıyordu): `Pencere` açılınca geçmişe aynı adresli adım ekler
    (`yol.ts → pencereAdimi`, damga kopyalanır); geri tuşu o adımı alınca
    pencere kapanır. ×, Esc ya da kaydetle kapanan pencere kendi adımını
    geri alır, geçmişte boş adım kalmaz; pencereden başka sayfaya gidildiyse
    adıma dokunulmaz. İç içe pencere yığın gibi; bölmede eklenmez. Arama
    penceresi (Ctrl+K) bunun dışında. Pencerenin içinden başka sayfaya giden
    bağlantı `yol.ts → penceredenGit` ile: önce pencere kapanır, geri adımı
    bitince gidilir (bağlantının yeni adresini pencerenin geri adımı siliyor,
    "Sayfayı aç" ana sayfada kalıyordu). Pencere yalnız arka plana
    basınca kapanır, kendi boş alanına değil (`Parcalar.tsx → disarida`):
    tam boy pencerede içeriğin altındaki boşluk da `<dialog>`'un kendisi.
  - Sayfadaki seçimler (kullanıcı: sekme, süzgeç, ay geri dönünce
    sıfırlanıyordu): `yol.ts → useAdimDurumu(anahtar, varsayılan)` seçimi o
    geçmiş adımının durumuna yazar (`history.state.s`); geri/ileri gelinince
    sayfa bırakıldığı gibi, menüden yeni girişte varsayılanla açılır. Anahtar
    sayfaya özgü ("paketler:durum"; aynı bileşeni kullanan sayfalarda
    sayfanın adıyla). Paketler/Feature/Ekonomi/Programlar, Stok, Öneriler,
    Personel ve Dış muhabirler, Görevler, Özel yayın sekmesi, panelin plan
    sekmesi, Aylık, Gündem arşivi, Organizasyon kişileri ve iş akışı seçimi,
    Next Day yan paneli, Posta'da açık sohbet, takvim araması ve süzgeci,
    Muhasebe. Pencere içindeki seçim bununla tutulmaz. Yeni liste sayfasının
    süzgeci de bununla yazılır. Test `testler/geri.cjs`.
- Kod incelemesi (`belgeler/kod-inceleme.md`, Kasım 2026; 26 bulgu, 23'ü
  düzeltildi, üçü nedeniyle bırakıldı). Ondan kalan kurallar: eylem, ekranın
  gizlediği düğmenin koşulunu kendisi de sorar (onaylı aylık plana olay
  yazılmaz, düzenlenen gelişme/canlı/PKG yetkinin sorulduğu planın olmalı, tam
  yöneticinin pozisyonunu yalnız tam yönetici değiştirir); kişi taşıyan açılış
  işleri gerçek kipte yalnız kişi düzenleme yetkilisinin tarayıcısında
  (`App.tsx → kisiTasir`); `yarinPlaniniAc` İstanbul'un yarınından ileri günü
  açmaz; sıralı görevde izin, izin kaydından ve sorulan günden
  (`gorevler.ts → izinde`); birime düşen bildirim "gibi" çalışan birime de
  (`bildirimMi`); kayıttan gelen bağlantı `bahsetme.ts → icYol`'dan geçer.
- Hata sınırı (`bilesenler/HataSiniri.tsx`, `main.tsx`): çizimde fırlatılan
  hata sayfayı beyaz bırakmaz, hatanın metni, "Yeniden yükle", "Ana sayfaya
  dön" ve "Hatayı kopyala" çıkar (normal pencerede beyaz, gizli pencerede
  açık kalan sayfa: tarayıcıda kalan kayıt bozuk bir yola giriyordu). Açılışta
  sistemin işleri (`App.tsx → yokla`) tek tek korumada; biri hata verirse
  atlanır, konsola yazılır.
- Tarih ve saat alanları (`bilesenler/TarihSaat.tsx`; kullanıcı: muhabirin
  öneri formundaki takvim hep Türkçe, plandaki saatler AM/PM): tarayıcının
  kendi `date`/`time`/`datetime-local` kutusu sayfanın dilini değil
  bilgisayarın dil ve bölge ayarını izliyor, ekranlarda kullanılmaz.
  `TarihGirdisi` arayüzün dilinde gün yazan düğme ve üst katmanda açılan ay
  takvimi (hafta Cumartesi başlar; ay ve gün adları `dil.ts`'in biçimiyle,
  Arapçada tek harflik gün adı; `min`/`max` dışı gün pasif; "Bugün",
  zorunlu değilse "Temizle"); yerleşik alan görünmez biçimde yerinde kalır,
  değer, `data-*` ve aria onda (testler ona yazar). `SaatGirdisi` her dilde
  24 saatlik yazı alanı ("SS:DD"; "1430", "9", Arapça rakam `saatCoz`'la
  tamamlanır, geçersizi eski değere döner; yazarken yalnız tam saat
  kaydedilir). `TarihSaatGirdisi` ikisi yan yana. Değer biçimi ve
  `onChange(e.target.value)` yerleşik alanla aynı. Yeni tarih ya da saat
  alanı da bunlarla yazılır. Test `testler/tarih-saat.cjs`.
- Özel yayında konuk listesi: ad kalın, unvan altında sönük, durum rozet gibi
  hap seçici (`.durum-secimi`), ekleme satırı `girdi` alanlarıyla
  (`.konuk-ekle`, telefonda alt alta).
- Ayarlar sayfası başlık satırlarından oluşur (kullanıcı: kartlar bütün
  sayfayı kaplamasın): her `Kart` katlanır satır, basınca açılır
  (`Parcalar.tsx → KatlanirKartlar` bağlamı; sayfa açar, içteki kartlar
  katlanmaz).
- Doğrulama: `npx vite preview` ile açıp 390 piksel genişlikte her sayfada
  yatay taşmanın sıfır olduğuna bakılır, Arapçada da. Uçtan uca testler
  depoda (`testler/`, `testler/calistir.sh`; önizleme açıkken): geçici
  klasördeki eski takım ortam yenilenince silindi, test depoda tutulur.
  `sayfalar.cjs` her birimden bir kişiyle menüdeki her sayfayı açar (hata,
  hata sınırı, 390 pikselde taşma; Türkçe ve Arapça). Gerçek kip Firebase
  emülatörüyle denenir (`belgeler/gercek-kip.md`).
- Örnek veri kurgusal; kurumun belgelerindeki adlar dahil gerçek personel
  adı yazılmaz.
- Yorumlar Türkçe ve "neden" anlatır, "ne" değil.
- Commit iletisi maddeli: kısa başlık, sonra her madde ne değişti ve neden.
- Bir şey yapmadan önce ne yapacağını söyle.
