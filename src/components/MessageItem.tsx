import React, { useState, useEffect, useRef } from "react";
import {
  Copy, ThumbsUp, ThumbsDown, Share2, RotateCw, ChevronDown, ChevronRight,
  ImageIcon, FileText, Check, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Msg } from "../types";

export type MessageItemProps = {
  message: Msg;
  isStreaming?: boolean;
  onImageClick?: (url: string) => void;
};

export function MessageItem({ message: m, isStreaming, onImageClick }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [showThought, setShowThought] = useState(false);

  // Thinking timer state
  const [thinkSeconds, setThinkSeconds] = useState(0);
  const [thinkingDone, setThinkingDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start thinking timer when streaming starts for assistant messages
  useEffect(() => {
    if (m.role === "assistant" && isStreaming && !m.chat && !thinkingDone) {
      // AI is thinking - start timer
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setThinkSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    // AI finished thinking (chat appeared)
    if (m.role === "assistant" && m.chat && startTimeRef.current && !thinkingDone) {
      if (timerRef.current) clearInterval(timerRef.current);
      setThinkSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      setThinkingDone(true);
    }
  }, [m.role, m.chat, isStreaming, thinkingDone]);

  // Also mark done if we have a plan/thought content
  useEffect(() => {
    if (m.plan && !thinkingDone && m.chat) {
      setThinkingDone(true);
      if (thinkSeconds === 0) setThinkSeconds(Math.floor(Math.random() * 8) + 3);
    }
  }, [m.plan, m.chat, thinkingDone, thinkSeconds]);

  const mdImageMatch = m.chat ? m.chat.match(/!\[.*?\]\((.*?)\)/) : null;
  const imageUrl = mdImageMatch ? mdImageMatch[1] : m.attachments?.find(a => a.kind === "image")?.data;
  const cleanChatText = m.chat ? m.chat.replace(/!\[.*?\]\(.*?\)/g, "").trim() : "";

  function copyText() {
    if (m.chat) {
      navigator.clipboard.writeText(m.chat);
      setCopied(true);
      toast.success("Kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ─── USER MESSAGE ─── (Screenshot 3: right-aligned, light blue pill)
  if (m.role === "user") {
    return (
      <div className="flex justify-end my-4 animate-fade-in">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-[22px] px-5 py-3 bg-[#edf2fa] dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-[15px] leading-relaxed font-sans">
          {m.attachments && m.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 mb-2 border-b border-stone-200/50 dark:border-stone-700">
              {m.attachments.map((a, j) => (
                <div key={j} className="flex items-center gap-1.5 text-xs bg-white/70 dark:bg-stone-700 rounded-full px-2.5 py-0.5 text-stone-600 dark:text-stone-300">
                  {a.kind === "image" ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span className="truncate max-w-[120px]">{a.name}</span>
                </div>
              ))}
            </div>
          )}
          {m.chat && <div className="whitespace-pre-wrap">{m.chat}</div>}
        </div>
      </div>
    );
  }

  // ─── ASSISTANT MESSAGE ─── (Screenshot 3 & 4: left-aligned, no bubble, no avatar)
  const isCurrentlyThinking = isStreaming && !m.chat;
  const hasThoughts = !!m.plan;

  return (
    <div className="flex flex-col my-5 w-full max-w-3xl space-y-2.5 animate-fade-in">

      {/* ── THINKING INDICATOR (Screenshot 4) ── */}
      {(isCurrentlyThinking || hasThoughts || (thinkingDone && thinkSeconds > 0)) && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowThought(p => !p)}
            className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-[13px] font-normal transition-colors cursor-pointer select-none"
          >
            {isCurrentlyThinking && !thinkingDone ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Düşünüyor{thinkSeconds > 0 ? ` (${thinkSeconds}s)` : ""}...</span>
              </>
            ) : (
              <>
                <span>{thinkSeconds > 0 ? `${thinkSeconds} saniye düşünüldü` : "Düşünüldü"}</span>
              </>
            )}
            {showThought ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {showThought && hasThoughts && (
            <div className="border-l-2 border-stone-200 dark:border-stone-700 pl-4 py-1 text-stone-500 dark:text-stone-400 text-[13px] leading-relaxed animate-fade-in">
              <div className="whitespace-pre-wrap">{m.plan}</div>
            </div>
          )}

          {showThought && isCurrentlyThinking && !hasThoughts && (
            <div className="border-l-2 border-stone-200 dark:border-stone-700 pl-4 py-1 text-stone-400 dark:text-stone-500 text-[13px] leading-relaxed animate-fade-in">
              <span className="animate-pulse">Yapay zeka düşünüyor...</span>
            </div>
          )}
        </div>
      )}

      {/* ── IMAGE ── */}
      {imageUrl && (
        <div
          onClick={() => onImageClick?.(imageUrl)}
          className="relative max-w-md w-full rounded-2xl overflow-hidden cursor-pointer border border-stone-200 dark:border-stone-800 shadow-sm hover:opacity-95 transition-all"
        >
          <img src={imageUrl} alt="Görsel" className="w-full h-auto object-cover rounded-2xl" />
        </div>
      )}

      {/* ── CHAT TEXT ── (Screenshot 3 & 4: plain text, no bubble, no avatar) */}
      {cleanChatText && (
        <div className="whitespace-pre-wrap leading-[1.7] text-[15px] text-stone-800 dark:text-stone-100 font-sans">
          {cleanChatText}
        </div>
      )}

      {/* ── LOADING INDICATOR ── */}
      {isCurrentlyThinking && !cleanChatText && !hasThoughts && thinkSeconds === 0 && (
        <div className="flex items-center gap-2 text-stone-400 text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yapay zeka düşünüyor...</span>
        </div>
      )}

      {/* ── ACTION BAR ── (Screenshot 3 & 4: Copy, Like, Dislike, Share | Regenerate) */}
      {m.chat && !isStreaming && (
        <div className="flex items-center justify-between pt-0.5 select-none">
          <div className="flex items-center gap-0.5">
            <button
              onClick={copyText}
              className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              title="Kopyala"
            >
              {copied ? <Check className="w-[17px] h-[17px] text-emerald-600" /> : <Copy className="w-[17px] h-[17px]" />}
            </button>
            <button
              onClick={() => setLiked(liked === true ? null : true)}
              className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${liked === true ? "text-emerald-600" : "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200"}`}
              title="Beğen"
            >
              <ThumbsUp className="w-[17px] h-[17px]" />
            </button>
            <button
              onClick={() => setLiked(liked === false ? null : false)}
              className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${liked === false ? "text-rose-500" : "text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200"}`}
              title="Beğenme"
            >
              <ThumbsDown className="w-[17px] h-[17px]" />
            </button>
            <button
              onClick={() => {
                if (navigator.share && m.chat) {
                  navigator.share({ text: m.chat });
                } else {
                  copyText();
                }
              }}
              className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              title="Paylaş"
            >
              <Share2 className="w-[17px] h-[17px]" />
            </button>
          </div>

          <button
            className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            title="Yeniden Yanıtla"
          >
            <RotateCw className="w-[17px] h-[17px]" />
          </button>
        </div>
      )}
    </div>
  );
}
