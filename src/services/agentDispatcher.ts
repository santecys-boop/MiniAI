/**
 * ════════════════════════════════════════════════════════════════════════════
 *  agentDispatcher.ts — Merkezi Otonom Ajan & Yürütme Yönlendiricisi (Router)
 * ════════════════════════════════════════════════════════════════════════════
 * Index.tsx içerisindeki dev if-else dallanmalarını temizleyip tek bir modüler
 * mimaride toplayan; E2B Cloud VM, Otonom Tool-Loop ve Dosya Snapshot yönetimini sağlayan motor.
 */

import { Msg, AutoEvent, ProjectFile } from "../types";
import { runAutonomousAgent } from "../lib/agentEngine";
import { runTerminalBlocks, formatToolResults } from "../lib/aiTerminalBridge";

const SNAPSHOT_KEY = "mini_ai_project_snapshot_v2";

export type ExecutionMode = "ZIP_EDIT" | "E2B_SANDBOX" | "AUTONOMOUS_APP" | "STANDARD_CHAT";

export interface DispatchOptions {
  prompt: string;
  systemPrompt: string;
  model: string;
  pendingAttachments: any[];
  isFix?: boolean;
  isImageOnly?: boolean;
  onEvent: (event: AutoEvent) => void;
  onLog: (type: "info" | "ai" | "error" | "success", msg: string) => void;
  fnBaseUrl: string;
  anonKey: string;
}

export interface DispatchResult {
  mode: ExecutionMode;
  finalMsg: Partial<Msg>;
  projectFiles?: ProjectFile[];
  success: boolean;
  liveUrl?: string;
  downloadUrl?: string;
  downloadName?: string;
}

/**
 * Proje Dosya Ağacını Kalıcı Olarak Saklar (Snapshot)
 */
export function saveProjectSnapshot(files: ProjectFile[]) {
  try {
    if (files && files.length > 0) {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(files));
    }
  } catch (err) {
    console.warn("Snapshot save error:", err);
  }
}

/**
 * Önceki Proje Dosya Ağacını Geri Yükler
 */
export function getProjectSnapshot(): ProjectFile[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Kullanıcı İstemine Göre Uygun Ajan Modunu Belirler
 */
export function detectExecutionMode(prompt: string, attachments: any[], isFix = false, isImageOnly = false, model = "fast"): ExecutionMode {
  const lower = prompt.toLowerCase();
  const uploadedFile = attachments.find(a => a.kind === "file");
  const isZip = !!uploadedFile && /\.zip$/i.test(uploadedFile.name);
  const wantsZipEdit = isZip && /\b(düzelt|düzenle|değiştir|güncelle|ekle|kaldır|sil|çevir|refactor|fix|edit|update|değistir)\b/.test(lower);

  if (!isFix && wantsZipEdit) return "ZIP_EDIT";

  const explicitE2B = !isFix && !isImageOnly && /\b(terminal|linux|bash|otomasyon|vm|e2b|sunucu|node server|express)\b/.test(lower);
  if (explicitE2B) return "E2B_SANDBOX";

  const isAppOrSaaS = !isFix && !isImageOnly && (
    /\b(site|sayfa|page|landing|portfolyo|portfolio|uygulama|app|web ?site|tasarla|tasarım|yap bana|bana .* yap|oluştur|build|create|saas|panel|dashboard|platform)\b/.test(lower) ||
    model === "pro"
  );
  if (isAppOrSaaS) return "AUTONOMOUS_APP";

  return "STANDARD_CHAT";
}

/**
 * Merkezi Dağıtıcı (Dispatcher) Yürütme Fonksiyonu
 */
export async function dispatchAgentExecution(options: DispatchOptions): Promise<DispatchResult> {
  const { prompt, systemPrompt, model, pendingAttachments, isFix, isImageOnly, onEvent, onLog, fnBaseUrl, anonKey } = options;
  const mode = detectExecutionMode(prompt, pendingAttachments, isFix, isImageOnly, model);
  const existingFiles = getProjectSnapshot();

  // 1. DÖNGÜ: ZIP Dosyası Düzenleme (E2B Agent File Edit)
  if (mode === "ZIP_EDIT") {
    const uploadedFile = pendingAttachments.find(a => a.kind === "file");
    if (!uploadedFile) throw new Error("ZIP dosyası bulunamadı.");

    onLog("ai", "🤖 E2B Linux VM açılıyor — ZIP projesi inceleniyor...");
    const isZip = /\.zip$/i.test(uploadedFile.name);
    const fileBase64 = isZip
      ? uploadedFile.data.split(",")[1] || ""
      : btoa(unescape(encodeURIComponent(uploadedFile.data)));

    const res = await fetch(`${fnBaseUrl}/agent-file-edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ fileName: uploadedFile.name, fileBase64, instruction: prompt }),
    });

    if (!res.body) throw new Error("Akış alınamadı.");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let downloadUrl: string | undefined;
    let downloadName: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const chunks = buf.split("\n\n");
      buf = chunks.pop() || "";
      for (const c of chunks) {
        const line = c.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(6)) as AutoEvent;
          onEvent(ev);
          if (ev.type === "step") onLog("ai", `▶ ${ev.title}`);
          if (ev.type === "log") onLog("info", `$ ${ev.text}`);
          if (ev.type === "error") onLog("error", `⚠ ${ev.message}`);
          if (ev.type === "done") {
            onLog("success", "✓ Dosya düzenleme tamamlandı");
            downloadName = ev.fileName;
            downloadUrl = `data:application/zip;base64,${ev.fileBase64}`;
          }
        } catch {}
      }
    }

    return {
      mode,
      finalMsg: {
        role: "assistant",
        chat: downloadUrl ? `✅ Hazır — ${downloadName}` : "Dosya düzenleme tamamlandı.",
        downloadUrl,
        downloadName
      },
      downloadUrl,
      downloadName,
      success: true
    };
  }

  // 2. DÖNGÜ: E2B Cloud Linux VM Otonom Sunucu Motoru (agent-run)
  if (mode === "E2B_SANDBOX") {
    onLog("ai", "🧠 E2B Cloud Linux VM ve Otonom Ajan Başlatılıyor...");
    const res = await fetch(`${fnBaseUrl}/agent-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ prompt, existingFiles }),
    });

    if (!res.body) throw new Error("E2B Sunucu akışı başlatılamadı.");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let liveUrl: string | undefined;
    let snapshotFiles: ProjectFile[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const chunks = buf.split("\n\n");
      buf = chunks.pop() || "";
      for (const c of chunks) {
        const line = c.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(6)) as AutoEvent;
          onEvent(ev);
          if (ev.type === "url" || (ev.type === "done" && ev.url)) liveUrl = ev.url;
          if (ev.type === "step") onLog("ai", `▶ ${ev.title}`);
          if (ev.type === "log") onLog("info", `$ ${ev.text}`);
          if (ev.type === "error") onLog("error", `⚠ ${ev.message}`);
          if (ev.type === "snapshot" && ev.files) {
            snapshotFiles = ev.files;
            saveProjectSnapshot(snapshotFiles);
          }
          if (ev.type === "done") onLog("success", `✓ E2B Otomasyon ve Test Tamamlandı: ${liveUrl || ""}`);
        } catch {}
      }
    }

    return {
      mode,
      finalMsg: {
        role: "assistant",
        chat: liveUrl ? `🚀 Projeniz Canlı Yayında: ${liveUrl}` : "Otomasyon tamamlandı.",
        autoUrl: liveUrl,
        projectFiles: snapshotFiles
      },
      projectFiles: snapshotFiles,
      liveUrl,
      success: true
    };
  }

  // 3. DÖNGÜ: İstemci Tarafı Modüler React + TSX Otonom Ajan (runAutonomousAgent)
  if (mode === "AUTONOMOUS_APP") {
    onLog("ai", "🧠 Otonom Ajan Başlatıldı: Çoklu dosya ve araç çağırma döngüsü çalışıyor...");
    const agentResult = await runAutonomousAgent({
      prompt,
      systemPrompt,
      model,
      existingFiles,
      onEvent: (ev) => {
        onEvent(ev);
        if (ev.type === "step") onLog("ai", `▶ ${ev.title}`);
        if (ev.type === "log") onLog("info", `${ev.text}`);
        if (ev.type === "file") onLog("info", `📝 Dosya: ${ev.path}`);
        if (ev.type === "error") onLog("error", `⚠ ${ev.message}`);
        if (ev.type === "test") onLog(ev.ok ? "success" : "error", ev.ok ? "✅ Test & Derleme Başarılı" : "❌ Derleme Hatası");
      }
    });

    if (agentResult.finalMsg.projectFiles && agentResult.finalMsg.projectFiles.length > 0) {
      saveProjectSnapshot(agentResult.finalMsg.projectFiles);
    }

    return {
      mode,
      finalMsg: agentResult.finalMsg,
      projectFiles: agentResult.finalMsg.projectFiles,
      success: agentResult.success
    };
  }

  return {
    mode: "STANDARD_CHAT",
    finalMsg: {},
    success: true
  };
}
