// AI Provider service with automatic multi-key rotation and multi-provider fallback.
// Supports SiliconFlow (GLM / DeepSeek / Qwen / Kimi) and LLM7.io.

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const SILICONFLOW_KEYS = [
  "sk-mfkmyrplaxmqbsyoiuersgxvrhcfvpqwpmkmgeeqenurklsb",
  "sk-nqsxxmoejtixvkewwwycgravwgmkgisrbagccgfsohmbmshy",
  "sk-nwposqgtmbliqmjhixqncgurrghltbvocwazkbbujajshhsb",
  "sk-dhgmqahuhwphspwuqrhmkeiqpjekurhaewcsuwqtmrrvwjfy",
];

export const LLM7_KEYS = [
  "U9ZUCcS/L+evH6d4Z+JKz3Qf36/IpNn3xdtxKE6cJLEz+mhG0dqENaiNQO/og5dKdHmRBhmTe6bIlnu9nGIyVqCN6rHfMY2k4LXopNEZiozmhLR8HEsTiCrCzqhZgYIoBXOzr7dcns9ffk8=",
  "lpWhICqrnwKVz8jXiLRwt4Km1guztqDM7YZn9IpD5R5+M77Nb9XHukgXa4eY/r1nOFAjZHufPj5eMN+0B6nL/eACBaQx055JgDAeErn1Wp6UMib7Rnepo4GYgn2N6fyzMJQZQK3XJny/9U0SGA==",
  "8nRqx7a/DNPj8bS7CUxU0AbOZZ6RbBcqoAi0BqY1QmDPQXHwLrI4N89mxUfAmTr5nXZFnUmlHUWCDAnvBpEtmQsbFSFlWBT0rN66ahYXm4q6OweoUM9Qz5JiNW/YJv998XNpNj8aIpzNjz8a",
  "gWwHOXFqVNvBIOsHafI+6Ob03cBLGvaqMSj5HDxqIeZHlHMTKHWbIqM1x9ldLF0UZWB8huyNFSud71sz5vLj6P14FfrIutpympTuA/bh6EvqUOKnx2c4x1B3LMZL+ivY45wa1HqRgT0bjFgxMCEgDg==",
];

export const SILICONFLOW_MODELS = [
  "Qwen/Qwen2.5-Coder-7B-Instruct",
  "deepseek-ai/DeepSeek-V3",
  "THUDM/glm-4-9b-chat",
  "internlm/internlm2_5-7b-chat",
  "Qwen/Qwen2.5-7B-Instruct",
];

export const LLM7_MODELS = [
  "gpt-4o-mini",
  "glm-4",
  "kimi",
  "claude-3-haiku",
];

export interface AIResponseResult {
  text: string;
  provider: "siliconflow" | "llm7" | "supabase";
  model: string;
  keyIndex: number;
}

let siliconKeyCursor = 0;
let llm7KeyCursor = 0;

async function callSiliconFlowDirect(messages: AIMessage[], model = SILICONFLOW_MODELS[0]): Promise<AIResponseResult> {
  const totalKeys = SILICONFLOW_KEYS.length;
  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (siliconKeyCursor + i) % totalKeys;
    const apiKey = SILICONFLOW_KEYS[keyIdx];

    // Try primary model and fallback free models
    for (const m of [model, ...SILICONFLOW_MODELS.filter(x => x !== model)]) {
      try {
        const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            siliconKeyCursor = (keyIdx + 1) % totalKeys;
            return {
              text: reply,
              provider: "siliconflow",
              model: m,
              keyIndex: keyIdx + 1,
            };
          }
        }
        console.warn(`[SiliconFlow Key #${keyIdx + 1} (${m})] Hata: ${res.status}`);
      } catch (err) {
        console.warn(`[SiliconFlow Key #${keyIdx + 1}] Ağ hatası:`, err);
      }
    }
  }
  throw new Error("all_siliconflow_keys_failed");
}

async function callLLM7Direct(messages: AIMessage[], model = LLM7_MODELS[0]): Promise<AIResponseResult> {
  const totalKeys = LLM7_KEYS.length;
  const endpoints = [
    "https://api.llm7.io/v1/chat/completions",
    "https://llm7.io/v1/chat/completions",
  ];

  for (let i = 0; i < totalKeys; i++) {
    const keyIdx = (llm7KeyCursor + i) % totalKeys;
    const apiKey = LLM7_KEYS[keyIdx];

    for (const ep of endpoints) {
      for (const m of [model, ...LLM7_MODELS.filter(x => x !== model)]) {
        try {
          const res = await fetch(ep, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: m,
              messages,
              temperature: 0.7,
              max_tokens: 4096,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || data.text || data.response;
            if (reply && reply.trim().length > 0) {
              llm7KeyCursor = (keyIdx + 1) % totalKeys;
              return {
                text: reply,
                provider: "llm7",
                model: m,
                keyIndex: keyIdx + 1,
              };
            }
          }
          console.warn(`[LLM7 Key #${keyIdx + 1} (${m})] Hata: ${res.status}`);
        } catch (err) {
          console.warn(`[LLM7 Key #${keyIdx + 1}] Ağ hatası:`, err);
        }
      }
    }
  }
  throw new Error("all_llm7_keys_failed");
}

export async function executeMultiProviderChat(
  messages: AIMessage[],
  preferredProvider?: "siliconflow" | "llm7"
): Promise<AIResponseResult> {
  const errors: string[] = [];

  const providers = preferredProvider === "llm7" 
    ? [callLLM7Direct, callSiliconFlowDirect]
    : [callSiliconFlowDirect, callLLM7Direct];

  for (const fn of providers) {
    try {
      const res = await fn(messages);
      return res;
    } catch (err: any) {
      errors.push(err.message || String(err));
    }
  }

  // Eğer tüm anahtarlar ve sağlayıcılar tükendiyse
  return {
    text: "Bugünlük kredin bizim için bitmiştir, yarın sıfırdan başlayabilirsiniz.",
    provider: "siliconflow",
    model: "exhausted",
    keyIndex: 0,
  };
}
