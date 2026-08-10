import React from "react";
import {
  Plus, Camera, ImageIcon, Paperclip, Wand2, Sparkles, Send, Mic, FileText, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Attachment } from "../types";
import { MODEL_OPTIONS } from "../constants";

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
};

export function ChatBottomBar({
  input, setInput, pendingAttachments, setPendingAttachments, busy, setBusy,
  model, setModel, hasCode, send, toggleMic, attachOpen, setAttachOpen,
  fileInputRef, imageInputRef, cameraInputRef, openPricing
}: ChatBottomBarProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-3 pb-3 pt-1 space-y-2">
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2">
          {pendingAttachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-stone-800 dark:text-stone-200 shadow-xs">
              {a.kind === "image" ? <ImageIcon className="w-3.5 h-3.5 text-stone-500" /> : <FileText className="w-3.5 h-3.5 text-stone-500" />}
              <span className="max-w-[130px] truncate font-medium">{a.name}</span>
              <button onClick={() => setPendingAttachments(p => p.filter((_, j) => j !== i))} className="hover:opacity-75">
                <X className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative rounded-[26px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)] focus-within:border-stone-400 dark:focus-within:border-stone-600 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Mini AI'a bir soru sorun..."
          className="min-h-[56px] max-h-[180px] resize-none bg-transparent border-0 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-5 pt-3.5 pb-12 text-[15px] leading-relaxed"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!busy && (input.trim() || pendingAttachments.length > 0)) send(); } }}
        />

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Popover open={attachOpen} onOpenChange={setAttachOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors" title="Ekle">
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-56 p-1 rounded-2xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl">
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

            <button
              disabled={!input.trim()}
              onClick={() => { if (input.trim()) send({ forceImage: true }); }}
              className="h-8 px-3 rounded-full text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Görsel Üret</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {busy ? (
              <button
                onClick={() => setBusy(false)}
                className="w-8 h-8 rounded-full bg-stone-900 dark:bg-white flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                title="Durdur"
              >
                <div className="w-2.5 h-2.5 rounded-xs bg-white dark:bg-stone-900" />
              </button>
            ) : (
              (input.trim() || pendingAttachments.length > 0) ? (
                <button
                  onClick={() => send()}
                  className="w-8 h-8 rounded-full bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center transition-all active:scale-95 shadow-xs"
                  title="Gönder"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={toggleMic}
                  className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-colors"
                  title="Sesle Konuş"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-center text-stone-400 dark:text-stone-500 select-none">
        Mini AI hata yapabilir. Önemli bilgileri kontrol edin.
      </p>
    </div>
  );
}
