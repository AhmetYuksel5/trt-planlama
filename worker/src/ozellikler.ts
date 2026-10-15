import type { Ozellik, OzellikAyari } from "./ayar.ts";

/*
 * Her özelliğin sağlayıcıya giden yönergesi, girdisinin ve yanıtının
 * denetimi. Yönerge sağlayıcıdan bağımsız: aynı metin Claude'a da OpenAI
 * uyumlu uca da gidiyor. Alanlı sonuç isteyen özellikler (`json`) JSON
 * nesnesi istiyor; yanıt burada ayıklanıyor, tarayıcıya yalnız beklenen
 * alanlar gidiyor.
 */

export interface Istek {
  sistem: string;
  kullanici: string;
  enCokCikti: number;
  json?: boolean;
  /** İnternet araması; `alanlar` boşsa bütün web. */
  arama?: { alanlar: string[] };
}

export interface Kaynak {
  url: string;
  baslik: string;
}

const EN_UZUN_GIRDI = 4000;
// Biçimlemede örnekler ve başlık havuzu da gidiyor; yine de sınırlı kalsın, maliyet kişinin elinde değil.
const EN_UZUN_JSON_GIRDI = 16000;

/* Programın haber türleri (src/veri.ts → BICIMLER); model bunlardan birini seçiyor. */
export const BICIMLER = ["pkg", "canli", "voxpop", "walktalk", "feature", "derinlemesine", "ozelRoportaj", "hikayem"] as const;
const BICIM_TARIFI =
  "pkg = edited news package/report; canli = live report or live link; voxpop = street interviews; walktalk = reporter walk-and-talk; feature = soft feature story; derinlemesine = in-depth report; ozelRoportaj = exclusive interview; hikayem = first-person human story";

export const DILLER = ["tr", "ar", "en"] as const;
type Dil = (typeof DILLER)[number];
const DIL_ADI: Record<Dil, string> = { tr: "Turkish", ar: "Modern Standard Arabic", en: "English" };

/* Yönetici ölçüt yazmadıysa bunlar; ölçütün adı yanıtta aynen geri geliyor, ekran kişinin dilinde göstersin diye üç dilde. */
export const VARSAYILAN_KRITERLER: Record<Dil, string[]> = {
  tr: ["Güncellik", "Arap izleyiciye yakınlık", "Etki ve önem", "Özgünlük", "Türkiye bağlantısı", "Görüntü ve uygulanabilirlik"],
  ar: ["الآنية", "قرب الموضوع من المشاهد العربي", "الأثر والأهمية", "التفرد", "الصلة بتركيا", "الصورة وقابلية التنفيذ"],
  en: ["Timeliness", "Relevance to Arab viewers", "Impact and importance", "Originality", "Turkey angle", "Visuals and feasibility"],
};

const yazi = (x: unknown, en: number) => (typeof x === "string" ? x.trim().slice(0, en) : "");

/* Yöneticinin yönergesi varsayılanın arkasında: çelişirse onunki geçerli. */
const yonergeli = (sistem: string[], ayar?: OzellikAyari) =>
  [...sistem, ...(ayar?.yonerge ? ["", "House rules from the planning editor. Follow them; where they conflict with the instructions above, they win:", ayar.yonerge] : [])].join("\n");

const metinGirdisi = (girdi: unknown) => {
  const m = girdi && typeof girdi === "object" ? (girdi as { metin?: unknown }).metin : undefined;
  return typeof m === "string" ? m.trim() : "";
};

/* Önerinin metin alanları; en az biri dolu olmalı. */
const oneriGirdisi = (girdi: unknown) => {
  if (!girdi || typeof girdi !== "object") return null;
  const g = girdi as Record<string, unknown>;
  const o = {
    header: yazi(g.haberBasligi, 400),
    strap: yazi(g.paketBasligi, 400),
    gelisme: yazi(g.gelisme, EN_UZUN_GIRDI),
    yer: yazi(g.yer, 100),
    ulke: yazi(g.ulke, 100),
    bicim: yazi(g.bicim, 40),
    kaynak: yazi(g.kaynak, 200),
    tarih: yazi(g.tarih, 40),
  };
  return o.header || o.gelisme || o.strap ? o : null;
};

export const istekKur = (ozellik: Ozellik, girdi: unknown, ayar?: OzellikAyari): Istek | null => {
  switch (ozellik) {
    /*
     * Plan satırı "YER / gelişme" biçiminde; muhabirin uzun açıklaması o
     * satıra sığmıyor, producer'lar elle kısaltıyordu. Yer ayrı alanda
     * yazıldığı için cümlede tekrar edilmiyor.
     */
    case "kisalt": {
      const metin = metinGirdisi(girdi);
      if (!metin || metin.length > EN_UZUN_GIRDI) return null;
      return {
        sistem: yonergeli(
          [
            "You are a planning editor at an Arabic-language TV newsroom.",
            "Rewrite the news development you are given as a single short line for the daily news agenda, in Modern Standard Arabic news style.",
            "Keep the facts, names and numbers that matter; do not add information, opinion or attribution that is not in the text.",
            "Aim for at most 20 words. Do not start with a city or place name, the place is written separately.",
            "Reply with the line only: no quotes, no labels, no explanation.",
          ],
          ayar,
        ),
        kullanici: metin,
        // Akıl yürüten modellerde düşünme de bu paydan yiyor; küçük kalınca yanıt boş dönüyordu.
        enCokCikti: 4000,
      };
    }
    /*
     * Muhabirin önerisini kurumun biçimine çevirme: Header (haber dosyası,
     * plandaki başlık), Strap (önerilen paketin başlığı), plan satırının
     * gelişmesi ve haber türü. Header için başlık havuzu gidiyor: uyan
     * dosya varsa aynı adla yazılsın, havuz ikiye bölünmesin. Planlama'nın
     * önceki düzeltmeleri (muhabirin yazdığı → son hal) örnek olarak
     * geliyor; model kurumun elinden geçmiş biçimi görüyor.
     */
    case "bicimle": {
      const o = oneriGirdisi(girdi);
      if (!o) return null;
      const g = girdi as Record<string, unknown>;
      const basliklar = Array.isArray(g.basliklar) ? g.basliklar.map((b) => yazi(b, 150)).filter(Boolean).slice(0, 120) : [];
      const ornekler = Array.isArray(g.ornekler)
        ? g.ornekler.slice(0, 6).flatMap((x) => {
            if (!x || typeof x !== "object") return [];
            const { once, sonra } = x as { once?: unknown; sonra?: unknown };
            const al = (y: unknown) => {
              const z = (y ?? {}) as Record<string, unknown>;
              return { header: yazi(z.haberBasligi, 300), strap: yazi(z.paketBasligi, 300), gelisme: yazi(z.gelisme, 1500) };
            };
            return [{ reporter_wrote: al(once), planning_final: al(sonra) }];
          })
        : [];
      const kullanici = JSON.stringify({ proposal: o, existing_headers: basliklar, examples: ornekler });
      if (kullanici.length > EN_UZUN_JSON_GIRDI) return null;
      return {
        sistem: yonergeli(
          [
            "You are the planning editor of an Arabic-language TV news channel. Reporters send story proposals; you turn each one into the newsroom's house format.",
            'Return a JSON object with exactly these keys: "header", "strap", "gelisme", "bicim".',
            '- "header" (العنوان الإخباري): the news file / running story this belongs to, 2 to 6 words, like a dossier name. If one of existing_headers fits the story, copy it exactly; otherwise write a new one.',
            '- "strap" (عنوان التقرير المقترح): the title of the proposed report, short and concrete, at most 10 words.',
            '- "gelisme": the development as one agenda line, at most 25 words, news style. Do not start with a city or place name; the place is written separately.',
            `- "bicim": the best format, one of: ${BICIMLER.join(", ")} (${BICIM_TARIFI}). Keep the proposal's format unless it clearly does not fit.`,
            "All text values are in Modern Standard Arabic. Keep facts, names and numbers; do not invent anything that is not in the proposal.",
            "examples shows how the planning desk edited earlier proposals; follow that style.",
            "Reply with the JSON object only.",
          ],
          ayar,
        ),
        kullanici,
        enCokCikti: 4000,
        json: true,
      };
    }
    /*
     * Başlığın (haber dosyasının) son gelişmeleri: internette arayıp kısa
     * bir takip paragrafı. Bizdeki son satırlar da gidiyor; model "bunu
     * zaten yazdık, yeni olan ne" diye yazsın. Bağlantıları model yazmıyor,
     * sağlayıcının alıntılarından kapı çıkarıyor (sonucCoz): uydurma kaynak
     * plana girmesin.
     */
    case "takipMetni": {
      if (!girdi || typeof girdi !== "object") return null;
      const g = girdi as Record<string, unknown>;
      const baslik = yazi(g.baslik, 200);
      const gun = [1, 3, 7].includes(Number(g.gun)) ? Number(g.gun) : 1;
      const bugun = /^\d{4}-\d{2}-\d{2}$/.test(String(g.bugun)) ? String(g.bugun) : "";
      if (!baslik || !bugun) return null;
      const gecmis = Array.isArray(g.gecmis) ? g.gecmis.map((x) => yazi(x, 600)).filter(Boolean).slice(0, 15) : [];
      return {
        sistem: yonergeli(
          [
            "You are a news researcher for the planning desk of an Arabic-language TV news channel based in Istanbul.",
            `Search the web for the latest developments on the given story during the last ${gun === 1 ? "24 hours" : `${gun} days`}. Today is ${bugun}.`,
            "Write one short paragraph, 3 to 5 sentences, in Modern Standard Arabic news style: what is new, most important first, with the date of each development.",
            "Use only what your sources say; no speculation, no opinion. Prefer reliable news agencies and outlets.",
            "our_coverage lists lines the desk has already written on this story; do not repeat them, focus on what happened since.",
            "If nothing significant happened in that period, say so in one sentence.",
            "Reply with the paragraph only: no heading, no list, no links, no source names in brackets.",
          ],
          ayar,
        ),
        kullanici: JSON.stringify({ story: baslik, period_days: gun, our_coverage: gecmis }),
        enCokCikti: 8000,
        arama: { alanlar: ayar?.alanlar ?? [] },
      };
    }
    /*
     * Haber değeri görüşü: ölçüt başına 1–5 puan ve kısa gerekçe, sonunda
     * genel kanaat. Yalnız tavsiye; kararı Planlama veriyor. Gerekçeler
     * isteyenin arayüz dilinde.
     */
    case "haberDegeri": {
      const o = oneriGirdisi(girdi);
      if (!o) return null;
      const g = girdi as Record<string, unknown>;
      const dil: Dil = DILLER.includes(g.dil as Dil) ? (g.dil as Dil) : "tr";
      const kriterler = ayar?.kriterler?.length ? ayar.kriterler : VARSAYILAN_KRITERLER[dil];
      const kullanici = JSON.stringify({ proposal: o, criteria: kriterler });
      if (kullanici.length > EN_UZUN_JSON_GIRDI) return null;
      return {
        sistem: yonergeli(
          [
            "You are a senior news editor at an Arabic-language TV news channel broadcasting from Istanbul. Assess the news value of a story proposal against the given criteria.",
            "This is advice for the planning desk, not a decision. Be honest and specific; judge only from the proposal and general knowledge, and say so when information is missing.",
            'Return a JSON object: {"kriterler": [{"ad": criterion name copied exactly, "puan": integer 1-5, "gerekce": one short sentence}], "genel": "yuksek" | "orta" | "dusuk", "ozet": two sentences at most}.',
            "Score every criterion in the given order.",
            `Write "gerekce" and "ozet" in ${DIL_ADI[dil]}.`,
            "Reply with the JSON object only.",
          ],
          ayar,
        ),
        kullanici,
        enCokCikti: 4000,
        json: true,
      };
    }
  }
};

/* Modelin yanıtındaki JSON nesnesi: kod bloğu ya da önünde arkasında yazı olsa da. */
const nesne = (metin: string): Record<string, unknown> | null => {
  const bas = metin.indexOf("{");
  const son = metin.lastIndexOf("}");
  if (bas < 0 || son <= bas) return null;
  try {
    const j = JSON.parse(metin.slice(bas, son + 1));
    return j && typeof j === "object" && !Array.isArray(j) ? j : null;
  } catch {
    return null;
  }
};

export interface BicimSonucu {
  haberBasligi: string;
  paketBasligi: string;
  gelisme: string;
  bicim?: (typeof BICIMLER)[number];
}
export interface DegerSonucu {
  kriterler: { ad: string; puan: number; gerekce: string }[];
  genel: "yuksek" | "orta" | "dusuk";
  ozet: string;
}

export interface TakipSonucu {
  metin: string;
  kaynaklar: Kaynak[];
}

/* Metne sızan bağlantılar ("([site](url))", "[ad](url)", çıplak adres) ayıklanıyor; kaynaklar ayrı listede. */
const baglantisiz = (m: string) =>
  m
    .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s*https?:\/\/\S+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

/** Sağlayıcının metninden tarayıcıya gidecek sonuç; beklenen biçimde değilse null ("bos"). */
export const sonucCoz = (ozellik: Ozellik, metin: string, kaynaklar: Kaynak[] = []): string | BicimSonucu | DegerSonucu | TakipSonucu | null => {
  if (ozellik === "kisalt") return metin.trim() || null;
  if (ozellik === "takipMetni") {
    const m = baglantisiz(metin);
    if (!m) return null;
    const goruldu = new Set<string>();
    const temiz = kaynaklar.filter((k) => /^https?:\/\//.test(k.url) && !goruldu.has(k.url) && goruldu.add(k.url)).slice(0, 10);
    return { metin: m.slice(0, 3000), kaynaklar: temiz.map((k) => ({ url: k.url.slice(0, 500), baslik: yazi(k.baslik, 200) })) };
  }
  const j = nesne(metin);
  if (!j) return null;
  if (ozellik === "bicimle") {
    const r: BicimSonucu = { haberBasligi: yazi(j.header, 300), paketBasligi: yazi(j.strap, 300), gelisme: yazi(j.gelisme, 1500) };
    if (!r.haberBasligi && !r.paketBasligi && !r.gelisme) return null;
    const b = yazi(j.bicim, 40) as (typeof BICIMLER)[number];
    return BICIMLER.includes(b) ? { ...r, bicim: b } : r;
  }
  const kriterler = (Array.isArray(j.kriterler) ? j.kriterler : []).slice(0, 20).flatMap((k) => {
    if (!k || typeof k !== "object") return [];
    const x = k as Record<string, unknown>;
    const puan = Math.round(Number(x.puan));
    const ad = yazi(x.ad, 200);
    return ad && puan >= 1 && puan <= 5 ? [{ ad, puan, gerekce: yazi(x.gerekce, 600) }] : [];
  });
  const genel = yazi(j.genel, 10) as DegerSonucu["genel"];
  if (!kriterler.length || !["yuksek", "orta", "dusuk"].includes(genel)) return null;
  return { kriterler, genel, ozet: yazi(j.ozet, 1200) };
};
