# Planlama · yeni mimari (brifing)

Kullanıcının isteği (12 Kasım 2026): ana sayfa çok işlevsel olsun; planların
(Next Day, Weekly, Aylık, Özel) iç akışları temel olarak aynen sürsün ve
iyileşsin; muhabirle ilgili işler (iletişim, raporlama) pratik olsun;
muhabir → öneri → plan bağlantısı kullanışlı olsun. Mimari Ayarlar'daki
"Yeni tasarım" anahtarının arkasında baştan kurulur, eski tasarım yerinde
kalır.

Dayanak: iki tur ajan görüşü. Birinci tur 11 (5 planlamacı, 3 tasarımcı, 3
yazılımcı; menü ve ana sayfa), ikinci tur 13 (5 planlamacı, 5 tasarımcı, 3
yazılımcı; muhabir bağlantısı, iletişim, raporlama, mimari). Ham notlar ekte.

## 1. Ortak bulgular

- Menü 30 madde, 7 grup; planlamacı ile yöneticinin farkı yalnız Panel.
  İçerik grubunda başka masaların sayfaları.
- Ana sayfa "şu an ne oluyor" sorusunu cevaplamıyor; beş eşit kart, tekrar,
  telefonda 3290 px.
- Muhabire ulaşmak için profile gitmek gerekiyor: öneri penceresinde, Next
  Day'in muhabir çipinde, paket sayfasında, onay kuyruğunda, Weekly kaleminde
  iletişim düğmesi yok. Muhabir 36 dosyada farklı yollarla gösteriliyor.
- Öneri ile plan arasında geçiş tek yönlü ve kopuk: plandaki gelişme/PKG
  satırı önerisine götürmüyor; öneriden plana giden bağlantı başlığa inmiyor.
- Muhabirin "durum" rozeti (izinde, sahada) sabit alan; izin ve görev
  kayıtlarından beslenmiyor, yanıltıcı.
- Adres kuralı üç yerde farklı (geri bildirim, takdir, iş postası); iki
  şablon doldurucu; CSV iki ayrı kod.
- Raporlar: kabul oranı hesaplanıp gösterilmiyor; işi olmayan ve iç muhabir
  tabloda yok; "zamanında" ve "ilk seferde" çoğu zaman boş ya da hep %100;
  ay seçimi ve karşılaştırma yok; Muhasebe ile sayılar ayrışıyor.
- Menü ve ana sayfa sayıları her yazışta otuz ayrı yerde baştan hesaplanıyor;
  öneri sayısı menüde ile sekmede farklı kuralla.

## 2. Kararlar

### Anahtar
Yeni mimari yalnız "Yeni tasarım" açıkken ve Planlama'da (izinlerde
planlama) görünür. Tam yönetici ve kademedeki müdür bugünkü düzende kalır.
Anahtar kapalıyken her şey bugünkü gibi; eski testler kapalı anahtarla
geçmeye devam eder.

### Sayıların tek kaynağı
`src/planlamaKararlari.ts → planlamaKararlari(d, ben, bugun)`: karar bekleyen
öneri (Öneriler'in "Karar bekleyen" sekmesiyle aynı kural), eş öneri,
eşleşmeyen e-posta yanıtı, onay bekleyen "Yapıldı", şartlı kabul, görev
talebi, birimlerden dönen görüş, üretime alınacak stok, anıldığım notlar,
açık işlerim, okunmamış posta, Next Day/Weekly durumu. Kabukta bir kez
hesaplanır, menü, alt çubuk ve ana sayfa aynısını okur.

### Menü (katlanmaz, sayı yalnız kararda)
- Ana sayfa
- Planlar: Next Day, Weekly, Aylık, Özel yayın, Takvim
- Gelenler: Öneriler, Takipler, Posta
- Paketler: Paketler, Stok, Üretim panosu (stok ekibi ve yönetici), Saha
- Ekip: Görevler, Muhabirler, İzinler
- Yönetim (yalnız yönetici): Raporlar, Gündem, Organizasyon
- Ayarlar

Menüden kalkanlar aramada ve adresle açılır (Feature, Ekonomi, Programlar,
Spor, Başlıklar, Personel, Seyahat, Talepler, Metin kontrol, Video, Proje
planı). `MENU` tablosu sayfaların kataloğu olarak kalır (arama, workspace).

### Ana sayfa: kutular + sağ panel
- Kısa karar kutuları sağdan açılan panelde açılır, iş panelde biter:
  karar bekleyen öneriler, onay kuyruğu, birim görüşleri ve görev talepleri,
  görevlerim, anıldığım notlar, muhabirler (yanıt bekleyen, çağrıya yanıtsız,
  sonucu bekleyen), günün notu.
- Uzun iş kutuları kendi sayfasına götürür: Next Day (aşama, kararsız PKG,
  sıradaki iş), Weekly (aşama, Perşembe'ye kaç gün), Aylık, Özel yayın.
- Kutu: başlık, büyük sayı, "kimde · süre" satırı. Boş kutu sönük kalır,
  yeri değişmez. Sıra sabit; sayıya göre yer değiştirmez.
- Panel: içinde başka kayda basınca yeni pencere açılmaz, panelin içi değişir
  (← geri; telefonun geri tuşu da). Başlıkta "Sayfayı aç". Telefonda tam
  ekran.

### Muhabir iletişimi
- Tek adres kuralı `muhabirAdresi` (kurumsal, yoksa kişisel).
- Tek çip `KisiCipi`: avatar + Arapça ad; basınca küçük kart (şehir, ünvan,
  izin/görev durumu kayıttan, açık işleri, WhatsApp, posta [konu bağlamdan],
  "Muhabir dosyası"). Öneri penceresi, Next Day muhabir çipi ve PKG satırı,
  paket sayfası, onay kuyruğu, Weekly kalemi, İçerikler kartı. Çıktıda, posta
  balonunda, bildirimde ve muhabirin kendi ekranında yalnız ad.
- WhatsApp'a basış kaydedilmez (gizlilik; basmak göndermek değil).

### Muhabir ↔ öneri ↔ plan
- `oneriYolu(d, o)`: Geldi · Değerlendirme · Plan/Gündem · PKG · Muhabirde ·
  Sonuç; altında "kimde bekliyor · süre". Kartta şerit, pencerede tıklanır
  çizgi (plana gider ve başlığa kayar).
- Plandaki `oneriId`'li gelişme/PKG/canlı satırında "öneri" simgesi, öneriyi
  yan panelde açar.
- `muhabirDosyasi(d, kisiId, bugun)`: Şimdi (sırası bende / sırası onda /
  bugün-yarın planda / takipler), Yazışmalar, Geçmiş. Durum rozeti izin ve
  görev kaydından türer.

### Planların iç akışı
Dokunulmayacaklar: sistemin açtığı plan ve `onceki`, Sıradaki kartı ve
`usePlanAkisi`, toplantı görünümü ve klavye, geri al, sürükle-bırak ve Plana
ekle, hızlı ekleme, PKG geri bildirimi, çıktı/Word. Yeni tasarımda Next Day'in
esas görünümü "Yeni" (Sütunlu onun geniş kipi), başı da `PlanBasiKalibi`.
Plan ekranının yan paneli ana sayfanın paneliyle aynı bileşenler.

### Raporlar (sonraki aşama)
Ay seçici ve önceki dönemle karşılaştırma; bütün muhabirler (iç muhabir de,
işi olmayan soluk); öneri, kabul oranı, verilen, biten (PKG, canlı, nafize
Muhasebe'nin kuralıyla), yapılmayan, çağrıya yanıt oranı, son iş günü;
satıra basınca muhabir dosyası; ortak `csv.ts`.

## 3. Aşamalar

1. Sayıların tek kaynağı, Planlama menüsü (yeni tasarımda), ortak adres
   kuralı ve muhabir çipi, sağ panel ve ana sayfa kutuları.
2. Öneri yolu ve plan satırından öneriye geçiş; muhabir dosyası; durum
   rozetinin kayıttan türemesi.
3. Raporlar; toplu iletişim (seçilenlere posta, WhatsApp hazır metin);
   Weekly/Aylık/Özel iyileştirmeleri (Aylık → Özel geçişte ekip ve satırlar,
   çok günlü olay, şartlı kabule son tarih).

## Ek: ajan notları (ikinci tur)

## Tasarımcı 4 — Plan ekranları
- Esas görünüm "Yeni"; Sütunlu onun geniş ekran kipi; Klasik yedek. Yeni görünümde başlık da PlanBasiKalibi olmalı (bugün yp-ust, Sıradaki yok).
- Dokunulmayacak: usePlanAkisi, toplantı görünümü ve klavye, geri al, yarinPlaniniAc onceki/devir, sürükle-bırak + PlanaEkle, HizliEkle ve "/", takdir, çıktı/Word.
- Tutarlılık: dört planda PlanBasiKalibi; Sıradaki'de "kimde bekliyor · ad · süre"; tek öneri paneli (Öneri/Takip/Takvim/Durum), Weekly de; ortak muhabir çipi.
- İyileştirme: yp-ust düğmeleri ⋯'e; Weekly'de toplantı görünümü varsayılan yüzey; dört planda sonuç sayılı onay penceresi; Sütunlu'da katlanır içindekiler; Aylık/Özel'e HizliEkle.
- Sağ panel planın "gelen kutusu"; Muhabir sekmesi (yer, izin, çağrı yanıtı); ana sayfa paneliyle aynı bileşenler, yalnız bağlam (planId) farklı.

## Planlamacı 1 — Öneri ve muhabir koordinatörü
- Zincir: telefonla gelen öneriyi elle yeniden girmek eş öneri doğuruyor; posta yanıtı hem sohbette hem "Gelen yanıtlar"da; planda doğrudan PKG açınca bağ kopuyor (sonra 🔗 ile onarılıyor); PKG geri bildirimi ayrı sayfa.
- WhatsApp yalnız Personel, Programlar içerik kartı ve Ayarlar'da. Öneri penceresinin alt satırında, Next Day muhabir çipinde, paket sayfasında, onay kuyruğunda iletişim yok.
- Öneriler: muhabir şeridi (bugün/yarın plandaki kayıtları + bekleyen önerileri); planda PKG/gelişme açarken bekleyen önerisini formda sor; posta balonunda "→ Öneri"; önerinin bilgi satırında zincir rozeti; paket sonucu onaylanınca geri bildirim aynı akışta; "Telefonda konuşuldu" notu.
- Ana sayfa: "Muhabirler" kutusu (yanıt bekleyen, çağrıya yanıtsız, sonucu bekleyen paket); "Gelen öneriler" kutusu.

## Planlamacı 2 — Next Day nöbetçisi
- Dokunulmasın: sistemin açtığı plan, onceki/bugün de geçerli, Sıradaki, toplantı klavyesi, Öneri ve takiplerden al, oneriPlanKaydi.
- Eksikler: muhabir çipinde iletişim yok; öneriden gelen gelişme öneriye götürmüyor (g.oneriId yalnız yetkide); PKG satırı önerisine gitmiyor; muhabire notun gidip gitmediği görünmüyor; PKG geri bildirimi ayrı sayfada.
- Öneri: kişi menüsü (WhatsApp, posta, not, profil, bekleyen önerileri); oneriId'li satırda "öneri" simgesi → yan panelde OneriAyrinti; öneriden plana giden bağlantı başlığa kaysın ve vurgulasın.
- Onay: "n muhabire bildirim" onay sorusunda; onaydan sonra Sıradaki'de "PKG geri bildirimi · gitmeyen n"; takdirde "hepsini seç"; adresi yoksa WhatsApp; ret notu muhabirin bildirimine.

## Planlamacı 3 — Weekly, Aylık, Özel
- Korunsun: Weekly aşamaları, toplantı görünümü, şartlı kabul ve gözden geçirme, haftaliktanAktar, Aylık bağlayıcı değil, Özel aşamaları.
- İyileştir: Aylık→Özel geçişte ekip/görev/satırlar kayboluyor; Aylık→Weekly çok günlü olayda tek kalem; zincirin geri bağı yok (aylık olayda "Weekly'de: kabul…" rozeti); şartlı kabule son tarih; Özel'in paket/nafizeleri Weekly'de salt okunur.
- İletişim: Weekly kalem çipi, toplantı kalem kartı, şartlı kabulde "Koşulu muhabire yaz", takdirde WhatsApp yedeği, haftalık çağrıda yanıt vermeyenlere WhatsApp hatırlatma, Özel nafize/paket, Aylık ekip.
- Muhabir profilinde "Önümüzdeki işler" zaman çizgisi; kabul edilen kalem muhabire paketten önce görünsün; aylık ekibe atanmaya bildirim.
- Ana sayfa: Weekly, Aylık, Özel kutuları; "Planlarım" paneli (şartlı, geri bildirimi gitmeyen, yanıtsız muhabir, görevlendirilmemiş özel paket, TBC).

## Tasarımcı 1 — Kişi çipi (KisiCipi)
- Muhabir 36 dosyada farklı yollarla gösteriliyor. Ortak çip: avatar + Arapça ad + ek bilgi; basınca küçük kart (popover; telefonda alttan katman): ad, Latin ad, şehir, ünvan, durum hapı (izin), açık işler sayıları (bağlantılı), WhatsApp, posta (konu bağlamdan), yazışma, "Muhabir dosyasını aç".
- Kullanım: öneri kartı/satırı/penceresi, başlık muhabiri, gelişme muhabiri, PKG satırı, paket sayfası, Weekly kalemi, İçerikler kartı, takvim sorumlusu, muhabir listesi. Yalnız ad: çıktı, baskı, Word, posta balonu, bildirim, muhabirin kendi ekranı.
- 44px dokunma, aria-haspopup, numara/adres yoksa aria-disabled ve neden. Yanlış kişiye mesaja karşı: büyük ad + şehir, numaranın son dört hanesi ipucunda, kimlikle (ad aramasıyla değil). Hesap saf `kisiOzeti(d, kisi, ben)`, yetkiye göre sayar. Kısıtlı kişi kartı görmez.

## Tasarımcı 2 — Öneri yolu
- Tek bileşen `OneriYolu`: Geldi · Değerlendirme · Plan/Gündem · PKG · Muhabirde · Yapıldı. Geçilen yeşil, şimdiki mavi, gelecek gri, ret kırmızı; paketsizde PKG yok. Hesap saf `oneriYolu(d, o)`, kaynak oneriPlanKaydi ve paket.
- Kartta yazısız şerit; pencerede adlı, tıklanır çizgi (Plan → plana kayar ve vurgular; PKG → paket; Muhabirde → kişi).
- Altında "kimde bekliyor": ad · birim · süre (gorunenSahip, son hareket).
- Plandaki oneriId'li satırda "Öneri" ikonu, bağsız PKG'de 🔗 kalır.

## Planlamacı 4 — Muhabir ağı
- Liste: süzgeç yalnız ülke/haber türü; "bugün izinde / sahada / açık işi var" süzgeci yok. Durum rozeti (Kisi.durum) sabit alan, yalnız örnek veri dolduruyor; izin/görev kaydı rozete yansımıyor → önce bu düzeltilmeli (görevlendirmeden türet).
- Profil ayrı kartlar, öncelik yok; e-posta düz yazı, posta düğmesi yok; yazışmalar, planda adının geçtiği başlıklar, son temas yok.
- Muhabir dosyası: künye (izin/görev kayıttan, şehir, yerel saat, son temas); "Şimdi" sekmesi (sırası bende / sırası onda / bugün-yarın planda / açık takipler), Yazışmalar, Geçmiş.
- İletişim: her iş satırında WhatsApp + posta; WhatsApp'a hazır Arapça metin (şablonlar Ayarlar'da); listede çoklu seçimle toplu posta (BCC) ya da sıralı WhatsApp; öneriye bağlı olmayan muhabir başına genel yazışma.
- Ana sayfa: "Muhabir ağı" kartı (izinde/sahada, sırası muhabirde, 7 gündür sessiz, çağrıya yanıtsız üretkenler).

## Planlamacı 5 — Yönetici ve raporlama
- Rapor: kabul oranı hesaplanıyor ama tabloda yok; paketsiz muhabir listede yok (verilen>0); iç muhabir yok; "zamanında" çoğu zaman boş (teslim alanı); "ilk seferde" öneri düzeltmesini saymıyor; nitelik ölçütü belirsiz; cevapsız çağrı yalnız Günün notunda; karşılaştırma yok; Muhasebe ile sayı ayrışabilir.
- İstenen: öneri/kabul/ret/düzeltme, kabul oranı, çağrıya yanıt oranı, verilen/biten, yapılmayan/devredilen, zamanında (plan günü ölçüt), video/parça iadesi, canlı. Haftalık sıralanır tablo + ▲▼; tek muhabir dosyası. Muhabir yalnız kendi dosyasını görür.
- Geri bildirim: dosyada "gitti/gitmedi"; aylık özet postası (elle işaretle).
- Ana sayfa: karar bekleyen öneri, onay kuyruğu, çağrıya yanıtsız muhabir, postası gitmemiş kabul paket, geciken/sonuçsuz paket, haftanın muhabir özeti.

## Tasarımcı 3 — Ana sayfa kutu + panel
- Kutular: onay kuyruğu, karar bekleyen öneriler, birim görüşleri, görevlerim, anıldığım notlar, günün notu (panel); Next Day, Weekly, Aylık, Özel (sayfa). Büyük sayı + "kimde · süre" satırı. Boş panel kutusu sönük kalır, yeri değişmez.
- Izgara: masaüstü 4 sütun, plan kutuları 2 sütun genişliğinde ve kısa durum çizgili; telefonda 2 sütun. Sıra sabit (sayıya göre yer değiştirmez).
- Panel: var olan Pencere (yeni tasarımda zaten sağdan 520px) + PanelYigini (içinde başka kayda basınca yığına itilir, ← geri, pencereAdimi ile geri tuşu). Başlıkta "Sayfayı aç ↗". Satırda birincil eylem + ret; karar sonrası yeşil çip, bildirimde geri al. Klavye ↑↓/j k, Enter, 1/4, Esc. Telefonda tam ekran.
- Camgöbeği yalnız birimin kabuğunda (menü etkin madde, birim kutusu); önce kimlik belgesine satır.
- Panel içerikleri var olan bileşenlerin "satır" sürümleri.

## Tasarımcı 5 — Raporlar
- Bugün: altı sayaç (kanal, biçim, birim yükü kimsenin karar vermediği sayılar); muhabir tablosu dipte, sıralanmıyor; ölçüler boş/yanıltıcı; canlı ve nafize sayılmıyor (Muhasebe sayıyor); ay seçimi ve karşılaştırma yok; CSV tek dosyaya yığılıyor.
- Öneri: ay seçici + karşılaştırma; sıralanır tablo (öneri, kabul oranı, verilen, biten PKG/canlı/nafize, yapılmayan, gecikme, son iş günü), iş almayanlar soluk; satıra basınca yanda muhabirin dosyası; CSV görünen tablo; kanal/biçim/birim yükü kalkar.
- Profil: "Son 30 gün" tek satır + 6 aylık çubuk; kırmızı/yeşil açık eşikle; veri yoksa "—".
- Yönetici kutusu: bu ay biten iş ve fark, 30 gündür işsiz n, yapılmayanı artan n.

## Yazılımcı 2 — Veri ve kurallar
- Öneri→plan bağı ters yönde (Gelisme/Canli/Paket.oneriId); öneri tarafı kopya. Muhabir bağları beş yerde (Oneri, Paket, Canli, PlanBasligi.muhabirler, Gelisme.muhabirler karışık tip, HaftalikKalem.muhabirler, Gorevlendirme). PostaMesaji'nda kişi kimliği yok (adresle eşleşir).
- Yeni saf dosya `muhabirDosyasi.ts`: muhabirDosyasi(d, kisiId, bugun) → açık öneriler, takipler, plandaki kayıtlar, paketler+sonuç, yazışmalar, izin, sonTemas, performans; oneriYolculugu(d, oneriId) → adımlar (geldi, karar, plan/gündem, pkg, sonuç), zamanlar hareketten, boşsa kayıttan.
- Tek geçişte indeks (Map) + useMemo.
- Son temas hesaplanır, saklanmaz; WhatsApp basışı kaydedilmesin (gizlilik, kanıt değil).
- Yalnız okuma; kurallar değişmez; dosya ekranı kısıtsız kişiye.

## Yazılımcı 3 — İletişim ve rapor kodu
- Dört yol: WhatsAppDugmesi (3 yerde), IsPostasi (yalnız Programlar), mailto/eml (geri bildirim), takdir (iki sayfada ayrı postaGonder), yazışma.
- Adres kuralı üç farklı (geri bildirim ve IsPostasi yalnız postaAdresi; takdir kişisele düşüyor) → tek `muhabirAdresi(k)`. İki şablon doldurucu → tek (takdirDoldur). IsPostasi `ilk`'e metin eklenmeli.
- `MuhabirIletisim` önerisi: WhatsApp, posta (EWS varsa YeniPosta, yoksa mailto/eml yedeği, demoda ekrana), yazışma, dosya; kısıtlı kişide yok.
- Rapor: iç muhabir yok, verilen>0 süzgeci, canlı/yapılmadı/çağrı yanıtı/şehir yok; CSV iki ayrı kod (Muhasebe'de ayırıcı yanlış) → ortak `csv.ts`.
- Performans: Personel listesinde her satırda performans() tam tarama; rapor her çizimde. Grupla + useMemo.

## Yazılımcı 1 — Mimari
- Çatallanma üç girişte: AnaSayfa (planlama), AnaMenu/AltCubuk/MobilMenu. `menuGruplari(ben, yeni)`; `MENU` dokunulmaz (arama, workspace).
- Yeni dosyalar `src/ekranlar/yeni/` (PlanlamaAna, KararPaneli), ortak `Panel`, `MuhabirCipi`, saf `planlamaKararlari.ts`. CSS `html.yeni-tasarim` bloğunda.
- Panel: aynı dialog ve `pencereAdimi`; iç yığın state'te, her adımda yeni pencereAdimi (geri tuşu bir adım geri).
- Sayılar kabukta tek useMemo, bağlamla dağıtılır. Test `testler/yeni-planlama.cjs`, `planlama-kararlari.cjs`.
- Riskler: iç içe dialog geçmişi, panelden sayfaya geçerken adım temizliği, Calisma modül döngüsü, kapsam (tam yönetici, "gibi" birim).

## Birinci tur (özet)
- Planlamacılar: menüde başka masaların sayfaları ve iş akışı sayfaları gereksiz; önerinin dört kapısı (Öneriler, Takipler, Posta, Gelen yanıtlar) yorucu; bir paket dört sayfada; "bugün ne bitmeli" dağınık; ana sayfada planın durumu yok.
- Tasarımcılar: katlanmaz, sayılı, en çok 4–5 grup; karar şeridi + plan kutucukları; Planlama'ya camgöbeği, yalnız birimin kabuğunda; telefonda Ana · Öneriler · Next Day · Muhabirler · Menü, "+" düğmesi, toplantıda alt karar şeridi.
- Yazılımcılar: birim menüsü kalıbı; kayıtlı kişisel düzenler sessizce süzülüyor; menü/ana sayfa sayılarında useMemo yok; gununNotu'nda durganGun sınırsız; MasaPaketleri ölü kod.
