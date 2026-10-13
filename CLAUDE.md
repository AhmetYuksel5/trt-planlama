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
- Demoda veri tarayıcıda (`localStorage`, anahtar `trt-planlama-v19`;
  şema değişince anahtar da değişir) ve örnek kayıtla açılıyor. Gerçek
  kipte (aşağıda) kayıt Firestore'da; ekranlar ve eylemler aynı
  `useVeri`/`getir`/`kaydet`'i kullanıyor, fark yalnız `veri.ts`'in
  yükle/kaydet kısmında.
  - Aynı kaydı birden çok kopya paylaşıyor (workspace bölmeleri, sekmeler).
    Her yazış bir iz bırakır (`trt-planlama-v19-iz`); `getir` iz
    değişmişse kaydı yeniden okur, yani her eylem en taze kayıttan başlar.
  - `storage` olayı öbür kopyaları yeniden çizer; dil ve oturum da öyle.
  - Eylem kaydı yazarken temeli `getir()`'den alır; ekrandaki `useVeri`
    kopyası bayat olabilir, onunla yazma.
- Giriş demo: kişi seçiliyor, şifre yok. Muhabir yalnız kendi işini görür.
  Yetki hem düğmede hem eylemde soruluyor.
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
  - Kurallar (`firestore.rules`) yalnız "etkin kişi" ve hesap alanlarını
    (`pasif`, `hesapYoneticisi`, `eposta`) denetliyor; birim yetkisi
    programda. Davetler `Durum`'da değil, `davetler` koleksiyonunda.
  - Gerçek kipte prototip etiketi, örnek veri ve "Örnek veriye dön" yok;
    çıkış tanıtıma döner. Firebase yapılandırması boşsa giriş ekranı nedenini
    yazar, demo etkilenmez.
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
  - Dış muhabirin ünvanı ülkesinden ("Lübnan muhabiri", kimlik `muhabir-<ülke>`,
    `yapi.ts → ulkeMuhabirUnvani`): Kişiler sekmesindeki "Muhabirlere ülke
    ünvanı ver" (`eylemler.ts → muhabirlereUlkeUnvaniVer`, tam yönetici) eksik
    ünvanları kişinin birimine ekleyip yeni sürüm yayınlar ve ünvanı genel
    "Muhabir" olanları geçirir; elle verilmiş ünvana dokunmaz, ikinci kez
    çoğalmaz. Excel'den gelen ülke ünvanı yayındaysa onu alır. Ülke birim değil
    ünvan: yetki ve ekranlar birimin "muhabir" olmasına bakıyor.
  - Yerleşik birim ve ünvan silinmez, gizlenir; kişisi ya da durağı bağlı olan
    da (`birimEtkisi`, `unvanEtkisi`). Birime özel davranış (Planlama planı
    yapar…) yerleşikte kalır; yeni birim seçilen yerleşik birim "gibi" çalışır
    (`BirimTanimi.ornek`, `izinBirimi`: sayfa ve işlem izinleri, ana sayfanın
    varsayılanı), örneksizse yalnız herkese açık sayfalar (`SAYFA_IZNI` `HERKES`).
  - Ekranda birim ve ünvan adı `birimAdi`/`gorevAdi`, seçimler
    `birimListesi`/`unvanListesi` (gizli olan yalnız şimdiki değerse görünür).
    `BIRIM_ADI`/`GOREV_ADI`'yı ekrana doğrudan yazma.
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
- Next Day plan ekranı (`nextday/Plan.tsx`) doğrudan doldurulan
  bölümlerle (1–6) başlar. Planın araçları başlığın yanında yazılı
  düğmeler (`PlanAraclari`: gelen öneriler ve takvimden bu güne, sayılarıyla;
  çağrı, çıktı, belge); öneriler ve takvim geniş `Pencere`de açılır. Simgeli
  kare satır denendi, beğenilmedi. "Hepsini bugüne al" günün başlangıç işi:
  başlığın hemen altında (`OncekiSeridi`), dünden gelen kayıt varken.
  Durum çizgisi ve akış eylemleri (toplantıya götür, onayla, devral, geri
  dönüş) en altta `PlanDurumKarti`.
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
  - Ekip satırında ad uzamasın diye kurum kişinin adını ya da soyadını
    yazar: `Kisi.planAdi` ("ad" | "soyad", yoksa tam ad), `etiketler.ts →
    ekipAdi`; "عبد المنعم", "أبو جهاد" gibi bileşik ad tek parça. Bütün
    planlamacılar seçer (`kisiPlanAdi`, `planDuzenle`): ekip çipinde ve
    belgedeki ekip penceresinde, seçenekler adın kendisiyle.
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

  Öneri formunda ülke sorulmaz, muhabirin şehrinden gelir; yalnız "Saha
  görevlendirmesi gerekiyor" işaretlenince (ve muhabiri olmayan kaynakta)
  sorulur. Kolun ekrandaki adı "Masa" (`dil.ts → tur`). "Yeni öneri"
  sayfasının başlığı yok, doğrudan form. Haftalık öneride muhabir günü
  seçer (`Oneri.haftaGunu`, boşsa zamana bağlı değil); gündeme eklerken
  gün hazır gelir.

  Elle girilen öneride `giren` dolu. Plan ekranlarındaki "Öneri ekle" ile
  öneri sayfası aynı formu kullanır (`oneri/OneriFormu.tsx`). Ekranda
  kaynak her yerde `OneriKaynagi` / `OneriAvatari` ile gösterilir
  (`bilesenler/Tablolar.tsx`); muhabir/talimat ayrımı elle yazılmaz.
  Muhabir dışı kaynağın öneri çağrısıyla bağı ve geri dönüşü yoktur;
  plana eklenince gelişmenin kaynağı önerinin kaynağı olur.
- Muhabirin takipleri (`ekranlar/Takipler.tsx`, `#/takipler`, `Durum.takipler`):
  muhabirin izlediği güncel konu (olay, toplantı, etkinlik); iş önerisi
  değil, bilgilendirme. Muhabir menüsünde "Takiplerim" (öneriler menüden
  kalktı, İşlerim'de "Yeni öneri gönder"in yanında "Önerilerim" düğmesi);
  Planlama ve Yönetim'de "Muhabir takipleri", muhabirin profilinde de.
  Muhabir ekler, düzeltir, bitirir, siler (`takipKaydet`, `takipKapat`,
  `takipSil`; yalnız kendisininki, `yetki.ts → takipEkleyebilir`,
  `takipGorebilir`); yeni takip Planlama'ya bildirim (`takipEklendi`).
  Planlama WhatsApp'tan ulaşır ya da "İşe dönüştür"le muhabire öneri
  penceresini takiple dolu açar; öneri `takipId` taşır ve bilinen
  "muhabire öneri" akışına girer, takip kartı neye dönüştüğünü gösterir.
- Plan ekranlarında (Next Day, haftalık) gelen öneri müstakil kart
  (`oneri/OneriKarti.tsx → OneriListesi`):
  - kartta kol, haber türü, ülke, durum; başlık önerilen paket
    (`paketBasligi`, yoksa `haberBasligi`), altında arka plan haberi,
    kısa gelişme, kaynak ve zaman. Renk yalnız kolda.
  - Karta basınca `Pencere`de bütün öneri: tam gelişme, kaynak, hedef plan,
    süreç, "Ayrıntı ve geçmiş". Plana/gündeme ekleme ve ret pencerede
    açılır, ızgarada form açılmaz; değerlendirmeye alma ve erteleme kartta.
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
    Kesinleşen planın çıktısında yalnız kabul ve bilgi; kesinleşmeden
    önizleme karar bekleyenleri de basar (yoksa hazırlıktaki iş görünmüyordu).
    Kalem: "YER / metin", muhabirler, biçim; konu (olayın adı) Next Day'in
    paket satırı gibi en altta "YER / konu / muhabir". Belgede boş alan
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
    (`arkasina`). Canlı yayın saatle sıralı, taşınmaz; haftalık hareketler
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
  Tek istisna tanıtım sayfası: işi sistemi anlatmak.
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
  - Kısayollar (`Kisayollar.tsx → UstKisayollar`): ilk altısı renkli ikon;
    ★ hepsini adıyla ve "Kısayolları düzenle"yi gösterir. Kurallar
    `kisayol.ts`:
    - varsayılan planların beş ana başlığı ve takvim; muhabirde kendi
      işleri;
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
  - sol menü kalkıyor, alta sekme çubuğu (`AltCubuk`) geliyor
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
  küçüğünde iPhone sayfayı yakınlaştırıyor.
- Doğrulama: `npx vite preview` ile açıp 390 piksel genişlikte her sayfada
  yatay taşmanın sıfır olduğuna bakılır, Arapçada da. Gerçek kip Firebase
  emülatörüyle denenir (`belgeler/gercek-kip.md`).
- Örnek veri kurgusal; kurumun belgelerindeki adlar dahil gerçek personel
  adı yazılmaz.
- Yorumlar Türkçe ve "neden" anlatır, "ne" değil.
- Commit iletisi maddeli: kısa başlık, sonra her madde ne değişti ve neden.
- Bir şey yapmadan önce ne yapacağını söyle.
