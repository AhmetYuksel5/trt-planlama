import type { Bolme, BolmeEkseni, Durum, Kisi, Ortam, OrtamDuzeni } from "./veri";
import { sayfaGorebilir } from "./yetki";

/**
 * Workspace'in okuma kuralları: hangi sayfa bölmeye girer, kişinin
 * workspace'leri, bölmelerin ekrana yerleşimi.
 *
 * Bölme uygulamanın kendisi (iframe, gömülü kip; yol.ts → GOMULU); burada
 * yalnız hangi sayfanın hangi alana düştüğü hesaplanıyor. Saf: hem ekran
 * hem eylemler aynı kuralı kullanıyor.
 */

/* Sekme şeridi taşmasın, bölmeler okunur kalsın; her bölme uygulamayı ayrıca yüklüyor. */
export const ORTAM_EN_COK = 8;
export const BOLME_EN_COK = 4;

/** Seçim sayfasının önerdiği yerleşim: dört sayfa yan yana okunmuyor, ızgara oluyor. */
export const varsayilanDuzen = (bolmeSayisi: number): OrtamDuzeni => (bolmeSayisi >= 4 ? "izgara" : "yan");

/*
 * Bölmeye girmeyen sayfalar: workspace kendi içinde açılmaz; proje planının
 * "bu kişiyle dene" düğmesi oturumu değiştiriyor, bölmede basılırsa bütün
 * pencerenin kişisi değişirdi.
 */
export const BOLMEYE_GIRMEZ = ["ortam", "plan"];

/** `#/nextday/nd-1` ya da `nextday/nd-1` → `nextday/nd-1`. */
export const yolTemizle = (yol: string) => yol.replace(/^#?\/?/, "");

/** Yolun sayfası (menüdeki madde); boş yol ana sayfa. */
export const yolSayfasi = (yol: string) => yolTemizle(yol).split("/")[0] || "ana";

export const bolmeyeGirer = (ben: Kisi | undefined, yol: string) => {
  const sayfa = yolSayfasi(yol);
  return !BOLMEYE_GIRMEZ.includes(sayfa) && sayfaGorebilir(ben, sayfa);
};

export const kisininOrtamlari = (d: Durum, kisiId: string): Ortam[] => d.ortamlar?.[kisiId] ?? [];

export const ortamBul = (d: Durum, kisiId: string, id?: string) => kisininOrtamlari(d, kisiId).find((o) => o.id === id);

/** Ayraçla verilmiş boyut; verilmemişse eşit pay. */
export const bolmePayi = (b: Bolme, eksen: BolmeEkseni) => {
  const p = b.pay?.[eksen];
  return p !== undefined && Number.isFinite(p) && p > 0 ? p : 1;
};

/*
 * Ayraç sürüklenince yalnız iki komşu bölme değişiyor; ikisinin toplam payı
 * aynı kalıyor ki öbür bölmeler kımıldamasın. Hesap piksel üzerinden: alt
 * altada sahne kaydırılabiliyor, sahnenin toplam boyu ölçü olamaz.
 */
export const payKaydir = (payA: number, payB: number, pxA: number, pxB: number, farkPx: number, enAzPx: number): [number, number] => {
  const toplamPx = pxA + pxB;
  const toplamPay = payA + payB;
  if (toplamPx <= 0) return [payA, payB];
  const yeniPx = toplamPx < 2 * enAzPx ? toplamPx / 2 : Math.min(Math.max(pxA + farkPx, enAzPx), toplamPx - enAzPx);
  const a = Math.round(((toplamPay * yeniPx) / toplamPx) * 1000) / 1000;
  return [a, Math.round((toplamPay - a) * 1000) / 1000];
};

export interface Ayrac {
  /** Ayracın önündeki ve arkasındaki bölme. */
  onceki: string;
  sonraki: string;
  eksen: BolmeEkseni;
  alan: string;
}

export interface Yerlesim {
  sutunlar: string;
  satirlar: string;
  /** Bölme → ızgaradaki alan ve görünmeyen mi (sekmeli ya da büyütülmüşte öbürleri). */
  yerler: Record<string, { alan: string; arkada: boolean }>;
  ayraclar: Ayrac[];
  /** Ekranda tek bölme var (sekmeli ya da büyütülmüş): hangisi. */
  tek?: string;
}

const alan = (satir: number, sutun: number, satirBit = satir + 1, sutunBit = sutun + 1) => `${satir} / ${sutun} / ${satirBit} / ${sutunBit}`;

/**
 * Bölmelerin ızgaradaki yeri. Ekrandaki sıra yalnız buradan çıkıyor; bölmeler
 * DOM'da hep aynı sırada duruyor, çünkü iframe DOM'da yer değiştirirse
 * yeniden yükleniyor ve içindeki iş kayboluyor.
 */
export function yerlesim(duzen: OrtamDuzeni, bolmeler: Bolme[], secim: { buyuk?: string; acik?: string } = {}): Yerlesim {
  const idler = bolmeler.map((b) => b.id);
  const tekHucre = (gorunen?: string): Yerlesim => {
    const tek = gorunen && idler.includes(gorunen) ? gorunen : idler[0];
    return {
      sutunlar: "minmax(0, 1fr)",
      satirlar: "minmax(0, 1fr)",
      yerler: Object.fromEntries(idler.map((id) => [id, { alan: alan(1, 1), arkada: id !== tek }])),
      ayraclar: [],
      tek,
    };
  };
  if (secim.buyuk && idler.includes(secim.buyuk)) return tekHucre(secim.buyuk);
  if (duzen === "sekme" || bolmeler.length <= 1) return tekHucre(secim.acik);

  if (duzen === "izgara") {
    const ikinciSatir = bolmeler.length > 2;
    const yerler: Yerlesim["yerler"] = {};
    bolmeler.forEach((b, i) => {
      const satir = i < 2 ? 1 : 2;
      const sutun = (i % 2) + 1;
      // Üç bölmede üçüncü alt satırı tek başına dolduruyor; boş köşe kalmasın.
      yerler[b.id] = { alan: bolmeler.length === 3 && i === 2 ? alan(2, 1, 3, 3) : alan(satir, sutun), arkada: false };
    });
    return {
      sutunlar: "minmax(0, 1fr) minmax(0, 1fr)",
      satirlar: ikinciSatir ? "minmax(var(--bolme-en-alcak), 1fr) minmax(var(--bolme-en-alcak), 1fr)" : "minmax(0, 1fr)",
      yerler,
      ayraclar: [],
    };
  }

  // Yan yana ve alt alta: bölme, ayraç, bölme… Ayraç kendi izinde, bölmelerin arasında.
  const eksen: BolmeEkseni = duzen === "yan" ? "yan" : "alt";
  const enAz = eksen === "yan" ? "var(--bolme-en-dar)" : "var(--bolme-en-alcak)";
  const izler: string[] = [];
  const yerler: Yerlesim["yerler"] = {};
  const ayraclar: Ayrac[] = [];
  bolmeler.forEach((b, i) => {
    const sira = 2 * i + 1;
    izler.push(`minmax(${enAz}, ${bolmePayi(b, eksen)}fr)`);
    yerler[b.id] = { alan: eksen === "yan" ? alan(1, sira) : alan(sira, 1), arkada: false };
    if (i < bolmeler.length - 1) {
      izler.push("var(--ayrac)");
      ayraclar.push({ onceki: b.id, sonraki: bolmeler[i + 1].id, eksen, alan: eksen === "yan" ? alan(1, sira + 1) : alan(sira + 1, 1) });
    }
  });
  return eksen === "yan"
    ? { sutunlar: izler.join(" "), satirlar: "minmax(0, 1fr)", yerler, ayraclar }
    : { sutunlar: "minmax(0, 1fr)", satirlar: izler.join(" "), yerler, ayraclar };
}
