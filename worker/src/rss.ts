/*
 * Gündem takibinin haber akışları (RSS 2.0 ve Atom). Tarayıcı haber
 * sitelerinin akışını doğrudan okuyamıyor (siteler başka kökene izin
 * vermiyor); kapı okuyup düz listeye çeviriyor. Kitaplıksız: Worker küçük
 * kalsın, akışların ihtiyacı başlık, bağlantı, tarih ve kısa özet.
 */

export interface AkisOgesi {
  baslik: string;
  baglanti: string;
  zaman?: string;
  ozet?: string;
  /**
   * Haberin asıl yayıncısı (`<source>`): toplayıcı akışlarda (Google Haberler)
   * her haber başka siteden; gündem takibi farklı kaynak sayısıyla ağırlık veriyor.
   */
  kaynak?: string;
}

const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const varliklar = (s: string) =>
  s
    .replace(/&#(x?)([0-9a-f]+);/gi, (_, x: string, n: string) => {
      const k = parseInt(n, x ? 16 : 10);
      return Number.isFinite(k) && k > 0 && k < 0x110000 ? String.fromCodePoint(k) : " ";
    })
    .replace(/&([a-z]+);/gi, (t, a: string) => VARLIK[a.toLowerCase()] ?? t);

/*
 * CDATA'yı aç, etiketleri at, varlıkları çöz: ekrana düz metin gitsin, akıştan
 * HTML sızmasın. Özet çoğu akışta kaçışlı HTML ("&lt;p&gt;"): bir kez çözülüp
 * etiketleri atılıyor, sonra kalan varlıklar ("&amp;amp;") ikinci kez çözülüyor.
 */
export const duzMetin = (s: string) =>
  varliklar(varliklar(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ")).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const etiket = (blok: string, ad: string) => {
  const m = blok.match(new RegExp(`<${ad}(?:\\s[^>]*)?>([\\s\\S]*?)</${ad}>`, "i"));
  return m ? duzMetin(m[1]) : "";
};

/* Atom'da bağlantı öznitelikte; "alternate" ya da relsiz olan haberin kendisi. */
const atomBaglanti = (blok: string) => {
  for (const m of blok.matchAll(/<link\b([^>]*)\/?>/gi)) {
    const oz = m[1];
    const rel = oz.match(/rel=["']([^"']+)["']/i)?.[1];
    const href = oz.match(/href=["']([^"']+)["']/i)?.[1];
    if (href && (!rel || rel === "alternate")) return duzMetin(href);
  }
  return "";
};

const tarih = (s: string) => {
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
};

/* Yalnız http(s) bağlantı: akış "javascript:" gibi bir adres koysa ekrana tıklanır bağlantı olarak gitmesin. */
const guvenliBaglanti = (s: string) => (/^https?:\/\//i.test(s) ? s : "");

export const akisCoz = (xml: string, enCok = 40): AkisOgesi[] => {
  const ogeler: AkisOgesi[] = [];
  const bloklar = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => ({ b: m[0], atom: false }));
  if (!bloklar.length) bloklar.push(...[...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => ({ b: m[0], atom: true })));
  for (const { b, atom } of bloklar.slice(0, enCok)) {
    const kaynak = etiket(b, "source").slice(0, 100);
    let baslik = etiket(b, "title");
    // Toplayıcı başlığın sonuna yayıncıyı ekliyor ("… - Reuters"); başlık her akışta aynı kalsın, olaylar birleşsin.
    if (kaynak && baslik.endsWith(` - ${kaynak}`)) baslik = baslik.slice(0, -(kaynak.length + 3)).trim();
    const baglanti = guvenliBaglanti(atom ? atomBaglanti(b) : etiket(b, "link") || etiket(b, "guid"));
    if (!baslik || !baglanti) continue;
    const zaman = tarih(etiket(b, "pubDate") || etiket(b, "published") || etiket(b, "updated") || etiket(b, "dc:date"));
    const ozet = (etiket(b, "description") || etiket(b, "summary") || etiket(b, "content")).slice(0, 400);
    ogeler.push({ baslik: baslik.slice(0, 300), baglanti, ...(zaman ? { zaman } : {}), ...(ozet ? { ozet } : {}), ...(kaynak ? { kaynak } : {}) });
  }
  return ogeler;
};

/* Kapının okuyacağı adres: yalnız https, kullanıcı bilgisi ve iç ağ adı yok. */
export const akisAdresiGecerli = (a: unknown): a is string => {
  if (typeof a !== "string" || a.length > 500) return false;
  try {
    const u = new URL(a);
    return u.protocol === "https:" && !u.username && !u.password && u.hostname.includes(".") && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname);
  } catch {
    return false;
  }
};
