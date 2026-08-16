/**
 * ════════════════════════════════════════════════════════════════════════════
 *  aiToolParser.ts — Yapay Zeka Araç Çağrısı (Tool Call) ve Soru Ayrıştırıcı
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface ParsedQuestionItem {
  id: string;
  question: string;
  options: string[];
  type: "single_select" | "multi_select" | "text";
}

export interface ParsedAIToolCalls {
  webSearchQuery?: string;
  questions?: ParsedQuestionItem[];
  cleanText: string;
}

/**
 * Model çıktısındaki function call XML bloklarını tespit eder ve ayrıştırır
 */
export function parseAIToolCalls(rawText: string): ParsedAIToolCalls {
  let cleanText = rawText;
  let webSearchQuery: string | undefined = undefined;
  let questions: ParsedQuestionItem[] | undefined = undefined;

  // 1. Web Search Tespiti
  const searchMatch = rawText.match(
    /<antml:invoke\s+name=["']web_search["']>[\s\S]*?<antml:parameter\s+name=["']query["'](?:\s+text=["']([^"']+)["']|>([\s\S]*?)<\/antml:parameter>)[\s\S]*?<\/antml:invoke>/i
  ) || rawText.match(
    /<invoke\s+name=["']web_search["']>[\s\S]*?<parameter\s+name=["']query["'](?:\s+text=["']([^"']+)["']|>([\s\S]*?)<\/parameter>)[\s\S]*?<\/invoke>/i
  );

  if (searchMatch) {
    webSearchQuery = (searchMatch[1] || searchMatch[2] || "").trim();
  }

  // 2. Interactive Questions (ask_user_input_v0) Tespiti
  const askInputMatch = rawText.match(
    /<antml:invoke\s+name=["']ask_user_input_v0["']>([\s\S]*?)<\/antml:invoke>/i
  ) || rawText.match(
    /<invoke\s+name=["']ask_user_input_v0["']>([\s\S]*?)<\/invoke>/i
  );

  if (askInputMatch) {
    const block = askInputMatch[1];
    const parsedItems: ParsedQuestionItem[] = [];

    // regex ile her bir question/item'ı yakala
    const itemRegex = /<antml:item>([\s\S]*?)<\/antml:item>|<item>([\s\S]*?)<\/item>/gi;
    let match;
    let idx = 1;

    while ((match = itemRegex.exec(block)) !== null) {
      const itemContent = match[1] || match[2] || "";
      
      // Question
      const qMatch = itemContent.match(/name=["']question["']\s+text=["']([^"']+)["']/i) ||
                     itemContent.match(/name=["']question["']>([\s\S]*?)<\/antml:parameter>/i);
      const questionText = qMatch ? (qMatch[1] || qMatch[2] || "").trim() : `Soru ${idx}`;

      // Options
      const optMatch = itemContent.match(/name=["']options["']\s+text=['"]([\s\S]*?)['"]/i) ||
                       itemContent.match(/name=["']options["']>([\s\S]*?)<\/antml:parameter>/i);
      let optionsList: string[] = [];
      if (optMatch) {
        const rawOpts = (optMatch[1] || optMatch[2] || "").trim();
        try {
          const parsed = JSON.parse(rawOpts);
          if (Array.isArray(parsed)) optionsList = parsed;
        } catch {
          optionsList = rawOpts.split(",").map(s => s.trim().replace(/^["'[]+|["'\]]+$/g, "")).filter(Boolean);
        }
      }

      // Type
      const typeMatch = itemContent.match(/name=["']type["']\s+text=["']([^"']+)["']/i);
      const qType = (typeMatch && typeMatch[1]?.includes("multi") ? "multi_select" : "single_select") as "single_select" | "multi_select" | "text";

      if (questionText) {
        parsedItems.push({
          id: `q_${idx}`,
          question: questionText,
          options: optionsList.length > 0 ? optionsList : ["Evet", "Hayır", "Farklı bir önerim var"],
          type: qType,
        });
        idx++;
      }
    }

    if (parsedItems.length > 0) {
      questions = parsedItems;
    }
  }

  // Fonksiyon çağrısı bloklarını arayüzde görünmemesi için temizle
  cleanText = cleanText
    .replace(/<antml:function_calls>[\s\S]*?<\/antml:function_calls>/gi, "")
    .replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, "")
    .trim();

  return {
    webSearchQuery,
    questions,
    cleanText,
  };
}
