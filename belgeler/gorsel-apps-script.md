# Öneri görselleri: Google Drive ve Apps Script

Muhabir öneriye görsel ekleyince (en çok 4) tarayıcı görseli küçültür (en uzun kenar
1600 piksel, JPEG) ve kurumun Google hesabında çalışan bir Apps Script web
uygulamasına gönderir. Betik:

1. Gönderenin Firebase oturum belgesini Google'da doğrular (yalnız Plannersflow'a giriş
   yapmış kişi yükleyebilir),
2. Dosyayı Drive'da `Plannersflow · Öneri görselleri / <kişinin adı>` klasörüne yazar,
3. Dosyayı "bağlantıya sahip olan görüntüleyebilir" yapar (ekrandaki küçük resim
   böyle görünüyor),
4. Dosyanın kimliğini döndürür; kayıtta (Firestore) yalnız bu kimlik durur.

Cloudflare'e (kapı) hiç uğramaz; kota kullanmaz. Drive'ın kotası hesabın kotasıdır
(ücretsiz Google hesabında 15 GB; 300 KB'lık görselle ~50.000 görsel).

Kurulduktan sonra web uygulamasının `/exec` ile biten adresi Ayarlar ›
"Öneri görselleri (Google Drive)" kartına girilir (yalnız tam yönetici). Adres
boşken görsel ekleme düğmesi görünmez.

## Betiğin kodu (Code.gs)

```javascript
// Plannersflow · öneri görselleri. Web uygulaması: "Execute as: Me", "Who has access: Anyone".
// Firebase web anahtarı gizli değil (tarayıcıya giden kimlik); oturum belgesini doğrulamak için.
const FIREBASE_ANAHTARI = "AIzaSyB2HmZgg1J_kXqszuBuRAUA7vAZ_X3OyHM";
const KOK_KLASOR = "Plannersflow · Öneri görselleri";
const EN_BUYUK = 6 * 1024 * 1024; // base64 metin; ~4.5 MB görsel

function doPost(e) {
  try {
    const g = JSON.parse(e.postData.contents);
    const kullanici = dogrula(g.belge);
    if (!kullanici) return cikti({ hata: "oturum" });
    if (typeof g.veri !== "string" || !g.veri || g.veri.length > EN_BUYUK) return cikti({ hata: "boyut" });
    const bayt = Utilities.base64Decode(g.veri);
    // Yalnız JPEG (tarayıcı her görseli JPEG'e çeviriyor): başka dosya yüklenemesin.
    if (bayt.length < 3 || (bayt[0] & 0xff) !== 0xff || (bayt[1] & 0xff) !== 0xd8) return cikti({ hata: "tur" });
    const ad = String(g.ad || "gorsel.jpg").replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
    const tarih = Utilities.formatDate(new Date(), "Europe/Istanbul", "yyyy-MM-dd_HHmm");
    const dosya = kisiKlasoru(g.kisi, kullanici).createFile(Utilities.newBlob(bayt, "image/jpeg", tarih + "_" + ad));
    dosya.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return cikti({ id: dosya.getId() });
  } catch (x) {
    return cikti({ hata: String(x).slice(0, 200) });
  }
}

// Oturum belgesi Plannersflow'un Firebase projesinin mi: Google'ın kendi ucuna sorulur.
function dogrula(belge) {
  if (typeof belge !== "string" || belge.length < 100) return null;
  const r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_ANAHTARI, {
    method: "post",
    contentType: "application/json",
    headers: { Referer: "https://plannersflow.net/" },
    payload: JSON.stringify({ idToken: belge }),
    muteHttpExceptions: true,
  });
  if (r.getResponseCode() !== 200) return null;
  const u = JSON.parse(r.getContentText()).users;
  return u && u[0] ? u[0] : null;
}

// Kişi başına klasör: adı kişinin adı; aynı adlı iki kişi karışmasın diye kimlik açıklamada.
function kisiKlasoru(kisi, kullanici) {
  const kok = klasorBul(DriveApp.getRootFolder(), KOK_KLASOR, null);
  const ad = String((kisi && kisi.ad) || kullanici.email || "Bilinmeyen").replace(/[\\/]/g, "_").slice(0, 80);
  return klasorBul(kok, ad, kullanici.localId);
}

function klasorBul(ust, ad, kimlik) {
  const l = ust.getFoldersByName(ad);
  while (l.hasNext()) {
    const k = l.next();
    if (!kimlik || k.getDescription() === kimlik) return k;
  }
  const yeni = ust.createFolder(ad);
  if (kimlik) yeni.setDescription(kimlik);
  return yeni;
}

function cikti(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
```

## Cowork için prompt

> Google hesabımda (Drive'ın sahibi olan hesap) yeni bir Google Apps Script projesi
> oluştur, adı "Plannersflow görselleri" olsun. `Code.gs`'in içeriğini aşağıdaki kodla
> değiştir (kodu olduğu gibi yapıştır, değiştirme). Sonra "Deploy → New deployment"
> ile tür olarak "Web app" seç; "Execute as: Me", "Who has access: Anyone" olsun ve
> yayınla. Google izin isterse (Drive'a erişim ve dış istek) onayla. Yayınlanınca
> verilen ve `/exec` ile biten "Web app URL"ini bana ver. Drive'da kök klasörde
> "Plannersflow · Öneri görselleri" klasörü ilk yüklemede kendiliğinden açılacak,
> önceden açma. Kod: (yukarıdaki Code.gs)

Adres gelince Ayarlar › "Öneri görselleri (Google Drive)" kartına yapıştırılıp
kaydedilir. Kod değişirse "Manage deployments"tan aynı dağıtımın yeni sürümü
yayınlanır; adres değişmez.
