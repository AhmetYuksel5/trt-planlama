import { defineConfig } from "vite";
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
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
