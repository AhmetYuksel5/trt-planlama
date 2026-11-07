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

/* Gelen kutusundaki en yeni N postanın kimlikleri; alınan tarihe göre azalan. */
export const findItemIstegi = (adet: number): string =>
  ZARF(
    `<m:FindItem Traversal="Shallow"><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>` +
      `<m:IndexedPageItemView MaxEntriesReturned="${adet}" Offset="0" BasePoint="Beginning"/>` +
      `<m:SortOrder><t:FieldOrder Order="Descending"><t:FieldURI FieldURI="item:DateTimeReceived"/></t:FieldOrder></m:SortOrder>` +
      `<m:ParentFolderIds><t:DistinguishedFolderId Id="inbox"/></m:ParentFolderIds></m:FindItem>`,
  );

/* Seçili postaların gövdesi (düz metin), göndereni, konusu, tarihi, kimlikleri ve ek adları. */
export const getItemIstegi = (idler: { id: string; degisim: string }[]): string =>
  ZARF(
    `<m:GetItem><m:ItemShape><t:BaseShape>IdOnly</t:BaseShape><t:BodyType>Text</t:BodyType>` +
      `<t:AdditionalProperties>` +
      `<t:FieldURI FieldURI="item:Subject"/><t:FieldURI FieldURI="item:DateTimeReceived"/><t:FieldURI FieldURI="item:Body"/>` +
      `<t:FieldURI FieldURI="message:From"/><t:FieldURI FieldURI="message:InternetMessageId"/><t:FieldURI FieldURI="message:ConversationId"/>` +
      `<t:FieldURI FieldURI="message:ToRecipients"/><t:FieldURI FieldURI="message:CcRecipients"/>` +
      `<t:FieldURI FieldURI="item:HasAttachments"/><t:FieldURI FieldURI="item:Attachments"/>` +
      `</t:AdditionalProperties></m:ItemShape>` +
      `<m:ItemIds>${idler.map((i) => `<t:ItemId Id="${kacXml(i.id)}"${i.degisim ? ` ChangeKey="${kacXml(i.degisim)}"` : ""}/>`).join("")}</m:ItemIds></m:GetItem>`,
  );

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
}

/* Postanın alıcıları (To+Cc) arasında grup adresi var mı; grupAdresi boşsa hepsi geçer. */
export const grubaUygun = (m: EwsMesaj, grupAdresi: string): boolean => {
  const g = grupAdresi.trim().toLowerCase();
  if (!g) return true;
  return m.alicilar.includes(g);
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
    const alicilar: string[] = [];
    for (const r of g.matchAll(/<(?:[a-z]+:)?(?:ToRecipients|CcRecipients)\b[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?(?:ToRecipients|CcRecipients)>/gi)) {
      for (const e of r[1].matchAll(/<(?:[a-z]+:)?EmailAddress>([\s\S]*?)<\/(?:[a-z]+:)?EmailAddress>/gi)) alicilar.push(varlikCoz(e[1]).trim().toLowerCase());
    }
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
const OKUMA_ZAMAN_ASIMI = 15000;
const yanitOku = async (soket: Soket): Promise<HttpYanit> => {
  let tampon: Uint8Array = new Uint8Array(0);
  for (;;) {
    const cerceve = httpCerceveCoz(tampon);
    if (cerceve) return cerceve;
    let zamanlayici: ReturnType<typeof setTimeout> | undefined;
    // Soketin sıfırlanması ("Stream was cancelled") okuma hatası olarak gelir; EOF gibi ele al.
    const parca = await Promise.race([
      soket.oku().catch(() => null),
      new Promise<never>((_, red) => { zamanlayici = setTimeout(() => red(new Error("okuma zaman aşımı")), OKUMA_ZAMAN_ASIMI); }),
    ]).finally(() => clearTimeout(zamanlayici));
    if (!parca) {
      // Bağlantı kapandı/sıfırlandı: tam çerçeve varsa onu, yoksa başlık+eldeki gövdeyle en iyisini döndür.
      const son = httpCerceveCoz(tampon) ?? cerceveZorla(tampon);
      if (son) return son;
      throw new Error("bağlantı yanıt gelmeden kapandı");
    }
    tampon = birlestirBayt([tampon, parca]);
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
 * Gelen kutusundan en yeni `adet` postayı çeker: FindItem ile kimlikler,
 * GetItem ile gövdeler. Tek soket; FindItem el sıkışmasından sonra GetItem
 * aynı doğrulanmış bağlantıda. Hata metinle döner (kullanıcı "dene"de görsün).
 */
export const postalariCek = async (ayar: EwsAyar, baglan: Baglan, simdi: number, adet = 25, mic = false): Promise<{ mesajlar: EwsMesaj[] } | { hata: string; kimlik?: boolean }> => {
  let soket: Soket | undefined;
  try {
    soket = await baglan(ayar.sunucu);
    const bul = await ntlmIstek(soket, ayar, findItemIstegi(adet), simdi, true, mic);
    // 401: kimlik reddedildi. Üst katman MIC'li/MIC'siz ikinci denemeyi buna bakarak yapıyor.
    if (bul.durum === 401) return { hata: "kimlik doğrulanamadı (kullanıcı adı, parola ya da alan yanlış olabilir)", kimlik: true };
    if (bul.durum !== 200) return { hata: `FindItem ${bul.durum}: ${faultMetni(latin1Utf8(bul.govde))}` };
    const idler = findItemCoz(latin1Utf8(bul.govde));
    if (idler.length === 0) return { mesajlar: [] };
    const al = await ntlmIstek(soket, ayar, getItemIstegi(idler), simdi, false);
    if (al.durum !== 200) return { hata: `GetItem ${al.durum}: ${faultMetni(latin1Utf8(al.govde))}` };
    return { mesajlar: getItemCoz(latin1Utf8(al.govde)) };
  } catch (e) {
    return { hata: e instanceof Error ? e.message : String(e) };
  } finally {
    await soket?.kapat().catch(() => {});
  }
};

/* Önce sade NTLMv2 (MIC'siz), kimlik reddedilirse MIC'li yeni bağlantıda dener; hangisi tuttuysa o. */
export const postalariCekOtomatik = async (ayar: EwsAyar, baglan: Baglan, simdi: number, adet = 25): Promise<{ mesajlar: EwsMesaj[] } | { hata: string }> => {
  const ilk = await postalariCek(ayar, baglan, simdi, adet, false);
  if (!("hata" in ilk) || !ilk.kimlik) return ilk;
  return postalariCek(ayar, baglan, simdi, adet, true);
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
