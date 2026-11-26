/*
 * Kitaplıksız .xlsx yazıcısı (kullanıcı: rapor önerileri tablosu kurumun Excel
 * tablosunun biçiminde çıksın: bant başlık, sağdan sola, sütun genişlikleri,
 * muhabir tonları). Zip sıkıştırmasız ("stored"); yalnız CRC32 hesaplanıyor.
 * Okuyucusu iceAktar.ts → xlsxOku (testte gidiş-dönüş).
 */

export interface XlsxSayfa {
  ad: string;
  sagdanSola?: boolean;
  /** Karakter cinsinden sütun genişlikleri. */
  genislikler: number[];
  /** İlk satır bant (bütün sütunlar birleşik), ikinci satır başlık, gerisi gövde. */
  bant: string;
  basliklar: string[];
  satirlar: string[][];
  /** Gövde satırının tonu (0–3). */
  tonlar: number[];
}

/* Tonlar ekrandakiyle aynı aileden, açık: koyu zemin okunmuyordu (stokTablosu.ts). */
const TONLAR = ["FFEEF3FB", "FFF7F1E6", "FFF1EDF8", "FFEEF5EC"];

const kacis = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // XML 1.0'da geçersiz denetim karakterleri (sekme ve satır sonu dışında) dosyayı bozardı.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

const harf = (i: number) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

const hucre = (r: number, c: number, deger: string, stil: number) =>
  deger ? `<c r="${harf(c)}${r}" s="${stil}" t="inlineStr"><is><t xml:space="preserve">${kacis(deger)}</t></is></c>` : `<c r="${harf(c)}${r}" s="${stil}"/>`;

/*
 * Excel kaydırmalı metnin satır yüksekliğini açılışta kendisi hesaplamıyor:
 * en uzun hücrenin satır sayısı sütun genişliğinden kestirilir.
 */
const yukseklik = (satir: string[], genislikler: number[]) => {
  const n = Math.max(1, ...satir.map((x, i) => x.split("\n").reduce((t, s) => t + Math.max(1, Math.ceil((s.length * 1.1) / Math.max(4, genislikler[i] ?? 10))), 0)));
  return Math.min(409, Math.round(n * 15.5 + 6));
};

const STILLER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>
<fills count="${4 + TONLAR.length}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8742A"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFBE3D3"/></patternFill></fill>${TONLAR.map((t) => `<fill><patternFill patternType="solid"><fgColor rgb="${t}"/></patternFill></fill>`).join("")}</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${3 + TONLAR.length}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" readingOrder="2"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" readingOrder="2"/></xf>${TONLAR.map((_, i) => `<xf numFmtId="0" fontId="0" fillId="${4 + i}" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1" readingOrder="2"/></xf>`).join("")}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const sayfaXml = (s: XlsxSayfa) => {
  const son = harf(s.basliklar.length - 1);
  const govde = s.satirlar
    .map((r, i) => `<row r="${i + 3}" ht="${yukseklik(r, s.genislikler)}" customHeight="1">${r.map((x, c) => hucre(i + 3, c, x, 3 + (s.tonlar[i] ?? 0) % TONLAR.length)).join("")}</row>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView ${s.sagdanSola ? 'rightToLeft="1" ' : ""}workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${s.genislikler.map((g, i) => `<col min="${i + 1}" max="${i + 1}" width="${g}" customWidth="1"/>`).join("")}</cols>
<sheetData><row r="1" ht="28" customHeight="1">${s.basliklar.map((_, c) => hucre(1, c, c === 0 ? s.bant : "", 1)).join("")}</row><row r="2" ht="34" customHeight="1">${s.basliklar.map((b, c) => hucre(2, c, b, 2)).join("")}</row>${govde}</sheetData>
<mergeCells count="1"><mergeCell ref="A1:${son}1"/></mergeCells>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
};

const dosyalar = (s: XlsxSayfa): [string, string][] => {
  const ad = kacis(s.ad.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet1");
  return [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${ad}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'${ad.replace(/'/g, "''")}'!$1:$2</definedName></definedNames></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    ["xl/styles.xml", STILLER],
    ["xl/worksheets/sheet1.xml", sayfaXml(s)],
  ];
};

/* --- Sıkıştırmasız zip --- */

const CRC_TABLO = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLO[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export const zipYaz = (girdiler: [string, Uint8Array][]): Uint8Array => {
  const yaz = new TextEncoder();
  const yerel: Uint8Array[] = [];
  const merkez: Uint8Array[] = [];
  let ofset = 0;
  for (const [ad, veri] of girdiler) {
    const a = yaz.encode(ad);
    const crc = crc32(veri);
    const bas = new DataView(new ArrayBuffer(30));
    bas.setUint32(0, 0x04034b50, true);
    bas.setUint16(4, 20, true);
    bas.setUint16(6, 0x0800, true); // adlar UTF-8
    bas.setUint16(8, 0, true); // sıkıştırma yok
    bas.setUint16(10, 0, true);
    bas.setUint16(12, 0x21, true); // 1980-01-01
    bas.setUint32(14, crc, true);
    bas.setUint32(18, veri.length, true);
    bas.setUint32(22, veri.length, true);
    bas.setUint16(26, a.length, true);
    bas.setUint16(28, 0, true);
    yerel.push(new Uint8Array(bas.buffer), a, veri);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true);
    m.setUint16(4, 20, true);
    m.setUint16(6, 20, true);
    m.setUint16(8, 0x0800, true);
    m.setUint16(10, 0, true);
    m.setUint16(12, 0, true);
    m.setUint16(14, 0x21, true);
    m.setUint32(16, crc, true);
    m.setUint32(20, veri.length, true);
    m.setUint32(24, veri.length, true);
    m.setUint16(28, a.length, true);
    m.setUint32(42, ofset, true);
    merkez.push(new Uint8Array(m.buffer), a);
    ofset += 30 + a.length + veri.length;
  }
  const mBoy = merkez.reduce((t, x) => t + x.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true);
  son.setUint16(8, girdiler.length, true);
  son.setUint16(10, girdiler.length, true);
  son.setUint32(12, mBoy, true);
  son.setUint32(16, ofset, true);
  const parcalar = [...yerel, ...merkez, new Uint8Array(son.buffer)];
  const sonuc = new Uint8Array(parcalar.reduce((t, x) => t + x.length, 0));
  let i = 0;
  for (const p of parcalar) {
    sonuc.set(p, i);
    i += p.length;
  }
  return sonuc;
};

export const xlsxYaz = (s: XlsxSayfa): Uint8Array => {
  const yaz = new TextEncoder();
  return zipYaz(dosyalar(s).map(([ad, x]) => [ad, yaz.encode(x)]));
};

export const XLSX_TURU = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
