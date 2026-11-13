# Organizasyon sayfası: üç yönetici ajanın birleşik brifingi

Kullanıcı: "Organizasyon şemasında karmaşıklık var, kullanım zorluğu var, isim
bulmada, işlem yapmada zorluklar var." Üç ajan sayfayı tam yönetici (demo `yo3`)
olarak masaüstünde (1366×800) ve telefonda (iPhone 13, Pixel 7), Türkçe ve Arapça
kullandı; kod değişmedi. Ajanlar: (1) günlük kişi işleri, (2) kurum yapısı ve
ünvanlar, (3) sistemi ilk kez kullanan, telefondan çalışan yönetici.

## Üç ajanın birden gördüğü sorunlar

- **O-01 Arama tutmuyor (yüksek; üçü de).** Kişiler'de arama yalnız ad ve
  e-postada. "احمد" 0 sonuç, "أحمد" 3 (hemze); "Ahmet" "Ahmed"i bulmuyor;
  birim, ünvan, şehir adıyla ("planlama", "dil denetmeni", "Kahire", "Sunucu")
  0. Birimler ve ünvanlar sekmesinde arama hiç yok; sayfa masaüstünde 3.700,
  telefonda 7.300 piksel. Sonuç ağacın içinde, 4–5 kat iç içe, telefonda ekranın
  dibinde.
- **O-02 Aynı ad iki kez (yüksek; üçü de).** İki "Output" (kademe ve birim),
  "Program"/"Programlar"; gizli Yönetim biriminde müdür ünvanlarının kopyaları.
  Birim seçiminde ayrım yalnız girintiden. Ajan 1 kişiyi yanlış "Output"a geçirdi,
  ünvanı sessizce eski kaldı.
- **O-03 Neyin anında, neyin taslakta geçerli olduğu belli değil (yüksek; 2, 3).**
  Kişiler'deki tayin hemen geçerli, geri alınamıyor; Birimler'deki değişiklik
  taslakta, ama bildirim her yerde "Kaydedildi". Taslak yokken "yayında" diye bir
  işaret yok.

## Ajana özgü önemli bulgular

- **O-04 Tayinde kişi sessizce yönetici oluyor (kritik; 3).** Muhabiri Spor'a
  geçirince görev kendiliğinden "Birim yöneticisi", rol `yonetici` oldu; soru yok,
  "Geri al" yok. (Kural: birim değişince birimin ilk ünvanı; Spor'un ilki
  yönetici.)
- **O-05 Etki penceresi iç kimlikle konuşuyor (yüksek; 2).** "umwf0u0dak6jt →
  منتج تنفيذي"; değişiklik listesinde "Ekonomi · değişti", hangi ünvan yazmıyor.
- **O-06 Ortak ünvanın adı her birimde değişiyor, pencere söylemiyor (yüksek; 2).**
  "Sunucu"yu "Spiker" yapınca Programlar'daki de değişti. Türkçe ad alanı boş,
  "Sunucu" yalnız yer tutucu.
- **O-07 "Tayin et" bütün düzeltmelerin kapısı (yüksek; 1, 3).** E-posta ya da
  şehir düzelten bunu akıl etmez; Hesaplar'da aynı pencerenin adı "Düzenle".
  Asıl alan (birim) 6. sırada.
- **O-08 Müdürün sorumluluğu hiçbir yerde yazmıyor (yüksek; 2).** Kart yalnız
  "Yönetim kademesi" diyor; kapsam ağaçtan çıkarılıyor.
- **O-09 Kök birim tek dokunuşla gizleniyor (yüksek; 3).** "Haber Merkezi"
  onaysız gizlendi.
- **O-10 Onay bekleyen kişi ağaçta işaretsiz (orta; 1).** Üstteki kart var,
  satırda rozet yok.
- **O-11 Ünvana göre listeleme yok (orta; 1).** Ancak başka sayfadaki Görev
  süzgeciyle.
- **O-12 Sürüme dönüş iki adımlı ve şaşırtıcı (orta; 2).** "Taslağa al" sonra
  yeniden "Yayınla".
- **O-13 Plan ekibi kuralında ünvanlar birimsiz (orta; 2).** "Sunucu" iki birimi
  birden alıyor; kişi sayısı pencerenin dibinde.
- **O-14 Telefonda kartlar ve sekmeler (orta; 2, 3).** Ünvan satırı ~240 piksel
  (4 simge düğmesi ayrı satırda), Newsdesk kartında 22 düğme; altı sekmeden üçü
  ekran dışında, kaydığı belli değil; kişi adının dokunma alanı 23 piksel.
- **O-15 Küçükler (düşük).** Ünvan ekleme kutusu yer tutucusuz; öneriler Arapça ve
  İngilizce adla da eşleşiyor ("Edi" → Dil denetmeni); alt birimde Arapça ad
  sorulmuyor; "Yetkileri" (gibi çalıştığı birim) anlaşılmıyor; "Plan ekibi" ile
  "Plan yetkileri" karışıyor; demoda Hesaplar adresi sessizce Kişiler'i açıyor;
  şehir listesi 46 seçenek, aramasız.

Doğru çalışan: geri tuşu pencereyi kapatıyor, profilden dönünce arama ve kaydırma
yerinde; alt birim eklemek 2 tık.

## Öneri: üç parti (önce görünümü değiştirmeyenler)

**1. parti, güvenlik ve bulma** (görünüm aynı; yapıldı, `testler/org-bulma.cjs`):
- Tayinde görev kendiliğinden yönetici olmasın: birim değişince yönetici olmayan
  ilk ünvan; rol yöneticiye çıkıyorsa onay sorusu. Tayinden sonra bildirimde
  "Geri al" (O-04).
- Kişiler araması `arama.ts`'in normalleştirmesiyle (hemze, hareke, Türkçe harf
  Latin'e), birim, ünvan ve şehir adıyla; arama varken ağaç yerine düz sonuç
  listesi: ad, "Birim › Ünvan · Şehir", Düzenle (O-01, O-11).
- Birimler ve ünvanlar sekmesinin üstüne arama: birim ve ünvan adı üç dilde,
  eşleşmeyen kart gizlenir, eşleşen ünvan vurgulanır (O-01).
- Aynı adlar yoluyla: seçimlerde "Output › Output", "Program › Programlar";
  gizli Yönetim varsayılan olarak listede yok (O-02).
- Kök ve kişisi olan birimde "Gizle" onaylı; taslak değişikliğinde bildirim
  "Taslağa eklendi, yayınlanmadı"; taslak yokken "Yayında · sürüm n" (O-03, O-09).

**2. parti, anlaşılırlık:**
- Etki penceresi ve değişiklik listesi adla konuşsun: "Ekonomi'ye Spiker eklendi"
  (O-05).
- Ünvan penceresinde "Bu ünvan şu birimlerde: …", ad alanları gerçek değerle
  (O-06).
- "Tayin et" → "Düzenle" (Hesaplar'la aynı); pencerede birim ve görev üstte
  (O-07).
- Kademe kartında ve kişinin satırında "Sorumlu olduğu birimler" (O-08).
- Ağaçta onay bekleyene rozet ve "Onayla" (O-10).
- Plan ekibinde ünvan "Sunucu · Newsdesk", kişi sayısı üstte (O-13).
- Sürüme dönüş tek onaylı adım: "Bu sürüme dön ve yayınla" (O-12).

**3. parti, telefon:** ünvan satırının oklar ve kalemi ⋯ menüsüne; sekme şeridine
kayma işareti; kişi adı 44 piksel; O-15'in küçükleri.

**Büyük değişiklik (onaysız yapılmaz):** Birimler sekmesi iki bölmeli (solda ağaç,
sağda seçili birim; telefonda iki ekran) ve ayrı "Ünvanlar" listesi (her ünvan bir
kez, birimleriyle); Kişiler, Hesaplar ve Postadan kişiler tek "Kişiler"de.
