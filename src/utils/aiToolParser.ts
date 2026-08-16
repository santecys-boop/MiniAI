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
 * Model çıktısındaki function call XML/JSON bloklarını tespit eder ve ayrıştırır
 */
export function parseAIToolCalls(rawText: string): ParsedAIToolCalls {
  let cleanText = rawText;
  let webSearchQuery: string | undefined = undefined;
  let questions: ParsedQuestionItem[] | undefined = undefined;

  // 1. Web Search Tespiti
  const searchMatch = rawText.match(
    /<(?:antml:)?invoke\s+name=["']web_search["']>([\s\S]*?)<\/(?:antml:)?invoke>/i
  );

  if (searchMatch) {
    const invokeBody = searchMatch[1];
    const qMatch = invokeBody.match(/name=["']query["'](?:\s+text=["']([^"']+)["']|>([\s\S]*?)<\/(?:antml:)?parameter>)/i);
    if (qMatch) {
      webSearchQuery = (qMatch[1] || qMatch[2] || "").trim();
    } else {
      // JSON formatında mı?
      const jsonMatch = invokeBody.match(/\{[\s\S]*?"query"\s*:\s*"([^"]+)"[\s\S]*?\}/i);
      if (jsonMatch) webSearchQuery = jsonMatch[1].trim();
    }
  }

  // 2. Interactive Questions (ask_user_input_v0) Tespiti
  const askInputMatch = rawText.match(
    /<(?:antml:)?invoke\s+name=["']ask_user_input_v0["']>([\s\S]*?)<\/(?:antml:)?invoke>/i
  );

  if (askInputMatch) {
    const block = askInputMatch[1];
    const parsedItems: ParsedQuestionItem[] = [];

    // A) JSON Array Tespiti: [ { "question": "...", "options": [...] } ]
    const jsonArrayMatch = block.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonArrayMatch) {
      try {
        const jsonArr = JSON.parse(jsonArrayMatch[0]);
        if (Array.isArray(jsonArr)) {
          jsonArr.forEach((item: any, idx: number) => {
            if (item && item.question) {
              const opts = Array.isArray(item.options) ? item.options : ["Evet", "Hayır", "Farklı bir önerim var"];
              parsedItems.push({
                id: `q_${idx + 1}`,
                question: String(item.question).trim(),
                options: opts.map((o: any) => String(o).trim()),
                type: item.type === "multi_select" ? "multi_select" : "single_select",
              });
            }
          });
        }
      } catch (err) {
        console.warn("JSON parse error for ask_user_input_v0:", err);
      }
    }

    // B) XML <item> veya <antml:item> Tespiti
    if (parsedItems.length === 0) {
      const itemRegex = /<(?:antml:)?item>([\s\S]*?)<\/(?:antml:)?item>/gi;
      let match;
      let idx = 1;

      while ((match = itemRegex.exec(block)) !== null) {
        const itemContent = match[1] || "";
        
        // Question
        const qMatch = itemContent.match(/name=["']question["']\s+text=["']([^"']+)["']/i) ||
                       itemContent.match(/name=["']question["']>([\s\S]*?)<\/(?:antml:)?parameter>/i);
        const questionText = qMatch ? (qMatch[1] || qMatch[2] || "").trim() : `Soru ${idx}`;

        // Options
        const optMatch = itemContent.match(/name=["']options["']\s+text=['"]([\s\S]*?)['"]/i) ||
                         itemContent.match(/name=["']options["']>([\s\S]*?)<\/(?:antml:)?parameter>/i);
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
    }

    if (parsedItems.length > 0) {
      questions = parsedItems;
    }
  }

  // 3. XML / antml tag'lerinin tamamını kullanıcı sohbet metninden eksiksiz temizle
  cleanText = cleanText
    .replace(/<antml:function_calls>[\s\S]*?<\/antml:function_calls>/gi, "")
    .replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, "")
    .replace(/<antml:invoke[\s\S]*?<\/antml:invoke>/gi, "")
    .replace(/<invoke[\s\S]*?<\/invoke>/gi, "")
    .replace(/<antml:parameter[\s\S]*?<\/antml:parameter>/gi, "")
    .replace(/<parameter[\s\S]*?<\/parameter>/gi, "")
    .replace(/<antml:item>[\s\S]*?<\/antml:item>/gi, "")
    .replace(/<item>[\s\S]*?<\/item>/gi, "")
    .replace(/<antml:[^>]+>/gi, "")
    .replace(/<\/antml:[^>]+>/gi, "")
    .trim();

  return {
    webSearchQuery,
    questions,
    cleanText,
  };
}
