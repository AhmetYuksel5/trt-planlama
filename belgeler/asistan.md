# Asistan: doğal dille iş yapma

Kullanıcının isteği: kişi hiçbir düğmeye basmadan, yalnız yazarak ya da konuşarak
sistemde iş yapabilsin; komut versin, veri eklesin, bir şeyler yaptırsın.

## İlkeler

1. **Asistan yeni yetki doğurmaz.** Her iş, ekranın kullandığı eylemle (`eylemler.ts`)
   ve onun yetki denetimiyle yapılır. Kişi ekranda yapamadığını asistana da yaptıramaz.
   Muhabir yalnız kendi işini görür; kısıtlı kişi kendi koleksiyonlarını okur.
2. **Kapı yazmaz.** Servis hesabı istemiyoruz (bkz. posta). Kapı (`worker/`) konuşmayı
   ve araç tanımlarını modele götürür, modelin "şu aracı şu girdiyle çalıştır" isteğini
   tarayıcıya döndürür. Aracı tarayıcı, kişinin kendi oturumuyla çalıştırır.
3. **Kayıt değiştiren her araç önce sorulur.** Asistan ne yapacağını bir cümleyle söyler
   ("Yarının Next Day planına, Gazze başlığına bu gelişmeyi ekleyeceğim"). Kişi "evet",
   "tamam", "onayla", "نعم", "yes" yazar ya da söyler; düğmeye basmak da olur ama şart
   değil. "Hayır" ya da başka bir istek iptal eder. Okuma araçları sorulmaz.
4. **Geri alınabilir.** Yazış normal `kaydet`'ten geçtiği için plan ekranının ↶'ü ve
   hareket kaydı aynen çalışır; asistanın yaptığı da hareket kaydında kişinin adıyla durur.
5. **Model kayıt görmez, kayıt çağırır.** Bütün kayıt modele gönderilmez (hem maliyet hem
   gizlilik): model okuma araçlarıyla gerektiği kadarını ister. Muhabirin telefonu,
   e-posta adresi gibi kişisel alanlar araç yanıtına girmez.
6. **İzlemede ve eşitlenmeden yazmaz** (`kaydet` zaten durduruyor); demoda kapıya gidilmez.

## Mimari

```
Kişi ─► Asistan paneli (bilesenler/Asistan.tsx)
           │  mesaj + bağlam (sayfa, bugün, dil, kişinin birimi)
           ▼
        Motor (src/asistan/motor.ts)  ◄──────────────┐
           │ POST /asistan {mesajlar, baglam}         │ araç sonucu (tool_result)
           ▼                                          │
        Kapı (worker/src/asistan.ts) ─► Claude (araç tanımlarıyla)
           │ yanıt: metin + araç istekleri (tool_use) │
           ▼                                          │
        Araç yürütücüsü (src/asistan/araclar.ts) ─────┘
           okuma: hemen çalışır
           yazma: önce sorulur, "evet" gelince eylemler.ts
```

- **Araç tanımları kapıda** (`worker/src/asistan.ts → ARACLAR`): ad, açıklama, girdi şeması.
  Kapı yalnız bu adları modele verir; tarayıcıdan araç tanımı alınmaz (istem enjeksiyonu
  ve maliyet). Tarayıcıdaki yürütücü aynı adlarla (`src/asistan/araclar.ts`); iki listenin
  eşitliği testte.
- **Döngü tarayıcıda.** Tarayıcı modelin yanıtındaki araçları çalıştırır, sonuçlarını
  `tool_result` olarak aynı konuşmaya ekleyip kapıya yeniden gönderir; model metinle
  bitirene dek (en çok 8 tur). Yazma aracında döngü durur, kişiye sorulur; yanıt gelince
  sonuç ("yapıldı" ya da "kişi vazgeçti") ile sürer.
- **Konuşma tarayıcıda** (`sessionStorage`, sekmeye bağlı): kayda girmez, kapıda saklanmaz.
- **Sınır ve maliyet:** asistan da bir yapay zeka özelliği (`asistan`): Ayarlar › Yapay
  zeka'da açılır, sağlayıcı, birimler ve kişi başına günlük sınır orada. Sınır kişinin
  her mesajında bir artar (araç turları sayılmaz). Kapı konuşmanın uzunluğunu sınırlar
  (son 30 ileti, toplam 60.000 karakter).
- **Sağlayıcı:** ilk sürüm Claude (araç kullanımı, düşük çaba). OpenAI uyumlu uçta işlev
  çağrısı sonraki adım; o zamana dek asistan Claude sağlayıcısına bağlanır.

## Araç kataloğu

### 1. aşama (bu sürüm)

| Araç | Tür | Ne yapar | Eylem |
|---|---|---|---|
| `ara` | okuma | Paket, öneri, kişi, sayfa arar | `arama.ts → kayitAra` |
| `sayfaAc` | gezinme | Sayfayı açar | yönlendirme |
| `onerileriListele` | okuma | Karar bekleyen / planda / arşiv öneriler | `oneriSekmeleri.ts` |
| `oneriAyrintisi` | okuma | Bir önerinin metni, durumu, yeri | `oneriPlanlari.ts` |
| `planOzeti` | okuma | Bir günün Next Day planı: başlıklar, gelişme ve PKG sayıları | kayıt |
| `gelismeEkle` | yazma | Next Day başlığına gelişme ekler | `gelismeKaydet` |
| `oneriPlanaEkle` | yazma | Öneriyi Next Day planına ekler (PKG ile ya da paketsiz) | `oneriPlanaEkle` |
| `oneriReddet` | yazma | Öneriyi gerekçeyle reddeder | `oneriDurum` |
| `oneriDegerlendirmeyeAl` | yazma | Öneriyi değerlendirmeye alır | `oneriDurum` |

### 2. aşama

- Öneri gir (muhabir adına telefon/mesaj), takip ekle, PKG kabul/ret, paket notu,
  muhabire posta taslağı (gönderme yine onaylı), Weekly'ye kalem ekle ve karar ver,
  görev ver (`isKaydet`), canlı yayın ekle, hareket (izin/görevlendirme) kaydet.
- Ses: tarayıcının konuşma tanıması (Web Speech API, Arapça ve Türkçe), mikrofon
  düğmesi ve "Hey" sözcüğü yok: basılı tutup konuşma. Yanıt sesli okunabilir.
- Sayfa bağlamı: açık plan, seçili öneri, açık paket asistana "bu" diye geçer.

### 3. aşama

- Çok adımlı işler ("Yarının planını toplantıya hazırla": kararsız PKG'leri listele,
  her biri için sor), özetler ("bugün ne oldu"), Günün notunu (`gununNotu.ts`) okuyup
  yorum, OpenAI uyumlu sağlayıcı, muhabirin kendi asistanı (öneri gönder, takip yaz).

## Güvenlik notları

- Araç girdisi şemayla ve yürütücüde yeniden denetlenir (kimlikler kayıtta var mı,
  metin uzunlukları); model yanlış kimlik verirse araç hata döner, eylem çalışmaz.
- Araç yanıtındaki içerik (öneri metni, posta) modele veri olarak gider; yönerge,
  kayıttan gelen metnin talimat sayılmayacağını söyler.
- Yazma araçları onaysız çalışmaz; onay yalnız kişinin kendi yazdığı mesajdan gelir,
  araç sonucundan ya da kayıttaki metinden gelmez.
- Demo: kapıya gidilmez; panel "asistan gerçek kipte, yapay zeka kapısıyla çalışır"
  der. Uçtan uca test sahte modelle (`window.__asistanModeli`) çalışır.

## Dosyalar

- `worker/src/asistan.ts`: araç tanımları, sistem yönergesi, istek doğrulama.
- `worker/src/saglayici.ts → asistanCagir`: Claude'a araçlı çağrı.
- `worker/src/index.ts → /asistan`.
- `src/asistan/araclar.ts`: yürütücüler (okuma/yazma, onay metni).
- `src/asistan/motor.ts`: döngü, onay, oturum saklama.
- `src/bilesenler/Asistan.tsx`: panel, yüzen düğme, Ctrl/⌘+J.
- Testler: `worker/test/asistan.test.ts`, `testler/asistan.cjs`.
