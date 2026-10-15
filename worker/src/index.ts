import { ayarBirlestir, bosAyar, gorunur, OZELLIKLER, ozellikSaglayicisi, type Ayar, type Ozellik } from "./ayar.ts";
import { googleAnahtarlari, oturumuDogrula, type AnahtarBul, type Kimlik } from "./dogrula.ts";
import { istekKur, sonucCoz } from "./ozellikler.ts";
import { cagir, modelleriGetir } from "./saglayici.ts";

/*
 * Plannersflow yapay zeka kapısı. Veritabanı Firebase'de kalıyor; bu Worker
 * yalnız sağlayıcı anahtarını saklıyor ve isteği iletiyor:
 *   GET  /durum      kişinin kullanabildiği özellikler ve bugün kalan hakkı
 *   POST /calistir   {ozellik, girdi} → {sonuc, kalan}; sonuç kısaltmada metin, öbürlerinde alanlı nesne
 *   GET  /ayar       (tam yönetici) ayar, anahtarsız; bugünkü kullanım
 *   PUT  /ayar       (tam yönetici) ayarı yaz
 *   POST /dene       (tam yönetici) {saglayici} kısa deneme çağrısı
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
}

interface Kisi {
  kimlik: Kimlik;
  birim: string;
  yonetici: boolean;
}

const AYAR_ANAHTARI = "ayar";

const ayarOku = async (env: Env): Promise<Ayar> => {
  const ham = await env.YZ.get(AYAR_ANAHTARI);
  return ham ? (JSON.parse(ham) as Ayar) : bosAyar();
};

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
  let birim = "";
  try {
    birim = String((JSON.parse(f.j?.stringValue ?? "{}") as { birim?: unknown }).birim ?? "");
  } catch {
    /* bozuk kayıt: birimsiz */
  }
  return { kimlik, birim, yonetici: f.hesapYoneticisi?.booleanValue === true };
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
    if (!s.tamam) return yanit({ hata: s.hata }, 502);
    // Alanlı sonuç beklenen biçimde değilse kullanılamaz: hak düşmesin.
    const sonuc = sonucCoz(ozellik, s.metin);
    if (sonuc === null) return yanit({ hata: "bos" }, 502);
    // Sayaç yalnız başarılı çağrıda artıyor; KV anlık tutarlı değil, sınır kaba bir koruma.
    await env.YZ.put(kAnahtar, String(kullanilan + 1), { expirationTtl: IKI_GUN });
    const tAnahtar = toplamAnahtari(bugun, ozellik);
    await env.YZ.put(tAnahtar, String((await sayiOku(env, tAnahtar)) + 1), { expirationTtl: 30 * 86400 });
    return yanit({ sonuc, kalan: Math.max(0, sinir - kullanilan - 1) });
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
      const g = (await req.json().catch(() => null)) as { saglayici?: string; tur?: string; adres?: string; anahtar?: string } | null;
      const kayitli = ayar.saglayicilar.find((x) => x.id === g?.saglayici);
      const tur = (g?.tur ?? kayitli?.tur) as "anthropic" | "openai" | undefined;
      const anahtar = (typeof g?.anahtar === "string" && g.anahtar.trim()) || kayitli?.anahtar;
      if ((tur !== "anthropic" && tur !== "openai") || !anahtar) return yanit({ hata: "anahtar" }, 400);
      let adres: string | undefined;
      if (tur === "openai") {
        adres = String(g?.adres ?? kayitli?.adres ?? "").trim().replace(/\/+$/, "");
        // Anahtar düz metin bağlantıda ya da yanlış biçimli adrese gitmesin.
        if (!/^https:\/\/[^\s/]+/.test(adres)) return yanit({ hata: "adres" }, 400);
      }
      const r = await modelleriGetir(tur, adres, anahtar, d.fetch);
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
  fetch: (req: Request, env: Env) => isle(req, env, { fetch: (...a) => fetch(...a), simdi: Date.now, anahtarBul: googleAnahtarlari((...a) => fetch(...a), Date.now) }),
};
