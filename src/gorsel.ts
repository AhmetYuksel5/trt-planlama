import { GERCEK, firebaseYukle } from "./kip";
import type { OneriGorseli } from "./veri";

/*
 * Öneri görselleri (kullanıcı: muhabir öneriye görsel ekleyebilsin; Cloudflare'in
 * kotası patlamasın, Drive'da kişi adına klasörde toplansın).
 *
 * Yol: tarayıcı görseli küçültür (en uzun kenar 1600, JPEG), kişinin Firebase
 * oturum belgesiyle kurumun Apps Script web uygulamasına gönderir; betik belgeyi
 * Google'da doğrular, dosyayı "Plannersflow · Öneri görselleri / <kişi>" klasörüne
 * yazar, bağlantıyla görülebilir yapar ve kimliğini döndürür. Kapıya (Cloudflare)
 * hiç uğramaz. Betiğin kodu `belgeler/gorsel-apps-script.md`.
 *
 * Demoda Drive yok: küçük görselin kendisi kayıtta (yalnız bu tarayıcıda).
 */

const yukle = (dosya: File) =>
  new Promise<HTMLImageElement>((tamam, hata) => {
    const u = URL.createObjectURL(dosya);
    const r = new Image();
    r.onload = () => (URL.revokeObjectURL(u), tamam(r));
    r.onerror = () => (URL.revokeObjectURL(u), hata(new Error("gorsel")));
    r.src = u;
  });

/* Telefonun 12 MP fotoğrafı 4–6 MB; 1600 pikselde ~300 KB: Drive'ı ve muhabirin verisini yormasın. */
export const kucult = async (dosya: File, kenar: number, kalite: number): Promise<string> => {
  const r = await yukle(dosya);
  const o = Math.min(1, kenar / Math.max(r.naturalWidth, r.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(r.naturalWidth * o);
  c.height = Math.round(r.naturalHeight * o);
  c.getContext("2d")!.drawImage(r, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", kalite);
};

export type GorselSonucu = { tamam: true; gorsel: OneriGorseli } | { tamam: false; hata: string };

export const gorselYukle = async (dosya: File, adres: string | undefined, kisi: { id: string; ad: string }): Promise<GorselSonucu> => {
  if (!dosya.type.startsWith("image/")) return { tamam: false, hata: "tur" };
  if (!GERCEK) {
    try {
      return { tamam: true, gorsel: { id: `demo-${Math.random().toString(36).slice(2, 10)}`, ad: dosya.name, veri: await kucult(dosya, 640, 0.7) } };
    } catch {
      return { tamam: false, hata: "gorsel" };
    }
  }
  if (!adres) return { tamam: false, hata: "adres" };
  let veri: string;
  try {
    veri = await kucult(dosya, 1600, 0.82);
  } catch {
    return { tamam: false, hata: "gorsel" };
  }
  const belge = await (await firebaseYukle()).oturumBelgesi().catch(() => null);
  if (!belge) return { tamam: false, hata: "oturum" };
  try {
    // text/plain: Apps Script ön uçuş (OPTIONS) isteğini karşılamıyor; basit istek olarak gider.
    const r = await fetch(adres, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ belge, kisi, ad: dosya.name.replace(/\.[^.]+$/, "") + ".jpg", veri: veri.replace(/^data:image\/jpeg;base64,/, "") }),
    });
    const j = (await r.json().catch(() => null)) as { id?: string; hata?: string } | null;
    if (!j?.id) return { tamam: false, hata: j?.hata ?? `HTTP ${r.status}` };
    return { tamam: true, gorsel: { id: j.id, ad: dosya.name } };
  } catch {
    return { tamam: false, hata: "baglanti" };
  }
};

/* Drive'daki görselin küçük ve tam hali; dosya "bağlantıya sahip olan görüntüler" ile paylaşılıyor. */
export const gorselAdresi = (g: OneriGorseli, boy = 640) => g.veri ?? `https://drive.google.com/thumbnail?id=${encodeURIComponent(g.id)}&sz=w${boy}`;
export const gorselSayfasi = (g: OneriGorseli) => (g.veri ? g.veri : `https://drive.google.com/file/d/${encodeURIComponent(g.id)}/view`);
