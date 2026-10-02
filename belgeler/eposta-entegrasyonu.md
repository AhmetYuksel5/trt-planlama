# E-postayla öneri toplama: Microsoft 365 entegrasyonu

BT birimi için kurulum belgesi. Amaç: muhabirlerin sabah çağrısına verdiği e-posta
yanıtlarının, kimse elle aktarmadan uygulamaya öneri olarak düşmesi.

## 1. Bugünkü işleyiş (değişmeyecek)

- Planlama sabah Arapça bir e-posta atıyor:
  - **Kime:** planlama grubu adresi; bütün planlama ekibi yazışmayı görsün.
  - **BCC:** muhabirler; her muhabirin yazışması müstakil kalsın.
- Muhabirler "Yanıtla" ile önerilerini gönderiyor. Bilgisayarda Outlook,
  telefonda Gmail ya da telefonun e-posta uygulaması kullanılıyor.
- Yanıt planlama grubuna düştüğü için yanıtın hangi istemciden yazıldığı fark
  etmiyor. Yakalama istemcide değil, posta kutusunda yapılacak.

## 2. Prototipte bugün çalışanlar

Sunucu yokken de kullanılabilir:

- **Çağrı ekranı** (`#/oneriler/cagri`):
  - "Outlook'ta aç" bir `.eml` taslağı indiriyor. Taslakta Kime, BCC ve etiketli
    konu dolu, gövde sağdan sola, `X-Unsent: 1`. Outlook dosyayı gönderilmemiş
    taslak olarak açıyor, kullanıcı yalnız Gönder'e basıyor.
  - "Telefonda aç" bir `mailto:` bağlantısı açıyor.
  - "BCC adreslerini kopyala" adresleri panoya alıyor.
  - Çağrı açıldığında kaydediliyor.
- **Gelen yanıtlar ekranı** (`#/oneriler/yanitlar`):
  - kim yanıt verdi, kim "önerim yok" dedi, kim vermedi
  - yanıt vermeyenlere hatırlatma
  - eşleşmeyen e-postaları muhabire bağlama
- **Köprü:** Outlook'tan e-postayı sürükleyip bırakmak (`.msg`), indirilmiş
  `.eml` dosyası ya da yapıştırılan metin. Hepsi sunucunun kullanacağı işleme
  işlevinden geçiyor.

Yanıt işleme kuralları `src/eposta.ts` ve `src/eylemler.ts` →
`epostaYanitiIsle` içinde. Sunucu aynı kodu kullanacak, tarayıcıyla sunucu
ayrışmayacak.

## 3. Hedef mimari

```
Muhabir ──yanıt──▶ planning grubu ──▶ dinleyici posta kutusu (planning-sistem@)
                                         │
                       Microsoft Graph: değişiklik bildirimi + 15 dk'da bir delta
                                         ▼
                              Öneri hizmeti (kurum içi / kurumun Azure'u)
                              epostaYanitiIsle → ortak veri tabanı
                                         ▼
                                 Planlama uygulaması
```

1. **Bildirim:** hizmet, dinleyici kutunun Gelen Kutusu'na Graph aboneliği
   açıyor (`/users/{kutu}/mailFolders('inbox')/messages`, `created`). Yeni
   e-posta saniyeler içinde bildiriliyor.
2. **Yedek tarama:** bildirim kaçarsa diye her 15 dakikada bir delta sorgusu
   (`.../messages/delta`) çalışıyor. Hiçbir yanıt kaybolmuyor.
3. **İşleme** (prototipteki kurallar):
   - **Tekillik:** `internetMessageId` daha önce işlendiyse atlanıyor.
   - **Muhabir:** gönderen adresi rehberdeki kurumsal ya da kişisel adresle
     eşleştiriliyor. Graph SMTP adresini veriyor; Exchange iç adresi sorun
     olmuyor.
   - **Çağrı:** konudaki `[ND-YYYYMMDD]` etiketiyle bulunuyor. "RE:", "FW:",
     "رد:" eklense de etiket kalıyor. Etiket silinmişse muhabirin
     e-postadan önceki son çağrısı alınıyor.
   - **Alıntı ve imza** ayıklanıyor; tam metin ayrıca saklanıyor.
   - **"Önerim yok":** "لا يوجد" gibi kısa yanıt öneri değil, "yanıt verdi,
     önerisi yok" olarak işaretleniyor.
   - **Öneri:** geri kalan yanıt olduğu gibi tek öneri olarak düşüyor
     (kanal: e-posta). Bölmeyi ve başlığı düzeltmeyi plancı uygulamada yapıyor.
     Orijinal e-posta değişmiyor.
   - **Eşleşmeyen:** e-posta silinmiyor, "Eşleşmeyen e-postalar" listesinde
     bekliyor.
4. **İşaretleme:** işlenen e-posta Outlook'ta bir kategoriyle ("Sisteme
   alındı") işaretleniyor. Planlama ekibi gelen kutusunda ne alındığını görüyor.

## 4. Planlama adresinin türü

| Tür | Ortak kutu | Öneri |
|---|---|---|
| Dağıtım listesi | Yok; e-posta üyelerin kutusuna dağılıyor | Gruba bir **dinleyici paylaşılan kutu** (ör. `planning-sistem@`) üye ekleniyor; hizmet yalnız onu okuyor |
| Microsoft 365 grubu | Var | Yine dinleyici kutu: kişilerin kutularına hiç dokunulmuyor |
| Paylaşılan posta kutusu | Kendisi | Doğrudan okunabilir; dinleyici kutu da olur |

Hangisi olursa olsun önerilen yol **dinleyici paylaşılan kutu**. Planlama
ekibinin alışkanlığı değişmiyor, uygulamanın erişimi tek bir kutuyla sınırlı
kalıyor.

## 5. Entra ID uygulama kaydı ve izinler

- **Uygulama kaydı:** kimlik doğrulama sertifikayla, gizli anahtarla değil.
- **Uygulama izinleri** (yönetici onayı gerekli):
  - `Mail.Read`: yanıtları okumak için.
  - `Mail.ReadWrite`: yalnız işlenen e-postaya kategori koymak istenirse.
  - `Mail.Send`: çağrıyı ve hatırlatmayı ileride uygulamanın kendisi
    gönderecekse.
- **Kapsamı daraltma:** bu izinler varsayılan olarak bütün posta kutularını
  kapsar. Exchange Online'da uygulama yalnız dinleyici kutuyla sınırlanmalı:
  - Önerilen: *RBAC for Applications*. `New-ManagementScope` ile kutuyu
    kapsayan bir alan, `New-ManagementRoleAssignment -App ... -Role
    "Application Mail.Read" -CustomResourceScope ...`.
  - Eski yöntem: `New-ApplicationAccessPolicy -AccessRight RestrictAccess
    -PolicyScopeGroupId planning-sistem@...`.
  - `Test-ServicePrincipalAuthorization` ile yalnız o kutuya erişildiği
    doğrulanmalı.

## 6. Hizmetin barınması

- **Nerede:** kurum içi sunucu ya da kurumun Azure aboneliği (Azure Functions /
  App Service). E-postalar kurum içi veri; GitHub Pages'teki herkese açık
  prototipte çalışmıyor ve çalışmamalı.
- **Webhook ucu:** `POST /api/graph/bildirim`, HTTPS. Graph'ın `validationToken`
  doğrulamasını ve `clientState` denetimini yapıyor. Dışarıdan erişilebilir
  HTTPS uç açılamıyorsa yalnız delta taraması kullanılır; gecikme en çok
  tarama aralığı kadar olur.
- **Abonelik yenileme:** posta abonelikleri en çok birkaç gün geçerli;
  zamanlayıcıyla süresi dolmadan yenileniyor.
- **Ortak veri tabanı:** uygulama bugün tarayıcıda (`localStorage`); sunucu
  fazında yalnız `src/veri.ts` içindeki yükle/kaydet değişiyor.
- **Kayıt:** işlem günlüklerinde e-posta içeriği değil, yalnız kimlik ve
  sonuç tutuluyor.

## 7. Güvenlik ve kişisel veri

- Uygulama yalnız dinleyici kutuyu okuyabiliyor (bölüm 5).
- Yanıtı Planlama ve ilgili muhabir görüyor; diğer muhabirler görmüyor
  (uygulamadaki yetki modeli).
- Saklama süresi ve silme kuralı kurum politikasına göre belirlenmeli.
- Ekler prototipte yalnız ad olarak tutuluyor; dosyalar sunucu fazında kurum
  içi dosya deposuna.
- Yapay zekâ kullanılmıyor: yanıt ayrıştırılmıyor, olduğu gibi tek öneri
  olarak düşüyor (karar).

## 8. BT'ye sorular

1. Planlama grubu adresi dağıtım listesi mi, Microsoft 365 grubu mu,
   paylaşılan kutu mu?
2. Dinleyici paylaşılan kutu (`planning-sistem@`) açılıp gruba üye
   eklenebilir mi?
3. Uygulama kaydını ve Exchange kapsamını kim yapacak? Yönetici onayı kimde?
4. Hizmet nerede barınacak: kurum içi mi, Azure mu?
5. Graph bildirimleri için dışarıdan erişilebilir HTTPS uç açılabilir mi?
   Açılamazsa yalnız tarama.
6. Saklama süresi ve erişim politikası ne olacak?

## 9. Alternatif: Power Automate

Kurumda lisans varsa kodsuz bir başlangıç yapılabilir:

1. "Paylaşılan posta kutusuna yeni e-posta geldiğinde (V2)" tetikleyicisi.
2. HTTP eylemiyle öneri hizmetine gönderim.

Akış ve izinler BT'de kalır. Eşleştirme kuralları yine hizmette, aynı koddan
çalışır.

## 10. Doğrulama

Prototipte otomatik denetlenenler (Playwright):

- **Outlook taslağı:** Kime planlama grubu, BCC'de izinliler hariç bütün
  muhabirler, etiketli konu, `X-Unsent: 1`.
- **Outlook `.msg` yanıtı:**
  - gönderen Exchange iç adresiyle gelse de SMTP adresinden muhabire eşleşiyor
  - alıntı ayıklanıyor, öneri olarak düşüyor
  - aynı e-posta ikinci kez işlenmiyor
- **`.eml` ile "önerim yok" yanıtı:** öneri listesine düşmüyor, yanıt takibinde
  görünüyor.
- **Eşleşmeyen e-posta:** muhabire bağlanınca öneriye dönüşüyor.
- **Yanıttan öneri ayırma ve düzenleme:** orijinal e-posta değişmiyor.
- **Muhabir:** kendi e-posta önerisini ve yanıtını görüyor, düzenleyemiyor;
  gelen yanıtlar ekranına giremiyor.
