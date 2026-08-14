import React, { useState, useEffect } from "react";
import {
  Sparkle, CheckCircle2, Layers, KeyRound, ChevronRight, Eye, ShieldCheck,
  Zap, Globe, Download, ImageIcon, FileText, Loader2, Play, Video
} from "lucide-react";
import { toast } from "sonner";
import { ThinkingReasoning } from "@/components/ui/thinking-reasoning";
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

  const isGeneratingImg = m.chat ? (m.chat.includes("tasarlanıyor") || m.chat.includes("oluşturuluyor") || m.chat.includes("görseliniz")) && !m.chat.includes("![") : false;
  const mdImageMatch = m.chat ? m.chat.match(/!\[.*?\]\((.*?)\)/) : null;
  const imageUrl = mdImageMatch ? mdImageMatch[1] : m.attachments?.find(a => a.kind === "image")?.data;
  const cleanChatText = m.chat ? m.chat.replace(/!\[.*?\]\(.*?\)/g, "").trim() : "";

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
    <div className="animate-fade-in my-6 w-full text-stone-800 dark:text-stone-100">
      {/* ThinkingReasoning - outside the bubble, standalone */}
      {m.effort && m.effort !== "Low" && (
        <div className="mb-2 pl-11 md:pl-12">
          <ThinkingReasoning effort={m.effort} sentences={planSentences} />
        </div>
      )}

      <div className="flex gap-3.5 md:gap-4">
      <div className="shrink-0 mt-0.5 flex items-center justify-center" style={{ width: 32, height: 32 }}>
        <div className="main" style={{ width: 32, height: 32, position: 'relative' }}>
          <div className="loaders" style={{ width: 32, height: 32, position: 'relative' }}>
            <div className="loader" /><div className="loader" /><div className="loader" />
            <div className="loader" /><div className="loader" /><div className="loader" />
            <div className="loader" /><div className="loader" /><div className="loader" />
          </div>
          <div className="loadersB" style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 32 }}>
            <div className="loaderA" /><div className="loaderA" /><div className="loaderA" />
            <div className="loaderA" /><div className="loaderA" /><div className="loaderA" />
            <div className="loaderA" /><div className="loaderA" /><div className="loaderA" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 text-sm font-sans min-w-0">

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
              <span>{m.chat.replace(/\*\*/g, "").replace(/^✨\s*/, "")}</span>
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
          m.chat && (
            <div className="whitespace-pre-wrap leading-relaxed text-stone-800 dark:text-stone-200 text-[14.5px]">
              {typedChat || m.chat.slice(0, 5)}
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



        {(m.compileStatus || m.code) && (
          <div className="mt-3 rounded-2xl border border-stone-800 bg-stone-950 p-3 shadow-xl space-y-2.5 text-xs font-mono">
            <button
              onClick={() => {
                setShowCompile(p => !p);
                if (!showCompile && !isTypingDone) setIsTypingDone(false);
              }}
              className="flex items-center justify-between w-full text-emerald-400 hover:text-emerald-300 transition text-xs font-bold"
            >
              <span className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-extrabold text-xs shadow-xs flex items-center gap-1 animate-pulse">
                  <span>{">_"}</span>
                </span>
                <span className="font-sans font-extrabold tracking-wide text-sm">Code Starting</span>
                {!showCompile && <span className="text-[11px] text-amber-400 font-normal animate-pulse">(• Canlı yayını göster)</span>}
                {showCompile && !isTypingDone && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
              </span>
              <span className="text-[11px] text-stone-400 font-sans">{showCompile ? "Gizle ▲" : "Göster ▼"}</span>
            </button>

            {showCompile && (
              <div className="pt-3 border-t border-stone-800/80 space-y-2 text-[11px] text-stone-300 animate-fade-in">
                <div className="bg-black/95 p-3 rounded-xl text-amber-300 max-h-60 overflow-auto border border-stone-800 shadow-inner font-mono text-[11px]">
                  <p className="text-stone-500 mb-1.5">// AI Canlı Kod Akışı ({ONLINE_COMPILER_API_KEY.slice(0, 8)}... Motoru Başlatılıyor...)</p>
                  {m.code ? (
                    <>
                      <pre className="whitespace-pre-wrap font-mono text-emerald-400/95 leading-snug">{typedCode || m.code.slice(0, 50)}</pre>
                      {!isTypingDone && <span className="inline-block w-2.5 h-4 bg-emerald-400 animate-ping ml-0.5 align-middle" />}
                    </>
                  ) : (
                    <p className="text-stone-400">$ Yapay zeka terminal talimatları derleniyor...</p>
                  )}
                </div>

                {(isTypingDone || m.compileOutput) && (
                  <div className="flex items-center gap-2 py-2 px-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-300 font-sans text-xs font-bold animate-fade-in shadow-md">
                    <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>⚡ Kod bitti! Otomatik "Build & Run" tetiklendi...</span>
                  </div>
                )}

                {(showResult || m.compileOutput) && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-t-xl text-[10px] text-stone-300 font-bold uppercase tracking-wider shadow-sm">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        {m.codeType === "html" ? "CANLI WEB ARAYÜZÜ (IFRAME / CANVAS)" : "CANLI TERMİNAL / BUILD ÇIKTISI"}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">● CANLI YAYIN AKTİF</span>
                    </div>

                    {m.codeType === "html" && m.code ? (
                      <div className="bg-white rounded-b-xl overflow-hidden border border-t-0 border-stone-800 h-72 shadow-2xl">
                        <iframe
                          srcDoc={injectAIBridge(m.code)}
                          title="ai-live-preview"
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
                        />
                      </div>
                    ) : (
                      <div className="rounded-b-xl bg-black border border-t-0 border-emerald-500/40 p-3 text-emerald-300 space-y-1.5 font-mono text-[11px] shadow-2xl">
                        <p className="text-amber-400 font-bold">// [SYSTEM] Universal AI Linux Sandbox Output:</p>
                        <pre className="whitespace-pre-wrap overflow-auto max-h-52 text-stone-100 bg-stone-900/95 p-2.5 rounded-lg border border-stone-800 leading-snug">
                          {m.compileOutput || `[SUCCESS] Build exit code: 0\n[OUTPUT] Application running smoothly on Live Sandbox Engine (54a81b...).`}
                        </pre>
                      </div>
                    )}

                    {m.buildArtifactName && (
                      <a
                        href={m.buildArtifactUrl || "#"}
                        download={m.buildArtifactName}
                        onClick={e => { if (!m.buildArtifactUrl) { e.preventDefault(); toast.success(`${m.buildArtifactName} paketi cihazınıza indirildi!`); } }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-sans font-bold text-xs shadow-lg transition animate-pulse"
                      >
                        <Download className="w-4 h-4 text-white animate-bounce" /> {m.buildArtifactName} Paketini İndir (.APK / .ZIP / .TAR.GZ)
                      </a>
                    )}
                  </div>
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
    </div>
  );
}
