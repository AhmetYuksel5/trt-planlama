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
4. **Hesap yöneticisi** davetleri yeniden gönderebilir ya da iptal edebilir; hesap kapatabilir, açabilir ve başka kişiyi hesap yöneticisi yapabilir. **Düzenle** ile etkin bir kişinin adını, birimini, görevini ve rolünü değiştirebilir (kendisininki dahil).
   - Kişi kendi hesabını kapatamaz, yöneticiliğini bırakamaz.
5. **Davetsiz e-posta:** bağlantı istese de giremez ("Bu e-posta için davet yok").
6. **Kapalı hesap:** kayda erişemez, açık oturumu da hemen kapanır.

### Kayıt bağlantısı (kişi bilgilerini kendisi girer)

Davetin yanında ikinci yol:

1. Hesap yöneticisi *Kullanıcılar › Kayıt bağlantısı › Yeni bağlantı* der; bağlantı (`…/#/kayit/<kod>`) panoya kopyalanır, istediği yerden paylaşır. Bağlantı 7 gün geçerlidir; **Kapat** ile hemen kapanır.
2. Bağlantıyı açan kişi e-postasını, adını (Türkçe, Arapça, İngilizce), birimini ve görevini girer; e-postasına etkinleştirme bağlantısı gelir. Bilgileri bu bağlantının dönüş adresinde taşınır, başka cihazda açsa da kaybolmaz.
3. Bağlantıyla dönüp şifresini belirler. Hesabı **personel** rolünde ve hesap yöneticisi olmadan açılır.
4. Yöneticinin listesinde "Kendi kaydı · kontrol bekliyor" işaretiyle görünür; yönetici **Düzenle** ile adını ve pozisyonunu düzeltip kaydedince işaret kalkar. Uygun değilse **Hesabı kapat**.

Kurallar bağlantının açık ve süresinin geçmemiş olmasını, e-postanın bağlantıyla doğrulanmasını ve hesabın yönetici olmamasını denetler (`firestore.rules → kayitGecerli`). Bağlantı Firestore'da `kayitBaglantilari` koleksiyonunda; kodu bilen yalnız o belgeyi okuyabilir.

### Hesapsız kişi (pilot)

Sistemi henüz kullanmayan personel yalnız adıyla kayıtta durur:

1. *Kullanıcılar › Kişi ekle › Hesapsız kişi*: ad (üç dilde), birim, görev; e-posta ve telefon isteğe bağlı.
2. Kişi her seçimde (muhabir, ekip, plan satırı) görünür, giriş yapamaz. Listede "Hesap yok". İşini Planlama onun adına görür: öneriyi onun adına girer, e-posta adresi varsa öneri çağrısı ona da gider.
3. Sisteme geçeceği zaman satırdaki **Hesaba bağla** e-posta adresine davet gönderir. Kişi etkinleşince eski kaydı (ve ona verilmiş işler, önerileri, hareketler) yeni hesabına geçer; ayrı bir kayıt kalmaz.

### Muhabir listesini içe aktarma

*Kullanıcılar › Kişi ekle › Excel'den muhabir aktar*: kurumun muhabir listesi (.xlsx) seçilir, önizlemede kaç muhabirin yeni, kaçının zaten kayıtlı olduğu ve tanınmayan konumlar görünür; **N muhabiri ekle** ile hepsi tek seferde hesapsız muhabir olarak eklenir.

- Okunan sütunlar: ad soyad, Arapça ad, ülke/şehir, kısaltma, telefon, kişisel ve kurumsal e-posta, uydu/yapım şirketi, retainer. Pasaport, cinsiyet, doğum tarihi ve yeri **okunmaz**.
- Dosya tarayıcıda okunur; depoya ya da sitenin koduna girmez.
- Davet adresi kurumsal e-posta, yoksa kişisel e-posta. Muhabirler zamanla **Hesaba bağla** ile davet edilip etkinleşir.
- Liste ikinci kez yüklenirse kayıtlı olanlar atlanır.

### Seçmeli yetkiler

Tam yönetici (hesap yöneticisi) satırdaki **Yetkiler** penceresinden başkasına şunları ayrı ayrı verebilir:

- davet gönderme,
- kayıt bağlantısı açma,
- kişi bilgilerini düzenleme,
- hesap kapatma ve açma,
- hesapsız kişi ekleme.

Aynı pencerede "Tam yönetici" seçilirse kişi hepsine ve yetki vermeye sahip olur. Yetkisi olan kişi Kullanıcılar sayfasında yalnız kendisine verilen kısmı görür. Sınırlar kurallarda da var: davet yetkisiyle yönetici davet edilemez, tam yöneticinin hesabı yalnız tam yöneticice kapatılır, yetki yalnız tam yöneticiden verilir.

### Kurucu (ilk yönetici)

Boş sistemde ilk kişi kurucudur. Adresi iki yerde yazılıdır:
- `src/firebase-ayar.ts` → `kurucu`;
- `firestore.rules` → `kurucuEposta()`.

Kurucu girişte **Etkinleştirme bağlantısı iste** ile bağlantı alır, şifresini belirler ve *Planlama* biriminde (planlamacı, yönetici rolü) hesap yöneticisi olarak açılır; pozisyonu Kullanıcılar sayfasındaki **Düzenle** ile değişir. Sonra öbür kişileri davet eder.

## Firebase konsolunda yapılacaklar

1. [console.firebase.google.com](https://console.firebase.google.com) üzerinden bir proje açın; bir **web uygulaması** ekleyin.
2. **Authentication › Sign-in method** bölümünde **Email/Password**'ü açın; altındaki **Email link (passwordless sign-in)** seçeneğini de açın.
3. **Authentication › Settings › Authorized domains** listesine `ahmetyuksel5.github.io` adresini ekleyin. Depo adı değişirse aynı alan adı kalır.
4. **Authentication › Templates** bölümünde e-posta şablonlarının dilini Türkçe yapın; isterseniz gönderen adını da değiştirin.
5. **Firestore Database** oluşturun (production mode).
6. Kuralları yayımlayın (kurucunun adresi `firestore.rules`'ta yazılı). İki yol var:
   - **Firestore › Rules** sekmesine dosyanın içeriğini yapıştırıp yayımlamak;
   - `firebase deploy --only firestore:rules` komutunu çalıştırmak.
7. Web uygulamasının `apiKey`, `authDomain`, `projectId` ve `appId` değerleri ve kurucunun e-postası `src/firebase-ayar.ts`'te. Şu anki proje: `planners-flow-2026`, kurucu `adminplannersflow@gmail.com`.

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

## Yayın: Firebase Hosting

Uygulama `https://plannersflow.net` adresinde (projenin kendi sitesi `planners-flow-2026.web.app`; alan adı Cloudflare'de kayıtlı, DNS kayıtları gri bulut "DNS only"). `main`'e her gönderimde GitHub Actions (`.github/workflows/firebase-yayin.yml`) derlenmiş `docs/` klasörünü bu siteye yayınlar ve Firestore kurallarını depodaki `firestore.rules` ile eşitler; kuralları konsola elle yapıştırmak gerekmez.

Bir kez yapılacaklar:

1. **Anahtar:** Firebase konsolu › Proje ayarları (dişli) › *Hizmet hesapları* › **Yeni özel anahtar oluştur**. İnen JSON dosyasının içeriğinin tamamı GitHub'da depo › *Settings* › *Secrets and variables* › *Actions* › **New repository secret** ile `FIREBASE_SERVICE_ACCOUNT` adıyla eklenir. Dosya kimseyle paylaşılmaz, sohbete yapıştırılmaz; eklendikten sonra bilgisayardan silinir.
2. **İzinli adres:** Firebase konsolu › Authentication › *Settings* › *Authorized domains* › `plannersflow.net` (ve gerekirse `www.plannersflow.net`) eklenir; `planners-flow-2026.web.app` zaten izinli. Yoksa e-posta bağlantısıyla giriş bu adreste çalışmaz.
3. **Kural yetkisi:** Google Cloud › IAM (`console.cloud.google.com/iam-admin/iam?project=planners-flow-2026`) › `firebase-adminsdk-…` hizmet hesabı › kalem › **Add another role** › **Firebase Rules Admin** › Save. Yoksa yayının "Firestore kuralları" adımı 403 ("The caller does not have permission") verir; site yine yayınlanır.
4. **İlk yayın:** GitHub › *Actions* › *Firebase yayın* › **Run workflow**.
5. **Alan adı:** ilk yayından sonra Firebase konsolu › Hosting › **Add custom domain** › `plannersflow.net`. Firebase'in verdiği A ve TXT kayıtları Cloudflare › plannersflow.net › DNS › Records'a girilir; *Proxy status* gri bulut (**DNS only**) olmalı, turuncu bulutta Firebase sertifika veremez. Cloudflare'in eski A/AAAA kayıtları silinir. `www.plannersflow.net` ayrı alan adı olarak eklenir, "Redirect" ile ana adrese yönlenir; Cloudflare'de `www` → `planners-flow-2026.web.app` CNAME kaydı, yine DNS only.

Anahtar eklenmeden iş uyarıyla atlanır. GitHub Pages yeni adres denendikten sonra kapatılabilir (depo › *Settings* › *Pages*).

