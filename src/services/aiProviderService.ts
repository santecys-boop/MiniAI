// Ultra-Fast AI Multi-Provider Service
// Providers: LLM7.io (DeepSeek-V4-Flash, Codestral, Gemini Flash Lite) & SiliconFlow (GLM-5.2, Kimi K3, Kimi 2.7, DeepSeek-V3)
// Features: Round-robin auto-rotation across 4 keys each, automatic 5s abort failover, zero lag.

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const LLM7_KEYS = [
  "U9ZUCcS/L+evH6d4Z+JKz3Qf36/IpNn3xdtxKE6cJLEz+mhG0dqENaiNQO/og5dKdHmRBhmTe6bIlnu9nGIyVqCN6rHfMY2k4LXopNEZiozmhLR8HEsTiCrCzqhZgYIoBXOzr7dcns9ffk8=",
  "lpWhICqrnwKVz8jXiLRwt4Km1guztqDM7YZn9IpD5R5+M77Nb9XHukgXa4eY/r1nOFAjZHufPj5eMN+0B6nL/eACBaQx055JgDAeErn1Wp6UMib7Rnepo4GYgn2N6fyzMJQZQK3XJny/9U0SGA==",
  "8nRqx7a/DNPj8bS7CUxU0AbOZZ6RbBcqoAi0BqY1QmDPQXHwLrI4N89mxUfAmTr5nXZFnUmlHUWCDAnvBpEtmQsbFSFlWBT0rN66ahYXm4q6OweoUM9Qz5JiNW/YJv998XNpNj8aIpzNjz8a",
  "gWwHOXFqVNvBIOsHafI+6Ob03cBLGvaqMSj5HDxqIeZHlHMTKHWbIqM1x9ldLF0UZWB8huyNFSud71sz5vLj6P14FfrIutpympTuA/bh6EvqUOKnx2c4x1B3LMZL+ivY45wa1HqRgT0bjFgxMCEgDg==",
];

export const SILICONFLOW_KEYS = [
  "sk-mfkmyrplaxmqbsyoiuersgxvrhcfvpqwpmkmgeeqenurklsb",
  "sk-nqsxxmoejtixvkewwwycgravwgmkgisrbagccgfsohmbmshy",
  "sk-nwposqgtmbliqmjhixqncgurrghltbvocwazkbbujajshhsb",
  "sk-dhgmqahuhwphspwuqrhmkeiqpjekurhaewcsuwqtmrrvwjfy",
];

// LLM7 verified working models (fastest & highest quality first)
export const LLM7_MODELS = [
  "DeepSeek-V4-Flash-0731",
  "codestral-latest",
  "gemini-3.1-flash-lite",
  "gpt-oss:20b"
];

// SiliconFlow verified models
export const SILICONFLOW_MODELS = [
  "zai-org/GLM-5.2",
  "moonshotai/Kimi-K2.7-Code",
  "moonshotai/Kimi-K3",
  "deepseek-ai/DeepSeek-V3",
  "Qwen/Qwen2.5-7B-Instruct"
];

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
  const totalKeys = LLM7_KEYS.length;

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (llm7Cursor + i) % totalKeys;
    const apiKey = LLM7_KEYS[keyIdx];

    for (const model of LLM7_MODELS) {
      try {
        const res = await fetchWithTimeout("https://api.llm7.io/v1/chat/completions", {
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
              model,
              keyIndex: keyIdx + 1,
            };
          }
        }
      } catch (_) {
        // Hızlıca bir sonraki modele/anahtara geç
      }
    }
  }
  throw new Error("all_llm7_keys_failed");
}

export async function callSiliconFlow(messages: AIMessage[]): Promise<AIResponseResult> {
  const totalKeys = SILICONFLOW_KEYS.length;

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (siliconCursor + i) % totalKeys;
    const apiKey = SILICONFLOW_KEYS[keyIdx];

    for (const model of SILICONFLOW_MODELS) {
      try {
        const res = await fetchWithTimeout("https://api.siliconflow.com/v1/chat/completions", {
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
              model,
              keyIndex: keyIdx + 1,
            };
          }
        }
      } catch (_) {
        // Hızlıca bir sonraki modele/anahtara geç
      }
    }
  }
  throw new Error("all_siliconflow_keys_failed");
}

export async function executeMultiProviderChat(
  messages: AIMessage[],
  preferredProvider?: "siliconflow" | "llm7"
): Promise<AIResponseResult> {
  // İlk önce hızlı ve çalışan sağlayıcıyı dene (varsayılan LLM7 -> SiliconFlow)
  const providers = preferredProvider === "siliconflow"
    ? [callSiliconFlow, callLLM7]
    : [callLLM7, callSiliconFlow];

  for (const fn of providers) {
    try {
      const res = await fn(messages);
      if (res && res.text && res.text.trim().length > 0) {
        return res;
      }
    } catch (_) {
      // Diğer sağlayıcıya geç
    }
  }

  // Tüm anahtarlar ve sağlayıcılar biterse
  return {
    text: "Bugünlük kredin bizim için bitmiştir, yarın sıfırdan başlayabilirsiniz.",
    provider: "llm7",
    model: "exhausted",
    keyIndex: 0,
  };
}
