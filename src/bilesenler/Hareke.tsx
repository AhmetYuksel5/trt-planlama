import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

/*
 * Harekeler kırmızı (kullanıcı: dil denetimi harekeliyor, harekeler kırmızı
 * görünsün). Harekeyi ayrı <span>'a koyup boyamak işe yaramıyor: tarayıcı harf
 * ve harekeyi tek parça çiziyor, renk harfin renginde kalıyor (Chrome'da
 * denendi). Bunun yerine iki katman üst üste: altta metnin tamamı kırmızı,
 * üstte harekesi silinmiş hali metin renginde. Hareke eni sıfır olduğu için
 * harfler tam üst üste düşer; açıkta yalnız harekeler kalır. Yalnız ekranda;
 * kayıt, çıktı ve posta düz metin.
 */
const HAREKE = /[ً-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/g;
export const harekesiz = (s: string) => s.replace(HAREKE, "");
const harekeliMi = (s: string) => s.search(HAREKE) >= 0;

/** Okunur metin: harekesi varsa iki katman, yoksa düz. */
export function HarekeliMetin({ metin }: { metin: string }) {
  if (!harekeliMi(metin)) return <>{metin}</>;
  return (
    <span className="hareke-kat">
      {/* Ekran okuyucu ve kopyalama alttaki tam metni alır; üstteki yalnız görüntü. */}
      <span className="hareke-alt">{metin}</span>
      <span className="hareke-ust" aria-hidden="true">
        {harekesiz(metin)}
      </span>
    </span>
  );
}

/*
 * Yazı alanı: dil denetmeni yazarken eklediği hareke anında kırmızı görünür.
 * Alanın kendi yazısı saydam (imleç ve seçim görünür); arkadaki iki katman
 * alanın o anki ölçülerini kopyalar: yazı alanının stili sayfaya göre değişiyor
 * (telefonda 16 piksel, formda başka satır aralığı), sabit CSS kayardı. Alan
 * metinle uzar, içinde kaydırma olmaz.
 */
const KOPYA = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "wordSpacing", "paddingTop", "paddingBottom", "paddingInlineStart", "paddingInlineEnd", "borderTopWidth", "borderBottomWidth", "borderInlineStartWidth", "borderInlineEndWidth", "marginTop", "marginBottom", "marginInlineStart", "marginInlineEnd", "borderRadius"] as const;

export function HarekeliAlan(p: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const alan = useRef<HTMLTextAreaElement>(null);
  const alt = useRef<HTMLDivElement>(null);
  const ust = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const a = alan.current;
    if (!a) return;
    const s = getComputedStyle(a);
    for (const k of [alt.current, ust.current]) {
      if (!k) continue;
      for (const o of KOPYA) k.style[o] = s[o];
      k.style.borderStyle = "solid";
      k.style.borderColor = "transparent";
    }
  });
  return (
    <div className="hareke-alan">
      <div className="hareke-alt" ref={alt} aria-hidden="true">
        {p.value + "\n"}
      </div>
      <div className="hareke-ust" ref={ust} aria-hidden="true">
        {harekesiz(p.value) + "\n"}
      </div>
      <textarea {...p} ref={alan} />
    </div>
  );
}
