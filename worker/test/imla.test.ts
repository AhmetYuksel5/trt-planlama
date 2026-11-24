import { test } from "node:test";
import assert from "node:assert/strict";
import { satirDuzeltmeleri, sozcukDuzeltmesiMi } from "../src/imla.ts";
import { sonucCoz } from "../src/ozellikler.ts";

test("imla: hemze, ta marbuta ve elif maksure düzeltmesi geçer", () => {
  assert.ok(sozcukDuzeltmesiMi("اسرائيل", "إسرائيل"));
  assert.ok(sozcukDuzeltmesiMi("الامم", "الأمم"));
  assert.ok(sozcukDuzeltmesiMi("الحكومه", "الحكومة"));
  assert.ok(sozcukDuzeltmesiMi("الي", "إلى"));
});

test("imla: sayı, Latin ad, yalnız hareke ve başka sözcük geçmez", () => {
  assert.ok(!sozcukDuzeltmesiMi("15", "16"));
  assert.ok(!sozcukDuzeltmesiMi("NATO", "Nato"));
  assert.ok(!sozcukDuzeltmesiMi("كتب", "كَتَبَ"));
  assert.ok(!sozcukDuzeltmesiMi("الرئيس", "الوزير"));
  assert.ok(!sozcukDuzeltmesiMi("قال", "صرح"));
});

test("imla: sözcük sayısı değişen ya da yeniden yazılan satır bütünüyle atılır", () => {
  assert.deepEqual(satirDuzeltmeleri("a", "وصل الرئيس الي انقرة", "وصل الرئيس التركي إلى أنقرة"), []);
  assert.deepEqual(satirDuzeltmeleri("a", "ا ب ج د ه", "أ إ آ ء ة"), []);
  assert.deepEqual(satirDuzeltmeleri("a", "وصل الرئيس الي انقرة", "وصل الرئيس إلى أنقرة"), [
    { id: "a", sira: 2, eski: "الي", yeni: "إلى" },
    { id: "a", sira: 3, eski: "انقرة", yeni: "أنقرة" },
  ]);
});

test("imla: sonuç yalnız gönderilen satırlara, süzgeçten geçmiş", () => {
  const girdi = { satirlar: [{ id: "g1", metin: "اجتماع الامم المتحدة" }, { id: "g2", metin: "قمة في 15 نوفمبر" }] };
  const yanit = JSON.stringify({ lines: [{ id: "g1", text: "اجتماع الأمم المتحدة" }, { id: "g2", text: "قمة في 16 نوفمبر" }, { id: "yok", text: "x" }] });
  assert.deepEqual(sonucCoz("imla", yanit, [], girdi), { duzeltmeler: [{ id: "g1", sira: 1, eski: "الامم", yeni: "الأمم" }] });
  assert.deepEqual(sonucCoz("imla", '{"lines": []}', [], girdi), { duzeltmeler: [] });
});
