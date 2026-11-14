import { useCallback, useState } from "react";

/*
 * Yazılan metin taslak olarak kalır (aşama kutuları, brifing 4. bölüm): kutu
 * kapanınca, sayfadan çıkınca ya da başkası kaydedince yarım düzeltme
 * gitmesin. Tarayıcıda, kişiye değil cihaza bağlı; gönderilince silinir.
 */
const ON = "trt-planlama-taslak:";

const oku = (anahtar: string): string | null => {
  try {
    return localStorage.getItem(ON + anahtar);
  } catch {
    return null;
  }
};

export function useMetinTaslagi(anahtar: string, ilk: string): [string, (v: string) => void, () => void] {
  const [deger, setDeger] = useState(() => oku(anahtar) ?? ilk);
  const degistir = useCallback(
    (v: string) => {
      setDeger(v);
      try {
        // Kayıttakiyle aynı metin taslak değil.
        if (v === ilk) localStorage.removeItem(ON + anahtar);
        else localStorage.setItem(ON + anahtar, v);
      } catch {
        /* Gizli pencerede depo yok: taslak yalnız bellekte. */
      }
    },
    [anahtar, ilk],
  );
  const temizle = useCallback(() => {
    try {
      localStorage.removeItem(ON + anahtar);
    } catch {
      /* yok */
    }
  }, [anahtar]);
  return [deger, degistir, temizle];
}
