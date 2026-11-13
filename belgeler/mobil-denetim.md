# Mobil tasarım denetimi: hakem raporu (yeni tasarım)

Hakem · 13 Kasım 2026 · Girdi: altı uzman raporu (UX, KU, RS, GT, QA, EP), hepsi `mobil-denetim/` altında.
Kod değiştirilmedi. Yeniden doğrulama betikleri bu klasörde: `dogrula.cjs`, `qa02.cjs`, `ep02.cjs`. Ekran görüntüleri: `ekran/`.
Kısaltmalar: **H** = hakem tarayıcıda kendisi doğruladı · **U** = uzman tarayıcıda doğruladı · **K** = kodu okuyarak ya da hesapla · **T** = tahmin.
İş büyüklüğü: **S** = birkaç satır CSS ya da tek bileşende küçük değişiklik · **M** = bir bileşenin ya da sayfanın yerleşimi · **L** = birden çok sayfayı ya da altyapıyı kapsar.

---

## 1) Özet

- Altı raporda **103 bulgu** var: UX 19, KU 20, RS 13, GT 19, QA 11, EP 21 (performans dahil). Bunlar **69 birleşik bulguda** toplandı (M-01…M-69). Dağılım: Kritik 2, Yüksek 15, Orta 35, Düşük 17.
- **En çok uzmanın bulduğu sorun 244 piksellik iki tonlu zemin (M-18).** Altı uzmanın altısı da buldu. Önemi Düşük'ten Yüksek'e kadar dağılmıştı; hakem kararı **Orta**. İşi engellemiyor, ama her sayfada görünüyor ve tek satırla düzeliyor. Bu yüzden düzeltme sırasında en başa alındı.
- **Kritik iki bulgu var, ikisini de tarayıcıda yeniden ölçtüm:**
  - M-01: "Sıradaki" düğmesinin yazısı lacivert zemin üstünde lacivert; kontrast 1,72:1.
  - M-02: Öneri penceresinin ⋯ menüsü Pixel 7'de tümüyle ekranın dışında; görünen madde 0.
- **QA-01 (Sayfayı aç) ve KU-02 (Posta taslağı) da doğrulandı.** Kodu okuyarak verilmiş tek Yüksek bulguyu da (EP-02, girdi kenarı 1,24:1) tarayıcıda ölçüp doğruladım.
- **Raporların büyük ölçüde birleştiği ilkeler:**
  - ekranda tek dolu birincil düğme;
  - durum renkleri yalnız durum için;
  - telefonda kart derinliği en fazla 1;
  - ⋯ menüsüne inen satır eylemleri;
  - sıfır sayaçların çizilmemesi;
  - 44 piksellik dokunma alanı;
  - 12 pikselin altında yazı olmaması;
  - üst katmanda açılan her şeyin geri tuşuyla kapanması.

  Bu ilkeler §6'da tek ölçeğe bağlandı: 12·13·15·17·20·28 (kimlik belgesindeki altı basamak, telefonda gövde 15), Arapça içerik 16/17.
- **Sekiz öneri kurum kararlarıyla çakıştığı için elendi** (§8). Başlıcaları:
  - muhabir formundaki Arapça başlıkları arayüz diline çevirmek;
  - "Emin misin?" sorusunu kaldırmak;
  - Planlama kutularının yerini değiştirmek;
  - prototip şeridini kısaltmak;
  - kenar şeritli vurgu kartı.
- **Bir yanlış teşhis düzeltildi.** GT-06, "Haber toplantısına götür" düğmesini "yetkisiz kişide soluk" sanmıştı. Ölçtüğüm renkler EP-01'deki kontrast hatasının aynısı; düğme etkin.

---

## 2) Birleşik bulgu tablosu (önem sırasıyla)

| Kimlik | Başlık | Önem | Kaynaklar | Uzman | Doğrulama | Sayfa | Kısa öneri | İş |
|---|---|---|---|---|---|---|---|---|
| **M-01** | `.dugme-yumusak` yazısı lacivert zeminde okunmuyor, 1,72:1 (yalnız yeni) | **Kritik** | UX-02, EP-01, GT-06 (yanlış teşhis) | 3 | **H** (rgb 26,68,168 / 19,39,74), U | Next Day, Weekly "Sıradaki"; masa "Programa aktar" | Yeni bloğa `.dugme-yumusak { background: var(--vurgu-sis); color: var(--vurgu-koyu) }`, hover dahil (7,82:1). Bütün `.dugme-*` çeşitleri yeni blokta açıkça tanımlansın | S |
| **M-02** | Alttaki ⋯ menüsü ekranın altından taşıyor; öneri penceresinde kararlar verilemiyor | **Kritik** | QA-02 | 1 | **H** (Pixel 7 tr/ar: 833–928 / 839, 0 madde; iPhone 13: 1/2 madde) | Öneri penceresi, Raporlar kişi kartı | `IslemMenusu → yerlestir` altta yer yoksa yukarı açsın, yine sığmazsa `max-height` ve kaydırma. Telefonda ⋯ için alttan açılan sayfa (§4, Ç-9) | S→M |
| **M-03** | Ana sayfa panelindeki "Sayfayı aç" sayfayı açmıyor, geçmiş bozuluyor | Yüksek | QA-01 | 1 | **H** (iPhone 13 tr, Pixel 7 ar: `#/`'da kalıyor; geri `#/nextday`) | Planlama ana sayfası (yeni), Muhasebe'de aynı kalıp | `preventDefault`, önce pencereyi kapat, geri adımı bitince `location.hash` | S |
| **M-04** | Posta'da geri tuşu sohbetten değil Posta'dan çıkarıyor, yazılan yanıt uyarısız siliniyor | Yüksek | KU-02 | 1 | **H** (`#/posta` → `#/oneriler`; ileri: taslak boş) | Posta | Telefonda açık sohbet geçmiş adımı olsun (`pencereAdimi` kalıbı); taslak sohbet kimliğiyle `sessionStorage`'da | M |
| **M-05** | Menü paneli geri tuşuyla kapanmıyor, sayfadan (ya da siteden) çıkarıyor; odak panele girmiyor, arka plan `inert` değil | Yüksek | KU-01, QA-04, EP-08 | 3 | U (30 bağlamın 30'u) | Menü paneli (bütün personalar) | Panel `Pencere` altyapısına (`<dialog>`, `pencereAdimi`) taşınsın; avatar ve zil panelleri de | M |
| **M-06** | Dokunma hedefleri: 24 pikselin altında olanlar (20×20 seçim kutusu, 18–23 px bağlantılar), 44 pikselin altında olanlar (sekme 38, select 34, çip 28, ⋯ 36, LIVE 13×13) | Yüksek | KU-14, EP-06, RS-13, QA (gözlem), RS-03 (kısmen) | 4 | U | Dış muhabirler, Organizasyon, Öneriler, Next Day, geri bağlantıları | Görünüm değişmeden dokunma alanı genişlesin (§6.5); seçim kutusu `label` içinde, hücrenin tamamı | M |
| **M-07** | Yazılar küçük ve dağınık: Next Day'de 92 düğüm 10 px, Arapça arayüzde 10–11 px, `--punto-mini` = `--punto-kucuk`, 11 ayrı boy | Yüksek | UX-04, GT-07, EP-05 | 3 | U | Bütün sayfalar, en çok Next Day, Weekly | §6.1 ölçeği; `small small { font-size: inherit }`; elle yazılmış 10/11 px'ler token'a bağlansın | M |
| **M-08** | Form alanı kenarı 1,24:1 (WCAG 1.4.11 3:1 istiyor) | Yüksek | EP-02 | 1 | **H** (mu1 formu: #e4e7ec / #fff = 1,24) | Bütün formlar, en çok muhabirin öneri formu | Yeni token `--cizgi-girdi: #868fa0` (3,26:1). Kart ve ayraçlar `--cizgi`'de kalsın | S |
| **M-09** | Next Day başlık kartı: dört kat çerçeve, kalıcı ↑↓🗑+, etiketsiz sayaçlar ("0" dahil); Arapça başlığa ~150 px kalıyor | Yüksek | UX-07, GT-09, GT-04 (kısmen) | 3 | U | Next Day (Weekly'de aynı kalıp) | Satırda başlık ve tek özet metni ("3 gelişme · 1 PKG · 3 muhabir", sıfır yazılmaz); eylemler ⋯ içinde; çerçeve en çok 2 kat | M |
| **M-10** | Next Day satır içi gelişme ve PKG formları 10–12 alanlı; asıl alan 4. sırada; Kaydet ~950 px aşağıda | Yüksek | KU-05 | 1 | U | Next Day | Telefonda asıl alan ilk sırada, isteğe bağlılar "Diğer ayrıntılar"da katlı, İptal/Kaydet yapışık; açılınca forma kayılsın | M |
| **M-11** | Öneriler'de ilk kart 565 px'te başlıyor: listeden önce 5–6 kontrol satırı | Yüksek | UX-03, GT-15 | 2 | U | Öneriler | Arama ve "Süzgeç (n)" tek satır; masa, ülke, plan ve Kart/Liste pencerede; etkin süzgeçler çip; sekmeler yapışık | M |
| **M-12** | Masa sayfasında alt sekme ilk ekranı değiştirmiyor; içerik 644–651 px'te başlıyor | Yüksek | KU-08, UX-15 | 2 | U | Programlar, Ekonomi, Spor | Telefonda kutucuk ızgarası yalnız masanın ana sayfasında; bölüm adreslerinde içerik hemen başlasın; arama tam genişlikte | S |
| **M-13** | Yeni tasarımın mobil Menü panelinde Ayarlar yok (muhabirde var) | Yüksek | KU-04 | 1 | U | Menü paneli (pl, yo, masa) | Panelin sonunda Ayarlar satırı; avatar menüsünde panelle çift maddeler kalksın | S |
| **M-14** | Dış muhabirler tablo-kartı: kişi başına 263 px, 32 kişi 8411 px; her satırda 44 px dolu yeşil WhatsApp karesi | Yüksek | UX-05, GT-10 | 2 | U | Dış muhabirler | 72 px iki satırlı liste satırı; WhatsApp ikincil ikon düğmesi; seçim kutuları seçim kipinde | M |
| **M-15** | Rozet ve sayı enflasyonu: Öneriler'de 44 rozet, 8 çip biçimi; sayı rozeti 6 biçimde; plan adları lacivert çerçeveli kutu | Yüksek | GT-02, GT-03, UX-19, EP-12 (sayaç adı) | 3 | U | Öneriler, Next Day, Weekly, kabuk | Durum rozeti (satırda en çok 1) ve tek `.sayi` bileşeni (§6.4); plan adı meta metni | M |
| **M-16** | Masaüstünde (1033–1352 px) yeni üst çubuk taşıyor, avatar ve zil ekran dışında, sabit sekme 0 px (kapsam dışı, yalnız yeni) | Yüksek | RS-01 | 1 | U | Üst çubuk, masaüstü | Avatar, zil ve arama `flex: none`; kısayollar küçülebilsin; container eşikleri yeniden ayarlansın ya da taşan kısayol ★'a | M |
| **M-17** | Tek parça 1,93 MB JS (gzip 547 KB), kod bölme yok; TBT 0,8–0,9 s, yavaş 4G'de 5,6 s | Yüksek | EP-P1 | 1 | U (CDP) | Açılış | Seyrek ekranlar `React.lazy`; `dil.ts` dil başına; `ornek.ts` yalnız demoda | L |
| **M-18** | Yeni tasarımda telefonda (ve tablette, menü gizliyken) 244 px beyaz ve gri iki tonlu zemin | Orta | UX-01, KU-17, RS-02, GT-01, QA-11, EP-14 | **6** | **H** (`linear-gradient … 244px`), U | Kabuk (her sayfa) | Zemini menünün kendisine ver ya da gradyanı `(min-width: 961px)` ve `:not(.menu-gizli)` içine al | S |
| **M-19** | Planlama ana sayfası: 13 eşit kutu; boş kutular tam boy; üç vurgu çerçevesi; başlıklar kesik ("Karar bekleyen öne…") | Orta | UX-06, KU-13, GT-11, RS-09 | 4 | U | Planlama ve tam yönetici ana sayfası | Yer sabit kalır (kurum kararı), boş kutu tek satıra iner; vurgu yalnız sayının renginde; başlık iki satıra kırılır | S |
| **M-20** | Tam ekran pencerede alt satır dibe yapışmıyor (89–391 px boşluk); o boşluğa dokunmak pencereyi kapatıyor | Orta | RS-04, QA-05 | 2 | **H** (Görevlerim paneli 195,560'ta kapandı), U | Bütün `Pencere`'ler (yeni) | `.pencere-govde { flex: 1 1 auto; min-block-size: 0 }`; telefonda tam ekran pencerede arka plana dokunarak kapatma kalksın | S |
| **M-21** | Bildirim (tost) alt çubuğun üstüne biniyor, 2–3 sn dokunmayı engelliyor | Orta | KU-11 | 1 | U | Kabuk | Telefonda `bottom: calc(64px + safe-area + 8px)` | S |
| **M-22** | Klavye açıkken alt çubuk odaklı alanın üstüne biniyor; Posta'da sohbetten ~100 px kalıyor | Orta | KU-12, QA-08 | 2 | U (görünür alan küçültülerek benzetildi; gerçek klavye T) | Öneri formu, Posta, yazışma | `scroll-padding-bottom`; odakta (`visualViewport`) alt çubuk gizlensin | S–M |
| **M-23** | Tarih seçici iPhone yüksekliğinde altta kesiliyor ("Bugün" ve son hafta görünmüyor) | Orta | KU-15, QA-03 | 2 | U | Muhabir öneri formu, sayfa içi tarih alanları | Sığmazsa ekran içine sabitlensin; telefonda alttan açılan sayfa (§4, Ç-9) | S |
| **M-24** | Kapalı katlanır kart 86 px; öneri penceresinin bölümleri ve Ayarlar'ın 7 kartı ekranın %60'ı | Orta | UX-09, GT-05 | 2 | U | Öneri penceresi, Ayarlar, plan bölümleri | Gruplu liste satırı (48 px, ayraçlı); Menü panelinin kalıbı | M |
| **M-25** | Renk rolleri karışık: birincil "Plana ekle" yeşil (`dugme-iyi`), öncelik marka kırmızısı, Paketler'de bir kartta 4 kırmızı, Planlama'da camgöbeği ikinci vurgu | Orta | UX-09, UX-19, GT-06, GT-13 | 2 | U | Öneri penceresi, Paketler, ana sayfa | Birincil her yerde lacivert; yeşil ve kırmızı yalnız durumda; kırmızı yalnız gecikmede (§6.3) | S–M |
| **M-26** | Muhabirin öneri formu: Strap ilk ekranın dibinde; "Gönder" sayfa sonunda ve pasif, nedeni görünmüyor | Orta | UX-11, QA-09, EP-15 | 3 | U | Muhabir yeni öneri | İçerik alanları önde, "Gün · Masa · Tür" özet satırı; yapışık Gönder; `aria-disabled` ve eksik alana odak, durum satırı | M |
| **M-27** | Zil ya da avatar menüsü açıkken dışarı dokunmak alttaki öğeyi de çalıştırıyor | Orta | QA-06 | 1 | U | Üst çubuk | Telefonda saydam perde ya da `popover="auto"`; ilk dokunuş yalnız kapatsın | S |
| **M-28** | Arama penceresi açıkken geri tuşu arkadaki sayfayı değiştiriyor, arama açık kalıyor | Orta | QA-07 | 1 | U | Arama | Telefonda arama da geçmiş adımı olsun ya da `popstate`'te kapansın | S |
| **M-29** | Öneri gönderildikten sonra geri tuşu boş forma dönüyor | Orta | KU-03 | 1 | U | Muhabir yeni öneri | Gönderimden sonra `yerineGit` | S |
| **M-30** | Next Day alt sekmesi plan listesine gidiyor, plan bağlantısı 185×19 px | Orta | KU-06, QA (gözlem) | 2 | U | Alt çubuk, Next Day listesi | Sekme `#/nextday/yarin`'e gitsin; listede satırın tamamı 44 px | S |
| **M-31** | Avatarlar: kişi başına renk tonu (Organizasyon'da 88 ayrı renk); beyaz 9 px yazı, kontrast 2,9–3,5:1 | Orta | GT-08, EP-03 | 2 | U | Bütün listeler | Nötr avatar (§4, Ç-4), 11 px, `aria-hidden` | S |
| **M-32** | Başlık yapısı: yeni ana sayfada hiç başlık yok; muhabir ekranlarında h1 yok; h1'den h3'e atlanıyor | Orta | EP-07 | 1 | U (axe) | Ana sayfa, muhabir, Öneriler, Gündem | Görsel olarak gizli h1; kutu adları h2 | S |
| **M-33** | Yazı boyutu px; tarayıcının yazı büyütme ayarına uymuyor (0/1143 öğe büyüdü) | Orta | EP-10 | 1 | U | Bütün sayfalar | `--punto-*` rem cinsinden | M |
| **M-34** | Tam yöneticinin mobil menüsü 33 madde, ~1930 px | Orta | KU-07 | 1 | U | Menü paneli (yo3) | Yönetim grubu katlansın; panelin başında "Sayfa ara" (arama penceresini açsın) | S |
| **M-35** | Masa sayfası ayrı kutu dili konuşuyor: mor kenar şeridi, köşe sayıları, 7 punto, derinlik 3 | Orta | GT-12, UX-15 (renk) | 2 | U | Masa sayfaları | Planlama'nın kutu ve kart bileşeni; masa rengi yalnız menüdeki etkin maddede; kenar şeridi kalksın | M |
| **M-36** | Posta "← Sohbetler" tarayıcının çıplak düğmesi (2 px outset, 25 px); yer tutucu serif | Orta | GT-14 | 1 | U | Posta | `appearance: none`, 44 px, sade düğme; `::placeholder` arayüz yazısıyla | S |
| **M-37** | Next Day ekibi okunacak yerde form gibi çiziliyor (açık planın ~2000/6012 px'i) | Orta | UX-08 | 1 | U | Next Day bölüm 1 | Telefonda salt okunur gruplu liste; satıra dokununca düzenleme penceresi | M |
| **M-38** | Weekly listesinde değişmeyen anlatım kartları (~1000 px); en belirgin düğme "Yeni haftalık plan" | Orta | UX-14, KU-19 | 2 | U, **K** (Liste.tsx:130–155 hakem okudu) | Weekly listesi | Anlatım kartları kalksın (kurumun "açıklama metni yok" kuralı); bu haftanın planı varsa "Planı görüntüle" birincil | S |
| **M-39** | Öneri kartındaki "önerinin yolu" şeridi etiketsiz; anlamı yalnız ipucunda, dokunmatikte görünmüyor | Orta | UX-10, GT-03 (kısmen) | 2 | U, K | Öneri kartı | Dokunmatikte şerit yerine meta metni: "Değerlendirmede · Planlama · 45 dk" | S |
| **M-40** | Muhabirin Önerilerim'inde "Senin sıran" öne çıkmıyor; boş grup kart olarak çiziliyor | Orta | UX-12, GT (§4 mu1) | 2 | U | Muhabir Önerilerim | Tek liste yüzeyi, grup başlıkları; "Senin sıran" başlığında `.sayi.sira`; boş grup çizilmesin | S |
| **M-41** | Pencere kromu: 320×568'de başlık ve alt satır ekranın %41'i; ilk odak "Next Day" bağlantısında; formda odak BODY'ye düşüyor | Orta | RS-05, UX-09, EP-09 | 3 | U | Öneri penceresi | Etiket satırı gövdeye insin; alt satır tek satır; ilk odak başlıkta (`tabindex=-1`) | M |
| **M-42** | 320–500 px'te grid hücresinin `min-width: auto` kalmasından taşmalar | Orta | RS-08, RS-12 | 1 | U | `#/plan`, Programlar, paket formu, Takvim formu | `minmax(0,1fr)`, `minmax(min(220px,100%),1fr)` | S |
| **M-43** | Yatay telefon ve tablet masaüstü ölçüsü alıyor; dokunma kuralları yalnız genişliğe bağlı; çekmece maddeleri 32–40 px | Orta | RS-03, RS-07 | 1 | U | Yatay telefon, tablet | Dokunma kuralları `(max-width:760px), (pointer:coarse)` içinde; çekmecede odak ve `inert` | M |
| **M-44** | 961 px'te düzen sıçraması (içerik 960 → 717 px) | Orta | RS-06 | 1 | U | Tablet ve küçük dizüstü | Sabit menü 1200 px'ten başlasın; arada 64 px'lik ikon şeridi | M |
| **M-45** | Kırılım noktaları dağınık; 1100 px'te çakışma | Orta | RS-10 | 1 | K | CSS ve JS | Tek kaynak `kirilim.ts` ve RS §4'teki set | M |
| **M-46** | Takibe gelişme eklerken aynı adlı iki ardışık düğme ("Gelişme ekle") | Orta | KU-09 | 1 | U | Öneri ayrıntısı (takip) | Alan açılınca açan düğme gizlensin; kaydeden düğme "Ekle" | S |
| **M-47** | Onay tarayıcının kendi `confirm` kutusuyla soruluyor (görsel dilden kopuk) | Orta | KU-16 | 1 | U | Muhabir ve Planlama kararları | Sunum: uygulamanın kendi `Pencere`'si. Onayın kendisi kalır (§8) | M |
| **M-48** | Raporlar'da soluk satırlar opaklıkla 2,6–4,0:1 | Orta | EP-04 | 1 | U | Raporlar | Opaklık yerine `--sonuk` yazı ve `--yuzey-2` zemin | S |
| **M-49** | Açılış: fontlar 299–412 KB (üçüncü taraf, 5 aile); logo 104 KB PNG | Orta | EP-P2, EP-P3, EP-P4 | 1 | U | Açılış | Fontlar kendi sunucusunda ve kırpılmış; logo SVG ya da WebP; kabuğun iskeleti statik | M |
| **M-50** | Öneri penceresi açılışı 254–301 ms, olay süresi 200–232 ms (INP sınırında) | Orta | EP-P5 | 1 | U | Öneri penceresi | Kapalı bölümler açılınca çizilsin; `useMemo` | M |
| **M-51** | Genel olarak kart içinde kart (derinlik 3): Öneriler, Posta, masa, Organizasyon | Orta | GT-04, UX-16 | 2 | U | Liste sayfaları | Telefonda sayfada tek kat kart (§6.4) | M |
| **M-52** | CSS envanteri: 13 düğme sınıfı, 15 rozet değiştiricisi, 16 köşe değeri, 27 kenar şeridi | Orta | GT-19 | 1 | K | `tasarim.css` | §6.4 envanteri; eski sınıflar önce takma ad, sonra silinir | L |
| **M-53** | Takiplerim: çift başlık, kendi avatarı, her kartta dolu "Öneriye çevir" | Düşük | UX-13 | 1 | U | Muhabir Takiplerim | Tek başlık ve sayı; "Öneriye çevir" ikincil | S |
| **M-54** | Krom ilk ekranın %19–23'ü; prototip şeridi 48 px, sarı | Düşük | UX-17, GT-17 | 2 | U | Kabuk | Şerit nötr renkli ve 12 px; tam cümle kalır (§8) | S |
| **M-55** | Plan başlıklarında ayırt edici bilgi (tarih) kesiliyor | Düşük | UX-18 | 1 | U | Next Day, Weekly | İki satırlı başlık: küçük "Next Day", altında tarih | S |
| **M-56** | Organizasyon: ağaç iç içe çerçeveli; sekme şeridinin taştığı belli değil | Düşük | UX-16, KU-20 | 2 | U | Organizasyon | Çerçevesiz ağaç ve kılavuz çizgi; kenarda solma; etkin sekme ekrana kaysın | M |
| **M-57** | Öneri ayrıntısında yazışma en altta (~1160 px) | Düşük | KU-18 | 1 | U | Öneri ayrıntısı (muhabir) | Başlığın altında "Yazışma · n" çipi; bildirimden gelince oraya kaysın | S |
| **M-58** | Takip açıkken alt çubuk "Önerilerim"i vurguluyor | Düşük | KU-10 | 1 | U | Alt çubuk (muhabir) | Durum `takip` ise "Takiplerim" vurgulansın | S |
| **M-59** | Kutuya hızlı çift dokunuş paneldeki öneriyi de açıyor | Düşük | QA-10 | 1 | U | Ana sayfa (yeni) | Açılıştan sonra ~300 ms dokunuş yutulsun | S |
| **M-60** | Sayfa başlığının yanında 42 px lacivert ikon karosu | Düşük | GT-16 | 1 | U | Kabuk | Telefonda karo kalksın, başlık kalsın | S |
| **M-61** | Sayılar tek başına eğik | Düşük | GT-18 | 1 | T (görüntüden) | Organizasyon, plan çipleri | Düz, `tabular-nums` | S |
| **M-62** | Arapça kişi adları `lang="tr"` içinde | Düşük | EP-11 | 1 | U | Listeler | `useDil().ad` için `<bdi lang="ar">` | S |
| **M-63** | ARIA hataları (rolsüz `aria-label`, `summary` içinde düğme, odaklanamayan kayan bölge, "15Öneriler") | Düşük | EP-12 | 1 | U (axe) | Çeşitli | EP-12'deki tek tek düzeltmeler | S |
| **M-64** | Az hareket tercihi için genel kural yok | Düşük | EP-13 | 1 | U, K | Genel | Genel `prefers-reduced-motion` kuralı | S |
| **M-65** | İç içe dikey kaydırma (`#/programlar/planlar`) | Düşük | RS-11 | 1 | U | Masa › Yayın planları | Telefonda `max-block-size: none` | S |
| **M-66** | Arapça gün adları 320 px'te kırpılıyor (takvim, programlar) | Düşük | RS-09 (kısmen) | 1 | U | Takvim, Programlar | Dar yerde kısa gün adı | S |
| **M-67** | CSS tek dosya 216 KB, ana sayfada %5'i kullanılıyor | Düşük | EP-P6 | 1 | U | Açılış | Çıktı ve baskı CSS'i ayrı dosyada | M |
| **M-68** | Türkçe arayüzde kısayol "Special Coverage" İngilizce | Düşük | RS (yan gözlem) | 1 | U | Üst çubuk (masaüstü) | `dil.ts`'teki karşılığa bağlansın | S |
| **M-69** | Arama Latin harfli şehir adını kapsamıyor ("Gazze") | Düşük | QA (gözlem) | 1 | U | Arama | Ürün kararı; tasarım değil | — |

---

## 3) Önem çelişkileri ve kararlar

Ölçüt (brifing): Kritik = iş yapılamıyor, veri kaybı ya da okunamıyor · Yüksek = işi ciddi zorlaştırıyor · Orta · Düşük. Önemi işin etkisi belirler, düzeltmenin kolaylığı değil. Kolay düzeltmeler §7'deki sıraya ayrıca yansıtıldı.

| Bulgu | Uzmanların verdiği | Karar | Gerekçe |
|---|---|---|---|
| M-18 · 244 px zemin | UX Yüksek, GT Yüksek, KU Orta, RS Orta, QA Düşük, EP Düşük | **Orta** | Hiçbir iş engellenmiyor, metin okunuyor. Ama her sayfada ve her kişide görünüyor; "sönük" kutuların kenarı gri bölgede 1,02:1'e düşüyor (EP-14) ve ürün bozuk görünüyor. Bu yüzden Düşük değil. Tek satırla düzeldiği için düzeltme sırasında birinci. |
| M-01 · yumuşak düğme | UX Yüksek, EP Kritik, GT (yanlış teşhis: "soluk, etkin mi belli değil") | **Kritik** | Brifingdeki "okunamıyor" tanımına giriyor: 1,72:1, ekrandaki en önemli rutin adımın düğmesi. Hakemin ölçümü uzmanların ölçümüyle aynı. GT'nin "yetkisiz" yorumu yanlış; pl2 düğmeyi kullanabiliyor. |
| M-02 · ⋯ menü taşıyor | QA Yüksek | **Kritik** | Pixel 7'de (839 px) hiçbir madde görünmüyor, pencere kaydırılsa da menü gelmiyor. "Düzeltmeye gönder", "Takip olarak kalsın", "Birimin görüşüne sun" ve "Arşive gönder" telefonda pencereden verilemiyor. Telefonda kolay bir yol bulamadım (karttan ayrıntı sayfasına doğrudan bağlantı yok), yani iş yapılamıyor. |
| M-05 · Menü paneli geri | KU Yüksek, QA Orta, EP Orta (odak) | **Yüksek** | Android'de geri tuşu paneli kapatmanın alışılmış yolu, her kullanıcı her gün yapıyor. Geçmişin başında siteden çıkarıyor (QA ölçtü). Veri kaybı yok, bu yüzden Kritik değil. |
| M-04 · Posta taslağı | KU Yüksek | **Yüksek** (Kritik değil) | Yazılan ama gönderilmemiş taslak kayboluyor. Kayıtlı veri değil, metin yeniden yazılabilir. Brifingdeki "veri kaybı" kaydedilmiş kaydı kastediyor. Sınırda; uzun yanıtlarda Kritik'e yaklaşır. |
| M-06 · dokunma | KU Orta, EP Yüksek, RS Yüksek, QA "hata sayılmaz" | **Yüksek** | 24 pikselin altındaki öğeler WCAG 2.2 AA'yı karşılamıyor ve kurumun kendi 44 px kuralına aykırı (CLAUDE.md). Dış muhabirlerde 32 kutu 20×20. QA'nın "hata değil" görüşü işlev açısından doğru, tasarım ölçütünde değil. |
| M-07 · tipografi | UX Yüksek, GT Orta, EP Orta | **Yüksek** | Asıl çalışma ekranında (Next Day, Weekly) meta satırı 10 px, Arapça arayüz yazısı 10–11 px. Planlamacı bu ekranlarda saatlerce okuyor. Tek tek her öğe "Orta", ama her ekranı ve her personayı etkilediği için toplamı Yüksek. |
| M-08 · girdi kenarı | EP Yüksek (kodu okuyarak ve hesapla) | **Yüksek** | Hakem tarayıcıda ölçtü: 1,24:1, beyaz üstünde beyaz alan. Muhabirin tek işi form doldurmak; boş alanın sınırı dışarıda telefonda görünmüyor. |
| M-15 · rozet enflasyonu | GT Yüksek (iki bulgu) | **Yüksek** | Tek uzman, ama Öneriler (günün ana ekranı) kartının en koyu öğesi içerik değil plan adı kutusu. Kimlik belgesinin "planlar renkli kutu taşımaz" kuralına aykırı. |
| M-21 · tost | KU Yüksek | **Orta** | Engel 2–3 saniye sürüyor ve kendiliğinden kalkıyor; kullanıcı yeniden dokununca iş oluyor. |
| M-11 · Öneriler liste başı | UX Yüksek, GT Orta | **Yüksek** | Planlamacının en sık açtığı liste; ilk ekranda 1,3 kart görünüyor. |
| M-12 · masa | KU Yüksek, UX Orta | **Yüksek** | Alt sekmeye basınca ekranda hiçbir şey değişmiyor: kullanıcı gezinmenin çalışmadığını sanıyor. |
| M-43 · yatay/tablet | RS Yüksek | **Orta** | Denetimin odağı dikey telefon. Yatay telefon seyrek kullanılıyor, tablet ikincil. Ölçüm sağlam ama etkilenen kullanım az. |
| M-16 · masaüstü çubuk | RS Yüksek | **Yüksek** (kapsam dışı) | Telefon denetiminin dışında, ama 1280 px sıradan dizüstü genişliği ve pl2 ile yo3'ün her sayfasında avatar ekran dışında. Kaydedildi, telefon sırasına alınmadı. |
| M-09 · ND başlık kartı | UX Orta, GT Yüksek | **Yüksek** | Arapça başlığa ~150 px kalıyor; asıl içerik ikonların arasında. Planlamacının ana ekranı. |
| M-19 · ana kutular | UX Orta, KU Orta, GT Orta, RS Düşük–Orta | **Orta** | Uzlaşı. |
| M-25 · renk rolleri | UX Orta, GT Orta | **Orta** | Uzlaşı. Yeşil "Plana ekle" yanlış okunmaya yol açıyor ama düğme çalışıyor. |

---

## 4) Öneri çelişkileri ve kararlar

**Ç-1 · Yüzen düğme (FAB) mı, sayfa başında ya da yapışık alt çubukta birincil mi?**
- UX-03 "Öneri gir" için, UX-15 "Görev talebi" için FAB öneriyor.
- GT "ekranda tek birincil, sayfa başında" diyor. UX-11 ve KU-05 formlarda yapışık alt eylem çubuğu istiyor.
- **Karar: FAB yok.**
  - Ekranın altı zaten kalabalık: alt çubuk, tost (M-21) ve klavye (M-22) aynı bölgede çakışıyor.
  - FAB, RTL'de yer değiştirdiği için iki dilde farklı bir başparmak bölgesine düşer.
  - Tek bir sayfaya özgü yeni bir bileşen de gerektirir.
- Liste sayfalarında birincil, sıkıştırılmış sayfa başı satırında tek dolu düğme olarak kalır (Öneri gir, Görev talebi).
- Formlarda ve pencerelerde alt eylem çubuğu yapışık olur (M-10, M-20, M-26). İki uzmanın ortak noktası, "birincil başparmakla erişilebilir olsun", bu yolla karşılanmış olur.

**Ç-2 · Kart mı, liste mi? "Senin sıran" vurgulu kart mı olsun?**
- GT-04: sayfada tek kat kart, liste sayfasında dış kart kalksın.
- GT-05 ve UX-09: gruplu liste (inset grouped list).
- UX-12: "Senin sıran" ince vurgu kenarlı ayrı kart olsun. GT: tek liste, grup başlıkları.
- **Karar: derinlik 1.**
  - Liste sayfalarında yüzey bir liste. Katlanır bölümler 48 px'lik satır.
  - Plan bölümleri (Next Day) kart değil, yapışık bölüm başlığı ve ayraç.
  - "Senin sıran" ayrı bir yüzey değil, listenin ilk grubu olur. Başlığında `.sayi.sira` (lacivert dolu sayı) durur.
  - **Kenar şeridi kullanılmaz**: kimlik belgesi §7 "kenar şeritli kart"ı yasaklıyor; UX-12'nin bu kısmı elendi.
  - Ana sayfa kutu ızgarası (Planlama, masa) tek istisna. Orada kutu kartın kendisi, iç içe değil.

**Ç-3 · Tipografi ölçeği**
- UX: telefonda 12·13·15·17·20·28, gövde 15, Arapça içerik 16/1,7.
- GT: 12·13·15·20·28 (gövde 13), içerik 16/17, ağırlık 400/500/600.
- EP: en küçük 12 (Latin), 13 (Arapça arayüz), içerik en az 15, gövde 16–17, birim rem.
- Kimlik belgesi: 12·13·15·17·20·28.
- **Karar:**
  - Kimliğin altı basamağı korunur, yeni basamak açılmaz.
  - Telefonda rollerin eşlemesi değişir: gövde 13'ten 15'e çıkar, meta 13 olur (12 yalnız sayı ve rozet).
  - Arapça arayüz yazısının alt sınırı 13 (`:lang(ar)`).
  - Arapça içerik ayrı token'larla, `em` çarpanıyla değil: gövde 16, başlık 17.
  - Hepsi rem cinsinden (EP-10).
  - Ağırlık 400, 500 ve 600; 700 yalnız metrik sayısında.
  - Avatar harfi 11 px (GT 11, EP en az 10; 11 ikisini de karşılıyor).
- Gerekçe: GT'nin 13 piksellik gövdesi masaüstünde doğru, telefonda iki uzmanın (UX, EP) ölçtüğü okunurluk sorununu çözmüyor. Ölçeğin kendisi değişmediği için kimlik belgesiyle çelişmiyor. Tablo §6.1'de.

**Ç-4 · Avatar: nötr mü, koyulaştırılmış renk mi?**
- GT-08: tek nötr renk, renk yalnız durumda.
- EP-03: tonlar kalsın, açıklık %42'den %32'ye insin (en kötü 4,77:1).
- **Karar: nötr.** Zemin `--yuzey-3`, yazı `--sonuk`, 11 px ve 600 ağırlık (≈6,4:1). EP'nin kontrast şartını da karşılıyor.
- Renkli avatar durum renkleriyle karışıyor (yeşil ve kırmızı tonlar). Kişinin kimliğini Arapça ad zaten taşıyor (kurum kararı).
- EP'nin `aria-hidden` önerisi alınır.

**Ç-5 · Dokunma kuralının kapsamı**
- KU ve EP: telefon bloğunda 44 px, görünüm aynı kalsın (padding ya da `::after`).
- RS-03: kural genişliğe değil `pointer: coarse`'a bağlansın (yatay telefon ve tablet de).
- GT: görünür boy 40, dokunma alanı 44. QA: hata sayılmaz.
- **Karar:**
  - Dokunma alanı 44×44 px. `@media (max-width: 760px), (pointer: coarse)` içinde uygulanır; yerleşim kuralları genişlikte kalır.
  - Görünür boy 40'a kadar inebilir, alan genişletilir.
  - Her cihazda mutlak alt sınır 24×24 (WCAG 2.2 AA).
  - İstisna: paragraf içindeki satır içi bağlantılar.
- Gerekçe: kurum kuralı "en az 44" diyor; yatay telefon da parmakla kullanılıyor (RS ölçtü: 291 küçük hedef).

**Ç-6 · Next Day'de sıralama: "Sırala" kipi mi, ⋯ mü?**
- UX-07: tutamaçlı "Sırala" kipi. GT-09: ↑↓🗑+ tek ⋯ içinde.
- **Karar: önce ⋯** (Yukarı taşı, Aşağı taşı, Sil, Ekle). Var olan eylemler, yeni bir kip gerektirmiyor.
- "Sırala" kipi, kullanım verisi sıralamanın sık yapıldığını gösterirse ikinci adım olur.

**Ç-7 · Planlama ana sayfası: boşları topla mı, küçült mü?**
- UX-06: "Şimdi karar ver", "Planlar", tek sönük satır diye üç katman.
- KU-13: Next Day ve Weekly ikinci sıraya çıksın.
- GT-11: tek biçim, boş kutu yarım yükseklikte.
- CLAUDE.md'deki kurum kararı: kutuların "yeri sabit, boşken sönük".
- **Karar: GT-11.**
  - Sıra ve yer korunur.
  - Boş kutu tek satıra (yaklaşık 48 px) iner.
  - Vurgu çerçevesi kalkar; vurgu yalnız sayının renginde.
  - Başlık iki satıra kırılır.
- UX'in kutu sırasını değiştiren katmanları ve KU'nun yeniden sıralaması elendi (§8). UX de bunu "masaüstünde korunabilir" diye çekinceyle önermişti.

**Ç-8 · Süzgeç: alttan açılan sayfa mı, pencere mi?**
- UX: alttan açılan sayfa. GT: "Süzgeç" penceresi.
- **Karar:** "Süzgeç (n)" düğmesi var olan `Pencere`'yi açar (telefonda zaten tam ekran ve sağdan; geri tuşu kapatıyor). Yeni bir bileşen gerekmez.
- Seçimler `useAdimDurumu` ile tutulmaya devam eder (geri tuşu kuralı).

**Ç-9 · Alttan açılan sayfa (bottom sheet) bileşeni gerekli mi?**
- UX birçok yerde öneriyor. QA-02 ve KU-15 menü ve takvim için alternatif olarak anıyor.
- **Karar: tek, dar kapsamlı bir "alt sayfa" bileşeni açılsın**, yalnız telefonda (≤760):
  - ⋯ menüleri, kişi kartı (`KisiCipi`) ve tarih seçici.
  - M-02, M-23 ve QA-02'deki kişi kartı taşmasını kökten çözer: konumlandırma hesabı yok, hep görünür.
  - Formlar, ayrıntı ve süzgeç `Pencere`'de kalır (Ç-8).
- Kısa vadede `yerlestir`'in yukarı açılan düzeltmesi (S) yapılır, bileşen (M) sonra gelir.

**Ç-10 · Alt çubuk: Muhabirler yerine Posta mı?**
- KU: Planlama'da Muhabirler yerine Posta (okunmamış sayısıyla).
- CLAUDE.md'de bu sıra açıkça yazılı ("Ana sayfa, Öneriler, Next Day, Muhabirler").
- **Karar: kullanıcıya sorulacak, şimdilik uygulanmaz.** Kullanım sıklığı verisi yok.
- KU'nun Next Day sekmesinin `#/nextday/yarin`'e gitmesi önerisi kabul (M-30). Bu sekmenin hedefini değiştiriyor, yerini değil.

**Ç-11 · Öneri kartındaki yol şeridi**
- UX-10: dokunmatikte metin. GT-03: 2 px'e inip yalnız şimdiki adım renkli olsun ya da karttan kalksın.
- **Karar: dokunmatikte (`hover: none`) şerit yerine tek meta metni** ("Değerlendirmede · Planlama · 45 dk"). Masaüstünde şerit ve ipucu kalır.
- Pencerede adlı yol çizgisi zaten var.

**Ç-12 · Plan adı: rozet mi, metin mi?**
- GT-03: düz meta metni olsun. CLAUDE.md: `OneriPlanEtiketleri` kartta, listede ve ayrıntıda; ayrıntıda basınca plan açılıyor.
- **Karar:** kartta ve listede düz meta metni ("14 Kas · Next Day, Weekly · Irak"). Pencerede ve ayrıntıda bağlantı olarak kalır, 44 px dokunma alanıyla.
- Bilgi ve işlev korunuyor, yalnız görsel ağırlık düşüyor. Kimlik belgesine uygun.

---

## 5) Yeniden doğrulama sonuçları

Ortam: Playwright Chromium, `devices['iPhone 13']` ve `devices['Pixel 7']`, yeni tasarım, `tap`, `goBack`/`goForward`. Betikler `hakem/dogrula.cjs`, `qa02.cjs`, `ep02.cjs`.

| Bulgu | Uzmanın doğrulaması | Hakemin denemesi | Sonuç |
|---|---|---|---|
| **QA-01** "Sayfayı aç" | Tarayıcı ve kod | pl2, iPhone 13 tr ve Pixel 7 ar: `#/nextday` → `#/` → "Karar bekleyen" kutusu → "Sayfayı aç". Adres `#/`'da kaldı, pencere kapandı. Geri tuşu `#/nextday`'e gitti. Görüntü: `ekran/qa01-*.png` | **Doğrulandı** |
| **QA-02** ⋯ menüsü | Tarayıcı | pl2, `#/oneriler`, ilk kart → pencere → alttaki ⋯. Pixel 7 tr menü 833–928 (vh 839), 2 maddenin **0**'ı görünüyor. Pixel 7 ar aynı. iPhone 13 tr 606–701 (vh 664), 1/2. Görüntü: `ekran/qa02-*.png` | **Doğrulandı**, ölçüler QA'nınkiyle bire bir aynı |
| **KU-02** Posta taslağı | Tarayıcı ve kod | pl2, iPhone 13 tr: `#/oneriler` → `#/posta` → sohbet → metin yazıldı → geri: `#/oneriler`. İleri: `#/posta`, taslak **boş** | **Doğrulandı** |
| EP-02 girdi kenarı (kod ve hesap, Yüksek) | Kod ve hesap | mu1, `#/oneriler/yeni`: select ve textarea kenarı rgb(228,231,236), iç ve dış zemin #fff, **1,24:1** | **Doğrulandı** |
| UX-02 / EP-01 | Tarayıcı | pl2, `#/nextday/yarin`: "Haber toplantısına götür" yazısı rgb(26,68,168), zemin rgb(19,39,74) | **Doğrulandı** (1,72:1) |
| UX-01 ve ötekiler (244 px) | Tarayıcı | `.uygulama` zemini `linear-gradient(to right, rgb(255,255,255) 244px, rgb(246,247,249) 244px)` | **Doğrulandı** |
| QA-05 boş alana dokunma | Tarayıcı | pl2, "Görevlerim" paneli açıldı; (195,560)'a dokununca kapandı | **Doğrulandı** |
| UX-14 anlatım kartları | Tarayıcı ve kod | `haftalik/Liste.tsx:130–155`: "haftalikAkis" ve "kollar" kartları statik metin | **Doğrulandı** (kod) |
| KU-12 klavye (Orta, tahmin içeriyor) | Benzetim | Denenmedi; QA-08'in bağımsız ölçümü (görünür alan 500 px, 65 px örtülü) aynı yönde | Tutarlı, gerçek cihazda doğrulanmadı |
| GT-06 "soluk lacivert = yetkisiz" | Görüntüden | pl2'de düğme etkin, renkler EP-01'le aynı | **Yanlış teşhis**, M-01'e katıldı |
| RS-10 (Orta, kod) · GT-19 (Orta, kod) | Kod | Yüksek ya da Kritik olmadıkları için yeniden denenmedi | — |

Kodu okuyarak ya da tahminle Yüksek ya da Kritik verilmiş başka bulgu yok. EP-P1'in (Yüksek) ölçümü CDP ile yapılmış ve sayıları tutarlı.

---

## 6) Uzlaşılmış tasarım sistemi değerleri (yeni tasarım, telefon önce)

Uzmanların birleştiği ilkeler:
1. Ekranda en çok bir dolu birincil düğme (UX, GT, KU-19).
2. Durum renkleri yalnız durumda (UX, GT, EP).
3. Telefonda kart derinliği 1 (UX, GT).
4. Satırda en çok bir uç eylem (› ya da ⋯), gerisi ⋯ menüsünde (UX, GT).
5. Sıfır sayaç çizilmez (UX, GT).
6. 44 piksellik dokunma alanı (KU, EP, RS).
7. 12 pikselin altında yazı yok (UX, GT, EP).
8. Üst katmanda açılan her şey geçmiş adımıdır ve geri tuşuyla kapanır (KU, QA).
9. Zemin tek düz renk (altı uzman).

### 6.1 Tipografi (rem; telefon ≤760 ve `pointer: coarse`)

| Rol | Token | Telefon | Masaüstü | Ağırlık | Not |
|---|---|---|---|---|---|
| Sayı, rozet | `--punto-mini` | 12 (0,75rem) | 12 | 600 | `:lang(ar)` 13 |
| Meta (tarih, kaynak, kim) | `--punto-kucuk` | 13 | 12 | 400 | mini ile ayrışır |
| Gövde, liste satırı, düğme | `--punto` | 15 | 13 | 400 / 500 (düğme) | Girdi alanı her zaman 16 |
| Satır ve kart başlığı | `--punto-orta` | 17 | 15 | 600 | |
| Sayfa ve bölüm başlığı | `--punto-buyuk` | 20 | 20 | 600 | |
| Metrik sayısı | `--punto-dev` | 28 | 28 | 700 | `tabular-nums` |
| Arapça içerik gövdesi | `--punto-icerik` | 16 | 15 | 400 | Naskh, satır yüksekliği 1,7 |
| Arapça içerik başlığı | `--punto-icerik-baslik` | 17 | 17 | 600 | Kufi |
| Avatar harfi | — | 11 | 11 | 600 | nötr |

Kurallar:
- `small small { font-size: inherit }`.
- `em` çarpanı yok.
- 800 ve 900 ağırlıkları yok.

### 6.2 Boşluk

Ölçek: 4 · 8 · 12 · 16 · 24 · 32 (`--ara-5` 20 kullanılmaz).

| Kullanım | Değer |
|---|---|
| İkon ile metin arası | 4 |
| Çip arası, satır içi öğeler | 8 |
| Liste satırının iç dolgusu (dikey) | 12 |
| Sayfa kenarı (sabit), kart iç dolgusu | 16 |
| Bölümler arası | 24 |
| Sayfa sonu, alt çubuğun üstü | 32 |

Satır yükseklikleri:
- Liste satırı: tek satır 48, iki satır 64–72.
- Katlanır bölüm başı: 48.
- Ritim: başlık ile ilk satır arası 8, satırlar arası 12, bölümler arası 24.

### 6.3 Renk rolleri

Yeni blok token'larının üstüne kurulur.

| Rol | Token | Kural |
|---|---|---|
| Birincil eylem, "sıra sende" sayısı | `--lacivert` (#13274a), yazı #fff | Ekranda en çok bir dolu düğme |
| Rutin akış adımı (yumuşak) | zemin `--vurgu-sis`, yazı `--vurgu-koyu` (7,82:1) | M-01 düzeltmesi |
| Bağlantı, seçili, odak | `--vurgu` (#2459d6) | Odak yalnız `:focus-visible` |
| İkincil | zemin `--yuzey`, kenar `--cizgi` | Tehlikeli eylemde yazı `--kotu` |
| Metin | `--murekkep` (17,75), `--sonuk` (7,69), `--silik` (4,97; `--yuzey-2` üstünde kullanılmaz) | |
| Kart ve ayraç çizgisi | `--cizgi` (#e4e7ec) | Bileşen sınırı değil |
| Girdi, onay kutusu, pasif kutu kenarı | **`--cizgi-girdi` #868fa0** (3,26) | Yeni |
| Durum | `--iyi`, `--uyari`, `--kotu` ve sis tonları; bilgi #175cd3 / #d1e9ff | Yalnız durum rozeti ve gecikme metni |
| Kırmızı | `--kotu` | Yalnız gecikme ve ret. Marka kırmızısı (#e1251b) arayüzde yok |
| Pasif düğme | zemin `--yuzey-3`, yazı `--sonuk` | Opaklık yok |
| Birim (masa) rengi | `--masa-*` | Yalnız menüde etkin madde ve sayfa başlığı ikonu. Kenar şeridi yok. `--masa-spor` #157a41'e çekilsin (EP) |
| Zemin | `--zemin` tek ton | Gradyan yok (M-18) |
| WhatsApp | yalnız glif rengi | İkincil ikon düğmesi |
| Avatar | `--yuzey-3` ve `--sonuk` | Kişi başına ton yok |

### 6.4 Bileşen envanteri

| Bileşen | Çeşit | Ölçü | Yerine geçtikleri |
|---|---|---|---|
| Düğme | Birincil · İkincil · Sade (+ yumuşak, yalnız akış adımı) | Görünür 40, dokunma alanı 44; köşe 8; 13–15 px ve 500 ağırlık | `-iyi`, `-uyari`, `-oncelik`, `-birincil`; telefonda `-kucuk` |
| Durum rozeti | nötr · dikkat · tamam · ret · bilgi | 22 px, köşe 6, 12 px ve 500 ağırlık, çerçevesiz | `rozet-*` değiştiricileri; satırda en çok 1 |
| Sayı | nötr · `.sira` (lacivert) · `.gecikme` (kırmızı) | 18 px hap, 12 px ve 600 ağırlık | `.say`, `.rozet-say`, `.dugme-sayi`, `.prg-say` |
| Seçim çipi | normal · seçili (lacivert) | Görünür 32, dokunma alanı 44; köşe 999 | Sekme hapı, `cip-dugme`, plan çipi |
| Kart | tek | Köşe 8, kenar `--cizgi`, dolgu 16, gölge yok; iç içe kart görsel olarak düşer | Bütün kart türleri |
| Liste satırı | tek, katlanır bölüm başı dahil | 48–72 px, ayraç 1 px | Katlanır kart (86 px), tablo-kart |
| Ayraç ve bölüm başı | — | 1 px çizgi; bölüm başı 12 px, 600 ağırlık, `--sonuk` | Çerçeveli bölüm kartı |
| Avatar | tek | 24 ve 32 px, nötr | Renkli avatar |
| Üst katman | `Pencere` (form, ayrıntı, süzgeç) · alt sayfa (⋯, tarih, kişi kartı; telefonda) | Geçmiş adımı, geri tuşuyla kapanır, ilk odak başlıkta | Konumlandırılan açılır menü (telefonda) |
| Yapışık eylem çubuğu | form ve pencere | Alt çubuğun ve güvenli alanın üstünde | Sayfa sonundaki düğmeler |

İkon kuralları (GT):
- Meta bilgide ikon yok.
- Satırda en çok bir uç ikon.
- Boyutlar: satır içi 16, ikon düğmesi 20, alt çubuk 21–24.
- Dolu renkli karo yok.

### 6.5 Dokunma ve etkileşim

- Dokunma alanı 44×44 px (`(max-width:760px), (pointer:coarse)`), mutlak alt sınır 24×24.
- Seçim kutusu `label` içinde; satırın tamamı dokunma alanı.
- Geri tuşu tek kural: `Pencere`, Menü paneli, avatar ve zil panelleri, arama, telefonda açık Posta sohbeti ve alt sayfa birer geçmiş adımı. Form gönderimi `yerineGit`. Gönderilmemiş metin sessizce kaybolmaz.
- Telefonda tam ekran pencerede arka plana dokunarak kapatma yok.
- Açılır panel açıkken ilk dışarı dokunuş yalnız kapatır.

### 6.6 Kırılım noktaları (RS önerisi, kabul)

| Ad | Aralık | Ne değişir |
|---|---|---|
| `telefon-dar` | <360 | Kutular tek sütun, kısa gün adları |
| `telefon` | <761 | Bugünkü 760 kuralları korunur |
| `telefon-yatay` | `(max-height:500px) and (pointer:coarse)` | Telefon düzeni |
| `tablet` | 761–1199 | Çekmece ya da ikon şeridi |
| `masaustu` | ≥1200 | Sabit menü |
| `genis` | ≥1440 | Geniş paneller |

Tek kaynak `kirilim.ts`. Yukarı doğru `min-width: N`, aşağı doğru `max-width: N−0.02px`.

---

## 7) Sayfa sayfa öneriler

**Önerilen düzeltme sırası:**
1. **S işler (bir oturumda):** M-01, M-18, M-03, M-02 (yukarı açılma), M-08, M-13, M-20, M-21, M-29, M-30, M-36.
2. **Geri tuşu bütünü:** M-04, M-05, M-27, M-28.
3. **Ölçek ve dokunma:** M-07, M-06, M-31, M-33.
4. **Sayfa yerleşimleri:** M-09, M-10, M-11, M-12, M-14, M-15, M-24, M-26.
5. **Altyapı:** M-17, M-49, M-52.

| Sayfa | Birleşik öneriler | Bulgular |
|---|---|---|
| **Planlama ana sayfası** (pl1, pl2, yo3) | Kutuların yeri sabit; boş kutu tek satır (≈48 px), "0" ile "Bekleyen yok" birlikte yazılmaz; tek kutu biçimi, vurgu yalnız sayının renginde (lacivert); başlık iki satıra kırılır, <360 px'te tek sütun; kutu adları h2; panelde "Sayfayı aç" düzeltmesi; çift dokunuş koruması; panel alt satırı dibe yapışık | M-03, M-19, M-20, M-32, M-59 |
| **Öneriler** | Sıkıştırılmış sayfa başı (karo yok, "Öneri gir" tek birincil); yapışık sekmeler (44 px); arama ve "Süzgeç (n)" tek satır, etkin süzgeçler çip; dış kart yok; kartta plan adı meta metni, tek durum rozeti, yol şeridi yerine meta metni; gün grubu başlıkları h2 | M-11, M-15, M-39, M-51, M-60, M-06 |
| **Öneri penceresi** | ⋯ menüsü ekran içinde (alt sayfa); bölümler 48 px'lik liste satırı; birincil "Plana ekle" lacivert; etiket satırı gövdeye iner, alt satır tek satır; alt satır yapışık ve dibe yapışık; ilk odak başlıkta; kapalı bölümler açılınca çizilir | M-02, M-24, M-25, M-41, M-20, M-50 |
| **Next Day** | Alt sekme yarının planına gider; bölümler yapışık başlık ve ayraç (kart değil); başlık satırında Arapça başlık 17 px ve "3 gelişme · 1 PKG" metni, eylemler ⋯ içinde; gelişmeler çerçevesiz satır; formlarda asıl alan önde, ayrıntılar katlı, yapışık Kaydet; ekip salt okunur gruplu liste; meta en az 13 px; sayı rozetleri nötr (kırmızı değil); iki satırlı başlık (tarih görünür); LIVE kutusu etiketiyle 44 px | M-09, M-10, M-30, M-37, M-55, M-07, M-15, M-06 |
| **Weekly** | Next Day kalıbı; liste sayfasında anlatım kartları kalkar; "Planı görüntüle" birincil, "Yeni haftalık plan" ⋯ içinde; hafta şeridinde kenar solması; kalem başına plan rozetleri metin | M-38, M-09, M-15 |
| **Posta** | Telefonda açık sohbet geçmiş adımı, taslak saklanır; "← Sohbetler" 44 px sade düğme; yer tutucu arayüz yazısıyla; yazı alanı odaktayken alt çubuk gizli; sohbet açıkken sayfa başı gizli | M-04, M-36, M-22 |
| **Muhabir · Önerilerim** | Tek liste yüzeyi, grup başlıkları; "Senin sıran" başlığında `.sayi.sira`; boş grup çizilmez; Güncel/Arşiv 44 px'lik segment; gizli h1 | M-40, M-32, M-06 |
| **Muhabir · yeni öneri** | Dört içerik alanı önde, "Gün · Masa · Tür" özet satırı; girdi kenarı `--cizgi-girdi`; yapışık "Gönder" (`aria-disabled`, eksik alana odak, durum satırı); tarih seçici alt sayfada; `scroll-padding-bottom`; gönderimden sonra `yerineGit`; tost alt çubuğun üstünde; onay uygulamanın penceresiyle | M-26, M-08, M-23, M-22, M-29, M-21, M-47 |
| **Muhabir · Takiplerim** | Tek başlık ve sayı; kendi avatarı yok, yerine tarih; "Öneriye çevir" ikincil; takip ayrıntısında "Takiplerim" vurgulu; tek "Gelişme ekle"; yazışmaya kısayol çipi | M-53, M-58, M-46, M-57 |
| **Dış muhabirler** | 72 px iki satırlı liste satırı (Arapça ad 16, meta 13); WhatsApp ikincil ikon; seçim kipi, kutu `label` ile 44 px; toplu iletişim çubuğu yapışık | M-14, M-06, M-31 |
| **Organizasyon** | Çerçevesiz ağaç (48 px satır, 16 px girinti, kılavuz çizgi) ya da derine inen gezinme; sayılar düz; sekme şeridinde solma ve etkin sekmeye kaydırma; kişi bağlantısı 44 px; satır başı ikon düğmeleri ⋯ içinde | M-56, M-61, M-06, M-51 |
| **Ayarlar** | Katlanır kartlar yerine gruplu liste (48 px satır, ayraç); başlıkta tekil ikon yok; mobil Menü panelinden erişilir; kılavuz satırları 44 px, `summary` içinde düğme yok | M-24, M-13, M-63 |
| **Masa sayfası** (pr1, sp1, ek1) | Kutucuk ızgarası yalnız masanın ana sayfasında; bölümde içerik hemen başlar; arama tam genişlikte, "Görev talebi" sayfa başında; durum sekmeleri yapışık; Planlama'nın kutu ve kart bileşeni; mor kenar şeridi yok; "Programa aktar" düzeltilmiş yumuşak düğme; Yayın planlarında iç içe kaydırma yok | M-12, M-35, M-01, M-65 |
| **Menü paneli** | Geçmiş adımı ve `<dialog>` (odak içeride, arka plan `inert`); Ayarlar satırı; yo3'te Yönetim grubu katlı ve başta "Sayfa ara"; avatar menüsüyle çift madde yok | M-05, M-13, M-34 |
| **Alt çubuk** | Next Day sekmesi `#/nextday/yarin`'e gider; sayı tek `.sayi` bileşeni, adı "Öneriler, 15 karar bekliyor"; klavye açıkken gizli; tost üstünde; Posta mı Muhabirler mi kullanıcıya sorulacak (Ç-10) | M-30, M-15, M-22, M-21, M-63 |
| **Üst çubuk** | Zil ve avatar panelleri saydam perdeyle, geri tuşuyla kapanır; arama geçmiş adımı; prototip şeridi nötr renkte, tam cümle korunur; zemin düz; masaüstü taşması (M-16) ayrıca | M-27, M-28, M-54, M-18, M-16 |

---

## 8) Elenen öneriler

| Öneri | Kaynak | Neden elendi |
|---|---|---|
| Muhabir formunda Arapça içerik alanlarının başlıkları arayüz dilinde ve başa yaslı olsun | UX-11 | Kurum kararı: muhabir formunun dört alanının başlıkları her arayüz dilinde Arapça (CLAUDE.md, `dil.ts → of*`). UX de "ürün sahibine sorulmalı" diye çekince koymuştu. Formdaki sıra değişikliği kabul edildi (M-26). |
| Muhabirde "Emin misin?" sorusunu kaldırıp yerine "Geri al"lı tost | KU A-1 | Kurum kararı: temel ve geri dönülemeyen adımda `eminMisin` sorulur. Yalnız sunumu (uygulamanın kendi penceresi) kabul edildi (M-47). |
| Planlama ana sayfasında kutuların yerini değiştirmek (Next Day ve Weekly yukarı; "Şimdi karar ver" katmanı) | UX-06, KU-13 | Kurum kararı: kutuların "yeri sabit, boşken sönük". Boş kutunun küçültülmesi kabul edildi (Ç-7). |
| Prototip şeridini "Prototip · örnek kayıt" diye kısaltmak, tam cümleyi dokunmaya bırakmak | UX-17, GT-17 | Kurum kararı: telefonda tam cümle çubuğun altında şerit olarak durur (örnek veri gerçek sanılmasın diye). Renk ve punto değişikliği kabul edildi (M-54). Kısaltma kullanıcıya sorulabilir. |
| "Senin sıran" kartında ince vurgu kenarı | UX-12 | Kimlik belgesi §7 kenar şeritli kartı yasaklıyor. Vurgu sayı rozetiyle verilecek (Ç-2). |
| Yüzen eylem düğmesi ("Öneri gir", "Görev talebi") | UX-03, UX-15 | Kurum kuralı değil, tasarım kararı. Alt çubuk, tost ve klavyeyle çakışıyor, RTL'de yeri değişiyor (Ç-1). |
| Alt çubukta Muhabirler yerine Posta | KU §5 | CLAUDE.md'de kayıtlı gezinme kararı, kullanım verisi yok. Elenmedi, **kullanıcıya sorulacak** (Ç-10). |
| Karar bekleyen panelinde hızlı karar düğmeleri; karardan sonra pencerenin kapanması; telefonda hızlı ekleme satırı | KU A-2, A-3, A-4 | Akış önerisi (adım sayısını değiştiriyor). Brifing kuralı 5 gereği ayrı tutuldu; elenmedi, **akış önerisi olarak kullanıcıya**. |
| Arama kapsamına Latin harfli şehir adı | QA (gözlem) | Tasarım değil, ürün kapsamı (M-69'da yalnız kayıt). |
| Avatar tonlarını koyulaştırmak (renkli avatarın sürmesi) | EP-03 | Kurum kuralıyla çelişmiyor, ama Ç-4'teki nötr avatar kararı lehine bırakıldı. Kontrast amacı nötr avatarla karşılanıyor. |

Kurum kurallarıyla çakışmadığı için **kabul edilenler**:
- UX-14 (Weekly anlatım kartlarının kalkması): kurumun "ekranda kullanım anlatan metin yok" kuralının uygulanması.
- QA-09, UX-11 ve EP-15'teki "Strap ve gelişme gerekli" satırı: kullanım anlatımı değil, durum bildirimi; CLAUDE.md'deki "pasif düğmenin nedeni" kuralıyla uyumlu.
- GT-16 (başlık karosunun kalkması): telefonda sayfa adı korunuyor, yalnız ikon karosu kalkıyor.
- İçeriği sola yaslayan ya da RTL'yi bozan bir öneri hiçbir raporda yok.
- Kişi adını Latin yazıma çeviren bir öneri yok. EP-11 adı Arapça bırakıp yalnız `lang` işaretini düzeltiyor.
