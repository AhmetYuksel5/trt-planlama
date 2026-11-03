# Plannersflow inceleme raporu (Kasım 2026)

9 inceleyici (3 yazılımcı, 3 planlamacı, 3 tasarımcı) programı koddan ve demoda
tıklayarak taradı. Kod değiştirilmedi. Bulgular tekrarlarından ayıklandı, önem
sırasıyla gruplandı. Her maddede kaynak: Y1–Y3 yazılımcı, P1–P3 planlamacı,
T1–T3 tasarımcı.

Genel durum: 22 sayfa üç ekran biçiminde (1440 TR, 390 AR, 390 TR) ve yüzlerce
düğme tıklanarak denendi; konsol hatası, hata sınırı ve 390 pikselde yatay taşma
çıkmadı (Y3). Sorunlar çökme değil; güvenlik, kural tutarlılığı ve kullanım.

---

## A. Güvenlik (gerçek kipte, önce bunlar)

1. ✅ **Kritik: muhabir kendini tam yönetici yapabiliyor (Y2).** Kural kişi
   belgesinde yalnız düz alanları (`hesapYoneticisi`, `pasif`…) koruyor, program
   kişiyi `j` metninden kuruyor. Muhabir kendi `j`'sine `"hesapYoneticisi":true`
   yazar; tam yöneticinin tarayıcısı o kişiyi yeniden yazdığında (ör.
   `muhabirUnvanlariniEsitle`) `fark.ts → ogeBelgesi` bunu düz alana çıkarır ve
   kural kabul eder. (`firestore.rules:122-125`, `depo/fark.ts:205-224`)
   Çözüm: kural `j` içindeki yetki anahtarlarını düz alanla eşit tutsun; program
   yetkiyi düz alandan okusun.
2. ✅ **Yüksek: kısıtlı muhabir kendi paket/öneri belgesine her alanı yazabiliyor
   (Y2).** Kural yalnız erişim listesine bakıyor: muhabir paketini `tamamlandi`,
   önerisini "plana eklendi" yapabilir, onay yetkisini atlar; hareket kaydına
   başkasının adıyla bildirim yazabilir. (`firestore.rules:165-167`)
3. ✅ **Orta: davetteki `kisiId` denetlenmiyor (Y2).** Davet yetkili kişi davete
   etkin bir muhabirin kimliğini koyarsa yeni hesap o muhabirin kayıtlarını okur
   ve üstlenir; `kendiKayitlariniTasi` hesapsız denetimi yapmıyor.
4. ✅ **Orta: `/modeller` kayıtlı anahtarı istekteki adrese gönderiyor (Y2).**
   Yöneticinin oturumu ele geçirilirse saklı yapay zeka anahtarı başka sunucuya
   sızar. (`worker/src/index.ts:232-246`) Kayıtlı anahtar yalnız kayıtlı adresle.
5. ✅ **Düşük-orta:** kapı birimi kişinin kendi yazabildiği `j`'den alıyor (yapay
   zekada birime kapalı özellik açılabilir); kayıt başvurusu kod bilen herkesçe
   başkası adına ezilebiliyor; günlük yapay zeka sınırı eşzamanlı istekte
   aşılıyor (Y2).

## B. Veri kaybı ve eşzamanlılık

6. **Plan tek belge, son yazan kazanıyor (Y2).** Toplantıda iki planlamacı aynı
   planın farklı başlıklarını düzenlerse birinin değişikliği sessizce gidebilir;
   haftalık ve özel yayın da öyle. Alan düzeyinde güncelleme ya da sürüm
   denetimi gerekli.
7. ✅ **Bayat sekme yarının planını yeniden yazabilir (Y2).** Eşitlik bir kez
   sağlanınca kopukluk sonrasında da sürüyor; uyuyup bağlantısız uyanan dizüstü
   `nd-<tarih>`'i şablondan kurup bağlantı gelince düzenlenmiş planı ezebilir.
8. **Paket kodu sayacı işlemsiz (Y2):** aynı anda iki paket aynı `TRT-AR-…` kodunu
   alabilir; genel ayar belgesi birleştirmesiz yazıldığı için bayat sekme
   yöneticinin az önce değiştirdiği ayarı geri alabilir.
9. **Öneri ile gelişme ayrı dinleyicide (Y2):** dar bir anda
   `onerileriPlanlaEsitle` plana yeni girmiş öneriyi "değerlendiriliyor"a
   döndürebilir.

## C. Kural ve kod çelişkileri

10. ✅ **`oneriDuzenle` üretimdeki, tamamlanmış, devredilmiş paketleri de değiştiriyor
    (Y1).** Masa (kol) değişirse paketin akışı değişiyor; devralınmış planın
    gelişmesi de. CLAUDE.md "onaylı paketin yalnız metni düzelir" diyor.
11. ✅ **`oneriPlanaEkle` eylemde teklif, reddedilmiş, geri çekilmiş, düzeltmedeki ve
    arşivdeki öneriyi reddetmiyor (Y1)** — yetki yalnız düğmede.
12. ✅ **Haftalık gündemdeki öneri düzeltmeye gönderilebiliyor ya da reddedilebiliyor
    (Y1);** kalemi gündemde kalıyor.
13. ✅ **Gelişme başlıksız متابعات'e taşınınca PKG'si ve muhabiri eski başlıkta
    kalıyor (Y1).** (`eylemler.ts:2059`)
14. ✅ **Newsdesk devraldığı planda gelişme/canlı silerek öneriyi değerlendirmeye
    döndürebiliyor (Y1);** aynı sonucu doğuran "Plandan çıkar" karar yetkisi ister.
15. ✅ **"İzleriyle sil" ve kayıt temizliği başlıktaki muhabiri ve boş başlığı
    bırakıyor (Y1);** "Plandan çıkar" kaldırıyor. Anılma kayıtları da kalıyor.
16. ✅ **Küçükler (Y1):** `kisiSil` gelişme muhabirini (`Gelisme.muhabirler`) açık
    plandan çıkarmıyor; `oneriKopyala` `takipId`, `yanitId`, düzeltme notu gibi
    "geçmez" denen alanları taşıyor; arşivden çıkan reddedilmiş öneride ret
    gerekçesi kalıyor.
17. ✅ **Takvimden aktarım yanlış güne gidebiliyor (Y3).** Yarının planından "bu
    güne" açılan pencerede kişinin yarında yetkisi yoksa form bugünün planını
    seçiyor; başarısız gönderimde de hiçbir bildirim çıkmıyor.
    (`takvim/Ayrinti.tsx:354-374`)
18. **Ara işler muhabirin ziline düşüyor (P2):** "dil denetimini bitirdi",
    "iNews'e aktarıldı" gibi satırlar; `muhabirBildirimi` kuralına aykırı.

## D. İş akışı (planlamacı gözüyle)

19. ✅ **Weekly kesinleştirme gündeme alınmamış önerileri gerekçesiz reddediyor
    (P3);** muhabir düzeltme beklerken ret alıyor, Planlama önceden görmüyor.
    Onayda "N öneri reddedilecek" yazsın, seçenek sunulsun.
20. ✅ **Onaylar sonucunu söylemiyor (P3, T3, P1):** plan onayı kararsız paketleri
    kabul sayıyor, "Kalanları kabul et" ön incelemedekileri de alıyor, özel yayın
    onayı bütün nafize ve paketleri topluca onaylıyor. Onay penceresi sayıyla
    yazsın ("3 paket kabul edilecek, 5 muhabire görev gidecek"). Buna karşılık
    "Plana ekle" doldurulmuş formdan sonra bir de "Emin misin?" soruyor, "Haber
    toplantısına götür" hiç sormuyor (P1).
21. **Planlamacıya toplu işlem yok (P2):** 36 öneri tek tek açılıp karar
    veriliyor; bir plana eklemede 4 onay penceresi. Liste görünümünde seçim
    kutuları ve toplu değerlendir/arşivle/reddet.
22. **Muhabirin "Senin sıran"ı (P2, Y3):** plana eklenen öneri hem "Senin
    sıran"da hem "Yakında"da çıkıyor; "PKG onay bekliyor" muhabirin işi değilken
    "sıra sende" görünüyor; teklifte ne yapılacağı belli değil. Yalnız eylem
    gerektiren kayıt, yanında yapılacak iş.
23. **Plan ekranı, belge ve çıktının bölüm yapısı farklı (P1):** ekranda 6 bölüm,
    çıktıda 5. bölüm ikiye bölünüyor (التقارير المتوقعة / الأحداث الإخبارية),
    3. bölümün adı farklı. PKG ve başlığa bağlı canlı çıktıda iki yerde basılıyor,
    sayılar tutmuyor — kurumun örneğiyle doğrulanmalı.
24. **Saat biçimi her yerde farklı (P1):** ekip çipinde "04:00 AM", canlıda
    "GMT 10:30", çıktıda "04G". Her yerde 24 saat ve kurumun "G" gösterimi.
25. **Plan bölümleri hep kapalı açılıyor, boş kutular yer kaplıyor (P1):** 5–6
    açık gelsin, boş "PKG / Canlı" kutusu tek satır "+" olsun.
26. **Öneri sayıları üç yerde farklı (P1):** "gelen öneriler 10", her başlıkta
    "Öneri ve takiplerden al 13", "Muhabir takipleri 5".
27. **Weekly (P3):** üstteki "Bu haftanın planı" gelecek haftayı gösteriyor;
    günsüz haber kalemi stok pakete dönüşüp feature akışına düşüyor; aktarılıp
    aktarılmadığı kalemde görünmüyor; yönetici panelinde Weekly'nin karar
    durumu yok.
28. **Yetki varsayılanları (P3):** Weekly kararında bütün Yönetim birimi
    (yönetici olmayan da) yetkili; özel yayın onayını müdür veremiyor; özel
    yayında hazırlayan ile onaylayan aynı kişi olabiliyor; in-house paketi
    yalnız Output müdürü dağıtıyor, vekil yok; Newsdesk özel yayın akışında yok.
29. **Düzeltme (P2):** düzeltip yeniden gelen öneri "Yeni"den ayırt edilmiyor,
    eski not açık duruyor; muhabir düzeltme formunda günü değiştiremiyor;
    planlamacı düzeltme beklerken öneriyi kendisi plana ekleyemiyor.
30. **Listede Strap, ayrıntıda Header (P2):** muhabir kaydını bulamıyor;
    değerlendirme kartında "HEADER —" dolu Header'la çelişiyor.
31. **Planlama ana sayfası günün asıl işini (yarının planının durumu)
    göstermiyor (T3).**

## E. Terim ve menü

32. **Türkçe arayüzde İngilizce ad (T1, T3):** kısayolda "Special Coverage"
    (menüde "Özel yayın"), "+" sayfasında "New Workspace" (`dil.ts → kaOzel`,
    `ksOzel`, `yeniOrtam`).
33. **Terim karmaşası (T3):** "haber" sözcüğü öneri, paket, başlık, takip için
    kullanılıyor; muhabirde paket sayfasının adı "Haberlerim"; havuz nesnesi
    "başlık", "dosya", "Header" diye üç adla. Bir sözlük çıkarılıp menü ona
    bağlanmalı.
34. **Menü (T3):** gruplar hep kapalı açılıyor (Öneriler'e iki tık); "Diğer"
    grubu karışık (Proje planı günlük kullanıcıya gereksiz); "Ana sayfa" ile
    "Yönetici paneli" yan yana; bazı kartlar aynı sayfada iki kez.
35. **Arama Latin harfle içerik bulmuyor (T3):** "gaz" yazınca Gazze paketleri
    çıkmıyor; şehir/ülke adlarının üç dildeki karşılığıyla eşleşmeli.
36. **Zil 25 bildirimle açılıyor (T3, P2):** "bana iş düşen" ve "bilgi" ayrılsın.

## F. Görünüm

37. **Renk kuralı çakışıyor (T1):** kol renkleri plan renkleriyle aynı tonlarda
    (Feature yeşili = Weekly, Ekonomi turuncusu = Aylık); Özel yayın kırmızısı
    "Kritik" ve hata kırmızısıyla aynı; panel ikonları beş ayrı renk.
38. **Her sayfanın üstünde tarih kartı satırı (T1)** — "sayfanın üstüne satır
    eklenmez" kuralına aykırı.
39. **Öneri kartında rozet yoğunluğu ve üç kat süzgeç (T1, T2).**
40. **Weekly'de "Haftalık akış" kartları (T1, P3)** — kullanım anlatımı gibi,
    kural dışı.
41. **İçerik hizası (T1, T2):** Weekly gün sütunlarında Arapça şehir adları sola
    yaslı ve baştan kırpılıyor; Türkçe/İngilizce arayüzde öneri kartı başlığı
    ortalı.
42. **`tasarim.css`'te token dışı renkler (T1):** `#fff` (974, 2375, 2457),
    `#ffd27a` (2462).
43. **Adsız simge düğmeleri (Y3, P1):** plan ekranında `title`/`aria-label`
    olmayan küçük düğmeler; öneri kartındaki karar simgeleri yazısız.

## G. Telefon

44. **Muhabirin öneri formunda gönder düğmesi alt çubuğun arkasında (T2).**
45. **Dokunma alanları 44 pikselin altında (T2):** çalışma günü kutuları 13 px,
    süzgeç hapları 28 px, satır bağlantıları 26 px, takvim hücreleri 32 px.
46. **Ayarlar'da yazı alanları 15,5 px (T2)** — iPhone yakınlaştırır.
47. **Alt çubukta `#/`'da etkin sekme yok (T2);** sekme adı "İşlerim", menüde
    "Önerilerim" (P2).
48. **Arapça arayüzde tarih alanı Latin ve soldan sağa (T2).**
49. **Telefonda pencere alt çubuğu tam örtmüyor (T2).**

---

## Önerilen sıra

1. Güvenlik 1–3 (kural; gerçek kişiler girmeden önce).
2. Veri kaybı 6–7 (toplantıda iki kişi).
3. Kural çelişkileri 10–15, 17.
4. Onay pencerelerinin sonucu söylemesi (20), Weekly kesinleştirme (19).
5. Muhabirin "Senin sıran"ı (22) ve telefon formu (44–46).
6. Terim/menü (32–34), renk (37), saat biçimi (24).
