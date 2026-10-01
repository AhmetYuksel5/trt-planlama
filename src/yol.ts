import { useEffect, useState } from "react";

/**
 * Adres çubuğundaki `#/nextday/nd-yarin/cikti` ile açık sayfayı eşler.
 *
 * Kütüphane yerine adresin kendisi: GitHub Pages alt klasörden sunuyor,
 * `#` sonrası sunucuya gitmediği için her sayfa tazelenince yerinde
 * açılıyor; tarayıcının geri tuşu da bedavaya çalışıyor. Bağlantı
 * paylaşılınca karşı taraf aynı kaydı açıyor (yetkisi varsa).
 */
export interface Yol {
  sayfa: string;
  id?: string;
  alt?: string;
}

const cozumle = (): Yol => {
  const [sayfa = "", id, alt] = location.hash.replace(/^#\/?/, "").split("/");
  return {
    sayfa: sayfa || "ana",
    id: id ? decodeURIComponent(id) : undefined,
    alt: alt ? decodeURIComponent(alt) : undefined,
  };
};

export function useYol(): Yol {
  const [yol, ayarla] = useState<Yol>(cozumle);
  useEffect(() => {
    const dinle = () => {
      ayarla(cozumle());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", dinle);
    return () => window.removeEventListener("hashchange", dinle);
  }, []);
  return yol;
}

export const git = (yol: string) => {
  location.hash = `#/${yol}`;
};
