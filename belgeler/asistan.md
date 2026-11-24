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
3. **Kayıt değiştiren her araç önce onay kartı açar** (kullanıcı: ekranlar olmasa da her iş
   asistandan yapılabilsin; söyler, onay ekranı çıkar, orada gerekli seçim ve değişiklik
   yapılır, altında onay ya da gönder). Kart işin formudur: başlık ("Gelişme ekle"), kaydın
   adı (önerinin Header'ı), alanlar asistanın doldurduğu değerlerle; seçenekler kayıttan
   (açık planlar, planın başlıkları, muhabirler, haber türleri). Plan değişince başlık
   seçenekleri o planın (`bagli`); "+ Yeni başlık" seçilince ad sorulur (`kosul`). Kişi
   alanları değiştirir, "Onayla" (postada "Gönder") ya da "evet", "tamam", "نعم", "yes" yazar
   veya söyler; iş formun son haliyle yapılır. Zorunlu alan boşsa iş bekler, alan kırmızı.
   "Hayır" ya da başka bir istek iptal eder. Okuma araçları sorulmaz. Modele kişinin son
   değerleri döner (`degerler`).
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

Okuma araçları (sorulmaz): `ara`, `sayfaAc`, `onerileriListele`, `oneriAyrintisi`,
`planOzeti` (başlıklar, gelişmeler, muhabirler, PKG'ler, canlılar, kimlikleriyle; açık
planlar), `haftalikOzeti`, `paketleriListele`, `paketAyrintisi`, `ozelYayinlariListele`, `kisileriListele`
(telefon ve e-posta yok), `takvimListele`, `isleriListele`, `hareketleriListele`.

Yazma araçları (onay kartı; her biri ekranın eylemiyle, kişinin yetkisiyle):

| Alan | Araçlar |
|---|---|
| Öneriler | `oneriGir` (muhabir adına), `oneriPlanaEkle`, `oneriGundemeEkle`, `oneriReddet`, `oneriDegerlendirmeyeAl`, `oneriDuzeltmeIste`, `oneriTakibeAl`, `oneriPlandanCikar`, `oneriArsiveGonder`, `oneriMesajiGonder`, `muhabireOneriGonder`, `oneriMasayaSor`, `oneriGorevlendir` |
| Next Day | `planBaslikEkle`, `planBaslikCikar`, `gelismeEkle`, `gelismeDuzenle`, `gelismeSil`, `basligaMuhabirEkle`, `basliktanMuhabirCikar`, `paketEkle`, `paketKarari` (kabul, ret, plandan kaldır, sil), `canliEkle`, `canliSil`, `planAkisi` (toplantıya, taslağa, onay), `hareketKaydet`, `hareketSil`, `toplantiNotuEkle` |
| Weekly | `haftalikPlanAc`, `kalemEkle`, `kalemKarar`, `haftalikAkisi` (toplantıya, hazırlığa, kesinleştir) |
| Özel yayın | `ozelIcerikGorevlendir` (yayının İçerik'i; özel yayın için `paketGorevVer` değil), `paketiOzeleBagla` (plansız açılmış görevi yayına alır) |
| Paketler | `paketGorevVer`, `paketTeslimGunu`, `paketSonucuKarari`, `paketNotu`, `paketMetniDuzenle` |
| Diğer | `isVer`, `isDurumu`, `faaliyetEkle`, `postaGonder` (kişinin EWS kimliğiyle; giden balon Posta'ya) |

Kapıda yazma aracının açıklaması "YAZMA" ile başlar; tarayıcıda o araç formlu tarafta
(`YAZMA`) olmak zorunda, okuma tarafına düşen yazma aracı sorulmadan çalışırdı (testte).
Ekranın düğmeyi göstermediği durumda araç form açmadan nedenini döner (`weeklyGundeminde`,
`zatenPlanda`, `yetki`…); model kişiye söyler.

### Sonraki adımlar

- Özel yayın, Aylık, Muhasebe, Organizasyon işleri; Next Day ekip ve hazır paketler.
- Sayfa bağlamı: açık plan, seçili öneri, açık paket asistana "bu" diye geçer.
- Yanıt sesli okunabilir; OpenAI uyumlu sağlayıcı; muhabirin kendi asistanı.

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
- `src/asistan/araclar.ts`: yürütücüler (okuma; yazma araçlarının formu ve işi).
- `src/asistan/motor.ts`: döngü, onay, oturum saklama.
- `src/bilesenler/Asistan.tsx`: panel, onay kartı (form), yüzen düğme, Ctrl/⌘+J.
- Testler: `worker/test/asistan.test.ts`, `testler/asistan.cjs`.
