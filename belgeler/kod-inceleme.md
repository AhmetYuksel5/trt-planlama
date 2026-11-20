# Kod incelemesi (Kasım 2026)

Bütün kodun baştan sona gözden geçirilmesi. Parça parça ilerliyor; her parça
bitince buraya yazılıyor. Yalnız gerçek kusurlar: güvenlik, veri kaybı, yanlış
mantık. Üslup ve yeniden düzenleme önerisi yok. Depo herkese açık olduğu için
güvenlik açıkları (1.1–1.3, 2.1) bulunduğu gün kapatıldı; öbür bulgular ardından
düzeltildi. Üçü bilerek bırakıldı (1.7, 1.8, 2.4; nedenleri Özet'te).

Durum: **CONFIRMED** kod okunarak doğrulandı, **PLAUSIBLE** olası ama uçtan uca
denenmedi.

| Parça | Kapsam | Durum |
|---|---|---|
| 1 | `firestore.rules`, `depo/`, `veri.ts` yükle/kaydet, `kip.ts`, açılış işleri | bitti |
| 2 | Kapı (`worker/`) | bitti |
| 3 | `eylemler.ts` (tamamı okundu) | bitti |
| 4 | Yetki ve saf kurallar | bitti (aşağıda okunanlar yazılı) |
| 5 | Ekranlar ve bileşenler | otomatik tarama bitti; satır satır okuma yapılmadı |

## 1. Güvenlik kuralları ve veri katmanı

### 1.1 Davetle ilk kayıt e-posta doğrulaması istemiyordu (yüksek, DÜZELTİLDİ)

`firestore.rules` → `kisiler` `create`, davet dalı; `depo/firebase.ts → hesapAc`.

Kişi kaydını davetle kuran dalda `email_verified` şartı yok (kayıt bağlantısı
ve kurucu dalında var). `hesapAc` de "bu adresle hesap zaten var" hatasını
yutuyor. Firebase'de e-posta/şifre ile hesap açmak herkese açık.

Senaryo: biri, davet edileceğini tahmin ettiği adresle (ad.soyad@kurum)
önceden kendi şifresiyle hesap açar. Yönetici o adresi davet edince davet
"bekliyor" yazılır, hesap zaten olduğu için dokunulmaz. Saldırgan kendi
şifresiyle girer, `eposta() == adres` tuttuğu için daveti okur ve kişi kaydını
davetteki yetkilerle (tam yöneticilik dahil) kurar. Gerçek kişi şifre
belirleme e-postasıyla hesabı geri alana kadar kayıt açık kalır.

Düzeltme: davet dalında `email_verified` şartı (giriş kodu adresleri hariç;
onların şifresi koddan). Şifre belirleme bağlantısı adresi doğruluyor, meşru
akış etkilenmiyor; eski şifresiyle giren doğrulanmamış hesap doğrulama adımına
gidiyor (`ilkKayit → "dogrulanmadi"`). Test `testler/kurallar.mjs`, 7. bölüm.

### 1.2 Davetli rolünü ve görevini kendisi yazabiliyordu (orta, DÜZELTİLDİ)

`firestore.rules` → `kisiler` `create`, davet dalı.

Kural davetle `hesapYoneticisi`, `yetkiler`, `kisiId` ve `birim`'i
karşılaştırıyor; `rol` ve `gorev` karşılaştırılmıyor. Program doğrusunu
yazıyor (`ilkKayit`), ama kendi isteğini gönderen davetli kaydını
`rol: "yonetici"` ile kurabilir. Kademe birimine (Input, Output…) personel
olarak davet edilen kişi böylece muhasebe koleksiyonlarını okur
(`muhasebeci()`: rol yönetici + kademe birimi). Sonradan rol değişmiyor
(`pozisyonAyni`), açık yalnız ilk kayıtta.

Düzeltme: davet dalında `rol` ve `gorev` de davetle karşılaştırılıyor.

### 1.3 Muhabir sıradan paketini "özel yayın" diye kendisi kapatabiliyordu (orta, DÜZELTİLDİ)

`firestore.rules` → `kisitliIcerik`, paket dalı.

Kısıtlı kişiye paket durumunu yalnız özel yayın paketinde "tamamlandı"
yapma izni var; ama `"ozelId"` yeni belgede aranıyor, eskisinde değil.
İsteğini kendisi gönderen muhabir, onaylı sıradan paketine aynı yazışta
`ozelId` ekleyip durumu "tamamlandı" yapabilir: "Yapıldı" onayı atlanır,
Muhasebe paketi yapılmış iş sayar.

Düzeltme: `ozelId` eski belgede de aranıyor.

### 1.4 Tam yönetici her açılışta bütün kişi belgelerini yeniden yazıyor (orta, DÜZELTİLDİ)

`depo/firebase.ts → erisimiTazele`.

Kişilerde önbellekteki iz (`e`) sekiz alanlık bir dizi metni
(`ek("kisiler", v)`), karşılaştırma ise `String(kisitli)` ("true"/"false")
ile yapılıyor. İkisi hiç eşit olmuyor; "yalnız farklı olan yazılır" kuralı
kişilerde çalışmıyor. Tam yöneticinin her açılışında (her sekme, her yenileme)
kişi sayısı kadar yazış gidiyor: günlük yazma kotasını boşa harcıyor, kişi
listesini dinleyen herkese değişiklik olarak dönebiliyor.

Öneri: belgedeki düz `kisitli` alanıyla karşılaştırmak (izin ilk öğesi).

### 1.5 Silme işaretleri hiç temizlenmiyor (orta, uzun vade, DÜZELTİLDİ)

`depo/firebase.ts → yaz`, `eylemler.ts → EN_COK_HAREKET`.

Fark okunan koleksiyonlarda silinen belge "silindi" işaretiyle kalıyor ve
hiçbir yerde kaldırılmıyor. Hareket kaydı 2000'de kırpıldığı için sınır
dolduktan sonra her yeni hareket bir işaret bırakıyor; koleksiyon sınırsız
büyüyor. Yeni tarayıcının (ya da önbelleği silinenin) ilk tam okuması bütün
işaretleri de okuyor: okuma kotasını asıl bu ilk açılışlar tüketir, zamanla
artar.

Öneri: tam yöneticinin tarayıcısında, belli bir yaştan (ör. 30 gün) eski
işaretleri gerçekten silen bir açılış işi; o süreden uzun açılmamış tarayıcı
tam okusun.

### 1.6 Erişim listesi tazelemesi eşitlenmeden çalışıyor (düşük, DÜZELTİLDİ)

`depo/firebase.ts → geldi → erisimiTazele`.

Tazeleme ilk görüntü gelince (önbellekten de olabilir) çalışıyor, sunucu
teyidini beklemiyor. Bayat görüntüde paketin eski muhabiri duruyorsa eski
erişim listesi geri yazılır, yeni muhabir bir sonraki tazelemeye kadar
paketini göremez. Ayrıca `update` olmayan belgede (başka yerde silinmiş kişi)
başarısız olur ve o 450'lik paketin tamamı düşer.

Öneri: `sunucuyaEsitOlunca` içinde çalıştırmak.

### 1.7 Paket kodu sayacı çakışabilir (düşük, PLAUSIBLE, BIRAKILDI)

`depo/fark.ts → farkCikar` (genel belge).

Sayaç genel ayar belgesine düz `set` ile yazılıyor. Aynı anda paket açan iki
kişi aynı sayıyı okuyup aynı kodu verebilir. Aynı belgeyi yazan kişinin
görüntüsünde `gundemPaylasim` bir an bayatsa kural yazışı reddeder, o yazışın
tamamı (paket dahil) düşer.

### 1.8 Kayıt başvurusunun üzerine başkası yazabilir (düşük, CONFIRMED, BIRAKILDI)

`firestore.rules` → `kayitBasvurulari`.

Açık kayıt bağlantısının kodunu bilen herkes (oturumsuz) herhangi bir adresin
başvurusunu yazabilir ya da değiştirebilir (ad, birim, görev). Kişi zaten
onay bekleyen ve kısıtlı açıldığı için etkisi sınırlı: yönetici onaylarken
başkasının yazdığı adı ve birimi görür.

### Temiz bulunanlar

- Kişi kaydında `j` ile düz alanların tutarlılığı, pozisyon kilidi, kısıtlı
  kişinin okuma ve yazma sınırları (yukarıdaki 1.3 dışında).
- Muhasebe koleksiyonlarının gizliliği, gündem paylaşımının korunması.
- Eşitlenmeden yazmama, bağlantı kopukken sistemin yazmaması, zaman
  sorgusunda "removed"ın silme sayılmaması.
- Açılış işlerinin tek tek korumada çalışması.

## 2. Kapı (worker)

### 2.1 Otomatik çağrının içeriğini herkes yazabiliyordu (yüksek, DÜZELTİLDİ)

`worker/src/index.ts` → `PUT /oto-cagri`.

Yazış dış muhabir dışında haber merkezindeki herkese açıktı; "çağrı
hazırlayan" denetimi yalnız tarayıcıdaydı. İsteğini kendisi gönderen herhangi
bir personel alıcı listesini (300 adrese kadar), konuyu, HTML metni ve
görevliyi yazıp, izin vermiş planlamacının kurumsal hesabından dilediği
adreslere posta gönderebilirdi.

Düzeltme: yazış Planlama birimine ve tam yöneticiye indi; okuma eskisi gibi.
Test `worker/test/worker.test.ts`.

### 2.2 Zamanlayıcı belirsiz hatada çağrıyı yeniden gönderebilir (orta-düşük, DÜZELTİLDİ)

`worker/src/index.ts → otoCagriCalistir`, `oto-cagri.ts → DENEME_SINIRI`.

Başarısız gönderim üç kez deneniyor. Hata, istek sunucuya yazıldıktan sonra
geldiyse (yanıt okunurken zaman aşımı, bağlantı kopması) posta gitmiş
olabilir; 15 dakika sonraki deneme aynı çağrıyı bütün muhabirlere ikinci kez
gönderir. Posta katmanı bu yüzden gönderimi kendisi yinelemiyor, ama
zamanlayıcının yeniden denemesi aynı riski taşıyor.

Öneri: yalnız istek yazılmadan önceki hatalarda (bağlantı, kimlik) yeniden
denemek; yazıldıktan sonraki hatayı "belirsiz" diye işaretleyip bırakmak.

### 2.3 Denetim karakteri taşıyan metin gönderilemiyor (düşük, DÜZELTİLDİ)

`worker/src/ews.ts → kacXml`.

XML'de geçersiz denetim karakterleri (Word'den yapıştırılan dikey sekme
`\u000b`, `\u000c`…) ayıklanmıyor; Exchange isteği reddeder, kişi yalnız
"gönderilemedi" görür.

Öneri: `kacXml` içinde `[\x00-\x08\x0B\x0C\x0E-\x1F]` atılsın.

### 2.4 Tam metin ayıklama büyük sayfada işlemciyi tüketebilir (düşük, PLAUSIBLE, BIRAKILDI)

`worker/src/makale.ts → AT`.

Kapanmamış çok sayıda `<nav`, `<script` taşıyan 3 MB'lık sayfada geri
başvurulu desen her açılışta sayfanın sonuna kadar tarar; ücretsiz planın
işlemci sınırı aşılır, o haberin metni gelmez. Yalnız o isteği etkiler.

### Temiz bulunanlar

- Oturum belgesinin doğrulanması (imza, süre, proje, yayıncı).
- Kayıtlı sağlayıcı anahtarının yalnız kayıtlı adrese gitmesi; anahtar ve
  parolanın tarayıcıya dönmemesi; parolanın şifreli saklanması.
- Posta gönderiminde adres denetimi, alıcı sınırı, XML kaçışı; ekin dosya
  adı ve türü başlıkları.
- Akış ve makale adreslerinin https ile sınırlanması.

## 3. Eylemler (`eylemler.ts`)

Dosyanın tamamı okundu (290 eylem). Güvenlik açığı çıkmadı; yetki önce
soruluyor, temel `getir()`'den alınıyor, değişmeyen öğenin nesnesi korunuyor.
Bulunanlar işlev kusurları.

### 3.1 Giden posta eşleştirmesi gönderene bakmıyor (düşük-orta, DÜZELTİLDİ)

`eylemler.ts → postaIsle` (`esGiden`).

Kutudan gelen posta, henüz kimliği öğrenilmemiş giden balonla yalnız metnin
başına ve 6 saatlik süreye bakılarak eşleştiriliyor; gönderene bakılmıyor.
Çekim eskiden yeniye işlendiği için olağan sırada (önce kendi postamızın geri
dönüşü, sonra yanıtı) sorun çıkmıyor. Ama kendi postamızın geri dönüşü o
çekimde yoksa (son 25 postanın dışında kaldı, gecikti) ve kısa metnimizle
("شكرا") aynı sözcükle başlayan başka bir posta geldiyse, o posta kendi
gidenimiz sanılır: sohbete eklenmez, Message-ID'si giden balona yazılır;
asıl geri dönüş sonradan gelen posta gibi ikinci balon olur.

Öneri: eşleştirmede gönderen de aranmalı (gelen postanın göndereni giden
balonun `kimden`'i, yani kişinin kendi adresi olmalı).

### 3.2 Planlama dışındaki kişinin gönderdiği posta giden balon olmuyor (orta-düşük, DÜZELTİLDİ)

`eylemler.ts → postaGidenEkle`.

Posta haber merkezinin herkesine açık (`postaGorebilir`), ama giden balonu
yazan eylem hâlâ "çağrı hazırlama" yetkisi istiyor (yalnız Planlama). Newsdesk
ya da masadaki kişi yanıt gönderince posta gider, sohbete yazılmaz; ancak bir
sonraki çekimde, gelen posta gibi (solda, kendi adresinden) görünür.

Öneri: yetkiyi `postaGorebilir` yapmak.

### 3.3 Profil formundaki "Kurumsal e-posta" giriş adresini yazıyor (orta-düşük, DÜZELTİLDİ)

`eylemler.ts → profilGuncelle`, `ekranlar/Personel.tsx` (profil formu).

Formdaki alan kişinin `eposta`'sına, yani gerçek kipte giriş adresine bağlı.
Etkin hesapta kişi bu alanı değiştirip kaydederse kural giriş adresinin
değişmesini reddediyor ve kaydın tamamı (telefon, şehir dahil) düşüyor; kişi
yalnız "kaydedilemedi" görüyor. Tam yönetici kendisinin ya da başkasının
profilinde değiştirirse kural geçiriyor: kayıttaki adres, aktivasyon akışı
(`kisiEpostasi`) atlanarak gerçek giriş adresinden ayrılıyor.

Öneri: gerçek kipte etkin hesapta profil formunun `eposta`'yı yazmaması
(kod hesabındaki gibi `kurumEposta`'ya ya da "Düzenle"deki akışa yönlendirme).

### 3.4 Kişi taşıma işleri yetkisiz tarayıcıda da çalışıyor (düşük, DÜZELTİLDİ)

`App.tsx → yokla`, `eylemler.ts → yonetimiAgacaTasi`, `dilDenetmenleriniTasi`.

Bu açılış işleri kısıtlı olmayan herkesin tarayıcısında çalışıyor ve
başkasının birimini değiştiriyor; kural bunu yalnız tam yöneticiye ve kişi
düzenleme yetkilisine yazdırıyor. Taşınacak kişi kaldığı sürece öbür
personelin tarayıcısı her yoklamada reddedilen bir yazış gönderir ("kayıt
hatası"), yerel görüntü bir an değişip geri döner. Tam yönetici uygulamayı
açınca biter.

Öneri: bu iki işi yalnız kişi düzenleme yetkisi olanın tarayıcısında
çalıştırmak.

### 3.5 Onaylı aylık plana eylemle kayıt girebiliyor (düşük, DÜZELTİLDİ)

`eylemler.ts → aylikOlayKaydet`, `aylikOlaySil`, `faaliyetAylikaEkle`.

"Onaylı plan düzenlenmez" kuralı yalnız ekranda; eylemler planın durumunu
sormuyor. Eski sekmeden ya da takvimden aktarımla onaylı aya olay eklenir,
silinir.

### 3.6 Düzenleme eylemleri kaydın o plana ait olduğunu sormuyor (düşük, DÜZELTİLDİ)

`eylemler.ts → gelismeKaydet`, `canliKaydet`, `paketKaydet` (düzenleme dalı).

Yetki, gönderilen `planId`'nin planından soruluyor; düzenlenen kaydın o
planda olduğu ve (pakette) hâlâ taslakta olduğu sorulmuyor. Ekran doğru
gönderiyor; eski sekmeden gelen istek kilitli planın kaydını ya da onaylı
paketin bütün alanlarını değiştirebilir.

### 3.7 Tam yöneticinin pozisyonunu değiştirme isteği kuralda düşüyor (düşük, DÜZELTİLDİ)

`eylemler.ts → kisiPozisyonu`, `kisilerPozisyonu`.

Kişi düzenleme yetkilisi tam yöneticinin birimini ya da ünvanını
değiştirince program kabul ediyor, kural reddediyor: ekranda değişmiş
görünüp geri dönüyor. Eylem de `hesapYoneticisi`'ni sormalı.

### Temiz bulunanlar

- Öneri akışı (plana ekleme, çıkarma, geri alma, birleştirme, plandakine
  bağlama), haftalığın kesinleşmesi ve aktarımı, yarının planının açılması.
- Paket kapanışı (işaret, onay, geri alma), üretim balonu, parçalı metin.
- Hesap geçişi (`hesabaGecir`, `kimligiTasi`), özel yayın, muhasebe.

## 4. Yetki ve saf kurallar

Tamamı okunanlar: `yetki.ts`, `tarih.ts`, `gorevler.ts`, `muhasebe.ts`,
`haftalik.ts`, `takvim.ts` (tekrar açılımı ve hatırlatma). `yapi.ts`'te ağaç
gezen fonksiyonların döngü koruması denetlendi. `akis.ts`, `uretim.ts`,
`oneriPlanlari.ts` ve öbür küçük kural dosyaları eylemlerden çağrıldıkları
yerlerde izlendi, baştan sona okunmadı.

### 4.1 Muhasebede işin ayı sonradan değişebiliyor (orta, DÜZELTİLDİ)

`muhasebe.ts → muhabirIsleri`.

Paketin tarihi sırayla planın günü, görev günü (`sonTarih`), muhabirin teslim
anı ve hiçbiri yoksa paketin son güncelleme anından alınıyor. Weekly'den
doğan plansız pakette (feature, masa) plan ve görev günü yok; muhabirin
teslim anı da Planlama onun adına kapattığında, masa teslimi beklemeden
"Yayınlandı" dediğinde ya da üretim "Yapıldı olarak kapat"la bittiğinde
yazılmıyor. Bu paketlerde tarih son güncelleme anı: pakete sonradan not
düşülünce, nitelik puanı verilince, masrafı onaylanınca ya da programa
aktarılınca iş o günün ayına geçer. Ekimde sayılıp ödenen iş kasımda yeniden
görünebilir.

Öneri: tarihi paket kapandığı anda bir kez yazılan bir alandan almak
(künyedeki "onaylayan"ın zamanı kapanış anını zaten taşıyor).

### 4.2 Sıralı görevde izin, izin kaydına ve güne bakmıyor (orta-düşük, DÜZELTİLDİ)

`gorevler.ts → sorumlular`.

Sırası gelen kişi izinliyse atlanıyor, ama izin kişideki sabit durum
alanından okunuyor; onaylı izin kaydı (kişi çipi ve rozetlerin kullandığı
`kisiBugunDurumu`) ve sorulan gün dikkate alınmıyor. İzin kaydı girilmiş ama
durumu elle "izinli" yapılmamış kişi görevli görünmeye devam eder; bugün
izinli olan kişi, izni yarın bitse de önümüzdeki bütün dönemlerde atlanır.
Otomatik çağrının göndereni de (14 gün ileriye) bu hesaptan.

Öneri: `sorumlular` içinde `kisiBugunDurumu(d, kisi, tarih)` kullanmak.

### 4.3 "Bugün" tarayıcının yerel saatinden (orta-düşük, DÜZELTİLDİ)

`tarih.ts → bugun`, `eylemler.ts → yarinPlaniniAc`.

Gün İstanbul saatine sabitlenmiyor. İleri saat dilimindeki ya da sistem
tarihi ileri olan bir bilgisayardan giren personelin tarayıcısı, İstanbul'a
göre öbür günün planını "yarının planı" diye açar; plan o an henüz
işlenmemiş bir önceki günün şablonundan kurulur. Gün İstanbul'da dönünce
plan zaten var olduğu için yeniden kurulmaz, o günün çalışılmış başlıkları
taşınmamış olur. Arşiv günü ve "geciken" hesapları da aynı saatten.

Öneri: `bugun()`'ü İstanbul saatine sabitlemek (kapıdaki `istanbulGunu` gibi).

### 4.4 "Gibi" çalışan birim, birime düşen bildirimi almıyor (düşük, DÜZELTİLDİ)

`yetki.ts → bildirimMi`.

Bildirim `veri.sahip === k.birim` ile eşleşiyor; yöneticinin açtığı ve
Planlama (ya da başka yerleşik birim) "gibi" çalışan birimde sayfalar ve
izinler geliyor, ama "sahip: planlama" bildirimleri gelmiyor.

### 4.5 Muhasebe aktarımında "1,500" 1,5 okunuyor (düşük, DÜZELTİLDİ)

`muhasebe.ts → sayi`.

Metin olarak yazılmış tutarda virgül her zaman ondalık ayraç sayılıyor;
İngilizce binlik ayraçlı "1,500" 1,5 olur. Sayı biçimli Excel hücresi
etkilenmez.

### 4.6 Muhasebede gün UTC'den kesiliyor (düşük, DÜZELTİLDİ)

`muhasebe.ts → muhabirIsleri`.

Teslim anından gün `slice(0, 10)` ile alınıyor; İstanbul'da gece 00:00–03:00
arası teslim edilen iş bir önceki güne, ay başında bir önceki aya yazılır.
`tarih.ts → yerelGun` bunun için var.

### Temiz bulunanlar

- `yetki.ts`: izin tablosu, kapsam, görünürlük, muhabirin bildirim süzgeci,
  masa ve özel yayın yetkileri.
- Tarih yardımcıları (gün ekleme öğlen üzerinden, ay sonu, hafta başı).
- Takvim tekrarlarının açılımı (ay sonu günleri, yıl geçişi, üst sınır).
- Birim ağacında döngü koruması.

## 5. Ekranlar ve bileşenler

Yaklaşık 45 bin satır. Bu parçada satır satır okuma yapılmadı; yapılanlar:

- **Kanca sırası** (`react-hooks/rules-of-hooks`) bütün `src/` üzerinde
  çalıştırıldı: ihlal yok (koşullu ya da döngü içinde çağrılan kanca yok).
- **Eksik bağımlılık** uyarıları (10 tane) tek tek bakıldı: hepsi bilinçli
  (açılışta bir kez çalışan etki) ya da eşitlik denetimiyle korunuyor; kusur
  çıkmadı.
- **HTML sızması**: `dangerouslySetInnerHTML` yok; `innerHTML` yalnız kendi
  çizdiğimiz belgenin Word ve e-posta kopyasında. Kullanıcı metni her yerde
  React'ten geçiyor.
- **Bağlantılar**: kayıttan gelen adresler (`video`, haber bağlantısı, yapay
  zeka kaynakları) `href`'e yazılıyor; React 19 `javascript:` adresini
  engelliyor, hepsi `rel="noreferrer"` ile açılıyor.
- Gerçek kipin giriş ekranı (`GercekGiris.tsx`) ve posta çekme döngüsü
  (`posta-kapi.ts`) okundu.

Ekranların davranışı depodaki uçtan uca testlerle (`testler/`, her birimden
bir kişiyle bütün sayfalar dahil) sınanıyor; bu inceleme onların yerine
geçmiyor. İstenirse ekranlar da dosya dosya okunur.

### 5.1 Anma kaydındaki bağlantı denetlenmiyor (düşük, DÜZELTİLDİ)

`bilesenler/Anma.tsx` (`href={b.yol}`), `ekranlar/yeni/AnaPano.tsx`.

"Senden bahsedilen notlar" satırı kayıttaki `yol`'u olduğu gibi bağlantı
yapıyor. Program hep `#/…` yazıyor, ama gerçek kipte anma kaydını isteğini
kendisi gönderen herkes (dış muhabir dahil; kural içeriğe bakmıyor) dış bir
adresle yazabilir; tıklayan kişi siteden dışarı gider.

Öneri: çizerken `yol` yalnız `#/` ile başlıyorsa bağlantı yapılsın.

## Özet

| Önem | Sayı | Durum |
|---|---|---|
| Yüksek | 2 | ikisi de düzeltildi (1.1, 2.1) |
| Orta | 5 | hepsi düzeltildi (1.2, 1.3, 1.4, 1.5, 4.1) |
| Orta-düşük ve düşük | 19 | 16'sı düzeltildi; 1.7, 1.8, 2.4 bırakıldı |

Bırakılanlar ve nedeni:

- **1.7** (paket kodu sayacı): çözümü sayacı işlemle (transaction) yazmak;
  yazış yolu bugün tek toplu yazış ve çevrimdışı da çalışıyor, işlem bunu
  değiştirir. Çakışma iki kişinin aynı saniyede paket açmasını gerektiriyor,
  sonucu aynı kodlu iki paket (kimlikleri ayrı). Kurum büyürse ele alınır.
- **1.8** (kayıt başvurusu): kuralı sıkmak, hesabı önceden açılmış kişinin
  "şifre belirle" yolunu (oturumsuz yazış) bozuyor. Etkisi onay bekleyen,
  kısıtlı kayıtla sınırlı; yönetici onaylarken bilgileri görüyor.
- **2.4** (tam metin ayıklama): yalnız o haberin metni gelmez, ekran özeti
  gösterir; deseni değiştirmek çalışan sitelerin ayıklamasını riske atıyor.

Düzeltmelerin kısa dökümü: muhasebede işin ayı kapanış anından (4.1, 4.6);
erişim tazeleme yalnız farkı ve sunucu teyidinden sonra yazıyor (1.4, 1.6);
eski silme işaretleri temizleniyor, uzun süre eşitlenmemiş tarayıcı tam
okuyor (1.5); belirsiz biten otomatik çağrı yinelenmiyor (2.2), XML'de
denetim karakteri atılıyor (2.3); giden posta eşleşmesi gönderene bakıyor,
postayı gören herkesin gönderdiği sohbete yazılıyor (3.1, 3.2); etkin hesapta
profil giriş adresini değiştirmiyor (3.3); kişi taşıyan açılış işleri yalnız
yetkilide (3.4); onaylı aylık plan, başka planın kaydı ve tam yöneticinin
pozisyonu eylemde de korunuyor (3.5–3.7); sıralı görev izin kaydına ve güne
bakıyor (4.2); İstanbul'un ilerisindeki tarayıcı planı erken açmıyor (4.3);
"gibi" çalışan birim bildirimi alıyor (4.4); "1,500" bin beş yüz okunuyor
(4.5); anma bağlantısı yalnız uygulamanın içine gidiyor (5.1).
