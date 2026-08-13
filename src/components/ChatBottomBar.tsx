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

  const modelMap: Record<string, string> = {
    "Mini AI Hızlı": "sambanova",
    "Uzman Kodlayıcı": "qwen-coder",
    "Grok 2": "grok"
  };

  const handleModelSelect = (selectedName: string) => {
    const mapped = modelMap[selectedName] || "sambanova";
    setModel(mapped);
  };

  const handlePromptSubmit = (value: string, meta: { model: string; effort: string; attachments: File[] }) => {
    if (meta.model) handleModelSelect(meta.model);
    if (!busy) {
      send();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 pb-3 pt-1 space-y-2">
      {/* Pending attachments info */}
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

      {/* Top Bar Controls: Attachment Popover (+) */}
      <div className="flex items-center justify-end px-1">
        <Popover open={attachOpen} onOpenChange={setAttachOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="h-8 px-3 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer" title="Ekle">
              <Plus className="w-3.5 h-3.5" />
              <span>Ekle / Medya</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-52 p-1 rounded-2xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl">
            <button type="button" onClick={() => { setAttachOpen(false); cameraInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
              <Camera className="w-4 h-4 text-stone-500" /> Kamerayla çek
            </button>
            <button type="button" onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
              <ImageIcon className="w-4 h-4 text-stone-500" /> Görsel yükle
            </button>
            <button type="button" onClick={() => { setAttachOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
              <Paperclip className="w-4 h-4 text-stone-500" /> Dosya ekle
            </button>
            {hasCode && (
              <button type="button" onClick={() => { setAttachOpen(false); send({ fix: true }); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-sm text-stone-700 dark:text-stone-200">
                <Wand2 className="w-4 h-4 text-stone-500" /> Kodu düzelt
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Integrated Interactive PromptInput Component */}
      <PromptInput
        value={input}
        onChange={setInput}
        onSubmit={handlePromptSubmit}
        onModelChange={handleModelSelect}
        onToggleMic={toggleMic}
        busy={busy}
        placeholder="Mesaj yazın veya konuşmak için dokunun..."
        models={["Mini AI Hızlı", "Uzman Kodlayıcı", "Grok 2"]}
        efforts={["Low", "Medium", "Max Effort"]}
      />
    </div>
  );
}
