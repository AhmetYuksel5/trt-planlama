# Yapay zeka özellikleri

Plannersflow'un yapay zeka özellikleri ("Kısalt", "Biçimle", "Haber değeri", "Son gelişmeler") küçük bir aracı
üzerinden çalışıyor: **yapay zeka kapısı**, Cloudflare Workers'ta,
`https://yz.plannersflow.net`. Kodu depoda `worker/`.

## Neden ayrı bir kapı

- **Veritabanı yerinde kalıyor.** Kayıtlar, girişler ve site Firebase'de.
  Kapı yalnız sağlayıcının API anahtarını saklıyor ve isteği iletiyor.
- **Anahtar tarayıcıya hiç gitmiyor.** Anahtar Firestore'a yazılsaydı
  sisteme giren herkes onu okuyabilirdi. Kapı anahtarı kendi deposunda (KV)
  tutuyor; ekrana yalnız son dört hanesi geliyor.
- **Uç nokta adresi de kapıda.** Firestore'daki ayarları herhangi bir etkin
  kişi yazabiliyor. Adres oradan okunsaydı biri onu kendi sunucusuna çevirip
  anahtarı ele geçirebilirdi.
- **Ücretsiz.** Firebase Cloud Functions Blaze planı istiyor. Cloudflare
  Workers'ın ücretsiz planı günde 100.000 istek veriyor ve kredi kartı
  istemiyor.

## Bir istek nasıl işliyor

1. Kişi Next Day gelişme formunda ya da haftalık kalem / ana dosya
   formunda "Kısalt"a basar.
2. Tarayıcı kapıya metni ve kişinin Firebase oturum belgesini gönderir
   (`src/yz.ts`).
3. Kapı:
   - oturum belgesini Google'ın açık anahtarlarıyla doğrular
     (`worker/src/dogrula.ts`);
   - kişinin kaydını Firestore'dan kişinin kendi oturumuyla okur. Pasif
     kişi giremez; tam yöneticilik alanını Firestore kuralları koruyor.
   - özellik açık mı, kişinin birimine açık mı, günlük hakkı kalmış mı,
     bakar;
   - sağlayıcıyı çağırır (`worker/src/saglayici.ts`).
4. Sonuç forma gelir. Kayda yazılmaz: kişi bakıp kendisi kaydeder.
   "Önceki metin" eski metni geri getirir. Belge görünümünde (Next Day ve
   haftalık) satırın şeridindeki ✨ sonucu hemen kaydeder; ↶ geri alır.

Demoda kapıya gidilmez: "Kısalt" metnin ilk cümlesini verir, ayar
kaydedilmez.

## Özellikler

- **Kısalt:** Next Day gelişmesi, haftalık kalem ve ana dosya metnini plan
  satırına sığacak tek satıra indirir.
- **Biçimle:** Öneri formlarında (yeni öneri, Düzenle, muhabirin "Düzelt ve
  yeniden gönder"i) önerinin Header'ını, Strap'ini, plan satırındaki
  gelişmesini ve haber türünü kurumun biçimine çevirir. Sonuç alan alan
  gösterilir; "Uygula" ya da "Hepsini uygula" forma yazar, kişi kaydeder.
  Kapıya şunlar da gider:
  - başlık havuzundaki dosya adları: öneri var olan bir dosyaya uyuyorsa
    Header aynı adla gelir, havuz bölünmez;
  - Planlama'nın son beş düzeltmesi (muhabirin yazdığı → son hal): model
    kurumun elinden geçmiş biçimi örnekten görür.
- **Haber değeri:** Önerinin değerlendirme bölümünde "Haber değeri görüşü
  al". Her ölçüte 1–5 puan ve kısa gerekçe, sonunda genel kanaat (yüksek,
  orta, düşük). Yalnız tavsiye: karar düğmelerine dokunmaz. Görüş öneriye
  bağlı ayrı kayıtta saklanır, Planlama'nın hepsi görür (hak bir kez yenir),
  muhabir görmez. "Yeniden değerlendir" eskisinin yerine yenisini yazar.

- **Son gelişmeler:** Başlık (haber dosyası) için internette arar ve kısa
  bir Arapça takip paragrafı yazar; aralık son 24 saat, 3 gün ya da 7 gün.
  - Next Day'de başlığın "+" menüsünden; sonuç düzeltilip "Gelişme olarak
    ekle" ile başlığın altına girer (kaynak: alıntılanan siteler).
  - Weekly'de ana dosya formunda; "Durum özetine yaz" forma yazar.
  - Başlığın sayfasında; yalnız kopyalanır.

  Bizdeki son satırlar (son Next Day gelişmeleri, haftalık kalemler) de
  gider: model zaten yazılanı tekrarlamaz, yenisini yazar. Kaynak
  bağlantıları sağlayıcının alıntılarından gelir, model uyduramaz; plana
  koymadan önce bakılmalı. Arama sağlayıcıda ek ücretlidir; günlük sınırı
  ona göre ayarlayın.

  Sağlayıcı: Claude (arama aracıyla) ya da OpenAI (Responses API). Öbür
  OpenAI uyumlu sağlayıcıların çoğu internette arama yapmaz; "Seçilen
  sağlayıcı internet aramasını desteklemiyor" hatası verir. Ayarlar'da
  **aranacak siteler** yazılabilir (her satıra bir alan adı, örneğin
  `aa.com.tr`); boşsa bütün web.

Her özelliğe Ayarlar'da **yönerge** yazılabilir (kurumun kendi biçimi,
üslubu, örnekleri). Kapının varsayılan yönergesinin arkasına eklenir;
çelişirse yöneticininki geçerlidir. Haber değerinde **ölçütler** her satıra
bir tane yazılır; boşsa varsayılanlar: güncellik, Arap izleyiciye yakınlık,
etki ve önem, özgünlük, Türkiye bağlantısı, görüntü ve uygulanabilirlik.

## Sağlayıcılar

Ayarlar › Yapay zeka (yalnız tam yönetici, yalnız gerçek kipte):

- **Claude (Anthropic):** Resmî SDK'yla çağrılır. Model alanına örneğin
  `claude-opus-5-5` yazılır. Kısa iş olduğu için düşük çaba (effort)
  kullanılır. Destekleyen modellerde sunucu tarafı yedek açıktır: model bir
  isteği reddederse aynı çağrıda başka bir modelle sürer.
  Anahtar Console'da bir çalışma alanının (workspace) içinden açılmamışsa
  Anthropic "This API key is not scoped to a workspace…" diye 400 verir.
  İki çözüm: çalışma alanının içinden yeni anahtar açmak, ya da sağlayıcı
  penceresindeki "Çalışma alanı kimliği"ne o alanın kimliğini yazmak (kapı
  `anthropic-workspace-id` başlığında gönderir).
- **OpenAI uyumlu:** OpenAI, Mistral, Groq, OpenRouter, DeepSeek,
  Gemini'nin uyumlu ucu gibi `…/v1/chat/completions` biçimini kabul eden
  her sağlayıcı. Uç nokta adresi `https://` ile başlamalı (örneğin
  `https://api.openai.com/v1`).

Model adı ezberden yazılmaz: anahtar yazılınca "Modelleri getir" sağlayıcının
listesini çeker (anahtar bu istekte kullanılır, kaydedilmez; kayıtlı
sağlayıcıyı düzenlerken liste kendiliğinden gelir). OpenAI'da sohbet dışı
modeller (ses, görsel, embedding…) listelenmez. "Dene" (⚡) sağlayıcıya kısa bir deneme isteği gönderir; hata verirse sağlayıcının
kendi hata metni de görünür. Anahtar alanı boş
bırakılırsa kayıtlı anahtar korunur; "Kayıtlı anahtarı sil" onu siler.

Her özellik için ayarlanabilenler:

- **Açık/kapalı.**
- **Sağlayıcı:** Boşsa ilk etkin sağlayıcı.
- **Birimler:** Boşsa bütün birimler. Tam yönetici her zaman kullanabilir.
- **Kişi başına günlük sınır:** Gün İstanbul saatiyle döner. Yalnız
  başarılı çağrı sayılır.

Kartta bugünkü toplam kullanım da görünür.

## Kurulum (bir kez)

1. **Cloudflare API token'ı:** Cloudflare › My Profile › API Tokens ›
   Create Token › "Edit Cloudflare Workers" şablonu. Yetkiler:
   - Account › Workers Scripts: Edit
   - Account › Workers KV Storage: Edit
   - Zone (plannersflow.net) › Workers Routes: Edit
   - Zone (plannersflow.net) › DNS: Edit
2. **Account ID:** Cloudflare panelinde plannersflow.net'in Overview
   sayfasının sağ altında.
3. **GitHub gizli değerleri:** Depo › Settings › Secrets and variables ›
   Actions'a iki gizli değer eklenir: `CLOUDFLARE_API_TOKEN` ve
   `CLOUDFLARE_ACCOUNT_ID`.
4. **İlk dağıtım:** "Yapay zeka yayın" işini çalıştır (Actions › Yapay zeka
   yayın › Run workflow) ya da `worker/`'a bir değişiklik gönder. İş:
   - testleri koşar;
   - KV deposunu (`plannersflow-yz`) yoksa açar;
   - kapıyı `yz.plannersflow.net`e dağıtır; Cloudflare alt alan adının
     DNS kaydını kendisi açar.
5. **Sağlayıcıyı ekle:** Kurumun tam yöneticisi gerçek sitede Ayarlar ›
   Yapay zeka'da sağlayıcıyı ve anahtarını ekler, "Dene" ile sınar,
   "Kısalt"ı açar.

Gizli değerler yoksa iş testleri koşar, dağıtımı uyarıyla atlar.

## Sınırlar

- Günlük sınır kaba bir koruma: KV anlık tutarlı değil, aynı anda gelen
  birkaç istek sınırı birkaç adım aşabilir. Sağlayıcı tarafında da bütçe
  sınırı konmalı.
- Birim kişinin kaydından okunuyor; birim yetkisi programın geri kalanında
  olduğu gibi programda denetleniyor, Firestore kuralında değil.
- Yapay zekaya giden metin sağlayıcının sunucusuna gider. Hangi içeriğin
  gönderilebileceğine kurum karar verir.

## Yeni özellik eklemek

1. `worker/src/ayar.ts → OZELLIKLER` listesine adını ekle.
2. `worker/src/ozellikler.ts → istekKur` içine yönergesini yaz.
   Alanlı sonuç istiyorsa `json: true` ve `sonucCoz`'a ayıklaması.
3. `src/yz.ts → YZ_OZELLIKLERI` listesine ekle (girdi ve sonuç tipi, demodaki
   sahte sonucu), ekrandaki düğmesini yaz (örnek `bilesenler/YzKisalt.tsx`,
   `bilesenler/YzOneri.tsx`).
4. `ekranlar/YapayZeka.tsx → OZELLIK_ADI` içine adını, `dil.ts`'e metnini
   ekle.

Testler: `cd worker && npm test`.
