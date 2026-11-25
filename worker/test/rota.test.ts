import assert from "node:assert/strict";
import { test } from "node:test";
import { bosRotaAyar, gunSutunu, jwtKur, rotaAyarBirlestir, rotaGunu, rotaOku, sekmeAraligi, sekmeSec, tabloKimligi } from "../src/rota.ts";
import { kayitlardanOneriler, kayitlariBirlestir, rotaKayitlari, rotaKimligi, sunucuKayitlari } from "../../src/staffing.ts";

/* Rota tablosu (worker/src/rota.ts) ve tarayıcıdaki ayrıştırıcı (src/staffing.ts). Adlar kurgusal; ağ yok. */

test("sekme adından aralık; yıl dönümü ve boşluksuz yazım", () => {
  assert.deepEqual(sekmeAraligi("2026: NOV16-DEC13"), { bas: "2026-11-16", bit: "2026-12-13" });
  assert.deepEqual(sekmeAraligi("2026: DEC14-2027:JAN10"), { bas: "2026-12-14", bit: "2027-01-10" });
  assert.deepEqual(sekmeAraligi("2025:DEC15-2026:JAN11"), { bas: "2025-12-15", bit: "2026-01-11" });
  assert.deepEqual(sekmeAraligi("2026:JUL27-AUG23"), { bas: "2026-07-27", bit: "2026-08-23" });
  assert.deepEqual(sekmeAraligi("2022:SEPT26-OCT23"), { bas: "2022-09-26", bit: "2022-10-23" });
  assert.equal(sekmeAraligi("Staff list"), null);
  assert.equal(sekmeSec(["Staff list", "2026: DEC14-2027:JAN10", "2026: NOV16-DEC13"], "2026-11-25"), "2026: NOV16-DEC13");
  assert.equal(sekmeSec(["2026: NOV16-DEC13"], "2027-01-02"), undefined);
});

test("günün sütunu ve satırları", () => {
  const degerler = [
    ["NEWSROOM", "", "24.11.2026", "25.11.2026"],
    ["", "", "Tuesday", "Wednesday"],
    ["EP TEAM"],
    ["EP", "0700-1800", "Ali Veli", "Deniz Kaya"],
    ["EP", "1600-0200", "COMP", ""],
    [],
  ];
  assert.equal(gunSutunu(degerler[0], "2026-11-25"), 3);
  assert.equal(gunSutunu(degerler[0], "2026-11-26"), -1);
  assert.deepEqual(rotaGunu(degerler, "2026-11-25"), [
    ["EP TEAM", "", ""],
    ["EP", "0700-1800", "Deniz Kaya"],
    ["EP", "1600-0200", ""],
  ]);
  assert.equal(rotaGunu(degerler, "2026-12-01"), null);
});

test("ayar: tablo adresi ve hizmet hesabı JSON'u", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";
  assert.equal(tabloKimligi(`https://docs.google.com/spreadsheets/d/${id}/edit?gid=1#gid=1`), id);
  assert.equal(tabloKimligi("kısa"), "");
  const hesap = JSON.stringify({ type: "service_account", client_email: "rota@proje.iam.gserviceaccount.com", private_key: "-----BEGIN PRIVATE KEY-----\nAAA\n-----END PRIVATE KEY-----\n" });
  const r = rotaAyarBirlestir(bosRotaAyar(), { tablo: `https://docs.google.com/spreadsheets/d/${id}/edit`, hesap });
  assert.ok("ayar" in r && r.ayar.tabloId === id && r.ayar.istemciEposta === "rota@proje.iam.gserviceaccount.com" && r.ayar.ozelAnahtar.includes("BEGIN"));
  if (!("ayar" in r)) return;
  // Hesap gönderilmezse eskisi kalır; null siler; bozuk JSON reddedilir.
  const r2 = rotaAyarBirlestir(r.ayar, { tablo: id });
  assert.ok("ayar" in r2 && r2.ayar.ozelAnahtar === r.ayar.ozelAnahtar);
  const r3 = rotaAyarBirlestir(r.ayar, { hesap: null });
  assert.ok("ayar" in r3 && !r3.ayar.ozelAnahtar && !r3.ayar.istemciEposta);
  assert.deepEqual(rotaAyarBirlestir(r.ayar, { hesap: "{bozuk" }), { hata: "hesap" });
  assert.deepEqual(rotaAyarBirlestir(r.ayar, { hesap: JSON.stringify({ client_email: "biri@gmail.com", private_key: "x" }) }), { hata: "hesap" });
  assert.deepEqual(rotaAyarBirlestir(r.ayar, { tablo: "olmaz" }), { hata: "tablo" });
});

const pemYap = async () => {
  const k = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const ham = Buffer.from(await crypto.subtle.exportKey("pkcs8", k.privateKey)).toString("base64");
  return { k, pem: `-----BEGIN PRIVATE KEY-----\n${ham.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n` };
};

test("JWT hizmet hesabının anahtarıyla imzalı, kapsamı yalnız okuma", async () => {
  const { k, pem } = await pemYap();
  const jwt = await jwtKur("rota@proje.iam.gserviceaccount.com", pem, Date.UTC(2026, 10, 24));
  const [b, y, i] = jwt.split(".");
  const yuk = JSON.parse(Buffer.from(y, "base64url").toString());
  assert.equal(yuk.iss, "rota@proje.iam.gserviceaccount.com");
  assert.equal(yuk.scope, "https://www.googleapis.com/auth/spreadsheets.readonly");
  assert.equal(yuk.exp - yuk.iat, 3600);
  assert.ok(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", k.publicKey, Buffer.from(i, "base64url"), new TextEncoder().encode(`${b}.${y}`)));
});

test("rotaOku: erişim, doğru sekme, günün satırları; paylaşılmamış tablo açık hata", async () => {
  const { pem } = await pemYap();
  const ayar = { tabloId: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789", istemciEposta: "rota@proje.iam.gserviceaccount.com", ozelAnahtar: pem };
  const istekler: string[] = [];
  let paylasildi = true;
  const f = (async (u: string | URL | Request, o?: RequestInit) => {
    const adres = String(u);
    istekler.push(adres);
    if (adres.includes("oauth2")) return new Response(JSON.stringify({ access_token: "erisim" }), { status: 200 });
    assert.equal((o?.headers as Record<string, string>).authorization, "Bearer erisim");
    if (!paylasildi) return new Response("{}", { status: 403 });
    if (adres.includes("fields=sheets")) return new Response(JSON.stringify({ sheets: [{ properties: { title: "2026: OCT19-NOV15" } }, { properties: { title: "2026: NOV16-DEC13" } }] }), { status: 200 });
    assert.ok(decodeURIComponent(adres).includes("'2026: NOV16-DEC13'!A1:AD400"));
    return new Response(JSON.stringify({ values: [["NEWSROOM", "", "25.11.2026"], [], ["EP TEAM"], ["EP", "0700-1800", "Deniz Kaya"]] }), { status: 200 });
  }) as typeof fetch;
  const r = await rotaOku(ayar, "2026-11-25", f, Date.UTC(2026, 10, 24));
  assert.deepEqual(r, { sekme: "2026: NOV16-DEC13", satirlar: [["EP TEAM", "", ""], ["EP", "0700-1800", "Deniz Kaya"]] });
  paylasildi = false;
  assert.equal(((await rotaOku(ayar, "2026-11-25", f, Date.UTC(2026, 10, 24))) as { hata: string }).hata, "paylasim");
  assert.deepEqual(await rotaOku({ ...ayar, ozelAnahtar: "" }, "2026-11-25", f, 0), { hata: "eksik" });
});

test("tarayıcıdaki ayrıştırıcı: gruplar, vardiya, izin ve eşleme", () => {
  const satirlar: [string, string, string][] = [
    ["EP TEAM", "", ""],
    ["EP", "0700-1800", "Deniz Kaya"],
    ["EP", "1600-0200", "COMP"],
    ["PE EARLY TEAM", "", ""],
    ["Programme Editor", "0700-1600", "Ali Veli"],
    ["PE POLITICAL PROGRAMS", "", ""],
    ["Programme Editor", "1445-2345", "Ece Su"],
    ["NEWSDESK", "", ""],
    ["Senior News Editor", "0700-1815   ", "Can Ak"],
    ["TV ENGAGEMENT", "", ""],
    ["Deployment", "", "Oya Er"],
  ];
  const k = rotaKayitlari(satirlar);
  assert.equal(k.length, 6);
  assert.deepEqual(k[0], { bolum: "newsroom", grup: "EP TEAM", unvan: "EP", ad: "Deniz Kaya", saat: "07:00", bitis: "18:00", calisiyor: true });
  assert.equal(k[1].calisiyor, false);
  const kisiler = [
    { id: "a", ad: { tr: "Deniz Kaya", ar: "دنيز", en: "Deniz Kaya" } },
    { id: "b", ad: { tr: "Ali Veli", ar: "علي", en: "Ali Veli" } },
    { id: "c", ad: { tr: "Can Ak", ar: "جان", en: "Can Ak" } },
  ] as never;
  const o = kayitlardanOneriler(k, kisiler);
  // Siyasi program ekibi ve saatsiz "Deployment" Next Day'e girmez; COMP çalışmıyor.
  assert.deepEqual(o.map((x) => [x.gorev, x.kisiId, x.vardiya]), [
    ["yapimciSef", "a", "04:00"],
    ["bultenYapimcisi", "b", "04:00"],
    ["muhabirMasasi", "c", "04:00"],
  ]);
  assert.notEqual(rotaKimligi("2026-11-25", satirlar), rotaKimligi("2026-11-25", satirlar.slice(1)));
});

test("sunucular tablosu: yılsız gün satırı, vardiyalar, program ve izin satırları girmez", () => {
  const degerler = [
    ["SB", "Ece Su", "Can Ak"],
    [],
    ["", "24 November", "25 November"],
    ["", "Tue", "Wed"],
    ["05.00-15.00", "Ali Veli", "Deniz Kaya"],
    ["11.00-21.00", "", "Oya Er"],
    ["20.00-20.25 - Bir Program (Live) (25 mins.)", "Ali Veli", "Oya Er"],
    ["ANNUAL LEAVE", "", "Ece Su"],
    ["COMP", "Can Ak", ""],
  ];
  assert.equal(gunSutunu(degerler[2], "2026-11-25"), 2);
  const s = rotaGunu(degerler, "2026-11-25", "sunucu")!;
  // İlk günün sütunu (B) tarayıcıya gitmez; yedek satırlar tarih satırının üstünde kalır.
  assert.ok(s.every((x) => x[1] === "") && !s.some((x) => x[0] === "SB"));
  assert.equal(rotaGunu(degerler, "2026-11-24", "sunucu")![0][2], "Ali Veli");
  const k = sunucuKayitlari(s);
  assert.deepEqual(k.map((x) => [x.ad, x.saat]), [["Deniz Kaya", "05:00"], ["Oya Er", "11:00"]]);
  // Sunucular tablosu varsa öbür kaynağın sunucu satırları düşer.
  const ana = [{ bolum: "presenter" as const, grup: "PRESENTER", unvan: "", ad: "Eski", saat: "08:00", calisiyor: true }, ...rotaKayitlari([["EP TEAM", "", ""], ["EP", "0700-1800", "Ali Veli"]])];
  assert.deepEqual(kayitlariBirlestir(ana, k).map((x) => x.ad), ["Ali Veli", "Deniz Kaya", "Oya Er"]);
  assert.equal(kayitlariBirlestir(ana, null).length, 2);
});

test("ayar: sunucular tablosu ayrı adres", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";
  const r = rotaAyarBirlestir(bosRotaAyar(), { sunucuTablo: `https://docs.google.com/spreadsheets/d/${id}/edit` });
  assert.ok("ayar" in r && r.ayar.sunucuTabloId === id && !r.ayar.tabloId);
  assert.deepEqual(rotaAyarBirlestir(bosRotaAyar(), { sunucuTablo: "olmaz" }), { hata: "tablo" });
});

test("kişinin kopyası: tarih aralığı adı olmayan sekmelerde gün aranır", async () => {
  const { pem } = await pemYap();
  const ayar = { tabloId: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789", sunucuTabloId: "", istemciEposta: "rota@proje.iam.gserviceaccount.com", ozelAnahtar: pem };
  const okunan: string[] = [];
  const f = (async (u: string | URL | Request) => {
    const adres = decodeURIComponent(String(u));
    if (adres.includes("oauth2")) return new Response(JSON.stringify({ access_token: "erisim" }), { status: 200 });
    if (adres.includes("fields=sheets")) return new Response(JSON.stringify({ sheets: [{ properties: { title: "Bu dönem" } }, { properties: { title: "Sonraki dönem" } }] }), { status: 200 });
    okunan.push(adres);
    const ilk = adres.includes("'Bu dönem'");
    return new Response(JSON.stringify({ values: [["NEWSROOM", "", ilk ? "13.12.2026" : "14.12.2026"], [], ["EP TEAM"], ["EP", "0700-1800", ilk ? "Ali Veli" : "Deniz Kaya"]] }), { status: 200 });
  }) as typeof fetch;
  const r = await rotaOku(ayar, "2026-12-14", f, Date.UTC(2026, 11, 13));
  assert.deepEqual(r, { sekme: "Sonraki dönem", satirlar: [["EP TEAM", "", ""], ["EP", "0700-1800", "Deniz Kaya"]] });
  assert.equal(okunan.length, 2);
  assert.deepEqual(await rotaOku(ayar, "2026-12-20", f, Date.UTC(2026, 11, 13)), { hata: "sekme" });
});
