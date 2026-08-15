import React from "react";
import {
  Plus, Camera, ImageIcon, Paperclip, Wand2, FileText, X
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PromptInput } from "@/components/ui/ai-chat-input";
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
  send: (opts?: { fix?: boolean; forceImage?: boolean; effort?: string }) => void;
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

  const modelMap: Record<string, string> = {
    "Mini AI Hızlı": "fast",
    "Mini AI Pro": "pro",
  };

  const handleModelSelect = (selectedName: string) => {
    const chosen = modelMap[selectedName] || "fast";
    setModel(chosen);
    if (chosen === "pro") {
      toast.success("🚀 Mini AI Pro (LLM7.io Yüksek Kapasiteli Kodlama Motoru) aktif edildi.");
    }
  };

  const handlePromptSubmit = (_value: string, meta: { model: string; effort: string; attachments: File[] }) => {
    if (meta.model) handleModelSelect(meta.model);
    if (!busy) send({ effort: meta.effort });
  };

  const attachPopover = (
    <Popover open={attachOpen} onOpenChange={setAttachOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-200 hover:bg-stone-100 dark:hover:bg-stone-800 outline-none cursor-pointer"
          title="Medya / Dosya Ekle"
        >
          <Plus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-52 p-1 rounded-2xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl z-[60]">
        <button type="button" onClick={() => { setAttachOpen(false); cameraInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
          <Camera className="w-4 h-4 text-stone-500" /> Kamerayla çek
        </button>
        <button type="button" onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
          <ImageIcon className="w-4 h-4 text-stone-500" /> Görsel yükle
        </button>
        <button type="button" onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
          <Paperclip className="w-4 h-4 text-stone-500" /> Dosya ekle
        </button>
        {hasCode && (
          <button type="button" onClick={() => { setAttachOpen(false); send({ fix: true }); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
            <Wand2 className="w-4 h-4 text-stone-500" /> Kodu düzelt
          </button>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="shrink-0 w-full max-w-4xl mx-auto px-2.5 sm:px-4 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] space-y-1.5 z-20">
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {pendingAttachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1 text-stone-700 dark:text-stone-200">
              {a.kind === "image" ? <ImageIcon className="w-3 h-3 text-stone-500" /> : <FileText className="w-3 h-3 text-stone-500" />}
              <span className="max-w-[120px] truncate">{a.name}</span>
              <button type="button" onClick={() => setPendingAttachments(p => p.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInput
        value={input}
        onChange={setInput}
        onSubmit={handlePromptSubmit}
        onModelChange={handleModelSelect}
        onToggleMic={toggleMic}
        attachPopoverNode={attachPopover}
        busy={busy}
        placeholder="Mesaj yazın veya konuşmak için dokunun..."
        models={["Mini AI Hızlı", "Mini AI Pro"]}
        efforts={["Low", "Medium", "Max Effort"]}
      />
    </div>
  );
}
