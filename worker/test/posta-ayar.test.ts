import assert from "node:assert/strict";
import { test } from "node:test";
import { bosPostaAyar, postaGorunur, postaAyarBirlestir, type PostaAyar } from "../src/posta-ayar.ts";

test("postaGorunur parolayı gizliyor", () => {
  const a: PostaAyar = { acik: true, sunucu: "posta.trt.net.tr", kullanici: "x", alan: "TRT", grupAdresi: "planning@trtarabi.com", parola: "gizli" };
  const g = postaGorunur(a) as Record<string, unknown>;
  assert.equal(g.parolaVar, true);
  assert.ok(!("parola" in g), "parola dışarı çıkmıyor");
});

test("birleştirme: parola yalnız dolu metinle değişir, boş alan eskiyi korur", () => {
  const eski: PostaAyar = { ...bosPostaAyar(), parola: "p1" };
  const r1 = postaAyarBirlestir(eski, { kullanici: "ahmet" });
  assert.ok("ayar" in r1 && r1.ayar.parola === "p1", "parola gönderilmeyince korunur");
  const r2 = postaAyarBirlestir(eski, { parola: "p2" });
  assert.ok("ayar" in r2 && r2.ayar.parola === "p2");
  const r3 = postaAyarBirlestir(eski, { parola: null });
  assert.ok("ayar" in r3 && r3.ayar.parola === "", "null parolayı siler");
  const r4 = postaAyarBirlestir(eski, { parola: "" });
  assert.ok("ayar" in r4 && r4.ayar.parola === "p1", "boş metin eskiyi korur");
});

test("birleştirme: geçersiz sunucu/alan/grup reddediliyor", () => {
  const eski = bosPostaAyar();
  assert.ok("hata" in postaAyarBirlestir(eski, { sunucu: "bad host!" }));
  assert.ok("hata" in postaAyarBirlestir(eski, { alan: "a b" }));
  assert.ok("hata" in postaAyarBirlestir(eski, { grupAdresi: "notanemail" }));
  const ok = postaAyarBirlestir(eski, { sunucu: "posta.trt.net.tr", kullanici: "u", alan: "TRT", grupAdresi: "Planning@TRTArabi.com", acik: true });
  assert.ok("ayar" in ok && ok.ayar.grupAdresi === "planning@trtarabi.com" && ok.ayar.acik === true);
});
