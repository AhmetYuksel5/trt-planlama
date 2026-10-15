/*
 * Yapay zeka ayarı: sağlayıcılar (anahtarlarıyla) ve özellikler. Hepsi
 * Worker'ın KV deposunda; Firestore'da değil. Uç nokta adresi de burada:
 * Firestore'daki ayarı herhangi bir etkin kişi yazabildiği için adres
 * oradan okunsaydı biri onu kendi sunucusuna çevirip anahtarı ele
 * geçirebilirdi. Tarayıcıya anahtar hiç gitmiyor, yalnız son dört hanesi.
 */

export const SAGLAYICI_TURLERI = ["anthropic", "openai"] as const;
export type SaglayiciTuru = (typeof SAGLAYICI_TURLERI)[number];

export interface Saglayici {
  id: string;
  ad: string;
  tur: SaglayiciTuru;
  /** OpenAI uyumlu uç noktanın kökü (…/v1); Claude'da kullanılmıyor. */
  adres?: string;
  model: string;
  anahtar?: string;
  aktif: boolean;
}

export interface OzellikAyari {
  acik: boolean;
  saglayici?: string;
  /** Boşsa bütün birimler. */
  birimler: string[];
  gunlukSinir: number;
  /** Yöneticinin kendi yönergesi (biçim, üslup); varsayılan yönergenin arkasına ekleniyor. */
  yonerge?: string;
  /** Haber değeri ölçütleri; boşsa varsayılan liste (ozellikler.ts). */
  kriterler?: string[];
  /** İnternet aramalı özellikte aramanın sınırlandığı siteler (alan adı); boşsa bütün web. */
  alanlar?: string[];
}

export interface Ayar {
  saglayicilar: Saglayici[];
  ozellikler: Record<string, OzellikAyari>;
}

/* Programın bildiği özellikler; yeni özellik buraya ve ozellikler.ts'e girer. */
export const OZELLIKLER = ["kisalt", "bicimle", "haberDegeri", "takipMetni"] as const;
export type Ozellik = (typeof OZELLIKLER)[number];

export const VARSAYILAN_SINIR = 50;
export const EN_UZUN_YONERGE = 6000;
export const bosAyar = (): Ayar => ({ saglayicilar: [], ozellikler: {} });

/** Tarayıcıya giden hal: anahtarın yalnız var olduğu ve son dört hanesi. */
export type GorunenSaglayici = Omit<Saglayici, "anahtar"> & { anahtarSonu?: string };
export const gorunur = (a: Ayar) => ({
  saglayicilar: a.saglayicilar.map(({ anahtar, ...s }): GorunenSaglayici => ({ ...s, ...(anahtar ? { anahtarSonu: anahtar.slice(-4) } : {}) })),
  ozellikler: a.ozellikler,
});

const metin = (x: unknown, en: number) => (typeof x === "string" ? x.trim().slice(0, en) : "");

/*
 * Yöneticinin gönderdiği ayar denetlenip eskisiyle birleşiyor. Anahtar
 * alanı yoksa eskisi kalıyor (ekranda anahtar gösterilmediği için her
 * kayıtta yeniden yazılmasın), boş metinse siliniyor. Hata metni kod:
 * ekran kendi dilinde yazıyor.
 */
export const ayarBirlestir = (eski: Ayar, gelen: unknown): { ayar: Ayar } | { hata: string } => {
  if (!gelen || typeof gelen !== "object") return { hata: "bicim" };
  const g = gelen as { saglayicilar?: unknown; ozellikler?: unknown };
  if (!Array.isArray(g.saglayicilar)) return { hata: "bicim" };
  const saglayicilar: Saglayici[] = [];
  for (const ham of g.saglayicilar.slice(0, 20)) {
    if (!ham || typeof ham !== "object") return { hata: "bicim" };
    const s = ham as Record<string, unknown>;
    const id = metin(s.id, 40);
    const tur = s.tur as SaglayiciTuru;
    if (!/^[a-z0-9-]+$/.test(id) || saglayicilar.some((x) => x.id === id)) return { hata: "kimlik" };
    if (!SAGLAYICI_TURLERI.includes(tur)) return { hata: "tur" };
    const model = metin(s.model, 100);
    if (!model) return { hata: "model" };
    let adres: string | undefined;
    if (tur === "openai") {
      adres = metin(s.adres, 300).replace(/\/+$/, "");
      let u: URL;
      try {
        u = new URL(adres);
      } catch {
        return { hata: "adres" };
      }
      // Anahtar düz metin bağlantıda gitmesin.
      if (u.protocol !== "https:") return { hata: "adres" };
    }
    const onceki = eski.saglayicilar.find((x) => x.id === id);
    const anahtar = typeof s.anahtar === "string" ? s.anahtar.trim() : onceki?.anahtar;
    saglayicilar.push({
      id,
      ad: metin(s.ad, 60) || id,
      tur,
      ...(adres ? { adres } : {}),
      model,
      ...(anahtar ? { anahtar } : {}),
      aktif: s.aktif !== false,
    });
  }
  const ozellikler: Record<string, OzellikAyari> = {};
  const go = (g.ozellikler && typeof g.ozellikler === "object" ? g.ozellikler : {}) as Record<string, unknown>;
  for (const ad of OZELLIKLER) {
    const o = go[ad] as Record<string, unknown> | undefined;
    if (!o) continue;
    const saglayici = metin(o.saglayici, 40) || undefined;
    if (saglayici && !saglayicilar.some((s) => s.id === saglayici)) return { hata: "saglayici" };
    const sinir = Math.floor(Number(o.gunlukSinir));
    ozellikler[ad] = {
      acik: o.acik === true,
      ...(saglayici ? { saglayici } : {}),
      birimler: Array.isArray(o.birimler) ? [...new Set(o.birimler.filter((b): b is string => typeof b === "string").map((b) => b.slice(0, 60)))].slice(0, 50) : [],
      gunlukSinir: Number.isFinite(sinir) && sinir >= 0 ? Math.min(sinir, 10000) : VARSAYILAN_SINIR,
    };
    const yonerge = metin(o.yonerge, EN_UZUN_YONERGE);
    if (yonerge) ozellikler[ad].yonerge = yonerge;
    const kriterler = Array.isArray(o.kriterler) ? o.kriterler.map((k) => metin(k, 200)).filter(Boolean).slice(0, 20) : [];
    if (kriterler.length) ozellikler[ad].kriterler = kriterler;
    // Alan adı yalnız: yönetici adres yapıştırsa da (https://…/yol) site kalsın.
    const alanlar = Array.isArray(o.alanlar)
      ? [...new Set(o.alanlar.map((x) => metin(x, 200).toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]).filter((x) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(x)))].slice(0, 30)
      : [];
    if (alanlar.length) ozellikler[ad].alanlar = alanlar;
  }
  return { ayar: { saglayicilar, ozellikler } };
};

/** Özelliği bu kişi kullanabilir mi: açık, sağlayıcısı etkin ve anahtarlı, birimi listede (tam yönetici her zaman). */
export const ozellikSaglayicisi = (a: Ayar, ozellik: string, birim: string, yonetici: boolean): Saglayici | null => {
  const o = a.ozellikler[ozellik];
  if (!o?.acik) return null;
  if (!yonetici && o.birimler.length && !o.birimler.includes(birim)) return null;
  const s = a.saglayicilar.find((x) => x.id === o.saglayici) ?? a.saglayicilar.find((x) => x.aktif && x.anahtar);
  return s && s.aktif && s.anahtar ? s : null;
};
