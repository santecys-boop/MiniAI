import React from "react";
import { Sparkle } from "lucide-react";
import { Msg } from "../types";
import { MessageItem } from "./MessageItem";
import { TetrisLoader } from "@/components/ui/loader-tetris";

export type MessageListProps = {
  messages: Msg[];
  isLoading?: boolean;
  welcomeText: string;
  welcomeDone?: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onImageClick?: (url: string) => void;
  onVideoClick?: (url: string) => void;
};

export function MessageList({ messages, isLoading, welcomeText, welcomeDone, chatEndRef, onImageClick, onVideoClick }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 select-none animate-in fade-in duration-300">
        {/* Mini AI Logo — Sağ tık ve sürükleme korumalı */}
        <div 
          className="mb-4 relative group cursor-default"
          onContextMenu={(e) => { e.preventDefault(); return false; }}
          onDragStart={(e) => { e.preventDefault(); return false; }}
        >
          <img
            src="/mini-logo.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/8DHM6Tpy/1786875359182.png"; }}
            alt="Mini AI Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-3xl drop-shadow-2xl select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
            draggable={false}
            onContextMenu={(e) => { e.preventDefault(); return false; }}
          />
        </div>

        <h2 translate="no" className="notranslate text-[22px] font-semibold text-stone-900 dark:text-stone-100 text-center tracking-tight">
          {welcomeText}
          {!welcomeDone && (
            <span className="inline-block w-[2px] h-[1.1em] bg-stone-900 dark:bg-stone-100 ml-0.5 align-middle animate-pulse" />
          )}
        </h2>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <MessageItem key={i} message={m} isStreaming={!!isLoading && i === messages.length - 1} onImageClick={onImageClick} />
      ))}
      
      {/* AI Canlı Üretim & Tetris Loader Alanı (Her işlemde aktif) */}
      {isLoading && (
        <div className="flex gap-3.5 md:gap-4 animate-fade-in my-5 w-full text-stone-800 dark:text-stone-100">
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

          <div className="flex-1 space-y-3 min-w-0">
            <div className="bg-stone-900/95 text-stone-100 flex items-center gap-4 rounded-2xl border border-stone-800 p-4 shadow-xl animate-fade-in">
              <TetrisLoader
                columns={8}
                rows={14}
                cellSize={3.5}
                gap={1.5}
                speed={40}
                playing={true}
                label="Mini AI hazırlanıyor"
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkle className="w-4 h-4 animate-spin text-emerald-400" />
                  Mini AI hazırlıyor...
                </p>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Yapay zeka yanıtınızı ve projenizi derlerken Tetris oynamasını izleyebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
