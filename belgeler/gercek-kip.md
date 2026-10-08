# Gerçek kip: kurulum ve işleyiş

Program her açılışta **demo** olarak başlar: örnek veri, kişi seçerek giriş, kayıt tarayıcıda. **Gerçek kip** gerçek bilgilerle ve herkes için ortak kayıtla çalışır:
- hesaplar davetle açılır;
- kişi e-postasındaki bağlantıyla hesabını etkinleştirir ve şifresini belirler;
- kayıt Firebase'de (Firestore) durur.

## Gizli giriş

Logoya **art arda üç kez** basınca (1,5 saniye içinde) kurum girişi açılır (`#/gercek-giris`). Logo şu yerlerde olabilir:
- demo giriş ekranında;
- sol menüde;
- menü gizliyken ya da telefonda üst çubukta.

Tek tık eskisi gibi ana sayfaya gider. Kurum girişinde:
- e-posta ve şifre ile giriş;
- **Şifremi unuttum**: sıfırlama e-postası;
- **Etkinleştirme bağlantısı iste**: ilk yönetici (kurucu) ya da bağlantısının süresi geçen davetli için.

Gerçek kipteyken prototip etiketi ve demo kişi seçimi yoktur. Kullanıcı menüsündeki **Çıkış yap** oturumu kapatır ve programı demoya döndürür.

## Hesaplar: davet ve etkinleştirme

1. **Davet:** hesap yöneticisi *Diğer › Kullanıcılar* sayfasında e-posta, ad, birim, görev ve rolü yazıp davet eder. Firebase kişiye etkinleştirme bağlantısını kendi postasıyla gönderir.
2. **Etkinleştirme:** kişi bağlantıya basar, e-postasını onaylar ve şifresini belirler (en az 8 karakter). Kişi kaydı davetten kurulur; davet "Etkinleşti" olur.
3. **Sonraki girişler** e-posta ve şifreyle yapılır.
4. **Hesap yöneticisi** davetleri yeniden gönderebilir ya da iptal edebilir; hesap kapatabilir, açabilir ve başka kişiyi hesap yöneticisi yapabilir.
   - Kişi kendi hesabını kapatamaz, yöneticiliğini bırakamaz.
5. **Davetsiz e-posta:** bağlantı istese de giremez ("Bu e-posta için davet yok").
6. **Kapalı hesap:** kayda erişemez, açık oturumu da hemen kapanır.

### Kurucu (ilk yönetici)

Boş sistemde ilk kişi kurucudur. Adresi iki yerde yazılıdır:
- `src/firebase-ayar.ts` → `kurucu`;
- `firestore.rules` → `kurucuEposta()`.

Kurucu girişte **Etkinleştirme bağlantısı iste** ile bağlantı alır, şifresini belirler ve *Yönetim* biriminde hesap yöneticisi olarak açılır. Sonra öbür kişileri davet eder.

## Firebase konsolunda yapılacaklar

1. [console.firebase.google.com](https://console.firebase.google.com) üzerinden bir proje açın; bir **web uygulaması** ekleyin.
2. **Authentication › Sign-in method** bölümünde **Email/Password**'ü açın; altındaki **Email link (passwordless sign-in)** seçeneğini de açın.
3. **Authentication › Settings › Authorized domains** listesine `ahmetyuksel5.github.io` adresini ekleyin. Depo adı değişirse aynı alan adı kalır.
4. **Authentication › Templates** bölümünde e-posta şablonlarının dilini Türkçe yapın; isterseniz gönderen adını da değiştirin.
5. **Firestore Database** oluşturun (production mode).
6. `firestore.rules` dosyasındaki `KURUCU_EPOSTA@ornek.com` yerine kurucunun adresini yazın. Kuralları yayımlamanın iki yolu var:
   - **Firestore › Rules** sekmesine dosyanın içeriğini yapıştırıp yayımlamak;
   - `firebase deploy --only firestore:rules` komutunu çalıştırmak.
7. Proje ayarlarındaki web uygulaması yapılandırmasından `apiKey`, `authDomain`, `projectId` ve `appId` değerlerini ve kurucunun e-postasını bana iletin; `src/firebase-ayar.ts`'e yazıp derleyeceğim.

Bu değerler gizli değildir: tarayıcıya giden web uygulaması kimliğidir. Erişimi değerler değil, kurallar sınırlar.

## Kayıt düzeni

- `Durum`'un her dizi alanı (planlar, paketler, öneriler, kişiler, hareketler…) bir Firestore koleksiyonudur; her öğe bir belgedir. Kişiye bağlı ayarlar (ana sayfa düzeni, kısayollar, workspace'ler…) kişi başına birer belgedir.
- Program değişikliği kayıt kayıt yazar (`src/depo/fark.ts`). İki kişinin farklı kayıtlardaki işi birbirini ezmez; aynı kayıtta son yazan kazanır.
- Ekranlar yenilemeden güncellenir; bağlantı koparsa iş tarayıcı önbelleğinde bekler, bağlantı gelince yazılır.
- Gerçek kayıt boş başlar, örnek veri yüklenmez. Ayarlar'daki "Örnek veriye dön" gerçek kipte yoktur.

## Bilinen sınırlar

- **Yetkiler:** kurallar yalnız "kurumdan, etkin kişi" diyor. Birim ve görev yetkisi (kim neyi düzenler) bugün programda (`src/yetki.ts`) soruluyor; teknik bilgisi olan etkin bir kişi bunu atlatabilir. İnce yetkinin kurallara taşınması sonraki adımdır.
- **Paket kodu sayacı:** paket kodundaki sıra numarası tek sayaçtan geliyor. İki kişi aynı anda paket açarsa aynı numarayı alabilir; sunucu tarafında sayaç sonraki adımdır.
- **Fotoğraflar:** profil fotoğrafları kayıtta küçük resim olarak duruyor; dosya deposuna taşınması sonraki adımdır.
- **KVKK:** gerçek kişi verisi Google bulutunda (Firebase) duracak. Kullanıma açmadan önce kurumun bilgi güvenliği ve hukuk birimiyle konuşulmalı. Kurumun kendi sunucusuna geçişte yalnız `src/depo/firebase.ts` değişir.

## Deneme (geliştirici)

Firebase emülatörüyle denenebilir:

```
firebase emulators:start --only auth,firestore --project demo-trt
```

Tarayıcıda `localStorage["trt-planlama-firebase"]` alanına deneme yapılandırması yazılır:
- `apiKey`, `projectId`, `kurucu`;
- `emulator: { auth: "http://127.0.0.1:9099", firestoreHost: "127.0.0.1", firestorePort: 8080 }`.

Etkinleştirme bağlantıları emülatörün `oobCodes` uç noktasında görünür.
