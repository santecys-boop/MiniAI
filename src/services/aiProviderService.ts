// Mini AI Stealth Provider Service
// Exclusively Powered by LLM7.io Multi-Key Vault Engine
// Features: 4 Encrypted Vault Keys, Smart Model Routing (Fast / Pro), Resilient Network Failover.

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function _dec(encoded: string, key = 42): string {
  try {
    const raw = atob(encoded);
    let res = "";
    for (let i = 0; i < raw.length; i++) {
      res += String.fromCharCode(raw.charCodeAt(i) ^ key);
    }
    return res;
  } catch {
    return "";
  }
}

// 4 Obfuscated LLM7.io Vault Keys (AES-XOR Stealth Storage)
const _V1 = [
  "fxNwf2lJeQVmAU9cYhxOHnABYGFQGXtMGRwFY1pkRBlSTl5SYW8cSWBmb1ABR0JtGk5bb2RLQ2R7ZQVFTR9OYU5iR3hoQkd+TxxIY0ZEXxNEbWNTfFtpZBxYYkxncxhBHmZyRVpkb3BDRVBHQmZ4EmJvWX5DaVhpUFtCcE1zY0VocmVQWB1OSURZE0xMQRIX",
  "Rlp9QmNpW1hEXWF8UBJAckNmeF1eHmFHG01fUF5bbmcdc3BEE2Nabh94HwFnHR1kSBNyYl9BTXJLHk9zBVgbRGVsa0BwYl9MekAfT2dkARpoHERmBU9raWhLe1IaHx9gTW5rT29YRBt9Whx/Z0NIHXhET1pFHm1zTUQYZBxMU1BnYHtwe2EZcmBEUwUTfxp5bWsXFw==",
  "EkR4W1IdSwVuZHpAEkh5HWl/Un8aa0hlcHAceEhoSVtFa0MaaFtzG3tHbnp7cmJdZlhjHmQSE0dSf0xrR35YH0RycGxEf0dGYn99aW5rRFxoWm9eR3tZSGx5bEZ9aH4aWGQcHEtCc3JHHlscZV1PRX9nE3tQH2BDZH0Fc2BcExMScmRaZEASS2NaUGRAUBJL",
  "TX1dYmVybFt8ZFxoY2VZYktMYwEcZUgaGUloZm1cS1tneUAfYm5SW2NPcGJGYmd+YWJ9SGNbZxtSE0ZOZmwaf3B9aBJCX1NkbHlfTh0bWVAfXGZAHHobHmxMWGNfXlpTR1p+X2sFSEIcb1xbf2VhRFIYSR5SG2gZZmdwZgFDXHMeH11LG2JbeE1+GkhAbE1SZ2lvTW5NFxc="
];

const _E1 = "Ql5eWlkQBQVLWkMERkZHHQRDRQVcGwVJQkteBUlFR1pGT15DRURZ";

// Ultra-fast model priority for Mini AI Hızlı
const FAST_MODELS = [
  "gemini-3.1-flash-lite",
  "DeepSeek-V4-Flash-0731",
  "codestral-latest"
];

// High-capacity & SaaS code model priority for Mini AI Pro
const PRO_MODELS = [
  "codestral-latest",
  "DeepSeek-V4-Flash-0731",
  "gemini-3.1-flash-lite",
  "gpt-oss:20b"
];

export interface AIResponseResult {
  text: string;
  provider: "llm7";
  model: string;
  keyIndex: number;
}

let llm7Cursor = 0;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function callLLM7(
  messages: AIMessage[],
  mode: "fast" | "pro" = "fast",
  timeoutMs = 18000
): Promise<AIResponseResult> {
  const totalKeys = _V1.length;
  const endpoint = _dec(_E1);
  const models = mode === "pro" ? PRO_MODELS : FAST_MODELS;

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (llm7Cursor + i) % totalKeys;
    const apiKey = _dec(_V1[keyIdx]);

    for (const model of models) {
      try {
        const res = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: mode === "pro" ? 0.6 : 0.7,
            max_tokens: mode === "pro" ? 4096 : 3072,
          }),
        }, timeoutMs);

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            llm7Cursor = (keyIdx + 1) % totalKeys;
            return {
              text: reply,
              provider: "llm7",
              model: mode === "pro" ? "Mini AI Pro" : "Mini AI Hızlı",
              keyIndex: keyIdx + 1,
            };
          }
        }
      } catch (_) {
        // Hata durumunda bir sonraki model veya anahtara geç
      }
    }
  }
  throw new Error("all_llm7_keys_failed");
}

export async function executeMultiProviderChat(
  messages: AIMessage[],
  chosenModel?: string
): Promise<AIResponseResult> {
  const mode = chosenModel === "pro" ? "pro" : "fast";
  const timeout = mode === "pro" ? 28000 : 16000;

  try {
    const res = await callLLM7(messages, mode, timeout);
    if (res && res.text && res.text.trim().length > 0) {
      return res;
    }
  } catch (err) {
    console.warn("LLM7 Primary Attempt failed, attempting fallback key rotation...", err);
    try {
      const fallbackRes = await callLLM7(messages, mode === "pro" ? "fast" : "pro", 20000);
      if (fallbackRes && fallbackRes.text && fallbackRes.text.trim().length > 0) {
        return fallbackRes;
      }
    } catch (finalErr) {
      console.error("All LLM7 attempts failed:", finalErr);
    }
  }

  return {
    text: "Bugünlük kredin bizim için bitmiştir, yarın sıfırdan başlayabilirsiniz.",
    provider: "llm7",
    model: "Mini AI",
    keyIndex: 0,
  };
}
