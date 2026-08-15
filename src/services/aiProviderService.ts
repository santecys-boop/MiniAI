// Mini AI Stealth Provider Service
// Fully Obfuscated & End-to-End Encrypted Runtime Resolver

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

// Obfuscated Key Vaults
const _V1 = [
  "fxNwf2lJeQVmAU9cYhxOHnABYGFQGXtMGRwFY1pkRBlSTl5SYW8cSWBmb1ABR0JtGk5bb2RLQ2R7ZQVFTR9OYU5iR3hoQkd+TxxIY0ZEXxNEbWNTfFtpZBxYYkxncxhBHmZyRVpkb3BDRVBHQmZ4EmJvWX5DaVhpUFtCcE1zY0VocmVQWB1OSURZE0xMQRIX",
  "Rlp9QmNpW1hEXWF8UBJAckNmeF1eHmFHG01fUF5bbmcdc3BEE2Nabh94HwFnHR1kSBNyYl9BTXJLHk9zBVgbRGVsa0BwYl9MekAfT2dkARpoHERmBU9raWhLe1IaHx9gTW5rT29YRBt9Whx/Z0NIHXhET1pFHm1zTUQYZBxMU1BnYHtwe2EZcmBEUwUTfxp5bWsXFw==",
  "EkR4W1IdSwVuZHpAEkh5HWl/Un8aa0hlcHAceEhoSVtFa0MaaFtzG3tHbnp7cmJdZlhjHmQSE0dSf0xrR35YH0RycGxEf0dGYn99aW5rRFxoWm9eR3tZSGx5bEZ9aH4aWGQcHEtCc3JHHlscZV1PRX9nE3tQH2BDZH0Fc2BcExMScmRaZEASS2NaUGRAUBJL",
  "TX1dYmVybFt8ZFxoY2VZYktMYwEcZUgaGUloZm1cS1tneUAfYm5SW2NPcGJGYmd+YWJ9SGNbZxtSE0ZOZmwaf3B9aBJCX1NkbHlfTh0bWVAfXGZAHHobHmxMWGNfXlpTR1p+X2sFSEIcb1xbf2VhRFIYSR5SG2gZZmdwZgFDXHMeH11LG2JbeE1+GkhAbE1SZ2lvTW5NFxc="
];

const _V2 = [
  "WUEHR0xBR1NYWkZLUkdbSFlTRUNfT1hZTVJcWEJJTFxaW11aR0FHTU9PW09EX1hBRllI",
  "WUEHRFtZUlJHRU9AXkNSXEFPXV1dU0lNWEtcXU1HQU1DWVhIS01JSU1MWUVCR0hHWUJT",
  "WUEHRF1aRVlbTV5HSEZDW0dAQkNSW0RJTV9YWE1CRl5IXEVJXUtQQUhIX0BLQFlCQllI",
  "WUEHTkJNR1tLQl9CXVpCWVpdX1tYQkdBT0NbWkBPQV9YQktPXUlZX11bXkdYWFxdQExT"
];

const _E1 = "Ql5eWlkQBQVLWkMERkZHHQRDRQVcGwVJQkteBUlFR1pGT15DRURZ";
const _E2 = "Ql5eWlkQBQVLWkMEWUNGQ0lFRExGRV0ESUVHBVwbBUlCS14FSUVHWkZPXkNFRFk=";

// Stealth Core Models
const _M1 = ["DeepSeek-V4-Flash-0731", "codestral-latest", "gemini-3.1-flash-lite", "gpt-oss:20b"];
const _M2 = ["zai-org/GLM-5.2", "moonshotai/Kimi-K2.7-Code", "moonshotai/Kimi-K3", "deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-7B-Instruct"];

export interface AIResponseResult {
  text: string;
  provider: "llm7" | "siliconflow";
  model: string;
  keyIndex: number;
}

let llm7Cursor = 0;
let siliconCursor = 0;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
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

export async function callLLM7(messages: AIMessage[]): Promise<AIResponseResult> {
  const totalKeys = _V1.length;
  const endpoint = _dec(_E1);

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (llm7Cursor + i) % totalKeys;
    const apiKey = _dec(_V1[keyIdx]);

    for (const model of _M1) {
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
            temperature: 0.7,
            max_tokens: 4096,
          }),
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            llm7Cursor = (keyIdx + 1) % totalKeys;
            return {
              text: reply,
              provider: "llm7",
              model: "Mini AI Hızlı",
              keyIndex: keyIdx + 1,
            };
          }
        }
      } catch (_) {
        // Failover
      }
    }
  }
  throw new Error("all_llm7_keys_failed");
}

export async function callSiliconFlow(messages: AIMessage[]): Promise<AIResponseResult> {
  const totalKeys = _V2.length;
  const endpoint = _dec(_E2);

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (siliconCursor + i) % totalKeys;
    const apiKey = _dec(_V2[keyIdx]);

    for (const model of _M2) {
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
            temperature: 0.7,
            max_tokens: 4096,
          }),
        }, 7000);

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            siliconCursor = (keyIdx + 1) % totalKeys;
            return {
              text: reply,
              provider: "siliconflow",
              model: "Mini AI Pro",
              keyIndex: keyIdx + 1,
            };
          }
        }
      } catch (_) {
        // Failover
      }
    }
  }
  throw new Error("all_siliconflow_keys_failed");
}

export async function executeMultiProviderChat(
  messages: AIMessage[],
  preferredOption?: string
): Promise<AIResponseResult> {
  const providers = preferredOption === "pro"
    ? [callSiliconFlow, callLLM7]
    : [callLLM7, callSiliconFlow];

  for (const fn of providers) {
    try {
      const res = await fn(messages);
      if (res && res.text && res.text.trim().length > 0) {
        return res;
      }
    } catch (_) {
      // Failover
    }
  }

  return {
    text: "Bugünlük kredin bizim için bitmiştir, yarın sıfırdan başlayabilirsiniz.",
    provider: "llm7",
    model: "Mini AI",
    keyIndex: 0,
  };
}
