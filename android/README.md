# Plannersflow Android uygulaması

Chrome'un tam ekran kipiyle (Trusted Web Activity, `androidbrowserhelper`)
https://plannersflow.net. Adres çubuğu çıkmaz, çünkü site
`public/.well-known/assetlinks.json`'da bu uygulamanın imza parmak izini yayınlıyor.
Bildirim, oturum ve dosya yükleme Chrome'unki; site güncellenince uygulama da
güncel (APK'yı yeniden dağıtmak gerekmez).

İndirme: https://plannersflow.net/indir/plannersflow.apk (derleme `docs/indir/`).

## Derleme

İmza anahtarı repoda değil (repo herkese açık). Anahtar dosyası ve şifresi yöneticide;
aynı anahtarla imzalanmayan sürüm, kurulu uygulamanın üstüne kurulmaz ve
assetlinks'teki parmak izi tutmadığı için adres çubuğu geri gelir.

```
echo "sdk.dir=/yol/android-sdk" > local.properties
PF_ANAHTAR=/yol/plannersflow.keystore PF_ANAHTAR_SIFRE=… gradle assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../public/indir/plannersflow.apk
```

Sürüm yükseltilirken `app/build.gradle`'da `versionCode` artırılır.
