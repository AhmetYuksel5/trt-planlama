import Anthropic from "@anthropic-ai/sdk";
import type { Saglayici } from "./ayar.ts";
import type { Istek } from "./ozellikler.ts";

/*
 * Sağlayıcıya tek çağrı. İki tür: Claude (resmî SDK'yla) ve OpenAI uyumlu
 * uç nokta (OpenAI, Mistral, Groq, OpenRouter, DeepSeek, Gemini'nin uyumlu
 * ucu… aynı istek biçimini kabul ediyor). Yeni sağlayıcı çoğunlukla kod
 * değişmeden ikinciyle ekleniyor.
 */

/* `ayrinti`: sağlayıcının kendi hata metni; yalnız yöneticinin "Dene"sinde gösteriliyor, nedeni tahmin edilmesin. */
export type Sonuc = { tamam: true; metin: string } | { tamam: false; hata: "anahtar" | "sinir" | "red" | "saglayici" | "bos"; ayrinti?: string };

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
    if (e instanceof Anthropic.APIError) return { ...durumHatasi(e.status ?? 500), ayrinti: `${e.status ?? ""} ${e.message}`.trim().slice(0, 300) } as Sonuc;
    return { tamam: false, hata: "saglayici", ayrinti: "baglanti" };
  }
};

/* Sağlayıcının hata gövdesinden okunur metin (OpenAI biçimi {error: {message}}; değilse ham metnin başı). */
const hataMetni = async (r: Response) => {
  const ham = await r.text().catch(() => "");
  try {
    const j = JSON.parse(ham) as { error?: { message?: unknown } | string; message?: unknown };
    const m = typeof j.error === "string" ? j.error : (j.error?.message ?? j.message);
    if (typeof m === "string") return m.slice(0, 300);
  } catch {
    /* JSON değil */
  }
  return ham.slice(0, 300);
};

const openaiUyumlu = async (s: Saglayici, istek: Istek, fetchFn: typeof fetch): Promise<Sonuc> => {
  /*
   * OpenAI'ın yeni (akıl yürüten) modelleri max_tokens'ı reddedip
   * max_completion_tokens istiyor; öbür uyumlu sağlayıcıların çoğu yalnız
   * max_tokens'ı tanıyor. Önce eskisi, reddedilirse yenisiyle bir kez daha.
   */
  const gonder = (sinirAdi: "max_tokens" | "max_completion_tokens") =>
    fetchFn(`${s.adres}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${s.anahtar}` },
      body: JSON.stringify({
        model: s.model,
        [sinirAdi]: istek.enCokCikti,
        messages: [
          { role: "system", content: istek.sistem },
          { role: "user", content: istek.kullanici },
        ],
      }),
    });
  let r: Response;
  try {
    r = await gonder("max_tokens");
    if (r.status === 400) {
      const m = await hataMetni(r.clone());
      if (/max_completion_tokens|max_tokens/.test(m)) r = await gonder("max_completion_tokens");
    }
  } catch {
    return { tamam: false, hata: "saglayici", ayrinti: "baglanti" };
  }
  if (!r.ok) return { ...durumHatasi(r.status), ayrinti: `${r.status} ${await hataMetni(r)}`.trim() } as Sonuc;
  const j = (await r.json().catch(() => null)) as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] } | null;
  const metin = j?.choices?.[0]?.message?.content;
  return typeof metin === "string" && metin.trim()
    ? { tamam: true, metin: metin.trim() }
    : { tamam: false, hata: "bos", ayrinti: j?.choices?.[0]?.finish_reason ?? "" };
};

export const cagir = (s: Saglayici, istek: Istek, fetchFn: typeof fetch) => (s.tur === "anthropic" ? claude(s, istek, fetchFn) : openaiUyumlu(s, istek, fetchFn));

/*
 * Sağlayıcının model listesi: yönetici model adını ezbere yazmasın.
 * OpenAI uyumlu uçta /models sohbet dışı modelleri de veriyor (ses,
 * görsel, embedding…); onlar ayıklanıyor. Claude'da SDK'nın listesi.
 */
const SOHBET_DISI = /embed|whisper|tts|dall-e|image|audio|realtime|moderation|transcribe|search|computer-use|babbage|davinci/i;

export type ModelSonucu = { tamam: true; modeller: string[] } | { tamam: false; hata: "anahtar" | "sinir" | "saglayici"; ayrinti?: string };

export const modelleriGetir = async (tur: Saglayici["tur"], adres: string | undefined, anahtar: string, fetchFn: typeof fetch): Promise<ModelSonucu> => {
  if (tur === "anthropic") {
    const client = new Anthropic({ apiKey: anahtar, fetch: fetchFn, maxRetries: 1, timeout: 30_000 });
    try {
      const l: string[] = [];
      for await (const m of client.models.list()) l.push(m.id);
      return { tamam: true, modeller: l };
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return { tamam: false, hata: "anahtar" };
      if (e instanceof Anthropic.APIError) return { ...durumHatasi(e.status ?? 500), ayrinti: `${e.status ?? ""} ${e.message}`.trim().slice(0, 300) } as ModelSonucu;
      return { tamam: false, hata: "saglayici", ayrinti: "baglanti" };
    }
  }
  let r: Response;
  try {
    r = await fetchFn(`${adres}/models`, { headers: { authorization: `Bearer ${anahtar}` } });
  } catch {
    return { tamam: false, hata: "saglayici", ayrinti: "baglanti" };
  }
  if (!r.ok) return { ...durumHatasi(r.status), ayrinti: `${r.status} ${await hataMetni(r)}`.trim() } as ModelSonucu;
  const j = (await r.json().catch(() => null)) as { data?: { id?: unknown }[] } | null;
  const l = (j?.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === "string" && !SOHBET_DISI.test(id));
  return { tamam: true, modeller: [...new Set(l)].sort() };
};
