import React from "react";
import { X, Share2, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

export type ImagePreviewModalProps = {
  imageUrl: string | null;
  onClose: () => void;
};

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = `miniai_generated_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Görsel kaydediliyor...");
    } catch {
      toast.error("Görsel indirilemedi");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success("Görsel bağlantısı kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mini AI Görseli",
          url: imageUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-4 animate-fade-in select-none">
      {/* Top Bar: Close Button */}
      <div className="w-full flex items-center justify-start pt-2 px-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-neutral-800/90 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-white transition-all shadow-lg"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image */}
      <div className="flex-1 w-full max-w-2xl flex items-center justify-center p-2 my-auto overflow-hidden">
        <img
          src={imageUrl}
          alt="Görsel Önizleme"
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform"
        />
      </div>

      {/* Bottom Action Bar: Paylaş, Kopyala, Kaydet */}
      <div className="w-full flex items-center justify-center pb-6">
        <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800/80 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-lg">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-medium transition-all"
          >
            <Share2 className="w-4 h-4 text-neutral-300" />
            <span>Paylaş</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-300" />}
            <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-medium transition-all"
          >
            <Download className="w-4 h-4 text-neutral-300" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
