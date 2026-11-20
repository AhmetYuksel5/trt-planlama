import assert from "node:assert/strict";
import { test } from "node:test";
import { otoCagriCalistir, type Env, type Gonderici } from "../src/index.ts";
import { bosOtoCagri, gununGondereni, gununKalemi, istanbulGunu, istanbulSaati, otoCagriBirlestir, otoCagriNormal, type OtoCagriAyar } from "../src/oto-cagri.ts";

/* Kurgusal adresler; gerçek kişi bilgisi teste girmez. */
const kalem = (etiket: string, tur: "nextday" | "haftalik", gonderim: string, tarih: string, saat = tur === "haftalik" ? "10:00" : "09:00") => ({ etiket, tur, tarih, gonderim, saat, konu: `konu ${etiket}`, metin: "نص", html: "<div>نص</div>", sonSaat: "15:00" });
const T = "2026-11-08T00:00:00.000Z";
const her = (u: string) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((g) => [String(g), u]));

test("izin yalnız kişinin kendisi için; takvime izinsiz kişi konmaz", () => {
  const r = otoCagriBirlestir(bosOtoCagri(), { katil: true, acik: true }, "a", T);
  assert.ok("ayar" in r && r.ayar.gonderenler.includes("a") && r.ayar.acik);
  const ayar = (r as { ayar: OtoCagriAyar }).ayar;
  assert.deepEqual(otoCagriBirlestir(ayar, { haftalik: { "1": "b" } }, "a", T), { hata: "izinsiz" });
  const t = otoCagriBirlestir(ayar, { haftalik: { "1": "a" }, istisna: { "2026-11-10": "a", "2026-11-01": "a" } }, "b", T);
  assert.ok("ayar" in t);
  assert.equal(t.ayar.haftalik["1"], "a");
  assert.deepEqual(Object.keys(t.ayar.istisna), ["2026-11-10"], "geçmiş istisna atılır");
  // Ayrılanın günleri boşalır.
  const c = otoCagriBirlestir(t.ayar, { katil: false }, "a", T);
  assert.ok("ayar" in c && !c.ayar.gonderenler.length && !Object.keys(c.ayar.haftalik).length && !Object.keys(c.ayar.istisna).length);
});

test("zaman ve şablon doğrulanır", () => {
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { zaman: { nd: "25:00" } }, "a", T), { hata: "zaman" });
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { zaman: { hpGun: 7 } }, "a", T), { hata: "zaman" });
  const r = otoCagriBirlestir(bosOtoCagri(), { zaman: { nd: "08:30", hpGun: 4 }, sablon: { nd: "نص {tarih}", hp: "" } }, "a", T);
  assert.ok("ayar" in r);
  assert.deepEqual(r.ayar.zaman, { nd: "08:30", hpGun: 4, hp: "10:00", sonSaat: "15:00" });
  assert.deepEqual(r.ayar.sablon, { nd: "نص {tarih}" });
});

test("geçersiz adres, etiket ya da kalem reddedilir", () => {
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { bcc: ["a@x.test", "yanlis"] }, "a", T), { hata: "bcc" });
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { kalemler: [{ ...kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), etiket: "X" }] }, "a", T), { hata: "kalemler" });
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { kalemler: [{ ...kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), saat: "9" }] }, "a", T), { hata: "kalemler" });
  const r = otoCagriBirlestir(bosOtoCagri(), { bcc: ["A@X.test", "a@x.test"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")], atla: ["ND-20261110", "bozuk"] }, "a", T);
  assert.ok("ayar" in r);
  assert.deepEqual(r.ayar.bcc, ["a@x.test"]);
  assert.deepEqual(r.ayar.atla, ["ND-20261110"]);
  assert.equal(r.ayar.guncelleme, T);
});

test("ilk sürümün tek göndereni her günün göndereni olur", () => {
  const a = otoCagriNormal({ acik: true, uid: "a", kalemler: [{ ...kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), saat: undefined }] });
  assert.deepEqual(a.gonderenler, ["a"]);
  assert.equal(gununGondereni(a, "2026-11-12"), "a");
  assert.equal(a.kalemler[0].saat, "09:00");
});

test("günün kalemi: saat, takvim, istisna, atlanan, elle gönderilen ve bayat liste", () => {
  const a: OtoCagriAyar = { ...bosOtoCagri(), acik: true, gonderenler: ["a", "b"], haftalik: her("a"), istisna: { "2026-11-10": "b", "2026-11-11": "" }, kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), kalem("ND-20261111", "nextday", "2026-11-10", "2026-11-11"), kalem("ND-20261112", "nextday", "2026-11-11", "2026-11-12"), kalem("HP-20261121", "haftalik", "2026-11-13", "2026-11-21")] };
  assert.equal(istanbulGunu(Date.UTC(2026, 10, 7, 21, 30)), "2026-11-08");
  assert.equal(istanbulSaati(Date.UTC(2026, 10, 8, 6, 15)), "09:15");
  assert.deepEqual(gununKalemi(a, "nextday", "2026-11-08", "08:45", []), { atla: "erken" });
  const k = gununKalemi(a, "nextday", "2026-11-08", "09:00", []);
  assert.ok("kalem" in k && k.uid === "a");
  const ist = gununKalemi(a, "nextday", "2026-11-10", "09:00", []);
  assert.ok("kalem" in ist && ist.uid === "b", "istisna günün göndereni");
  assert.deepEqual(gununKalemi(a, "nextday", "2026-11-11", "09:00", []), { atla: "gonderen" });
  assert.deepEqual(gununKalemi({ ...a, acik: false }, "nextday", "2026-11-08", "09:00", []), { atla: "kapali" });
  assert.deepEqual(gununKalemi({ ...a, atla: ["ND-20261109"] }, "nextday", "2026-11-08", "09:00", []), { atla: "atlandi" });
  assert.deepEqual(gununKalemi({ ...a, gonderildi: ["ND-20261109"] }, "nextday", "2026-11-08", "09:00", []), { atla: "gonderildi" });
  assert.deepEqual(gununKalemi(a, "nextday", "2026-11-20", "09:30", []), { atla: "liste" });
  assert.ok("kalem" in gununKalemi(a, "haftalik", "2026-11-13", "10:00", []));
  // Haftalığın günü değilse liste uyarısı yok.
  assert.deepEqual(gununKalemi(a, "haftalik", "2026-11-21", "11:00", []), { atla: "erken" });
});

const ortam = (ayar: OtoCagriAyar, kimlik = { kullanici: "pl", parola: "p", grupAdresi: "planning@ornek.test" }) => {
  const depo = new Map<string, string>([
    ["oto-cagri", JSON.stringify(ayar)],
    ["posta-ayar", JSON.stringify({ acik: true, sunucu: "posta.ornek.test", alan: "ORNEK" })],
    ...ayar.gonderenler.map((u) => [`posta-kimlik:${u}`, JSON.stringify(kimlik)] as [string, string]),
  ]);
  const env: Env = { YZ: { get: async (k) => depo.get(k) ?? null, put: async (k, v) => void depo.set(k, v) }, FIREBASE_PROJE: "p", KOKENLER: "" };
  return { env, depo };
};

test("zamanlayıcı: saatinde, Kime planning, muhabirler BCC, HTML gövde; ikinci kez göndermez", async () => {
  const ayar: OtoCagriAyar = { ...bosOtoCagri(), acik: true, gonderenler: ["a"], haftalik: her("a"), bcc: ["m1@ornek.test", "m2@ornek.test"], bccIdler: ["m1", "m2"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")] };
  const { env, depo } = ortam(ayar);
  const giden: unknown[] = [];
  const gonder: Gonderici = async (_a, g) => (giden.push(g), { tamam: true });
  assert.equal(await otoCagriCalistir(env, Date.UTC(2026, 10, 8, 5, 45), "nextday", gonder), null, "saatinden önce gitmez");
  const saat9 = Date.UTC(2026, 10, 8, 6, 0);
  const k = await otoCagriCalistir(env, saat9, "nextday", gonder);
  assert.equal(k?.tamam, true);
  assert.equal(k?.uid, "a");
  assert.deepEqual(giden[0], { kime: ["planning@ornek.test"], bcc: ["m1@ornek.test", "m2@ornek.test"], konu: "konu ND-20261109", metin: "نص", html: "<div>نص</div>" });
  assert.equal(await otoCagriCalistir(env, saat9 + 900_000, "nextday", gonder), null);
  assert.equal(giden.length, 1);
  assert.equal(JSON.parse(depo.get("oto-cagri-gecmis")!).length, 1);
  await otoCagriCalistir(env, saat9, "haftalik", gonder);
  assert.equal(giden.length, 1);
});

test("zamanlayıcı: hata üç kez denenir, bayat liste ve boş takvim bir kez yazılır", async () => {
  const ayar: OtoCagriAyar = { ...bosOtoCagri(), acik: true, gonderenler: ["a"], haftalik: her("a"), bcc: ["m1@ornek.test"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")] };
  const { env } = ortam(ayar);
  const t0 = Date.UTC(2026, 10, 8, 6);
  const kotu: Gonderici = async () => ({ hata: "kimlik doğrulanamadı" });
  for (let i = 0; i < 3; i++) assert.equal((await otoCagriCalistir(env, t0 + i * 900_000, "nextday", kotu))?.hata, "kimlik doğrulanamadı");
  assert.equal(await otoCagriCalistir(env, t0 + 4 * 900_000, "nextday", kotu), null, "üç denemeden sonra durur");
  const bayat = Date.UTC(2026, 10, 20, 6);
  assert.equal((await otoCagriCalistir(env, bayat, "nextday", async () => ({ tamam: true })))?.hata, "liste");
  assert.equal(await otoCagriCalistir(env, bayat + 900_000, "nextday", async () => ({ tamam: true })), null, "liste uyarısı günde bir");
  const { env: e2 } = ortam({ ...ayar, haftalik: {} });
  assert.equal((await otoCagriCalistir(e2, t0, "nextday", async () => ({ tamam: true })))?.hata, "gonderen");
  assert.equal(await otoCagriCalistir(e2, t0 + 900_000, "nextday", async () => ({ tamam: true })), null);
  const { env: e3 } = ortam(ayar, { kullanici: "", parola: "", grupAdresi: "" });
  assert.equal((await otoCagriCalistir(e3, t0, "nextday", async () => ({ tamam: true })))?.hata, "eksikKimlik");
});

test("zamanlayıcı: belirsiz biten gönderim yeniden denenmez", async () => {
  const ayar: OtoCagriAyar = { ...bosOtoCagri(), acik: true, gonderenler: ["a"], haftalik: her("a"), bcc: ["m1@ornek.test"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")] };
  const { env } = ortam(ayar);
  const t0 = Date.UTC(2026, 10, 8, 6);
  let sayi = 0;
  const kopan: Gonderici = async () => (sayi++, { hata: "bağlantı yanıt gelmeden kapandı", belirsiz: true });
  assert.equal((await otoCagriCalistir(env, t0, "nextday", kopan))?.belirsiz, true);
  assert.equal(await otoCagriCalistir(env, t0 + 900_000, "nextday", kopan), null, "posta gitmiş olabilir: ikinci kez gönderilmez");
  assert.equal(sayi, 1);
});

test("görevli: kalemdeki görevli takvimi ezer, izin vermemiş görevli gönderemez", async () => {
  const gk = (gorevli: string) => ({ ...kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), gorevli });
  const a: OtoCagriAyar = { ...bosOtoCagri(), acik: true, gonderenler: ["a", "b"], haftalik: her("a"), kalemler: [gk("b")] };
  const k = gununKalemi(a, "nextday", "2026-11-08", "09:00", []);
  assert.ok("kalem" in k && k.uid === "b", "takvimde a olsa da görevli b gönderir");
  assert.deepEqual(gununKalemi({ ...a, kalemler: [gk("c")] }, "nextday", "2026-11-08", "09:00", []), { atla: "izinsiz" });
  assert.deepEqual(gununKalemi({ ...a, kalemler: [gk("")] }, "nextday", "2026-11-08", "09:00", []), { atla: "gonderen" }, "görevli yok: takvime düşmez");
  const r = otoCagriBirlestir(a, { kalemler: [gk("b"), { ...gk("x"), gorevli: "a b" }] }, "a", "2026-11-08T08:00:00.000Z");
  assert.ok("hata" in r, "görevli kimliği yalnız düz kimlik");
  const ayar: OtoCagriAyar = { ...a, bcc: ["m1@ornek.test"], kalemler: [gk("c")] };
  const { env } = ortam(ayar);
  const kayit = await otoCagriCalistir(env, Date.UTC(2026, 10, 8, 6), "nextday", async () => ({ tamam: true }));
  assert.equal(kayit?.hata, "izinsiz");
  assert.equal(kayit?.uid, "c", "kimin onayı beklendiği geçmişte");
});
