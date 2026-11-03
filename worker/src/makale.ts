import { duzMetin } from "./rss.ts";

/*
 * Haberin tam metni: akış yalnız başlık ve kısa özet veriyor, editör ayrıntı için
 * siteye gidip dönüyordu. Sayfanın gövdesinden paragraflar çıkarılıyor (tarayıcının
 * okuma kipi gibi); reklam, menü ve betik atılıyor. Kitaplıksız: Workers'ta DOM yok.
 */
export interface Makale {
  adres: string;
  site: string;
  baslik: string;
  paragraflar: string[];
}

const AT = /<(script|style|noscript|svg|nav|header|footer|aside|form|figure|iframe|button|template)\b[\s\S]*?<\/\1>/gi;

const meta = (html: string, ad: string) => {
  const r = new RegExp(`<meta[^>]+(?:property|name)=["']${ad}["'][^>]*>`, "i").exec(html)?.[0];
  return r ? duzMetin(/content=["']([^"']*)["']/i.exec(r)?.[1] ?? "") : "";
};

export const makaleCoz = (html: string, adres: string): Makale => {
  const temiz = html.replace(/<!--[\s\S]*?-->/g, "").replace(AT, " ");
  // Önce <article>: sayfadaki öbür haberlerin özetleri (yan sütun) karışmasın.
  const makaleler = [...temiz.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => m[0]);
  const paragraflari = (s: string) => [...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => duzMetin(m[1]).replace(/\s+/g, " ").trim());
  let bolge = makaleler.sort((a, b) => paragraflari(b).length - paragraflari(a).length)[0];
  if (!bolge || paragraflari(bolge).filter((p) => p.length >= 40).length < 2) bolge = temiz;
  const gorulen = new Set<string>();
  const paragraflar = paragraflari(bolge)
    .filter((p) => p.length >= 40 && !gorulen.has(p) && (gorulen.add(p), true))
    .slice(0, 60)
    .map((p) => p.slice(0, 2000));
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(temiz)?.[1];
  const baslik = meta(html, "og:title") || (h1 ? duzMetin(h1).trim() : "") || duzMetin(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").trim();
  return { adres, site: new URL(adres).hostname.replace(/^www\./, ""), baslik: baslik.slice(0, 300), paragraflar };
};

/*
 * Google Haberler bağlantısı yönlendirme sayfası; asıl adres sayfanın içinde
 * (data-n-au) ya da kanonik bağlantıda. Bulunamazsa boş: ekran özeti gösterir.
 */
export const yonlendirmeCoz = (html: string): string => {
  const aday = /data-n-au=["']([^"']+)["']/i.exec(html)?.[1] ?? /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1] ?? "";
  try {
    const u = new URL(duzMetin(aday).trim());
    return u.protocol === "https:" && !u.hostname.endsWith("news.google.com") ? u.toString() : "";
  } catch {
    return "";
  }
};
