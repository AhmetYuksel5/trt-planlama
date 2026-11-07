/*
 * NTLMv2 kimlik doğrulama (yalnız imzasız/mühürsüz oturum açma için gereken
 * kadar). Exchange on-prem'in EWS ucu yalnız NTLM/Negotiate istiyor; Cloudflare
 * Worker'ın fetch'i NTLM'in üç adımlı el sıkışmasını tek bağlantıya
 * sabitleyemediği için ham TLS soketinde elle yürütülüyor (ews.ts).
 *
 * Web Crypto'da MD4/MD5 yok; NTLM bunları şart koşuyor. Burada saf JS ile
 * MD4, MD5 ve HMAC-MD5 var. Doğruluk MS-NLMP §4.2.4 örnek vektörleriyle
 * sınanıyor (test/ntlm.test.ts). İmzalama/mühürleme (RC4/DES) kullanılmıyor,
 * yalnız NTLMv2 yanıtı ve MIC üretiliyor.
 */

const sol = (x: number, c: number) => (x << c) | (x >>> (32 - c));

/* --- MD4 (RFC 1320): NT karması parolanın MD4'ü --- */
export function md4(mesaj: Uint8Array): Uint8Array {
  const u = mesajUzat(mesaj);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & y) | (x & z) | (y & z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  for (let i = 0; i < u.length; i += 16) {
    const x = u.subarray(i, i + 16);
    const aa = a, bb = b, cc = c, dd = d;
    const r1 = (p: number, q: number, r: number, s: number, k: number, sh: number) => sol((p + F(q, r, s) + x[k]) >>> 0, sh);
    a = r1(a, b, c, d, 0, 3); d = r1(d, a, b, c, 1, 7); c = r1(c, d, a, b, 2, 11); b = r1(b, c, d, a, 3, 19);
    a = r1(a, b, c, d, 4, 3); d = r1(d, a, b, c, 5, 7); c = r1(c, d, a, b, 6, 11); b = r1(b, c, d, a, 7, 19);
    a = r1(a, b, c, d, 8, 3); d = r1(d, a, b, c, 9, 7); c = r1(c, d, a, b, 10, 11); b = r1(b, c, d, a, 11, 19);
    a = r1(a, b, c, d, 12, 3); d = r1(d, a, b, c, 13, 7); c = r1(c, d, a, b, 14, 11); b = r1(b, c, d, a, 15, 19);
    const r2 = (p: number, q: number, r: number, s: number, k: number, sh: number) => sol((p + G(q, r, s) + x[k] + 0x5a827999) >>> 0, sh);
    a = r2(a, b, c, d, 0, 3); d = r2(d, a, b, c, 4, 5); c = r2(c, d, a, b, 8, 9); b = r2(b, c, d, a, 12, 13);
    a = r2(a, b, c, d, 1, 3); d = r2(d, a, b, c, 5, 5); c = r2(c, d, a, b, 9, 9); b = r2(b, c, d, a, 13, 13);
    a = r2(a, b, c, d, 2, 3); d = r2(d, a, b, c, 6, 5); c = r2(c, d, a, b, 10, 9); b = r2(b, c, d, a, 14, 13);
    a = r2(a, b, c, d, 3, 3); d = r2(d, a, b, c, 7, 5); c = r2(c, d, a, b, 11, 9); b = r2(b, c, d, a, 15, 13);
    const r3 = (p: number, q: number, r: number, s: number, k: number, sh: number) => sol((p + H(q, r, s) + x[k] + 0x6ed9eba1) >>> 0, sh);
    a = r3(a, b, c, d, 0, 3); d = r3(d, a, b, c, 8, 9); c = r3(c, d, a, b, 4, 11); b = r3(b, c, d, a, 12, 15);
    a = r3(a, b, c, d, 2, 3); d = r3(d, a, b, c, 10, 9); c = r3(c, d, a, b, 6, 11); b = r3(b, c, d, a, 14, 15);
    a = r3(a, b, c, d, 1, 3); d = r3(d, a, b, c, 9, 9); c = r3(c, d, a, b, 5, 11); b = r3(b, c, d, a, 13, 15);
    a = r3(a, b, c, d, 3, 3); d = r3(d, a, b, c, 11, 9); c = r3(c, d, a, b, 7, 11); b = r3(b, c, d, a, 15, 15);
    a = (a + aa) >>> 0; b = (b + bb) >>> 0; c = (c + cc) >>> 0; d = (d + dd) >>> 0;
  }
  return kelimelerBayt([a, b, c, d]);
}

/* --- MD5 (RFC 1321): HMAC-MD5 ve MIC için --- */
const MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const MD5_K = (() => {
  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  return k;
})();

export function md5(mesaj: Uint8Array): Uint8Array {
  const u = mesajUzat(mesaj);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let i = 0; i < u.length; i += 16) {
    const m = u.subarray(i, i + 16);
    let a = a0, b = b0, c = c0, d = d0;
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      const tmp = d; d = c; c = b;
      b = (b + sol((a + f + MD5_K[j] + m[g]) >>> 0, MD5_S[j])) >>> 0;
      a = tmp;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  return kelimelerBayt([a0, b0, c0, d0]);
}

/* Mesajı 512 bitlik bloklara uzatıp 32-bit kelime dizisine (little-endian) çeviriyor; MD4 ve MD5 aynı dolguyu kullanıyor. */
function mesajUzat(mesaj: Uint8Array): Uint32Array {
  const bitUz = mesaj.length * 8;
  const toplam = ((mesaj.length + 8) >> 6) + 1;
  const u = new Uint32Array(toplam * 16);
  for (let i = 0; i < mesaj.length; i++) u[i >> 2] |= mesaj[i] << ((i % 4) * 8);
  u[mesaj.length >> 2] |= 0x80 << ((mesaj.length % 4) * 8);
  u[toplam * 16 - 2] = bitUz >>> 0;
  u[toplam * 16 - 1] = Math.floor(bitUz / 2 ** 32) >>> 0;
  return u;
}

const kelimelerBayt = (k: number[]): Uint8Array => {
  const b = new Uint8Array(k.length * 4);
  k.forEach((w, i) => { b[i * 4] = w & 255; b[i * 4 + 1] = (w >>> 8) & 255; b[i * 4 + 2] = (w >>> 16) & 255; b[i * 4 + 3] = (w >>> 24) & 255; });
  return b;
};

export function hmacMd5(anahtar: Uint8Array, mesaj: Uint8Array): Uint8Array {
  let k = anahtar;
  if (k.length > 64) k = md5(k);
  const ipad = new Uint8Array(64), opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) { const b = i < k.length ? k[i] : 0; ipad[i] = b ^ 0x36; opad[i] = b ^ 0x5c; }
  return md5(birlestir(opad, md5(birlestir(ipad, mesaj))));
}

export const birlestir = (...p: Uint8Array[]): Uint8Array => {
  const u = new Uint8Array(p.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of p) { u.set(x, o); o += x.length; }
  return u;
};

const utf16le = (s: string): Uint8Array => {
  const u = new Uint8Array(s.length * 2);
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); u[i * 2] = c & 255; u[i * 2 + 1] = c >>> 8; }
  return u;
};

export const b64Coz = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const b64Yap = (u: Uint8Array): string => btoa(String.fromCharCode(...u));

/* NT karması ve NTLMv2 karması (MS-NLMP §3.3.2). Kullanıcı adı büyük harfe, alan olduğu gibi. */
export const ntKarma = (parola: string): Uint8Array => md4(utf16le(parola));
export const ntlmv2Karma = (parola: string, kullanici: string, alan: string): Uint8Array => hmacMd5(ntKarma(parola), utf16le(kullanici.toUpperCase() + alan));

/* --- NTLM mesajları --- */

const IMZA = new Uint8Array([0x4e, 0x54, 0x4c, 0x4d, 0x53, 0x53, 0x50, 0x00]); // "NTLMSSP\0"

/* Bayraklar: Unicode, NTLM, AlwaysSign, ExtendedSessionSecurity, TargetInfo, Version. İmzalama/mühürleme ve anahtar değişimi yok. */
const NEG_UNICODE = 0x00000001, NEG_NTLM = 0x00000200, NEG_ALWAYS_SIGN = 0x00008000, NEG_EXT_SEC = 0x00080000, NEG_TARGET_INFO = 0x00800000, NEG_VERSION = 0x02000000, REQ_TARGET = 0x00000004;

const le16 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255]);
const le32 = (n: number) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const oku16 = (u: Uint8Array, o: number) => u[o] | (u[o + 1] << 8);
const oku32 = (u: Uint8Array, o: number) => (u[o] | (u[o + 1] << 8) | (u[o + 2] << 16) | (u[o + 3] << 24)) >>> 0;

/* Sürüm alanı: 6.1 (Win7) + yapı 7601; yalnız biçimsel, sunucu buna bakmıyor. */
const SURUM = new Uint8Array([6, 1, 0xb1, 0x1d, 0, 0, 0, 0x0f]);

export function tip1(): Uint8Array {
  const bayrak = NEG_UNICODE | NEG_NTLM | NEG_ALWAYS_SIGN | NEG_EXT_SEC | NEG_TARGET_INFO | NEG_VERSION | REQ_TARGET;
  // Domain ve Workstation boş (offset 32'den sonra veri yok).
  return birlestir(IMZA, le32(1), le32(bayrak), le16(0), le16(0), le32(32), le16(0), le16(0), le32(32), SURUM);
}

export interface Tip2 {
  sunucuMeydan: Uint8Array; // 8 bayt
  hedefBilgi: Uint8Array; // TargetInfo (AV çiftleri), MIC/temp için olduğu gibi kullanılıyor
  bayrak: number;
  ham: Uint8Array;
}

export function tip2Coz(ham: Uint8Array): Tip2 {
  const bayrak = oku32(ham, 20);
  const sunucuMeydan = ham.subarray(24, 32);
  const tiUz = oku16(ham, 40), tiOf = oku32(ham, 44);
  const hedefBilgi = ham.subarray(tiOf, tiOf + tiUz);
  return { sunucuMeydan, hedefBilgi, bayrak, ham };
}

/* TargetInfo'daki zaman damgası (AvId 0x0007); yoksa şimdinin Windows FILETIME'ı. */
const hedefZaman = (hedefBilgi: Uint8Array, simdi: number): Uint8Array => {
  let o = 0;
  while (o + 4 <= hedefBilgi.length) {
    const id = oku16(hedefBilgi, o), uz = oku16(hedefBilgi, o + 2);
    if (id === 0x0007) return hedefBilgi.subarray(o + 4, o + 4 + 8);
    if (id === 0x0000) break;
    o += 4 + uz;
  }
  return filetime(simdi);
};

/* Unix ms → Windows FILETIME (1601'den bu yana 100ns), 8 bayt little-endian. */
export const filetime = (ms: number): Uint8Array => {
  const yuz = (BigInt(ms) + 11644473600000n) * 10000n;
  const u = new Uint8Array(8);
  let v = yuz;
  for (let i = 0; i < 8; i++) { u[i] = Number(v & 255n); v >>= 8n; }
  return u;
};

/* TargetInfo'ya MsvAvFlags (0x0006) içine "MIC var" bitini (0x02) ekliyor; yoksa çift ekleniyor. MS-NLMP 3.1.5.1.2. */
const bayrakliHedef = (hedefBilgi: Uint8Array): Uint8Array => {
  const parcalar: Uint8Array[] = [];
  let o = 0, bulundu = false;
  while (o + 4 <= hedefBilgi.length) {
    const id = oku16(hedefBilgi, o), uz = oku16(hedefBilgi, o + 2);
    const govde = hedefBilgi.subarray(o + 4, o + 4 + uz);
    if (id === 0x0000) break;
    if (id === 0x0006 && uz === 4) { const f = oku32(govde, 0) | 0x02; parcalar.push(le16(6), le16(4), le32(f)); bulundu = true; }
    else parcalar.push(le16(id), le16(uz), govde);
    o += 4 + uz;
  }
  if (!bulundu) parcalar.push(le16(6), le16(4), le32(0x02));
  parcalar.push(le16(0), le16(0)); // sonlandırıcı
  return birlestir(...parcalar);
};

/* NTLMv2 yanıtının çekirdeği (MS-NLMP §3.3.2); hedef bilgiden bağımsız, test edilebilir. */
export function ntlmv2Yanit(v2: Uint8Array, sunucuMeydan: Uint8Array, temp: Uint8Array) {
  const ntProof = hmacMd5(v2, birlestir(sunucuMeydan, temp));
  return { ntProof, ntResp: birlestir(ntProof, temp), oturumTemel: hmacMd5(v2, ntProof) };
}

export interface Tip3Girdi {
  kullanici: string;
  parola: string;
  alan: string;
  calisma?: string;
  tip2: Tip2;
  simdi: number;
  /** İstemci meydanı (8 bayt); testte sabitlenebilir. */
  istemciMeydan?: Uint8Array;
  /** Tip1 ve Tip2'nin ham baytları: MIC hesabı için. */
  tip1Ham: Uint8Array;
  /** MIC ekle (yalnız sunucu zorunlu kılıyorsa); varsayılan kapalı, sade NTLMv2. */
  mic?: boolean;
}

/*
 * NTLMv2 AUTHENTICATE (Tip3). NtChallengeResponse = NTProofStr + temp;
 * LmChallengeResponse = HMAC(serverChal+clientChal)+clientChal. MIC, hedef
 * bilgide zaman damgası olan sunucular için ekleniyor (MS-NLMP 3.1.5.1.2):
 * oturum anahtarıyla üç mesajın HMAC-MD5'i, Tip3 içinde MIC alanı sıfırken.
 */
export function tip3(g: Tip3Girdi): Uint8Array {
  const micli = g.mic ?? false;
  const v2 = ntlmv2Karma(g.parola, g.kullanici, g.alan);
  const istemciMeydan = g.istemciMeydan ?? rastgele(8);
  const zaman = hedefZaman(g.tip2.hedefBilgi, g.simdi);
  // MIC istenirse hedef bilgiye MsvAvFlags bayrağı ekleniyor; istenmezse sunucunun
  // verdiği hedef bilgi olduğu gibi (doğrulanmış sade NTLMv2; Exchange on-prem çoğunlukla böyle kabul ediyor).
  const hedef = micli ? bayrakliHedef(g.tip2.hedefBilgi) : g.tip2.hedefBilgi;
  // temp: resp type(1)+hi ver(1)+reserved(6)+time(8)+clientChal(8)+reserved(4)+targetInfo+reserved(4)
  const temp = birlestir(new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0]), zaman, istemciMeydan, le32(0), hedef, le32(0));
  const { ntResp, oturumTemel } = ntlmv2Yanit(v2, g.tip2.sunucuMeydan, temp);
  const lmResp = birlestir(hmacMd5(v2, birlestir(g.tip2.sunucuMeydan, istemciMeydan)), istemciMeydan);

  const dom = utf16le(g.alan), usr = utf16le(g.kullanici), ws = utf16le(g.calisma ?? "");
  const bos = new Uint8Array(0);
  const bayrak = NEG_UNICODE | NEG_NTLM | NEG_ALWAYS_SIGN | NEG_EXT_SEC | NEG_TARGET_INFO | NEG_VERSION;

  // Başlık: 8 imza + 4 tip + 6 güvenlik tanımı × 8 (lm,nt,dom,usr,ws,sessKey) + 4 bayrak + 8 sürüm (+ 16 MIC).
  const basUz = micli ? 88 : 72;
  const alanlar = [lmResp, ntResp, dom, usr, ws, bos];
  const ofsetler: number[] = [];
  let o = basUz;
  for (const a of alanlar) { ofsetler.push(o); o += a.length; }
  const tanim = (a: Uint8Array, of: number) => birlestir(le16(a.length), le16(a.length), le32(of));
  const govde = birlestir(...alanlar);
  const basla = (mic?: Uint8Array) => birlestir(
    IMZA, le32(3),
    tanim(lmResp, ofsetler[0]), tanim(ntResp, ofsetler[1]), tanim(dom, ofsetler[2]), tanim(usr, ofsetler[3]), tanim(ws, ofsetler[4]), tanim(bos, ofsetler[5]),
    le32(bayrak), SURUM, ...(mic ? [mic] : []),
  );
  if (!micli) return birlestir(basla(), govde);
  const micsiz = birlestir(basla(new Uint8Array(16)), govde);
  const mic = hmacMd5(oturumTemel, birlestir(g.tip1Ham, g.tip2.ham, micsiz));
  return birlestir(basla(mic), govde);
}

const rastgele = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));
