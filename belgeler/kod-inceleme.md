# Kod incelemesi (Kasım 2026)

Bütün kodun baştan sona gözden geçirilmesi. Parça parça ilerliyor; her parça
bitince buraya yazılıyor. Yalnız gerçek kusurlar: güvenlik, veri kaybı, yanlış
mantık. Üslup ve yeniden düzenleme önerisi yok. Depo herkese açık olduğu için
güvenlik açıkları (1.1–1.3, 2.1) bulunduğu gün kapatıldı; öbür bulgular bekliyor.

Durum: **CONFIRMED** kod okunarak doğrulandı, **PLAUSIBLE** olası ama uçtan uca
denenmedi.

| Parça | Kapsam | Durum |
|---|---|---|
| 1 | `firestore.rules`, `depo/`, `veri.ts` yükle/kaydet, `kip.ts`, açılış işleri | bitti |
| 2 | Kapı (`worker/`) | bitti |
| 3 | `eylemler.ts` | sırada |
| 4 | Yetki ve saf kurallar (`yetki.ts`, `yapi.ts`, `akis.ts`…) | sırada |
| 5 | Ekranlar ve bileşenler | sırada |

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

### 1.4 Tam yönetici her açılışta bütün kişi belgelerini yeniden yazıyor (orta, CONFIRMED)

`depo/firebase.ts → erisimiTazele`.

Kişilerde önbellekteki iz (`e`) sekiz alanlık bir dizi metni
(`ek("kisiler", v)`), karşılaştırma ise `String(kisitli)` ("true"/"false")
ile yapılıyor. İkisi hiç eşit olmuyor; "yalnız farklı olan yazılır" kuralı
kişilerde çalışmıyor. Tam yöneticinin her açılışında (her sekme, her yenileme)
kişi sayısı kadar yazış gidiyor: günlük yazma kotasını boşa harcıyor, kişi
listesini dinleyen herkese değişiklik olarak dönebiliyor.

Öneri: belgedeki düz `kisitli` alanıyla karşılaştırmak (izin ilk öğesi).

### 1.5 Silme işaretleri hiç temizlenmiyor (orta, uzun vade, CONFIRMED)

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

### 1.6 Erişim listesi tazelemesi eşitlenmeden çalışıyor (düşük, PLAUSIBLE)

`depo/firebase.ts → geldi → erisimiTazele`.

Tazeleme ilk görüntü gelince (önbellekten de olabilir) çalışıyor, sunucu
teyidini beklemiyor. Bayat görüntüde paketin eski muhabiri duruyorsa eski
erişim listesi geri yazılır, yeni muhabir bir sonraki tazelemeye kadar
paketini göremez. Ayrıca `update` olmayan belgede (başka yerde silinmiş kişi)
başarısız olur ve o 450'lik paketin tamamı düşer.

Öneri: `sunucuyaEsitOlunca` içinde çalıştırmak.

### 1.7 Paket kodu sayacı çakışabilir (düşük, PLAUSIBLE)

`depo/fark.ts → farkCikar` (genel belge).

Sayaç genel ayar belgesine düz `set` ile yazılıyor. Aynı anda paket açan iki
kişi aynı sayıyı okuyup aynı kodu verebilir. Aynı belgeyi yazan kişinin
görüntüsünde `gundemPaylasim` bir an bayatsa kural yazışı reddeder, o yazışın
tamamı (paket dahil) düşer.

### 1.8 Kayıt başvurusunun üzerine başkası yazabilir (düşük, CONFIRMED)

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

### 2.2 Zamanlayıcı belirsiz hatada çağrıyı yeniden gönderebilir (orta-düşük, PLAUSIBLE)

`worker/src/index.ts → otoCagriCalistir`, `oto-cagri.ts → DENEME_SINIRI`.

Başarısız gönderim üç kez deneniyor. Hata, istek sunucuya yazıldıktan sonra
geldiyse (yanıt okunurken zaman aşımı, bağlantı kopması) posta gitmiş
olabilir; 15 dakika sonraki deneme aynı çağrıyı bütün muhabirlere ikinci kez
gönderir. Posta katmanı bu yüzden gönderimi kendisi yinelemiyor, ama
zamanlayıcının yeniden denemesi aynı riski taşıyor.

Öneri: yalnız istek yazılmadan önceki hatalarda (bağlantı, kimlik) yeniden
denemek; yazıldıktan sonraki hatayı "belirsiz" diye işaretleyip bırakmak.

### 2.3 Denetim karakteri taşıyan metin gönderilemiyor (düşük, PLAUSIBLE)

`worker/src/ews.ts → kacXml`.

XML'de geçersiz denetim karakterleri (Word'den yapıştırılan dikey sekme
`\u000b`, `\u000c`…) ayıklanmıyor; Exchange isteği reddeder, kişi yalnız
"gönderilemedi" görür.

Öneri: `kacXml` içinde `[\x00-\x08\x0B\x0C\x0E-\x1F]` atılsın.

### 2.4 Tam metin ayıklama büyük sayfada işlemciyi tüketebilir (düşük, PLAUSIBLE)

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
