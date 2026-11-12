// Firestore kuralları: güvenlik incelemesindeki saldırılar reddediliyor, programın olağan yazışları geçiyor.
// Çalıştırma belgeler/gercek-kip.md'de (emülatör, @firebase/rules-unit-testing).
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, getDocs, deleteDoc, query, collection, where } from "firebase/firestore";
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
  // Geçişi tamamlanmış: eski hesapsız kaydı tam yönetici silmiş, önceki kimlik kişide duruyor.
  muz: kisi("muz", { birim: "muhabir", rol: "personel", gorev: "muhabir", oncekiKimlik: "silinen" }, { oncekiKimlik: "silinen" }),
  // Muhasebe: birimin kendisi, kademe müdürü, muhasebe yetkisi verilen; öbür birim görmez.
  mh: kisi("mh", { birim: "muhasebe", rol: "personel", gorev: "muhasebeci" }),
  ky: kisi("ky", { birim: "bInput", rol: "yonetici", gorev: "inputMuduru" }),
  ym: kisi("ym", { birim: "bYeni", rol: "yonetici", gorev: "creative", yetkiler: ["muhasebe"] }, { yetkiler: ["muhasebe"] }),
  nd: kisi("nd", { birim: "newsdesk", rol: "yonetici", gorev: "yonetici" }),
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
  await setDoc(doc(db, "muhasebeAnlasmalari", "mu"), { s: 0, j: JSON.stringify({ id: "mu", tur: "sabit", tutar: 1 }) });
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
// Tarayıcı önceki kimlikle birlikte sorguluyor (depo/firebase.ts → kayitBagla); eski kayıt silinince bütün sorgu reddediliyordu.
await t("geçişi tamamlanmış muhabir: iki kimlikle sorgu", true, getDocs(query(collection(db("muz"), "oneriler"), where("m", "array-contains-any", ["muz", "silinen"]))));
await t("önceki kimliği hesapsız: iki kimlikle sorgu", true, getDocs(query(collection(db("muy"), "oneriler"), where("m", "array-contains-any", ["muy", "hs"]))));
await t("önceki kimliği etkin muhabir: iki kimlikle sorgu", false, getDocs(query(collection(db("mux"), "oneriler"), where("m", "array-contains-any", ["mux", "mu2"]))));
await t("muhabir kendi önerisini okur", true, getDoc(doc(db("mu"), "oneriler", "o9")));
// 4. Gündem paylaşımı genel ayarda: yalnız tam yönetici değiştirir, sayaç herkesçe yazılır.
await t("yönetici gündemi paylaşır", true, setDoc(doc(db("adm"), "ayar", "genel"), { sayac: 1, gundemPaylasim: { birimler: ["planlama"], kisiler: [] } }));
await t("personel sayacı yazar, paylaşım aynı", true, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 2, gundemPaylasim: { birimler: ["planlama"], kisiler: [] } }));
await t("personel kendini paylaşıma ekleyemez", false, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 3, gundemPaylasim: { birimler: ["planlama"], kisiler: ["dv"] } }));
await t("personel paylaşımı silemez", false, setDoc(doc(db("pl"), "ayar", "genel"), { sayac: 3 }));
// 5. Muhasebe gizli: yalnız muhasebe, tam yönetici, kademe müdürü ve muhasebe yetkilisi.
const anl = (u) => getDoc(doc(db(u), "muhasebeAnlasmalari", "mu"));
await t("muhasebe anlaşmayı okur", true, anl("mh"));
await t("muhasebe anlaşma yazar", true, setDoc(doc(db("mh"), "muhasebeAnlasmalari", "mu2"), { s: 0, j: JSON.stringify({ id: "mu2", tur: "parca" }) }));
await t("tam yönetici okur", true, anl("adm"));
await t("kademe müdürü (Input) okur", true, anl("ky"));
await t("muhasebe yetkisi verilen okur", true, anl("ym"));
await t("Newsdesk yöneticisi okuyamaz", false, anl("nd"));
await t("planlamacı okuyamaz", false, anl("pl"));
await t("planlamacı yazamaz", false, setDoc(doc(db("pl"), "muhasebeKapanislari", "x"), { s: 0, j: "{}" }));
await t("muhabir okuyamaz", false, anl("mu"));
await t("planlamacı tanımları da okuyamaz", false, getDocs(collection(db("pl"), "muhasebeTanimlari")));
// 6. Giriş kodu (src/girisKodu.ts): kodu bilen okur, listelenmez; davet yetkilisi yalnız giriş adresine yazar.
const KA = "ali.kaya@giris.plannersflow.net";
const kodYaz = (u, kod, v) => setDoc(doc(db(u), "girisKodlari", kod), v);
const bitis = Date.now() + 3600_000;
await t("davet yetkilisi kod yazar", true, kodYaz("dv", "ABCD2345", { eposta: KA, kullanici: "ali.kaya", bitis }));
await t("personel kod yazamaz", false, kodYaz("pl", "ABCD2346", { eposta: KA, kullanici: "ali.kaya", bitis }));
await t("kod gerçek adrese gösterilemez", false, kodYaz("dv", "ABCD2347", { eposta: "mu@x.test", kullanici: "mu", bitis }));
await t("koda fazladan alan yazılamaz", false, kodYaz("dv", "ABCD2348", { eposta: KA, kullanici: "ali.kaya", bitis, yetkiler: ["davet"] }));
const anonim = env.unauthenticatedContext().firestore();
await t("oturumsuz kodu okur", true, getDoc(doc(anonim, "girisKodlari", "ABCD2345")));
await t("oturumsuz kodları listeleyemez", false, getDocs(collection(anonim, "girisKodlari")));
await t("etkin personel kodları listeleyemez", false, getDocs(collection(db("pl"), "girisKodlari")));
// Kod hesabı ilk girişte kişi kaydını davetten kuruyor; süresi geçmiş davetle kuramıyor.
const kodDb = (uid, eposta) => env.authenticatedContext(uid, { email: eposta, email_verified: false }).firestore();
const davetYaz = (adres, ek) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), "davetler", adres), { eposta: adres, durum: "bekliyor", birim: "planlama", gorev: "planlamaci", rol: "personel", hesapYoneticisi: false, ...ek }));
const kodKisi = (uid, eposta) => kisi(uid, { birim: "planlama", rol: "personel", gorev: "planlamaci" }, { eposta });
await davetYaz(KA, { kod: "ABCD2345", bitis });
await t("kod hesabı kaydını kurar (doğrulamasız)", true, setDoc(doc(kodDb("ka1", KA), "kisiler", "ka1"), kodKisi("ka1", KA)));
const KB = "veli@giris.plannersflow.net";
await davetYaz(KB, { kod: "ABCD2349", bitis: Date.now() - 1000 });
await t("süresi geçmiş kodla kayıt kurulamaz", false, setDoc(doc(kodDb("kb1", KB), "kisiler", "kb1"), kodKisi("kb1", KB)));
await t("başkası kodu silemez", false, deleteDoc(doc(db("pl"), "girisKodlari", "ABCD2345")));
await t("kod sahibi kodunu siler", true, deleteDoc(doc(kodDb("ka1", KA), "girisKodlari", "ABCD2345")));
console.log(`\n${gec} geçti, ${kal} kaldı`);
await env.cleanup();
process.exit(kal ? 1 : 0);
