# Aşama kutuları: iş kutunun içinde · brifing

Kullanıcının isteği (14 Kasım): paket sayfasındaki aşama kutuları yalnız durum
göstermesin; bütün aşamalar kutuların içinde gerçekleşsin, kutuya basınca
içeriği açılsın, iş ilerleyince hangi aşamadaysa o kutuya gidilsin. Kalabalık
değil, sade, işlevi üst düzey.

12 ajan ayrı ayrı baktı: 3 tasarımcı (görsel, mobil, bilgi mimarisi), 3
planlamacı (Planlama yöneticisi, stok/masa, koordinatör), 4 haber merkezi
çalışanı (dış muhabir, Newsdesk editörü, dil denetmeni, grafiker) ve 2
yazılımcı (bileşen, veri/yetki). Aşağıda ortak görüş, ayrışan noktalar ve
uygulama partileri var.

## 1. Bugünkü sorun

- Yedi büyük kutu telefonda ekranı kaplıyor; iş (EylemKarti, ParcaliMetin,
  UretimYoluKarti, Notlar, Yapıldı/Yapılmadı) aşağıda ayrı kartlarda.
- Aynı bilgi üç yerde: durum rozeti, "Şimdi kimde" satırı, kutu.
- "Gecikti" paketin genel teslim saatinden; aşamada ne kadar beklendiği,
  kaç kez iade edildiği görünmüyor.
- İade gerekçesi muhabir yeniden gönderince siliniyor, iz kayboluyor.

## 2. Ortak karar (12 görüşün hepsi ya da çoğu)

**Biçim: dikey adım listesi, tek açık akordeon.** Yatay şerit yok (Arapça
adlar 390 pikselde sığmıyor, RTL'de kayan şerit yön karıştırıyor).

```
┌ PKG · غزة / عنوان التقرير ────────── ⋯ ┐
│ ✓ Planlama            A. Kaya  09:12  │  kapalı satır, 48 px
│ ✓ Görevlendirme       Newsdesk 09:40  │
│ ● Metin ve denetim    Sıra sende      │  açık: işin kendisi
│ │  Intro   ✓ hazır                    │
│ │  Text    ● Editoryal · 20 dk  ↺1    │
│ │  [ Arapça metin alanı …………… ]       │
│ │  [İade]           [Düzelt ve geçir] │
│ │  PTC     ○ muhabirde                │
│ ○ Video kontrolü      Newsdesk        │
│   └ ○ Gfx             Grafik          │  yan iş, girintili
│ ○ Sisteme yükleme     gfx bekleniyor  │
│ ○ Yayın kararı        Planlama        │
├───────────────────────────────────────┤
│ ▸ Geçmiş ve notlar · 14               │  katlı
└───────────────────────────────────────┘
```

**Kapalı satır** (tek dokunma hedefi): durum dairesi (✓ geçti, ● şimdi, ○
sırada, kırmızı süre gecikti, üstü çizili atlandı), aşamanın adı, kimde (kişi,
yoksa masa), süre ya da bitiş saati, iade sayısı (↺ n; sıfırsa yok). Renk
yalnız durumda (kimlik 3.5); kutulara renkli zemin yok.

**Açık kutu:**
- *Şimdiki ve sıra bende:* aşamanın işi. Tek birincil düğme, ikinciller ⋯.
- *Şimdiki ama sıra başkasında:* "Script Editor'de · 12 dk". Pasif düğme
  kalabalığı yok.
- *Geçmiş:* salt okunur sonuç: künye satırı (kim, saat), iade gerekçesi,
  aşamanın notu, düzeltilmiş metin.
- *Gelecek:* yalnız masası ("Grafik yapacak").

**Aynı iş tek yerde.** EylemKarti, ParcaliMetin, "Gfx hazır", Yapıldı/Yapılmadı
kutuların içine girer; ayrı "Senin sıran" kartı, "Şimdi kimde" satırı ve
UretimYoluKarti kalkar (masa satırda, şablondan farklı satırda sarı nokta,
"Yolu düzenle" listenin ⋯'sinde).

**Sayfada kalan:** başlık ve tek durum rozeti; Bilgiler, paket metni, yönetici
notu yan sütunda (telefonda altta); "Geçmiş ve notlar" en altta katlı; biten
pakette künye özeti (Muhasebe ve muhabir için).

## 3. Aşama aşama içerik

| Aşama | Kutunun içinde |
|---|---|
| Planlama | önerinin özeti ve bağlantısı, plan ve başlık (başlığa götürür), kabul kararı, karar notu, şartlıysa koşul; balonun şablonu ve "istisna n"; üretime girmemişse "Üretime başlat" |
| Masa · üretime alma | "Üretime al" (balon) |
| Görevlendirme | muhabir ve görev ver |
| Metin ve denetim | parçalar satır satır (ad + muhabir → editoryal → dil → hazır mini çizgisi); sırası kişide olan parça açık |
| Gfx (yan iş) | dil denetiminden geçmiş gfx metni salt okunur, kopyalanır; strap, yer; dosya/yol notu; "Gfx hazır" ve geri al |
| Video kontrolü | büyük bağlantı (mümkünse oynatıcı), altında birleşik metin katlı; Onayla / Revizyona iade (hangi durağa döneceği yazılı) |
| Sisteme yükleme | önerilen klip kodu dolu; tek düğme "Yüklendi"; gfx bekleniyorsa başlıkta "Gfx bekleniyor · Grafik · n dk" (basınca gfx kutusu); gfx hazırsa grafiğin notu |
| Yayın kararı | Yapıldı / Yapılmadı, onay (onay kuyruğundakiyle aynı) |
| Stok | son iki kutu Stokta → Yayınlandı (hangi plan, hangi gün) |
| Masa paketi | son kutu masanın yayın kararı (Yayınlandı / Yayınlanmadı gerekçesiyle) |
| Özel yayın paketi | kendi aşamaları: öneri → onaylandı → görevlendirildi → hazırlanıyor → hazır |
| Sade (balonsuz) | üç kutu: plana eklendi, muhabirde (Yapıldı/Yapılmadı, başka muhabire ver), tamamlandı |
| İptal | kutular sönük, açılmaz |

## 4. Metin işi (Newsdesk, dil denetmeni, muhabir)

- Yan yana önceki/sonraki yok; tek alanda doğrudan düzeltme. Altında katlı
  "Değişiklikleri göster": sözcük düzeyinde fark (silinen üstü çizili, eklenen
  vurgulu). Bunun için parçada muhabirin ilk hali saklanmalı (bugün
  `parcaDuzelt` üzerine yazıyor).
- Alan kutunun bütün genişliğinde, metinle uzar (iç kaydırma yok), Naskh,
  18–20 piksel, satır aralığı 1,8–2, yazım denetimi kapalı; metne `trim`
  dışında dokunulmaz.
- İade: tek dokunuş, satır içinde gerekçe kutusu (odak orada, Ctrl+Enter
  gönderir, Esc vazgeçer), sık gerekçeler çip (kaynak eksik, uzun, PTC yok);
  onay sorusu yok, bildirimde "Geri al".
- Onay soruları azalır: editörün ve dil denetmeninin adımlarında hiç,
  muhabirin parça gönderiminde hiç; yalnız video gönderiminde.
- Dil denetmeninin sade ekranı aynı bileşen: yalnız sırası kendisinde olan
  parçaları dizer. Bugün iki ayrı kod (`DilDenetimi.tsx`, `ParcaliMetin.tsx`).
- Yazılan metin taslak olarak kalır (kutu kapanınca, sayfadan çıkınca,
  başkası kaydedince).

## 5. İlerleme ve odak

- Kendi eyleminden sonra: kutu ✓ olup kapanır, sıradaki açılır ve ona kayılır
  (az hareket tercihinde animasyonsuz). Odak kutunun başlığına, yazı alanına
  değil (telefonda klavye kendiliğinden açılmasın).
- Kendiliğinden açılan kutu kişinin sırası olan kutu: muhabire metin, dil
  denetmenine dil, grafiğe gfx.
- Başkasının ilerletmesi okuduğu yeri kaydırmaz; üstte tek satır "Şimdi: Video
  kontrolü ›".
- Yarım yazılmış form varken kutu değişmez, kayma olmaz.
- Paralel iş (gfx) kendi odağını tutar: video ilerleyince grafikçi
  sürüklenmez.
- Aynı anda bakan biri ilerlettiyse açık kutuda "Bu aşama az önce X tarafından
  geçildi", düğmeler kapanır.
- Kutu açmak tarayıcı geçmişine adım eklemez; açık kutu adım durumunda tutulur
  (geri gelince aynı kutu açık). Kutudan açılan pencere eskisi gibi geri tuşuyla
  kapanır.
- Bildirim ve @anma ilgili kutuyu (ve parçayı) açar.

## 6. Veri ve yetki (yazılımcılar)

- `paketYolu` her adıma kimlik ve tür ekler; içerik saf bir eşlemeden
  (`asamaIcerigi`), ekran yalnız çizer.
- Aşama süresi ve iade sayısı hareket kaydından hesaplanmaz (son 2000 kayıtla
  sınırlı, biten adım değil sonraki yazılıyor, parça adla tutuluyor): pakette
  `asamaIzi` (aşama başına başlangıç, bitiş, kişi, iade sayısı), künye gibi tek
  yardımcıyla yazılır. Eski paketlere açılış işi bir kez künyeden doldurur;
  eksik iz boş görünür.
- Not aşamaya bağlanır (`Not.asama`, yazıldığı an açık olan kutu); kutuda o
  aşamanın notları, genel listede etiketle. Tek akış, ayrı not kutuları yok.
- Yetki kuralı yeni yazılmaz: `adimYapabilir`, `parcaYapabilir`,
  `gfxYapabilir`, `uretimYoluBelirleyebilir`; düğme ve eylem aynı kuralı sorar.
- Muhabir paket belgesinin tamamını okuyor: "ekibe özel" bir aşama notu
  istenirse pakete değil ayrı kayda yazılmalı. Muhabire masa tikleri ve ⋯
  gösterilmez.
- Yeni alanların hepsi isteğe bağlı; Firestore kuralı ve demo anahtarı
  değişmez.

## 7. Kaçınılacaklar (hepsinin ortak listesi)

Birden çok açık kutu; kutu içinde ikinci pencere; aynı bilginin iki yerde
olması; kutuda anlatım metni; gelecek aşamada pasif düğme; her adımda "Emin
misin?"; gfx'i sıralı adım gibi göstermek (Grafik'te tıkanmış görünür);
gfx'siz pakette boş gfx kutusu; gfx metnini grafikte düzenlenebilir yapmak;
yatay kaydırma; parçaları ayrı kutu yapmak; bütün hareket geçmişini kutuya
dökmek; kutu açılınca kendiliğinden kayda bir şey yazmak; başkasının
ilerletmesiyle sayfanın zıplaması.

## 8. Karar bekleyen noktalar

1. **Masaüstü düzeni.** İki görüş: (a) her yerde aynı akordeon, en çok 720
   piksel genişlikte; (b) masaüstünde iki sütun: solda dar adım listesi,
   sağda seçili kutunun içi geniş (Newsdesk ve bir tasarımcı). Öneri: (b),
   960 pikselden genişte; telefonda akordeon.
2. **Editoryal fark görünümü.** Muhabirin ilk metni parçada saklansın mı?
   Öneri: evet (yalnız ilk hal, sürüm geçmişi değil).
3. **Aşama süresi ve iade sayacı.** Pakete `asamaIzi` eklensin mi? Öneri:
   evet; olmadan "ne zamandan beri" ve "kaç tur döndü" doğru gösterilemez.
4. **Ekibe özel aşama notu.** Muhabir görmesin mi? Öneri: şimdilik hayır
   (notlar bugünkü gibi herkese açık, aşama etiketiyle); gerekirse ayrı kayıt.
5. **Newsdesk'in paketten pakete geçişi** ("Sıradaki işlerim" sol kenarda,
   kararla sonraki pakete geçiş, J/K): bu işin dışında, sonraki adım.

## 9. Uygulama partileri

1. **Kabuk:** `paketYolu` kimlikleri, dikey akordeon (kapalı satır, tek açık
   kutu), açık kutu adım durumunda, kendi eyleminden sonra sıradakine geçiş.
   Şimdiki kutuya bugünkü işler olduğu gibi girer; sayfadaki tekrarlar
   (Şimdi kimde, Senin sıran, UretimYoluKarti) kalkar. Testler yeşil kalır.
2. **Aşama içerikleri:** Planlama kutusu, parça satırları ve satır içi iade,
   gfx yan kutusu, video ve yükleme, yayın kararı; sade, masa, stok ve özel
   yayın; geçmiş kutuların salt okunur içeriği; onay sorularının azaltılması;
   dil denetmeni ekranının aynı bileşene geçmesi.
3. **İz ve bağlantı:** `asamaIzi` (süre, iade sayısı), `Not.asama`, parçanın
   ilk hali ve fark görünümü, bildirimden kutuya derin bağlantı, "Şimdi: X ›"
   satırı, taslak saklama; masaüstü iki sütun.

Her parti 390 pikselde Türkçe ve Arapça taşmasız; test `testler/asama-kutu.cjs`.
