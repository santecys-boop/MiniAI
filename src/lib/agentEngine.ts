/**
 * ════════════════════════════════════════════════════════════════════════════
 *  agentEngine.ts — Gerçek Otonom Ajan Döngüsü (Tool Calling & Self-Healing Loop)
 * ════════════════════════════════════════════════════════════════════════════
 * Düz lineer script yerine; iteratif `while (iterasyon < N)` döngüsüyle modelin
 * araç çağırdığı (read_file, write_file, line_replace, list_files, run_build, search_web),
 * derleme hatalarını modele geri besleyip otonom düzelttiren gerçek ajan motoru.
 */

import { Msg, AutoEvent, ProjectFile } from "../types";
import { parseAIResponse, injectAIBridge } from "../utils";
import { validateProjectBuild, ValidationResult } from "./codeCompilerValidator";
import { performDuckDuckGoSearch, formatSearchResultsForAI } from "../services/webSearchService";
import { executeMultiProviderChat, AIMessage } from "../services/aiProviderService";
import { buildVirtualSandboxBundle } from "./virtualModuleResolver";

export type AgentStepCallback = (event: AutoEvent) => void;

export interface AgentRunOptions {
  prompt: string;
  systemPrompt: string;
  onlineCompilerKey?: string;
  onEvent: AgentStepCallback;
  fnBaseUrl?: string;
  anonKey?: string;
  model: string;
  existingFiles?: ProjectFile[];
}

export interface AgentToolCall {
  name: "write_file" | "line_replace" | "read_file" | "list_files" | "run_build" | "search_web";
  args: Record<string, any>;
}

/**
 * Model çıktısındaki araç çağrılarını ve plan bloklarını ayrıştırır
 */
export function parseAgentToolCalls(rawText: string): {
  thought?: string;
  toolCalls: AgentToolCall[];
  directFiles: ProjectFile[];
  isFinal: boolean;
} {
  const toolCalls: AgentToolCall[] = [];
  const directFiles: ProjectFile[] = [];

  // 1. Düşünce Sürecini Ayrıştır (<thought>...</thought>)
  let thought: string | undefined = undefined;
  const thoughtMatch = rawText.match(/<thought>([\s\S]*?)<\/thought>/i);
  if (thoughtMatch) {
    thought = thoughtMatch[1].trim();
  }

  // 2. Yapılandırılmış Araç Çağrıları (<tool_call name="...">...</tool_call>)
  const toolRegex = /<tool_call\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/tool_call>/gi;
  let match;
  while ((match = toolRegex.exec(rawText)) !== null) {
    const name = match[1].trim() as any;
    const body = match[2].trim();
    try {
      const args = JSON.parse(body);
      toolCalls.push({ name, args });
    } catch {
      // JSON değilse argümanları etiketlerden çıkar
      if (name === "write_file") {
        const pathMatch = body.match(/<path>([\s\S]*?)<\/path>/i);
        const contentMatch = body.match(/<content>([\s\S]*?)<\/content>/i);
        if (pathMatch && contentMatch) {
          toolCalls.push({
            name: "write_file",
            args: { path: pathMatch[1].trim(), content: contentMatch[1].trim() }
          });
        }
      } else if (name === "read_file" || name === "list_files" || name === "run_build") {
        toolCalls.push({ name, args: { path: body } });
      }
    }
  }

  // 3. Klasik [FILE:path]...[/FILE] formatı desteği
  const fileRegex = /\[FILE:([^\]\n\r]+)\]\s*([\s\S]*?)(?=\[\/FILE\]|\[FILE:|$)/gi;
  while ((match = fileRegex.exec(rawText)) !== null) {
    let content = match[2].trim();
    content = content.replace(/\[\/FILE\]/gi, "").trim();
    content = content.replace(/^```[\w]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const path = match[1].trim();
    if (path && content) {
      directFiles.push({
        path,
        content,
        lang: path.endsWith(".sql") ? "sql" : path.endsWith(".tsx") || path.endsWith(".jsx") ? "tsx" : "javascript"
      });
      toolCalls.push({
        name: "write_file",
        args: { path, content }
      });
    }
  }

  // 4. Tek parça ```html veya ```tsx blok desteği
  if (toolCalls.length === 0 && directFiles.length === 0) {
    const codeBlockMatch = rawText.match(/```(html|tsx|jsx|javascript|typescript)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      const lang = codeBlockMatch[1]?.toLowerCase() || "html";
      const code = codeBlockMatch[2].trim();
      const defaultPath = lang === "html" ? "index.html" : "src/App.tsx";
      directFiles.push({
        path: defaultPath,
        content: code,
        lang: lang === "html" ? "html" : "tsx"
      });
      toolCalls.push({
        name: "write_file",
        args: { path: defaultPath, content: code }
      });
    }
  }

  const isFinal = rawText.includes("<agent_finish>") || rawText.includes("[PROJE TAMAMLANDI]");

  return { thought, toolCalls, directFiles, isFinal };
}

/**
 * Gerçek Otonom Ajan Döngüsü
 */
export async function runAutonomousAgent({
  prompt,
  systemPrompt,
  onEvent,
  model,
  existingFiles = []
}: AgentRunOptions): Promise<{
  finalMsg: Partial<Msg>;
  success: boolean;
}> {
  const MAX_ITERATIONS = 6;
  const projectFileMap = new Map<string, ProjectFile>();

  // Mevcut dosyaları yükle
  existingFiles.forEach(f => projectFileMap.set(f.path, { ...f }));

  const conversationHistory: AIMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}

### 🤖 GERÇEK OTONOM AJAN VE ARAÇ KULLANIM KURALLARI:
Sen iteratif bir yazılım geliştirme ajanısın. Kullanıcı isteklerini adım adım, araçları çağırarak modüler dosyalar halinde geliştirirsin.
Kullanabileceğin Araçlar:
1. \`<tool_call name="write_file">{"path": "src/pages/Dashboard.tsx", "content": "..."}</tool_call>\` : Dosya oluşturur veya yazar.
2. \`<tool_call name="line_replace">{"path": "src/App.tsx", "targetContent": "eski kod", "replacementContent": "yeni kod"}</tool_call>\` : Satır bazlı düzeltir.
3. \`<tool_call name="read_file">{"path": "src/types.ts"}</tool_call>\` : Dosya içeriğini okur.
4. \`<tool_call name="list_files">{}</tool_call>\` : Projedeki tüm dosya yollarını listeler.
5. \`<tool_call name="run_build">{}</tool_call>\` : Projeyi sentaks ve derleme testinden geçirir.
6. \`<tool_call name="search_web">{"query": "..."}</tool_call>\` : Web araması yapar.

Her yanıtında önce \`<thought>Düşünce sürecin ve planın</thought>\` yaz, ardından araç çağrılarını yap. Projeyi tamamladığında en sona \`<agent_finish>Proje başarıyla tamamlandı.</agent_finish>\` ekle.`
    },
    {
      role: "user",
      content: `KULLANICI İSTEMİ:\n${prompt}\n\nMevcut Dosyalar:\n${Array.from(projectFileMap.keys()).join(", ") || "(Yeni boş proje)"}`
    }
  ];

  onEvent({
    type: "step",
    title: "🧠 Otonom Ajan Başlatıldı: Mimar Planlanıyor ve Geliştirme Döngüsüne Giriliyor..."
  });

  let iteration = 0;
  let isDone = false;
  let finalSummary = "";
  let lastValidation: ValidationResult = { ok: true, diagnostics: [], totalFiles: 0, compiledFiles: 0, summary: "" };

  while (iteration < MAX_ITERATIONS && !isDone) {
    iteration++;

    onEvent({
      type: "step",
      title: `⚡ İterasyon ${iteration}/${MAX_ITERATIONS}: Model Düşünüyor ve Kodları İnşa Ediyor...`
    });

    let modelResponseText = "";
    try {
      const response = await executeMultiProviderChat(conversationHistory, model);
      modelResponseText = response.text || "";
    } catch (err: any) {
      onEvent({
        type: "error",
        message: `Model çağrı hatası: ${err.message}`
      });
      break;
    }

    if (!modelResponseText) {
      onEvent({ type: "error", message: "Modelden boş yanıt döndü." });
      break;
    }

    // Çıktıyı ayrıştır
    const parsed = parseAgentToolCalls(modelResponseText);

    if (parsed.thought) {
      onEvent({
        type: "thought",
        text: parsed.thought
      });
    }

    // Araç Çağrılarını Gerçek Olarak Çalıştır
    const toolResults: string[] = [];

    for (const call of parsed.toolCalls) {
      if (call.name === "write_file") {
        const { path, content } = call.args;
        if (path && content) {
          projectFileMap.set(path, {
            path,
            content,
            lang: path.endsWith(".sql") ? "sql" : path.endsWith(".tsx") || path.endsWith(".jsx") ? "tsx" : "javascript"
          });
          onEvent({
            type: "file",
            path
          });
          onEvent({
            type: "log",
            text: `📝 [WRITE] ${path} (${content.split("\n").length} satır yazıldı)`
          });
          toolResults.push(`[TOOL RESULT: write_file] '${path}' başarıyla kaydedildi (${content.length} karakter).`);
        }
      } else if (call.name === "line_replace") {
        const { path, targetContent, replacementContent } = call.args;
        const file = projectFileMap.get(path);
        if (file && targetContent && replacementContent !== undefined) {
          if (file.content.includes(targetContent)) {
            file.content = file.content.replace(targetContent, replacementContent);
            projectFileMap.set(path, file);
            onEvent({
              type: "file",
              path
            });
            onEvent({
              type: "log",
              text: `🔧 [PATCH] ${path} satır bazlı güncellendi.`
            });
            toolResults.push(`[TOOL RESULT: line_replace] '${path}' başarıyla güncellendi.`);
          } else {
            toolResults.push(`[TOOL ERROR: line_replace] '${path}' dosyasında hedef içerik bulunamadı.`);
          }
        } else {
          toolResults.push(`[TOOL ERROR: line_replace] Dosya bulunamadı: '${path}'`);
        }
      } else if (call.name === "read_file") {
        const path = call.args.path;
        const file = projectFileMap.get(path);
        if (file) {
          onEvent({
            type: "log",
            text: `🔍 [READ] ${path} inceleniyor...`
          });
          toolResults.push(`[TOOL RESULT: read_file '${path}']:\n${file.content}`);
        } else {
          toolResults.push(`[TOOL ERROR: read_file] '${path}' dosyası bulunamadı.`);
        }
      } else if (call.name === "list_files") {
        const list = Array.from(projectFileMap.keys()).join("\n") || "(Dosya yok)";
        toolResults.push(`[TOOL RESULT: list_files]:\n${list}`);
      } else if (call.name === "search_web") {
        const query = call.args.query;
        onEvent({
          type: "log",
          text: `🌐 [WEB SEARCH] "${query}" taranıyor...`
        });
        const webResults = await performDuckDuckGoSearch(query);
        toolResults.push(formatSearchResultsForAI(query, webResults));
      }
    }

    // Otomatik Gerçek Derleme ve Sentaks Denetimi (run_build)
    const currentFiles = Array.from(projectFileMap.values());
    lastValidation = validateProjectBuild(currentFiles);

    if (lastValidation.ok) {
      onEvent({
        type: "test",
        ok: true
      });
      onEvent({
        type: "log",
        text: `✅ ${lastValidation.summary}`
      });
    } else {
      onEvent({
        type: "test",
        ok: false
      });
      onEvent({
        type: "error",
        message: `🚨 ${lastValidation.summary}`
      });
      onEvent({
        type: "reflection",
        text: `🔧 [KENDİ KENDİNE İYİLEŞTİRME] Derleme hatası saptandı. Model hatayı düzeltmek için bir sonraki adımda ilgili dosyayı yamayacak.`
      });
      toolResults.push(`[BUILD DIAGNOSTICS - HATALAR MEVCUT]:\n${lastValidation.summary}\nLütfen yukarıdaki hatalı dosyaları ve satırları write_file veya line_replace ile derhal düzelt.`);
    }

    // Modeli geçmişe ekle
    conversationHistory.push({
      role: "assistant",
      content: modelResponseText
    });

    if (toolResults.length > 0) {
      conversationHistory.push({
        role: "user",
        content: `ARAÇ SONUÇLARI:\n${toolResults.join("\n\n")}`
      });
    }

    // Bitiş kontrolü
    if ((parsed.isFinal || parsed.toolCalls.length === 0) && lastValidation.ok && currentFiles.length > 0) {
      isDone = true;
      finalSummary = modelResponseText;
    }
  }

  const finalFiles = Array.from(projectFileMap.values());
  const finalBundle = buildVirtualSandboxBundle({
    files: finalFiles,
    projectName: "Mini AI Proje"
  });

  onEvent({
    type: "step",
    title: "🚀 Otonom Ajan Döngüsü Tamamlandı: Çok Dosyalı Proje Derlendi!"
  });

  onEvent({
    type: "done"
  });

  return {
    finalMsg: {
      role: "assistant",
      chat: finalSummary || `✨ Otonom geliştirme döngüsü ${iteration} iterasyonda tamamlandı. ${finalFiles.length} modüler dosya derlendi.`,
      projectFiles: finalFiles,
      code: finalBundle,
      codeType: "html",
      compileStatus: lastValidation.ok ? "success" : "failed",
      compileOutput: lastValidation.summary
    },
    success: lastValidation.ok
  };
}
