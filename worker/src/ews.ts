/*
 * Exchange Web Services (EWS) istemcisi: planlama kutusundaki postaları
 * NTLMv2 ile okur. On-prem Exchange (posta.trt.net.tr) yalnız NTLM/Negotiate
 * kabul ettiği ve Worker'ın fetch'i NTLM el sıkışmasını tek bağlantıya
 * sabitleyemediği için ham TLS soketi (cloudflare:sockets) üzerinde minimal
 * bir HTTP/1.1 istemcisiyle yürütülüyor.
 *
 * Saf parçalar (SOAP kurucu/çözücü, gövde temizleme, HTTP çerçeve çözme)
 * test/ews.test.ts ile sınanıyor; soket G/Ç'si enjekte edilen bir arabirimle
 * (Soket) soyutlanıyor, böylece testte sahte soketle de denenebiliyor.
 */

import { b64Coz, b64Yap, tip1, tip2Coz, tip3 } from "./ntlm.ts";

/* --- Gövde temizleme (src/eposta.ts → yeniMetin ile aynı kurallar) --- */

const ALINTI = [
  /^-{2,}\s*(Original Message|Özgün İleti|Orijinal İleti|الرسالة الأصلية)\s*-{2,}/im,
  /^_{10,}\s*$/m,
  /^(On|Le|Am) .+(wrote|a écrit|schrieb)\s*:\s*$/m,
  /^.+ tarihinde .+ şunu yazdı\s*:\s*$/m,
  /^في .+ كتب.*:\s*$/m,
  /^(From|Kimden|من|De|Von)\s*:.+\n(.+\n){0,3}?(Sent|Date|Gönderildi|Tarih|تاريخ الإرسال|أرسلت|التاريخ|Envoyé|Gesendet)\s*:/im,
  /^>/m,
];
const IMZA = [/^--\s*$/m, /^(Sent from|Get Outlook for|Gönderen:? iPhone|iPhone'umdan gönderildi|أُرسلت من|ارسلت من|تم الإرسال من)/im];

export const yeniMetin = (tam: string): string => {
  let m = tam.replace(/\r\n?/g, "\n");
  for (const k of [...ALINTI, ...IMZA]) {
    const i = m.search(k);
    if (i >= 0) m = m.slice(0, i);
  }
  return m.replace(/\n{3,}/g, "\n\n").trim();
};

/* --- SOAP istekleri --- */

const ZARF = (govde: string) =>
  `<?xml version="1.0" encoding="utf-8"?>` +
  `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">` +
  `<soap:Header><t:RequestServerVersion Version="Exchange2013"/></soap:Header>` +
  `<soap:Body>${govde}</soap:Body></soap:Envelope>`;

/*
 * Gelen kutusundaki en yeni N postanın kimlikleri. Microsoft'un belgelediği
 * en sade FindItem: sıralama yok (EWS bazı sürümlerde SortOrder'ı reddediyordu);
 * sıralama GetItem'den gelen tarihle istemcide yapılıyor.
 */
export const findItemIstegi = (adet: number): string =>
  ZARF(
    `<m:FindItem Traversal="Shallow"><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>` +
      `<m:IndexedPageItemView MaxEntriesReturned="${adet}" Offset="0" BasePoint="Beginning"/>` +
      `<m:ParentFolderIds><t:DistinguishedFolderId Id="inbox"/></m:ParentFolderIds></m:FindItem>`,
  );

/*
 * Seçili postaların bütün ortak alanları (gönderen, alıcılar, konu, tarih,
 * gövde, InternetMessageId, ConversationId, ekler). AllProperties kullanılıyor:
 * FieldURI'leri elle saymak bir alan geçersizse "The request is invalid"
 * veriyordu; AllProperties hepsini kendiliğinden döndürüyor. Gövde düz metin.
 */
export const getItemIstegi = (idler: { id: string; degisim: string }[]): string =>
  ZARF(
    `<m:GetItem><m:ItemShape><t:BaseShape>AllProperties</t:BaseShape><t:BodyType>Text</t:BodyType></m:ItemShape>` +
      `<m:ItemIds>${idler.map((i) => `<t:ItemId Id="${kacXml(i.id)}"${i.degisim ? ` ChangeKey="${kacXml(i.degisim)}"` : ""}/>`).join("")}</m:ItemIds></m:GetItem>`,
  );

/*
 * Ek indirme (kişi dosyaya basınca): eklerin kendisi kayda girmiyor, yalnız
 * adları. Posta kişinin kendi kutusunda Message-ID'siyle bulunuyor (kimlikler
 * kutuya özgü; sohbet ortak, postayı başka biri çekmiş olabilir), ekleri
 * listeleniyor, adı tutan GetAttachment ile çekiliyor.
 */
export const imidBulIstegi = (imid: string): string =>
  ZARF(
    `<m:FindItem Traversal="Shallow"><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>` +
      `<m:IndexedPageItemView MaxEntriesReturned="5" Offset="0" BasePoint="Beginning"/>` +
      `<m:Restriction><t:IsEqualTo><t:FieldURI FieldURI="message:InternetMessageId"/><t:FieldURIOrConstant><t:Constant Value="${kacXml(imid)}"/></t:FieldURIOrConstant></t:IsEqualTo></m:Restriction>` +
      `<m:ParentFolderIds><t:DistinguishedFolderId Id="inbox"/></m:ParentFolderIds></m:FindItem>`,
  );

export const ekListesiIstegi = (i: { id: string; degisim: string }): string =>
  ZARF(
    `<m:GetItem><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape><t:AdditionalProperties><t:FieldURI FieldURI="item:Attachments"/></t:AdditionalProperties></m:ItemShape>` +
      `<m:ItemIds><t:ItemId Id="${kacXml(i.id)}"${i.degisim ? ` ChangeKey="${kacXml(i.degisim)}"` : ""}/></m:ItemIds></m:GetItem>`,
  );

export const ekIstegi = (ekId: string): string =>
  ZARF(`<m:GetAttachment><m:AttachmentIds><t:AttachmentId Id="${kacXml(ekId)}"/></m:AttachmentIds></m:GetAttachment>`);

/* Gönderilecek posta: birden çok alıcı, CC ve BCC (yeni posta ve "tümünü yanıtla"). */
export interface GidenPosta {
  kime: string[];
  cc?: string[];
  bcc?: string[];
  konu: string;
  metin: string;
  /** Verilirse gövde HTML (otomatik çağrı: kırmızı vurgu ve tablo kurumun e-postasındaki gibi). */
  html?: string;
}

/*
 * Yanıt ve yeni posta: düz metin gövdeli e-posta, gönderilip Gönderilmiş'e
 * kopyalanıyor. Şema sırayı şart koşuyor (To, Cc, Bcc); boş liste yazılmıyor.
 */
export const createItemIstegi = (g: GidenPosta): string => {
  const liste = (etiket: string, adresler: string[] = []) =>
    adresler.length ? `<t:${etiket}>${adresler.map((a) => `<t:Mailbox><t:EmailAddress>${kacXml(a)}</t:EmailAddress></t:Mailbox>`).join("")}</t:${etiket}>` : "";
  return ZARF(
    `<m:CreateItem MessageDisposition="SendAndSaveCopy"><m:Items><t:Message>` +
      `<t:Subject>${kacXml(g.konu)}</t:Subject>` +
      (g.html ? `<t:Body BodyType="HTML">${kacXml(g.html)}</t:Body>` : `<t:Body BodyType="Text">${kacXml(g.metin)}</t:Body>`) +
      liste("ToRecipients", g.kime) +
      liste("CcRecipients", g.cc) +
      liste("BccRecipients", g.bcc) +
      `</t:Message></m:Items></m:CreateItem>`,
  );
};

/* --- XML çözme (DOMParser Worker'da yok; küçük düz metin çözücü) --- */

const varlikCoz = (s: string): string =>
  s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&");

const kacXml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* <t:Etiket ...>değer</t:Etiket> içeriği (ilk eşleşme), varlıklar çözülmüş. */
const etiketDegeri = (xml: string, ad: string): string | undefined => {
  const m = xml.match(new RegExp(`<(?:[a-z]+:)?${ad}\\b[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${ad}>`, "i"));
  return m ? varlikCoz(m[1]) : undefined;
};

/* <t:Etiket Oznitelik="..."/> özniteliği. */
const oznitelik = (xml: string, ad: string, oz: string): string | undefined => {
  const m = xml.match(new RegExp(`<(?:[a-z]+:)?${ad}\\b[^>]*\\b${oz}="([^"]*)"`, "i"));
  return m ? varlikCoz(m[1]) : undefined;
};

/* SOAP/EWS hata gövdesinden okunur metin: faultstring, MessageText ya da ResponseCode; yoksa ham kısaltma. */
export const faultMetni = (xml: string): string => {
  const f = etiketDegeri(xml, "faultstring") ?? etiketDegeri(xml, "MessageText") ?? etiketDegeri(xml, "ResponseCode") ?? etiketDegeri(xml, "Message");
  if (f) return f.replace(/\s+/g, " ").trim().slice(0, 200);
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "(boş gövde)";
};

export interface EwsItemKimlik {
  id: string;
  degisim: string;
}

/* FindItem yanıtından öğe kimlikleri (en yeni önce). */
export const findItemCoz = (xml: string): EwsItemKimlik[] => {
  const idler: EwsItemKimlik[] = [];
  for (const m of xml.matchAll(/<(?:[a-z]+:)?ItemId\b[^>]*?\/?>/gi)) {
    const etiket = m[0];
    const id = etiket.match(/\bId="([^"]*)"/i)?.[1];
    if (!id) continue;
    idler.push({ id: varlikCoz(id), degisim: varlikCoz(etiket.match(/\bChangeKey="([^"]*)"/i)?.[1] ?? "") });
  }
  return idler;
};

export interface EwsMesaj {
  kimden: string;
  kimdenAd?: string;
  konu: string;
  metin: string;
  tamMetin: string;
  zaman?: string;
  mesajKimligi?: string;
  konuKimligi?: string;
  ekler: string[];
  /** To ve Cc adresleri (küçük harf); planlama grubuna geleni süzmek için. */
  alicilar: string[];
  /* Ayrı ayrı To ve Cc: ekranda "kim kime yazdı" ve "tümünü yanıtla" için. */
  kime: string[];
  cc: string[];
}

/* Postanın alıcıları (To+Cc) arasında grup adresi var mı; grupAdresi boşsa hepsi geçer. */
export const grubaUygun = (m: EwsMesaj, grupAdresi: string): boolean => {
  const g = grupAdresi.trim().toLowerCase();
  if (!g) return true;
  return m.alicilar.includes(g);
};

export interface EwsEk {
  id: string;
  ad: string;
  boyut: number;
}

/* GetItem (item:Attachments) yanıtındaki dosya ekleri. */
export const ekListesiCoz = (xml: string): EwsEk[] => {
  const ekler: EwsEk[] = [];
  for (const e of xml.matchAll(/<(?:[a-z]+:)?FileAttachment\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?FileAttachment>/gi)) {
    const id = oznitelik(e[1], "AttachmentId", "Id");
    const ad = etiketDegeri(e[1], "Name");
    if (id && ad) ekler.push({ id, ad, boyut: Number(etiketDegeri(e[1], "Size") ?? 0) || 0 });
  }
  return ekler;
};

const bayttaAra = (u: Uint8Array, desen: string, bas = 0): number => {
  const d = [...desen].map((c) => c.charCodeAt(0));
  for (let i = u.indexOf(d[0], bas); i >= 0 && i <= u.length - d.length; i = u.indexOf(d[0], i + 1)) {
    let tamam = true;
    for (let j = 1; j < d.length; j++) if (u[i + j] !== d[j]) { tamam = false; break; }
    if (tamam) return i;
  }
  return -1;
};

const b64Bayt = (b64: string): Uint8Array => {
  const ikili = atob(b64.replace(/\s+/g, ""));
  const u = new Uint8Array(ikili.length);
  for (let i = 0; i < ikili.length; i++) u[i] = ikili.charCodeAt(i);
  return u;
};

/*
 * GetAttachment yanıtından içerik ve tür. Yanıt büyük olabilir (base64 dosya):
 * bütününü metne çevirmek yerine <Content> bölgesi baytlarda aranıyor
 * ("ContentType>", "ContentId>" "Content>" ile bitmiyor; base64'te "<" yok).
 */
export const ekIcerikCoz = (govde: Uint8Array): { tur: string; veri: Uint8Array } | null => {
  const ac = bayttaAra(govde, "Content>");
  if (ac < 0) return null;
  const bas = ac + "Content>".length;
  const son = govde.indexOf(60, bas);
  if (son < 0) return null;
  const once = new TextDecoder().decode(govde.subarray(0, ac));
  const tur = etiketDegeri(once, "ContentType") ?? "";
  return { tur, veri: b64Bayt(new TextDecoder().decode(govde.subarray(bas, son))) };
};

/* GetItem yanıtındaki her <t:Message> bloğunu PostaMesaji'ye yakın bir yapıya çözer. */
export const getItemCoz = (xml: string): EwsMesaj[] => {
  const mesajlar: EwsMesaj[] = [];
  for (const blok of xml.matchAll(/<(?:[a-z]+:)?Message\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?Message>/gi)) {
    const g = blok[1];
    const kutu = g.match(/<(?:[a-z]+:)?From\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?From>/i)?.[1] ?? "";
    const ekler: string[] = [];
    for (const e of g.matchAll(/<(?:[a-z]+:)?FileAttachment\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?FileAttachment>/gi)) {
      const ad = etiketDegeri(e[1], "Name");
      if (ad) ekler.push(ad);
    }
    const tam = etiketDegeri(g, "Body") ?? "";
    const imid = etiketDegeri(g, "InternetMessageId");
    const kime: string[] = [];
    const cc: string[] = [];
    for (const r of g.matchAll(/<(?:[a-z]+:)?(ToRecipients|CcRecipients)\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?(?:ToRecipients|CcRecipients)>/gi)) {
      const hedef = /^Cc/i.test(r[1]) ? cc : kime;
      for (const e of r[2].matchAll(/<(?:[a-z]+:)?EmailAddress>([\s\S]*?)<\/(?:[a-z]+:)?EmailAddress>/gi)) hedef.push(varlikCoz(e[1]).trim().toLowerCase());
    }
    const alicilar = [...kime, ...cc];
    mesajlar.push({
      kimden: etiketDegeri(kutu, "EmailAddress") ?? "",
      kimdenAd: etiketDegeri(kutu, "Name"),
      konu: etiketDegeri(g, "Subject") ?? "",
      metin: yeniMetin(tam) || tam.trim(),
      tamMetin: tam,
      zaman: etiketDegeri(g, "DateTimeReceived"),
      mesajKimligi: imid ? imid.replace(/[<>]/g, "") : undefined,
      konuKimligi: oznitelik(g, "ConversationId", "Id"),
      ekler,
      alicilar,
      kime,
      cc,
    });
  }
  return mesajlar;
};

/* --- HTTP/1.1 çerçeve çözme (soket akışından) --- */

export interface HttpYanit {
  durum: number;
  basliklar: Record<string, string>;
  govde: Uint8Array;
}

const latin1 = (u: Uint8Array) => { let s = ""; for (const b of u) s += String.fromCharCode(b); return s; };
const altIndeks = (u: Uint8Array, desen: number[], bas = 0): number => {
  dis: for (let i = bas; i <= u.length - desen.length; i++) {
    for (let j = 0; j < desen.length; j++) if (u[i + j] !== desen[j]) continue dis;
    return i;
  }
  return -1;
};
const CRLF2 = [13, 10, 13, 10];

/*
 * Biriken baytlardan tam bir HTTP yanıtı çözülebiliyorsa döndürür; gövde
 * Content-Length ya da Transfer-Encoding: chunked ile belirleniyor. Tam
 * değilse null (soketten daha çok okunmalı).
 */
/* Başlık bloğu tamamlandıysa durum, başlıklar ve gövde baytlarını ayırır. */
const basliklariCoz = (baytlar: Uint8Array): { durum: number; basliklar: Record<string, string>; kalan: Uint8Array } | null => {
  const bosSatir = altIndeks(baytlar, CRLF2);
  if (bosSatir < 0) return null;
  const satirlar = latin1(baytlar.subarray(0, bosSatir)).split("\r\n");
  const durum = Number(satirlar[0].split(" ")[1]) || 0;
  const basliklar: Record<string, string> = {};
  for (const s of satirlar.slice(1)) {
    const i = s.indexOf(":");
    if (i <= 0) continue;
    const ad = s.slice(0, i).trim().toLowerCase();
    const deger = s.slice(i + 1).trim();
    // Aynı başlık birden çok gelebilir (Exchange 401'de "WWW-Authenticate: NTLM …" ve ayrı satırda "Negotiate"):
    // sonuncuyla ezmeyip birleştir, yoksa NTLM challenge "Negotiate"in altında kaybolup bulunamıyordu.
    basliklar[ad] = basliklar[ad] ? `${basliklar[ad]}, ${deger}` : deger;
  }
  return { durum, basliklar, kalan: baytlar.subarray(bosSatir + 4) };
};

export const httpCerceveCoz = (baytlar: Uint8Array): HttpYanit | null => {
  const b = basliklariCoz(baytlar);
  if (!b) return null;
  const { durum, basliklar, kalan } = b;
  if ((basliklar["transfer-encoding"] ?? "").toLowerCase().includes("chunked")) {
    const govde = dechunk(kalan);
    return govde ? { durum, basliklar, govde } : null;
  }
  const uzunluk = Number(basliklar["content-length"] ?? "0");
  if (kalan.length < uzunluk) return null;
  return { durum, basliklar, govde: kalan.subarray(0, uzunluk) };
};

/*
 * Bağlantı yanıt tamamlanmadan kapanınca (Exchange 500'den sonra bağlantıyı
 * sıfırlayabiliyor): başlık bloğu geldiyse eldeki gövdeyle en iyi çerçeveyi
 * döndür, böylece 500'ün SOAP fault metni yine okunabilsin. Başlık yoksa null.
 */
const cerceveZorla = (baytlar: Uint8Array): HttpYanit | null => {
  const b = basliklariCoz(baytlar);
  if (!b) return null;
  const chunked = (b.basliklar["transfer-encoding"] ?? "").toLowerCase().includes("chunked");
  const govde = chunked ? (dechunk(b.kalan) ?? b.kalan) : b.kalan;
  return { durum: b.durum, basliklar: b.basliklar, govde };
};

/* Chunked gövdeyi birleştirir; son parça (0) gelmemişse null. */
const dechunk = (u: Uint8Array): Uint8Array | null => {
  const parcalar: Uint8Array[] = [];
  let o = 0;
  for (;;) {
    const satirSon = altIndeks(u, [13, 10], o);
    if (satirSon < 0) return null;
    const boy = parseInt(latin1(u.subarray(o, satirSon)).trim(), 16);
    if (Number.isNaN(boy)) return null;
    const veriBas = satirSon + 2;
    if (boy === 0) return birlestirBayt(parcalar);
    if (veriBas + boy + 2 > u.length) return null;
    parcalar.push(u.subarray(veriBas, veriBas + boy));
    o = veriBas + boy + 2;
  }
};

const birlestirBayt = (p: Uint8Array[]): Uint8Array => {
  const u = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) { u.set(x, o); o += x.length; }
  return u;
};

/* --- Soket taşıması (cloudflare:sockets); testte sahte Soket enjekte edilir --- */

export interface Soket {
  yaz(u: Uint8Array): Promise<void>;
  oku(): Promise<Uint8Array | null>;
  kapat(): Promise<void>;
}

export interface EwsAyar {
  sunucu: string; // posta.trt.net.tr
  kullanici: string; // mehmetsafa.bicer
  parola: string;
  alan: string; // TRT
}

const metinBayt = (s: string) => new TextEncoder().encode(s);

const istekBaytlari = (ayar: EwsAyar, authz: string | null, soap: string): Uint8Array => {
  const govde = metinBayt(soap);
  const bas =
    `POST /EWS/Exchange.asmx HTTP/1.1\r\n` +
    `Host: ${ayar.sunucu}\r\n` +
    `Connection: keep-alive\r\n` +
    `Content-Type: text/xml; charset=utf-8\r\n` +
    (authz ? `Authorization: ${authz}\r\n` : "") +
    `Content-Length: ${govde.length}\r\n\r\n`;
  return birlestirBayt([metinBayt(bas), govde]);
};

/*
 * Soketten tam bir HTTP yanıtı okunana dek biriktirir. Her okumada zaman
 * aşımı var: sunucu beklediğimiz uzunlukta/biçimde kapatmazsa Worker'ın süre
 * sınırına çarpıp ham 500 vermesin, temiz bir hata dönsün.
 */
const OKUMA_ZAMAN_ASIMI = 20000;
// GetItem tek istekte çok mesaj isteyince sunucunun ilk baytı üretmesi zaman
// aşımını aşıyor; gövdeler küçük gruplar hâlinde, aynı bağlantıda çekiliyor.
const GETITEM_PARCA = 6;
/* Ek indirmede yanıtın üst sınırı: base64 dosya artı zarf. */
export const YANIT_SINIRI = 36 * 1024 * 1024;

/*
 * Parçalar dizide birikiyor, yalnız tamamlanmış olabileceği anda
 * birleştirilip çözülüyor: her parçada bütün tamponu kopyalayıp baştan
 * çözmek büyük ekte (megabaytlarca) işlemciyi bitiriyordu.
 */
const yanitOku = async (soket: Soket): Promise<HttpYanit> => {
  let parcalar: Uint8Array[] = [];
  let toplam = 0;
  let bas: { boy: number; uzunluk: number; chunked: boolean } | null = null;
  const tumu = () => {
    if (parcalar.length > 1) parcalar = [birlestirBayt(parcalar)];
    return parcalar[0] ?? new Uint8Array(0);
  };
  const bitti = (): boolean => {
    if (!bas) return false;
    if (!bas.chunked) return toplam - bas.boy >= bas.uzunluk;
    // Chunked gövde "0\r\n\r\n" ile biter; son baytlara bakmak yeterli.
    const son = parcalar[parcalar.length - 1];
    const kuyruk = son.length >= 5 ? son.subarray(son.length - 5) : tumu().subarray(Math.max(0, toplam - 5));
    return latin1(kuyruk) === "0\r\n\r\n";
  };
  for (;;) {
    if (!bas && toplam) {
      const t = tumu();
      const b = basliklariCoz(t);
      if (b) bas = { boy: t.length - b.kalan.length, uzunluk: Number(b.basliklar["content-length"] ?? "0"), chunked: (b.basliklar["transfer-encoding"] ?? "").toLowerCase().includes("chunked") };
    }
    if (bitti()) {
      const cerceve = httpCerceveCoz(tumu());
      if (cerceve) return cerceve;
    }
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    // Soketin sıfırlanması ("Stream was cancelled") okuma hatası olarak gelir; EOF gibi ele al.
    const parca = await Promise.race([
      soket.oku().catch(() => null),
      new Promise<never>((_, red) => { zamanlayici = setTimeout(() => red(new Error("okuma zaman aşımı")), OKUMA_ZAMAN_ASIMI); }),
    ]).finally(() => { if (zamanlayici !== null) clearTimeout(zamanlayici); });
    if (!parca) {
      // Bağlantı kapandı/sıfırlandı: tam çerçeve varsa onu, yoksa başlık+eldeki gövdeyle en iyisini döndür.
      const t = tumu();
      const son = httpCerceveCoz(t) ?? cerceveZorla(t);
      if (son) return son;
      throw new Error("bağlantı yanıt gelmeden kapandı");
    }
    parcalar.push(parca);
    toplam += parca.length;
    if (toplam > YANIT_SINIRI) throw new Error("yanıt çok büyük");
  }
};

/*
 * Tek bağlantıda NTLM el sıkışması + SOAP isteği. Aynı SOAP gövdesi Type1
 * ile gönderilip 401+Type2 alınıyor, Type3 ile yeniden gönderiliyor; başarıda
 * 200 ve SOAP yanıtı. Bağlantı doğrulandığı için sonraki istekler (aynı
 * soket) yeniden el sıkışması istemez.
 */
export const ntlmIstek = async (soket: Soket, ayar: EwsAyar, soap: string, simdi: number, elSikisGerek: boolean, mic = false): Promise<HttpYanit> => {
  if (!elSikisGerek) {
    await soket.yaz(istekBaytlari(ayar, null, soap));
    return yanitOku(soket);
  }
  const t1 = tip1();
  await soket.yaz(istekBaytlari(ayar, `NTLM ${b64Yap(t1)}`, soap));
  const meydan = await yanitOku(soket);
  if (meydan.durum !== 401) return meydan; // beklenmedik (ör. anonim izin); olduğu gibi dön
  const baslik = meydan.basliklar["www-authenticate"] ?? "";
  const m = baslik.match(/NTLM\s+([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error("sunucu NTLM challenge vermedi: " + baslik.slice(0, 60));
  const t2 = tip2Coz(b64Coz(m[1]));
  const t3 = tip3({ kullanici: ayar.kullanici, parola: ayar.parola, alan: ayar.alan, tip2: t2, simdi, tip1Ham: t1, mic });
  await soket.yaz(istekBaytlari(ayar, `NTLM ${b64Yap(t3)}`, soap));
  return yanitOku(soket);
};

/* --- Yüksek seviye: postaları çek --- */

export interface Baglan {
  (sunucu: string): Promise<Soket>;
}

/*
 * Birkaç isteklik okuma oturumu (posta çekme, ek indirme). Exchange bağlantıyı
 * bir süre ya da birkaç istek sonra yanıt vermeden kapatabiliyor ("bağlantı
 * yanıt gelmeden kapandı"): o zaman yeni bağlantı açılıp el sıkışmasıyla aynı
 * istek bir kez daha gönderiliyor. Sunucu "Connection: close" derse sonraki
 * istek baştan yeni bağlantıda. Yalnız okuma için: gönderim yinelenirse posta
 * iki kez gidebilirdi.
 */
const YENILENIR = /kapandı|zaman aşımı|reset|closed|cancel/i;
export const okumaOturumu = (ayar: EwsAyar, baglan: Baglan, simdi: number, mic: boolean) => {
  let soket: Soket | undefined;
  let dogrulandi = false;
  const birak = async () => {
    await soket?.kapat().catch(() => {});
    soket = undefined;
    dogrulandi = false;
  };
  const iste = async (soap: string): Promise<HttpYanit> => {
    for (let deneme = 0; ; deneme++) {
      if (!soket) soket = await baglan(ayar.sunucu);
      try {
        const r = await ntlmIstek(soket, ayar, soap, simdi, !dogrulandi, mic);
        if (r.durum !== 401) dogrulandi = true;
        if (/close/i.test(r.basliklar.connection ?? "")) await birak();
        return r;
      } catch (e) {
        await birak();
        if (deneme >= 1 || !YENILENIR.test(e instanceof Error ? e.message : String(e))) throw e;
      }
    }
  };
  return { iste, kapat: birak };
};

/*
 * Gelen kutusundan en yeni `adet` postayı çeker: FindItem ile kimlikler,
 * GetItem ile gövdeler. Tek soket; FindItem el sıkışmasından sonra GetItem
 * aynı doğrulanmış bağlantıda. Hata metinle döner (kullanıcı "dene"de görsün).
 */
export const postalariCek = async (ayar: EwsAyar, baglan: Baglan, simdi: number, adet = 25, mic = false): Promise<{ mesajlar: EwsMesaj[] } | { hata: string; kimlik?: boolean }> => {
  const o = okumaOturumu(ayar, baglan, simdi, mic);
  try {
    const bul = await o.iste(findItemIstegi(adet));
    // 401: kimlik reddedildi. Üst katman MIC'li/MIC'siz ikinci denemeyi buna bakarak yapıyor.
    if (bul.durum === 401) return { hata: "kimlik doğrulanamadı (kullanıcı adı, parola ya da alan yanlış olabilir)", kimlik: true };
    if (bul.durum !== 200) return { hata: `FindItem ${bul.durum}: ${faultMetni(latin1Utf8(bul.govde))}` };
    const idler = findItemCoz(latin1Utf8(bul.govde));
    if (idler.length === 0) return { mesajlar: [] };
    // Gövdeleri küçük gruplar hâlinde çek: büyük tek GetItem yanıtı zaman
    // aşımına düşüyordu. Aynı doğrulanmış bağlantıda; kapanırsa oturum yeniler.
    const mesajlar: EwsMesaj[] = [];
    for (let i = 0; i < idler.length; i += GETITEM_PARCA) {
      const al = await o.iste(getItemIstegi(idler.slice(i, i + GETITEM_PARCA)));
      if (al.durum !== 200) return { hata: `GetItem ${al.durum}: ${faultMetni(latin1Utf8(al.govde))}` };
      mesajlar.push(...getItemCoz(latin1Utf8(al.govde)));
    }
    // FindItem sıralamıyor; en yeni önce gelsin diye tarihe göre azalan (istemci sohbette ters çeviriyor).
    mesajlar.sort((a, b) => (b.zaman ?? "").localeCompare(a.zaman ?? ""));
    return { mesajlar };
  } catch (e) {
    return { hata: e instanceof Error ? e.message : String(e) };
  } finally {
    await o.kapat();
  }
};

/* Önce sade NTLMv2 (MIC'siz), kimlik reddedilirse MIC'li yeni bağlantıda dener; hangisi tuttuysa o. */
export const postalariCekOtomatik = async (ayar: EwsAyar, baglan: Baglan, simdi: number, adet = 25): Promise<{ mesajlar: EwsMesaj[] } | { hata: string }> => {
  const ilk = await postalariCek(ayar, baglan, simdi, adet, false);
  if (!("hata" in ilk) || !ilk.kimlik) return ilk;
  return postalariCek(ayar, baglan, simdi, adet, true);
};

/* Postayı gönderir (EWS CreateItem, SendAndSaveCopy). */
export const postaGonder = async (ayar: EwsAyar, baglan: Baglan, simdi: number, g: GidenPosta, mic = false): Promise<{ tamam: true } | { hata: string; kimlik?: boolean }> => {
  let soket: Soket | undefined;
  try {
    soket = await baglan(ayar.sunucu);
    const r = await ntlmIstek(soket, ayar, createItemIstegi(g), simdi, true, mic);
    if (r.durum === 401) return { hata: "kimlik doğrulanamadı", kimlik: true };
    if (r.durum !== 200) return { hata: `CreateItem ${r.durum}: ${faultMetni(latin1Utf8(r.govde))}` };
    const xml = latin1Utf8(r.govde);
    if (!/ResponseClass="Success"/.test(xml) && !/>NoError</.test(xml)) return { hata: `gönderilemedi: ${faultMetni(xml)}` };
    return { tamam: true };
  } catch (e) {
    return { hata: e instanceof Error ? e.message : String(e) };
  } finally {
    await soket?.kapat().catch(() => {});
  }
};

export const postaGonderOtomatik = async (ayar: EwsAyar, baglan: Baglan, simdi: number, g: GidenPosta): Promise<{ tamam: true } | { hata: string }> => {
  const ilk = await postaGonder(ayar, baglan, simdi, g, false);
  if (!("hata" in ilk) || !ilk.kimlik) return ilk;
  return postaGonder(ayar, baglan, simdi, g, true);
};

/* Bu boyuttan büyük ek indirilmez: Worker belleği (yanıt base64, artı çözülmüşü). */
export const EK_SINIRI = 20 * 1024 * 1024;

export type EkSonucu = { tur: string; veri: Uint8Array } | { hata: string; kimlik?: boolean; yok?: boolean; buyuk?: boolean };

/* Ekin kendisi: Message-ID ile postayı bul, eklerinden adı tutanı çek. Tek soket. */
export const ekIndir = async (ayar: EwsAyar, baglan: Baglan, simdi: number, imid: string, ad: string, mic = false): Promise<EkSonucu> => {
  const o = okumaOturumu(ayar, baglan, simdi, mic);
  try {
    const bul = await o.iste(imidBulIstegi(`<${imid.replace(/[<>]/g, "")}>`));
    if (bul.durum === 401) return { hata: "kimlik doğrulanamadı", kimlik: true };
    if (bul.durum !== 200) return { hata: `FindItem ${bul.durum}: ${faultMetni(latin1Utf8(bul.govde))}` };
    const ogeler = findItemCoz(latin1Utf8(bul.govde));
    if (!ogeler.length) return { hata: "posta kutunda bulunamadı", yok: true };
    const liste = await o.iste(ekListesiIstegi(ogeler[0]));
    if (liste.durum !== 200) return { hata: `GetItem ${liste.durum}: ${faultMetni(latin1Utf8(liste.govde))}` };
    const ek = ekListesiCoz(latin1Utf8(liste.govde)).find((e) => e.ad === ad);
    if (!ek) return { hata: "ek bulunamadı", yok: true };
    if (ek.boyut > EK_SINIRI) return { hata: "ek çok büyük", buyuk: true };
    const al = await o.iste(ekIstegi(ek.id));
    if (al.durum !== 200) return { hata: `GetAttachment ${al.durum}: ${faultMetni(latin1Utf8(al.govde.subarray(0, 4000)))}` };
    const icerik = ekIcerikCoz(al.govde);
    return icerik ?? { hata: "ek okunamadı" };
  } catch (e) {
    return { hata: e instanceof Error ? e.message : String(e) };
  } finally {
    await o.kapat();
  }
};

export const ekIndirOtomatik = async (ayar: EwsAyar, baglan: Baglan, simdi: number, imid: string, ad: string): Promise<EkSonucu> => {
  const ilk = await ekIndir(ayar, baglan, simdi, imid, ad, false);
  if (!("hata" in ilk) || !ilk.kimlik) return ilk;
  return ekIndir(ayar, baglan, simdi, imid, ad, true);
};

/* Gövde UTF-8; soketten gelen baytları metne çevir. */
const latin1Utf8 = (u: Uint8Array) => new TextDecoder("utf-8").decode(u);

/* Worker'da cloudflare:sockets ile gerçek bağlantı; import dinamik, test node'da bu dalı çağırmıyor. */
export const cfBaglan: Baglan = async (sunucu) => {
  const { connect } = (await import("cloudflare:sockets")) as { connect: (a: string, o?: { secureTransport?: string; allowHalfOpen?: boolean }) => CfSocket };
  const s = connect(`${sunucu}:443`, { secureTransport: "on", allowHalfOpen: false });
  const yazici = s.writable.getWriter();
  const okuyucu = s.readable.getReader();
  return {
    yaz: (u) => yazici.write(u),
    oku: async () => {
      const { value, done } = await okuyucu.read();
      return done ? null : (value as Uint8Array);
    },
    kapat: async () => { try { await yazici.close(); } catch { /* yok */ } try { await s.close(); } catch { /* yok */ } },
  };
};

interface CfSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
}
