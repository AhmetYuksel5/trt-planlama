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
  (`varliklar/simge.png`, `simge-180.png`). Kurumun eski logosu arayüzden kalktı (TRT عربي logosu yalnız çıktının baskı tasarımlarında);
  paket ve klip kodlarındaki `TRT-AR`, `TRTA_` kurum kodu, marka değil.
- Haber türü (biçim: PKG, Live, Vox Pop…) kol'dan (haber, feature/ekonomi,
  program) ayrı alan. Kol akışı belirler, biçim ekrana nasıl çıktığını.
- Demoda veri tarayıcıda (`localStorage`, anahtar `trt-planlama-v24`;
  şema değişince anahtar da değişir) ve örnek kayıtla açılıyor. Gerçek
  kipte (aşağıda) kayıt Firestore'da; ekranlar ve eylemler aynı
  `useVeri`/`getir`/`kaydet`'i kullanıyor, fark yalnız `veri.ts`'in
  yükle/kaydet kısmında.
  - Aynı kaydı birden çok kopya paylaşıyor (workspace bölmeleri, sekmeler).
    Her yazış bir iz bırakır (`trt-planlama-v24-iz`); `getir` iz
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
    "Düzenle"de kaydedince ya da "Onayla"yla (`eylemler.ts → kayitOnayla`,
    hareket `kayitOnaylandi`, kişiye bildirim) işaret kalkar. Onay bekleyenler
    kişi düzenleme yetkilisinin ana sayfasının başında (düzenden bağımsız),
    Organizasyon'un her sekmesinin üstünde kart (`bilesenler/HesapOnayi.tsx →
    OnayBekleyenHesaplar`), menüde Organizasyon'un sayısı; önce yalnız
    Hesaplar listesinde rozetti, yönetici bekleyen kişiyi görmüyordu. Kural `kayitGecerli` (açık,
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
  - E-posta listesiyle eşleştirme (kullanıcı: çağrının CC'sindeki muhabir
    adreslerini teker teker girmek istemiyor; `epostaEslestir.ts`, pencere
    `Kullanicilar.tsx → EslestirPenceresi`, Dış muhabirler sayfasının başında
    ve Hesaplar'da; demoda Hesaplar yok). Liste yapıştırılır (virgül, noktalı
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
    Script Editor, Media, Spor), Program, Yönetim ve Dış muhabirler › Muhabir.
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
    Program müdürü (`KADEME_UNVANLARI`); kademeye eklenen ünvan yönetici
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
    alma, onay, onayı geri alma (`ndOnayGeri`: yanlış onaylanan plan toplantı
    aşamasına döner, onayla kabul edilen paketler kabullü kalır; varsayılan
    Planlama yöneticisi, tam yönetici kuraldan bağımsız her zaman; devredilmiş
    plan geri alınmaz, paketler üretimde), devir; Weekly'yi toplantıya götürme/hazırlığa alma,
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
    Kart (`bilesenler/ParcaliMetin.tsx`) paket sayfasında herkese açık, düğme
    sırası gelende; dil denetmeninin sayfasında parça başına kart
    (`dilParcaSirasi`).
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
- Günün notu (kullanıcı: sitenin işleyişinden öğrenip öneri yapan asistan
  istedi; ilk adım yapay zekasız, ücretsiz katman): Planlama ana sayfasının
  ilk alanı (`plGunNotu`, `Planlama.tsx → GununNotu`; kayıtlı düzeni olan
  "Sayfayı düzenle"den ekler). Kurallar `gununNotu.ts`, saklanmaz: günü bugün
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
    bırakıldığı başlığın yerine geçer (`eylemler.ts → planBaslikYerine`).
    Gelişmeler, PKG önerileri ve canlılar hedefin kendi kayıtlarının
    arkasına (kendi sıralarıyla), muhabirler yoksa saat ve yerleriyle;
    bu plandaki öneriler hedef başlığa bağlanır. Pencere kartın dışında
    çizilir (kapalı `<details>` içini göstermiyor).
  - Başlık kartının satırı ve açılınca içindeki kutular her arayüz dilinde
    sağdan sola (`.baslik-karti > summary`, `.baslik-govde { direction: rtl }`,
    kutunun içi arayüzün yönünde): numara başlığın sağında, Gelişmeler sağda.
    Telefonda sayaçlar başlığın altında, düğmeler kenarda 2×2.
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
  - Canlı yayın satırı ("مباشر" ve başlığın altındaki LIVE) "ŞEHİR / saat /
    konu / ayrıntı / muhabir" (kurumun isteği; saat kalın, yoksa "TBC").
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
    (taslak, değerlendirmede) "PKG PROPOSAL"; boş grup yazılmaz.
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
  - Pakete eklenen notlar (`Paket.notlar`: paket formundaki "Not" alanı,
    kimliği `eylemler.ts → formNotuKimligi`, düzenlemede o not değişir;
    not, yönetici notu, durak notu)
    planda paket satırının sonunda parantez içinde (`etiketler.ts →
    paketNotEki`; PKG, başlıksız ve hazır paket; plan ekranı, belge, çıktı).
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
  - Ekip satırında ad uzamasın diye kurum kişinin adını ya da soyadını
    yazar: `Kisi.planAdi` ("ad" | "soyad", yoksa tam ad), `etiketler.ts →
    ekipAdi`; "عبد المنعم", "أبو جهاد" gibi bileşik ad tek parça. Bütün
    planlamacılar seçer (`kisiPlanAdi`, `planDuzenle`): ekip çipinde ve
    belgedeki ekip penceresinde, seçenekler adın kendisiyle.
  - Muhabir hareketleri (تحركات وإجازات المراسلين) belgede ve çıktıda
    "YER / ad / süre / açıklama" (Next Day ve Weekly; kurumun isteği): süre
    tek günse o gün, değilse aralık (`dil.ts → sureYaz`). Tür sözcüğü
    ("مهمة"…) ve "·" ayracı yazılmaz.
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
  sorularak; ret, plana ve gündeme ekleme de onaylı. Öneriler sayfasında "Güncel" / "Arşiv" sekmeleri
  (`#/oneriler/arsiv`; muhabirde kendi ekranı, aşağıda; kılavuzda `kl4g`). Planlama ana sayfası,
  menü ve yönetici paneli sayıları, "Önerilerden al" arşivi saymaz.

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
    satır yönlü (`satirYonu`: ilk güçlü harf Arapçaysa `dir="rtl"` ve sağa
    yaslı, değilse sola; harfsiz satır öncekinin yönünde). Düz metin gövdede
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
    uid'ye bağlı `posta-kimlik:<uid>`, parola tarayıcıya hiç gelmiyor). Her kişi
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
    istemiyor; `src/otoCagri.ts`, kapıda `worker/src/oto-cagri.ts`): Next Day
    her gün 09:00'da ertesi günün planı için, haftalık her Cuma 10:00'da 8 gün
    sonra başlayan hafta için (Perşembe toplantısında görüşülen); İstanbul
    saati, hafta sonu dahil. Gönderen anahtarı açan planlamacı (onun EWS
    kimliği), Kime planning grubu (gönderenin grup adresi), muhabirler BCC'de
    (izinde olmayan, kurumsal adresi olan; elle çağrının varsayılanı), metin
    elle çağrının şablonu (`cagriGovdesi`, `haftalikGovde`, `govdeHtml`; HTML
    gövde, EWS `BodyType="HTML"`), son saat 15:00. Zamanlayıcı Cloudflare Cron
    (`wrangler.toml → [triggers]`, UTC 06:00 ve Cuma 07:00; ifadeler
    `index.ts → CRON_NEXTDAY`, `CRON_HAFTALIK` ile aynı). Kapı veritabanını
    okuyamıyor: gönderenin tarayıcısı önümüzdeki 14 günün çağrılarını hazır
    haliyle (konu, metin, HTML) ve BCC listesini kapıya bırakır (`PUT
    /oto-cagri`, `otoPaketiBirak`; açılışta ve saatte bir, değişmediyse
    yazmaz); şablon tek yerde kalır. Gönderen sessizce değişmez: başkasının
    tarayıcısı yazamaz (409 `baskasi`), "Benim hesabımdan gönderilsin" açıkça
    devralır. Kayıtta çağrısı olan etiket (elle gönderilmiş) ve "Bunu gönderme"
    denen gitmez. Kapı sonucu geçmişe yazar (`oto-cagri-gecmis`); gönderilen
    çağrıyı kayda uygulamayı açan planlamacının tarayıcısı yazar (`eylemler.ts
    → otoCagrilariKaydet`, kimlik `oc-<etiket>`, hareket `cagriHazirlandi`;
    `postalariCek` postayı çekmeden önce de): yanıt ND-/HP- etiketiyle ona
    bağlanır. Gönderilemeyen (kimlik eksik, liste 14 gündür tazelenmedi, EWS
    hatası) gönderene bir kez bildirilir. Anahtar Ayarlar › "Otomatik öneri
    çağrısı" (`ekranlar/posta/OtoCagri.tsx`; gerçek kip, çağrı hazırlayan):
    sıradaki çağrılar, liste tarihi, son gönderimler. Testler
    `worker/test/oto-cagri.test.ts`.
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
  "نرجو منك" + mastar, sonda "غرفة الأخبار ile iletişim") Ayarlar › "PKG geri
  bildirimi şablonu" (`GeriBildirimSablonlari.tsx → TakdirAyari`; konu,
  metin, CC, BCC, varsayılana dön): geri bildirim şablonlarının
  koleksiyonunda sabit kimlikle (`TAKDIR_SABLONU`), o listede görünmez, onlar
  yazılırken düşmez. Değeri boş alanın satırı düşer (notsuz "ملاحظة:" yok).
  Test `testler/takdir.cjs`.
- Deneme sürecinin e-postayla takibi kalktı (tasarım 9. bölüm): yerini
  görev ve "yapıldı" akışı aldı; kodu da silindi ("Takipteki haberlerim",
  "Tamamlandı", "Yalnız takip", ayar). Paketsiz eklemek zaten takip olarak.
  Eski kayıttaki izleri açılıştaki geçiş temizler (aşağıda). `Durum.
  geriBildirimAyari` ve öneri alanları (`takip`, `yalnizTakip`…) yalnız
  eski kaydı okumak için tipte.
- Yeni öneri düzenine geçiş. Kural: eski düzende öneri kalmaz. Sistemin
  açılış işi (`eylemler.ts → eskiOnerileriCevir`, `App.tsx → yokla`) eski
  biçimde ne kaldıysa kendiliğinden çevirir (örnek veri de ilk açılışta);
  Ayarlar'daki kart (yalnız tam yönetici; `KayitYedegi.tsx →
  YeniDuzenGecisi`, eylem `yeniDuzeneGecir`) aynısını önizlemeyle elle yapar.
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
    tek hareket `oneriAsamayaDondu` (`veri.sonuc` hedef), muhabire bildirim.
  - "Başka plana da ekle": öneri ikinci plana girecekse çoğaltılır
    (`oneriKopyala`): kopya değerlendirmeden başlar, `kopyaKaynagi` asılı
    gösterir; plan bağı, takip, satırlar, arşiv, geri bildirim geçmez.
    İkisi ayrıntıda "Bağlı öneriler"de (`BagliOneriler`).
- iNEWS denemesi (GEÇİCİ; Ayarlar, tam yönetici; `ekranlar/InewsDenemesi.tsx`):
  kurumun iNEWS 5.2'sine (iç ağda, `AINEWS`) aktarımın kopyala-yapıştırla
  olup olmadığı deneniyor; olursa bilgi işten FTP istenip otomatik aktarıma
  geçilecek ve kart silinecek. Seçilen Next Day planının paketleri ve canlı
  yayınları slug (`ÖNEK-PKG-<baş harfler>-<saat>-<gün>`, kurumun düzenine
  benzer, elle değişir) ve Arapça metinle; satır başına ve üç toplu biçimde
  (yalnız slug, sekmeli, bloklar, NSML, HTML tablo) kopyalanır. Düz metin
  iNEWS'te satır açmıyor (kendi kopyası özel pano biçiminde, tarayıcı onu
  yazamıyor); NSML ve tablo bunun denemesi. iNEWS'ten kopyalanan panonun
  bütün biçimleri (`text/plain`, `text/html`…) ham haliyle gösterilir. Kayda
  yazmaz.
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
  Plana paketsiz (canlısız) giren her muhabir haberinde hareket
  `veri.takip` (`eylemler.ts → oneriPaketsizGirer`): muhabire "takip olarak
  plana eklendi; paket beklenmiyor"; "Plana ekle" ve "Önerilerden al" onay
  sorusunda bunu söyler (`takipPaketsizOnay`). Muhabir dışı kaynakta
  "Takip" yok.
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
    yok" satırı yok, pencerede orijinal e-posta ve hareket geçmişi katlanır
    satır (`KatlanirKartlar`), alanlar dar sütunda (`dialog.pencere .alanlar`).
  - Öneriler sayfası (`oneri/Oneriler.tsx → OnerilerListe`) da aynı seçimi
    izler: kartta karta basınca geniş pencerede ayrıntı sayfasının tamamı
    (`OneriDetay pencerede`: kararlar, yazışma, geçmiş), listede bugünkü
    tablo. Başlık kartındaki küçük liste bu
    kalıba girmez.
- Haftalık plan (`ekranlar/haftalik/`): Cumartesi–Cuma, Perşembe
  toplantısı. Hazırlık → haftalık toplantıda → kesinleşti.
  - Üst kısım `PlanBasiKalibi` (Next Day'deki gibi): "Weekly · aralık", ↶ ve
    ⋯ (çıktı, belge, haftalık çağrı, gelen yanıtlar); "Sıradaki" kartında
    hazırlıkta "Haftalık toplantıya götür", toplantıda "Hazırlığa geri al",
    "Kalanları kabul et" ve dolu "Planı kesinleştir" (karar bekleyen varken
    pasif, sayısı kartta), kesinleşmişte bekleyen aktarım; künye ve Takip.
    Önce büyük ikon, ortalı düğmeler ve ayrı durum kartı vardı.
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
  - Kesinleştirme onayı sonucu sayıyla söyler (`haftalik.ts → kesinlesmeOzeti`:
    Next Day'e geçecek haber, açılacak paket, reddedilecek öneri); gündeme
    alınmamış açık haftalık öneri varsa ayrıca sorulur, "İptal" açık bırakır
    (`haftalikKesinlestir(…, acikReddet)`). "Kalanları kabul et" ön
    incelemedeki kalemi almaz (`topluKabulAdaylari`), onay sorar. Next Day'de
    toplantıya götürme ve onay da sorar; onay kararsız paket sayısını ve görev
    gidecek muhabiri yazar. Özel yayının onayı birlikte onaylanacak nafize ve
    paket önerisi sayısını yazar.
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
  - "E-posta için kopyala" (`CiktiAraclari`; Next Day, Weekly, Özel yayın):
    panoya Word'ün biçimi satır içi stil olarak yazılmış HTML ve düz metin
    birlikte (`indir.ts → epostaHtml`, `zenginKopyala`; Clipboard API, olmazsa
    seçip kopyalama). E-posta istemcisi stil dosyasını almıyor; düz metin
    kopyası ve sayfadan seçme biçimi bozuyordu, Word'e indirip oradan
    kopyalanıyordu. Biçim `EPOSTA_STILI`, `WORD_BICIMI` ile aynı tutulur. Test
    `testler/kopya.cjs`.
  - Aralık kurumun kuralı: aynı başlığın altındaki satırlar 1,15, başlıklar
    ve bölümler arası 1,30 satır; satırlar arasına başka boşluk girmez.
    Ekran, baskı (`.cikti`) ve Word (`WORD_BICIMI`) aynı değerde.
- Stok haberi ayrı kayıt değil, `Paket` (`stok: true`): haftalıkta kabul
  edilen plansız feature ya da günü olmayan haber, Next Day'de "stok" diye
  işaretlenen paket ve özel yayının dosya paketi (`ozelId`; kullanıcı:
  önceden hazırlanıp yayın günü stoktan veriliyor). Ekonomi, program ve
  spor stoka düşmez, masasına (aşağıda). Durumu saklanmaz, kayıttan çıkar
  (`akis.ts → stokDurumu`): üretime alınacak → üretimde → stokta
  ("Üretilmiş paketler" sekmesi, `sdUretilmis`) → yayınlandı. Özel yayın
  paketi kendi görevlendirmesiyle ilerler (onaylıysa "üretimde"), yayının
  "yayına hazır" aşaması işaretlenince stoktaki dosya paketleri o yayınla
  yayınlandı (`Paket.yayinlandi.ozelId`; aşama geri alınınca stoka döner;
  `eylemler.ts → ozelAsamaIsaretle`). Stok sayfasının başında özel yayın
  paketleri (`OzelYayin.tsx → OzelTalepAlani`): in-house paketi Planlama'nın
  stok ekibi (ya da Planlama yöneticisi, tam yönetici) hazırlayana verir
  (`yetki.ts → ozelPaketDagitabilir`; kullanıcı: özel yayın paketlerini stok
  ekibi takip etsin; önce Output'un yöneticisiydi, `ouOzel` Output'un
  varsayılanından kalktı).
- Masalar (kullanıcı: Ekonomi, Program ve Spor kendi bülteni ya da programı
  için üretimi Newsdesk gibi takip ediyor; `veri.ts → MASA_KOLLARI`,
  `masaPaketi`): kolun sahibi kendi birimi (`akis.ts → KOL_SAHIBI`, yapıda
  `kolSahibi`; ekonomi önce Planlama'daydı). Paket Weekly'den de Next Day'den
  de masasına düşer (`paketSahibi`: onaylı masa paketi planı olsa da kol
  sahibinde), masası "Üretime al"ı yapar (`uretimeAlabilir`), akış
  Organizasyon'daki yol, "kol" durakları masanın. Muhabirin "Yapıldı /
  Yapılmadı"sı ve sade akış yok (`sadeAkis`, `paketTamamlayabilir`), Günün
  notunun "sonuç bekleyen"ine girmez. Ana sayfada masa kartı
  (`Listeler.tsx → MasaPaketleri`; `ekMasa`, `prMasa`, `spMasa`): üretime
  alınacaklar, üretimde, yayına hazır. Bitmiş masa paketi Next Day "Hazır
  paketler"den seçilir (`akis.ts → hazirSecilebilir`; stoktakiyle birlikte,
  `StoktanSecici`, `hazirPaketEkle`, devirde yayınlandı). Spor yeni yerleşik
  birim ve kol, Output'un altında, ünvanları yönetici ve editör; onsuz
  yayınlanmış yapıda okurken eklenir, ekonominin sahibi Planlama'ysa
  Ekonomi'ye geçer, spor kolu ekonominin akışına katılır (`yapi.ts →
  masalariKur`, `tamamla` içinde). Eski kayıtta üretime alınmamış ekonomi
  stok paketi masasına geçer (`eylemler.ts → masaPaketleriniStoktanAyir`,
  sistemin açılış işi); bitmiş olan stokta kalır. Muhabir kılavuzunda `kl7d`.
  Test `testler/masa-stok.cjs`.
  - Ekonomi menüde ayrı sayfa (`#/ekonomi`, `Listeler.tsx → ICERIK_SAYFASI`;
    kullanıcı: ekonomi ayrı birim, "Feature / ekonomi" tek sayfaydı);
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
    plan devredilince seçili paket `yayinlandi` alır.
    Planın beklenen paketi (PKG) yapılmışsa satırındaki "Stok paket olarak
    ekle" (plan ekranında ve belgede; `eylemler.ts → paketStogaAl`,
    `paketStogaAlinabilir`: plan içeriğini düzenleyen, üretimde, iptal ve özel
    yayın paketi değil) onu stok paketi yapar (`tamamlandi`), Stok'un "Üretilmiş
    paketler"ine düşer (kullanıcı; önce bu planın hazır paketlerine giriyordu),
    istenen planda "Stoktan seç"le hazır paketlere girer; hareket
    `paketStogaAlindi`. Beklenen paketlerde (التقارير المتوقعة) artık
    basılmaz; başlığın altında kalıp kalmayacağı sorulur (`stokBaslikta`,
    `paketStogaAl(…, baslikta)`), hayırsa başlıktan ayrılır. Hazır pakette açıklama ve kod (slug) satırın hemen
    altında; PKG satırında da kod altında.
- Newsdesk sistemde değilken (`Durum.newsdeskDevrede` yok; Ayarlar › İş
  akışı, tam yönetici, gerçek kipte genel ayar belgesinde) iş Planlama'da
  biter (tasarım belgesi 3. aşama, paketin aşamaları):
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
  - Sonuç saklanmaz (`paketSonucu.ts`): onay bekleyen, yapılan, yapılmayan,
    reddedilen; Paketler sayfasının sekmeleri (muhabirde Haberlerim,
    Planlama ve haber merkezi aynı sayfa), rozet `PaketDurumRozeti`.
  - "Başka muhabire ver" (paket sayfası, `PaketSonucu.tsx → BaskaMuhabireVer`,
    `eylemler.ts → paketBaskaMuhabireVer`, hesap yetkisi `baskaMuhabire`):
    onaylı paket yeni muhabire teklif olarak gider (`Oneri.kaynakPaketId`,
    teklif akışı); eski paket iptal, `Paket.devredildi` iziyle eski muhabirin
    geçmişinde; iki muhabire bildirim.
  - Plan devri ("Planı Newsdesk olarak devral") anahtar kapalıyken yok:
    düğme (`nextday/Plan.tsx`) ve eylem (`planDurum`, `yalnizPlanlama`)
    kapalı. Devredilen planın onaylı paketleri üretim akışına düşüyor, Newsdesk
    sistemde olmadığı için orada sahipsiz kalıyordu. İş akışları (Organizasyon)
    o zaman "Üretime al"la giren paketlere (feature, ekonomi, program, spor;
    masa paketi Next Day'den de) işliyor; sayfanın başında bunu söyleyen durum satırı (`Akislar.tsx`,
    `akisNewsdeskKapali`).
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
  - Üst kısım `PlanBasiKalibi` (`OzelYayin.tsx → OzelBasi`): yayının adı, ⋯
    (çıktı `data-ozel-cikti`, künyeyi düzenle), "Sıradaki" kartında aşamalar
    (Planlama, Onay, Uygulama, Son kontrol, Yayına hazır) ve işaretlenecek
    sıradaki aşama (`data-ozel-siradaki`; dolu yalnız onayda, aynı onay
    sorusuyla); ayrıntılı kontrol listesi ve notlar Genel bakış'ta.
  - Künyede sayı kutuları (gün, nafize, paket, talep) ve ilerleme
    (`ozelOzeti`); altında sekmeler (`OZEL_SEKMELERI`): Genel bakış (aşamalar,
    yapılacaklar), Günlük program, Nafizeler, İçerik (paketler, talepler),
    Görevlendirmeler, Hazırlık. Günlük program (`GunlukProgram`): solda
    yayının günleri (`yayinGunleri`: künyedeki aralık ve nafizelerin günleri),
    ortada seçili günün nafizeleri saat sırasıyla (basınca pencerede kalemi,
    "Nafize ekle" o günle), sağda gün özeti (konuklar, son tarihi o gün olan
    paketler ve talepler); saklanmaz, nafizelerden okunur. Telefonda günler
    yatay şerit, sütunlar alt alta.
  - Sekmelerde bölümler (yapılacaklar, nafizeler, paketler, talepler,
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
- Yeni tasarım (deneme; kullanıcı: Linear'ın görünüşü, Monday'in işlevi;
  `belgeler/kimlik.md`): eski tasarım silinmeden yanında. Anahtar Ayarlar'da
  ("Yeni tasarım") ve avatar menüsünde; seçim tarayıcıda
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
  - Muhabirin ekranı en sade hali (kurum kararı; `ekranlar/ana/Muhabir.tsx`):
    menü `AnaMenu.tsx → MUHABIR_MENUSU` (Öneri gönder, Önerilerim, Takiplerim,
    Haberlerim, Görevlendirmelerim; Ayarlar altta ayrık), birim kutusu yok;
    adı ve ünvanı sayfanın üstünde ince satırda (`Kabuk → .muhabir-adi`).
    Üst çubukta sekme, "+" ve kısayol yok; zil kalır, yeni bildirimde ses
    (`bilesenler/Ses.ts`, Ayarlar'da açılıp kapanır, tarayıcıda
    `trt-planlama-ses`). Ana sayfa yok: `#/` ve `#/oneriler` Önerilerim
    (`MuhabirOnerilerim`), sayaç, çağrı ve bildirim kartı yok (çağrı bildirim
    olarak gelir).
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
      plana giren haber tamamlanmış sayılır ama burada yok.
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
    - Telefonda alt çubuk Öneri gönder, Önerilerim, Takiplerim, Haberlerim,
      Menü (`AltCubuk.tsx → MUHABIR_SEKMELERI`); Menü paneli muhabirin
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
  sayfa kısalıp başa düşüyordu). Sayfadaki "←" bağlantısı
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
    penceresi (Ctrl+K) bunun dışında.
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
- Hata sınırı (`bilesenler/HataSiniri.tsx`, `main.tsx`): çizimde fırlatılan
  hata sayfayı beyaz bırakmaz, hatanın metni, "Yeniden yükle", "Ana sayfaya
  dön" ve "Hatayı kopyala" çıkar (normal pencerede beyaz, gizli pencerede
  açık kalan sayfa: tarayıcıda kalan kayıt bozuk bir yola giriyordu). Açılışta
  sistemin işleri (`App.tsx → yokla`) tek tek korumada; biri hata verirse
  atlanır, konsola yazılır.
- Özel yayında konuk listesi: ad kalın, unvan altında sönük, durum rozet gibi
  hap seçici (`.durum-secimi`), ekleme satırı `girdi` alanlarıyla
  (`.konuk-ekle`, telefonda alt alta).
- Ayarlar sayfası başlık satırlarından oluşur (kullanıcı: kartlar bütün
  sayfayı kaplamasın): her `Kart` katlanır satır, basınca açılır
  (`Parcalar.tsx → KatlanirKartlar` bağlamı; sayfa açar, içteki kartlar
  katlanmaz). Muhabirde "Bilgisayarda WhatsApp" yok (onun ekranında WhatsApp
  düğmesi yok).
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
