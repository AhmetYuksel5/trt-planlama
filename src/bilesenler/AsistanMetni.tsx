import { Fragment, type ReactNode } from "react";

/*
 * Asistanın yanıtı (kullanıcı: "**…**" yıldızlarıyla görünüyordu): model Markdown yazıyor.
 * Küçük ve güvenli çevirici: HTML enjekte edilmez, yalnız React düğümleri. Tanınanlar
 * kalın (**x**, __x__), eğik (*x*, _x_), kod (`x`), madde (- , * , • , 1. ) ve başlık
 * satırı (#…). Tanınmayan işaret düz metin kalır.
 */

const SATIR_ICI = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\s][^*\n]*\*|(?<![\p{L}\p{N}])_[^_\s][^_\n]*_(?![\p{L}\p{N}]))/u;

export const satirIci = (s: string): ReactNode[] =>
  s.split(SATIR_ICI).map((p, i) => {
    if (i % 2 === 0) return p;
    if (p.startsWith("**") || p.startsWith("__")) return <b key={i}>{satirIci(p.slice(2, -2))}</b>;
    if (p.startsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <i key={i}>{satirIci(p.slice(1, -1))}</i>;
  });

type Blok = { tur: "p"; metin: string } | { tur: "h"; metin: string } | { tur: "ul"; ogeler: string[] } | { tur: "ol"; ogeler: string[] };

export const bloklar = (metin: string): Blok[] => {
  const sonuc: Blok[] = [];
  for (const ham of metin.replace(/\r/g, "").split("\n")) {
    const s = ham.trim();
    const son = sonuc[sonuc.length - 1];
    const madde = s.match(/^(?:[-*•])\s+(.*)$/);
    const sira = s.match(/^\d+[.)]\s+(.*)$/);
    if (madde || sira) {
      const tur = madde ? "ul" : "ol";
      const oge = (madde ?? sira)![1];
      if (son && son.tur === tur) son.ogeler.push(oge);
      else sonuc.push({ tur, ogeler: [oge] });
    } else if (/^#{1,6}\s+/.test(s)) sonuc.push({ tur: "h", metin: s.replace(/^#{1,6}\s+/, "") });
    else if (!s) {
      if (son && !(son.tur === "p" && !son.metin)) sonuc.push({ tur: "p", metin: "" });
    } else if (son && son.tur === "p" && son.metin) son.metin += `\n${s}`;
    else sonuc.push({ tur: "p", metin: s });
  }
  return sonuc.filter((b) => !(b.tur === "p" && !b.metin));
};

const blokCiz = (b: Blok, i: number): ReactNode => {
  if (b.tur === "ul" || b.tur === "ol") {
    const ogeler = b.ogeler.map((o, j) => <li key={j}>{satirIci(o)}</li>);
    return b.tur === "ul" ? <ul key={i}>{ogeler}</ul> : <ol key={i}>{ogeler}</ol>;
  }
  if (b.tur === "h")
    return (
      <p key={i} className="asistan-metin-baslik">
        <b>{satirIci(b.metin)}</b>
      </p>
    );
  return (
    <p key={i}>
      {b.metin.split("\n").map((s, j) => (
        <Fragment key={j}>
          {j > 0 && <br />}
          {satirIci(s)}
        </Fragment>
      ))}
    </p>
  );
};

export function AsistanMetni({ metin }: { metin: string }) {
  return <div className="asistan-metin">{bloklar(metin).map(blokCiz)}</div>;
}
