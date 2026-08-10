import React from "react";
import { Msg } from "../types";
import { MessageItem } from "./MessageItem";

export type MessageListProps = {
  messages: Msg[];
  isLoading?: boolean;
  welcomeText: string;
  welcomeDone: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onImageClick?: (url: string) => void;
};

export function MessageList({ messages, isLoading, welcomeText, welcomeDone, chatEndRef, onImageClick, onPromptSelect }: MessageListProps & { onPromptSelect?: (prompt: string) => void }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 select-none max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md mb-1 ring-4 ring-stone-100 dark:ring-stone-800">
          <span className="text-xl font-bold">✨</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-100 text-center tracking-tight">
          {welcomeText || "Bugün sana nasıl yardımcı olabilirim?"}
          {!welcomeDone && (
            <span className="inline-block w-[2px] h-[1.1em] bg-stone-900 dark:bg-stone-100 ml-1 align-middle animate-pulse" />
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-2">
          {[
            { title: "Kod Yaz & Hata Çöz", desc: "Python, React veya C++ projende hata ayıkla", prompt: "React ve TailwindCSS ile modern bir hesap makinesi uygulaması kodla." },
            { title: "Görsel Üret", desc: "Hayalindeki görseli detaylandırıp çizdir", prompt: "Neon ışıklı gelecekçi bir siberpunk şehir manzarası görseli üret." },
            { title: "Full-Stack Web Sitesi Yap", desc: "E2B Sandbox ile canlı projeler oluştur", prompt: "Karanlık temalı, responsive bir portfolyo web sitesi tasarla." },
            { title: "Fikir & Metin Analizi", desc: "Makale özetle veya beyin fırtınası yap", prompt: "Yapay zekanın geleceği hakkında 5 maddelik özet bir analiz hazırla." },
          ].map((card, idx) => (
            <button
              key={idx}
              onClick={() => onPromptSelect?.(card.prompt)}
              className="flex flex-col items-start text-left p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:bg-stone-50 dark:hover:bg-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 shadow-xs hover:shadow-sm group cursor-pointer"
            >
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-black dark:group-hover:text-white transition-colors">{card.title}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400 mt-1">{card.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 max-w-3xl mx-auto px-2">
      {messages.map((m, i) => (
        <MessageItem key={i} message={m} isStreaming={!!isLoading && i === messages.length - 1} onImageClick={onImageClick} />
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
