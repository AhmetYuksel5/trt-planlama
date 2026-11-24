import { useSyncExternalStore } from "react";
import { metin, yaz, type Dil } from "../dil";
import { GERCEK } from "../kip";
import { bugun } from "../tarih";
import type { Kisi } from "../veri";
import { kapiIstek } from "../yz";
import { ARAC_YURUTUCULERI, onayYaniti, type AracBaglami, type AracSonucu } from "./araclar";

/*
 * Asistanın döngüsü (belgeler/asistan.md). Konuşma Anthropic ileti biçiminde tutuluyor; kapı her
 * turda konuşmayı modele götürüp yanıtı (metin + araç istekleri) döndürüyor, araçları burada kişinin
 * kendi yetkisiyle çalıştırıyoruz. Yazma aracında döngü durur, kişiye sorulur; kişi "evet" yazınca
 * (ya da onay düğmesine basınca) iş yapılır, başka bir şey yazınca vazgeçilir.
 *
 * Konuşma sekmeye bağlı (sessionStorage): kayda girmez, kapıda saklanmaz.
 * Demoda kapıya gidilmez; uçtan uca test `window.__asistanModeli` ile sahte model verir.
 */

type Blok =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
export interface Ileti {
  role: "user" | "assistant";
  content: string | Blok[];
}
export interface Gorunen {
  tur: "kisi" | "asistan" | "onay" | "bilgi" | "hata";
  metin: string;
  durum?: "bekliyor" | "yapildi" | "vazgecildi";
}
interface Bekleyen {
  arac: Extract<Blok, { type: "tool_use" }>;
  sonuclar: Extract<Blok, { type: "tool_result" }>[];
  kalan: Extract<Blok, { type: "tool_use" }>[];
}
interface Hal {
  mesajlar: Ileti[];
  gorunen: Gorunen[];
  bekleyen: Bekleyen | null;
  mesgul: boolean;
}
export type ModelYaniti = { icerik: Blok[] } | { hata: string; ayrinti?: string };
export type Model = (mesajlar: Ileti[], baglam: Record<string, string>) => Promise<ModelYaniti>;

const ANAHTAR = "trt-planlama-asistan";
const EN_COK_TUR = 8;

const oku = (): Hal => {
  try {
    const h = JSON.parse(sessionStorage.getItem(ANAHTAR) ?? "null") as Hal | null;
    // Onay bekleyen iş yeniden yüklemede sürmez: çalıştırılacak işlev saklanamıyor, soru düşer.
    if (h) return { ...h, bekleyen: null, mesgul: false, gorunen: h.gorunen.map((g) => (g.durum === "bekliyor" ? { ...g, durum: "vazgecildi" } : g)) };
  } catch {
    /* bozuk ya da yok */
  }
  return { mesajlar: [], gorunen: [], bekleyen: null, mesgul: false };
};
let hal: Hal = oku();
const dinleyiciler = new Set<() => void>();
const degis = (y: Partial<Hal>) => {
  hal = { ...hal, ...y };
  try {
    sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...hal, bekleyen: null }));
  } catch {
    /* saklanamazsa yalnız bu açılışta */
  }
  dinleyiciler.forEach((f) => f());
};
export const useAsistan = () =>
  useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => hal,
  );
export const konusmayiTemizle = () => degis({ mesajlar: [], gorunen: [], bekleyen: null, mesgul: false });

declare global {
  interface Window {
    __asistanModeli?: Model;
  }
}

const kapiModeli: Model = async (mesajlar, baglam) => {
  const r = await kapiIstek<{ icerik: Blok[] }>("/asistan", "POST", { mesajlar, baglam });
  return r.tamam ? { icerik: r.veri.icerik } : { hata: r.hata, ...(r.ayrinti ? { ayrinti: r.ayrinti } : {}) };
};
const model = (): Model | null => window.__asistanModeli ?? (GERCEK ? kapiModeli : null);
export const asistanHazir = () => !!model();

interface Oturum {
  ben: Kisi;
  dil: Dil;
  git: (yol: string) => void;
  baglam: Record<string, string>;
}

const sonucMetni = (s: AracSonucu) => JSON.stringify(s).slice(0, 12000);

const hataMetni = (dil: Dil, h: string, ayrinti?: string) =>
  `${metin(h === "gunlukSinir" ? "asSinir" : h === "kapali" ? "asKapali" : "asHata", dil)}${ayrinti ? ` (${ayrinti})` : ""}`;

/*
 * Bir turun araçlarını sırayla çalıştırır; yazma aracına gelince durur ve kişiye sorar.
 * Dönüş: bütün sonuçlar hazırsa onlar, durduysa null.
 */
const araclariCalistir = (araclar: Extract<Blok, { type: "tool_use" }>[], onceki: Extract<Blok, { type: "tool_result" }>[], o: Oturum) => {
  const sonuclar = [...onceki];
  const b: AracBaglami = { ben: o.ben, dil: o.dil, git: o.git };
  for (let i = 0; i < araclar.length; i++) {
    const a = araclar[i];
    const y = ARAC_YURUTUCULERI[a.name];
    if (!y) {
      sonuclar.push({ type: "tool_result", tool_use_id: a.id, content: sonucMetni({ hata: "arac" }), is_error: true });
      continue;
    }
    let r;
    try {
      r = y(a.input ?? {}, b);
    } catch {
      r = { sonuc: { hata: "calismadi" } };
    }
    if ("sonuc" in r) {
      sonuclar.push({ type: "tool_result", tool_use_id: a.id, content: sonucMetni(r.sonuc), ...(r.sonuc.hata ? { is_error: true } : {}) });
      continue;
    }
    bekleyenIs = r.calistir;
    degis({ bekleyen: { arac: a, sonuclar, kalan: araclar.slice(i + 1) }, gorunen: [...hal.gorunen, { tur: "onay", metin: r.onay, durum: "bekliyor" }] });
    return null;
  }
  return sonuclar;
};
// Onay bekleyen işin kendisi bellekte (işlev saklanamıyor).
let bekleyenIs: (() => AracSonucu) | null = null;

/* Model metinle bitirene ya da yazma aracında durana dek tur tur. */
const dongu = async (o: Oturum) => {
  const m = model();
  if (!m) {
    degis({ mesgul: false, gorunen: [...hal.gorunen, { tur: "bilgi", metin: metin("asDemo", o.dil) }] });
    return;
  }
  for (let tur = 0; tur < EN_COK_TUR; tur++) {
    const y = await m(hal.mesajlar, o.baglam).catch(() => ({ hata: "baglanti" }) as ModelYaniti);
    if ("hata" in y) {
      degis({ mesgul: false, gorunen: [...hal.gorunen, { tur: "hata", metin: hataMetni(o.dil, y.hata, y.ayrinti) }] });
      return;
    }
    const icerik = y.icerik.filter((b) => b.type === "text" || b.type === "tool_use");
    const yazi = icerik.flatMap((b) => (b.type === "text" && b.text.trim() ? [b.text.trim()] : [])).join("\n\n");
    const araclar = icerik.filter((b): b is Extract<Blok, { type: "tool_use" }> => b.type === "tool_use");
    degis({
      mesajlar: icerik.length ? [...hal.mesajlar, { role: "assistant", content: icerik }] : hal.mesajlar,
      gorunen: yazi ? [...hal.gorunen, { tur: "asistan", metin: yazi }] : hal.gorunen,
    });
    if (!araclar.length) {
      degis({ mesgul: false });
      return;
    }
    const sonuclar = araclariCalistir(araclar, [], o);
    if (!sonuclar) {
      degis({ mesgul: false });
      return;
    }
    degis({ mesajlar: [...hal.mesajlar, { role: "user", content: sonuclar }] });
  }
  degis({ mesgul: false, gorunen: [...hal.gorunen, { tur: "hata", metin: metin("asUzun", o.dil) }] });
};

/*
 * Bekleyen yazma işini sonuçlandırır. Evet: iş yapılır. Hayır ya da başka bir istek: vazgeçilir;
 * başka istekse o metin aynı iletide modele gider (araç sonuçlarının arkasında).
 */
const bekleyeniBitir = (o: Oturum, evet: boolean, ek?: string) => {
  const b = hal.bekleyen!;
  const sonuc: AracSonucu = evet && bekleyenIs ? bekleyenIs() : { vazgecti: true };
  bekleyenIs = null;
  const gorunen = hal.gorunen.map((g, i, l) =>
    g.tur === "onay" && g.durum === "bekliyor" && i === l.map((x) => x.tur).lastIndexOf("onay") ? { ...g, durum: (evet && !sonuc.hata ? "yapildi" : "vazgecildi") as Gorunen["durum"] } : g,
  );
  degis({ bekleyen: null, gorunen });
  const sonuclar = [...b.sonuclar, { type: "tool_result" as const, tool_use_id: b.arac.id, content: sonucMetni(sonuc), ...(sonuc.hata ? { is_error: true } : {}) }];
  // Aynı turdaki öbür araçlar: kişi vazgeçtiyse onlar da çalışmaz (birbirine bağlı olabilir).
  const kalanlar = evet ? araclariCalistir(b.kalan, sonuclar, o) : [...sonuclar, ...b.kalan.map((a) => ({ type: "tool_result" as const, tool_use_id: a.id, content: sonucMetni({ vazgecti: true }) }))];
  if (!kalanlar) return false;
  degis({ mesajlar: [...hal.mesajlar, { role: "user", content: [...kalanlar, ...(ek ? [{ type: "text" as const, text: ek }] : [])] }] });
  return true;
};

/** Kişinin iletisi. Onay bekliyorsa "evet/hayır" onu sonuçlandırır; düğme de buraya gelir. */
export const asistanaYaz = async (yazi: string, o: Omit<Oturum, "baglam">, onayDugmesi?: boolean) => {
  const m = yazi.trim();
  if ((!m && onayDugmesi === undefined) || hal.mesgul) return;
  const baglam = { bugun: bugun(), dil: o.dil, sayfa: location.hash || "#/", kisi: yaz(o.ben.ad, "tr"), birim: o.ben.birim };
  const oturum = { ...o, baglam };
  if (hal.bekleyen) {
    const karar = onayDugmesi === undefined ? onayYaniti(m) : onayDugmesi ? "evet" : "hayir";
    if (m) degis({ gorunen: [...hal.gorunen, { tur: "kisi", metin: m }] });
    degis({ mesgul: true });
    if (!bekleyeniBitir(oturum, karar === "evet", karar === null ? m : undefined)) {
      degis({ mesgul: false });
      return;
    }
    await dongu(oturum);
    return;
  }
  degis({ mesgul: true, mesajlar: [...hal.mesajlar, { role: "user", content: m }], gorunen: [...hal.gorunen, { tur: "kisi", metin: m }] });
  await dongu(oturum);
};
