// Multi-provider AI rotation. Tries each key in order, falls back to next provider on 429/quota.
// IMPORTANT: keys are read from secrets — never expose to client.

export type Provider = "gemini" | "openrouter" | "sambanova" | "lovable";

function parseKeys(env: string | undefined): string[] {
  if (!env) return [];
  return env
    .split(/[,\n;\s]+/)
    .map((k) => k.trim().replace(/^\d+[\.\)]\s*/, ""))
    .filter((k) => k.length > 10);
}

const GEMINI_KEYS = parseKeys(Deno.env.get("GEMINI_KEYS"));
const OPENROUTER_KEYS = parseKeys(Deno.env.get("OPENROUTER_KEYS"));
const SAMBANOVA_KEYS = parseKeys(Deno.env.get("SAMBANOVA_KEYS"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Best coding models per provider
const MODELS = {
  gemini: "gemini-2.0-flash",
  openrouter: "qwen/qwen3-coder:free",
  sambanova: "DeepSeek-V3.1",
  lovable: "google/gemini-3-flash-preview",
};

// Per-call key rotation index (in-memory, resets on cold start — good enough)
const cursors: Record<Provider, number> = { gemini: 0, openrouter: 0, sambanova: 0, lovable: 0 };

function nextKey(provider: Provider, keys: string[]): string | null {
  if (keys.length === 0) return null;
  const k = keys[cursors[provider] % keys.length];
  cursors[provider] = (cursors[provider] + 1) % keys.length;
  return k;
}

export interface CallResult {
  text: string;
  provider: Provider;
  model: string;
}

async function callGemini(messages: any[], stream = false): Promise<Response | string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = nextKey("gemini", GEMINI_KEYS);
    if (!key) break;
    // Convert OpenAI-style messages to Gemini format
    const sys = messages.find((m) => m.role === "system")?.content || "";
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: typeof m.content === "string" ? [{ text: m.content }] : m.content.map((p: any) =>
          p.type === "text" ? { text: p.text } : { inline_data: { mime_type: "image/jpeg", data: p.image_url.url.split(",")[1] } }
        ),
      }));
    const body: any = { contents, systemInstruction: sys ? { parts: [{ text: sys }] } : undefined };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${key}`;
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const j = await r.json();
      return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    const errText = await r.text().catch(() => "");
    console.warn(`Gemini key ${attempt} failed: ${r.status} ${errText.slice(0, 200)}`);
  }
  throw new Error("all_gemini_keys_failed");
}

async function callOpenRouter(messages: any[]): Promise<string> {
  for (let attempt = 0; attempt < OPENROUTER_KEYS.length; attempt++) {
    const key = nextKey("openrouter", OPENROUTER_KEYS);
    if (!key) break;
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELS.openrouter, messages, max_tokens: 8000 }),
    });
    if (r.ok) {
      const j = await r.json();
      return j.choices?.[0]?.message?.content || "";
    }
  }
  throw new Error("all_openrouter_keys_failed");
}

async function callSambaNova(messages: any[], model = MODELS.sambanova): Promise<string> {
  for (let attempt = 0; attempt < SAMBANOVA_KEYS.length; attempt++) {
    const key = nextKey("sambanova", SAMBANOVA_KEYS);
    if (!key) break;
    const r = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 7000 }),
    });
    if (r.ok) {
      const j = await r.json();
      return j.choices?.[0]?.message?.content || "";
    }
  }
  throw new Error("all_sambanova_keys_failed");
}

async function callLovable(messages: any[]): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("no_lovable_key");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODELS.lovable, messages }),
  });
  if (!r.ok) throw new Error(`lovable_failed_${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

// Try a specific provider (non-streaming, used by agent mode)
export async function callProvider(provider: Provider, messages: any[]): Promise<CallResult> {
  let text = "";
  switch (provider) {
    case "gemini":
      text = (await callGemini(messages)) as string;
      break;
    case "openrouter":
      text = await callOpenRouter(messages);
      break;
    case "sambanova":
      text = await callSambaNova(messages);
      break;
    case "lovable":
      text = await callLovable(messages);
      break;
  }
  return { text, provider, model: MODELS[provider] };
}

// Try providers in fallback order
export async function callWithFallback(messages: any[], preferred?: Provider): Promise<CallResult> {
  const order: Provider[] = preferred
    ? [preferred, ...(["sambanova", "lovable", "gemini", "openrouter"] as Provider[]).filter((p) => p !== preferred)]
    : ["sambanova", "lovable", "gemini", "openrouter"];
  let lastErr: any;
  for (const p of order) {
    try {
      return await callProvider(p, messages);
    } catch (e) {
      lastErr = e;
      console.warn(`Provider ${p} failed:`, e instanceof Error ? e.message : e);
    }
  }
  throw lastErr || new Error("all_providers_failed");
}
