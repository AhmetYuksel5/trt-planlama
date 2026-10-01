# TRT Arabi · Planlama

TRT Arabi haber merkezi için planlama merkezli iş akışı sitesi. Kaynak
kökte, derlenmiş çıktı `docs/` altında ve depoda.

- React + TypeScript + Vite. `npm install` bir kez; `npm run build`
  çıktıyı `docs/` içine üretiyor. **Derlemeden gönderme:** `docs/` elle
  düzenlenmez, kaynak değişince yeniden derlenir.
- GitHub Pages `main` dalındaki `docs/` klasöründen yayınlıyor; her
  gönderimde kendiliğinden güncelleniyor.
- Dayanağı iki belge: Next Day çalışma akışı (on adım) ve haftalık plan
  akışı (Cumartesi–Cuma, üç kola ayrılan paketler). Paket adımları ve
  hafta şeridi oradan geliyor; `src/veri.ts` başındaki yorum eşlemeyi
  anlatıyor.
- Dil: arayüz üç dilli olacak (Türkçe, Arapça, İngilizce). Bütün metinler
  `src/dil.ts` içinde tek tabloda; şimdilik yalnız Türkçe dolu, boş dil
  Türkçeye düşüyor. Ekranlara çıplak metin yazılmaz.
- Veri bu sürümde tarayıcıda (`localStorage`) ve örnek kayıtla açılıyor;
  sunucu katmanı geldiğinde yalnız `src/veri.ts` içindeki yükle/kaydet
  değişecek.
- Rol üst çubuktan seçiliyor; giriş sistemi yerine geçici çözüm.
- Tasarım dili `src/tasarim.css`: beş ana başlığın her birinin kendi
  rengi var, kalan her şey tek vurgu rengi. Ekranlarda çıplak değer yok.
- Telefon düzeni (760 piksel ve altı) masaüstünün küçültülmüşü değil,
  ayrı bir düzen: sol menü ve üst şerit kalkıyor, alta sekme çubuğu
  (`AltCubuk`) geliyor, "Menü" bütün sayfaları, plan başlıklarını, dil ve
  rolü bir panelde (`MobilMenu`) topluyor. Yeni bir sayfa eklenince
  `SolMenu`'deki listeye girmesi ikisine birden yetiyor.
- Tablolar telefonda karta dönüyor: `tablo kartli` sınıfı ve her hücrede
  `data-etiket`, başlık hücresinde `birincil`. Yeni tablo da böyle yazılır.
- Dokunma hedefi en az 44 piksel; telefonda yazı alanları 16 piksel
  (daha küçüğünde iPhone sayfayı yakınlaştırıyor).
- Doğrulama: `npx vite preview` ile açıp 390 piksel genişlikte her
  sayfada yatay taşmanın sıfır olduğuna bakılır.
- Yorumlar Türkçe ve "neden" anlatır, "ne" değil.
- Commit iletisi maddeli: kısa başlık, sonra her madde ne değişti ve neden.
- Bir şey yapmadan önce ne yapacağını söyle.
