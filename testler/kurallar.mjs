// Firestore kuralları: güvenlik incelemesindeki saldırılar reddediliyor, programın olağan yazışları geçiyor.
// Çalıştırma belgeler/gercek-kip.md'de (emülatör, @firebase/rules-unit-testing).
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import fs from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-trt", firestore: { rules: fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 } });
const kisi = (id, o, duz = {}) => ({ s: 0, j: JSON.stringify({ id, ad: { tr: id, ar: id, en: id }, telefon: "1", ...o }), eposta: id + "@x.test", pasif: false, hesapYoneticisi: !!o.hesapYoneticisi, kisitli: o.birim === "muhabir", ...(o.birim ? { birim: o.birim, rol: o.rol, gorev: o.gorev } : {}), ...duz });
const KISILER = {
  adm: kisi("adm", { birim: "yonetim", rol: "yonetici", gorev: "mudur", hesapYoneticisi: true }),
  pl: kisi("pl", { birim: "planlama", rol: "personel", gorev: "planlamaci" }),
  kd: kisi("kd", { birim: "planlama", rol: "personel", gorev: "planlamaci", yetkiler: ["kisiDuzenle", "hesapAcKapa"] }, { yetkiler: ["kisiDuzenle", "hesapAcKapa"] }),
  dv: kisi("dv", { birim: "planlama", rol: "personel", gorev: "planlamaci", yetkiler: ["davet"] }, { yetkiler: ["davet"] }),
  mu: kisi("mu", { birim: "muhabir", rol: "personel", gorev: "muhabir-s-istanbul", sehir: "istanbul" }),
  mu2: kisi("mu2", { birim: "muhabir", rol: "personel", gorev: "muhabir-s-ankara" }),
  hs: kisi("hs", { birim: "muhabir", rol: "personel", gorev: "muhabir", hesapsiz: true }, { hesapsiz: true }),
  mux: kisi("mux", { birim: "muhabir", rol: "personel", gorev: "muhabir", oncekiKimlik: "mu2" }, { oncekiKimlik: "mu2" }),
  muy: kisi("muy", { birim: "muhabir", rol: "personel", gorev: "muhabir", oncekiKimlik: "hs" }, { oncekiKimlik: "hs" }),
  // Düz pozisyon alanı olmayan eski belge
  eski: { s: 0, j: JSON.stringify({ id: "eski", birim: "planlama", rol: "personel", gorev: "planlamaci", telefon: "1" }), eposta: "eski@x.test", pasif: false, hesapYoneticisi: false, kisitli: false },
};
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  for (const [id, v] of Object.entries(KISILER)) await setDoc(doc(db, "kisiler", id), v);
  await setDoc(doc(db, "oneriler", "o1"), { s: 0, j: JSON.stringify({ id: "o1", durum: "yeni", muhabirId: "mu" }), m: ["mu"] });
  await setDoc(doc(db, "oneriler", "o2"), { s: 0, j: JSON.stringify({ id: "o2", durum: "degerlendiriliyor", muhabirId: "mu" }), m: ["mu"] });
  await setDoc(doc(db, "oneriler", "o3"), { s: 0, j: JSON.stringify({ id: "o3", durum: "yeni", muhabirId: "mu2" }), m: ["mu2"] });
  await setDoc(doc(db, "oneriler", "o4"), { s: 0, j: JSON.stringify({ id: "o4", durum: "yeni", muhabirId: "hs" }), m: ["hs"] });
  await setDoc(doc(db, "paketler", "p1"), { s: 0, j: JSON.stringify({ id: "p1", durum: "onaylandi", muhabirId: "mu" }), m: ["mu"] });
  await setDoc(doc(db, "paketler", "p2"), { s: 0, j: JSON.stringify({ id: "p2", durum: "onaylandi", muhabirId: "mu", ozelId: "oz1" }), m: ["mu"] });
  await setDoc(doc(db, "hareketler", "h0"), { s: 0, j: JSON.stringify({ id: "h0", kisiId: "adm", tip: "x", veri: { kime: "mu" } }), m: ["mu"] });
});
const db = (uid) => env.authenticatedContext(uid, { email: uid + "@x.test", email_verified: true }).firestore();
const yaz = (u, k, v) => setDoc(doc(db(u), "kisiler", k), v);
const j = (base, ek) => ({ ...base, j: JSON.stringify({ ...JSON.parse(base.j), ...ek }) });
let gec = 0, kal = 0;
const t = async (ad, beklenen, p) => { try { await (beklenen ? assertSucceeds(p) : assertFails(p)); gec++; } catch (e) { kal++; console.log("✗", ad, String(e).slice(0, 200)); } };

// 1. j'ye yetki
await t("muhabir j'ye hesapYoneticisi", false, yaz("mu", "mu", j(KISILER.mu, { hesapYoneticisi: true })));
await t("personel j'ye yetkiler", false, yaz("pl", "pl", j(KISILER.pl, { yetkiler: ["davet"] })));
await t("personel j'ye ucretYetkisi", false, yaz("pl", "pl", j(KISILER.pl, { ucretYetkisi: true })));
await t("muhabir çift birim", false, yaz("mu", "mu", { ...KISILER.mu, j: KISILER.mu.j.replace(/}$/, ',"birim":"planlama"}') }));
await t("personel kendine yönetici rolü (j)", false, yaz("pl", "pl", j(KISILER.pl, { rol: "yonetici" })));
await t("personel kendine yönetici rolü (j+düz)", false, yaz("pl", "pl", { ...j(KISILER.pl, { rol: "yonetici" }), rol: "yonetici" }));
await t("personel birim değiştirir", false, yaz("pl", "pl", { ...j(KISILER.pl, { birim: "yonetim" }), birim: "yonetim" }));
await t("personel kendi telefonu", true, yaz("pl", "pl", j(KISILER.pl, { telefon: "2" })));
await t("muhabir şehri ve şehir ünvanı", true, yaz("mu", "mu", { ...j(KISILER.mu, { sehir: "ankara", gorev: "muhabir-s-ankara" }), gorev: "muhabir-s-ankara" }));
await t("muhabir ünvanı başka göreve", false, yaz("mu", "mu", { ...j(KISILER.mu, { gorev: "planlamaci" }), gorev: "planlamaci" }));
await t("eski belge ilk yazış (düz alan eklenir)", true, yaz("eski", "eski", { ...j(KISILER.eski, { telefon: "3" }), birim: "planlama", rol: "personel", gorev: "planlamaci" }));
await t("tam yönetici rol verir", true, yaz("adm", "pl", { ...j(KISILER.pl, { rol: "yonetici" }), rol: "yonetici" }));
await t("tam yönetici j-düz çelişkili yazamaz", false, yaz("adm", "pl", j(KISILER.pl, { hesapYoneticisi: true })));
await t("kişi düzenleme yetkilisi birim/rol değiştirir", true, yaz("kd", "pl", { ...j(KISILER.pl, { birim: "newsdesk", rol: "yonetici", gorev: "ep" }), birim: "newsdesk", rol: "yonetici", gorev: "ep" }));
await t("kişi düzenleme yetkilisi ücret yetkisi veremez", false, yaz("kd", "mu2", j(KISILER.mu2, { ucretYetkisi: true })));
await t("hesap kapatan pasif yapar", true, yaz("kd", "mu2", { ...j(KISILER.mu2, { pasif: true }), pasif: true }));
await t("hesap kapatan rol değiştiremez (kisiDuzenle'siz)", false, yaz("dv", "eski", { ...j(KISILER.eski, { rol: "yonetici" }), rol: "yonetici", birim: "planlama", gorev: "planlamaci" }));
// 2. Kısıtlı içerik
const on = (id, ek, m = ["mu"]) => setDoc(doc(db("mu"), "oneriler", id), { s: 0, j: JSON.stringify({ id, muhabirId: "mu", ...ek }), m });
await t("muhabir yeni öneri", true, on("o9", { durum: "yeni" }));
await t("muhabir yeni öneri 'plana eklendi'", false, on("o10", { durum: "planaEklendi" }));
await t("muhabir geri çeker", true, on("o1", { durum: "geriCekildi" }));
await t("muhabir değerlendirilen öneriyi plana ekler", false, on("o2", { durum: "planaEklendi" }));
await t("muhabir metin düzeltir, durum aynı", true, on("o2", { durum: "degerlendiriliyor", gelisme: "x" }));
await t("muhabir çift durum", false, on("o2", { durum: "degerlendiriliyor", x: 1, durum2: 0 }).then(() => setDoc(doc(db("mu"), "oneriler", "o2"), { s: 0, j: '{"id":"o2","durum":"degerlendiriliyor","durum":"planaEklendi"}', m: ["mu"] })));
const pk = (id, ek) => setDoc(doc(db("mu"), "paketler", id), { s: 0, j: JSON.stringify({ id, muhabirId: "mu", ...ek }), m: ["mu"] });
await t("muhabir paketi tamamlandı yapar", false, pk("p1", { durum: "tamamlandi" }));
await t("muhabir paket işareti", true, pk("p1", { durum: "onaylandi", isaret: { tur: "yapildi", zaman: "z", kisiId: "mu" } }));
await t("muhabir özel yayın paketini teslim", true, pk("p2", { durum: "tamamlandi", ozelId: "oz1" }));
const hr = (id, kisiId, k, jj) => setDoc(doc(db("mu"), "hareketler", id), { s: 0, j: jj ?? JSON.stringify({ id, kisiId, tip: "x" }), m: ["mu"], k });
await t("muhabir kendi hareketi", true, hr("h1", "mu", "mu"));
await t("muhabir başkası adına hareket", false, hr("h2", "adm", "adm"));
await t("muhabir düz k ile j çelişkili", false, hr("h3", "adm", "mu"));
await t("muhabir çift kisiId", false, hr("h4", null, "mu", '{"id":"h4","kisiId":"mu","kisiId":"adm"}'));
await t("muhabir eski hareketi taşır (kisiId aynı)", true, hr("h0", "adm", "adm", JSON.stringify({ id: "h0", kisiId: "adm", tip: "x", veri: { kime: "mu" } })));
// 3. Davet ve önceki kimlik
const dv = (adres, kisiId) => setDoc(doc(db("dv"), "davetler", adres), { eposta: adres, durum: "bekliyor", birim: "muhabir", hesapYoneticisi: false, yetkiler: [], kisiId });
await t("davet etkin muhabiri gösterir", false, dv("a@x.test", "mu2"));
await t("davet hesapsız kişiyi gösterir", true, dv("b@x.test", "hs"));
await t("davet kimliksiz", true, dv("c@x.test", ""));
await t("önceki kimliği etkin muhabir: onun önerisini okuyamaz", false, getDoc(doc(db("mux"), "oneriler", "o3")));
await t("önceki kimliği hesapsız: onun önerisini okur", true, getDoc(doc(db("muy"), "oneriler", "o4")));
await t("muhabir kendi önerisini okur", true, getDoc(doc(db("mu"), "oneriler", "o9")));
// 4. Gündem paylaşımı genel ayarda: yalnız tam yönetici değiştirir, sayaç herkesçe yazılır.
await t("yönetici gündemi paylaşır", true, setDoc(doc(db("adm"), "ayar", "genel"), { sayac: 1, gundemPaylasim: { birimler: ["planlama"], kisiler: [] } }));
await t("personel sayacı yazar, paylaşım aynı", true, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 2, gundemPaylasim: { birimler: ["planlama"], kisiler: [] } }));
await t("personel kendini paylaşıma ekleyemez", false, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 3, gundemPaylasim: { birimler: ["planlama"], kisiler: ["dv"] } }));
await t("personel paylaşımı silemez", false, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 3 }));
console.log(`\n${gec} geçti, ${kal} kaldı`);
await env.cleanup();
process.exit(kal ? 1 : 0);
