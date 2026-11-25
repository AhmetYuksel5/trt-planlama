import { kolSahibi } from "./akis";
import { MASA_KOLLARI, type BirimId, type Durum, type Gelisme, type IcerikTuru, type Paket } from "./veri";
import { birimAdiDilde } from "./yapi";

/*
 * Plan metninde masanın etiketi (kullanıcı: plana eklenen öneri ekonomi için
 * yapılıyorsa ekonomi etiketiyle plan metnine girsin, öbür birimler için de;
 * Weekly'de önceden vardı): kolu masanınsa (Ekonomi, Program, Spor) kolun
 * sahibi, masanın önerisiyse o masa, öneri bir masaya sorulup "Uygundur"
 * dendiyse o masa. Saklanmaz, kayıttan.
 */
export const masaBirimleri = (d: Pick<Durum, "masaSorulari" | "oneriler">, tur?: IcerikTuru, oneriId?: string): BirimId[] => {
  const m = new Set<BirimId>();
  if (tur && MASA_KOLLARI.includes(tur)) m.add(kolSahibi(tur));
  const o = oneriId ? d.oneriler.find((x) => x.id === oneriId) : undefined;
  if (o?.masa) m.add(o.masa);
  if (o && MASA_KOLLARI.includes(o.tur)) m.add(kolSahibi(o.tur));
  if (oneriId) for (const s of d.masaSorulari ?? []) if (s.oneriId === oneriId && s.cevap?.kabul) m.add(s.birim);
  return [...m];
};

/* Plan metninde her arayüz dilinde Arapça (çıktının dili). */
export const masaEtiketi = (d: Pick<Durum, "masaSorulari" | "oneriler">, tur?: IcerikTuru, oneriId?: string) =>
  masaBirimleri(d, tur, oneriId).map((b) => birimAdiDilde(b, "ar")).join(" · ");

/* Gelişmenin kolu önerisinden ya da Weekly kaleminden. */
export const gelismeMasaEtiketi = (d: Pick<Durum, "masaSorulari" | "oneriler" | "haftalik">, g: Gelisme) => {
  const kalem = g.haftalikKalemId ? d.haftalik.flatMap((h) => h.kalemler).find((k) => k.id === g.haftalikKalemId) : undefined;
  if (!g.oneriId && !kalem) return "";
  return masaEtiketi(d, kalem?.tur, g.oneriId ?? kalem?.oneriId);
};

/*
 * PKG'nin etiketi; aynı öneriden ya da Weekly kaleminden gelen gelişme aynı
 * başlıkta etiketini zaten taşıyorsa tekrar yazılmaz.
 */
export const paketMasaEtiketi = (d: Pick<Durum, "masaSorulari" | "oneriler" | "haftalik" | "gelismeler">, p: Paket) => {
  const e = masaEtiketi(d, p.tur, p.oneriId);
  if (!e) return "";
  const kardes = d.gelismeler.some(
    (g) =>
      g.planId === p.planId &&
      g.planBaslikId === p.planBaslikId &&
      ((p.oneriId && g.oneriId === p.oneriId) || (p.haftalikKalemId && g.haftalikKalemId === p.haftalikKalemId)) &&
      gelismeMasaEtiketi(d, g) === e,
  );
  return kardes ? "" : e;
};
