import { useSyncExternalStore } from "react";
import { metin, yaz, type Anahtar, type Dil } from "../dil";
import { GERCEK } from "../kip";
import { bugun } from "../tarih";
import { getir, type Kisi } from "../veri";
import { ekranBaglami } from "./ekran";
import { kapiIstek } from "../yz";
import { ARAC_YURUTUCULERI, eksikAlanlar, onayYaniti, type AracBaglami, type AracSonucu, type Deger, type Degerler, type Form, type FormAlani } from "./araclar";

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
  durum?: "bekliyor" | "yapildi" | "vazgecildi" | "hata";
  /* Onay kartı: işin formu (alanlar, kişinin değiştirdiği değerler) ve kaydın adı. */
  alanlar?: FormAlani[];
  degerler?: Degerler;
  ozet?: string;
  dugme?: Anahtar;
  eksik?: string[];
  /* Toplu onay (kullanıcı: "beş öneriyi plana ekle" beş ayrı kart açıyordu): aynı turun yazma işleri tek kartta, satır satır seçilir. */
  isler?: TopluIs[];
}
export interface TopluIs {
  metin: string;
  ozet?: string;
  alanlar: FormAlani[];
  degerler: Degerler;
  secili: boolean;
  eksik?: string[];
  durum?: "yapildi" | "vazgecildi" | "hata";
}
type AracIstegi = Extract<Blok, { type: "tool_use" }>;
type AracSonucBlogu = Extract<Blok, { type: "tool_result" }>;
interface Bekleyen {
  araclar: AracIstegi[];
  sonuclar: AracSonucBlogu[];
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
// Çok adımlı işler (önce oku, sonra birkaç yazma) sekiz turda kesiliyordu.
const EN_COK_TUR = 12;

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
  `${metin(h === "gunlukSinir" ? "asSinir" : h === "kapali" ? "asKapali" : h === "kota" ? "kapiKota" : "asHata", dil)}${ayrinti ? ` (${ayrinti})` : ""}`;

// Onay bekleyen işlerin kendisi bellekte (işlev saklanamıyor); sıra kartın satırlarıyla aynı.
let bekleyenFormlar: Form[] = [];

/*
 * Bir turun araçları: okuma araçları hemen (eşzamansız olabilir: Gündem taraması), yazma araçları
 * formlarıyla toplanır. Yazma yoksa sonuçlar döner; varsa tek kart açılır (bir iş tek form, birkaç
 * iş toplu liste) ve null döner.
 */
const araclariCalistir = async (araclar: AracIstegi[], o: Oturum): Promise<AracSonucBlogu[] | null> => {
  const sonuclar: AracSonucBlogu[] = [];
  const yazma: { arac: AracIstegi; form: Form }[] = [];
  const b: AracBaglami = { ben: o.ben, dil: o.dil, git: o.git };
  for (const a of araclar) {
    const y = ARAC_YURUTUCULERI[a.name];
    if (!y) {
      sonuclar.push({ type: "tool_result", tool_use_id: a.id, content: sonucMetni({ hata: "arac" }), is_error: true });
      continue;
    }
    let r;
    try {
      r = await y(a.input ?? {}, b);
    } catch {
      r = { sonuc: { hata: "calismadi" } };
    }
    if ("sonuc" in r) sonuclar.push({ type: "tool_result", tool_use_id: a.id, content: sonucMetni(r.sonuc), ...(r.sonuc.hata ? { is_error: true } : {}) });
    else yazma.push({ arac: a, form: r.form });
  }
  if (!yazma.length) return sonuclar;
  bekleyenFormlar = yazma.map((x) => x.form);
  const kart: Gorunen =
    yazma.length === 1
      ? (() => {
          const f = yazma[0].form;
          return { tur: "onay", metin: metin(f.baslik, o.dil), durum: "bekliyor", alanlar: f.alanlar, degerler: f.degerler, ...(f.ozet ? { ozet: f.ozet } : {}), ...(f.dugme ? { dugme: f.dugme } : {}) };
        })()
      : {
          tur: "onay",
          metin: metin("asTopluBaslik", o.dil, { n: String(yazma.length) }),
          durum: "bekliyor",
          isler: yazma.map(({ form: f }) => ({ metin: metin(f.baslik, o.dil), ...(f.ozet ? { ozet: f.ozet } : {}), alanlar: f.alanlar, degerler: f.degerler, secili: true })),
        };
  degis({ bekleyen: { araclar: yazma.map((x) => x.arac), sonuclar }, gorunen: [...hal.gorunen, kart] });
  return null;
};

const bekleyenSira = () => hal.gorunen.map((g) => g.tur === "onay" && g.durum === "bekliyor").lastIndexOf(true);

const kartiGuncelle = (f: (g: Gorunen) => Gorunen) => {
  const i = bekleyenSira();
  if (i < 0 || !hal.bekleyen) return;
  degis({ gorunen: hal.gorunen.map((g, j) => (j === i ? f(g) : g)) });
};

/** Onay kartındaki alanın değişmesi: kişi formu düzeltiyor, iş onaylanınca bu değerlerle yapılır. Toplu kartta `sira` işin satırı. */
export const onayDegeri = (ad: string, deger: Deger, sira?: number) =>
  kartiGuncelle((g) =>
    sira === undefined || !g.isler
      ? { ...g, degerler: { ...g.degerler, [ad]: deger }, eksik: g.eksik?.filter((x) => x !== ad) }
      : { ...g, isler: g.isler.map((x, k) => (k === sira ? { ...x, degerler: { ...x.degerler, [ad]: deger }, eksik: x.eksik?.filter((y) => y !== ad) } : x)) },
  );
/** Toplu kartta işin yapılıp yapılmayacağı. */
export const isSecimi = (sira: number, secili: boolean) => kartiGuncelle((g) => (g.isler ? { ...g, isler: g.isler.map((x, k) => (k === sira ? { ...x, secili } : x)) } : g));

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
    const araclar = icerik.filter((b): b is AracIstegi => b.type === "tool_use");
    degis({
      mesajlar: icerik.length ? [...hal.mesajlar, { role: "assistant", content: icerik }] : hal.mesajlar,
      gorunen: yazi ? [...hal.gorunen, { tur: "asistan", metin: yazi }] : hal.gorunen,
    });
    if (!araclar.length) {
      degis({ mesgul: false });
      return;
    }
    const sonuclar = await araclariCalistir(araclar, o);
    if (!sonuclar) {
      degis({ mesgul: false });
      return;
    }
    degis({ mesajlar: [...hal.mesajlar, { role: "user", content: sonuclar }] });
  }
  degis({ mesgul: false, gorunen: [...hal.gorunen, { tur: "hata", metin: metin("asUzun", o.dil) }] });
};

/* Bir işi formun son haliyle yapar; model kişinin değiştirdiği son hali bilsin (sonraki adımda eski değeri kullanmasın). */
const isiYap = async (f: Form, degerler: Degerler): Promise<AracSonucu> => {
  let sonuc: AracSonucu;
  try {
    sonuc = await f.calistir(degerler);
  } catch {
    sonuc = { hata: "calismadi" };
  }
  return { ...sonuc, degerler };
};
const sonucBlogu = (a: AracIstegi, s: AracSonucu): AracSonucBlogu => ({ type: "tool_result", tool_use_id: a.id, content: sonucMetni(s), ...(s.hata ? { is_error: true } : {}) });

/*
 * Bekleyen yazma işlerini sonuçlandırır. Evet: seçili işlerin zorunlu alanları doluysa işler sırayla
 * yapılır (eksikse kart eksikleri işaretler, hiçbiri yapılmaz). Hayır ya da başka bir istek:
 * vazgeçilir; başka istekse o metin aynı iletide modele gider (araç sonuçlarının arkasında).
 */
const bekleyeniBitir = async (evet: boolean, ek?: string): Promise<"eksik" | "surdu"> => {
  const b = hal.bekleyen!;
  const i = bekleyenSira();
  const kart = hal.gorunen[i];
  const formlar = bekleyenFormlar;
  const toplu = !!kart?.isler;
  const isler = toplu ? kart.isler! : [{ metin: kart?.metin ?? "", alanlar: kart?.alanlar ?? [], degerler: kart?.degerler ?? {}, secili: true } as TopluIs];
  if (evet) {
    const eksikler = isler.map((x, k) => (x.secili && formlar[k] ? eksikAlanlar(formlar[k].alanlar, x.degerler) : []));
    if (eksikler.some((e) => e.length)) {
      degis({ gorunen: hal.gorunen.map((g, j) => (j !== i ? g : toplu ? { ...g, isler: g.isler!.map((x, k) => ({ ...x, eksik: eksikler[k] })) } : { ...g, eksik: eksikler[0] })) });
      return "eksik";
    }
  }
  const sonuclar: AracSonucu[] = [];
  for (let k = 0; k < b.araclar.length; k++) sonuclar.push(evet && isler[k]?.secili && formlar[k] ? await isiYap(formlar[k], isler[k].degerler) : { vazgecti: true });
  bekleyenFormlar = [];
  const isDurumu = (s: AracSonucu): TopluIs["durum"] => (s.vazgecti ? "vazgecildi" : s.hata ? "hata" : "yapildi");
  const durum: Gorunen["durum"] = !evet ? "vazgecildi" : toplu ? (sonuclar.some((s) => !s.vazgecti && !s.hata) ? "yapildi" : sonuclar.every((s) => s.vazgecti) ? "vazgecildi" : "hata") : isDurumu(sonuclar[0]);
  degis({
    bekleyen: null,
    gorunen: hal.gorunen.map((g, j) => (j !== i ? g : { ...g, durum, eksik: undefined, ...(toplu ? { isler: g.isler!.map((x, k) => ({ ...x, eksik: undefined, durum: isDurumu(sonuclar[k]) })) } : {}) })),
  });
  const bloklar = [...b.sonuclar, ...b.araclar.map((a, k) => sonucBlogu(a, sonuclar[k]))];
  degis({ mesajlar: [...hal.mesajlar, { role: "user", content: [...bloklar, ...(ek ? [{ type: "text" as const, text: ek }] : [])] }] });
  return "surdu";
};

/** Kişinin iletisi. Onay bekliyorsa "evet/hayır" onu sonuçlandırır; düğme de buraya gelir. */
export const asistanaYaz = async (yazi: string, o: Omit<Oturum, "baglam">, onayDugmesi?: boolean) => {
  const m = yazi.trim();
  if ((!m && onayDugmesi === undefined) || hal.mesgul) return;
  const baglam = { bugun: bugun(), dil: o.dil, sayfa: location.hash || "#/", kisi: yaz(o.ben.ad, "tr"), birim: o.ben.birim, ekran: ekranBaglami(getir()) };
  const oturum = { ...o, baglam };
  if (hal.bekleyen) {
    const karar = onayDugmesi === undefined ? onayYaniti(m) : onayDugmesi ? "evet" : "hayir";
    if (m) degis({ gorunen: [...hal.gorunen, { tur: "kisi", metin: m }] });
    degis({ mesgul: true });
    const r = await bekleyeniBitir(karar === "evet", karar === null ? m : undefined);
    if (r === "eksik") {
      degis({ mesgul: false, gorunen: [...hal.gorunen, { tur: "bilgi", metin: metin("asEksik", o.dil) }] });
      return;
    }
    await dongu(oturum);
    return;
  }
  degis({ mesgul: true, mesajlar: [...hal.mesajlar, { role: "user", content: m }], gorunen: [...hal.gorunen, { tur: "kisi", metin: m }] });
  await dongu(oturum);
};
