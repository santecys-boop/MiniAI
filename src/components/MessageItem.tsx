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
        
        {/* ThinkingReasoning (En üstte) */}
        {m.effort && m.effort !== "Low" && (
          <div className="mb-1">
            <ThinkingReasoning effort={m.effort} sentences={planSentences} />
          </div>
        )}

        {/* DeepSeek Tarzı Düşünce Akışı (Collapsible Think Box) */}
        {thoughtContent && (
          <details className="mb-2 rounded-2xl border border-stone-800 bg-stone-900/60 p-3 text-xs group" open={false}>
            <summary className="cursor-pointer select-none flex items-center justify-between text-stone-400 hover:text-stone-200 font-medium">
              <span className="flex items-center gap-2">
                <Sparkle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-semibold text-stone-300">Düşünce Süreci (Thinking)</span>
              </span>
              <span className="text-[10px] text-stone-500 group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="mt-2.5 pt-2 border-t border-stone-800/80 text-stone-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-amber-500/40">
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

        {m.code && !m.compileStatus && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {m.projectFiles ? `Proje üretildi (${m.projectFiles.length} dosya)` : `Kod üretildi (${Math.round(m.code.length / 1024 * 10) / 10}KB)`}
          </div>
        )}

        {m.projectFiles && m.projectFiles.length > 0 && (
          <div className="mt-2 rounded-2xl border border-stone-700 bg-stone-950 overflow-hidden shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-stone-800 bg-stone-900/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white tracking-wide">PROJE DOSYALARI</span>
                <span className="px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] font-mono">{m.projectFiles.length} dosya</span>
              </div>
              {m.projectApiKey && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px]">
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono text-emerald-300">{m.projectApiKey.slice(0, 16)}...</span>
                </div>
              )}
            </div>
            <div className="max-h-72 overflow-auto">
              {m.projectFiles.map((f, fi) => {
                const icon = f.path.endsWith('.env') ? '🔐' : f.path.endsWith('.html') ? '🌐' : f.path.endsWith('.css') ? '🎨' : f.path.endsWith('.tsx') || f.path.endsWith('.jsx') ? '⚛️' : f.path.endsWith('.js') || f.path.endsWith('.ts') ? '📜' : f.path.endsWith('.json') ? '📋' : f.path.endsWith('.md') ? '📄' : f.path.endsWith('.py') ? '🐍' : '📁';
                const isEnv = f.path.endsWith('.env');
                return (
                  <details key={fi} className="group border-b border-stone-800/60 last:border-0">
                    <summary className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer hover:bg-stone-800/50 transition text-xs select-none">
                      <span className="text-sm">{icon}</span>
                      <span className="font-mono text-stone-200 flex-1">{f.path}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        f.lang === 'html' ? 'bg-orange-950 text-orange-300 border border-orange-800/50' :
                        f.lang === 'css' ? 'bg-blue-950 text-blue-300 border border-blue-800/50' :
                        f.lang === 'javascript' || f.lang === 'jsx' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/50' :
                        f.lang === 'tsx' || f.lang === 'typescript' ? 'bg-sky-950 text-sky-300 border border-sky-800/50' :
                        f.lang === 'bash' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' :
                        'bg-stone-800 text-stone-300 border border-stone-700'
                      }`}>{f.lang}</span>
                      <span className="text-[10px] text-stone-500">{(f.content.length / 1024).toFixed(1)}KB</span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="bg-black/90 border-t border-stone-800">
                      <pre className={`p-3 text-[11px] font-mono leading-snug overflow-auto max-h-48 ${
                        isEnv ? 'text-emerald-400' : 'text-amber-200/90'
                      }`}><code>{isEnv ? f.content.replace(/{{AUTO_API_KEY}}/g, m.projectApiKey || 'KEY_LOADING...') : f.content}</code></pre>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}



        {/* Web Sitesi Canlı Önizleme Butonu (Arayüzde devasa iframe olmadan, sadece şık buton ile açılır) */}
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

        {/* Canlı Kod Akışı / Derleme Çıktısı (İsteğe bağlı gizlenebilir terminal) */}
        {(m.compileStatus || (m.code && m.codeType !== "html")) && (
          <div className="mt-2.5 rounded-2xl border border-stone-800 bg-stone-950 p-3 shadow-xl space-y-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setShowCompile(p => !p)}
              className="flex items-center justify-between w-full text-emerald-400 hover:text-emerald-300 transition text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-extrabold text-xs">
                  {">_"}
                </span>
                <span className="font-sans font-bold text-xs text-stone-200">Terminal & Derleme Çıktısı</span>
              </span>
              <span className="text-[11px] text-stone-400 font-sans">{showCompile ? "Gizle ▲" : "Göster ▼"}</span>
            </button>

            {showCompile && (
              <div className="pt-2.5 border-t border-stone-800/80 space-y-2 text-[11px] text-stone-300 animate-fade-in">
                {m.compileOutput && (
                  <pre className="whitespace-pre-wrap overflow-auto max-h-48 text-stone-100 bg-stone-900/95 p-2.5 rounded-lg border border-stone-800 leading-snug">
                    {m.compileOutput}
                  </pre>
                )}
                {m.buildArtifactName && (
                  <a
                    href={m.buildArtifactUrl || "#"}
                    download={m.buildArtifactName}
                    onClick={e => { if (!m.buildArtifactUrl) { e.preventDefault(); toast.success(`${m.buildArtifactName} paketi cihazınıza indirildi!`); } }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-sans font-bold text-xs shadow-md transition"
                  >
                    <Download className="w-4 h-4 text-white" /> {m.buildArtifactName} İndir
                  </a>
                )}
              </div>
            )}
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
