import { CALISMA_BICIMLERI, SEHIRLER, type CalismaBicimi, type Sehir } from "./veri";

/**
 * Kurumun muhabir listesini (Excel) gerçek kipe hesapsız kişi olarak almak.
 *
 * Liste gerçek kişilerin bilgisi: depoya ya da derlenmiş koda girmiyor,
 * yönetici dosyayı tarayıcıda seçiyor ve kişiler doğrudan ortak kayda
 * yazılıyor. Pasaport, cinsiyet, doğum tarihi gibi sütunlar okunmuyor;
 * planlamanın ihtiyacı yok.
 *
 * Saf: dosyayı satırlara çeviren okuyucu ve satırları kişi taslağına
 * çeviren eşleştirme; kaydı eylemler.ts → hesapsizKisilerEkle yazıyor.
 */

/* --- .xlsx okuyucu: zip + XML; kitaplık yok, tarayıcının DecompressionStream'i --- */

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

const zipAc = async (veri: ArrayBuffer): Promise<Map<string, () => Promise<string>>> => {
  const b = new Uint8Array(veri);
  // Merkezî dizinin sonu: dosyanın sonundan geriye "PK\x05\x06".
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--)
    if (u32(b, i) === 0x06054b50) {
      son = i;
      break;
    }
  if (son < 0) throw new Error("zip");
  const adet = u16(b, son + 10);
  let p = u32(b, son + 16);
  const dosyalar = new Map<string, () => Promise<string>>();
  const coz = new TextDecoder();
  for (let n = 0; n < adet; n++) {
    const yontem = u16(b, p + 10);
    const boy = u32(b, p + 20);
    const adBoy = u16(b, p + 28);
    const ekBoy = u16(b, p + 30);
    const notBoy = u16(b, p + 32);
    const yerel = u32(b, p + 42);
    const ad = coz.decode(b.subarray(p + 46, p + 46 + adBoy));
    p += 46 + adBoy + ekBoy + notBoy;
    const bas = yerel + 30 + u16(b, yerel + 26) + u16(b, yerel + 28);
    const ham = b.subarray(bas, bas + boy);
    dosyalar.set(ad, async () => {
      if (yontem === 0) return coz.decode(ham);
      const akis = new Blob([ham]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return coz.decode(await new Response(akis).arrayBuffer());
    });
  }
  return dosyalar;
};

const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");

/* "AB12" → 27 (sıfırdan sütun) */
const sutun = (ref: string) => {
  let n = 0;
  for (const c of ref.replace(/\d+$/, "")) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

/** İlk çalışma sayfasının satırları; her hücre düz metin. */
export const xlsxOku = async (veri: ArrayBuffer): Promise<string[][]> => {
  const zip = await zipAc(veri);
  const oku = async (ad: string) => (zip.has(ad) ? zip.get(ad)!() : "");
  const ortak = [...xml(await oku("xl/sharedStrings.xml")).getElementsByTagName("si")].map((si) =>
    [...si.getElementsByTagName("t")].map((t) => t.textContent ?? "").join(""),
  );
  // Sayfa sırası workbook.xml'de; dosya adı rels'te (sheet1.xml her zaman ilk sayfa değil).
  const kitap = xml(await oku("xl/workbook.xml"));
  const ilk = kitap.getElementsByTagName("sheet")[0];
  const rid = ilk?.getAttribute("r:id") ?? ilk?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  const iliski = [...xml(await oku("xl/_rels/workbook.xml.rels")).getElementsByTagName("Relationship")].find((r) => r.getAttribute("Id") === rid);
  const hedef = (iliski?.getAttribute("Target") ?? "worksheets/sheet1.xml").replace(/^\/?xl\//, "").replace(/^\//, "");
  const sayfa = xml(await oku(`xl/${hedef}`));
  return [...sayfa.getElementsByTagName("row")].map((r) => {
    const satir: string[] = [];
    for (const c of r.getElementsByTagName("c")) {
      const tur = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      const deger = tur === "s" ? (ortak[Number(v)] ?? "") : tur === "inlineStr" ? [...c.getElementsByTagName("t")].map((t) => t.textContent).join("") : v;
      satir[sutun(c.getAttribute("r") ?? "A1")] = deger.trim();
    }
    return Array.from(satir, (x) => x ?? "");
  });
};

/* --- Satır → muhabir taslağı --- */

export interface MuhabirTaslagi {
  adLatin: string;
  adAr: string;
  sehir: Sehir;
  /** Listede yazan konum; tanınmadıysa yönetici görsün. */
  konum: string;
  taninmadi: boolean;
  kisaltma: string;
  telefon: string;
  eposta: string;
  kisiselEposta: string;
  irtibat: string;
  calisma?: CalismaBicimi;
}

/*
 * Listedeki konum yazımları (şehir ya da yalnız ülke) → uygulamanın
 * şehri. Ülke yazılmışsa başkenti ya da kurumun o ülkedeki üssü.
 */
const KONUM: Record<string, Sehir> = {
  istanbul: "istanbul", ankara: "ankara", gaza: "gazze", gazze: "gazze", beirut: "beyrut", lebanon: "beyrut",
  london: "londra", sanaa: "sana", yemen: "sana", ukrain: "kiev", ukraine: "kiev", kyiv: "kiev", kiev: "kiev",
  syria: "sam", damascus: "sam", aleppo: "halep", brussels: "bruksel", ramallah: "ramallah", jerusalem: "kudus",
  kuwait: "kuveyt", amman: "amman", jordan: "amman", baghdad: "bagdat", iraq: "bagdat", erbil: "erbil", mosul: "musul",
  tunis: "tunus", tunisia: "tunus", khartoum: "hartum", "north sudan": "hartum", sudan: "hartum", portsudan: "portsudan",
  "port sudan": "portsudan", algeria: "cezayir", algiers: "cezayir", tripoli: "trablus", libya: "trablus",
  france: "paris", paris: "paris", chad: "encamena", argentina: "buenosaires", "sao paulo": "saopaulo", brazil: "saopaulo",
  mogadishu: "mogadisu", somalia: "mogadisu", muscat: "maskat", oman: "maskat", rabat: "rabat", morocco: "rabat",
  islamabad: "islamabad", pakistan: "islamabad", hebron: "elhalil", nablus: "nablus", spain: "madrid", madrid: "madrid",
  holland: "amsterdam", netherlands: "amsterdam", "bosna hersek": "saraybosna", bosnia: "saraybosna", sarajevo: "saraybosna",
  moritanya: "nuaksot", mauritania: "nuaksot", washington: "washington", "new york": "newyork", moscow: "moskova",
  russia: "moskova", afganistan: "kabil", afghanistan: "kabil", kabul: "kabil", eygpt: "kahire", egypt: "kahire",
  cairo: "kahire", ethiopia: "addisababa", doha: "doha", qatar: "doha", riyadh: "riyad", tehran: "tahran",
};

/* Türkçe büyük harfleri (İ, Ş…) de sadeleştirip arıyor: "İSTANBUL" ve "ISTANBUL" aynı. */
const sade = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();

export const konumBul = (s: string): Sehir | null => {
  const k = sade(s);
  if (k in SEHIRLER) return k as Sehir;
  return KONUM[k] ?? null;
};

/* "AHMAD AL ALI" → "Ahmad Al Ali"; listede adlar büyük harfle. */
const basHarf = (s: string) =>
  s
    .toLocaleLowerCase("en")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toLocaleUpperCase("en") + p.slice(1))
    .join(" ");

const epostaMi = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/**
 * Başlık satırını adlarıyla buluyor (sütun sırası değişse de çalışsın).
 * Kurumun listesi: NAME / SURNAME, الأسماء, COUNTRY, ABDRIDGEMENT, PHONE,
 * PERSONAL EMAIL, CORPORATE EMAIL, شركات, RETAINER.
 */
export const muhabirTaslaklari = (satirlar: string[][]): MuhabirTaslagi[] => {
  const bi = satirlar.findIndex((r) => r.some((c) => /^NAME\b/i.test(c)));
  if (bi < 0) return [];
  const ham = satirlar[bi].map((c) => c.trim());
  const bas = ham.map((c) => sade(c));
  const bul = (...adlar: string[]) => bas.findIndex((c) => adlar.some((a) => c === a || c.startsWith(a)));
  const s = {
    ad: bul("name"),
    // Arapça başlıklar ham haliyle: sadeleştirme hemzeli harfleri ayrıştırıyor.
    ar: ham.findIndex((c) => /^ال[اأإ]?سم/.test(c)),
    konum: bul("country", "city"),
    kisaltma: bul("abdridgement", "abbreviation", "kisaltma"),
    telefon: bul("phone", "telefon"),
    kisisel: bul("personal email"),
    kurumsal: bul("corporate email"),
    sirket: ham.findIndex((c) => c === "شركات"),
    calisma: bul("retainer"),
  };
  const al = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return satirlar
    .slice(bi + 1)
    .filter((r) => al(r, s.ad) || al(r, s.ar))
    .map((r) => {
      const konum = al(r, s.konum);
      const sehir = konumBul(konum);
      const kurumsal = al(r, s.kurumsal);
      const kisisel = al(r, s.kisisel);
      const sirket = al(r, s.sirket);
      const cal = sade(al(r, s.calisma));
      const adLatin = basHarf(al(r, s.ad));
      return {
        adLatin,
        adAr: al(r, s.ar) || adLatin,
        sehir: sehir ?? "istanbul",
        konum,
        taninmadi: !sehir,
        kisaltma: al(r, s.kisaltma).toUpperCase().slice(0, 4),
        telefon: al(r, s.telefon),
        eposta: (epostaMi(kurumsal) ? kurumsal : epostaMi(kisisel) ? kisisel : "").toLowerCase(),
        kisiselEposta: epostaMi(kisisel) && kisisel.toLowerCase() !== kurumsal.toLowerCase() ? kisisel.toLowerCase() : "",
        // Uydu/yapım şirketinin irtibatı: canlı bağlantıda aranacak masa.
        irtibat: epostaMi(sirket) ? sirket.toLowerCase() : "",
        calisma: cal.startsWith("freelance") ? "serbest" : cal.startsWith("retainer") ? "retainer" : (CALISMA_BICIMLERI.find((c) => c === cal) as CalismaBicimi | undefined),
      };
    });
};
