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
    <div className="p-3 bg-transparent space-y-2">
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pendingAttachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1 text-xs bg-stone-100 border border-stone-200 rounded-full px-2.5 py-1 text-stone-700">
              {a.kind === "image" ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              <span className="max-w-[120px] truncate">{a.name}</span>
              <button onClick={() => setPendingAttachments(p => p.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-stone-400 hover:text-rose-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative rounded-[28px] border border-stone-200 bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.10)] focus-within:border-stone-400 transition-all">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Mini AI anything..."
          className="min-h-[64px] max-h-[200px] resize-none bg-transparent border-0 text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-5 pt-4 pb-14 text-[15px]"
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!busy) send(); } }}
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Popover open={attachOpen} onOpenChange={setAttachOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700" title="Ekle">
                  <Plus className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-56 p-1 rounded-2xl">
                <button onClick={() => { setAttachOpen(false); cameraInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-left text-sm">
                  <Camera className="w-4 h-4 text-stone-600" /> Kamerayla çek
                </button>
                <button onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-left text-sm">
                  <ImageIcon className="w-4 h-4 text-stone-600" /> Galeriden görsel
                </button>
                <button onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-left text-sm">
                  <Paperclip className="w-4 h-4 text-stone-600" /> Dosya ekle
                </button>
                {hasCode && (
                  <button onClick={() => { setAttachOpen(false); send({ fix: true }); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 text-left text-sm">
                    <Wand2 className="w-4 h-4 text-stone-600" /> Kodu düzelt
                  </button>
                )}
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              disabled={!input.trim()}
              className="h-10 px-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-850 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Görsel Üret"
              onClick={() => {
                if (input.trim()) send({ forceImage: true });
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Üret</span>
            </Button>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-10 rounded-full border-0 bg-transparent text-xs text-stone-500 hover:text-stone-700 focus:ring-0 gap-1 px-2 w-auto shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {MODEL_OPTIONS.map(o => (
                  <SelectItem key={o.v} value={o.v} className="rounded-xl text-sm">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
          <div className="flex items-center gap-1">
            {busy ? (
              <button
                onClick={() => setBusy(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: "#7c3520" }}
                aria-label="Durdur"
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-white" />
              </button>
            ) : (
              (input.trim() || pendingAttachments.length > 0) ? (
                <button
                  onClick={() => send()}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: "#7c3520" }}
                  aria-label="Gönder"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={toggleMic}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: "#7c3520" }}
                  aria-label="Sesle gir"
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
