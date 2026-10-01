import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/*
 * Kaynak kökte, çıktı `docs/` altında ve depoda.
 *
 * GitHub Pages bu depodaki `docs/` klasörünü olduğu gibi sunuyor, derleme
 * yapmıyor; çıktıyı depoya koyunca yayınlamak "gönder ve bitti" kalıyor.
 * Site kurum içi bir sunucuya taşındığında aynı çıktı kök klasöre konur
 * ve yalnız `base` değişir.
 */
export default defineConfig({
  plugins: [react()],
  base: "/trt-planlama/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
