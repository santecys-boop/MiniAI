import React from "react";
import {
  Plus, Camera, ImageIcon, Paperclip, Wand2, Sparkles, Send, Mic, FileText, X, Atom
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Attachment } from "../types";

export type ChatBottomBarProps = {
  input: string;
  setInput: (v: string) => void;
  pendingAttachments: Attachment[];
  setPendingAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  model: string;
  setModel: (v: string) => void;
  hasCode: boolean;
  send: (opts?: { fix?: boolean; forceImage?: boolean }) => void;
  toggleMic: () => void;
  attachOpen: boolean;
  setAttachOpen: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  openPricing: () => void;
  thinkMode: boolean;
  setThinkMode: (v: boolean) => void;
};

export function ChatBottomBar({
  input, setInput, pendingAttachments, setPendingAttachments, busy, setBusy,
  model, setModel, hasCode, send, toggleMic, attachOpen, setAttachOpen,
  fileInputRef, imageInputRef, cameraInputRef, openPricing,
  thinkMode, setThinkMode
}: ChatBottomBarProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-3 pb-3 pt-1 space-y-2">
      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {pendingAttachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-stone-700 dark:text-stone-200">
              {a.kind === "image" ? <ImageIcon className="w-3 h-3 text-stone-500" /> : <FileText className="w-3 h-3 text-stone-500" />}
              <span className="max-w-[120px] truncate">{a.name}</span>
              <button onClick={() => setPendingAttachments(p => p.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input pill (Screenshot 1 & 3: rounded pill with placeholder) */}
      <div className="relative rounded-[24px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_1px_8px_rgba(0,0,0,0.04)] focus-within:border-stone-300 dark:focus-within:border-stone-600 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mesaj yazın veya konuşmak için basılı tutun"
          className="min-h-[52px] max-h-[160px] resize-none bg-transparent border-0 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-5 pt-3.5 pb-11 text-[15px] leading-relaxed"
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && (input.trim() || pendingAttachments.length > 0)) send();
            }
          }}
        />

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
          {/* Left side buttons (Screenshot 1 & 3: Düşün button, NO Ara button) */}
          <div className="flex items-center gap-1">
            {/* Düşün button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setThinkMode(!thinkMode); }}
              className={`h-8 px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
                thinkMode 
                  ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 shadow-sm" 
                  : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Düşün</span>
            </button>
          </div>

          {/* Right side buttons (Screenshot 1 & 3: +, voice/send) */}
          <div className="flex items-center gap-1">
            {/* Attach (+) button */}
            <Popover open={attachOpen} onOpenChange={setAttachOpen}>
              <PopoverTrigger asChild>
                <button className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors" title="Ekle">
                  <Plus className="w-[18px] h-[18px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-52 p-1 rounded-2xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl">
                <button onClick={() => { setAttachOpen(false); cameraInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
                  <Camera className="w-4 h-4 text-stone-500" /> Kamerayla çek
                </button>
                <button onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
                  <ImageIcon className="w-4 h-4 text-stone-500" /> Görsel yükle
                </button>
                <button onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
                  <Paperclip className="w-4 h-4 text-stone-500" /> Dosya ekle
                </button>
                {hasCode && (
                  <button onClick={() => { setAttachOpen(false); send({ fix: true }); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
                    <Wand2 className="w-4 h-4 text-stone-500" /> Kodu düzelt
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Send / Stop / Voice button */}
            {busy ? (
              <button
                onClick={() => setBusy(false)}
                className="w-8 h-8 rounded-full bg-stone-800 dark:bg-stone-200 flex items-center justify-center transition-transform active:scale-95"
                title="Durdur"
              >
                <div className="w-2.5 h-2.5 rounded-sm bg-white dark:bg-stone-800" />
              </button>
            ) : (input.trim() || pendingAttachments.length > 0) ? (
              <button
                onClick={() => send()}
                className="w-8 h-8 rounded-full bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-800 hover:bg-stone-700 dark:hover:bg-stone-100 flex items-center justify-center transition-all active:scale-95"
                title="Gönder"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={toggleMic}
                className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors"
                title="Sesle Konuş"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
