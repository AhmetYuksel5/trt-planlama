import { ayarBirlestir, bosAyar, gorunur, OZELLIKLER, ozellikSaglayicisi, type Ayar, type Ozellik } from "./ayar.ts";
import { googleAnahtarlari, oturumuDogrula, type AnahtarBul, type Kimlik } from "./dogrula.ts";
import { istekKur, sonucCoz } from "./ozellikler.ts";
import { makaleCoz, yonlendirmeCoz, type Makale } from "./makale.ts";
import { akisAdresiGecerli, akisCoz, telegramCoz, telegramKanali, type AkisOgesi } from "./rss.ts";
import { cagir, modelleriGetir } from "./saglayici.ts";
import { cfBaglan, grubaUygun, postalariCekOtomatik, type EwsMesaj } from "./ews.ts";
import { bosPostaAyar, postaAyarBirlestir, postaGorunur, type PostaAyar } from "./posta-ayar.ts";

/*
 * Plannersflow yapay zeka kapısı. Veritabanı Firebase'de kalıyor; bu Worker
 * yalnız sağlayıcı anahtarını saklıyor ve isteği iletiyor:
 *   GET  /durum      kişinin kullanabildiği özellikler ve bugün kalan hakkı
 *   POST /calistir   {ozellik, girdi} → {sonuc, kalan}; sonuç kısaltmada metin, öbürlerinde alanlı nesne
 *   GET  /ayar       (tam yönetici) ayar, anahtarsız; bugünkü kullanım
 *   PUT  /ayar       (tam yönetici) ayarı yaz
 *   POST /dene       (tam yönetici) {saglayici} kısa deneme çağrısı
 *   POST /rss        (tam yönetici ve paylaştığı birim/kişi)
 *   POST /makale     (aynı kişiler) {adres} → {makale: {adres, site, baslik, paragraflar}}; okuma penceresi {adresler} → {akislar: [{adres, ogeler|hata}]}; gündem takibinin akışları
 * Kişinin kim olduğu Firebase oturum belgesinden, yetkisi kişi kaydından
 * (Firestore, kişinin kendi oturumuyla okunuyor; tam yöneticilik alanını
 * kurallar koruyor).
 */

interface KV {
  get(k: string): Promise<string | null>;
  put(k: string, v: string, o?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  YZ: KV;
  FIREBASE_PROJE: string;
  /** Virgüllü köken listesi; tarayıcıdan yalnız bunlar çağırabiliyor. */
  KOKENLER: string;
}

export interface Bagimlilik {
  fetch: typeof fetch;
  simdi: () => number;
  anahtarBul: AnahtarBul;
  /** Deneme: emülatördeki Firestore'un kökü. */
  firestoreKoku?: string;
  /** Akış önbelleği (gündem takibi); yoksa önbelleksiz okunur. */
  onbellek?: Onbellek;
}

export interface Onbellek {
  get(k: string): Promise<string | null>;
  put(k: string, v: string, saniye: number): Promise<void>;
}

/*
 * Akışlar KV'de değil Cloudflare'in önbelleğinde (Cache API): ücretsiz planda
 * KV'ye günde 1000 yazma var, her taramada 60'ı aşkın akış yazılıyordu; gün
 * boyu açık sayfa öğlene doğru sınırı dolduruyor, yapay zeka sayaçları da
 * yazamıyordu. Önbellek sınırsız ve bölgesel; kaçırırsa akış yeniden okunur.
 */
const cacheOnbellegi = (): Onbellek | undefined => {
  const c = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (!c) return undefined;
  const anahtar = (k: string) => new Request(`https://onbellek.plannersflow.net/${encodeURIComponent(k)}`);
  return {
    get: async (k) => (await c.match(anahtar(k)))?.text() ?? null,
    put: (k, v, saniye) => c.put(anahtar(k), new Response(v, { headers: { "cache-control": `max-age=${saniye}`, "content-type": "application/json" } })),
  };
};

interface Kisi {
  kimlik: Kimlik;
  birim: string;
  yonetici: boolean;
  /** Dış muhabir ya da onay bekleyen: gündem paylaşılmaz (src/yetki.ts → kisitliKisi). */
  kisitli: boolean;
}

const AYAR_ANAHTARI = "ayar";
const POSTA_AYAR_ANAHTARI = "posta-ayar";

const ayarOku = async (env: Env): Promise<Ayar> => {
  const ham = await env.YZ.get(AYAR_ANAHTARI);
  return ham ? (JSON.parse(ham) as Ayar) : bosAyar();
};

const postaAyarOku = async (env: Env): Promise<PostaAyar> => {
  const ham = await env.YZ.get(POSTA_AYAR_ANAHTARI);
  return ham ? ({ ...bosPostaAyar(), ...(JSON.parse(ham) as PostaAyar) }) : bosPostaAyar();
};

/* EWS mesajını tarayıcının postaIsle'sine uygun biçime indirger; gövde temizliğini istemci de yapıyor (tek kaynak). */
const postaDisa = (m: EwsMesaj) => ({ kimden: m.kimden, kimdenAd: m.kimdenAd, konu: m.konu, metin: m.tamMetin, zaman: m.zaman, mesajKimligi: m.mesajKimligi, konuKimligi: m.konuKimligi, ekler: m.ekler });

/* Gün İstanbul saatiyle dönüyor: haber merkezinin günü. */
const gun = (simdi: number) => new Date(simdi + 3 * 3600_000).toISOString().slice(0, 10);
const kullanimAnahtari = (g: string, uid: string, o: string) => `kullanim:${g}:${o}:${uid}`;
const toplamAnahtari = (g: string, o: string) => `toplam:${g}:${o}`;
const sayiOku = async (env: Env, k: string) => Number((await env.YZ.get(k)) ?? 0) || 0;
const IKI_GUN = 2 * 86400;

/* Okunamazsa nedeni metin olarak döner (Firestore'un durumu ve iletisi): kişi neden tanınmadığını görsün. */
const kisiOku = async (belge: string, kimlik: Kimlik, env: Env, d: Bagimlilik): Promise<Kisi | string> => {
  const kok = d.firestoreKoku ?? "https://firestore.googleapis.com";
  const r = await d.fetch(`${kok}/v1/projects/${env.FIREBASE_PROJE}/databases/(default)/documents/kisiler/${encodeURIComponent(kimlik.uid)}`, {
    headers: { authorization: `Bearer ${belge}` },
  });
  if (!r.ok) {
    const ham = await r.text().catch(() => "");
    let ileti = ham;
    try {
      ileti = String((JSON.parse(ham) as { error?: { message?: unknown } }).error?.message ?? ham);
    } catch {
      /* JSON değil */
    }
    return `firestore ${r.status} ${ileti}`.slice(0, 300);
  }
  const j = (await r.json()) as { fields?: Record<string, { booleanValue?: boolean; stringValue?: string }> };
  const f = j.fields ?? {};
  if (f.pasif?.booleanValue) return "pasif";
  // Birim önce düz alandan: kural onu j ile tutarlı tutuyor (firestore.rules → jTutarli); eski belgede j'den.
  let birim = f.birim?.stringValue ?? "";
  let bekliyor = false;
  try {
    const j = JSON.parse(f.j?.stringValue ?? "{}") as { birim?: unknown; kontrolBekliyor?: unknown };
    if (!birim) birim = String(j.birim ?? "");
    bekliyor = j.kontrolBekliyor === true;
  } catch {
    /* bozuk kayıt: birimsiz */
  }
  return { kimlik, birim, yonetici: f.hesapYoneticisi?.booleanValue === true, kisitli: birim === "muhabir" || bekliyor };
};

/*
 * Tam yönetici gündemi birime ya da kişiye paylaşabiliyor (genel ayar belgesi, gundemPaylasim).
 * Belgeyi kişinin kendi oturumuyla okuyoruz; paylaşımı kural yalnız tam yöneticiye yazdırıyor.
 */
type RestDeger = { stringValue?: string; arrayValue?: { values?: RestDeger[] }; mapValue?: { fields?: Record<string, RestDeger> } };
const gundemPaylasildi = async (belge: string, kisi: Kisi, env: Env, d: Bagimlilik): Promise<boolean> => {
  if (kisi.kisitli) return false;
  const kok = d.firestoreKoku ?? "https://firestore.googleapis.com";
  const r = await d.fetch(`${kok}/v1/projects/${env.FIREBASE_PROJE}/databases/(default)/documents/ayar/genel`, {
    headers: { authorization: `Bearer ${belge}` },
  });
  if (!r.ok) return false;
  const j = (await r.json().catch(() => ({}))) as { fields?: Record<string, RestDeger> };
  const p = j.fields?.gundemPaylasim?.mapValue?.fields ?? {};
  const liste = (x?: RestDeger) => (x?.arrayValue?.values ?? []).map((v) => v.stringValue ?? "");
  return liste(p.kisiler).includes(kisi.kimlik.uid) || liste(p.birimler).includes(kisi.birim);
};

const json = (govde: unknown, durum: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { "content-type": "application/json; charset=utf-8", ...cors } });

export const isle = async (req: Request, env: Env, d: Bagimlilik): Promise<Response> => {
  const koken = req.headers.get("origin") ?? "";
  const izinli = env.KOKENLER.split(",").map((x) => x.trim()).filter(Boolean);
  const cors: Record<string, string> = izinli.includes(koken)
    ? { "access-control-allow-origin": koken, "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST, PUT, OPTIONS", "access-control-max-age": "86400", vary: "origin" }
    : {};
  if (req.method === "OPTIONS") return new Response(null, { status: izinli.includes(koken) ? 204 : 403, headers: cors });
  const yanit = (g: unknown, s = 200) => json(g, s, cors);
  /*
   * Beklenmeyen hata (KV yazışı reddedildi, kayıt bozuk…) da izin başlığıyla
   * ve nedeniyle dönüyor: Cloudflare'in kendi 500'ünde başlık yok, tarayıcı
   * yanıtı okuyamıyor, ekran yalnız "kapıya ulaşılamadı" diyordu.
   */
  try {
    return await isleIc(req, env, d, yanit);
  } catch (e) {
    return yanit({ hata: "kapi", ayrinti: String(e instanceof Error ? e.message : e).slice(0, 300) }, 500);
  }
};

const isleIc = async (req: Request, env: Env, d: Bagimlilik, yanit: (g: unknown, s?: number) => Response): Promise<Response> => {

  const belge = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const kimlik = belge ? await oturumuDogrula(belge, env.FIREBASE_PROJE, d.anahtarBul, d.simdi()).catch(() => null) : null;
  if (!kimlik) return yanit({ hata: "oturum" }, 401);
  const kisi = await kisiOku(belge, kimlik, env, d).catch((e: unknown) => `istisna ${String(e)}`.slice(0, 300));
  if (typeof kisi === "string") return yanit({ hata: "kisi", ayrinti: kisi }, 403);

  const yol = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
  const bugun = gun(d.simdi());
  const ayar = await ayarOku(env);

  if (req.method === "GET" && yol === "/durum") {
    const ozellikler: Record<string, { kalan: number; sinir: number }> = {};
    for (const o of OZELLIKLER) {
      if (!ozellikSaglayicisi(ayar, o, kisi.birim, kisi.yonetici)) continue;
      const sinir = ayar.ozellikler[o].gunlukSinir;
      ozellikler[o] = { sinir, kalan: Math.max(0, sinir - (await sayiOku(env, kullanimAnahtari(bugun, kisi.kimlik.uid, o)))) };
    }
    return yanit({ ozellikler, yonetici: kisi.yonetici });
  }

  if (req.method === "POST" && yol === "/calistir") {
    const g = (await req.json().catch(() => null)) as { ozellik?: string; girdi?: unknown } | null;
    const ozellik = g?.ozellik as Ozellik;
    if (!OZELLIKLER.includes(ozellik)) return yanit({ hata: "ozellik" }, 400);
    const saglayici = ozellikSaglayicisi(ayar, ozellik, kisi.birim, kisi.yonetici);
    if (!saglayici) return yanit({ hata: "kapali" }, 403);
    const istek = istekKur(ozellik, g?.girdi, ayar.ozellikler[ozellik]);
    if (!istek) return yanit({ hata: "girdi" }, 400);
    const kAnahtar = kullanimAnahtari(bugun, kisi.kimlik.uid, ozellik);
    const kullanilan = await sayiOku(env, kAnahtar);
    const sinir = ayar.ozellikler[ozellik].gunlukSinir;
    if (kullanilan >= sinir) return yanit({ hata: "gunlukSinir", kalan: 0 }, 429);
    const s = await cagir(saglayici, istek, d.fetch);
    if (!s.tamam) return yanit({ hata: s.hata, ...(s.hata === "arama" ? { ayrinti: s.ayrinti } : {}) }, 502);
    // Alanlı sonuç beklenen biçimde değilse kullanılamaz: hak düşmesin.
    const sonuc = sonucCoz(ozellik, s.metin, s.kaynaklar);
    if (sonuc === null) return yanit({ hata: "bos" }, 502);
    // Sayaç yalnız başarılı çağrıda artıyor; KV anlık tutarlı değil, sınır kaba bir koruma.
    await env.YZ.put(kAnahtar, String(kullanilan + 1), { expirationTtl: IKI_GUN });
    const tAnahtar = toplamAnahtari(bugun, ozellik);
    await env.YZ.put(tAnahtar, String((await sayiOku(env, tAnahtar)) + 1), { expirationTtl: 30 * 86400 });
    return yanit({ sonuc, kalan: Math.max(0, sinir - kullanilan - 1) });
  }

  /*
   * Gündem takibi yalnız tam yöneticinin; adresleri o yazıyor. Akış 10 dakika
   * KV'de: birkaç sekme ya da yenileme aynı siteye tekrar tekrar gitmesin.
   */
  if (req.method === "POST" && yol === "/rss") {
    if (!kisi.yonetici && !(await gundemPaylasildi(belge, kisi, env, d).catch(() => false))) return yanit({ hata: "yetki" }, 403);
    const g = (await req.json().catch(() => null)) as { adresler?: unknown } | null;
    const adresler = Array.isArray(g?.adresler) ? [...new Set(g.adresler.filter(akisAdresiGecerli))].slice(0, 40) : [];
    if (!adresler.length) return yanit({ hata: "girdi" }, 400);
    const akislar = await Promise.all(
      adresler.map(async (adres): Promise<{ adres: string; ogeler?: AkisOgesi[]; hata?: string }> => {
        const kAnahtar = `rss:${adres}`;
        const onbellek = await d.onbellek?.get(kAnahtar).catch(() => null);
        if (onbellek) return { adres, ogeler: JSON.parse(onbellek) as AkisOgesi[] };
        try {
          const r = await d.fetch(adres, { headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml", "user-agent": "Plannersflow/1.0 (+https://plannersflow.net)" }, signal: AbortSignal.timeout(8000) });
          if (!r.ok) return { adres, hata: `http ${r.status}` };
          const metin = (await r.text()).slice(0, 2_000_000);
          const kanal = telegramKanali(adres);
          const ogeler = kanal ? telegramCoz(metin, kanal) : akisCoz(metin);
          if (!ogeler.length) return { adres, hata: "bos" };
          // Önbelleğe yazılamasa da haberler döner: önce yazış reddedilince akışın haberleri de düşüyordu.
          await d.onbellek?.put(kAnahtar, JSON.stringify(ogeler), 600).catch(() => {});
          return { adres, ogeler };
        } catch (e) {
          return { adres, hata: String(e instanceof Error ? e.message : e).slice(0, 120) };
        }
      }),
    );
    return yanit({ akislar });
  }

  /*
   * Haberin tam metni (okuma penceresi): yalnız kişi habere basınca, tek adres.
   * Aynı haber 10 dakika önbellekte; tam metin kayda girmez, ekranda okunur.
   */
  if (req.method === "POST" && yol === "/makale") {
    if (!kisi.yonetici && !(await gundemPaylasildi(belge, kisi, env, d).catch(() => false))) return yanit({ hata: "yetki" }, 403);
    const g = (await req.json().catch(() => null)) as { adres?: unknown } | null;
    if (!akisAdresiGecerli(g?.adres)) return yanit({ hata: "girdi" }, 400);
    const kAnahtar = `makale:${g.adres}`;
    const onbellek = await d.onbellek?.get(kAnahtar).catch(() => null);
    if (onbellek) return yanit({ makale: JSON.parse(onbellek) as Makale });
    const getir = async (adres: string) => {
      const r = await d.fetch(adres, { headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; Plannersflow/1.0; +https://plannersflow.net)" }, signal: AbortSignal.timeout(8000) });
      return { r, metin: r.ok ? (await r.text()).slice(0, 3_000_000) : "" };
    };
    try {
      let { r, metin } = await getir(g.adres);
      let son = r.url || g.adres;
      if (r.ok && new URL(son).hostname.endsWith("news.google.com")) {
        const asil = yonlendirmeCoz(metin);
        if (!asil) return yanit({ hata: "yonlendirme" }, 502);
        ({ r, metin } = await getir(asil));
        son = r.url || asil;
      }
      if (!r.ok) return yanit({ hata: `http ${r.status}` }, 502);
      const makale = makaleCoz(metin, son);
      if (!makale.paragraflar.length) return yanit({ hata: "bos" }, 502);
      await d.onbellek?.put(kAnahtar, JSON.stringify(makale), 600).catch(() => {});
      return yanit({ makale });
    } catch (e) {
      return yanit({ hata: String(e instanceof Error ? e.message : e).slice(0, 120) }, 502);
    }
  }

  /*
   * Posta köprüsü (EWS). Ayar ve bağlantı denemesi yalnız tam yöneticide;
   * postayı çekmeyi Planlama da yapabiliyor. Parola KV'de, tarayıcıya hiç
   * gelmiyor. Worker postayı Firestore'a kendi yazmıyor (servis hesabı
   * istemiyoruz): çektiğini döndürüyor, tarayıcı kişinin kendi oturumuyla
   * yazıyor (belgeler/eposta-entegrasyonu.md).
   */
  if (yol === "/posta/ayar" || yol === "/posta/dene") {
    if (!kisi.yonetici) return yanit({ hata: "yetki" }, 403);
    const pa = await postaAyarOku(env);
    if (req.method === "GET" && yol === "/posta/ayar") return yanit(postaGorunur(pa));
    if (req.method === "PUT" && yol === "/posta/ayar") {
      const r = postaAyarBirlestir(pa, await req.json().catch(() => null));
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await env.YZ.put(POSTA_AYAR_ANAHTARI, JSON.stringify(r.ayar));
      return yanit(postaGorunur(r.ayar));
    }
    if (req.method === "POST" && yol === "/posta/dene") {
      if (!pa.sunucu || !pa.kullanici || !pa.parola) return yanit({ hata: "eksikAyar" }, 400);
      const r = await postalariCekOtomatik({ sunucu: pa.sunucu, kullanici: pa.kullanici, parola: pa.parola, alan: pa.alan }, cfBaglan, d.simdi(), 10);
      if ("hata" in r) return yanit({ hata: "baglanti", ayrinti: r.hata.slice(0, 200) }, 502);
      return yanit({ tamam: true, sayi: r.mesajlar.filter((m) => grubaUygun(m, pa.grupAdresi)).length });
    }
  }

  if (req.method === "POST" && yol === "/posta/cek") {
    if (!(kisi.yonetici || kisi.birim === "planlama")) return yanit({ hata: "yetki" }, 403);
    const pa = await postaAyarOku(env);
    if (!pa.acik) return yanit({ hata: "kapali" }, 403);
    if (!pa.sunucu || !pa.kullanici || !pa.parola) return yanit({ hata: "eksikAyar" }, 400);
    const g = (await req.json().catch(() => null)) as { adet?: number } | null;
    const adet = Math.min(50, Math.max(1, Number(g?.adet) || 25));
    const r = await postalariCekOtomatik({ sunucu: pa.sunucu, kullanici: pa.kullanici, parola: pa.parola, alan: pa.alan }, cfBaglan, d.simdi(), adet);
    if ("hata" in r) return yanit({ hata: "baglanti", ayrinti: r.hata.slice(0, 200) }, 502);
    return yanit({ mesajlar: r.mesajlar.filter((m) => grubaUygun(m, pa.grupAdresi)).map(postaDisa) });
  }

  // Ayar yalnız tam yöneticide.
  if (yol === "/ayar" || yol === "/dene" || yol === "/modeller") {
    if (!kisi.yonetici) return yanit({ hata: "yetki" }, 403);
    if (req.method === "GET" && yol === "/ayar") {
      const kullanim: Record<string, number> = {};
      for (const o of OZELLIKLER) kullanim[o] = await sayiOku(env, toplamAnahtari(bugun, o));
      return yanit({ ...gorunur(ayar), kullanim });
    }
    if (req.method === "PUT" && yol === "/ayar") {
      const r = ayarBirlestir(ayar, await req.json().catch(() => null));
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await env.YZ.put(AYAR_ANAHTARI, JSON.stringify(r.ayar));
      return yanit(gorunur(r.ayar));
    }
    /*
     * Model listesi. Anahtar ya formda yeni yazılmış (henüz kaydedilmemiş,
     * yalnız bu istekte kullanılıyor, saklanmıyor) ya da kayıtlı sağlayıcınınki.
     */
    if (req.method === "POST" && yol === "/modeller") {
      const g = (await req.json().catch(() => null)) as { saglayici?: string; tur?: string; adres?: string; anahtar?: string; calismaAlani?: string } | null;
      const kayitli = ayar.saglayicilar.find((x) => x.id === g?.saglayici);
      const yeniAnahtar = typeof g?.anahtar === "string" ? g.anahtar.trim() : "";
      /*
       * Kayıtlı anahtar yalnız kayıtlı adrese ve türe gider: istekteki adres
       * kullanılsaydı yöneticinin oturumunu ele geçiren saklı anahtarı kendi
       * sunucusuna çektirebilirdi (ayarın KV'de durmasının amacı bu).
       */
      const tur = (yeniAnahtar ? (g?.tur ?? kayitli?.tur) : kayitli?.tur) as "anthropic" | "openai" | undefined;
      const anahtar = yeniAnahtar || kayitli?.anahtar;
      if ((tur !== "anthropic" && tur !== "openai") || !anahtar) return yanit({ hata: "anahtar" }, 400);
      let adres: string | undefined;
      if (tur === "openai") {
        adres = String((yeniAnahtar ? g?.adres : undefined) ?? kayitli?.adres ?? "").trim().replace(/\/+$/, "");
        // Anahtar düz metin bağlantıda ya da yanlış biçimli adrese gitmesin.
        if (!/^https:\/\/[^\s/]+/.test(adres)) return yanit({ hata: "adres" }, 400);
      }
      // Formdaki çalışma alanı henüz kaydedilmemiş olabilir; yoksa kayıtlıdaki.
      const calismaAlani = String(g?.calismaAlani ?? kayitli?.calismaAlani ?? "").trim();
      if (calismaAlani && !/^[A-Za-z0-9_-]{1,100}$/.test(calismaAlani)) return yanit({ hata: "calismaAlani" }, 400);
      const r = await modelleriGetir(tur, adres, anahtar, d.fetch, calismaAlani || undefined);
      return r.tamam ? yanit({ modeller: r.modeller }) : yanit({ hata: r.hata, ayrinti: r.ayrinti }, 502);
    }
    if (req.method === "POST" && yol === "/dene") {
      const g = (await req.json().catch(() => null)) as { saglayici?: string } | null;
      const s = ayar.saglayicilar.find((x) => x.id === g?.saglayici);
      if (!s?.anahtar) return yanit({ hata: "anahtar" }, 400);
      const r = await cagir(s, { sistem: "Reply with the single word: OK", kullanici: "ping", enCokCikti: 2000 }, d.fetch);
      return r.tamam ? yanit({ tamam: true }) : yanit({ hata: r.hata, ayrinti: r.ayrinti }, 502);
    }
  }
  return yanit({ hata: "yol" }, 404);
};

export default {
  fetch: (req: Request, env: Env) => isle(req, env, { fetch: (...a) => fetch(...a), simdi: Date.now, anahtarBul: googleAnahtarlari((...a) => fetch(...a), Date.now), onbellek: cacheOnbellegi() }),
};
