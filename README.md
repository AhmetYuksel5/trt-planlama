# TRT Arapça · Planlama ve Koordinasyon Platformu

TRT Arapça haber merkezi için tıklanabilir ilk prototip. Haber önerisinden
yayına kadar bütün süreç tek kayıt üzerinde yürüyor. Planlar tek yerde
hazırlanıyor, her birim kendi işini kendi ekranından yürütüyor.

**Adres:** https://ahmetyuksel5.github.io/arabiflow/ (depo adı `arabiflow`
olduktan sonra; öncesinde `…/trt-planlama/`). Girişsiz açılan proje planı
sayfası: adresin sonuna `#/plan`.

## Çalıştırma

```sh
npm install      # bir kez
npm run dev      # geliştirme sunucusu
npm run build    # docs/ içine derler; GitHub Pages buradan yayınlar
npm run preview  # derlenmiş hali yerelde
```

## Bu prototipte çalışanlar

- **Demo giriş:** kişi seçiliyor. Ana sayfa ve menü birime göre şekilleniyor
  (Planlama, Newsdesk, News Gathering, Programlar, Output/dil, Media Manager,
  Muhabir, Yönetim).
- **Next Day planı:**
  - liste ve yeni plan; tarih varsayılan olarak yarın
  - önceki planı bölüm seçerek kopyalama
  - altı bölümlük düzenleme: ekip ve vardiya, muhabir hareketleri, canlı
    yayınlar, hazır paketler, başlık başlık haber gündemi, takipler
  - durum çizgisi: taslak → haber toplantısında → onaylı → Newsdesk devraldı
- **Çıktı önizleme:** kurumun "الأجندة الإخبارية" belgesinin düzeninde.
  Arapça ve sağdan sola, boş bölümler gizli, yazdırılabilir.
- **Öneriler:**
  - öneri çağrısı e-posta metni (demo, gönderim yok)
  - gelen öneriler ve değerlendirme
  - mevcut ya da yeni başlığa bağlayıp plana ekleme
  - muhabirlere geri dönüş
- **Merkezi haber başlıkları havuzu.**
- **Muhabir profili ve listesi:**
  - fotoğraf (yüklenebiliyor, tarayıcıda küçültülüp saklanıyor), ad,
    iletişim (telefon, kurumsal ve kişisel e-posta, yayın irtibatı),
    kısaltma, çalışma biçimi (kadrolu, retainer, serbest)
  - ana görev bölgesi ve çalışabildiği diğer ülkeler
  - üretebildiği haber türleri: PKG, Live / Is-Live, Vox Pop, Walk & Talk,
    Feature, In-depth, Exclusive Interview, My Story
  - performans: verilen ve tamamlanan haber, zamanında teslim, ortalama
    teslim süresi, ilk seferde kabul, nitelik puanı, öneri kabulü
  - listede ülkeye ve haber türüne göre süzme ("Lübnan'da Live yapabilen")
  - herkes kendi profilini "Profilim"den görüyor; düzenleme kişinin kendisi
    ile Planlama, News Gathering ve Yönetim'de; göstergeleri Output ve
    Media görmüyor
- **Paket önerisi ve üretim adımları:** saha, Newsdesk, metin, kontrol, dil,
  video, Media Manager, iNews. Ayrıca geri gönderme, koordinasyon notları
  ve tam hareket geçmişi.
- **Yetki:**
  - birim, rol ve alan bazlı (muhabir ücreti yalnız yetkiliye)
  - muhabir yalnız kendi işini görüyor
- **Üç dil:** Türkçe, Arapça (sağdan sola), İngilizce.

## Henüz uygulanmayanlar

- Gerçek e-posta gönderimi. Çağrı ve geri dönüş metni şimdilik kopyalanıyor.
- Kurum içi giriş, ortak veri tabanı, çok kullanıcılı eşzamanlı çalışma.
  Veri yalnız bu tarayıcıda (`localStorage`) duruyor.
- Word/PDF dışa aktarma. Şimdilik yazdır → PDF olarak kaydet.
- Dosya yükleme ve dosya deposu.
- iNews ve medya sistemi entegrasyonu. Klip kodu elle giriliyor.
- Haftalık planı düzenleme, Next Day'e aktarma ve feature/program kollarına
  devir. Haftalık, aylık ve özel yayın şimdilik temel liste.
- News Gathering talep, onay ve seyahat lojistiği; Program Birimi'nin kendi
  akışı.
- Ücret girişi, onayı ve ödeme takibi; raporlar.
- Arapça ve İngilizce metinlerin anadil kontrolü.

## Varsayımlar (geri alınabilir)

- Feature/ekonomi kolunda yükleme Media Manager'da, takip Planlama'da.
- Muhabir kendi ücretini görüyor.
- Vardiya kodu GMT başlangıç saati: `04G` = 04:00 GMT.
- Plan onayı Planlama yöneticisinde ya da Yönetim'de.
- Örnek kişi ve kayıtlar kurgusal.
- İçerik (başlık, gelişme, paket, script, çıktı, öneri çağrısı) her zaman
  Arapça ve her arayüz dilinde sağdan sola. Arayüz TR/AR/EN seçilebiliyor.
  Latin harfli özel isim serbest; dil denetimi yok.
- Kişi adı rehberde arayüz dilinin yazımıyla, planın içerik satırlarında ve
  çıktıda Arapça.
- Performans göstergelerinin tanımları taslak (ekranda da öyle işaretli):
  zamanında teslim muhabirin videosunun teslim saatinden önce gelmesi,
  ilk seferde kabul metnin düzeltmeye hiç dönmemesi, nitelik puanı
  Newsdesk'in tamamlanan pakete verdiği 1–5. Ölçüt ve hedefler birimle
  netleşecek.
- Örnek veride son iki ayın tamamlanmış işlerinden kurgusal bir arşiv var;
  göstergeler boş görünmesin diye.
- Logo şimdilik yazıyla "TRT عربي"; resmî logo dosyası gelince
  `src/bilesenler/Logo.tsx` değişecek.
