import React, { useState, useEffect } from "react";
import { Sparkles, Download, Maximize2, RefreshCw, AlertCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface GeminiImageGeneratorCardProps {
  prompt: string;
  status: "generating" | "completed" | "failed";
  imageUrl?: string;
  errorMessage?: string;
  onImageClick?: (url: string) => void;
  onRetry?: () => void;
}

const PROGRESS_MESSAGES = [
  "✨ Görsel konsepti analiz ediliyor...",
  "🎨 Yapay zeka pikselleri ve ışıkları işliyor...",
  "🔮 StableHorde & Flux AI derinlik katmanları render ediliyor...",
  "🌟 Detaylar ve kompozisyon tamamlanıyor...",
];

export const GeminiImageGeneratorCard: React.FC<GeminiImageGeneratorCardProps> = ({
  prompt,
  status,
  imageUrl,
  errorMessage,
  onImageClick,
  onRetry,
}) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (status !== "generating") return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [status]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `mini-ai-generated-${Date.now()}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Görsel indirme başlatıldı");
  };

  return (
    <div className="gemini-image-card">
      {/* Üst Kısım Tasarımı */}
      <div className="gemini-header">
        <div className="gemini-sparkle-box">
          <Sparkles className="sparkle-icon" />
        </div>
        <div className="gemini-prompt-details">
          <span className="gemini-status-tag">
            {status === "generating"
              ? "YAPAY ZEKA GÖRSEL OLUŞTURUYOR"
              : status === "completed"
              ? "YAPAY ZEKA GÖRSELİ HAZIRLANDI"
              : "GÖRSEL OLUŞTURULAMADI"}
          </span>
          <p className="gemini-prompt-text">"{prompt}"</p>
        </div>
      </div>

      {/* Fotoğraf Alanı / Animasyonlu İskelet */}
      <div className="gemini-canvas-container">
        {/* Ortam Işıkları (Premium Derinlik Efekti) */}
        <div className="glow-ambient glow-purple" />
        <div className="glow-ambient glow-blue" />

        {status === "generating" && (
          <div className="gemini-skeleton-wrapper">
            {/* Soldan Sağa Akan Parlama Dalgası */}
            <div className="shimmer-wave" />

            {/* Merkez İkon ve Dalgalanma Halkaları */}
            <div className="center-loading-node">
              <div className="pulse-ring" />
              <div className="inner-icon-box">
                <ImageIcon className="image-placeholder-icon" />
              </div>
            </div>

            {/* İlerleme Çubuğu Bölümü */}
            <div className="gemini-progress-group">
              <span className="gemini-progress-message">{PROGRESS_MESSAGES[msgIdx]}</span>
              <div className="gemini-progress-bar-track">
                <div className="gemini-progress-bar-fill" />
              </div>
            </div>
          </div>
        )}

        {status === "completed" && imageUrl && (
          <div
            className="relative w-full h-full group cursor-pointer overflow-hidden rounded-xl"
            onClick={() => onImageClick?.(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover Butonları */}
            <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick?.(imageUrl);
                }}
                className="p-2.5 rounded-full bg-stone-900/90 text-white hover:bg-stone-800 shadow-lg border border-stone-700 transition active:scale-95"
                title="Büyüt / İncele"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 shadow-lg transition active:scale-95"
                title="İndir"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-xs text-stone-400 max-w-xs">
              {errorMessage || "Görsel servisine bağlanırken bir sorun oluştu. Lütfen tekrar deneyin."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tekrar Dene
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
