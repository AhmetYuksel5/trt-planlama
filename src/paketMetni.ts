import type { Durum, Masraf, MetinParcasi, Paket, ParcaTuru } from "./veri";

/*
 * Paketin metni yayındaki sırasıyla (kullanıcı: tamamlanmış paketin sayfasında
 * gereksiz bilgi değil, metnin kendisi dursun: Strap, intro, metin ve içindeki
 * röportajlar ve tercümeleri, en sonda stand). Saklanmaz, parçalardan kurulur.
 */

/* Eski parçada tür yok; muhabirin yazdığı addan tahmin edilir (INTRO, PTC, SOT, مقابلة…). */
/* Türkçe küçültme "INTRO"yu "ıntro" yapıyor: ı da i sayılır. */
const sade = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[أإآ]/g, "ا");

export const parcaTuru = (p: Pick<MetinParcasi, "tur" | "ad">): ParcaTuru => {
  if (p.tur) return p.tur;
  const a = sade(p.ad);
  if (/intro|giris|مقدم/.test(a)) return "intro";
  if (/stand|ptc|ستاند|ستند|وقفه/.test(a)) return "stand";
  if (/roportaj|interview|sot|مقابل|لقاء|حوار/.test(a)) return "roportaj";
  if (/gfx|grafik|graphic|جرافيك|غرافيك/.test(a)) return "gfx";
  return "metin";
};

export type SenaryoTuru = "strap" | Exclude<ParcaTuru, "gfx">;
export interface SenaryoParcasi {
  tur: SenaryoTuru;
  metin: string;
  asil?: string;
  id: string;
}

const SIRA: Record<SenaryoTuru, number> = { strap: 0, intro: 1, metin: 2, roportaj: 2, stand: 3 };

/*
 * Strap → intro → metin (röportajlar girildiği yerde, metnin içinde) → stand.
 * Gfx yayın metni değil, grafiğin içeriği; kendi kutusunda kalıyor. Parçasız
 * pakette birleşik metin tek parça.
 */
export const paketSenaryosu = (p: Pick<Paket, "id" | "baslik" | "parcalar" | "metin">): SenaryoParcasi[] => {
  const l: SenaryoParcasi[] = [{ tur: "strap", metin: p.baslik, id: `${p.id}-strap` }];
  if (p.parcalar?.length) {
    const parcalar = p.parcalar
      .map((x, i) => ({ x, i, tur: parcaTuru(x) }))
      .filter((y) => y.tur !== "gfx")
      .sort((a, b) => SIRA[a.tur as SenaryoTuru] - SIRA[b.tur as SenaryoTuru] || a.i - b.i);
    for (const { x, tur } of parcalar) l.push({ tur: tur as SenaryoTuru, metin: x.metin, ...(x.asil && { asil: x.asil }), id: x.id });
  } else if (p.metin?.trim()) l.push({ tur: "metin", metin: p.metin, id: `${p.id}-metin` });
  return l;
};

/* --- Ek masraflar --- */

/* Muhabir Muhasebe'nin tanımlarını okuyamıyor (gerçek kipte gizli): tanım yoksa bu üçü. */
export const VARSAYILAN_PARALAR = ["USD", "EUR", "TRY"];

export const paraBirimleri = (d: Pick<Durum, "muhasebeTanimlari">): string[] => {
  const tanimli = (d.muhasebeTanimlari ?? []).filter((t) => t.tur === "para").map((t) => t.ad);
  return [...new Set([...tanimli, ...VARSAYILAN_PARALAR])];
};

/** Para birimine göre toplam ("120 USD · 40 EUR"). */
export const masrafToplami = (l: Masraf[]): { para: string; tutar: number }[] => {
  const m = new Map<string, number>();
  for (const x of l) m.set(x.para, (m.get(x.para) ?? 0) + x.tutar);
  return [...m].map(([para, tutar]) => ({ para, tutar }));
};

export const masrafYaz = (l: { para: string; tutar: number }[]) => l.map((x) => `${Math.round(x.tutar * 100) / 100} ${x.para}`).join(" · ");
