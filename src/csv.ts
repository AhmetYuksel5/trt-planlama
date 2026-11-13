import type { Dil } from "./dil";

/*
 * Excel'in açtığı CSV (raporlar, Muhasebe): ortak kural. UTF-8 BOM olmadan
 * Excel Arapça ve Türkçe harfleri bozuyor. Ayırıcı Türkçe arayüzde noktalı
 * virgül (Türkçe bölge ayarlı Excel virgülü ondalık sayıyor), öbür dillerde
 * virgül. Önce iki sayfada iki ayrı kod vardı; Muhasebe her dilde virgül
 * yazıyordu, Türkçe Excel tek sütunda açıyordu.
 */
export function csvMetni(satirlar: (string | number | null | undefined)[][], dil: Dil): string {
  const ayirac = dil === "tr" ? ";" : ",";
  const hucre = (x: string | number | null | undefined) => {
    const s = x === null || x === undefined ? "" : String(x);
    return /[";,\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + satirlar.map((s) => s.map(hucre).join(ayirac)).join("\r\n");
}
