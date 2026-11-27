import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/*
 * Kaynak kökte, çıktı `docs/` altında ve depoda.
 *
 * GitHub Pages bu depodaki `docs/` klasörünü olduğu gibi sunuyor, derleme
 * yapmıyor; çıktıyı depoya koyunca yayınlamak "gönder ve bitti" kalıyor.
 * `base` göreli: sayfalar adres çubuğundaki `#` ile açıldığı için tek bir
 * index.html var ve varlıklar ona göre bulunuyor. Böylece depo adı
 * değişse de (trt-planlama → TRTArabiFlow) ya da site kurum içi bir sunucuya
 * taşınsa da yapılandırmaya dokunmak gerekmiyor.
 */
/*
 * Sürüm (kullanıcı: kullanıcılar sayfayı yenilemiyor, güncel sürüm onlara da gitsin):
 * her derlemenin kimliği uygulamaya gömülür ve `docs/surum.json`'a yazılır; açık
 * sayfa dosyayı arada bir okuyup farklıysa kendini yeniler (`src/surum.ts`).
 */
const SURUM = Date.now().toString(36);
const surumDosyasi = (): Plugin => ({
  name: "surum-dosyasi",
  apply: "build",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "surum.json", source: JSON.stringify({ surum: SURUM }) });
  },
});

export default defineConfig({
  plugins: [react(), surumDosyasi()],
  define: { __SURUM__: JSON.stringify(SURUM) },
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
