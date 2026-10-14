import Anthropic from "@anthropic-ai/sdk";
import type { Saglayici } from "./ayar.ts";
import type { Istek } from "./ozellikler.ts";

/*
 * Sağlayıcıya tek çağrı. İki tür: Claude (resmî SDK'yla) ve OpenAI uyumlu
 * uç nokta (OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Gemini'nin uyumlu
 * ucu… aynı istek biçimini kabul ediyor). Yeni sağlayıcı çoğunlukla kod
 * değişmeden ikinciyle ekleniyor.
 */

export type Sonuc = { tamam: true; metin: string } | { tamam: false; hata: "anahtar" | "sinir" | "red" | "saglayici" | "bos" };

/* Sunucu tarafı yedek (red olursa aynı çağrıda başka modelle sürdürme) yalnız bu modellerde var. */
const YEDEKLI = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

/* Çaba (effort) ayarını tanıyan modeller; eskilerinde istek hatayla dönüyor. */
const EFORLU = /^claude-((fable|mythos|opus|sonnet|haiku)-5|opus-4-[5-8]|sonnet-4-6)/;

const durumHatasi = (s: number): Sonuc => ({ tamam: false, hata: s === 401 || s === 403 ? "anahtar" : s === 429 ? "sinir" : "saglayici" });

const claude = async (s: Saglayici, istek: Istek, fetchFn: typeof fetch): Promise<Sonuc> => {
  const client = new Anthropic({ apiKey: s.anahtar, fetch: fetchFn, maxRetries: 1, timeout: 60_000 });
  try {
    const yedek = YEDEKLI.has(s.model);
    const r = await client.beta.messages.create({
      model: s.model,
      max_tokens: istek.enCokCikti,
      system: istek.sistem,
      messages: [{ role: "user", content: istek.kullanici }],
      // Kısa, basit iş: düşük çaba yetiyor, gecikme ve maliyet düşüyor.
      ...(EFORLU.test(s.model) ? { output_config: { effort: "low" as const } } : {}),
      ...(yedek ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    if (r.stop_reason === "refusal") return { tamam: false, hata: "red" };
    const metin = r.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return metin ? { tamam: true, metin } : { tamam: false, hata: "bos" };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return { tamam: false, hata: "anahtar" };
    if (e instanceof Anthropic.RateLimitError) return { tamam: false, hata: "sinir" };
    if (e instanceof Anthropic.APIError) return durumHatasi(e.status ?? 500);
    return { tamam: false, hata: "saglayici" };
  }
};

const openaiUyumlu = async (s: Saglayici, istek: Istek, fetchFn: typeof fetch): Promise<Sonuc> => {
  let r: Response;
  try {
    r = await fetchFn(`${s.adres}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${s.anahtar}` },
      body: JSON.stringify({
        model: s.model,
        max_tokens: istek.enCokCikti,
        messages: [
          { role: "system", content: istek.sistem },
          { role: "user", content: istek.kullanici },
        ],
      }),
    });
  } catch {
    return { tamam: false, hata: "saglayici" };
  }
  if (!r.ok) return durumHatasi(r.status);
  const j = (await r.json().catch(() => null)) as { choices?: { message?: { content?: unknown } }[] } | null;
  const metin = j?.choices?.[0]?.message?.content;
  return typeof metin === "string" && metin.trim() ? { tamam: true, metin: metin.trim() } : { tamam: false, hata: "bos" };
};

export const cagir = (s: Saglayici, istek: Istek, fetchFn: typeof fetch) => (s.tur === "anthropic" ? claude(s, istek, fetchFn) : openaiUyumlu(s, istek, fetchFn));
