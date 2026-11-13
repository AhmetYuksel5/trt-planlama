# Öneriden yayına tek sistem: üç planlamacı ajanın birleşik brifingi

Kullanıcı: "Plan öneri temelli kuruluyor, ama çıktıların yapılış biçimleri farklı:
günlük PKG'yi Newsdesk hazırlıyor; Program'ın paketleri günlük plana hiç girmiyor,
Weekly'de ayrıca tartışılıp Program hazırlıyor; Ekonomi ve Spor paketleri var; stok
paketlerini Planlama yürütüyor ama editoryal tetkiki Newsdesk editörüne yaptırıyor,
dil denetiminden sonra sisteme Planlama yüklüyor. Her öneri pakete dönüşmüyor. Bu
farklılıklar karmaşa yaratıyor. Tam bir sistem nasıl kurulur?"

Üç ajan prototipi (CLAUDE.md ve kod) okudu, hiçbir şey değiştirmedi:
(1) süreç tasarımı yapan Planlama şefi, (2) üretim koordinasyonundan sorumlu
planlamacı, (3) veri modeli ve ürün tarafını bilen planlamacı.

## Ortak teşhis (üçü de aynı yere vardı)

**Sorun çıktı biçimlerinin çokluğu değil. Sorun, "bu iş ne olacak, kim hazırlayacak,
nerede yayınlanacak" sorusunun sistemde açık bir karar alanı olmaması.** Cevap
paketin üstündeki altı yedi bayraktan (`stok`, `gorev`, `gorevTalebi`, `masaTakibi`,
`ozelId`, `haftalikKalemId`, `planId`, kol) sırayla okunan kurallarla tahmin ediliyor.

Bunun sonuçları:
- **"Kimde" dört yerden, farklı cevapla:** `paketSahibi`, `gorunenSahip`, `masaYolu`,
  `stokDurumu`. Hangi kural önce yazıldıysa o kazanıyor.
- **Aynı masada iki tür paket:** masa kolundan gelen paket akışa (tetkik, dil,
  yükleme) giriyor. Masaya sorulup görevlendirilen ya da görev talebinden doğan
  paket `gorev` taşıdığı için `masaPaketi()` yanlış (false) dönüyor ve akışa hiç
  girmiyor: muhabir "Yapıldı" diyor, masa "Yayınlandı" diyor, arada kayıt yok.
- **Stok süreci kayda girmiyor:**
  - Parçalı metnin tetkik aşaması `yetki.ts → parcaYapabilir` içinde koda sabit
    (`{tur: "kol"}`): feature/stok kolunda tetkik Planlama'ya düşüyor, Newsdesk
    editörüne değil. Organizasyon'daki durak ayarı bunu değiştiremiyor.
  - Plansız görevle açılan stok paketi ise tetkik, dil ve yükleme olmadan
    "Yapıldı → onay"la stoka düşüyor.
- **"Bitti" dört ayrı dilde:** muhabirin "Yapıldı"sı + onay, masanın "Yayınlandı /
  Yayınlanmadı"sı, stokta plana seçilip devirle yayınlandı, özel yayının "yayına
  hazır"ı.
- **Önerinin kararı saklanmıyor:** paketsiz plana giren öneri, PKG kutusu boş
  bırakıldığı için örtük olarak "takip" sayılıyor. Kararın ne olduğu ancak plandaki
  kayıtlar taranarak çıkarılıyor (`oneriYolu`), tutarlılığı da açılış işi
  (`onerileriPlanlaEsitle`) sürekli düzeltiyor.
- **Karar verilmeyen öneri sessizce kayboluyor:** günü geçince arşive düşüyor, ret ve
  tamamlanmayla aynı yerde duruyor, hiçbir sayıda görünmüyor.
- **Görünürlük boşlukları:**
  - Planlama, Program'ın o hafta ne hazırladığını kendi ekranından göremiyor.
  - Eş öneri, "plandakine bağla", kayıp başlık yamaları, öneri yerine plana
    doğrudan PKG açılmasının izleri.

## Önerilen sistem: "tek karar, tek rota, tek kapanış"

Zincir: **Öneri → Karar → (Paket) → Üretim → Kapanış.**

1. **Öneri** bugünkü gibi kalır (muhabir, talimat, muhabir dışı kaynak).
2. **Karar** önerinin tek, açık kararıdır ve kayda yazılır (`Oneri.karar`):
   - **Sonuç:** Gelişme / Takip / PKG / Canlı / Masa (Program, Ekonomi, Spor) /
     Stok / Ret.
   - **Hazırlayan:** sonuçtan varsayılanı gelir, değişebilir.
   - **Hedef:** Next Day / Weekly / masanın programı ya da bülteni / stok / özel
     yayın.
   - **Gün** (ya da "günü belli değil").

   Bugünkü ayrı kapılar ("Plana ekle", "Gündeme ekle", "Takip olarak kalsın",
   "Birimin görüşüne sun", "Muhabiri görevlendir", "Reddet") bu tek formun hazır
   seçimleri olur; arkadaki eylemler aynen çalışır, sonunda kararı yazar.
3. **Paket** yalnız paketli kararda doğar ve **rotasını** tek alanda taşır
   (`Paket.yol`: üretici birim + vitrin). `stok`, `masaTakibi`, `masaPaketi`,
   `paketSahibi` bu alandan türer. `gorev`, `gorevTalebi`, `haftalikKalemId` yalnız
   kökeni anlatır, yolu belirlemez.
4. **Üretim tek omurgadan geçer:** karar → görev → metin → editoryal tetkik → dil
   → video kontrolü → yükleme → yayına çıkış. Yoldan yola değişen yalnız
   parametreler. Yeni şablon kavramı gerekmez; Organizasyon › İş akışları'ndaki
   **kol başına akış** zaten bu. Eksik iki şey var:
   - Durakta **tetkikçi ayarlanabilsin** (`Durak.tetkik`): stok akışında Newsdesk
     editörü, yükleme Planlama.
   - **Görev ve masa takibi paketleri de akışa girsin:** muhabir teslim edince
     paket metin durağına geçer. Sade "Yapıldı" yalnız haber kolunda ve Newsdesk
     sistemde değilken kalır.
5. **Kapanış her rotada aynı iki adım:** "Teslim edildi" (muhabir ya da son durak)
   → "Yayınlandı / Yayınlanmadı" (vitrinin sahibi). Muhasebe teslimi, raporlar
   yayını sayar. Rota değişirse ("Masa → Stok") hareket olarak yazılır, sessizce
   değişmez.

### Çıktı türleri

| Tür | Karar | Hazırlayan | Tetkik | Dil | Yükleme | Vitrin | Bitti |
|---|---|---|---|---|---|---|---|
| Günlük PKG | Next Day toplantısı, plan onayı | Muhabir → Newsdesk | Newsdesk | Script Editor | Newsdesk | Next Day | Teslim + yayın |
| Program ek paketi | Weekly (ayrı bölüm) | Muhabir → Program | Program | Script Editor | Program | Programın bölümü (Next Day'e geçmez) | Teslim + Program "yayınlandı" |
| Ekonomi / Spor | Planlama + masanın "uygundur"u | Muhabir → masa | Masa | Script Editor | Masa | Masanın bülteni (isterse Next Day hazırı) | Teslim + masa kararı |
| Stok | Weekly (günsüz kabul) ya da Planlama'nın görevi | Muhabir; yürüten Planlama stok ekibi | **Newsdesk editörü** | Script Editor | **Planlama** | Stok havuzu → bir Next Day'in hazırı | Teslim = stokta; yayın = plana seçilip devirle |
| Özel yayın | `ozOnay` | Dış muhabir ya da in-house | Planlama | Script Editor | Stok ekibi | Özel yayın | Yayının "yayına hazır"ı |
| Gelişme / Takip | Planlama | (bilgi) | — | — | — | Next Day gelişmesi / متابعات | Planın günüyle; takip son satırdan 2 gün sonra |
| Canlı | Planlama | Muhabir + Newsdesk | — | — | — | Next Day "مباشر" | Newsdesk ✓/✕ |

### Her paketin ekranda cevaplayacağı üç soru

Şu an kimde (birim ve kişi, "Newsdesk · tetkik · parça 2/3"), sıradaki adım ne,
nerede yayınlanacak ("Next Day 14 Kas", "Program X · Pzt", "Stok", "Ekonomi
bülteni"). Tek satırlık bileşen. Üç yerde aynı kuraldan beslenir:
- Planlama'nın panosu (rota/durak sütunları; Program'ın paketleri dahil haber
  merkezinin bütün yükü),
- masanın sayfası,
- Newsdesk'in "Sıradaki işlerim"i (tetkik bekleyen parçalar kolundan bağımsız).

### Kapanmayan uçlar için kurallar

- **"Açık uçlar":** kararı verilmiş ama sonucu gelmemiş öneri, "kimde · kaç
  gündür" bilgisiyle; günü geçen kırmızı.
- **Kararsız arşiv:** karar verilmeden arşive düşen öneri ayrı grupta ve sayıda.
- **Stok yaşı:** 7 gün kullanılmayan stok Günün notuna düşer; 30 gün sonra stok
  ekibine "gündemi geçti mi?" sorulur. Kendiliğinden silinmez.
- **Çift seçim yok:** hazır listesine alınan paket o planın kimliğini taşır; başka
  açık planın seçicisinde "X planında" diye pasif görünür.
- **Sahipsiz paket:** sahibi bulunamayan onaylı paket tam yöneticinin kuyruğuna
  düşer.
- **Önce bağlama:** muhabir adına PKG açılırken bekleyen önerisi varsa form önce
  "bağla" seçeneğini gösterir.

## Aşamalı plan (her adım ayrı yayınlanır, testleri bozmaz)

1. **Stokta tetkik Newsdesk'te** (en küçük, kurumun bugünkü işine en doğrudan
   uyan): `Durak.tetkik`; feature/stok akışında tetkik Newsdesk editörüne,
   yükleme Planlama'ya. Plansız görevle açılan stok paketi de teslimden sonra
   akışa girer.
2. **Rota görünür olur, davranış değişmez:**
   - `yolTuret(p)` ve `oneriKarariTuret` saf işlevleri, bugünkü kuralların birebir
     karşılığı.
   - Pakette ve öneride rota rozeti.
   - Tam yöneticiye "çelişen kayıtlar" sayacı.

   Yanlış görünen yerler kurumun gerçek kuralını ortaya çıkarır.
3. **Rota kayda yazılır, kurallar ondan okur:**
   - Paket açan bütün eylemler `Paket.yol`'u yazar; eski kayıtları açılış işi
     doldurur.
   - `stokDurumu`, `masaPaketi`, `paketSahibi`, `hazirSecilebilir` ondan okur.
   - Görev ve masa takibi paketleri akışa girer; masada tek tür paket kalır.
4. **Önerinin kararı ve tek karar formu** (yeni tasarımın arkasında):
   - `Oneri.karar` yazılır; geçmiş öneriler için açılış işi.
   - Öneri penceresinde tek "Karar ver" formu.
   - Paketsiz kapanış açık bir seçenek olur.
5. **Tek kapanış ve görünürlük:**
   - Her rotada "Teslim → Yayınlandı/Yayınlanmadı".
   - "Açık uçlar" sekmesi, kararsız arşiv sayısı.
   - Planlama'nın "Bütün işler" panosu.
   - Raporlar'da birim başına üretim, stok yaşı, karar süresi.

## Kuruma sorulacaklar

1. **Stokun istasyon sırası:** "Planlama görev → Newsdesk editoryal tetkik →
   Script Editor → (video kontrolü kimde?) → Planlama yükler" doğru mu? Tetkikten
   dönen işi muhabire kim iletir?
2. **Program'ın ek tartışması:** Weekly'nin ayrı bir bölümü mü, ayrı bir toplantı
   ve plan mı? Kararı Weekly toplantısı mı, Program müdürü mü verir?
3. **Ekonomi ve Spor paketleri:** Yalnız masanın bülteninde mi kalsın, Next Day'de
   de görünsün mü? İkisindeyse "yayınlandı"yı kim işaretler?
4. **Paketsiz plana giren haber:** Planın günü geçince "kapandı" sayılsın mı?
   Muhabire "tamamlandı" mı, "bilgi olarak kullanıldı" mı görünsün? Muhabir
   performansında sayılsın mı?
5. **Bir öneri, iki çıktı:** Aynı öneri hem Next Day PKG'si hem Program versiyonu
   olabiliyor mu? Olabiliyorsa iki ayrı paket mi?
