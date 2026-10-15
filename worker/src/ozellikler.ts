import type { Ozellik } from "./ayar.ts";

/*
 * Her özelliğin sağlayıcıya giden yönergesi ve girdisinin denetimi. Yönerge
 * sağlayıcıdan bağımsız: aynı metin Claude'a da OpenAI uyumlu uca da gidiyor.
 */

export interface Istek {
  sistem: string;
  kullanici: string;
  enCokCikti: number;
}

const EN_UZUN_GIRDI = 4000;

export const istekKur = (ozellik: Ozellik, girdi: unknown): Istek | null => {
  const metin = girdi && typeof girdi === "object" && typeof (girdi as { metin?: unknown }).metin === "string" ? (girdi as { metin: string }).metin.trim() : "";
  if (!metin || metin.length > EN_UZUN_GIRDI) return null;
  switch (ozellik) {
    /*
     * Plan satırı "YER / gelişme" biçiminde; muhabirin uzun açıklaması o
     * satıra sığmıyor, producer'lar elle kısaltıyordu. Yer ayrı alanda
     * yazıldığı için cümlede tekrar edilmiyor.
     */
    case "kisalt":
      return {
        sistem: [
          "You are a planning editor at an Arabic-language TV newsroom.",
          "Rewrite the news development you are given as a single short line for the daily news agenda, in Modern Standard Arabic news style.",
          "Keep the facts, names and numbers that matter; do not add information, opinion or attribution that is not in the text.",
          "Aim for at most 20 words. Do not start with a city or place name, the place is written separately.",
          "Reply with the line only: no quotes, no labels, no explanation.",
        ].join(" "),
        kullanici: metin,
        // Akıl yürüten modellerde düşünme de bu paydan yiyor; küçük kalınca yanıt boş dönüyordu.
        enCokCikti: 4000,
      };
  }
};
