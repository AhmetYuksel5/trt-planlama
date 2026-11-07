import assert from "node:assert/strict";
import { test } from "node:test";
import { bosPostaAyar, bosPostaKimlik, postaGorunur, postaKimlikGorunur, postaAyarBirlestir, postaKimlikBirlestir, type PostaAyar, type PostaKimlik } from "../src/posta-ayar.ts";

test("ortak ayar görünürde yalnız açık/sunucu/alan", () => {
  const a: PostaAyar = { acik: true, sunucu: "posta.trt.net.tr", alan: "TRT" };
  const g = postaGorunur(a) as Record<string, unknown>;
  assert.deepEqual(g, { acik: true, sunucu: "posta.trt.net.tr", alan: "TRT" });
});

test("ortak ayar: geçersiz sunucu/alan reddediliyor, sunucu/alan birleşiyor", () => {
  const eski = bosPostaAyar();
  assert.ok("hata" in postaAyarBirlestir(eski, { sunucu: "bad host!" }));
  assert.ok("hata" in postaAyarBirlestir(eski, { alan: "a b" }));
  const ok = postaAyarBirlestir(eski, { sunucu: "posta.trt.net.tr", alan: "TRT", acik: true });
  assert.ok("ayar" in ok && ok.ayar.sunucu === "posta.trt.net.tr" && ok.ayar.alan === "TRT" && ok.ayar.acik === true);
});

test("kişi kimliği görünürde parolayı gizliyor", () => {
  const k: PostaKimlik = { kullanici: "x", parola: "gizli", grupAdresi: "planning@trtarabi.com" };
  const g = postaKimlikGorunur(k) as Record<string, unknown>;
  assert.equal(g.parolaVar, true);
  assert.equal(g.kullanici, "x");
  assert.equal(g.grupAdresi, "planning@trtarabi.com");
  assert.ok(!("parola" in g), "parola dışarı çıkmıyor");
});

test("kimlik birleştirme: parola yalnız dolu metinle değişir, grup adresi küçük harf", () => {
  const eski: PostaKimlik = { ...bosPostaKimlik(), parola: "p1" };
  const r1 = postaKimlikBirlestir(eski, { kullanici: "ahmet" });
  assert.ok("kimlik" in r1 && r1.kimlik.parola === "p1", "parola gönderilmeyince korunur");
  const r2 = postaKimlikBirlestir(eski, { parola: "p2" });
  assert.ok("kimlik" in r2 && r2.kimlik.parola === "p2");
  const r3 = postaKimlikBirlestir(eski, { parola: null });
  assert.ok("kimlik" in r3 && r3.kimlik.parola === "", "null parolayı siler");
  const r4 = postaKimlikBirlestir(eski, { parola: "" });
  assert.ok("kimlik" in r4 && r4.kimlik.parola === "p1", "boş metin eskiyi korur");
  const r5 = postaKimlikBirlestir(bosPostaKimlik(), { grupAdresi: "News@TRTArabi.com", kullanici: "u" });
  assert.ok("kimlik" in r5 && r5.kimlik.grupAdresi === "news@trtarabi.com");
  assert.ok("hata" in postaKimlikBirlestir(bosPostaKimlik(), { grupAdresi: "notanemail" }));
});
