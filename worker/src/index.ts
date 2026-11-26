import { aboneCikar, aboneEkle, aboneleriOku, ayarOku as bildirimAyarOku, ayarYaz as bildirimAyarYaz, denemeYuku, gonder as bildirimGonder, pushAdresiUygun, vapidAl, yeniOneriYuku } from "./bildirim.ts";
import { ayarBirlestir, bosAyar, gorunur, OZELLIKLER, ozellikSaglayicisi, type Ayar, type Ozellik } from "./ayar.ts";
import { googleAnahtarlari, oturumuDogrula, type AnahtarBul, type Kimlik } from "./dogrula.ts";
import { istekKur, sonucCoz } from "./ozellikler.ts";
import { makaleCoz, yonlendirmeCoz, type Makale } from "./makale.ts";
import { akisAdresiGecerli, akisCoz, telegramCoz, telegramKanali, type AkisOgesi } from "./rss.ts";
import { asistanCagir, cagir, modelleriGetir } from "./saglayici.ts";
import { ARACLAR, asistanIstegiCoz, derinMi, sistemYonergesi } from "./asistan.ts";
import { cfBaglan, ekIndirOtomatik, grubaUygun, guvenliHtml, postalariCekOtomatik, postaGonderOtomatik, mesajKimligiGecerli, type EwsAyar, type EwsMesaj, type GidenPosta } from "./ews.ts";
import { bosOtoCagri, gecmiseEkle, gununKalemi, istanbulGunu, istanbulSaati, otoCagriBirlestir, otoCagriNormal, otoCagriGorunur, type OtoCagriAyar, type OtoCagriKaydi, type OtoCagriTuru } from "./oto-cagri.ts";
import { coz, sifrele, sifreliMi } from "./gizli.ts";
import { rotaAyarBirlestir, rotaAyarOku, rotaAyarYaz, rotaGorunur, rotaOku } from "./rota.ts";
import { bosPostaAyar, bosPostaKimlik, postaAyarBirlestir, postaGorunur, postaKimlikBirlestir, postaKimlikGorunur, type PostaAyar, type PostaKimlik } from "./posta-ayar.ts";

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
  /** Posta şifrelerinin anahtarı (gizli değer, gizli.ts); yoksa şifre düz saklanır. */
  POSTA_ANAHTARI?: string;
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

/* Otomatik çağrı (oto-cagri.ts): ayar ve gönderim geçmişi ayrı anahtarlarda; geçmişi yalnız zamanlayıcı yazıyor. */
const OTO_ANAHTARI = "oto-cagri";
const OTO_GECMIS_ANAHTARI = "oto-cagri-gecmis";
const otoOku = async (env: Env): Promise<OtoCagriAyar> => {
  const ham = await env.YZ.get(OTO_ANAHTARI);
  return ham ? otoCagriNormal(JSON.parse(ham)) : bosOtoCagri();
};
const otoGecmisOku = async (env: Env): Promise<OtoCagriKaydi[]> => JSON.parse((await env.YZ.get(OTO_GECMIS_ANAHTARI)) ?? "[]") as OtoCagriKaydi[];

/* Zamanlayıcının ifadesi wrangler.toml'dakiyle aynı: saatler ayarda, kapı 15 dakikada bir bakıyor. */
export const CRON_OTO = "*/15 * * * *";

export type Gonderici = (ayar: EwsAyar, g: GidenPosta) => Promise<{ tamam: true } | { hata: string; belirsiz?: boolean }>;

/*
 * Zamanlayıcının işi: saati gelmiş çağrıyı o günün göndereninin kimliğiyle
 * gönderir. Kime gönderenin grup adresi (planning); muhabirler BCC'de.
 * Gönderilmeyen (kimlik eksik, liste bayat, görevli yok ya da izin vermemiş, EWS hatası)
 * geçmişe nedeniyle yazılır.
 */
export const otoCagriCalistir = async (env: Env, simdi: number, tur: OtoCagriTuru, gonder: Gonderici): Promise<OtoCagriKaydi | null> => {
  const ayar = await otoOku(env);
  const gecmis = await otoGecmisOku(env);
  const gun = istanbulGunu(simdi);
  const s = gununKalemi(ayar, tur, gun, istanbulSaati(simdi), gecmis);
  if ("atla" in s && s.atla !== "liste" && s.atla !== "gonderen" && s.atla !== "izinsiz") return null;
  const zaman = new Date(simdi).toISOString();
  const kayit = async (k: OtoCagriKaydi) => {
    await env.YZ.put(OTO_GECMIS_ANAHTARI, JSON.stringify(gecmiseEkle(gecmis, k)));
    return k;
  };
  if ("atla" in s && s.atla === "liste") return kayit({ etiket: "", tur, tarih: gun, zaman, uid: "", kime: "", bccIdler: [], konu: "", metin: "", sonSaat: "", tamam: false, hata: "liste" });
  const k = ayar.kalemler.find((x) => x.tur === tur && x.gonderim === gun)!;
  // Görevli izin vermemişse adı geçmişte kalsın: kimin onayı beklendiği görünsün.
  if ("atla" in s) return kayit({ etiket: k.etiket, tur, tarih: k.tarih, zaman, uid: s.atla === "izinsiz" ? (k.gorevli ?? "") : "", kime: "", bccIdler: [], konu: k.konu, metin: "", sonSaat: k.sonSaat, tamam: false, hata: s.atla });
  const uid = s.uid;
  const pa = await postaAyarOku(env);
  const pk = await postaKimlikOku(env, uid);
  const temel: OtoCagriKaydi = { etiket: k.etiket, tur, tarih: k.tarih, zaman, uid, kime: pk.grupAdresi, bccIdler: ayar.bccIdler, konu: k.konu, metin: k.metin, sonSaat: k.sonSaat, tamam: false };
  if (!pa.acik || !pa.sunucu) return kayit({ ...temel, hata: "postaKapali" });
  if (!pk.kullanici || !pk.parola) return kayit({ ...temel, hata: "eksikKimlik" });
  if (pk.reddedildi) return kayit({ ...temel, hata: KIMLIK_REDDI });
  if (!pk.grupAdresi) return kayit({ ...temel, hata: "grup" });
  if (!ayar.bcc.length) return kayit({ ...temel, hata: "bcc" });
  const r = await gonder({ sunucu: pa.sunucu, kullanici: pk.kullanici, parola: pk.parola, alan: pa.alan }, { kime: [pk.grupAdresi], bcc: ayar.bcc.filter((a) => a !== pk.grupAdresi), konu: k.konu, metin: k.metin, html: k.html || undefined });
  await kimlikReddiniYaz(env, uid, pk, r, simdi);
  return kayit("hata" in r ? { ...temel, hata: r.hata.slice(0, 200), ...(r.belirsiz && { belirsiz: true }) } : { ...temel, tamam: true });
};

/* Kişiye özel kimlik (kullanıcı adı, parola, grup adresi) uid'ye bağlı. */
const postaKimlikAnahtari = (uid: string) => `posta-kimlik:${uid}`;
/* Şifre KV'de şifreli (gizli.ts); düz kalmış eski kayıt anahtar varken ilk okumada şifrelenip yeniden yazılır. */
const postaKimlikYaz = async (env: Env, uid: string, k: PostaKimlik) =>
  env.YZ.put(postaKimlikAnahtari(uid), JSON.stringify({ ...k, parola: await sifrele(k.parola, env.POSTA_ANAHTARI) }));
const postaKimlikOku = async (env: Env, uid: string): Promise<PostaKimlik> => {
  const ham = await env.YZ.get(postaKimlikAnahtari(uid));
  if (!ham) return bosPostaKimlik();
  const k = { ...bosPostaKimlik(), ...(JSON.parse(ham) as PostaKimlik) };
  const duz = { ...k, parola: await coz(k.parola, env.POSTA_ANAHTARI) };
  if (env.POSTA_ANAHTARI && k.parola && !sifreliMi(k.parola)) await postaKimlikYaz(env, uid, duz).catch(() => undefined);
  return duz;
};

/*
 * Şifre reddi: Exchange 401 dönünce kimlik işaretlenir, işaret dururken kapı
 * kendiliğinden (çekme, gönderme, ek, otomatik çağrı) bu şifreyle giriş denemez;
 * eski şifreyle tekrar tekrar denemek kurumun sunucusunda hesabı kilitliyordu.
 */
const KIMLIK_REDDI = "kimlikReddedildi";
const kimlikReddiniYaz = async (env: Env, uid: string, pk: PostaKimlik, r: unknown, simdi: number) => {
  const red = !!r && typeof r === "object" && (r as { kimlik?: boolean }).kimlik === true;
  if (red && !pk.reddedildi) await postaKimlikYaz(env, uid, { ...pk, reddedildi: new Date(simdi).toISOString() }).catch(() => undefined);
  if (!red && pk.reddedildi && !(r && typeof r === "object" && "hata" in r)) {
    const { reddedildi: _, ...temiz } = pk;
    await postaKimlikYaz(env, uid, temiz).catch(() => undefined);
  }
  return red;
};

/* EWS mesajını tarayıcının postaIsle'sine uygun biçime indirger; gövde temizliğini istemci de yapıyor (tek kaynak). */
const postaDisa = (m: EwsMesaj) => ({ kimden: m.kimden, kimdenAd: m.kimdenAd, konu: m.konu, metin: m.tamMetin, zaman: m.zaman, mesajKimligi: m.mesajKimligi, konuKimligi: m.konuKimligi, ekler: m.ekler, kime: m.kime, cc: m.cc });

/*
 * Gönderimin adres listesi: tek metin ("a@x, b@y") ya da dizi; küçük harf,
 * tekrarsız. Biri bile geçersizse null: yanlış yazılmış adres sessizce
 * düşmesin, gönderim reddedilsin.
 */
/*
 * Postanın dosya ekleri (planı gönder: Word ya da PDF). Yalnız belge türleri,
 * düz ad, base64 ve toplamda 4 MB: kapı ekleri olduğu gibi Exchange'e geçiriyor,
 * tarayıcıdan gelen keyfî dosya kurumun adresinden gitmesin. Geçersizse null.
 */
const EK_TURLERI = ["application/msword", "application/pdf"];
const ekListesi = (v: unknown): { ad: string; tur: string; icerik: string }[] | null => {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > 3) return null;
  let toplam = 0;
  const sonuc: { ad: string; tur: string; icerik: string }[] = [];
  for (const e of v as { ad?: unknown; tur?: unknown; icerik?: unknown }[]) {
    const ad = typeof e?.ad === "string" ? e.ad.trim() : "";
    const tur = typeof e?.tur === "string" ? e.tur : "";
    const icerik = typeof e?.icerik === "string" ? e.icerik : "";
    if (!ad || ad.length > 100 || /[\\/:*?"<>|\x00-\x1F]/.test(ad) || !/\.(docx?|pdf)$/i.test(ad)) return null;
    if (!EK_TURLERI.includes(tur) || !icerik || !/^[A-Za-z0-9+/]+={0,2}$/.test(icerik)) return null;
    toplam += icerik.length;
    if (toplam > 4 * 1024 * 1024 * 4 / 3) return null;
    sonuc.push({ ad, tur, icerik });
  }
  return sonuc;
};

const adresListesi = (v: unknown): string[] | null => {
  const ham = Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[,;\s]+/) : [];
  const temiz = [...new Set(ham.map((a) => a.trim().toLowerCase()).filter(Boolean))];
  return temiz.every((a) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(a)) ? temiz : null;
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
 * Kişi kaydı önbellekte: her istekte Firestore'dan okumak, ücretsiz planın günlük 50.000 okuması
 * dolunca (429 Quota exceeded) postayı ve yapay zekayı bütünüyle kilitliyordu. 10 dakika taze sayılıyor
 * (hesabı kapatılan ya da birimi değişen kişi en geç o kadar eski haliyle geçer); Firestore kota ya da
 * kendi hatasıyla yanıt vermezse son 24 saatte okunmuş kayıt kullanılıyor. Oturum belgesi yine her
 * istekte doğrulanıyor; anahtar doğrulanmış uid'den, başkasının kaydı okunamaz.
 */
const KISI_TAZE = 10 * 60_000;
const KISI_YEDEK_SANIYE = 24 * 3600;
const kisiAnahtari = (uid: string) => `kisi:${uid}`;

const kisiGetir = async (belge: string, kimlik: Kimlik, env: Env, d: Bagimlilik): Promise<Kisi | string> => {
  const onceki = await d.onbellek
    ?.get(kisiAnahtari(kimlik.uid))
    .then((x) => (x ? (JSON.parse(x) as { kisi: Kisi; zaman: number }) : null))
    .catch(() => null);
  if (onceki && d.simdi() - onceki.zaman < KISI_TAZE) return { ...onceki.kisi, kimlik };
  const kisi = await kisiOku(belge, kimlik, env, d).catch((e: unknown) => `istisna ${String(e)}`.slice(0, 300));
  if (typeof kisi !== "string") {
    await d.onbellek?.put(kisiAnahtari(kimlik.uid), JSON.stringify({ kisi, zaman: d.simdi() }), KISI_YEDEK_SANIYE).catch(() => {});
    return kisi;
  }
  // Firestore yanıt vermediyse (kota, sunucu, bağlantı) eski kayıt; kişi "pasif" ya da yoksa önbellek kullanılmaz.
  const gecici = /^firestore (429|5\d\d)|^istisna/.test(kisi);
  if (gecici && onceki) return { ...onceki.kisi, kimlik };
  return kisi;
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
    return await isleIc(req, env, d, yanit, cors);
  } catch (e) {
    return yanit({ hata: "kapi", ayrinti: String(e instanceof Error ? e.message : e).slice(0, 300) }, 500);
  }
};

const isleIc = async (req: Request, env: Env, d: Bagimlilik, yanit: (g: unknown, s?: number) => Response, cors: Record<string, string> = {}): Promise<Response> => {

  const belge = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const kimlik = belge ? await oturumuDogrula(belge, env.FIREBASE_PROJE, d.anahtarBul, d.simdi()).catch(() => null) : null;
  if (!kimlik) return yanit({ hata: "oturum" }, 401);
  const kisi = await kisiGetir(belge, kimlik, env, d);
  // Kota ayrı hata: ekran "kapıya ulaşılamadı" yerine kotanın dolduğunu ve ne zaman yenileneceğini yazsın.
  if (typeof kisi === "string") return kisi.startsWith("firestore 429") ? yanit({ hata: "kota", ayrinti: kisi }, 503) : yanit({ hata: "kisi", ayrinti: kisi }, 403);

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
    const sonuc = sonucCoz(ozellik, s.metin, s.kaynaklar, g?.girdi);
    if (sonuc === null) return yanit({ hata: "bos" }, 502);
    // Sayaç yalnız başarılı çağrıda artıyor; KV anlık tutarlı değil, sınır kaba bir koruma.
    await env.YZ.put(kAnahtar, String(kullanilan + 1), { expirationTtl: IKI_GUN });
    const tAnahtar = toplamAnahtari(bugun, ozellik);
    await env.YZ.put(tAnahtar, String((await sayiOku(env, tAnahtar)) + 1), { expirationTtl: 30 * 86400 });
    return yanit({ sonuc, kalan: Math.max(0, sinir - kullanilan - 1) });
  }

  /*
   * Asistan (asistan.ts): bir tur; araç isteklerini tarayıcı çalıştırıp sonucu yeni turla getirir.
   * Günlük sınır yalnız kişinin kendi yazdığı iletide artar, araç turlarında değil.
   */
  if (req.method === "POST" && yol === "/asistan") {
    const saglayici = ozellikSaglayicisi(ayar, "asistan", kisi.birim, kisi.yonetici);
    if (!saglayici) return yanit({ hata: "kapali" }, 403);
    const g = asistanIstegiCoz(await req.json().catch(() => null));
    if (!g) return yanit({ hata: "girdi" }, 400);
    const kAnahtar = kullanimAnahtari(bugun, kisi.kimlik.uid, "asistan");
    const kullanilan = await sayiOku(env, kAnahtar);
    const sinir = ayar.ozellikler.asistan.gunlukSinir;
    if (g.yeni && kullanilan >= sinir) return yanit({ hata: "gunlukSinir", kalan: 0 }, 429);
    const s = await asistanCagir(saglayici, sistemYonergesi(g.baglam, ayar.ozellikler.asistan.yonerge), g.mesajlar as never, ARACLAR as never, d.fetch, derinMi(g.mesajlar));
    if (!s.tamam) return yanit({ hata: s.hata, ...(s.ayrinti ? { ayrinti: s.ayrinti } : {}) }, 502);
    if (g.yeni) {
      await env.YZ.put(kAnahtar, String(kullanilan + 1), { expirationTtl: IKI_GUN });
      const tAnahtar = toplamAnahtari(bugun, "asistan");
      await env.YZ.put(tAnahtar, String((await sayiOku(env, tAnahtar)) + 1), { expirationTtl: 30 * 86400 });
    }
    return yanit({ icerik: s.icerik, dur: s.dur, kalan: Math.max(0, sinir - kullanilan - (g.yeni ? 1 : 0)) });
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
  /*
   * Rota tablosu (rota.ts): ayarı tam yönetici girer; günün satırlarını Next Day'i hazırlayan
   * okur. Kapı tabloyu gün başına bir kez okur (önbellek 6 saat): her plan açılışı Google'a gitmesin.
   */
  if (yol === "/rota/ayar") {
    if (!kisi.yonetici) return yanit({ hata: "yetki" }, 403);
    const ra = await rotaAyarOku(env.YZ, env.POSTA_ANAHTARI);
    if (req.method === "GET") return yanit(rotaGorunur(ra));
    if (req.method === "PUT") {
      const r = rotaAyarBirlestir(ra, await req.json().catch(() => null));
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await rotaAyarYaz(env.YZ, r.ayar, env.POSTA_ANAHTARI);
      return yanit(rotaGorunur(r.ayar));
    }
  }
  if (req.method === "POST" && yol === "/rota") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403);
    const g = (await req.json().catch(() => null)) as { tarih?: unknown; yenile?: unknown; tur?: unknown } | null;
    const tarih = typeof g?.tarih === "string" && /^\d{4}-\d{2}-\d{2}$/.test(g.tarih) ? g.tarih : "";
    if (!tarih) return yanit({ hata: "tarih" }, 400);
    const tur = g?.tur === "sunucu" ? "sunucu" : "rota";
    const ra = await rotaAyarOku(env.YZ, env.POSTA_ANAHTARI);
    const tabloId = tur === "sunucu" ? ra.sunucuTabloId : ra.tabloId;
    if (!tabloId || !ra.ozelAnahtar) return yanit({ hata: "kapali" }, 404);
    const kAnahtar = `rota:${tur}:${tabloId}:${tarih}`;
    if (g?.yenile !== true) {
      const onceki = await d.onbellek?.get(kAnahtar).catch(() => null);
      if (onceki) return yanit(JSON.parse(onceki));
    }
    const r = await rotaOku(ra, tarih, d.fetch, d.simdi(), tur);
    if ("hata" in r) return yanit(r, r.hata === "sekme" || r.hata === "gun" ? 404 : 502);
    await d.onbellek?.put(kAnahtar, JSON.stringify(r), 6 * 3600).catch(() => {});
    return yanit(r);
  }

  /*
   * Bildirimler (bildirim.ts). Genel anahtar varsayılan kapalı, yalnız tam yönetici
   * açar; kapalıyken abone olunur ama gönderilmez (deneme bildirimi hariç).
   */
  if (req.method === "GET" && yol === "/bildirim") {
    const ba = await bildirimAyarOku(env.YZ);
    const v = await vapidAl(env.YZ, env.POSTA_ANAHTARI);
    return yanit({ acik: ba.acik, anahtar: v.acik });
  }
  if (req.method === "PUT" && yol === "/bildirim/ayar") {
    if (!kisi.yonetici) return yanit({ hata: "yetki" }, 403);
    const g = (await req.json().catch(() => null)) as { acik?: unknown } | null;
    await bildirimAyarYaz(env.YZ, { acik: g?.acik === true });
    return yanit(await bildirimAyarOku(env.YZ));
  }
  if (req.method === "POST" && (yol === "/bildirim/abone" || yol === "/bildirim/birak")) {
    const g = (await req.json().catch(() => null)) as { endpoint?: unknown; p256dh?: unknown; auth?: unknown; dil?: unknown } | null;
    const endpoint = typeof g?.endpoint === "string" ? g.endpoint : "";
    if (!pushAdresiUygun(endpoint)) return yanit({ hata: "adres" }, 400);
    if (yol === "/bildirim/birak") {
      await aboneCikar(env.YZ, endpoint, kisi.kimlik.uid);
      return yanit({ tamam: true });
    }
    const p256dh = typeof g?.p256dh === "string" ? g.p256dh : "";
    const auth = typeof g?.auth === "string" ? g.auth : "";
    if (!/^[A-Za-z0-9_-]{80,100}$/.test(p256dh) || !/^[A-Za-z0-9_-]{16,32}$/.test(auth)) return yanit({ hata: "anahtar" }, 400);
    const dil = g?.dil === "ar" || g?.dil === "en" ? g.dil : "tr";
    await aboneEkle(env.YZ, { endpoint, p256dh, auth, uid: kisi.kimlik.uid, kisitli: kisi.kisitli, dil, zaman: d.simdi() });
    return yanit({ tamam: true });
  }
  if (req.method === "POST" && yol === "/bildirim/dene") {
    const benim = (await aboneleriOku(env.YZ)).filter((a) => a.uid === kisi.kimlik.uid);
    if (!benim.length) return yanit({ hata: "abone" }, 404);
    return yanit(await bildirimGonder(env.YZ, env.POSTA_ANAHTARI, benim, denemeYuku, d.fetch, d.simdi()));
  }
  if (req.method === "POST" && yol === "/bildirim/oneri") {
    const ba = await bildirimAyarOku(env.YZ);
    if (!ba.acik) return yanit({ giden: 0, kapali: true });
    const g = (await req.json().catch(() => null)) as { oneriId?: unknown; baslik?: unknown; kaynak?: unknown } | null;
    const oneriId = typeof g?.oneriId === "string" ? g.oneriId.slice(0, 80) : "";
    if (!oneriId) return yanit({ hata: "oneri" }, 400);
    // Aynı öneri iki kez bildirilmesin; kişi başına günde 100 (kötüye kullanım sınırı, önbellekte: KV'ye yazmaz).
    const tekAnahtar = `bildirim:oneri:${oneriId}`;
    const sayAnahtar = `bildirim:sayi:${kisi.kimlik.uid}:${bugun}`;
    if (await d.onbellek?.get(tekAnahtar).catch(() => null)) return yanit({ giden: 0, tekrar: true });
    const sayi = Number((await d.onbellek?.get(sayAnahtar).catch(() => null)) ?? 0);
    if (sayi >= 100) return yanit({ hata: "sinir" }, 429);
    await d.onbellek?.put(tekAnahtar, "1", 86400).catch(() => {});
    await d.onbellek?.put(sayAnahtar, String(sayi + 1), 86400).catch(() => {});
    const baslik = typeof g?.baslik === "string" ? g.baslik.slice(0, 140) : "";
    const kaynak = typeof g?.kaynak === "string" ? g.kaynak.slice(0, 60) : "";
    // Öneriyi gönderen kendisi ve kısıtlı kişiler (başkasının önerisini görmez) almaz.
    const hedef = (await aboneleriOku(env.YZ)).filter((a) => a.uid !== kisi.kimlik.uid && !a.kisitli);
    return yanit(await bildirimGonder(env.YZ, env.POSTA_ANAHTARI, hedef, (a) => yeniOneriYuku(a, baslik, kaynak, oneriId), d.fetch, d.simdi()));
  }

  /* Ortak ayar (sunucu, alan, açık/kapalı) yalnız tam yöneticide. */
  if (yol === "/posta/ayar") {
    if (!kisi.yonetici) return yanit({ hata: "yetki" }, 403);
    const pa = await postaAyarOku(env);
    if (req.method === "GET") return yanit(postaGorunur(pa));
    if (req.method === "PUT") {
      const r = postaAyarBirlestir(pa, await req.json().catch(() => null));
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await env.YZ.put(POSTA_AYAR_ANAHTARI, JSON.stringify(r.ayar));
      return yanit(postaGorunur(r.ayar));
    }
  }

  /* Kişiye özel kimlik (kullanıcı adı, parola, grup adresi): herkes kendininkini. */
  if (yol === "/posta/kimlik" || yol === "/posta/dene") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403); // dış muhabirler ve onay bekleyen hariç
    const pk = await postaKimlikOku(env, kisi.kimlik.uid);
    if (req.method === "GET" && yol === "/posta/kimlik") return yanit(postaKimlikGorunur(pk));
    if (req.method === "PUT" && yol === "/posta/kimlik") {
      const r = postaKimlikBirlestir(pk, await req.json().catch(() => null));
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await postaKimlikYaz(env, kisi.kimlik.uid, r.kimlik);
      return yanit(postaKimlikGorunur(r.kimlik));
    }
    if (req.method === "POST" && yol === "/posta/dene") {
      const pa = await postaAyarOku(env);
      if (!pa.sunucu) return yanit({ hata: "eksikSunucu" }, 400);
      // Formda yazılmış (henüz kaydedilmemiş) şifre ve kullanıcı adı varsa onlar denenir, kaydedilmez:
      // önce kayıtlı eski şifre deneniyordu, kişi yeni şifresinin "kabul edilmediğini" sanıyordu.
      const g = (await req.json().catch(() => null)) as { kullanici?: unknown; parola?: unknown } | null;
      const yeniParola = typeof g?.parola === "string" && g.parola.length > 0 && g.parola.length <= 256 ? g.parola : "";
      const yeniKullanici = typeof g?.kullanici === "string" && g.kullanici.trim() && g.kullanici.length <= 256 ? g.kullanici.trim() : "";
      const kullanici = yeniKullanici || pk.kullanici;
      const parola = yeniParola || pk.parola;
      if (!kullanici || !parola) return yanit({ hata: "eksikKimlik" }, 400);
      const r = await postalariCekOtomatik({ sunucu: pa.sunucu, kullanici, parola, alan: pa.alan }, cfBaglan, d.simdi(), 10);
      // Ret işareti yalnız kayıtlı kimlik denenince değişir.
      if (kullanici === pk.kullanici && parola === pk.parola) await kimlikReddiniYaz(env, kisi.kimlik.uid, pk, r, d.simdi());
      if ("hata" in r) return yanit({ hata: r.kimlik ? KIMLIK_REDDI : "baglanti", ayrinti: r.hata.slice(0, 200) }, 502);
      return yanit({ tamam: true, sayi: r.mesajlar.filter((m) => grubaUygun(m, pk.grupAdresi)).length });
    }
  }

  if (req.method === "POST" && yol === "/posta/cek") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403); // dış muhabirler ve onay bekleyen hariç
    const pa = await postaAyarOku(env);
    if (!pa.acik) return yanit({ hata: "kapali" }, 403);
    if (!pa.sunucu) return yanit({ hata: "eksikSunucu" }, 400);
    const pk = await postaKimlikOku(env, kisi.kimlik.uid);
    if (!pk.kullanici || !pk.parola) return yanit({ hata: "eksikKimlik" }, 400);
    if (pk.reddedildi) return yanit({ hata: KIMLIK_REDDI }, 400);
    const g = (await req.json().catch(() => null)) as { adet?: number } | null;
    const adet = Math.min(50, Math.max(1, Number(g?.adet) || 25));
    const r = await postalariCekOtomatik({ sunucu: pa.sunucu, kullanici: pk.kullanici, parola: pk.parola, alan: pa.alan }, cfBaglan, d.simdi(), adet);
    if (await kimlikReddiniYaz(env, kisi.kimlik.uid, pk, r, d.simdi())) return yanit({ hata: KIMLIK_REDDI }, 502);
    if ("hata" in r) return yanit({ hata: "baglanti", ayrinti: r.hata.slice(0, 200) }, 502);
    return yanit({ mesajlar: r.mesajlar.filter((m) => grubaUygun(m, pk.grupAdresi)).map(postaDisa), ...(r.uyari ? { uyari: r.uyari.slice(0, 200) } : {}), ...(r.staffing ? { staffing: r.staffing } : {}) });
  }

  /*
   * Ekin kendisi (kişi dosyaya basınca): kayıtta yalnız adı var. Posta
   * çağıranın kendi kutusunda Message-ID'siyle aranıyor; dosya saklanmıyor,
   * olduğu gibi tarayıcıya gidiyor.
   */
  if (req.method === "POST" && yol === "/posta/ek") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403);
    const pa = await postaAyarOku(env);
    if (!pa.acik) return yanit({ hata: "kapali" }, 403);
    if (!pa.sunucu) return yanit({ hata: "eksikSunucu" }, 400);
    const pk = await postaKimlikOku(env, kisi.kimlik.uid);
    if (!pk.kullanici || !pk.parola) return yanit({ hata: "eksikKimlik" }, 400);
    if (pk.reddedildi) return yanit({ hata: KIMLIK_REDDI }, 400);
    const g = (await req.json().catch(() => null)) as { mesajKimligi?: unknown; ad?: unknown } | null;
    const imid = typeof g?.mesajKimligi === "string" ? g.mesajKimligi.trim() : "";
    const ad = typeof g?.ad === "string" ? g.ad : "";
    if (!imid || imid.length > 500 || !ad || ad.length > 400) return yanit({ hata: "girdi" }, 400);
    const r = await ekIndirOtomatik({ sunucu: pa.sunucu, kullanici: pk.kullanici, parola: pk.parola, alan: pa.alan }, cfBaglan, d.simdi(), imid, ad);
    if (await kimlikReddiniYaz(env, kisi.kimlik.uid, pk, r, d.simdi())) return yanit({ hata: KIMLIK_REDDI }, 502);
    if ("hata" in r) return yanit({ hata: r.yok ? "ekYok" : r.buyuk ? "ekBuyuk" : "baglanti", ayrinti: r.hata.slice(0, 200) }, r.yok ? 404 : r.buyuk ? 413 : 502);
    return new Response(r.veri, {
      headers: { "content-type": /^[\w.+-]+\/[\w.+-]+$/.test(r.tur) ? r.tur : "application/octet-stream", "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(ad)}`, "cache-control": "no-store", ...cors },
    });
  }

  /* Yeni posta ve yanıt (EWS CreateItem). Alıcı yoksa kişinin grup adresi; grup her zaman CC'de. */
  if (req.method === "POST" && yol === "/posta/gonder") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403); // dış muhabirler ve onay bekleyen hariç
    const pa = await postaAyarOku(env);
    if (!pa.acik) return yanit({ hata: "kapali" }, 403);
    if (!pa.sunucu) return yanit({ hata: "eksikSunucu" }, 400);
    const pk = await postaKimlikOku(env, kisi.kimlik.uid);
    if (!pk.kullanici || !pk.parola) return yanit({ hata: "eksikKimlik" }, 400);
    if (pk.reddedildi) return yanit({ hata: KIMLIK_REDDI }, 400);
    const g = (await req.json().catch(() => null)) as { kime?: unknown; cc?: unknown; bcc?: unknown; konu?: string; metin?: string; baslik?: unknown; yanitlanan?: unknown; html?: unknown; gonderen?: unknown; ekler?: unknown } | null;
    const kimeL = adresListesi(g?.kime), ccL = adresListesi(g?.cc), bccL = adresListesi(g?.bcc);
    if (!kimeL || !ccL || !bccL) return yanit({ hata: "kime" }, 400);
    const gonderenL = typeof g?.gonderen === "string" && g.gonderen.trim() ? adresListesi([g.gonderen.trim()]) : [];
    if (!gonderenL || gonderenL.length > 1) return yanit({ hata: "gonderen" }, 400);
    const gonderen = gonderenL[0];
    const grup = pk.grupAdresi;
    const kime = kimeL.length ? kimeL : grup ? [grup] : [];
    if (!kime.length) return yanit({ hata: "kime" }, 400);
    // Grup adresi her zaman CC'de: yazışma grupta kalsın, yanıtlar kutudan geri gelsin.
    // Tarayıcıya bırakılmıyor; kapı ekliyor.
    let cc = ccL.filter((a) => !kime.includes(a));
    if (grup && !kime.includes(grup) && !cc.includes(grup)) cc = [...cc, grup];
    const bcc = bccL.filter((a) => !kime.includes(a) && !cc.includes(a));
    if (kime.length + cc.length + bcc.length > 50) return yanit({ hata: "kime" }, 400);
    const metin = String(g?.metin ?? "").trim();
    if (!metin) return yanit({ hata: "bos" }, 400);
    const konu = String(g?.konu ?? "").slice(0, 255) || "(konusuz)";
    // Hatırlatma: kırmızı başlık (kısa düz metin) ve çağrının Message-ID'si; HTML'i kapı kuruyor, tarayıcıdan HTML alınmıyor.
    const baslik = typeof g?.baslik === "string" ? g.baslik.trim().slice(0, 60) : "";
    const yanitlanan = mesajKimligiGecerli(g?.yanitlanan) ? g.yanitlanan : undefined;
    // Biçimli gövde (planı gönder): yalnız süzgeçten geçmiş biçim etiketleri (ews.ts → guvenliHtml).
    const html = typeof g?.html === "string" && g.html.trim() ? guvenliHtml(g.html) : undefined;
    const ekler = ekListesi(g?.ekler);
    if (!ekler) return yanit({ hata: "ek" }, 400);
    const r = await postaGonderOtomatik({ sunucu: pa.sunucu, kullanici: pk.kullanici, parola: pk.parola, alan: pa.alan }, cfBaglan, d.simdi(), { kime, cc, bcc, konu, metin, ...(html && { html }), ...(ekler.length && { ekler }), ...(baslik && !html && { baslik }), ...(yanitlanan && { yanitlanan }), ...(gonderen && { gonderen }) });
    if (await kimlikReddiniYaz(env, kisi.kimlik.uid, pk, r, d.simdi())) return yanit({ hata: KIMLIK_REDDI }, 502);
    // Gerçekten kime gittiğini döndür: ekrandaki "→ kime · CC" satırı bundan.
    if ("hata" in r && gonderen && /SendAs|SendOnBehalf/i.test(r.hata)) return yanit({ hata: "gonderenYetki", ayrinti: gonderen }, 403);
    return "hata" in r ? yanit({ hata: "gonderilemedi", ayrinti: r.hata.slice(0, 200) }, 502) : yanit({ tamam: true, kime, cc, bcc });
  }

  /*
   * Otomatik çağrı: durum ve geçmiş haber merkezinde herkese (çağrının kaydını
   * uygulamayı ilk açan planlamacı yazıyor); takvime yalnız kendi izniyle
   * gönderen listesine girmiş kişi konuyor (oto-cagri.ts → otoCagriBirlestir).
   */
  if (yol === "/oto-cagri") {
    if (kisi.kisitli) return yanit({ hata: "yetki" }, 403);
    const oa = await otoOku(env);
    if (req.method === "GET") return yanit(otoCagriGorunur(oa, kisi.kimlik.uid, await otoGecmisOku(env)));
    if (req.method === "PUT") {
      // İçeriği (alıcı listesi, konu, metin, görevli) yalnız çağrıyı hazırlayan birim yazar: yoksa haber merkezindeki
      // herkes, izin vermiş planlamacının hesabından dilediği adreslere dilediği metni gönderebilirdi.
      if (!kisi.yonetici && kisi.birim !== "planlama") return yanit({ hata: "yetki" }, 403);
      const r = otoCagriBirlestir(oa, await req.json().catch(() => null), kisi.kimlik.uid, new Date(d.simdi()).toISOString());
      if ("hata" in r) return yanit({ hata: r.hata }, 400);
      await env.YZ.put(OTO_ANAHTARI, JSON.stringify(r.ayar));
      return yanit(otoCagriGorunur(r.ayar, kisi.kimlik.uid, await otoGecmisOku(env)));
    }
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
  scheduled: (olay: { cron: string }, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) => {
    if (olay.cron !== CRON_OTO) return;
    const gonder: Gonderici = (a, g) => postaGonderOtomatik(a, cfBaglan, Date.now(), g);
    // Sırayla: ikisi aynı anda geçmişi okuyup yazarsa biri ötekinin kaydını ezerdi.
    ctx.waitUntil(otoCagriCalistir(env, Date.now(), "nextday", gonder).then(() => otoCagriCalistir(env, Date.now(), "haftalik", gonder)));
  },
  fetch: (req: Request, env: Env) => isle(req, env, { fetch: (...a) => fetch(...a), simdi: Date.now, anahtarBul: googleAnahtarlari((...a) => fetch(...a), Date.now), onbellek: cacheOnbellegi() }),
};
