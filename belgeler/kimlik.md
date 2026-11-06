# Plannersflow kimlik belgesi

Bu belge ürünün nasıl görüneceğini değil, **ne olduğunu ve nasıl davrandığını**
tarif eder. Tasarım kararları (renk, yazı, bileşen, metin) buna dayanır;
çelişen bir istek gelirse önce bu belge güncellenir.

## 1. Konum

> Plannersflow, uluslararası bir haber kuruluşunun günlük haber operasyonunu
> planladığı, yürüttüğü ve izlediği **Newsroom Operations Platform**'dur.

Bir yönetim paneli değil, haber merkezinin operasyon odası. Kullanıcısı
planlamacı, Newsdesk editörü, Script Editor, muhabir ve yöneticidir; hepsi
aynı kaydın farklı yüzüne bakar.

## 2. Omurga: üç soru

Her ekran, her kart, her bildirim şu üç sorudan en az birine cevap verir.
Cevap vermeyen öğe ekrana girmez.

1. **Şu an ne oluyor?** Zaman: saat, bülten, plan aşaması, son dakika.
2. **Kimde bekliyor?** Sorumluluk: kişi, birim, ne kadar süredir.
3. **Sıradaki ne?** Eylem: sıradaki iş, sıradaki bülten, tek birincil düğme.

## 3. İlkeler

1. **Zaman görünürdür.** Saat (GMT ve İstanbul) her ekranın üstünde; bülten,
   canlı bağlantı ve toplantı bir zaman çizgisinde. Saat tek genişlikli yazıyla.
2. **Sorumluluk adla yazılır.** "Beklemede" değil, "Newsdesk'te · 40 dk". Her
   kaydın üstünde şimdi kimde olduğu, kişinin adı ve süre.
3. **Kurumun dili birinci sınıftır.** Next Day kağıdı, الأجندة الإخبارية,
   PKG / PKG PROPOSAL, TEAMS, SCHEDULE, "YER / başlık / muhabir", bülten
   adları. Arayüz bunları çevirmez, sadeleştirmez; kurumun belgesi nasılsa öyle.
4. **Arapça içerik baş köşededir.** İçerik her arayüz dilinde sağdan sola ve
   kendi yazı ailesiyle (başlık Kufi, metin Naskh). Latin arayüz Arapçanın
   yanında küçülür, Arapça Latin'in yanında küçülmez.
5. **Renk anlam taşır, süs değildir.** Bir rengin tek bir anlamı vardır;
   aynı renk iki şey söylemez.
6. **Sakinlik.** Haber merkezi zaten gürültülü; arayüz sakin olur. Gölgesiz
   yüzey, ince çizgi, geniş boşluk. Yoğunluk yalnız Newsdesk masasında.
7. **İstisna yoktur.** Kimliği güzel tek tek ekranlar değil, her ekranın aynı
   kuralı taşıması kurar. Yeni ekran mevcut bileşenden yapılır.

## 4. Bugünkü tasarımda kimliksiz kalanlar

Bunlar düzeltilecek; yeni işte tekrarlanmaz.

- **Renkler anlam çakıştırıyor.** Plan renkleri durum renkleriyle aynı:
  Weekly yeşili "iyi" yeşili, Aylık turuncusu "uyarı", Özel yayın kırmızısı
  "kötü" (`tasarim.css`, `--haftalik`/`--iyi`, `--aylik`/`--uyari`,
  `--ozel`/`--kotu`). Ekranda yeşil bir şey "Weekly" mi "tamam" mı belli değil.
- **Hazır şablon kartı.** 12 piksel köşe ve iki katlı gölge (`--golge-kart`),
  46 ayrı gölge kullanımı: her şey eşit ağırlıkta kutu, admin şablonu hissi.
- **Arapça ikinci planda.** Arapça için genel bir yazı ailesi (Noto Sans
  Arabic), başlık ile metin ayrımı yok; kurumun kağıdındaki ağırlık ekranda yok.
- **Yazı ölçeği dağınık.** 11 / 12,5 / 14 / 15,5 / 20 / 26: yarım puntolar,
  belirsiz hiyerarşi.
- **Zaman ve sorumluluk dağınık.** Saat yalnız bazı ekranlarda; "kimde
  bekliyor" bazı kartlarda yazıyla, bazılarında hiç.
- **Marka zayıf.** Marka kırmızısı (`--marka`) neredeyse hiç kullanılmıyor;
  vurgu mavisi genel bir SaaS mavisi.

## 5. Sistem

### Renk

- **Nötrler (yüzeyin %90'ı):** zemin `#F6F7F9`, yüzey `#FFFFFF`, çizgi
  `#E4E7EC`, metin `#101828`, ikincil metin `#475467`, sönük `#667085`.
- **Marka:** lacivert `#13274A` (menü, birincil düğme, başlık vurgusu).
- **Vurgu:** tek mavi `#2459D6` (bağlantı, seçili, odak). Başka vurgu yok.
- **Durum (yalnız durum için, başka hiçbir şeyde kullanılmaz):**

  | Durum | Yazı | Zemin |
  |---|---|---|
  | Planlı / beklemede | `#475467` | `#F2F4F7` |
  | Sırada / dikkat | `#B54708` | `#FEF0C7` |
  | Yapıldı / tamam | `#067647` | `#DCFAE6` |
  | Revizyon / yapılmadı / ret | `#B42318` | `#FEE4E2` |
  | Yayına hazır / bilgi | `#175CD3` | `#D1E9FF` |

- **Planlar renkle değil, adla ve simgeyle ayrılır.** Next Day, Weekly,
  Aylık, Özel yayın renkli kutu taşımaz; durum renkleriyle karışmasın diye.
- **Son dakika:** koyu şerit (`#101828` zemin, kırmızı etiket); yalnız
  Newsdesk ve operasyon görünümünde.

### Yazı

- Arayüz: **Inter**; saat ve kod: **IBM Plex Mono**.
- Arapça başlık: **Noto Kufi Arabic**; Arapça metin: **Noto Naskh Arabic**,
  satır aralığı 1,7.
- Ölçek (tam puntolar): 12 · 13 · 15 · 17 · 20 · 28.
- Çıktı ve Word belgesi kurumun kendi yazı tipiyle kalır (Calibri).

### Yüzey ve boşluk

- Kart: beyaz, 1 piksel çizgi, 8 piksel köşe, **gölgesiz**. Başında ince
  başlık satırı: ad, sayı, en çok bir eylem.
- Gölge yalnız açılır katmanda (pencere, menü).
- Boşluk 4'ün katları: 4 · 8 · 12 · 16 · 24 · 32. Kart içi 16, kartlar arası 16–24.

### Ortak öğeler

Her ekran bunlardan kurulur; benzerini yeniden yazmak yok.

- **Durum çipi:** beş durumdan biri, yuvarlak hap.
- **Kişi çipi:** avatar + Arapça ad + birim; süre yanında ("· 40 dk").
- **Kimde bekliyor satırı:** kayıt · şimdi kimde · durum · süre.
- **Zaman çizgisi:** saat (mono) · nokta · olay; şimdiki an vurgulu.
- **Yol çizgisi:** paketin adımları ince çubuklar halinde; geçilen yeşil, şimdiki mavi, gelecek gri.
- **Metrik:** büyük sayı + kısa ad + tek satır yorum; süs grafik yok.
- **Belge yüzeyi:** planlar kağıt gibi, kurumun bölüm sırası ve biçimiyle.

## 6. Ses

- Kısa, kararlı, haber odası temposunda. "Sıra sende", "Newsdesk'te · 40 dk",
  "Yayına hazır".
- Ne olduğunu söyler, nasıl kullanılacağını anlatmaz (kullanım kılavuzda).
- Onay soruları sonucu sayıyla söyler: "3 paket kabul edilecek, 2 muhabire
  görev gidecek."
- Hata ve uyarı suçlamaz, ne yapılacağını söyler.
- Boş ekran sakin: tek satır durum, süs görsel yok.

## 7. Yapılmayacaklar

- Renkli kutu kalabalığı, her bölüme ayrı renk.
- Kartlarda gölge, degrade, kenar şeritli kart, emoji.
- Aynı bilgiyi iki yerde iki farklı biçimde göstermek.
- Arapça içeriği Latin yazı ailesiyle ya da soldan sağa yazmak.
- Ekrana kullanım anlatan paragraf, yönerge kutusu.
- Kurumun terimini (PKG, TEAMS, الأجندة) "daha anlaşılır" diye değiştirmek.

## 8. Uygulama sırası

1. `tasarim.css` token'ları bu belgeye göre: nötrler, marka, tek vurgu, beş
   durum rengi; planların renkleri kalkar; yazı ölçeği, köşe, gölge.
2. Ortak öğeler (durum çipi, kişi çipi, kimde bekliyor satırı, zaman çizgisi,
   yol çizgisi, metrik) `bilesenler/`'de; eskileri bunlara geçer.
3. Kabuk: menü bölümleri (Operasyon, Üretim, Kurum), üst çubukta saat.
4. Ekranlar birim birim: operasyon görünümü (ana sayfa), Next Day, Newsdesk
   masası, paket ayrıntısı, birimler ve performans. Örnekleri tasarım
   kanvasında (NO-1…NO-5).

Uygulama önce deneme olarak: "Yeni tasarım" anahtarı (Ayarlar, avatar
menüsü) bütün siteyi bu belgeye göre değiştirir, eski tasarım yanında kalır.
Görünüşte Linear (sakin, yoğun, klavyeyle), işlevde Monday (grup + sütun
tablosu, tek tıkla durum, aynı veriye Liste/Pano görünümü) örnek alınır;
adı, rengi, logosu değil.

Her adım ayrı commit; üç dil, sağdan sola içerik, telefon düzeni ve 390
pikselde taşmasızlık kuralları değişmez.
