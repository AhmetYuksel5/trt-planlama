import assert from "node:assert/strict";
import { test } from "node:test";
import { md4, md5, hmacMd5, ntlmv2Karma, ntlmv2Yanit, birlestir, tip1, tip2Coz, tip3, b64Coz } from "../src/ntlm.ts";

/*
 * NTLMv2 kriptosunun doğruluğu: MD4/MD5/HMAC-MD5 standart vektörleri ve
 * MS-NLMP §4.2.4 NTLMv2 örneği (User/Domain/Password). Ayrıca gerçek
 * sunucudan (posta.trt.net.tr) alınan Type2 challenge'ın çözümü. Ağ yok.
 */

const onalt = (u: Uint8Array) => Buffer.from(u).toString("hex");
const bayt = (h: string) => Uint8Array.from(Buffer.from(h, "hex"));
const yazi = (s: string) => new TextEncoder().encode(s);

test("MD4 vektörleri (RFC 1320)", () => {
  assert.equal(onalt(md4(yazi(""))), "31d6cfe0d16ae931b73c59d7e0c089c0");
  assert.equal(onalt(md4(yazi("abc"))), "a448017aaf21d8525fc10ae87aa6729d");
  assert.equal(onalt(md4(yazi("message digest"))), "d9130a8164549fe818874806e1c7014b");
});

test("MD5 vektörleri (RFC 1321)", () => {
  assert.equal(onalt(md5(yazi(""))), "d41d8cd98f00b204e9800998ecf8427e");
  assert.equal(onalt(md5(yazi("abc"))), "900150983cd24fb0d6963f7d28e17f72");
  assert.equal(onalt(md5(yazi("The quick brown fox jumps over the lazy dog"))), "9e107d9d372bb6826bd81d3542a419d6");
});

test("HMAC-MD5 vektörü (RFC 2104)", () => {
  assert.equal(onalt(hmacMd5(new Uint8Array(16).fill(0x0b), yazi("Hi There"))), "9294727a3638bb1c13f48ef8158bfc9d");
});

test("NTLMv2 karması (MS-NLMP §4.2.4.1.1)", () => {
  // NTOWFv2("Password","User","Domain")
  assert.equal(onalt(ntlmv2Karma("Password", "User", "Domain")), "0c868a403bfd7a93a3001ef22ef02e3f");
});

test("NTLMv2 NTProofStr ve oturum anahtarı (MS-NLMP §4.2.4.2)", () => {
  const v2 = ntlmv2Karma("Password", "User", "Domain");
  const sunucuMeydan = bayt("0123456789abcdef");
  // temp: MS-NLMP §4.2.4.1.3'ten olduğu gibi (zaman 0, istemci meydanı aa*8, Domain/Server hedef bilgisi).
  const temp = bayt(
    "0101000000000000" + "0000000000000000" + "aaaaaaaaaaaaaaaa" + "0000000002000c00" +
    "44006f006d006100" + "69006e0001000c00" + "5300650072007600" + "6500720000000000" + "00000000",
  );
  const { ntProof, oturumTemel } = ntlmv2Yanit(v2, sunucuMeydan, temp);
  assert.equal(onalt(ntProof), "68cd0ab851e51c96aabc927bebef6a1c");
  assert.equal(onalt(oturumTemel), "8de40ccadbc14a82f15cb0ad0de95ca3");
});

test("Tip1 NTLMSSP imzası ve tipi", () => {
  const t1 = tip1();
  assert.equal(Buffer.from(t1.subarray(0, 8)).toString("latin1"), "NTLMSSP\0");
  assert.equal(t1[8], 1); // mesaj tipi 1
});

test("Tip3 (MIC'siz) yapısı: imza, tip, 72 bayt başlık, alanlar yerli yerinde", () => {
  const t1 = tip1();
  // Küçük bir hedef bilgi: NetBIOS alan "TRT" (AvId 2) + sonlandırıcı.
  const hedef = bayt("02000600540052005400" + "00000000");
  const ham = birlestir(bayt("4e544c4d53535000"), bayt("02000000"), bayt("06000600" + "30000000"), bayt("05828a62"), bayt("1122334455667788"), bayt("0000000000000000"), bayt("2c002c00" + "38000000"), hedef);
  // ham burada tam Type2 değil; tip2Coz yalnız sunucuMeydan/hedefBilgi/bayrak okuyor.
  const t2 = tip2Coz(ham);
  const msg = tip3({ kullanici: "User", parola: "Password", alan: "Domain", calisma: "WS", tip2: t2, simdi: 0, istemciMeydan: bayt("aaaaaaaaaaaaaaaa"), tip1Ham: t1 });
  assert.equal(Buffer.from(msg.subarray(0, 8)).toString("latin1"), "NTLMSSP\0");
  assert.equal(msg[8], 3);
  const oku16 = (o: number) => msg[o] | (msg[o + 1] << 8);
  const oku32 = (o: number) => (msg[o] | (msg[o + 1] << 8) | (msg[o + 2] << 16) | (msg[o + 3] << 24)) >>> 0;
  // Domain alanı (tanım 28. bayttan) "Domain", kullanıcı "User" (UTF-16LE).
  const alan = (base: number) => { const len = oku16(base), off = oku32(base + 4); return Buffer.from(msg.subarray(off, off + len)).toString("utf16le"); };
  assert.equal(alan(28), "Domain");
  assert.equal(alan(36), "User");
  assert.equal(alan(44), "WS");
  // İlk güvenlik tanımı (LM) 72. bayttan başlıyor (başlık MIC'siz 72 bayt).
  assert.equal(oku32(16), 72);
});

test("gerçek Type2 (posta.trt.net.tr) çözülüyor", () => {
  // 2026-11-07'de sunucunun Type1'e verdiği challenge; alan TRT, hedef bilgide zaman damgası var.
  const b64 = "TlRMTVNTUAACAAAABgAGADgAAAAFgokCHgJCAGTJSh4AAAAAAAAAAKwArAA+AAAACgB8TwAAAA9UAFIAVAACAAYAVABSAFQAAQAWAFQAUgBUAFMAMAA2AEUAWABDAEgAMwAEABwAaQBuAHQALgB0AHIAdAAuAG4AZQB0AC4AdAByAAMANABUAFIAVABTADAANgBFAFgAQwBIADMALgBpAG4AdAAuAHQAcgB0AC4AbgBlAHQALgB0AHIABQAcAGkAbgB0AC4AdAByAHQALgBuAGUAdAAuAHQAcgAHAAgA7eIoRa1u3QEAAAAA";
  const t2 = tip2Coz(b64Coz(b64));
  assert.equal(t2.sunucuMeydan.length, 8);
  assert.ok((t2.bayrak & 0x00800000) !== 0, "TargetInfo bayrağı açık");
  // Hedef bilgide zaman damgası (AvId 7) olmalı → gerçek sunucuda MIC yolu çalışacak.
  let o = 0, zamanVar = false;
  while (o + 4 <= t2.hedefBilgi.length) {
    const id = t2.hedefBilgi[o] | (t2.hedefBilgi[o + 1] << 8);
    const uz = t2.hedefBilgi[o + 2] | (t2.hedefBilgi[o + 3] << 8);
    if (id === 7) zamanVar = true;
    if (id === 0) break;
    o += 4 + uz;
  }
  assert.ok(zamanVar, "Type2 hedef bilgisinde zaman damgası var");
});
