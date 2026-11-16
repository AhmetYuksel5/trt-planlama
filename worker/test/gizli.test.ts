import assert from "node:assert/strict";
import { test } from "node:test";
import { otoCagriCalistir, type Env } from "../src/index.ts";
import { bosOtoCagri } from "../src/oto-cagri.ts";
import { coz, sifrele, sifreliMi } from "../src/gizli.ts";

/* Deneme anahtarı her koşuda yeni; gerçek anahtar teste girmez. */
const anahtar = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

test("şifre çözülür, KV'deki metin şifre değil; her yazış farklı", async () => {
  const a = anahtar();
  const s1 = await sifrele("gizli-parola", a);
  const s2 = await sifrele("gizli-parola", a);
  assert.ok(sifreliMi(s1) && !s1.includes("gizli-parola"));
  assert.notEqual(s1, s2);
  assert.equal(await coz(s1, a), "gizli-parola");
});

test("anahtarsız düz kalır; yanlış anahtar ya da anahtarsız şifreli boş döner", async () => {
  assert.equal(await sifrele("p", undefined), "p");
  assert.equal(await coz("p", anahtar()), "p");
  const s = await sifrele("p", anahtar());
  assert.equal(await coz(s, anahtar()), "");
  assert.equal(await coz(s, undefined), "");
});

test("düz kalmış eski kayıt ilk okumada şifrelenir, gönderim çözülmüş şifreyle", async () => {
  const a = anahtar();
  const ayar = { ...bosOtoCagri(), acik: true, gonderenler: ["u"], haftalik: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((g) => [String(g), "u"])), bcc: ["m@ornek.test"], kalemler: [{ etiket: "ND-20261109", tur: "nextday" as const, tarih: "2026-11-09", gonderim: "2026-11-08", saat: "09:00", konu: "k", metin: "نص", html: "", sonSaat: "15:00" }] };
  const depo = new Map<string, string>([
    ["oto-cagri", JSON.stringify(ayar)],
    ["posta-ayar", JSON.stringify({ acik: true, sunucu: "posta.ornek.test", alan: "ORNEK" })],
    ["posta-kimlik:u", JSON.stringify({ kullanici: "pl", parola: "duz-parola", grupAdresi: "planning@ornek.test" })],
  ]);
  const env: Env = { YZ: { get: async (k) => depo.get(k) ?? null, put: async (k, v) => void depo.set(k, v) }, FIREBASE_PROJE: "p", KOKENLER: "", POSTA_ANAHTARI: a };
  let giden = "";
  await otoCagriCalistir(env, Date.UTC(2026, 10, 8, 6), "nextday", async (e) => ((giden = e.parola), { tamam: true }));
  assert.equal(giden, "duz-parola");
  const kayit = JSON.parse(depo.get("posta-kimlik:u")!);
  assert.ok(sifreliMi(kayit.parola) && !depo.get("posta-kimlik:u")!.includes("duz-parola"));
  assert.equal(await coz(kayit.parola, a), "duz-parola");
});
