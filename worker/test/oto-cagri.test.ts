import assert from "node:assert/strict";
import { test } from "node:test";
import { otoCagriCalistir, type Env, type Gonderici } from "../src/index.ts";
import { bosOtoCagri, gununKalemi, istanbulGunu, otoCagriBirlestir, type OtoCagriAyar } from "../src/oto-cagri.ts";

/* Kurgusal adresler; gerçek kişi bilgisi teste girmez. */
const kalem = (etiket: string, tur: "nextday" | "haftalik", gonderim: string, tarih: string) => ({ etiket, tur, tarih, gonderim, konu: `konu ${etiket}`, metin: "نص", html: "<div>نص</div>", sonSaat: "15:00" });
const T = "2026-11-08T00:00:00.000Z";

test("birleştirme: gönderen açıkça devralınmadan değişmez", () => {
  const r = otoCagriBirlestir(bosOtoCagri(), { acik: true }, "a", T);
  assert.ok("ayar" in r && r.ayar.uid === "a" && r.ayar.acik);
  const ayar = (r as { ayar: OtoCagriAyar }).ayar;
  assert.deepEqual(otoCagriBirlestir(ayar, { kalemler: [] }, "b", T), { hata: "baskasi" });
  const d = otoCagriBirlestir(ayar, { devral: true }, "b", T);
  assert.ok("ayar" in d && d.ayar.uid === "b");
});

test("birleştirme: geçersiz adres, etiket ya da kalem reddedilir", () => {
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { bcc: ["a@x.test", "yanlis"] }, "a", T), { hata: "bcc" });
  assert.deepEqual(otoCagriBirlestir(bosOtoCagri(), { kalemler: [{ ...kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), etiket: "X" }] }, "a", T), { hata: "kalemler" });
  const r = otoCagriBirlestir(bosOtoCagri(), { bcc: ["A@X.test", "a@x.test"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")], atla: ["ND-20261110", "bozuk"] }, "a", T);
  assert.ok("ayar" in r);
  assert.deepEqual(r.ayar.bcc, ["a@x.test"]);
  assert.deepEqual(r.ayar.atla, ["ND-20261110"]);
  assert.equal(r.ayar.guncelleme, T);
});

test("günün kalemi: kapalı, atlanan, elle gönderilen ve bayat liste", () => {
  const a: OtoCagriAyar = { ...bosOtoCagri(), acik: true, uid: "a", kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09"), kalem("HP-20261121", "haftalik", "2026-11-13", "2026-11-21")] };
  assert.equal(istanbulGunu(Date.UTC(2026, 10, 7, 21, 30)), "2026-11-08");
  assert.ok("kalem" in gununKalemi(a, "nextday", "2026-11-08", []));
  assert.deepEqual(gununKalemi({ ...a, acik: false }, "nextday", "2026-11-08", []), { atla: "kapali" });
  assert.deepEqual(gununKalemi({ ...a, atla: ["ND-20261109"] }, "nextday", "2026-11-08", []), { atla: "atlandi" });
  assert.deepEqual(gununKalemi({ ...a, gonderildi: ["ND-20261109"] }, "nextday", "2026-11-08", []), { atla: "gonderildi" });
  assert.deepEqual(gununKalemi(a, "nextday", "2026-11-20", []), { atla: "liste" });
  assert.ok("kalem" in gununKalemi(a, "haftalik", "2026-11-13", []));
});

const ortam = (ayar: OtoCagriAyar, kimlik = { kullanici: "pl", parola: "p", grupAdresi: "planning@ornek.test" }) => {
  const depo = new Map<string, string>([
    ["oto-cagri", JSON.stringify(ayar)],
    ["posta-ayar", JSON.stringify({ acik: true, sunucu: "posta.ornek.test", alan: "ORNEK" })],
    [`posta-kimlik:${ayar.uid}`, JSON.stringify(kimlik)],
  ]);
  const env: Env = { YZ: { get: async (k) => depo.get(k) ?? null, put: async (k, v) => void depo.set(k, v) }, FIREBASE_PROJE: "p", KOKENLER: "" };
  return { env, depo };
};

test("zamanlayıcı: Kime planning, muhabirler BCC, HTML gövde; ikinci kez göndermez", async () => {
  const ayar: OtoCagriAyar = { ...bosOtoCagri(), acik: true, uid: "a", bcc: ["m1@ornek.test", "m2@ornek.test"], bccIdler: ["m1", "m2"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")] };
  const { env, depo } = ortam(ayar);
  const giden: unknown[] = [];
  const gonder: Gonderici = async (_a, g) => (giden.push(g), { tamam: true });
  const saat9 = Date.UTC(2026, 10, 8, 6, 0);
  const k = await otoCagriCalistir(env, saat9, "nextday", gonder);
  assert.equal(k?.tamam, true);
  assert.deepEqual(giden[0], { kime: ["planning@ornek.test"], bcc: ["m1@ornek.test", "m2@ornek.test"], konu: "konu ND-20261109", metin: "نص", html: "<div>نص</div>" });
  assert.equal(await otoCagriCalistir(env, saat9, "nextday", gonder), null);
  assert.equal(giden.length, 1);
  assert.equal(JSON.parse(depo.get("oto-cagri-gecmis")!).length, 1);
  // Haftalık zamanlayıcı Next Day kalemini göndermez.
  await otoCagriCalistir(env, saat9, "haftalik", gonder);
  assert.equal(giden.length, 1);
});

test("zamanlayıcı: hata ve bayat liste geçmişe nedeniyle yazılır", async () => {
  const ayar: OtoCagriAyar = { ...bosOtoCagri(), acik: true, uid: "a", bcc: ["m1@ornek.test"], kalemler: [kalem("ND-20261109", "nextday", "2026-11-08", "2026-11-09")] };
  const { env } = ortam(ayar);
  const hata = await otoCagriCalistir(env, Date.UTC(2026, 10, 8, 6), "nextday", async () => ({ hata: "kimlik doğrulanamadı" }));
  assert.equal(hata?.tamam, false);
  assert.equal(hata?.hata, "kimlik doğrulanamadı");
  const bayat = await otoCagriCalistir(env, Date.UTC(2026, 10, 20, 6), "nextday", async () => ({ tamam: true }));
  assert.equal(bayat?.hata, "liste");
  const { env: e2 } = ortam(ayar, { kullanici: "", parola: "", grupAdresi: "" });
  assert.equal((await otoCagriCalistir(e2, Date.UTC(2026, 10, 8, 6), "nextday", async () => ({ tamam: true })))?.hata, "eksikKimlik");
});
