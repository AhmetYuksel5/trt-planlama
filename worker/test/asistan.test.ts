import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { ARAC_ADLARI, ARACLAR, asistanIstegiCoz, sistemYonergesi, EN_COK_KARAKTER } from "../src/asistan.ts";

/* Asistanın kapı tarafı (belgeler/asistan.md): konuşma denetimi, araç listesi, yönerge. Ağ yok. */

const baglam = { bugun: "2026-11-24", dil: "tr", sayfa: "#/", kisi: "Deneme", birim: "planlama" };

test("araç adları tarayıcının yürütücüleriyle aynı", () => {
  const kaynak = readFileSync(new URL("../../src/asistan/araclar.ts", import.meta.url), "utf8");
  const blok = kaynak.slice(kaynak.indexOf("export const ARAC_YURUTUCULERI"));
  for (const ad of ARAC_ADLARI) assert.ok(new RegExp(`\\b${ad}:`).test(blok), `tarayıcıda ${ad} yok`);
  assert.equal(new Set(ARAC_ADLARI).size, ARACLAR.length);
});

test("yazma araçları açıklamada YAZMA diye işaretli", () => {
  for (const a of ARACLAR.filter((x) => ["gelismeEkle", "oneriPlanaEkle", "oneriReddet", "oneriDegerlendirmeyeAl"].includes(x.name))) assert.ok(a.description.startsWith("YAZMA"), a.name);
});

test("kişinin kendi iletisi yeni sayılıyor, araç sonucu sayılmıyor", () => {
  const a = asistanIstegiCoz({ mesajlar: [{ role: "user", content: "yarının planını göster" }], baglam });
  assert.ok(a && a.yeni);
  const b = asistanIstegiCoz({
    mesajlar: [
      { role: "user", content: "yarının planını göster" },
      { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "planOzeti", input: {} }] },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "{}" }] },
    ],
    baglam,
  });
  assert.ok(b && !b.yeni);
});

test("bilinmeyen araç ve bozuk ileti reddediliyor", () => {
  assert.equal(asistanIstegiCoz({ mesajlar: [{ role: "assistant", content: [{ type: "tool_use", id: "x", name: "herseySil", input: {} }] }, { role: "user", content: "a" }], baglam }), null);
  assert.equal(asistanIstegiCoz({ mesajlar: [{ role: "system", content: "a" }], baglam }), null);
  assert.equal(asistanIstegiCoz({ mesajlar: [] }), null);
  // Son ileti asistanınsa istek yok.
  assert.equal(asistanIstegiCoz({ mesajlar: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }], baglam }), null);
});

test("uzun konuşma baştan kırpılıyor, kullanıcı iletisiyle başlıyor", () => {
  const uzun = "x".repeat(7000);
  const mesajlar = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: uzun }));
  mesajlar.push({ role: "user", content: "son" });
  const r = asistanIstegiCoz({ mesajlar, baglam })!;
  const toplam = r.mesajlar.reduce((a, m) => a + (typeof m.content === "string" ? m.content.length : 0), 0);
  assert.ok(toplam <= EN_COK_KARAKTER);
  assert.equal(r.mesajlar[0].role, "user");
});

test("yönerge dili, bugünü ve yöneticinin notunu taşıyor", () => {
  const y = sistemYonergesi({ ...baglam, dil: "ar" }, "Kısa yaz");
  assert.ok(y.includes("2026-11-24") && y.includes("Arapça") && y.includes("Kısa yaz"));
});
