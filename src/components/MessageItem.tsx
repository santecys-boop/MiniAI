import React, { useState, useEffect } from "react";
import {
  Sparkle, CheckCircle2, Layers, KeyRound, ChevronRight, Eye, ShieldCheck,
  Zap, Globe, Download, ImageIcon, FileText, Loader2, Play, Video, X, ExternalLink, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { ThinkingReasoning } from "@/components/ui/thinking-reasoning";
import { TetrisLoader } from "@/components/ui/loader-tetris";
import { Msg } from "../types";
import { ONLINE_COMPILER_API_KEY } from "../constants";
import { injectAIBridge } from "../utils";

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
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const [typedChat, setTypedChat] = useState("");
  const [isChatDone, setIsChatDone] = useState(false);

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

  useEffect(() => {
    if (!showCompile || !m.code) {
      if (!m.code && m.compileOutput) setShowResult(true);
      return;
    }
    let i = 0;
    const fullCode = m.code;
    const step = Math.max(15, Math.floor(fullCode.length / 40));
    const timer = setInterval(() => {
      i += step;
      if (i >= fullCode.length) {
        setTypedCode(fullCode);
        setIsTypingDone(true);
        clearInterval(timer);
        setTimeout(() => setShowResult(true), 800);
      } else {
        setTypedCode(fullCode.slice(0, i));
      }
    }, 35);
    return () => clearInterval(timer);
  }, [showCompile, m.code]);

  const thinkMatch = m.chat ? m.chat.match(/<think>([\s\S]*?)<\/think>/i) : null;
  const thoughtContent = thinkMatch ? thinkMatch[1].trim() : null;
  const rawChatWithoutThink = m.chat ? m.chat.replace(/<think>[\s\S]*?<\/think>/i, "").trim() : "";

  const isGeneratingImg = rawChatWithoutThink ? (rawChatWithoutThink.includes("tasarlanıyor") || rawChatWithoutThink.includes("oluşturuluyor") || rawChatWithoutThink.includes("görseliniz")) && !rawChatWithoutThink.includes("![") : false;
  const mdImageMatch = rawChatWithoutThink ? rawChatWithoutThink.match(/!\[.*?\]\((.*?)\)/) : null;
  const imageUrl = mdImageMatch ? mdImageMatch[1] : m.attachments?.find(a => a.kind === "image")?.data;
  const cleanChatText = rawChatWithoutThink ? rawChatWithoutThink.replace(/!\[.*?\]\(.*?\)/g, "").trim() : "";

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

  const planSentences = m.plan ? m.plan.split("\n").filter(s => s.trim() !== "") : undefined;

  return (
    <div className="flex gap-3.5 md:gap-4 animate-fade-in my-6 w-full text-stone-800 dark:text-stone-100">
      {/* Praashoo7 Ball Loader Avatar */}
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

      {/* Message Content (Thinking + Text) */}
      <div className="flex-1 space-y-3 min-w-0">
        
        {/* DeepSeek R1 Tarzı Gerçek Düşünce Akışı */}
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
              <Sparkle className="w-3.5 h-3.5" /> 📋 Uygulanacak Hedef Planı:
            </div>
            <div className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">{m.plan}</div>
          </div>
        )}

        {m.code && m.codeType === "html" && !m.compileStatus && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Web Sitesi üretildi ({Math.round(m.code.length / 1024 * 10) / 10}KB)
          </div>
        )}

        {/* Mavi Metin Olarak [dosya adı] İndir Linkleri */}
        {m.projectFiles && m.projectFiles.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 animate-fade-in font-sans">
            {m.projectFiles.map((f, fi) => {
              const isEnv = f.path.endsWith('.env');
              const fileContent = isEnv ? f.content.replace(/\{\{AUTO_API_KEY\}\}/g, m.projectApiKey || '') : f.content;
              const handleDownload = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const mimeType = f.path.endsWith('.txt') ? 'text/plain;charset=utf-8' :
                  f.path.endsWith('.json') ? 'application/json;charset=utf-8' :
                  f.path.endsWith('.py') ? 'text/x-python;charset=utf-8' :
                  f.path.endsWith('.csv') ? 'text/csv;charset=utf-8' :
                  f.path.endsWith('.md') ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
                const blob = new Blob([fileContent], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = f.path;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(`${f.path} indirildi`);
              };

              return (
                <span
                  key={fi}
                  onClick={handleDownload}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-[15px] cursor-pointer hover:underline inline-flex items-center gap-1 select-none transition-colors"
                  title={`${f.path} dosyasını indirmek için tıklayın`}
                >
                  [{f.path}] indir
                </span>
              );
            })}
          </div>
        )}

        {/* Web Sitesi Canlı Önizleme Butonu (Sadece butona basıldığında tam ekran açılır) */}
        {m.codeType === "html" && m.code && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
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

        {m.autoEvents && m.autoEvents.length > 0 && (
          <div className="mt-2 rounded-xl border border-amber-300/20 bg-stone-950 p-2.5 space-y-1 text-[11px] font-mono max-h-56 overflow-auto shadow-md">
            {m.autoEvents.map((ev, k) => (
              <div key={k} className="text-white/80 flex items-center gap-1.5">
                {ev.type === "step" && <span className="text-amber-300 font-bold">▶ {ev.title}</span>}
                {ev.type === "thought" && <span className="text-purple-300">💭 {ev.text}</span>}
                {ev.type === "plan" && <span className="text-white/70">📋 {ev.packages?.join(", ") || "—"} · {ev.files?.length || 0} dosya</span>}
                {ev.type === "file" && <span className="text-emerald-300">📄 {ev.path}</span>}
                {ev.type === "log" && <span className="text-white/50">$ {ev.text}</span>}
                {ev.type === "url" && <span className="text-amber-300">🌐 {ev.url}</span>}
                {ev.type === "test" && <span className={ev.ok ? "text-emerald-300" : "text-rose-300"}>🧪 {ev.ok ? "OK" : "FAIL"}</span>}
                {ev.type === "reflection" && <span className="text-white">🤖 {ev.text}</span>}
                {ev.type === "error" && <span className="text-rose-400 font-bold">⚠ {ev.message}</span>}
                {ev.type === "done" && <span className="text-emerald-300 font-bold">✓ Hazır</span>}
              </div>
            ))}
          </div>
        )}

        {m.autoUrl && (
          <a href={m.autoUrl} target="_blank" rel="noreferrer" download={m.downloadName || undefined} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline mt-2">
            {m.downloadName ? <><Download className="w-3.5 h-3.5" /> {m.downloadName} indir</> : <><Globe className="w-3.5 h-3.5" /> Canlı URL'i aç</>}
          </a>
        )}
        
        {m.role === "assistant" && !m.chat && !m.plan && !m.code && !m.compileStatus && isStreaming && (
          <div className="flex items-center gap-2 text-stone-500 text-sm font-sans animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Yapay zeka düşünüyor...</span>
          </div>
        )}
        </div>
      </div>

      {/* Tam Ekran Canlı Web Önizleme Modalı */}
      {previewModalOpen && m.code && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/95 backdrop-blur-md flex flex-col animate-fade-in">
          {/* Üst Yönetim Çubuğu */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-800 text-white select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-stone-100">Canlı Web Önizleme</h3>
                <p className="text-[10px] text-emerald-400 font-mono">● Tam Ekran Etkileşimli Görünüm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIframeKey(k => k + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition"
                title="Sayfayı Yeniden Yükle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition"
                title="Önizlemeyi Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tam Ekran Iframe */}
          <div className="flex-1 bg-white relative">
            <iframe
              key={iframeKey}
              srcDoc={injectAIBridge(m.code)}
              title="ai-live-preview-fullscreen"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
            />
          </div>
        </div>
      )}
    </div>
  );
}
