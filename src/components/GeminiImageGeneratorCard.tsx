import React, { useState } from "react";
import { Loader2, Download, Maximize2, RefreshCw, AlertCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface GeminiImageGeneratorCardProps {
  prompt?: string;
  status: "generating" | "completed" | "failed";
  imageUrl?: string;
  errorMessage?: string;
  onImageClick?: (url: string) => void;
  onRetry?: () => void;
}

export const GeminiImageGeneratorCard: React.FC<GeminiImageGeneratorCardProps> = ({
  prompt = "Görsel",
  status,
  imageUrl,
  errorMessage,
  onImageClick,
  onRetry,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `miniai-${Date.now()}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Görsel indiriliyor...");
  };

  return (
    <div className="my-2 max-w-sm sm:max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-sm transition-all">
      {/* 1. YÜKLENİYOR / BEYAZ KARE DURUMU */}
      {status === "generating" && (
        <div className="aspect-square w-full rounded-xl bg-stone-100/90 dark:bg-stone-800/60 animate-pulse border border-stone-200/70 dark:border-stone-700/60 flex flex-col items-center justify-center gap-3 text-stone-500 dark:text-stone-400 select-none">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-stone-700/70 border border-stone-200/80 dark:border-stone-600/60 flex items-center justify-center shadow-xs">
            <Loader2 className="w-5 h-5 text-stone-600 dark:text-stone-300 animate-spin" />
          </div>
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
            Görsel oluşturuluyor...
          </span>
        </div>
      )}

      {/* 2. TAMAMLANDI / FOTOĞRAF DURUMU */}
      {status === "completed" && imageUrl && (
        <div className="relative aspect-square w-full rounded-xl overflow-hidden group cursor-pointer bg-stone-100 dark:bg-stone-800">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={prompt}
            onLoad={() => setImgLoaded(true)}
            onClick={() => onImageClick?.(imageUrl)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Hover / İncele ve İndir Butonları */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick?.(imageUrl);
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow-sm"
              title="Büyüt"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow-sm"
              title="İndir"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. HATA DURUMU */}
      {status === "failed" && (
        <div className="aspect-square w-full rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-center p-4 text-center gap-2">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-xs text-rose-700 dark:text-rose-300">
            {errorMessage || "Görsel yüklenemedi."}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 px-3 py-1 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-medium shadow-xs flex items-center gap-1 hover:bg-stone-50"
            >
              <RefreshCw className="w-3 h-3" /> Tekrar Dene
            </button>
          )}
        </div>
      )}
    </div>
  );
};
