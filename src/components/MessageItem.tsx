import React, { useState, useEffect } from "react";
import {
  Sparkle, CheckCircle2, Layers, KeyRound, ChevronRight, Eye, ShieldCheck,
  Zap, Globe, Download, ImageIcon, FileText, Loader2, Play, Video, X, ExternalLink, RefreshCw,
  FolderTree, Database, Code2, Sparkles, Box
} from "lucide-react";
import { toast } from "sonner";
import { ThinkingReasoning } from "@/components/ui/thinking-reasoning";
import { TetrisLoader } from "@/components/ui/loader-tetris";
import { Msg, ProjectFile } from "../types";
import { ONLINE_COMPILER_API_KEY } from "../constants";
import { injectAIBridge, exportProjectToZip, generateVirtualPreviewHtml } from "../utils";
import { ProjectFileTree } from "./ProjectFileTree";
import { DatabaseSchemaViewer } from "./DatabaseSchemaViewer";
import { MultiFileSandboxPreview } from "./MultiFileSandboxPreview";

export type MessageItemProps = {
  message: Msg;
  isStreaming?: boolean;
  onImageClick?: (url: string) => void;
};

export function MessageItem({ message: m, isStreaming, onImageClick }: MessageItemProps) {
  const [showCompile, setShowCompile] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // SaaS Modal Yönetimi ("preview" | "files" | "database" | null)
  const [saasModalTab, setSaasModalTab] = useState<"preview" | "files" | "database" | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const [typedChat, setTypedChat] = useState("");
  const [isChatDone, setIsChatDone] = useState(false);

  const hasMultiFiles = m.projectFiles && m.projectFiles.length > 0;
  const hasSql = m.databaseQueries && m.databaseQueries.length > 0;
  const isSaas = hasMultiFiles || !!m.projectName || hasSql;

  useEffect(() => {
    if (!m.chat || m.role === "user") {
      setIsChatDone(true);
      return;
    }
    let i = 0;
    const fullChat = m.chat;
    const step = Math.max(2, Math.floor(fullChat.length / 60));
    const timer = setInterval(() => {
      i += step + Math.floor(Math.random() * 3);
      if (i >= fullChat.length) {
        setTypedChat(fullChat);
        setIsChatDone(true);
        clearInterval(timer);
      } else {
        setTypedChat(fullChat.slice(0, i));
      }
    }, 22);
    return () => clearInterval(timer);
  }, [m.chat, m.role]);

  const thinkMatch = m.chat ? m.chat.match(/<think>([\s\S]*?)<\/think>/i) : null;
  const thoughtContent = thinkMatch ? thinkMatch[1].trim() : null;
  const rawChatWithoutThink = m.chat ? m.chat.replace(/<think>[\s\S]*?<\/think>/i, "").trim() : "";

  const isGeneratingImg = rawChatWithoutThink ? (rawChatWithoutThink.includes("tasarlanıyor") || rawChatWithoutThink.includes("oluşturuluyor") || rawChatWithoutThink.includes("görseliniz")) && !rawChatWithoutThink.includes("![") : false;
  const mdImageMatch = rawChatWithoutThink ? rawChatWithoutThink.match(/!\[.*?\]\((.*?)\)/) : null;
  const imageUrl = mdImageMatch ? mdImageMatch[1] : m.attachments?.find(a => a.kind === "image")?.data;
  const cleanChatText = rawChatWithoutThink ? rawChatWithoutThink.replace(/!\[.*?\]\(.*?\)/g, "").trim() : "";

  const handleDownloadFullZip = async () => {
    if (!m.projectFiles || m.projectFiles.length === 0) return;
    try {
      toast.info("📦 Proje ZIP paketi hazırlanıyor...");
      const blob = await exportProjectToZip(m.projectFiles, m.projectName || "mini-saas", m.databaseQueries || []);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(m.projectName || "mini-saas").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("✅ Proje ZIP indirildi!");
    } catch (err: any) {
      toast.error(`İndirme hatası: ${err.message}`);
    }
  };

  if (m.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in my-3 select-none">
        <div className="max-w-[85%] md:max-w-[75%] rounded-3xl px-5 py-3 bg-stone-900 text-white shadow-sm text-sm font-sans space-y-2">
          {m.attachments && m.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-stone-800">
              {m.attachments.map((a, j) => (
                <div key={j} className="flex items-center gap-1 text-[11px] bg-stone-800/80 rounded-md px-2 py-0.5 text-stone-200">
                  {a.kind === "image" ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}{a.name}
                </div>
              ))}
            </div>
          )}
          {m.chat && <div className="whitespace-pre-wrap leading-relaxed">{m.chat}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 md:gap-4 animate-fade-in my-6 w-full text-stone-800 dark:text-stone-100">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5 flex items-start justify-center" style={{ width: 32, height: 32 }}>
        <div className="main" style={{ position: 'relative', fontSize: '2.4px', marginTop: '16px' }}>
          <div className="loaders" style={{ position: 'relative' }}>
            <div className="loader" /><div className="loader" /><div className="loader" />
            <div className="loader" /><div className="loader" /><div className="loader" />
            <div className="loader" /><div className="loader" /><div className="loader" />
          </div>
          <div className="loadersB" style={{ position: 'absolute', top: 0, left: 0 }}>
            <div className="loaderA"><div className="ball0" /></div>
            <div className="loaderA"><div className="ball1" /></div>
            <div className="loaderA"><div className="ball2" /></div>
            <div className="loaderA"><div className="ball3" /></div>
            <div className="loaderA"><div className="ball4" /></div>
            <div className="loaderA"><div className="ball5" /></div>
            <div className="loaderA"><div className="ball6" /></div>
            <div className="loaderA"><div className="ball7" /></div>
            <div className="loaderA"><div className="ball8" /></div>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-3 min-w-0">
        
        {/* Düşünce Akışı (Thinking) */}
        {thoughtContent && (
          <details className="mb-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-3 text-xs group" open={false}>
            <summary className="cursor-pointer select-none flex items-center justify-between text-stone-400 hover:text-stone-200 transition font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <span className="font-semibold text-stone-200">Düşünce Süreci (Thinking)</span>
              </span>
              <span className="text-[11px] text-stone-500 group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="mt-2.5 pt-2.5 border-t border-stone-800 text-stone-400 font-mono text-[12px] leading-relaxed whitespace-pre-wrap pl-2.5 border-l-2 border-amber-500/40">
              {thoughtContent}
            </div>
          </details>
        )}

        <div className="text-sm font-sans space-y-3">
          {m.attachments && m.attachments.length > 0 && !imageUrl && (
            <div className="flex flex-wrap gap-1.5">
              {m.attachments.map((a, j) => (
                <div key={j} className="flex items-center gap-1 text-[11px] bg-stone-200/60 dark:bg-stone-800 rounded px-2 py-0.5">
                  {a.kind === "image" ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}{a.name}
                </div>
              ))}
            </div>
          )}

          {isGeneratingImg ? (
            <div className="space-y-3 my-2 animate-fade-in">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-medium text-sm">
                <span className="text-base">✨</span>
                <span>{cleanChatText.replace(/\*\*/g, "").replace(/^✨\s*/, "")}</span>
              </div>
              <div className="w-full max-w-sm aspect-[4/3] rounded-3xl bg-neutral-200/90 dark:bg-neutral-800/90 animate-pulse border border-neutral-300/40 dark:border-neutral-700/40 shadow-sm" />
            </div>
          ) : imageUrl ? (
            <div className="space-y-2 my-2 animate-fade-in">
              {cleanChatText && (
                <div className="whitespace-pre-wrap leading-relaxed text-stone-800 dark:text-stone-200 text-[14.5px]">
                  {cleanChatText}
                </div>
              )}
              <div
                onClick={() => onImageClick?.(imageUrl)}
                className="relative max-w-sm w-full rounded-3xl overflow-hidden cursor-pointer border border-stone-200 dark:border-stone-800 shadow-md hover:opacity-95 active:scale-[0.99] transition-all group select-none"
              >
                <img
                  src={imageUrl}
                  alt="Görsel"
                  className="w-full h-auto object-cover rounded-3xl pointer-events-none select-none"
                />
              </div>
            </div>
          ) : (
            cleanChatText && (
              <div className="whitespace-pre-wrap leading-relaxed text-stone-800 dark:text-stone-200 text-[14.5px]">
                {typedChat ? typedChat.replace(/<think>[\s\S]*?<\/think>/i, "").trim() : cleanChatText}
                {!isChatDone && (
                  <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle rounded-sm shadow-xs" />
                )}
              </div>
            )
          )}

          {m.plan && (
            <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs shadow-xs">
              <div className="font-bold mb-1 text-emerald-600 flex items-center gap-1">
                <Sparkle className="w-3.5 h-3.5" /> 📋 Uygulama Mimari Planı:
              </div>
              <div className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{m.plan}</div>
            </div>
          )}

          {/* 🌟 LOVABLE SEVİYESİ FULL-STACK SAAS KARTI */}
          {isSaas && hasMultiFiles && (
            <div className="my-3 p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 shadow-xl space-y-3">
              {/* Başlık ve Rozet */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-100 font-mono uppercase tracking-wider">
                      {m.projectName || "Full-Stack SaaS Uygulaması"}
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      React + Vite + Tailwind + PostgreSQL Mimari Paketi
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                  {m.projectFiles?.length} Dosya {hasSql ? `· ${m.databaseQueries?.length} Tablo` : ""}
                </span>
              </div>

              {/* Hızlı Butonlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* Canlı Önizleme */}
                <button
                  type="button"
                  onClick={() => setSaasModalTab("preview")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Canlı Önizle</span>
                </button>

                {/* Dosya Ağacı & Kodlar */}
                <button
                  type="button"
                  onClick={() => setSaasModalTab("files")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-xl text-xs border border-stone-700 transition-colors"
                >
                  <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dosyalar ({m.projectFiles?.length})</span>
                </button>

                {/* Veritabanı / SQL */}
                {hasSql && (
                  <button
                    type="button"
                    onClick={() => setSaasModalTab("database")}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-xl text-xs border border-stone-700 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Veritabanı</span>
                  </button>
                )}

                {/* ZIP İndir */}
                <button
                  type="button"
                  onClick={handleDownloadFullZip}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-xl text-xs border border-stone-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ZIP İndir</span>
                </button>
              </div>
            </div>
          )}

          {/* Tek Dosya Web Sitesi Canlı Önizleme Butonu (Eski Fallback) */}
          {!isSaas && m.codeType === "html" && m.code && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setSaasModalTab("preview")}
                className="w-full flex items-center justify-between px-4 py-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/50 text-white rounded-2xl text-xs font-semibold shadow-md transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-stone-100 text-xs">Canlı Önizlemeyi Aç</div>
                    <div className="text-[10px] text-stone-400 font-normal">Tam ekran etkileşimli web sitesi</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl group-hover:bg-emerald-900/80 transition-colors">
                  <span>Önizle</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}

          {m.role === "assistant" && !m.chat && !m.plan && !m.code && !m.compileStatus && isStreaming && (
            <div className="flex items-center gap-2 text-stone-500 text-sm font-sans animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Yapay zeka düşünüyor...</span>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 TAM EKRAN SAAS PROJE MODALI */}
      {saasModalTab && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/95 backdrop-blur-md flex flex-col animate-fade-in p-2 sm:p-4">
          {/* Modal Üst Çubuğu */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-900 rounded-t-2xl border-b border-stone-800 text-white select-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-stone-100">
                  {m.projectName || "Full-Stack SaaS Uygulaması"}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">
                  React + Vite + PostgreSQL Mimarisi
                </p>
              </div>
            </div>

            {/* Sekme Seçici */}
            <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setSaasModalTab("preview")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  saasModalTab === "preview" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canlı Önizleme</span>
              </button>
              {hasMultiFiles && (
                <button
                  type="button"
                  onClick={() => setSaasModalTab("files")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    saasModalTab === "files" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dosyalar ({m.projectFiles?.length})</span>
                </button>
              )}
              {hasSql && (
                <button
                  type="button"
                  onClick={() => setSaasModalTab("database")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    saasModalTab === "database" ? "bg-stone-800 text-stone-100" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Veritabanı</span>
                </button>
              )}
            </div>

            {/* Kapat Butonu */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSaasModalTab(null)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal İçerik Gövdesi */}
          <div className="flex-1 bg-stone-950 rounded-b-2xl overflow-hidden border border-stone-800 border-t-0 flex flex-col">
            {saasModalTab === "preview" && (
              hasMultiFiles ? (
                <MultiFileSandboxPreview
                  files={m.projectFiles!}
                  projectName={m.projectName || "SaaS Projesi"}
                  databaseQueries={m.databaseQueries || []}
                  onOpenFilesTab={() => setSaasModalTab("files")}
                  onOpenDatabaseTab={() => setSaasModalTab("database")}
                />
              ) : (
                <iframe
                  key={iframeKey}
                  srcDoc={injectAIBridge(m.code || "")}
                  title="ai-live-preview-fullscreen"
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
                />
              )
            )}

            {saasModalTab === "files" && hasMultiFiles && (
              <ProjectFileTree
                files={m.projectFiles!}
                projectName={m.projectName || "saas-project"}
                databaseQueries={m.databaseQueries || []}
              />
            )}

            {saasModalTab === "database" && hasSql && (
              <DatabaseSchemaViewer
                sqlQueries={m.databaseQueries!}
                projectName={m.projectName || "saas-app"}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
